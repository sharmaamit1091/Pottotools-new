/**
 * Google AdSense Configuration & Compatibility Bridge
 */
import { MONETIZATION_CONFIG, MonetizationConfig, AdPlacementConfig } from './monetization';

export type { MonetizationConfig, AdPlacementConfig };
export { MONETIZATION_CONFIG };

export const ADSENSE_CONFIG = {
  enabled: MONETIZATION_CONFIG.enabled,
  client: MONETIZATION_CONFIG.adsenseClientId,
  testMode: MONETIZATION_CONFIG.testMode,
  placements: MONETIZATION_CONFIG.placements,
};
