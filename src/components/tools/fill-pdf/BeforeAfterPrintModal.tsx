import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Columns2,
  Layers,
  Printer,
  Download,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { renderFormPdfPageToCanvas } from '../../../services/pdf/fillPdfFormService';

interface BeforeAfterPrintModalProps {
  isOpen: boolean;
  mode: 'compare' | 'print';
  onClose: () => void;
  originalPdfDoc: any;
  editedPdfBytes: Uint8Array | null;
  editedBlob: Blob | null;
  exportWarnings: string[];
  initialPage: number;
  pageCount: number;
  onDownloadPdf: () => void;
}

export const BeforeAfterPrintModal: React.FC<BeforeAfterPrintModalProps> = ({
  isOpen,
  mode: initialMode,
  onClose,
  originalPdfDoc,
  editedPdfBytes,
  editedBlob,
  exportWarnings,
  initialPage,
  pageCount,
  onDownloadPdf,
}) => {
  const [activeMode, setActiveMode] = useState<'compare' | 'print'>(initialMode);
  const [compareView, setCompareView] = useState<'side-by-side' | 'toggle'>('side-by-side');
  const [toggleVersion, setToggleVersion] = useState<'after' | 'before'>('after');
  const [pageNum, setPageNum] = useState(initialPage);
  const [zoom, setZoom] = useState(1.0);
  const [showPrintMargins, setShowPrintMargins] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [editedSizeInfo, setEditedSizeInfo] = useState<{ wPt: number; hPt: number } | null>(null);

  const editedDocRef = useRef<any>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const printCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setPageNum(initialPage);
  }, [initialPage, isOpen]);

  // Load exported edited PDF into PDF.js so preview is 100% identical to the exported PDF!
  useEffect(() => {
    if (!isOpen || !editedPdfBytes) return;
    let cancelled = false;

    const loadEdited = async () => {
      try {
        if (editedDocRef.current?.destroy) {
          editedDocRef.current.destroy().catch(() => {});
          editedDocRef.current = null;
        }
        const task = (pdfjsLib as any).getDocument({
          data: new Uint8Array(editedPdfBytes.slice(0)),
          useSystemFonts: true,
        });
        const doc = await task.promise;
        if (cancelled) {
          doc.destroy?.().catch(() => {});
          return;
        }
        editedDocRef.current = doc;
        renderVisibleCanvases(doc);
      } catch (err) {
        console.warn('Preview load warning:', err);
      }
    };

    loadEdited();

    return () => {
      cancelled = true;
    };
  }, [isOpen, editedPdfBytes]);

  const renderVisibleCanvases = async (editedDocOverride?: any) => {
    const editedDoc = editedDocOverride || editedDocRef.current;
    if (!originalPdfDoc || !editedDoc) return;

    setIsRendering(true);
    try {
      const renderScale = Math.max(0.75, Math.min(2.4, zoom * 1.25));
      if (activeMode === 'compare') {
        if (beforeCanvasRef.current && (compareView === 'side-by-side' || toggleVersion === 'before')) {
          await renderFormPdfPageToCanvas(originalPdfDoc, pageNum, beforeCanvasRef.current, renderScale, 0);
        }
        if (afterCanvasRef.current && (compareView === 'side-by-side' || toggleVersion === 'after')) {
          await renderFormPdfPageToCanvas(editedDoc, pageNum, afterCanvasRef.current, renderScale, 0);
        }
      } else if (printCanvasRef.current) {
        const pg = await editedDoc.getPage(pageNum);
        const vp = pg.getViewport({ scale: 1.0 });
        setEditedSizeInfo({ wPt: Math.round(vp.width), hPt: Math.round(vp.height) });
        await renderFormPdfPageToCanvas(editedDoc, pageNum, printCanvasRef.current, renderScale, 0);
      }
    } catch (err) {
      console.warn('Preview render notice:', err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (editedDocRef.current) {
      renderVisibleCanvases();
    }
  }, [isOpen, activeMode, compareView, toggleVersion, pageNum, zoom]);

  // Trigger clean native browser printing of the exact exported PDF via hidden iframe (avoids window.open)
  const handlePrintCompletedPdf = () => {
    if (!editedBlob) return;
    const blobUrl = URL.createObjectURL(editedBlob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // Fallback: print current preview window if browser blocks PDF iframe print
        window.print();
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        } catch {
          // ignore
        }
      }, 60_000);
    };
  };

  if (!isOpen) return null;

  const orientationLabel = editedSizeInfo
    ? editedSizeInfo.wPt > editedSizeInfo.hPt
      ? `Landscape (${Math.round(editedSizeInfo.wPt * 0.3528)}×${Math.round(editedSizeInfo.hPt * 0.3528)} mm)`
      : `Portrait (${Math.round(editedSizeInfo.wPt * 0.3528)}×${Math.round(editedSizeInfo.hPt * 0.3528)} mm)`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Before and After / Print Preview"
    >
      <div className="w-full max-w-6xl h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveMode('compare')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'compare'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Before / After</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('print')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'print'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Preview</span>
              </button>
            </div>

            {activeMode === 'compare' && (
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCompareView('side-by-side')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    compareView === 'side-by-side'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setCompareView('toggle')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    compareView === 'toggle'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Toggle
                </button>
              </div>
            )}
          </div>

          {/* Synchronized Page + Zoom Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              <button
                type="button"
                disabled={pageNum <= 1}
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 px-1.5 tabular-nums">
                Page {pageNum} / {pageCount}
              </span>
              <button
                type="button"
                disabled={pageNum >= pageCount}
                onClick={() => setPageNum((p) => Math.min(pageCount, p + 1))}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 w-11 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Export Warnings Notice (if any) */}
        {exportWarnings.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {exportWarnings.slice(0, 3).map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          </div>
        )}

        {/* Viewport Body */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 relative">
          {isRendering && (
            <div className="sticky top-2 z-20 mx-auto w-fit px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold flex items-center gap-2 shadow">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Rendering exact exported PDF...</span>
            </div>
          )}

          {activeMode === 'compare' ? (
            compareView === 'side-by-side' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Original PDF — Page {pageNum}
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-auto max-w-full">
                    <canvas ref={beforeCanvasRef} className="block max-w-full h-auto" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Completed Edited PDF — Page {pageNum}
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-md border-2 border-emerald-400/70 overflow-auto max-w-full">
                    <canvas ref={afterCanvasRef} className="block max-w-full h-auto" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setToggleVersion('before')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      toggleVersion === 'before'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Original PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggleVersion('after')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      toggleVersion === 'after'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Edited PDF (Final)
                  </button>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                  {toggleVersion === 'before' ? (
                    <canvas ref={beforeCanvasRef} className="block max-w-full h-auto" />
                  ) : (
                    <canvas ref={afterCanvasRef} className="block max-w-full h-auto" />
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">
                  Orientation: <strong className="text-slate-900 dark:text-white">{orientationLabel || 'Auto'}</strong>
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPrintMargins}
                    onChange={(e) => setShowPrintMargins(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Show safe print margins (12 mm)</span>
                </label>
              </div>
              <div className="relative bg-white p-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                <canvas ref={printCanvasRef} className="block max-w-full h-auto" />
                {showPrintMargins && (
                  <div
                    className="pointer-events-none absolute inset-[5.5%] border border-dashed border-sky-500/80 rounded-xs"
                    title="Safe printable margin zone"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preview is rendered directly from your final exported PDF bytes.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintCompletedPdf}
              disabled={!editedBlob}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Completed PDF</span>
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={!editedBlob}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Filled PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
