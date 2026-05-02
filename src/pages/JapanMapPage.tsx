import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";
import {
  prefecturePolygons, polygonToPath,
  MAP_MIN_LON, MAP_MIN_LAT, MAP_SCALE_X, MAP_SCALE_Y,
  MAP_OFF_X, MAP_OFF_Y, MAP_HEIGHT, MAP_W, MAP_H,
} from "../data/japanPrefecturePaths";

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

// Okinawa inset transform
const OKI_BOX = { x: 2, y: 218, w: 55, h: 38 };
const OKI_MIN_LON = 126.8, OKI_MAX_LON = 129.0, OKI_MIN_LAT = 25.9, OKI_MAX_LAT = 27.1;
const OKI_SX = OKI_BOX.w / (OKI_MAX_LON - OKI_MIN_LON);
const OKI_SY = OKI_BOX.h / (OKI_MAX_LAT - OKI_MIN_LAT);
const OKI_S = Math.min(OKI_SX, OKI_SY) * 0.85;

function okiX(lon: number) {
  return OKI_BOX.x + (lon - OKI_MIN_LON) * OKI_S + 2;
}
function okiY(lat: number) {
  return OKI_BOX.y + (OKI_MAX_LAT - lat) * OKI_S + 2;
}

function mainPath(id: string): string {
  const pts = prefecturePolygons[id];
  if (!pts) return "";
  return polygonToPath(pts, MAP_MIN_LON, MAP_MIN_LAT, MAP_SCALE_X, MAP_SCALE_Y, MAP_OFF_X, MAP_OFF_Y, MAP_HEIGHT);
}

export default function JapanMapPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  // Build centroid labels from path bounding boxes
  function centroid(id: string): [number, number] {
    const pts = prefecturePolygons[id];
    if (!pts) return [0, 0];
    const xs = pts.map(([lon]) =>
      (lon - MAP_MIN_LON) * MAP_SCALE_X + MAP_OFF_X
    );
    const ys = pts.map(([, lat]) =>
      MAP_HEIGHT - (lat - MAP_MIN_LAT) * MAP_SCALE_Y + MAP_OFF_Y
    );
    const x = xs.reduce((a, b) => a + b, 0) / xs.length;
    const y = ys.reduce((a, b) => a + b, 0) / ys.length;
    return [x, y];
  }

  const mainPrefectures = prefectures.filter((p) => p.id !== "okinawa");

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">日本旅遊推薦</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">點擊地圖上的縣份，查看當地旅遊資訊</p>

      {/* SVG Map */}
      <div className="flex justify-center mb-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          width={MAP_W}
          height={MAP_H}
          className="max-w-full"
          style={{ touchAction: "manipulation" }}
        >
          {/* Okinawa inset box */}
          <rect
            x={OKI_BOX.x - 1} y={OKI_BOX.y - 1}
            width={OKI_BOX.w + 2} height={OKI_BOX.h + 2}
            fill="none" stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3,2" rx={2}
          />
          <text x={OKI_BOX.x + 1} y={OKI_BOX.y - 3} fontSize={5} fill="#94a3b8">沖縄</text>

          {/* Okinawa polygon */}
          {(() => {
            const pts = prefecturePolygons["okinawa"];
            if (!pts) return null;
            const d = pts.map(([lon, lat], i) =>
              `${i === 0 ? "M" : "L"}${okiX(lon).toFixed(1)},${okiY(lat).toFixed(1)}`
            ).join(" ") + " Z";
            const colors = REGION_HEX["沖縄"]!;
            const isH = hovered === "okinawa";
            return (
              <g
                onClick={() => navigate("/japan-travel/okinawa")}
                onMouseEnter={() => setHovered("okinawa")}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <path d={d} fill={isH ? colors.hover : colors.base} stroke="white" strokeWidth={0.8} />
              </g>
            );
          })()}

          {/* Main 46 prefectures */}
          {mainPrefectures.map((p) => {
            const d = mainPath(p.id);
            if (!d) return null;
            const colors = REGION_HEX[p.region] ?? { base: "#94a3b8", hover: "#64748b" };
            const isH = hovered === p.id;
            const [cx, cy] = centroid(p.id);
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
                  strokeWidth={0.8}
                  opacity={isH ? 1 : 0.92}
                />
                <text
                  x={cx} y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={5.5}
                  fill="white"
                  fontWeight="bold"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {p.nameShort.slice(0, 2)}
                </text>
                {p.nameShort.length > 2 && (
                  <text
                    x={cx} y={cy + 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={5}
                    fill="white"
                    fontWeight="bold"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {p.nameShort.slice(2)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {REGION_ORDER.map((region) => {
          const color = REGION_HEX[region];
          if (!color) return null;
          return (
            <div key={region} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color.base }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{region}</span>
            </div>
          );
        })}
      </div>

      {/* Prefecture list by region */}
      {REGION_ORDER.map((region) => {
        const list = prefectures.filter((p) => p.region === region);
        if (!list.length) return null;
        const color = REGION_HEX[region];
        return (
          <div key={region} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-4 rounded-sm" style={{ backgroundColor: color?.base }} />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{region}</h3>
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

      {/* Okinawa notice */}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center pb-4">
        ※ 沖縄は地図左下のインセットに表示
      </div>
    </div>
  );
}
