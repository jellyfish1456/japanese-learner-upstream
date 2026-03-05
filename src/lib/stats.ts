import type { DataItem, ProgressStore, CardProgress, ConcreteTestMode, Category } from "../types";
import { isVocabItem, VOCAB_MODE_VALUES, GRAMMAR_MODE_VALUES } from "../types";
import { isDue } from "./sm2";
import { makeProgressKey } from "./storage";

export interface DatasetStats {
  totalCards: number;
  learnedCards: number;   // cards with at least one review
  dueCards: number;       // cards currently due for review
  masteredCards: number;  // cards with repetitions >= 3
  masteryPercent: number; // percentage of mastered cards (0–100)
}

/**
 * Compute statistics for a dataset based on progress data.
 */
export function getDatasetStats(
  data: DataItem[],
  progress: ProgressStore,
): DatasetStats {
  const totalCards = data.length;
  let learnedCards = 0;
  let dueCards = 0;
  let masteredCards = 0;

  for (const item of data) {
    const p: CardProgress | undefined = progress[item.id];
    if (p) {
      learnedCards++;
      if (p.repetitions >= 3) {
        masteredCards++;
      }
    }
    if (isDue(p)) {
      dueCards++;
    }
  }

  const masteryPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return { totalCards, learnedCards, dueCards, masteredCards, masteryPercent };
}

/**
 * Compute statistics for a dataset using composite keys for multiple test modes.
 * - learned: any mode has progress for this card
 * - due: any mode's composite key is due
 * - mastered: ALL modes' composite keys have repetitions >= 3
 */
export function getMultiModeDatasetStats(
  data: DataItem[],
  progress: ProgressStore,
  modes: ConcreteTestMode[],
  category?: Category,
): DatasetStats {
  const totalCards = data.length;
  let learnedCards = 0;
  let dueCards = 0;
  let masteredCards = 0;

  for (const item of data) {
    // For mix datasets, only check modes applicable to this item's type
    const applicableModes = category === "mix"
      ? modes.filter((m) => isVocabItem(item) ? VOCAB_MODE_VALUES.has(m) : GRAMMAR_MODE_VALUES.has(m))
      : modes;

    if (applicableModes.length === 0) continue;

    let anyLearned = false;
    let anyDue = false;
    let allMastered = true;

    for (const mode of applicableModes) {
      const key = makeProgressKey(item.id, mode);
      const p: CardProgress | undefined = progress[key];
      if (p) {
        anyLearned = true;
        if (p.repetitions < 3) allMastered = false;
      } else {
        allMastered = false;
      }
      if (isDue(p)) {
        anyDue = true;
      }
    }

    if (anyLearned) learnedCards++;
    if (anyDue) dueCards++;
    if (allMastered) masteredCards++;
  }

  const masteryPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return { totalCards, learnedCards, dueCards, masteredCards, masteryPercent };
}
