import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOfficeSchema, 
  insertPersonSchema, 
  insertKarteSchema, 
  insertWorklogSchema,
  insertSubsidyProgramSchema,
  insertOfficeSubsidyRecordSchema,
  insertCompanySchema,
  insertBankAccountSchema,
  insertCompanySettingsSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
} from "@shared/schema";
import { sendEmail } from "./gmail";
import * as cheerio from "cheerio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const { themeColor } = req.body;
      const validThemes = ["blue", "pink", "aqua", "mint", "purple", "orange", "beige"];
      if (!validThemes.includes(themeColor)) {
        return res.status(400).json({ message: "Invalid theme color" });
      }
      const user = await storage.updateUserTheme(userId, themeColor);
      res.json(user);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  app.put('/api/user/dashboard-layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const { layout } = req.body;
      if (!Array.isArray(layout)) {
        return res.status(400).json({ message: "Invalid layout format" });
      }
      const validWidgets = ["stats", "activity", "quickActions", "reminders", "health"];
      const isValid = layout.every((id: string) => validWidgets.includes(id));
      if (!isValid) {
        return res.status(400).json({ message: "Invalid widget ID in layout" });
      }
      const user = await storage.updateUserDashboardLayout(userId, layout);
      res.json(user);
    } catch (error) {
      console.error("Error updating dashboard layout:", error);
      res.status(500).json({ message: "Failed to update dashboard layout" });
    }
  });

  // Office routes
  app.get('/api/offices', isAuthenticated, async (req, res) => {
    try {
      const { code, name, representative } = req.query;
      const offices = await storage.searchOffices({
        code: code as string,
        name: name as string,
        representative: representative as string,
      });
      res.json(offices);
    } catch (error) {
      console.error("Error searching offices:", error);
      res.status(500).json({ message: "Failed to search offices" });
    }
  });

  app.get('/api/offices/:id', isAuthenticated, async (req, res) => {
    try {
      const office = await storage.getOffice(req.params.id);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      res.json(office);
    } catch (error) {
      console.error("Error fetching office:", error);
      res.status(500).json({ message: "Failed to fetch office" });
    }
  });

  app.post('/api/offices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSchema.parse(req.body);
      const office = await storage.createOffice({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(office);
    } catch (error) {
      console.error("Error creating office:", error);
      res.status(400).json({ message: "Failed to create office" });
    }
  });

  app.patch('/api/offices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSchema.partial().parse(req.body);
      const office = await storage.updateOffice(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(office);
    } catch (error) {
      console.error("Error updating office:", error);
      res.status(400).json({ message: "Failed to update office" });
    }
  });

  app.delete('/api/offices/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteOffice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting office:", error);
      res.status(500).json({ message: "Failed to delete office" });
    }
  });

  // Helper: validate a URL for SSRF safety (protocol, hostname blocklist, DNS resolution)
  async function assertSafeUrl(rawUrl: string): Promise<void> {
    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch {
      throw Object.assign(new Error("URLの形式が正しくありません"), { status: 400 });
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw Object.assign(new Error("http/httpsのURLのみ対応しています"), { status: 400 });
    }
    const { hostname } = parsed;
    if (/^(localhost|local|.+\.local|.+\.internal)$/i.test(hostname)) {
      throw Object.assign(new Error("このURLへのアクセスは許可されていません"), { status: 400 });
    }
    // Block literal IP forms: IPv4 private/loopback/link-local; IPv6 loopback/link-local/ULA
    const PRIVATE_IP = /^(127\.|0\.0\.0\.|10\.|192\.168\.|169\.254\.)|^172\.(1[6-9]|2\d|3[01])\.|^(::1|::ffff:127\.|fe[89ab][0-9a-f]:|fc|fd)/i;
    if (PRIVATE_IP.test(hostname)) {
      throw Object.assign(new Error("このURLへのアクセスは許可されていません"), { status: 400 });
    }
    // DNS-resolve and check all returned addresses
    try {
      const dns = await import('dns/promises');
      const addrs = await dns.resolve(hostname).catch(() => [] as string[]);
      for (const addr of addrs) {
        if (PRIVATE_IP.test(addr)) {
          throw Object.assign(new Error("このURLへのアクセスは許可されていません"), { status: 400 });
        }
      }
    } catch (e: any) {
      if (e?.status) throw e; // Re-throw our own blocked errors
      // DNS lookup failure → treat as unknown host, allow (external infra may block)
    }
  }

  // Helper: fetch with manual per-hop redirect validation (prevents SSRF via open redirects)
  async function safeFetch(startUrl: string, signal: AbortSignal): Promise<Response> {
    let currentUrl = startUrl;
    const MAX_REDIRECTS = 5;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertSafeUrl(currentUrl);
      const res = await fetch(currentUrl, {
        signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CRM-Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) return res; // No Location header, return as-is
        currentUrl = new URL(location, currentUrl).href;
        continue;
      }
      return res;
    }
    throw Object.assign(new Error("リダイレクトが多すぎます"), { status: 400 });
  }

  // Office URL scraping endpoint
  app.post('/api/offices/scrape-url', isAuthenticated, async (req: any, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: "URLを指定してください" });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Initial URL validation (subsequent hops validated inside safeFetch)
    try {
      await assertSafeUrl(targetUrl);
    } catch (e: any) {
      return res.status(e.status || 400).json({ message: e.message });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await safeFetch(targetUrl, controller.signal);
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(400).json({ message: `サイトへのアクセスに失敗しました (HTTP ${response.status})` });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const result: Record<string, string | Array<{ majorCode: string; middleCode: string; confidence: number }>> = {};

      // Company name from og:title, title, or h1
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const h1Text = $('h1').first().text().trim();
      const titleText = $('title').text().trim();
      const name = (ogTitle || h1Text || titleText.split(/[|｜\-–—]/)[0].trim() || "").trim();
      if (name) result.name = name;

      // Meta description → 概要フィールド
      const metaDesc = $('meta[name="description"]').attr('content')
        || $('meta[property="og:description"]').attr('content')
        || '';
      if (metaDesc.trim()) result.description = metaDesc.trim().slice(0, 500);

      // Address: look for postal codes and address patterns
      const bodyText = $('body').text();
      const postalMatch = bodyText.match(/〒?\s*(\d{3}[-－]\d{4})/);
      if (postalMatch) {
        result.postalCode = postalMatch[1].replace(/[－]/g, '-');
      }

      // Try to find address in common selectors
      const addressSelectors = ['[class*="address"]', '[id*="address"]', '[class*="addr"]', 'address'];
      for (const sel of addressSelectors) {
        const text = $(sel).first().text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 5 && text.length < 200) {
          result.address = text;
          break;
        }
      }

      // Phone numbers: look for tel: links or phone patterns
      const telLinks = $('a[href^="tel:"]');
      const phoneNumbers: string[] = [];
      telLinks.each((_, el) => {
        const tel = $(el).attr('href')?.replace('tel:', '').trim();
        if (tel && !phoneNumbers.includes(tel)) phoneNumbers.push(tel);
      });
      if (phoneNumbers.length === 0) {
        const phonePatterns = bodyText.match(/0\d{1,4}[-－()\s]\d{1,4}[-－()\s]\d{4}/g);
        if (phonePatterns) {
          phonePatterns.forEach((p) => {
            const cleaned = p.trim();
            if (!phoneNumbers.includes(cleaned)) phoneNumbers.push(cleaned);
          });
        }
      }
      if (phoneNumbers[0]) result.phone1 = phoneNumbers[0];
      if (phoneNumbers[1]) result.phone2 = phoneNumbers[1];

      // FAX
      const faxMatch = bodyText.match(/FAX[：:\s]*(0\d{1,4}[-－()\s]\d{1,4}[-－()\s]\d{4})/i);
      if (faxMatch) result.fax = faxMatch[1].trim();

      // Email
      const emailLinks = $('a[href^="mailto:"]');
      if (emailLinks.length > 0) {
        const email = emailLinks.first().attr('href')?.replace('mailto:', '').split('?')[0].trim() || '';
        if (email) result.email1 = email;
      } else {
        const emailMatch = bodyText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
        if (emailMatch) result.email1 = emailMatch[0];
      }

      // Industry classification: major + middle code suggestions
      const searchText = [metaDesc, bodyText.slice(0, 5000)].join(' ');

      // Keywords mapped to [majorCode, middleCode] with weight
      type KwEntry = { major: string; middle: string; keywords: string[] };
      const JSIC_KEYWORDS: KwEntry[] = [
        // A農業
        { major: "A", middle: "01", keywords: ["農業", "農園", "農場", "耕種農業", "畜産農業"] },
        { major: "A", middle: "02", keywords: ["林業", "製材", "育林"] },
        // B漁業
        { major: "B", middle: "03", keywords: ["漁業", "漁船", "水産"] },
        { major: "B", middle: "04", keywords: ["養殖", "水産養殖"] },
        // D建設業
        { major: "D", middle: "06", keywords: ["総合工事", "建設会社", "ゼネコン", "建築工事業", "土木工事業", "リフォーム"] },
        { major: "D", middle: "07", keywords: ["大工", "とび工事", "左官", "塗装工事", "内装工事", "板金工事"] },
        { major: "D", middle: "08", keywords: ["電気工事", "管工事", "設備工事", "空調工事", "配管工事"] },
        // E製造業
        { major: "E", middle: "09", keywords: ["食料品製造", "食品加工", "食品メーカー", "パン製造", "菓子製造", "水産食料品"] },
        { major: "E", middle: "10", keywords: ["飲料製造", "酒造", "ビール製造", "清涼飲料", "飼料製造"] },
        { major: "E", middle: "11", keywords: ["繊維工業", "紡績", "織物", "ニット", "衣服製造", "繊維メーカー"] },
        { major: "E", middle: "12", keywords: ["木材製造", "製材業", "合板", "木製品"] },
        { major: "E", middle: "13", keywords: ["家具製造", "建具製造", "装備品製造"] },
        { major: "E", middle: "14", keywords: ["紙製造", "パルプ", "段ボール製造"] },
        { major: "E", middle: "15", keywords: ["印刷業", "製版", "製本", "印刷会社"] },
        { major: "E", middle: "16", keywords: ["化学工業", "化学製品", "医薬品製造", "化粧品製造", "塗料製造"] },
        { major: "E", middle: "17", keywords: ["石油製品", "石炭製品", "石油精製"] },
        { major: "E", middle: "18", keywords: ["プラスチック製造", "樹脂製造", "プラ加工"] },
        { major: "E", middle: "19", keywords: ["ゴム製品", "タイヤ製造"] },
        { major: "E", middle: "21", keywords: ["窯業", "ガラス製造", "セメント製造", "陶磁器", "タイル製造"] },
        { major: "E", middle: "22", keywords: ["鉄鋼業", "製鉄", "製鋼"] },
        { major: "E", middle: "23", keywords: ["非鉄金属", "電線製造", "アルミ加工", "銅加工"] },
        { major: "E", middle: "24", keywords: ["金属製品製造", "板金加工", "メッキ", "ボルト製造", "金属加工"] },
        { major: "E", middle: "25", keywords: ["はん用機械", "ポンプ製造", "ボイラ製造", "圧縮機"] },
        { major: "E", middle: "26", keywords: ["生産用機械", "工作機械", "農業機械", "建設機械製造"] },
        { major: "E", middle: "27", keywords: ["業務用機械", "医療機器", "光学機器", "計測機器"] },
        { major: "E", middle: "28", keywords: ["電子部品", "半導体", "電子デバイス", "電子回路"] },
        { major: "E", middle: "29", keywords: ["電気機械器具", "発電機製造", "変圧器", "電池製造"] },
        { major: "E", middle: "30", keywords: ["情報通信機械", "コンピュータ製造", "通信機器製造"] },
        { major: "E", middle: "31", keywords: ["自動車製造", "輸送機械", "船舶製造", "鉄道車両", "航空機製造"] },
        { major: "E", middle: "32", keywords: ["玩具製造", "楽器製造", "時計製造", "貴金属製造", "その他製造"] },
        // F電気・ガス
        { major: "F", middle: "33", keywords: ["電力会社", "発電", "送電", "配電"] },
        { major: "F", middle: "34", keywords: ["ガス会社", "都市ガス", "ガス供給"] },
        { major: "F", middle: "36", keywords: ["水道", "上水道", "下水道"] },
        // G情報通信
        { major: "G", middle: "39", keywords: ["ソフトウェア開発", "システム開発", "情報サービス", "ITサービス", "DX", "AI開発", "受託開発"] },
        { major: "G", middle: "40", keywords: ["インターネットサービス", "Webサービス", "EC", "eコマース", "オンラインサービス"] },
        { major: "G", middle: "37", keywords: ["通信会社", "電話会社", "携帯通信", "固定電話"] },
        { major: "G", middle: "38", keywords: ["放送局", "テレビ", "ラジオ", "有線放送"] },
        { major: "G", middle: "41", keywords: ["映像制作", "動画制作", "音声制作", "出版社", "新聞社"] },
        // H運輸
        { major: "H", middle: "44", keywords: ["運送業", "貨物運送", "トラック", "引越", "配送業"] },
        { major: "H", middle: "43", keywords: ["バス会社", "タクシー", "旅客運送"] },
        { major: "H", middle: "47", keywords: ["倉庫業", "物流センター", "冷蔵倉庫"] },
        { major: "H", middle: "48", keywords: ["物流会社", "港湾運送", "こん包", "フォワーダー", "通関"] },
        // I卸売・小売
        { major: "I", middle: "52", keywords: ["食料品卸売", "飲食料品卸売", "農産物卸"] },
        { major: "I", middle: "53", keywords: ["建材卸売", "鉄鋼卸売", "金属卸売", "化学品卸売"] },
        { major: "I", middle: "54", keywords: ["機械卸売", "自動車卸売", "電気機器卸売"] },
        { major: "I", middle: "55", keywords: ["医薬品卸", "紙卸", "その他卸売"] },
        { major: "I", middle: "58", keywords: ["スーパー", "食料品小売", "食品スーパー"] },
        { major: "I", middle: "59", keywords: ["自動車販売", "電気機器小売", "家電量販"] },
        { major: "I", middle: "61", keywords: ["通信販売", "ネット販売", "オンラインショップ", "EC事業"] },
        // J金融・保険
        { major: "J", middle: "62", keywords: ["銀行", "普通銀行"] },
        { major: "J", middle: "64", keywords: ["貸金業", "クレジット", "ファイナンス", "消費者金融"] },
        { major: "J", middle: "67", keywords: ["保険会社", "損害保険", "生命保険", "共済"] },
        // K不動産
        { major: "K", middle: "68", keywords: ["不動産会社", "不動産売買", "不動産仲介", "土地売買"] },
        { major: "K", middle: "69", keywords: ["賃貸管理", "不動産管理", "マンション管理", "貸家業", "駐車場"] },
        { major: "K", middle: "70", keywords: ["物品賃貸", "リース", "レンタル"] },
        // L学術・専門
        { major: "L", middle: "72", keywords: ["税理士", "公認会計士", "弁護士", "司法書士", "社労士", "行政書士", "中小企業診断士", "コンサルタント", "コンサルティング", "経営支援"] },
        { major: "L", middle: "73", keywords: ["広告代理店", "広告会社", "PR会社", "マーケティング"] },
        { major: "L", middle: "74", keywords: ["設計事務所", "建築設計", "土木設計", "測量", "機械設計", "写真スタジオ"] },
        { major: "L", middle: "71", keywords: ["研究所", "研究機関", "R&D", "研究開発"] },
        // M宿泊・飲食
        { major: "M", middle: "75", keywords: ["ホテル", "旅館", "民宿", "宿泊施設", "ゲストハウス"] },
        { major: "M", middle: "76", keywords: ["レストラン", "食堂", "居酒屋", "カフェ", "喫茶店", "料理店", "焼肉", "寿司"] },
        { major: "M", middle: "77", keywords: ["テイクアウト", "デリバリー", "宅配", "弁当屋"] },
        // N生活関連
        { major: "N", middle: "78", keywords: ["美容院", "美容室", "理容院", "クリーニング店", "銭湯", "浴場"] },
        { major: "N", middle: "79", keywords: ["旅行代理店", "冠婚葬祭", "葬儀", "ブライダル", "旅行業"] },
        { major: "N", middle: "80", keywords: ["娯楽施設", "ゲームセンター", "スポーツクラブ", "フィットネス", "映画館", "ゴルフ場", "ボウリング"] },
        // O教育
        { major: "O", middle: "81", keywords: ["学校法人", "幼稚園", "小学校", "中学校", "高校", "大学", "専門学校"] },
        { major: "O", middle: "82", keywords: ["学習塾", "予備校", "スクール", "カルチャーセンター", "塾"] },
        // P医療・福祉
        { major: "P", middle: "83", keywords: ["病院", "クリニック", "診療所", "歯科", "眼科", "内科", "外科", "医院", "医療法人"] },
        { major: "P", middle: "84", keywords: ["保健所", "保健センター", "健康診断"] },
        { major: "P", middle: "85", keywords: ["介護施設", "老人ホーム", "デイサービス", "障害者支援", "グループホーム", "訪問介護"] },
        // Q複合
        { major: "Q", middle: "87", keywords: ["農協", "漁協", "生協", "協同組合"] },
        // R サービス
        { major: "R", middle: "88", keywords: ["廃棄物処理", "産廃", "ゴミ収集", "リサイクル業"] },
        { major: "R", middle: "89", keywords: ["自動車整備", "車検", "板金塗装", "自動車修理"] },
        { major: "R", middle: "91", keywords: ["人材派遣", "人材紹介", "採用支援", "HR", "転職"] },
        { major: "R", middle: "92", keywords: ["ビルメンテナンス", "清掃会社", "警備会社", "受付代行", "ビルメン"] },
      ];

      // Score each entry and collect top candidates
      const scores: Array<{ major: string; middle: string; score: number }> = [];
      for (const entry of JSIC_KEYWORDS) {
        let score = 0;
        for (const kw of entry.keywords) {
          if (searchText.includes(kw)) score++;
        }
        if (score > 0) {
          scores.push({ major: entry.major, middle: entry.middle, score });
        }
      }

      // Sort by score descending, take top 3
      scores.sort((a, b) => b.score - a.score);
      const topSuggestions = scores.slice(0, 3).map(({ major, middle, score }) => ({
        majorCode: major,
        middleCode: middle,
        confidence: score,
      }));

      if (topSuggestions.length > 0) {
        result.suggestedIndustryCodes = topSuggestions;
      }

      // Clean up empty string fields
      Object.keys(result).forEach((k) => {
        const v = result[k];
        if (typeof v === 'string' && !v) delete result[k];
      });

      res.json(result);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return res.status(408).json({ message: "タイムアウトしました。URLを確認してください。" });
      }
      console.error("Scrape error:", error);
      res.status(500).json({ message: "情報の取得に失敗しました" });
    }
  });

  // Person routes
  app.get('/api/persons/:id', isAuthenticated, async (req, res) => {
    try {
      const person = await storage.getPerson(req.params.id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      console.error("Error fetching person:", error);
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.get('/api/offices/:officeId/persons', isAuthenticated, async (req, res) => {
    try {
      const persons = await storage.getPersonsByOffice(req.params.officeId);
      res.json(persons);
    } catch (error) {
      console.error("Error fetching persons:", error);
      res.status(500).json({ message: "Failed to fetch persons" });
    }
  });

  app.post('/api/persons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(person);
    } catch (error) {
      console.error("Error creating person:", error);
      res.status(400).json({ message: "Failed to create person" });
    }
  });

  app.patch('/api/persons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertPersonSchema.partial().parse(req.body);
      const person = await storage.updatePerson(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(person);
    } catch (error) {
      console.error("Error updating person:", error);
      res.status(400).json({ message: "Failed to update person" });
    }
  });

  app.delete('/api/persons/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePerson(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Karte routes
  app.get('/api/kartes/:id', isAuthenticated, async (req, res) => {
    try {
      const karte = await storage.getKarte(req.params.id);
      if (!karte) {
        return res.status(404).json({ message: "Karte not found" });
      }
      res.json(karte);
    } catch (error) {
      console.error("Error fetching karte:", error);
      res.status(500).json({ message: "Failed to fetch karte" });
    }
  });

  app.get('/api/offices/:officeId/kartes', isAuthenticated, async (req, res) => {
    try {
      const kartes = await storage.getKartesByOffice(req.params.officeId);
      res.json(kartes);
    } catch (error) {
      console.error("Error fetching kartes:", error);
      res.status(500).json({ message: "Failed to fetch kartes" });
    }
  });

  app.get('/api/kartes', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      const kartes = await storage.getKartesByDate(date as string);
      res.json(kartes);
    } catch (error) {
      console.error("Error fetching kartes by date:", error);
      res.status(500).json({ message: "Failed to fetch kartes" });
    }
  });

  app.post('/api/kartes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertKarteSchema.parse(req.body);
      const karte = await storage.createKarte({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(karte);
    } catch (error) {
      console.error("Error creating karte:", error);
      res.status(400).json({ message: "Failed to create karte" });
    }
  });

  app.patch('/api/kartes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertKarteSchema.partial().parse(req.body);
      const karte = await storage.updateKarte(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(karte);
    } catch (error) {
      console.error("Error updating karte:", error);
      res.status(400).json({ message: "Failed to update karte" });
    }
  });

  app.delete('/api/kartes/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKarte(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting karte:", error);
      res.status(500).json({ message: "Failed to delete karte" });
    }
  });

  // Worklog routes
  app.get('/api/worklogs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.query;
      
      const worklogs = date 
        ? await storage.getWorklogsByDate(date as string)
        : await storage.getWorklogsByUser(userId);
      
      res.json(worklogs);
    } catch (error) {
      console.error("Error fetching worklogs:", error);
      res.status(500).json({ message: "Failed to fetch worklogs" });
    }
  });

  app.post('/api/worklogs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertWorklogSchema.parse(req.body);
      const worklog = await storage.createWorklog({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(worklog);
    } catch (error) {
      console.error("Error creating worklog:", error);
      res.status(400).json({ message: "Failed to create worklog" });
    }
  });

  app.patch('/api/worklogs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertWorklogSchema.partial().parse(req.body);
      const worklog = await storage.updateWorklog(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(worklog);
    } catch (error) {
      console.error("Error updating worklog:", error);
      res.status(400).json({ message: "Failed to update worklog" });
    }
  });

  app.delete('/api/worklogs/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteWorklog(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting worklog:", error);
      res.status(500).json({ message: "Failed to delete worklog" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/visit-reminders', isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.getAllOffices();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      const showAll = req.query.all === 'true';
      
      // Get kartes for each office
      const kartesPromises = offices.map(o => storage.getKartesByOffice(o.id));
      const allKartes = await Promise.all(kartesPromises);
      
      // For each office, find the earliest upcoming visit (future or today)
      const reminders: any[] = [];
      allKartes.forEach((kartes, index) => {
        // Filter kartes with nextVisitDate set and not in the past
        const upcomingKartes = kartes.filter(k => {
          if (!k.nextVisitDate) return false;
          const visitDate = new Date(k.nextVisitDate);
          visitDate.setHours(0, 0, 0, 0);
          return visitDate >= today;
        });
        
        if (upcomingKartes.length > 0) {
          // Sort by nextVisitDate and take the earliest one
          upcomingKartes.sort((a, b) => {
            const dateA = new Date(a.nextVisitDate!);
            const dateB = new Date(b.nextVisitDate!);
            return dateA.getTime() - dateB.getTime();
          });
          
          const earliestKarte = upcomingKartes[0];
          reminders.push({
            officeId: offices[index].id,
            officeName: offices[index].name,
            karteId: earliestKarte.id,
            karteTitle: earliestKarte.title,
            visitDate: earliestKarte.visitDate,
            nextAction: earliestKarte.nextAction || "",
            nextVisitDate: earliestKarte.nextVisitDate
          });
        }
      });
      
      // Sort all reminders by nextVisitDate ascending (upcoming visits first)
      reminders.sort((a, b) => {
        const dateA = new Date(a.nextVisitDate);
        const dateB = new Date(b.nextVisitDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Return all reminders if showAll=true, otherwise top 10
      res.json(showAll ? reminders : reminders.slice(0, 10));
    } catch (error) {
      console.error("Error fetching visit reminders:", error);
      res.status(500).json({ message: "Failed to fetch visit reminders" });
    }
  });
  
  app.get('/api/dashboard/activity-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = req.query.period as string || 'week';
      
      const today = new Date();
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else {
        startDate.setMonth(today.getMonth() - 1);
      }
      
      const allWorklogs = await storage.getWorklogsByUser(userId);
      const worklogs = allWorklogs.filter(w => {
        const worklogDate = new Date(w.date);
        return worklogDate >= startDate && worklogDate <= today;
      });
      
      let totalHours = 0;
      worklogs.forEach(w => {
        if (w.duration) {
          const hours = parseFloat(w.duration);
          if (!isNaN(hours)) totalHours += hours;
        }
      });
      
      res.json({
        period,
        visitCount: worklogs.length,
        totalHours: totalHours.toFixed(1),
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error fetching activity summary:", error);
      res.status(500).json({ message: "Failed to fetch activity summary" });
    }
  });
  
  app.get('/api/dashboard/health-snapshot', isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.getAllOffices();
      
      const kartesPromises = offices.map(o => storage.getKartesByOffice(o.id));
      const allKartes = await Promise.all(kartesPromises);
      
      const today = new Date();
      const healthSnapshot = offices.map((office, index) => {
        const kartes = allKartes[index];
        const lastVisit = kartes.length > 0 ? kartes[0].visitDate : null;
        
        let daysSinceVisit = null;
        let status = 'unknown';
        
        if (lastVisit) {
          const lastVisitDate = new Date(lastVisit);
          daysSinceVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceVisit < 30) status = 'healthy';
          else if (daysSinceVisit < 90) status = 'warning';
          else status = 'critical';
        }
        
        return {
          officeId: office.id,
          officeName: office.name,
          engagementType: office.engagementType,
          lastVisitDate: lastVisit,
          daysSinceVisit,
          status
        };
      });
      
      res.json(healthSnapshot);
    } catch (error) {
      console.error("Error fetching health snapshot:", error);
      res.status(500).json({ message: "Failed to fetch health snapshot" });
    }
  });
  
  // Audit log routes
  app.get('/api/audit-logs/:entityType/:entityId', isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await storage.getAuditLogsByEntity(entityType, entityId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  
  // Subsidy program routes
  app.get('/api/subsidy-programs', isAuthenticated, async (req, res) => {
    try {
      const programs = await storage.getAllSubsidyPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching subsidy programs:", error);
      res.status(500).json({ message: "Failed to fetch subsidy programs" });
    }
  });
  
  app.get('/api/subsidy-programs/:id', isAuthenticated, async (req, res) => {
    try {
      const program = await storage.getSubsidyProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Subsidy program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error fetching subsidy program:", error);
      res.status(500).json({ message: "Failed to fetch subsidy program" });
    }
  });
  
  app.post('/api/subsidy-programs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Normalize URLs before validation: trim, filter empty, remove duplicates, limit to 5
      const normalizedBody = {
        ...req.body,
        urls: req.body.urls
          ? Array.from(new Set(
              req.body.urls
                .map((url: string) => url.trim())
                .filter((url: string) => url.length > 0)
            )).slice(0, 5)
          : undefined,
      };
      
      // Validate normalized data with schema (strict URL format validation via Zod)
      const result = insertSubsidyProgramSchema.safeParse(normalizedBody);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      const program = await storage.createSubsidyProgram({
        ...result.data,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating subsidy program:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch('/api/subsidy-programs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Normalize URLs before validation if present
      const normalizedBody = {
        ...req.body,
        ...(req.body.urls !== undefined && {
          urls: req.body.urls && req.body.urls.length > 0
            ? Array.from(new Set(
                req.body.urls
                  .map((url: string) => url.trim())
                  .filter((url: string) => url.length > 0)
              )).slice(0, 5)
            : undefined
        }),
      };
      
      // Validate normalized data with schema (strict URL format validation via Zod)
      const result = insertSubsidyProgramSchema.partial().safeParse(normalizedBody);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      const program = await storage.updateSubsidyProgram(req.params.id, {
        ...result.data,
        updatedBy: userId,
      });
      res.json(program);
    } catch (error) {
      console.error("Error updating subsidy program:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete('/api/subsidy-programs/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSubsidyProgram(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subsidy program:", error);
      res.status(500).json({ message: "Failed to delete subsidy program" });
    }
  });
  
  app.get('/api/subsidy-programs/:id/offices', isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.getOfficesBySubsidyProgram(req.params.id);
      // Return dedicated linkage object with nested office summary
      const linkedOfficeRecords = offices.map(office => ({
        linkageId: office.recordId,  // Unique identifier for this office-subsidy linkage
        status: office.recordStatus,  // Status of the subsidy record for this office
        createdAt: office.createdAt,
        updatedAt: office.updatedAt,
        office: {
          id: office.id,
          code: office.code,
          name: office.name,
          representativeName: office.representativeName,
          engagementType: office.engagementType,
        },
      }));
      res.json(linkedOfficeRecords);
    } catch (error) {
      console.error("Error fetching offices by subsidy program:", error);
      res.status(500).json({ message: "Failed to fetch offices" });
    }
  });
  
  // Office subsidy record routes
  app.get('/api/offices/:officeId/subsidy-records', isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getOfficeSubsidyRecordsByOffice(req.params.officeId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching office subsidy records:", error);
      res.status(500).json({ message: "Failed to fetch office subsidy records" });
    }
  });
  
  app.get('/api/subsidy-records/:id', isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getOfficeSubsidyRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ message: "Subsidy record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching subsidy record:", error);
      res.status(500).json({ message: "Failed to fetch subsidy record" });
    }
  });
  
  app.get('/api/subsidy-records/upcoming-deadlines', isAuthenticated, async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days as string) || 30;
      const records = await storage.getUpcomingDeadlines(daysAhead);
      res.json(records);
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
      res.status(500).json({ message: "Failed to fetch upcoming deadlines" });
    }
  });
  
  app.post('/api/subsidy-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSubsidyRecordSchema.parse(req.body);
      const record = await storage.createOfficeSubsidyRecord({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      } as any);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating subsidy record:", error);
      res.status(400).json({ message: "Failed to create subsidy record" });
    }
  });
  
  app.patch('/api/subsidy-records/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSubsidyRecordSchema.partial().parse(req.body);
      const record = await storage.updateOfficeSubsidyRecord(req.params.id, {
        ...parsed,
        updatedBy: userId,
      } as any);
      res.json(record);
    } catch (error) {
      console.error("Error updating subsidy record:", error);
      res.status(400).json({ message: "Failed to update subsidy record" });
    }
  });
  
  app.delete('/api/subsidy-records/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteOfficeSubsidyRecord(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subsidy record:", error);
      res.status(500).json({ message: "Failed to delete subsidy record" });
    }
  });

  // CSV export route
  app.get('/api/export/offices', isAuthenticated, async (req, res) => {
    try {
      const { code, name, representative, fields } = req.query;
      
      // Use search to filter offices
      const offices = await storage.searchOffices({
        code: code as string,
        name: name as string,
        representative: representative as string,
      });

      // Define field labels in Japanese
      const fieldLabels: Record<string, string> = {
        code: '事業所コード',
        name: '事業所名',
        nameKana: 'フリガナ',
        representativeName: '代表者氏名',
        representativeKana: '代表者フリガナ',
        companyType: '会社区分',
        capital: '資本金',
        corporateNumber: '法人番号',
        invoiceNumber: 'インボイス番号',
        phone1: '電話番号1',
        phone2: '電話番号2',
        phone3: '電話番号3',
        phone4: '電話番号4',
        phone5: '電話番号5',
        representativeMobile: '代表者携帯',
        industry: '業種',
        employees: '従業員数',
        regularEmployees: '正社員数',
        companyCategory: '会社区分',
        engagementType: '関与区分',
        engagementDate: '関与開始日',
        withdrawalDate: '関与終了日',
        withdrawalReason: '関与終了理由',
        closureDate: '廃業日',
        postalCode: '郵便番号',
        address: '住所',
        email: 'メールアドレス',
        website: 'ホームページ',
        bankName: '金融機関名',
        bankBranch: '支店名',
        accountType: '口座種別',
        accountNumber: '口座番号',
        accountHolder: '口座名義',
        notes: '備考'
      };

      // Parse selected fields
      const selectedFields = fields ? (fields as string).split(',') : Object.keys(fieldLabels);

      // Helper function to escape CSV values
      const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Convert to CSV format
      const headers = selectedFields.map(field => fieldLabels[field] || field).join(',');
      const rows = offices.map(office => 
        selectedFields.map(field => escapeCsv((office as any)[field])).join(',')
      ).join('\n');
      const csv = offices.length > 0 ? `${headers}\n${rows}` : `${headers}\n`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=offices.csv');
      res.send('\ufeff' + csv); // Add BOM for Excel
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // ===== Financial Management API Routes =====
  
  // Financial periods
  app.get('/api/offices/:officeId/financial-periods', isAuthenticated, async (req, res) => {
    try {
      const periods = await storage.getFinancialPeriodsByOffice(req.params.officeId);
      res.json(periods);
    } catch (error) {
      console.error("Error fetching financial periods:", error);
      res.status(500).json({ message: "Failed to fetch financial periods" });
    }
  });
  
  app.get('/api/financial-periods/:id', isAuthenticated, async (req, res) => {
    try {
      const period = await storage.getFinancialPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ message: "Financial period not found" });
      }
      res.json(period);
    } catch (error) {
      console.error("Error fetching financial period:", error);
      res.status(500).json({ message: "Failed to fetch financial period" });
    }
  });
  
  app.post('/api/offices/:officeId/financial-periods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = await storage.createFinancialPeriod({
        ...req.body,
        officeId: req.params.officeId,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(period);
    } catch (error) {
      console.error("Error creating financial period:", error);
      res.status(400).json({ message: "Failed to create financial period" });
    }
  });
  
  app.patch('/api/financial-periods/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = await storage.updateFinancialPeriod(req.params.id, {
        ...req.body,
        updatedBy: userId,
      });
      res.json(period);
    } catch (error) {
      console.error("Error updating financial period:", error);
      res.status(400).json({ message: "Failed to update financial period" });
    }
  });
  
  app.delete('/api/financial-periods/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteFinancialPeriod(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting financial period:", error);
      res.status(500).json({ message: "Failed to delete financial period" });
    }
  });
  
  // Financial accounts (master data)
  app.get('/api/financial-accounts', isAuthenticated, async (req, res) => {
    try {
      const { type } = req.query;
      if (type === 'BS' || type === 'PL') {
        const accounts = await storage.getFinancialAccountsByType(type);
        res.json(accounts);
      } else {
        const accounts = await storage.getAllFinancialAccounts();
        res.json(accounts);
      }
    } catch (error) {
      console.error("Error fetching financial accounts:", error);
      res.status(500).json({ message: "Failed to fetch financial accounts" });
    }
  });
  
  // Balance Sheet entries (with Cache-Control for real-time sync)
  app.get('/api/financial-periods/:periodId/bs', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const entries = await storage.getFinancialBsEntriesByPeriod(req.params.periodId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching BS entries:", error);
      res.status(500).json({ message: "Failed to fetch BS entries" });
    }
  });
  
  app.put('/api/financial-periods/:periodId/bs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = req.body.entries.map((entry: any) => ({
        ...entry,
        periodId: req.params.periodId,
        createdBy: userId,
        updatedBy: userId,
      }));
      const result = await storage.upsertFinancialBsEntries(entries);
      res.json(result);
    } catch (error) {
      console.error("Error upserting BS entries:", error);
      res.status(400).json({ message: "Failed to save BS entries" });
    }
  });
  
  // Profit & Loss entries (with Cache-Control for real-time sync)
  app.get('/api/financial-periods/:periodId/pl', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const entries = await storage.getFinancialPlEntriesByPeriod(req.params.periodId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching PL entries:", error);
      res.status(500).json({ message: "Failed to fetch PL entries" });
    }
  });
  
  app.put('/api/financial-periods/:periodId/pl', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = req.body.entries.map((entry: any) => ({
        ...entry,
        periodId: req.params.periodId,
        createdBy: userId,
        updatedBy: userId,
      }));
      const result = await storage.upsertFinancialPlEntries(entries);
      res.json(result);
    } catch (error) {
      console.error("Error upserting PL entries:", error);
      res.status(400).json({ message: "Failed to save PL entries" });
    }
  });
  
  
  // CSV Import for financial data
  app.post('/api/offices/:officeId/financials/import-csv', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { periodId, statementType, data } = req.body;
      
      if (!periodId || !statementType || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid import data" });
      }
      
      const accounts = await storage.getAllFinancialAccounts();
      const accountByCode = new Map(accounts.map(a => [a.code, a]));
      
      const entries = data
        .filter((row: any) => row.accountCode && row.amount !== undefined)
        .map((row: any) => {
          const account = accountByCode.get(row.accountCode);
          if (!account) return null;
          return {
            periodId,
            accountId: account.id,
            amount: parseInt(row.amount, 10) || 0,
            notes: row.notes || '',
            createdBy: userId,
            updatedBy: userId,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      
      if (entries.length === 0) {
        return res.status(400).json({ message: "No valid entries found in CSV" });
      }
      
      let result;
      if (statementType === 'PL') {
        result = await storage.upsertFinancialPlEntries(entries);
      } else if (statementType === 'BS') {
        result = await storage.upsertFinancialBsEntries(entries);
      } else {
        return res.status(400).json({ message: "Invalid statement type" });
      }
      
      res.json({ imported: result.length, total: data.length });
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV data" });
    }
  });
  
  // Calculate and store cash flow (indirect method)
  app.post('/api/financial-periods/:periodId/calculate-cashflow', isAuthenticated, async (req, res) => {
    try {
      const periodId = req.params.periodId;
      const period = await storage.getFinancialPeriod(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }
      
      const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
      const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
      const accounts = await storage.getAllFinancialAccounts();
      
      const accountById = new Map(accounts.map(a => [a.id, a]));
      
      const getAmountByCode = (entries: typeof plEntries | typeof bsEntries, code: string) => {
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account?.code === code) return entry.amount;
        }
        return 0;
      };
      
      const getAmountsByCategory = (entries: typeof plEntries | typeof bsEntries, category: string) => {
        let total = 0;
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account?.category === category) {
            total += entry.amount;
          }
        }
        return total;
      };
      
      const netIncome = getAmountsByCategory(plEntries, '売上高') - 
                        getAmountsByCategory(plEntries, '売上原価') - 
                        getAmountsByCategory(plEntries, '販売費及び一般管理費') +
                        getAmountsByCategory(plEntries, '営業外収益') - 
                        getAmountsByCategory(plEntries, '営業外費用') +
                        getAmountsByCategory(plEntries, '特別利益') - 
                        getAmountsByCategory(plEntries, '特別損失') - 
                        getAmountsByCategory(plEntries, '法人税等');
      
      const depreciation = getAmountByCode(plEntries, '4309');
      
      const operatingCashflow = netIncome + depreciation;
      const investingCashflow = 0;
      const financingCashflow = 0;
      const netCashflow = operatingCashflow + investingCashflow + financingCashflow;
      const beginningCash = getAmountByCode(bsEntries, '1101');
      const endingCash = beginningCash + netCashflow;
      
      const cashflow = await storage.upsertFinancialCashflow(periodId, {
        operatingCashFlow: operatingCashflow,
        investingCashFlow: investingCashflow,
        financingCashFlow: financingCashflow,
        netCashChange: netCashflow,
        beginningCash,
        endingCash,
        depreciation,
        netIncome,
      });
      
      res.json(cashflow);
    } catch (error) {
      console.error("Error calculating cashflow:", error);
      res.status(500).json({ message: "Failed to calculate cashflow" });
    }
  });
  
  // Helper function to calculate metrics
  async function calculateMetricsForPeriod(periodId: string) {
    const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
    const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
    const accounts = await storage.getAllFinancialAccounts();
    
    if (plEntries.length === 0 && bsEntries.length === 0) return null;
    
    const accountById = new Map(accounts.map(a => [a.id, a]));
    
    const getAmountsByCategory = (entries: typeof plEntries | typeof bsEntries, category: string) => {
      let total = 0;
      for (const entry of entries) {
        const account = accountById.get(entry.accountId);
        if (account?.category === category) total += entry.amount;
      }
      return total;
    };
    
    const sales = getAmountsByCategory(plEntries, '売上高');
    const cogs = getAmountsByCategory(plEntries, '売上原価');
    const sga = getAmountsByCategory(plEntries, '販売費及び一般管理費');
    const grossProfit = sales - cogs;
    const operatingProfit = grossProfit - sga;
    const ordinaryProfit = operatingProfit + getAmountsByCategory(plEntries, '営業外収益') - getAmountsByCategory(plEntries, '営業外費用');
    const extraordinaryProfit = getAmountsByCategory(plEntries, '特別利益') - getAmountsByCategory(plEntries, '特別損失');
    const taxes = getAmountsByCategory(plEntries, '法人税等');
    const netIncome = ordinaryProfit + extraordinaryProfit - taxes;
    
    const currentAssets = getAmountsByCategory(bsEntries, '流動資産');
    const fixedAssets = getAmountsByCategory(bsEntries, '固定資産');
    const totalAssets = currentAssets + fixedAssets;
    const currentLiabilities = getAmountsByCategory(bsEntries, '流動負債');
    const fixedLiabilities = getAmountsByCategory(bsEntries, '固定負債');
    const totalLiabilities = currentLiabilities + fixedLiabilities;
    const netAssets = getAmountsByCategory(bsEntries, '純資産');
    
    const grossProfitMargin = sales > 0 ? Math.round((grossProfit / sales) * 10000) : 0;
    const operatingProfitMargin = sales > 0 ? Math.round((operatingProfit / sales) * 10000) : 0;
    const ordinaryProfitMargin = sales > 0 ? Math.round((ordinaryProfit / sales) * 10000) : 0;
    const netProfitMargin = sales > 0 ? Math.round((netIncome / sales) * 10000) : 0;
    const currentRatio = currentLiabilities > 0 ? Math.round((currentAssets / currentLiabilities) * 10000) : 0;
    const debtToEquityRatio = netAssets > 0 ? Math.round((totalLiabilities / netAssets) * 10000) : 0;
    const equityRatio = totalAssets > 0 ? Math.round((netAssets / totalAssets) * 10000) : 0;
    const roa = totalAssets > 0 ? Math.round((netIncome / totalAssets) * 10000) : 0;
    const roe = netAssets > 0 ? Math.round((netIncome / netAssets) * 10000) : 0;
    const assetTurnover = totalAssets > 0 ? Math.round((sales / totalAssets) * 10000) : 0;
    
    return storage.upsertFinancialMetrics(periodId, {
      revenue: sales, grossProfit, operatingProfit, ordinaryProfit, netIncome,
      totalAssets, netAssets, totalLiabilities, currentAssets, currentLiabilities,
      grossProfitMargin, operatingProfitMargin, ordinaryProfitMargin, netProfitMargin,
      currentRatio, debtToEquityRatio, equityRatio, roa, roe, assetTurnover,
    });
  }
  
  // Get financial metrics for a period (always recalculate from PL/BS data for real-time sync)
  app.get('/api/financial-periods/:periodId/metrics', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const periodId = req.params.periodId;
      const metrics = await calculateMetricsForPeriod(periodId);
      res.json(metrics || null);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });
  
  // Helper function to calculate cashflow for a period (always recalculate from PL/BS data)
  async function calculateCashflowForPeriod(periodId: string) {
    const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
    const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
    const accounts = await storage.getAllFinancialAccounts();
    
    if (plEntries.length === 0 && bsEntries.length === 0) return null;
    
    const accountById = new Map(accounts.map(a => [a.id, a]));
    
    const getAmountByCode = (entries: typeof bsEntries, code: string) => {
      for (const entry of entries) {
        const account = accountById.get(entry.accountId);
        if (account?.code === code) return entry.amount;
      }
      return 0;
    };
    
    const getAmountsByCategory = (entries: typeof plEntries, category: string) => {
      let total = 0;
      for (const entry of entries) {
        const account = accountById.get(entry.accountId);
        if (account?.category === category) total += entry.amount;
      }
      return total;
    };
    
    const sales = getAmountsByCategory(plEntries, '売上高');
    const cogs = getAmountsByCategory(plEntries, '売上原価');
    const sga = getAmountsByCategory(plEntries, '販売費及び一般管理費');
    const grossProfit = sales - cogs;
    const operatingProfit = grossProfit - sga;
    const ordinaryProfit = operatingProfit + getAmountsByCategory(plEntries, '営業外収益') - getAmountsByCategory(plEntries, '営業外費用');
    const extraordinaryProfit = getAmountsByCategory(plEntries, '特別利益') - getAmountsByCategory(plEntries, '特別損失');
    const taxes = getAmountsByCategory(plEntries, '法人税等');
    const netIncome = ordinaryProfit + extraordinaryProfit - taxes;
    
    const depreciation = (() => {
      for (const entry of plEntries) {
        const account = accountById.get(entry.accountId);
        if (account?.code === '4309') return entry.amount;
      }
      return 0;
    })();
    
    const operatingCF = netIncome + depreciation;
    const beginningCash = getAmountByCode(bsEntries, '1101');
    
    return storage.upsertFinancialCashflow(periodId, {
      operatingCashFlow: operatingCF,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashChange: operatingCF,
      beginningCash,
      endingCash: beginningCash + operatingCF,
      depreciation,
      netIncome,
    });
  }
  
  // Get financial cashflow for a period (always recalculate from PL/BS data for real-time sync)
  app.get('/api/financial-periods/:periodId/cashflow', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const periodId = req.params.periodId;
      const cashflow = await calculateCashflowForPeriod(periodId);
      res.json(cashflow || null);
    } catch (error) {
      console.error("Error fetching cashflow:", error);
      res.status(500).json({ message: "Failed to fetch cashflow" });
    }
  });
  
  // Calculate and store financial metrics
  app.post('/api/financial-periods/:periodId/calculate-metrics', isAuthenticated, async (req, res) => {
    try {
      const periodId = req.params.periodId;
      
      const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
      const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
      const accounts = await storage.getAllFinancialAccounts();
      
      const accountById = new Map(accounts.map(a => [a.id, a]));
      
      const getAmountsByCategory = (entries: typeof plEntries | typeof bsEntries, category: string) => {
        let total = 0;
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account?.category === category) {
            total += entry.amount;
          }
        }
        return total;
      };
      
      const getTotalByCategories = (entries: typeof bsEntries, categories: string[], isDebit: boolean) => {
        let total = 0;
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account && categories.includes(account.category)) {
            total += (account.isDebit === 1) === isDebit ? entry.amount : -entry.amount;
          }
        }
        return total;
      };
      
      const sales = getAmountsByCategory(plEntries, '売上高');
      const cogs = getAmountsByCategory(plEntries, '売上原価');
      const sga = getAmountsByCategory(plEntries, '販売費及び一般管理費');
      const grossProfit = sales - cogs;
      const operatingProfit = grossProfit - sga;
      const ordinaryProfit = operatingProfit + 
                            getAmountsByCategory(plEntries, '営業外収益') - 
                            getAmountsByCategory(plEntries, '営業外費用');
      const netIncome = ordinaryProfit + 
                        getAmountsByCategory(plEntries, '特別利益') - 
                        getAmountsByCategory(plEntries, '特別損失') - 
                        getAmountsByCategory(plEntries, '法人税等');
      
      const totalAssets = getTotalByCategories(bsEntries, ['流動資産', '固定資産'], true);
      const currentAssets = getTotalByCategories(bsEntries, ['流動資産'], true);
      const currentLiabilities = getTotalByCategories(bsEntries, ['流動負債'], false);
      const totalLiabilities = getTotalByCategories(bsEntries, ['流動負債', '固定負債'], false);
      const netAssets = getTotalByCategories(bsEntries, ['純資産'], false);
      
      const grossProfitMargin = sales > 0 ? Math.round((grossProfit / sales) * 10000) : 0;
      const operatingProfitMargin = sales > 0 ? Math.round((operatingProfit / sales) * 10000) : 0;
      const netProfitMargin = sales > 0 ? Math.round((netIncome / sales) * 10000) : 0;
      const currentRatio = currentLiabilities > 0 ? Math.round((currentAssets / currentLiabilities) * 10000) : 0;
      const debtToEquityRatio = netAssets > 0 ? Math.round((totalLiabilities / netAssets) * 10000) : 0;
      const equityRatio = totalAssets > 0 ? Math.round((netAssets / totalAssets) * 10000) : 0;
      const roa = totalAssets > 0 ? Math.round((netIncome / totalAssets) * 10000) : 0;
      const roe = netAssets > 0 ? Math.round((netIncome / netAssets) * 10000) : 0;
      const assetTurnover = totalAssets > 0 ? Math.round((sales / totalAssets) * 10000) : 0;
      
      const metrics = await storage.upsertFinancialMetrics(periodId, {
        revenue: sales,
        grossProfit,
        operatingProfit,
        ordinaryProfit,
        netIncome,
        totalAssets,
        netAssets,
        totalLiabilities,
        currentAssets,
        currentLiabilities,
        grossProfitMargin,
        operatingProfitMargin,
        netProfitMargin,
        currentRatio,
        debtToEquityRatio,
        equityRatio,
        roa,
        roe,
        assetTurnover,
      });
      
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  // ===== Company Settings Routes =====
  
  // ===== Company Routes (複数会社対応) =====
  
  // Get all companies for current user
  app.get('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const companies = await storage.getCompaniesByUser(userId);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });
  
  // Get default company for current user
  app.get('/api/companies/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getDefaultCompany(userId);
      res.json(company || null);
    } catch (error) {
      console.error("Error fetching default company:", error);
      res.status(500).json({ message: "Failed to fetch default company" });
    }
  });
  
  // Get specific company
  app.get('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });
  
  // Create new company
  app.post('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = insertCompanySchema.safeParse({ ...req.body, userId });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const company = await storage.createCompany(result.data);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });
  
  // Update company
  app.put('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const result = insertCompanySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const company = await storage.updateCompany(req.params.id, result.data);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });
  
  // Set default company
  app.put('/api/companies/:id/set-default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.setDefaultCompany(userId, req.params.id);
      res.json({ message: "Default company updated" });
    } catch (error) {
      console.error("Error setting default company:", error);
      res.status(500).json({ message: "Failed to set default company" });
    }
  });
  
  // Delete company
  app.delete('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });
  
  // ===== Bank Account Routes (複数口座対応) =====
  
  // Get bank accounts for a company
  app.get('/api/companies/:companyId/bank-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const accounts = await storage.getBankAccountsByCompany(req.params.companyId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });
  
  // Get default bank account for a company
  app.get('/api/companies/:companyId/bank-accounts/default', isAuthenticated, async (req: any, res) => {
    try {
      const account = await storage.getDefaultBankAccount(req.params.companyId);
      res.json(account || null);
    } catch (error) {
      console.error("Error fetching default bank account:", error);
      res.status(500).json({ message: "Failed to fetch default bank account" });
    }
  });
  
  // Get specific bank account
  app.get('/api/bank-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const account = await storage.getBankAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching bank account:", error);
      res.status(500).json({ message: "Failed to fetch bank account" });
    }
  });
  
  // Create new bank account
  app.post('/api/bank-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const result = insertBankAccountSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const account = await storage.createBankAccount(result.data);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating bank account:", error);
      res.status(500).json({ message: "Failed to create bank account" });
    }
  });
  
  // Update bank account
  app.put('/api/bank-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const result = insertBankAccountSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const account = await storage.updateBankAccount(req.params.id, result.data);
      res.json(account);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });
  
  // Set default bank account
  app.put('/api/bank-accounts/:id/set-default', isAuthenticated, async (req: any, res) => {
    try {
      const account = await storage.getBankAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      await storage.setDefaultBankAccount(account.companyId, req.params.id);
      res.json({ message: "Default bank account updated" });
    } catch (error) {
      console.error("Error setting default bank account:", error);
      res.status(500).json({ message: "Failed to set default bank account" });
    }
  });
  
  // Delete bank account
  app.delete('/api/bank-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBankAccount(req.params.id);
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });
  
  // ===== Company Settings Routes (レガシー - 後方互換性のため) =====
  
  app.get('/api/company-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getCompanySettings(userId);
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });
  
  app.put('/api/company-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = insertCompanySettingsSchema.omit({ userId: true }).safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const settings = await storage.upsertCompanySettings(userId, result.data);
      res.json(settings);
    } catch (error) {
      console.error("Error saving company settings:", error);
      res.status(500).json({ message: "Failed to save company settings" });
    }
  });

  // ===== Invoice Routes =====
  
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const { status, officeId, startDate, endDate } = req.query;
      const invoices = await storage.searchInvoices({
        status: status as string,
        officeId: officeId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  app.get('/api/invoices/next-number', isAuthenticated, async (req: any, res) => {
    try {
      const nextNumber = await storage.getNextInvoiceNumber();
      res.json({ invoiceNumber: nextNumber });
    } catch (error) {
      console.error("Error generating invoice number:", error);
      res.status(500).json({ message: "Failed to generate invoice number" });
    }
  });
  
  app.get('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const data = await storage.getInvoiceWithItems(req.params.id);
      if (!data) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  
  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, ...invoiceData } = req.body;
      
      // Handle empty dueDate
      if (invoiceData.dueDate === '' || invoiceData.dueDate === undefined) {
        invoiceData.dueDate = null;
      }
      
      // Create invoice
      const invoice = await storage.createInvoice({
        ...invoiceData,
        createdBy: userId,
      });
      
      // Create invoice items
      if (items && Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
          await storage.createInvoiceItem({
            ...items[i],
            invoiceId: invoice.id,
            displayOrder: i,
          });
        }
      }
      
      const result = await storage.getInvoiceWithItems(invoice.id);
      res.json(result);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  
  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, ...invoiceData } = req.body;
      
      // Handle empty dueDate
      if (invoiceData.dueDate === '' || invoiceData.dueDate === undefined) {
        invoiceData.dueDate = null;
      }
      
      // Update invoice
      const invoice = await storage.updateInvoice(req.params.id, {
        ...invoiceData,
        updatedBy: userId,
      });
      
      // Replace invoice items
      if (items && Array.isArray(items)) {
        await storage.deleteInvoiceItemsByInvoice(req.params.id);
        for (let i = 0; i < items.length; i++) {
          await storage.createInvoiceItem({
            ...items[i],
            invoiceId: invoice.id,
            displayOrder: i,
          });
        }
      }
      
      const result = await storage.getInvoiceWithItems(invoice.id);
      res.json(result);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });
  
  app.delete('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });
  
  // ===== Payment Routes =====
  
  app.get('/api/invoices/:invoiceId/payments', isAuthenticated, async (req: any, res) => {
    try {
      const payments = await storage.getPaymentsByInvoice(req.params.invoiceId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  
  app.post('/api/invoices/:invoiceId/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = insertPaymentSchema.safeParse({
        ...req.body,
        invoiceId: req.params.invoiceId,
        createdBy: userId,
      });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      const payment = await storage.createPayment(result.data);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  
  app.delete('/api/payments/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deletePayment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });
  
  // ===== Invoice Email Route =====
  
  app.post('/api/invoices/:id/send-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { to, subject, body, pdfBase64 } = req.body;
      
      if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required fields: to, subject, body" });
      }
      
      const invoiceData = await storage.getInvoiceWithItems(req.params.id);
      if (!invoiceData) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const attachments = pdfBase64 ? [{
        filename: `請求書_${invoiceData.invoice.invoiceNumber}.pdf`,
        content: pdfBase64,
        mimeType: 'application/pdf',
      }] : undefined;
      
      const result = await sendEmail({
        to,
        subject,
        body,
        attachments,
      });
      
      if (result.success) {
        // Update invoice status and email tracking
        await storage.updateInvoice(req.params.id, {
          status: '送付済',
          emailSentAt: new Date(),
          emailSentTo: to,
          updatedBy: userId,
        });
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ message: "Failed to send invoice email" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
