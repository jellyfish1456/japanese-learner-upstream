import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";
import { subRegionData } from "../data/japanSubRegions";
import { tsmcLocations, TYPE_COLOR, TYPE_LABEL } from "../data/tsmcLocations";

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

// ── Coordinate transform calibrated to public/japan-map.svg (570×755) ──────────
// Cape Soya (141.9°E, 45.5°N) verified at screen (418.5, 8.5)
const SVG_W = 570;
const SVG_H = 755;
function imgX(lon: number): number { return (lon - 129.0) * 28.7 + 47; }
function imgY(lat: number): number { return (45.5 - lat) * 50.8 + 8; }

// ── Prefecture centroids from actual capital city coordinates ────────────────
// (accurate geographic positions — avoids the polygon-shape misalignment issue)
const CENTROIDS: Record<string, [number, number]> = (() => {
  const map: Record<string, [number, number]> = {};
  for (const p of prefectures) {
    if (p.id === "okinawa") {
      // Okinawa appears in the lower-left inset of the Wikipedia SVG
      map["okinawa"] = [118, 638];
      continue;
    }
    const cap = subRegionData[p.id]?.cities.find((c) => c.capital);
    if (cap) {
      map[p.id] = [imgX(cap.lon), imgY(cap.lat)];
    }
  }
  return map;
})();

// ── Find nearest prefecture by SVG coordinates ───────────────────────────────
function nearestPref(svgX: number, svgY: number): string | null {
  // Okinawa inset box: x 28-213, y 572-722 — use box centre for proximity
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

  // Convert mouse/touch position to SVG coordinate space
  const toSVGCoords = useCallback(
    (clientX: number, clientY: number, el: Element): [number, number] => {
      const r = el.getBoundingClientRect();
      return [
        (clientX - r.left) * (SVG_W / r.width),
        (clientY - r.top) * (SVG_H / r.height),
      ];
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const [sx, sy] = toSVGCoords(e.clientX, e.clientY, e.currentTarget);
      setHovered(nearestPref(sx, sy));
    },
    [toSVGCoords]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const [sx, sy] = toSVGCoords(e.clientX, e.clientY, e.currentTarget);
      const id = nearestPref(sx, sy);
      if (id) navigate(`/japan-travel/${id}`);
    },
    [navigate, toSVGCoords]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      const t = e.changedTouches[0];
      const [sx, sy] = toSVGCoords(t.clientX, t.clientY, e.currentTarget);
      const id = nearestPref(sx, sy);
      if (id) navigate(`/japan-travel/${id}`);
    },
    [navigate, toSVGCoords]
  );

  const hovColor = hovered
    ? REGION_HEX[prefectures.find((p) => p.id === hovered)?.region ?? ""] ?? null
    : null;

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

      {/* Map */}
      <div
        className="relative w-full overflow-hidden rounded-xl shadow mb-3 -mx-4"
        style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}
      >
        {/* Wikipedia high-quality Japan map as background */}
        <img
          src="/japanese-learner-upstream/japan-map.svg"
          alt="日本地図"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "fill" }}
          draggable={false}
        />

        {/* Interactive SVG overlay — proximity-based, no polygon shapes */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: "pointer", touchAction: "manipulation" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
        >
          {/* Hovered prefecture highlight ring + label */}
          {hovered && hovColor && CENTROIDS[hovered] && (() => {
            const [cx, cy] = CENTROIDS[hovered];
            const p = prefectures.find((pf) => pf.id === hovered)!;
            const label = p.nameShort.replace(/[都道府県]$/, "");
            return (
              <g style={{ pointerEvents: "none" }}>
                {/* Outer glow */}
                <circle cx={cx} cy={cy} r={22} fill={hovColor.base} fillOpacity={0.18} />
                {/* Main highlight dot */}
                <circle cx={cx} cy={cy} r={14} fill={hovColor.hover} fillOpacity={0.85}
                  stroke="white" strokeWidth={2} />
                {/* Prefecture kanji */}
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={label.length <= 2 ? 11 : 9} fontWeight="bold" fill="white"
                  style={{ userSelect: "none" }}>
                  {label.slice(0, 2)}
                </text>
                {label.length > 2 && (
                  <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle"
                    fontSize={7.5} fontWeight="bold" fill="white"
                    style={{ userSelect: "none" }}>
                    {label.slice(2)}
                  </text>
                )}
                {/* Name tooltip pill */}
                <rect x={cx - 28} y={cy + 18} width={56} height={15}
                  rx={7} fill={hovColor.hover} fillOpacity={0.92} />
                <text x={cx} y={cy + 26} textAnchor="middle" dominantBaseline="middle"
                  fontSize={8.5} fill="white" fontWeight="bold"
                  style={{ userSelect: "none" }}>
                  {p.nameShort}
                </text>
              </g>
            );
          })()}

          {/* Resting dots — small colored dots at all capital positions */}
          {prefectures.map((p) => {
            if (!CENTROIDS[p.id]) return null;
            const [cx, cy] = CENTROIDS[p.id];
            const isH = hovered === p.id;
            if (isH) return null; // drawn above
            const colors = REGION_HEX[p.region] ?? { base: "#94a3b8", hover: "#64748b" };
            const label = p.nameShort.replace(/[都道府県]$/, "");
            return (
              <g key={p.id} style={{ pointerEvents: "none" }}>
                <circle cx={cx} cy={cy} r={5} fill={colors.base}
                  stroke="white" strokeWidth={1.2} fillOpacity={0.85} />
                <text
                  x={cx} y={cy - 7}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={label.length <= 2 ? 9.5 : 8}
                  fontWeight="bold"
                  fill="#111"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2.8}
                  paintOrder="stroke"
                  style={{ userSelect: "none" }}
                >
                  {label.slice(0, 2)}
                </text>
              </g>
            );
          })}

          {/* TSMC markers */}
          {showTSMC &&
            tsmcLocations.map((loc) => {
              const x = imgX(loc.lon);
              const y = imgY(loc.lat);
              if (x < 0 || x > SVG_W || y < 0 || y > SVG_H) return null;
              return (
                <g key={loc.id} style={{ pointerEvents: "none" }}>
                  <circle cx={x} cy={y} r={8} fill={TYPE_COLOR[loc.type]}
                    stroke="white" strokeWidth={1.5} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={7} fill="white" fontWeight="bold"
                    style={{ userSelect: "none" }}>
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
