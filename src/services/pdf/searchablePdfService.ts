import * as pdfjsLib from 'pdfjs-dist';
import {
  PDFDocument,
  StandardFonts,
  TextRenderingMode,
  degrees,
  pushGraphicsState,
  popGraphicsState,
  setTextRenderingMode,
} from 'pdf-lib';
import { createWorker, Worker } from 'tesseract.js';

// Setup PDF.js worker locally for 100% offline compatibility
if (typeof window !== 'undefined') {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface NormalizedBox {
  /** Normalized 0..1 coordinates relative to the displayed page viewport (top-left origin) */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWord {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface OcrLine {
  text: string;
  bbox: BoundingBox;
  words?: OcrWord[];
}

export interface PageTextData {
  pageNum: number; // 1-based index
  isScanned: boolean; // true if page was image-only / scanned
  ocrStatus: 'idle' | 'processing' | 'done' | 'failed' | 'skipped';
  text: string;
  wordCount: number;
  confidence?: number;
  /** Positioned lines & words (populated for BOTH OCR pages and digital PDF pages) */
  ocrLines?: OcrLine[];
  /** Reference width/height in pixels matching ocrLines bbox coordinate space (top-left origin) */
  canvasWidth?: number;
  canvasHeight?: number;
  error?: string;
}

export interface PdfInspectionResult {
  pageCount: number;
  pages: PageTextData[];
  scannedCount: number;
  digitalCount: number;
  hasDigitalText: boolean;
  hasScannedPages: boolean;
}

export interface SearchMatch {
  id: string;
  pageNum: number;
  matchIndexOnPage: number;
  snippet: {
    before: string;
    matchedText: string;
    after: string;
  };
  /** One or more normalized [0..1] bounding boxes for highlighting this exact match on the page */
  highlightBoxes: NormalizedBox[];
  bbox?: BoundingBox;
}

export interface SearchOptions {
  matchCase?: boolean;
  exactPhrase?: boolean;
}

/**
 * Sanitize strings for standard PDF WinAnsi fonts (Helvetica) to prevent encoding errors
 * while preserving readable ASCII text for Ctrl+F search.
 */
export function sanitizeForStandardFont(str: string): string {
  if (!str) return '';
  return str
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Escape regex special characters.
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a regex for searching text with optional matchCase and exactPhrase.
 * Multi-word queries allow flexible whitespace (including OCR line breaks) between words.
 */
export function buildSearchRegex(query: string, options: SearchOptions = {}): RegExp | null {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  const { matchCase = false, exactPhrase = false } = options;
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const body = tokens.map(escapeRegex).join('\\s+');
  const pattern = exactPhrase
    ? `(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_])`
    : body;

  const flags = matchCase ? 'gu' : 'giu';
  try {
    return new RegExp(pattern, flags);
  } catch {
    // Fallback if unicode property lookbehind is unavailable
    const fallbackPattern = exactPhrase ? `\\b${body}\\b` : body;
    return new RegExp(fallbackPattern, matchCase ? 'g' : 'gi');
  }
}

/**
 * Synthesize proportional word bounding boxes from a line's bbox when individual word boxes
 * are unavailable (e.g., multi-word PDF.js text items or sparse OCR outputs).
 */
function splitLineIntoWordBoxes(lineText: string, lineBbox: BoundingBox, confidence = 100): OcrWord[] {
  const words: OcrWord[] = [];
  const totalLen = lineText.length;
  if (totalLen === 0) return words;

  const boxWidth = Math.max(0, lineBbox.x1 - lineBbox.x0);
  const regex = /\S+/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(lineText)) !== null) {
    const startRatio = m.index / totalLen;
    const endRatio = (m.index + m[0].length) / totalLen;
    words.push({
      text: m[0],
      bbox: {
        x0: lineBbox.x0 + boxWidth * startRatio,
        y0: lineBbox.y0,
        x1: lineBbox.x0 + boxWidth * endRatio,
        y1: lineBbox.y1,
      },
      confidence,
    });
  }

  return words;
}

/**
 * Extract positioned lines & words from a PDF.js digital text layer using viewport transform
 * so digital PDF pages support exact word highlighting on the preview canvas.
 */
function extractDigitalLines(
  textContent: any,
  viewport: any
): { text: string; lines: OcrLine[] } {
  const rawItems: Array<{
    str: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    hasEOL: boolean;
  }> = [];

  const Util = (pdfjsLib as any).Util;

  for (const item of textContent.items || []) {
    if (!item || typeof item.str !== 'string') continue;
    const str = item.str;
    if (!str.trim()) continue;

    let x0 = 0;
    let y0 = 0;
    let x1 = 0;
    let y1 = 0;

    if (Array.isArray(item.transform) && item.transform.length === 6 && Util?.transform) {
      const tx = Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.hypot(tx[2], tx[3]) || Math.abs(item.height) * viewport.scale || 12;
      const itemWidth =
        typeof item.width === 'number' && item.width > 0
          ? item.width * viewport.scale
          : Math.max(fontHeight * 0.55 * str.length, 4);

      // Detect horizontal vs rotated text
      const angle = Math.atan2(tx[1], tx[0]);
      if (Math.abs(angle) < 0.35 || Math.abs(Math.abs(angle) - Math.PI) < 0.35) {
        x0 = tx[4];
        x1 = tx[4] + (Math.cos(angle) >= 0 ? itemWidth : -itemWidth);
        if (x0 > x1) {
          const tmp = x0;
          x0 = x1;
          x1 = tmp;
        }
        y0 = tx[5] - fontHeight * 0.92;
        y1 = tx[5] + fontHeight * 0.22;
      } else {
        // Vertical / angled text fallback box
        x0 = tx[4] - fontHeight * 0.5;
        x1 = tx[4] + fontHeight * 0.5;
        y0 = Math.min(tx[5], tx[5] + Math.sin(angle) * itemWidth);
        y1 = Math.max(tx[5], tx[5] + Math.sin(angle) * itemWidth);
      }
    }

    rawItems.push({
      str,
      x0: Math.max(0, Math.min(viewport.width, x0)),
      y0: Math.max(0, Math.min(viewport.height, y0)),
      x1: Math.max(0, Math.min(viewport.width, x1)),
      y1: Math.max(0, Math.min(viewport.height, y1)),
      hasEOL: Boolean(item.hasEOL),
    });
  }

  // Group items that sit on roughly the same visual line
  const lines: OcrLine[] = [];
  let currentLineItems: typeof rawItems = [];

  const flushLine = () => {
    if (currentLineItems.length === 0) return;
    const words: OcrWord[] = [];
    const textParts: string[] = [];
    let minX0 = Infinity;
    let minY0 = Infinity;
    let maxX1 = -Infinity;
    let maxY1 = -Infinity;

    for (const it of currentLineItems) {
      const trimmed = it.str.trim();
      if (!trimmed) continue;
      textParts.push(trimmed);
      const bbox: BoundingBox = { x0: it.x0, y0: it.y0, x1: it.x1, y1: it.y1 };
      minX0 = Math.min(minX0, bbox.x0);
      minY0 = Math.min(minY0, bbox.y0);
      maxX1 = Math.max(maxX1, bbox.x1);
      maxY1 = Math.max(maxY1, bbox.y1);

      const splitWords = splitLineIntoWordBoxes(trimmed, bbox, 100);
      words.push(...splitWords);
    }

    if (textParts.length > 0 && Number.isFinite(minX0)) {
      lines.push({
        text: textParts.join(' '),
        bbox: { x0: minX0, y0: minY0, x1: maxX1, y1: maxY1 },
        words: words.length > 0 ? words : undefined,
      });
    }
    currentLineItems = [];
  };

  for (const item of rawItems) {
    if (currentLineItems.length > 0) {
      const prev = currentLineItems[currentLineItems.length - 1];
      const prevMidY = (prev.y0 + prev.y1) / 2;
      const curMidY = (item.y0 + item.y1) / 2;
      const lineTol = Math.max(6, (prev.y1 - prev.y0) * 0.6);

      if (prev.hasEOL || Math.abs(curMidY - prevMidY) > lineTol) {
        flushLine();
      }
    }
    currentLineItems.push(item);
    if (item.hasEOL) {
      flushLine();
    }
  }
  flushLine();

  const text = lines.map((l) => l.text).join('\n');
  return { text, lines };
}

/**
 * Fast inspection pass: extracts digital text & bounding boxes across all pages
 * without rendering heavy raster canvases.
 */
export async function inspectPdfDocument(file: File): Promise<{
  inspection: PdfInspectionResult;
  pdfDoc: any;
}> {
  // Pass cloned Uint8Array directly to PDF.js (avoids object URL lifecycle/CSP issues)
  const rawBuffer = await file.arrayBuffer();
  const dataCopy = new Uint8Array(rawBuffer.slice(0));

  const loadingTask = (pdfjsLib as any).getDocument({
    data: dataCopy,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('This PDF file contains no readable pages.');
  }

  const pages: PageTextData[] = [];
  let digitalCount = 0;
  let scannedCount = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const { text: pageText, lines: digitalLines } = extractDigitalLines(textContent, viewport);

    const words = pageText.split(/\s+/).filter(Boolean);

    // If page has >= 8 recognizable text words, treat as native digital text
    if (words.length >= 8) {
      digitalCount++;
      pages.push({
        pageNum: i,
        isScanned: false,
        ocrStatus: 'done',
        text: pageText,
        wordCount: words.length,
        confidence: 100,
        ocrLines: digitalLines,
        canvasWidth: viewport.width,
        canvasHeight: viewport.height,
      });
    } else {
      scannedCount++;
      pages.push({
        pageNum: i,
        isScanned: true,
        ocrStatus: 'idle',
        text: pageText, // may have partial/sparse header
        wordCount: words.length,
        ocrLines: digitalLines.length > 0 ? digitalLines : undefined,
        canvasWidth: viewport.width,
        canvasHeight: viewport.height,
      });
    }
  }

  return {
    inspection: {
      pageCount: numPages,
      pages,
      digitalCount,
      scannedCount,
      hasDigitalText: digitalCount > 0,
      hasScannedPages: scannedCount > 0,
    },
    pdfDoc,
  };
}

/**
 * Render a single page onto a fresh offscreen HTML5 canvas for OCR or preview.
 * Returns canvas, dimensions, renderTask handle (for cancellation), and memory cleanup.
 */
export async function renderSinglePage(
  pdfDoc: any,
  pageNum: number,
  scale: number = 1.5,
  onRenderTask?: (task: any) => void
): Promise<{
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (!pdfDoc || pageNum < 1 || pageNum > pdfDoc.numPages) {
    throw new Error(`Invalid page number ${pageNum} (document has ${pdfDoc?.numPages || 0} pages).`);
  }

  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context could not be created.');
  }

  // Draw clean white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvas,
    canvasContext: ctx,
    viewport,
  });

  if (onRenderTask) {
    onRenderTask(renderTask);
  }

  await renderTask.promise;

  const cleanup = () => {
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 1;
      canvas.height = 1;
    } catch {
      // Ignore cleanup error
    }
  };

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    cleanup,
  };
}

/**
 * Initialize a Tesseract worker with memory-safe logger.
 */
export async function initOcrWorker(
  language: 'eng' | 'hin' = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.progress !== undefined) {
        const pct = Math.round(m.progress * 100);
        const st = m.status ? m.status.replace(/_/g, ' ') : 'Processing...';
        onProgress(pct, `${st} (${pct}%)`);
      }
    },
  });

  return worker;
}

/**
 * Extract normalized OcrLine[] (with word-level bounding boxes) from a Tesseract.js v7 result.
 * In Tesseract.js v6/v7, lines and words live inside `data.blocks -> paragraphs -> lines -> words`
 * and are only populated when `output: { blocks: true }` is requested.
 */
function extractOcrLinesFromResult(data: any): OcrLine[] {
  const lines: OcrLine[] = [];
  if (!data) return lines;

  const pushRawLine = (l: any) => {
    const lineText = (l?.text || '').replace(/\s+/g, ' ').trim();
    if (!lineText) return;

    const lineBbox: BoundingBox = {
      x0: Number(l?.bbox?.x0) || 0,
      y0: Number(l?.bbox?.y0) || 0,
      x1: Number(l?.bbox?.x1) || 0,
      y1: Number(l?.bbox?.y1) || 0,
    };

    const words: OcrWord[] = [];
    if (Array.isArray(l?.words)) {
      for (const w of l.words) {
        const wText = (w?.text || '').replace(/\s+/g, ' ').trim();
        if (!wText) continue;
        words.push({
          text: wText,
          bbox: {
            x0: Number(w?.bbox?.x0) || lineBbox.x0,
            y0: Number(w?.bbox?.y0) || lineBbox.y0,
            x1: Number(w?.bbox?.x1) || lineBbox.x1,
            y1: Number(w?.bbox?.y1) || lineBbox.y1,
          },
          confidence: Number(w?.confidence) || 0,
        });
      }
    }

    const finalWords =
      words.length > 0
        ? words
        : splitLineIntoWordBoxes(lineText, lineBbox, Number(l?.confidence) || 0);

    lines.push({
      text: finalWords.length > 0 ? finalWords.map((w) => w.text).join(' ') : lineText,
      bbox: lineBbox,
      words: finalWords.length > 0 ? finalWords : undefined,
    });
  };

  // Tesseract.js v6/v7 primary structure: blocks -> paragraphs -> lines -> words
  if (Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      if (!Array.isArray(block?.paragraphs)) continue;
      for (const para of block.paragraphs) {
        if (!Array.isArray(para?.lines)) continue;
        for (const line of para.lines) {
          pushRawLine(line);
        }
      }
    }
  }

  // Defensive fallback for v5-style flat lines array
  if (lines.length === 0 && Array.isArray(data.lines)) {
    for (const line of data.lines) {
      pushRawLine(line);
    }
  }

  return lines;
}

/**
 * Recognize text AND exact word/line bounding boxes on a single scanned page using Tesseract.js v7.
 */
export async function processPageOcr(
  worker: Worker,
  pdfDoc: any,
  pageNum: number,
  scale: number = 1.75
): Promise<{
  text: string;
  confidence: number;
  lines: OcrLine[];
  canvasWidth: number;
  canvasHeight: number;
}> {
  const rendered = await renderSinglePage(pdfDoc, pageNum, scale);

  try {
    // CRITICAL for Tesseract.js v7: pass `{ text: true, blocks: true }` so blocks/lines/words bboxes are populated!
    const res = await worker.recognize(rendered.canvas, {}, { text: true, blocks: true });
    const confidence = res.data.confidence || 0;
    const lines = extractOcrLinesFromResult(res.data);

    // Use line-joined text when available so search indices align 1-to-1 with word highlight boxes
    const lineJoinedText = lines.map((l) => l.text).join('\n').trim();
    const rawText = (res.data.text || '').trim();
    const text = lineJoinedText.length > 0 ? lineJoinedText : rawText;

    return {
      text,
      confidence,
      lines,
      canvasWidth: rendered.width,
      canvasHeight: rendered.height,
    };
  } finally {
    rendered.cleanup();
  }
}

interface PositionedWordToken {
  text: string;
  start: number;
  end: number;
  lineIndex: number;
  bbox: BoundingBox;
}

/**
 * Build a searchable string and parallel character-to-bbox index from a page's positioned lines.
 */
function buildPositionedPageIndex(page: PageTextData): {
  fullText: string;
  tokens: PositionedWordToken[];
} {
  const tokens: PositionedWordToken[] = [];
  const parts: string[] = [];
  let cursor = 0;

  const lines = page.ocrLines || [];
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineWords =
      line.words && line.words.length > 0
        ? line.words
        : splitLineIntoWordBoxes(line.text, line.bbox);

    if (lineWords.length === 0) continue;

    if (parts.length > 0) {
      parts.push('\n');
      cursor += 1;
    }

    for (let wIdx = 0; wIdx < lineWords.length; wIdx++) {
      const w = lineWords[wIdx];
      const wText = (w.text || '').trim();
      if (!wText) continue;

      if (wIdx > 0) {
        parts.push(' ');
        cursor += 1;
      }

      const start = cursor;
      parts.push(wText);
      cursor += wText.length;

      tokens.push({
        text: wText,
        start,
        end: cursor,
        lineIndex: lineIdx,
        bbox: w.bbox,
      });
    }
  }

  return {
    fullText: parts.join(''),
    tokens,
  };
}

/**
 * Slice a word's bbox horizontally when a match covers only part of the token
 * (e.g. matching "BILASPUR" inside "(BILASPUR)," highlights only "BILASPUR").
 */
function sliceWordBbox(
  token: PositionedWordToken,
  matchStart: number,
  matchEnd: number
): BoundingBox {
  const overlapStart = Math.max(token.start, matchStart);
  const overlapEnd = Math.min(token.end, matchEnd);
  const len = Math.max(1, token.text.length);

  if (overlapStart <= token.start && overlapEnd >= token.end) {
    return token.bbox;
  }

  const r0 = (overlapStart - token.start) / len;
  const r1 = (overlapEnd - token.start) / len;
  const width = token.bbox.x1 - token.bbox.x0;

  return {
    x0: token.bbox.x0 + width * r0,
    y0: token.bbox.y0,
    x1: token.bbox.x0 + width * r1,
    y1: token.bbox.y1,
  };
}

/**
 * Compute normalized [0..1] highlight boxes for a single match span [matchStart, matchEnd).
 */
function computeNormalizedBoxesForSpan(
  tokens: PositionedWordToken[],
  matchStart: number,
  matchEnd: number,
  sourceWidth: number,
  sourceHeight: number
): NormalizedBox[] {
  if (sourceWidth <= 0 || sourceHeight <= 0 || tokens.length === 0) return [];

  // Group overlapping tokens by line so multi-word phrases form one clean rectangle per line
  const byLine = new Map<number, BoundingBox>();

  for (const tok of tokens) {
    if (tok.end <= matchStart) continue;
    if (tok.start >= matchEnd) break;

    const sliced = sliceWordBbox(tok, matchStart, matchEnd);
    const existing = byLine.get(tok.lineIndex);
    if (!existing) {
      byLine.set(tok.lineIndex, { ...sliced });
    } else {
      existing.x0 = Math.min(existing.x0, sliced.x0);
      existing.y0 = Math.min(existing.y0, sliced.y0);
      existing.x1 = Math.max(existing.x1, sliced.x1);
      existing.y1 = Math.max(existing.y1, sliced.y1);
    }
  }

  const normalized: NormalizedBox[] = [];
  for (const box of byLine.values()) {
    const x0 = Math.max(0, Math.min(1, box.x0 / sourceWidth));
    const y0 = Math.max(0, Math.min(1, box.y0 / sourceHeight));
    const x1 = Math.max(x0, Math.min(1, box.x1 / sourceWidth));
    const y1 = Math.max(y0, Math.min(1, box.y1 / sourceHeight));
    if (x1 > x0 && y1 > y0) {
      normalized.push({ x0, y0, x1, y1 });
    }
  }

  return normalized;
}

/**
 * Perform keyword or exact phrase search across all page text data,
 * attaching precise normalized word/phrase highlight bounding boxes to every match.
 */
export function searchInPageData(
  pages: PageTextData[],
  query: string,
  options: SearchOptions = {}
): SearchMatch[] {
  const searchPattern = buildSearchRegex(query, options);
  if (!searchPattern) return [];

  const results: SearchMatch[] = [];

  for (const page of pages) {
    const hasPositionedLines =
      Array.isArray(page.ocrLines) &&
      page.ocrLines.length > 0 &&
      (page.canvasWidth || 0) > 0 &&
      (page.canvasHeight || 0) > 0;

    const indexed = hasPositionedLines ? buildPositionedPageIndex(page) : null;
    const pageText = indexed && indexed.fullText.length > 0 ? indexed.fullText : page.text || '';
    if (!pageText) continue;

    let match: RegExpExecArray | null;
    let matchIndex = 0;
    searchPattern.lastIndex = 0;

    while ((match = searchPattern.exec(pageText)) !== null) {
      matchIndex++;
      const start = match.index;
      const end = start + match[0].length;

      // Extract clean readable context snippet
      const snippetStart = Math.max(0, start - 45);
      const snippetEnd = Math.min(pageText.length, end + 45);

      const before =
        (snippetStart > 0 ? '...' : '') +
        pageText.slice(snippetStart, start).replace(/\n+/g, ' ');
      const matchedText = pageText.slice(start, end).replace(/\n+/g, ' ');
      const after =
        pageText.slice(end, snippetEnd).replace(/\n+/g, ' ') +
        (snippetEnd < pageText.length ? '...' : '');

      const highlightBoxes =
        indexed && page.canvasWidth && page.canvasHeight
          ? computeNormalizedBoxesForSpan(
              indexed.tokens,
              start,
              end,
              page.canvasWidth,
              page.canvasHeight
            )
          : [];

      const firstNorm = highlightBoxes[0];
      const matchedBbox: BoundingBox | undefined =
        firstNorm && page.canvasWidth && page.canvasHeight
          ? {
              x0: firstNorm.x0 * page.canvasWidth,
              y0: firstNorm.y0 * page.canvasHeight,
              x1: firstNorm.x1 * page.canvasWidth,
              y1: firstNorm.y1 * page.canvasHeight,
            }
          : undefined;

      results.push({
        id: `match-p${page.pageNum}-m${matchIndex}-${start}`,
        pageNum: page.pageNum,
        matchIndexOnPage: matchIndex,
        snippet: {
          before,
          matchedText,
          after,
        },
        highlightBoxes,
        bbox: matchedBbox,
      });

      // Avoid infinite loop on zero-length match
      if (match.index === searchPattern.lastIndex) {
        searchPattern.lastIndex++;
      }
    }
  }

  return results;
}

/**
 * Map a displayed-viewport normalized rectangle [nx0, ny0, nx1, ny1] (top-left origin)
 * into unrotated PDF user space accounting for CropBox offset and page /Rotate (0, 90, 180, 270).
 */
function mapViewportBoxToPdfSpace(
  nx0: number,
  ny0: number,
  nx1: number,
  ny1: number,
  cropBox: { x: number; y: number; width: number; height: number },
  rotationDeg: number
): {
  x: number;
  y: number;
  boxWidthPt: number;
  boxHeightPt: number;
  rotateAngle: number;
} {
  const { x: cx, y: cy, width: cw, height: ch } = cropBox;
  const rot = ((rotationDeg % 360) + 360) % 360;

  // Baseline sits slightly above the bottom edge (descender allowance ~15%)
  const baselineNy = ny0 + (ny1 - ny0) * 0.85;

  if (rot === 90) {
    return {
      x: cx + baselineNy * cw,
      y: cy + nx0 * ch,
      boxWidthPt: (nx1 - nx0) * ch,
      boxHeightPt: (ny1 - ny0) * cw,
      rotateAngle: 90,
    };
  }

  if (rot === 180) {
    return {
      x: cx + (1 - nx0) * cw,
      y: cy + baselineNy * ch,
      boxWidthPt: (nx1 - nx0) * cw,
      boxHeightPt: (ny1 - ny0) * ch,
      rotateAngle: 180,
    };
  }

  if (rot === 270) {
    return {
      x: cx + (1 - baselineNy) * cw,
      y: cy + (1 - nx0) * ch,
      boxWidthPt: (nx1 - nx0) * ch,
      boxHeightPt: (ny1 - ny0) * cw,
      rotateAngle: 270,
    };
  }

  // Default 0 degrees
  return {
    x: cx + nx0 * cw,
    y: cy + (1 - baselineNy) * ch,
    boxWidthPt: (nx1 - nx0) * cw,
    boxHeightPt: (ny1 - ny0) * ch,
    rotateAngle: 0,
  };
}

/**
 * Safely isolate a PDF page's pre-existing content streams inside `q ... Q`
 * so any lingering CTM scale/translate/clip from mobile scanners cannot shift or clip
 * our injected invisible OCR text layer.
 */
function isolateExistingPageContentStreams(pdfDoc: PDFDocument, pdfPage: any): void {
  try {
    const startStream = pdfDoc.context.stream('q\n');
    const endStream = pdfDoc.context.stream('\nQ\n');
    const startRef = pdfDoc.context.register(startStream);
    const endRef = pdfDoc.context.register(endStream);
    if (typeof pdfPage.node?.wrapContentStreams === 'function') {
      pdfPage.node.wrapContentStreams(startRef, endRef);
    }
  } catch (err) {
    console.warn('Could not wrap existing page content stream (continuing):', err);
  }
}

/**
 * Generate a genuine Ctrl+F Searchable PDF by injecting a PDF-standard invisible text layer
 * (Text Rendering Mode 3 / `3 Tr`) aligned to scanned word coordinates across all rotations and CropBoxes.
 */
export async function generateSearchablePdf(
  sourceFile: File,
  pages: PageTextData[],
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(10, 'Reading original PDF binary structure...');

  const sourceBuffer = await sourceFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(sourceBuffer, {
    ignoreEncryption: false,
    updateMetadata: true,
  });

  if (onProgress) onProgress(25, 'Embedding standard font for invisible text layer...');

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();
  let injectedWordCount = 0;

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const pageData = pages.find((p) => p.pageNum === pageNum);

    if (onProgress) {
      const pct = Math.min(95, 25 + Math.round(((i + 1) / totalPages) * 65));
      onProgress(pct, `Injecting searchable text layer on page ${pageNum} of ${totalPages}...`);
    }

    // Only inject invisible OCR layer onto scanned pages that have recognized text
    // (Native digital pages already have their own searchable text layer!)
    if (!pageData || !pageData.isScanned) {
      continue;
    }

    const hasLines = Array.isArray(pageData.ocrLines) && pageData.ocrLines.length > 0;
    const fallbackRawText = sanitizeForStandardFont(pageData.text || '');

    if (!hasLines && !fallbackRawText) {
      continue;
    }

    const pdfPage = pdfDoc.getPage(i);
    isolateExistingPageContentStreams(pdfDoc, pdfPage);

    const cropBox = pdfPage.getCropBox();
    const rotationDeg = pdfPage.getRotation().angle || 0;
    const canvasWidth = pageData.canvasWidth || cropBox.width;
    const canvasHeight = pageData.canvasHeight || cropBox.height;

    // Enter standard PDF Invisible Text Rendering Mode (3 Tr)
    pdfPage.pushOperators(
      pushGraphicsState(),
      setTextRenderingMode(TextRenderingMode.Invisible)
    );

    if (hasLines && pageData.ocrLines) {
      for (const line of pageData.ocrLines) {
        const itemsToDraw =
          line.words && line.words.length > 0 ? line.words : [line];

        for (let wIdx = 0; wIdx < itemsToDraw.length; wIdx++) {
          const item = itemsToDraw[wIdx];
          const cleanWord = sanitizeForStandardFont(item.text || '');
          if (!cleanWord) continue;

          // Append a space between words on the same line so multi-word Ctrl+F phrases match
          const textToDraw = wIdx < itemsToDraw.length - 1 ? `${cleanWord} ` : cleanWord;

          const bbox = item.bbox;
          if (!bbox) continue;

          const nx0 = Math.max(0, Math.min(1, bbox.x0 / canvasWidth));
          const ny0 = Math.max(0, Math.min(1, bbox.y0 / canvasHeight));
          const nx1 = Math.max(nx0 + 0.001, Math.min(1, bbox.x1 / canvasWidth));
          const ny1 = Math.max(ny0 + 0.001, Math.min(1, bbox.y1 / canvasHeight));

          const mapped = mapViewportBoxToPdfSpace(nx0, ny0, nx1, ny1, cropBox, rotationDeg);

          // Fit font size cleanly to both the word height and box width so Ctrl+F selection matches visually
          let fontSize = Math.max(4, Math.min(mapped.boxHeightPt * 0.85, 64));
          const measuredWidth = helvetica.widthOfTextAtSize(cleanWord, fontSize);
          if (measuredWidth > 0 && mapped.boxWidthPt > 2 && measuredWidth > mapped.boxWidthPt * 1.15) {
            fontSize = Math.max(4, fontSize * (mapped.boxWidthPt / measuredWidth));
          }

          try {
            pdfPage.drawText(textToDraw, {
              x: mapped.x,
              y: mapped.y,
              size: fontSize,
              font: helvetica,
              rotate: mapped.rotateAngle ? degrees(mapped.rotateAngle) : undefined,
            });
            injectedWordCount++;
          } catch (drawErr) {
            console.warn(`Text placement warning on page ${pageNum}:`, drawErr);
          }
        }
      }
    } else if (fallbackRawText) {
      // Fallback: if OCR produced plain text without line boxes, still embed invisible lines
      // evenly down the page so Ctrl+F remains 100% functional
      const textLines = (pageData.text || '')
        .split(/\r?\n/)
        .map((l) => sanitizeForStandardFont(l))
        .filter(Boolean);

      const lineCount = Math.max(1, textLines.length);
      for (let lineIdx = 0; lineIdx < textLines.length; lineIdx++) {
        const ny0 = 0.05 + (lineIdx / lineCount) * 0.9;
        const ny1 = Math.min(0.98, ny0 + 0.85 / lineCount);
        const mapped = mapViewportBoxToPdfSpace(0.05, ny0, 0.95, ny1, cropBox, rotationDeg);
        const fontSize = Math.max(6, Math.min(mapped.boxHeightPt * 0.75, 14));
        try {
          pdfPage.drawText(textLines[lineIdx], {
            x: mapped.x,
            y: mapped.y,
            size: fontSize,
            font: helvetica,
            rotate: mapped.rotateAngle ? degrees(mapped.rotateAngle) : undefined,
          });
          injectedWordCount++;
        } catch (drawErr) {
          console.warn(`Fallback text placement warning on page ${pageNum}:`, drawErr);
        }
      }
    }

    pdfPage.pushOperators(popGraphicsState());
  }

  if (onProgress) {
    onProgress(
      95,
      injectedWordCount > 0
        ? `Finalizing searchable PDF (${injectedWordCount} searchable text elements embedded)...`
        : 'Finalizing searchable PDF bytes...'
    );
  }

  pdfDoc.setTitle(`${sourceFile.name.replace(/\.pdf$/i, '')} (Searchable PDF)`);
  pdfDoc.setProducer('PottoTools.in Searchable PDF Engine');

  const pdfBytes = await pdfDoc.save();

  if (onProgress) onProgress(100, 'Searchable PDF successfully generated!');

  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}
