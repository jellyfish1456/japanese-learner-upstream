import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasetMetas, useDatasets } from "../hooks/useDatasets";
import { useDialogueDatasets } from "../hooks/useDialogues";
import DatasetCard from "../components/DatasetCard";
import FilterBar from "../components/FilterBar";
import { loadReviewList } from "../lib/storage";

export default function HomePage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const datasets = useDatasets();
  const metas = useDatasetMetas(categoryFilter || undefined, levelFilter || undefined);
  const navigate = useNavigate();

  // Review list counts per vocab dataset
  const vocabReviews = useMemo(() => [
    { level: "N5", datasetId: "n5_vocab", count: loadReviewList("n5_vocab").length },
    { level: "N4", datasetId: "n4_vocab", count: loadReviewList("n4_vocab").length },
    { level: "N3", datasetId: "n3_vocab", count: loadReviewList("n3_vocab").length },
  ].filter((r) => r.count > 0), []);

  // Extract unique categories and levels for filter bar
  const dialogueDatasets = useDialogueDatasets();

  const categories = useMemo(
    () => [...new Set(datasets.map((d) => d.category))],
    [datasets],
  );
  const levels = useMemo(
    () => [...new Set(datasets.map((d) => d.level))].sort(),
    [datasets],
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">學習集</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">選擇一個學習集開始複習</p>
      </div>

      {/* Create new dataset button */}
      <button
        onClick={() => navigate("/manage/new")}
        className="w-full mb-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-semibold hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors tap-active"
      >
        + 新增學習集
      </button>

      <FilterBar
        categories={categories}
        levels={levels}
        selectedCategory={categoryFilter}
        selectedLevel={levelFilter}
        onCategoryChange={setCategoryFilter}
        onLevelChange={setLevelFilter}
      />

      {metas.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📚</div>
          <p>沒有找到符合條件的學習集</p>
        </div>
      ) : (
        <div className="space-y-3">
          {metas.map((meta) => (
            <DatasetCard key={meta.id} dataset={meta} />
          ))}
        </div>
      )}

      {/* 再複習詞彙 */}
      {vocabReviews.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">⭐ 再複習詞彙</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">已標記待複習的單字</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {vocabReviews.map(({ level, datasetId, count }) => {
              const colors: Record<string, string> = {
                N5: "bg-amber-400 hover:bg-amber-500",
                N4: "bg-amber-500 hover:bg-amber-600",
                N3: "bg-amber-600 hover:bg-amber-700",
              };
              return (
                <button
                  key={level}
                  onClick={() => navigate(`/learn/${datasetId}/session`, { state: { planType: "all", reviewOnly: true } })}
                  className={`${colors[level] ?? "bg-amber-500"} text-white rounded-2xl p-4 text-center transition-colors tap-active shadow-sm`}
                >
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="text-lg font-bold">{level}</div>
                  <div className="text-xs opacity-90 mt-0.5">{count} 個單字</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Dialogue + Listening sections */}
      {dialogueDatasets.length > 0 && (
        <>
          {/* 日常對話 */}
          <div className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">日常對話</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">情境會話練習，每句附日文發音</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {dialogueDatasets.map((ds) => {
                const dialogueColors: Record<string, { bg: string; icon: string }> = {
                  N5: { bg: "bg-green-500 hover:bg-green-600", icon: "🌱" },
                  N4: { bg: "bg-blue-500 hover:bg-blue-600", icon: "📗" },
                  N3: { bg: "bg-purple-500 hover:bg-purple-600", icon: "📘" },
                };
                const s = dialogueColors[ds.level] ?? { bg: "bg-gray-500 hover:bg-gray-600", icon: "💬" };
                return (
                  <button
                    key={ds.level}
                    onClick={() => navigate(`/dialogue/${ds.level.toLowerCase()}`)}
                    className={`${s.bg} text-white rounded-2xl p-4 text-center transition-colors tap-active shadow-sm`}
                  >
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className="text-lg font-bold">{ds.level}</div>
                    <div className="text-xs opacity-80 mt-0.5">{ds.dialogues.length} 個對話</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 動詞變化 */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">動詞變化</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">三類動詞活用規則、常用單字與完整變化表</p>
            </div>
            <button
              onClick={() => navigate("/verb-conjugation")}
              className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-2xl p-5 flex items-center gap-4 transition-colors tap-active shadow-sm"
            >
              <div className="text-4xl">🔄</div>
              <div className="text-left">
                <div className="text-lg font-bold">動詞活用表</div>
                <div className="text-xs opacity-80 mt-0.5">第一類・第二類・第三類，共 28 個常用動詞</div>
              </div>
              <svg className="w-5 h-5 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* 跟讀練習 Shadowing */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">跟讀練習</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">逐句跟讀，加強口說與聽力</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* YouTube 自由跟讀 */}
              <button
                onClick={() => navigate("/shadowing/youtube")}
                className="col-span-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 flex items-center gap-4 transition-colors tap-active shadow-sm"
              >
                <span className="text-3xl">📺</span>
                <div className="text-left">
                  <div className="text-lg font-bold">YouTube 自由跟讀</div>
                  <div className="text-xs opacity-80">貼上有日文 CC 的 YouTube 影片</div>
                </div>
              </button>
              {(["N5", "N4", "N3"] as const).map((lvl) => {
                const shadowColors: Record<string, { bg: string; icon: string }> = {
                  N5: { bg: "bg-green-500 hover:bg-green-600", icon: "🎙️" },
                  N4: { bg: "bg-blue-500 hover:bg-blue-600", icon: "🎤" },
                  N3: { bg: "bg-purple-500 hover:bg-purple-600", icon: "🔊" },
                };
                const s = shadowColors[lvl];
                return (
                  <button
                    key={lvl}
                    onClick={() => navigate(`/shadowing/${lvl.toLowerCase()}`)}
                    className={`${s.bg} text-white rounded-2xl p-4 text-center transition-colors tap-active shadow-sm`}
                  >
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className="text-lg font-bold">{lvl}</div>
                    <div className="text-xs opacity-80 mt-0.5">3 篇文章</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 克漏字測驗 */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">克漏字測驗</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">選出正確文法填入空格，每回 20 題</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["N5", "N4", "N3"] as const).map((lvl) => {
                const grammarColors: Record<string, { bg: string; icon: string }> = {
                  N5: { bg: "bg-green-500 hover:bg-green-600", icon: "✏️" },
                  N4: { bg: "bg-blue-500 hover:bg-blue-600", icon: "📝" },
                  N3: { bg: "bg-purple-500 hover:bg-purple-600", icon: "🖊️" },
                };
                const s = grammarColors[lvl];
                return (
                  <button
                    key={lvl}
                    onClick={() => navigate(`/grammar/${lvl.toLowerCase()}`)}
                    className={`${s.bg} text-white rounded-2xl p-4 text-center transition-colors tap-active shadow-sm`}
                  >
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className="text-lg font-bold">{lvl}</div>
                    <div className="text-xs opacity-80 mt-0.5">20 題克漏字</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 日本旅遊推薦 */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">日本旅遊推薦</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">點擊都道府縣，探索日本各地旅遊資訊</p>
            </div>
            <button
              onClick={() => navigate("/japan-travel")}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white rounded-2xl p-5 flex items-center gap-4 transition-colors tap-active shadow-sm"
            >
              <div className="text-4xl">🗾</div>
              <div className="text-left">
                <div className="text-lg font-bold">日本地圖</div>
                <div className="text-xs opacity-80 mt-0.5">47 都道府縣・景點・美食・最佳季節</div>
              </div>
              <svg className="w-5 h-5 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* 聽力練習 */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">聽力練習</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">聽日文選出正確中文，訓練聽解力</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {dialogueDatasets.map((ds) => {
                const listeningColors: Record<string, { bg: string; icon: string }> = {
                  N5: { bg: "bg-teal-500 hover:bg-teal-600", icon: "👂" },
                  N4: { bg: "bg-cyan-500 hover:bg-cyan-600", icon: "🎧" },
                  N3: { bg: "bg-indigo-500 hover:bg-indigo-600", icon: "🎵" },
                };
                const s = listeningColors[ds.level] ?? { bg: "bg-gray-500 hover:bg-gray-600", icon: "🔊" };
                return (
                  <button
                    key={ds.level}
                    onClick={() => navigate(`/listening/${ds.level.toLowerCase()}`)}
                    className={`${s.bg} text-white rounded-2xl p-4 text-center transition-colors tap-active shadow-sm`}
                  >
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className="text-lg font-bold">{ds.level}</div>
                    <div className="text-xs opacity-80 mt-0.5">100 題聽力</div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
