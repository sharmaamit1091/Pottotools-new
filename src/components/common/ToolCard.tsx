import React from 'react';
import { ToolDefinition } from '../../config/toolsRegistry';
import { preloadTool } from '../../services/utils/toolPreloader';
import { getToolVisualSpec } from '../../config/toolVisualMetadata';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface ToolCardProps {
  tool: ToolDefinition;
  onClick: () => void;
  showCategoryTag?: boolean;
  className?: string;
}

/**
 * Visual Tool Card with Before -> Action -> After Illustrations & Micro-Animations
 * Meets user requirements:
 * 1. Custom visual illustration representing the actual operation
 * 2. Clear short tool name
 * 3. Simple one-line explanation
 * 4. Subtle action label ("Reduce file size", "Combine documents", etc.)
 * 5. Clear interactive affordance to open the tool
 */
export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onClick,
  showCategoryTag = false,
  className = '',
}) => {
  const spec = getToolVisualSpec(tool.id, tool.title);
  const VisualComponent = spec.visual;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <a
      href={`/${tool.slug}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => preloadTool(tool.slug)}
      onTouchStart={() => preloadTool(tool.slug)}
      onFocus={() => preloadTool(tool.slug)}
      className={`group relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer select-none focus:outline-none focus-visible:ring-3 focus-visible:ring-indigo-500 no-underline ${spec.accentClass.borderHover} ${className}`}
    >
      <div>
        {/* Top: Before -> Action -> After Realistic Animated Visual Stage */}
        <div className="tool-visual-stage w-full h-28 sm:h-32 rounded-xl bg-slate-50/95 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/90 px-2.5 py-2 flex items-center justify-center mb-3.5 overflow-hidden transition-all duration-300 group-hover:border-indigo-200/90 dark:group-hover:border-indigo-800/80">
          <VisualComponent />
        </div>

        {/* Subtle Action Label + Category Tag */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span
            className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md border ${spec.accentClass.actionTag}`}
          >
            {spec.actionLabel}
          </span>
          {showCategoryTag && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              · {tool.categoryName}
            </span>
          )}
        </div>

        {/* Short, Bold Tool Name */}
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
          {tool.title}
        </h3>

        {/* 1-Line Simple Explanation */}
        <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {spec.shortExplanation || tool.shortDesc}
        </p>
      </div>

      {/* Bottom Interactive Affordance Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {spec.actionButtonText}
        </span>
        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 text-slate-600 dark:text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-200 transform group-hover:translate-x-1 shadow-2xs">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
};

export interface ToolThemeConfig {
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
}

export const TOOL_VISUAL_THEMES: Record<string, ToolThemeConfig> = {
  'merge-pdf': {
    icon: ArrowRight,
    iconBg: 'bg-orange-100 dark:bg-orange-950/70',
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBorder: 'border-orange-200 dark:border-orange-900',
  },
  'split-pdf': {
    icon: ArrowRight,
    iconBg: 'bg-amber-100 dark:bg-amber-950/70',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBorder: 'border-amber-200 dark:border-amber-900',
  },
  'compress-pdf': {
    icon: ArrowRight,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBorder: 'border-emerald-200 dark:border-emerald-900',
  },
  'pdf-to-word': {
    icon: ArrowRight,
    iconBg: 'bg-blue-100 dark:bg-blue-950/70',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBorder: 'border-blue-200 dark:border-blue-900',
  },
  'custom-photo-resizer': {
    icon: ArrowRight,
    iconBg: 'bg-cyan-100 dark:bg-cyan-950/70',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBorder: 'border-cyan-200 dark:border-cyan-900',
  },
  'hd-image-enhancer': {
    icon: ArrowRight,
    iconBg: 'bg-purple-100 dark:bg-purple-950/70',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBorder: 'border-purple-200 dark:border-purple-900',
  },
  'image-to-pdf': {
    icon: ArrowRight,
    iconBg: 'bg-yellow-100 dark:bg-yellow-950/70',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    iconBorder: 'border-yellow-200 dark:border-yellow-900',
  },
  'sign-pdf': {
    icon: ArrowRight,
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-700 dark:text-slate-300',
    iconBorder: 'border-slate-200 dark:border-slate-700',
  },
  'protect-pdf': {
    icon: ArrowRight,
    iconBg: 'bg-red-100 dark:bg-red-950/70',
    iconColor: 'text-red-600 dark:text-red-400',
    iconBorder: 'border-red-200 dark:border-red-900',
  },
  'unlock-pdf': {
    icon: ArrowRight,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBorder: 'border-emerald-200 dark:border-emerald-900',
  },
  'pdf-id-redactor': {
    icon: ArrowRight,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBorder: 'border-emerald-200 dark:border-emerald-900',
  },
  'remove-scan-watermark': {
    icon: ArrowRight,
    iconBg: 'bg-teal-100 dark:bg-teal-950/70',
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBorder: 'border-teal-200 dark:border-teal-900',
  },
};
