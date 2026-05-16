/**
 * refresh-articles.mjs
 * Run by GitHub Actions every 2 days to generate new NHK-style news articles.
 * Requires: ANTHROPIC_API_KEY env var
 * Usage: node scripts/refresh-articles.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEWS_FILE = join(__dirname, "../src/data/shadowing-news.json");
const SETTINGS_FILE = join(__dirname, "../src/pages/SettingsPage.tsx");

// ── Load existing articles ───────────────────────────────────────────────────
const existing = JSON.parse(readFileSync(NEWS_FILE, "utf-8"));
const existingIds = new Set(existing.map((a) => a.id));

const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
const dateTag = today.replace(/-/g, ""); // YYYYMMDD for IDs

// Skip if articles with today's date already exist
const alreadyRan = existing.some((a) => a.date === today);
if (alreadyRan) {
  console.log(`✓ Articles already generated for ${today}, skipping.`);
  process.exit(0);
}

// ── Build topic prompt ───────────────────────────────────────────────────────
// Use a seed based on date so topics vary each run
const seed = parseInt(dateTag) % 1000;
const n5Topics = [
  "季節の食べ物", "日本の学校", "ペットと暮らす", "地域のイベント",
  "買い物の便利なサービス", "子供の習い事", "公共交通機関", "日本の四季",
  "スポーツをする子供たち", "図書館の使い方",
];
const n4Topics = [
  "観光地でのマナー", "日本のコンビニ文化", "在宅勤務の広がり",
  "地方移住ブーム", "食の安全", "日本の祝日の由来", "スマートシティの取り組み",
  "高齢化社会と介護", "再生可能エネルギーの普及", "職人技の伝承",
];
const n3Topics = [
  "デジタル格差と高齢者", "フードテックの革新", "日本の財政問題",
  "移民政策の変化", "メンタルヘルスへの意識変化", "ジェンダー平等の現状",
  "大学改革と産学連携", "地方自治体のDX推進", "気候変動と農業への影響",
  "インバウンド観光の課題と恩恵",
];

const pickTopic = (arr) => arr[seed % arr.length];

// ── Call Claude API ──────────────────────────────────────────────────────────
const client = new Anthropic();

console.log(`Generating articles for ${today}...`);

const prompt = `
You are writing NHK News Web Easy-style Japanese news articles for language learners.
Generate exactly 3 articles (one N5, one N4, one N3) in strict JSON format.

Requirements:
- N5: Very simple Japanese (hiragana/katakana + basic kanji). 6-7 short sentences. Topic: ${pickTopic(n5Topics)}
- N4: Intermediate Japanese. 6-7 sentences. Mix of everyday and news vocabulary. Topic: ${pickTopic(n4Topics)}
- N3: Upper-intermediate Japanese. 6-7 sentences. Real news-style language. Topic: ${pickTopic(n3Topics)}

Each article MUST follow this exact JSON structure:
{
  "id": "auto-N5-${dateTag}",
  "level": "N5",
  "title": "(Japanese title)",
  "titleZH": "(Traditional Chinese title)",
  "date": "${today}",
  "emoji": "(single relevant emoji)",
  "segments": [
    { "text": "(Japanese sentence)", "zh": "(Traditional Chinese translation)" }
  ]
}

Rules:
- Use Traditional Chinese (繁體中文) for all translations
- Each segment must be a complete, natural Japanese sentence
- N5: Use only JLPT N5 grammar and vocabulary
- N4: Use JLPT N4 and below grammar and vocabulary
- N3: Use JLPT N3 and below, news-style expressions ok
- IDs must be exactly: "auto-N5-${dateTag}", "auto-N4-${dateTag}", "auto-N3-${dateTag}"

Return ONLY a valid JSON array of 3 article objects. No markdown, no explanation.
`.trim();

let articles;
try {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
  articles = JSON.parse(cleaned);

  if (!Array.isArray(articles) || articles.length !== 3) {
    throw new Error(`Expected 3 articles, got ${articles?.length}`);
  }
} catch (err) {
  console.error("Failed to generate or parse articles:", err.message);
  process.exit(1);
}

// ── Validate & filter duplicates ─────────────────────────────────────────────
const newArticles = articles.filter((a) => {
  if (!a.id || !a.level || !a.title || !a.segments?.length) {
    console.warn(`Skipping invalid article: ${JSON.stringify(a).slice(0, 80)}`);
    return false;
  }
  if (existingIds.has(a.id)) {
    console.warn(`Skipping duplicate id: ${a.id}`);
    return false;
  }
  return true;
});

if (newArticles.length === 0) {
  console.log("No new articles to add.");
  process.exit(0);
}

// ── Prepend new articles (newest first) ──────────────────────────────────────
const updated = [...newArticles, ...existing];
writeFileSync(NEWS_FILE, JSON.stringify(updated, null, 2) + "\n", "utf-8");
console.log(`✓ Added ${newArticles.length} articles for ${today}`);
newArticles.forEach((a) => console.log(`  - [${a.level}] ${a.titleZH} (${a.id})`));

// ── Bump version in SettingsPage.tsx ─────────────────────────────────────────
const settings = readFileSync(SETTINGS_FILE, "utf-8");
const versionMatch = settings.match(/const APP_VERSION = "CH(\d{8})-(\d+)"/);
if (versionMatch) {
  const [, existingDate, seq] = versionMatch;
  const todayCompact = dateTag;
  const newVersion =
    existingDate === todayCompact
      ? `CH${todayCompact}-${parseInt(seq) + 1}`
      : `CH${todayCompact}-1`;
  const updated = settings.replace(
    /const APP_VERSION = "CH\d{8}-\d+"/,
    `const APP_VERSION = "${newVersion}"`
  );
  writeFileSync(SETTINGS_FILE, updated, "utf-8");
  console.log(`✓ Version bumped to ${newVersion}`);
}
