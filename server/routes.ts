import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
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
  insertSwotAnalysisSchema,
} from "@shared/schema";
import { sendEmail } from "./gmail";
import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
      // Helper: decode an ArrayBuffer with charset auto-detection
      const decodeHtml = (buffer: Buffer, contentTypeHeader: string): string => {
        const ct = contentTypeHeader || '';
        const ctMatch = ct.match(/charset=([^\s;]+)/i);
        let charset = ctMatch ? ctMatch[1].trim() : '';
        if (!charset) {
          const snippet = buffer.slice(0, 2000).toString('latin1');
          const metaCharset = snippet.match(/<meta[^>]+charset=["']?([^"';\s>]+)/i)
            || snippet.match(/charset=["']?([^"';\s>]+)/i);
          if (metaCharset) charset = metaCharset[1].trim();
        }
        if (!charset || !iconv.encodingExists(charset)) charset = 'utf-8';
        return iconv.decode(buffer, charset);
      };

      // Helper: safely fetch a page and return its decoded body text (returns '' on error)
      const fetchPageText = async (pageUrl: string, signal: AbortSignal): Promise<string> => {
        try {
          const resp = await safeFetch(pageUrl, signal);
          if (!resp.ok || !resp.headers.get('content-type')?.includes('html')) return '';
          const buf = Buffer.from(await resp.arrayBuffer());
          const html = decodeHtml(buf, resp.headers.get('content-type') || '');
          const $p = cheerio.load(html);
          // Remove non-content elements
          $p('script,style,noscript,iframe,svg,header,footer,nav').remove();
          return $p('body').text().replace(/\s+/g, ' ').trim();
        } catch {
          return '';
        }
      };

      // ── Step 1: Fetch the top page ─────────────────────────────────────────
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await safeFetch(targetUrl, controller.signal);

      if (!response.ok) {
        clearTimeout(timeout);
        return res.status(400).json({ message: `サイトへのアクセスに失敗しました (HTTP ${response.status})` });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const html = decodeHtml(buffer, response.headers.get('content-type') || '');
      const $ = cheerio.load(html);

      // ── Step 2: Extract navigation links from top page ─────────────────────
      const origin = new URL(targetUrl).origin;
      const NAV_SELECTORS = ['nav a', 'header a', '[class*="nav"] a', '[class*="menu"] a',
                             '[id*="nav"] a', '[id*="menu"] a', '[role="navigation"] a'];
      const navUrls = new Set<string>();
      for (const sel of NAV_SELECTORS) {
        $(sel).each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          try {
            const abs = new URL(href, targetUrl).href;
            // Same origin only, HTML-like paths, no fragments, not the top page itself
            if (abs.startsWith(origin) && !abs.includes('#') && abs !== targetUrl
                && !abs.match(/\.(pdf|zip|png|jpg|jpeg|gif|svg|css|js|xml|json)$/i)) {
              navUrls.add(abs);
            }
          } catch { /* ignore invalid hrefs */ }
        });
        if (navUrls.size >= 6) break; // enough candidates
      }

      // ── Step 3: Fetch up to 5 sub-pages concurrently ──────────────────────
      const subUrls = Array.from(navUrls).slice(0, 5);
      const subTexts = await Promise.all(
        subUrls.map((u) => fetchPageText(u, controller.signal))
      );
      clearTimeout(timeout);

      // ── Step 4: Extract structured fields from the top page ───────────────
      const result: Record<string, string | Array<{ majorCode: string; middleCode: string; minorCode?: string; confidence: number }>> = {};

      // Company name
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const h1Text = $('h1').first().text().trim();
      const titleText = $('title').text().trim();
      const name = (ogTitle || h1Text || titleText.split(/[|｜\-–—]/)[0].trim() || "").trim();
      if (name) result.name = name;

      // Meta description
      const metaDesc = $('meta[name="description"]').attr('content')
        || $('meta[property="og:description"]').attr('content')
        || '';
      if (metaDesc.trim()) result.description = metaDesc.trim().slice(0, 500);

      // Postal code
      const bodyText = $('body').text();
      const postalMatch = bodyText.match(/〒?\s*(\d{3}[-－]\d{4})/);
      if (postalMatch) {
        result.postalCode = postalMatch[1].replace(/[－]/g, '-');
      }

      // Address
      const addressSelectors = ['[class*="address"]', '[id*="address"]', '[class*="addr"]', 'address'];
      for (const sel of addressSelectors) {
        const text = $(sel).first().text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 5 && text.length < 200) {
          result.address = text;
          break;
        }
      }

      // Phone numbers
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

      // ── Step 5: Build combined page text for AI ────────────────────────────
      // Top page body (non-boilerplate) + sub-pages, capped at 8000 chars total
      $('script,style,noscript,iframe,svg,nav,footer').remove();
      const topText = $('body').text().replace(/\s+/g, ' ').trim();
      const allTexts = [topText, ...subTexts.filter(Boolean)];
      const combinedText = allTexts.join('\n---\n').slice(0, 8000);

      // ── Step 6: OpenAI analysis ────────────────────────────────────────────
      const aiResult = await (async () => {
        try {
          const systemPrompt = `あなたは日本企業のウェブページを分析して、企業情報を抽出する専門家です。
複数のページから取得したテキストを総合的に分析し、以下の情報をJSON形式で返してください。
情報が見つからない場合は該当フィールドを省略してください。

返すJSONの形式：
{
  "name": "企業名（株式会社・有限会社等の法人格を含む正式名称）",
  "postalCode": "郵便番号（ハイフン付き、例：123-4567）",
  "address": "住所（都道府県から番地まで）",
  "phone1": "電話番号1（ハイフン区切り）",
  "phone2": "電話番号2（ハイフン区切り、あれば）",
  "fax": "FAX番号（ハイフン区切り）",
  "email1": "メールアドレス",
  "description": "企業概要・事業内容（100〜300文字程度で簡潔に）",
  "industryCategoryMajor": "日本標準産業分類の大分類コード（A〜Tの1文字）",
  "industryCategoryMiddle": "日本標準産業分類の中分類コード（2桁数字、例:39）",
  "industryCategoryMinor": "日本標準産業分類の小分類コード（3桁数字、例:391）",
  "industryReason": "産業分類を選んだ理由（1行）"
}

日本標準産業分類（第4版）の主な大分類と中分類・小分類の例：
A=農業・林業（01農業, 02林業）
B=漁業（03漁業, 04水産養殖業）
D=建設業（06総合工事業, 07職別工事業, 08設備工事業）
E=製造業（09食料品, 10飲料・飼料, 11繊維, 14紙, 15印刷, 16化学, 24金属製品, 25はん用機械, 28電子部品, 30情報通信機械, 31輸送用機械）
F=電気・ガス・熱供給・水道業（33電力, 34ガス, 36水道）
G=情報通信業（37通信業, 38放送業, 39情報サービス業[391ソフトウェア業392情報処理393インターネット], 40インターネット付随, 41映像・音声・文字情報）
H=運輸業・郵便業（44道路貨物運送, 47倉庫業, 48運輸附帯）
I=卸売業・小売業（52各種商品卸, 53繊維・衣服等卸, 54機械器具等卸, 55その他卸売, 57各種商品小売, 58食料品小売, 59機械器具小売, 60その他小売, 61無店舗小売）
J=金融業・保険業（62銀行, 63協同組織金融, 64非預金信用機関, 65金融商品取引, 66補助的金融, 67保険業）
K=不動産業・物品賃貸業（68不動産取引業, 69不動産賃貸管理業, 70物品賃貸業）
L=学術研究・専門・技術サービス業（71学術研究, 72専門サービス業[721法律会計722土地家屋調査士723行政書士724デザイン725著述活動726その他専門], 73広告業, 74技術サービス業）
M=宿泊業・飲食サービス業（75宿泊業, 76飲食店, 77持ち帰り・配達飲食）
N=生活関連サービス業・娯楽業（78洗濯・理容・美容, 79その他生活関連, 80娯楽業）
O=教育・学習支援業（81学校教育, 82その他教育）
P=医療・福祉（83医療業, 84保健衛生, 85社会保険・社会福祉, 86介護事業）
Q=複合サービス事業（87郵便局, 88協同組合）
R=サービス業（他に分類されないもの）（88廃棄物処理, 89自動車整備, 90機械等修理, 91職業紹介, 92建物サービス業, 93その他事業サービス, 94政治・経済・文化, 95宗教, 96その他サービス）
S=公務

小分類コードは上記の例を参考に、中分類コードに1桁追加した3桁の数字で指定してください。`;

          const userPrompt = `URL: ${targetUrl}

ページタイトル: ${result.name || ''}
メタ説明: ${metaDesc}

クロールしたページのテキスト（${subUrls.length + 1}ページ分）:
${combinedText}`;

          const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            max_tokens: 1200,
            temperature: 0.1,
          });

          const raw = completion.choices[0]?.message?.content || '{}';
          return JSON.parse(raw) as Record<string, string>;
        } catch (err) {
          console.error("OpenAI scrape analysis failed:", err);
          return null;
        }
      })();

      // ── Step 7: Merge AI results ───────────────────────────────────────────
      if (aiResult) {
        const aiFields = ['name', 'postalCode', 'address', 'phone1', 'phone2', 'fax', 'email1', 'description'] as const;
        for (const field of aiFields) {
          const val = aiResult[field];
          if (val && typeof val === 'string' && val.trim()) {
            result[field] = val.trim();
          }
        }

        // Industry classification (major + middle + minor)
        if (aiResult.industryCategoryMajor && aiResult.industryCategoryMiddle) {
          const majorCode = String(aiResult.industryCategoryMajor).trim().toUpperCase();
          const middleCode = String(aiResult.industryCategoryMiddle).trim().padStart(2, '0');
          const rawMinor = aiResult.industryCategoryMinor ? String(aiResult.industryCategoryMinor).trim() : '';
          const minorCode = rawMinor.match(/^\d{3}$/) ? rawMinor : undefined;

          if (/^[A-T]$/.test(majorCode) && /^\d{2}$/.test(middleCode)) {
            result.suggestedIndustryCodes = [{
              majorCode,
              middleCode,
              ...(minorCode ? { minorCode } : {}),
              confidence: 10,
            }];
          }
        }
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

  // ===== SWOT Analysis Endpoints =====

  // GET /api/offices/:id/swot - Get SWOT analysis for an office
  app.get('/api/offices/:id/swot', isAuthenticated, async (req: any, res) => {
    try {
      const swot = await storage.getSwotAnalysis(req.params.id);
      if (!swot) return res.json(null);
      res.json(swot);
    } catch (error) {
      console.error("Error fetching SWOT:", error);
      res.status(500).json({ message: "Failed to fetch SWOT analysis" });
    }
  });

  // POST /api/offices/:id/swot/generate - AI-generate S/W/O/T
  app.post('/api/offices/:id/swot/generate', isAuthenticated, async (req: any, res) => {
    try {
      const office = await storage.getOffice(req.params.id);
      if (!office) return res.status(404).json({ message: "Office not found" });

      // Collect web content if URL is available
      let webContent = '';
      if (office.url) {
        try {
          let targetUrl = office.url.trim();
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
          }
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          const response = await safeFetch(targetUrl, controller.signal);
          clearTimeout(timeout);
          if (response.ok) {
            const buf = Buffer.from(await response.arrayBuffer());
            const ct = response.headers.get('content-type') || '';
            const ctMatch = ct.match(/charset=([^\s;]+)/i);
            let charset = ctMatch ? ctMatch[1].trim() : 'utf-8';
            if (!iconv.encodingExists(charset)) charset = 'utf-8';
            const html = iconv.decode(buf, charset);
            const $ = cheerio.load(html);
            $('script,style,noscript,iframe,svg,nav,footer,header').remove();
            webContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);
          }
        } catch { /* ignore */ }
      }

      const industryInfo = [
        office.industryCategoryMajor,
        office.industryCategoryMiddle,
        office.industryCategoryMinor,
        office.industry,
      ].filter(Boolean).join(' / ');

      const prompt = `あなたは中小企業経営診断の専門家です。以下の事業所情報をもとにSWOT分析を行ってください。

事業所情報：
- 事業所名: ${office.name}
- 業種: ${industryInfo || '不明'}
- 従業員数: ${office.employees ? office.employees + '名' : '不明'}
- 資本金: ${office.capital ? office.capital + '千円' : '不明'}
- 所在地: ${office.address || '不明'}
- 設立: ${office.foundedDate || '不明'}
- ウェブサイトURL: ${office.url || '未登録'}
${webContent ? `\nウェブサイト内容（一部）:\n${webContent}` : ''}

以下のJSON形式で回答してください。各項目は3〜5項目の文字列配列で、日本語で簡潔に記述してください（1項目あたり30〜60文字）。

{
  "strengths": ["強みの項目1", "強みの項目2", ...],
  "weaknesses": ["弱みの項目1", "弱みの項目2", ...],
  "opportunities": ["機会の項目1", "機会の項目2", ...],
  "threats": ["脅威の項目1", "脅威の項目2", ...]
}

強み・弱みは内部環境（企業固有の特性）、機会・脅威は外部環境（市場・業界・社会動向）を対象としてください。
ウェブサイト情報がある場合は内部環境の分析に活用し、外部環境は業種・規模に基づくマクロ・業界動向から推定してください。
JSONのみを返してください。`;

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      const normalizeSwotArray = (arr: unknown, field: string, min = 3, max = 5): string[] => {
        const items = (Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : []).slice(0, max);
        if (items.length < min) console.warn(`SWOT generate: '${field}' returned ${items.length} items (expected ${min}-${max})`);
        return items;
      };
      const swotData = {
        strengths: normalizeSwotArray(parsed.strengths, 'strengths'),
        weaknesses: normalizeSwotArray(parsed.weaknesses, 'weaknesses'),
        opportunities: normalizeSwotArray(parsed.opportunities, 'opportunities'),
        threats: normalizeSwotArray(parsed.threats, 'threats'),
      };

      const shortFields = Object.entries(swotData).filter(([, v]) => v.length < 3).map(([k]) => k);
      if (shortFields.length > 0) {
        return res.status(422).json({ message: `SWOT生成結果が不完全です (${shortFields.join(', ')} の項目数が不足、各3〜5項目必要)。再度お試しください。` });
      }

      const swot = await storage.upsertSwotAnalysis(req.params.id, swotData);
      res.json(swot);
    } catch (error) {
      console.error("Error generating SWOT:", error);
      res.status(500).json({ message: "SWOT分析の生成に失敗しました" });
    }
  });

  // POST /api/offices/:id/swot/augment - AI-add more items to existing SWOT
  app.post('/api/offices/:id/swot/augment', isAuthenticated, async (req: any, res) => {
    try {
      const office = await storage.getOffice(req.params.id);
      if (!office) return res.status(404).json({ message: "Office not found" });

      const existing = await storage.getSwotAnalysis(req.params.id);
      if (!existing) return res.status(404).json({ message: "先にSWOT分析を作成してください" });

      // Collect web content if URL is available
      let webContent = '';
      if (office.url) {
        try {
          let targetUrl = office.url.trim();
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
          }
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          const response = await safeFetch(targetUrl, controller.signal);
          clearTimeout(timeout);
          if (response.ok) {
            const buf = Buffer.from(await response.arrayBuffer());
            const ct = response.headers.get('content-type') || '';
            const ctMatch = ct.match(/charset=([^\s;]+)/i);
            let charset = ctMatch ? ctMatch[1].trim() : 'utf-8';
            if (!iconv.encodingExists(charset)) charset = 'utf-8';
            const html = iconv.decode(buf, charset);
            const $ = cheerio.load(html);
            $('script,style,noscript,iframe,svg,nav,footer,header').remove();
            webContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);
          }
        } catch { /* ignore */ }
      }

      const industryInfo = [
        office.industryCategoryMajor,
        office.industryCategoryMiddle,
        office.industryCategoryMinor,
        office.industry,
      ].filter(Boolean).join(' / ');

      const formatList = (arr: unknown) =>
        (Array.isArray(arr) ? arr : []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  （なし）';

      const prompt = `あなたは中小企業経営診断の専門家です。以下の事業所情報と既存のSWOT分析をもとに、各カテゴリに追加すべき新しい視点・項目を提案してください。

事業所情報：
- 事業所名: ${office.name}
- 業種: ${industryInfo || '不明'}
- 従業員数: ${office.employees ? office.employees + '名' : '不明'}
- 資本金: ${office.capital ? office.capital + '千円' : '不明'}
- 所在地: ${office.address || '不明'}
- 設立: ${office.foundedDate || '不明'}
- ウェブサイトURL: ${office.url || '未登録'}
${webContent ? `\nウェブサイト内容（一部）:\n${webContent}` : ''}

【既存のSWOT項目】

強み (Strengths) — 現在の項目:
${formatList(existing.strengths)}

弱み (Weaknesses) — 現在の項目:
${formatList(existing.weaknesses)}

機会 (Opportunities) — 現在の項目:
${formatList(existing.opportunities)}

脅威 (Threats) — 現在の項目:
${formatList(existing.threats)}

【指示】
上記の既存項目と重複しない、まだカバーされていない新しい視点から、各カテゴリに1〜3項目を追加してください。
外部情報（業界動向・市場環境・社会変化）も考慮し、ウェブサイト情報があれば内部分析にも活用してください。
1項目あたり30〜60文字で日本語で記述してください。

以下のJSON形式で追加項目のみを返してください（既存項目は含めないでください）:

{
  "strengths": ["新しい強みの追加項目", ...],
  "weaknesses": ["新しい弱みの追加項目", ...],
  "opportunities": ["新しい機会の追加項目", ...],
  "threats": ["新しい脅威の追加項目", ...]
}

追加項目がない場合は空配列 [] を返してください。JSONのみを返してください。`;

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      const toAddArray = (arr: unknown, max = 3): string[] =>
        (Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : []).slice(0, max);

      const additions = {
        strengths: toAddArray(parsed.strengths),
        weaknesses: toAddArray(parsed.weaknesses),
        opportunities: toAddArray(parsed.opportunities),
        threats: toAddArray(parsed.threats),
      };

      // Merge: existing + new additions (no duplicates)
      const mergeUnique = (existing: unknown, additions: string[]): string[] => {
        const base = Array.isArray(existing) ? existing.filter((s): s is string => typeof s === 'string') : [];
        const newItems = additions.filter(a => !base.some(b => b.trim() === a.trim()));
        return [...base, ...newItems];
      };

      const merged = {
        strengths: mergeUnique(existing.strengths, additions.strengths),
        weaknesses: mergeUnique(existing.weaknesses, additions.weaknesses),
        opportunities: mergeUnique(existing.opportunities, additions.opportunities),
        threats: mergeUnique(existing.threats, additions.threats),
      };

      const totalAdded = Object.values(additions).reduce((sum, arr) => sum + arr.length, 0);

      const updated = await storage.upsertSwotAnalysis(req.params.id, merged);
      res.json({ swot: updated, added: additions, totalAdded });
    } catch (error) {
      console.error("Error augmenting SWOT:", error);
      res.status(500).json({ message: "SWOT項目の追加に失敗しました" });
    }
  });

  // POST /api/offices/:id/swot/augment-cross - AI-add items to a specific cross-SWOT cell
  app.post('/api/offices/:id/swot/augment-cross', isAuthenticated, async (req: any, res) => {
    const VALID_FIELDS = ['soStrategies', 'woStrategies', 'stStrategies', 'wtStrategies'] as const;
    type CrossField = typeof VALID_FIELDS[number];

    try {
      const field = req.body?.field as string;
      if (!VALID_FIELDS.includes(field as CrossField)) {
        return res.status(400).json({ message: "field must be one of: soStrategies, woStrategies, stStrategies, wtStrategies" });
      }

      const office = await storage.getOffice(req.params.id);
      if (!office) return res.status(404).json({ message: "Office not found" });

      const existing = await storage.getSwotAnalysis(req.params.id);
      if (!existing) return res.status(404).json({ message: "先にSWOT分析を作成してください" });

      const formatList = (arr: unknown) =>
        (Array.isArray(arr) ? arr : []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  （なし）';

      const cellMeta: Record<CrossField, { label: string; axes: string }> = {
        soStrategies: { label: '積極戦略 (SO)', axes: '強み(S)×機会(O)：強みを活かして機会を掴む戦略' },
        woStrategies: { label: '改善戦略 (WO)', axes: '弱み(W)×機会(O)：弱みを補強して機会を捉える戦略' },
        stStrategies: { label: '差別化戦略 (ST)', axes: '強み(S)×脅威(T)：強みを使って脅威に対抗する戦略' },
        wtStrategies: { label: '致命傷回避 (WT)', axes: '弱み(W)×脅威(T)：弱みと脅威の複合リスクを最小化する戦略' },
      };

      const meta = cellMeta[field as CrossField];

      const prompt = `あなたは中小企業経営診断の専門家です。以下のSWOT分析をもとに、「${meta.label}」セルに追加すべき新しい戦略を提案してください。

【定義】${meta.axes}

【事業所名】${office.name}

【強み(S)】
${formatList(existing.strengths)}

【弱み(W)】
${formatList(existing.weaknesses)}

【機会(O)】
${formatList(existing.opportunities)}

【脅威(T)】
${formatList(existing.threats)}

【既存の${meta.label}】
${formatList(existing[field as CrossField])}

【指示】
上記の既存戦略と重複しない、新しい「${meta.label}」の戦略を1〜2項目追加してください。
定義に従い、該当する強み/弱みと機会/脅威を組み合わせた具体的な戦略を記述してください。
1項目あたり30〜70文字、日本語で記述してください。

以下のJSON形式で返してください:
{ "items": ["新戦略1", "新戦略2"] }
JSONのみを返してください。`;

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      const newItems = (Array.isArray(parsed.items) ? parsed.items : [])
        .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 2);

      const existingItems = Array.isArray(existing[field as CrossField])
        ? (existing[field as CrossField] as string[])
        : [];
      const merged = [...existingItems, ...newItems.filter((n: string) => !existingItems.some(e => e.trim() === n.trim()))];

      const updated = await storage.upsertSwotAnalysis(req.params.id, { [field]: merged });
      res.json({ swot: updated, added: newItems, field });
    } catch (error) {
      console.error("Error augmenting cross SWOT cell:", error);
      res.status(500).json({ message: "クロスSWOT項目のAI追加に失敗しました" });
    }
  });

  // POST /api/offices/:id/swot/cross - AI-generate cross SWOT strategies
  app.post('/api/offices/:id/swot/cross', isAuthenticated, async (req: any, res) => {
    try {
      const swot = await storage.getSwotAnalysis(req.params.id);
      if (!swot) return res.status(404).json({ message: "先にSWOT分析を生成してください" });

      const hasContent = (arr: unknown) => Array.isArray(arr) && arr.some(s => typeof s === 'string' && s.trim().length > 0);
      if (!hasContent(swot.strengths) && !hasContent(swot.weaknesses) && !hasContent(swot.opportunities) && !hasContent(swot.threats)) {
        return res.status(400).json({ message: "クロスSWOT生成にはSWOT項目が1つ以上必要です。先にSWOT分析を行ってください。" });
      }

      const prompt = `あなたは中小企業経営診断の専門家です。以下のSWOT分析をもとに、クロスSWOT戦略を作成してください。

【強み(S)】
${(swot.strengths as string[]).map((s, i) => `${i + 1}. ${s}`).join('\n')}

【弱み(W)】
${(swot.weaknesses as string[]).map((s, i) => `${i + 1}. ${s}`).join('\n')}

【機会(O)】
${(swot.opportunities as string[]).map((s, i) => `${i + 1}. ${s}`).join('\n')}

【脅威(T)】
${(swot.threats as string[]).map((s, i) => `${i + 1}. ${s}`).join('\n')}

以下のJSON形式で各戦略を3〜4項目の文字列配列として返してください（1項目あたり30〜70文字）。

{
  "soStrategies": ["SO積極戦略1", ...],
  "woStrategies": ["WO改善戦略1", ...],
  "stStrategies": ["ST差別化戦略1", ...],
  "wtStrategies": ["WT致命傷回避戦略1", ...]
}

- SO戦略: 強みを活かして機会を掴む積極的な戦略
- WO戦略: 弱みを改善して機会を活用する戦略
- ST戦略: 強みを活かして脅威を回避する差別化戦略
- WT戦略: 弱みと脅威を最小化する防衛・縮小戦略
JSONのみを返してください。`;

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      const normalizeCrossArray = (arr: unknown, field: string, min = 3, max = 4): string[] => {
        const items = (Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : []).slice(0, max);
        if (items.length < min) console.warn(`Cross-SWOT generate: '${field}' returned ${items.length} items (expected ${min}-${max})`);
        return items;
      };
      const crossData = {
        soStrategies: normalizeCrossArray(parsed.soStrategies, 'soStrategies'),
        woStrategies: normalizeCrossArray(parsed.woStrategies, 'woStrategies'),
        stStrategies: normalizeCrossArray(parsed.stStrategies, 'stStrategies'),
        wtStrategies: normalizeCrossArray(parsed.wtStrategies, 'wtStrategies'),
      };

      const shortStrategies = Object.entries(crossData).filter(([, v]) => v.length < 3).map(([k]) => k);
      if (shortStrategies.length > 0) {
        return res.status(422).json({ message: `クロスSWOT生成結果が不完全です (${shortStrategies.join(', ')} の項目数が不足、各3〜4項目必要)。再度お試しください。` });
      }

      const updated = await storage.upsertSwotAnalysis(req.params.id, crossData);
      res.json(updated);
    } catch (error) {
      console.error("Error generating cross SWOT:", error);
      res.status(500).json({ message: "クロスSWOT生成に失敗しました" });
    }
  });

  // PUT /api/offices/:id/swot - Save/update SWOT manually
  app.put('/api/offices/:id/swot', isAuthenticated, async (req: any, res) => {
    try {
      const partial = insertSwotAnalysisSchema.omit({ officeId: true }).partial().safeParse(req.body);
      if (!partial.success) {
        return res.status(400).json({ message: "リクエストデータが不正です", errors: partial.error.errors });
      }
      const swot = await storage.upsertSwotAnalysis(req.params.id, partial.data);
      res.json(swot);
    } catch (error) {
      console.error("Error saving SWOT:", error);
      res.status(500).json({ message: "SWOT分析の保存に失敗しました" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
