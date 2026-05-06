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
- **Current version**: `CH20260506-2`
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

## Communication Style
- Reply in **English**, brief, minimal tokens
- Only show modified code sections, not full files
- Fix errors immediately without asking

---

**Last Updated**: 2026-05-01 | **Current Version**: CH20260501-6
