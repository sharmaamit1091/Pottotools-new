import React, { useState, useEffect, useRef } from 'react';
import { ToolDefinition } from '../../types/tools';
import { ProgressBar } from '../common/ProgressBar';
import { triggerToast } from '../common/Toast';
import { triggerDownload, formatBytes } from '../../services/utils/downloadUtils';
import { trackToolFileSelected } from '../../services/analytics/ga4Tracker';
import {
  generateOrganizedPdf,
  renderPageThumbnail,
  PageOrganizeItem,
} from '../../services/pdf/pdfPageOrganizerService';
import * as pdfjsLib from 'pdfjs-dist';
import {
  FileText,
  RotateCw,
  RotateCcw,
  Trash2,
  Undo2,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Search,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Rotate3D,
} from 'lucide-react';
import { RecommendedNextTools } from './RecommendedNextTools';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

const MAX_FILE_SIZE_BYTES = 524288000; // 500 MB (524,288,000 bytes)

interface PdfPageOrganizerToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const PdfPageOrganizerTool: React.FC<PdfPageOrganizerToolProps> = ({
  tool,
  onSelectNextTool,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageOrganizeItem[]>([]);
  const [deletedPages, setDeletedPages] = useState<PageOrganizeItem[]>([]);
  const [thumbnailCache, setThumbnailCache] = useState<Record<number, string>>({});

  // Loading & generation state
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateStatus, setGenerateStatus] = useState('');

  // UI view controls
  const [gridSize, setGridSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [jumpToPageInput, setJumpToPageInput] = useState('');
  const [lastDeletedItem, setLastDeletedItem] = useState<{ item: PageOrganizeItem; index: number } | null>(null);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfJsDocRef = useRef<any>(null);
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileRef = useRef<File | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const dragSourceIndexRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      pdfJsDocRef.current = null;
      fileRef.current = null;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndLoadFile(selected);
    }
  };

  const handleDropUpload = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndLoadFile(droppedFile);
    }
  };

  const validateAndLoadFile = async (selectedFile: File) => {
    setErrorMsg(null);

    // Strict 500 MB (524,288,000 bytes) limit check
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const err = 'File size exceeds the 500 MB limit. Please upload a smaller PDF.';
      setErrorMsg(err);
      triggerToast('error', err);
      return;
    }

    if (
      !selectedFile.name.toLowerCase().endsWith('.pdf') &&
      selectedFile.type !== 'application/pdf'
    ) {
      const err = 'Invalid file format. Please upload a valid PDF document.';
      setErrorMsg(err);
      triggerToast('error', err);
      return;
    }

    setFile(selectedFile);
    fileRef.current = selectedFile;
    trackToolFileSelected(1, selectedFile.size, ['pdf'], 'pdf-page-organizer');
    setIsLoadingPdf(true);
    setLoadProgress(10);
    setLoadStatus('Reading PDF into browser memory...');
    setPages([]);
    setDeletedPages([]);
    setThumbnailCache({});
    setLastDeletedItem(null);

    try {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(selectedFile);
      objectUrlRef.current = objectUrl;

      setLoadProgress(25);
      setLoadStatus('Analyzing PDF page catalog & dimensions...');

      // Load via object URL: completely avoids passing or transferring ArrayBuffer to PDF.js worker
      const loadingTask = (pdfjsLib as any).getDocument({
        url: objectUrl,
        useSystemFonts: true,
      });

      const pdfDoc = await loadingTask.promise;
      pdfJsDocRef.current = pdfDoc;
      const numPages = pdfDoc.numPages;

      if (numPages === 0) {
        throw new Error('This PDF contains no pages.');
      }

      setLoadProgress(45);
      setLoadStatus(`Detected ${numPages} pages. Initializing page grid...`);

      // Initialize page list
      const initialPages: PageOrganizeItem[] = [];
      for (let i = 0; i < numPages; i++) {
        initialPages.push({
          id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          originalIndex: i,
          rotation: 0,
          isDeleted: false,
        });
      }
      setPages(initialPages);

      // Render initial priority batch of thumbnails (first 16 pages)
      const initialBatch = Math.min(16, numPages);
      const cacheUpdates: Record<number, string> = {};

      for (let p = 1; p <= initialBatch; p++) {
        try {
          const thumb = await renderPageThumbnail(pdfDoc, p, 150);
          cacheUpdates[p - 1] = thumb;
          setLoadProgress(45 + Math.round((p / initialBatch) * 45));
          setLoadStatus(`Rendering initial page previews (${p}/${initialBatch})...`);
        } catch (thumbErr) {
          console.warn(`Thumbnail warning for page ${p}`, thumbErr);
        }
      }

      setThumbnailCache(cacheUpdates);
      setLoadProgress(100);
      setLoadStatus('Ready! All pages initialized.');
      triggerToast('success', `Loaded ${numPages} pages successfully!`);

      // Background progressive rendering of remaining thumbnails
      if (initialBatch < numPages) {
        renderRemainingThumbnailsProgressive(pdfDoc, initialBatch + 1, numPages);
      }
    } catch (err: any) {
      console.error('Failed to load PDF in organizer:', err);
      setErrorMsg(err.message || 'Failed to read PDF file. It may be password-protected or corrupted.');
      triggerToast('error', 'Could not open PDF. Please verify file.');
      setFile(null);
      setFileBuffer(null);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && (staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf'))) {
      clearStagedFileForTool();
      validateAndLoadFile(staged);
    }
  }, []);

  // Render remaining thumbnails progressively in small chunks so UI remains silky smooth
  const renderRemainingThumbnailsProgressive = async (pdfDoc: any, startPage: number, total: number) => {
    let cur = startPage;
    while (cur <= total) {
      // Chunk of 6 pages per tick
      const chunkEnd = Math.min(cur + 5, total);
      const chunkCache: Record<number, string> = {};

      for (let p = cur; p <= chunkEnd; p++) {
        if (!pdfJsDocRef.current) return; // aborted
        try {
          const thumb = await renderPageThumbnail(pdfDoc, p, 140);
          chunkCache[p - 1] = thumb;
        } catch {
          // ignore individual thumbnail errors
        }
      }

      setThumbnailCache((prev) => ({ ...prev, ...chunkCache }));
      cur = chunkEnd + 1;
      // Allow browser event loop to handle user interaction
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  };

  // Rotation Controls
  const handleRotatePage = (pageId: string, deltaDegrees: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === pageId) {
          const newRot = (p.rotation + deltaDegrees + 360) % 360;
          return { ...p, rotation: newRot };
        }
        return p;
      })
    );
  };

  const handleResetPageRotation = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, rotation: 0 } : p))
    );
  };

  // Batch rotation controls
  const handleRotateAll = (deltaDegrees: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + deltaDegrees + 360) % 360,
      }))
    );
    triggerToast('info', `Rotated all pages by ${deltaDegrees > 0 ? '+' : ''}${deltaDegrees}°`);
  };

  const handleResetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
    triggerToast('info', 'All rotations have been reset to default.');
  };

  // Deletion Controls
  const handleDeletePage = (pageId: string) => {
    const index = pages.findIndex((p) => p.id === pageId);
    if (index === -1) return;

    const itemToDelete = pages[index];
    const newPages = pages.filter((p) => p.id !== pageId);

    setPages(newPages);
    setDeletedPages((prev) => [...prev, itemToDelete]);
    setLastDeletedItem({ item: itemToDelete, index });

    triggerToast('info', `Page ${index + 1} removed from document.`);
  };

  const handleUndoLastDelete = () => {
    if (!lastDeletedItem) return;
    const { item, index } = lastDeletedItem;

    const newPages = [...pages];
    const insertAt = Math.min(index, newPages.length);
    newPages.splice(insertAt, 0, item);

    setPages(newPages);
    setDeletedPages((prev) => prev.filter((d) => d.id !== item.id));
    setLastDeletedItem(null);
    triggerToast('success', `Restored Page ${insertAt + 1}!`);
  };

  const handleRestoreDeletedPage = (deletedItem: PageOrganizeItem) => {
    setDeletedPages((prev) => prev.filter((d) => d.id !== deletedItem.id));
    setPages((prev) => [...prev, deletedItem]);
    triggerToast('success', `Restored Page #${deletedItem.originalIndex + 1}!`);
  };

  const handleRestoreAllDeleted = () => {
    if (deletedPages.length === 0) return;
    setPages((prev) => [...prev, ...deletedPages]);
    setDeletedPages([]);
    setLastDeletedItem(null);
    triggerToast('success', 'All deleted pages have been restored.');
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragSourceIndexRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if the cursor leaves the card element itself, ignoring child transitions
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = () => {
    dragSourceIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Read index from dataTransfer or fallback to ref/state
    const dtText = e.dataTransfer.getData('text/plain');
    let sourceIndex = dragSourceIndexRef.current;
    if (dtText !== '' && !isNaN(parseInt(dtText, 10))) {
      sourceIndex = parseInt(dtText, 10);
    } else if (draggedIndex !== null) {
      sourceIndex = draggedIndex;
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    dragSourceIndexRef.current = null;

    if (sourceIndex === null || isNaN(sourceIndex) || sourceIndex === targetIndex) {
      return;
    }

    if (sourceIndex < 0 || sourceIndex >= pages.length || targetIndex < 0 || targetIndex >= pages.length) {
      return;
    }

    // Reorder array: move item from sourceIndex to targetIndex directly
    const updated = [...pages];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setPages(updated);
    triggerToast('success', `Moved Page #${sourceIndex + 1} to position #${targetIndex + 1}!`);
  };

  // Step movement helper (Move Left / Move Right)
  const handleMovePageStep = (currentIndex: number, step: -1 | 1) => {
    const targetIndex = currentIndex + step;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const updated = [...pages];
    const [movedItem] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setPages(updated);
    triggerToast('success', `Moved Page #${currentIndex + 1} to position #${targetIndex + 1}!`);
  };

  // Move to specific position prompt helper
  const handleMoveToPosition = (currentIndex: number) => {
    const userInput = window.prompt(
      `Move Page #${currentIndex + 1} to which position? (1 - ${pages.length})`,
      String(currentIndex + 1)
    );
    if (!userInput) return;
    const targetPos = parseInt(userInput.trim(), 10);
    if (isNaN(targetPos) || targetPos < 1 || targetPos > pages.length) {
      triggerToast('error', `Please enter a valid position between 1 and ${pages.length}.`);
      return;
    }
    const targetIndex = targetPos - 1;
    if (targetIndex === currentIndex) return;

    const updated = [...pages];
    const [movedItem] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setPages(updated);
    triggerToast('success', `Moved Page #${currentIndex + 1} to position #${targetIndex + 1}!`);
  };

  // Jump to page utility
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPageNum = parseInt(jumpToPageInput.trim(), 10);
    if (isNaN(targetPageNum) || targetPageNum < 1 || targetPageNum > pages.length) {
      triggerToast('error', `Please enter a valid page number between 1 and ${pages.length}.`);
      return;
    }

    const targetItem = pages[targetPageNum - 1];
    if (targetItem && pageRefs.current[targetItem.id]) {
      pageRefs.current[targetItem.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Visual flash effect
      const el = pageRefs.current[targetItem.id];
      if (el) {
        el.classList.add('ring-4', 'ring-blue-500');
        setTimeout(() => el.classList.remove('ring-4', 'ring-blue-500'), 1500);
      }
    }
  };

  // Download Organized PDF
  const handleDownloadOrganizedPdf = async () => {
    const activeFile = fileRef.current || file;
    if (!activeFile || pages.length === 0) {
      triggerToast('error', 'No active pages to organize.');
      return;
    }

    setIsGenerating(true);
    setGenerateProgress(10);
    setGenerateStatus('Preparing PDF layout...');

    try {
      const activeList = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      // Pass activeFile directly so generateOrganizedPdf generates a fresh, non-detached Uint8Array
      const organizedBytes = await generateOrganizedPdf(
        activeFile,
        activeList,
        (pct, status) => {
          setGenerateProgress(pct);
          setGenerateStatus(status);
        }
      );

      const baseName = activeFile.name ? activeFile.name.replace(/\.pdf$/i, '') : 'organized';
      const outputFilename = `${baseName}_organized.pdf`;

      triggerDownload(organizedBytes, outputFilename);
      triggerToast('success', `Organized PDF downloaded successfully! (${pages.length} pages)`);
    } catch (err: any) {
      console.error('PDF Organization error:', err);
      triggerToast('error', err.message || 'Failed to assemble organized PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetDocument = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    fileRef.current = null;
    setFile(null);
    setFileBuffer(null);
    setPages([]);
    setDeletedPages([]);
    setThumbnailCache({});
    setLastDeletedItem(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Tool Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-900/10 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-red-100 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            PDF Tools • High-Capacity Organizer
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            PDF Page Organizer
          </h2>
          <p className="text-red-100 text-sm sm:text-base max-w-3xl leading-relaxed">
            Visually reorder, rotate individual pages, and delete unwanted sheets in large PDF files containing hundreds of scanned pages.
            Mixed portrait and landscape orientations are preserved with zero image quality loss.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-red-100">
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs font-bold text-amber-200">
              ⚡ Up to 500 MB Limit
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              🔄 90° / 180° / 270° Rotation
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              🖱️ Drag-and-Drop Reordering
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              🛡️ 100% In-Browser Private
            </span>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!file && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropUpload}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-red-300 dark:border-red-900/60 hover:border-red-500 dark:hover:border-red-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40 dark:hover:bg-red-950/20 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <Layers className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Choose or Drop a PDF File to Organize
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
              Optimized for large documents with hundreds of scanned pages, mixed orientations, and heavy book scans.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Maximum allowed file size: 500 MB (524,288,000 bytes)
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Upload Error</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Progress State */}
      {isLoadingPdf && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <ProgressBar progress={loadProgress} statusText={loadStatus} />
          <p className="text-xs text-slate-400 text-center">
            Parsing document structure. High-resolution scanned files and large books may take a moment to initialize.
          </p>
        </div>
      )}

      {/* Main Interactive Page Organizer Viewport */}
      {file && pages.length > 0 && !isLoadingPdf && (
        <div className="space-y-6">
          {/* Top Document Summary & Controls Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 sticky top-16 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* File Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {file.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(file.size)} • <span className="font-semibold text-red-600 dark:text-red-400">{pages.length} Pages active</span>
                    {deletedPages.length > 0 && ` (${deletedPages.length} deleted)`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadOrganizedPdf}
                  disabled={isGenerating}
                  className="py-2.5 px-5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Organized PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDocument}
                  disabled={isGenerating}
                  className="py-2.5 px-3 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New File</span>
                </button>
              </div>
            </div>

            {/* Secondary Toolbar: Search / Jump, Rotate All, Zoom */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Jump to Page Form */}
              <form onSubmit={handleJumpToPage} className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={pages.length}
                    placeholder="Page #"
                    value={jumpToPageInput}
                    onChange={(e) => setJumpToPageInput(e.target.value)}
                    className="w-24 pl-2.5 pr-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Jump
                </button>
              </form>

              {/* Batch Rotation */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRotateAll(-90)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Rotate all pages counter-clockwise"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>All -90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateAll(90)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Rotate all pages clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>All +90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAllRotations}
                  className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Reset Angles
                </button>
              </div>

              {/* Thumbnail Size Zoom */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 mr-1">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setGridSize('sm')}
                  className={`px-2 py-1 rounded-md font-semibold ${
                    gridSize === 'sm'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  S
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize('md')}
                  className={`px-2 py-1 rounded-md font-semibold ${
                    gridSize === 'md'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize('lg')}
                  className={`px-2 py-1 rounded-md font-semibold ${
                    gridSize === 'lg'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  L
                </button>
              </div>
            </div>

            {/* Undo Notification Banner */}
            {lastDeletedItem && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs">
                <span>
                  Page removed. Total active pages: <strong>{pages.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleUndoLastDelete}
                  className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              </div>
            )}
          </div>

          {/* Generating PDF Progress Bar */}
          {isGenerating && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-3">
              <ProgressBar progress={generateProgress} statusText={generateStatus} />
              <p className="text-xs text-slate-500 text-center">
                Generating lossless PDF streams with updated page orientations and order...
              </p>
            </div>
          )}

          {/* Responsive Drag-and-Drop Page Thumbnails Grid */}
          <div
            className={`grid gap-4 ${
              gridSize === 'sm'
                ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6'
                : gridSize === 'lg'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}
          >
            {pages.map((page, index) => {
              const thumbnailSrc = thumbnailCache[page.originalIndex];
              const isOver = dragOverIndex === index;

              return (
                <div
                  key={page.id}
                  ref={(el) => {
                    pageRefs.current[page.id] = el;
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-3 shadow-xs transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                    draggedIndex === index
                      ? 'opacity-30 scale-95 border-2 border-dashed border-red-500 bg-red-50/50 dark:bg-red-950/20'
                      : isOver
                      ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xl scale-[1.03] ring-4 ring-blue-500/25 z-10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-600 hover:shadow-md'
                  }`}
                >
                  {/* Card Header: Position badge, Quick Move arrows, and Drag Handle */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToPosition(index);
                        }}
                        title={`Click to move Page #${index + 1} to another position`}
                        className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        #{index + 1}
                      </button>
                      {page.originalIndex !== index && (
                        <span className="text-[10px] text-slate-400" title={`Original page ${page.originalIndex + 1}`}>
                          (Orig #{page.originalIndex + 1})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Step shift arrows for click-based movement */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePageStep(index, -1);
                        }}
                        title="Move left/up (1 position earlier)"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === pages.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePageStep(index, 1);
                        }}
                        title="Move right/down (1 position later)"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div
                        className="flex items-center text-slate-400 group-hover:text-red-500 transition-colors p-1"
                        title="Drag and drop card to reorder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Preview Area with CSS Rotation */}
                  <div className="relative aspect-[3/4] bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800/80 mb-3 select-none pointer-events-none">
                    {thumbnailSrc ? (
                      <img
                        draggable={false}
                        src={thumbnailSrc}
                        alt={`Page ${index + 1}`}
                        style={{
                          transform: `rotate(${page.rotation}deg)`,
                          transition: 'transform 0.25s ease-out',
                        }}
                        className="max-h-full max-w-full object-contain shadow-xs select-none pointer-events-none rounded-sm"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 animate-pulse">
                        <FileText className="w-6 h-6" />
                        <span className="text-[10px] font-mono">Loading #{page.originalIndex + 1}...</span>
                      </div>
                    )}

                    {/* Rotation Angle Badge if rotated */}
                    {page.rotation !== 0 && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                        {page.rotation}°
                      </div>
                    )}
                  </div>

                  {/* Individual Page Action Buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    {/* Rotate Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRotatePage(page.id, -90)}
                        title="Rotate 90° Counter-Clockwise"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRotatePage(page.id, 90)}
                        title="Rotate 90° Clockwise"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {page.rotation !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleResetPageRotation(page.id)}
                          title="Reset rotation to 0°"
                          className="text-[10px] text-red-600 dark:text-red-400 font-bold px-1 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Delete Page Button */}
                    <button
                      type="button"
                      onClick={() => handleDeletePage(page.id)}
                      title={`Remove Page ${index + 1}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deleted Pages Tray if any pages were removed */}
          {deletedPages.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  Removed Pages ({deletedPages.length})
                </span>
                <button
                  type="button"
                  onClick={handleRestoreAllDeleted}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Restore All Removed Pages
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {deletedPages.map((del) => (
                  <button
                    key={del.id}
                    type="button"
                    onClick={() => handleRestoreDeletedPage(del)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer group"
                    title="Click to restore this page"
                  >
                    <span>Page #{del.originalIndex + 1}</span>
                    <Undo2 className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Floating/Sticky Action Bar for Quick Download */}
          <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400 text-center sm:text-left">
              Ready to generate: <strong className="text-slate-900 dark:text-white">{pages.length} Pages</strong> in custom order. Original file remains untouched.
            </div>

            <button
              type="button"
              onClick={handleDownloadOrganizedPdf}
              disabled={isGenerating}
              className="w-full sm:w-auto py-3 px-8 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md shadow-red-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Organized PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Recommended Next Tools */}
      {onSelectNextTool && (
        <RecommendedNextTools
          currentToolId={tool.id}
          onSelectTool={onSelectNextTool}
        />
      )}

      {/* Information & FAQ Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Designed for 500+ Page Documents & Scans
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            PottoTools PDF Page Organizer runs locally in your web browser. You can reorder, rotate mixed scans, and remove unwanted blank pages without uploading sensitive files to cloud servers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Lossless Reordering</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Internal PDF streams are re-indexed directly without re-rasterizing, preserving crisp scans, embedded photos, and vector text.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Mixed Orientations</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Rotate individual landscape maps or sideways receipts independently without affecting the rest of the portrait document.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Up to 500 MB Capacity</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Built with progressive rendering and low-memory canvas thumbs, handling high-resolution books and multipage archives smoothly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
