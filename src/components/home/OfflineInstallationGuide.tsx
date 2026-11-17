import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Play, Pause } from 'lucide-react';

type PlatformId = 'desktop' | 'android' | 'ios';
type StepIndex = 0 | 1 | 2;

const PLATFORM_OPTIONS: {
  id: PlatformId;
  label: string;
  installActionLabel: string;
  installCaption: string;
}[] = [
  {
    id: 'desktop',
    label: 'Desktop (Chrome / Edge)',
    installActionLabel: 'Click Install',
    installCaption: 'Click "Install App" or the address bar install icon in Chrome or Edge.',
  },
  {
    id: 'android',
    label: 'Android',
    installActionLabel: 'Install app',
    installCaption: 'Tap Chrome menu (⋮) and choose "Install app" to save to your device.',
  },
  {
    id: 'ios',
    label: 'iPhone / iPad',
    installActionLabel: 'Add to Home',
    installCaption: 'Tap Safari Share (⎋) and choose "Add to Home Screen" in 2 taps.',
  },
];

export const OfflineInstallationGuide: React.FC = () => {
  const [platform, setPlatform] = useState<PlatformId>('desktop');
  const [activeStep, setActiveStep] = useState<StepIndex>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveStep((prev) => ((prev + 1) % 3) as StepIndex);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const currentPlatform =
    PLATFORM_OPTIONS.find((item) => item.id === platform) || PLATFORM_OPTIONS[0];

  const handleSelectStep = (step: StepIndex) => {
    setActiveStep(step);
    setIsPlaying(false);
  };

  return (
    <div
      className={`w-full rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden text-white ${
        !isPlaying ? 'offline-guide-paused' : ''
      }`}
      aria-label="3-step animated SVG guide: Download, Install, and Use PottoTools 100% Offline"
    >
      {/* Interactive Top Control Bar: Platform Switcher + Play/Pause */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label="Select device to see install steps"
        >
          {PLATFORM_OPTIONS.map((opt) => {
            const isSelected = platform === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setPlatform(opt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {opt.id === 'desktop' ? (
                  <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsPlaying((prev) => !prev)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          aria-label={isPlaying ? 'Pause workflow animation' : 'Play workflow animation'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
              <span>Play</span>
            </>
          )}
        </button>
      </div>

      {/* 3-Step Animated SVG Workflow Pipeline */}
      <ol className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 lg:gap-2 items-stretch">
        {/* STEP 1: DOWNLOAD */}
        <li>
          <button
            type="button"
            onClick={() => handleSelectStep(0)}
            aria-current={activeStep === 0 ? 'step' : undefined}
            className={`w-full h-full text-left rounded-xl p-4 border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
              activeStep === 0
                ? 'bg-slate-950 border-emerald-400/60'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="font-bold text-sky-400">Step 01</span>
                <span className="text-slate-400">Download Offline</span>
              </div>
              <h3 className="text-base font-bold text-white">
                01. Download Offline Pack
              </h3>
            </div>

            {/* Animated SVG 1: Browser Vault Downloading 42+ Tools */}
            <div className="w-full rounded-lg bg-slate-900/90 border border-slate-800/80 p-2">
              <svg
                viewBox="0 0 280 156"
                role="img"
                aria-label="Animated diagram showing pottotools.in downloading all tools locally into browser storage"
                className="w-full h-auto block"
              >
                {/* Browser Frame */}
                <rect x="12" y="10" width="256" height="136" rx="10" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
                <rect x="12" y="10" width="256" height="24" rx="10" fill="#0f172a" />
                <rect x="12" y="26" width="256" height="8" fill="#0f172a" />
                <text x="26" y="26" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  pottotools.in
                </text>
                <text x="206" y="26" fill="#38bdf8" fontSize="9" fontWeight="700" fontFamily="monospace">
                  SW CACHE
                </text>

                {/* Animated Data Packets Dropping into Local Vault */}
                <g className="svg-packet-drop">
                  <rect x="118" y="42" width="12" height="12" rx="3" fill="#38bdf8" />
                  <rect x="136" y="38" width="12" height="12" rx="3" fill="#34d399" />
                  <rect x="154" y="44" width="12" height="12" rx="3" fill="#38bdf8" />
                </g>

                {/* Local Device Storage Box */}
                <rect x="34" y="76" width="212" height="54" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="48" y="96" fill="#f8fafc" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                  43+ PDF &amp; Image Engines
                </text>
                <text x="48" y="110" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  Saved in local browser vault
                </text>

                {/* Progress Track & Keyframed ScaleX Bar */}
                <rect x="48" y="118" width="184" height="5" rx="2.5" fill="#1e293b" />
                <rect
                  x="48"
                  y="118"
                  width="184"
                  height="5"
                  rx="2.5"
                  fill="#34d399"
                  className="svg-progress-bar"
                />
              </svg>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Visit once online—PottoTools automatically caches every tool locally with zero extra installer files.
            </p>
          </button>
        </li>

        {/* Connector Arrow 1 -> 2 (Desktop Horizontal SVG Arrow) */}
        <div className="hidden lg:flex items-center justify-center px-0.5" aria-hidden="true">
          <svg viewBox="0 0 36 24" className="w-7 h-5">
            <line
              x1="2"
              y1="12"
              x2="28"
              y2="12"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              className="svg-flow-dash"
            />
            <path d="M24 7 L31 12 L24 17" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* STEP 2: INSTALL */}
        <li>
          <button
            type="button"
            onClick={() => handleSelectStep(1)}
            aria-current={activeStep === 1 ? 'step' : undefined}
            className={`w-full h-full text-left rounded-xl p-4 border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
              activeStep === 1
                ? 'bg-slate-950 border-emerald-400/60'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="font-bold text-emerald-400">Step 02</span>
                <span className="text-slate-400">Install App</span>
              </div>
              <h3 className="text-base font-bold text-white">
                02. Install to Your Device
              </h3>
            </div>

            {/* Animated SVG 2: Pointer Tapping Install & App Snapping onto Home Screen */}
            <div className="w-full rounded-lg bg-slate-900/90 border border-slate-800/80 p-2">
              <svg
                viewBox="0 0 280 156"
                role="img"
                aria-label="Animated diagram showing clicking Install App to add the PottoTools icon to desktop or mobile home screen"
                className="w-full h-auto block"
              >
                {/* Device Screen */}
                <rect x="12" y="10" width="256" height="136" rx="10" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />

                {/* Install Prompt Row */}
                <rect x="26" y="22" width="228" height="44" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="38" y="41" fill="#f8fafc" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                  Install PottoTools?
                </text>
                <text x="38" y="55" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  {currentPlatform.label}
                </text>

                {/* Green Install Button */}
                <rect x="164" y="30" width="80" height="26" rx="6" fill="#10b981" />
                <text x="204" y="46" textAnchor="middle" fill="#020617" fontSize="10" fontWeight="800" fontFamily="sans-serif">
                  {currentPlatform.installActionLabel}
                </text>

                {/* Animated Vector Cursor Clicking Install */}
                <g className="svg-pointer-tap">
                  <path
                    d="M214 48 L214 66 L219 61 L224 68 L227 66 L222 59 L228 59 Z"
                    fill="#ffffff"
                    stroke="#020617"
                    strokeWidth="1.2"
                  />
                </g>

                {/* Home Screen / Dock Result */}
                <rect x="26" y="78" width="228" height="56" rx="8" fill="#0f172a" stroke="#10b981" strokeOpacity="0.45" strokeWidth="1" />
                <defs>
                  <clipPath id="pottoInstallIconClip">
                    <rect x="40" y="88" width="36" height="36" rx="8" />
                  </clipPath>
                </defs>
                <g className="svg-icon-dock-pop">
                  <image
                    href="/pwa-icon-192-v3.png"
                    x="40"
                    y="88"
                    width="36"
                    height="36"
                    clipPath="url(#pottoInstallIconClip)"
                  />
                </g>
                <text x="88" y="103" fill="#34d399" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                  App Icon Added
                </text>
                <text x="88" y="117" fill="#94a3b8" fontSize="9.5" fontFamily="sans-serif">
                  Ready on Desktop &amp; Home Screen
                </text>
              </svg>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {currentPlatform.installCaption}
            </p>
          </button>
        </li>

        {/* Connector Arrow 2 -> 3 */}
        <div className="hidden lg:flex items-center justify-center px-0.5" aria-hidden="true">
          <svg viewBox="0 0 36 24" className="w-7 h-5">
            <line
              x1="2"
              y1="12"
              x2="28"
              y2="12"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              className="svg-flow-dash"
            />
            <path d="M24 7 L31 12 L24 17" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* STEP 3: OPEN & USE 100% OFFLINE */}
        <li>
          <button
            type="button"
            onClick={() => handleSelectStep(2)}
            aria-current={activeStep === 2 ? 'step' : undefined}
            className={`w-full h-full text-left rounded-xl p-4 border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
              activeStep === 2
                ? 'bg-slate-950 border-emerald-400/60'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="font-bold text-amber-300">Step 03</span>
                <span className="text-emerald-400 font-bold">100% Offline</span>
              </div>
              <h3 className="text-base font-bold text-white">
                03. Open &amp; Use Offline
              </h3>
            </div>

            {/* Animated SVG 3: Wi-Fi Off / Airplane Mode + PDF Tool Finishing Local Task */}
            <div className="w-full rounded-lg bg-slate-900/90 border border-slate-800/80 p-2">
              <svg
                viewBox="0 0 280 156"
                role="img"
                aria-label="Animated diagram showing PottoTools running in Airplane Mode with zero internet connection to compress a PDF"
                className="w-full h-auto block"
              >
                <rect x="12" y="10" width="256" height="136" rx="10" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />

                {/* Top Offline Status Strip inside SVG */}
                <rect x="26" y="22" width="228" height="34" rx="7" fill="#0f172a" />
                {/* Wi-Fi Arcs with Animated Offline Slash */}
                <g transform="translate(36, 29)">
                  <path d="M2 10 Q11 2 20 10" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M5.5 13.5 Q11 8 16.5 13.5" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="11" cy="17" r="1.6" fill="#64748b" />
                  <line
                    x1="2"
                    y1="18"
                    x2="20"
                    y2="3"
                    stroke="#f59e0b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="svg-slash-draw"
                  />
                </g>
                <text x="66" y="38" fill="#fbbf24" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                  Wi-Fi Off · Airplane Mode
                </text>
                <text x="66" y="50" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                  0 KB sent to server
                </text>

                {/* Animated Completed Offline File Card */}
                <g className="svg-doc-done-slide">
                  <rect x="26" y="68" width="228" height="64" rx="8" fill="#064e3b" fillOpacity="0.35" stroke="#10b981" strokeOpacity="0.6" strokeWidth="1.2" />
                  <circle cx="50" cy="100" r="13" fill="#10b981" />
                  <path d="M44 100 L48.5 104.5 L56.5 95.5" fill="none" stroke="#020617" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="74" y="92" fill="#f8fafc" fontSize="11.5" fontWeight="700" fontFamily="sans-serif">
                    100% Offline Ready
                  </text>
                  <text x="74" y="107" fill="#a7f3d0" fontSize="9.5" fontFamily="sans-serif">
                    Compress, Merge &amp; Resize in 0.2s
                  </text>
                  <text x="74" y="121" fill="#6ee7b7" fontSize="8.5" fontFamily="monospace">
                    Open icon anytime without internet
                  </text>
                </g>
              </svg>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Turn off Wi-Fi or switch on Airplane Mode, tap the PottoTools icon, and process files anywhere.
            </p>
          </button>
        </li>
      </ol>
    </div>
  );
};
