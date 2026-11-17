import React from 'react';
import { SITE_CONFIG } from '../../config/site';
import { Mail, CheckCircle2, ArrowRight, Compass, Shield, Zap, Sparkles } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';

interface AboutPageProps {
  onNavigateDirectory?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateDirectory }) => {
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
            <strong>{SITE_CONFIG.name}</strong> is an online platform designed to make everyday PDF and document tasks simpler and more convenient. Our goal is to bring useful PDF tools, document conversion utilities, and image tools together in one accessible place.
          </p>
          <p>
            Whether you need to organize a PDF, convert a document, compress a file, or change an image format, PottoTools aims to provide a straightforward and convenient experience across devices.
          </p>
          <p>
            We continuously aim to improve the platform by making our tools easier to discover and simpler to use.
          </p>
          {onNavigateDirectory && (
            <div className="pt-2">
              <a
                href="/directory"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateDirectory();
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all no-underline"
              >
                <Compass className="w-4 h-4" />
                <span>Explore All Tools</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

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
            Contact & Support
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            For questions, feedback, or suggestions, please contact{' '}
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
