import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker loads locally for 100% offline compatibility
if (typeof window !== 'undefined') {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

export type PageLayoutMode = 'original' | 'fit-portrait' | 'fit-landscape';
export type FitAlignment = 'center' | 'top';

export interface TableDetectionResult {
  hasTable: boolean;
  confidence: 'high' | 'medium' | 'none';
  horizontalLines: number;
  verticalLines: number;
  intersections: number;
  alignedColumns: number;
  reason: string;
}

export interface PageOrganizeItem {
  id: string; // Unique persistent id for key tracking
  originalIndex: number; // 0-based page index in source PDF
  rotation: number; // Relative user clockwise rotation (0, 90, 180, 270)
  layoutMode: PageLayoutMode; // Keep original size or fit upright onto portrait/landscape page
  originalWidth: number; // Visual width in PDF points before user rotation
  originalHeight: number; // Visual height in PDF points before user rotation
  isDeleted: boolean;
  /** Auto-detected tabular grid metadata for this page */
  tableDetection?: TableDetectionResult;
  /** When true, rotation re-renders the entire visual area into a flattened new-orientation page instead of metadata-only /Rotate */
  flattenOnRotate?: boolean;
}

export interface OrganizePdfOptions {
  /** Vertical placement when fitting a landscape page onto a portrait sheet (default: 'center') */
  alignment?: FitAlignment;
  /** Safe print margin in PDF points (default: 18pt ≈ 6.3mm) */
  marginPt?: number;
  /** Optional already-loaded PDF.js document instance used for high-res flattened visual re-rendering */
  pdfJsDoc?: any;
}

export interface ThumbnailRenderTask {
  pageNum: number;
  dataUrl: string;
}

function normalizeAngle(angle: number): number {
  const mod = Math.round(angle) % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Returns whether a page is visually landscape BEFORE layoutMode conversion
 * (taking into account its natural dimensions + any user rotation).
 */
export function isVisuallyLandscape(
  item: Pick<PageOrganizeItem, 'originalWidth' | 'originalHeight' | 'rotation'>
): boolean {
  const rot = normalizeAngle(item.rotation);
  const w = rot === 90 || rot === 270 ? item.originalHeight : item.originalWidth;
  const h = rot === 90 || rot === 270 ? item.originalWidth : item.originalHeight;
  return w > h * 1.02;
}

/**
 * Computes the final output orientation ('portrait' | 'landscape') of a page
 * considering both rotation and layoutMode.
 */
export function getOutputOrientation(
  item: Pick<PageOrganizeItem, 'originalWidth' | 'originalHeight' | 'rotation' | 'layoutMode'>
): 'portrait' | 'landscape' {
  if (item.layoutMode === 'fit-portrait') return 'portrait';
  if (item.layoutMode === 'fit-landscape') return 'landscape';
  return isVisuallyLandscape(item) ? 'landscape' : 'portrait';
}

/**
 * Scans a PDF page for dense tabular grid structures before rotation.
 * Combines:
 * 1) Visual grid line + intersection detection (works on both digital and scanned table PDFs)
 * 2) Multi-column text alignment analysis (catches borderless tables as well)
 */
export async function detectTabularGridOnPage(
  pdfDoc: any,
  pageNum: number
): Promise<TableDetectionResult> {
  if (!pdfDoc || typeof document === 'undefined') {
    return {
      hasTable: false,
      confidence: 'none',
      horizontalLines: 0,
      verticalLines: 0,
      intersections: 0,
      alignedColumns: 0,
      reason: 'Skipped (no canvas context)',
    };
  }

  try {
    const page = await pdfDoc.getPage(pageNum);
    const baseVp = page.getViewport({ scale: 1.0 });
    const targetW = 680;
    const scale = Math.min(2.0, targetW / Math.max(baseVp.width, 1));
    const viewport = page.getViewport({ scale });

    const w = Math.max(1, Math.round(viewport.width));
    const h = Math.max(1, Math.round(viewport.height));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      return {
        hasTable: false,
        confidence: 'none',
        horizontalLines: 0,
        verticalLines: 0,
        intersections: 0,
        alignedColumns: 0,
        reason: 'Canvas unavailable',
      };
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const imgData = ctx.getImageData(0, 0, w, h).data;

    // Build fast binary dark-pixel mask (threshold luminance < 195 catches gray & black table rules)
    const isDark = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < imgData.length; i += 4, p++) {
      const lum = (imgData[i] * 77 + imgData[i + 1] * 150 + imgData[i + 2] * 29) >> 8;
      if (lum < 195) isDark[p] = 1;
    }

    // Free canvas memory immediately after extracting mask
    canvas.width = 1;
    canvas.height = 1;

    // 1. Scan for horizontal table rules (contiguous dark runs >= 22% of width, allowing 2px gap)
    const minHRun = Math.max(40, Math.round(w * 0.22));
    interface LineSegment {
      pos: number;
      start: number;
      end: number;
    }
    const rawHSegments: LineSegment[] = [];
    for (let y = 4; y < h - 4; y++) {
      const rowOffset = y * w;
      let runStart = -1;
      let gap = 0;
      for (let x = 0; x < w; x++) {
        if (isDark[rowOffset + x]) {
          if (runStart === -1) runStart = x;
          gap = 0;
        } else if (runStart !== -1) {
          gap++;
          if (gap > 2) {
            const runEnd = x - gap;
            if (runEnd - runStart >= minHRun) {
              rawHSegments.push({ pos: y, start: runStart, end: runEnd });
            }
            runStart = -1;
            gap = 0;
          }
        }
      }
      if (runStart !== -1 && w - 1 - runStart >= minHRun) {
        rawHSegments.push({ pos: y, start: runStart, end: w - 1 });
      }
    }

    // Merge thick adjacent horizontal rows (within 4px) into distinct horizontal lines
    const hLines: LineSegment[] = [];
    for (const seg of rawHSegments) {
      const prev = hLines[hLines.length - 1];
      if (prev && seg.pos - prev.pos <= 4 && Math.abs(seg.start - prev.start) < w * 0.15) {
        prev.start = Math.min(prev.start, seg.start);
        prev.end = Math.max(prev.end, seg.end);
      } else {
        hLines.push({ ...seg });
      }
    }

    // 2. Scan for vertical table rules (contiguous dark runs >= 10% of height, allowing 2px gap)
    const minVRun = Math.max(36, Math.round(h * 0.1));
    const rawVSegments: LineSegment[] = [];
    for (let x = 4; x < w - 4; x++) {
      let runStart = -1;
      let gap = 0;
      for (let y = 0; y < h; y++) {
        if (isDark[y * w + x]) {
          if (runStart === -1) runStart = y;
          gap = 0;
        } else if (runStart !== -1) {
          gap++;
          if (gap > 2) {
            const runEnd = y - gap;
            if (runEnd - runStart >= minVRun) {
              rawVSegments.push({ pos: x, start: runStart, end: runEnd });
            }
            runStart = -1;
            gap = 0;
          }
        }
      }
      if (runStart !== -1 && h - 1 - runStart >= minVRun) {
        rawVSegments.push({ pos: x, start: runStart, end: h - 1 });
      }
    }

    // Merge adjacent vertical columns (within 4px) into distinct vertical lines
    const vLines: LineSegment[] = [];
    for (const seg of rawVSegments) {
      const prev = vLines[vLines.length - 1];
      if (prev && seg.pos - prev.pos <= 4 && Math.abs(seg.start - prev.start) < h * 0.15) {
        prev.start = Math.min(prev.start, seg.start);
        prev.end = Math.max(prev.end, seg.end);
      } else {
        vLines.push({ ...seg });
      }
    }

    // 3. Count genuine grid intersections (H line crosses V line within 5px tolerance)
    let intersections = 0;
    for (const hl of hLines) {
      for (const vl of vLines) {
        if (
          vl.pos >= hl.start - 5 &&
          vl.pos <= hl.end + 5 &&
          hl.pos >= vl.start - 5 &&
          hl.pos <= vl.end + 5
        ) {
          intersections++;
        }
      }
    }

    // 4. Secondary check: aligned multi-column text grid (detects borderless tables)
    let alignedColumns = 0;
    let multiColumnRows = 0;
    try {
      const tc = await page.getTextContent();
      const rowMap = new Map<number, number[]>();
      const colBuckets = new Map<number, number>();

      for (const item of tc.items || []) {
        if (!item || typeof item.str !== 'string' || !item.str.trim()) continue;
        if (!Array.isArray(item.transform) || item.transform.length < 6) continue;
        const xBucket = Math.round(item.transform[4] / 18);
        const yBucket = Math.round(item.transform[5] / 10);
        const rowXs = rowMap.get(yBucket) || [];
        if (!rowXs.includes(xBucket)) {
          rowXs.push(xBucket);
          rowMap.set(yBucket, rowXs);
        }
        colBuckets.set(xBucket, (colBuckets.get(xBucket) || 0) + 1);
      }

      for (const xs of rowMap.values()) {
        if (xs.length >= 3) multiColumnRows++;
      }
      for (const count of colBuckets.values()) {
        if (count >= 4) alignedColumns++;
      }
    } catch {
      // Ignore text inspection failures on image-only scans
    }

    const strongGrid = hLines.length >= 3 && vLines.length >= 2 && intersections >= 6;
    const moderateGrid = hLines.length >= 5 && vLines.length >= 2;
    const borderlessTable = alignedColumns >= 3 && multiColumnRows >= 5;

    if (strongGrid) {
      return {
        hasTable: true,
        confidence: 'high',
        horizontalLines: hLines.length,
        verticalLines: vLines.length,
        intersections,
        alignedColumns,
        reason: `Dense table grid detected (${hLines.length} rows × ${vLines.length} column lines, ${intersections} grid crossings)`,
      };
    }

    if (moderateGrid || borderlessTable) {
      return {
        hasTable: true,
        confidence: 'medium',
        horizontalLines: hLines.length,
        verticalLines: vLines.length,
        intersections,
        alignedColumns,
        reason: moderateGrid
          ? `Structured table grid detected (${hLines.length} horizontal & ${vLines.length} vertical lines)`
          : `Multi-column tabular layout detected (${alignedColumns} aligned columns across ${multiColumnRows} rows)`,
      };
    }

    return {
      hasTable: false,
      confidence: 'none',
      horizontalLines: hLines.length,
      verticalLines: vLines.length,
      intersections,
      alignedColumns,
      reason: 'Standard page (no dense table grid detected)',
    };
  } catch (err) {
    console.warn(`Table grid scan warning on page ${pageNum}:`, err);
    return {
      hasTable: false,
      confidence: 'none',
      horizontalLines: 0,
      verticalLines: 0,
      intersections: 0,
      alignedColumns: 0,
      reason: 'Could not scan grid',
    };
  }
}

/**
 * Renders a source PDF page via PDF.js at high resolution and bakes the entire visual area
 * into a brand-new canvas rotated by `userCwRot` (0, 90, 180, 270) clockwise.
 * Guarantees zero distortion and removes reliance on metadata-only `/Rotate` flags.
 */
async function renderFlattenedRotatedPageImage(
  pdfJsDoc: any,
  pageNum: number,
  userCwRot: number
): Promise<{
  pngBytes: Uint8Array;
  isJpeg: boolean;
  outputPdfWidth: number;
  outputPdfHeight: number;
}> {
  const page = await pdfJsDoc.getPage(pageNum);
  const baseVp = page.getViewport({ scale: 1.0 }); // Already incorporates source PDF /Rotate

  // High-resolution crisp render (2.5x ≈ 180 DPI), safely capped at 2400px max dimension
  const maxDim = Math.max(baseVp.width, baseVp.height, 1);
  const renderScale = Math.min(2.5, 2400 / maxDim);
  const srcVp = page.getViewport({ scale: renderScale });

  const srcW = Math.max(1, Math.round(srcVp.width));
  const srcH = Math.max(1, Math.round(srcVp.height));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Could not initialize canvas for flattened rotation.');

  srcCtx.fillStyle = '#FFFFFF';
  srcCtx.fillRect(0, 0, srcW, srcH);
  await page.render({ canvasContext: srcCtx, viewport: srcVp }).promise;

  const rot = normalizeAngle(userCwRot);
  const swapAxes = rot === 90 || rot === 270;

  const outW = swapAxes ? srcH : srcW;
  const outH = swapAxes ? srcW : srcH;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not initialize output canvas for flattened rotation.');

  outCtx.fillStyle = '#FFFFFF';
  outCtx.fillRect(0, 0, outW, outH);
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  outCtx.save();
  if (rot === 90) {
    outCtx.translate(outW, 0);
    outCtx.rotate(Math.PI / 2);
  } else if (rot === 180) {
    outCtx.translate(outW, outH);
    outCtx.rotate(Math.PI);
  } else if (rot === 270) {
    outCtx.translate(0, outH);
    outCtx.rotate(-Math.PI / 2);
  }
  // Draw 1:1 with zero stretching
  outCtx.drawImage(srcCanvas, 0, 0, srcW, srcH);
  outCtx.restore();

  // Release source canvas immediately
  srcCanvas.width = 1;
  srcCanvas.height = 1;

  // Prefer crisp PNG for sharp table borders; use high-quality JPEG (0.94) if huge to keep file size reasonable
  const pixelCount = outW * outH;
  const useJpeg = pixelCount > 3_200_000;
  const mime = useJpeg ? 'image/jpeg' : 'image/png';
  const quality = useJpeg ? 0.94 : undefined;

  const blob: Blob = await new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode flattened page image.'))),
      mime,
      quality
    );
  });

  // Release output canvas
  outCanvas.width = 1;
  outCanvas.height = 1;

  const ab = await blob.arrayBuffer();
  return {
    pngBytes: new Uint8Array(ab),
    isJpeg: useJpeg,
    outputPdfWidth: swapAxes ? baseVp.height : baseVp.width,
    outputPdfHeight: swapAxes ? baseVp.width : baseVp.height,
  };
}

/**
 * Detects the standard Portrait page size of the document (e.g. A4 595x842 or Letter 612x792)
 * by inspecting existing portrait pages in the PDF, so converted landscape pages match
 * the rest of the document seamlessly.
 */
function detectDocumentPortraitSize(srcDoc: PDFDocument): { width: number; height: number } {
  const portraitSizes: { w: number; h: number }[] = [];
  const allShortLong: { short: number; long: number }[] = [];

  const count = srcDoc.getPageCount();
  for (let i = 0; i < count; i++) {
    const p = srcDoc.getPage(i);
    const { width, height } = p.getSize();
    const rot = normalizeAngle(p.getRotation().angle);
    const visW = rot === 90 || rot === 270 ? height : width;
    const visH = rot === 90 || rot === 270 ? width : height;

    allShortLong.push({ short: Math.min(visW, visH), long: Math.max(visW, visH) });
    if (visH > visW * 1.02) {
      portraitSizes.push({ w: visW, h: visH });
    }
  }

  if (portraitSizes.length > 0) {
    const buckets = new Map<string, { count: number; w: number; h: number }>();
    for (const s of portraitSizes) {
      const key = `${Math.round(s.w)}x${Math.round(s.h)}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(key, { count: 1, w: s.w, h: s.h });
      }
    }
    let best = { count: 0, w: 595.28, h: 841.89 };
    for (const entry of buckets.values()) {
      if (entry.count > best.count) {
        best = entry;
      }
    }
    return { width: best.w, height: best.h };
  }

  if (allShortLong.length > 0) {
    return { width: allShortLong[0].short, height: allShortLong[0].long };
  }

  return { width: 595.28, height: 841.89 };
}

/**
 * High-performance PDF organizer engine using pdf-lib + PDF.js.
 * - Preserves untouched & standard rotated pages losslessly via copyPages.
 * - For pages with auto-detected tabular grids (`flattenOnRotate: true`), performs a
 *   Flattened Visual Transformation that re-renders the entire visual area cleanly into
 *   the new orientation with `/Rotate 0` and locked 1:1 proportions.
 * - Converts Landscape pages to Portrait (or vice versa) with locked 1:1 aspect ratio so
 *   tables stay upright, sharp, and completely undistorted.
 */
export async function generateOrganizedPdf(
  originalPdf: File | ArrayBuffer | Uint8Array,
  activePages: {
    originalIndex: number;
    rotation: number;
    layoutMode?: PageLayoutMode;
    flattenOnRotate?: boolean;
  }[],
  onProgress?: (pct: number, status: string) => void,
  options?: OrganizePdfOptions
): Promise<Uint8Array> {
  if (activePages.length === 0) {
    throw new Error('Cannot generate PDF: All pages have been removed.');
  }

  if (onProgress) onProgress(10, 'Loading PDF in your browser...');

  let loadData: Uint8Array;
  if (originalPdf instanceof Uint8Array) {
    loadData = originalPdf;
  } else if (originalPdf instanceof ArrayBuffer) {
    loadData = new Uint8Array(originalPdf);
  } else if (originalPdf && typeof (originalPdf as any).arrayBuffer === 'function') {
    const ab = await (originalPdf as File).arrayBuffer();
    loadData = new Uint8Array(ab);
  } else {
    throw new Error('Invalid PDF data format.');
  }

  const srcDoc = await PDFDocument.load(loadData, { ignoreEncryption: true });
  const totalSrcPages = srcDoc.getPageCount();

  // Validate indices
  for (const item of activePages) {
    if (item.originalIndex < 0 || item.originalIndex >= totalSrcPages) {
      throw new Error(`Invalid page index ${item.originalIndex + 1} (Total pages: ${totalSrcPages})`);
    }
  }

  // Ensure we have a PDF.js document available if any page requires flattened visual transformation
  const needsFlattenedRender =
    typeof document !== 'undefined' &&
    activePages.some((p) => Boolean(p.flattenOnRotate) && normalizeAngle(p.rotation) !== 0);

  let pdfJsDoc = options?.pdfJsDoc || null;
  let ownsPdfJsDoc = false;
  if (needsFlattenedRender && !pdfJsDoc) {
    try {
      const task = (pdfjsLib as any).getDocument({
        data: loadData.slice(0),
        useSystemFonts: true,
      });
      pdfJsDoc = await task.promise;
      ownsPdfJsDoc = true;
    } catch (err) {
      console.warn('Could not open PDF.js for flattened transform; falling back to vector embed:', err);
      pdfJsDoc = null;
    }
  }

  if (onProgress) onProgress(22, 'Preparing updated page layout...');
  const newDoc = await PDFDocument.create();

  const docPortrait = detectDocumentPortraitSize(srcDoc);
  const docLandscape = { width: docPortrait.height, height: docPortrait.width };
  const alignment: FitAlignment = options?.alignment || 'center';

  // Batch copy all pages that remain in lossless 'original' non-flattened mode
  const originalModeSlots: number[] = [];
  const originalModeSrcIndices: number[] = [];
  activePages.forEach((item, slotIdx) => {
    const mode: PageLayoutMode = item.layoutMode || 'original';
    const userRot = normalizeAngle(item.rotation);
    const willFlatten = Boolean(item.flattenOnRotate) && userRot !== 0 && Boolean(pdfJsDoc);
    if (mode === 'original' && !willFlatten) {
      originalModeSlots.push(slotIdx);
      originalModeSrcIndices.push(item.originalIndex);
    }
  });

  const copiedBySlot = new Map<number, any>();
  if (originalModeSrcIndices.length > 0) {
    const copied = await newDoc.copyPages(srcDoc, originalModeSrcIndices);
    originalModeSlots.forEach((slotIdx, i) => {
      copiedBySlot.set(slotIdx, copied[i]);
    });
  }

  try {
    const totalToProcess = activePages.length;
    for (let i = 0; i < totalToProcess; i++) {
      const item = activePages[i];
      const mode: PageLayoutMode = item.layoutMode || 'original';
      const userRotation = normalizeAngle(item.rotation);
      const useFlattenedTransform =
        Boolean(item.flattenOnRotate) && userRotation !== 0 && Boolean(pdfJsDoc);

      if (useFlattenedTransform && pdfJsDoc) {
        // FLATTENED VISUAL TRANSFORMATION:
        // Re-render the entire visual area (including dense tables & borders) into the new orientation
        if (onProgress) {
          const pct = 28 + Math.round(((i + 1) / totalToProcess) * 58);
          onProgress(
            pct,
            `Flattening rotated table on page ${i + 1} of ${totalToProcess} (zero distortion)...`
          );
        }

        const rendered = await renderFlattenedRotatedPageImage(
          pdfJsDoc,
          item.originalIndex + 1,
          userRotation
        );

        const embeddedImg = rendered.isJpeg
          ? await newDoc.embedJpg(rendered.pngBytes)
          : await newDoc.embedPng(rendered.pngBytes);

        if (mode === 'fit-portrait' || mode === 'fit-landscape') {
          const targetSize = mode === 'fit-portrait' ? docPortrait : docLandscape;
          const targetW = targetSize.width;
          const targetH = targetSize.height;
          const outPage = newDoc.addPage([targetW, targetH]);

          const margin =
            options?.marginPt !== undefined
              ? options.marginPt
              : Math.min(18, Math.min(targetW, targetH) * 0.03);
          const availW = Math.max(targetW - margin * 2, 10);
          const availH = Math.max(targetH - margin * 2, 10);

          // Uniform 1:1 scale lock
          const scale = Math.min(
            availW / Math.max(rendered.outputPdfWidth, 1),
            availH / Math.max(rendered.outputPdfHeight, 1)
          );
          const drawW = rendered.outputPdfWidth * scale;
          const drawH = rendered.outputPdfHeight * scale;
          const drawX = (targetW - drawW) / 2;
          const drawY =
            alignment === 'top' ? targetH - margin - drawH : (targetH - drawH) / 2;

          outPage.drawImage(embeddedImg, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
          });
        } else {
          // Brand-new page in the exact rotated visual dimensions with /Rotate 0
          const outPage = newDoc.addPage([rendered.outputPdfWidth, rendered.outputPdfHeight]);
          outPage.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: rendered.outputPdfWidth,
            height: rendered.outputPdfHeight,
          });
        }
      } else if (mode === 'original') {
        const page = copiedBySlot.get(i);
        if (userRotation !== 0) {
          const currentRotation = page.getRotation().angle;
          const finalAngle = normalizeAngle(currentRotation + userRotation);
          page.setRotation(degrees(finalAngle));
        }
        newDoc.addPage(page);
      } else {
        // Lossless vector conversion onto Portrait or Landscape sheet with locked aspect ratio
        const targetSize = mode === 'fit-portrait' ? docPortrait : docLandscape;
        const targetW = targetSize.width;
        const targetH = targetSize.height;
        const outPage = newDoc.addPage([targetW, targetH]);

        const srcPage = srcDoc.getPage(item.originalIndex);
        const srcRot = normalizeAngle(srcPage.getRotation().angle);
        const totalCwRot = normalizeAngle(srcRot + userRotation);

        let embedded: Awaited<ReturnType<typeof newDoc.embedPage>> | null = null;
        try {
          embedded = await newDoc.embedPage(srcPage);
        } catch {
          embedded = null;
        }

        if (embedded && embedded.width > 0 && embedded.height > 0) {
          const rawW = embedded.width;
          const rawH = embedded.height;

          const visW = totalCwRot === 90 || totalCwRot === 270 ? rawH : rawW;
          const visH = totalCwRot === 90 || totalCwRot === 270 ? rawW : rawH;

          const margin =
            options?.marginPt !== undefined
              ? options.marginPt
              : Math.min(18, Math.min(targetW, targetH) * 0.03);
          const availW = Math.max(targetW - margin * 2, 10);
          const availH = Math.max(targetH - margin * 2, 10);

          const scale = Math.min(availW / visW, availH / visH);
          const drawnW = visW * scale;
          const drawnH = visH * scale;

          const boxX = (targetW - drawnW) / 2;
          const boxY =
            alignment === 'top' ? targetH - margin - drawnH : (targetH - drawnH) / 2;

          let drawX = boxX;
          let drawY = boxY;
          let drawAngle = 0;

          if (totalCwRot === 90) {
            drawX = boxX;
            drawY = boxY + rawW * scale;
            drawAngle = -90;
          } else if (totalCwRot === 180) {
            drawX = boxX + rawW * scale;
            drawY = boxY + rawH * scale;
            drawAngle = 180;
          } else if (totalCwRot === 270) {
            drawX = boxX + rawH * scale;
            drawY = boxY;
            drawAngle = 90;
          }

          outPage.drawPage(embedded, {
            x: drawX,
            y: drawY,
            xScale: scale,
            yScale: scale,
            rotate: degrees(drawAngle),
          });
        }
      }

      if (onProgress && !useFlattenedTransform && (i % 10 === 0 || i === totalToProcess - 1)) {
        const pct = 30 + Math.round(((i + 1) / totalToProcess) * 55);
        onProgress(pct, `Building clean PDF pages (${i + 1}/${totalToProcess})...`);
      }
    }
  } finally {
    if (ownsPdfJsDoc && pdfJsDoc?.destroy) {
      pdfJsDoc.destroy().catch(() => {});
    }
  }

  if (onProgress) onProgress(90, 'Saving your organized PDF...');
  const resultBytes = await newDoc.save({ useObjectStreams: true });
  if (onProgress) onProgress(100, 'Your organized PDF is ready!');

  return resultBytes;
}

/**
 * Render low-memory thumbnail for a specific page using PDF.js
 */
export async function renderPageThumbnail(
  pdfDoc: any,
  pageNum: number,
  targetWidth: number = 180
): Promise<string> {
  const page = await pdfDoc.getPage(pageNum);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / Math.max(unscaledViewport.width, 1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not create canvas context');

  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

  // Free memory
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}
