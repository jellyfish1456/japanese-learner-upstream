export interface CastleData {
  name: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  lon: number;
  lat: number;
  tags: string[]; // 国宝, 世界遺産, 現存天守 etc.
}

// imageUrl: Wikipedia Commons URLs (fallback to 🏯 emoji on error)
export const castlesByPrefecture: Record<string, CastleData[]> = {
  hokkaido: [
    {
      name: "五稜郭",
      nameEn: "Goryokaku Fort",
      description: "日本初の洋式城郭。星形の要塞が美しい幕末の歴史スポット。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Goryokaku_from_the_air_2006.jpg/480px-Goryokaku_from_the_air_2006.jpg",
      lon: 140.73, lat: 41.80,
      tags: ["特別史跡"],
    },
  ],
  aomori: [
    {
      name: "弘前城",
      nameEn: "Hirosaki Castle",
      description: "東北で唯一、江戸時代建築の天守が現存する城。春の桜が絶景。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Hirosaki_castle.jpg/480px-Hirosaki_castle.jpg",
      lon: 140.47, lat: 40.61,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  miyagi: [
    {
      name: "仙台城（青葉城）",
      nameEn: "Sendai Castle",
      description: "伊達政宗が築いた山城。独眼竜の騎馬像と仙台市街の眺望が有名。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Aobajo_ruins.jpg/480px-Aobajo_ruins.jpg",
      lon: 140.84, lat: 38.25,
      tags: ["史跡"],
    },
  ],
  fukushima: [
    {
      name: "鶴ヶ城（会津若松城）",
      nameEn: "Tsurugajo Castle",
      description: "幕末に白虎隊が命を懸けて守った名城。赤瓦が特徴的。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Aizuwakamatsu_castle01.jpg/480px-Aizuwakamatsu_castle01.jpg",
      lon: 139.93, lat: 37.49,
      tags: ["史跡"],
    },
  ],
  saitama: [
    {
      name: "川越城（本丸御殿）",
      nameEn: "Kawagoe Castle",
      description: "小江戸川越の象徴。江戸時代の本丸御殿が現存する貴重な城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Kawagoe_castle_Honmaru_palace.jpg/480px-Kawagoe_castle_Honmaru_palace.jpg",
      lon: 139.49, lat: 35.93,
      tags: ["重要文化財"],
    },
  ],
  tokyo: [
    {
      name: "江戸城（皇居）",
      nameEn: "Edo Castle (Imperial Palace)",
      description: "徳川将軍の居城、現在は皇居。内堀と石垣が幕府の威容を伝える。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Edo_castle_Fushimi-yagura_and_Sakurada-mon.jpg/480px-Edo_castle_Fushimi-yagura_and_Sakurada-mon.jpg",
      lon: 139.75, lat: 35.69,
      tags: ["特別史跡"],
    },
  ],
  kanagawa: [
    {
      name: "小田原城",
      nameEn: "Odawara Castle",
      description: "北条氏の堅城として戦国最強の守りを誇った名城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Odawara_Castle_Kanagawa_pref01s3s4592.jpg/480px-Odawara_Castle_Kanagawa_pref01s3s4592.jpg",
      lon: 139.16, lat: 35.25,
      tags: ["史跡"],
    },
  ],
  niigata: [
    {
      name: "新発田城",
      nameEn: "Shibata Castle",
      description: "三匹の鯱をもつ独特の三階櫓が現存。辰巳櫓は国の重要文化財。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Shibata_castle01.jpg/480px-Shibata_castle01.jpg",
      lon: 139.33, lat: 37.94,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  ishikawa: [
    {
      name: "金沢城",
      nameEn: "Kanazawa Castle",
      description: "加賀百万石・前田家の居城。白漆喰の石川門が美しい。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Kanazawa_Castle%2C_Ishikawa_Pref.jpg/480px-Kanazawa_Castle%2C_Ishikawa_Pref.jpg",
      lon: 136.66, lat: 36.57,
      tags: ["史跡", "重要文化財"],
    },
  ],
  fukui: [
    {
      name: "丸岡城",
      nameEn: "Maruoka Castle",
      description: "現存十二天守の一つ。日本最古の天守とも言われる歴史的建造物。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Maruoka_Castle_Fukui_pref.JPG/480px-Maruoka_Castle_Fukui_pref.JPG",
      lon: 136.27, lat: 36.15,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  nagano: [
    {
      name: "松本城",
      nameEn: "Matsumoto Castle",
      description: "現存する五重六階天守の中で日本最古。黒塗り壁から「烏城」とも呼ばれる。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Matsumoto_Castle_201609.jpg/480px-Matsumoto_Castle_201609.jpg",
      lon: 137.97, lat: 36.24,
      tags: ["国宝", "現存天守"],
    },
    {
      name: "上田城",
      nameEn: "Ueda Castle",
      description: "真田氏の本拠地。徳川軍を二度退けた不落の名城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/UedaCastle04.jpg/480px-UedaCastle04.jpg",
      lon: 138.25, lat: 36.40,
      tags: ["史跡"],
    },
  ],
  shizuoka: [
    {
      name: "駿府城",
      nameEn: "Sunpu Castle",
      description: "徳川家康が晩年を過ごした城。巽櫓・東御門が復元されている。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Sunpucastle_Tatsumiyagura.jpg/480px-Sunpucastle_Tatsumiyagura.jpg",
      lon: 138.39, lat: 34.98,
      tags: ["史跡"],
    },
  ],
  aichi: [
    {
      name: "名古屋城",
      nameEn: "Nagoya Castle",
      description: "金の鯱で有名な尾張徳川家の居城。本丸御殿は精緻な障壁画が圧巻。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Nagoya_Castle.jpg/480px-Nagoya_Castle.jpg",
      lon: 136.90, lat: 35.19,
      tags: ["特別史跡", "重要文化財"],
    },
    {
      name: "犬山城",
      nameEn: "Inuyama Castle",
      description: "木曽川岸に聳える国宝天守。現存天守の中で最古の建築形式。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Inuyama_Castle01s2048.jpg/480px-Inuyama_Castle01s2048.jpg",
      lon: 136.94, lat: 35.39,
      tags: ["国宝", "現存天守"],
    },
  ],
  gifu: [
    {
      name: "岐阜城",
      nameEn: "Gifu Castle",
      description: "金華山山頂に聳え立ち、信長が「天下布武」の拠点とした山城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Gifucastle_higashi.jpg/480px-Gifucastle_higashi.jpg",
      lon: 136.77, lat: 35.44,
      tags: ["史跡"],
    },
  ],
  shiga: [
    {
      name: "彦根城",
      nameEn: "Hikone Castle",
      description: "国宝四城の一つ。400年の歴史を誇る現存天守と美しい庭園・玄宮園。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Hikone_Castle_11.jpg/480px-Hikone_Castle_11.jpg",
      lon: 136.25, lat: 35.27,
      tags: ["国宝", "現存天守"],
    },
  ],
  kyoto: [
    {
      name: "二条城",
      nameEn: "Nijo Castle",
      description: "徳川将軍家の京都の宿城。大政奉還が宣言された歴史的場所。世界遺産。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Nijo_Castle_Ninomaru.jpg/480px-Nijo_Castle_Ninomaru.jpg",
      lon: 135.75, lat: 35.01,
      tags: ["国宝", "世界遺産"],
    },
  ],
  osaka: [
    {
      name: "大阪城",
      nameEn: "Osaka Castle",
      description: "豊臣秀吉が築いた天下の名城。天守閣から大阪の絶景が望める。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Osaka_Castle_02bs3200.jpg/480px-Osaka_Castle_02bs3200.jpg",
      lon: 135.53, lat: 34.69,
      tags: ["特別史跡"],
    },
  ],
  hyogo: [
    {
      name: "姫路城",
      nameEn: "Himeji Castle",
      description: "白鷺城の愛称をもつ日本最美の城。現存天守の最高傑作で世界遺産・国宝。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Himeji_Castle_The_Keep_Towers.jpg/480px-Himeji_Castle_The_Keep_Towers.jpg",
      lon: 134.69, lat: 34.84,
      tags: ["国宝", "世界遺産", "現存天守"],
    },
  ],
  nara: [
    {
      name: "大和郡山城",
      nameEn: "Yamato-Koriyama Castle",
      description: "豊臣秀長が整備した大城郭。逆さ地蔵で知られる石垣が有名。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Yamato_Koriyama_Castle.jpg/480px-Yamato_Koriyama_Castle.jpg",
      lon: 135.79, lat: 34.65,
      tags: ["史跡"],
    },
  ],
  wakayama: [
    {
      name: "和歌山城",
      nameEn: "Wakayama Castle",
      description: "紀州徳川家55万石の居城。虎伏山に聳え、御橋廊下が優雅。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Wakayama_Castle%2C_Wakayama.jpg/480px-Wakayama_Castle%2C_Wakayama.jpg",
      lon: 135.17, lat: 34.23,
      tags: ["重要文化財"],
    },
  ],
  shimane: [
    {
      name: "松江城",
      nameEn: "Matsue Castle",
      description: "現存天守で唯一の国宝に指定（2015年）。宍道湖のほとりに聳える水の都の名城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/MatsujoCastle.jpg/480px-MatsujoCastle.jpg",
      lon: 133.06, lat: 35.47,
      tags: ["国宝", "現存天守"],
    },
  ],
  okayama: [
    {
      name: "岡山城（烏城）",
      nameEn: "Okayama Castle",
      description: "黒い外壁から「烏城」と呼ばれる。隣接する後楽園との対比が美しい。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Okayama_Castle.jpg/480px-Okayama_Castle.jpg",
      lon: 133.93, lat: 34.66,
      tags: ["史跡", "重要文化財"],
    },
  ],
  hiroshima: [
    {
      name: "広島城（鯉城）",
      nameEn: "Hiroshima Castle",
      description: "太田川デルタに築かれた平城。原爆で倒壊後に復元された「鯉城」。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Hiroshima_castle.jpg/480px-Hiroshima_castle.jpg",
      lon: 132.46, lat: 34.40,
      tags: ["史跡"],
    },
  ],
  yamaguchi: [
    {
      name: "萩城（指月城）",
      nameEn: "Hagi Castle",
      description: "毛利家の居城。城下町はほぼ江戸時代の姿を残す幕末の聖地。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/HagiCastle.jpg/480px-HagiCastle.jpg",
      lon: 131.40, lat: 34.41,
      tags: ["史跡"],
    },
  ],
  kagawa: [
    {
      name: "丸亀城",
      nameEn: "Marugame Castle",
      description: "現存天守の中で最も小さいが石垣は日本一の高さを誇る。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Marugame-castle01.jpg/480px-Marugame-castle01.jpg",
      lon: 133.80, lat: 34.29,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  ehime: [
    {
      name: "松山城",
      nameEn: "Matsuyama Castle",
      description: "三重三階の天守が現存する四国最大の城郭。ロープウェイで登れる山城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/MatsuyamaCastle_2010.jpg/480px-MatsuyamaCastle_2010.jpg",
      lon: 132.76, lat: 33.84,
      tags: ["現存天守", "重要文化財"],
    },
  ],
  kochi: [
    {
      name: "高知城",
      nameEn: "Kochi Castle",
      description: "本丸の建物が完全に残る唯一の城。山内一豊が築いた土佐の名城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/KochiCastle_in_winter.jpg/480px-KochiCastle_in_winter.jpg",
      lon: 133.53, lat: 33.56,
      tags: ["国宝", "現存天守"],
    },
  ],
  fukuoka: [
    {
      name: "小倉城",
      nameEn: "Kokura Castle",
      description: "細川忠興が築いた名城。唐造りの天守が独特。城下は現在の北九州市。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Kokura_Castle.jpg/480px-Kokura_Castle.jpg",
      lon: 130.88, lat: 33.88,
      tags: ["史跡"],
    },
  ],
  nagasaki: [
    {
      name: "島原城",
      nameEn: "Shimabara Castle",
      description: "雲仙普賢岳を望む五層天守。島原の乱の舞台となった歴史の城。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Shimabara_Castle_2007.jpg/480px-Shimabara_Castle_2007.jpg",
      lon: 130.37, lat: 32.78,
      tags: ["史跡"],
    },
  ],
  kumamoto: [
    {
      name: "熊本城",
      nameEn: "Kumamoto Castle",
      description: "加藤清正の傑作城郭。2016年地震で被災後、壮大な復旧工事が進行中。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/KumamotoCastle01.jpg/480px-KumamotoCastle01.jpg",
      lon: 130.71, lat: 32.80,
      tags: ["国宝", "特別史跡", "現存天守"],
    },
  ],
  okinawa: [
    {
      name: "首里城",
      nameEn: "Shuri Castle",
      description: "琉球王国の王城。2019年火災後に復元工事中。中国と日本の建築が融合した世界遺産。",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Shuri-jo_from_air_2002.jpg/480px-Shuri-jo_from_air_2002.jpg",
      lon: 127.72, lat: 26.22,
      tags: ["世界遺産", "国宝"],
    },
  ],
};
