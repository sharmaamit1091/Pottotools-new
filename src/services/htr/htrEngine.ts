import {
  DetectedTextLine,
  HandwritingStyleMode,
  HtrEngineCapabilities,
  HtrLanguageMode,
  HtrLineResult,
  ModelLoadProgress,
} from './types';
import {
  SegmentedLineCrop,
  cropLineBlobsFromCanvas,
  cropSingleLineFromCanvas,
  detectHandwrittenLines,
  detectSidewaysOrientation,
} from './lineSegmenter';
import {
  detectLineScript,
  shouldRouteLineToEnglishHtr,
} from './devanagariCharset';

export const ENGLISH_HTR_ADAPTER_INFO: HtrEngineCapabilities = {
  id: 'en-ppocrv5-mobile',
  label: 'English Handwriting Recognizer',
  modelId: 'PaddlePaddle/en_PP-OCRv5_mobile_rec_onnx',
  supportedLanguages: ['eng'],
  isExperimental: false,
  estimatedDownloadMB: 8,
  supportsHandwriting: true,
  note: 'Compact local English handwriting & printed text recognizer (~7.8 MB), cached in your browser for offline use.',
};

export const HINDI_HTR_ADAPTER_INFO: HtrEngineCapabilities = {
  id: 'devanagari-ppocrv5-beta',
  label: 'Hindi & Devanagari Recognizer (Beta)',
  modelId: 'PaddlePaddle/devanagari_PP-OCRv5_mobile_rec_onnx',
  supportedLanguages: ['hin', 'hin+eng'],
  isExperimental: true,
  estimatedDownloadMB: 8,
  supportsHandwriting: true,
  note: 'Compact local Devanagari & bilingual recognizer (~7.6 MB), cached in your browser for offline use.',
};

export function getActiveAdapterSummary(languageMode: HtrLanguageMode): {
  label: string;
  estimatedDownloadText: string;
  isBeta: boolean;
} {
  if (languageMode === 'eng') {
    return {
      label: ENGLISH_HTR_ADAPTER_INFO.label,
      estimatedDownloadText: `~${ENGLISH_HTR_ADAPTER_INFO.estimatedDownloadMB} MB (English)`,
      isBeta: false,
    };
  }
  if (languageMode === 'hin') {
    return {
      label: HINDI_HTR_ADAPTER_INFO.label,
      estimatedDownloadText: `~${HINDI_HTR_ADAPTER_INFO.estimatedDownloadMB} MB (Hindi)`,
      isBeta: true,
    };
  }
  return {
    label: 'Hindi + English Bilingual Recognizer',
    estimatedDownloadText: `~${HINDI_HTR_ADAPTER_INFO.estimatedDownloadMB}–${
      HINDI_HTR_ADAPTER_INFO.estimatedDownloadMB + ENGLISH_HTR_ADAPTER_INFO.estimatedDownloadMB
    } MB`,
    isBeta: true,
  };
}

export interface DeviceCompatibilityInfo {
  supported: boolean;
  isLowMemoryDevice: boolean;
  hasWebGpu: boolean;
  deviceMemoryGB?: number;
  warning?: string;
}

export function checkBrowserHtrCompatibility(): DeviceCompatibilityInfo {
  if (typeof window === 'undefined') {
    return { supported: false, isLowMemoryDevice: false, hasWebGpu: false };
  }

  const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  const hasWorker = typeof Worker !== 'undefined';
  const hasWebGpu = typeof (navigator as any).gpu !== 'undefined';
  const memGB: number | undefined = (navigator as any).deviceMemory;
  const isLowMemoryDevice = typeof memGB === 'number' && memGB < 4;

  if (!hasWasm || !hasWorker) {
    return {
      supported: false,
      isLowMemoryDevice,
      hasWebGpu,
      deviceMemoryGB: memGB,
      warning:
        'Your browser does not support offline document processing. Please use a modern browser like Chrome, Edge, Safari, or Firefox.',
    };
  }

  if (isLowMemoryDevice) {
    return {
      supported: true,
      isLowMemoryDevice: true,
      hasWebGpu,
      deviceMemoryGB: memGB,
      warning: `This device has limited memory (${memGB} GB RAM). For smooth performance, convert one page at a time.`,
    };
  }

  return {
    supported: true,
    isLowMemoryDevice: false,
    hasWebGpu,
    deviceMemoryGB: memGB,
  };
}

export interface RecognizePageCallbacks {
  onModelProgress?: (progress: ModelLoadProgress) => void;
  onStageChange?: (stage: 'segmenting' | 'recognizing', detail: string, percent: number) => void;
  onLinesDetected?: (lines: DetectedTextLine[]) => void;
}

export interface RecognizePageOutput {
  lines: HtrLineResult[];
  text: string;
  modelUsed: string;
  processingMs: number;
  /** Additional clockwise rotation applied automatically when input photo was sideways or upside-down. */
  appliedRotationDelta?: 0 | 90 | 180 | 270;
}

interface WorkerLineResult {
  id: string;
  lineIndex: number;
  text: string;
  confidence?: number;
}

const READABLE_CHAR_RE = /[A-Za-z0-9\u0900-\u097F]/g;

function countReadableChars(text: string): number {
  const m = text.match(READABLE_CHAR_RE);
  return m ? m.length : 0;
}

function scoreLineQuality(text: string, confidence: number | undefined): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const nonSpace = trimmed.replace(/\s+/g, '');
  const readable = countReadableChars(nonSpace);
  const ratio = readable / Math.max(1, nonSpace.length);
  const conf = typeof confidence === 'number' ? confidence : 0.45;
  return conf * (0.45 + 0.55 * ratio);
}

function evaluateOrientationResults(results: WorkerLineResult[]): {
  score: number;
  avgConf: number;
  avgReadablePerLine: number;
} {
  if (results.length === 0) {
    return { score: 0, avgConf: 0, avgReadablePerLine: 0 };
  }

  let readableSum = 0;
  let totalChars = 0;
  let confSum = 0;
  let confCount = 0;

  for (const r of results) {
    const nonSpace = (r.text || '').replace(/\s+/g, '');
    readableSum += countReadableChars(nonSpace);
    totalChars += nonSpace.length;
    if (nonSpace.length > 0) {
      confSum += typeof r.confidence === 'number' ? r.confidence : 0.35;
      confCount++;
    }
  }

  const avgConf = confCount > 0 ? confSum / confCount : 0;
  const alnumRatio = totalChars > 0 ? readableSum / totalChars : 0;
  const avgReadablePerLine = readableSum / results.length;
  const coverage = Math.min(1, avgReadablePerLine / 4.0);
  const score = avgConf * (0.4 + 0.6 * alnumRatio) * (0.35 + 0.65 * coverage);

  return { score, avgConf, avgReadablePerLine };
}

function rotateCanvas90(
  source: HTMLCanvasElement,
  deg: 0 | 90 | 180 | 270
): HTMLCanvasElement {
  const swap = deg === 90 || deg === 270;
  const out = document.createElement('canvas');
  out.width = swap ? source.height : source.width;
  out.height = swap ? source.width : source.height;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.save();
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);
    ctx.restore();
  }
  return out;
}

/**
 * Picks up to 3 wide, informative lines for fast orientation verification (<150ms).
 */
function pickProbeLines(lines: DetectedTextLine[], maxCount = 3): DetectedTextLine[] {
  if (lines.length <= maxCount) return lines;
  return [...lines]
    .sort((a, b) => {
      const aw = a.pixelBox.x1 - a.pixelBox.x0;
      const bw = b.pixelBox.x1 - b.pixelBox.x0;
      return bw - aw;
    })
    .slice(0, maxCount)
    .sort((a, b) => a.lineIndex - b.lineIndex);
}

/**
 * Reconstructs clean multi-paragraph text from recognized lines while honoring
 * detected paragraph spacing.
 */
export function reconstructTextFromLines(lines: HtrLineResult[]): string {
  if (lines.length === 0) return '';
  let out = '';
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i].text.trim();
    if (!lineText) continue;
    if (out.length > 0) {
      const prev = lines[i - 1];
      out += prev?.paragraphBreakAfter ? '\n\n' : '\n';
    }
    out += lineText;
  }
  return out.trim();
}

/**
 * Modular Local HTR Engine Manager.
 * Runs 100% inside dedicated background Web Workers so the UI stays responsive,
 * supports instant cancellation, automatically corrects sideways/upside-down photos,
 * and guarantees zero document pixels or text leave the device.
 */
class LocalHtrEngineManager {
  private englishWorker: Worker | null = null;
  private devanagariWorker: Worker | null = null;
  private activeWorker: Worker | null = null;
  private activeJobId: string | null = null;
  private activeReject: ((err: Error) => void) | null = null;
  private cancelFlag = false;

  private ensureEnglishWorker(): Worker {
    if (!this.englishWorker) {
      this.englishWorker = new Worker(new URL('./englishHtrWorker.ts', import.meta.url), {
        type: 'module',
      });
    }
    return this.englishWorker;
  }

  private ensureDevanagariWorker(): Worker {
    if (!this.devanagariWorker) {
      this.devanagariWorker = new Worker(new URL('./devanagariHtrWorker.ts', import.meta.url), {
        type: 'module',
      });
    }
    return this.devanagariWorker;
  }

  public cancelActiveJob(): void {
    this.cancelFlag = true;
    if (this.activeJobId && this.activeWorker) {
      this.activeWorker.postMessage({ type: 'cancel', jobId: this.activeJobId });
    }
    if (this.activeReject) {
      const rej = this.activeReject;
      this.activeReject = null;
      this.activeJobId = null;
      this.activeWorker = null;
      rej(new Error('PROCESSING_CANCELLED'));
    }
  }

  public dispose(): void {
    this.cancelActiveJob();
    if (this.englishWorker) {
      this.englishWorker.terminate();
      this.englishWorker = null;
    }
    if (this.devanagariWorker) {
      this.devanagariWorker.terminate();
      this.devanagariWorker = null;
    }
  }

  private runWorkerJob(
    worker: Worker,
    crops: SegmentedLineCrop[],
    includeResized48: boolean,
    progressStart: number,
    progressEnd: number,
    callbacks: RecognizePageCallbacks,
    silentProgress = false
  ): Promise<WorkerLineResult[]> {
    const jobId = `htr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.activeJobId = jobId;
    this.activeWorker = worker;

    return new Promise<WorkerLineResult[]>((resolve, reject) => {
      if (this.cancelFlag) {
        reject(new Error('PROCESSING_CANCELLED'));
        return;
      }

      this.activeReject = reject;

      const handleMessage = (event: MessageEvent<any>) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'model-progress') {
          callbacks.onModelProgress?.({
            phase: msg.phase,
            modelId: msg.modelId,
            fileName: msg.fileName,
            loadedBytes: msg.loadedBytes,
            totalBytes: msg.totalBytes,
            percent: msg.percent ?? 0,
            detail: msg.detail || 'Preparing handwriting recognition...',
          });
          return;
        }

        if (msg.jobId && msg.jobId !== jobId) return;

        if (msg.type === 'line-progress') {
          if (!silentProgress) {
            const span = Math.max(1, progressEnd - progressStart);
            const overallPct = Math.min(
              99,
              Math.round(progressStart + ((msg.percent || 0) / 100) * span)
            );
            callbacks.onStageChange?.('recognizing', msg.detail, overallPct);
          }
          return;
        }

        if (msg.type === 'cancelled') {
          cleanup();
          reject(new Error('PROCESSING_CANCELLED'));
          return;
        }

        if (msg.type === 'error') {
          cleanup();
          reject(new Error(msg.error || 'Handwriting recognition could not be completed.'));
          return;
        }

        if (msg.type === 'recognize-done') {
          cleanup();
          resolve(msg.results || []);
        }
      };

      const handleError = (errEvent: ErrorEvent) => {
        cleanup();
        reject(new Error(errEvent.message || 'Background recognition worker encountered an error.'));
      };

      const cleanup = () => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        if (this.activeJobId === jobId) {
          this.activeJobId = null;
          this.activeReject = null;
          this.activeWorker = null;
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      worker.postMessage({
        type: 'recognize-lines',
        jobId,
        lines: crops.map((c) => ({
          id: c.line.id,
          lineIndex: c.line.lineIndex,
          blob: c.blob,
          ...(includeResized48 && c.resized48 ? { resized48: c.resized48 } : {}),
          ...(c.chunks && c.chunks.length > 1
            ? {
                chunks: c.chunks.map((ch) => ({
                  blob: ch.blob,
                  ...(includeResized48 && ch.resized48 ? { resized48: ch.resized48 } : {}),
                })),
              }
            : {}),
        })),
      });
    });
  }

  private async probeRotatedOrientation(
    sourceCanvas: HTMLCanvasElement,
    deg: 90 | 180 | 270,
    worker: Worker,
    callbacks: RecognizePageCallbacks
  ): Promise<{
    deg: 90 | 180 | 270;
    score: number;
    avgConf: number;
    avgReadablePerLine: number;
    lineCount: number;
  }> {
    const rotated = rotateCanvas90(sourceCanvas, deg);
    try {
      const lines = detectHandwrittenLines(rotated);
      if (lines.length === 0) {
        return { deg, score: 0, avgConf: 0, avgReadablePerLine: 0, lineCount: 0 };
      }
      const probeLines = pickProbeLines(lines, 3);
      const probeCrops = await cropLineBlobsFromCanvas(rotated, probeLines);
      if (this.cancelFlag) {
        throw new Error('PROCESSING_CANCELLED');
      }
      const results = await this.runWorkerJob(worker, probeCrops, true, 0, 0, callbacks, true);
      const metrics = evaluateOrientationResults(results);
      return {
        deg,
        ...metrics,
        lineCount: lines.length,
      };
    } finally {
      rotated.width = 0;
      rotated.height = 0;
    }
  }

  /**
   * Recognizes a single line using the explicitly chosen local script adapter ('hin' or 'eng').
   */
  public async recognizeSingleLine(
    pageCanvas: HTMLCanvasElement,
    line: DetectedTextLine,
    targetScript: 'hin' | 'eng',
    callbacks: RecognizePageCallbacks = {}
  ): Promise<HtrLineResult> {
    this.cancelFlag = false;
    const crop = await cropSingleLineFromCanvas(pageCanvas, line);

    if (targetScript === 'eng') {
      const results = await this.runWorkerJob(
        this.ensureEnglishWorker(),
        [crop],
        true,
        10,
        98,
        callbacks
      );
      const r = results[0];
      return {
        id: line.id,
        lineIndex: line.lineIndex,
        text: r?.text || '',
        pixelBox: line.pixelBox,
        normalizedBox: line.normalizedBox,
        paragraphBreakAfter: line.paragraphBreakAfter,
        script: 'eng',
        confidence: r?.confidence,
      };
    }

    const results = await this.runWorkerJob(
      this.ensureDevanagariWorker(),
      [crop],
      true,
      10,
      98,
      callbacks
    );
    const r = results[0];
    const text = r?.text || '';
    return {
      id: line.id,
      lineIndex: line.lineIndex,
      text,
      pixelBox: line.pixelBox,
      normalizedBox: line.normalizedBox,
      paragraphBreakAfter: line.paragraphBreakAfter,
      script: detectLineScript(text),
      confidence: r?.confidence,
    };
  }

  public async recognizePageCanvas(
    pageCanvas: HTMLCanvasElement,
    languageMode: HtrLanguageMode,
    handwritingStyle: HandwritingStyleMode = 'auto',
    callbacks: RecognizePageCallbacks = {}
  ): Promise<RecognizePageOutput> {
    this.cancelFlag = false;
    const startTime = performance.now();

    const primaryWorker =
      languageMode === 'eng' ? this.ensureEnglishWorker() : this.ensureDevanagariWorker();

    callbacks.onStageChange?.('segmenting', 'Checking page layout...', 8);
    await new Promise((r) => window.setTimeout(r, 15));

    let workingCanvas: HTMLCanvasElement = pageCanvas;
    let ownsWorkingCanvas = false;
    let appliedRotationDelta: 0 | 90 | 180 | 270 = 0;

    try {
      // Fast pre-check for sideways photos (e.g., WhatsApp / camera notes saved rotated 90° without EXIF)
      const sidewaysCheck = detectSidewaysOrientation(pageCanvas);
      if (sidewaysCheck.isLikelySideways) {
        callbacks.onStageChange?.('segmenting', 'Checking page orientation...', 12);
        const probe270 = await this.probeRotatedOrientation(
          pageCanvas,
          270,
          primaryWorker,
          callbacks
        );
        const probe90 = await this.probeRotatedOrientation(
          pageCanvas,
          90,
          primaryWorker,
          callbacks
        );
        const bestSideways = probe270.score >= probe90.score ? probe270 : probe90;
        if (bestSideways.score >= 0.3) {
          workingCanvas = rotateCanvas90(pageCanvas, bestSideways.deg);
          ownsWorkingCanvas = true;
          appliedRotationDelta = bestSideways.deg;
        }
      }

      let detectedLines = detectHandwrittenLines(workingCanvas);
      callbacks.onLinesDetected?.(detectedLines);

      if (detectedLines.length === 0) {
        return {
          lines: [],
          text: '',
          modelUsed:
            languageMode === 'eng'
              ? ENGLISH_HTR_ADAPTER_INFO.modelId
              : HINDI_HTR_ADAPTER_INFO.modelId,
          processingMs: Math.round(performance.now() - startTime),
          appliedRotationDelta,
        };
      }

      callbacks.onStageChange?.(
        'segmenting',
        `Found ${detectedLines.length} text line${detectedLines.length === 1 ? '' : 's'}...`,
        16
      );

      let crops = await cropLineBlobsFromCanvas(workingCanvas, detectedLines);
      if (this.cancelFlag) {
        throw new Error('PROCESSING_CANCELLED');
      }

      // Run primary pass
      let primaryResults = await this.runWorkerJob(
        primaryWorker,
        crops,
        true,
        18,
        languageMode === 'hin+eng' ? 56 : 95,
        callbacks
      );

      if (this.cancelFlag) {
        throw new Error('PROCESSING_CANCELLED');
      }

      // Safety fallback: if 0° produced weak recognition (e.g., upside-down 180° or subtle sideways),
      // probe alternate 90°/180°/270° orientations and switch automatically if one is clearly readable.
      if (appliedRotationDelta === 0) {
        const baseEval = evaluateOrientationResults(primaryResults);
        if (baseEval.avgConf < 0.68 || baseEval.avgReadablePerLine < 2.2) {
          const candidates: Array<90 | 180 | 270> = [180, 270, 90];
          let bestAlt: { deg: 90 | 180 | 270; score: number; avgConf: number } | null = null;
          for (const deg of candidates) {
            if (this.cancelFlag) throw new Error('PROCESSING_CANCELLED');
            const probe = await this.probeRotatedOrientation(
              pageCanvas,
              deg,
              primaryWorker,
              callbacks
            );
            if (!bestAlt || probe.score > bestAlt.score) {
              bestAlt = probe;
            }
          }

          if (
            bestAlt &&
            bestAlt.score > baseEval.score + 0.14 &&
            bestAlt.avgConf >= 0.7
          ) {
            workingCanvas = rotateCanvas90(pageCanvas, bestAlt.deg);
            ownsWorkingCanvas = true;
            appliedRotationDelta = bestAlt.deg;
            detectedLines = detectHandwrittenLines(workingCanvas);
            callbacks.onLinesDetected?.(detectedLines);
            crops = await cropLineBlobsFromCanvas(workingCanvas, detectedLines);
            primaryResults = await this.runWorkerJob(
              primaryWorker,
              crops,
              true,
              40,
              languageMode === 'hin+eng' ? 68 : 96,
              callbacks
            );
          }
        }
      }

      // Mode 1: Pure English
      if (languageMode === 'eng') {
        const resMap = new Map(primaryResults.map((r) => [r.id, r]));
        const mergedLines: HtrLineResult[] = detectedLines.map((line) => {
          const r = resMap.get(line.id);
          return {
            id: line.id,
            lineIndex: line.lineIndex,
            text: r?.text || '',
            pixelBox: line.pixelBox,
            normalizedBox: line.normalizedBox,
            paragraphBreakAfter: line.paragraphBreakAfter,
            script: 'eng',
            confidence: r?.confidence,
          };
        });

        return {
          lines: mergedLines,
          text: reconstructTextFromLines(mergedLines),
          modelUsed: ENGLISH_HTR_ADAPTER_INFO.modelId,
          processingMs: Math.round(performance.now() - startTime),
          appliedRotationDelta,
        };
      }

      // Mode 2: Dedicated Hindi / Devanagari
      if (languageMode === 'hin') {
        const resMap = new Map(primaryResults.map((r) => [r.id, r]));
        const mergedLines: HtrLineResult[] = detectedLines.map((line) => {
          const r = resMap.get(line.id);
          const text = r?.text || '';
          return {
            id: line.id,
            lineIndex: line.lineIndex,
            text,
            pixelBox: line.pixelBox,
            normalizedBox: line.normalizedBox,
            paragraphBreakAfter: line.paragraphBreakAfter,
            script: detectLineScript(text),
            confidence: r?.confidence,
          };
        });

        return {
          lines: mergedLines,
          text: reconstructTextFromLines(mergedLines),
          modelUsed: HINDI_HTR_ADAPTER_INFO.modelId,
          processingMs: Math.round(performance.now() - startTime),
          appliedRotationDelta,
        };
      }

      // Mode 3: Smart Bilingual Hindi + English Fusion (100% Local)
      const devMap = new Map(primaryResults.map((r) => [r.id, r]));

      const englishCropsToRoute: SegmentedLineCrop[] = [];
      for (const crop of crops) {
        const r = devMap.get(crop.line.id);
        if (shouldRouteLineToEnglishHtr(r?.text || '', r?.confidence, handwritingStyle)) {
          englishCropsToRoute.push(crop);
        }
      }

      const engMap = new Map<string, WorkerLineResult>();
      if (englishCropsToRoute.length > 0) {
        callbacks.onStageChange?.('recognizing', 'Refining English lines...', 64);
        const engResults = await this.runWorkerJob(
          this.ensureEnglishWorker(),
          englishCropsToRoute,
          true,
          64,
          98,
          callbacks
        );
        for (const er of engResults) {
          engMap.set(er.id, er);
        }
      }

      const mergedLines: HtrLineResult[] = detectedLines.map((line) => {
        const engRes = engMap.get(line.id);
        const devRes = devMap.get(line.id);

        if (engRes && engRes.text.trim().length > 0) {
          const engText = engRes.text.trim();
          const devText = (devRes?.text || '').trim();
          const engQuality = scoreLineQuality(engText, engRes.confidence);
          const devQuality = scoreLineQuality(devText, devRes?.confidence);

          // Prefer English recognizer on Latin lines unless Devanagari recognizer
          // produced a clearly higher-confidence, cleaner reading (e.g. digits/codes).
          if (!devText || engQuality >= devQuality - 0.04) {
            return {
              id: line.id,
              lineIndex: line.lineIndex,
              text: engText,
              pixelBox: line.pixelBox,
              normalizedBox: line.normalizedBox,
              paragraphBreakAfter: line.paragraphBreakAfter,
              script: 'eng',
              confidence: engRes.confidence,
            };
          }
        }

        const text = devRes?.text || '';
        return {
          id: line.id,
          lineIndex: line.lineIndex,
          text,
          pixelBox: line.pixelBox,
          normalizedBox: line.normalizedBox,
          paragraphBreakAfter: line.paragraphBreakAfter,
          script: detectLineScript(text),
          confidence: devRes?.confidence,
        };
      });

      const modelUsed =
        englishCropsToRoute.length > 0
          ? `${HINDI_HTR_ADAPTER_INFO.modelId}+${ENGLISH_HTR_ADAPTER_INFO.modelId}`
          : HINDI_HTR_ADAPTER_INFO.modelId;

      return {
        lines: mergedLines,
        text: reconstructTextFromLines(mergedLines),
        modelUsed,
        processingMs: Math.round(performance.now() - startTime),
        appliedRotationDelta,
      };
    } finally {
      if (ownsWorkingCanvas && workingCanvas !== pageCanvas) {
        workingCanvas.width = 0;
        workingCanvas.height = 0;
      }
    }
  }
}

export const localHtrEngine = new LocalHtrEngineManager();
