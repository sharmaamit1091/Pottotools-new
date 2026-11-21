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
  onExploreAll?: () => void;
}

export type DetectedCategory = 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'text';

interface DetectedFileInfo {
  file: File;
  category: DetectedCategory;
  categoryLabel: string;
  badgeColor: string;
  previewUrl?: string;
  extension: string;
}

const MAX_FILE_SIZE_BYTES = 524288000; // 500 MB

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSelectShortcut,
  onSelectTool,
  onExploreAll,
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
    { label: 'Redact ID / Aadhaar', slug: 'pdf-id-redactor', color: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' },
    { label: 'Compress PDF', slug: 'compress-pdf', color: 'border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
    { label: 'PDF to Word', slug: 'pdf-to-word', color: 'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900' },
    { label: 'Merge PDF', slug: 'merge-pdf', color: 'border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900' },
    { label: 'Split PDF', slug: 'split-pdf', color: 'border-orange-200 bg-orange-50/80 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900' },
    { label: 'Photo Resizer', slug: 'custom-photo-studio', color: 'border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900' },
    { label: 'Word to PDF', slug: 'word-to-pdf', color: 'border-cyan-200 bg-cyan-50/80 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900' },
    { label: 'OCR Scanner', slug: 'ocr-tool', color: 'border-teal-200 bg-teal-50/80 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900' },
  ];

  return (
    <section aria-label="Hero Section" className="relative pt-6 pb-6 sm:pt-8 sm:pb-8 text-center overflow-hidden">
      {/* Subtle Ambient Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[500px] sm:w-[700px] h-[250px] sm:h-[320px] bg-gradient-to-tr from-blue-400/15 via-indigo-400/10 to-purple-400/15 blur-3xl rounded-full transform -translate-y-8" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4 relative">
        {/* Hero Metadata & Clickable Vibrant 100% Offline Badge */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Free Online Tools</span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
            <span>No File Uploads</span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
            <OfflineStatusBadge align="center" />
          </div>
        </div>

        {/* Required H1 Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Free Online PDF, Photo &amp; Document Tools
        </h1>

        {/* Required Subheading */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Shrink PDFs to 100KB, convert PDF to Word, resize exam photos (20KB–50KB), and hide private info on your documents — safely on your own device.
        </p>

        {/* Signature Offline Highlights Strip */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          <div className="p-2.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <WifiOff className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold uppercase text-slate-900 dark:text-white block">
                  Works Without Internet
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
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
            className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer group no-underline"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <EyeOff className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold uppercase text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 block truncate">
                  Hide Private Info in PDFs &amp; IDs
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                  Blackout Aadhaar, bank &amp; salary details safely.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
              Try →
            </span>
          </a>
        </div>

        {/* Unified Animated Magic Tool Box */}
        <div className="pt-2">
          <PottoMagicDesk onSelectTool={onSelectTool} onExploreAll={onExploreAll} />
        </div>

        {/* Quick Search Bar */}
        <div className="max-w-2xl mx-auto pt-3">
          <div className="relative flex items-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for a tool (e.g. compress pdf, resize photo, word to pdf)..."
              className="w-full pl-11 pr-16 py-3 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none rounded-2xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-[11px] font-semibold text-slate-400 hover:text-slate-600 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Popular Tool Shortcuts */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">
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
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer no-underline ${item.color}`}
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
