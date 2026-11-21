import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { formatBytes } from '../../services/utils/downloadUtils';
import { trackToolFileSelected } from '../../services/analytics/ga4Tracker';

interface FileUploadZoneProps {
  acceptedFormats: string[];
  maxFileSizeMB: number;
  multiple?: boolean;
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  acceptedFormats,
  maxFileSizeMB,
  multiple = false,
  files,
  onFilesSelected,
  onRemoveFile,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndAdd = (incoming: FileList | File[]) => {
    setErrorMsg(null);
    const validList: File[] = [];
    const maxBytes = maxFileSizeMB * 1024 * 1024;

    for (let i = 0; i < incoming.length; i++) {
      const file = incoming[i];
      if (file.size > maxBytes) {
        setErrorMsg(`"${file.name}" exceeds the maximum ${maxFileSizeMB} MB limit.`);
        continue;
      }
      if (file.size === 0) {
        setErrorMsg(`"${file.name}" is an empty file (0 bytes).`);
        continue;
      }
      validList.push(file);
      if (!multiple) break; // only accept first if single
    }

    if (validList.length > 0) {
      const totalBytes = validList.reduce((acc, f) => acc + f.size, 0);
      const exts = validList.map((f) => {
        const parts = f.name.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'unknown';
      });
      trackToolFileSelected(validList.length, totalBytes, exts);

      if (multiple) {
        onFilesSelected([...files, ...validList]);
      } else {
        onFilesSelected(validList);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAdd(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAdd(e.target.files);
    }
  };

  // Format tags for display (strip dots, uppercase)
  const formatBadges = acceptedFormats.slice(0, 5).map((f) => f.replace('.', '').toUpperCase());

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-8 sm:p-11 text-center transition-all duration-250 cursor-pointer group ${
          isDragging
            ? 'border-[#5B50E6] bg-[#E9E4FF]/55 dark:bg-[#2B244E]/60 shadow-lg shadow-[#5B50E6]/10 scale-[0.995]'
            : 'border-[#D4CEF4] dark:border-[#363B5E] bg-[#FAFAFC] dark:bg-[#151829] hover:border-[#8178F6] dark:hover:border-[#8178F6] hover:bg-[#F7F5FF] dark:hover:bg-[#1A1E33] hover:shadow-md'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Subtle Floating Pastel Upload Emblem */}
          <div className="relative anim-magic-float">
            <div className="w-16 h-16 rounded-2xl bg-[#E9E4FF] dark:bg-[#2B244E] border border-[#CFC5FA] dark:border-[#4D4287] text-[#5B50E6] dark:text-[#BEB7FF] shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-250">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-xl bg-[#DDF5E9] dark:bg-emerald-500/25 border-2 border-white dark:border-[#151829] flex items-center justify-center text-[#196B47] dark:text-emerald-300">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-[#252536] dark:text-[#F2F4FC] tracking-tight">
              {isDragging
                ? `Release to add your ${multiple ? 'documents' : 'document'}`
                : `Drag & Drop your ${multiple ? 'documents' : 'document'} here`}
            </h3>
            <p className="text-xs sm:text-sm text-[#777789] dark:text-[#A0A5C0]">
              or click below to select from your device — opens instantly in your browser
            </p>
          </div>

          {/* Clean Crisp Primary CTA Button */}
          <div>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) inputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 py-3 px-7 rounded-xl font-bold text-sm text-white bg-[#5B50E6] hover:bg-[#4A3FD4] shadow-sm shadow-[#5B50E6]/25 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Choose {multiple ? 'Files' : 'File'}</span>
            </button>
          </div>

          {/* Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {formatBadges.map((badge, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#1E2238] border border-[#E8E6F2] dark:border-[#2F3554] text-[#55556B] dark:text-[#C5CAE0]"
              >
                .{badge}
              </span>
            ))}
            <span className="text-xs text-[#777789] dark:text-[#A0A5C0] ml-1">· Max {maxFileSizeMB} MB</span>
          </div>

          {/* Honest Local Processing Status Copy */}
          <div className="inline-flex items-center gap-1.5 text-xs text-[#196B47] dark:text-emerald-300 font-semibold bg-[#DDF5E9]/85 dark:bg-emerald-950/45 border border-[#BCEBD4] dark:border-emerald-800/60 px-3.5 py-1.5 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Processed Locally in Your Browser · Zero Server Uploads</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-[#9A3412] dark:text-rose-200 bg-[#FFE9DA]/80 dark:bg-rose-950/40 border border-[#F5BEA0] dark:border-rose-800/60 rounded-2xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected File List with Honest Local Readiness Status */}
      {files.length > 0 && (
        <div className="space-y-2 pt-page-enter">
          <div className="text-xs font-bold uppercase tracking-wider text-[#777789] dark:text-[#A0A5C0] flex items-center justify-between">
            <span>Selected {files.length === 1 ? 'Document' : `Documents (${files.length})`}</span>
            {multiple && files.length > 1 && (
              <button
                type="button"
                onClick={() => onFilesSelected([])}
                className="text-xs text-[#C2410C] dark:text-rose-400 hover:underline font-bold cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="divide-y divide-[#F1EFF8] dark:divide-[#242942] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-2xl bg-white dark:bg-[#181B2E] overflow-hidden shadow-2xs">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="p-3.5 sm:px-4 flex items-center justify-between gap-3 text-sm hover:bg-[#FAFAFC] dark:hover:bg-[#1E2238] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-[#DDEEFF] dark:bg-[#1B314E] text-[#1A528C] dark:text-[#B9DCFF] rounded-xl border border-[#C0DFFF] dark:border-[#325785] shrink-0">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#252536] dark:text-[#F2F4FC] truncate">
                      {file.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
                      <span className="text-[#777789] dark:text-[#A0A5C0] font-mono">
                        {formatBytes(file.size)}
                      </span>
                      <span className="text-[#D4D2E3] dark:text-[#3A4064]" aria-hidden="true">·</span>
                      <span className="text-[11px] font-semibold text-[#196B47] dark:text-emerald-300">
                        Ready for local processing
                      </span>
                    </div>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(idx);
                    }}
                    className="p-2 text-[#777789] hover:text-[#DC2626] dark:hover:text-rose-400 rounded-xl hover:bg-[#FFE9DA]/60 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remove file"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
