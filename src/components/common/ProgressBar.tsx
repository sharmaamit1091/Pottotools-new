import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  statusText?: string;
}

/**
 * Branded PottoTools Loading & Progress Indicator
 * Features a sleek animated PottoTools document scan icon, pastel-accented progress bar
 * with gentle shimmer highlight, live tabular percentage, and clear honest status text.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, statusText }) => {
  const bounded = Math.max(0, Math.min(100, Math.round(progress)));
  const isComplete = bounded >= 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={bounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={statusText || 'Processing your file'}
      className="w-full rounded-2xl bg-[#FAFAFC] dark:bg-[#151829] border border-[#E8E6F2] dark:border-[#2A2F4A] p-4 shadow-2xs"
    >
      <div className="flex items-center gap-3.5">
        {/* Branded PottoTools Animated Document Icon */}
        <div
          aria-hidden="true"
          className="relative w-11 h-11 rounded-xl bg-[#E9E4FF] dark:bg-[#2B244E] border border-[#CFC5FA] dark:border-[#4D4287] flex items-center justify-center shrink-0 overflow-hidden"
        >
          {/* Mini Document SVG */}
          <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect
              x="2"
              y="2"
              width="20"
              height="24"
              rx="4"
              fill="#FFFFFF"
              className="dark:fill-[#1B1F35]"
              stroke="#5B50E6"
              strokeWidth="1.5"
            />
            <rect x="6" y="8" width="12" height="2" rx="1" fill="#A99FF8" />
            <rect x="6" y="13" width="9" height="2" rx="1" fill="#C7C1FA" />
            <rect x="6" y="18" width="11" height="2" rx="1" fill="#C7C1FA" />
          </svg>

          {/* Moving Pastel Scan Beam */}
          {!isComplete && (
            <div className="pointer-events-none absolute inset-x-1 top-1 h-2 rounded-full bg-gradient-to-b from-transparent via-[#5B50E6]/45 to-transparent pt-loader-scan" />
          )}
        </div>

        {/* Status Text + Bar */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-bold text-[#252536] dark:text-[#F2F4FC] truncate">
                {statusText || 'Processing your file locally...'}
              </div>
              <div className="text-[11px] text-[#777789] dark:text-[#A0A5C0]">
                {isComplete ? 'Completed on your device' : 'PottoTools · Local browser engine'}
              </div>
            </div>
            <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg bg-[#E9E4FF] dark:bg-[#2B244E] text-[#4C3C9E] dark:text-[#D5CCFF] tabular-nums shrink-0">
              {bounded}%
            </span>
          </div>

          <div className="relative w-full h-2.5 bg-[#EAE7F5] dark:bg-[#242942] rounded-full overflow-hidden">
            <div
              className={`relative h-full rounded-full transition-all duration-250 ease-out overflow-hidden ${
                isComplete
                  ? 'bg-[#249A67]'
                  : 'bg-[#5B50E6] dark:bg-[#8178F6]'
              }`}
              style={{ width: `${Math.max(bounded, 4)}%` }}
            >
              {!isComplete && (
                <div className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent pt-loader-shimmer" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
