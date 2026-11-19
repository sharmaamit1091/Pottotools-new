import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
  Cpu,
  BookOpen,
  Scale,
  Award,
  Search,
  WifiOff,
} from 'lucide-react';
import { ToolDefinition, getToolBySlug } from '../../config/toolsRegistry';

interface SearchContentSectionProps {
  onSelectTool: (tool: ToolDefinition) => void;
  onSelectCategory: (categoryId: string) => void;
  onExploreAll: () => void;
}

export const SearchContentSection: React.FC<SearchContentSectionProps> = ({
  onSelectTool,
  onSelectCategory,
  onExploreAll,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'compress' | 'word' | 'photo' | 'merge'>('compress');

  const handleToolClick = (slug: string) => {
    const tool = getToolBySlug(slug);
    if (tool) onSelectTool(tool);
  };

  const guides = {
    compress: {
      title: 'How to Compress a PDF to Under 100KB or 200KB Without Losing Quality',
      intro:
        'Most recruitment portals, university admission forms, and government websites (like UPSC, SSC, and State PSCs) strictly reject PDFs larger than 100KB, 200KB, or 500KB. PottoTools uses browser-side stream compression and intelligent downsampling to hit your exact size target.',
      steps: [
        'Open the free Compress PDF tool on PottoTools.',
        'Drop your PDF file or click Browse (files up to 500 MB supported).',
        'Select a target preset: "Target 100 KB", "Target 200 KB", "Target 500 KB", or enter a custom limit.',
        'The engine strips redundant streams and downsamples images while keeping vector text sharp.',
        'Click "Compress PDF" and instantly download your lightweight file.',
      ],
      proTip: 'For digital text PDFs, 100KB is easily achievable. For scanned PDFs with photos, select 200KB for the optimal balance of readability and compliance.',
      toolSlug: 'compress-pdf',
      toolLabel: 'Open Free PDF Compressor',
    },
    word: {
      title: 'How to Convert Locked or Scanned PDFs into 100% Editable Word DOCX',
      intro:
        'Converting PDF contracts, invoices, and resumes back into editable documents often ruins tables and formatting on standard websites. PottoTools reconstructs paragraphs, multi-column alignments, tables, and images, and runs in-browser OCR for scanned pages.',
      steps: [
        'Open the PDF to Editable Word converter on PottoTools.',
        'Upload your PDF file without giving any email address or creating an account.',
        'The WebAssembly engine analyzes the layout structure, fonts, margins, and embedded images.',
        'If the document is a paper scan, built-in Optical Character Recognition (OCR) reads the characters.',
        'Download the converted .docx file ready for Microsoft Word, Google Docs, or LibreOffice.',
      ],
      proTip: 'Scanned invoices or receipts with English and Hindi text can also be extracted using our standalone OCR Scanner for pure text copying.',
      toolSlug: 'pdf-to-editable-word',
      toolLabel: 'Convert PDF to Word Free',
    },
    photo: {
      title: 'How to Resize Photos and Signatures for Official Exams & Passports',
      intro:
        'Government job applications require strict photograph specifications (such as 3.5cm x 4.5cm or 200x230 px between 20KB and 50KB) and signature specifications (140x60 px between 10KB and 20KB). Incorrect uploads lead to immediate application rejection.',
      steps: [
        'Open the Custom Photo Studio or Exam Photo & Signature Resizer.',
        'Choose your target unit: Pixels (px), Centimeters (cm), Millimeters (mm), or Inches (in).',
        'Set exact width and height or pick a pre-configured exam preset (UPSC, SSC, IBPS, State PSC).',
        'Set the target file size limit (e.g. 20KB to 50KB). The engine balances compression and facial clarity.',
        'Preview the framed photo and download your compliant image ready for submission.',
      ],
      proTip: 'Sign with a dark blue or black pen on unruled white paper and ensure good lighting when capturing with your phone camera.',
      toolSlug: 'custom-photo-studio',
      toolLabel: 'Open Photo Resizer & Studio',
    },
    merge: {
      title: 'How to Combine Multiple Documents, Photos & Certificates into One PDF',
      intro:
        'Applying for jobs, loans, or visas requires submitting all supporting proof in a single consolidated PDF. PottoTools lets you merge multiple PDF files or convert phone photos (JPG/PNG) into a single paginated document.',
      steps: [
        'Open Merge PDF or Image to PDF depending on your source files.',
        'Drag and drop all your documents, identity proofs, and certificates into the workspace.',
        'Reorder pages or files using simple drag-and-drop until the sequence is perfect.',
        'Rotate any landscape or sideways sheets with the 90-degree rotate tool.',
        'Click "Merge Files" and download your organized multi-page PDF in seconds.',
      ],
      proTip: 'You can combine PDFs and images together using our Combine Application Documents utility.',
      toolSlug: 'merge-pdf',
      toolLabel: 'Merge PDFs Free',
    },
  };

  const activeGuide = guides[activeGuideTab];

  return (
    <section
      aria-label="Comprehensive Search Content & SEO Knowledge Hub"
      className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
          <Award className="w-3.5 h-3.5" />
          <span>Client-Side PDF, OCR &amp; Photo Studio</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          PottoTools: Client-Side PDF, Document Conversion &amp; Photo Resizing Suite
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Compress PDFs to 100KB, convert PDF to Word, resize exam photos (px/cm/mm &amp; 20KB–50KB), and redact sensitive IDs directly in your browser—free to use with zero cloud file uploads or registration.
        </p>
      </div>

      {/* 3 Core Topical Authority Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pillar 1: PDF Tools */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Free In-Browser PDF Tools
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Handle everyday PDF workflows locally in browser RAM. Reduce file size to 100KB, 200KB, or 500KB for portal uploads, merge or split pages, visually reorder and rotate large documents up to 500 MB, strip metadata, sign PDFs, and permanently redact Aadhaar or bank details offline.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href="/compress-pdf"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('compress-pdf');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Compress PDF to 100KB / 200KB</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/merge-pdf"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('merge-pdf');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Merge Multiple PDFs with Drag-and-Drop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/pdf-page-organizer"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('pdf-page-organizer');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; PDF Page Organizer (Up to 500 MB)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/pdf-id-redactor"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('pdf-id-redactor');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Offline PDF &amp; ID Redactor (Hide Aadhaar / Bank Info)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <a
            href="/pdf-tools"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onSelectCategory('pdf-tools');
              }
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs border border-rose-200 dark:border-rose-900 cursor-pointer no-underline"
          >
            <span>Explore All Free PDF Tools</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Pillar 2: Image Tools & Photo Studio */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Precision Image Tools &amp; Photo Studio
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Comprehensive image editing and resizing. Resize photos by pixels (px), centimeters (cm), millimeters (mm), or inches (in), compress photos to strict 20KB–50KB limits, format passport photos (35x45mm / 2x2 in), enhance blurry pictures in HD, and convert between JPG, PNG, and WebP.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href="/custom-photo-studio"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('custom-photo-studio');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Custom Photo Studio (px, cm, mm, in)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/photo-size-compressor"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('photo-size-compressor');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Compress Photo to Exact KB (20KB - 50KB)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/photo-signature-resizer"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('photo-signature-resizer');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; UPSC &amp; SSC Exam Photo / Sign Resizer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/image-converter"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('image-converter');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Image Format Converter (JPG, PNG, WebP)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <a
            href="/image-tools"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onSelectCategory('image-tools');
              }
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 dark:border-emerald-900 cursor-pointer no-underline"
          >
            <span>Explore All Free Image Tools</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Pillar 3: Document Conversion & OCR */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Document Conversion &amp; In-Browser OCR
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Convert between formats with complete layout fidelity. Convert PDF into fully editable Word (.docx) documents with OCR fallback, convert Word to PDF, spreadsheets (CSV &lt;-&gt; XLSX), presentations (PPTX to PDF), and extract copyable text from paper scans in English and Hindi.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href="/pdf-to-editable-word"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('pdf-to-editable-word');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; PDF to Editable Word (.docx) with OCR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/word-to-pdf"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('word-to-pdf');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Word (.docx) to PDF Converter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/searchable-pdf-text-finder"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('searchable-pdf-text-finder');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Searchable PDF Finder &amp; Text Layer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="/ocr-tool"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    handleToolClick('ocr-tool');
                  }
                }}
                className="w-full text-left flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 py-1 cursor-pointer no-underline"
              >
                <span>&bull; Free Online OCR Scanner (English + Hindi)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <a
            href="/convert-docs"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onSelectCategory('convert-docs');
              }
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold text-xs border border-blue-200 dark:border-blue-900 cursor-pointer no-underline"
          >
            <span>Explore All Conversion Tools</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Comparison Matrix: Why PottoTools is the Best Free Website */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900">
                <Scale className="w-3.5 h-3.5" />
                <span>Feature Comparison</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                <WifiOff className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Works 100% Offline (True PWA)</span>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Client-Side Browser Architecture vs. Cloud Converters
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              See how our local-first architecture delivers <strong>offline capability (works without internet once cached)</strong>, in-browser privacy, and unlimited free conversions without remote file uploads.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">Key Capability</th>
                <th className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 rounded-t-xl">
                  PottoTools (100% Free)
                </th>
                <th className="py-3 px-4 font-bold text-slate-500">Typical Cloud Converters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {/* Highlighted Offline Capability Row */}
              <tr className="bg-sky-50/40 dark:bg-sky-950/30">
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Offline Operation (Works Without Internet)</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/60 dark:bg-blue-950/40">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Offline Capable PWA (Core Tools Ready Anytime)</span>
                  </div>
                  <span className="block text-[11px] font-normal text-slate-600 dark:text-slate-300 mt-1">
                    Core PDF, photo, and ID redactor tools run offline in Airplane Mode via Service Workers; OCR tools cache ~10–25 MB language packs on first run.
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  <span className="text-red-500 font-semibold block">Fails Completely Without Internet</span>
                  <span className="text-[11px] block mt-1">Stops working the moment Wi-Fi drops; cannot process any file without uploading to cloud.</span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">Pricing &amp; Subscriptions</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/50 dark:bg-blue-950/30">
                  100% Free Forever (0 hidden paywalls)
                </td>
                <td className="py-3.5 px-4 text-slate-500">$10–$15/month after 2 free tasks</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">File Privacy &amp; Data Security</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/50 dark:bg-blue-950/30">
                  100% In-Browser (Files NEVER leave device)
                </td>
                <td className="py-3.5 px-4 text-slate-500">Uploaded to third-party cloud servers</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">Maximum File Size Limit</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/50 dark:bg-blue-950/30">
                  Up to 500 MB per file
                </td>
                <td className="py-3.5 px-4 text-slate-500">Capped at 10 MB – 25 MB on free tiers</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">Account Registration &amp; Email</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/50 dark:bg-blue-950/30">
                  Zero Sign-up · No Email Required
                </td>
                <td className="py-3.5 px-4 text-slate-500">Mandatory email sign-up for downloads</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">Processing Speed</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/50 dark:bg-blue-950/30">
                  Instant WebAssembly execution
                </td>
                <td className="py-3.5 px-4 text-slate-500">Slow uploads and server queue waiting</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">Daily Conversion Limits</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/50 dark:bg-blue-950/30">
                  Unlimited tasks per day
                </td>
                <td className="py-3.5 px-4 text-slate-500">Limited to 1 to 3 files every 24 hours</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* In-Depth Step-by-Step Search Guides */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-lg border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Step-by-Step How-To Guides</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Essential Guides for Everyday Document Tasks
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Learn practical techniques to solve common file format, size, and conversion challenges quickly.
            </p>
          </div>

          {/* Guide Switcher Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveGuideTab('compress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeGuideTab === 'compress' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Compress PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('word')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeGuideTab === 'word' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              PDF to Word
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('photo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeGuideTab === 'photo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Photo &amp; Signature
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('merge')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeGuideTab === 'merge' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Merge &amp; Organize
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg sm:text-xl font-bold text-white text-blue-300">
            {activeGuide.title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activeGuide.intro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {activeGuide.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-200"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>Pro Tip:</strong> {activeGuide.proTip}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href={`/${activeGuide.toolSlug}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleToolClick(activeGuide.toolSlug);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer no-underline"
            >
              <span>{activeGuide.toolLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Popular Search Keywords & Direct Navigation Directory */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Popular Google Search Queries &amp; Quick Tool Links</span>
          </div>
          <a
            href="/directory"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onExploreAll();
              }
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            View All 43+ Tools &rarr;
          </a>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { label: 'Compress PDF to 100KB', slug: 'compress-pdf' },
            { label: 'Reduce PDF to 200KB', slug: 'compress-pdf' },
            { label: 'Merge PDF Online Free', slug: 'merge-pdf' },
            { label: 'Split PDF by Page Range', slug: 'split-pdf' },
            { label: 'PDF to Editable Word DOCX', slug: 'pdf-to-editable-word' },
            { label: 'Convert Word to PDF', slug: 'word-to-pdf' },
            { label: 'Custom Photo Resizer in CM/MM', slug: 'custom-photo-studio' },
            { label: 'Compress Photo to 20KB - 50KB', slug: 'photo-size-compressor' },
            { label: 'UPSC Exam Photo Resizer', slug: 'photo-signature-resizer' },
            { label: 'SSC Signature Resizer', slug: 'photo-signature-resizer' },
            { label: 'JPG to PNG Transparent', slug: 'jpg-to-png' },
            { label: 'PNG to JPG Converter', slug: 'png-to-jpg' },
            { label: 'Extract Text from Scanned PDF', slug: 'ocr-tool' },
            { label: 'Make PDF Searchable Online', slug: 'searchable-pdf-text-finder' },
            { label: 'Visual PDF Page Organizer', slug: 'pdf-page-organizer' },
            { label: 'Password Protect PDF', slug: 'protect-pdf' },
            { label: 'Unlock PDF Online Free', slug: 'unlock-pdf' },
            { label: 'Convert Excel to PDF Tables', slug: 'excel-to-pdf' },
            { label: 'CSV to Excel Converter', slug: 'csv-to-xlsx' },
            { label: 'PowerPoint to PDF Converter', slug: 'powerpoint-to-pdf' },
            { label: 'Watermark PDF Online', slug: 'watermark-pdf' },
            { label: 'Number PDF Pages Free', slug: 'page-numbers-pdf' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={`/${item.slug}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleToolClick(item.slug);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer no-underline"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
