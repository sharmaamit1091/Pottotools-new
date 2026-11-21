import React, { useEffect, useMemo, useState } from 'react';
import {
  MONETIZATION_CONFIG,
  AdsterraBannerUnitConfig,
} from '../../config/monetization';

export type AdsterraBannerVariant =
  | 'responsive-leaderboard'
  | 'leaderboard'
  | 'mobile-banner'
  | 'rectangle';

interface AdsterraBannerProps {
  variant: AdsterraBannerVariant;
  placement: string;
  className?: string;
}

function buildAdsterraSrcDoc(unit: AdsterraBannerUnitConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: ${unit.width}px;
    height: ${unit.height}px;
    overflow: hidden;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
</head>
<body>
<script>
  atOptions = {
    'key' : '${unit.key}',
    'format' : '${unit.format}',
    'height' : ${unit.height},
    'width' : ${unit.width},
    'params' : {}
  };
</script>
<script src="${unit.scriptSrc}"></script>
</body>
</html>`;
}

/**
 * SPA-safe, offline-PWA-safe Adsterra Display Banner component.
 *
 * Renders each Adsterra `atOptions` banner inside its own isolated `srcDoc` iframe:
 * - Eliminates global `window.atOptions` race conditions when multiple banners exist on one page.
 * - Executes Adsterra's `document.write()` cleanly on every SPA route switch.
 * - Reserves exact fixed pixel dimensions (728x90, 320x50, or 300x250) to prevent layout shift (CLS = 0).
 * - In `responsive-leaderboard` mode, mounts ONLY 728x90 on desktop/tablet (>= 768px) and ONLY 320x50
 *   on mobile (< 768px) to maximize ad viewability and avoid hidden ad requests.
 * - Automatically hides when the user is offline (PWA offline mode).
 */
const DESKTOP_LEADERBOARD_QUERY = '(min-width: 820px)';

function getBannerSizeClass(width: number, height: number): string {
  if (width === 728 && height === 90) return 'w-[728px] h-[90px]';
  if (width === 300 && height === 250) return 'w-[300px] h-[250px]';
  return 'w-[320px] h-[50px]';
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
  variant,
  placement,
  className = '',
}) => {
  const { enabled, adsterra } = MONETIZATION_CONFIG;
  const isGloballyActive = enabled && adsterra.enabled;

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia(DESKTOP_LEADERBOARD_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia(DESKTOP_LEADERBOARD_QUERY)
        : null;

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsDesktopViewport(event.matches);
    };

    if (mediaQuery) {
      setIsDesktopViewport(mediaQuery.matches);
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleViewportChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleViewportChange);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', handleViewportChange);
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(handleViewportChange);
        }
      }
    };
  }, []);

  const activeUnit: AdsterraBannerUnitConfig | null = useMemo(() => {
    if (!isGloballyActive) return null;
    if (variant === 'rectangle') {
      return adsterra.banners.rectangle300x250.enabled
        ? adsterra.banners.rectangle300x250
        : null;
    }
    if (variant === 'leaderboard') {
      return adsterra.banners.leaderboard728x90.enabled
        ? adsterra.banners.leaderboard728x90
        : null;
    }
    if (variant === 'mobile-banner') {
      return adsterra.banners.mobile320x50.enabled
        ? adsterra.banners.mobile320x50
        : null;
    }
    // responsive-leaderboard: 728x90 on desktop/wide tablet (>= 820px), 320x50 on mobile
    if (isDesktopViewport) {
      return adsterra.banners.leaderboard728x90.enabled
        ? adsterra.banners.leaderboard728x90
        : null;
    }
    return adsterra.banners.mobile320x50.enabled
      ? adsterra.banners.mobile320x50
      : null;
  }, [isGloballyActive, variant, isDesktopViewport, adsterra.banners]);

  const srcDoc = useMemo(
    () => (activeUnit ? buildAdsterraSrcDoc(activeUnit) : ''),
    [activeUnit]
  );

  if (!isGloballyActive || !isOnline || !activeUnit) {
    return null;
  }

  const sizeClass = getBannerSizeClass(activeUnit.width, activeUnit.height);

  return (
    <aside
      aria-label="Advertisement"
      data-adsterra-banner-placement={placement}
      data-adsterra-banner-size={`${activeUnit.width}x${activeUnit.height}`}
      className={`w-full flex flex-col items-center justify-center ${className}`}
    >
      <div className="max-w-full rounded-2xl border border-slate-200/75 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex flex-col items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 select-none">
          Advertisement
        </span>
        <div
          className={`max-w-full overflow-hidden flex items-center justify-center rounded-lg ${sizeClass}`}
        >
          <iframe
            key={`${placement}-${activeUnit.key}`}
            title={`Advertisement (${activeUnit.width}x${activeUnit.height})`}
            srcDoc={srcDoc}
            width={activeUnit.width}
            height={activeUnit.height}
            scrolling="no"
            frameBorder={0}
            loading="lazy"
            className={`block border-0 max-w-full ${sizeClass}`}
          />
        </div>
      </div>
    </aside>
  );
};
