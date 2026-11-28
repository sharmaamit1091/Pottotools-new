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
 * Internal core that detects horizontal handwritten text lines and returns
 * the ink mask so downstream chunking can inspect exact horizontal whitespace gaps.
 */
function detectLinesWithMask(canvas: HTMLCanvasElement): {
  lines: DetectedTextLine[];
  mask: Uint8Array;
  width: number;
  height: number;
} {
  const { mask, width, height } = buildAdaptiveInkMask(canvas);
  if (width < 32 || height < 32) {
    return { lines: [], mask, width, height };
  }

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
  if (maxRow < 5 || nonZeroCount === 0) {
    return { lines: [], mask, width, height };
  }

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
  if (validBands.length === 0) {
    return { lines: [], mask, width, height };
  }

  // 5. Split unusually tall bands (two handwritten lines whose ascenders/descenders touched)
  const heights = validBands.map((b) => b.y1 - b.y0 + 1).sort((a, b) => a - b);
  const medianBandH = heights[Math.floor(heights.length / 2)] || 36;
  const splitBands: Band[] = [];

  for (const b of validBands) {
    const h = b.y1 - b.y0 + 1;
    if (h > medianBandH * 1.95 && h > 54) {
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
      const peakInBand = Math.max(...Array.from(smooth.slice(b.y0, b.y1 + 1)));
      if (minVal < peakInBand * 0.45) {
        splitBands.push({ y0: b.y0, y1: valleyY });
        splitBands.push({ y0: valleyY + 1, y1: b.y1 });
        continue;
      }
    }
    splitBands.push(b);
  }

  // 6. Compute tight horizontal ink bounds for each line + clean padding
  const lines: DetectedTextLine[] = [];
  const padX = Math.max(12, Math.round(width * 0.012));

  for (let i = 0; i < splitBands.length; i++) {
    const b = splitBands[i];
    const bandH = b.y1 - b.y0 + 1;
    const padY = Math.max(5, Math.round(bandH * 0.12));

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

  return { lines, mask, width, height };
}

/**
 * Detects horizontal handwritten text lines from a scanned page canvas in top-to-bottom reading order.
 */
export function detectHandwrittenLines(canvas: HTMLCanvasElement): DetectedTextLine[] {
  return detectLinesWithMask(canvas).lines;
}

/**
 * Scores how strongly a canvas exhibits clean horizontal lines of text
 * (high aspect-ratio lines with consistent heights rather than broken vertical slices).
 */
function scoreHorizontalLineGeometry(canvas: HTMLCanvasElement): number {
  const lines = detectHandwrittenLines(canvas);
  if (lines.length === 0) return 0;

  const aspects = lines
    .map((l) => {
      const w = Math.max(1, l.pixelBox.x1 - l.pixelBox.x0);
      const h = Math.max(1, l.pixelBox.y1 - l.pixelBox.y0);
      return w / h;
    })
    .sort((a, b) => a - b);

  const medianAspect = aspects[Math.floor(aspects.length / 2)] || 0;
  const wideRatio = aspects.filter((a) => a >= 3.0).length / lines.length;
  const narrowPenalty = aspects.filter((a) => a < 1.8).length / lines.length;

  return Math.max(0, medianAspect * (0.4 + wideRatio * 0.9) - narrowPenalty * 2.5);
}

/**
 * Fast (<15ms) orientation pre-check that detects sideways-captured photos (e.g., WhatsApp
 * or phone camera notes saved rotated 90° CW/CCW without EXIF orientation).
 */
export function detectSidewaysOrientation(sourceCanvas: HTMLCanvasElement): {
  isLikelySideways: boolean;
  suggestedRotation: 0 | 90 | 270;
  horizontalScore: number;
  rotatedScore: number;
} {
  const maxSide = 680;
  const scale = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height, 1));
  const w = Math.max(48, Math.round(sourceCanvas.width * scale));
  const h = Math.max(48, Math.round(sourceCanvas.height * scale));

  const flat = document.createElement('canvas');
  flat.width = w;
  flat.height = h;
  const fCtx = flat.getContext('2d', { willReadFrequently: true });
  if (!fCtx) {
    return { isLikelySideways: false, suggestedRotation: 0, horizontalScore: 0, rotatedScore: 0 };
  }
  fCtx.fillStyle = '#FFFFFF';
  fCtx.fillRect(0, 0, w, h);
  fCtx.drawImage(sourceCanvas, 0, 0, w, h);

  const rot270 = document.createElement('canvas');
  rot270.width = h;
  rot270.height = w;
  const rCtx = rot270.getContext('2d', { willReadFrequently: true });
  if (!rCtx) {
    flat.width = 0;
    flat.height = 0;
    return { isLikelySideways: false, suggestedRotation: 0, horizontalScore: 0, rotatedScore: 0 };
  }
  rCtx.fillStyle = '#FFFFFF';
  rCtx.fillRect(0, 0, h, w);
  rCtx.translate(h / 2, w / 2);
  rCtx.rotate((270 * Math.PI) / 180);
  rCtx.drawImage(flat, -w / 2, -h / 2);

  const horizontalScore = scoreHorizontalLineGeometry(flat);
  const rotatedScore = scoreHorizontalLineGeometry(rot270);

  // If sideways, use left-alignment ink bias to pick 270° (90° CCW) vs 90° (90° CW)
  let suggestedRotation: 0 | 90 | 270 = 0;
  const isLikelySideways = rotatedScore > 3.2 && rotatedScore > horizontalScore * 1.55;

  if (isLikelySideways) {
    const { mask, width: rw, height: rh } = buildAdaptiveInkMask(rot270);
    let leftInk = 0;
    let rightInk = 0;
    const midX = Math.floor(rw / 2);
    for (let y = 0; y < rh; y++) {
      const off = y * rw;
      for (let x = 0; x < rw; x++) {
        if (mask[off + x]) {
          if (x < midX) leftInk++;
          else rightInk++;
        }
      }
    }
    // Left-aligned English/Hindi writing has heavier ink in the left half when upright
    suggestedRotation = leftInk >= rightInk ? 270 : 90;
  }

  flat.width = 0;
  flat.height = 0;
  rot270.width = 0;
  rot270.height = 0;

  return { isLikelySideways, suggestedRotation, horizontalScore, rotatedScore };
}

export interface SegmentedChunkCrop {
  blob: Blob;
  resized48?: {
    width: number;
    height: number;
    rgba: ArrayBuffer;
  };
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
  /** Optional horizontal chunks when a wide line contains large blank form/column gaps. */
  chunks?: SegmentedChunkCrop[];
}

/**
 * Estimates the paper background RGB along the crop perimeter so padding matches
 * camera-photo paper tone seamlessly without creating a fake dark rectangle border.
 */
function sampleCropPaperFillStyle(
  canvas: HTMLCanvasElement,
  x0: number,
  y0: number,
  w: number,
  h: number
): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#FFFFFF';
  try {
    const topStrip = ctx.getImageData(x0, y0, w, 1).data;
    const botStrip = ctx.getImageData(x0, Math.min(canvas.height - 1, y0 + h - 1), w, 1).data;
    const rs: number[] = [];
    const gs: number[] = [];
    const bs: number[] = [];
    const step = Math.max(1, Math.floor(w / 24));
    for (let x = 0; x < w; x += step) {
      const p = x * 4;
      rs.push(topStrip[p], botStrip[p]);
      gs.push(topStrip[p + 1], botStrip[p + 1]);
      bs.push(topStrip[p + 2], botStrip[p + 2]);
    }
    rs.sort((a, b) => a - b);
    gs.sort((a, b) => a - b);
    bs.sort((a, b) => a - b);
    // Use 75th percentile (paper pixels, ignoring any stray ink touching the edge)
    const idx = Math.min(rs.length - 1, Math.floor(rs.length * 0.75));
    const r = Math.max(180, rs[idx] ?? 255);
    const g = Math.max(180, gs[idx] ?? 255);
    const b = Math.max(180, bs[idx] ?? 255);
    return `rgb(${r},${g},${b})`;
  } catch {
    return '#FFFFFF';
  }
}

async function encodeRectCrop(
  canvas: HTMLCanvasElement,
  x0: number,
  y0: number,
  w: number,
  h: number,
  paperFill: string
): Promise<SegmentedChunkCrop> {
  const border = 6;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = w + border * 2;
  cropCanvas.height = h + border * 2;
  const ctx = cropCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = paperFill;
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.drawImage(canvas, x0, y0, w, h, border, border, w, h);
  }

  let resized48: SegmentedChunkCrop['resized48'];
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
      rCtx.fillStyle = paperFill;
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
  return { blob, resized48 };
}

/**
 * Finds major horizontal blank gaps (such as between a form field label and its value,
 * or between multiple spaced signatures) to split wide lines cleanly while keeping normal
 * word spacing intact.
 */
function findWideHorizontalChunks(
  mask: Uint8Array,
  pageW: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Array<{ cx0: number; cx1: number }> {
  const w = x1 - x0;
  const h = y1 - y0;
  if (w / Math.max(1, h) < 5.0) return [];

  const gapThresh = Math.max(24, Math.round(h * 0.95));
  const chunks: Array<{ cx0: number; cx1: number }> = [];
  let inChunk = false;
  let chunkStart = x0;
  let zeroRun = 0;

  for (let x = x0; x < x1; x++) {
    let colInk = 0;
    for (let y = y0; y < y1; y++) {
      colInk += mask[y * pageW + x];
    }
    if (colInk >= 1) {
      if (!inChunk) {
        inChunk = true;
        chunkStart = x;
      }
      zeroRun = 0;
    } else if (inChunk) {
      zeroRun++;
      if (zeroRun >= gapThresh) {
        const endX = x - zeroRun;
        if (endX - chunkStart >= 10) {
          chunks.push({ cx0: chunkStart, cx1: endX });
        }
        inChunk = false;
        zeroRun = 0;
      }
    }
  }
  if (inChunk && x1 - chunkStart >= 10) {
    chunks.push({ cx0: chunkStart, cx1: x1 });
  }

  // Only use chunk splitting when there are 2..6 meaningful phrase blocks
  return chunks.length >= 2 && chunks.length <= 6 ? chunks : [];
}

/**
 * Slices a single detected line bounding box from the page canvas into a crisp PNG Blob
 * (plus optional wide-gap phrase chunks and 48px-height RGBA fallback).
 */
export async function cropSingleLineFromCanvas(
  canvas: HTMLCanvasElement,
  line: DetectedTextLine,
  existingMask?: Uint8Array
): Promise<SegmentedLineCrop> {
  const { x0, y0, x1, y1 } = line.pixelBox;
  const w = Math.max(8, Math.round(x1 - x0));
  const h = Math.max(8, Math.round(y1 - y0));
  const paperFill = sampleCropPaperFillStyle(canvas, x0, y0, w, h);

  const mainCrop = await encodeRectCrop(canvas, x0, y0, w, h, paperFill);

  const mask = existingMask || buildAdaptiveInkMask(canvas).mask;
  const chunkBounds = findWideHorizontalChunks(mask, canvas.width, x0, y0, x1, y1);
  let chunks: SegmentedChunkCrop[] | undefined;

  if (chunkBounds.length >= 2) {
    chunks = [];
    for (const cb of chunkBounds) {
      const lx0 = Math.max(0, cb.cx0 - 10);
      const lx1 = Math.min(canvas.width, cb.cx1 + 10);
      const cw = Math.max(8, Math.round(lx1 - lx0));
      chunks.push(await encodeRectCrop(canvas, lx0, y0, cw, h, paperFill));
    }
  }

  return {
    line,
    blob: mainCrop.blob,
    resized48: mainCrop.resized48,
    chunks,
  };
}

/**
 * Slices each detected line bounding box from the page canvas into crisp PNG Blobs
 * ready to be passed locally to the Web Worker recognizers.
 */
export async function cropLineBlobsFromCanvas(
  canvas: HTMLCanvasElement,
  lines: DetectedTextLine[]
): Promise<SegmentedLineCrop[]> {
  const { mask } = buildAdaptiveInkMask(canvas);
  const crops: SegmentedLineCrop[] = [];
  for (const line of lines) {
    crops.push(await cropSingleLineFromCanvas(canvas, line, mask));
  }
  return crops;
}
