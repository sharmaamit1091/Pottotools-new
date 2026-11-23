import { DetectedTextLine } from './types';

/**
 * Computes a local adaptive ink mask (1 = ink pixel, 0 = paper/background)
 * resistant to shadows, yellowing, and uneven office scan lighting.
 */
function buildAdaptiveInkMask(
  canvas: HTMLCanvasElement
): { mask: Uint8Array; width: number; height: number } {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { mask: new Uint8Array(width * height), width, height };

  const data = ctx.getImageData(0, 0, width, height).data;
  const total = width * height;
  const gray = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    gray[i] = Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
  }

  // Compute integral image for fast O(1) local mean calculation
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const rowOff = y * width;
    const intRow = (y + 1) * (width + 1);
    const prevIntRow = y * (width + 1);
    for (let x = 0; x < width; x++) {
      rowSum += gray[rowOff + x];
      integral[intRow + x + 1] = integral[prevIntRow + x + 1] + rowSum;
    }
  }

  const radius = Math.max(14, Math.round(Math.min(width, height) * 0.018));
  const mask = new Uint8Array(total);
  const delta = 18; // Pixel must be noticeably darker than its local paper patch

  // Ignore extreme 1.5% scanner border edges where black borders often appear
  const marginX = Math.round(width * 0.015);
  const marginY = Math.round(height * 0.015);

  for (let y = marginY; y < height - marginY; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    const rowOff = y * width;

    for (let x = marginX; x < width - marginX; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);

      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
        integral[y0 * (width + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (width + 1) + x0] +
        integral[y0 * (width + 1) + x0];

      const localMean = sum / area;
      const val = gray[rowOff + x];
      if (val < localMean - delta && val < 215) {
        mask[rowOff + x] = 1;
      }
    }
  }

  return { mask, width, height };
}

/**
 * Detects horizontal handwritten text lines from a scanned page canvas in top-to-bottom reading order.
 * Handles lightly slanted cursive lines, filters thin ruled notebook lines/speckles,
 * splits vertically merged double-lines, and flags paragraph breaks.
 */
export function detectHandwrittenLines(canvas: HTMLCanvasElement): DetectedTextLine[] {
  const { mask, width, height } = buildAdaptiveInkMask(canvas);
  if (width < 32 || height < 32) return [];

  // 1. Horizontal ink projection per row
  const rowDensity = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    let count = 0;
    const rowOff = y * width;
    for (let x = 0; x < width; x++) {
      count += mask[rowOff + x];
    }
    // Suppress full-width solid horizontal ruled lines (>72% solid ink across page width)
    if (count > width * 0.72) {
      rowDensity[y] = 0;
    } else {
      rowDensity[y] = count;
    }
  }

  // 2. Smooth projection profile with a small vertical kernel
  const smoothRadius = Math.max(2, Math.round(height * 0.0025));
  const smooth = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    let n = 0;
    for (let dy = -smoothRadius; dy <= smoothRadius; dy++) {
      const yy = y + dy;
      if (yy >= 0 && yy < height) {
        sum += rowDensity[yy];
        n++;
      }
    }
    smooth[y] = sum / Math.max(1, n);
  }

  // Determine adaptive row ink threshold
  let maxRow = 0;
  let nonZeroSum = 0;
  let nonZeroCount = 0;
  for (let y = 0; y < height; y++) {
    if (smooth[y] > maxRow) maxRow = smooth[y];
    if (smooth[y] > 2) {
      nonZeroSum += smooth[y];
      nonZeroCount++;
    }
  }
  if (maxRow < 5 || nonZeroCount === 0) return [];

  const meanActive = nonZeroSum / nonZeroCount;
  const rowThreshold = Math.max(4, Math.min(meanActive * 0.19, maxRow * 0.09));

  // 3. Extract contiguous vertical bands
  interface Band {
    y0: number;
    y1: number;
  }
  const rawBands: Band[] = [];
  let inBand = false;
  let bandStart = 0;
  for (let y = 0; y < height; y++) {
    const active = smooth[y] >= rowThreshold;
    if (active && !inBand) {
      inBand = true;
      bandStart = y;
    } else if (!active && inBand) {
      inBand = false;
      rawBands.push({ y0: bandStart, y1: y - 1 });
    }
  }
  if (inBand) {
    rawBands.push({ y0: bandStart, y1: height - 1 });
  }

  // 4. Merge tiny vertical gaps caused by floating dots (i/j dots, Devanagari bindu/matras)
  const minLineHeight = Math.max(10, Math.round(height * 0.008));
  const mergeGapPx = Math.max(4, Math.round(height * 0.0045));
  const mergedBands: Band[] = [];
  for (const band of rawBands) {
    const prev = mergedBands[mergedBands.length - 1];
    if (prev && band.y0 - prev.y1 <= mergeGapPx) {
      prev.y1 = band.y1;
    } else {
      mergedBands.push({ ...band });
    }
  }

  // Filter out tiny noise slivers
  const validBands = mergedBands.filter((b) => b.y1 - b.y0 + 1 >= minLineHeight);
  if (validBands.length === 0) return [];

  // 5. Split unusually tall bands (two handwritten lines whose ascenders/descenders touched)
  const heights = validBands.map((b) => b.y1 - b.y0 + 1).sort((a, b) => a - b);
  const medianBandH = heights[Math.floor(heights.length / 2)] || 36;
  const splitBands: Band[] = [];

  for (const b of validBands) {
    const h = b.y1 - b.y0 + 1;
    if (h > medianBandH * 1.95 && h > 54) {
      // Find lowest projection valley in the middle 50% of this band
      const searchStart = Math.round(b.y0 + h * 0.25);
      const searchEnd = Math.round(b.y1 - h * 0.25);
      let valleyY = Math.round((b.y0 + b.y1) / 2);
      let minVal = Infinity;
      for (let y = searchStart; y <= searchEnd; y++) {
        if (smooth[y] < minVal) {
          minVal = smooth[y];
          valleyY = y;
        }
      }
      // Split if there is a genuine local dip
      const peakInBand = Math.max(...Array.from(smooth.slice(b.y0, b.y1 + 1)));
      if (minVal < peakInBand * 0.45) {
        splitBands.push({ y0: b.y0, y1: valleyY });
        splitBands.push({ y0: valleyY + 1, y1: b.y1 });
        continue;
      }
    }
    splitBands.push(b);
  }

  // 6. Compute tight horizontal ink bounds for each line + generous padding for TrOCR
  const lines: DetectedTextLine[] = [];
  const padX = Math.max(12, Math.round(width * 0.012));

  for (let i = 0; i < splitBands.length; i++) {
    const b = splitBands[i];
    const bandH = b.y1 - b.y0 + 1;
    const padY = Math.max(6, Math.round(bandH * 0.16));

    // Horizontal ink projection inside this vertical band
    let minX = width;
    let maxX = 0;
    let totalInk = 0;
    for (let x = 0; x < width; x++) {
      let colInk = 0;
      for (let y = b.y0; y <= b.y1; y++) {
        colInk += mask[y * width + x];
      }
      if (colInk >= 2) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        totalInk += colInk;
      }
    }

    // Reject empty or single-speckle rows
    if (maxX <= minX || maxX - minX < 18 || totalInk < 24) {
      continue;
    }

    const x0 = Math.max(0, minX - padX);
    const x1 = Math.min(width, maxX + padX);
    const y0 = Math.max(0, b.y0 - padY);
    const y1 = Math.min(height, b.y1 + padY);

    lines.push({
      id: `line-${lines.length + 1}`,
      lineIndex: lines.length,
      pixelBox: { x0, y0, x1, y1 },
      normalizedBox: {
        x0: x0 / width,
        y0: y0 / height,
        x1: x1 / width,
        y1: y1 / height,
      },
      paragraphBreakAfter: false,
    });
  }

  // 7. Detect paragraph breaks from inter-line vertical gaps
  if (lines.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < lines.length - 1; i++) {
      const gap = Math.max(0, lines[i + 1].pixelBox.y0 - lines[i].pixelBox.y1);
      gaps.push(gap);
    }
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] || 12;
    const paraThreshold = Math.max(18, medianGap * 1.75);

    for (let i = 0; i < lines.length - 1; i++) {
      if (gaps[i] > paraThreshold) {
        lines[i].paragraphBreakAfter = true;
      }
    }
  }

  return lines;
}

export interface SegmentedLineCrop {
  line: DetectedTextLine;
  blob: Blob;
  /** Populated automatically only when browser lacks OffscreenCanvas in Web Workers. */
  resized48?: {
    width: number;
    height: number;
    rgba: ArrayBuffer;
  };
}

/**
 * Slices a single detected line bounding box from the page canvas into a crisp PNG Blob
 * (plus an optional 48px-height RGBA fallback if the browser lacks OffscreenCanvas).
 */
export async function cropSingleLineFromCanvas(
  canvas: HTMLCanvasElement,
  line: DetectedTextLine
): Promise<SegmentedLineCrop> {
  const { x0, y0, x1, y1 } = line.pixelBox;
  const w = Math.max(8, Math.round(x1 - x0));
  const h = Math.max(8, Math.round(y1 - y0));

  // Both TrOCR and PaddleOCR work best with a clean white margin around handwritten lines
  const border = 8;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = w + border * 2;
  cropCanvas.height = h + border * 2;
  const ctx = cropCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.drawImage(canvas, x0, y0, w, h, border, border, w, h);
  }

  let resized48: SegmentedLineCrop['resized48'];
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    const targetH = 48;
    const resizedW = Math.max(
      24,
      Math.min(2048, Math.round((cropCanvas.width * targetH) / Math.max(1, cropCanvas.height)))
    );
    const rCanvas = document.createElement('canvas');
    rCanvas.width = resizedW;
    rCanvas.height = targetH;
    const rCtx = rCanvas.getContext('2d', { willReadFrequently: true });
    if (rCtx) {
      rCtx.fillStyle = '#FFFFFF';
      rCtx.fillRect(0, 0, resizedW, targetH);
      rCtx.drawImage(cropCanvas, 0, 0, resizedW, targetH);
      const imgData = rCtx.getImageData(0, 0, resizedW, targetH);
      resized48 = {
        width: resizedW,
        height: targetH,
        rgba: imgData.data.buffer.slice(0),
      };
    }
    rCanvas.width = 0;
    rCanvas.height = 0;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    cropCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode cropped text line.'))),
      'image/png'
    );
  });

  cropCanvas.width = 0;
  cropCanvas.height = 0;
  return { line, blob, resized48 };
}

/**
 * Slices each detected line bounding box from the page canvas into a crisp PNG Blob
 * ready to be passed locally to the Web Worker neural HTR recognizers.
 */
export async function cropLineBlobsFromCanvas(
  canvas: HTMLCanvasElement,
  lines: DetectedTextLine[]
): Promise<SegmentedLineCrop[]> {
  const crops: SegmentedLineCrop[] = [];
  for (const line of lines) {
    crops.push(await cropSingleLineFromCanvas(canvas, line));
  }
  return crops;
}
