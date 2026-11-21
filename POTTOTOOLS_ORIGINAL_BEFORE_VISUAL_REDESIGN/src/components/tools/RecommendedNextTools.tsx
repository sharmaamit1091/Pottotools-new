import React, { useState } from 'react';
import { ToolDefinition, getToolBySlug } from '../../config/toolsRegistry';
import { ArrowRight, Sparkles, X, Check } from 'lucide-react';
import { TOOL_VISUAL_THEMES } from '../common/ToolCard';

interface RecommendedNextToolsProps {
  currentToolId: string;
  onSelectTool: (tool: ToolDefinition) => void;
}

// Contextual map linking genuinely implemented tools to natural next actions
const RECOMMENDATION_MAP: Record<string, { slug: string; reason: string }[]> = {
  'fill-pdf-form': [
    { slug: 'compress-pdf', reason: 'Shrink your filled PDF to fit email or application portal size limits' },
    { slug: 'protect-pdf', reason: 'Lock your filled PDF form with a strong AES-256 password' },
    { slug: 'merge-pdf', reason: 'Combine your completed form with ID proofs or supporting certificates' },
    { slug: 'pdf-page-organizer', reason: 'Reorder, rotate, or delete pages in your final document' },
  ],
  'searchable-pdf-text-finder': [
    { slug: 'compress-pdf', reason: 'Compress your newly searchable PDF for easy sharing' },
    { slug: 'pdf-to-editable-word', reason: 'Convert scanned PDF to fully editable Word document' },
    { slug: 'pdf-page-organizer', reason: 'Reorder, rotate, or remove pages before distribution' },
  ],
  'pdf-page-organizer': [
    { slug: 'compress-pdf', reason: 'Compress your newly organized PDF for email or upload' },
    { slug: 'pdf-to-editable-word', reason: 'Convert the organized PDF to editable Word document' },
    { slug: 'protect-pdf', reason: 'Add a password to protect your organized document' },
  ],
  'compress-pdf': [
    { slug: 'merge-pdf', reason: 'Combine this compressed file with other documents' },
    { slug: 'delete-pdf-pages', reason: 'Remove unwanted or blank pages' },
    { slug: 'pdf-to-word', reason: 'Turn this PDF into an editable Word document' },
  ],
  'merge-pdf': [
    { slug: 'compress-pdf', reason: 'Shrink your newly combined PDF for email or upload' },
    { slug: 'page-numbers-pdf', reason: 'Add professional page numbers to your consolidated document' },
    { slug: 'protect-pdf', reason: 'Secure your combined file with a strong password' },
  ],
  'split-pdf': [
    { slug: 'compress-pdf', reason: 'Optimize extracted pages down to under 200KB' },
    { slug: 'merge-pdf', reason: 'Re-assemble selected pages into a new clean document' },
    { slug: 'pdf-to-word', reason: 'Convert extracted pages into editable Word format' },
  ],
  'delete-pdf-pages': [
    { slug: 'compress-pdf', reason: 'Shrink the remaining clean document' },
    { slug: 'page-numbers-pdf', reason: 'Re-number the pages consecutively' },
    { slug: 'merge-pdf', reason: 'Combine with supplementary documents' },
  ],
  'watermark-pdf': [
    { slug: 'protect-pdf', reason: 'Lock your branded PDF with password encryption' },
    { slug: 'compress-pdf', reason: 'Ensure the watermarked file meets upload limits' },
  ],
  'page-numbers-pdf': [
    { slug: 'compress-pdf', reason: 'Compress your numbered document for submission' },
    { slug: 'protect-pdf', reason: 'Add password security before emailing' },
  ],
  'pdf-to-editable-word': [
    { slug: 'word-to-pdf', reason: 'Convert back to pristine PDF after finishing your edits' },
    { slug: 'compress-pdf', reason: 'Shrink original or modified PDFs for small file sizes' },
    { slug: 'ocr-tool', reason: 'Dedicated OCR for multi-language scanned records' },
  ],
  'pdf-to-word': [
    { slug: 'pdf-to-editable-word', reason: 'Preserve menus, prices, and photos with full layout reconstruction' },
    { slug: 'word-to-pdf', reason: 'Convert back to pristine PDF after finishing your edits' },
    { slug: 'compress-pdf', reason: 'Shrink original or modified PDFs for small file sizes' },
  ],
  'word-to-pdf': [
    { slug: 'compress-pdf', reason: 'Compress your newly exported PDF for online portals' },
    { slug: 'protect-pdf', reason: 'Add password encryption to your PDF contract or report' },
    { slug: 'merge-pdf', reason: 'Stitch this document together with other attachments' },
  ],
  'image-to-pdf': [
    { slug: 'compress-pdf', reason: 'Shrink your newly generated PDF to under 500KB' },
    { slug: 'merge-pdf', reason: 'Combine with existing application or exam forms' },
    { slug: 'protect-pdf', reason: 'Lock sensitive photos inside an encrypted PDF' },
  ],
  'image-converter': [
    { slug: 'photo-signature-resizer', reason: 'Resize to strict exam or passport dimension limits' },
    { slug: 'image-to-pdf', reason: 'Package converted images into a single multi-page PDF' },
    { slug: 'combine-app-documents', reason: 'Consolidate multiple image certificates into one file' },
  ],
  'pdf-to-images': [
    { slug: 'image-converter', reason: 'Convert extracted images to PNG or WebP format' },
    { slug: 'photo-signature-resizer', reason: 'Crop and optimize extracted signature or photo' },
  ],
  'ocr-tool': [
    { slug: 'pdf-to-word', reason: 'Turn full scanned documents into formatted Word files' },
    { slug: 'compress-pdf', reason: 'Compress the original scanned PDF file' },
    { slug: 'text-cleaner', reason: 'Format, trim whitespace, and clean extracted OCR text' },
  ],
  'photo-signature-resizer': [
    { slug: 'passport-photo-cropper', reason: 'Crop photo to exact 3.5 x 4.5 cm passport standard' },
    { slug: 'combine-app-documents', reason: 'Combine photo, signature, and ID into one application file' },
    { slug: 'image-to-pdf', reason: 'Convert your verified image to PDF format' },
  ],
  'passport-photo-cropper': [
    { slug: 'photo-signature-resizer', reason: 'Compress to exact 20KB–50KB exam portal ceilings' },
    { slug: 'combine-app-documents', reason: 'Combine with signature and marksheet' },
  ],
  'combine-app-documents': [
    { slug: 'compress-pdf', reason: 'Ensure entire document package stays below 1MB or 2MB' },
    { slug: 'protect-pdf', reason: 'Add password protection to your application dossier' },
  ],
  'protect-pdf': [
    { slug: 'unlock-pdf', reason: 'Remove password protection later whenever needed' },
    { slug: 'pdf-id-redactor', reason: 'Permanently mask Aadhaar, bank or salary info before locking' },
    { slug: 'compress-pdf', reason: 'Shrink PDF file size to fit email or portal limits' },
  ],
  'unlock-pdf': [
    { slug: 'compress-pdf', reason: 'Compress your unlocked PDF for email or portal upload' },
    { slug: 'merge-pdf', reason: 'Combine your unlocked PDF with other documents' },
    { slug: 'pdf-id-redactor', reason: 'Mask Aadhaar, PAN, or bank numbers before sharing' },
    { slug: 'protect-pdf', reason: 'Lock your PDF again with a new password' },
  ],
  'pdf-id-redactor': [
    { slug: 'protect-pdf', reason: 'Add a password lock to your freshly hidden document' },
    { slug: 'compress-pdf', reason: 'Shrink your PDF to fit portal KB limits' },
    { slug: 'watermark-pdf', reason: 'Stamp "For KYC Use Only" across your masked copy' },
  ],
  'remove-scan-watermark': [
    { slug: 'compress-pdf', reason: 'Reduce your clean scanned PDF size for email or portal uploads' },
    { slug: 'searchable-pdf-text-finder', reason: 'Make your cleaned scanned PDF searchable with Ctrl+F' },
    { slug: 'pdf-page-organizer', reason: 'Reorder, rotate, or tidy pages in your cleaned document' },
    { slug: 'protect-pdf', reason: 'Lock your clean document with a strong password' },
  ],
  'sign-pdf': [
    { slug: 'protect-pdf', reason: 'Password-lock your freshly signed document' },
    { slug: 'compress-pdf', reason: 'Compress signed contract before sending' },
  ],
  'csv-to-xlsx': [
    { slug: 'sheet-viewer', reason: 'Preview and inspect the workbook in your browser' },
    { slug: 'xlsx-to-csv', reason: 'Convert back to CSV when needed' },
  ],
  'xlsx-to-csv': [
    { slug: 'sheet-viewer', reason: 'Inspect data and filter specific rows' },
    { slug: 'csv-to-xlsx', reason: 'Reformat back to Excel spreadsheet' },
  ],
  'sheet-viewer': [
    { slug: 'csv-to-xlsx', reason: 'Export this sheet as a formatted Excel workbook' },
    { slug: 'xlsx-to-csv', reason: 'Save as clean standard comma-separated values' },
  ],
  'pdf-text-extractor': [
    { slug: 'text-diff-comparator', reason: 'Compare this extracted text with another version' },
    { slug: 'text-cleaner', reason: 'Remove unwanted line breaks and extra whitespace' },
  ],
  'text-diff-comparator': [
    { slug: 'text-cleaner', reason: 'Format and normalize comparison text' },
    { slug: 'pdf-to-word', reason: 'Open documents in Word for detailed review' },
  ],
  'text-cleaner': [
    { slug: 'text-diff-comparator', reason: 'Verify differences after text cleaning' },
    { slug: 'word-to-pdf', reason: 'Save cleaned text as a printable PDF' },
  ],
};


export const RecommendedNextTools: React.FC<RecommendedNextToolsProps> = ({
  currentToolId,
  onSelectTool,
}) => {
  const [dismissed, setDismissed] = useState(false);

  const recommendations = RECOMMENDATION_MAP[currentToolId] || [
    { slug: 'compress-pdf', reason: 'Compress your processed document' },
    { slug: 'merge-pdf', reason: 'Combine with other files' },
    { slug: 'pdf-to-word', reason: 'Convert to editable Word format' },
  ];

  if (dismissed || recommendations.length === 0) return null;

  return (
    <div className="w-full mt-6 p-5 sm:p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-blue-200/80 dark:border-indigo-900/50 rounded-2xl shadow-sm transition-all">
      <div className="flex items-center justify-between pb-4 border-b border-blue-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              What would you like to do next?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your file is ready. Here are useful follow-up tools tailored to your workflow:
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Dismiss recommendations"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {recommendations.map((item) => {
          const tool = getToolBySlug(item.slug);
          if (!tool) return null;
          const theme = TOOL_VISUAL_THEMES[tool.id];
          const IconComp = theme?.icon || ArrowRight;

          return (
            <a
              key={tool.id}
              href={`/${tool.slug}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onSelectTool(tool);
                }
              }}
              className="text-left p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer no-underline"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${theme?.iconBg || 'bg-blue-100 dark:bg-blue-950/60'} ${theme?.iconColor || 'text-blue-600 dark:text-blue-400'} ${theme?.iconBorder || 'border-blue-200/80 dark:border-blue-900/60'}`}>
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tool.title}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {item.reason}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
