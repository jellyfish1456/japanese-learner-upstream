import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefectures, REGION_HEX } from "../data/japanTravel";

// Grid dimensions
const CELL_W = 34;
const CELL_H = 30;
const GAP = 2;
const STRIDE_W = CELL_W + GAP;
const STRIDE_H = CELL_H + GAP;
const PAD = 4;

// Okinawa is at row 16 — leave a visual gap row (row 15 empty sea)
// Total rows used: 0-16 → 17 rows
const TOTAL_COLS = 10;
const TOTAL_ROWS = 17;
const SVG_W = TOTAL_COLS * STRIDE_W + PAD * 2;
const SVG_H = TOTAL_ROWS * STRIDE_H + PAD * 2;

const REGION_ORDER = ["北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄"];

export default function JapanMapPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">日本旅遊推薦</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">點擊地圖上的縣份，查看當地旅遊資訊</p>

      {/* SVG Map */}
      <div className="flex justify-center mb-4">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          className="max-w-full"
          style={{ touchAction: "manipulation" }}
        >
          {prefectures.map((p) => {
            const x = PAD + p.mapCol * STRIDE_W;
            const y = PAD + p.mapRow * STRIDE_H;
            const colors = REGION_HEX[p.region] ?? { base: "#94a3b8", hover: "#64748b" };
            const isHovered = hovered === p.id;
            const fill = isHovered ? colors.hover : colors.base;

            return (
              <g
                key={p.id}
                onClick={() => navigate(`/japan-travel/${p.id}`)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  rx={4}
                  fill={fill}
                  opacity={isHovered ? 1 : 0.9}
                />
                <text
                  x={x + CELL_W / 2}
                  y={y + CELL_H / 2 - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={p.nameShort.length <= 2 ? 9 : 8}
                  fill="white"
                  fontWeight="bold"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {p.nameShort.slice(0, 2)}
                </text>
                {p.nameShort.length > 2 && (
                  <text
                    x={x + CELL_W / 2}
                    y={y + CELL_H / 2 + 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
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

          {/* Okinawa gap indicator */}
          <text
            x={PAD + 0 * STRIDE_W + CELL_W / 2}
            y={PAD + 15 * STRIDE_H + CELL_H / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="#94a3b8"
            style={{ userSelect: "none" }}
          >
            ···
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {REGION_ORDER.map((region) => {
          const color = REGION_HEX[region];
          if (!color) return null;
          return (
            <div key={region} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color.base }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{region}</span>
            </div>
          );
        })}
      </div>

      {/* Prefecture list by region */}
      {REGION_ORDER.map((region) => {
        const list = prefectures.filter((p) => p.region === region);
        if (list.length === 0) return null;
        const color = REGION_HEX[region];
        return (
          <div key={region} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color?.base ?? "#94a3b8" }}
              />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{region}</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/japan-travel/${p.id}`)}
                  className="text-left px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors tap-active"
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-50 leading-tight">
                    {p.nameShort}
                  </div>
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
