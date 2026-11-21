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
function getCategoryPastelStage(category: string): {
  stageBg: string;
  hoverBorder: string;
  tagBg: string;
} {
  switch (category) {
    case 'organize-pdf':
    case 'compress-pdf':
      return {
        stageBg: 'bg-[#FFF3EC] dark:bg-[#271F26] border-[#F7D7C4] dark:border-[#42323D]',
        hoverBorder: 'hover:border-[#EAB89B] dark:hover:border-[#7B5244]',
        tagBg: 'bg-[#FFE9DA] text-[#8E3914] dark:bg-[#3B261E] dark:text-[#FFD2B5] border-[#F5BEA0] dark:border-[#6A4132]',
      };
    case 'convert-docs':
      return {
        stageBg: 'bg-[#EEF6FF] dark:bg-[#192338] border-[#C9E1FB] dark:border-[#2C3E5F]',
        hoverBorder: 'hover:border-[#9EC9F7] dark:hover:border-[#45689E]',
        tagBg: 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1A2F4A] dark:text-[#B9DCFF] border-[#B2D7FB] dark:border-[#325785]',
      };
    case 'convert-images':
      return {
        stageBg: 'bg-[#F3F0FF] dark:bg-[#221E38] border-[#DDD5FD] dark:border-[#3A3260]',
        hoverBorder: 'hover:border-[#B9ACFA] dark:hover:border-[#5D509C]',
        tagBg: 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF] border-[#CFC5FA] dark:border-[#4D4287]',
      };
    case 'spreadsheets':
    case 'pdf-security':
      return {
        stageBg: 'bg-[#EEFBF4] dark:bg-[#172826] border-[#C3EBD6] dark:border-[#28473D]',
        hoverBorder: 'hover:border-[#93D9B6] dark:hover:border-[#3E7661]',
        tagBg: 'bg-[#DDF5E9] text-[#156340] dark:bg-[#17362A] dark:text-[#B4EED1] border-[#AEE3C8] dark:border-[#2A634C]',
      };
    default:
      return {
        stageBg: 'bg-[#FFF9E6] dark:bg-[#27241C] border-[#F5E3AF] dark:border-[#453D2A]',
        hoverBorder: 'hover:border-[#E8CB7B] dark:hover:border-[#73623B]',
        tagBg: 'bg-[#FFF2C9] text-[#7E520A] dark:bg-[#3A2E14] dark:text-[#FFE49B] border-[#F1D583] dark:border-[#6E5623]',
      };
  }
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onClick,
  showCategoryTag = false,
  className = '',
}) => {
  const spec = getToolVisualSpec(tool.id, tool.title);
  const VisualComponent = spec.visual;
  const pastel = getCategoryPastelStage(tool.category);

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
      className={`pt-card-hover group relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] cursor-pointer select-none focus:outline-none focus-visible:ring-3 focus-visible:ring-[#5B50E6] no-underline ${pastel.hoverBorder} ${className}`}
    >
      <div>
        {/* Top: Pastel-Tinted Animated Visual Stage */}
        <div
          className={`tool-visual-stage w-full h-28 sm:h-32 rounded-xl border px-2.5 py-2 flex items-center justify-center mb-3.5 overflow-hidden transition-transform duration-300 group-hover:scale-[1.015] ${pastel.stageBg}`}
        >
          <VisualComponent />
        </div>

        {/* Subtle Pastel Action Label + Category Tag */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span
            className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${pastel.tagBg}`}
          >
            {spec.actionLabel}
          </span>
          {showCategoryTag && (
            <span className="text-[11px] text-[#777789] dark:text-[#A0A5C0] font-medium">
              · {tool.categoryName}
            </span>
          )}
        </div>

        {/* Short, Bold Capitalized Tool Name */}
        <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC] group-hover:text-[#5B50E6] dark:group-hover:text-[#A49CFF] transition-colors line-clamp-2 leading-snug mb-1.5">
          {tool.title}
        </h3>

        {/* 1-Line Simple Explanation */}
        <p className="text-xs sm:text-[13px] text-[#777789] dark:text-[#A0A5C0] line-clamp-2 leading-relaxed">
          {spec.shortExplanation || tool.shortDesc}
        </p>
      </div>

      {/* Bottom Interactive Affordance Bar */}
      <div className="mt-4 pt-3 border-t border-[#F1EFF8] dark:border-[#242942] flex items-center justify-between text-xs font-bold text-[#55556B] dark:text-[#C5CAE0]">
        <span className="group-hover:text-[#5B50E6] dark:group-hover:text-[#A49CFF] transition-colors">
          {spec.actionButtonText}
        </span>
        <div className="w-7 h-7 rounded-xl bg-[#F5F4FA] dark:bg-[#222742] group-hover:bg-[#5B50E6] text-[#55556B] dark:text-[#A8ADC7] group-hover:text-white flex items-center justify-center transition-all duration-200 transform group-hover:translate-x-1">
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
  'fill-pdf-form': {
    icon: ArrowRight,
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/70',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBorder: 'border-indigo-200 dark:border-indigo-900',
  },
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
