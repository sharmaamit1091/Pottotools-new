import React, { useState, useEffect, useRef } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  inspectPdfDocument,
  initOcrWorker,
  processPageOcr,
  searchInPageData,
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
  Eye,
  Sliders,
  Sparkles,
  Info,
  Copy,
  Check,
  StopCircle,
  FileSearch,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Worker } from 'tesseract.js';

interface SearchablePdfTextFinderToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const SearchablePdfTextFinderTool: React.FC<SearchablePdfTextFinderToolProps> = ({
  tool,
  onSelectNextTool,
}) => {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF Document instance references
  const pdfDocRef = useRef<any>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Extracted pages data
  const [pagesData, setPagesData] = useState<PageTextData[]>([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [digitalCount, setDigitalCount] = useState(0);

  // OCR state
  const [ocrLanguage, setOcrLanguage] = useState<'eng' | 'hin'>('eng');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const ocrWorkerRef = useRef<Worker | null>(null);
  const cancelOcrRef = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [exactPhrase, setExactPhrase] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Active Page Preview state (Lazy on-demand rendering)
  const [previewPageNum, setPreviewPageNum] = useState(1);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Searchable PDF download state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');

  // Clean up object URLs and OCR workers on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate().catch(() => {});
      }
    };
  }, []);

  // Handle PDF upload
  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selectedFile = selectedFiles[0];

    // Validation
    if (
      !selectedFile.name.toLowerCase().endsWith('.pdf') &&
      selectedFile.type !== 'application/pdf'
    ) {
      setErrorMsg('Please upload a valid PDF document.');
      triggerToast('error', 'Invalid file format. Only PDF files are supported.');
      return;
    }

    // Reset previous session
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (ocrWorkerRef.current) {
      ocrWorkerRef.current.terminate().catch(() => {});
      ocrWorkerRef.current = null;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setIsInspecting(true);
    setPagesData([]);
    setSearchResults([]);
    setHasSearched(false);
    setActiveMatchIndex(0);
    setPreviewPageNum(1);

    try {
      const { inspection, pdfDoc, objectUrl } = await inspectPdfDocument(selectedFile);
      pdfDocRef.current = pdfDoc;
      objectUrlRef.current = objectUrl;

      setPagesData(inspection.pages);
      setScannedCount(inspection.scannedCount);
      setDigitalCount(inspection.digitalCount);
      setIsInspecting(false);

      triggerToast(
        'success',
        `Analyzed ${inspection.pageCount} pages: ${inspection.digitalCount} digital, ${inspection.scannedCount} scanned.`
      );
    } catch (err: any) {
      setIsInspecting(false);
      const msg = err?.message || 'Failed to read PDF document. It may be corrupted or password-protected.';
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

  // Render preview canvas whenever previewPageNum changes
  useEffect(() => {
    let isCancelled = false;

    const renderPreview = async () => {
      if (!pdfDocRef.current || previewPageNum < 1) return;

      setIsPreviewRendering(true);
      try {
        const { canvas, cleanup } = await renderSinglePage(pdfDocRef.current, previewPageNum, 1.25);

        if (isCancelled) {
          cleanup();
          return;
        }

        const targetCanvas = previewCanvasRef.current;
        if (targetCanvas) {
          targetCanvas.width = canvas.width;
          targetCanvas.height = canvas.height;
          const ctx = targetCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, 0);
          }
        }
        cleanup();
      } catch (previewErr) {
        console.warn('Page preview rendering notice:', previewErr);
      } finally {
        if (!isCancelled) setIsPreviewRendering(false);
      }
    };

    renderPreview();

    return () => {
      isCancelled = true;
    };
  }, [previewPageNum, file]);

  // Execute Search
  const handlePerformSearch = (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!q.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const matches = searchInPageData(pagesData, q, { matchCase, exactPhrase });
    setSearchResults(matches);
    setActiveMatchIndex(0);

    if (matches.length > 0) {
      setPreviewPageNum(matches[0].pageNum);
      trackToolCompleted('search-match', matches.length, 'searchable-pdf-text-finder');
      triggerToast('success', `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} across document!`);
    } else {
      triggerToast('info', 'No matching text found in currently scanned/digital pages.');
    }
  };

  // Run OCR on scanned pages
  const handleStartOcr = async () => {
    if (!pdfDocRef.current || !file) return;

    // Filter pages that need OCR
    const scannedPages = pagesData.filter((p) => p.isScanned && p.ocrStatus !== 'done');
    if (scannedPages.length === 0) {
      triggerToast('info', 'All pages already have recognized text. Ready to search!');
      return;
    }

    setIsOcrRunning(true);
    cancelOcrRef.current = false;
    setOcrProgress(5);
    setOcrStatusText(`Initializing OCR engine (${ocrLanguage === 'hin' ? 'Hindi' : 'English'})...`);

    let worker = ocrWorkerRef.current;

    try {
      if (!worker) {
        worker = await initOcrWorker(ocrLanguage, (pct, status) => {
          setOcrStatusText(status);
        });
        ocrWorkerRef.current = worker;
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
        setOcrStatusText(`Recognizing page ${pageItem.pageNum} of ${pdfDocRef.current.numPages} (${processedCount + 1}/${totalToProcess})...`);

        // Mark page as processing in state
        setPagesData((prev) =>
          prev.map((p) =>
            p.pageNum === pageItem.pageNum ? { ...p, ocrStatus: 'processing' } : p
          )
        );

        try {
          const ocrResult = await processPageOcr(worker, pdfDocRef.current, pageItem.pageNum, 1.5);

          // Update page with recognized text and line bounding boxes
          setPagesData((prev) =>
            prev.map((p) =>
              p.pageNum === pageItem.pageNum
                ? {
                    ...p,
                    ocrStatus: 'done',
                    text: ocrResult.text,
                    wordCount: ocrResult.text.split(/\s+/).filter(Boolean).length,
                    confidence: ocrResult.confidence,
                    ocrLines: ocrResult.lines,
                    canvasWidth: ocrResult.canvasWidth,
                    canvasHeight: ocrResult.canvasHeight,
                  }
                : p
            )
          );
        } catch (pageErr: any) {
          console.warn(`OCR failed for page ${pageItem.pageNum}:`, pageErr);
          setPagesData((prev) =>
            prev.map((p) =>
              p.pageNum === pageItem.pageNum
                ? { ...p, ocrStatus: 'failed', error: pageErr?.message || 'Recognition error' }
                : p
            )
          );
        }

        processedCount++;
      }

      setOcrProgress(100);
      setOcrStatusText('OCR scanning complete! All text is now indexed.');
      if (processedCount > 0) {
        trackToolCompleted('ocr-index', processedCount, 'searchable-pdf-text-finder');
      }
      triggerToast('success', `Completed OCR processing for scanned pages!`);

      // If user had already entered a search term, re-evaluate search with the new OCR text
      if (searchQuery.trim()) {
        setTimeout(() => {
          handlePerformSearch();
        }, 200);
      }
    } catch (ocrErr: any) {
      console.error('OCR initialization error:', ocrErr);
      setErrorMsg(`OCR engine error: ${ocrErr?.message || 'Failed to initialize worker.'}`);
      triggerToast('error', 'OCR failed to process.');
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleCancelOcr = () => {
    cancelOcrRef.current = true;
    setOcrStatusText('Stopping OCR...');
  };

  // Jump to specific search match
  const handleSelectMatch = (index: number) => {
    if (index < 0 || index >= searchResults.length) return;
    setActiveMatchIndex(index);
    const match = searchResults[index];
    setPreviewPageNum(match.pageNum);
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

  // Generate and Download Searchable PDF
  const handleDownloadSearchablePdf = async () => {
    if (!file) return;

    // Check if any OCR text exists
    const hasAnyOcr = pagesData.some((p) => p.ocrLines && p.ocrLines.length > 0);
    if (!hasAnyOcr && scannedCount > 0) {
      const confirmProceed = window.confirm(
        'Some scanned pages have not been OCR-scanned yet. Would you like to run OCR first, or download with whatever text has been processed so far?'
      );
      if (confirmProceed) {
        await handleStartOcr();
      }
    }

    setIsDownloadingPdf(true);
    setDownloadProgress(10);
    setDownloadStatus('Initializing PDF text layer injection...');

    try {
      const searchableBlob = await generateSearchablePdf(
        file,
        pagesData,
        (progress, status) => {
          setDownloadProgress(progress);
          setDownloadStatus(status);
        }
      );

      const baseName = file.name.replace(/\.pdf$/i, '');
      const downloadName = `${baseName}-searchable.pdf`;

      triggerDownload(searchableBlob, downloadName);
      triggerToast('success', 'Searchable PDF downloaded successfully!');
    } catch (dlErr: any) {
      console.error('Download searchable PDF error:', dlErr);
      const msg = dlErr?.message || 'Failed to construct searchable PDF.';
      setErrorMsg(msg);
      triggerToast('error', msg);
    } finally {
      setIsDownloadingPdf(false);
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
            Extract recognized text with client-side OCR (English &amp; Hindi in-app; first run caches ~10–25 MB language data) and download a searchable PDF with an invisible Latin/ASCII text layer.
          </p>
        </div>
      </div>

      {/* Top Ad Slot */}
      <AdPlaceholder format="hero-banner" />

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
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
                <span>Zero File Uploads to Cloud Servers</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Invisible Searchable PDF Export</span>
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
                    <span>{totalPages} Pages total</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {digitalCount} Digital
                    </span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {scannedCount} Scanned
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPagesData([]);
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Upload Another File
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSearchablePdf}
                  disabled={isDownloadingPdf}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Searchable PDF</span>
                </button>
              </div>
            </div>

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
                        Convert image-based pages into searchable text (English &amp; Hindi in-app search &amp; copy; exported PDF invisible Ctrl+F layer encodes Latin/ASCII text).
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
                          onClick={handleStartOcr}
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
                    placeholder="Search anything: name, order #, date, price, sentence, or phrase..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePerformSearch()}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
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
                        setMatchCase(e.target.checked);
                        if (searchQuery.trim()) {
                          setTimeout(() => handlePerformSearch(), 50);
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
                        setExactPhrase(e.target.checked);
                        if (searchQuery.trim()) {
                          setTimeout(() => handlePerformSearch(), 50);
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Exact Phrase</span>
                  </label>
                </div>

                {hasSearched && (
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {searchResults.length > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        {searchResults.length} match{searchResults.length === 1 ? '' : 'es'} found across pages
                      </span>
                    ) : (
                      <span className="text-rose-500">No matches found for &quot;{searchQuery}&quot;</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Split Screen Workspace: Results Snippets & Interactive Page Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Left Column: Search Results List (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Search Results ({searchResults.length})
                  </span>
                  {hasSearched && searchResults.length > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Click to inspect page
                    </span>
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {searchResults.map((match, idx) => {
                      const isActive = activeMatchIndex === idx;
                      return (
                        <div
                          key={match.id}
                          onClick={() => handleSelectMatch(idx)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isActive
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <span>Page {match.pageNum}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Match #{match.matchIndexOnPage})
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

              {/* Right Column: Live Page Preview & Extracted OCR Text (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Page Navigation Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Page {previewPageNum} of {totalPages}
                    </span>
                    {currentPage && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          currentPage.isScanned
                            ? currentPage.ocrStatus === 'done'
                              ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300'
                              : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300'
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
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-500 px-1">
                      {previewPageNum} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPageNum >= totalPages}
                      onClick={() => setPreviewPageNum((p) => Math.min(totalPages, p + 1))}
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
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {showExtractedText ? 'Show Scan' : 'View Text'}
                    </button>
                  </div>
                </div>

                {/* Display Area: Canvas or Extracted Text */}
                <div className="relative min-h-[420px] max-h-[560px] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-slate-800 shadow-inner">
                  {isPreviewRendering && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10 text-white text-xs gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Loading page preview...</span>
                    </div>
                  )}

                  {!showExtractedText ? (
                    <canvas
                      ref={previewCanvasRef}
                      className="max-h-[540px] max-w-full object-contain rounded shadow-lg bg-white"
                    />
                  ) : (
                    <div className="w-full h-full max-h-[520px] overflow-y-auto p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400">
                          Extracted Text • Page {previewPageNum} ({currentPage?.wordCount || 0} words)
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
                          currentPage.text
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
              When you upload a document, PottoTools instantly checks each page to see if digital text already exists. If so, it extracts it in milliseconds without running heavy OCR.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              In-Browser Optical Recognition (OCR)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              For scanned receipts, contracts, and books, our integrated Tesseract.js engine recognizes characters in English or Hindi incrementally, keeping device memory light and smooth.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Invisible Searchable PDF Layer
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Downloading injects an invisible Latin/ASCII text layer aligned to scanned coordinates. Open English PDFs anywhere to press Ctrl+F, or use the in-app search and copy view for Hindi scans.
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
