import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isVocabItem,
  VOCAB_MODE_VALUES,
  GRAMMAR_MODE_VALUES,
  MIX_TEST_MODES,
  MIX_DEFAULT_MODES,
} from "../../types";
import type {
  VocabItem,
  GrammarItem,
  DataItem,
  ConcreteTestMode,
} from "../../types";
import { buildVocabCard, buildGrammarCard } from "../flashcard";
import { getMultiModeDatasetStats } from "../stats";
import type { ProgressStore, CardProgress } from "../../types";
import { categoryLabels, categoryColors } from "../category";

// ========== Test Data ==========

const sampleVocab: VocabItem = {
  id: "v1",
  japanese: "猫",
  hiragana: "ねこ",
  simple_chinese: "貓",
  full_explanation: "可愛的動物",
};

const sampleGrammar: GrammarItem = {
  id: "g1",
  japanese: "ている",
  simple_chinese: "正在～",
  full_explanation: "表示動作正在進行中。",
  examples: [
    { sentence: "本を読ん【ている】", chinese: "正在看書" },
  ],
};

const sampleVocab2: VocabItem = {
  id: "v2",
  japanese: "犬",
  hiragana: "いぬ",
  simple_chinese: "狗",
  full_explanation: "",
};

const sampleGrammar2: GrammarItem = {
  id: "g2",
  japanese: "～から～まで",
  simple_chinese: "從～到～",
  full_explanation: "表示時間或空間的起點到終點。",
  examples: [
    { sentence: "東京【から】大阪【まで】新幹線で行く", chinese: "從東京到大阪搭新幹線" },
  ],
};

const mixData: DataItem[] = [sampleVocab, sampleGrammar, sampleVocab2, sampleGrammar2];

// ========== isVocabItem ==========

describe("isVocabItem", () => {
  it("should return true for VocabItem (has hiragana)", () => {
    expect(isVocabItem(sampleVocab)).toBe(true);
  });

  it("should return false for GrammarItem (no hiragana)", () => {
    expect(isVocabItem(sampleGrammar)).toBe(false);
  });

  it("should correctly distinguish in a mixed array", () => {
    const vocabCount = mixData.filter(isVocabItem).length;
    const grammarCount = mixData.filter((item) => !isVocabItem(item)).length;
    expect(vocabCount).toBe(2);
    expect(grammarCount).toBe(2);
  });
});

// ========== Mode Value Sets ==========

describe("VOCAB_MODE_VALUES and GRAMMAR_MODE_VALUES", () => {
  it("should contain exactly the vocab modes", () => {
    expect(VOCAB_MODE_VALUES.has("kanji-to-chinese")).toBe(true);
    expect(VOCAB_MODE_VALUES.has("hiragana-to-chinese")).toBe(true);
    expect(VOCAB_MODE_VALUES.has("chinese-to-japanese")).toBe(true);
    expect(VOCAB_MODE_VALUES.has("grammar-to-chinese")).toBe(false);
  });

  it("should contain exactly the grammar modes", () => {
    expect(GRAMMAR_MODE_VALUES.has("grammar-to-chinese")).toBe(true);
    expect(GRAMMAR_MODE_VALUES.has("example-to-chinese")).toBe(true);
    expect(GRAMMAR_MODE_VALUES.has("chinese-to-grammar")).toBe(true);
    expect(GRAMMAR_MODE_VALUES.has("fill-in-grammar")).toBe(true);
    expect(GRAMMAR_MODE_VALUES.has("kanji-to-chinese")).toBe(false);
  });

  it("should have no overlap between vocab and grammar modes", () => {
    for (const v of VOCAB_MODE_VALUES) {
      expect(GRAMMAR_MODE_VALUES.has(v)).toBe(false);
    }
  });
});

// ========== MIX_TEST_MODES ==========

describe("MIX_TEST_MODES", () => {
  it("should have 7 concrete modes", () => {
    expect(MIX_TEST_MODES).toHaveLength(7);
  });

  it("should include all vocab and grammar concrete modes", () => {
    const values = MIX_TEST_MODES.map((m) => m.value);
    expect(values).toContain("kanji-to-chinese");
    expect(values).toContain("hiragana-to-chinese");
    expect(values).toContain("chinese-to-japanese");
    expect(values).toContain("grammar-to-chinese");
    expect(values).toContain("example-to-chinese");
    expect(values).toContain("chinese-to-grammar");
    expect(values).toContain("fill-in-grammar");
  });

  it("should have group property on every mode", () => {
    for (const m of MIX_TEST_MODES) {
      expect(["vocab", "grammar"]).toContain(m.group);
    }
  });
});

// ========== MIX_DEFAULT_MODES ==========

describe("MIX_DEFAULT_MODES", () => {
  it("should have kanji-to-chinese and grammar-to-chinese", () => {
    expect(MIX_DEFAULT_MODES).toEqual(["kanji-to-chinese", "grammar-to-chinese"]);
  });

  it("should include one vocab mode and one grammar mode", () => {
    expect(MIX_DEFAULT_MODES.some((m) => VOCAB_MODE_VALUES.has(m))).toBe(true);
    expect(MIX_DEFAULT_MODES.some((m) => GRAMMAR_MODE_VALUES.has(m))).toBe(true);
  });
});

// ========== buildCard for mix (vocab modes on vocab items, grammar modes on grammar items) ==========

describe("buildCard for mix items", () => {
  it("should build vocab card with kanji-to-chinese for vocab item", () => {
    const card = buildVocabCard(sampleVocab, "kanji-to-chinese");
    expect(card.front.primary).toBe("猫");
    expect(card.back.primary).toBe("貓");
    expect(card.back.secondary).toBe("ねこ");
  });

  it("should build grammar card with grammar-to-chinese for grammar item", () => {
    const card = buildGrammarCard(sampleGrammar, "grammar-to-chinese");
    expect(card.front.primary).toBe("ている");
    expect(card.back.primary).toBe("正在～");
  });

  it("should build grammar card with example-to-chinese for grammar item", () => {
    const card = buildGrammarCard(sampleGrammar, "example-to-chinese", 0);
    expect(card.front.primary).toContain("__GRAMMAR_HIGHLIGHT__");
    expect(card.back.primary).toBe("正在看書");
  });

  it("should build grammar card with fill-in-grammar for grammar item", () => {
    const card = buildGrammarCard(sampleGrammar, "fill-in-grammar", 0);
    expect(card.front.primary).toContain("__GRAMMAR_BLANK__");
    expect(card.back.primary).toBe("ている");
  });
});

// ========== getMultiModeDatasetStats with mix ==========

describe("getMultiModeDatasetStats with mix category", () => {
  const makeProgress = (
    cardId: string,
    repetitions: number,
    nextReview: string,
  ): CardProgress => ({
    cardId,
    datasetId: "ds-mix",
    easeFactor: 2.5,
    interval: 1,
    repetitions,
    nextReview,
    lastRating: "good",
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should count all cards as due when no progress", () => {
    const stats = getMultiModeDatasetStats(
      mixData,
      {},
      ["kanji-to-chinese", "grammar-to-chinese"] as ConcreteTestMode[],
      "mix",
    );
    expect(stats.totalCards).toBe(4);
    expect(stats.dueCards).toBe(4);
  });

  it("should only check applicable modes per item type", () => {
    // Vocab item v1 only has kanji-to-chinese applicable (not grammar-to-chinese)
    // Grammar item g1 only has grammar-to-chinese applicable (not kanji-to-chinese)
    const progress: ProgressStore = {
      "v1::kanji-to-chinese": makeProgress("v1::kanji-to-chinese", 5, "2025-06-20"),
      "g1::grammar-to-chinese": makeProgress("g1::grammar-to-chinese", 5, "2025-06-20"),
    };
    const stats = getMultiModeDatasetStats(
      mixData,
      progress,
      ["kanji-to-chinese", "grammar-to-chinese"] as ConcreteTestMode[],
      "mix",
    );
    // v1 and g1 are mastered (each has only 1 applicable mode, and it's >= 3 reps)
    expect(stats.masteredCards).toBe(2);
    // v2 and g2 are not mastered (no progress)
    expect(stats.learnedCards).toBe(2);
  });

  it("should not require grammar modes mastered for vocab items", () => {
    // v1 has kanji-to-chinese mastered but not grammar-to-chinese (which is N/A for vocab)
    const progress: ProgressStore = {
      "v1::kanji-to-chinese": makeProgress("v1::kanji-to-chinese", 5, "2025-06-20"),
      // No grammar-to-chinese for v1 — this is fine, it's a vocab item
    };
    const stats = getMultiModeDatasetStats(
      mixData,
      progress,
      ["kanji-to-chinese", "grammar-to-chinese"] as ConcreteTestMode[],
      "mix",
    );
    expect(stats.masteredCards).toBe(1); // v1 mastered
  });

  it("should count due correctly for mix items", () => {
    const progress: ProgressStore = {
      "v1::kanji-to-chinese": makeProgress("v1::kanji-to-chinese", 3, "2025-06-20"), // not due
      "g1::grammar-to-chinese": makeProgress("g1::grammar-to-chinese", 1, "2025-06-10"), // overdue
    };
    const stats = getMultiModeDatasetStats(
      mixData,
      progress,
      ["kanji-to-chinese", "grammar-to-chinese"] as ConcreteTestMode[],
      "mix",
    );
    // v1: not due (kanji-to-chinese is future)
    // g1: due (grammar-to-chinese is overdue)
    // v2, g2: due (no progress)
    expect(stats.dueCards).toBe(3);
  });

  it("should handle all 7 modes for mix", () => {
    const allModes: ConcreteTestMode[] = [
      "kanji-to-chinese", "hiragana-to-chinese", "chinese-to-japanese",
      "grammar-to-chinese", "example-to-chinese", "chinese-to-grammar", "fill-in-grammar",
    ];
    const stats = getMultiModeDatasetStats(mixData, {}, allModes, "mix");
    expect(stats.totalCards).toBe(4);
    expect(stats.dueCards).toBe(4);
    expect(stats.masteredCards).toBe(0);
  });
});

// ========== Category labels/colors ==========

describe("categoryLabels and categoryColors", () => {
  it("should have labels for all categories including mix", () => {
    expect(categoryLabels["vocabulary"]).toBe("詞彙");
    expect(categoryLabels["grammar"]).toBe("文法");
    expect(categoryLabels["mix"]).toBe("綜合");
    expect(categoryLabels[""]).toBe("全部");
  });

  it("should have colors for all categories including mix", () => {
    expect(categoryColors["vocabulary"]).toContain("blue");
    expect(categoryColors["grammar"]).toContain("purple");
    expect(categoryColors["mix"]).toContain("green");
  });
});
