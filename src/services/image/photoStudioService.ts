/**
 * Pure client-side hardware canvas image processing engine for PottoTools
 * Handles dimension resizing, iterative target KB compression, Gov Exam presets,
 * photo editing, unsharp mask HD enhancement, color-key background changing,
 * and format conversion without remote server uploads.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeOptions {
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  aspectRatioLocked?: boolean;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number; // 0.01 - 1.0
  dpi?: number; // e.g. 300, 200, 72
  backgroundColor?: string;
}

export interface CompressOptions {
  targetKb: number; // e.g. 20, 50, 100, 500
  minKb?: number;
  format?: 'image/jpeg' | 'image/webp';
  initialQuality?: number;
  autoDownscaleIfNecessary?: boolean;
}

export interface EditorAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  warmth?: number; // -100 to 100 (warm/cool temperature)
  sharpness: number; // 0 to 100
  grayscale: boolean;
  filter: 'none' | 'warm' | 'cool' | 'vintage' | 'vivid';
  rotation: number; // 0, 90, 180, 270
  straightenAngle: number; // -45 to 45
  flipH: boolean;
  flipV: boolean;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LengthUnit = 'px' | 'in' | 'cm' | 'mm' | 'm';

export function convertPhysicalToPixels(val: number, unit: LengthUnit, dpi: number): number {
  if (isNaN(val) || val <= 0) return 0;
  if (unit === 'px') return Math.max(1, Math.round(val));
  if (unit === 'in') return Math.max(1, Math.round(val * dpi));
  if (unit === 'cm') return Math.max(1, Math.round((val / 2.54) * dpi));
  if (unit === 'mm') return Math.max(1, Math.round((val / 25.4) * dpi));
  if (unit === 'm') return Math.max(1, Math.round(val * 39.37007874 * dpi));
  return Math.max(1, Math.round(val));
}

export function convertPixelsToPhysical(pixels: number, unit: LengthUnit, dpi: number): number {
  if (isNaN(pixels) || pixels <= 0) return 0;
  if (unit === 'px') return pixels;
  if (unit === 'in') return parseFloat((pixels / dpi).toFixed(2));
  if (unit === 'cm') return parseFloat(((pixels / dpi) * 2.54).toFixed(2));
  if (unit === 'mm') return parseFloat(((pixels / dpi) * 25.4).toFixed(1));
  if (unit === 'm') return parseFloat(((pixels / dpi) * 0.0254).toFixed(4));
  return pixels;
}

export interface EnhancerOptions {
  autoEnhance?: boolean;
  strengthPreset?: 'subtle' | 'balanced' | 'vivid' | 'custom';
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  exposure?: number; // -100 to 100
  highlights?: number; // -100 to 100
  shadows?: number; // -100 to 100
  whiteBalance?: number; // -100 (cool) to 100 (warm)
  sharpenAmount: number; // 0 to 100
  contrastAdaptive: boolean;
  denoiseAmount: number; // 0 to 60
  upscaleFactor: 1 | 2 | 4;
}

export interface BackgroundChangeOptions {
  targetColor: string; // Hex color to fill
  sampleX?: number; // 0-1 normalized
  sampleY?: number; // 0-1 normalized
  tolerance: number; // 1 to 100
  feather: number; // 0 to 20
}

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeKb: number;
  format: string;
  qualityUsed?: number;
  filename: string;
  isPhysicallyFeasible?: boolean;
  feasibilityNote?: string;
}

// -------------------------------------------------------------
// Image Loader Utility
// -------------------------------------------------------------

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. Please ensure it is a valid JPG, PNG, or WebP image.'));
    };
    img.src = url;
  });
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to parse image data.'));
    img.src = dataUrl;
  });
}

// -------------------------------------------------------------
// 1. Custom Photo Resizer (High-Quality Multi-Pass Lanczos/Bicubic)
// -------------------------------------------------------------

export function renderHighQualityResize(
  source: HTMLImageElement | HTMLCanvasElement,
  targetW: number,
  targetH: number,
  format: string = 'image/jpeg',
  backgroundColor: string = '#FFFFFF'
): HTMLCanvasElement {
  const srcW = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const srcH = 'naturalHeight' in source ? source.naturalHeight : source.height;

  const validTargetW = Math.max(1, Math.round(targetW));
  const validTargetH = Math.max(1, Math.round(targetH));

  // If downscaling significantly (> 2x reduction), single-pass drawImage creates harsh
  // aliasing / shimmering artifacts. We downsample progressively by 50% steps (Hermite/Pyramid)
  if (validTargetW < srcW * 0.5 && validTargetH < srcH * 0.5) {
    let curW = srcW;
    let curH = srcH;
    let curCanvas = document.createElement('canvas');
    curCanvas.width = curW;
    curCanvas.height = curH;
    let curCtx = curCanvas.getContext('2d');
    if (curCtx) {
      curCtx.drawImage(source, 0, 0);

      while (curW * 0.5 > validTargetW && curH * 0.5 > validTargetH) {
        const nextW = Math.round(curW * 0.5);
        const nextH = Math.round(curH * 0.5);
        const stepCanvas = document.createElement('canvas');
        stepCanvas.width = nextW;
        stepCanvas.height = nextH;
        const stepCtx = stepCanvas.getContext('2d');
        if (!stepCtx) break;
        stepCtx.imageSmoothingEnabled = true;
        stepCtx.imageSmoothingQuality = 'high';
        stepCtx.drawImage(curCanvas, 0, 0, nextW, nextH);
        curCanvas = stepCanvas;
        curW = nextW;
        curH = nextH;
      }

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = validTargetW;
      finalCanvas.height = validTargetH;
      const finalCtx = finalCanvas.getContext('2d');
      if (finalCtx) {
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        if (format === 'image/jpeg') {
          finalCtx.fillStyle = backgroundColor || '#FFFFFF';
          finalCtx.fillRect(0, 0, validTargetW, validTargetH);
        }
        finalCtx.drawImage(curCanvas, 0, 0, validTargetW, validTargetH);
        return finalCanvas;
      }
    }
  }

  // Mild scaling or upscaling
  const canvas = document.createElement('canvas');
  canvas.width = validTargetW;
  canvas.height = validTargetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (format === 'image/jpeg') {
      ctx.fillStyle = backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, validTargetW, validTargetH);
    }
    if (validTargetW > srcW * 1.5 || validTargetH > srcH * 1.5) {
      renderMultiStepUpscale(ctx, source as any, validTargetW, validTargetH);
    } else {
      ctx.drawImage(source, 0, 0, validTargetW, validTargetH);
    }
  }
  return canvas;
}

export async function resizeImage(
  source: HTMLImageElement | File,
  options: ResizeOptions,
  originalFilename = 'photo.jpg'
): Promise<ProcessedImageResult> {
  const img = source instanceof HTMLImageElement ? source : await loadImageFromFile(source);
  const targetW = Math.max(1, Math.round(options.targetWidth));
  const targetH = Math.max(1, Math.round(options.targetHeight));
  const format = options.format || 'image/jpeg';
  const quality = options.quality ?? 0.94;

  const canvas = renderHighQualityResize(
    img,
    targetW,
    targetH,
    format,
    options.backgroundColor || '#FFFFFF'
  );

  let blob = await canvasToBlob(canvas, format, quality);

  // If DPI is specified and format is JPEG, inject standard JFIF density segment
  if (format === 'image/jpeg' && options.dpi && options.dpi > 0) {
    try {
      blob = await injectJpegDpi(blob, options.dpi);
    } catch {
      // Retain blob
    }
  }

  const dataUrl = canvas.toDataURL(format, quality);
  const base = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || 'photo';
  const ext = format === 'image/jpeg' ? '.jpg' : format === 'image/webp' ? '.webp' : '.png';
  const filename = `${base}-${targetW}x${targetH}${ext}`;

  return {
    blob,
    dataUrl,
    width: targetW,
    height: targetH,
    sizeBytes: blob.size,
    sizeKb: parseFloat((blob.size / 1024).toFixed(1)),
    format,
    qualityUsed: Math.round(quality * 100),
    filename,
  };
}

// -------------------------------------------------------------
// 2. Photo Size Compressor (Iterative Binary Search to exact Target KB)
// -------------------------------------------------------------

export async function compressImageToTargetKb(
  source: HTMLImageElement | File,
  options: CompressOptions,
  originalFilename = 'photo.jpg'
): Promise<ProcessedImageResult> {
  const img = source instanceof HTMLImageElement ? source : await loadImageFromFile(source);
  const targetBytes = options.targetKb * 1024;
  const minBytes = (options.minKb || 0) * 1024;
  const format = options.format || 'image/jpeg';

  let currentWidth = img.naturalWidth;
  let currentHeight = img.naturalHeight;

  // Check physical feasibility: if an image is 4000x3000 and target is 5KB,
  // 5120 bytes / (4000 * 3000) = 0.0004 bytes/pixel, which is mathematically
  // impossible without dimensional downscaling.
  let isPhysicallyFeasible = true;
  let feasibilityNote = '';

  const maxRawPixels = targetBytes * 35; // Rough heuristic of reasonable entropy
  if (currentWidth * currentHeight > maxRawPixels && options.autoDownscaleIfNecessary) {
    // Dimensionally scale down slightly to make compression achievable
    const scale = Math.sqrt(maxRawPixels / (currentWidth * currentHeight));
    currentWidth = Math.max(120, Math.round(currentWidth * scale));
    currentHeight = Math.max(120, Math.round(currentHeight * scale));
    feasibilityNote = `Automatically adjusted dimensions to ${currentWidth}×${currentHeight} px to achieve ${options.targetKb} KB cleanly without JPEG corruption.`;
  } else if (currentWidth * currentHeight > targetBytes * 80) {
    isPhysicallyFeasible = false;
    feasibilityNote = `Target of ${options.targetKb} KB is extremely tight for ${currentWidth}×${currentHeight} px. Result may show compression artifacts unless dimensions are scaled down.`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = currentWidth;
  canvas.height = currentHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, currentWidth, currentHeight);
  }
  ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

  // Binary search on quality between 0.02 and 0.98
  let low = 0.02;
  let high = 0.98;
  let bestBlob: Blob | null = null;
  let bestQuality = 0.8;

  for (let i = 0; i < 9; i++) {
    const testQuality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, format, testQuality);
    bestBlob = blob;
    bestQuality = testQuality;

    if (blob.size <= targetBytes && blob.size >= minBytes) {
      break; // Found matching sweet spot
    } else if (blob.size > targetBytes) {
      high = testQuality - 0.04;
    } else {
      low = testQuality + 0.04;
    }

    if (high <= low) break;
  }

  // If still too large and auto downscale is allowed, try one pass with smaller canvas
  if (bestBlob && bestBlob.size > targetBytes && options.autoDownscaleIfNecessary && currentWidth > 180) {
    const scaleFactor = Math.sqrt(targetBytes / bestBlob.size) * 0.92;
    const newW = Math.max(100, Math.round(currentWidth * scaleFactor));
    const newH = Math.max(100, Math.round(currentHeight * scaleFactor));

    const smallerCanvas = document.createElement('canvas');
    smallerCanvas.width = newW;
    smallerCanvas.height = newH;
    const smCtx = smallerCanvas.getContext('2d');
    if (smCtx) {
      smCtx.imageSmoothingEnabled = true;
      smCtx.imageSmoothingQuality = 'high';
      if (format === 'image/jpeg') {
        smCtx.fillStyle = '#FFFFFF';
        smCtx.fillRect(0, 0, newW, newH);
      }
      smCtx.drawImage(canvas, 0, 0, newW, newH);

      const smBlob = await canvasToBlob(smallerCanvas, format, 0.75);
      if (smBlob.size <= targetBytes) {
        bestBlob = smBlob;
        canvas.width = newW;
        canvas.height = newH;
        ctx.drawImage(smallerCanvas, 0, 0);
        feasibilityNote = `Downscaled to ${newW}×${newH} px to reach ${options.targetKb} KB limit.`;
      }
    }
  }

  if (!bestBlob) {
    bestBlob = await canvasToBlob(canvas, format, 0.7);
  }

  const dataUrl = canvas.toDataURL(format, bestQuality);
  const base = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || 'photo';
  const ext = format === 'image/jpeg' ? '.jpg' : '.webp';
  const filename = `${base}-compressed-${options.targetKb}KB${ext}`;

  return {
    blob: bestBlob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    sizeBytes: bestBlob.size,
    sizeKb: parseFloat((bestBlob.size / 1024).toFixed(1)),
    format,
    qualityUsed: Math.round(bestQuality * 100),
    filename,
    isPhysicallyFeasible,
    feasibilityNote,
  };
}

// -------------------------------------------------------------
// 3. Photo Editor (Crop, Rotate, Straighten, Adjustments, Filters)
// -------------------------------------------------------------

export async function processEditorPipeline(
  source: HTMLImageElement | File,
  adjustments: EditorAdjustments,
  cropArea?: CropArea | null,
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality = 0.92,
  originalFilename = 'edited-photo.jpg'
): Promise<ProcessedImageResult> {
  const img = source instanceof HTMLImageElement ? source : await loadImageFromFile(source);

  // Step 1: Base cropped or uncropped canvas
  let srcCanvas = document.createElement('canvas');
  let sX = 0;
  let sY = 0;
  let sW = img.naturalWidth;
  let sH = img.naturalHeight;

  if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
    sX = Math.max(0, Math.round(cropArea.x));
    sY = Math.max(0, Math.round(cropArea.y));
    sW = Math.min(img.naturalWidth - sX, Math.round(cropArea.width));
    sH = Math.min(img.naturalHeight - sY, Math.round(cropArea.height));
  }

  srcCanvas.width = sW;
  srcCanvas.height = sH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) throw new Error('Canvas context unavailable');

  srcCtx.drawImage(img, sX, sY, sW, sH, 0, 0, sW, sH);

  // Step 2: Rotation & Straighten & Flips
  const totalAngleDeg = (adjustments.rotation + (adjustments.straightenAngle || 0)) % 360;
  let rotCanvas = srcCanvas;

  if (totalAngleDeg !== 0 || adjustments.flipH || adjustments.flipV) {
    rotCanvas = document.createElement('canvas');
    const rad = (totalAngleDeg * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));

    const newW = Math.round(sW * cos + sH * sin);
    const newH = Math.round(sW * sin + sH * cos);
    rotCanvas.width = newW;
    rotCanvas.height = newH;

    const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });
    if (rotCtx) {
      rotCtx.imageSmoothingEnabled = true;
      rotCtx.imageSmoothingQuality = 'high';
      rotCtx.translate(newW / 2, newH / 2);
      rotCtx.rotate(rad);
      rotCtx.scale(adjustments.flipH ? -1 : 1, adjustments.flipV ? -1 : 1);
      rotCtx.drawImage(srcCanvas, -sW / 2, -sH / 2);
    }
  }

  // Step 3: Color adjustments & Filters via Pixel Manipulation
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = rotCanvas.width;
  finalCanvas.height = rotCanvas.height;
  const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
  if (!finalCtx) throw new Error('Final canvas context unavailable');

  finalCtx.drawImage(rotCanvas, 0, 0);

  // Read pixel data
  const imgData = finalCtx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
  const data = imgData.data;

  // Pre-calculate factor constants
  const brightnessMul = (adjustments.brightness / 100) * 128;
  const contrastFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
  const satFactor = (adjustments.saturation + 100) / 100;
  const exposureMul = Math.pow(2, adjustments.exposure / 50);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Exposure
    if (adjustments.exposure !== 0) {
      r *= exposureMul;
      g *= exposureMul;
      b *= exposureMul;
    }

    // Brightness
    if (adjustments.brightness !== 0) {
      r += brightnessMul;
      g += brightnessMul;
      b += brightnessMul;
    }

    // Contrast
    if (adjustments.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Saturation
    if (adjustments.saturation !== 0) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    // Grayscale
    if (adjustments.grayscale) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // Warmth / Temperature (-100 to +100)
    if (adjustments.warmth && adjustments.warmth !== 0) {
      const warmthVal = adjustments.warmth / 100;
      if (warmthVal > 0) {
        r += warmthVal * 32;
        g += warmthVal * 12;
        b -= warmthVal * 26;
      } else {
        const coolVal = Math.abs(warmthVal);
        b += coolVal * 32;
        g += coolVal * 6;
        r -= coolVal * 26;
      }
    }

    // Preset Tonal Filters
    if (adjustments.filter === 'warm') {
      r = r * 1.08 + 8;
      b = b * 0.94 - 4;
    } else if (adjustments.filter === 'cool') {
      b = b * 1.1 + 8;
      r = r * 0.92 - 4;
    } else if (adjustments.filter === 'vintage') {
      const vr = r * 0.393 + g * 0.769 + b * 0.189;
      const vg = r * 0.349 + g * 0.686 + b * 0.168;
      const vb = r * 0.272 + g * 0.534 + b * 0.131;
      r = vr * 0.7 + r * 0.3;
      g = vg * 0.7 + g * 0.3;
      b = vb * 0.7 + b * 0.3;
    } else if (adjustments.filter === 'vivid') {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * 1.35;
      g = gray + (g - gray) * 1.35;
      b = gray + (b - gray) * 1.35;
    }

    // Clamp
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  finalCtx.putImageData(imgData, 0, 0);

  // Sharpness Convolution (if requested)
  if (adjustments.sharpness > 0) {
    applySharpenConvolution(finalCtx, finalCanvas.width, finalCanvas.height, adjustments.sharpness / 100);
  }

  const blob = await canvasToBlob(finalCanvas, outputFormat, quality);
  const dataUrl = finalCanvas.toDataURL(outputFormat, quality);
  const base = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || 'photo';
  const ext = outputFormat === 'image/jpeg' ? '.jpg' : outputFormat === 'image/webp' ? '.webp' : '.png';
  const filename = `${base}-edited${ext}`;

  return {
    blob,
    dataUrl,
    width: finalCanvas.width,
    height: finalCanvas.height,
    sizeBytes: blob.size,
    sizeKb: parseFloat((blob.size / 1024).toFixed(1)),
    format: outputFormat,
    qualityUsed: Math.round(quality * 100),
    filename,
  };
}

// -------------------------------------------------------------
// 4. HD Image Enhancer (Multi-Stage Dynamic Range, Unsharp Mask & CAS)
// -------------------------------------------------------------

export function computeAutoEnhanceSettings(ctx: CanvasRenderingContext2D, width: number, height: number): {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  whiteBalance: number;
  sharpenAmount: number;
  denoiseAmount: number;
} {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const step = Math.max(1, Math.floor(data.length / (4 * 5000)));

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  const luminanceBuckets = new Uint32Array(256);

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    rSum += r;
    gSum += g;
    bSum += b;
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    luminanceBuckets[lum]++;
    count++;
  }

  let p1 = 0, p99 = 255;
  let accum = 0;
  const targetP1 = count * 0.015;
  const targetP99 = count * 0.985;

  for (let l = 0; l < 256; l++) {
    accum += luminanceBuckets[l];
    if (accum >= targetP1 && p1 === 0) p1 = l;
    if (accum >= targetP99) {
      p99 = l;
      break;
    }
  }

  const avgLum = count > 0 ? (rSum * 0.299 + gSum * 0.587 + bSum * 0.114) / count : 128;
  const contrastDeficit = Math.max(0, 220 - (p99 - p1));
  const suggestedContrast = Math.round(Math.min(30, contrastDeficit * 0.35));

  let suggestedBrightness = 0;
  if (avgLum < 110) suggestedBrightness = Math.round(Math.min(22, (110 - avgLum) * 0.35));
  else if (avgLum > 165) suggestedBrightness = Math.round(Math.max(-18, (150 - avgLum) * 0.3));

  const avgR = count > 0 ? rSum / count : 128;
  const avgG = count > 0 ? gSum / count : 128;
  const avgB = count > 0 ? bSum / count : 128;
  const avgGray = (avgR + avgG + avgB) / 3;
  let suggestedWb = 0;
  if (avgGray > 0) {
    const tintDiff = (avgB - avgR) / avgGray;
    suggestedWb = Math.round(Math.max(-25, Math.min(25, tintDiff * 50)));
  }

  return {
    brightness: suggestedBrightness,
    contrast: suggestedContrast + 8,
    saturation: 12,
    exposure: avgLum < 85 ? 8 : 0,
    highlights: -10,
    shadows: 16,
    whiteBalance: suggestedWb,
    sharpenAmount: 42,
    denoiseAmount: 12,
  };
}

export function applyToneAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: EnhancerOptions
) {
  const brightness = opts.brightness || 0;
  const contrast = opts.contrast || 0;
  const saturation = opts.saturation || 0;
  const exposure = opts.exposure || 0;
  const highlights = opts.highlights || 0;
  const shadows = opts.shadows || 0;
  const whiteBalance = opts.whiteBalance || 0;

  if (
    brightness === 0 &&
    contrast === 0 &&
    saturation === 0 &&
    exposure === 0 &&
    highlights === 0 &&
    shadows === 0 &&
    whiteBalance === 0
  ) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  const exposureFactor = exposure !== 0 ? Math.pow(2, exposure / 60) : 1;
  const contrastFactor = contrast > 0 ? 1 + contrast / 80 : 1 + contrast / 120;
  const satFactor = saturation > 0 ? 1 + saturation / 80 : 1 + saturation / 100;
  const wbWarm = whiteBalance > 0 ? whiteBalance / 100 : 0;
  const wbCool = whiteBalance < 0 ? -whiteBalance / 100 : 0;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    if (exposure !== 0) {
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;
    }

    if (whiteBalance !== 0) {
      r += wbWarm * 24 - wbCool * 12;
      b += wbCool * 24 - wbWarm * 12;
    }

    if (brightness !== 0) {
      r += brightness * 1.1;
      g += brightness * 1.1;
      b += brightness * 1.1;
    }

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const normLum = lum / 255;

    if (shadows !== 0 && normLum < 0.6) {
      const shadowWeight = Math.max(0, 1 - normLum * 1.8);
      const shift = (shadows / 100) * 45 * shadowWeight;
      r += shift;
      g += shift;
      b += shift;
    }

    if (highlights !== 0 && normLum > 0.4) {
      const highlightWeight = Math.max(0, (normLum - 0.4) * 1.66);
      const shift = (highlights / 100) * 45 * highlightWeight;
      r += shift;
      g += shift;
      b += shift;
    }

    if (contrast !== 0) {
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;
    }

    if (saturation !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    d[i] = Math.min(255, Math.max(0, Math.round(r)));
    d[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    d[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
}

export async function enhanceImageHd(
  source: HTMLImageElement | File,
  options: EnhancerOptions,
  originalFilename = 'enhanced-photo.jpg'
): Promise<ProcessedImageResult> {
  const img = source instanceof HTMLImageElement ? source : await loadImageFromFile(source);

  const factor = options.upscaleFactor || 1;
  const targetW = img.naturalWidth * factor;
  const targetH = img.naturalHeight * factor;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (factor > 1) {
    renderMultiStepUpscale(ctx, img, targetW, targetH);
  } else {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }

  let effectiveOpts = { ...options };
  if (options.autoEnhance) {
    const autoStats = computeAutoEnhanceSettings(ctx, targetW, targetH);
    effectiveOpts = {
      ...autoStats,
      ...options,
      brightness: (options.brightness || 0) + autoStats.brightness,
      contrast: (options.contrast || 0) + autoStats.contrast,
      saturation: (options.saturation || 0) + autoStats.saturation,
      shadows: (options.shadows || 0) + autoStats.shadows,
      highlights: (options.highlights || 0) + autoStats.highlights,
      whiteBalance: (options.whiteBalance || 0) + autoStats.whiteBalance,
      sharpenAmount: options.sharpenAmount || autoStats.sharpenAmount,
      denoiseAmount: options.denoiseAmount !== undefined ? options.denoiseAmount : autoStats.denoiseAmount,
    };
  }

  // Apply Pixel Tonal Adjustments (Brightness, Contrast, Saturation, Exposure, Shadows, Highlights, White Balance)
  applyToneAdjustments(ctx, targetW, targetH, effectiveOpts);

  // Denoise pass (gentle grain suppression)
  if ((effectiveOpts.denoiseAmount ?? 0) > 0) {
    applyGentleDenoise(ctx, targetW, targetH, (effectiveOpts.denoiseAmount ?? 0) / 100);
  }

  // Sharpening pass (Contrast-Adaptive or Unsharp Mask)
  if ((effectiveOpts.sharpenAmount ?? 0) > 0) {
    if (effectiveOpts.contrastAdaptive) {
      applyContrastAdaptiveSharpen(ctx, targetW, targetH, (effectiveOpts.sharpenAmount ?? 0) / 100);
    } else {
      applySharpenConvolution(ctx, targetW, targetH, (effectiveOpts.sharpenAmount ?? 0) / 100);
    }
  }

  const isPng = originalFilename.toLowerCase().endsWith('.png');
  const format = isPng ? 'image/png' : 'image/jpeg';
  const quality = 0.95;
  const blob = await canvasToBlob(canvas, format, quality);
  const dataUrl = canvas.toDataURL(format, quality);

  const base = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || 'photo';
  const ext = isPng ? '.png' : '.jpg';
  const filename = `${base}-HD-${factor}x${ext}`;

  return {
    blob,
    dataUrl,
    width: targetW,
    height: targetH,
    sizeBytes: blob.size,
    sizeKb: parseFloat((blob.size / 1024).toFixed(1)),
    format,
    qualityUsed: 95,
    filename,
    feasibilityNote: factor > 1
      ? `Enhanced with ${factor}× canvas super-sampling, contrast-adaptive sharpening & tone balance.`
      : 'Enhanced with tone balance, edge clarity refinement, and dynamic range preservation.',
  };
}

// -------------------------------------------------------------
// 5. Background Colour Changer (Chroma / Delta-E segmentation)
// -------------------------------------------------------------

export async function changeBackgroundColor(
  source: HTMLImageElement | File,
  options: BackgroundChangeOptions,
  originalFilename = 'photo-bg-changed.jpg'
): Promise<ProcessedImageResult> {
  const img = source instanceof HTMLImageElement ? source : await loadImageFromFile(source);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Determine key color to replace.
  // Sample corners (top-left, top-right, bottom-left) or specified point
  let keyR = 255;
  let keyG = 255;
  let keyB = 255;

  if (options.sampleX !== undefined && options.sampleY !== undefined) {
    const sX = Math.min(w - 1, Math.max(0, Math.floor(options.sampleX * w)));
    const sY = Math.min(h - 1, Math.max(0, Math.floor(options.sampleY * h)));
    const idx = (sY * w + sX) * 4;
    keyR = data[idx];
    keyG = data[idx + 1];
    keyB = data[idx + 2];
  } else {
    // Average top corners (common in passport photos)
    const tlIdx = 0;
    const trIdx = (w - 1) * 4;
    keyR = Math.round((data[tlIdx] + data[trIdx]) / 2);
    keyG = Math.round((data[tlIdx + 1] + data[trIdx + 1]) / 2);
    keyB = Math.round((data[tlIdx + 2] + data[trIdx + 2]) / 2);
  }

  // Parse target color hex
  const targetRgb = hexToRgb(options.targetColor) || { r: 255, g: 255, b: 255 };
  const tolerance = (options.tolerance / 100) * 180; // Distance in RGB cube
  const feather = Math.max(0.1, options.feather || 1.5);

  let pixelsModified = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Euclidean distance in color space
    const dist = Math.sqrt((r - keyR) ** 2 + (g - keyG) ** 2 + (b - keyB) ** 2);

    if (dist <= tolerance) {
      // Direct replacement
      data[i] = targetRgb.r;
      data[i + 1] = targetRgb.g;
      data[i + 2] = targetRgb.b;
      pixelsModified++;
    } else if (dist <= tolerance + feather * 10) {
      // Soft transition feathering
      const alpha = (dist - tolerance) / (feather * 10);
      data[i] = Math.round(targetRgb.r * (1 - alpha) + r * alpha);
      data[i + 1] = Math.round(targetRgb.g * (1 - alpha) + g * alpha);
      data[i + 2] = Math.round(targetRgb.b * (1 - alpha) + b * alpha);
      pixelsModified++;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const format = 'image/jpeg';
  const quality = 0.94;
  const blob = await canvasToBlob(canvas, format, quality);
  const dataUrl = canvas.toDataURL(format, quality);

  const base = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || 'photo';
  const filename = `${base}-bg-replaced.jpg`;

  const modificationRatio = pixelsModified / (w * h);
  const isPhysicallyFeasible = modificationRatio > 0.05;
  const feasibilityNote =
    modificationRatio < 0.05
      ? 'The background appears complex or has high color variation. Adjust tolerance or tap a clear background area to sample.'
      : `Replaced background with ${options.targetColor} (${Math.round(modificationRatio * 100)}% of photo segmented).`;

  return {
    blob,
    dataUrl,
    width: w,
    height: h,
    sizeBytes: blob.size,
    sizeKb: parseFloat((blob.size / 1024).toFixed(1)),
    format,
    qualityUsed: 94,
    filename,
    isPhysicallyFeasible,
    feasibilityNote,
  };
}

// -------------------------------------------------------------
// Helper Algorithms & Convolutions
// -------------------------------------------------------------

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        resolve(b || new Blob([], { type: format }));
      },
      format,
      quality
    );
  });
}

function applySharpenConvolution(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  // 3x3 Laplacian sharpening kernel
  // [ 0, -s,  0 ]
  // [-s, 1+4s, -s ]
  // [ 0, -s,  0 ]
  const s = strength * 0.8;
  const center = 1 + 4 * s;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const up = ((y - 1) * width + x) * 4;
      const down = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          src[idx + c] * center -
          (src[up + c] + src[down + c] + src[left + c] + src[right + c]) * s;
        dst[idx + c] = Math.min(255, Math.max(0, val));
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
}

function applyContrastAdaptiveSharpen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  // CAS: Limits sharpening in low-contrast regions to prevent noise/halos
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const up = ((y - 1) * width + x) * 4;
      const down = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const cVal = src[idx + c];
        const uVal = src[up + c];
        const dVal = src[down + c];
        const lVal = src[left + c];
        const rVal = src[right + c];

        const minNeighbor = Math.min(cVal, uVal, dVal, lVal, rVal);
        const maxNeighbor = Math.max(cVal, uVal, dVal, lVal, rVal);
        const localRange = maxNeighbor - minNeighbor;

        // Weight decreases in uniform areas (noise damping)
        const weight = Math.min(0.6, (localRange / 255) * strength);
        const sharpened = cVal * (1 + 4 * weight) - (uVal + dVal + lVal + rVal) * weight;

        dst[idx + c] = Math.min(255, Math.max(0, sharpened));
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
}

function applyGentleDenoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  const blend = Math.min(0.6, strength * 0.5);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        // Average 3x3
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += src[((y + dy) * width + (x + dx)) * 4 + c];
          }
        }
        const avg = sum / 9;
        dst[idx + c] = Math.round(src[idx + c] * (1 - blend) + avg * blend);
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
}

function renderMultiStepUpscale(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number
) {
  // Stepped upscaling (1.5x steps) produces far crisper output than single-step canvas stretch
  let curW = img.naturalWidth;
  let curH = img.naturalHeight;

  let tempCanvas = document.createElement('canvas');
  tempCanvas.width = curW;
  tempCanvas.height = curH;
  let tCtx = tempCanvas.getContext('2d');
  if (!tCtx) {
    ctx.drawImage(img, 0, 0, targetW, targetH);
    return;
  }
  tCtx.drawImage(img, 0, 0);

  while (curW * 1.5 < targetW && curH * 1.5 < targetH) {
    const nextW = Math.round(curW * 1.5);
    const nextH = Math.round(curH * 1.5);
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const sCtx = stepCanvas.getContext('2d');
    if (sCtx) {
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(tempCanvas, 0, 0, nextW, nextH);
      tempCanvas = stepCanvas;
      curW = nextW;
      curH = nextH;
    } else {
      break;
    }
  }

  ctx.drawImage(tempCanvas, 0, 0, targetW, targetH);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Injects JFIF density segment into JPEG ArrayBuffer (e.g. 300 DPI)
 */
async function injectJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);

  // Check JPEG SOI marker (0xFFD8)
  if (view.getUint16(0) !== 0xffd8) return blob;

  // Search for JFIF APP0 (0xFFE0)
  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xffe0) {
      // Found APP0 marker. Check "JFIF\0"
      const length = view.getUint16(offset + 2);
      if (
        view.getUint8(offset + 4) === 0x4a && // 'J'
        view.getUint8(offset + 5) === 0x46 && // 'F'
        view.getUint8(offset + 6) === 0x49 && // 'I'
        view.getUint8(offset + 7) === 0x46 && // 'F'
        view.getUint8(offset + 8) === 0x00
      ) {
        // Density units (1 = dots per inch) at offset + 11
        const u8 = new Uint8Array(buffer);
        u8[offset + 11] = 1; // 1 = dots per inch (DPI)
        view.setUint16(offset + 12, dpi, false); // Xdensity
        view.setUint16(offset + 14, dpi, false); // Ydensity
        return new Blob([buffer], { type: 'image/jpeg' });
      }
      offset += 2 + length;
    } else if ((marker & 0xff00) === 0xff00) {
      const length = view.getUint16(offset + 2);
      offset += 2 + length;
    } else {
      break;
    }
  }

  return blob;
}
