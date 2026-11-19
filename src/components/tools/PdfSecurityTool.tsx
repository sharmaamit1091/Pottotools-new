import React, { useState, useRef, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { RecommendedNextTools } from './RecommendedNextTools';
import {
  signPdf,
  inspectPdfMetadata,
  removePdfMetadata,
  getPdfPageCount,
} from '../../services/pdf/pdfLibService';
import {
  inspectPdfEncryption,
  protectPdfWithPassword,
  unlockPdfWithPassword,
  PdfEncryptionInfo,
  ProtectPdfPermissions,
} from '../../services/pdf/pdfCryptoService';
import { triggerDownload } from '../../services/utils/downloadUtils';
import { trackToolCompleted } from '../../services/analytics/ga4Tracker';
import { triggerToast } from '../common/Toast';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';
import { SITE_CONFIG } from '../../config/site';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Eraser,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

interface PdfSecurityToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

function evaluatePasswordStrength(pw: string): {
  label: string;
  score: number;
  barClass: string;
  textClass: string;
} {
  if (!pw) {
    return { label: '', score: 0, barClass: 'bg-slate-200', textClass: 'text-slate-400' };
  }
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 1) {
    return { label: 'Weak', score: 1, barClass: 'bg-rose-500', textClass: 'text-rose-600 dark:text-rose-400' };
  }
  if (score === 2) {
    return { label: 'Fair', score: 2, barClass: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400' };
  }
  if (score === 3 || score === 4) {
    return { label: 'Strong', score: 3, barClass: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400' };
  }
  return { label: 'Very Strong', score: 4, barClass: 'bg-blue-600', textClass: 'text-blue-600 dark:text-blue-400' };
}

export const PdfSecurityTool: React.FC<PdfSecurityToolProps> = ({ tool, onSelectNextTool }) => {
  const isSign = tool.id === 'sign-pdf';
  const isMetadata = tool.id === 'pdf-metadata';
  const isProtect = tool.id === 'protect-pdf';
  const isUnlock = tool.id === 'unlock-pdf';

  const [files, setFiles] = useState<File[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [targetPage, setTargetPage] = useState<number>(1);

  // Real PDF encryption inspection state (for protect-pdf & unlock-pdf)
  const [isInspectingCrypto, setIsInspectingCrypto] = useState(false);
  const [encryptionInfo, setEncryptionInfo] = useState<PdfEncryptionInfo | null>(null);

  // Protect PDF state
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [existingPasswordForProtect, setExistingPasswordForProtect] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [keyBits, setKeyBits] = useState<128 | 256>(256);
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState<ProtectPdfPermissions['allowPrinting']>('full');
  const [allowCopying, setAllowCopying] = useState<boolean>(true);
  const [allowModifying, setAllowModifying] = useState<ProtectPdfPermissions['allowModifying']>('all');

  // Unlock PDF state
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);

  // Result metadata badge
  const [resultSummary, setResultSummary] = useState<string>('');
  const [resultBadge, setResultBadge] = useState<string>('');

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

  // Reset fields cleanly when switching between protect-pdf / unlock-pdf / sign-pdf / pdf-metadata
  useEffect(() => {
    setFiles([]);
    setOutputBlob(null);
    setMetadata(null);
    setEncryptionInfo(null);
    setErrorMsg(null);
    setProgress(0);
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setExistingPasswordForProtect('');
    setUnlockPassword('');
    setResultSummary('');
    setResultBadge('');
    setAllowPrinting('full');
    setAllowCopying(true);
    setAllowModifying('all');
    setShowAdvancedPerms(false);
  }, [tool.id]);

  const handleFilesSelected = async (selected: File[]) => {
    setFiles(selected);
    setErrorMsg(null);
    setOutputBlob(null);
    setEncryptionInfo(null);
    setUnlockPassword('');
    setExistingPasswordForProtect('');

    if (selected.length > 0) {
      const file = selected[0];
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setErrorMsg('Please select a valid PDF (.pdf) file.');
        return;
      }

      try {
        const buffer = await file.arrayBuffer();

        if (isProtect || isUnlock) {
          setIsInspectingCrypto(true);
          try {
            const info = await inspectPdfEncryption(buffer);
            setEncryptionInfo(info);
            if (info.pageCount) {
              setTotalPages(info.pageCount);
            }
          } catch (inspectErr: any) {
            console.warn('PDF encryption inspection warning:', inspectErr);
            setErrorMsg('Unable to inspect this PDF. It may be corrupted or an unsupported file format.');
          } finally {
            setIsInspectingCrypto(false);
          }
          return;
        }

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
    ctx.strokeStyle = '#1E3A8A';
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
    setProgress(15);
    setErrorMsg(null);
    setOutputBlob(null);
    setResultSummary('');
    setResultBadge('');

    try {
      const buffer = await files[0].arrayBuffer();
      const base = files[0].name.replace(/\.pdf$/i, '');

      if (isProtect) {
        const hasRestrictions =
          allowPrinting !== 'full' || !allowCopying || allowModifying !== 'all';

        if (!userPassword && !ownerPassword && !hasRestrictions) {
          throw new Error('Please enter a password to lock this PDF (or enable permissions restrictions).');
        }

        if (userPassword && userPassword !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter the exact same password in both fields.');
        }

        if (encryptionInfo?.requiresUserPassword && !existingPasswordForProtect) {
          throw new Error('This PDF is already password-protected. Enter its current password below first.');
        }

        setStatusText(`Encrypting PDF with real ${keyBits}-bit AES cryptographic protection...`);
        setProgress(55);

        const result = await protectPdfWithPassword(buffer, {
          userPassword,
          ownerPassword: ownerPassword.trim() || undefined,
          keyBits,
          existingPassword: existingPasswordForProtect || undefined,
          permissions: {
            allowPrinting,
            allowCopying,
            allowModifying,
          },
        });

        setProgress(100);
        setStatusText('Cryptographic verification passed!');
        setResultBadge(
          result.hasOpenPassword
            ? `Verified Locked • ${result.encryptionLabel}`
            : `Verified Restricted • ${result.encryptionLabel}`
        );
        setResultSummary(
          result.hasOpenPassword
            ? `Your PDF is genuinely encrypted with ${result.encryptionLabel}. Anyone opening this file in Chrome, Edge, Adobe Acrobat, or Preview will be prompted for the password${
                result.hasOwnerRestrictions ? ', and your selected print/copy/edit restrictions are enforced' : ''
              }.`
            : `Owner-level ${result.encryptionLabel} restrictions have been applied to this PDF.`
        );
        setOutputBlob({
          blob: new Blob([result.data.slice()], { type: 'application/pdf' }),
          filename: `${base}-protected.pdf`,
        });
        trackToolCompleted('protect-pdf', totalPages || 1, 'protect-pdf');
        triggerToast('success', `PDF encrypted with ${result.encryptionLabel}!`);
      } else if (isUnlock) {
        if (encryptionInfo?.requiresUserPassword && !unlockPassword) {
          throw new Error('Please enter the PDF password to unlock this document.');
        }

        setStatusText('Decrypting PDF streams losslessly in your browser...');
        setProgress(55);

        const result = await unlockPdfWithPassword(buffer, unlockPassword);

        setProgress(100);
        setStatusText('Decryption verified — password protection removed!');
        setResultBadge(
          result.wasEncrypted
            ? `Verified Unlocked • Lossless Vector PDF${result.pageCount ? ` (${result.pageCount} Pages)` : ''}`
            : 'Already Unencrypted • Clean Copy Ready'
        );
        setResultSummary(
          result.removedRestrictionsOnly
            ? 'All owner restrictions (printing, copying, and editing locks) have been permanently removed while preserving 100% original text and layout.'
            : result.wasEncrypted
            ? 'Password protection has been permanently removed. The unlocked PDF opens without a password and preserves 100% original vector text, fonts, hyperlinks, and quality.'
            : 'This PDF was already unlocked without encryption. A clean copy is ready to download.'
        );
        setOutputBlob({
          blob: new Blob([result.data.slice()], { type: 'application/pdf' }),
          filename: `${base}-unlocked.pdf`,
        });
        trackToolCompleted('unlock-pdf', result.pageCount || 1, 'unlock-pdf');
        triggerToast('success', 'PDF unlocked successfully!');
      } else if (isSign) {
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
          50,
          50,
          180,
          60
        );

        setProgress(100);
        setOutputBlob({ blob: signedBytes, filename: `${base}-signed.pdf` });
      } else if (isMetadata) {
        setStatusText('Sanitizing and removing metadata...');
        setProgress(60);
        const cleanBytes = await removePdfMetadata(buffer);
        setProgress(100);
        setOutputBlob({ blob: cleanBytes, filename: `${base}-sanitized.pdf` });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An error occurred while processing the PDF.');
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
    setEncryptionInfo(null);
    clearCanvas();
    setHasAuthorizedSignature(false);
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setExistingPasswordForProtect('');
    setUnlockPassword('');
    setResultSummary('');
    setResultBadge('');
    setProgress(0);
    setErrorMsg(null);
  };

  const strength = evaluatePasswordStrength(userPassword);
  const passwordsMismatch =
    isProtect && confirmPassword.length > 0 && userPassword !== confirmPassword;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-xs font-bold text-blue-700 dark:text-blue-300 mb-3">
          {isProtect ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Real AES-256 / AES-128 In-Browser Encryption</span>
            </>
          ) : isUnlock ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>Real Lossless In-Browser PDF Decryption</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side PDF Security</span>
            </>
          )}
        </div>
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
              onRemoveFile={() => {
                setFiles([]);
                setEncryptionInfo(null);
                setErrorMsg(null);
              }}
              disabled={isProcessing}
            />

            {files.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Inspecting banner for crypto tools */}
                {(isProtect || isUnlock) && isInspectingCrypto && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    <span>Inspecting PDF encryption headers locally in your browser...</span>
                  </div>
                )}

                {/* PROTECT PDF CONTROLS */}
                {isProtect && !isInspectingCrypto && (
                  <div className="space-y-5">
                    {/* Encryption status of uploaded file */}
                    {encryptionInfo && (
                      <div
                        className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs ${
                          encryptionInfo.isEncrypted
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold">
                            {encryptionInfo.isEncrypted
                              ? `Already Encrypted (${encryptionInfo.encryptionMethod})`
                              : `Ready to Encrypt${encryptionInfo.pageCount ? ` • ${encryptionInfo.pageCount} Page${encryptionInfo.pageCount === 1 ? '' : 's'}` : ''}`}
                          </div>
                          <p className="text-[11px] opacity-90">
                            {encryptionInfo.requiresUserPassword
                              ? 'This PDF currently requires a password to open. Enter its current password below to re-encrypt it with a new password.'
                              : encryptionInfo.isEncrypted
                              ? 'This PDF currently has owner restrictions. Setting a new password will replace its protection.'
                              : 'Your file will be encrypted locally using ISO-standard AES encryption — zero bytes leave your device.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current password if already locked */}
                    {encryptionInfo?.requiresUserPassword && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Current PDF Password (Required to Re-Encrypt)
                        </label>
                        <input
                          type="password"
                          value={existingPasswordForProtect}
                          onChange={(e) => setExistingPasswordForProtect(e.target.value)}
                          placeholder="Enter existing open password..."
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Open Password + Confirm Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                          <span>Set Open Password (Required to View PDF)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showUserPassword ? 'text' : 'password'}
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            placeholder="Enter strong password..."
                            autoComplete="new-password"
                            className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUserPassword((s) => !s)}
                            aria-label={showUserPassword ? 'Hide password' : 'Show password'}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Strength Meter */}
                        {userPassword.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="grid grid-cols-4 gap-1">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className={`h-1.5 rounded-full transition-colors ${
                                    step <= strength.score
                                      ? strength.barClass
                                      : 'bg-slate-200 dark:bg-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className={`text-[11px] font-semibold ${strength.textClass}`}>
                              Strength: {strength.label}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Confirm Open Password
                        </label>
                        <input
                          type={showUserPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isProcessing) handleProcess();
                          }}
                          placeholder="Re-enter password to confirm..."
                          autoComplete="new-password"
                          className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                            passwordsMismatch
                              ? 'border-rose-500 focus:ring-rose-500/30'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/40 focus:border-blue-500'
                          }`}
                        />
                        {passwordsMismatch && (
                          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            Passwords do not match.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Advanced Encryption & Permissions Toggle */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedPerms((v) => !v)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                          <span>Encryption Level &amp; Permissions (Print / Copy / Edit Controls)</span>
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {showAdvancedPerms ? 'Hide' : `AES-${keyBits} • Customize`}
                        </span>
                      </button>

                      {showAdvancedPerms && (
                        <div className="p-4 space-y-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                Encryption Standard
                              </label>
                              <select
                                value={keyBits}
                                onChange={(e) => setKeyBits(Number(e.target.value) as 128 | 256)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                              >
                                <option value={256}>AES-256 Bit (ISO 32000-2 — Recommended)</option>
                                <option value={128}>AES-128 Bit (Older PDF Readers)</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                Printing Permission
                              </label>
                              <select
                                value={allowPrinting}
                                onChange={(e) =>
                                  setAllowPrinting(
                                    e.target.value as ProtectPdfPermissions['allowPrinting']
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                              >
                                <option value="full">Allow High-Resolution Printing</option>
                                <option value="low">Allow Low-Resolution Printing Only</option>
                                <option value="none">Disable Printing Completely</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                Editing &amp; Modification Permission
                              </label>
                              <select
                                value={allowModifying}
                                onChange={(e) =>
                                  setAllowModifying(
                                    e.target.value as ProtectPdfPermissions['allowModifying']
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                              >
                                <option value="all">Allow All Editing</option>
                                <option value="annotate">Allow Comments &amp; Form Filling Only</option>
                                <option value="form">Allow Form Filling Only</option>
                                <option value="none">Block All Editing &amp; Annotations</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                Text &amp; Image Copying
                              </label>
                              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={allowCopying}
                                  onChange={(e) => setAllowCopying(e.target.checked)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {allowCopying ? 'Allow copying text & images' : 'Block copying text & images'}
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Optional Owner Password */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="font-bold text-slate-700 dark:text-slate-300 block">
                              Optional Permissions (Owner) Password
                            </label>
                            <div className="relative">
                              <input
                                type={showOwnerPassword ? 'text' : 'password'}
                                value={ownerPassword}
                                onChange={(e) => setOwnerPassword(e.target.value)}
                                placeholder="Leave blank to auto-generate a secure 24-character permissions key"
                                autoComplete="new-password"
                                className="w-full pl-3.5 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                              />
                              <button
                                type="button"
                                onClick={() => setShowOwnerPassword((s) => !s)}
                                aria-label={showOwnerPassword ? 'Hide owner password' : 'Show owner password'}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              A distinct Owner Password ensures print/copy/edit restrictions stay enforced even when someone opens the PDF with the User Password.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* UNLOCK PDF CONTROLS */}
                {isUnlock && !isInspectingCrypto && (
                  <div className="space-y-4">
                    {encryptionInfo && (
                      <div
                        className={`flex items-start gap-2.5 p-4 rounded-xl border text-xs ${
                          encryptionInfo.requiresUserPassword
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-950 dark:text-amber-200'
                            : encryptionInfo.isEncrypted
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                            : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-200'
                        }`}
                      >
                        {encryptionInfo.requiresUserPassword ? (
                          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="font-bold">
                            {encryptionInfo.requiresUserPassword
                              ? 'Password-Protected PDF Detected'
                              : encryptionInfo.isEncrypted
                              ? `Owner-Restricted PDF Detected (${encryptionInfo.encryptionMethod})`
                              : `Not Password-Protected${encryptionInfo.pageCount ? ` (${encryptionInfo.pageCount} Pages)` : ''}`}
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {encryptionInfo.requiresUserPassword
                              ? 'This PDF is cryptographically encrypted and requires its open password to decrypt. Enter the password below to permanently remove protection while keeping 100% original vector text and quality.'
                              : encryptionInfo.isEncrypted
                              ? 'Good news! This PDF has printing/copying/editing restrictions without an open password. Click "Unlock PDF" below to remove all restrictions immediately — no password required.'
                              : 'This PDF does not have password encryption. You can still download a clean copy or upload a locked PDF instead.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Password input when open password is required (or optional for owner password) */}
                    {(!encryptionInfo || encryptionInfo.requiresUserPassword) && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                          <span>Enter PDF Password</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showUnlockPassword ? 'text' : 'password'}
                            value={unlockPassword}
                            onChange={(e) => setUnlockPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isProcessing) handleProcess();
                            }}
                            placeholder="Type the PDF password (case-sensitive)..."
                            autoFocus
                            className="w-full pl-3.5 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUnlockPassword((s) => !s)}
                            aria-label={showUnlockPassword ? 'Hide password' : 'Show password'}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                          <span>
                            <strong>Common formats:</strong> e-Aadhaar PDFs use the first 4 letters of your name in <strong>CAPITALS</strong> + birth year (e.g. <code>AMIT1992</code>). Bank statements typically use Customer ID or DOB. Decryption happens 100% on your device.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sign PDF Controls */}
                {isSign && (
                  <div className="space-y-4">
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
                          onChange={(e) => setTargetPage(parseInt(e.target.value, 10))}
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

                {isProcessing && (
                  <ProgressBar progress={progress} statusText={statusText} />
                )}

                {errorMsg && (
                  <div className="flex items-start gap-2 p-3.5 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
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
                  disabled={isProcessing || isInspectingCrypto || passwordsMismatch}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {isProtect
                          ? `Encrypting with AES-${keyBits}...`
                          : isUnlock
                          ? 'Unlocking PDF...'
                          : 'Processing Document...'}
                      </span>
                    </>
                  ) : (
                    <>
                      {isProtect && <Lock className="w-4 h-4" />}
                      {isUnlock && <Unlock className="w-4 h-4" />}
                      <span>
                        {isProtect
                          ? `Encrypt & Protect PDF (AES-${keyBits})`
                          : isUnlock
                          ? encryptionInfo?.isEncrypted && !encryptionInfo.requiresUserPassword
                            ? 'Remove Restrictions & Unlock PDF'
                            : 'Unlock PDF Now'
                          : isSign
                          ? 'Sign & Embed on PDF'
                          : 'Wipe & Sanitize Metadata'}
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

            {resultBadge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{resultBadge}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isProtect
                  ? 'PDF Successfully Encrypted & Protected!'
                  : isUnlock
                  ? 'PDF Successfully Unlocked!'
                  : 'PDF Successfully Processed!'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                {resultSummary ||
                  (isSign
                    ? 'Your signature has been embedded cleanly and the mandatory full-page PottoTools logo watermark has been applied across every page.'
                    : 'All hidden metadata and tracking tags have been purged.')}
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
                <span>
                  {isProtect
                    ? 'Download Protected PDF'
                    : isUnlock
                    ? 'Download Unlocked PDF'
                    : 'Download Saved PDF'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
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
            {isProtect
              ? 'Cryptographic Encryption & Privacy'
              : isUnlock
              ? 'Lossless Decryption & Authorized Use'
              : 'Security & Legal Notice'}
          </h2>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isProtect ? (
              <>
                <p>
                  PottoTools encrypts your PDF using genuine ISO 32000-2 AES-256 (R=6) or AES-128 (R=4) cryptography compiled to WebAssembly. The resulting file genuinely requires your password in Adobe Acrobat, Chrome, Edge, Firefox, Safari, macOS Preview, and mobile PDF readers.
                </p>
                <p>
                  Your document and password stay 100% inside your browser RAM and are never transmitted to any server. Remember to store your password safely — we cannot recover forgotten passwords.
                </p>
              </>
            ) : isUnlock ? (
              <>
                <p>
                  Unlock PDF performs real, lossless cryptographic decryption inside your browser. Unlike screenshot-based workarounds, it preserves 100% of original vector fonts, selectable text, hyperlinks, bookmarks, and form layouts with zero quality loss.
                </p>
                <p>
                  Only unlock documents you own or are legally authorized to access. Your files and passwords never leave your device.
                </p>
              </>
            ) : (
              <>
                <p>
                  A drawn or stamped electronic signature creates a visual sign-off on contracts and agreements. It is legally valid under many jurisdictions (e.g. US ESIGN Act, EU eIDAS Simple Electronic Signature).
                </p>
                <p>
                  All processing happens in your browser RAM without leaving your computer.
                </p>
              </>
            )}
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
                <div className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {onSelectNextTool && (
        <RecommendedNextTools currentToolId={tool.id} onSelectTool={onSelectNextTool} />
      )}
    </div>
  );
};
