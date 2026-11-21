import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Type,
  Calendar,
  Image as ImageIcon,
  PenTool,
  Check,
  X,
  CheckSquare,
  Square,
  Circle,
  Minus,
  Slash,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  RotateCcw,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Trash2,
  Download,
  Save,
  FolderOpen,
  Sparkles,
  Magnet,
  Ruler,
  Frame,
  Columns2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Plus,
  Crop,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Layers,
  AlertCircle,
  Bookmark,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  PanelLeft,
} from 'lucide-react';
import {
  FormElement,
  TextFormElement,
  ImageFormElement,
  MarkFormElement,
  ShapeFormElement,
  FormFontFamily,
  FormMarkKind,
  FormShapeKind,
  FormTextAlign,
  PageRotationDeg,
  ReusableMediaAsset,
  ReusableTextSnippet,
  SuggestedFieldArea,
  FillPdfEditorSnapshot,
  ActiveEditorTool,
} from '../../types/fillPdfForm';
import {
  LoadedFormPdf,
  loadPdfForFormFilling,
  renderFormPdfPageToCanvas,
  renderPageThumbnailDataUrl,
  getDisplayedPageSize,
  rotateNormalizedRect,
  detectSuggestedFieldsOnPage,
  exportFilledPdf,
  saveFormProjectArchive,
  loadFormProjectArchive,
} from '../../services/pdf/fillPdfFormService';
import { SignaturePadModal } from './fill-pdf/SignaturePadModal';
import { ImageCropModal } from './fill-pdf/ImageCropModal';
import { BeforeAfterPrintModal } from './fill-pdf/BeforeAfterPrintModal';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { triggerToast } from '../common/Toast';
import { RecommendedNextTools } from './RecommendedNextTools';
import { ToolDefinition } from '../../config/toolsRegistry';
import { triggerDownload, readAsArrayBuffer, readAsDataURL, formatBytes } from '../../services/utils/downloadUtils';
import { trackToolCompleted, trackToolError } from '../../services/analytics/ga4Tracker';
import { consumeStagedFileForTool } from '../../services/utils/stagedFileService';

const uid = (prefix = 'el') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_TEXT_SNIPPETS: ReusableTextSnippet[] = [
  { id: 'snip_name', label: 'Full Name', text: 'Enter Your Full Name', fontSize: 13, color: '#0f172a', fontFamily: 'helvetica' },
  { id: 'snip_mobile', label: 'Mobile Number', text: '+91 98765 43210', fontSize: 12, color: '#0f172a', fontFamily: 'helvetica' },
  { id: 'snip_email', label: 'Email Address', text: 'name@example.com', fontSize: 12, color: '#0f172a', fontFamily: 'helvetica' },
  { id: 'snip_address', label: 'Address', text: 'House No., Street, City, State - PIN', fontSize: 11, color: '#0f172a', fontFamily: 'helvetica' },
];

const FONT_FAMILIES: Array<{ value: FormFontFamily; label: string; css: string }> = [
  { value: 'helvetica', label: 'Sans (Helvetica)', css: 'Helvetica, Arial, sans-serif' },
  { value: 'times', label: 'Serif (Times)', css: "Georgia, 'Times New Roman', serif" },
  { value: 'courier', label: 'Mono (Courier)', css: "'Courier New', Courier, monospace" },
  { value: 'devanagari', label: 'Hindi / Unicode', css: "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Nirmala UI', 'Mangal', sans-serif" },
];

const SWATCH_COLORS = ['#0f172a', '#1d4ed8', '#0f2557', '#dc2626', '#15803d', '#475569'];

const MARGIN_INSET = 0.055; // 5.5% page margin guide
const SNAP_THRESHOLD = 0.012;

interface SnapGuide {
  axis: 'x' | 'y';
  pos: number; // 0..1 normalized
}

interface PendingPlacementSlot {
  pageNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

function getTodayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getFontCss(family: FormFontFamily): string {
  return FONT_FAMILIES.find((f) => f.value === family)?.css || 'Helvetica, Arial, sans-serif';
}

function cloneSnapshot(snap: FillPdfEditorSnapshot): FillPdfEditorSnapshot {
  return {
    elements: snap.elements.map((el) => ({ ...el })),
    interactiveValues: { ...snap.interactiveValues },
    pageRotations: { ...snap.pageRotations },
  };
}

function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 300 });
    img.onerror = () => reject(new Error('Could not decode image file.'));
    img.src = dataUrl;
  });
}

interface FillPdfFormToolProps {
  tool?: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const FillPdfFormTool: React.FC<FillPdfFormToolProps> = ({ onSelectNextTool }) => {
  // Loaded PDF document state
  const [loadedPdf, setLoadedPdf] = useState<LoadedFormPdf | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Page navigation, thumbnails, and zoom
  const [activePage, setActivePage] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [zoom, setZoom] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<boolean>(true);
  const [pagePixelSize, setPagePixelSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  // Core editable document state
  const [elements, setElements] = useState<FormElement[]>([]);
  const [interactiveValues, setInteractiveValues] = useState<Record<string, string | boolean>>({});
  const [pageRotations, setPageRotations] = useState<Record<number, PageRotationDeg>>({});

  // History (Undo/Redo)
  const [undoStack, setUndoStack] = useState<FillPdfEditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<FillPdfEditorSnapshot[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Active tool, selection, inline text edit, clipboard
  const [activeTool, setActiveTool] = useState<ActiveEditorTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [clipboardElement, setClipboardElement] = useState<FormElement | null>(null);

  // Sidebar & workspace helpers
  const [leftTab, setLeftTab] = useState<'pages' | 'assets' | 'snippets'>('pages');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [showRulers, setShowRulers] = useState<boolean>(false);
  const [showMargins, setShowMargins] = useState<boolean>(false);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

  // Reusable Session Libraries (Photo/Signature + Text Snippets)
  const [mediaAssets, setMediaAssets] = useState<ReusableMediaAsset[]>([]);
  const [textSnippets, setTextSnippets] = useState<ReusableTextSnippet[]>(DEFAULT_TEXT_SNIPPETS);
  const [newSnippetLabel, setNewSnippetLabel] = useState('');
  const [newSnippetText, setNewSnippetText] = useState('');
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);

  // Optional Auto-Detect Form Fields state
  const [suggestions, setSuggestions] = useState<SuggestedFieldArea[]>([]);
  const [isDetectingFields, setIsDetectingFields] = useState<boolean>(false);
  const [detectStatus, setDetectStatus] = useState<string>('');
  const [detectUsedOcr, setDetectUsedOcr] = useState<boolean>(false);

  // Modals & export state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [pendingSlot, setPendingSlot] = useState<PendingPlacementSlot | null>(null);
  const [cropTargetElementId, setCropTargetElementId] = useState<string | null>(null);
  const [flattenOnExport, setFlattenOnExport] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportWarnings, setExportWarnings] = useState<string[]>([]);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [confirmResetDoc, setConfirmResetDoc] = useState<boolean>(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Before/After & Print Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewModalMode, setPreviewModalMode] = useState<'compare' | 'print'>('compare');
  const [previewExportBytes, setPreviewExportBytes] = useState<Uint8Array | null>(null);
  const [previewExportBlob, setPreviewExportBlob] = useState<Blob | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const workspaceScrollRef = useRef<HTMLDivElement | null>(null);
  const pageStageRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const dragSessionRef = useRef<{
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se';
    elementId: string;
    startClientX: number;
    startClientY: number;
    startEl: FormElement;
    stageRect: DOMRect;
    snapshotPushed: boolean;
  } | null>(null);

  // Current snapshot helper
  const getCurrentSnapshot = useCallback(
    (): FillPdfEditorSnapshot =>
      cloneSnapshot({
        elements,
        interactiveValues,
        pageRotations,
      }),
    [elements, interactiveValues, pageRotations]
  );

  const pushUndoSnapshot = useCallback(() => {
    const snap = getCurrentSnapshot();
    setUndoStack((prev) => [...prev.slice(-39), snap]);
    setRedoStack([]);
    setHasUnsavedChanges(true);
  }, [getCurrentSnapshot]);

  // Derived active page info
  const activePageMeta = useMemo(() => {
    if (!loadedPdf) return null;
    return loadedPdf.pagesMeta[activePage - 1] || null;
  }, [loadedPdf, activePage]);

  const activePageRotation: PageRotationDeg = pageRotations[activePage] || 0;

  const activePageDisplayedSize = useMemo(() => {
    if (!activePageMeta) return { width: 595, height: 842 };
    return getDisplayedPageSize(activePageMeta, activePageRotation);
  }, [activePageMeta, activePageRotation]);

  const pageElements = useMemo(
    () => elements.filter((el) => el.pageNum === activePage),
    [elements, activePage]
  );

  const pageInteractiveFields = useMemo(() => {
    if (!loadedPdf) return [];
    return loadedPdf.interactiveFields
      .filter((f) => f.pageNum === activePage)
      .map((f) => {
        const rotatedBox =
          activePageRotation === 0
            ? { x: f.x, y: f.y, width: f.width, height: f.height }
            : rotateNormalizedRect({ x: f.x, y: f.y, width: f.width, height: f.height }, activePageRotation);
        return { ...f, ...rotatedBox };
      })
      .sort((a, b) => (Math.abs(a.y - b.y) > 0.015 ? a.y - b.y : a.x - b.x));
  }, [loadedPdf, activePage, activePageRotation]);

  const pageSuggestions = useMemo(
    () => suggestions.filter((s) => s.pageNum === activePage),
    [suggestions, activePage]
  );

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId]
  );

  // Warn before accidentally closing/reloading tab with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || !loadedPdf) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges, loadedPdf]);

  // Open a PDF file
  const openPdfFile = useCallback(async (file: File) => {
    setIsLoadingFile(true);
    setLoadError(null);
    try {
      const buf = await readAsArrayBuffer(file);
      const rawBytes = new Uint8Array(buf);
      const loaded = await loadPdfForFormFilling(rawBytes);

      setLoadedPdf(loaded);
      setFileName(file.name);
      setFileSize(file.size);
      setActivePage(1);
      setThumbnails({});
      setElements([]);
      setInteractiveValues(loaded.initialInteractiveValues);
      setPageRotations({});
      setUndoStack([]);
      setRedoStack([]);
      setSelectedId(null);
      setEditingTextId(null);
      setSuggestions([]);
      setExportWarnings([]);
      setHasUnsavedChanges(false);
      setFitMode(true);
      setActiveTool('select');

      if (loaded.hasInteractiveForm) {
        triggerToast(
          'success',
          `Detected ${loaded.interactiveFields.length} existing fillable form field(s). You can fill them directly or add new text, photos, and signatures anywhere.`,
          'PDF Loaded'
        );
      } else {
        triggerToast('success', `Loaded ${loaded.pageCount} page(s). Click any tool above to add text, photos, or signatures.`, 'PDF Ready');
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not open this PDF file.';
      setLoadError(msg);
      trackToolError(msg, 'fill-pdf-form');
      triggerToast('error', msg, 'Upload Failed');
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  // Consume staged file if navigated from another PottoTools tool
  useEffect(() => {
    const staged = consumeStagedFileForTool();
    if (staged && staged.name.toLowerCase().endsWith('.pdf')) {
      openPdfFile(staged);
    }
  }, [openPdfFile]);

  // Reopen a saved `.pottoform` project file
  const handleReopenProjectFile = useCallback(async (file: File) => {
    setIsLoadingFile(true);
    setLoadError(null);
    try {
      const { pdfBytes, metadata } = await loadFormProjectArchive(file);
      const loaded = await loadPdfForFormFilling(pdfBytes);

      setLoadedPdf(loaded);
      setFileName(metadata.originalFileName || file.name.replace(/\.pottoform$/i, '.pdf'));
      setFileSize(pdfBytes.byteLength);
      setActivePage(Math.min(loaded.pageCount, Math.max(1, metadata.activePage || 1)));
      setThumbnails({});
      setElements(metadata.elements || []);
      setInteractiveValues({
        ...loaded.initialInteractiveValues,
        ...(metadata.interactiveValues || {}),
      });
      setPageRotations(metadata.pageRotations || {});
      if (Array.isArray(metadata.mediaAssets)) {
        setMediaAssets(metadata.mediaAssets);
      }
      if (Array.isArray(metadata.textSnippets) && metadata.textSnippets.length > 0) {
        setTextSnippets(metadata.textSnippets);
      }
      setUndoStack([]);
      setRedoStack([]);
      setSelectedId(null);
      setEditingTextId(null);
      setSuggestions([]);
      setHasUnsavedChanges(false);
      setFitMode(true);

      triggerToast(
        'success',
        `Restored "${metadata.originalFileName}" with ${metadata.elements.length} element(s).`,
        'Project Restored'
      );
    } catch (err: any) {
      const msg = err?.message || 'Could not open saved project file.';
      setLoadError(msg);
      triggerToast('error', msg, 'Reopen Failed');
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  // Compute fit-to-page zoom when container resizes or page changes
  const computeFitZoom = useCallback(() => {
    const container = workspaceScrollRef.current;
    if (!container || !activePageDisplayedSize.width) return 1.0;
    const availW = Math.max(260, container.clientWidth - (showRulers ? 64 : 44));
    const availH = Math.max(320, container.clientHeight - (showRulers ? 64 : 44));
    const scaleW = availW / activePageDisplayedSize.width;
    const scaleH = availH / activePageDisplayedSize.height;
    // Prefer fitting width comfortably on desktop while keeping reasonable bounds
    const target = Math.min(scaleW, Math.max(scaleH, Math.min(scaleW, 1.15)));
    return Math.max(0.35, Math.min(1.6, Number(target.toFixed(2))));
  }, [activePageDisplayedSize.width, activePageDisplayedSize.height, showRulers]);

  useEffect(() => {
    if (!loadedPdf || !fitMode) return;
    const update = () => setZoom(computeFitZoom());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [loadedPdf, fitMode, computeFitZoom]);

  // Render active PDF page onto main canvas whenever page, zoom, or rotation changes
  useEffect(() => {
    if (!loadedPdf || !canvasRef.current) return;
    let cancelled = false;

    const renderPage = async () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancellation
        }
        renderTaskRef.current = null;
      }

      setIsRenderingPage(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(120, Math.round(activePageDisplayedSize.width * zoom));
      const cssH = Math.max(120, Math.round(activePageDisplayedSize.height * zoom));
      setPagePixelSize({ width: cssW, height: cssH });

      try {
        await renderFormPdfPageToCanvas(
          loadedPdf.pdfJsDoc,
          activePage,
          canvas,
          zoom * dpr,
          activePageRotation,
          (task) => {
            renderTaskRef.current = task;
          }
        );
      } catch (err: any) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsRenderingPage(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [loadedPdf, activePage, zoom, activePageRotation, activePageDisplayedSize.width, activePageDisplayedSize.height]);

  // Lazily generate page thumbnails for the left sidebar
  useEffect(() => {
    if (!loadedPdf) return;
    let cancelled = false;

    const generateThumbs = async () => {
      for (let p = 1; p <= loadedPdf.pageCount; p++) {
        if (cancelled) return;
        const rot = pageRotations[p] || 0;
        const cacheKey = p;
        // Skip if already generated and not invalidated
        if (thumbnails[cacheKey]) continue;
        try {
          const url = await renderPageThumbnailDataUrl(loadedPdf.pdfJsDoc, p, rot, 144);
          if (!cancelled && url) {
            setThumbnails((prev) => (prev[p] ? prev : { ...prev, [p]: url }));
          }
        } catch {
          // continue next thumbnail
        }
      }
    };

    generateThumbs();
    return () => {
      cancelled = true;
    };
  }, [loadedPdf, thumbnails, pageRotations]);

  // Undo & Redo actions
  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      const current = getCurrentSnapshot();
      setRedoStack((r) => [...r.slice(-39), current]);
      setElements(previous.elements);
      setInteractiveValues(previous.interactiveValues);
      setPageRotations(previous.pageRotations);
      setSelectedId(null);
      setEditingTextId(null);
      return prev.slice(0, -1);
    });
  }, [getCurrentSnapshot]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[prev.length - 1];
      const current = getCurrentSnapshot();
      setUndoStack((u) => [...u.slice(-39), current]);
      setElements(next.elements);
      setInteractiveValues(next.interactiveValues);
      setPageRotations(next.pageRotations);
      setSelectedId(null);
      setEditingTextId(null);
      return prev.slice(0, -1);
    });
  }, [getCurrentSnapshot]);

  // Element mutation helpers
  const updateElement = useCallback((id: string, patch: Partial<FormElement>, recordUndo = false) => {
    if (recordUndo) pushUndoSnapshot();
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as FormElement) : el))
    );
    setHasUnsavedChanges(true);
  }, [pushUndoSnapshot]);

  const deleteElement = useCallback(
    (id: string) => {
      pushUndoSnapshot();
      setElements((prev) => prev.filter((el) => el.id !== id));
      setSelectedId((curr) => (curr === id ? null : curr));
      setEditingTextId((curr) => (curr === id ? null : curr));
    },
    [pushUndoSnapshot]
  );

  const duplicateElement = useCallback(
    (id: string) => {
      const target = elements.find((el) => el.id === id);
      if (!target) return;
      pushUndoSnapshot();
      const copy: FormElement = {
        ...target,
        id: uid(target.type),
        x: Math.min(1 - target.width, target.x + 0.025),
        y: Math.min(1 - target.height, target.y + 0.025),
      };
      setElements((prev) => [...prev, copy]);
      setSelectedId(copy.id);
      triggerToast('info', 'Element duplicated. You can move and edit this copy independently.', 'Duplicated');
    },
    [elements, pushUndoSnapshot]
  );

  const copySelectedElement = useCallback(() => {
    if (!selectedElement) return;
    setClipboardElement({ ...selectedElement });
    triggerToast('info', 'Copied! Switch to any page and click Paste (Ctrl+V).', 'Copied');
  }, [selectedElement]);

  const pasteClipboardElement = useCallback(() => {
    if (!clipboardElement) return;
    pushUndoSnapshot();
    const samePage = clipboardElement.pageNum === activePage;
    const pasted: FormElement = {
      ...clipboardElement,
      id: uid(clipboardElement.type),
      pageNum: activePage,
      x: samePage ? Math.min(1 - clipboardElement.width, clipboardElement.x + 0.03) : clipboardElement.x,
      y: samePage ? Math.min(1 - clipboardElement.height, clipboardElement.y + 0.03) : clipboardElement.y,
    };
    setElements((prev) => [...prev, pasted]);
    setSelectedId(pasted.id);
    triggerToast('success', `Pasted onto Page ${activePage}.`, 'Pasted');
  }, [clipboardElement, activePage, pushUndoSnapshot]);

  // Create new element at normalized (nx, ny)
  const createElementAt = useCallback(
    (tool: ActiveEditorTool, nx: number, ny: number) => {
      if (tool === 'select') return;
      pushUndoSnapshot();

      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

      if (tool === 'text' || tool === 'date') {
        const w = tool === 'date' ? 0.19 : 0.28;
        const h = 0.048;
        const el: TextFormElement = {
          id: uid(tool),
          type: tool,
          pageNum: activePage,
          x: clamp(nx - w * 0.1, 0.01, 1 - w),
          y: clamp(ny - h * 0.45, 0.01, 1 - h),
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          text: tool === 'date' ? getTodayFormatted() : '',
          fontFamily: 'helvetica',
          fontSize: 13,
          color: '#0f172a',
          bold: false,
          italic: false,
          align: 'left',
          backgroundColor: 'transparent',
        };
        setElements((prev) => [...prev, el]);
        setSelectedId(el.id);
        setEditingTextId(el.id);
        setActiveTool('select');
        return;
      }

      if (tool === 'check' || tool === 'cross' || tool === 'checkbox-empty' || tool === 'checkbox-checked') {
        const sizeW = 0.038;
        const sizeH = (sizeW * activePageDisplayedSize.width) / Math.max(1, activePageDisplayedSize.height);
        const el: MarkFormElement = {
          id: uid('mark'),
          type: 'mark',
          pageNum: activePage,
          x: clamp(nx - sizeW / 2, 0.005, 1 - sizeW),
          y: clamp(ny - sizeH / 2, 0.005, 1 - sizeH),
          width: sizeW,
          height: sizeH,
          rotation: 0,
          opacity: 1,
          markKind: tool as FormMarkKind,
          color: tool === 'cross' ? '#dc2626' : '#0f172a',
          strokeWidth: 2.2,
        };
        setElements((prev) => [...prev, el]);
        setSelectedId(el.id);
        setActiveTool('select');
        return;
      }

      if (tool === 'line-h' || tool === 'line-v' || tool === 'rect' || tool === 'circle') {
        const w = tool === 'line-v' ? 0.024 : tool === 'line-h' ? 0.28 : 0.16;
        const h = tool === 'line-h' ? 0.022 : tool === 'line-v' ? 0.22 : 0.09;
        const el: ShapeFormElement = {
          id: uid('shape'),
          type: 'shape',
          pageNum: activePage,
          x: clamp(nx - w / 2, 0.005, 1 - w),
          y: clamp(ny - h / 2, 0.005, 1 - h),
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          shapeKind: tool as FormShapeKind,
          strokeColor: '#0f172a',
          fillColor: 'transparent',
          strokeWidth: 1.8,
        };
        setElements((prev) => [...prev, el]);
        setSelectedId(el.id);
        setActiveTool('select');
      }
    },
    [activePage, activePageDisplayedSize.width, activePageDisplayedSize.height, pushUndoSnapshot]
  );

  // Place a Reusable Media Asset (photo or signature) as a brand-new independent copy
  const placeMediaAssetOnPage = useCallback(
    (
      asset: ReusableMediaAsset,
      pos?: { x: number; y: number; width?: number; height?: number; pageNum?: number }
    ) => {
      pushUndoSnapshot();
      const targetPage = pos?.pageNum || activePage;
      const imgAspect = asset.width / Math.max(1, asset.height);
      const pageAspect = activePageDisplayedSize.width / Math.max(1, activePageDisplayedSize.height);

      let w = pos?.width ?? (asset.kind === 'signature' ? 0.22 : 0.18);
      let h = pos?.height ?? (w * pageAspect) / Math.max(0.1, imgAspect);

      if (h > 0.35 && !pos?.height) {
        h = 0.24;
        w = (h * imgAspect) / Math.max(0.1, pageAspect);
      }
      w = Math.max(0.05, Math.min(0.65, w));
      h = Math.max(0.03, Math.min(0.55, h));

      const x = Math.max(0.01, Math.min(1 - w, pos ? pos.x : 0.5 - w / 2));
      const y = Math.max(0.01, Math.min(1 - h, pos ? pos.y : 0.35 - h / 2));

      const el: ImageFormElement = {
        id: uid(asset.kind === 'signature' ? 'sig' : 'img'),
        type: asset.kind === 'signature' ? 'signature' : 'image',
        pageNum: targetPage,
        x,
        y,
        width: w,
        height: h,
        rotation: 0,
        opacity: 1,
        dataUrl: asset.dataUrl,
        originalDataUrl: asset.dataUrl,
        sourceAssetId: asset.id,
        aspectRatio: imgAspect,
        lockAspectRatio: true,
      };
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      setActiveTool('select');
    },
    [activePage, activePageDisplayedSize.width, activePageDisplayedSize.height, pushUndoSnapshot]
  );

  // Place a Reusable Text Snippet as an independent text box
  const placeSnippetOnPage = useCallback(
    (snippet: ReusableTextSnippet, pos?: { x: number; y: number }) => {
      pushUndoSnapshot();
      const lines = snippet.text.split('\n');
      const w = Math.min(0.5, Math.max(0.22, Math.max(...lines.map((l) => l.length)) * 0.011 + 0.05));
      const h = Math.min(0.24, Math.max(0.042, lines.length * 0.03 + 0.015));
      const x = Math.max(0.01, Math.min(1 - w, pos ? pos.x : 0.14));
      const y = Math.max(0.01, Math.min(1 - h, pos ? pos.y : 0.22));

      const el: TextFormElement = {
        id: uid('text'),
        type: 'text',
        pageNum: activePage,
        x,
        y,
        width: w,
        height: h,
        rotation: 0,
        opacity: 1,
        text: snippet.text,
        fontFamily: snippet.fontFamily || 'helvetica',
        fontSize: snippet.fontSize || 12,
        color: snippet.color || '#0f172a',
        bold: false,
        italic: false,
        align: 'left',
        backgroundColor: 'transparent',
      };
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      setActiveTool('select');
    },
    [activePage, pushUndoSnapshot]
  );

  // Upload Photo/Image file handler (adds to Reusable Library AND places on page)
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type) && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      triggerToast('error', 'Please select a JPG, JPEG, or PNG image.', 'Unsupported Image');
      return;
    }

    try {
      const dataUrl = await readAsDataURL(file);
      const dims = await loadImageDimensions(dataUrl);
      const asset: ReusableMediaAsset = {
        id: uid('photo_asset'),
        kind: 'photo',
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Photo',
        dataUrl,
        width: dims.width,
        height: dims.height,
        createdAt: Date.now(),
      };
      setMediaAssets((prev) => [asset, ...prev]);

      if (pendingSlot) {
        placeMediaAssetOnPage(asset, pendingSlot);
        setPendingSlot(null);
      } else {
        placeMediaAssetOnPage(asset);
      }
      triggerToast('success', 'Photo added to page & saved in your session Assets library for reuse.', 'Photo Added');
    } catch (err: any) {
      triggerToast('error', err?.message || 'Could not load image.', 'Image Error');
    }
  };

  // Signature Modal confirm handler
  const handleSignatureConfirm = (result: {
    dataUrl: string;
    width: number;
    height: number;
    name: string;
    saveToLibrary: boolean;
  }) => {
    const asset: ReusableMediaAsset = {
      id: uid('sig_asset'),
      kind: 'signature',
      name: result.name || 'Signature',
      dataUrl: result.dataUrl,
      width: result.width,
      height: result.height,
      createdAt: Date.now(),
    };
    if (result.saveToLibrary) {
      setMediaAssets((prev) => [asset, ...prev]);
    }
    if (pendingSlot) {
      placeMediaAssetOnPage(asset, pendingSlot);
      setPendingSlot(null);
    } else {
      placeMediaAssetOnPage(asset);
    }
    setIsSignatureModalOpen(false);
    triggerToast(
      'success',
      result.saveToLibrary
        ? 'Signature added to page & saved in Reusable Assets.'
        : 'Signature added to page.',
      'Signature Added'
    );
  };

  // Rotate active page (90 CW, 90 CCW, 180) and transform all elements on that page cleanly
  const handleRotatePage = useCallback(
    (deltaCw: PageRotationDeg) => {
      if (!loadedPdf || deltaCw === 0) return;
      pushUndoSnapshot();
      const nextRot = (((pageRotations[activePage] || 0) + deltaCw) % 360) as PageRotationDeg;

      setPageRotations((prev) => ({ ...prev, [activePage]: nextRot }));
      setElements((prev) =>
        prev.map((el) => {
          if (el.pageNum !== activePage) return el;
          const rotated = rotateNormalizedRect(
            { x: el.x, y: el.y, width: el.width, height: el.height },
            deltaCw
          );
          return {
            ...el,
            ...rotated,
          } as FormElement;
        })
      );
      // Clear suggestions on rotated page so user can re-detect cleanly if desired
      setSuggestions((prev) => prev.filter((s) => s.pageNum !== activePage));
      // Invalidate thumbnail for active page so it refreshes in the new orientation
      setThumbnails((prev) => {
        const next = { ...prev };
        delete next[activePage];
        return next;
      });
      triggerToast('info', `Page ${activePage} rotated to ${nextRot}°. Elements adjusted automatically.`, 'Page Rotated');
    },
    [loadedPdf, activePage, pageRotations, pushUndoSnapshot]
  );

  // Optional Auto-Detect Form Fields on active page
  const handleAutoDetectFields = async () => {
    if (!loadedPdf || isDetectingFields) return;
    setIsDetectingFields(true);
    setDetectStatus('Scanning page labels...');
    try {
      const result = await detectSuggestedFieldsOnPage(
        loadedPdf.pdfJsDoc,
        activePage,
        activePageRotation,
        true,
        (msg) => setDetectStatus(msg)
      );
      setDetectUsedOcr(result.usedOcr);
      setSuggestions((prev) => [
        ...prev.filter((s) => s.pageNum !== activePage),
        ...result.suggestions,
      ]);

      if (result.suggestions.length === 0) {
        triggerToast(
          'info',
          'No common blank form fields were auto-detected on this page. You can click anywhere to place fields manually.',
          'Auto-Detect Complete'
        );
      } else {
        triggerToast(
          'success',
          `Found ${result.suggestions.length} suggested area(s). Approve any suggestion you want or dismiss the rest.`,
          'Suggestions Ready'
        );
      }
    } catch (err: any) {
      triggerToast('error', err?.message || 'Field detection could not complete.', 'Detection Error');
    } finally {
      setIsDetectingFields(false);
      setDetectStatus('');
    }
  };

  // Approve a suggested field area
  const approveSuggestion = useCallback(
    (s: SuggestedFieldArea) => {
      setSuggestions((prev) => prev.filter((item) => item.id !== s.id));

      if (s.category === 'photo') {
        const existingPhoto = mediaAssets.find((a) => a.kind === 'photo');
        if (existingPhoto) {
          placeMediaAssetOnPage(existingPhoto, {
            pageNum: s.pageNum,
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
          });
        } else {
          setPendingSlot({ pageNum: s.pageNum, x: s.x, y: s.y, width: s.width, height: s.height });
          photoInputRef.current?.click();
        }
        return;
      }

      if (s.category === 'signature') {
        const existingSig = mediaAssets.find((a) => a.kind === 'signature');
        if (existingSig) {
          placeMediaAssetOnPage(existingSig, {
            pageNum: s.pageNum,
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
          });
        } else {
          setPendingSlot({ pageNum: s.pageNum, x: s.x, y: s.y, width: s.width, height: s.height });
          setIsSignatureModalOpen(true);
        }
        return;
      }

      pushUndoSnapshot();

      if (s.category === 'checkbox') {
        const el: MarkFormElement = {
          id: uid('mark'),
          type: 'mark',
          pageNum: s.pageNum,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          rotation: 0,
          opacity: 1,
          markKind: 'check',
          color: '#0f172a',
          strokeWidth: 2.2,
        };
        setElements((prev) => [...prev, el]);
        setSelectedId(el.id);
        return;
      }

      const el: TextFormElement = {
        id: uid(s.category === 'date' ? 'date' : 'text'),
        type: s.category === 'date' ? 'date' : 'text',
        pageNum: s.pageNum,
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        rotation: 0,
        opacity: 1,
        text: s.category === 'date' ? getTodayFormatted() : '',
        fontFamily: 'helvetica',
        fontSize: 12,
        color: '#0f172a',
        bold: false,
        italic: false,
        align: 'left',
        backgroundColor: 'transparent',
      };
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      setEditingTextId(el.id);
    },
    [mediaAssets, placeMediaAssetOnPage, pushUndoSnapshot]
  );

  const approveAllTextSuggestions = () => {
    const actionable = pageSuggestions.filter((s) => s.category !== 'photo' && s.category !== 'signature');
    if (actionable.length === 0) return;
    pushUndoSnapshot();
    const created: FormElement[] = actionable.map((s) => {
      if (s.category === 'checkbox') {
        return {
          id: uid('mark'),
          type: 'mark',
          pageNum: s.pageNum,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          rotation: 0,
          opacity: 1,
          markKind: 'check',
          color: '#0f172a',
          strokeWidth: 2.2,
        } as MarkFormElement;
      }
      return {
        id: uid(s.category === 'date' ? 'date' : 'text'),
        type: s.category === 'date' ? 'date' : 'text',
        pageNum: s.pageNum,
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        rotation: 0,
        opacity: 1,
        text: s.category === 'date' ? getTodayFormatted() : '',
        fontFamily: 'helvetica',
        fontSize: 12,
        color: '#0f172a',
        bold: false,
        italic: false,
        align: 'left',
        backgroundColor: 'transparent',
      } as TextFormElement;
    });
    setElements((prev) => [...prev, ...created]);
    const approvedIds = new Set(actionable.map((a) => a.id));
    setSuggestions((prev) => prev.filter((s) => !approvedIds.has(s.id)));
    if (created[0]) {
      setSelectedId(created[0].id);
      if (created[0].type === 'text' || created[0].type === 'date') {
        setEditingTextId(created[0].id);
      }
    }
    triggerToast('success', `Added ${created.length} editable field(s). Use Tab to move between fields.`, 'Fields Approved');
  };

  // Pointer Move & Resize on elements (mouse + touch) with optional Snap Guides
  const startElementPointerDrag = (
    e: React.PointerEvent,
    el: FormElement,
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    e.stopPropagation();
    if (editingTextId === el.id && mode === 'move') return;

    const stage = pageStageRef.current;
    if (!stage) return;

    setSelectedId(el.id);
    if (editingTextId && editingTextId !== el.id) {
      setEditingTextId(null);
    }

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragSessionRef.current = {
      mode,
      elementId: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startEl: { ...el },
      stageRect: stage.getBoundingClientRect(),
      snapshotPushed: false,
    };
  };

  const handleElementPointerMove = (e: React.PointerEvent) => {
    const sess = dragSessionRef.current;
    if (!sess) return;
    e.stopPropagation();

    const dxPx = e.clientX - sess.startClientX;
    const dyPx = e.clientY - sess.startClientY;
    if (!sess.snapshotPushed && Math.hypot(dxPx, dyPx) > 2) {
      pushUndoSnapshot();
      sess.snapshotPushed = true;
    }
    if (!sess.snapshotPushed) return;

    const dx = dxPx / Math.max(1, sess.stageRect.width);
    const dy = dyPx / Math.max(1, sess.stageRect.height);
    const s = sess.startEl;

    let nx = s.x;
    let ny = s.y;
    let nw = s.width;
    let nh = s.height;
    const activeGuides: SnapGuide[] = [];

    if (sess.mode === 'move') {
      nx = Math.max(0, Math.min(1 - nw, s.x + dx));
      ny = Math.max(0, Math.min(1 - nh, s.y + dy));

      if (snapEnabled) {
        // Candidate X and Y snap targets (page center, margins, other elements on page)
        const xTargets: number[] = [0.5, MARGIN_INSET, 1 - MARGIN_INSET];
        const yTargets: number[] = [0.5, MARGIN_INSET, 1 - MARGIN_INSET];
        for (const other of pageElements) {
          if (other.id === s.id) continue;
          xTargets.push(other.x, other.x + other.width / 2, other.x + other.width);
          yTargets.push(other.y, other.y + other.height / 2, other.y + other.height);
        }

        // Snap left, center, or right edge
        const xChecks = [
          { val: nx, offset: 0 },
          { val: nx + nw / 2, offset: nw / 2 },
          { val: nx + nw, offset: nw },
        ];
        let bestXDist = SNAP_THRESHOLD;
        let snappedXPos: number | null = null;
        let snappedXTarget: number | null = null;
        for (const t of xTargets) {
          for (const c of xChecks) {
            const dist = Math.abs(c.val - t);
            if (dist < bestXDist) {
              bestXDist = dist;
              snappedXPos = t - c.offset;
              snappedXTarget = t;
            }
          }
        }
        if (snappedXPos !== null && snappedXTarget !== null) {
          nx = Math.max(0, Math.min(1 - nw, snappedXPos));
          activeGuides.push({ axis: 'x', pos: snappedXTarget });
        }

        // Snap top, middle, or bottom edge
        const yChecks = [
          { val: ny, offset: 0 },
          { val: ny + nh / 2, offset: nh / 2 },
          { val: ny + nh, offset: nh },
        ];
        let bestYDist = SNAP_THRESHOLD;
        let snappedYPos: number | null = null;
        let snappedYTarget: number | null = null;
        for (const t of yTargets) {
          for (const c of yChecks) {
            const dist = Math.abs(c.val - t);
            if (dist < bestYDist) {
              bestYDist = dist;
              snappedYPos = t - c.offset;
              snappedYTarget = t;
            }
          }
        }
        if (snappedYPos !== null && snappedYTarget !== null) {
          ny = Math.max(0, Math.min(1 - nh, snappedYPos));
          activeGuides.push({ axis: 'y', pos: snappedYTarget });
        }
      }
    } else {
      const minW = 0.025;
      const minH = 0.018;
      if (sess.mode.includes('e')) {
        nw = Math.max(minW, Math.min(1 - s.x, s.width + dx));
      }
      if (sess.mode.includes('s')) {
        nh = Math.max(minH, Math.min(1 - s.y, s.height + dy));
      }
      if (sess.mode.includes('w')) {
        const nextX = Math.max(0, Math.min(s.x + s.width - minW, s.x + dx));
        nw = s.x + s.width - nextX;
        nx = nextX;
      }
      if (sess.mode.includes('n')) {
        const nextY = Math.max(0, Math.min(s.y + s.height - minH, s.y + dy));
        nh = s.y + s.height - nextY;
        ny = nextY;
      }

      // Preserve aspect ratio for images/signatures when locked
      if ((s.type === 'image' || s.type === 'signature') && s.lockAspectRatio) {
        const pageAspect = activePageDisplayedSize.width / Math.max(1, activePageDisplayedSize.height);
        const normAspect = s.aspectRatio / Math.max(0.05, pageAspect);
        const desiredH = nw / Math.max(0.05, normAspect);
        if (ny + desiredH <= 1 && desiredH >= minH) {
          if (sess.mode.includes('n')) {
            ny = Math.max(0, s.y + s.height - desiredH);
          }
          nh = desiredH;
        }
      }
    }

    setSnapGuides(activeGuides);
    setElements((prev) =>
      prev.map((item) =>
        item.id === sess.elementId
          ? ({ ...item, x: nx, y: ny, width: nw, height: nh } as FormElement)
          : item
      )
    );
  };

  const handleElementPointerUp = () => {
    if (dragSessionRef.current) {
      dragSessionRef.current = null;
      setSnapGuides([]);
    }
  };

  // Stage click (places active tool or clears selection)
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const stage = pageStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height);

    if (activeTool !== 'select') {
      createElementAt(activeTool, nx, ny);
    } else {
      setSelectedId(null);
      setEditingTextId(null);
    }
  };

  // Drag & Drop from Reusable Assets / Text Snippets onto the PDF stage
  const handleStageDragOver = (e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes('application/x-potto-asset') ||
      e.dataTransfer.types.includes('application/x-potto-snippet')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleStageDrop = (e: React.DragEvent) => {
    const stage = pageStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const nx = Math.max(0, Math.min(0.95, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const ny = Math.max(0, Math.min(0.95, (e.clientY - rect.top) / Math.max(1, rect.height)));

    const assetId = e.dataTransfer.getData('application/x-potto-asset');
    if (assetId) {
      e.preventDefault();
      const asset = mediaAssets.find((a) => a.id === assetId);
      if (asset) {
        placeMediaAssetOnPage(asset, { x: nx, y: ny });
      }
      return;
    }

    const snippetId = e.dataTransfer.getData('application/x-potto-snippet');
    if (snippetId) {
      e.preventDefault();
      const snippet = textSnippets.find((s) => s.id === snippetId);
      if (snippet) {
        placeSnippetOnPage(snippet, { x: nx, y: ny });
      }
    }
  };

  // Tab-key navigation between editable text elements on the active page
  const orderedPageTextElements = useMemo(() => {
    return pageElements
      .filter((el): el is TextFormElement => el.type === 'text' || el.type === 'date')
      .sort((a, b) => (Math.abs(a.y - b.y) > 0.015 ? a.y - b.y : a.x - b.x));
  }, [pageElements]);

  const handleTextFieldTab = (e: React.KeyboardEvent, currentId: string) => {
    if (e.key !== 'Tab') return;
    if (orderedPageTextElements.length <= 1) return;
    e.preventDefault();
    const idx = orderedPageTextElements.findIndex((el) => el.id === currentId);
    if (idx < 0) return;
    const nextIdx = e.shiftKey
      ? (idx - 1 + orderedPageTextElements.length) % orderedPageTextElements.length
      : (idx + 1) % orderedPageTextElements.length;
    const nextEl = orderedPageTextElements[nextIdx];
    setSelectedId(nextEl.id);
    setEditingTextId(nextEl.id);
  };

  // Global keyboard shortcuts (Undo, Redo, Copy, Paste, Duplicate, Delete, Escape)
  useEffect(() => {
    if (!loadedPdf) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !isTyping) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y' && !isTyping) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !isTyping && selectedId) {
        e.preventDefault();
        copySelectedElement();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v' && !isTyping && clipboardElement) {
        e.preventDefault();
        pasteClipboardElement();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && !isTyping && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
        return;
      }
      if (e.key === 'Escape') {
        setEditingTextId(null);
        setSelectedId(null);
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    loadedPdf,
    selectedId,
    clipboardElement,
    handleUndo,
    handleRedo,
    copySelectedElement,
    pasteClipboardElement,
    duplicateElement,
    deleteElement,
  ]);

  // Save Project (.pottoform)
  const handleSaveProject = async () => {
    if (!loadedPdf) return;
    try {
      const blob = await saveFormProjectArchive({
        rawPdfBytes: loadedPdf.rawBytes,
        originalFileName: fileName || 'document.pdf',
        activePage,
        elements,
        interactiveValues,
        pageRotations,
        mediaAssets,
        textSnippets,
      });
      const baseName = (fileName || 'form').replace(/\.pdf$/i, '');
      triggerDownload(blob, `${baseName}.pottoform`);
      setHasUnsavedChanges(false);
      triggerToast(
        'success',
        'Saved your PDF, edits, reusable assets, and snippets into a .pottoform project file.',
        'Progress Saved'
      );
    } catch (err: any) {
      triggerToast('error', err?.message || 'Could not save project file.', 'Save Failed');
    }
  };

  // Generate real exported PDF bytes (shared by Download, Before/After Preview, and Print Preview)
  const runExport = useCallback(async () => {
    if (!loadedPdf) return null;
    setIsExporting(true);
    setExportProgress(10);
    setExportStatus('Preparing filled PDF...');
    try {
      const result = await exportFilledPdf({
        rawPdfBytes: loadedPdf.rawBytes,
        elements,
        interactiveFields: loadedPdf.interactiveFields,
        interactiveValues,
        pageRotations,
        flatten: flattenOnExport,
        onProgress: (pct, msg) => {
          setExportProgress(pct);
          setExportStatus(msg);
        },
      });
      setExportWarnings(result.warnings);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Export failed. Please try again.';
      trackToolError(msg, 'fill-pdf-form');
      triggerToast('error', msg, 'Export Error');
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [loadedPdf, elements, interactiveValues, pageRotations, flattenOnExport]);

  const handleDownloadPdf = async () => {
    const result = await runExport();
    if (!result) return;
    const baseName = (fileName || 'document').replace(/\.pdf$/i, '');
    triggerDownload(result.blob, `${baseName}_filled.pdf`);
    setHasUnsavedChanges(false);
    trackToolCompleted('pdf', result.bytes.byteLength, 'fill-pdf-form');
    triggerToast('success', 'Your filled PDF has been generated and downloaded.', 'Download Started');
  };

  const handleOpenPreviewModal = async (mode: 'compare' | 'print') => {
    const result = await runExport();
    if (!result) return;
    setPreviewExportBytes(result.bytes);
    setPreviewExportBlob(result.blob);
    setPreviewWarnings(result.warnings);
    setPreviewModalMode(mode);
    setPreviewModalOpen(true);
  };

  // Reusable Text Snippet CRUD
  const handleSaveSnippet = () => {
    const trimmedLabel = newSnippetLabel.trim();
    const trimmedText = newSnippetText.trim();
    if (!trimmedText) {
      triggerToast('error', 'Please enter text for the reusable snippet.', 'Empty Text');
      return;
    }
    if (editingSnippetId) {
      setTextSnippets((prev) =>
        prev.map((s) =>
          s.id === editingSnippetId
            ? { ...s, label: trimmedLabel || trimmedText.slice(0, 20), text: trimmedText }
            : s
        )
      );
      setEditingSnippetId(null);
    } else {
      setTextSnippets((prev) => [
        {
          id: uid('snip'),
          label: trimmedLabel || trimmedText.slice(0, 20),
          text: trimmedText,
          fontSize: 12,
          color: '#0f172a',
          fontFamily: 'helvetica',
        },
        ...prev,
      ]);
    }
    setNewSnippetLabel('');
    setNewSnippetText('');
  };

  // Render helper for Marks inside the workspace
  const renderMarkSvg = (el: MarkFormElement) => {
    const sw = el.strokeWidth || 2.2;
    if (el.markKind === 'check') {
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible">
          <path
            d="M4 13 L9.5 18.5 L20 6"
            fill="none"
            stroke={el.color}
            strokeWidth={sw + 0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    if (el.markKind === 'cross') {
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible">
          <path
            d="M5 5 L19 19 M19 5 L5 19"
            fill="none"
            stroke={el.color}
            strokeWidth={sw + 0.4}
            strokeLinecap="round"
          />
        </svg>
      );
    }
    if (el.markKind === 'checkbox-empty') {
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill="none"
            stroke={el.color}
            strokeWidth={sw}
          />
        </svg>
      );
    }
    if (el.markKind === 'checkbox-checked') {
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill="none"
            stroke={el.color}
            strokeWidth={sw}
          />
          <path
            d="M6.5 12.5 L10.5 16.5 L17.5 8"
            fill="none"
            stroke={el.color}
            strokeWidth={sw + 0.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <circle cx="12" cy="12" r="7" fill={el.color} />
      </svg>
    );
  };

  // Render helper for Shapes inside the workspace
  const renderShapeSvg = (el: ShapeFormElement) => {
    const sw = el.strokeWidth || 1.8;
    const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'none';
    if (el.shapeKind === 'line-h') {
      return (
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-full">
          <line x1="0" y1="5" x2="100" y2="5" stroke={el.strokeColor} strokeWidth={sw * 1.4} />
        </svg>
      );
    }
    if (el.shapeKind === 'line-v') {
      return (
        <svg viewBox="0 0 10 100" preserveAspectRatio="none" className="w-full h-full">
          <line x1="5" y1="0" x2="5" y2="100" stroke={el.strokeColor} strokeWidth={sw * 1.4} />
        </svg>
      );
    }
    if (el.shapeKind === 'circle') {
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <ellipse cx="50" cy="50" rx="47" ry="47" fill={fill} stroke={el.strokeColor} strokeWidth={sw * 1.6} />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <rect x="2" y="2" width="96" height="96" fill={fill} stroke={el.strokeColor} strokeWidth={sw * 1.6} />
      </svg>
    );
  };

  const cropTargetElement = useMemo(() => {
    if (!cropTargetElementId) return null;
    const found = elements.find((el) => el.id === cropTargetElementId);
    if (!found || (found.type !== 'image' && found.type !== 'signature')) return null;
    return found;
  }, [cropTargetElementId, elements]);

  const faqs = [
    {
      q: 'Can I fill a non-fillable or scanned PDF without converting it to Word?',
      a: 'Yes. FILL PDF FORM lets you click anywhere on any PDF—whether it is an application form, a scanned PDF, or an official document with no interactive fields—and type text, insert a passport photo, add your signature, place dates, and add tick marks directly.',
    },
    {
      q: 'How does the Reusable Photo & Signature Library work?',
      a: 'Upload your photo or create your signature once in the Assets sidebar. Drag or click to place it on as many pages as needed. Every placed copy is completely independent—resizing, rotating, or deleting one copy on a page will never alter other copies or delete the original from your library.',
    },
    {
      q: 'Are my personal documents, photos, or signatures uploaded to a server?',
      a: 'No. PDF rendering, editing, OCR field detection, project saving, and PDF export run locally inside your web browser. Your reusable photos and signatures stay only in the current editing session unless you explicitly download a .pottoform project file to your own device.',
    },
    {
      q: 'Can I type Hindi or Unicode text on a PDF form?',
      a: 'Yes. Select the "Hindi / Unicode" font family (or simply type Hindi/Devanagari or Unicode text in any text box). When exporting, standard English text is embedded as crisp vector text while Hindi and Unicode text is rendered cleanly at high resolution in the exact position you placed it.',
    },
    {
      q: 'Can I save my half-filled form and finish it later?',
      a: 'Yes. Click "Save Progress" to download a portable .pottoform file to your device. Later, click "Reopen Saved Project (.pottoform)" on this page to restore your PDF, all placed text/images/signatures, form field values, page rotations, and reusable libraries.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hidden file inputs for Photo upload and Reopen Project */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png"
        onChange={handlePhotoFileChange}
        className="hidden"
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".pottoform,application/zip"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) handleReopenProjectFile(f);
        }}
        className="hidden"
      />

      {/* UPLOAD STATE (No PDF loaded yet) */}
      {!loadedPdf ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <FileUploadZone
            acceptedFormats={['.pdf']}
            maxFileSizeMB={100}
            multiple={false}
            files={[]}
            onFilesSelected={(selected) => {
              if (selected[0]) openPdfFile(selected[0]);
            }}
            onRemoveFile={() => {}}
            disabled={isLoadingFile}
          />

          {isLoadingFile && (
            <div className="max-w-md mx-auto">
              <ProgressBar progress={65} statusText="Opening PDF and scanning form structure..." />
            </div>
          )}

          {loadError && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Could not open file</p>
                <p className="text-xs mt-0.5">{loadError}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Works on <strong>any PDF</strong> (fillable or scanned). Everything is processed locally in your browser.
              </span>
            </div>

            <button
              type="button"
              onClick={() => projectInputRef.current?.click()}
              disabled={isLoadingFile}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer shrink-0"
            >
              <FolderOpen className="w-4 h-4" />
              Reopen Saved Project (.pottoform)
            </button>
          </div>
        </div>
      ) : (
        /* MAIN INTERACTIVE EDITOR WORKSPACE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* TOP FILE & ACTION BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((v) => !v)}
                className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                title="Toggle Pages & Assets Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold truncate max-w-[180px] sm:max-w-[260px]" title={fileName}>
                  {fileName}
                </p>
                <p className="text-[11px] text-slate-400">
                  {loadedPdf.pageCount} page{loadedPdf.pageCount > 1 ? 's' : ''} · {formatBytes(fileSize)}
                  {loadedPdf.hasInteractiveForm ? ` · ${loadedPdf.interactiveFields.length} fillable fields` : ''}
                  {hasUnsavedChanges ? ' · Unsaved edits' : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleSaveProject}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                title="Save your current progress as a portable .pottoform file to reopen later"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Progress</span>
              </button>

              <button
                type="button"
                onClick={() => projectInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                title="Reopen a previously saved .pottoform project"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reopen</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPreviewModal('compare')}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Compare original PDF with your edited PDF"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Before / After</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPreviewModal('print')}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Open Print-Ready Preview and print directly"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? 'Exporting...' : 'Download PDF'}
              </button>

              {!confirmResetDoc ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetDoc(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close current PDF and open another"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 rounded-lg px-2 py-1 text-[11px]">
                  <span className="text-rose-200 font-semibold">Close PDF?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadedPdf(null);
                      setConfirmResetDoc(false);
                      setHasUnsavedChanges(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetDoc(false)}
                    className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* EXPORT PROGRESS BAR */}
          {isExporting && (
            <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
              <ProgressBar progress={exportProgress} statusText={exportStatus} />
            </div>
          )}

          {/* EXPORT WARNINGS (if any AcroForm limitations occurred) */}
          {exportWarnings.length > 0 && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Note:</span> {exportWarnings.join(' ')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportWarnings([])}
                className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* PRIMARY EDITING TOOLBAR */}
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200">
            {/* Core Insert Tools */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                title="Select & Move (Esc)"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTool === 'select'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MousePointer2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Select</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('text')}
                title="Click anywhere on PDF to add Text"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTool === 'text'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Text</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('date')}
                title="Click anywhere on PDF to insert Date"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTool === 'date'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Date</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingSlot(null);
                  photoInputRef.current?.click();
                }}
                title="Add Photo or Image (JPG/PNG)"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Photo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingSlot(null);
                  setIsSignatureModalOpen(true);
                }}
                title="Draw, Type, or Upload Digital Signature"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sign</span>
              </button>
            </div>

            {/* Marks & Checkboxes */}
            <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              {(
                [
                  { id: 'check', icon: Check, label: 'Tick Mark (✓)' },
                  { id: 'cross', icon: X, label: 'Cross Mark (✗)' },
                  { id: 'checkbox-checked', icon: CheckSquare, label: 'Checked Box' },
                  { id: 'checkbox-empty', icon: Square, label: 'Empty Checkbox' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveTool(m.id)}
                  title={`Click PDF to place ${m.label}`}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTool === m.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            {/* Shapes */}
            <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTool('line-h')}
                title="Horizontal Line"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTool === 'line-h' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('line-v')}
                title="Vertical Line"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTool === 'line-v' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Slash className="w-3.5 h-3.5 rotate-45" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('rect')}
                title="Rectangle Box"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('circle')}
                title="Circle / Oval"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional Auto-Detect Fields */}
            <button
              type="button"
              onClick={handleAutoDetectFields}
              disabled={isDetectingFields}
              title="Optional: scan this page to suggest likely Name, Date, Address, Photo & Signature areas"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDetectingFields ? 'animate-spin' : ''}`} />
              <span>{isDetectingFields ? detectStatus || 'Scanning...' : 'Auto-Detect'}</span>
            </button>

            <div className="flex-1" />

            {/* Undo / Redo / Copy / Paste */}
            <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={copySelectedElement}
                disabled={!selectedId}
                title="Copy selected element (Ctrl+C)"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={pasteClipboardElement}
                disabled={!clipboardElement}
                title="Paste copied element onto current page (Ctrl+V)"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignment / Guides / Page Rotation / Zoom */}
            <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSnapEnabled((v) => !v)}
                title="Toggle Snap-to-Alignment Guides"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  snapEnabled ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Magnet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowRulers((v) => !v)}
                title="Toggle Page Rulers"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showRulers ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowMargins((v) => !v)}
                title="Toggle Page Margin Guides"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showMargins ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Frame className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={() => handleRotatePage(270)}
                title="Rotate Current Page 90° Counter-Clockwise"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRotatePage(90)}
                title="Rotate Current Page 90° Clockwise"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRotatePage(180)}
                title="Rotate Current Page 180°"
                className="px-1.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                180°
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={() => {
                  setFitMode(false);
                  setZoom((z) => Math.max(0.35, Number((z - 0.15).toFixed(2))));
                }}
                title="Zoom Out"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-700 w-10 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  setFitMode(false);
                  setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))));
                }}
                title="Zoom In"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitMode(true);
                  setZoom(computeFitZoom());
                }}
                title="Fit Page to Workspace"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  fitMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ACTIVE TOOL PLACEMENT HINT OR SUGGESTIONS BANNER */}
          {activeTool !== 'select' && (
            <div className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold flex items-center justify-between">
              <span>
                Click anywhere on Page {activePage} to place{' '}
                <strong className="uppercase">{activeTool.replace('-', ' ')}</strong>.
              </span>
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[11px] font-bold cursor-pointer"
              >
                Cancel (Esc)
              </button>
            </div>
          )}

          {pageSuggestions.length > 0 && (
            <div className="px-4 py-2 bg-cyan-50 border-b border-cyan-200 flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>
                  <strong>{pageSuggestions.length} suggested area(s)</strong> on Page {activePage}
                  {detectUsedOcr ? ' (via OCR)' : ''}. Click <strong>Approve</strong> on any box you want to use.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={approveAllTextSuggestions}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                >
                  Approve All Text Fields
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestions((prev) => prev.filter((s) => s.pageNum !== activePage))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-cyan-300 text-cyan-800 hover:bg-cyan-100 font-semibold cursor-pointer"
                >
                  Dismiss All
                </button>
              </div>
            </div>
          )}

          {/* 3-COLUMN WORKSPACE BODY */}
          <div className="flex flex-col lg:flex-row min-h-[640px] lg:h-[76vh] relative">
            {/* LEFT SIDEBAR: Pages / Reusable Photo & Signature Library / Reusable Text Library */}
            <aside
              className={`${
                mobileSidebarOpen ? 'flex' : 'hidden lg:flex'
              } flex-col w-full lg:w-[252px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 max-h-[380px] lg:max-h-none`}
            >
              {/* Sidebar Tabs */}
              <div className="grid grid-cols-3 border-b border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setLeftTab('pages')}
                  className={`py-2.5 text-[11px] font-bold flex flex-col items-center gap-0.5 border-b-2 transition-colors cursor-pointer ${
                    leftTab === 'pages'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Pages ({loadedPdf.pageCount})
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('assets')}
                  className={`py-2.5 text-[11px] font-bold flex flex-col items-center gap-0.5 border-b-2 transition-colors cursor-pointer ${
                    leftTab === 'assets'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Assets ({mediaAssets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('snippets')}
                  className={`py-2.5 text-[11px] font-bold flex flex-col items-center gap-0.5 border-b-2 transition-colors cursor-pointer ${
                    leftTab === 'snippets'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Snippets
                </button>
              </div>

              {/* TAB 1: PAGE THUMBNAILS */}
              {leftTab === 'pages' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {Array.from({ length: loadedPdf.pageCount }, (_, i) => i + 1).map((pNum) => {
                    const count = elements.filter((el) => el.pageNum === pNum).length;
                    const rot = pageRotations[pNum] || 0;
                    const isActive = pNum === activePage;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => {
                          setActivePage(pNum);
                          setSelectedId(null);
                          setEditingTextId(null);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="aspect-[3/4] w-full max-h-[148px] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/80 mb-1.5">
                          {thumbnails[pNum] ? (
                            <img
                              src={thumbnails[pNum]}
                              alt={`Page ${pNum}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400">Page {pNum}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                            Page {pNum}
                          </span>
                          <div className="flex items-center gap-1">
                            {rot !== 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                                {rot}°
                              </span>
                            )}
                            {count > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                                {count} edit{count > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: REUSABLE PHOTO & SIGNATURE LIBRARY */}
              {leftTab === 'assets' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingSlot(null);
                        photoInputRef.current?.click();
                      }}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-xs font-bold text-slate-700 hover:text-indigo-700 cursor-pointer transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      Add Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingSlot(null);
                        setIsSignatureModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-xs font-bold text-slate-700 hover:text-indigo-700 cursor-pointer transition-colors"
                    >
                      <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                      Add Sign
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Upload once, reuse on any page. Drag onto the PDF or click <strong>Place</strong>. Deleting a copy on a page never removes it here.
                  </p>

                  {mediaAssets.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-1.5">
                      <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No session assets yet</p>
                      <p className="text-[11px] text-slate-400">
                        Uploaded photos & signatures stay in this session only.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mediaAssets.map((asset) => (
                        <div
                          key={asset.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-potto-asset', asset.id);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          className="p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs space-y-2 cursor-grab active:cursor-grabbing"
                        >
                          <div className="h-20 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden p-1.5">
                            <img
                              src={asset.dataUrl}
                              alt={asset.name}
                              className="max-w-full max-h-full object-contain pointer-events-none"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">{asset.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                                {asset.kind}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => placeMediaAssetOnPage(asset)}
                                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer"
                                title="Place an independent copy onto current page"
                              >
                                Place
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setMediaAssets((prev) => prev.filter((a) => a.id !== asset.id))
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Remove from reusable library"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REUSABLE TEXT SNIPPETS LIBRARY */}
              {leftTab === 'snippets' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <p className="text-[11px] font-bold text-slate-700">
                      {editingSnippetId ? 'Edit Text Snippet' : 'Save Reusable Text'}
                    </p>
                    <input
                      type="text"
                      value={newSnippetLabel}
                      onChange={(e) => setNewSnippetLabel(e.target.value)}
                      placeholder="Label (e.g. Father's Name, Office)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                      rows={2}
                      value={newSnippetText}
                      onChange={(e) => setNewSnippetText(e.target.value)}
                      placeholder="Text to reuse across pages..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSaveSnippet}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {editingSnippetId ? 'Update' : 'Add Snippet'}
                      </button>
                      {editingSnippetId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSnippetId(null);
                            setNewSnippetLabel('');
                            setNewSnippetText('');
                          }}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Click <strong>Place</strong> or drag any snippet onto the PDF.
                  </p>

                  <div className="space-y-2">
                    {textSnippets.map((snip) => (
                      <div
                        key={snip.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/x-potto-snippet', snip.id);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 space-y-1.5 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-slate-800 truncate">{snip.label}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => placeSnippetOnPage(snip)}
                              className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Place
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSnippetId(snip.id);
                                setNewSnippetLabel(snip.label);
                                setNewSnippetText(snip.text);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                              title="Edit snippet"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTextSnippets((prev) => prev.filter((s) => s.id !== snip.id))
                              }
                              className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete snippet"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 whitespace-pre-wrap">
                          {snip.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* CENTER PDF CANVAS WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-200/75">
              {/* Scrollable Canvas Stage */}
              <div
                ref={workspaceScrollRef}
                className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center relative"
              >
                <div className="inline-flex flex-col items-start">
                  {/* Optional Top Horizontal Ruler */}
                  {showRulers && (
                    <div
                      className="ml-6 h-5 bg-slate-100 border border-b-0 border-slate-300 relative overflow-hidden select-none"
                      style={{ width: pagePixelSize.width }}
                    >
                      {Array.from(
                        { length: Math.ceil(activePageDisplayedSize.width / 50) + 1 },
                        (_, idx) => idx * 50
                      ).map((pt) => {
                        const leftPx = pt * zoom;
                        if (leftPx > pagePixelSize.width) return null;
                        return (
                          <div
                            key={pt}
                            className="absolute top-0 bottom-0 border-l border-slate-400/70 text-[9px] text-slate-500 pl-0.5 leading-tight"
                            style={{ left: leftPx }}
                          >
                            {pt}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-start">
                    {/* Optional Left Vertical Ruler */}
                    {showRulers && (
                      <div
                        className="w-6 bg-slate-100 border border-r-0 border-slate-300 relative overflow-hidden select-none shrink-0"
                        style={{ height: pagePixelSize.height }}
                      >
                        {Array.from(
                          { length: Math.ceil(activePageDisplayedSize.height / 50) + 1 },
                          (_, idx) => idx * 50
                        ).map((pt) => {
                          const topPx = pt * zoom;
                          if (topPx > pagePixelSize.height) return null;
                          return (
                            <div
                              key={pt}
                              className="absolute left-0 right-0 border-t border-slate-400/70 text-[8px] text-slate-500 px-0.5 leading-none"
                              style={{ top: topPx }}
                            >
                              {pt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ACTUAL PDF PAGE STAGE */}
                    <div
                      ref={pageStageRef}
                      onClick={handleStageClick}
                      onDragOver={handleStageDragOver}
                      onDrop={handleStageDrop}
                      className={`relative bg-white shadow-xl border border-slate-300 select-none ${
                        activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
                      }`}
                      style={{
                        width: pagePixelSize.width,
                        height: pagePixelSize.height,
                      }}
                    >
                      {/* Base PDF Canvas */}
                      <canvas
                        ref={canvasRef}
                        className="block w-full h-full pointer-events-none"
                        style={{
                          width: pagePixelSize.width,
                          height: pagePixelSize.height,
                        }}
                      />

                      {isRenderingPage && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-semibold pointer-events-none">
                          Rendering...
                        </div>
                      )}

                      {/* Optional Page Margin Guides */}
                      {showMargins && (
                        <div
                          className="absolute border border-dashed border-sky-400/80 pointer-events-none"
                          style={{
                            left: `${MARGIN_INSET * 100}%`,
                            top: `${MARGIN_INSET * 100}%`,
                            width: `${(1 - MARGIN_INSET * 2) * 100}%`,
                            height: `${(1 - MARGIN_INSET * 2) * 100}%`,
                          }}
                        />
                      )}

                      {/* Dynamic Snap Alignment Guide Lines */}
                      {snapGuides.map((g, idx) =>
                        g.axis === 'x' ? (
                          <div
                            key={`gx_${idx}`}
                            className="absolute top-0 bottom-0 w-px bg-fuchsia-500 pointer-events-none z-40"
                            style={{ left: `${g.pos * 100}%` }}
                          />
                        ) : (
                          <div
                            key={`gy_${idx}`}
                            className="absolute left-0 right-0 h-px bg-fuchsia-500 pointer-events-none z-40"
                            style={{ top: `${g.pos * 100}%` }}
                          />
                        )
                      )}

                      {/* EXISTING INTERACTIVE ACROFORM FIELDS */}
                      {pageInteractiveFields.map((field) => {
                        const val = interactiveValues[field.fieldName];
                        const boxStyle: React.CSSProperties = {
                          left: `${field.x * 100}%`,
                          top: `${field.y * 100}%`,
                          width: `${field.width * 100}%`,
                          height: `${field.height * 100}%`,
                        };

                        if (field.type === 'checkbox') {
                          const checked = Boolean(val);
                          return (
                            <label
                              key={field.id}
                              style={boxStyle}
                              onClick={(e) => e.stopPropagation()}
                              title={`Fillable Checkbox: ${field.fieldName}`}
                              className="absolute z-10 flex items-center justify-center bg-indigo-50/40 hover:bg-indigo-100/60 border border-indigo-400/70 rounded-[2px] cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={field.readOnly}
                                onChange={(e) => {
                                  pushUndoSnapshot();
                                  setInteractiveValues((prev) => ({
                                    ...prev,
                                    [field.fieldName]: e.target.checked,
                                  }));
                                }}
                                className="w-3/4 h-3/4 accent-indigo-600 cursor-pointer"
                              />
                            </label>
                          );
                        }

                        if (field.type === 'radio') {
                          const isSelected = String(val || '') === (field.exportValue || '');
                          return (
                            <label
                              key={field.id}
                              style={boxStyle}
                              onClick={(e) => e.stopPropagation()}
                              title={`Radio Option (${field.exportValue || field.fieldName})`}
                              className="absolute z-10 flex items-center justify-center bg-indigo-50/40 hover:bg-indigo-100/60 border border-indigo-400/70 rounded-full cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500"
                            >
                              <input
                                type="radio"
                                name={`acro_${field.fieldName}`}
                                checked={isSelected}
                                disabled={field.readOnly}
                                onChange={() => {
                                  pushUndoSnapshot();
                                  setInteractiveValues((prev) => ({
                                    ...prev,
                                    [field.fieldName]: field.exportValue || '',
                                  }));
                                }}
                                className="w-3/4 h-3/4 accent-indigo-600 cursor-pointer"
                              />
                            </label>
                          );
                        }

                        if (field.type === 'dropdown') {
                          return (
                            <select
                              key={field.id}
                              style={{ ...boxStyle, fontSize: Math.max(9, Math.round(11 * zoom)) }}
                              value={String(val || '')}
                              disabled={field.readOnly}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                pushUndoSnapshot();
                                setInteractiveValues((prev) => ({
                                  ...prev,
                                  [field.fieldName]: e.target.value,
                                }));
                              }}
                              title={`Dropdown: ${field.fieldName}`}
                              className="absolute z-10 bg-indigo-50/55 hover:bg-indigo-50/85 border border-indigo-400/80 text-slate-900 px-1 rounded-[2px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            >
                              <option value="">-- Select --</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          );
                        }

                        const textVal = String(val ?? '');
                        const estFontPx = Math.max(
                          9,
                          Math.min(18, Math.round(field.height * pagePixelSize.height * (field.multiline ? 0.24 : 0.62)))
                        );

                        return field.multiline ? (
                          <textarea
                            key={field.id}
                            value={textVal}
                            disabled={field.readOnly}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              setInteractiveValues((prev) => ({
                                ...prev,
                                [field.fieldName]: e.target.value,
                              }));
                              setHasUnsavedChanges(true);
                            }}
                            title={`Fillable Field: ${field.fieldName}`}
                            style={{ ...boxStyle, fontSize: estFontPx }}
                            className="absolute z-10 bg-indigo-50/45 hover:bg-indigo-50/80 focus:bg-white/95 border border-indigo-400/75 text-slate-900 px-1 py-0.5 rounded-[2px] resize-none leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <input
                            key={field.id}
                            type="text"
                            value={textVal}
                            disabled={field.readOnly}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              setInteractiveValues((prev) => ({
                                ...prev,
                                [field.fieldName]: e.target.value,
                              }));
                              setHasUnsavedChanges(true);
                            }}
                            title={`Fillable Field: ${field.fieldName}`}
                            style={{ ...boxStyle, fontSize: estFontPx }}
                            className="absolute z-10 bg-indigo-50/45 hover:bg-indigo-50/80 focus:bg-white/95 border border-indigo-400/75 text-slate-900 px-1 rounded-[2px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        );
                      })}

                      {/* OPTIONAL AUTO-DETECTED SUGGESTION OVERLAYS */}
                      {pageSuggestions.map((s) => (
                        <div
                          key={s.id}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            left: `${s.x * 100}%`,
                            top: `${s.y * 100}%`,
                            width: `${s.width * 100}%`,
                            height: `${s.height * 100}%`,
                          }}
                          className="absolute z-20 border-2 border-dashed border-cyan-500 bg-cyan-400/12 rounded-md flex items-center justify-center group"
                        >
                          <div className="absolute -top-6 left-0 flex items-center gap-1 bg-slate-900 text-white rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow whitespace-nowrap">
                            <span>{s.label}</span>
                            <button
                              type="button"
                              onClick={() => approveSuggestion(s)}
                              className="px-1 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer"
                              title="Approve and place editable field here"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setSuggestions((prev) => prev.filter((item) => item.id !== s.id))
                              }
                              className="px-1 py-0.5 rounded bg-slate-700 hover:bg-rose-500 text-white cursor-pointer"
                              title="Dismiss suggestion"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* USER-PLACED FORM ELEMENTS */}
                      {pageElements.map((el) => {
                        const isSelected = el.id === selectedId;
                        const isEditingThis = editingTextId === el.id;

                        return (
                          <div
                            key={el.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(el.id);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (el.type === 'text' || el.type === 'date') {
                                setSelectedId(el.id);
                                setEditingTextId(el.id);
                              }
                            }}
                            onPointerDown={(e) => startElementPointerDrag(e, el, 'move')}
                            onPointerMove={handleElementPointerMove}
                            onPointerUp={handleElementPointerUp}
                            style={{
                              left: `${el.x * 100}%`,
                              top: `${el.y * 100}%`,
                              width: `${el.width * 100}%`,
                              height: `${el.height * 100}%`,
                              opacity: el.opacity ?? 1,
                              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                              touchAction: 'none',
                            }}
                            className={`absolute z-30 group ${
                              isSelected
                                ? 'ring-2 ring-indigo-600 bg-indigo-50/15'
                                : 'hover:ring-1 hover:ring-indigo-400/80'
                            } ${isEditingThis ? 'cursor-text' : 'cursor-move'}`}
                          >
                            {/* ELEMENT CONTENT */}
                            {(el.type === 'text' || el.type === 'date') && (
                              <div
                                className="w-full h-full overflow-hidden flex items-start"
                                style={{
                                  backgroundColor:
                                    el.backgroundColor && el.backgroundColor !== 'transparent'
                                      ? el.backgroundColor
                                      : 'transparent',
                                }}
                              >
                                {isEditingThis ? (
                                  <textarea
                                    autoFocus
                                    value={el.text}
                                    onChange={(e) => updateElement(el.id, { text: e.target.value })}
                                    onKeyDown={(e) => handleTextFieldTab(e, el.id)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    placeholder={el.type === 'date' ? 'DD/MM/YYYY' : 'Type text...'}
                                    style={{
                                      fontFamily: getFontCss(el.fontFamily),
                                      fontSize: `${Math.max(8, el.fontSize * zoom)}px`,
                                      color: el.color,
                                      fontWeight: el.bold ? 700 : 400,
                                      fontStyle: el.italic ? 'italic' : 'normal',
                                      textAlign: el.align,
                                      lineHeight: 1.28,
                                    }}
                                    className="w-full h-full bg-white/85 px-1 py-0.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xs"
                                  />
                                ) : (
                                  <div
                                    tabIndex={0}
                                    onFocus={() => setSelectedId(el.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setEditingTextId(el.id);
                                      } else {
                                        handleTextFieldTab(e, el.id);
                                      }
                                    }}
                                    style={{
                                      fontFamily: getFontCss(el.fontFamily),
                                      fontSize: `${Math.max(8, el.fontSize * zoom)}px`,
                                      color: el.color,
                                      fontWeight: el.bold ? 700 : 400,
                                      fontStyle: el.italic ? 'italic' : 'normal',
                                      textAlign: el.align,
                                      lineHeight: 1.28,
                                    }}
                                    className="w-full h-full px-1 py-0.5 whitespace-pre-wrap break-words focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    {el.text || (
                                      <span className="text-slate-400 italic text-[11px]">
                                        Double-click to type...
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {(el.type === 'image' || el.type === 'signature') && (
                              <img
                                src={el.dataUrl}
                                alt={el.type}
                                draggable={false}
                                className="w-full h-full object-contain pointer-events-none select-none"
                              />
                            )}

                            {el.type === 'mark' && (
                              <div className="w-full h-full pointer-events-none">
                                {renderMarkSvg(el)}
                              </div>
                            )}

                            {el.type === 'shape' && (
                              <div className="w-full h-full pointer-events-none">
                                {renderShapeSvg(el)}
                              </div>
                            )}

                            {/* FLOATING QUICK ACTION BAR WHEN SELECTED */}
                            {isSelected && (
                              <div
                                onPointerDown={(e) => e.stopPropagation()}
                                className="absolute -top-8 left-0 flex items-center gap-0.5 bg-slate-900 text-white rounded-lg px-1 py-0.5 shadow-md z-40"
                              >
                                {(el.type === 'text' || el.type === 'date') && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingTextId((curr) => (curr === el.id ? null : el.id))
                                    }
                                    title="Edit Text"
                                    className="p-1 rounded hover:bg-slate-700 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                                {(el.type === 'image' || el.type === 'signature') && (
                                  <button
                                    type="button"
                                    onClick={() => setCropTargetElementId(el.id)}
                                    title="Crop & Rotate Image"
                                    className="p-1 rounded hover:bg-slate-700 cursor-pointer"
                                  >
                                    <Crop className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => duplicateElement(el.id)}
                                  title="Duplicate (Ctrl+D)"
                                  className="p-1 rounded hover:bg-slate-700 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteElement(el.id)}
                                  title="Delete (Del)"
                                  className="p-1 rounded hover:bg-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* 4 CORNER RESIZE HANDLES */}
                            {isSelected &&
                              (['nw', 'ne', 'sw', 'se'] as const).map((corner) => {
                                const posClass =
                                  corner === 'nw'
                                    ? '-top-1.5 -left-1.5 cursor-nwse-resize'
                                    : corner === 'ne'
                                    ? '-top-1.5 -right-1.5 cursor-nesw-resize'
                                    : corner === 'sw'
                                    ? '-bottom-1.5 -left-1.5 cursor-nesw-resize'
                                    : '-bottom-1.5 -right-1.5 cursor-nwse-resize';
                                return (
                                  <div
                                    key={corner}
                                    onPointerDown={(e) => startElementPointerDrag(e, el, corner)}
                                    onPointerMove={handleElementPointerMove}
                                    onPointerUp={handleElementPointerUp}
                                    className={`absolute w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow-xs z-40 ${posClass}`}
                                  />
                                );
                              })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM PAGE NAVIGATION BAR */}
              <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activePage <= 1}
                    onClick={() => {
                      setActivePage((p) => Math.max(1, p - 1));
                      setSelectedId(null);
                      setEditingTextId(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <span className="font-bold text-slate-700 tabular-nums">
                    Page {activePage} of {loadedPdf.pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={activePage >= loadedPdf.pageCount}
                    onClick={() => {
                      setActivePage((p) => Math.min(loadedPdf.pageCount, p + 1));
                      setSelectedId(null);
                      setEditingTextId(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
                  <span>
                    {Math.round(activePageDisplayedSize.width)} × {Math.round(activePageDisplayedSize.height)} pt
                    {activePageRotation !== 0 ? ` · Rotated ${activePageRotation}°` : ''}
                  </span>
                  <span>·</span>
                  <span>Double-click text to edit · Tab to jump fields</span>
                </div>
              </div>
            </div>

            {/* RIGHT PROPERTIES PANEL */}
            <aside className="w-full lg:w-[268px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white overflow-y-auto p-4 space-y-5">
              {selectedElement ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                        {selectedElement.type} Properties
                      </p>
                      <p className="text-[11px] text-slate-400">Page {selectedElement.pageNum}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(null);
                        setEditingTextId(null);
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>

                  {/* TEXT / DATE PROPERTIES */}
                  {(selectedElement.type === 'text' || selectedElement.type === 'date') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Text Content
                        </label>
                        <textarea
                          rows={3}
                          value={selectedElement.text}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { text: e.target.value })
                          }
                          placeholder="Type English, Hindi, or Unicode text..."
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                        />
                        {selectedElement.type === 'date' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, { text: getTodayFormatted() }, true)
                            }
                            className="mt-1 text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Insert today ({getTodayFormatted()})
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Font Family
                        </label>
                        <select
                          value={selectedElement.fontFamily}
                          onChange={(e) =>
                            updateElement(
                              selectedElement.id,
                              { fontFamily: e.target.value as FormFontFamily },
                              true
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {FONT_FAMILIES.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Size (pt)
                          </label>
                          <input
                            type="number"
                            min={6}
                            max={72}
                            value={selectedElement.fontSize}
                            onChange={(e) =>
                              updateElement(selectedElement.id, {
                                fontSize: Math.max(6, Math.min(72, Number(e.target.value) || 12)),
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Style
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateElement(
                                  selectedElement.id,
                                  { bold: !selectedElement.bold },
                                  true
                                )
                              }
                              className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center cursor-pointer ${
                                selectedElement.bold
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                              title="Bold"
                            >
                              <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateElement(
                                  selectedElement.id,
                                  { italic: !selectedElement.italic },
                                  true
                                )
                              }
                              className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center cursor-pointer ${
                                selectedElement.italic
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                              title="Italic"
                            >
                              <Italic className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(
                            [
                              { val: 'left', icon: AlignLeft },
                              { val: 'center', icon: AlignCenter },
                              { val: 'right', icon: AlignRight },
                            ] as Array<{ val: FormTextAlign; icon: any }>
                          ).map((a) => (
                            <button
                              key={a.val}
                              type="button"
                              onClick={() =>
                                updateElement(selectedElement.id, { align: a.val }, true)
                              }
                              className={`py-1.5 rounded-lg border flex items-center justify-center cursor-pointer ${
                                selectedElement.align === a.val
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <a.icon className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Text Color
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {SWATCH_COLORS.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => updateElement(selectedElement.id, { color: hex }, true)}
                              className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                                selectedElement.color === hex
                                  ? 'border-indigo-500 scale-110'
                                  : 'border-slate-200'
                              }`}
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                          <input
                            type="color"
                            value={selectedElement.color}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { color: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-slate-200 cursor-pointer"
                            title="Custom color"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="text-[11px] font-bold text-slate-600">
                          White Background Mask
                        </label>
                        <input
                          type="checkbox"
                          checked={selectedElement.backgroundColor === '#ffffff'}
                          onChange={(e) =>
                            updateElement(
                              selectedElement.id,
                              { backgroundColor: e.target.checked ? '#ffffff' : 'transparent' },
                              true
                            )
                          }
                          className="accent-indigo-600 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* IMAGE / SIGNATURE PROPERTIES */}
                  {(selectedElement.type === 'image' || selectedElement.type === 'signature') && (
                    <div className="space-y-3.5">
                      <button
                        type="button"
                        onClick={() => setCropTargetElementId(selectedElement.id)}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-700 cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        Crop &amp; Rotate Image
                      </button>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">
                          Keep Aspect Ratio
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateElement(
                              selectedElement.id,
                              { lockAspectRatio: !selectedElement.lockAspectRatio },
                              true
                            )
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                            selectedElement.lockAspectRatio
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {selectedElement.lockAspectRatio ? (
                            <>
                              <Lock className="w-3 h-3" /> Locked
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" /> Free
                            </>
                          )}
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Rotation</span>
                          <span>{selectedElement.rotation || 0}°</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(
                                selectedElement.id,
                                { rotation: ((selectedElement.rotation || 0) + 270) % 360 },
                                true
                              )
                            }
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                          >
                            -90°
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, { rotation: 0 }, true)
                            }
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                          >
                            0°
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateElement(
                                selectedElement.id,
                                { rotation: ((selectedElement.rotation || 0) + 90) % 360 },
                                true
                              )
                            }
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                          >
                            +90°
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Opacity</span>
                          <span>{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.2}
                          max={1}
                          step={0.05}
                          value={selectedElement.opacity ?? 1}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { opacity: Number(e.target.value) })
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* MARK PROPERTIES */}
                  {selectedElement.type === 'mark' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Mark Style
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(
                            [
                              { kind: 'check', label: 'Tick ✓' },
                              { kind: 'cross', label: 'Cross ✗' },
                              { kind: 'checkbox-checked', label: 'Checked ☑' },
                              { kind: 'checkbox-empty', label: 'Empty ☐' },
                              { kind: 'dot', label: 'Dot ●' },
                            ] as Array<{ kind: FormMarkKind; label: string }>
                          ).map((item) => (
                            <button
                              key={item.kind}
                              type="button"
                              onClick={() =>
                                updateElement(selectedElement.id, { markKind: item.kind }, true)
                              }
                              className={`px-2 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                                selectedElement.markKind === item.kind
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          {SWATCH_COLORS.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => updateElement(selectedElement.id, { color: hex }, true)}
                              className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                                selectedElement.color === hex
                                  ? 'border-indigo-500 scale-110'
                                  : 'border-slate-200'
                              }`}
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Stroke Thickness</span>
                          <span>{selectedElement.strokeWidth.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={4.5}
                          step={0.3}
                          value={selectedElement.strokeWidth}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              strokeWidth: Number(e.target.value),
                            })
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* SHAPE PROPERTIES */}
                  {selectedElement.type === 'shape' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Border / Line Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          {SWATCH_COLORS.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() =>
                                updateElement(selectedElement.id, { strokeColor: hex }, true)
                              }
                              className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                                selectedElement.strokeColor === hex
                                  ? 'border-indigo-500 scale-110'
                                  : 'border-slate-200'
                              }`}
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>

                      {(selectedElement.shapeKind === 'rect' || selectedElement.shapeKind === 'circle') && (
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-600">White Fill</label>
                          <input
                            type="checkbox"
                            checked={selectedElement.fillColor === '#ffffff'}
                            onChange={(e) =>
                              updateElement(
                                selectedElement.id,
                                { fillColor: e.target.checked ? '#ffffff' : 'transparent' },
                                true
                              )
                            }
                            className="accent-indigo-600 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Line Width</span>
                          <span>{selectedElement.strokeWidth.toFixed(1)} pt</span>
                        </div>
                        <input
                          type="range"
                          min={0.8}
                          max={5}
                          step={0.2}
                          value={selectedElement.strokeWidth}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              strokeWidth: Number(e.target.value),
                            })
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* COMMON ELEMENT ACTIONS */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copySelectedElement}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateElement(selectedElement.id)}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteElement(selectedElement.id)}
                      className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete From Page
                    </button>
                  </div>
                </>
              ) : (
                /* DOCUMENT & EXPORT SETTINGS WHEN NOTHING IS SELECTED */
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      Page {activePage} Summary
                    </p>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dimensions</span>
                        <span className="font-bold text-slate-800">
                          {Math.round(activePageDisplayedSize.width)} ×{' '}
                          {Math.round(activePageDisplayedSize.height)} pt
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Orientation</span>
                        <span className="font-bold text-slate-800">
                          {activePageDisplayedSize.width > activePageDisplayedSize.height
                            ? 'Landscape'
                            : 'Portrait'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Added Elements</span>
                        <span className="font-bold text-indigo-700">{pageElements.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Interactive Fields</span>
                        <span className="font-bold text-slate-800">
                          {pageInteractiveFields.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Export Options
                    </p>
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flattenOnExport}
                        onChange={(e) => setFlattenOnExport(e.target.checked)}
                        className="mt-0.5 accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Flatten form fields</p>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Lock filled interactive fields into the page so values cannot be accidentally changed.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Quick Tips
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Upload photos &amp; signatures once in <strong>Assets</strong> and drag onto any page.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Press <strong>Ctrl+C / Ctrl+V</strong> to copy elements between pages.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Use <strong>Save Progress</strong> to pause and reopen later with <code>.pottoform</code>.</span>
                      </li>
                    </ul>
                  </div>

                  {elements.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      {!confirmClearAll ? (
                        <button
                          type="button"
                          onClick={() => setConfirmClearAll(true)}
                          className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                        >
                          Clear All Added Elements
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-center">
                          <p className="text-[11px] font-bold text-rose-800">
                            Remove all {elements.length} added element(s)?
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                pushUndoSnapshot();
                                setElements([]);
                                setSelectedId(null);
                                setEditingTextId(null);
                                setConfirmClearAll(false);
                                triggerToast('info', 'All added elements cleared. You can Undo anytime.', 'Cleared');
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Yes, Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmClearAll(false)}
                              className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* MODALS */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setPendingSlot(null);
        }}
        onConfirm={handleSignatureConfirm}
      />

      {cropTargetElement && (
        <ImageCropModal
          isOpen={Boolean(cropTargetElement)}
          sourceDataUrl={cropTargetElement.originalDataUrl || cropTargetElement.dataUrl}
          onClose={() => setCropTargetElementId(null)}
          onApply={(res) => {
            pushUndoSnapshot();
            const newAspect = res.width / Math.max(1, res.height);
            const pageAspect =
              activePageDisplayedSize.width / Math.max(1, activePageDisplayedSize.height);
            const nextH = Math.min(
              0.6,
              Math.max(0.03, (cropTargetElement.width * pageAspect) / Math.max(0.1, newAspect))
            );
            updateElement(cropTargetElement.id, {
              dataUrl: res.dataUrl,
              aspectRatio: newAspect,
              height: Math.min(1 - cropTargetElement.y, nextH),
            });
            setCropTargetElementId(null);
            triggerToast('success', 'Image cropped and updated on this copy only.', 'Cropped');
          }}
        />
      )}

      {loadedPdf && (
        <BeforeAfterPrintModal
          isOpen={previewModalOpen}
          mode={previewModalMode}
          onClose={() => setPreviewModalOpen(false)}
          originalPdfDoc={loadedPdf.pdfJsDoc}
          editedPdfBytes={previewExportBytes}
          editedBlob={previewExportBlob}
          exportWarnings={previewWarnings}
          initialPage={activePage}
          pageCount={loadedPdf.pageCount}
          onDownloadPdf={() => {
            if (previewExportBlob) {
              const baseName = (fileName || 'document').replace(/\.pdf$/i, '');
              triggerDownload(previewExportBlob, `${baseName}_filled.pdf`);
              setHasUnsavedChanges(false);
              triggerToast('success', 'Filled PDF downloaded.', 'Download Started');
            }
          }}
        />
      )}

      {/* DEDICATED SEO LANDING CONTENT FOR /fill-pdf-form */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
            FILL PDF FORM ONLINE WITHOUT CONVERTING TO WORD
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Need to fill an application form, school admission sheet, rental agreement, office document, or scanned PDF?{' '}
            <strong>FILL PDF FORM</strong> lets you type directly on any PDF, add a passport-size photo, place a drawn or typed digital signature, insert dates, and add tick marks or checkboxes right in your browser—even when the PDF has no editable fields.
          </p>
        </div>

        {/* HOW TO USE */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase">
            HOW TO FILL ANY PDF FORM IN 4 EASY STEPS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '1',
                title: 'Upload Any PDF',
                desc: 'Drag & drop any single or multi-page PDF form—or reopen a saved .pottoform project.',
              },
              {
                step: '2',
                title: 'Type & Place Elements',
                desc: 'Click anywhere to type text (including Hindi/Unicode), insert dates, checkmarks, lines, or boxes.',
              },
              {
                step: '3',
                title: 'Add Photo & Signature',
                desc: 'Upload your photo or draw/type your signature once and reuse it on multiple pages from Assets.',
              },
              {
                step: '4',
                title: 'Preview & Download',
                desc: 'Check Before/After or Print-Ready Preview, then download your final filled PDF.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-extrabold">
                  {item.step}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KEY FEATURES */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase">
            KEY FEATURES BUILT FOR REAL-WORLD PDF FORMS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
            {[
              'Type on any PDF anywhere—works on scanned forms, static PDFs, and interactive AcroForm PDFs.',
              'Reusable Photo & Signature Library: upload once in your session and place independent copies on every page.',
              '3 Signature Modes: draw with mouse/touch, type stylish signatures, or upload an image with automatic white-background cleaning.',
              'Photo Crop & Rotate built in with Passport (3.5×4.5), Square, and Free crop presets.',
              'Reusable Text Snippets for frequently used details like Name, Address, Mobile, Email, and Designation.',
              'Optional Auto-Detect Form Fields that suggests Name, Date, Address, Photo, and Signature areas for your approval.',
              'Precision Snap Alignment Guides, optional Rulers, Page Margin Guides, and Page Rotation (90° / 180°).',
              'Save Editing Progress (.pottoform) to pause anytime and reopen later, plus Before/After and Print-Ready Preview.',
            ].map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm leading-relaxed">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ ACCORDION */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            FREQUENTLY ASKED QUESTIONS
          </h3>
          <div className="space-y-2">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INTERNAL LINKING TO RELATED TOOLS */}
      {onSelectNextTool && (
        <RecommendedNextTools currentToolId="fill-pdf-form" onSelectTool={onSelectNextTool} />
      )}
    </div>
  );
};
