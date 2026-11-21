import React, { useEffect, useState } from 'react';
import { AlertCircle, Info, X } from 'lucide-react';
import { AnimatedCheckBadge } from './SuccessCelebration';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

// Global dispatcher using CustomEvent
export function triggerToast(type: 'success' | 'error' | 'info', message: string, title?: string, duration: number = 3500) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('pottotools_toast', {
    detail: {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      title,
      duration,
    },
  });
  window.dispatchEvent(event);
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;
      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    window.addEventListener('pottotools_toast', handleToastEvent);
    return () => window.removeEventListener('pottotools_toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl shadow-xl border backdrop-blur-md pt-page-enter ${
              isSuccess
                ? 'bg-white/95 dark:bg-[#172824]/95 text-[#1D3B2F] dark:text-emerald-100 border-[#BBEAD4] dark:border-emerald-700/70'
                : isError
                ? 'bg-white/95 dark:bg-[#2E1B1C]/95 text-[#7F1D1D] dark:text-rose-100 border-[#F5BEA0] dark:border-rose-800/70'
                : 'bg-white/95 dark:bg-[#1A1E33]/95 text-[#252536] dark:text-[#F2F4FC] border-[#DDD5FD] dark:border-[#343A5E]'
            }`}
          >
            <div className="shrink-0">
              {isSuccess ? (
                <AnimatedCheckBadge size="sm" showConfetti={true} />
              ) : isError ? (
                <div className="w-8 h-8 rounded-xl bg-[#FFE9DA] dark:bg-rose-500/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-rose-300" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#DDEEFF] dark:bg-sky-500/20 flex items-center justify-center">
                  <Info className="w-4 h-4 text-[#1E5C9A] dark:text-sky-300" />
                </div>
              )}
            </div>

            <div className="flex-1 text-xs min-w-0">
              {toast.title && (
                <div className="font-extrabold text-[#252536] dark:text-white mb-0.5 truncate">
                  {toast.title}
                </div>
              )}
              <div className="leading-relaxed text-[#55556B] dark:text-slate-200">
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
              className="text-[#777789] hover:text-[#252536] dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
