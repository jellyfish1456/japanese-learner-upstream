import { loadStreak, getWeekDays } from "../lib/streak";

export default function StreakBar() {
  const streak = loadStreak();
  const weekDays = getWeekDays();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {streak.currentStreak}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">天連續</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {streak.todayActions}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">今日練習</span>
        </div>
      </div>
      <div className="flex justify-between gap-1">
        {weekDays.map(({ date, label }) => {
          const record = streak.weekHistory.find((d) => d.date === date);
          const hasActivity = record && record.actions > 0;
          return (
            <div key={date} className="flex-1 text-center">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{label}</div>
              <div
                className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  hasActivity
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600"
                }`}
              >
                {hasActivity ? "✓" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
