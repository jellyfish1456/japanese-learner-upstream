import { useNavigate } from "react-router-dom";
import type { DatasetMeta } from "../types";
import StatsBar from "./StatsBar";

interface DatasetCardProps {
  dataset: DatasetMeta;
}

const categoryLabels: Record<string, string> = {
  vocabulary: "詞彙",
  grammar: "文法",
};

const categoryColors: Record<string, string> = {
  vocabulary: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  grammar: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function DatasetCard({ dataset }: DatasetCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/study/${dataset.id}`)}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all tap-active"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[dataset.category] ?? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            >
              {categoryLabels[dataset.category] ?? dataset.category}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {dataset.level}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate">{dataset.name}</h3>
        </div>
        <div className="flex items-start gap-2 ml-4 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/manage/${dataset.id}`);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="管理"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{dataset.dueCards}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">待複習 / {dataset.totalCards}</div>
          </div>
        </div>
      </div>
      <StatsBar
        learnedCards={dataset.learnedCards}
        masteredCards={dataset.masteredCards}
        totalCards={dataset.totalCards}
      />
    </button>
  );
}
