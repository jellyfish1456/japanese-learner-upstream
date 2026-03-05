import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasetCrud } from "../hooks/useDatasetCrud";

export default function DatasetCreatePage() {
  const navigate = useNavigate();
  const { createDataset } = useDatasetCrud();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<"vocabulary" | "grammar">("vocabulary");
  const [level, setLevel] = useState("");

  const isValid = name.trim() && level.trim();

  const handleCreate = () => {
    if (!isValid) return;
    const id = createDataset(name.trim(), category, level.trim());
    navigate(`/manage/${id}`, { replace: true });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">新增學習集</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">建立一個新的詞彙或文法學習集</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：N5 動詞"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">類型</label>
          <div className="flex gap-2">
            {(["vocabulary", "grammar"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2 rounded-xl font-medium transition-colors ${
                  category === cat
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {cat === "vocabulary" ? "詞彙" : "文法"}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            級別 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="例：N5"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors tap-active"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors tap-active ${
              isValid
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            建立
          </button>
        </div>
      </div>
    </div>
  );
}
