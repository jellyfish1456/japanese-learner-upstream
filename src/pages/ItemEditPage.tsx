import { useParams, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { useDatasetCrud, isBuiltinDataset } from "../hooks/useDatasetCrud";
import ItemForm from "../components/ItemForm";
import type { VocabItem, GrammarItem } from "../types";

export default function ItemEditPage() {
  const { datasetId, itemId } = useParams<{ datasetId: string; itemId?: string }>();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");
  const crud = useDatasetCrud();

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到學習集</p>
      </div>
    );
  }

  const isEditing = !!itemId;
  const existingItem = isEditing
    ? dataset.data.find((it) => it.id === itemId)
    : undefined;

  if (isEditing && !existingItem) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到該項目</p>
      </div>
    );
  }

  const isBuiltin = isBuiltinDataset(dataset.id);
  const builtinFallback = isBuiltin ? dataset : undefined;

  const handleSave = (data: Omit<VocabItem, "id"> | Omit<GrammarItem, "id">) => {
    if (isEditing && itemId) {
      crud.editItem(dataset.id, itemId, data as Partial<VocabItem> | Partial<GrammarItem>, builtinFallback);
    } else {
      crud.addItem(dataset.id, data, builtinFallback);
    }
    navigate(`/manage/${dataset.id}`, { replace: true });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          {isEditing ? "編輯項目" : "新增項目"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dataset.name}</p>
      </div>

      <ItemForm
        category={dataset.category}
        initialData={existingItem as VocabItem | GrammarItem | undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
