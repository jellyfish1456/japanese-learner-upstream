import { useParams, useNavigate } from "react-router-dom";
import type { GrammarQuestion } from "../hooks/useGrammarSession";
import { useGrammarSession } from "../hooks/useGrammarSession";
import { useGrammarQuizByLevel } from "../hooks/useGrammarQuiz";

const levelColors: Record<string, { badge: string; correct: string; wrong: string; accent: string }> = {
  N5: {
    badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    correct: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300",
    wrong: "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
    accent: "bg-green-500",
  },
  N4: {
    badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    correct: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300",
    wrong: "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
    accent: "bg-blue-500",
  },
  N3: {
    badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    correct: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300",
    wrong: "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
    accent: "bg-purple-500",
  },
};

function SentenceDisplay({
  sentence,
  selected,
  answer,
}: {
  sentence: string;
  selected: string | null;
  answer: string;
}) {
  const parts = sentence.split("___");
  return (
    <p className="text-xl font-medium text-gray-900 dark:text-gray-50 leading-relaxed text-center">
      {parts[0]}
      <span
        className={`inline-block min-w-[3rem] px-2 mx-1 rounded border-b-2 text-center transition-colors ${
          selected
            ? selected === answer
              ? "text-green-600 dark:text-green-400 border-green-500"
              : "text-red-500 border-red-400"
            : "text-blue-500 border-blue-400"
        }`}
      >
        {selected ? answer : "　　"}
      </span>
      {parts[1]}
    </p>
  );
}

function QuizContent({ level, questions }: { level: string; questions: GrammarQuestion[] }) {
  const navigate = useNavigate();
  const colors = levelColors[level] ?? levelColors["N5"];
  const { question, index, total, selected, correct, done, answer, next } =
    useGrammarSession(questions, 20);

  if (done) {
    const pct = Math.round((correct / total) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">克漏字完成！</h2>
        <div className="text-5xl font-bold text-gray-900 dark:text-gray-50 my-4">
          {correct} / {total}
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8">正確率 {pct}%</p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/grammar/${level.toLowerCase()}`)}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            再測一次
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

  if (!question) return null;

  const progress = (index / total) * 100;

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
          {level}
        </span>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.accent} rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium tabular-nums">
          {index + 1} / {total}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 text-center">
          選出正確答案填入空格
        </p>
        <SentenceDisplay sentence={question.sentence} selected={selected} answer={question.answer} />
        {selected && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs font-bold text-blue-500 mb-1">📝 {question.grammar}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{question.explanation}</p>
          </div>
        )}
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {question.choices.map((choice) => {
          let style =
            "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 hover:border-gray-300 dark:hover:border-gray-600";
          if (selected) {
            if (choice === question.answer) {
              style = colors.correct + " border";
            } else if (choice === selected) {
              style = colors.wrong + " border";
            } else {
              style =
                "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500";
            }
          }
          return (
            <button
              key={choice}
              onClick={() => answer(choice)}
              disabled={!!selected}
              className={`rounded-xl px-4 py-3.5 font-medium text-center transition-all tap-active ${style}`}
            >
              {choice}
              {selected && choice === question.answer && (
                <span className="ml-1 text-green-600 dark:text-green-400">✓</span>
              )}
              {selected && choice === selected && choice !== question.answer && (
                <span className="ml-1 text-red-500">✗</span>
              )}
            </button>
          );
        })}
      </div>

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

export default function GrammarQuizPage() {
  const { level } = useParams<{ level: string }>();
  const upperLevel = (level ?? "").toUpperCase();
  const questions = useGrammarQuizByLevel(upperLevel);

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-3">📝</div>
        <p>找不到題目資料</p>
      </div>
    );
  }

  return <QuizContent key={upperLevel} level={upperLevel} questions={questions} />;
}
