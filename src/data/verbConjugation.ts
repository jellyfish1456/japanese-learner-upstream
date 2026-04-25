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

// ─── 7 core forms ───────────────────────────────────────────────────────────
export const FORMS: ConjugationForm[] = [
  { key: "dict",  label: "辭書形",   labelJp: "～る／～う",  usage: "原形，查字典用" },
  { key: "masu",  label: "ます形",   labelJp: "～ます",      usage: "禮貌現在／未來" },
  { key: "te",    label: "て形",     labelJp: "～て",        usage: "連接、請求、進行" },
  { key: "ta",    label: "た形",     labelJp: "～た",        usage: "過去式（普通體）" },
  { key: "nai",   label: "ない形",   labelJp: "～ない",      usage: "否定形" },
  { key: "pot",   label: "可能形",   labelJp: "～られる",    usage: "能夠做…" },
  { key: "ba",    label: "ば形",     labelJp: "～ば",        usage: "條件假設「如果…」" },
];

// ─── Group 1：五段動詞 ───────────────────────────────────────────────────────
const G1_RULES: ConjugationRule[] = [
  {
    ending: "く",
    example: "書く",
    forms: { dict: "書く", masu: "書きます", te: "書いて", ta: "書いた", nai: "書かない", pot: "書ける", ba: "書けば" },
  },
  {
    ending: "ぐ",
    example: "泳ぐ",
    forms: { dict: "泳ぐ", masu: "泳ぎます", te: "泳いで", ta: "泳いだ", nai: "泳がない", pot: "泳げる", ba: "泳げば" },
  },
  {
    ending: "す",
    example: "話す",
    forms: { dict: "話す", masu: "話します", te: "話して", ta: "話した", nai: "話さない", pot: "話せる", ba: "話せば" },
  },
  {
    ending: "つ",
    example: "待つ",
    forms: { dict: "待つ", masu: "待ちます", te: "待って", ta: "待った", nai: "待たない", pot: "待てる", ba: "待てば" },
  },
  {
    ending: "ぬ",
    example: "死ぬ",
    forms: { dict: "死ぬ", masu: "死にます", te: "死んで", ta: "死んだ", nai: "死なない", pot: "死ねる", ba: "死ねば" },
  },
  {
    ending: "ぶ",
    example: "遊ぶ",
    forms: { dict: "遊ぶ", masu: "遊びます", te: "遊んで", ta: "遊んだ", nai: "遊ばない", pot: "遊べる", ba: "遊べば" },
  },
  {
    ending: "む",
    example: "読む",
    forms: { dict: "読む", masu: "読みます", te: "読んで", ta: "読んだ", nai: "読まない", pot: "読める", ba: "読めば" },
  },
  {
    ending: "る",
    example: "帰る",
    forms: { dict: "帰る", masu: "帰ります", te: "帰って", ta: "帰った", nai: "帰らない", pot: "帰れる", ba: "帰れば" },
  },
  {
    ending: "う",
    example: "買う",
    forms: { dict: "買う", masu: "買います", te: "買って", ta: "買った", nai: "買わない", pot: "買える", ba: "買えば" },
  },
];

const G1_VERBS: ConjugatedVerb[] = [
  { dictionary: "書く",   hiragana: "かく",     chinese: "寫",
    forms: { dict: "書く",   masu: "書きます",   te: "書いて",   ta: "書いた",   nai: "書かない",   pot: "書ける",   ba: "書けば" } },
  { dictionary: "聞く",   hiragana: "きく",     chinese: "聽／問",
    forms: { dict: "聞く",   masu: "聞きます",   te: "聞いて",   ta: "聞いた",   nai: "聞かない",   pot: "聞ける",   ba: "聞けば" } },
  { dictionary: "話す",   hiragana: "はなす",   chinese: "說話",
    forms: { dict: "話す",   masu: "話します",   te: "話して",   ta: "話した",   nai: "話さない",   pot: "話せる",   ba: "話せば" } },
  { dictionary: "待つ",   hiragana: "まつ",     chinese: "等待",
    forms: { dict: "待つ",   masu: "待ちます",   te: "待って",   ta: "待った",   nai: "待たない",   pot: "待てる",   ba: "待てば" } },
  { dictionary: "読む",   hiragana: "よむ",     chinese: "閱讀",
    forms: { dict: "読む",   masu: "読みます",   te: "読んで",   ta: "読んだ",   nai: "読まない",   pot: "読める",   ba: "読めば" } },
  { dictionary: "飲む",   hiragana: "のむ",     chinese: "喝",
    forms: { dict: "飲む",   masu: "飲みます",   te: "飲んで",   ta: "飲んだ",   nai: "飲まない",   pot: "飲める",   ba: "飲めば" } },
  { dictionary: "遊ぶ",   hiragana: "あそぶ",   chinese: "玩耍",
    forms: { dict: "遊ぶ",   masu: "遊びます",   te: "遊んで",   ta: "遊んだ",   nai: "遊ばない",   pot: "遊べる",   ba: "遊べば" } },
  { dictionary: "帰る",   hiragana: "かえる",   chinese: "回家",
    forms: { dict: "帰る",   masu: "帰ります",   te: "帰って",   ta: "帰った",   nai: "帰らない",   pot: "帰れる",   ba: "帰れば" } },
  { dictionary: "買う",   hiragana: "かう",     chinese: "買",
    forms: { dict: "買う",   masu: "買います",   te: "買って",   ta: "買った",   nai: "買わない",   pot: "買える",   ba: "買えば" } },
  { dictionary: "泳ぐ",   hiragana: "およぐ",   chinese: "游泳",
    forms: { dict: "泳ぐ",   masu: "泳ぎます",   te: "泳いで",   ta: "泳いだ",   nai: "泳がない",   pot: "泳げる",   ba: "泳げば" } },
];

// ─── Group 2：一段動詞 ───────────────────────────────────────────────────────
const G2_RULES: ConjugationRule[] = [
  {
    ending: "〜いる / 〜える",
    example: "食べる・起きる",
    forms: {
      dict: "語幹 + る",
      masu: "語幹 + ます",
      te:   "語幹 + て",
      ta:   "語幹 + た",
      nai:  "語幹 + ない",
      pot:  "語幹 + られる",
      ba:   "語幹 + れば",
    },
  },
];

const G2_VERBS: ConjugatedVerb[] = [
  { dictionary: "食べる",   hiragana: "たべる",     chinese: "吃",
    forms: { dict: "食べる",   masu: "食べます",   te: "食べて",   ta: "食べた",   nai: "食べない",   pot: "食べられる",   ba: "食べれば" } },
  { dictionary: "起きる",   hiragana: "おきる",     chinese: "起床",
    forms: { dict: "起きる",   masu: "起きます",   te: "起きて",   ta: "起きた",   nai: "起きない",   pot: "起きられる",   ba: "起きれば" } },
  { dictionary: "見る",     hiragana: "みる",       chinese: "看",
    forms: { dict: "見る",     masu: "見ます",     te: "見て",     ta: "見た",     nai: "見ない",     pot: "見られる",     ba: "見れば" } },
  { dictionary: "寝る",     hiragana: "ねる",       chinese: "睡覺",
    forms: { dict: "寝る",     masu: "寝ます",     te: "寝て",     ta: "寝た",     nai: "寝ない",     pot: "寝られる",     ba: "寝れば" } },
  { dictionary: "着る",     hiragana: "きる",       chinese: "穿（衣服）",
    forms: { dict: "着る",     masu: "着ます",     te: "着て",     ta: "着た",     nai: "着ない",     pot: "着られる",     ba: "着れば" } },
  { dictionary: "教える",   hiragana: "おしえる",   chinese: "教",
    forms: { dict: "教える",   masu: "教えます",   te: "教えて",   ta: "教えた",   nai: "教えない",   pot: "教えられる",   ba: "教えれば" } },
  { dictionary: "覚える",   hiragana: "おぼえる",   chinese: "記住",
    forms: { dict: "覚える",   masu: "覚えます",   te: "覚えて",   ta: "覚えた",   nai: "覚えない",   pot: "覚えられる",   ba: "覚えれば" } },
  { dictionary: "考える",   hiragana: "かんがえる", chinese: "思考",
    forms: { dict: "考える",   masu: "考えます",   te: "考えて",   ta: "考えた",   nai: "考えない",   pot: "考えられる",   ba: "考えれば" } },
  { dictionary: "開ける",   hiragana: "あける",     chinese: "打開",
    forms: { dict: "開ける",   masu: "開けます",   te: "開けて",   ta: "開けた",   nai: "開けない",   pot: "開けられる",   ba: "開ければ" } },
  { dictionary: "忘れる",   hiragana: "わすれる",   chinese: "忘記",
    forms: { dict: "忘れる",   masu: "忘れます",   te: "忘れて",   ta: "忘れた",   nai: "忘れない",   pot: "忘れられる",   ba: "忘れれば" } },
];

// ─── Group 3：不規則動詞 ─────────────────────────────────────────────────────
const G3_RULES: ConjugationRule[] = [
  {
    ending: "する",
    example: "する",
    forms: { dict: "する", masu: "します", te: "して", ta: "した", nai: "しない", pot: "できる", ba: "すれば" },
  },
  {
    ending: "くる",
    example: "くる",
    forms: { dict: "くる", masu: "きます", te: "きて", ta: "きた", nai: "こない", pot: "こられる", ba: "くれば" },
  },
];

const G3_VERBS: ConjugatedVerb[] = [
  { dictionary: "する",     hiragana: "する",       chinese: "做",
    forms: { dict: "する",     masu: "します",     te: "して",     ta: "した",     nai: "しない",     pot: "できる",     ba: "すれば" } },
  { dictionary: "くる",     hiragana: "くる",       chinese: "來",
    forms: { dict: "くる",     masu: "きます",     te: "きて",     ta: "きた",     nai: "こない",     pot: "こられる",   ba: "くれば" } },
  { dictionary: "勉強する", hiragana: "べんきょうする", chinese: "學習",
    forms: { dict: "勉強する", masu: "勉強します", te: "勉強して", ta: "勉強した", nai: "勉強しない", pot: "勉強できる", ba: "勉強すれば" } },
  { dictionary: "料理する", hiragana: "りょうりする", chinese: "料理",
    forms: { dict: "料理する", masu: "料理します", te: "料理して", ta: "料理した", nai: "料理しない", pot: "料理できる", ba: "料理すれば" } },
  { dictionary: "運動する", hiragana: "うんどうする", chinese: "運動",
    forms: { dict: "運動する", masu: "運動します", te: "運動して", ta: "運動した", nai: "運動しない", pot: "運動できる", ba: "運動すれば" } },
  { dictionary: "仕事する", hiragana: "しごとする",  chinese: "工作",
    forms: { dict: "仕事する", masu: "仕事します", te: "仕事して", ta: "仕事した", nai: "仕事しない", pot: "仕事できる", ba: "仕事すれば" } },
  { dictionary: "散歩する", hiragana: "さんぽする",  chinese: "散步",
    forms: { dict: "散歩する", masu: "散歩します", te: "散歩して", ta: "散歩した", nai: "散歩しない", pot: "散歩できる", ba: "散歩すれば" } },
  { dictionary: "旅行する", hiragana: "りょこうする", chinese: "旅行",
    forms: { dict: "旅行する", masu: "旅行します", te: "旅行して", ta: "旅行した", nai: "旅行しない", pot: "旅行できる", ba: "旅行すれば" } },
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
