import * as pdfjsLib from 'pdfjs-dist';
import {
  DEFAULT_ENHANCEMENT_SETTINGS,
  DigitizerPageItem,
  DigitizerSourceFile,
} from './types';
import { detectSidewaysOrientation } from './lineSegmenter';

// Ensure PDF.js worker uses the local bundled worker for strict client-side execution
if (typeof window !== 'undefined') {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch {
    // Worker already configured
  }
}

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const RECOMMENDED_MAX_PAGES = 40;

const SUPPORTED_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

export interface LoadedDocumentBatch {
  sources: DigitizerSourceFile[];
  pages: DigitizerPageItem[];
  warnings: string[];
  pdfDocs: Map<string, any>;
  imageObjectUrls: Map<string, string>;
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

export function validateIncomingFiles(files: File[]): {
  validFiles: File[];
  errors: string[];
} {
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const ext = getFileExtension(file.name);
    const isPdf = ext === '.pdf' || file.type === 'application/pdf';
    const isImg = SUPPORTED_IMAGE_MIME.has(file.type) || ['.jpg', '.jpeg', '.png'].includes(ext);

    if (!isPdf && !isImg && !SUPPORTED_EXTENSIONS.has(ext)) {
      errors.push(
        `"${file.name}" is not a supported format. Please upload PDF, JPG, JPEG, or PNG files.`
      );
      continue;
    }

    if (file.size === 0) {
      errors.push(`"${file.name}" is empty (0 bytes) and cannot be read.`);
      continue;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(
        `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB per-file browser limit. Split large PDFs first for smooth local processing.`
      );
      continue;
    }

    validFiles.push(file);
  }

  return { validFiles, errors };
}

async function createThumbnailFromCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxWidth = 220
): Promise<string> {
  const ratio = Math.min(1, maxWidth / Math.max(1, sourceCanvas.width));
  const w = Math.max(1, Math.round(sourceCanvas.width * ratio));
  const h = Math.max(1, Math.round(sourceCanvas.height * ratio));
  const thumb = document.createElement('canvas');
  thumb.width = w;
  thumb.height = h;
  const ctx = thumb.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(sourceCanvas, 0, 0, w, h);
  }
  const url = thumb.toDataURL('image/jpeg', 0.78);
  thumb.width = 0;
  thumb.height = 0;
  return url;
}

async function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image file. It may be corrupted.'));
    img.src = url;
  });
}

/**
 * Ingests one or more local PDF / JPG / PNG files purely in browser memory.
 * Renders lightweight thumbnails immediately; high-resolution page bitmaps are rendered
 * lazily on-demand per page to stay within mobile & desktop RAM limits.
 */
export async function loadDocumentsLocally(
  files: File[],
  startingPageNumber = 1,
  onStatus?: (msg: string) => void
): Promise<LoadedDocumentBatch> {
  const sources: DigitizerSourceFile[] = [];
  const pages: DigitizerPageItem[] = [];
  const warnings: string[] = [];
  const pdfDocs = new Map<string, any>();
  const imageObjectUrls = new Map<string, string>();

  let runningPageNum = startingPageNumber;

  for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
    const file = files[fileIdx];
    const ext = getFileExtension(file.name);
    const isPdf = ext === '.pdf' || file.type === 'application/pdf';
    const sourceId = `src-${Date.now()}-${fileIdx}-${Math.random().toString(36).slice(2, 7)}`;

    if (isPdf) {
      onStatus?.(`Inspecting PDF "${file.name}" locally...`);
      let pdfDoc: any;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          useSystemFonts: true,
        });
        pdfDoc = await loadingTask.promise;
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (err?.name === 'PasswordException' || msg.toLowerCase().includes('password')) {
          throw new Error(
            `"${file.name}" is password-protected. Please unlock it first using PottoTools Unlock PDF.`
          );
        }
        throw new Error(
          `"${file.name}" could not be opened as a valid PDF. The file may be corrupted or truncated.`
        );
      }

      const numPages = pdfDoc.numPages;
      if (numPages === 0) {
        warnings.push(`"${file.name}" contains 0 pages.`);
        continue;
      }

      if (numPages > RECOMMENDED_MAX_PAGES) {
        warnings.push(
          `"${file.name}" has ${numPages} pages. For best browser memory stability, process pages in batches or one page at a time.`
        );
      }

      pdfDocs.set(sourceId, pdfDoc);
      sources.push({
        id: sourceId,
        file,
        name: file.name,
        size: file.size,
        type: 'pdf',
        pageCount: numPages,
      });

      for (let p = 1; p <= numPages; p++) {
        onStatus?.(`Generating preview thumbnail ${p} of ${numPages} (${file.name})...`);
        const page = await pdfDoc.getPage(p);
        const baseViewport = page.getViewport({ scale: 1.0 });
        const thumbScale = Math.min(0.45, 240 / Math.max(1, baseViewport.width));
        const thumbViewport = page.getViewport({ scale: Math.max(0.18, thumbScale) });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(thumbViewport.width));
        canvas.height = Math.max(1, Math.round(thumbViewport.height));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
        }
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.78);
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup?.();

        pages.push({
          id: `page-${sourceId}-${p}`,
          pageNumber: runningPageNum++,
          sourceFileId: sourceId,
          sourceFileName: file.name,
          sourceType: 'pdf',
          pdfPageIndex: p,
          width: Math.round(baseViewport.width * 2),
          height: Math.round(baseViewport.height * 2),
          thumbnailUrl,
          enhancement: { ...DEFAULT_ENHANCEMENT_SETTINGS },
          useEnhancedForRecognition: false,
          status: 'idle',
          progressPercent: 0,
          detectedLines: [],
          recognizedLines: [],
          recognizedText: '',
          editedText: '',
        });
      }
    } else {
      onStatus?.(`Loading image "${file.name}" locally...`);
      const objectUrl = URL.createObjectURL(file);
      try {
        const img = await loadImageElement(objectUrl);
        imageObjectUrls.set(sourceId, objectUrl);

        const tmp = document.createElement('canvas');
        tmp.width = img.naturalWidth || img.width;
        tmp.height = img.naturalHeight || img.height;
        const ctx = tmp.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, tmp.width, tmp.height);
          ctx.drawImage(img, 0, 0);
        }

        // Fast (<15ms) check for sideways photos saved without EXIF orientation (e.g. WhatsApp)
        const orientation = detectSidewaysOrientation(tmp);
        const initialRotation: 0 | 90 | 180 | 270 =
          orientation.isLikelySideways && orientation.suggestedRotation !== 0
            ? orientation.suggestedRotation
            : 0;

        let thumbSource: HTMLCanvasElement = tmp;
        let rotatedThumbCanvas: HTMLCanvasElement | null = null;
        if (initialRotation === 90 || initialRotation === 270) {
          rotatedThumbCanvas = document.createElement('canvas');
          rotatedThumbCanvas.width = tmp.height;
          rotatedThumbCanvas.height = tmp.width;
          const rCtx = rotatedThumbCanvas.getContext('2d');
          if (rCtx) {
            rCtx.fillStyle = '#FFFFFF';
            rCtx.fillRect(0, 0, rotatedThumbCanvas.width, rotatedThumbCanvas.height);
            rCtx.translate(rotatedThumbCanvas.width / 2, rotatedThumbCanvas.height / 2);
            rCtx.rotate((initialRotation * Math.PI) / 180);
            rCtx.drawImage(tmp, -tmp.width / 2, -tmp.height / 2);
          }
          thumbSource = rotatedThumbCanvas;
        }

        const thumbnailUrl = await createThumbnailFromCanvas(thumbSource, 220);
        const w = initialRotation === 90 || initialRotation === 270 ? tmp.height : tmp.width;
        const h = initialRotation === 90 || initialRotation === 270 ? tmp.width : tmp.height;
        if (rotatedThumbCanvas) {
          rotatedThumbCanvas.width = 0;
          rotatedThumbCanvas.height = 0;
        }
        tmp.width = 0;
        tmp.height = 0;

        sources.push({
          id: sourceId,
          file,
          name: file.name,
          size: file.size,
          type: 'image',
          pageCount: 1,
        });

        pages.push({
          id: `page-${sourceId}-1`,
          pageNumber: runningPageNum++,
          sourceFileId: sourceId,
          sourceFileName: file.name,
          sourceType: 'image',
          width: w,
          height: h,
          thumbnailUrl,
          enhancement: {
            ...DEFAULT_ENHANCEMENT_SETTINGS,
            rotation: initialRotation,
          },
          useEnhancedForRecognition: false,
          status: 'idle',
          progressPercent: 0,
          detectedLines: [],
          recognizedLines: [],
          recognizedText: '',
          editedText: '',
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        throw new Error(
          `"${file.name}" could not be decoded as a valid image. Please check the file.`
        );
      }
    }
  }

  return { sources, pages, warnings, pdfDocs, imageObjectUrls };
}

/**
 * Renders a single page on-demand into a fresh high-resolution Canvas (capped at maxDimension
 * so memory stays safe on both desktop and mobile browsers).
 * Never mutates the original source file or PDF document.
 */
export async function renderPageToCanvas(
  pageItem: DigitizerPageItem,
  pdfDocs: Map<string, any>,
  imageObjectUrls: Map<string, string>,
  maxDimension = 1900
): Promise<HTMLCanvasElement> {
  if (pageItem.sourceType === 'pdf') {
    const pdfDoc = pdfDocs.get(pageItem.sourceFileId);
    if (!pdfDoc || !pageItem.pdfPageIndex) {
      throw new Error('PDF document session is no longer loaded in memory. Please re-upload the file.');
    }

    const pdfPage = await pdfDoc.getPage(pageItem.pdfPageIndex);
    const baseViewport = pdfPage.getViewport({ scale: 1.0 });
    const longestSide = Math.max(baseViewport.width, baseViewport.height, 1);
    const targetScale = Math.min(2.6, Math.max(1.4, maxDimension / longestSide));
    const viewport = pdfPage.getViewport({ scale: targetScale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Browser canvas context is unavailable.');
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;
    pdfPage.cleanup?.();
    return canvas;
  }

  const objectUrl = imageObjectUrls.get(pageItem.sourceFileId);
  if (!objectUrl) {
    throw new Error('Image source is no longer available in browser memory.');
  }
  const img = await loadImageElement(objectUrl);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDimension / Math.max(srcW, srcH, 1));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Browser canvas context is unavailable.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, 0, 0, outW, outH);
  return canvas;
}

/**
 * Re-opens locally persisted IndexedDB draft blobs back into in-memory PDF.js documents
 * and local image Object URLs so restored drafts support full zoom, enhancement, and re-recognition.
 */
export async function rehydrateDraftSourcesLocally(
  draftSources: Array<{
    id: string;
    name: string;
    size: number;
    type: 'pdf' | 'image';
    pageCount: number;
    blob?: Blob;
  }>
): Promise<{
  sources: DigitizerSourceFile[];
  pdfDocs: Map<string, any>;
  imageObjectUrls: Map<string, string>;
  hasLiveMedia: boolean;
}> {
  const sources: DigitizerSourceFile[] = [];
  const pdfDocs = new Map<string, any>();
  const imageObjectUrls = new Map<string, string>();
  let hasLiveMedia = false;

  for (const src of draftSources) {
    const fileObj = src.blob
      ? new File([src.blob], src.name, {
          type: src.blob.type || (src.type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        })
      : new File([], src.name, {
          type: src.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
        });

    sources.push({
      id: src.id,
      file: fileObj,
      name: src.name,
      size: src.size,
      type: src.type,
      pageCount: src.pageCount,
    });

    if (!src.blob) continue;

    if (src.type === 'pdf') {
      try {
        const ab = await src.blob.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({
          data: new Uint8Array(ab),
          useSystemFonts: true,
        }).promise;
        pdfDocs.set(src.id, pdfDoc);
        hasLiveMedia = true;
      } catch {
        // Fallback cleanly to stored thumbnails & text
      }
    } else {
      const objUrl = URL.createObjectURL(src.blob);
      imageObjectUrls.set(src.id, objUrl);
      hasLiveMedia = true;
    }
  }

  return { sources, pdfDocs, imageObjectUrls, hasLiveMedia };
}

