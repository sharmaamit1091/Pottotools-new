import React, { useState, useMemo } from 'react';
import { CATEGORIES, ToolDefinition, ToolCategory } from '../../config/toolsRegistry';
import { ToolCard } from '../common/ToolCard';
import {
  Layers,
  Minimize2,
  FileText,
  Image as ImageIcon,
  ScanText,
  ShieldCheck,
  Sparkles,
  Sheet,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface ToolCategoriesSectionProps {
  tools: ToolDefinition[];
  onSelectTool: (tool: ToolDefinition) => void;
  onSelectCategoryPage: (categoryId: string) => void;
}

interface CategoryGroupDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
  targetCategoryIds: string[];
}

const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    id: 'pdf-tools',
    name: 'PDF Tools & Organization',
    shortName: 'PDF Tools',
    description: 'Merge, split, compress, reorder, delete pages, add watermarks, and numbers.',
    icon: Layers,
    accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900',
    targetCategoryIds: ['pdf-tools', 'organize-pdf', 'compress-pdf'],
  },
  {
    id: 'convert-images',
    name: 'Image Tools & Photo Studio',
    shortName: 'Image Tools',
    description: 'Resize dimensions, compress KB, HD enhancer, editor, converter, and official exam presets.',
    icon: ImageIcon,
    accentColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900',
    targetCategoryIds: ['image-tools', 'convert-images'],
  },
  {
    id: 'convert-docs',
    name: 'Document & Word Conversion',
    shortName: 'Word & Docs',
    description: 'Convert PDF to editable Word (.docx), Word to PDF, PowerPoint, TXT, and Markdown.',
    icon: FileText,
    accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
    targetCategoryIds: ['convert-docs'],
  },
  {
    id: 'spreadsheets',
    name: 'Office Spreadsheets & Tables',
    shortName: 'Spreadsheets',
    description: 'Convert CSV to Excel (.xlsx), Excel to CSV, PDF to Excel, and inspect spreadsheets.',
    icon: Sheet,
    accentColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900',
    targetCategoryIds: ['spreadsheets'],
  },
  {
    id: 'pdf-security',
    name: 'PDF Security, Passwords & Signing',
    shortName: 'Security & Sign',
    description: 'Protect with passwords, sign documents with digital canvas, and inspect metadata.',
    icon: ShieldCheck,
    accentColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900',
    targetCategoryIds: ['pdf-security'],
  },
  {
    id: 'ocr-smart',
    name: 'OCR & Smart Document Utilities',
    shortName: 'OCR & Utilities',
    description: 'Optical character recognition, searchable text finders, text cleaners, and diff comparisons.',
    icon: ScanText,
    accentColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-900',
    targetCategoryIds: ['ocr-scanned', 'smart-utilities'],
  },
];

export const ToolCategoriesSection: React.FC<ToolCategoriesSectionProps> = ({
  tools,
  onSelectTool,
  onSelectCategoryPage,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  // Filter tools per group
  const groupToolsMap = useMemo(() => {
    const map = new Map<string, ToolDefinition[]>();
    for (const group of CATEGORY_GROUPS) {
      const filtered = tools.filter((t) => {
        if (group.id === 'convert-images') {
          return (
            t.category === 'convert-images' ||
            t.category === 'image-tools' ||
            t.subCategory === 'Photo & Signature for Exams' ||
            t.id === 'photo-signature-resizer' ||
            t.id === 'passport-photo-cropper' ||
            t.id === 'combine-app-documents'
          );
        }
        if (group.id === 'pdf-tools') {
          return (
            (t.category === 'organize-pdf' ||
              t.category === 'compress-pdf' ||
              t.category === 'pdf-tools') &&
            t.id !== 'pdf-to-editable-word'
          );
        }
        if (group.id === 'convert-docs') {
          return t.category === 'convert-docs' || t.id === 'pdf-to-editable-word';
        }
        return group.targetCategoryIds.includes(t.category);
      });
      // Deduplicate tools in group
      const uniqueTools: ToolDefinition[] = [];
      const seenIds = new Set<string>();
      for (const t of filtered) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          uniqueTools.push(t);
        }
      }
      map.set(group.id, uniqueTools);
    }
    return map;
  }, [tools]);

  // Which groups to display based on active tab
  const displayedGroups = useMemo(() => {
    if (activeTab === 'all') {
      return CATEGORY_GROUPS;
    }
    return CATEGORY_GROUPS.filter((g) => g.id === activeTab);
  }, [activeTab]);

  return (
    <section id="tool-categories" className="pt-4 pb-12 sm:pt-6 sm:pb-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/40 mb-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Interactive Tool Suite</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Explore All Tools by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Recognize every tool instantly by its symbol and color. Click any card to launch immediately — 100% free, private, and fast.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 shrink-0 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{tools.length} In-Browser Tools</span>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Tools ({tools.length})
        </button>
        {CATEGORY_GROUPS.map((group) => {
          const count = groupToolsMap.get(group.id)?.length || 0;
          const isActive = activeTab === group.id;
          const Icon = group.icon;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveTab(group.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{group.shortName}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Categorized Tool Grids */}
      <div className="space-y-10">
        {displayedGroups.map((group) => {
          const groupTools = groupToolsMap.get(group.id) || [];
          if (!groupTools.length) return null;
          const GroupIcon = group.icon;

          // Target category page link ID (always canonical)
          const primaryCatId =
            group.targetCategoryIds[0] === 'compress-pdf' ? 'pdf-tools' : group.targetCategoryIds[0];

          return (
            <div key={group.id} className="space-y-4">
              {/* Category Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 ${group.accentColor}`}>
                    <GroupIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{group.name}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({groupTools.length} {groupTools.length === 1 ? 'tool' : 'tools'})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                      {group.description}
                    </p>
                  </div>
                </div>

                <a
                  href={`/${primaryCatId}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onSelectCategoryPage(primaryCatId);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors self-start sm:self-auto cursor-pointer no-underline"
                >
                  <span>View Dedicated Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Responsive Tool Card Grid: 1 mobile, 2 tablet, 3-4 desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {groupTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => onSelectTool(tool)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
