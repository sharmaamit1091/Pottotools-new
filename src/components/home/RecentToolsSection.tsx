import React, { useEffect, useState } from 'react';
import { ToolDefinition, getToolBySlug } from '../../config/toolsRegistry';
import { preloadTool } from '../../services/utils/toolPreloader';
import { Clock, ArrowRight, FileCheck } from 'lucide-react';
import { TOOL_VISUAL_THEMES } from '../common/ToolCard';

interface RecentToolsSectionProps {
  onSelectTool: (tool: ToolDefinition) => void;
}


export const RecentToolsSection: React.FC<RecentToolsSectionProps> = ({ onSelectTool }) => {
  const [recentTools, setRecentTools] = useState<ToolDefinition[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pottotools_recent_tools') || localStorage.getItem('docuease_recent_tools');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const resolved = ids
          .map((id) => getToolBySlug(id))
          .filter((t): t is ToolDefinition => !!t);
        setRecentTools(resolved.slice(0, 4));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleClearRecent = () => {
    try {
      localStorage.removeItem('pottotools_recent_tools');
      localStorage.removeItem('docuease_recent_tools');
      setRecentTools([]);
    } catch {
      // Ignore
    }
  };

  if (recentTools.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Recently Used on this Device</span>
        </div>
        <button
          type="button"
          onClick={handleClearRecent}
          className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer font-medium"
          title="Clear recent tool history from this browser"
        >
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {recentTools.map((tool) => {
          const theme = TOOL_VISUAL_THEMES[tool.id];
          const IconComponent = theme?.icon || FileCheck;
          return (
            <a
              key={tool.id}
              href={`/${tool.slug}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onSelectTool(tool);
                }
              }}
              onMouseEnter={() => preloadTool(tool.id)}
              onFocus={() => preloadTool(tool.id)}
              className="p-3.5 text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer no-underline"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs group-hover:scale-105 transition-transform ${
                    theme?.iconBg || 'bg-blue-100 dark:bg-blue-950/60'
                  } ${theme?.iconColor || 'text-blue-600 dark:text-blue-400'} ${
                    theme?.iconBorder || 'border-blue-200 dark:border-blue-900'
                  }`}
                >
                  <IconComponent className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {tool.categoryName}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </a>
          );
        })}
      </div>
    </section>
  );
};
