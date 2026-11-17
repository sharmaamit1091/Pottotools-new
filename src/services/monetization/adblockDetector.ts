/**
 * AdBlocker and Ad Network Availability Detector
 * Detects whether browser ad blockers (uBlock, AdBlock, Brave Shields) are blocking ad scripts
 * and verifies Google AdSense script / ad slot accessibility.
 */

export interface AdBlockDetectionResult {
  isBlocked: boolean;
  checked: boolean;
  reason?: 'script_blocked' | 'element_hidden' | 'network_error';
}

let cachedResult: AdBlockDetectionResult | null = null;
const listeners = new Set<(res: AdBlockDetectionResult) => void>();

export async function detectAdBlocker(): Promise<AdBlockDetectionResult> {
  if (typeof window === 'undefined') {
    return { isBlocked: false, checked: true };
  }

  if (cachedResult && cachedResult.checked) {
    return cachedResult;
  }

  // Method 1: Check if an element with standard ad-related classnames is hidden by EasyList CSS rules
  let elementBlocked = false;
  try {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox ad-placement banner-ad ad-slot pub_300x250 pub_728x90';
    testAd.style.position = 'absolute';
    testAd.style.left = '-9999px';
    testAd.style.top = '-9999px';
    testAd.style.width = '1px';
    testAd.style.height = '1px';
    testAd.style.pointerEvents = 'none';
    document.body.appendChild(testAd);

    window.requestAnimationFrame(() => {
      const styles = window.getComputedStyle(testAd);
      if (
        styles.display === 'none' ||
        styles.visibility === 'hidden' ||
        testAd.offsetHeight === 0 ||
        testAd.offsetParent === null
      ) {
        elementBlocked = true;
      }
      try {
        if (testAd.parentNode) {
          testAd.parentNode.removeChild(testAd);
        }
      } catch {
        // Ignore cleanup error
      }
    });
  } catch {
    // Ignore DOM error
  }

  // Method 2: Test network fetch to Google AdSense script
  let networkBlocked = false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const testUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '';
    // If aborted due to timeout, might just be slow network, but if failed to fetch/blocked
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('aborted')) {
      networkBlocked = true;
    }
  }

  const isBlocked = elementBlocked || networkBlocked;
  cachedResult = {
    isBlocked,
    checked: true,
    reason: networkBlocked ? 'script_blocked' : elementBlocked ? 'element_hidden' : undefined,
  };

  listeners.forEach((listener) => listener(cachedResult!));
  return cachedResult;
}

export function subscribeAdBlockStatus(callback: (res: AdBlockDetectionResult) => void): () => void {
  listeners.add(callback);
  if (cachedResult) {
    callback(cachedResult);
  } else {
    detectAdBlocker();
  }
  return () => {
    listeners.delete(callback);
  };
}
