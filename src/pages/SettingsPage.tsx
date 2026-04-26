import { useDarkMode } from "../hooks/useDarkMode";
import { useSettings } from "../hooks/useSettings";

const APP_VERSION = "CH20260426-1";

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const SPEECH_RATES = [0.5, 0.75, 0.9, 1.0, 1.25] as const;

export default function SettingsPage() {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">設定</h2>

      {/* General Settings */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">一般設定</h3>
      <div className="space-y-1 mb-6">
        <div className="flex items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-50">深色模式</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">切換深色／淺色主題</div>
          </div>
          <ToggleSwitch checked={isDark} onChange={toggleDark} />
        </div>

        <div className="flex items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-50">滑動提示</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">滑動卡片時顯示顏色與文字提示</div>
          </div>
          <ToggleSwitch
            checked={settings.showSwipeAssist}
            onChange={() => updateSettings({ showSwipeAssist: !settings.showSwipeAssist })}
          />
        </div>

        {/* Speech rate */}
        <div className="py-4 px-4 bg-white dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-50">朗讀語速</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">日文發音按鈕的播放速度</div>
            </div>
            <span className="text-sm font-semibold text-blue-500">{settings.speechRate ?? 0.9}x</span>
          </div>
          <div className="flex gap-2">
            {SPEECH_RATES.map((r) => (
              <button
                key={r}
                onClick={() => updateSettings({ speechRate: r })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  (settings.speechRate ?? 0.9) === r
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Google Drive Sync — disabled notice */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Google 雲端同步</h3>
      <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🚧</span>
        <div>
          <div className="font-medium text-amber-800 dark:text-amber-300 text-sm">功能暫時停用</div>
          <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Google Drive 同步目前無法使用，將在後續版本中修復。</div>
        </div>
      </div>

      {/* App info */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">關於</h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">應用程式版本</span>
          <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">{APP_VERSION}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">名稱</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">Chris 每日日文學習</span>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">版本號格式：CH[日期]-[更新次數]</p>
        </div>
      </div>
    </div>
  );
}
