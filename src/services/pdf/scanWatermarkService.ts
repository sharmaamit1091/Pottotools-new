import * as pdfjsLib from 'pdfjs-dist';
import {
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFStream,
  PDFArray,
  PDFDict,
  StandardFonts,
  rgb,
  decodePDFRawStream,
} from 'pdf-lib';

// Ensure local worker path for 100% offline/browser-side compatibility
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch {
    // Worker already configured
  }
}

export type WatermarkSourceType = 'text' | 'image-ocr' | 'manual';
export type OverlapRiskLevel = 'none' | 'medium' | 'high';
export type FillStrategy = 'smart-paper' | 'clean-white';

export interface WatermarkRegion {
  id: string;
  page: number; // 1-indexed
  x: number; // normalized [0..1] from left
  y: number; // normalized [0..1] from top
  w: number; // normalized [0..1] width
  h: number; // normalized [0..1] height
  source: WatermarkSourceType;
  matchedLabel?: string;
  confidence?: number; // 0..100
  overlapRisk: OverlapRiskLevel;
  overlapReason?: string;
  responsibleUseWarning?: string;
}

export interface PageTextBox {
  str: string;
  x: number; // normalized [0..1]
  y: number; // normalized [0..1]
  w: number;
  h: number;
  isScannerLabel: boolean;
}

export interface PageAnalysis {
  pageNum: number;
  widthPt: number;
  heightPt: number;
  rotation: number;
  hasSelectableText: boolean;
  textItemCount: number;
  textBoxes: PageTextBox[];
  detectedRegions: WatermarkRegion[];
}

export interface ProcessedPagePreview {
  pageNum: number;
  originalDataUrl: string;
  cleanedDataUrl: string;
  width: number;
  height: number;
  methodUsed: 'untouched' | 'vector-text-clean' | 'smart-inpaint' | 'hybrid-clean';
  regionsApplied: WatermarkRegion[];
  hadOverlapWarning: boolean;
  warningDetail?: string;
}

export interface ProcessWatermarkResult {
  blob: Blob;
  filename: string;
  pageCount: number;
  modifiedPages: number[];
  previews: ProcessedPagePreview[];
  vectorCleanedPages: number[];
  inpaintedPages: number[];
  warnings: string[];
}

// =========================================================================
// Scanner-App Label Allowlist (Strictly scanner-app promotional marks only)
// =========================================================================
const SCANNER_APP_PATTERNS: { name: string; regex: RegExp; exactTokens: RegExp }[] = [
  {
    name: 'CamScanner',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?cam\s*scanner\b/i,
    exactTokens: /cam\s*scanner|scanned\s*with\s*cam|cs\s*camscanner/i,
  },
  {
    name: 'Adobe Scan',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?adobe\s*scan\b/i,
    exactTokens: /adobe\s*scan/i,
  },
  {
    name: 'TapScanner',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?tap\s*scanner\b/i,
    exactTokens: /tap\s*scanner/i,
  },
  {
    name: 'Microsoft Lens',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?(?:microsoft|office)\s*lens\b/i,
    exactTokens: /(?:microsoft|office)\s*lens/i,
  },
  {
    name: 'Genius Scan',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?genius\s*scan\b/i,
    exactTokens: /genius\s*scan/i,
  },
  {
    name: 'Notebloc',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?notebloc\b/i,
    exactTokens: /notebloc/i,
  },
  {
    name: 'ClearScanner',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?clear\s*scan(?:ner)?\b/i,
    exactTokens: /clear\s*scan/i,
  },
  {
    name: 'Fast / Tiny / Simple Scanner',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?(?:fast|tiny|simple|turbo|doc|smart|pdf|swift)\s*scanner\b/i,
    exactTokens: /(?:fast|tiny|simple|turbo|doc|smart|swift)\s*scanner/i,
  },
  {
    name: 'Scanner Pro / Scanbot / vFlat / Kaagaz',
    regex: /\b(?:scanned\s*(?:with|by)\s*)?(?:scanner\s*pro|scanbot|vflat|kaagaz(?:\s*scanner)?|ok\s*en|i\s*scanner)\b/i,
    exactTokens: /scanner\s*pro|scanbot|vflat|kaagaz/i,
  },
  {
    name: 'Generic Scanner Footer',
    regex: /\b(?:scanned\s+(?:with|by|using)|created\s+with\s+[a-z0-9\s]{1,18}scan(?:ner)?)\b/i,
    exactTokens: /scanned\s+(?:with|by|using)/i,
  },
];

// Responsible-use guard patterns: warn if selection overlaps copyright / official seals
const PROTECTED_MARK_REGEX =
  /©|\bcopyright\b|\ball\s+rights\s+reserved\b|\bnotary\b|\bofficial\s+seal\b|\bauthorized\s+signatory\b|\bsignature\b/i;

export function matchScannerLabel(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length < 4) return null;
  for (const pat of SCANNER_APP_PATTERNS) {
    if (pat.regex.test(normalized)) {
      return pat.name;
    }
  }
  return null;
}

function makeRegionId(): string {
  return `wm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function rectIntersects(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  pad = 0.002
): boolean {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  );
}

/**
 * Parse a human page range string such as "1, 3-5, 8" into sorted unique 1-indexed page numbers.
 */
export function parsePageRange(input: string, totalPages: number): number[] {
  const result = new Set<number>();
  const parts = input
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      if (!Number.isNaN(start) && !Number.isNaN(end) && start <= end) {
        for (let p = start; p <= end; p++) result.add(p);
      }
    } else {
      const num = parseInt(part, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
        result.add(num);
      }
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Evaluate whether a watermark region overlaps unrelated document text, copyright marks,
 * or dense image ink crossing the boundary (for scanned image pages).
 */
export function evaluateRegionSafety(
  region: { x: number; y: number; w: number; h: number },
  textBoxes: PageTextBox[],
  canvas?: HTMLCanvasElement | null
): {
  overlapRisk: OverlapRiskLevel;
  overlapReason?: string;
  responsibleUseWarning?: string;
} {
  let overlapRisk: OverlapRiskLevel = 'none';
  let overlapReason: string | undefined;
  let responsibleUseWarning: string | undefined;

  // 1. Check against selectable non-watermark PDF text items
  const overlappingNonWatermark = textBoxes.filter(
    (tb) => !tb.isScannerLabel && tb.str.trim().length > 0 && rectIntersects(region, tb, 0.001)
  );

  const combinedText = overlappingNonWatermark.map((t) => t.str).join(' ');
  if (PROTECTED_MARK_REGEX.test(combinedText)) {
    responsibleUseWarning =
      'Selection overlaps text resembling a copyright notice, signature, or official mark. This tool is intended only for removing scanner-app labels from your own documents.';
  }

  if (overlappingNonWatermark.length > 0) {
    const snippet = combinedText.slice(0, 48).trim();
    overlapRisk = overlappingNonWatermark.length >= 2 || combinedText.length > 10 ? 'high' : 'medium';
    overlapReason = `Selection overlaps document text ("${snippet}${combinedText.length > 48 ? '…' : ''}"). Inspect Before & After carefully or tighten the box.`;
  }

  // 2. Check oversized area warning (prevents accidentally erasing half a document)
  const area = region.w * region.h;
  if (area > 0.16) {
    overlapRisk = 'high';
    overlapReason =
      overlapReason ||
      'Selected area covers a large portion of the page (>16%). Tighten the box tightly around only the scanner-app label to protect nearby content.';
  }

  // 3. Pixel-boundary ink-crossing analysis on rendered canvas (catches overlaps on scanned image PDFs!)
  if (canvas && canvas.width > 0 && canvas.height > 0 && overlapRisk !== 'high') {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      const px = Math.max(2, Math.floor(region.x * canvas.width));
      const py = Math.max(2, Math.floor(region.y * canvas.height));
      const pw = Math.min(canvas.width - px - 2, Math.max(4, Math.ceil(region.w * canvas.width)));
      const ph = Math.min(canvas.height - py - 2, Math.max(4, Math.ceil(region.h * canvas.height)));

      try {
        // Sample pixels along the 4 edges right on the perimeter (1px outside & 1px inside)
        const checkEdgeInkCrossings = (): number => {
          let crossings = 0;
          let samples = 0;
          const stepX = Math.max(2, Math.floor(pw / 28));
          const stepY = Math.max(2, Math.floor(ph / 16));

          const isDarkPixel = (x: number, y: number): boolean => {
            const d = ctx.getImageData(x, y, 1, 1).data;
            const lum = 0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2];
            return lum < 155;
          };

          // Top and bottom borders
          for (let sx = px; sx < px + pw; sx += stepX) {
            samples += 2;
            if (isDarkPixel(sx, Math.max(0, py - 2)) && isDarkPixel(sx, py + 1)) crossings++;
            if (isDarkPixel(sx, Math.min(canvas.height - 1, py + ph + 2)) && isDarkPixel(sx, py + ph - 1)) {
              crossings++;
            }
          }
          // Left and right borders
          for (let sy = py; sy < py + ph; sy += stepY) {
            samples += 2;
            if (isDarkPixel(Math.max(0, px - 2), sy) && isDarkPixel(px + 1, sy)) crossings++;
            if (isDarkPixel(Math.min(canvas.width - 1, px + pw + 2), sy) && isDarkPixel(px + pw - 1, sy)) {
              crossings++;
            }
          }
          return samples > 0 ? crossings / samples : 0;
        };

        const crossingRatio = checkEdgeInkCrossings();
        if (crossingRatio > 0.16) {
          overlapRisk = 'high';
          overlapReason =
            overlapReason ||
            'Dark text, lines, or graphics appear to cross the selection boundary. Adjust the rectangle or zoom in during Before & After review.';
        } else if (crossingRatio > 0.075 && overlapRisk === 'none') {
          overlapRisk = 'medium';
          overlapReason =
            'Selection border sits close to nearby ink or table lines. Inspect the Before & After preview closely.';
        }
      } catch {
        // Ignore cross-origin or bounds edge cases
      }
    }
  }

  return { overlapRisk, overlapReason, responsibleUseWarning };
}

/**
 * Inspect all pages of a loaded PDF document for selectable text layers
 * and automatically locate any text-based scanner-app watermarks anywhere on each page.
 */
export async function analyzePdfTextWatermarks(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  onProgress?: (page: number, total: number) => void
): Promise<PageAnalysis[]> {
  const numPages = pdfDoc.numPages;
  const analyses: PageAnalysis[] = [];

  for (let p = 1; p <= numPages; p++) {
    onProgress?.(p, numPages);
    const page = await pdfDoc.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const rawBoxes: PageTextBox[] = [];
    for (const rawItem of textContent.items as any[]) {
      if (!rawItem || typeof rawItem.str !== 'string' || !rawItem.str.trim()) continue;
      // Convert PDF coordinates to viewport top-left coordinates cleanly
      const tx = pdfjsLib.Util.transform(viewport.transform, rawItem.transform);
      const fontHeight = Math.hypot(tx[2], tx[3]) || Math.abs(rawItem.height) || 10;
      const itemWidth = Math.max(
        4,
        (rawItem.width || rawItem.str.length * fontHeight * 0.5) * (viewport.scale || 1)
      );
      const left = tx[4];
      const baselineY = tx[5];
      const top = baselineY - fontHeight * 0.88;

      rawBoxes.push({
        str: rawItem.str,
        x: clamp01(left / viewport.width),
        y: clamp01(top / viewport.height),
        w: clamp01(itemWidth / viewport.width),
        h: clamp01((fontHeight * 1.25) / viewport.height),
        isScannerLabel: false,
      });
    }

    // Group items into horizontal lines (handles split tokens like "Scanned" + "with" + "CamScanner")
    const lines: PageTextBox[][] = [];
    const sorted = [...rawBoxes].sort((a, b) => a.y - b.y || a.x - b.x);
    for (const item of sorted) {
      let placed = false;
      for (const line of lines) {
        const ref = line[0];
        const yTol = Math.max(ref.h, item.h) * 0.72;
        if (Math.abs(item.y - ref.y) <= yTol) {
          line.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) lines.push([item]);
    }

    const detectedRegions: WatermarkRegion[] = [];

    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
      // Split a line into clusters if there is a wide horizontal gap (> 12% of page width)
      const clusters: PageTextBox[][] = [];
      for (const item of line) {
        if (clusters.length === 0) {
          clusters.push([item]);
        } else {
          const prevCluster = clusters[clusters.length - 1];
          const prevItem = prevCluster[prevCluster.length - 1];
          const gap = item.x - (prevItem.x + prevItem.w);
          if (gap > 0.12) {
            clusters.push([item]);
          } else {
            prevCluster.push(item);
          }
        }
      }

      for (const cluster of clusters) {
        const clusterText = cluster.map((c) => c.str).join(' ').replace(/\s+/g, ' ').trim();
        const matchedApp = matchScannerLabel(clusterText);
        if (matchedApp) {
          cluster.forEach((c) => {
            c.isScannerLabel = true;
          });

          const minX = Math.min(...cluster.map((c) => c.x));
          const minY = Math.min(...cluster.map((c) => c.y));
          const maxX = Math.max(...cluster.map((c) => c.x + c.w));
          const maxY = Math.max(...cluster.map((c) => c.y + c.h));

          // Include slight extra left padding for scanner icons (e.g. CamScanner "CS" emblem beside text)
          const iconLeftPad = matchedApp === 'CamScanner' || matchedApp === 'Adobe Scan' ? 0.042 : 0.015;
          const rx = clamp01(minX - iconLeftPad);
          const ry = clamp01(minY - 0.008);
          const rw = clamp01(maxX - rx + 0.014);
          const rh = clamp01(maxY - ry + 0.016);

          const safety = evaluateRegionSafety({ x: rx, y: ry, w: rw, h: rh }, rawBoxes);

          detectedRegions.push({
            id: makeRegionId(),
            page: p,
            x: rx,
            y: ry,
            w: rw,
            h: rh,
            source: 'text',
            matchedLabel: matchedApp,
            confidence: 96,
            overlapRisk: safety.overlapRisk,
            overlapReason: safety.overlapReason,
            responsibleUseWarning: safety.responsibleUseWarning,
          });
        }
      }
    }

    analyses.push({
      pageNum: p,
      widthPt: viewport.width,
      heightPt: viewport.height,
      rotation: page.rotate || 0,
      hasSelectableText: rawBoxes.length > 0,
      textItemCount: rawBoxes.length,
      textBoxes: rawBoxes,
      detectedRegions,
    });
  }

  return analyses;
}

/**
 * In-Browser OCR Watermark Detection for Image-Based Scanned PDFs (uses Tesseract.js v7)
 * Scans full page (does NOT assume bottom-only!) to locate baked-in scanner-app labels anywhere on the page.
 */
export async function detectImageWatermarksViaOcr(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumbers: number[],
  pageAnalyses: PageAnalysis[],
  onProgress?: (status: string, pct: number) => void
): Promise<WatermarkRegion[]> {
  const found: WatermarkRegion[] = [];
  if (pageNumbers.length === 0) return found;

  onProgress?.('Loading in-browser OCR engine…', 8);
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng');

  try {
    for (let idx = 0; idx < pageNumbers.length; idx++) {
      const pageNum = pageNumbers[idx];
      const pct = Math.round(15 + (idx / pageNumbers.length) * 80);
      onProgress?.(`Scanning page ${pageNum} of ${pdfDoc.numPages} for scanner labels…`, pct);

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.65 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // @ts-expect-error pdfjs typing compatibility
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Request full blocks structure in Tesseract v7
      const res = await worker.recognize(canvas, {}, { text: true, blocks: true });
      const blocks = res.data.blocks || [];

      const lines: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; conf: number }[] = [];
      for (const block of blocks) {
        for (const para of block.paragraphs || []) {
          for (const line of para.lines || []) {
            if (line.text && line.bbox) {
              lines.push({
                text: line.text.trim(),
                bbox: line.bbox,
                conf: line.confidence || 70,
              });
            }
          }
        }
      }

      const analysis = pageAnalyses.find((a) => a.pageNum === pageNum);
      const textBoxes = analysis?.textBoxes || [];

      for (const line of lines) {
        const matchedApp = matchScannerLabel(line.text);
        if (matchedApp) {
          const iconLeftPad = matchedApp === 'CamScanner' || matchedApp === 'Adobe Scan' ? 0.048 : 0.016;
          const rx = clamp01(line.bbox.x0 / canvas.width - iconLeftPad);
          const ry = clamp01(line.bbox.y0 / canvas.height - 0.008);
          const maxX = clamp01(line.bbox.x1 / canvas.width + 0.016);
          const maxY = clamp01(line.bbox.y1 / canvas.height + 0.01);
          const rw = Math.max(0.04, maxX - rx);
          const rh = Math.max(0.02, maxY - ry);

          const safety = evaluateRegionSafety({ x: rx, y: ry, w: rw, h: rh }, textBoxes, canvas);

          found.push({
            id: makeRegionId(),
            page: pageNum,
            x: rx,
            y: ry,
            w: rw,
            h: rh,
            source: 'image-ocr',
            matchedLabel: matchedApp,
            confidence: Math.round(Math.min(98, Math.max(55, line.conf))),
            overlapRisk: safety.overlapRisk,
            overlapReason: safety.overlapReason,
            responsibleUseWarning: safety.responsibleUseWarning,
          });
        }
      }
    }
    onProgress?.('Scanner label detection complete.', 100);
  } finally {
    await worker.terminate();
  }

  return found;
}

/**
 * Smart Edge-Aware Paper Reconstruction (Inpainting) on Canvas2D.
 * Samples clean border pixels (filtering out dark ink outliers via bright-percentile median),
 * interpolates a smooth 4-sided background lighting gradient, adds subtle local paper grain,
 * and feathers edges gently so scanned pages look naturally spotless with zero blocky patches.
 */
export function inpaintRegionsOnCanvas(
  sourceCanvas: HTMLCanvasElement,
  regions: WatermarkRegion[],
  fillStrategy: FillStrategy = 'smart-paper'
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return out;

  ctx.drawImage(sourceCanvas, 0, 0);
  if (regions.length === 0) return out;

  const width = out.width;
  const height = out.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const getPixel = (x: number, y: number): [number, number, number] => {
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    const idx = (cy * width + cx) * 4;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  /**
   * Robust background color estimator along a line segment:
   * Takes the brightest 60% of pixels (rejects dark ink or borders) and returns their median RGB + grain std.
   */
  const estimateCleanBorderColor = (
    samples: [number, number, number][]
  ): { r: number; g: number; b: number; grain: number } => {
    if (samples.length === 0) return { r: 252, g: 252, b: 252, grain: 2 };

    const withLum = samples
      .map(([r, g, b]) => ({ r, g, b, lum: 0.299 * r + 0.587 * g + 0.114 * b }))
      .sort((a, b) => b.lum - a.lum);

    const keepCount = Math.max(1, Math.ceil(withLum.length * 0.6));
    const bgSamples = withLum.slice(0, keepCount);
    const mid = Math.floor(bgSamples.length / 2);

    const rs = bgSamples.map((s) => s.r).sort((a, b) => a - b);
    const gs = bgSamples.map((s) => s.g).sort((a, b) => a - b);
    const bs = bgSamples.map((s) => s.b).sort((a, b) => a - b);

    const medR = rs[mid];
    const medG = gs[mid];
    const medB = bs[mid];

    // Measure subtle local paper grain variance
    let devSum = 0;
    for (const s of bgSamples) {
      devSum += Math.abs(s.r - medR) + Math.abs(s.g - medG) + Math.abs(s.b - medB);
    }
    const avgDev = devSum / (bgSamples.length * 3);
    const grain = Math.min(6, Math.max(0.6, avgDev * 0.65));

    return { r: medR, g: medG, b: medB, grain };
  };

  for (const reg of regions) {
    const x0 = Math.max(0, Math.floor(reg.x * width));
    const y0 = Math.max(0, Math.floor(reg.y * height));
    const x1 = Math.min(width - 1, Math.ceil((reg.x + reg.w) * width));
    const y1 = Math.min(height - 1, Math.ceil((reg.y + reg.h) * height));
    const rw = Math.max(1, x1 - x0);
    const rh = Math.max(1, y1 - y0);

    if (fillStrategy === 'clean-white') {
      const feather = Math.min(3, Math.floor(Math.min(rw, rh) / 6));
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const edgeDist = Math.min(px - x0, x1 - px, py - y0, y1 - py);
          const alpha = feather > 0 ? Math.min(1, (edgeDist + 1) / (feather + 1)) : 1;
          const idx = (py * width + px) * 4;
          data[idx] = Math.round(data[idx] * (1 - alpha) + 255 * alpha);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - alpha) + 255 * alpha);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - alpha) + 255 * alpha);
        }
      }
      continue;
    }

    // Smart-paper directional reconstruction: sample clean ring 2..9px outside each edge
    const ringMin = 2;
    const ringMax = 9;
    const topSamples: [number, number, number][] = [];
    const bottomSamples: [number, number, number][] = [];
    const leftSamples: [number, number, number][] = [];
    const rightSamples: [number, number, number][] = [];

    const stepX = Math.max(1, Math.floor(rw / 36));
    const stepY = Math.max(1, Math.floor(rh / 24));

    for (let sx = x0; sx <= x1; sx += stepX) {
      for (let d = ringMin; d <= ringMax; d += 3) {
        if (y0 - d >= 0) topSamples.push(getPixel(sx, y0 - d));
        if (y1 + d < height) bottomSamples.push(getPixel(sx, y1 + d));
      }
    }
    for (let sy = y0; sy <= y1; sy += stepY) {
      for (let d = ringMin; d <= ringMax; d += 3) {
        if (x0 - d >= 0) leftSamples.push(getPixel(x0 - d, sy));
        if (x1 + d < width) rightSamples.push(getPixel(x1 + d, sy));
      }
    }

    const allFallback = [...topSamples, ...bottomSamples, ...leftSamples, ...rightSamples];
    const topBg = estimateCleanBorderColor(topSamples.length ? topSamples : allFallback);
    const bottomBg = estimateCleanBorderColor(bottomSamples.length ? bottomSamples : allFallback);
    const leftBg = estimateCleanBorderColor(leftSamples.length ? leftSamples : allFallback);
    const rightBg = estimateCleanBorderColor(rightSamples.length ? rightSamples : allFallback);

    const avgGrain = (topBg.grain + bottomBg.grain + leftBg.grain + rightBg.grain) / 4;
    const feather = Math.min(4, Math.max(1, Math.floor(Math.min(rw, rh) / 8)));

    // Deterministic lightweight paper micro-grain hash (avoids flat plastic look)
    const grainNoise = (x: number, y: number): number => {
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return ((h - Math.floor(h)) - 0.5) * 2 * avgGrain;
    };

    for (let py = y0; py <= y1; py++) {
      const ty = rh > 1 ? (py - y0) / rh : 0.5;
      // Vertical gradient component
      const vr = topBg.r * (1 - ty) + bottomBg.r * ty;
      const vg = topBg.g * (1 - ty) + bottomBg.g * ty;
      const vb = topBg.b * (1 - ty) + bottomBg.b * ty;

      for (let px = x0; px <= x1; px++) {
        const tx = rw > 1 ? (px - x0) / rw : 0.5;
        // Horizontal gradient component
        const hr = leftBg.r * (1 - tx) + rightBg.r * tx;
        const hg = leftBg.g * (1 - tx) + rightBg.g * tx;
        const hb = leftBg.b * (1 - tx) + rightBg.b * tx;

        // Weighted blend prioritizing vertical paper shading (typical for horizontal footers/headers)
        const noise = grainNoise(px, py);
        const targetR = Math.max(0, Math.min(255, Math.round(vr * 0.62 + hr * 0.38 + noise)));
        const targetG = Math.max(0, Math.min(255, Math.round(vg * 0.62 + hg * 0.38 + noise)));
        const targetB = Math.max(0, Math.min(255, Math.round(vb * 0.62 + hb * 0.38 + noise)));

        // Smooth edge feathering
        const edgeDist = Math.min(px - x0, x1 - px, py - y0, y1 - py);
        const alpha = Math.min(1, (edgeDist + 1) / (feather + 1));

        const idx = (py * width + px) * 4;
        data[idx] = Math.round(data[idx] * (1 - alpha) + targetR * alpha);
        data[idx + 1] = Math.round(data[idx + 1] * (1 - alpha) + targetG * alpha);
        data[idx + 2] = Math.round(data[idx + 2] * (1 - alpha) + targetB * alpha);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return out;
}

/**
 * Attempt lossless PDF content-stream stripping of matching scanner-app text operators
 * (e.g. "(Scanned with CamScanner) Tj" or "[(Scanned) -12 (with CamScanner)] TJ").
 * Returns true if at least one scanner-app text operator was cleanly removed without altering other text.
 */
function tryStripScannerTextFromPdfPage(pdfDoc: PDFDocument, pageIndex: number): boolean {
  const page = pdfDoc.getPage(pageIndex);
  let removedAny = false;

  const stripTextStream = (streamObj: PDFStream): boolean => {
    try {
      let bytes: Uint8Array;
      if (streamObj instanceof PDFRawStream) {
        bytes = decodePDFRawStream(streamObj).decode();
      } else {
        return false;
      }

      // Convert latin1 bytes to string safely (1:1 byte-to-char mapping)
      let content = '';
      for (let i = 0; i < bytes.length; i++) {
        content += String.fromCharCode(bytes[i]);
      }

      let modified = false;

      const decodePdfHex = (hex: string): string => {
        const clean = hex.replace(/\s+/g, '');
        if (clean.length < 2) return '';
        let out = '';
        // Handle both 1-byte WinAnsi/ASCII hex and 2-byte big-endian (00xx) hex
        const isWide = clean.length >= 8 && clean.length % 4 === 0 && clean.startsWith('00');
        const step = isWide ? 4 : 2;
        for (let i = 0; i + step <= clean.length; i += step) {
          const code = parseInt(clean.slice(i, i + step), 16);
          if (code >= 32 && code <= 126) out += String.fromCharCode(code);
          else if (code === 160) out += ' ';
        }
        return out;
      };

      // 1a. Replace single literal text operators: (Scanned with CamScanner) Tj
      let updated = content.replace(/\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g, (full, inner: string) => {
        const unescaped = inner.replace(/\\([()\\])/g, '$1');
        if (matchScannerLabel(unescaped)) {
          modified = true;
          return '() Tj';
        }
        return full;
      });

      // 1b. Replace single hex text operators: <5363616E...> Tj
      updated = updated.replace(/<([0-9A-Fa-f\s]{8,})>\s*Tj/g, (full, hexInner: string) => {
        const decoded = decodePdfHex(hexInner);
        if (matchScannerLabel(decoded)) {
          modified = true;
          return '<> Tj';
        }
        return full;
      });

      // 2. Replace TJ array operators containing literal (...) or hex <...> runs
      const replacedTJ = updated.replace(/\[([^\]]+)\]\s*TJ/g, (full, arrayInner: string) => {
        const tokens = Array.from(
          arrayInner.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)|<([0-9A-Fa-f\s]{2,})>/g)
        );
        const joined = tokens
          .map((m) => {
            if (m[1] !== undefined) return m[1].replace(/\\([()\\])/g, '$1');
            if (m[2] !== undefined) return decodePdfHex(m[2]);
            return '';
          })
          .join('');
        if (matchScannerLabel(joined)) {
          modified = true;
          return '[()] TJ';
        }
        return full;
      });

      if (!modified) return false;

      // Write back uncompressed latin1 bytes & remove FlateDecode Filter cleanly so pdf-lib saves valid PDF
      const outBytes = new Uint8Array(replacedTJ.length);
      for (let i = 0; i < replacedTJ.length; i++) {
        outBytes[i] = replacedTJ.charCodeAt(i) & 0xff;
      }

      const newDict = streamObj.dict.clone(pdfDoc.context);
      newDict.delete(PDFName.of('Filter'));
      newDict.delete(PDFName.of('DecodeParms'));
      newDict.set(PDFName.of('Length'), pdfDoc.context.obj(outBytes.length));
      const newStream = PDFRawStream.of(newDict, outBytes);

      // Update contents reference on the page or XObject
      const ref = pdfDoc.context.getObjectRef(streamObj);
      if (ref) {
        pdfDoc.context.assign(ref, newStream);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Inspect page Contents stream(s)
  const contents = page.node.Contents();
  if (contents instanceof PDFStream) {
    if (stripTextStream(contents)) removedAny = true;
  } else if (contents instanceof PDFArray) {
    for (let i = 0; i < contents.size(); i++) {
      const item = contents.lookup(i);
      if (item instanceof PDFStream && stripTextStream(item)) {
        removedAny = true;
      }
    }
  }

  // Also inspect Form XObjects (some scanner apps place footer labels in a Form XObject)
  const resources = page.node.Resources();
  if (resources instanceof PDFDict) {
    const xObjects = resources.lookup(PDFName.of('XObject'));
    if (xObjects instanceof PDFDict) {
      for (const [, val] of xObjects.entries()) {
        const resolved = pdfDoc.context.lookup(val);
        if (resolved instanceof PDFStream) {
          const subtype = resolved.dict.lookup(PDFName.of('Subtype'));
          if (subtype instanceof PDFName && subtype.asString() === '/Form') {
            if (stripTextStream(resolved)) removedAny = true;
          }
        }
      }
    }
  }

  return removedAny;
}

/**
 * Full Watermark Removal Pipeline:
 * - Preserves exact original page dimensions, orientation, and unmodified pages (100% lossless!)
 * - Applies lossless PDF vector text-stream removal where safe for pure text-based scanner labels
 * - Applies high-DPI smart directional paper inpainting for image-based scanned pages & manual boxes
 * - Generates high-clarity Before & After visual previews for mandatory user review before download!
 */
export async function processRemoveScanWatermarks(params: {
  sourceBuffer: ArrayBuffer;
  originalFilename: string;
  regions: WatermarkRegion[];
  fillStrategy: FillStrategy;
  onProgress?: (status: string, pct: number) => void;
}): Promise<ProcessWatermarkResult> {
  const { sourceBuffer, originalFilename, regions, fillStrategy, onProgress } = params;

  onProgress?.('Loading PDF structure locally…', 5);
  const srcBytes = new Uint8Array(sourceBuffer.slice(0));
  const pdfJsDoc = await pdfjsLib.getDocument({ data: srcBytes.slice(0) }).promise;
  const numPages = pdfJsDoc.numPages;

  // Load original PDF with pdf-lib so untouched pages and text-cleaned pages stay 100% lossless!
  const editablePdf = await PDFDocument.load(srcBytes, { ignoreEncryption: true });

  const regionsByPage = new Map<number, WatermarkRegion[]>();
  for (const r of regions) {
    const list = regionsByPage.get(r.page) || [];
    list.push(r);
    regionsByPage.set(r.page, list);
  }

  const modifiedPages: number[] = [];
  const vectorCleanedPages: number[] = [];
  const inpaintedPages: number[] = [];
  const warnings: string[] = [];

  // Step 1: Process each page that has active regions
  const pagesToModify = Array.from(regionsByPage.keys()).sort((a, b) => a - b);

  for (let idx = 0; idx < pagesToModify.length; idx++) {
    const pageNum = pagesToModify[idx];
    const pageRegions = regionsByPage.get(pageNum) || [];
    if (pageRegions.length === 0) continue;

    const pct = Math.round(12 + (idx / Math.max(1, pagesToModify.length)) * 55);
    onProgress?.(`Cleaning page ${pageNum} of ${numPages}…`, pct);
    modifiedPages.push(pageNum);

    const hasOnlyTextRegions = pageRegions.every((r) => r.source === 'text');
    let vectorRemoved = false;

    if (hasOnlyTextRegions) {
      vectorRemoved = tryStripScannerTextFromPdfPage(editablePdf, pageNum - 1);
    }

    if (vectorRemoved) {
      vectorCleanedPages.push(pageNum);
    } else {
      // High-resolution smart directional paper inpainting preserving exact original dimensions & orientation
      const jsPage = await pdfJsDoc.getPage(pageNum);
      const baseViewport = jsPage.getViewport({ scale: 1.0 });
      // Adaptive crisp DPI (2.2x up to 2400px max edge for crisp readability & low memory)
      const maxDim = Math.max(baseViewport.width, baseViewport.height);
      const renderScale = Math.min(2.3, Math.max(1.6, 2200 / Math.max(1, maxDim)));
      const renderViewport = jsPage.getViewport({ scale: renderScale });

      const origCanvas = document.createElement('canvas');
      origCanvas.width = Math.round(renderViewport.width);
      origCanvas.height = Math.round(renderViewport.height);
      const oCtx = origCanvas.getContext('2d');
      if (!oCtx) throw new Error('Canvas 2D context unavailable.');
      oCtx.fillStyle = '#FFFFFF';
      oCtx.fillRect(0, 0, origCanvas.width, origCanvas.height);
      // @ts-expect-error pdfjs typing compatibility
      await jsPage.render({ canvasContext: oCtx, viewport: renderViewport }).promise;

      const cleanedCanvas = inpaintRegionsOnCanvas(origCanvas, pageRegions, fillStrategy);

      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        cleanedCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(`Failed to encode cleaned page ${pageNum}`))),
          'image/jpeg',
          0.93
        );
      });
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const embeddedImg = await editablePdf.embedJpg(jpegBytes);

      // Replace ONLY this page in editablePdf at exact original width & height (already visually upright from pdfjs viewport)
      editablePdf.removePage(pageNum - 1);
      const inserted = editablePdf.insertPage(pageNum - 1, [baseViewport.width, baseViewport.height]);
      inserted.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });

      inpaintedPages.push(pageNum);
    }

    const risky = pageRegions.find((r) => r.overlapRisk !== 'none');
    if (risky) {
      warnings.push(
        `Page ${pageNum}: ${risky.overlapReason || 'Selected region sits near document content. Please verify carefully.'}`
      );
    }
  }

  onProgress?.('Building clean PDF and generating Before & After previews…', 74);
  const outBytes = await editablePdf.save({ useObjectStreams: true });
  const outBlob = new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' });

  // Step 2: Render accurate Before & After comparison previews directly from the real original & real generated output PDF!
  const cleanedPdfJsDoc = await pdfjsLib.getDocument({ data: outBytes.slice(0) }).promise;
  const previews: ProcessedPagePreview[] = [];

  for (let p = 1; p <= numPages; p++) {
    const pct = Math.round(76 + (p / numPages) * 23);
    onProgress?.(`Preparing Before & After comparison (Page ${p}/${numPages})…`, pct);

    const origPage = await pdfJsDoc.getPage(p);
    const cleanPage = await cleanedPdfJsDoc.getPage(p);

    const previewScale = Math.min(1.5, 1150 / Math.max(origPage.getViewport({ scale: 1 }).width, 1));
    const origVp = origPage.getViewport({ scale: previewScale });
    const cleanVp = cleanPage.getViewport({ scale: previewScale });

    const origCanvas = document.createElement('canvas');
    origCanvas.width = Math.round(origVp.width);
    origCanvas.height = Math.round(origVp.height);
    const oCtx = origCanvas.getContext('2d')!;
    oCtx.fillStyle = '#FFFFFF';
    oCtx.fillRect(0, 0, origCanvas.width, origCanvas.height);
    // @ts-expect-error pdfjs typing compatibility
    await origPage.render({ canvasContext: oCtx, viewport: origVp }).promise;

    const cleanCanvas = document.createElement('canvas');
    cleanCanvas.width = Math.round(cleanVp.width);
    cleanCanvas.height = Math.round(cleanVp.height);
    const cCtx = cleanCanvas.getContext('2d')!;
    cCtx.fillStyle = '#FFFFFF';
    cCtx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);
    // @ts-expect-error pdfjs typing compatibility
    await cleanPage.render({ canvasContext: cCtx, viewport: cleanVp }).promise;

    const pRegions = regionsByPage.get(p) || [];
    const hadOverlapWarning = pRegions.some((r) => r.overlapRisk !== 'none');
    const warningDetail = pRegions.find((r) => r.overlapReason)?.overlapReason;

    let methodUsed: ProcessedPagePreview['methodUsed'] = 'untouched';
    if (vectorCleanedPages.includes(p)) methodUsed = 'vector-text-clean';
    else if (inpaintedPages.includes(p)) methodUsed = 'smart-inpaint';

    previews.push({
      pageNum: p,
      originalDataUrl: origCanvas.toDataURL('image/jpeg', 0.9),
      cleanedDataUrl: cleanCanvas.toDataURL('image/jpeg', 0.9),
      width: origCanvas.width,
      height: origCanvas.height,
      methodUsed,
      regionsApplied: pRegions,
      hadOverlapWarning,
      warningDetail,
    });
  }

  const baseName = originalFilename.replace(/\.pdf$/i, '');
  onProgress?.('Ready for Before & After review!', 100);

  return {
    blob: outBlob,
    filename: `${baseName}_clean.pdf`,
    pageCount: numPages,
    modifiedPages,
    previews,
    vectorCleanedPages,
    inpaintedPages,
    warnings,
  };
}

/**
 * Generates a realistic 2-page demo PDF containing:
 * - Page 1: Native text-based "Scanned with CamScanner" footer (tests Case A lossless vector text removal!)
 * - Page 2: Image-based scanned document with a baked-in "Scanned with Adobe Scan" footer (tests Case B OCR + smart paper inpainting!)
 */
export async function generateSampleScannedPdf(): Promise<File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // --- Page 1: Text-based CamScanner footer ---
  const p1 = doc.addPage([595, 842]);
  p1.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.985, 0.982, 0.968) });
  p1.drawText('PROJECT COMPLETION CERTIFICATE', { x: 64, y: 760, size: 18, font: bold, color: rgb(0.1, 0.14, 0.24) });
  p1.drawLine({ start: { x: 64, y: 744 }, end: { x: 530, y: 744 }, thickness: 1.5, color: rgb(0.2, 0.35, 0.65) });

  const bodyLines1 = [
    'Document Ref: PT-2026-0842   |   Date: 19 November 2026',
    '',
    'This document confirms successful verification of the submitted project',
    'deliverables, engineering documentation, and compliance checklists.',
    '',
    '1. All technical specifications have been reviewed and approved.',
    '2. Supporting invoices and inspection sheets are attached on Page 2.',
    '3. Keep a clean watermark-free copy for official submission.',
    '',
    'Prepared by: Operations & Documentation Desk',
    'Status: Verified & Approved',
  ];
  let cy = 700;
  for (const line of bodyLines1) {
    p1.drawText(line, { x: 64, y: cy, size: 12, font, color: rgb(0.18, 0.22, 0.28) });
    cy -= 26;
  }

  // Realistic bottom-right text-based CamScanner watermark
  p1.drawText('Scanned with CamScanner', {
    x: 418,
    y: 28,
    size: 11,
    font: bold,
    color: rgb(0.12, 0.56, 0.52),
  });

  // --- Page 2: Baked-in Image-based scanned sheet with "Scanned with Adobe Scan" ---
  const scanCanvas = document.createElement('canvas');
  scanCanvas.width = 1190;
  scanCanvas.height = 1684;
  const sCtx = scanCanvas.getContext('2d')!;

  // Warm off-white scanned paper gradient
  const paperGrad = sCtx.createLinearGradient(0, 0, 1190, 1684);
  paperGrad.addColorStop(0, '#faf8f2');
  paperGrad.addColorStop(0.5, '#f5f2ea');
  paperGrad.addColorStop(1, '#eee9dc');
  sCtx.fillStyle = paperGrad;
  sCtx.fillRect(0, 0, 1190, 1684);

  // Scanned document heading & table
  sCtx.fillStyle = '#1e293b';
  sCtx.font = 'bold 42px Helvetica, Arial, sans-serif';
  sCtx.fillText('ATTACHED INSPECTION SUMMARY (SCANNED COPY)', 110, 175);

  sCtx.strokeStyle = '#64748b';
  sCtx.lineWidth = 3;
  sCtx.strokeRect(110, 235, 970, 560);
  sCtx.fillStyle = '#e2e8f0';
  sCtx.fillRect(112, 237, 966, 78);

  sCtx.fillStyle = '#0f172a';
  sCtx.font = 'bold 28px Helvetica, Arial, sans-serif';
  sCtx.fillText('Item Description', 140, 286);
  sCtx.fillText('Batch Code', 650, 286);
  sCtx.fillText('Result', 920, 286);

  const rows = [
    ['Optical Clarity Check', 'QC-401', 'PASSED'],
    ['Page Orientation & Margin Audit', 'QC-402', 'PASSED'],
    ['Archive Readability Verification', 'QC-403', 'PASSED'],
    ['Final Print-Ready Layout', 'QC-404', 'PASSED'],
  ];
  sCtx.font = '26px Helvetica, Arial, sans-serif';
  rows.forEach((row, i) => {
    const ry = 385 + i * 102;
    sCtx.beginPath();
    sCtx.moveTo(110, ry - 48);
    sCtx.lineTo(1080, ry - 48);
    sCtx.strokeStyle = '#cbd5e1';
    sCtx.lineWidth = 2;
    sCtx.stroke();

    sCtx.fillStyle = '#334155';
    sCtx.fillText(row[0], 140, ry);
    sCtx.fillText(row[1], 650, ry);
    sCtx.fillStyle = '#047857';
    sCtx.fillText(row[2], 920, ry);
  });

  // Baked-in "Scanned with Adobe Scan" footer label at bottom-left
  sCtx.fillStyle = '#dc2626';
  sCtx.fillRect(112, 1574, 34, 34);
  sCtx.fillStyle = '#ffffff';
  sCtx.font = 'bold 20px Helvetica, Arial, sans-serif';
  sCtx.fillText('A', 122, 1598);
  sCtx.fillStyle = '#334155';
  sCtx.font = 'bold 28px Helvetica, Arial, sans-serif';
  sCtx.fillText('Scanned with Adobe Scan', 162, 1601);

  const scanJpgBlob = await new Promise<Blob>((resolve, reject) => {
    scanCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Sample scan encode failed'))), 'image/jpeg', 0.9);
  });
  const scanImg = await doc.embedJpg(new Uint8Array(await scanJpgBlob.arrayBuffer()));
  const p2 = doc.addPage([595, 842]);
  p2.drawImage(scanImg, { x: 0, y: 0, width: 595, height: 842 });

  const bytes = await doc.save();
  return new File([new Uint8Array(bytes)], 'Sample_CamScanner_AdobeScan_Document.pdf', { type: 'application/pdf' });
}
