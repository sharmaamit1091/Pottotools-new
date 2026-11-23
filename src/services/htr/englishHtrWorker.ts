import { pipeline, env, RawImage } from '@huggingface/transformers';

// Strictly client-side browser caching of static ONNX model weights; never send document data anywhere
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = 'Xenova/trocr-small-handwritten';

type WorkerRequest =
  | { type: 'preload' }
  | {
      type: 'recognize-lines';
      jobId: string;
      lines: Array<{ id: string; lineIndex: number; blob: Blob }>;
    }
  | { type: 'cancel'; jobId: string };

let recognizerPromise: Promise<any> | null = null;
let cancelledJobId: string | null = null;

function post(message: Record<string, unknown>) {
  self.postMessage(message);
}

async function getRecognizer(): Promise<any> {
  if (!recognizerPromise) {
    post({
      type: 'model-progress',
      phase: 'checking',
      modelId: MODEL_ID,
      percent: 2,
      detail: 'Preparing handwriting recognition...',
    });

    recognizerPromise = pipeline('image-to-text', MODEL_ID, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: (info: any) => {
        if (!info) return;
        const status = info.status;
        if (status === 'initiate' || status === 'download') {
          post({
            type: 'model-progress',
            phase: 'downloading',
            modelId: MODEL_ID,
            percent: typeof info.progress === 'number' ? Math.round(info.progress) : 5,
            detail: 'Setting up offline recognition (first time only)...',
          });
        } else if (status === 'progress') {
          const pct =
            typeof info.progress === 'number'
              ? Math.max(0, Math.min(100, Math.round(info.progress)))
              : 0;
          post({
            type: 'model-progress',
            phase: 'downloading',
            modelId: MODEL_ID,
            percent: pct,
            detail: 'Setting up offline recognition (first time only)...',
          });
        } else if (status === 'done') {
          post({
            type: 'model-progress',
            phase: 'initializing',
            modelId: MODEL_ID,
            percent: 96,
            detail: 'Almost ready...',
          });
        } else if (status === 'ready') {
          post({
            type: 'model-progress',
            phase: 'ready',
            modelId: MODEL_ID,
            percent: 100,
            detail: 'Ready',
          });
        }
      },
    }).catch((err: unknown) => {
      recognizerPromise = null;
      throw err;
    });
  }

  const instance = await recognizerPromise;
  post({
    type: 'model-progress',
    phase: 'ready',
    modelId: MODEL_ID,
    percent: 100,
    detail: 'Ready',
  });
  return instance;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  if (msg.type === 'cancel') {
    cancelledJobId = msg.jobId;
    return;
  }

  if (msg.type === 'preload') {
    try {
      await getRecognizer();
      post({ type: 'preload-done', modelId: MODEL_ID });
    } catch (err: any) {
      post({
        type: 'error',
        error:
          err?.message ||
          'Failed to initialize the local English handwriting model. Please check your connection for the one-time model weight download.',
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
      const recognizer = await getRecognizer();
      const results: Array<{ id: string; lineIndex: number; text: string }> = [];
      const total = lines.length;

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
          percent: Math.round(((i) / Math.max(1, total)) * 100),
          detail: `Reading line ${i + 1} of ${total}...`,
        });

        const rawImage = await RawImage.fromBlob(item.blob);
        const output = await recognizer(rawImage, {
          max_new_tokens: 96,
        });

        let recognized = '';
        if (Array.isArray(output) && output[0]?.generated_text) {
          recognized = String(output[0].generated_text).trim();
        } else if (output && typeof output === 'object' && 'generated_text' in output) {
          recognized = String((output as any).generated_text || '').trim();
        }

        results.push({
          id: item.id,
          lineIndex: item.lineIndex,
          text: recognized,
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
