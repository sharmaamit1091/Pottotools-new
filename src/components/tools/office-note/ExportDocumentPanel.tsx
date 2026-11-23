import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileSearch,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { DigitizerPageItem } from '../../../services/htr/types';
import {
  ExportScope,
  buildExportBaseName,
  exportOfficeNotesAsDocx,
  exportOfficeNotesAsSearchablePdf,
  exportOfficeNotesAsTxt,
} from '../../../services/htr/officeNoteExporter';
import { triggerDownload } from '../../../services/utils/downloadUtils';
import { triggerToast } from '../../common/Toast';

interface ExportDocumentPanelProps {
  pages: DigitizerPageItem[];
  selectedPage: DigitizerPageItem;
  primaryFileName: string;
  renderPageForExport: (
    page: DigitizerPageItem,
    useEnhanced: boolean
  ) => Promise<HTMLCanvasElement>;
  disabled?: boolean;
}

export const ExportDocumentPanel: React.FC<ExportDocumentPanelProps> = ({
  pages,
  selectedPage,
  primaryFileName,
  renderPageForExport,
  disabled = false,
}) => {
  const [scope, setScope] = useState<ExportScope>(pages.length > 1 ? 'all' : 'current');
  const [includePageHeaders, setIncludePageHeaders] = useState<boolean>(pages.length > 1);
  const [pdfUseEnhanced, setPdfUseEnhanced] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<'docx' | 'pdf' | 'txt' | null>(null);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [lastExportedLabel, setLastExportedLabel] = useState<string | null>(null);

  const effectiveScope: ExportScope = pages.length === 1 ? 'current' : scope;
  const targetPages = effectiveScope === 'all' ? pages : [selectedPage];
  const hasAnyText = targetPages.some(
    (p) => (p.editedText || p.recognizedText || '').trim().length > 0
  );
  const baseName = buildExportBaseName(primaryFileName);
  const suffix = effectiveScope === 'current' && pages.length > 1 ? `_page-${selectedPage.pageNumber}` : '';

  const handleExportTxt = () => {
    if (disabled || exportingFormat) return;
    if (!hasAnyText) {
      triggerToast('info', 'Run recognition or enter text first before exporting Plain Text.');
      return;
    }
    setExportingFormat('txt');
    setExportStatus('Preparing Plain Text...');
    try {
      const blob = exportOfficeNotesAsTxt(targetPages, {
        scope: effectiveScope,
        includePageHeaders,
      });
      const filename = `${baseName}${suffix}_digitized.txt`;
      triggerDownload(blob, filename);
      setLastExportedLabel(filename);
      triggerToast('success', `Downloaded ${filename}`);
    } catch (err: any) {
      triggerToast('error', err?.message || 'Plain text export failed.');
    } finally {
      setExportingFormat(null);
      setExportStatus('');
    }
  };

  const handleExportDocx = async () => {
    if (disabled || exportingFormat) return;
    if (!hasAnyText) {
      triggerToast('info', 'Run recognition or enter text first before exporting a Word document.');
      return;
    }
    setExportingFormat('docx');
    setExportStatus('Creating Word document...');
    try {
      const blob = await exportOfficeNotesAsDocx(targetPages, {
        scope: effectiveScope,
        documentTitle: primaryFileName.replace(/\.[^/.]+$/, '') || 'Digitized Office Note',
        includePageHeaders,
      });
      const filename = `${baseName}${suffix}_digitized.docx`;
      triggerDownload(blob, filename);
      setLastExportedLabel(filename);
      triggerToast('success', `Downloaded Word document: ${filename}`);
    } catch (err: any) {
      triggerToast('error', err?.message || 'Word (.docx) export failed.');
    } finally {
      setExportingFormat(null);
      setExportStatus('');
    }
  };

  const handleExportSearchablePdf = async () => {
    if (disabled || exportingFormat) return;
    setExportingFormat('pdf');
    setExportStatus('Creating Searchable PDF...');
    try {
      const blob = await exportOfficeNotesAsSearchablePdf(
        targetPages,
        renderPageForExport,
        {
          scope: effectiveScope,
          documentTitle: primaryFileName.replace(/\.[^/.]+$/, '') || 'Searchable Office Note',
          useEnhancedImage: pdfUseEnhanced,
          onProgress: (_cur, _tot, detail) => setExportStatus(detail),
        }
      );
      const filename = `${baseName}${suffix}_searchable.pdf`;
      triggerDownload(blob, filename);
      setLastExportedLabel(filename);
      triggerToast(
        'success',
        `Downloaded Searchable PDF (${filename}). Open in any PDF viewer and press Ctrl+F to search!`
      );
    } catch (err: any) {
      triggerToast('error', err?.message || 'Searchable PDF export failed.');
    } finally {
      setExportingFormat(null);
      setExportStatus('');
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#171A2B] border border-[#E6E4F0] dark:border-[#282D47] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#ECEAF4] dark:border-[#242840] bg-[#FAFAFC] dark:bg-[#131625] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-[#252536] dark:text-[#F2F4FC]">
              Export Digitized Office Note
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#155E3D] dark:text-[#86E5B7]">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>100% Private</span>
            </span>
          </div>
          <p className="text-xs text-[#777789] dark:text-[#9CA2BE] mt-0.5">
            Download your converted notes as an editable Word document, a Searchable PDF, or a Plain Text file.
          </p>
        </div>

        {lastExportedLabel && !exportingFormat && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#155E3D] dark:text-[#86E5B7]">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[240px]">Saved {lastExportedLabel}</span>
          </div>
        )}
      </div>

      {/* Options + Export Action Cards */}
      <div className="p-5 space-y-4">
        {/* Compact Export Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F0EEF7] dark:border-[#232740]">
          <div className="flex flex-wrap items-center gap-3">
            {pages.length > 1 && (
              <div className="inline-flex items-center p-0.5 rounded-xl bg-[#F4F3F9] dark:bg-[#111424] border border-[#E6E4F0] dark:border-[#262B45] text-xs font-semibold">
                <button
                  type="button"
                  disabled={Boolean(exportingFormat)}
                  onClick={() => setScope('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    effectiveScope === 'all'
                      ? 'bg-white dark:bg-[#222742] text-[#43348F] dark:text-[#CFC6FF] shadow-2xs'
                      : 'text-[#646478] dark:text-[#9CA2BE]'
                  }`}
                >
                  All Pages ({pages.length})
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportingFormat)}
                  onClick={() => setScope('current')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    effectiveScope === 'current'
                      ? 'bg-white dark:bg-[#222742] text-[#43348F] dark:text-[#CFC6FF] shadow-2xs'
                      : 'text-[#646478] dark:text-[#9CA2BE]'
                  }`}
                >
                  Current Page (Pg {selectedPage.pageNumber})
                </button>
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4F4F65] dark:text-[#B5BAD4] cursor-pointer">
              <input
                type="checkbox"
                checked={includePageHeaders}
                onChange={(e) => setIncludePageHeaders(e.target.checked)}
                className="rounded accent-[#5B50E6]"
              />
              <span>Include page headers &amp; breaks (DOCX/TXT)</span>
            </label>
          </div>

          <div className="inline-flex items-center gap-2 text-xs">
            <span className="text-[#777789] dark:text-[#9CA2BE] font-medium">Searchable PDF Scan:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-[#F4F3F9] dark:bg-[#111424] border border-[#E6E4F0] dark:border-[#262B45] font-semibold">
              <button
                type="button"
                disabled={Boolean(exportingFormat)}
                onClick={() => setPdfUseEnhanced(false)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  !pdfUseEnhanced
                    ? 'bg-white dark:bg-[#222742] text-[#252536] dark:text-[#F2F4FC] shadow-2xs'
                    : 'text-[#646478] dark:text-[#9CA2BE]'
                }`}
              >
                Original
              </button>
              <button
                type="button"
                disabled={Boolean(exportingFormat)}
                onClick={() => setPdfUseEnhanced(true)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  pdfUseEnhanced
                    ? 'bg-white dark:bg-[#222742] text-[#252536] dark:text-[#F2F4FC] shadow-2xs'
                    : 'text-[#646478] dark:text-[#9CA2BE]'
                }`}
              >
                Enhanced
              </button>
            </div>
          </div>
        </div>

        {/* Live Export Progress Notice */}
        {exportingFormat && exportStatus && (
          <div className="rounded-xl bg-[#F4F1FF] dark:bg-[#1E1A3B] border border-[#D8D0FA] dark:border-[#39326E] px-4 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-[#43348F] dark:text-[#D5CEFF]">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{exportStatus}</span>
          </div>
        )}

        {/* 3 Primary Export Format Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Editable Word (.docx) */}
          <button
            type="button"
            disabled={disabled || Boolean(exportingFormat)}
            onClick={handleExportDocx}
            className="group text-left rounded-2xl p-4 border border-[#D8D0FA] dark:border-[#373068] bg-[#F7F5FF] dark:bg-[#1C1936] hover:border-[#5B50E6] hover:bg-[#F0ECFF] dark:hover:bg-[#241F48] transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-[#3B2E8A] dark:text-[#DCD6FF]">
                {exportingFormat === 'docx' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>Editable Word (.docx)</span>
              </div>
              <Download className="w-4 h-4 text-[#5B50E6] dark:text-[#B9B0FF] group-hover:translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#646478] dark:text-[#A5AAC4] leading-relaxed">
              Editable Word document ready for MS Word, LibreOffice, and Google Docs.
            </p>
          </button>

          {/* Aligned Searchable PDF (.pdf) */}
          <button
            type="button"
            disabled={disabled || Boolean(exportingFormat)}
            onClick={handleExportSearchablePdf}
            className="group text-left rounded-2xl p-4 border border-[#CBE0FA] dark:border-[#29476B] bg-[#F2F8FF] dark:bg-[#142338] hover:border-[#2563EB] hover:bg-[#E7F2FF] dark:hover:bg-[#1B2F4A] transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-[#1A4B84] dark:text-[#BFDBFE]">
                {exportingFormat === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSearch className="w-4 h-4" />
                )}
                <span>Searchable PDF (.pdf)</span>
              </div>
              <Download className="w-4 h-4 text-[#2563EB] dark:text-[#93C5FD] group-hover:translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#646478] dark:text-[#A5AAC4] leading-relaxed">
              Keeps your original scanned page while making all Hindi &amp; English text selectable and searchable (Ctrl+F).
            </p>
          </button>

          {/* Plain Text (.txt) */}
          <button
            type="button"
            disabled={disabled || Boolean(exportingFormat)}
            onClick={handleExportTxt}
            className="group text-left rounded-2xl p-4 border border-[#E6E4F0] dark:border-[#2B3150] bg-[#FAFAFC] dark:bg-[#131727] hover:border-[#5B50E6] hover:bg-white dark:hover:bg-[#1A1F35] transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-[#252536] dark:text-[#F2F4FC]">
                {exportingFormat === 'txt' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Plain Text (.txt)</span>
              </div>
              <Download className="w-4 h-4 text-[#646478] dark:text-[#A5AAC4] group-hover:translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-[#646478] dark:text-[#A5AAC4] leading-relaxed">
              Clean text file ready for emails, office portals, and instant copy-paste.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
