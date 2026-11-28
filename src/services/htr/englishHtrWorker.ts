import * as ort from 'onnxruntime-web';
import { ENGLISH_CTC_VOCAB, ENGLISH_EXOTIC_VOCAB_INDICES } from './englishCharset';

const MODEL_ID = 'PaddlePaddle/en_PP-OCRv5_mobile_rec_onnx';
const MODEL_URL =
  'https://huggingface.co/PaddlePaddle/en_PP-OCRv5_mobile_rec_onnx/resolve/main/inference.onnx';
const CACHE_NAME = 'pottotools-htr-models-v1';
const TARGET_HEIGHT = 48;
const MIN_PADDED_WIDTH = 320;
const MAX_WIDTH = 2048;

export interface EnglishChunkInput {
  blob: Blob;
  resized48?: {
    width: number;
    height: number;
    rgba: ArrayBuffer;
  };
}

export interface EnglishLineInput {
  id: string;
  lineIndex: number;
  blob: Blob;
  resized48?: {
    width: number;
    height: number;
    rgba: ArrayBuffer;
  };
  /** Optional gap-split phrase chunks for wide form lines. */
  chunks?: EnglishChunkInput[];
}

type WorkerRequest =
  | { type: 'preload' }
  | {
      type: 'recognize-lines';
      jobId: string;
      lines: EnglishLineInput[];
    }
  | { type: 'cancel'; jobId: string };

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let cancelledJobId: string | null = null;
let ortConfigured = false;

function post(message: Record<string, unknown>) {
  self.postMessage(message);
}

function configureOrtWasm() {
  if (ortConfigured) return;
  ortConfigured = true;
  const ver = ort.env.versions?.web || '1.31.0-dev.20260914-8d85527a0';
  ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ver}/dist/`;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.logLevel = 'error';
}

async function fetchModelBytesWithCache(): Promise<Uint8Array> {
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(MODEL_URL);
      if (cached && cached.ok) {
        post({
          type: 'model-progress',
          phase: 'initializing',
          modelId: MODEL_ID,
          percent: 90,
          detail: 'Preparing handwriting recognition...',
        });
        const buf = await cached.arrayBuffer();
        if (buf.byteLength > 100_000) {
          return new Uint8Array(buf);
        }
      }
    } catch {
      // Cache API may be restricted in private browsing
    }
  }

  post({
    type: 'model-progress',
    phase: 'downloading',
    modelId: MODEL_ID,
    percent: 4,
    detail: 'Setting up offline recognition (first time only)...',
  });

  const response = await fetch(MODEL_URL, { mode: 'cors', credentials: 'omit' });
  if (!response.ok) {
    throw new Error(
      `Could not complete first-time setup (HTTP ${response.status}). Please check your internet connection.`
    );
  }

  const totalBytesHeader = Number(response.headers.get('content-length') || '0');
  const totalBytes =
    Number.isFinite(totalBytesHeader) && totalBytesHeader > 0 ? totalBytesHeader : 7_848_423;

  let bytes: Uint8Array;
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;
    let lastEmit = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loadedBytes += value.byteLength;
        const now = performance.now();
        if (now - lastEmit > 80 || loadedBytes >= totalBytes) {
          lastEmit = now;
          const pct = Math.min(92, Math.max(5, Math.round((loadedBytes / totalBytes) * 92)));
          post({
            type: 'model-progress',
            phase: 'downloading',
            modelId: MODEL_ID,
            percent: pct,
            detail: 'Setting up offline recognition (first time only)...',
          });
        }
      }
    }

    bytes = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
  } else {
    const buf = await response.arrayBuffer();
    bytes = new Uint8Array(buf);
  }

  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheCopy = new Uint8Array(bytes.byteLength);
      cacheCopy.set(bytes);
      await cache.put(
        MODEL_URL,
        new Response(cacheCopy.buffer, {
          status: 200,
          headers: { 'Content-Type': 'application/octet-stream' },
        })
      );
    } catch {
      // Ignore storage quota errors gracefully
    }
  }

  return bytes;
}

async function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    configureOrtWasm();
    post({
      type: 'model-progress',
      phase: 'checking',
      modelId: MODEL_ID,
      percent: 2,
      detail: 'Preparing handwriting recognition...',
    });

    sessionPromise = (async () => {
      const modelBytes = await fetchModelBytesWithCache();
      post({
        type: 'model-progress',
        phase: 'initializing',
        modelId: MODEL_ID,
        percent: 95,
        detail: 'Almost ready...',
      });

      return await ort.InferenceSession.create(modelBytes, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
    })().catch((err: unknown) => {
      sessionPromise = null;
      throw err;
    });
  }

  const session = await sessionPromise;
  post({
    type: 'model-progress',
    phase: 'ready',
    modelId: MODEL_ID,
    percent: 100,
    detail: 'Ready',
  });
  return session;
}

async function extractRgbaAtHeight48(
  item: EnglishChunkInput
): Promise<{ width: number; height: number; rgba: Uint8ClampedArray }> {
  if (item.resized48) {
    return {
      width: item.resized48.width,
      height: item.resized48.height,
      rgba: new Uint8ClampedArray(item.resized48.rgba),
    };
  }

  if (typeof createImageBitmap === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    throw new Error('Browser worker does not support OffscreenCanvas image decoding.');
  }

  const bitmap = await createImageBitmap(item.blob);
  try {
    const srcW = Math.max(1, bitmap.width);
    const srcH = Math.max(1, bitmap.height);
    const resizedW = Math.max(24, Math.min(MAX_WIDTH, Math.round((srcW * TARGET_HEIGHT) / srcH)));

    const canvas = new OffscreenCanvas(resizedW, TARGET_HEIGHT);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to acquire 2D context on OffscreenCanvas.');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, resizedW, TARGET_HEIGHT);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, resizedW, TARGET_HEIGHT);

    const imgData = ctx.getImageData(0, 0, resizedW, TARGET_HEIGHT);
    return {
      width: resizedW,
      height: TARGET_HEIGHT,
      rgba: imgData.data,
    };
  } finally {
    bitmap.close();
  }
}

function buildPaddleRecTensor(
  rgba: Uint8ClampedArray,
  resizedW: number,
  height: number
): ort.Tensor {
  const paddedW = Math.min(MAX_WIDTH, Math.max(MIN_PADDED_WIDTH, Math.ceil(resizedW / 8) * 8));
  const H = TARGET_HEIGHT;
  const planeSize = H * paddedW;
  const chw = new Float32Array(3 * planeSize);
  const copyW = Math.min(resizedW, paddedW);
  const copyH = Math.min(height, H);

  for (let y = 0; y < copyH; y++) {
    const rowOut = y * paddedW;
    const rowIn = y * resizedW;
    for (let x = 0; x < copyW; x++) {
      const p = (rowIn + x) * 4;
      const r = (rgba[p] / 255 - 0.5) / 0.5;
      const g = (rgba[p + 1] / 255 - 0.5) / 0.5;
      const b = (rgba[p + 2] / 255 - 0.5) / 0.5;
      const idx = rowOut + x;
      chw[idx] = b;
      chw[planeSize + idx] = g;
      chw[2 * planeSize + idx] = r;
    }
  }

  return new ort.Tensor('float32', chw, [1, 3, H, paddedW]);
}

function decodeCtcProbabilities(
  data: Float32Array,
  timeSteps: number,
  vocabSize: number
): { text: string; confidence?: number } {
  let prevIdx = 0;
  let text = '';
  let probSum = 0;
  let emittedCount = 0;

  for (let t = 0; t < timeSteps; t++) {
    const base = t * vocabSize;
    let bestIdx = 0;
    let bestScore = -1;
    for (let c = 0; c < vocabSize; c++) {
      let score = data[base + c];
      if (ENGLISH_EXOTIC_VOCAB_INDICES.has(c)) {
        score *= 0.25;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = c;
      }
    }

    if (bestIdx !== 0 && bestIdx !== prevIdx) {
      const ch = ENGLISH_CTC_VOCAB[bestIdx];
      if (ch !== undefined) {
        text += ch;
        probSum += data[base + bestIdx];
        emittedCount++;
      }
    }
    prevIdx = bestIdx;
  }

  const cleaned = text.replace(/\s+/g, ' ').trim();
  const confidence =
    emittedCount > 0 && cleaned.length > 0
      ? Number((probSum / emittedCount).toFixed(4))
      : undefined;

  return { text: cleaned, confidence };
}

async function recognizeSingleCrop(
  session: ort.InferenceSession,
  inputName: string,
  outputName: string,
  crop: EnglishChunkInput
): Promise<{ text: string; confidence?: number }> {
  const { width, height, rgba } = await extractRgbaAtHeight48(crop);
  const inputTensor = buildPaddleRecTensor(rgba, width, height);
  let outputMap: ort.InferenceSession.OnnxValueMapType | null = null;
  try {
    outputMap = await session.run({ [inputName]: inputTensor });
    const outTensor = outputMap[outputName];
    const dims = outTensor.dims;
    const timeSteps = Number(dims[1] || 0);
    const vocabSize = Number(dims[2] || 0);
    return decodeCtcProbabilities(outTensor.data as Float32Array, timeSteps, vocabSize);
  } finally {
    inputTensor.dispose?.();
    if (outputMap) {
      for (const key of Object.keys(outputMap)) {
        outputMap[key]?.dispose?.();
      }
    }
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  if (msg.type === 'cancel') {
    cancelledJobId = msg.jobId;
    return;
  }

  if (msg.type === 'preload') {
    try {
      await getSession();
      post({ type: 'preload-done', modelId: MODEL_ID });
    } catch (err: any) {
      post({
        type: 'error',
        error:
          err?.message ||
          'Could not complete first-time setup. Please check your internet connection and try again.',
      });
    }
    return;
  }

  if (msg.type === 'recognize-lines') {
    const { jobId, lines } = msg;
    if (cancelledJobId === jobId) {
      post({ type: 'cancelled', jobId });
      return;
    }

    try {
      const session = await getSession();
      const inputName = session.inputNames[0] || 'x';
      const outputName = session.outputNames[0] || 'fetch_name_0';
      const total = lines.length;
      const results: Array<{
        id: string;
        lineIndex: number;
        text: string;
        confidence?: number;
      }> = [];

      for (let i = 0; i < total; i++) {
        if (cancelledJobId === jobId) {
          post({ type: 'cancelled', jobId });
          return;
        }

        const item = lines[i];
        post({
          type: 'line-progress',
          jobId,
          current: i + 1,
          total,
          percent: Math.round((i / Math.max(1, total)) * 100),
          detail: `Reading line ${i + 1} of ${total}...`,
        });

        let finalText = '';
        let finalConfidence: number | undefined;

        if (item.chunks && item.chunks.length > 1) {
          const parts: string[] = [];
          let confWeightedSum = 0;
          let weightTotal = 0;
          for (const chunk of item.chunks) {
            if (cancelledJobId === jobId) {
              post({ type: 'cancelled', jobId });
              return;
            }
            const decoded = await recognizeSingleCrop(session, inputName, outputName, chunk);
            if (decoded.text) {
              parts.push(decoded.text);
              if (typeof decoded.confidence === 'number') {
                const w = Math.max(1, decoded.text.length);
                confWeightedSum += decoded.confidence * w;
                weightTotal += w;
              }
            }
          }
          finalText = parts.join(' ').replace(/\s+/g, ' ').trim();
          finalConfidence =
            weightTotal > 0 ? Number((confWeightedSum / weightTotal).toFixed(4)) : undefined;
        } else {
          const decoded = await recognizeSingleCrop(session, inputName, outputName, item);
          finalText = decoded.text;
          finalConfidence = decoded.confidence;
        }

        results.push({
          id: item.id,
          lineIndex: item.lineIndex,
          text: finalText,
          confidence: finalConfidence,
        });

        post({
          type: 'line-progress',
          jobId,
          current: i + 1,
          total,
          percent: Math.round(((i + 1) / Math.max(1, total)) * 100),
          detail: `Reading line ${i + 1} of ${total}...`,
        });
      }

      if (cancelledJobId === jobId) {
        post({ type: 'cancelled', jobId });
        return;
      }

      post({
        type: 'recognize-done',
        jobId,
        modelId: MODEL_ID,
        results,
      });
    } catch (err: any) {
      post({
        type: 'error',
        jobId,
        error:
          err?.message ||
          'Handwriting conversion could not be completed. Please try again or process one page at a time.',
      });
    }
  }
};
