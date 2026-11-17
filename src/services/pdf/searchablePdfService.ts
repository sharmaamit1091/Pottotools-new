import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts } from 'pdf-lib';
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
  ocrLines?: OcrLine[];
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
  lineIndex?: number;
  bbox?: BoundingBox;
}

/**
 * Sanitize strings for standard PDF WinAnsi fonts (Helvetica) to prevent crash
 */
export function sanitizeForStandardFont(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .trim();
}

/**
 * Fast inspection pass: extracts digital text metadata across all pages in seconds
 * without rendering heavy raster canvases.
 */
export async function inspectPdfDocument(file: File): Promise<{
  inspection: PdfInspectionResult;
  pdfDoc: any;
  objectUrl: string;
}> {
  const objectUrl = URL.createObjectURL(file);
  const loadingTask = (pdfjsLib as any).getDocument({
    url: objectUrl,
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
    try {
      const textContent = await page.getTextContent();
      const stringItems = textContent.items
        .map((it: any) => ('str' in it ? it.str : ''))
        .filter((s: string) => s.trim().length > 0);

      const pageText = stringItems.join(' ');
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
        });
      } else {
        scannedCount++;
        pages.push({
          pageNum: i,
          isScanned: true,
          ocrStatus: 'idle',
          text: pageText, // may have partial/sparse header
          wordCount: words.length,
        });
      }
    } finally {
      page.cleanup();
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
    objectUrl,
  };
}

/**
 * Render a single page onto an HTML5 canvas for OCR or preview.
 * Returns canvas and a memory cleanup function.
 */
export async function renderSinglePage(
  pdfDoc: any,
  pageNum: number,
  scale: number = 1.5
): Promise<{
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    page.cleanup();
    throw new Error('Canvas 2D context could not be created.');
  }

  // Draw white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
  };

  await page.render(renderContext).promise;
  page.cleanup();

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
    width: viewport.width,
    height: viewport.height,
    cleanup,
  };
}

/**
 * Initialize a Tesseract worker with memory-safe logger
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
 * Recognize text on a single scanned page using Tesseract
 */
export async function processPageOcr(
  worker: Worker,
  pdfDoc: any,
  pageNum: number,
  scale: number = 1.5
): Promise<{
  text: string;
  confidence: number;
  lines: OcrLine[];
  canvasWidth: number;
  canvasHeight: number;
}> {
  const rendered = await renderSinglePage(pdfDoc, pageNum, scale);

  try {
    const res = await worker.recognize(rendered.canvas);
    const text = res.data.text || '';
    const confidence = res.data.confidence || 0;
    const lines: OcrLine[] = [];

    const anyData = res.data as any;
    if (anyData && Array.isArray(anyData.lines)) {
      for (const l of anyData.lines) {
        const lineText = (l.text || '').trim();
        if (!lineText) continue;

        const words: OcrWord[] = [];
        if (Array.isArray(l.words)) {
          for (const w of l.words) {
            const wText = (w.text || '').trim();
            if (!wText) continue;
            words.push({
              text: wText,
              bbox: {
                x0: w.bbox?.x0 || 0,
                y0: w.bbox?.y0 || 0,
                x1: w.bbox?.x1 || 0,
                y1: w.bbox?.y1 || 0,
              },
              confidence: w.confidence || 0,
            });
          }
        }

        lines.push({
          text: lineText,
          bbox: {
            x0: l.bbox?.x0 || 0,
            y0: l.bbox?.y0 || 0,
            x1: l.bbox?.x1 || 0,
            y1: l.bbox?.y1 || 0,
          },
          words: words.length > 0 ? words : undefined,
        });
      }
    }

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

/**
 * Perform keyword or exact phrase search across page text data
 */
export function searchInPageData(
  pages: PageTextData[],
  query: string,
  options: {
    matchCase?: boolean;
    exactPhrase?: boolean;
  } = {}
): SearchMatch[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const { matchCase = false, exactPhrase = false } = options;
  const results: SearchMatch[] = [];

  const flags = matchCase ? 'g' : 'gi';

  // Build regex safely escaping special characters
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchPattern = exactPhrase ? new RegExp(escaped, flags) : new RegExp(escaped, flags);

  for (const page of pages) {
    const pageText = page.text || '';
    if (!pageText) continue;

    let match: RegExpExecArray | null;
    let matchIndex = 0;

    // Reset regex index
    searchPattern.lastIndex = 0;

    while ((match = searchPattern.exec(pageText)) !== null) {
      matchIndex++;
      const start = match.index;
      const end = start + match[0].length;

      // Extract context snippet
      const snippetStart = Math.max(0, start - 45);
      const snippetEnd = Math.min(pageText.length, end + 45);

      const before = (snippetStart > 0 ? '...' : '') + pageText.slice(snippetStart, start);
      const matchedText = pageText.slice(start, end);
      const after = pageText.slice(end, snippetEnd) + (snippetEnd < pageText.length ? '...' : '');

      // Check if any OCR line matches for bounding box coordinate mapping
      let matchedBbox: BoundingBox | undefined;
      if (page.ocrLines && page.ocrLines.length > 0) {
        for (const line of page.ocrLines) {
          if (
            matchCase
              ? line.text.includes(cleanQuery)
              : line.text.toLowerCase().includes(cleanQuery.toLowerCase())
          ) {
            matchedBbox = line.bbox;
            break;
          }
        }
      }

      results.push({
        id: `match-p${page.pageNum}-m${matchIndex}-${start}`,
        pageNum: page.pageNum,
        matchIndexOnPage: matchIndex,
        snippet: {
          before,
          matchedText,
          after,
        },
        bbox: matchedBbox,
      });

      // Avoid infinite loop if zero-length match
      if (match.index === searchPattern.lastIndex) {
        searchPattern.lastIndex++;
      }
    }
  }

  return results;
}

/**
 * Generate a genuine Searchable PDF by embedding an invisible text layer (opacity: 0)
 * at precise bounding box coordinates onto the original PDF document.
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

  if (onProgress) onProgress(30, 'Embedding standard font typography...');

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const pageData = pages.find((p) => p.pageNum === pageNum);

    if (onProgress) {
      const pct = Math.min(95, 30 + Math.round(((i + 1) / totalPages) * 60));
      onProgress(pct, `Injecting invisible text layer on page ${pageNum} of ${totalPages}...`);
    }

    if (!pageData || !pageData.ocrLines || pageData.ocrLines.length === 0) {
      continue;
    }

    const pdfPage = pdfDoc.getPage(i);
    const { width: pageWidth, height: pageHeight } = pdfPage.getSize();
    const canvasWidth = pageData.canvasWidth || pageWidth;
    const canvasHeight = pageData.canvasHeight || pageHeight;

    const scaleX = pageWidth / canvasWidth;
    const scaleY = pageHeight / canvasHeight;

    for (const line of pageData.ocrLines) {
      // Prefer individual words for tighter search cursor accuracy, fallback to line
      const itemsToDraw = line.words && line.words.length > 0 ? line.words : [line];

      for (const item of itemsToDraw) {
        const rawText = item.text || '';
        const cleanText = sanitizeForStandardFont(rawText);
        if (!cleanText) continue;

        const bbox = item.bbox;
        if (!bbox) continue;

        const x = Math.max(0, bbox.x0 * scaleX);
        const y = Math.max(0, pageHeight - bbox.y1 * scaleY);
        const boxHeight = (bbox.y1 - bbox.y0) * scaleY;
        const fontSize = Math.max(5, Math.min(boxHeight * 0.82, 36));

        try {
          // Draw text with opacity 0 (invisible text layer)
          // Compatible with Adobe Acrobat, Chrome, Firefox, Edge, Safari Ctrl+F
          pdfPage.drawText(cleanText, {
            x,
            y,
            size: fontSize,
            font: helvetica,
            opacity: 0,
          });
        } catch (drawErr) {
          // Gracefully continue if an individual symbol cannot be rendered
          console.warn(`Text placement warning on page ${pageNum}:`, drawErr);
        }
      }
    }
  }

  if (onProgress) onProgress(95, 'Finalizing searchable PDF bytes...');

  // Set document metadata title
  pdfDoc.setTitle(`${sourceFile.name.replace(/\.pdf$/i, '')} (Searchable PDF)`);
  pdfDoc.setProducer('PottoTools.in Searchable PDF Engine');

  const pdfBytes = await pdfDoc.save();

  if (onProgress) onProgress(100, 'Searchable PDF successfully generated!');

  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}
