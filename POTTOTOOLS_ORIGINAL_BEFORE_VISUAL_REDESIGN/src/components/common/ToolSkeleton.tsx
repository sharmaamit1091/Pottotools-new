import React from 'react';

export const ToolSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm animate-pulse">
      {/* Title & Badge Skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
      </div>

      {/* Main Upload Area Skeleton */}
      <div className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-6 space-y-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-60 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>

      {/* Settings Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      </div>
    </div>
  );
};
