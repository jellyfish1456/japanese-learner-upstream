export interface CityPin {
  name: string;
  lon: number;
  lat: number;
  capital?: boolean;
}

export interface PrefectureSubData {
  universities: string[];
  cities: CityPin[];
}

export const subRegionData: Record<string, PrefectureSubData> = {
  hokkaido: {
    universities: ["北海道大学", "札幌医科大学", "北海学園大学", "酪農学園大学", "室蘭工業大学"],
    cities: [
      { name: "札幌", lon: 141.35, lat: 43.06, capital: true },
      { name: "旭川", lon: 142.37, lat: 43.77 },
      { name: "函館", lon: 140.73, lat: 41.77 },
      { name: "帯広", lon: 143.20, lat: 42.92 },
      { name: "釧路", lon: 144.37, lat: 42.98 },
      { name: "北見", lon: 143.90, lat: 43.80 },
      { name: "苫小牧", lon: 141.60, lat: 42.63 },
      { name: "稚内", lon: 141.67, lat: 45.42 },
    ],
  },
  aomori: {
    universities: ["弘前大学", "青森大学", "青森公立大学", "八戸工業大学"],
    cities: [
      { name: "青森", lon: 140.74, lat: 40.82, capital: true },
      { name: "弘前", lon: 140.47, lat: 40.60 },
      { name: "八戸", lon: 141.49, lat: 40.51 },
      { name: "むつ", lon: 141.18, lat: 41.29 },
    ],
  },
  iwate: {
    universities: ["岩手大学", "岩手医科大学", "岩手県立大学"],
    cities: [
      { name: "盛岡", lon: 141.15, lat: 39.70, capital: true },
      { name: "一関", lon: 141.13, lat: 38.93 },
      { name: "花巻", lon: 141.12, lat: 39.38 },
      { name: "釜石", lon: 141.88, lat: 39.27 },
      { name: "宮古", lon: 141.95, lat: 39.64 },
    ],
  },
  akita: {
    universities: ["秋田大学", "秋田県立大学", "国際教養大学"],
    cities: [
      { name: "秋田", lon: 140.10, lat: 39.72, capital: true },
      { name: "横手", lon: 140.56, lat: 39.31 },
      { name: "大館", lon: 140.57, lat: 40.27 },
      { name: "能代", lon: 140.03, lat: 40.21 },
    ],
  },
  miyagi: {
    universities: ["東北大学", "東北学院大学", "宮城大学", "東北医科薬科大学"],
    cities: [
      { name: "仙台", lon: 140.87, lat: 38.27, capital: true },
      { name: "石巻", lon: 141.30, lat: 38.43 },
      { name: "塩竈", lon: 141.00, lat: 38.32 },
      { name: "気仙沼", lon: 141.57, lat: 38.90 },
    ],
  },
  yamagata: {
    universities: ["山形大学", "東北芸術工科大学", "山形県立大学"],
    cities: [
      { name: "山形", lon: 140.36, lat: 38.24, capital: true },
      { name: "鶴岡", lon: 139.83, lat: 38.73 },
      { name: "酒田", lon: 140.00, lat: 38.91 },
      { name: "米沢", lon: 140.12, lat: 37.92 },
    ],
  },
  fukushima: {
    universities: ["福島大学", "会津大学", "福島医科大学"],
    cities: [
      { name: "福島", lon: 140.47, lat: 37.76, capital: true },
      { name: "郡山", lon: 140.38, lat: 37.40 },
      { name: "いわき", lon: 140.89, lat: 37.05 },
      { name: "会津若松", lon: 139.93, lat: 37.50 },
    ],
  },
  ibaraki: {
    universities: ["茨城大学", "筑波大学", "茨城キリスト教大学"],
    cities: [
      { name: "水戸", lon: 140.45, lat: 36.34, capital: true },
      { name: "つくば", lon: 140.10, lat: 36.08 },
      { name: "日立", lon: 140.65, lat: 36.60 },
      { name: "土浦", lon: 140.20, lat: 36.07 },
    ],
  },
  tochigi: {
    universities: ["宇都宮大学", "作新学院大学", "獨協医科大学"],
    cities: [
      { name: "宇都宮", lon: 139.87, lat: 36.55, capital: true },
      { name: "日光", lon: 139.63, lat: 36.75 },
      { name: "足利", lon: 139.45, lat: 36.33 },
      { name: "小山", lon: 139.80, lat: 36.31 },
    ],
  },
  gunma: {
    universities: ["群馬大学", "高崎経済大学", "前橋工科大学"],
    cities: [
      { name: "前橋", lon: 139.06, lat: 36.39, capital: true },
      { name: "高崎", lon: 139.00, lat: 36.32 },
      { name: "桐生", lon: 139.33, lat: 36.41 },
      { name: "太田", lon: 139.38, lat: 36.29 },
    ],
  },
  saitama: {
    universities: ["埼玉大学", "立教大学（新座）", "早稲田大学（所沢）", "文教大学"],
    cities: [
      { name: "さいたま", lon: 139.65, lat: 35.86, capital: true },
      { name: "川越", lon: 139.49, lat: 35.92 },
      { name: "川口", lon: 139.72, lat: 35.81 },
      { name: "所沢", lon: 139.47, lat: 35.80 },
    ],
  },
  chiba: {
    universities: ["千葉大学", "千葉工業大学", "東邦大学", "麗澤大学"],
    cities: [
      { name: "千葉", lon: 140.12, lat: 35.61, capital: true },
      { name: "船橋", lon: 139.98, lat: 35.70 },
      { name: "市川", lon: 139.93, lat: 35.72 },
      { name: "松戸", lon: 139.90, lat: 35.78 },
      { name: "銚子", lon: 140.85, lat: 35.73 },
    ],
  },
  tokyo: {
    universities: ["東京大学", "早稲田大学", "慶應義塾大学", "東京工業大学", "一橋大学", "上智大学", "明治大学"],
    cities: [
      { name: "新宿区", lon: 139.70, lat: 35.69, capital: true },
      { name: "渋谷区", lon: 139.70, lat: 35.66 },
      { name: "八王子", lon: 139.33, lat: 35.65 },
      { name: "立川", lon: 139.41, lat: 35.70 },
      { name: "台東区", lon: 139.78, lat: 35.71 },
    ],
  },
  kanagawa: {
    universities: ["横浜国立大学", "神奈川大学", "慶應義塾大学（SFC）", "東海大学"],
    cities: [
      { name: "横浜", lon: 139.64, lat: 35.44, capital: true },
      { name: "川崎", lon: 139.70, lat: 35.53 },
      { name: "相模原", lon: 139.38, lat: 35.57 },
      { name: "鎌倉", lon: 139.55, lat: 35.32 },
      { name: "小田原", lon: 139.15, lat: 35.26 },
    ],
  },
  niigata: {
    universities: ["新潟大学", "長岡技術科学大学", "上越教育大学", "新潟医療福祉大学"],
    cities: [
      { name: "新潟", lon: 139.05, lat: 37.91, capital: true },
      { name: "長岡", lon: 138.85, lat: 37.45 },
      { name: "上越", lon: 138.24, lat: 37.15 },
      { name: "柏崎", lon: 138.57, lat: 37.37 },
    ],
  },
  toyama: {
    universities: ["富山大学", "富山県立大学", "高岡法科大学"],
    cities: [
      { name: "富山", lon: 137.21, lat: 36.70, capital: true },
      { name: "高岡", lon: 137.02, lat: 36.75 },
      { name: "魚津", lon: 137.41, lat: 36.83 },
    ],
  },
  ishikawa: {
    universities: ["金沢大学", "金沢工業大学", "北陸大学", "金沢美術工芸大学"],
    cities: [
      { name: "金沢", lon: 136.63, lat: 36.59, capital: true },
      { name: "小松", lon: 136.45, lat: 36.40 },
      { name: "輪島", lon: 136.90, lat: 37.39 },
      { name: "七尾", lon: 136.97, lat: 37.04 },
      { name: "珠洲", lon: 137.26, lat: 37.43 },
    ],
  },
  fukui: {
    universities: ["福井大学", "仁愛大学", "福井工業大学"],
    cities: [
      { name: "福井", lon: 136.22, lat: 36.06, capital: true },
      { name: "鯖江", lon: 136.19, lat: 35.95 },
      { name: "小浜", lon: 135.75, lat: 35.49 },
      { name: "敦賀", lon: 136.06, lat: 35.65 },
    ],
  },
  yamanashi: {
    universities: ["山梨大学", "山梨学院大学"],
    cities: [
      { name: "甲府", lon: 138.57, lat: 35.66, capital: true },
      { name: "富士吉田", lon: 138.80, lat: 35.49 },
      { name: "韮崎", lon: 138.45, lat: 35.71 },
    ],
  },
  nagano: {
    universities: ["信州大学", "長野大学", "松本大学", "長野県立大学"],
    cities: [
      { name: "長野", lon: 138.19, lat: 36.65, capital: true },
      { name: "松本", lon: 137.97, lat: 36.24 },
      { name: "諏訪", lon: 138.11, lat: 36.04 },
      { name: "飯田", lon: 137.82, lat: 35.51 },
      { name: "上田", lon: 138.25, lat: 36.40 },
    ],
  },
  shizuoka: {
    universities: ["静岡大学", "浜松医科大学", "静岡県立大学", "常葉大学"],
    cities: [
      { name: "静岡", lon: 138.38, lat: 34.98, capital: true },
      { name: "浜松", lon: 137.73, lat: 34.71 },
      { name: "沼津", lon: 138.86, lat: 35.10 },
      { name: "熱海", lon: 139.07, lat: 35.10 },
    ],
  },
  aichi: {
    universities: ["名古屋大学", "名古屋工業大学", "愛知教育大学", "南山大学", "中京大学"],
    cities: [
      { name: "名古屋", lon: 136.91, lat: 35.18, capital: true },
      { name: "豊田", lon: 137.15, lat: 35.08 },
      { name: "岡崎", lon: 137.16, lat: 34.95 },
      { name: "豊橋", lon: 137.39, lat: 34.77 },
      { name: "一宮", lon: 136.80, lat: 35.31 },
    ],
  },
  gifu: {
    universities: ["岐阜大学", "岐阜聖徳学園大学", "中部学院大学"],
    cities: [
      { name: "岐阜", lon: 136.72, lat: 35.42, capital: true },
      { name: "大垣", lon: 136.62, lat: 35.36 },
      { name: "高山", lon: 137.25, lat: 36.15 },
      { name: "中津川", lon: 137.50, lat: 35.49 },
    ],
  },
  mie: {
    universities: ["三重大学", "皇學館大学", "鈴鹿医療科学大学"],
    cities: [
      { name: "津", lon: 136.51, lat: 34.73, capital: true },
      { name: "四日市", lon: 136.62, lat: 34.97 },
      { name: "伊勢", lon: 136.71, lat: 34.48 },
      { name: "松阪", lon: 136.53, lat: 34.58 },
    ],
  },
  shiga: {
    universities: ["滋賀大学", "立命館大学（BKC）", "龍谷大学（瀬田）", "滋賀医科大学"],
    cities: [
      { name: "大津", lon: 135.87, lat: 35.00, capital: true },
      { name: "彦根", lon: 136.26, lat: 35.27 },
      { name: "長浜", lon: 136.27, lat: 35.38 },
      { name: "草津", lon: 135.96, lat: 35.02 },
    ],
  },
  kyoto: {
    universities: ["京都大学", "同志社大学", "立命館大学", "京都工芸繊維大学", "京都府立大学"],
    cities: [
      { name: "京都", lon: 135.77, lat: 35.01, capital: true },
      { name: "宇治", lon: 135.80, lat: 34.88 },
      { name: "舞鶴", lon: 135.33, lat: 35.47 },
      { name: "福知山", lon: 135.13, lat: 35.30 },
    ],
  },
  osaka: {
    universities: ["大阪大学", "大阪府立大学", "大阪市立大学", "関西大学", "関西学院大学", "近畿大学"],
    cities: [
      { name: "大阪", lon: 135.50, lat: 34.69, capital: true },
      { name: "堺", lon: 135.47, lat: 34.57 },
      { name: "東大阪", lon: 135.60, lat: 34.67 },
      { name: "枚方", lon: 135.65, lat: 34.81 },
      { name: "豊中", lon: 135.47, lat: 34.78 },
    ],
  },
  hyogo: {
    universities: ["神戸大学", "兵庫県立大学", "関西学院大学", "甲南大学", "神戸学院大学"],
    cities: [
      { name: "神戸", lon: 135.18, lat: 34.69, capital: true },
      { name: "姫路", lon: 134.69, lat: 34.82 },
      { name: "西宮", lon: 135.34, lat: 34.74 },
      { name: "尼崎", lon: 135.42, lat: 34.73 },
      { name: "豊岡", lon: 134.82, lat: 35.54 },
    ],
  },
  nara: {
    universities: ["奈良大学", "奈良女子大学", "近畿大学（奈良）", "天理大学"],
    cities: [
      { name: "奈良", lon: 135.83, lat: 34.68, capital: true },
      { name: "橿原", lon: 135.79, lat: 34.45 },
      { name: "天理", lon: 135.84, lat: 34.60 },
      { name: "吉野", lon: 135.86, lat: 34.41 },
    ],
  },
  wakayama: {
    universities: ["和歌山大学", "和歌山県立医科大学"],
    cities: [
      { name: "和歌山", lon: 135.17, lat: 34.23, capital: true },
      { name: "海南", lon: 135.20, lat: 34.15 },
      { name: "田辺", lon: 135.38, lat: 33.73 },
      { name: "新宮", lon: 136.00, lat: 33.73 },
    ],
  },
  tottori: {
    universities: ["鳥取大学", "鳥取環境大学"],
    cities: [
      { name: "鳥取", lon: 134.24, lat: 35.50, capital: true },
      { name: "米子", lon: 133.33, lat: 35.43 },
      { name: "倉吉", lon: 133.82, lat: 35.43 },
    ],
  },
  shimane: {
    universities: ["島根大学", "島根県立大学"],
    cities: [
      { name: "松江", lon: 133.06, lat: 35.47, capital: true },
      { name: "出雲", lon: 132.76, lat: 35.37 },
      { name: "浜田", lon: 132.08, lat: 34.90 },
      { name: "益田", lon: 131.84, lat: 34.67 },
    ],
  },
  okayama: {
    universities: ["岡山大学", "川崎医科大学", "就実大学", "岡山理科大学"],
    cities: [
      { name: "岡山", lon: 133.93, lat: 34.66, capital: true },
      { name: "倉敷", lon: 133.77, lat: 34.59 },
      { name: "津山", lon: 134.00, lat: 35.07 },
      { name: "玉野", lon: 133.95, lat: 34.49 },
    ],
  },
  hiroshima: {
    universities: ["広島大学", "広島工業大学", "県立広島大学", "修道大学"],
    cities: [
      { name: "広島", lon: 132.46, lat: 34.40, capital: true },
      { name: "福山", lon: 133.36, lat: 34.49 },
      { name: "呉", lon: 132.57, lat: 34.24 },
      { name: "尾道", lon: 133.20, lat: 34.41 },
    ],
  },
  yamaguchi: {
    universities: ["山口大学", "山口東京理科大学", "梅光学院大学"],
    cities: [
      { name: "山口", lon: 131.47, lat: 34.18, capital: true },
      { name: "下関", lon: 130.94, lat: 33.95 },
      { name: "宇部", lon: 131.25, lat: 33.95 },
      { name: "岩国", lon: 132.21, lat: 34.17 },
    ],
  },
  tokushima: {
    universities: ["徳島大学", "鳴門教育大学", "四国大学"],
    cities: [
      { name: "徳島", lon: 134.56, lat: 34.07, capital: true },
      { name: "鳴門", lon: 134.61, lat: 34.18 },
      { name: "阿南", lon: 134.66, lat: 33.92 },
    ],
  },
  kagawa: {
    universities: ["香川大学", "香川医科大学（香川大学医学部）", "高松大学"],
    cities: [
      { name: "高松", lon: 134.05, lat: 34.34, capital: true },
      { name: "丸亀", lon: 133.80, lat: 34.29 },
      { name: "坂出", lon: 133.85, lat: 34.31 },
      { name: "観音寺", lon: 133.66, lat: 34.13 },
    ],
  },
  ehime: {
    universities: ["愛媛大学", "松山大学", "松山東雲女子大学"],
    cities: [
      { name: "松山", lon: 132.77, lat: 33.84, capital: true },
      { name: "今治", lon: 133.00, lat: 34.07 },
      { name: "新居浜", lon: 133.30, lat: 33.96 },
      { name: "宇和島", lon: 132.56, lat: 33.22 },
    ],
  },
  kochi: {
    universities: ["高知大学", "高知工科大学", "高知県立大学"],
    cities: [
      { name: "高知", lon: 133.55, lat: 33.56, capital: true },
      { name: "南国", lon: 133.66, lat: 33.59 },
      { name: "須崎", lon: 133.28, lat: 33.39 },
      { name: "室戸", lon: 134.15, lat: 33.29 },
    ],
  },
  fukuoka: {
    universities: ["九州大学", "福岡大学", "西南学院大学", "九州工業大学", "北九州市立大学"],
    cities: [
      { name: "福岡", lon: 130.40, lat: 33.59, capital: true },
      { name: "北九州", lon: 130.83, lat: 33.88 },
      { name: "久留米", lon: 130.51, lat: 33.32 },
      { name: "飯塚", lon: 130.69, lat: 33.64 },
    ],
  },
  saga: {
    universities: ["佐賀大学", "西九州大学"],
    cities: [
      { name: "佐賀", lon: 130.30, lat: 33.25, capital: true },
      { name: "唐津", lon: 129.97, lat: 33.45 },
      { name: "鳥栖", lon: 130.51, lat: 33.38 },
      { name: "伊万里", lon: 129.88, lat: 33.27 },
    ],
  },
  nagasaki: {
    universities: ["長崎大学", "活水女子大学", "長崎純心大学"],
    cities: [
      { name: "長崎", lon: 129.87, lat: 32.75, capital: true },
      { name: "佐世保", lon: 129.72, lat: 33.18 },
      { name: "諫早", lon: 130.05, lat: 32.84 },
      { name: "島原", lon: 130.37, lat: 32.78 },
    ],
  },
  kumamoto: {
    universities: ["熊本大学", "崇城大学", "熊本学園大学", "熊本県立大学"],
    cities: [
      { name: "熊本", lon: 130.74, lat: 32.78, capital: true },
      { name: "八代", lon: 130.60, lat: 32.51 },
      { name: "荒尾", lon: 130.43, lat: 32.99 },
      { name: "玉名", lon: 130.56, lat: 33.02 },
    ],
  },
  oita: {
    universities: ["大分大学", "立命館アジア太平洋大学", "大分県立看護科学大学"],
    cities: [
      { name: "大分", lon: 131.61, lat: 33.23, capital: true },
      { name: "別府", lon: 131.50, lat: 33.29 },
      { name: "中津", lon: 131.19, lat: 33.60 },
      { name: "佐伯", lon: 131.90, lat: 33.08 },
    ],
  },
  miyazaki: {
    universities: ["宮崎大学", "宮崎公立大学", "南九州大学"],
    cities: [
      { name: "宮崎", lon: 131.42, lat: 31.91, capital: true },
      { name: "都城", lon: 131.06, lat: 31.72 },
      { name: "延岡", lon: 131.66, lat: 32.58 },
      { name: "日向", lon: 131.62, lat: 32.42 },
    ],
  },
  kagoshima: {
    universities: ["鹿児島大学", "志學館大学", "鹿児島国際大学"],
    cities: [
      { name: "鹿児島", lon: 130.55, lat: 31.60, capital: true },
      { name: "霧島", lon: 130.76, lat: 31.74 },
      { name: "鹿屋", lon: 130.85, lat: 31.38 },
      { name: "薩摩川内", lon: 130.30, lat: 31.83 },
    ],
  },
  okinawa: {
    universities: ["琉球大学", "沖縄国際大学", "名桜大学", "沖縄科学技術大学院大学（OIST）"],
    cities: [
      { name: "那覇", lon: 127.68, lat: 26.21, capital: true },
      { name: "沖縄市", lon: 127.80, lat: 26.33 },
      { name: "浦添", lon: 127.72, lat: 26.25 },
      { name: "名護", lon: 127.98, lat: 26.59 },
      { name: "糸満", lon: 127.67, lat: 26.12 },
    ],
  },
};
