import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  mergePdfs,
  splitPdf,
  deletePdfPages,
  addWatermark,
  addPageNumbers,
  getPdfPageCount,
} from '../../services/pdf/pdfLibService';
import { triggerDownload, createZip } from '../../services/utils/downloadUtils';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface PdfOrganizeToolProps {
  tool: ToolDefinition;
}

export const PdfOrganizeTool: React.FC<PdfOrganizeToolProps> = ({ tool }) => {
  const isMerge = tool.id === 'merge-pdf';
  const isSplit = tool.id === 'split-pdf';
  const isDelete = tool.id === 'delete-pdf-pages';
  const isWatermark = tool.id === 'watermark-pdf';
  const isPageNumbers = tool.id === 'page-numbers-pdf';

  const [files, setFiles] = useState<File[]>([]);
  const [totalDetectedPages, setTotalDetectedPages] = useState<number | null>(null);

  // Settings
  const [splitRange, setSplitRange] = useState('1-2');
  const [extractMode, setExtractMode] = useState<'single' | 'zip'>('single');

  const [deletePageInput, setDeletePageInput] = useState('2');

  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkRotation, setWatermarkRotation] = useState(45);

  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [pageNumberFormat, setPageNumberFormat] = useState<'Page X of Y' | '1'>('Page X of Y');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [outputBlob, setOutputBlob] = useState<{ blob: Blob | Uint8Array; filename: string } | null>(null);

  // Handle files selection
  const handleFilesSelected = async (selected: File[]) => {
    setFiles(selected);
    setErrorMsg(null);
    setOutputBlob(null);

    if (selected.length > 0 && !isMerge) {
      try {
        const buffer = await selected[0].arrayBuffer();
        const pages = await getPdfPageCount(buffer);
        setTotalDetectedPages(pages);
        if (pages > 1) {
          setSplitRange(`1-${Math.min(pages, 2)}`);
          setDeletePageInput(`${pages}`);
        }
      } catch {
        // Continue gracefully
      }
    }
  };

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && (staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf'))) {
      clearStagedFileForTool();
      handleFilesSelected([staged]);
    }
  }, [tool.id]);

  // Reorder files for Merge
  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;
    setFiles(newFiles);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(20);
    setErrorMsg(null);
    setOutputBlob(null);

    try {
      if (isMerge) {
        if (files.length < 2) {
          throw new Error('Please select at least 2 PDF files to merge.');
        }
        setStatusText('Reading input documents into memory...');
        setProgress(40);
        const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
        setStatusText('Merging PDF streams...');
        setProgress(70);
        const mergedBytes = await mergePdfs(buffers);
        setProgress(100);
        setOutputBlob({ blob: mergedBytes, filename: 'pottotools-merged.pdf' });
      } else if (isSplit) {
        setStatusText('Parsing page ranges and splitting...');
        setProgress(45);
        const buffer = await files[0].arrayBuffer();
        const res = await splitPdf(buffer, splitRange, extractMode === 'single');
        setProgress(90);

        if (Array.isArray(res)) {
          // Output ZIP
          setStatusText('Archiving pages into ZIP...');
          const zipBlob = await createZip(res);
          setOutputBlob({ blob: zipBlob, filename: 'split-pages.zip' });
        } else {
          setOutputBlob({ blob: res, filename: 'extracted-pages.pdf' });
        }
        setProgress(100);
      } else if (isDelete) {
        setStatusText('Removing designated pages...');
        setProgress(50);
        const buffer = await files[0].arrayBuffer();
        const toDelete = deletePageInput
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));

        const updatedBytes = await deletePdfPages(buffer, toDelete);
        setProgress(100);
        setOutputBlob({ blob: updatedBytes, filename: 'trimmed-document.pdf' });
      } else if (isWatermark) {
        setStatusText('Embedding vector watermark...');
        setProgress(50);
        const buffer = await files[0].arrayBuffer();
        const markedBytes = await addWatermark(buffer, watermarkText, {
          opacity: watermarkOpacity,
          rotationDegrees: watermarkRotation,
        });
        setProgress(100);
        setOutputBlob({ blob: markedBytes, filename: 'watermarked-document.pdf' });
      } else if (isPageNumbers) {
        setStatusText('Numbering pages...');
        setProgress(50);
        const buffer = await files[0].arrayBuffer();
        const numberedBytes = await addPageNumbers(buffer, pageNumberPos, pageNumberFormat);
        setProgress(100);
        setOutputBlob({ blob: numberedBytes, filename: 'numbered-document.pdf' });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    triggerDownload(outputBlob.blob, outputBlob.filename);
  };

  const handleReset = () => {
    setFiles([]);
    setOutputBlob(null);
    setProgress(0);
    setErrorMsg(null);
    setTotalDetectedPages(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {tool.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {tool.fullDesc}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {!outputBlob ? (
          <>
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={isMerge}
              files={files}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={(idx) => {
                const newFiles = [...files];
                newFiles.splice(idx, 1);
                setFiles(newFiles);
              }}
              disabled={isProcessing}
            />

            {/* Merge File Reordering List */}
            {isMerge && files.length > 1 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Arrange Merge Sequence (Top file is First Page)
                </span>
                <div className="space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-blue-600 w-5">#{i + 1}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveFile(i, 'up')}
                          disabled={i === 0}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFile(i, 'down')}
                          disabled={i === files.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tool-specific configuration controls */}
            {files.length > 0 && (
              <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Total pages detector */}
                {totalDetectedPages && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Detected Document Size:{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {totalDetectedPages} {totalDetectedPages === 1 ? 'page' : 'pages'}
                    </span>
                  </div>
                )}

                {/* Split PDF settings */}
                {isSplit && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Page Ranges to Extract
                    </label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8-10"
                      className="w-full max-w-sm px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="extractMode"
                          checked={extractMode === 'single'}
                          onChange={() => setExtractMode('single')}
                        />
                        <span>Extract as one consolidated PDF</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="extractMode"
                          checked={extractMode === 'zip'}
                          onChange={() => setExtractMode('zip')}
                        />
                        <span>Extract each page as separate PDF (ZIP)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Delete Pages settings */}
                {isDelete && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Pages to Delete
                    </label>
                    <input
                      type="text"
                      value={deletePageInput}
                      onChange={(e) => setDeletePageInput(e.target.value)}
                      placeholder="e.g. 2, 4, 6"
                      className="w-full max-w-sm px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                    <p className="text-xs text-slate-500">
                      Enter page numbers separated by commas. At least one page must remain.
                    </p>
                  </div>
                )}

                {/* Watermark settings */}
                {isWatermark && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full max-w-sm px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold tracking-wider uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                          Opacity: {Math.round(watermarkOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.05"
                          max="0.8"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                          Angle: {watermarkRotation}°
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          step="15"
                          value={watermarkRotation}
                          onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Page Numbers settings */}
                {isPageNumbers && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Numbering Format
                      </label>
                      <div className="flex gap-2">
                        {['Page X of Y', '1'].map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setPageNumberFormat(fmt as any)}
                            className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                              pageNumberFormat === fmt
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Position
                      </label>
                      <div className="flex gap-2">
                        {[
                          { key: 'bottom-center', label: 'Bottom Center' },
                          { key: 'bottom-right', label: 'Bottom Right' },
                          { key: 'top-right', label: 'Top Right' },
                        ].map((pos) => (
                          <button
                            key={pos.key}
                            type="button"
                            onClick={() => setPageNumberPos(pos.key as any)}
                            className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                              pageNumberPos === pos.key
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {isProcessing && (
                  <div className="pt-2">
                    <ProgressBar progress={progress} statusText={statusText} />
                  </div>
                )}

                {/* Error msg */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Process Action Button */}
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing PDF...</span>
                    </>
                  ) : (
                    <>
                      <span>{isMerge ? 'Merge PDF Documents' : `Process & Apply Changes`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Success Result View */
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Operation Completed Successfully!
              </h2>
              <p className="text-xs text-slate-500">
                Processed locally with zero data transmitted over the internet.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Result File</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Process Another File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AdPlaceholder format="tool-bottom" />

      {/* Instructions & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {tool.instructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ol>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 text-xs">
            {tool.faqs.map((faq, i) => (
              <div key={i}>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {faq.question}
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfOrganizeTool;
