import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";
import { subRegionData } from "../data/japanSubRegions";
import { tsmcLocations, TYPE_COLOR, TYPE_LABEL } from "../data/tsmcLocations";

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

// ── Wikipedia SVG coordinate transform (570×755) ────────────────────────────
const SVG_W = 570;
const SVG_H = 755;
function imgX(lon: number): number { return (lon - 129.0) * 28.7 + 47; }
function imgY(lat: number): number { return (45.5 - lat) * 50.8 + 8; }

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

      {/* Map — Wikipedia SVG background + clean hover-only overlay */}
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

        {/* Overlay — NO labels (Wikipedia SVG already has them) — hover tooltip only */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: "pointer", touchAction: "manipulation" }}
          onMouseMove={onMove}
          onMouseLeave={() => setHovered(null)}
          onClick={onClick}
          onTouchEnd={onTouch}
        >
          {/* Hover indicator — only shows when hovering */}
          {hovered && hovColor && CENTROIDS[hovered] && (() => {
            const [cx, cy] = CENTROIDS[hovered];
            const p = prefectures.find((pf) => pf.id === hovered)!;
            const short = p.nameShort;
            const pillW = short.length * 11 + 16;
            return (
              <g style={{ pointerEvents: "none" }}>
                {/* Glow ring */}
                <circle cx={cx} cy={cy} r={18} fill={hovColor.base} fillOpacity={0.2} />
                <circle cx={cx} cy={cy} r={10} fill={hovColor.hover} fillOpacity={0.9}
                  stroke="white" strokeWidth={2.5} />
                {/* Name pill */}
                <rect x={cx - pillW / 2} y={cy - 26} width={pillW} height={18}
                  rx={9} fill={hovColor.hover} fillOpacity={0.95} />
                <text x={cx} y={cy - 17} textAnchor="middle" dominantBaseline="middle"
                  fontSize={10.5} fill="white" fontWeight="bold"
                  style={{ userSelect: "none" }}>
                  {short}
                </text>
              </g>
            );
          })()}

          {/* TSMC markers */}
          {showTSMC && tsmcLocations.map((loc) => {
            const x = imgX(loc.lon);
            const y = imgY(loc.lat);
            if (x < 0 || x > SVG_W || y < 0 || y > SVG_H) return null;
            return (
              <g key={loc.id} style={{ pointerEvents: "none" }}>
                <circle cx={x} cy={y} r={8} fill={TYPE_COLOR[loc.type]}
                  stroke="white" strokeWidth={1.5} />
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="white" fontWeight="bold"
                  style={{ userSelect: "none" }}>T</text>
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
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">📍 TSMC Japan 拠点</p>
          <div className="space-y-1.5">
            {tsmcLocations.map((loc) => (
              <div key={loc.id} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: TYPE_COLOR[loc.type] }}>T</span>
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
