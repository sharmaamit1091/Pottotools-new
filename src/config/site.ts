/**
 * PottoTools - Global Site Configuration
 * All brand metadata, URLs, and feature toggles are centralized here.
 */

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  author: string;
  supportEmail: string;
  verifiedDate: string;
}

export const SITE_CONFIG: SiteConfig = {
  name: 'PottoTools',
  tagline: 'Every Document Tool You Need. Free, Fast and Secure.',
  description: 'Compress, convert, edit and organize your PDFs, Word files, spreadsheets and images directly in your browser without software installation or account creation.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://pottotools.in',
  author: 'PottoTools Engineering Team',
  supportEmail: 'sharma.amit1091@gmail.com',
  verifiedDate: 'October 2026',
};

