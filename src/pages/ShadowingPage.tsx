import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { shadowingArticles } from "../data/shadowing";
import type { ShadowingSegment } from "../data/shadowing";
import RubyText from "../components/RubyText";
import RubyTextAuto from "../components/RubyTextAuto";
import YouTubePlayer from "../components/YouTubePlayer";

// ── SRT parser ───────────────────────────────────────────────────────────────
function parseSrt(text: string): ShadowingSegment[] {
  // Normalise line endings, decode common HTML entities
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  const timeRe = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/;
  const segs: ShadowingSegment[] = [];
  const blocks = src.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((l) => timeRe.test(l));
    if (!timeLine) continue;
    const m = timeLine.match(timeRe)!;
    const toSec = (h: string, min: string, s: string, ms: string) =>
      parseInt(h) * 3600 + parseInt(min) * 60 + parseInt(s) + parseInt(ms) / 1000;
    const start = toSec(m[1], m[2], m[3], m[4]);
    const end   = toSec(m[5], m[6], m[7], m[8]);
    const textLines = lines.filter((l) => !timeRe.test(l) && !/^\d+$/.test(l.trim()) && l.trim());
    const text = textLines.join(" ").replace(/<[^>]+>/g, "").trim();
    if (text) segs.push({ text, zh: "", start, end });
  }
  return segs;
}

// Web Speech API STT type stubs
interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionEvent {
  results: { length: number; [i: number]: { [j: number]: { transcript: string } } };
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25] as const;
type Speed = (typeof SPEEDS)[number];

// ── Voice helpers ────────────────────────────────────────────────────────────
function getJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const name of ["Kyoko", "Google 日本語", "O-Ren", "Otoya", "Hattori"]) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith("ja"));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("ja")) ?? null;
}

// ── Extract YouTube video ID from URL or plain ID ───────────────────────────
function parseYouTubeId(input: string): string | null {
  input = input.trim();
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input.startsWith("http") ? input : "https://" + input);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0].slice(0, 11) || null;
    return url.searchParams.get("v") ??
      (url.pathname.match(/(?:embed|v)\/([^/?]+)/)?.[1] ?? null);
  } catch {
    return null;
  }
}

// ── YouTube JSON3 caption event ───────────────────────────────────────────────
interface YTCaptionEvent {
  tStartMs: number;
  dDurationMs?: number;
  segs?: { utf8?: string }[];
}

// Explicit proxy URL (Cloudflare Worker) or auto-detect /api/captions on the
// same origin (works automatically when deployed to Vercel).
// On GitHub Pages the /api/captions path returns 404 → graceful error fallback.
const EXPLICIT_PROXY = import.meta.env.VITE_CAPTION_PROXY_URL as string | undefined;
function getCaptionProxyUrl(): string {
  return EXPLICIT_PROXY ?? `${window.location.origin}/api/captions`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ShadowingPage() {
  const { level, articleId } = useParams<{ level: string; articleId: string }>();
  const article = shadowingArticles.find((a) => a.id === articleId);

  const isYouTubeMode = !article; // /shadowing/youtube route — no article

  // YouTube state
  const [ytId, setYtId] = useState<string>(article?.youtubeId ?? "");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(isYouTubeMode);
  const [videoTime, setVideoTime] = useState(0);

  // YouTube caption state — loading is set eagerly when ytId changes (in event handlers)
  const [ytCaptions, setYtCaptions] = useState<ShadowingSegment[] | null>(null);
  const [captionStatus, setCaptionStatus] = useState<"idle" | "loading" | "ok" | "error" | "no-proxy">(
    // Lazy init: if the article ships a youtubeId, captions fetch starts immediately
    () => (article?.youtubeId ? "loading" : "idle")
  );

  // SRT file upload
  const srtInputRef = useRef<HTMLInputElement>(null);

  const handleSrtFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const segs = parseSrt(text);
      if (segs.length > 0) {
        setYtCaptions(segs);
        setCaptionStatus("ok");
      }
    };
    reader.readAsText(file, "utf-8");
    // Reset so same file can be re-uploaded
    e.target.value = "";
  };

  // Live STT (speech-to-text) state — fallback when CC unavailable
  const [sttActive, setSttActive] = useState(false);
  const [sttText, setSttText] = useState<string[]>([]);
  const sttRef = useRef<ISpeechRecognition | null>(null);

  // TTS state
  const [ttsIdx, setTtsIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(0.75);

  // voicesReady — use lazy initializer so we don't call setState synchronously in an effect
  const [voicesReady, setVoicesReady] = useState(
    () => !!(typeof window !== "undefined" && window.speechSynthesis?.getVoices()?.length)
  );

  // Display
  const [showZH, setShowZH] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [autoNext, setAutoNext] = useState(true);

  // For scrolling current segment into view
  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Stable ref to speakSegment — breaks the useCallback self-reference cycle
  const speakSegmentRef = useRef<((idx: number) => void) | null>(null);

  // ── STT helpers ────────────────────────────────────────────────────────────
  const startStt = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: ISpeechRecognitionEvent) => {
      const lines: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        lines.push(e.results[i][0].transcript);
      }
      setSttText(lines);
    };
    rec.onend = () => {
      // auto-restart if still active
      if (sttRef.current) rec.start();
    };
    rec.onerror = () => { setSttActive(false); sttRef.current = null; };
    rec.start();
    sttRef.current = rec;
    setSttActive(true);
  }, []);

  const stopStt = useCallback(() => {
    sttRef.current?.stop();
    sttRef.current = null;
    setSttActive(false);
  }, []);

  // Cleanup STT on unmount
  useEffect(() => () => { sttRef.current?.stop(); }, []);

  // ── Listen for voices (no synchronous setState) ───────────────────────────
  useEffect(() => {
    const onVoicesChanged = () => setVoicesReady(true);
    window.speechSynthesis?.addEventListener("voiceschanged", onVoicesChanged);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", onVoicesChanged);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Fetch YouTube captions via proxy when ytId changes ───────────────────
  // Strategy: proxy tries youtube-transcript first. If that fails (transcript
  // disabled), it returns a signed captionUrl for the browser to fetch directly.
  useEffect(() => {
    if (!ytId) return;
    let cancelled = false;
    const proxyUrl = getCaptionProxyUrl();

    function parseEvents(events: YTCaptionEvent[]): ShadowingSegment[] {
      return events
        .filter((e) => Array.isArray(e.segs))
        .map((e) => ({
          text: (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim(),
          zh: "",
          start: e.tStartMs / 1000,
          end: (e.tStartMs + (e.dDurationMs ?? 3000)) / 1000,
        }))
        .filter((s) => s.text.length > 0);
    }

    fetch(`${proxyUrl}?v=${ytId}&lang=ja`)
      .then((r) => {
        if (cancelled) return null;
        if (r.status === 404) throw new Error("no-proxy");
        if (!r.ok) throw new Error(`http-${r.status}`);
        return r.json() as Promise<{
          events?: YTCaptionEvent[];
          error?: string;
          captionUrl?: string;
          captionUrlJson3?: string;
        }>;
      })
      .then((data) => {
        if (cancelled || !data) return;

        // If proxy returned events directly (youtube-transcript succeeded)
        const events = data.events ?? [];
        if (events.length > 0) {
          const segs = parseEvents(events);
          if (segs.length > 0) { setYtCaptions(segs); setCaptionStatus("ok"); return; }
        }

        // If proxy returned a signed captionUrl → browser fetches it directly
        if (data.captionUrlJson3 || data.captionUrl) {
          const url = data.captionUrlJson3 || data.captionUrl!;
          return fetch(url)
            .then((r2) => r2.text())
            .then((text) => {
              if (cancelled) return;
              if (!text || text.length === 0) throw new Error("no-captions");
              let json3: { events?: YTCaptionEvent[] };
              if (text.trimStart().startsWith("{")) {
                json3 = JSON.parse(text);
              } else {
                // XML/TTML fallback: parse <text start="..." dur="...">
                const re = /<text[^>]+start="([^"]+)"[^>]*(?:dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/g;
                const evts: YTCaptionEvent[] = [];
                let m: RegExpExecArray | null;
                while ((m = re.exec(text)) !== null) {
                  const st = parseFloat(m[1]) * 1000;
                  const dur = m[2] ? parseFloat(m[2]) * 1000 : 3000;
                  const txt = m[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
                  if (txt) evts.push({ tStartMs: st, dDurationMs: dur, segs: [{ utf8: txt }] });
                }
                json3 = { events: evts };
              }
              const segs = parseEvents(json3.events ?? []);
              if (segs.length === 0) throw new Error("no-captions");
              setYtCaptions(segs);
              setCaptionStatus("ok");
            });
        }

        if (data.error === "no_captions_found") throw new Error("no-captions");
        throw new Error("no-captions");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setYtCaptions(null);
        const msg = err instanceof Error ? err.message : "";
        setCaptionStatus(msg === "no-proxy" ? "no-proxy" : "error");
      });

    return () => { cancelled = true; };
  }, [ytId]);

  // Segments to display: real YouTube captions (if fetched) or article text
  const displaySegments: ShadowingSegment[] = useMemo(
    () => (ytId && ytCaptions ? ytCaptions : (article?.segments ?? [])),
    [ytId, ytCaptions, article],
  );

  // Determine currently highlighted segment
  const activeIdx = (() => {
    if (ytId && videoTime > 0) {
      for (let i = 0; i < displaySegments.length; i++) {
        const s = displaySegments[i];
        if (s.start != null && s.end != null) {
          if (videoTime >= s.start && videoTime < s.end) return i;
        }
      }
      return -1;
    }
    return ttsIdx;
  })();

  // Scroll active segment into view
  useEffect(() => {
    if (activeIdx >= 0) {
      segRefs.current[activeIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIdx]);

  // ── TTS playback ──────────────────────────────────────────────────────────
  const speakSegment = useCallback((idx: number) => {
    window.speechSynthesis.cancel();
    const segs = displaySegments;
    if (!segs[idx]) return;
    const utt = new SpeechSynthesisUtterance(segs[idx].text);
    utt.lang = "ja-JP";
    utt.rate = speed;
    if (voicesReady) {
      const v = getJapaneseVoice();
      if (v) utt.voice = v;
    }
    utt.onstart = () => { setTtsIdx(idx); setPlaying(true); };
    utt.onend = () => {
      if (repeatMode) {
        speakSegmentRef.current?.(idx);
      } else if (autoNext && idx + 1 < segs.length) {
        setTtsIdx(idx + 1);
        speakSegmentRef.current?.(idx + 1);
      } else {
        setPlaying(false);
        setTtsIdx(-1);
      }
    };
    utt.onerror = () => { setPlaying(false); setTtsIdx(-1); };
    window.speechSynthesis.speak(utt);
  }, [displaySegments, speed, voicesReady, repeatMode, autoNext]);

  // Keep ref in sync (useLayoutEffect = after render, before paint — safe for refs)
  useLayoutEffect(() => {
    speakSegmentRef.current = speakSegment;
  });

  const handleTtsPlay = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setTtsIdx(-1);
    } else {
      const start = ttsIdx >= 0 ? ttsIdx : 0;
      speakSegment(start);
    }
  };

  const handleSegmentClick = (idx: number) => {
    window.speechSynthesis.cancel();
    setTtsIdx(idx);
    setPlaying(false);
    speakSegment(idx);
  };

  const handleSpeedChange = (s: Speed) => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setTtsIdx(-1);
    setSpeed(s);
  };

  // ── YouTube URL submit (event handler — setState allowed freely) ───────────
  const handleUrlSubmit = () => {
    const id = parseYouTubeId(urlInput);
    if (id) {
      setYtId(id);
      setUrlInput("");
      setShowUrlInput(false);
      setVideoTime(0);
      setTtsIdx(-1);
      setPlaying(false);
      // Reset captions before new fetch
      setYtCaptions(null);
      setCaptionStatus("loading");
    }
  };

  const handleRemoveVideo = () => {
    setYtId("");
    setVideoTime(0);
    setYtCaptions(null);
    setCaptionStatus("idle");
  };

  const lvl = level?.toUpperCase() ?? "YT";
  const levelColor: Record<string, string> = { N5: "bg-green-500", N4: "bg-blue-500", N3: "bg-purple-500", YT: "bg-red-500" };

  // ── Render paragraph with inline highlighted spans ─────────────────────────
  const renderParagraph = (segs: ShadowingSegment[]) => (
    <p className="text-lg leading-[2.6] font-medium text-gray-800 dark:text-gray-200 tracking-wide">
      {segs.map((seg, idx) => {
        const isActive = idx === activeIdx;
        const isPast = activeIdx > 0 && idx < activeIdx;
        return (
          <span
            key={idx}
            ref={(el) => { segRefs.current[idx] = el; }}
            onClick={() => handleSegmentClick(idx)}
            className={`inline cursor-pointer rounded px-0.5 transition-colors duration-200 ${
              isActive
                ? "bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100"
                : isPast
                ? "text-gray-400 dark:text-gray-500"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {ytCaptions ? <RubyTextAuto text={seg.text} /> : <RubyText text={seg.text} />}
            {isActive && showZH && seg.zh && (
              <span className="text-sm text-blue-600 dark:text-blue-300 font-normal ml-1">
                （{seg.zh}）
              </span>
            )}
            {" "}
          </span>
        );
      })}
    </p>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${levelColor[lvl] ?? "bg-gray-500"} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
            {lvl}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">跟讀練習</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          {isYouTubeMode ? "YouTube 自由跟讀" : article.titleZH}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isYouTubeMode ? "貼上任何有日文 CC 的 YouTube 影片" : article.title}
        </p>
      </div>

      {/* YouTube video section */}
      <div className="mb-5">
        {ytId ? (
          <div>
            <YouTubePlayer
              videoId={ytId}
              onTimeUpdate={setVideoTime}
              onCaptionUrl={(url) => {
                // Only use player-provided URL if proxy already failed
                if (captionStatus !== "ok") {
                  setCaptionStatus("loading");
                  fetch(url, { credentials: "include" })
                    .then((r) => r.text())
                    .then((text) => {
                      if (!text || text.length < 10) return;
                      const parseEvents = (events: YTCaptionEvent[]) =>
                        events
                          .filter((e) => Array.isArray(e.segs))
                          .map((e) => ({
                            text: (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim(),
                            zh: "",
                            start: e.tStartMs / 1000,
                            end: (e.tStartMs + (e.dDurationMs ?? 3000)) / 1000,
                          }))
                          .filter((s) => s.text.length > 0);
                      let json3: { events?: YTCaptionEvent[] };
                      if (text.trimStart().startsWith("{")) {
                        json3 = JSON.parse(text);
                      } else {
                        const re2 = /<text[^>]+start="([^"]+)"[^>]*(?:dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/g;
                        const evts: YTCaptionEvent[] = [];
                        let m2: RegExpExecArray | null;
                        while ((m2 = re2.exec(text)) !== null) {
                          const st = parseFloat(m2[1]) * 1000;
                          const dur = m2[2] ? parseFloat(m2[2]) * 1000 : 3000;
                          const txt = m2[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
                          if (txt) evts.push({ tStartMs: st, dDurationMs: dur, segs: [{ utf8: txt }] });
                        }
                        json3 = { events: evts };
                      }
                      const segs = parseEvents(json3.events ?? []);
                      if (segs.length > 0) {
                        setYtCaptions(segs);
                        setCaptionStatus("ok");
                      } else {
                        setCaptionStatus("error");
                      }
                    })
                    .catch(() => setCaptionStatus("error"));
                }
              }}
              className="mb-2"
            />
            {captionStatus === "loading" && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">⏳ 載入 CC 字幕中…</p>
            )}
            {captionStatus === "no-proxy" && (
              <p className="text-xs text-orange-400 mb-1">
                ⚠ 請在 GitHub Secrets 設定 VITE_CAPTION_PROXY_URL — 前往「設定」查看完整步驟
              </p>
            )}
            {captionStatus === "error" && (
              <div className="mb-1 space-y-2">
                <p className="text-xs text-red-400">
                  ✗ 此影片無法取得 CC 字幕
                </p>
                {/* SRT upload (shown on error too) */}
                <button
                  onClick={() => srtInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors tap-active flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  📄 上傳字幕檔 (.srt)
                </button>
                <button
                  onClick={sttActive ? stopStt : startStt}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors tap-active flex items-center justify-center gap-2 ${
                    sttActive
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
                >
                  {sttActive ? "⏹ 停止辨識" : "🎤 即時語音辨識（需麥克風）"}
                </button>
              </div>
            )}
            {/* SRT upload button — available any time a video is loaded (even when CC ok) */}
            {captionStatus !== "error" && captionStatus !== "loading" && (
              <div className="mb-1 flex justify-end">
                <button
                  onClick={() => srtInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors tap-active"
                >
                  📄 上傳 .srt 字幕
                </button>
              </div>
            )}
            {/* Hidden SRT file input */}
            <input
              ref={srtInputRef}
              type="file"
              accept=".srt,.txt"
              className="hidden"
              onChange={handleSrtFile}
            />
            {/* ── Current subtitle / STT live display ── */}
            {(captionStatus === "ok" || sttActive || sttText.length > 0) && (
              <div className="mt-2 min-h-[60px] rounded-xl bg-black/80 dark:bg-black/90 flex items-center justify-center px-4 py-3">
                {captionStatus === "ok" && ytCaptions && activeIdx >= 0 && ytCaptions[activeIdx] ? (
                  <p className="text-white text-base font-semibold text-center leading-relaxed">
                    <RubyTextAuto text={ytCaptions[activeIdx].text} />
                  </p>
                ) : sttText.length > 0 ? (
                  <p className="text-white text-base font-semibold text-center leading-relaxed">
                    <RubyTextAuto text={sttText[sttText.length - 1]} />
                  </p>
                ) : sttActive ? (
                  <p className="text-gray-400 text-xs text-center animate-pulse">🎤 聆聽中…播放影片即可辨識</p>
                ) : captionStatus === "ok" ? (
                  <p className="text-gray-500 text-xs text-center">▶ 播放影片，字幕將即時顯示於此</p>
                ) : null}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>▶ 影片播放中，文字會自動跟著標記</span>
              <button
                onClick={handleRemoveVideo}
                className="text-red-400 hover:text-red-500 transition-colors"
              >
                移除影片
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">📺 加入 NHK 影片</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  貼上 YouTube 連結，影片播放時字幕自動亮起
                </p>
              </div>
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors tap-active"
              >
                貼上連結
              </button>
            </div>
            {showUrlInput && (
              <div className="flex gap-2 mt-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleUrlSubmit}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors tap-active"
                >
                  確定
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              推薦頻道：
              {" "}
              <a
                href="https://www.youtube.com/@NHK%E6%97%A5%E6%9C%AC%E8%AF%AD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                NHK日本語
              </a>
              {"　"}
              <a
                href="https://www.youtube.com/@NHKWorldJapan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                NHK World Japan
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Transcript / captions / STT paragraph */}
      {(displaySegments.length > 0 || sttText.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {sttText.length > 0 && captionStatus !== "ok" ? `語音辨識（${sttText.length} 句）` : captionStatus === "ok" ? `影片字幕（${ytCaptions?.length ?? 0} 句）` : "文章跟讀"}
            </span>
            {!ytCaptions && !isYouTubeMode && (
              <button
                onClick={() => setShowZH(!showZH)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  showZH
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                中文 {showZH ? "ON" : "OFF"}
              </button>
            )}
          </div>
          {displaySegments.length > 0 ? renderParagraph(displaySegments) : sttText.length > 0 ? (
            <p className="text-lg leading-[2.6] font-medium text-gray-800 dark:text-gray-200 tracking-wide">
              {sttText.map((line, i) => (
                <span key={i} className={`inline rounded px-0.5 ${i === sttText.length - 1 ? "bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100" : ""}`}>
                  <RubyTextAuto text={line} />{" "}
                </span>
              ))}
            </p>
          ) : null}
          {showZH && !ytCaptions && article && activeIdx < 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
              {article.segments.map((seg, idx) => (
                <p key={idx} className="text-xs text-gray-500 dark:text-gray-400">{seg.zh}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TTS Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {ytId ? "點擊文字段落跟著朗讀，或使用 TTS 逐句練習" : "點擊任一句跟著朗讀，或按下方播放逐句練習"}
        </p>

        {/* Speed + options */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  speed === s
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
          {/* Repeat */}
          <button
            onClick={() => setRepeatMode(!repeatMode)}
            title={repeatMode ? "單句循環 ON" : "單句循環 OFF"}
            className={`p-2 rounded-lg transition-colors ${
              repeatMode
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-500"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          {/* Auto-next */}
          <button
            onClick={() => setAutoNext(!autoNext)}
            title={autoNext ? "自動下一句 ON" : "自動下一句 OFF"}
            className={`p-2 rounded-lg transition-colors ${
              autoNext
                ? "bg-green-100 dark:bg-green-900/30 text-green-500"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954L4.683 15.788A1.125 1.125 0 013 14.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 0112.75 14.811V8.69z" />
            </svg>
          </button>
        </div>

        {/* Play button */}
        <button
          onClick={handleTtsPlay}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-colors tap-active flex items-center justify-center gap-2 ${
            playing
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {playing ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
              停止朗讀
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              🎙️ TTS 跟讀
            </>
          )}
        </button>
      </div>
    </div>
  );
}
