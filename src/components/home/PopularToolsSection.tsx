import React from 'react';
import { ToolDefinition, getToolBySlug } from '../../config/toolsRegistry';
import { preloadTool } from '../../services/utils/toolPreloader';
import {
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle,
  Minimize2,
  Layers,
  Maximize2,
  Images,
  EyeOff,
} from 'lucide-react';
import { getToolVisualSpec } from '../../config/toolVisualMetadata';

interface PopularToolsSectionProps {
  onSelectTool: (tool: ToolDefinition) => void;
}

export const PopularToolsSection: React.FC<PopularToolsSectionProps> = ({ onSelectTool }) => {
  const popularSlugs = [
    {
      slug: 'pdf-id-redactor',
      icon: EyeOff,
      badge: '🛡️ Unique Offline Privacy',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      gradient: 'from-emerald-600 to-teal-600',
      bgTint: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20',
      benefit: 'Permanently blackout or pixel-blur Aadhaar, bank accounts & salary info offline in-browser.',
      metric: '0 KB Uploaded · Text Destroyed',
    },
    {
      slug: 'compress-pdf',
      icon: Minimize2,
      badge: '🔥 Most Popular',
      badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      gradient: 'from-rose-500 to-orange-500',
      bgTint: 'hover:border-rose-300 dark:hover:border-rose-700',
      btnGradient: 'from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 shadow-rose-500/20',
      benefit: 'Shrink PDFs to 100KB, 200KB or 500KB while preserving crisp fonts and images.',
      metric: 'Up to 90% size reduction',
    },
    {
      slug: 'merge-pdf',
      icon: Layers,
      badge: '⚡ Everyday Essential',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      gradient: 'from-blue-600 to-indigo-600',
      bgTint: 'hover:border-blue-300 dark:hover:border-blue-700',
      btnGradient: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20',
      benefit: 'Combine multiple PDF documents into one clean, ordered file with instant drag-and-drop.',
      metric: 'Fast · Lossless merge',
    },
    {
      slug: 'pdf-to-editable-word',
      icon: Sparkles,
      badge: '✨ NEW • Editable Text + Layout',
      badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
      gradient: 'from-indigo-600 via-blue-600 to-cyan-600',
      bgTint: 'hover:border-indigo-300 dark:hover:border-indigo-700',
      btnGradient: 'from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/20',
      benefit: 'Convert PDFs to 100% editable Word (.docx) preserving menus, prices, food photos, and OCR.',
      metric: 'Layout + Images + OCR',
    },
    {
      slug: 'custom-photo-studio',
      icon: Maximize2,
      badge: '🖼️ Precision Resizing',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      gradient: 'from-emerald-500 to-teal-500',
      bgTint: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20',
      benefit: 'Resize JPG, PNG, and WebP by pixels, inches, cm, or mm with live preview and DPI control.',
      metric: 'Lanczos quality · Custom DPI',
    },
    {
      slug: 'image-to-pdf',
      icon: Images,
      badge: '✨ Instant Convert',
      badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900',
      gradient: 'from-purple-600 to-pink-600',
      bgTint: 'hover:border-purple-300 dark:hover:border-purple-700',
      btnGradient: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/20',
      benefit: 'Turn JPG, PNG, and camera photos into standardized multi-page PDF documents.',
      metric: 'Auto-margins & A4 alignment',
    },
  ];

  const tools = popularSlugs
    .map((item) => {
      const toolDef = getToolBySlug(item.slug);
      return toolDef ? { ...item, toolDef } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section id="popular-tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/40 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Productivity Essentials</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Most Popular Tools
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            The most popular tools millions of students, creators, and professionals use daily. Free, fast, and 100% private.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Processed locally in your browser</span>
        </div>
      </div>

      {/* 6-Card Balanced Vibrant Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((item) => {
          const { toolDef, icon: IconComp } = item;

          return (
            <a
              key={toolDef.id}
              href={`/${toolDef.slug}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onSelectTool(toolDef);
                }
              }}
              onMouseEnter={() => preloadTool(toolDef.id)}
              onTouchStart={() => preloadTool(toolDef.id)}
              onFocus={() => preloadTool(toolDef.id)}
              className={`group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer no-underline ${item.bgTint}`}
            >
              <div>
                {/* Top Row: Badge & Accent Icon */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeClass}`}
                  >
                    {item.badge}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.gradient} text-white shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                </div>

                {/* Before -> Action -> After Visual Stage */}
                <div className="w-full h-18 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 p-2 flex items-center justify-center mb-3 overflow-hidden shadow-2xs">
                  {React.createElement(getToolVisualSpec(toolDef.id, toolDef.title).visual)}
                </div>

                {/* Action Label */}
                <div className="mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {getToolVisualSpec(toolDef.id).actionLabel}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {toolDef.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {item.benefit}
                </p>

                {/* Feature Metric */}
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{item.metric}</span>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
                <div
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r ${item.btnGradient} shadow-md flex items-center justify-center gap-2 group-hover:gap-3 transition-all`}
                >
                  <span>Use Tool Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};
