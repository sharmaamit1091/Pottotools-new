/**
 * PottoTools - Advertising & Monetization Configuration
 * Configured for Google AdSense with responsive ad units and Auto Ads support.
 */

export interface AdPlacementConfig {
  enabled: boolean;
  /** Google AdSense Ad Unit Slot ID (e.g., "1234567890") */
  slotId?: string;
  defaultFormat: 'horizontal' | 'vertical' | 'rectangle' | 'responsive';
  minHeightPx?: number;
}

export interface AdsterraNativeBannerConfig {
  enabled: boolean;
  containerId: string;
  scriptSrc: string;
}

export interface AdsterraBannerUnitConfig {
  enabled: boolean;
  key: string;
  format: 'iframe';
  width: number;
  height: number;
  scriptSrc: string;
}

export interface AdsterraBannersConfig {
  leaderboard728x90: AdsterraBannerUnitConfig;
  mobile320x50: AdsterraBannerUnitConfig;
  rectangle300x250: AdsterraBannerUnitConfig;
}

export interface AdsterraConfig {
  enabled: boolean;
  nativeBanner: AdsterraNativeBannerConfig;
  banners: AdsterraBannersConfig;
}

export interface MonetizationConfig {
  /** Master toggle to activate ad display across the site */
  enabled: boolean;
  /** When true, relies exclusively on Google Auto Ads (<head> script) and disables all manual AdSlot tags */
  autoAdsOnly: boolean;
  provider: 'adsense';
  /** Google AdSense Publisher Client ID (e.g., "ca-pub-XXXXXXXXXXXXXXXX") */
  adsenseClientId: string;
  /** Test/preview mode toggle */
  testMode: boolean;
  /** Set to true while waiting for Google AdSense site approval. Prevents fake manual slot errors and empty ad boxes. */
  approvalReviewMode: boolean;
  /** Adsterra native & display banner configuration running cleanly alongside Google AdSense */
  adsterra: AdsterraConfig;
  /** Placement settings by zone */
  placements: Record<string, AdPlacementConfig>;
}

// Verified AdSense Publisher Client ID
const DEFAULT_ADSENSE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADSENSE_CLIENT_ID) ||
  'ca-pub-9169378293935942';

/**
 * Detects if the current runtime is running on a preview or local environment
 * (localhost, Cloud Run dev preview, staging) rather than the live pottotools.in domain.
 */
export function isTestEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.includes('.run.app') ||
    h.includes('.web.app') ||
    h.includes('.firebaseapp.com') ||
    h.includes('vercel.app') ||
    (h !== 'pottotools.in' && h !== 'www.pottotools.in')
  );
}

/**
 * Validates whether a Google AdSense slot ID is a real 9-to-11 digit numeric AdSense unit ID
 * created in Google AdSense dashboard, or a default placeholder.
 */
export function isRealAdSenseSlotId(slotId?: string): boolean {
  if (!slotId) return false;
  const trimmed = slotId.trim();
  if (trimmed.startsWith('100100') || trimmed.startsWith('000000') || trimmed.length < 9) {
    return false;
  }
  return /^\d{9,11}$/.test(trimmed);
}

export const MONETIZATION_CONFIG: MonetizationConfig = {
  enabled: true,
  autoAdsOnly: true,
  provider: 'adsense',
  adsenseClientId: DEFAULT_ADSENSE_CLIENT_ID,
  testMode: false,
  // Google Auto Ads script in <head> runs alongside Adsterra Native & Display Banners
  approvalReviewMode: false,
  adsterra: {
    enabled: true,
    nativeBanner: {
      enabled: true,
      containerId: 'container-6a9207452e2cae1a847c1817b0ebb799',
      scriptSrc: 'https://bauval.org/21/6a9207452e2cae1a847c1817b0ebb799',
    },
    banners: {
      leaderboard728x90: {
        enabled: true,
        key: '18652e79ff1e4c30fb4cf81d9363f059',
        format: 'iframe',
        width: 728,
        height: 90,
        scriptSrc: 'https://bauval.org/22/18652e79ff1e4c30fb4cf81d9363f059',
      },
      mobile320x50: {
        enabled: true,
        key: '57b48f7c1b6828dd739beb384ef58939',
        format: 'iframe',
        width: 320,
        height: 50,
        scriptSrc: 'https://bauval.org/22/57b48f7c1b6828dd739beb384ef58939',
      },
      rectangle300x250: {
        enabled: true,
        key: '0ca5684bb216af15a929b06e812b5597',
        format: 'iframe',
        width: 300,
        height: 250,
        scriptSrc: 'https://bauval.org/22/0ca5684bb216af15a929b06e812b5597',
      },
    },
  },
  placements: {
    // Header or top-of-content
    'home-top-banner': {
      enabled: true,
      slotId: '1001001001',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },
    'home-mid-tools': {
      enabled: true,
      slotId: '1001001002',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },
    'home-pre-footer': {
      enabled: true,
      slotId: '1001001003',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },

    // Side-margin advertisements on desktop layouts
    'desktop-rail-left': {
      enabled: true,
      slotId: '1001001004',
      defaultFormat: 'vertical',
      minHeightPx: 600,
    },
    'desktop-rail-right': {
      enabled: true,
      slotId: '1001001005',
      defaultFormat: 'vertical',
      minHeightPx: 500,
    },

    // Tool Pages
    'tool-top-banner': {
      enabled: true,
      slotId: '1001001006',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },
    'tool-working-bottom': {
      enabled: true,
      slotId: '1001001007',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },
    'tool-pre-faq': {
      enabled: true,
      slotId: '1001001008',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },
    'tool-mid-banner': {
      enabled: true,
      slotId: '1001001009',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },

    // Category Pages
    'category-top-banner': {
      enabled: true,
      slotId: '1001001010',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },
    'category-mid': {
      enabled: true,
      slotId: '1001001011',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },

    // Content Pages
    'content-inline': {
      enabled: true,
      slotId: '1001001012',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },

    // Footer
    'footer-leaderboard': {
      enabled: true,
      slotId: '1001001013',
      defaultFormat: 'horizontal',
      minHeightPx: 90,
    },
  },
};
