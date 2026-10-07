import { useState, useEffect, useMemo, useCallback } from "react";
import { recordAction } from "../lib/streak";

// ── Types ───────────────────────────────────────────────────────────────────

interface VocabItem {
  id: string;
  japanese: string;
  hiragana: string;
  simple_chinese: string;
  full_explanation: string;
  example_chinese: string;
}

interface VocabDataset {
  name: string;
  category: string;
  level: string;
  data: VocabItem[];
}

interface GrammarQuestion {
  id: string;
  sentence: string;
  answer: string;
  choices: string[];
  grammar: string;
  explanation: string;
}

interface GrammarQuizDataset {
  name: string;
  level: string;
  questions: GrammarQuestion[];
}

// ── Eagerly load all data via import.meta.glob ──────────────────────────────

const vocabModules = import.meta.glob<VocabDataset>(
  "../../data/n*_vocab.json",
  { eager: true, import: "default" }
);

const grammarModules = import.meta.glob<GrammarQuizDataset>(
  "../../data/grammar-quiz/grammar-quiz-*.json",
  { eager: true, import: "default" }
);

function getVocabByLevel(level: string): VocabItem[] {
  const lvl = level.toLowerCase();
  for (const [path, mod] of Object.entries(vocabModules)) {
    if (path.includes(`${lvl}_vocab`)) return mod.data ?? [];
  }
  return [];
}

function getGrammarByLevel(level: string): GrammarQuestion[] {
  const lvl = level.toLowerCase();
  for (const [path, mod] of Object.entries(grammarModules)) {
    if (path.includes(`grammar-quiz-${lvl}`)) return mod.questions ?? [];
  }
  return [];
}

type PracticeItem =
  | { type: "vocab"; data: VocabItem }
  | { type: "grammar"; data: GrammarQuestion };

type Level = "N5" | "N4" | "N3";

// ── Seeded random (same day = same questions) ───────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ── LocalStorage for daily completion ───────────────────────────────────────

const DAILY_KEY = "jp-learner:daily-practice";

interface DailyRecord {
  date: string;
  score: number;
  total: number;
  level: Level;
}

function loadDailyRecord(): DailyRecord | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const rec: DailyRecord = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    return rec.date === today ? rec : null;
  } catch {
    return null;
  }
}

function saveDailyRecord(rec: DailyRecord): void {
  localStorage.setItem(DAILY_KEY, JSON.stringify(rec));
}

// ── Speak helper ────────────────────────────────────────────────────────────

function speak(text: string, rate = 0.85) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "ja-JP";
  utt.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const ja = voices.find((v) => v.name.includes("Kyoko") && v.lang.startsWith("ja"))
    ?? voices.find((v) => v.name.includes("Google 日本語"))
    ?? voices.find((v) => v.lang.startsWith("ja"));
  if (ja) utt.voice = ja;
  window.speechSynthesis.speak(utt);
}

// ── Main Component ──────────────────────────────────────────────────────────

const VOCAB_COUNT = 10;
const GRAMMAR_COUNT = 10;
const TOTAL = VOCAB_COUNT + GRAMMAR_COUNT;

export default function DailyPracticePage() {
  const [level, setLevel] = useState<Level | null>(null);

  // Session state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  // Check if already completed today
  const [dailyRecord, setDailyRecord] = useState<DailyRecord | null>(() => loadDailyRecord());

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [level]);

  // Generate today's practice items (data loaded eagerly via import.meta.glob)
  const items: PracticeItem[] = useMemo(() => {
    if (!level) return [];
    const vocabPool = getVocabByLevel(level);
    const grammarPool = getGrammarByLevel(level);
    if (vocabPool.length === 0 || grammarPool.length === 0) return [];
    const rng = seededRng(dateSeed() + level.charCodeAt(1));
    const vocabs = shuffle(vocabPool, rng).slice(0, VOCAB_COUNT).map(
      (v): PracticeItem => ({ type: "vocab", data: v })
    );
    const grammars = shuffle(grammarPool, rng).slice(0, GRAMMAR_COUNT).map(
      (g): PracticeItem => ({ type: "grammar", data: g })
    );
    // Interleave: vocab, grammar, vocab, grammar...
    const mixed: PracticeItem[] = [];
    for (let i = 0; i < Math.max(vocabs.length, grammars.length); i++) {
      if (i < vocabs.length) mixed.push(vocabs[i]);
      if (i < grammars.length) mixed.push(grammars[i]);
    }
    return mixed;
  }, [level]);

  const current = items[currentIdx];

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= items.length) {
      setFinished(true);
      recordAction();
      const rec: DailyRecord = { date: new Date().toISOString().split("T")[0], score, total: TOTAL, level: level! };
      saveDailyRecord(rec);
      setDailyRecord(rec);
    } else {
      setCurrentIdx(currentIdx + 1);
      setRevealed(false);
      setSelectedChoice(null);
    }
  }, [currentIdx, items.length, score, level]);

  const handleVocabCorrect = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    handleNext();
  };

  const handleGrammarChoice = (choice: string) => {
    if (selectedChoice) return;
    setSelectedChoice(choice);
    const q = current!.data as GrammarQuestion;
    if (choice === q.answer) setScore((s) => s + 1);
  };

  // Reset for retry
  const handleRetry = () => {
    setCurrentIdx(0);
    setScore(0);
    setRevealed(false);
    setSelectedChoice(null);
    setFinished(false);
  };

  // ── Level selection screen ────────────────────────────────────────────────
  if (!level) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">每日練習</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">每天一組新題目：10 題單字 + 10 題文法</p>
        </div>

        {dailyRecord && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-semibold text-green-700 dark:text-green-300">今日已完成！</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {dailyRecord.level} — {dailyRecord.score}/{dailyRecord.total} 分
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {(["N5", "N4", "N3"] as const).map((lvl) => {
            const colors: Record<string, string> = {
              N5: "bg-green-500 hover:bg-green-600",
              N4: "bg-blue-500 hover:bg-blue-600",
              N3: "bg-purple-500 hover:bg-purple-600",
            };
            const icons: Record<string, string> = { N5: "🌱", N4: "📚", N3: "🎯" };
            return (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`${colors[lvl]} text-white rounded-2xl p-5 text-center transition-colors tap-active shadow-sm`}
              >
                <div className="text-3xl mb-2">{icons[lvl]}</div>
                <div className="text-lg font-bold">{lvl}</div>
                <div className="text-xs opacity-80 mt-1">開始練習</div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
          每天題目不同，同一天重複進入會是同一組題目
        </p>
      </div>
    );
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / TOTAL) * 100);
    const emoji = pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "💪" : "📖";
    return (
      <div className="text-center py-10">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">練習完成！</h2>
        <p className="text-4xl font-bold text-blue-500 mb-1">{score} / {TOTAL}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">正確率 {pct}%</p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors tap-active"
          >
            再練一次
          </button>
          <button
            onClick={() => { setLevel(null); handleRetry(); }}
            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-colors tap-active"
          >
            換級數
          </button>
        </div>
      </div>
    );
  }

  // ── Practice screen ───────────────────────────────────────────────────────
  const progress = ((currentIdx) / items.length) * 100;
  const isVocab = current.type === "vocab";
  const vocab = isVocab ? (current.data as VocabItem) : null;
  const grammar = !isVocab ? (current.data as GrammarQuestion) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLevel(null); handleRetry(); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            每日練習 · {level}
          </span>
        </div>
        <span className="text-sm font-bold text-blue-500">
          {currentIdx + 1} / {items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question type badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          isVocab
            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        }`}>
          {isVocab ? "單字" : "文法"}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          得分：{score}
        </span>
      </div>

      {/* ── Vocab Card ─────────────────────────────────────────────────────── */}
      {isVocab && vocab && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5">
          <div className="text-center mb-6">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{vocab.japanese}</p>
            <p className="text-lg text-gray-500 dark:text-gray-400">{vocab.hiragana}</p>
            <button
              onClick={() => speak(vocab.japanese)}
              className="mt-3 px-4 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 text-sm font-semibold tap-active"
            >
              🔊 發音
            </button>
          </div>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold transition-colors tap-active"
            >
              顯示答案
            </button>
          ) : (
            <div>
              <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-4 mb-4">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-1">{vocab.simple_chinese}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{vocab.full_explanation}</p>
                {vocab.example_chinese && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                    例：{vocab.example_chinese}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleVocabCorrect(false)}
                  className="py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold transition-colors tap-active border border-red-200 dark:border-red-800"
                >
                  不熟悉
                </button>
                <button
                  onClick={() => handleVocabCorrect(true)}
                  className="py-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 font-semibold transition-colors tap-active border border-green-200 dark:border-green-800"
                >
                  記得！
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Grammar Question ───────────────────────────────────────────────── */}
      {!isVocab && grammar && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-1 leading-relaxed">
            {grammar.sentence.split("___").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-block w-16 border-b-2 border-blue-400 mx-1" />
                )}
              </span>
            ))}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">{grammar.grammar}</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {grammar.choices.map((choice) => {
              let btnClass = "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
              if (selectedChoice) {
                if (choice === grammar.answer) {
                  btnClass = "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-400 dark:border-green-600";
                } else if (choice === selectedChoice && choice !== grammar.answer) {
                  btnClass = "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border-red-400 dark:border-red-600";
                }
              }
              return (
                <button
                  key={choice}
                  onClick={() => handleGrammarChoice(choice)}
                  disabled={!!selectedChoice}
                  className={`py-3 px-4 rounded-xl font-semibold text-base border-2 transition-colors tap-active ${btnClass}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {selectedChoice && (
            <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">{grammar.explanation}</p>
            </div>
          )}

          {selectedChoice && (
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors tap-active"
            >
              下一題
            </button>
          )}
        </div>
      )}
    </div>
  );
}
