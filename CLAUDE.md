# Japanese Learner App - Project Context

**Project**: 日本語學習網站（Chris 每日日文學習）  
**Tech Stack**: React + TypeScript + Vite + Tailwind CSS v4 + React Router v6  
**Hosted**: GitHub Pages `/japanese-learner-upstream/`  
**Repo**: https://github.com/jellyfish1456/japanese-learner-upstream

---

## ✅ MANDATORY AFTER EVERY TASK

1. **`npm run build`** — must pass (TypeScript + Vite)
2. **`npm run lint`** — must pass (zero errors)
3. **`git push`** — then check `gh run list --limit 1` to confirm CI green

If lint or build fails → fix immediately before pushing.

---

## ⚙️ Version Control Rule (AUTO-APPLY EVERY SESSION)

**File**: `src/pages/SettingsPage.tsx` → `const APP_VERSION = "CH{DATE}-{N}"`

- Format: `CH` + `YYYYMMDD` + `-` + sequence number starting at `1`
- **Increment rule**: Each commit that touches any source file must bump the version.
  - Same date → increment trailing number (`CH20260501-4` → `CH20260501-5`)
  - New date → reset to `-1`
- **Current version**: `CH20260513-2`
- Do this automatically — user will never need to ask.

---

## Data Loading Pattern

**ALWAYS use `import.meta.glob`** — never `fetch()` for local JSON data.

```ts
// ✅ Correct
const modules = import.meta.glob<MyType>("../../data/subdir/*.json", { eager: true });

// ❌ Wrong — fetch() doesn't work for static assets in this app
fetch(`${import.meta.env.BASE_URL}data/...`)
```

See `src/hooks/useDialogues.ts` and `src/hooks/useGrammarQuiz.ts` for reference.

---

## Core Features

| Feature | Route | Data |
|---|---|---|
| Vocab Flashcards | `/study/:id`, `/learn/:id` | `data/n{5,4,3}_vocab.json` |
| 日常對話 | `/dialogue/:level` | `data/dialogues/dialogue-n{5,4,3}.json` |
| 聽力練習 | `/listening/:level` | same dialogue JSON, 100q pool, 100/session |
| 跟讀練習 Shadowing | `/shadowing/:level/:id` | `src/data/shadowing.ts` |
| YouTube 跟讀 | `/shadowing/youtube` | YouTube CC via proxy |
| 動詞變化 | `/verb-conjugation` | `src/data/verbConjugation.ts` |
| **克漏字測驗** | `/grammar/:level` | `data/grammar-quiz/grammar-quiz-n{5,4,3}.json` |
| Settings | `/settings` | — |

---

## Data Files

```
data/
  n5_vocab.json / n4_vocab.json / n3_vocab.json
  grammar-n5.json / grammar-n4.json / grammar-n3.json   ← vocab-style datasets (empty)
  dialogues/
    dialogue-n5.json   (100 dialogues, ~616 lines)
    dialogue-n4.json   (100 dialogues, ~625 lines)
    dialogue-n3.json   (100 dialogues, ~625 lines)
  grammar-quiz/
    grammar-quiz-n5.json   (50 questions)
    grammar-quiz-n4.json   (50 questions)
    grammar-quiz-n3.json   (50 questions)
```

### Grammar Quiz JSON Format
```json
{
  "name": "N5 克漏字",
  "level": "N5",
  "questions": [
    {
      "id": "n5-001",
      "sentence": "私は学校___行きます。",
      "answer": "に",
      "choices": ["に", "で", "を", "が"],
      "grammar": "に（方向）",
      "explanation": "「に」は移動の方向を表します。"
    }
  ]
}
```

---

## Key Technical Details

### ESLint Rules (CI enforced — fix before pushing)
- `react-hooks/refs`: never assign `ref.current` during render → use `useEffect`
  ```ts
  // ❌ speedRef.current = speed;  ← in render body
  // ✅ useEffect(() => { speedRef.current = speed; }, [speed]);
  ```
- `react-refresh/only-export-components`: never export non-component symbols from `.tsx`
- Type-only imports: use `import type { Foo }` not `import { Foo }` when `verbatimModuleSyntax` is on
- No unused `eslint-disable` directives

### TTS (Web Speech API)
- `src/lib/tts.ts`: `getBestJapaneseVoice()` — priority: Kyoko > Google 日本語 > any `ja`
- `src/components/SpeakButton.tsx`: reads `speechRate` from `loadSettings()`
- Listening session speed: `useListeningSession(level, 100, speed)` — speedRef updated via `useEffect`

### YouTube Caption Sync
- Primary: `api/captions.js` Vercel serverless function
- Browser fallback: `getPlayerResponse()` from YouTube IFrame API → signed URL → `credentials: 'include'`
- `VITE_CAPTION_PROXY_URL` env var → GitHub Actions secret

### Furigana (Ruby Text)
- `src/lib/furigana-map.json` (501KB)
- `src/components/RubyText.tsx` — exact-match lookup
- `src/components/RubyTextAuto.tsx` — greedy word-level scan via `getFuriganaHtmlAuto()`

### Routing (`src/App.tsx`)
```
/                           → HomePage
/grammar/:level             → GrammarQuizPage
/listening/:level           → ListeningSessionPage
/dialogue/:level            → DialogueListPage
/shadowing/youtube          → ShadowingPage
/shadowing/:level           → ShadowingListPage
/shadowing/:level/:id       → ShadowingPage
/verb-conjugation           → VerbConjugationPage
/settings                   → SettingsPage
```

### Storage (`src/lib/storage.ts`)
- `AppSettings`: `{ defaultSessionSize, showSwipeAssist, speechRate }`
- Defaults: `{ defaultSessionSize: 20, showSwipeAssist: true, speechRate: 0.9 }`

### Google Drive Sync
- `VITE_GOOGLE_CLIENT_ID` → GitHub secret
- Missing → SettingsPage shows setup guide

### NHK News Article Auto-Refresh
- **Workflow**: `.github/workflows/refresh-articles.yml`
- **Schedule**: Weekly, Mon-Fri at 06:00 UTC (14:00 台灣時間), cron: `0 6 * * 1-5`
  - Monday is the primary run; Tue-Fri are fallback retries if NHK had no new articles (holidays)
  - Once articles are added for the week (`addedOn` field), subsequent runs skip automatically
- **Script**: `scripts/refresh-articles.mjs`
- **Data file**: `src/data/shadowing-news.json` (auto-generated, do NOT hand-edit)
- **Flow**:
  1. Fetches real NHK News Easy article URLs from sitemap (`https://news.web.nhk/news/easy/sitemap/sitemap.xml`)
  2. Extracts title + description from each article's HTML meta tags
  3. Sends real NHK titles/excerpts to Claude Haiku API to expand into learning articles with Traditional Chinese translations
  4. Each article includes `sourceUrl` linking to the original NHK page
  5. Commits updated `shadowing-news.json` + version bump in `SettingsPage.tsx`
  6. Explicitly triggers `deploy.yml` (required because `GITHUB_TOKEN` commits don't auto-trigger other workflows)
- **Secrets required**: `ANTHROPIC_API_KEY`
- **Manual trigger**: GitHub Actions → Refresh News Articles → Run workflow (with optional `force` flag)
- **Data merge**: `src/data/shadowing.ts` combines `shadowing-news.json` (dynamic) + static articles via `import.meta.glob`

---

## File Organization
```
src/
  pages/       GrammarQuizPage, ListeningSessionPage, ShadowingPage, HomePage, …
  components/  SpeakButton, RubyText, RubyTextAuto, YouTubePlayer, …
  hooks/       useGrammarQuiz, useGrammarSession, useListeningSession, useDialogues, …
  data/        shadowing.ts, verbConjugation.ts
  lib/         storage.ts, tts.ts, furigana.ts, furigana-map.json, google/…
  App.tsx
```

---

## ⚠️ Past Mistakes — DO NOT REPEAT

### 1. GITHUB_TOKEN commits don't trigger other workflows
- **Problem**: `refresh-articles.yml` pushes a commit, but `deploy.yml` (triggered by `on: push`) never fires.
- **Root cause**: GitHub security — commits made with `GITHUB_TOKEN` do NOT trigger other workflows.
- **Solution**: Use `repository_dispatch` event. After push, call `curl` to send a dispatch to trigger deploy.
- **Also**: `gh workflow run` fails with `GITHUB_TOKEN` permissions — use `curl` + GitHub API instead.

### 2. Always add `scrollTo(top: 0)` on page components
- **Problem**: Navigating to a new page keeps the previous scroll position.
- **Fix**: Every page-level component that users navigate to must have:
  ```ts
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [routeParam]);
  ```
- **Affected files**: `ShadowingPage.tsx`, `ShadowingListPage.tsx`, `NewsReaderPage.tsx` — all fixed.
- **Rule**: When creating ANY new page component, always include scroll-to-top.

### 3. NHK article dates come from the article URL, not the run date
- **Problem**: User expected 5/25 articles to show date "2026-05-25", but they showed "2026-05-22".
- **Root cause**: The script extracts dates from the NHK article URL (`ne20260522...`), which is the NHK publish date, not the date the workflow ran.
- **This is correct behavior** — do NOT "fix" this. NHK may not publish on weekends, so the latest article date can lag behind the current date.

### 4. New features must generate data for ALL existing articles, not just new ones
- **Problem**: Added `breakdown` field but only new articles got it. Old articles had no breakdown, so the button didn't appear.
- **Fix**: Always add a backfill step when introducing new data fields. The `refresh-articles.mjs` script now backfills missing breakdowns on every run.

### 5. Don't generate AI content when user asks for real content
- **Problem**: User asked "拿 NHK 的文章當作材料" — I generated random AI articles instead of fetching real NHK content.
- **Rule**: When user says to use content from a specific source, ALWAYS fetch from that source. Use AI only to expand/translate, never to fabricate the source material.

### 6. NHK News Easy URL changed — use correct domain
- **Old (wrong)**: `https://www3.nhk.or.jp/news/easy/` (301 redirects)
- **Current (correct)**: `https://news.web.nhk/news/easy/`
- **Rule**: Always verify URLs are current. If a redirect is detected, update all references.

### 7. git push rejected after Actions auto-push
- **Problem**: Remote has new commits from GitHub Actions, local push is rejected.
- **Fix**: Always `git pull --rebase` before pushing when a workflow may have pushed since last pull.

### 8. Deploy must be triggered after article refresh
- **Problem**: Articles were generated and pushed but the website didn't update.
- **Fix**: `refresh-articles.yml` now explicitly dispatches `deploy.yml` via `repository_dispatch` after pushing. Always verify the deployed site has the latest content, not just that the commit exists.

---

## Communication Style
- Reply in **English**, brief, minimal tokens
- Only show modified code sections, not full files
- Fix errors immediately without asking

---

**Last Updated**: 2026-05-25
