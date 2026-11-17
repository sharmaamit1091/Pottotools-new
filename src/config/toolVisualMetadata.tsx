import React from 'react';
import {
  CompressPdfVisual,
  MergePdfVisual,
  SplitPdfVisual,
  OrganizePdfVisual,
  PdfToWordVisual,
  WordToPdfVisual,
  SignPdfVisual,
  WatermarkPdfVisual,
  ProtectPdfVisual,
  PdfToImagesVisual,
  ImageToPdfVisual,
  SearchablePdfVisual,
  DeletePdfPagesVisual,
  PageNumbersVisual,
  CustomPhotoStudioCardVisual,
  ResizeImageVisual,
  CompressImageVisual,
  JpgToPngVisual,
  PngToJpgVisual,
  ImageEnhancerVisual,
  ImageCropVisual,
  PassportCropVisual,
  ExamPhotoSignatureVisual,
  PhotoBgChangerVisual,
  OcrToolVisual,
  ExcelToPdfVisual,
  PdfToExcelVisual,
  CsvToXlsxVisual,
  XlsxToCsvVisual,
  PptToPdfVisual,
  TextDiffVisual,
  TextCleanerVisual,
  SheetViewerVisual,
  RedactIdVisual,
  GenericToolVisual,
} from '../components/visuals/ToolVisualIllustrations';

export interface ToolVisualSpec {
  visual: React.FC;
  actionLabel: string;
  shortExplanation: string;
  actionButtonText: string;
  categoryTag: string;
  accentClass: {
    borderHover: string;
    actionTag: string;
    button: string;
  };
}

export const TOOL_VISUAL_REGISTRY: Record<string, ToolVisualSpec> = {
  // =================== PDF TOOLS ===================
  'compress-pdf': {
    visual: CompressPdfVisual,
    actionLabel: 'Reduce file size',
    shortExplanation: 'Shrink PDF file size down to target 100KB, 200KB or 500KB while keeping crisp fonts.',
    actionButtonText: 'Compress PDF',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-red-400 dark:hover:border-red-500',
      actionTag: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-900/60',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
  },
  'merge-pdf': {
    visual: MergePdfVisual,
    actionLabel: 'Combine documents',
    shortExplanation: 'Join multiple separate PDF documents into a single organized file in seconds.',
    actionButtonText: 'Merge PDF',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-orange-400 dark:hover:border-orange-500',
      actionTag: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-900/60',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
  },
  'split-pdf': {
    visual: SplitPdfVisual,
    actionLabel: 'Extract selected pages',
    shortExplanation: 'Extract specific page ranges or split a multi-page PDF into independent files.',
    actionButtonText: 'Split PDF',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-500',
      actionTag: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  },
  'pdf-page-organizer': {
    visual: OrganizePdfVisual,
    actionLabel: 'Reorder & rotate pages',
    shortExplanation: 'Visually rearrange, rotate, duplicate, and sort PDF pages with drag-and-drop ease.',
    actionButtonText: 'Organize Pages',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-indigo-400 dark:hover:border-indigo-500',
      actionTag: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  },
  'delete-pdf-pages': {
    visual: DeletePdfPagesVisual,
    actionLabel: 'Remove unwanted pages',
    shortExplanation: 'Drop individual or multiple unnecessary pages from any PDF document quickly.',
    actionButtonText: 'Delete Pages',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-rose-400 dark:hover:border-rose-500',
      actionTag: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/60',
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
  },
  'pdf-to-editable-word': {
    visual: PdfToWordVisual,
    actionLabel: 'Convert to editable DOCX',
    shortExplanation: 'High-fidelity conversion preserving formatted headings, paragraphs, and tables.',
    actionButtonText: 'Convert to Word',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'pdf-to-word': {
    visual: PdfToWordVisual,
    actionLabel: 'Convert PDF to Word',
    shortExplanation: 'Transform PDF documents into editable Microsoft Word (.docx) files smoothly.',
    actionButtonText: 'PDF to Word',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'word-to-pdf': {
    visual: WordToPdfVisual,
    actionLabel: 'Convert Word to PDF',
    shortExplanation: 'Render Word DOCX files into polished, shareable, print-ready PDF documents.',
    actionButtonText: 'Word to PDF',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'sign-pdf': {
    visual: SignPdfVisual,
    actionLabel: 'Add digital signature',
    shortExplanation: 'Draw, type, or stamp your personal signature directly onto agreement pages.',
    actionButtonText: 'Sign PDF',
    categoryTag: 'Security & Sign',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'watermark-pdf': {
    visual: WatermarkPdfVisual,
    actionLabel: 'Apply custom watermark',
    shortExplanation: 'Stamp custom text or confidential copyright watermarks across all PDF pages.',
    actionButtonText: 'Watermark PDF',
    categoryTag: 'Security & Sign',
    accentClass: {
      borderHover: 'hover:border-purple-400 dark:hover:border-purple-500',
      actionTag: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  },
  'protect-pdf': {
    visual: ProtectPdfVisual,
    actionLabel: 'Lock with password',
    shortExplanation: 'Encrypt confidential PDF documents with custom master and user passwords.',
    actionButtonText: 'Protect PDF',
    categoryTag: 'Security & Sign',
    accentClass: {
      borderHover: 'hover:border-red-400 dark:hover:border-red-500',
      actionTag: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-900/60',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
  },
  'pdf-id-redactor': {
    visual: RedactIdVisual,
    actionLabel: 'Mask Aadhaar / Bank / Salary',
    shortExplanation: 'Permanently blackout or blur sensitive IDs, account numbers & salary figures 100% offline.',
    actionButtonText: 'Redact PDF / ID',
    categoryTag: 'Offline Privacy',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'pdf-to-images': {
    visual: PdfToImagesVisual,
    actionLabel: 'Export pages as images',
    shortExplanation: 'Convert every PDF page into high-resolution JPG or PNG pictures.',
    actionButtonText: 'PDF to Images',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-500',
      actionTag: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  },
  'image-to-pdf': {
    visual: ImageToPdfVisual,
    actionLabel: 'Combine photos into PDF',
    shortExplanation: 'Turn multiple photos, receipts, or scans into a single neatly bound PDF file.',
    actionButtonText: 'Image to PDF',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'searchable-pdf-text-finder': {
    visual: SearchablePdfVisual,
    actionLabel: 'Search & OCR scanned PDF',
    shortExplanation: 'Run in-browser OCR to find names, dates & words inside scanned PDF documents.',
    actionButtonText: 'Find in PDF',
    categoryTag: 'OCR & Search',
    accentClass: {
      borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
      actionTag: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-900/60',
      button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    },
  },
  'page-numbers-pdf': {
    visual: PageNumbersVisual,
    actionLabel: 'Add footer page numbers',
    shortExplanation: 'Insert automatic page numbers or Bates numbering in clean headers and footers.',
    actionButtonText: 'Add Page Numbers',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'pdf-metadata': {
    visual: ProtectPdfVisual,
    actionLabel: 'Inspect & wipe metadata',
    shortExplanation: 'Read and permanently sanitize author, creator, and camera metadata from PDFs.',
    actionButtonText: 'Wipe Metadata',
    categoryTag: 'Security & Sign',
    accentClass: {
      borderHover: 'hover:border-slate-400 dark:hover:border-slate-500',
      actionTag: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      button: 'bg-slate-700 hover:bg-slate-800 text-white',
    },
  },
  'pdf-text-extractor': {
    visual: OcrToolVisual,
    actionLabel: 'Extract readable text stream',
    shortExplanation: 'Copy entire document text, get word counts, and export raw text streams.',
    actionButtonText: 'Extract Text',
    categoryTag: 'Smart Utilities',
    accentClass: {
      borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
      actionTag: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-900/60',
      button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    },
  },

  // =================== IMAGE TOOLS ===================
  'custom-photo-resizer': {
    visual: CustomPhotoStudioCardVisual,
    actionLabel: 'Upload Once — Do Everything',
    shortExplanation: 'All-in-one photo studio: resize, crop, edit, rotate, straighten, compress & convert.',
    actionButtonText: 'Photo Studio',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
    },
  },
  'photo-size-compressor': {
    visual: CompressImageVisual,
    actionLabel: 'Compress to target KB',
    shortExplanation: 'Shrink photo file size to 20KB, 50KB or custom limits while maintaining clarity.',
    actionButtonText: 'Compress Photo',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'jpg-to-png': {
    visual: JpgToPngVisual,
    actionLabel: 'Add transparency & PNG',
    shortExplanation: 'Convert solid JPG photos into versatile, transparent PNG graphic files.',
    actionButtonText: 'JPG to PNG',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-purple-400 dark:hover:border-purple-500',
      actionTag: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  },
  'png-to-jpg': {
    visual: PngToJpgVisual,
    actionLabel: 'Compress PNG to JPG',
    shortExplanation: 'Convert heavy PNG graphics into lightweight, highly compressed JPG photos.',
    actionButtonText: 'PNG to JPG',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-500',
      actionTag: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  },
  'hd-image-enhancer': {
    visual: ImageEnhancerVisual,
    actionLabel: 'Sharpen & enhance clarity',
    shortExplanation: 'Intelligently enhance blurry photos, sharpen edges, and increase clarity locally.',
    actionButtonText: 'Enhance Photo',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-indigo-400 dark:hover:border-indigo-500',
      actionTag: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  },
  'crop-rotate-straighten': {
    visual: ImageCropVisual,
    actionLabel: 'Crop & angle straightening',
    shortExplanation: 'Precise aspect ratio framing, angle leveling, and custom image cropping.',
    actionButtonText: 'Crop & Rotate',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
      actionTag: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-900/60',
      button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    },
  },
  'passport-photo-cropper': {
    visual: PassportCropVisual,
    actionLabel: 'Official passport crop',
    shortExplanation: 'Cut portraits to standard 2×2 inch, 35×45mm government passport specifications.',
    actionButtonText: 'Passport Cropper',
    categoryTag: 'Gov & Exam',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'photo-signature-resizer': {
    visual: ExamPhotoSignatureVisual,
    actionLabel: 'UPSC / SSC exam presets',
    shortExplanation: 'One-click exact sizing (20KB–50KB / 140×60 px) for official exam portals.',
    actionButtonText: 'Exam Presets',
    categoryTag: 'Gov & Exam',
    accentClass: {
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-500',
      actionTag: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  },
  'photo-editor': {
    visual: ImageCropVisual,
    actionLabel: 'Adjust brightness & filters',
    shortExplanation: 'Full photo editing suite with exposure, contrast, temperature, and crop controls.',
    actionButtonText: 'Photo Editor',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-teal-400 dark:hover:border-teal-500',
      actionTag: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/60',
      button: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
  },
  'photo-background-changer': {
    visual: PhotoBgChangerVisual,
    actionLabel: 'Replace background color',
    shortExplanation: 'Segment photo subjects and replace background with official white or studio blue.',
    actionButtonText: 'Change Background',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'image-converter': {
    visual: JpgToPngVisual,
    actionLabel: 'Convert format (WebP/JPG)',
    shortExplanation: 'Convert between JPG, PNG, WebP, and BMP formats instantly in your browser.',
    actionButtonText: 'Convert Format',
    categoryTag: 'Image Tools',
    accentClass: {
      borderHover: 'hover:border-purple-400 dark:hover:border-purple-500',
      actionTag: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  },
  'combine-app-documents': {
    visual: MergePdfVisual,
    actionLabel: 'Combine job application docs',
    shortExplanation: 'Merge candidate photo, signature, and ID proofs into 1 single submission document.',
    actionButtonText: 'Combine Docs',
    categoryTag: 'Gov & Exam',
    accentClass: {
      borderHover: 'hover:border-indigo-400 dark:hover:border-indigo-500',
      actionTag: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  },
  'ocr-tool': {
    visual: OcrToolVisual,
    actionLabel: 'Extract text from photo/PDF',
    shortExplanation: 'Recognize printed and handwritten English and Hindi text from photos and scans.',
    actionButtonText: 'Extract OCR Text',
    categoryTag: 'OCR & Utilities',
    accentClass: {
      borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
      actionTag: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-900/60',
      button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    },
  },

  // =================== SPREADSHEETS & TABLES ===================
  'excel-to-pdf': {
    visual: ExcelToPdfVisual,
    actionLabel: 'Export spreadsheet as PDF',
    shortExplanation: 'Render Excel XLSX tables into clean, formatted, print-ready PDF reports.',
    actionButtonText: 'Excel to PDF',
    categoryTag: 'Spreadsheets',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'pdf-to-excel': {
    visual: PdfToExcelVisual,
    actionLabel: 'Extract tables to Excel',
    shortExplanation: 'Extract financial statements and tables from PDF files into editable spreadsheets.',
    actionButtonText: 'PDF to Excel',
    categoryTag: 'Spreadsheets',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'csv-to-xlsx': {
    visual: CsvToXlsxVisual,
    actionLabel: 'Format CSV as Excel',
    shortExplanation: 'Convert raw comma-separated CSV text into formatted Excel workbook spreadsheets.',
    actionButtonText: 'CSV to Excel',
    categoryTag: 'Spreadsheets',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'xlsx-to-csv': {
    visual: XlsxToCsvVisual,
    actionLabel: 'Export Excel to CSV',
    shortExplanation: 'Flatten Excel spreadsheet worksheets into lightweight, universal CSV files.',
    actionButtonText: 'Excel to CSV',
    categoryTag: 'Spreadsheets',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'sheet-viewer': {
    visual: SheetViewerVisual,
    actionLabel: 'Preview spreadsheet rows',
    shortExplanation: 'Open and inspect Excel and CSV tables in an interactive tabular grid viewer.',
    actionButtonText: 'View Spreadsheet',
    categoryTag: 'Spreadsheets',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },

  // =================== POWERPOINT TOOLS ===================
  'powerpoint-to-pdf': {
    visual: PptToPdfVisual,
    actionLabel: 'Convert presentation to PDF',
    shortExplanation: 'Turn PowerPoint presentation slides (.pptx) into clean, shareable PDF documents.',
    actionButtonText: 'PPTX to PDF',
    categoryTag: 'PowerPoint',
    accentClass: {
      borderHover: 'hover:border-orange-400 dark:hover:border-orange-500',
      actionTag: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-900/60',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
  },
  'pptx-to-txt': {
    visual: TextCleanerVisual,
    actionLabel: 'Extract slide text',
    shortExplanation: 'Extract speaker notes and slide text content from PowerPoint presentations.',
    actionButtonText: 'Extract Slide Text',
    categoryTag: 'PowerPoint',
    accentClass: {
      borderHover: 'hover:border-orange-400 dark:hover:border-orange-500',
      actionTag: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-900/60',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
  },

  // =================== TEXT & WORD UTILITIES ===================
  'docx-to-txt': {
    visual: TextCleanerVisual,
    actionLabel: 'Strip formatting to text',
    shortExplanation: 'Extract raw, clean, unformatted plain text from Microsoft Word documents.',
    actionButtonText: 'Word to Plain Text',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'docx-to-html': {
    visual: WordToPdfVisual,
    actionLabel: 'Convert DOCX to HTML',
    shortExplanation: 'Convert Microsoft Word documents into clean, semantic HTML5 web markup.',
    actionButtonText: 'Word to HTML',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'txt-to-pdf': {
    visual: WordToPdfVisual,
    actionLabel: 'Convert text to PDF',
    shortExplanation: 'Turn raw text notes and code into paginated, formatted PDF documents.',
    actionButtonText: 'Text to PDF',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-500',
      actionTag: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  },
  'markdown-to-pdf': {
    visual: WordToPdfVisual,
    actionLabel: 'Render Markdown to PDF',
    shortExplanation: 'Convert Markdown notes, headings, and code blocks into styled PDF reports.',
    actionButtonText: 'Markdown to PDF',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-indigo-400 dark:hover:border-indigo-500',
      actionTag: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  },
  'text-cleaner': {
    visual: TextCleanerVisual,
    actionLabel: 'Normalize spacing & case',
    shortExplanation: 'Clean up erratic whitespace, duplicate line breaks, and convert letter cases.',
    actionButtonText: 'Clean Text',
    categoryTag: 'Smart Utilities',
    accentClass: {
      borderHover: 'hover:border-purple-400 dark:hover:border-purple-500',
      actionTag: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  },
  'text-diff-comparator': {
    visual: TextDiffVisual,
    actionLabel: 'Compare text differences',
    shortExplanation: 'Inspect two versions of text side-by-side with added and deleted line highlights.',
    actionButtonText: 'Compare Diff',
    categoryTag: 'Smart Utilities',
    accentClass: {
      borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
      actionTag: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-900/60',
      button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    },
  },
};

export const getToolVisualSpec = (toolId: string, fallbackTitle = ''): ToolVisualSpec => {
  if (TOOL_VISUAL_REGISTRY[toolId]) {
    return TOOL_VISUAL_REGISTRY[toolId];
  }

  // Graceful fallback
  return {
    visual: () => <GenericToolVisual title={fallbackTitle || toolId} />,
    actionLabel: 'Open tool',
    shortExplanation: 'Process document and image operations locally in your browser.',
    actionButtonText: 'Open Tool',
    categoryTag: 'PottoTools',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };
};
