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
    <footer className="w-full bg-slate-950 text-slate-300 border-t border-indigo-950/80 mt-12 sm:mt-16 pt-10 sm:pt-12 pb-10">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-900 text-sm">
          {/* Col 1: Brand & Security Promise */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <PottoLogo size="md" showWordmark={false} />
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Potto<span className="text-blue-500">Tools</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                  Free Productivity Toolkit
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {SITE_CONFIG.tagline}
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>100% Client-Side Local Processing</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400 font-medium">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Zero File Uploads to Cloud Servers</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>No Accounts, No Subscriptions, No Limits</span>
              </div>
              <div className="flex items-center gap-2 text-sky-400 font-medium">
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
              className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5 hover:text-rose-400 transition-colors text-left group cursor-pointer"
              title="View all PDF tools"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:scale-125 transition-transform" />
              <span>Top PDF Tools</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
            </a>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/compress-pdf"
                  onClick={(e) => handleNavClick('compress-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Compress PDF (100KB, 200KB, 500KB)
                </a>
              </li>
              <li>
                <a
                  href="/merge-pdf"
                  onClick={(e) => handleNavClick('merge-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Merge PDF Documents
                </a>
              </li>
              <li>
                <a
                  href="/split-pdf"
                  onClick={(e) => handleNavClick('split-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Split & Extract PDF Pages
                </a>
              </li>
              <li>
                <a
                  href="/pdf-page-organizer"
                  onClick={(e) => handleNavClick('pdf-page-organizer', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  PDF Page Organizer (500 MB)
                </a>
              </li>
              <li>
                <a
                  href="/searchable-pdf-text-finder"
                  onClick={(e) => handleNavClick('searchable-pdf-text-finder', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Searchable PDF & In-Browser OCR
                </a>
              </li>
              <li>
                <a
                  href="/pdf-to-word"
                  onClick={(e) => handleNavClick('pdf-to-word', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left font-medium text-blue-400 hover:text-blue-300 cursor-pointer hover:underline block"
                >
                  PDF to Word (.docx)
                </a>
              </li>
              <li>
                <a
                  href="/pdf-to-editable-word"
                  onClick={(e) => handleNavClick('pdf-to-editable-word', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  PDF to Editable Word (OCR)
                </a>
              </li>
              <li>
                <a
                  href="/word-to-pdf"
                  onClick={(e) => handleNavClick('word-to-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Word (.docx) to PDF
                </a>
              </li>
              <li>
                <a
                  href="/sign-pdf"
                  onClick={(e) => handleNavClick('sign-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Sign PDF & Draw Signatures
                </a>
              </li>
              <li>
                <a
                  href="/pdf-id-redactor"
                  onClick={(e) => handleNavClick('pdf-id-redactor', e)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors text-left cursor-pointer hover:underline block"
                >
                  PDF &amp; ID Redactor (Offline)
                </a>
              </li>
              <li>
                <a
                  href="/protect-pdf"
                  onClick={(e) => handleNavClick('protect-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Protect PDF (AES-256 Lock)
                </a>
              </li>
              <li>
                <a
                  href="/unlock-pdf"
                  onClick={(e) => handleNavClick('unlock-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Unlock PDF (Remove Password)
                </a>
              </li>
              <li>
                <a
                  href="/delete-pdf-pages"
                  onClick={(e) => handleNavClick('delete-pdf-pages', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Delete PDF Pages
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Image Tools & Presets */}
          <div>
            <a
              href="/image-tools"
              onClick={(e) => handleNavClick('category-image-tools', e)}
              className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5 hover:text-purple-400 transition-colors text-left group cursor-pointer"
              title="View all Image tools"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 group-hover:scale-125 transition-transform" />
              <span>Image Tools & Presets</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </a>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/custom-photo-studio"
                  onClick={(e) => handleNavClick('custom-photo-studio', e)}
                  className="text-purple-400 hover:text-purple-300 transition-colors text-left font-medium cursor-pointer hover:underline block"
                >
                  ★ Custom Photo Studio (All-in-One)
                </a>
              </li>
              <li>
                <a
                  href="/photo-signature-resizer"
                  onClick={(e) => handleNavClick('photo-signature-resizer', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Exam Photo & Signature Presets
                </a>
              </li>
              <li>
                <a
                  href="/photo-size-compressor"
                  onClick={(e) => handleNavClick('photo-size-compressor', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Photo Size Compressor (Target KB)
                </a>
              </li>
              <li>
                <a
                  href="/image-format-converter"
                  onClick={(e) => handleNavClick('image-format-converter', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Image Format Converter (JPG, PNG, WebP)
                </a>
              </li>
              <li>
                <a
                  href="/image-to-pdf"
                  onClick={(e) => handleNavClick('image-to-pdf', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Photos (JPG/PNG) to PDF
                </a>
              </li>
              <li>
                <a
                  href="/passport-photo-cropper"
                  onClick={(e) => handleNavClick('passport-photo-cropper', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Passport Photo Cropper (35×45mm)
                </a>
              </li>
              <li>
                <a
                  href="/photo-editor"
                  onClick={(e) => handleNavClick('photo-editor', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  Photo Editor & Color Adjustments
                </a>
              </li>
              <li>
                <a
                  href="/hd-image-enhancer"
                  onClick={(e) => handleNavClick('hd-image-enhancer', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  HD Image Enhancer
                </a>
              </li>
              <li>
                <a
                  href="/jpg-to-png"
                  onClick={(e) => handleNavClick('jpg-to-png', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  JPG to PNG Converter
                </a>
              </li>
              <li>
                <a
                  href="/png-to-jpg"
                  onClick={(e) => handleNavClick('png-to-jpg', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left cursor-pointer hover:underline block"
                >
                  PNG to JPG Converter
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust, Legal & Contact Us */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Contact & Legal
            </h3>

            {/* Prominent Official Contact Us Box with Desktop Webmail & 1-Click Copy */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Email Developer</span>
                </div>
                {copiedEmail && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>

              {/* Email address with 1-click Copy button */}
              <div className="flex items-center justify-between gap-1 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <span
                  className="text-xs font-mono text-blue-400 truncate select-all"
                  title={officialEmail}
                >
                  {officialEmail}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Direct Desktop Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(officialEmail)}&su=${encodeURIComponent('[PottoTools] Inquiry & Feedback')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-medium transition-all text-center cursor-pointer"
                  title="Open in Gmail Web compose in new tab"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span>Open Gmail</span>
                </a>

                <a
                  href={`mailto:${officialEmail}?subject=${encodeURIComponent('[PottoTools] Inquiry')}`}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-all text-center cursor-pointer"
                  title="Open default email application"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span>Mail App</span>
                </a>
              </div>

              <a
                href="/contact"
                onClick={(e) => handleNavClick('contact', e)}
                className="w-full inline-flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-white pt-1 transition-colors cursor-pointer"
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
                  className="text-slate-400 hover:text-white transition-colors text-left block"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleNavClick('contact', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left block"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleNavClick('privacy', e)}
                  className="hover:text-white transition-colors text-left font-semibold text-emerald-400 block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleNavClick('terms', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left block"
                >
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a
                  href="/disclaimer"
                  onClick={(e) => handleNavClick('disclaimer', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left block"
                >
                  Disclaimer
                </a>
              </li>
              <li>
                <a
                  href="/cookie-policy"
                  onClick={(e) => handleNavClick('cookie-policy', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left block"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  onClick={(e) => handleNavClick('blog', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left font-medium text-sky-400 hover:text-sky-300 block"
                >
                  Practical Guides &amp; Blog
                </a>
              </li>
              <li>
                <a
                  href="/hi"
                  onClick={(e) => handleNavClick('hi', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left font-medium text-emerald-400 hover:text-emerald-300 block"
                >
                  PottoTools हिंदी (Hindi)
                </a>
              </li>
              <li>
                <a
                  href="/directory"
                  onClick={(e) => handleNavClick('directory', e)}
                  className="text-slate-400 hover:text-white transition-colors text-left font-medium text-indigo-400 hover:text-indigo-300 block"
                >
                  All Tools (43+)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</span>
            <span>·</span>
            <span className="text-slate-400">Pure In-Browser WebAssembly Engine</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Free forever for users worldwide</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
