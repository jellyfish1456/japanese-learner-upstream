import type { VocabItem, GrammarItem, DataItem, Category, SimilarGrammar } from "../types";
import { isVocabItem } from "../types";
import GrammarHighlight from "./GrammarHighlight";
import SpeakButton from "./SpeakButton";

interface LearnCardProps {
  item: DataItem;
  category: Category;
}

/** Strip 【】 markers from example sentences for TTS */
function stripMarkers(sentence: string): string {
  return sentence.replace(/【/g, "").replace(/】/g, "");
}

function VocabLearnCard({ item }: { item: VocabItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
      {/* Japanese */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{item.japanese}</div>
          <SpeakButton text={item.japanese} />
        </div>
        <div className="text-lg text-gray-500 dark:text-gray-400 mt-1">{item.hiragana}</div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700" />

      {/* Chinese meaning */}
      <div className="text-center">
        <div className="text-xl font-semibold text-blue-700 dark:text-blue-400">{item.simple_chinese}</div>
      </div>

      {/* Full explanation */}
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
      {/* Grammar pattern */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">{item.japanese}</div>
          <SpeakButton text={item.japanese} />
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700" />

      {/* Chinese meaning */}
      <div className="text-center">
        <div className="text-xl font-semibold text-blue-700 dark:text-blue-400">{item.simple_chinese}</div>
      </div>

      {/* Full explanation */}
      {item.full_explanation && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{item.full_explanation}</div>
        </>
      )}

      {/* Examples */}
      {item.examples && item.examples.length > 0 && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">例句</div>
            {item.examples.map((ex, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-base text-gray-900 dark:text-gray-50 leading-relaxed flex-1">
                    <GrammarHighlight sentence={ex.sentence} mode="highlight" />
                  </div>
                  <SpeakButton text={stripMarkers(ex.sentence)} className="mt-0.5" />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ex.chinese}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Similar / easily confused grammar */}
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
              <span className="text-base font-bold text-orange-700 dark:text-orange-300">{sg.japanese}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{sg.difference}</p>
            {sg.example && (
              <div className="bg-white dark:bg-gray-800/60 rounded-lg px-3 py-2">
                <div className="flex items-start gap-1.5">
                  <p className="text-sm text-gray-700 dark:text-gray-200 flex-1 leading-relaxed">{sg.example}</p>
                  <SpeakButton text={sg.example} className="mt-0.5 flex-shrink-0" />
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
