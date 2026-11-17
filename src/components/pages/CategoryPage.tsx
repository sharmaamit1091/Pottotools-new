import React, { useState } from 'react';
import { CATEGORIES, ToolDefinition, CategoryInfo, DOCUMENT_NAV_CATEGORIES } from '../../config/toolsRegistry';
import { CATEGORY_GUIDANCE_MAP } from '../../config/categoryGuidance';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { AdSlot } from '../common/AdSlot';
import { AdsterraNativeBanner } from '../common/AdsterraNativeBanner';
import { ToolCard } from '../common/ToolCard';
import {
  Layers,
  Minimize2,
  FileText,
  Image,
  ScanText,
  ShieldCheck,
  Award,
  Sparkles,
  Sheet,
  Presentation,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';

interface CategoryPageProps {
  categoryId: string;
  tools: ToolDefinition[];
  onSelectTool: (tool: ToolDefinition) => void;
  onNavigateHome: () => void;
  onNavigateCategory: (categoryId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'organize-pdf': Layers,
  'compress-pdf': Minimize2,
  'convert-docs': FileText,
  'convert-images': Image,
  'ocr-scanned': ScanText,
  'pdf-security': ShieldCheck,
  'smart-utilities': Sparkles,
  'spreadsheets': Sheet,
  'pdf-tools': Layers,
  'word-tools': FileText,
  'excel-tools': Sheet,
  'powerpoint-tools': Presentation,
  'image-tools': Image,
  'other-document-tools': Sparkles,
};

const CATEGORY_THEMES: Record<
  string,
  {
    badgeClass: string;
    iconGradient: string;
    cardBorder: string;
    hoverBg: string;
  }
> = {
  'organize-pdf': {
    badgeClass: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
    iconGradient: 'from-red-500 to-rose-600',
    cardBorder: 'hover:border-red-400 dark:hover:border-red-500 hover:shadow-red-500/10',
    hoverBg: 'hover:bg-red-50/50 dark:hover:bg-red-950/20',
  },
  'compress-pdf': {
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    iconGradient: 'from-rose-500 to-red-600',
    cardBorder: 'hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-rose-500/10',
    hoverBg: 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20',
  },
  'convert-docs': {
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    iconGradient: 'from-blue-600 to-indigo-600',
    cardBorder: 'hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-500/10',
    hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
  },
  'convert-images': {
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    iconGradient: 'from-purple-600 to-pink-600',
    cardBorder: 'hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-purple-500/10',
    hoverBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/20',
  },
  'ocr-scanned': {
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
    iconGradient: 'from-cyan-500 to-teal-600',
    cardBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-cyan-500/10',
    hoverBg: 'hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20',
  },
  'pdf-security': {
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
    iconGradient: 'from-indigo-600 to-violet-700',
    cardBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-indigo-500/10',
    hoverBg: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20',
  },
  'smart-utilities': {
    badgeClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900',
    iconGradient: 'from-violet-600 to-fuchsia-600',
    cardBorder: 'hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-violet-500/10',
    hoverBg: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/20',
  },
  'spreadsheets': {
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    iconGradient: 'from-emerald-500 to-teal-600',
    cardBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10',
    hoverBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
  },
  'pdf-tools': {
    badgeClass: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
    iconGradient: 'from-red-500 to-rose-600',
    cardBorder: 'hover:border-red-400 dark:hover:border-red-500 hover:shadow-red-500/10',
    hoverBg: 'hover:bg-red-50/50 dark:hover:bg-red-950/20',
  },
  'word-tools': {
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    iconGradient: 'from-blue-600 to-indigo-600',
    cardBorder: 'hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-500/10',
    hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
  },
  'excel-tools': {
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    iconGradient: 'from-emerald-500 to-teal-600',
    cardBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10',
    hoverBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
  },
  'powerpoint-tools': {
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    iconGradient: 'from-amber-500 to-orange-600',
    cardBorder: 'hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-amber-500/10',
    hoverBg: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
  },
  'image-tools': {
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    iconGradient: 'from-purple-600 to-pink-600',
    cardBorder: 'hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-purple-500/10',
    hoverBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/20',
  },
  'other-document-tools': {
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
    iconGradient: 'from-cyan-500 to-teal-600',
    cardBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-cyan-500/10',
    hoverBg: 'hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20',
  },
};

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryId,
  tools,
  onSelectTool,
  onNavigateHome,
  onNavigateCategory,
}) => {
  // Alias gov-tools gracefully to image-tools
  const normalizedCategoryId = categoryId === 'gov-tools' ? 'image-tools' : categoryId;
  const isImageCategory = normalizedCategoryId === 'image-tools' || normalizedCategoryId === 'convert-images';

  const [imageSubSection, setImageSubSection] = useState<'all' | 'general' | 'exams'>('all');

  // Check if requested category is one of the 6 Document Navigation categories
  const docNavCategory = DOCUMENT_NAV_CATEGORIES.find((d) => d.id === normalizedCategoryId);

  // Or check if it's one of the 8 numbered categories
  const standardCategory = CATEGORIES.find((c) => c.id === normalizedCategoryId);

  const categoryName = docNavCategory ? docNavCategory.name : standardCategory ? standardCategory.name : 'Image Tools';
  const categoryDesc = docNavCategory
    ? docNavCategory.description
    : standardCategory
    ? standardCategory.description
    : 'Resize, compress, edit photos, exam photo & signature presets (UPSC/SSC), and convert JPG, PNG, WebP.';

  const categoryTools = docNavCategory
    ? tools.filter((t) => docNavCategory.toolIds.includes(t.id))
    : tools.filter((t) => t.category === normalizedCategoryId || (isImageCategory && t.categoryName === 'Image Tools'));

  const theme = CATEGORY_THEMES[normalizedCategoryId] || CATEGORY_THEMES['image-tools'] || CATEGORY_THEMES['convert-docs'];
  const IconComp = CATEGORY_ICONS[normalizedCategoryId] || Image;
  const guidance = CATEGORY_GUIDANCE_MAP[normalizedCategoryId];

  // Filter tools for image subcategory if applicable
  const examTools = categoryTools.filter(
    (t) => t.subCategory === 'Photo & Signature for Exams' || t.id === 'photo-signature-resizer' || t.id === 'passport-photo-cropper' || t.id === 'combine-app-documents'
  );
  const generalImageTools = categoryTools.filter(
    (t) => !examTools.some((e) => e.id === t.id)
  );

  const displayedTools =
    isImageCategory && imageSubSection === 'exams'
      ? examTools
      : isImageCategory && imageSubSection === 'general'
      ? generalImageTools
      : categoryTools;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/', onClick: onNavigateHome },
          { label: 'All Tools', href: '/directory', onClick: () => onNavigateCategory('directory') },
          { label: categoryName },
        ]}
      />

      {/* Top Banner Advertisement Area */}
      <AdSlot placement="category-top-banner" format="horizontal" minHeight={90} />

      {/* Category Hero / Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br opacity-10 rounded-full blur-2xl pointer-events-none"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.iconGradient} text-white flex items-center justify-center shrink-0 shadow-md`}
            >
              <IconComp className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badgeClass}`}
                >
                  Category
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {categoryTools.length} {categoryTools.length === 1 ? 'Tool' : 'Tools'} Available
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {categoryName}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {categoryDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>100% Free · Client-Side Execution</span>
          </div>
        </div>
      </div>

      {/* Internal Subsections for Image Tools */}
      {isImageCategory && (
        <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              <Award className="w-4 h-4" />
              <span>Exam Photo & Signature Presets Included</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
              UPSC, SSC, IBPS, and State PSC photo/signature requirements and passport specifications are built directly inside Image Tools alongside general photo resizing, compression, editing, and conversion.
            </p>
          </div>

          {/* Subsection Filters */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setImageSubSection('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                imageSubSection === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              All Image Tools ({categoryTools.length})
            </button>
            <button
              type="button"
              onClick={() => setImageSubSection('general')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                imageSubSection === 'general'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              General Image Tools ({generalImageTools.length})
            </button>
            <button
              type="button"
              onClick={() => setImageSubSection('exams')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                imageSubSection === 'exams'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Photo & Signature for Exams ({examTools.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of Dedicated Tools in this Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isImageCategory && imageSubSection === 'exams'
              ? 'Photo & Signature for Exams'
              : isImageCategory && imageSubSection === 'general'
              ? 'General Image Tools & Utilities'
              : `Available ${categoryName.replace(/^\d+\.\s*/, '')} Services`}
          </h2>
          <span className="text-xs text-slate-400">
            Click any service to open its dedicated page
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {displayedTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onClick={() => onSelectTool(tool)}
            />
          ))}
        </div>
      </div>

      {/* Mid-Content AdSlot & Adsterra Native Banner */}
      <div className="py-2 space-y-4">
        <AdSlot placement="category-mid" format="horizontal" minHeight={90} />
        <AdsterraNativeBanner key={categoryId} placement="category-mid" />
      </div>

      {/* Category Workflow Guidance & FAQs */}
      {guidance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {guidance.workflowTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {guidance.workflowSummary}
            </p>
            <ul className="space-y-2.5 pl-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {guidance.workflowBullets.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {guidance.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border-b last:border-b-0 border-slate-100 dark:border-slate-800 pb-3.5 last:pb-0"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {faq.q}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Other Categories Switcher */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Explore Other Service Categories
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between document conversion, image processing, security, and spreadsheet categories
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {CATEGORIES.filter((c) => c.id !== categoryId && !(categoryId === 'pdf-tools' && c.id === 'compress-pdf')).map((otherCat) => {
            const OtherIcon = CATEGORY_ICONS[otherCat.id] || Layers;
            const targetCatId = otherCat.id === 'compress-pdf' ? 'pdf-tools' : otherCat.id;
            return (
              <a
                key={otherCat.id}
                href={`/${targetCatId}`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateCategory(targetCatId);
                  }
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 text-left transition-all group no-underline"
              >
                <OtherIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                  {otherCat.name.replace(/^\d+\.\s*/, '')}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
