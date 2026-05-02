import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";
import { prefecturePolygons } from "../data/japanPrefecturePaths";
import { tsmcLocations, TYPE_COLOR, TYPE_LABEL } from "../data/tsmcLocations";

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

// ── Coordinate transform calibrated to public/japan-map.svg (570×755) ─────────
// Verified: Cape Soya (141.9°E, 45.5°N) → screen (418.5, 8.5)
const SVG_W = 570;
const SVG_H = 755;
function imgX(lon: number): number { return (lon - 129.0) * 28.7 + 47; }
function imgY(lat: number): number { return (45.5 - lat) * 50.8 + 8; }

// ── Polygon → SVG path in Wikipedia-SVG coordinate space ─────────────────────
function polyToPath(pts: [number, number][]): string {
  return pts
    .map(([lon, lat], i) => `${i === 0 ? "M" : "L"}${imgX(lon).toFixed(1)},${imgY(lat).toFixed(1)}`)
    .join(" ") + " Z";
}

// ── Centroid in SVG coordinate space ─────────────────────────────────────────
function centroid(id: string): [number, number] {
  const pts = prefecturePolygons[id];
  if (!pts || pts.length === 0) return [0, 0];
  const x = pts.reduce((s, [lon]) => s + imgX(lon), 0) / pts.length;
  const y = pts.reduce((s, [, lat]) => s + imgY(lat), 0) / pts.length;
  return [x, y];
}

// ── Okinawa inset click area (lower-left of Wikipedia SVG, ~x28-213, y570-725) ─
const OKI_RECT = { x: 28, y: 572, w: 185, h: 150 };

export default function JapanMapPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTSMC, setShowTSMC] = useState(true);

  const mainPrefectures = prefectures.filter((p) => p.id !== "okinawa");

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
      <div className="relative w-full overflow-hidden rounded-xl shadow mb-3 -mx-4" style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}>
        {/* Background: Wikipedia high-quality Japan map */}
        <img
          src="/japanese-learner-upstream/japan-map.svg"
          alt="日本地図"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "fill" }}
          draggable={false}
        />

        {/* Interactive overlay */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: "manipulation" }}
        >
          {/* Main 46 prefectures */}
          {mainPrefectures.map((p) => {
            const pts = prefecturePolygons[p.id];
            if (!pts) return null;
            const d = polyToPath(pts);
            const colors = REGION_HEX[p.region] ?? { base: "#94a3b8", hover: "#64748b" };
            const isH = hovered === p.id;
            const [cx, cy] = centroid(p.id);
            const short = p.nameShort.replace(/[都道府県]$/, "");
            const fs = short.length <= 2 ? 12 : 9.5;

            return (
              <g
                key={p.id}
                onClick={() => navigate(`/japan-travel/${p.id}`)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(p.id)}
                onTouchEnd={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Hit area + hover fill */}
                <path
                  d={d}
                  fill={colors.base}
                  fillOpacity={isH ? 0.45 : 0}
                  stroke={isH ? colors.hover : "transparent"}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                {/* Prefecture kanji label */}
                <text
                  x={cx}
                  y={cy + (short.length > 2 ? -4 : 1)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fs}
                  fontWeight="bold"
                  fill={isH ? "white" : "#1a1a1a"}
                  stroke={isH ? colors.hover : "rgba(255,255,255,0.85)"}
                  strokeWidth={isH ? 0 : 3}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {short.slice(0, 2)}
                </text>
                {short.length > 2 && (
                  <text
                    x={cx}
                    y={cy + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8.5}
                    fontWeight="bold"
                    fill={isH ? "white" : "#1a1a1a"}
                    stroke={isH ? colors.hover : "rgba(255,255,255,0.85)"}
                    strokeWidth={isH ? 0 : 3}
                    paintOrder="stroke"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {short.slice(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Okinawa inset click area */}
          {(() => {
            const colors = REGION_HEX["沖縄"]!;
            const isH = hovered === "okinawa";
            return (
              <g
                onClick={() => navigate("/japan-travel/okinawa")}
                onMouseEnter={() => setHovered("okinawa")}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered("okinawa")}
                onTouchEnd={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={OKI_RECT.x} y={OKI_RECT.y}
                  width={OKI_RECT.w} height={OKI_RECT.h}
                  fill={isH ? colors.base : "transparent"}
                  fillOpacity={isH ? 0.35 : 0}
                  stroke={isH ? colors.hover : "transparent"}
                  strokeWidth={1.5}
                  rx={4}
                />
                {/* Label near center of inset */}
                <text
                  x={OKI_RECT.x + OKI_RECT.w / 2}
                  y={OKI_RECT.y + OKI_RECT.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight="bold"
                  fill={isH ? "white" : "#1a1a1a"}
                  stroke={isH ? colors.hover : "rgba(255,255,255,0.85)"}
                  strokeWidth={isH ? 0 : 3}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  沖縄
                </text>
              </g>
            );
          })()}

          {/* TSMC markers */}
          {showTSMC &&
            tsmcLocations.map((loc) => {
              const x = imgX(loc.lon);
              const y = imgY(loc.lat);
              if (x < 0 || x > SVG_W || y < 0 || y > SVG_H) return null;
              return (
                <g key={loc.id} style={{ pointerEvents: "none" }}>
                  <circle cx={x} cy={y} r={8} fill={TYPE_COLOR[loc.type]} stroke="white" strokeWidth={1.5} />
                  <text
                    x={x} y={y + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={7} fill="white" fontWeight="bold"
                    style={{ userSelect: "none" }}
                  >
                    T
                  </text>
                </g>
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
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">
            📍 TSMC Japan 拠点
          </p>
          <div className="space-y-1.5">
            {tsmcLocations.map((loc) => (
              <div key={loc.id} className="flex items-start gap-2">
                <span
                  className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: TYPE_COLOR[loc.type] }}
                >
                  T
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {loc.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {TYPE_LABEL[loc.type]} · {loc.detail}
                  </p>
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
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {region}地方
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/japan-travel/${p.id}`)}
                  className="text-left px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors tap-active"
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {p.nameShort}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {p.nameEn}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
