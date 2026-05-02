import { useParams, useNavigate } from "react-router-dom";
import { prefectureMap, REGION_HEX } from "../data/japanTravel";
import { prefecturePolygons } from "../data/japanPrefecturePaths";
import { subRegionData } from "../data/japanSubRegions";

// ── Sub-prefecture map ──────────────────────────────────────────────────────
function PrefectureSubMap({
  id,
  color,
}: {
  id: string;
  color: { base: string; hover: string };
}) {
  const pts = prefecturePolygons[id];
  const cities = subRegionData[id]?.cities ?? [];
  if (!pts || pts.length === 0) return null;

  const W = 300, H = 200, PAD = 22;

  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  // also include city coords in bounding box
  cities.forEach((c) => { lons.push(c.lon); lats.push(c.lat); });

  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const spanLon = maxLon - minLon || 0.5;
  const spanLat = maxLat - minLat || 0.5;

  const sx = (W - PAD * 2) / spanLon;
  const sy = (H - PAD * 2) / spanLat;
  const s = Math.min(sx, sy);

  const drawW = spanLon * s;
  const drawH = spanLat * s;
  const offX = (W - drawW) / 2;
  const offY = (H - drawH) / 2;

  const toX = (lon: number) => (lon - minLon) * s + offX;
  const toY = (lat: number) => H - (lat - minLat) * s - offY;

  const pathD =
    pts
      .map(([lon, lat], i) => `${i === 0 ? "M" : "L"}${toX(lon).toFixed(1)},${toY(lat).toFixed(1)}`)
      .join(" ") + " Z";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🗺️</span>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">主要都市マップ</p>
      </div>
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full">
          {/* Prefecture fill */}
          <path
            d={pathD}
            fill={color.base}
            fillOpacity={0.18}
            stroke={color.base}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />

          {/* City pins */}
          {cities.map((city) => {
            const x = toX(city.lon);
            const y = toY(city.lat);
            return (
              <g key={city.name}>
                {city.capital ? (
                  <circle cx={x} cy={y} r={6} fill={color.hover} stroke="white" strokeWidth={1.5} />
                ) : (
                  <circle cx={x} cy={y} r={3.5} fill={color.base} stroke="white" strokeWidth={1} />
                )}
                <text
                  x={x + (city.capital ? 9 : 7)}
                  y={y + 1}
                  fontSize={city.capital ? 9.5 : 8}
                  fill="#1f2937"
                  dominantBaseline="middle"
                  fontWeight={city.capital ? "bold" : "normal"}
                  style={{ userSelect: "none" }}
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>
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

// ── Main page ───────────────────────────────────────────────────────────────
export default function PrefectureDetailPage() {
  const { prefectureId } = useParams<{ prefectureId: string }>();
  const navigate = useNavigate();
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
        返回地圖
      </button>

      {/* Header */}
      <div
        className="rounded-2xl p-5 mb-5 text-white"
        style={{ background: `linear-gradient(135deg, ${color.base}, ${color.hover})` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold opacity-80 mb-1 uppercase tracking-wider">
              {regionEmoji[p.region] ?? "🗾"} {p.region}
            </div>
            <h2 className="text-3xl font-bold mb-1">{p.nameShort}</h2>
            <p className="text-sm opacity-90">{p.nameEn} · 縣廳所在地：{p.capital}</p>
          </div>
          <div className="text-5xl opacity-80">{regionEmoji[p.region] ?? "🗾"}</div>
        </div>
        <p className="text-sm mt-3 opacity-90 leading-relaxed">{p.desc}</p>
      </div>

      {/* Sub-prefecture map */}
      <PrefectureSubMap id={p.id} color={color} />

      {/* Best season */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">📅</span>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">最佳旅遊季節</p>
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

      {/* Back button */}
      <div className="pb-4">
        <button
          onClick={() => navigate("/japan-travel")}
          className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          回到地圖
        </button>
      </div>
    </div>
  );
}
