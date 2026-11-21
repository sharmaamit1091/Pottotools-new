export interface ToolTechnicalProfile {
  settingsAndOptions: string[];
  outputExplanation: string;
  limitations: string[];
  troubleshooting: { issue: string; solution: string }[];
}

export const TOOL_TECHNICAL_PROFILES: Record<string, ToolTechnicalProfile> = {
  'fill-pdf-form': {
    settingsAndOptions: [
      'Click-anywhere text, date, checkmark (✓/✗), checkbox, line, rectangle, and circle placement',
      'Reusable session Photo & Signature Library plus Reusable Text Snippets panel with drag-and-drop',
      '3-mode Digital Signature creator (Draw, Type, Upload with white-background cleanup) and built-in Photo Crop & Rotate',
      'Interactive AcroForm field detection (text, checkbox, radio, dropdown) plus optional Auto-Detect Form Fields',
      'Snap alignment guides, optional rulers & page margins, page rotation (90°/180°), .pottoform Save/Reopen, Before/After & Print-Ready Preview',
    ],
    outputExplanation:
      'Exports a standards-compliant PDF (.pdf) preserving original page sizes and orientations. Latin text is embedded as crisp vector text, while Hindi/Unicode text and cropped photos/signatures are embedded cleanly at high resolution in exact coordinates. Optional flattening locks filled AcroForm values.',
    limitations: [
      'Password-protected PDFs must be unlocked before editing.',
      'Optional Auto-Detect relies on form labels and may not identify every visual layout; manual placement always works anywhere on the page.',
      'Reusable photos and signatures are kept in browser memory for the current session only unless saved inside a .pottoform project file.',
    ],
    troubleshooting: [
      {
        issue: 'Existing interactive PDF fields appear slightly locked in some viewers',
        solution:
          'Enable the "Flatten form fields" option in the right sidebar before clicking Download PDF so all typed values render identically across every PDF viewer and printer.',
      },
      {
        issue: 'Want to continue editing the same form tomorrow',
        solution:
          'Click "Save Progress" in the top bar to download a .pottoform project file, then click "Reopen Saved Project (.pottoform)" whenever you return.',
      },
    ],
  },
  'compress-pdf': {
    settingsAndOptions: [
      'Target file size presets: 100 KB, 200 KB, 500 KB, 1 MB, or 2 MB',
      'Custom target byte size specification for exact portal requirements',
      'Image stream compression level & DPI downsampling controls',
      'Option to strip unneeded embedded metadata and duplicate font descriptors',
    ],
    outputExplanation:
      'Produces an optimized PDF document (.pdf). Light compression preserves vector text and links while trimming redundant metadata and streams; strict small KB limits (e.g. 100 KB on heavy documents) re-render pages as resolution-scaled compressed JPEG page images to guarantee the byte ceiling.',
    limitations: [
      'When strict small byte targets cannot be achieved through metadata/stream cleanup alone, pages are rasterized into JPEG images (non-selectable text) to hit your KB cap.',
      'Documents consisting entirely of already-compressed images cannot be compressed below entropy limits without visible quality softening.',
      'Password-protected encrypted PDFs cannot be rewritten until unlocked externally.',
      'Extremely large multi-gigabyte archives may be restricted by available browser memory.',
    ],
    troubleshooting: [
      {
        issue: 'Output file size did not decrease significantly',
        solution:
          'If the PDF contains mostly vector text or already compressed images, select a lower DPI target or lower quality ratio to force deeper image re-encoding.',
      },
      {
        issue: 'Password-encrypted file error',
        solution: 'Use our PDF Security tool to decrypt the file before running the compression engine.',
      },
      {
        issue: 'Browser tab became unresponsive',
        solution: 'Close background browser tabs to free up system RAM, or compress the document in smaller batches of pages.',
      },
    ],
  },
  'merge-pdf': {
    settingsAndOptions: [
      'Multi-file drag-and-drop batch uploader',
      'Visual drag-and-drop file reordering to arrange documents in exact sequence',
      'Remove individual documents before merging with one click',
      'Preserve original page orientations across mixed portrait and landscape files',
    ],
    outputExplanation:
      'Creates a single combined PDF (.pdf) containing all pages from each uploaded document in the exact order specified. All original vector lines, text layers, and high-resolution photos are retained intact.',
    limitations: [
      'Cannot merge encrypted PDFs whose owner permissions forbid document assembly without entering the password first.',
      'Total batch size is limited by available browser RAM (typically up to 500 MB across all merged files).',
    ],
    troubleshooting: [
      {
        issue: 'Pages appear in the wrong order',
        solution: 'Use the drag handles on the file cards to rearrange documents into your desired reading order before clicking Merge.',
      },
      {
        issue: 'One specific PDF fails to load',
        solution: 'Check whether the file is corrupted or password-protected. Try opening it in a PDF reader to verify validity.',
      },
    ],
  },
  'split-pdf': {
    settingsAndOptions: [
      'Custom page range extraction (e.g. "1-5, 8, 11-14")',
      'Extract all pages as individual single-page PDF documents',
      'Split by fixed intervals (e.g. split every 2 or 5 pages)',
      'Visual page preview to confirm selected pages before splitting',
    ],
    outputExplanation:
      'Generates either individual PDF files or a bundled ZIP archive containing the extracted page ranges. Each output document retains exact fonts, layout, and image quality from the source.',
    limitations: [
      'Page numbers outside the document range will be skipped with an error notice.',
      'Extracted pages inherit the source document color space and embedded font subsets.',
    ],
    troubleshooting: [
      {
        issue: 'Invalid page range syntax error',
        solution: 'Use comma-separated numbers and hyphens only, such as "1-3, 5, 7-10". Do not include letters or special characters.',
      },
      {
        issue: 'Download did not trigger for batch split',
        solution: 'Check your browser pop-up permissions if extracting multiple individual PDF files at once.',
      },
    ],
  },
  'pdf-to-word': {
    settingsAndOptions: [
      'Fast digital PDF text-stream extraction mode',
      'Paragraph flow reconstruction into clean Word document blocks',
      'Editable text preview inside the browser before DOCX export',
    ],
    outputExplanation:
      'Exports an editable OpenXML Microsoft Word document (.docx) from digital PDFs containing selectable text. You can edit, format, and modify text cleanly in Microsoft Word, LibreOffice Writer, or Google Docs.',
    limitations: [
      'Processes digital selectable-text PDFs only; scanned image-only PDFs or complex multi-column tables and embedded photos should use "PDF to Editable Word" or "OCR Scanner" instead.',
      'Complex graphic designs and multi-layered vector diagrams are omitted from plain paragraph extraction.',
    ],
    troubleshooting: [
      {
        issue: 'Word document is blank or contains only pictures',
        solution: 'The PDF is likely an image scan without digital text. Switch to our OCR Scanner or "PDF to Editable Word" tool to recognize scanned letters.',
      },
      {
        issue: 'Font looks slightly different in Word',
        solution: 'If the PDF used a proprietary system font, Microsoft Word will substitute it with a standard system typeface such as Calibri or Arial.',
      },
    ],
  },
  'pdf-to-editable-word': {
    settingsAndOptions: [
      'High-fidelity formatting reconstruction engine',
      'Bilingual OCR support (English and Hindi) for scanned menus, invoices, and certificates',
      'Multi-column article and newspaper layout detection',
      'Table grid alignment and cell border preservation',
    ],
    outputExplanation:
      'Creates a structured, native .docx file with formatted paragraphs, tables, bold/italic weights, and embedded photo elements preserved for seamless editing.',
    limitations: [
      'Extremely low-resolution scans (below 150 DPI) may yield lower character recognition accuracy.',
      'Heavily skewed or tilted document photos should be straightened before OCR conversion.',
    ],
    troubleshooting: [
      {
        issue: 'Characters have typos or misread symbols',
        solution: 'Ensure the source scan is sharp, evenly lit, and not blurred. For multilingual documents, select the correct language setting.',
      },
    ],
  },
  'word-to-pdf': {
    settingsAndOptions: [
      'Standard page layout preservation (Letter, A4, Legal)',
      'Margin and line-spacing normalization',
      'Automatic embedded image optimization',
      'Clean vector font rendering in output PDF',
    ],
    outputExplanation:
      'Converts Word (.docx) files into a clean, universally viewable PDF document (.pdf) ready for printing, official submission, or digital signing.',
    limitations: [
      'Proprietary third-party Word macros (.docm) and external database links are not executed during client-side rendering.',
      'Supports modern OpenXML .docx format; legacy binary .doc (Word 97-2003) files should be saved as .docx first.',
    ],
    troubleshooting: [
      {
        issue: 'File format not recognized',
        solution: 'Ensure your file has a .docx extension. If it is an old .doc file, open and resave it as Word Document (.docx) first.',
      },
    ],
  },
  'custom-photo-studio': {
    settingsAndOptions: [
      'Unit selector: Pixels (px), Centimeters (cm), Millimeters (mm), Inches (in)',
      'Custom Width and Height input with Lock Aspect Ratio toggle',
      'Target compression file size input in Kilobytes (KB)',
      'DPI resolution selector: 72 DPI (Web), 150 DPI, 200 DPI, 300 DPI (Print)',
      'Crop aspect ratios, brightness/contrast/warmth sliders, 90° rotate & fine straighten',
      'Output format selection: JPG, PNG, or WebP',
    ],
    outputExplanation:
      'Generates a resized, cropped, color-tuned, and re-encoded image file matching your exact physical dimensions and file size ceiling, ideal for government job forms, admission portals, and identity cards.',
    limitations: [
      'Upscaling low-resolution images by more than 300% will naturally result in pixelation unless enhanced with the HD Enhancer.',
      'Setting an unrealistically low KB target (e.g. 5 KB for a 4000x3000 image) will require downscaling dimensions.',
    ],
    troubleshooting: [
      {
        issue: 'File size is larger than desired KB',
        solution: 'Reduce the dimension size or lower the JPEG quality slider in the settings panel.',
      },
      {
        issue: 'Image looks stretched or squished',
        solution: 'Enable "Lock Aspect Ratio" before changing width or height values, or use the crop tool to frame your subject first.',
      },
    ],
  },
  'image-converter': {
    settingsAndOptions: [
      'Target output format selector: JPG, PNG, WebP, or BMP',
      'Quality compression slider (1% to 100%) for JPG and WebP formats',
      'Live visual comparison showing source vs. converted resolution and byte size',
      'Batch multi-image conversion queue',
    ],
    outputExplanation:
      'Outputs converted image files in your chosen modern format. When converting transparent PNG files to JPEG, transparent pixels are composited seamlessly against a clean white canvas background.',
    limitations: [
      'Converting a compressed JPG to lossless PNG will increase file size without creating extra visual detail.',
      'Animated GIF or animated WebP files will convert their primary static frame.',
    ],
    troubleshooting: [
      {
        issue: 'Transparent background turned white',
        solution: 'JPG format does not support transparency by standard specification. Select PNG or WebP output to preserve alpha transparency.',
      },
      {
        issue: 'Color looks slightly washed out',
        solution: 'Browser HTML5 canvas converts wide-gamut Display P3 photos to standard web sRGB for universal cross-browser consistency.',
      },
    ],
  },
  'ocr-tool': {
    settingsAndOptions: [
      'Language detection model selector: English (ENG), Hindi (HIN), or mixed dual-language scripts',
      'Support for scanned PDFs and image uploads (JPG, PNG, WebP)',
      'Instant raw text viewer with Copy to Clipboard and export to .txt or .docx buttons',
    ],
    outputExplanation:
      'Extracts recognized readable text from raster images and scanned PDFs using WebAssembly Tesseract optical character recognition, allowing you to freely copy, edit, and search previously locked paper documents.',
    limitations: [
      'Cursive handwriting, low-resolution smartphone shots (< 150 DPI), or skewed text photos degrade character recognition accuracy.',
      'Requires initial browser language model download (~10–25 MB cached offline after first use).',
    ],
    troubleshooting: [
      {
        issue: 'OCR output contains garbled symbols',
        solution: 'Verify the document orientation is upright and not upside down. Rescan with higher contrast and select the exact script language.',
      },
      {
        issue: 'Slow scanning on multi-page PDFs',
        solution: 'Client-side OCR renders and analyzes pages sequentially on your CPU. For 50+ pages, process pages in smaller splits.',
      },
    ],
  },
  'protect-pdf': {
    settingsAndOptions: [
      'Real ISO 32000-2 AES-256 (R=6) and AES-128 (R=4) cryptographic PDF encryption in WebAssembly',
      'User Open Password required to open/view the PDF in Chrome, Edge, Adobe Acrobat, and Preview',
      'Granular Owner Permissions controls: Printing (Full / Low-Res / Blocked), Copying Text & Images, and Editing/Annotations',
      'Automatic cryptographic self-verification confirming the downloaded PDF is genuinely locked',
    ],
    outputExplanation:
      'Generates a genuinely encrypted PDF (.pdf) locked with AES-256 or AES-128 directly in local browser memory with zero server uploads.',
    limitations: [
      'Genuine AES-256 encryption cannot be recovered if you forget the password — store your password securely.',
    ],
    troubleshooting: [
      {
        issue: 'Uploaded PDF is already password-protected',
        solution: 'Enter the PDF’s current open password in the prompt field to re-encrypt it with your new password, or unlock it first using Unlock PDF.',
      },
    ],
  },
  'unlock-pdf': {
    settingsAndOptions: [
      'Real lossless WebAssembly cryptographic decryption supporting AES-256 (R=6/R=5), AES-128 (R=4), and RC4-128/40 PDFs',
      'Automatic encryption detection distinguishing open-password PDFs from owner-restricted-only PDFs',
      'Removes print, copy, and editing restrictions instantaneously even without a password when no open password is set',
      'Preserves 100% original vector text, fonts, hyperlinks, bookmarks, and Ctrl+F searchability',
    ],
    outputExplanation:
      'Produces a permanently unlocked, lossless PDF (.pdf) that opens without any password prompt and allows unrestricted viewing, printing, merging, and editing.',
    limitations: [
      'Open-password encrypted PDFs require the authorized password; PottoTools does not crack or brute-force unknown passwords.',
    ],
    troubleshooting: [
      {
        issue: 'Incorrect password error on e-Aadhaar or bank statement PDF',
        solution: 'Passwords are case-sensitive. For Indian e-Aadhaar PDFs, enter the first 4 letters of your name in CAPITAL letters followed by your 4-digit birth year (e.g., AMIT1992).',
      },
    ],
  },
  'sign-pdf': {
    settingsAndOptions: [
      'Freehand navy-ink signature canvas via mouse, trackpad, stylus, or touchscreen',
      'Upload an existing PNG or JPG signature image',
      'Select target PDF page number with mandatory signature authorization check',
    ],
    outputExplanation:
      'Produces a finalized PDF (.pdf) with your signature stamped on the chosen page (bottom-left coordinate x=50, y=50, 180×60 pt) and a subtle PottoTools full-page logo watermark across all pages.',
    limitations: [
      'Creates a visual electronic signature graphic rather than a third-party PKI cryptographic certificate.',
      'Stamps the signature at a fixed page coordinate (x=50, y=50) and automatically adds a subtle low-opacity PottoTools watermark across every page.',
    ],
    troubleshooting: [
      {
        issue: 'Signature box covers background text or needs a transparent look',
        solution: 'Draw directly on the built-in pad (which outputs a transparent PNG layer) or upload a PNG image with a transparent background.',
      },
    ],
  },
  'pdf-id-redactor': {
    settingsAndOptions: [
      '100% Offline browser canvas flattening — zero server uploads ever',
      'Solid Blackout Mask or High-Intensity Pixel Blur redaction modes',
      'Supports PDFs and ID card images (Aadhaar, PAN, Bank Passbook, Salary Slips)',
      'Instant page zoom, box drawing, undo last box, and custom DPI flatten quality',
    ],
    outputExplanation:
      'Generates a permanently flattened, un-copyable document (.pdf or .png) where all pixels underneath masked regions are mathematically destroyed and replaced—preventing hidden text selection or reverse recovery.',
    limitations: [
      'Flattening turns masked PDF pages into secure rendered images to guarantee zero underlying digital text leaks, meaning redacted pages are no longer text-selectable.',
      'Password-protected PDFs must be decrypted before loading into the visual redaction canvas.',
    ],
    troubleshooting: [
      {
        issue: 'Could someone select or copy text under the black boxes?',
        solution: 'No. Unlike insecure PDF annotation tools that merely float boxes on top, our engine flattens the entire page raster into clean image streams so underlying text no longer exists in the output file.',
      },
      {
        issue: 'Aadhaar photo text looks slightly soft after flattening',
        solution: 'Increase the flatten export resolution selector to High (300 DPI) prior to clicking Apply Redactions & Download.',
      },
    ],
  },
  'remove-scan-watermark': {
    settingsAndOptions: [
      'Automatic scanner-app label detection across text layers and optional in-browser OCR for scanned images',
      'Full interactive manual selection: draw, move, resize rectangles and apply to all pages or specific page ranges',
      'Lossless PDF text-stream removal for text-based scanner footers + smart directional paper reconstruction for image scans',
      'Mandatory Before-and-After comparison (draggable slider & side-by-side view) with zoom up to 300%, change highlights, and overlap warnings',
    ],
    outputExplanation:
      'Produces a clean PDF (.pdf) preserving original page dimensions, orientation, and unmodified pages. Text-based scanner footers are stripped losslessly where safe, while image-based labels are blended smoothly using local border-sampled paper color and grain.',
    limitations: [
      'Designed only for removing unwanted scanner-app promotional labels on documents you own or are authorized to modify—not copyright notices, official seals, or signatures.',
      'When a scanner label overlaps important text or signatures, pixel reconstruction may affect overlapping strokes; always inspect the mandatory Before-and-After comparison closely.',
      'Password-protected PDFs must be unlocked first before loading into the preview canvas.',
    ],
    troubleshooting: [
      {
        issue: 'Automatic detection did not highlight my scanner watermark',
        solution: 'Click "Auto-Detect Scan Labels (OCR)" for scanned image PDFs, or drag a rectangle directly over the unwanted label on the PDF preview and apply it to all pages.',
      },
      {
        issue: 'A faint seam is visible on a shaded phone scan',
        solution: 'Keep "Smart Paper Match" selected (instead of Pure White Paper) and tighten the selection rectangle closely around only the scanner-app label.',
      },
    ],
  },
  'searchable-pdf-text-finder': {
    settingsAndOptions: [
      'Automatic digital text layer detection across multi-page PDFs up to 500 MB',
      'In-browser Tesseract OCR runner for scanned image-only pages (English & Hindi; initial ~10–25 MB language pack downloads on first run)',
      'Instant keyword, name, date, amount & reference number snippet search with page jump and copy',
      'Searchable PDF exporter embedding an invisible selectable Latin/ASCII text layer over original scans',
    ],
    outputExplanation:
      'Lets you search and copy English and Hindi OCR text immediately inside the browser, and exports a searchable PDF (.pdf) preserving original scan visuals with an invisible Latin/ASCII Ctrl+F text layer.',
    limitations: [
      'Exported Searchable PDF files encode invisible text using StandardFonts.Helvetica (Latin/ASCII characters), so Devanagari/Hindi characters should be searched and copied in the browser view rather than relying on Ctrl+F inside the exported PDF.',
      'Extremely blurry, low-DPI, or heavily cursive handwritten scans may lower OCR word matching accuracy.',
      'Password-protected PDFs must be decrypted before running page inspection or OCR.',
    ],
    troubleshooting: [
      {
        issue: 'Search returns zero matches on a scanned PDF',
        solution: 'Click "Start OCR" to recognize image-only pages before searching for keywords.',
      },
      {
        issue: 'Non-English words were misread',
        solution: 'Switch the OCR language selector to Hindi or mixed script before running recognition.',
      },
    ],
  },
  'pdf-page-organizer': {
    settingsAndOptions: [
      'Visual thumbnail grid supporting large PDFs up to 500 MB and 500+ pages',
      'Drag-and-drop page reordering across the entire document',
      'Independent 90° clockwise and counter-clockwise rotation per page',
      'One-click page deletion with instant Undo and Removed Pages restoration tray',
    ],
    outputExplanation:
      'Compiles a losslessly reorganized PDF (.pdf) with your exact page sequence, rotations, and deletions applied while keeping original vector text, fonts, and scan resolution untouched.',
    limitations: [
      'Encrypted PDFs with restricted modification permissions must be unlocked first.',
      'Thumbnail rendering speed on 300+ page documents scales with device CPU cores.',
    ],
    troubleshooting: [
      {
        issue: 'Accidentally deleted an important page',
        solution: 'Click Undo immediately or restore the page from the Removed Pages tray prior to downloading.',
      },
    ],
  },
  'delete-pdf-pages': {
    settingsAndOptions: [
      'Individual page number and range parser (e.g. "1, 3-5, 9")',
      'Total page count verification before rebuilding PDF stream',
      'Lossless preservation of all remaining vector pages and hyperlinks',
    ],
    outputExplanation:
      'Outputs a trimmed PDF (.pdf) with the specified blank or unwanted pages permanently removed and remaining pages re-indexed cleanly.',
    limitations: [
      'At least one page must remain in the document; deleting every page is blocked.',
    ],
    troubleshooting: [
      {
        issue: 'Page numbers rejected as invalid',
        solution: 'Ensure every entered page number is between 1 and the total page count using commas and hyphens only.',
      },
    ],
  },
  'watermark-pdf': {
    settingsAndOptions: [
      'Custom watermark text input (e.g. "CONFIDENTIAL", "DRAFT", "FOR KYC ONLY")',
      'Font size, color, opacity (10%–100%), and diagonal rotation angle controls',
      'Clean vector overlay stamping across all pages simultaneously',
    ],
    outputExplanation:
      'Generates a watermarked PDF (.pdf) with sharp vector text stamped at your chosen transparency and tilt angle on every page.',
    limitations: [
      'Password-locked PDFs must be decrypted before vector watermarks can be embedded.',
    ],
    troubleshooting: [
      {
        issue: 'Watermark covers underlying text too darkly',
        solution: 'Lower the opacity slider to 15%–30% so underlying text remains easy to read.',
      },
    ],
  },
  'page-numbers-pdf': {
    settingsAndOptions: [
      'Position presets: Bottom Center, Bottom Right, Bottom Left, Top Right, Top Center',
      'Formatting patterns ("1, 2, 3" or "Page 1 of N")',
      'Configurable starting number offset and margin padding',
    ],
    outputExplanation:
      'Produces a cleanly paginated PDF (.pdf) with crisp vector page numbers placed consistently at your selected header or footer margin.',
    limitations: [
      'Documents with zero margin at page edges may require smaller font sizes to avoid overlapping existing footers.',
    ],
    troubleshooting: [
      {
        issue: 'Page numbers overlap existing footer text',
        solution: 'Switch placement to Top Right or Top Center, or reduce font size slightly.',
      },
    ],
  },
  'docx-to-txt': {
    settingsAndOptions: [
      'Clean OpenXML Word (.docx) paragraph & heading extraction',
      'Instant UTF-8 plain text preview with copy-to-clipboard button',
      'One-click export as lightweight .txt file',
    ],
    outputExplanation:
      'Produces a clean, unformatted plain text (.txt) stream containing all readable paragraphs and list items stripped of XML tags, macros, and hidden styles.',
    limitations: [
      'Images, charts, and visual borders inside Word documents are omitted in plain text (.txt) files.',
    ],
    troubleshooting: [
      {
        issue: 'Legacy .doc file cannot be parsed',
        solution: 'Open the legacy binary .doc file in Word or LibreOffice and save it as modern .docx first.',
      },
    ],
  },
  'docx-to-html': {
    settingsAndOptions: [
      'Semantic HTML5 mapping for headings (H1–H6), paragraphs, lists, bold/italic, and tables',
      'Dual Raw HTML Source & Live Rendered Preview tabs',
      'Copy HTML snippet or download complete .html document',
    ],
    outputExplanation:
      'Generates clean, standards-compliant semantic HTML markup ready for CMS editors, blog posts, documentation sites, and email templates without Microsoft Office bloat.',
    limitations: [
      'Complex multi-column desktop publishing layouts flatten into semantic top-to-bottom HTML flow.',
    ],
    troubleshooting: [
      {
        issue: 'Custom desktop fonts do not appear in HTML preview',
        solution: 'Semantic HTML leaves typography styling to your website stylesheet for clean cross-browser rendering.',
      },
    ],
  },
  'txt-to-pdf': {
    settingsAndOptions: [
      'Direct text paste editor or .txt file upload',
      'Configurable font size, line spacing, and clean page margins',
      'Automatic line wrapping and multi-page A4 pagination',
    ],
    outputExplanation:
      'Compiles raw plain text into a crisp, selectable vector PDF (.pdf) ready for printing, archiving, or sharing across any device.',
    limitations: [
      'Plain text (.txt) does not encode bold/italic styling; use Markdown to PDF when formatting is needed.',
    ],
    troubleshooting: [
      {
        issue: 'Long lines wrap unexpectedly',
        solution: 'Reduce the font size slightly in settings so wider code or log lines fit cleanly across the page width.',
      },
    ],
  },
  'markdown-to-pdf': {
    settingsAndOptions: [
      'GitHub-Flavored Markdown parser (headings, lists, code fences, blockquotes, tables)',
      'Live split-screen HTML preview before PDF export',
      'Clean high-contrast typography and automatic page breaks',
    ],
    outputExplanation:
      'Exports a formatted PDF (.pdf) from Markdown (.md) notes, READMEs, and technical specs with clear heading hierarchy, bordered tables, and readable code blocks.',
    limitations: [
      'External hotlinked images hosted on domains without CORS headers cannot be embedded by browser canvas.',
    ],
    troubleshooting: [
      {
        issue: 'Markdown table columns appear cramped',
        solution: 'Shorten column header labels or split overly wide tables for clean A4 portrait fitting.',
      },
    ],
  },
  'image-to-pdf': {
    settingsAndOptions: [
      'Multi-image batch upload supporting JPG, PNG, WebP, and BMP',
      'Drag-and-drop image reordering prior to compilation',
      'Page fit presets: Fit to A4 Portrait/Landscape with margins or Edge-to-Edge',
    ],
    outputExplanation:
      'Compiles multiple photos, receipts, notes, or ID scans into a single properly oriented, multi-page PDF (.pdf) document without watermarks.',
    limitations: [
      'Combining dozens of uncompressed 20+ megapixel raw photos may produce a large PDF; follow up with Compress PDF if needed.',
    ],
    troubleshooting: [
      {
        issue: 'Resulting PDF file size is too large for an upload portal',
        solution: 'Click Compress PDF right after creating your document to shrink it down to 100 KB, 200 KB, or 500 KB.',
      },
    ],
  },
  'pdf-to-images': {
    settingsAndOptions: [
      'Output format toggle: JPG (compact) or PNG (lossless crisp graphics)',
      'Resolution selector: 150 DPI standard or 300 DPI high-resolution print quality',
      'Download individual rendered pages or batch-download all images as a ZIP',
    ],
    outputExplanation:
      'Renders every page of your PDF via PDF.js canvas into sharp JPG or PNG images ready for presentations, social sharing, or graphic editing.',
    limitations: [
      'Rendering very long PDFs (100+ pages) at 300 DPI consumes noticeable browser memory.',
    ],
    troubleshooting: [
      {
        issue: 'Text looks slightly soft in extracted JPGs',
        solution: 'Switch output resolution to 300 DPI and select PNG format for razor-sharp text and line art.',
      },
    ],
  },
  'pdf-metadata': {
    settingsAndOptions: [
      'Metadata inspector displaying Title, Author, Subject, Keywords, Creator, Producer & Dates',
      'Editable metadata fields to standardize document properties',
      'One-click Sanitize & Wipe Metadata button for privacy',
    ],
    outputExplanation:
      'Outputs an identical-looking PDF (.pdf) with either updated document properties or all hidden identifying metadata tags cleanly wiped.',
    limitations: [
      'Does not alter visible text or flattened watermarks on page canvases; use PDF & ID Redactor for visible PII.',
    ],
    troubleshooting: [
      {
        issue: 'File cannot be sanitized because of a lock error',
        solution: 'Unlock or remove password protection on the PDF before inspecting or wiping metadata.',
      },
    ],
  },
  'photo-size-compressor': {
    settingsAndOptions: [
      'Target KB presets: 20 KB, 50 KB, 100 KB, 200 KB, 500 KB',
      'Custom target size input in KB or MB with binary-search compression',
      'Auto-downscale safeguard to avoid heavy block artifacts at tiny KB targets',
      'Output format selector: JPG or modern WebP with live KB comparison',
    ],
    outputExplanation:
      'Produces a compressed image strictly under your specified target KB/MB ceiling while preserving maximum facial detail and signature crispness.',
    limitations: [
      'Transparent PNGs converted to JPEG compress dramatically smaller with a clean white background.',
    ],
    troubleshooting: [
      {
        issue: 'Compression stops slightly above a very small KB target',
        solution: 'Enable Auto-Downscale Safeguard or switch output format to WebP to achieve ultra-compact byte sizes.',
      },
    ],
  },
  'photo-signature-resizer': {
    settingsAndOptions: [
      'Verified presets for UPSC, SSC CGL/CHSL, IBPS PO/Clerk, State PSC, and Passport/Visa',
      'Dual-constraint engine enforcing exact pixel dimensions AND exact KB range simultaneously',
      'Background color selector (Pure White / Light Blue) and green compliance verification checks',
    ],
    outputExplanation:
      'Delivers an exam-ready JPG or PNG file verified to pass automated portal validators for exact width, height, aspect ratio, and min/max KB limits.',
    limitations: [
      'Always double-check the latest official recruitment notification in case an exam board updates pixel/KB guidelines.',
    ],
    troubleshooting: [
      {
        issue: 'Uploaded signature looks faint after resizing to 140x60 px',
        solution: 'Sign with a dark black or blue gel pen on blank white paper and crop tightly around the signature first.',
      },
    ],
  },
  'photo-editor': {
    settingsAndOptions: [
      'Non-destructive crop presets, 90° rotate, flip horizontal/vertical, and -25° to +25° straighten',
      'Brightness, contrast, exposure, saturation, warmth, and edge sharpness sliders',
      'Tonal presets (Original, Crisp B&W Document, High Contrast Scan) with Undo/Redo history',
    ],
    outputExplanation:
      'Renders an edited high-resolution JPG or PNG image with clean orientation, balanced exposure, and crisp document or portrait clarity.',
    limitations: [
      'Extreme overexposure highlights blown out to pure white in the original photo cannot recover lost sensor detail.',
    ],
    troubleshooting: [
      {
        issue: 'Crooked phone scan text still slants slightly',
        solution: 'Zoom in and use the fine straighten slider in 0.5° increments while aligning with the preview grid.',
      },
    ],
  },
  'hd-image-enhancer': {
    settingsAndOptions: [
      'Hardware-accelerated Contrast-Adaptive Sharpening (CAS) & Laplacian unsharp mask',
      'Gentle denoise smoothing filter to reduce ISO grain on low-light portraits',
      'Stepped 2x and 4x upscaling with split Before vs. After comparison view',
    ],
    outputExplanation:
      'Exports an enhanced high-definition JPG (.jpg) with sharper facial features, cleaner document lettering, and higher pixel resolution.',
    limitations: [
      'Kernel sharpening refines existing edges; it cannot invent completely missing detail on severely motion-blurred photos.',
    ],
    troubleshooting: [
      {
        issue: 'Background grain became noticeable after high sharpening',
        solution: 'Increase the Gentle Denoise slider slightly alongside Contrast-Adaptive Sharpening.',
      },
    ],
  },
  'image-format-converter': {
    settingsAndOptions: [
      'Cross-convert between JPG, PNG, and WebP formats',
      'Custom compression quality slider with estimated output file size preview',
      'Automatic white canvas compositing when converting transparent PNGs to JPG',
    ],
    outputExplanation:
      'Produces clean image files re-encoded cleanly in your chosen target format inside HTML5 Canvas with zero cloud transfers.',
    limitations: [
      'Animated GIF/WebP inputs export their first frame as a high-clarity static image.',
    ],
    troubleshooting: [
      {
        issue: 'Output PNG file is larger than original JPG',
        solution: 'PNG is lossless; choose WebP or JPG with 85%–90% quality if compact file size is your priority.',
      },
    ],
  },
  'photo-background-changer': {
    settingsAndOptions: [
      'Official studio background colors: Pure White (#FFFFFF), Light Blue (#D0E8F2), Navy Blue, Off-White',
      'Interactive chroma tolerance threshold and edge feathering sliders',
      'Instant side-by-side Before vs. After visual check',
    ],
    outputExplanation:
      'Generates a compliant passport/ID portrait (.jpg) with your original uneven backdrop cleanly replaced by a uniform solid studio color.',
    limitations: [
      'Works best on photos shot against uniform walls; busy patterned outdoor backgrounds may leave edge fringes.',
    ],
    troubleshooting: [
      {
        issue: 'Thin halo remains around hair or shoulders',
        solution: 'Increase edge feathering slightly and fine-tune color tolerance until hair edges blend cleanly.',
      },
    ],
  },
  'passport-photo-cropper': {
    settingsAndOptions: [
      'Locked official presets: 3.5cm x 4.5cm (Indian/EU/UK) and 2x2 inch (US/Canada Visa)',
      'Interactive draggable crop frame with centered head-and-shoulders alignment guides',
      'High-DPI JPEG export ready for printing or portal submission',
    ],
    outputExplanation:
      'Outputs a properly proportioned passport portrait (.jpg) matching official embassy and recruitment aspect ratios.',
    limitations: [
      'Ensure your face is front-facing with neutral expression and even lighting prior to cropping.',
    ],
    troubleshooting: [
      {
        issue: 'Printed photo size looks cropped at head',
        solution: 'Leave slightly more margin above the hair inside the top guide box before clicking Crop & Download.',
      },
    ],
  },
  'combine-app-documents': {
    settingsAndOptions: [
      'Mixed batch uploader accepting PDFs alongside JPG and PNG scans',
      'Drag-and-drop sequence ordering (Photo ID -> Marksheet -> Degree -> Resume)',
      'Unified A4 PDF portfolio compilation with optional size optimization',
    ],
    outputExplanation:
      'Produces one clean, consolidated multi-page PDF (.pdf) containing your identity cards, certificates, and forms in exact submission order.',
    limitations: [
      'Encrypted PDFs must be unlocked before they can be combined into an application packet.',
    ],
    troubleshooting: [
      {
        issue: 'Combined portfolio exceeds portal upload size limit',
        solution: 'Run the downloaded portfolio through Compress PDF to fit under 500 KB, 1 MB, or 2 MB.',
      },
    ],
  },
  'pdf-text-extractor': {
    settingsAndOptions: [
      'Full digital PDF text stream parser across all pages',
      'Real-time statistics: Total Words, Characters, Lines, Page Count & Reading Time',
      'In-browser search filter, one-click clipboard copy, and .txt download',
    ],
    outputExplanation:
      'Displays and exports clean UTF-8 plain text extracted from digital PDF files alongside accurate word and character metrics.',
    limitations: [
      'Image-only scanned PDFs lack selectable text streams; use the OCR Tool to extract text from scans.',
    ],
    troubleshooting: [
      {
        issue: 'Extracted text pane is empty',
        solution: 'Your PDF is likely a flat scan of paper pages. Open it in OCR Scanner or Find Anything in Scanned PDFs instead.',
      },
    ],
  },
  'text-diff-comparator': {
    settingsAndOptions: [
      'Side-by-side Original Text A and Modified Text B editors or .txt file upload',
      'Color-coded line and word diff highlighting additions, deletions, and unchanged lines',
      'Optional whitespace and case normalization toggles',
    ],
    outputExplanation:
      'Presents an interactive visual diff comparison highlighting every added, deleted, or modified line between two text drafts.',
    limitations: [
      'Comparing extremely large files (>50,000 lines) may cause brief browser scrolling lag.',
    ],
    troubleshooting: [
      {
        issue: 'Entire document highlights as changed due to extra spaces',
        solution: 'Run both drafts through Smart Text Cleaner first to normalize line endings and trailing spaces.',
      },
    ],
  },
  'text-cleaner': {
    settingsAndOptions: [
      'Cleanup toggles: collapse duplicate spaces, trim lines, remove blank lines, strip HTML tags',
      'Broken PDF line-break repair (joins wrapped sentences smoothly)',
      'Instant case converters: UPPERCASE, lowercase, Title Case, Sentence case',
    ],
    outputExplanation:
      'Outputs normalized, readable plain text ready to copy cleanly into emails, Word documents, spreadsheets, or code editors.',
    limitations: [
      'Automated Title Case and Sentence Case do not recognize domain-specific brand capitalization.',
    ],
    troubleshooting: [
      {
        issue: 'Paragraphs merged together after removing line breaks',
        solution: 'Toggle "Remove Single Line Breaks Only" to keep double blank lines separating paragraphs.',
      },
    ],
  },
  'csv-to-xlsx': {
    settingsAndOptions: [
      'Comma, semicolon, and tab-delimited CSV auto-detection',
      'UTF-8 encoding preservation for accented and multilingual characters',
      'Interactive data grid preview prior to XLSX workbook generation',
    ],
    outputExplanation:
      'Produces a standards-compliant Microsoft Excel (.xlsx) workbook with auto-typed numbers/dates and clean column headers.',
    limitations: [
      'CSV format holds one table per file; generated XLSX workbooks contain a single worksheet.',
    ],
    troubleshooting: [
      {
        issue: 'Accented characters look garbled',
        solution: 'Save your source CSV with UTF-8 encoding in your text editor before uploading.',
      },
    ],
  },
  'xlsx-to-csv': {
    settingsAndOptions: [
      'Supports modern .xlsx and legacy .xls Excel workbooks',
      'Worksheet selector dropdown for multi-tab spreadsheets',
      'Instant CSV preview and UTF-8 .csv file download',
    ],
    outputExplanation:
      'Exports the chosen worksheet as a clean, RFC-4180 compliant comma-separated values (.csv) file compatible with databases, Python/R, and CRM imports.',
    limitations: [
      'CSV is a plain tabular format; Excel cell colors, charts, and formulas are stripped during export.',
    ],
    troubleshooting: [
      {
        issue: 'Exported CSV shows only the first tab',
        solution: 'Select the specific worksheet tab you need from the sheet dropdown before clicking Convert to CSV.',
      },
    ],
  },
  'sheet-viewer': {
    settingsAndOptions: [
      'Opens .xlsx, .xls, and .csv files directly without Microsoft Excel',
      'Multi-sheet tab switcher with real-time row search and filtering',
      'One-click filtered export to CSV or structured JSON',
    ],
    outputExplanation:
      'Renders spreadsheets as a fast, searchable interactive browser table with exportable filtered views in CSV or JSON format.',
    limitations: [
      'Password-protected Excel workbooks must be decrypted before browser inspection.',
    ],
    troubleshooting: [
      {
        issue: 'Large workbook renders slowly',
        solution: 'Use the search bar to filter down to relevant rows instead of scrolling thousands of cells at once.',
      },
    ],
  },
  'powerpoint-to-pdf': {
    settingsAndOptions: [
      'Supports OpenXML PowerPoint (.pptx) presentations up to 50 MB',
      'Parses slide XML files locally in-browser and formats paginated A4 landscape text cards',
      'Extracts slide titles, headings, and bullet text without server uploads',
    ],
    outputExplanation:
      'Generates a multi-page, landscape-oriented PDF (.pdf) displaying extracted slide titles and bullet text in clean structured slide cards for readable notes and handouts.',
    limitations: [
      'Client-side XML extraction renders slide text only; embedded photos, charts, SmartArt diagrams, custom background themes, and slide animations are omitted.',
      'Legacy binary .ppt (97-2003) files must be saved as .pptx first.',
    ],
    troubleshooting: [
      {
        issue: 'Old .ppt presentation fails to load',
        solution: 'Open the deck in PowerPoint or Google Slides and export/save as .pptx before converting.',
      },
    ],
  },
  'excel-to-pdf': {
    settingsAndOptions: [
      'Accepts .xlsx, .xls, and .csv spreadsheet files',
      'Auto-formatted landscape table layout preserving column alignment',
      'Multi-sheet preview before compiling printable PDF tables',
    ],
    outputExplanation:
      'Produces a cleanly styled, landscape PDF (.pdf) report displaying spreadsheet headers, alternating rows, and numeric columns clearly on paper.',
    limitations: [
      'Extremely wide sheets with 20+ columns may wrap text tightly on A4 landscape pages.',
    ],
    troubleshooting: [
      {
        issue: 'Wide financial table columns feel cramped',
        solution: 'Hide unused columns before converting or split wide worksheets into smaller reporting tabs.',
      },
    ],
  },
  'pdf-to-excel': {
    settingsAndOptions: [
      'Line-by-line digital PDF text parser splitting columns by tabs, commas, or two-or-more spaces',
      'Works best on cleanly delimited invoices, price lists, and exported tabular statements',
      'Exports native Microsoft Excel (.xlsx) workbook editable in Excel & Google Sheets',
    ],
    outputExplanation:
      'Parses delimited digital PDF lines into rows and columns inside a downloadable .xlsx workbook ready for formulas, sorting, and filtering.',
    limitations: [
      'Works on digital text PDFs separated by tabs, commas, or multiple spaces; scanned table photos, merged headers, or single-space multi-column layouts may require manual column cleanup.',
    ],
    troubleshooting: [
      {
        issue: 'Extracted spreadsheet has sparse rows',
        solution: 'Verify the PDF contains selectable text rather than an embedded scan image.',
      },
    ],
  },
  'jpg-to-png': {
    settingsAndOptions: [
      'Batch or single JPG/JPEG upload up to 30 MB',
      'Lossless 24-bit RGBA PNG canvas encoding',
      'Preserves original pixel dimensions with zero re-compression loss',
    ],
    outputExplanation:
      'Converts JPEG photographs into lossless PNG (.png) files suitable for graphic editors, screenshots, and web assets requiring lossless fidelity.',
    limitations: [
      'PNG files are naturally larger in bytes than compressed JPG photos due to lossless encoding.',
    ],
    troubleshooting: [
      {
        issue: 'Converted PNG file size is much larger than the JPG',
        solution: 'This is normal for lossless PNG; use Photo Size Compressor or JPG/WebP when strict KB limits apply.',
      },
    ],
  },
  'png-to-jpg': {
    settingsAndOptions: [
      'Adjustable JPEG quality slider (default 90%) with live size feedback',
      'Clean solid white background compositing for transparent PNG alpha channels',
      'Compact byte-size output for faster websites and email uploads',
    ],
    outputExplanation:
      'Exports lightweight, universally compatible JPG (.jpg) images up to 80% smaller than source PNG screenshots or graphics.',
    limitations: [
      'JPEG is lossy and does not support transparent backgrounds; transparent pixels become solid white.',
    ],
    troubleshooting: [
      {
        issue: 'Transparent logo turned white behind icon',
        solution: 'JPEG lacks transparency support by specification; keep PNG or WebP when transparent backgrounds are required.',
      },
    ],
  },
};

export function getToolTechnicalProfile(slug: string): ToolTechnicalProfile {
  const normalizedSlug = slug === 'custom-photo-resizer' ? 'custom-photo-studio' : slug;
  if (TOOL_TECHNICAL_PROFILES[normalizedSlug]) {
    return TOOL_TECHNICAL_PROFILES[normalizedSlug];
  }

  // Fallback for any future unmapped tool
  return {
    settingsAndOptions: [
      'Adjustable processing parameters suited for the input file format',
      'Preview before saving to verify formatting and quality',
      'Instant download trigger to local device storage',
    ],
    outputExplanation:
      'Generates an optimized output file processed locally in your browser memory, matching the standard format requirements for this document type.',
    limitations: [
      'Processing speed and maximum supported file size depend on available device memory and web browser specifications.',
      'Corrupted or password-locked input files must be repaired or unlocked before processing.',
    ],
    troubleshooting: [
      {
        issue: 'File failed to process',
        solution: 'Verify the file format matches accepted extensions and the file size does not exceed the limit. Try refreshing the browser if memory is constrained.',
      },
      {
        issue: 'Download did not start',
        solution: 'Ensure browser downloads and pop-ups are allowed for this site.',
      },
    ],
  };
}
