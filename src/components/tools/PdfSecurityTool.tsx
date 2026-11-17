import React, { useState, useRef, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  signPdf,
  inspectPdfMetadata,
  removePdfMetadata,
  getPdfPageCount,
} from '../../services/pdf/pdfLibService';
import { triggerDownload } from '../../services/utils/downloadUtils';
import { trackToolCompleted } from '../../services/analytics/ga4Tracker';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';
import { SITE_CONFIG } from '../../config/site';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  PenTool,
  Lock,
  FileSearch,
  Eraser,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface PdfSecurityToolProps {
  tool: ToolDefinition;
}

export const PdfSecurityTool: React.FC<PdfSecurityToolProps> = ({ tool }) => {
  const isSign = tool.id === 'sign-pdf';
  const isMetadata = tool.id === 'pdf-metadata';
  const isProtect = tool.id === 'protect-pdf';

  const [files, setFiles] = useState<File[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [targetPage, setTargetPage] = useState<number>(1);

  // Signing canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string | null>(null);
  const [hasAuthorizedSignature, setHasAuthorizedSignature] = useState(false);

  const renderSignaturePermissionNotice = () => {
    const supportEmail = SITE_CONFIG.supportEmail;

    const handleNavigateContact = (e: React.MouseEvent) => {
      e.preventDefault();
      window.history.pushState({}, '', '/contact');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-950 dark:text-amber-200 space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100 text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Signature Permission Required</span>
        </div>
        <p className="leading-relaxed text-slate-700 dark:text-slate-300">
          Please ensure that you have permission to use the signature you are adding to this document. If you need authorization to use a signature or have questions regarding signature permissions, please contact us using the email address provided on our{' '}
          <a
            href="/contact"
            onClick={handleNavigateContact}
            className="font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-700"
          >
            Contact Us
          </a>{' '}
          page
          {supportEmail ? (
            <>
              {' '}(or email directly at{' '}
              <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent('[PottoTools] Signature Permission Inquiry')}`}
                className="font-mono font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-700"
              >
                {supportEmail}
              </a>
              )
            </>
          ) : null}
          .
        </p>
        <div className="flex items-center gap-2 pt-1.5 border-t border-amber-200/70 dark:border-amber-900/60 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            Mandatory Watermark: Every page of signed PDFs automatically includes a subtle PottoTools full-page logo watermark.
          </span>
        </div>
      </div>
    );
  };

  // Nav helper for protect-pdf guidance
  const navigateToRedactor = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', '/pdf-id-redactor');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Metadata inspector
  const [metadata, setMetadata] = useState<{
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    pageCount: number;
  } | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<{ blob: Blob | Uint8Array; filename: string } | null>(null);

  const handleFilesSelected = async (selected: File[]) => {
    setFiles(selected);
    setErrorMsg(null);
    setOutputBlob(null);

    if (selected.length > 0) {
      try {
        const buffer = await selected[0].arrayBuffer();
        const pages = await getPdfPageCount(buffer);
        setTotalPages(pages);

        if (isMetadata) {
          const meta = await inspectPdfMetadata(buffer);
          setMetadata(meta);
          trackToolCompleted('metadata-inspect', meta.pageCount, 'pdf-metadata');
        }
      } catch {
        // Proceed gracefully
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

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1E3A8A'; // Blue/Navy pen color
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setUploadedSigUrl(null);
  };

  const handleSigImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = reader.result as string;
        if (rawDataUrl.startsWith('data:image/png')) {
          setUploadedSigUrl(rawDataUrl);
          setHasSignature(true);
          return;
        }
        // Convert JPEG/WebP uploads to PNG data URL because pdfLibService embeds PNG bytes
        const img = new Image();
        img.onload = () => {
          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = img.width;
          tmpCanvas.height = img.height;
          const ctx = tmpCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setUploadedSigUrl(tmpCanvas.toDataURL('image/png'));
          } else {
            setUploadedSigUrl(rawDataUrl);
          }
          setHasSignature(true);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(20);
    setErrorMsg(null);
    setOutputBlob(null);

    try {
      const buffer = await files[0].arrayBuffer();

      if (isSign) {
        if (!hasSignature && !uploadedSigUrl) {
          throw new Error('Please draw or upload your signature before proceeding.');
        }

        if (!hasAuthorizedSignature) {
          throw new Error(
            'Signature Permission Required: Please confirm that you have permission to use this signature by checking the authorization box.'
          );
        }

        setStatusText('Applying signature & embedding mandatory full-page logo watermark across all pages...');
        setProgress(50);

        let sigBase64 = uploadedSigUrl;
        if (!sigBase64 && canvasRef.current) {
          sigBase64 = canvasRef.current.toDataURL('image/png');
        }

        if (!sigBase64) throw new Error('Signature data not available.');

        const signedBytes = await signPdf(
          buffer,
          sigBase64,
          targetPage - 1,
          50, // x
          50, // y
          180, // width
          60 // height
        );

        setProgress(100);
        const base = files[0].name.replace(/\.pdf$/i, '');
        setOutputBlob({ blob: signedBytes, filename: `${base}-signed.pdf` });
      } else if (isMetadata) {
        setStatusText('Sanitizing and removing metadata...');
        setProgress(60);
        const cleanBytes = await removePdfMetadata(buffer);
        setProgress(100);
        const base = files[0].name.replace(/\.pdf$/i, '');
        setOutputBlob({ blob: cleanBytes, filename: `${base}-sanitized.pdf` });
      } else if (isProtect) {
        setStatusText('Sanitizing hidden metadata & rebuilding clean PDF object streams...');
        setProgress(60);
        const cleanBytes = await removePdfMetadata(buffer);
        setProgress(100);
        const base = files[0].name.replace(/\.pdf$/i, '');
        setOutputBlob({ blob: cleanBytes, filename: `${base}-sanitized.pdf` });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
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
    setMetadata(null);
    clearCanvas();
    setHasAuthorizedSignature(false);
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
        {!outputBlob ? (
          <>
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={false}
              files={files}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={() => setFiles([])}
              disabled={isProcessing}
            />

            {files.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Sign PDF Controls */}
                {isSign && (
                  <div className="space-y-4">
                    {/* Permission Notice Before Applying Signature */}
                    {renderSignaturePermissionNotice()}

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Draw or Upload Signature
                      </label>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-xs text-red-600 hover:underline flex items-center gap-1"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Clear pad</span>
                      </button>
                    </div>

                    {!uploadedSigUrl ? (
                      <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950 p-2 text-center">
                        <canvas
                          ref={canvasRef}
                          width={480}
                          height={160}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full max-w-md mx-auto h-40 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg cursor-crosshair touch-none"
                        />
                        <div className="text-[11px] text-slate-400 mt-2">
                          Use your mouse, trackpad, or finger to sign above
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                        <img
                          src={uploadedSigUrl}
                          alt="Uploaded signature"
                          className="max-h-24 mx-auto object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedSigUrl(null)}
                          className="text-xs text-red-600 hover:underline mt-2 inline-block"
                        >
                          Remove and draw instead
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span>Or upload signature image:</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleSigImageUpload}
                          className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span>Stamp on page:</span>
                        <select
                          value={targetPage}
                          onChange={(e) => setTargetPage(parseInt(e.target.value))}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                        >
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Page {i + 1} of {totalPages}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Inspector View */}
                {isMetadata && metadata && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Discovered Document Metadata
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Title:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {metadata.title || '(Not specified)'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Author:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {metadata.author || '(Not specified)'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Creator Application:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {metadata.creator || '(Not specified)'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">PDF Producer:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {metadata.producer || '(Not specified)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Honest capability notice for Protect / Privacy Sanitizer */}
                {isProtect && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Client-Side PDF Sanitization Notice (No Open-Password Encryption Yet)</span>
                    </div>
                    <p className="leading-relaxed">
                      Our 100% browser-side PDF library (pdf-lib) currently rebuilds clean object streams and strips hidden author, producer, and creation metadata, but does <strong>not</strong> apply standard cryptographic open-password locking yet. Do not rely on this file for open-password access control.
                    </p>
                    <p className="leading-relaxed">
                      Need to permanently hide Aadhaar numbers, bank accounts, or sensitive salary figures before sharing?{' '}
                      <a
                        href="/pdf-id-redactor"
                        onClick={navigateToRedactor}
                        className="font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-700"
                      >
                        Open Offline PDF &amp; ID Redactor &rarr;
                      </a>
                    </p>
                  </div>
                )}

                {isProcessing && (
                  <ProgressBar progress={progress} statusText={statusText} />
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Signature Authorization Confirmation Checkbox */}
                {isSign && (
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasAuthorizedSignature}
                      onChange={(e) => setHasAuthorizedSignature(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Signature Authorization Confirmation (Required)
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 mt-0.5 block leading-relaxed">
                        I confirm that I have permission and legal authorization to use the signature being added to this document. I acknowledge that PottoTools does not verify rights or grant legal authority, and that a subtle PottoTools logo watermark is automatically embedded across all pages.
                      </span>
                    </div>
                  </label>
                )}

                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Document...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isSign
                          ? 'Sign & Embed on PDF'
                          : isMetadata
                          ? 'Wipe & Sanitize Metadata'
                          : 'Sanitize & Rebuild Clean PDF'}
                      </span>
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
                PDF Successfully Processed!
              </h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                {isSign
                  ? 'Your signature has been embedded cleanly and the mandatory full-page PottoTools logo watermark has been applied across every page.'
                  : isMetadata
                  ? 'All hidden metadata and tracking tags have been purged.'
                  : 'Hidden author, producer, and creator metadata tags have been stripped and the PDF stream has been rebuilt cleanly.'}
              </p>
            </div>

            {/* Signature Permission Notice Repeated Near Download Button */}
            {isSign && (
              <div className="max-w-xl mx-auto text-left">
                {renderSignaturePermissionNotice()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Saved PDF</span>
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
            Security & Legal Notice
          </h2>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              A drawn or stamped electronic signature creates a visual sign-off on contracts and agreements. It is legally valid under many jurisdictions (e.g. US ESIGN Act, EU eIDAS Simple Electronic Signature).
            </p>
            <p>
              All processing happens in your browser RAM without leaving your computer.
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
