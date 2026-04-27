# Japanese Learner App - Project Context

**Project**: 日本語學習網站（Chris 每日日文學習）  
**Tech Stack**: React + TypeScript + Vite + Tailwind CSS v4 + React Router v6  
**Hosted**: GitHub Pages `/japanese-learner-upstream/`  
**Repo**: https://github.com/jellyfish1456/japanese-learner-upstream

---

## ⚙️ Version Control Rule (AUTO-APPLY EVERY SESSION)

**File**: `src/pages/SettingsPage.tsx` → `const APP_VERSION = "CH{DATE}-{N}"`

- Format: `CH` + `YYYYMMDD` + `-` + sequence number starting at `1`
- **Increment rule**: Each session that touches any source file must bump the version before committing.
  - Same date → increment the trailing number (`CH20260426-2` → `CH20260426-3`)
  - New date → reset to `-1` (`CH20260426-3` → `CH20260427-1`)
- **Current version**: `CH20260427-2`
- Do this automatically — user will never need to ask again.

---

## Core Features

1. **Learning Datasets** (N5/N4/N3 詞彙+文法)
   - Vocabulary (vocab-n5.json, vocab-n4.json, vocab-n3.json)
   - Grammar (grammar-n5.json, grammar-n4.json, grammar-n3.json)
   - Create/edit custom datasets

2. **Study Modes**
   - **Learn Mode**: Flashcard-style with swipeable cards + seekable progress bar
   - **Study Mode**: Quiz-based review

3. **Daily Dialogue** (日常對話) — N5/N4/N3, chat-bubble UI, per-line TTS

4. **Listening Practice** (聽力練習) — N5/N4/N3 MCQ

5. **Verb Conjugation** (動詞變化) — 3 groups × 10-11 verbs × 11 forms

6. **Shadowing 跟讀練習** — N5/N4/N3 articles, TTS sentence highlight, YouTube embed + caption sync

7. **Settings** (設定)
   - Theme, language, speech rate (0.5×–1.25×)
   - Google Drive sync (requires `VITE_GOOGLE_CLIENT_ID` GitHub secret)
   - Version display (`APP_VERSION`)

---

## Key Technical Details

### TTS (Web Speech API)
- `src/lib/tts.ts`: `getBestJapaneseVoice()` — priority: Kyoko > Google 日本語 > O-Ren > Otoya > Hattori > any `ja`
- `src/components/SpeakButton.tsx`: click-to-speak, reads `speechRate` from `loadSettings()`
- Rate stored in `AppSettings.speechRate` (default `0.9`)

### Shadowing
- `src/data/shadowing.ts`: `ShadowingArticle` with `segments[]` (`text`, `zh`, optional `start`/`end` timestamps)
- `src/pages/ShadowingPage.tsx`: YouTube embed + caption fetch (`youtube.com/api/timedtext`), CORS fallback to article text
- `src/pages/ShadowingListPage.tsx`: level-filtered article list

### YouTube Caption Sync
- YouTube requires **signed URLs** from `ytInitialPlayerResponse.captionTracks` — the simple timedtext API no longer works; watch-page has no CORS header
- **Primary proxy**: `api/captions.js` — Vercel serverless function in this repo; auto-active when deployed on Vercel at `{origin}/api/captions`
- **Alternate proxy**: `VITE_CAPTION_PROXY_URL` → Cloudflare Worker (`cloudflare-caption-proxy/worker.js`)
- `ShadowingPage` calls `getCaptionProxyUrl()` = `VITE_CAPTION_PROXY_URL || {window.location.origin}/api/captions`
- On GitHub Pages the `/api/captions` call returns 404 → error state → shows Vercel setup guide in Settings
- Flow: browser → proxy (server-side) → `youtube.com/watch` → parse `ytInitialPlayerResponse` → fetch signed timedtext URL → return JSON3
- JSON3 format: `events[].tStartMs`, `dDurationMs`, `segs[].utf8`
- `vercel.json`: `buildCommand=npm run build`, `outputDirectory=dist`

### Furigana (Ruby Text)
- `src/lib/furigana-map.json` (501KB, pre-generated)
- `src/components/RubyText.tsx`: lazy-loads map, renders `<ruby>` tags

### Google Drive Sync
- `VITE_GOOGLE_CLIENT_ID` env var → GitHub Actions secret
- If missing: SettingsPage shows 6-step setup guide instead of sync UI
- `src/lib/google/`: `gis.ts`, `driveApi.ts`, `syncEngine.ts`, `useGoogleSync.ts`

### Storage (`src/lib/storage.ts`)
- `AppSettings`: `{ defaultSessionSize: number, showSwipeAssist: boolean, speechRate: number }`
- Defaults: `{ defaultSessionSize: 20, showSwipeAssist: true, speechRate: 0.9 }`

### ESLint Rules (strict — CI enforced)
- `react-refresh/only-export-components`: never export non-component symbols from `.tsx` files → move helpers to `.ts`
- `react-hooks/set-state-in-effect`: never call `setState` synchronously in `useEffect` body → use lazy `useState` initializers or async callbacks
- `react-hooks/refs`: never assign `ref.current` during render → use `useLayoutEffect`
- `react-hooks/immutability`: `useCallback` cannot reference itself → use `useRef` + `useLayoutEffect` pattern

### Routing (`src/App.tsx`)
```
/                        → HomePage
/shadowing/:level        → ShadowingListPage
/shadowing/:level/:id    → ShadowingPage
/settings                → SettingsPage
...
```

---

## File Organization
```
src/
  pages/       (HomePage, ShadowingPage, ShadowingListPage, SettingsPage, PDFStudyPage, …)
  components/  (SpeakButton, RubyText, YouTubePlayer, LearnCard, …)
  hooks/       (useSettings, useDatasets, …)
  data/        (shadowing.ts, verbConjugation.ts)
  lib/         (storage.ts, tts.ts, furigana-map.json, google/, …)
  App.tsx      (Routes)
```

---

## Token-Saving Mode Active
- Minimal explanations unless requested
- Output only modified code blocks
- Report errors directly with fixes

---

**Last Updated**: 2026-04-27 | **Current Version**: CH20260427-1
