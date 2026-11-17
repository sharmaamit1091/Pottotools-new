import { createWorker } from 'tesseract.js';
import { renderPdfPagesToImages } from '../pdf/pdfjsService';
import { Document, Paragraph, TextRun, Packer } from 'docx';

export interface OcrProgressUpdate {
  progress: number;
  statusText: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  lines: string[];
  pageCount: number;
  docxBlob?: Blob;
}

/**
 * Perform optical character recognition on an image or PDF file in the browser
 */
export async function runOcrOnFile(
  file: File,
  language: 'eng' | 'hin' = 'eng',
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<OcrResult> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  const imageSources: (Blob | string)[] = [];

  if (isPdf) {
    if (onProgress) onProgress({ progress: 10, statusText: 'Rendering PDF pages to images for OCR...' });
    const buffer = await file.arrayBuffer();
    const rendered = await renderPdfPagesToImages(buffer, 'image/png', 2.0);
    rendered.forEach((r) => imageSources.push(r.blob));
  } else {
    imageSources.push(file);
  }

  if (imageSources.length === 0) {
    throw new Error('No readable pages or images found for OCR.');
  }

  if (onProgress) onProgress({ progress: 20, statusText: `Initializing OCR engine for ${language === 'hin' ? 'Hindi' : 'English'}...` });

  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.progress !== undefined) {
        const percent = Math.min(98, 20 + Math.round(m.progress * 75));
        const statusClean = m.status ? m.status.replace(/_/g, ' ') : 'Processing...';
        onProgress({ progress: percent, statusText: `${statusClean} (${percent}%)` });
      }
    },
  });

  let fullText = '';
  let totalConfidence = 0;
  const allLines: string[] = [];

  for (let i = 0; i < imageSources.length; i++) {
    const src = imageSources[i];
    if (onProgress && imageSources.length > 1) {
      onProgress({
        progress: Math.round(20 + ((i + 1) / imageSources.length) * 75),
        statusText: `Recognizing text on page ${i + 1} of ${imageSources.length}...`,
      });
    }

    const res = await worker.recognize(src);
    const pageText = res.data.text;
    fullText += (fullText ? '\n\n' : '') + (imageSources.length > 1 ? `--- Page ${i + 1} ---\n` : '') + pageText;
    totalConfidence += res.data.confidence;

    const anyData = res.data as any;
    if (anyData && Array.isArray(anyData.lines)) {
      anyData.lines.forEach((l: any) => allLines.push(l.text || ''));
    }
  }

  await worker.terminate();

  const avgConfidence = Math.round(totalConfidence / imageSources.length);

  // Generate editable Word DOCX representation
  const paragraphs = fullText.split('\n').map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 22,
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

  const docxBlob = await Packer.toBlob(doc);

  if (onProgress) onProgress({ progress: 100, statusText: 'OCR Recognition complete.' });

  return {
    text: fullText,
    confidence: avgConfidence,
    lines: allLines,
    pageCount: imageSources.length,
    docxBlob,
  };
}
