# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server at http://127.0.0.1:5173/japanese-learner/
npm run build        # TypeScript check + Vite build + copy 404.html for GitHub Pages SPA
npm run lint         # ESLint
tsc --noEmit         # Type check (CI runs this separately from build)
```

## Testing Commands

```bash
npm run test         # Unit tests (Vitest)
npm run test:watch   # Unit tests in watch mode
npm run test:e2e     # Playwright e2e tests (uses port 5174, separate from dev)
npm run test:e2e:ui  # Playwright interactive UI mode
```

Unit tests live alongside source in `src/**/*.test.ts(x)`. E2E tests are in `e2e/`. E2E global setup copies fixture data from `e2e/fixtures/` into `data/` before tests and cleans up after.

## Architecture

**React 19 + TypeScript + Vite + Tailwind CSS v4** app for Japanese flashcard study, deployed to GitHub Pages. The UI is in Traditional Chinese, targeting Chinese speakers learning Japanese.

### Routing (React Router v7, basename="/japanese-learner/")

- `/` → HomePage — browse datasets with category/level filters
- `/study/:datasetId` → SetupPage — pick test mode + card count
- `/study/:datasetId/session` → StudyPage — active flashcard session
- `/learn/:datasetId` → LearnSetupPage — choose learn plan (全部學習 / 分天計畫)
- `/learn/:datasetId/session` → LearnPage — browse all cards without testing
- `/manage/new` → DatasetCreatePage — create new dataset
- `/manage/:datasetId` → DatasetEditPage — list/manage items in a dataset
- `/manage/:datasetId/item` → ItemEditPage — add new item
- `/manage/:datasetId/item/:itemId` → ItemEditPage — edit existing item
- `/settings` → SettingsPage — dark mode, swipe assist toggles
- `/about` → AboutPage

### Data Flow

JSON files in `data/` → loaded at build time via `import.meta.glob()` in `useDatasets` hook → components. No backend; all progress persisted to localStorage under keys `jp-learner:progress`, `jp-learner:settings`, and `jp-learner:custom-data`.

### Key Hooks (src/hooks/)

- **useDatasets** — glob-imports all JSON datasets, merges with custom data from localStorage, provides `getDataset()` and filtered metadata with stats
- **useProgress** — localStorage CRUD for card progress, exposes `rateCard()` which applies SM-2
- **useStudySession** — orchestrates card queue, flip state, rating, requeue of failed cards, session results; supports multi-mode sessions and mix category filtering
- **useDatasetCrud** — CRUD operations for datasets and items (create, update, delete)
- **useStudyPlan** — manage daily learning plans (分天計畫)
- **useKeyboard** — Space/Enter to flip, 1/2/3 to rate
- **useSwipe** — touch/mouse drag gestures mapped to ratings
- **useSettings** — React hook wrapping loadSettings/saveSettings
- **useDarkMode** — dark mode state management

### Core Libraries (src/lib/)

- **sm2.ts** — SM-2 spaced repetition: `calculateNextReview()` and `isDue()`. Rating scale: 1 (again), 3 (hard), 5 (good). Cards rated "again" requeue at session end.
- **grammar.ts** — `parseGrammarSentence()` splits `【bracket】` notation into grammar/non-grammar segments for highlight or fill-in-blank rendering
- **flashcard.ts** — `buildVocabCard()`/`buildGrammarCard()` convert data items to front/back flashcard content based on test mode
- **storage.ts** — localStorage wrappers for progress, settings, custom data, and test modes
- **stats.ts** — computes learned/due/mastered counts per dataset; supports multi-mode stats for mix datasets
- **category.ts** — shared `categoryLabels` and `categoryColors` maps for vocabulary/grammar/mix categories
- **shuffle.ts** — Fisher-Yates shuffle
- **studyPlan.ts** — daily plan creation and management logic

### Data Format

Three categories in `data/*.json`: vocabulary (`category: "vocabulary"`), grammar (`category: "grammar"`), and mix (`category: "mix"`). Vocabulary items have `japanese`, `hiragana`, `simple_chinese`, `full_explanation`. Grammar items additionally have `examples` with `sentence` (using `【】` brackets around grammar points) and `chinese` translation. Mix datasets contain both vocab and grammar items; item type is detected at runtime via `isVocabItem()` (checks for `hiragana` field).

### Category System

The `Category` type is `"vocabulary" | "grammar" | "mix"`. Key constants in `src/types/index.ts`:
- `VOCAB_TEST_MODES` — 3 vocab test modes
- `GRAMMAR_TEST_MODES` — 4 grammar test modes
- `MIX_TEST_MODES` — all 7 modes combined, each tagged with `group: "vocab" | "grammar"`
- `MIX_DEFAULT_MODES` — `["kanji-to-chinese", "grammar-to-chinese"]`
- `VOCAB_MODE_VALUES` / `GRAMMAR_MODE_VALUES` — Sets for filtering applicable modes per item type

## Document

The system design should be in `plan.md`, always update it when there is big features or big refactoring.

Update README.md if there is any changes that may affect the users or developers.
