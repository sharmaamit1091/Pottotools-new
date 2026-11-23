import { ImageEnhancementSettings } from './types';

/**
 * Fast O(N) separable sliding-window box blur on a single-channel Float32Array.
 * Used for smooth background illumination estimation (shadow removal) without
 * eroding thin handwritten ink strokes.
 */
function boxBlurSingleChannel(
  src: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  const temp = new Float32Array(width * height);
  const dst = new Float32Array(width * height);
  const windowSize = radius * 2 + 1;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
      const clampedX = Math.max(0, Math.min(width - 1, i));
      sum += src[rowOffset + clampedX];
    }
    for (let x = 0; x < width; x++) {
      temp[rowOffset + x] = sum / windowSize;
      const removeX = Math.max(0, x - radius);
      const addX = Math.min(width - 1, x + radius + 1);
      sum += src[rowOffset + addX] - src[rowOffset + removeX];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
      const clampedY = Math.max(0, Math.min(height - 1, i));
      sum += temp[clampedY * width + x];
    }
    for (let y = 0; y < height; y++) {
      dst[y * width + x] = sum / windowSize;
      const removeY = Math.max(0, y - radius);
      const addY = Math.min(height - 1, y + radius + 1);
      sum += temp[addY * width + x] - temp[removeY * width + x];
    }
  }

  return dst;
}

/**
 * Gentle 3x3 despeckle median filter on a luminance buffer (removes tiny scanner salt-and-pepper
 * dots while preserving continuous handwriting lines).
 */
function gentleDespeckle3x3(src: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length);
  out.set(src);
  const windowVals = new Uint8Array(9);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const center = src[idx];

      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const r = (y + dy) * width;
        for (let dx = -1; dx <= 1; dx++) {
          windowVals[k++] = src[r + x + dx];
        }
      }

      // Insertion sort 9 items (very fast)
      for (let i = 1; i < 9; i++) {
        const v = windowVals[i];
        let j = i - 1;
        while (j >= 0 && windowVals[j] > v) {
          windowVals[j + 1] = windowVals[j];
          j--;
        }
        windowVals[j + 1] = v;
      }

      const median = windowVals[4];
      // Only replace isolated spikes so thin pen strokes aren't thinned away
      if (Math.abs(center - median) > 34) {
        out[idx] = median;
      }
    }
  }

  return out;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

/**
 * Estimates subtle scan skew angle in degrees (-6.0° to +6.0°) by maximizing the variance
 * of the horizontal ink projection profile on a downscaled copy.
 */
export function estimateAutoDeskewAngle(sourceCanvas: HTMLCanvasElement): number {
  const maxW = 460;
  const scale = Math.min(1, maxW / Math.max(1, sourceCanvas.width));
  const w = Math.max(40, Math.round(sourceCanvas.width * scale));
  const h = Math.max(40, Math.round(sourceCanvas.height * scale));

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const wCtx = work.getContext('2d', { willReadFrequently: true });
  if (!wCtx) return 0;

  wCtx.fillStyle = '#FFFFFF';
  wCtx.fillRect(0, 0, w, h);
  wCtx.drawImage(sourceCanvas, 0, 0, w, h);

  const probe = document.createElement('canvas');
  probe.width = w;
  probe.height = h;
  const pCtx = probe.getContext('2d', { willReadFrequently: true });
  if (!pCtx) {
    work.width = 0;
    work.height = 0;
    return 0;
  }

  let bestAngle = 0;
  let bestScore = -1;

  for (let deg = -6; deg <= 6; deg += 0.5) {
    pCtx.save();
    pCtx.fillStyle = '#FFFFFF';
    pCtx.fillRect(0, 0, w, h);
    pCtx.translate(w / 2, h / 2);
    pCtx.rotate((deg * Math.PI) / 180);
    pCtx.drawImage(work, -w / 2, -h / 2);
    pCtx.restore();

    const data = pCtx.getImageData(0, 0, w, h).data;
    const rowCounts = new Float64Array(h);
    let mean = 0;

    // Sample inner 84% horizontally to avoid black scan edges skewing the score
    const xStart = Math.round(w * 0.08);
    const xEnd = Math.round(w * 0.92);
    for (let y = 0; y < h; y++) {
      let darkCount = 0;
      const rowOffset = y * w;
      for (let x = xStart; x < xEnd; x += 2) {
        const p = (rowOffset + x) * 4;
        const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
        if (lum < 165) darkCount++;
      }
      rowCounts[y] = darkCount;
      mean += darkCount;
    }
    mean /= h;

    let variance = 0;
    for (let y = 0; y < h; y++) {
      const diff = rowCounts[y] - mean;
      variance += diff * diff;
    }

    if (variance > bestScore) {
      bestScore = variance;
      bestAngle = deg;
    }
  }

  work.width = 0;
  work.height = 0;
  probe.width = 0;
  probe.height = 0;

  return Math.round(bestAngle * 10) / 10;
}

/**
 * Produces a non-destructive enhanced copy of a scanned page canvas.
 * Never mutates the original source canvas.
 */
export function applyImageEnhancements(
  sourceCanvas: HTMLCanvasElement,
  settings: ImageEnhancementSettings
): HTMLCanvasElement {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  // Step 1: Rotation (0/90/180/270) + Fine Deskew
  const swapAxes = settings.rotation === 90 || settings.rotation === 270;
  const outW = swapAxes ? srcH : srcW;
  const outH = swapAxes ? srcW : srcH;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return outCanvas;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  const totalAngleRad = ((settings.rotation + settings.deskewDeg) * Math.PI) / 180;
  if (Math.abs(totalAngleRad) > 0.0001) {
    ctx.rotate(totalAngleRad);
  }
  ctx.drawImage(sourceCanvas, -srcW / 2, -srcH / 2);
  ctx.restore();

  // If tone/cleanup enhancements are disabled and no color adjustment is active, return rotated copy
  const hasPixelOps =
    settings.enabled ||
    settings.shadowRemoval > 0 ||
    settings.faintInkBoost > 0 ||
    settings.contrast !== 0 ||
    settings.brightness !== 0 ||
    settings.noiseReduction ||
    settings.grayscale ||
    settings.binarize;

  if (!hasPixelOps) {
    return outCanvas;
  }

  const imageData = ctx.getImageData(0, 0, outW, outH);
  const pixels = imageData.data;
  const totalPixels = outW * outH;

  // Compute grayscale luminance buffer
  const lumFloat = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const p = i * 4;
    lumFloat[i] = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
  }

  // Step 2: Illumination Normalization (Shadow Removal & Yellowed Background Cleanup)
  let bgMap: Float32Array | null = null;
  if (settings.shadowRemoval > 0) {
    // Downscale by 4x for fast smooth illumination background map
    const dsW = Math.max(16, Math.round(outW / 4));
    const dsH = Math.max(16, Math.round(outH / 4));
    const dsLum = new Float32Array(dsW * dsH);
    for (let y = 0; y < dsH; y++) {
      const sy = Math.min(outH - 1, y * 4);
      for (let x = 0; x < dsW; x++) {
        const sx = Math.min(outW - 1, x * 4);
        dsLum[y * dsW + x] = lumFloat[sy * outW + sx];
      }
    }
    const blurRadius = Math.max(6, Math.round(Math.min(dsW, dsH) * 0.032));
    const smoothBg = boxBlurSingleChannel(dsLum, dsW, dsH, blurRadius);

    bgMap = new Float32Array(totalPixels);
    for (let y = 0; y < outH; y++) {
      const by = Math.min(dsH - 1, y >> 2);
      const rowOffset = y * outW;
      const bRowOffset = by * dsW;
      for (let x = 0; x < outW; x++) {
        const bx = Math.min(dsW - 1, x >> 2);
        bgMap[rowOffset + x] = smoothBg[bRowOffset + bx];
      }
    }
  }

  const shadowStrength = settings.shadowRemoval / 100;
  const inkBoost = settings.faintInkBoost / 100;
  // Contrast factor
  const contrastScaled = settings.contrast * 1.9;
  const contrastFactor = (259 * (contrastScaled + 255)) / (255 * (259 - contrastScaled));
  const brightnessOffset = settings.brightness * 1.8;

  const processedLum = new Uint8ClampedArray(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    let val = lumFloat[i];

    // Divide out uneven illumination/shadows gently
    if (bgMap) {
      const localBg = Math.max(60, bgMap[i]);
      const normalized = Math.min(255, (val / localBg) * 246);
      val = val * (1 - shadowStrength) + normalized * shadowStrength;
    }

    // Faint Ink Enhancement: deepen darker-than-paper strokes via gentle non-linear curve
    // without crushing paper background into gray
    if (inkBoost > 0 && val < 228) {
      const darkness = (228 - val) / 228; // 0 near paper, 1 on deep ink
      const boostedDarkness = Math.pow(darkness, 1 - inkBoost * 0.42);
      val = 228 * (1 - boostedDarkness);
    }

    // Contrast & Brightness
    if (settings.contrast !== 0) {
      val = contrastFactor * (val - 128) + 128;
    }
    if (settings.brightness !== 0) {
      val += brightnessOffset;
    }

    processedLum[i] = clampByte(val);
  }

  // Step 3: Optional gentle despeckle noise cleanup
  const finalLum = settings.noiseReduction
    ? gentleDespeckle3x3(processedLum, outW, outH)
    : processedLum;

  // Step 4: Write back either B&W Threshold, Grayscale, or Tone-Adjusted Color
  if (settings.binarize) {
    const thresh = settings.threshold;
    for (let i = 0; i < totalPixels; i++) {
      const bw = finalLum[i] < thresh ? 0 : 255;
      const p = i * 4;
      pixels[p] = bw;
      pixels[p + 1] = bw;
      pixels[p + 2] = bw;
      pixels[p + 3] = 255;
    }
  } else if (settings.grayscale) {
    for (let i = 0; i < totalPixels; i++) {
      const g = finalLum[i];
      const p = i * 4;
      pixels[p] = g;
      pixels[p + 1] = g;
      pixels[p + 2] = g;
      pixels[p + 3] = 255;
    }
  } else {
    // Preserve ink color tint (e.g., blue ballpoint pen vs red margin notes) while applying luminance gain
    for (let i = 0; i < totalPixels; i++) {
      const p = i * 4;
      const origLum = Math.max(1, lumFloat[i]);
      const gain = finalLum[i] / origLum;
      pixels[p] = clampByte(pixels[p] * gain);
      pixels[p + 1] = clampByte(pixels[p + 1] * gain);
      pixels[p + 2] = clampByte(pixels[p + 2] * gain);
      pixels[p + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return outCanvas;
}
