import { useNavigate, useParams } from "react-router-dom";
import { useDialoguesByLevel, useDialogueDatasetByLevel } from "../hooks/useDialogues";

const levelColors: Record<string, string> = {
  N5: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  N4: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  N3: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

export default function DialogueListPage() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const upperLevel = (level ?? "").toUpperCase();
  const dataset = useDialogueDatasetByLevel(upperLevel);
  const dialogues = useDialoguesByLevel(upperLevel);

  if (!dataset) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-5xl mb-4">🗂️</div>
        <p className="font-medium">找不到對話資料集</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${levelColors[upperLevel] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
            {upperLevel}
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            {dataset.name}
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {dialogues.length} 個對話情境，點擊開始練習
        </p>
      </div>

      {/* Dialogue list */}
      <div className="space-y-3">
        {dialogues.map((dialogue, idx) => (
          <button
            key={dialogue.id}
            onClick={() => navigate(`/dialogue/${level}/${dialogue.id}`)}
            className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all tap-active"
          >
            <div className="flex items-start gap-3">
              {/* Index number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {dialogue.title}
                  </h3>
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-medium truncate">
                    {dialogue.titleJp}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {dialogue.situation}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                  <span>💬 {dialogue.lines.length} 句</span>
                  {dialogue.keyPhrases && dialogue.keyPhrases.length > 0 && (
                    <span>🔑 {dialogue.keyPhrases.length} 個重點句型</span>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
