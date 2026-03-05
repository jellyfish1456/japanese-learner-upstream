import type { Dataset, DataItem, VocabItem, GrammarItem } from "../types";
import { loadCustomData, saveCustomData, generateId } from "../lib/storage";
import { isBuiltinDataset } from "./useDatasets";

// Re-export for convenience
export { isBuiltinDataset };

/**
 * Ensures a dataset is in custom storage (copies from built-in if needed).
 * Returns the dataset from custom store.
 */
function ensureCustomCopy(datasetId: string, builtinDataset: Dataset): Dataset {
  const store = loadCustomData();
  if (!store.datasets[datasetId]) {
    // Deep copy the built-in dataset into custom storage
    store.datasets[datasetId] = JSON.parse(JSON.stringify(builtinDataset));
    saveCustomData(store);
  }
  return store.datasets[datasetId];
}

export function useDatasetCrud() {
  // We don't actually need to call useDatasetById here since this is a hook
  // that returns functions. The functions will read fresh data each time.

  return {
    createDataset(name: string, category: "vocabulary" | "grammar", level: string): string {
      const id = generateId(`custom-${category}`);
      const store = loadCustomData();
      store.datasets[id] = { name, category, level, data: [] };
      saveCustomData(store);
      return id;
    },

    deleteDataset(datasetId: string): void {
      const store = loadCustomData();
      delete store.datasets[datasetId];
      saveCustomData(store);
    },

    updateDatasetMeta(datasetId: string, updates: { name?: string; level?: string }, builtinFallback?: Dataset): void {
      const store = loadCustomData();
      if (!store.datasets[datasetId] && builtinFallback) {
        ensureCustomCopy(datasetId, builtinFallback);
        // Re-read after copy
        const fresh = loadCustomData();
        Object.assign(fresh.datasets[datasetId], updates);
        saveCustomData(fresh);
        return;
      }
      if (store.datasets[datasetId]) {
        Object.assign(store.datasets[datasetId], updates);
        saveCustomData(store);
      }
    },

    addItem(datasetId: string, item: Omit<DataItem, "id">, builtinFallback?: Dataset): string {
      if (builtinFallback) {
        ensureCustomCopy(datasetId, builtinFallback);
      }
      const store = loadCustomData();
      const ds = store.datasets[datasetId];
      if (!ds) return "";
      const id = generateId("item");
      const newItem = { ...item, id } as DataItem;
      ds.data.push(newItem);
      saveCustomData(store);
      return id;
    },

    editItem(datasetId: string, itemId: string, updates: Partial<VocabItem> | Partial<GrammarItem>, builtinFallback?: Dataset): void {
      if (builtinFallback) {
        ensureCustomCopy(datasetId, builtinFallback);
      }
      const store = loadCustomData();
      const ds = store.datasets[datasetId];
      if (!ds) return;
      const idx = ds.data.findIndex((it) => it.id === itemId);
      if (idx !== -1) {
        ds.data[idx] = { ...ds.data[idx], ...updates, id: itemId } as DataItem;
        saveCustomData(store);
      }
    },

    deleteItem(datasetId: string, itemId: string, builtinFallback?: Dataset): void {
      if (builtinFallback) {
        ensureCustomCopy(datasetId, builtinFallback);
      }
      const store = loadCustomData();
      const ds = store.datasets[datasetId];
      if (!ds) return;
      ds.data = ds.data.filter((it) => it.id !== itemId);
      saveCustomData(store);
    },

    isCustomDataset(id: string): boolean {
      return !isBuiltinDataset(id) || !!loadCustomData().datasets[id];
    },

    hasCustomCopy(id: string): boolean {
      return !!loadCustomData().datasets[id];
    },

    resetToBuiltin(datasetId: string): void {
      if (!isBuiltinDataset(datasetId)) return;
      const store = loadCustomData();
      delete store.datasets[datasetId];
      saveCustomData(store);
    },
  };
}
