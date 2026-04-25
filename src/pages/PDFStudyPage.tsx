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
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ").trim();

    if (text.length > 30) {
      // Normal text PDF
      pages.push(text);
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
function parseTextToCards(text: string): PDFCard[] {
  const cards: PDFCard[] = [];
  let id = Date.now();

  // Split by blank lines or numbered sections
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 20);

  for (const block of blocks) {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Detect Q&A pattern: Q: ... A: ... or 問: ... 答: ...
    const qMatch = block.match(/[Qq問][：:]\s*(.+)/);
    const aMatch = block.match(/[Aa答][：:]\s*([\s\S]+)/);
    if (qMatch && aMatch) {
      cards.push({ id: String(id++), front: qMatch[1].trim(), back: aMatch[1].trim() });
      continue;
    }

    // Detect colon-separated pattern: term : explanation
    if (lines.length >= 2) {
      cards.push({ id: String(id++), front: lines[0], back: lines.slice(1).join("\n") });
    } else {
      // Single long line: split at first sentence
      const parts = lines[0].split(/[。？！.?!]/);
      if (parts.length >= 2) {
        cards.push({ id: String(id++), front: parts[0].trim(), back: parts.slice(1).join("。").trim() });
      }
    }
  }
  return cards.slice(0, 200); // limit 200 cards
}

// ─── Card viewer ─────────────────────────────────────────────────────────────
function CardViewer({ dataset, onClose }: { dataset: PDFDataset; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const card = dataset.cards[index];
  const total = dataset.cards.length;

  // Detect if text has Japanese characters
  const hasJapanese = (t: string) => /[぀-鿿]/.test(t);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="font-bold text-gray-900 dark:text-gray-50">{dataset.name}</div>
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
          {/* Front */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
            <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase mb-2">問題</div>
            <div className="flex items-start gap-2">
              <div className="text-base text-gray-900 dark:text-gray-50 leading-relaxed flex-1">{card.front}</div>
              {hasJapanese(card.front) && <SpeakButton text={card.front} className="flex-shrink-0" />}
            </div>
          </div>
          {/* Back */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">解答</div>
            <div className="flex items-start gap-2">
              <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed flex-1 whitespace-pre-wrap">{card.back}</div>
              {hasJapanese(card.back) && <SpeakButton text={card.back} className="flex-shrink-0" />}
            </div>
          </div>
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
