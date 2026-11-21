import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Laptop, Smartphone, Check, X, WifiOff, Sparkles, Shield } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'hero' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // If already running inside standalone installed window
  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>App Installed (Offline Ready)</span>
        </span>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowInfoModal(true);
    }
  };

  // Compact Variant for Header / Nav
  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 shadow-2xs transition-all cursor-pointer ${className}`}
          title="Install PottoTools as a desktop or mobile app (Works 100% Offline)"
        >
          <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span className="hidden sm:inline">Install App</span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-200/70 dark:bg-sky-800/80 text-sky-800 dark:text-sky-200">
            Offline
          </span>
        </button>

        {/* Info Modal for browsers where install prompt isn't fired yet */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-left">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Install PottoTools Offline App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Windows, Mac, Android, iOS & Chromebook
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-start gap-2.5">
                  <WifiOff className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white">Works 100% Without Internet:</strong>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Unlike other websites that fail when your Wi-Fi drops, PottoTools is cached locally on your device. You can compress, convert, resize, and organize files on flights, trains, or during internet outages.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    How to install on your device:
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300">
                    <li>
                      <strong>Chrome / Edge (Desktop):</strong> Click the <strong>Install</strong> icon in the address bar (top right).
                    </li>
                    <li>
                      <strong>Android:</strong> Tap the browser menu (⋮) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </li>
                    <li>
                      <strong>Mac / Safari:</strong> Click <strong>File &gt; Add to Dock</strong>.
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="mt-5 w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 text-xs shadow-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}

        {/* iOS Safari Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-left">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Works offline like a native iOS app
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                <p>Follow these 2 quick steps in Safari:</p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari (square with arrow).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 text-xs shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Hero / Full Variant
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-md shadow-sky-600/20 hover:shadow-lg transition-all cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install App (Works Offline)</span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
          Free PWA
        </span>
      </button>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Install PottoTools Offline App
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Zero install size • 100% In-Browser Privacy
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-start gap-2.5">
                <WifiOff className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">100% Offline Capability:</strong>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                    Unlike typical websites that need internet to upload your files, PottoTools works directly on your phone or computer. Install it once, and compress, convert, or resize files anytime, even offline.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 space-y-2">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Instant Installation Steps:
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Desktop Chrome / Edge / Brave:</strong> Click the <strong>Install</strong> icon on the right side of the address bar.
                  </li>
                  <li>
                    <strong>Android:</strong> Tap browser menu (⋮) &gt; <strong>"Install app"</strong>.
                  </li>
                  <li>
                    <strong>iPhone / iPad:</strong> Tap Safari <strong>Share</strong> &gt; <strong>"Add to Home Screen"</strong>.
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="mt-5 w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 text-xs shadow-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* iOS Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Offline PWA on your home screen</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p>In Safari:</p>
              <p>1. Tap the <strong>Share</strong> button at the bottom.</p>
              <p>2. Tap <strong>Add to Home Screen</strong>.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 text-xs shadow-xs transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
