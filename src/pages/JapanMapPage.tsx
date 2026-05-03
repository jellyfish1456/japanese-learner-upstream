import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";
import { subRegionData } from "../data/japanSubRegions";
import { tsmcLocations, TYPE_LABEL } from "../data/tsmcLocations";
import { prefecturePaths } from "../data/prefectureSvgPaths";

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

// ── Coordinate transform (same projection used to generate prefectureSvgPaths)
const SVG_W = 570;
const SVG_H = 755;
function imgX(lon: number): number { return (lon - 129.0) * 28.7 + 47; }
function imgY(lat: number): number { return (45.5 - lat) * 50.8 + 8; }

// ── Okinawa inset transform ────────────────────────────────────────────────
// Okinawa's GeoJSON paths sit at ~(x:-127..114, y:903..1098) — way outside the viewBox.
// Scale 0.55× and translate into lower-right corner.
const OKI_SCALE = 0.55;
const OKI_TX = 493.5;
const OKI_TY = 124.5;
const OKI_TRANSFORM = `translate(${OKI_TX}, ${OKI_TY}) scale(${OKI_SCALE})`;
// Inset frame (approximate transformed bbox)
const OKI_FRAME = { x: 418, y: 615, w: 145, h: 120 };

// ── Hiragana readings ───────────────────────────────────────────────────────
const PREF_READING: Record<string, string> = {
  hokkaido: "ほっかいどう", aomori: "あおもり", iwate: "いわて",
  miyagi: "みやぎ", akita: "あきた", yamagata: "やまがた",
  fukushima: "ふくしま", ibaraki: "いばらき", tochigi: "とちぎ",
  gunma: "ぐんま", saitama: "さいたま", chiba: "ちば",
  tokyo: "とうきょう", kanagawa: "かながわ", niigata: "にいがた",
  toyama: "とやま", ishikawa: "いしかわ", fukui: "ふくい",
  yamanashi: "やまなし", nagano: "ながの", gifu: "ぎふ",
  shizuoka: "しずおか", aichi: "あいち", mie: "みえ",
  shiga: "しが", kyoto: "きょうと", osaka: "おおさか",
  hyogo: "ひょうご", nara: "なら", wakayama: "わかやま",
  tottori: "とっとり", shimane: "しまね", okayama: "おかやま",
  hiroshima: "ひろしま", yamaguchi: "やまぐち", tokushima: "とくしま",
  kagawa: "かがわ", ehime: "えひめ", kochi: "こうち",
  fukuoka: "ふくおか", saga: "さが", nagasaki: "ながさき",
  kumamoto: "くまもと", oita: "おおいた", miyazaki: "みやざき",
  kagoshima: "かごしま", okinawa: "おきなわ",
};

// ── Label position offsets [dx, dy] to reduce overlap ──────────────────────
const LABEL_OFFSET: Record<string, [number, number]> = {
  tokyo: [18, 8], saitama: [-2, -6], kanagawa: [18, 14],
  chiba: [22, 0], yamanashi: [-12, 5],
  osaka: [8, 12], nara: [12, 6], shiga: [-4, -8],
  kyoto: [-18, -4], wakayama: [2, 14],
  toyama: [0, -5], fukui: [-8, 5], gifu: [-2, -3],
  kagawa: [0, -6], tokushima: [10, 2],
  saga: [-10, 0], nagasaki: [-16, 6], oita: [10, -2],
};

// ── Prefecture centroids ───────────────────────────────────────────────────
const CENTROIDS: Record<string, [number, number]> = (() => {
  const map: Record<string, [number, number]> = {};
  for (const p of prefectures) {
    if (p.id === "okinawa") {
      // Pre-computed: imgX(127.68)*0.55+493.5, imgY(26.34)*0.55+124.5
      map["okinawa"] = [498, 664];
      continue;
    }
    const cap = subRegionData[p.id]?.cities.find((c) => c.capital);
    if (cap) map[p.id] = [imgX(cap.lon), imgY(cap.lat)];
  }
  return map;
})();

// ── Render a single prefecture path ────────────────────────────────────────
function PrefPath({
  p,
  isHov,
  onHover,
  onNav,
}: {
  p: (typeof prefectures)[number];
  isHov: boolean;
  onHover: () => void;
  onNav: () => void;
}) {
  const d = prefecturePaths[p.id];
  if (!d) return null;
  const color = REGION_HEX[p.region];
  return (
    <path
      d={d}
      fill={isHov && color ? color.hover : (color ? color.base : "#ccc")}
      stroke="white"
      strokeWidth={isHov ? 2.5 : 0.8}
      strokeLinejoin="round"
      style={{ cursor: "pointer", transition: "fill 0.15s" }}
      onMouseEnter={onHover}
      onClick={onNav}
      onTouchEnd={(e) => { e.preventDefault(); onNav(); }}
    />
  );
}

export default function JapanMapPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTSMC, setShowTSMC] = useState(true);

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

      {/* ═══ Map — 100% GeoJSON rendered ═══ */}
      <div
        className="relative w-full overflow-hidden rounded-xl shadow mb-3 -mx-4"
        style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-full"
          style={{ cursor: "pointer", touchAction: "manipulation", backgroundColor: "#e8f4f8" }}
          onMouseLeave={() => setHovered(null)}
        >
          {/* ── Main-island prefectures (all except Okinawa) ── */}
          {prefectures.filter((p) => p.id !== "okinawa").map((p) => (
            <PrefPath
              key={p.id} p={p}
              isHov={p.id === hovered}
              onHover={() => setHovered(p.id)}
              onNav={() => navigate(`/japan-travel/${p.id}`)}
            />
          ))}

          {/* ── Okinawa inset ── */}
          <g>
            {/* Inset frame */}
            <rect
              x={OKI_FRAME.x} y={OKI_FRAME.y}
              width={OKI_FRAME.w} height={OKI_FRAME.h}
              rx={6} fill="none"
              stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,3"
            />
            {/* Okinawa path — transformed into inset area */}
            <g transform={OKI_TRANSFORM}>
              {(() => {
                const p = prefectures.find((pf) => pf.id === "okinawa");
                if (!p) return null;
                return (
                  <PrefPath
                    p={p}
                    isHov={hovered === "okinawa"}
                    onHover={() => setHovered("okinawa")}
                    onNav={() => navigate("/japan-travel/okinawa")}
                  />
                );
              })()}
            </g>
          </g>

          {/* ── Japanese kanji labels (all 47) ── */}
          {prefectures.map((p) => {
            const c = CENTROIDS[p.id];
            if (!c) return null;
            const [ox, oy] = LABEL_OFFSET[p.id] ?? [0, 0];
            const lx = c[0] + ox;
            const ly = c[1] + oy;
            const isHov = p.id === hovered;
            return (
              <text
                key={`lbl-${p.id}`}
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize={isHov ? 12 : 9}
                fontWeight={isHov ? "bold" : "600"}
                fill={isHov ? "#0f172a" : "#1e293b"}
                stroke="white" strokeWidth={isHov ? 3.5 : 2.5}
                paintOrder="stroke"
                style={{ pointerEvents: "none", userSelect: "none", transition: "font-size 0.15s" }}
              >
                {p.nameShort}
              </text>
            );
          })}

          {/* ── Hover furigana pill ── */}
          {hovered && hovColor && CENTROIDS[hovered] && (() => {
            const c = CENTROIDS[hovered];
            const [ox, oy] = LABEL_OFFSET[hovered] ?? [0, 0];
            const lx = c[0] + ox;
            const ly = c[1] + oy;
            const reading = PREF_READING[hovered] ?? "";
            const pillW = reading.length * 8.5 + 14;
            const pillY = ly - 22;
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect
                  x={lx - pillW / 2} y={pillY - 7}
                  width={pillW} height={14}
                  rx={7} fill={hovColor.hover} fillOpacity={0.92}
                />
                <text
                  x={lx} y={pillY}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={8} fill="white"
                  style={{ userSelect: "none" }}
                >
                  {reading}
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
