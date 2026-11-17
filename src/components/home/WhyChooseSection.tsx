import React from 'react';
import { Sparkles, Sliders, Activity, Cpu, Smartphone, ShieldCheck, CheckCircle2, WifiOff } from 'lucide-react';

export const WhyChooseSection: React.FC = () => {
  const points = [
    {
      title: 'Simple and User-Friendly Tools',
      description:
        'Clean, intuitive interfaces designed for quick task completion. There are no complicated configuration menus, no mandatory account sign-ups, and no steep learning curves.',
      icon: Sparkles,
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    },
    {
      title: 'Clear Processing Information',
      description:
        'Transparent status indications at every step. You can see exact initial and final file sizes, compression percentages, and dimension details as your file processes.',
      icon: Activity,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    },
    {
      title: 'Practical File Conversion & Editing Options',
      description:
        'Targeted settings built for everyday needs: target file size reduction (100KB, 200KB, 500KB), exact dimension resizing in pixels, mm, cm, or inches, and multi-format exports.',
      icon: Sliders,
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    },
    {
      title: 'Easy-to-Understand Results',
      description:
        'Instant browser previews let you inspect the results before saving. Downloads trigger directly to your local device without deceptive redirect loops or third-party download lockers.',
      icon: Cpu,
      color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    },
    {
      title: 'Responsive Mobile Experience',
      description:
        'Engineered to function smoothly across smartphones, tablets, and desktop computers. Touch-friendly controls allow you to crop, organize, and convert files on the go.',
      icon: Smartphone,
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    },
    {
      title: 'Unique: Offline PDF & ID Redactor',
      description:
        'Permanently hide Aadhaar numbers, bank accounts, PAN, or salary figures on PDFs and ID photos 100% offline. Unlike cloud editors, sensitive KYC files never leave your device.',
      icon: ShieldCheck,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    },
    {
      title: 'Works 100% Without Internet (PWA)',
      description:
        'Most competing online tools fail immediately when your Wi-Fi drops. PottoTools runs completely in-browser via WebAssembly and can be installed as an offline app on Windows, Mac, Android, and iOS to edit files anywhere.',
      icon: WifiOff,
      color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    },
  ];

  return (
    <section aria-label="Why Choose PottoTools" className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Practical & Reliable Utilities</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Why Choose PottoTools?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          PottoTools provides direct, reliable browser-based utilities built to help you manage everyday document and photo tasks without unnecessary complexity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {points.map((pt, idx) => {
          const Icon = pt.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border mb-4 ${pt.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {pt.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pt.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Verified Capability</span>
              </div>
            </div>
          );
        })}

        {/* Technical Architecture Note */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-7 shadow-md flex flex-col justify-between border border-slate-800">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              In-Browser Execution Model
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Our tools process files directly on your device utilizing standard client-side libraries (<code className="text-xs bg-slate-800 px-1 py-0.5 rounded">pdf-lib</code>, <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">pdfjs-dist</code>, <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">mammoth</code>, <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">xlsx</code>). Files remain in your local session and are not uploaded to remote application servers.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Performance depends on device memory and browser specifications.
          </div>
        </div>
      </div>
    </section>
  );
};
