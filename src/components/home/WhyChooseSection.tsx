import React from 'react';
import { Sparkles, Sliders, Activity, Cpu, Smartphone, ShieldCheck, CheckCircle2, WifiOff } from 'lucide-react';

export const WhyChooseSection: React.FC = () => {
  const points = [
    {
      title: 'Simple & Easy to Use',
      description:
        'Clean screens made for everyone. No sign-up, no login, and no confusing menus — just pick a tool and get your work done.',
      icon: Sparkles,
      color: 'bg-[#E9E4FF] dark:bg-[#2B244E] text-[#4B3A9D] dark:text-[#D5CCFF] border-[#CFC5FA] dark:border-[#4D4287]',
    },
    {
      title: 'Clear Before & After Info',
      description:
        'See your old and new file size, image dimensions, and savings clearly before you download your file.',
      icon: Activity,
      color: 'bg-[#DDF5E9] dark:bg-[#17362A] text-[#156340] dark:text-[#B4EED1] border-[#BCEBD4] dark:border-[#2A634C]',
    },
    {
      title: 'Made for Everyday Forms & Tasks',
      description:
        'Shrink PDFs to 100KB or 200KB, resize photos in pixels, cm, or mm, and convert files for jobs, exams, and office work.',
      icon: Sliders,
      color: 'bg-[#DDEEFF] dark:bg-[#1B314E] text-[#1A528C] dark:text-[#B9DCFF] border-[#B2D7FB] dark:border-[#325785]',
    },
    {
      title: 'Instant Preview & Direct Download',
      description:
        'Check your finished file right on screen and download it directly to your phone or computer with one click.',
      icon: Cpu,
      color: 'bg-[#FFE9DA] dark:bg-[#3B261E] text-[#8E3914] dark:text-[#FFD2B5] border-[#F5BEA0] dark:border-[#6A4132]',
    },
    {
      title: 'Works Great on Phones & Computers',
      description:
        'Use every tool smoothly on Android, iPhone, tablets, and laptops with easy touch controls.',
      icon: Smartphone,
      color: 'bg-[#FFF2C9] dark:bg-[#3A2E14] text-[#7E520A] dark:text-[#FFE49B] border-[#F1D583] dark:border-[#6E5623]',
    },
    {
      title: 'Hide Private ID & Bank Details',
      description:
        'Blackout or blur Aadhaar numbers, PAN, bank accounts, or salary details safely offline before sharing documents.',
      icon: ShieldCheck,
      color: 'bg-[#DDF5E9] dark:bg-[#17362A] text-[#156340] dark:text-[#B4EED1] border-[#BCEBD4] dark:border-[#2A634C]',
    },
    {
      title: 'Works Without Internet',
      description:
        'Install PottoTools once on your phone or computer and keep editing PDFs and photos even with Wi-Fi turned off.',
      icon: WifiOff,
      color: 'bg-[#DDEEFF] dark:bg-[#1B314E] text-[#1A528C] dark:text-[#B9DCFF] border-[#B2D7FB] dark:border-[#325785]',
    },
  ];

  return (
    <section aria-label="Why Choose PottoTools" className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DDEEFF] dark:bg-[#1B314E] text-xs font-bold text-[#1A528C] dark:text-[#B9DCFF] border border-[#B2D7FB] dark:border-[#325785]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Simple &amp; Trusted Tools</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
          Why Choose PottoTools?
        </h2>
        <p className="text-sm sm:text-base text-[#777789] dark:text-[#A0A5C0] leading-relaxed">
          Fast, free, and easy-to-use tools built to handle your everyday PDF, photo, and document tasks without any hassle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {points.map((pt, idx) => {
          const Icon = pt.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] p-6 sm:p-7 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border mb-4 ${pt.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
                  {pt.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#777789] dark:text-[#A0A5C0] leading-relaxed">
                  {pt.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F1EFF8] dark:border-[#242942] flex items-center gap-1.5 text-xs font-bold text-[#196B47] dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Free &amp; Ready to Use</span>
              </div>
            </div>
          );
        })}

        {/* Privacy Promise Card */}
        <div className="rounded-3xl bg-[#252536] dark:bg-[#1E223A] text-white p-6 sm:p-7 shadow-md flex flex-col justify-between border border-[#35354E] dark:border-[#343A5E]">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-[#E9E4FF]/15 border border-[#E9E4FF]/25 text-[#D5CCFF] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-white">
              Your Files Never Leave Your Device
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#D1D3E5] leading-relaxed">
              Every tool works directly inside your own web browser. Your PDFs, photos, and ID cards are never uploaded to any outside server, so your private documents stay completely under your control.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#B4B7CF]">
            Safe for personal documents, exam forms, and office files.
          </div>
        </div>
      </div>
    </section>
  );
};
