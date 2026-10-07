import { useState, useMemo } from "react";
import type { GrammarLesson } from "../hooks/useGrammarLessons";

interface GrammarLessonDataset {
  default?: GrammarLesson[];
}

const grammarModules = import.meta.glob<GrammarLessonDataset>(
  "../../data/grammar-lessons/*.json",
  { eager: true }
);

function getAllGrammar(): GrammarLesson[] {
  const all: GrammarLesson[] = [];
  for (const mod of Object.values(grammarModules)) {
    const lessons = (mod as { default?: GrammarLesson[] }).default ?? (mod as unknown as GrammarLesson[]);
    if (Array.isArray(lessons)) all.push(...lessons);
  }
  return all;
}

function getDayIndex(): number {
  const now = new Date();
  const start = new Date(2026, 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

const SEEN_KEY = "jp-learner:daily-grammar-seen";

function markSeen(id: string): void {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-200)));
    }
  } catch { /* ignore */ }
}

export default function DailyGrammar() {
  const [open, setOpen] = useState(false);

  const grammar = useMemo(() => {
    const all = getAllGrammar();
    if (all.length === 0) return null;
    const idx = getDayIndex() % all.length;
    return all[idx];
  }, []);

  if (!grammar) return null;

  const handleToggle = () => {
    if (!open) markSeen(grammar.id);
    setOpen(!open);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 mb-6">
      <button onClick={handleToggle} className="w-full text-left tap-active">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">今日一文法</span>
          </div>
          <svg
            className={`w-4 h-4 text-amber-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        <div className="mt-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-50">{grammar.grammar}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{grammar.romaji}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{grammar.meaning}</p>
      </button>

      {open && grammar.examples.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-2">
          {grammar.examples.map((ex, i) => (
            <div key={i}>
              <p className="text-sm text-gray-900 dark:text-gray-50 font-medium">{ex.ja}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{ex.en}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
