import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDatasetStats, getMultiModeDatasetStats } from "../stats";
import type { DataItem, ProgressStore, CardProgress, ConcreteTestMode } from "../../types";

const makeItem = (id: string): DataItem =>
  ({
    id,
    japanese: "test",
    hiragana: "test",
    simple_chinese: "test",
    full_explanation: "test",
  }) as DataItem;

const makeProgress = (
  cardId: string,
  repetitions: number,
  nextReview: string,
): CardProgress => ({
  cardId,
  datasetId: "ds-1",
  easeFactor: 2.5,
  interval: 1,
  repetitions,
  nextReview,
  lastRating: "good",
});

describe("getDatasetStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle empty dataset", () => {
    const stats = getDatasetStats([], {});
    expect(stats).toEqual({
      totalCards: 0,
      learnedCards: 0,
      dueCards: 0,
      masteredCards: 0,
      masteryPercent: 0,
    });
  });

  it("should count all cards as due when no progress", () => {
    const data = [makeItem("1"), makeItem("2"), makeItem("3")];
    const stats = getDatasetStats(data, {});

    expect(stats.totalCards).toBe(3);
    expect(stats.learnedCards).toBe(0);
    expect(stats.dueCards).toBe(3);
    expect(stats.masteredCards).toBe(0);
    expect(stats.masteryPercent).toBe(0);
  });

  it("should correctly count learned cards", () => {
    const data = [makeItem("1"), makeItem("2"), makeItem("3")];
    const progress: ProgressStore = {
      "1": makeProgress("1", 1, "2025-06-20"),
      "2": makeProgress("2", 2, "2025-06-20"),
    };

    const stats = getDatasetStats(data, progress);
    expect(stats.learnedCards).toBe(2);
    expect(stats.dueCards).toBe(1); // only card "3" (no progress = due)
  });

  it("should correctly count mastered cards (repetitions >= 3)", () => {
    const data = [makeItem("1"), makeItem("2"), makeItem("3")];
    const progress: ProgressStore = {
      "1": makeProgress("1", 3, "2025-06-20"),
      "2": makeProgress("2", 5, "2025-06-20"),
      "3": makeProgress("3", 2, "2025-06-20"),
    };

    const stats = getDatasetStats(data, progress);
    expect(stats.masteredCards).toBe(2); // cards 1 and 2
    expect(stats.masteryPercent).toBe(67); // Math.round(2/3 * 100)
  });

  it("should count due cards correctly", () => {
    const data = [makeItem("1"), makeItem("2"), makeItem("3")];
    const progress: ProgressStore = {
      "1": makeProgress("1", 1, "2025-06-15"), // due today
      "2": makeProgress("2", 1, "2025-06-10"), // overdue
      "3": makeProgress("3", 1, "2025-06-20"), // not due
    };

    const stats = getDatasetStats(data, progress);
    expect(stats.dueCards).toBe(2); // cards 1 and 2
  });

  it("should compute 100% mastery", () => {
    const data = [makeItem("1"), makeItem("2")];
    const progress: ProgressStore = {
      "1": makeProgress("1", 5, "2025-06-20"),
      "2": makeProgress("2", 3, "2025-06-20"),
    };

    const stats = getDatasetStats(data, progress);
    expect(stats.masteryPercent).toBe(100);
  });
});

describe("getMultiModeDatasetStats", () => {
  const modes: ConcreteTestMode[] = ["kanji-to-chinese", "hiragana-to-chinese"];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should count all cards as due when no progress", () => {
    const data = [makeItem("1"), makeItem("2")];
    const stats = getMultiModeDatasetStats(data, {}, modes);
    expect(stats.totalCards).toBe(2);
    expect(stats.learnedCards).toBe(0);
    expect(stats.dueCards).toBe(2);
    expect(stats.masteredCards).toBe(0);
  });

  it("should count learned when any mode has progress", () => {
    const data = [makeItem("1"), makeItem("2")];
    const progress: ProgressStore = {
      "1::kanji-to-chinese": makeProgress("1::kanji-to-chinese", 1, "2025-06-20"),
    };
    const stats = getMultiModeDatasetStats(data, progress, modes);
    expect(stats.learnedCards).toBe(1); // card 1 learned via one mode
  });

  it("should count due when any mode's composite key is due", () => {
    const data = [makeItem("1")];
    const progress: ProgressStore = {
      "1::kanji-to-chinese": makeProgress("1::kanji-to-chinese", 3, "2025-06-20"),
      "1::hiragana-to-chinese": makeProgress("1::hiragana-to-chinese", 1, "2025-06-10"), // overdue
    };
    const stats = getMultiModeDatasetStats(data, progress, modes);
    expect(stats.dueCards).toBe(1); // due because hiragana-to-chinese is overdue
  });

  it("should count mastered only when ALL modes have repetitions >= 3", () => {
    const data = [makeItem("1"), makeItem("2")];
    const progress: ProgressStore = {
      // Card 1: both modes mastered
      "1::kanji-to-chinese": makeProgress("1::kanji-to-chinese", 5, "2025-06-20"),
      "1::hiragana-to-chinese": makeProgress("1::hiragana-to-chinese", 3, "2025-06-20"),
      // Card 2: only one mode mastered
      "2::kanji-to-chinese": makeProgress("2::kanji-to-chinese", 4, "2025-06-20"),
      "2::hiragana-to-chinese": makeProgress("2::hiragana-to-chinese", 2, "2025-06-20"),
    };
    const stats = getMultiModeDatasetStats(data, progress, modes);
    expect(stats.masteredCards).toBe(1); // only card 1
    expect(stats.masteryPercent).toBe(50);
  });

  it("should not count mastered if any mode has no progress", () => {
    const data = [makeItem("1")];
    const progress: ProgressStore = {
      "1::kanji-to-chinese": makeProgress("1::kanji-to-chinese", 5, "2025-06-20"),
      // hiragana-to-chinese has no progress
    };
    const stats = getMultiModeDatasetStats(data, progress, modes);
    expect(stats.masteredCards).toBe(0);
  });
});
