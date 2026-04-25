import { useRef, useCallback } from "react";

interface SeekableProgressBarProps {
  current: number;   // 0-based index
  total: number;
  onChange: (index: number) => void;
}

export default function SeekableProgressBar({ current, total, onChange }: SeekableProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const seek = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || total <= 1) return;
      const { left, width } = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
      const idx = Math.round(ratio * (total - 1));
      onChange(idx);
    },
    [total, onChange],
  );

  // Mouse
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      seek(e.clientX);
      const onMove = (ev: MouseEvent) => seek(ev.clientX);
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [seek],
  );

  // Touch
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      seek(e.touches[0].clientX);
      const onMove = (ev: TouchEvent) => seek(ev.touches[0].clientX);
      const onEnd = () => {
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
      };
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onEnd);
    },
    [seek],
  );

  const pct = total > 0 ? (current / Math.max(total - 1, 1)) * 100 : 0;

  // Show individual tick marks when total ≤ 40, otherwise just the bar
  const showTicks = total <= 40;

  return (
    <div className="mb-6 select-none">
      {/* Counter row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {current + 1} / {total}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          拖曳或點擊跳轉
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(((current + 1) / total) * 100)}%
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative h-8 flex items-center cursor-pointer group"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={total - 1}
        aria-valuenow={current}
      >
        {/* Background track */}
        <div className="absolute inset-x-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Tick marks */}
        {showTicks && (
          <div className="absolute inset-x-0 h-2 flex items-center">
            {Array.from({ length: total }).map((_, i) => {
              const pos = total > 1 ? (i / (total - 1)) * 100 : 0;
              const isVisited = i <= current;
              const isCurrent = i === current;
              return (
                <div
                  key={i}
                  className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 transition-all duration-150 ${
                    isCurrent
                      ? "w-3 h-3 bg-blue-500 dark:bg-blue-400 ring-2 ring-white dark:ring-gray-900 z-10"
                      : isVisited
                      ? "bg-gray-500 dark:bg-gray-300"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  style={{ left: `${pos}%` }}
                />
              );
            })}
          </div>
        )}

        {/* Thumb (always shown) */}
        {!showTicks && (
          <div
            className="absolute w-4 h-4 bg-gray-900 dark:bg-white rounded-full -translate-x-1/2 shadow-md z-10 group-hover:scale-110 transition-transform"
            style={{ left: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}
