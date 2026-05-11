import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGrammarLessonsByLevel, type GrammarLesson } from "../hooks/useGrammarLessons";

function GrammarCard({ lesson }: { lesson: GrammarLesson }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-start gap-3 tap-active"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-50">
              {lesson.grammar}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {lesson.romaji}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
            {lesson.meaning}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4">
          {lesson.examples.length > 0 ? (
            <div className="space-y-3 pt-3">
              {lesson.examples.map((ex, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-50 font-medium leading-relaxed">
                      {ex.ja}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {ex.en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 pt-3 italic">
              例文準備中...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function GrammarLessonPage() {
  const { level = "n5" } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const lessons = useGrammarLessonsByLevel(level);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return lessons;
    const q = search.trim().toLowerCase();
    return lessons.filter(
      (l) =>
        l.grammar.toLowerCase().includes(q) ||
        l.romaji.toLowerCase().includes(q) ||
        l.meaning.toLowerCase().includes(q),
    );
  }, [lessons, search]);

  const levelUpper = level.toUpperCase();
  const levelColors: Record<string, { bg: string; text: string; ring: string }> = {
    N5: { bg: "bg-green-500", text: "text-green-600 dark:text-green-400", ring: "ring-green-200 dark:ring-green-800" },
    N4: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-200 dark:ring-blue-800" },
    N3: { bg: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-200 dark:ring-purple-800" },
  };
  const color = levelColors[levelUpper] ?? levelColors.N5;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        首頁
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${color.bg} text-white text-xs font-bold px-2 py-0.5 rounded-lg`}>
            {levelUpper}
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">文法辭典</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          共 {lessons.length} 個文法，點擊展開例句
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋文法、羅馬拼音或英文意思..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
        />
      </div>

      {/* Level tabs */}
      <div className="flex gap-2 mb-4">
        {(["N5", "N4", "N3"] as const).map((lvl) => {
          const isActive = levelUpper === lvl;
          const tabColors: Record<string, string> = {
            N5: isActive ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
            N4: isActive ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
            N3: isActive ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
          };
          return (
            <button
              key={lvl}
              onClick={() => navigate(`/grammar-lessons/${lvl.toLowerCase()}`)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tabColors[lvl]}`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📖</div>
          <p>沒有找到符合的文法</p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((lesson) => (
            <GrammarCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
