import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { useStudyPlan } from "../hooks/useStudyPlan";
import LearnCard from "../components/LearnCard";
import ProgressBar from "../components/ProgressBar";
import { loadTestModes } from "../lib/storage";
import { VOCAB_TEST_MODES, GRAMMAR_TEST_MODES } from "../types";

interface LearnLocationState {
  planType?: "all" | "daily";
  dayIndex?: number;
}

export default function LearnPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dataset = useDatasetById(datasetId ?? "");
  const { plan } = useStudyPlan(datasetId ?? "");

  const { planType = "all", dayIndex: initialDayIndex = 0 } =
    (location.state as LearnLocationState) ?? {};

  const [currentDayIndex, setCurrentDayIndex] = useState(initialDayIndex);
  const [currentIndex, setCurrentIndex] = useState(0);

  const selectDay = useCallback((day: number) => {
    setCurrentDayIndex(day);
    setCurrentIndex(0);
  }, []);

  const isDaily = planType === "daily" && !!plan && !!dataset;

  // Determine cards for the current view
  const allDataItems = dataset?.data ?? [];
  let dayCards = allDataItems;
  let dayCardIds: string[] = allDataItems.map((item) => item.id);

  if (isDaily) {
    const dayCardIdSet = plan!.cardIds[currentDayIndex] ?? [];
    const idToIndex = new Map(dayCardIdSet.map((id, i) => [id, i]));
    const filtered = allDataItems
      .filter((item) => idToIndex.has(item.id))
      .sort((a, b) => (idToIndex.get(a.id) ?? 0) - (idToIndex.get(b.id) ?? 0));
    dayCards = filtered;
    dayCardIds = dayCardIdSet;
  }

  const totalCards = dayCards.length;
  const currentItem = dayCards[currentIndex];
  const isComplete = currentIndex >= totalCards;
  const hasNextDay = isDaily && currentDayIndex + 1 < plan!.totalDays;

  const goNext = useCallback(() => {
    if (currentIndex < totalCards) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalCards]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation: ← → arrows
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.code === "Space") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const navigateToExam = useCallback(() => {
    if (!dataset) return;
    const category = dataset.category;
    const modeOptions = category === "vocabulary" ? VOCAB_TEST_MODES : GRAMMAR_TEST_MODES;
    const saved = loadTestModes(category);

    // Resolve modes: support both saved string and string[]
    let resolvedModes: string | string[];
    if (saved == null) {
      resolvedModes = modeOptions[0].value;
    } else if (Array.isArray(saved)) {
      const valid = saved.filter((s) => modeOptions.some((m) => m.value === s));
      resolvedModes = valid.length === 0 ? modeOptions[0].value : valid.length === 1 ? valid[0] : valid;
    } else {
      resolvedModes = modeOptions.some((m) => m.value === saved) ? saved : modeOptions[0].value;
    }

    navigate(`/study/${datasetId}/session`, {
      state: {
        modes: resolvedModes,
        sessionSize: dayCardIds.length,
        sessionType: "specific",
        specificCardIds: dayCardIds,
        returnTo: isDaily
          ? { dayIndex: currentDayIndex, totalDays: plan!.totalDays, datasetId }
          : undefined,
      },
    });
  }, [dataset, datasetId, dayCardIds, isDaily, currentDayIndex, plan, navigate]);

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到學習集</p>
      </div>
    );
  }

  // Day completion screen
  if (isComplete) {
    return (
      <div>
        {/* Day tabs (daily mode only) */}
        {isDaily && <DayTabs plan={plan!} currentDayIndex={currentDayIndex} onSelectDay={selectDay} />}

        <div className="text-center py-8">
          <div className="text-4xl mb-2">📖</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            {isDaily ? `第 ${currentDayIndex + 1} 天完成！` : "瀏覽完成！"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isDaily
              ? `已看完 ${totalCards} 張卡片`
              : `已看完全部 ${totalCards} 張卡片`}
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => setCurrentIndex(0)}
              className="py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors tap-active"
            >
              從頭看今天
            </button>
            <button
              onClick={navigateToExam}
              className="py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active"
            >
              {isDaily ? "測驗今天的卡片" : "去測驗"}
            </button>
            {hasNextDay && (
              <button
                onClick={() => selectDay(currentDayIndex + 1)}
                className="py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors tap-active"
              >
                下一天 →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Day tabs (daily mode only) */}
      {isDaily && <DayTabs plan={plan!} currentDayIndex={currentDayIndex} onSelectDay={selectDay} />}

      <ProgressBar current={currentIndex + 1} total={totalCards} />

      {/* Card */}
      {currentItem && (
        <div key={`${currentDayIndex}-${currentIndex}`} className="slide-in">
          <LearnCard item={currentItem} category={dataset.category} />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors tap-active ${
            currentIndex === 0
              ? "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed"
              : "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          ← 上一張
        </button>
        <button
          onClick={goNext}
          className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active"
        >
          {currentIndex === totalCards - 1 ? "完成" : "下一張 →"}
        </button>
      </div>

      {/* Exam button — always visible */}
      <button
        onClick={navigateToExam}
        className="w-full mt-3 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors tap-active"
      >
        {isDaily ? "開始測驗今天的卡片" : "開始測驗"}
      </button>

      {/* Keyboard hint (desktop only) */}
      <div className="hidden sm:block text-center mt-4 text-xs text-gray-400 dark:text-gray-500">
        ← 上一張 · → 下一張
      </div>
    </div>
  );
}

interface DayTabsProps {
  plan: import("../types").StudyPlan;
  currentDayIndex: number;
  onSelectDay: (day: number) => void;
}

function DayTabs({ plan, currentDayIndex, onSelectDay }: DayTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
      {plan.cardIds.map((cards, dayIdx) => (
        <button
          key={dayIdx}
          onClick={() => onSelectDay(dayIdx)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors tap-active ${
            currentDayIndex === dayIdx
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          第 {dayIdx + 1} 天
          <span className="ml-1 text-xs opacity-70">({cards.length})</span>
        </button>
      ))}
    </div>
  );
}
