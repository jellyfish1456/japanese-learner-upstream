import type { DialogueDataset, DialogueItem } from "../types/dialogue";

// Eagerly load all dialogue JSON files from data/dialogues/
const dialogueModules = import.meta.glob<DialogueDataset>(
  "../../data/dialogues/*.json",
  { eager: true },
);

export interface LoadedDialogueDataset extends DialogueDataset {
  level: string;
}

function getLevelFromPath(path: string): string {
  const filename = path.split("/").pop() ?? "";
  // "dialogue-n5.json" → "N5"
  const match = filename.match(/dialogue-(n\d+)\.json/i);
  return match ? match[1].toUpperCase() : filename.replace(/\.json$/, "");
}

// Build dataset list once at module load — sorted N5 first (easiest → hardest)
const allDatasets: LoadedDialogueDataset[] = Object.entries(dialogueModules)
  .map(([path, mod]) => {
    const ds = (mod as { default?: DialogueDataset }).default ?? (mod as DialogueDataset);
    return { ...ds, level: getLevelFromPath(path) };
  })
  .sort((a, b) => b.level.localeCompare(a.level)); // N5 → N4 → N3

export function useDialogueDatasets(): LoadedDialogueDataset[] {
  return allDatasets;
}

export function useDialoguesByLevel(level: string): DialogueItem[] {
  const ds = allDatasets.find((d) => d.level.toLowerCase() === level.toLowerCase());
  return ds?.dialogues ?? [];
}

export function useDialogueById(level: string, id: string): DialogueItem | undefined {
  const ds = allDatasets.find((d) => d.level.toLowerCase() === level.toLowerCase());
  return ds?.dialogues.find((d) => d.id === id);
}

export function useDialogueDatasetByLevel(level: string): LoadedDialogueDataset | undefined {
  return allDatasets.find((d) => d.level.toLowerCase() === level.toLowerCase());
}
