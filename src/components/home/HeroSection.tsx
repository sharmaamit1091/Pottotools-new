import React, { useEffect } from 'react';
import {
  Search,
  WifiOff,
  EyeOff,
} from 'lucide-react';
import { ToolDefinition, searchTools } from '../../config/toolsRegistry';
import { preloadTool } from '../../services/utils/toolPreloader';
import { logSearchQuery } from '../../services/analytics/searchQueryLogger';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { OfflineStatusBadge } from '../common/OfflineStatusBadge';
import { PottoMagicDesk } from './PottoMagicDesk';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectShortcut: (toolSlug: string) => void;
  onSelectTool: (tool: ToolDefinition) => void;
}

export type DetectedCategory = 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'text';

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSelectShortcut,
  onSelectTool,
}) => {
  // Search query logging
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    const timer = setTimeout(() => {
      const matches = searchTools(trimmed);
      logSearchQuery(trimmed, matches.length);
    }, 1200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const popularShortcuts = [
    {
      label: 'Fill PDF Form',
      slug: 'fill-pdf-form',
      color: 'bg-[#E9E4FF]/80 text-[#4B3A9D] border-[#D4CAFA] hover:bg-[#E9E4FF] dark:bg-[#2B244E]/80 dark:text-[#D5CCFF] dark:border-[#4D4287]',
    },
    {
      label: 'Redact ID / Aadhaar',
      slug: 'pdf-id-redactor',
      color: 'bg-[#DDF5E9]/85 text-[#156340] border-[#BCEBD4] hover:bg-[#DDF5E9] dark:bg-[#17362A]/80 dark:text-[#B4EED1] dark:border-[#2A634C]',
    },
    {
      label: 'Compress PDF',
      slug: 'compress-pdf',
      color: 'bg-[#FFE9DA]/85 text-[#8E3914] border-[#F5BEA0] hover:bg-[#FFE9DA] dark:bg-[#3B261E]/80 dark:text-[#FFD2B5] dark:border-[#6A4132]',
    },
    {
      label: 'PDF to Word',
      slug: 'pdf-to-editable-word',
      color: 'bg-[#DDEEFF]/85 text-[#1A528C] border-[#B2D7FB] hover:bg-[#DDEEFF] dark:bg-[#1B314E]/80 dark:text-[#B9DCFF] dark:border-[#325785]',
    },
    {
      label: 'Merge PDF',
      slug: 'merge-pdf',
      color: 'bg-[#FFF2C9]/85 text-[#7E520A] border-[#F1D583] hover:bg-[#FFF2C9] dark:bg-[#3A2E14]/80 dark:text-[#FFE49B] dark:border-[#6E5623]',
    },
    {
      label: 'Photo Resizer',
      slug: 'custom-photo-studio',
      color: 'bg-[#E9E4FF]/70 text-[#4B3A9D] border-[#D4CAFA] hover:bg-[#E9E4FF] dark:bg-[#2B244E]/75 dark:text-[#D5CCFF] dark:border-[#4D4287]',
    },
    {
      label: 'Word to PDF',
      slug: 'word-to-pdf',
      color: 'bg-[#DDEEFF]/75 text-[#1A528C] border-[#B2D7FB] hover:bg-[#DDEEFF] dark:bg-[#1B314E]/75 dark:text-[#B9DCFF] dark:border-[#325785]',
    },
    {
      label: 'OCR Scanner',
      slug: 'ocr-tool',
      color: 'bg-[#DDF5E9]/75 text-[#156340] border-[#BCEBD4] hover:bg-[#DDF5E9] dark:bg-[#17362A]/75 dark:text-[#B4EED1] dark:border-[#2A634C]',
    },
  ];

  return (
    <section aria-label="Hero Section" className="relative pt-7 pb-6 sm:pt-10 sm:pb-8 text-center overflow-hidden">
      {/* Gentle Soft Pastel Ambient Halo (very subtle, preserves clean light canvas) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-20 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[520px] sm:w-[760px] h-[220px] sm:h-[290px] bg-gradient-to-tr from-[#E9E4FF]/55 via-[#DDEEFF]/35 to-[#DDF5E9]/45 dark:from-[#5B50E6]/12 dark:via-[#3A82DC]/10 dark:to-[#249A67]/10 blur-3xl rounded-full transform -translate-y-8" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4 relative">
        {/* Hero Metadata & Clickable 100% Offline Badge */}
        <div className="flex flex-col items-center justify-center gap-2 pt-enter-1">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs font-semibold text-[#777789] dark:text-[#A0A5C0]">
            <span>100% Free Online Tools</span>
            <span className="text-[#D4D2E3] dark:text-[#3A4064]" aria-hidden="true">·</span>
            <span>Zero Server Uploads</span>
            <span className="text-[#D4D2E3] dark:text-[#3A4064]" aria-hidden="true">·</span>
            <OfflineStatusBadge align="center" />
          </div>
        </div>

        {/* Main H1 Heading with Smooth Welcome Fade */}
        <h1 className="pt-enter-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC] leading-[1.14]">
          Free Online PDF, Photo &amp; Document Tools
        </h1>

        {/* Subtitle Appearing Shortly After */}
        <p className="pt-enter-2 max-w-2xl mx-auto text-sm sm:text-base text-[#777789] dark:text-[#A0A5C0] leading-relaxed font-normal">
          Shrink PDFs to 100KB, fill PDF forms, convert PDF to Word, resize exam photos (20KB–50KB), and hide private info — safely inside your own browser.
        </p>

        {/* Subtle Pastel Feature Highlights Strip */}
        <div className="pt-enter-2 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3 rounded-2xl bg-[#EEF6FF] dark:bg-[#192338] border border-[#C9E1FB] dark:border-[#2C3E5F] flex items-center justify-between gap-2.5 transition-all hover:border-[#9EC9F7]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#DDEEFF] dark:bg-[#223C60] text-[#1A528C] dark:text-[#B9DCFF] border border-[#B2D7FB] dark:border-[#325785] flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold uppercase text-[#252536] dark:text-[#F2F4FC] block">
                  Works Without Internet
                </span>
                <p className="text-[11px] text-[#55556B] dark:text-[#A8ADC7] truncate">
                  Install once &amp; use even in Airplane Mode.
                </p>
              </div>
            </div>
            <PWAInstallButton variant="compact" />
          </div>

          <a
            href="/pdf-id-redactor"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onSelectShortcut('pdf-id-redactor');
              }
            }}
            onMouseEnter={() => preloadTool('pdf-id-redactor')}
            className="p-3 rounded-2xl bg-[#EEFBF4] dark:bg-[#172826] border border-[#C3EBD6] dark:border-[#28473D] hover:border-[#8FD8B3] dark:hover:border-[#3E7661] flex items-center justify-between gap-2.5 text-left transition-all hover:-translate-y-0.5 cursor-pointer group no-underline"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#DDF5E9] dark:bg-[#1D4032] text-[#156340] dark:text-[#B4EED1] border border-[#AEE3C8] dark:border-[#2A634C] flex items-center justify-center shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold uppercase text-[#252536] dark:text-[#F2F4FC] group-hover:text-[#156340] dark:group-hover:text-emerald-300 block truncate transition-colors">
                  Hide Private Info in PDFs &amp; IDs
                </span>
                <p className="text-[11px] text-[#55556B] dark:text-[#A8ADC7] truncate">
                  Blackout Aadhaar, bank &amp; salary details safely.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#156340] dark:text-emerald-300 shrink-0 group-hover:translate-x-0.5 transition-transform">
              Try →
            </span>
          </a>
        </div>

        {/* Unified Animated Magic Tool Box */}
        <div className="pt-2 pt-enter-3">
          <PottoMagicDesk onSelectTool={onSelectTool} />
        </div>

        {/* Quick Search Bar */}
        <div className="max-w-2xl mx-auto pt-3 pt-enter-4">
          <div className="relative flex items-center rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E4E1F0] dark:border-[#2A2F4A] shadow-[0_4px_20px_-8px_rgba(37,37,54,0.08)] focus-within:border-[#5B50E6] focus-within:ring-3 focus-within:ring-[#E9E4FF] dark:focus-within:ring-[#5B50E6]/25 transition-all">
            <Search className="w-4 h-4 text-[#777789] absolute left-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for a tool (e.g. fill pdf form, compress pdf, resize photo, word to pdf)..."
              className="w-full pl-11 pr-16 py-3.5 text-xs sm:text-sm bg-transparent text-[#252536] dark:text-[#F2F4FC] placeholder-[#777789] focus:outline-none rounded-2xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-[11px] font-bold text-[#55556B] hover:text-[#252536] dark:text-[#A8ADC7] dark:hover:text-white px-2.5 py-1 bg-[#F5F4FA] dark:bg-[#222742] rounded-lg cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Popular Pastel Tool Shortcuts */}
        <div className="pt-2 pt-enter-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-[#777789] mr-1 hidden sm:inline">
              Popular:
            </span>
            {popularShortcuts.map((item) => (
              <a
                key={item.slug}
                href={`/${item.slug}`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onSelectShortcut(item.slug);
                  }
                }}
                onMouseEnter={() => preloadTool(item.slug)}
                onTouchStart={() => preloadTool(item.slug)}
                onFocus={() => preloadTool(item.slug)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer no-underline ${item.color}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
