import React from 'react';
import {
  Layers,
  Image as ImageIcon,
  FileText,
  Sheet,
  Presentation,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { DOCUMENT_NAV_CATEGORIES } from '../../config/toolsRegistry';

interface MainCategoriesSectionProps {
  onSelectCategoryPage: (categoryId: string) => void;
}

export const MainCategoriesSection: React.FC<MainCategoriesSectionProps> = ({
  onSelectCategoryPage,
}) => {
  const getCount = (catId: string) =>
    DOCUMENT_NAV_CATEGORIES.find((c) => c.id === catId)?.toolIds.length || 0;

  const categories = [
    {
      id: 'pdf-tools',
      title: 'PDF Tools',
      badge: `${getCount('pdf-tools')} Tools`,
      badgeColor: 'bg-[#FFE9DA] text-[#8E3914] dark:bg-[#3B261E] dark:text-[#FFD2B5] border-[#F5BEA0] dark:border-[#6A4132]',
      description: 'Fill forms, compress, merge, split, organize, lock, sign, redact, and run OCR on PDFs.',
      features: [
        'Fill PDF forms directly by clicking & typing',
        'Compress PDF to 100KB, 200KB, or custom size',
        'Merge, split, reorder & rotate pages up to 500 MB',
        'Protect, unlock, sign, redact & clean metadata',
      ],
      icon: Layers,
      iconTile: 'bg-[#FFE9DA] text-[#9A4319] dark:bg-[#3B261E] dark:text-[#FFD2B5] border-[#F5BEA0] dark:border-[#6A4132]',
      borderHover: 'hover:border-[#EAB89B] dark:hover:border-[#7B5244]',
      btnColor: 'bg-[#FFE9DA] hover:bg-[#E86D42] text-[#8E3914] hover:text-white dark:bg-[#3B261E] dark:text-[#FFD2B5] dark:hover:bg-[#E86D42] dark:hover:text-white border border-[#F5BEA0] dark:border-[#6A4132]',
      categoryId: 'pdf-tools',
    },
    {
      id: 'word-tools',
      title: 'Word Tools',
      badge: `${getCount('word-tools')} Tools`,
      badgeColor: 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border-[#B2D7FB] dark:border-[#325785]',
      description: 'Convert between Microsoft Word (.docx), PDF, HTML, plain text, and Markdown.',
      features: [
        'PDF to editable Word (.docx) with OCR',
        'Word (.docx) to clean print-ready PDF',
        'DOCX to clean semantic HTML or plain text',
        'Text & Markdown (.md) to formatted PDF',
      ],
      icon: FileText,
      iconTile: 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border-[#B2D7FB] dark:border-[#325785]',
      borderHover: 'hover:border-[#9EC9F7] dark:hover:border-[#45689E]',
      btnColor: 'bg-[#DDEEFF] hover:bg-[#2F72C8] text-[#1A528C] hover:text-white dark:bg-[#1B314E] dark:text-[#B9DCFF] dark:hover:bg-[#2F72C8] dark:hover:text-white border border-[#B2D7FB] dark:border-[#325785]',
      categoryId: 'word-tools',
    },
    {
      id: 'excel-tools',
      title: 'Excel Tools',
      badge: `${getCount('excel-tools')} Tools`,
      badgeColor: 'bg-[#DDF5E9] text-[#156340] dark:bg-[#17362A] dark:text-[#B4EED1] border-[#BCEBD4] dark:border-[#2A634C]',
      description: 'Convert Excel & CSV spreadsheets, extract PDF tables, and view sheets without Office.',
      features: [
        'Excel (.xlsx / .xls) & CSV to landscape PDF',
        'Extract delimited PDF tables to Excel (.xlsx)',
        'Convert between CSV and Excel (.xlsx)',
        'Interactive in-browser Excel & CSV viewer',
      ],
      icon: Sheet,
      iconTile: 'bg-[#DDF5E9] text-[#156340] dark:bg-[#17362A] dark:text-[#B4EED1] border-[#BCEBD4] dark:border-[#2A634C]',
      borderHover: 'hover:border-[#93D9B6] dark:hover:border-[#3E7661]',
      btnColor: 'bg-[#DDF5E9] hover:bg-[#1E8E5E] text-[#156340] hover:text-white dark:bg-[#17362A] dark:text-[#B4EED1] dark:hover:bg-[#1E8E5E] dark:hover:text-white border border-[#BCEBD4] dark:border-[#2A634C]',
      categoryId: 'excel-tools',
    },
    {
      id: 'powerpoint-tools',
      title: 'PowerPoint Tools',
      badge: `${getCount('powerpoint-tools')} Tool`,
      badgeColor: 'bg-[#FFF2C9] text-[#7E520A] dark:bg-[#3A2E14] dark:text-[#FFE49B] border-[#F1D583] dark:border-[#6E5623]',
      description: 'Turn PowerPoint (.pptx) presentation slide decks into neat landscape PDF handouts.',
      features: [
        'Extract PPTX slide titles & bullet points',
        'Clean A4 landscape PDF text-card layout',
        '100% browser-local processing for private decks',
      ],
      icon: Presentation,
      iconTile: 'bg-[#FFF2C9] text-[#7E520A] dark:bg-[#3A2E14] dark:text-[#FFE49B] border-[#F1D583] dark:border-[#6E5623]',
      borderHover: 'hover:border-[#E8CB7B] dark:hover:border-[#73623B]',
      btnColor: 'bg-[#FFF2C9] hover:bg-[#C68A12] text-[#7E520A] hover:text-white dark:bg-[#3A2E14] dark:text-[#FFE49B] dark:hover:bg-[#C68A12] dark:hover:text-white border border-[#F1D583] dark:border-[#6E5623]',
      categoryId: 'powerpoint-tools',
    },
    {
      id: 'image-tools',
      title: 'Image Tools',
      badge: `${getCount('image-tools')} Tools`,
      badgeColor: 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF] border-[#CFC5FA] dark:border-[#4D4287]',
      description: 'Resize, crop, compress to target KB, prepare exam/passport photos, and convert formats.',
      features: [
        'Custom Photo Studio (px, cm, mm, crop, adjust)',
        'Photo compressor to exact 20KB / 50KB / 100KB',
        'UPSC, SSC, IBPS & Passport photo/sign presets',
        'Convert JPG, PNG, WebP, BMP & Images to PDF',
      ],
      icon: ImageIcon,
      iconTile: 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF] border-[#CFC5FA] dark:border-[#4D4287]',
      borderHover: 'hover:border-[#B9ACFA] dark:hover:border-[#5D509C]',
      btnColor: 'bg-[#E9E4FF] hover:bg-[#5B50E6] text-[#4B3A9D] hover:text-white dark:bg-[#2B244E] dark:text-[#D5CCFF] dark:hover:bg-[#5B50E6] dark:hover:text-white border border-[#CFC5FA] dark:border-[#4D4287]',
      categoryId: 'image-tools',
    },
    {
      id: 'other-document-tools',
      title: 'Other Tools',
      badge: `${getCount('other-document-tools')} Tools`,
      badgeColor: 'bg-[#DDEEFF] text-[#1A5878] dark:bg-[#193342] dark:text-[#BEE5FA] border-[#B7DDF5] dark:border-[#315D76]',
      description: 'Standalone text utilities for proofreading, comparing revisions, and cleaning formatting.',
      features: [
        'Compare two texts side-by-side with diff highlights',
        'Clean extra spaces, blank lines & broken wraps',
        'Convert UPPERCASE, lowercase & Title Case',
      ],
      icon: Sparkles,
      iconTile: 'bg-[#DDEEFF] text-[#1A5878] dark:bg-[#193342] dark:text-[#BEE5FA] border-[#B7DDF5] dark:border-[#315D76]',
      borderHover: 'hover:border-[#9EC9F7] dark:hover:border-[#45689E]',
      btnColor: 'bg-[#DDEEFF] hover:bg-[#1B9AAA] text-[#1A5878] hover:text-white dark:bg-[#193342] dark:text-[#BEE5FA] dark:hover:bg-[#1B9AAA] dark:hover:text-white border border-[#B7DDF5] dark:border-[#315D76]',
      categoryId: 'other-document-tools',
    },
  ];

  return (
    <section aria-label="Main Tool Categories" className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E9E4FF] dark:bg-[#2B244E] text-xs font-bold text-[#4B3A9D] dark:text-[#D5CCFF] border border-[#CFC5FA] dark:border-[#4D4287]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tool Categories</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
          Browse Tools by Category
        </h2>
        <p className="text-sm text-[#777789] dark:text-[#A0A5C0]">
          Every tool is organized in its dedicated category — PDF, Word, Excel, PowerPoint, Image, or Other Tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </section>
  );
};
