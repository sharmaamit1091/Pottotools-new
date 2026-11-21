import React from 'react';
import { WifiOff, ShieldCheck, Plane } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { OfflineInstallationGuide } from './OfflineInstallationGuide';

export const OfflinePwaHighlightSection: React.FC = () => {
  return (
    <section
      id="offline-pwa-guide"
      aria-labelledby="offline-feature-heading"
      className="w-full my-8 overflow-hidden rounded-3xl bg-[#1B1F35] dark:bg-[#151829] text-[#F2F4FC] border border-[#2E3454] shadow-[0_18px_40px_-24px_rgba(37,37,54,0.45)] relative"
    >
      {/* Subtle architectural dot backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(142, 227, 188, 0.35) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto p-6 sm:p-10 space-y-8">
        {/* Clean unboxed eyebrow line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono font-bold tracking-wider text-[#8EE3BC]">
          <span className="inline-flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            100% Offline Ready
          </span>
          <span className="text-[#586082]" aria-hidden="true">·</span>
          <span>Works Without Internet</span>
          <span className="text-[#586082]" aria-hidden="true">·</span>
          <span>Windows, Mac, Android &amp; iPhone</span>
        </div>

        {/* High-impact 100% OFFLINE focal lockup + primary action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-4 rounded-2xl bg-[#141727]/90 border border-[#2B4F41] p-5 sm:p-6">
            <div className="text-5xl sm:text-6xl font-black tracking-tight leading-none text-[#8EE3BC] font-mono tabular-nums">
              100%
            </div>
            <div className="mt-1.5 text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#F2F4FC]">
              Offline Ready
            </div>
            <p className="mt-2 text-xs text-[#A0A5C0] leading-relaxed">
              Install once to use PDF, photo, and ID privacy tools even without internet.
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2
              id="offline-feature-heading"
              className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#F2F4FC] leading-tight text-balance"
            >
              Use PottoTools Offline: Install Once &amp; Edit Anywhere
            </h2>
            <p className="text-sm sm:text-base text-[#C4C9E0] leading-relaxed max-w-2xl">
              Other websites stop working when Wi-Fi disconnects and upload your files to outside servers. Install PottoTools once to shrink PDFs, resize photos, and hide private Aadhaar, bank, or salary details — even in Airplane Mode.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <PWAInstallButton variant="hero" />
              <span className="text-xs text-[#A0A5C0] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8EE3BC] shrink-0" aria-hidden="true" />
                <span>Free forever · No login · Works in Airplane Mode</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3-Step Animated SVG Workflow Guide */}
        <OfflineInstallationGuide />

        {/* Clean hairline comparison row */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2A2F4A] border-t border-[#2A2F4A] pt-5 text-xs">
          <div className="pb-3 md:pb-0 md:pr-6 flex items-start gap-2.5">
            <span className="text-[#FFB894] font-bold text-sm leading-none shrink-0 mt-0.5" aria-hidden="true">
              ✕
            </span>
            <div>
              <strong className="text-[#FFD1B8] font-semibold">Cloud-Only Websites:</strong>{' '}
              <span className="text-[#A0A5C0]">
                Break completely without internet and upload your private documents to remote servers.
              </span>
            </div>
          </div>

          <div className="pt-3 md:pt-0 md:pl-6 flex items-start gap-2.5">
            <Plane className="w-4 h-4 text-[#8EE3BC] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-[#8EE3BC] font-semibold">PottoTools Offline App:</strong>{' '}
              <span className="text-[#C4C9E0]">
                Launches from your desktop or home screen in Airplane Mode with 100% local processing.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
