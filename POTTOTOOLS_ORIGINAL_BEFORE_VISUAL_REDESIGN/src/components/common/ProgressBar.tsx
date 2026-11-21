import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  statusText?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, statusText }) => {
  const bounded = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
        <span>{statusText || 'Processing...'}</span>
        <span className="font-mono tabular-nums">{bounded}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${bounded}%` }}
        />
      </div>
    </div>
  );
};
