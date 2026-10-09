import { useState, useMemo, useCallback } from "react";
import type { GrammarLesson } from "../hooks/useGrammarLessons";
import { pickBestVoice } from "../lib/ttsVoice";

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

function ExampleRow({ ja, en }: { ja: string; en: string }) {
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);

  const speak = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(ja);
    utt.lang = "ja-JP";
    utt.rate = 0.9;
    const voice = pickBestVoice();
    if (voice) utt.voice = voice;
    setPlaying(true);
    utt.onend = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utt);
  }, [ja]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ja);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [ja]);

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-base text-gray-900 dark:text-gray-50 font-medium leading-relaxed">{ja}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{en}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
        <button
          onClick={speak}
          className={`p-1.5 rounded-lg transition-colors tap-active ${
            playing
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="播放"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        </button>
        <button
          onClick={copy}
          className={`p-1.5 rounded-lg transition-colors tap-active ${
            copied
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="複製"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
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
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-3">
          {grammar.examples.map((ex, i) => (
            <ExampleRow key={i} ja={ex.ja} en={ex.en} />
          ))}
        </div>
      )}
    </div>
  );
}
