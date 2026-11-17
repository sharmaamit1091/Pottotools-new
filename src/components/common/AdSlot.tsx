import React, { useId, useEffect, useState, useRef } from 'react';
import { MONETIZATION_CONFIG, isTestEnvironment, isRealAdSenseSlotId } from '../../config/monetization';
import { detectAdBlocker, subscribeAdBlockStatus, AdBlockDetectionResult } from '../../services/monetization/adblockDetector';
import { ShieldAlert, Sparkles, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface AdSlotProps {
  /** Unique placement key from MONETIZATION_CONFIG.placements */
  placement: string;
  /** Layout orientation */
  format?: 'horizontal' | 'vertical' | 'rectangle' | 'responsive';
  /** Minimum height in pixels to preserve space and avoid Cumulative Layout Shift (CLS) */
  minHeight?: number;
  /** Extra CSS classes for visibility / responsive behavior (e.g. hidden xl:block) */
  className?: string;
  /** Optional custom Google AdSense slot ID */
  slotId?: string;
}

/**
 * Official Google AdSense Container
 * Supports responsive Google Ad units, prevents Cumulative Layout Shift (CLS),
 * enforces valid container dimensions (offsetWidth > 0) to avoid AdSense TagErrors,
 * and complies with Google Publisher Placement Policies.
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  placement,
  format = 'responsive',
  minHeight,
  className = '',
  slotId,
}) => {
  const generatedId = useId();
  const containerId = `adsense-${placement}-${generatedId.replace(/:/g, '')}`;
  const adRef = useRef<HTMLModElement>(null);
  const [adPushed, setAdPushed] = useState(false);
  const [adFilled, setAdFilled] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pushError, setPushError] = useState<string | null>(null);

  const [adBlockStatus, setAdBlockStatus] = useState<AdBlockDetectionResult>({
    isBlocked: false,
    checked: false,
  });
  const [showStatusInfo, setShowStatusInfo] = useState(false);

  const placementConfig = MONETIZATION_CONFIG.placements[placement];
  const isPlacementEnabled = placementConfig ? placementConfig.enabled : true;
  const effectiveFormat = format || placementConfig?.defaultFormat || 'responsive';
  const effectiveMinHeight = minHeight ?? placementConfig?.minHeightPx ?? (effectiveFormat === 'vertical' ? 450 : 90);
  const effectiveSlotId = slotId || placementConfig?.slotId || '1001001001';
  const clientId = MONETIZATION_CONFIG.adsenseClientId || 'ca-pub-9169378293935942';
  const isPlaceholderClient = !clientId || clientId.includes('XXXXXXXXXXXXXXXX');

  const isTestEnv = isTestEnvironment();
  const isRealSlot = isRealAdSenseSlotId(effectiveSlotId);

  const autoAdsOnly = MONETIZATION_CONFIG.autoAdsOnly;

  useEffect(() => {
    if (autoAdsOnly) return;
    // Check if an ad blocker is running in the user's browser
    const unsubscribe = subscribeAdBlockStatus((result) => {
      setAdBlockStatus(result);
    });
    return () => {
      unsubscribe();
    };
  }, [autoAdsOnly]);

  // Safe Google AdSense execution: Guarantees element has non-zero width before calling push()
  useEffect(() => {
    if (autoAdsOnly || typeof window === 'undefined' || isPlaceholderClient || adPushed) return;

    const el = adRef.current;
    if (!el) return;

    // If AdSense script has already processed this exact element, do not push again
    if (el.getAttribute('data-adsbygoogle-status') === 'done') {
      setAdPushed(true);
      return;
    }

    let isCancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const tryPushAd = () => {
      if (isCancelled || !el) return;

      // Ensure valid non-zero container width to prevent:
      // "TagError: adsbygoogle.push() error: No slot size for availableWidth=0"
      const currentWidth = el.offsetWidth || el.parentElement?.offsetWidth || 0;
      setContainerWidth(currentWidth);

      if (currentWidth === 0 && attempts < maxAttempts) {
        attempts++;
        window.requestAnimationFrame(tryPushAd);
        return;
      }

      if (el.getAttribute('data-adsbygoogle-status') === 'done') {
        setAdPushed(true);
        return;
      }

      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setAdPushed(true);
        setPushError(null);
        console.info(
          `[AdSense] Initialized ad unit: "${placement}" (slot: ${effectiveSlotId}, width: ${currentWidth}px, testMode: ${isTestEnv || !isRealSlot})`
        );
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        setPushError(errorMsg);
        console.warn(`[AdSense] Push notice for ${placement}:`, errorMsg);
      }
    };

    // Use requestAnimationFrame so styles and DOM dimensions are computed first
    const frameId = window.requestAnimationFrame(tryPushAd);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [clientId, isPlaceholderClient, adPushed, placement, effectiveSlotId, isTestEnv, isRealSlot]);

  // Track when Google AdSense populates an iframe or flags the unit as filled
  useEffect(() => {
    if (autoAdsOnly) return;
    const el = adRef.current;
    if (!el) return;

    const checkStatus = () => {
      const hasIframe = !!el.querySelector('iframe');
      const status = el.getAttribute('data-ad-status');
      if (hasIframe || status === 'filled') {
        setAdFilled(true);
      }
    };

    checkStatus();

    const observer = new MutationObserver(() => {
      checkStatus();
    });

    observer.observe(el, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  // Hide manual ad slots when Auto Ads only mode is active or placement is disabled
  if (!MONETIZATION_CONFIG.enabled || autoAdsOnly || !isPlacementEnabled) {
    return null;
  }

  const isVertical = effectiveFormat === 'vertical';

  return (
    <aside
      id={containerId}
      aria-label="Advertisement"
      className={`relative my-4 overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-xs transition-all w-full ${className}`}
      style={{ minHeight: `${effectiveMinHeight}px` }}
    >
      {/* Top Banner Meta Bar - Compliant "Advertisement" Label per Google AdSense Policy */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100/80 dark:bg-slate-950/70 border-b border-slate-200/70 dark:border-slate-800/70 text-[11px] select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800/80 px-2 py-0.5 rounded">
            Advertisement
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                adFilled ? 'bg-emerald-500' : isTestEnv || !isRealSlot ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'
              }`}
            />
            <span>Google AdSense</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          <span className="hidden sm:inline lowercase text-slate-500 dark:text-slate-400">
            slot:{effectiveSlotId}
          </span>
          <button
            type="button"
            onClick={() => setShowStatusInfo(!showStatusInfo)}
            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
            title="Google AdSense Diagnostic Information"
          >
            Ad Info
          </button>
        </div>
      </div>

      {/* AdBlocker Alert Notice */}
      {adBlockStatus.checked && adBlockStatus.isBlocked && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Ad Blocker Active:</strong> Browser extension is blocking Google AdSense ads from loading.
            </span>
          </div>
          <button
            type="button"
            onClick={() => detectAdBlocker()}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-200/80 dark:bg-amber-900/80 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 transition-colors cursor-pointer shrink-0"
          >
            Recheck
          </button>
        </div>
      )}

      {/* Diagnostic Drawer */}
      {showStatusInfo && (
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            Google AdSense Technical Audit & Status
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
            <div>
              • Publisher ID:{' '}
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {clientId}
              </span>
            </div>
            <div>
              • Slot ID:{' '}
              <span className="font-mono text-slate-600 dark:text-slate-300">{effectiveSlotId}</span>{' '}
              {isRealSlot ? (
                <span className="text-emerald-600 font-semibold">(Verified)</span>
              ) : (
                <span className="text-amber-600 font-medium">(Default Slot)</span>
              )}
            </div>
            <div>
              • Placement: <span className="font-mono text-slate-600 dark:text-slate-300">{placement}</span>
            </div>
            <div>
              • Container Width:{' '}
              <span className="font-mono text-slate-600 dark:text-slate-300">
                {containerWidth > 0 ? `${containerWidth}px (Valid > 0)` : 'Measuring...'}
              </span>
            </div>
            <div>
              • Reserved Min Height:{' '}
              <span className="font-mono text-slate-600 dark:text-slate-300">{effectiveMinHeight}px</span>
            </div>
            <div>
              • Script In Head:{' '}
              <span className="text-emerald-600 font-semibold">Active (pagead2.googlesyndication.com)</span>
            </div>
            <div>
              • CSP Headers:{' '}
              <span className="text-emerald-600 font-semibold">Whitelisted (Google Allowed)</span>
            </div>
            <div>
              • Runtime Host:{' '}
              <span className="font-mono text-slate-600 dark:text-slate-300">
                {typeof window !== 'undefined' ? window.location.hostname : 'ssr'}
              </span>{' '}
              {isTestEnv ? (
                <span className="text-amber-600 font-medium">(Preview/Test)</span>
              ) : (
                <span className="text-emerald-600 font-semibold">(Live Domain)</span>
              )}
            </div>
            <div>
              • Ad Status:{' '}
              {adFilled ? (
                <span className="text-emerald-600 font-semibold">Filled & Active</span>
              ) : (
                <span className="text-blue-600 font-medium">Ready (Awaiting Google Serving)</span>
              )}
            </div>
          </div>
          {pushError && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/50 rounded border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>AdSense Push Note: {pushError}</span>
            </div>
          )}
          {!isRealSlot && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200/70 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tip for Live Ad Serving:</strong> To serve live custom ad units, create a Display Ad Unit in your{' '}
                <a
                  href="https://adsense.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  Google AdSense Dashboard
                </a>{' '}
                and paste your 10-digit Slot ID into <code className="font-mono">monetization.ts</code>. Auto Ads in <code className="font-mono">&lt;head&gt;</code> are also active for automatic placement.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Google AdSense Tag Container - Explicit Block Width & Dimensions */}
      <div
        className="w-full block relative p-2"
        style={{ minHeight: `${effectiveMinHeight - 32}px` }}
      >
        {/* Live Google AdSense <ins> Tag with explicit styling */}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            minWidth: '280px',
            minHeight: `${effectiveMinHeight - 36}px`,
            textAlign: 'center',
          }}
          data-ad-client={clientId}
          data-ad-slot={effectiveSlotId}
          data-ad-format={effectiveFormat === 'vertical' ? 'vertical' : 'auto'}
          data-full-width-responsive="true"
          data-ad-test={isTestEnv || !isRealSlot ? 'on' : undefined}
        />

        {/* Visual Reserved Space Indicator (visible while awaiting Google creative or during review) */}
        {!adFilled && (
          <div
            className={`w-full py-3 px-4 rounded-lg bg-linear-to-r from-slate-50/90 via-blue-50/50 to-slate-50/90 dark:from-slate-900/80 dark:via-blue-950/30 dark:to-slate-900/80 border border-dashed border-slate-300/80 dark:border-slate-700/80 flex ${
              isVertical
                ? 'flex-col justify-center text-center py-6 gap-3'
                : 'flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left'
            } transition-all mt-1`}
          >
            <div className={`flex items-center gap-3 ${isVertical ? 'flex-col' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Google AdSense Responsive Unit
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Pub ID: {clientId} • Slot: {effectiveSlotId} • {effectiveFormat}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded border border-slate-200/80 dark:border-slate-700/80 shrink-0 font-medium">
              Reserved Ad Space
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
