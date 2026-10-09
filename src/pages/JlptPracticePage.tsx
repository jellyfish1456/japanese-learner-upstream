import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recordAction } from "../lib/streak";

interface JlptQuestion {
  id: string;
  type: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  passageId?: string;
}

interface JlptPassage {
  id: string;
  title?: string;
  text: string;
}

interface JlptBank {
  level: string;
  passages?: JlptPassage[];
  questions: JlptQuestion[];
}

const bankModules = import.meta.glob<{ default: JlptBank }>(
  "../../data/jlpt-questions/*/*.json",
  { eager: true }
);

const TYPE_LABELS: Record<string, string> = {
  KANJI_READING: "漢字読み",
  ORTHOGRAPHY: "表記",
  CONTEXT: "文脈規定",
  PARAPHRASE: "言い換え類義",
  USAGE: "用法",
  GRAMMAR_FORM: "文法形式の判断",
  SENTENCE_ORDER: "文の組み立て",
  TEXT_GRAMMAR: "文章の文法",
  SHORT_PASSAGE: "内容理解（短文）",
  MID_PASSAGE: "内容理解（中文）",
  INFO_RETRIEVAL: "情報検索",
  LONG_PASSAGE: "内容理解（長文）",
};

const SECTION_LABELS: Record<string, string> = {
  vocabulary: "文字・語彙",
  grammar: "文法",
  reading: "読解",
};

const SECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  vocabulary: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  grammar: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  reading: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
};

function getSection(type: string): string {
  if (["KANJI_READING", "ORTHOGRAPHY", "CONTEXT", "PARAPHRASE", "USAGE", "WORD_FORMATION"].includes(type)) return "vocabulary";
  if (["GRAMMAR_FORM", "SENTENCE_ORDER", "TEXT_GRAMMAR"].includes(type)) return "grammar";
  return "reading";
}

function loadBank(level: string): { questions: JlptQuestion[]; passages: Map<string, JlptPassage> } {
  const questions: JlptQuestion[] = [];
  const passages = new Map<string, JlptPassage>();

  for (const [path, mod] of Object.entries(bankModules)) {
    if (!path.includes(`/${level}/`)) continue;
    if (path.includes("listening")) continue;
    const bank = (mod as { default: JlptBank }).default ?? (mod as unknown as JlptBank);
    if (bank.passages) {
      for (const p of bank.passages) passages.set(p.id, p);
    }
    questions.push(...bank.questions);
  }

  return { questions, passages };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderPrompt(html: string) {
  return <span dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, "<br/>") }} />;
}

const HISTORY_KEY = "jp-learner:jlpt-history";

interface JlptSession {
  date: string;
  time: string;
  level: string;
  section: string;
  score: number;
  total: number;
}

function loadJlptHistory(): JlptSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveJlptSession(s: JlptSession) {
  const h = loadJlptHistory();
  h.unshift(s);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 100)));
}

function LevelPicker() {
  const navigate = useNavigate();
  const levels = ["N5", "N4", "N3"];

  const history = useMemo(() => loadJlptHistory(), []);
  const levelColors = ["bg-green-500", "bg-blue-500", "bg-purple-500"];

  return (
    <div className="pb-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 tap-active"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">JLPT 模擬練習</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">選擇級別開始練習</p>
      </div>

      <div className="space-y-3 mb-8">
        {levels.map((lv, i) => (
          <button
            key={lv}
            onClick={() => navigate(`/jlpt/${lv.toLowerCase()}`)}
            className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 tap-active transition-colors hover:border-gray-300 dark:hover:border-gray-600"
          >
            <div className={`w-12 h-12 ${levelColors[i]} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
              {lv}
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-gray-900 dark:text-gray-50">{lv} 練習</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">文字・語彙 / 文法 / 読解</div>
            </div>
            <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">最近紀錄</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((s, i) => {
              const pct = Math.round((s.score / s.total) * 100);
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</span>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-50">
                        {s.level} {s.section} — {s.score}/{s.total}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{s.date} {s.time}</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionPicker({ level }: { level: string }) {
  const navigate = useNavigate();
  const { questions } = useMemo(() => loadBank(level), [level]);

  const sections = ["vocabulary", "grammar", "reading"] as const;
  const counts: Record<string, number> = {};
  for (const q of questions) {
    const s = getSection(q.type);
    counts[s] = (counts[s] || 0) + 1;
  }

  return (
    <div className="pb-12">
      <button
        onClick={() => navigate("/jlpt")}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 tap-active"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{level.toUpperCase()} 練習</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">選擇科目開始練習</p>
      </div>

      <div className="space-y-3">
        {sections.map((sec) => {
          const c = SECTION_COLORS[sec];
          return (
            <button
              key={sec}
              onClick={() => navigate(`/jlpt/${level}/${sec}`)}
              className={`w-full ${c.bg} rounded-xl border ${c.border} p-5 flex items-center justify-between tap-active transition-colors`}
            >
              <div className="text-left">
                <div className={`font-bold ${c.text}`}>{SECTION_LABELS[sec]}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{counts[sec] || 0} 題</div>
              </div>
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          );
        })}

        <button
          onClick={() => navigate(`/jlpt/${level}/all`)}
          className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5 flex items-center justify-between tap-active transition-colors"
        >
          <div className="text-left">
            <div className="font-bold text-amber-700 dark:text-amber-300">全科目混合</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{questions.length} 題（隨機 20 題）</div>
          </div>
          <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface AnswerRecord {
  question: JlptQuestion;
  selectedIdx: number;
  correct: boolean;
  passage?: JlptPassage;
}

function QuizSession({ level, section }: { level: string; section: string }) {
  const navigate = useNavigate();
  const { questions: allQ, passages } = useMemo(() => loadBank(level), [level]);

  const questions = useMemo(() => {
    let filtered = allQ;
    if (section !== "all") {
      filtered = allQ.filter((q) => getSection(q.type) === section);
    }
    const limit = section === "all" ? 20 : filtered.length;
    return shuffle(filtered).slice(0, limit);
  }, [allQ, section]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [done, setDone] = useState(false);
  const startTimeRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const savedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    savedRef.current = false;
  }, [questions]);

  const score = answers.filter((a) => a.correct).length;
  const q = questions[current];

  useEffect(() => {
    if (done && !savedRef.current) {
      savedRef.current = true;
      const sec = Math.round((Date.now() - startTimeRef.current) / 1000);
      setElapsed(sec);
      recordAction();
      const now = new Date();
      saveJlptSession({
        date: now.toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" }),
        time: now.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }),
        level: level.toUpperCase(),
        section: section === "all" ? "混合" : (SECTION_LABELS[section] || section),
        score,
        total: questions.length,
      });
    }
  }, [done, level, section, score, questions.length]);

  const handleSelect = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    const isCorrect = idx === q.answer;
    setAnswers((prev) => [
      ...prev,
      {
        question: q,
        selectedIdx: idx,
        correct: isCorrect,
        passage: q.passageId ? passages.get(q.passageId) : undefined,
      },
    ]);
  }, [selected, q, passages]);

  const handleNext = useCallback(() => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  }, [current, questions.length]);

  if (!q && !done) return null;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="pb-12">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
            {score} / {questions.length}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            正確率 {pct}% · 用時 {elapsed} 秒
          </p>
        </div>

        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">每題解說</h3>
        <div className="space-y-3 mb-8">
          {answers.map((a, i) => {
            const sec = getSection(a.question.type);
            const c = SECTION_COLORS[sec];
            return (
              <div key={i} className={`rounded-xl border-2 p-4 ${a.correct ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{a.correct ? "✅" : "❌"}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>
                    {TYPE_LABELS[a.question.type] || a.question.type}
                  </span>
                </div>

                {a.passage && (
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 mb-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                    {a.passage.title && <p className="font-bold mb-1">{a.passage.title}</p>}
                    {renderPrompt(a.passage.text)}
                  </div>
                )}

                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{renderPrompt(a.question.prompt)}</p>

                {!a.correct && (
                  <div className="mt-2 flex gap-4 text-xs">
                    <span><span className="text-red-500 font-bold">✗</span> {a.question.choices[a.selectedIdx]}</span>
                    <span><span className="text-green-600 dark:text-green-400 font-bold">✓</span> {a.question.choices[a.question.answer]}</span>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a.question.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(0)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors tap-active">
            再練一次
          </button>
          <button onClick={() => navigate(`/jlpt/${level}`)} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors tap-active">
            返回選題
          </button>
        </div>
      </div>
    );
  }

  const passage = q.passageId ? passages.get(q.passageId) : null;
  const sec = getSection(q.type);
  const c = SECTION_COLORS[sec];

  return (
    <div className="pb-12">
      <button
        onClick={() => navigate(`/jlpt/${level}`)}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 tap-active"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回
      </button>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{current + 1}/{questions.length}</span>
      </div>

      {/* Type tag */}
      <div className="mb-4">
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${c.bg} ${c.text}`}>
          {TYPE_LABELS[q.type] || q.type}
        </span>
      </div>

      {/* Passage (if any) */}
      {passage && (
        <div className="bg-amber-50 dark:bg-amber-900/15 rounded-xl border border-amber-200 dark:border-amber-800 p-4 mb-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed max-h-48 overflow-y-auto">
          {passage.title && <p className="font-bold mb-2 text-amber-700 dark:text-amber-300">{passage.title}</p>}
          {renderPrompt(passage.text)}
        </div>
      )}

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-50 leading-relaxed">
          {renderPrompt(q.prompt)}
        </p>
      </div>

      {/* Choices */}
      <div className="space-y-2">
        {q.choices.map((choice, idx) => {
          let bg = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
          if (selected !== null) {
            if (idx === q.answer) {
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
              <span className="text-sm text-gray-900 dark:text-gray-100">{choice}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/15 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.explanation}</p>
          <button
            onClick={handleNext}
            className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors tap-active"
          >
            {current + 1 >= questions.length ? "查看結果" : "下一題 →"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function JlptPracticePage() {
  const { level, section } = useParams<{ level?: string; section?: string }>();

  if (!level) return <LevelPicker />;
  if (!section) return <SectionPicker level={level} />;
  return <QuizSession level={level} section={section} />;
}
