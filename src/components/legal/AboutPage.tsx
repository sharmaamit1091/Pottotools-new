import React from 'react';
import { SITE_CONFIG } from '../../config/site';
import { Mail, ArrowRight, Compass, BookOpen, Sparkles, ShieldCheck } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';

interface AboutPageProps {
  onNavigateTools?: () => void;
  onNavigateBlog?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigateTools,
  onNavigateBlog,
}) => {
  const supportEmail = SITE_CONFIG.supportEmail || 'sharma.amit1091@gmail.com';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About Our Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About {SITE_CONFIG.name}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
          {SITE_CONFIG.tagline}
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
            <strong>{SITE_CONFIG.name}</strong> is an independent online platform built in India for users worldwide to handle everyday PDF, Word, Excel, OCR, and photograph tasks directly inside the web browser.
          </p>
          <p>
            Instead of requiring account registration, email capture, or uploading sensitive bank statements, exam applications, and personal identity scans to external servers, PottoTools executes document tasks directly on your own device using local browser memory.
          </p>
          <p>
            To keep every utility free for students, job applicants, and office teams, PottoTools is sustained by standard display advertising rather than paywalls or subscription quotas.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {onNavigateTools && (
              <a
                href="/pdf-tools"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTools();
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all no-underline"
              >
                <Compass className="w-4 h-4" />
                <span>Explore PDF Tools</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <a
              href="/blog"
              onClick={(e) => {
                if (onNavigateBlog && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onNavigateBlog();
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm transition-all no-underline"
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Read Practical Guides</span>
            </a>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Who PottoTools Serves &amp; Editorial Standards</span>
          </h2>
          <p>
            Many visitors arrive on PottoTools when trying to solve concrete formatting constraints—shrinking multi-page application PDFs under 100 KB or 200 KB, converting centimeter/millimeter passport specifications into exact pixels at 200 or 300 DPI, extracting editable text from scanned notices, or masking Aadhaar and bank account numbers locally before emailing documents.
          </p>
          <p>
            Alongside our browser utilities, our editorial team maintains practical how-to tutorials in our{' '}
            <a
              href="/blog"
              onClick={(e) => {
                if (onNavigateBlog && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onNavigateBlog();
                }
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold underline"
            >
              Practical Guides &amp; Blog
            </a>{' '}
            hub. Every guide documents real file-format trade-offs, verified formulas, and honest tool limitations (such as when 100 KB compression shifts from vector text to raster pages, or why Latin-font PDFs differ from Devanagari in-app OCR search) so users know what to expect before downloading.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-xs">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">100% Free Access</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No paid tiers, no premium paywalls, and no subscription bait.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-xs">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">100% Client-Side Privacy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero document uploads. Processing happens directly inside your web browser.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-xs">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">No Registration Needed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Open the tool, process your file, and download immediately without creating an account.
            </p>
          </div>
        </div>

        {/* In-Content AdSlot */}
        <div className="py-2">
          <AdSlot placement="content-inline" format="horizontal" minHeight={90} />
        </div>

        {/* Contact Note */}
        <section className="p-6 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            Contact &amp; Support
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            For questions, feedback, bug reports, or guide corrections, please contact{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{supportEmail}</strong>.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${encodeURIComponent('[PottoTools] Inquiry')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open in Gmail (Web)</span>
            </a>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent('[PottoTools] Inquiry')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Mail App</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
