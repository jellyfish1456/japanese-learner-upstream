import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDialogueById } from "../hooks/useDialogues";
import SpeakButton from "../components/SpeakButton";
import RubyText from "../components/RubyText";

// Speakers are typically "A" and "B" — A on left (blue), B on right (green)
function isBubbleRight(speaker: string): boolean {
  return speaker.trim().toUpperCase() === "B";
}

const levelColors: Record<string, { badge: string; lineA: string; lineB: string }> = {
  N5: {
    badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    lineA: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    lineB: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  },
  N4: {
    badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    lineA: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    lineB: "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800",
  },
  N3: {
    badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    lineA: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    lineB: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
  },
};

function DialogueBubble({
  line,
  colors,
}: {
  line: { speaker: string; japanese: string; chinese: string };
  colors: { lineA: string; lineB: string };
}) {
  const [copied, setCopied] = useState(false);
  const isRight = isBubbleRight(line.speaker);
  const bubbleColor = isRight ? colors.lineB : colors.lineA;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(line.japanese).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [line.japanese]);

  return (
    <div className={`flex items-start gap-2 ${isRight ? "flex-row-reverse" : ""}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${isRight ? "bg-green-500 dark:bg-green-600" : "bg-blue-500 dark:bg-blue-600"}`}>
        {line.speaker}
      </div>
      <div
        onClick={handleCopy}
        className={`flex-1 max-w-[85%] rounded-2xl border px-4 py-3 ${bubbleColor} ${isRight ? "rounded-tr-sm" : "rounded-tl-sm"} cursor-pointer active:opacity-70 transition-opacity relative`}
      >
        {copied && (
          <span className="absolute top-2 right-3 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">
            已複製 ✓
          </span>
        )}
        <div className={`flex items-start gap-2 mb-1.5 ${isRight ? "flex-row-reverse" : ""} ${copied ? "pr-14" : ""}`}>
          <p className="text-base font-medium text-gray-900 dark:text-gray-50 leading-relaxed">
            <RubyText text={line.japanese} />
          </p>
          <div onClick={(e) => e.stopPropagation()}>
            <SpeakButton text={line.japanese} className="mt-0.5 flex-shrink-0" />
          </div>
        </div>
        <p className={`text-sm text-gray-500 dark:text-gray-400 leading-relaxed ${isRight ? "text-right" : ""}`}>
          {line.chinese}
        </p>
      </div>
    </div>
  );
}

function CopyablePhrase({
  phrase,
}: {
  phrase: { japanese: string; chinese: string };
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(phrase.japanese).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [phrase.japanese]);

  return (
    <div
      onClick={handleCopy}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer active:opacity-70 transition-opacity relative"
    >
      {copied && (
        <span className="absolute top-2 right-3 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">
          已複製 ✓
        </span>
      )}
      <div className="flex items-start gap-2 pr-12">
        <p className="flex-1 text-base font-medium text-gray-900 dark:text-gray-50">
          <RubyText text={phrase.japanese} />
        </p>
        <div onClick={(e) => e.stopPropagation()}>
          <SpeakButton text={phrase.japanese} />
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{phrase.chinese}</p>
    </div>
  );
}

export default function DialoguePage() {
  const { level, dialogueId } = useParams<{ level: string; dialogueId: string }>();
  const upperLevel = (level ?? "").toUpperCase();
  const dialogue = useDialogueById(upperLevel, dialogueId ?? "");

  const colors = levelColors[upperLevel] ?? levelColors["N5"];

  if (!dialogue) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-5xl mb-4">💬</div>
        <p className="font-medium">找不到對話內容</p>
      </div>
    );
  }

  return (
    <div>
      {/* Title section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
            {upperLevel}
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            {dialogue.title}
          </h2>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mb-2">
          {dialogue.titleJp}
        </p>
        {/* Situation */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            📍 {dialogue.situation}
          </p>
        </div>
      </div>

      {/* Dialogue lines */}
      <div className="space-y-3 mb-8">
        {dialogue.lines.map((line, idx) => (
          <DialogueBubble key={idx} line={line} colors={colors} />
        ))}
      </div>

      {/* Key Phrases */}
      {dialogue.keyPhrases && dialogue.keyPhrases.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
            <span>🔑</span> 重點句型
          </h3>
          <div className="space-y-2">
            {dialogue.keyPhrases.map((phrase, idx) => (
              <CopyablePhrase key={idx} phrase={phrase} />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {dialogue.notes && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1.5 flex items-center gap-1.5">
            <span>💡</span> 學習筆記
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed whitespace-pre-line">
            {dialogue.notes}
          </p>
        </div>
      )}
    </div>
  );
}
