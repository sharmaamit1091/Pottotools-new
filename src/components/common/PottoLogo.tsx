import React, { useState } from 'react';

interface PottoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showWordmark?: boolean;
  inverted?: boolean;
  className?: string;
}

const LOGO_CANDIDATES = [
  '/logo.webp',
  '/logo.png',
  '/potto-logo.png',
  '/assets/logo.png',
  '/assets/aistudio/1793128238887_13aeadac.png',
];

export const PottoLogo: React.FC<PottoLogoProps> = ({
  size = 'md',
  showTagline = false,
  showWordmark = true,
  inverted = false,
  className = '',
}) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const iconSize =
    size === 'sm'
      ? 'w-7 h-7 sm:w-8 sm:h-8'
      : size === 'lg'
      ? 'w-11 h-11 sm:w-12 sm:h-12'
      : size === 'xl'
      ? 'w-14 h-14 sm:w-16 sm:h-16'
      : 'w-9 h-9 sm:w-10 sm:h-10';

  const textClass =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
      ? 'text-2xl'
      : size === 'xl'
      ? 'text-3xl'
      : 'text-xl';

  const handleImageError = () => {
    if (candidateIndex < LOGO_CANDIDATES.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official circular emblem with owl artwork */}
      <div
        className={`${iconSize} relative rounded-full overflow-hidden shrink-0 shadow-sm shadow-[#5B50E6]/15 ring-2 ring-[#E9E4FF] dark:ring-[#3A3566] transition-transform duration-200 group-hover:scale-105 bg-[#1B1D34] flex items-center justify-center`}
        title="PottoTools Official Logo"
      >
        {!allFailed ? (
          candidateIndex === 0 ? (
            <picture className="w-full h-full block">
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="PottoTools Logo"
                width="48"
                height="48"
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover select-none"
                onError={handleImageError}
              />
            </picture>
          ) : (
            <img
              src={LOGO_CANDIDATES[candidateIndex]}
              alt="PottoTools Logo"
              width="48"
              height="48"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover select-none"
              onError={handleImageError}
            />
          )
        ) : (
          /* High-fidelity Vector fallback if offline or assets blocked */
          <svg
            className="w-full h-full p-1"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="32" cy="32" r="30" fill="#1B1D34" />
            <circle cx="32" cy="32" r="28" stroke="#8178F6" strokeWidth="2" />
            <path
              d="M20 22C20 18 24 16 32 16C40 16 44 18 44 22V36C44 42.6274 38.6274 48 32 48C25.3726 48 20 42.6274 20 36V22Z"
              fill="#5B50E6"
            />
            <circle cx="26" cy="28" r="5" fill="#FAFAFC" />
            <circle cx="38" cy="28" r="5" fill="#FAFAFC" />
            <circle cx="26" cy="28" r="2.5" fill="#1B1D34" />
            <circle cx="38" cy="28" r="2.5" fill="#1B1D34" />
            <polygon points="32,32 29,38 35,38" fill="#F59E0B" />
          </svg>
        )}
      </div>

      {/* Brand Wordmark (optional if iconOnly) */}
      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center leading-none">
            <span
              className={`font-extrabold tracking-tight ${
                inverted ? 'text-white' : 'text-[#252536] dark:text-[#F2F4FC]'
              } ${textClass}`}
            >
              Potto
              <span
                className={
                  inverted
                    ? 'text-[#CFC8FF]'
                    : 'text-[#5B50E6] dark:text-[#9D95FF]'
                }
              >
                Tools
              </span>
            </span>
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase rounded-md bg-[#DDF5E9] text-[#176844] dark:bg-emerald-500/20 dark:text-emerald-300 border border-[#BCEBD4] dark:border-emerald-500/30">
              FREE
            </span>
          </div>
          {showTagline && (
            <span
              className={`text-[10px] font-semibold tracking-wide mt-0.5 ${
                inverted ? 'text-slate-300' : 'text-[#777789] dark:text-[#A0A5C0]'
              }`}
            >
              Smart Document Toolkit
            </span>
          )}
        </div>
      )}
    </div>
  );
};
