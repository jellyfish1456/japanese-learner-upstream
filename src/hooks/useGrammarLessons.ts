export interface GrammarExample {
  ja: string;
  en: string;
}

export interface GrammarLesson {
  id: string;
  grammar: string;
  romaji: string;
  meaning: string;
  examples: GrammarExample[];
}

interface GrammarLessonDataset {
  default?: GrammarLesson[];
}

const lessonModules = import.meta.glob<GrammarLessonDataset>(
  "../../data/grammar-lessons/*.json",
  { eager: true },
);

function getLevelFromPath(path: string): string {
  const filename = path.split("/").pop() ?? "";
  const match = filename.match(/grammar-lessons-(n\d+)\.json/i);
  return match ? match[1].toUpperCase() : "";
}

const allLessons: { level: string; lessons: GrammarLesson[] }[] = Object.entries(lessonModules).map(
  ([path, mod]) => {
    const lessons = (mod as { default?: GrammarLesson[] }).default ?? (mod as unknown as GrammarLesson[]);
    return { level: getLevelFromPath(path), lessons: Array.isArray(lessons) ? lessons : [] };
  },
);

export function useGrammarLessonsByLevel(level: string): GrammarLesson[] {
  const ds = allLessons.find((d) => d.level.toLowerCase() === level.toLowerCase());
  return ds?.lessons ?? [];
}

export function useGrammarLessonLevels(): string[] {
  return allLessons.map((d) => d.level).sort();
}
