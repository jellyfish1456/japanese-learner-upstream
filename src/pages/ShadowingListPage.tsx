import { useNavigate, useParams } from "react-router-dom";
import { getArticlesByLevel } from "../data/shadowing";
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
          <p className="text-sm text-gray-500 dark:text-gray-400">跟著文章逐句朗讀，加強口說能力</p>
        </div>
      </div>

      <div className="space-y-3">
        {articles.map((article: ShadowingArticle) => (
          <button
            key={article.id}
            onClick={() => navigate(`/shadowing/${level}/${article.id}`)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors tap-active text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎙️</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-gray-50">{article.titleZH}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{article.title}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{article.sentences.length} 句</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
