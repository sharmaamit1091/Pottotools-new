export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  relatedToolSlugs: string[];
  sections: BlogSection[];
  faqs: { q: string; a: string }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'compress-pdf-to-100kb-without-losing-quality',
    title: 'How to Compress a PDF to Under 100KB or 200KB Without Losing Readability',
    metaTitle: 'How to Compress PDF to 100KB Without Losing Quality | PottoTools Blog',
    metaDescription:
      'Practical technical guide to shrinking PDFs to 100KB or 200KB: page byte-budget formulas, stream optimization vs raster JPEG fallback, and legible DPI sizing.',
    excerpt:
      'Learn the exact per-page KB budget math, when PDF compression switches from vector stream optimization to JPEG rasterization, and how to preserve stamp/text legibility.',
    category: 'PDF Optimization',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-17',
    readTime: '6 min read',
    relatedToolSlugs: ['compress-pdf', 'pdf-page-organizer', 'delete-pdf-pages', 'merge-pdf'],
    sections: [
      {
        heading: 'Why Do Everyday PDFs Exceed 100KB or 200KB?',
        paragraphs: [
          'Most online application portals enforce strict file size ceilings between 100 KB and 500 KB per PDF, whereas documents exported from mobile scanner apps or bank portals routinely land between 2 MB and 15 MB.',
          'Plain PDF text itself is tiny—10 pages of digital typography occupy roughly 35 KB to 60 KB. Oversized PDFs are almost always caused by three culprits: unscaled 12-megapixel camera scans stored inside page streams, bloated embedded font subsets, and duplicate XObject or thumbnail resources left behind by desktop exporters.',
        ],
      },
      {
        heading: 'The Per-Page Byte Budget Formula (Before You Compress)',
        paragraphs: [
          'Every PDF container needs about 8% to 12% structural overhead (headers, page dictionaries, cross-reference tables). You can predict how readable a compressed document will be before running compression using this simple rule of thumb:',
          'Per-page budget (KB) ≈ (Target File Size in KB × 0.88) ÷ Page Count. For example, targeting 100 KB on a 2-page PDF leaves ~44 KB per page—plenty for crisp A4 scans at 120–150 DPI. Targeting 100 KB on an 18-page scanned booklet leaves less than 5 KB per page, which forces severe JPEG blocking unless unnecessary pages are removed first.',
        ],
        bullets: [
          '1–3 pages under 100 KB: Usually crisp and readable at medium-to-high clarity after scaling images cleanly.',
          '4–8 pages under 200 KB: Expect ~22–44 KB per page; trim blank back sides and appendices before compressing.',
          '10+ dense scanned pages under 100 KB: Split into logical sections or raise the target ceiling to 500 KB if your portal permits.',
        ],
      },
      {
        heading: 'Stream Cleanup vs. Raster JPEG Fallback: What Changes in Your File',
        paragraphs: [
          'Browser compression runs in two distinct stages. First, lossless structural cleanup strips redundant metadata, object streams, and unused resources while keeping every digital letter sharp and selectable.',
          'However, if your document contains heavy camera scans or exceeds a tight byte ceiling like 100 KB after stream cleanup, hitting the exact target requires re-rendering pages at scaled DPI (typically 96–150 DPI) and compressed JPEG quality. Understand this trade-off: rasterized compression guarantees compliance with strict portal byte limits, though text inside those re-rendered pages becomes a crisp image rather than selectable font glyphs.',
        ],
      },
      {
        heading: 'Step-by-Step Checklist for Legible Portal PDFs',
        paragraphs: [
          'Always verify small seals, serial numbers, and signatures at 100% zoom before submitting any form:',
        ],
        bullets: [
          'Step 1: Strip irrelevant cover letters or blank pages first using Delete PDF Pages so remaining pages get a larger KB share.',
          'Step 2: Open Compress PDF, select 100 KB, 200 KB, or a custom KB ceiling, and check the before/after readout.',
          'Step 3: If signature ink or printed roll numbers look faint, raise the target slightly (e.g., 100 KB -> 150 KB) or crop excess white tabletop borders before exporting.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Why does text sometimes stop being selectable after 100KB compression?',
        a: 'When structural stream cleanup alone cannot shrink a heavy PDF under a strict target like 100 KB, Compress PDF falls back to resolution-scaled JPEG page rendering so the final file meets the portal byte limit cleanly.',
      },
      {
        q: 'Does PottoTools upload my certificate PDF during compression?',
        a: 'No. Stream processing and canvas re-encoding execute locally inside your browser RAM with zero cloud uploads.',
      },
    ],
  },
  {
    slug: 'organize-rotate-and-merge-pdf-pages-safely',
    title: 'How to Organize, Rotate Sideways Scans & Merge PDF Pages Online Safely',
    metaTitle: 'How to Organize, Rotate & Merge PDF Pages Online | PottoTools Blog',
    metaDescription:
      'Learn how lossless /Rotate dictionary metadata preserves scan sharpness, how to normalize mixed A4/Letter page sizes, and assemble multi-page PDF packets locally.',
    excerpt:
      'Understand why lossless PDF rotation differs from destructive image re-saving, plus practical tips for normalizing mixed portrait/landscape packets up to 500 MB.',
    category: 'PDF Organization',
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-17',
    readTime: '5 min read',
    relatedToolSlugs: ['pdf-page-organizer', 'merge-pdf', 'split-pdf', 'delete-pdf-pages'],
    sections: [
      {
        heading: 'Lossless PDF /Rotate Dictionaries vs. Image Re-Encoding',
        paragraphs: [
          'When you scan mixed portrait certificates and landscape bank cheques, half the pages often end up rotated 90 or 180 degrees sideways. Many basic editors fix orientation by decoding pages to PNG/JPEG bitmaps, rotating pixels, and re-saving—which degrades sharpness and balloons file size.',
          'True PDF organization updates each page’s internal `/Rotate` metadata dictionary (in 90° increments: 0°, 90°, 180°, 270°) and copies original page streams losslessly. In PottoTools PDF Page Organizer, every font vector and scan pixel remains untouched even on 500 MB documents.',
        ],
      },
      {
        heading: 'Handling Mixed MediaBox Sizes (A4 vs. US Letter vs. Phone Photos)',
        paragraphs: [
          'Combining downloaded bank PDFs (typically A4: 595 × 842 pt) with uncropped camera scans (which can default to huge 3000 × 4000 pt dimensions) creates jarring zoom jumps when reviewers scroll through your packet.',
        ],
        bullets: [
          'Normalize loose camera JPG/PNG scans into consistent A4 pages first using Image to PDF before merging with digital PDFs.',
          'Combine multi-source documents in sequence with Merge PDF, then load the consolidated file into PDF Page Organizer to verify uniform thumbnails and fix sideways sheets.',
          'Use Undo and the deleted-pages recovery tray while organizing so accidental deletions never force you to restart from scratch.',
        ],
      },
      {
        heading: 'Performance Tips for Large 200+ Page PDFs in the Browser',
        paragraphs: [
          'Large multi-hundred-page scans can consume desktop or mobile RAM if rendered all at once. PDF Page Organizer loads page thumbnails lazily via object URLs to avoid copying multi-hundred-megabyte buffers unnecessarily across worker threads. Still, closing memory-heavy background video tabs helps 500 MB PDFs export smoothly on mobile phones.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does rotating pages inside PDF Page Organizer degrade text sharpness?',
        a: 'No. Rotating updates PDF page orientation metadata and preserves original vector text and embedded scan streams losslessly.',
      },
      {
        q: 'Can I restore a deleted page before downloading?',
        a: 'Yes. Deleted thumbnails move into a recoverable undo history so you can bring back any removed page prior to final export.',
      },
    ],
  },
  {
    slug: 'pdf-to-word-vs-scanned-ocr-guide',
    title: 'PDF to Word Conversion Explained: Native Layout Extraction vs Scanned OCR',
    metaTitle: 'PDF to Word vs Scanned OCR: How Conversion Works | PottoTools Blog',
    metaDescription:
      'Compare PDF text-stream extraction (Tj/TJ operators) vs Tesseract OCR raster segmentation, plus practical rules for multi-column tables and Hindi documents.',
    excerpt:
      'Discover how digital PDF text operators differ from scanned image containers—and why picking the right workflow prevents blank Word files or garbled columns.',
    category: 'Document Conversion',
    publishedAt: '2026-11-13',
    updatedAt: '2026-11-17',
    readTime: '6 min read',
    relatedToolSlugs: ['pdf-to-word', 'pdf-to-editable-word', 'ocr-tool', 'searchable-pdf-text-finder'],
    sections: [
      {
        heading: 'Under the Hood: PDF Text Operators vs. Flat Raster Scans',
        paragraphs: [
          'A PDF exported from Word, Google Docs, or a billing system encodes text using PDF content stream operators (`Tj`/`TJ`) mapped through font encoding tables (ToUnicode CMaps) at exact X/Y page coordinates. Reading those streams takes milliseconds and produces crisp selectable words.',
          'A scanned PDF or phone photo has zero text operators—it holds only compressed JPEG/PNG bitmap images wrapped inside a PDF frame. Standard text-stream converters reading a scanned PDF find zero characters unless Optical Character Recognition (OCR) runs image segmentation, binarization, and neural character classification across pixels.',
        ],
      },
      {
        heading: 'Choosing Between Digital Extraction, Layout+OCR, and Searchable PDF',
        paragraphs: [
          'Using the tool built for your exact input structure eliminates blank outputs and saves significant CPU time:',
        ],
        bullets: [
          'Clean Digital Reports & Contracts -> PDF to Word: Reads embedded text streams rapidly into clean paragraphs without loading ~10–25 MB OCR language models.',
          'Multi-Column Menus, Resumes, Logos & Scans -> PDF to Editable Word: Analyzes spatial coordinates to reconstruct layout tables, embeds extracted photos/logos, and triggers in-browser OCR automatically on image-only pages.',
          'Keyword Lookup & Searchable Archives -> Find Anything in Scanned PDFs: Indexes scans in English or Hindi so you can search snippets and jump straight to pages, or export a searchable PDF.',
        ],
      },
      {
        heading: 'Important Note for Hindi (Devanagari) OCR & Searchable PDF Export',
        paragraphs: [
          'When processing Hindi scans with Tesseract `hin` traineddata, recognized Devanagari text displays accurately inside both OCR Scanner (.txt/.docx exports) and Find Anything in Scanned PDFs (in-app keyword search and one-click page copy).',
          'However, keep one encoding constraint in mind: the Searchable PDF invisible-text-layer exporter currently uses standard Helvetica (`WinAnsi` / Latin-ASCII) PDF font metrics, meaning Devanagari Unicode characters are stripped from the exported PDF’s hidden `Ctrl+F` layer while remaining fully searchable and copyable inside the browser tool.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Why did a PDF to Word converter give me an empty file or broken layout?',
        a: 'If the source PDF is a scanned photograph, standard stream extraction finds no digital text. Switch to PDF to Editable Word (Layout + OCR) or OCR Scanner so Tesseract reads the pixels.',
      },
      {
        q: 'Do OCR tools work completely offline on the very first run?',
        a: 'All pixel analysis runs locally on your CPU without uploading documents, though the first OCR run downloads Tesseract WASM and ~10–25 MB language traineddata before caching it for offline reuse.',
      },
    ],
  },
  {
    slug: 'resize-photos-and-signatures-for-online-forms',
    title: 'How to Resize Photos and Signatures in Pixels, cm, mm & Exact KB for Forms',
    metaTitle: 'Resize Photos & Signatures in px, cm, mm & KB | PottoTools Blog',
    metaDescription:
      'Master DPI-to-pixel conversion math (pixels = cm / 2.54 × DPI), avoid signature KB compression rejection from grey paper shadows, and match 35x45mm exam specs.',
    excerpt:
      'Use exact DPI math to convert cm/mm passport dimensions to pixels cleanly, fix gray paper shadows on scanned signatures, and meet 20KB–50KB ceilings.',
    category: 'Image & Photo Guide',
    publishedAt: '2026-11-14',
    updatedAt: '2026-11-17',
    readTime: '6 min read',
    relatedToolSlugs: ['custom-photo-studio', 'photo-signature-resizer', 'passport-photo-cropper', 'photo-size-compressor'],
    sections: [
      {
        heading: 'The Exact Formula Converting Centimeters & Millimeters to Pixels',
        paragraphs: [
          'Recruitment and passport portals frequently publish rules in physical measurements like "3.5 cm × 4.5 cm" alongside strict kilobyte caps. Understanding the DPI (Dots Per Inch) conversion formula prevents accidental distortion:',
          'Pixels = (Centimeters ÷ 2.54) × DPI  |  or  Pixels = (Millimeters ÷ 25.4) × DPI. Because pixels are dimensionless until mapped via DPI, choosing 200 DPI or 300 DPI produces dramatically different pixel dimensions.',
        ],
        bullets: [
          '3.5 cm × 4.5 cm (35 × 45 mm) at 200 DPI -> 276 × 354 pixels',
          '3.5 cm × 4.5 cm (35 × 45 mm) at 300 DPI -> 413 × 531 pixels',
          '2.0 in × 2.0 in (US Passport / Visa) at 300 DPI -> 600 × 600 pixels',
          '140 px × 60 px or 3.5 cm × 1.5 cm signature at 200 DPI -> 276 × 118 pixels',
        ],
      },
      {
        heading: 'Why Signature Uploads Fail 10KB–20KB Compression Checks',
        paragraphs: [
          'Unlike portraits, scanned handwritten signatures suffer terribly when photographed in dim indoor lighting. Camera noise turns white paper into mottled warm-grey grain, wasting 70% of your 10 KB JPEG byte budget encoding noisy paper shadows instead of clean ink strokes.',
        ],
        bullets: [
          'Sign with thick black or dark-blue gel/ballpoint ink on plain unruled white A4 paper under bright daylight.',
          'Crop tightly around the signature box in Custom Photo Studio and boost contrast slightly so paper backgrounds normalize toward bright white before compressing.',
          'If a portal mandates exact pixel bounds AND exact KB ceiling (e.g., 200×230 px within 20–50 KB), use Exam Photo & Signature Resizer to enforce both constraints simultaneously.',
        ],
      },
      {
        heading: 'Avoiding Aspect-Ratio Stretching Rejected by Automated Validators',
        paragraphs: [
          'Automated form portals reject photos where heads look compressed vertically or horizontally. Never force a square 1:1 selfie straight into a 3.5:4.5 portrait frame by unlocking aspect ratio—instead, crop to the target 7:9 ratio first inside Passport Photo Cropper, then resize and compress cleanly.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Which DPI should I pick when a form only mentions 3.5 cm × 4.5 cm?',
        a: 'If no specific DPI or pixel size is mandated, 200 DPI (276×354 px) balances facial clarity and easily compresses into the common 20 KB–50 KB upload window.',
      },
      {
        q: 'Are my ID photos uploaded anywhere during resizing?',
        a: 'No. Resizing, physical cm/mm conversion, cropping, and KB compression run strictly inside your browser HTML5 Canvas.',
      },
    ],
  },
  {
    slug: 'why-client-side-pdf-tools-protect-confidential-ids',
    title: 'Client-Side Document Processing: Protecting Bank Statements & IDs Offline',
    metaTitle: 'Why Client-Side PDF Processing Protects Confidential IDs | PottoTools Blog',
    metaDescription:
      'Learn why floating PDF black boxes still leak selectable Aadhaar/bank text, how pixel-flattening prevents recovery, and how to verify zero network uploads.',
    excerpt:
      'Spot the difference between insecure PDF black-box annotations vs true rasterized pixel redaction, scrub hidden XMP/Info metadata, and inspect what stays local.',
    category: 'Document Privacy',
    publishedAt: '2026-11-15',
    updatedAt: '2026-11-17',
    readTime: '5 min read',
    relatedToolSlugs: ['pdf-id-redactor', 'pdf-metadata', 'protect-pdf', 'sign-pdf'],
    sections: [
      {
        heading: 'Why Drawing a Black Rectangle in Regular Editors Fails Redaction',
        paragraphs: [
          'A widespread privacy mistake when submitting salary slips, Aadhaar cards, or bank statements is covering account numbers with a black rectangle annotation in an ordinary PDF viewer. Visually, the number disappears on screen—yet the underlying PDF text string (`1234-5678-9012`) remains stored intact in the page stream beneath that box.',
          'Anyone opening the file can press Ctrl+A, copy-paste into Notepad, or run text extraction and recover every single hidden digit.',
        ],
      },
      {
        heading: 'True Pixel-Flattening Redaction + Hidden Metadata Scrubbing',
        paragraphs: [
          'Permanent redaction requires destroying underlying characters—not painting over them. PottoTools Offline PDF & ID Redactor renders masked PDF pages onto local Canvas bitmaps, overwrites redacted regions with solid blackout, whiteout, or heavy pixel blur, and clears document metadata before writing a flattened file.',
        ],
        bullets: [
          'No underlying text stream survives under redacted regions in exported flattened PDFs.',
          'Works completely offline in Airplane Mode once cached as a PWA so Aadhaar, PAN, and salary records never cross any internet connection.',
          'Pair with PDF Metadata Viewer & Remover (or our PDF Privacy Sanitizer) to wipe hidden Author names, Creator app strings, and creation timestamps from digital PDFs.',
        ],
      },
      {
        heading: 'Honest Scope Note: Redaction & Sanitization vs. Open-Password Locks',
        paragraphs: [
          'Transparency matters for security workflows: PottoTools focuses in-browser on permanent visual redaction, metadata stripping, and clean PDF stream rebuilding via `pdf-lib`. Client-side `pdf-lib` does not apply cryptographic open-password encryption yet—so if you need a recipient to enter a password before opening a PDF, use your operating system’s Print/Export-as-Encrypted-PDF dialog or desktop Adobe Acrobat after scrubbing sensitive data locally.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How can I verify that zero document bytes leave my computer?',
        a: 'Open DevTools (F12) -> Network tab while running Offline PDF & ID Redactor or Compress PDF, or switch your laptop/phone into Airplane Mode after installing the PWA: processing finishes identically with zero network requests.',
      },
      {
        q: 'Can anyone undo pixel blur or blackout redactions exported from PottoTools?',
        a: 'No. Masked coordinates are overwritten in raster image pixels and flattened prior to export, eliminating underlying selectable text streams and metadata.',
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
