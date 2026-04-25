export interface ConjugationForm {
  key: string;
  label: string;       // 中文名稱
  labelJp: string;     // 日文名稱
  usage: string;       // 用法說明
}

export interface ConjugatedVerb {
  dictionary: string;
  hiragana: string;
  chinese: string;
  forms: Record<string, string>; // key → conjugated form
}

export interface ConjugationRule {
  ending: string;      // 語尾（如 く）
  example: string;     // 例詞（書く）
  forms: Record<string, string>;
}

export interface VerbGroup {
  id: string;
  label: string;       // 第一類
  labelJp: string;     // 五段動詞・う動詞
  color: string;       // Tailwind bg/text classes
  description: string;
  howToIdentify: string;
  conjugationRules: ConjugationRule[];
  commonVerbs: ConjugatedVerb[];
}

export interface FormDetail {
  key: string;
  day: number;          // 0-7
  label: string;        // 中文名稱
  color: string;        // Tailwind color
  summary: string;      // 一句用途說明
  explanation: string;  // 詳細說明
  g1Rule: string;       // G1 變化規則說明
  g2Rule: string;       // G2 變化規則說明
  g3Rule: string;       // G3 變化規則說明
}

// ─── 11 core forms ──────────────────────────────────────────────────────────
export const FORMS: ConjugationForm[] = [
  { key: "dict",  label: "辭書形",     labelJp: "～る／～う",      usage: "原形，查字典用" },
  { key: "masu",  label: "ます形",     labelJp: "～ます",          usage: "禮貌現在／未來" },
  { key: "te",    label: "て形",       labelJp: "～て",            usage: "連接、請求、進行" },
  { key: "ta",    label: "た形",       labelJp: "～た",            usage: "過去式（普通體）" },
  { key: "nai",   label: "ない形",     labelJp: "～ない",          usage: "否定形" },
  { key: "pot",   label: "可能形",     labelJp: "～られる",        usage: "能夠做…" },
  { key: "ba",    label: "ば形",       labelJp: "～ば",            usage: "條件假設「如果…」" },
  { key: "vol",   label: "意向形",     labelJp: "～よう／～おう",  usage: "意志、邀請「一起…吧」" },
  { key: "caus",  label: "使役形",     labelJp: "～させる",        usage: "讓某人做…（使役）" },
  { key: "pass",  label: "受身形",     labelJp: "～られる",        usage: "被做…（被動）" },
  { key: "causp", label: "使役受身形", labelJp: "～させられる",    usage: "被迫做…（使役被動）" },
];

// ─── Group 1：五段動詞 ───────────────────────────────────────────────────────
const G1_RULES: ConjugationRule[] = [
  {
    ending: "く",
    example: "書く",
    forms: { dict: "書く", masu: "書きます", te: "書いて", ta: "書いた", nai: "書かない", pot: "書ける", ba: "書けば", vol: "書こう", caus: "書かせる", pass: "書かれる", causp: "書かせられる" },
  },
  {
    ending: "ぐ",
    example: "泳ぐ",
    forms: { dict: "泳ぐ", masu: "泳ぎます", te: "泳いで", ta: "泳いだ", nai: "泳がない", pot: "泳げる", ba: "泳げば", vol: "泳ごう", caus: "泳がせる", pass: "泳がれる", causp: "泳がせられる" },
  },
  {
    ending: "す",
    example: "話す",
    forms: { dict: "話す", masu: "話します", te: "話して", ta: "話した", nai: "話さない", pot: "話せる", ba: "話せば", vol: "話そう", caus: "話させる", pass: "話される", causp: "話させられる" },
  },
  {
    ending: "つ",
    example: "待つ",
    forms: { dict: "待つ", masu: "待ちます", te: "待って", ta: "待った", nai: "待たない", pot: "待てる", ba: "待てば", vol: "待とう", caus: "待たせる", pass: "待たれる", causp: "待たせられる" },
  },
  {
    ending: "ぬ",
    example: "死ぬ",
    forms: { dict: "死ぬ", masu: "死にます", te: "死んで", ta: "死んだ", nai: "死なない", pot: "死ねる", ba: "死ねば", vol: "死のう", caus: "死なせる", pass: "死なれる", causp: "死なせられる" },
  },
  {
    ending: "ぶ",
    example: "遊ぶ",
    forms: { dict: "遊ぶ", masu: "遊びます", te: "遊んで", ta: "遊んだ", nai: "遊ばない", pot: "遊べる", ba: "遊べば", vol: "遊ぼう", caus: "遊ばせる", pass: "遊ばれる", causp: "遊ばせられる" },
  },
  {
    ending: "む",
    example: "読む",
    forms: { dict: "読む", masu: "読みます", te: "読んで", ta: "読んだ", nai: "読まない", pot: "読める", ba: "読めば", vol: "読もう", caus: "読ませる", pass: "読まれる", causp: "読ませられる" },
  },
  {
    ending: "る",
    example: "帰る",
    forms: { dict: "帰る", masu: "帰ります", te: "帰って", ta: "帰った", nai: "帰らない", pot: "帰れる", ba: "帰れば", vol: "帰ろう", caus: "帰らせる", pass: "帰られる", causp: "帰らせられる" },
  },
  {
    ending: "う",
    example: "買う",
    forms: { dict: "買う", masu: "買います", te: "買って", ta: "買った", nai: "買わない", pot: "買える", ba: "買えば", vol: "買おう", caus: "買わせる", pass: "買われる", causp: "買わせられる" },
  },
];

const G1_VERBS: ConjugatedVerb[] = [
  { dictionary: "書く",   hiragana: "かく",     chinese: "寫",
    forms: { dict: "書く",   masu: "書きます",   te: "書いて",   ta: "書いた",   nai: "書かない",   pot: "書ける",   ba: "書けば",   vol: "書こう",   caus: "書かせる",   pass: "書かれる",   causp: "書かせられる" } },
  { dictionary: "聞く",   hiragana: "きく",     chinese: "聽／問",
    forms: { dict: "聞く",   masu: "聞きます",   te: "聞いて",   ta: "聞いた",   nai: "聞かない",   pot: "聞ける",   ba: "聞けば",   vol: "聞こう",   caus: "聞かせる",   pass: "聞かれる",   causp: "聞かせられる" } },
  { dictionary: "話す",   hiragana: "はなす",   chinese: "說話",
    forms: { dict: "話す",   masu: "話します",   te: "話して",   ta: "話した",   nai: "話さない",   pot: "話せる",   ba: "話せば",   vol: "話そう",   caus: "話させる",   pass: "話される",   causp: "話させられる" } },
  { dictionary: "待つ",   hiragana: "まつ",     chinese: "等待",
    forms: { dict: "待つ",   masu: "待ちます",   te: "待って",   ta: "待った",   nai: "待たない",   pot: "待てる",   ba: "待てば",   vol: "待とう",   caus: "待たせる",   pass: "待たれる",   causp: "待たせられる" } },
  { dictionary: "読む",   hiragana: "よむ",     chinese: "閱讀",
    forms: { dict: "読む",   masu: "読みます",   te: "読んで",   ta: "読んだ",   nai: "読まない",   pot: "読める",   ba: "読めば",   vol: "読もう",   caus: "読ませる",   pass: "読まれる",   causp: "読ませられる" } },
  { dictionary: "飲む",   hiragana: "のむ",     chinese: "喝",
    forms: { dict: "飲む",   masu: "飲みます",   te: "飲んで",   ta: "飲んだ",   nai: "飲まない",   pot: "飲める",   ba: "飲めば",   vol: "飲もう",   caus: "飲ませる",   pass: "飲まれる",   causp: "飲ませられる" } },
  { dictionary: "遊ぶ",   hiragana: "あそぶ",   chinese: "玩耍",
    forms: { dict: "遊ぶ",   masu: "遊びます",   te: "遊んで",   ta: "遊んだ",   nai: "遊ばない",   pot: "遊べる",   ba: "遊べば",   vol: "遊ぼう",   caus: "遊ばせる",   pass: "遊ばれる",   causp: "遊ばせられる" } },
  { dictionary: "帰る",   hiragana: "かえる",   chinese: "回家",
    forms: { dict: "帰る",   masu: "帰ります",   te: "帰って",   ta: "帰った",   nai: "帰らない",   pot: "帰れる",   ba: "帰れば",   vol: "帰ろう",   caus: "帰らせる",   pass: "帰られる",   causp: "帰らせられる" } },
  { dictionary: "買う",   hiragana: "かう",     chinese: "買",
    forms: { dict: "買う",   masu: "買います",   te: "買って",   ta: "買った",   nai: "買わない",   pot: "買える",   ba: "買えば",   vol: "買おう",   caus: "買わせる",   pass: "買われる",   causp: "買わせられる" } },
  { dictionary: "泳ぐ",   hiragana: "およぐ",   chinese: "游泳",
    forms: { dict: "泳ぐ",   masu: "泳ぎます",   te: "泳いで",   ta: "泳いだ",   nai: "泳がない",   pot: "泳げる",   ba: "泳げば",   vol: "泳ごう",   caus: "泳がせる",   pass: "泳がれる",   causp: "泳がせられる" } },
];

// ─── Group 2：一段動詞 ───────────────────────────────────────────────────────
const G2_RULES: ConjugationRule[] = [
  {
    ending: "〜いる / 〜える",
    example: "食べる・起きる",
    forms: {
      dict:  "語幹 + る",
      masu:  "語幹 + ます",
      te:    "語幹 + て",
      ta:    "語幹 + た",
      nai:   "語幹 + ない",
      pot:   "語幹 + られる",
      ba:    "語幹 + れば",
      vol:   "語幹 + よう",
      caus:  "語幹 + させる",
      pass:  "語幹 + られる",
      causp: "語幹 + させられる",
    },
  },
];

const G2_VERBS: ConjugatedVerb[] = [
  { dictionary: "食べる",   hiragana: "たべる",     chinese: "吃",
    forms: { dict: "食べる",   masu: "食べます",   te: "食べて",   ta: "食べた",   nai: "食べない",   pot: "食べられる",   ba: "食べれば",   vol: "食べよう",   caus: "食べさせる",   pass: "食べられる",   causp: "食べさせられる" } },
  { dictionary: "起きる",   hiragana: "おきる",     chinese: "起床",
    forms: { dict: "起きる",   masu: "起きます",   te: "起きて",   ta: "起きた",   nai: "起きない",   pot: "起きられる",   ba: "起きれば",   vol: "起きよう",   caus: "起きさせる",   pass: "起きられる",   causp: "起きさせられる" } },
  { dictionary: "見る",     hiragana: "みる",       chinese: "看",
    forms: { dict: "見る",     masu: "見ます",     te: "見て",     ta: "見た",     nai: "見ない",     pot: "見られる",     ba: "見れば",     vol: "見よう",     caus: "見させる",     pass: "見られる",     causp: "見させられる" } },
  { dictionary: "寝る",     hiragana: "ねる",       chinese: "睡覺",
    forms: { dict: "寝る",     masu: "寝ます",     te: "寝て",     ta: "寝た",     nai: "寝ない",     pot: "寝られる",     ba: "寝れば",     vol: "寝よう",     caus: "寝させる",     pass: "寝られる",     causp: "寝させられる" } },
  { dictionary: "着る",     hiragana: "きる",       chinese: "穿（衣服）",
    forms: { dict: "着る",     masu: "着ます",     te: "着て",     ta: "着た",     nai: "着ない",     pot: "着られる",     ba: "着れば",     vol: "着よう",     caus: "着させる",     pass: "着られる",     causp: "着させられる" } },
  { dictionary: "教える",   hiragana: "おしえる",   chinese: "教",
    forms: { dict: "教える",   masu: "教えます",   te: "教えて",   ta: "教えた",   nai: "教えない",   pot: "教えられる",   ba: "教えれば",   vol: "教えよう",   caus: "教えさせる",   pass: "教えられる",   causp: "教えさせられる" } },
  { dictionary: "覚える",   hiragana: "おぼえる",   chinese: "記住",
    forms: { dict: "覚える",   masu: "覚えます",   te: "覚えて",   ta: "覚えた",   nai: "覚えない",   pot: "覚えられる",   ba: "覚えれば",   vol: "覚えよう",   caus: "覚えさせる",   pass: "覚えられる",   causp: "覚えさせられる" } },
  { dictionary: "考える",   hiragana: "かんがえる", chinese: "思考",
    forms: { dict: "考える",   masu: "考えます",   te: "考えて",   ta: "考えた",   nai: "考えない",   pot: "考えられる",   ba: "考えれば",   vol: "考えよう",   caus: "考えさせる",   pass: "考えられる",   causp: "考えさせられる" } },
  { dictionary: "開ける",   hiragana: "あける",     chinese: "打開",
    forms: { dict: "開ける",   masu: "開けます",   te: "開けて",   ta: "開けた",   nai: "開けない",   pot: "開けられる",   ba: "開ければ",   vol: "開けよう",   caus: "開けさせる",   pass: "開けられる",   causp: "開けさせられる" } },
  { dictionary: "忘れる",   hiragana: "わすれる",   chinese: "忘記",
    forms: { dict: "忘れる",   masu: "忘れます",   te: "忘れて",   ta: "忘れた",   nai: "忘れない",   pot: "忘れられる",   ba: "忘れれば",   vol: "忘れよう",   caus: "忘れさせる",   pass: "忘れられる",   causp: "忘れさせられる" } },
];

// ─── Group 3：不規則動詞 ─────────────────────────────────────────────────────
const G3_RULES: ConjugationRule[] = [
  {
    ending: "する",
    example: "する",
    forms: { dict: "する", masu: "します", te: "して", ta: "した", nai: "しない", pot: "できる", ba: "すれば", vol: "しよう", caus: "させる", pass: "される", causp: "させられる" },
  },
  {
    ending: "くる",
    example: "くる",
    forms: { dict: "くる", masu: "きます", te: "きて", ta: "きた", nai: "こない", pot: "こられる", ba: "くれば", vol: "こよう", caus: "こさせる", pass: "こられる", causp: "こさせられる" },
  },
];

const G3_VERBS: ConjugatedVerb[] = [
  { dictionary: "する",     hiragana: "する",       chinese: "做",
    forms: { dict: "する",     masu: "します",     te: "して",     ta: "した",     nai: "しない",     pot: "できる",     ba: "すれば",     vol: "しよう",     caus: "させる",     pass: "される",     causp: "させられる" } },
  { dictionary: "くる",     hiragana: "くる",       chinese: "來",
    forms: { dict: "くる",     masu: "きます",     te: "きて",     ta: "きた",     nai: "こない",     pot: "こられる",   ba: "くれば",     vol: "こよう",     caus: "こさせる",   pass: "こられる",   causp: "こさせられる" } },
  { dictionary: "勉強する", hiragana: "べんきょうする", chinese: "學習",
    forms: { dict: "勉強する", masu: "勉強します", te: "勉強して", ta: "勉強した", nai: "勉強しない", pot: "勉強できる", ba: "勉強すれば", vol: "勉強しよう", caus: "勉強させる", pass: "勉強される", causp: "勉強させられる" } },
  { dictionary: "料理する", hiragana: "りょうりする", chinese: "料理",
    forms: { dict: "料理する", masu: "料理します", te: "料理して", ta: "料理した", nai: "料理しない", pot: "料理できる", ba: "料理すれば", vol: "料理しよう", caus: "料理させる", pass: "料理される", causp: "料理させられる" } },
  { dictionary: "運動する", hiragana: "うんどうする", chinese: "運動",
    forms: { dict: "運動する", masu: "運動します", te: "運動して", ta: "運動した", nai: "運動しない", pot: "運動できる", ba: "運動すれば", vol: "運動しよう", caus: "運動させる", pass: "運動される", causp: "運動させられる" } },
  { dictionary: "仕事する", hiragana: "しごとする",  chinese: "工作",
    forms: { dict: "仕事する", masu: "仕事します", te: "仕事して", ta: "仕事した", nai: "仕事しない", pot: "仕事できる", ba: "仕事すれば", vol: "仕事しよう", caus: "仕事させる", pass: "仕事される", causp: "仕事させられる" } },
  { dictionary: "散歩する", hiragana: "さんぽする",  chinese: "散步",
    forms: { dict: "散歩する", masu: "散歩します", te: "散歩して", ta: "散歩した", nai: "散歩しない", pot: "散歩できる", ba: "散歩すれば", vol: "散歩しよう", caus: "散歩させる", pass: "散歩される", causp: "散歩させられる" } },
  { dictionary: "旅行する", hiragana: "りょこうする", chinese: "旅行",
    forms: { dict: "旅行する", masu: "旅行します", te: "旅行して", ta: "旅行した", nai: "旅行しない", pot: "旅行できる", ba: "旅行すれば", vol: "旅行しよう", caus: "旅行させる", pass: "旅行される", causp: "旅行させられる" } },
];

// ─── Form details organized by day ──────────────────────────────────────────
export const FORM_DETAILS: FormDetail[] = [
  {
    key: "nai",
    day: 1,
    label: "ない形",
    color: "bg-red-500",
    summary: "否定形式，表示「不做某事」",
    explanation: "否定句的基礎形式。用來表示否定動作、狀態或能力。常見搭配：ないでください（請不要...）、なければならない（必須...）、なくてもいい（不用...）",
    g1Rule: "う段 → あ段 + ない（書く→書かない；買う→買わない）",
    g2Rule: "語幹 + ない（食べる→食べない；起きる→起きない）",
    g3Rule: "する→しない；くる→こない；勉強する→勉強しない",
  },
  {
    key: "masu",
    day: 2,
    label: "ます形",
    color: "bg-orange-500",
    summary: "禮貌體，最常用的敬語形式",
    explanation: "日常會話中最常見的形式，用於正式、禮貌的場合。可以表示現在、未來、習慣性動作。常見搭配：ませんか（要不要...）、ましょう（一起...吧）、たいです（想要...）",
    g1Rule: "う段 → い段 + ます（書く→書きます；待つ→待ちます）",
    g2Rule: "語幹 + ます（食べる→食べます；見る→見ます）",
    g3Rule: "する→します；くる→きます；勉強する→勉強します",
  },
  {
    key: "dict",
    day: 3,
    label: "辭書形",
    color: "bg-blue-500",
    summary: "原形，查字典時的標準形式",
    explanation: "動詞的基礎形態，所有變化的源頭。用於普通體的現在式、未來式。常見搭配：つもり（打算...）、予定（計劃...）、前に（...之前）、ことができる（能夠...）",
    g1Rule: "そのまま（書く、読む、泳ぐ等）",
    g2Rule: "そのまま（食べる、見る、起きる等）",
    g3Rule: "する、くる、勉強する等（保持原形）",
  },
  {
    key: "te",
    day: 4,
    label: "て形",
    color: "bg-emerald-500",
    summary: "連接形式，銜接多個動作或請求",
    explanation: "用來連接兩個動作、表示原因、請求、授受。常見搭配：いる（進行中）、いた（持續）、ください（請求）、もらう（受惠）、あげる（給予）",
    g1Rule: "く/ぐ→いて（書く→書いて；泳ぐ→泳いで）；す→して；つ/ぬ/ぶ/む→んで（待つ→待って）",
    g2Rule: "語幹 + て（食べる→食べて；見る→見て）",
    g3Rule: "する→して；くる→きて；勉強する→勉強して",
  },
  {
    key: "ta",
    day: 4,
    label: "た形",
    color: "bg-cyan-500",
    summary: "過去式，表示完成的動作或事件",
    explanation: "普通體的過去式。表示已完成的動作、曾經的經歷。常見搭配：ばかり（才剛...）、ことがある（有過...的經驗）、らしい（聽說...）",
    g1Rule: "く/ぐ→いた（書く→書いた；泳ぐ→泳いだ）；す→した；つ/ぬ/ぶ/む→んだ（待つ→待った）",
    g2Rule: "語幹 + た（食べる→食べた；見る→見た）",
    g3Rule: "する→した；くる→きた；勉強する→勉強した",
  },
  {
    key: "pot",
    day: 5,
    label: "可能形",
    color: "bg-purple-500",
    summary: "能力・可能性，表示「能夠...」",
    explanation: "表示擁有做某事的能力，或某事有可能發生。常見搭配：できます（能夠...）、はずです（應該...）、かもしれません（可能...）",
    g1Rule: "う段 → え段 + る（書く→書ける；待つ→待てる）",
    g2Rule: "語幹 + られる（食べる→食べられる；見る→見られる）",
    g3Rule: "する→できる；くる→こられる；勉強する→勉強できる",
  },
  {
    key: "ba",
    day: 5,
    label: "ば形",
    color: "bg-pink-500",
    summary: "條件形式，表示「如果...」的假設",
    explanation: "表示一個條件或假設。常見搭配：たら、なら（同義的條件表現）、いいです（就好了）、ばいいです（就好了）",
    g1Rule: "え段 + ば（書く→書けば；待つ→待てば）",
    g2Rule: "語幹 + れば（食べる→食べれば；見る→見れば）",
    g3Rule: "する→すれば；くる→くれば；勉強する→勉強すれば",
  },
  {
    key: "vol",
    day: 6,
    label: "意向形",
    color: "bg-indigo-500",
    summary: "意志・提議，表示「一起...吧」",
    explanation: "表達說話者的意志或邀請他人一起做某事。常見搭配：ましょう（禮貌邀請）、つもり（打算...）、はずです（應該會...）",
    g1Rule: "お段 + う（書く→書こう；待つ→待とう；買う→買おう）",
    g2Rule: "語幹 + よう（食べる→食べよう；見る→見よう）",
    g3Rule: "する→しよう；くる→こよう；勉強する→勉強しよう",
  },
  {
    key: "caus",
    day: 7,
    label: "使役形",
    color: "bg-rose-500",
    summary: "讓某人做某事，表示使役關係",
    explanation: "表示讓某人去做某事。常見搭配：させます（讓...做）、させられます（被迫...）",
    g1Rule: "あ段 + せる（書く→書かせる；待つ→待たせる）",
    g2Rule: "語幹 + させる（食べる→食べさせる；見る→見させる）",
    g3Rule: "する→させる；くる→こさせる；勉強する→勉強させる",
  },
  {
    key: "pass",
    day: 7,
    label: "受身形",
    color: "bg-amber-500",
    summary: "被動形式，表示「被...」",
    explanation: "表達被動的行為，即主語是動作的接收者而非執行者。常見搭配：られます（被...）、ています（正在被...）",
    g1Rule: "あ段 + れる（書く→書かれる；待つ→待たれる）",
    g2Rule: "語幹 + られる（食べる→食べられる；見る→見られる）",
    g3Rule: "する→される；くる→こられる；勉強する→勉強される",
  },
  {
    key: "causp",
    day: 7,
    label: "使役受身形",
    color: "bg-fuchsia-500",
    summary: "被迫做某事，使役的被動形式",
    explanation: "表示被迫或被強制去做某事，是最複雜的形式。常見搭配：させられます（被迫...）、させられました（被迫去做...了）",
    g1Rule: "あ段 + させられる（書く→書かせられる；待つ→待たせられる）",
    g2Rule: "語幹 + させられる（食べる→食べさせられる；見る→見させられる）",
    g3Rule: "する→させられる；くる→こさせられる；勉強する→勉強させられる",
  },
];

// ─── Exported groups ─────────────────────────────────────────────────────────
export const VERB_GROUPS: VerbGroup[] = [
  {
    id: "g1",
    label: "第一類",
    labelJp: "五段動詞（う動詞）",
    color: "bg-blue-500",
    description: "語尾為「う段」音（く、ぐ、す、つ、ぬ、ぶ、む、る、う）。活用時語尾在五段假名之間變化，故稱「五段」。",
    howToIdentify: "辭書形語尾為 く／ぐ／す／つ／ぬ／ぶ／む／う，或語尾為 る 但前一音非 i/e 段（如：帰る、走る）",
    conjugationRules: G1_RULES,
    commonVerbs: G1_VERBS,
  },
  {
    id: "g2",
    label: "第二類",
    labelJp: "一段動詞（る動詞）",
    color: "bg-emerald-500",
    description: "語尾為「る」，前一個假名的母音是 i 或 e（如：たべ→る、おき→る）。活用時只去掉語尾「る」，故稱「一段」。",
    howToIdentify: "辭書形語尾為 る，且前一假名為 い段（起きる、着る、見る）或 え段（食べる、教える、覚える）",
    conjugationRules: G2_RULES,
    commonVerbs: G2_VERBS,
  },
  {
    id: "g3",
    label: "第三類",
    labelJp: "不規則動詞（カ行・サ行）",
    color: "bg-orange-500",
    description: "只有「する」和「くる」兩個真正的不規則動詞，以及所有「名詞＋する」複合動詞。必須逐一記憶。",
    howToIdentify: "「する」「くる」以及「〇〇する」複合動詞（勉強する、旅行する 等）",
    conjugationRules: G3_RULES,
    commonVerbs: G3_VERBS,
  },
];
