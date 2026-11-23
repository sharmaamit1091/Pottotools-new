import 'regenerator-runtime/runtime';
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TextRun,
} from 'docx';
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { DigitizerPageItem } from './types';

export type ExportScope = 'all' | 'current';

export interface ExportTxtOptions {
  scope: ExportScope;
  includePageHeaders?: boolean;
}

export interface ExportDocxOptions {
  scope: ExportScope;
  documentTitle?: string;
  includePageHeaders?: boolean;
}

export interface ExportSearchablePdfOptions {
  scope: ExportScope;
  documentTitle?: string;
  useEnhancedImage?: boolean;
  onProgress?: (current: number, total: number, detail: string) => void;
}

const DEVANAGARI_FONT_URL = '/fonts/NotoSansDevanagari-Regular.ttf';
let cachedDevanagariFontBytes: Uint8Array | null = null;

async function loadDevanagariFontBytes(): Promise<Uint8Array> {
  if (cachedDevanagariFontBytes) return cachedDevanagariFontBytes;
  const response = await fetch(DEVANAGARI_FONT_URL);
  if (!response.ok) {
    throw new Error(`Could not load local Devanagari font (${response.status}).`);
  }
  const buf = await response.arrayBuffer();
  cachedDevanagariFontBytes = new Uint8Array(buf);
  return cachedDevanagariFontBytes;
}

export function buildExportBaseName(rawFileName?: string): string {
  const cleaned = (rawFileName || 'office-note')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9\u0900-\u097F_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return cleaned || 'office-note';
}

/**
 * Exports digitized Hindi + English office notes as a UTF-8 Plain Text (.txt) Blob
 * with UTF-8 BOM so Windows Notepad & MS Word always display Devanagari cleanly.
 */
export function exportOfficeNotesAsTxt(
  targetPages: DigitizerPageItem[],
  options: ExportTxtOptions
): Blob {
  const includeHeaders = options.includePageHeaders ?? targetPages.length > 1;
  const sections = targetPages.map((page) => {
    const body = (page.editedText || page.recognizedText || '').replace(/\r\n/g, '\n').trim();
    if (!includeHeaders) return body;
    return `===== Page ${page.pageNumber} (${page.sourceFileName}) =====\n\n${body}`;
  });

  const combined = sections.join('\n\n\n').trim() + '\n';
  // Prepend UTF-8 BOM (\uFEFF) for reliable Devanagari display in Windows Notepad
  return new Blob(['\uFEFF' + combined], { type: 'text/plain;charset=utf-8' });
}

/**
 * Exports digitized Hindi + English office notes as a genuine multi-page Word (.docx)
 * document using complex-script Devanagari font properties (Mangal / Calibri) and
 * clean official A4 page formatting with page breaks.
 */
export async function exportOfficeNotesAsDocx(
  targetPages: DigitizerPageItem[],
  options: ExportDocxOptions
): Promise<Blob> {
  const includeHeaders = options.includePageHeaders ?? targetPages.length > 1;
  const children: Paragraph[] = [];

  const createStyledRun = (text: string, overrides?: { bold?: boolean; size?: number; color?: string }) =>
    new TextRun({
      text,
      bold: overrides?.bold,
      size: overrides?.size ?? 24, // 12pt (half-points)
      color: overrides?.color ?? '1F2937',
      font: {
        ascii: 'Calibri',
        hAnsi: 'Calibri',
        cs: 'Mangal',
        eastAsia: 'Mangal',
      },
    });

  targetPages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    if (includeHeaders) {
      children.push(
        new Paragraph({
          spacing: { after: 180 },
          children: [
            createStyledRun(`Page ${page.pageNumber} — ${page.sourceFileName}`, {
              bold: true,
              size: 20,
              color: '5B50E6',
            }),
          ],
        })
      );
    }

    const rawText = (page.editedText || page.recognizedText || '').replace(/\r\n/g, '\n').trim();
    if (!rawText) {
      children.push(
        new Paragraph({
          spacing: { after: 160, line: 320 },
          children: [createStyledRun('[No text entered on this page]', { color: '9CA3AF', size: 22 })],
        })
      );
      return;
    }

    // Split on blank lines into distinct Word paragraphs, preserving internal line breaks cleanly
    const blocks = rawText.split(/\n{2,}/);
    for (const block of blocks) {
      const lines = block.split('\n');
      const runs: TextRun[] = [];
      lines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
          runs.push(new TextRun({ break: 1 }));
        }
        runs.push(createStyledRun(line));
      });

      children.push(
        new Paragraph({
          spacing: { after: 160, line: 320 }, // 1.33x line spacing prevents Devanagari matra clipping
          children: runs,
        })
      );
    }
  });

  const doc = new Document({
    creator: 'PottoTools Office Note Digitizer',
    title: options.documentTitle || 'Digitized Office Note',
    description: 'Digitized locally in browser with PottoTools Office Note Digitizer',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips (210mm)
              height: 16838, // A4 height in twips (297mm)
            },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: includeHeaders
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      createStyledRun(options.documentTitle || 'Digitized Office Note', {
                        size: 18,
                        color: '6B7280',
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  createStyledRun('Page ', { size: 18, color: '6B7280' }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '6B7280',
                  }),
                  createStyledRun(' of ', { size: 18, color: '6B7280' }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '6B7280',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

interface ScriptRun {
  text: string;
  isDevanagari: boolean;
}

/**
 * Splits a bilingual line into Devanagari/Rupee runs (drawn with NotoSansDevanagari-Regular.ttf)
 * and Latin/ASCII runs (drawn with StandardFonts.Helvetica) so mixed lines encode cleanly
 * with zero missing-glyph (.notdef) bytes.
 */
function splitBilingualRuns(line: string): ScriptRun[] {
  const runs: ScriptRun[] = [];
  const re = /([\u0900-\u097F\u20B9]+|[^\u0900-\u097F\u20B9]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    const seg = match[0];
    if (!seg) continue;
    const isDevanagari = /[\u0900-\u097F\u20B9]/.test(seg);
    runs.push({ text: seg, isDevanagari });
  }
  return runs;
}

function sanitizeWinAnsi(text: string): string {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

function measureBilingualLineWidth(
  runs: ScriptRun[],
  fontSize: number,
  devFont: PDFFont,
  latinFont: PDFFont
): number {
  let total = 0;
  for (const run of runs) {
    try {
      if (run.isDevanagari) {
        total += devFont.widthOfTextAtSize(run.text, fontSize);
      } else {
        total += latinFont.widthOfTextAtSize(sanitizeWinAnsi(run.text), fontSize);
      }
    } catch {
      total += run.text.length * fontSize * 0.5;
    }
  }
  return total;
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality = 0.88): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode scanned page image for PDF.'))),
      'image/jpeg',
      quality
    );
  });
  const ab = await blob.arrayBuffer();
  return new Uint8Array(ab);
}

/**
 * Exports an Aligned Searchable PDF (.pdf) 100% locally in the browser:
 * - Embeds the original (or enhanced) scanned page image at full clarity.
 * - Overlays an invisible (opacity: 0), Ctrl+F searchable Unicode Hindi + English text layer
 *   aligned directly onto the detected line bounding boxes.
 */
export async function exportOfficeNotesAsSearchablePdf(
  targetPages: DigitizerPageItem[],
  renderPageForExport: (
    page: DigitizerPageItem,
    useEnhanced: boolean
  ) => Promise<HTMLCanvasElement>,
  options: ExportSearchablePdfOptions
): Promise<Blob> {
  const useEnhanced = Boolean(options.useEnhancedImage);
  options.onProgress?.(0, targetPages.length, 'Preparing Searchable PDF...');

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  pdfDoc.setTitle(options.documentTitle || 'Digitized Searchable Office Note');
  pdfDoc.setCreator('PottoTools Office Note Digitizer (Local Browser)');
  pdfDoc.setProducer('PottoTools Client-Side PDF Engine');

  const devFontBytes = await loadDevanagariFontBytes();
  const devFont = await pdfDoc.embedFont(devFontBytes, { subset: true });
  const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < targetPages.length; i++) {
    const pageItem = targetPages[i];
    options.onProgress?.(
      i + 1,
      targetPages.length,
      `Creating Searchable PDF (Page ${pageItem.pageNumber} of ${targetPages.length})...`
    );

    const canvas = await renderPageForExport(pageItem, useEnhanced);
    const imgW = Math.max(1, canvas.width);
    const imgH = Math.max(1, canvas.height);

    let jpgBytes: Uint8Array;
    try {
      jpgBytes = await canvasToJpegBytes(canvas, 0.88);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }

    const embeddedImg = await pdfDoc.embedJpg(jpgBytes);

    // Normalize page width to standard A4 width (595.28 pt) while preserving exact scan aspect ratio
    const pdfW = 595.28;
    const pdfH = Math.max(200, Math.round((imgH / imgW) * pdfW * 100) / 100);
    const pdfPage = pdfDoc.addPage([pdfW, pdfH]);

    // 1. Draw visible scanned document image
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: pdfW,
      height: pdfH,
    });

    // 2. Align and draw invisible Ctrl+F searchable Unicode text layer
    const editedRaw = (pageItem.editedText || pageItem.recognizedText || '')
      .replace(/\r\n/g, '\n')
      .trim();
    if (!editedRaw) continue;

    const editedLines = editedRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (editedLines.length === 0) continue;

    const boxes =
      pageItem.recognizedLines.length > 0
        ? pageItem.recognizedLines.map((l) => l.normalizedBox)
        : pageItem.detectedLines.map((l) => l.normalizedBox);

    interface PositionedTextLine {
      text: string;
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    }

    const positioned: PositionedTextLine[] = [];

    if (boxes.length > 0 && Math.abs(boxes.length - editedLines.length) <= 2) {
      // Direct 1-to-1 alignment onto real detected line bounding boxes
      const count = Math.min(boxes.length, editedLines.length);
      for (let k = 0; k < count; k++) {
        positioned.push({
          text: editedLines[k],
          x0: boxes[k].x0,
          y0: boxes[k].y0,
          x1: boxes[k].x1,
          y1: boxes[k].y1,
        });
      }
      // If user added 1–2 extra lines at bottom, place just beneath the last box
      if (editedLines.length > count) {
        const last = boxes[boxes.length - 1];
        const lineH = Math.max(0.02, last.y1 - last.y0);
        for (let k = count; k < editedLines.length; k++) {
          const shift = (k - count + 1) * lineH * 1.25;
          positioned.push({
            text: editedLines[k],
            x0: last.x0,
            y0: Math.min(0.95, last.y0 + shift),
            x1: last.x1,
            y1: Math.min(0.98, last.y1 + shift),
          });
        }
      }
    } else {
      // Proportional layout inside detected text envelope (or clean page margins if typed manually)
      const envX0 = boxes.length > 0 ? Math.min(...boxes.map((b) => b.x0)) : 0.06;
      const envX1 = boxes.length > 0 ? Math.max(...boxes.map((b) => b.x1)) : 0.94;
      const envY0 = boxes.length > 0 ? Math.min(...boxes.map((b) => b.y0)) : 0.06;
      const envY1 = boxes.length > 0 ? Math.max(...boxes.map((b) => b.y1)) : 0.92;
      const spanY = Math.max(0.12, envY1 - envY0);
      const stepY = spanY / Math.max(1, editedLines.length);

      for (let k = 0; k < editedLines.length; k++) {
        const y0 = envY0 + k * stepY;
        const y1 = Math.min(0.98, y0 + Math.min(stepY * 0.85, 0.045));
        positioned.push({
          text: editedLines[k],
          x0: envX0,
          y0,
          x1: envX1,
          y1,
        });
      }
    }

    for (const item of positioned) {
      const runs = splitBilingualRuns(item.text);
      if (runs.length === 0) continue;

      const boxX = Math.max(4, item.x0 * pdfW);
      const boxW = Math.max(24, (item.x1 - item.x0) * pdfW);
      const boxH = Math.max(8, (item.y1 - item.y0) * pdfH);

      // PDF coordinates have origin at bottom-left; align baseline cleanly near bottom of box
      const baselineY = Math.max(4, pdfH - item.y1 * pdfH + boxH * 0.16);

      // Fit font size naturally inside the detected line height and width
      let fontSize = Math.max(6, Math.min(26, boxH * 0.72));
      const measuredW = measureBilingualLineWidth(runs, fontSize, devFont, latinFont);
      if (measuredW > boxW && measuredW > 0) {
        fontSize = Math.max(5, fontSize * (boxW / measuredW));
      }

      let cursorX = boxX;
      for (const run of runs) {
        try {
          const font = run.isDevanagari ? devFont : latinFont;
          const textToDraw = run.isDevanagari ? run.text : sanitizeWinAnsi(run.text);
          if (!textToDraw) continue;

          pdfPage.drawText(textToDraw, {
            x: cursorX,
            y: baselineY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: 0, // Invisible selectable Ctrl+F text layer over authentic scan image
          });

          cursorX += font.widthOfTextAtSize(textToDraw, fontSize);
        } catch {
          // Skip any rare unsupported symbol without aborting the entire PDF export
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}
