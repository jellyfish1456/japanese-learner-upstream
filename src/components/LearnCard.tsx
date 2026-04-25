import { useState, useCallback } from "react";
import type { VocabItem, GrammarItem, DataItem, Category, SimilarGrammar } from "../types";
import { isVocabItem } from "../types";
import GrammarHighlight from "./GrammarHighlight";
import RubyText from "./RubyText";
import SpeakButton from "./SpeakButton";

interface LearnCardProps {
  item: DataItem;
  category: Category;
}

function stripMarkers(sentence: string): string {
  return sentence.replace(/【/g, "").replace(/】/g, "");
}

/** Tap to copy plain text; shows brief ✓ flash */
function CopyableExample({
  sentence,
  chinese,
}: {
  sentence: string;
  chinese: string;
}) {
  const [copied, setCopied] = useState(false);
  const plain = stripMarkers(sentence);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(plain).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [plain]);

  return (
    <div
      onClick={handleCopy}
      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 cursor-pointer active:opacity-70 transition-opacity select-none group relative"
      title="點擊複製例句"
    >
      {/* Copy badge */}
      <span
        className={`absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded font-medium transition-all duration-200 ${
          copied
            ? "opacity-100 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
            : "opacity-0 group-hover:opacity-60 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300"
        }`}
      >
        {copied ? "已複製 ✓" : "複製"}
      </span>

      <div className="flex items-start gap-2 pr-12">
        <div className="text-base text-gray-900 dark:text-gray-50 leading-relaxed flex-1">
          <GrammarHighlight sentence={sentence} mode="highlight" />
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <SpeakButton text={plain} className="mt-0.5 flex-shrink-0" />
        </div>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{chinese}</div>
    </div>
  );
}

function VocabLearnCard({ item }: { item: VocabItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          {/* Vocab: use existing hiragana as furigana */}
          <ruby className="ruby-large text-4xl font-bold text-gray-900 dark:text-gray-50">
            {item.japanese}
            <rt>{item.hiragana}</rt>
          </ruby>
          <SpeakButton text={item.japanese} />
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700" />

      <div className="text-center">
        <div className="text-xl font-semibold text-blue-700 dark:text-blue-400">{item.simple_chinese}</div>
      </div>

      {item.full_explanation && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{item.full_explanation}</div>
        </>
      )}
    </div>
  );
}

function GrammarLearnCard({ item }: { item: GrammarItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            <RubyText text={item.japanese} />
          </div>
          <SpeakButton text={item.japanese} />
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700" />

      <div className="text-center">
        <div className="text-xl font-semibold text-blue-700 dark:text-blue-400">{item.simple_chinese}</div>
      </div>

      {item.full_explanation && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{item.full_explanation}</div>
        </>
      )}

      {item.examples && item.examples.length > 0 && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              例句 <span className="normal-case font-normal">（點擊複製）</span>
            </div>
            {item.examples.map((ex, i) => (
              <CopyableExample key={i} sentence={ex.sentence} chinese={ex.chinese} />
            ))}
          </div>
        </>
      )}

      {item.similar_grammar && item.similar_grammar.length > 0 && (
        <SimilarGrammarSection items={item.similar_grammar} />
      )}
    </div>
  );
}

function SimilarGrammarSection({ items }: { items: SimilarGrammar[] }) {
  return (
    <div>
      <div className="border-t border-gray-100 dark:border-gray-700 mb-4" />
      <div className="text-xs font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>⚠️</span> 易混淆文法比較
      </div>
      <div className="space-y-3">
        {items.map((sg, i) => (
          <div key={i} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <SpeakButton text={sg.japanese} />
              <span className="text-base font-bold text-orange-700 dark:text-orange-300">
                <RubyText text={sg.japanese} />
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{sg.difference}</p>
            {sg.example && (
              <div className="bg-white dark:bg-gray-800/60 rounded-lg px-3 py-2">
                <div className="flex items-start gap-1.5">
                  <p className="text-sm text-gray-700 dark:text-gray-200 flex-1 leading-relaxed">
                    <RubyText text={stripMarkers(sg.example)} />
                  </p>
                  <SpeakButton text={stripMarkers(sg.example)} className="mt-0.5 flex-shrink-0" />
                </div>
                {sg.example_chinese && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sg.example_chinese}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LearnCard({ item, category }: LearnCardProps) {
  if (category === "vocabulary" || (category === "mix" && isVocabItem(item))) {
    return <VocabLearnCard item={item as VocabItem} />;
  }
  return <GrammarLearnCard item={item as GrammarItem} />;
}
