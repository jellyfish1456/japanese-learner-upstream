import { useState, useCallback, useMemo } from "react";
import type {
  DataItem,
  VocabItem,
  GrammarItem,
  TestMode,
  Rating,
  FlashcardContent,
  SessionResult,
  SessionType,
} from "../types";
import type { LoadedDataset } from "./useDatasets";
import { useProgress } from "./useProgress";
import { isDue } from "../lib/sm2";
import { shuffle } from "../lib/shuffle";
import { buildVocabCard, buildGrammarCard } from "../lib/flashcard";
import { makeProgressKey } from "../lib/storage";

interface StudyCard {
  item: DataItem;
  flashcard: FlashcardContent;
  exampleIndex?: number;
  mode?: string; // The concrete mode used for this presentation
}

export function useStudySession(
  dataset: LoadedDataset | undefined,
  modes: string | string[],
  sessionSize: number,
  sessionType: SessionType = "due",
  specificCardIds?: string[],
) {
  const { progress, rateCard } = useProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<{ cardId: string; rating: Rating; mode?: string }[]>([]);
  const [requeue, setRequeue] = useState<StudyCard[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Determine if this is a multi-mode session
  const isMultiMode = Array.isArray(modes) && modes.length > 1;
  const modeArray = Array.isArray(modes) ? modes : [modes];

  // Build the initial card queue.
  //
  // Single-mode: each item produces one StudyCard.
  // Multi-mode (綜合模式): each item produces N StudyCards (one per mode).
  //   Cards are grouped by mode in canonical order so the user practices
  //   one skill at a time — e.g. all 漢字→中文 first, then 假名→中文,
  //   then 中文→日文. Items are shuffled within each mode group.
  //   Only the specific failed (card, mode) pair is requeued on "again".
  const initialCards: StudyCard[] = useMemo(() => {
    if (!dataset) return [];

    const resolvedModes = Array.isArray(modes) ? modes : [modes];

    if (specificCardIds) {
      // Specific card IDs — filter and preserve order
      const idToOrder = new Map(specificCardIds.map((id, i) => [id, i]));
      const filtered = dataset.data
        .filter((item) => idToOrder.has(item.id))
        .sort((a, b) => (idToOrder.get(a.id) ?? 0) - (idToOrder.get(b.id) ?? 0));

      if (resolvedModes.length > 1) {
        // Multi-mode: group by mode in canonical order, items shuffled within each group
        const shuffledFiltered = shuffle(filtered);
        const cards: StudyCard[] = [];
        for (const m of resolvedModes) {
          for (const item of shuffledFiltered) {
            const flashcard = buildCard(item, dataset.category, m as TestMode);
            cards.push({ item, flashcard, mode: m });
          }
        }
        return cards;
      }

      return filtered.map((item) => {
        const flashcard = buildCard(item, dataset.category, resolvedModes[0] as TestMode);
        return { item, flashcard, mode: resolvedModes[0] };
      });
    }

    // Filter cards based on session type
    let items: DataItem[];
    if (sessionType === "random") {
      items = dataset.data;
    } else if (resolvedModes.length > 1) {
      // Multi-mode due: card is due if ANY mode's composite key is due
      items = dataset.data.filter((item) =>
        resolvedModes.some((m) => isDue(progress[makeProgressKey(item.id, m)])),
      );
    } else {
      items = dataset.data.filter((item) => isDue(progress[item.id]));
    }

    const shuffled = shuffle(items);
    const selected = shuffled.slice(0, sessionSize);

    if (resolvedModes.length > 1) {
      // Multi-mode: group by mode in canonical order, items shuffled within each group
      const cards: StudyCard[] = [];
      for (const m of resolvedModes) {
        for (const item of selected) {
          const flashcard = buildCard(item, dataset.category, m as TestMode);
          cards.push({ item, flashcard, mode: m });
        }
      }
      return cards; // selected is already shuffled above
    }

    return selected.map((item) => {
      const flashcard = buildCard(item, dataset.category, resolvedModes[0] as TestMode);
      return { item, flashcard, mode: resolvedModes[0] };
    });
  // Only compute once on mount (deps intentionally exclude progress to avoid re-shuffle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.id, modes, sessionSize, sessionType]);

  // Combined queue: initial cards + requeued cards
  const allCards = useMemo(() => [...initialCards, ...requeue], [initialCards, requeue]);

  const currentCard = allCards[currentIndex] as StudyCard | undefined;
  const totalCards = allCards.length;

  // Unique card count (for multi-mode summary)
  const uniqueCardCount = useMemo(() => {
    const ids = new Set(initialCards.map((c) => c.item.id));
    return ids.size;
  }, [initialCards]);

  const flip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const rate = useCallback(
    (rating: Rating) => {
      if (!currentCard || !dataset) return;

      const cardId = currentCard.item.id;
      const cardMode = currentCard.mode;

      // Use composite key for multi-mode, plain cardId for single-mode
      const progressKey = isMultiMode && cardMode ? makeProgressKey(cardId, cardMode) : cardId;
      rateCard(progressKey, dataset.id, rating);
      setResults((prev) => [...prev, { cardId, rating, mode: cardMode }]);

      // Re-queue "again" cards — only the failed (card, mode) presentation
      if (rating === "again") {
        setRequeue((prev) => [...prev, currentCard]);
      }

      // Move to next card
      const nextIndex = currentIndex + 1;
      if (nextIndex >= allCards.length + (rating === "again" ? 1 : 0)) {
        if (nextIndex >= totalCards + (rating === "again" ? 1 : 0)) {
          setIsComplete(true);
        }
      }

      setCurrentIndex(nextIndex);
      setIsFlipped(false);
    },
    [currentCard, dataset, currentIndex, allCards.length, totalCards, rateCard, isMultiMode],
  );

  // Check completion whenever currentIndex changes
  const isSessionComplete = isComplete || (currentIndex >= allCards.length && allCards.length > 0);

  // Current mode label for display
  const currentModeLabel = currentCard?.mode;

  const sessionResult: SessionResult = useMemo(() => {
    const good = results.filter((r) => r.rating === "good").length;
    const hard = results.filter((r) => r.rating === "hard").length;
    const again = results.filter((r) => r.rating === "again").length;
    return { total: results.length, good, hard, again, cards: results };
  }, [results]);

  return {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    isSessionComplete,
    sessionResult,
    flip,
    rate,
    isMultiMode,
    currentModeLabel,
    uniqueCardCount,
    modesCount: modeArray.length,
  };
}

function buildCard(
  item: DataItem,
  category: "vocabulary" | "grammar",
  mode: TestMode,
): FlashcardContent {
  if (category === "vocabulary") {
    return buildVocabCard(item as VocabItem, mode as import("../types").VocabTestMode);
  } else {
    const grammarItem = item as GrammarItem;
    const exampleIndex =
      grammarItem.examples?.length > 0
        ? Math.floor(Math.random() * grammarItem.examples.length)
        : 0;
    return buildGrammarCard(
      grammarItem,
      mode as import("../types").GrammarTestMode,
      exampleIndex,
    );
  }
}
