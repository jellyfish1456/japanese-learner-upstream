import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { prefectureMap, REGION_HEX } from "../data/japanTravel";
import { spotDetails } from "../data/japanSpotDetails";

const TAG_COLORS: Record<string, string> = {
  自然:   "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  文化:   "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  歷史:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  溫泉:   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  美食:   "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  藝術:   "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
  遊樂:   "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  世界遺産: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  海洋:   "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  滑雪:   "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  登山:   "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  宗教:   "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  城堡:   "bg-stone-100 dark:bg-stone-900/30 text-stone-700 dark:text-stone-300",
  夜景:   "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
};

export default function SpotDetailPage() {
  const { prefectureId, spotIndex } = useParams<{ prefectureId: string; spotIndex: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [prefectureId, spotIndex]);

  const prefecture = prefectureMap[prefectureId ?? ""];
  const idx = Number(spotIndex ?? "-1");
  const spots = spotDetails[prefectureId ?? ""] ?? [];
  const spot = spots[idx];
  const spotName = prefecture?.spots?.[idx];

  if (!prefecture || !spot || isNaN(idx)) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-3">🗾</div>
        <p>找不到景點資料</p>
        <button
          onClick={() => navigate(prefectureId ? `/japan-travel/${prefectureId}` : "/japan-travel")}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold"
        >
          返回
        </button>
      </div>
    );
  }

  const color = REGION_HEX[prefecture.region] ?? { base: "#94a3b8", hover: "#64748b" };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate(`/japan-travel/${prefectureId}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回 {prefecture.nameShort}
      </button>

      {/* Header banner */}
      <div
        className="rounded-2xl p-5 mb-5 text-white"
        style={{ background: `linear-gradient(135deg, ${color.base}, ${color.hover})` }}
      >
        <div className="text-xs font-semibold opacity-80 mb-1 uppercase tracking-wider">
          {prefecture.region}地方・{prefecture.nameShort}
        </div>
        <h2 className="text-2xl font-bold mb-2 leading-tight">{spotName ?? spot.name}</h2>
        <div className="flex flex-wrap gap-1.5">
          {spot.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-white/20 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Photo */}
      {spot.photo && (
        <div className="rounded-xl overflow-hidden mb-4 aspect-video bg-gray-100 dark:bg-gray-800">
          <img
            src={spot.photo}
            alt={spotName ?? spot.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📖</span>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">景點介紹</p>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{spot.desc}</p>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 mb-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">旅遊小提示</p>
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{spot.tips}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🏷️</span>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">類型標籤</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {spot.tags.map((tag) => (
            <span
              key={tag}
              className={`text-sm px-3 py-1.5 rounded-full font-medium ${TAG_COLORS[tag] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Other spots in same prefecture */}
      {spots.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📍</span>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{prefecture.nameShort}の其他景點</p>
          </div>
          <div className="space-y-2">
            {spots.map((s, i) => {
              if (i === idx) return null;
              return (
                <button
                  key={i}
                  onClick={() => navigate(`/japan-travel/${prefectureId}/spot/${i}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left tap-active"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                    style={{ backgroundColor: color.base }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {prefecture.spots[i]}
                    </p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {s.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs text-gray-500 dark:text-gray-400">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Back to prefecture */}
      <div className="pb-4">
        <button
          onClick={() => navigate(`/japan-travel/${prefectureId}`)}
          className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          回到 {prefecture.name}
        </button>
      </div>
    </div>
  );
}
