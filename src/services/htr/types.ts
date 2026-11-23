export type HtrLanguageMode = 'hin+eng' | 'eng' | 'hin';
export type HandwritingStyleMode = 'auto' | 'normal' | 'running';
export type EnhancementPresetId = 'original' | 'balanced' | 'faded' | 'high-contrast-bw';

export interface ImageEnhancementSettings {
  enabled: boolean;
  preset: EnhancementPresetId;
  rotation: 0 | 90 | 180 | 270;
  deskewDeg: number; // -10 to +10 degrees
  contrast: number; // -40 to +100
  brightness: number; // -40 to +40
  shadowRemoval: number; // 0 to 100
  faintInkBoost: number; // 0 to 100
  noiseReduction: boolean;
  grayscale: boolean;
  binarize: boolean;
  threshold: number; // 80 to 230
}

export const DEFAULT_ENHANCEMENT_SETTINGS: ImageEnhancementSettings = {
  enabled: false,
  preset: 'original',
  rotation: 0,
  deskewDeg: 0,
  contrast: 0,
  brightness: 0,
  shadowRemoval: 0,
  faintInkBoost: 0,
  noiseReduction: false,
  grayscale: false,
  binarize: false,
  threshold: 165,
};

export const ENHANCEMENT_PRESETS: Record<
  EnhancementPresetId,
  {
    label: string;
    shortDesc: string;
    settings: Omit<ImageEnhancementSettings, 'rotation' | 'deskewDeg'>;
  }
> = {
  original: {
    label: 'Original',
    shortDesc: 'Keep original scanned image unmodified',
    settings: {
      enabled: false,
      preset: 'original',
      contrast: 0,
      brightness: 0,
      shadowRemoval: 0,
      faintInkBoost: 0,
      noiseReduction: false,
      grayscale: false,
      binarize: false,
      threshold: 165,
    },
  },
  balanced: {
    label: 'Office Note Balanced',
    shortDesc: 'Gentle shadow cleanup & ink clarity without erasing thin strokes',
    settings: {
      enabled: true,
      preset: 'balanced',
      contrast: 18,
      brightness: 4,
      shadowRemoval: 45,
      faintInkBoost: 28,
      noiseReduction: false,
      grayscale: true,
      binarize: false,
      threshold: 165,
    },
  },
  faded: {
    label: 'Faded Old Record',
    shortDesc: 'Stronger background cleanup + faint ink recovery for aged paper',
    settings: {
      enabled: true,
      preset: 'faded',
      contrast: 34,
      brightness: 8,
      shadowRemoval: 78,
      faintInkBoost: 62,
      noiseReduction: true,
      grayscale: true,
      binarize: false,
      threshold: 170,
    },
  },
  'high-contrast-bw': {
    label: 'High-Contrast B&W',
    shortDesc: 'Clean black-and-white threshold for dark stamps & clear ink',
    settings: {
      enabled: true,
      preset: 'high-contrast-bw',
      contrast: 26,
      brightness: 6,
      shadowRemoval: 70,
      faintInkBoost: 35,
      noiseReduction: true,
      grayscale: true,
      binarize: true,
      threshold: 172,
    },
  },
};

export interface PixelBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface NormalizedBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface DetectedTextLine {
  id: string;
  lineIndex: number;
  pixelBox: PixelBox;
  normalizedBox: NormalizedBox;
  paragraphBreakAfter: boolean;
}

export interface HtrLineResult {
  id: string;
  lineIndex: number;
  text: string;
  pixelBox: PixelBox;
  normalizedBox: NormalizedBox;
  paragraphBreakAfter: boolean;
  script: 'eng' | 'hin' | 'mixed';
  /** Populated ONLY when the model emits a genuine calibrated score; never fabricated. */
  confidence?: number;
}

export type PageRecognitionStatus =
  | 'idle'
  | 'enhancing'
  | 'segmenting'
  | 'recognizing'
  | 'done'
  | 'error'
  | 'cancelled';

export interface DigitizerSourceFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'pdf' | 'image';
  pageCount: number;
}

export interface DigitizerPageItem {
  id: string;
  pageNumber: number; // 1-based across the whole uploaded batch
  sourceFileId: string;
  sourceFileName: string;
  sourceType: 'pdf' | 'image';
  pdfPageIndex?: number; // 1-based page index inside its PDF file
  width: number;
  height: number;
  thumbnailUrl: string;
  enhancement: ImageEnhancementSettings;
  useEnhancedForRecognition: boolean;
  status: PageRecognitionStatus;
  progressPercent: number;
  statusMessage?: string;
  detectedLines: DetectedTextLine[];
  recognizedLines: HtrLineResult[];
  recognizedText: string;
  editedText: string;
  modelUsed?: string;
  processingMs?: number;
  error?: string;
}

export interface ModelLoadProgress {
  phase: 'checking' | 'downloading' | 'initializing' | 'ready';
  modelId: string;
  fileName?: string;
  loadedBytes?: number;
  totalBytes?: number;
  percent: number;
  detail: string;
}

export interface HtrEngineCapabilities {
  id: string;
  label: string;
  modelId: string;
  supportedLanguages: HtrLanguageMode[];
  isExperimental: boolean;
  estimatedDownloadMB: number;
  supportsHandwriting: boolean;
  note: string;
}
