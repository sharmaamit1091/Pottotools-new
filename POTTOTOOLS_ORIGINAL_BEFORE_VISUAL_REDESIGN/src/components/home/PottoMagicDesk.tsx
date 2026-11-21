import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ToolDefinition } from '../../types/tools';
import { TOOLS, getToolBySlug } from '../../config/toolsRegistry';
import { formatBytes } from '../../services/utils/downloadUtils';
import { stageFileForTool } from '../../services/utils/stagedFileService';
import { preloadTool } from '../../services/utils/toolPreloader';
import { ToolCard } from '../common/ToolCard';
import {
  UploadCloud,
  FileText,
  Sheet,
  Presentation,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Wand2,
  EyeOff,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  WifiOff,
} from 'lucide-react';

interface PottoMagicDeskProps {
  onSelectTool: (tool: ToolDefinition) => void;
  onExploreAll?: () => void;
}

export type DetectedCategory = 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'text' | 'unknown';

interface DetectedFileInfo {
  file: File;
  category: DetectedCategory;
  categoryLabel: string;
  badgeColor: string;
  previewUrl?: string;
  extension: string;
}

const MAX_FILE_SIZE_BYTES = 524288000; // 500 MB

export const PottoMagicDesk: React.FC<PottoMagicDeskProps> = ({ onSelectTool, onExploreAll }) => {
  const [selectedFile, setSelectedFile] = useState<DetectedFileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRequestIdRef = useRef(0);

  // Revoke previous preview object URL cleanly when changed or unmounted
  useEffect(() => {
    const currentPreviewUrl = selectedFile?.previewUrl;
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [selectedFile?.previewUrl]);

  const buildImageDetectedInfo = (file: File, extLabel: string): DetectedFileInfo => {
    let previewUrl: string | undefined;
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {
      // Fallback without preview
    }
    return {
      file,
      category: 'image',
      categoryLabel: `${extLabel.toUpperCase()} Image / ID Scan`,
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
      previewUrl,
      extension: extLabel.toLowerCase(),
    };
  };

  const detectFileType = (file: File): DetectedFileInfo | null => {
    const nameParts = file.name.split('.');
    const ext = nameParts.length > 1 ? (nameParts.pop() || '').toLowerCase() : '';
    const mime = (file.type || '').toLowerCase();

    if (mime === 'application/pdf' || ext === 'pdf') {
      return {
        file,
        category: 'pdf',
        categoryLabel: 'PDF Document',
        badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
        extension: 'pdf',
      };
    }

    if (
      mime.startsWith('image/') ||
      ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'bmp', 'gif', 'svg', 'avif'].includes(ext)
    ) {
      const label = ext || mime.split('/')[1]?.split('+')[0] || 'IMG';
      return buildImageDetectedInfo(file, label);
    }

    if (
      mime.includes('word') ||
      mime.includes('officedocument.wordprocessingml') ||
      ['docx', 'doc'].includes(ext)
    ) {
      return {
        file,
        category: 'word',
        categoryLabel: 'Word Document (.docx)',
        badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
        extension: ext,
      };
    }

    if (
      mime.includes('spreadsheet') ||
      mime.includes('excel') ||
      mime.includes('csv') ||
      ['xlsx', 'xls', 'csv'].includes(ext)
    ) {
      return {
        file,
        category: 'excel',
        categoryLabel: ext === 'csv' ? 'CSV Spreadsheet' : 'Excel Workbook (.xlsx)',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
        extension: ext,
      };
    }

    if (
      mime.includes('presentation') ||
      mime.includes('powerpoint') ||
      ['pptx', 'ppt'].includes(ext)
    ) {
      return {
        file,
        category: 'powerpoint',
        categoryLabel: 'PowerPoint Presentation (.pptx)',
        badgeColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25',
        extension: ext,
      };
    }

    if (mime.startsWith('text/') || ['txt', 'md', 'text', 'markdown'].includes(ext)) {
      return {
        file,
        category: 'text',
        categoryLabel: ext === 'md' ? 'Markdown Document' : 'Plain Text Document',
        badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
        extension: ext,
      };
    }

    return null;
  };

  const detectByMagicBytes = async (file: File): Promise<DetectedFileInfo | null> => {
    try {
      const buffer = await file.slice(0, 16).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length < 4) return null;

      // %PDF-
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return {
          file,
          category: 'pdf',
          categoryLabel: 'PDF Document',
          badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
          extension: 'pdf',
        };
      }
      // JPEG
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return buildImageDetectedInfo(file, 'JPG');
      }
      // PNG
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return buildImageDetectedInfo(file, 'PNG');
      }
      // GIF
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return buildImageDetectedInfo(file, 'GIF');
      }
      // WEBP (RIFF....WEBP)
      if (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      ) {
        return buildImageDetectedInfo(file, 'WEBP');
      }
      // BMP
      if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
        return buildImageDetectedInfo(file, 'BMP');
      }
    } catch {
      // Ignore header read failures
    }
    return null;
  };

  const handleValidateFile = async (file: File) => {
    const requestId = ++dropRequestIdRef.current;
    setErrorMessage(null);

    if (file.size === 0) {
      setErrorMessage(`"${file.name}" is an empty file (0 bytes). Please upload a valid document or photo.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`"${file.name}" (${formatBytes(file.size)}) exceeds the maximum 500 MB limit.`);
      return;
    }

    let detected = detectFileType(file);
    if (!detected) {
      detected = await detectByMagicBytes(file);
    }

    if (requestId !== dropRequestIdRef.current) return;

    if (!detected) {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'unknown';
      setErrorMessage(
        `Unsupported file type (.${ext}). Supported formats: PDF, Images (JPG, PNG, WebP), Word (DOCX), Excel (XLSX, CSV), PowerPoint (PPTX), and Text (.txt).`
      );
      return;
    }

    setShowAllMatches(false);
    setSelectedFile(detected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleValidateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleValidateFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    ++dropRequestIdRef.current;
    setSelectedFile(null);
    setShowAllMatches(false);
    setErrorMessage(null);
  };

  const handleOpenTool = (tool: ToolDefinition) => {
    if (selectedFile) {
      stageFileForTool(selectedFile.file);
    }
    onSelectTool(tool);
  };

  const handleQuickGoalClick = (slug: string) => {
    const tool = getToolBySlug(slug);
    if (tool) {
      onSelectTool(tool);
    }
  };

  // Ordered by top user intent so top 3 appear cleanly without overwhelming visitors
  const suggestedTools = useMemo((): { tool: ToolDefinition; tag?: string }[] => {
    if (!selectedFile) return [];

    const getMatched = (slug: string, tag?: string) => {
      const tool = getToolBySlug(slug);
      return tool ? [{ tool, tag }] : [];
    };

    switch (selectedFile.category) {
      case 'pdf':
        return [
          ...getMatched('compress-pdf', 'Shrink to 100KB / 200KB'),
          ...getMatched('pdf-id-redactor', 'Unique: Hide Aadhaar / Bank'),
          ...getMatched('pdf-to-editable-word', 'Convert to Editable Word'),
          ...getMatched('pdf-page-organizer', 'Reorder & Rotate Pages'),
          ...getMatched('merge-pdf', 'Combine Multiple PDFs'),
          ...getMatched('split-pdf', 'Extract Specific Pages'),
          ...getMatched('searchable-pdf-text-finder', 'Search Inside Scans'),
          ...getMatched('pdf-to-images', 'Save Pages as JPG/PNG'),
          ...getMatched('protect-pdf', 'Add Password to PDF'),
          ...getMatched('unlock-pdf', 'Unlock Password-Protected PDF'),
          ...getMatched('sign-pdf', 'Draw & Stamp Signature'),
          ...getMatched('pdf-to-excel', 'Extract Tables to Excel'),
          ...getMatched('watermark-pdf', 'Custom Watermark'),
          ...getMatched('delete-pdf-pages', 'Remove Extra Pages'),
          ...getMatched('pdf-text-extractor', 'Copy Raw Text'),
        ];

      case 'image':
        return [
          ...getMatched('pdf-id-redactor', 'Unique: Hide Aadhaar / ID'),
          ...getMatched('custom-photo-studio', 'Resize px, cm, mm & KB'),
          ...getMatched('photo-size-compressor', 'Compress to 20KB / 50KB'),
          ...getMatched('image-converter', 'Convert JPG / PNG / WebP'),
          ...getMatched('image-to-pdf', 'Save Photo as PDF'),
          ...getMatched('photo-signature-resizer', 'UPSC / SSC Exam Presets'),
          ...getMatched('passport-photo-cropper', '2x2" / 35x45mm Passport'),
          ...getMatched('hd-image-enhancer', 'Sharpen Blurry Photo'),
          ...getMatched('photo-editor', 'Filters & Crop'),
          ...getMatched('ocr-tool', 'Extract Text & Hindi'),
          ...getMatched('photo-background-changer', 'White / Blue Studio BG'),
        ];

      case 'word':
        return [
          ...getMatched('word-to-pdf', 'Preserve Layout'),
          ...getMatched('docx-to-txt', 'Clean Raw Text'),
          ...getMatched('docx-to-html', 'Semantic Web HTML'),
        ];

      case 'excel':
        return [
          ...getMatched('excel-to-pdf', 'Formatted Report'),
          ...getMatched('xlsx-to-csv', 'Lightweight CSV'),
          ...getMatched('csv-to-xlsx', 'Formatted Excel'),
          ...getMatched('sheet-viewer', 'Interactive Grid'),
        ];

      case 'powerpoint':
        return [
          ...getMatched('powerpoint-to-pdf', 'Presentation to PDF'),
        ];

      case 'text':
        return [
          ...getMatched('txt-to-pdf', 'Paginated PDF'),
          ...getMatched('markdown-to-pdf', 'Styled Document'),
          ...getMatched('text-cleaner', 'Normalize Whitespace'),
          ...getMatched('text-diff-comparator', 'Side-by-Side Diff'),
        ];

      default:
        return [];
    }
  }, [selectedFile]);

  // Background-preload top 3 matched tools immediately after file detection
  useEffect(() => {
    if (!selectedFile || suggestedTools.length === 0) return;
    suggestedTools.slice(0, 3).forEach(({ tool }) => {
      preloadTool(tool.slug);
    });
  }, [selectedFile, suggestedTools]);

  const primarySuggestions = suggestedTools.slice(0, 3);
  const visibleSuggestions = showAllMatches ? suggestedTools : primarySuggestions;

  const quickGoals = [
    {
      slug: 'pdf-id-redactor',
      title: 'Hide Aadhaar, Bank or Salary Info',
      subtitle: 'Permanently blackout or blur IDs offline',
      badge: 'Unique Privacy',
      icon: EyeOff,
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
    },
    {
      slug: 'compress-pdf',
      title: 'Shrink PDF to Exact KB Size',
      subtitle: '100KB, 200KB & 500KB portal presets',
      badge: 'Most Popular',
      icon: Minimize2,
      accent: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
    },
    {
      slug: 'pdf-to-editable-word',
      title: 'Convert PDF to Editable Word',
      subtitle: 'Preserves layout, tables & photos',
      badge: 'DOCX + OCR',
      icon: FileText,
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
    },
    {
      slug: 'custom-photo-studio',
      title: 'Resize Photo / Exam Signature',
      subtitle: 'Set exact cm, mm, pixels & target KB',
      badge: 'Photo Studio',
      icon: Maximize2,
      accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
    },
  ];

  const renderCategoryIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.previewUrl) {
      return (
        <img
          src={selectedFile.previewUrl}
          alt={selectedFile.file.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
        />
      );
    }

    switch (selectedFile.category) {
      case 'pdf':
        return (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        );
      case 'word':
        return (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        );
      case 'excel':
        return (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sheet className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        );
      case 'powerpoint':
        return (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <Presentation className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        );
      case 'text':
        return (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <FileCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        );
    }
  };

  return (
    <section
      id="magic-tool-box"
      aria-label="Potto Magic Tool Box"
      className="relative max-w-5xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xl p-5 sm:p-7 md:p-8 overflow-hidden"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        accept=".pdf,image/*,.jpg,.jpeg,.png,.webp,.bmp,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.txt,.md"
      />

      {/* Top Title & Animated 3-Step Visual Demo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Wand2 className="w-4 h-4 shrink-0" />
            <span>Magic Tool Box · Auto-Detects Any File</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Not Sure Which Tool to Pick? Drop Your File Here
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            We instantly detect your PDF, Photo ID, Word, or Excel file and show only the exact tools that work on it.
          </p>
        </div>

        {/* Animated 3-Step Visual Strip */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 shrink-0 self-start lg:self-center">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-extrabold flex items-center justify-center anim-magic-float">
              1
            </span>
            <span>Drop File</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 anim-arrow" />
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center">
              <Sparkles className="w-3 h-3" />
            </span>
            <span>Auto-Match</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 anim-arrow" />
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center">
              ✓
            </span>
            <span>Done</span>
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {errorMessage && (
        <div className="mt-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-sm text-rose-900 dark:text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
              Supported: PDF, JPG/PNG/WebP ID scans, Word DOCX, Excel XLSX/CSV, PowerPoint PPTX, and TXT.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-100 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* State A: Easy Animated Dropzone + Quick 1-Click Goal Selector */}
      {!selectedFile ? (
        <div className="mt-5 space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-7 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.01] shadow-inner'
                : 'border-indigo-300/80 dark:border-indigo-800/70 bg-gradient-to-b from-indigo-50/40 via-white to-blue-50/30 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-indigo-950/20 hover:border-indigo-500 dark:hover:border-indigo-400'
            }`}
          >
            {/* Animated subtle scanner light beam across the box */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-36 bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent anim-magic-scan"
            />

            {/* Animated floating magic upload icon */}
            <div className="relative mb-4 anim-magic-float">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Drop Any File Here — Or Click to Choose
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              PDF, Aadhaar/ID Photo, Bank Statement, Word, or Excel. Runs 100% offline inside your browser.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Select File to Unlock Tools</span>
            </button>

            <div className="mt-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              PDF · JPG · PNG · WebP · DOCX · XLSX · PPTX · Up to 500 MB
            </div>
          </div>

          {/* Super Easy Quick Goals for Users Without a File Ready Yet */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Or Pick What You Need Right Now (1 Click):
              </span>
              {onExploreAll && (
                <a
                  href="/directory"
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onExploreAll();
                    }
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>All {TOOLS.length} Tools</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickGoals.map((goal) => {
                const IconComp = goal.icon;
                return (
                  <a
                    key={goal.slug}
                    href={`/${goal.slug}`}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        handleQuickGoalClick(goal.slug);
                      }
                    }}
                    onMouseEnter={() => preloadTool(goal.slug)}
                    onFocus={() => preloadTool(goal.slug)}
                    className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left group flex flex-col justify-between cursor-pointer no-underline"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${goal.accent}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {goal.badge}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {goal.title}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {goal.subtitle}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* State B: Magic Scan & Clear Top Suggestions */
        <div className="mt-5 space-y-5 anim-magic-reveal text-left">
          {/* File Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {renderCategoryIcon()}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${selectedFile.badgeColor}`}
                  >
                    {selectedFile.categoryLabel}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {formatBytes(selectedFile.file.size)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready in Browser
                  </span>
                </div>
                <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {selectedFile.file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pick any action below — your file opens directly with zero re-uploading.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Change File</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="inline-flex items-center justify-center p-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {showAllMatches
                  ? `All ${suggestedTools.length} Tools for Your ${selectedFile.categoryLabel}`
                  : `Top Recommended Actions for Your ${selectedFile.categoryLabel}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click an action card to start immediately.
              </p>
            </div>

            {suggestedTools.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllMatches((v) => !v)}
                className="self-start sm:self-center inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
              >
                {showAllMatches ? (
                  <>
                    <span>Show Top 3 Only</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Show All {suggestedTools.length} Matching Tools</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Clean Matched Tool Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSuggestions.map(({ tool }) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onClick={() => handleOpenTool(tool)}
                showCategoryTag
              />
            ))}
          </div>
        </div>
      )}

      {/* Privacy & Offline Footer Guarantee */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-700 dark:text-slate-200">Zero Cloud Uploads:</strong> Your files stay on your device memory and work even offline.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
          <span>100% Offline Ready</span>
        </span>
      </div>
    </section>
  );
};
