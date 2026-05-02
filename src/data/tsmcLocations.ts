export interface TSMCLocation {
  id: string;
  name: string;
  nameEn: string;
  prefecture: string;
  type: "fab" | "office" | "rd";
  lon: number;
  lat: number;
  detail: string;
  openYear?: string;
}

export const tsmcLocations: TSMCLocation[] = [
  {
    id: "jasm-kumamoto-1",
    name: "JASM 熊本工場（第一期）",
    nameEn: "JASM Kumamoto Fab 1",
    prefecture: "kumamoto",
    type: "fab",
    lon: 130.87,
    lat: 32.86,
    detail: "2024年2月開所。22/28nmプロセス。日本初のTSMC先端ファブ。",
    openYear: "2024",
  },
  {
    id: "jasm-kumamoto-2",
    name: "JASM 熊本工場（第二期）",
    nameEn: "JASM Kumamoto Fab 2",
    prefecture: "kumamoto",
    type: "fab",
    lon: 130.88,
    lat: 32.87,
    detail: "建設中（2027年開所予定）。6/7nmプロセス。",
    openYear: "2027予定",
  },
  {
    id: "tsmc-japan-yokohama",
    name: "TSMC Japan Ltd.（横浜本社）",
    nameEn: "TSMC Japan HQ – Yokohama",
    prefecture: "kanagawa",
    type: "office",
    lon: 139.63,
    lat: 35.46,
    detail: "日本法人本社。営業・マーケティング・顧客サポート。",
  },
  {
    id: "tsmc-japan-tokyo",
    name: "TSMC Japan 東京オフィス",
    nameEn: "TSMC Japan Tokyo Office",
    prefecture: "tokyo",
    type: "office",
    lon: 139.74,
    lat: 35.66,
    detail: "品川。東京エリア顧客対応・エンジニアリングサポート。",
  },
  {
    id: "tsmc-tsukuba-rd",
    name: "TSMC 3DIC研究開発センター",
    nameEn: "TSMC 3DIC R&D Center – Tsukuba",
    prefecture: "ibaraki",
    type: "rd",
    lon: 140.10,
    lat: 36.08,
    detail: "つくば。先端3DIC・CoWoS先進パッケージング研究拠点。",
  },
];

export const TYPE_LABEL: Record<string, string> = {
  fab: "工場",
  office: "オフィス",
  rd: "研究開発",
};

export const TYPE_COLOR: Record<string, string> = {
  fab: "#ef4444",   // red
  office: "#3b82f6", // blue
  rd: "#8b5cf6",    // purple
};
