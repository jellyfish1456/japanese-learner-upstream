import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";
import { subRegionData } from "../data/japanSubRegions";
import { tsmcLocations, TYPE_LABEL } from "../data/tsmcLocations";
import { prefecturePolygons } from "../data/japanPrefecturePaths";

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

// ── Wikipedia SVG coordinate transform (570×755) ────────────────────────────
const SVG_W = 570;
const SVG_H = 755;
function imgX(lon: number): number { return (lon - 129.0) * 28.7 + 47; }
function imgY(lat: number): number { return (45.5 - lat) * 50.8 + 8; }

// ── Hiragana readings for hover tooltip furigana ─────────────────────────────
const PREF_READING: Record<string, string> = {
  hokkaido: "ほっかいどう",
  aomori:   "あおもり",
  iwate:    "いわて",
  miyagi:   "みやぎ",
  akita:    "あきた",
  yamagata: "やまがた",
  fukushima:"ふくしま",
  ibaraki:  "いばらき",
  tochigi:  "とちぎ",
  gunma:    "ぐんま",
  saitama:  "さいたま",
  chiba:    "ちば",
  tokyo:    "とうきょう",
  kanagawa: "かながわ",
  niigata:  "にいがた",
  toyama:   "とやま",
  ishikawa: "いしかわ",
  fukui:    "ふくい",
  yamanashi:"やまなし",
  nagano:   "ながの",
  gifu:     "ぎふ",
  shizuoka: "しずおか",
  aichi:    "あいち",
  mie:      "みえ",
  shiga:    "しが",
  kyoto:    "きょうと",
  osaka:    "おおさか",
  hyogo:    "ひょうご",
  nara:     "なら",
  wakayama: "わかやま",
  tottori:  "とっとり",
  shimane:  "しまね",
  okayama:  "おかやま",
  hiroshima:"ひろしま",
  yamaguchi:"やまぐち",
  tokushima:"とくしま",
  kagawa:   "かがわ",
  ehime:    "えひめ",
  kochi:    "こうち",
  fukuoka:  "ふくおか",
  saga:     "さが",
  nagasaki: "ながさき",
  kumamoto: "くまもと",
  oita:     "おおいた",
  miyazaki: "みやざき",
  kagoshima:"かごしま",
  okinawa:  "おきなわ",
};

// ── Convert polygon [lon, lat] pairs → SVG points string ────────────────────
function toSvgPoints(poly: [number, number][]): string {
  return poly.map(([lon, lat]) => `${imgX(lon).toFixed(1)},${imgY(lat).toFixed(1)}`).join(" ");
}

// ── Prefecture centroids from capital-city coordinates ──────────────────────
const CENTROIDS: Record<string, [number, number]> = (() => {
  const map: Record<string, [number, number]> = {};
  for (const p of prefectures) {
    if (p.id === "okinawa") {
      map["okinawa"] = [118, 638];
      continue;
    }
    const cap = subRegionData[p.id]?.cities.find((c) => c.capital);
    if (cap) map[p.id] = [imgX(cap.lon), imgY(cap.lat)];
  }
  return map;
})();

function nearestPref(svgX: number, svgY: number): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [id, [cx, cy]] of Object.entries(CENTROIDS)) {
    const d = (svgX - cx) ** 2 + (svgY - cy) ** 2;
    if (d < bestDist) { bestDist = d; best = id; }
  }
  return best;
}

export default function JapanMapPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTSMC, setShowTSMC] = useState(true);

  const toSVG = useCallback(
    (clientX: number, clientY: number, el: Element): [number, number] => {
      const r = el.getBoundingClientRect();
      return [(clientX - r.left) * (SVG_W / r.width), (clientY - r.top) * (SVG_H / r.height)];
    }, []
  );

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const [sx, sy] = toSVG(e.clientX, e.clientY, e.currentTarget);
      setHovered(nearestPref(sx, sy));
    }, [toSVG]
  );

  const onClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const [sx, sy] = toSVG(e.clientX, e.clientY, e.currentTarget);
      const id = nearestPref(sx, sy);
      if (id) navigate(`/japan-travel/${id}`);
    }, [navigate, toSVG]
  );

  const onTouch = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      const t = e.changedTouches[0];
      const [sx, sy] = toSVG(t.clientX, t.clientY, e.currentTarget);
      const id = nearestPref(sx, sy);
      if (id) navigate(`/japan-travel/${id}`);
    }, [navigate, toSVG]
  );

  const hovPref = hovered ? prefectures.find((p) => p.id === hovered) ?? null : null;
  const hovColor = hovPref ? (REGION_HEX[hovPref.region] ?? null) : null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">
        🗾 日本旅遊地図
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        都道府県をタップ → 観光スポット・グルメ・大学・城をチェック
      </p>

      {/* TSMC toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setShowTSMC((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            showTSMC
              ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
              : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
          }`}
        >
          <span>📍</span> TSMC拠点を{showTSMC ? "非表示" : "表示"}
        </button>
      </div>

      {/* Map — Wikipedia SVG background + interactive SVG overlay */}
      <div
        className="relative w-full overflow-hidden rounded-xl shadow mb-3 -mx-4"
        style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}
      >
        <img
          src="/japanese-learner-upstream/japan-map.svg"
          alt="日本地図"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "fill" }}
          draggable={false}
        />

        {/* Interactive SVG overlay */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: "pointer", touchAction: "manipulation" }}
          onMouseMove={onMove}
          onMouseLeave={() => setHovered(null)}
          onClick={onClick}
          onTouchEnd={onTouch}
        >
          {/* ── Prefecture polygon highlights ── */}
          {prefectures.map((p) => {
            const poly = prefecturePolygons[p.id];
            if (!poly) return null;
            const isHov = p.id === hovered;
            const color = REGION_HEX[p.region];
            if (!isHov) return null; // only render the hovered one
            return (
              <polygon
                key={p.id}
                points={toSvgPoints(poly)}
                fill={color ? color.hover : "#6366f1"}
                fillOpacity={0.40}
                stroke={color ? color.hover : "#6366f1"}
                strokeWidth={2}
                strokeOpacity={0.8}
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* ── Hover tooltip — kanji + furigana ── */}
          {hovered && hovColor && CENTROIDS[hovered] && (() => {
            const [cx, cy] = CENTROIDS[hovered];
            const kanji   = hovPref?.nameShort ?? "";
            const reading = PREF_READING[hovered] ?? "";
            const pillW   = Math.max(kanji.length * 14 + 20, reading.length * 8 + 20);
            // Position pill above centroid; flip if too close to top
            const pillY = cy - 48;
            const finalY = pillY < 10 ? cy + 10 : pillY;
            return (
              <g style={{ pointerEvents: "none" }}>
                {/* Centre dot */}
                <circle cx={cx} cy={cy} r={7} fill={hovColor.hover} fillOpacity={0.95}
                  stroke="white" strokeWidth={2} />
                {/* Pill background */}
                <rect
                  x={cx - pillW / 2} y={finalY}
                  width={pillW} height={36}
                  rx={10} fill={hovColor.hover} fillOpacity={0.95}
                />
                {/* Furigana — small hiragana above */}
                <text
                  x={cx} y={finalY + 11}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={9} fill="rgba(255,255,255,0.88)"
                  style={{ userSelect: "none" }}
                >
                  {reading}
                </text>
                {/* Kanji — bold below */}
                <text
                  x={cx} y={finalY + 26}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={14} fill="white" fontWeight="bold"
                  style={{ userSelect: "none" }}
                >
                  {kanji}
                </text>
              </g>
            );
          })()}

          {/* ── TSMC 📍 markers ── */}
          {showTSMC && tsmcLocations.map((loc) => {
            const x = imgX(loc.lon);
            const y = imgY(loc.lat);
            if (x < 0 || x > SVG_W || y < 0 || y > SVG_H) return null;
            return (
              <text
                key={loc.id}
                x={x} y={y}
                textAnchor="middle" dominantBaseline="auto"
                fontSize={18}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                📍
              </text>
            );
          })}
        </svg>
      </div>

      {/* Region color legend */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {REGION_ORDER.map((region) => {
          const color = REGION_HEX[region];
          if (!color) return null;
          return (
            <div key={region} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.base }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{region}</span>
            </div>
          );
        })}
      </div>

      {/* TSMC legend */}
      {showTSMC && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-5">
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">📍 TSMC Japan 拠点</p>
          <div className="space-y-1.5">
            {tsmcLocations.map((loc) => (
              <div key={loc.id} className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">📍</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{loc.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{TYPE_LABEL[loc.type]} · {loc.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prefecture list by region */}
      {REGION_ORDER.map((region) => {
        const list = prefectures.filter((p) => p.region === region);
        if (!list.length) return null;
        const color = REGION_HEX[region];
        return (
          <div key={region} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-4 rounded-sm" style={{ backgroundColor: color?.base }} />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{region}地方</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((p) => (
                <button key={p.id} onClick={() => navigate(`/japan-travel/${p.id}`)}
                  className="text-left px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors tap-active">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">{p.nameShort}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p.nameEn}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
