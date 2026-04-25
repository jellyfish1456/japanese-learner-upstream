import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasetMetas, useDatasets } from "../hooks/useDatasets";
import { useDialogueDatasets } from "../hooks/useDialogues";
import DatasetCard from "../components/DatasetCard";
import FilterBar from "../components/FilterBar";

export default function HomePage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const datasets = useDatasets();
  const metas = useDatasetMetas(categoryFilter || undefined, levelFilter || undefined);
  const navigate = useNavigate();

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
                    <div className="text-xs opacity-80 mt-0.5">10 題聽力</div>
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
