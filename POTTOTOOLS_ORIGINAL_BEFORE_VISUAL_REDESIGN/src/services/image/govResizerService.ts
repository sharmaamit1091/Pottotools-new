import { loadImageElement } from './imageConverterService';

export interface GovPreset {
  id: string;
  name: string;
  category: 'photo' | 'signature' | 'document';
  targetWidth: number;
  targetHeight: number;
  minKb?: number;
  maxKb: number;
  format: 'image/jpeg' | 'image/png';
  description: string;
  verifiedAuthority: string;
}

export const GOV_PRESETS: GovPreset[] = [
  {
    id: 'upsc-photo',
    name: 'UPSC / SSC / Civil Services Photo',
    category: 'photo',
    targetWidth: 200,
    targetHeight: 230,
    minKb: 20,
    maxKb: 50,
    format: 'image/jpeg',
    description: 'Standard 200x230 px passport photo between 20 KB and 50 KB.',
    verifiedAuthority: 'Staff Selection Commission & UPSC Guidelines (Verified Oct 2026)',
  },
  {
    id: 'upsc-sign',
    name: 'UPSC / SSC / Civil Services Signature',
    category: 'signature',
    targetWidth: 140,
    targetHeight: 60,
    minKb: 10,
    maxKb: 20,
    format: 'image/jpeg',
    description: 'Standard 140x60 px signature between 10 KB and 20 KB.',
    verifiedAuthority: 'SSC & State PSC Guidelines (Verified Oct 2026)',
  },
  {
    id: 'ibps-bank-photo',
    name: 'IBPS / SBI Bank PO & Clerk Photo',
    category: 'photo',
    targetWidth: 200,
    targetHeight: 230,
    minKb: 20,
    maxKb: 50,
    format: 'image/jpeg',
    description: 'Bank recruitment standard 200x230 px photo, 20 KB to 50 KB.',
    verifiedAuthority: 'IBPS Common Recruitment Guidelines (Verified Oct 2026)',
  },
  {
    id: 'ibps-bank-sign',
    name: 'IBPS / SBI Bank PO Signature',
    category: 'signature',
    targetWidth: 140,
    targetHeight: 60,
    minKb: 10,
    maxKb: 20,
    format: 'image/jpeg',
    description: 'Signature in black/blue ink on white background, 10 KB to 20 KB.',
    verifiedAuthority: 'IBPS Guidelines (Verified Oct 2026)',
  },
  {
    id: 'passport-standard-3545',
    name: 'Standard Passport Photo (3.5cm x 4.5cm)',
    category: 'photo',
    targetWidth: 413,
    targetHeight: 531,
    minKb: 50,
    maxKb: 200,
    format: 'image/jpeg',
    description: '35x45mm at 300 DPI (413x531 px), white background.',
    verifiedAuthority: 'ICAO International Passport Specification (Doc 9303)',
  },
  {
    id: 'us-passport-2x2',
    name: 'US Visa & Passport Photo (2x2 inch)',
    category: 'photo',
    targetWidth: 600,
    targetHeight: 600,
    minKb: 50,
    maxKb: 240,
    format: 'image/jpeg',
    description: 'Square 600x600 px photo on plain white or off-white background.',
    verifiedAuthority: 'US Department of State Consular Affairs',
  },
  {
    id: 'custom-photo',
    name: 'Custom Target Size & Dimensions',
    category: 'photo',
    targetWidth: 300,
    targetHeight: 300,
    minKb: 10,
    maxKb: 100,
    format: 'image/jpeg',
    description: 'Specify your own custom width, height, and target KB limit.',
    verifiedAuthority: 'User Defined Configuration',
  },
];

export interface GovResizeResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeKb: number;
  achievedTarget: boolean;
  qualityUsed: number;
  attempts: number;
  filename: string;
}

/**
 * Resize and iteratively compress an image to meet strict target KB bounds and exact dimensions
 */
export async function resizeGovImage(
  file: File,
  options: {
    targetWidth: number;
    targetHeight: number;
    maxKb: number;
    minKb?: number;
    format?: 'image/jpeg' | 'image/png';
    backgroundColor?: string;
  }
): Promise<GovResizeResult> {
  const img = await loadImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = options.targetWidth;
  canvas.height = options.targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // Solid background fill (white is required by virtually all application portals)
  ctx.fillStyle = options.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Compute best aspect fit / center inside target box
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const targetAspect = options.targetWidth / options.targetHeight;
  let renderWidth = options.targetWidth;
  let renderHeight = options.targetHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (Math.abs(imgAspect - targetAspect) > 0.05) {
    // If aspect ratios differ, center it cleanly
    if (imgAspect > targetAspect) {
      renderHeight = options.targetWidth / imgAspect;
      offsetY = (options.targetHeight - renderHeight) / 2;
    } else {
      renderWidth = options.targetHeight * imgAspect;
      offsetX = (options.targetWidth - renderWidth) / 2;
    }
  }

  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

  const format = options.format || 'image/jpeg';
  const targetMaxBytes = options.maxKb * 1024;
  const targetMinBytes = (options.minKb || 0) * 1024;

  let bestBlob: Blob | null = null;
  let bestQuality = 0.85;
  let attempts = 0;

  // Binary search for optimal JPEG quality to land within [targetMinBytes, targetMaxBytes]
  let low = 0.05;
  let high = 0.98;

  for (let i = 0; i < 8; i++) {
    attempts++;
    const testQuality = (low + high) / 2;
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, testQuality);
    });

    bestBlob = blob;
    bestQuality = testQuality;

    if (blob.size <= targetMaxBytes && blob.size >= targetMinBytes) {
      // Perfect match inside the target window!
      break;
    } else if (blob.size > targetMaxBytes) {
      high = testQuality - 0.05;
    } else {
      low = testQuality + 0.05;
    }
    if (high <= low) break;
  }

  if (!bestBlob) {
    bestBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, 0.7);
    });
  }

  const finalDataUrl = canvas.toDataURL(format, bestQuality);
  const sizeBytes = bestBlob.size;
  const sizeKb = parseFloat((sizeBytes / 1024).toFixed(1));
  const achievedTarget = sizeBytes <= targetMaxBytes && (options.minKb ? sizeBytes >= targetMinBytes : true);

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
  const ext = format === 'image/jpeg' ? '.jpg' : '.png';
  const filename = `${baseName}-${options.targetWidth}x${options.targetHeight}${ext}`;

  return {
    blob: bestBlob,
    dataUrl: finalDataUrl,
    width: options.targetWidth,
    height: options.targetHeight,
    sizeBytes,
    sizeKb,
    achievedTarget,
    qualityUsed: Math.round(bestQuality * 100),
    attempts,
    filename,
  };
}

/**
 * Crop passport photo with custom bounding box
 */
export async function cropPassportPhoto(
  file: File,
  cropArea: { x: number; y: number; width: number; height: number },
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  const img = await loadImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context not available.');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Cropping failed'))), 'image/jpeg', 0.92);
  });
}
