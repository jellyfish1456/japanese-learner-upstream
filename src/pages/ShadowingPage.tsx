import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { shadowingArticles } from "../data/shadowing";
import RubyText from "../components/RubyText";

const SPEEDS = [0.5, 0.75, 1.0, 1.25] as const;
type Speed = (typeof SPEEDS)[number];

function getJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Prefer high-quality Japanese voices by priority
  const priority = ["Kyoko", "Google 日本語", "O-Ren", "Otoya", "Hattori"];
  for (const name of priority) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith("ja"));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("ja")) ?? null;
}

export default function ShadowingPage() {
  const { level, articleId } = useParams<{ level: string; articleId: string }>();
  const article = shadowingArticles.find((a) => a.id === articleId);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(0.75);
  const [showZH, setShowZH] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [repeatMode, setRepeatMode] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  const sentenceRef = useRef<HTMLDivElement>(null);

  // Load voices (needed on Chrome/Android where voices load async)
  useEffect(() => {
    const loaded = () => setVoicesReady(true);
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loaded);
    setVoicesReady(window.speechSynthesis.getVoices().length > 0);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loaded);
  }, []);

  // Stop speech on unmount
  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  // Scroll current sentence into view
  useEffect(() => {
    sentenceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIdx]);

  const speakSentence = useCallback((idx: number, autoAdvance: boolean) => {
    if (!article) return;
    window.speechSynthesis.cancel();
    const text = article.sentences[idx].jp;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ja-JP";
    utt.rate = speed;
    if (voicesReady) {
      const v = getJapaneseVoice();
      if (v) utt.voice = v;
    }
    utt.onstart = () => setPlaying(true);
    utt.onend = () => {
      if (autoAdvance && autoNext && !repeatMode) {
        const next = idx + 1;
        if (next < article.sentences.length) {
          setCurrentIdx(next);
          speakSentence(next, true);
        } else {
          setPlaying(false);
        }
      } else if (autoAdvance && repeatMode) {
        // Repeat the same sentence
        speakSentence(idx, true);
      } else {
        setPlaying(false);
      }
    };
    utt.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utt);
  }, [article, speed, voicesReady, autoNext, repeatMode]);

  const handlePlay = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
    } else {
      speakSentence(currentIdx, true);
    }
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    if (article && currentIdx < article.sentences.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const handleSelectSentence = (idx: number) => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setCurrentIdx(idx);
  };

  const handleSpeedChange = (s: Speed) => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setSpeed(s);
  };

  if (!article) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-3">🔍</div>
        <p>找不到該文章</p>
      </div>
    );
  }

  const levelColor: Record<string, string> = {
    N5: "bg-green-500",
    N4: "bg-blue-500",
    N3: "bg-purple-500",
  };
  const lvl = level?.toUpperCase() ?? "N5";

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Article header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`${levelColor[lvl] ?? "bg-gray-500"} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
            {lvl}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">跟讀練習</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{article.titleZH}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{article.title}</p>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
          <span>第 {currentIdx + 1} 句／共 {article.sentences.length} 句</span>
          <span>{Math.round(((currentIdx + 1) / article.sentences.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / article.sentences.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Sentences */}
      <div className="flex-1 space-y-2 mb-4">
        {article.sentences.map((sent, idx) => {
          const isCurrent = idx === currentIdx;
          const isPast = idx < currentIdx;
          return (
            <button
              key={idx}
              ref={isCurrent ? (sentenceRef as unknown as React.RefObject<HTMLButtonElement>) : undefined}
              onClick={() => handleSelectSentence(idx)}
              className={`w-full text-left rounded-2xl p-4 transition-all tap-active border ${
                isCurrent
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 shadow-sm"
                  : isPast
                  ? "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 opacity-60"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Sentence number */}
                <span
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isCurrent
                      ? "bg-blue-500 text-white"
                      : isPast
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {/* Japanese text with furigana */}
                  <div className={`text-base font-medium leading-loose ${
                    isCurrent
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-800 dark:text-gray-200"
                  }`}>
                    <RubyText text={sent.jp} />
                  </div>
                  {/* Chinese translation */}
                  {(showZH || isCurrent) && (
                    <div className={`text-sm mt-1 ${
                      isCurrent
                        ? "text-blue-600 dark:text-blue-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {sent.zh}
                    </div>
                  )}
                </div>
                {/* Playing indicator */}
                {isCurrent && playing && (
                  <div className="flex items-center gap-0.5 mt-2 flex-shrink-0">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-blue-500 rounded-full animate-bounce"
                        style={{ height: `${12 + i * 4}px`, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-3">
        {/* Speed + options */}
        <div className="flex items-center gap-2 justify-between">
          {/* Speed selector */}
          <div className="flex gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  speed === s
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
          {/* Options */}
          <div className="flex gap-2">
            {/* Show Chinese */}
            <button
              onClick={() => setShowZH(!showZH)}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showZH
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
              title="顯示中文"
            >
              中
            </button>
            {/* Auto-next */}
            <button
              onClick={() => setAutoNext(!autoNext)}
              className={`p-1.5 rounded-lg transition-colors ${
                autoNext
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
              title={autoNext ? "自動播下一句（開）" : "自動播下一句（關）"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
              </svg>
            </button>
            {/* Repeat */}
            <button
              onClick={() => setRepeatMode(!repeatMode)}
              className={`p-1.5 rounded-lg transition-colors ${
                repeatMode
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
              title={repeatMode ? "單句循環（開）" : "單句循環（關）"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main playback controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-30 transition-colors hover:border-gray-300 dark:hover:border-gray-500 tap-active"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 010-1.954l7.108-4.061A1.125 1.125 0 0121 8.689v8.122zM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 010-1.954l7.108-4.061a1.125 1.125 0 011.683.977v8.122z" />
            </svg>
          </button>

          <button
            onClick={handlePlay}
            className={`flex-1 py-3.5 rounded-xl font-semibold text-white transition-colors tap-active flex items-center justify-center gap-2 ${
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
                暫停
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
                播放跟讀
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={!article || currentIdx >= article.sentences.length - 1}
            className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-30 transition-colors hover:border-gray-300 dark:hover:border-gray-500 tap-active"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
