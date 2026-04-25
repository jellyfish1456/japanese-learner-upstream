import { useParams, useNavigate } from "react-router-dom";
import { useListeningSession } from "../hooks/useListeningSession";

const levelColors: Record<string, { badge: string; correct: string; wrong: string }> = {
  N5: {
    badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    correct: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300",
    wrong: "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
  },
  N4: {
    badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    correct: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300",
    wrong: "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
  },
  N3: {
    badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    correct: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300",
    wrong: "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
  },
};

export default function ListeningSessionPage() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const upperLevel = (level ?? "").toUpperCase();
  const colors = levelColors[upperLevel] ?? levelColors["N5"];

  const { question, index, total, selected, correct, done, answer, next, replay } =
    useListeningSession(upperLevel, 10);

  if (!question && !done) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-5xl mb-4">🎧</div>
        <p>找不到聽力資料</p>
      </div>
    );
  }

  // ── Summary screen ─────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((correct / total) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          聽力練習完成！
        </h2>
        <div className="text-5xl font-bold text-gray-900 dark:text-gray-50 my-4">
          {correct} / {total}
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8">正確率 {pct}%</p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/listening/${level}`)}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            再練一次
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            回首頁
          </button>
        </div>
      </div>
    );
  }

  // ── Question screen ─────────────────────────────────────────────────────────
  const progress = ((index) / total) * 100;

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
          {upperLevel}
        </span>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium tabular-nums">
          {index + 1} / {total}
        </span>
      </div>

      {/* Audio card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-6 text-center">
        <div className="text-4xl mb-4">🎧</div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          聽取日文，選出正確的中文意思
        </p>
        {/* Context hint */}
        {question!.context && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 mb-5">
            📍 {question!.context}
          </p>
        )}
        {/* Replay button */}
        <button
          onClick={replay}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full transition-colors tap-active shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          再播一次
        </button>

        {/* Reveal Japanese after answering */}
        {selected && (
          <p className="mt-5 text-lg font-medium text-gray-700 dark:text-gray-300">
            {question!.japanese}
          </p>
        )}
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-6">
        {question!.choices.map((choice) => {
          let style =
            "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm";
          if (selected) {
            if (choice === question!.correct) {
              style = colors.correct + " border";
            } else if (choice === selected) {
              style = colors.wrong + " border";
            } else {
              style = "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500";
            }
          }
          return (
            <button
              key={choice}
              onClick={() => answer(choice)}
              disabled={!!selected}
              className={`w-full text-left rounded-xl px-4 py-3.5 font-medium transition-all tap-active ${style}`}
            >
              <span>{choice}</span>
              {selected && choice === question!.correct && (
                <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
              )}
              {selected && choice === selected && choice !== question!.correct && (
                <span className="ml-2 text-red-500">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      {selected && (
        <button
          onClick={next}
          className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors tap-active"
        >
          {index + 1 >= total ? "查看結果" : "下一題 →"}
        </button>
      )}
    </div>
  );
}
