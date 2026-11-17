import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 border border-sky-500/50 text-white px-4 py-2.5 shadow-2xl backdrop-blur-md animate-fade-in"
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
        <WifiOff className="w-4 h-4 animate-pulse" />
      </div>
      <div>
        <div className="text-xs font-bold flex items-center gap-1.5 text-white">
          <span>Offline Mode Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <p className="text-[11px] text-slate-300">
          All tools continue working in your browser with 100% privacy.
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-1 rounded-lg shrink-0">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Private</span>
      </div>
    </div>
  );
};
