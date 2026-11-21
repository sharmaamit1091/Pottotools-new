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
      badgeColor: 'bg-[#FFE9DA] text-[#8E3914] dark:bg-[#3B261E] dark:text-[#FFD2B5] border-[#F5BEA0] dark:border-[#6A4132]',
      description: 'Compress, fill forms, merge, split, reorder, protect, and extract pages from your PDF documents.',
      features: [
        'Compress PDF to target KB/MB',
        'Fill PDF forms with text, photo & signature',
        'Merge & split PDFs in custom order',
        'Visual page organizer & smart rotator',
        'Protect & redact confidential documents',
      ],
      icon: Layers,
      iconTile: 'bg-[#FFE9DA] text-[#9A4319] dark:bg-[#3B261E] dark:text-[#FFD2B5] border-[#F5BEA0] dark:border-[#6A4132]',
      borderHover: 'hover:border-[#EAB89B] dark:hover:border-[#7B5244]',
      btnColor: 'bg-[#FFE9DA] hover:bg-[#E86D42] text-[#8E3914] hover:text-white dark:bg-[#3B261E] dark:text-[#FFD2B5] dark:hover:bg-[#E86D42] dark:hover:text-white border border-[#F5BEA0] dark:border-[#6A4132]',
      categoryId: 'pdf-tools',
    },
    {
      id: 'image-tools',
      title: 'Image Tools',
      badge: 'Photo Studio',
      badgeColor: 'bg-[#DDF5E9] text-[#156340] dark:bg-[#17362A] dark:text-[#B4EED1] border-[#BCEBD4] dark:border-[#2A634C]',
      description: 'Resize, compress, convert, enhance, and crop photos with precise dimension controls.',
      features: [
        'Custom photo resizer (px, cm, mm, in)',
        'Compress photo to exact target KB',
        'Convert between JPG, PNG, and WebP',
        'HD image enhancer & color filters',
        'Official exam & passport photo cropper',
      ],
      icon: ImageIcon,
      iconTile: 'bg-[#DDF5E9] text-[#156340] dark:bg-[#17362A] dark:text-[#B4EED1] border-[#BCEBD4] dark:border-[#2A634C]',
      borderHover: 'hover:border-[#93D9B6] dark:hover:border-[#3E7661]',
      btnColor: 'bg-[#DDF5E9] hover:bg-[#1E8E5E] text-[#156340] hover:text-white dark:bg-[#17362A] dark:text-[#B4EED1] dark:hover:bg-[#1E8E5E] dark:hover:text-white border border-[#BCEBD4] dark:border-[#2A634C]',
      categoryId: 'image-tools',
    },
    {
      id: 'convert-docs',
      title: 'Document Conversion',
      badge: 'Multi-Format',
      badgeColor: 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border-[#B2D7FB] dark:border-[#325785]',
      description: 'Convert between Word (.docx), Excel (.xlsx), PowerPoint (.pptx), text, and PDF formats.',
      features: [
        'Convert PDF to editable Word (.docx)',
        'Convert Word (.docx) to PDF',
        'Excel spreadsheets & CSV converters',
        'PowerPoint slides to PDF & text',
        'OCR scanner for scanned documents',
      ],
      icon: FileText,
      iconTile: 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border-[#B2D7FB] dark:border-[#325785]',
      borderHover: 'hover:border-[#9EC9F7] dark:hover:border-[#45689E]',
      btnColor: 'bg-[#DDEEFF] hover:bg-[#2F72C8] text-[#1A528C] hover:text-white dark:bg-[#1B314E] dark:text-[#B9DCFF] dark:hover:bg-[#2F72C8] dark:hover:text-white border border-[#B2D7FB] dark:border-[#325785]',
      categoryId: 'convert-docs',
    },
  ];

  return (
    <section aria-label="Main Tool Categories" className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E9E4FF] dark:bg-[#2B244E] text-xs font-bold text-[#4B3A9D] dark:text-[#D5CCFF] border border-[#CFC5FA] dark:border-[#4D4287]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Main Categories</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
          Explore Our Main Categories
        </h2>
        <p className="text-sm text-[#777789] dark:text-[#A0A5C0]">
          Pick a category below to quickly find the right PDF, photo, or document tool.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`pt-card-hover group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] p-6 sm:p-7 ${cat.borderHover}`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform duration-250 group-hover:scale-105 ${cat.iconTile}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
                  {cat.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#777789] dark:text-[#A0A5C0] mt-2 leading-relaxed">
                  {cat.description}
                </p>

                <div className="mt-5 pt-4 border-t border-[#F1EFF8] dark:border-[#242942] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#777789] dark:text-[#8E93B2]">
                    What You Can Do:
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#55556B] dark:text-[#C5CAE0]">
                    {cat.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#1E8E5E] dark:text-emerald-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F1EFF8] dark:border-[#242942]">
                <a
                  href={`/${cat.categoryId}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onSelectCategoryPage(cat.categoryId);
                    }
                  }}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer no-underline active:scale-[0.98] ${cat.btnColor}`}
                >
                  <span>Explore {cat.title}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#5B50E6] dark:text-[#A49CFF] hover:underline cursor-pointer"
        >
          <span>Looking for something else? View all {TOOLS.length} tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
};
