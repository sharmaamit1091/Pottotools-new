import React, { useState, useEffect } from 'react';
import { SITE_CONFIG } from './config/site';
import { TOOLS, ToolDefinition, getToolBySlug, searchTools } from './config/toolsRegistry';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Breadcrumbs } from './components/common/Breadcrumbs';
import { AdPlaceholder } from './components/common/AdPlaceholder';
import { AdSlot } from './components/common/AdSlot';
import { AdsterraNativeBanner } from './components/common/AdsterraNativeBanner';
import { AdsterraBanner } from './components/common/AdsterraBanner';
import { MONETIZATION_CONFIG } from './config/monetization';

// Home sections
import { HeroSection } from './components/home/HeroSection';
import { MainCategoriesSection } from './components/home/MainCategoriesSection';
import { CommonTasksSection } from './components/home/CommonTasksSection';
import { WhyChooseSection } from './components/home/WhyChooseSection';
import { HowItWorksSection } from './components/home/HowItWorksSection';
import { SearchContentSection } from './components/home/SearchContentSection';
import { FaqSection } from './components/home/FaqSection';

import { ToolSkeleton } from './components/common/ToolSkeleton';
import { ToastContainer } from './components/common/Toast';
import { ToolDetailVisualHeader } from './components/common/ToolDetailVisualHeader';
import { ToolSeoContentSection } from './components/common/ToolSeoContentSection';
import { updatePageSeoMetadata } from './services/seo/seoMetadataService';
import { OfflinePwaHighlightSection } from './components/home/OfflinePwaHighlightSection';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { CategoryPage } from './components/pages/CategoryPage';
import { DirectoryPage } from './components/legal/DirectoryPage';
import { getHindiPageBySlug } from './config/hindiPages';
import {
  setActiveToolContext,
  trackPageView,
  trackToolOpen,
} from './services/analytics/ga4Tracker';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; viewKey: string; onResetHome: () => void },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode; viewKey: string; onResetHome: () => void }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || 'Unable to load this view.' };
  }

  componentDidUpdate(prevProps: { viewKey: string }) {
    if (prevProps.viewKey !== this.props.viewKey && this.state.hasError) {
      this.setState({ hasError: false, errorMsg: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto py-14 px-4 text-center">
          <div className="bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-3xl p-8 shadow-[0_12px_32px_-20px_rgba(37,37,54,0.16)]">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#FFF2C9] dark:bg-[#362C14] text-[#7E520A] dark:text-[#FFE08A] border border-[#F1D583] dark:border-[#53431D] rounded-full mb-4">
              Offline Cache Syncing
            </span>
            <h2 className="text-xl font-extrabold text-[#252536] dark:text-[#F2F4FC] mb-2">
              This Tool Needs One Online Visit First
            </h2>
            <p className="text-sm text-[#777789] dark:text-[#A0A5C0] mb-6 leading-relaxed">
              Once cached in your installed app, every tool works 100% offline. Please check your connection or retry.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, errorMsg: '' })}
                className="px-5 py-2.5 bg-[#5B50E6] hover:bg-[#4A3FD4] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMsg: '' });
                  this.props.onResetHome();
                }}
                className="px-5 py-2.5 bg-[#F5F4FA] dark:bg-[#20243C] hover:bg-[#E9E4FF] dark:hover:bg-[#2A2F4A] text-[#252536] dark:text-[#E2E6F7] rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Robust lazy loader with automatic retry on dynamic import failure
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const res = await factory();
      return { default: res.default || res };
    } catch (err) {
      console.warn('Dynamic import failed, retrying module load...', err);
      await new Promise((resolve) => setTimeout(resolve, 350));
      const res = await factory();
      return { default: res.default || res };
    }
  });
}

// Tool components (Lazy loaded to ensure ultra-fast initial page loading)
const PdfCompressorTool = lazyWithRetry(() =>
  import('./components/tools/PdfCompressorTool').then((m) => ({ default: m.PdfCompressorTool }))
);
const SearchablePdfTextFinderTool = lazyWithRetry(() =>
  import('./components/tools/SearchablePdfTextFinderTool').then((m) => ({ default: m.SearchablePdfTextFinderTool }))
);
const PdfPageOrganizerTool = lazyWithRetry(() =>
  import('./components/tools/PdfPageOrganizerTool').then((m) => ({ default: m.PdfPageOrganizerTool }))
);
const PdfOrganizeTool = lazyWithRetry(() =>
  import('./components/tools/PdfOrganizeTool').then((m) => ({ default: m.PdfOrganizeTool || m.default }))
);
const GovPhotoResizerTool = lazyWithRetry(() =>
  import('./components/tools/GovPhotoResizerTool').then((m) => ({ default: m.GovPhotoResizerTool }))
);
const PhotoStudioWorkspace = lazyWithRetry(() =>
  import('./components/tools/PhotoStudioWorkspace').then((m) => ({ default: m.PhotoStudioWorkspace }))
);
const PdfToEditableWordTool = lazyWithRetry(() =>
  import('./components/tools/PdfToEditableWordTool').then((m) => ({ default: m.PdfToEditableWordTool }))
);
const RemoveScanWatermarkTool = lazyWithRetry(() =>
  import('./components/tools/RemoveScanWatermarkTool').then((m) => ({ default: m.RemoveScanWatermarkTool }))
);
const FillPdfFormTool = lazyWithRetry(() =>
  import('./components/tools/FillPdfFormTool').then((m) => ({ default: m.FillPdfFormTool }))
);
const DocumentConverterTool = lazyWithRetry(() =>
  import('./components/tools/DocumentConverterTool').then((m) => ({ default: m.DocumentConverterTool }))
);
const ImageConverterTool = lazyWithRetry(() =>
  import('./components/tools/ImageConverterTool').then((m) => ({ default: m.ImageConverterTool }))
);
const OcrTool = lazyWithRetry(() =>
  import('./components/tools/OcrTool').then((m) => ({ default: m.OcrTool }))
);
const PdfSecurityTool = lazyWithRetry(() =>
  import('./components/tools/PdfSecurityTool').then((m) => ({ default: m.PdfSecurityTool }))
);
const PdfRedactorTool = lazyWithRetry(() =>
  import('./components/tools/PdfRedactorTool').then((m) => ({ default: m.PdfRedactorTool }))
);
const SpreadsheetTool = lazyWithRetry(() =>
  import('./components/tools/SpreadsheetTool').then((m) => ({ default: m.SpreadsheetTool }))
);
const SmartTextTools = lazyWithRetry(() =>
  import('./components/tools/SmartTextTools').then((m) => ({ default: m.SmartTextTools }))
);
const PowerPointTool = lazyWithRetry(() =>
  import('./components/tools/PowerPointTool').then((m) => ({ default: m.PowerPointTool }))
);

// Legal and informational pages (Lazy loaded)
const PrivacyPolicy = React.lazy(() =>
  import('./components/legal/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy }))
);
const TermsOfUse = React.lazy(() =>
  import('./components/legal/TermsOfUse').then((m) => ({ default: m.TermsOfUse }))
);
const AboutPage = React.lazy(() =>
  import('./components/legal/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = React.lazy(() =>
  import('./components/legal/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const DisclaimerPage = React.lazy(() =>
  import('./components/legal/DisclaimerPage').then((m) => ({ default: m.DisclaimerPage }))
);
const CookiePolicy = React.lazy(() =>
  import('./components/legal/CookiePolicy').then((m) => ({ default: m.CookiePolicy }))
);
const BlogPage = lazyWithRetry(() =>
  import('./components/pages/BlogPage').then((m) => ({ default: m.BlogPage }))
);
const HindiLandingPage = lazyWithRetry(() =>
  import('./components/pages/HindiLandingPage').then((m) => ({ default: m.HindiLandingPage }))
);

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize theme synchronously from localStorage or system preference
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const storedTheme = localStorage.getItem('pottotools_theme') || localStorage.getItem('docuease_theme');
      if (storedTheme === 'dark') return true;
      if (storedTheme === 'light') return false;
      return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    } catch {
      return false;
    }
  });

  // Apply theme to document element and sync with localStorage whenever darkMode changes
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('pottotools_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('pottotools_theme', 'light');
      }
    } catch {
      // Ignore
    }
  }, [darkMode]);

  // Listen to system OS preference changes if the user hasn't explicitly set a stored choice
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem('pottotools_theme');
        if (!stored) {
          setDarkMode(e.matches);
        }
      } catch {}
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const handleToggleDarkMode = () => {
    const next = !darkMode;
    const root = document.documentElement;
    // Enable brief smooth surface/text fade during user-triggered theme toggle
    root.classList.add('theme-transitioning');
    window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 280);
    // Apply DOM changes synchronously for instant zero-latency feedback
    if (next) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem('pottotools_theme', next ? 'dark' : 'light');
    } catch {}
    setDarkMode(next);
  };

  // Synchronize route with browser URL history
  const navigateTo = (view: string, tool?: ToolDefinition, replaceState = false) => {
    // URL Aliases
    if (view === 'about-us') view = 'about';
    if (view === 'contact-us') view = 'contact';
    if (view === 'all-tools') view = 'directory';
    if (view === 'convert-documents') view = 'category-convert-docs';
    if (view === 'pdf-tools' || view === 'top-pdf-tools' || view === 'category-compress-pdf') view = 'category-pdf-tools';
    if (view === 'word-tools') view = 'category-word-tools';
    if (view === 'excel-tools') view = 'category-excel-tools';
    if (view === 'powerpoint-tools') view = 'category-powerpoint-tools';
    if (view === 'image-tools' || view === 'image-tools-presets' || view === 'gov-tools' || view === 'category-gov-tools') view = 'category-image-tools';
    if (view === 'other-document-tools') view = 'category-other-document-tools';

    // Auto-resolve tool instance if view matches a tool slug or id
    const isBlogView = view === 'blog' || view.startsWith('blog/');
    const isHindiView = view === 'hi' || view.startsWith('hi/');
    if (
      !tool &&
      !isBlogView &&
      !isHindiView &&
      !['home', 'about', 'contact', 'privacy', 'terms', 'disclaimer', 'directory', 'cookie-policy', 'cookies'].includes(view) &&
      !view.startsWith('category-')
    ) {
      const matched = getToolBySlug(view);
      if (matched) {
        tool = matched;
        view = `tool-${matched.id}`;
      }
    }

    setCurrentView(view);
    if (tool) {
      setActiveTool(tool);
      setActiveToolContext({ id: tool.id, title: tool.title, category: tool.category });
      updatePageSeoMetadata(tool, `tool-${tool.id}`);
      trackToolOpen(tool.id, tool.title, tool.category);

      // Track recently used tools in local storage
      try {
        const stored = localStorage.getItem('pottotools_recent_tools') || localStorage.getItem('docuease_recent_tools');
        const list: string[] = stored ? JSON.parse(stored) : [];
        const updated = [tool.id, ...list.filter((id) => id !== tool.id)].slice(0, 8);
        localStorage.setItem('pottotools_recent_tools', JSON.stringify(updated));
      } catch {
        // Continue
      }

      const path = `/${tool.slug}`;
      if (replaceState) {
        window.history.replaceState({ view, toolId: tool.id }, '', path);
      } else {
        window.history.pushState({ view, toolId: tool.id }, '', path);
      }
    } else {
      setActiveTool(null);
      setActiveToolContext(null);
      let path = '/';
      if (['privacy', 'terms', 'about', 'contact', 'disclaimer', 'directory', 'cookie-policy', 'cookies'].includes(view)) {
        path = view === 'cookies' ? '/cookie-policy' : `/${view}`;
      } else if (isBlogView || isHindiView) {
        path = `/${view}`;
      } else if (view.startsWith('category-')) {
        const rawCatId = view.replace('category-', '');
        const catId = rawCatId === 'compress-pdf' ? 'pdf-tools' : rawCatId;
        setSelectedCategory(catId);
        path = `/${catId}`;
      }

      updatePageSeoMetadata(null, view);
      if (replaceState) {
        window.history.replaceState({ view }, '', path);
      } else {
        window.history.pushState({ view }, '', path);
      }
    }

    // Scroll to top instantly and reliably
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Reset viewport to top and emit SPA virtual page_view event whenever route or active tool changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const currentPath = window.location.pathname || '/';
    const lang = currentPath === '/hi' || currentPath.startsWith('/hi/') ? 'hi' : 'en';
    trackPageView(currentPath, document.title, lang);
  }, [currentView, activeTool?.id]);

  // Handle URL deep-linking on initial load and popstate
  useEffect(() => {
    const handlePopState = () => {
      let pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').toLowerCase();
      if (!pathname) {
        setCurrentView('home');
        setActiveTool(null);
        setActiveToolContext(null);
        updatePageSeoMetadata(null, 'home');
        return;
      }

      // Route aliases
      if (pathname === 'about-us') pathname = 'about';
      if (pathname === 'contact-us') pathname = 'contact';
      if (pathname === 'all-tools') pathname = 'directory';
      if (pathname === 'convert-documents') pathname = 'convert-docs';
      if (pathname === 'cookies') pathname = 'cookie-policy';

      if (pathname === 'blog' || pathname.startsWith('blog/')) {
        setCurrentView(pathname);
        setActiveTool(null);
        setActiveToolContext(null);
        updatePageSeoMetadata(null, pathname);
        return;
      }

      if (pathname === 'hi' || pathname.startsWith('hi/')) {
        const hiConfig = getHindiPageBySlug(pathname);
        if (hiConfig) {
          setCurrentView(pathname);
          setActiveTool(null);
          setActiveToolContext(null);
          updatePageSeoMetadata(null, pathname);
          return;
        }
      }

      if (['privacy', 'terms', 'about', 'contact', 'disclaimer', 'directory', 'cookie-policy'].includes(pathname)) {
        setCurrentView(pathname);
        setActiveTool(null);
        setActiveToolContext(null);
        updatePageSeoMetadata(null, pathname);
        return;
      }

      if (pathname === 'gov-tools' || pathname === 'category-gov-tools') {
        setSelectedCategory('image-tools');
        setCurrentView('category-image-tools');
        setActiveTool(null);
        setActiveToolContext(null);
        updatePageSeoMetadata(null, 'category-image-tools');
        window.history.replaceState({ view: 'category-image-tools' }, '', '/image-tools');
        return;
      }

      if (pathname === 'category-compress-pdf') {
        setSelectedCategory('pdf-tools');
        setCurrentView('category-pdf-tools');
        setActiveTool(null);
        setActiveToolContext(null);
        updatePageSeoMetadata(null, 'category-pdf-tools');
        window.history.replaceState({ view: 'category-pdf-tools' }, '', '/pdf-tools');
        return;
      }

      // Check for category routes (both the 8 original categories and the 6 document categories)
      const categorySlugs = [
        'organize-pdf',
        'convert-docs',
        'convert-images',
        'ocr-scanned',
        'pdf-security',
        'smart-utilities',
        'spreadsheets',
        'category-compress-pdf',
        'pdf-tools',
        'word-tools',
        'excel-tools',
        'powerpoint-tools',
        'image-tools',
        'other-document-tools',
      ];
      if (categorySlugs.includes(pathname) || pathname.startsWith('category-')) {
        const catId = pathname.replace('category-', '');
        setSelectedCategory(catId);
        setCurrentView(`category-${catId}`);
        setActiveTool(null);
        setActiveToolContext(null);
        updatePageSeoMetadata(null, `category-${catId}`);
        return;
      }

      const matchedTool = getToolBySlug(pathname);
      if (matchedTool) {
        setActiveTool(matchedTool);
        setActiveToolContext({ id: matchedTool.id, title: matchedTool.title, category: matchedTool.category });
        setCurrentView(`tool-${matchedTool.id}`);
        updatePageSeoMetadata(matchedTool, `tool-${matchedTool.id}`);
        trackToolOpen(matchedTool.id, matchedTool.title, matchedTool.category);
      } else {
        setCurrentView('not-found');
        setActiveTool(null);
        setActiveToolContext(null);
        document.title = `404 Page Not Found | ${SITE_CONFIG.name}`;
      }
    };

    // Deep link check on first mount
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTool = (tool: ToolDefinition) => {
    navigateTo(`tool-${tool.id}`, tool);
  };

  const handleSelectShortcut = (toolSlug: string) => {
    const matched = getToolBySlug(toolSlug);
    if (matched) {
      handleSelectTool(matched);
    }
  };

  const filteredTools = searchQuery.trim() ? searchTools(searchQuery) : TOOLS;

  // Render dedicated tool component based on tool category and ID
  const renderActiveToolComponent = (tool: ToolDefinition) => {
    if (tool.id === 'compress-pdf') {
      return <PdfCompressorTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (tool.id === 'searchable-pdf-text-finder') {
      return <SearchablePdfTextFinderTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (tool.id === 'pdf-page-organizer') {
      return <PdfPageOrganizerTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (
      ['merge-pdf', 'split-pdf', 'delete-pdf-pages', 'watermark-pdf', 'page-numbers-pdf'].includes(
        tool.id
      )
    ) {
      return <PdfOrganizeTool tool={tool} />;
    }

    if (
      [
        'custom-photo-resizer',
        'photo-size-compressor',
        'photo-signature-resizer',
        'photo-editor',
        'hd-image-enhancer',
        'image-format-converter',
        'crop-rotate-straighten',
        'photo-background-changer',
      ].includes(tool.id)
    ) {
      return <PhotoStudioWorkspace tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (['passport-photo-cropper', 'combine-app-documents'].includes(tool.id)) {
      return <GovPhotoResizerTool tool={tool} />;
    }

    if (tool.id === 'pdf-to-editable-word') {
      return <PdfToEditableWordTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (
      ['pdf-to-word', 'word-to-pdf', 'docx-to-txt', 'docx-to-html', 'txt-to-pdf', 'markdown-to-pdf'].includes(
        tool.id
      )
    ) {
      return <DocumentConverterTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (['powerpoint-to-pdf', 'pptx-to-txt'].includes(tool.id)) {
      return <PowerPointTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (['image-converter', 'image-to-pdf', 'pdf-to-images', 'jpg-to-png', 'png-to-jpg'].includes(tool.id)) {
      return <ImageConverterTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (tool.id === 'ocr-tool') {
      return <OcrTool tool={tool} />;
    }

    if (tool.id === 'pdf-id-redactor') {
      return <PdfRedactorTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (tool.id === 'remove-scan-watermark') {
      return <RemoveScanWatermarkTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (tool.id === 'fill-pdf-form') {
      return <FillPdfFormTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (['protect-pdf', 'unlock-pdf', 'sign-pdf', 'pdf-metadata'].includes(tool.id)) {
      return <PdfSecurityTool tool={tool} onSelectNextTool={handleSelectTool} />;
    }

    if (['csv-to-xlsx', 'xlsx-to-csv', 'sheet-viewer', 'excel-to-pdf', 'pdf-to-excel'].includes(tool.id)) {
      return <SpreadsheetTool tool={tool} />;
    }

    if (['pdf-text-extractor', 'text-diff-comparator', 'text-cleaner'].includes(tool.id)) {
      return <SmartTextTools tool={tool} />;
    }

    // Default fallback to organizer
    return <PdfOrganizeTool tool={tool} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] dark:bg-[#111322] text-[#252536] dark:text-[#F2F4FC]">
      {/* 3-Zone Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onSelectTool={handleSelectTool}
      />

      {/* Main Content Viewport */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <AppErrorBoundary viewKey={`${currentView}-${activeTool?.id || ''}`} onResetHome={() => navigateTo('home')}>
        <div key={`${currentView}-${activeTool?.id || ''}`} className="pt-page-enter">
        {currentView === 'home' ? (
          <div className="space-y-6">
            <HeroSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectShortcut={handleSelectShortcut}
              onSelectTool={handleSelectTool}
              onExploreAll={() => navigateTo('directory')}
            />

            {/* Ad Placement: Top Leaderboard Banner */}
            {!MONETIZATION_CONFIG.autoAdsOnly && (
              <div className="w-full max-w-5xl mx-auto my-2 px-2">
                <AdSlot placement="home-top-banner" format="horizontal" minHeight={90} />
              </div>
            )}

            {/* Main Categories Section: 3 shortcut cards */}
            <MainCategoriesSection
              onSelectCategoryPage={(catId) => navigateTo(`category-${catId}`)}
              onExploreAll={() => navigateTo('directory')}
            />

            {/* Problem-Solver Tasks & Direct Goal Shortcuts */}
            <CommonTasksSection onSelectTool={handleSelectTool} />

            {/* Ad Placement: Mid-Page Content Leaderboard (728x90 Desktop / 320x50 Mobile) */}
            {!MONETIZATION_CONFIG.autoAdsOnly && (
              <div className="w-full max-w-5xl mx-auto my-4 px-2">
                <AdSlot placement="home-mid-tools" format="horizontal" minHeight={90} />
              </div>
            )}
            <div className="w-full max-w-5xl mx-auto my-4 px-2">
              <AdsterraBanner variant="responsive-leaderboard" placement="home-mid-tools" />
            </div>

            {/* Why Choose PottoTools? Section */}
            <WhyChooseSection />

            {/* Offline PWA Capability Highlight - Works Without Internet */}
            <div className="w-full max-w-5xl mx-auto px-2">
              <OfflinePwaHighlightSection />
            </div>

            {/* 5-Step How It Works Section */}
            <HowItWorksSection />

            {/* In-Depth Search Content, Pillar Guides & Comparison Hub */}
            <SearchContentSection
              onSelectTool={handleSelectTool}
              onSelectCategory={(catId) => navigateTo(`category-${catId}`)}
              onExploreAll={() => navigateTo('directory')}
            />

            {/* Ad Placement: Pre-Footer Leaderboard & Adsterra Native Banner */}
            {!MONETIZATION_CONFIG.autoAdsOnly && (
              <div className="w-full max-w-5xl mx-auto my-4 px-2">
                <AdSlot placement="home-pre-footer" format="horizontal" minHeight={90} />
              </div>
            )}
            <div className="w-full max-w-5xl mx-auto my-6 px-2">
              <AdsterraNativeBanner placement="home-pre-footer" />
            </div>

            {/* Frequently Asked Questions */}
            <FaqSection />
          </div>
        ) : currentView.startsWith('category-') ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <CategoryPage
              categoryId={currentView.replace('category-', '')}
              tools={TOOLS}
              onSelectTool={handleSelectTool}
              onNavigateHome={() => navigateTo('home')}
              onNavigateCategory={(catId) => navigateTo(`category-${catId}`)}
            />
          </React.Suspense>
        ) : activeTool ? (
          /* Dedicated Tool Page */
          <div className="py-6 sm:py-8">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/', onClick: () => navigateTo('home') },
                {
                  label: activeTool.categoryName,
                  href: `/${activeTool.category === 'compress-pdf' ? 'pdf-tools' : activeTool.category}`,
                  onClick: () =>
                    navigateTo(
                      activeTool.category === 'compress-pdf'
                        ? 'category-pdf-tools'
                        : `category-${activeTool.category}`
                    ),
                },
                { label: activeTool.title },
              ]}
            />

            {/* Tool Top Banner Placement (728x90 Desktop / 320x50 Mobile) */}
            {!MONETIZATION_CONFIG.autoAdsOnly && (
              <div className="mb-6">
                <AdSlot placement="tool-top-banner" format="horizontal" minHeight={90} />
              </div>
            )}
            <div className="mb-6">
              <AdsterraBanner
                key={`tool-top-${activeTool.slug}`}
                variant="responsive-leaderboard"
                placement="tool-top-banner"
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 w-full min-w-0">
                {/* 3-Step Visual Workflow & Before -> Action -> After Explanation */}
                <ToolDetailVisualHeader tool={activeTool} />

                <React.Suspense fallback={<ToolSkeleton />}>
                  {renderActiveToolComponent(activeTool)}
                </React.Suspense>

                {/* Below Tool Working Area Ad Placement (300x250 High-RPM Rectangle) */}
                {!MONETIZATION_CONFIG.autoAdsOnly && (
                  <div className="mt-8">
                    <AdSlot placement="tool-working-bottom" format="horizontal" minHeight={90} />
                  </div>
                )}
                <div className="mt-8">
                  <AdsterraBanner
                    key={`tool-rect-${activeTool.slug}`}
                    variant="rectangle"
                    placement="tool-working-bottom"
                  />
                </div>

                {/* Pre-FAQ Section Ad Placement */}
                {!MONETIZATION_CONFIG.autoAdsOnly && (
                  <div className="mt-6">
                    <AdSlot placement="tool-pre-faq" format="horizontal" minHeight={90} />
                  </div>
                )}
                <div className="mt-8">
                  <AdsterraNativeBanner key={activeTool.slug} placement="tool-pre-faq" />
                </div>

                {/* Comprehensive Tool SEO & Value Proposition Section */}
                <ToolSeoContentSection
                  tool={activeTool}
                  onSelectTool={handleSelectTool}
                  onNavigate={(view) => navigateTo(view)}
                />
              </div>

              {/* In-Page Tool Sidebar */}
              <AdPlaceholder format="tool-sidebar" />
            </div>
          </div>
        ) : currentView === 'blog' || currentView.startsWith('blog/') ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <BlogPage
              slug={currentView.startsWith('blog/') ? currentView.replace('blog/', '') : undefined}
              onNavigateHome={() => navigateTo('home')}
              onNavigateBlog={(s?: string) => navigateTo(s ? `blog/${s}` : 'blog')}
              onSelectTool={handleSelectTool}
            />
          </React.Suspense>
        ) : (currentView === 'hi' || currentView.startsWith('hi/')) && getHindiPageBySlug(currentView) ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <HindiLandingPage
              config={getHindiPageBySlug(currentView)!}
              onNavigateHome={() => navigateTo('home')}
              onNavigateHindi={(s: string) => navigateTo(s)}
              onSelectTool={handleSelectTool}
              onNavigateEnglishSlug={(enSlug: string) => navigateTo(enSlug || 'home')}
            />
          </React.Suspense>
        ) : currentView === 'privacy' ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <PrivacyPolicy />
          </React.Suspense>
        ) : currentView === 'terms' ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <TermsOfUse />
          </React.Suspense>
        ) : currentView === 'about' ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <AboutPage
              onNavigateDirectory={() => navigateTo('directory')}
              onNavigateBlog={() => navigateTo('blog')}
            />
          </React.Suspense>
        ) : currentView === 'contact' ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <ContactPage />
          </React.Suspense>
        ) : currentView === 'disclaimer' ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <DisclaimerPage />
          </React.Suspense>
        ) : currentView === 'cookie-policy' || currentView === 'cookies' ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <CookiePolicy />
          </React.Suspense>
        ) : currentView === 'directory' ? (
          <React.Suspense fallback={<ToolSkeleton />}>
            <DirectoryPage onSelectTool={handleSelectTool} onNavigate={(view) => navigateTo(view)} />
          </React.Suspense>
        ) : (
          /* 404 Custom Fallback */
          <div className="max-w-lg mx-auto py-16 px-4 text-center">
            <div className="bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-3xl p-8 sm:p-10 shadow-[0_12px_32px_-20px_rgba(37,37,54,0.16)]">
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#FFE9DA] dark:bg-[#3A2218] text-[#8E3914] dark:text-[#FFB894] border border-[#F5BEA0] dark:border-[#593424] rounded-full mb-4">
                HTTP 404 Not Found
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252536] dark:text-[#F2F4FC] mb-2">
                Page Not Found
              </h1>
              <p className="text-sm text-[#777789] dark:text-[#A0A5C0] mb-6 leading-relaxed">
                The requested document tool or page does not exist or may have been moved.
              </p>
              <a
                href="/"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    navigateTo('home');
                  }
                }}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[#5B50E6] hover:bg-[#4A3FD4] text-white rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer no-underline"
              >
                Return to Homepage
              </a>

              <div className="mt-8 pt-6 border-t border-[#F0EEF8] dark:border-[#262B45]">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#777789] dark:text-[#A0A5C0] mb-3">
                  Popular Free Tools
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { name: 'Compress PDF', slug: 'compress-pdf' },
                    { name: 'Fill PDF Form', slug: 'fill-pdf-form' },
                    { name: 'Photo Resizer', slug: 'custom-photo-studio' },
                    { name: 'PDF to Word', slug: 'pdf-to-word' },
                  ].map((item) => (
                    <a
                      key={item.slug}
                      href={`/${item.slug}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          handleSelectShortcut(item.slug);
                        }
                      }}
                      className="text-xs font-semibold text-[#4B3A9D] dark:text-[#C5BAFF] bg-[#E9E4FF] dark:bg-[#231F44] border border-[#CFC5FA] dark:border-[#373164] px-3 py-1.5 rounded-lg hover:brightness-95 transition-all cursor-pointer no-underline"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
        </AppErrorBoundary>
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(view) => navigateTo(view)}
        onSelectTool={handleSelectTool}
      />

      {/* Real-Time Connectivity / Offline Status Badge */}
      <OfflineIndicator />

      {/* Global Interactive Toast Notification System */}
      <ToastContainer />
    </div>
  );
}
