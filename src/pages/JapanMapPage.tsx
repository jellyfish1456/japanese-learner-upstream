import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";
import {
  prefecturePolygons, polygonToPath,
  MAP_MIN_LON, MAP_MIN_LAT, MAP_SCALE_X, MAP_SCALE_Y,
  MAP_OFF_X, MAP_OFF_Y, MAP_HEIGHT, MAP_W, MAP_H,
} from "../data/japanPrefecturePaths";
import { tsmcLocations, TYPE_COLOR } from "../data/tsmcLocations";

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

// ── Projection helpers ──────────────────────────────────────────────────────
function mx(lon: number) {
  return (lon - MAP_MIN_LON) * MAP_SCALE_X + MAP_OFF_X;
}
function my(lat: number) {
  return MAP_HEIGHT - (lat - MAP_MIN_LAT) * MAP_SCALE_Y + MAP_OFF_Y;
}

// ── Okinawa inset ───────────────────────────────────────────────────────────
const OKI = { x: 6, y: 398, w: 80, h: 42 };
const OKI_LON0 = 126.7, OKI_LON1 = 129.1, OKI_LAT0 = 25.8, OKI_LAT1 = 27.2;
const OKI_SX = (OKI.w - 6) / (OKI_LON1 - OKI_LON0);
const OKI_SY = (OKI.h - 6) / (OKI_LAT1 - OKI_LAT0);
const OKI_S = Math.min(OKI_SX, OKI_SY);
function okiX(lon: number) { return OKI.x + (lon - OKI_LON0) * OKI_S + 3; }
function okiY(lat: number) { return OKI.y + (OKI_LAT1 - lat) * OKI_S + 3; }

// ── Centroid ────────────────────────────────────────────────────────────────
function centroid(id: string): [number, number] {
  const pts = prefecturePolygons[id];
  if (!pts) return [0, 0];
  const x = pts.reduce((s, [lon]) => s + mx(lon), 0) / pts.length;
  const y = pts.reduce((s, [, lat]) => s + my(lat), 0) / pts.length;
  return [x, y];
}

// ── Region label positions (hand-tuned) ────────────────────────────────────
const REGION_LABELS: { name: string; x: number; y: number }[] = [
  { name: "北海道", x: 225, y: 22 },
  { name: "東北", x: 230, y: 100 },
  { name: "関東", x: 255, y: 175 },
  { name: "中部", x: 155, y: 175 },
  { name: "近畿", x: 90, y: 205 },
  { name: "中国", x: 60, y: 245 },
  { name: "四国", x: 105, y: 270 },
  { name: "九州", x: 38, y: 290 },
];

export default function JapanMapPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTSMC, setShowTSMC] = useState(true);

  const mainPrefectures = prefectures.filter((p) => p.id !== "okinawa");

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">🗾 日本旅遊地図</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        都道府県をタップ → 観光スポット・グルメ・大学をチェック
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

      {/* SVG Map */}
      <div className="flex justify-center mb-2 -mx-4">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          width="100%"
          style={{ maxWidth: MAP_W, touchAction: "manipulation" }}
        >
          {/* Sea background */}
          <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#e0f2fe" />

          {/* Region labels (background) */}
          {REGION_LABELS.map((rl) => (
            <text
              key={rl.name}
              x={rl.x} y={rl.y}
              fontSize={7.5}
              fill="#94a3b8"
              textAnchor="middle"
              fontWeight="500"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {rl.name}地方
            </text>
          ))}

          {/* Main 46 prefectures */}
          {mainPrefectures.map((p) => {
            const pts = prefecturePolygons[p.id];
            if (!pts) return null;
            const d = polygonToPath(pts, MAP_MIN_LON, MAP_MIN_LAT, MAP_SCALE_X, MAP_SCALE_Y, MAP_OFF_X, MAP_OFF_Y, MAP_HEIGHT);
            const colors = REGION_HEX[p.region] ?? { base: "#94a3b8", hover: "#64748b" };
            const isH = hovered === p.id;
            const [cx, cy] = centroid(p.id);
            // short name: strip 都道府県 suffix for display
            const short = p.nameShort.replace(/[都道府県]$/, "");
            return (
              <g
                key={p.id}
                onClick={() => navigate(`/japan-travel/${p.id}`)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={d}
                  fill={isH ? colors.hover : colors.base}
                  stroke="white"
                  strokeWidth={0.9}
                  strokeLinejoin="round"
                  opacity={isH ? 1 : 0.9}
                />
                {/* Prefecture kanji label */}
                <text
                  x={cx} y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={short.length <= 2 ? 6.5 : 5.5}
                  fill="white"
                  fontWeight="bold"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {short.slice(0, 2)}
                </text>
                {short.length > 2 && (
                  <text
                    x={cx} y={cy + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={5}
                    fill="white"
                    fontWeight="bold"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {short.slice(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Okinawa inset box */}
          <rect
            x={OKI.x - 1} y={OKI.y - 1}
            width={OKI.w + 2} height={OKI.h + 2}
            fill="#e0f2fe" stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3,2" rx={2}
          />
          <text x={OKI.x + OKI.w / 2} y={OKI.y - 3}
            textAnchor="middle" fontSize={6} fill="#64748b" style={{ userSelect: "none" }}>
            ※沖縄県（実際は九州南西）
          </text>

          {/* Okinawa polygon */}
          {(() => {
            const pts = prefecturePolygons["okinawa"];
            if (!pts) return null;
            const d = pts.map(([lon, lat], i) =>
              `${i === 0 ? "M" : "L"}${okiX(lon).toFixed(1)},${okiY(lat).toFixed(1)}`
            ).join(" ") + " Z";
            const colors = REGION_HEX["沖縄"]!;
            const isH = hovered === "okinawa";
            const cX = pts.reduce((s, [lon]) => s + okiX(lon), 0) / pts.length;
            const cY = pts.reduce((s, [, lat]) => s + okiY(lat), 0) / pts.length;
            return (
              <g
                onClick={() => navigate("/japan-travel/okinawa")}
                onMouseEnter={() => setHovered("okinawa")}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <path d={d} fill={isH ? colors.hover : colors.base}
                  stroke="white" strokeWidth={0.8} />
                <text x={cX} y={cY + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={6} fill="white" fontWeight="bold"
                  style={{ pointerEvents: "none", userSelect: "none" }}>
                  沖縄
                </text>
              </g>
            );
          })()}

          {/* TSMC markers */}
          {showTSMC && tsmcLocations.map((loc) => {
            const x = mx(loc.lon);
            const y = my(loc.lat);
            // Only show in main map for non-okinawa locations
            if (x < 0 || x > MAP_W || y < 0 || y > MAP_HEIGHT + MAP_OFF_Y) return null;
            return (
              <g key={loc.id} style={{ pointerEvents: "none" }}>
                <circle cx={x} cy={y} r={5} fill={TYPE_COLOR[loc.type]} stroke="white" strokeWidth={1.2} />
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={5.5} fill="white" fontWeight="bold"
                  style={{ userSelect: "none" }}>
                  T
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
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
                <span
                  className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: TYPE_COLOR[loc.type] }}
                >T</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{loc.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{loc.detail}</p>
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
                <button
                  key={p.id}
                  onClick={() => navigate(`/japan-travel/${p.id}`)}
                  className="text-left px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors tap-active"
                >
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
