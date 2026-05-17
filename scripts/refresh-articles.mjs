/**
 * refresh-articles.mjs
 * Run by GitHub Actions every 2 days.
 * 1. Fetches REAL NHK News Easy article URLs + titles from sitemap
 * 2. Uses Claude API to expand into full learning articles with translations
 * 3. Each article links back to its original NHK source
 *
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
const SITEMAP_URL = "https://news.web.nhk/news/easy/sitemap/sitemap.xml";

// ── Load existing articles ───────────────────────────────────────────────────
const existing = JSON.parse(readFileSync(NEWS_FILE, "utf-8"));
const existingSourceUrls = new Set(existing.map((a) => a.sourceUrl).filter(Boolean));
const existingIds = new Set(existing.map((a) => a.id));

const today = new Date().toISOString().split("T")[0];
const dateTag = today.replace(/-/g, "");

// Skip if articles with today's date already exist
if (existing.some((a) => a.date === today)) {
  console.log(`✓ Articles already generated for ${today}, skipping.`);
  process.exit(0);
}

// ── Step 1: Fetch real NHK article URLs from sitemap ─────────────────────────
console.log("Fetching NHK News Easy sitemap...");
const sitemapRes = await fetch(SITEMAP_URL, {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const sitemapXml = await sitemapRes.text();

// Extract article URLs (format: /news/easy/neYYYYMMDD.../neYYYYMMDD....html)
const articleUrlRegex =
  /https:\/\/news\.web\.nhk\/news\/easy\/ne\d+\/ne\d+\.html/g;
const allUrls = [...sitemapXml.matchAll(articleUrlRegex)].map((m) => m[0]);

// Filter out already-used articles
const newUrls = allUrls.filter((url) => !existingSourceUrls.has(url));
// Take the latest 4 (we'll pick 3 for generation)
const candidateUrls = newUrls.slice(0, 4);

if (candidateUrls.length === 0) {
  console.log("No new NHK articles found in sitemap.");
  process.exit(0);
}

console.log(`Found ${candidateUrls.length} new NHK articles`);

// ── Step 2: Fetch title + excerpt from each article's meta tags ──────────────
async function fetchArticleMeta(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch = html.match(
      /name="description"[^>]*content="([^"]+)"/
    );

    // Extract date from article ID (neYYYYMMDD...)
    const idMatch = url.match(/ne(\d{4})(\d{2})(\d{2})/);
    const date = idMatch
      ? `${idMatch[1]}-${idMatch[2]}-${idMatch[3]}`
      : today;

    const title = titleMatch
      ? titleMatch[1].replace(/ \| NHKやさしいことばニュース/, "")
      : "";
    const desc = descMatch ? descMatch[1] : "";

    return { url, title, desc, date };
  } catch (err) {
    console.warn(`Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

const metas = (
  await Promise.all(candidateUrls.map(fetchArticleMeta))
).filter(Boolean);

if (metas.length === 0) {
  console.log("Could not fetch any article metadata.");
  process.exit(1);
}

console.log("Fetched article metadata:");
metas.forEach((m) => console.log(`  - ${m.title} (${m.date})`));

// ── Step 3: Use Claude API to expand into full learning articles ─────────────
const client = new Anthropic();

const articleList = metas
  .map(
    (m, i) =>
      `Article ${i + 1}:\n  URL: ${m.url}\n  Title: ${m.title}\n  Excerpt: ${m.desc}\n  Date: ${m.date}`
  )
  .join("\n\n");

const prompt = `
You are creating Japanese learning articles based on REAL NHK News Easy articles.
Below are real NHK News Easy articles with their titles and excerpts.
Your job is to expand each into a complete learning article with 6-7 sentences.

IMPORTANT: The articles ARE from NHK News Easy (やさしいことばニュース), so they
use simple Japanese. Keep the same simple style — short sentences, basic kanji,
easy grammar. NHK Easy is approximately JLPT N4-N5 level.

${articleList}

For EACH article, create a JSON object with this structure:
{
  "id": "nhk-YYYYMMDD-N" (use the article date + sequential number),
  "level": "N4" (NHK Easy is roughly N4 level — use N5 if very simple, N4 for most, N3 only if complex),
  "title": "(the original Japanese title from NHK)",
  "titleZH": "(Traditional Chinese translation of the title)",
  "date": "(the article date in YYYY-MM-DD format)",
  "emoji": "(single relevant emoji)",
  "sourceUrl": "(the original NHK URL — copy exactly from above)",
  "segments": [
    { "text": "(Japanese sentence)", "zh": "(Traditional Chinese translation)" }
  ],
  "breakdown": [
    [
      { "jp": "(phrase)", "kana": "(hiragana reading)", "zh": "(Traditional Chinese)", "note": "(grammar note in Traditional Chinese)" }
    ]
  ]
}

The "breakdown" field is an array of arrays — one inner array per sentence (matching segments order).
Each inner array splits that sentence into meaningful grammatical phrases (3-7 phrases per sentence).

Breakdown rules:
- Split each sentence into natural grammatical chunks (particles stay attached to their word)
- "kana" must be the full hiragana reading of the phrase
- "zh" is the Traditional Chinese translation of just that phrase
- "note" is a short grammar/usage explanation in Traditional Chinese (e.g. 「は」表示主題, 動詞ます形過去式, etc.)
- Keep notes concise (under 20 characters if possible)

Other rules:
- The FIRST 1-2 sentences should use the actual excerpt text from NHK
- Expand to 6-7 total sentences, maintaining NHK Easy's simple style
- Use Traditional Chinese (繁體中文) for all translations
- Keep the original NHK title exactly as-is
- Each segment is one complete sentence
- Assign level based on actual difficulty: N5 for very basic, N4 for standard NHK Easy, N3 if it uses complex grammar

Return ONLY a valid JSON array. No markdown, no explanation.
`.trim();

let articles;
try {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 16384,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  articles = JSON.parse(cleaned);

  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error(`Expected articles array, got ${typeof articles}`);
  }
} catch (err) {
  console.error("Failed to generate or parse articles:", err.message);
  process.exit(1);
}

// ── Validate & filter ────────────────────────────────────────────────────────
const newArticles = articles.filter((a) => {
  if (!a.id || !a.level || !a.title || !a.segments?.length || !a.sourceUrl) {
    console.warn(
      `Skipping invalid article: ${JSON.stringify(a).slice(0, 80)}`
    );
    return false;
  }
  if (existingIds.has(a.id)) {
    console.warn(`Skipping duplicate id: ${a.id}`);
    return false;
  }
  return true;
});

if (newArticles.length === 0) {
  console.log("No valid new articles to add.");
  process.exit(0);
}

// ── Prepend new articles ─────────────────────────────────────────────────────
const updated = [...newArticles, ...existing];
writeFileSync(NEWS_FILE, JSON.stringify(updated, null, 2) + "\n", "utf-8");
console.log(`\n✓ Added ${newArticles.length} NHK articles for ${today}`);
newArticles.forEach((a) =>
  console.log(`  - [${a.level}] ${a.title} → ${a.sourceUrl}`)
);

// ── Bump version ─────────────────────────────────────────────────────────────
const settings = readFileSync(SETTINGS_FILE, "utf-8");
const versionMatch = settings.match(
  /const APP_VERSION = "CH(\d{8})-(\d+)"/
);
if (versionMatch) {
  const [, existingDate, seq] = versionMatch;
  const newVersion =
    existingDate === dateTag
      ? `CH${dateTag}-${parseInt(seq) + 1}`
      : `CH${dateTag}-1`;
  const updatedSettings = settings.replace(
    /const APP_VERSION = "CH\d{8}-\d+"/,
    `const APP_VERSION = "${newVersion}"`
  );
  writeFileSync(SETTINGS_FILE, updatedSettings, "utf-8");
  console.log(`✓ Version bumped to ${newVersion}`);
}
