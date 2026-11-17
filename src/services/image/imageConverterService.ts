import { PDFDocument } from 'pdf-lib';

export interface ImageConvertOptions {
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp';
  quality?: number; // 0.05 to 1.0
  width?: number;
  height?: number;
  maintainAspect?: boolean;
  backgroundColor?: string; // used when destination format lacks transparency
}

export interface ConvertedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
  filename: string;
}

/**
 * Load image file into an HTMLImageElement
 */
export function loadImageElement(fileOrBlob: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image into browser memory.'));
    };
    img.src = url;
  });
}

/**
 * Convert an image file to another format with custom geometry, quality, and background fill
 */
export async function convertSingleImage(
  file: File,
  options: ImageConvertOptions
): Promise<ConvertedImageResult> {
  const img = await loadImageElement(file);
  const origWidth = img.naturalWidth;
  const origHeight = img.naturalHeight;

  let targetWidth = options.width || origWidth;
  let targetHeight = options.height || origHeight;

  if (options.maintainAspect && options.width && !options.height) {
    targetHeight = Math.round((origHeight / origWidth) * options.width);
  } else if (options.maintainAspect && options.height && !options.width) {
    targetWidth = Math.round((origWidth / origHeight) * options.height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D rendering context unavailable.');
  }

  // Handle transparency fill for JPEG or when background color is set
  const format = options.format;
  const needsBg = format === 'image/jpeg' || options.backgroundColor;
  if (needsBg) {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const quality = options.quality !== undefined ? options.quality : 0.9;
  const mimeType = format === 'image/bmp' ? 'image/png' : format; // Fallback for standard browsers

  const dataUrl = canvas.toDataURL(mimeType, quality);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to encode image to output format.'));
      },
      mimeType,
      quality
    );
  });

  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
  };
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outExt = extMap[format] || '.jpg';
  const filename = `${baseName}-converted${outExt}`;

  return {
    blob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    originalSize: file.size,
    newSize: blob.size,
    filename,
  };
}

/**
 * Combine multiple images into a single clean PDF
 */
export async function convertImagesToPdf(
  files: File[],
  options: {
    pageSize?: 'fit' | 'a4';
    margin?: number;
  } = {}
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const pageSize = options.pageSize || 'a4';
  const margin = options.margin !== undefined ? options.margin : 20;

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type.includes('png') || file.name.toLowerCase().endsWith('.png');
    let embeddedImg;

    if (isPng) {
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    }

    if (pageSize === 'fit') {
      const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width,
        height: embeddedImg.height,
      });
    } else {
      // Standard A4: 595.28 x 841.89 points
      const a4Width = 595.28;
      const a4Height = 841.89;
      const page = pdfDoc.addPage([a4Width, a4Height]);

      const availWidth = a4Width - margin * 2;
      const availHeight = a4Height - margin * 2;
      const scale = Math.min(availWidth / embeddedImg.width, availHeight / embeddedImg.height, 1.0);

      const drawWidth = embeddedImg.width * scale;
      const drawHeight = embeddedImg.height * scale;
      const x = (a4Width - drawWidth) / 2;
      const y = (a4Height - drawHeight) / 2;

      page.drawImage(embeddedImg, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}
