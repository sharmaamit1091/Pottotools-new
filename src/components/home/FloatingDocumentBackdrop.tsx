import React from 'react';

/**
 * FloatingDocumentBackdrop
 * Ultra-subtle, low-opacity pastel floating document illustrations for the homepage hero.
 * - PDF document, Word document, Image file, Cloud, File Conversion symbol
 * - Pure lightweight CSS animations (transform only)
 * - Hidden on mobile screens and paused/disabled under prefers-reduced-motion
 * - Strictly pointer-events-none so it never obstructs clicks or readability
 */
export const FloatingDocumentBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden -z-10 hidden md:block"
    >
      {/* Top-Left: Subtle PDF Document Card (Peach Pastel) */}
      <div className="absolute top-6 left-[3%] lg:left-[5%] opacity-[0.42] dark:opacity-[0.22] pt-float-a">
        <svg width="76" height="90" viewBox="0 0 76 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="68" height="82" rx="14" fill="#FFE9DA" className="dark:fill-[#3A2822]" stroke="#F3C5A8" strokeWidth="1.5" />
          <path d="M48 4V20C48 23.3137 50.6863 26 54 26H72" stroke="#F3C5A8" strokeWidth="1.5" />
          <rect x="16" y="34" width="28" height="12" rx="4" fill="#E67E51" fillOpacity="0.28" />
          <text x="20" y="43" fill="#B5522B" fontSize="8" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">PDF</text>
          <rect x="16" y="54" width="44" height="4" rx="2" fill="#D99B7A" fillOpacity="0.45" />
          <rect x="16" y="63" width="32" height="4" rx="2" fill="#D99B7A" fillOpacity="0.35" />
          <rect x="16" y="72" width="38" height="4" rx="2" fill="#D99B7A" fillOpacity="0.28" />
        </svg>
      </div>

      {/* Top-Right: Subtle Word Document Card (Sky Blue Pastel) */}
      <div className="absolute top-10 right-[3%] lg:right-[6%] opacity-[0.42] dark:opacity-[0.22] pt-float-b">
        <svg width="78" height="88" viewBox="0 0 78 88" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="70" height="80" rx="14" fill="#DDEEFF" className="dark:fill-[#1F3147]" stroke="#B6D7FA" strokeWidth="1.5" />
          <rect x="16" y="18" width="20" height="20" rx="6" fill="#4B8CE8" fillOpacity="0.24" />
          <text x="21" y="32" fill="#2A62B5" fontSize="11" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">W</text>
          <rect x="42" y="21" width="20" height="4" rx="2" fill="#7FB1EC" fillOpacity="0.5" />
          <rect x="42" y="29" width="14" height="4" rx="2" fill="#7FB1EC" fillOpacity="0.35" />
          <rect x="16" y="48" width="46" height="4" rx="2" fill="#7FB1EC" fillOpacity="0.45" />
          <rect x="16" y="57" width="38" height="4" rx="2" fill="#7FB1EC" fillOpacity="0.35" />
          <rect x="16" y="66" width="28" height="4" rx="2" fill="#7FB1EC" fillOpacity="0.28" />
        </svg>
      </div>

      {/* Mid-Left: Image File Illustration (Mint Pastel) */}
      <div className="absolute top-[46%] left-[2%] lg:left-[4%] opacity-[0.4] dark:opacity-[0.2] pt-float-c">
        <svg width="74" height="74" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="66" height="66" rx="16" fill="#DDF5E9" className="dark:fill-[#1A342A]" stroke="#B0E5CA" strokeWidth="1.5" />
          <circle cx="25" cy="25" r="6" fill="#3FA675" fillOpacity="0.32" />
          <path d="M14 54L29 37L41 49L49 41L60 54H14Z" fill="#3FA675" fillOpacity="0.28" />
        </svg>
      </div>

      {/* Mid-Right: File Conversion Symbol (Lavender Pastel) */}
      <div className="absolute top-[44%] right-[2%] lg:right-[4%] opacity-[0.42] dark:opacity-[0.22] pt-float-a">
        <svg width="82" height="68" viewBox="0 0 82 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="76" height="60" rx="16" fill="#E9E4FF" className="dark:fill-[#282246]" stroke="#CFC5FA" strokeWidth="1.5" />
          <path d="M26 26H52M52 26L45 19M52 26L45 33" stroke="#6E5CE6" strokeOpacity="0.65" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56 42H30M30 42L37 35M30 42L37 49" stroke="#6E5CE6" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Lower-Center-Left: Soft Cloud Outline (Butter Yellow / Sky Accent) */}
      <div className="absolute top-[22%] left-[14%] opacity-[0.34] dark:opacity-[0.16] pt-float-b hidden xl:block">
        <svg width="74" height="50" viewBox="0 0 74 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 42H55C62.1797 42 68 36.1797 68 29C68 22.3937 63.0748 16.9393 56.696 16.1066C54.6184 8.56207 47.7079 3 39.5 3C30.4021 3 22.8744 9.76649 21.6719 18.532C14.5396 19.3176 9 25.3578 9 32.7C9 37.8362 13.9249 42 20 42Z"
            fill="#FFF2C9"
            className="dark:fill-[#38301B]"
            stroke="#F2D785"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
};
