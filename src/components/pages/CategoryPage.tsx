import React, { useState } from 'react';
import { CATEGORIES, ToolDefinition, CategoryInfo, DOCUMENT_NAV_CATEGORIES } from '../../config/toolsRegistry';
import { CATEGORY_GUIDANCE_MAP } from '../../config/categoryGuidance';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { AdSlot } from '../common/AdSlot';
import { AdsterraNativeBanner } from '../common/AdsterraNativeBanner';
import { AdsterraBanner } from '../common/AdsterraBanner';
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
    iconTile: string;
    heroGlow: string;
  }
> = {
  'organize-pdf': {
    badgeClass: 'bg-[#FFE9DA] text-[#8E3914] border-[#F5BEA0] dark:bg-[#3A2218] dark:text-[#FFB894] dark:border-[#593424]',
    iconTile: 'bg-[#FFE9DA] text-[#8E3914] border-[#F5BEA0] dark:bg-[#3A2218] dark:text-[#FFB894] dark:border-[#593424]',
    heroGlow: 'bg-[#FFE9DA]/70 dark:bg-[#3A2218]/40',
  },
  'compress-pdf': {
    badgeClass: 'bg-[#FFE9DA] text-[#8E3914] border-[#F5BEA0] dark:bg-[#3A2218] dark:text-[#FFB894] dark:border-[#593424]',
    iconTile: 'bg-[#FFE9DA] text-[#8E3914] border-[#F5BEA0] dark:bg-[#3A2218] dark:text-[#FFB894] dark:border-[#593424]',
    heroGlow: 'bg-[#FFE9DA]/70 dark:bg-[#3A2218]/40',
  },
  'convert-docs': {
    badgeClass: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    iconTile: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    heroGlow: 'bg-[#DDEEFF]/70 dark:bg-[#162742]/40',
  },
  'convert-images': {
    badgeClass: 'bg-[#E9E4FF] text-[#4B3A9D] border-[#CFC5FA] dark:bg-[#231F44] dark:text-[#C5BAFF] dark:border-[#373164]',
    iconTile: 'bg-[#E9E4FF] text-[#4B3A9D] border-[#CFC5FA] dark:bg-[#231F44] dark:text-[#C5BAFF] dark:border-[#373164]',
    heroGlow: 'bg-[#E9E4FF]/70 dark:bg-[#231F44]/40',
  },
  'ocr-scanned': {
    badgeClass: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    iconTile: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    heroGlow: 'bg-[#DDEEFF]/70 dark:bg-[#162742]/40',
  },
  'pdf-security': {
    badgeClass: 'bg-[#E9E4FF] text-[#4B3A9D] border-[#CFC5FA] dark:bg-[#231F44] dark:text-[#C5BAFF] dark:border-[#373164]',
    iconTile: 'bg-[#E9E4FF] text-[#4B3A9D] border-[#CFC5FA] dark:bg-[#231F44] dark:text-[#C5BAFF] dark:border-[#373164]',
    heroGlow: 'bg-[#E9E4FF]/70 dark:bg-[#231F44]/40',
  },
  'smart-utilities': {
    badgeClass: 'bg-[#FFF2C9] text-[#7E520A] border-[#F1D583] dark:bg-[#362C14] dark:text-[#FFE08A] dark:border-[#53431D]',
    iconTile: 'bg-[#FFF2C9] text-[#7E520A] border-[#F1D583] dark:bg-[#362C14] dark:text-[#FFE08A] dark:border-[#53431D]',
    heroGlow: 'bg-[#FFF2C9]/70 dark:bg-[#362C14]/40',
  },
  'spreadsheets': {
    badgeClass: 'bg-[#DDF5E9] text-[#156340] border-[#BCEBD4] dark:bg-[#152E24] dark:text-[#8EE3BC] dark:border-[#244E3D]',
    iconTile: 'bg-[#DDF5E9] text-[#156340] border-[#BCEBD4] dark:bg-[#152E24] dark:text-[#8EE3BC] dark:border-[#244E3D]',
    heroGlow: 'bg-[#DDF5E9]/70 dark:bg-[#152E24]/40',
  },
  'pdf-tools': {
    badgeClass: 'bg-[#FFE9DA] text-[#8E3914] border-[#F5BEA0] dark:bg-[#3A2218] dark:text-[#FFB894] dark:border-[#593424]',
    iconTile: 'bg-[#FFE9DA] text-[#8E3914] border-[#F5BEA0] dark:bg-[#3A2218] dark:text-[#FFB894] dark:border-[#593424]',
    heroGlow: 'bg-[#FFE9DA]/70 dark:bg-[#3A2218]/40',
  },
  'word-tools': {
    badgeClass: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    iconTile: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    heroGlow: 'bg-[#DDEEFF]/70 dark:bg-[#162742]/40',
  },
  'excel-tools': {
    badgeClass: 'bg-[#DDF5E9] text-[#156340] border-[#BCEBD4] dark:bg-[#152E24] dark:text-[#8EE3BC] dark:border-[#244E3D]',
    iconTile: 'bg-[#DDF5E9] text-[#156340] border-[#BCEBD4] dark:bg-[#152E24] dark:text-[#8EE3BC] dark:border-[#244E3D]',
    heroGlow: 'bg-[#DDF5E9]/70 dark:bg-[#152E24]/40',
  },
  'powerpoint-tools': {
    badgeClass: 'bg-[#FFF2C9] text-[#7E520A] border-[#F1D583] dark:bg-[#362C14] dark:text-[#FFE08A] dark:border-[#53431D]',
    iconTile: 'bg-[#FFF2C9] text-[#7E520A] border-[#F1D583] dark:bg-[#362C14] dark:text-[#FFE08A] dark:border-[#53431D]',
    heroGlow: 'bg-[#FFF2C9]/70 dark:bg-[#362C14]/40',
  },
  'image-tools': {
    badgeClass: 'bg-[#E9E4FF] text-[#4B3A9D] border-[#CFC5FA] dark:bg-[#231F44] dark:text-[#C5BAFF] dark:border-[#373164]',
    iconTile: 'bg-[#E9E4FF] text-[#4B3A9D] border-[#CFC5FA] dark:bg-[#231F44] dark:text-[#C5BAFF] dark:border-[#373164]',
    heroGlow: 'bg-[#E9E4FF]/70 dark:bg-[#231F44]/40',
  },
  'other-document-tools': {
    badgeClass: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    iconTile: 'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    heroGlow: 'bg-[#DDEEFF]/70 dark:bg-[#162742]/40',
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
      <div className="bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-3xl p-6 sm:p-10 shadow-[0_10px_28px_-18px_rgba(37,37,54,0.14)] relative overflow-hidden">
        <div
          aria-hidden="true"
          className={`absolute -right-14 -top-14 w-56 h-56 rounded-full blur-3xl pointer-events-none ${theme.heroGlow}`}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${theme.iconTile}`}
            >
              <IconComp className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badgeClass}`}
                >
                  Category
                </span>
                <span className="text-xs text-[#777789] dark:text-[#A0A5C0] font-medium">
                  {categoryTools.length} {categoryTools.length === 1 ? 'Tool' : 'Tools'} Available
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
                {categoryName}
              </h1>
              <p className="text-sm sm:text-base text-[#777789] dark:text-[#A0A5C0] max-w-2xl leading-relaxed">
                {categoryDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#156340] dark:text-[#8EE3BC] bg-[#DDF5E9] dark:bg-[#152E24] px-3.5 py-2 rounded-xl border border-[#BCEBD4] dark:border-[#244E3D] self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>100% Free · Files Stay on Your Device</span>
          </div>
        </div>
      </div>

      {/* Internal Subsections for Image Tools */}
      {isImageCategory && (
        <div className="bg-[#E9E4FF]/45 dark:bg-[#231F44]/40 border border-[#CFC5FA] dark:border-[#373164] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4B3A9D] dark:text-[#C5BAFF]">
              <Award className="w-4 h-4" />
              <span>Exam Photo &amp; Signature Presets Included</span>
            </div>
            <p className="text-xs text-[#55556A] dark:text-[#C4C9E0] max-w-xl">
              UPSC, SSC, IBPS, and State PSC photo/signature requirements and passport specifications are built directly inside Image Tools alongside general photo resizing, compression, editing, and conversion.
            </p>
          </div>

          {/* Subsection Filters */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setImageSubSection('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                imageSubSection === 'all'
                  ? 'bg-[#5B50E6] text-white shadow-xs'
                  : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E6F7] border border-[#E8E6F2] dark:border-[#2A2F4A] hover:border-[#CFC5FA]'
              }`}
            >
              All Image Tools ({categoryTools.length})
            </button>
            <button
              type="button"
              onClick={() => setImageSubSection('general')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                imageSubSection === 'general'
                  ? 'bg-[#5B50E6] text-white shadow-xs'
                  : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E6F7] border border-[#E8E6F2] dark:border-[#2A2F4A] hover:border-[#CFC5FA]'
              }`}
            >
              General Image Tools ({generalImageTools.length})
            </button>
            <button
              type="button"
              onClick={() => setImageSubSection('exams')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                imageSubSection === 'exams'
                  ? 'bg-[#5B50E6] text-white shadow-xs'
                  : 'bg-white dark:bg-[#181B2E] text-[#252536] dark:text-[#E2E6F7] border border-[#E8E6F2] dark:border-[#2A2F4A] hover:border-[#CFC5FA]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Photo &amp; Signature for Exams ({examTools.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of Dedicated Tools in this Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
            {isImageCategory && imageSubSection === 'exams'
              ? 'Photo & Signature for Exams'
              : isImageCategory && imageSubSection === 'general'
              ? 'General Image Tools'
              : `Available ${categoryName.replace(/^\d+\.\s*/, '')}`}
          </h2>
          <span className="text-xs text-[#777789] dark:text-[#A0A5C0]">
            Click any tool to open it
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

      {/* Mid-Content AdSlot, Adsterra Display Banner & Native Banner */}
      <div className="py-2 space-y-5">
        <AdSlot placement="category-mid" format="horizontal" minHeight={90} />
        <AdsterraBanner
          key={`category-banner-${categoryId}`}
          variant="responsive-leaderboard"
          placement="category-mid-banner"
        />
        <AdsterraNativeBanner key={categoryId} placement="category-mid" />
      </div>

      {/* Category Workflow Guidance & FAQs */}
      {guidance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-extrabold text-[#252536] dark:text-[#F2F4FC]">
              {guidance.workflowTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#777789] dark:text-[#A0A5C0] leading-relaxed">
              {guidance.workflowSummary}
            </p>
            <ul className="space-y-2.5 pl-4 list-disc text-xs sm:text-sm text-[#4C4C63] dark:text-[#C4C9E0] leading-relaxed">
              {guidance.workflowBullets.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-extrabold text-[#252536] dark:text-[#F2F4FC]">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {guidance.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border-b last:border-b-0 border-[#F0EEF8] dark:border-[#262B45] pb-3.5 last:pb-0"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-[#252536] dark:text-[#F2F4FC] mb-1">
                    {faq.q}
                  </h3>
                  <p className="text-xs text-[#777789] dark:text-[#A0A5C0] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Other Categories Switcher */}
      <div className="bg-[#F4F3FA]/80 dark:bg-[#141727] border border-[#E8E6F2] dark:border-[#262B45] rounded-2xl p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#252536] dark:text-[#F2F4FC]">
            Explore Other Service Categories
          </h3>
          <p className="text-xs text-[#777789] dark:text-[#A0A5C0] mt-0.5">
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
                className="pt-card-hover flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] hover:border-[#CFC5FA] dark:hover:border-[#4B4485] text-left group no-underline"
              >
                <OtherIcon className="w-4 h-4 text-[#777789] dark:text-[#A0A5C0] group-hover:text-[#5B50E6] dark:group-hover:text-[#A99EFF] transition-colors shrink-0" />
                <span className="text-xs font-semibold text-[#252536] dark:text-[#E2E6F7] group-hover:text-[#5B50E6] dark:group-hover:text-[#A99EFF] truncate transition-colors">
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
