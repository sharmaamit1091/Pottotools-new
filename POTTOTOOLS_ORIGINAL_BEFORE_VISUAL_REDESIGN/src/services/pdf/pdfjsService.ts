import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker locally for 100% offline compatibility
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

export interface ExtractedPageText {
  pageNum: number;
  text: string;
}

export interface PdfTextResult {
  text: string;
  pages: ExtractedPageText[];
  pageCount: number;
  wordCount: number;
  charCount: number;
  hasSelectableText: boolean;
}

/**
 * Extract selectable text from PDF pages
 */
export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<PdfTextResult> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const pages: ExtractedPageText[] = [];
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .filter((s: string) => s.length > 0);

    const pageText = pageStrings.join(' ');
    pages.push({ pageNum: i, text: pageText });
    fullText += (fullText ? '\n\n' : '') + `--- Page ${i} ---\n` + pageText;
  }

  const cleanWords = fullText.replace(/--- Page \d+ ---/g, '').trim().split(/\s+/).filter(Boolean);
  const wordCount = cleanWords.length;
  const charCount = fullText.length;
  const hasSelectableText = wordCount > 10;

  return {
    text: fullText,
    pages,
    pageCount: numPages,
    wordCount,
    charCount,
    hasSelectableText,
  };
}

export interface RenderedPageImage {
  pageNum: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render PDF pages onto HTML5 canvas and export as high-res Blob/DataURL
 */
export async function renderPdfPagesToImages(
  pdfBuffer: ArrayBuffer,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  scale: number = 1.5,
  quality: number = 0.85
): Promise<RenderedPageImage[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const results: RenderedPageImage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available.');
    }

    // White background for JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport,
    };

    // @ts-expect-error pdfjs typing compatibility
    await page.render(renderContext).promise;

    const dataUrl = canvas.toDataURL(format, quality);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to encode page ${i} to ${format}`));
        },
        format,
        quality
      );
    });

    results.push({
      pageNum: i,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    });
  }

  return results;
}
