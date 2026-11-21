import { createWorker } from 'tesseract.js';
import { renderPdfPagesToImages } from '../pdf/pdfjsService';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import {
  processOcrTextWithKrutiDev,
  unicodeToKrutiDev,
  containsDevanagariUnicode,
  KrutiDevOcrPipelineOptions,
} from '../pdf/krutiDevConverter';

export type TesseractOcrLanguage = 'eng' | 'hin' | 'hin+eng';

export interface OcrProgressUpdate {
  progress: number;
  statusText: string;
}

export interface OcrResult {
  text: string;
  krutiDevText: string;
  krutiDevMapped: boolean;
  hasHindiScript: boolean;
  confidence: number;
  lines: string[];
  pageCount: number;
  docxBlob?: Blob;
}

/**
 * Build an editable Word (.docx) blob from extracted text with proper Hindi Unicode (Mangal / Noto Sans Devanagari)
 * or Kruti Dev 010 font metadata so text renders cleanly when opened in Microsoft Word.
 */
export async function buildOcrDocxBlob(
  text: string,
  scriptFormat: 'unicode' | 'krutidev' = 'unicode'
): Promise<Blob> {
  const useKrutiFont = scriptFormat === 'krutidev';
  const hasHindi = !useKrutiFont && containsDevanagariUnicode(text);
  const fontFamily = useKrutiFont ? 'Kruti Dev 010' : hasHindi ? 'Mangal' : 'Calibri';

  const paragraphs = text.split('\n').map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: useKrutiFont ? 28 : 22,
            font: {
              name: fontFamily,
              cs: fontFamily,
              ascii: fontFamily,
              hAnsi: fontFamily,
            },
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/**
 * Extract line strings cleanly from Tesseract.js v7 output (blocks -> paragraphs -> lines, with flat fallback).
 */
function extractLinesFromTesseractData(data: any): string[] {
  const extracted: string[] = [];
  if (Array.isArray(data?.blocks)) {
    for (const block of data.blocks) {
      if (!Array.isArray(block?.paragraphs)) continue;
      for (const para of block.paragraphs) {
        if (!Array.isArray(para?.lines)) continue;
        for (const line of para.lines) {
          if (line?.text && line.text.trim()) {
            extracted.push(line.text.trim());
          }
        }
      }
    }
  }
  if (extracted.length === 0 && Array.isArray(data?.lines)) {
    for (const line of data.lines) {
      if (line?.text && line.text.trim()) {
        extracted.push(line.text.trim());
      }
    }
  }
  return extracted;
}

/**
 * Perform optical character recognition on an image or PDF file in the browser.
 * Includes integrated Kruti Dev 010 font mapping and Unicode Devanagari normalization
 * so Hindi text extracted from scanned documents renders accurately.
 */
export async function runOcrOnFile(
  file: File,
  language: TesseractOcrLanguage = 'eng',
  onProgress?: (update: OcrProgressUpdate) => void,
  options: KrutiDevOcrPipelineOptions = { krutiDevMode: 'auto' }
): Promise<OcrResult> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  const imageSources: (Blob | string)[] = [];

  if (isPdf) {
    if (onProgress) onProgress({ progress: 10, statusText: 'Rendering PDF pages to images for OCR...' });
    const buffer = await file.arrayBuffer();
    const renderScale = language === 'eng' ? 2.0 : 2.2;
    const rendered = await renderPdfPagesToImages(buffer, 'image/png', renderScale);
    rendered.forEach((r) => imageSources.push(r.blob));
  } else {
    imageSources.push(file);
  }

  if (imageSources.length === 0) {
    throw new Error('No readable pages or images found for OCR.');
  }

  const langLabel =
    language === 'hin+eng' ? 'Hindi + English' : language === 'hin' ? 'Hindi' : 'English';
  if (onProgress) {
    onProgress({ progress: 20, statusText: `Initializing OCR engine for ${langLabel}...` });
  }

  const langs: string | string[] = language === 'hin+eng' ? ['hin', 'eng'] : language;
  const worker = await createWorker(langs, 1, {
    logger: (m) => {
      if (onProgress && m.progress !== undefined) {
        const percent = Math.min(95, 20 + Math.round(m.progress * 72));
        const statusClean = m.status ? m.status.replace(/_/g, ' ') : 'Processing...';
        onProgress({ progress: percent, statusText: `${statusClean} (${percent}%)` });
      }
    },
  });

  let fullText = '';
  let totalConfidence = 0;
  let anyKrutiDevMapped = false;
  const allLines: string[] = [];

  try {
    for (let i = 0; i < imageSources.length; i++) {
      const src = imageSources[i];
      if (onProgress && imageSources.length > 1) {
        onProgress({
          progress: Math.round(20 + ((i + 1) / imageSources.length) * 72),
          statusText: `Recognizing text on page ${i + 1} of ${imageSources.length}...`,
        });
      }

      const res = await worker.recognize(src, {}, { text: true, blocks: true });
      const rawPageText = res.data.text || '';

      // Apply Kruti Dev font mapping + Unicode Devanagari normalization inside OCR pipeline
      const processedPage = processOcrTextWithKrutiDev(rawPageText, options);
      if (processedPage.krutiDevMapped) {
        anyKrutiDevMapped = true;
      }

      fullText +=
        (fullText ? '\n\n' : '') +
        (imageSources.length > 1 ? `--- Page ${i + 1} ---\n` : '') +
        processedPage.text;
      totalConfidence += res.data.confidence;

      const rawLines = extractLinesFromTesseractData(res.data);
      const lineOpts: KrutiDevOcrPipelineOptions = processedPage.krutiDevMapped
        ? { krutiDevMode: 'force' }
        : options;
      for (const l of rawLines) {
        allLines.push(processOcrTextWithKrutiDev(l, lineOpts).text);
      }
    }
  } finally {
    await worker.terminate();
  }

  const avgConfidence = Math.round(totalConfidence / imageSources.length);
  const hasHindiScript = containsDevanagariUnicode(fullText);
  const krutiDevText = unicodeToKrutiDev(fullText);

  if (onProgress) onProgress({ progress: 97, statusText: 'Building Word (.docx) document...' });
  const docxBlob = await buildOcrDocxBlob(fullText, 'unicode');

  if (onProgress) onProgress({ progress: 100, statusText: 'OCR Recognition complete.' });

  return {
    text: fullText,
    krutiDevText,
    krutiDevMapped: anyKrutiDevMapped,
    hasHindiScript,
    confidence: avgConfidence,
    lines: allLines,
    pageCount: imageSources.length,
    docxBlob,
  };
}
