import React from 'react';
import { Download } from 'lucide-react';

interface SuccessCelebrationProps {
  title?: string;
  subtitle?: string;
  downloadLabel?: string;
  onDownload?: () => void;
  compact?: boolean;
  className?: string;
}

const CONFETTI_PARTICLES = [
  { cx: '-26px', cy: '-24px', cr: '-45deg', color: '#8B7CF6', size: 'w-2 h-2 rounded-full' },
  { cx: '26px', cy: '-26px', cr: '40deg', color: '#34B37E', size: 'w-2 h-2 rounded-sm' },
  { cx: '-34px', cy: '-4px', cr: '-80deg', color: '#F28B5B', size: 'w-1.5 h-2.5 rounded-full' },
  { cx: '34px', cy: '-6px', cr: '75deg', color: '#4E9AF1', size: 'w-2 h-1.5 rounded-full' },
  { cx: '-20px', cy: '22px', cr: '-110deg', color: '#EAB308', size: 'w-1.5 h-1.5 rounded-sm' },
  { cx: '22px', cy: '20px', cr: '120deg', color: '#A78BFA', size: 'w-2 h-2 rounded-full' },
  { cx: '0px', cy: '-32px', cr: '20deg', color: '#34D399', size: 'w-1.5 h-2.5 rounded-full' },
];

/**
 * AnimatedCheckBadge
 * Reusable animated SVG checkmark + tasteful lightweight pastel confetti pop.
 * Pure CSS transforms — short, subtle, zero sound effects, prefers-reduced-motion safe.
 */
export const AnimatedCheckBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; showConfetti?: boolean }> = ({
  size = 'md',
  showConfetti = true,
}) => {
  const dims =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const iconDims =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${dims}`}>
      {showConfetti && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {CONFETTI_PARTICLES.map((p, idx) => (
            <span
              key={idx}
              className={`absolute pt-confetti-dot ${p.size}`}
              style={
                {
                  backgroundColor: p.color,
                  '--cx': p.cx,
                  '--cy': p.cy,
                  '--cr': p.cr,
                  animationDelay: `${idx * 25}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}

      <div className={`${dims} rounded-2xl bg-[#DDF5E9] dark:bg-emerald-500/20 border border-[#AEE5CA] dark:border-emerald-400/35 flex items-center justify-center pt-check-circle shadow-xs`}>
        <svg
          className={iconDims}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 12.5L9.8 17.2L19 7.5"
            stroke="#167A51"
            className="dark:stroke-emerald-300 pt-check-stroke"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * SuccessCelebration
 * Tasteful pastel Mint success banner shown only after a file is genuinely generated.
 */
export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  title = 'Your File is Ready!',
  subtitle = 'Processed locally in your browser with complete privacy.',
  downloadLabel = 'Download File',
  onDownload,
  compact = false,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl bg-[#F2FBF6] dark:bg-emerald-950/35 border border-[#BCEBD4] dark:border-emerald-800/60 ${
        compact ? 'p-3.5 sm:p-4' : 'p-5 sm:p-6'
      } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <AnimatedCheckBadge size={compact ? 'sm' : 'md'} showConfetti={true} />
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-extrabold text-[#1D3B2F] dark:text-emerald-100 leading-snug">
            {title}
          </div>
          {subtitle && (
            <p className="text-xs text-[#42695A] dark:text-emerald-300/85 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A885B] hover:bg-[#14724B] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{downloadLabel}</span>
        </button>
      )}
    </div>
  );
};
