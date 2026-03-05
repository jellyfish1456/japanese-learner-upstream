import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDatasetCrud } from "../useDatasetCrud";
import { loadCustomData } from "../../lib/storage";
import type { Dataset } from "../../types";

describe("useDatasetCrud", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("createDataset", () => {
    it("should create a new vocabulary dataset", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let id: string = "";
      act(() => {
        id = result.current.createDataset("My Vocab", "vocabulary", "N5");
      });

      expect(id).toMatch(/^custom-vocabulary-/);
      const store = loadCustomData();
      expect(store.datasets[id]).toBeDefined();
      expect(store.datasets[id].name).toBe("My Vocab");
      expect(store.datasets[id].category).toBe("vocabulary");
      expect(store.datasets[id].level).toBe("N5");
      expect(store.datasets[id].data).toEqual([]);
    });

    it("should create a new grammar dataset", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let id: string = "";
      act(() => {
        id = result.current.createDataset("My Grammar", "grammar", "N4");
      });

      expect(id).toMatch(/^custom-grammar-/);
      const store = loadCustomData();
      expect(store.datasets[id].category).toBe("grammar");
    });
  });

  describe("deleteDataset", () => {
    it("should delete a custom dataset", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let id: string = "";
      act(() => {
        id = result.current.createDataset("To Delete", "vocabulary", "N5");
      });

      expect(loadCustomData().datasets[id]).toBeDefined();

      act(() => {
        result.current.deleteDataset(id);
      });

      expect(loadCustomData().datasets[id]).toBeUndefined();
    });
  });

  describe("addItem", () => {
    it("should add a vocab item to a custom dataset", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let datasetId: string = "";
      act(() => {
        datasetId = result.current.createDataset("Test", "vocabulary", "N5");
      });

      let itemId: string = "";
      act(() => {
        itemId = result.current.addItem(datasetId, {
          japanese: "猫",
          hiragana: "ねこ",
          simple_chinese: "猫",
          full_explanation: "cat",
        });
      });

      expect(itemId).toMatch(/^item-/);
      const store = loadCustomData();
      expect(store.datasets[datasetId].data).toHaveLength(1);
      expect(store.datasets[datasetId].data[0].japanese).toBe("猫");
    });

    it("should add a grammar item with examples", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let datasetId: string = "";
      act(() => {
        datasetId = result.current.createDataset("Grammar", "grammar", "N3");
      });

      act(() => {
        result.current.addItem(datasetId, {
          japanese: "ている",
          simple_chinese: "正在～",
          full_explanation: "表示進行中",
          examples: [{ sentence: "勉強【している】", chinese: "正在學習" }],
        });
      });

      const store = loadCustomData();
      const item = store.datasets[datasetId].data[0];
      expect(item.japanese).toBe("ている");
      expect("examples" in item && item.examples).toHaveLength(1);
    });

    it("should copy built-in dataset on first modification", () => {
      const { result } = renderHook(() => useDatasetCrud());

      const builtinDataset: Dataset = {
        name: "Built-in Vocab",
        category: "vocabulary",
        level: "N5",
        data: [
          { id: "existing-1", japanese: "犬", hiragana: "いぬ", simple_chinese: "狗", full_explanation: "" },
        ],
      };

      act(() => {
        result.current.addItem("test-builtin", {
          japanese: "猫",
          hiragana: "ねこ",
          simple_chinese: "猫",
          full_explanation: "",
        }, builtinDataset);
      });

      const store = loadCustomData();
      // Should have the original item + the new one
      expect(store.datasets["test-builtin"].data).toHaveLength(2);
      expect(store.datasets["test-builtin"].data[0].japanese).toBe("犬");
      expect(store.datasets["test-builtin"].data[1].japanese).toBe("猫");
    });
  });

  describe("editItem", () => {
    it("should edit an existing item", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let datasetId: string = "";
      let itemId: string = "";
      act(() => {
        datasetId = result.current.createDataset("Test", "vocabulary", "N5");
        itemId = result.current.addItem(datasetId, {
          japanese: "猫",
          hiragana: "ねこ",
          simple_chinese: "猫",
          full_explanation: "",
        });
      });

      act(() => {
        result.current.editItem(datasetId, itemId, {
          simple_chinese: "貓咪",
          full_explanation: "可愛的動物",
        });
      });

      const store = loadCustomData();
      const item = store.datasets[datasetId].data[0];
      expect(item.id).toBe(itemId); // ID unchanged
      expect(item.japanese).toBe("猫"); // unchanged field
      expect(item.simple_chinese).toBe("貓咪"); // updated
      expect(item.full_explanation).toBe("可愛的動物"); // updated
    });

    it("should preserve item ID even if updates include id", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let datasetId: string = "";
      let itemId: string = "";
      act(() => {
        datasetId = result.current.createDataset("Test", "vocabulary", "N5");
        itemId = result.current.addItem(datasetId, {
          japanese: "猫",
          hiragana: "ねこ",
          simple_chinese: "猫",
          full_explanation: "",
        });
      });

      act(() => {
        result.current.editItem(datasetId, itemId, {
          id: "should-not-change",
          simple_chinese: "貓咪",
        } as never);
      });

      const store = loadCustomData();
      expect(store.datasets[datasetId].data[0].id).toBe(itemId);
    });
  });

  describe("deleteItem", () => {
    it("should delete an item from a dataset", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let datasetId: string = "";
      let itemId: string = "";
      act(() => {
        datasetId = result.current.createDataset("Test", "vocabulary", "N5");
        itemId = result.current.addItem(datasetId, {
          japanese: "猫",
          hiragana: "ねこ",
          simple_chinese: "猫",
          full_explanation: "",
        });
        result.current.addItem(datasetId, {
          japanese: "犬",
          hiragana: "いぬ",
          simple_chinese: "狗",
          full_explanation: "",
        });
      });

      expect(loadCustomData().datasets[datasetId].data).toHaveLength(2);

      act(() => {
        result.current.deleteItem(datasetId, itemId);
      });

      const store = loadCustomData();
      expect(store.datasets[datasetId].data).toHaveLength(1);
      expect(store.datasets[datasetId].data[0].japanese).toBe("犬");
    });
  });

  describe("resetToBuiltin", () => {
    it("should be a no-op for non-builtin datasets", () => {
      const { result } = renderHook(() => useDatasetCrud());

      let datasetId: string = "";
      act(() => {
        datasetId = result.current.createDataset("Custom", "vocabulary", "N5");
      });

      expect(loadCustomData().datasets[datasetId]).toBeDefined();

      // resetToBuiltin should not affect custom-created datasets
      act(() => {
        result.current.resetToBuiltin(datasetId);
      });

      // Custom dataset should still be there since it's not a built-in
      expect(loadCustomData().datasets[datasetId]).toBeDefined();
    });
  });

  describe("hasCustomCopy", () => {
    it("should return false when no custom copy exists", () => {
      const { result } = renderHook(() => useDatasetCrud());
      expect(result.current.hasCustomCopy("nonexistent")).toBe(false);
    });

    it("should return true when custom copy exists", () => {
      const { result } = renderHook(() => useDatasetCrud());

      act(() => {
        result.current.createDataset("Test", "vocabulary", "N5");
      });

      // Custom datasets always have a "copy"
      const store = loadCustomData();
      const id = Object.keys(store.datasets)[0];
      expect(result.current.hasCustomCopy(id)).toBe(true);
    });
  });
});
