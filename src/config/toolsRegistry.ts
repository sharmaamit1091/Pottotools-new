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
    id: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Fill forms, compress, merge, split, organize, lock, unlock, sign, redact, clean scan watermarks, and run OCR on PDFs.',
    iconName: 'Layers',
  },
  {
    id: 'word-tools',
    name: 'Word Tools',
    description: 'Convert Word (.docx) to PDF, turn digital or scanned PDFs into editable Word files, and convert DOCX, TXT, or Markdown.',
    iconName: 'FileText',
  },
  {
    id: 'excel-tools',
    name: 'Excel Tools',
    description: 'Convert Excel workbooks to PDF, extract PDF tables to Excel, switch between CSV and XLSX, and view spreadsheets in-browser.',
    iconName: 'Sheet',
  },
  {
    id: 'powerpoint-tools',
    name: 'PowerPoint Tools',
    description: 'Extract PowerPoint (.pptx) presentation slides into clean, easy-to-read landscape PDF handouts.',
    iconName: 'Presentation',
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    description: 'Resize, crop, edit, compress to target KB, prepare UPSC/SSC/passport photos and signatures, and convert JPG, PNG, WebP, or PDF.',
    iconName: 'Image',
  },
  {
    id: 'other-document-tools',
    name: 'Other Tools',
    description: 'Compare two texts side by side and clean up formatting, spacing, and letter casing.',
    iconName: 'Sparkles',
  },
];

export const TOOLS: ToolDefinition[] = [
  // FILL PDF FORM (All-in-One Browser PDF Form Filler & Editor)
  {
    id: 'fill-pdf-form',
    slug: 'fill-pdf-form',
    title: 'Fill PDF Form',
    shortDesc: 'Click anywhere on a PDF to type text, insert photos, signatures, dates and checkmarks.',
    fullDesc: 'Fill out or edit any PDF directly in your browser without converting to Word. Click anywhere to type text (including Hindi & Unicode), insert and crop photos, draw or type digital signatures, reuse photos/signatures and text snippets across pages, add checkmarks, dates, and shapes, fill existing AcroForm fields, rotate pages, save .pottoform progress, and download a print-ready PDF.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'FileSignature',
    isPopular: true,
    badge: 'Form Filler',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 100,
    outputFormat: 'Filled PDF (.pdf)',
    instructions: [
      'Upload any PDF document (fillable, static, or scanned) or reopen a saved .pottoform project.',
      'Click anywhere to type text, insert dates, place tick/cross marks, or draw lines and boxes.',
      'Upload your photo or create a digital signature once in the Reusable Assets sidebar and place independent copies on any page.',
      'Optionally run Auto-Detect Fields to highlight likely Name, Date, Address, Photo, and Signature areas for your approval.',
      'Review with Before/After or Print-Ready Preview, then click Download PDF to save your completed form.',
    ],
    faqs: [
      {
        question: 'Can I fill a PDF that does not have editable form fields?',
        answer: 'Yes. FILL PDF FORM works on any PDF—scanned forms, static PDFs, government or school application sheets, and interactive AcroForm PDFs—without needing to convert to Word.',
      },
      {
        question: 'Can I reuse my photo and signature across multiple pages?',
        answer: 'Yes. Upload your photo or create your signature once in the Reusable Assets panel, then drag or click to place it on any page. Each placed copy can be moved, resized, cropped, or deleted independently.',
      },
      {
        question: 'Can I save my editing progress and continue later?',
        answer: 'Yes. Click Save Progress to download a portable .pottoform project file containing your PDF, placed elements, reusable assets, and text snippets. Reopen it anytime from this page.',
      },
      {
        question: 'Are my PDFs, photos, or signatures uploaded to any server?',
        answer: 'No. Everything runs locally inside your web browser. Your reusable photos and signatures stay in your current editing session only unless you explicitly download a .pottoform file.',
      },
    ],
    limitations: [
      'Password-protected PDFs must be unlocked before filling.',
      'Optional Auto-Detect suggests likely form fields and may not detect every custom layout; manual click-anywhere placement is always available.',
      'Browser-local session assets clear when you close the tab unless you save a .pottoform project file.',
    ],
  },

  // Find Anything in Scanned PDFs (Searchable PDF & In-Browser OCR Text Finder)
  {
    id: 'searchable-pdf-text-finder',
    slug: 'searchable-pdf-text-finder',
    title: 'Searchable PDF & Scanned Text Finder',
    shortDesc: 'Search names, dates, and words inside scanned PDFs and download a searchable PDF.',
    fullDesc: 'Upload any scanned or regular PDF up to 500 MB. Read scanned pages in English or Hindi, search for any word, name, date, or number with page highlights, copy text, and download a searchable PDF right on your device.',
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

  // Office Note Digitizer (Handwritten Scanned Documents to Editable Text — 100% Local)
  {
    id: 'office-note-digitizer',
    slug: 'office-note-digitizer',
    title: 'Office Note Digitizer',
    shortDesc: 'Convert handwritten scanned office noting sheets and PDFs into editable Hindi & English text on your device.',
    fullDesc: 'Convert handwritten scanned office notes (PDF, JPG, PNG) into editable Hindi and English text right inside your browser without uploading files to any server. Enhance faded or tilted scans, proofread side-by-side against the original page, and download as Word (.docx), Searchable PDF, or Plain Text (.txt).',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'FileEdit',
    isPopular: true,
    badge: 'Handwriting Beta',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png', 'application/pdf', 'image/jpeg', 'image/png'],
    maxFileSizeMB: 50,
    outputFormat: 'DOCX, Searchable PDF & TXT',
    instructions: [
      'Upload a scanned handwritten PDF (single or multi-page) or JPG/PNG photos.',
      'Select Hindi + English, English, or Hindi and choose your handwriting style.',
      'Optional: Clean up faded paper, shadows, or tilt using Image Enhancement without changing your original scan.',
      'Click "Convert to Text" and review or edit the result side-by-side with your scan.',
      'Download your finished document as Editable Word (.docx), Searchable PDF, or Plain Text (.txt).',
    ],
    faqs: [
      {
        question: 'Are my handwritten office documents uploaded to any server?',
        answer: 'No. Your uploaded PDFs, photos, and extracted text stay 100% on your device and are never uploaded to any external server.',
      },
      {
        question: 'Does it support Hindi, English, and faded old office scans?',
        answer: 'Yes. It supports Hindi, English, and mixed Hindi-English office notes, and includes built-in scan cleanup for shadows, yellowing, tilt, and faint ink. You can quickly review and edit any word side-by-side before downloading.',
      },
      {
        question: 'What formats can I download?',
        answer: 'You can download editable Microsoft Word (.docx) files, Searchable PDFs (keeping your original scanned page with Ctrl+F searchable text), or clean Plain Text (.txt).',
      },
    ],
    limitations: [
      'First-time setup downloads offline recognition data once in your browser; your documents themselves never leave your device.',
      'Hindi handwriting recognition is currently in Beta — neat handwriting gives the best results, and cursive writing may need quick manual edits.',
      'On devices with limited memory, converting one page at a time works best.',
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
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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

  // Word Tools
  {
    id: 'pdf-to-editable-word',
    slug: 'pdf-to-editable-word',
    title: 'PDF to Word (.docx)',
    shortDesc: 'Convert digital or scanned PDFs into editable Word (.docx) documents with preserved layout, tables, and images.',
    fullDesc: 'Transform digital or scanned PDF documents into genuinely editable Microsoft Word (.docx) files while preserving original designs, fonts, multi-column alignments, photos/images, and tables. Includes automatic in-browser OCR for scanned PDFs.',
    category: 'word-tools',
    categoryName: 'Word Tools',
    iconName: 'FileEdit',
    isPopular: true,
    badge: 'Layout + OCR',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 50,
    outputFormat: 'Word (.docx)',
    instructions: [
      'Upload any text-based or scanned PDF document (resumes, invoices, contracts, menus, brochures).',
      'Select conversion options including photo/logo preservation and scanned page OCR.',
      'Our engine performs geometric layout analysis, multi-column alignment, and image extraction.',
      'Download your genuinely editable Word (.docx) file with preserved layout, tables, images, and text.',
    ],
    faqs: [
      {
        question: 'Does this create a real editable .docx file instead of flat page images?',
        answer: 'Yes. Every heading, paragraph, table cell, and column is reconstructed as genuine OpenXML Microsoft Word text runs that you can select, edit, and reformat in Word, LibreOffice, or Google Docs.',
      },
      {
        question: 'Are images, logos, and photos preserved?',
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
    id: 'word-to-pdf',
    slug: 'word-to-pdf',
    title: 'Word (.docx) to PDF',
    shortDesc: 'Convert Microsoft Word DOCX documents into clean, shareable PDF files.',
    fullDesc: 'Convert Microsoft Word (.docx) documents into clean, print-ready PDF files directly inside your browser while preserving heading hierarchy, paragraph formatting, bullet lists, and structured tables with zero cloud uploads.',
    category: 'word-tools',
    categoryName: 'Word Tools',
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
    category: 'word-tools',
    categoryName: 'Word Tools',
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
    category: 'word-tools',
    categoryName: 'Word Tools',
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
    category: 'word-tools',
    categoryName: 'Word Tools',
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
    category: 'word-tools',
    categoryName: 'Word Tools',
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
    category: 'image-tools',
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
    category: 'image-tools',
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
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    title: 'OCR: Scanned PDF & Image to Text',
    shortDesc: 'Copy editable text from photos and scanned PDFs in English or Hindi.',
    fullDesc: 'Turn photos, receipts, bills, and scanned PDFs into copyable text or an editable Word file. Supports English and Hindi right inside your browser without uploading your files.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    title: 'Protect PDF (Add Password)',
    shortDesc: 'Lock your PDF with a strong password and block unwanted printing or copying.',
    fullDesc: 'Add a real password lock to any PDF right on your device. Anyone opening the file in Chrome, Adobe Reader, or on a phone will need your password. You can also block printing or text copying — without uploading your file.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'Lock',
    isPopular: true,
    badge: 'Password Lock',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 100,
    outputFormat: 'Encrypted PDF (.pdf)',
    instructions: [
      'Upload the PDF document you want to password-protect.',
      'Enter and confirm a strong Open Password required to view the document.',
      'Optionally expand Encryption & Permissions to choose AES-256/AES-128 and restrict printing, copying, or editing.',
      'Click "Encrypt & Protect PDF" and download your cryptographically locked PDF.',
    ],
    faqs: [
      {
        question: 'Is this real cryptographic PDF password protection?',
        answer: 'Yes. PottoTools uses real ISO-standard AES-256 (R=6) and AES-128 (R=4) WebAssembly encryption inside your browser. Every downloaded file is self-verified and genuinely prompts for your password in Adobe Acrobat, Chrome, Edge, Firefox, Safari, and mobile PDF viewers.',
      },
      {
        question: 'Are my PDF or password ever uploaded to a server?',
        answer: 'Never. Both your PDF file and password remain 100% inside local browser memory and are never transmitted over the internet.',
      },
      {
        question: 'What if I forget the password I set?',
        answer: 'Because encryption is genuine AES-256 and nothing is sent to any server, PottoTools cannot recover forgotten passwords. Store your password safely in a password manager.',
      },
    ],
    limitations: [
      'Genuine AES-256 encryption cannot be bypassed without the password; keep a secure copy of your password.',
    ],
  },
  {
    id: 'unlock-pdf',
    slug: 'unlock-pdf',
    title: 'Unlock PDF (Remove Password)',
    shortDesc: 'Remove passwords from PDFs like e-Aadhaar, bank statements, and payslips on your device.',
    fullDesc: 'Permanently remove open passwords and print or copy locks from your PDF files right inside your browser. Keeps all original text, fonts, links, and page quality completely clear without uploading your file.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'Unlock',
    isPopular: true,
    badge: 'Instant Unlock',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 100,
    outputFormat: 'Unlocked PDF (.pdf)',
    instructions: [
      'Upload your password-protected or print/copy-restricted PDF file.',
      'PottoTools automatically detects whether an open password is required or if only owner restrictions are present.',
      'Enter the PDF password (case-sensitive) if required and click "Unlock PDF Now".',
      'Download your permanently unlocked PDF with 100% original vector text and quality preserved.',
    ],
    faqs: [
      {
        question: 'Does Unlock PDF work on e-Aadhaar, bank statements, and salary slips?',
        answer: 'Yes. It supports AES-256 (R=6/R=5), AES-128 (R=4), and RC4-128 encrypted PDFs commonly issued by UIDAI (e-Aadhaar), Indian banks, HR portals, and Adobe Acrobat.',
      },
      {
        question: 'Does unlocking reduce PDF quality or turn pages into images?',
        answer: 'No. Unlock PDF performs genuine lossless cryptographic decryption, keeping all vector fonts, selectable text, Ctrl+F searchability, links, and layout 100% intact.',
      },
      {
        question: 'Can it unlock a PDF without knowing the open password?',
        answer: 'If a PDF only has owner/permissions restrictions (such as disabled printing or copying) without an open password, it unlocks immediately without a password. If a PDF is locked with an open password, you must enter the authorized password to decrypt it.',
      },
    ],
    limitations: [
      'Open-password encrypted PDFs require the correct authorized password; PottoTools does not brute-force or crack unknown passwords.',
    ],
  },
  {
    id: 'pdf-id-redactor',
    slug: 'pdf-id-redactor',
    title: 'PDF & ID Redactor',
    shortDesc: 'Permanently blackout or blur visible Aadhaar numbers, PAN, bank details, and salary info on pages.',
    fullDesc: 'Draw permanent blackout, whiteout, or pixel-blur boxes over visible sensitive details in PDFs and ID photos (JPG, PNG, WebP). Flattens masked pages offline on your device so covered text can never be selected or uncovered.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'EyeOff',
    isPopular: true,
    badge: '100% Offline Privacy',
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
    id: 'remove-scan-watermark',
    slug: 'remove-scan-watermark',
    title: 'Remove Scan Watermark',
    shortDesc: 'Remove unwanted scanner app labels from your scanned PDF pages.',
    fullDesc: 'Clean unwanted scanner-app promotional labels such as "Scanned with CamScanner", "Scanned with Adobe Scan", TapScanner, Microsoft Lens, and other scanner footers from your own scanned PDF pages directly in your browser. Supports both lossless text-based label removal and smart directional paper reconstruction for image-based scans, with complete manual rectangle selection and mandatory Before-and-After inspection before downloading.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
    iconName: 'Sparkles',
    isPopular: true,
    badge: 'Auto + Manual Clean',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.pdf', 'application/pdf'],
    maxFileSizeMB: 100,
    outputFormat: 'Clean PDF (.pdf)',
    instructions: [
      'Upload or drag and drop your scanned PDF document (processed 100% locally in your browser).',
      'Review any automatically detected text-based scanner labels, or click "Auto-Detect Scan Labels (OCR)" to scan image-based pages.',
      'For complete control, drag directly on the PDF preview to draw, move, or resize a selection rectangle around the unwanted scanner label—and apply it to all pages or specific pages.',
      'Click "Remove Watermark & Inspect Result" to examine the mandatory Before-and-After slider or side-by-side comparison (with zoom and change highlights), then approve and click "Download Clean PDF".',
    ],
    faqs: [
      {
        question: 'Which scanner app labels can REMOVE SCAN WATERMARK detect?',
        answer: 'Automatic detection recognizes common scanner-app footers and stamps including "Scanned with CamScanner", "Scanned with Adobe Scan", TapScanner, Microsoft Lens, Genius Scan, Notebloc, ClearScanner, Fast Scanner, TurboScan, vFlat, Kaagaz, and similar scanner-app labels—anywhere on the page, not just the bottom.',
      },
      {
        question: 'What if automatic detection misses a scanner watermark or is uncertain?',
        answer: 'Manual Watermark Selection is built directly into the PDF preview. You can draw a rectangle around any unwanted scanner label, move or resize its corners, preview the clean result live, and apply that exact region to all pages or specific page ranges.',
      },
      {
        question: 'Does this tool handle both text-based and image-based scanned PDFs?',
        answer: 'Yes. If a scanner app added the label as selectable PDF text, the engine strips only the matching scanner text operator losslessly while preserving original vector fonts. If the label is baked into a scanned page image, smart directional paper reconstruction blends the local background color and paper grain seamlessly.',
      },
      {
        question: 'Can I check the result before downloading my clean PDF?',
        answer: 'Yes—Before-and-After preview is mandatory before downloading. You can drag the interactive comparison slider, switch to Side-by-Side view, highlight cleaned areas, zoom up to 300%, and return to adjust your selection at any time.',
      },
      {
        question: 'Are my scanned PDFs uploaded to a server?',
        answer: 'No. PDF rendering, text inspection, optional OCR detection, paper reconstruction, and clean PDF generation all run locally in your web browser so your documents stay on your device.',
      },
    ],
    limitations: [
      'Intended strictly for removing unwanted scanner-app promotional labels from documents you own or are authorized to modify—not for removing copyright notices, third-party attribution, official seals, signatures, or authenticity marks.',
      'If a scanner label directly overlaps body text, tables, stamps, or handwritten signatures, pixel reconstruction may affect overlapping strokes; the tool displays a Content Overlap Caution so you can tighten the box and verify readability in the Before-and-After preview.',
      'Pages cleaned via image-based paper reconstruction preserve original dimensions and orientation at high resolution, while untouched pages and lossless text-cleaned pages keep their original vector structure.',
      'Password-protected PDFs must be decrypted first using the Unlock PDF tool before cleaning.',
    ],
  },
  {
    id: 'sign-pdf',
    slug: 'sign-pdf',
    title: 'Sign PDF Document',
    shortDesc: 'Draw a navy-ink signature or upload an image stamp onto any PDF page.',
    fullDesc: 'Draw a freehand signature with mouse, trackpad, or touch (or upload a PNG/JPG signature image), choose the target page, and embed it cleanly onto your PDF locally in your browser. Signed PDFs include a subtle PottoTools full-page watermark.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    title: 'Remove PDF Metadata',
    shortDesc: 'Inspect and wipe hidden PDF document properties like author name, title, software creator, and keywords.',
    fullDesc: 'Inspect and clear hidden document properties (Author, Title, Subject, Keywords, Creator app, and Producer) stored inside a PDF file dictionary without changing any visible page text or images.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    category: 'image-tools',
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
    category: 'image-tools',
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
    title: 'Exam & Passport Photo & Signature Resizer',
    shortDesc: 'Resize & crop photos and signatures with verified presets for UPSC, SSC, IBPS, State PSCs & Passports (35×45mm, 2×2 in).',
    fullDesc: 'Verified dual-constraint optimization for government job portals, university admissions, civil service exams (UPSC, SSC CGL/CHSL, IBPS PO/Clerk, State PSCs), and international passports (35×45mm, 2×2 inch). Guarantees exact pixel dimensions, official white or light-blue backgrounds, and strict KB bounds simultaneously.',
    category: 'image-tools',
    categoryName: 'Image Tools',
    subCategory: 'Photo & Signature for Exams',
    iconName: 'Award',
    badge: 'Exam & Passport',
    status: 'tested',
    processingLocation: 'browser',
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSizeMB: 35,
    outputFormat: 'JPG (.jpg) or PNG',
    instructions: [
      'Upload your passport photo or signature image.',
      'Select your exam or passport preset (e.g. UPSC Photo 200x230 px, SSC Signature 140x60 px, Bank PO, 3.5x4.5cm Passport, or US Visa 2x2 inch).',
      'Choose the official background color requirement (Pure White or Light Blue).',
      'Click "Apply Preset" to generate your compliant photo.',
      'Verify green compliance checkmarks for dimensions, file size, and format, then download.',
    ],
    faqs: [
      {
        question: 'Why do government and passport portals reject photos?',
        answer: 'Most portals validate both dimensions (e.g. 200x230 px or 35×45mm) and file size (e.g. 20 KB to 50 KB). If either fails, the portal rejects your upload. PottoTools satisfies both criteria simultaneously.',
      },
      {
        question: 'Are exam and passport presets verified?',
        answer: 'Yes, presets reflect official UPSC, SSC, IBPS, Indian/EU 35×45mm passport, and US 2×2 inch visa guidelines.',
      },
    ],
    limitations: [],
  },

  // 8. Smart Document Utilities
  {
    id: 'pdf-text-extractor',
    slug: 'pdf-text-extractor',
    title: 'PDF Text Extractor & Word Counter',
    shortDesc: 'Extract all readable text, word count, character count, and line count from any PDF.',
    fullDesc: 'Fast client-side PDF text extraction. Inspect full extracted prose, view word counts, character counts, page stats, and estimated reading time.',
    category: 'pdf-tools',
    categoryName: 'PDF Tools',
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
    title: 'Compare Two Texts',
    shortDesc: 'Compare two pieces of text side by side to quickly spot what changed.',
    fullDesc: 'Paste two versions of a letter, contract, or note side by side to instantly highlight added words in green and removed words in red right inside your browser.',
    category: 'other-document-tools',
    categoryName: 'Other Tools',
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
    category: 'other-document-tools',
    categoryName: 'Other Tools',
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
    category: 'excel-tools',
    categoryName: 'Excel Tools',
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
    category: 'excel-tools',
    categoryName: 'Excel Tools',
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
    title: 'View Excel & CSV Files',
    shortDesc: 'Open, search, and filter Excel and CSV spreadsheets right in your browser.',
    fullDesc: 'Open and read any Excel (.xlsx) or CSV file without installing Microsoft Excel. Search rows, check values, and export clean tables in seconds.',
    category: 'excel-tools',
    categoryName: 'Excel Tools',
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
    category: 'powerpoint-tools',
    categoryName: 'PowerPoint Tools',
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
    category: 'excel-tools',
    categoryName: 'Excel Tools',
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
    category: 'excel-tools',
    categoryName: 'Excel Tools',
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
    description: 'Fill forms, compress, merge, split, organize, lock, unlock, sign, redact, clean scan watermarks, and run OCR on PDFs.',
    iconName: 'Layers',
    colorClass: 'text-red-600 dark:text-red-400',
    toolIds: [
      'fill-pdf-form',
      'office-note-digitizer',
      'compress-pdf',
      'merge-pdf',
      'split-pdf',
      'pdf-page-organizer',
      'delete-pdf-pages',
      'watermark-pdf',
      'page-numbers-pdf',
      'protect-pdf',
      'unlock-pdf',
      'sign-pdf',
      'pdf-id-redactor',
      'pdf-metadata',
      'remove-scan-watermark',
      'searchable-pdf-text-finder',
      'ocr-tool',
      'pdf-text-extractor',
      'pdf-to-images',
    ],
  },
  {
    id: 'word-tools',
    name: 'Word Tools',
    shortName: 'Word',
    description: 'Convert Word (.docx) to PDF, turn digital or scanned PDFs into editable Word files, and convert DOCX, TXT, or Markdown.',
    iconName: 'FileText',
    colorClass: 'text-blue-600 dark:text-blue-400',
    toolIds: [
      'pdf-to-editable-word',
      'word-to-pdf',
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
    description: 'Convert Excel sheets to PDF, switch between CSV and Excel, view tables, and copy PDF tables to Excel.',
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
    description: 'Turn PowerPoint (.pptx) presentation slides into neat, easy-to-read PDF handouts.',
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
    description: 'Resize, crop, edit, compress to target KB, prepare UPSC/SSC/passport photos and signatures, and convert JPG, PNG, WebP, or PDF.',
    iconName: 'Image',
    colorClass: 'text-purple-600 dark:text-purple-400',
    toolIds: [
      'custom-photo-resizer',
      'photo-size-compressor',
      'photo-signature-resizer',
      'image-converter',
      'image-to-pdf',
    ],
  },
  {
    id: 'other-document-tools',
    name: 'Other Tools',
    shortName: 'Other Tools',
    description: 'Compare two texts side by side and clean up messy text spacing, line breaks, and letter casing.',
    iconName: 'Sparkles',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    toolIds: [
      'text-diff-comparator',
      'text-cleaner',
    ],
  },
];

// Graceful route aliases so merged or legacy tool URLs never 404
const TOOL_SLUG_ALIASES: Record<string, string> = {
  'pdf-to-word': 'pdf-to-editable-word',
  'crop-rotate-straighten': 'custom-photo-resizer',
  'custom-photo-resizer': 'custom-photo-resizer',
  'custom-photo-studio': 'custom-photo-resizer',
  'photo-editor': 'custom-photo-resizer',
  'hd-image-enhancer': 'custom-photo-resizer',
  'passport-photo-cropper': 'photo-signature-resizer',
  'photo-background-changer': 'photo-signature-resizer',
  'image-format-converter': 'image-converter',
  'jpg-to-png': 'image-converter',
  'png-to-jpg': 'image-converter',
  'combine-app-documents': 'merge-pdf',
  'office-note-organizer': 'office-note-digitizer',
};

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().replace(/^tool-/, '').replace(/^\//, '').trim();
  const aliasedId = TOOL_SLUG_ALIASES[clean];
  if (aliasedId) {
    return TOOLS.find((t) => t.id === aliasedId);
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
    'change image format', 'convert image', 'convert photo', 'jpg to png', 'jpeg to png',
    'png to jpg', 'png to jpeg', 'png to webp', 'image format', 'bmp to jpg', 'webp to png',
    'webp converter', 'format converter', 'convert photo format', 'transparency', 'transparent png',
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
    'pdf to word', 'pdf to docx', 'pdf to editable word', 'editable word', 'pdf to docx editable',
    'convert to editable word', 'convert to word', 'editable text', 'edit pdf in word',
    'pdf to word editable', 'menu to word', 'scanned pdf to word', 'ocr to word',
    'pdf to word with formatting', 'pdf to editable docx', 'pdf to editable', 'word editable',
  ],
  'word-to-pdf': [
    'word to pdf', 'docx to pdf', 'doc to pdf', 'convert word document to pdf',
  ],
  'merge-pdf': [
    'merge', 'combine pdf', 'join pdf', 'bind pdf', 'merge documents', 'stitch pdf',
    'combine application documents', 'single pdf for job', 'attach documents',
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
    'photo editor', 'edit photo', 'adjust brightness', 'straighten photo', 'contrast',
    'filters', 'crop photo', 'rotate photo', 'grayscale', 'photo adjustment', 'sharpen',
    'enhance photo', 'aspect ratio crop', 'framing',
  ],
  'photo-size-compressor': [
    'photo compressor', 'compress photo to 20kb', 'reduce photo size', 'compress image',
    'photo size compressor', 'target kb', 'compress to 50kb', '50kb photo', '20kb photo', '10kb photo',
  ],
  'photo-signature-resizer': [
    'upsc', 'ssc', 'bank exam', 'passport photo', 'signature', 'resize signature',
    '20kb to 50kb', '10kb to 20kb', 'job application', 'exam form', 'photo dimensions',
    'civil services photo', 'ibps signature', 'crop passport photo', 'passport photo cutter',
    '35x45mm', '2x2 inch', 'white background photo', 'blue background photo',
    'passport white background', 'passport background', 'background color',
  ],
  'ocr-tool': [
    'ocr', 'extract text from image', 'read scanned pdf', 'image to text', 'hindi ocr',
    'text recognition', 'photo to text',
  ],
  'pdf-text-extractor': [
    'extract text', 'copy all text', 'word count', 'character count',
  ],
  'protect-pdf': [
    'protect', 'protect pdf', 'lock pdf', 'password protect pdf', 'encrypt pdf', 'aes 256', 'add password to pdf', 'secure pdf',
  ],
  'unlock-pdf': [
    'unlock', 'unlock pdf', 'remove pdf password', 'decrypt pdf', 'unprotect pdf', 'aadhaar pdf unlock', 'bank statement unlock', 'remove restrictions', 'open locked pdf',
  ],
  'pdf-id-redactor': [
    'redact', 'redactor', 'hide private info', 'hide aadhaar', 'mask aadhaar', 'aadhaar', 'aadhar', 'pan card',
    'bank account', 'hide bank', 'salary slip', 'hide salary', 'censor pdf', 'blackout pdf',
    'blur id', 'mask id', 'privacy redactor', 'remove sensitive info', 'hide number',
  ],
  'remove-scan-watermark': [
    'remove scan watermark', 'camscanner', 'remove camscanner watermark', 'scanned with camscanner',
    'adobe scan', 'remove adobe scan watermark', 'scanned with adobe scan', 'tapscanner',
    'remove scanner watermark', 'scanner app label', 'clean scanned pdf', 'remove pdf footer label',
    'notebloc', 'microsoft lens', 'kaagaz', 'clearscanner', 'genius scan',
  ],
  'sign-pdf': [
    'sign pdf', 'signature', 'draw signature', 'digital sign', 'sign document',
  ],
  'pdf-metadata': [
    'metadata', 'wipe metadata', 'remove pdf metadata', 'remove hidden pdf info', 'remove hidden info',
    'pdf properties', 'author name', 'clean privacy', 'document info',
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
  'fill-pdf-form': [
    'fill pdf form', 'fill pdf online', 'add text to pdf', 'add photo to pdf',
    'add signature to pdf', 'edit pdf forms', 'fill pdf without converting to word',
    'add image to pdf', 'type on pdf', 'pdf form filler', 'add checkmark to pdf',
    'add date to pdf', 'passport photo on pdf', 'fill scanned pdf', 'write on pdf',
  ],
  'searchable-pdf-text-finder': [
    'find anything in scanned pdfs', 'search scanned pdf', 'searchable pdf', 'search text in scanned',
    'ocr search', 'find in pdf', 'ctrl f scanned pdf', 'find text', 'search word in pdf',
  ],
  'office-note-digitizer': [
    'office note digitizer', 'office note organizer', 'office note', 'handwritten notes',
    'handwriting to text', 'handwritten to word', 'handwritten pdf', 'hindi handwriting',
    'noting sheet', 'digitize notes', 'scanned notes', 'handwritten document',
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

