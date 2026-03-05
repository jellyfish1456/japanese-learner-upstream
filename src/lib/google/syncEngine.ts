import type { SyncMetadata, SyncDataKey, StudyPlansStore } from "./syncTypes";
import { SYNC_FILE_NAMES } from "./syncTypes";
import {
  ensureAppFolder,
  listAppFiles,
  readJsonFile,
  createJsonFile,
  updateJsonFile,
  DriveApiError,
} from "./driveApi";
import {
  STORAGE_KEYS,
  getAllStudyPlanKeys,
  getDatasetIdFromPlanKey,
  saveSyncMetadata,
  STUDY_PLAN_PREFIX,
} from "../storage";
import type { ProgressStore, CustomDataStore, StudyPlan } from "../../types";
import type { AppSettings } from "../storage";

// ========== Study Plans Consolidation ==========

export function collectStudyPlans(): StudyPlansStore {
  const store: StudyPlansStore = {};
  for (const key of getAllStudyPlanKeys()) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const plan: StudyPlan = JSON.parse(raw);
        const datasetId = getDatasetIdFromPlanKey(key);
        store[datasetId] = plan;
      }
    } catch {
      // skip corrupt entries
    }
  }
  return store;
}

export function distributeStudyPlans(store: StudyPlansStore): void {
  // Clear all existing plan keys
  for (const key of getAllStudyPlanKeys()) {
    localStorage.removeItem(key);
  }
  // Write from cloud data
  for (const [datasetId, plan] of Object.entries(store)) {
    localStorage.setItem(
      `${STUDY_PLAN_PREFIX}${datasetId}`,
      JSON.stringify(plan),
    );
  }
}

// ========== Data Key to localStorage Mapping ==========

const LOCAL_DATA_DEFAULTS: Record<SyncDataKey, unknown> = {
  "progress": {},
  "custom-data": { datasets: {} },
  "settings": {},
  "test-modes": {},
  "study-plans": {},
};

function readLocalData(key: SyncDataKey): unknown {
  if (key === "study-plans") return collectStudyPlans();
  const storageKey =
    key === "progress" ? STORAGE_KEYS.progress :
    key === "custom-data" ? STORAGE_KEYS.customData :
    key === "settings" ? STORAGE_KEYS.settings :
    STORAGE_KEYS.testMode;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : LOCAL_DATA_DEFAULTS[key];
  } catch {
    return LOCAL_DATA_DEFAULTS[key];
  }
}

function writeLocalData(key: SyncDataKey, data: unknown): void {
  switch (key) {
    case "progress":
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(data as ProgressStore));
      break;
    case "custom-data":
      localStorage.setItem(STORAGE_KEYS.customData, JSON.stringify(data as CustomDataStore));
      break;
    case "settings":
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data as AppSettings));
      break;
    case "test-modes":
      localStorage.setItem(STORAGE_KEYS.testMode, JSON.stringify(data));
      break;
    case "study-plans":
      distributeStudyPlans(data as StudyPlansStore);
      break;
  }
}

// ========== Pull from Drive ==========

export async function pullFromDrive(
  token: string,
  meta: SyncMetadata,
): Promise<SyncMetadata> {
  const folderId = meta.folderId || (await ensureAppFolder(token));
  const files = await listAppFiles(token, folderId);

  // Build fileId map from existing files
  const updatedMeta: SyncMetadata = {
    ...meta,
    folderId,
    fileIds: { ...meta.fileIds },
  };

  const fileNameToKey: Record<string, SyncDataKey> = {};
  for (const [key, name] of Object.entries(SYNC_FILE_NAMES)) {
    fileNameToKey[name] = key as SyncDataKey;
  }

  // Stage all cloud data first, then commit atomically
  const staged: { key: SyncDataKey; fileId: string; data: unknown }[] = [];
  for (const file of files) {
    const dataKey = fileNameToKey[file.name];
    if (!dataKey) continue;
    const data = await readJsonFile(token, file.fileId);
    staged.push({ key: dataKey, fileId: file.fileId, data });
  }

  // Commit: write all staged data to localStorage
  const pulledKeys = new Set<SyncDataKey>();
  for (const { key, fileId, data } of staged) {
    updatedMeta.fileIds[key] = fileId;
    writeLocalData(key, data);
    pulledKeys.add(key);
  }

  // Reset keys not found on cloud to defaults ("覆蓋本機所有資料")
  for (const key of Object.keys(SYNC_FILE_NAMES) as SyncDataKey[]) {
    if (!pulledKeys.has(key)) {
      writeLocalData(key, LOCAL_DATA_DEFAULTS[key]);
      delete updatedMeta.fileIds[key];
    }
  }

  updatedMeta.lastSyncedAt = new Date().toISOString();
  saveSyncMetadata(updatedMeta);
  return updatedMeta;
}

// ========== Push to Drive ==========

export async function pushToDrive(
  token: string,
  meta: SyncMetadata,
): Promise<SyncMetadata> {
  const folderId = meta.folderId || (await ensureAppFolder(token));

  const updatedMeta: SyncMetadata = {
    ...meta,
    folderId,
    fileIds: { ...meta.fileIds },
  };

  for (const [key, fileName] of Object.entries(SYNC_FILE_NAMES)) {
    const dataKey = key as SyncDataKey;
    const data = readLocalData(dataKey);
    const existingFileId = updatedMeta.fileIds[dataKey];

    if (existingFileId) {
      try {
        await updateJsonFile(token, existingFileId, data);
      } catch (err) {
        // If file was deleted from Drive (404), recreate it
        if (err instanceof DriveApiError && err.status === 404) {
          const newFileId = await createJsonFile(token, folderId, fileName, data);
          updatedMeta.fileIds[dataKey] = newFileId;
        } else {
          throw err;
        }
      }
    } else {
      const newFileId = await createJsonFile(token, folderId, fileName, data);
      updatedMeta.fileIds[dataKey] = newFileId;
    }
  }

  updatedMeta.lastSyncedAt = new Date().toISOString();
  saveSyncMetadata(updatedMeta);
  return updatedMeta;
}

// ========== Initial Sync (first connect) ==========

export async function initialSync(
  token: string,
  email: string,
): Promise<SyncMetadata> {
  const folderId = await ensureAppFolder(token);
  const meta: SyncMetadata = {
    folderId,
    fileIds: {},
    lastSyncedAt: null,
    email,
  };

  // Pull first (nothing on cloud initially, but safe)
  const afterPull = await pullFromDrive(token, meta);
  // Then push local data
  return pushToDrive(token, afterPull);
}

// ========== Auto-Push Debouncer ==========

export function createAutoPushDebouncer(
  pushFn: () => void,
  delayMs: number = 30_000,
): { trigger: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    trigger: () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        pushFn();
      }, delayMs);
    },
    cancel: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
