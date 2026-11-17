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

export interface PageOrganizeItem {
  id: string; // Unique persistent id for key tracking
  originalIndex: number; // 0-based page index in source PDF
  rotation: number; // Relative user rotation (0, 90, 180, 270)
  isDeleted: boolean;
}

export interface ThumbnailRenderTask {
  pageNum: number;
  dataUrl: string;
}

/**
 * High-performance PDF organizer engine using pdf-lib
 * Copies pages in requested order, applies individual rotations, excludes deleted pages,
 * preserving original vector streams, scans, and annotations losslessly.
 */
export async function generateOrganizedPdf(
  originalPdf: File | ArrayBuffer | Uint8Array,
  activePages: { originalIndex: number; rotation: number }[],
  onProgress?: (pct: number, status: string) => void
): Promise<Uint8Array> {
  if (activePages.length === 0) {
    throw new Error('Cannot generate PDF: All pages have been removed.');
  }

  if (onProgress) onProgress(10, 'Loading source PDF document in memory...');

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

  if (onProgress) onProgress(25, 'Creating organized document structure...');
  const newDoc = await PDFDocument.create();

  // Copy all required pages in one batch
  const indicesToCopy = activePages.map((p) => p.originalIndex);
  const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy);

  const totalToProcess = copiedPages.length;
  for (let i = 0; i < totalToProcess; i++) {
    const page = copiedPages[i];
    const userRotation = activePages[i].rotation % 360;

    if (userRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      const finalAngle = (currentRotation + userRotation) % 360;
      page.setRotation(degrees(finalAngle >= 0 ? finalAngle : finalAngle + 360));
    }

    newDoc.addPage(page);

    if (onProgress && (i % 15 === 0 || i === totalToProcess - 1)) {
      const pct = 30 + Math.round(((i + 1) / totalToProcess) * 55);
      onProgress(pct, `Applying layout order and rotations (${i + 1}/${totalToProcess} pages)...`);
    }
  }

  if (onProgress) onProgress(90, 'Finalizing and compressing organized PDF...');
  const resultBytes = await newDoc.save({ useObjectStreams: true });
  if (onProgress) onProgress(100, 'Organized PDF compiled successfully!');

  return resultBytes;
}

/**
 * Render low-memory thumbnail for a specific page using PDF.js
 */
export async function renderPageThumbnail(
  pdfDoc: any,
  pageNum: number,
  targetWidth: number = 160
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
  const dataUrl = canvas.toDataURL('image/jpeg', 0.72);

  // Free memory
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}
