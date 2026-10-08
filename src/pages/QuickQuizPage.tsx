import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { recordAction } from "../lib/streak";

interface VocabItem {
  id: string;
  japanese: string;
  hiragana: string;
  simple_chinese: string;
}

interface VocabDataset {
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
  questions: GrammarQuestion[];
}

const vocabModules = import.meta.glob<VocabDataset>(
  "../../data/n*_vocab.json",
  { eager: true, import: "default" }
);

const grammarModules = import.meta.glob<GrammarQuizDataset>(
  "../../data/grammar-quiz/grammar-quiz-*.json",
  { eager: true, import: "default" }
);

interface QuizQuestion {
  type: "vocab" | "grammar";
  question: string;
  hint?: string;
  choices: string[];
  correctIndex: number;
}

interface WrongRecord {
  type: "vocab" | "grammar";
  question: string;
  hint?: string;
  correctAnswer: string;
  yourAnswer: string;
}

interface QuizSession {
  date: string;
  time: string;
  score: number;
  total: number;
  elapsed: number;
  wrongs: WrongRecord[];
}

const HISTORY_KEY = "jp-learner:quick-quiz-history";

function loadHistory(): QuizSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSession(session: QuizSession) {
  const history = loadHistory();
  history.unshift(session);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(count: number): QuizQuestion[] {
  const allVocab: VocabItem[] = [];
  for (const mod of Object.values(vocabModules)) {
    allVocab.push(...mod.data);
  }

  const allGrammar: GrammarQuestion[] = [];
  for (const mod of Object.values(grammarModules)) {
    allGrammar.push(...mod.questions);
  }

  const questions: QuizQuestion[] = [];

  const vocabCount = Math.ceil(count / 2);
  const grammarCount = count - vocabCount;

  const pickedVocab = shuffle(allVocab).slice(0, vocabCount);
  for (const v of pickedVocab) {
    const wrong = shuffle(allVocab.filter((x) => x.id !== v.id))
      .slice(0, 3)
      .map((x) => x.simple_chinese);
    const choices = shuffle([v.simple_chinese, ...wrong]);
    questions.push({
      type: "vocab",
      question: v.japanese,
      hint: v.hiragana,
      choices,
      correctIndex: choices.indexOf(v.simple_chinese),
    });
  }

  const pickedGrammar = shuffle(allGrammar).slice(0, grammarCount);
  for (const g of pickedGrammar) {
    const choices = shuffle([...g.choices]);
    questions.push({
      type: "grammar",
      question: g.sentence,
      choices,
      correctIndex: choices.indexOf(g.answer),
    });
  }

  return shuffle(questions);
}

function HistoryView({ onStart }: { onStart: () => void }) {
  const [history] = useState(loadHistory);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="pb-12">
      <button
        onClick={onStart}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl p-5 flex items-center gap-4 transition-colors tap-active shadow-sm mb-6"
      >
        <div className="text-4xl">⚡</div>
        <div className="text-left">
          <div className="text-lg font-bold">開始速測 5 題</div>
          <div className="text-xs opacity-80 mt-0.5">隨機單字 + 文法，30 秒搞定</div>
        </div>
        <svg className="w-5 h-5 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm">還沒有測驗紀錄</p>
          <p className="text-xs mt-1">完成第一次速測就會出現在這裡</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">測驗紀錄</h2>
          {history.map((s, i) => {
            const perfect = s.score === s.total;
            const hasWrongs = s.wrongs.length > 0;
            const isExpanded = expandedIdx === i;
            return (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => hasWrongs ? setExpandedIdx(isExpanded ? null : i) : undefined}
                  className={`w-full p-4 text-left ${hasWrongs ? "tap-active" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{perfect ? "🎉" : s.score >= 3 ? "👍" : "💪"}</span>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-50">
                          {s.score} / {s.total}
                          <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-2">{s.elapsed}秒</span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{s.date} {s.time}</div>
                      </div>
                    </div>
                    {hasWrongs && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-400">{s.wrongs.length} 題錯</span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3 space-y-3">
                    {s.wrongs.map((w, wi) => (
                      <div key={wi} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400">
                            {w.type === "vocab" ? "單字" : "文法"}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{w.question}</p>
                        {w.hint && <p className="text-xs text-gray-400">{w.hint}</p>}
                        <div className="mt-2 flex gap-4 text-xs">
                          <div>
                            <span className="text-red-500">✗ 你的答案：</span>
                            <span className="text-gray-700 dark:text-gray-300">{w.yourAnswer}</span>
                          </div>
                          <div>
                            <span className="text-green-600 dark:text-green-400">✓ 正確答案：</span>
                            <span className="text-gray-700 dark:text-gray-300">{w.correctAnswer}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function QuickQuizPage() {
  const navigate = useNavigate();
  const [quizzing, setQuizzing] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wrongs, setWrongs] = useState<WrongRecord[]>([]);

  const startQuiz = useCallback(() => {
    setQuestions(buildQuestions(5));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setStartTime(Date.now());
    setElapsed(0);
    setWrongs([]);
    setQuizzing(true);
  }, []);

  const q = questions.length > 0 ? questions[current] : null;

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null || !q) return;
      setSelected(idx);
      if (idx === q.correctIndex) {
        setScore((s) => s + 1);
      } else {
        setWrongs((prev) => [
          ...prev,
          {
            type: q.type,
            question: q.question,
            hint: q.hint,
            correctAnswer: q.choices[q.correctIndex],
            yourAnswer: q.choices[idx],
          },
        ]);
      }
      setTimeout(() => {
        if (current + 1 >= questions.length) {
          setDone(true);
        } else {
          setCurrent((c) => c + 1);
          setSelected(null);
        }
      }, 800);
    },
    [selected, current, q, questions.length],
  );

  useEffect(() => {
    if (done) {
      const sec = Math.round((Date.now() - startTime) / 1000);
      setElapsed(sec);
      recordAction();
      const now = new Date();
      saveSession({
        date: now.toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" }),
        time: now.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }),
        score,
        total: questions.length,
        elapsed: sec,
        wrongs,
      });
    }
  }, [done]);

  if (!quizzing) {
    return (
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 tap-active"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          返回
        </button>
        <HistoryView onStart={startQuiz} />
      </div>
    );
  }

  if (!q) return null;

  if (done) {
    const perfect = score === questions.length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">{perfect ? "🎉" : score >= 3 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          {perfect ? "全對！" : `${score} / ${questions.length}`}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          用時 {elapsed} 秒
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          {perfect ? "太厲害了！" : score >= 3 ? "不錯喔，繼續加油！" : "多練幾次就會進步！"}
        </p>

        {wrongs.length > 0 && (
          <div className="w-full max-w-sm mb-6 text-left space-y-2">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wide text-center mb-2">錯題回顧</h3>
            {wrongs.map((w, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{w.question}</p>
                {w.hint && <p className="text-xs text-gray-400">{w.hint}</p>}
                <div className="mt-1 flex gap-4 text-xs">
                  <span><span className="text-red-500">✗</span> {w.yourAnswer}</span>
                  <span><span className="text-green-600 dark:text-green-400">✓</span> {w.correctAnswer}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={startQuiz}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors tap-active"
          >
            再來 5 題
          </button>
          <button
            onClick={() => setQuizzing(false)}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors tap-active"
          >
            查看紀錄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <button
        onClick={() => setQuizzing(false)}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 tap-active"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回
      </button>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
          {current + 1}/{questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {q.type === "vocab" ? "單字翻譯" : "文法填空"}
        </span>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-2 leading-relaxed">
          {q.question}
        </p>
        {q.hint && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{q.hint}</p>
        )}
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {q.choices.map((choice, idx) => {
          let bg = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
          if (selected !== null) {
            if (idx === q.correctIndex) {
              bg = "bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600";
            } else if (idx === selected) {
              bg = "bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600";
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-xl border-2 ${bg} transition-colors tap-active`}
            >
              <span className="text-base text-gray-900 dark:text-gray-100">{choice}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
