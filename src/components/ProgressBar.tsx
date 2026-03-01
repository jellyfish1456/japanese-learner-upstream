interface ProgressBarProps {
  current: number;
  total: number;
  modeLabel?: string;
}

export default function ProgressBar({ current, total, modeLabel }: ProgressBarProps) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {current} / {total}
        </span>
        {modeLabel && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg" data-testid="mode-label">
            {modeLabel}
          </span>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
