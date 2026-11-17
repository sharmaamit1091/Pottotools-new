import React, { useState } from 'react';
import { BookOpen, ChevronRight, CheckCircle2, Shield, Lock, FileText, ArrowRight } from 'lucide-react';

interface GuideItem {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  steps: string[];
  proTip: string;
}

const GUIDES: GuideItem[] = [
  {
    id: 'compress-limits',
    category: 'PDF Optimization',
    readTime: '2 min read',
    title: 'How to Shrink a PDF to Exactly 100KB or 200KB',
    summary: 'Most job applications and university portals strictly enforce a 100KB–300KB limit. Here is how PottoTools gets you under the limit safely.',
    steps: [
      'Upload your PDF to PottoTools PDF Compressor.',
      'Select the target KB preset matching your portal requirements (e.g., "Target 200 KB").',
      'The engine automatically downsamples embedded images and removes redundant metadata while keeping vector fonts ultra-sharp.',
      'Review the before-and-after bytes and click "Download Compressed PDF".',
    ],
    proTip: 'If your PDF contains scanned pages, choose the "Target 200KB" preset; text-only documents can easily hit 100KB without quality loss.',
  },
  {
    id: 'exam-photo-rules',
    category: 'Exam & Job Applications',
    readTime: '3 min read',
    title: 'Passport Photo & Signature Standards for UPSC, SSC & Bank Exams',
    summary: 'Application forms often reject photos due to wrong pixel dimensions or file size overflow. Follow these exact parameters.',
    steps: [
      'Photo dimensions: 200 x 230 pixels (standard 3.5cm x 4.5cm) between 20 KB and 50 KB.',
      'Signature dimensions: 140 x 60 pixels on clean white background between 10 KB and 20 KB.',
      'PottoTools Exam Resizer (in Image Tools) automatically centers the subject, trims margins, and enforces the file size floor and ceiling.',
    ],
    proTip: 'Sign on plain unruled white printer paper with a dark blue or black ink pen for clean scanner contrast.',
  },
  {
    id: 'browser-privacy',
    category: 'Privacy & Security',
    readTime: '2 min read',
    title: 'How In-Browser Client-Side Processing Protects Confidential Documents',
    summary: 'Unlike legacy cloud converters that upload your PDFs to remote third-party servers, PottoTools processes data locally.',
    steps: [
      'Documents are read into your browser memory (RAM) via the HTML5 File API and WebAssembly.',
      'Compression, page merging, rotation, and conversions happen on your device CPU/GPU.',
      'No files are transmitted to an external server or cloud bucket.',
      'Closing the browser tab immediately frees the memory buffer.',
    ],
    proTip: 'You can even test this yourself by turning on Airplane Mode or disabling Wi-Fi after opening the page—the tools continue working offline!',
  },
];

export const QuickGuidesSection: React.FC = () => {
  const [activeGuideId, setActiveGuideId] = useState<string>('compress-limits');
  const activeGuide = GUIDES.find((g) => g.id === activeGuideId) || GUIDES[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200/80 dark:border-slate-800">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/40 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practical Document Guides</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Helpful Document Guides & Best Practices
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Quick answers, portal requirements, and actionable tips for common file preparation tasks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Guide Selector List */}
        <div className="lg:col-span-5 space-y-3">
          {GUIDES.map((guide) => {
            const isSelected = guide.id === activeGuideId;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => setActiveGuideId(guide.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-slate-800/90 border-blue-500 shadow-md ring-2 ring-blue-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                  <span className="text-blue-600 dark:text-blue-400">{guide.category}</span>
                  <span>{guide.readTime}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {guide.title}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Active Guide Content Display */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
              <span>{activeGuide.category}</span>
              <span>·</span>
              <span>{activeGuide.readTime}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {activeGuide.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {activeGuide.summary}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Step-by-step instructions:
            </h4>
            <div className="space-y-2.5">
              {activeGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Pro Tip: </span>
            <span>{activeGuide.proTip}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
