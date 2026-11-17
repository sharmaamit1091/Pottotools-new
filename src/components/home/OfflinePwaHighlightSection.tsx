import React from 'react';
import { WifiOff, ShieldCheck, Plane } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { OfflineInstallationGuide } from './OfflineInstallationGuide';

export const OfflinePwaHighlightSection: React.FC = () => {
  return (
    <section
      id="offline-pwa-guide"
      aria-labelledby="offline-feature-heading"
      className="w-full my-10 overflow-hidden rounded-3xl bg-slate-950 text-white border border-emerald-500/35 shadow-2xl relative"
    >
      {/* Subtle architectural dot backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(52, 211, 153, 0.35) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto p-6 sm:p-10 space-y-8">
        {/* Clean unboxed eyebrow line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono font-bold tracking-wider text-emerald-400">
          <span className="inline-flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            100% Offline PWA
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>Works Without Internet</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>Windows, Mac, Android &amp; iPhone</span>
        </div>

        {/* High-impact 100% OFFLINE focal lockup + primary action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-emerald-500/35 p-5 sm:p-6">
            <div className="text-5xl sm:text-6xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-linear-to-br from-emerald-300 via-teal-300 to-sky-400 font-mono tabular-nums">
              100%
            </div>
            <div className="mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Offline Ready
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Install once to run PDF, photo, and ID redactor tools offline without internet (OCR downloads language data on first run before caching).
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2
              id="offline-feature-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight text-balance"
            >
              100% Offline PDF, Redactor &amp; Image App: Download, Install &amp; Use Anywhere
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Other online converters break without Wi-Fi and upload private documents to remote servers. Install PottoTools once to compress PDFs, resize photos, and permanently redact Aadhaar, bank &amp; salary details—even in Airplane Mode.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <PWAInstallButton variant="hero" />
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Free forever · No login · Works in Airplane Mode</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3-Step Animated SVG Workflow Guide */}
        <OfflineInstallationGuide />

        {/* Clean hairline comparison row */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 border-t border-slate-800 pt-5 text-xs">
          <div className="pb-3 md:pb-0 md:pr-6 flex items-start gap-2.5">
            <span className="text-rose-400 font-bold text-sm leading-none shrink-0 mt-0.5" aria-hidden="true">
              ✕
            </span>
            <div>
              <strong className="text-rose-300 font-semibold">Cloud-Only Websites:</strong>{' '}
              <span className="text-slate-400">
                Break completely without internet and upload your private documents to remote servers.
              </span>
            </div>
          </div>

          <div className="pt-3 md:pt-0 md:pl-6 flex items-start gap-2.5">
            <Plane className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-emerald-300 font-semibold">PottoTools Offline App:</strong>{' '}
              <span className="text-slate-300">
                Launches from your desktop or home screen in Airplane Mode with 100% local processing.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
