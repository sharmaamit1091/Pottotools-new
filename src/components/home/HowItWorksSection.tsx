import React from 'react';
import { MousePointerClick, UploadCloud, Sliders, Cpu, Download, Sparkles, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Pick a Tool',
      description: 'Choose the PDF, photo, or document tool you need.',
      icon: MousePointerClick,
      iconTile:
        'bg-[#DDEEFF] text-[#1A528C] border-[#B2D7FB] dark:bg-[#162742] dark:text-[#A3D2FF] dark:border-[#243E63]',
    },
    {
      step: '02',
      title: 'Choose Your File',
      description: 'Select or drop a PDF, photo, Word, Excel, or PowerPoint file from your device.',
      icon: UploadCloud,
      iconTile:
        'bg-[#E9E4FF] text-[#4B3A9D] border-[#CFC5FA] dark:bg-[#231F44] dark:text-[#C5BAFF] dark:border-[#373164]',
    },
    {
      step: '03',
      title: 'Pick Your Options',
      description: 'Set your target size (like 100KB), dimensions, page numbers, or output format.',
      icon: Sliders,
      iconTile:
        'bg-[#FFE9DA] text-[#8E3914] border-[#F5BEA0] dark:bg-[#3A2218] dark:text-[#FFB894] dark:border-[#593424]',
    },
    {
      step: '04',
      title: 'Click Start',
      description: 'Your device handles the conversion or edit right inside your browser in seconds.',
      icon: Cpu,
      iconTile:
        'bg-[#FFF2C9] text-[#7E520A] border-[#F1D583] dark:bg-[#362C14] dark:text-[#FFE08A] dark:border-[#53431D]',
    },
    {
      step: '05',
      title: 'Check & Download',
      description: 'Preview your finished file and save it straight to your phone or computer.',
      icon: Download,
      iconTile:
        'bg-[#DDF5E9] text-[#156340] border-[#BCEBD4] dark:bg-[#152E24] dark:text-[#8EE3BC] dark:border-[#244E3D]',
    },
  ];

  return (
    <section
      aria-label="How PottoTools Works"
      className="py-10 sm:py-14 rounded-3xl bg-[#F4F3FA]/80 dark:bg-[#141727] border border-[#E8E6F2] dark:border-[#262B45]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4B3A9D] dark:text-[#C5BAFF] bg-[#E9E4FF] dark:bg-[#231F44] px-3.5 py-1 rounded-full border border-[#CFC5FA] dark:border-[#373164]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5 Easy Steps</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-[#777789] dark:text-[#A0A5C0] leading-relaxed">
            Follow five simple steps to edit, shrink, or convert any file in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="pt-card-hover relative bg-white dark:bg-[#181B2E] p-5 sm:p-6 rounded-2xl border border-[#E8E6F2] dark:border-[#2A2F4A] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-[#D6D3E8] dark:text-[#343B5C]">
                      {s.step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.iconTile}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#777789] dark:text-[#A0A5C0] mt-2 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EEF8] dark:border-[#262B45] flex items-center gap-1.5 text-[11px] font-semibold text-[#156340] dark:text-[#8EE3BC]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Step {s.step}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
