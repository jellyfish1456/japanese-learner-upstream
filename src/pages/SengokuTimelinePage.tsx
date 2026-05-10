import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { sengokuTimeline } from "../data/sengokuTimeline";

const ERA_COLORS = {
  早期: "#ef4444",   // red
  中期: "#f59e0b",   // amber
  後期: "#3b82f6",   // blue
};

function getEra(year: string): keyof typeof ERA_COLORS {
  const yearNum = parseInt(year);
  if (yearNum < 1550) return "早期";
  if (yearNum < 1590) return "中期";
  return "後期";
}

export default function SengokuTimelinePage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"ja" | "cn">("ja");

  const groupedEvents = sengokuTimeline.reduce(
    (acc, event) => {
      const era = getEra(event.year);
      if (!acc[era]) acc[era] = [];
      acc[era].push(event);
      return acc;
    },
    {} as Record<string, typeof sengokuTimeline>
  );

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate("/japan-travel")}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        日本地圖
      </button>

      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">⏰</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">戦国時代の時間線</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          1467年～1615年の重要な事件と戦役を年代順に表示
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          日本語 / 繁體中文 に切り替え可能
        </p>
      </div>

      {/* Language toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setLang("ja")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            lang === "ja"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          日本語
        </button>
        <button
          onClick={() => setLang("cn")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            lang === "cn"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          繁體中文
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
        {(["早期", "中期", "後期"] as const).map((era) => (
          <div key={era} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: ERA_COLORS[era] }}
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {era} ({era === "早期" ? "1467-1550" : era === "中期" ? "1550-1590" : "1590-1615"})
            </span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {(["早期", "中期", "後期"] as const).map((era) => (
          <div key={era}>
            {/* Era header */}
            <div className="py-3 px-4 sticky top-0 bg-gray-100 dark:bg-gray-700 border-l-4 mb-2 z-10" style={{ borderLeftColor: ERA_COLORS[era] }}>
              <h2 className="font-bold text-gray-900 dark:text-gray-50">
                {era === "早期" ? "初期戦国時代" : era === "中期" ? "中期戦国時代" : "後期戦国時代"}
                <span className="text-xs font-normal text-gray-600 dark:text-gray-400 ml-2">
                  {era === "早期" ? "(1467-1550)" : era === "中期" ? "(1550-1590)" : "(1590-1615)"}
                </span>
              </h2>
            </div>

            {/* Events */}
            {groupedEvents[era]?.map((event, idx) => (
              <div
                key={`${era}-${idx}`}
                className="mb-4 pb-4 border-l-2 pl-6 relative"
                style={{ borderLeftColor: ERA_COLORS[era] }}
              >
                {/* Timeline dot */}
                <div
                  className="absolute -left-2 w-3 h-3 rounded-full -top-1"
                  style={{ background: ERA_COLORS[era] }}
                />

                {/* Year badge */}
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-mono font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {event.year}
                </div>

                {/* Event card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg mb-1">
                    {lang === "ja" ? event.name : event.nameCn}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {event.region}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {lang === "ja" ? event.description : event.descriptionCn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>全 {sengokuTimeline.length} 件の戦国時代の重要事件を表示中</p>
      </div>
    </div>
  );
}
