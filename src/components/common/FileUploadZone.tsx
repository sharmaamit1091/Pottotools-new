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
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xl shadow-blue-500/10 scale-[0.995]'
            : 'border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-b from-blue-50/40 via-indigo-50/20 to-purple-50/30 dark:from-slate-900/80 dark:via-indigo-950/20 dark:to-slate-900/80 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl hover:shadow-indigo-500/10'
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
          {/* Animated Vibrant Icon Badge */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Drag & Drop your {multiple ? 'documents' : 'document'} here
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              or click below to browse from your device
            </p>
          </div>

          {/* Prominent Vibrant Gradient CTA Button */}
          <div>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) inputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 py-3 px-7 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-md hover:shadow-xl hover:shadow-indigo-500/25 transition-all active:scale-[0.98]"
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
                className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-xs"
              >
                .{badge}
              </span>
            ))}
            <span className="text-xs text-slate-400 ml-1">· Max {maxFileSizeMB} MB</span>
          </div>

          {/* Privacy Trust Micro-Copy */}
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Client-Side • Files Never Leave Your Device • Zero Cloud Uploads</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Selected {files.length === 1 ? 'Document' : `Documents (${files.length})`}</span>
            {multiple && files.length > 1 && (
              <button
                type="button"
                onClick={() => onFilesSelected([])}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="p-3.5 sm:px-4 flex items-center justify-between gap-3 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-slate-700 shrink-0">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {formatBytes(file.size)}
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
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Remove file"
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
