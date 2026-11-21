export type ToolCategory =
  | 'organize-pdf'
  | 'compress-pdf'
  | 'convert-docs'
  | 'convert-images'
  | 'ocr-scanned'
  | 'pdf-security'
  | 'gov-tools'
  | 'smart-utilities'
  | 'spreadsheets'
  | 'pdf-tools'
  | 'word-tools'
  | 'excel-tools'
  | 'powerpoint-tools'
  | 'image-tools'
  | 'other-document-tools';

export type ToolStatus = 'tested' | 'validated' | 'not-implemented';

export interface ToolDefinition {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  category: ToolCategory;
  categoryName: string;
  subCategory?: string;
  iconName: string;
  badge?: string;
  isPopular?: boolean;
  status: ToolStatus;
  processingLocation: 'browser';
  acceptedFormats: string[];
  maxFileSizeMB: number;
  outputFormat: string;
  instructions: string[];
  faqs: { question: string; answer: string }[];
  limitations: string[];
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  statusText: string;
  error: string | null;
  success: boolean;
}
