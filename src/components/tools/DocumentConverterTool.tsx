import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  docxToHtml,
  docxToTxt,
  pdfToDocx,
  textToPdf,
  markdownToHtml,
} from '../../services/office/wordConverterService';
import { triggerDownload } from '../../services/utils/downloadUtils';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  ArrowRight,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import { WorkflowStepsIndicator } from '../common/WorkflowStepsIndicator';
import { RecommendedNextTools } from './RecommendedNextTools';
import { triggerToast } from '../common/Toast';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface DocumentConverterToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const DocumentConverterTool: React.FC<DocumentConverterToolProps> = ({ tool, onSelectNextTool }) => {
  const isPdfToWord = tool.id === 'pdf-to-word';
  const isWordToPdf = tool.id === 'word-to-pdf';
  const isDocxToTxt = tool.id === 'docx-to-txt';
  const isDocxToHtml = tool.id === 'docx-to-html';
  const isTxtToPdf = tool.id === 'txt-to-pdf';
  const isMarkdownToPdf = tool.id === 'markdown-to-pdf';

  const [files, setFiles] = useState<File[]>([]);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (!staged) return;

    const ext = '.' + staged.name.split('.').pop()?.toLowerCase();
    const isAccepted = tool.acceptedFormats.some(
      (f) => f.toLowerCase() === ext || staged.type.toLowerCase().includes(f.replace('.', '').toLowerCase())
    );

    if (isAccepted) {
      clearStagedFileForTool();
      setFiles([staged]);
    }
  }, [tool.id]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [result, setResult] = useState<{
    blob?: Blob;
    text?: string;
    html?: string;
    filename: string;
    preview?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    setProgress(20);
    setErrorMsg(null);
    setResult(null);

    try {
      if (isPdfToWord) {
        if (files.length === 0) throw new Error('Please select a PDF document.');
        setStatusText('Reading PDF streams and parsing text layout...');
        setProgress(40);
        const buffer = await files[0].arrayBuffer();
        setStatusText('Constructing genuine Microsoft Word OpenXML (.docx) paragraphs...');
        setProgress(75);
        const { blob, text } = await pdfToDocx(buffer);
        setProgress(100);
        const baseName = files[0].name.replace(/\.pdf$/i, '');
        setResult({
          blob,
          text,
          filename: `${baseName}.docx`,
          preview: text.substring(0, 1000),
        });
      } else if (isWordToPdf) {
        if (files.length === 0) throw new Error('Please select a Word (.docx) document.');
        setStatusText('Extracting structured text from Word OpenXML...');
        setProgress(40);
        const { text } = await docxToHtml(files[0]);
        setStatusText('Compiling PDF vector pages with balanced typography...');
        setProgress(70);
        const baseName = files[0].name.replace(/\.docx$/i, '');
        const pdfBlob = await textToPdf(text, { title: baseName });
        setProgress(100);
        setResult({
          blob: pdfBlob,
          text,
          filename: `${baseName}.pdf`,
          preview: text.substring(0, 1000),
        });
      } else if (isDocxToTxt) {
        if (files.length === 0) throw new Error('Please select a Word (.docx) document.');
        setStatusText('Extracting plain text...');
        setProgress(50);
        const txt = await docxToTxt(files[0]);
        setProgress(100);
        const baseName = files[0].name.replace(/\.docx$/i, '');
        setResult({
          text: txt,
          blob: new Blob([txt], { type: 'text/plain;charset=utf-8' }),
          filename: `${baseName}.txt`,
          preview: txt,
        });
      } else if (isDocxToHtml) {
        if (files.length === 0) throw new Error('Please select a Word (.docx) document.');
        setStatusText('Converting document to semantic HTML markup...');
        setProgress(50);
        const { html, text } = await docxToHtml(files[0]);
        setProgress(100);
        const baseName = files[0].name.replace(/\.docx$/i, '');
        setResult({
          html,
          text,
          blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
          filename: `${baseName}.html`,
          preview: html,
        });
      } else if (isTxtToPdf || isMarkdownToPdf) {
        const textToConvert = files.length > 0 ? await files[0].text() : inputText;
        if (!textToConvert.trim()) throw new Error('Please provide text or upload a document.');
        setStatusText('Generating PDF layout and formatting typography...');
        setProgress(60);
        const title = files.length > 0 ? files[0].name.replace(/\.[^/.]+$/, '') : 'Document';
        const pdfBlob = await textToPdf(textToConvert, { title });
        setProgress(100);
        setResult({
          blob: pdfBlob,
          text: textToConvert,
          filename: `${title}.pdf`,
          preview: textToConvert.substring(0, 1000),
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !result.blob) return;
    triggerDownload(result.blob, result.filename);
  };

  const handleCopyText = () => {
    if (!result?.text && !result?.html) return;
    navigator.clipboard.writeText(result.text || result.html || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFiles([]);
    setInputText('');
    setResult(null);
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

      {/* 4-Step Process Bar */}
      <WorkflowStepsIndicator
        currentStep={result ? 'result' : isProcessing ? 'process' : files.length > 0 || inputText ? 'process' : 'upload'}
        hasSettings={false}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {!result ? (
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

            {(isTxtToPdf || isMarkdownToPdf) && files.length === 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Or paste text directly:
                </span>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your text or Markdown content here..."
                  rows={6}
                  className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>
            )}

            {(files.length > 0 || ((isTxtToPdf || isMarkdownToPdf) && inputText.trim())) && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-md hover:shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Converting Document...</span>
                    </>
                  ) : (
                    <>
                      <span>Convert Document</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Result View */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Conversion Complete!
              </h2>
              <p className="text-xs text-slate-500">
                Generated genuine {result.filename.endsWith('.docx') ? 'Microsoft Word (.docx)' : result.filename.endsWith('.pdf') ? 'Adobe PDF (.pdf)' : 'document'} file.
              </p>
            </div>

            {/* Document Preview Box */}
            {result.preview && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Converted Content Preview ({result.filename})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="p-4 max-h-60 overflow-y-auto text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {result.preview}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {result.blob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-md hover:shadow-xl hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {result.filename}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-3.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Convert Another File</span>
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

      <AdPlaceholder format="tool-bottom" />

      {/* Instructions & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Document Accuracy & Formatting Rules
          </h2>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              PottoTools creates <strong>genuine Microsoft Word OpenXML (.docx)</strong> files structured into native heading and body elements, ensuring full compatibility with Microsoft Office 365, Word 2016+, LibreOffice, and Google Docs.
            </p>
            <p>
              For image-only scans or photographed forms, please use our <strong>OCR PDF tool</strong> which extracts text via computer vision models.
            </p>
          </div>
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
