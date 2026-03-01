import type { ProgressStore, StudyPlan } from "../types";

const PROGRESS_KEY = "jp-learner:progress";
const SETTINGS_KEY = "jp-learner:settings";

// ========== Progress ==========

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressStore): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ========== Settings ==========

export interface AppSettings {
  defaultSessionSize: number;
  showSwipeAssist: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultSessionSize: 20,
  showSwipeAssist: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ========== Progress Key Helpers (multi-mode) ==========

export function makeProgressKey(cardId: string, mode?: string): string {
  return mode ? `${cardId}::${mode}` : cardId;
}

export function parseProgressKey(key: string): { cardId: string; mode?: string } {
  const idx = key.indexOf("::");
  if (idx === -1) return { cardId: key };
  return { cardId: key.slice(0, idx), mode: key.slice(idx + 2) };
}

// ========== Test Mode Preference ==========

const TEST_MODE_KEY = "jp-learner:test-mode";

export function loadTestModes(category: "vocabulary" | "grammar"): string | string[] | null {
  try {
    const raw = localStorage.getItem(TEST_MODE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const val = stored[category];
    if (val == null) return null;
    // Backward compatible: old string values still load correctly
    return val;
  } catch {
    return null;
  }
}

export function saveTestModes(category: "vocabulary" | "grammar", modes: string | string[]): void {
  try {
    const raw = localStorage.getItem(TEST_MODE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[category] = modes;
    localStorage.setItem(TEST_MODE_KEY, JSON.stringify(stored));
  } catch {
    // ignore
  }
}

/** @deprecated Use loadTestModes instead */
export const loadTestMode = (category: "vocabulary" | "grammar"): string | null => {
  const val = loadTestModes(category);
  if (Array.isArray(val)) return val[0] ?? null;
  return val;
};

/** @deprecated Use saveTestModes instead */
export const saveTestMode = (category: "vocabulary" | "grammar", mode: string): void => {
  saveTestModes(category, mode);
};

// ========== Study Plan ==========

function studyPlanKey(datasetId: string): string {
  return `jp-learner:study-plan-${datasetId}`;
}

export function loadStudyPlan(datasetId: string): StudyPlan | null {
  try {
    const raw = localStorage.getItem(studyPlanKey(datasetId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudyPlan(plan: StudyPlan): void {
  localStorage.setItem(studyPlanKey(plan.datasetId), JSON.stringify(plan));
}

export function clearStudyPlan(datasetId: string): void {
  localStorage.removeItem(studyPlanKey(datasetId));
}
