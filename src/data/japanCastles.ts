export interface CastleData {
  name: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  lon: number;
  lat: number;
  tags: string[]; // 国宝, 世界遺産, 現存天守 etc.
}

// Uses Wikimedia Special:Redirect (auto-resolves to correct thumbnail).
// All filenames verified via HEAD 301 check against commons.wikimedia.org.
const W = 600; // thumbnail width
function wm(file: string): string {
  return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(file)}&width=${W}`;
}

export const castlesByPrefecture: Record<string, CastleData[]> = {
  hokkaido: [
    {
      name: "五稜郭",
      nameEn: "Goryokaku Fort",
      description: "日本初の洋式城郭。星形の要塞が美しい幕末の歴史スポット。タワーからの航空写真が絶景。",
      imageUrl: wm("Hakodate_Goryokaku_Panorama_1.JPG"),
      lon: 140.73, lat: 41.80,
      tags: ["特別史跡"],
    },
  ],
  aomori: [
    {
      name: "弘前城",
      nameEn: "Hirosaki Castle",
      description: "東北で唯一、江戸時代建築の天守が現存する城。春は日本最高峰の桜の名所。",
      imageUrl: wm("Hirosaki-castle_Aomori_with_Sakura_blossoms.jpg"),
      lon: 140.47, lat: 40.61,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  iwate: [
    {
      name: "盛岡城（不来方城）",
      nameEn: "Morioka Castle",
      description: "南部氏の居城。城跡は現在の岩手公園として整備され、石垣と桜が美しい。",
      imageUrl: wm("171103_Morioka_Castle_Morioka_Iwate_pref_Japan20s3.jpg"),
      lon: 141.15, lat: 39.70,
      tags: ["史跡"],
    },
  ],
  miyagi: [
    {
      name: "仙台城（青葉城）",
      nameEn: "Sendai Castle",
      description: "伊達政宗が築いた山城。独眼竜の騎馬像と仙台市街の眺望が有名。",
      imageUrl: wm("Waki-yagura_of_Sendai_Castle_20220910b.jpg"),
      lon: 140.84, lat: 38.25,
      tags: ["史跡"],
    },
  ],
  akita: [
    {
      name: "久保田城（秋田城）",
      nameEn: "Kubota Castle",
      description: "佐竹氏の居城。土塁と木造の御隅櫓が特徴的な東北の城郭。千秋公園として整備。",
      imageUrl: wm("Osumi-Yagura_of_Kubota-Castle_20160424.jpg"),
      lon: 140.10, lat: 39.72,
      tags: ["史跡"],
    },
  ],
  yamagata: [
    {
      name: "山形城（霞城）",
      nameEn: "Yamagata Castle",
      description: "最上義光が整備した大城郭。霞城公園として整備され、二ノ丸東大手門が復元されている。",
      imageUrl: wm("220430_Yamagata_Castle_Yamagata_Yamagata_pref_Japan23s3.jpg"),
      lon: 140.36, lat: 38.24,
      tags: ["史跡"],
    },
  ],
  fukushima: [
    {
      name: "鶴ヶ城（会津若松城）",
      nameEn: "Tsurugajo Castle",
      description: "幕末に白虎隊が命を懸けて守った名城。赤瓦が特徴的な東北屈指の名城。",
      imageUrl: wm("Aizuwakamatsu_Castle_ac_(1).jpg"),
      lon: 139.93, lat: 37.49,
      tags: ["史跡"],
    },
  ],
  ibaraki: [
    {
      name: "水戸城",
      nameEn: "Mito Castle",
      description: "徳川御三家・水戸徳川家の居城。日本三名園の偕楽園が隣接し、弘道館が重要文化財。",
      imageUrl: wm("Mito_castle_sannomaru_karabori.jpg"),
      lon: 140.45, lat: 36.37,
      tags: ["史跡"],
    },
  ],
  tochigi: [
    {
      name: "宇都宮城（亀ヶ岡城）",
      nameEn: "Utsunomiya Castle",
      description: "壬生氏の居城として栄えた平城。富士見櫓・清明台が復元され、城址公園として整備。",
      imageUrl: wm("Utsunomiya-jo_fujimi-yagura.jpg"),
      lon: 139.88, lat: 36.55,
      tags: ["史跡"],
    },
  ],
  gunma: [
    {
      name: "箕輪城",
      nameEn: "Minowa Castle",
      description: "長野氏・武田氏・北条氏・徳川氏が相次いで支配した戦国の堅城。空堀が見事。",
      imageUrl: wm("Minowajyo.jpg"),
      lon: 139.00, lat: 36.43,
      tags: ["史跡"],
    },
  ],
  saitama: [
    {
      name: "川越城（本丸御殿）",
      nameEn: "Kawagoe Castle",
      description: "小江戸川越の象徴。江戸時代の本丸御殿が現存する貴重な城。",
      imageUrl: wm("Kawagoejou.jpg"),
      lon: 139.49, lat: 35.93,
      tags: ["重要文化財"],
    },
  ],
  chiba: [
    {
      name: "佐倉城",
      nameEn: "Sakura Castle",
      description: "堀田氏の居城。近世城郭として整備され、国立歴史民俗博物館の隣に城址が残る。",
      imageUrl: wm("Sakura_Castle_2.JPG"),
      lon: 140.22, lat: 35.72,
      tags: ["史跡"],
    },
  ],
  tokyo: [
    {
      name: "江戸城（皇居）",
      nameEn: "Edo Castle (Imperial Palace)",
      description: "徳川将軍の居城、現在は皇居。内堀と石垣が幕府の威容を伝える。",
      imageUrl: wm("Edo_P_detail.jpg"),
      lon: 139.75, lat: 35.69,
      tags: ["特別史跡"],
    },
  ],
  kanagawa: [
    {
      name: "小田原城",
      nameEn: "Odawara Castle",
      description: "北条氏の堅城として戦国最強の守りを誇った名城。",
      imageUrl: wm("Odawara-jo.jpg"),
      lon: 139.16, lat: 35.25,
      tags: ["史跡"],
    },
  ],
  niigata: [
    {
      name: "新発田城",
      nameEn: "Shibata Castle",
      description: "三匹の鯱をもつ独特の三階櫓が現存。辰巳櫓は国の重要文化財。",
      imageUrl: wm("Shibatajo004.JPG"),
      lon: 139.33, lat: 37.94,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  toyama: [
    {
      name: "富山城",
      nameEn: "Toyama Castle",
      description: "前田家の支城として栄えた平城。現在の模擬天守は市民俗民芸村として活用。",
      imageUrl: wm("Toyama_Municipal_Folk_Museum_(mock_keep_tower_of_the_Toyama_Castle)_20180503.jpg"),
      lon: 137.21, lat: 36.70,
      tags: ["史跡"],
    },
  ],
  ishikawa: [
    {
      name: "金沢城",
      nameEn: "Kanazawa Castle",
      description: "加賀百万石・前田家の居城。白漆喰の石川門が美しい。",
      imageUrl: wm("Kanazawa-M-5937.jpg"),
      lon: 136.66, lat: 36.57,
      tags: ["史跡", "重要文化財"],
    },
  ],
  fukui: [
    {
      name: "丸岡城",
      nameEn: "Maruoka Castle",
      description: "現存十二天守の一つ。日本最古の天守とも言われる歴史的建造物。",
      imageUrl: wm("Maruoka_Castle_20100529-01.jpg"),
      lon: 136.27, lat: 36.15,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  yamanashi: [
    {
      name: "甲府城（舞鶴城）",
      nameEn: "Kofu Castle",
      description: "武田氏滅亡後に徳川・豊臣が整備した総石垣の城。天守台からは富士山が望める。",
      imageUrl: wm("KofuCastle.jpg"),
      lon: 138.57, lat: 35.66,
      tags: ["史跡"],
    },
  ],
  nagano: [
    {
      name: "松本城",
      nameEn: "Matsumoto Castle",
      description: "現存する五重六階天守の中で日本最古。黒塗り壁から「烏城」とも呼ばれる。",
      imageUrl: wm("Matsumoto_Castle_Keep_Tower.jpg"),
      lon: 137.97, lat: 36.24,
      tags: ["国宝", "現存天守"],
    },
    {
      name: "上田城",
      nameEn: "Ueda Castle",
      description: "真田氏の本拠地。徳川軍を二度退けた不落の名城。",
      imageUrl: wm("Ueda_Castle_Amagafuchi.jpg"),
      lon: 138.25, lat: 36.40,
      tags: ["史跡"],
    },
  ],
  shizuoka: [
    {
      name: "駿府城",
      nameEn: "Sunpu Castle",
      description: "徳川家康が晩年を過ごした城。巽櫓・東御門が復元されている。",
      imageUrl: wm("Sunpu-castle_tatsumi-yagura.JPG"),
      lon: 138.39, lat: 34.98,
      tags: ["史跡"],
    },
  ],
  aichi: [
    {
      name: "名古屋城",
      nameEn: "Nagoya Castle",
      description: "金の鯱で有名な尾張徳川家の居城。本丸御殿は精緻な障壁画が圧巻。",
      imageUrl: wm("Nagoya_Castle_7.jpg"),
      lon: 136.90, lat: 35.19,
      tags: ["特別史跡", "重要文化財"],
    },
    {
      name: "犬山城",
      nameEn: "Inuyama Castle",
      description: "木曽川岸に聳える国宝天守。現存天守の中で最古の建築形式。",
      imageUrl: wm("Castle_in_Inuyama.JPG"),
      lon: 136.94, lat: 35.39,
      tags: ["国宝", "現存天守"],
    },
  ],
  gifu: [
    {
      name: "岐阜城",
      nameEn: "Gifu Castle",
      description: "金華山山頂に聳え立ち、信長が「天下布武」の拠点とした山城。",
      imageUrl: wm("Gifu_Castle.jpg"),
      lon: 136.77, lat: 35.44,
      tags: ["史跡"],
    },
  ],
  mie: [
    {
      name: "松阪城",
      nameEn: "Matsusaka Castle",
      description: "蒲生氏郷が築いた堅固な山城。野面積みの石垣が残り、松阪商人の城下町を一望できる。",
      imageUrl: wm("松坂城1.jpg"),
      lon: 136.53, lat: 34.58,
      tags: ["史跡"],
    },
  ],
  shiga: [
    {
      name: "彦根城",
      nameEn: "Hikone Castle",
      description: "国宝四城の一つ。400年の歴史を誇る現存天守と美しい庭園・玄宮園。",
      imageUrl: wm("Hikone_Castle_November_2016_-02.jpg"),
      lon: 136.25, lat: 35.27,
      tags: ["国宝", "現存天守"],
    },
  ],
  kyoto: [
    {
      name: "二条城",
      nameEn: "Nijo Castle",
      description: "徳川将軍家の京都の宿城。大政奉還が宣言された歴史的場所。世界遺産。",
      imageUrl: wm("NinomaruPalace.jpg"),
      lon: 135.75, lat: 35.01,
      tags: ["国宝", "世界遺産"],
    },
  ],
  osaka: [
    {
      name: "大阪城",
      nameEn: "Osaka Castle",
      description: "豊臣秀吉が築いた天下の名城。天守閣から大阪の絶景が望める。",
      imageUrl: wm("Osaka_Castle_02bs3200.jpg"),
      lon: 135.53, lat: 34.69,
      tags: ["特別史跡"],
    },
  ],
  hyogo: [
    {
      name: "姫路城",
      nameEn: "Himeji Castle",
      description: "白鷺城の愛称をもつ日本最美の城。現存天守の最高傑作で世界遺産・国宝。",
      imageUrl: wm("Himeji_castle_in_may_2015.jpg"),
      lon: 134.69, lat: 34.84,
      tags: ["国宝", "世界遺産", "現存天守"],
    },
  ],
  nara: [
    {
      name: "大和郡山城",
      nameEn: "Yamato-Koriyama Castle",
      description: "豊臣秀長が整備した大城郭。逆さ地蔵で知られる石垣が有名。",
      imageUrl: wm("Koriyama_Castle_(Yamato),_Otte-mon_and_Otte-Mukai-yagura.jpg"),
      lon: 135.79, lat: 34.65,
      tags: ["史跡"],
    },
  ],
  wakayama: [
    {
      name: "和歌山城",
      nameEn: "Wakayama Castle",
      description: "紀州徳川家55万石の居城。虎伏山に聳え、御橋廊下が優雅。",
      imageUrl: wm("Wakayama_Castle01-R.jpg"),
      lon: 135.17, lat: 34.23,
      tags: ["重要文化財"],
    },
  ],
  tottori: [
    {
      name: "鳥取城（久松城）",
      nameEn: "Tottori Castle",
      description: "羽柴秀吉の鳥取城の戦いで有名。山麓の近世城郭と山上の山城が共存する名城。",
      imageUrl: wm("Tottori_castle04_2816.jpg"),
      lon: 134.24, lat: 35.50,
      tags: ["史跡"],
    },
  ],
  shimane: [
    {
      name: "松江城",
      nameEn: "Matsue Castle",
      description: "現存天守で唯一の国宝に指定（2015年）。宍道湖のほとりに聳える水の都の名城。",
      imageUrl: wm("080720_Matsue_Castle_Matsue_Shimane_pref_Japan01s.jpg"),
      lon: 133.06, lat: 35.47,
      tags: ["国宝", "現存天守"],
    },
  ],
  okayama: [
    {
      name: "岡山城（烏城）",
      nameEn: "Okayama Castle",
      description: "黒い外壁から「烏城」と呼ばれる。隣接する後楽園との対比が美しい。",
      imageUrl: wm("Okayama_Castle_01.jpg"),
      lon: 133.93, lat: 34.66,
      tags: ["史跡", "重要文化財"],
    },
  ],
  hiroshima: [
    {
      name: "広島城（鯉城）",
      nameEn: "Hiroshima Castle",
      description: "太田川デルタに築かれた平城。原爆で倒壊後に復元された「鯉城」。",
      imageUrl: wm("HiroshimaCastle.jpg"),
      lon: 132.46, lat: 34.40,
      tags: ["史跡"],
    },
  ],
  yamaguchi: [
    {
      name: "萩城（指月城）",
      nameEn: "Hagi Castle",
      description: "毛利家の居城。城下町はほぼ江戸時代の姿を残す幕末の聖地。",
      imageUrl: wm("Hagi_Castle_002.jpg"),
      lon: 131.40, lat: 34.41,
      tags: ["史跡"],
    },
  ],
  kagawa: [
    {
      name: "丸亀城",
      nameEn: "Marugame Castle",
      description: "現存天守の中で最も小さいが石垣は日本一の高さを誇る。",
      imageUrl: wm("Marugame_Castle01.jpg"),
      lon: 133.80, lat: 34.29,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  ehime: [
    {
      name: "松山城",
      nameEn: "Matsuyama Castle",
      description: "三重三階の天守が現存する四国最大の城郭。ロープウェイで登れる山城。",
      imageUrl: wm("Iyo_Matsuyama_castle.jpg"),
      lon: 132.76, lat: 33.84,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  kochi: [
    {
      name: "高知城",
      nameEn: "Kochi Castle",
      description: "本丸の建物が完全に残る唯一の城。山内一豊が築いた土佐の名城。",
      imageUrl: wm("Kochi_Castle_04.JPG"),
      lon: 133.53, lat: 33.56,
      tags: ["国宝", "現存天守"],
    },
  ],
  fukuoka: [
    {
      name: "小倉城",
      nameEn: "Kokura Castle",
      description: "細川忠興が築いた名城。唐造りの天守が独特。城下は現在の北九州市。",
      imageUrl: wm("Kokura_Castle.jpg"),
      lon: 130.88, lat: 33.88,
      tags: ["史跡"],
    },
  ],
  saga: [
    {
      name: "佐賀城",
      nameEn: "Saga Castle",
      description: "鍋島氏の居城。幕末に日本初の反射炉を建設した志士の城下町の中心地。",
      imageUrl: wm("Saga_castle_shachinomon_gate.jpg"),
      lon: 130.30, lat: 33.25,
      tags: ["史跡"],
    },
  ],
  nagasaki: [
    {
      name: "島原城",
      nameEn: "Shimabara Castle",
      description: "雲仙普賢岳を望む五層天守。島原の乱の舞台となった歴史の城。",
      imageUrl: wm("Shimabara_Castle.jpg"),
      lon: 130.37, lat: 32.78,
      tags: ["史跡"],
    },
  ],
  kumamoto: [
    {
      name: "熊本城",
      nameEn: "Kumamoto Castle",
      description: "加藤清正の傑作城郭。2016年地震で被災後、壮大な復旧工事が進行中。",
      imageUrl: wm("Kumamoto_Castle_Keep_Tower_20221022-3.jpg"),
      lon: 130.71, lat: 32.80,
      tags: ["国宝", "特別史跡", "現存天守"],
    },
  ],
  oita: [
    {
      name: "岡城（竹田城）",
      nameEn: "Oka Castle",
      description: "断崖絶壁の上に築かれた難攻不落の山城。「荒城の月」のモデルとなった名城。",
      imageUrl: wm("Okajoshi.jpg"),
      lon: 131.44, lat: 32.97,
      tags: ["史跡"],
    },
  ],
  miyazaki: [
    {
      name: "飫肥城",
      nameEn: "Obi Castle",
      description: "伊東氏の居城。「九州の小京都」と称される美しい城下町が今も残る。",
      imageUrl: wm("Obi_Castle_Otemon.jpg"),
      lon: 131.37, lat: 31.65,
      tags: ["史跡"],
    },
  ],
  kagoshima: [
    {
      name: "鹿児島城（鶴丸城）",
      nameEn: "Kagoshima Castle",
      description: "薩摩藩主・島津氏の居城。天守を持たない平城で、御楼門が2020年に復元された。",
      imageUrl: wm("Kagoshimajo.jpg"),
      lon: 130.55, lat: 31.59,
      tags: ["史跡"],
    },
  ],
  okinawa: [
    {
      name: "首里城",
      nameEn: "Shuri Castle",
      description: "琉球王国の王城。2019年火災後に復元工事中。中国と日本の建築が融合した世界遺産。",
      imageUrl: wm("Naha_Okinawa_Japan_Shuri-Castle-01.jpg"),
      lon: 127.72, lat: 26.22,
      tags: ["世界遺産", "国宝"],
    },
  ],
};
