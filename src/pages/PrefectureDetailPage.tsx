import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { prefectureMap, REGION_HEX } from "../data/japanTravel";
import { prefecturePolygons } from "../data/japanPrefecturePaths";
import { prefecturePaths } from "../data/prefectureSvgPaths";
import { subRegionData } from "../data/japanSubRegions";
import { castlesByPrefecture } from "../data/japanCastles";
import { tsmcLocations, TYPE_COLOR, TYPE_LABEL } from "../data/tsmcLocations";

// ── Castle image with fallback ──────────────────────────────────────────────
function CastleImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-full aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <span className="text-5xl">🏯</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full aspect-video object-cover rounded-xl"
      onError={() => setFailed(true)}
    />
  );
}

// ── Same projection as JapanMapPage ────────────────────────────────────────
function svgX(lon: number): number { return (lon - 129.0) * 28.7 + 47; }
function svgY(lat: number): number { return (45.5 - lat) * 50.8 + 8; }

// ── Sub-prefecture map using the same GeoJSON-derived paths as the main map ─
function PrefectureSubMap({
  id,
  color,
}: {
  id: string;
  color: { base: string; hover: string };
}) {
  const accuratePath = prefecturePaths[id];   // GeoJSON-accurate SVG path
  const roughPoly    = prefecturePolygons[id] ?? []; // rough bbox only
  const cities       = subRegionData[id]?.cities ?? [];
  const tsmcHere     = tsmcLocations.filter((t) => t.prefecture === id);

  if (!accuratePath) return null;

  // ── Compute viewBox from rough polygon + cities ──────────────────────────
  const allLonLat: [number, number][] = [
    ...roughPoly,
    ...cities.map((c) => [c.lon, c.lat] as [number, number]),
    ...tsmcHere.map((t) => [t.lon, t.lat] as [number, number]),
  ];

  if (!allLonLat.length) return null;

  const xs = allLonLat.map(([lon]) => svgX(lon));
  const ys = allLonLat.map(([, lat]) => svgY(lat));

  const PAD = 28;
  const vbMinX = Math.min(...xs) - PAD;
  const vbMinY = Math.min(...ys) - PAD;
  const vbW    = Math.max(...xs) - Math.min(...xs) + PAD * 2;
  const vbH    = Math.max(...ys) - Math.min(...ys) + PAD * 2;

  // ── Label placement: left/right based on position within prefecture ──────
  const capitalCity = cities.find((c) => c.capital);
  const midX = capitalCity ? svgX(capitalCity.lon) : vbMinX + vbW / 2;

  // Scale font sizes proportionally to the viewBox width
  const fontScale = vbW / 180; // ~1.0 for normal prefectures
  const capFont   = Math.round(13 * fontScale);
  const cityFont  = Math.round(11 * fontScale);
  const starFont  = Math.round(9  * fontScale);
  const capR      = Math.round(8  * fontScale);
  const cityR     = Math.round(5  * fontScale);
  const labelGap  = Math.round(10 * fontScale);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🗺️</span>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">主要都市マップ</p>
      </div>
      <div className="flex justify-center overflow-hidden">
        <svg
          viewBox={`${vbMinX} ${vbMinY} ${vbW} ${vbH}`}
          className="max-w-full rounded-lg"
          style={{ width: "100%", maxHeight: 240 }}
        >
          {/* Sea / background */}
          <rect x={vbMinX} y={vbMinY} width={vbW} height={vbH} fill="#e0f2fe" />
          {/* Accurate GeoJSON-derived prefecture shape */}
          <path
            d={accuratePath}
            fill={color.base}
            fillOpacity={0.3}
            stroke={color.base}
            strokeWidth={fontScale * 1.5}
            strokeLinejoin="round"
          />
          {/* City pins */}
          {cities.map((city) => {
            const cx = svgX(city.lon);
            const cy = svgY(city.lat);
            // Place label on the side away from centre to reduce overlap
            const toRight = cx >= midX;
            const anchor  = toRight ? "start" : "end";
            const lx      = cx + (toRight ? labelGap : -labelGap);
            return (
              <g key={city.name}>
                {city.capital ? (
                  <>
                    <circle cx={cx} cy={cy} r={capR} fill={color.hover} stroke="white" strokeWidth={fontScale * 1.5} />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                      fontSize={starFont} fill="white" fontWeight="bold"
                      style={{ userSelect: "none", pointerEvents: "none" }}>★</text>
                  </>
                ) : (
                  <circle cx={cx} cy={cy} r={cityR} fill={color.base} stroke="white" strokeWidth={fontScale} />
                )}
                <text
                  x={lx} y={cy}
                  fontSize={city.capital ? capFont : cityFont}
                  fill="#1f2937"
                  dominantBaseline="middle"
                  textAnchor={anchor}
                  fontWeight={city.capital ? "bold" : "normal"}
                  stroke="white"
                  strokeWidth={fontScale * 2.5}
                  paintOrder="stroke"
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {city.name}
                </text>
              </g>
            );
          })}
          {/* TSMC markers */}
          {tsmcHere.map((loc) => {
            const cx = svgX(loc.lon);
            const cy = svgY(loc.lat);
            const toRight = cx >= midX;
            const anchor  = toRight ? "start" : "end";
            const lx      = cx + (toRight ? labelGap : -labelGap);
            return (
              <g key={loc.id} style={{ pointerEvents: "none" }}>
                <circle cx={cx} cy={cy} r={capR} fill={TYPE_COLOR[loc.type]} stroke="white" strokeWidth={fontScale * 1.5} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                  fontSize={starFont} fill="white" fontWeight="bold"
                  style={{ userSelect: "none" }}>T</text>
                <text x={lx} y={cy} fontSize={cityFont} fill="#dc2626"
                  dominantBaseline="middle" textAnchor={anchor} fontWeight="bold"
                  stroke="white" strokeWidth={fontScale * 2.5} paintOrder="stroke"
                  style={{ userSelect: "none" }}>TSMC</text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hover }} />
          <span>県庁所在地</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.base }} />
          <span>主要都市</span>
        </div>
        {tsmcHere.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>TSMC拠点</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Castles section ─────────────────────────────────────────────────────────
function CastlesSection({ id }: { id: string }) {
  const castles = castlesByPrefecture[id] ?? [];
  if (!castles.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏯</span>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">名城・城郭</p>
      </div>
      <div className="space-y-5">
        {castles.map((castle) => (
          <div key={castle.name} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 last:pb-0">
            <CastleImage src={castle.imageUrl} alt={castle.name} />
            <div className="mt-2">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">{castle.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{castle.nameEn}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {castle.tags.map((tag) => (
                    <span key={tag}
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        tag === "国宝" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                        tag === "世界遺産" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary description */}
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed mb-3">
                {castle.description}
              </p>

              {/* Castle lord (城主) */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 mb-3 border border-blue-100 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-0.5">城主</p>
                <p className="text-xs text-blue-600 dark:text-blue-200 leading-relaxed">
                  {castle.lord}
                </p>
              </div>

              {/* History (歷史故事) */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1.5">歷史</p>
                <p className="text-xs text-amber-600 dark:text-amber-200 leading-relaxed">
                  {castle.history}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Universities section ────────────────────────────────────────────────────
function UniversitiesSection({
  unis,
  color,
}: {
  unis: string[];
  color: { base: string; hover: string };
}) {
  if (!unis.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎓</span>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">主要大学</p>
      </div>
      <div className="space-y-1.5">
        {unis.map((u, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style={{ backgroundColor: i === 0 ? color.hover : color.base }}
            >
              {i + 1}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TSMC section ─────────────────────────────────────────────────────────────
function TSMCSection({ id }: { id: string }) {
  const here = tsmcLocations.filter((t) => t.prefecture === id);
  if (!here.length) return null;
  return (
    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📍</span>
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">TSMC Japan 拠点</p>
      </div>
      <div className="space-y-3">
        {here.map((loc) => (
          <div key={loc.id} className="flex items-start gap-2.5">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold mt-0.5"
              style={{ backgroundColor: TYPE_COLOR[loc.type] }}
            >
              T
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{loc.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                種別：{TYPE_LABEL[loc.type]}{loc.openYear ? ` 開所：${loc.openYear}` : ""}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{loc.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function PrefectureDetailPage() {
  const { prefectureId } = useParams<{ prefectureId: string }>();
  const navigate = useNavigate();

  // Scroll to top on every prefecture navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [prefectureId]);

  const p = prefectureMap[prefectureId ?? ""];

  if (!p) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-3">🗾</div>
        <p>找不到該縣份的資料</p>
        <button
          onClick={() => navigate("/japan-travel")}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold"
        >
          回到地圖
        </button>
      </div>
    );
  }

  const color = REGION_HEX[p.region] ?? { base: "#94a3b8", hover: "#64748b" };
  const sub = subRegionData[p.id];

  const regionEmoji: Record<string, string> = {
    北海道: "🏔️", 東北: "🌸", 関東: "🗼", 中部: "🗻", 近畿: "⛩️",
    中国: "🏯", 四国: "🙏", 九州: "🌋", 沖縄: "🌊",
  };

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate("/japan-travel")}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回地図
      </button>

      {/* Header */}
      <div
        className="rounded-2xl p-5 mb-5 text-white"
        style={{ background: `linear-gradient(135deg, ${color.base}, ${color.hover})` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold opacity-80 mb-1 uppercase tracking-wider">
              {regionEmoji[p.region] ?? "🗾"} {p.region}地方
            </div>
            <h2 className="text-3xl font-bold mb-1">{p.name}</h2>
            <p className="text-sm opacity-90">{p.nameEn} · 県庁所在地：{p.capital}</p>
          </div>
          <div className="text-5xl opacity-80">{regionEmoji[p.region] ?? "🗾"}</div>
        </div>
        <p className="text-sm mt-3 opacity-90 leading-relaxed">{p.desc}</p>
      </div>

      {/* Sub map */}
      <PrefectureSubMap id={p.id} color={color} />

      {/* TSMC */}
      <TSMCSection id={p.id} />

      {/* Best season */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📅</span>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            最佳旅遊季節
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{p.season}</p>
        </div>
      </div>

      {/* Spots */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📍</span>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">必訪景點</p>
        </div>
        <ul className="space-y-2">
          {p.spots.map((spot, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold mt-0.5"
                style={{ backgroundColor: color.base }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{spot}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Castles */}
      <CastlesSection id={p.id} />

      {/* Food */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🍴</span>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">當地美食</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.food.map((item, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color.base }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Universities */}
      {sub && <UniversitiesSection unis={sub.universities} color={color} />}

      {/* Back */}
      <div className="pb-4">
        <button
          onClick={() => navigate("/japan-travel")}
          className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          回到地図
        </button>
      </div>
    </div>
  );
}
