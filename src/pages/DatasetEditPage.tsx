import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { useDatasetCrud, isBuiltinDataset } from "../hooks/useDatasetCrud";
import ConfirmDialog from "../components/ConfirmDialog";
import type { VocabItem, GrammarItem } from "../types";

const categoryLabels: Record<string, string> = {
  vocabulary: "詞彙",
  grammar: "文法",
};

const categoryColors: Record<string, string> = {
  vocabulary: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  grammar: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function DatasetEditPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");
  const crud = useDatasetCrud();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // item ID
  const [showDeleteDataset, setShowDeleteDataset] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到學習集</p>
      </div>
    );
  }

  const isBuiltin = isBuiltinDataset(dataset.id);
  const hasCustomCopy = crud.hasCustomCopy(dataset.id);

  const handleDeleteItem = (itemId: string) => {
    crud.deleteItem(dataset.id, itemId, isBuiltin ? dataset : undefined);
    setDeleteTarget(null);
  };

  const handleDeleteDataset = () => {
    crud.deleteDataset(dataset.id);
    setShowDeleteDataset(false);
    navigate("/", { replace: true });
  };

  const handleResetBuiltin = () => {
    crud.resetToBuiltin(dataset.id);
    setShowResetConfirm(false);
  };

  const getItemSummary = (item: VocabItem | GrammarItem) => {
    if (dataset.category === "vocabulary") {
      const v = item as VocabItem;
      return { primary: v.japanese, secondary: `${v.hiragana} — ${v.simple_chinese}` };
    }
    const g = item as GrammarItem;
    return { primary: g.japanese, secondary: g.simple_chinese };
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[dataset.category] ?? ""}`}>
            {categoryLabels[dataset.category] ?? dataset.category}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {dataset.level}
          </span>
          {isBuiltin && hasCustomCopy && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
              已修改
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{dataset.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dataset.data.length} 個項目</p>
      </div>

      {/* Actions bar */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => navigate(`/manage/${dataset.id}/item`)}
          className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active text-sm"
        >
          + 新增項目
        </button>
        {!isBuiltin && (
          <button
            onClick={() => setShowDeleteDataset(true)}
            className="py-2.5 px-4 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors tap-active text-sm"
          >
            刪除學習集
          </button>
        )}
        {isBuiltin && hasCustomCopy && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="py-2.5 px-4 rounded-xl border-2 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors tap-active text-sm"
          >
            還原預設
          </button>
        )}
      </div>

      {isBuiltin && !hasCustomCopy && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          這是內建學習集。修改後會儲存在本地，可隨時還原為預設。
        </p>
      )}

      {/* Item list */}
      {dataset.data.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p>尚未新增任何項目</p>
          <p className="text-sm mt-1">點擊上方「新增項目」開始添加</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dataset.data.map((item) => {
            const summary = getItemSummary(item as VocabItem | GrammarItem);
            return (
              <div
                key={item.id}
                className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-50 truncate">{summary.primary}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{summary.secondary}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => navigate(`/manage/${dataset.id}/item/${item.id}`)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="編輯"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="刪除"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete item confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message="確定要刪除這個項目嗎？此操作無法復原。"
          onConfirm={() => handleDeleteItem(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Delete dataset confirmation */}
      {showDeleteDataset && (
        <ConfirmDialog
          message="確定要刪除整個學習集嗎？所有項目和學習進度都會消失。"
          confirmLabel="刪除學習集"
          onConfirm={handleDeleteDataset}
          onCancel={() => setShowDeleteDataset(false)}
        />
      )}

      {/* Reset to builtin confirmation */}
      {showResetConfirm && (
        <ConfirmDialog
          message="確定要還原為預設資料嗎？所有修改將會消失。"
          confirmLabel="還原預設"
          onConfirm={handleResetBuiltin}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
