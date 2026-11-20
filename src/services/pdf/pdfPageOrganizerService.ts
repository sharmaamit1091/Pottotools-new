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

export interface PageOrganizeItem {
  id: string; // Unique persistent id for key tracking
  originalIndex: number; // 0-based page index in source PDF
  rotation: number; // Relative user clockwise rotation (0, 90, 180, 270)
  layoutMode: PageLayoutMode; // Keep original size or fit upright onto portrait/landscape page
  originalWidth: number; // Visual width in PDF points before user rotation
  originalHeight: number; // Visual height in PDF points before user rotation
  isDeleted: boolean;
}

export interface OrganizePdfOptions {
  /** Vertical placement when fitting a landscape page onto a portrait sheet (default: 'center') */
  alignment?: FitAlignment;
  /** Safe print margin in PDF points (default: 18pt ≈ 6.3mm) */
  marginPt?: number;
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
    // Pick the most frequent portrait size (rounded to nearest pt)
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

  // Fallback if all pages are landscape: swap the first page's dimensions so paper size stays identical
  if (allShortLong.length > 0) {
    return { width: allShortLong[0].short, height: allShortLong[0].long };
  }

  // Standard A4 portrait
  return { width: 595.28, height: 841.89 };
}

/**
 * High-performance PDF organizer engine using pdf-lib.
 * - Preserves untouched/rotated pages losslessly via copyPages.
 * - Converts Landscape pages to Portrait (or vice versa) using lossless vector
 *   Form XObject embedding (`embedPage`) with locked 1:1 aspect ratio so tables
 *   stay upright, sharp, searchable, and completely undistorted.
 */
export async function generateOrganizedPdf(
  originalPdf: File | ArrayBuffer | Uint8Array,
  activePages: {
    originalIndex: number;
    rotation: number;
    layoutMode?: PageLayoutMode;
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

  if (onProgress) onProgress(22, 'Preparing updated page layout...');
  const newDoc = await PDFDocument.create();

  // Standard portrait/landscape page dimensions matching the document's existing paper size
  const docPortrait = detectDocumentPortraitSize(srcDoc);
  const docLandscape = { width: docPortrait.height, height: docPortrait.width };
  const alignment: FitAlignment = options?.alignment || 'center';

  // Batch copy all pages that remain in 'original' layout mode for maximum speed
  const originalModeSlots: number[] = [];
  const originalModeSrcIndices: number[] = [];
  activePages.forEach((item, slotIdx) => {
    const mode: PageLayoutMode = item.layoutMode || 'original';
    if (mode === 'original') {
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

  const totalToProcess = activePages.length;
  for (let i = 0; i < totalToProcess; i++) {
    const item = activePages[i];
    const mode: PageLayoutMode = item.layoutMode || 'original';
    const userRotation = normalizeAngle(item.rotation);

    if (mode === 'original') {
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
        // Blank source page with no content stream — keep clean blank target page
        embedded = null;
      }

      if (embedded && embedded.width > 0 && embedded.height > 0) {
        const rawW = embedded.width;
        const rawH = embedded.height;

        // Visual dimensions after applying source + user clockwise rotation
        const visW = totalCwRot === 90 || totalCwRot === 270 ? rawH : rawW;
        const visH = totalCwRot === 90 || totalCwRot === 270 ? rawW : rawH;

        const margin =
          options?.marginPt !== undefined
            ? options.marginPt
            : Math.min(18, Math.min(targetW, targetH) * 0.03);
        const availW = Math.max(targetW - margin * 2, 10);
        const availH = Math.max(targetH - margin * 2, 10);

        // Strictly uniform scale (xScale === yScale) guarantees ZERO table distortion
        const scale = Math.min(availW / visW, availH / visH);
        const drawnW = visW * scale;
        const drawnH = visH * scale;

        const boxX = (targetW - drawnW) / 2;
        const boxY =
          alignment === 'top'
            ? targetH - margin - drawnH
            : (targetH - drawnH) / 2;

        // Map PDF clockwise rotation (0, 90, 180, 270) to pdf-lib counter-clockwise drawPage transform
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

    if (onProgress && (i % 10 === 0 || i === totalToProcess - 1)) {
      const pct = 30 + Math.round(((i + 1) / totalToProcess) * 55);
      onProgress(pct, `Building clean PDF pages (${i + 1}/${totalToProcess})...`);
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
