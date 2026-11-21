import React from 'react';
import { CATEGORIES, TOOLS, ToolDefinition } from '../../config/toolsRegistry';
import { ShieldCheck, ArrowUpRight, BookOpen, Globe } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';
import { ToolCard } from '../common/ToolCard';
import { Breadcrumbs } from '../common/Breadcrumbs';

interface DirectoryPageProps {
  onSelectTool: (tool: ToolDefinition) => void;
  onNavigate?: (view: string) => void;
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({ onSelectTool, onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <Breadcrumbs
        items={[
          {
            label: 'Home',
            href: '/',
            onClick: () => {
              if (onNavigate) onNavigate('home');
            },
          },
          { label: 'All Tools Directory' },
        ]}
      />

      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Complete List &bull; {TOOLS.length} Free Tools</span>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            All Tools Directory ({TOOLS.length})
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Browse all {TOOLS.length} free PDF, Word, Excel, photo, and exam form tools. Every tool works safely right inside your browser without uploading your files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="/blog"
            onClick={(e) => {
              if (onNavigate && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigate('blog');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors no-underline"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practical Guides &amp; Blog</span>
          </a>
          <a
            href="/hi"
            onClick={(e) => {
              if (onNavigate && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigate('hi');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors no-underline"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>PottoTools हिंदी</span>
          </a>
        </div>
      </div>

      <div className="space-y-10">
        {CATEGORIES.map((cat) => {
          const categoryTools = TOOLS.filter(
            (t) => t.category === cat.id || (cat.id === 'organize-pdf' && t.category === 'pdf-tools')
          );
          const categoryHref = cat.id === 'compress-pdf' ? '/pdf-tools' : `/${cat.id}`;
          const categoryView = cat.id === 'compress-pdf' ? 'category-pdf-tools' : `category-${cat.id}`;

          return (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                  <a
                    href={categoryHref}
                    onClick={(e) => {
                      if (onNavigate && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onNavigate(categoryView);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline text-inherit"
                  >
                    <span>{cat.name}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </a>
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  {categoryTools.length} tools
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {categoryTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => onSelectTool(tool)}
                  />
                ))}
              </div>

              {/* In-content ad unit between directory categories */}
              {cat.id === 'convert-images' && (
                <div className="pt-4">
                  <AdSlot placement="content-inline" format="horizontal" minHeight={90} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
