import { useState } from "react";
import { useGoogleSync } from "../hooks/useGoogleSync";
import ConfirmDialog from "./ConfirmDialog";
import type { SyncStatus } from "../lib/google/syncTypes";

const STATUS_LABELS: Record<SyncStatus, string> = {
  disconnected: "未連線",
  idle: "已同步",
  pulling: "下載中…",
  pushing: "上傳中…",
  error: "錯誤",
};

const STATUS_COLORS: Record<SyncStatus, string> = {
  disconnected: "bg-gray-400",
  idle: "bg-emerald-500",
  pulling: "bg-blue-500",
  pushing: "bg-blue-500",
  error: "bg-red-500",
};

export default function SyncSection() {
  const { syncState, signIn, signOut, manualSync, manualPush } = useGoogleSync();
  const [confirmAction, setConfirmAction] = useState<"sync" | "disconnect" | null>(null);

  const isBusy = syncState.status === "pulling" || syncState.status === "pushing";

  function handleSync() {
    setConfirmAction("sync");
  }

  function handleDisconnect() {
    setConfirmAction("disconnect");
  }

  function confirmHandler() {
    if (confirmAction === "sync") {
      manualSync();
    } else if (confirmAction === "disconnect") {
      signOut();
    }
    setConfirmAction(null);
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.01 1.485c-2.082 0-3.754.736-5.098 2.19-1.345 1.453-2.058 3.235-2.058 5.168v.127l-.04.003C2.75 9.14 1.5 10.57 1.5 12.3c0 1.897 1.457 3.45 3.282 3.6h3.268v-1.8H4.872c-.976-.09-1.572-.96-1.572-1.8 0-.97.786-1.8 1.782-1.8h1.236V8.97c0-1.47.534-2.73 1.542-3.81.886-.96 2.106-1.5 3.396-1.5s2.364.63 3.252 1.5c1.008 1.08 1.488 2.34 1.488 3.81v1.53h1.236c.996 0 1.782.83 1.782 1.8 0 .84-.596 1.71-1.572 1.8H14.25v1.8h3.018c1.825-.15 3.232-1.703 3.232-3.6 0-1.73-1.25-3.16-2.814-3.327l-.04-.003v-.127c0-1.933-.661-3.715-2.006-5.168C14.296 2.22 12.672 1.485 12.01 1.485z" />
              <path d="M8.997 16.08l.87-.87 1.635 1.635V11.49h1.2v5.355l1.635-1.635.87.87L12.01 19.275 8.997 16.08z" />
            </svg>
            <span className="font-medium text-gray-900 dark:text-gray-50">Google 雲端同步</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[syncState.status]}`}>
            {isBusy && (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
              </svg>
            )}
            {STATUS_LABELS[syncState.status]}
          </span>
        </div>

        {/* Connected state */}
        {syncState.isConnected ? (
          <>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <div>帳號：{syncState.email}</div>
              {syncState.lastSyncedAt && (
                <div>上次同步：{new Date(syncState.lastSyncedAt).toLocaleString("zh-TW")}</div>
              )}
            </div>

            {syncState.error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {syncState.error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={isBusy}
                className="flex-1 py-2 rounded-xl border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tap-active text-sm"
              >
                從雲端同步
              </button>
              <button
                onClick={manualPush}
                disabled={isBusy}
                className="flex-1 py-2 rounded-xl border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tap-active text-sm"
              >
                推送至雲端
              </button>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={isBusy}
              className="w-full py-2 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 tap-active"
            >
              解除連線
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              連結 Google 帳號，將學習進度同步至 Google 雲端硬碟，跨裝置使用。
            </p>

            {syncState.error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {syncState.error}
              </div>
            )}

            <button
              onClick={signIn}
              disabled={isBusy}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 tap-active flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              使用 Google 帳號登入
            </button>
          </>
        )}
      </div>

      {confirmAction === "sync" && (
        <ConfirmDialog
          message="從雲端下載資料將覆蓋本機所有資料（進度、設定、自訂題庫等），確定要繼續嗎？"
          confirmLabel="確定同步"
          onConfirm={confirmHandler}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === "disconnect" && (
        <ConfirmDialog
          message="解除連線後將停止自動同步。雲端資料不會被刪除，本機資料也會保留。"
          confirmLabel="解除連線"
          onConfirm={confirmHandler}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}
