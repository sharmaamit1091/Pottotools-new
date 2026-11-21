import { TOOLS, ToolDefinition } from '../../config/toolsRegistry';
import { getToolTechnicalProfile } from '../../config/toolTechnicalProfiles';
import { getRelatedToolSlugs } from '../../config/relatedToolsMap';
import { BLOG_POSTS, BlogPost } from '../../config/blogPosts';
import { CATEGORY_GUIDANCE_LIST, CATEGORY_GUIDANCE_MAP } from '../../config/categoryGuidance';
import {
  HINDI_PAGES,
  HindiPageConfig,
  getHindiCounterpartForEnglishSlug,
} from '../../config/hindiPages';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface SeoConfig {
  title: string;
  metaDesc: string;
}

const TOOL_SEO_MAP: Record<string, SeoConfig> = {
  'fill-pdf-form': {
    title: 'FILL PDF FORM Online Free – Add Text, Photo & Signature to Any PDF | PottoTools',
    metaDesc: 'Fill PDF online without converting to Word. Type on any PDF (including Hindi/Unicode), add photos, digital signatures, dates & checkmarks with reusable assets, snap guides, and instant download.',
  },
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
    title: 'DOCX to TXT Converter – Extract Plain Text from Word Online | PottoTools',
    metaDesc: 'Extract clean plain text from Microsoft Word documents instantly in your browser without uploading to any remote server.',
  },
  'docx-to-html': {
    title: 'DOCX to HTML Converter – Convert Word to Clean Web Code | PottoTools',
    metaDesc: 'Convert Word documents to clean semantic HTML markup ready for blog posts, CMS publishing, and website content.',
  },
  'txt-to-pdf': {
    title: 'TXT to PDF Converter – Convert Plain Text to PDF Document | PottoTools',
    metaDesc: 'Convert raw text files into formatted PDF documents with customizable margins, font sizes, and paper layout.',
  },
  'markdown-to-pdf': {
    title: 'Markdown to PDF Converter – Render GitHub-Flavored Markdown to PDF | PottoTools',
    metaDesc: 'Render Markdown notes, READMEs, and technical documentation into beautifully styled PDF documents with code syntax highlighting.',
  },
  'image-converter': {
    title: 'Image Converter Online Free – Convert JPG, PNG, WebP & BMP | PottoTools',
    metaDesc: 'Convert images between JPG, PNG, WebP, and BMP formats instantly in your browser with adjustable compression quality and zero cloud uploads.',
  },
  'image-to-pdf': {
    title: 'Image to PDF Converter – Combine Photos into Single PDF Free | PottoTools',
    metaDesc: 'Convert and consolidate multiple photos (JPG, PNG, WEBP) into a single PDF document with custom margins and page orientations.',
  },
  'pdf-to-images': {
    title: 'PDF to Image Converter – Extract PDF Pages as High-Res JPG/PNG | PottoTools',
    metaDesc: 'Convert PDF pages into high-resolution JPG or PNG images directly in your browser. Fast, private, and batch downloadable in a ZIP archive.',
  },
  'ocr-tool': {
    title: 'Free Online OCR Scanner – Extract Text from Scanned PDFs & Photos | PottoTools',
    metaDesc: 'Extract editable text from scanned documents, photos, and invoices with in-browser optical character recognition (OCR) supporting English and Hindi.',
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
    metaDesc: 'Permanently blackout or pixel-blur Aadhaar numbers, bank accounts, PAN, and salary slips 100% offline in your browser. Zero server uploads.',
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
    title: 'PDF Metadata Editor – View, Edit & Wipe PDF Properties | PottoTools',
    metaDesc: 'Inspect and edit PDF title, author, subject, keywords, and creation dates, or wipe all tracking metadata for total privacy.',
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
    metaDesc: 'Compress photos to exact target sizes like 20KB, 50KB, 100KB, or 200KB for government job applications, university admissions, and online forms.',
  },
  'photo-signature-resizer': {
    title: 'Exam Photo & Signature Resizer – UPSC, SSC, IBPS Form Ready | PottoTools',
    metaDesc: 'Crop, resize, and compress passport photos and signatures to exact government recruitment dimensions (px, cm, mm) and byte limits (20KB–50KB).',
  },
  'photo-editor': {
    title: 'Online Photo Editor – Crop, Rotate, Adjust & Filter Images Free | PottoTools',
    metaDesc: 'Crop, rotate, flip, and fine-tune brightness, contrast, and saturation of photos directly in your browser with instant live preview.',
  },
  'hd-image-enhancer': {
    title: 'HD Image Enhancer – Sharpen & Enhance Blurry Photos Online | PottoTools',
    metaDesc: 'Intelligently sharpen details, improve clarity, and enhance photo edges in your browser with hardware acceleration.',
  },
  'image-format-converter': {
    title: 'Batch Photo Format Converter – JPG, PNG & WebP Optimizer | PottoTools',
    metaDesc: 'Convert and optimize photo formats between JPG, PNG, and WebP inside Photo Studio with fine-grained compression and dimensions control.',
  },
  'photo-background-changer': {
    title: 'Photo Background Color Changer – White & Blue Backgrounds | PottoTools',
    metaDesc: 'Change passport photo backgrounds to clean white, light blue, or custom solid colors for official visa, passport, and exam forms.',
  },
  'passport-photo-cropper': {
    title: 'Passport Photo Maker – 2x2 Inch & 3.5x4.5 cm Photo Cropper | PottoTools',
    metaDesc: 'Create compliant passport and visa photos with standard 2x2 inch (51x51 mm) or 3.5x4.5 cm aspect ratios and white background guidelines.',
  },
  'combine-app-documents': {
    title: 'Combine Photo & Signature – Single Sheet Document Merger | PottoTools',
    metaDesc: 'Merge candidate passport photo and handwritten signature onto a single page or consolidated document for online job portal submissions.',
  },
  'pdf-text-extractor': {
    title: 'PDF Text Extractor – Extract Text from PDF to Plain Text | PottoTools',
    metaDesc: 'Extract text content from digital PDFs with original paragraph flow preserved. Clean, fast, and 100% in-browser.',
  },
  'text-diff-comparator': {
    title: 'Text Compare & Diff Tool – Compare Two Texts Side by Side | PottoTools',
    metaDesc: 'Compare two text documents side-by-side with color-coded diff highlighting additions, deletions, and modifications.',
  },
  'text-cleaner': {
    title: 'Smart Text Cleaner – Format, Trim & Clean Messy Text Online | PottoTools',
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
    title: 'Excel to PDF Converter – Convert XLSX Sheets to Clean PDF | PottoTools',
    metaDesc: 'Convert Microsoft Excel spreadsheets and tables into cleanly formatted PDF reports with customizable page fitting.',
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
  'crop-rotate-straighten': {
    title: 'Crop, Rotate & Straighten Images Online Free | PottoTools',
    metaDesc: 'Straighten tilted photos, crop to custom aspect ratios, and rotate images with precision degree adjustments in your browser.',
  },
};

export function buildToolPageHtml(templateHtml: string, tool: ToolDefinition): string {
  const seo = TOOL_SEO_MAP[tool.id] || {
    title: `${tool.title} – Free Online Document & Image Tools | PottoTools`,
    metaDesc: tool.fullDesc,
  };
  const canonicalUrl = `https://pottotools.in/${tool.slug}`;

  const categorySlug = tool.category === 'compress-pdf' ? 'pdf-tools' : tool.category;
  const graphItems: Record<string, unknown>[] = [
    {
      '@type': 'WebApplication',
      '@id': `${canonicalUrl}#software`,
      name: tool.title,
      url: canonicalUrl,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'All modern web browsers (Chrome, Edge, Safari, Firefox)',
      description: tool.fullDesc,
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
      '@id': `${canonicalUrl}#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
        { '@type': 'ListItem', position: 2, name: tool.categoryName, item: `https://pottotools.in/${categorySlug}` },
        { '@type': 'ListItem', position: 3, name: tool.title, item: canonicalUrl },
      ],
    },
    {
      '@type': 'HowTo',
      '@id': `${canonicalUrl}#howto`,
      name: `How to Use ${tool.title} Online for Free`,
      description: `Step-by-step instructions for using ${tool.title} on PottoTools.`,
      step: tool.instructions.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: `Step ${idx + 1}`,
        text: step,
      })),
    },
  ];

  if (tool.faqs && tool.faqs.length > 0) {
    graphItems.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: tool.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': graphItems,
  };

  const relatedSlugs = getRelatedToolSlugs(tool.id);
  const relatedTools = relatedSlugs
    .map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter((t): t is ToolDefinition => Boolean(t))
    .filter((t) => t.id !== tool.id)
    .slice(0, 4);
  const relatedGuides = BLOG_POSTS.filter((p) => p.relatedToolSlugs.includes(tool.slug));
  const hindiCounterpart = getHindiCounterpartForEnglishSlug(tool.slug);
  const profile = getToolTechnicalProfile(tool.slug);

  const rootContent = `
    <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <a href="/" style="font-weight: 800; font-size: 1.25rem; color: #0f172a; text-decoration: none;">Potto<span style="color: #0284c7;">Tools</span></a>
      <nav aria-label="Primary Navigation" style="display: flex; gap: 1rem; font-size: 0.875rem; flex-wrap: wrap;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a>
        <a href="/pdf-tools" style="color: #475569; text-decoration: none;">PDF Tools</a>
        <a href="/image-tools" style="color: #475569; text-decoration: none;">Image Tools</a>
        <a href="/word-tools" style="color: #475569; text-decoration: none;">Word Tools</a>
        <a href="/blog" style="color: #475569; text-decoration: none;">Guides</a>
        <a href="/directory" style="color: #475569; text-decoration: none;">All Tools</a>
        <a href="/about" style="color: #475569; text-decoration: none;">About</a>
        <a href="/contact" style="color: #475569; text-decoration: none;">Contact</a>
      </nav>
    </header>

    <main style="max-width: 1100px; margin: 2rem auto; padding: 0 1rem;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a> &rsaquo;
        <a href="/${tool.category === 'compress-pdf' ? 'pdf-tools' : tool.category}" style="color: #0284c7; text-decoration: none;">${tool.categoryName}</a> &rsaquo;
        <span>${tool.title}</span>
      </nav>

      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.25;">
        ${escapeHtml(tool.title)} – Free Online Tool
      </h1>
      <p style="font-size: 1.125rem; color: #475569; line-height: 1.6; margin-bottom: 1.5rem;">
        ${escapeHtml(tool.fullDesc)}
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.875rem;">
        <div><strong>Accepted Formats:</strong> ${escapeHtml(tool.acceptedFormats.join(', '))}</div>
        <div><strong>Output Format:</strong> ${escapeHtml(tool.outputFormat)}</div>
        <div><strong>Maximum File Size:</strong> ${tool.maxFileSizeMB} MB</div>
        <div><strong>Privacy Guarantee:</strong> 100% In-Browser (Zero Cloud Uploads)</div>
      </div>

      <div id="tool-workspace-placeholder" style="border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 16px; padding: 2rem 1.5rem; text-align: center; margin-bottom: 2.5rem;">
        <p style="font-size: 1.125rem; font-weight: 700; color: #1e40af; margin-bottom: 0.5rem;">
          ${escapeHtml(tool.title)} Workspace (${escapeHtml(tool.outputFormat)})
        </p>
        <p style="font-size: 0.875rem; color: #1d4ed8;">
          Drop ${escapeHtml(tool.acceptedFormats.join(', '))} files (up to ${tool.maxFileSizeMB} MB) inside the interactive browser workspace${profile.settingsAndOptions[0] ? ` &mdash; includes ${escapeHtml(profile.settingsAndOptions[0].toLowerCase())}` : ''}.
        </p>
      </div>

      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">
          Available Settings &amp; Configuration Options
        </h2>
        <ul style="padding-left: 1.5rem; line-height: 1.8; color: #334155;">
          ${profile.settingsAndOptions.map((opt) => `<li>${escapeHtml(opt)}</li>`).join('\n          ')}
        </ul>
      </section>

      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">
          How to Use ${escapeHtml(tool.title)} Online for Free
        </h2>
        <ol style="padding-left: 1.5rem; line-height: 1.8; color: #334155;">
          ${tool.instructions.map((step) => `<li>${escapeHtml(step)}</li>`).join('\n          ')}
        </ol>
      </section>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
            Explanation of the Output
          </h2>
          <p style="font-size: 0.925rem; color: #475569; line-height: 1.6;">
            ${escapeHtml(profile.outputExplanation)}
          </p>
        </section>

        <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
            Format Scope &amp; Local Workflow
          </h2>
          <p style="font-size: 0.925rem; color: #475569; line-height: 1.6; margin-bottom: 0.75rem;">
            ${escapeHtml(tool.title)} converts or processes ${escapeHtml(tool.acceptedFormats.join(', '))} inputs up to ${tool.maxFileSizeMB} MB directly inside browser memory, generating ${escapeHtml(tool.outputFormat)} output without uploading files to external servers.
          </p>
          <p style="font-size: 0.875rem; color: #475569; line-height: 1.6;">
            Browse more utilities inside <a href="/${categorySlug}" style="color: #0284c7; font-weight: 600; text-decoration: none;">${escapeHtml(tool.categoryName)}</a>${
              relatedGuides[0]
                ? ` or read our walkthrough: <a href="/blog/${relatedGuides[0].slug}" style="color: #0284c7; font-weight: 600; text-decoration: none;">${escapeHtml(relatedGuides[0].title)}</a>.`
                : ` or read step-by-step tutorials in <a href="/blog" style="color: #0284c7; font-weight: 600; text-decoration: none;">PottoTools Guides</a>.`
            }
          </p>
        </section>

        ${
          profile.limitations && profile.limitations.length > 0
            ? `
        <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
            Technical Considerations &amp; Limitations
          </h2>
          <ul style="padding-left: 1.25rem; line-height: 1.6; color: #475569; font-size: 0.875rem;">
            ${profile.limitations.map((lim) => `<li>${escapeHtml(lim)}</li>`).join('\n            ')}
          </ul>
        </section>
        `
            : ''
        }
      </div>

      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">
          Troubleshooting Common Processing Issues
        </h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${profile.troubleshooting
            .map(
              (t) => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.25rem;">
              <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem;">Issue: ${escapeHtml(t.issue)}</h3>
              <p style="font-size: 0.875rem; color: #475569; line-height: 1.5;"><strong>Solution:</strong> ${escapeHtml(t.solution)}</p>
            </div>
          `
            )
            .join('\n')}
        </div>
      </section>

      ${
        tool.faqs && tool.faqs.length > 0
          ? `
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 1.5rem;">
          Frequently Asked Questions About ${escapeHtml(tool.title)}
        </h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${tool.faqs
            .map(
              (faq) => `
            <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">${escapeHtml(faq.question)}</h3>
              <p style="font-size: 0.925rem; color: #475569; line-height: 1.6;">${escapeHtml(faq.answer)}</p>
            </div>
          `
            )
            .join('\n')}
        </div>
      </section>
      `
          : ''
      }

      ${
        relatedTools.length > 0
          ? `
      <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">
          Related Free Document Utilities
        </h2>
        <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem; list-style: none; padding: 0;">
          ${relatedTools
            .map(
              (rel) => `
            <li>
              <a href="/${rel.slug}" style="color: #0284c7; font-weight: 600; text-decoration: none;">
                &bull; ${rel.title} (${rel.outputFormat})
              </a>
            </li>
          `
            )
            .join('\n')}
        </ul>
      </section>
      `
          : ''
      }

      ${
        relatedGuides.length > 0 || hindiCounterpart
          ? `
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
          Practical Guides &amp; Language Editions
        </h2>
        <ul style="line-height: 1.8; padding-left: 1.25rem; color: #334155;">
          ${relatedGuides
            .map(
              (g) =>
                `<li><a href="/blog/${g.slug}" style="color: #0284c7; font-weight: 600; text-decoration: none;">${g.title}</a></li>`
            )
            .join('\n')}
          ${
            hindiCounterpart
              ? `<li><a href="/${hindiCounterpart.slug}" style="color: #059669; font-weight: 700; text-decoration: none;">हिंदी संस्करण (Hindi Guide): ${hindiCounterpart.h1}</a></li>`
              : ''
          }
        </ul>
      </section>
      `
          : ''
      }
    </main>

    <footer style="margin-top: 4rem; padding: 2rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #475569; text-align: center; max-width: 1200px; margin-left: auto; margin-right: auto;">
      <p style="margin-bottom: 0.75rem;">
        <strong>Support &amp; Feedback:</strong>
        Email: <a href="mailto:sharma.amit1091@gmail.com" style="color: #0284c7; font-weight: 600;">sharma.amit1091@gmail.com</a>
      </p>
      <p style="margin-bottom: 0.75rem;">
        <strong>Official Pages &amp; Legal:</strong>
        <a href="/blog" style="color: #475569; margin: 0 0.5rem;">Guides &amp; Blog</a> |
        <a href="/hi" style="color: #475569; margin: 0 0.5rem;">PottoTools हिंदी</a> |
        <a href="/about" style="color: #475569; margin: 0 0.5rem;">About PottoTools</a> |
        <a href="/contact" style="color: #475569; margin: 0 0.5rem;">Contact Us</a> |
        <a href="/privacy" style="color: #475569; margin: 0 0.5rem;">Privacy Policy</a> |
        <a href="/terms" style="color: #475569; margin: 0 0.5rem;">Terms of Service</a> |
        <a href="/disclaimer" style="color: #475569; margin: 0 0.5rem;">Disclaimer</a> |
        <a href="/cookie-policy" style="color: #475569; margin: 0 0.5rem;">Cookie Policy</a> |
        <a href="/directory" style="color: #475569; margin: 0 0.5rem;">Tools Directory</a>
      </p>
      <p style="font-size: 0.75rem; color: #94a3b8;">
        &copy; 2026 PottoTools.in &bull; Client-Side In-Browser Processing &bull; No Server Uploads
      </p>
    </footer>
  `;

  let html = applyHeadMetadata(templateHtml, seo.title, seo.metaDesc, canonicalUrl, {
    hiUrl: hindiCounterpart ? `https://pottotools.in/${hindiCounterpart.slug}` : undefined,
  });
  html = replacePageJsonLd(html, jsonLd);

  // Replace <div id="root">...</div> content across both dev and production script layouts
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*(?:<script[\s\S]*?<\/script>\s*)*<\/body>)/,
    `<div id="root">${rootContent}</div>$1`
  );

  return html;
}

function replacePageJsonLd(html: string, jsonLd: unknown): string {
  const scriptTag = `<script type="application/ld+json">\n    ${JSON.stringify(jsonLd, null, 2)}\n    </script>`;
  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, scriptTag);
  }
  return html.replace('</head>', `\n    ${scriptTag}\n  </head>`);
}

function applyHeadMetadata(
  templateHtml: string,
  title: string,
  metaDesc: string,
  canonicalUrl: string,
  options?: { lang?: 'en' | 'hi'; enUrl?: string; hiUrl?: string }
): string {
  const escapedDesc = metaDesc.replace(/"/g, '&quot;');
  const lang = options?.lang || 'en';
  const enUrl = options?.enUrl || canonicalUrl;

  let html = templateHtml;
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapedDesc}" />`);
  html = html.replace(
    /<link rel="canonical" id="canonical-url" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" id="canonical-url" href="${canonicalUrl}" />`
  );
  html = html.replace(
    /<link rel="alternate" href="[^"]*" hreflang="x-default"\s*\/?>/,
    `<link rel="alternate" href="${enUrl}" hreflang="x-default" />`
  );
  html = html.replace(
    /<link rel="alternate" href="[^"]*" hreflang="en"\s*\/?>/,
    `<link rel="alternate" href="${enUrl}" hreflang="en" />`
  );
  // Remove any template hreflang="hi" and re-add strictly when a genuine Hindi pair exists
  html = html.replace(/\s*<link rel="alternate" href="[^"]*" hreflang="hi"\s*\/?>/g, '');
  if (options?.hiUrl) {
    html = html.replace(
      `<link rel="alternate" href="${enUrl}" hreflang="en" />`,
      `<link rel="alternate" href="${enUrl}" hreflang="en" />\n    <link rel="alternate" href="${options.hiUrl}" hreflang="hi" />`
    );
  }
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapedDesc}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapedDesc}" />`);
  return html;
}

const CATEGORY_FILTERS: Record<string, (t: ToolDefinition) => boolean> = {
  'pdf-tools': (t) =>
    t.category === 'organize-pdf' || t.category === 'compress-pdf' || t.category === 'pdf-security' || t.id.includes('pdf'),
  'image-tools': (t) =>
    t.id === 'custom-photo-studio' ||
    t.id === 'custom-photo-resizer' ||
    t.id === 'photo-size-compressor' ||
    t.id === 'photo-signature-resizer' ||
    t.id === 'passport-photo-cropper' ||
    t.id === 'photo-editor' ||
    t.id === 'hd-image-enhancer' ||
    t.id === 'photo-background-changer' ||
    t.id === 'crop-rotate-straighten',
  'convert-docs': (t) =>
    t.category === 'convert-docs' ||
    t.category === 'ocr-scanned' ||
    t.category === 'spreadsheets' ||
    t.id.includes('word') ||
    t.id.includes('excel') ||
    t.id.includes('powerpoint') ||
    t.id.includes('docx') ||
    t.id.includes('xlsx') ||
    t.id.includes('pptx') ||
    t.id.includes('ocr'),
  'word-tools': (t) =>
    t.id === 'word-to-pdf' ||
    t.id === 'pdf-to-word' ||
    t.id === 'pdf-to-editable-word' ||
    t.id === 'docx-to-txt' ||
    t.id === 'docx-to-html' ||
    t.id === 'markdown-to-pdf',
  'excel-tools': (t) =>
    t.id === 'excel-to-pdf' ||
    t.id === 'pdf-to-excel' ||
    t.id === 'csv-to-xlsx' ||
    t.id === 'xlsx-to-csv' ||
    t.id === 'sheet-viewer',
  'powerpoint-tools': (t) => t.id === 'powerpoint-to-pdf',
  'other-document-tools': (t) =>
    t.category === 'smart-utilities' || t.category === 'ocr-scanned' || t.id === 'pdf-id-redactor',
  'organize-pdf': (t) => t.category === 'organize-pdf' || t.id === 'pdf-page-organizer',
  'convert-images': (t) =>
    t.id === 'image-converter' ||
    t.id === 'image-format-converter' ||
    t.id === 'jpg-to-png' ||
    t.id === 'png-to-jpg' ||
    t.id === 'image-to-pdf' ||
    t.id === 'pdf-to-images' ||
    t.id === 'combine-app-documents',
  'ocr-scanned': (t) => t.category === 'ocr-scanned' || t.id === 'searchable-pdf-text-finder' || t.id === 'pdf-to-editable-word',
  'pdf-security': (t) => t.category === 'pdf-security',
  'smart-utilities': (t) => t.category === 'smart-utilities',
  'spreadsheets': (t) => t.id === 'sheet-viewer' || t.id === 'csv-to-xlsx' || t.id === 'xlsx-to-csv' || t.id === 'excel-to-pdf' || t.id === 'pdf-to-excel',
};

export const CATEGORY_PAGES_DATA = CATEGORY_GUIDANCE_LIST.map((g) => ({
  slug: g.slug,
  title: g.metaTitle,
  metaDesc: g.metaDesc,
  h1: g.h1,
  description: g.description,
  filter: CATEGORY_FILTERS[g.slug] || ((t: ToolDefinition) => t.category === g.slug),
  faqs: g.faqs,
}));

export function buildCategoryPageHtml(templateHtml: string, categoryData: (typeof CATEGORY_PAGES_DATA)[0]): string {
  const canonicalUrl = `https://pottotools.in/${categoryData.slug}`;
  const matchedTools = TOOLS.filter(categoryData.filter);
  const guidance = CATEGORY_GUIDANCE_MAP[categoryData.slug];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        name: categoryData.h1,
        url: canonicalUrl,
        description: categoryData.metaDesc,
        hasPart: matchedTools.map((t) => ({
          '@type': 'WebApplication',
          name: t.title,
          url: `https://pottotools.in/${t.slug}`,
          applicationCategory: 'ProductivityApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
          { '@type': 'ListItem', position: 2, name: categoryData.h1, item: canonicalUrl },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: categoryData.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  const rootContent = `
    <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <a href="/" style="font-weight: 800; font-size: 1.25rem; color: #0f172a; text-decoration: none;">Potto<span style="color: #0284c7;">Tools</span></a>
      <nav aria-label="Primary Navigation" style="display: flex; gap: 1rem; font-size: 0.875rem; flex-wrap: wrap;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a>
        <a href="/pdf-tools" style="color: #475569; text-decoration: none;">PDF Tools</a>
        <a href="/image-tools" style="color: #475569; text-decoration: none;">Image Tools</a>
        <a href="/convert-docs" style="color: #475569; text-decoration: none;">Document Conversion</a>
        <a href="/blog" style="color: #475569; text-decoration: none;">Guides</a>
        <a href="/directory" style="color: #475569; text-decoration: none;">All Tools</a>
        <a href="/about" style="color: #475569; text-decoration: none;">About</a>
        <a href="/contact" style="color: #475569; text-decoration: none;">Contact</a>
      </nav>
    </header>

    <main style="max-width: 1100px; margin: 2rem auto; padding: 0 1rem;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a> &rsaquo;
        <span>${categoryData.h1}</span>
      </nav>

      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.25;">
        ${categoryData.h1}
      </h1>
      <p style="font-size: 1.125rem; color: #475569; line-height: 1.6; margin-bottom: 2rem;">
        ${categoryData.description}
      </p>

      <section style="margin-bottom: 3rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem;">
          Available Tools in this Category (${matchedTools.length} Utilities)
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
          ${matchedTools
            .map(
              (t) => `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">
                  <a href="/${t.slug}" style="color: #0284c7; text-decoration: none;">${t.title}</a>
                </h3>
                <p style="font-size: 0.875rem; color: #475569; line-height: 1.5; margin-bottom: 1rem;">
                  ${t.fullDesc}
                </p>
                <div style="font-size: 0.75rem; color: #64748b;">
                  <span>Accepted: ${t.acceptedFormats.join(', ')}</span> &bull; <span>Output: ${t.outputFormat}</span>
                </div>
              </div>
              <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9;">
                <a href="/${t.slug}" style="display: inline-block; padding: 0.5rem 1rem; background: #0284c7; color: white; border-radius: 6px; font-size: 0.8rem; font-weight: 600; text-decoration: none;">
                  Use Tool Free &rarr;
                </a>
              </div>
            </div>
          `
            )
            .join('\n')}
        </div>
      </section>

      ${
        guidance
          ? `
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
          ${escapeHtml(guidance.workflowTitle)}
        </h2>
        <p style="font-size: 0.95rem; color: #475569; line-height: 1.6; margin-bottom: 1rem;">
          ${escapeHtml(guidance.workflowSummary)}
        </p>
        <ul style="padding-left: 1.5rem; line-height: 1.75; color: #334155; font-size: 0.9rem;">
          ${guidance.workflowBullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('\n          ')}
        </ul>
      </section>
      `
          : ''
      }

      <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; margin-bottom: 2.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
          Frequently Asked Questions
        </h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${categoryData.faqs
            .map(
              (f) => `
            <div>
              <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem;">${escapeHtml(f.q)}</h3>
              <p style="font-size: 0.875rem; color: #475569; line-height: 1.5;">${escapeHtml(f.a)}</p>
            </div>
          `
            )
            .join('\n')}
        </div>
      </section>
    </main>

    <footer style="margin-top: 4rem; padding: 2rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #475569; text-align: center; max-width: 1200px; margin-left: auto; margin-right: auto;">
      <p style="margin-bottom: 0.75rem;">
        <strong>Support &amp; Feedback:</strong>
        Email: <a href="mailto:sharma.amit1091@gmail.com" style="color: #0284c7; font-weight: 600;">sharma.amit1091@gmail.com</a>
      </p>
      <p style="margin-bottom: 0.75rem;">
        <a href="/about" style="color: #475569; margin: 0 0.5rem;">About</a> |
        <a href="/contact" style="color: #475569; margin: 0 0.5rem;">Contact</a> |
        <a href="/privacy" style="color: #475569; margin: 0 0.5rem;">Privacy Policy</a> |
        <a href="/terms" style="color: #475569; margin: 0 0.5rem;">Terms of Service</a> |
        <a href="/directory" style="color: #475569; margin: 0 0.5rem;">All Tools</a>
      </p>
      <p style="font-size: 0.75rem; color: #94a3b8;">
        &copy; 2026 PottoTools.in &bull; 100% Free Client-Side In-Browser Processing
      </p>
    </footer>
  `;

  let html = applyHeadMetadata(templateHtml, categoryData.title, categoryData.metaDesc, canonicalUrl);
  html = replacePageJsonLd(html, jsonLd);

  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*(?:<script[\s\S]*?<\/script>\s*)*<\/body>)/,
    `<div id="root">${rootContent}</div>$1`
  );

  return html;
}

export const INFORMATIONAL_PAGES_DATA = [
  {
    slug: 'about',
    title: 'About PottoTools – Free Client-Side Document Utilities',
    metaDesc:
      'Learn about PottoTools, our mission to provide completely free, private, client-side document and image processing tools without server uploads.',
    h1: 'About PottoTools: Private, Free & Client-Side Utility Platform',
    content: `
      <h2>Our Mission: Simple, Private &amp; Accessible Document Tools</h2>
      <p>PottoTools is an independent platform built in India to help students, job applicants, office teams, and everyday users handle everyday PDF, Word, Excel, OCR, and photograph tasks directly inside the web browser—without forced subscriptions, email capture, or cloud server uploads.</p>
      <h2>Who PottoTools Serves &amp; Editorial Standards</h2>
      <p>Visitors commonly arrive on PottoTools when solving concrete portal rules—compressing multi-page application PDFs under 100 KB or 200 KB, converting centimeter/millimeter passport specifications into pixels at 200 or 300 DPI, running bilingual OCR on scanned circulars, or permanently masking sensitive Aadhaar and bank numbers before emailing documents.</p>
      <p>Alongside our utilities, our editorial team maintains practical how-to guides in the <a href="/blog" style="color: #0284c7; font-weight: 600; text-decoration: none;">PottoTools Practical Guides &amp; Blog</a> section covering file-format trade-offs, formulas, and documented limitations. PottoTools is sustained by standard display advertising rather than paywalls.</p>
      <h2>Zero-Server Upload &amp; Offline PWA Architecture</h2>
      <p>Unlike converter sites that upload tax forms, contracts, and identity scans to remote servers, PottoTools executes file operations locally inside your browser memory using open web standards, and works offline once cached as an installable Progressive Web App (PWA).</p>
      <h2>Explore Core Categories</h2>
      <ul style="padding-left: 1.5rem; margin-top: 0.75rem;">
        <li><a href="/pdf-tools" style="color: #0284c7; font-weight: 600; text-decoration: none;">PDF Tools Suite</a> — Compress PDF, Merge PDF, Split PDF, PDF Page Organizer, and PDF &amp; ID Redactor.</li>
        <li><a href="/image-tools" style="color: #0284c7; font-weight: 600; text-decoration: none;">Image Tools &amp; Photo Studio</a> — Custom Photo Studio (px, cm, mm, in), Exam Photo &amp; Signature Resizer, Passport Cropper, and format converters.</li>
        <li><a href="/convert-docs" style="color: #0284c7; font-weight: 600; text-decoration: none;">Document Conversion &amp; OCR</a> — Word to PDF, PDF to Editable Word, PowerPoint to PDF, and bilingual English/Hindi OCR.</li>
        <li><a href="/excel-tools" style="color: #0284c7; font-weight: 600; text-decoration: none;">Excel &amp; Spreadsheet Tools</a> — CSV to XLSX, XLSX to CSV, Excel to PDF, and PDF Table Extractor.</li>
        <li><a href="/blog" style="color: #0284c7; font-weight: 600; text-decoration: none;">Practical Guides &amp; Blog</a> — Step-by-step formatting tutorials and reference tables.</li>
      </ul>
    `,
  },
  {
    slug: 'contact',
    title: 'Contact Support & Feedback | PottoTools',
    metaDesc: 'Have questions, feedback, or a tool suggestion? Contact the PottoTools engineering team at sharma.amit1091@gmail.com.',
    h1: 'Contact PottoTools Support & Engineering Team',
    content: `
      <h2>Get in Touch With Us</h2>
      <p>We welcome bug reports, feature requests, browser compatibility feedback, and suggestions for new PDF, office, or photo utilities. Every message is reviewed directly by our engineering team, and we aim to respond within 24 business hours.</p>
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
        <p><strong>Official Support Email:</strong> <a href="mailto:sharma.amit1091@gmail.com" style="color: #0284c7; font-weight: 700;">sharma.amit1091@gmail.com</a></p>
        <p style="margin-top: 0.5rem;"><strong>Support Availability:</strong> Monday – Friday, 9:00 AM – 6:00 PM IST</p>
        <p style="margin-top: 0.5rem;"><strong>Operations:</strong> PottoTools Online Technologies, India &bull; Serving users worldwide</p>
      </div>
      <h2>How to Help Us Resolve Your Issue Quickly</h2>
      <p>If you are reporting an unexpected conversion or layout issue with a specific utility, please avoid emailing confidential personal files—instead, let us know:</p>
      <ul style="padding-left: 1.5rem; margin-top: 0.5rem;">
        <li>The exact PottoTools page URL you used (for example, <a href="/compress-pdf" style="color: #0284c7;">Compress PDF</a> or <a href="/custom-photo-studio" style="color: #0284c7;">Custom Photo Studio</a>).</li>
        <li>Your browser name and operating system (e.g., Chrome on Android, Safari on macOS, Edge on Windows).</li>
        <li>The file type, approximate file size, and any on-screen error message you observed.</li>
      </ul>
      <h2>Helpful Quick Links</h2>
      <p>Looking for answers before reaching out? Review our <a href="/privacy" style="color: #0284c7; font-weight: 600;">Zero-Upload Privacy Policy</a>, <a href="/about" style="color: #0284c7; font-weight: 600;">Platform Architecture</a>, or browse all tools in the <a href="/directory" style="color: #0284c7; font-weight: 600;">Tools Directory</a>.</p>
    `,
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy – 100% In-Browser Document Processing | PottoTools',
    metaDesc:
      'Our zero-server-upload privacy guarantee. Learn how PottoTools processes all files locally inside your browser using WebAssembly and memory streams.',
    h1: 'PottoTools Privacy Policy: Zero-Upload Guarantee',
    content: `
      <h2>1. The Zero-Upload Document Guarantee</h2>
      <p>PottoTools is engineered from the ground up so that your files never leave your device. Unlike cloud file converters that transmit PDFs, Word documents, spreadsheets, and photographs to remote data centers, PottoTools does not upload, copy, inspect, log, or store any user files on any backend server.</p>
      <h2>2. Ephemeral Local Browser Memory</h2>
      <p>When you drop or select a document inside tools such as <a href="/pdf-id-redactor" style="color: #0284c7;">Offline PDF &amp; ID Redactor</a>, <a href="/compress-pdf" style="color: #0284c7;">Compress PDF</a>, or <a href="/custom-photo-studio" style="color: #0284c7;">Custom Photo Studio</a>, it is read exclusively into temporary browser RAM via local HTML5 FileReader and WebAssembly APIs. Closing or refreshing the browser tab immediately clears those memory buffers.</p>
      <h2>3. Essential Preferences &amp; Analytics</h2>
      <p>We store minimal non-personal preferences in your browser's local storage (such as your Dark/Light theme selection and recently opened tool shortcuts). Aggregate site analytics help us understand which utilities users value most without ever inspecting file names or document contents.</p>
      <h2>4. Third-Party Advertising Partners</h2>
      <p>To keep all ${TOOLS.length} tools 100% free with zero paywalls, PottoTools displays advertisements served by third-party networks such as Google AdSense. These partners may set cookies or use standard web beacons to display relevant ads subject to their respective privacy disclosures and your browser consent preferences. For further cookie details, review our <a href="/cookie-policy" style="color: #0284c7;">Cookie Policy</a> or email <a href="mailto:sharma.amit1091@gmail.com" style="color: #0284c7;">sharma.amit1091@gmail.com</a>.</p>
    `,
  },
  {
    slug: 'terms',
    title: 'Terms of Service | PottoTools',
    metaDesc: 'Terms of service and fair use conditions for PottoTools free document and image processing tools.',
    h1: 'PottoTools Terms of Service',
    content: `
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using PottoTools (https://pottotools.in) and its suite of free browser-based document, spreadsheet, PDF, and image utilities, you agree to comply with these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the website.</p>
      <h2>2. License &amp; Permitted Use</h2>
      <p>All tools on PottoTools—including <a href="/pdf-tools" style="color: #0284c7;">PDF Tools</a>, <a href="/word-tools" style="color: #0284c7;">Word Tools</a>, <a href="/excel-tools" style="color: #0284c7;">Excel Tools</a>, and <a href="/image-tools" style="color: #0284c7;">Image Tools</a>—are provided free of charge for personal, academic, and lawful commercial document workflows. You retain 100% ownership and copyright over every file you process on your device.</p>
      <h2>3. Prohibited Conduct</h2>
      <p>You agree not to use automated scraping bots to overload static site hosting, attempt to inject malicious scripts, distribute copyrighted software components outside open-source license permissions, or use the utilities for unlawful forgery or fraud.</p>
      <h2>4. Service Availability &amp; Warranty Disclaimer</h2>
      <p>All client-side utilities are provided on an "as is" and "as available" basis without warranties of uninterrupted availability or suitability for a particular legal purpose. Always keep backups of irreplaceable source documents and review converted outputs prior to submission. Questions regarding these terms may be sent via our <a href="/contact" style="color: #0284c7;">Contact page</a>.</p>
    `,
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer & Compliance Information | PottoTools',
    metaDesc: 'Legal disclaimer, security certifications, and compliance details regarding PottoTools document utilities.',
    h1: 'Disclaimer & Compliance Information',
    content: `
      <h2>1. Output Verification &amp; Accuracy</h2>
      <p>PottoTools relies on established open-source processing engines including pdf-lib, PDF.js, Tesseract.js, Mammoth.js, and SheetJS running locally inside your browser. Because source PDFs, legacy office files, and smartphone scans vary widely in encoding, resolution, and font embedding, users should visually verify every output file before submitting it to official portals, courts, banks, or examination boards.</p>
      <h2>2. Exam &amp; Government Form Presets</h2>
      <p>Preset dimensions and KB targets offered inside <a href="/photo-signature-resizer" style="color: #0284c7;">Exam Photo &amp; Signature Resizer</a> and <a href="/passport-photo-cropper" style="color: #0284c7;">Passport Photo Cropper</a> are provided strictly for convenience based on published historical guidelines. Recruitment boards and embassies update specifications periodically—always confirm pixel width, height, background color, and file size ceilings in your current official notification.</p>
      <h2>3. Independent Platform Notice</h2>
      <p>PottoTools is an independent web utility platform and is not affiliated with, endorsed by, or sponsored by Adobe Inc., Microsoft Corporation, Google LLC, or any government testing agency (such as UPSC, SSC, IBPS, NTA, or passport authorities). Please also review our <a href="/privacy" style="color: #0284c7;">Privacy Policy</a> and <a href="/terms" style="color: #0284c7;">Terms of Service</a>.</p>
    `,
  },
  {
    slug: 'cookie-policy',
    title: 'Cookie Policy – Cookie & Tracking Practices | PottoTools',
    metaDesc: 'Learn how PottoTools uses essential local storage, analytics, and advertising cookies, and how you can manage or opt out of cookies.',
    h1: 'PottoTools Cookie Policy',
    content: `
      <h2>1. What Are Cookies &amp; Browser Local Storage?</h2>
      <p>Cookies are small text files saved by your web browser when you visit websites, while Local Storage allows web applications to preserve interface preferences directly on your device without transmitting them in every HTTP request.</p>
      <h2>2. How PottoTools Uses Essential Storage</h2>
      <p>PottoTools does not require user accounts or login sessions, so we never set authentication tracking cookies. We use lightweight browser Local Storage solely for functional conveniences: remembering your chosen Light/Dark appearance theme, caching recently used utilities for quick access, and storing offline Service Worker application assets so tools run smoothly without internet.</p>
      <h2>3. Analytics &amp; Advertising Cookies</h2>
      <p>To support free public access across all tools in our <a href="/directory" style="color: #0284c7;">Tools Directory</a>, third-party advertising providers such as Google AdSense and aggregated traffic measurement tags may place standard cookies to measure page reach, prevent ad fraud, and serve relevant ads.</p>
      <h2>4. Managing or Disabling Cookies</h2>
      <p>You can clear, block, or restrict cookies anytime through your browser privacy settings (Chrome, Firefox, Edge, Safari) or adjust ad personalization preferences via Google Ad Settings. Blocking third-party advertising cookies will not prevent any PottoTools PDF, image, or office converter from working locally on your device. Read our <a href="/privacy" style="color: #0284c7;">Privacy Policy</a> or <a href="/contact" style="color: #0284c7;">contact us</a> for questions.</p>
    `,
  },
  {
    slug: 'directory',
    title: `All ${TOOLS.length} Free Tools Directory | PottoTools`,
    metaDesc: `Browse all ${TOOLS.length} free document, PDF, Word, Excel, image, OCR, and text tools available on PottoTools.`,
    h1: `All Tools Directory: ${TOOLS.length} Free Online Tools`,
    content: `
      <p style="margin-bottom: 1.5rem;">Explore all ${TOOLS.length} free, private PDF, photo, and document tools that work right in your browser:</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        ${TOOLS.map(
          (t) => `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem;">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">
              <a href="/${t.slug}" style="color: #0284c7; text-decoration: none;">${t.title}</a>
            </h3>
            <p style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">${t.fullDesc}</p>
          </div>
        `
        ).join('\n')}
      </div>
    `,
  },
];

export function buildInformationalPageHtml(templateHtml: string, pageData: (typeof INFORMATIONAL_PAGES_DATA)[0]): string {
  const canonicalUrl = `https://pottotools.in/${pageData.slug}`;
  const pageType =
    pageData.slug === 'about'
      ? 'AboutPage'
      : pageData.slug === 'contact'
      ? 'ContactPage'
      : pageData.slug === 'directory'
      ? 'CollectionPage'
      : 'WebPage';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': pageType,
        '@id': `${canonicalUrl}#webpage`,
        name: pageData.h1,
        url: canonicalUrl,
        description: pageData.metaDesc,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
          { '@type': 'ListItem', position: 2, name: pageData.h1, item: canonicalUrl },
        ],
      },
    ],
  };

  const rootContent = `
    <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <a href="/" style="font-weight: 800; font-size: 1.25rem; color: #0f172a; text-decoration: none;">Potto<span style="color: #0284c7;">Tools</span></a>
      <nav aria-label="Primary Navigation" style="display: flex; gap: 1rem; font-size: 0.875rem; flex-wrap: wrap;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a>
        <a href="/pdf-tools" style="color: #475569; text-decoration: none;">PDF Tools</a>
        <a href="/image-tools" style="color: #475569; text-decoration: none;">Image Tools</a>
        <a href="/convert-docs" style="color: #475569; text-decoration: none;">Document Conversion</a>
        <a href="/blog" style="color: #475569; text-decoration: none;">Guides</a>
        <a href="/directory" style="color: #475569; text-decoration: none;">All Tools</a>
        <a href="/about" style="color: #475569; text-decoration: none;">About</a>
        <a href="/contact" style="color: #475569; text-decoration: none;">Contact</a>
      </nav>
    </header>

    <main style="max-width: 900px; margin: 2.5rem auto; padding: 0 1rem;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a> &rsaquo;
        <span>${pageData.h1}</span>
      </nav>

      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem; line-height: 1.25;">
        ${pageData.h1}
      </h1>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; line-height: 1.7; color: #334155; font-size: 1rem;">
        ${pageData.content}
      </div>
    </main>

    <footer style="margin-top: 4rem; padding: 2rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #475569; text-align: center; max-width: 1200px; margin-left: auto; margin-right: auto;">
      <p style="margin-bottom: 0.75rem;">
        <strong>Support &amp; Feedback:</strong>
        Email: <a href="mailto:sharma.amit1091@gmail.com" style="color: #0284c7; font-weight: 600;">sharma.amit1091@gmail.com</a>
      </p>
      <p style="margin-bottom: 0.75rem;">
        <a href="/about" style="color: #475569; margin: 0 0.5rem;">About</a> |
        <a href="/contact" style="color: #475569; margin: 0 0.5rem;">Contact</a> |
        <a href="/privacy" style="color: #475569; margin: 0 0.5rem;">Privacy Policy</a> |
        <a href="/terms" style="color: #475569; margin: 0 0.5rem;">Terms of Service</a> |
        <a href="/disclaimer" style="color: #475569; margin: 0 0.5rem;">Disclaimer</a> |
        <a href="/cookie-policy" style="color: #475569; margin: 0 0.5rem;">Cookie Policy</a> |
        <a href="/directory" style="color: #475569; margin: 0 0.5rem;">All Tools</a>
      </p>
      <p style="font-size: 0.75rem; color: #94a3b8;">
        &copy; 2026 PottoTools.in &bull; 100% Free Client-Side In-Browser Processing
      </p>
    </footer>
  `;

  let html = applyHeadMetadata(templateHtml, pageData.title, pageData.metaDesc, canonicalUrl);
  html = replacePageJsonLd(html, jsonLd);

  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*(?:<script[\s\S]*?<\/script>\s*)*<\/body>)/,
    `<div id="root">${rootContent}</div>$1`
  );

  return html;
}

export function buildBlogIndexHtml(templateHtml: string): string {
  const canonicalUrl = 'https://pottotools.in/blog';
  const title = 'Document, PDF & Image Guides Blog | PottoTools';
  const metaDesc =
    'Practical tutorials explaining how to compress PDFs to 100KB, rotate PDF pages, convert scans with OCR, resize exam photos, and redact IDs privately.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${canonicalUrl}#blog`,
        name: 'PottoTools Guides & Blog',
        url: canonicalUrl,
        description: metaDesc,
        publisher: { '@id': 'https://pottotools.in/#organization' },
        isPartOf: { '@id': 'https://pottotools.in/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
          { '@type': 'ListItem', position: 2, name: 'Guides & Blog', item: canonicalUrl },
        ],
      },
    ],
  };

  const rootContent = `
    <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <a href="/" style="font-weight: 800; font-size: 1.25rem; color: #0f172a; text-decoration: none;">Potto<span style="color: #0284c7;">Tools</span></a>
      <nav aria-label="Primary Navigation" style="display: flex; gap: 1rem; font-size: 0.875rem; flex-wrap: wrap;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a>
        <a href="/pdf-tools" style="color: #475569; text-decoration: none;">PDF Tools</a>
        <a href="/image-tools" style="color: #475569; text-decoration: none;">Image Tools</a>
        <a href="/blog" style="color: #0284c7; font-weight: 700; text-decoration: none;">Guides</a>
        <a href="/hi" style="color: #475569; text-decoration: none;">हिंदी</a>
        <a href="/directory" style="color: #475569; text-decoration: none;">All Tools</a>
      </nav>
    </header>
    <main style="max-width: 1000px; margin: 2rem auto; padding: 0 1rem;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a> &rsaquo;
        <span>Guides &amp; Blog</span>
      </nav>
      <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem;">
        Document, PDF &amp; Image Guides
      </h1>
      <p style="font-size: 1.05rem; color: #475569; line-height: 1.6; margin-bottom: 2rem;">
        Step-by-step tutorials explaining how PDF compression, page rotation, scanned OCR conversion, exact KB photo sizing, and offline ID redaction work locally inside your browser.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
        ${BLOG_POSTS.map(
          (post) => `
          <article style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 0.5rem;">${post.category} &bull; ${post.readTime}</div>
            <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">
              <a href="/blog/${post.slug}" style="color: #0f172a; text-decoration: none;">${post.title}</a>
            </h2>
            <p style="font-size: 0.875rem; color: #475569; line-height: 1.5; margin-bottom: 0.75rem;">${post.excerpt}</p>
            <a href="/blog/${post.slug}" style="font-size: 0.85rem; font-weight: 600; color: #0284c7; text-decoration: none;">Read Full Guide &rarr;</a>
          </article>
        `
        ).join('\n')}
      </div>
    </main>
    <footer style="margin-top: 4rem; padding: 2rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #475569; text-align: center; max-width: 1200px; margin-left: auto; margin-right: auto;">
      <p><a href="/about" style="color: #475569; margin: 0 0.5rem;">About</a> | <a href="/contact" style="color: #475569; margin: 0 0.5rem;">Contact</a> | <a href="/privacy" style="color: #475569; margin: 0 0.5rem;">Privacy Policy</a> | <a href="/directory" style="color: #475569; margin: 0 0.5rem;">All Tools</a> | <a href="/hi" style="color: #475569; margin: 0 0.5rem;">PottoTools हिंदी</a></p>
      <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">&copy; 2026 PottoTools.in</p>
    </footer>
  `;

  let html = applyHeadMetadata(templateHtml, title, metaDesc, canonicalUrl);
  html = replacePageJsonLd(html, jsonLd);
  return html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*(?:<script[\s\S]*?<\/script>\s*)*<\/body>)/,
    `<div id="root">${rootContent}</div>$1`
  );
}

export function buildBlogPostHtml(templateHtml: string, post: BlogPost): string {
  const canonicalUrl = `https://pottotools.in/blog/${post.slug}`;
  const linkedTools = post.relatedToolSlugs
    .map((s) => TOOLS.find((t) => t.slug === s))
    .filter((t): t is ToolDefinition => Boolean(t));

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      headline: post.title,
      description: post.metaDescription,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { '@type': 'Organization', name: 'PottoTools', url: 'https://pottotools.in/' },
      publisher: { '@id': 'https://pottotools.in/#organization' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pottotools.in/' },
        { '@type': 'ListItem', position: 2, name: 'Guides & Blog', item: 'https://pottotools.in/blog' },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
      ],
    },
  ];

  if (post.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: post.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  const rootContent = `
    <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <a href="/" style="font-weight: 800; font-size: 1.25rem; color: #0f172a; text-decoration: none;">Potto<span style="color: #0284c7;">Tools</span></a>
      <nav aria-label="Primary Navigation" style="display: flex; gap: 1rem; font-size: 0.875rem; flex-wrap: wrap;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a>
        <a href="/blog" style="color: #0284c7; font-weight: 700; text-decoration: none;">Guides</a>
        <a href="/pdf-tools" style="color: #475569; text-decoration: none;">PDF Tools</a>
        <a href="/image-tools" style="color: #475569; text-decoration: none;">Image Tools</a>
        <a href="/directory" style="color: #475569; text-decoration: none;">All Tools</a>
      </nav>
    </header>
    <main style="max-width: 900px; margin: 2rem auto; padding: 0 1rem;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home</a> &rsaquo;
        <a href="/blog" style="color: #0284c7; text-decoration: none;">Guides &amp; Blog</a> &rsaquo;
        <span>${post.title}</span>
      </nav>
      <article>
        <div style="font-size: 0.8rem; color: #0284c7; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">${escapeHtml(post.category)} &bull; PottoTools Editorial Team &bull; ${escapeHtml(post.readTime)} &bull; Updated ${escapeHtml(post.updatedAt)}</div>
        <h1 style="font-size: 2.15rem; font-weight: 800; color: #0f172a; line-height: 1.25; margin-bottom: 1rem;">${escapeHtml(post.title)}</h1>
        <p style="font-size: 1.05rem; color: #475569; line-height: 1.6; margin-bottom: 2rem;">${escapeHtml(post.excerpt)}</p>
        ${post.sections
          .map(
            (sec) => `
          <section style="margin-bottom: 1.75rem;">
            <h2 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 0.6rem;">${escapeHtml(sec.heading)}</h2>
            ${sec.paragraphs.map((p) => `<p style="color: #334155; line-height: 1.7; margin-bottom: 0.75rem;">${escapeHtml(p)}</p>`).join('\n')}
            ${
              sec.table && sec.table.headers.length > 0
                ? `<div style="overflow-x: auto; margin: 1rem 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; border: 1px solid #cbd5e1;">
                      <thead>
                        <tr style="background: #f8fafc;">
                          ${sec.table.headers.map((h) => `<th style="border: 1px solid #e2e8f0; padding: 0.65rem; text-align: left; color: #0f172a;">${escapeHtml(h)}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${sec.table.rows
                          .map(
                            (row) =>
                              `<tr>${row.map((cell) => `<td style="border: 1px solid #e2e8f0; padding: 0.65rem; color: #334155;">${escapeHtml(cell)}</td>`).join('')}</tr>`
                          )
                          .join('\n')}
                      </tbody>
                    </table>
                  </div>`
                : ''
            }
            ${
              sec.bullets && sec.bullets.length > 0
                ? `<ul style="padding-left: 1.5rem; color: #334155; line-height: 1.7;">${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('\n')}</ul>`
                : ''
            }
          </section>
        `
          )
          .join('\n')}
        ${
          linkedTools.length > 0
            ? `<section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-top: 2rem;">
            <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Tools Featured in This Guide</h2>
            <ul style="list-style: none; padding: 0; line-height: 1.8;">
              ${linkedTools.map((t) => `<li><a href="/${t.slug}" style="color: #0284c7; font-weight: 600; text-decoration: none;">&bull; ${escapeHtml(t.title)} — ${escapeHtml(t.shortDesc)}</a></li>`).join('\n')}
            </ul>
          </section>`
            : ''
        }
        ${
          post.faqs.length > 0
            ? `<section style="margin-top: 2rem;">
            <h2 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Frequently Asked Questions</h2>
            ${post.faqs
              .map(
                (f) => `<div style="margin-bottom: 1rem;"><h3 style="font-size: 1rem; font-weight: 700; color: #0f172a;">${escapeHtml(f.q)}</h3><p style="color: #475569; line-height: 1.6;">${escapeHtml(f.a)}</p></div>`
              )
              .join('\n')}
          </section>`
            : ''
        }
      </article>
    </main>
    <footer style="margin-top: 4rem; padding: 2rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #475569; text-align: center;">
      <p><a href="/blog" style="color: #0284c7; margin: 0 0.5rem;">All Guides</a> | <a href="/directory" style="color: #475569; margin: 0 0.5rem;">All Tools</a> | <a href="/about" style="color: #475569; margin: 0 0.5rem;">About</a> | <a href="/privacy" style="color: #475569; margin: 0 0.5rem;">Privacy Policy</a></p>
      <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">&copy; 2026 PottoTools.in</p>
    </footer>
  `;

  let html = applyHeadMetadata(templateHtml, post.metaTitle, post.metaDescription, canonicalUrl);
  html = replacePageJsonLd(html, { '@context': 'https://schema.org', '@graph': graph });
  return html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*(?:<script[\s\S]*?<\/script>\s*)*<\/body>)/,
    `<div id="root">${rootContent}</div>$1`
  );
}

export function buildHindiPageHtml(templateHtml: string, page: HindiPageConfig): string {
  const canonicalUrl = `https://pottotools.in/${page.slug}`;
  const enUrl = page.enSlug ? `https://pottotools.in/${page.enSlug}` : 'https://pottotools.in/';
  const otherHindi = HINDI_PAGES.filter((p) => p.slug !== page.slug);
  const linkedTool = page.linkedToolId ? TOOLS.find((t) => t.id === page.linkedToolId) : undefined;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      inLanguage: 'hi',
      name: page.h1,
      url: canonicalUrl,
      description: page.metaDescription,
      isPartOf: { '@id': 'https://pottotools.in/#website' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home (EN)', item: 'https://pottotools.in/' },
        ...(page.slug === 'hi'
          ? [{ '@type': 'ListItem', position: 2, name: 'PottoTools हिंदी', item: canonicalUrl }]
          : [
              { '@type': 'ListItem', position: 2, name: 'PottoTools हिंदी', item: 'https://pottotools.in/hi' },
              { '@type': 'ListItem', position: 3, name: page.h1, item: canonicalUrl },
            ]),
      ],
    },
  ];

  if (page.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: page.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  const rootContent = `
    <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <a href="/" style="font-weight: 800; font-size: 1.25rem; color: #0f172a; text-decoration: none;">Potto<span style="color: #0284c7;">Tools</span></a>
      <nav aria-label="Primary Navigation" style="display: flex; gap: 1rem; font-size: 0.875rem; flex-wrap: wrap;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home (EN)</a>
        <a href="/hi" style="color: #059669; font-weight: 700; text-decoration: none;">हिंदी होम</a>
        <a href="${linkedTool ? `/${linkedTool.slug}` : '/directory'}" style="color: #475569; text-decoration: none;">${linkedTool ? linkedTool.title : 'All Tools'}</a>
        <a href="/blog" style="color: #475569; text-decoration: none;">Guides</a>
      </nav>
    </header>
    <main lang="hi" style="max-width: 960px; margin: 2rem auto; padding: 0 1rem;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
        <a href="/" style="color: #0284c7; text-decoration: none;">Home (EN)</a> &rsaquo;
        ${page.slug === 'hi' ? '<span>PottoTools हिंदी</span>' : `<a href="/hi" style="color: #0284c7; text-decoration: none;">हिंदी टूल्स</a> &rsaquo; <span>${page.h1}</span>`}
      </nav>
      <h1 style="font-size: 2.1rem; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 0.75rem;">${page.h1}</h1>
      <p style="font-size: 1.05rem; color: #475569; line-height: 1.7; margin-bottom: 1.5rem;">${page.subtitle}</p>
      <p style="margin-bottom: 2rem;">
        <a href="${linkedTool ? `/${linkedTool.slug}` : '/directory'}" style="display: inline-block; padding: 0.75rem 1.5rem; background: #0284c7; color: #ffffff; border-radius: 10px; font-weight: 700; text-decoration: none;">${page.ctaLabel} &rarr;</a>
        <a href="${page.enSlug ? `/${page.enSlug}` : '/'}" style="display: inline-block; margin-left: 0.75rem; padding: 0.75rem 1.25rem; border: 1px solid #cbd5e1; color: #0f172a; border-radius: 10px; font-weight: 600; text-decoration: none;">English Version</a>
      </p>
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">मुख्य विशेषताएँ</h2>
        <ul style="padding-left: 1.25rem; line-height: 1.8; color: #334155;">
          ${page.highlights.map((h) => `<li>${h}</li>`).join('\n')}
        </ul>
      </section>
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">${page.stepsTitle}</h2>
        <ol style="padding-left: 1.25rem; line-height: 1.8; color: #334155;">
          ${page.steps.map((s) => `<li>${s}</li>`).join('\n')}
        </ol>
      </section>
      <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">अन्य हिंदी टूल्स गाइड</h2>
        <ul style="list-style: none; padding: 0; line-height: 1.8;">
          ${otherHindi.map((hp) => `<li><a href="/${hp.slug}" style="color: #0284c7; font-weight: 600; text-decoration: none;">&bull; ${hp.h1}</a></li>`).join('\n')}
        </ul>
      </section>
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">अक्सर पूछे जाने वाले प्रश्न (FAQ)</h2>
        ${page.faqs.map((f) => `<div style="margin-bottom: 1rem;"><h3 style="font-size: 1rem; font-weight: 700; color: #0f172a;">${f.q}</h3><p style="color: #475569; line-height: 1.6;">${f.a}</p></div>`).join('\n')}
      </section>
    </main>
    <footer style="margin-top: 4rem; padding: 2rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #475569; text-align: center;">
      <p><a href="/" style="color: #0284c7; margin: 0 0.5rem;">Home (EN)</a> | <a href="/hi" style="color: #059669; margin: 0 0.5rem;">PottoTools हिंदी</a> | <a href="/directory" style="color: #475569; margin: 0 0.5rem;">All Tools</a> | <a href="/privacy" style="color: #475569; margin: 0 0.5rem;">Privacy Policy</a></p>
      <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">&copy; 2026 PottoTools.in</p>
    </footer>
  `;

  let html = applyHeadMetadata(templateHtml, page.title, page.metaDescription, canonicalUrl, {
    lang: 'hi',
    enUrl,
    hiUrl: canonicalUrl,
  });
  html = replacePageJsonLd(html, { '@context': 'https://schema.org', '@graph': graph });
  return html.replace(
    /<div id="root">[\s\S]*?<\/div>(\s*(?:<script[\s\S]*?<\/script>\s*)*<\/body>)/,
    `<div id="root">${rootContent}</div>$1`
  );
}

