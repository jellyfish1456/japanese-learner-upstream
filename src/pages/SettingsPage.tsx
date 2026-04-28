import { useDarkMode } from "../hooks/useDarkMode";
import { useSettings } from "../hooks/useSettings";
import SyncSection from "../components/SyncSection";

const APP_VERSION = "CH20260428-7";
const HAS_GOOGLE_ID   = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const HAS_CAPTION_PROXY = Boolean(import.meta.env.VITE_CAPTION_PROXY_URL);

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

function CaptionProxySetupGuide() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">📡</span>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">CC 字幕代理未設定</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            需要 4 個步驟，約 3 分鐘完成
          </p>
        </div>
      </div>
      <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">1</span>
          <span>
            前往{" "}
            <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              vercel.com/new
            </a>
            ，用 GitHub 登入 → Import{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">japanese-learner-upstream</code>
            {" "}→ Deploy
          </span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">2</span>
          <span>
            部署完成後，複製 Vercel 給的網址（例如{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">https://xxx.vercel.app</code>
            ），在後面加上{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">/api/captions</code>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">3</span>
          <span>
            GitHub repo →{" "}
            <strong>Settings → Secrets and variables → Actions</strong>
            {" "}→ New repository secret<br />
            名稱：<code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">VITE_CAPTION_PROXY_URL</code>
            ，值：上一步的完整網址
          </span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">4</span>
          <span>
            推送任何 commit 觸發 GitHub Pages 重新部署 → 字幕功能啟用 ✓
          </span>
        </li>
      </ol>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        已部署 Vercel？直接從步驟 2 開始即可。
      </p>
    </div>
  );
}

function GoogleSetupGuide() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔑</span>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">需要設定 Google OAuth 金鑰</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">完成以下步驟後，同步功能即可使用</p>
        </div>
      </div>
      <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
          <span>前往 <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a> → 建立新專案</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
          <span>啟用 <strong>Google Drive API</strong> 與 <strong>Google People API</strong></span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</span>
          <span>憑證 → 建立 OAuth 2.0 用戶端 ID（Web 應用程式）</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">4</span>
          <span>授權的 JavaScript 來源填入：<code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">https://jellyfish1456.github.io</code></span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">5</span>
          <span>複製 Client ID，前往 GitHub repo → Settings → Secrets → Actions，新增 <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">VITE_GOOGLE_CLIENT_ID</code></span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">6</span>
          <span>推送任何 commit 觸發重新部署，同步功能即可啟用 ✓</span>
        </li>
      </ol>
    </div>
  );
}

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

      {/* YouTube CC Caption Proxy */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">YouTube CC 字幕同步</h3>
      <div className="mb-6">
        {HAS_CAPTION_PROXY ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">字幕代理已啟用</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">貼上影片連結後將自動抓取 CC 字幕並同步顯示</p>
            </div>
          </div>
        ) : (
          <CaptionProxySetupGuide />
        )}
      </div>

      {/* Google Drive Sync */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Google 雲端同步</h3>
      <div className="mb-6">
        {HAS_GOOGLE_ID ? (
          <SyncSection />
        ) : (
          <GoogleSetupGuide />
        )}
      </div>

      {/* App info */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">關於</h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">版本號</span>
          <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">{APP_VERSION}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">名稱</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">Chris 每日日文學習</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700">
          版本格式：CH[日期]-[更新次數]
        </p>
      </div>
    </div>
  );
}
