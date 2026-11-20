export interface CategoryGuidance {
  slug: string;
  metaTitle: string;
  metaDesc: string;
  h1: string;
  description: string;
  workflowTitle: string;
  workflowSummary: string;
  workflowBullets: string[];
  faqs: { q: string; a: string }[];
}

export const CATEGORY_GUIDANCE_LIST: CategoryGuidance[] = [
  {
    slug: 'pdf-tools',
    metaTitle: 'PDF Tools Online – Compress to 100KB, Merge, Split, Redact & Convert | PottoTools',
    metaDesc:
      'Free browser-based PDF tools: compress PDF to 100KB/200KB, merge, split, rotate & reorder pages up to 500 MB, permanently redact Aadhaar/bank details offline, and convert PDFs.',
    h1: 'Free Online PDF Tools Suite',
    description:
      'Organize, compress, merge, split, redact, sign, sanitize metadata, and convert PDF documents locally inside your browser without uploading files to remote servers.',
    workflowTitle: 'Choosing the Right PDF Tool for Your Task',
    workflowSummary:
      'Match your document need to the right browser workflow before processing so you avoid unnecessary quality loss or extra steps:',
    workflowBullets: [
      'Meeting portal upload caps (100 KB / 200 KB / 500 KB): Delete unwanted sheets first, then run Compress PDF—light optimization preserves vector text, while aggressive byte targets re-render pages as compact JPEG streams.',
      'Fixing sideways scans or huge PDFs (up to 500 MB): Open PDF Page Organizer to drag-reorder thumbnails, rotate individual 90°/180° sheets without quality loss, and restore accidental deletes with undo.',
      'Hiding sensitive Aadhaar, PAN, or salary data: Use Offline PDF & ID Redactor, which flattens masked regions into pixels so hidden text cannot be selected or uncovered.',
      'Searching or converting scanned paper PDFs: Run Find Anything in Scanned PDFs for English/Hindi OCR search, or PDF to Editable Word for full layout + OCR reconstruction.',
    ],
    faqs: [
      {
        q: 'Can I compress a PDF to 100KB or 200KB for online portals?',
        a: 'Yes. PottoTools Compress PDF lets you choose presets (100KB, 200KB, 500KB) or a custom target limit. Light compression trims metadata and streams, while strict tight KB limits re-render pages as resolution-scaled JPEG streams to fit the byte cap.',
      },
      {
        q: 'Are my PDF documents uploaded to a remote server?',
        a: 'No. All PDF tools run directly inside your web browser on your own device—nothing is uploaded to any server.',
      },
      {
        q: 'How many PDF pages can I reorder or organize at once?',
        a: 'PDF Page Organizer handles documents up to 500 MB across hundreds of pages, supporting visual reordering, individual 90°/180°/270° rotation, deletion, and undo.',
      },
    ],
  },
  {
    slug: 'image-tools',
    metaTitle: 'Image Tools & Photo Studio – Resize px, cm, mm, Passport & Exam Photos | PottoTools',
    metaDesc:
      'Precision Photo Studio for pixel, centimeter (cm), millimeter (mm), and inch resizing at 72–300 DPI. Crop 35x45mm or 2x2 passport photos, hit 20KB–50KB exam limits, and enhance portraits.',
    h1: 'Image Tools & Precision Photo Studio',
    description:
      'Built around physical unit math and recruitment compliance: resize photos in pixels, cm, mm, or inches with selectable DPI, crop standard 35x45mm or 2x2 inch passport frames, hit strict 20KB–50KB ceilings, swap solid backgrounds, and sharpen soft portraits.',
    workflowTitle: 'Photo Resizing, DPI & Official Spec Guide',
    workflowSummary:
      'Most photo rejection errors happen because users shrink KB file size without matching physical aspect ratios first. Follow this studio sequence:',
    workflowBullets: [
      'Physical dimension accuracy: Convert centimeters or millimeters accurately using DPI (at 300 DPI, 3.5 × 4.5 cm equals 413 × 531 px; 2 × 2 inches equals 600 × 600 px).',
      'Prevent stretched faces: Always lock aspect ratio or frame your head-and-shoulders inside Passport Photo Cropper (35x45mm / 2x2 in) before applying byte compression.',
      'Strict 20KB–50KB recruitment uploads: Use Photo & Signature Resizer to enforce both pixel bounds and exact KB ceilings in one pass without unreadable signature strokes.',
      'Uniform backdrops & sharpening: Swap uneven room walls to Pure White (#FFFFFF) or Light Blue (#D0E8F2) with chroma thresholding, and refine soft portraits with Contrast-Adaptive Sharpening.',
    ],
    faqs: [
      {
        q: 'How do I resize a photo to exact centimeters (cm) or millimeters (mm)?',
        a: 'Open Custom Photo Studio or Custom Photo Resizer, switch the unit selector to cm or mm, pick your target DPI (such as 200 or 300 DPI), and enter exact physical width and height.',
      },
      {
        q: 'How do I fit both pixel dimensions and a 20KB–50KB limit for forms?',
        a: 'Use Exam Photo & Signature Resizer, select or enter your required width × height pixels alongside your max KB limit, and the optimizer tunes dimensions and JPEG compression iteratively.',
      },
      {
        q: 'How is Image Tools different from the Convert Images format hub?',
        a: 'Image Tools focuses on editing, physical cm/mm sizing, DPI scaling, passport framing, sharpening, and KB optimization, whereas Convert Images specializes in raster format transcoding (JPG, PNG, WebP, BMP) and image-PDF workflows.',
      },
    ],
  },
  {
    slug: 'convert-docs',
    metaTitle: 'Document Conversion Tools – Word, PDF, Markdown, OCR & Slides | PottoTools',
    metaDesc:
      'Convert between Word (.docx), PDF, HTML, Plain Text, Markdown, Excel, PowerPoint text handouts, and scanned OCR locally in your browser without Office installed.',
    h1: 'Free Online Document Conversion Tools',
    description:
      'Cross-convert Microsoft Word (.docx), PDF, plain text, Markdown, semantic HTML, PowerPoint (.pptx) text decks, and Excel sheets directly in your browser without server uploads.',
    workflowTitle: 'Picking the Best Document Converter for Your File Structure',
    workflowSummary:
      'Different source files store structure differently—choosing the right converter preserves headings, tables, or plain copy cleanly:',
    workflowBullets: [
      'Digital Word-exported PDFs to DOCX: Use standard PDF to Word for fast paragraph reconstruction of selectable text.',
      'Scanned PDFs, invoices & multi-column menus: Pick PDF to Editable Word (Layout + OCR) to rebuild columns, tables, embedded photos, and scanned text.',
      'Clean web publishing from DOCX: Use Word DOCX to HTML for semantic headings and paragraphs stripped of heavy Word inline styles, or DOCX to TXT for raw text.',
      'Notes & code documentation to PDF: Render GitHub-flavored Markdown tables and headings into print-ready documents with Markdown to PDF.',
    ],
    faqs: [
      {
        q: 'What is the difference between PDF to Word and PDF to Editable Word?',
        a: 'PDF to Word reads selectable digital text streams quickly into clean Word paragraphs. PDF to Editable Word adds geometric table/column reconstruction, image embedding, and automatic Tesseract OCR for scanned pages.',
      },
      {
        q: 'Does PowerPoint to PDF keep complex charts and slide themes?',
        a: 'Client-side PPTX conversion extracts slide titles, headings, and bullet text onto clean A4 landscape text cards; embedded images, charts, and theme backgrounds are omitted.',
      },
    ],
  },
  {
    slug: 'word-tools',
    metaTitle: 'Word Tools Online – Word to PDF, PDF to Word & DOCX Converters | PottoTools',
    metaDesc:
      'Convert Word (.docx) files to PDF, clean HTML, or TXT, convert digital or scanned PDFs into editable Word (.docx), and render Markdown to PDF privately in-browser.',
    h1: 'Free Online Microsoft Word Conversion Tools',
    description:
      'Complete browser workflow for Microsoft Word (.docx) files—convert DOCX into print-ready PDF, semantic HTML, or plain text, and turn digital or scanned PDFs back into editable .docx documents.',
    workflowTitle: 'DOCX & PDF Round-Trip Workflow Tips',
    workflowSummary:
      'Keep formatting predictable whether moving out of Word or pulling text back into an editable .docx draft:',
    workflowBullets: [
      'DOCX vs legacy binary .doc: Browser XML engines parse modern OpenXML (.docx) files cleanly; save legacy Word 97–2003 .doc files as .docx in Word or LibreOffice before converting.',
      'Sharing read-only contracts or resumes: Use Word (.docx) to PDF to lock margins, bullets, and tables for universal viewing without cloud uploads.',
      'Extracting clean web markup: Convert formatted Word drafts directly into clean semantic HTML tags via DOCX to HTML before pasting into any CMS editor.',
    ],
    faqs: [
      {
        q: 'How do I convert a Word (.docx) file to PDF for free?',
        a: 'Open Word to PDF, drop your .docx file into the workspace, and export a print-ready PDF locally in seconds without installing Microsoft Office.',
      },
      {
        q: 'Can I convert a scanned paper PDF into an editable Word file?',
        a: 'Yes. Choose PDF to Editable Word, which automatically runs in-browser OCR on scanned pages so you can edit text rather than receiving flat images.',
      },
    ],
  },
  {
    slug: 'excel-tools',
    metaTitle: 'Excel Tools Online – Excel to PDF, PDF to Excel & Workbook Converters | PottoTools',
    metaDesc:
      'Work with Microsoft Excel (.xlsx, .xls) workbooks offline in-browser: render multi-sheet spreadsheets to landscape PDF reports and extract delimited PDF tables to XLSX.',
    h1: 'Free Online Excel Workbook Tools',
    description:
      'Dedicated Microsoft Excel (.xlsx and .xls) processing in your browser—generate formatted landscape PDF reports from workbooks, convert between CSV and XLSX, inspect sheets without Excel, and extract delimited tables from digital PDFs.',
    workflowTitle: 'Best Practices for Excel Workbooks & PDF Table Extraction',
    workflowSummary:
      'When preparing Excel reports for print or extracting financial rows back out of digital PDFs, match your file structure first:',
    workflowBullets: [
      'Printable multi-sheet Excel reports: Excel to PDF lays out tables cleanly in landscape orientation; hide unused helper columns beforehand so wide sheets stay legible on A4 paper.',
      'Digital PDF statements to XLSX: PDF to Excel splits selectable text lines by tabs, commas, or two-or-more spaces into spreadsheet columns (best for structured statements; scanned images require OCR first).',
      'Formula-cached exports: Converting multi-tab .xlsx workbooks to CSV exports evaluated cell values from your chosen worksheet tab without changing the original workbook.',
    ],
    faqs: [
      {
        q: 'Can I convert Excel (.xlsx) sheets into printable PDF reports without Office?',
        a: 'Yes. Excel to PDF reads .xlsx, .xls, and .csv sheets directly in your browser and outputs formatted landscape PDF tables locally.',
      },
      {
        q: 'How does Excel Tools differ from the Spreadsheets data category?',
        a: 'Excel Tools covers Microsoft Excel workbook workflows (.xlsx/.xls reporting to PDF and extracting PDF tables into workbooks), while Spreadsheets focuses on raw delimited CSV inspection, UTF-8 parsing, and browser table filtering.',
      },
    ],
  },
  {
    slug: 'powerpoint-tools',
    metaTitle: 'PowerPoint Tools Online – Extract PPTX Slides to Text-Card PDF Free | PottoTools',
    metaDesc:
      'Convert Microsoft PowerPoint (.pptx) presentations into clean landscape text-card PDF handouts directly inside your browser with zero cloud uploads.',
    h1: 'Free Online PowerPoint Text-to-PDF Tool',
    description:
      'Parse modern OpenXML PowerPoint (.pptx) slide decks locally in your browser to extract slide titles, headings, and bullet points onto paginated A4 landscape PDF cards for lightweight reading notes and printable text handouts.',
    workflowTitle: 'What Client-Side PPTX Conversion Extracts (and What to Expect)',
    workflowSummary:
      'Because PottoTools processes .pptx archives 100% in browser memory without uploading proprietary decks to cloud rendering servers, keep these practical expectations in mind:',
    workflowBullets: [
      'Best suited for text-heavy decks: Extracts slide numbers, titles, bullet hierarchies, and body paragraphs onto clean structured A4 landscape cards.',
      'Visual graphics & animations: Embedded photos, charts, SmartArt diagrams, custom background themes, and slide transitions are omitted during fast XML text conversion.',
      'Legacy .ppt files: If your presentation uses the older binary .ppt extension (Office 97–2003), open and resave it as .pptx in PowerPoint, Google Slides, or LibreOffice Impress before uploading.',
    ],
    faqs: [
      {
        q: 'How do I convert PowerPoint (.pptx) text notes to PDF?',
        a: 'Open PowerPoint to PDF, drop your .pptx deck into the browser workspace, review the slide count, and download your structured landscape text-card PDF in seconds.',
      },
      {
        q: 'Will my confidential presentation slides be uploaded anywhere?',
        a: 'No. Slide XML parsing and PDF creation run completely in your local browser memory without sending your .pptx file over the network.',
      },
      {
        q: 'Are embedded slide photos, charts, and theme backgrounds preserved?',
        a: 'No. This browser-native parser focuses strictly on clean slide text and bullet extraction onto A4 landscape cards rather than full visual graphic rendering.',
      },
    ],
  },
  {
    slug: 'other-document-tools',
    metaTitle: 'OCR, Offline Redactor, Text Diff & Cleanup Utilities | PottoTools',
    metaDesc:
      'Specialized browser document utilities: inspect Aadhaar/bank PDFs with offline pixel redaction, extract text from digital or scanned PDFs, compare revisions side-by-side, and clean formatting.',
    h1: 'Specialized Document, OCR & Text Utilities',
    description:
      'Go beyond basic format conversion with focused privacy, inspection, and text engineering utilities—from permanent offline ID redaction and bilingual OCR to PDF text extraction, broken line-wrap cleanup, and side-by-side revision diffing.',
    workflowTitle: 'Combining Privacy, OCR & Text Cleanup Workflows',
    workflowSummary:
      'Chain lightweight browser tools together to turn messy raw scans or long PDFs into clean, share-safe drafts:',
    workflowBullets: [
      'Scrubbing personal IDs before sharing: Always pass bank statements, Aadhaar/PAN scans, or payslips through Offline PDF & ID Redactor before sending them anywhere.',
      'Fixing PDF copy-paste formatting: Extract selectable prose via PDF Text Extractor, then strip broken line wraps, HTML tags, or repeated spaces in Smart Text Cleaner.',
      'Checking contract edits line-by-line: Paste old and new revisions into Document Text Comparator to highlight added or removed clauses in local RAM.',
    ],
    faqs: [
      {
        q: 'Do these document and text utilities store or transmit pasted text or files?',
        a: 'No. Diff comparison, text cleaning, PDF metadata cleanup, and visual ID redaction run strictly inside local browser RAM with zero server logging.',
      },
      {
        q: 'Which OCR languages can I extract text from?',
        a: 'Our OCR utilities support English and Hindi (Devanagari). First-run OCR caches ~10–25 MB of language traineddata in your browser before working offline.',
      },
    ],
  },
  {
    slug: 'organize-pdf',
    metaTitle: 'Organize PDF Online – Merge, Split, Rotate & Number PDF Pages | PottoTools',
    metaDesc:
      'Visually reorder, rotate individual pages 90°/180°, merge multiple PDFs, split custom page ranges, delete unwanted sheets, add watermarks, and number pages up to 500 MB.',
    h1: 'Organize PDF Pages Online Free',
    description:
      'Take complete control over PDF page structure locally in your browser: drag-and-drop page reordering up to 500 MB, per-page rotation for crooked scans, custom range splitting, multi-file merging, page deletion with undo, watermarking, and custom page numbering.',
    workflowTitle: 'Clean PDF Assembly Workflow for Large & Mixed-Orientation Files',
    workflowSummary:
      'Keep original typography sharp and orientations accurate when assembling multi-source packets:',
    workflowBullets: [
      'Lossless rotation & reordering: PDF Page Organizer updates page matrix dictionaries and sequence directly without re-rasterizing vector text.',
      'Splitting before compressing: Remove irrelevant pages or extract only required page ranges (e.g., "1-4, 7") so critical pages retain higher visual clarity.',
      'Stamping headers & numbers: Apply custom page numbering ("Page X of Y") or transparent text watermarks across finalized merged packets cleanly.',
    ],
    faqs: [
      {
        q: 'Can I reorder pages in large scanned PDFs up to 500 MB?',
        a: 'Yes. PDF Page Organizer loads page thumbnails progressively in browser memory so files up to 500 MB can be reordered, rotated, and exported locally.',
      },
      {
        q: 'Does rotating or reordering pages degrade PDF sharpness?',
        a: 'No. Page sequence changes and 90°/180°/270° rotations modify PDF page objects cleanly without blurry canvas re-encoding.',
      },
    ],
  },
  {
    slug: 'convert-images',
    metaTitle: 'Convert Image Formats Online – JPG, PNG, WebP, BMP & Image-PDF | PottoTools',
    metaDesc:
      'Convert image formats cleanly with easy quality controls: change JPG to PNG, PNG to smaller JPG, WebP/BMP batches, combine photos into a PDF, or save PDF pages as JPG/PNG.',
    h1: 'Image Format Conversion Tools',
    description:
      'Convert images smoothly between JPG, PNG, WebP, BMP, and PDF directly on your device—with clean quality controls, transparent background support, and fast PDF-to-photo conversion.',
    workflowTitle: 'Understanding Lossy vs Lossless Image Formats Before Converting',
    workflowSummary:
      'Choosing the wrong output format can inflate file size 5× or strip transparent backgrounds unexpectedly:',
    workflowBullets: [
      'Photographs & scanned forms -> JPG or WebP: Lossy encoding yields dramatically smaller KB footprints than PNG for camera shots and complex gradients.',
      'Logos, UI screenshots & transparency -> PNG: Preserves sharp text edges and alpha transparency; note that converting transparent PNG/WebP to JPG fills transparent zones with solid white.',
      'Multi-image bundles & PDF pages: Combine loose JPG/PNG scans into one document via Image to PDF, or export individual PDF sheets as JPG/PNG ZIP packs via PDF to Images.',
    ],
    faqs: [
      {
        q: 'Why does converting a small JPG into PNG create a much larger file?',
        a: 'PNG uses lossless compression suited for flat graphics and transparency, which cannot compress photographic sensor noise as tightly as JPEG or WebP.',
      },
      {
        q: 'How is Image Conversion different from Image Tools / Photo Studio?',
        a: 'This hub covers format transcoding (JPG, PNG, WebP, BMP, Image-to-PDF, and PDF-to-Images), whereas Image Tools focuses on cm/mm dimensioning, DPI math, exam presets, and KB targets.',
      },
    ],
  },
  {
    slug: 'ocr-scanned',
    metaTitle: 'OCR & Scanned PDF Tools – Searchable PDF & Text Extraction | PottoTools',
    metaDesc:
      'Run in-browser Tesseract OCR on scanned PDFs and photos (English & Hindi), search inside scanned documents, copy editable text, or export DOCX & searchable PDFs locally.',
    h1: 'Free Online OCR & Scanned PDF Tools',
    description:
      'Turn scanned papers, receipts, and document photos into copyable, searchable text right inside your browser—no file uploads required.',
    workflowTitle: 'Tips for Better Text Reading on Scans',
    workflowSummary:
      'Clear scan photos and picking the right language give the most accurate text results:',
    workflowBullets: [
      'Select the matching language first: Pick English or Hindi before launching OCR; your first run downloads ~10–25 MB of language traineddata from CDN and caches it in-browser for offline reuse.',
      'Search & export searchable PDFs: Use Find Anything in Scanned PDFs to locate names, dates, and reference numbers inside scans—note that Hindi text searches & copies inside the app, while exported Searchable PDF invisible layers encode Latin/ASCII characters.',
      'Exporting editable documents: Use Free Online OCR Scanner for quick .txt/.docx text output, or PDF to Editable Word for multi-column menus and tables.',
    ],
    faqs: [
      {
        q: 'Does OCR work completely offline on the very first visit?',
        a: 'All image processing stays local on your CPU, though the first run downloads Tesseract WASM and language traineddata (~10–25 MB) into browser cache so later sessions work offline.',
      },
      {
        q: 'Can OCR search Hindi (Devanagari) documents?',
        a: 'Yes. Selecting Hindi (hin) recognizes Devanagari text for reading, copying, and in-app keyword search, while exported Searchable PDF invisible Ctrl+F layers encode Latin/ASCII text.',
      },
    ],
  },
  {
    slug: 'pdf-security',
    metaTitle: 'PDF Privacy, Redaction, Signing & Metadata Sanitizer | PottoTools',
    metaDesc:
      'Protect confidential PDFs locally in your browser: permanently blackout or pixel-blur Aadhaar/bank details offline, stamp visual signatures, and inspect or wipe hidden PDF metadata.',
    h1: 'PDF Password, Privacy & Signing Tools',
    description:
      'Keep your personal and financial PDFs safe before sharing—lock or unlock PDF passwords, hide sensitive Aadhaar or bank numbers permanently, add your signature, and clean hidden file details directly on your device.',
    workflowTitle: 'Simple Privacy Checklist Before Sharing PDFs',
    workflowSummary:
      'Follow these quick steps so private numbers or hidden file info never leak when sharing documents:',
    workflowBullets: [
      'Hide private details permanently: Use Hide Private Info in PDF & ID to black out or blur Aadhaar, PAN, or bank numbers so nobody can copy or uncover them.',
      'Lock or unlock passwords: Use Protect PDF to add a real password before emailing, or Unlock PDF to remove a password you already know.',
      'Remove hidden file info: Use Remove Hidden PDF Info to clear author name, device details, and editing history.',
    ],
    faqs: [
      {
        q: 'Does Hide Private Info in PDF & ID permanently remove hidden text?',
        a: 'Yes. It turns masked areas into flat pixels and clears hidden data, so blacked-out Aadhaar, PAN, or bank digits cannot be selected or uncovered.',
      },
      {
        q: 'Can PottoTools lock and unlock PDFs with real passwords?',
        a: 'Yes. Protect PDF adds real password protection that opens only with your password in Adobe Acrobat, Chrome, Edge, and mobile viewers, and Unlock PDF removes passwords from files you own.',
      },
    ],
  },
  {
    slug: 'smart-utilities',
    metaTitle: 'Smart Text & PDF Utilities – Extract, Clean & Diff Texts | PottoTools',
    metaDesc:
      'Inspect word/character counts and extract selectable text from PDFs, strip messy PDF copy-paste line breaks or HTML tags, and compare two text drafts side-by-side locally.',
    h1: 'Smart Text & Document Utilities',
    description:
      'Lightweight in-browser utilities built for writers, students, analysts, and developers—extract clean readable text with live word/reading-time counters from digital PDFs, normalize broken whitespace and casing, and compare document revisions side by side.',
    workflowTitle: 'Everyday Cleanup & Comparison Patterns in Browser Memory',
    workflowSummary:
      'Solve common copy-paste and proofreading bottlenecks in seconds without sending private drafts to online paste tools:',
    workflowBullets: [
      'Counting & auditing digital PDFs: Drop reports, resumes, or manuscripts into PDF Text Extractor for instant word, character, line, and page counts plus clean UTF-8 .txt export.',
      'Fixing jagged PDF line wraps: Clean pasted blocks using Smart Text Cleaner to remove duplicate spaces, strip empty lines, or switch between Title Case, UPPERCASE, and lowercase.',
      'Pre-normalizing before Diff checks: When comparing two messy drafts in Document Text Comparator, run both through Smart Text Cleaner first so stray trailing spaces do not clutter line diffs.',
    ],
    faqs: [
      {
        q: 'Does PDF Text Extractor work on scanned photo PDFs?',
        a: 'PDF Text Extractor reads selectable digital text streams instantly. If a PDF is an image scan and shows 0 extracted words, open it in OCR Scanner or Find Anything in Scanned PDFs instead.',
      },
      {
        q: 'Are drafts pasted into Text Comparator or Text Cleaner logged anywhere?',
        a: 'Never. All regex normalization, word statistics, and line-by-line diff comparisons run locally inside your active browser tab.',
      },
    ],
  },
  {
    slug: 'spreadsheets',
    metaTitle: 'CSV & Delimited Spreadsheet Tools – Sheet Viewer, CSV to XLSX & Export | PottoTools',
    metaDesc:
      'Inspect CSV and multi-sheet spreadsheets directly in your browser without Office, search/filter rows cleanly, export filtered CSV or JSON, and convert delimited CSV data to UTF-8 XLSX.',
    h1: 'Delimited Data & Browser Spreadsheet Viewer Tools',
    description:
      'Parse, inspect, search, filter, and convert comma-separated (.csv) and tabular worksheet data right inside your browser—preserve UTF-8 scripts, auto-detect delimited types, and export filtered tables cleanly to CSV, JSON, or XLSX without installing spreadsheet software.',
    workflowTitle: 'Clean CSV Encoding, Filtering & Format Interoperability Tips',
    workflowSummary:
      'Avoid garbled non-English characters, broken delimiters, or crashed desktop apps when handling raw CSV and tabular files:',
    workflowBullets: [
      'Inspect before opening massive files: Use Spreadsheet Viewer to switch worksheet tabs, run instant keyword row filters across columns, and export filtered snapshots as JSON or CSV.',
      'Keep Hindi & accented UTF-8 text intact: Save source data as UTF-8 CSV before converting to .xlsx so SheetJS preserves international characters alongside auto-typed numbers.',
      'Understand CSV single-sheet limits: Exporting .xlsx to .csv saves evaluated cell values from your selected tab as lightweight RFC-4180 plain data without formulas, macros, or cell styling.',
    ],
    faqs: [
      {
        q: 'Can I filter rows and export JSON from an Excel or CSV file in-browser?',
        a: 'Yes. Spreadsheet Viewer renders multi-tab .xlsx, .xls, and .csv tables locally with instant search filtering and one-click JSON/CSV downloads.',
      },
      {
        q: 'How is Spreadsheets different from the Excel Tools category?',
        a: 'Spreadsheets concentrates on raw delimited data (CSV encoding, interactive table inspection, row filtering, and CSV/JSON/XLSX conversion), while Excel Tools focuses on workbook reporting (Excel to PDF) and PDF statement table extraction.',
      },
    ],
  },
];

export const CATEGORY_GUIDANCE_MAP: Record<string, CategoryGuidance> = Object.fromEntries(
  CATEGORY_GUIDANCE_LIST.map((item) => [item.slug, item])
);
