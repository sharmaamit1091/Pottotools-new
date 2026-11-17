import React from 'react';

/**
 * Standard Before -> Action -> After Visual Illustrations for PottoTools
 * Designed with SVG & CSS, matching PottoTools branding and WCAG contrast.
 */

// Common sub-elements
export const DocIcon: React.FC<{
  type?: 'pdf' | 'word' | 'excel' | 'ppt' | 'txt' | 'img';
  label?: string;
  sizeTag?: string;
  className?: string;
  isLarge?: boolean;
}> = ({ type = 'pdf', label, sizeTag, className = '', isLarge = false }) => {
  const getColors = () => {
    switch (type) {
      case 'pdf':
        return {
          bg: 'bg-red-500/10 dark:bg-red-950/40 border-red-500/40 text-red-600 dark:text-red-400',
          badge: 'bg-red-600 text-white',
          line: 'bg-red-300 dark:bg-red-700/60',
        };
      case 'word':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/40 text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-600 text-white',
          line: 'bg-blue-300 dark:bg-blue-700/60',
        };
      case 'excel':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
          badge: 'bg-emerald-600 text-white',
          line: 'bg-emerald-300 dark:bg-emerald-700/60',
        };
      case 'ppt':
        return {
          bg: 'bg-orange-500/10 dark:bg-orange-950/40 border-orange-500/40 text-orange-600 dark:text-orange-400',
          badge: 'bg-orange-600 text-white',
          line: 'bg-orange-300 dark:bg-orange-700/60',
        };
      case 'txt':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/40 text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-600 text-white',
          line: 'bg-amber-300 dark:bg-amber-700/60',
        };
      default:
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/40 text-purple-600 dark:text-purple-400',
          badge: 'bg-purple-600 text-white',
          line: 'bg-purple-300 dark:bg-purple-700/60',
        };
    }
  };

  const c = getColors();
  const widthClass = isLarge ? 'w-10 h-13' : 'w-8 h-10';

  return (
    <div
      className={`relative ${widthClass} rounded-lg border shadow-xs flex flex-col justify-between p-1 select-none shrink-0 transition-transform ${c.bg} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[8px] font-black px-1 rounded-sm leading-tight tracking-wider ${c.badge}`}>
          {label || type.toUpperCase()}
        </span>
      </div>

      <div className="space-y-0.5 my-auto pl-0.5">
        <div className={`h-0.5 w-4 rounded-full ${c.line}`} />
        <div className={`h-0.5 w-5 rounded-full ${c.line}`} />
        <div className={`h-0.5 w-3 rounded-full ${c.line}`} />
      </div>

      {sizeTag && (
        <span className="text-[7.5px] font-mono font-bold text-slate-600 dark:text-slate-300 leading-none">
          {sizeTag}
        </span>
      )}
    </div>
  );
};

export const ActionArrow: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
    {label && (
      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </span>
    )}
    <div className="w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs anim-arrow">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  </div>
);

/* =========================================================================
 * 1. PDF TOOLS ILLUSTRATIONS (Before -> Action -> After)
 * ========================================================================= */

// 1. Compress PDF: Large 5.8 MB PDF transforms into smaller 280 KB PDF
export const CompressPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex flex-col items-center anim-compress">
      <DocIcon type="pdf" label="PDF" sizeTag="5.8 MB" isLarge />
    </div>

    <div className="flex flex-col items-center px-1">
      <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider">
        -95%
      </span>
      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs anim-arrow">
        ↓
      </div>
    </div>

    <div className="flex flex-col items-center">
      <DocIcon type="pdf" label="PDF" sizeTag="280 KB" className="border-emerald-500/50 bg-emerald-500/10" />
    </div>
  </div>
);

// 2. Merge PDF: Two separate PDF documents combine into one
export const MergePdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-1.5 h-14">
    <div className="flex items-center gap-1">
      <DocIcon type="pdf" label="DOC 1" className="anim-merge-left" />
      <span className="text-slate-400 font-bold text-xs">+</span>
      <DocIcon type="pdf" label="DOC 2" className="anim-merge-right" />
    </div>

    <ActionArrow label="Merge" />

    <div className="relative pl-1">
      <div className="absolute top-0.5 left-2 w-7 h-9 rounded-lg bg-red-400/30 border border-red-500/30 -rotate-3" />
      <DocIcon type="pdf" label="COMBINED" className="relative z-10 shadow-sm" />
    </div>
  </div>
);

// 3. Split PDF: One multi-page PDF document separates into multiple files
export const SplitPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="relative">
      <DocIcon type="pdf" label="ALL" sizeTag="24 Pgs" isLarge />
      {/* Scissors cut graphic */}
      <div className="absolute -top-1 -right-1 text-xs">✂️</div>
    </div>

    <ActionArrow label="Extract" />

    <div className="flex items-center gap-1">
      <DocIcon type="pdf" label="PG 1-4" className="anim-split-left" />
      <DocIcon type="pdf" label="PG 5-8" className="anim-split-right" />
    </div>
  </div>
);

// 4. Organize PDF / Rotate PDF: Tilted & mixed pages rearrange into neat order
export const OrganizePdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    {/* Before: Tilted page & out of order (3, 1, 2) */}
    <div className="flex items-center -space-x-1">
      <div className="w-6 h-8 rounded-md bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-center justify-center text-[9px] font-bold text-red-600 -rotate-12 shadow-xs anim-rotate">
        3
      </div>
      <div className="w-6 h-8 rounded-md bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-center justify-center text-[9px] font-bold text-red-600 rotate-6 shadow-xs">
        1
      </div>
      <div className="w-6 h-8 rounded-md bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-center justify-center text-[9px] font-bold text-red-600 shadow-xs">
        2
      </div>
    </div>

    <ActionArrow label="Reorder" />

    {/* After: Ordered pages (1, 2, 3) perfectly upright */}
    <div className="flex items-center space-x-1">
      <div className="w-6 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700 flex items-center justify-center text-[9px] font-bold text-emerald-600 shadow-xs">
        1
      </div>
      <div className="w-6 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700 flex items-center justify-center text-[9px] font-bold text-emerald-600 shadow-xs">
        2
      </div>
      <div className="w-6 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700 flex items-center justify-center text-[9px] font-bold text-emerald-600 shadow-xs">
        3
      </div>
    </div>
  </div>
);

// 5. PDF to Word: Red PDF transforms into editable Word DOCX
export const PdfToWordVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex flex-col items-center">
      <DocIcon type="pdf" label="PDF" sizeTag="Locked" />
    </div>

    <ActionArrow label="Convert" />

    <div className="flex flex-col items-center">
      <DocIcon type="word" label="DOCX" sizeTag="Editable" isLarge />
    </div>
  </div>
);

// 6. Word to PDF: Word DOCX transforms into professional PDF
export const WordToPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex flex-col items-center">
      <DocIcon type="word" label="DOCX" sizeTag="Draft" isLarge />
    </div>

    <ActionArrow label="Export" />

    <div className="flex flex-col items-center">
      <DocIcon type="pdf" label="PDF" sizeTag="Official" />
    </div>
  </div>
);

// 7. Sign PDF: Signature appears directly on document
export const SignPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    {/* Before: Unsigned document */}
    <div className="relative w-8 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1 flex flex-col justify-between">
      <div className="space-y-0.5">
        <div className="h-0.5 w-5 bg-slate-300 dark:bg-slate-600 rounded-full" />
        <div className="h-0.5 w-4 bg-slate-300 dark:bg-slate-600 rounded-full" />
      </div>
      <div className="border-b border-dashed border-slate-400 h-2" />
    </div>

    <div className="text-base text-blue-600 dark:text-blue-400 anim-pen">✍️</div>

    {/* After: Document with blue cursive signature path */}
    <div className="relative w-9 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-400 dark:border-blue-700 p-1 flex flex-col justify-between shadow-xs">
      <div className="space-y-0.5">
        <div className="h-0.5 w-5 bg-blue-300 dark:bg-blue-600 rounded-full" />
        <div className="h-0.5 w-4 bg-blue-300 dark:bg-blue-600 rounded-full" />
      </div>
      <svg className="w-7 h-3 text-blue-600 dark:text-blue-400" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 15 C 10 5, 15 15, 20 8 C 25 2, 30 18, 45 10" />
      </svg>
    </div>
  </div>
);

// 8. Watermark PDF: Stamp watermark drops onto pages
export const WatermarkPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    {/* Before: Blank document */}
    <DocIcon type="pdf" label="PLAIN" />

    <ActionArrow label="Stamp" />

    {/* After: Document with diagonal CONFIDENTIAL watermark */}
    <div className="relative">
      <DocIcon type="pdf" label="PDF" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[7px] font-black uppercase tracking-tighter text-red-600/80 dark:text-red-400/80 border border-red-500/70 px-0.5 -rotate-25 bg-red-50/80 dark:bg-slate-900/80 rounded-xs anim-stamp">
          STAMP
        </span>
      </div>
    </div>
  </div>
);

// 9. Protect & Encrypt PDF: Padlock locks document
export const ProtectPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <DocIcon type="pdf" label="OPEN" sizeTag="Public" />

    <ActionArrow label="Lock" />

    <div className="relative">
      <DocIcon type="pdf" label="PDF" sizeTag="Encrypted" className="border-slate-500/50" />
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center text-[10px] shadow-sm">
        🔒
      </div>
    </div>
  </div>
);

// 10. PDF to Images: Single PDF decompiles into image tiles
export const PdfToImagesVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <DocIcon type="pdf" label="PDF" sizeTag="12 Pgs" />

    <ActionArrow label="Extract" />

    <div className="flex items-center -space-x-2">
      <div className="w-7 h-7 rounded-md bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 flex items-center justify-center text-xs shadow-xs">
        🖼️
      </div>
      <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-xs shadow-xs z-10">
        🌄
      </div>
    </div>
  </div>
);

// 11. Image to PDF: Photos bind together into a PDF
export const ImageToPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex items-center -space-x-1">
      <div className="w-6 h-6 rounded-md bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-[10px] shadow-xs">
        🖼️
      </div>
      <div className="w-6 h-6 rounded-md bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-[10px] shadow-xs">
        📸
      </div>
    </div>

    <ActionArrow label="Bind" />

    <DocIcon type="pdf" label="PDF" sizeTag="Album" isLarge />
  </div>
);

// 12. Searchable PDF / Find in Scanned PDF: Laser OCR search
export const SearchablePdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="relative w-8 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1 flex flex-col justify-around">
      <span className="text-[7px] text-slate-500 font-bold">SCAN</span>
      <div className="space-y-1">
        <div className="h-0.5 w-5 bg-slate-400 rounded-full" />
        <div className="h-0.5 w-4 bg-slate-400 rounded-full" />
      </div>
    </div>

    <div className="flex flex-col items-center">
      <span className="text-[8px] font-bold text-cyan-600 dark:text-cyan-400">OCR</span>
      <div className="text-sm">🔍</div>
    </div>

    <div className="relative w-8 h-10 rounded-lg bg-white dark:bg-slate-900 border border-cyan-400 dark:border-cyan-600 p-1 flex flex-col justify-around shadow-xs">
      <span className="text-[7px] text-cyan-600 font-bold">TEXT</span>
      <div className="space-y-1">
        <div className="h-0.5 w-5 bg-yellow-300 dark:bg-yellow-500 rounded-full" />
        <div className="h-0.5 w-3 bg-cyan-300 dark:bg-cyan-600 rounded-full" />
      </div>
    </div>
  </div>
);

// 13. Delete PDF Pages: Selected page removed
export const DeletePdfPagesVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex items-center space-x-0.5">
      <div className="w-5 h-7 rounded-sm bg-slate-200 dark:bg-slate-800 text-[8px] flex items-center justify-center font-bold">1</div>
      <div className="w-5 h-7 rounded-sm bg-red-100 dark:bg-red-950/60 border border-red-400 text-[8px] flex items-center justify-center font-bold text-red-600 relative">
        2
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-600 font-bold">✕</div>
      </div>
      <div className="w-5 h-7 rounded-sm bg-slate-200 dark:bg-slate-800 text-[8px] flex items-center justify-center font-bold">3</div>
    </div>

    <ActionArrow label="Delete" />

    <div className="flex items-center space-x-0.5">
      <div className="w-5 h-7 rounded-sm bg-emerald-100 dark:bg-emerald-950/40 text-[8px] flex items-center justify-center font-bold text-emerald-700">1</div>
      <div className="w-5 h-7 rounded-sm bg-emerald-100 dark:bg-emerald-950/40 text-[8px] flex items-center justify-center font-bold text-emerald-700">3</div>
    </div>
  </div>
);

// 14. Page Numbers PDF: Footer pagination added
export const PageNumbersVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="w-8 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1 flex flex-col justify-between">
      <div className="space-y-0.5">
        <div className="h-0.5 w-5 bg-slate-300 rounded-full" />
        <div className="h-0.5 w-4 bg-slate-300 rounded-full" />
      </div>
    </div>

    <ActionArrow label="1, 2, 3" />

    <div className="w-8 h-10 rounded-lg bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 p-1 flex flex-col justify-between shadow-xs">
      <div className="space-y-0.5">
        <div className="h-0.5 w-5 bg-blue-300 rounded-full" />
        <div className="h-0.5 w-4 bg-blue-300 rounded-full" />
      </div>
      <div className="text-[7px] text-blue-600 font-bold text-center">Pg 1 of 12</div>
    </div>
  </div>
);

/* =========================================================================
 * 2. IMAGE TOOLS ILLUSTRATIONS (Before -> Action -> After)
 * ========================================================================= */

// 14b. Custom Photo Studio: 7-step mini animated demonstration
export const CustomPhotoStudioCardVisual: React.FC = () => (
  <div className="relative w-full max-w-[210px] h-full flex items-center justify-center select-none">
    {/* Mini Photo Studio Canvas */}
    <div className="relative w-[184px] sm:w-[192px] h-[52px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-xs bg-slate-900 transition-colors">
      {/* Animated Photo Container: handles resize scaling, rotation tilting, and brightness/color filter */}
      <div className="absolute inset-0 flex items-center justify-center studio-photo-transform studio-photo-filter">
        {/* Realistic SVG Landscape Photograph (Alpine Lake, Snowy Peaks, Sunny Sky & Wooden Dock) */}
        <svg
          viewBox="0 0 200 120"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="studioSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="65%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="studioLake" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="45%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="studioDock" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>

          {/* Sky background */}
          <rect width="200" height="74" fill="url(#studioSky)" />

          {/* Radiant Sun & aura */}
          <circle cx="160" cy="24" r="16" fill="#fef08a" opacity="0.4" />
          <circle cx="160" cy="24" r="9" fill="#fef9c3" opacity="0.95" />

          {/* Soft Clouds */}
          <path d="M20,24 Q28,18 36,24 Q44,20 52,25 Q56,29 52,32 L20,32 Z" fill="#ffffff" opacity="0.8" />
          <path d="M78,30 Q88,23 98,28 Q106,25 114,29 L78,31 Z" fill="#ffffff" opacity="0.65" />

          {/* Far Mountains (snowy alpine peaks) */}
          <polygon points="15,74 62,26 108,74" fill="#64748b" />
          <polygon points="46,42 62,26 78,42 70,45 62,38 54,45" fill="#f8fafc" opacity="0.95" />
          <polygon points="86,74 132,32 176,74" fill="#475569" />
          <polygon points="118,44 132,32 146,44 139,47 132,41 125,47" fill="#f8fafc" opacity="0.95" />
          <polygon points="-10,74 28,40 68,74" fill="#475569" opacity="0.85" />

          {/* Evergreen Pine Foothills */}
          <polygon points="0,74 42,54 86,74" fill="#15803d" />
          <polygon points="112,74 156,50 200,74" fill="#166534" />
          <polygon points="20,58 18,65 22,65" fill="#14532d" />
          <polygon points="34,52 32,60 36,60" fill="#14532d" />
          <polygon points="48,54 46,62 50,62" fill="#14532d" />
          <polygon points="135,50 133,58 137,58" fill="#14532d" />
          <polygon points="150,48 148,56 152,56" fill="#14532d" />
          <polygon points="168,52 166,60 170,60" fill="#14532d" />

          {/* Alpine Lake Water */}
          <rect y="70" width="200" height="50" fill="url(#studioLake)" />
          {/* Water reflections */}
          <line x1="24" y1="78" x2="65" y2="78" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
          <line x1="82" y1="84" x2="135" y2="84" stroke="#7dd3fc" strokeWidth="1" opacity="0.5" />
          <line x1="140" y1="77" x2="185" y2="77" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
          <line x1="45" y1="92" x2="110" y2="92" stroke="#bae6fd" strokeWidth="1" opacity="0.4" />

          {/* Wooden Dock in perspective */}
          <polygon points="86,120 114,120 108,82 92,82" fill="url(#studioDock)" />
          {/* Planks */}
          <line x1="91" y1="86" x2="109" y2="86" stroke="#451a03" strokeWidth="0.8" />
          <line x1="90" y1="92" x2="110" y2="92" stroke="#451a03" strokeWidth="0.8" />
          <line x1="89" y1="100" x2="111" y2="100" stroke="#451a03" strokeWidth="0.8" />
          <line x1="87" y1="110" x2="113" y2="110" stroke="#451a03" strokeWidth="0.8" />
        </svg>
      </div>

      {/* --- 7-STEP OVERLAYS --- */}

      {/* Step 1: Center Sample Photo loaded badge (0% - 14%) */}
      <div className="absolute top-1 left-1.5 studio-step-1 pointer-events-none">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] font-semibold bg-slate-900/85 backdrop-blur-xs text-white border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Original Photo
        </span>
      </div>

      {/* Step 2: Crop Frame & Moving Brackets (14% - 28%) */}
      <div className="absolute inset-0 studio-step-2-crop pointer-events-none">
        <div className="absolute studio-step-2-box border border-dashed border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
          {/* Rule of thirds grid lines */}
          <div className="absolute inset-x-0 top-1/3 border-b border-white/25"></div>
          <div className="absolute inset-x-0 top-2/3 border-b border-white/25"></div>
          <div className="absolute inset-y-0 left-1/3 border-r border-white/25"></div>
          <div className="absolute inset-y-0 left-2/3 border-r border-white/25"></div>

          {/* Corner brackets */}
          <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-white"></div>
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 border-white"></div>
          <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 border-white"></div>
          <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-white"></div>
        </div>
        <div className="absolute top-1 right-1.5">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7.5px] font-bold bg-pink-600/90 text-white shadow-xs">
            ✂ Crop
          </span>
        </div>
      </div>

      {/* Step 3: Resize Handles & Scaling Dimension (28% - 42%) */}
      <div className="absolute inset-0 studio-step-3-resize pointer-events-none flex items-center justify-center">
        {/* 4 Corner Resize Dots */}
        <div className="absolute top-1.5 left-2 w-1.5 h-1.5 bg-blue-500 border border-white rounded-xs shadow-xs"></div>
        <div className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-blue-500 border border-white rounded-xs shadow-xs"></div>
        <div className="absolute bottom-1.5 left-2 w-1.5 h-1.5 bg-blue-500 border border-white rounded-xs shadow-xs"></div>
        <div className="absolute bottom-1.5 right-2 w-1.5 h-1.5 bg-blue-500 border border-white rounded-xs shadow-xs"></div>

        {/* Dimension Transform Badge */}
        <div className="bg-slate-900/90 backdrop-blur-xs border border-blue-400/60 rounded px-2 py-0.5 shadow-md flex items-center gap-1.5">
          <span className="text-[7.5px] font-mono text-slate-400 line-through">1920×1080</span>
          <span className="text-[8px] text-blue-400 font-bold">→</span>
          <span className="text-[8px] font-mono font-bold text-white bg-blue-600 px-1 py-0.2 rounded-xs">1280×720</span>
        </div>
      </div>

      {/* Step 4: Rotation Arrow & Angle Badge (42% - 56%) */}
      <div className="absolute inset-0 studio-step-4-rotate pointer-events-none flex items-center justify-center">
        <div className="bg-slate-900/90 backdrop-blur-xs border border-indigo-400/60 rounded-full py-1 px-2 shadow-lg flex items-center gap-1.5 text-white">
          <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.9 1 6.7 2.8L21 8" />
            <polyline points="21 3 21 8 16 8" />
          </svg>
          <span className="text-[8px] font-bold text-indigo-200">Rotate & Level</span>
        </div>
      </div>

      {/* Step 5: Brightness & Color Slider (56% - 70%) */}
      <div className="absolute inset-x-2 bottom-1 studio-step-5-slider pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-xs border border-amber-400/50 rounded-md px-2 py-0.5 shadow-md flex items-center gap-2">
          <span className="text-[9px] text-amber-300">☀️</span>
          {/* Slider track with gliding thumb */}
          <div className="relative flex-1 h-1.5 bg-slate-700 rounded-full overflow-visible">
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: '75%' }}></div>
            <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border border-amber-500 rounded-full shadow-sm studio-slider-thumb"></div>
          </div>
          <span className="text-[7.5px] font-mono font-bold text-amber-300">+35%</span>
        </div>
      </div>

      {/* Step 6: Compression Reduction Badge (70% - 84%) */}
      <div className="absolute inset-0 studio-step-6-compress pointer-events-none flex items-center justify-center">
        <div className="bg-slate-900/95 backdrop-blur-xs border border-emerald-500/70 rounded-md px-2 py-0.5 shadow-lg flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span className="text-[6.5px] text-slate-400 font-mono">Original</span>
            <span className="text-[7.5px] font-mono font-semibold text-slate-300 line-through">4.8 MB</span>
          </div>
          <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[8.5px]">
            ↓
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[6.5px] text-emerald-400 font-bold uppercase tracking-tight">-82%</span>
            <span className="text-[8px] font-mono font-extrabold text-emerald-300 bg-emerald-950/80 px-1 rounded border border-emerald-500/40">850 KB</span>
          </div>
        </div>
      </div>

      {/* Step 7: Ready to Download Badge (84% - 98%) */}
      <div className="absolute inset-0 studio-step-7-download pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Shimmer light sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent studio-shimmer"></div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md px-2 py-0.5 shadow-lg border border-blue-300/40 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-white animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animationDuration: '0.8s' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="text-[7.5px] font-black tracking-wide">READY TO DOWNLOAD</span>
            <span className="text-[6.5px] text-blue-100 font-medium">All edits applied</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 15. Resize Image: 4000x3000 px resized to 800x600 px
export const ResizeImageVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex flex-col items-center">
      <div className="w-10 h-9 rounded-lg bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-xs shadow-xs">
        🖼️
      </div>
      <span className="text-[7.5px] font-mono text-slate-500 mt-0.5">4000×3000</span>
    </div>

    <ActionArrow label="Scale" />

    <div className="flex flex-col items-center">
      <div className="w-7 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] shadow-sm">
        🖼️
      </div>
      <span className="text-[7.5px] font-mono font-bold text-purple-600 dark:text-purple-400 mt-0.5">800×600</span>
    </div>
  </div>
);

// 16. Compress Image: Large MB photo compressed to strict target KB
export const CompressImageVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex flex-col items-center anim-compress">
      <div className="w-9 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-xs">
        📸
      </div>
      <span className="text-[7.5px] font-mono text-slate-500 mt-0.5">8.4 MB</span>
    </div>

    <div className="flex flex-col items-center">
      <span className="text-[7.5px] font-bold text-emerald-600 uppercase">Target</span>
      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 flex items-center justify-center text-[9px] font-black text-emerald-600">
        ↓
      </div>
    </div>

    <div className="flex flex-col items-center">
      <div className="w-8 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-sm">
        📸
      </div>
      <span className="text-[7.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">48 KB</span>
    </div>
  </div>
);

// 17. JPG to PNG: Solid photo transforms into transparent PNG
export const JpgToPngVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-[9px] shadow-xs">
        JPG
      </div>
      <span className="text-[7.5px] text-slate-500 mt-0.5">Solid</span>
    </div>

    <ActionArrow label="Alpha" />

    <div className="flex flex-col items-center">
      {/* Checkered pattern representing transparency */}
      <div
        className="w-8 h-8 rounded-lg border border-purple-400/50 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-[9px] shadow-xs"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
        }}
      >
        <span className="bg-white/90 dark:bg-slate-900/90 px-1 rounded-xs">PNG</span>
      </div>
      <span className="text-[7.5px] font-bold text-purple-600 mt-0.5">Clear BG</span>
    </div>
  </div>
);

// 18. PNG to JPG: Transparent PNG converted to lightweight JPG
export const PngToJpgVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="flex flex-col items-center">
      <div
        className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-[9px] shadow-xs"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
          backgroundSize: '8px 8px',
        }}
      >
        <span className="bg-white/90 px-0.5 rounded-xs">PNG</span>
      </div>
      <span className="text-[7.5px] text-slate-500 mt-0.5">Large</span>
    </div>

    <ActionArrow label="Fill" />

    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white font-bold text-[9px] shadow-xs">
        JPG
      </div>
      <span className="text-[7.5px] font-bold text-amber-600 mt-0.5">Compact</span>
    </div>
  </div>
);

// 19. HD Image Enhancer: Split comparison before (blurry) and after (ultra-sharp)
export const ImageEnhancerVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="relative w-20 h-10 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm flex">
      {/* Left half: Blurry */}
      <div className="w-1/2 h-full bg-gradient-to-br from-indigo-300 to-purple-400 blur-xs flex items-center justify-center">
        <span className="text-white text-xs">👤</span>
      </div>
      {/* Right half: Crisp HD */}
      <div className="w-1/2 h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
        <span className="text-white text-xs drop-shadow-md">👤</span>
      </div>
      {/* Animated divider slider */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md anim-slider left-1/2" />
      <span className="absolute bottom-0.5 right-1 text-[7px] font-bold text-white bg-black/40 px-1 rounded-xs">
        HD
      </span>
    </div>
  </div>
);

// 20. Image Crop & Straighten: Framing box highlighting cropped area
export const ImageCropVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    {/* Before: Full photo with crop brackets */}
    <div className="relative w-10 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
      <span className="text-xs">🌄</span>
      {/* Dashed crop frame */}
      <div className="absolute inset-1 border border-dashed border-cyan-500 rounded-sm" />
    </div>

    <ActionArrow label="Crop" />

    {/* After: Extracted cropped subject */}
    <div className="w-7 h-7 rounded-md bg-cyan-600 text-white border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs shadow-md">
      🌄
    </div>
  </div>
);

// 21. Passport Photo Cropper: 2x2" standard biometric framing
export const PassportCropVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs">
      👤
    </div>

    <ActionArrow label="2×2″" />

    <div className="w-8 h-10 rounded-md bg-white dark:bg-slate-900 border-2 border-blue-500 p-0.5 flex flex-col items-center justify-center shadow-xs">
      <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 border border-blue-300 flex items-center justify-center text-[8px]">
        👤
      </div>
      <span className="text-[6.5px] font-mono font-bold text-blue-600 mt-0.5">35×45mm</span>
    </div>
  </div>
);

// 22. Exam Photo & Signature Resizer: Presets for UPSC / SSC
export const ExamPhotoSignatureVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-1.5 h-14">
    <div className="flex items-center gap-1">
      <div className="w-6 h-7 rounded-sm bg-purple-100 dark:bg-purple-950/60 border border-purple-300 flex items-center justify-center text-[10px]">
        👤
      </div>
      <div className="w-7 h-4 rounded-sm bg-blue-100 dark:bg-blue-950/60 border border-blue-300 flex items-center justify-center text-[7px] font-mono">
        ✍️
      </div>
    </div>

    <ActionArrow label="Exam" />

    <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-400 text-center shadow-xs">
      <div className="text-[7px] font-bold text-amber-700 dark:text-amber-300">UPSC / SSC</div>
      <div className="text-[7px] font-mono font-extrabold text-amber-800 dark:text-amber-200">20KB–50KB</div>
    </div>
  </div>
);

// 23. Photo Background Changer: Busy background replaced with studio white
export const PhotoBgChangerVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    {/* Busy gradient background */}
    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-400 via-yellow-400 to-teal-400 flex items-center justify-center text-xs shadow-xs">
      👤
    </div>

    <ActionArrow label="Studio" />

    {/* Clean pure white background */}
    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border-2 border-blue-400 flex items-center justify-center text-xs shadow-xs">
      <span className="drop-shadow-xs">👤</span>
    </div>
  </div>
);

// 24. OCR Tool: Scanned document text recognized via laser beam
export const OcrToolVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="relative w-8 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 p-1 flex flex-col justify-between overflow-hidden">
      <div className="space-y-0.5">
        <div className="h-0.5 w-5 bg-slate-400 rounded-full" />
        <div className="h-0.5 w-4 bg-slate-400 rounded-full" />
        <div className="h-0.5 w-5 bg-slate-400 rounded-full" />
      </div>
      {/* Animated cyan scan laser beam */}
      <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400 anim-scan" />
    </div>

    <ActionArrow label="OCR" />

    <div className="w-9 h-10 rounded-lg bg-white dark:bg-slate-900 border border-cyan-500 p-1 flex flex-col justify-around shadow-xs">
      <div className="text-[7px] font-mono font-extrabold text-cyan-600">TEXT</div>
      <div className="space-y-0.5">
        <div className="h-0.5 w-6 bg-cyan-300 rounded-full" />
        <div className="h-0.5 w-5 bg-cyan-300 rounded-full" />
      </div>
    </div>
  </div>
);

/* =========================================================================
 * 3. OFFICE TOOLS (Word, Excel, PowerPoint, Text)
 * ========================================================================= */

// 25. Excel to PDF: Spreadsheet grid transformed to paginated PDF
export const ExcelToPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <DocIcon type="excel" label="XLSX" sizeTag="Table" isLarge />

    <ActionArrow label="Print" />

    <DocIcon type="pdf" label="PDF" sizeTag="Report" />
  </div>
);

// 26. PDF to Excel: Table extracted from PDF into clean spreadsheet
export const PdfToExcelVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <DocIcon type="pdf" label="PDF" sizeTag="Invoice" />

    <ActionArrow label="Extract" />

    <DocIcon type="excel" label="XLSX" sizeTag="Spreadsheet" isLarge />
  </div>
);

// 27. CSV to XLSX: Comma separated text into multi-column table
export const CsvToXlsxVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="w-8 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 p-1 flex flex-col justify-around">
      <span className="text-[7px] font-mono text-slate-500 font-bold">CSV</span>
      <div className="text-[6.5px] font-mono text-slate-400 leading-tight">a,b,c</div>
    </div>

    <ActionArrow label="Format" />

    <DocIcon type="excel" label="XLSX" sizeTag="Workbook" isLarge />
  </div>
);

// 28. XLSX to CSV: Spreadsheet exported to lightweight CSV
export const XlsxToCsvVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <DocIcon type="excel" label="XLSX" sizeTag="Workbook" isLarge />

    <ActionArrow label="Flatten" />

    <div className="w-8 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 p-1 flex flex-col justify-around">
      <span className="text-[7px] font-mono text-emerald-600 font-bold">CSV</span>
      <div className="text-[6.5px] font-mono text-emerald-600 leading-tight">Light</div>
    </div>
  </div>
);

// 29. PowerPoint to PDF: Presentation slides rendered into PDF
export const PptToPdfVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <DocIcon type="ppt" label="PPTX" sizeTag="Slides" isLarge />

    <ActionArrow label="Render" />

    <DocIcon type="pdf" label="PDF" sizeTag="Deck" />
  </div>
);

// 30. Text Diff Comparator: Document A vs Document B with line differences
export const TextDiffVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-1.5 h-14">
    <div className="w-8 h-9 rounded-md bg-slate-100 dark:bg-slate-800 border p-1 text-[7px] font-mono">
      <div className="text-red-500">- Old</div>
      <div className="text-slate-400">Line</div>
    </div>

    <ActionArrow label="Diff" />

    <div className="w-8 h-9 rounded-md bg-slate-100 dark:bg-slate-800 border p-1 text-[7px] font-mono">
      <div className="text-emerald-500">+ New</div>
      <div className="text-slate-400">Line</div>
    </div>
  </div>
);

// 31. Text Cleaner: Irregular spaces formatted to clean justified text
export const TextCleanerVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="w-8 h-9 rounded-md bg-slate-100 dark:bg-slate-800 border p-1 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="h-0.5 w-3 bg-slate-400 rounded-full ml-1" />
        <div className="h-0.5 w-5 bg-slate-400 rounded-full ml-2" />
        <div className="h-0.5 w-4 bg-slate-400 rounded-full" />
      </div>
      <span className="text-[6.5px] text-red-500 font-mono">Messy</span>
    </div>

    <ActionArrow label="Clean" />

    <div className="w-8 h-9 rounded-md bg-white dark:bg-slate-900 border border-blue-400 p-1 flex flex-col justify-between shadow-xs">
      <div className="space-y-1">
        <div className="h-0.5 w-6 bg-blue-400 rounded-full" />
        <div className="h-0.5 w-6 bg-blue-400 rounded-full" />
        <div className="h-0.5 w-6 bg-blue-400 rounded-full" />
      </div>
      <span className="text-[6.5px] text-blue-600 font-mono font-bold">Clean</span>
    </div>
  </div>
);

// 32. Sheet Viewer: Interactive tabular spreadsheet viewer
export const SheetViewerVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <DocIcon type="excel" label="XLSX" />

    <ActionArrow label="Inspect" />

    <div className="w-12 h-10 rounded-md bg-white dark:bg-slate-900 border border-emerald-500 p-1 flex flex-col justify-around shadow-xs">
      <div className="grid grid-cols-3 gap-0.5">
        <div className="h-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xs" />
        <div className="h-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xs" />
        <div className="h-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xs" />
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-xs" />
        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-xs" />
        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-xs" />
      </div>
    </div>
  </div>
);

// 33. PDF & ID Redactor: Aadhaar / Bank / Salary card masked permanently
export const RedactIdVisual: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="w-11 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1 flex flex-col justify-between shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-[6px] font-extrabold text-amber-700 dark:text-amber-400">ID / PDF</span>
        <div className="w-2 h-2 rounded-xs bg-indigo-400/50" />
      </div>
      <div className="space-y-0.5">
        <div className="h-1 w-8 rounded-full bg-slate-400 dark:bg-slate-500" />
        <div className="text-[6.5px] font-mono font-bold text-rose-600 dark:text-rose-400 leading-none">
          5821 9042
        </div>
      </div>
    </div>

    <ActionArrow label="Hide" />

    <div className="w-11 h-10 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/60 p-1 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[6px] font-extrabold text-emerald-700 dark:text-emerald-300">SAFE</span>
        <span className="text-[7px] text-emerald-600 dark:text-emerald-400 font-black">✓</span>
      </div>
      <div className="space-y-0.5">
        <div className="h-1 w-8 rounded-full bg-slate-300 dark:bg-slate-600" />
        <div className="h-2 w-8 rounded-xs bg-slate-950 dark:bg-slate-950 anim-redact-bar" />
      </div>
    </div>
  </div>
);

// 34. Generic Default Fallback Visual
export const GenericToolVisual: React.FC<{ title: string; category?: string }> = ({
  title,
}) => (
  <div className="flex items-center justify-center gap-2 h-14">
    <div className="w-8 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-xs">
      📄
    </div>
    <ActionArrow label="Process" />
    <div className="w-8 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow-sm">
      ✓
    </div>
  </div>
);
