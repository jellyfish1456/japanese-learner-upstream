import type { StudyPlan } from "../../types";

// ========== Auth Types ==========

export interface GoogleAuthState {
  accessToken: string;
  expiresAt: number; // Unix timestamp ms
  email: string;
}

// ========== Sync Status ==========

export type SyncStatus = "disconnected" | "idle" | "pulling" | "pushing" | "error";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null; // ISO date
  error: string | null;
  isConnected: boolean;
  email: string | null;
}

// ========== Data Keys ==========

export type SyncDataKey = "progress" | "custom-data" | "settings" | "test-modes" | "study-plans";

export const SYNC_FILE_NAMES: Record<SyncDataKey, string> = {
  "progress": "progress.json",
  "custom-data": "custom-data.json",
  "settings": "settings.json",
  "test-modes": "test-modes.json",
  "study-plans": "study-plans.json",
};

// ========== Drive Types ==========

export interface DriveFileInfo {
  fileId: string;
  name: string;
  modifiedTime: string;
}

export interface SyncMetadata {
  folderId: string;
  fileIds: Partial<Record<SyncDataKey, string>>;
  lastSyncedAt: string | null;
  email: string;
}

// ========== Study Plans Store ==========

/** Consolidated study plans for Drive storage */
export interface StudyPlansStore {
  [datasetId: string]: StudyPlan;
}

// ========== Constants ==========

export const DRIVE_FOLDER_NAME = "Japanese Learner";
export const GOOGLE_AUTH_KEY = "jp-learner:google-auth";
export const SYNC_META_KEY = "jp-learner:sync-meta";
