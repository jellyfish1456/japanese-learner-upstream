import { useState, useCallback } from "react";

export interface GrammarQuestion {
  id: string;
  sentence: string;   // contains ___ as blank
  answer: string;
  choices: string[];
  grammar: string;
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useGrammarSession(questions: GrammarQuestion[], count = 20) {
  const [sessionQuestions] = useState<GrammarQuestion[]>(() =>
    shuffle(questions).slice(0, Math.min(count, questions.length)).map((q) => ({
      ...q,
      choices: shuffle(q.choices),
    }))
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const question = sessionQuestions[index] ?? null;

  const answer = useCallback(
    (choice: string) => {
      if (selected) return;
      setSelected(choice);
      if (choice === sessionQuestions[index].answer) {
        setCorrect((c) => c + 1);
      }
    },
    [selected, index, sessionQuestions]
  );

  const next = useCallback(() => {
    if (index + 1 >= sessionQuestions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }, [index, sessionQuestions.length]);

  return {
    question,
    index,
    total: sessionQuestions.length,
    selected,
    correct,
    done,
    answer,
    next,
  };
}
