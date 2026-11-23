import {
  DigitizerPageItem,
  HandwritingStyleMode,
  HtrLanguageMode,
} from './types';

const DB_NAME = 'pottotools-office-note-drafts-v1';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const LATEST_KEY = 'latest';
/** Guard browser IndexedDB quota by capping embedded source blobs at 40 MB. */
const MAX_DRAFT_SOURCE_BYTES = 40 * 1024 * 1024;

export interface SerializedDraftSource {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'image';
  pageCount: number;
  /** Stored strictly locally in IndexedDB when total upload size <= 40 MB. */
  blob?: Blob;
}

export interface OfficeNoteDraftRecord {
  version: 1;
  savedAt: number;
  languageMode: HtrLanguageMode;
  handwritingStyle: HandwritingStyleMode;
  selectedPageId: string | null;
  includedSourceFiles: boolean;
  sources: SerializedDraftSource[];
  pages: DigitizerPageItem[];
}

export interface LocalDraftSummary {
  savedAt: number;
  pageCount: number;
  recognizedCount: number;
  firstFileName: string;
  fileCount: number;
  hasSourceFiles: boolean;
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is unavailable in this browser context.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open local draft database.'));
  });
}

/**
 * Persists the current Office Note Digitizer session strictly inside the user's
 * browser IndexedDB. Zero bytes are ever sent over the network.
 */
export async function saveLocalDraft(input: {
  languageMode: HtrLanguageMode;
  handwritingStyle: HandwritingStyleMode;
  selectedPageId: string | null;
  sources: Array<{
    id: string;
    file: File;
    name: string;
    size: number;
    type: 'pdf' | 'image';
    pageCount: number;
  }>;
  pages: DigitizerPageItem[];
}): Promise<{ savedAt: number; includedSourceFiles: boolean } | null> {
  if (!isIndexedDbAvailable() || input.pages.length === 0) return null;

  try {
    const totalBytes = input.sources.reduce((sum, s) => sum + s.size, 0);
    const includeBlobs = totalBytes <= MAX_DRAFT_SOURCE_BYTES;
    const savedAt = Date.now();

    // Normalize any transient processing state before saving
    const cleanPages: DigitizerPageItem[] = input.pages.map((p) => ({
      ...p,
      status:
        p.status === 'enhancing' || p.status === 'segmenting' || p.status === 'recognizing'
          ? p.recognizedText
            ? 'done'
            : 'idle'
          : p.status,
      progressPercent: p.status === 'done' ? 100 : 0,
    }));

    const record: OfficeNoteDraftRecord = {
      version: 1,
      savedAt,
      languageMode: input.languageMode,
      handwritingStyle: input.handwritingStyle,
      selectedPageId: input.selectedPageId,
      includedSourceFiles: includeBlobs,
      sources: input.sources.map((s) => ({
        id: s.id,
        name: s.name,
        size: s.size,
        type: s.type,
        pageCount: s.pageCount,
        blob: includeBlobs ? s.file : undefined,
      })),
      pages: cleanPages,
    };

    const db = await openDraftDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record, LATEST_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Failed to write local draft.'));
      });
    } finally {
      db.close();
    }

    return { savedAt, includedSourceFiles: includeBlobs };
  } catch {
    // Private browsing or storage quota exceeded: degrade silently without disrupting editing
    return null;
  }
}

export async function loadLocalDraftFull(): Promise<OfficeNoteDraftRecord | null> {
  if (!isIndexedDbAvailable()) return null;
  try {
    const db = await openDraftDb();
    try {
      const record = await new Promise<OfficeNoteDraftRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(LATEST_KEY);
        req.onsuccess = () => resolve(req.result as OfficeNoteDraftRecord | undefined);
        req.onerror = () => reject(req.error || new Error('Failed to read local draft.'));
      });
      if (!record || record.version !== 1 || !Array.isArray(record.pages) || record.pages.length === 0) {
        return null;
      }
      return record;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function loadLocalDraftSummary(): Promise<LocalDraftSummary | null> {
  const full = await loadLocalDraftFull();
  if (!full) return null;
  return {
    savedAt: full.savedAt,
    pageCount: full.pages.length,
    recognizedCount: full.pages.filter((p) => p.status === 'done' || p.editedText.trim().length > 0).length,
    firstFileName: full.sources[0]?.name || full.pages[0]?.sourceFileName || 'Office Note Draft',
    fileCount: Math.max(1, full.sources.length),
    hasSourceFiles: full.includedSourceFiles && full.sources.some((s) => Boolean(s.blob)),
  };
}

export async function deleteLocalDraft(): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    const db = await openDraftDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(LATEST_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Failed to delete local draft.'));
      });
    } finally {
      db.close();
    }
  } catch {
    // Ignore errors when clearing unavailable storage
  }
}
