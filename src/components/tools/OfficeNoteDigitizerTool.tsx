import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  Play,
  StopCircle,
  Trash2,
  FileText,
  Sparkles,
  Languages,
  PenTool,
  Plus,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Columns2,
  History,
  Save,
  X,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ToolDefinition } from '../../types/tools';
import { formatBytes } from '../../services/utils/downloadUtils';
import { triggerToast } from '../common/Toast';
import { RecommendedNextTools } from './RecommendedNextTools';
import {
  DEFAULT_ENHANCEMENT_SETTINGS,
  DigitizerPageItem,
  DigitizerSourceFile,
  HandwritingStyleMode,
  HtrLanguageMode,
  HtrLineResult,
  ImageEnhancementSettings,
  ModelLoadProgress,
} from '../../services/htr/types';
import {
  MAX_FILE_SIZE_MB,
  loadDocumentsLocally,
  rehydrateDraftSourcesLocally,
  renderPageToCanvas,
  validateIncomingFiles,
} from '../../services/htr/documentLoader';
import {
  applyImageEnhancements,
  estimateAutoDeskewAngle,
} from '../../services/htr/imageEnhancer';
import { detectHandwrittenLines } from '../../services/htr/lineSegmenter';
import {
  checkBrowserHtrCompatibility,
  localHtrEngine,
  reconstructTextFromLines,
} from '../../services/htr/htrEngine';
import {
  LocalDraftSummary,
  deleteLocalDraft,
  loadLocalDraftFull,
  loadLocalDraftSummary,
  saveLocalDraft,
} from '../../services/htr/draftStorage';
import { ImageEnhancementPanel } from './office-note/ImageEnhancementPanel';
import { SideBySideEditor } from './office-note/SideBySideEditor';
import { ExportDocumentPanel } from './office-note/ExportDocumentPanel';

interface OfficeNoteDigitizerToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

function formatClockTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDraftDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'recently';
  }
}

/**
 * Builds the canvas fed into line detection, recognition, or export.
 * Geometry transforms (rotation + deskew) are ALWAYS honored even when optional
 * contrast/shadow cleanup filters are unchecked.
 */
function buildPageWorkingCanvas(
  rawCanvas: HTMLCanvasElement,
  page: DigitizerPageItem,
  applyToneFilters = page.useEnhancedForRecognition
): HTMLCanvasElement {
  if (applyToneFilters) {
    return applyImageEnhancements(rawCanvas, page.enhancement);
  }
  const hasGeometry =
    page.enhancement.rotation !== 0 || Math.abs(page.enhancement.deskewDeg) >= 0.15;
  if (hasGeometry) {
    return applyImageEnhancements(rawCanvas, {
      ...DEFAULT_ENHANCEMENT_SETTINGS,
      rotation: page.enhancement.rotation,
      deskewDeg: page.enhancement.deskewDeg,
      enabled: false,
    });
  }
  return rawCanvas;
}

export const OfficeNoteDigitizerTool: React.FC<OfficeNoteDigitizerToolProps> = ({
  tool,
  onSelectNextTool,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfDocsRef = useRef<Map<string, any>>(new Map());
  const imageUrlsRef = useRef<Map<string, string>>(new Map());
  const originalCanvasRef = useRef<{ pageId: string; canvas: HTMLCanvasElement } | null>(null);
  const cancelBatchRef = useRef<boolean>(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);

  const [sources, setSources] = useState<DigitizerSourceFile[]>([]);
  const [pages, setPages] = useState<DigitizerPageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [checkedPageIds, setCheckedPageIds] = useState<Set<string>>(new Set());

  // Workspace tab: Enhancement Studio vs Side-by-Side Document Editor
  const [workspaceTab, setWorkspaceTab] = useState<'enhance' | 'editor'>('enhance');

  // Recognition configuration (Hindi + English default per product spec)
  const [languageMode, setLanguageMode] = useState<HtrLanguageMode>('hin+eng');
  const [handwritingStyle, setHandwritingStyle] = useState<HandwritingStyleMode>('auto');

  // Preview state for active page
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [enhancedPreviewUrl, setEnhancedPreviewUrl] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [isAutoDeskewing, setIsAutoDeskewing] = useState(false);
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);

  // Recognition progress state
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [rerunningLineId, setRerunningLineId] = useState<string | null>(null);
  const [modelProgress, setModelProgress] = useState<ModelLoadProgress | null>(null);
  const [copiedPageId, setCopiedPageId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // 100% Local IndexedDB Draft Autosave & Recovery state
  const [savedDraftSummary, setSavedDraftSummary] = useState<LocalDraftSummary | null>(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<number | null>(null);

  const deviceCompat = useMemo(() => checkBrowserHtrCompatibility(), []);

  const selectedPageIndex = useMemo(() => {
    if (pages.length === 0) return -1;
    const idx = pages.findIndex((p) => p.id === selectedPageId);
    return idx >= 0 ? idx : 0;
  }, [pages, selectedPageId]);

  const selectedPage = selectedPageIndex >= 0 ? pages[selectedPageIndex] : null;

  const totalUploadBytes = useMemo(
    () => sources.reduce((sum, s) => sum + s.size, 0),
    [sources]
  );

  const hasLiveMediaForPage = useCallback((page: DigitizerPageItem | null): boolean => {
    if (!page) return false;
    return page.sourceType === 'pdf'
      ? pdfDocsRef.current.has(page.sourceFileId)
      : imageUrlsRef.current.has(page.sourceFileId);
  }, []);

  // Check for existing local IndexedDB draft on mount
  useEffect(() => {
    let active = true;
    loadLocalDraftSummary().then((summary) => {
      if (active && summary) {
        setSavedDraftSummary(summary);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Debounced 100% local IndexedDB autosave whenever pages/settings change
  useEffect(() => {
    if (pages.length === 0 || isRecognizing) return;
    const timer = window.setTimeout(async () => {
      const res = await saveLocalDraft({
        languageMode,
        handwritingStyle,
        selectedPageId: selectedPage?.id || null,
        sources,
        pages,
      });
      if (res) {
        setLastAutosavedAt(res.savedAt);
      }
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [pages, sources, languageMode, handwritingStyle, selectedPage?.id, isRecognizing]);

  // Cleanup browser object URLs and active worker jobs on unmount
  useEffect(() => {
    return () => {
      localHtrEngine.cancelActiveJob();
      for (const url of imageUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      imageUrlsRef.current.clear();
      pdfDocsRef.current.clear();
      if (originalCanvasRef.current) {
        originalCanvasRef.current.canvas.width = 0;
        originalCanvasRef.current.canvas.height = 0;
        originalCanvasRef.current = null;
      }
    };
  }, []);

  // Re-render original & enhanced previews lazily whenever selected page or enhancement settings change
  useEffect(() => {
    let cancelled = false;
    if (!selectedPage) {
      setOriginalPreviewUrl(null);
      setEnhancedPreviewUrl(null);
      return;
    }

    // If this page came from a text-only >40MB restored draft, gracefully show stored thumbnail
    if (!hasLiveMediaForPage(selectedPage)) {
      setOriginalPreviewUrl(selectedPage.thumbnailUrl);
      setEnhancedPreviewUrl(selectedPage.thumbnailUrl);
      setIsRenderingPreview(false);
      return;
    }

    const renderActivePreviews = async () => {
      setIsRenderingPreview(true);
      try {
        let baseCanvas: HTMLCanvasElement;
        if (originalCanvasRef.current && originalCanvasRef.current.pageId === selectedPage.id) {
          baseCanvas = originalCanvasRef.current.canvas;
        } else {
          if (originalCanvasRef.current) {
            originalCanvasRef.current.canvas.width = 0;
            originalCanvasRef.current.canvas.height = 0;
          }
          baseCanvas = await renderPageToCanvas(
            selectedPage,
            pdfDocsRef.current,
            imageUrlsRef.current,
            1650
          );
          if (cancelled) {
            baseCanvas.width = 0;
            baseCanvas.height = 0;
            return;
          }
          originalCanvasRef.current = { pageId: selectedPage.id, canvas: baseCanvas };
        }

        // Keep Original preview aligned with page rotation so Split Compare & overlays match
        let origCanvas: HTMLCanvasElement = baseCanvas;
        if (selectedPage.enhancement.rotation !== 0) {
          origCanvas = applyImageEnhancements(baseCanvas, {
            ...DEFAULT_ENHANCEMENT_SETTINGS,
            rotation: selectedPage.enhancement.rotation,
            enabled: false,
          });
        }
        const origUrl = origCanvas.toDataURL('image/jpeg', 0.9);
        if (origCanvas !== baseCanvas) {
          origCanvas.width = 0;
          origCanvas.height = 0;
        }

        const enhancedCanvas = applyImageEnhancements(baseCanvas, selectedPage.enhancement);
        const enhUrl = enhancedCanvas.toDataURL('image/jpeg', 0.9);
        enhancedCanvas.width = 0;
        enhancedCanvas.height = 0;

        if (!cancelled) {
          setOriginalPreviewUrl(origUrl);
          setEnhancedPreviewUrl(enhUrl);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMessages([err?.message || 'Failed to render page preview locally.']);
        }
      } finally {
        if (!cancelled) setIsRenderingPreview(false);
      }
    };

    const timer = window.setTimeout(renderActivePreviews, 40);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedPage?.id, selectedPage?.enhancement, hasLiveMediaForPage]);

  const handleRestoreLocalDraft = async () => {
    setIsRestoringDraft(true);
    setErrorMessages([]);
    try {
      const full = await loadLocalDraftFull();
      if (!full) {
        setSavedDraftSummary(null);
        triggerToast('info', 'No saved local draft found in browser storage.');
        return;
      }

      const hydrated = await rehydrateDraftSourcesLocally(full.sources);
      hydrated.pdfDocs.forEach((doc, k) => pdfDocsRef.current.set(k, doc));
      hydrated.imageObjectUrls.forEach((url, k) => imageUrlsRef.current.set(k, url));

      setSources(hydrated.sources);
      setPages(full.pages);
      setLanguageMode(full.languageMode);
      setHandwritingStyle(full.handwritingStyle);
      setSelectedPageId(full.selectedPageId || full.pages[0]?.id || null);
      setLastAutosavedAt(full.savedAt);
      setSavedDraftSummary(null);

      const hasAnyRecognized = full.pages.some(
        (p) => p.status === 'done' || p.editedText.trim().length > 0
      );
      setWorkspaceTab(hasAnyRecognized ? 'editor' : 'enhance');

      if (!hydrated.hasLiveMedia) {
        setWarningMessages([
          'Restored your saved text & page thumbnails locally. Because original files exceeded 40 MB, re-upload the scan if you want to re-run recognition or adjust enhancements.',
        ]);
      }

      triggerToast(
        'success',
        `Restored local draft (${full.pages.length} page${full.pages.length === 1 ? '' : 's'}).`
      );
    } catch (err: any) {
      setErrorMessages([err?.message || 'Could not restore local draft from browser storage.']);
    } finally {
      setIsRestoringDraft(false);
    }
  };

  const handleDeleteLocalDraft = async () => {
    await deleteLocalDraft();
    setSavedDraftSummary(null);
    setLastAutosavedAt(null);
    triggerToast('info', 'Deleted saved local draft from browser storage.');
  };

  const handleIncomingFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const fileArray = Array.from(incoming);
      if (fileArray.length === 0) return;

      setErrorMessages([]);
      const { validFiles, errors } = validateIncomingFiles(fileArray);
      if (errors.length > 0) {
        setErrorMessages(errors);
      }
      if (validFiles.length === 0) return;

      setIsLoadingFiles(true);
      setLoadingStatus('Inspecting documents locally...');
      try {
        const batch = await loadDocumentsLocally(
          validFiles,
          pages.length + 1,
          (msg) => setLoadingStatus(msg)
        );

        batch.pdfDocs.forEach((doc, key) => pdfDocsRef.current.set(key, doc));
        batch.imageObjectUrls.forEach((url, key) => imageUrlsRef.current.set(key, url));

        if (batch.warnings.length > 0) {
          setWarningMessages((prev) => [...prev, ...batch.warnings]);
        }

        setSavedDraftSummary(null);
        setSources((prev) => [...prev, ...batch.sources]);
        setPages((prev) => {
          const next = [...prev, ...batch.pages];
          if (!selectedPageId && next.length > 0) {
            setSelectedPageId(next[0].id);
          }
          return next;
        });

        triggerToast(
          'success',
          `Loaded ${batch.pages.length} page${batch.pages.length === 1 ? '' : 's'} locally in your browser.`
        );
      } catch (err: any) {
        setErrorMessages((prev) => [
          ...prev,
          err?.message || 'Could not load one or more files. Please check that the files are not corrupted.',
        ]);
      } finally {
        setIsLoadingFiles(false);
        setLoadingStatus('');
      }
    },
    [pages.length, selectedPageId]
  );

  const handleClearSession = () => {
    if (isRecognizing) {
      cancelBatchRef.current = true;
      localHtrEngine.cancelActiveJob();
      setIsRecognizing(false);
    }
    for (const url of imageUrlsRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    imageUrlsRef.current.clear();
    pdfDocsRef.current.clear();
    if (originalCanvasRef.current) {
      originalCanvasRef.current.canvas.width = 0;
      originalCanvasRef.current.canvas.height = 0;
      originalCanvasRef.current = null;
    }
    setSources([]);
    setPages([]);
    setSelectedPageId(null);
    setCheckedPageIds(new Set());
    setOriginalPreviewUrl(null);
    setEnhancedPreviewUrl(null);
    setErrorMessages([]);
    setWarningMessages([]);
    setHighlightedLineId(null);
    setWorkspaceTab('enhance');
    // Refresh recovery banner availability in case user kept their local draft
    loadLocalDraftSummary().then((summary) => setSavedDraftSummary(summary));
  };

  const updateSelectedPage = (updater: (page: DigitizerPageItem) => DigitizerPageItem) => {
    if (!selectedPage) return;
    setPages((prev) => prev.map((p) => (p.id === selectedPage.id ? updater(p) : p)));
  };

  const handleChangePageEditedText = useCallback((pageId: string, nextText: string) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, editedText: nextText } : p)));
  }, []);

  const handleChangeEnhancement = (nextSettings: ImageEnhancementSettings) => {
    updateSelectedPage((p) => ({ ...p, enhancement: nextSettings }));
  };

  const handleToggleUseEnhanced = (useEnhanced: boolean) => {
    updateSelectedPage((p) => ({ ...p, useEnhancedForRecognition: useEnhanced }));
  };

  // Multi-page management: select, reorder, remove
  const togglePageChecked = (pageId: string) => {
    setCheckedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const handleSelectAllPages = () => {
    setCheckedPageIds(new Set(pages.map((p) => p.id)));
  };

  const handleSelectPendingPages = () => {
    setCheckedPageIds(new Set(pages.filter((p) => p.status !== 'done').map((p) => p.id)));
  };

  const handleClearCheckedPages = () => {
    setCheckedPageIds(new Set());
  };

  const handleMovePage = (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, moved);
      return copy.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const handleRemovePage = (pageId: string) => {
    if (isRecognizing) return;
    if (pages.length <= 1 && pages[0]?.id === pageId) {
      handleClearSession();
      return;
    }
    setPages((prev) => {
      const filtered = prev.filter((p) => p.id !== pageId).map((p, i) => ({ ...p, pageNumber: i + 1 }));
      if (selectedPageId === pageId) {
        setSelectedPageId(filtered[0]?.id || null);
      }
      return filtered;
    });
    setCheckedPageIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
  };

  const handleNavigatePage = (direction: 'prev' | 'next') => {
    if (selectedPageIndex < 0) return;
    const nextIdx = direction === 'prev' ? selectedPageIndex - 1 : selectedPageIndex + 1;
    if (nextIdx >= 0 && nextIdx < pages.length) {
      setSelectedPageId(pages[nextIdx].id);
      setHighlightedLineId(null);
    }
  };

  const handleAutoDeskew = async () => {
    if (!selectedPage || !originalCanvasRef.current) return;
    setIsAutoDeskewing(true);
    try {
      await new Promise((r) => window.setTimeout(r, 20));
      const rotated = applyImageEnhancements(originalCanvasRef.current.canvas, {
        ...selectedPage.enhancement,
        enabled: false,
        deskewDeg: 0,
        shadowRemoval: 0,
        faintInkBoost: 0,
        contrast: 0,
        brightness: 0,
        noiseReduction: false,
        grayscale: false,
        binarize: false,
      });
      const angle = estimateAutoDeskewAngle(rotated);
      rotated.width = 0;
      rotated.height = 0;

      updateSelectedPage((p) => ({
        ...p,
        enhancement: { ...p.enhancement, deskewDeg: angle },
        useEnhancedForRecognition: true,
      }));

      triggerToast(
        'info',
        angle === 0
          ? 'Scan alignment looks straight (0.0° tilt detected).'
          : `Auto-deskew adjusted tilt by ${angle > 0 ? '+' : ''}${angle.toFixed(1)}°.`
      );
    } finally {
      setIsAutoDeskewing(false);
    }
  };

  const handleDetectLinesPreview = async () => {
    if (!selectedPage || !originalCanvasRef.current) return;
    const targetCanvas = buildPageWorkingCanvas(originalCanvasRef.current.canvas, selectedPage);

    const lines = detectHandwrittenLines(targetCanvas);
    if (targetCanvas !== originalCanvasRef.current.canvas) {
      targetCanvas.width = 0;
      targetCanvas.height = 0;
    }

    updateSelectedPage((p) => ({ ...p, detectedLines: lines }));
    triggerToast(
      lines.length > 0 ? 'success' : 'info',
      lines.length > 0
        ? `Detected ${lines.length} handwritten text line${lines.length === 1 ? '' : 's'} on Page ${selectedPage.pageNumber}.`
        : 'No clear handwritten lines detected. Try the "Faded Old Record" enhancement preset.'
    );
  };

  const recognizePageList = async (targetPageIds: string[]) => {
    if (!deviceCompat.supported) {
      setErrorMessages([
        deviceCompat.warning ||
          'Your browser is not supported for offline processing. Please use a recent version of Chrome, Edge, Firefox, or Safari.',
      ]);
      return;
    }

    const runnableIds = targetPageIds.filter((id) => {
      const p = pages.find((item) => item.id === id);
      return p && hasLiveMediaForPage(p);
    });

    if (runnableIds.length === 0) {
      setErrorMessages([
        'Original scan files are not loaded in memory for the selected pages. Please upload the scan file to run recognition.',
      ]);
      return;
    }

    setErrorMessages([]);
    cancelBatchRef.current = false;
    setIsRecognizing(true);

    let completedCount = 0;
    try {
      for (const pageId of runnableIds) {
        if (cancelBatchRef.current) break;

        const currentPage = pages.find((p) => p.id === pageId);
        if (!currentPage) continue;

        setSelectedPageId(pageId);
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  status: 'enhancing',
                  progressPercent: 8,
                  statusMessage: 'Processing...',
                  error: undefined,
                }
              : p
          )
        );

        let rawCanvas: HTMLCanvasElement | null = null;
        let workingCanvas: HTMLCanvasElement | null = null;

        try {
          rawCanvas = await renderPageToCanvas(
            currentPage,
            pdfDocsRef.current,
            imageUrlsRef.current,
            1800
          );

          workingCanvas = buildPageWorkingCanvas(rawCanvas, currentPage);

          const output = await localHtrEngine.recognizePageCanvas(
            workingCanvas,
            languageMode,
            handwritingStyle,
            {
              onModelProgress: (mp) => setModelProgress(mp),
              onLinesDetected: (lines) => {
                setPages((prev) =>
                  prev.map((p) => (p.id === pageId ? { ...p, detectedLines: lines } : p))
                );
              },
              onStageChange: (stage, detail, percent) => {
                setPages((prev) =>
                  prev.map((p) =>
                    p.id === pageId
                      ? { ...p, status: stage, statusMessage: detail, progressPercent: percent }
                      : p
                  )
                );
              },
            }
          );

          const rotDelta = output.appliedRotationDelta || 0;
          if (rotDelta !== 0) {
            triggerToast('info', 'Auto-rotated page upright for accurate reading.');
          }

          completedCount++;
          setPages((prev) =>
            prev.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    enhancement:
                      rotDelta !== 0
                        ? {
                            ...p.enhancement,
                            rotation: ((p.enhancement.rotation + rotDelta) % 360) as
                              | 0
                              | 90
                              | 180
                              | 270,
                          }
                        : p.enhancement,
                    status: 'done',
                    progressPercent: 100,
                    statusMessage:
                      output.lines.length > 0
                        ? `Completed ${output.lines.length} lines in ${(output.processingMs / 1000).toFixed(1)}s`
                        : 'No readable handwritten lines detected on this page',
                    recognizedLines: output.lines,
                    recognizedText: output.text,
                    editedText: output.text,
                    modelUsed: output.modelUsed,
                    processingMs: output.processingMs,
                  }
                : p
            )
          );
        } catch (err: any) {
          const msg = String(err?.message || err || 'Recognition error');
          if (msg === 'PROCESSING_CANCELLED' || cancelBatchRef.current) {
            setPages((prev) =>
              prev.map((p) =>
                p.id === pageId
                  ? { ...p, status: 'cancelled', statusMessage: 'Cancelled by user' }
                  : p
              )
            );
            break;
          }

          setPages((prev) =>
            prev.map((p) =>
              p.id === pageId
                ? { ...p, status: 'error', error: msg, statusMessage: 'Recognition failed' }
                : p
            )
          );
          setErrorMessages([msg]);
        } finally {
          if (workingCanvas && workingCanvas !== rawCanvas) {
            workingCanvas.width = 0;
            workingCanvas.height = 0;
          }
          if (rawCanvas) {
            rawCanvas.width = 0;
            rawCanvas.height = 0;
          }
        }
      }

      if (!cancelBatchRef.current && completedCount > 0) {
        setWorkspaceTab('editor');
        triggerToast(
          'success',
          `Finished converting ${completedCount} page${completedCount === 1 ? '' : 's'}.`
        );
      }
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleCancelRecognition = () => {
    cancelBatchRef.current = true;
    localHtrEngine.cancelActiveJob();
    setIsRecognizing(false);
    triggerToast('info', 'Recognition cancelled.');
  };

  const handleCopyPageText = (page: DigitizerPageItem) => {
    if (!page.editedText.trim()) return;
    navigator.clipboard?.writeText(page.editedText).catch(() => {});
    setCopiedPageId(page.id);
    triggerToast('success', `Copied Page ${page.pageNumber} text to clipboard.`);
    window.setTimeout(() => setCopiedPageId(null), 2000);
  };

  const handleCopyAllPagesText = () => {
    const combined = pages
      .map((p) =>
        pages.length > 1
          ? `--- Page ${p.pageNumber} (${p.sourceFileName}) ---\n${p.editedText.trim()}`
          : p.editedText.trim()
      )
      .filter(Boolean)
      .join('\n\n');
    if (!combined.trim()) {
      triggerToast('info', 'No recognized or edited text to copy yet.');
      return;
    }
    navigator.clipboard?.writeText(combined).catch(() => {});
    setCopiedAll(true);
    triggerToast('success', `Copied combined text from ${pages.length} pages.`);
    window.setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleRerunSingleLine = async (
    page: DigitizerPageItem,
    line: HtrLineResult,
    targetScript: 'hin' | 'eng'
  ) => {
    if (isRecognizing || rerunningLineId || !hasLiveMediaForPage(page)) return;
    setRerunningLineId(line.id);
    setErrorMessages([]);
    let rawCanvas: HTMLCanvasElement | null = null;
    let workingCanvas: HTMLCanvasElement | null = null;

    try {
      rawCanvas = await renderPageToCanvas(page, pdfDocsRef.current, imageUrlsRef.current, 1800);
      workingCanvas = buildPageWorkingCanvas(rawCanvas, page);

      const updatedLine = await localHtrEngine.recognizeSingleLine(
        workingCanvas,
        {
          id: line.id,
          lineIndex: line.lineIndex,
          pixelBox: line.pixelBox,
          normalizedBox: line.normalizedBox,
          paragraphBreakAfter: line.paragraphBreakAfter,
        },
        targetScript,
        {
          onModelProgress: (mp) => setModelProgress(mp),
        }
      );

      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== page.id) return p;
          const nextLines = p.recognizedLines.map((l) => (l.id === line.id ? updatedLine : l));
          const nextRecognizedText = reconstructTextFromLines(nextLines);
          const shouldSyncEdited =
            p.editedText === p.recognizedText ||
            (line.text.trim().length > 0 && p.editedText.includes(line.text.trim()));
          const nextEditedText =
            p.editedText === p.recognizedText
              ? nextRecognizedText
              : shouldSyncEdited && line.text.trim().length > 0
                ? p.editedText.replace(line.text.trim(), updatedLine.text.trim())
                : nextRecognizedText;

          return {
            ...p,
            recognizedLines: nextLines,
            recognizedText: nextRecognizedText,
            editedText: nextEditedText,
          };
        })
      );

      triggerToast(
        'success',
        `Updated Line ${line.lineIndex + 1} in ${targetScript === 'hin' ? 'Hindi' : 'English'}.`
      );
    } catch (err: any) {
      const msg = String(err?.message || err || 'Single-line re-recognition failed.');
      if (msg !== 'PROCESSING_CANCELLED') {
        setErrorMessages([msg]);
      }
    } finally {
      if (workingCanvas && workingCanvas !== rawCanvas) {
        workingCanvas.width = 0;
        workingCanvas.height = 0;
      }
      if (rawCanvas) {
        rawCanvas.width = 0;
        rawCanvas.height = 0;
      }
      setRerunningLineId(null);
    }
  };

  const renderPageForExport = useCallback(
    async (page: DigitizerPageItem, useEnhanced: boolean): Promise<HTMLCanvasElement> => {
      if (hasLiveMediaForPage(page)) {
        const raw = await renderPageToCanvas(page, pdfDocsRef.current, imageUrlsRef.current, 2000);
        const prepared = buildPageWorkingCanvas(raw, page, useEnhanced);
        if (prepared !== raw) {
          raw.width = 0;
          raw.height = 0;
        }
        return prepared;
      }

      // Graceful fallback for >40 MB text+thumbnail restored drafts
      return await new Promise<HTMLCanvasElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, img.naturalWidth || img.width);
          canvas.height = Math.max(1, img.naturalHeight || img.height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
          resolve(canvas);
        };
        img.onerror = () => reject(new Error('Could not decode page thumbnail for PDF export.'));
        img.src = page.thumbnailUrl;
      });
    },
    [hasLiveMediaForPage]
  );

  const checkedCount = checkedPageIds.size;
  const recognizedCount = pages.filter((p) => p.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* Privacy Assurance Banner */}
      <div className="rounded-2xl bg-[#EEFBF3] dark:bg-[#132920] border border-[#BEEAD0] dark:border-[#244E3B] px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#155E3D] dark:text-[#86E5B7] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs leading-relaxed">
          <div className="font-bold text-[#144D33] dark:text-[#C5F6DF]">
            100% Private — Your documents stay on your device.
          </div>
          <div className="text-[#276347] dark:text-[#96D4B6] mt-0.5">
            Your uploaded files and converted text are processed directly in your browser and never sent to any server.
          </div>
        </div>
      </div>

      {/* Browser / Memory Compatibility Warning */}
      {deviceCompat.warning && (
        <div className="rounded-2xl bg-[#FFF8E3] dark:bg-[#2E2612] border border-[#F0D997] dark:border-[#5C4B1D] p-4 flex items-start gap-3 text-xs text-[#7A4F09] dark:text-[#FFE194]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{deviceCompat.warning}</span>
        </div>
      )}

      {/* Local IndexedDB Draft Recovery Banner (shown when no session is open) */}
      {pages.length === 0 && savedDraftSummary && (
        <div className="rounded-2xl bg-[#F4F1FF] dark:bg-[#1E1A3B] border border-[#D4CAF9] dark:border-[#3A3370] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <History className="w-5 h-5 text-[#5B50E6] dark:text-[#B9B0FF] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs min-w-0">
              <div className="font-bold text-[#252536] dark:text-[#F2F4FC]">
                Unsaved local draft found on this device
              </div>
              <div className="text-[#646478] dark:text-[#B4B9D4] mt-0.5 truncate">
                {savedDraftSummary.firstFileName}
                {savedDraftSummary.fileCount > 1 ? ` + ${savedDraftSummary.fileCount - 1} more` : ''} ·{' '}
                {savedDraftSummary.pageCount} page{savedDraftSummary.pageCount === 1 ? '' : 's'} (
                {savedDraftSummary.recognizedCount} digitized) · Saved {formatDraftDate(savedDraftSummary.savedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isRestoringDraft}
              onClick={handleRestoreLocalDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5B50E6] hover:bg-[#4A3FD4] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <History className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isRestoringDraft ? 'Restoring...' : 'Restore Local Draft'}</span>
            </button>
            <button
              type="button"
              disabled={isRestoringDraft}
              onClick={handleDeleteLocalDraft}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#B91C1C] dark:text-rose-300 hover:bg-[#FFF1EE] dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Delete Draft</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errorMessages.length > 0 && (
        <div className="rounded-2xl bg-[#FFF4F0] dark:bg-[#2C1815] border border-[#F3C5B6] dark:border-[#5D3026] p-4 space-y-1.5 text-xs text-[#9A3412] dark:text-[#FFC4B0]">
          {errorMessages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626] dark:text-rose-400" aria-hidden="true" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Non-fatal Warnings */}
      {warningMessages.length > 0 && (
        <div className="rounded-2xl bg-[#EFF7FF] dark:bg-[#16273B] border border-[#C6E0FA] dark:border-[#2A496B] p-3.5 space-y-1 text-xs text-[#1A528C] dark:text-[#B6D9FF]">
          {warningMessages.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleIncomingFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* STEP 1: UPLOAD ZONE (Empty state) */}
      {pages.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleIncomingFiles(e.dataTransfer.files);
          }}
          onClick={() => !isLoadingFiles && fileInputRef.current?.click()}
          className={`rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#5B50E6] bg-[#F2EFFF] dark:bg-[#231E46] scale-[0.995]'
              : 'border-[#D4CEF4] dark:border-[#343A5E] bg-white dark:bg-[#171A2B] hover:border-[#8178F6]'
          }`}
        >
          <div className="max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E9E4FF] dark:bg-[#27224B] border border-[#CFC5FA] dark:border-[#423A78] text-[#5B50E6] dark:text-[#C5BEFF] flex items-center justify-center">
              <UploadCloud className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#252536] dark:text-[#F2F4FC] tracking-tight">
                {isLoadingFiles
                  ? loadingStatus || 'Preparing document locally...'
                  : 'Upload Handwritten Office Notes'}
              </h2>
              <p className="text-sm text-[#646478] dark:text-[#A5AAC4] leading-relaxed">
                Drop a multi-page scanned PDF or multiple JPG / PNG photos of handwritten notes. Enhance faded scans, digitize Hindi & English locally, and proofread side-by-side.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                disabled={isLoadingFiles}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5B50E6] hover:bg-[#4A3FD4] text-white text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" aria-hidden="true" />
                <span>{isLoadingFiles ? 'Loading...' : 'Browse PDF or Images'}</span>
              </button>
            </div>

            <div className="text-xs text-[#777789] dark:text-[#9CA2BE] font-mono">
              PDF · JPG · JPEG · PNG · Up to {MAX_FILE_SIZE_MB} MB per file · Multi-page supported
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Document Info & Recognition Options Bar */}
          <div className="rounded-3xl bg-white dark:bg-[#171A2B] border border-[#E6E4F0] dark:border-[#282D47] p-5 space-y-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#ECEAF4] dark:border-[#242840]">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#E9E4FF] dark:bg-[#27224B] text-[#43348F] dark:text-[#CFC6FF] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-extrabold text-[#252536] dark:text-[#F2F4FC] truncate">
                    {sources.length === 1
                      ? sources[0].name
                      : `${sources[0]?.name || 'Document'} + ${sources.length - 1} more file${sources.length > 2 ? 's' : ''}`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#777789] dark:text-[#9CA2BE] font-mono mt-0.5">
                    <span>{formatBytes(totalUploadBytes)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Saved Draft Status */}
                {lastAutosavedAt && (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#F4F3F9] dark:bg-[#131627] border border-[#E6E4F0] dark:border-[#282D47] text-[11px] font-mono text-[#646478] dark:text-[#A5AAC4]">
                    <Save className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>Saved {formatClockTime(lastAutosavedAt)}</span>
                    <button
                      type="button"
                      onClick={handleDeleteLocalDraft}
                      title="Delete saved draft from this device"
                      className="text-[#B91C1C] dark:text-rose-300 hover:underline font-sans font-semibold ml-1 cursor-pointer"
                    >
                      Delete Draft
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isRecognizing || isLoadingFiles}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E0DDF0] dark:border-[#2F3556] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Pages</span>
                </button>
                <button
                  type="button"
                  disabled={isRecognizing}
                  onClick={handleClearSession}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#B91C1C] dark:text-rose-300 hover:bg-[#FFF1EE] dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Clear Files</span>
                </button>
              </div>
            </div>

            {/* Language Selector + Handwriting Style + Start Recognition CTA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Language Selection */}
              <div className="lg:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-[#252536] dark:text-[#F2F4FC] flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-[#5B50E6] dark:text-[#9D95FF]" aria-hidden="true" />
                  <span>Recognition Language</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F4F3F9] dark:bg-[#111424] border border-[#E6E4F0] dark:border-[#262B45]">
                  {(
                    [
                      { id: 'hin+eng', label: 'Hindi + English' },
                      { id: 'eng', label: 'English' },
                      { id: 'hin', label: 'Hindi (Beta)' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isRecognizing}
                      onClick={() => setLanguageMode(opt.id)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                        languageMode === opt.id
                          ? 'bg-white dark:bg-[#1E2238] text-[#43348F] dark:text-[#CFC6FF] shadow-2xs'
                          : 'text-[#646478] dark:text-[#9FA5C1] hover:text-[#252536] dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {languageMode !== 'eng' && (
                  <p className="text-[11px] text-[#7A4F09] dark:text-[#FFE194] leading-snug">
                    {languageMode === 'hin+eng'
                      ? 'Supports both Hindi and English handwriting. You can edit any word before downloading.'
                      : 'Best for neat Hindi handwriting. You can easily edit any word before downloading.'}
                  </p>
                )}
              </div>

              {/* Handwriting Style */}
              <div className="lg:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-[#252536] dark:text-[#F2F4FC] flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#5B50E6] dark:text-[#9D95FF]" aria-hidden="true" />
                  <span>Handwriting Style</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F4F3F9] dark:bg-[#111424] border border-[#E6E4F0] dark:border-[#262B45]">
                  {(
                    [
                      { id: 'auto', label: 'Auto' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'running', label: 'Running' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isRecognizing}
                      onClick={() => setHandwritingStyle(opt.id)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                        handwritingStyle === opt.id
                          ? 'bg-white dark:bg-[#1E2238] text-[#252536] dark:text-[#F2F4FC] shadow-2xs'
                          : 'text-[#646478] dark:text-[#9FA5C1] hover:text-[#252536] dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Recognition Action */}
              <div className="lg:col-span-3 flex flex-wrap lg:justify-end gap-2">
                {!isRecognizing ? (
                  <>
                    {checkedCount > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          recognizePageList(
                            pages.filter((p) => checkedPageIds.has(p.id)).map((p) => p.id)
                          )
                        }
                        className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B50E6] hover:bg-[#4A3FD4] text-white text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                        <span>Recognize Selected ({checkedCount})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!selectedPage || !hasLiveMediaForPage(selectedPage)}
                        onClick={() => selectedPage && recognizePageList([selectedPage.id])}
                        className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B50E6] hover:bg-[#4A3FD4] text-white text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                        <span>
                          {pages.length > 1
                            ? `Recognize Page ${selectedPage?.pageNumber || 1}`
                            : 'Start Recognition'}
                        </span>
                      </button>
                    )}

                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => recognizePageList(pages.map((p) => p.id))}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#252536] hover:bg-[#373752] dark:bg-[#F2F4FC] dark:text-[#171A2B] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>All ({pages.length})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelRecognition}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <StopCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Cancel Recognition</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clean Single Progress Indicator (No Internal Process Details) */}
            {isRecognizing && (
              <div className="rounded-2xl bg-[#F4F1FF] dark:bg-[#1E1A3B] border border-[#D8D0FA] dark:border-[#39326E] p-4 space-y-2">
                {(() => {
                  const pagePct = selectedPage?.progressPercent ?? 0;
                  const setupPct =
                    modelProgress && modelProgress.phase !== 'ready'
                      ? Math.round(modelProgress.percent * 0.45)
                      : 0;
                  const displayPct = Math.max(
                    6,
                    Math.min(99, pagePct > 15 ? pagePct : Math.max(pagePct, setupPct))
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#43348F] dark:text-[#D5CEFF]">
                          {pages.length > 1 && selectedPage
                            ? `Processing Page ${selectedPage.pageNumber}...`
                            : 'Processing your document...'}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-[#5B50E6] dark:text-[#B9B0FF]">
                          {displayPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#DFD8FA] dark:bg-[#2F2959] overflow-hidden">
                        <div
                          style={{ width: `${displayPct}%` }}
                          className="h-full rounded-full bg-[#5B50E6] dark:bg-[#9D95FF] transition-all duration-300"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Multi-Page Batch & Thumbnail Management Strip */}
          {pages.length > 1 && (
            <div className="rounded-2xl bg-white dark:bg-[#171A2B] border border-[#E6E4F0] dark:border-[#282D47] p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#252536] dark:text-[#F2F4FC]">
                  <span>Document Pages ({pages.length})</span>
                  <span className="font-mono font-normal text-[#777789] dark:text-[#9CA2BE]">
                    · {recognizedCount}/{pages.length} recognized
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    disabled={isRecognizing}
                    onClick={handleSelectAllPages}
                    className="px-2 py-1 rounded-lg font-semibold border border-[#E0DDF0] dark:border-[#2E3454] text-[#646478] dark:text-[#A5AAC4] hover:border-[#5B50E6] hover:text-[#5B50E6] cursor-pointer disabled:opacity-45"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    disabled={isRecognizing}
                    onClick={handleSelectPendingPages}
                    className="px-2 py-1 rounded-lg font-semibold border border-[#E0DDF0] dark:border-[#2E3454] text-[#646478] dark:text-[#A5AAC4] hover:border-[#5B50E6] hover:text-[#5B50E6] cursor-pointer disabled:opacity-45"
                  >
                    Pending Only
                  </button>
                  {checkedCount > 0 && (
                    <button
                      type="button"
                      disabled={isRecognizing}
                      onClick={handleClearCheckedPages}
                      className="px-2 py-1 rounded-lg font-semibold text-[#5B50E6] dark:text-[#A9A2FF] hover:underline cursor-pointer"
                    >
                      Clear ({checkedCount})
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {pages.map((p, idx) => {
                  const isCurrent = selectedPage?.id === p.id;
                  const isChecked = checkedPageIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPageId(p.id);
                        setHighlightedLineId(null);
                      }}
                      className={`shrink-0 w-28 rounded-xl border p-1.5 text-left transition-all cursor-pointer select-none ${
                        isCurrent
                          ? 'border-[#5B50E6] bg-[#F3F0FF] dark:bg-[#241F46] ring-1 ring-[#5B50E6]'
                          : 'border-[#E6E4F0] dark:border-[#2A304D] bg-[#FAFAFC] dark:bg-[#121524] hover:border-[#ABA2EB]'
                      }`}
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white border border-black/8 mb-1.5">
                        <img
                          src={p.thumbnailUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Selection Checkbox */}
                        <button
                          type="button"
                          disabled={isRecognizing}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePageChecked(p.id);
                          }}
                          title={isChecked ? 'Deselect page for batch' : 'Select page for batch recognition'}
                          className="absolute top-1 left-1 p-0.5 rounded-md bg-white/90 dark:bg-[#171A2B]/90 text-[#5B50E6] shadow-xs cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[#8A8AA0]" />
                          )}
                        </button>
                        {/* Remove Page */}
                        {!isRecognizing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePage(p.id);
                            }}
                            title={`Remove Page ${p.pageNumber}`}
                            className="absolute top-1 right-1 p-0.5 rounded-md bg-white/90 dark:bg-[#171A2B]/90 text-[#777789] hover:text-[#DC2626] shadow-xs cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                        <span className="text-[#252536] dark:text-[#F2F4FC]">Pg {p.pageNumber}</span>
                        <div className="flex items-center gap-1">
                          {p.status === 'done' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400" />
                          )}
                          {p.status === 'error' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                          )}
                        </div>
                      </div>

                      {/* Quick reorder arrows for active page */}
                      {isCurrent && !isRecognizing && (
                        <div
                          className="mt-1 pt-1 border-t border-[#E0DDF0] dark:border-[#343063] flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMovePage(idx, -1)}
                            title="Move page left"
                            className="p-0.5 rounded text-[#5B50E6] dark:text-[#B9B0FF] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <span className="text-[9px] font-mono text-[#777789] dark:text-[#9CA2BE]">Order</span>
                          <button
                            type="button"
                            disabled={idx === pages.length - 1}
                            onClick={() => handleMovePage(idx, 1)}
                            title="Move page right"
                            className="p-0.5 rounded text-[#5B50E6] dark:text-[#B9B0FF] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WORKSPACE MODE SWITCHER: ENHANCEMENT STUDIO vs SIDE-BY-SIDE DOCUMENT EDITOR */}
          {selectedPage && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Workspace view"
                className="inline-flex p-1 rounded-2xl bg-[#ECEAF4] dark:bg-[#191D32] border border-[#E0DDF0] dark:border-[#2A304D]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={workspaceTab === 'enhance'}
                  onClick={() => setWorkspaceTab('enhance')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workspaceTab === 'enhance'
                      ? 'bg-white dark:bg-[#252A47] text-[#43348F] dark:text-[#CFC6FF] shadow-xs'
                      : 'text-[#646478] dark:text-[#9CA2BE] hover:text-[#252536] dark:hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>1. Enhance & Prepare Scan</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={workspaceTab === 'editor'}
                  onClick={() => setWorkspaceTab('editor')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workspaceTab === 'editor'
                      ? 'bg-white dark:bg-[#252A47] text-[#43348F] dark:text-[#CFC6FF] shadow-xs'
                      : 'text-[#646478] dark:text-[#9CA2BE] hover:text-[#252536] dark:hover:text-white'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>2. Side-by-Side Editor</span>
                  {selectedPage.status === 'done' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="text-xs text-[#777789] dark:text-[#9CA2BE]">
                {workspaceTab === 'enhance'
                  ? 'Optional: clean up faded paper, shadows, or tilt before running recognition.'
                  : 'Proofread and edit Hindi & English text directly next to the original scan.'}
              </div>
            </div>
          )}

          {/* TAB 1: NON-DESTRUCTIVE IMAGE ENHANCEMENT STUDIO */}
          {selectedPage && workspaceTab === 'enhance' && (
            <ImageEnhancementPanel
              pageNumber={selectedPage.pageNumber}
              sourceFileName={selectedPage.sourceFileName}
              originalPreviewUrl={originalPreviewUrl}
              enhancedPreviewUrl={enhancedPreviewUrl}
              isRenderingPreview={isRenderingPreview}
              isAutoDeskewing={isAutoDeskewing}
              settings={selectedPage.enhancement}
              useEnhancedForRecognition={selectedPage.useEnhancedForRecognition}
              detectedLines={selectedPage.detectedLines}
              highlightedLineId={highlightedLineId}
              onHighlightLine={setHighlightedLineId}
              onChangeSettings={handleChangeEnhancement}
              onToggleUseEnhanced={handleToggleUseEnhanced}
              onAutoDeskew={handleAutoDeskew}
              onDetectLinesPreview={handleDetectLinesPreview}
              disabled={isRecognizing || !hasLiveMediaForPage(selectedPage)}
            />
          )}

          {/* TAB 2: FULL SYNCHRONIZED SIDE-BY-SIDE DOCUMENT EDITOR */}
          {selectedPage && workspaceTab === 'editor' && (
            <SideBySideEditor
              page={selectedPage}
              pageIndex={selectedPageIndex}
              totalPages={pages.length}
              originalPreviewUrl={originalPreviewUrl}
              enhancedPreviewUrl={enhancedPreviewUrl}
              isRenderingPreview={isRenderingPreview}
              highlightedLineId={highlightedLineId}
              onHighlightLine={setHighlightedLineId}
              onChangeEditedText={handleChangePageEditedText}
              onRerunPage={(pageId) => recognizePageList([pageId])}
              onRerunSingleLine={handleRerunSingleLine}
              onCopyPageText={handleCopyPageText}
              onCopyAllPagesText={handleCopyAllPagesText}
              onNavigatePage={handleNavigatePage}
              isRecognizing={isRecognizing}
              rerunningLineId={rerunningLineId}
              copiedPageId={copiedPageId}
              copiedAll={copiedAll}
              canRerun={hasLiveMediaForPage(selectedPage)}
            />
          )}

          {/* STEP 4: 100% LOCAL EXPORT PANEL (DOCX, ALIGNED SEARCHABLE PDF, UTF-8 TXT) */}
          {selectedPage && (
            <ExportDocumentPanel
              pages={pages}
              selectedPage={selectedPage}
              primaryFileName={sources[0]?.name || selectedPage.sourceFileName}
              renderPageForExport={renderPageForExport}
              disabled={isRecognizing}
            />
          )}
        </div>
      )}

      {/* Recommended Related Tools */}
      {onSelectNextTool && (
        <RecommendedNextTools currentToolId={tool.id} onSelectTool={onSelectNextTool} />
      )}
    </div>
  );
};
