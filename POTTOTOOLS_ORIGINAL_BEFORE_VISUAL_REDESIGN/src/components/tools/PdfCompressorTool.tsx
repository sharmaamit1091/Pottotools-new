import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { compressPdf } from '../../services/pdf/pdfLibService';
import { triggerDownload, formatBytes } from '../../services/utils/downloadUtils';
import { CheckCircle2, AlertTriangle, Download, RefreshCw, FileText, Settings, ArrowRight } from 'lucide-react';
import { WorkflowStepsIndicator } from '../common/WorkflowStepsIndicator';
import { RecommendedNextTools } from './RecommendedNextTools';
import { triggerToast } from '../common/Toast';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface PdfCompressorToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const PdfCompressorTool: React.FC<PdfCompressorToolProps> = ({ tool, onSelectNextTool }) => {
  const [files, setFiles] = useState<File[]>([]);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && (staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf'))) {
      setFiles([staged]);
      clearStagedFileForTool();
    }
  }, []);
  const [preset, setPreset] = useState<'100kb' | '200kb' | '500kb' | '1mb' | '2mb' | 'custom'>('200kb');
  const [customValue, setCustomValue] = useState<number>(300);
  const [customUnit, setCustomUnit] = useState<'KB' | 'MB'>('KB');
  const [qualityPreset, setQualityPreset] = useState<'high' | 'recommended' | 'low'>('recommended');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [result, setResult] = useState<{
    data: Uint8Array;
    originalSize: number;
    newSize: number;
    reductionPercent: number;
    reachedTarget: boolean;
    targetBytes: number;
  } | null>(null);

  const getTargetBytes = (): number => {
    switch (preset) {
      case '100kb':
        return 100 * 1024;
      case '200kb':
        return 200 * 1024;
      case '500kb':
        return 500 * 1024;
      case '1mb':
        return 1024 * 1024;
      case '2mb':
        return 2 * 1024 * 1024;
      case 'custom':
        return customUnit === 'MB' ? customValue * 1024 * 1024 : customValue * 1024;
      default:
        return 200 * 1024;
    }
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(15);
    setStatusText('Reading PDF data into local memory...');
    setErrorMsg(null);
    setResult(null);

    try {
      const file = files[0];
      const buffer = await file.arrayBuffer();
      const targetBytes = getTargetBytes();

      setProgress(40);
      setStatusText('Analyzing stream objects and compressing pages...');

      const quality = qualityPreset === 'high' ? 0.8 : qualityPreset === 'recommended' ? 0.65 : 0.45;
      const scale = qualityPreset === 'high' ? 1.2 : qualityPreset === 'recommended' ? 1.0 : 0.8;

      const output = await compressPdf(buffer, {
        targetSizeBytes: targetBytes,
        quality,
        scale,
      });

      setProgress(100);
      setStatusText('Compression complete!');
      setResult({
        ...output,
        targetBytes,
      });
      triggerToast('success', `Reduced size by ${output.reductionPercent}% (${formatBytes(output.originalSize)} → ${formatBytes(output.newSize)})!`, 'PDF Compressed');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while compressing this PDF.');
      triggerToast('error', err.message || 'Compression failed.', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || files.length === 0) return;
    const originalName = files[0].name.replace(/\.pdf$/i, '');
    const filename = `${originalName}-compressed.pdf`;
    triggerDownload(result.data, filename);
    triggerToast('success', `Saved ${filename} to your downloads.`, 'Download Started');
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setProgress(0);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8">
      {/* Tool Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {tool.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {tool.fullDesc}
        </p>
      </div>

      {/* 4-Step Visual Progress Bar */}
      <WorkflowStepsIndicator
        currentStep={result ? 'result' : isProcessing ? 'process' : files.length > 0 ? 'settings' : 'upload'}
        hasSettings={true}
      />

      {/* Main Tool Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {!result ? (
          <>
            {/* Upload Zone */}
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={false}
              files={files}
              onFilesSelected={setFiles}
              onRemoveFile={() => setFiles([])}
              disabled={isProcessing}
            />

            {files.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* File info card */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {files[0].name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Current size: {formatBytes(files[0].size)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Target Size</span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">
                      ~{formatBytes(getTargetBytes())}
                    </span>
                  </div>
                </div>

                {/* Target Size Presets */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    Choose Target Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {[
                      { key: '100kb', label: '100 KB' },
                      { key: '200kb', label: '200 KB' },
                      { key: '500kb', label: '500 KB' },
                      { key: '1mb', label: '1 MB' },
                      { key: '2mb', label: '2 MB' },
                      { key: 'custom', label: 'Custom' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPreset(p.key as any)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                          preset === p.key
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Target Input */}
                {preset === 'custom' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Enter Custom Max Target Size:
                    </label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        min="20"
                        max="50000"
                        value={customValue}
                        onChange={(e) => setCustomValue(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-32 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                      />
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value as any)}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Compression Level */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Clarity & Quality Strategy</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        key: 'high',
                        title: 'Maximum Clarity',
                        desc: 'Best for text documents with small font sizes',
                      },
                      {
                        key: 'recommended',
                        title: 'Recommended (Balanced)',
                        desc: 'Optimal size reduction while keeping sharp text',
                      },
                      {
                        key: 'low',
                        title: 'Maximum Compression',
                        desc: 'Aggressive reduction for strict upload ceilings',
                      },
                    ].map((lvl) => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setQualityPreset(lvl.key as any)}
                        className={`p-3 text-left rounded-lg border text-xs transition-all ${
                          qualityPreset === lvl.key
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-semibold">{lvl.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {lvl.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                {isProcessing && (
                  <div className="pt-2">
                    <ProgressBar progress={progress} statusText={statusText} />
                  </div>
                )}

                {/* Error */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Action button */}
                <button
                  type="button"
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-md hover:shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing PDF Document...</span>
                    </>
                  ) : (
                    <>
                      <span>Compress PDF Document</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Result View */
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                PDF Successfully Compressed!
              </h2>
              <p className="text-xs text-slate-500">
                Processed locally on your machine with zero server upload.
              </p>
            </div>

            {/* Before vs After stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div>
                <span className="text-xs text-slate-500 block">Original Size</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                  {formatBytes(result.originalSize)}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Compressed Size</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {formatBytes(result.newSize)}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Reduction</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  -{result.reductionPercent}%
                </span>
              </div>
            </div>

            {/* Target warning if not strictly reached */}
            {!result.reachedTarget && (
              <div className="flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 max-w-xl mx-auto">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  The file could not be compressed below {formatBytes(result.targetBytes)} without causing unacceptable text corruption. We achieved the safest physical minimum of {formatBytes(result.newSize)}.
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-md hover:shadow-xl hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Compressed PDF</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-3.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Process Another File</span>
              </button>
            </div>

            {/* Recommended Next Tool Section */}
            {onSelectNextTool && (
              <RecommendedNextTools
                currentToolId={tool.id}
                onSelectTool={onSelectNextTool}
              />
            )}
          </div>
        )}
      </div>

      {/* Ad placement separated from tool controls */}
      <AdPlaceholder format="tool-bottom" />

      {/* Instructions & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            How to Compress PDF Online
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
