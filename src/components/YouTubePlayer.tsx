import { useEffect, useRef, useState } from "react";

// ── YT IFrame API type stubs ──────────────────────────────────────────────────
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
  getPlayerState(): number;
}

let ytApiLoading: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiLoading) return ytApiLoading;
  ytApiLoading = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = resolve;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return ytApiLoading;
}

interface Props {
  videoId: string;
  onTimeUpdate?: (t: number) => void;
  onDuration?: (d: number) => void;
  className?: string;
}

export default function YouTubePlayer({ videoId, onTimeUpdate, onDuration, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !containerRef.current) return;
      const div = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(div);

      playerRef.current = new window.YT.Player(div, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          cc_load_policy: 1,
          cc_lang_pref: "ja",
        },
        events: {
          onReady: (e) => {
            if (destroyed) return;
            onDuration?.(e.target.getDuration());
          },
          onStateChange: (e) => {
            // state 1 = PLAYING
            if (e.data === 1) {
              pollRef.current = setInterval(() => {
                if (playerRef.current && !destroyed) {
                  onTimeUpdate?.(playerRef.current.getCurrentTime());
                }
              }, 250);
            } else {
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            }
          },
          onError: () => setError(true),
        },
      });
    });

    return () => {
      destroyed = true;
      if (pollRef.current) clearInterval(pollRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm p-8 ${className}`}>
        影片載入失敗，請確認影片 ID 是否正確
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-xl overflow-hidden bg-black ${className}`}
      style={{ aspectRatio: "16/9" }}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
