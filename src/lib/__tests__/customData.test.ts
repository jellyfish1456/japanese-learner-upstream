import { describe, it, expect, beforeEach } from "vitest";
import {
  loadCustomData,
  saveCustomData,
  generateId,
  subscribeCustomData,
} from "../storage";
import type { CustomDataStore } from "../../types";

describe("storage - custom data", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return empty store when nothing stored", () => {
    expect(loadCustomData()).toEqual({ datasets: {} });
  });

  it("should save and load custom data", () => {
    const store: CustomDataStore = {
      datasets: {
        "custom-vocabulary-123": {
          name: "My Vocab",
          category: "vocabulary",
          level: "N5",
          data: [
            {
              id: "item-1",
              japanese: "猫",
              hiragana: "ねこ",
              simple_chinese: "猫",
              full_explanation: "cat",
            },
          ],
        },
      },
    };

    saveCustomData(store);
    const loaded = loadCustomData();
    expect(loaded).toEqual(store);
  });

  it("should overwrite existing custom data", () => {
    const store1: CustomDataStore = {
      datasets: { ds1: { name: "A", category: "vocabulary", level: "N5", data: [] } },
    };
    const store2: CustomDataStore = {
      datasets: { ds2: { name: "B", category: "grammar", level: "N4", data: [] } },
    };

    saveCustomData(store1);
    saveCustomData(store2);
    expect(loadCustomData()).toEqual(store2);
  });

  it("should handle corrupted localStorage gracefully", () => {
    localStorage.setItem("jp-learner:custom-data", "bad json!!!");
    expect(loadCustomData()).toEqual({ datasets: {} });
  });

  it("should notify subscribers when saving", () => {
    let callCount = 0;
    const unsubscribe = subscribeCustomData(() => {
      callCount++;
    });

    saveCustomData({ datasets: {} });
    expect(callCount).toBe(1);

    saveCustomData({ datasets: {} });
    expect(callCount).toBe(2);

    unsubscribe();
    saveCustomData({ datasets: {} });
    expect(callCount).toBe(2); // no more notifications
  });

  it("should allow multiple subscribers", () => {
    let count1 = 0;
    let count2 = 0;
    const unsub1 = subscribeCustomData(() => count1++);
    const unsub2 = subscribeCustomData(() => count2++);

    saveCustomData({ datasets: {} });
    expect(count1).toBe(1);
    expect(count2).toBe(1);

    unsub1();
    saveCustomData({ datasets: {} });
    expect(count1).toBe(1);
    expect(count2).toBe(2);

    unsub2();
  });
});

describe("generateId", () => {
  it("should generate unique IDs with the given prefix", () => {
    const id1 = generateId("custom-vocab");
    const id2 = generateId("custom-vocab");
    expect(id1).toMatch(/^custom-vocab-\d+-[a-z0-9]{4}$/);
    expect(id2).toMatch(/^custom-vocab-\d+-[a-z0-9]{4}$/);
    expect(id1).not.toBe(id2);
  });

  it("should use the prefix provided", () => {
    const id = generateId("item");
    expect(id.startsWith("item-")).toBe(true);
  });
});
