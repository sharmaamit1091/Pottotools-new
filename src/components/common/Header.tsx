import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { TOOLS, ToolDefinition, searchTools } from '../../config/toolsRegistry';
import { PottoLogo } from './PottoLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { preloadTool, preloadView } from '../../services/utils/toolPreloader';
import { logSearchQuery } from '../../services/analytics/searchQueryLogger';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectTool: (tool: ToolDefinition) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onSelectTool,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const searchResults = searchQuery.trim() ? searchTools(searchQuery).slice(0, 8) : [];

  // Log search query after user pauses typing
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    const timer = setTimeout(() => {
      const matches = searchTools(trimmed);
      logSearchQuery(trimmed, matches.length);
    }, 1200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global keyboard shortcut (⌘K or Ctrl+K) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const handleToolClick = (tool: ToolDefinition) => {
    if (searchQuery.trim()) {
      logSearchQuery(searchQuery.trim(), searchResults.length);
    }
    onSelectTool(tool);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleNavClick = (view: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onNavigate(view);
  };

  // Drag and drop helper over the mascot
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      const name = firstFile.name.toLowerCase();
      if (name.endsWith('.pdf')) {
        onNavigate('category-pdf-tools');
      } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
        onNavigate('category-word-tools');
      } else if (name.endsWith('.xlsx') || name.endsWith('.csv')) {
        onNavigate('category-excel-tools');
      } else if (name.endsWith('.pptx') || name.endsWith('.ppt')) {
        onNavigate('category-powerpoint-tools');
      } else if (name.match(/\.(jpg|jpeg|png|webp|bmp)$/)) {
        onNavigate('category-image-tools');
      } else {
        setSearchOpen(true);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/92 dark:bg-[#151829]/92 backdrop-blur-md text-[#252536] dark:text-[#F2F4FC] border-b border-[#E8E6F2] dark:border-[#2A2F4A] shadow-[0_2px_16px_-6px_rgba(37,37,54,0.08)] dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.45)] transition-colors">
      {/* 1. TOP HEADER BAR: Clean Luminous SaaS Brand + Interactive Helper Mascot + Actions */}
      <div
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden select-none"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Ultra-subtle pastel flight path decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-45 dark:opacity-20 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M150,80 Q280,12 420,60 T680,45 Q820,92 980,30"
              stroke="#C9C1F8"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              fill="none"
            />
            <path
              d="M220,95 Q380,118 540,55 T860,75"
              stroke="#BBDDFB"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              fill="none"
            />
          </svg>
        </div>

        {/* Far Left: PottoTools Brand Logo with gentle entrance */}
        <a
          href="/"
          onClick={(e) => handleNavClick('home', e)}
          className="relative z-10 flex items-center text-left focus-visible:outline-2 focus-visible:outline-[#5B50E6] rounded-xl group shrink-0 cursor-pointer pt-enter-logo"
          title="PottoTools - 100% Free Smart Tools"
        >
          <PottoLogo size="lg" showTagline={true} inverted={false} />
        </a>

        {/* Center: Interactive Helper Mascot (Click to search or drag any file here) */}
        <div
          onClick={() => setSearchOpen(true)}
          className={`relative z-10 flex-1 flex items-center justify-center max-w-md mx-auto cursor-pointer transition-all duration-200 group ${
            isDragOver
              ? 'scale-[1.03] ring-2 ring-[#5B50E6] bg-[#E9E4FF]/50 dark:bg-[#5B50E6]/20 rounded-2xl px-3'
              : 'hover:bg-[#FAFAFC] dark:hover:bg-[#1E2238] rounded-2xl px-2.5'
          }`}
          title="Interactive Helper Mascot – Click to search tools or drag files here!"
        >
          <div className="relative flex items-center justify-center py-0.5">
            <div className="relative animate-potoo-hover transition-transform duration-300 group-hover:scale-105">
              <picture>
                <source srcSet="/assets/aistudio/potoo_mascot_transparent.webp" type="image/webp" />
                <img
                  src="/assets/aistudio/potoo_mascot_transparent.png"
                  alt="Potto Helper Mascot carrying tools"
                  width="380"
                  height="190"
                  className="h-14 sm:h-16 md:h-[72px] w-auto object-contain drop-shadow-xs select-none pointer-events-none"
                  loading="eager"
                  decoding="async"
                  fetchPriority="low"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('potoo_mascot_perfect.png')) {
                      target.src = '/assets/aistudio/potoo_mascot_perfect.png';
                    }
                  }}
                />
              </picture>
            </div>

            <div className="hidden md:flex flex-col ml-2 text-left">
              <span className="text-[10px] font-extrabold text-[#5B50E6] dark:text-[#A49CFF] tracking-wider uppercase">
                Drop File or Click
              </span>
              <span className="text-xs font-semibold text-[#777789] dark:text-[#A0A5C0] flex items-center gap-1">
                Quick Assistant <Sparkles className="w-3 h-3 text-[#D99116] dark:text-amber-300" />
              </span>
            </div>
          </div>
        </div>

        {/* Far Right: PWA Install, Search & Smooth Theme Toggle */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 shrink-0">
          <PWAInstallButton variant="compact" />

          {/* Search Button (44px accessible tap target) */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search tools"
            title="Search tools (⌘K)"
            className="w-11 h-11 rounded-xl bg-[#F5F4FA] dark:bg-[#20243C] hover:bg-[#E9E4FF] dark:hover:bg-[#2B3050] border border-[#E8E6F2] dark:border-[#303656] flex items-center justify-center text-[#252536] dark:text-[#E2E5F6] hover:text-[#5B50E6] dark:hover:text-[#A49CFF] transition-all active:scale-95 group cursor-pointer"
          >
            <Search className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Smooth Day/Night Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            type="button"
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-11 h-11 rounded-xl bg-[#FFF2C9]/75 dark:bg-[#20243C] hover:bg-[#FFF2C9] dark:hover:bg-[#2B3050] border border-[#F3DC9B] dark:border-[#303656] flex items-center justify-center text-[#8A5E10] dark:text-amber-300 transition-all active:scale-95 cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4.5 h-4.5 text-amber-300 transition-transform duration-300 rotate-0" aria-hidden="true" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-[#5B50E6] transition-transform duration-300" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* 2. SECONDARY NAVIGATION BAR: Calm Minimal Strip with Tasteful Pastel Active & Hover States */}
      <div className="w-full bg-[#FAFAFC]/95 dark:bg-[#111322]/95 border-t border-[#E8E6F2] dark:border-[#252A44] px-4 sm:px-6 lg:px-8 py-2.5 overflow-x-auto no-scrollbar">
        <nav aria-label="Primary Categories" className="max-w-7xl mx-auto flex items-center gap-2 min-w-max text-xs sm:text-[13px] font-bold">
          {/* Home */}
          <a
            href="/"
            onClick={(e) => handleNavClick('home', e)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
              currentView === 'home'
                ? 'bg-[#5B50E6] text-white shadow-sm shadow-[#5B50E6]/25'
                : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#E9E4FF]/70 dark:hover:bg-[#242842] border border-[#E8E6F2] dark:border-[#2A2F4A]'
            }`}
          >
            <span>Home</span>
          </a>

          {/* PDF Tools – Soft Peach Pastel Accent */}
          <a
            href="/pdf-tools"
            onClick={(e) => handleNavClick('category-pdf-tools', e)}
            onMouseEnter={() => preloadView('category-pdf-tools')}
            onTouchStart={() => preloadView('category-pdf-tools')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
              currentView === 'category-pdf-tools' ||
              currentView === 'category-organize-pdf' ||
              currentView === 'category-compress-pdf'
                ? 'bg-[#FFE9DA] text-[#8E3914] dark:bg-[#47291E] dark:text-[#FFD2B5] border border-[#F5BEA0] dark:border-[#7B4733] shadow-2xs'
                : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#FFE9DA]/65 dark:hover:bg-[#2E201C] border border-[#E8E6F2] dark:border-[#2A2F4A]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#E86D42] shrink-0" />
            <span>PDF Tools</span>
          </a>

          {/* Word Tools – Soft Sky Blue Pastel Accent */}
          <a
            href="/word-tools"
            onClick={(e) => handleNavClick('category-word-tools', e)}
            onMouseEnter={() => preloadView('category-word-tools')}
            onTouchStart={() => preloadView('category-word-tools')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
              currentView === 'category-word-tools' || currentView === 'category-convert-docs'
                ? 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border border-[#B2D7FB] dark:border-[#325785] shadow-2xs'
                : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#DDEEFF]/70 dark:hover:bg-[#1B283D] border border-[#E8E6F2] dark:border-[#2A2F4A]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#3A82DC] shrink-0" />
            <span>Word Tools</span>
          </a>

          {/* Excel Tools – Soft Mint Pastel Accent */}
          <a
            href="/excel-tools"
            onClick={(e) => handleNavClick('category-excel-tools', e)}
            onMouseEnter={() => preloadView('category-excel-tools')}
            onTouchStart={() => preloadView('category-excel-tools')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
              currentView === 'category-excel-tools' || currentView === 'category-spreadsheets'
                ? 'bg-[#DDF5E9] text-[#156340] dark:bg-[#17362A] dark:text-[#B4EED1] border border-[#AEE3C8] dark:border-[#2A634C] shadow-2xs'
                : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#DDF5E9]/70 dark:hover:bg-[#182C25] border border-[#E8E6F2] dark:border-[#2A2F4A]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#249A67] shrink-0" />
            <span>Excel Tools</span>
          </a>

          {/* PowerPoint Tools – Soft Butter Yellow Pastel Accent */}
          <a
            href="/powerpoint-tools"
            onClick={(e) => handleNavClick('category-powerpoint-tools', e)}
            onMouseEnter={() => preloadView('category-powerpoint-tools')}
            onTouchStart={() => preloadView('category-powerpoint-tools')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
              currentView === 'category-powerpoint-tools'
                ? 'bg-[#FFF2C9] text-[#7E520A] dark:bg-[#3A2E14] dark:text-[#FFE49B] border border-[#F1D583] dark:border-[#6E5623] shadow-2xs'
                : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#FFF2C9]/75 dark:hover:bg-[#2C2518] border border-[#E8E6F2] dark:border-[#2A2F4A]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99B1E] shrink-0" />
            <span>PowerPoint</span>
          </a>

          {/* Image Tools – Soft Lavender Pastel Accent */}
          <a
            href="/image-tools"
            onClick={(e) => handleNavClick('category-image-tools', e)}
            onMouseEnter={() => preloadView('category-image-tools')}
            onTouchStart={() => preloadView('category-image-tools')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
              currentView === 'category-image-tools' || currentView === 'category-convert-images'
                ? 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF] border border-[#CFC5FA] dark:border-[#4D4287] shadow-2xs'
                : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#E9E4FF]/70 dark:hover:bg-[#24203E] border border-[#E8E6F2] dark:border-[#2A2F4A]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#6E5CE6] shrink-0" />
            <span>Image Tools</span>
          </a>

          {/* Other Utilities – Soft Sky/Mint Blend */}
          <a
            href="/other-document-tools"
            onClick={(e) => handleNavClick('category-other-document-tools', e)}
            onMouseEnter={() => preloadView('category-other-document-tools')}
            onTouchStart={() => preloadView('category-other-document-tools')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
              currentView === 'category-other-document-tools' || currentView === 'category-smart-utilities'
                ? 'bg-[#DDEEFF] text-[#1A5878] dark:bg-[#193342] dark:text-[#BEE5FA] border border-[#B7DDF5] dark:border-[#315D76] shadow-2xs'
                : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#DDEEFF]/65 dark:hover:bg-[#1C2A38] border border-[#E8E6F2] dark:border-[#2A2F4A]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B9AAA] shrink-0" />
            <span>Other Utilities</span>
          </a>

          <span className="h-5 w-px bg-[#E8E6F2] dark:bg-[#2A2F4A] mx-0.5 shrink-0" aria-hidden="true" />

          {/* All Tools */}
          <a
            href="/directory"
            onClick={(e) => handleNavClick('directory', e)}
            onMouseEnter={() => preloadView('directory')}
            onTouchStart={() => preloadView('directory')}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              currentView === 'directory'
                ? 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF] border border-[#CFC5FA] dark:border-[#4D4287]'
                : 'text-[#55556B] dark:text-[#A8ADC7] hover:text-[#252536] dark:hover:text-white hover:bg-white dark:hover:bg-[#181B2E]'
            }`}
          >
            <span>All Tools ({TOOLS.length})</span>
          </a>

          {/* Guides & Blog */}
          <a
            href="/blog"
            onClick={(e) => handleNavClick('blog', e)}
            onMouseEnter={() => preloadView('blog')}
            onTouchStart={() => preloadView('blog')}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              currentView === 'blog' || currentView.startsWith('blog/')
                ? 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border border-[#B2D7FB] dark:border-[#325785]'
                : 'text-[#55556B] dark:text-[#A8ADC7] hover:text-[#252536] dark:hover:text-white hover:bg-white dark:hover:bg-[#181B2E]'
            }`}
          >
            <span>Guides</span>
          </a>

          {/* About Us */}
          <a
            href="/about"
            onClick={(e) => handleNavClick('about', e)}
            onMouseEnter={() => preloadView('about')}
            onTouchStart={() => preloadView('about')}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              currentView === 'about'
                ? 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF]'
                : 'text-[#55556B] dark:text-[#A8ADC7] hover:text-[#252536] dark:hover:text-white hover:bg-white dark:hover:bg-[#181B2E]'
            }`}
          >
            <span>About</span>
          </a>

          {/* Contact */}
          <a
            href="/contact"
            onClick={(e) => handleNavClick('contact', e)}
            onMouseEnter={() => preloadView('contact')}
            onTouchStart={() => preloadView('contact')}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              currentView === 'contact'
                ? 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF]'
                : 'text-[#55556B] dark:text-[#A8ADC7] hover:text-[#252536] dark:hover:text-white hover:bg-white dark:hover:bg-[#181B2E]'
            }`}
          >
            <span>Contact</span>
          </a>
        </nav>
      </div>

      {/* Global Interactive Search Modal Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#181A2E]/60 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden pt-page-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#E8E6F2] dark:border-[#2A2F4A] flex items-center gap-3 bg-[#FAFAFC] dark:bg-[#141727]">
              <div className="w-9 h-9 rounded-xl bg-[#E9E4FF] dark:bg-[#2E2759] text-[#5B50E6] dark:text-[#B8B1FF] flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Search tools (e.g. Fill PDF Form, Compress PDF, Word to PDF, Photo Resizer)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = searchQuery.trim();
                    if (trimmed.length >= 2) {
                      logSearchQuery(trimmed, searchResults.length);
                    }
                  }
                }}
                className="w-full bg-transparent text-[#252536] dark:text-[#F2F4FC] placeholder-[#777789] text-sm font-medium focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2.5 py-1 text-[#777789] hover:text-[#252536] dark:hover:text-white bg-[#F0EEF8] dark:bg-[#242842] rounded-md font-mono cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#F1EFF8] dark:divide-[#252A44]">
              {searchResults.length > 0 ? (
                searchResults.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="w-full text-left p-3 hover:bg-[#F5F3FF] dark:hover:bg-[#20243C] rounded-xl flex items-start gap-3 transition-all group cursor-pointer"
                  >
                    <div className="mt-0.5 p-2 bg-[#E9E4FF] dark:bg-[#2D2654] text-[#5B50E6] dark:text-[#BEB7FF] rounded-lg group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC] group-hover:text-[#5B50E6] dark:group-hover:text-[#A49CFF] transition-colors">
                          {tool.title}
                        </span>
                        <span className="text-[10px] text-[#777789] font-medium">
                          {tool.categoryName}
                        </span>
                      </div>
                      <p className="text-xs text-[#777789] dark:text-[#A0A5C0] line-clamp-1 mt-0.5">
                        {tool.shortDesc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#A9A6BE] group-hover:text-[#5B50E6] dark:group-hover:text-[#A49CFF] transition-all self-center group-hover:translate-x-0.5" />
                  </button>
                ))
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center text-sm text-[#777789]">
                  No tools found for "<span className="font-semibold text-[#252536] dark:text-[#F2F4FC]">{searchQuery}</span>"
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#777789]">
                    Popular Quick Tools
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      'Fill PDF Form',
                      'PDF Page Organizer',
                      'Compress PDF',
                      'PDF to Word',
                      'Photo Resizer',
                      'Merge PDF',
                      'OCR Scanner',
                      'Sign PDF',
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSearchQuery(term)}
                        className="px-3 py-1.5 rounded-lg bg-[#F5F4FA] dark:bg-[#20243C] text-[#252536] dark:text-[#E2E5F6] hover:bg-[#E9E4FF] hover:text-[#4B3A9D] dark:hover:bg-[#2E2759] dark:hover:text-[#D5CCFF] font-semibold transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
