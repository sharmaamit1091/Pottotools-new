import { ToolDefinition, ToolCategory } from '../types/tools';
export type { ToolDefinition, ToolCategory };

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  iconName: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'organize-pdf',
    name: '1. Organize PDF',
    description: 'Merge, split, extract, reorder, delete, and duplicate PDF pages with ease.',
    iconName: 'Layers',
  },
  {
    id: 'compress-pdf',
    name: '2. Compress & Optimize PDF',
    description: 'Reduce PDF file size down to target 100KB, 200KB, 500KB or custom limits while maintaining clarity.',
    iconName: 'Minimize2',
  },
  {
    id: 'convert-docs',
    name: '3. Convert Documents',
    description: 'High-fidelity document conversion: Word DOCX to PDF, PDF to editable Word DOCX, TXT and Markdown.',
    iconName: 'FileText',
  },
  {
    id: 'convert-images',
    name: '4. Image Tools',
    description: 'Resize dimensions, compress file size in KB, photo editor, UPSC/SSC exam photo & signature presets, HD enhancer, and convert JPG, PNG, WebP.',
    iconName: 'Image',
  },
  {
    id: 'ocr-scanned',
    name: '5. OCR & Scanned Documents',
    description: 'Extract text from scanned PDFs and photos using in-browser OCR with English and Hindi language models.',
    iconName: 'ScanText',
  },
  {
    id: 'pdf-security',
    name: '6. PDF Security & Signing',
    description: 'Strip hidden PDF metadata, rebuild clean PDF streams, redact sensitive IDs, apply canvas signatures, and inspect document properties.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'smart-utilities',
    name: '7. Smart Document Utilities',
    description: 'Text extractors, word & character counters, text cleaners, and side-by-side document text comparison.',
    iconName: 'Sparkles',
  },
  {
    id: 'spreadsheets',
    name: '8. Office Spreadsheets',
    description: 'Convert CSV to XLSX spreadsheets, XLSX to CSV, and inspect worksheets with interactive tabular viewers.',
    iconName: 'Sheet',
  },
];

export const TOOLS: ToolDefinition[] = [
  // Find Anything in Scanned PDFs (Searchable PDF & In-Browser OCR Text Finder)
  {
    id: 'searchable-pdf-text-finder',
    slug: 'searchable-pdf-text-finder',
    title: 'Find Anything in Scanned PDFs',
    shortDesc: 'Search for names, dates, amounts & phrases inside scanned PDFs and download as searchable PDF with OCR.',
    fullDesc: 'Upload image-based, scanned, or digital multipage PDFs up to 500 MB. Automatically inspect digital text, run in-browser OCR for scanned pages (English & Hindi), search for specific words, names, government order numbers, dates, and sentences with highlighted snippets, copy recognized text, and download a searchable PDF (note: the exported PDF invisible text layer embeds Latin/ASCII text).',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'ScanText',
    isPopular: true,
    badge: 'OCR & Search',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 500,
    outputFormat: 'Searchable PDF (.pdf)',
    instructions: [
      'Upload any scanned, image-based, or regular PDF document.',
      'The tool immediately inspects all pages, identifying which pages have extractable digital text and which require OCR.',
      'If your document has scanned pages, click "Start OCR" to run optical character recognition (English & Hindi supported; first run downloads language traineddata ~10–25 MB before caching).',
      'Type any keyword, name, date, invoice number, or sentence into the search box to find matching snippets with page numbers.',
      'Click "Download Searchable PDF" to export a new PDF containing an invisible selectable text layer for English/Latin characters (for Hindi scans, use the in-app search & copy view).',
    ],
    faqs: [
      {
        question: 'How does searching inside scanned PDFs work?',
        answer: 'Scanned PDFs contain flat photos of pages rather than computer text. PottoTools uses an integrated OCR engine (Tesseract.js) to recognize words directly in your browser. You can then search across all pages instantly.',
      },
      {
        question: 'What is a Searchable PDF?',
        answer: 'A Searchable PDF keeps the original scanned page appearance completely intact, but adds an invisible, selectable text layer behind or over the image. When you open it in Adobe Acrobat, Chrome, or Preview, you can use Ctrl+F to find English/ASCII words and select text with your cursor.',
      },
      {
        question: 'Which OCR languages are supported?',
        answer: 'PottoTools supports English and Hindi in-browser OCR models for text extraction and in-app keyword search. Note that exported Searchable PDFs use Helvetica font encoding, so Hindi/Devanagari characters work inside the in-app search and copy box rather than the exported PDF invisible Ctrl+F layer.',
      },
      {
        question: 'Are my scanned documents uploaded to any remote server?',
        answer: 'No. All PDF inspection, canvas rendering, OCR recognition, and searchable PDF compilation execute 100% locally inside your web browser using WebAssembly (initial OCR language files download ~10–25 MB on first run and are cached afterward). Your documents never leave your computer or phone.',
      },
    ],
    limitations: [
      'Extremely blurry, low-resolution, or heavily handwritten documents may experience lower OCR accuracy.',
      'Exported Searchable PDF invisible text layers encode Latin/ASCII characters; Hindi OCR results are fully searchable and copyable inside the browser tool.',
      'Password-encrypted PDFs must be unlocked before searching or running OCR.',
    ],
  },

  // PDF Page Organizer (High-Capacity Visual Organizer)
  {
    id: 'pdf-page-organizer',
    slug: 'pdf-page-organizer',
    title: 'PDF Page Organizer',
    shortDesc: 'Visually reorder, rotate individual pages, and delete unwanted sheets in large PDFs up to 500 MB.',
    fullDesc: 'Upload large multipage PDFs up to 500 MB. View visual thumbnail previews of every page in a numbered grid, drag and drop pages to reorder them, rotate individual pages by 90°, 180°, or 270°, delete unneeded pages with undo restoration, and download your organized PDF with 100% original quality preserved.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'Layers',
    isPopular: true,
    badge: 'Up to 500 MB',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 500,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload any multi-page PDF document up to 500 MB (including scanned documents and mixed orientations).',
      'Drag and drop any thumbnail card to reorder pages across the document.',
      'Use the clockwise and counter-clockwise rotation buttons to adjust individual sideways or upside-down pages.',
      'Click the trash button on any page you want to remove, with one-click Undo anytime before downloading.',
      'Click "Download Organized PDF" to generate your new document with all orientations and page orders losslessly applied.',
    ],
    faqs: [
      {
        question: 'What is the maximum allowed file size for the PDF Page Organizer?',
        answer: 'You can upload PDF files up to 500 MB (524,288,000 bytes) and 500+ pages. Files exceeding 500 MB are automatically rejected with a clear message to maintain smooth browser performance.',
      },
      {
        question: 'Can I rotate individual pages without rotating the whole PDF?',
        answer: 'Yes! Every page thumbnail has independent 90° clockwise and counter-clockwise rotation controls. You can rotate individual landscape maps or receipts while keeping the rest of the document portrait.',
      },
      {
        question: 'Does reordering degrade image or scan quality?',
        answer: 'No. PottoTools uses lossless PDF stream manipulation. Scanned photos, vector text, and document dimensions are preserved with 100% original quality.',
      },
      {
        question: 'What if I accidentally delete a page?',
        answer: 'You can immediately click "Undo" or restore any removed page from the Removed Pages tray before downloading.',
      },
    ],
    limitations: ['Password-encrypted PDFs must be unlocked before organizing.'],
  },

  // 1. Organize PDF
  {
    id: 'merge-pdf',
    slug: 'merge-pdf',
    title: 'Merge PDF',
    shortDesc: 'Combine multiple PDF documents into a single organized file in any order.',
    fullDesc: 'Upload multiple PDF files, reorder them to your liking, and combine them into a single coherent PDF document instantly in your browser.',
    category: 'organize-pdf',
    categoryName: 'Organize PDF',
    iconName: 'Combine',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 100,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Select or drag & drop two or more PDF files.',
      'Arrange the files in the order you want them merged.',
      'Click "Merge PDF Documents" to compile the new file.',
      'Download your consolidated PDF instantly.',
    ],
    faqs: [
      {
        question: 'Are my files uploaded to a remote server?',
        answer: 'No. All PDF merging takes place entirely within your browser using WebAssembly and memory streams. Your documents never leave your device.',
      },
      {
        question: 'Is there a limit on how many PDFs I can merge?',
        answer: 'There is no artificial limit. You can merge as many documents as your device memory comfortably allows.',
      },
    ],
    limitations: ['Encrypted PDFs must be unlocked before merging.'],
  },
  {
    id: 'split-pdf',
    slug: 'split-pdf',
    title: 'Split & Extract PDF Pages',
    shortDesc: 'Split a PDF by custom page ranges or extract individual pages into separate documents.',
    fullDesc: 'Specify page numbers or custom page ranges (e.g. 1-3, 5, 8-10) to extract or split any PDF into custom standalone files.',
    category: 'organize-pdf',
    categoryName: 'Organize PDF',
    iconName: 'Split',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 80,
    outputFormat: 'PDF (.pdf) or ZIP',
    instructions: [
      'Upload the PDF you wish to split or extract from.',
      'Review total detected pages and enter desired page ranges (e.g. "1-2, 4").',
      'Select whether to extract into a single document or separate files in a ZIP.',
      'Click "Process Pages" and save your output.',
    ],
    faqs: [
      {
        question: 'How do I specify multiple separate page ranges?',
        answer: 'Use commas and hyphens, such as: 1-5, 8, 11-14. Our parser validates each page number against your document total.',
      },
    ],
    limitations: ['Pages specified beyond the document page count are automatically filtered.'],
  },
  {
    id: 'delete-pdf-pages',
    slug: 'delete-pdf-pages',
    title: 'Delete PDF Pages',
    shortDesc: 'Remove unwanted pages or blank sheets from your PDF file effortlessly.',
    fullDesc: 'Select specific page numbers or ranges (such as 2, 4-6, 10) to permanently remove blank, duplicate, or unwanted pages from any PDF and generate a clean, trimmed document directly in your browser without altering vector text or image clarity.',
    category: 'organize-pdf',
    categoryName: 'Organize PDF',
    iconName: 'Trash2',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 60,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload your PDF document.',
      'Enter the page numbers to remove (e.g. 2, 4-6).',
      'Click "Remove Pages" and download the trimmed document.',
    ],
    faqs: [
      {
        question: 'Can I undo page deletions?',
        answer: 'Your original file on your computer is never touched. You can always re-upload if you need to adjust.',
      },
    ],
    limitations: ['You cannot delete all pages; at least one page must remain.'],
  },
  {
    id: 'watermark-pdf',
    slug: 'watermark-pdf',
    title: 'Watermark PDF',
    shortDesc: 'Add customized text watermarks, confidential stamps, or page numbers across your PDF.',
    fullDesc: 'Protect your documents by stamping custom text watermarks ("CONFIDENTIAL", "DRAFT", copyright notices) with custom opacity, angle, and size.',
    category: 'organize-pdf',
    categoryName: 'Organize PDF',
    iconName: 'Stamp',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 60,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload your PDF document.',
      'Type your watermark text (e.g. "CONFIDENTIAL").',
      'Adjust font size, opacity (10%-100%), and tilt angle.',
      'Click "Apply Watermark" to download the secured PDF.',
    ],
    faqs: [
      {
        question: 'Will the watermark appear on every page?',
        answer: 'Yes, the watermark is rendered cleanly in vector across all pages of the document.',
      },
    ],
    limitations: [],
  },
  {
    id: 'page-numbers-pdf',
    slug: 'page-numbers-pdf',
    title: 'Add Page Numbers to PDF',
    shortDesc: 'Insert clean page numbers at the bottom or top of your PDF document.',
    fullDesc: 'Add crisp, customizable vector page numbering (such as "Page 1 of 12" or "1") to any PDF document with adjustable header or footer positioning, font sizing, margins, and starting page offsets right in your browser.',
    category: 'organize-pdf',
    categoryName: 'Organize PDF',
    iconName: 'Hash',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 60,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload your PDF file.',
      'Select numbering format ("1, 2, 3" or "Page X of Y").',
      'Select position (Bottom Center, Bottom Right, Top Right).',
      'Click "Add Page Numbers" and download your document.',
    ],
    faqs: [
      {
        question: 'Can I start numbering from a specific number?',
        answer: 'Yes, you can configure starting page offset in the settings.',
      },
    ],
    limitations: [],
  },

  // 2. Compress PDF
  {
    id: 'compress-pdf',
    slug: 'compress-pdf',
    title: 'Compress PDF',
    shortDesc: 'Reduce PDF file size down to 100KB, 200KB, 500KB, 1MB, or custom target size.',
    fullDesc: 'Powerful in-browser PDF compressor. Choose preset targets (100KB, 200KB, 500KB, 1MB, 2MB) or input custom target KB/MB limits for job applications, email attachments, and government submissions.',
    category: 'compress-pdf',
    categoryName: 'Compress & Optimize PDF',
    iconName: 'Minimize2',
    isPopular: true,
    badge: 'Popular',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 100,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload the PDF you need to compress.',
      'Select an optimization level or choose a strict target size (e.g. 100KB, 200KB).',
      'Adjust image quality and DPI scaling if needed.',
      'Click "Compress Document" to generate the optimized PDF.',
      'Inspect before/after file sizes and download your optimized document.',
    ],
    faqs: [
      {
        question: 'How does client-side PDF compression work?',
        answer: 'PottoTools first strips redundant metadata, object streams, and structural overhead. When a strict target KB limit cannot be met by stream cleanup alone, it re-renders pages as resolution-scaled compressed JPEG streams directly inside your browser without uploading files.',
      },
      {
        question: 'Will text remain selectable after compression?',
        answer: 'Light stream optimization preserves original vector text as selectable fonts. When hitting aggressive strict KB targets (such as 100 KB on heavy documents), pages are rasterized into compressed JPEG page images to guarantee the target byte ceiling.',
      },
    ],
    limitations: [
      'Meeting aggressive byte limits (like 100 KB) on multi-page PDFs automatically converts pages to compressed raster images, trading text selectability for exact file size compliance.',
      'Extremely dense multi-page documents have a physical minimum byte size.',
    ],
  },

  // 3. Convert Documents
  {
    id: 'pdf-to-editable-word',
    slug: 'pdf-to-editable-word',
    title: 'PDF to Editable Word',
    shortDesc: 'Convert PDF into fully editable Word (.docx) documents with preserved layout, menus, prices, and images.',
    fullDesc: 'Transform PDF documents into genuinely editable Microsoft Word (.docx) files while preserving original designs, backgrounds, colors, fonts, multi-column alignments, food photos/images, tables, and dish prices. Includes automatic OCR for scanned PDFs.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'FileEdit',
    isPopular: true,
    badge: 'Pro Layout + OCR',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 50,
    outputFormat: 'Word (.docx)',
    instructions: [
      'Upload any text-based or scanned PDF document (restaurant menus, resumes, invoices, contracts, brochures).',
      'Select conversion options including photo/logo preservation and scanned page OCR.',
      'Our engine performs geometric layout analysis, multi-column alignment, and image extraction.',
      'Download your genuinely editable Word (.docx) file with preserved design, tables, images, and alignments.',
    ],
    faqs: [
      {
        question: 'How is this different from the standard PDF to Word converter?',
        answer: 'Standard converters strip layout, lose columns, and jumble price alignments or fail on scanned documents. "PDF to Editable Word" uses spatial layout analysis, extracts and embeds photos/logos at exact proportions, formats multi-column items and prices using Word layout tables, and automatically runs in-browser OCR for scanned pages so all text remains genuinely editable.',
      },
      {
        question: 'Does this convert the entire page into a single flat image?',
        answer: 'Never! Every heading, paragraph, menu item, table cell, and price is reconstructed as genuine editable Word text runs that you can select, edit, reformat, and copy.',
      },
      {
        question: 'Are images and food photos preserved?',
        answer: 'Yes. Photos, logos, illustrations, and banners are extracted and embedded directly in the document at their exact positions and aspect ratios.',
      },
      {
        question: 'What if my PDF is scanned or photographed?',
        answer: 'Our built-in Tesseract OCR engine automatically recognizes scanned pages, detects text lines and bounding boxes, and reconstructs editable Word text.',
      },
    ],
    limitations: ['Extremely degraded physical scans with heavy ink bleed or distortion may have minor OCR character inaccuracies.'],
  },
  {
    id: 'pdf-to-word',
    slug: 'pdf-to-word',
    title: 'PDF to Word (.docx)',
    shortDesc: 'Convert PDF documents into genuine, editable Microsoft Word DOCX files.',
    fullDesc: 'Extract selectable digital text and paragraphs from text-based PDFs into clean, editable Microsoft Word (.docx) documents in your browser. (For scanned PDFs or multi-column tables and images, use PDF to Editable Word.)',
    category: 'convert-docs',
    categoryName: 'Convert Documents',
    iconName: 'FileText',
    isPopular: true,
    badge: 'Popular',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 50,
    outputFormat: 'Word (.docx)',
    instructions: [
      'Upload a digital text-based PDF document.',
      'Our engine extracts selectable text streams and reconstructs clean document paragraphs.',
      'Preview the extracted text before downloading.',
      'Click "Convert to Word DOCX" to save a genuine editable OpenXML document.',
    ],
    faqs: [
      {
        question: 'Does this create a real .docx file or just rename the extension?',
        answer: 'It generates a genuine OpenXML Microsoft Word document (.docx) compliant with Microsoft Office, LibreOffice, and Google Docs.',
      },
      {
        question: 'What if my PDF is a scanned photo or has complex multi-column tables?',
        answer: 'This standard tool reads embedded digital text streams quickly. For scanned PDFs, embedded photos, or multi-column menus/tables, use our dedicated "PDF to Editable Word" or "OCR Scanner" tools.',
      },
    ],
    limitations: [
      'Designed for digital selectable-text PDFs; image-only scans and complex multi-column magazine graphics require PDF to Editable Word (with OCR).',
    ],
  },
  {
    id: 'word-to-pdf',
    slug: 'word-to-pdf',
    title: 'Word (.docx) to PDF',
    shortDesc: 'Convert Microsoft Word DOCX documents into clean, shareable PDF files.',
    fullDesc: 'Convert Microsoft Word (.docx) documents into clean, print-ready PDF files directly inside your browser while preserving heading hierarchy, paragraph formatting, bullet lists, and structured tables with zero cloud uploads.',
    category: 'convert-docs',
    categoryName: 'Convert Documents',
    iconName: 'FileCode',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSizeMB: 50,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload your Microsoft Word (.docx) file.',
      'Preview the extracted content and page structure.',
      'Click "Convert to PDF" to compile the vector document.',
      'Download your PDF instantly.',
    ],
    faqs: [
      {
        question: 'Are older .doc files supported?',
        answer: 'Modern .docx (Word 2007+) is fully supported natively in the browser. For older binary .doc, please save as .docx first in Word or LibreOffice.',
      },
    ],
    limitations: [],
  },
  {
    id: 'docx-to-txt',
    slug: 'docx-to-txt',
    title: 'Word DOCX to Plain Text',
    shortDesc: 'Extract pure text content from Word files without formatting bloat.',
    fullDesc: 'Quickly strip XML styling, bloated layout tags, and document metadata to extract clean, readable UTF-8 plain text from Microsoft Word (.docx) files in your browser—ready for copy-pasting or downloading as a lightweight .txt file.',
    category: 'convert-docs',
    categoryName: 'Convert Documents',
    iconName: 'AlignLeft',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSizeMB: 50,
    outputFormat: 'Text (.txt)',
    instructions: [
      'Upload your .docx document.',
      'Review and copy the extracted text or download as a .txt file.',
    ],
    faqs: [
      {
        question: 'Does DOCX to TXT preserve paragraph breaks and headings?',
        answer: 'Yes. Paragraph spacing, line breaks, and list items are cleanly preserved as readable plain text while stripping proprietary Word formatting.',
      },
      {
        question: 'Can I extract text from confidential Word documents without uploading them?',
        answer: 'Yes. The entire .docx XML archive is parsed locally in your browser RAM, so sensitive drafts and contracts never leave your device.',
      },
      {
        question: 'Why convert a Word document to a .txt file?',
        answer: 'Plain text files strip hidden formatting, fonts, and macros, making text safe to paste into CMS editors, code repositories, email forms, and NLP scripts.',
      },
    ],
    limitations: ['Images, embedded charts, and complex table styling are omitted in plain text (.txt) output.'],
  },
  {
    id: 'docx-to-html',
    slug: 'docx-to-html',
    title: 'Word DOCX to HTML',
    shortDesc: 'Convert Word documents into clean, semantic HTML web markup.',
    fullDesc: 'Convert Microsoft Word (.docx) files into clean, semantic HTML5 markup with proper heading tags, lists, tables, and inline emphasis—ready to publish on websites, blogs, newsletters, and CMS platforms without messy Word styles.',
    category: 'convert-docs',
    categoryName: 'Convert Documents',
    iconName: 'Code',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSizeMB: 50,
    outputFormat: 'HTML (.html)',
    instructions: [
      'Upload your .docx file.',
      'Inspect the generated semantic HTML code and visual preview.',
      'Copy the HTML code or download the .html file.',
    ],
    faqs: [
      {
        question: 'Does the generated HTML strip messy Microsoft Word inline CSS?',
        answer: 'Yes. PottoTools uses semantic conversion to output clean h1–h6 headings, p paragraphs, ul lists, strong emphasis, and table markup without bloated MsoNormal classes.',
      },
      {
        question: 'Can I preview the rendered HTML before downloading?',
        answer: 'Yes. You can switch between the live visual web preview and the raw HTML source code before copying or downloading.',
      },
      {
        question: 'Is my Word file uploaded to a server for conversion?',
        answer: 'No. Your .docx file is parsed completely inside your web browser with zero server uploads or data logging.',
      },
    ],
    limitations: ['Custom desktop fonts and complex floating text boxes are mapped to standard semantic web block elements.'],
  },
  {
    id: 'txt-to-pdf',
    slug: 'txt-to-pdf',
    title: 'Text to PDF',
    shortDesc: 'Convert plain text notes or code into neatly formatted PDF documents.',
    fullDesc: 'Paste plain text or upload any .txt file, customize font sizing, line height, and page margins, and generate a crisp, paginated, print-ready PDF document locally in your browser within seconds.',
    category: 'convert-docs',
    categoryName: 'Convert Documents',
    iconName: 'FilePlus',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.txt', 'text/plain'],
    maxFileSizeMB: 20,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Paste your text or upload a .txt file.',
      'Configure font size and line spacing.',
      'Click "Generate PDF" to download.',
    ],
    faqs: [
      {
        question: 'Does Text to PDF automatically wrap long lines and add page breaks?',
        answer: 'Yes. Long lines wrap cleanly within your chosen page margins, and multi-page text is automatically paginated into standard A4 or Letter PDF sheets.',
      },
      {
        question: 'Can I customize the font size and spacing before generating the PDF?',
        answer: 'Yes. You can adjust font size and line spacing so code snippets, notes, or transcripts remain easy to read when printed.',
      },
      {
        question: 'Is there any limit on how many text files I can convert?',
        answer: 'No. Because PDF generation runs locally in your browser, you can convert unlimited text notes and logs completely free.',
      },
    ],
    limitations: ['Plain .txt input does not contain rich styling like bold text or embedded images; use Markdown to PDF for formatted prose.'],
  },
  {
    id: 'markdown-to-pdf',
    slug: 'markdown-to-pdf',
    title: 'Markdown to PDF',
    shortDesc: 'Convert GitHub Markdown (.md) documents into polished PDF files.',
    fullDesc: 'Render GitHub-flavored Markdown (.md) notes, README documentation, headings, lists, blockquotes, code blocks, and tables into clean, high-contrast printable PDF documents directly inside your browser.',
    category: 'convert-docs',
    categoryName: 'Convert Documents',
    iconName: 'BookOpen',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.md', '.markdown', 'text/markdown'],
    maxFileSizeMB: 20,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload a Markdown (.md) file or paste Markdown content.',
      'Check the live preview.',
      'Click "Export PDF" to generate your document.',
    ],
    faqs: [
      {
        question: 'Which Markdown syntax elements are supported?',
        answer: 'Headings (H1–H6), bold and italic emphasis, ordered and unordered lists, blockquotes, inline code, fenced code blocks, and tables are all rendered cleanly.',
      },
      {
        question: 'Can I preview my formatted Markdown before downloading the PDF?',
        answer: 'Yes. The workspace provides an instant live preview so you can verify heading structure and table alignment prior to exporting.',
      },
      {
        question: 'Are private developer READMEs or technical docs safe to convert here?',
        answer: 'Yes. Markdown parsing and PDF rendering execute 100% locally in browser memory without sending your source files over the internet.',
      },
    ],
    limitations: ['External image URLs blocked by third-party CORS headers may not embed inside browser-generated PDFs.'],
  },

  // 4. Image Tools
  {
    id: 'image-converter',
    slug: 'image-converter',
    title: 'Image Converter (JPG, PNG, WEBP, BMP)',
    shortDesc: 'Convert images between JPG, PNG, WEBP, and BMP with dimension & quality controls.',
    fullDesc: 'Universal client-side image converter. Convert single or multiple images between JPG, PNG, WEBP and BMP with transparency warnings, custom quality slider, aspect ratio locks, and bulk ZIP download.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Image',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
    maxFileSizeMB: 50,
    outputFormat: 'JPG / PNG / WEBP / BMP',
    instructions: [
      'Upload one or multiple images.',
      'Select your desired output format (PNG, JPG, WEBP, BMP).',
      'Optionally set width, height, or background fill for transparent PNGs.',
      'Click "Convert Images" and download individually or as a single ZIP archive.',
    ],
    faqs: [
      {
        question: 'What happens to transparency when converting PNG to JPG?',
        answer: 'Since the JPEG format does not support transparency, our tool lets you pick a custom background color (default is clean white) so transparent areas render perfectly.',
      },
      {
        question: 'Are my images compressed when converting?',
        answer: 'You have full control over the quality slider (1% to 100%). For PNG, lossless compression is preserved.',
      },
    ],
    limitations: ['Animated GIFs convert first frame to static image.'],
  },
  {
    id: 'image-to-pdf',
    slug: 'image-to-pdf',
    title: 'JPG & PNG to PDF',
    shortDesc: 'Combine one or multiple photos and scans into a single high-quality PDF.',
    fullDesc: 'Upload multiple JPG, PNG, or WEBP photos, reorder them, adjust page orientation, and merge them into a single consolidated PDF document.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Images',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.bmp'],
    maxFileSizeMB: 100,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload your images (receipts, notes, photo IDs, forms).',
      'Drag and arrange pages in desired reading order.',
      'Choose page layout (A4 portrait, landscape, or fit image).',
      'Click "Create PDF" and download your document.',
    ],
    faqs: [
      {
        question: 'Can I add margins to the PDF pages?',
        answer: 'Yes, you can choose "Fit with Margins" or "Edge-to-Edge Fill".',
      },
    ],
    limitations: [],
  },
  {
    id: 'pdf-to-images',
    slug: 'pdf-to-images',
    title: 'PDF to JPG & PNG',
    shortDesc: 'Extract every page of a PDF document as high-resolution JPG or PNG images.',
    fullDesc: 'Render PDF pages into crystal-clear image files using browser canvas rendering. Download individual pages or the entire batch in a convenient ZIP archive.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'FileImage',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 60,
    outputFormat: 'JPG / PNG / ZIP',
    instructions: [
      'Upload the PDF document.',
      'Select output format (JPG or PNG) and rendering resolution (150 DPI or 300 DPI high-res).',
      'Click "Extract Pages" to render the images.',
      'Download individual pages or download all in a ZIP file.',
    ],
    faqs: [
      {
        question: 'What resolution options are available when converting PDF pages to images?',
        answer: 'You can render pages at standard 150 DPI for fast web sharing or crisp 300 DPI high resolution for printing, zooming, and graphic design workflows.',
      },
      {
        question: 'Should I export PDF pages as JPG or PNG?',
        answer: 'Choose JPG for smaller file sizes and scanned photo pages, or PNG for lossless sharpness on vector diagrams, charts, receipts, and crisp typography.',
      },
      {
        question: 'Can I download all extracted PDF pages at once?',
        answer: 'Yes. Multi-page PDFs can be downloaded either one page at a time or bundled together into a single convenient ZIP archive.',
      },
    ],
    limitations: ['Very high DPI rendering (300 DPI) on 100+ page PDFs requires adequate browser RAM.'],
  },

  // 5. OCR & Scanned Documents
  {
    id: 'ocr-tool',
    slug: 'ocr-tool',
    title: 'OCR: Image & Scanned PDF to Text / Word',
    shortDesc: 'Extract selectable text from scanned documents and images using in-browser OCR.',
    fullDesc: 'Powered by Tesseract.js running 100% locally in your browser. Extract editable text and paragraphs from scanned documents, receipts, invoices and photos with English, Hindi, and multilingual support.',
    category: 'ocr-scanned',
    categoryName: 'OCR & Scanned Documents',
    iconName: 'ScanText',
    isPopular: true,
    badge: 'Popular',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.pdf'],
    maxFileSizeMB: 30,
    outputFormat: 'Text (.txt) or Word (.docx)',
    instructions: [
      'Upload an image or scanned document file.',
      'Select recognition language (English or Hindi).',
      'Click "Run OCR Recognition" — view the real-time progress indicator.',
      'Review the editable recognized text in the editor.',
      'Copy to clipboard or export directly as TXT or editable Word (.docx).',
    ],
    faqs: [
      {
        question: 'Does OCR require an internet connection after initial load?',
        answer: 'All OCR recognition executes locally on your CPU, though the first run downloads Tesseract WASM and language traineddata (~10–25 MB per language) before your browser caches them for offline reuse.',
      },
      {
        question: 'Can it recognize handwritten notes?',
        answer: 'Printed typography, typed forms, receipts, and invoices convert with high accuracy. Cursive handwriting recognition may have lower confidence.',
      },
    ],
    limitations: ['Heavily skewed, blurred or low-contrast photos may yield lower recognition confidence.'],
  },

  // 6. PDF Security & Signing
  {
    id: 'protect-pdf',
    slug: 'protect-pdf',
    title: 'PDF Privacy Sanitizer (Metadata & Stream Cleanup)',
    shortDesc: 'Strip hidden PDF metadata and rebuild clean object streams locally in your browser.',
    fullDesc: 'Sanitize PDF documents in your browser by stripping hidden author, title, creator, and producer tags and rebuilding clean object streams before sharing. For permanently hiding Aadhaar, bank numbers, or text, use our Offline PDF & ID Redactor.',
    category: 'pdf-security',
    categoryName: 'PDF Security & Signing',
    iconName: 'Lock',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 60,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload the PDF document you want to sanitize before sharing.',
      'Click "Sanitize & Rebuild Clean PDF" to wipe author, title, and producer metadata and re-save clean PDF streams.',
      'Download the sanitized PDF locally without uploading anything to external servers.',
    ],
    faqs: [
      {
        question: 'Does this tool apply an open-password lock to PDFs?',
        answer: 'No. Because our client-side pdf-lib processor does not support standard cryptographic PDF open-password encryption, this utility focuses strictly on stripping hidden metadata and rebuilding clean PDF streams. To lock a PDF with an open password, export via your OS Print-to-PDF or desktop Adobe Acrobat; to hide visual ID details, use our Offline PDF & ID Redactor.',
      },
    ],
    limitations: [
      'Strips hidden metadata and rewrites PDF object streams cleanly; does not add cryptographic open-password locking.',
    ],
  },
  {
    id: 'pdf-id-redactor',
    slug: 'pdf-id-redactor',
    title: 'PDF & ID Redactor (Hide Aadhaar / Bank / Salary Info)',
    shortDesc: 'Permanently mask or pixel-blur Aadhaar numbers, bank accounts, PAN, and salary figures offline in-browser.',
    fullDesc: 'PottoTools signature privacy utility: draw permanent Blackout, Whiteout, or Heavy Pixel Blur masks over sensitive details in PDFs and ID scans (JPG, PNG, WebP). Runs 100% offline in your browser and flattens pixels so underlying numbers can never be copied, extracted, or uncovered.',
    category: 'pdf-security',
    categoryName: 'PDF Security & Signing',
    iconName: 'EyeOff',
    isPopular: true,
    badge: 'Unique Offline Privacy',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf', '.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    maxFileSizeMB: 100,
    outputFormat: 'Flattened PDF / PNG / JPG',
    instructions: [
      'Upload a PDF statement, payslip, or ID scan (or click Try Sample ID / Salary Slip).',
      'Choose your mask style: Permanent Blackout, Clean Whiteout, or Heavy Pixel Blur.',
      'Drag rectangles over Aadhaar digits, PAN, bank account numbers, or salary figures (or run Auto-Mask IDs on digital PDFs).',
      'Click "Apply Permanent Redaction" to flatten the document and destroy underlying sensitive data locally.',
    ],
    faqs: [
      {
        question: 'Can anyone highlight or uncover the blacked-out text afterward?',
        answer: 'No. Unlike simple PDF highlighter overlays, PottoTools rasterizes and flattens every page and strips hidden metadata so original text underneath is permanently destroyed.',
      },
      {
        question: 'Does this PDF & ID Redactor work 100% offline without uploading my Aadhaar or bank statement?',
        answer: 'Yes. Every step—rendering, pattern scanning, pixel blurring, and flattened file creation—runs completely on your device with 0 KB sent over the internet, even in Airplane Mode.',
      },
      {
        question: 'Does it work on both PDF documents and mobile photos of ID cards?',
        answer: 'Yes. You can mask multi-page bank/salary PDFs as well as JPG, PNG, and WebP photos of Aadhaar cards, PAN cards, passports, or cheques.',
      },
    ],
    limitations: [
      'Exported redacted PDFs flatten pages into high-resolution images so masked text is non-recoverable.',
    ],
  },
  {
    id: 'sign-pdf',
    slug: 'sign-pdf',
    title: 'Sign PDF Document',
    shortDesc: 'Draw a navy-ink signature or upload an image stamp onto any PDF page.',
    fullDesc: 'Draw a freehand signature with mouse, trackpad, or touch (or upload a PNG/JPG signature image), choose the target page, and embed it cleanly onto your PDF locally in your browser. Signed PDFs include a subtle PottoTools full-page watermark.',
    category: 'pdf-security',
    categoryName: 'PDF Security & Signing',
    iconName: 'PenTool',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 50,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload your PDF document.',
      'Draw your signature in navy ink on the signing pad or upload an existing PNG/JPG signature image.',
      'Select the target page number and confirm signature authorization.',
      'Click "Sign & Embed on PDF" and download your signed document.',
    ],
    faqs: [
      {
        question: 'Is a drawn signature considered a cryptographic digital certificate?',
        answer: 'A drawn or stamped signature is an electronic visual sign-off. For strict government cryptographically signed certificates (e.g. DSC USB token), official PKI software is required.',
      },
      {
        question: 'Do signed PDFs include a watermark?',
        answer: 'Yes. Every page of PDFs generated with Sign PDF includes a subtle low-opacity PottoTools logo watermark.',
      },
    ],
    limitations: [
      'Embeds signatures onto the chosen page at a fixed bottom-left coordinate (x=50, y=50, 180×60 pt) rather than free drag-and-drop coordinates.',
      'Automatically applies a subtle low-opacity PottoTools logo watermark across all pages of the signed PDF.',
    ],
  },
  {
    id: 'pdf-metadata',
    slug: 'pdf-metadata',
    title: 'PDF Metadata Viewer & Remover',
    shortDesc: 'Inspect and sanitize hidden PDF metadata (Author, Producer, Creation Date).',
    fullDesc: 'Inspect hidden metadata tags inside your PDF document and strip them completely to ensure privacy before public distribution or legal submission.',
    category: 'pdf-security',
    categoryName: 'PDF Security & Signing',
    iconName: 'FileSearch',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 60,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload your PDF file.',
      'Inspect metadata fields (Title, Author, Subject, Creator, Producer, Dates).',
      'Click "Sanitize & Remove Metadata" to wipe all tags.',
      'Download your clean PDF.',
    ],
    faqs: [
      {
        question: 'What hidden metadata is stored inside PDF files?',
        answer: 'PDFs frequently store Author name, Creator software (e.g., Microsoft Word or Photoshop), Producer, Title, Subject, Keywords, Creation Date, and Modification Date.',
      },
      {
        question: 'Why should I remove PDF metadata before sharing documents online?',
        answer: 'Stripping metadata removes your personal username, computer software details, and editing timestamps before publishing PDFs publicly or submitting applications.',
      },
      {
        question: 'Does sanitizing metadata alter the visible pages or text of my PDF?',
        answer: 'No. Page content, fonts, links, and images remain 100% identical—only the hidden document info dictionary and metadata properties are cleaned.',
      },
    ],
    limitations: ['Password-encrypted PDFs must be unlocked before metadata tags can be inspected or modified.'],
  },

  // Image Tools: Custom Photo Studio & Studio Tools
  {
    id: 'custom-photo-resizer',
    slug: 'custom-photo-studio',
    title: 'Custom Photo Studio',
    shortDesc: 'Upload Once — Do Everything: Resize, Crop, Edit, Rotate, Straighten, Compress & Convert all in one place.',
    fullDesc: 'One image. Endless possibilities. Comprehensive client-side photo studio: resize with physical units, adjust brightness, contrast, warmth & sharpness, crop with aspect ratios, compress to target KB, convert formats, rotate & straighten without uploading to external servers.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Image',
    isPopular: true,
    badge: 'All-in-One Studio',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 50,
    outputFormat: 'JPG / PNG / WebP',
    instructions: [
      'Upload any photo into the studio.',
      'Use the left sidebar or top toolbar to select Resize, Adjust, Crop, Compress, Convert, Rotate & Flip, or Straighten.',
      'Inspect the live Before vs. Edited split curtain preview and zoom controls.',
      'Apply multiple operations non-destructively to your image without re-uploading.',
      'Click Download to export your finished photo in high resolution.',
    ],
    faqs: [
      {
        question: 'Can I perform multiple editing operations on the same photo?',
        answer: 'Yes! Custom Photo Studio is built on the "Upload Once — Do Everything" principle. You can crop, resize, adjust colors, compress, and convert all in a single session without losing quality.',
      },
      {
        question: 'Are my photos uploaded to external servers?',
        answer: 'No. All editing, rendering, and conversion operations run 100% locally in your web browser using HTML5 Canvas and WebAssembly. Your photos remain completely private.',
      },
    ],
    limitations: [],
  },
  {
    id: 'photo-size-compressor',
    slug: 'photo-size-compressor',
    title: 'Photo Size Compressor (Target KB/MB)',
    shortDesc: 'Compress photos down to an exact target in KB (e.g. 20 KB, 50 KB, 100 KB) without quality collapse.',
    fullDesc: 'Compress photos to an exact target file size in KB or MB with iterative binary search compression. Includes presets for 10KB-20KB signatures, 20KB-50KB passport photos, and 100KB application forms with intelligent downscale safeguards.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Minimize2',
    isPopular: true,
    badge: 'Target KB',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 35,
    outputFormat: 'JPG (.jpg) or WebP',
    instructions: [
      'Upload your image or document photo.',
      'Choose a quick target preset (10–20 KB, 20–50 KB, 50–100 KB) or type an exact KB ceiling.',
      'Enable the auto-downscale safeguard if targeting very small sizes (&lt; 20 KB) to prevent JPEG artifacting.',
      'Click "Compress Image" to run iterative client-side compression.',
      'Inspect before/after file sizes and percentage reduction, then download.',
    ],
    faqs: [
      {
        question: 'How low can I compress an image?',
        answer: 'PottoTools supports compression down to 5 KB where mathematically achievable. If an image has huge dimensions (e.g. 4000x3000), the tool gently adjusts dimensions so the file size fits within the strict KB limit without blocking.',
      },
      {
        question: 'Is my photo uploaded to any server during compression?',
        answer: 'No. All compression executes 100% locally in your web browser canvas memory. Your photos remain completely private.',
      },
    ],
    limitations: [],
  },
  {
    id: 'photo-signature-resizer',
    slug: 'photo-signature-resizer',
    title: 'Government Exam Photo & Signature Resizer',
    shortDesc: 'Resize photos & signatures with verified presets for UPSC, SSC, IBPS, State PSCs & Passports.',
    fullDesc: 'Verified dual-constraint optimization for government job portals, university admissions, and civil service exams (UPSC, SSC CGL/CHSL, IBPS PO/Clerk, State PSCs, US/EU Passports). Guarantees exact pixel dimensions and strict KB bounds simultaneously with compliance verification checkmarks.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'Photo & Signature for Exams',
    iconName: 'Award',
    badge: 'Presets',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 35,
    outputFormat: 'JPG (.jpg) or PNG',
    instructions: [
      'Upload your passport photo or signature image.',
      'Select your exam preset (e.g. UPSC Photo 200x230 px, SSC Signature 140x60 px, Bank PO, 3.5x4.5cm Passport, or US Visa 2x2 inch).',
      'Choose the official background color requirement (Pure White or Light Blue).',
      'Click "Apply Preset" to generate your compliant photo.',
      'Verify green compliance checkmarks for dimensions, file size, and format, then download.',
    ],
    faqs: [
      {
        question: 'Why do government portals reject photos?',
        answer: 'Most portals validate both dimensions (e.g. 200x230 px) and file size (e.g. 20 KB to 50 KB). If either fails, the portal rejects your upload. PottoTools satisfies both criteria simultaneously.',
      },
      {
        question: 'Are presets verified?',
        answer: 'Yes, standard presets reflect official UPSC, SSC, and IBPS guidelines (verified 2026).',
      },
    ],
    limitations: [],
  },
  {
    id: 'photo-editor',
    slug: 'photo-editor',
    title: 'Photo Editor for Documents & Applications',
    shortDesc: 'Crop, rotate, fine straighten, flip, adjust brightness, contrast, sharpness, and tonal filters.',
    fullDesc: 'Client-side photo editor built for formal document preparation. Crop with standard aspect ratios, rotate in 90° steps, fine straighten (-25° to +25°), adjust brightness, contrast, saturation, exposure, and sharpness, apply black & white grayscale or warm/cool filters, with full undo/redo and live preview.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Sliders',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 35,
    outputFormat: 'JPG (.jpg) or PNG',
    instructions: [
      'Upload any photo needing adjustment or framing corrections.',
      'Use rotate and fine straighten sliders to level crooked scans.',
      'Adjust brightness and contrast to make dark or washed-out faces clear.',
      'Enhance sharpness to bring out document clarity.',
      'Use Undo/Redo anytime, and click Download when satisfied.',
    ],
    faqs: [
      {
        question: 'Does editing degrade image quality?',
        answer: 'No. All adjustments are previewed non-destructively in canvas memory and rendered at high fidelity upon download.',
      },
    ],
    limitations: [],
  },
  {
    id: 'hd-image-enhancer',
    slug: 'hd-image-enhancer',
    title: 'HD Image Enhancer',
    shortDesc: 'Hardware canvas unsharp mask, contrast-adaptive sharpening, denoise, and 2x/4x upscaling.',
    fullDesc: 'Refine soft or blurry document scans and passport photos using hardware-accelerated canvas convolution. Features Contrast-Adaptive Sharpening (CAS) to enhance facial features without amplifying noise, gentle denoise smoothing, and multi-step 2x/4x super-resolution upscaling with side-by-side comparison.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Sparkles',
    badge: 'Hardware Canvas',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 35,
    outputFormat: 'JPG (.jpg)',
    instructions: [
      'Upload a soft, blurry, or low-resolution portrait photo.',
      'Adjust the edge sharpening slider and toggle Contrast-Adaptive Sharpening.',
      'Add gentle denoise smoothing to suppress grain.',
      'Select 2x or 4x super-resolution upscaling if you need a higher pixel count.',
      'Toggle "Compare with Original" to inspect before/after results, then download.',
    ],
    faqs: [
      {
        question: 'How does the HD Enhancer work?',
        answer: 'It uses browser hardware-accelerated canvas algorithms including Laplacian unsharp masks, contrast-adaptive kernels, and stepped bicubic interpolation to refine edges locally.',
      },
    ],
    limitations: [],
  },
  {
    id: 'image-format-converter',
    slug: 'image-format-converter',
    title: 'Image Format Converter (JPG, PNG, WebP)',
    shortDesc: 'Convert between JPG, PNG, and WebP with quality control and transparency handling.',
    fullDesc: 'Cross-convert between JPG, PNG, and WebP image formats with customizable quality levels, file size estimates, and transparency handling when saving PNG to JPG.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'RefreshCw',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 35,
    outputFormat: 'JPG / PNG / WebP',
    instructions: [
      'Upload your image.',
      'Select output format: JPG (standard), PNG (lossless), or WebP (modern web).',
      'Adjust quality slider for lossy formats.',
      'Review output preview and download your converted image.',
    ],
    faqs: [
      {
        question: 'Which image formats can I convert between with this tool?',
        answer: 'You can freely convert images between JPG (JPEG), lossless PNG, and modern lightweight WebP directly inside your browser.',
      },
      {
        question: 'How does transparency behave when converting PNG or WebP to JPG?',
        answer: 'JPEG does not support transparent backgrounds, so PottoTools cleanly composites transparent regions onto a solid white canvas automatically.',
      },
      {
        question: 'Can I adjust output image quality and estimate file size?',
        answer: 'Yes. Use the quality slider to balance image sharpness and file size for JPG and WebP outputs before downloading.',
      },
    ],
    limitations: ['Animated WebP frames flatten to the first static frame when converted to JPG or PNG.'],
  },

  {
    id: 'photo-background-changer',
    slug: 'photo-background-changer',
    title: 'Background Colour Changer',
    shortDesc: 'Replace photo backdrop with Pure White, Light Blue, Navy Blue, or Off-White.',
    fullDesc: 'Replace photo backgrounds with official passport colors (Pure White #FFFFFF, Light Blue #D0E8F2, Navy Blue #1B365D, Off-White #F5F5F5) using color-difference segmentation, tolerance thresholding, and edge feathering.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Palette',
    badge: 'Chroma Segmentation',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 35,
    outputFormat: 'JPG (.jpg)',
    instructions: [
      'Upload a portrait photo with a solid or plain background.',
      'Choose the official background color (e.g. Pure White for UPSC/SSC or Light Blue for Bank exams).',
      'Adjust tolerance and feathering sliders to refine hair edges.',
      'Inspect before/after comparison and download.',
    ],
    faqs: [
      {
        question: 'Which photos work best with background replacement?',
        answer: 'Photos taken against a relatively uniform wall, backdrop, or curtain work best. For highly cluttered or busy outdoor backgrounds, client-side color keying may show minor edge variations.',
      },
    ],
    limitations: ['Complex, patterned, or low-contrast backgrounds may require manual tolerance adjustment.'],
  },
  {
    id: 'passport-photo-cropper',
    slug: 'passport-photo-cropper',
    title: 'Passport Size Photo Cropper',
    shortDesc: 'Crop portrait photos to standard 3.5cm x 4.5cm or 2x2 inch passport ratios.',
    fullDesc: 'Crop any portrait photograph to exact official passport and visa proportions—including 3.5cm x 4.5cm (Indian/EU/UK passports) and 2x2 inch (US/Canada visas)—with locked aspect-ratio framing and centered facial guidelines in your browser.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'Photo & Signature for Exams',
    iconName: 'Crop',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 25,
    outputFormat: 'JPG (.jpg)',
    instructions: [
      'Upload a portrait photo.',
      'Select ratio preset (35x45mm European/Indian Passport or 2x2 inch US Passport).',
      'Position the crop box over the face and shoulders.',
      'Click "Crop & Download".',
    ],
    faqs: [
      {
        question: 'What passport and visa photo sizes are built in?',
        answer: 'You can pick standard 3.5cm x 4.5cm (35x45mm) for Indian, UK, Schengen, and European passports, 2x2 inch (51x51mm) for US passports and visas, or custom framing ratios.',
      },
      {
        question: 'Are my portrait photos uploaded to any cloud server?',
        answer: 'No. Cropping and JPEG encoding take place 100% locally inside your web browser memory so personal ID photos remain completely private.',
      },
      {
        question: 'How should I frame the head and shoulders in the crop box?',
        answer: 'Center your face upright with even space above the hair and clear visibility of both shoulders against a plain light background.',
      },
    ],
    limitations: ['Very low-resolution source selfies may appear soft if printed at large sizes.'],
  },
  {
    id: 'combine-app-documents',
    slug: 'combine-app-documents',
    title: 'Combine Application Documents into Single PDF',
    shortDesc: 'Merge photo ID, degree certificates, mark sheets, and resume into one PDF under target KB limits.',
    fullDesc: 'Quickly assemble application portfolios by combining scanned certificates, degrees, ID proofs, and resumes into a unified PDF file.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'Photo & Signature for Exams',
    iconName: 'Files',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxFileSizeMB: 60,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload all your application files (PDFs and images).',
      'Drag to arrange them in the sequence required by the application.',
      'Click "Combine & Optimize" to compile a single PDF.',
    ],
    faqs: [
      {
        question: 'Can I mix PDF certificates and JPG/PNG ID photos in one PDF?',
        answer: 'Yes! Upload both PDF files and image scans (JPG, PNG), arrange their order, and compile them into a single clean application PDF.',
      },
      {
        question: 'Can I control the output file size for portal upload limits?',
        answer: 'Yes. You can optimize the consolidated PDF directly or follow up with our Compress PDF tool to meet strict 500 KB, 1 MB, or 2 MB portal limits.',
      },
      {
        question: 'Are my academic marksheets and ID proofs kept confidential?',
        answer: 'Yes. Merging happens completely locally inside your browser without uploading sensitive certificates or identity documents to any server.',
      },
    ],
    limitations: ['Password-locked PDF attachments must be unlocked before combining into a single portfolio.'],
  },

  // 8. Smart Document Utilities
  {
    id: 'pdf-text-extractor',
    slug: 'pdf-text-extractor',
    title: 'PDF Text Extractor & Word Counter',
    shortDesc: 'Extract all readable text, word count, character count, and line count from any PDF.',
    fullDesc: 'Fast client-side PDF text extraction. Inspect full extracted prose, view word counts, character counts, page stats, and estimated reading time.',
    category: 'smart-utilities',
    categoryName: 'Smart Document Utilities',
    iconName: 'Sparkles',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 50,
    outputFormat: 'Text (.txt)',
    instructions: [
      'Upload any text-based PDF file.',
      'View real-time text statistics: words, characters, pages, reading time.',
      'Read or search within the extracted text.',
      'Copy to clipboard or download as a text file.',
    ],
    faqs: [
      {
        question: 'Does the PDF Text Extractor work on any PDF?',
        answer: 'It extracts all selectable digital text cleanly from reports, ebooks, resumes, and invoices. For flat scanned image PDFs, use our OCR Scanner instead.',
      },
      {
        question: 'What text statistics are calculated automatically?',
        answer: 'It shows exact word count, character count (with and without spaces), line count, total pages, and estimated reading time in real time.',
      },
      {
        question: 'Can I download the extracted text as a .txt file?',
        answer: 'Yes. You can either copy the extracted text to your clipboard with one click or download it directly as a clean UTF-8 .txt file.',
      },
    ],
    limitations: ['Scanned or rasterized image PDFs contain no embedded text stream and require OCR recognition.'],
  },
  {
    id: 'text-diff-comparator',
    slug: 'text-diff-comparator',
    title: 'Document Text Comparator (Side-by-Side Diff)',
    shortDesc: 'Compare two text documents or revisions side-by-side to highlight differences.',
    fullDesc: 'Compare two contracts, articles, or code snippets side-by-side with color-coded diff highlights (additions, deletions, line matches) computed entirely in your browser.',
    category: 'smart-utilities',
    categoryName: 'Smart Document Utilities',
    iconName: 'GitCompare',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.txt', 'text/plain'],
    maxFileSizeMB: 10,
    outputFormat: 'Visual Diff',
    instructions: [
      'Paste or upload original Text A on the left.',
      'Paste or upload modified Text B on the right.',
      'Click "Compare Texts" to view instant line-by-line diff highlights.',
    ],
    faqs: [
      {
        question: 'How does side-by-side text comparison work?',
        answer: 'Paste or upload Original Text A and Revised Text B, and the diff engine compares line-by-line and word-level changes, highlighting additions in green and deletions in red.',
      },
      {
        question: 'What types of documents can I compare with this diff tool?',
        answer: 'You can compare legal contract drafts, essay revisions, configuration files, CSV snippets, SQL queries, or source code directly in your browser.',
      },
      {
        question: 'Is my pasted text saved or transmitted to a server?',
        answer: 'Never. All diff computations execute locally in your browser tab so confidential agreements and proprietary code stay private.',
      },
    ],
    limitations: ['Best suited for plain text comparisons up to several megabytes; binary .docx/.pdf files should have text extracted first.'],
  },
  {
    id: 'text-cleaner',
    slug: 'text-cleaner',
    title: 'Text Cleaner & Case Converter',
    shortDesc: 'Remove extra spaces, blank lines, fix formatting, and convert between cases.',
    fullDesc: 'Clean messy copied text from PDFs. Remove repeated spaces, trailing whitespace, blank lines, and convert between UPPERCASE, lowercase, Title Case, and Sentence Case.',
    category: 'smart-utilities',
    categoryName: 'Smart Document Utilities',
    iconName: 'Wand2',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.txt', 'text/plain'],
    maxFileSizeMB: 10,
    outputFormat: 'Clean Text',
    instructions: [
      'Paste messy text or upload a text file.',
      'Toggle cleanup options (remove duplicate spaces, strip empty lines, convert case).',
      'Copy clean text or download.',
    ],
    faqs: [
      {
        question: 'What messy text problems can Text Cleaner fix automatically?',
        answer: 'It removes multiple consecutive spaces, strips trailing whitespace, deletes blank lines, removes unwanted line breaks from PDF copy-pastes, and strips HTML tags.',
      },
      {
        question: 'Which text case conversions are included?',
        answer: 'You can convert text between UPPERCASE, lowercase, Title Case, and Sentence case in a single click.',
      },
      {
        question: 'Does Text Cleaner store the text I paste into the editor?',
        answer: 'No. Every text cleanup and case transformation runs purely inside browser JavaScript without sending data anywhere.',
      },
    ],
    limitations: ['Automated sentence-case heuristics may require manual review for proper nouns and technical acronyms.'],
  },

  // 9. Office Spreadsheets
  {
    id: 'csv-to-xlsx',
    slug: 'csv-to-xlsx',
    title: 'CSV to Excel (.xlsx)',
    shortDesc: 'Convert CSV data files into formatted Microsoft Excel (.xlsx) workbooks.',
    fullDesc: 'Upload comma-separated or tab-separated CSV files and generate a genuine Microsoft Excel workbook (.xlsx) with auto-formatted columns.',
    category: 'spreadsheets',
    categoryName: 'Office Spreadsheets',
    iconName: 'Sheet',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.csv', 'text/csv'],
    maxFileSizeMB: 30,
    outputFormat: 'Excel (.xlsx)',
    instructions: [
      'Upload your .csv file.',
      'Preview the parsed table grid.',
      'Click "Export to Excel (.xlsx)" and download.',
    ],
    faqs: [
      {
        question: 'Does CSV to Excel preserve numbers, dates, and UTF-8 characters?',
        answer: 'Yes. PottoTools uses SheetJS in-browser parsing to detect numeric values, keep UTF-8 accents/Hindi text intact, and auto-fit column widths in the generated .xlsx file.',
      },
      {
        question: 'Can I preview my CSV data table before exporting to Excel?',
        answer: 'Yes. As soon as you upload a .csv file, you can inspect the parsed columns and rows right inside the browser preview table.',
      },
      {
        question: 'Is the generated .xlsx workbook compatible with Microsoft Excel and Google Sheets?',
        answer: 'Yes. It produces a standard OpenXML (.xlsx) workbook that opens seamlessly in Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice Calc.',
      },
    ],
    limitations: ['Very large CSV files exceeding 200,000 rows may take longer to serialize depending on device memory.'],
  },
  {
    id: 'xlsx-to-csv',
    slug: 'xlsx-to-csv',
    title: 'Excel (.xlsx) to CSV',
    shortDesc: 'Convert Microsoft Excel spreadsheets into clean, universal CSV data files.',
    fullDesc: 'Extract worksheets from Excel workbooks (.xlsx or .xls) into standard CSV format ready for databases and data analysis pipelines.',
    category: 'spreadsheets',
    categoryName: 'Office Spreadsheets',
    iconName: 'FileSpreadsheet',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.xlsx', '.xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxFileSizeMB: 40,
    outputFormat: 'CSV (.csv)',
    instructions: [
      'Upload your Excel spreadsheet.',
      'Select which sheet to extract.',
      'Click "Convert to CSV" and download.',
    ],
    faqs: [
      {
        question: 'Can I convert a multi-sheet Excel workbook to CSV?',
        answer: 'Yes. When an .xlsx or .xls workbook contains multiple tabs, you can select the exact worksheet you want to export to clean .csv format.',
      },
      {
        question: 'Does Excel to CSV evaluate cached formula values?',
        answer: 'Yes. Calculated cell values displayed in the spreadsheet are exported cleanly as standard comma-separated values.',
      },
      {
        question: 'Are my financial or business spreadsheets uploaded to any server?',
        answer: 'No. All spreadsheet parsing and CSV serialization happen strictly inside your browser memory with zero cloud transmission.',
      },
    ],
    limitations: ['Standard CSV files store plain tabular data from a single sheet and do not preserve Excel colors, formulas, or multiple tabs.'],
  },
  {
    id: 'sheet-viewer',
    slug: 'sheet-viewer',
    title: 'Spreadsheet Viewer & Table Exporter',
    shortDesc: 'Inspect Excel and CSV data directly in your browser with search and filtering.',
    fullDesc: 'Open and inspect any CSV or XLSX file without needing Excel installed. Search rows, inspect cell formulas and values, and export filtered results.',
    category: 'spreadsheets',
    categoryName: 'Office Spreadsheets',
    iconName: 'Table',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.xlsx', '.xls', '.csv'],
    maxFileSizeMB: 40,
    outputFormat: 'Interactive Table / CSV / JSON',
    instructions: [
      'Upload a CSV or XLSX spreadsheet.',
      'Filter or search through the table data.',
      'Export as CSV or JSON.',
    ],
    faqs: [
      {
        question: 'Can I open Excel (.xlsx, .xls) and CSV files without Microsoft Office?',
        answer: 'Yes. The Spreadsheet Viewer renders multi-sheet workbooks and CSV files directly in your web browser on Windows, Mac, Linux, and mobile devices.',
      },
      {
        question: 'Can I search and filter rows inside large spreadsheets?',
        answer: 'Yes. Use the built-in search bar to instantly filter matching rows and inspect cell values across sheets.',
      },
      {
        question: 'What export formats does the Spreadsheet Viewer support?',
        answer: 'After inspecting or filtering your table, you can download the data as clean CSV or structured JSON.',
      },
    ],
    limitations: ['Protected password-encrypted Excel files must be unlocked before viewing in the browser.'],
  },
  {
    id: 'powerpoint-to-pdf',
    slug: 'powerpoint-to-pdf',
    title: 'PowerPoint to PDF',
    shortDesc: 'Extract PowerPoint (.pptx) slide headings and text into clean landscape PDF cards.',
    fullDesc: 'Convert Microsoft PowerPoint presentations (.pptx) locally in your browser by extracting slide titles, bullet points, and text onto clean A4 landscape PDF cards—ideal for quick readable text handouts without uploading slides to external servers.',
    category: 'convert-docs',
    categoryName: 'Convert Documents',
    iconName: 'Presentation',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    maxFileSizeMB: 50,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Upload or drag & drop your PowerPoint presentation (.pptx).',
      'Inspect slide count and review how text cards will export.',
      'Click "Convert to PDF" to generate a clean landscape PDF handout.',
      'Download your PDF immediately.',
    ],
    faqs: [
      {
        question: 'Does PowerPoint to PDF preserve slide images, charts, and animations?',
        answer: 'No. Client-side XML parsing extracts slide headings, bullet lists, and body text onto clean structured A4 landscape PDF cards rather than rendering embedded photos, SmartArt graphics, or slide background themes.',
      },
      {
        question: 'Are my slides kept confidential?',
        answer: 'Yes! Text parsing and PDF generation execute 100% locally in your browser memory without transmitting your .pptx file to any server.',
      },
      {
        question: 'Does this support PPT and PPTX?',
        answer: 'Modern OpenXML .pptx presentations created in PowerPoint 2007+, Google Slides, and Keynote are supported. Legacy binary .ppt files must be saved as .pptx first.',
      },
    ],
    limitations: [
      'Exports structured slide text onto A4 landscape PDF cards; embedded images, charts, themes, and complex layouts are omitted.',
      'Legacy binary .ppt files must be resaved as .pptx prior to conversion.',
    ],
  },
  {
    id: 'excel-to-pdf',
    slug: 'excel-to-pdf',
    title: 'Excel to PDF',
    shortDesc: 'Convert Excel spreadsheets (.xlsx, .xls, .csv) into formatted landscape PDF tables.',
    fullDesc: 'Convert Microsoft Excel spreadsheets and CSV data tables into styled, printable PDF documents directly in your browser without uploading to any remote server.',
    category: 'spreadsheets',
    categoryName: 'Office Spreadsheets',
    iconName: 'FileSpreadsheet',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.xlsx', '.xls', '.csv'],
    maxFileSizeMB: 40,
    outputFormat: 'PDF (.pdf)',
    instructions: [
      'Select or drag & drop your Excel (.xlsx, .xls) or CSV spreadsheet.',
      'Review the parsed sheet and column layout.',
      'Click "Convert to PDF" to generate a formatted table document.',
      'Download your PDF instantly.',
    ],
    faqs: [
      {
        question: 'Are my financial or business numbers private?',
        answer: 'Absolutely. PottoTools runs completely offline in your local browser memory. No data is ever transmitted to a server.',
      },
    ],
    limitations: [],
  },
  {
    id: 'pdf-to-excel',
    slug: 'pdf-to-excel',
    title: 'PDF to Excel',
    shortDesc: 'Extract delimited text rows from digital PDFs into editable Excel (.xlsx) workbooks.',
    fullDesc: 'Extract tabular rows separated by spacing, tabs, or commas from digital text PDF documents directly into a Microsoft Excel (.xlsx) spreadsheet in your browser.',
    category: 'spreadsheets',
    categoryName: 'Office Spreadsheets',
    iconName: 'Sheet',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 50,
    outputFormat: 'Excel (.xlsx)',
    instructions: [
      'Upload a digital PDF containing text-based tables or structured lists.',
      'Click "Convert to Excel (.xlsx)".',
      'The parser splits each line by spacing, tabs, or commas into spreadsheet columns.',
      'Download the editable .xlsx workbook.',
    ],
    faqs: [
      {
        question: 'Can I edit the generated Excel spreadsheet?',
        answer: 'Yes, the output is a standard Microsoft Excel workbook (.xlsx) fully compatible with Excel, Google Sheets, and LibreOffice.',
      },
      {
        question: 'Does it work on scanned table photos?',
        answer: 'No. This extractor reads selectable digital text streams split by spaces, tabs, or commas. Scanned PDFs must be processed with OCR first.',
      },
    ],
    limitations: [
      'Best for digital PDFs with clear column spacing, tabs, or commas; merged cells, multi-line cells, and scanned table photos may require manual spreadsheet cleanup.',
    ],
  },
  {
    id: 'jpg-to-png',
    slug: 'jpg-to-png',
    title: 'JPG to PNG Converter',
    shortDesc: 'Convert JPG / JPEG photos to lossless PNG format with transparent alpha support.',
    fullDesc: 'Convert JPG and JPEG images to high-resolution PNG format online. 100% free and processed in your browser with zero compression loss.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Image',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', 'image/jpeg'],
    maxFileSizeMB: 30,
    outputFormat: 'PNG (.png)',
    instructions: [
      'Upload your JPG or JPEG image.',
      'Select PNG output format.',
      'Click "Convert Image" to process.',
      'Download your lossless PNG image.',
    ],
    faqs: [
      {
        question: 'Why convert a JPG photo into PNG format?',
        answer: 'PNG uses lossless compression, preventing further JPEG artifacts during graphic editing, UI design, printing, or text overlay workflows.',
      },
      {
        question: 'Will converting JPG to PNG increase the file size?',
        answer: 'Usually yes, because PNG stores lossless pixel data rather than lossy JPEG blocks—making it ideal when crisp edge preservation matters most.',
      },
      {
        question: 'Are my JPG photos uploaded anywhere during conversion?',
        answer: 'No. Conversion runs 100% locally in your browser using HTML5 Canvas without sending any image over the network.',
      },
    ],
    limitations: ['Converting an already-compressed JPG to PNG preserves current detail losslessly but cannot restore lost JPEG details.'],
  },
  {
    id: 'png-to-jpg',
    slug: 'png-to-jpg',
    title: 'PNG to JPG Converter',
    shortDesc: 'Convert PNG graphics and screenshots to lightweight JPG format with quality control.',
    fullDesc: 'Convert PNG images and transparent artwork into compact JPG format. Adjust compression quality to achieve small file sizes instantly.',
    category: 'convert-images',
    categoryName: 'Image Tools',
    subCategory: 'General Image Tools & Utilities',
    iconName: 'Image',
    isPopular: true,
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.png', 'image/png'],
    maxFileSizeMB: 30,
    outputFormat: 'JPG (.jpg)',
    instructions: [
      'Upload your PNG graphic or screenshot.',
      'Adjust the quality slider (default 90%).',
      'Click "Convert to JPG" and download.',
    ],
    faqs: [
      {
        question: 'How much smaller is a JPG compared to a PNG file?',
        answer: 'For photographs and screenshots, converting PNG to JPG typically reduces file size by 60% to 85%, making images ideal for websites, emails, and upload portals.',
      },
      {
        question: 'What happens to transparent areas in a PNG when converted to JPG?',
        answer: 'Because JPG does not support transparency, transparent pixels are cleanly filled with a crisp solid white background.',
      },
      {
        question: 'Can I control the output image quality?',
        answer: 'Yes. Use the quality slider (e.g. 85%–95% for crisp details or lower for compact KB sizes) before downloading your JPG.',
      },
    ],
    limitations: ['JPG uses lossy compression and does not preserve alpha transparency.'],
  },
];

export interface DocumentNavCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  colorClass: string;
  toolIds: string[];
}

export const DOCUMENT_NAV_CATEGORIES: DocumentNavCategory[] = [
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    shortName: 'PDF',
    description: 'Compress, merge, split, delete pages, sanitize metadata, sign, and convert PDF files with zero cloud uploads.',
    iconName: 'Layers',
    colorClass: 'text-red-600 dark:text-red-400',
    toolIds: [
      'searchable-pdf-text-finder',
      'pdf-page-organizer',
      'pdf-to-editable-word',
      'compress-pdf',
      'merge-pdf',
      'split-pdf',
      'delete-pdf-pages',
      'watermark-pdf',
      'page-numbers-pdf',
      'pdf-id-redactor',
      'protect-pdf',
      'sign-pdf',
      'pdf-to-word',
      'word-to-pdf',
      'powerpoint-to-pdf',
      'excel-to-pdf',
      'pdf-to-excel',
      'image-to-pdf',
      'pdf-to-images',
      'pdf-metadata',
      'pdf-text-extractor',
    ],
  },
  {
    id: 'word-tools',
    name: 'Word Tools',
    shortName: 'Word',
    description: 'Convert Microsoft Word (.docx) documents to PDF, convert PDF back to editable Word, and extract clean text.',
    iconName: 'FileText',
    colorClass: 'text-blue-600 dark:text-blue-400',
    toolIds: [
      'word-to-pdf',
      'pdf-to-word',
      'docx-to-txt',
      'docx-to-html',
      'txt-to-pdf',
      'markdown-to-pdf',
    ],
  },
  {
    id: 'excel-tools',
    name: 'Excel Tools',
    shortName: 'Excel',
    description: 'Convert Excel spreadsheets to PDF, CSV to XLSX, XLSX to CSV, and extract tabular data from PDFs.',
    iconName: 'Sheet',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    toolIds: [
      'excel-to-pdf',
      'pdf-to-excel',
      'csv-to-xlsx',
      'xlsx-to-csv',
      'sheet-viewer',
    ],
  },
  {
    id: 'powerpoint-tools',
    name: 'PowerPoint Tools',
    shortName: 'PowerPoint',
    description: 'Extract slide titles and bullet text from Microsoft PowerPoint (.pptx) files into structured A4 landscape PDF text cards.',
    iconName: 'Presentation',
    colorClass: 'text-amber-600 dark:text-amber-400',
    toolIds: [
      'powerpoint-to-pdf',
    ],
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    shortName: 'Images',
    description: 'Resize dimensions, compress file size in KB, UPSC/SSC exam photo & signature presets, photo editor, HD enhancer, and convert between JPG, PNG, and WebP.',
    iconName: 'Image',
    colorClass: 'text-purple-600 dark:text-purple-400',
    toolIds: [
      'custom-photo-resizer',
      'photo-size-compressor',
      'photo-signature-resizer',
      'photo-editor',
      'hd-image-enhancer',
      'image-format-converter',
      'photo-background-changer',
      'passport-photo-cropper',
      'combine-app-documents',
      'image-converter',
      'jpg-to-png',
      'png-to-jpg',
      'image-to-pdf',
      'pdf-to-images',
    ],
  },
  {
    id: 'other-document-tools',
    name: 'Other Document Utilities',
    shortName: 'Other Tools',
    description: 'In-browser OCR text recognition, searchable PDF generator, text diff comparison, and clean text tools.',
    iconName: 'Sparkles',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    toolIds: [
      'ocr-tool',
      'pdf-id-redactor',
      'pdf-text-extractor',
      'text-diff-comparator',
      'text-cleaner',
      'pdf-metadata',
    ],
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().replace(/^tool-/, '').replace(/^\//, '').trim();
  if (
    clean === 'crop-rotate-straighten' ||
    clean === 'custom-photo-resizer' ||
    clean === 'custom-photo-studio'
  ) {
    return TOOLS.find((t) => t.id === 'custom-photo-resizer');
  }
  return TOOLS.find((t) => t.slug.toLowerCase() === clean || t.id.toLowerCase() === clean);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS.filter((t) => t.category === category);
}

// Task intent and natural language query synonyms mapped to tool IDs
const TASK_SYNONYMS: Record<string, string[]> = {
  'compress-pdf': [
    'reduce size', 'compress', 'shrink', 'smaller', 'reduce mb', 'reduce kb',
    'optimize', 'make smaller', 'file size limit', 'low size', '100kb', '200kb', '500kb',
  ],
  'image-to-pdf': [
    'photo to pdf', 'image to pdf', 'jpg to pdf', 'png to pdf', 'picture to pdf',
    'photos to pdf', 'scan to pdf', 'convert photo to document', 'jpeg to pdf',
  ],
  'image-converter': [
    'change image format', 'convert image', 'convert photo', 'jpg to png',
    'png to webp', 'image format', 'bmp to jpg', 'webp to png', 'transparency',
  ],
  'pdf-to-images': [
    'pdf to photo', 'pdf to image', 'pdf to jpg', 'pdf to png', 'extract images from pdf',
    'save pdf as jpg',
  ],
  'pdf-page-organizer': [
    'pdf page organizer', 'organize pdf', 'reorder pages', 'rearrange pdf pages', 'rotate page',
    'move pages', 'page organizer', 'delete page', 'scanned pdf organizer', 'large pdf',
    'pdf organizer', 'reorder pdf', 'rotate individual pages', 'drag and drop pages', '500mb pdf',
    '500 mb', 'scanned pages', 'page grid',
  ],
  'pdf-to-editable-word': [
    'pdf to editable word', 'editable word', 'pdf to docx editable', 'convert to editable word',
    'editable text', 'edit pdf in word', 'pdf to word editable', 'menu to word',
    'scanned pdf to word', 'ocr to word', 'pdf to word with formatting', 'pdf to editable docx',
    'editable', 'dind', 'find', 'pdf to editable', 'word editable',
  ],
  'pdf-to-word': [
    'pdf to word', 'pdf to docx', 'editable word', 'convert to word', 'pdf to text',
    'edit pdf in word',
  ],
  'word-to-pdf': [
    'word to pdf', 'docx to pdf', 'doc to pdf', 'convert word document to pdf',
  ],
  'merge-pdf': [
    'merge', 'combine pdf', 'join pdf', 'bind pdf', 'merge documents', 'stitch pdf',
  ],
  'split-pdf': [
    'split', 'cut pdf', 'extract pages', 'separate pages', 'divide pdf', 'break pdf',
  ],
  'delete-pdf-pages': [
    'delete pages', 'remove page', 'drop page', 'erase page',
  ],
  'watermark-pdf': [
    'watermark', 'stamp', 'confidential stamp', 'copyright mark', 'logo watermark',
  ],
  'page-numbers-pdf': [
    'page numbers', 'numbering', 'pagination', 'add footer numbers', 'bates stamp',
  ],
  'custom-photo-resizer': [
    'custom photo resizer', 'photo resizer', 'resize photo', 'resize image', 'photo dimensions',
    'change pixel size', '300 dpi', 'lock aspect ratio', 'photo scaler', 'custom dimensions',
  ],
  'photo-size-compressor': [
    'photo compressor', 'compress photo to 20kb', 'reduce photo size', 'compress image',
    'photo size compressor', 'target kb', 'compress to 50kb', '50kb photo', '20kb photo', '10kb photo',
  ],
  'photo-signature-resizer': [
    'upsc', 'ssc', 'bank exam', 'passport photo', 'signature', 'resize signature',
    '20kb to 50kb', '10kb to 20kb', 'job application', 'exam form', 'photo dimensions',
    'civil services photo', 'ibps signature',
  ],
  'photo-editor': [
    'photo editor', 'edit photo', 'adjust brightness', 'straighten photo', 'contrast',
    'filters', 'crop photo', 'rotate photo', 'grayscale', 'photo adjustment',
  ],
  'hd-image-enhancer': [
    'hd enhancer', 'hd image enhancer', 'enhance photo', 'sharpen image', 'unsharp mask',
    'enhance blurry photo', 'super resolution', 'upscale photo', 'sharpen',
  ],
  'image-format-converter': [
    'format converter', 'convert image format', 'jpg to png', 'png to jpg', 'webp converter',
    'convert photo format', 'transparency to jpg',
  ],
  'crop-rotate-straighten': [
    'crop photo', 'rotate photo', 'straighten', 'straighten photo', 'framing', 'aspect ratio crop',
  ],
  'photo-background-changer': [
    'background color changer', 'white background photo', 'blue background photo',
    'change photo background', 'passport white background', 'passport background',
  ],
  'passport-photo-cropper': [
    'crop passport photo', 'passport photo cutter', 'white background passport photo',
  ],
  'combine-app-documents': [
    'combine application documents', 'single pdf for job', 'attach documents',
  ],
  'ocr-tool': [
    'ocr', 'extract text from image', 'read scanned pdf', 'image to text', 'hindi ocr',
    'text recognition', 'photo to text',
  ],
  'pdf-text-extractor': [
    'extract text', 'copy all text', 'word count', 'character count',
  ],
  'protect-pdf': [
    'protect', 'privacy', 'sanitize pdf', 'strip metadata', 'clean pdf', 'secure pdf',
  ],
  'pdf-id-redactor': [
    'redact', 'redactor', 'hide aadhaar', 'mask aadhaar', 'aadhaar', 'aadhar', 'pan card',
    'bank account', 'hide bank', 'salary slip', 'hide salary', 'censor pdf', 'blackout pdf',
    'blur id', 'mask id', 'privacy redactor', 'remove sensitive info', 'hide number',
  ],
  'sign-pdf': [
    'sign pdf', 'signature', 'draw signature', 'digital sign', 'sign document',
  ],
  'pdf-metadata': [
    'metadata', 'wipe metadata', 'pdf properties', 'author name', 'clean privacy',
  ],
  'csv-to-xlsx': [
    'csv to excel', 'csv to xlsx', 'convert csv', 'open csv in excel',
  ],
  'xlsx-to-csv': [
    'excel to csv', 'xlsx to csv', 'export csv',
  ],
  'sheet-viewer': [
    'view excel', 'inspect spreadsheet', 'csv reader', 'open xlsx', 'table viewer',
  ],
  'text-diff-comparator': [
    'compare text', 'diff', 'text difference', 'compare two documents',
  ],
  'text-cleaner': [
    'clean text', 'remove extra spaces', 'format text', 'case converter',
  ],
  'powerpoint-to-pdf': [
    'powerpoint to pdf', 'pptx to pdf', 'ppt to pdf', 'slides to pdf', 'convert presentation', 'powerpoint',
  ],
  'excel-to-pdf': [
    'excel to pdf', 'xlsx to pdf', 'xls to pdf', 'spreadsheet to pdf', 'convert excel table',
  ],
  'pdf-to-excel': [
    'pdf to excel', 'pdf to xlsx', 'extract table from pdf', 'pdf table to excel', 'convert pdf to spreadsheet',
  ],
  'jpg-to-png': [
    'jpg to png', 'jpeg to png', 'convert jpg', 'transparent png',
  ],
  'png-to-jpg': [
    'png to jpg', 'png to jpeg', 'convert png', 'compress png',
  ],
  'searchable-pdf-text-finder': [
    'find anything in scanned pdfs', 'search scanned pdf', 'searchable pdf', 'search text in scanned',
    'ocr search', 'find in pdf', 'ctrl f scanned pdf', 'find text', 'search word in pdf',
  ],
};

export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return TOOLS;

  return TOOLS.filter((t) => {
    // 1. Direct field matches
    if (
      t.title.toLowerCase().includes(q) ||
      t.shortDesc.toLowerCase().includes(q) ||
      t.categoryName.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.acceptedFormats.some((f) => f.toLowerCase().includes(q))
    ) {
      return true;
    }

    // 2. Natural language task intent synonyms
    const synonyms = TASK_SYNONYMS[t.id];
    if (synonyms && synonyms.some((syn) => syn.includes(q) || q.includes(syn))) {
      return true;
    }

    return false;
  });
}

