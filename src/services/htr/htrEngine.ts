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
} from './lineSegmenter';
import {
  detectLineScript,
  shouldRouteLineToEnglishHtr,
} from './devanagariCharset';

export const ENGLISH_HTR_ADAPTER_INFO: HtrEngineCapabilities = {
  id: 'trocr-small-handwritten-en',
  label: 'TrOCR Small Handwritten (English)',
  modelId: 'Xenova/trocr-small-handwritten',
  supportedLanguages: ['eng'],
  isExperimental: false,
  estimatedDownloadMB: 61,
  supportsHandwriting: true,
  note: 'Verified quantized ONNX transformer trained on IAM English normal & cursive handwriting. Cached locally in your browser after first download.',
};

export const HINDI_HTR_ADAPTER_INFO: HtrEngineCapabilities = {
  id: 'devanagari-ppocrv5-beta',
  label: 'Devanagari PP-OCRv5 Mobile ONNX (Beta)',
  modelId: 'PaddlePaddle/devanagari_PP-OCRv5_mobile_rec_onnx',
  supportedLanguages: ['hin', 'hin+eng'],
  isExperimental: true,
  estimatedDownloadMB: 8,
  supportsHandwriting: true,
  note: 'Official Apache-2.0 Devanagari ONNX model (~7.6 MB, cached locally). Works best on neat Hindi handwriting, printed/semi-handwritten office notes, and bilingual numbers/codes. Messy cursive Hindi is Beta and may require manual correction.',
};

export function getActiveAdapterSummary(languageMode: HtrLanguageMode): {
  label: string;
  estimatedDownloadText: string;
  isBeta: boolean;
} {
  if (languageMode === 'eng') {
    return {
      label: ENGLISH_HTR_ADAPTER_INFO.label,
      estimatedDownloadText: `~${ENGLISH_HTR_ADAPTER_INFO.estimatedDownloadMB} MB (English HTR)`,
      isBeta: false,
    };
  }
  if (languageMode === 'hin') {
    return {
      label: HINDI_HTR_ADAPTER_INFO.label,
      estimatedDownloadText: `~${HINDI_HTR_ADAPTER_INFO.estimatedDownloadMB} MB (Devanagari ONNX)`,
      isBeta: true,
    };
  }
  return {
    label: 'Devanagari PP-OCRv5 (Beta) + TrOCR English HTR',
    estimatedDownloadText: `~${HINDI_HTR_ADAPTER_INFO.estimatedDownloadMB} MB Devanagari + ~${ENGLISH_HTR_ADAPTER_INFO.estimatedDownloadMB} MB if English lines are detected`,
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
}

interface WorkerLineResult {
  id: string;
  lineIndex: number;
  text: string;
  confidence?: number;
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
 * Coordinates both the local English Handwritten TrOCR worker (~61 MB) and the
 * local Devanagari PP-OCRv5 Mobile ONNX worker (~7.6 MB). Runs 100% inside
 * dedicated background Web Workers so the UI stays responsive, supports instant
 * cancellation, and guarantees zero document pixels or text leave the device.
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
    callbacks: RecognizePageCallbacks
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
            detail: msg.detail || 'Loading local model...',
          });
          return;
        }

        if (msg.jobId && msg.jobId !== jobId) return;

        if (msg.type === 'line-progress') {
          const span = Math.max(1, progressEnd - progressStart);
          const overallPct = Math.min(
            99,
            Math.round(progressStart + ((msg.percent || 0) / 100) * span)
          );
          callbacks.onStageChange?.('recognizing', msg.detail, overallPct);
          return;
        }

        if (msg.type === 'cancelled') {
          cleanup();
          reject(new Error('PROCESSING_CANCELLED'));
          return;
        }

        if (msg.type === 'error') {
          cleanup();
          reject(new Error(msg.error || 'Local handwriting recognition failed.'));
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
        lines: crops.map((c) =>
          includeResized48 && c.resized48
            ? {
                id: c.line.id,
                lineIndex: c.line.lineIndex,
                blob: c.blob,
                resized48: c.resized48,
              }
            : {
                id: c.line.id,
                lineIndex: c.line.lineIndex,
                blob: c.blob,
              }
        ),
      });
    });
  }

  /**
   * Recognizes a single line using the explicitly chosen local script adapter ('hin' or 'eng').
   * Ideal when a user wants to re-run one misrouted bilingual line without reprocessing the entire page.
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
        false,
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

    // Stage 1: Segment handwritten text lines locally on Canvas
    callbacks.onStageChange?.('segmenting', 'Scanning document layout...', 8);
    await new Promise((r) => window.setTimeout(r, 15));

    const detectedLines = detectHandwrittenLines(pageCanvas);
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
      };
    }

    callbacks.onStageChange?.(
      'segmenting',
      `Found ${detectedLines.length} text line${detectedLines.length === 1 ? '' : 's'}...`,
      16
    );

    const crops = await cropLineBlobsFromCanvas(pageCanvas, detectedLines);
    if (this.cancelFlag) {
      throw new Error('PROCESSING_CANCELLED');
    }

    // Mode 1: Pure English Handwritten TrOCR
    if (languageMode === 'eng') {
      const workerResults = await this.runWorkerJob(
        this.ensureEnglishWorker(),
        crops,
        false,
        18,
        98,
        callbacks
      );

      const textMap = new Map(workerResults.map((r) => [r.id, r.text]));
      const mergedLines: HtrLineResult[] = detectedLines.map((line) => ({
        id: line.id,
        lineIndex: line.lineIndex,
        text: textMap.get(line.id) || '',
        pixelBox: line.pixelBox,
        normalizedBox: line.normalizedBox,
        paragraphBreakAfter: line.paragraphBreakAfter,
        script: 'eng',
        // Intentionally omit confidence because TrOCR greedy decoding does not emit calibrated probabilities
      }));

      return {
        lines: mergedLines,
        text: reconstructTextFromLines(mergedLines),
        modelUsed: ENGLISH_HTR_ADAPTER_INFO.modelId,
        processingMs: Math.round(performance.now() - startTime),
      };
    }

    // Mode 2: Dedicated Local Devanagari ONNX (Hindi + numbers/codes)
    if (languageMode === 'hin') {
      const devResults = await this.runWorkerJob(
        this.ensureDevanagariWorker(),
        crops,
        true,
        18,
        98,
        callbacks
      );

      const resMap = new Map(devResults.map((r) => [r.id, r]));
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
      };
    }

    // Mode 3: Smart Bilingual Hindi + English Routing (100% Local)
    // Pass A: Run lightweight Devanagari PP-OCRv5 ONNX (~7.6 MB) across all lines first.
    const devResults = await this.runWorkerJob(
      this.ensureDevanagariWorker(),
      crops,
      true,
      18,
      58,
      callbacks
    );

    if (this.cancelFlag) {
      throw new Error('PROCESSING_CANCELLED');
    }

    const devMap = new Map(devResults.map((r) => [r.id, r]));

    // Decide which non-Devanagari / cursive Latin lines benefit from dedicated English TrOCR HTR
    const englishCropsToRoute: SegmentedLineCrop[] = [];
    for (const crop of crops) {
      const r = devMap.get(crop.line.id);
      if (shouldRouteLineToEnglishHtr(r?.text || '', r?.confidence, handwritingStyle)) {
        englishCropsToRoute.push(crop);
      }
    }

    const engMap = new Map<string, WorkerLineResult>();
    if (englishCropsToRoute.length > 0) {
      callbacks.onStageChange?.(
        'recognizing',
        `Reading English lines...`,
        60
      );

      const engResults = await this.runWorkerJob(
        this.ensureEnglishWorker(),
        englishCropsToRoute,
        false,
        60,
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

      // If routed to English TrOCR and it returned readable text, use TrOCR (specialized for cursive/normal English)
      if (engRes && engRes.text.trim().length > 0) {
        return {
          id: line.id,
          lineIndex: line.lineIndex,
          text: engRes.text.trim(),
          pixelBox: line.pixelBox,
          normalizedBox: line.normalizedBox,
          paragraphBreakAfter: line.paragraphBreakAfter,
          script: 'eng',
        };
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
        ? 'Devanagari PP-OCRv5 + TrOCR Handwritten (English)'
        : HINDI_HTR_ADAPTER_INFO.modelId;

    return {
      lines: mergedLines,
      text: reconstructTextFromLines(mergedLines),
      modelUsed,
      processingMs: Math.round(performance.now() - startTime),
    };
  }
}

export const localHtrEngine = new LocalHtrEngineManager();
