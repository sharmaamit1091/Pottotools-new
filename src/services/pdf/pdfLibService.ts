import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { renderPdfPagesToImages } from './pdfjsService';

export interface WatermarkOptions {
  fontSize?: number;
  opacity?: number;
  rotationDegrees?: number;
  color?: { r: number; g: number; b: number };
}

export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

/**
 * Merge multiple PDFs into a single document
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  return await mergedPdf.save({ useObjectStreams: true });
}

/**
 * Split PDF by page ranges (e.g. "1-3, 5, 8-10")
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  pageRanges: string,
  extractAsSingle: boolean = true
): Promise<Uint8Array | { name: string; data: Uint8Array }[]> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = srcDoc.getPageCount();
  const selectedIndices = parsePageRanges(pageRanges, totalPages);

  if (selectedIndices.length === 0) {
    throw new Error('No valid page numbers found in the specified range.');
  }

  if (extractAsSingle) {
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, selectedIndices);
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }
    return await newDoc.save({ useObjectStreams: true });
  } else {
    // Separate documents
    const results: { name: string; data: Uint8Array }[] = [];
    for (const idx of selectedIndices) {
      const pageDoc = await PDFDocument.create();
      const [copiedPage] = await pageDoc.copyPages(srcDoc, [idx]);
      pageDoc.addPage(copiedPage);
      const data = await pageDoc.save({ useObjectStreams: true });
      results.push({ name: `page-${idx + 1}.pdf`, data });
    }
    return results;
  }
}

/**
 * Rotate PDF pages by 90, 180, or 270 degrees
 */
export async function rotatePdf(
  pdfBuffer: ArrayBuffer,
  angleDegrees: number,
  pageNumbers?: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const pageNum = index + 1;
    if (!pageNumbers || pageNumbers.includes(pageNum)) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angleDegrees) % 360));
    }
  });

  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Delete specified pages from PDF
 */
export async function deletePdfPages(
  pdfBuffer: ArrayBuffer,
  pagesToDelete: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = pdfDoc.getPageCount();
  const deleteSet = new Set(pagesToDelete);

  if (deleteSet.size >= totalPages) {
    throw new Error('Cannot delete all pages in document. At least one page must remain.');
  }

  // Remove pages from highest index to lowest so indices don't shift
  for (let i = totalPages - 1; i >= 0; i--) {
    if (deleteSet.has(i + 1)) {
      pdfDoc.removePage(i);
    }
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Add text watermark diagonally or centered
 */
export async function addWatermark(
  pdfBuffer: ArrayBuffer,
  watermarkText: string,
  options: WatermarkOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = options.fontSize || 42;
  const opacity = options.opacity !== undefined ? options.opacity : 0.3;
  const rotation = options.rotationDegrees !== undefined ? options.rotationDegrees : 45;
  const color = options.color || { r: 0.6, g: 0.6, b: 0.6 };

  const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const x = width / 2 - (textWidth / 2) * Math.cos((rotation * Math.PI) / 180);
    const y = height / 2 - (textHeight / 2) * Math.sin((rotation * Math.PI) / 180);

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(
  pdfBuffer: ArrayBuffer,
  position: 'bottom-center' | 'bottom-right' | 'top-right' = 'bottom-center',
  format: '1' | 'Page X of Y' = 'Page X of Y',
  startOffset: number = 1
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const currentNum = i + startOffset;
    const label = format === 'Page X of Y' ? `Page ${currentNum} of ${totalPages}` : `${currentNum}`;
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = 25; // bottom margin

    if (position === 'bottom-right') {
      x = width - textWidth - 36;
      y = 25;
    } else if (position === 'top-right') {
      x = width - textWidth - 36;
      y = height - 30;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Inspect PDF metadata
 */
export async function inspectPdfMetadata(pdfBuffer: ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate(),
    pageCount: pdfDoc.getPageCount(),
  };
}

/**
 * Sanitize & remove metadata
 */
export async function removePdfMetadata(pdfBuffer: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setCreator('');
  pdfDoc.setProducer('');
  pdfDoc.setKeywords([]);
  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Load official PottoTools logo bytes for mandatory watermark
 */
export async function loadOfficialLogoBytes(): Promise<Uint8Array> {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const candidatePaths = [
      '/logo.png',
      '/potto-logo.png',
      '/assets/aistudio/1793128238887_13aeadac.png',
    ];
    for (const p of candidatePaths) {
      try {
        const res = await fetch(p);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 0) return new Uint8Array(buf);
        }
      } catch {
        // Try next candidate
      }
    }
  }

  // Node.js fallback (for testing/build)
  try {
    const fs = await import('fs');
    if (fs.existsSync('public/logo.png')) {
      return new Uint8Array(fs.readFileSync('public/logo.png'));
    }
  } catch {
    // Ignore
  }

  throw new Error('Mandatory official PottoTools logo watermark could not be loaded. Process halted.');
}

/**
 * Sign PDF with base64 PNG image signature and mandatory full-page logo watermark
 */
export async function signPdf(
  pdfBuffer: ArrayBuffer,
  signatureImageBase64: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  customLogoBytes?: Uint8Array
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error('Invalid page number specified for signature.');
  }

  // 1. Mandatory Full-Page Watermark Embedding
  // Retrieve official PottoTools logo
  const logoBytes = customLogoBytes || (await loadOfficialLogoBytes());
  const embeddedLogo = await pdfDoc.embedPng(logoBytes);

  // Apply subtle tiled watermark across EVERY page of the document
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Tile dimensions and pitch
    const tileWidth = 95;
    const tileHeight = 95;
    const stepX = 145;
    const stepY = 145;

    let row = 0;
    for (let curY = 15; curY < pageHeight + 20; curY += stepY) {
      const xOffset = row % 2 === 1 ? stepX / 2 : 0;
      for (let curX = -20 + xOffset; curX < pageWidth + 20; curX += stepX) {
        page.drawImage(embeddedLogo, {
          x: curX,
          y: curY,
          width: tileWidth,
          height: tileHeight,
          opacity: 0.09, // 9% subtle opacity (within required 8-12% range)
        });
      }
      row++;
    }
  }

  // 2. Embed user's signature on the designated target page (on top of watermark)
  const cleanBase64 = signatureImageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
  const embeddedSignature = await pdfDoc.embedPng(imageBytes);

  const targetPage = pages[pageIndex];
  targetPage.drawImage(embeddedSignature, {
    x,
    y,
    width,
    height,
  });

  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Compress PDF using stream optimization or page re-encoding for image/scanned documents
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  options: {
    targetSizeBytes?: number;
    quality?: number; // 0.1 to 0.95
    scale?: number; // 0.5 to 1.5
    forceReencode?: boolean;
  } = {}
): Promise<{
  data: Uint8Array;
  originalSize: number;
  newSize: number;
  reductionPercent: number;
  reachedTarget: boolean;
}> {
  const originalSize = pdfBuffer.byteLength;
  const quality = options.quality ?? 0.65;
  const scale = options.scale ?? 1.0;
  const targetBytes = options.targetSizeBytes;

  // Attempt stream compression first
  const doc = await PDFDocument.load(pdfBuffer);
  const streamOptimized = await doc.save({ useObjectStreams: true });

  if (targetBytes && streamOptimized.byteLength <= targetBytes && !options.forceReencode) {
    const newSize = streamOptimized.byteLength;
    const reductionPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));
    return {
      data: streamOptimized,
      originalSize,
      newSize,
      reductionPercent,
      reachedTarget: true,
    };
  }

  // If user requested aggressive compression or target is not met by metadata stripping alone:
  // Render pages using PDF.js and re-encode to target JPEG quality
  try {
    const renderedPages = await renderPdfPagesToImages(pdfBuffer, 'image/jpeg', scale, quality);
    const compressedDoc = await PDFDocument.create();

    for (const page of renderedPages) {
      const pageBytes = new Uint8Array(await page.blob.arrayBuffer());
      const embeddedImg = await compressedDoc.embedJpg(pageBytes);
      const newPage = compressedDoc.addPage([embeddedImg.width, embeddedImg.height]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width,
        height: embeddedImg.height,
      });
    }

    const reencodedData = await compressedDoc.save({ useObjectStreams: true });
    const finalData = reencodedData.byteLength < originalSize ? reencodedData : streamOptimized;
    const newSize = finalData.byteLength;
    const reductionPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));
    const reachedTarget = targetBytes ? newSize <= targetBytes : true;

    return {
      data: finalData,
      originalSize,
      newSize,
      reductionPercent,
      reachedTarget,
    };
  } catch {
    // Graceful fallback to stream optimized
    const newSize = streamOptimized.byteLength;
    const reductionPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));
    return {
      data: streamOptimized,
      originalSize,
      newSize,
      reductionPercent,
      reachedTarget: targetBytes ? newSize <= targetBytes : true,
    };
  }
}

/**
 * Helper to parse page range strings e.g. "1-3, 5, 8-10"
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => parseInt(s.trim(), 10));
      if (!isNaN(startStr) && !isNaN(endStr)) {
        const start = Math.max(1, Math.min(startStr, endStr));
        const end = Math.min(totalPages, Math.max(startStr, endStr));
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}
