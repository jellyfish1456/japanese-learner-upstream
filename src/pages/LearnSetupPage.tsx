import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { useStudyPlan } from "../hooks/useStudyPlan";
import { loadReviewList } from "../lib/storage";

const DAY_OPTIONS = [5, 10, 20, 30, 40, 50, 60];

export default function LearnSetupPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");
  const { plan, createPlan, clearPlan } = useStudyPlan(datasetId ?? "");

  const [showFreshSetup, setShowFreshSetup] = useState(false);
  const [planTypeChoice, setPlanTypeChoice] = useState<"all" | "daily">("all");
  const [selectedDays, setSelectedDays] = useState(5);

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到學習集</p>
      </div>
    );
  }

  const totalCards = dataset.data.length;
  const allCardIds = dataset.data.map((item) => item.id);
  const reviewList = loadReviewList(datasetId ?? "");

  const cardsPerDay = selectedDays > 0 ? Math.ceil(totalCards / selectedDays) : totalCards;

  // Show resume view if plan exists and user hasn't clicked "重新計畫"
  const showResume = !!plan && !showFreshSetup;

  const handleStart = () => {
    if (showResume) {
      // Resume existing plan from day 0
      navigate(`/learn/${datasetId}/session`, {
        state: { planType: "daily", dayIndex: 0 },
      });
      return;
    }

    if (planTypeChoice === "all") {
      createPlan(allCardIds, 0); // clears any existing plan
      navigate(`/learn/${datasetId}/session`, {
        state: { planType: "all" },
      });
    } else {
      createPlan(allCardIds, selectedDays);
      navigate(`/learn/${datasetId}/session`, {
        state: { planType: "daily", dayIndex: 0 },
      });
    }
  };

  const handleReplan = () => {
    clearPlan();
    setShowFreshSetup(true);
    setPlanTypeChoice("all");
  };

  return (
    <div>
      {/* Dataset info */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{dataset.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {dataset.level} · {totalCards} 張卡片
        </p>
      </div>

      {showResume ? (
        /* Existing plan — show resume option */
        <div>
          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-semibold text-blue-900 dark:text-blue-200">已有學習計畫</div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                  共 {plan!.totalDays} 天 · 每天約 {Math.ceil(totalCards / plan!.totalDays)} 張
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active mb-3"
          >
            繼續計畫
          </button>

          <button
            onClick={handleReplan}
            className="w-full py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors tap-active"
          >
            重新計畫
          </button>
        </div>
      ) : (
        /* Fresh setup — show all/daily selection */
        <div>
          {/* Plan type selection */}
          <div className="mb-6 space-y-3">
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              planTypeChoice === "all"
                ? "border-gray-800 dark:border-gray-300 bg-gray-50 dark:bg-gray-700"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            }`}>
              <input
                type="radio"
                name="planType"
                value="all"
                checked={planTypeChoice === "all"}
                onChange={() => setPlanTypeChoice("all")}
                className="mt-0.5 accent-gray-900"
              />
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-50">全部學習</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">一次瀏覽所有 {totalCards} 張卡片</div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              planTypeChoice === "daily"
                ? "border-gray-800 dark:border-gray-300 bg-gray-50 dark:bg-gray-700"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            }`}>
              <input
                type="radio"
                name="planType"
                value="daily"
                checked={planTypeChoice === "daily"}
                onChange={() => setPlanTypeChoice("daily")}
                className="mt-0.5 accent-gray-900"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-50">分天計畫</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">將卡片分散到多天學習</div>
              </div>
            </label>
          </div>

          {/* Day selector (only for daily plan) */}
          {planTypeChoice === "daily" && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">選擇天數</div>
              <div className="flex gap-2 flex-wrap mb-3">
                {DAY_OPTIONS.map((days) => {
                  const disabled = days > totalCards;
                  return (
                    <button
                      key={days}
                      onClick={() => !disabled && setSelectedDays(days)}
                      disabled={disabled}
                      className={`px-5 py-2 rounded-xl font-medium transition-colors ${
                        disabled
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed"
                          : selectedDays === days
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {days} 天
                    </button>
                  );
                })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2">
                每天學 <span className="font-semibold text-gray-900 dark:text-gray-50">{cardsPerDay}</span> 張
              </div>
            </div>
          )}

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active"
          >
            開始學習
          </button>

          {reviewList.length > 0 && (
            <button
              onClick={() => navigate(`/learn/${datasetId}/session`, { state: { planType: "all", reviewOnly: true } })}
              className="w-full mt-3 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors tap-active"
            >
              ⭐ 再次複習 ({reviewList.length} 個已標記)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
