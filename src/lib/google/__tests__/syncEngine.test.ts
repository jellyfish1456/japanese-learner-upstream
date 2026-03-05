import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  collectStudyPlans,
  distributeStudyPlans,
  pullFromDrive,
  pushToDrive,
  initialSync,
  createAutoPushDebouncer,
} from "../syncEngine";
import type { SyncMetadata } from "../syncTypes";

// Mock driveApi
vi.mock("../driveApi", () => ({
  ensureAppFolder: vi.fn().mockResolvedValue("folder-abc"),
  listAppFiles: vi.fn().mockResolvedValue([]),
  readJsonFile: vi.fn().mockResolvedValue({}),
  createJsonFile: vi.fn().mockResolvedValue("new-file-id"),
  updateJsonFile: vi.fn().mockResolvedValue(undefined),
}));

import {
  ensureAppFolder,
  listAppFiles,
  readJsonFile,
  createJsonFile,
  updateJsonFile,
} from "../driveApi";

const mockedEnsureAppFolder = vi.mocked(ensureAppFolder);
const mockedListAppFiles = vi.mocked(listAppFiles);
const mockedReadJsonFile = vi.mocked(readJsonFile);
const mockedCreateJsonFile = vi.mocked(createJsonFile);
const mockedUpdateJsonFile = vi.mocked(updateJsonFile);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("collectStudyPlans", () => {
  it("should collect all study plan keys into a single object", () => {
    localStorage.setItem(
      "jp-learner:study-plan-ds1",
      JSON.stringify({ datasetId: "ds1", totalDays: 3, cardIds: [["a"], ["b"], ["c"]], createdAt: "2025-01-01" }),
    );
    localStorage.setItem(
      "jp-learner:study-plan-ds2",
      JSON.stringify({ datasetId: "ds2", totalDays: 0, cardIds: [["x", "y"]], createdAt: "2025-01-02" }),
    );

    const plans = collectStudyPlans();
    expect(Object.keys(plans)).toHaveLength(2);
    expect(plans["ds1"].totalDays).toBe(3);
    expect(plans["ds2"].totalDays).toBe(0);
  });

  it("should return empty object when no plans exist", () => {
    const plans = collectStudyPlans();
    expect(plans).toEqual({});
  });

  it("should skip corrupt entries", () => {
    localStorage.setItem("jp-learner:study-plan-good", JSON.stringify({ datasetId: "good", totalDays: 1, cardIds: [[]], createdAt: "2025-01-01" }));
    localStorage.setItem("jp-learner:study-plan-bad", "not-json{{{");

    const plans = collectStudyPlans();
    expect(Object.keys(plans)).toHaveLength(1);
    expect(plans["good"]).toBeDefined();
  });
});

describe("distributeStudyPlans", () => {
  it("should clear existing plans and write new ones", () => {
    // Pre-existing plan that should be cleared
    localStorage.setItem("jp-learner:study-plan-old", JSON.stringify({ datasetId: "old" }));

    const store = {
      ds1: { datasetId: "ds1", totalDays: 2, cardIds: [["a"], ["b"]], createdAt: "2025-01-01" },
      ds2: { datasetId: "ds2", totalDays: 0, cardIds: [["x"]], createdAt: "2025-01-02" },
    };

    distributeStudyPlans(store);

    expect(localStorage.getItem("jp-learner:study-plan-old")).toBeNull();
    expect(JSON.parse(localStorage.getItem("jp-learner:study-plan-ds1")!).totalDays).toBe(2);
    expect(JSON.parse(localStorage.getItem("jp-learner:study-plan-ds2")!).totalDays).toBe(0);
  });
});

describe("pullFromDrive", () => {
  it("should download files and write to localStorage", async () => {
    const meta: SyncMetadata = { folderId: "folder-abc", fileIds: {}, lastSyncedAt: null, email: "test@test.com" };

    mockedListAppFiles.mockResolvedValueOnce([
      { fileId: "f1", name: "progress.json", modifiedTime: "2025-01-01T00:00:00Z" },
      { fileId: "f2", name: "settings.json", modifiedTime: "2025-01-01T00:00:00Z" },
    ]);
    mockedReadJsonFile
      .mockResolvedValueOnce({ "card-1": { cardId: "card-1", interval: 5 } })
      .mockResolvedValueOnce({ defaultSessionSize: 30, showSwipeAssist: false });

    const updated = await pullFromDrive("token", meta);

    expect(mockedListAppFiles).toHaveBeenCalledWith("token", "folder-abc");
    expect(mockedReadJsonFile).toHaveBeenCalledTimes(2);
    expect(updated.fileIds["progress"]).toBe("f1");
    expect(updated.fileIds["settings"]).toBe("f2");
    expect(updated.lastSyncedAt).toBeTruthy();

    // Verify localStorage was written
    const progress = JSON.parse(localStorage.getItem("jp-learner:progress")!);
    expect(progress["card-1"].interval).toBe(5);
    const settings = JSON.parse(localStorage.getItem("jp-learner:settings")!);
    expect(settings.defaultSessionSize).toBe(30);
  });

  it("should ensure folder if folderId is empty", async () => {
    const meta: SyncMetadata = { folderId: "", fileIds: {}, lastSyncedAt: null, email: "test@test.com" };
    mockedListAppFiles.mockResolvedValueOnce([]);

    const updated = await pullFromDrive("token", meta);
    expect(mockedEnsureAppFolder).toHaveBeenCalledWith("token");
    expect(updated.folderId).toBe("folder-abc");
  });

  it("should reset missing cloud keys to defaults", async () => {
    // Pre-populate all 5 localStorage keys with non-default data
    localStorage.setItem("jp-learner:progress", JSON.stringify({ "c1": { cardId: "c1" } }));
    localStorage.setItem("jp-learner:custom-data", JSON.stringify({ datasets: { ds1: { id: "ds1" } } }));
    localStorage.setItem("jp-learner:settings", JSON.stringify({ defaultSessionSize: 50 }));
    localStorage.setItem("jp-learner:test-mode", JSON.stringify({ ds1: ["kanji-to-chinese"] }));
    localStorage.setItem("jp-learner:study-plan-ds1", JSON.stringify({ datasetId: "ds1", totalDays: 3, cardIds: [["a"]], createdAt: "2025-01-01" }));

    const meta: SyncMetadata = {
      folderId: "folder-abc",
      fileIds: {
        "progress": "old-f1",
        "custom-data": "old-f2",
        "settings": "old-f3",
        "test-modes": "old-f4",
        "study-plans": "old-f5",
      },
      lastSyncedAt: null,
      email: "test@test.com",
    };

    // Cloud only has progress and settings
    mockedListAppFiles.mockResolvedValueOnce([
      { fileId: "f1", name: "progress.json", modifiedTime: "2025-01-01T00:00:00Z" },
      { fileId: "f2", name: "settings.json", modifiedTime: "2025-01-01T00:00:00Z" },
    ]);
    mockedReadJsonFile
      .mockResolvedValueOnce({ "c2": { cardId: "c2" } })
      .mockResolvedValueOnce({ defaultSessionSize: 30 });

    const updated = await pullFromDrive("token", meta);

    // Pulled keys should have cloud data
    expect(updated.fileIds["progress"]).toBe("f1");
    expect(updated.fileIds["settings"]).toBe("f2");
    expect(JSON.parse(localStorage.getItem("jp-learner:progress")!)).toEqual({ "c2": { cardId: "c2" } });
    expect(JSON.parse(localStorage.getItem("jp-learner:settings")!)).toEqual({ defaultSessionSize: 30 });

    // Missing keys should be reset to defaults and fileIds cleared
    expect(updated.fileIds["custom-data"]).toBeUndefined();
    expect(updated.fileIds["test-modes"]).toBeUndefined();
    expect(updated.fileIds["study-plans"]).toBeUndefined();
    expect(JSON.parse(localStorage.getItem("jp-learner:custom-data")!)).toEqual({ datasets: {} });
    expect(JSON.parse(localStorage.getItem("jp-learner:test-mode")!)).toEqual({});
    // Study plans should be cleared (no plan keys left)
    expect(localStorage.getItem("jp-learner:study-plan-ds1")).toBeNull();
  });

  it("should ignore unknown files", async () => {
    const meta: SyncMetadata = { folderId: "folder-abc", fileIds: {}, lastSyncedAt: null, email: "test@test.com" };
    mockedListAppFiles.mockResolvedValueOnce([
      { fileId: "f99", name: "unknown-file.json", modifiedTime: "2025-01-01T00:00:00Z" },
    ]);

    await pullFromDrive("token", meta);
    expect(mockedReadJsonFile).not.toHaveBeenCalled();
  });
});

describe("pushToDrive", () => {
  it("should create new files when fileIds are empty", async () => {
    const meta: SyncMetadata = { folderId: "folder-abc", fileIds: {}, lastSyncedAt: null, email: "test@test.com" };

    localStorage.setItem("jp-learner:progress", JSON.stringify({ "c1": { cardId: "c1" } }));
    localStorage.setItem("jp-learner:settings", JSON.stringify({ defaultSessionSize: 20 }));

    const updated = await pushToDrive("token", meta);

    // Should have created 5 files (one per sync data key)
    expect(mockedCreateJsonFile).toHaveBeenCalledTimes(5);
    expect(mockedUpdateJsonFile).not.toHaveBeenCalled();
    expect(updated.lastSyncedAt).toBeTruthy();

    // Verify all file IDs are stored
    expect(updated.fileIds["progress"]).toBe("new-file-id");
    expect(updated.fileIds["settings"]).toBe("new-file-id");
  });

  it("should update existing files when fileIds are present", async () => {
    const meta: SyncMetadata = {
      folderId: "folder-abc",
      fileIds: {
        "progress": "existing-f1",
        "custom-data": "existing-f2",
        "settings": "existing-f3",
        "test-modes": "existing-f4",
        "study-plans": "existing-f5",
      },
      lastSyncedAt: null,
      email: "test@test.com",
    };

    await pushToDrive("token", meta);

    expect(mockedUpdateJsonFile).toHaveBeenCalledTimes(5);
    expect(mockedCreateJsonFile).not.toHaveBeenCalled();
  });
});

describe("initialSync", () => {
  it("should ensure folder, pull, then push", async () => {
    mockedListAppFiles.mockResolvedValueOnce([]);

    const meta = await initialSync("token", "user@example.com");

    expect(mockedEnsureAppFolder).toHaveBeenCalledWith("token");
    expect(meta.folderId).toBe("folder-abc");
    expect(meta.email).toBe("user@example.com");
    expect(meta.lastSyncedAt).toBeTruthy();
    // pull (listAppFiles) + push (createJsonFile * 5)
    expect(mockedListAppFiles).toHaveBeenCalled();
    expect(mockedCreateJsonFile).toHaveBeenCalledTimes(5);
  });
});

describe("createAutoPushDebouncer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call pushFn after delay", () => {
    const pushFn = vi.fn();
    const debouncer = createAutoPushDebouncer(pushFn, 1000);

    debouncer.trigger();
    expect(pushFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(pushFn).toHaveBeenCalledTimes(1);
  });

  it("should debounce multiple triggers", () => {
    const pushFn = vi.fn();
    const debouncer = createAutoPushDebouncer(pushFn, 1000);

    debouncer.trigger();
    vi.advanceTimersByTime(500);
    debouncer.trigger(); // resets timer
    vi.advanceTimersByTime(500);
    expect(pushFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(pushFn).toHaveBeenCalledTimes(1);
  });

  it("should cancel pending push", () => {
    const pushFn = vi.fn();
    const debouncer = createAutoPushDebouncer(pushFn, 1000);

    debouncer.trigger();
    debouncer.cancel();
    vi.advanceTimersByTime(2000);
    expect(pushFn).not.toHaveBeenCalled();
  });
});
