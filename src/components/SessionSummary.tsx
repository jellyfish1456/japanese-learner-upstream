import type { SessionResult } from "../types";

interface SessionSummaryProps {
  result: SessionResult;
  onStudyAgain: () => void;
  onGoHome: () => void;
  nextAction?: { label: string; onClick: () => void };
  uniqueCardCount?: number;
  modesCount?: number;
}

export default function SessionSummary({
  result,
  onStudyAgain,
  onGoHome,
  nextAction,
  uniqueCardCount,
  modesCount,
}: SessionSummaryProps) {
  const { total, good, hard, again } = result;

  const isMultiMode = uniqueCardCount != null && modesCount != null && modesCount > 1;

  return (
    <div className="text-center">
      <div className="text-4xl mb-2">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">學習完成！</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-emerald-600">{good}</div>
          <div className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">記住了</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-600">{hard}</div>
          <div className="text-sm text-amber-700 dark:text-amber-400 mt-1">還好</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-600">{again}</div>
          <div className="text-sm text-red-700 dark:text-red-400 mt-1">不會</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {isMultiMode
            ? `${uniqueCardCount} 張卡片 × ${modesCount} 種模式 = ${total} 次測驗`
            : `本次共複習 ${total} 張卡片`}
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {good > 0 && (
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(good / total) * 100}%` }}
            />
          )}
          {hard > 0 && (
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${(hard / total) * 100}%` }}
            />
          )}
          {again > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(again / total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex gap-3 ${nextAction ? "flex-col" : ""}`}>
        <button
          onClick={onStudyAgain}
          className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active"
        >
          再來一次
        </button>
        {nextAction && (
          <button
            onClick={nextAction.onClick}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors tap-active"
          >
            {nextAction.label}
          </button>
        )}
        <button
          onClick={onGoHome}
          className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors tap-active"
        >
          回首頁
        </button>
      </div>
    </div>
  );
}
