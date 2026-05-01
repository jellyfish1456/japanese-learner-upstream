import type { GrammarQuestion } from "./useGrammarSession";

interface GrammarQuizDataset {
  name: string;
  level: string;
  questions: GrammarQuestion[];
}

// Eagerly load all grammar quiz JSON files
const grammarModules = import.meta.glob<GrammarQuizDataset>(
  "../../data/grammar-quiz/*.json",
  { eager: true },
);

function getLevelFromPath(path: string): string {
  const filename = path.split("/").pop() ?? "";
  const match = filename.match(/grammar-quiz-(n\d+)\.json/i);
  return match ? match[1].toUpperCase() : "";
}

const allDatasets: (GrammarQuizDataset & { level: string })[] = Object.entries(grammarModules).map(
  ([path, mod]) => {
    const ds = (mod as { default?: GrammarQuizDataset }).default ?? (mod as GrammarQuizDataset);
    return { ...ds, level: getLevelFromPath(path) };
  }
);

export function useGrammarQuizByLevel(level: string): GrammarQuestion[] {
  const ds = allDatasets.find((d) => d.level.toLowerCase() === level.toLowerCase());
  return ds?.questions ?? [];
}
