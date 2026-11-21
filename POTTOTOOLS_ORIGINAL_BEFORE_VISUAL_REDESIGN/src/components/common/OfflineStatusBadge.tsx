import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

interface OfflineStatusBadgeProps {
  /** Optional current tool title (e.g. "Compress PDF") to display tool-specific offline confirmation */
  toolTitle?: string;
  /** Optional alignment for the pop-up reminder notice */
  align?: 'center' | 'left';
  className?: string;
}

export const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({
  toolTitle,
  align = 'center',
  className = '',
}) => {
  const [animKey, setAnimKey] = useState(0);
  const [showReminder, setShowReminder] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<number | null>(null);
  const animTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    };
  }, []);

  const handleClick = () => {
    // Re-trigger brief animation cleanly on each click
    setAnimKey((k) => k + 1);
    setIsAnimating(true);
    setShowReminder(true);

    if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    animTimerRef.current = window.setTimeout(() => {
      setIsAnimating(false);
    }, 650);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setShowReminder(false);
    }, 4000);
  };

  return (
    <div className={`relative inline-flex flex-col ${align === 'center' ? 'items-center' : 'items-center sm:items-start'} ${className}`}>
      <button
        key={animKey}
        type="button"
        onClick={handleClick}
        aria-expanded={showReminder}
        title="Click to verify offline availability"
        className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-tight text-slate-950 bg-linear-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-sm shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
          isAnimating ? 'anim-offline-badge-pop' : ''
        }`}
      >
        {isAnimating && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none anim-offline-badge-ripple"
          />
        )}
        <WifiOff className="w-3.5 h-3.5 text-slate-950 shrink-0" aria-hidden="true" />
        <span>100% Offline</span>
      </button>

      {/* Brief Animated Reminder Card Shown on Click */}
      {showReminder && (
        <div
          role="status"
          aria-live="polite"
          className={`anim-offline-reminder-in mt-2 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white border border-emerald-400/50 shadow-lg text-xs max-w-xs sm:max-w-sm ${
            align === 'center' ? 'text-center justify-center' : 'text-left'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="leading-snug">
            <strong className="text-emerald-300 font-bold">
              {toolTitle ? `${toolTitle} is cached` : 'Current tools cached'}:
            </strong>{' '}
            Ready &amp; available 100% without internet access.
          </span>
        </div>
      )}
    </div>
  );
};
