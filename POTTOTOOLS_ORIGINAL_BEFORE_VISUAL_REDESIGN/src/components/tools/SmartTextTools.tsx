import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { extractTextFromPdf } from '../../services/pdf/pdfjsService';
import { triggerDownload } from '../../services/utils/downloadUtils';
import { trackToolCompleted } from '../../services/analytics/ga4Tracker';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Sparkles,
  GitCompare,
  Wand2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface SmartTextToolsProps {
  tool: ToolDefinition;
}

export const SmartTextTools: React.FC<SmartTextToolsProps> = ({ tool }) => {
  const isExtractor = tool.id === 'pdf-text-extractor';
  const isDiff = tool.id === 'text-diff-comparator';
  const isCleaner = tool.id === 'text-cleaner';

  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);

  // Cleaner state
  const [cleanerInput, setCleanerInput] = useState('');
  const [cleanerOutput, setCleanerOutput] = useState('');

  // Diff state
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [diffResults, setDiffResults] = useState<{ type: 'same' | 'added' | 'removed'; line: string }[] | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Statistics
  const activeText = isExtractor ? extractedText : isCleaner ? (cleanerOutput || cleanerInput) : (textA + ' ' + textB);
  const words = activeText.trim() ? activeText.trim().split(/\s+/).length : 0;
  const chars = activeText.length;
  const lines = activeText ? activeText.split('\n').length : 0;
  const readingTimeMinutes = Math.ceil(words / 200);

  const handleExtractFromPdf = async (selected: File[]) => {
    setFiles(selected);
    if (selected.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setStatusText('Extracting readable text streams from PDF...');
    setErrorMsg(null);

    try {
      const buffer = await selected[0].arrayBuffer();
      setProgress(70);
      const res = await extractTextFromPdf(buffer);
      setProgress(100);
      setExtractedText(res.text);
      trackToolCompleted('pdf-text-extract', new Blob([res.text]).size, 'pdf-text-extractor');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract text from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (!staged) return;

    if (isExtractor && (staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf'))) {
      clearStagedFileForTool();
      handleExtractFromPdf([staged]);
    } else if (isCleaner || isDiff) {
      const isText = staged.type === 'text/plain' || /\.(txt|md|text)$/i.test(staged.name);
      if (isText) {
        clearStagedFileForTool();
        staged.text().then((txt) => {
          if (isCleaner) setCleanerInput(txt);
          if (isDiff) setTextA(txt);
        }).catch(() => {});
      }
    }
  }, [tool.id]);

  const handleCleanText = (action: 'spaces' | 'blank-lines' | 'uppercase' | 'lowercase' | 'titlecase') => {
    let result = cleanerInput;

    if (action === 'spaces') {
      result = result.replace(/[ \t]+/g, ' ').trim();
    } else if (action === 'blank-lines') {
      result = result.replace(/\n\s*\n/g, '\n').trim();
    } else if (action === 'uppercase') {
      result = result.toUpperCase();
    } else if (action === 'lowercase') {
      result = result.toLowerCase();
    } else if (action === 'titlecase') {
      result = result.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }

    setCleanerOutput(result);
    trackToolCompleted('text-clean', new Blob([result]).size, 'text-cleaner');
  };

  const handleRunDiff = () => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const diff: { type: 'same' | 'added' | 'removed'; line: string }[] = [];

    const max = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < max; i++) {
      const a = linesA[i];
      const b = linesB[i];

      if (a === b) {
        if (a !== undefined) diff.push({ type: 'same', line: a });
      } else {
        if (a !== undefined) diff.push({ type: 'removed', line: `- ${a}` });
        if (b !== undefined) diff.push({ type: 'added', line: `+ ${b}` });
      }
    }

    setDiffResults(diff);
    trackToolCompleted('text-diff', diff.length, 'text-diff-comparator');
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Real-time Document Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Words</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
            {words}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Characters</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
            {chars}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Lines</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
            {lines}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Est. Read Time</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
            ~{readingTimeMinutes} min
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Tool 1: PDF Text Extractor */}
        {isExtractor && (
          <div className="space-y-4">
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={false}
              files={files}
              onFilesSelected={handleExtractFromPdf}
              onRemoveFile={() => {
                setFiles([]);
                setExtractedText('');
              }}
              disabled={isProcessing}
            />

            {isProcessing && (
              <ProgressBar progress={progress} statusText={statusText} />
            )}

            {extractedText && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Extracted Text
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(extractedText)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
                        triggerDownload(blob, `${files[0]?.name || 'extracted'}.txt`);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .TXT</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  rows={14}
                  value={extractedText}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Tool 2: Text Cleaner */}
        {isCleaner && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Original Text Input
                </label>
                <textarea
                  rows={10}
                  value={cleanerInput}
                  onChange={(e) => setCleanerInput(e.target.value)}
                  placeholder="Paste messy text with extra spaces, awkward line breaks, or wrong case here..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    Cleaned Output
                  </label>
                  {cleanerOutput && (
                    <button
                      type="button"
                      onClick={() => handleCopy(cleanerOutput)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <textarea
                  readOnly
                  rows={10}
                  value={cleanerOutput}
                  placeholder="Cleaned output will appear here after clicking an action below..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCleanText('spaces')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
              >
                Remove Extra Spaces
              </button>
              <button
                type="button"
                onClick={() => handleCleanText('blank-lines')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
              >
                Remove Empty Blank Lines
              </button>
              <button
                type="button"
                onClick={() => handleCleanText('titlecase')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
              >
                Title Case
              </button>
              <button
                type="button"
                onClick={() => handleCleanText('uppercase')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
              >
                UPPERCASE
              </button>
              <button
                type="button"
                onClick={() => handleCleanText('lowercase')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
              >
                lowercase
              </button>
            </div>
          </div>
        )}

        {/* Tool 3: Document Text Diff Comparator */}
        {isDiff && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Original Document (Text A)
                </label>
                <textarea
                  rows={8}
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                  placeholder="Paste original version of document or contract here..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Revised Document (Text B)
                </label>
                <textarea
                  rows={8}
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  placeholder="Paste revised version of document here..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunDiff}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Revisions Side-by-Side</span>
            </button>

            {/* Diff highlights view */}
            {diffResults && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Line-by-Line Comparison Diff
                </div>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-80 space-y-0.5">
                  {diffResults.map((item, idx) => (
                    <div
                      key={idx}
                      className={`px-2 py-0.5 rounded ${
                        item.type === 'added'
                          ? 'bg-emerald-950 text-emerald-300 font-semibold'
                          : item.type === 'removed'
                          ? 'bg-rose-950 text-rose-300 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.line || ' '}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AdPlaceholder format="tool-bottom" />

      {/* FAQs */}
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
  );
};
