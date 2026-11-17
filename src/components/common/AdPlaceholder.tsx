import React from 'react';
import { AdSlot } from './AdSlot';
import { MONETIZATION_CONFIG } from '../../config/monetization';

interface AdPlaceholderProps {
  format: 'hero-banner' | 'tool-sidebar' | 'tool-bottom' | 'section-divider' | 'footer';
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ format, className = '' }) => {
  if (MONETIZATION_CONFIG.autoAdsOnly || !MONETIZATION_CONFIG.enabled) {
    return null;
  }
  const placementMap: Record<AdPlaceholderProps['format'], { placement: string; format: 'horizontal' | 'vertical'; minHeight: number }> = {
    'hero-banner': { placement: 'home-top-banner', format: 'horizontal', minHeight: 90 },
    'tool-sidebar': { placement: 'desktop-rail-right', format: 'vertical', minHeight: 400 },
    'tool-bottom': { placement: 'tool-working-bottom', format: 'horizontal', minHeight: 90 },
    'section-divider': { placement: 'home-mid-tools', format: 'horizontal', minHeight: 90 },
    'footer': { placement: 'footer-leaderboard', format: 'horizontal', minHeight: 90 },
  };

  const config = placementMap[format] || { placement: 'tool-working-bottom', format: 'horizontal', minHeight: 90 };

  return (
    <AdSlot
      placement={config.placement}
      format={config.format}
      minHeight={config.minHeight}
      className={className}
    />
  );
};
