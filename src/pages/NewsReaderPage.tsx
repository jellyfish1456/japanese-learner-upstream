import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { shadowingArticles } from "../data/shadowing";
import RubyTextAuto from "../components/RubyTextAuto";

// ── Voice helper ──────────────────────────────────────────────────────────────
function getJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const name of ["Kyoko", "Google 日本語", "O-Ren", "Otoya", "Hattori"]) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith("ja"));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("ja")) ?? null;
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25] as const;
type Speed = (typeof SPEEDS)[number];

export default function NewsReaderPage() {
  const { level, articleId } = useParams<{ level: string; articleId: string }>();
  const navigate = useNavigate();

  const article = shadowingArticles.find(
    (a) => a.id === articleId && a.level === (level?.toUpperCase() ?? "N5"),
  );

  const [activeIdx, setActiveIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [speed, setSpeed] = useState<Speed>(0.9 as Speed);

  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeIdxRef = useRef(-1);
  const playingRef = useRef(false);
  const speedRef = useRef(speed);
  const articleRef = useRef(article);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { articleRef.current = article; }, [article]);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  // Scroll active sentence into view
  useEffect(() => {
    if (activeIdx >= 0) {
      sentenceRefs.current[activeIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIdx]);

  // Scroll to top when article changes
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [articleId]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Use a stable ref so onend can call speakSegment without circular dependency
  const speakSegmentRef = useRef<(idx: number) => void>(() => {});

  const speakSegment = useCallback((idx: number) => {
    const art = articleRef.current;
    if (!art || idx >= art.segments.length) {
      setPlaying(false);
      setActiveIdx(-1);
      return;
    }
    setActiveIdx(idx);

    window.speechSynthesis.cancel();
    const seg = art.segments[idx];
    const utt = new SpeechSynthesisUtterance(seg.text);
    utt.lang = "ja-JP";
    utt.rate = speedRef.current;

    const setVoice = () => {
      const v = getJapaneseVoice();
      if (v) utt.voice = v;
    };
    setVoice();
    if (!utt.voice) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }

    utt.onend = () => {
      if (!playingRef.current) return;
      const next = activeIdxRef.current + 1;
      speakSegmentRef.current(next);
    };
    utt.onerror = () => {
      setPlaying(false);
    };

    utterRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, []);

  // Keep ref in sync after declaration
  useEffect(() => {
    speakSegmentRef.current = speakSegment;
  }, [speakSegment]);

  const handlePlay = useCallback(() => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setActiveIdx(-1);
      return;
    }
    setPlaying(true);
    const startIdx = activeIdx >= 0 ? activeIdx : 0;
    speakSegment(startIdx);
  }, [playing, activeIdx, speakSegment]);

  const handlePrev = useCallback(() => {
    const prev = Math.max(0, activeIdx - 1);
    if (playing) {
      speakSegment(prev);
    } else {
      setActiveIdx(prev);
    }
  }, [activeIdx, playing, speakSegment]);

  const handleNext = useCallback(() => {
    if (!article) return;
    const next = Math.min(article.segments.length - 1, activeIdx + 1);
    if (playing) {
      speakSegment(next);
    } else {
      setActiveIdx(next);
    }
  }, [article, activeIdx, playing, speakSegment]);

  const handleSentenceClick = useCallback((idx: number) => {
    setPlaying(true);
    speakSegment(idx);
  }, [speakSegment]);

  if (!article) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-3">📰</div>
        <p>找不到文章</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold"
        >
          返回
        </button>
      </div>
    );
  }

  const levelColors: Record<string, string> = {
    N5: "bg-green-500",
    N4: "bg-blue-500",
    N3: "bg-purple-500",
  };
  const lvl = level?.toUpperCase() ?? "N5";
  const badgeColor = levelColors[lvl] ?? "bg-gray-500";

  return (
    <div className="pb-40">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        跟讀練習
      </button>

      {/* Article Header — Todaii style */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4">
        {/* Banner with emoji */}
        <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
          <span className="text-7xl">{article.emoji ?? "📰"}</span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-md`}>{lvl}</span>
            {article.date && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{article.date}</span>
            )}
            <a
              href="https://news.web.nhk/news/easy/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-blue-500 hover:underline flex items-center gap-0.5"
            >
              NHK News Easy
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6h6m0 0v6m0-6L9.75 14.25" />
              </svg>
            </a>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight mb-1">
            {showFurigana ? <RubyTextAuto text={article.title} /> : article.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{article.titleZH}</p>

          {/* Toggles */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowFurigana(!showFurigana)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showFurigana
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              <span>ふ</span>
              Show furigana
            </button>
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showTranslation
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              🈶 中文翻譯
            </button>
          </div>
        </div>
      </div>

      {/* Article body — full text, Todaii style */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          文章內容 · {article.segments.length} 句 · 點擊任意句朗讀
        </p>
        <div className="space-y-3">
          {article.segments.map((seg, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div
                key={idx}
                ref={(el) => { sentenceRefs.current[idx] = el; }}
                onClick={() => handleSentenceClick(idx)}
                className={`rounded-xl px-3 py-2.5 cursor-pointer transition-all select-none ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent"
                }`}
              >
                {/* Sentence number */}
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-medium leading-[2.4] ${isActive ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"}`}>
                      {showFurigana ? <RubyTextAuto text={seg.text} /> : seg.text}
                    </p>
                    {showTranslation && (
                      <p className={`text-xs mt-0.5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
                        {seg.zh}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-blue-500 animate-pulse">🔊</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom player — Todaii style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 pt-3 pb-6 shadow-2xl">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400 w-8 text-right">
              {activeIdx >= 0 ? activeIdx + 1 : 0}
            </span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{
                  width: activeIdx >= 0
                    ? `${((activeIdx + 1) / article.segments.length) * 100}%`
                    : "0%",
                }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8">{article.segments.length}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Speed */}
            <div className="flex gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    speed === s
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Prev */}
            <button
              onClick={handlePrev}
              disabled={activeIdx <= 0 && !playing}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 tap-active transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
              </svg>
            </button>

            {/* Play / Pause */}
            <button
              onClick={handlePlay}
              className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg text-white transition-colors tap-active ${
                playing ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {playing ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={!article || activeIdx >= article.segments.length - 1}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 tap-active transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
              </svg>
            </button>

            <div className="flex-1" />

            {/* Jump to shadowing mode */}
            <button
              onClick={() => navigate(`/shadowing/${level}/${articleId}`)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-colors tap-active"
              title="切換到跟讀練習模式"
            >
              🎙️ 跟讀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
