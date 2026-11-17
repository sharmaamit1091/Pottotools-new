import React from 'react';
import { Upload, Sliders, Play, CheckCircle2, Download } from 'lucide-react';

interface WorkflowStepsIndicatorProps {
  currentStep: 'upload' | 'settings' | 'process' | 'result';
  hasSettings?: boolean;
}

export const WorkflowStepsIndicator: React.FC<WorkflowStepsIndicatorProps> = ({
  currentStep,
  hasSettings = true,
}) => {
  const steps = [
    { id: 'upload', label: '1. Select File', icon: Upload },
    ...(hasSettings ? [{ id: 'settings', label: '2. Settings', icon: Sliders }] : []),
    { id: 'process', label: hasSettings ? '3. Process' : '2. Process', icon: Play },
    { id: 'result', label: hasSettings ? '4. Download' : '3. Download', icon: Download },
  ];

  const getStepIndex = (stepId: string) => steps.findIndex((s) => s.id === stepId);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-6">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap truncate w-full ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-200 dark:border-blue-900'
                    : isCompleted
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-500'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Icon className="w-2.5 h-2.5" />}
                </div>
                <span className="hidden sm:inline truncate">{step.label}</span>
                <span className="sm:hidden truncate">{step.label.split('. ')[1] || step.label}</span>
              </div>

              {idx < steps.length - 1 && (
                <div className="w-3 sm:w-6 h-0.5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
