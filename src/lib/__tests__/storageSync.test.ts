import { describe, it, expect, vi } from "vitest";
import {
  subscribeSyncNeeded,
  notifySyncNeeded,
  loadSyncMetadata,
  saveSyncMetadata,
  clearSyncMetadata,
  getAllStudyPlanKeys,
  getDatasetIdFromPlanKey,
  STORAGE_KEYS,
  saveProgress,
  saveSettings,
  saveTestModes,
  saveStudyPlan,
  clearStudyPlan,
  saveCustomData,
} from "../storage";
import type { SyncMetadata } from "../google/syncTypes";

describe("sync notification system", () => {
  it("should notify subscribers when notifySyncNeeded is called", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    notifySyncNeeded();
    expect(cb).toHaveBeenCalledTimes(1);

    notifySyncNeeded();
    expect(cb).toHaveBeenCalledTimes(2);

    unsub();
  });

  it("should unsubscribe correctly", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    unsub();
    notifySyncNeeded();
    expect(cb).not.toHaveBeenCalled();
  });

  it("should support multiple subscribers", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = subscribeSyncNeeded(cb1);
    const unsub2 = subscribeSyncNeeded(cb2);

    notifySyncNeeded();
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it("saveProgress should trigger sync notification", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    saveProgress({ "card-1": { cardId: "card-1", datasetId: "ds1", easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: "2025-01-01", lastRating: "good" } });
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
  });

  it("saveSettings should trigger sync notification", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    saveSettings({ defaultSessionSize: 20, showSwipeAssist: true });
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
  });

  it("saveTestModes should trigger sync notification", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    saveTestModes("vocabulary", "kanji-to-chinese");
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
  });

  it("saveStudyPlan should trigger sync notification", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    saveStudyPlan({ datasetId: "ds1", totalDays: 3, cardIds: [["a"], ["b"], ["c"]], createdAt: "2025-01-01" });
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
  });

  it("clearStudyPlan should trigger sync notification", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    clearStudyPlan("ds1");
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
  });

  it("saveCustomData should trigger sync notification", () => {
    const cb = vi.fn();
    const unsub = subscribeSyncNeeded(cb);

    saveCustomData({ datasets: {} });
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
  });
});

describe("sync metadata storage", () => {
  it("should save and load sync metadata", () => {
    const meta: SyncMetadata = {
      folderId: "folder-123",
      fileIds: { progress: "f1", settings: "f2" },
      lastSyncedAt: "2025-01-01T00:00:00Z",
      email: "user@test.com",
    };

    saveSyncMetadata(meta);
    const loaded = loadSyncMetadata();
    expect(loaded).toEqual(meta);
  });

  it("should return null when no metadata exists", () => {
    expect(loadSyncMetadata()).toBeNull();
  });

  it("should clear sync metadata", () => {
    saveSyncMetadata({
      folderId: "f",
      fileIds: {},
      lastSyncedAt: null,
      email: "test@test.com",
    });

    clearSyncMetadata();
    expect(loadSyncMetadata()).toBeNull();
  });
});

describe("study plan key enumeration", () => {
  it("should find all study plan keys", () => {
    localStorage.setItem("jp-learner:study-plan-ds1", "{}");
    localStorage.setItem("jp-learner:study-plan-ds2", "{}");
    localStorage.setItem("jp-learner:progress", "{}"); // should not be included

    const keys = getAllStudyPlanKeys();
    expect(keys).toHaveLength(2);
    expect(keys).toContain("jp-learner:study-plan-ds1");
    expect(keys).toContain("jp-learner:study-plan-ds2");
  });

  it("should return empty array when no plans exist", () => {
    expect(getAllStudyPlanKeys()).toHaveLength(0);
  });

  it("getDatasetIdFromPlanKey should extract dataset id", () => {
    expect(getDatasetIdFromPlanKey("jp-learner:study-plan-my-dataset")).toBe("my-dataset");
  });
});

describe("STORAGE_KEYS", () => {
  it("should have correct key values", () => {
    expect(STORAGE_KEYS.progress).toBe("jp-learner:progress");
    expect(STORAGE_KEYS.settings).toBe("jp-learner:settings");
    expect(STORAGE_KEYS.customData).toBe("jp-learner:custom-data");
    expect(STORAGE_KEYS.testMode).toBe("jp-learner:test-mode");
  });
});
