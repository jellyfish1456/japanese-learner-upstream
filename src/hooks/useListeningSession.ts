import { useState, useEffect, useCallback, useRef } from "react";
import { useDialoguesByLevel } from "./useDialogues";
import type { DialogueLine } from "../types/dialogue";

export interface ListeningQuestion {
  japanese: string;
  correct: string;
  choices: string[]; // shuffled, 4 options
  context?: string;  // situation hint
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(
  lines: (DialogueLine & { situation?: string })[],
  count: number,
): ListeningQuestion[] {
  const pool = shuffle(lines).slice(0, count);
  const allChinese = lines.map((l) => l.chinese);

  return pool.map((line) => {
    const distractors = shuffle(
      allChinese.filter((c) => c !== line.chinese),
    ).slice(0, 3);
    const choices = shuffle([line.chinese, ...distractors]);
    return {
      japanese: line.japanese,
      correct: line.chinese,
      choices,
      context: line.situation,
    };
  });
}

export function useListeningSession(level: string, questionCount = 10, speed = 1.0) {
  const dialogues = useDialoguesByLevel(level);

  // Flatten all lines (attach situation as context)
  const allLines: (DialogueLine & { situation?: string })[] = dialogues.flatMap((d) =>
    d.lines.map((line) => ({ ...line, situation: d.situation })),
  );

  const [questions] = useState<ListeningQuestion[]>(() =>
    buildQuestions(allLines, Math.min(questionCount, allLines.length)),
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const question = questions[index] ?? null;
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speedRef = useRef<number>(speed);
  speedRef.current = speed;

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ja-JP";
    utt.rate = speedRef.current;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("ja"));
    if (voice) utt.voice = voice;
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, []);

  // Auto-play when question changes
  useEffect(() => {
    if (question && !selected) {
      // Small delay so voices load on first render
      const t = setTimeout(() => speak(question.japanese), 300);
      return () => clearTimeout(t);
    }
  }, [index, question, selected, speak]);

  const answer = useCallback(
    (choice: string) => {
      if (selected) return;
      setSelected(choice);
      if (choice === questions[index].correct) {
        setCorrect((c) => c + 1);
      }
    },
    [selected, index, questions],
  );

  const next = useCallback(() => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }, [index, questions.length]);

  const replay = useCallback(() => {
    if (question) speak(question.japanese);
  }, [question, speak]);

  return {
    question,
    index,
    total: questions.length,
    selected,
    correct,
    done,
    answer,
    next,
    replay,
  };
}
