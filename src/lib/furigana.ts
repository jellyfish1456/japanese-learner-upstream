/** Lazy-loaded furigana map: Japanese text → ruby HTML string */
let _map: Record<string, string> | null = null;
let _loading: Promise<void> | null = null;

/**
 * Word-level dictionary extracted from furigana-map:
 *   key   = kanji word (e.g. "温泉", "食べ")
 *   value = ruby HTML  (e.g. "<ruby>温<rt>おん</rt></ruby><ruby>泉<rt>せん</rt></ruby>")
 * Sorted longest-first for greedy matching.
 */
let _wordDict: [string, string][] | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True if c is a CJK kanji character (not kana, not ASCII). */
function isKanji(c: string): boolean {
  const cp = c.codePointAt(0) ?? 0;
  return (cp >= 0x4e00 && cp <= 0x9fff)   // CJK Unified Ideographs
      || (cp >= 0x3400 && cp <= 0x4dbf)   // CJK Extension A
      || (cp >= 0xf900 && cp <= 0xfaff);  // CJK Compatibility
}

/**
 * Parse all ruby HTML values in the map and build a word-level dictionary.
 * Consecutive <ruby>KANJI<rt>READING</rt></ruby> tags are merged into a
 * compound entry, e.g. 温 + 泉 → 温泉.
 */
function buildWordDict(): void {
  if (!_map || _wordDict) return;
  const raw = new Map<string, string>();
  // Pattern tolerates optional <rp> tags
  const rubyRe = /<ruby>([^<]+?)(?:<rp>[^<]*<\/rp>)?<rt>([^<]+?)<\/rt>(?:<rp>[^<]*<\/rp>)?<\/ruby>/g;

  for (const html of Object.values(_map)) {
    let lastEnd = 0;
    let curWord = "";
    let curHtml = "";

    for (const m of html.matchAll(rubyRe)) {
      const start = m.index!;
      const kanji = m[1];

      if (start === lastEnd) {
        // Adjacent ruby tags → extend compound word
        curWord += kanji;
        curHtml += m[0];
      } else {
        // Gap between tags → flush previous word, start new
        if (curWord) raw.set(curWord, curHtml);
        curWord = kanji;
        curHtml = m[0];
      }
      lastEnd = start + m[0].length;
    }
    if (curWord) raw.set(curWord, curHtml);
  }

  // Sort longest-first so greedy matching prefers longer compounds
  _wordDict = [...raw.entries()].sort((a, b) => b[0].length - a[0].length);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function loadFuriganaMap(): Promise<void> {
  if (_map) return Promise.resolve();
  if (_loading) return _loading;
  _loading = import("./furigana-map.json").then((m) => {
    _map = m.default as Record<string, string>;
    buildWordDict();
  });
  return _loading;
}

/** Exact-match lookup (used by N5/N4/N3 vocabulary cards). */
export function getFuriganaHtml(text: string): string | null {
  return _map?.[text] ?? null;
}

/**
 * Annotate arbitrary Japanese text with furigana.
 * Uses a greedy longest-match scan against the word dictionary.
 * Kanji that have no known reading are left as plain text.
 */
export function getFuriganaHtmlAuto(text: string): string {
  if (!_wordDict) return text;

  let out = "";
  let i = 0;
  while (i < text.length) {
    let matched = false;
    // Only attempt dictionary lookup when at a kanji character
    if (isKanji(text[i])) {
      for (const [word, html] of _wordDict) {
        if (word.length > text.length - i) continue;
        if (text.startsWith(word, i)) {
          out += html;
          i += word.length;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      // Escape HTML special chars for safe dangerouslySetInnerHTML
      const c = text[i];
      out += c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c;
      i++;
    }
  }
  return out;
}

/** Returns true if the map (and word dictionary) have been loaded. */
export function isFuriganaReady(): boolean {
  return _map !== null && _wordDict !== null;
}
