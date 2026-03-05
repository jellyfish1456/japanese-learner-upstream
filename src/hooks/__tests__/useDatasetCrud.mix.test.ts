import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDatasetCrud } from "../useDatasetCrud";
import { loadCustomData } from "../../lib/storage";

describe("useDatasetCrud - mix category", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should create a mix dataset", () => {
    const { result } = renderHook(() => useDatasetCrud());

    let id = "";
    act(() => {
      id = result.current.createDataset("My Mix Set", "mix", "N3");
    });

    expect(id).toMatch(/^custom-mix-/);
    const store = loadCustomData();
    expect(store.datasets[id].category).toBe("mix");
    expect(store.datasets[id].name).toBe("My Mix Set");
    expect(store.datasets[id].data).toEqual([]);
  });

  it("should add vocab items to a mix dataset", () => {
    const { result } = renderHook(() => useDatasetCrud());

    let id = "";
    act(() => {
      id = result.current.createDataset("Mix", "mix", "N3");
    });

    act(() => {
      result.current.addItem(id, {
        japanese: "猫",
        hiragana: "ねこ",
        simple_chinese: "貓",
        full_explanation: "",
      });
    });

    const store = loadCustomData();
    const item = store.datasets[id].data[0];
    expect(item.japanese).toBe("猫");
    expect("hiragana" in item).toBe(true);
  });

  it("should add grammar items to a mix dataset", () => {
    const { result } = renderHook(() => useDatasetCrud());

    let id = "";
    act(() => {
      id = result.current.createDataset("Mix", "mix", "N3");
    });

    act(() => {
      result.current.addItem(id, {
        japanese: "ている",
        simple_chinese: "正在～",
        full_explanation: "表示進行中",
        examples: [{ sentence: "勉強【している】", chinese: "正在學習" }],
      });
    });

    const store = loadCustomData();
    const item = store.datasets[id].data[0];
    expect(item.japanese).toBe("ている");
    expect("hiragana" in item).toBe(false);
    expect("examples" in item).toBe(true);
  });

  it("should add both vocab and grammar items to same mix dataset", () => {
    const { result } = renderHook(() => useDatasetCrud());

    let id = "";
    act(() => {
      id = result.current.createDataset("Mix", "mix", "N3");
    });

    act(() => {
      result.current.addItem(id, {
        japanese: "猫",
        hiragana: "ねこ",
        simple_chinese: "貓",
        full_explanation: "",
      });
      result.current.addItem(id, {
        japanese: "ている",
        simple_chinese: "正在～",
        full_explanation: "表示進行中",
        examples: [],
      });
    });

    const store = loadCustomData();
    expect(store.datasets[id].data).toHaveLength(2);

    const [first, second] = store.datasets[id].data;
    expect("hiragana" in first).toBe(true);
    expect("hiragana" in second).toBe(false);
  });
});
