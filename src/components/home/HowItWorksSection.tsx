import React from 'react';
import { MousePointerClick, UploadCloud, Sliders, Cpu, Download, Sparkles, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Select a Tool',
      description: 'Choose the specific tool you need from our PDF, image, or document conversion categories.',
      icon: MousePointerClick,
      color: 'bg-blue-500 text-white',
    },
    {
      step: '02',
      title: 'Upload a Supported File',
      description: 'Drop your file into the workspace or browse your device. Supported formats include PDF, JPG, PNG, WebP, Word, Excel, and PowerPoint.',
      icon: UploadCloud,
      color: 'bg-indigo-500 text-white',
    },
    {
      step: '03',
      title: 'Adjust Available Settings',
      description: 'Configure available options such as target file size (KB/MB), custom dimensions (px/cm/mm), page ranges, or output formats.',
      icon: Sliders,
      color: 'bg-purple-500 text-white',
    },
    {
      step: '04',
      title: 'Process Your File',
      description: 'Click the action button. Your browser executes the conversion, compression, or editing logic locally in memory.',
      icon: Cpu,
      color: 'bg-pink-500 text-white',
    },
    {
      step: '05',
      title: 'Preview & Download the Result',
      description: 'Review the output directly in your browser and save the finished file immediately to your computer or phone.',
      icon: Download,
      color: 'bg-emerald-500 text-white',
    },
  ];

  return (
    <section aria-label="How PottoTools Works" className="py-10 sm:py-14 bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-950 dark:via-indigo-950/10 dark:to-slate-950 border-y border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-900/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5-Step Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Follow five straightforward steps to process your files quickly and accurately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-slate-300 dark:text-slate-700">
                      {s.step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Step {s.step} Verified</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
