import { useState } from "react";
import type { VocabItem, GrammarItem, GrammarExample, Category } from "../types";
import { isVocabItem } from "../types";

interface ItemFormProps {
  category: Category;
  initialData?: VocabItem | GrammarItem;
  onSave: (data: Omit<VocabItem, "id"> | Omit<GrammarItem, "id">) => void;
  onCancel: () => void;
}

function InputField({ label, value, onChange, required, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
      />
    </div>
  );
}

export default function ItemForm({ category, initialData, onSave, onCancel }: ItemFormProps) {
  const isMix = category === "mix";
  // For mix, detect initial item type from data; default to "vocabulary" for new items
  const initialItemType: "vocabulary" | "grammar" =
    isMix && initialData
      ? (isVocabItem(initialData) ? "vocabulary" : "grammar")
      : (category === "grammar" ? "grammar" : "vocabulary");
  const [itemType, setItemType] = useState<"vocabulary" | "grammar">(initialItemType);
  const isVocab = isMix ? itemType === "vocabulary" : category === "vocabulary";

  const [japanese, setJapanese] = useState(initialData?.japanese ?? "");
  const [hiragana, setHiragana] = useState(
    isVocab ? (initialData as VocabItem)?.hiragana ?? "" : "",
  );
  const [simpleChinese, setSimpleChinese] = useState(initialData?.simple_chinese ?? "");
  const [fullExplanation, setFullExplanation] = useState(initialData?.full_explanation ?? "");
  const [examples, setExamples] = useState<GrammarExample[]>(
    !isVocab ? (initialData as GrammarItem)?.examples ?? [{ sentence: "", chinese: "" }] : [],
  );

  const handleTypeSwitch = (newType: "vocabulary" | "grammar") => {
    if (newType === itemType) return;
    setItemType(newType);
    if (newType === "vocabulary") {
      setExamples([]);
    } else {
      setHiragana("");
      setExamples([{ sentence: "", chinese: "" }]);
    }
  };

  const isValid = isVocab
    ? japanese.trim() && hiragana.trim() && simpleChinese.trim()
    : japanese.trim() && simpleChinese.trim();

  const handleSave = () => {
    if (!isValid) return;

    if (isVocab) {
      const data: Omit<VocabItem, "id"> = {
        japanese: japanese.trim(),
        hiragana: hiragana.trim(),
        simple_chinese: simpleChinese.trim(),
        full_explanation: fullExplanation.trim(),
      };
      onSave(data);
    } else {
      const filteredExamples = examples.filter((ex) => ex.sentence.trim() || ex.chinese.trim());
      const data: Omit<GrammarItem, "id"> = {
        japanese: japanese.trim(),
        simple_chinese: simpleChinese.trim(),
        full_explanation: fullExplanation.trim(),
        examples: filteredExamples,
      };
      onSave(data);
    }
  };

  const updateExample = (index: number, field: keyof GrammarExample, value: string) => {
    setExamples((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));
  };

  const addExample = () => {
    setExamples((prev) => [...prev, { sentence: "", chinese: "" }]);
  };

  const removeExample = (index: number) => {
    setExamples((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {isMix && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">項目類型</label>
          <div className="flex gap-2">
            {(["vocabulary", "grammar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeSwitch(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  itemType === t
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {t === "vocabulary" ? "詞彙" : "文法"}
              </button>
            ))}
          </div>
        </div>
      )}

      <InputField label="日文" value={japanese} onChange={setJapanese} required placeholder="例：食べる" />

      {isVocab && (
        <InputField label="平假名" value={hiragana} onChange={setHiragana} required placeholder="例：たべる" />
      )}

      <InputField label="中文意思" value={simpleChinese} onChange={setSimpleChinese} required placeholder="例：吃" />

      <TextAreaField label="詳細說明" value={fullExplanation} onChange={setFullExplanation} placeholder="選填，可加入更多解釋" />

      {!isVocab && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">例句</label>
            <button
              onClick={addExample}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
            >
              + 新增例句
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            用【】標記文法重點，例：勉強している【うちに】眠くなった
          </p>
          <div className="space-y-3">
            {examples.map((ex, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={ex.sentence}
                      onChange={(e) => updateExample(i, "sentence", e.target.value)}
                      placeholder="日文例句（用【】標記文法）"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={ex.chinese}
                      onChange={(e) => updateExample(i, "chinese", e.target.value)}
                      placeholder="中文翻譯"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {examples.length > 1 && (
                    <button
                      onClick={() => removeExample(i)}
                      className="mt-1 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="刪除例句"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors tap-active"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors tap-active ${
            isValid
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          儲存
        </button>
      </div>
    </div>
  );
}
