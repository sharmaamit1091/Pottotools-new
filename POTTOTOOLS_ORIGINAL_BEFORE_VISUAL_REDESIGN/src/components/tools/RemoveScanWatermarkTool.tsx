import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ToolDefinition } from '../../config/toolsRegistry';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { RecommendedNextTools } from './RecommendedNextTools';
import { triggerDownload, formatBytes } from '../../services/utils/downloadUtils';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';
import { trackToolCompleted } from '../../services/analytics/ga4Tracker';
import {
  WatermarkRegion,
  PageAnalysis,
  FillStrategy,
  ProcessWatermarkResult,
  analyzePdfTextWatermarks,
  detectImageWatermarksViaOcr,
  evaluateRegionSafety,
  inpaintRegionsOnCanvas,
  parsePageRange,
  processRemoveScanWatermarks,
  generateSampleScannedPdf,
} from '../../services/pdf/scanWatermarkService';
import {
  Sparkles,
  ScanSearch,
  Square,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Columns2,
  ArrowLeft,
  Copy,
  Layers,
  Crosshair,
  Info,
  FileCheck2,
  Wand2,
} from 'lucide-react';

// Ensure local worker path for offline browser-side PDF rendering
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch {
    // Already initialized
  }
}

interface RemoveScanWatermarkToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

type DragHandle = 'draw' | 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  mode: DragHandle;
  regionId?: string;
  startX: number; // normalized [0..1]
  startY: number; // normalized [0..1]
  origBox?: { x: number; y: number; w: number; h: number };
}

const MIN_BOX_W = 0.025;
const MIN_BOX_H = 0.014;

export const RemoveScanWatermarkTool: React.FC<RemoveScanWatermarkToolProps> = ({
  tool,
  onSelectNextTool,
}) => {
  // Source PDF state
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceBuffer, setSourceBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageAnalyses, setPageAnalyses] = useState<PageAnalysis[]>([]);

  // Page Scope selection ("All pages" vs "Specific pages")
  const [pageScopeMode, setPageScopeMode] = useState<'all' | 'specific'>('all');
  const [specificPagesInput, setSpecificPagesInput] = useState<string>('1');

  // Watermark selections across all pages
  const [regions, setRegions] = useState<WatermarkRegion[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [draftBox, setDraftBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Editor display controls
  const [editorZoom, setEditorZoom] = useState<number>(1);
  const [livePreviewClean, setLivePreviewClean] = useState<boolean>(false);
  const [fillStrategy, setFillStrategy] = useState<FillStrategy>('smart-paper');
  const [applyPagesInput, setApplyPagesInput] = useState<string>('');

  // Status / OCR / Processing state
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [isRunningOcr, setIsRunningOcr] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [detectionBanner, setDetectionBanner] = useState<{
    tone: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mandatory Before-and-After Review stage
  const [stage, setStage] = useState<'upload' | 'edit' | 'review'>('upload');
  const [result, setResult] = useState<ProcessWatermarkResult | null>(null);
  const [reviewPage, setReviewPage] = useState<number>(1);
  const [compareMode, setCompareMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [reviewZoom, setReviewZoom] = useState<number>(1);
  const [highlightChanges, setHighlightChanges] = useState<boolean>(true);
  const [userApproved, setUserApproved] = useState<boolean>(false);
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);

  // Refs
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawPageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const reviewScrollRef = useRef<HTMLDivElement | null>(null);
  const sliderBoxRef = useRef<HTMLDivElement | null>(null);
  const isDraggingSliderRef = useRef<boolean>(false);

  const [canvasDims, setCanvasDims] = useState<{ width: number; height: number }>({
    width: 640,
    height: 900,
  });

  // Active target pages based on user's All vs Specific selection
  const activeTargetPages = useMemo(() => {
    if (totalPages === 0) return [];
    if (pageScopeMode === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const parsed = parsePageRange(specificPagesInput, totalPages);
    return parsed.length > 0 ? parsed : [currentPage];
  }, [pageScopeMode, specificPagesInput, totalPages, currentPage]);

  // Regions filtered by active page scope (used when processing)
  const scopedRegions = useMemo(() => {
    const allowed = new Set(activeTargetPages);
    return regions.filter((r) => allowed.has(r.page));
  }, [regions, activeTargetPages]);

  const currentPageRegions = useMemo(
    () => regions.filter((r) => r.page === currentPage),
    [regions, currentPage]
  );

  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === selectedRegionId) || null,
    [regions, selectedRegionId]
  );

  const currentAnalysis = useMemo(
    () => pageAnalyses.find((a) => a.pageNum === currentPage) || null,
    [pageAnalyses, currentPage]
  );

  const anyOverlapWarnings = useMemo(
    () => scopedRegions.filter((r) => r.overlapRisk !== 'none' || !!r.responsibleUseWarning),
    [scopedRegions]
  );

  // Load PDF File & automatically inspect selectable text watermarks
  const loadPdfFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    setDetectionBanner(null);
    setResult(null);
    setUserApproved(false);
    setHasDownloaded(false);
    setRegions([]);
    setSelectedRegionId(null);
    setLivePreviewClean(false);
    setEditorZoom(1);
    setIsLoadingDoc(true);
    setProgress(15);
    setStatusText('Opening PDF locally in your browser…');

    try {
      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
      const doc = await loadingTask.promise;

      pdfDocRef.current = doc;
      setSourceFile(file);
      setSourceBuffer(buffer);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setPageScopeMode('all');
      setSpecificPagesInput(doc.numPages > 1 ? `1-${doc.numPages}` : '1');
      setApplyPagesInput(doc.numPages > 1 ? `1-${doc.numPages}` : '1');

      setStatusText('Scanning PDF pages for scanner-app text labels…');
      setProgress(55);
      const analyses = await analyzePdfTextWatermarks(doc, (p, total) => {
        setProgress(55 + Math.round((p / total) * 40));
      });
      setPageAnalyses(analyses);

      const autoRegions = analyses.flatMap((a) => a.detectedRegions);
      setRegions(autoRegions);
      if (autoRegions.length > 0) {
        setSelectedRegionId(autoRegions[0].id);
        setCurrentPage(autoRegions[0].page);
      }

      const imageOnlyPages = analyses.filter((a) => !a.hasSelectableText).map((a) => a.pageNum);

      if (autoRegions.length > 0 && imageOnlyPages.length === 0) {
        const names = Array.from(new Set(autoRegions.map((r) => r.matchedLabel).filter(Boolean))).join(', ');
        setDetectionBanner({
          tone: 'success',
          message: `Auto-detected ${autoRegions.length} text-based scanner label${autoRegions.length > 1 ? 's' : ''} (${names || 'Scanner label'}). You can adjust, resize, or draw additional boxes manually before cleaning.`,
        });
      } else if (autoRegions.length > 0 && imageOnlyPages.length > 0) {
        setDetectionBanner({
          tone: 'info',
          message: `Detected ${autoRegions.length} text-based scanner label(s). Page(s) ${imageOnlyPages.join(', ')} are scanned images — click "Auto-Detect Scan Labels (OCR)" or draw a manual selection box directly on the preview.`,
        });
      } else if (imageOnlyPages.length > 0) {
        setDetectionBanner({
          tone: 'warning',
          message: `This PDF contains image-based scanned pages. Click "Auto-Detect Scan Labels (OCR)" to scan for CamScanner / Adobe Scan labels automatically, or drag a rectangle manually over the unwanted label.`,
        });
      } else {
        setDetectionBanner({
          tone: 'warning',
          message:
            'Automatic detection did not find a known scanner-app text label with high certainty. Please draw a selection rectangle manually over the unwanted watermark so unrelated text stays untouched.',
        });
      }

      setProgress(100);
      setStage('edit');
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      const msg = err?.name === 'PasswordException'
        ? 'This PDF is password-protected. Please unlock it first with our Unlock PDF tool.'
        : 'Unable to read this PDF file. Please verify it is a valid, uncorrupted PDF document.';
      setErrorMsg(msg);
      setStage('upload');
    } finally {
      setIsLoadingDoc(false);
    }
  }, []);

  // Pick up any file staged from homepage Magic Desk
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && staged.name.toLowerCase().endsWith('.pdf')) {
      clearStagedFileForTool();
      loadPdfFile(staged);
    }
  }, [loadPdfFile]);

  // Render current PDF page onto raw offscreen canvas + visible display canvas
  useEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      if (stage !== 'edit' || !pdfDocRef.current || !displayCanvasRef.current) return;
      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        const baseVp = page.getViewport({ scale: 1.0 });
        const targetWidth = 760;
        const scale = Math.min(2.0, Math.max(1.0, targetWidth / Math.max(1, baseVp.width)));
        const viewport = page.getViewport({ scale });

        const rawCanvas = document.createElement('canvas');
        rawCanvas.width = Math.round(viewport.width);
        rawCanvas.height = Math.round(viewport.height);
        const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
        if (!rawCtx) return;

        rawCtx.fillStyle = '#FFFFFF';
        rawCtx.fillRect(0, 0, rawCanvas.width, rawCanvas.height);
        // @ts-expect-error pdfjs typing compatibility
        await page.render({ canvasContext: rawCtx, viewport }).promise;

        if (cancelled) return;
        rawPageCanvasRef.current = rawCanvas;
        setCanvasDims({ width: rawCanvas.width, height: rawCanvas.height });

        // Paint display canvas (either original or live simulated cleaned preview!)
        const disp = displayCanvasRef.current;
        if (!disp) return;
        disp.width = rawCanvas.width;
        disp.height = rawCanvas.height;
        const dCtx = disp.getContext('2d');
        if (!dCtx) return;

        if (livePreviewClean && currentPageRegions.length > 0) {
          const previewCleaned = inpaintRegionsOnCanvas(rawCanvas, currentPageRegions, fillStrategy);
          dCtx.drawImage(previewCleaned, 0, 0);
        } else {
          dCtx.drawImage(rawCanvas, 0, 0);
        }
      } catch (err) {
        console.warn('Page render warning:', err);
      }
    };

    renderPage();
    return () => {
      cancelled = true;
    };
  }, [stage, currentPage, livePreviewClean, currentPageRegions, fillStrategy]);

  // Re-evaluate overlap risk for a region against current page text + rendered canvas
  const buildCheckedRegion = useCallback(
    (
      base: Omit<WatermarkRegion, 'overlapRisk' | 'overlapReason' | 'responsibleUseWarning'>,
      useCanvasForPage: boolean
    ): WatermarkRegion => {
      const analysis = pageAnalyses.find((a) => a.pageNum === base.page);
      const safety = evaluateRegionSafety(
        base,
        analysis?.textBoxes || [],
        useCanvasForPage ? rawPageCanvasRef.current : null
      );
      return {
        ...base,
        overlapRisk: safety.overlapRisk,
        overlapReason: safety.overlapReason,
        responsibleUseWarning: safety.responsibleUseWarning,
      };
    },
    [pageAnalyses]
  );

  // Run In-Browser OCR Detection for image-based watermarks
  const handleRunOcrDetection = async () => {
    if (!pdfDocRef.current || isRunningOcr) return;
    setErrorMsg(null);
    setIsRunningOcr(true);
    setProgress(5);
    setStatusText('Starting in-browser OCR scanner label detection…');

    try {
      const targetPages = activeTargetPages.length > 0 ? activeTargetPages : [currentPage];
      const ocrRegions = await detectImageWatermarksViaOcr(
        pdfDocRef.current,
        targetPages,
        pageAnalyses,
        (status, pct) => {
          setStatusText(status);
          setProgress(pct);
        }
      );

      if (ocrRegions.length === 0) {
        setDetectionBanner({
          tone: 'warning',
          message:
            'Automatic OCR could not confidently locate a standard scanner label on the selected pages. Please draw a rectangle manually over the scanner watermark on the preview below.',
        });
      } else {
        // Merge without duplicating nearly identical regions
        setRegions((prev) => {
          const merged = [...prev];
          for (const candidate of ocrRegions) {
            const exists = merged.some(
              (m) =>
                m.page === candidate.page &&
                Math.abs(m.x - candidate.x) < 0.05 &&
                Math.abs(m.y - candidate.y) < 0.04
            );
            if (!exists) merged.push(candidate);
          }
          return merged;
        });
        setSelectedRegionId(ocrRegions[0].id);
        setCurrentPage(ocrRegions[0].page);

        const appNames = Array.from(new Set(ocrRegions.map((r) => r.matchedLabel).filter(Boolean))).join(', ');
        setDetectionBanner({
          tone: 'success',
          message: `Found ${ocrRegions.length} image-based scanner label${ocrRegions.length > 1 ? 's' : ''} (${appNames || 'Scanner app'}) via in-browser OCR. Review the boxes or adjust handles before removing.`,
        });
      }
    } catch (err) {
      console.error('OCR detection failed:', err);
      setDetectionBanner({
        tone: 'warning',
        message:
          'OCR scan was interrupted or unavailable offline. You can always select the unwanted scanner label directly by drawing a rectangle on the page preview.',
      });
    } finally {
      setIsRunningOcr(false);
    }
  };

  // Pointer coordinates normalized [0..1] on the PDF preview overlay
  const getNormalizedPoint = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
    return { x, y };
  };

  // Start drawing a new manual rectangle on empty canvas
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getNormalizedPoint(e);
    setSelectedRegionId(null);
    dragStateRef.current = {
      mode: 'draw',
      startX: pt.x,
      startY: pt.y,
    };
    setDraftBox({ x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  // Start moving or resizing an existing box
  const handleBoxPointerDown = (
    e: React.PointerEvent,
    region: WatermarkRegion,
    mode: DragHandle
  ) => {
    e.stopPropagation();
    if (overlayRef.current) {
      try {
        overlayRef.current.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if capture unsupported
      }
    }
    const el = overlayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pt = {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width))),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height))),
    };
    setSelectedRegionId(region.id);
    dragStateRef.current = {
      mode,
      regionId: region.id,
      startX: pt.x,
      startY: pt.y,
      origBox: { x: region.x, y: region.y, w: region.w, h: region.h },
    };
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const pt = getNormalizedPoint(e);

    if (drag.mode === 'draw') {
      const x = Math.min(drag.startX, pt.x);
      const y = Math.min(drag.startY, pt.y);
      const w = Math.abs(pt.x - drag.startX);
      const h = Math.abs(pt.y - drag.startY);
      setDraftBox({ x, y, w, h });
      return;
    }

    if (!drag.regionId || !drag.origBox) return;
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    const o = drag.origBox;

    let nx = o.x;
    let ny = o.y;
    let nw = o.w;
    let nh = o.h;

    if (drag.mode === 'move') {
      nx = Math.max(0, Math.min(1 - o.w, o.x + dx));
      ny = Math.max(0, Math.min(1 - o.h, o.y + dy));
    } else {
      if (drag.mode.includes('w')) {
        const right = o.x + o.w;
        nx = Math.max(0, Math.min(right - MIN_BOX_W, o.x + dx));
        nw = right - nx;
      }
      if (drag.mode.includes('e')) {
        nw = Math.max(MIN_BOX_W, Math.min(1 - o.x, o.w + dx));
      }
      if (drag.mode.includes('n')) {
        const bottom = o.y + o.h;
        ny = Math.max(0, Math.min(bottom - MIN_BOX_H, o.y + dy));
        nh = bottom - ny;
      }
      if (drag.mode.includes('s')) {
        nh = Math.max(MIN_BOX_H, Math.min(1 - o.y, o.h + dy));
      }
    }

    setRegions((prev) =>
      prev.map((r) => (r.id === drag.regionId ? { ...r, x: nx, y: ny, w: nw, h: nh } : r))
    );
  };

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    dragStateRef.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (drag.mode === 'draw') {
      if (draftBox && draftBox.w >= MIN_BOX_W && draftBox.h >= MIN_BOX_H) {
        const newReg = buildCheckedRegion(
          {
            id: `wm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            page: currentPage,
            x: draftBox.x,
            y: draftBox.y,
            w: draftBox.w,
            h: draftBox.h,
            source: 'manual',
            matchedLabel: 'Manual Selection',
          },
          true
        );
        setRegions((prev) => [...prev, newReg]);
        setSelectedRegionId(newReg.id);
      }
      setDraftBox(null);
      return;
    }

    // Re-evaluate overlap & safety after move/resize completes
    if (drag.regionId) {
      setRegions((prev) =>
        prev.map((r) => {
          if (r.id !== drag.regionId) return r;
          return buildCheckedRegion(
            {
              id: r.id,
              page: r.page,
              x: r.x,
              y: r.y,
              w: r.w,
              h: r.h,
              source: r.source === 'text' ? 'manual' : r.source, // manual resize becomes custom area
              matchedLabel: r.matchedLabel,
              confidence: r.confidence,
            },
            r.page === currentPage
          );
        })
      );
    }
  };

  // Apply currently selected box to ALL pages or SPECIFIC pages
  const applySelectedRegionToPages = (targetPages: number[]) => {
    if (!selectedRegion || targetPages.length === 0) return;

    setRegions((prev) => {
      const next = [...prev];
      for (const p of targetPages) {
        if (p === selectedRegion.page) continue;
        // Avoid stacking duplicate boxes in the exact same coordinates
        const alreadyExists = next.some(
          (r) =>
            r.page === p &&
            Math.abs(r.x - selectedRegion.x) < 0.015 &&
            Math.abs(r.y - selectedRegion.y) < 0.015 &&
            Math.abs(r.w - selectedRegion.w) < 0.02
        );
        if (alreadyExists) continue;

        const cloned = buildCheckedRegion(
          {
            id: `wm-${Date.now()}-${p}-${Math.random().toString(36).slice(2, 6)}`,
            page: p,
            x: selectedRegion.x,
            y: selectedRegion.y,
            w: selectedRegion.w,
            h: selectedRegion.h,
            source: 'manual',
            matchedLabel: selectedRegion.matchedLabel || 'Applied Selection',
          },
          p === currentPage
        );
        next.push(cloned);
      }
      return next;
    });

    setDetectionBanner({
      tone: 'success',
      message: `Applied selected watermark area to ${targetPages.length} page${targetPages.length > 1 ? 's' : ''} (${targetPages.length === totalPages ? 'All Pages' : `Pages ${targetPages.join(', ')}`}).`,
    });
  };

  const handleDeleteRegion = (id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
    if (selectedRegionId === id) setSelectedRegionId(null);
  };

  const handleClearCurrentPage = () => {
    setRegions((prev) => prev.filter((r) => r.page !== currentPage));
    setSelectedRegionId(null);
  };

  const handleClearAllRegions = () => {
    setRegions([]);
    setSelectedRegionId(null);
    setLivePreviewClean(false);
  };

  // Process Watermark Removal -> Enter MANDATORY Before-and-After Review Screen
  const handleProcessRemoveWatermark = async () => {
    if (!sourceBuffer || !sourceFile) return;
    if (scopedRegions.length === 0) {
      setErrorMsg(
        'Please select at least one watermark area first (run Auto-Detect or draw a rectangle on the page preview).'
      );
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setProgress(8);
    setStatusText('Processing scanner watermark removal locally…');

    try {
      const processed = await processRemoveScanWatermarks({
        sourceBuffer,
        originalFilename: sourceFile.name,
        regions: scopedRegions,
        fillStrategy,
        onProgress: (txt, pct) => {
          setStatusText(txt);
          setProgress(pct);
        },
      });

      setResult(processed);
      setReviewPage(processed.modifiedPages[0] || 1);
      setSliderPos(50);
      setReviewZoom(1);
      setHighlightChanges(true);
      setUserApproved(false);
      setHasDownloaded(false);
      setStage('review');
    } catch (err: any) {
      console.error('Watermark removal error:', err);
      setErrorMsg(
        err?.message ||
          'Could not process this PDF safely. Try adjusting your selection or testing on a smaller page range.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Clean PDF (only enabled after inspecting & approving Before-and-After!)
  const handleDownloadCleanPdf = () => {
    if (!result || !userApproved) return;
    triggerDownload(result.blob, result.filename);
    setHasDownloaded(true);
    trackToolCompleted('remove-scan-watermark', result.pageCount, 'remove-scan-watermark');
  };

  // Before/After Draggable Slider Pointer Logic
  const updateSliderFromClientX = (clientX: number) => {
    const el = sliderBoxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / Math.max(1, rect.width)) * 100));
    setSliderPos(pct);
  };

  // One-click "Zoom to Affected Area" in Before & After review
  const handleZoomToAffectedArea = () => {
    const preview = result?.previews.find((p) => p.pageNum === reviewPage);
    setReviewZoom(2.2);
    setTimeout(() => {
      const scroller = reviewScrollRef.current;
      if (!scroller) return;
      const firstRegion = preview?.regionsApplied[0];
      if (firstRegion) {
        const targetScrollTop = Math.max(
          0,
          (firstRegion.y + firstRegion.h / 2) * scroller.scrollHeight - scroller.clientHeight / 2
        );
        const targetScrollLeft = Math.max(
          0,
          (firstRegion.x + firstRegion.w / 2) * scroller.scrollWidth - scroller.clientWidth / 2
        );
        scroller.scrollTo({ top: targetScrollTop, left: targetScrollLeft, behavior: 'smooth' });
      } else {
        scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
      }
    }, 60);
  };

  const handleLoadSample = async () => {
    setErrorMsg(null);
    setIsLoadingDoc(true);
    setStatusText('Creating sample 2-page CamScanner & Adobe Scan PDF…');
    setProgress(35);
    try {
      const sampleFile = await generateSampleScannedPdf();
      await loadPdfFile(sampleFile);
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to generate sample PDF.');
      setIsLoadingDoc(false);
    }
  };

  const handleResetAll = () => {
    setSourceFile(null);
    setSourceBuffer(null);
    setTotalPages(0);
    setCurrentPage(1);
    setPageAnalyses([]);
    setRegions([]);
    setSelectedRegionId(null);
    setResult(null);
    setDetectionBanner(null);
    setErrorMsg(null);
    setStage('upload');
    pdfDocRef.current = null;
  };

  const activeReviewPreview = useMemo(
    () => result?.previews.find((p) => p.pageNum === reviewPage) || null,
    [result, reviewPage]
  );

  return (
    <div className="space-y-6">
      {/* Responsible Use & Browser-Side Privacy Notice Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/70 text-xs">
        <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>100% Browser-Side Processing — Your scanned PDF stays privately on your device.</span>
        </div>
        <span className="text-teal-800/80 dark:text-teal-300/80">
          Intended only for removing scanner-app labels on documents you own or are authorized to edit.
        </span>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Loading / OCR / Processing Progress Bar */}
      {(isLoadingDoc || isRunningOcr || isProcessing) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <ProgressBar progress={progress} statusText={statusText} />
        </div>
      )}

      {/* =================================================================
          STAGE 1: UPLOAD PDF & DRAG-AND-DROP AREA
         ================================================================= */}
      {stage === 'upload' && !isLoadingDoc && (
        <div className="space-y-4">
          <FileUploadZone
            acceptedFormats={['.pdf', 'application/pdf']}
            multiple={false}
            maxFileSizeMB={tool.maxFileSizeMB || 100}
            files={sourceFile ? [sourceFile] : []}
            onFilesSelected={(files) => {
              if (files[0]) loadPdfFile(files[0]);
            }}
            onRemoveFile={() => handleResetAll()}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>
                Want to test both <strong>Text-Based</strong> &amp; <strong>Image-Based</strong> scan watermark removal right now?
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoadSample}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Try Sample Scanned PDF
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          STAGE 2: EDIT & SELECT WATERMARK WORKSPACE
         ================================================================= */}
      {stage === 'edit' && sourceFile && (
        <div className="space-y-5">
          {/* File Header Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {sourceFile.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {formatBytes(sourceFile.size)} · {totalPages} {totalPages === 1 ? 'page' : 'pages'} ·{' '}
                  {scopedRegions.length} watermark area{scopedRegions.length === 1 ? '' : 's'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunOcrDetection}
                disabled={isRunningOcr || isProcessing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <ScanSearch className="w-4 h-4" />
                Auto-Detect Scan Labels (OCR)
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change PDF
              </button>
            </div>
          </div>

          {/* Detection Status / Guidance Banner */}
          {detectionBanner && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                detectionBanner.tone === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                  : detectionBanner.tone === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/35 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  : 'bg-sky-50 dark:bg-sky-950/35 border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200'
              }`}
            >
              {detectionBanner.tone === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : detectionBanner.tone === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{detectionBanner.message}</span>
            </div>
          )}

          {/* Main 2-Column Workspace: Controls Sidebar + Interactive PDF Preview Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT CONTROLS SIDEBAR */}
            <div className="lg:col-span-4 space-y-4">
              {/* 1. Page Scope Selector (All Pages or Specific Pages) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  1. Pages to Clean
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPageScopeMode('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      pageScopeMode === 'all'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    All Pages ({totalPages})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageScopeMode('specific')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      pageScopeMode === 'specific'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Specific Pages
                  </button>
                </div>

                {pageScopeMode === 'specific' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Page numbers or ranges (e.g. 1, 3-5):
                    </label>
                    <input
                      type="text"
                      value={specificPagesInput}
                      onChange={(e) => setSpecificPagesInput(e.target.value)}
                      placeholder="e.g. 1, 2-4"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Active pages: <span className="font-mono font-semibold">{activeTargetPages.join(', ')}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Manual Watermark Selection Controls */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Square className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    2. Manual &amp; Auto Selections
                  </div>
                  {regions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllRegions}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Drag directly on the PDF preview</strong> to draw a rectangle around any unwanted scanner label. Click a box to <strong>move or resize</strong> its edges.
                </p>

                {/* Active Selected Box Actions (Apply to All / Specific Pages) */}
                {selectedRegion && (
                  <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/35 border border-teal-200 dark:border-teal-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-200 truncate">
                        Selected: {selectedRegion.matchedLabel || 'Manual Box'} (Pg {selectedRegion.page})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRegion(selectedRegion.id)}
                        className="p-1 rounded-md text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        title="Remove this selection box"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {totalPages > 1 && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() =>
                            applySelectedRegionToPages(
                              Array.from({ length: totalPages }, (_, i) => i + 1)
                            )
                          }
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Apply This Area to All {totalPages} Pages
                        </button>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={applyPagesInput}
                            onChange={(e) => setApplyPagesInput(e.target.value)}
                            placeholder="Pages e.g. 1, 3-5"
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-[11px] font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const parsed = parsePageRange(applyPagesInput, totalPages);
                              if (parsed.length > 0) applySelectedRegionToPages(parsed);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                          >
                            Apply Pages
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* List of Selections on Current Page */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {currentPageRegions.length === 0 ? (
                    <div className="text-center py-3 px-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      No watermark area marked on Page {currentPage} yet. Drag a box on the preview to select one.
                    </div>
                  ) : (
                    currentPageRegions.map((reg, idx) => (
                      <div
                        key={reg.id}
                        onClick={() => setSelectedRegionId(reg.id)}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedRegionId === reg.id
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-400 dark:border-teal-600'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              #{idx + 1} {reg.matchedLabel || 'Manual Area'}
                            </span>
                            <span
                              className={`px-1.5 py-[1px] rounded text-[10px] font-bold uppercase ${
                                reg.source === 'text'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                  : reg.source === 'image-ocr'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {reg.source === 'text' ? 'Text' : reg.source === 'image-ocr' ? 'OCR' : 'Manual'}
                            </span>
                          </div>
                          {reg.overlapRisk !== 'none' && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Possible text overlap
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRegion(reg.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete selection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {currentPageRegions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCurrentPage}
                    className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear Selections on Page {currentPage}
                  </button>
                )}
              </div>

              {/* 3. Background Clean-up Mode & Live Preview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Wand2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  3. Paper Blending Mode
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFillStrategy('smart-paper')}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      fillStrategy === 'smart-paper'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Smart Paper Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setFillStrategy('clean-white')}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      fillStrategy === 'clean-white'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Pure White Paper
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setLivePreviewClean((v) => !v)}
                  disabled={currentPageRegions.length === 0}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-45 ${
                    livePreviewClean
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {livePreviewClean ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {livePreviewClean ? 'Showing Live Removal Preview' : 'Preview Selected Area Before Processing'}
                </button>
              </div>

              {/* Overlap / Responsible Use Warning Box */}
              {anyOverlapWarnings.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Content Overlap Caution
                  </div>
                  {anyOverlapWarnings.slice(0, 3).map((w) => (
                    <p key={w.id} className="leading-relaxed">
                      <strong>Page {w.page}:</strong> {w.responsibleUseWarning || w.overlapReason}
                    </p>
                  ))}
                </div>
              )}

              {/* Primary Action CTA: Leads to MANDATORY Before & After Comparison */}
              <button
                type="button"
                onClick={handleProcessRemoveWatermark}
                disabled={scopedRegions.length === 0 || isProcessing || isRunningOcr}
                className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Remove Watermark &amp; Inspect Result
              </button>
              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                Next step: Mandatory Before-and-After comparison before downloading your clean PDF.
              </p>
            </div>

            {/* RIGHT INTERACTIVE PDF PREVIEW CANVAS */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              {/* Preview Top Toolbar */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
                {/* Page Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {currentAnalysis && (
                    <span className="hidden sm:inline-block ml-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {currentAnalysis.hasSelectableText ? 'Text + Graphics PDF' : 'Scanned Image PDF'}
                    </span>
                  )}
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditorZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 w-11 text-center">
                    {Math.round(editorZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditorZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Interactive Canvas Stage */}
              <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 overflow-auto max-h-[680px] flex justify-center">
                <div
                  className="relative inline-block shadow-xl rounded-md bg-white"
                  style={{
                    width: `${Math.min(720, canvasDims.width) * editorZoom}px`,
                    aspectRatio: `${canvasDims.width} / ${canvasDims.height}`,
                  }}
                >
                  <canvas
                    ref={displayCanvasRef}
                    className="w-full h-full block rounded-md pointer-events-none"
                  />

                  {/* Interactive Selection Overlay (Mouse + Touch Friendly) */}
                  <div
                    ref={overlayRef}
                    onPointerDown={handleOverlayPointerDown}
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                    className="absolute inset-0 cursor-crosshair touch-none select-none"
                  >
                    {/* Existing Watermark Selection Boxes */}
                    {currentPageRegions.map((reg, idx) => {
                      const isSel = selectedRegionId === reg.id;
                      const isRisky = reg.overlapRisk !== 'none' || !!reg.responsibleUseWarning;
                      return (
                        <div
                          key={reg.id}
                          onPointerDown={(e) => handleBoxPointerDown(e, reg, 'move')}
                          style={{
                            left: `${reg.x * 100}%`,
                            top: `${reg.y * 100}%`,
                            width: `${reg.w * 100}%`,
                            height: `${reg.h * 100}%`,
                          }}
                          className={`absolute group/box cursor-move transition-colors ${
                            livePreviewClean
                              ? 'border border-dashed border-emerald-500/80 bg-transparent'
                              : isRisky
                              ? 'border-2 border-amber-500 bg-amber-400/20'
                              : isSel
                              ? 'border-2 border-teal-600 bg-teal-500/20 shadow-[0_0_0_2px_rgba(13,148,136,0.25)]'
                              : 'border-2 border-dashed border-teal-500 bg-teal-400/15 hover:bg-teal-400/25'
                          }`}
                        >
                          {/* Floating Tag */}
                          <div
                            className={`absolute -top-5 left-0 px-1.5 py-[1px] rounded text-[10px] font-bold whitespace-nowrap shadow-xs pointer-events-none ${
                              isRisky
                                ? 'bg-amber-600 text-white'
                                : 'bg-teal-700 text-white'
                            }`}
                          >
                            #{idx + 1} {reg.matchedLabel || 'Selected'}
                          </div>

                          {/* 8 Interactive Resize Handles when selected */}
                          {isSel &&
                            (
                              [
                                ['nw', '-top-1.5 -left-1.5 cursor-nwse-resize'],
                                ['n', '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'],
                                ['ne', '-top-1.5 -right-1.5 cursor-nesw-resize'],
                                ['e', 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize'],
                                ['se', '-bottom-1.5 -right-1.5 cursor-nwse-resize'],
                                ['s', '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'],
                                ['sw', '-bottom-1.5 -left-1.5 cursor-nesw-resize'],
                                ['w', 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize'],
                              ] as [DragHandle, string][]
                            ).map(([handle, posClass]) => (
                              <div
                                key={handle}
                                onPointerDown={(e) => handleBoxPointerDown(e, reg, handle)}
                                className={`absolute w-3 h-3 rounded-[3px] bg-white border-2 border-teal-700 shadow-xs z-20 ${posClass}`}
                              />
                            ))}
                        </div>
                      );
                    })}

                    {/* Live Draft Box while drawing */}
                    {draftBox && draftBox.w > 0.005 && draftBox.h > 0.005 && (
                      <div
                        style={{
                          left: `${draftBox.x * 100}%`,
                          top: `${draftBox.y * 100}%`,
                          width: `${draftBox.w * 100}%`,
                          height: `${draftBox.h * 100}%`,
                        }}
                        className="absolute border-2 border-dashed border-teal-600 bg-teal-400/20 pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Page Strip for Multi-Page PDFs */}
              {totalPages > 1 && (
                <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 shrink-0">
                    Pages:
                  </span>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const count = regions.filter((r) => r.page === p).length;
                    const inScope = activeTargetPages.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer border ${
                          currentPage === p
                            ? 'bg-teal-600 text-white border-teal-600'
                            : count > 0 && inScope
                            ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                        {count > 0 ? ` (${count})` : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          STAGE 3: MANDATORY BEFORE-AND-AFTER INSPECTION & APPROVAL
         ================================================================= */}
      {stage === 'review' && result && activeReviewPreview && (
        <div className="space-y-5">
          {/* Review Header Banner */}
          <div className="bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 text-xs font-extrabold uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" />
                Mandatory Before &amp; After Review
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Inspect Your Clean PDF Before Downloading
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Cleaned {result.modifiedPages.length} of {result.pageCount} page{result.pageCount > 1 ? 's' : ''} ·{' '}
                {result.vectorCleanedPages.length > 0 && (
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">
                    {result.vectorCleanedPages.length} lossless vector text-cleaned
                  </span>
                )}
                {result.vectorCleanedPages.length > 0 && result.inpaintedPages.length > 0 && ' · '}
                {result.inpaintedPages.length > 0 && (
                  <span className="text-teal-700 dark:text-teal-300 font-semibold">
                    {result.inpaintedPages.length} smart paper-inpainted
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStage('edit');
                setCurrentPage(reviewPage);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back &amp; Adjust Selection
            </button>
          </div>

          {/* Overlap Warning Callout in Review */}
          {(result.warnings.length > 0 || activeReviewPreview.hadOverlapWarning) && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold">
                  Please check readability closely before approving!
                </p>
                {result.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
                <p className="text-amber-800 dark:text-amber-300">
                  If any important text, signature, or stamp was affected, click <strong>Back &amp; Adjust Selection</strong> to tighten the box.
                </p>
              </div>
            </div>
          )}

          {/* Comparison Viewer Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Comparison Toolbar */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-2.5">
              {/* View Mode Toggle: Draggable Slider vs Side-by-Side */}
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCompareMode('slider')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    compareMode === 'slider'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Before / After Slider
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode('side-by-side')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    compareMode === 'side-by-side'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  Side-by-Side
                </button>
              </div>

              {/* Zoom + Highlight + Focus Affected Area */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHighlightChanges((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    highlightChanges
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {highlightChanges ? '✓ Highlight Changes' : 'Highlight Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleZoomToAffectedArea}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs font-bold cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Zoom to Cleaned Area
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReviewZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 w-10 text-center">
                    {Math.round(reviewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setReviewZoom((z) => Math.min(3, Number((z + 0.5).toFixed(1))))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Page Navigation + Method Badge */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                  disabled={reviewPage <= 1}
                  className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  Page {reviewPage} of {result.pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setReviewPage((p) => Math.min(result.pageCount, p + 1))}
                  disabled={reviewPage >= result.pageCount}
                  className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  activeReviewPreview.methodUsed === 'vector-text-clean'
                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                    : activeReviewPreview.methodUsed === 'smart-inpaint'
                    ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {activeReviewPreview.methodUsed === 'vector-text-clean'
                  ? 'Lossless Vector Text Removed (100% Original Quality)'
                  : activeReviewPreview.methodUsed === 'smart-inpaint'
                  ? 'Smart Directional Paper Reconstruction'
                  : 'Unchanged Page (100% Original Preserved)'}
              </span>
            </div>

            {/* Viewport Area */}
            <div
              ref={reviewScrollRef}
              className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 overflow-auto max-h-[650px]"
            >
              {compareMode === 'slider' ? (
                <div className="flex justify-center">
                  <div
                    ref={sliderBoxRef}
                    onPointerDown={(e) => {
                      isDraggingSliderRef.current = true;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateSliderFromClientX(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (!isDraggingSliderRef.current) return;
                      updateSliderFromClientX(e.clientX);
                    }}
                    onPointerUp={(e) => {
                      isDraggingSliderRef.current = false;
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch {
                        // Ignore
                      }
                    }}
                    className="relative inline-block shadow-2xl rounded-lg overflow-hidden bg-white select-none cursor-ew-resize touch-none"
                    style={{
                      width: `${Math.min(720, activeReviewPreview.width) * reviewZoom}px`,
                      aspectRatio: `${activeReviewPreview.width} / ${activeReviewPreview.height}`,
                    }}
                  >
                    {/* Base Layer: CLEANED PDF Page */}
                    <img
                      src={activeReviewPreview.cleanedDataUrl}
                      alt={`Cleaned page ${reviewPage}`}
                      className="w-full h-full block object-contain pointer-events-none"
                      draggable={false}
                    />

                    {/* Top Clipped Layer: ORIGINAL PDF Page (Left of Slider) */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                      <img
                        src={activeReviewPreview.originalDataUrl}
                        alt={`Original page ${reviewPage}`}
                        className="w-full h-full block object-contain"
                        draggable={false}
                      />
                    </div>

                    {/* Optional Highlight Outlines around Changed Regions */}
                    {highlightChanges &&
                      activeReviewPreview.regionsApplied.map((reg) => (
                        <div
                          key={reg.id}
                          style={{
                            left: `${reg.x * 100}%`,
                            top: `${reg.y * 100}%`,
                            width: `${reg.w * 100}%`,
                            height: `${reg.h * 100}%`,
                          }}
                          className="absolute border-2 border-dashed border-emerald-500 bg-emerald-400/10 pointer-events-none z-10"
                        />
                      ))}

                    {/* Floating Corner Labels */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[11px] font-extrabold tracking-wide pointer-events-none z-20">
                      ORIGINAL
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-emerald-600/90 text-white text-[11px] font-extrabold tracking-wide pointer-events-none z-20">
                      CLEANED
                    </span>

                    {/* Draggable Divider Handle */}
                    <div
                      style={{ left: `${sliderPos}%` }}
                      className="absolute inset-y-0 -ml-[1.5px] w-[3px] bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.9)] z-30 pointer-events-none flex items-center justify-center"
                    >
                      <div className="w-9 h-9 rounded-full bg-teal-600 text-white border-2 border-white shadow-lg flex items-center justify-center text-xs font-black">
                        ↔
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Side-by-Side Comparison View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center">
                      Original Page {reviewPage}
                    </div>
                    <div className="overflow-auto rounded-lg shadow-lg bg-white border border-slate-200 dark:border-slate-700">
                      <div
                        className="relative mx-auto"
                        style={{ width: `${100 * reviewZoom}%` }}
                      >
                        <img
                          src={activeReviewPreview.originalDataUrl}
                          alt={`Original page ${reviewPage}`}
                          className="w-full h-auto block"
                        />
                        {highlightChanges &&
                          activeReviewPreview.regionsApplied.map((reg) => (
                            <div
                              key={reg.id}
                              style={{
                                left: `${reg.x * 100}%`,
                                top: `${reg.y * 100}%`,
                                width: `${reg.w * 100}%`,
                                height: `${reg.h * 100}%`,
                              }}
                              className="absolute border-2 border-dashed border-rose-500 bg-rose-400/15 pointer-events-none"
                            />
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 text-center">
                      Cleaned Page {reviewPage}
                    </div>
                    <div className="overflow-auto rounded-lg shadow-lg bg-white border-2 border-emerald-400 dark:border-emerald-700">
                      <div
                        className="relative mx-auto"
                        style={{ width: `${100 * reviewZoom}%` }}
                      >
                        <img
                          src={activeReviewPreview.cleanedDataUrl}
                          alt={`Cleaned page ${reviewPage}`}
                          className="w-full h-auto block"
                        />
                        {highlightChanges &&
                          activeReviewPreview.regionsApplied.map((reg) => (
                            <div
                              key={reg.id}
                              style={{
                                left: `${reg.x * 100}%`,
                                top: `${reg.y * 100}%`,
                                width: `${reg.w * 100}%`,
                                height: `${reg.h * 100}%`,
                              }}
                              className="absolute border-2 border-dashed border-emerald-500 bg-emerald-400/10 pointer-events-none"
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Approval & Download Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={userApproved}
                onChange={(e) => setUserApproved(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-teal-600 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <strong>I have inspected the Before &amp; After comparison</strong> and confirm that the unwanted scanner-app label was removed cleanly without damaging important document content.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadCleanPdf}
                disabled={!userApproved}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Clean PDF ({formatBytes(result.blob.size)})
              </button>

              <button
                type="button"
                onClick={() => {
                  setStage('edit');
                  setCurrentPage(reviewPage);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Adjust Selection
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Clean Another PDF
              </button>
            </div>

            {hasDownloaded && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Clean PDF downloaded successfully ({result.filename}).
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommended Next Tools */}
      {onSelectNextTool && (
        <RecommendedNextTools currentToolId="remove-scan-watermark" onSelectTool={onSelectNextTool} />
      )}
    </div>
  );
};

export default RemoveScanWatermarkTool;
