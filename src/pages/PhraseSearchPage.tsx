import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { shadowingArticles } from "../data/shadowing";
import type { ShadowingArticle } from "../data/shadowing";

interface DialogueLine {
  speaker: string;
  japanese: string;
  chinese: string;
}

interface Dialogue {
  id: string;
  title: string;
  titleJp: string;
  situation: string;
  lines: DialogueLine[];
}

interface DialogueDataset {
  name: string;
  level: string;
  dialogues: Dialogue[];
}

const dialogueModules = import.meta.glob<DialogueDataset>(
  "../../data/dialogues/dialogue-*.json",
  { eager: true, import: "default" }
);

const allDialogues: { level: string; dialogue: Dialogue; }[] = [];
for (const mod of Object.values(dialogueModules)) {
  for (const d of mod.dialogues) {
    allDialogues.push({ level: mod.level, dialogue: d });
  }
}

interface ShadowingMatch {
  type: "shadowing";
  article: ShadowingArticle;
  segmentIndex: number;
  text: string;
  zh: string;
}

interface DialogueMatch {
  type: "dialogue";
  level: string;
  dialogue: Dialogue;
  lineIndex: number;
  speaker: string;
  text: string;
  zh: string;
}

type SearchMatch = ShadowingMatch | DialogueMatch;

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.indexOf(query);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5">{query}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function PhraseSearchPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo<SearchMatch[]>(() => {
    const q = submitted.trim();
    if (q.length < 2) return [];

    const matches: SearchMatch[] = [];

    for (const article of shadowingArticles) {
      for (let i = 0; i < article.segments.length; i++) {
        const seg = article.segments[i];
        if (seg.text.includes(q)) {
          matches.push({
            type: "shadowing",
            article,
            segmentIndex: i,
            text: seg.text,
            zh: seg.zh,
          });
        }
      }
    }

    for (const { level, dialogue } of allDialogues) {
      for (let i = 0; i < dialogue.lines.length; i++) {
        const line = dialogue.lines[i];
        if (line.japanese.includes(q)) {
          matches.push({
            type: "dialogue",
            level,
            dialogue,
            lineIndex: i,
            speaker: line.speaker,
            text: line.japanese,
            zh: line.chinese,
          });
        }
      }
    }

    return matches;
  }, [submitted]);

  const shadowingMatches = results.filter((r): r is ShadowingMatch => r.type === "shadowing");
  const dialogueMatches = results.filter((r): r is DialogueMatch => r.type === "dialogue");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  const youtubeSearchUrl = submitted
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(submitted + " 日本語")}`
    : "";

  return (
    <div className="pb-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 tap-active"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">短語搜尋</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        輸入日文短語，從跟讀文章和對話中找出包含該用法的句子
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例：故障する、ために、てもらう"
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors tap-active"
        >
          搜尋
        </button>
      </form>

      {submitted && (
        <>
          {/* Summary */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            找到 <span className="font-bold text-gray-900 dark:text-gray-100">{results.length}</span> 筆結果
            {shadowingMatches.length > 0 && <span>（跟讀 {shadowingMatches.length} 筆</span>}
            {dialogueMatches.length > 0 && <span>{shadowingMatches.length > 0 ? "、" : "（"}對話 {dialogueMatches.length} 筆</span>}
            {results.length > 0 && "）"}
          </div>

          {/* Shadowing results */}
          {shadowingMatches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
                <span>🎙️</span> 跟讀文章
              </h2>
              <div className="space-y-3">
                {shadowingMatches.map((m, i) => (
                  <button
                    key={`s-${i}`}
                    onClick={() => navigate(`/shadowing/${m.article.level.toLowerCase()}/${m.article.id}`)}
                    className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 tap-active hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                        {m.article.level}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{m.article.date}</span>
                    </div>
                    <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-1">
                      {highlightMatch(m.text, submitted)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{m.zh}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                      📄 {m.article.titleZH || m.article.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dialogue results */}
          {dialogueMatches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
                <span>💬</span> 日常對話
              </h2>
              <div className="space-y-3">
                {dialogueMatches.map((m, i) => (
                  <button
                    key={`d-${i}`}
                    onClick={() => navigate(`/dialogue/${m.level.toLowerCase()}/${m.dialogue.id}`)}
                    className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 tap-active hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold">
                        {m.level}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{m.dialogue.title}</span>
                    </div>
                    <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-1">
                      <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">{m.speaker}:</span>
                      {highlightMatch(m.text, submitted)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{m.zh}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* YouTube search link */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
              <span>📺</span> 外部影片搜尋
            </h2>
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-red-500 hover:bg-red-600 text-white rounded-xl p-4 text-center font-semibold transition-colors tap-active"
            >
              在 YouTube 搜尋「{submitted}」的教學影片 →
            </a>
          </div>

          {/* No results */}
          {results.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="mb-2">站內沒有找到包含「{submitted}」的句子</p>
              <p className="text-sm">試試上方的 YouTube 搜尋，或換一個短語</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
