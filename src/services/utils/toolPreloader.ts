/**
 * PottoTools - On-Demand Tool & Chunk Preloader
 * Triggers prefetching of heavy component chunks when a user hovers over a tool card
 * or category button, so that clicking loads in 0 milliseconds.
 */

type PreloadFn = () => Promise<unknown>;

const preloadedChunks = new Set<string>();

const chunkLoaders: Record<string, PreloadFn> = {
  // Tool components
  'compress-pdf': () => import('../../components/tools/PdfCompressorTool'),
  'organize-pdf': () => import('../../components/tools/PdfOrganizeTool'),
  'pdf-page-organizer': () => import('../../components/tools/PdfPageOrganizerTool'),
  'searchable-pdf-text-finder': () => import('../../components/tools/SearchablePdfTextFinderTool'),
  'gov-resizer': () => import('../../components/tools/GovPhotoResizerTool'),
  'photo-studio': () => import('../../components/tools/PhotoStudioWorkspace'),
  'pdf-to-editable-word': () => import('../../components/tools/PdfToEditableWordTool'),
  'doc-converter': () => import('../../components/tools/DocumentConverterTool'),
  'image-converter': () => import('../../components/tools/ImageConverterTool'),
  'ocr-tool': () => import('../../components/tools/OcrTool'),
  'pdf-security': () => import('../../components/tools/PdfSecurityTool'),
  'pdf-id-redactor': () => import('../../components/tools/PdfRedactorTool'),
  'remove-scan-watermark': () => import('../../components/tools/RemoveScanWatermarkTool'),
  'spreadsheet': () => import('../../components/tools/SpreadsheetTool'),
  'smart-text': () => import('../../components/tools/SmartTextTools'),
  'powerpoint-to-pdf': () => import('../../components/tools/PowerPointTool'),

  // Legal & informational pages
  'privacy': () => import('../../components/legal/PrivacyPolicy'),
  'terms': () => import('../../components/legal/TermsOfUse'),
  'about': () => import('../../components/legal/AboutPage'),
  'contact': () => import('../../components/legal/ContactPage'),
  'disclaimer': () => import('../../components/legal/DisclaimerPage'),
  'blog': () => import('../../components/pages/BlogPage'),
};

const toolToChunkKey: Record<string, string> = {
  'pdf-page-organizer': 'pdf-page-organizer',
  'searchable-pdf-text-finder': 'searchable-pdf-text-finder',
  'search-scanned-pdf': 'searchable-pdf-text-finder',
  'compress-pdf': 'compress-pdf',
  'merge-pdf': 'organize-pdf',
  'split-pdf': 'organize-pdf',
  'delete-pdf-pages': 'organize-pdf',
  'watermark-pdf': 'organize-pdf',
  'page-numbers-pdf': 'organize-pdf',
  'custom-photo-resizer': 'photo-studio',
  'photo-size-compressor': 'photo-studio',
  'photo-signature-resizer': 'photo-studio',
  'photo-editor': 'photo-studio',
  'hd-image-enhancer': 'photo-studio',
  'image-format-converter': 'photo-studio',
  'crop-rotate-straighten': 'photo-studio',
  'photo-background-changer': 'photo-studio',
  'passport-photo-cropper': 'gov-resizer',
  'combine-app-documents': 'gov-resizer',
  'pdf-to-editable-word': 'pdf-to-editable-word',
  'pdf-to-word': 'doc-converter',
  'word-to-pdf': 'doc-converter',
  'docx-to-txt': 'doc-converter',
  'docx-to-html': 'doc-converter',
  'txt-to-pdf': 'doc-converter',
  'markdown-to-pdf': 'doc-converter',
  'image-converter': 'image-converter',
  'image-to-pdf': 'image-converter',
  'pdf-to-images': 'image-converter',
  'jpg-to-png': 'image-converter',
  'png-to-jpg': 'image-converter',
  'ocr-tool': 'ocr-tool',
  'protect-pdf': 'pdf-security',
  'unlock-pdf': 'pdf-security',
  'pdf-id-redactor': 'pdf-id-redactor',
  'remove-scan-watermark': 'remove-scan-watermark',
  'sign-pdf': 'pdf-security',
  'pdf-metadata': 'pdf-security',
  'csv-to-xlsx': 'spreadsheet',
  'xlsx-to-csv': 'spreadsheet',
  'sheet-viewer': 'spreadsheet',
  'excel-to-pdf': 'spreadsheet',
  'pdf-to-excel': 'spreadsheet',
  'powerpoint-to-pdf': 'powerpoint-to-pdf',
  'pdf-text-extractor': 'smart-text',
  'text-diff-comparator': 'smart-text',
  'text-cleaner': 'smart-text',
};

/**
 * Preload tool component chunk into browser cache ahead of user click
 */
export function preloadTool(toolIdOrSlug: string): void {
  const chunkKey = toolToChunkKey[toolIdOrSlug] || toolIdOrSlug;
  if (!chunkKey || preloadedChunks.has(chunkKey)) return;

  const loader = chunkLoaders[chunkKey];
  if (loader) {
    preloadedChunks.add(chunkKey);
    // Use requestIdleCallback if available to avoid any main-thread contention
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        loader().catch(() => {
          preloadedChunks.delete(chunkKey);
        });
      });
    } else {
      setTimeout(() => {
        loader().catch(() => {
          preloadedChunks.delete(chunkKey);
        });
      }, 100);
    }
  }
}

/**
 * Preload view chunk (e.g. 'about', 'contact', 'privacy')
 */
export function preloadView(viewName: string): void {
  if (preloadedChunks.has(viewName)) return;
  const loader = chunkLoaders[viewName];
  if (loader) {
    preloadedChunks.add(viewName);
    loader().catch(() => {
      preloadedChunks.delete(viewName);
    });
  }
}
