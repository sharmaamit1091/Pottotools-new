import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { ToolDefinition, searchTools } from '../../config/toolsRegistry';
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
    <header className="sticky top-0 z-40 w-full bg-[#0F1B31] text-white shadow-lg transition-colors border-b border-[#1E2E4E]">
      {/* 1. TOP HEADER BANNER: 2D Cartoon Animation Style with Interactive Helper Mascot */}
      <div
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden select-none"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Subtle background flight motion loop lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M150,80 Q280,10 420,60 T680,45 Q820,95 980,30"
              stroke="#60A5FA"
              strokeWidth="2"
              strokeDasharray="6 8"
              fill="none"
            />
            <path
              d="M220,95 Q380,120 540,55 T860,75"
              stroke="#A78BFA"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              fill="none"
            />
          </svg>
        </div>

        {/* Far Left: PottoTools Brand Logo with FREE badge */}
        <a
          href="/"
          onClick={(e) => handleNavClick('home', e)}
          className="relative z-10 flex items-center text-left focus-visible:outline-2 focus-visible:outline-blue-400 rounded-lg group shrink-0 cursor-pointer"
          title="PottoTools - 100% Free Smart Tools"
        >
          <PottoLogo size="lg" showTagline={false} inverted={true} />
        </a>

        {/* Center: Interactive Helper Mascot (Potoo Bird in Flight carrying PDF, Word, Excel sheets) */}
        <div
          onClick={() => setSearchOpen(true)}
          className={`relative z-10 flex-1 flex items-center justify-center max-w-md mx-auto cursor-pointer transition-all duration-300 group ${
            isDragOver ? 'scale-105 ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0F1B31] rounded-2xl' : ''
          }`}
          title="Interactive Helper Mascot – Click to search tools or drag files here!"
        >
          <div className="relative flex items-center justify-center py-1">
            {/* Flying Potoo Mascot Image with Gentle Hover Animation */}
            <div className="relative animate-potoo-hover transition-transform duration-300 group-hover:scale-105">
              <picture>
                <source srcSet="/assets/aistudio/potoo_mascot_transparent.webp" type="image/webp" />
                <img
                  src="/assets/aistudio/potoo_mascot_transparent.png"
                  alt="Potto Helper Mascot carrying tools"
                  width="380"
                  height="190"
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-md select-none pointer-events-none"
                  loading="eager"
                  decoding="async"
                  fetchPriority="low"
                  onError={(e) => {
                    // Fallback to perfect crop if transparent asset is unavailable
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('potoo_mascot_perfect.png')) {
                      target.src = '/assets/aistudio/potoo_mascot_perfect.png';
                    }
                  }}
                />
              </picture>
            </div>

            {/* Quick helper tag on small screens if mascot image scales down */}
            <div className="hidden md:flex flex-col ml-1 text-left">
              <span className="text-[11px] font-bold text-blue-200 tracking-wide uppercase opacity-75">
                Drop or Click
              </span>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                Quick Assistant <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
            </div>
          </div>
        </div>

        {/* Far Right: Circular Search glass icon & Circular Sun/Theme icon */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 shrink-0">
          {/* PWA In-App Install Button & Offline Indicator */}
          <PWAInstallButton variant="compact" />

          {/* Circular Search Glass Icon */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search tools"
            title="Search tools (⌘K)"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#182747] hover:bg-[#22365e] border border-blue-900/60 flex items-center justify-center text-blue-300 hover:text-white transition-all shadow-inner group cursor-pointer"
          >
            <Search className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform" />
          </button>

          {/* Circular Sun/Theme Toggle Icon */}
          <button
            onClick={onToggleDarkMode}
            type="button"
            aria-label={darkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            title={darkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#182747] hover:bg-[#22365e] border border-blue-900/60 flex items-center justify-center text-amber-400 hover:text-amber-300 transition-all shadow-inner cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-blue-200" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* 2. SECONDARY NAVIGATION BAR: Increased Text Size & High-Contrast Readable Colors */}
      <div className="w-full bg-[#080E1A] border-t border-blue-900/50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 overflow-x-auto no-scrollbar shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 sm:gap-3.5 min-w-max text-base sm:text-lg font-bold">
          {/* Home Button: Solid Bright Blue button */}
          <a
            href="/"
            onClick={(e) => handleNavClick('home', e)}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              currentView === 'home'
                ? 'bg-[#0D6EFD] text-white ring-2 ring-blue-300 shadow-blue-500/30'
                : 'bg-[#15233D] text-white hover:bg-[#1C325B] border border-blue-800/40'
            }`}
          >
            <span>Home</span>
          </a>

          {/* PDF Tools: High-contrast Red Pill */}
          <a
            href="/pdf-tools"
            onClick={(e) => handleNavClick('category-pdf-tools', e)}
            onMouseEnter={() => preloadView('category-pdf-tools')}
            onTouchStart={() => preloadView('category-pdf-tools')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
              currentView === 'category-pdf-tools' ||
              currentView === 'category-organize-pdf' ||
              currentView === 'category-compress-pdf'
                ? 'bg-[#DC2626] text-white ring-2 ring-red-300 shadow-red-500/30'
                : 'bg-[#3D1418] text-red-100 hover:bg-[#DC2626] hover:text-white border border-red-700/50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#EF4444] shrink-0 shadow-xs ring-2 ring-white/50"></span>
            <span>PDF Tools</span>
          </a>

          {/* Word Tools: High-Contrast Rich Blue Pill (replaces washed-out white) */}
          <a
            href="/word-tools"
            onClick={(e) => handleNavClick('category-word-tools', e)}
            onMouseEnter={() => preloadView('category-word-tools')}
            onTouchStart={() => preloadView('category-word-tools')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
              currentView === 'category-word-tools' || currentView === 'category-convert-docs'
                ? 'bg-[#2563EB] text-white ring-2 ring-blue-300 shadow-blue-500/30'
                : 'bg-[#12284E] text-blue-100 hover:bg-[#2563EB] hover:text-white border border-blue-600/60'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#3B82F6] shrink-0 shadow-xs ring-2 ring-white/50"></span>
            <span>Word Tools</span>
          </a>

          {/* Excel Tools: High-contrast Emerald Pill */}
          <a
            href="/excel-tools"
            onClick={(e) => handleNavClick('category-excel-tools', e)}
            onMouseEnter={() => preloadView('category-excel-tools')}
            onTouchStart={() => preloadView('category-excel-tools')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
              currentView === 'category-excel-tools' || currentView === 'category-spreadsheets'
                ? 'bg-[#059669] text-white ring-2 ring-emerald-300 shadow-emerald-500/30'
                : 'bg-[#0D3322] text-emerald-100 hover:bg-[#059669] hover:text-white border border-emerald-700/50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0 shadow-xs ring-2 ring-white/50"></span>
            <span>Excel Tools</span>
          </a>

          {/* PowerPoint Tools: High-contrast Amber Pill */}
          <a
            href="/powerpoint-tools"
            onClick={(e) => handleNavClick('category-powerpoint-tools', e)}
            onMouseEnter={() => preloadView('category-powerpoint-tools')}
            onTouchStart={() => preloadView('category-powerpoint-tools')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
              currentView === 'category-powerpoint-tools'
                ? 'bg-[#D97706] text-white ring-2 ring-amber-300 shadow-amber-500/30'
                : 'bg-[#3A2207] text-amber-100 hover:bg-[#D97706] hover:text-white border border-amber-700/50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#F59E0B] shrink-0 shadow-xs ring-2 ring-white/50"></span>
            <span>PowerPoint</span>
          </a>

          {/* Image Tools: High-Contrast Rich Purple Pill (replaces washed-out white) */}
          <a
            href="/image-tools"
            onClick={(e) => handleNavClick('category-image-tools', e)}
            onMouseEnter={() => preloadView('category-image-tools')}
            onTouchStart={() => preloadView('category-image-tools')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
              currentView === 'category-image-tools' || currentView === 'category-convert-images'
                ? 'bg-[#9333EA] text-white ring-2 ring-purple-300 shadow-purple-500/30'
                : 'bg-[#2E124D] text-purple-100 hover:bg-[#9333EA] hover:text-white border border-purple-600/60'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#A855F7] shrink-0 shadow-xs ring-2 ring-white/50"></span>
            <span>Image Tools</span>
          </a>

          {/* Other Utilities: High-contrast Cyan Pill */}
          <a
            href="/other-document-tools"
            onClick={(e) => handleNavClick('category-other-document-tools', e)}
            onMouseEnter={() => preloadView('category-other-document-tools')}
            onTouchStart={() => preloadView('category-other-document-tools')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
              currentView === 'category-other-document-tools' || currentView === 'category-smart-utilities'
                ? 'bg-[#0891B2] text-white ring-2 ring-cyan-300 shadow-cyan-500/30'
                : 'bg-[#0A2B35] text-cyan-100 hover:bg-[#0891B2] hover:text-white border border-cyan-700/50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#06B6D4] shrink-0 shadow-xs ring-2 ring-white/50"></span>
            <span>Other Utilities</span>
          </a>

          {/* All Tools */}
          <a
            href="/directory"
            onClick={(e) => handleNavClick('directory', e)}
            onMouseEnter={() => preloadView('directory')}
            onTouchStart={() => preloadView('directory')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all cursor-pointer shadow-sm ${
              currentView === 'directory'
                ? 'bg-[#4F46E5] text-white ring-2 ring-indigo-300 shadow-indigo-500/30'
                : 'bg-[#15233D] text-white hover:bg-[#4F46E5] border border-slate-700/60'
            }`}
          >
            <span>All Tools (43)</span>
          </a>

          {/* Guides & Blog */}
          <a
            href="/blog"
            onClick={(e) => handleNavClick('blog', e)}
            onMouseEnter={() => preloadView('blog')}
            onTouchStart={() => preloadView('blog')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all cursor-pointer shadow-sm ${
              currentView === 'blog' || currentView.startsWith('blog/')
                ? 'bg-[#0284C7] text-white ring-2 ring-sky-300 shadow-sky-500/30'
                : 'bg-[#15233D] text-sky-100 hover:bg-[#0284C7] hover:text-white border border-sky-700/50'
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
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all cursor-pointer shadow-sm ${
              currentView === 'about'
                ? 'bg-[#0D6EFD] text-white ring-2 ring-blue-300 shadow-blue-500/30'
                : 'bg-[#15233D] text-white hover:bg-[#0D6EFD] border border-slate-700/60'
            }`}
          >
            <span>About Us</span>
          </a>

          {/* Contact Us */}
          <a
            href="/contact"
            onClick={(e) => handleNavClick('contact', e)}
            onMouseEnter={() => preloadView('contact')}
            onTouchStart={() => preloadView('contact')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all cursor-pointer shadow-sm ${
              currentView === 'contact'
                ? 'bg-[#0D6EFD] text-white ring-2 ring-blue-300 shadow-blue-500/30'
                : 'bg-[#15233D] text-white hover:bg-[#0D6EFD] border border-slate-700/60'
            }`}
          >
            <span>Contact</span>
          </a>
        </div>
      </div>

      {/* Global Interactive Search Modal Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/20 dark:from-slate-800/40 dark:to-slate-800/20">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Search tools (e.g. PDF Organizer, Compress PDF, Word to PDF, Photo Resizer)…"
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
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2.5 py-1 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md font-mono"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.length > 0 ? (
                searchResults.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="w-full text-left p-3 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-indigo-50/50 dark:hover:bg-slate-800 rounded-xl flex items-start gap-3 transition-all group cursor-pointer"
                  >
                    <div className="mt-0.5 p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-xs group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {tool.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {tool.categoryName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {tool.shortDesc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors self-center opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No tools found for "<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>"
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Popular Quick Tools
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      'PDF Page Organizer',
                      'Compress PDF',
                      'PDF to Word',
                      'Photo Resizer',
                      'Merge PDF',
                      'OCR Scanner',
                      'Sign PDF',
                      'Excel to PDF',
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSearchQuery(term)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors cursor-pointer"
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
