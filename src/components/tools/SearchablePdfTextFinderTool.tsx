import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  inspectPdfDocument,
  initOcrWorker,
  processPageOcr,
  searchInPageData,
  buildSearchRegex,
  generateSearchablePdf,
  renderSinglePage,
  PageTextData,
  SearchMatch,
} from '../../services/pdf/searchablePdfService';
import { triggerDownload, formatBytes } from '../../services/utils/downloadUtils';
import { trackToolCompleted } from '../../services/analytics/ga4Tracker';
import { triggerToast } from '../common/Toast';
import { RecommendedNextTools } from './RecommendedNextTools';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';
import {
  Search,
  ScanText,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  StopCircle,
  FileSearch,
  ArrowRight,
  Highlighter,
} from 'lucide-react';
import { Worker } from 'tesseract.js';

interface SearchablePdfTextFinderToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

/**
 * Helper to highlight all regex matches inside plain extracted text view using <mark>.
 */
function renderHighlightedPlainText(
  text: string,
  query: string,
  matchCase: boolean,
  exactPhrase: boolean
): React.ReactNode {
  const regex = buildSearchRegex(query, { matchCase, exactPhrase });
  if (!regex || !text) return text;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let keyIdx = 0;
  regex.lastIndex = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(text.slice(lastIndex, m.index));
    }
    nodes.push(
      <mark
        key={`hl-${keyIdx++}`}
        className="bg-amber-300 text-slate-950 font-bold px-0.5 rounded-xs"
      >
        {m[0]}
      </mark>
    );
    lastIndex = m.index + m[0].length;
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

export const SearchablePdfTextFinderTool: React.FC<SearchablePdfTextFinderToolProps> = ({
  tool,
  onSelectNextTool,
}) => {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [docReadyVersion, setDocReadyVersion] = useState(0);

  // PDF Document instance references
  const pdfDocRef = useRef<any>(null);

  // Extracted pages data (+ ref for synchronous access inside async OCR/download handlers)
  const [pagesData, setPagesData] = useState<PageTextData[]>([]);
  const pagesDataRef = useRef<PageTextData[]>([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [digitalCount, setDigitalCount] = useState(0);

  // OCR state
  const [ocrLanguage, setOcrLanguage] = useState<'eng' | 'hin'>('eng');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const ocrWorkerRef = useRef<Worker | null>(null);
  const ocrWorkerLangRef = useRef<'eng' | 'hin' | null>(null);
  const cancelOcrRef = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [exactPhrase, setExactPhrase] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Active Page Preview state (strict request-ID guarded rendering + clean bitmap cache for instant highlight painting)
  const [previewPageNum, setPreviewPageNum] = useState(1);
  const [renderedPageNum, setRenderedPageNum] = useState(0);
  const [previewRenderError, setPreviewRenderError] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderedPageBitmapRef = useRef<{ pageNum: number; canvas: HTMLCanvasElement; cleanup: () => void } | null>(null);
  const renderTaskRef = useRef<any>(null);
  const renderSeqRef = useRef(0);
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Searchable PDF download state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showPreDownloadOcrPrompt, setShowPreDownloadOcrPrompt] = useState(false);

  // Keep pagesDataRef synchronized with React state
  useEffect(() => {
    pagesDataRef.current = pagesData;
  }, [pagesData]);

  // Clean up PDF.js doc, offscreen canvas, and OCR workers on unmount
  useEffect(() => {
    return () => {
      try {
        renderTaskRef.current?.cancel?.();
      } catch {
        // Ignore cancel error
      }
      if (renderedPageBitmapRef.current) {
        renderedPageBitmapRef.current.cleanup();
        renderedPageBitmapRef.current = null;
      }
      if (pdfDocRef.current?.destroy) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate().catch(() => {});
        ocrWorkerRef.current = null;
      }
    };
  }, []);

  const resetSession = () => {
    try {
      renderTaskRef.current?.cancel?.();
    } catch {
      // Ignore cancel error
    }
    renderTaskRef.current = null;
    renderSeqRef.current++;

    if (renderedPageBitmapRef.current) {
      renderedPageBitmapRef.current.cleanup();
      renderedPageBitmapRef.current = null;
    }
    if (pdfDocRef.current?.destroy) {
      pdfDocRef.current.destroy().catch(() => {});
    }
    pdfDocRef.current = null;

    if (ocrWorkerRef.current) {
      ocrWorkerRef.current.terminate().catch(() => {});
      ocrWorkerRef.current = null;
      ocrWorkerLangRef.current = null;
    }

    setFile(null);
    setErrorMsg(null);
    setPagesData([]);
    pagesDataRef.current = [];
    setScannedCount(0);
    setDigitalCount(0);
    setSearchQuery('');
    setActiveSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setActiveMatchIndex(0);
    setPreviewPageNum(1);
    setRenderedPageNum(0);
    setPreviewRenderError(null);
    setShowExtractedText(false);
    setShowPreDownloadOcrPrompt(false);
  };

  // Handle PDF upload
  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selectedFile = selectedFiles[0];

    if (
      !selectedFile.name.toLowerCase().endsWith('.pdf') &&
      selectedFile.type !== 'application/pdf'
    ) {
      setErrorMsg('Please upload a valid PDF document.');
      triggerToast('error', 'Invalid file format. Only PDF files are supported.');
      return;
    }

    resetSession();
    setFile(selectedFile);
    setIsInspecting(true);

    try {
      const { inspection, pdfDoc } = await inspectPdfDocument(selectedFile);
      pdfDocRef.current = pdfDoc;

      pagesDataRef.current = inspection.pages;
      setPagesData(inspection.pages);
      setScannedCount(inspection.scannedCount);
      setDigitalCount(inspection.digitalCount);
      setPreviewPageNum(1);
      setIsInspecting(false);
      // Increment docReadyVersion so preview effect ALWAYS renders Page 1 once pdfDoc is ready
      setDocReadyVersion((v) => v + 1);

      triggerToast(
        'success',
        `Analyzed ${inspection.pageCount} pages: ${inspection.digitalCount} digital, ${inspection.scannedCount} scanned.`
      );
    } catch (err: any) {
      setIsInspecting(false);
      const msg =
        err?.message || 'Failed to read PDF document. It may be corrupted or password-protected.';
      setErrorMsg(msg);
      triggerToast('error', msg);
    }
  };

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && (staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf'))) {
      clearStagedFileForTool();
      handleFileSelected([staged]);
    }
  }, []);

  // Derive per-page match summaries & matches on the currently previewed page
  const pageMatchSummary = useMemo(() => {
    const map = new Map<number, { pageNum: number; count: number; firstMatchIdx: number }>();
    searchResults.forEach((m, idx) => {
      const existing = map.get(m.pageNum);
      if (!existing) {
        map.set(m.pageNum, { pageNum: m.pageNum, count: 1, firstMatchIdx: idx });
      } else {
        existing.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.pageNum - b.pageNum);
  }, [searchResults]);

  const pageMatchCountMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const item of pageMatchSummary) {
      m.set(item.pageNum, item.count);
    }
    return m;
  }, [pageMatchSummary]);

  const matchesOnCurrentPage = useMemo(
    () =>
      searchResults
        .map((match, globalIndex) => ({ match, globalIndex }))
        .filter((entry) => entry.match.pageNum === previewPageNum),
    [searchResults, previewPageNum]
  );

  // Step 1: Render exact requested PDF page into an offscreen bitmap whenever previewPageNum or document changes
  useEffect(() => {
    const doc = pdfDocRef.current;
    if (!doc || docReadyVersion === 0 || previewPageNum < 1 || previewPageNum > doc.numPages) {
      return;
    }

    // Cancel any previous in-flight PDF.js render so older pages can NEVER overwrite newer selections
    try {
      renderTaskRef.current?.cancel?.();
    } catch {
      // Ignore cancel error
    }
    renderTaskRef.current = null;

    const myReqId = ++renderSeqRef.current;
    setIsPreviewRendering(true);
    setPreviewRenderError(null);

    const runRender = async () => {
      try {
        const rendered = await renderSinglePage(doc, previewPageNum, 1.5, (task) => {
          renderTaskRef.current = task;
        });

        // Stale render guard: discard if user clicked another page while rendering
        if (myReqId !== renderSeqRef.current) {
          rendered.cleanup();
          return;
        }

        // Swap clean bitmap cache
        if (renderedPageBitmapRef.current) {
          renderedPageBitmapRef.current.cleanup();
        }
        renderedPageBitmapRef.current = {
          pageNum: previewPageNum,
          canvas: rendered.canvas,
          cleanup: rendered.cleanup,
        };
        setRenderedPageNum(previewPageNum);
      } catch (previewErr: any) {
        if (myReqId !== renderSeqRef.current) return;
        if (previewErr?.name === 'RenderingCancelledException') return;
        console.warn(`Page ${previewPageNum} preview rendering error:`, previewErr);
        setPreviewRenderError(`Could not render Page ${previewPageNum}.`);
      } finally {
        if (myReqId === renderSeqRef.current) {
          setIsPreviewRendering(false);
        }
      }
    };

    runRender();

    return () => {
      try {
        renderTaskRef.current?.cancel?.();
      } catch {
        // Ignore cancel error
      }
    };
  }, [previewPageNum, docReadyVersion]);

  // Step 2: Paint cached clean PDF page bitmap + crisp word highlight overlays onto visible <canvas>
  useEffect(() => {
    if (showExtractedText) return;
    const targetCanvas = previewCanvasRef.current;
    const cached = renderedPageBitmapRef.current;
    if (!targetCanvas || !cached || cached.pageNum !== previewPageNum) return;

    const src = cached.canvas;
    targetCanvas.width = src.width;
    targetCanvas.height = src.height;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Paint exact PDF page image
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(src, 0, 0);

    // 2. Draw highlights directly in exact pixel space for EVERY match on this page
    if (matchesOnCurrentPage.length > 0) {
      const W = targetCanvas.width;
      const H = targetCanvas.height;
      const padX = Math.max(2, Math.round(W * 0.003));
      const padY = Math.max(2, Math.round(H * 0.002));

      // Draw non-active matches first, then active match on top so its border is never obscured
      const ordered = [...matchesOnCurrentPage].sort((a, b) => {
        const aActive = a.globalIndex === activeMatchIndex ? 1 : 0;
        const bActive = b.globalIndex === activeMatchIndex ? 1 : 0;
        return aActive - bActive;
      });

      for (const { match, globalIndex } of ordered) {
        const isActive = globalIndex === activeMatchIndex;
        for (const box of match.highlightBoxes || []) {
          const rx = Math.max(0, box.x0 * W - padX);
          const ry = Math.max(0, box.y0 * H - padY);
          const rw = Math.min(W - rx, (box.x1 - box.x0) * W + padX * 2);
          const rh = Math.min(H - ry, (box.y1 - box.y0) * H + padY * 2);

          if (rw <= 0 || rh <= 0) continue;

          ctx.save();
          if (isActive) {
            ctx.fillStyle = 'rgba(249, 115, 22, 0.40)';
            ctx.strokeStyle = 'rgba(234, 88, 12, 0.98)';
            ctx.lineWidth = Math.max(2.5, W * 0.0028);
          } else {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.42)';
            ctx.strokeStyle = 'rgba(202, 138, 4, 0.92)';
            ctx.lineWidth = Math.max(1.5, W * 0.0016);
          }

          ctx.beginPath();
          const radius = Math.min(4, rh * 0.2);
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(rx, ry, rw, rh, radius);
          } else {
            ctx.rect(rx, ry, rw, rh);
          }
          ctx.fill();
          ctx.stroke();

          // Small occurrence tag on the active match when multiple occurrences exist on this page
          if (isActive && matchesOnCurrentPage.length > 1) {
            const label = `#${match.matchIndexOnPage}`;
            const fontSize = Math.max(11, Math.round(W * 0.013));
            ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
            const textWidth = ctx.measureText(label).width;
            const tagW = textWidth + 8;
            const tagH = fontSize + 5;
            const tagX = Math.min(W - tagW - 2, rx);
            const tagY = Math.max(2, ry - tagH - 2);

            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(tagX, tagY, tagW, tagH, 3);
            } else {
              ctx.rect(tagX, tagY, tagW, tagH);
            }
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, tagX + 4, tagY + tagH / 2 + 0.5);
          }

          ctx.restore();
        }
      }
    }
  }, [renderedPageNum, previewPageNum, showExtractedText, matchesOnCurrentPage, activeMatchIndex]);

  // Execute Search (pure parameter-driven to avoid stale React closures)
  const executeSearch = (
    pages: PageTextData[],
    q: string,
    useMatchCase: boolean,
    useExactPhrase: boolean,
    silentToast = false
  ) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setActiveSearchQuery('');
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setActiveSearchQuery(trimmed);

    const matches = searchInPageData(pages, trimmed, {
      matchCase: useMatchCase,
      exactPhrase: useExactPhrase,
    });
    setSearchResults(matches);
    setActiveMatchIndex(0);

    if (matches.length > 0) {
      setPreviewPageNum(matches[0].pageNum);
      setShowExtractedText(false);
      trackToolCompleted('search-match', matches.length, 'searchable-pdf-text-finder');
      if (!silentToast) {
        const uniquePages = new Set(matches.map((m) => m.pageNum)).size;
        triggerToast(
          'success',
          `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} across ${uniquePages} page${uniquePages === 1 ? '' : 's'}!`
        );
      }
    } else if (!silentToast) {
      triggerToast('info', 'No matching text found in currently scanned/digital pages.');
    }
  };

  const handlePerformSearch = (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    executeSearch(pagesDataRef.current, q, matchCase, exactPhrase);
  };

  // Run OCR on scanned pages — returns the freshly updated PageTextData[] synchronously
  const handleStartOcr = async (): Promise<PageTextData[]> => {
    if (!pdfDocRef.current || !file) return pagesDataRef.current;

    const currentPages = pagesDataRef.current;
    const scannedPages = currentPages.filter((p) => p.isScanned && p.ocrStatus !== 'done');
    if (scannedPages.length === 0) {
      triggerToast('info', 'All pages already have recognized text. Ready to search!');
      return currentPages;
    }

    setShowPreDownloadOcrPrompt(false);
    setIsOcrRunning(true);
    cancelOcrRef.current = false;
    setOcrProgress(5);
    setOcrStatusText(`Initializing OCR engine (${ocrLanguage === 'hin' ? 'Hindi' : 'English'})...`);

    let worker = ocrWorkerRef.current;

    // Reinitialize worker if user switched OCR language
    if (worker && ocrWorkerLangRef.current !== ocrLanguage) {
      try {
        await worker.terminate();
      } catch {
        // Ignore terminate error
      }
      worker = null;
      ocrWorkerRef.current = null;
      ocrWorkerLangRef.current = null;
    }

    let workingPages = [...currentPages];

    try {
      if (!worker) {
        worker = await initOcrWorker(ocrLanguage, (_pct, status) => {
          setOcrStatusText(status);
        });
        ocrWorkerRef.current = worker;
        ocrWorkerLangRef.current = ocrLanguage;
      }

      let processedCount = 0;
      const totalToProcess = scannedPages.length;

      for (const pageItem of scannedPages) {
        if (cancelOcrRef.current) {
          setOcrStatusText('OCR paused by user.');
          triggerToast('info', 'OCR paused. Scanned pages up to this point have been preserved.');
          break;
        }

        const currentPct = Math.round(10 + (processedCount / totalToProcess) * 85);
        setOcrProgress(currentPct);
        setOcrStatusText(
          `Recognizing page ${pageItem.pageNum} of ${pdfDocRef.current.numPages} (${processedCount + 1}/${totalToProcess})...`
        );

        workingPages = workingPages.map((p) =>
          p.pageNum === pageItem.pageNum ? { ...p, ocrStatus: 'processing' as const } : p
        );
        pagesDataRef.current = workingPages;
        setPagesData(workingPages);

        try {
          const ocrResult = await processPageOcr(worker, pdfDocRef.current, pageItem.pageNum, 1.75);

          workingPages = workingPages.map((p) =>
            p.pageNum === pageItem.pageNum
              ? {
                  ...p,
                  ocrStatus: 'done' as const,
                  text: ocrResult.text,
                  wordCount: ocrResult.text.split(/\s+/).filter(Boolean).length,
                  confidence: ocrResult.confidence,
                  ocrLines: ocrResult.lines,
                  canvasWidth: ocrResult.canvasWidth,
                  canvasHeight: ocrResult.canvasHeight,
                }
              : p
          );
          pagesDataRef.current = workingPages;
          setPagesData(workingPages);
        } catch (pageErr: any) {
          console.warn(`OCR failed for page ${pageItem.pageNum}:`, pageErr);
          workingPages = workingPages.map((p) =>
            p.pageNum === pageItem.pageNum
              ? {
                  ...p,
                  ocrStatus: 'failed' as const,
                  error: pageErr?.message || 'Recognition error',
                }
              : p
          );
          pagesDataRef.current = workingPages;
          setPagesData(workingPages);
        }

        processedCount++;
      }

      setOcrProgress(100);
      setOcrStatusText('OCR scanning complete! All text is now indexed and searchable.');
      if (processedCount > 0) {
        trackToolCompleted('ocr-index', processedCount, 'searchable-pdf-text-finder');
      }
      triggerToast('success', 'Completed OCR processing for scanned pages!');

      // Re-run search immediately with freshly updated workingPages (zero stale closure)
      if (searchQuery.trim()) {
        executeSearch(workingPages, searchQuery, matchCase, exactPhrase);
      }

      return workingPages;
    } catch (ocrErr: any) {
      console.error('OCR initialization error:', ocrErr);
      setErrorMsg(`OCR engine error: ${ocrErr?.message || 'Failed to initialize worker.'}`);
      triggerToast('error', 'OCR failed to process.');
      return workingPages;
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleCancelOcr = () => {
    cancelOcrRef.current = true;
    setOcrStatusText('Stopping OCR...');
  };

  // Jump to specific search match & show its exact page on the right with highlight
  const handleSelectMatch = (index: number) => {
    if (index < 0 || index >= searchResults.length) return;
    setActiveMatchIndex(index);
    const match = searchResults[index];
    setPreviewPageNum(match.pageNum);
    setShowExtractedText(false);
  };

  // Jump directly to a page from the matched-page summary strip
  const handleSelectMatchedPage = (pageNum: number, firstMatchIdx: number) => {
    setActiveMatchIndex(firstMatchIdx);
    setPreviewPageNum(pageNum);
    setShowExtractedText(false);
  };

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % searchResults.length;
    handleSelectMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + searchResults.length) % searchResults.length;
    handleSelectMatch(prevIdx);
  };

  // Copy extracted text on current preview page
  const handleCopyCurrentPageText = () => {
    const currentPageData = pagesData.find((p) => p.pageNum === previewPageNum);
    if (!currentPageData || !currentPageData.text) return;

    navigator.clipboard.writeText(currentPageData.text).then(() => {
      setCopiedText(true);
      triggerToast('success', `Copied text from Page ${previewPageNum} to clipboard!`);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  // Internal helper to build & download searchable PDF using explicit up-to-date pages array
  const performDownloadSearchablePdf = async (latestPages: PageTextData[]) => {
    if (!file) return;

    setShowPreDownloadOcrPrompt(false);
    setIsDownloadingPdf(true);
    setDownloadProgress(10);
    setDownloadStatus('Initializing searchable PDF text layer injection...');

    try {
      const searchableBlob = await generateSearchablePdf(
        file,
        latestPages,
        (progress, status) => {
          setDownloadProgress(progress);
          setDownloadStatus(status);
        }
      );

      const baseName = file.name.replace(/\.pdf$/i, '');
      const downloadName = `${baseName}-searchable.pdf`;

      triggerDownload(searchableBlob, downloadName);
      triggerToast('success', 'Searchable PDF downloaded! Open it and press Ctrl+F to search.');
    } catch (dlErr: any) {
      console.error('Download searchable PDF error:', dlErr);
      const msg = dlErr?.message || 'Failed to construct searchable PDF.';
      setErrorMsg(msg);
      triggerToast('error', msg);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Generate and Download Searchable PDF (inline non-blocking prompt if scanned pages still need OCR)
  const handleDownloadSearchablePdf = async () => {
    if (!file || isDownloadingPdf || isOcrRunning) return;

    const pendingScanned = pagesDataRef.current.filter(
      (p) => p.isScanned && p.ocrStatus !== 'done'
    );
    if (pendingScanned.length > 0) {
      setShowPreDownloadOcrPrompt(true);
      return;
    }

    await performDownloadSearchablePdf(pagesDataRef.current);
  };

  const handleRunOcrThenDownload = async () => {
    const updatedPages = await handleStartOcr();
    if (!cancelOcrRef.current) {
      await performDownloadSearchablePdf(updatedPages);
    }
  };

  const currentPage = pagesData.find((p) => p.pageNum === previewPageNum);
  const totalPages = pagesData.length;
  const ocrPendingCount = pagesData.filter((p) => p.isScanned && p.ocrStatus !== 'done').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white tracking-wide uppercase border border-white/20">
            <ScanText className="w-3.5 h-3.5 text-cyan-300" />
            <span>OCR &amp; Searchable Text Engine</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Find Anything in Scanned PDFs
          </h2>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            Search for names, amounts, reference numbers, and phrases inside scanned and image-only PDFs.
            Extract recognized text with client-side OCR (English &amp; Hindi in-app; first run caches ~10–25 MB language data), see highlighted matches directly on each page, and download a Ctrl+F searchable PDF.
          </p>
        </div>
      </div>

      {/* Top Ad Slot */}
      <AdPlaceholder format="hero-banner" />

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Zone */}
        {!file ? (
          <div className="space-y-4">
            <FileUploadZone
              acceptedFormats={['.pdf', 'application/pdf']}
              maxFileSizeMB={500}
              multiple={false}
              files={[]}
              onFilesSelected={handleFileSelected}
              onRemoveFile={() => {}}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Client-Side In-Browser OCR</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Live On-Page Word Highlighting</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Ctrl+F Searchable PDF Export</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Header & File Stats Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    <span>•</span>
                    <span>{isInspecting ? 'Inspecting pages...' : `${totalPages} Pages total`}</span>
                    {!isInspecting && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {digitalCount} Digital
                        </span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {scannedCount} Scanned
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={resetSession}
                  disabled={isOcrRunning}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Upload Another File
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSearchablePdf}
                  disabled={isDownloadingPdf || isOcrRunning || isInspecting}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Searchable PDF</span>
                </button>
              </div>
            </div>

            {/* Inline non-blocking pre-download OCR notice (replaces browser confirm dialog) */}
            {showPreDownloadOcrPrompt && ocrPendingCount > 0 && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-blue-900 dark:text-blue-200 space-y-0.5">
                  <p className="font-bold">
                    {ocrPendingCount} scanned page{ocrPendingCount === 1 ? '' : 's'} have not been OCR-processed yet.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Run OCR first so Ctrl+F works on every scanned page in your downloaded PDF.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRunOcrThenDownload}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Run OCR &amp; Download
                  </button>
                  <button
                    type="button"
                    onClick={() => performDownloadSearchablePdf(pagesDataRef.current)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Download As-Is
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreDownloadOcrPrompt(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* OCR Notice & Language Controls if document has scanned pages */}
            {scannedCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <ScanText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {ocrPendingCount > 0
                          ? `${ocrPendingCount} Scanned Pages Require OCR for Text Search`
                          : 'All Scanned Pages Have Been Processed with OCR!'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ocrPendingCount > 0
                          ? 'Convert image-based pages into searchable text (English & Hindi in-app search & highlight; exported PDF Ctrl+F layer embeds invisible Latin/ASCII text).'
                          : 'Ready! Search any word below to highlight it directly on the page, or click Download Searchable PDF for Ctrl+F support.'}
                      </p>
                    </div>
                  </div>

                  {ocrPendingCount > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
                        <span className="text-[11px] font-semibold text-slate-500">Lang:</span>
                        <select
                          value={ocrLanguage}
                          onChange={(e) => setOcrLanguage(e.target.value as 'eng' | 'hin')}
                          disabled={isOcrRunning}
                          className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="eng">English (eng)</option>
                          <option value="hin">Hindi (hin)</option>
                        </select>
                      </div>

                      {isOcrRunning ? (
                        <button
                          type="button"
                          onClick={handleCancelOcr}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <StopCircle className="w-3.5 h-3.5" />
                          <span>Pause OCR</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartOcr()}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Start OCR on {ocrPendingCount} Pages</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isOcrRunning && (
                  <div className="space-y-1.5 pt-1">
                    <ProgressBar progress={ocrProgress} statusText={ocrStatusText} />
                  </div>
                )}
              </div>
            )}

            {/* Search Box Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePerformSearch();
                    }}
                    placeholder="Search anything: name, city (e.g. BILASPUR), order #, date, or phrase..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePerformSearch()}
                    disabled={isInspecting}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileSearch className="w-4 h-4" />
                    <span>Search</span>
                  </button>

                  {searchResults.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={handlePrevMatch}
                        title="Previous Match"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1.5 tabular-nums">
                        {activeMatchIndex + 1}/{searchResults.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMatch}
                        title="Next Match"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Modifiers */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 px-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={matchCase}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setMatchCase(next);
                        if (searchQuery.trim()) {
                          executeSearch(pagesDataRef.current, searchQuery, next, exactPhrase, true);
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Match Case</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={exactPhrase}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setExactPhrase(next);
                        if (searchQuery.trim()) {
                          executeSearch(pagesDataRef.current, searchQuery, matchCase, next, true);
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Exact Whole Word / Phrase</span>
                  </label>
                </div>

                {hasSearched && (
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {searchResults.length > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        {searchResults.length} match{searchResults.length === 1 ? '' : 'es'} across{' '}
                        {pageMatchSummary.length} page{pageMatchSummary.length === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="text-rose-500">
                        No matches found for &quot;{activeSearchQuery}&quot;
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Split Screen Workspace: Results Snippets & Interactive Highlighted Page Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Left Column: Search Results List (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Search Results ({searchResults.length})
                  </span>
                  {hasSearched && searchResults.length > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Click any page or match to highlight
                    </span>
                  )}
                </div>

                {/* Quick Page Jump Summary Strip (e.g. Page 6 • 7×) */}
                {pageMatchSummary.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Jump to Matched Page:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pageMatchSummary.map((item) => {
                        const isViewingThisPage = previewPageNum === item.pageNum;
                        return (
                          <button
                            key={item.pageNum}
                            type="button"
                            onClick={() =>
                              handleSelectMatchedPage(item.pageNum, item.firstMatchIdx)
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              isViewingThisPage
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                            }`}
                          >
                            <span>Page {item.pageNum}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                isViewingThisPage
                                  ? 'bg-white/20 text-white'
                                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                              }`}
                            >
                              {item.count} {item.count === 1 ? 'time' : 'times'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {searchResults.map((match, idx) => {
                      const isActive = activeMatchIndex === idx;
                      const countOnPage = pageMatchCountMap.get(match.pageNum) || 1;
                      return (
                        <div
                          key={match.id}
                          onClick={() => handleSelectMatch(idx)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isActive
                              ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                              <span>Page {match.pageNum}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                • Match {match.matchIndexOnPage} of {countOnPage}
                              </span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>

                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans break-words">
                            <span>{match.snippet.before}</span>
                            <mark className="bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold px-1 rounded">
                              {match.snippet.matchedText}
                            </mark>
                            <span>{match.snippet.after}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <FileSearch className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {hasSearched
                        ? 'No occurrences found for this search term. Try another word or start OCR.'
                        : 'Enter any text, number, date or phrase above and click Search.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Live Highlighted Page Preview & Extracted OCR Text (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Page Navigation Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Page {previewPageNum} of {totalPages || 1}
                    </span>
                    {currentPage && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          currentPage.isScanned
                            ? currentPage.ocrStatus === 'done'
                              ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                              : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {currentPage.isScanned
                          ? currentPage.ocrStatus === 'done'
                            ? 'OCR Indexed'
                            : 'Needs OCR'
                          : 'Digital Text'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={previewPageNum <= 1}
                      onClick={() => setPreviewPageNum((p) => Math.max(1, p - 1))}
                      title="Previous Page"
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-1 tabular-nums">
                      {previewPageNum} / {totalPages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={previewPageNum >= totalPages}
                      onClick={() => setPreviewPageNum((p) => Math.min(totalPages, p + 1))}
                      title="Next Page"
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowExtractedText(!showExtractedText)}
                      className={`ml-2 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        showExtractedText
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {showExtractedText ? 'Show Page View' : 'View Text'}
                    </button>
                  </div>
                </div>

                {/* Active Page Match Highlight Banner */}
                {hasSearched && activeSearchQuery && (
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs ${
                      matchesOnCurrentPage.length > 0
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <Highlighter
                        className={`w-4 h-4 shrink-0 ${
                          matchesOnCurrentPage.length > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}
                      />
                      {matchesOnCurrentPage.length > 0 ? (
                        <span>
                          <strong>Page {previewPageNum}</strong>: &quot;{activeSearchQuery}&quot; found{' '}
                          <strong>
                            {matchesOnCurrentPage.length}{' '}
                            {matchesOnCurrentPage.length === 1 ? 'time' : 'times'}
                          </strong>{' '}
                          (highlighted below)
                        </span>
                      ) : (
                        <span>
                          <strong>Page {previewPageNum}</strong>: No occurrences of &quot;
                          {activeSearchQuery}&quot; on this page
                        </span>
                      )}
                    </div>

                    {matchesOnCurrentPage.length === 0 && pageMatchSummary.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectMatchedPage(
                            pageMatchSummary[0].pageNum,
                            pageMatchSummary[0].firstMatchIdx
                          )
                        }
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Jump to Page {pageMatchSummary[0].pageNum} →
                      </button>
                    )}
                  </div>
                )}

                {/* Display Area: Canvas with Direct Pixel-Aligned Highlights OR Highlighted Extracted Text */}
                <div className="relative min-h-[440px] max-h-[600px] bg-slate-900 rounded-2xl overflow-auto flex items-center justify-center p-3 border border-slate-800 shadow-inner">
                  {/* Floating Page Number & Highlight Count Badge */}
                  {!showExtractedText && totalPages > 0 && (
                    <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 text-white text-[11px] font-bold shadow border border-white/15 backdrop-blur-xs pointer-events-none">
                      <span>Page {previewPageNum}</span>
                      {matchesOnCurrentPage.length > 0 && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-amber-300">
                            {matchesOnCurrentPage.length} highlighted
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {isPreviewRendering && !showExtractedText && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-10 text-white text-xs gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Rendering Page {previewPageNum}...</span>
                    </div>
                  )}

                  {!showExtractedText ? (
                    previewRenderError ? (
                      <div className="text-xs text-rose-300 text-center p-6 space-y-2">
                        <AlertTriangle className="w-6 h-6 mx-auto text-rose-400" />
                        <p>{previewRenderError}</p>
                      </div>
                    ) : (
                      <canvas
                        ref={previewCanvasRef}
                        className="max-h-[560px] max-w-full w-auto h-auto rounded shadow-lg bg-white"
                      />
                    )
                  ) : (
                    <div className="w-full h-full max-h-[540px] overflow-y-auto p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400">
                          Extracted Text • Page {previewPageNum} ({currentPage?.wordCount || 0}{' '}
                          words)
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCurrentPageText}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {copiedText ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed select-text">
                        {currentPage?.text ? (
                          activeSearchQuery ? (
                            renderHighlightedPlainText(
                              currentPage.text,
                              activeSearchQuery,
                              matchCase,
                              exactPhrase
                            )
                          ) : (
                            currentPage.text
                          )
                        ) : (
                          <span className="text-slate-500 italic">
                            No text recognized on this page yet. Run OCR above to extract text.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Download Progress Bar if downloading */}
            {isDownloadingPdf && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Searchable PDF...</span>
                </div>
                <ProgressBar progress={downloadProgress} statusText={downloadStatus} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle Leaderboard Ad */}
      <AdPlaceholder format="section-divider" />

      {/* Feature Explanations / How It Works */}
      <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          How &quot;Find Anything in Scanned PDFs&quot; Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Instant Text Inspection
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When you upload a document, PottoTools instantly checks each page to see if digital text already exists. If so, it extracts text and coordinates in milliseconds without running heavy OCR.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              In-Browser OCR &amp; Live Highlighting
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              For scanned receipts, contracts, and books, our in-browser OCR recognizes every word and its exact position so matches are highlighted directly on the page preview.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Ctrl+F Invisible Searchable PDF Layer
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Downloading injects a PDF-standard invisible text layer aligned to scanned word coordinates across normal and rotated pages, so Ctrl+F works in Chrome, Edge, Adobe Acrobat, and Preview.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {tool.faqs.map((faq, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1.5"
            >
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {faq.question}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next Tools */}
      {onSelectNextTool && (
        <RecommendedNextTools
          currentToolId={tool.id}
          onSelectTool={onSelectNextTool}
        />
      )}
    </div>
  );
};
