/**
 * PottoTools - International SEO & Structured Data Service
 * Dynamically synchronizes titles, meta descriptions, canonical URLs,
 * Open Graph cards, and Schema.org JSON-LD structured data for every page and tool.
 */

import { ToolDefinition } from '../../types/tools';
import { TOOLS } from '../../config/toolsRegistry';
import { SITE_CONFIG } from '../../config/site';
import { getBlogPostBySlug } from '../../config/blogPosts';
import { getHindiPageBySlug, getHindiCounterpartForEnglishSlug } from '../../config/hindiPages';

interface ToolSeoConfig {
  title: string;
  metaDesc: string;
}

// Curated international search-intent titles and meta descriptions
const TOOL_SEO_MAP: Record<string, ToolSeoConfig> = {
  'searchable-pdf-text-finder': {
    title: 'Find Anything in Scanned PDFs – Search & Make PDF Searchable Online | PottoTools',
    metaDesc: 'Search for names, amounts, reference numbers & phrases inside scanned PDFs. Extract text with in-browser OCR (English & Hindi) and download a searchable PDF with invisible text layer.',
  },
  'pdf-page-organizer': {
    title: 'Organize & Rotate PDF Pages Online Free – Reorder & Delete | PottoTools',
    metaDesc: 'Organize PDF pages online up to 500 MB. Visually reorder pages, rotate sideways PDF pages 90°/180°, delete blank sheets with undo, and download locally.',
  },
  'compress-pdf': {
    title: 'Compress PDF Online Free – Reduce PDF Size to 100KB / 200KB | PottoTools',
    metaDesc: 'Compress PDF online free to 100KB, 200KB, or 500KB while preserving crisp text and clarity. 100% private in-browser compression with zero server uploads.',
  },
  'merge-pdf': {
    title: 'Merge PDF Files Online Free – Combine Multiple PDFs | PottoTools',
    metaDesc: 'Combine multiple PDF files into one organized document in seconds. Easy drag-and-drop reordering, completely free and processed locally on your device.',
  },
  'split-pdf': {
    title: 'Split PDF Online – Extract Pages from PDF Document Free | PottoTools',
    metaDesc: 'Split large PDF documents into separate files by page ranges or individual pages. Fast, secure, and client-side with instant download.',
  },
  'delete-pdf-pages': {
    title: 'Delete PDF Pages Online – Remove Unwanted Pages from PDF | PottoTools',
    metaDesc: 'Quickly remove blank or unwanted pages from any PDF document. Free in-browser tool with zero server uploads for total privacy.',
  },
  'watermark-pdf': {
    title: 'Watermark PDF Online – Add Text Watermark to PDF Free | PottoTools',
    metaDesc: 'Protect your PDF documents by adding custom text watermarks, transparency controls, and rotation angles. Free online PDF watermarking.',
  },
  'page-numbers-pdf': {
    title: 'Add Page Numbers to PDF Online – Number PDF Pages Free | PottoTools',
    metaDesc: 'Insert clean page numbers into your PDF documents with customizable position, font size, and starting number. Fast and completely client-side.',
  },
  'pdf-to-editable-word': {
    title: 'PDF to Editable Word (Layout + OCR) – Scanned PDF to DOCX | PottoTools',
    metaDesc: 'Convert multi-column & scanned PDFs into editable Word (.docx) with tables, embedded photos, and bilingual OCR layout preserved in your browser.',
  },
  'pdf-to-word': {
    title: 'PDF to Word Converter Online Free – Convert PDF to DOCX | PottoTools',
    metaDesc: 'Convert PDF files into editable Microsoft Word (.docx) documents directly in your browser. Fast, accurate, and private with no email required.',
  },
  'word-to-pdf': {
    title: 'Word to PDF Converter – Convert DOCX to PDF Online Free | PottoTools',
    metaDesc: 'Convert Microsoft Word (.docx) files into clean, professional PDF documents online. Fast, high-fidelity conversion running entirely in your browser.',
  },
  'docx-to-txt': {
    title: 'Extract Text from Word DOCX – Convert DOCX to TXT Online | PottoTools',
    metaDesc: 'Extract plain clean text from Word (.docx) files instantly. Strip formatting and export readable text without opening Microsoft Office.',
  },
  'docx-to-html': {
    title: 'DOCX to HTML Converter – Convert Word Documents to HTML | PottoTools',
    metaDesc: 'Convert Word .docx files into clean, semantic HTML code for web pages, blogs, and content management systems.',
  },
  'txt-to-pdf': {
    title: 'Text to PDF Converter – Convert Plain TXT Files to PDF | PottoTools',
    metaDesc: 'Convert plain text (.txt) files into clean, formatted PDF documents with customizable page margins and fonts.',
  },
  'markdown-to-pdf': {
    title: 'Markdown to PDF Converter – Render MD Files to PDF Online | PottoTools',
    metaDesc: 'Convert Markdown (.md) documents with headers, lists, code blocks, and tables into beautifully styled PDF files.',
  },
  'image-converter': {
    title: 'Image Converter Online Free – Convert JPG, PNG, WebP & BMP | PottoTools',
    metaDesc: 'Convert images between JPG, PNG, WebP, and BMP formats instantly in your browser with adjustable compression quality and zero cloud uploads.',
  },
  'image-format-converter': {
    title: 'Batch Photo Format Converter – JPG, PNG & WebP Optimizer | PottoTools',
    metaDesc: 'Convert and optimize photo formats between JPG, PNG, and WebP inside Photo Studio with fine-grained compression and dimensions control.',
  },
  'image-to-pdf': {
    title: 'JPG to PDF Converter – Convert Images to Multi-Page PDF | PottoTools',
    metaDesc: 'Convert JPG, PNG, and other photos into a clean multi-page PDF document. Arrange images in order and download a consolidated PDF.',
  },
  'pdf-to-images': {
    title: 'PDF to JPG Converter – Extract PDF Pages as High-Res Images | PottoTools',
    metaDesc: 'Extract all pages or selected pages from a PDF document as high-resolution JPG or PNG images. Free in-browser PDF image extractor.',
  },
  'ocr-tool': {
    title: 'Free Online OCR – Extract Text from Images & Scanned PDFs | PottoTools',
    metaDesc: 'Extract text from scanned PDFs, receipts, and photos using in-browser Optical Character Recognition (OCR). Accurate and 100% private.',
  },
  'protect-pdf': {
    title: 'Protect PDF with Password Online Free – AES-256 PDF Encryption | PottoTools',
    metaDesc: 'Encrypt and password-protect PDF files with real AES-256 or AES-128 security and print/copy restrictions 100% locally in your browser. Zero cloud uploads.',
  },
  'unlock-pdf': {
    title: 'Unlock PDF Online Free – Remove PDF Password Losslessly | PottoTools',
    metaDesc: 'Remove password protection and print/copy restrictions from e-Aadhaar, bank statements, and PDF files losslessly in your browser. 100% private.',
  },
  'pdf-id-redactor': {
    title: 'Offline PDF & ID Redactor – Hide Aadhaar, Bank & Salary Info Free | PottoTools',
    metaDesc: 'Permanently blackout or pixel-blur Aadhaar numbers, bank accounts, PAN, and salary slips 100% offline in your browser. Zero cloud uploads.',
  },
  'remove-scan-watermark': {
    title: 'REMOVE SCAN WATERMARK – Remove CamScanner & Adobe Scan Labels Free | PottoTools',
    metaDesc: 'Remove unwanted scanner app labels like Scanned with CamScanner and Adobe Scan from your scanned PDF pages in-browser with auto detection, manual selection, and Before & After preview.',
  },
  'sign-pdf': {
    title: 'Sign PDF Online – Draw Signature & Stamp PDF Locally | PottoTools',
    metaDesc: 'Draw a navy-ink signature or upload an image stamp onto any PDF page directly in your browser. Signed outputs include a subtle PottoTools full-page watermark.',
  },
  'pdf-metadata': {
    title: 'PDF Metadata Viewer & Editor – Inspect and Clean PDF Info | PottoTools',
    metaDesc: 'View and update PDF author, title, subject, and creation metadata, or wipe hidden tracking metadata for privacy before sharing.',
  },
  'photo-signature-resizer': {
    title: 'Photo & Signature Resizer – Standard Passport, Job & Exam Sizes | PottoTools',
    metaDesc: 'Resize photos and signatures to exact pixel dimensions and strict KB file limits (20KB, 50KB, 100KB) for online applications worldwide.',
  },
  'passport-photo-cropper': {
    title: 'Passport Photo Cropper – Standard 2x2 & 35x45mm Photo Maker | PottoTools',
    metaDesc: 'Crop portrait photos to standard international passport photo proportions (2x2 inch, 35x45mm) with centered facial guides.',
  },
  'combine-app-documents': {
    title: 'Combine Application Documents – Merge Photo, Sign & Certificates | PottoTools',
    metaDesc: 'Combine your photograph, signature, and verification certificates into a single organized PDF for job and academic submissions.',
  },
  'pdf-text-extractor': {
    title: 'Extract Text from PDF Online – Copy Text from PDF Documents | PottoTools',
    metaDesc: 'Extract clean selectable text from native and scanned PDF documents with character and word statistics.',
  },
  'text-diff-comparator': {
    title: 'Text Compare & Diff Tool – Compare Two Texts Side by Side | PottoTools',
    metaDesc: 'Compare two text documents side-by-side with color-coded diff highlighting additions, deletions, and modifications.',
  },
  'text-cleaner': {
    title: 'Smart Text Cleaner – Format, Trim & Clean Text Online | PottoTools',
    metaDesc: 'Clean messy text by removing duplicate spaces, fixing line breaks, stripping HTML tags, and normalizing character cases.',
  },
  'csv-to-xlsx': {
    title: 'CSV to Excel Converter – Convert CSV Files to XLSX Online | PottoTools',
    metaDesc: 'Convert raw CSV data into styled Microsoft Excel (.xlsx) spreadsheets with auto-detected data types and formatting.',
  },
  'xlsx-to-csv': {
    title: 'Excel to CSV Converter – Convert XLSX Spreadsheets to CSV | PottoTools',
    metaDesc: 'Export Excel (.xlsx) sheets into standard comma-separated (.csv) files ready for databases, reporting, and data pipelines.',
  },
  'sheet-viewer': {
    title: 'Spreadsheet Viewer Online – View CSV and XLSX Files in Browser | PottoTools',
    metaDesc: 'Open, inspect, filter, and search CSV and Excel spreadsheets directly in your browser without installing Microsoft Office.',
  },
  'powerpoint-to-pdf': {
    title: 'PowerPoint to PDF Converter – Extract PPTX Slide Text to PDF | PottoTools',
    metaDesc: 'Convert PowerPoint (.pptx) presentations locally into clean A4 landscape PDF text cards—extracting slide titles and bullet lists without cloud uploads.',
  },
  'excel-to-pdf': {
    title: 'Excel to PDF Converter – Convert XLSX & CSV to PDF Tables Online | PottoTools',
    metaDesc: 'Convert Microsoft Excel spreadsheets and CSV tables into styled, printable landscape PDF documents directly in your browser.',
  },
  'pdf-to-excel': {
    title: 'PDF to Excel Converter – Extract Delimited PDF Tables to XLSX | PottoTools',
    metaDesc: 'Extract delimited text rows from digital PDFs into editable Microsoft Excel (.xlsx) workbooks directly in your browser.',
  },
  'jpg-to-png': {
    title: 'JPG to PNG Converter – Convert JPG to Lossless PNG Online | PottoTools',
    metaDesc: 'Convert JPG / JPEG photos to lossless PNG format with transparent alpha support. Free in-browser image conversion with zero server uploads.',
  },
  'png-to-jpg': {
    title: 'PNG to JPG Converter – Convert PNG Images to Lightweight JPG | PottoTools',
    metaDesc: 'Convert PNG graphics and screenshots to lightweight JPG format with adjustable quality. Fast, private, and client-side.',
  },
  'custom-photo-studio': {
    title: 'Resize Image Online Free – Photo Resizer (px, cm, mm, KB) | PottoTools',
    metaDesc: 'Resize image online in px, cm, mm, or inches, crop freely, straighten, compress to exact KB, and convert formats directly in your browser.',
  },
  'custom-photo-resizer': {
    title: 'Resize Image Online Free – Photo Resizer (px, cm, mm, KB) | PottoTools',
    metaDesc: 'Resize image online in px, cm, mm, or inches, crop freely, straighten, compress to exact KB, and convert formats directly in your browser.',
  },
  'photo-size-compressor': {
    title: 'Photo Size Compressor – Compress Photos to Exact KB Online | PottoTools',
    metaDesc: 'Compress photos down to 20KB, 50KB, 100KB, or custom file size limits without losing clarity. 100% free, private in-browser compression.',
  },
  'photo-editor': {
    title: 'Online Photo Editor – Crop, Rotate, Adjust & Filter Images | PottoTools',
    metaDesc: 'Crop, rotate, flip, and fine-tune brightness, contrast, and saturation of photos directly in your browser with instant live preview.',
  },
  'photo-background-changer': {
    title: 'Photo Background Color Changer – White & Blue Backgrounds | PottoTools',
    metaDesc: 'Change passport photo backgrounds to clean white, light blue, or custom solid colors for official visa, passport, and exam forms.',
  },
  'hd-image-enhancer': {
    title: 'HD Image Enhancer – Sharpen & Enhance Blurry Photos Online | PottoTools',
    metaDesc: 'Intelligently enhance blurry photos, sharpen edges, and improve portrait clarity with browser hardware acceleration.',
  },
};

/**
 * Synchronize document title, meta description, canonical URL,
 * Open Graph tags, and Schema.org JSON-LD structured data.
 */
export function updatePageSeoMetadata(tool: ToolDefinition | null, view: string): void {
  if (typeof document === 'undefined') return;

  const baseDomain = 'https://pottotools.in';
  let title = 'PottoTools – Free PDF Compressor, Photo Resizer & OCR Tools (In-Browser)';
  let description =
    'Free browser-based PDF, photo resizer, and OCR tools. Compress PDF to 100KB, convert PDF to Word, resize exam/passport photos (px, cm, mm, 20KB–50KB), and redact Aadhaar/bank PDFs offline.';
  let canonicalPath = '/';

  if (tool) {
    const customSeo = TOOL_SEO_MAP[tool.slug] || TOOL_SEO_MAP[tool.id];
    title = customSeo?.title || `${tool.title} – Free Online Tool | ${SITE_CONFIG.name}`;
    description = customSeo?.metaDesc || tool.fullDesc;
    canonicalPath = `/${tool.slug}`;
  } else if (view === 'about') {
    title = `About PottoTools – Free Client-Side Document Utilities`;
    description =
      'Learn about PottoTools, our mission to provide completely free, private, client-side document and image processing tools without server uploads.';
    canonicalPath = '/about';
  } else if (view === 'privacy') {
    title = `Privacy Policy – 100% In-Browser Document Processing | PottoTools`;
    description =
      'Our zero-server-upload privacy guarantee. Learn how PottoTools processes all files locally inside your browser using WebAssembly and memory streams.';
    canonicalPath = '/privacy';
  } else if (view === 'terms') {
    title = `Terms of Service | PottoTools`;
    description =
      'Terms of service and fair use conditions for PottoTools free document and image processing tools.';
    canonicalPath = '/terms';
  } else if (view === 'contact') {
    title = `Contact Support & Feedback | PottoTools`;
    description =
      'Have questions, feedback, or a tool suggestion? Contact the PottoTools engineering team.';
    canonicalPath = '/contact';
  } else if (view === 'disclaimer') {
    title = `Disclaimer & Compliance Information | PottoTools`;
    description =
      'Legal disclaimer, security certifications, and compliance details regarding PottoTools document utilities.';
    canonicalPath = '/disclaimer';
  } else if (view === 'cookie-policy' || view === 'cookies') {
    title = `Cookie Policy – Cookie & Tracking Practices | PottoTools`;
    description =
      'Learn how PottoTools uses essential local storage, analytics, and advertising cookies, and how you can manage or opt out of cookies.';
    canonicalPath = '/cookie-policy';
  } else if (view === 'directory') {
    title = `All ${TOOLS.length} Free Tools Directory | PottoTools`;
    description = `Browse all ${TOOLS.length} free document, PDF, Word, Excel, image, OCR, and text tools available on PottoTools.`;
    canonicalPath = '/directory';
  } else if (view === 'blog') {
    title = `Document, PDF & Image Guides Blog | PottoTools`;
    description =
      'Practical tutorials explaining how to compress PDFs to 100KB, rotate PDF pages, convert scans with OCR, resize exam photos, and redact IDs privately.';
    canonicalPath = '/blog';
  } else if (view.startsWith('blog/')) {
    const blogSlug = view.replace('blog/', '');
    const post = getBlogPostBySlug(blogSlug);
    if (post) {
      title = post.metaTitle;
      description = post.metaDescription;
      canonicalPath = `/blog/${post.slug}`;
    }
  } else if (view === 'hi' || view.startsWith('hi/')) {
    const hiConfig = getHindiPageBySlug(view);
    if (hiConfig) {
      title = hiConfig.title;
      description = hiConfig.metaDescription;
      canonicalPath = `/${hiConfig.slug}`;
    }
  } else if (view.startsWith('category-')) {
    const rawCat = view.replace('category-', '');
    const catId = rawCat === 'convert-documents' ? 'convert-docs' : rawCat;
    const catMeta: Record<string, { title: string; desc: string }> = {
      'organize-pdf': {
        title: 'Organize PDF Online – Merge, Split, Rotate & Reorder PDF Pages | PottoTools',
        desc: 'Organize, combine, split, rotate, and delete PDF pages with ease. 100% free, private client-side PDF organizer without server uploads.',
      },
      'compress-pdf': {
        title: 'Compress PDF Online – Reduce PDF File Size Free | PottoTools',
        desc: 'Reduce PDF file size online to 100KB, 200KB, or 500KB while preserving quality. 100% free, private in-browser compression without server uploads.',
      },
      'convert-docs': {
        title: 'Convert Documents Online – PDF, Word, DOCX & Text Tools | PottoTools',
        desc: 'High-fidelity document conversion: Word DOCX to PDF, PDF to editable Word DOCX, TXT, and Markdown. Completely free and secure.',
      },
      'convert-images': {
        title: 'Convert Image Formats Online – JPG, PNG, WebP, BMP & Image-PDF | PottoTools',
        desc: 'Transcode raster formats losslessly or with custom quality sliders: convert JPG to transparent PNG, PNG to compact JPG, WebP/BMP batches, images to multi-page PDF, and PDF pages to JPG/PNG.',
      },
      'ocr-scanned': {
        title: 'OCR & Scanned PDF Tools – Searchable PDF & Text Extraction | PottoTools',
        desc: 'Run in-browser Tesseract OCR on scanned PDFs and photos (English & Hindi), search inside scanned documents, copy editable text, or export DOCX & searchable PDFs locally.',
      },
      'pdf-security': {
        title: 'PDF Privacy, Redaction, Signing & Metadata Sanitizer | PottoTools',
        desc: 'Protect confidential PDFs locally in your browser: permanently blackout or pixel-blur Aadhaar/bank details offline, stamp visual signatures, and inspect or wipe hidden PDF metadata.',
      },
      'gov-tools': {
        title: 'Image Tools Online – Exam Photo & Signature Presets & Resizers | PottoTools',
        desc: 'Verified presets for passport photos, exam signatures (UPSC/SSC/IBPS), dimension rules, and strict KB file size ceilings inside Image Tools.',
      },
      'smart-utilities': {
        title: 'Smart Text & PDF Utilities – Extract, Clean & Diff Texts | PottoTools',
        desc: 'Inspect word/character counts and extract selectable text from PDFs, strip messy PDF copy-paste line breaks or HTML tags, and compare two text drafts side-by-side locally.',
      },
      'spreadsheets': {
        title: 'CSV & Delimited Spreadsheet Tools – Sheet Viewer, CSV to XLSX & Export | PottoTools',
        desc: 'Inspect CSV and multi-sheet spreadsheets directly in your browser without Office, search/filter rows cleanly, export filtered CSV or JSON, and convert delimited CSV data to UTF-8 XLSX.',
      },
      'pdf-tools': {
        title: 'PDF Tools Online – Compress to 100KB, Merge, Split, Redact & Convert | PottoTools',
        desc: 'Free browser-based PDF tools: compress PDF to 100KB/200KB, merge, split, rotate & reorder pages up to 500 MB, permanently redact Aadhaar/bank details offline, and convert PDFs.',
      },
      'word-tools': {
        title: 'Word Tools Online – Word to PDF, PDF to Word & DOCX Converters | PottoTools',
        desc: 'Convert Word (.docx) files to PDF, clean HTML, or TXT, convert digital or scanned PDFs into editable Word (.docx), and render Markdown to PDF privately in-browser.',
      },
      'excel-tools': {
        title: 'Excel Tools Online – Excel to PDF, PDF to Excel & Workbook Converters | PottoTools',
        desc: 'Work with Microsoft Excel (.xlsx, .xls) workbooks offline in-browser: render multi-sheet spreadsheets to landscape PDF reports and extract delimited PDF tables to XLSX.',
      },
      'powerpoint-tools': {
        title: 'PowerPoint Tools Online – Extract PPTX Slides to Text-Card PDF Free | PottoTools',
        desc: 'Convert Microsoft PowerPoint (.pptx) presentations into clean landscape text-card PDF handouts directly inside your browser with zero cloud uploads.',
      },
      'image-tools': {
        title: 'Image Tools & Photo Studio – Resize px, cm, mm, Passport & Exam Photos | PottoTools',
        desc: 'Precision Photo Studio for pixel, centimeter (cm), millimeter (mm), and inch resizing at 72–300 DPI. Crop 35x45mm or 2x2 passport photos, hit 20KB–50KB exam limits, and enhance portraits.',
      },
      'other-document-tools': {
        title: 'OCR, Offline Redactor, Text Diff & Cleanup Utilities | PottoTools',
        desc: 'Specialized browser document utilities: inspect Aadhaar/bank PDFs with offline pixel redaction, extract text from digital or scanned PDFs, compare revisions side-by-side, and clean formatting.',
      },
    };

    const currentCat = catMeta[catId];
    if (currentCat) {
      title = currentCat.title;
      description = currentCat.desc;
    } else {
      const catName = catId.replace(/-/g, ' ');
      title = `${catName.charAt(0).toUpperCase() + catName.slice(1)} Tools | PottoTools`;
      description = `Explore free online ${catName} tools for PDFs, documents, images, and spreadsheets. 100% private and in-browser.`;
    }
    canonicalPath = `/${catId}`;
  }

  // 1. Update document title & language attribute
  document.title = title;
  const isHindiRoute = canonicalPath === '/hi' || canonicalPath.startsWith('/hi/');
  document.documentElement.lang = isHindiRoute ? 'hi' : 'en';

  // 2. Update meta description
  const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDesc) metaDesc.content = description;

  // 3. Update canonical & strict bidirectional hreflang URLs (only emit hi hreflang when real Hindi page exists)
  const fullCanonicalUrl = `${baseDomain}${canonicalPath}`;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = fullCanonicalUrl;

  const cleanCanonSlug = canonicalPath.replace(/^\/+|\/+$/g, '');
  let enHref = fullCanonicalUrl;
  let hiHref: string | null = null;

  if (isHindiRoute) {
    const hiCfg = getHindiPageBySlug(cleanCanonSlug);
    if (hiCfg) {
      enHref = hiCfg.enSlug ? `${baseDomain}/${hiCfg.enSlug}` : `${baseDomain}/`;
      hiHref = fullCanonicalUrl;
    }
  } else {
    const hiCounterpart = getHindiCounterpartForEnglishSlug(cleanCanonSlug);
    if (hiCounterpart) {
      hiHref = `${baseDomain}/${hiCounterpart.slug}`;
    }
  }

  // Sync x-default and en hreflangs
  document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((el) => {
    const lang = el.getAttribute('hreflang');
    if (lang === 'en' || lang === 'x-default') {
      el.href = enHref;
    } else if (lang === 'hi') {
      if (hiHref) {
        el.href = hiHref;
      } else {
        el.remove();
      }
    }
  });

  if (hiHref && !document.querySelector('link[rel="alternate"][hreflang="hi"]')) {
    const hiLink = document.createElement('link');
    hiLink.rel = 'alternate';
    hiLink.hreflang = 'hi';
    hiLink.href = hiHref;
    document.head.appendChild(hiLink);
  }

  // 3b. Prevent internal search query URLs (?q=...) from competing for indexation
  const hasSearchQueryParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('q');
  const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (robotsMeta) {
    robotsMeta.content = hasSearchQueryParam
      ? 'noindex, follow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  }

  // 4. Update OpenGraph tags
  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = title;

  const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = description;

  const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = fullCanonicalUrl;

  // 5. Update Twitter card tags
  const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.content = title;

  const twitterDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.content = description;

  // 6. Inject dynamic Schema.org JSON-LD for individual tool, blog, and Hindi pages
  updatePageStructuredData(tool, view, canonicalPath, title, description);
}

/**
 * Injects or updates crawlable Schema.org structured data for the active tool, blog, or Hindi page
 */
function updatePageStructuredData(
  tool: ToolDefinition | null,
  view: string,
  canonicalPath: string,
  _title: string,
  description: string
): void {
  const SCRIPT_ID = 'pottotools-dynamic-schema';
  let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  if (!tool && !view.startsWith('blog') && view !== 'hi' && !view.startsWith('hi/')) {
    if (scriptEl) scriptEl.remove();
    return;
  }

  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = SCRIPT_ID;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const pageUrl = `https://pottotools.in${canonicalPath}`;

  if (view.startsWith('blog/')) {
    const post = getBlogPostBySlug(view.replace('blog/', ''));
    if (!post) return;
    const graph: Record<string, unknown>[] = [
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: post.title,
        description: post.metaDescription,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: { '@type': 'Organization', name: 'PottoTools', url: 'https://pottotools.in/' },
        publisher: { '@id': 'https://pottotools.in/#organization' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
          { '@type': 'ListItem', position: 2, name: 'Guides & Blog', item: 'https://pottotools.in/blog' },
          { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
        ],
      },
    ];
    scriptEl.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    return;
  }

  if (view === 'blog') {
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Blog',
          '@id': `${pageUrl}#blog`,
          name: 'PottoTools Guides & Blog',
          url: pageUrl,
          description,
          publisher: { '@id': 'https://pottotools.in/#organization' },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${pageUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
            { '@type': 'ListItem', position: 2, name: 'Guides & Blog', item: pageUrl },
          ],
        },
      ],
    });
    return;
  }

  if (view === 'hi' || view.startsWith('hi/')) {
    const hiCfg = getHindiPageBySlug(view);
    if (!hiCfg) return;
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          inLanguage: 'hi',
          name: hiCfg.h1,
          url: pageUrl,
          description: hiCfg.metaDescription,
          isPartOf: { '@id': 'https://pottotools.in/#website' },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${pageUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
            { '@type': 'ListItem', position: 2, name: hiCfg.h1, item: pageUrl },
          ],
        },
      ],
    });
    return;
  }

  if (!tool) return;
  const toolUrl = pageUrl;

  const schemaGraph = [
    {
      '@type': 'WebApplication',
      '@id': `${toolUrl}#software`,
      name: tool.title,
      url: toolUrl,
      description,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'All modern browsers (Chrome, Edge, Safari, Firefox)',
      browserRequirements: 'Requires WebAssembly and modern browser',
      isPartOf: { '@id': 'https://pottotools.in/#website' },
      publisher: { '@id': 'https://pottotools.in/#organization' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${toolUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://pottotools.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: tool.categoryName,
          item: `https://pottotools.in/${tool.category === 'compress-pdf' ? 'pdf-tools' : tool.category}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: tool.title,
          item: toolUrl,
        },
      ],
    },
  ];

  // Add FAQ schema if the tool has FAQs
  if (tool.faqs && tool.faqs.length > 0) {
    schemaGraph.push({
      '@type': 'FAQPage',
      '@id': `${toolUrl}#faq`,
      mainEntity: tool.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    } as any);
  }

  scriptEl.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemaGraph,
  });
}
