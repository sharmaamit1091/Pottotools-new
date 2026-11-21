import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { pptxToPdf, extractPptxText } from '../../services/office/powerpointService';
import { triggerDownload } from '../../services/utils/downloadUtils';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  Presentation,
  Copy,
  Check,
} from 'lucide-react';
import { WorkflowStepsIndicator } from '../common/WorkflowStepsIndicator';
import { triggerToast } from '../common/Toast';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface PowerPointToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const PowerPointTool: React.FC<PowerPointToolProps> = ({ tool, onSelectNextTool }) => {
  const [files, setFiles] = useState<File[]>([]);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && /\.(pptx?|ppt)$/i.test(staged.name)) {
      clearStagedFileForTool();
      setFiles([staged]);
    }
  }, [tool.id]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [result, setResult] = useState<{
    blob?: Blob;
    text?: string;
    filename: string;
    slideCount?: number;
    title?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (files.length === 0) {
      setErrorMsg('Please select a PowerPoint (.pptx) file to convert.');
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    setErrorMsg(null);
    setResult(null);

    try {
      setStatusText('Reading presentation slide streams...');
      setProgress(40);

      const file = files[0];
      const isTextExtraction = tool.id === 'pptx-to-txt';

      if (isTextExtraction) {
        setStatusText('Extracting presentation slide notes & text...');
        setProgress(70);
        const text = await extractPptxText(file);
        setProgress(100);
        const baseName = file.name.replace(/\.pptx?$/i, '');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        setResult({
          blob,
          text,
          filename: `${baseName}_slides.txt`,
          title: baseName,
        });
      } else {
        // PowerPoint to PDF
        setStatusText('Rendering presentation slides into PDF layout...');
        setProgress(65);
        const { blob, slideCount, title } = await pptxToPdf(file);
        setProgress(100);
        const baseName = file.name.replace(/\.pptx?$/i, '');
        setResult({
          blob,
          slideCount,
          filename: `${baseName}.pdf`,
          title,
        });
      }

      triggerToast('success', 'Presentation converted successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert PowerPoint document.';
      setErrorMsg(msg);
      triggerToast('error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result?.blob) {
      triggerDownload(result.blob, result.filename);
      triggerToast('success', `Downloaded ${result.filename}`);
    }
  };

  const handleCopyText = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      triggerToast('info', 'Copied slide text to clipboard!');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
    setStatusText('');
  };

  return (
    <div className="space-y-8">
      {/* Visual Workflow Steps */}
      <WorkflowStepsIndicator
        currentStep={result ? 'result' : isProcessing ? 'process' : files.length > 0 ? 'settings' : 'upload'}
        hasSettings={false}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Presentation className="w-6 h-6 text-orange-500" />
            <span>{tool.title}</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {tool.fullDesc}
          </p>
        </div>

        {/* Upload Zone */}
        {!result && (
          <div className="space-y-4">
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              multiple={false}
              maxFileSizeMB={tool.maxFileSizeMB || 50}
              files={files}
              onFilesSelected={(selected) => setFiles(selected)}
              onRemoveFile={() => setFiles([])}
            />

            {files.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    PPT
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {files[0].name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Change file
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2 py-2">
                <ProgressBar progress={progress} statusText={statusText} />
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={files.length === 0 || isProcessing}
                onClick={handleProcess}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Converting Slides…</span>
                  </>
                ) : (
                  <>
                    <Presentation className="w-4 h-4" />
                    <span>Convert PowerPoint to PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {result && (
          <div className="space-y-6 pt-2">
            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Conversion Complete</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {result.filename}
                </h3>
                {result.slideCount && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {result.slideCount} presentation slides converted to landscape PDF pages.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>

                {result.text && (
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
                >
                  Convert Another File
                </button>
              </div>
            </div>

            {/* Slide Text Preview if applicable */}
            {result.text && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Extracted Slide Content
                </span>
                <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  {result.text}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tool Instructions & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 text-xs font-bold flex items-center justify-center">
              ?
            </span>
            <span>How It Works</span>
          </h3>
          <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Select or drag and drop your PowerPoint presentation (.pptx).</li>
            <li>Our client-side engine parses slide XML structures and slide notes.</li>
            <li>Each slide is formatted into a clean landscape PDF presentation page.</li>
            <li>Download your PDF instantly without waiting for remote server queues.</li>
          </ol>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold flex items-center justify-center">
              ✓
            </span>
            <span>100% Private & Secure</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your presentations, business pitches, and slides never leave your computer. Processing executes entirely inside your browser's memory using WebAssembly.
          </p>
        </div>
      </div>
    </div>
  );
};
