import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { runOcrOnFile, OcrResult } from '../../services/ocr/tesseractService';
import { triggerDownload } from '../../services/utils/downloadUtils';
import { trackToolCompleted } from '../../services/analytics/ga4Tracker';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Copy,
  Check,
  Languages,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface OcrToolProps {
  tool: ToolDefinition;
}

export const OcrTool: React.FC<OcrToolProps> = ({ tool }) => {
  const [files, setFiles] = useState<File[]>([]);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (!staged) return;

    const isPdf = staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf');
    const isImg = staged.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(staged.name);

    if (isPdf || isImg) {
      clearStagedFileForTool();
      setFiles([staged]);
    }
  }, [tool.id]);
  const [language, setLanguage] = useState<'eng' | 'hin'>('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editableText, setEditableText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRunOcr = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setStatusText('Preparing file for OCR recognition...');
    setErrorMsg(null);
    setOcrResult(null);

    try {
      const res = await runOcrOnFile(files[0], language, (update) => {
        setProgress(update.progress);
        setStatusText(update.statusText);
      });

      setOcrResult(res);
      setEditableText(res.text);
      trackToolCompleted('ocr-text', new Blob([res.text]).size, 'ocr-tool');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during OCR recognition.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!editableText) return;
    const blob = new Blob([editableText], { type: 'text/plain;charset=utf-8' });
    const baseName = files[0]?.name.replace(/\.[^/.]+$/, '') || 'ocr-result';
    triggerDownload(blob, `${baseName}-ocr.txt`);
  };

  const handleDownloadDocx = () => {
    if (!ocrResult?.docxBlob) return;
    const baseName = files[0]?.name.replace(/\.[^/.]+$/, '') || 'ocr-result';
    triggerDownload(ocrResult.docxBlob, `${baseName}-ocr.docx`);
  };

  const handleReset = () => {
    setFiles([]);
    setOcrResult(null);
    setEditableText('');
    setProgress(0);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {tool.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {tool.fullDesc}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {!ocrResult ? (
          <>
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
                {/* Language selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Languages className="w-3.5 h-3.5 text-blue-600" />
                    <span>OCR Recognition Language</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('eng')}
                      className={`py-2 px-4 text-xs font-medium rounded-lg border transition-all ${
                        language === 'eng'
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      English (Latin Alphabet)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('hin')}
                      className={`py-2 px-4 text-xs font-medium rounded-lg border transition-all ${
                        language === 'hin'
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Hindi (Devanagari / हिन्दी)
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-300">
                  <div className="font-semibold mb-0.5">Hardware In-Browser Engine</div>
                  <div>
                    Tesseract.js runs inside Web Workers on your local device. The language model weights are cached directly in your browser storage.
                  </div>
                </div>

                {isProcessing && (
                  <ProgressBar progress={progress} statusText={statusText} />
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRunOcr}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting Text via OCR...</span>
                    </>
                  ) : (
                    <>
                      <span>Run Optical Character Recognition</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* OCR Result & Editor View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Text Recognized Successfully
                  </h2>
                  <div className="text-xs text-slate-500 font-mono">
                    Confidence: {ocrResult.confidence}% · {ocrResult.pageCount} {ocrResult.pageCount === 1 ? 'page' : 'pages'} scanned
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </div>

            {/* Editable Text Area */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Extracted Text (Editable)
              </label>
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={12}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Download and Reset buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="w-full sm:w-auto py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download as Word (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="w-full sm:w-auto py-2.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Plain Text (.txt)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-2.5 px-4 text-slate-500 hover:text-slate-800 text-xs font-medium"
              >
                Scan Another Document
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
            OCR Scanning Tips
          </h2>
          <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li>Ensure the scan has high contrast (dark text on white/light background).</li>
            <li>Skewed or rotated photos can be straightened beforehand using our Rotate tool.</li>
            <li>For multilingual documents containing Hindi, select the Hindi model for Devanagari script support.</li>
          </ul>
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
