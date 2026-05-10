import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { prefectureMap, REGION_HEX } from "../data/japanTravel";
import { sengokuHeroes, type SengokuHero } from "../data/sengokuHeroes";

function HeroCard({ hero, color }: { hero: SengokuHero; color: string }) {
  const [showFact, setShowFact] = useState(false);
  const [lang, setLang] = useState<"ja" | "cn">("ja");
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Hero portrait image */}
      {hero.image && !imgError && (
        <div
          className="w-full flex justify-center py-4"
          style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)` }}
        >
          <img
            src={hero.image}
            alt={hero.name}
            onError={() => setImgError(true)}
            className="w-32 h-40 object-contain rounded-lg shadow-md bg-white/80"
          />
        </div>
      )}
      {/* Header */}
      <div
        className="p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">{hero.name}</h3>
            <p className="text-xs opacity-80 mt-0.5">{hero.nameCn}</p>
            <p className="text-sm opacity-90 mt-0.5">{hero.nameReading}</p>
          </div>
          <div className="text-right text-sm opacity-80">
            <p>{hero.era}</p>
            <p className="font-semibold">{lang === "ja" ? hero.clan : hero.clanCn}</p>
          </div>
        </div>
        <p className="text-xs mt-2 opacity-90 bg-white/20 rounded-lg px-2 py-1 inline-block">
          {lang === "ja" ? hero.role : hero.roleCn}
        </p>
      </div>

      {/* Language toggle */}
      <div className="px-4 pt-3 flex gap-1">
        <button
          onClick={() => setLang("ja")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            lang === "ja"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          日本語
        </button>
        <button
          onClick={() => setLang("cn")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            lang === "cn"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          中文
        </button>
      </div>

      {/* Story */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {lang === "ja" ? "物語" : "人物故事"}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {lang === "ja" ? hero.story : hero.storyCn}
          </p>
        </div>

        {/* Battles */}
        {hero.battles?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>⚔️</span> {lang === "ja" ? "著名な戦い" : "著名戰役"}
            </p>
            <div className="space-y-2">
              {hero.battles.map((battle) => (
                <div
                  key={battle.name}
                  className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      {lang === "ja" ? battle.name : battle.nameCn}
                    </p>
                    <span className="text-xs text-red-500 dark:text-red-400 font-mono">
                      {battle.year}
                    </span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                    {lang === "ja" ? battle.description : battle.descriptionCn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fun fact - collapsible */}
        <button
          onClick={() => setShowFact(!showFact)}
          className="w-full flex items-center gap-2 text-left py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          <span className="text-lg">💡</span>
          <span className="flex-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {lang === "ja" ? "豆知識" : "冷知識"}
          </span>
          <svg
            className={`w-4 h-4 text-amber-500 transition-transform ${showFact ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showFact && (
          <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              {lang === "ja" ? hero.funFact : hero.funFactCn}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SengokuHeroPage() {
  const { prefectureId } = useParams<{ prefectureId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [prefectureId]);

  const p = prefectureMap[prefectureId ?? ""];
  const heroes = sengokuHeroes[prefectureId ?? ""] ?? [];
  const color = REGION_HEX[p?.region ?? ""]?.base ?? "#64748b";

  if (!p) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-3">⚔️</div>
        <p>找不到該縣份的資料</p>
        <button
          onClick={() => navigate("/japan-travel")}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold"
        >
          回到地圖
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate(`/japan-travel/${prefectureId}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {p.name}に戻る
      </button>

      {/* Title */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">⚔️</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            {p.name}の戦国武将
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          戦国時代（1467〜1615）にこの地で活躍した武将たち
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          可切換日文／中文顯示
        </p>
      </div>

      {/* Hero cards */}
      {heroes.length > 0 ? (
        <div className="space-y-4 mb-6">
          {heroes.map((hero) => (
            <HeroCard key={hero.name} hero={hero} color={color} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">🏯</div>
          <p className="text-sm">この地域の戦国武将データは準備中です</p>
        </div>
      )}

      {/* Back button */}
      <div className="pb-4">
        <button
          onClick={() => navigate(`/japan-travel/${prefectureId}`)}
          className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {p.name}に戻る
        </button>
      </div>
    </div>
  );
}
