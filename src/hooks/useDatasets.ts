import { useSyncExternalStore } from "react";
import type { Dataset, DatasetMeta } from "../types";
import { loadProgress, loadCustomData, subscribeCustomData, getCustomDataSnapshot } from "../lib/storage";
import { getDatasetStats } from "../lib/stats";

// Eagerly import all JSON files from the data directory (synchronous)
const dataModules = import.meta.glob<Dataset>("../../data/*.json", { eager: true });

function getDatasetId(path: string): string {
  // "../../data/vocab-n3.json" → "vocab-n3"
  const filename = path.split("/").pop() ?? "";
  return filename.replace(/\.json$/, "");
}

export interface LoadedDataset extends Dataset {
  id: string;
  isCustom?: boolean;
}

// Build the built-in dataset list once at module load time (synchronous)
const builtinDatasets: LoadedDataset[] = Object.entries(dataModules).map(([path, mod]) => {
  const ds = (mod as { default?: Dataset }).default ?? (mod as Dataset);
  return {
    ...ds,
    id: getDatasetId(path),
  };
});

/** Set of built-in dataset IDs for quick lookup */
const builtinIds = new Set(builtinDatasets.map((ds) => ds.id));

export function isBuiltinDataset(id: string): boolean {
  return builtinIds.has(id);
}

function getMergedDatasets(): LoadedDataset[] {
  const customStore = loadCustomData();
  const customIds = new Set(Object.keys(customStore.datasets));

  // For each built-in dataset: use custom copy if it exists, otherwise use built-in
  const merged: LoadedDataset[] = builtinDatasets.map((ds) => {
    if (customIds.has(ds.id)) {
      return { ...customStore.datasets[ds.id], id: ds.id, isCustom: true };
    }
    return ds;
  });

  // Add purely custom datasets (IDs not in built-in set)
  for (const [id, ds] of Object.entries(customStore.datasets)) {
    if (!builtinIds.has(id)) {
      merged.push({ ...ds, id, isCustom: true });
    }
  }

  return merged;
}

export function useDatasets(): LoadedDataset[] {
  // Re-render when custom data changes
  useSyncExternalStore(subscribeCustomData, getCustomDataSnapshot);
  return getMergedDatasets();
}

export function useDatasetById(id: string): LoadedDataset | undefined {
  useSyncExternalStore(subscribeCustomData, getCustomDataSnapshot);
  return getMergedDatasets().find((ds) => ds.id === id);
}

export function useDatasetMetas(
  categoryFilter?: string,
  levelFilter?: string,
): DatasetMeta[] {
  useSyncExternalStore(subscribeCustomData, getCustomDataSnapshot);

  // Always reads fresh progress from localStorage
  // so that due counts update after study sessions.
  const progress = loadProgress();
  const allDatasets = getMergedDatasets();

  return allDatasets
    .filter((ds) => {
      if (categoryFilter && ds.category !== categoryFilter) return false;
      if (levelFilter && ds.level !== levelFilter) return false;
      return true;
    })
    .map((ds) => {
      const stats = getDatasetStats(ds.data, progress);
      return {
        id: ds.id,
        name: ds.name,
        category: ds.category,
        level: ds.level,
        totalCards: stats.totalCards,
        dueCards: stats.dueCards,
        learnedCards: stats.learnedCards,
        masteredCards: stats.masteredCards,
      };
    });
}
