import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasetMetas, useDatasets } from "../hooks/useDatasets";
import DatasetCard from "../components/DatasetCard";
import FilterBar from "../components/FilterBar";

export default function HomePage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const datasets = useDatasets();
  const metas = useDatasetMetas(categoryFilter || undefined, levelFilter || undefined);
  const navigate = useNavigate();

  // Extract unique categories and levels for filter bar
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
    </div>
  );
}
