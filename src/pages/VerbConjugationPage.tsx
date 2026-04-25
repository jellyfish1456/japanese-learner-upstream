import { useState } from "react";
import { VERB_GROUPS, FORMS, type VerbGroup, type ConjugatedVerb } from "../data/verbConjugation";
import SpeakButton from "../components/SpeakButton";
import RubyText from "../components/RubyText";

// ─── Verb detail modal ────────────────────────────────────────────────────────
function VerbDetailCard({ verb, onClose }: { verb: ConjugatedVerb; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ruby className="ruby-large text-3xl font-bold text-gray-900 dark:text-gray-50">
              {verb.dictionary}
              <rt>{verb.hiragana}</rt>
            </ruby>
            <SpeakButton text={verb.dictionary} />
            <span className="text-blue-600 dark:text-blue-400 font-medium">{verb.chinese}</span>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Conjugation table */}
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody>
              {FORMS.map((form) => (
                <tr key={form.key}
                    className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  <td className="py-3 px-5 w-20 font-medium text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                    {form.label}
                  </td>
                  <td className="py-3 px-2 font-bold text-gray-900 dark:text-gray-50 text-base">
                    <div className="flex items-center gap-1.5 has-ruby">
                      <RubyText text={verb.forms[form.key]} />
                      <SpeakButton text={verb.forms[form.key]} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 dark:text-gray-500 text-xs leading-snug">
                    {form.usage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Group panel ──────────────────────────────────────────────────────────────
function GroupPanel({ group }: { group: VerbGroup }) {
  const [selectedVerb, setSelectedVerb] = useState<ConjugatedVerb | null>(null);

  return (
    <div>
      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{group.description}</p>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">如何判斷：</span>
            {group.howToIdentify}
          </p>
        </div>
      </div>

      {/* Conjugation rules table */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        變化規則
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/60">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">語尾</th>
                {FORMS.map((f) => (
                  <th key={f.key}
                      className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.conjugationRules.map((rule, i) => (
                <tr key={i}
                    className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-3 font-bold text-gray-900 dark:text-gray-50 whitespace-nowrap text-base">
                    <div className="has-ruby">
                      <RubyText text={rule.example} />
                    </div>
                    <div className="text-xs font-normal text-gray-400 dark:text-gray-500 mt-0.5">〜{rule.ending}</div>
                  </td>
                  {FORMS.map((f) => (
                    <td key={f.key}
                        className="px-2 py-3 text-center text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <div className="has-ruby flex items-center justify-center gap-1">
                        <RubyText text={rule.forms[f.key]} />
                        <SpeakButton text={rule.forms[f.key]} className="opacity-50" />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common verbs grid */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        常用動詞 <span className="normal-case font-normal">（點擊查看完整變化）</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {group.commonVerbs.map((verb) => (
          <button
            key={verb.dictionary}
            onClick={() => setSelectedVerb(verb)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-left hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all tap-active"
          >
            <div className="flex items-center gap-1.5">
              <ruby className="ruby-large text-xl font-bold text-gray-900 dark:text-gray-50">
                {verb.dictionary}
                <rt>{verb.hiragana}</rt>
              </ruby>
              <SpeakButton text={verb.dictionary} />
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{verb.chinese}</div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                {verb.forms["te"]}
              </span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                {verb.forms["nai"]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Verb detail modal */}
      {selectedVerb && (
        <VerbDetailCard verb={selectedVerb} onClose={() => setSelectedVerb(null)} />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VerbConjugationPage() {
  const [activeGroup, setActiveGroup] = useState(0);
  const group = VERB_GROUPS[activeGroup];

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">動詞變化</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          日語三類動詞的活用規則、常用單字與完整變化表
        </p>
      </div>

      {/* Group tabs */}
      <div className="flex gap-2 mb-5">
        {VERB_GROUPS.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(i)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all tap-active ${
              activeGroup === i
                ? `${g.color} text-white shadow-sm`
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div>{g.label}</div>
            <div className={`text-xs font-normal mt-0.5 ${activeGroup === i ? "opacity-80" : "opacity-60"}`}>
              {g.id === "g1" ? "五段" : g.id === "g2" ? "一段" : "不規則"}
            </div>
          </button>
        ))}
      </div>

      {/* Group label */}
      <div className="mb-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${group.color}`}>
          {group.labelJp}
        </span>
      </div>

      <GroupPanel key={group.id} group={group} />
    </div>
  );
}
