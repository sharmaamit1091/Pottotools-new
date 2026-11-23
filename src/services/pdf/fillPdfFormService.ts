import * as pdfjsLib from 'pdfjs-dist';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
} from 'pdf-lib';
import JSZip from 'jszip';
import {
  FormElement,
  TextFormElement,
  ImageFormElement,
  MarkFormElement,
  ShapeFormElement,
  DetectedInteractiveField,
  SuggestedFieldArea,
  SuggestedFieldCategory,
  PageMetaInfo,
  PageRotationDeg,
  SavedFillPdfProjectMetadata,
  ReusableMediaAsset,
  ReusableTextSnippet,
  WhiteoutPatch,
} from '../../types/fillPdfForm';

// Configure local PDF.js worker for 100% browser-side processing
if (typeof window !== 'undefined') {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

export interface LoadedFormPdf {
  pdfJsDoc: any;
  rawBytes: Uint8Array;
  pageCount: number;
  pagesMeta: PageMetaInfo[];
  interactiveFields: DetectedInteractiveField[];
  initialInteractiveValues: Record<string, string | boolean>;
  hasInteractiveForm: boolean;
}

/**
 * Parse a hex color (#RRGGBB) into normalized [0..1] RGB components for pdf-lib.
 */
export function hexToRgbComponents(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '#0f172a').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 0.06, g: 0.09, b: 0.16 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Returns true if every character in text can be encoded safely in PDF WinAnsi standard fonts.
 */
export function isWinAnsiSafe(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 10 || code === 13 || code === 9) continue;
    if (code >= 0x20 && code <= 0x7e) continue;
    if (code >= 0xa0 && code <= 0xff) continue;
    return false;
  }
  return true;
}

/**
 * Compute displayed page dimensions (in PDF points) after applying user rotation.
 */
export function getDisplayedPageSize(
  meta: PageMetaInfo,
  userRotation: PageRotationDeg = 0
): { width: number; height: number } {
  if (userRotation === 90 || userRotation === 270) {
    return { width: meta.baseHeight, height: meta.baseWidth };
  }
  return { width: meta.baseWidth, height: meta.baseHeight };
}

/**
 * Transform a normalized [0..1] rectangle (top-left origin) when a page is rotated clockwise
 * by `deltaCw` degrees (90, 180, or 270). Preserves exact placement on the rotated page!
 */
export function rotateNormalizedRect(
  rect: { x: number; y: number; width: number; height: number },
  deltaCw: PageRotationDeg
): { x: number; y: number; width: number; height: number } {
  const { x, y, width: w, height: h } = rect;
  if (deltaCw === 90) {
    return {
      x: Math.max(0, Math.min(1 - h, 1 - (y + h))),
      y: Math.max(0, Math.min(1 - w, x)),
      width: h,
      height: w,
    };
  }
  if (deltaCw === 180) {
    return {
      x: Math.max(0, Math.min(1 - w, 1 - (x + w))),
      y: Math.max(0, Math.min(1 - h, 1 - (y + h))),
      width: w,
      height: h,
    };
  }
  if (deltaCw === 270) {
    return {
      x: Math.max(0, Math.min(1 - h, y)),
      y: Math.max(0, Math.min(1 - w, 1 - (x + w))),
      width: h,
      height: w,
    };
  }
  return { x, y, width: w, height: h };
}

/**
 * Convert a visual normalized point (vx, vy) in [0..1] (top-left origin of the displayed page
 * after totalRotation degrees CW) into raw unrotated pdf-lib page coordinates (bottom-left origin).
 */
export function visualNormalizedPointToPdf(
  vx: number,
  vy: number,
  rawPdfWidth: number,
  rawPdfHeight: number,
  totalRotationCw: PageRotationDeg
): { x: number; y: number } {
  const rot = (((totalRotationCw % 360) + 360) % 360) as PageRotationDeg;
  if (rot === 0) {
    return {
      x: vx * rawPdfWidth,
      y: (1 - vy) * rawPdfHeight,
    };
  }
  if (rot === 90) {
    // Visual top-left (0,0) maps to raw bottom-left (0,0); visual +x goes along raw +y, visual +y goes along raw +x
    return {
      x: vy * rawPdfWidth,
      y: vx * rawPdfHeight,
    };
  }
  if (rot === 180) {
    return {
      x: (1 - vx) * rawPdfWidth,
      y: vy * rawPdfHeight,
    };
  }
  // rot === 270
  return {
    x: (1 - vy) * rawPdfWidth,
    y: (1 - vx) * rawPdfHeight,
  };
}

/**
 * Load a PDF document for form filling:
 * - Reads page geometry and native rotation via PDF.js
 * - Inspects existing AcroForm interactive widgets (text, checkbox, radio, dropdown)
 *   and merges metadata from pdf-lib so initial values & options are preserved.
 */
export async function loadPdfForFormFilling(rawBytesInput: Uint8Array): Promise<LoadedFormPdf> {
  const rawBytes = new Uint8Array(rawBytesInput.slice(0));
  const pdfJsCopy = new Uint8Array(rawBytes.slice(0));

  let pdfJsDoc: any;
  try {
    const loadingTask = (pdfjsLib as any).getDocument({
      data: pdfJsCopy,
      useSystemFonts: true,
    });
    pdfJsDoc = await loadingTask.promise;
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (/password/i.test(msg)) {
      throw new Error(
        'This PDF is password-protected. Please unlock it first using our Unlock PDF tool.'
      );
    }
    throw new Error('Could not open this PDF. The file may be corrupted or unsupported.');
  }

  const pageCount: number = pdfJsDoc.numPages || 0;
  if (pageCount === 0) {
    throw new Error('This PDF contains no pages.');
  }

  // Read pdf-lib AcroForm metadata (field types, options, current values) safely
  const fieldMetaMap = new Map<
    string,
    {
      type: 'text' | 'checkbox' | 'radio' | 'dropdown';
      value: string | boolean;
      options?: string[];
      multiline?: boolean;
      readOnly?: boolean;
    }
  >();

  try {
    const libDoc = await PDFDocument.load(rawBytes.slice(0), { ignoreEncryption: true });
    const form = libDoc.getForm();
    const fields = form.getFields();
    for (const f of fields) {
      const name = f.getName();
      const readOnly = f.isReadOnly();
      if (f instanceof PDFTextField) {
        let val = '';
        try {
          val = f.getText() || '';
        } catch {
          val = '';
        }
        fieldMetaMap.set(name, {
          type: 'text',
          value: val,
          multiline: f.isMultiline(),
          readOnly,
        });
      } else if (f instanceof PDFCheckBox) {
        let checked = false;
        try {
          checked = f.isChecked();
        } catch {
          checked = false;
        }
        fieldMetaMap.set(name, {
          type: 'checkbox',
          value: checked,
          readOnly,
        });
      } else if (f instanceof PDFRadioGroup) {
        let selected = '';
        let options: string[] = [];
        try {
          selected = f.getSelected() || '';
          options = f.getOptions() || [];
        } catch {
          selected = '';
        }
        fieldMetaMap.set(name, {
          type: 'radio',
          value: selected,
          options,
          readOnly,
        });
      } else if (f instanceof PDFDropdown || f instanceof PDFOptionList) {
        let selected = '';
        let options: string[] = [];
        try {
          const sel = f.getSelected();
          selected = Array.isArray(sel) ? sel[0] || '' : '';
          options = f.getOptions() || [];
        } catch {
          selected = '';
        }
        fieldMetaMap.set(name, {
          type: 'dropdown',
          value: selected,
          options,
          readOnly,
        });
      }
    }
  } catch {
    // Non-fatal: PDF has no AcroForm or non-standard form dictionary
  }

  const pagesMeta: PageMetaInfo[] = [];
  const interactiveFields: DetectedInteractiveField[] = [];
  const initialInteractiveValues: Record<string, string | boolean> = {};
  const widgetCounters = new Map<string, number>();

  for (let p = 1; p <= pageCount; p++) {
    const page = await pdfJsDoc.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const nativeRot = ((((page.rotate || 0) % 360) + 360) % 360) as PageRotationDeg;

    pagesMeta.push({
      pageNum: p,
      baseWidth: viewport.width,
      baseHeight: viewport.height,
      nativeRotation: nativeRot,
    });

    try {
      const annotations = await page.getAnnotations({ intent: 'display' });
      for (const ann of annotations || []) {
        if (ann.subtype !== 'Widget' || !ann.fieldName || !Array.isArray(ann.rect)) continue;
        const rect = viewport.convertToViewportRectangle(ann.rect);
        const minX = Math.min(rect[0], rect[2]);
        const maxX = Math.max(rect[0], rect[2]);
        const minY = Math.min(rect[1], rect[3]);
        const maxY = Math.max(rect[1], rect[3]);
        const w = maxX - minX;
        const h = maxY - minY;
        if (w < 4 || h < 4) continue;

        const fieldName = String(ann.fieldName);
        const libMeta = fieldMetaMap.get(fieldName);

        let fType: 'text' | 'checkbox' | 'radio' | 'dropdown' | null = libMeta?.type ?? null;
        if (!fType) {
          if (ann.fieldType === 'Tx') fType = 'text';
          else if (ann.fieldType === 'Btn' && ann.radioButton) fType = 'radio';
          else if (ann.fieldType === 'Btn' && ann.checkBox) fType = 'checkbox';
          else if (ann.fieldType === 'Ch') fType = 'dropdown';
        }
        if (!fType) continue;

        const idx = (widgetCounters.get(fieldName) || 0) + 1;
        widgetCounters.set(fieldName, idx);

        let initialVal: string | boolean =
          libMeta !== undefined
            ? libMeta.value
            : fType === 'checkbox'
            ? Boolean(ann.fieldValue && ann.fieldValue !== 'Off')
            : String(ann.fieldValue || '');

        if (initialInteractiveValues[fieldName] === undefined) {
          initialInteractiveValues[fieldName] = initialVal;
        }

        const options: string[] | undefined =
          libMeta?.options && libMeta.options.length > 0
            ? libMeta.options
            : Array.isArray(ann.options)
            ? ann.options.map((o: any) =>
                typeof o === 'string' ? o : String(o?.displayValue || o?.exportValue || '')
              )
            : undefined;

        interactiveFields.push({
          id: `${fieldName}__w${idx}`,
          fieldName,
          type: fType,
          pageNum: p,
          x: Math.max(0, Math.min(1, minX / viewport.width)),
          y: Math.max(0, Math.min(1, minY / viewport.height)),
          width: Math.max(0.01, Math.min(1, w / viewport.width)),
          height: Math.max(0.01, Math.min(1, h / viewport.height)),
          exportValue: ann.buttonValue ? String(ann.buttonValue) : undefined,
          options,
          multiline: Boolean(libMeta?.multiline || ann.multiLine),
          readOnly: Boolean(libMeta?.readOnly || ann.readOnly),
          initialValue: initialVal,
        });
      }
    } catch {
      // Ignore annotation errors on individual pages
    }
  }

  // Sort interactive fields logically per page (top-to-bottom, left-to-right) for Tab navigation
  interactiveFields.sort((a, b) => {
    if (a.pageNum !== b.pageNum) return a.pageNum - b.pageNum;
    if (Math.abs(a.y - b.y) > 0.015) return a.y - b.y;
    return a.x - b.x;
  });

  return {
    pdfJsDoc,
    rawBytes,
    pageCount,
    pagesMeta,
    interactiveFields,
    initialInteractiveValues,
    hasInteractiveForm: interactiveFields.length > 0,
  };
}

/**
 * Render a PDF page onto an HTMLCanvasElement at the requested scale and user rotation.
 */
export async function renderFormPdfPageToCanvas(
  pdfJsDoc: any,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale: number,
  userRotation: PageRotationDeg = 0,
  onRenderTask?: (task: any) => void
): Promise<{ width: number; height: number }> {
  const page = await pdfJsDoc.getPage(pageNum);
  const nativeRot = ((((page.rotate || 0) % 360) + 360) % 360) as PageRotationDeg;
  const totalRot = (nativeRot + userRotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRot });

  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire 2D canvas context.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvas,
    canvasContext: ctx,
    viewport,
  });
  if (onRenderTask) onRenderTask(renderTask);
  await renderTask.promise;

  return { width: canvas.width, height: canvas.height };
}

/**
 * Generate a lightweight thumbnail data URL for the left page sidebar.
 */
export async function renderPageThumbnailDataUrl(
  pdfJsDoc: any,
  pageNum: number,
  userRotation: PageRotationDeg = 0,
  targetWidth = 140
): Promise<string> {
  const page = await pdfJsDoc.getPage(pageNum);
  const nativeRot = ((((page.rotate || 0) % 360) + 360) % 360) as PageRotationDeg;
  const totalRot = (nativeRot + userRotation) % 360;
  const baseVp = page.getViewport({ scale: 1.0, rotation: totalRot });
  const scale = Math.max(0.15, Math.min(0.6, targetWidth / Math.max(1, baseVp.width)));
  const vp = page.getViewport({ scale, rotation: totalRot });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(vp.width));
  canvas.height = Math.max(1, Math.round(vp.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
  const url = canvas.toDataURL('image/jpeg', 0.78);
  canvas.width = 1;
  canvas.height = 1;
  return url;
}

const FIELD_LABEL_RULES: Array<{
  regex: RegExp;
  category: SuggestedFieldCategory;
  label: string;
  boxW: number;
  boxH: number;
  placement: 'right' | 'below' | 'inside';
}> = [
  {
    regex: /(?:paste|affix|recent)?\s*(?:passport\s*size\s*)?(?:photo|photograph)/i,
    category: 'photo',
    label: 'Photo',
    boxW: 0.16,
    boxH: 0.16,
    placement: 'inside',
  },
  {
    regex: /(?:applicant'?s?\s*|candidate'?s?\s*|authorized\s*)?(?:signature|sign\s*here|signed\s*by)/i,
    category: 'signature',
    label: 'Signature',
    boxW: 0.24,
    boxH: 0.065,
    placement: 'below',
  },
  {
    regex: /(?:father'?s?|mother'?s?|husband'?s?|guardian'?s?)\s*name/i,
    category: 'name',
    label: "Father's / Guardian Name",
    boxW: 0.34,
    boxH: 0.032,
    placement: 'right',
  },
  {
    regex: /(?:full\s*|applicant\s*|candidate\s*|student\s*)?name\s*[:._-]?$/i,
    category: 'name',
    label: 'Full Name',
    boxW: 0.34,
    boxH: 0.032,
    placement: 'right',
  },
  {
    regex: /(?:permanent\s*|present\s*|correspondence\s*|residential\s*)?address/i,
    category: 'address',
    label: 'Address',
    boxW: 0.42,
    boxH: 0.058,
    placement: 'right',
  },
  {
    regex: /(?:date\s*of\s*birth|d\.?\s*o\.?\s*b\.?|date\s*[:._-]?$)/i,
    category: 'date',
    label: 'Date',
    boxW: 0.2,
    boxH: 0.03,
    placement: 'right',
  },
  {
    regex: /(?:mobile|phone|contact|tel\.?|whatsapp)\s*(?:no\.?|number)?/i,
    category: 'mobile',
    label: 'Mobile Number',
    boxW: 0.24,
    boxH: 0.03,
    placement: 'right',
  },
  {
    regex: /(?:e-?mail)\s*(?:id|address)?/i,
    category: 'email',
    label: 'Email Address',
    boxW: 0.3,
    boxH: 0.03,
    placement: 'right',
  },
  {
    regex: /(?:☐|□|\[\s*\]|\(\s*\)|yes\s*\/\s*no|male\s*\/\s*female|tick\s*here)/i,
    category: 'checkbox',
    label: 'Checkbox',
    boxW: 0.032,
    boxH: 0.028,
    placement: 'right',
  },
];

/**
 * Optional Auto-Detect Form Fields for a single page.
 * Scans PDF text layout first, and optionally falls back to in-browser Tesseract OCR
 * for scanned image-only pages. Returns editable/dismissible suggestions — never auto-fills.
 */
export async function detectSuggestedFieldsOnPage(
  pdfJsDoc: any,
  pageNum: number,
  userRotation: PageRotationDeg = 0,
  allowOcrFallback = true,
  onStatus?: (msg: string) => void
): Promise<{ suggestions: SuggestedFieldArea[]; usedOcr: boolean }> {
  const page = await pdfJsDoc.getPage(pageNum);
  const nativeRot = ((((page.rotate || 0) % 360) + 360) % 360) as PageRotationDeg;
  const totalRot = (nativeRot + userRotation) % 360;
  const viewport = page.getViewport({ scale: 1.0, rotation: totalRot });

  interface TextSpan {
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    source: 'text-layout' | 'ocr';
  }

  const spans: TextSpan[] = [];
  let usedOcr = false;

  // 1. Inspect native digital PDF text items
  try {
    const tc = await page.getTextContent();
    const rawItems = (tc.items || []) as any[];
    for (const item of rawItems) {
      const str = String(item?.str || '').trim();
      if (!str) continue;
      const tx = (pdfjsLib as any).Util.transform(viewport.transform, item.transform);
      const fontH = Math.max(8, Math.hypot(tx[2], tx[3]) || item.height || 11);
      const x = tx[4] / viewport.width;
      const y = (tx[5] - fontH) / viewport.height;
      const w = Math.max(0.01, (item.width || str.length * fontH * 0.5) / viewport.width);
      const h = Math.max(0.014, fontH / viewport.height);
      spans.push({ text: str, x, y, w, h, source: 'text-layout' });
    }
  } catch {
    // fallback to OCR below
  }

  // Group adjacent spans on the same visual line into coherent phrases
  const mergedSpans: TextSpan[] = [];
  const sorted = [...spans].sort((a, b) => (Math.abs(a.y - b.y) > 0.012 ? a.y - b.y : a.x - b.x));
  for (const s of sorted) {
    const prev = mergedSpans[mergedSpans.length - 1];
    if (
      prev &&
      Math.abs(prev.y - s.y) < 0.012 &&
      s.x - (prev.x + prev.w) >= -0.01 &&
      s.x - (prev.x + prev.w) < 0.045
    ) {
      const newRight = Math.max(prev.x + prev.w, s.x + s.w);
      prev.text = `${prev.text} ${s.text}`.trim();
      prev.w = newRight - prev.x;
      prev.h = Math.max(prev.h, s.h);
    } else {
      mergedSpans.push({ ...s });
    }
  }

  // 2. If page appears scanned (< 4 digital spans) and OCR fallback is enabled, run lightweight Tesseract scan
  if (mergedSpans.length < 4 && allowOcrFallback) {
    try {
      usedOcr = true;
      onStatus?.(`Page ${pageNum} looks scanned — running browser OCR to locate labels...`);
      const ocrCanvas = document.createElement('canvas');
      const { width: cw, height: ch } = await renderFormPdfPageToCanvas(
        pdfJsDoc,
        pageNum,
        ocrCanvas,
        1.5,
        userRotation
      );
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('eng');
      try {
        const res = await worker.recognize(ocrCanvas, {}, { text: true, blocks: true });
        const dataAny = res.data as any;
        const ocrLines: any[] = [];
        if (Array.isArray(dataAny?.blocks)) {
          for (const b of dataAny.blocks) {
            for (const p of b?.paragraphs || []) {
              for (const l of p?.lines || []) ocrLines.push(l);
            }
          }
        }
        for (const l of ocrLines) {
          const text = String(l?.text || '').trim();
          if (!text || !l?.bbox) continue;
          mergedSpans.push({
            text,
            x: l.bbox.x0 / cw,
            y: l.bbox.y0 / ch,
            w: (l.bbox.x1 - l.bbox.x0) / cw,
            h: (l.bbox.y1 - l.bbox.y0) / ch,
            source: 'ocr',
          });
        }
      } finally {
        await worker.terminate();
        ocrCanvas.width = 1;
        ocrCanvas.height = 1;
      }
    } catch (ocrErr) {
      console.warn('Auto-detect OCR fallback notice:', ocrErr);
    }
  }

  const suggestions: SuggestedFieldArea[] = [];
  const usedCoords: Array<{ x: number; y: number }> = [];

  for (const sp of mergedSpans) {
    const clean = sp.text.replace(/\s+/g, ' ').trim();
    if (clean.length < 2 || clean.length > 70) continue;

    for (const rule of FIELD_LABEL_RULES) {
      if (!rule.regex.test(clean)) continue;

      let sx = sp.x;
      let sy = sp.y;
      let sw = rule.boxW;
      let sh = Math.max(rule.boxH, sp.h * 1.15);

      if (rule.placement === 'right') {
        sx = Math.min(0.95 - sw, sp.x + sp.w + 0.012);
        sy = Math.max(0.01, sp.y - 0.004);
      } else if (rule.placement === 'below') {
        sx = Math.max(0.02, Math.min(0.96 - sw, sp.x));
        sy = Math.max(0.02, sp.y - sh - 0.008); // typically signature goes above the "Signature" caption line
        if (sy < 0.04) sy = Math.min(0.95 - sh, sp.y + sp.h + 0.01);
      } else {
        // 'inside' (e.g. photo box centered around label)
        sx = Math.max(0.02, Math.min(0.96 - sw, sp.x + sp.w / 2 - sw / 2));
        sy = Math.max(0.02, Math.min(0.96 - sh, sp.y + sp.h / 2 - sh / 2));
      }

      // Deduplicate nearby suggestions
      const tooClose = usedCoords.some(
        (pt) => Math.abs(pt.x - sx) < 0.05 && Math.abs(pt.y - sy) < 0.025
      );
      if (tooClose) break;
      usedCoords.push({ x: sx, y: sy });

      suggestions.push({
        id: `sug-p${pageNum}-${suggestions.length + 1}-${Date.now().toString(36)}`,
        pageNum,
        label: rule.label,
        category: rule.category,
        x: Math.max(0.01, Math.min(0.98 - sw, sx)),
        y: Math.max(0.01, Math.min(0.98 - sh, sy)),
        width: Math.min(sw, 0.96),
        height: Math.min(sh, 0.4),
        confidence: sp.source === 'text-layout' ? 'high' : 'medium',
        source: sp.source,
      });
      break;
    }

    if (suggestions.length >= 18) break;
  }

  return { suggestions, usedOcr };
}

/**
 * Render a Unicode/Hindi text block onto a high-DPI transparent PNG canvas so any script
 * (including Devanagari Hindi) embeds accurately at exact coordinates without WinAnsi failures.
 */
function renderUnicodeTextToPngBytes(
  el: TextFormElement,
  boxWidthPt: number,
  boxHeightPt: number
): { bytes: Uint8Array; actualHeightPt: number } {
  const dpr = 3.5;
  const cw = Math.max(24, Math.round(boxWidthPt * dpr));

  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d');
  if (!mCtx) return { bytes: new Uint8Array(), actualHeightPt: boxHeightPt };

  const fontWeight = el.bold ? '700' : '400';
  const fontStyle = el.italic ? 'italic' : 'normal';
  const fontPx = Math.max(8, el.fontSize * dpr);
  const cssFamily =
    el.fontFamily === 'times'
      ? "Georgia, 'Times New Roman', 'Noto Sans Devanagari', serif"
      : el.fontFamily === 'courier'
      ? "'JetBrains Mono', 'Courier New', 'Noto Sans Devanagari', monospace"
      : "Helvetica, Arial, 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif";

  const fontSpec = `${fontStyle} ${fontWeight} ${fontPx}px ${cssFamily}`;
  mCtx.font = fontSpec;

  const padX = Math.round(2 * dpr);
  const padY = Math.round(2 * dpr);
  const maxTextW = Math.max(10, cw - padX * 2);
  const lineHeight = fontPx * 1.28;

  const wrappedLines: string[] = [];
  const paragraphs = (el.text || '').split('\n');
  for (const para of paragraphs) {
    if (!para) {
      wrappedLines.push('');
      continue;
    }
    const words = para.split(' ');
    let cur = '';
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (mCtx.measureText(test).width <= maxTextW || !cur) {
        cur = test;
      } else {
        wrappedLines.push(cur);
        cur = word;
      }
    }
    if (cur) wrappedLines.push(cur);
  }

  const requiredCh = Math.ceil(padY * 2 + Math.max(1, wrappedLines.length) * lineHeight + 2 * dpr);
  const ch = Math.max(Math.max(16, Math.round(boxHeightPt * dpr)), requiredCh);
  const actualHeightPt = ch / dpr;

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { bytes: new Uint8Array(), actualHeightPt };

  if (el.backgroundColor && el.backgroundColor !== 'transparent') {
    ctx.fillStyle = el.backgroundColor;
    ctx.fillRect(0, 0, cw, ch);
  }

  ctx.font = fontSpec;
  ctx.fillStyle = el.color || '#111827';
  ctx.textBaseline = 'top';

  wrappedLines.forEach((line, idx) => {
    const yPos = padY + idx * lineHeight;
    let xPos = padX;
    if (el.align === 'center') {
      xPos = cw / 2;
      ctx.textAlign = 'center';
    } else if (el.align === 'right') {
      xPos = cw - padX;
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'left';
    }
    ctx.fillText(line, xPos, yPos);
  });

  const dataUrl = canvas.toDataURL('image/png');
  canvas.width = 1;
  canvas.height = 1;
  measureCanvas.width = 1;
  measureCanvas.height = 1;
  return { bytes: dataUrlToUint8Array(dataUrl), actualHeightPt };
}

/**
 * Convert a base64 data URL into Uint8Array bytes.
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = parts[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Bake rotation (if any) of an image/signature data URL into a clean high-res transparent PNG
 * so rotated photos and signatures embed pixel-accurately into pdf-lib without bounding-box shift.
 */
async function bakeImageForPdfEmbed(
  dataUrl: string,
  extraRotationDeg: number
): Promise<{ bytes: Uint8Array; isPng: boolean }> {
  const normRot = ((extraRotationDeg % 360) + 360) % 360;
  const isPngData = dataUrl.startsWith('data:image/png');
  const isJpgData =
    dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');

  if (normRot === 0 && (isPngData || isJpgData)) {
    return { bytes: dataUrlToUint8Array(dataUrl), isPng: isPngData };
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Failed to decode placed image for export.'));
    i.src = dataUrl;
  });

  const rad = (normRot * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const outW = Math.max(1, Math.round(img.naturalWidth * cos + img.naturalHeight * sin));
  const outH = Math.max(1, Math.round(img.naturalWidth * sin + img.naturalHeight * cos));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { bytes: dataUrlToUint8Array(dataUrl), isPng: isPngData };

  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(rad);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const outUrl = canvas.toDataURL('image/png');
  canvas.width = 1;
  canvas.height = 1;
  return { bytes: dataUrlToUint8Array(outUrl), isPng: true };
}

/**
 * Crop & optionally rotate an uploaded photo using normalized [0..1] crop bounds.
 */
export async function cropAndRotateImageDataUrl(
  sourceDataUrl: string,
  crop: { x: number; y: number; width: number; height: number },
  rotateDeg: number = 0
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not read image for cropping.'));
    i.src = sourceDataUrl;
  });

  const sx = Math.max(0, Math.round(crop.x * img.naturalWidth));
  const sy = Math.max(0, Math.round(crop.y * img.naturalHeight));
  const sw = Math.max(10, Math.round(crop.width * img.naturalWidth));
  const sh = Math.max(10, Math.round(crop.height * img.naturalHeight));

  const normRot = ((rotateDeg % 360) + 360) % 360;
  const swap = normRot === 90 || normRot === 270;
  const outW = swap ? sh : sw;
  const outH = swap ? sw : sh;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable.');

  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((normRot * Math.PI) / 180);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

  const isPng = sourceDataUrl.startsWith('data:image/png');
  const dataUrl = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92);
  canvas.width = 1;
  canvas.height = 1;

  return { dataUrl, width: outW, height: outH };
}

/**
 * Word-wrap a Latin string using a pdf-lib font's real width metrics.
 */
function wrapPdfLibText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const result: string[] = [];
  const paragraphs = (text || '').split('\n');
  for (const para of paragraphs) {
    if (!para) {
      result.push('');
      continue;
    }
    const words = para.split(' ');
    let cur = '';
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(test, fontSize);
      } catch {
        width = test.length * fontSize * 0.52;
      }
      if (width <= maxWidth || !cur) {
        cur = test;
      } else {
        result.push(cur);
        cur = word;
      }
    }
    if (cur) result.push(cur);
  }
  return result;
}

export interface ExportFilledPdfOptions {
  rawPdfBytes: Uint8Array;
  elements: FormElement[];
  interactiveFields: DetectedInteractiveField[];
  interactiveValues: Record<string, string | boolean>;
  pageRotations: Record<number, PageRotationDeg>;
  whiteoutPatches?: WhiteoutPatch[];
  flatten: boolean;
  onProgress?: (pct: number, status: string) => void;
}

export interface ExportFilledPdfResult {
  blob: Blob;
  bytes: Uint8Array;
  warnings: string[];
}

/**
 * Export the completed PDF with exact coordinate fidelity across all page sizes,
 * orientations, user rotations, interactive AcroForm values, Unicode/Hindi text,
 * background-matched text removal patches, photos, signatures, checkmarks, and shapes.
 */
export async function exportFilledPdf(
  options: ExportFilledPdfOptions
): Promise<ExportFilledPdfResult> {
  const {
    rawPdfBytes,
    elements,
    interactiveFields,
    interactiveValues,
    pageRotations,
    whiteoutPatches = [],
    flatten,
    onProgress,
  } = options;

  const warnings: string[] = [];
  onProgress?.(10, 'Loading source PDF structure...');

  const pdfDoc = await PDFDocument.load(rawPdfBytes.slice(0), { ignoreEncryption: true });

  // Embed standard font families lazily
  const fontCache = new Map<string, any>();
  const getStdFont = async (
    family: TextFormElement['fontFamily'],
    bold: boolean,
    italic: boolean
  ) => {
    const key = `${family}-${bold ? 'b' : 'n'}-${italic ? 'i' : 'n'}`;
    if (fontCache.has(key)) return fontCache.get(key);
    let std = StandardFonts.Helvetica;
    if (family === 'times') {
      std =
        bold && italic
          ? StandardFonts.TimesRomanBoldItalic
          : bold
          ? StandardFonts.TimesRomanBold
          : italic
          ? StandardFonts.TimesRomanItalic
          : StandardFonts.TimesRoman;
    } else if (family === 'courier') {
      std =
        bold && italic
          ? StandardFonts.CourierBoldOblique
          : bold
          ? StandardFonts.CourierBold
          : italic
          ? StandardFonts.CourierOblique
          : StandardFonts.Courier;
    } else {
      std =
        bold && italic
          ? StandardFonts.HelveticaBoldOblique
          : bold
          ? StandardFonts.HelveticaBold
          : italic
          ? StandardFonts.HelveticaOblique
          : StandardFonts.Helvetica;
    }
    const embedded = await pdfDoc.embedFont(std);
    fontCache.set(key, embedded);
    return embedded;
  };

  // 1. Update existing interactive AcroForm fields (if present)
  if (interactiveFields.length > 0) {
    onProgress?.(25, 'Updating interactive PDF form fields...');
    try {
      const form = pdfDoc.getForm();
      const handledNames = new Set<string>();
      for (const f of interactiveFields) {
        if (handledNames.has(f.fieldName)) continue;
        handledNames.add(f.fieldName);
        const val = interactiveValues[f.fieldName];
        if (val === undefined) continue;

        try {
          if (f.type === 'text') {
            const textStr = String(val);
            if (isWinAnsiSafe(textStr)) {
              const field = form.getTextField(f.fieldName);
              field.setText(textStr);
            } else {
              // Non-Latin (e.g. Hindi) entered into an existing WinAnsi AcroForm field:
              // Clear underlying WinAnsi field and render crisp Unicode overlay at its exact box below!
              try {
                form.getTextField(f.fieldName).setText('');
              } catch {
                // ignore
              }
              warnings.push(
                `Field "${f.fieldName}" contains Hindi/Unicode text, so it was rendered visually at its exact position to preserve crisp script.`
              );
            }
          } else if (f.type === 'checkbox') {
            const cb = form.getCheckBox(f.fieldName);
            if (Boolean(val)) cb.check();
            else cb.uncheck();
          } else if (f.type === 'radio') {
            const rg = form.getRadioGroup(f.fieldName);
            const strVal = String(val);
            if (strVal) rg.select(strVal);
          } else if (f.type === 'dropdown') {
            const dd = form.getDropdown(f.fieldName);
            const strVal = String(val);
            if (strVal) dd.select(strVal);
          }
        } catch {
          warnings.push(`Could not directly update interactive field "${f.fieldName}".`);
        }
      }

      // Ensure PDF viewers visually render updated interactive AcroForm field values
      try {
        const appearanceFont = await getStdFont('helvetica', false, false);
        form.updateFieldAppearances(appearanceFont);
      } catch {
        // Non-fatal: some PDFs use custom appearance streams
      }

      if (flatten) {
        try {
          form.flatten();
        } catch {
          warnings.push(
            'Some existing interactive form fields could not be flattened automatically and remain editable.'
          );
        }
      }
    } catch {
      warnings.push('Could not modify some original PDF form dictionary entries.');
    }
  }

  // Collect extra visual Unicode overlays for AcroForm text fields that received Hindi/Unicode input
  const unicodeAcroFallbackElements: TextFormElement[] = [];
  for (const f of interactiveFields) {
    if (f.type !== 'text') continue;
    const val = interactiveValues[f.fieldName];
    if (typeof val === 'string' && val.trim() && !isWinAnsiSafe(val)) {
      const userRot = pageRotations[f.pageNum] || 0;
      const rotatedBox = rotateNormalizedRect(
        { x: f.x, y: f.y, width: f.width, height: f.height },
        userRot
      );
      unicodeAcroFallbackElements.push({
        id: `acro-uni-${f.id}`,
        type: 'text',
        pageNum: f.pageNum,
        ...rotatedBox,
        rotation: 0,
        opacity: 1,
        text: val,
        fontFamily: 'devanagari',
        fontSize: 11,
        color: '#0f172a',
        bold: false,
        italic: false,
        align: 'left',
      });
    }
  }

  const allElements: FormElement[] = [...elements, ...unicodeAcroFallbackElements];
  const pdfPages = pdfDoc.getPages();

  // 2. Apply user rotations and draw all placed elements per page with exact visual->PDF transform
  for (let pageIdx = 0; pageIdx < pdfPages.length; pageIdx++) {
    const pageNum = pageIdx + 1;
    const pct = 35 + Math.round(((pageIdx + 1) / pdfPages.length) * 55);
    onProgress?.(pct, `Embedding elements on page ${pageNum} of ${pdfPages.length}...`);

    const page = pdfPages[pageIdx];
    const nativeRot = ((((page.getRotation().angle || 0) % 360) + 360) % 360) as PageRotationDeg;
    const userRot = pageRotations[pageNum] || 0;
    const totalRot = ((nativeRot + userRot) % 360) as PageRotationDeg;

    if (userRot !== 0) {
      page.setRotation(degrees(totalRot));
    }

    const { width: rawW, height: rawH } = page.getSize();
    const dispW = totalRot === 90 || totalRot === 270 ? rawH : rawW;
    const dispH = totalRot === 90 || totalRot === 270 ? rawW : rawH;

    // PDF-lib rotation angle to keep content visually upright on a page with totalRot
    const uprightAngle = degrees(totalRot);

    // Helper: draw an embedded image cleanly into a visual normalized rect on ANY page rotation
    const drawImageInVisualBox = (
      embeddedImg: any,
      vx: number,
      vy: number,
      vw: number,
      vh: number,
      opacity: number
    ) => {
      const boxW = vw * dispW;
      const boxH = vh * dispH;
      // Anchor is the visual bottom-left corner of the box (vx, vy + vh)
      const anchor = visualNormalizedPointToPdf(vx, vy + vh, rawW, rawH, totalRot);
      page.drawImage(embeddedImg, {
        x: anchor.x,
        y: anchor.y,
        width: boxW,
        height: boxH,
        rotate: uprightAngle,
        opacity,
      });
    };

    // 2a. Draw background-matched text removal / whiteout patches FIRST so replacement text sits cleanly on top
    const pagePatches = whiteoutPatches.filter((wp) => wp.pageNum === pageNum);
    for (const wp of pagePatches) {
      const pw = Math.max(2, wp.width * dispW);
      const ph = Math.max(2, wp.height * dispH);
      const fill = hexToRgbComponents(wp.fillColor || '#ffffff');
      const anchor = visualNormalizedPointToPdf(wp.x, wp.y + wp.height, rawW, rawH, totalRot);
      page.drawRectangle({
        x: anchor.x,
        y: anchor.y,
        width: pw,
        height: ph,
        rotate: uprightAngle,
        color: rgb(fill.r, fill.g, fill.b),
        opacity: 1,
      });
    }

    const pageElements = allElements.filter((el) => el.pageNum === pageNum);

    for (const el of pageElements) {
      const boxW = Math.max(4, el.width * dispW);
      const boxH = Math.max(4, el.height * dispH);

      if (el.type === 'text' || el.type === 'date') {
        if (!el.text || !el.text.trim()) continue;

        // Draw automatic background-matched dot-leader covers strictly behind this entry's text
        if (el.coverDotsEnabled !== false && Array.isArray(el.dotCovers) && el.dotCovers.length > 0) {
          for (const dc of el.dotCovers) {
            const dcW = Math.max(2, dc.width * dispW);
            const dcH = Math.max(2, dc.height * dispH);
            const dcFill = hexToRgbComponents(dc.fillColor || '#ffffff');
            const dcAnchor = visualNormalizedPointToPdf(dc.x, dc.y + dc.height, rawW, rawH, totalRot);
            page.drawRectangle({
              x: dcAnchor.x,
              y: dcAnchor.y,
              width: dcW,
              height: dcH,
              rotate: uprightAngle,
              color: rgb(dcFill.r, dcFill.g, dcFill.b),
              opacity: 1,
            });
          }
        }

        const isStrictTableCell = Boolean(el.tableId) && !el.manualWidth && !el.manualHeight;
        const needsUnicodeCanvas =
          !isWinAnsiSafe(el.text) || el.fontFamily === 'devanagari' || el.rotation !== 0;

        if (needsUnicodeCanvas) {
          const targetWidthPt =
            el.manualWidth || el.boundedBox || isStrictTableCell
              ? boxW
              : Math.min((1 - el.x - 0.004) * dispW, boxW + 6);
          let effectiveEl = el;
          let rendered = renderUnicodeTextToPngBytes(effectiveEl, targetWidthPt, boxH);
          // Gently auto-fit ONLY inside fixed table cells if long text overflows cell borders
          if (isStrictTableCell && rendered.actualHeightPt > boxH * 1.12) {
            for (let sz = el.fontSize - 1; sz >= 7.5; sz -= 0.5) {
              const candidate = renderUnicodeTextToPngBytes(
                { ...el, fontSize: sz },
                targetWidthPt,
                boxH
              );
              rendered = candidate;
              effectiveEl = { ...el, fontSize: sz };
              if (candidate.actualHeightPt <= boxH * 1.08) break;
            }
          }
          if (rendered.bytes.length === 0) continue;
          let finalBytes = rendered.bytes;
          if (effectiveEl.rotation !== 0) {
            const b64 = `data:image/png;base64,${uint8ArrayToBase64(rendered.bytes)}`;
            const baked = await bakeImageForPdfEmbed(b64, effectiveEl.rotation);
            finalBytes = baked.bytes;
          }
          const img = await pdfDoc.embedPng(finalBytes);
          const actualNormW = Math.min(1 - el.x, targetWidthPt / Math.max(1, dispW));
          const actualNormH = Math.min(
            1 - el.y,
            (isStrictTableCell ? Math.min(boxH * 1.15, rendered.actualHeightPt) : rendered.actualHeightPt) /
              Math.max(1, dispH)
          );
          drawImageInVisualBox(img, el.x, el.y, actualNormW, Math.max(el.height, actualNormH), el.opacity);
        } else {
          // Crisp native vector WinAnsi text
          const font = await getStdFont(el.fontFamily, el.bold, el.italic);
          const { r, g, b } = hexToRgbComponents(el.color);

          const padX = 2;
          const padY = 2;
          // Respect manual resized width & table cell borders strictly; add tiny +6pt tolerance on auto-expanded
          // boxes so minor Helvetica/Arial glyph metric differences never cause an unexpected single-line wrap
          const maxWrapWidth =
            el.manualWidth || el.boundedBox || isStrictTableCell
              ? Math.max(10, boxW - padX * 2)
              : Math.max(12, Math.min((1 - el.x - 0.004) * dispW, boxW + 6) - padX * 2);

          let effectiveFontSize = el.fontSize;
          let lineHeight = effectiveFontSize * (isStrictTableCell ? 1.22 : 1.28);
          let lines = wrapPdfLibText(el.text, font, effectiveFontSize, maxWrapWidth);

          // Only gently auto-fit inside fixed unresized table cells (never shrink normal form fields!)
          if (isStrictTableCell) {
            const exceedsBounds = (sz: number, ls: string[]) => {
              const totalH = padY * 2 + ls.length * (sz * 1.22);
              if (totalH > boxH + 1.5) return true;
              return ls.some((ln) => {
                try {
                  return font.widthOfTextAtSize(ln, sz) > maxWrapWidth + 1;
                } catch {
                  return false;
                }
              });
            };
            while (effectiveFontSize > 7.5 && exceedsBounds(effectiveFontSize, lines)) {
              effectiveFontSize = Number((effectiveFontSize - 0.5).toFixed(2));
              lines = wrapPdfLibText(el.text, font, effectiveFontSize, maxWrapWidth);
              lineHeight = effectiveFontSize * 1.22;
            }
          }

          if (el.backgroundColor && el.backgroundColor !== 'transparent') {
            const bg = hexToRgbComponents(el.backgroundColor);
            const neededH = Math.max(boxH, padY * 2 + Math.max(1, lines.length) * lineHeight);
            const bgHNorm = Math.min(1 - el.y - 0.002, neededH / Math.max(1, dispH));
            const anchor = visualNormalizedPointToPdf(el.x, el.y + bgHNorm, rawW, rawH, totalRot);
            page.drawRectangle({
              x: anchor.x,
              y: anchor.y,
              width: boxW,
              height: bgHNorm * dispH,
              rotate: uprightAngle,
              color: rgb(bg.r, bg.g, bg.b),
              opacity: el.opacity,
            });
          }

          lines.forEach((line, idx) => {
            const lineWidth = (() => {
              try {
                return font.widthOfTextAtSize(line, effectiveFontSize);
              } catch {
                return line.length * effectiveFontSize * 0.5;
              }
            })();

            let offsetXPt = padX;
            if (el.align === 'center') {
              offsetXPt = Math.max(padX, (boxW - lineWidth) / 2);
            } else if (el.align === 'right') {
              offsetXPt = Math.max(padX, boxW - lineWidth - padX);
            }

            const baselineOffsetYPt = padY + effectiveFontSize * 0.88 + idx * lineHeight;
            const vy = el.y + baselineOffsetYPt / dispH;
            if (vy > 0.995) return;

            const vx = el.x + offsetXPt / dispW;
            const pt = visualNormalizedPointToPdf(vx, vy, rawW, rawH, totalRot);

            page.drawText(line, {
              x: pt.x,
              y: pt.y,
              size: effectiveFontSize,
              font,
              color: rgb(r, g, b),
              rotate: uprightAngle,
              opacity: el.opacity,
            });
          });
        }
      } else if (el.type === 'image' || el.type === 'signature') {
        const baked = await bakeImageForPdfEmbed(el.dataUrl, el.rotation);
        const embedded = baked.isPng
          ? await pdfDoc.embedPng(baked.bytes)
          : await pdfDoc.embedJpg(baked.bytes);
        drawImageInVisualBox(embedded, el.x, el.y, el.width, el.height, el.opacity);
      } else if (el.type === 'mark') {
        const { r, g, b } = hexToRgbComponents(el.color);
        const strokeColor = rgb(r, g, b);
        const thickness = Math.max(1.2, el.strokeWidth || 2);

        const drawSeg = (x1n: number, y1n: number, x2n: number, y2n: number) => {
          const p1 = visualNormalizedPointToPdf(
            el.x + x1n * el.width,
            el.y + y1n * el.height,
            rawW,
            rawH,
            totalRot
          );
          const p2 = visualNormalizedPointToPdf(
            el.x + x2n * el.width,
            el.y + y2n * el.height,
            rawW,
            rawH,
            totalRot
          );
          page.drawLine({
            start: p1,
            end: p2,
            thickness,
            color: strokeColor,
            opacity: el.opacity,
          });
        };

        if (el.markKind === 'checkbox-empty' || el.markKind === 'checkbox-checked') {
          const anchor = visualNormalizedPointToPdf(el.x, el.y + el.height, rawW, rawH, totalRot);
          page.drawRectangle({
            x: anchor.x,
            y: anchor.y,
            width: boxW,
            height: boxH,
            rotate: uprightAngle,
            borderColor: strokeColor,
            borderWidth: Math.max(1.1, thickness * 0.8),
            opacity: el.opacity,
          });
        }

        if (el.markKind === 'check' || el.markKind === 'checkbox-checked') {
          drawSeg(0.18, 0.54, 0.42, 0.78);
          drawSeg(0.42, 0.78, 0.84, 0.24);
        } else if (el.markKind === 'cross') {
          drawSeg(0.18, 0.18, 0.82, 0.82);
          drawSeg(0.82, 0.18, 0.18, 0.82);
        } else if (el.markKind === 'dot') {
          const center = visualNormalizedPointToPdf(
            el.x + el.width / 2,
            el.y + el.height / 2,
            rawW,
            rawH,
            totalRot
          );
          page.drawCircle({
            x: center.x,
            y: center.y,
            size: Math.min(boxW, boxH) * 0.36,
            color: strokeColor,
            opacity: el.opacity,
          });
        }
      } else if (el.type === 'shape') {
        const { r, g, b } = hexToRgbComponents(el.strokeColor);
        const strokeColor = rgb(r, g, b);
        const hasFill = el.fillColor && el.fillColor !== 'transparent';
        const fillRgb = hasFill ? hexToRgbComponents(el.fillColor) : null;
        const thickness = Math.max(1, el.strokeWidth || 1.8);

        if (el.shapeKind === 'line-h') {
          const p1 = visualNormalizedPointToPdf(el.x, el.y + el.height / 2, rawW, rawH, totalRot);
          const p2 = visualNormalizedPointToPdf(
            el.x + el.width,
            el.y + el.height / 2,
            rawW,
            rawH,
            totalRot
          );
          page.drawLine({
            start: p1,
            end: p2,
            thickness,
            color: strokeColor,
            opacity: el.opacity,
          });
        } else if (el.shapeKind === 'line-v') {
          const p1 = visualNormalizedPointToPdf(el.x + el.width / 2, el.y, rawW, rawH, totalRot);
          const p2 = visualNormalizedPointToPdf(
            el.x + el.width / 2,
            el.y + el.height,
            rawW,
            rawH,
            totalRot
          );
          page.drawLine({
            start: p1,
            end: p2,
            thickness,
            color: strokeColor,
            opacity: el.opacity,
          });
        } else if (el.shapeKind === 'rect') {
          const anchor = visualNormalizedPointToPdf(el.x, el.y + el.height, rawW, rawH, totalRot);
          page.drawRectangle({
            x: anchor.x,
            y: anchor.y,
            width: boxW,
            height: boxH,
            rotate: uprightAngle,
            borderColor: strokeColor,
            borderWidth: thickness,
            color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
            opacity: el.opacity,
          });
        } else if (el.shapeKind === 'circle') {
          const center = visualNormalizedPointToPdf(
            el.x + el.width / 2,
            el.y + el.height / 2,
            rawW,
            rawH,
            totalRot
          );
          const xScale = totalRot === 90 || totalRot === 270 ? boxH / 2 : boxW / 2;
          const yScale = totalRot === 90 || totalRot === 270 ? boxW / 2 : boxH / 2;
          page.drawEllipse({
            x: center.x,
            y: center.y,
            xScale,
            yScale,
            borderColor: strokeColor,
            borderWidth: thickness,
            color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
            opacity: el.opacity,
          });
        }
      }
    }
  }

  onProgress?.(94, 'Finalizing PDF document...');
  const savedBytes = await pdfDoc.save();
  const blob = new Blob([savedBytes as unknown as BlobPart], { type: 'application/pdf' });
  onProgress?.(100, 'PDF export complete!');

  return { blob, bytes: savedBytes, warnings };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/**
 * Package the original PDF + all form edits + reusable assets/snippets into a single
 * offline-portable `.pottoform` project archive so the user can save and reopen anytime.
 */
export async function saveFormProjectArchive(params: {
  rawPdfBytes: Uint8Array;
  originalFileName: string;
  activePage: number;
  elements: FormElement[];
  interactiveValues: Record<string, string | boolean>;
  pageRotations: Record<number, PageRotationDeg>;
  mediaAssets: ReusableMediaAsset[];
  textSnippets: ReusableTextSnippet[];
}): Promise<Blob> {
  const zip = new JSZip();
  zip.file('source.pdf', params.rawPdfBytes);

  const meta: SavedFillPdfProjectMetadata = {
    version: 1,
    savedAt: new Date().toISOString(),
    originalFileName: params.originalFileName,
    activePage: params.activePage,
    elements: params.elements,
    interactiveValues: params.interactiveValues,
    pageRotations: params.pageRotations,
    mediaAssets: params.mediaAssets,
    textSnippets: params.textSnippets,
  };

  zip.file('project.json', JSON.stringify(meta));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

/**
 * Restore a previously saved `.pottoform` project archive back into the editor.
 */
export async function loadFormProjectArchive(file: File): Promise<{
  pdfBytes: Uint8Array;
  metadata: SavedFillPdfProjectMetadata;
}> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error('Could not read project file. Please choose a valid .pottoform file.');
  }

  const pdfEntry = zip.file('source.pdf');
  const metaEntry = zip.file('project.json');
  if (!pdfEntry || !metaEntry) {
    throw new Error('This project file is incomplete or corrupted.');
  }

  const pdfBytes = await pdfEntry.async('uint8array');
  const metaStr = await metaEntry.async('string');

  let metadata: SavedFillPdfProjectMetadata;
  try {
    metadata = JSON.parse(metaStr);
  } catch {
    throw new Error('Project metadata is unreadable.');
  }

  if (!metadata || metadata.version !== 1 || !Array.isArray(metadata.elements)) {
    throw new Error('Unsupported project format version.');
  }

  return { pdfBytes, metadata };
}
