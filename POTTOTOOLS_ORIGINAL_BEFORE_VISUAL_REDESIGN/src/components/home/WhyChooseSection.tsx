import React from 'react';
import { Sparkles, Sliders, Activity, Cpu, Smartphone, ShieldCheck, CheckCircle2, WifiOff } from 'lucide-react';

export const WhyChooseSection: React.FC = () => {
  const points = [
    {
      title: 'Simple & Easy to Use',
      description:
        'Clean screens made for everyone. No sign-up, no login, and no confusing menus — just pick a tool and get your work done.',
      icon: Sparkles,
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    },
    {
      title: 'Clear Before & After Info',
      description:
        'See your old and new file size, image dimensions, and savings clearly before you download your file.',
      icon: Activity,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    },
    {
      title: 'Made for Everyday Forms & Tasks',
      description:
        'Shrink PDFs to 100KB or 200KB, resize photos in pixels, cm, or mm, and convert files for jobs, exams, and office work.',
      icon: Sliders,
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    },
    {
      title: 'Instant Preview & Direct Download',
      description:
        'Check your finished file right on screen and download it directly to your phone or computer with one click.',
      icon: Cpu,
      color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    },
    {
      title: 'Works Great on Phones & Computers',
      description:
        'Use every tool smoothly on Android, iPhone, tablets, and laptops with easy touch controls.',
      icon: Smartphone,
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    },
    {
      title: 'Hide Private ID & Bank Details',
      description:
        'Blackout or blur Aadhaar numbers, PAN, bank accounts, or salary details safely offline before sharing documents.',
      icon: ShieldCheck,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    },
    {
      title: 'Works Without Internet',
      description:
        'Install PottoTools once on your phone or computer and keep editing PDFs and photos even with Wi-Fi turned off.',
      icon: WifiOff,
      color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    },
  ];

  return (
    <section aria-label="Why Choose PottoTools" className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Simple &amp; Trusted Tools</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
          Why Choose PottoTools?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Fast, free, and easy-to-use tools built to handle your everyday PDF, photo, and document tasks without any hassle.
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
                <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                  {pt.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pt.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Free &amp; Ready to Use</span>
              </div>
            </div>
          );
        })}

        {/* Privacy Promise Card */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-7 shadow-md flex flex-col justify-between border border-slate-800">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-white">
              Your Files Never Leave Your Device
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every tool works directly inside your own web browser. Your PDFs, photos, and ID cards are never uploaded to any outside server, so your private documents stay completely under your control.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Safe for personal documents, exam forms, and office files.
          </div>
        </div>
      </div>
    </section>
  );
};
