import React, { useState } from 'react';
import { SITE_CONFIG } from '../../config/site';
import { PottoLogo } from './PottoLogo';
import { ShieldCheck, Heart, Lock, Zap, Mail, ArrowUpRight, Copy, Check, ExternalLink, WifiOff } from 'lucide-react';
import { AdSlot } from './AdSlot';
import { MONETIZATION_CONFIG } from '../../config/monetization';
import { ToolDefinition, getToolBySlug } from '../../config/toolsRegistry';

interface FooterProps {
  onNavigate: (view: string) => void;
  onSelectTool?: (tool: ToolDefinition) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectTool }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const officialEmail = SITE_CONFIG.supportEmail || 'sharma.amit1091@gmail.com';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(officialEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleNavClick = (view: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();

    // Instant viewport reset to the top of the newly selected tool/page
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const matchedTool = getToolBySlug(view);
    if (matchedTool && onSelectTool) {
      onSelectTool(matchedTool);
    } else {
      onNavigate(view);
    }
  };

  return (
    <footer className="w-full bg-[#F4F3FA] dark:bg-[#141727] text-[#55556B] dark:text-[#A8ADC7] border-t border-[#E8E6F2] dark:border-[#262B45] mt-14 sm:mt-16 pt-12 pb-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dedicated Above-Footer Advertising Region (only rendered when manual slots are enabled) */}
        {!MONETIZATION_CONFIG.autoAdsOnly && MONETIZATION_CONFIG.enabled && (
          <div className="mb-8">
            <div className="max-w-4xl mx-auto">
              <AdSlot placement="footer-leaderboard" format="horizontal" minHeight={90} />
            </div>
          </div>
        )}

        {/* 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#E4E1F0] dark:border-[#242942] text-sm">
          {/* Col 1: Brand & Security Promise */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <PottoLogo size="md" showWordmark={false} />
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-[#252536] dark:text-[#F2F4FC]">
                  Potto<span className="text-[#5B50E6] dark:text-[#9D95FF]">Tools</span>
                </span>
                <span className="text-[10px] text-[#777789] dark:text-[#A0A5C0] font-semibold tracking-wider uppercase">
                  Free Productivity Toolkit
                </span>
              </div>
            </div>

            <p className="text-xs text-[#777789] dark:text-[#A0A5C0] leading-relaxed">
              {SITE_CONFIG.tagline}
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2 text-[#196B47] dark:text-emerald-300 font-semibold">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>100% Client-Side Local Processing</span>
              </div>
              <div className="flex items-center gap-2 text-[#1E5C9A] dark:text-sky-300 font-semibold">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Zero File Uploads to Cloud Servers</span>
              </div>
              <div className="flex items-center gap-2 text-[#4C3C9E] dark:text-indigo-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>No Accounts, No Subscriptions, No Limits</span>
              </div>
              <div className="flex items-center gap-2 text-[#1D6A7B] dark:text-cyan-300 font-semibold">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span>Works 100% Offline (Installable PWA App)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Top PDF Tools */}
          <div>
            <a
              href="/pdf-tools"
              onClick={(e) => handleNavClick('category-pdf-tools', e)}
              className="text-xs font-extrabold uppercase tracking-wider text-[#252536] dark:text-[#F2F4FC] mb-4 flex items-center gap-2 hover:text-[#9A4319] dark:hover:text-[#FFD2B5] transition-colors text-left group cursor-pointer"
              title="View all PDF tools"
            >
              <span className="w-2 h-2 rounded-full bg-[#E86D42] group-hover:scale-125 transition-transform" />
              <span>Top PDF Tools</span>
              <ArrowUpRight className="w-3 h-3 text-[#777789] group-hover:text-[#E86D42] transition-colors" />
            </a>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/fill-pdf-form"
                  onClick={(e) => handleNavClick('fill-pdf-form', e)}
                  className="text-[#5B50E6] dark:text-[#A49CFF] hover:underline font-semibold transition-colors text-left cursor-pointer block"
                >
                  Fill PDF Form (Text, Photo &amp; Sign)
                </a>
              </li>
              <li>
                <a
                  href="/compress-pdf"
                  onClick={(e) => handleNavClick('compress-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Compress PDF (100KB, 200KB, 500KB)
                </a>
              </li>
              <li>
                <a
                  href="/merge-pdf"
                  onClick={(e) => handleNavClick('merge-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Merge PDF Documents
                </a>
              </li>
              <li>
                <a
                  href="/split-pdf"
                  onClick={(e) => handleNavClick('split-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Split &amp; Extract PDF Pages
                </a>
              </li>
              <li>
                <a
                  href="/pdf-page-organizer"
                  onClick={(e) => handleNavClick('pdf-page-organizer', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  PDF Page Organizer (500 MB)
                </a>
              </li>
              <li>
                <a
                  href="/searchable-pdf-text-finder"
                  onClick={(e) => handleNavClick('searchable-pdf-text-finder', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Searchable PDF &amp; In-Browser OCR
                </a>
              </li>
              <li>
                <a
                  href="/pdf-to-editable-word"
                  onClick={(e) => handleNavClick('pdf-to-editable-word', e)}
                  className="text-[#1E5C9A] dark:text-sky-300 hover:underline font-medium transition-colors text-left cursor-pointer block"
                >
                  PDF to Word (.docx)
                </a>
              </li>
              <li>
                <a
                  href="/word-to-pdf"
                  onClick={(e) => handleNavClick('word-to-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Word (.docx) to PDF
                </a>
              </li>
              <li>
                <a
                  href="/sign-pdf"
                  onClick={(e) => handleNavClick('sign-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Sign PDF Document
                </a>
              </li>
              <li>
                <a
                  href="/pdf-id-redactor"
                  onClick={(e) => handleNavClick('pdf-id-redactor', e)}
                  className="text-[#196B47] dark:text-emerald-300 font-semibold transition-colors text-left cursor-pointer hover:underline block"
                >
                  PDF &amp; ID Redactor (Offline)
                </a>
              </li>
              <li>
                <a
                  href="/pdf-metadata"
                  onClick={(e) => handleNavClick('pdf-metadata', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Remove PDF Metadata
                </a>
              </li>
              <li>
                <a
                  href="/protect-pdf"
                  onClick={(e) => handleNavClick('protect-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Protect PDF (Add Password)
                </a>
              </li>
              <li>
                <a
                  href="/unlock-pdf"
                  onClick={(e) => handleNavClick('unlock-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Unlock PDF (Remove Password)
                </a>
              </li>
              <li>
                <a
                  href="/delete-pdf-pages"
                  onClick={(e) => handleNavClick('delete-pdf-pages', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Delete PDF Pages
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Image & Office Tools */}
          <div>
            <a
              href="/image-tools"
              onClick={(e) => handleNavClick('category-image-tools', e)}
              className="text-xs font-extrabold uppercase tracking-wider text-[#252536] dark:text-[#F2F4FC] mb-4 flex items-center gap-2 hover:text-[#5B50E6] dark:hover:text-[#A49CFF] transition-colors text-left group cursor-pointer"
              title="View all Image tools"
            >
              <span className="w-2 h-2 rounded-full bg-[#6E5CE6] group-hover:scale-125 transition-transform" />
              <span>Image &amp; Office Tools</span>
              <ArrowUpRight className="w-3 h-3 text-[#777789] group-hover:text-[#6E5CE6] transition-colors" />
            </a>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/custom-photo-studio"
                  onClick={(e) => handleNavClick('custom-photo-studio', e)}
                  className="text-[#5B50E6] dark:text-[#A49CFF] transition-colors text-left font-semibold cursor-pointer hover:underline block"
                >
                  ★ Custom Photo Studio (All-in-One)
                </a>
              </li>
              <li>
                <a
                  href="/photo-signature-resizer"
                  onClick={(e) => handleNavClick('photo-signature-resizer', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Exam &amp; Passport Photo Resizer
                </a>
              </li>
              <li>
                <a
                  href="/photo-size-compressor"
                  onClick={(e) => handleNavClick('photo-size-compressor', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Photo Size Compressor (Target KB)
                </a>
              </li>
              <li>
                <a
                  href="/image-converter"
                  onClick={(e) => handleNavClick('image-converter', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Image Converter (JPG, PNG, WebP, BMP)
                </a>
              </li>
              <li>
                <a
                  href="/image-to-pdf"
                  onClick={(e) => handleNavClick('image-to-pdf', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  JPG &amp; PNG to PDF
                </a>
              </li>
              <li className="pt-2 border-t border-[#E4E1F0] dark:border-[#242942]">
                <a
                  href="/word-tools"
                  onClick={(e) => handleNavClick('category-word-tools', e)}
                  className="text-[#1E5C9A] dark:text-sky-300 font-semibold transition-colors text-left cursor-pointer hover:underline block"
                >
                  Word Tools (.docx &amp; PDF)
                </a>
              </li>
              <li>
                <a
                  href="/excel-tools"
                  onClick={(e) => handleNavClick('category-excel-tools', e)}
                  className="text-[#196B47] dark:text-emerald-300 font-semibold transition-colors text-left cursor-pointer hover:underline block"
                >
                  Excel Tools (.xlsx &amp; CSV)
                </a>
              </li>
              <li>
                <a
                  href="/powerpoint-tools"
                  onClick={(e) => handleNavClick('category-powerpoint-tools', e)}
                  className="text-[#8A5E10] dark:text-amber-300 font-semibold transition-colors text-left cursor-pointer hover:underline block"
                >
                  PowerPoint Tools (.pptx to PDF)
                </a>
              </li>
              <li>
                <a
                  href="/other-document-tools"
                  onClick={(e) => handleNavClick('category-other-document-tools', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Other Tools (Text Diff &amp; Cleaner)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust, Legal & Contact Us */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#252536] dark:text-[#F2F4FC] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#249A67]" />
              Contact &amp; Legal
            </h3>

            {/* Clean Contact Developer Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1B1F35] border border-[#E8E6F2] dark:border-[#2A2F4A] shadow-2xs space-y-2.5">
              <div className="text-xs font-bold text-[#252536] dark:text-[#F2F4FC] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#5B50E6] dark:text-[#A49CFF] shrink-0" />
                  <span>Email Developer</span>
                </div>
                {copiedEmail && (
                  <span className="text-[10px] text-[#196B47] dark:text-emerald-300 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1 bg-[#FAFAFC] dark:bg-[#141727] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-xl px-2.5 py-1.5">
                <span
                  className="text-xs font-mono text-[#5B50E6] dark:text-[#B4AEFF] truncate select-all"
                  title={officialEmail}
                >
                  {officialEmail}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-[#777789] hover:text-[#252536] dark:hover:text-white p-1 rounded-lg hover:bg-[#E9E4FF]/60 dark:hover:bg-[#252A44] transition-colors shrink-0 cursor-pointer"
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-[#196B47] dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(officialEmail)}&su=${encodeURIComponent('[PottoTools] Inquiry & Feedback')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-[#E9E4FF] hover:bg-[#5B50E6] text-[#4C3C9E] hover:text-white dark:bg-[#2B244E] dark:text-[#D5CCFF] dark:hover:bg-[#5B50E6] dark:hover:text-white text-[11px] font-semibold transition-all text-center cursor-pointer"
                  title="Open in Gmail Web compose in new tab"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span>Open Gmail</span>
                </a>

                <a
                  href={`mailto:${officialEmail}?subject=${encodeURIComponent('[PottoTools] Inquiry')}`}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-[#F5F4FA] hover:bg-[#E8E6F2] text-[#252536] dark:bg-[#222742] dark:text-[#E2E5F6] dark:hover:bg-[#2E3456] border border-[#E8E6F2] dark:border-[#323858] text-[11px] font-semibold transition-all text-center cursor-pointer"
                  title="Open default email application"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span>Mail App</span>
                </a>
              </div>

              <a
                href="/contact"
                onClick={(e) => handleNavClick('contact', e)}
                className="w-full inline-flex items-center justify-center gap-1 text-[11px] text-[#777789] hover:text-[#5B50E6] dark:hover:text-[#A49CFF] pt-1 transition-colors cursor-pointer"
              >
                <span>Open Full Contact Page</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleNavClick('about', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left block"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleNavClick('contact', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left block"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleNavClick('privacy', e)}
                  className="hover:underline transition-colors text-left font-semibold text-[#196B47] dark:text-emerald-300 block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleNavClick('terms', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left block"
                >
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a
                  href="/disclaimer"
                  onClick={(e) => handleNavClick('disclaimer', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left block"
                >
                  Disclaimer
                </a>
              </li>
              <li>
                <a
                  href="/cookie-policy"
                  onClick={(e) => handleNavClick('cookie-policy', e)}
                  className="text-[#626278] dark:text-[#A0A5C0] hover:text-[#252536] dark:hover:text-white transition-colors text-left block"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  onClick={(e) => handleNavClick('blog', e)}
                  className="hover:underline transition-colors text-left font-medium text-[#1E5C9A] dark:text-sky-300 block"
                >
                  Practical Guides &amp; Blog
                </a>
              </li>
              <li>
                <a
                  href="/hi"
                  onClick={(e) => handleNavClick('hi', e)}
                  className="hover:underline transition-colors text-left font-medium text-[#196B47] dark:text-emerald-300 block"
                >
                  PottoTools हिंदी (Hindi)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777789] dark:text-[#8E93B2]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-medium text-[#252536] dark:text-[#D5D8EC]">
              © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
            </span>
            <span aria-hidden="true">·</span>
            <span>100% Private — Files Stay on Your Device</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Free forever for users worldwide</span>
            <Heart className="w-3.5 h-3.5 text-[#E86D42] inline fill-[#E86D42]" />
          </div>
        </div>
      </div>
    </footer>
  );
};
