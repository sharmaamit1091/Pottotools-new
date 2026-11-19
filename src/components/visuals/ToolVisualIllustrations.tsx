import React from 'react';

/**
 * High-Craft Realistic Animated Tool Card Illustrations
 * - Crisp realistic paper sheets with dog-ear folded corners, layered stacks & realistic miniature layouts
 * - Custom vector SVG tools (scissors, metallic padlocks, fountain pen, magnifier, studio portraits, scenic photos)
 * - Continuous smooth compositor-only animations (works on both mobile touchscreens & desktop, respects prefers-reduced-motion)
 * - Responsive scaling so 2-column mobile screens and wide desktop cards never clip
 */

type DocTheme = 'pdf' | 'word' | 'excel' | 'ppt' | 'csv' | 'text' | 'image' | 'scan' | 'neutral';
type DocBodyVariant = 'article' | 'contract' | 'table' | 'chart' | 'slides' | 'scan' | 'photo' | 'code' | 'minimal';

const VisualStage: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`w-full h-full flex items-center justify-center select-none scale-[0.84] min-[400px]:scale-[0.94] sm:scale-100 transition-transform duration-300 ease-out group-hover:scale-[0.88] min-[400px]:group-hover:scale-[0.98] sm:group-hover:scale-[1.04] ${className}`}
  >
    {children}
  </div>
);

const DOC_THEME_STYLES: Record<
  DocTheme,
  {
    headerBg: string;
    border: string;
    foldBg: string;
    accentLine: string;
    accentSoft: string;
    subtext: string;
    badgeBg: string;
  }
> = {
  pdf: {
    headerBg: 'bg-gradient-to-r from-red-600 to-rose-500 text-white',
    border: 'border-red-200/90 dark:border-red-900/80',
    foldBg: 'border-t-red-200 dark:border-t-red-900',
    accentLine: 'bg-red-500/75',
    accentSoft: 'bg-red-100 dark:bg-red-950/60',
    subtext: 'text-red-700 dark:text-red-300',
    badgeBg: 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/70',
  },
  word: {
    headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    border: 'border-blue-200/90 dark:border-blue-900/80',
    foldBg: 'border-t-blue-200 dark:border-t-blue-900',
    accentLine: 'bg-blue-500/75',
    accentSoft: 'bg-blue-100 dark:bg-blue-950/60',
    subtext: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/70',
  },
  excel: {
    headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    border: 'border-emerald-200/90 dark:border-emerald-900/80',
    foldBg: 'border-t-emerald-200 dark:border-t-emerald-900',
    accentLine: 'bg-emerald-500/75',
    accentSoft: 'bg-emerald-100 dark:bg-emerald-950/60',
    subtext: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/70',
  },
  ppt: {
    headerBg: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
    border: 'border-orange-200/90 dark:border-orange-900/80',
    foldBg: 'border-t-orange-200 dark:border-t-orange-900',
    accentLine: 'bg-orange-500/80',
    accentSoft: 'bg-orange-100 dark:bg-orange-950/60',
    subtext: 'text-orange-700 dark:text-orange-300',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/70',
  },
  csv: {
    headerBg: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white',
    border: 'border-teal-200/90 dark:border-teal-900/80',
    foldBg: 'border-t-teal-200 dark:border-t-teal-900',
    accentLine: 'bg-teal-500/75',
    accentSoft: 'bg-teal-100 dark:bg-teal-950/60',
    subtext: 'text-teal-700 dark:text-teal-300',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/70',
  },
  text: {
    headerBg: 'bg-gradient-to-r from-slate-600 to-slate-500 text-white',
    border: 'border-slate-300/90 dark:border-slate-700',
    foldBg: 'border-t-slate-300 dark:border-t-slate-700',
    accentLine: 'bg-slate-500/75',
    accentSoft: 'bg-slate-200 dark:bg-slate-800',
    subtext: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  image: {
    headerBg: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white',
    border: 'border-violet-200/90 dark:border-violet-900/80',
    foldBg: 'border-t-violet-200 dark:border-t-violet-900',
    accentLine: 'bg-violet-500/75',
    accentSoft: 'bg-violet-100 dark:bg-violet-950/60',
    subtext: 'text-violet-700 dark:text-violet-300',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/70',
  },
  scan: {
    headerBg: 'bg-gradient-to-r from-slate-500 to-zinc-600 text-white',
    border: 'border-slate-300 dark:border-slate-700',
    foldBg: 'border-t-slate-300 dark:border-t-slate-700',
    accentLine: 'bg-cyan-500/80',
    accentSoft: 'bg-slate-200/80 dark:bg-slate-800',
    subtext: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
  neutral: {
    headerBg: 'bg-gradient-to-r from-slate-700 to-slate-600 text-white',
    border: 'border-slate-300 dark:border-slate-700',
    foldBg: 'border-t-slate-300 dark:border-t-slate-700',
    accentLine: 'bg-indigo-500/75',
    accentSoft: 'bg-slate-100 dark:bg-slate-800',
    subtext: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};

/**
 * Realistic Physical Paper Document Sheet with dog-ear corner, layered shadows & detailed miniature body
 */
export const DocIcon: React.FC<{
  type: DocTheme;
  label: string;
  sublabel?: string;
  className?: string;
  isLarge?: boolean;
  compact?: boolean;
  stacked?: boolean;
  variant?: DocBodyVariant;
  highlightBadge?: string;
  children?: React.ReactNode;
}> = ({
  type,
  label,
  sublabel,
  className = '',
  isLarge = false,
  compact = false,
  stacked = false,
  variant = 'article',
  highlightBadge,
  children,
}) => {
  const s = DOC_THEME_STYLES[type];
  const sizeClass = isLarge
    ? 'w-[64px] h-[84px]'
    : compact
    ? 'w-[46px] h-[62px]'
    : 'w-[54px] h-[74px]';

  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Realistic stacked paper pages behind the primary sheet */}
      {stacked && (
        <>
          <div
            className={`absolute inset-0 translate-x-[5px] translate-y-[4px] rounded-[7px] bg-slate-100 dark:bg-slate-800 border ${s.border} opacity-75`}
          />
          <div
            className={`absolute inset-0 translate-x-[2.5px] translate-y-[2px] rounded-[7px] bg-white dark:bg-slate-800/95 border ${s.border} shadow-xs`}
          />
        </>
      )}

      {/* Primary physical paper sheet */}
      <div
        className={`relative ${sizeClass} rounded-[7px] bg-white dark:bg-slate-900 border ${s.border} shadow-[0_8px_18px_-6px_rgba(15,23,42,0.22),0_2px_5px_-1px_rgba(15,23,42,0.09)] dark:shadow-[0_10px_22px_-6px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden`}
      >
        {/* Subtle top gloss highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white/40 to-transparent z-10" />

        {/* Realistic folded dog-ear corner */}
        <div className="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 z-20">
          <div className="w-full h-full bg-slate-100 dark:bg-slate-950" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
          <div
            className="absolute inset-0 bg-slate-300/80 dark:bg-slate-700 shadow-xs"
            style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
          />
        </div>

        {/* Format Header Ribbon */}
        <div className="pt-1.5 px-1.5 pr-3">
          <div
            className={`inline-flex items-center px-1.5 py-[2px] rounded-[4px] ${s.headerBg} text-[7.5px] font-black tracking-wider leading-none shadow-2xs`}
          >
            {label}
          </div>
        </div>

        {/* Realistic Miniature Page Body */}
        <div className="flex-1 px-1.5 py-1 flex flex-col justify-center gap-[3.5px] overflow-hidden">
          {children ? (
            children
          ) : variant === 'table' ? (
            <div className="grid grid-cols-3 gap-[2px] w-full">
              <div className={`h-[4.5px] rounded-[1px] ${s.accentLine}`} />
              <div className={`h-[4.5px] rounded-[1px] ${s.accentLine}`} />
              <div className={`h-[4.5px] rounded-[1px] ${s.accentLine}`} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-[3.5px] rounded-[1px] ${
                    i % 3 === 0 ? s.accentSoft : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          ) : variant === 'chart' ? (
            <div className="flex flex-col gap-1">
              <div className="h-[3px] w-3/4 rounded-full bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-end gap-[3px] h-5 px-0.5 pt-0.5 bg-slate-50 dark:bg-slate-800/70 rounded-[3px] border border-slate-100 dark:border-slate-700/70">
                <div className={`w-1.5 h-2 rounded-t-[1px] ${s.accentLine}`} />
                <div className="w-1.5 h-3.5 rounded-t-[1px] bg-indigo-400" />
                <div className={`w-1.5 h-4 rounded-t-[1px] ${s.accentLine}`} />
                <div className="w-1.5 h-2.5 rounded-t-[1px] bg-amber-400" />
              </div>
              <div className="h-[2.5px] w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : variant === 'photo' ? (
            <div className="flex flex-col gap-1">
              <div className="w-full h-6 rounded-[3px] bg-gradient-to-br from-sky-300 via-indigo-200 to-emerald-200 dark:from-sky-800 dark:to-emerald-900 relative overflow-hidden border border-slate-200/70 dark:border-slate-700">
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300" />
                <div className="absolute bottom-0 inset-x-0 h-3 bg-emerald-600/70" style={{ clipPath: 'polygon(0 100%, 35% 15%, 65% 75%, 85% 30%, 100% 100%)' }} />
              </div>
              <div className="h-[2.5px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[2.5px] w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : variant === 'contract' ? (
            <div className="flex flex-col gap-[3px]">
              <div className="h-[3.5px] w-2/3 rounded-full bg-slate-400 dark:bg-slate-500" />
              <div className="h-[2.5px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[2.5px] w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[2.5px] w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="mt-1 pt-0.5 border-t border-dashed border-slate-300 dark:border-slate-600 flex justify-between items-center">
                <div className="h-[2px] w-5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <div className={`w-2.5 h-2.5 rounded-full ${s.accentSoft} border border-current/20`} />
              </div>
            </div>
          ) : variant === 'scan' ? (
            <div className="flex flex-col gap-[3px] opacity-85">
              <div className="h-[3.5px] w-3/4 rounded-xs bg-slate-400/80 dark:bg-slate-500" />
              <div className="h-[2.5px] w-full rounded-xs bg-slate-300 dark:bg-slate-600" />
              <div className="h-[2.5px] w-5/6 rounded-xs bg-slate-300 dark:bg-slate-600" />
              <div className="h-[2.5px] w-11/12 rounded-xs bg-slate-300 dark:bg-slate-600" />
              <div className="h-[2.5px] w-2/3 rounded-xs bg-slate-300 dark:bg-slate-600" />
            </div>
          ) : variant === 'minimal' ? (
            <div className="flex flex-col gap-[4px]">
              <div className="h-[3px] w-4/5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <div className="h-[2.5px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[2.5px] w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : (
            <div className="flex flex-col gap-[3px]">
              <div className={`h-[3.5px] w-3/4 rounded-full ${s.accentLine}`} />
              <div className="h-[2.5px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[2.5px] w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[2.5px] w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[2.5px] w-3/5 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          )}
        </div>

        {/* Crisp Monospace Footer Meta Strip */}
        {sublabel && (
          <div className="px-1.5 pb-1 pt-0.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-center">
            <span className={`block text-[7.5px] font-mono font-extrabold tracking-tight leading-none truncate ${s.subtext}`}>
              {sublabel}
            </span>
          </div>
        )}
      </div>

      {/* Optional Floating Corner Pill Badge */}
      {highlightBadge && (
        <div
          className={`absolute -top-2 -right-2 px-1.5 py-[2px] rounded-md border text-[7.5px] font-mono font-black shadow-xs z-30 ${s.badgeBg}`}
        >
          {highlightBadge}
        </div>
      )}
    </div>
  );
};

/**
 * Animated Connector Bridge Arrow between Before -> After states
 */
export const ActionArrow: React.FC<{
  label?: string;
  accent?: 'indigo' | 'emerald' | 'orange' | 'red' | 'cyan' | 'purple' | 'amber' | 'blue';
  className?: string;
}> = ({ label, accent = 'indigo', className = '' }) => {
  const accentMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    orange: 'bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    purple: 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    blue: 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  return (
    <div className={`flex flex-col items-center justify-center shrink-0 px-1 ${className}`}>
      {label && (
        <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 whitespace-nowrap">
          {label}
        </span>
      )}
      <div
        className={`w-7 h-7 rounded-full border shadow-xs flex items-center justify-center ${accentMap[accent]}`}
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 tv-arrow-flow" fill="none">
          <path
            d="M3 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * Reusable Realistic Miniature Landscape Photo SVG (Alpine Mountains + Golden Sun + Lake)
 */
const MiniAlpinePhoto: React.FC<{
  className?: string;
  warm?: boolean;
  blur?: boolean;
}> = ({ className = 'w-full h-full', warm = false, blur = false }) => {
  const uid = React.useId();
  const skyId = `sky-${uid}`;
  const lakeId = `lake-${uid}`;

  return (
    <svg
      viewBox="0 0 120 80"
      preserveAspectRatio="xMidYMid slice"
      className={`${className} ${blur ? 'blur-[1.6px] saturate-75 brightness-95' : ''}`}
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={warm ? '#0284c7' : '#0ea5e9'} />
          <stop offset="55%" stopColor={warm ? '#fb923c' : '#7dd3fc'} />
          <stop offset="100%" stopColor={warm ? '#fde68a' : '#e0f2fe'} />
        </linearGradient>
        <linearGradient id={lakeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      <rect width="120" height="80" fill={`url(#${skyId})`} />
      <circle cx="92" cy="21" r="9" fill="#fef08a" opacity="0.95" />
      <circle cx="92" cy="21" r="14" fill="#fde047" opacity="0.28" />
      <path d="M-4 58 L26 24 L54 58 Z" fill="#334155" />
      <path d="M26 24 L17 36 L24 34 L27 38 L34 34 Z" fill="#f8fafc" />
      <path d="M30 58 L66 18 L104 58 Z" fill="#1e293b" />
      <path d="M66 18 L54 32 L63 29 L67 35 L77 31 Z" fill="#ffffff" />
      <path d="M74 58 L102 32 L126 58 Z" fill="#475569" />
      <rect x="0" y="56" width="120" height="24" fill={`url(#${lakeId})`} />
      <ellipse cx="66" cy="64" rx="22" ry="2.2" fill="#bae6fd" opacity="0.4" />
      <ellipse cx="92" cy="70" rx="14" ry="1.6" fill="#fef08a" opacity="0.55" />
      <path d="M0 58 L18 46 L26 58 Z" fill="#065f46" />
      <path d="M10 58 L24 49 L35 58 Z" fill="#047857" />
    </svg>
  );
};

/**
 * Reusable Realistic Vector Studio Portrait Avatar (Zero Emojis)
 */
const MiniPortraitSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 64 76" className={className} fill="none">
    {/* Shoulders / Suit Jacket */}
    <path
      d="M8 76 C8 58 18 51 32 51 C46 51 56 58 56 76 Z"
      fill="#1e293b"
    />
    {/* Crisp White Shirt Collar + Tie */}
    <path d="M25 51 L32 62 L39 51 Z" fill="#f8fafc" />
    <path d="M30.5 55 L33.5 55 L34.5 68 L32 72 L29.5 68 Z" fill="#2563eb" />
    {/* Neck */}
    <rect x="27.5" y="42" width="9" height="11" rx="4" fill="#e2b08d" />
    {/* Ears */}
    <circle cx="20.5" cy="31" r="3" fill="#e2b08d" />
    <circle cx="43.5" cy="31" r="3" fill="#e2b08d" />
    {/* Head */}
    <ellipse cx="32" cy="30" rx="11.5" ry="13.5" fill="#f1c7a5" />
    {/* Hair */}
    <path
      d="M20.5 29 C20 18 25 14 32 14 C39 14 44 18 43.5 29 C42.5 23 39 20.5 32 20.5 C25 20.5 21.5 23 20.5 29 Z"
      fill="#0f172a"
    />
    {/* Subtle Eyes & Friendly Smile */}
    <circle cx="27.8" cy="30" r="1.2" fill="#0f172a" />
    <circle cx="36.2" cy="30" r="1.2" fill="#0f172a" />
    <path d="M28.5 36.2 Q32 38.6 35.5 36.2" stroke="#9a5c44" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// =========================================================================
// 1. Compress PDF: Heavy stacked PDF pressed into slim emerald 280KB file
// =========================================================================
export const CompressPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="relative flex items-center">
        <svg viewBox="0 0 12 24" className="w-3 h-6 text-red-500 tv-press-left mr-0.5" fill="none">
          <path d="M2 5L9 12L2 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <DocIcon type="pdf" label="PDF" sublabel="5.8 MB" stacked variant="chart" />
        <svg viewBox="0 0 12 24" className="w-3 h-6 text-red-500 tv-press-right ml-0.5" fill="none">
          <path d="M10 5L3 12L10 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-mono font-black shadow-xs">
          -95%
        </span>
        <ActionArrow accent="emerald" />
      </div>

      <div className="relative tv-compress-target">
        <DocIcon
          type="pdf"
          label="PDF"
          sublabel="280 KB"
          compact
          variant="article"
          className="ring-2 ring-emerald-500/70 rounded-[8px]"
        />
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
            <path d="M2.5 6.2L5 8.7L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 2. Merge PDF: Two real pages glide inward into one thick bound PDF stack
// =========================================================================
export const MergePdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2">
      {/* Two distinct realistic input documents gliding toward each other */}
      <div className="relative flex items-center">
        <div className="tv-merge-left z-10">
          <DocIcon type="pdf" label="DOC 1" sublabel="Pg 1–3" compact variant="article" />
        </div>
        <div className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm -mx-1.5 z-20 ring-2 ring-white dark:ring-slate-900">
          +
        </div>
        <div className="tv-merge-right z-10">
          <DocIcon type="pdf" label="DOC 2" sublabel="Pg 4–7" compact variant="photo" />
        </div>
      </div>

      <ActionArrow label="Merge" accent="orange" />

      {/* Unified thick bound stacked PDF output */}
      <div className="relative tv-merge-result">
        <DocIcon
          type="pdf"
          label="MERGED"
          sublabel="7 Pages"
          isLarge
          stacked
          variant="chart"
          className="ring-2 ring-orange-400/70 rounded-[8px]"
        />
        {/* Metallic binder clip on left spine */}
        <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-gradient-to-b from-orange-400 to-red-600 shadow-xs z-30" />
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 3. Split PDF: Stacked PDF cut cleanly by animated metallic SVG scissors
// =========================================================================
export const SplitPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2">
      {/* Source multi-page stack with live animated scissor cut line */}
      <div className="relative pr-2">
        <DocIcon type="pdf" label="ALL" sublabel="12 Pgs" stacked variant="article" />
        {/* Dashed perforation line */}
        <div className="absolute right-0.5 inset-y-1 border-r-2 border-dashed border-amber-500/80" />
        {/* Animated realistic SVG scissors */}
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-slate-700 dark:text-amber-300 absolute -right-2 top-1/2 -translate-y-1/2 tv-scissors-cut drop-shadow-xs z-30"
          fill="none"
        >
          <circle cx="6.5" cy="6.5" r="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="6.5" cy="17.5" r="3" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8.5L20 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 15.5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <ActionArrow label="Split" accent="amber" />

      {/* Two extracted PDF packets drifting apart */}
      <div className="flex items-center gap-1.5">
        <div className="tv-split-left">
          <DocIcon type="pdf" label="PG 1–4" sublabel="Part A" compact variant="article" />
        </div>
        <div className="tv-split-right">
          <DocIcon type="pdf" label="PG 5–12" sublabel="Part B" compact variant="table" />
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 4. Organize PDF: Tilted scrambled pages straighten into ordered 1-2-3 deck
// =========================================================================
export const OrganizePdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2">
      {/* Scrambled tilted pages straightening */}
      <div className="flex items-center -space-x-2.5">
        <div className="tv-organize-a w-[34px] h-[48px] rounded-[6px] bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 shadow-md p-1 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-black text-rose-600 dark:text-rose-400">3</span>
          <div className="space-y-1">
            <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-[2px] w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
        <div className="tv-organize-b w-[34px] h-[48px] rounded-[6px] bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-700 shadow-md p-1 flex flex-col justify-between z-10">
          <span className="text-[8px] font-mono font-black text-indigo-600 dark:text-indigo-400">1</span>
          <div className="space-y-1">
            <div className="h-[2px] w-full bg-indigo-200 dark:bg-indigo-800 rounded-full" />
            <div className="h-[2px] w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
        <div className="tv-organize-a w-[34px] h-[48px] rounded-[6px] bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-md p-1 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-black text-amber-600 dark:text-amber-400">2</span>
          <div className="space-y-1">
            <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-[2px] w-4/5 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>

      <ActionArrow label="Sort" accent="indigo" />

      {/* Crisp aligned numbered 1-2-3 pages */}
      <div className="flex items-center gap-1 tv-organize-pop">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="w-[30px] h-[46px] rounded-[5px] bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700 shadow-sm p-1 flex flex-col justify-between"
          >
            <span className="text-[8px] font-mono font-black text-emerald-700 dark:text-emerald-400 text-center bg-emerald-50 dark:bg-emerald-950/70 rounded-[3px]">
              {n}
            </span>
            <div className="space-y-[3px]">
              <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-[2px] w-4/5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-[2px] w-3/5 bg-emerald-300 dark:bg-emerald-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 5. PDF to Word: Static PDF converts into editable DOCX with blinking cursor
// =========================================================================
export const PdfToWordVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="pdf" label="PDF" sublabel="Fixed" variant="article" />
      <ActionArrow label="Convert" accent="blue" />
      <DocIcon type="word" label="DOCX" sublabel="Editable" isLarge>
        <div className="flex flex-col gap-[3.5px]">
          <div className="flex items-center gap-0.5 bg-blue-100/80 dark:bg-blue-950/80 px-1 py-[1.5px] rounded-[2px]">
            <div className="h-[3px] w-8 rounded-full bg-blue-600 dark:bg-blue-400" />
            <div className="w-[1.5px] h-2.5 bg-blue-600 dark:bg-blue-300 tv-cursor-blink" />
          </div>
          <div className="h-[2.5px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-[2.5px] w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-[2.5px] w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </DocIcon>
    </div>
  </VisualStage>
);

// =========================================================================
// 6. Word to PDF: Editable DOCX draft exports into official sealed PDF
// =========================================================================
export const WordToPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="word" label="DOCX" sublabel="Draft" variant="article" />
      <ActionArrow label="Export" accent="red" />
      <div className="relative tv-soft-float">
        <DocIcon type="pdf" label="PDF" sublabel="Print Ready" isLarge stacked variant="contract" />
        <div className="absolute -bottom-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm z-30">
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
            <path d="M2.5 6.2L5 8.7L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 7. Sign PDF: Realistic Contract Sheet with Animated SVG Fountain Pen Signature
// =========================================================================
export const SignPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-3">
      <div className="relative">
        <DocIcon type="pdf" label="AGREEMENT" sublabel="Signed.pdf" isLarge>
          <div className="flex flex-col gap-[3px]">
            <div className="h-[3px] w-3/4 rounded-full bg-slate-400 dark:bg-slate-500" />
            <div className="h-[2px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-[2px] w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
            {/* Live cursive signature line */}
            <div className="relative mt-1 pt-1 border-b border-slate-300 dark:border-slate-600 h-6 flex items-center">
              <svg viewBox="0 0 64 22" className="w-full h-5 overflow-visible" fill="none">
                <path
                  d="M4 16 C10 3, 15 19, 22 10 C27 3, 30 18, 37 11 C42 6, 47 16, 58 8"
                  stroke="#1d4ed8"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="tv-pen-draw"
                />
              </svg>
            </div>
          </div>
        </DocIcon>

        {/* Realistic gliding vector fountain pen */}
        <svg
          viewBox="0 0 28 28"
          className="w-7 h-7 absolute bottom-4 right-1 tv-pen-glide drop-shadow-md z-30 pointer-events-none"
          fill="none"
        >
          <path d="M20.5 3.5L24.5 7.5L11 21L5.5 22.5L7 17L20.5 3.5Z" fill="#1e3a8a" stroke="#eff6ff" strokeWidth="1.2" />
          <path d="M18 6L22 10" stroke="#93c5fd" strokeWidth="1.5" />
          <path d="M5.5 22.5L9.5 19.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[8px] font-bold text-blue-700 dark:text-blue-300">
          Draw / Type
        </span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[8px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
          ✓ Verified
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 8. Watermark PDF: Clean PDF receives realistic rubber-stamp CONFIDENTIAL imprint
// =========================================================================
export const WatermarkPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="pdf" label="PLAIN" sublabel="Original" variant="article" />
      <ActionArrow label="Stamp" accent="purple" />
      <div className="relative">
        <DocIcon type="pdf" label="PDF" sublabel="Protected" isLarge variant="article" />
        {/* Animated rubber ink stamp landing diagonally across the sheet */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
          <div className="tv-stamp-land px-1.5 py-0.5 rounded-[4px] border-2 border-purple-600 dark:border-purple-400 bg-purple-50/90 dark:bg-purple-950/85 text-purple-700 dark:text-purple-200 text-[7px] font-black tracking-widest uppercase shadow-sm">
            CONFIDENTIAL
          </div>
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 9. Protect PDF: Open PDF transitions to AES-256 shielded locked document
// =========================================================================
export const ProtectPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="pdf" label="PDF" sublabel="Open File" variant="contract" />
      <ActionArrow label="AES-256" accent="red" />
      <div className="relative">
        <DocIcon
          type="pdf"
          label="LOCKED"
          sublabel="Encrypted"
          isLarge
          variant="minimal"
          className="ring-2 ring-red-500/60 rounded-[8px]"
        >
          <div className="flex flex-col items-center justify-center py-0.5 relative">
            {/* Subtle expanding shield pulse */}
            <div className="absolute w-8 h-8 rounded-full border-2 border-red-400/60 tv-shield-ring" />
            {/* Realistic Metallic Padlock SVG with snapping shackle */}
            <svg viewBox="0 0 28 30" className="w-7 h-7 z-10" fill="none">
              <path
                d="M9 13V9.5C9 6.7 11.2 4.5 14 4.5C16.8 4.5 19 6.7 19 9.5V13"
                stroke="#64748b"
                strokeWidth="2.6"
                strokeLinecap="round"
                className="tv-shackle-lock"
              />
              <rect x="6" y="12.5" width="16" height="13" rx="3" fill="#dc2626" />
              <rect x="6" y="12.5" width="16" height="5" rx="2" fill="#ef4444" />
              <circle cx="14" cy="18.2" r="1.8" fill="#fef2f2" />
              <path d="M14 19.5V22.2" stroke="#fef2f2" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </DocIcon>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 10. Unlock PDF: Password-locked PDF opens smoothly with springing metallic shackle
// =========================================================================
export const UnlockPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="pdf" label="LOCKED" sublabel="Password" variant="minimal">
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 28 30" className="w-6 h-6" fill="none">
            <path
              d="M9 13V9.5C9 6.7 11.2 4.5 14 4.5C16.8 4.5 19 6.7 19 9.5V13"
              stroke="#64748b"
              strokeWidth="2.6"
              strokeLinecap="round"
              className="tv-shackle-unlock"
            />
            <rect x="6" y="12.5" width="16" height="13" rx="3" fill="#b91c1c" />
            <circle cx="14" cy="18.8" r="1.8" fill="#ffffff" />
          </svg>
        </div>
      </DocIcon>

      <ActionArrow label="Unlock" accent="emerald" />

      <div className="relative tv-soft-float">
        <DocIcon
          type="excel"
          label="UNLOCKED"
          sublabel="Full Access"
          isLarge
          variant="article"
          className="ring-2 ring-emerald-500/70 rounded-[8px]"
        />
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm z-30">
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
            <path d="M3.5 8.5L6.5 11.5L12.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 11. PDF to Images: Multi-page PDF fans out into crisp framed Alpine JPG/PNG cards
// =========================================================================
export const PdfToImagesVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="pdf" label="PDF" sublabel="Pages" stacked variant="photo" />
      <ActionArrow label="Export" accent="amber" />
      <div className="relative flex items-center w-[76px] h-[72px]">
        <div className="tv-fan-1 absolute left-0 top-1 w-[52px] h-[62px] rounded-[7px] bg-white dark:bg-slate-900 p-1 pb-2.5 border border-amber-300 dark:border-amber-700 shadow-md flex flex-col justify-between">
          <div className="w-full h-9 rounded-[4px] overflow-hidden">
            <MiniAlpinePhoto warm />
          </div>
          <span className="text-[7px] font-mono font-black text-amber-700 dark:text-amber-300 text-center leading-none">
            PAGE_1.JPG
          </span>
        </div>
        <div className="tv-fan-2 absolute right-0 bottom-0.5 w-[52px] h-[62px] rounded-[7px] bg-white dark:bg-slate-900 p-1 pb-2.5 border border-purple-300 dark:border-purple-700 shadow-lg flex flex-col justify-between z-10">
          <div className="w-full h-9 rounded-[4px] overflow-hidden">
            <MiniAlpinePhoto />
          </div>
          <span className="text-[7px] font-mono font-black text-purple-700 dark:text-purple-300 text-center leading-none">
            PAGE_2.PNG
          </span>
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 12. Image to PDF: Crisp scenic photos slide together & bind into PDF Album
// =========================================================================
export const ImageToPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="flex items-center -space-x-2">
        <div className="tv-merge-left w-[46px] h-[56px] rounded-[7px] bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shadow-md flex flex-col justify-between">
          <div className="w-full h-8 rounded-[4px] overflow-hidden">
            <MiniAlpinePhoto warm />
          </div>
          <span className="text-[6.5px] font-mono font-bold text-slate-500 text-center">IMG_01</span>
        </div>
        <div className="tv-merge-right w-[46px] h-[56px] rounded-[7px] bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shadow-md flex flex-col justify-between z-10">
          <div className="w-full h-8 rounded-[4px] overflow-hidden">
            <MiniAlpinePhoto />
          </div>
          <span className="text-[6.5px] font-mono font-bold text-slate-500 text-center">IMG_02</span>
        </div>
      </div>

      <ActionArrow label="Bind" accent="emerald" />

      <div className="tv-merge-result">
        <DocIcon type="pdf" label="PDF" sublabel="Photo Album" isLarge stacked variant="photo" />
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 13. Searchable PDF & OCR: Laser beam sweeps scanned page + magnifier highlights matches
// =========================================================================
export const SearchablePdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      {/* Scanned page with live cyan laser scan beam */}
      <div className="relative overflow-hidden rounded-[7px]">
        <DocIcon type="scan" label="SCAN" sublabel="Image PDF" variant="scan" />
        <div className="pointer-events-none absolute inset-x-0 top-2 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_2px_rgba(34,211,238,0.85)] tv-laser-sweep z-30" />
      </div>

      <ActionArrow label="OCR" accent="cyan" />

      {/* Searchable PDF with illuminated yellow keyword match & panning vector magnifier */}
      <div className="relative">
        <DocIcon type="word" label="SEARCH" sublabel="Ctrl+F Ready" isLarge>
          <div className="flex flex-col gap-[3.5px]">
            <div className="h-[2.5px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1">
              <div className="h-[5px] w-7 rounded-[2px] bg-amber-300 dark:bg-amber-400/90 tv-match-glow" />
              <div className="h-[2.5px] w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-[2.5px] w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1">
              <div className="h-[2.5px] w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-[5px] w-8 rounded-[2px] bg-amber-300 dark:bg-amber-400/90 tv-match-glow" />
            </div>
          </div>
        </DocIcon>

        {/* Crisp Vector Magnifying Glass */}
        <svg
          viewBox="0 0 28 28"
          className="w-7 h-7 absolute -bottom-1.5 -right-2 tv-magnifier-pan drop-shadow-md z-30 pointer-events-none"
          fill="none"
        >
          <circle cx="12" cy="12" r="7.5" fill="rgba(224,242,254,0.65)" stroke="#0284c7" strokeWidth="2.4" />
          <path d="M9 10.5C9.8 8.8 11.4 8 13 8.2" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M17.8 17.8L24 24" stroke="#0369a1" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 14. Delete PDF Pages: Middle page flagged with crimson X lifts & fades away
// =========================================================================
export const DeletePdfPagesVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="w-[32px] h-[48px] rounded-[5px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs p-1 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-bold text-slate-600 dark:text-slate-300">1</span>
          <div className="space-y-1">
            <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-[2px] w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>

        {/* Page 2 being removed */}
        <div className="relative tv-delete-drop w-[34px] h-[50px] rounded-[5px] bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-500 shadow-md p-1 flex flex-col items-center justify-center">
          <span className="text-[7px] font-mono font-bold text-rose-500 absolute top-0.5 left-1">2</span>
          <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
              <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="w-[32px] h-[48px] rounded-[5px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs p-1 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-bold text-slate-600 dark:text-slate-300">3</span>
          <div className="space-y-1">
            <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-[2px] w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>

      <ActionArrow label="Drop" accent="red" />

      <div className="flex items-center gap-1">
        {[1, 3].map((p) => (
          <div
            key={p}
            className="w-[32px] h-[48px] rounded-[5px] bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700 shadow-sm p-1 flex flex-col justify-between"
          >
            <span className="text-[8px] font-mono font-black text-emerald-700 dark:text-emerald-400">{p}</span>
            <div className="space-y-1">
              <div className="h-[2px] w-full bg-emerald-200 dark:bg-emerald-900 rounded-full" />
              <div className="h-[2px] w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 15. Page Numbers PDF: Blank footer pages receive crisp blue "Page 1 of 12" badges
// =========================================================================
export const PageNumbersVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="neutral" label="DOC" sublabel="No Footer" variant="article" />
      <ActionArrow label="1, 2, 3" accent="blue" />
      <DocIcon type="word" label="PDF" isLarge>
        <div className="flex flex-col justify-between h-full py-0.5">
          <div className="space-y-[3px]">
            <div className="h-[3px] w-3/4 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="h-[2.5px] w-full rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-[2.5px] w-5/6 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="tv-footer-pop mt-1 py-[2.5px] px-1 rounded-[4px] bg-blue-600 text-white text-[7px] font-mono font-black text-center shadow-xs">
            Pg 1 of 12
          </div>
        </div>
      </DocIcon>
    </div>
  </VisualStage>
);

// =========================================================================
// 16. Custom Photo Studio Card Visual: Upgraded Spacious 7-Step All-in-One Alpine Studio
// =========================================================================
export const CustomPhotoStudioCardVisual: React.FC = () => (
  <VisualStage>
    <div className="relative w-[228px] h-[86px] rounded-xl overflow-hidden bg-slate-900 shadow-md border border-slate-700/80 flex items-center justify-center">
      {/* Live Animated Alpine Photo Canvas */}
      <div className="relative w-full h-full studio-photo-transform flex items-center justify-center">
        <MiniAlpinePhoto className="w-full h-full studio-photo-filter" />
        {/* Step 2: Animated Crop Frame Box */}
        <div className="studio-step-2-crop absolute inset-0 pointer-events-none z-10">
          <div className="studio-step-2-box absolute border-[1.5px] border-dashed border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.52)]">
            <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-cyan-300" />
            <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-cyan-300" />
            <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-cyan-300" />
            <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-cyan-300" />
          </div>
        </div>
      </div>

      {/* Step 1: Upload Once */}
      <div className="studio-step-1 absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-xs border border-white/25 text-white text-[9px] font-extrabold shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          Upload Once
        </div>
      </div>

      {/* Step 2 Badge: Crop */}
      <div className="studio-step-2-crop absolute bottom-1.5 left-2 pointer-events-none z-20">
        <span className="px-2 py-0.5 rounded-md bg-cyan-600/95 text-white text-[8px] font-black tracking-wide shadow-sm">
          Crop 16:9
        </span>
      </div>

      {/* Step 3: Resize Dimensions */}
      <div className="studio-step-3-resize absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="px-2.5 py-1 rounded-full bg-blue-600/95 text-white text-[8.5px] font-mono font-black shadow-md border border-blue-300/40">
          ↔ 800 × 600 px
        </div>
      </div>

      {/* Step 4: Straighten / Rotate */}
      <div className="studio-step-4-rotate absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="px-2.5 py-1 rounded-full bg-indigo-600/95 text-white text-[8.5px] font-extrabold shadow-md border border-indigo-300/40">
          ↻ Straighten 0.0°
        </div>
      </div>

      {/* Step 5: Live Brightness / Color Slider */}
      <div className="studio-step-5-slider absolute inset-x-3 bottom-2 pointer-events-none z-20 flex flex-col gap-1 bg-slate-950/80 backdrop-blur-xs rounded-lg px-2.5 py-1.5 border border-white/20">
        <div className="flex items-center justify-between text-[7.5px] font-bold text-amber-200 leading-none">
          <span>Enhance Clarity</span>
          <span className="font-mono">+35%</span>
        </div>
        <div className="relative h-1.5 w-full rounded-full bg-slate-600">
          <div className="absolute inset-y-0 left-0 w-3/4 rounded-full bg-gradient-to-r from-amber-400 to-cyan-400" />
          <div className="studio-slider-thumb absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-slate-300" />
        </div>
      </div>

      {/* Step 6: Target KB Compress */}
      <div className="studio-step-6-compress absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[8.5px] font-mono font-black shadow-md border border-emerald-300/40">
          2.4 MB → 48 KB
        </div>
      </div>

      {/* Step 7: Export & Shimmer */}
      <div className="studio-step-7-download absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold shadow-md border border-white/40">
          ✓ Ready to Download
        </div>
      </div>

      <div className="studio-shimmer pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 to-transparent z-30" />
    </div>
  </VisualStage>
);

// =========================================================================
// 17. Resize Image: Framed photo scaling cleanly with blue corner handles
// =========================================================================
export const ResizeImageVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="relative w-[76px] h-[64px] rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 p-1 bg-white dark:bg-slate-900 shadow-sm">
        <div className="w-full h-full rounded-[4px] overflow-hidden">
          <MiniAlpinePhoto />
        </div>
        {/* 4 Blue Corner Handles */}
        <span className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 rounded-[2px] border border-white" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-[2px] border border-white" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-600 rounded-[2px] border border-white" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-600 rounded-[2px] border border-white" />
        <span className="absolute bottom-1.5 left-1.5 px-1 py-[1px] rounded bg-slate-950/80 text-white text-[6.5px] font-mono font-bold">
          4000px
        </span>
      </div>

      <ActionArrow label="Resize" accent="blue" />

      <div className="tv-compress-target w-[56px] h-[48px] rounded-lg border-2 border-blue-600 p-0.5 bg-white dark:bg-slate-900 shadow-md flex flex-col">
        <div className="flex-1 rounded-[4px] overflow-hidden">
          <MiniAlpinePhoto />
        </div>
        <span className="text-[7px] font-mono font-black text-blue-700 dark:text-blue-300 text-center py-[1px]">
          800×600
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 18. Compress Image: Heavy 8.4MB photo shrinks to crisp 48KB with full clarity
// =========================================================================
export const CompressImageVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="w-[68px] h-[68px] rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shadow-md flex flex-col justify-between">
        <div className="w-full h-11 rounded-[4px] overflow-hidden">
          <MiniAlpinePhoto warm />
        </div>
        <span className="text-[7.5px] font-mono font-extrabold text-red-600 dark:text-red-400 text-center">
          8.4 MB
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-mono font-black shadow-xs">
          -94%
        </span>
        <ActionArrow accent="emerald" />
      </div>

      <div className="tv-compress-target relative w-[54px] h-[56px] rounded-lg bg-white dark:bg-slate-900 p-1 border-2 border-emerald-500 shadow-md flex flex-col justify-between">
        <div className="w-full h-8 rounded-[4px] overflow-hidden">
          <MiniAlpinePhoto warm />
        </div>
        <span className="text-[7.5px] font-mono font-black text-emerald-700 dark:text-emerald-300 text-center">
          48 KB
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 19. JPG to PNG: Solid framed photo transforms into crisp transparent cutout PNG
// =========================================================================
export const JpgToPngVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="w-[62px] h-[64px] rounded-lg bg-white dark:bg-slate-900 p-1 border border-amber-300 dark:border-amber-700 shadow-md flex flex-col justify-between">
        <div className="w-full h-10 rounded-[4px] overflow-hidden">
          <MiniAlpinePhoto warm />
        </div>
        <span className="text-[7.5px] font-mono font-black text-amber-700 dark:text-amber-300 text-center">
          JPG
        </span>
      </div>

      <ActionArrow label="Alpha" accent="purple" />

      <div className="relative w-[64px] h-[66px] rounded-lg bg-white dark:bg-slate-900 p-1 border-2 border-purple-500 shadow-md flex flex-col justify-between overflow-hidden">
        {/* Realistic transparency checkerboard grid */}
        <div
          className="relative w-full h-10 rounded-[4px] overflow-hidden flex items-center justify-center"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
          }}
        >
          {/* Crisp Cutout Mountain Emblem floating over transparency */}
          <svg viewBox="0 0 48 34" className="w-10 h-8 drop-shadow-sm tv-soft-float">
            <path d="M4 30 L18 8 L30 24 L36 14 L44 30 Z" fill="#4f46e5" />
            <path d="M18 8 L13 16 L18 14 L22 17 Z" fill="#ffffff" />
            <circle cx="35" cy="9" r="3.5" fill="#fbbf24" />
          </svg>
        </div>
        <span className="text-[7.5px] font-mono font-black text-purple-700 dark:text-purple-300 text-center">
          PNG
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 20. PNG to JPG: Heavy checkered PNG flattens cleanly into lightweight JPG photo
// =========================================================================
export const PngToJpgVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="w-[62px] h-[64px] rounded-lg bg-white dark:bg-slate-900 p-1 border border-purple-300 dark:border-purple-700 shadow-md flex flex-col justify-between">
        <div
          className="w-full h-10 rounded-[4px] flex items-center justify-center"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
          }}
        >
          <svg viewBox="0 0 48 34" className="w-10 h-8">
            <path d="M4 30 L18 8 L30 24 L36 14 L44 30 Z" fill="#7c3aed" />
            <circle cx="35" cy="9" r="3.5" fill="#fbbf24" />
          </svg>
        </div>
        <span className="text-[7.5px] font-mono font-black text-purple-700 dark:text-purple-300 text-center">
          PNG
        </span>
      </div>

      <ActionArrow label="Flatten" accent="amber" />

      <div className="tv-soft-float w-[64px] h-[66px] rounded-lg bg-white dark:bg-slate-900 p-1 border-2 border-amber-500 shadow-md flex flex-col justify-between">
        <div className="w-full h-10 rounded-[4px] overflow-hidden">
          <MiniAlpinePhoto warm />
        </div>
        <span className="text-[7.5px] font-mono font-black text-amber-700 dark:text-amber-300 text-center">
          JPG · Light
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 21. Image Enhancer: Live panoramic Before (Blur) / After (HD Sharp) slider sweep
// =========================================================================
export const ImageEnhancerVisual: React.FC = () => (
  <VisualStage>
    <div className="relative w-[184px] h-[82px] rounded-xl overflow-hidden border-2 border-indigo-400/70 dark:border-indigo-600/80 shadow-md bg-slate-900">
      {/* Blurred Left/Base Photo */}
      <MiniAlpinePhoto className="absolute inset-0 w-full h-full" blur />

      {/* Ultra-Sharp HD Right Reveal Layer */}
      <div className="absolute inset-0 tv-enhancer-clip">
        <MiniAlpinePhoto className="w-full h-full contrast-110 saturate-125 brightness-105" />
      </div>

      {/* Labels */}
      <span className="absolute top-1.5 left-2 px-1.5 py-[1px] rounded bg-slate-950/75 text-slate-300 text-[7px] font-mono font-bold z-10">
        BLUR
      </span>
      <span className="absolute top-1.5 right-2 px-1.5 py-[1px] rounded bg-indigo-600/95 text-white text-[7px] font-mono font-black z-10 shadow-xs">
        HD SHARP
      </span>

      {/* Animated Vertical Comparison Divider + Circular Drag Handle */}
      <div className="absolute inset-y-0 left-1/2 -ml-[1px] w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] tv-slider-sweep z-20 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-white text-indigo-700 shadow-md border border-indigo-200 flex items-center justify-center text-[8px] font-black">
          ↔
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 22. Image Crop & Rotate: Scenic photo with animated rule-of-thirds crop frame
// =========================================================================
export const ImageCropVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="relative w-[92px] h-[68px] rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-md bg-slate-900">
        <MiniAlpinePhoto className="w-full h-full opacity-70" />
        {/* Rule-of-thirds animated crop box */}
        <div className="absolute inset-2.5 border-2 border-cyan-300 shadow-[0_0_0_999px_rgba(15,23,42,0.45)] tv-crop-focus grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="border border-white/25" />
          ))}
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />
        </div>
      </div>

      <ActionArrow label="Crop" accent="cyan" />

      <div className="w-[58px] h-[58px] rounded-lg bg-white dark:bg-slate-900 p-1 border-2 border-cyan-500 shadow-md flex flex-col justify-between">
        <div className="w-full h-9 rounded-[4px] overflow-hidden">
          <MiniAlpinePhoto />
        </div>
        <span className="text-[7px] font-mono font-black text-cyan-700 dark:text-cyan-300 text-center">
          1:1 Framed
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 23. Passport Photo Cropper: Crisp studio portrait with biometric 35×45mm guides
// =========================================================================
export const PassportCropVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-3">
      {/* Biometric Guide Viewport */}
      <div className="relative w-[62px] h-[78px] rounded-lg bg-gradient-to-b from-sky-100 to-blue-200 dark:from-sky-950 dark:to-blue-900 border-2 border-blue-500 shadow-md overflow-hidden flex items-end justify-center">
        <MiniPortraitSvg className="w-12 h-15" />
        {/* Animated Biometric Calibration Frame */}
        <div className="absolute inset-1.5 border border-dashed border-blue-600/80 dark:border-cyan-300/80 rounded-sm tv-crop-focus pointer-events-none">
          <div className="absolute inset-x-0 top-[38%] border-t border-cyan-500/70" />
        </div>
        <span className="absolute top-1 left-1 px-1 py-[0.5px] rounded bg-blue-600 text-white text-[6px] font-mono font-black">
          35×45mm
        </span>
      </div>

      <ActionArrow label="Cut" accent="blue" />

      {/* Ready-to-print Official 2x2 Passport Strip */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="w-[30px] h-[38px] rounded-[4px] bg-white border border-slate-300 dark:border-slate-600 p-0.5 shadow-sm overflow-hidden"
            >
              <div className="w-full h-full bg-sky-50 rounded-[2px] flex items-end justify-center overflow-hidden">
                <MiniPortraitSvg className="w-6 h-8" />
              </div>
            </div>
          ))}
        </div>
        <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[7px] font-mono font-extrabold text-blue-700 dark:text-blue-300 text-center">
          2×2″ Official
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 24. Exam Photo & Signature Resizer: Portrait + Live Signature -> UPSC/SSC Card
// =========================================================================
export const ExamPhotoSignatureVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2">
      {/* Photo + Signature Inputs */}
      <div className="flex flex-col gap-1.5 items-center">
        <div className="w-[46px] h-[44px] rounded-md bg-sky-50 dark:bg-sky-950 border border-amber-300 dark:border-amber-700 shadow-xs overflow-hidden flex items-end justify-center">
          <MiniPortraitSvg className="w-9 h-10" />
        </div>
        <div className="w-[54px] h-[20px] rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-1 flex items-center justify-center shadow-xs">
          <svg viewBox="0 0 56 16" className="w-full h-3.5" fill="none">
            <path
              d="M4 12 C10 3, 14 14, 21 7 C26 3, 30 13, 38 7 C43 4, 47 11, 52 6"
              stroke="#1e40af"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="tv-pen-draw"
            />
          </svg>
        </div>
      </div>

      <ActionArrow label="Preset" accent="amber" />

      {/* Official Verified Exam Submission Sheet */}
      <div className="tv-soft-float w-[68px] h-[74px] rounded-lg bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-md p-1.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-black text-amber-700 dark:text-amber-300 tracking-wide">UPSC / SSC</span>
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[7px] flex items-center justify-center font-black">
            ✓
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-7 rounded-[3px] bg-sky-100 overflow-hidden flex items-end justify-center border border-slate-200">
            <MiniPortraitSvg className="w-5 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-[2.5px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-[2.5px] w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-[5px] w-full rounded-[2px] bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800" />
          </div>
        </div>
        <div className="px-1 py-[1.5px] rounded bg-emerald-50 dark:bg-emerald-950/70 text-[6.5px] font-mono font-black text-emerald-700 dark:text-emerald-300 text-center">
          20–50 KB OK
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 25. Photo Background Changer: Busy backdrop wipes cleanly to crisp studio blue
// =========================================================================
export const PhotoBgChangerVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      {/* Live Animated Wipe Card */}
      <div className="relative w-[68px] h-[78px] rounded-xl border-2 border-blue-500 shadow-md overflow-hidden">
        {/* Busy Warm Background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-300 via-rose-300 to-purple-300">
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-orange-400/60" />
          <div className="absolute bottom-5 right-1 w-5 h-5 rounded-full bg-pink-500/40" />
        </div>
        {/* Clean Official Studio Blue Backdrop Wiping Over */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-blue-600 tv-bg-wipe" />
        {/* Subject Portrait Always Crisp on Top */}
        <div className="relative z-10 w-full h-full flex items-end justify-center">
          <MiniPortraitSvg className="w-13 h-16 drop-shadow-sm" />
        </div>
      </div>

      <ActionArrow label="Studio" accent="blue" />

      {/* Palette Swatches Output */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 shadow-xs" />
          <span className="w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-200 shadow-xs ring-2 ring-blue-500/40" />
          <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-red-200 shadow-xs" />
        </div>
        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[7.5px] font-bold text-blue-700 dark:text-blue-300 text-center">
          Clean Backdrop
        </span>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 26. OCR Tool: Scanned photo swept by cyan laser extracting live selectable text
// =========================================================================
export const OcrToolVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <div className="relative overflow-hidden rounded-[7px]">
        <DocIcon type="scan" label="IMG" sublabel="Scanned" variant="scan" />
        <div className="pointer-events-none absolute inset-x-0 top-2 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_2px_rgba(34,211,238,0.85)] tv-laser-sweep z-30" />
      </div>

      <ActionArrow label="Extract" accent="cyan" />

      <DocIcon type="word" label="TEXT" sublabel="Copyable" isLarge>
        <div className="flex flex-col gap-[3.5px]">
          <div className="px-1 py-[1px] rounded-[2px] bg-cyan-100 dark:bg-cyan-950/80 text-[6.5px] font-mono font-bold text-cyan-800 dark:text-cyan-200 tv-match-glow">
            ABC 123
          </div>
          <div className="h-[2.5px] w-full rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="h-[2.5px] w-4/5 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-0.5">
            <div className="h-[2.5px] w-7 rounded-full bg-cyan-500" />
            <div className="w-[1.5px] h-2.5 bg-cyan-600 dark:bg-cyan-300 tv-cursor-blink" />
          </div>
        </div>
      </DocIcon>
    </div>
  </VisualStage>
);

// =========================================================================
// 27. Excel to PDF: Emerald spreadsheet grid exports into formatted PDF report
// =========================================================================
export const ExcelToPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="excel" label="XLSX" sublabel="Sheet Grid" variant="table" />
      <ActionArrow label="Export" accent="emerald" />
      <div className="tv-soft-float">
        <DocIcon type="pdf" label="PDF" sublabel="Report" isLarge stacked variant="chart" />
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 28. PDF to Excel: PDF invoice tables extract cleanly into emerald XLSX cells
// =========================================================================
export const PdfToExcelVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="pdf" label="PDF" sublabel="Invoice" variant="table" />
      <ActionArrow label="Extract" accent="emerald" />
      <div className="tv-soft-float">
        <DocIcon type="excel" label="XLSX" sublabel="Editable" isLarge variant="table" />
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 29. CSV to XLSX: Raw comma-separated data transforms into structured Excel workbook
// =========================================================================
export const CsvToXlsxVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="csv" label="CSV" sublabel="Raw Data">
        <div className="font-mono text-[6.5px] leading-tight text-slate-600 dark:text-slate-300 space-y-0.5">
          <div>id,val,qt</div>
          <div>01,480,2</div>
          <div>02,910,5</div>
        </div>
      </DocIcon>
      <ActionArrow label="Parse" accent="emerald" />
      <div className="tv-soft-float">
        <DocIcon type="excel" label="XLSX" sublabel="Formatted" isLarge variant="table" />
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 30. XLSX to CSV: Formatted Excel workbook exports into lightweight flat CSV
// =========================================================================
export const XlsxToCsvVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="excel" label="XLSX" sublabel="Workbook" variant="table" />
      <ActionArrow label="Flatten" accent="cyan" />
      <div className="tv-soft-float">
        <DocIcon type="csv" label="CSV" sublabel="Universal" isLarge>
          <div className="font-mono text-[6.5px] leading-tight text-teal-700 dark:text-teal-300 space-y-0.5">
            <div>a,b,total</div>
            <div>12,45,57</div>
            <div>34,10,44</div>
          </div>
        </DocIcon>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 31. PowerPoint to PDF: Wide burnt-orange slide deck exports to stacked PDF deck
// =========================================================================
export const PptToPdfVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      {/* Realistic 16:9 Presentation Slide */}
      <div className="relative w-[82px] h-[60px] rounded-[7px] bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 shadow-md overflow-hidden flex flex-col justify-between p-1.5">
        <div className="flex items-center justify-between">
          <span className="px-1.5 py-[1.5px] rounded-[3px] bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[7px] font-black leading-none">
            PPTX
          </span>
          <span className="text-[6.5px] font-mono text-slate-400">16:9</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-6 h-6 rounded-full border-[4px] border-orange-400 border-t-amber-200 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-[3px] w-full bg-orange-400/80 rounded-full" />
            <div className="h-[2px] w-4/5 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-[2px] w-3/5 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>

      <ActionArrow label="Export" accent="orange" />

      <div className="tv-soft-float">
        <DocIcon type="pdf" label="PDF" sublabel="Deck Handout" isLarge stacked variant="chart" />
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 32. Text Diff Comparator: Side-by-side code panes with animated red/green diff focus
// =========================================================================
export const TextDiffVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2">
      <div className="w-[74px] h-[72px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md p-1.5 flex flex-col justify-between font-mono text-[7px]">
        <span className="text-[6.5px] font-bold text-slate-400 uppercase">Version A</span>
        <div className="space-y-1">
          <div className="px-1 py-[1.5px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate">01 header</div>
          <div className="px-1 py-[1.5px] rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold tv-match-glow truncate">
            - old_val
          </div>
          <div className="px-1 py-[1.5px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate">03 footer</div>
        </div>
      </div>

      <ActionArrow label="Diff" accent="cyan" />

      <div className="w-[74px] h-[72px] rounded-lg bg-white dark:bg-slate-900 border border-emerald-400/80 dark:border-emerald-700 shadow-md p-1.5 flex flex-col justify-between font-mono text-[7px]">
        <span className="text-[6.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Version B</span>
        <div className="space-y-1">
          <div className="px-1 py-[1.5px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate">01 header</div>
          <div className="px-1 py-[1.5px] rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold tv-match-glow truncate">
            + new_val
          </div>
          <div className="px-1 py-[1.5px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate">03 footer</div>
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 33. Text Cleaner: Messy jagged text aligns cleanly into crisp justified lines
// =========================================================================
export const TextCleanerVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="text" label="RAW" sublabel="Messy">
        <div className="space-y-[4px]">
          <div className="h-[2.5px] w-5 bg-rose-400/80 rounded-full ml-2" />
          <div className="h-[2.5px] w-7 bg-slate-400 rounded-full ml-3" />
          <div className="h-[2.5px] w-6 bg-rose-400/80 rounded-full" />
          <div className="h-[2.5px] w-4 bg-slate-400 rounded-full ml-2.5" />
        </div>
      </DocIcon>

      <ActionArrow label="Clean" accent="blue" />

      <div className="tv-soft-float">
        <DocIcon type="word" label="CLEAN" sublabel="Formatted" isLarge>
          <div className="space-y-[4px]">
            <div className="h-[2.5px] w-full bg-blue-500/85 rounded-full" />
            <div className="h-[2.5px] w-full bg-blue-400/75 rounded-full" />
            <div className="h-[2.5px] w-full bg-blue-400/75 rounded-full" />
            <div className="h-[2.5px] w-3/4 bg-blue-500/85 rounded-full" />
          </div>
        </DocIcon>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 34. Sheet Viewer: Interactive tabular grid with gliding row inspection highlight
// =========================================================================
export const SheetViewerVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="excel" label="XLSX" sublabel="Data" compact variant="table" />
      <ActionArrow label="View" accent="emerald" />
      <div className="relative w-[96px] h-[72px] rounded-lg bg-white dark:bg-slate-900 border-2 border-emerald-500/80 shadow-md p-1.5 flex flex-col justify-between overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-3 gap-1">
          <div className="h-3 rounded-[2px] bg-emerald-600 text-[6px] font-mono font-bold text-white flex items-center justify-center">
            A
          </div>
          <div className="h-3 rounded-[2px] bg-emerald-600 text-[6px] font-mono font-bold text-white flex items-center justify-center">
            B
          </div>
          <div className="h-3 rounded-[2px] bg-emerald-600 text-[6px] font-mono font-bold text-white flex items-center justify-center">
            C
          </div>
        </div>
        {/* Animated Row Scanner Highlight */}
        <div className="relative flex-1 mt-1 space-y-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[10px] rounded-[2px] bg-emerald-400/30 border border-emerald-500/60 tv-row-scan z-10" />
          {[0, 1, 2].map((r) => (
            <div key={r} className="grid grid-cols-3 gap-1">
              <div className="h-[9px] rounded-[2px] bg-slate-100 dark:bg-slate-800" />
              <div className="h-[9px] rounded-[2px] bg-slate-100 dark:bg-slate-800" />
              <div className="h-[9px] rounded-[2px] bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 35. PDF & ID Redactor: Official ID card permanently masked with obsidian redaction bar
// =========================================================================
export const RedactIdVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2">
      {/* Exposed ID Card */}
      <div className="w-[80px] h-[64px] rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md p-1.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-black text-amber-700 dark:text-amber-400">ID CARD</span>
          <div className="w-4 h-4 rounded-sm bg-sky-100 overflow-hidden flex items-end justify-center">
            <MiniPortraitSvg className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-[2.5px] w-11 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="text-[7.5px] font-mono font-extrabold text-rose-600 dark:text-rose-400 leading-none">
            5821 9042
          </div>
        </div>
      </div>

      <ActionArrow label="Mask" accent="emerald" />

      {/* Permanently Redacted Safe Card */}
      <div className="w-[80px] h-[64px] rounded-lg bg-emerald-50/80 dark:bg-emerald-950/50 border-2 border-emerald-500/80 shadow-md p-1.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-black text-emerald-700 dark:text-emerald-300">SAFE PDF</span>
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[7px] flex items-center justify-center font-black">
            ✓
          </span>
        </div>
        <div className="space-y-1">
          <div className="h-[2.5px] w-11 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="h-3 w-full rounded-[2px] bg-slate-950 anim-redact-bar shadow-2xs" />
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 36. Remove Scan Watermark: Tasteful 2.5D/soft-3D Scanned PDF cleaning
//     "Scanned with CamScanner" gently dissolves into a clean PDF page
// =========================================================================
export const RemoveScanWatermarkVisual: React.FC = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-3">
      {/* 2.5D Soft-3D Layered Scanned PDF Document (stays calm & stable) */}
      <div className="relative" style={{ perspective: '420px' }}>
        {/* Ambient tabletop shadow beneath 2.5D document */}
        <div className="pointer-events-none absolute -bottom-1.5 inset-x-2 h-2.5 rounded-full bg-slate-900/15 dark:bg-black/45 blur-[4px]" />
        {/* Layered back sheet for physical paper depth */}
        <div
          className="absolute inset-0 translate-x-[4px] translate-y-[3px] rounded-[8px] bg-slate-200/90 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700"
          style={{ transform: 'rotateY(-4deg) rotateX(2deg)' }}
        />

        {/* Primary Realistic Scanned Paper Page */}
        <div
          className="relative w-[132px] h-[88px] rounded-[8px] bg-gradient-to-b from-[#fffef9] via-white to-[#f8f6ef] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200/95 dark:border-slate-700/90 shadow-[0_10px_22px_-8px_rgba(15,23,42,0.22),0_2px_6px_-1px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col justify-between p-2"
          style={{ transform: 'rotateY(-4deg) rotateX(2deg)' }}
        >
          {/* Subtle top paper light sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white/70 to-transparent dark:from-white/5" />

          {/* Folded dog-ear page corner */}
          <div className="pointer-events-none absolute top-0 right-0 w-3 h-3 z-20">
            <div
              className="w-full h-full bg-slate-100 dark:bg-slate-950"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
            />
            <div
              className="absolute inset-0 bg-slate-300/75 dark:bg-slate-700"
              style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
            />
          </div>

          {/* Stable Document Header + Readable Content Lines (never distorted) */}
          <div className="space-y-[4px] pr-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="px-1 py-[1px] rounded-[3px] bg-red-600 text-white text-[6.5px] font-black tracking-wider leading-none">
                  PDF
                </span>
                <div className="h-[3.5px] w-14 rounded-full bg-slate-700/80 dark:bg-slate-300/80" />
              </div>
              {/* Subtle Clean PDF confirmation badge that appears after removal */}
              <span className="tv-scan-clean-badge px-1.5 py-[1.5px] rounded-full bg-emerald-600 text-white text-[6px] font-extrabold tracking-wide leading-none shadow-2xs">
                ✓ Clean
              </span>
            </div>

            <div className="pt-0.5 space-y-[3.5px]">
              <div className="h-[2.5px] w-full rounded-full bg-slate-300/90 dark:bg-slate-700" />
              <div className="h-[2.5px] w-11/12 rounded-full bg-slate-200 dark:bg-slate-700/80" />
              <div className="h-[2.5px] w-5/6 rounded-full bg-slate-200 dark:bg-slate-700/80" />
              <div className="h-[2.5px] w-3/4 rounded-full bg-slate-200 dark:bg-slate-700/80" />
            </div>
          </div>

          {/* Bottom Margin Zone: Unwanted Scanner App Footer Gently Disappearing */}
          <div className="relative h-[16px] -mx-1 px-1 rounded-[4px] flex items-center justify-end overflow-hidden border-t border-slate-100 dark:border-slate-800/80">
            {/* Unwanted "Scanned with CamScanner" label dissolving cleanly */}
            <div className="tv-scan-label-dissolve flex items-center gap-1 pr-0.5">
              <span className="w-3 h-3 rounded-[3px] bg-teal-600 text-white text-[5.5px] font-black flex items-center justify-center shrink-0">
                CS
              </span>
              <span className="text-[6.5px] font-bold text-teal-700 dark:text-teal-400 tracking-tight whitespace-nowrap">
                Scanned with CamScanner
              </span>
            </div>

            {/* Soft luminous precision cleaning sweep moving only across the watermark band */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-transparent via-teal-400/55 to-emerald-300/20 tv-scan-clean-sweep z-20">
              <div className="absolute inset-y-0 right-1 w-[1.5px] bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.9)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Before -> After Transition Indicator */}
      <div className="flex flex-col items-start gap-1.5">
        <div className="tv-scan-before-pill flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/70">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="text-[7px] font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap">
            Scan Label
          </span>
        </div>

        <svg viewBox="0 0 14 14" className="w-3 h-3 ml-3 text-teal-600 dark:text-teal-400" fill="none">
          <path d="M7 2V11.5M7 11.5L3.5 8M7 11.5L10.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="tv-scan-after-pill flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[7px] font-extrabold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
            Clean PDF
          </span>
        </div>
      </div>
    </div>
  </VisualStage>
);

// =========================================================================
// 37. Generic Default Fallback Visual
// =========================================================================
export const GenericToolVisual: React.FC<{ title: string; category?: string }> = () => (
  <VisualStage>
    <div className="flex items-center justify-center gap-2.5">
      <DocIcon type="neutral" label="FILE" sublabel="Input" variant="article" />
      <ActionArrow label="Process" accent="indigo" />
      <div className="tv-soft-float">
        <DocIcon type="word" label="READY" sublabel="Output" isLarge variant="contract" />
      </div>
    </div>
  </VisualStage>
);
