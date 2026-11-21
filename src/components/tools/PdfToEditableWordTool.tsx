import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  convertPdfToEditableDocx,
  PdfToDocxResult,
} from '../../services/office/pdfToEditableDocxService';
import { triggerDownload, formatBytes } from '../../services/utils/downloadUtils';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  Sparkles,
  Image as ImageIcon,
  ScanText,
  Layers,
  Table as TableIcon,
  Check,
  Eye,
  Info,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { triggerToast } from '../common/Toast';
import { RecommendedNextTools } from './RecommendedNextTools';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface PdfToEditableWordToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const PdfToEditableWordTool: React.FC<PdfToEditableWordToolProps> = ({
  tool,
  onSelectNextTool,
}) => {
  const [file, setFile] = useState<File | null>(null);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && (staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf'))) {
      clearStagedFileForTool();
      setFile(staged);
    }
  }, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Conversion options
  const [preserveImages, setPreserveImages] = useState(true);
  const [enableOcr, setEnableOcr] = useState(true);
  const [ocrLanguage, setOcrLanguage] = useState<'eng' | 'hin' | 'hin+eng'>('hin+eng');

  // Conversion result
  const [result, setResult] = useState<{
    docxBlob: Blob;
    filename: string;
    stats: PdfToDocxResult;
  } | null>(null);

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setErrorMsg(null);
      setResult(null);
    }
  };

  const handleStartConversion = async () => {
    if (!file) {
      setErrorMsg('Please upload a PDF file to convert.');
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setStatusText('Reading PDF file in browser memory...');
    setErrorMsg(null);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();

      const conversionResult = await convertPdfToEditableDocx(buffer, {
        preserveImages,
        enableOcr,
        ocrLanguage,
        onProgress: (pct, msg) => {
          setProgress(pct);
          setStatusText(msg);
        },
      });

      const baseName = file.name.replace(/\.pdf$/i, '');
      const docxName = `${baseName}-editable.docx`;

      setResult({
        docxBlob: conversionResult.blob,
        filename: docxName,
        stats: conversionResult,
      });

      triggerToast('success', 'PDF converted to editable Word (.docx) successfully!');
    } catch (err: any) {
      console.error('PDF to Editable Word error:', err);
      setErrorMsg(err.message || 'Failed to convert PDF. Please ensure the file is a valid PDF document.');
      triggerToast('error', 'Conversion failed. Please check error message.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    triggerDownload(result.docxBlob, result.filename);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
    setStatusText('');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Tool Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Editable Text + Preserved Design
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {tool.title}
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
            Convert menus, invoices, resumes, reports, and scanned PDFs into 100% editable Microsoft Word (.docx) documents.
            Preserves headings, multi-column alignments, dish names, prices, food photos, logos, and tables.
          </p>

          {/* Key Value Badges */}
          <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-blue-200">
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              <Check className="w-3.5 h-3.5 text-emerald-300" /> 100% Editable Word Text
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              <TableIcon className="w-3.5 h-3.5 text-amber-300" /> Menu & Price Alignments
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              <ImageIcon className="w-3.5 h-3.5 text-purple-300" /> Embedded Photos & Logos
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              <ScanText className="w-3.5 h-3.5 text-sky-300" /> OCR for Scanned Pages
            </span>
          </div>
        </div>
      </div>

      {/* Main Working Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {!file && !result ? (
          <div>
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={false}
              files={file ? [file] : []}
              onFilesSelected={handleFileSelected}
              onRemoveFile={handleReset}
              disabled={isProcessing}
            />
          </div>
        ) : null}

        {file && !result && (
          <div className="space-y-6">
            {/* Selected File Card */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(file.size)} • Ready for editable Word conversion
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Change File
                </button>
              )}
            </div>

            {/* Customization Options */}
            {!isProcessing && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Conversion Options & Design Preservation
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Images */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:border-blue-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={preserveImages}
                      onChange={(e) => setPreserveImages(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        Preserve Photos, Graphics & Logos
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Extracts food pictures, banners, and logos at high resolution and embeds them in the Word file.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: OCR Fallback */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:border-blue-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={enableOcr}
                      onChange={(e) => setEnableOcr(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        Auto OCR for Scanned Pages
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">
                        If any page is a photo or scan, converts scanned text into editable text runs.
                      </span>
                    </div>
                  </label>
                </div>

                {/* OCR Language Selector if OCR enabled */}
                {enableOcr && (
                  <div className="flex items-center gap-3 pt-2 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      OCR Language Model:
                    </span>
                    <select
                      value={ocrLanguage}
                      onChange={(e) => setOcrLanguage(e.target.value as 'eng' | 'hin' | 'hin+eng')}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hin+eng">Hindi + English (with Kruti Dev Auto-Mapping)</option>
                      <option value="eng">English (Latin)</option>
                      <option value="hin">Hindi Only (Devanagari)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-4 py-4">
                <ProgressBar progress={progress} statusText={statusText} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                  <div className={`p-2.5 rounded-xl border ${progress >= 10 ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'border-slate-200 text-slate-400'}`}>
                    1. PDF Stream
                  </div>
                  <div className={`p-2.5 rounded-xl border ${progress >= 30 ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'border-slate-200 text-slate-400'}`}>
                    2. Layout Analysis
                  </div>
                  <div className={`p-2.5 rounded-xl border ${progress >= 60 ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'border-slate-200 text-slate-400'}`}>
                    3. Extract Images
                  </div>
                  <div className={`p-2.5 rounded-xl border ${progress >= 85 ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'border-slate-200 text-slate-400'}`}>
                    4. Pack DOCX
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Conversion Error</p>
                  <p className="text-xs">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Convert Button */}
            {!isProcessing && (
              <button
                type="button"
                onClick={handleStartConversion}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                Convert to Editable Word (.docx)
              </button>
            )}
          </div>
        )}

        {/* Conversion Completed Screen */}
        {result && (
          <div className="space-y-6">
            <div className="text-center space-y-2 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Document Successfully Reconstructed!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your PDF is now converted into a fully editable Word (.docx) document with preserved headings, menus, prices, and photos.
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                <Layers className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.stats.pageCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pages Converted</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                <FileText className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.stats.textBlockCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Editable Text Runs</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                <ImageIcon className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.stats.imageCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Photos & Logos</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                <TableIcon className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.stats.tableCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Menu / Price Tables</p>
              </div>
            </div>

            {result.stats.ocrPagesCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <ScanText className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  OCR detected and extracted text on {result.stats.ocrPagesCount} scanned page(s). All text is fully editable in Word.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
              >
                <Download className="w-5 h-5" />
                Download Editable Word (.docx)
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-4 px-6 rounded-2xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Convert Another PDF
              </button>
            </div>

            {/* Text Preview Snippet */}
            {result.stats.summaryText && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5" />
                  Extracted Document Content Sample
                </div>
                <div className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line line-clamp-6 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {result.stats.summaryText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommended Next Tools */}
      {onSelectNextTool && (
        <RecommendedNextTools
          currentToolId={tool.id}
          onSelectTool={onSelectNextTool}
        />
      )}

      {/* Informational & Security Section */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/60 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Guaranteed In-Browser Privacy & Document Integrity
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          PottoTools converts your PDF to Word completely inside your browser using hardware WebAssembly and local JavaScript.
          Your private documents, restaurant recipes, client invoices, or confidential resumes are never sent across the internet, never uploaded to a cloud server, and never stored.
        </p>

        {/* Detailed Comparison Table */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Why Choose "PDF to Editable Word"?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">Standard Converters</span>
              <p className="text-slate-500">Strips columns, jumbles prices, drops embedded photos, or fails completely on scans.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">Image-Only Tools</span>
              <p className="text-slate-500">Converts each page to a static un-editable picture inside Word where you cannot edit words.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1">
              <span className="font-bold text-blue-700 dark:text-blue-300 block">PottoTools Editable Word</span>
              <p className="text-blue-600 dark:text-blue-400">Reconstructs headings, menu prices, food photos, and runs OCR for 100% genuine editable text.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
