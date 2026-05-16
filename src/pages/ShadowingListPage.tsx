import { useNavigate, useParams } from "react-router-dom";
import { getArticlesByLevel, isNewArticle } from "../data/shadowing";
import type { ShadowingArticle } from "../data/shadowing";

export default function ShadowingListPage() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const lvl = (level?.toUpperCase() ?? "N5") as "N5" | "N4" | "N3";
  const articles = getArticlesByLevel(lvl);

  const levelColor: Record<string, string> = {
    N5: "bg-green-500",
    N4: "bg-blue-500",
    N3: "bg-purple-500",
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className={`${levelColor[lvl] ?? "bg-gray-500"} text-white text-sm font-bold px-3 py-1 rounded-full`}>
          {lvl}
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">跟讀練習</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            跟著文章逐句朗讀，加強口說能力
            {" · "}
            <a
              href="https://news.web.nhk/news/easy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              NHK News Easy ↗
            </a>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {articles.map((article: ShadowingArticle) => {
          const isNew = isNewArticle(article);
          return (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => navigate(`/shadowing/${level}/${article.id}`)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors tap-active text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-2xl">
                  {article.emoji ?? "🎙️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-gray-50">{article.titleZH}</span>
                    {isNew && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{article.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{article.segments.length} 句</span>
                    {article.date && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{article.date}</span>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Reading mode button */}
              <div className="px-4 pb-3 flex gap-2">
                <button
                  onClick={() => navigate(`/shadowing/${level}/${article.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors tap-active"
                >
                  🎙️ 跟讀練習
                </button>
                <button
                  onClick={() => navigate(`/news-reader/${level}/${article.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors tap-active"
                >
                  📰 閱讀模式
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
