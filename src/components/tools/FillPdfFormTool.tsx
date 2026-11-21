import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  DetectedFormSlot,
  TextFormElement,
  WhiteoutPatch,
} from '../../types/fillPdfForm';
import {
  LoadedFormPdf,
  loadPdfForFormFilling,
  exportFilledPdf,
} from '../../services/pdf/fillPdfFormService';
import {
  AnalyzedPageLayout,
  resolveSmartClickPlacement,
} from '../../services/pdf/smartFormLayoutDetector';
import { DirectTypePdfPage, SelectedPdfRegion } from './fill-pdf/DirectTypePdfPage';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { triggerToast } from '../common/Toast';
import { RecommendedNextTools } from './RecommendedNextTools';
import { ToolDefinition } from '../../config/toolsRegistry';
import { triggerDownload, readAsArrayBuffer } from '../../services/utils/downloadUtils';
import { trackToolCompleted, trackToolError } from '../../services/analytics/ga4Tracker';
import { consumeStagedFileForTool } from '../../services/utils/stagedFileService';

interface EditorSnapshot {
  entries: TextFormElement[];
  whiteoutPatches: WhiteoutPatch[];
  interactiveValues: Record<string, string | boolean>;
}

interface FillPdfFormToolProps {
  tool?: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

const uid = (prefix = 'txt') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function cloneSnapshot(snap: EditorSnapshot): EditorSnapshot {
  return {
    entries: snap.entries.map((el) => ({ ...el })),
    whiteoutPatches: snap.whiteoutPatches.map((wp) => ({ ...wp })),
    interactiveValues: { ...snap.interactiveValues },
  };
}

export const FillPdfFormTool: React.FC<FillPdfFormToolProps> = ({ onSelectNextTool }) => {
  // Loaded PDF state
  const [loadedPdf, setLoadedPdf] = useState<LoadedFormPdf | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Viewer zoom & current visible page
  const [zoom, setZoom] = useState<number>(1.0);
  const [currentVisiblePage, setCurrentVisiblePage] = useState<number>(1);

  // Smart analyzed layouts per page (table cells, inline blanks, digital text spans)
  const [pageLayouts, setPageLayouts] = useState<Record<number, AnalyzedPageLayout>>({});

  // Form data: direct click-to-type entries, whiteout patches, and native AcroForm values
  const [entries, setEntries] = useState<TextFormElement[]>([]);
  const [whiteoutPatches, setWhiteoutPatches] = useState<WhiteoutPatch[]>([]);
  const [interactiveValues, setInteractiveValues] = useState<Record<string, string | boolean>>({});
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activeSelection, setActiveSelection] = useState<SelectedPdfRegion | null>(null);

  // Remember user's last chosen font size & pen ink color so consecutive clicks match naturally
  const [defaultFontSize, setDefaultFontSize] = useState<number>(13);
  const [defaultColor, setDefaultColor] = useState<string>('#111827');

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatus, setExportStatus] = useState<string>('');

  // Refs for synchronous focus (mobile keyboard support), Tab navigation, scroll tracking, and snapshots
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const interactiveRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const entriesRef = useRef<TextFormElement[]>(entries);
  const whiteoutPatchesRef = useRef<WhiteoutPatch[]>(whiteoutPatches);
  const interactiveValuesRef = useRef<Record<string, string | boolean>>(interactiveValues);
  const pageLayoutsRef = useRef<Record<number, AnalyzedPageLayout>>(pageLayouts);
  const editingCapturedUndoRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    whiteoutPatchesRef.current = whiteoutPatches;
  }, [whiteoutPatches]);

  useEffect(() => {
    interactiveValuesRef.current = interactiveValues;
  }, [interactiveValues]);

  useEffect(() => {
    pageLayoutsRef.current = pageLayouts;
  }, [pageLayouts]);

  const registerTextareaRef = useCallback((id: string, node: HTMLTextAreaElement | null) => {
    if (node) {
      textareaRefs.current.set(id, node);
    } else {
      textareaRefs.current.delete(id);
    }
  }, []);

  const registerInteractiveRef = useCallback((id: string, node: HTMLElement | null) => {
    if (node) {
      interactiveRefs.current.set(id, node);
    } else {
      interactiveRefs.current.delete(id);
    }
  }, []);

  const registerPageRef = useCallback((pageNum: number, node: HTMLDivElement | null) => {
    if (node) {
      pageRefs.current.set(pageNum, node);
    } else {
      pageRefs.current.delete(pageNum);
    }
  }, []);

  const handlePageLayoutAnalyzed = useCallback((pageNum: number, layout: AnalyzedPageLayout) => {
    setPageLayouts((prev) => ({ ...prev, [pageNum]: layout }));
  }, []);

  // Push current state snapshot to Undo history
  const pushUndoSnapshot = useCallback(
    (overrideEntries?: TextFormElement[], overrideWhiteouts?: WhiteoutPatch[]) => {
      const snap = cloneSnapshot({
        entries: overrideEntries ?? entriesRef.current,
        whiteoutPatches: overrideWhiteouts ?? whiteoutPatchesRef.current,
        interactiveValues: interactiveValuesRef.current,
      });
      setUndoStack((prev) => [...prev.slice(-49), snap]);
      setRedoStack([]);
    },
    []
  );

  // Compute comfortable initial zoom fitting the first page inside the viewer
  const computeFitZoom = useCallback((pdf: LoadedFormPdf) => {
    const firstPage = pdf.pagesMeta[0];
    if (!firstPage) return 1.0;
    const containerW = viewerRef.current?.clientWidth || Math.min(window.innerWidth - 32, 920);
    const availableW = Math.max(260, containerW - 36);
    const idealScale = availableW / Math.max(1, firstPage.baseWidth);
    return Math.max(0.5, Math.min(1.45, Number(idealScale.toFixed(2))));
  }, []);

  // Load any PDF (normal, interactive form, scanned, or multipage)
  const openPdfFile = useCallback(
    async (file: File) => {
      setIsLoadingFile(true);
      setLoadError(null);
      try {
        const buf = await readAsArrayBuffer(file);
        const loaded = await loadPdfForFormFilling(new Uint8Array(buf));

        setLoadedPdf(loaded);
        setFileName(file.name);
        setPageLayouts({});
        setEntries([]);
        setWhiteoutPatches([]);
        setInteractiveValues(loaded.initialInteractiveValues);
        setActiveEntryId(null);
        setActiveSelection(null);
        setUndoStack([]);
        setRedoStack([]);
        setCurrentVisiblePage(1);
        editingCapturedUndoRef.current.clear();

        requestAnimationFrame(() => {
          setZoom(computeFitZoom(loaded));
        });
      } catch (err: any) {
        const msg = err?.message || 'Could not open this PDF file.';
        setLoadError(msg);
        trackToolError(msg, 'fill-pdf-form');
        triggerToast('error', msg, 'Unable to Open PDF');
      } finally {
        setIsLoadingFile(false);
      }
    },
    [computeFitZoom]
  );

  // Consume staged file when navigated from another PottoTools utility
  useEffect(() => {
    const staged = consumeStagedFileForTool();
    if (staged && staged.name.toLowerCase().endsWith('.pdf')) {
      openPdfFile(staged);
    }
  }, [openPdfFile]);

  // Track which page is currently centered in the viewport for the quiet page indicator
  useEffect(() => {
    if (!loadedPdf || loadedPdf.pageCount <= 1) return;
    const handleScroll = () => {
      const viewportMid = window.innerHeight * 0.4;
      let closestPage = 1;
      let closestDist = Infinity;
      pageRefs.current.forEach((node, pageNum) => {
        const rect = node.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - viewportMid);
        if (dist < closestDist) {
          closestDist = dist;
          closestPage = pageNum;
        }
      });
      setCurrentVisiblePage(closestPage);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadedPdf]);

  // Undo & Redo (covers typed entries, whiteout erasures, and interactive AcroForm values)
  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      const current = cloneSnapshot({
        entries: entriesRef.current,
        whiteoutPatches: whiteoutPatchesRef.current,
        interactiveValues: interactiveValuesRef.current,
      });
      setRedoStack((r) => [...r.slice(-49), current]);
      setEntries(previous.entries);
      setWhiteoutPatches(previous.whiteoutPatches);
      setInteractiveValues(previous.interactiveValues);
      setActiveEntryId(null);
      setActiveSelection(null);
      editingCapturedUndoRef.current.clear();
      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[prev.length - 1];
      const current = cloneSnapshot({
        entries: entriesRef.current,
        whiteoutPatches: whiteoutPatchesRef.current,
        interactiveValues: interactiveValuesRef.current,
      });
      setUndoStack((u) => [...u.slice(-49), current]);
      setEntries(next.entries);
      setWhiteoutPatches(next.whiteoutPatches);
      setInteractiveValues(next.interactiveValues);
      setActiveEntryId(null);
      setActiveSelection(null);
      editingCapturedUndoRef.current.clear();
      return prev.slice(0, -1);
    });
  }, []);

  // Global keyboard shortcuts: Undo/Redo & Ctrl+A guard when outside an input/textarea
  useEffect(() => {
    if (!loadedPdf) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const mod = e.metaKey || e.ctrlKey;
      if (!mod || inEditable) return;

      const key = e.key.toLowerCase();
      if (key === 'a') {
        // Prevent accidentally selecting the entire webpage/PDF viewer wrapper
        e.preventDefault();
      } else if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loadedPdf, handleUndo, handleRedo]);

  // Helper: Focus an existing entry's textarea synchronously
  const focusExistingEntry = useCallback((entryId: string) => {
    setActiveSelection(null);
    setActiveEntryId(entryId);
    const node = textareaRefs.current.get(entryId);
    if (node) {
      node.focus({ preventScroll: true });
      node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const len = node.value.length;
      try {
        node.setSelectionRange(len, len);
      } catch {
        // ignore
      }
    }
  }, []);

  // Helper: Activate a detected slot (table cell or inline blank) — reuses existing entry or creates one synchronously
  const activateSlot = useCallback(
    (slot: DetectedFormSlot) => {
      const existing = entriesRef.current.find((e) => e.slotId === slot.id);
      if (existing) {
        focusExistingEntry(existing.id);
        return;
      }

      const cleanedExisting = entriesRef.current.filter((e) => e.text.trim().length > 0);
      pushUndoSnapshot(cleanedExisting);

      const fontSize = Math.min(defaultFontSize, slot.suggestedFontSize || defaultFontSize);
      const newEntry: TextFormElement = {
        id: uid('txt'),
        type: 'text',
        pageNum: slot.pageNum,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        rotation: 0,
        opacity: 1,
        text: '',
        fontFamily: 'helvetica',
        fontSize,
        color: defaultColor,
        bold: false,
        italic: false,
        align: 'left',
        backgroundColor: 'transparent',
        slotId: slot.id,
        boundedBox: true,
        tableId: slot.tableId,
        tableRow: slot.row,
        tableCol: slot.col,
      };

      editingCapturedUndoRef.current.add(newEntry.id);

      flushSync(() => {
        setActiveSelection(null);
        setEntries([...cleanedExisting, newEntry]);
        setActiveEntryId(newEntry.id);
      });

      const node = textareaRefs.current.get(newEntry.id);
      if (node) {
        node.focus({ preventScroll: true });
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    [defaultFontSize, defaultColor, focusExistingEntry, pushUndoSnapshot]
  );

  // Direct click/tap anywhere on a PDF page: smart-snaps to table cells / inline blanks or bounds freehand clicks before neighbor labels
  const handleClickBlankPage = useCallback(
    (pageNum: number, normX: number, normY: number) => {
      if (!loadedPdf) return;
      const pageMeta = loadedPdf.pagesMeta[pageNum - 1];
      if (!pageMeta) return;

      const cleanedExisting = entriesRef.current.filter((e) => e.text.trim().length > 0);
      const existingOnPage = cleanedExisting.filter((e) => e.pageNum === pageNum);

      const placement = resolveSmartClickPlacement(
        normX,
        normY,
        pageMeta,
        pageLayoutsRef.current[pageNum],
        defaultFontSize,
        existingOnPage
      );

      // If this click landed inside a detected slot that already has an entry, edit that entry directly
      if (placement.slot) {
        const already = cleanedExisting.find((e) => e.slotId === placement.slot!.id);
        if (already) {
          focusExistingEntry(already.id);
          return;
        }
      }

      pushUndoSnapshot(cleanedExisting);

      const newEntry: TextFormElement = {
        id: uid('txt'),
        type: 'text',
        pageNum,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        rotation: 0,
        opacity: 1,
        text: '',
        fontFamily: 'helvetica',
        fontSize: placement.fontSize,
        color: defaultColor,
        bold: false,
        italic: false,
        align: 'left',
        backgroundColor: 'transparent',
        slotId: placement.slot?.id,
        boundedBox: placement.boundedBox,
        tableId: placement.slot?.tableId,
        tableRow: placement.slot?.row,
        tableCol: placement.slot?.col,
      };

      editingCapturedUndoRef.current.add(newEntry.id);

      flushSync(() => {
        setActiveSelection(null);
        setEntries([...cleanedExisting, newEntry]);
        setActiveEntryId(newEntry.id);
      });

      const node = textareaRefs.current.get(newEntry.id);
      if (node) {
        node.focus({ preventScroll: true });
      }
    },
    [loadedPdf, defaultFontSize, defaultColor, focusExistingEntry, pushUndoSnapshot]
  );

  // Erase preprinted/sample PDF text (and optionally open a replacement cursor immediately on top!)
  const handleEraseSelectedRegion = useCallback(
    (region: SelectedPdfRegion, fillColor: string, replacementInitialText?: string) => {
      if (!loadedPdf) return;
      const pageMeta = loadedPdf.pagesMeta[region.pageNum - 1];
      if (!pageMeta) return;

      const cleanedExisting = entriesRef.current.filter((e) => e.text.trim().length > 0);
      pushUndoSnapshot(cleanedExisting, whiteoutPatchesRef.current);

      const newPatch: WhiteoutPatch = {
        id: uid('wo'),
        pageNum: region.pageNum,
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        fillColor: fillColor || '#ffffff',
        removedText: region.selectedText || undefined,
      };

      const nextPatches = [...whiteoutPatchesRef.current, newPatch];

      if (replacementInitialText === undefined) {
        setWhiteoutPatches(nextPatches);
        setActiveSelection(null);
        return;
      }

      // Compute clean available width for replacement text (stops before next printed label on same line,
      // while allowing replacement text to extend cleanly across blank space to the right of the erased sample)
      const layout = pageLayoutsRef.current[region.pageNum];
      let rightBarrier = 0.96;
      const matchedSet = new Set(region.matchedSpanIds);
      if (layout) {
        for (const sp of layout.textSpans) {
          if (matchedSet.has(sp.id)) continue;
          const sameLine =
            sp.y < region.y + region.height * 0.9 && sp.y + sp.height > region.y + region.height * 0.1;
          if (sameLine && sp.x > region.x + region.width - 0.004 && sp.x - 0.006 < rightBarrier) {
            rightBarrier = sp.x - 0.006;
          }
        }
      }

      const fittedFontPt = Math.max(
        9,
        Math.min(defaultFontSize, Math.round(region.height * pageMeta.baseHeight * 0.85))
      );
      const minLineH = (fittedFontPt * 1.28 + 4) / Math.max(1, pageMeta.baseHeight);
      const replaceW = Math.max(region.width, Math.min(0.45, rightBarrier - region.x));

      const replacementEntry: TextFormElement = {
        id: uid('txt'),
        type: 'text',
        pageNum: region.pageNum,
        x: region.x,
        y: Math.max(0.003, region.y - 0.001),
        width: Math.min(1 - region.x - 0.004, replaceW),
        height: Math.max(region.height, minLineH),
        rotation: 0,
        opacity: 1,
        text: replacementInitialText,
        fontFamily: 'helvetica',
        fontSize: fittedFontPt,
        color: defaultColor,
        bold: false,
        italic: false,
        align: 'left',
        backgroundColor: 'transparent',
        boundedBox: rightBarrier < 0.95,
      };

      editingCapturedUndoRef.current.add(replacementEntry.id);

      flushSync(() => {
        setWhiteoutPatches(nextPatches);
        setEntries([...cleanedExisting, replacementEntry]);
        setActiveEntryId(replacementEntry.id);
        setActiveSelection(null);
      });

      const node = textareaRefs.current.get(replacementEntry.id);
      if (node) {
        node.focus({ preventScroll: true });
        const len = replacementInitialText.length;
        try {
          node.setSelectionRange(len, len);
        } catch {
          // ignore
        }
      }
    },
    [loadedPdf, defaultFontSize, defaultColor, pushUndoSnapshot]
  );

  // Unified Tab / Shift+Tab navigation across interactive AcroForm fields, detected slots/table cells, and typed entries
  const handleNavigateField = useCallback(
    (currentTargetId: string, direction: 1 | -1) => {
      if (!loadedPdf) return;

      type NavTarget = {
        id: string;
        kind: 'acro' | 'slot' | 'entry';
        pageNum: number;
        x: number;
        y: number;
        tableId?: string;
        row?: number;
        col?: number;
        slot?: DetectedFormSlot;
      };

      const targets: NavTarget[] = [];

      // 1. Native interactive AcroForm fields
      for (const f of loadedPdf.interactiveFields) {
        if (f.readOnly) continue;
        targets.push({
          id: f.id,
          kind: 'acro',
          pageNum: f.pageNum,
          x: f.x,
          y: f.y,
        });
      }

      // 2. Detected form slots (table cells + inline blanks like Years/Months/Days, Date/Month/Year)
      const layouts = pageLayoutsRef.current;
      for (const pageMeta of loadedPdf.pagesMeta) {
        const lay = layouts[pageMeta.pageNum];
        if (!lay) continue;
        for (const s of lay.slots) {
          targets.push({
            id: s.id,
            kind: 'slot',
            pageNum: s.pageNum,
            x: s.x,
            y: s.y,
            tableId: s.tableId,
            row: s.row,
            col: s.col,
            slot: s,
          });
        }
      }

      // 3. Freehand user entries (not bound to a slot) — keep active entry even if currently empty so Tab knows its position
      for (const e of entriesRef.current) {
        if (e.slotId) continue;
        if (e.text.trim().length === 0 && e.id !== currentTargetId) continue;
        targets.push({
          id: e.id,
          kind: 'entry',
          pageNum: e.pageNum,
          x: e.x,
          y: e.y,
        });
      }

      if (targets.length === 0) return;

      // Sort in natural form-filling order: Page -> Table (row then col) -> Top-to-Bottom, Left-to-Right
      targets.sort((a, b) => {
        if (a.pageNum !== b.pageNum) return a.pageNum - b.pageNum;
        if (a.tableId && b.tableId && a.tableId === b.tableId) {
          if ((a.row ?? 0) !== (b.row ?? 0)) return (a.row ?? 0) - (b.row ?? 0);
          return (a.col ?? 0) - (b.col ?? 0);
        }
        if (Math.abs(a.y - b.y) > 0.014) return a.y - b.y;
        return a.x - b.x;
      });

      const curIdx = targets.findIndex((t) => t.id === currentTargetId);
      if (curIdx === -1) {
        const first = direction === 1 ? targets[0] : targets[targets.length - 1];
        if (first.kind === 'slot' && first.slot) activateSlot(first.slot);
        else if (first.kind === 'entry') focusExistingEntry(first.id);
        else interactiveRefs.current.get(first.id)?.focus();
        return;
      }

      const nextIdx = (curIdx + direction + targets.length) % targets.length;
      if (nextIdx === curIdx) return;

      const next = targets[nextIdx];
      if (next.kind === 'slot' && next.slot) {
        activateSlot(next.slot);
      } else if (next.kind === 'entry') {
        focusExistingEntry(next.id);
      } else if (next.kind === 'acro') {
        setActiveEntryId(null);
        const node = interactiveRefs.current.get(next.id);
        if (node) {
          node.focus({ preventScroll: true });
          node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    },
    [loadedPdf, activateSlot, focusExistingEntry]
  );

  // Enter inside a table cell jumps cleanly to the next row in the SAME column (row + 1, col)
  const handleNavigateTableDown = useCallback(
    (entry: TextFormElement) => {
      if (!entry.tableId || entry.tableRow === undefined || entry.tableCol === undefined) {
        handleNavigateField(entry.slotId || entry.id, 1);
        return;
      }

      const lay = pageLayoutsRef.current[entry.pageNum];
      if (!lay) {
        handleNavigateField(entry.slotId || entry.id, 1);
        return;
      }

      // Look for next row down in the same column
      const sameColBelow = lay.slots
        .filter(
          (s) =>
            s.tableId === entry.tableId &&
            s.col === entry.tableCol &&
            (s.row ?? -1) > entry.tableRow!
        )
        .sort((a, b) => (a.row ?? 0) - (b.row ?? 0));

      if (sameColBelow.length > 0) {
        activateSlot(sameColBelow[0]);
        return;
      }

      // At bottom row of this column -> move to top fillable row of next column if available
      const nextColTop = lay.slots
        .filter((s) => s.tableId === entry.tableId && (s.col ?? -1) > entry.tableCol!)
        .sort((a, b) =>
          (a.col ?? 0) !== (b.col ?? 0)
            ? (a.col ?? 0) - (b.col ?? 0)
            : (a.row ?? 0) - (b.row ?? 0)
        );

      if (nextColTop.length > 0) {
        activateSlot(nextColTop[0]);
        return;
      }

      // Otherwise continue to next form field in reading order
      handleNavigateField(entry.slotId || entry.id, 1);
    },
    [activateSlot, handleNavigateField]
  );

  // Focusing an existing text entry
  const handleFocusEntry = useCallback((id: string) => {
    setActiveSelection(null);
    setActiveEntryId(id);
  }, []);

  // Leaving a text entry: silently remove it if empty so stray empty boxes never linger
  const handleBlurEntry = useCallback((id: string) => {
    editingCapturedUndoRef.current.delete(id);
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target && target.text.trim().length === 0) {
        return prev.filter((e) => e.id !== id);
      }
      return prev;
    });
    setActiveEntryId((curr) => (curr === id ? null : curr));
  }, []);

  // Live typing inside a text entry (records a single clean undo step per editing session)
  const handleChangeEntryText = useCallback(
    (id: string, text: string, measuredWidthNorm: number, measuredHeightNorm: number) => {
      if (!editingCapturedUndoRef.current.has(id)) {
        editingCapturedUndoRef.current.add(id);
        pushUndoSnapshot();
      }
      setEntries((prev) =>
        prev.map((el) => {
          if (el.id !== id) return el;
          if (el.boundedBox) {
            return {
              ...el,
              text,
              height: el.tableId
                ? el.height
                : Math.max(el.height, Math.min(1 - el.y - 0.004, measuredHeightNorm)),
            };
          }
          return {
            ...el,
            text,
            width: Math.min(1 - el.x - 0.004, measuredWidthNorm + 0.012),
            height: Math.min(1 - el.y - 0.004, measuredHeightNorm),
          };
        })
      );
    },
    [pushUndoSnapshot]
  );

  // Font size / text color updates from the contextual floating bar
  const handleUpdateEntryStyle = useCallback(
    (id: string, patch: Partial<Pick<TextFormElement, 'fontSize' | 'color'>>) => {
      pushUndoSnapshot();
      if (patch.fontSize !== undefined) setDefaultFontSize(patch.fontSize);
      if (patch.color !== undefined) setDefaultColor(patch.color);

      setEntries((prev) =>
        prev.map((el) => {
          if (el.id !== id) return el;
          const nextFontSize = patch.fontSize ?? el.fontSize;
          const pageMeta = loadedPdf?.pagesMeta[el.pageNum - 1];
          const minH = pageMeta
            ? (nextFontSize * 1.28 + 4) / Math.max(1, pageMeta.baseHeight)
            : el.height;
          return {
            ...el,
            ...patch,
            height: el.tableId ? el.height : Math.max(el.height, minH),
          };
        })
      );
    },
    [loadedPdf, pushUndoSnapshot]
  );

  // Subtle drag repositioning via the active entry's grip handle
  const handleMoveEntry = useCallback(
    (id: string, normX: number, normY: number, isStart = false) => {
      if (isStart) pushUndoSnapshot();
      setEntries((prev) =>
        prev.map((el) =>
          el.id === id
            ? {
                ...el,
                x: normX,
                y: normY,
                width: Math.min(el.width, 1 - normX - 0.004),
              }
            : el
        )
      );
    },
    [pushUndoSnapshot]
  );

  // Delete a typed entry cleanly
  const handleDeleteEntry = useCallback(
    (id: string) => {
      pushUndoSnapshot();
      setEntries((prev) => prev.filter((el) => el.id !== id));
      setActiveEntryId((curr) => (curr === id ? null : curr));
      editingCapturedUndoRef.current.delete(id);
    },
    [pushUndoSnapshot]
  );

  // Native interactive PDF AcroForm field changes
  const handleInteractiveFieldChange = useCallback(
    (fieldName: string, value: string | boolean, recordUndo = false) => {
      if (recordUndo) pushUndoSnapshot();
      setInteractiveValues((prev) => ({ ...prev, [fieldName]: value }));
    },
    [pushUndoSnapshot]
  );

  // Zoom controls
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))));
  const handleZoomFit = () => {
    if (loadedPdf) setZoom(computeFitZoom(loadedPdf));
  };

  // Scroll smoothly to previous/next page when multi-page
  const scrollToPage = (targetPage: number) => {
    if (!loadedPdf) return;
    const clamped = Math.max(1, Math.min(loadedPdf.pageCount, targetPage));
    const node = pageRefs.current.get(clamped);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentVisiblePage(clamped);
    }
  };

  // Export & download filled PDF preserving layout, exact positions, whiteout patches, and interactive values
  const handleDownloadPdf = async () => {
    if (!loadedPdf || isExporting) return;

    const nonEmptyEntries = entriesRef.current.filter((e) => e.text.trim().length > 0);
    setActiveEntryId(null);
    setActiveSelection(null);
    setIsExporting(true);
    setExportProgress(10);
    setExportStatus('Preparing your filled PDF...');

    try {
      const result = await exportFilledPdf({
        rawPdfBytes: loadedPdf.rawBytes,
        elements: nonEmptyEntries,
        whiteoutPatches: whiteoutPatchesRef.current,
        interactiveFields: loadedPdf.interactiveFields,
        interactiveValues: interactiveValuesRef.current,
        pageRotations: {},
        flatten: false,
        onProgress: (pct, status) => {
          setExportProgress(pct);
          setExportStatus(status);
        },
      });

      const baseName = fileName.replace(/\.pdf$/i, '') || 'document';
      const outName = `${baseName}-filled.pdf`;
      triggerDownload(result.blob, outName);

      trackToolCompleted('pdf', result.bytes.byteLength, 'fill-pdf-form');
      triggerToast('success', `Downloaded ${outName}`, 'PDF Ready');
    } catch (err: any) {
      const msg = err?.message || 'Could not export the filled PDF.';
      trackToolError(msg, 'fill-pdf-form');
      triggerToast('error', msg, 'Export Failed');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('');
    }
  };

  // Group entries, whiteouts, and interactive fields per page for O(1) lookup during render
  const entriesByPage = useMemo(() => {
    const map = new Map<number, TextFormElement[]>();
    for (const el of entries) {
      const list = map.get(el.pageNum);
      if (list) list.push(el);
      else map.set(el.pageNum, [el]);
    }
    return map;
  }, [entries]);

  const whiteoutsByPage = useMemo(() => {
    const map = new Map<number, WhiteoutPatch[]>();
    for (const wp of whiteoutPatches) {
      const list = map.get(wp.pageNum);
      if (list) list.push(wp);
      else map.set(wp.pageNum, [wp]);
    }
    return map;
  }, [whiteoutPatches]);

  const interactiveFieldsByPage = useMemo(() => {
    const map = new Map<number, LoadedFormPdf['interactiveFields']>();
    if (!loadedPdf) return map;
    for (const f of loadedPdf.interactiveFields) {
      const list = map.get(f.pageNum);
      if (list) list.push(f);
      else map.set(f.pageNum, [f]);
    }
    return map;
  }, [loadedPdf]);

  const hasEditedAnything =
    entries.some((e) => e.text.trim().length > 0) || whiteoutPatches.length > 0;

  return (
    <div className="space-y-6">
      {/* Hidden file input for switching PDF from the toolbar */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) openPdfFile(f);
        }}
      />

      {/* Empty State: Upload PDF */}
      {!loadedPdf ? (
        <div className="space-y-4">
          <FileUploadZone
            acceptedFormats={['.pdf']}
            maxFileSizeMB={100}
            multiple={false}
            files={[]}
            disabled={isLoadingFile}
            onFilesSelected={(files) => {
              if (files[0]) openPdfFile(files[0]);
            }}
            onRemoveFile={() => {}}
          />

          {isLoadingFile && (
            <ProgressBar progress={65} statusText="Opening PDF document locally..." />
          )}

          {loadError && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loadError}</span>
            </div>
          )}
        </div>
      ) : (
        /* Active Clean Document Viewer & Direct Click-to-Type Workspace */
        <div className="rounded-3xl bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] shadow-[0_12px_34px_-22px_rgba(37,37,54,0.18)] overflow-clip">
          {/* Minimal Sticky Top Bar — Strictly Essential Controls */}
          <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#181B2E]/95 backdrop-blur-md border-b border-[#E8E6F2] dark:border-[#2A2F4A] px-3 sm:px-5 py-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Left: Upload PDF */}
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#252536] dark:text-[#F2F4FC] bg-[#F5F4FA] dark:bg-[#20243C] hover:bg-[#E9E4FF] dark:hover:bg-[#2B2752] border border-[#E8E6F2] dark:border-[#2A2F4A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#5B50E6] dark:text-[#A99EFF]" />
                <span>Upload PDF</span>
              </button>

              {/* Center: Zoom + Undo/Redo */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Zoom Controls */}
                <div className="inline-flex items-center rounded-xl bg-[#F5F4FA] dark:bg-[#20243C] border border-[#E8E6F2] dark:border-[#2A2F4A] p-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                    aria-label="Zoom Out"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#252536] dark:text-[#E2E6F7] hover:bg-white dark:hover:bg-[#2A2F4A] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomFit}
                    title="Fit page width"
                    className="px-2 h-8 text-xs font-mono font-semibold tabular-nums text-[#252536] dark:text-[#F2F4FC] hover:text-[#5B50E6] dark:hover:text-[#A99EFF] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                    title="Zoom In"
                    aria-label="Zoom In"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#252536] dark:text-[#E2E6F7] hover:bg-white dark:hover:bg-[#2A2F4A] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Undo / Redo */}
                <div className="inline-flex items-center rounded-xl bg-[#F5F4FA] dark:bg-[#20243C] border border-[#E8E6F2] dark:border-[#2A2F4A] p-0.5">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    title="Undo (Ctrl+Z)"
                    aria-label="Undo"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#252536] dark:text-[#E2E6F7] hover:bg-white dark:hover:bg-[#2A2F4A] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    title="Redo (Ctrl+Shift+Z)"
                    aria-label="Redo"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#252536] dark:text-[#E2E6F7] hover:bg-white dark:hover:bg-[#2A2F4A] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: Primary Download PDF CTA */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#5B50E6] hover:bg-[#4A3FD4] disabled:opacity-60 shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exporting…' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          {/* Export progress bar (shown only while exporting) */}
          {isExporting && (
            <div className="px-4 py-3 bg-[#FAFAFC] dark:bg-[#141727] border-b border-[#E8E6F2] dark:border-[#2A2F4A]">
              <ProgressBar progress={exportProgress} statusText={exportStatus} />
            </div>
          )}

          {/* Quiet Unboxed Document Strip */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2 bg-[#FAFAFC] dark:bg-[#141727] border-b border-[#EFEFF6] dark:border-[#242942] text-xs text-[#777789] dark:text-[#A0A5C0]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-[#252536] dark:text-[#E2E6F7] truncate max-w-[180px] sm:max-w-[300px]">
                {fileName}
              </span>
              {loadedPdf.pageCount > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <div className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollToPage(currentVisiblePage - 1)}
                      disabled={currentVisiblePage <= 1}
                      aria-label="Previous page"
                      className="p-0.5 rounded hover:text-[#252536] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="tabular-nums font-medium">
                      Page {currentVisiblePage} / {loadedPdf.pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => scrollToPage(currentVisiblePage + 1)}
                      disabled={currentVisiblePage >= loadedPdf.pageCount}
                      aria-label="Next page"
                      className="p-0.5 rounded hover:text-[#252536] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <span className="hidden sm:inline whitespace-nowrap shrink-0">
              {hasEditedAnything
                ? 'Click to type · Tab to next field · Drag over sample text to erase'
                : 'Click anywhere to type · Drag over sample text and press Delete to remove'}
            </span>
          </div>

          {/* Clean Continuous Multi-Page Document Canvas */}
          <div
            ref={viewerRef}
            className="w-full overflow-x-auto bg-[#EFEFF6] dark:bg-[#121526] px-3 sm:px-6 py-6 sm:py-8 min-h-[520px]"
          >
            <div className="flex flex-col items-center gap-6 sm:gap-8 w-max min-w-full">
              {loadedPdf.pagesMeta.map((pageMeta) => (
                <DirectTypePdfPage
                  key={pageMeta.pageNum}
                  pdfJsDoc={loadedPdf.pdfJsDoc}
                  pageMeta={pageMeta}
                  totalPages={loadedPdf.pageCount}
                  zoom={zoom}
                  layout={pageLayouts[pageMeta.pageNum]}
                  textEntries={entriesByPage.get(pageMeta.pageNum) || []}
                  whiteoutPatches={whiteoutsByPage.get(pageMeta.pageNum) || []}
                  interactiveFields={interactiveFieldsByPage.get(pageMeta.pageNum) || []}
                  interactiveValues={interactiveValues}
                  activeEntryId={activeEntryId}
                  activeSelection={activeSelection}
                  registerTextareaRef={registerTextareaRef}
                  registerInteractiveRef={registerInteractiveRef}
                  registerPageRef={registerPageRef}
                  onPageLayoutAnalyzed={handlePageLayoutAnalyzed}
                  onClickBlankPage={handleClickBlankPage}
                  onClickSlot={activateSlot}
                  onSelectPdfRegion={setActiveSelection}
                  onEraseSelectedRegion={handleEraseSelectedRegion}
                  onFocusEntry={handleFocusEntry}
                  onBlurEntry={handleBlurEntry}
                  onChangeEntryText={handleChangeEntryText}
                  onUpdateEntryStyle={handleUpdateEntryStyle}
                  onMoveEntry={handleMoveEntry}
                  onDeleteEntry={handleDeleteEntry}
                  onNavigateField={handleNavigateField}
                  onNavigateTableDown={handleNavigateTableDown}
                  onInteractiveFieldChange={handleInteractiveFieldChange}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quiet Next-Step Tool Suggestions */}
      {onSelectNextTool && (
        <RecommendedNextTools currentToolId="fill-pdf-form" onSelectTool={onSelectNextTool} />
      )}
    </div>
  );
};
