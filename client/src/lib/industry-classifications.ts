export interface MajorCategory {
  code: string;
  name: string;
}

export interface MiddleCategory {
  code: string;
  name: string;
  majorCode: string;
}

export interface MinorCategory {
  code: string;
  name: string;
  middleCode: string;
}

export const MAJOR_CATEGORIES: MajorCategory[] = [
  { code: "A", name: "農業，林業" },
  { code: "B", name: "漁業" },
  { code: "C", name: "鉱業，採石業，砂利採取業" },
  { code: "D", name: "建設業" },
  { code: "E", name: "製造業" },
  { code: "F", name: "電気・ガス・熱供給・水道業" },
  { code: "G", name: "情報通信業" },
  { code: "H", name: "運輸業，郵便業" },
  { code: "I", name: "卸売業，小売業" },
  { code: "J", name: "金融業，保険業" },
  { code: "K", name: "不動産業，物品賃貸業" },
  { code: "L", name: "学術研究，専門・技術サービス業" },
  { code: "M", name: "宿泊業，飲食サービス業" },
  { code: "N", name: "生活関連サービス業，娯楽業" },
  { code: "O", name: "教育，学習支援業" },
  { code: "P", name: "医療，福祉" },
  { code: "Q", name: "複合サービス事業" },
  { code: "R", name: "サービス業（他に分類されないもの）" },
  { code: "S", name: "公務（他に分類されるものを除く）" },
  { code: "T", name: "分類不能の産業" },
];

export const MIDDLE_CATEGORIES: MiddleCategory[] = [
  // A 農業，林業
  { code: "01", name: "農業", majorCode: "A" },
  { code: "02", name: "林業", majorCode: "A" },
  // B 漁業
  { code: "03", name: "漁業（水産養殖業を除く）", majorCode: "B" },
  { code: "04", name: "水産養殖業", majorCode: "B" },
  // C 鉱業，採石業，砂利採取業
  { code: "05", name: "鉱業，採石業，砂利採取業", majorCode: "C" },
  // D 建設業
  { code: "06", name: "総合工事業", majorCode: "D" },
  { code: "07", name: "職別工事業（設備工事業を除く）", majorCode: "D" },
  { code: "08", name: "設備工事業", majorCode: "D" },
  // E 製造業
  { code: "09", name: "食料品製造業", majorCode: "E" },
  { code: "10", name: "飲料・たばこ・飼料製造業", majorCode: "E" },
  { code: "11", name: "繊維工業", majorCode: "E" },
  { code: "12", name: "木材・木製品製造業（家具を除く）", majorCode: "E" },
  { code: "13", name: "家具・装備品製造業", majorCode: "E" },
  { code: "14", name: "パルプ・紙・紙加工品製造業", majorCode: "E" },
  { code: "15", name: "印刷・同関連業", majorCode: "E" },
  { code: "16", name: "化学工業", majorCode: "E" },
  { code: "17", name: "石油製品・石炭製品製造業", majorCode: "E" },
  { code: "18", name: "プラスチック製品製造業（別掲を除く）", majorCode: "E" },
  { code: "19", name: "ゴム製品製造業", majorCode: "E" },
  { code: "20", name: "なめし革・同製品・毛皮製造業", majorCode: "E" },
  { code: "21", name: "窯業・土石製品製造業", majorCode: "E" },
  { code: "22", name: "鉄鋼業", majorCode: "E" },
  { code: "23", name: "非鉄金属製造業", majorCode: "E" },
  { code: "24", name: "金属製品製造業", majorCode: "E" },
  { code: "25", name: "はん用機械器具製造業", majorCode: "E" },
  { code: "26", name: "生産用機械器具製造業", majorCode: "E" },
  { code: "27", name: "業務用機械器具製造業", majorCode: "E" },
  { code: "28", name: "電子部品・デバイス・電子回路製造業", majorCode: "E" },
  { code: "29", name: "電気機械器具製造業", majorCode: "E" },
  { code: "30", name: "情報通信機械器具製造業", majorCode: "E" },
  { code: "31", name: "輸送用機械器具製造業", majorCode: "E" },
  { code: "32", name: "その他の製造業", majorCode: "E" },
  // F 電気・ガス・熱供給・水道業
  { code: "33", name: "電気業", majorCode: "F" },
  { code: "34", name: "ガス業", majorCode: "F" },
  { code: "35", name: "熱供給業", majorCode: "F" },
  { code: "36", name: "水道業", majorCode: "F" },
  // G 情報通信業
  { code: "37", name: "通信業", majorCode: "G" },
  { code: "38", name: "放送業", majorCode: "G" },
  { code: "39", name: "情報サービス業", majorCode: "G" },
  { code: "40", name: "インターネット附随サービス業", majorCode: "G" },
  { code: "41", name: "映像・音声・文字情報制作業", majorCode: "G" },
  // H 運輸業，郵便業
  { code: "42", name: "鉄道業", majorCode: "H" },
  { code: "43", name: "道路旅客運送業", majorCode: "H" },
  { code: "44", name: "道路貨物運送業", majorCode: "H" },
  { code: "45", name: "水運業", majorCode: "H" },
  { code: "46", name: "航空運輸業", majorCode: "H" },
  { code: "47", name: "倉庫業", majorCode: "H" },
  { code: "48", name: "運輸に附帯するサービス業", majorCode: "H" },
  { code: "49", name: "郵便業（信書便事業を含む）", majorCode: "H" },
  // I 卸売業，小売業
  { code: "50", name: "各種商品卸売業", majorCode: "I" },
  { code: "51", name: "繊維・衣服等卸売業", majorCode: "I" },
  { code: "52", name: "飲食料品卸売業", majorCode: "I" },
  { code: "53", name: "建築材料，鉱物・金属材料等卸売業", majorCode: "I" },
  { code: "54", name: "機械器具卸売業", majorCode: "I" },
  { code: "55", name: "その他の卸売業", majorCode: "I" },
  { code: "56", name: "各種商品小売業", majorCode: "I" },
  { code: "57", name: "織物・衣服・身の回り品小売業", majorCode: "I" },
  { code: "58", name: "飲食料品小売業", majorCode: "I" },
  { code: "59", name: "機械器具小売業", majorCode: "I" },
  { code: "60", name: "その他の小売業", majorCode: "I" },
  { code: "61", name: "無店舗小売業", majorCode: "I" },
  // J 金融業，保険業
  { code: "62", name: "銀行業", majorCode: "J" },
  { code: "63", name: "協同組織金融業", majorCode: "J" },
  { code: "64", name: "貸金業，クレジットカード業等非預金信用機関", majorCode: "J" },
  { code: "65", name: "金融商品取引業，商品先物取引業", majorCode: "J" },
  { code: "66", name: "補助的金融業等", majorCode: "J" },
  { code: "67", name: "保険業（保険媒介代理業，保険サービス業を含む）", majorCode: "J" },
  // K 不動産業，物品賃貸業
  { code: "68", name: "不動産取引業", majorCode: "K" },
  { code: "69", name: "不動産賃貸業・管理業", majorCode: "K" },
  { code: "70", name: "物品賃貸業", majorCode: "K" },
  // L 学術研究，専門・技術サービス業
  { code: "71", name: "学術・開発研究機関", majorCode: "L" },
  { code: "72", name: "専門サービス業（他に分類されないもの）", majorCode: "L" },
  { code: "73", name: "広告業", majorCode: "L" },
  { code: "74", name: "技術サービス業（他に分類されないもの）", majorCode: "L" },
  // M 宿泊業，飲食サービス業
  { code: "75", name: "宿泊業", majorCode: "M" },
  { code: "76", name: "飲食店", majorCode: "M" },
  { code: "77", name: "持ち帰り・配達飲食サービス業", majorCode: "M" },
  // N 生活関連サービス業，娯楽業
  { code: "78", name: "洗濯・理容・美容・浴場業", majorCode: "N" },
  { code: "79", name: "その他の生活関連サービス業", majorCode: "N" },
  { code: "80", name: "娯楽業", majorCode: "N" },
  // O 教育，学習支援業
  { code: "81", name: "学校教育", majorCode: "O" },
  { code: "82", name: "その他の教育，学習支援業", majorCode: "O" },
  // P 医療，福祉
  { code: "83", name: "医療業", majorCode: "P" },
  { code: "84", name: "保健衛生", majorCode: "P" },
  { code: "85", name: "社会保険・社会福祉・介護事業", majorCode: "P" },
  // Q 複合サービス事業
  { code: "86", name: "郵便局", majorCode: "Q" },
  { code: "87", name: "協同組合（他に分類されないもの）", majorCode: "Q" },
  // R サービス業（他に分類されないもの）
  { code: "88", name: "廃棄物処理業", majorCode: "R" },
  { code: "89", name: "自動車整備業", majorCode: "R" },
  { code: "90", name: "機械等修理業（別掲を除く）", majorCode: "R" },
  { code: "91", name: "職業紹介・労働者派遣業", majorCode: "R" },
  { code: "92", name: "その他の事業サービス業", majorCode: "R" },
  { code: "93", name: "政治・経済・文化団体", majorCode: "R" },
  { code: "94", name: "宗教", majorCode: "R" },
  { code: "95", name: "その他のサービス業", majorCode: "R" },
  { code: "96", name: "外国公務", majorCode: "R" },
  // S 公務
  { code: "97", name: "国家公務", majorCode: "S" },
  { code: "98", name: "地方公務", majorCode: "S" },
  // T 分類不能の産業
  { code: "99", name: "分類不能の産業", majorCode: "T" },
];

export const MINOR_CATEGORIES: MinorCategory[] = [
  // 01 農業
  { code: "011", name: "耕種農業", middleCode: "01" },
  { code: "012", name: "畜産農業", middleCode: "01" },
  { code: "013", name: "農業サービス業（別掲を除く）", middleCode: "01" },
  { code: "014", name: "きのこ類の栽培業", middleCode: "01" },
  // 02 林業
  { code: "021", name: "育林業", middleCode: "02" },
  { code: "022", name: "素材生産業", middleCode: "02" },
  { code: "023", name: "特用林産物生産業（きのこ類の栽培を除く）", middleCode: "02" },
  { code: "024", name: "林業サービス業", middleCode: "02" },
  { code: "025", name: "薪炭製造業", middleCode: "02" },
  // 03 漁業
  { code: "031", name: "海面漁業", middleCode: "03" },
  { code: "032", name: "内水面漁業", middleCode: "03" },
  { code: "033", name: "漁業サービス業", middleCode: "03" },
  // 04 水産養殖業
  { code: "041", name: "海面養殖業", middleCode: "04" },
  { code: "042", name: "内水面養殖業", middleCode: "04" },
  { code: "043", name: "水産養殖サービス業", middleCode: "04" },
  // 05 鉱業
  { code: "051", name: "金属鉱業", middleCode: "05" },
  { code: "052", name: "石炭・亜炭鉱業", middleCode: "05" },
  { code: "053", name: "原油・天然ガス鉱業", middleCode: "05" },
  { code: "054", name: "採石業，砂・砂利・玉石採取業", middleCode: "05" },
  { code: "055", name: "窯業原料鉱業", middleCode: "05" },
  { code: "059", name: "その他の鉱業，採石業，砂利採取業", middleCode: "05" },
  // 06 総合工事業
  { code: "061", name: "一般土木建築工事業", middleCode: "06" },
  { code: "062", name: "土木工事業（舗装工事業を除く）", middleCode: "06" },
  { code: "063", name: "舗装工事業", middleCode: "06" },
  { code: "064", name: "建築工事業（木造建築工事業を除く）", middleCode: "06" },
  { code: "065", name: "木造建築工事業", middleCode: "06" },
  { code: "066", name: "建築リフォーム工事業（建築工事業を除く）", middleCode: "06" },
  { code: "067", name: "解体工事業", middleCode: "06" },
  // 07 職別工事業
  { code: "071", name: "大工工事業", middleCode: "07" },
  { code: "072", name: "とび・土工・コンクリート工事業", middleCode: "07" },
  { code: "073", name: "鉄骨・鉄筋工事業", middleCode: "07" },
  { code: "074", name: "石工・れんが・タイル・ブロック工事業", middleCode: "07" },
  { code: "075", name: "左官工事業", middleCode: "07" },
  { code: "076", name: "板金・金物工事業", middleCode: "07" },
  { code: "077", name: "塗装工事業", middleCode: "07" },
  { code: "078", name: "床・内装工事業", middleCode: "07" },
  { code: "079", name: "その他の職別工事業", middleCode: "07" },
  // 08 設備工事業
  { code: "081", name: "電気工事業", middleCode: "08" },
  { code: "082", name: "電気通信・信号装置工事業", middleCode: "08" },
  { code: "083", name: "管工事業（さく井工事業を除く）", middleCode: "08" },
  { code: "084", name: "機械器具設置工事業", middleCode: "08" },
  { code: "085", name: "熱絶縁工事業", middleCode: "08" },
  { code: "086", name: "さく井工事業", middleCode: "08" },
  { code: "089", name: "その他の設備工事業", middleCode: "08" },
  // 09 食料品製造業
  { code: "091", name: "畜産食料品製造業", middleCode: "09" },
  { code: "092", name: "水産食料品製造業", middleCode: "09" },
  { code: "093", name: "野菜缶詰・果実缶詰・農産保存食料品製造業", middleCode: "09" },
  { code: "094", name: "調味料製造業", middleCode: "09" },
  { code: "095", name: "糖類製造業", middleCode: "09" },
  { code: "096", name: "精穀・製粉業", middleCode: "09" },
  { code: "097", name: "パン・菓子製造業", middleCode: "09" },
  { code: "098", name: "動植物油脂製造業", middleCode: "09" },
  { code: "099", name: "その他の食料品製造業", middleCode: "09" },
  // 10 飲料・たばこ・飼料製造業
  { code: "101", name: "清涼飲料製造業", middleCode: "10" },
  { code: "102", name: "酒類製造業", middleCode: "10" },
  { code: "103", name: "茶・コーヒー製造業（清涼飲料を除く）", middleCode: "10" },
  { code: "104", name: "製氷業", middleCode: "10" },
  { code: "105", name: "たばこ製造業", middleCode: "10" },
  { code: "106", name: "飼料・有機質肥料製造業", middleCode: "10" },
  // 11 繊維工業
  { code: "111", name: "製糸業，紡績業，化学繊維・ねん糸等製造業", middleCode: "11" },
  { code: "112", name: "織物業", middleCode: "11" },
  { code: "113", name: "ニット生地製造業", middleCode: "11" },
  { code: "114", name: "染色整理業", middleCode: "11" },
  { code: "115", name: "綱・網・レース・繊維粗製品製造業", middleCode: "11" },
  { code: "116", name: "外衣・シャツ製造業（和式を除く）", middleCode: "11" },
  { code: "117", name: "下着類製造業", middleCode: "11" },
  { code: "118", name: "和装製品・その他の衣服・繊維製品製造業", middleCode: "11" },
  { code: "119", name: "その他の繊維工業製品製造業", middleCode: "11" },
  // 12 木材・木製品製造業
  { code: "121", name: "製材業，木製品製造業", middleCode: "12" },
  { code: "122", name: "造作材・合板・建築用組立材料製造業", middleCode: "12" },
  { code: "123", name: "木製容器製造業（竹，とうを含む）", middleCode: "12" },
  { code: "129", name: "その他の木材・木製品製造業", middleCode: "12" },
  // 13 家具・装備品製造業
  { code: "131", name: "家具製造業", middleCode: "13" },
  { code: "132", name: "宗教用具製造業", middleCode: "13" },
  { code: "133", name: "建具製造業", middleCode: "13" },
  { code: "134", name: "家庭用金属製品製造業", middleCode: "13" },
  { code: "139", name: "その他の家具・装備品製造業", middleCode: "13" },
  // 14 パルプ・紙・紙加工品製造業
  { code: "141", name: "パルプ製造業", middleCode: "14" },
  { code: "142", name: "紙製造業", middleCode: "14" },
  { code: "143", name: "加工紙製造業", middleCode: "14" },
  { code: "144", name: "紙製品製造業", middleCode: "14" },
  { code: "145", name: "紙製容器製造業", middleCode: "14" },
  { code: "149", name: "その他のパルプ・紙・紙加工品製造業", middleCode: "14" },
  // 15 印刷・同関連業
  { code: "151", name: "印刷業", middleCode: "15" },
  { code: "152", name: "製版業", middleCode: "15" },
  { code: "153", name: "製本業，印刷物加工業", middleCode: "15" },
  { code: "154", name: "印刷関連サービス業", middleCode: "15" },
  // 16 化学工業
  { code: "161", name: "化学肥料製造業", middleCode: "16" },
  { code: "162", name: "無機化学工業製品製造業", middleCode: "16" },
  { code: "163", name: "有機化学工業製品製造業", middleCode: "16" },
  { code: "164", name: "油脂加工製品・石けん・合成洗剤・界面活性剤・塗料製造業", middleCode: "16" },
  { code: "165", name: "医薬品製造業", middleCode: "16" },
  { code: "166", name: "化粧品・歯磨・その他の化粧用調整品製造業", middleCode: "16" },
  { code: "167", name: "農薬製造業", middleCode: "16" },
  { code: "168", name: "火薬類製造業", middleCode: "16" },
  { code: "169", name: "その他の化学工業", middleCode: "16" },
  // 17 石油製品・石炭製品製造業
  { code: "171", name: "石油精製業", middleCode: "17" },
  { code: "172", name: "潤滑油・グリース製造業（石油精製業によるものを除く）", middleCode: "17" },
  { code: "173", name: "コークス製造業", middleCode: "17" },
  { code: "179", name: "その他の石油製品・石炭製品製造業", middleCode: "17" },
  // 18 プラスチック製品製造業
  { code: "181", name: "プラスチックフィルム・シート・床材・合成皮革製造業", middleCode: "18" },
  { code: "182", name: "工業用プラスチック製品製造業", middleCode: "18" },
  { code: "183", name: "発泡・強化プラスチック製品製造業", middleCode: "18" },
  { code: "184", name: "プラスチック製容器製造業", middleCode: "18" },
  { code: "185", name: "日用プラスチック製品製造業（プラスチック製容器を除く）", middleCode: "18" },
  { code: "189", name: "その他のプラスチック製品製造業", middleCode: "18" },
  // 19 ゴム製品製造業
  { code: "191", name: "タイヤ・チューブ製造業", middleCode: "19" },
  { code: "192", name: "ゴム製・プラスチック製履物・同附属品製造業", middleCode: "19" },
  { code: "199", name: "その他のゴム製品製造業", middleCode: "19" },
  // 20 なめし革・同製品・毛皮製造業
  { code: "201", name: "なめし革製造業", middleCode: "20" },
  { code: "202", name: "工業用革製品製造業（手袋を含む）", middleCode: "20" },
  { code: "203", name: "革製履物用材料・同履物製造業", middleCode: "20" },
  { code: "204", name: "革製手提げ袋製造業", middleCode: "20" },
  { code: "205", name: "その他の革製品製造業", middleCode: "20" },
  { code: "206", name: "毛皮製造業", middleCode: "20" },
  // 21 窯業・土石製品製造業
  { code: "211", name: "ガラス・同製品製造業", middleCode: "21" },
  { code: "212", name: "セメント・同製品製造業", middleCode: "21" },
  { code: "213", name: "建設用粘土製品製造業（陶磁器製を除く）", middleCode: "21" },
  { code: "214", name: "陶磁器・同関連製品製造業", middleCode: "21" },
  { code: "215", name: "耐火物製造業", middleCode: "21" },
  { code: "216", name: "炭素・黒鉛製品製造業", middleCode: "21" },
  { code: "217", name: "研磨材製造業", middleCode: "21" },
  { code: "219", name: "その他の窯業・土石製品製造業", middleCode: "21" },
  // 22 鉄鋼業
  { code: "221", name: "製鉄業", middleCode: "22" },
  { code: "222", name: "製鋼・製鋼圧延業", middleCode: "22" },
  { code: "223", name: "製鋼を行わない鋼材製造業（表面処理鋼材を除く）", middleCode: "22" },
  { code: "224", name: "表面処理鋼材製造業", middleCode: "22" },
  { code: "225", name: "鉄素形材製造業", middleCode: "22" },
  { code: "229", name: "その他の鉄鋼業", middleCode: "22" },
  // 23 非鉄金属製造業
  { code: "231", name: "非鉄金属第１次製錬・精製業", middleCode: "23" },
  { code: "232", name: "非鉄金属第２次製錬・精製業（非鉄金属合金製造業を含む）", middleCode: "23" },
  { code: "233", name: "非鉄金属・同合金圧延業（抽伸，押出しを含む）", middleCode: "23" },
  { code: "234", name: "電線・ケーブル製造業", middleCode: "23" },
  { code: "235", name: "非鉄金属素形材製造業", middleCode: "23" },
  { code: "239", name: "その他の非鉄金属製造業", middleCode: "23" },
  // 24 金属製品製造業
  { code: "241", name: "ブリキ缶・その他のめっき板等製品製造業", middleCode: "24" },
  { code: "242", name: "洋食器・刃物・手道具・金物類製造業", middleCode: "24" },
  { code: "243", name: "暖房・調理等装置，配管工事用附属品製造業", middleCode: "24" },
  { code: "244", name: "建設用・建築用金属製品製造業（製缶板金業を含む）", middleCode: "24" },
  { code: "245", name: "金属素形材製品製造業", middleCode: "24" },
  { code: "246", name: "金属被覆・彫刻業，熱処理業（ほうろう鉄器を除く）", middleCode: "24" },
  { code: "247", name: "金属線製品製造業（ねじ類を除く）", middleCode: "24" },
  { code: "248", name: "ボルト・ナット・リベット・小ねじ・木ねじ等製造業", middleCode: "24" },
  { code: "249", name: "その他の金属製品製造業", middleCode: "24" },
  // 25 はん用機械器具製造業
  { code: "251", name: "ボイラ・原動機製造業", middleCode: "25" },
  { code: "252", name: "ポンプ・圧縮機器製造業（油圧・空圧機器を含む）", middleCode: "25" },
  { code: "253", name: "一般産業用機械・装置製造業", middleCode: "25" },
  { code: "254", name: "その他のはん用機械・同部分品・附属品製造業", middleCode: "25" },
  { code: "255", name: "流体動力機械器具製造業", middleCode: "25" },
  { code: "256", name: "搬送機械器具製造業", middleCode: "25" },
  // 26 生産用機械器具製造業
  { code: "261", name: "農業用機械製造業（農業用トラクタを含む）", middleCode: "26" },
  { code: "262", name: "建設機械・鉱山機械製造業", middleCode: "26" },
  { code: "263", name: "繊維機械製造業", middleCode: "26" },
  { code: "264", name: "生活関連産業用機械製造業", middleCode: "26" },
  { code: "265", name: "基礎素材産業用機械製造業", middleCode: "26" },
  { code: "266", name: "金属加工機械製造業", middleCode: "26" },
  { code: "269", name: "その他の生産用機械・同部分品製造業", middleCode: "26" },
  // 27 業務用機械器具製造業
  { code: "271", name: "事務用機械器具製造業", middleCode: "27" },
  { code: "272", name: "サービス用・娯楽用機械器具製造業", middleCode: "27" },
  { code: "273", name: "計量器・測定器・分析機器・試験機・測量機械器具・理化学機械器具製造業", middleCode: "27" },
  { code: "274", name: "医療用機械器具・医療用品製造業", middleCode: "27" },
  { code: "275", name: "光学機械器具・レンズ製造業", middleCode: "27" },
  { code: "276", name: "武器製造業", middleCode: "27" },
  { code: "277", name: "その他の業務用機械器具製造業", middleCode: "27" },
  // 28 電子部品・デバイス・電子回路製造業
  { code: "281", name: "電子デバイス製造業", middleCode: "28" },
  { code: "282", name: "電子部品製造業", middleCode: "28" },
  { code: "283", name: "記録メディア製造業", middleCode: "28" },
  { code: "284", name: "電子回路製造業", middleCode: "28" },
  { code: "285", name: "ユニット部品製造業", middleCode: "28" },
  { code: "286", name: "半導体素子製造業（集積回路を除く）", middleCode: "28" },
  { code: "287", name: "集積回路製造業", middleCode: "28" },
  { code: "289", name: "その他の電子部品・デバイス・電子回路製造業", middleCode: "28" },
  // 28.5 新増設（情報通信機械）
  // 30 情報通信機械器具製造業
  { code: "301", name: "通信機械器具・同関連機械器具製造業", middleCode: "30" },
  { code: "302", name: "映像・音響機械器具製造業", middleCode: "30" },
  { code: "303", name: "電子計算機・同附属装置製造業", middleCode: "30" },
  { code: "304", name: "ストレージ・周辺機器製造業", middleCode: "30" },
  { code: "309", name: "その他の情報通信機械器具製造業", middleCode: "30" },
  // 29 電気機械器具製造業
  { code: "291", name: "発電用・送電用・配電用電気機械器具製造業", middleCode: "29" },
  { code: "292", name: "産業用電気機械器具製造業（車両用，船舶用を除く）", middleCode: "29" },
  { code: "293", name: "民生用電気機械器具製造業", middleCode: "29" },
  { code: "294", name: "電球・電気照明器具製造業", middleCode: "29" },
  { code: "295", name: "電池製造業", middleCode: "29" },
  { code: "296", name: "電子応用装置製造業", middleCode: "29" },
  { code: "297", name: "電気計測器製造業", middleCode: "29" },
  { code: "298", name: "電気照明装置・電灯器具製造業", middleCode: "29" },
  { code: "299", name: "その他の電気機械器具製造業", middleCode: "29" },
  // 31 輸送用機械器具製造業
  { code: "311", name: "自動車・同附属品製造業", middleCode: "31" },
  { code: "312", name: "鉄道車両・同部分品製造業", middleCode: "31" },
  { code: "313", name: "船舶製造・修理業，舶用機関製造業", middleCode: "31" },
  { code: "314", name: "航空機・同附属品製造業", middleCode: "31" },
  { code: "315", name: "産業用運搬車両・同部分品・附属品製造業", middleCode: "31" },
  { code: "316", name: "自動二輪車・自転車・同部分品製造業", middleCode: "31" },
  { code: "319", name: "その他の輸送用機械器具製造業", middleCode: "31" },
  // 32 その他の製造業
  { code: "321", name: "貴金属・宝石製品製造業", middleCode: "32" },
  { code: "322", name: "装身具・装飾品・ボタン・同関連品製造業（貴金属・宝石製を除く）", middleCode: "32" },
  { code: "323", name: "時計・同部分品製造業", middleCode: "32" },
  { code: "324", name: "楽器製造業", middleCode: "32" },
  { code: "325", name: "がん具・運動用具製造業", middleCode: "32" },
  { code: "326", name: "ペン・鉛筆・絵画用品・その他の事務用品製造業", middleCode: "32" },
  { code: "327", name: "漆器製造業", middleCode: "32" },
  { code: "328", name: "畳・ブラインド・日よけ製造業", middleCode: "32" },
  { code: "329", name: "他に分類されない製造業", middleCode: "32" },
  // 33-36 電気・ガス・熱供給・水道業
  { code: "331", name: "電気業", middleCode: "33" },
  { code: "332", name: "電気業（再生可能エネルギー）", middleCode: "33" },
  { code: "341", name: "ガス業", middleCode: "34" },
  { code: "342", name: "液化石油ガス販売業", middleCode: "34" },
  { code: "351", name: "熱供給業", middleCode: "35" },
  { code: "361", name: "上水道業", middleCode: "36" },
  { code: "362", name: "工業用水道業", middleCode: "36" },
  { code: "363", name: "下水道業", middleCode: "36" },
  { code: "364", name: "簡易水道業", middleCode: "36" },
  // 37 通信業
  { code: "371", name: "固定電気通信業", middleCode: "37" },
  { code: "372", name: "移動電気通信業", middleCode: "37" },
  { code: "373", name: "電気通信に附帯するサービス業", middleCode: "37" },
  { code: "374", name: "衛星通信業", middleCode: "37" },
  // 38 放送業
  { code: "381", name: "公共放送業（有線放送業を除く）", middleCode: "38" },
  { code: "382", name: "民間放送業（有線放送業を除く）", middleCode: "38" },
  { code: "383", name: "有線放送業", middleCode: "38" },
  { code: "384", name: "ケーブルテレビ業", middleCode: "38" },
  // 39 情報サービス業
  { code: "391", name: "ソフトウェア業", middleCode: "39" },
  { code: "392", name: "情報処理・提供サービス業", middleCode: "39" },
  { code: "393", name: "データベース・サービス業", middleCode: "39" },
  { code: "394", name: "情報システム関連サービス業", middleCode: "39" },
  // 40 インターネット附随サービス業
  { code: "401", name: "インターネット附随サービス業", middleCode: "40" },
  { code: "402", name: "電子商取引業", middleCode: "40" },
  { code: "403", name: "インターネット広告業", middleCode: "40" },
  // 41 映像・音声・文字情報制作業
  { code: "411", name: "映像情報制作・配給業", middleCode: "41" },
  { code: "412", name: "音声情報制作業", middleCode: "41" },
  { code: "413", name: "新聞業", middleCode: "41" },
  { code: "414", name: "出版業", middleCode: "41" },
  { code: "415", name: "広告制作業", middleCode: "41" },
  { code: "416", name: "映像・音声・文字情報制作に附帯するサービス業", middleCode: "41" },
  { code: "417", name: "デジタルコンテンツ制作業", middleCode: "41" },
  // 42-49 運輸業，郵便業
  { code: "421", name: "鉄道業", middleCode: "42" },
  { code: "422", name: "軌道業（索道業を除く）", middleCode: "42" },
  { code: "423", name: "索道業", middleCode: "42" },
  { code: "431", name: "一般乗合旅客自動車運送業", middleCode: "43" },
  { code: "432", name: "一般乗用旅客自動車運送業", middleCode: "43" },
  { code: "433", name: "一般貸切旅客自動車運送業", middleCode: "43" },
  { code: "434", name: "特定旅客自動車運送業", middleCode: "43" },
  { code: "439", name: "その他の道路旅客運送業", middleCode: "43" },
  { code: "441", name: "一般貨物自動車運送業", middleCode: "44" },
  { code: "442", name: "特定貨物自動車運送業", middleCode: "44" },
  { code: "443", name: "貨物軽自動車運送業", middleCode: "44" },
  { code: "444", name: "集配利用運送業（自動車によるものに限る）", middleCode: "44" },
  { code: "445", name: "霊柩自動車運送業", middleCode: "44" },
  { code: "449", name: "その他の道路貨物運送業", middleCode: "44" },
  { code: "451", name: "外航海運業", middleCode: "45" },
  { code: "452", name: "内航海運業", middleCode: "45" },
  { code: "453", name: "船舶貸渡業（内航船舶貸渡業を除く）", middleCode: "45" },
  { code: "454", name: "水運に附帯するサービス業", middleCode: "45" },
  { code: "459", name: "その他の水運業", middleCode: "45" },
  { code: "461", name: "航空運輸業", middleCode: "46" },
  { code: "462", name: "航空機使用業（航空運輸業を除く）", middleCode: "46" },
  { code: "469", name: "航空運輸附帯サービス業", middleCode: "46" },
  { code: "471", name: "倉庫業（冷蔵倉庫業を除く）", middleCode: "47" },
  { code: "472", name: "冷蔵倉庫業", middleCode: "47" },
  { code: "473", name: "危険品倉庫業", middleCode: "47" },
  { code: "479", name: "その他の倉庫業", middleCode: "47" },
  { code: "481", name: "港湾運送業", middleCode: "48" },
  { code: "482", name: "貨物運送取扱業（集配利用運送業を除く）", middleCode: "48" },
  { code: "483", name: "運送代理業", middleCode: "48" },
  { code: "484", name: "こん包業", middleCode: "48" },
  { code: "485", name: "運輸施設提供業", middleCode: "48" },
  { code: "486", name: "通関業", middleCode: "48" },
  { code: "489", name: "その他の運輸に附帯するサービス業", middleCode: "48" },
  { code: "491", name: "郵便業（信書便事業を含む）", middleCode: "49" },
  { code: "492", name: "信書便事業", middleCode: "49" },
  // 50 各種商品卸売業
  { code: "501", name: "各種商品卸売業", middleCode: "50" },
  // 51 繊維・衣服等卸売業
  { code: "511", name: "繊維品卸売業（衣服，身の回り品を除く）", middleCode: "51" },
  { code: "512", name: "衣服卸売業", middleCode: "51" },
  { code: "513", name: "身の回り品卸売業", middleCode: "51" },
  // 52 飲食料品卸売業
  { code: "521", name: "農畜産物・水産物卸売業", middleCode: "52" },
  { code: "522", name: "食料・飲料卸売業", middleCode: "52" },
  // 52追加
  { code: "523", name: "菓子・パン類卸売業", middleCode: "52" },
  { code: "524", name: "飲料卸売業（別掲を除く）", middleCode: "52" },
  // 53 建築材料，鉱物・金属材料等卸売業
  { code: "531", name: "建築材料卸売業", middleCode: "53" },
  { code: "532", name: "化学製品卸売業", middleCode: "53" },
  { code: "533", name: "石油・鉱物卸売業", middleCode: "53" },
  { code: "534", name: "鉄鋼製品卸売業", middleCode: "53" },
  { code: "535", name: "非鉄金属卸売業", middleCode: "53" },
  { code: "536", name: "再生資源卸売業", middleCode: "53" },
  { code: "537", name: "非金属鉱物製品卸売業（建築材料を除く）", middleCode: "53" },
  // 54 機械器具卸売業
  { code: "541", name: "産業機械器具卸売業", middleCode: "54" },
  { code: "542", name: "自動車卸売業", middleCode: "54" },
  { code: "543", name: "電気機械器具卸売業", middleCode: "54" },
  { code: "544", name: "その他の機械器具卸売業", middleCode: "54" },
  { code: "545", name: "医療・福祉機器卸売業", middleCode: "54" },
  { code: "546", name: "精密機械器具卸売業", middleCode: "54" },
  // 55 その他の卸売業
  { code: "551", name: "家具・建具・じゅう器等卸売業", middleCode: "55" },
  { code: "552", name: "医薬品・化粧品等卸売業", middleCode: "55" },
  { code: "553", name: "紙・紙製品卸売業", middleCode: "55" },
  { code: "554", name: "農業用品卸売業", middleCode: "55" },
  { code: "555", name: "スポーツ・レジャー用品卸売業", middleCode: "55" },
  { code: "556", name: "動植物・ペット関連用品卸売業", middleCode: "55" },
  { code: "557", name: "写真・映像機器卸売業", middleCode: "55" },
  { code: "559", name: "他に分類されない卸売業", middleCode: "55" },
  // 56 各種商品小売業
  { code: "561", name: "百貨店，総合スーパー", middleCode: "56" },
  { code: "562", name: "コンビニエンスストア（飲食料品を中心とするもの）", middleCode: "56" },
  { code: "563", name: "ディスカウントストア", middleCode: "56" },
  { code: "564", name: "ドラッグストア", middleCode: "56" },
  { code: "565", name: "ホームセンター", middleCode: "56" },
  { code: "569", name: "その他の各種商品小売業（従業者が常時50人未満のもの）", middleCode: "56" },
  // 57 織物・衣服・身の回り品小売業
  { code: "571", name: "呉服・服地・寝具小売業", middleCode: "57" },
  { code: "572", name: "男子服小売業", middleCode: "57" },
  { code: "573", name: "婦人・子供服小売業", middleCode: "57" },
  { code: "574", name: "靴・履物小売業", middleCode: "57" },
  { code: "579", name: "その他の織物・衣服・身の回り品小売業", middleCode: "57" },
  // 58 飲食料品小売業
  { code: "581", name: "各種食料品小売業", middleCode: "58" },
  { code: "582", name: "野菜・果実小売業", middleCode: "58" },
  { code: "583", name: "食肉小売業", middleCode: "58" },
  { code: "584", name: "鮮魚小売業", middleCode: "58" },
  { code: "585", name: "酒小売業", middleCode: "58" },
  { code: "586", name: "菓子・パン小売業", middleCode: "58" },
  { code: "589", name: "その他の飲食料品小売業", middleCode: "58" },
  // 59 機械器具小売業
  { code: "591", name: "自動車小売業", middleCode: "59" },
  { code: "592", name: "自転車小売業", middleCode: "59" },
  { code: "593", name: "機械・工具小売業（農業用器具を除く）", middleCode: "59" },
  { code: "594", name: "医療機械器具・医療用品小売業", middleCode: "59" },
  { code: "595", name: "電気機械器具小売業", middleCode: "59" },
  { code: "596", name: "家庭用機械器具小売業（電気機械器具を除く）", middleCode: "59" },
  // 60 その他の小売業
  { code: "601", name: "家具・建具・畳小売業", middleCode: "60" },
  { code: "602", name: "じゅう器小売業", middleCode: "60" },
  { code: "603", name: "医薬品・化粧品小売業", middleCode: "60" },
  { code: "604", name: "農耕用品小売業", middleCode: "60" },
  { code: "605", name: "燃料小売業", middleCode: "60" },
  { code: "606", name: "書籍・文房具小売業", middleCode: "60" },
  { code: "607", name: "スポーツ用品・がん具・娯楽用品・楽器小売業", middleCode: "60" },
  { code: "608", name: "写真機・時計・眼鏡小売業", middleCode: "60" },
  { code: "609", name: "他に分類されない小売業", middleCode: "60" },
  // 61 無店舗小売業
  { code: "611", name: "通信販売・訪問販売小売業", middleCode: "61" },
  { code: "612", name: "自動販売機による小売業", middleCode: "61" },
  { code: "619", name: "その他の無店舗小売業", middleCode: "61" },
  // 62 銀行業
  { code: "621", name: "中央銀行", middleCode: "62" },
  { code: "622", name: "普通銀行", middleCode: "62" },
  { code: "623", name: "長期信用銀行", middleCode: "62" },
  // 63 協同組織金融業
  { code: "631", name: "中小企業等協同組合による金融業", middleCode: "63" },
  { code: "632", name: "農林水産金融業", middleCode: "63" },
  { code: "633", name: "その他の協同組織金融業", middleCode: "63" },
  { code: "634", name: "信用金庫・信用組合", middleCode: "63" },
  // 64 貸金業等
  { code: "641", name: "貸金業", middleCode: "64" },
  { code: "642", name: "クレジットカード業，割賦金融業", middleCode: "64" },
  { code: "643", name: "その他の非預金信用機関", middleCode: "64" },
  { code: "644", name: "質屋業", middleCode: "64" },
  // 65 金融商品取引業
  { code: "651", name: "金融商品取引業", middleCode: "65" },
  { code: "652", name: "商品先物取引業，商品投資顧問業", middleCode: "65" },
  { code: "653", name: "商品取引所", middleCode: "65" },
  // 66 補助的金融業
  { code: "661", name: "補助的金融業，金融附帯業", middleCode: "66" },
  { code: "662", name: "信託業", middleCode: "66" },
  { code: "663", name: "金融商品仲介業，投資助言・代理業，投資運用業", middleCode: "66" },
  { code: "664", name: "外国為替業", middleCode: "66" },
  // 67 保険業
  { code: "671", name: "生命保険業", middleCode: "67" },
  { code: "672", name: "損害保険業", middleCode: "67" },
  { code: "673", name: "共済事業，少額短期保険業", middleCode: "67" },
  { code: "674", name: "保険媒介代理業", middleCode: "67" },
  { code: "675", name: "保険サービス業", middleCode: "67" },
  // 68 不動産取引業
  { code: "681", name: "建物売買業，土地売買業", middleCode: "68" },
  { code: "682", name: "不動産代理業・仲介業", middleCode: "68" },
  { code: "683", name: "不動産競売・公売業", middleCode: "68" },
  // 69 不動産賃貸業・管理業
  { code: "691", name: "不動産賃貸業（貸家業，貸間業を除く）", middleCode: "69" },
  { code: "692", name: "貸家業，貸間業", middleCode: "69" },
  { code: "693", name: "駐車場業", middleCode: "69" },
  { code: "694", name: "不動産管理業", middleCode: "69" },
  { code: "695", name: "マンション管理業", middleCode: "69" },
  // 70 物品賃貸業
  { code: "701", name: "各種物品賃貸業", middleCode: "70" },
  { code: "702", name: "産業用機械器具賃貸業", middleCode: "70" },
  { code: "703", name: "事務用機械器具賃貸業", middleCode: "70" },
  { code: "704", name: "自動車賃貸業", middleCode: "70" },
  { code: "705", name: "スポーツ・娯楽用品賃貸業", middleCode: "70" },
  { code: "706", name: "映画・演劇用品賃貸業", middleCode: "70" },
  { code: "707", name: "リース業", middleCode: "70" },
  { code: "709", name: "その他の物品賃貸業", middleCode: "70" },
  // 71 学術・開発研究機関
  { code: "711", name: "自然科学研究所", middleCode: "71" },
  { code: "712", name: "人文・社会科学研究所", middleCode: "71" },
  { code: "713", name: "農業・林業・水産業研究機関", middleCode: "71" },
  // 72 専門サービス業
  { code: "721", name: "法律事務所，特許事務所", middleCode: "72" },
  { code: "722", name: "公証人役場，司法書士事務所，土地家屋調査士事務所", middleCode: "72" },
  { code: "723", name: "行政書士事務所", middleCode: "72" },
  { code: "724", name: "公認会計士事務所，税理士事務所", middleCode: "72" },
  { code: "725", name: "社会保険労務士事務所", middleCode: "72" },
  { code: "726", name: "デザイン業", middleCode: "72" },
  { code: "727", name: "著述・芸術家業", middleCode: "72" },
  { code: "728", name: "経営コンサルタント業，純粋持株会社", middleCode: "72" },
  { code: "729", name: "その他の専門サービス業", middleCode: "72" },
  // 73 広告業
  { code: "731", name: "広告業", middleCode: "73" },
  { code: "732", name: "広告制作業", middleCode: "73" },
  { code: "733", name: "メディアレップ・広告代理業", middleCode: "73" },
  // 74 技術サービス業
  { code: "741", name: "獣医業", middleCode: "74" },
  { code: "742", name: "土木建築サービス業", middleCode: "74" },
  { code: "743", name: "機械設計業", middleCode: "74" },
  { code: "744", name: "商品・非破壊検査業", middleCode: "74" },
  { code: "745", name: "計量証明業", middleCode: "74" },
  { code: "746", name: "写真業", middleCode: "74" },
  { code: "747", name: "環境・土壌調査業", middleCode: "74" },
  { code: "748", name: "建物診断・検査業", middleCode: "74" },
  { code: "749", name: "その他の技術サービス業", middleCode: "74" },
  // 75 宿泊業
  { code: "751", name: "旅館，ホテル", middleCode: "75" },
  { code: "752", name: "簡易宿所", middleCode: "75" },
  { code: "753", name: "下宿業", middleCode: "75" },
  { code: "754", name: "リゾート施設業", middleCode: "75" },
  { code: "755", name: "キャンプ場・宿泊施設業（別掲を除く）", middleCode: "75" },
  { code: "759", name: "その他の宿泊業", middleCode: "75" },
  // 76 飲食店
  { code: "761", name: "食堂，レストラン（専門料理店を除く）", middleCode: "76" },
  { code: "762", name: "専門料理店", middleCode: "76" },
  { code: "763", name: "そば・うどん店", middleCode: "76" },
  { code: "764", name: "すし店", middleCode: "76" },
  { code: "765", name: "酒場，ビヤホール", middleCode: "76" },
  { code: "766", name: "バー，キャバレー，ナイトクラブ", middleCode: "76" },
  { code: "767", name: "喫茶店", middleCode: "76" },
  { code: "768", name: "カフェ・軽食サービス業（喫茶店を除く）", middleCode: "76" },
  { code: "769", name: "その他の飲食店", middleCode: "76" },
  // 77 持ち帰り・配達飲食サービス業
  { code: "771", name: "持ち帰り飲食サービス業", middleCode: "77" },
  { code: "772", name: "配達飲食サービス業", middleCode: "77" },
  // 78 洗濯・理容・美容・浴場業
  { code: "781", name: "洗濯業", middleCode: "78" },
  { code: "782", name: "理容業", middleCode: "78" },
  { code: "783", name: "美容業", middleCode: "78" },
  { code: "784", name: "一般公衆浴場業", middleCode: "78" },
  { code: "785", name: "その他の公衆浴場業", middleCode: "78" },
  { code: "786", name: "洗濯・理容・美容・浴場業に附帯するサービス業", middleCode: "78" },
  { code: "787", name: "エステティックサービス業・ネイルサービス業", middleCode: "78" },
  { code: "788", name: "リラクゼーション業（別掲を除く）", middleCode: "78" },
  // 79 その他の生活関連サービス業
  { code: "791", name: "旅行業", middleCode: "79" },
  { code: "792", name: "家事サービス業", middleCode: "79" },
  { code: "793", name: "衣服・履物修理業", middleCode: "79" },
  { code: "794", name: "自転車・貴金属等修理業", middleCode: "79" },
  { code: "795", name: "葬儀業", middleCode: "79" },
  { code: "796", name: "冠婚葬祭業（葬儀業を除く）", middleCode: "79" },
  { code: "797", name: "ランドリー・クリーニング以外の生活サービス業", middleCode: "79" },
  { code: "798", name: "家庭用品・衣服等修理業（別掲を除く）", middleCode: "79" },
  { code: "799", name: "他に分類されない生活関連サービス業", middleCode: "79" },
  // 80 娯楽業
  { code: "801", name: "映画館", middleCode: "80" },
  { code: "802", name: "興行場（別掲を除く），興行団", middleCode: "80" },
  { code: "803", name: "競輪・競馬等の競走場，競技団", middleCode: "80" },
  { code: "804", name: "スポーツ施設提供業，公園，遊園地", middleCode: "80" },
  { code: "805", name: "ゴルフ場，ゴルフ練習場", middleCode: "80" },
  { code: "806", name: "ボウリング場", middleCode: "80" },
  { code: "807", name: "フィットネスクラブ", middleCode: "80" },
  { code: "808", name: "遊戯場", middleCode: "80" },
  { code: "809", name: "その他の娯楽業", middleCode: "80" },
  // 81 学校教育
  { code: "811", name: "幼稚園", middleCode: "81" },
  { code: "812", name: "小学校", middleCode: "81" },
  { code: "813", name: "中学校", middleCode: "81" },
  { code: "814", name: "高等学校，中等教育学校", middleCode: "81" },
  { code: "815", name: "特別支援学校", middleCode: "81" },
  { code: "816", name: "高等教育機関", middleCode: "81" },
  { code: "817", name: "専修学校，各種学校", middleCode: "81" },
  { code: "818", name: "認定こども園", middleCode: "81" },
  // 82 その他の教育，学習支援業
  { code: "821", name: "社会教育", middleCode: "82" },
  { code: "822", name: "職業・教育支援施設", middleCode: "82" },
  { code: "823", name: "学習塾", middleCode: "82" },
  { code: "824", name: "教養・技能教授業", middleCode: "82" },
  { code: "825", name: "日本語教育業", middleCode: "82" },
  { code: "826", name: "外国語学校・スクール", middleCode: "82" },
  { code: "829", name: "その他の教育，学習支援業", middleCode: "82" },
  // 83 医療業
  { code: "831", name: "病院", middleCode: "83" },
  { code: "832", name: "一般診療所", middleCode: "83" },
  { code: "833", name: "歯科診療所", middleCode: "83" },
  { code: "834", name: "助産・看護業", middleCode: "83" },
  { code: "835", name: "療術業", middleCode: "83" },
  { code: "836", name: "医療に附帯するサービス業", middleCode: "83" },
  { code: "837", name: "居宅医療サービス業", middleCode: "83" },
  // 84 保健衛生
  { code: "841", name: "保健所", middleCode: "84" },
  { code: "842", name: "健康相談施設", middleCode: "84" },
  { code: "843", name: "健診・検診センター", middleCode: "84" },
  { code: "849", name: "その他の保健衛生", middleCode: "84" },
  // 85 社会保険・社会福祉・介護事業
  { code: "851", name: "社会保険事業団体", middleCode: "85" },
  { code: "852", name: "福祉事務所", middleCode: "85" },
  { code: "853", name: "児童福祉事業", middleCode: "85" },
  { code: "854", name: "老人福祉・介護事業", middleCode: "85" },
  { code: "855", name: "障害者福祉事業", middleCode: "85" },
  { code: "856", name: "保育所", middleCode: "85" },
  { code: "857", name: "母子保護施設", middleCode: "85" },
  { code: "859", name: "その他の社会保険・社会福祉・介護事業", middleCode: "85" },
  // 86 郵便局
  { code: "861", name: "郵便局", middleCode: "86" },
  { code: "862", name: "郵便局に附帯するサービス業", middleCode: "86" },
  // 87 協同組合
  { code: "871", name: "農林水産業協同組合（他に分類されるものを除く）", middleCode: "87" },
  { code: "872", name: "事業協同組合（他に分類されるものを除く）", middleCode: "87" },
  { code: "873", name: "消費生活協同組合", middleCode: "87" },
  // 88 廃棄物処理業
  { code: "881", name: "一般廃棄物処理業", middleCode: "88" },
  { code: "882", name: "産業廃棄物処理業", middleCode: "88" },
  { code: "883", name: "特別管理廃棄物処理業", middleCode: "88" },
  { code: "884", name: "廃棄物処理業に附帯するサービス業", middleCode: "88" },
  { code: "889", name: "その他の廃棄物処理業", middleCode: "88" },
  // 89 自動車整備業
  { code: "891", name: "自動車整備業", middleCode: "89" },
  { code: "892", name: "二輪自動車整備業", middleCode: "89" },
  { code: "893", name: "自動車・機械整備に附帯するサービス業", middleCode: "89" },
  // 90 機械等修理業
  { code: "901", name: "機械修理業（電気機械器具を除く）", middleCode: "90" },
  { code: "902", name: "電気機械器具修理業", middleCode: "90" },
  { code: "903", name: "表具業", middleCode: "90" },
  { code: "904", name: "光学機器・時計等修理業", middleCode: "90" },
  { code: "909", name: "その他の修理業", middleCode: "90" },
  // 91 職業紹介・労働者派遣業
  { code: "911", name: "職業紹介業", middleCode: "91" },
  { code: "912", name: "労働者派遣業", middleCode: "91" },
  { code: "913", name: "人材コンサルタント業", middleCode: "91" },
  { code: "914", name: "アウトソーシング業", middleCode: "91" },
  // 92 その他の事業サービス業
  { code: "921", name: "速記・ワープロ入力・複写業", middleCode: "92" },
  { code: "922", name: "建物サービス業", middleCode: "92" },
  { code: "923", name: "警備業", middleCode: "92" },
  { code: "924", name: "調査業", middleCode: "92" },
  { code: "925", name: "市場調査・世論調査業", middleCode: "92" },
  { code: "926", name: "コールセンター業", middleCode: "92" },
  { code: "927", name: "イベント企画・運営業", middleCode: "92" },
  { code: "929", name: "他に分類されない事業サービス業", middleCode: "92" },
  // 93 政治・経済・文化団体
  { code: "931", name: "経済団体", middleCode: "93" },
  { code: "932", name: "労働団体", middleCode: "93" },
  { code: "933", name: "学術・文化団体", middleCode: "93" },
  { code: "934", name: "政治団体", middleCode: "93" },
  { code: "939", name: "その他の団体", middleCode: "93" },
  // 94 宗教
  { code: "941", name: "神道系宗教", middleCode: "94" },
  { code: "942", name: "仏教系宗教", middleCode: "94" },
  { code: "943", name: "キリスト教系宗教", middleCode: "94" },
  { code: "949", name: "その他の宗教", middleCode: "94" },
  // 95 その他のサービス業
  { code: "951", name: "集会場", middleCode: "95" },
  { code: "952", name: "と畜場", middleCode: "95" },
  { code: "953", name: "その他のサービス業（他に分類されないもの）", middleCode: "95" },
  { code: "954", name: "ペット関連サービス業", middleCode: "95" },
  { code: "955", name: "フォトスタジオ・写真サービス業", middleCode: "95" },
  // 96 外国公務
  { code: "961", name: "外国公務", middleCode: "96" },
  // 97 国家公務
  { code: "971", name: "立法機関", middleCode: "97" },
  { code: "972", name: "行政機関（別掲を除く）", middleCode: "97" },
  { code: "973", name: "司法機関", middleCode: "97" },
  // 98 地方公務
  { code: "981", name: "都道府県機関", middleCode: "98" },
  { code: "982", name: "市区町村機関", middleCode: "98" },
  { code: "983", name: "その他の地方公務", middleCode: "98" },
  // 99 分類不能
  { code: "999", name: "分類不能の産業", middleCode: "99" },
];

export function getMiddleByMajor(majorCode: string): MiddleCategory[] {
  return MIDDLE_CATEGORIES.filter((m) => m.majorCode === majorCode);
}

export function getMinorByMiddle(middleCode: string): MinorCategory[] {
  return MINOR_CATEGORIES.filter((m) => m.middleCode === middleCode);
}

export function getMajorName(code: string): string {
  return MAJOR_CATEGORIES.find((m) => m.code === code)?.name ?? "";
}

export function getMiddleName(code: string): string {
  return MIDDLE_CATEGORIES.find((m) => m.code === code)?.name ?? "";
}

export function getMinorName(code: string): string {
  return MINOR_CATEGORIES.find((m) => m.code === code)?.name ?? "";
}

export function getIndustryLabel(majorCode?: string | null, middleCode?: string | null, minorCode?: string | null): string {
  const parts: string[] = [];
  if (majorCode) parts.push(`${majorCode} ${getMajorName(majorCode)}`);
  if (middleCode) parts.push(`${middleCode} ${getMiddleName(middleCode)}`);
  if (minorCode) parts.push(`${minorCode} ${getMinorName(minorCode)}`);
  return parts.join(" > ");
}

export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "A": ["農業", "林業", "農園", "農場", "牧場", "畜産", "木材"],
  "B": ["漁業", "水産", "養殖", "漁港"],
  "C": ["鉱業", "採掘", "採石", "砂利"],
  "D": ["建設", "建築", "工事", "土木", "施工", "リフォーム", "設備工事", "電気工事", "配管"],
  "E": ["製造", "工場", "製品", "加工", "生産", "メーカー", "製作"],
  "F": ["電力", "ガス", "水道", "エネルギー"],
  "G": ["IT", "情報", "システム", "ソフトウェア", "アプリ", "インターネット", "通信", "デジタル", "DX", "AI", "Web", "ウェブ"],
  "H": ["運輸", "輸送", "運送", "物流", "倉庫", "配送", "トラック"],
  "I": ["卸売", "小売", "販売", "商店", "ショップ", "ストア", "スーパー"],
  "J": ["銀行", "金融", "保険", "証券", "投資", "クレジット", "ファイナンス"],
  "K": ["不動産", "賃貸", "マンション", "アパート", "住宅", "土地", "物件"],
  "L": ["コンサルタント", "コンサルティング", "税理士", "公認会計士", "司法書士", "社労士", "弁護士", "特許", "研究"],
  "M": ["ホテル", "旅館", "飲食", "レストラン", "食堂", "カフェ", "居酒屋", "料理"],
  "N": ["美容", "理容", "サロン", "クリーニング", "旅行", "観光", "スポーツ", "娯楽"],
  "O": ["学校", "教育", "塾", "学習", "幼稚園", "大学", "専門学校"],
  "P": ["病院", "クリニック", "診療", "歯科", "医療", "介護", "福祉", "看護"],
  "Q": ["農協", "協同組合", "郵便"],
  "R": ["派遣", "警備", "清掃", "修理", "整備", "廃棄物"],
  "S": ["公務", "役所", "行政", "官公庁"],
};
