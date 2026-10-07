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

  // Half vocab, half grammar (round up vocab)
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

export default function QuickQuizPage() {
  const navigate = useNavigate();
  const questions = useMemo(() => buildQuestions(5), []);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (done) {
      setElapsed(Math.round((Date.now() - startTime) / 1000));
      recordAction();
    }
  }, [done, startTime]);

  const q = questions[current];

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);
      if (idx === q.correctIndex) {
        setScore((s) => s + 1);
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
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {perfect ? "太厲害了！" : score >= 3 ? "不錯喔，繼續加油！" : "多練幾次就會進步！"}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(0)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors tap-active"
          >
            再來 5 題
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors tap-active"
          >
            回首頁
          </button>
        </div>
      </div>
    );
  }

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
