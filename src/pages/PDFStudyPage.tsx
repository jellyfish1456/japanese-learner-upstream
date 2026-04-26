import { useState, useRef, useCallback } from "react";
import { loadPDFDatasets, savePDFDataset, deletePDFDataset, type PDFDataset, type PDFCard } from "../lib/storage";
import SpeakButton from "../components/SpeakButton";

// ─── PDF text extraction via pdfjs + OCR fallback ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderPageToCanvas(page: any): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

async function ocrCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(canvas, "jpn+chi_tra+eng", {
    logger: () => {},
  });
  return result.data.text;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfItem = { str: string; x: number; y: number; h: number };

/** Extract one page's text items with position info */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractPageItems(page: any): Promise<PdfItem[]> {
  const content = await page.getTextContent();
  const items: PdfItem[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (item as any).transform;
    if (!t) continue;
    items.push({ str: item.str, x: t[4], y: t[5], h: Math.abs(t[3]) });
  }
  return items;
}

/** Find the best X split point for a two-column layout using gap analysis */
function findColumnSplit(items: PdfItem[]): number | null {
  const xs = [...new Set(items.map((i) => Math.round(i.x)))].sort((a, b) => a - b);
  if (xs.length < 4) return null;
  // Find the largest gap between x positions
  let maxGap = 0, splitX = 0;
  for (let i = 1; i < xs.length; i++) {
    const gap = xs[i] - xs[i - 1];
    if (gap > maxGap) { maxGap = gap; splitX = (xs[i] + xs[i - 1]) / 2; }
  }
  // Only use the split if the gap is significant (>15pt) and splits items roughly in half
  const leftCount = items.filter((i) => i.x < splitX).length;
  const rightCount = items.filter((i) => i.x >= splitX).length;
  const balance = Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount);
  return maxGap >= 15 && balance >= 0.2 ? splitX : null;
}

/** Group items into rows by Y-coordinate proximity, then reconstruct page text.
 *  For table-format PDFs (vocabulary lists): outputs "JP\tCN" per row.
 *  For regular text PDFs: outputs lines joined by space. */
function itemsToText(items: PdfItem[]): string {
  if (items.length === 0) return "";

  // Sort top-to-bottom, left-to-right
  items.sort((a, b) => b.y - a.y || a.x - b.x);

  // Compute median font height (used to scale the row-gap threshold)
  const heights = items.map((i) => i.h).sort((a, b) => a - b);
  const medH = heights[Math.floor(heights.length / 2)] || 10;

  // Group into rows: items within (medH * 0.8) vertically = same row.
  // This is large enough to merge furigana (sits ~0.5×medH above base text)
  // with the base text into one row.
  const ROW_GAP = Math.max(6, medH * 0.8);
  const rows: PdfItem[][] = [];
  let curRow: PdfItem[] = [];
  let curY = items[0].y;
  for (const item of items) {
    if (Math.abs(item.y - curY) > ROW_GAP) {
      if (curRow.length) rows.push(curRow);
      curRow = [];
      curY = item.y;
    }
    curRow.push(item);
    // Update curY toward this item (running average keeps us aligned)
    curY = (curY + item.y) / 2;
  }
  if (curRow.length) rows.push(curRow);

  // Detect two-column table: try to find a natural X split
  const colSplit = findColumnSplit(items);
  const isTwoColumn = colSplit !== null &&
    rows.filter((r) => {
      const hasLeft = r.some((i) => i.x < colSplit);
      const hasRight = r.some((i) => i.x >= colSplit);
      return hasLeft && hasRight;
    }).length >= 2;

  if (isTwoColumn) {
    const mid = colSplit!;
    const entries: { jp: string; cn: string }[] = [];
    let pendingJP = "";
    let pendingReading = "";
    // Typical font height for main vocab text on this page
    const mainH = heights[Math.floor(heights.length * 0.75)] || medH;

    for (const row of rows) {
      const leftItems = row.filter((i) => i.x < mid);
      const rightItems = row.filter((i) => i.x >= mid);
      const leftStr = leftItems.map((i) => i.str).join("").trim();
      const rightStr = rightItems.map((i) => i.str).join("").trim();

      if (!leftStr && !rightStr) continue;

      // Is the left content furigana? (only kana, short, smaller font than main text)
      const leftAvgH = leftItems.length
        ? leftItems.reduce((s, i) => s + i.h, 0) / leftItems.length
        : 0;
      const isKanaOnly = /^[ぁ-ん゛゜ァ-ンヴーa-zA-Z\s（）]+$/.test(leftStr);
      const isFurigana = leftStr.length > 0 && isKanaOnly &&
        leftStr.length <= 10 && leftAvgH < mainH * 0.85;

      if (isFurigana && !rightStr) {
        // Pure furigana row — store reading, will attach to the next JP word
        pendingReading = leftStr;
        continue;
      }

      // Build the JP string, attaching any stored furigana reading
      let jpWord = leftStr;
      if (jpWord && pendingReading) {
        // Only attach reading if the JP word contains kanji
        if (/[一-龯]/.test(jpWord)) jpWord += `（${pendingReading}）`;
        pendingReading = "";
      }

      if (jpWord && rightStr) {
        // Complete entry: JP word + Chinese meaning in the same row
        if (pendingJP) entries.push({ jp: pendingJP, cn: "" });
        entries.push({ jp: jpWord, cn: rightStr });
        pendingJP = "";
      } else if (jpWord && !rightStr) {
        // JP word row with no meaning yet (single-kana section header or pending entry)
        if (pendingJP) entries.push({ jp: pendingJP, cn: "" });
        pendingJP = jpWord;
      } else if (!jpWord && rightStr) {
        // Meaning-only row (continuation or orphaned Chinese)
        if (pendingJP) {
          entries.push({ jp: pendingJP, cn: rightStr });
          pendingJP = "";
        }
      }
    }
    if (pendingJP) entries.push({ jp: pendingJP, cn: "" });

    // Output as "JP\tCN" lines; skip pure single-kana section headers
    const result = entries
      .filter((e) => /[ぁ-んァ-ン一-龯]/.test(e.jp) && e.jp.length >= 2)
      .map((e) => e.cn ? `${e.jp}\t${e.cn}` : e.jp)
      .join("\n");
    if (result.trim()) return result;
  }

  // Regular text mode: join rows as lines
  return rows
    .map((r) => r.map((i) => i.str).join(""))
    .join("\n");
}

async function extractTextFromPDF(file: File, onProgress?: (msg: string) => void): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  let usedOcr = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`解析第 ${i}/${pdf.numPages} 頁...`);
    const page = await pdf.getPage(i);
    const items = await extractPageItems(page);

    if (items.length > 3) {
      pages.push(itemsToText(items));
    } else {
      // Image-based page: use OCR
      usedOcr = true;
      onProgress?.(`第 ${i} 頁含圖片，執行 OCR 辨識...`);
      const canvas = await renderPageToCanvas(page);
      const ocrText = await ocrCanvas(canvas);
      pages.push(ocrText);
    }
  }
  if (usedOcr) onProgress?.("OCR 辨識完成");
  return pages.join("\n");
}

// ─── Parse raw text into Q&A cards ──────────────────────────────────────────

/** Clean up OCR/PDF noise from a text string */
function cleanText(t: string): string {
  return t
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n")           // form feeds
    .replace(/[^\S\n]+/g, " ")      // collapse non-newline whitespace
    .replace(/\n{3,}/g, "\n\n")     // max 2 consecutive newlines
    .trim();
}

/** Attempt to extract cards from LLM-style chat logs */
function parseChatLog(text: string): PDFCard[] | null {
  const cards: PDFCard[] = [];
  let id = Date.now();

  // Pattern A: "Speaker: content" on same line (User: ... / Assistant: ...)
  const inlinePattern = /^(User|Assistant|Human|AI|人間|あなた|Claude|ChatGPT|GPT|你|我)[：:]/im;
  // Pattern B: Speaker name on its own line, content on next lines (ChatGPT PDF export)
  const blockPattern = /^(You|User|ChatGPT|Claude|Assistant|GPT-[34]\S*|Gemini)\s*$/im;

  if (!inlinePattern.test(text) && !blockPattern.test(text)) return null;

  // Normalize: convert block-style (name on own line) to inline style
  let normalized = text;
  if (blockPattern.test(text)) {
    normalized = text.replace(
      /^(You|User|ChatGPT|Claude|Assistant|GPT-[34]\S*|Gemini)\s*\n/gim,
      (_, name) => `${name}：`
    );
  }

  const userNames = ["User", "Human", "You", "人間", "あなた", "你", "我"];
  const assistantNames = ["Assistant", "AI", "Claude", "ChatGPT", "GPT", "Gemini"];
  const allNames = [...userNames, ...assistantNames].join("|");

  // Split on speaker turns
  const turnPattern = new RegExp(`\\n(?=(?:${allNames}|GPT-[34]\\S*)[：:])`, "gi");
  const turns = normalized.split(turnPattern).map((t) => t.trim()).filter(Boolean);

  const isUserTurn = (t: string) => userNames.some((n) => new RegExp(`^${n}[：:]`, "i").test(t));
  const isAssistantTurn = (t: string) =>
    assistantNames.some((n) => new RegExp(`^${n}[：:]`, "i").test(t)) ||
    /^GPT-[34]\S*[：:]/i.test(t);

  const stripSpeaker = (t: string) => t.replace(/^[^：:]+[：:]\s*/, "").trim();

  // Summarize long responses: keep first paragraph or first 500 chars
  const summarize = (t: string): string => {
    if (t.length <= 500) return t;
    // Try to cut at a paragraph break
    const paraBreak = t.indexOf("\n\n", 200);
    if (paraBreak > 0 && paraBreak < 600) return t.slice(0, paraBreak).trim() + "\n…（更多內容略）";
    return t.slice(0, 500).trim() + "…（更多內容略）";
  };

  for (let i = 0; i < turns.length - 1; i++) {
    if (isUserTurn(turns[i]) && isAssistantTurn(turns[i + 1])) {
      const front = stripSpeaker(turns[i]);
      const back = summarize(stripSpeaker(turns[i + 1]));
      if (front.length > 3 && back.length > 5) {
        cards.push({ id: String(id++), front, back });
        i++;
      }
    }
  }
  return cards.length > 0 ? cards : null;
}

/** Parse vocab-style lines: word（reading）：meaning or word : meaning */
function parseVocabLine(line: string): { front: string; back: string } | null {
  // Pattern: 単語（よみ）：意味 or 単語：意味
  const vocabMatch = line.match(/^([^\s（(：:]{1,20}(?:[（(][^）)]+[）)])?)\s*[：:]\s*(.+)$/);
  if (vocabMatch && vocabMatch[1].length <= 30 && vocabMatch[2].length >= 2) {
    return { front: vocabMatch[1].trim(), back: vocabMatch[2].trim() };
  }
  // Pattern: 〜form / grammar pattern：explanation
  const grammarMatch = line.match(/^([〜～].{1,25})\s*[：:]\s*(.+)$/);
  if (grammarMatch) {
    return { front: grammarMatch[1].trim(), back: grammarMatch[2].trim() };
  }
  return null;
}

const isJP = (s: string) => /[ぁ-んァ-ン一-龯]/.test(s);
const isCN = (s: string) => /[一-鿿，；、。（）]/.test(s);

/** Parse tab-separated "JP\tCN" lines (output of two-column table extraction) */
function parseTabVocabTable(text: string): PDFCard[] | null {
  const lines = text.split("\n").filter(Boolean);
  const tabLines = lines.filter((l) => l.includes("\t"));
  if (tabLines.length < 3) return null;

  let id = Date.now();
  const cards: PDFCard[] = [];
  const seen = new Set<string>();

  for (const line of tabLines) {
    const tabIdx = line.indexOf("\t");
    const jp = line.slice(0, tabIdx).trim();
    const cn = line.slice(tabIdx + 1).trim();
    if (!jp || !cn || !isJP(jp)) continue;
    if (seen.has(jp)) continue;
    seen.add(jp);
    cards.push({ id: String(id++), front: jp, back: cn });
  }
  return cards.length >= 3 ? cards : null;
}

/** Fallback: parse plain-text vocab list where JP and CN alternate on separate lines
 *  e.g.:  アイスクリーム\n冰淇淋\n間\nあいだ\n之間，中間 */
function parseLineVocabList(text: string): PDFCard[] | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 6) return null;

  let id = Date.now();
  const cards: PDFCard[] = [];
  const seen = new Set<string>();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Skip section-header single kana (あ, か...)
    if (/^[ぁ-ん]$/.test(line)) { i++; continue; }
    // Skip cover page boilerplate (long non-JP lines)
    if (line.length > 60 && !isJP(line)) { i++; continue; }

    if (isJP(line) && !isCN(line)) {
      // This looks like a Japanese word; collect reading lines (pure kana) below
      let jpWord = line;
      let j = i + 1;
      // Skip over furigana-only lines (pure kana, short)
      while (j < lines.length && /^[ぁ-んァ-ン゛゜ーa-zA-Z\s（）]+$/.test(lines[j]) && lines[j].length <= 12) {
        j++;
      }
      // Next non-kana line should be Chinese meaning
      if (j < lines.length && isCN(lines[j]) && !isJP(lines[j])) {
        const cn = lines[j];
        if (!seen.has(jpWord) && jpWord.length >= 2 && cn.length >= 1) {
          seen.add(jpWord);
          cards.push({ id: String(id++), front: jpWord, back: cn });
        }
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return cards.length >= 5 ? cards : null;
}

function parseTextToCards(text: string): PDFCard[] {
  const cleaned = cleanText(text);
  let id = Date.now();
  const cards: PDFCard[] = [];

  // 1. Try vocab table format (JP\tCN) — highest priority for structured PDFs
  const tabCards = parseTabVocabTable(cleaned);
  if (tabCards && tabCards.length >= 3) return tabCards.slice(0, 500);

  // 2. Try plain-text alternating JP/CN vocab list
  const lineCards = parseLineVocabList(cleaned);
  if (lineCards && lineCards.length >= 5) return lineCards.slice(0, 500);

  // 3. Try chat log format
  const chatCards = parseChatLog(cleaned);
  if (chatCards && chatCards.length >= 2) return chatCards.slice(0, 200);

  // Split into blocks (separated by blank lines)
  const blocks = cleaned
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 10);

  for (const block of blocks) {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // 2. Explicit Q&A block: Q:/A: or 問:/答: or 質問:/回答:
    const qMatch = block.match(/^[Qq問質][：:]\s*(.+?)(?:\n|$)/m);
    const aMatch = block.match(/[Aa答回][：:]\s*([\s\S]+)/m);
    if (qMatch && aMatch) {
      const front = qMatch[1].trim();
      const back = aMatch[1].replace(/^[Aa答回][：:]\s*/, "").trim();
      if (front && back) {
        cards.push({ id: String(id++), front, back });
        continue;
      }
    }

    // 3. Numbered item: "1. term：explanation" or "① word meaning"
    const numberedMatch = lines[0].match(/^[\d①②③④⑤⑥⑦⑧⑨⑩]+[.．。）)]\s*(.+)/);
    if (numberedMatch) {
      const rest = numberedMatch[1];
      const vocab = parseVocabLine(rest);
      if (vocab) {
        cards.push({ id: String(id++), ...vocab });
        continue;
      }
      // Treat first line as front, rest as back
      if (lines.length >= 2) {
        cards.push({ id: String(id++), front: rest, back: lines.slice(1).join("\n") });
        continue;
      }
    }

    // 4. Markdown header as card front: ## term or ▶ term
    const headerMatch = lines[0].match(/^(?:#{1,3}|[▶▷●•·・])\s*(.+)/);
    if (headerMatch && lines.length >= 2) {
      cards.push({ id: String(id++), front: headerMatch[1].trim(), back: lines.slice(1).join("\n") });
      continue;
    }

    // 5. Single-line vocab pattern: word：meaning
    if (lines.length === 1) {
      const vocab = parseVocabLine(lines[0]);
      if (vocab) {
        cards.push({ id: String(id++), ...vocab });
        continue;
      }
      // Long single line: split at first punctuation
      const parts = lines[0].split(/(?<=[。？！])/);
      if (parts.length >= 2 && parts[0].length >= 5) {
        cards.push({ id: String(id++), front: parts[0].trim(), back: parts.slice(1).join("").trim() });
      }
      continue;
    }

    // 6. Multi-line block: check if first line is a vocab term
    const firstLineVocab = parseVocabLine(lines[0]);
    if (firstLineVocab) {
      // First line is already a card; remaining lines may be additional context
      const back = firstLineVocab.back + (lines.length > 1 ? "\n" + lines.slice(1).join("\n") : "");
      cards.push({ id: String(id++), front: firstLineVocab.front, back });
      continue;
    }

    // 7. First line as front, rest as explanation (general fallback)
    if (lines[0].length <= 80 && lines.length >= 2) {
      const back = lines.slice(1).join("\n");
      if (back.length >= 5) {
        cards.push({ id: String(id++), front: lines[0], back });
      }
    }
  }

  // Deduplicate by front text
  const seen = new Set<string>();
  const deduped = cards.filter((c) => {
    const key = c.front.slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.slice(0, 500);
}

// ─── Card viewer ─────────────────────────────────────────────────────────────
function CardViewer({ dataset, onClose }: { dataset: PDFDataset; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const card = dataset.cards[index];
  const total = dataset.cards.length;

  const hasJapanese = (t: string) => /[ぁ-んァ-ン一-龯]/.test(t);
  // Vocab-style card: short front (word/phrase, not a sentence)
  const isVocabStyle = card.front.length <= 20 && !card.front.includes("。") && hasJapanese(card.front);

  // Extract reading from front if encoded as "word（reading）"
  const readingMatch = card.front.match(/^([^（]+)（([^）]+)）(.*)$/);
  const wordDisplay = readingMatch ? readingMatch[1] + readingMatch[3] : card.front;
  const reading = readingMatch ? readingMatch[2] : "";

  // Keyboard navigation
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="font-bold text-gray-900 dark:text-gray-50 truncate max-w-[200px]">{dataset.name}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{index + 1} / {total}</div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4">
          {isVocabStyle ? (
            /* Vocab style: big word + reading + Chinese meaning */
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                {reading ? (
                  <ruby className="text-4xl font-bold text-gray-900 dark:text-gray-50" style={{ rubyAlign: "center" }}>
                    {wordDisplay}<rt className="text-sm">{reading}</rt>
                  </ruby>
                ) : (
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-50">{wordDisplay}</span>
                )}
                {hasJapanese(wordDisplay) && <SpeakButton text={wordDisplay} />}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="text-xl font-semibold text-blue-700 dark:text-blue-400">{card.back}</div>
              </div>
            </div>
          ) : (
            /* Q&A style: front = question, back = answer */
            <>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase mb-2">問題</div>
                <div className="flex items-start gap-2">
                  <div className="text-base text-gray-900 dark:text-gray-50 leading-relaxed flex-1">{card.front}</div>
                  {hasJapanese(card.front) && <SpeakButton text={card.front} className="flex-shrink-0" />}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">解答</div>
                <div className="flex items-start gap-2">
                  <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed flex-1 whitespace-pre-wrap">{card.back}</div>
                  {hasJapanese(card.back) && <SpeakButton text={card.back} className="flex-shrink-0" />}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        <button
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
            index === 0 ? "bg-gray-100 dark:bg-gray-700 text-gray-300 cursor-not-allowed" : "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          }`}
        >← 上一張</button>
        <button
          onClick={() => { if (index < total - 1) setIndex((i) => i + 1); else onClose(); }}
          className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold transition-colors"
        >
          {index === total - 1 ? "完成" : "下一張 →"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PDFStudyPage() {
  const [datasets, setDatasets] = useState<PDFDataset[]>(() => loadPDFDatasets());
  const [viewing, setViewing] = useState<PDFDataset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".pdf")) { setError("請上傳 PDF 檔案"); return; }
    setUploading(true);
    setUploadProgress("載入中...");
    setError(null);
    try {
      const text = await extractTextFromPDF(file, setUploadProgress);
      const cards = parseTextToCards(text);
      if (cards.length === 0) { setError("無法從 PDF 中提取內容（已嘗試 OCR 辨識）"); setUploading(false); return; }
      const ds: PDFDataset = {
        id: `pdf-${Date.now()}`,
        name: file.name.replace(/\.pdf$/i, ""),
        createdAt: new Date().toISOString(),
        cards,
      };
      savePDFDataset(ds);
      setDatasets(loadPDFDatasets());
    } catch {
      setError("PDF 解析失敗，請確認檔案未加密");
    }
    setUploading(false);
  }, []);

  const handleDelete = (id: string) => {
    deletePDFDataset(id);
    setDatasets(loadPDFDatasets());
  };

  if (viewing) return <CardViewer dataset={viewing} onClose={() => setViewing(null)} />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">過去學習資料庫</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">上傳 PDF，自動整理成學習卡片</p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="w-full mb-6 py-10 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors tap-active"
      >
        {uploading ? (
          <>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{uploadProgress || "解析中..."}</span>
          </>
        ) : (
          <>
            <div className="text-3xl">📄</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">點擊或拖曳上傳 PDF</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">支援文字型 PDF，圖片型 PDF 自動 OCR 辨識（含日文/中文）</div>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Dataset list */}
      {datasets.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📚</div>
          <p>尚未上傳任何 PDF</p>
        </div>
      ) : (
        <div className="space-y-3">
          {datasets.map((ds) => (
            <div key={ds.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-gray-50 truncate">{ds.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {ds.cards.length} 張卡片 · {new Date(ds.createdAt).toLocaleDateString("zh-TW")}
                </div>
              </div>
              <button
                onClick={() => setViewing(ds)}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors tap-active"
              >開始學習</button>
              <button
                onClick={() => handleDelete(ds.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="刪除"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
