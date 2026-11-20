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
  UnlockPdfVisual,
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
  RemoveScanWatermarkVisual,
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
    actionLabel: 'Convert to editable Word',
    shortExplanation: 'Turn PDFs into editable Word files while keeping headings, layout, and tables.',
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
    shortExplanation: 'Turn any PDF document into an editable Microsoft Word (.docx) file easily.',
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
    shortExplanation: 'Turn Word (.docx) files into clean, ready-to-share PDF documents.',
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
  'remove-scan-watermark': {
    visual: RemoveScanWatermarkVisual,
    actionLabel: 'Clean scanner app labels',
    shortExplanation: 'Remove unwanted scanner app labels from your scanned PDF pages.',
    actionButtonText: 'Remove Watermark',
    categoryTag: 'PDF Tools',
    accentClass: {
      borderHover: 'hover:border-teal-400 dark:hover:border-teal-500',
      actionTag: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/60',
      button: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
  },
  'protect-pdf': {
    visual: ProtectPdfVisual,
    actionLabel: 'Lock PDF with password',
    shortExplanation: 'Add a strong password to lock your PDF and stop unwanted printing or copying.',
    actionButtonText: 'Protect PDF',
    categoryTag: 'PDF Security',
    accentClass: {
      borderHover: 'hover:border-red-400 dark:hover:border-red-500',
      actionTag: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-900/60',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
  },
  'unlock-pdf': {
    visual: UnlockPdfVisual,
    actionLabel: 'Remove PDF password',
    shortExplanation: 'Unlock password-protected PDFs like e-Aadhaar and bank statements safely on your device.',
    actionButtonText: 'Unlock PDF',
    categoryTag: 'PDF Security',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'pdf-id-redactor': {
    visual: RedactIdVisual,
    actionLabel: 'Hide Aadhaar / Bank / Salary',
    shortExplanation: 'Blackout or blur private ID numbers, bank details, and salary figures safely offline.',
    actionButtonText: 'Hide Private Info',
    categoryTag: 'Offline Privacy',
    accentClass: {
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      actionTag: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  'pdf-to-images': {
    visual: PdfToImagesVisual,
    actionLabel: 'Save pages as photos',
    shortExplanation: 'Turn every PDF page into clear JPG or PNG pictures you can easily share.',
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
    shortExplanation: 'Turn multiple photos, bills, or scans into one clean PDF file.',
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
    actionLabel: 'Search words in scanned PDF',
    shortExplanation: 'Find names, dates, and words inside scanned PDFs and download a searchable PDF.',
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
    actionLabel: 'Add page numbers',
    shortExplanation: 'Add clean automatic page numbers to the top or bottom of every PDF page.',
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
    actionLabel: 'Remove hidden file info',
    shortExplanation: 'View and clear hidden details like author name, device info, and creation date.',
    actionButtonText: 'Remove Hidden Info',
    categoryTag: 'Security & Sign',
    accentClass: {
      borderHover: 'hover:border-slate-400 dark:hover:border-slate-500',
      actionTag: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      button: 'bg-slate-700 hover:bg-slate-800 text-white',
    },
  },
  'pdf-text-extractor': {
    visual: OcrToolVisual,
    actionLabel: 'Copy text from PDF',
    shortExplanation: 'Copy all text from a PDF, count words, and save it as a plain text file.',
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
    actionLabel: 'Make blurry photos sharper',
    shortExplanation: 'Sharpen blurry photos, reduce grain, and improve photo clarity right on your device.',
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
    actionLabel: 'Crop & straighten photos',
    shortExplanation: 'Crop, rotate, flip, and fix tilted photos in seconds.',
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
    actionLabel: 'Passport size crop',
    shortExplanation: 'Crop photos to standard 35×45mm or 2×2 inch passport and visa sizes.',
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
    shortExplanation: 'One-click exact photo & signature sizing (20KB–50KB) for exam forms.',
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
    actionLabel: 'Brightness, crop & filters',
    shortExplanation: 'Easy photo editor to adjust brightness, contrast, crop, and rotate photos.',
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
    actionLabel: 'Change background color',
    shortExplanation: 'Change your photo background to clean white, light blue, or any color.',
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
    actionLabel: 'Save Excel as PDF',
    shortExplanation: 'Turn Excel (.xlsx) sheets into neat, ready-to-share PDF tables.',
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
    actionLabel: 'PDF tables to Excel',
    shortExplanation: 'Copy tables and rows from PDF files into an editable Excel spreadsheet.',
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
    actionLabel: 'Convert CSV to Excel',
    shortExplanation: 'Turn simple CSV files into neat Excel (.xlsx) spreadsheets.',
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
    actionLabel: 'Convert Excel to CSV',
    shortExplanation: 'Save any Excel spreadsheet sheet as a simple, universal CSV file.',
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
    actionLabel: 'Open Excel & CSV files',
    shortExplanation: 'View, search, and filter Excel and CSV tables right in your browser.',
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
    actionLabel: 'Convert slides to PDF',
    shortExplanation: 'Turn PowerPoint (.pptx) slides into clean, easy-to-share PDF pages.',
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
    shortExplanation: 'Copy all text and notes from PowerPoint slides into plain text.',
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
    actionLabel: 'Word to plain text',
    shortExplanation: 'Copy clean plain text from Microsoft Word files without extra styling.',
    actionButtonText: 'Word to Text',
    categoryTag: 'Word & Docs',
    accentClass: {
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-500',
      actionTag: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  },
  'docx-to-html': {
    visual: WordToPdfVisual,
    actionLabel: 'Word to HTML',
    shortExplanation: 'Turn Microsoft Word documents into clean HTML code for websites and blogs.',
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
    shortExplanation: 'Turn plain text notes into clean, printable PDF pages.',
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
    actionLabel: 'Markdown to PDF',
    shortExplanation: 'Turn Markdown (.md) notes and headings into a neatly formatted PDF.',
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
    actionLabel: 'Fix spacing & text case',
    shortExplanation: 'Remove extra spaces, fix blank lines, and switch between UPPERCASE and lowercase.',
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
    actionLabel: 'Compare two texts',
    shortExplanation: 'Compare two pieces of text side by side to quickly see what was added or removed.',
    actionButtonText: 'Compare Text',
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
