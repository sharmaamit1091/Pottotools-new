import React from 'react';
import { Layers, Image as ImageIcon, FileText, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { TOOLS } from '../../config/toolsRegistry';

interface MainCategoriesSectionProps {
  onSelectCategoryPage: (categoryId: string) => void;
  onExploreAll: () => void;
}

export const MainCategoriesSection: React.FC<MainCategoriesSectionProps> = ({
  onSelectCategoryPage,
  onExploreAll,
}) => {
  const categories = [
    {
      id: 'pdf-tools',
      title: 'PDF Tools',
      badge: 'Most Popular',
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      description: 'Compress, merge, split, reorder, protect, and extract pages from your PDF documents.',
      features: [
        'Compress PDF to target KB/MB',
        'Merge multiple PDFs in custom order',
        'Split & extract specific page ranges',
        'Visual page organizer & rotator',
        'Protect & sign confidential documents',
      ],
      icon: Layers,
      gradient: 'from-rose-500 to-red-600',
      borderHover: 'hover:border-rose-300 dark:hover:border-rose-700',
      btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      categoryId: 'pdf-tools',
    },
    {
      id: 'image-tools',
      title: 'Image Tools',
      badge: 'Photo Studio',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      description: 'Resize, compress, convert, enhance, and crop photos with precise dimension controls.',
      features: [
        'Custom photo resizer (px, cm, mm, in)',
        'Compress photo to exact target KB',
        'Convert between JPG, PNG, and WebP',
        'HD image enhancer & color filters',
        'Official exam & passport photo cropper',
      ],
      icon: ImageIcon,
      gradient: 'from-emerald-500 to-teal-600',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      categoryId: 'image-tools',
    },
    {
      id: 'convert-docs',
      title: 'Document Conversion',
      badge: 'Multi-Format',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      description: 'Convert between Word (.docx), Excel (.xlsx), PowerPoint (.pptx), text, and PDF formats.',
      features: [
        'Convert PDF to editable Word (.docx)',
        'Convert Word (.docx) to PDF',
        'Excel spreadsheets & CSV converters',
        'PowerPoint slides to PDF & text',
        'OCR scanner for scanned documents',
      ],
      icon: FileText,
      gradient: 'from-blue-600 to-indigo-600',
      borderHover: 'hover:border-blue-300 dark:hover:border-blue-700',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      categoryId: 'convert-docs',
    },
  ];

  return (
    <section aria-label="Main Tool Categories" className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Main Categories</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
          Explore Our Main Categories
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pick a category below to quickly find the right PDF, photo, or document tool.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-200 ${cat.borderHover}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                  {cat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {cat.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    What You Can Do:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {cat.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={`/${cat.categoryId}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onSelectCategoryPage(cat.categoryId);
                    }
                  }}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer no-underline ${cat.btnColor}`}
                >
                  <span>Explore {cat.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <a
          href="/directory"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
              e.preventDefault();
              onExploreAll();
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer"
        >
          <span>Looking for something else? View all {TOOLS.length} tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
};
