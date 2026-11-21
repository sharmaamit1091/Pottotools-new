import React, { useEffect, useRef, useState } from 'react';
import { MONETIZATION_CONFIG } from '../../config/monetization';

interface AdsterraNativeBannerProps {
  placement: string;
  className?: string;
}

/**
 * Adsterra Native Banner integration designed for React SPAs & Offline PWA safety:
 * - Only mounts external script when browser is online.
 * - Cleans up and re-injects the Adsterra script cleanly on route transitions so
 *   `container-6a9207452e2cae1a847c1817b0ebb799` re-hydrates across views.
 * - Guards against duplicate container IDs on the same page.
 * - Clearly labeled and spaced away from interactive tool controls for AdSense compliance.
 */
export const AdsterraNativeBanner: React.FC<AdsterraNativeBannerProps> = ({
  placement,
  className = '',
}) => {
  const { enabled, adsterra } = MONETIZATION_CONFIG;
  const nativeConfig = adsterra.nativeBanner;
  const isActive = enabled && adsterra.enabled && nativeConfig.enabled;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setIsOnline(true);
      setLoadFailed(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isActive || !isOnline) return;
    const containerEl = containerRef.current;
    const wrapperEl = wrapperRef.current;
    if (!containerEl || !wrapperEl) return;

    // Prevent double-rendering if another instance with the same ID is already in the DOM
    const existingContainers = document.querySelectorAll(`#${nativeConfig.containerId}`);
    if (existingContainers.length > 1 && existingContainers[0] !== containerEl) {
      return;
    }

    // Remove any stale Adsterra script tag from previous route views
    document
      .querySelectorAll(`script[data-adsterra-banner="${nativeConfig.containerId}"]`)
      .forEach((el) => el.remove());

    containerEl.innerHTML = '';

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-adsterra-banner', nativeConfig.containerId);
    script.src = nativeConfig.scriptSrc;
    script.onerror = () => {
      setLoadFailed(true);
    };

    wrapperEl.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (containerEl) {
        containerEl.innerHTML = '';
      }
    };
  }, [isActive, isOnline, nativeConfig.containerId, nativeConfig.scriptSrc, placement]);

  if (!isActive || !isOnline || loadFailed) {
    return null;
  }

  return (
    <aside
      aria-label="Sponsored Recommendations"
      data-adsterra-placement={placement}
      className={`w-full min-h-[120px] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-3 sm:px-4 sm:py-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Sponsored
        </span>
      </div>
      <div ref={wrapperRef} className="w-full overflow-hidden">
        <div id={nativeConfig.containerId} ref={containerRef} />
      </div>
    </aside>
  );
};
