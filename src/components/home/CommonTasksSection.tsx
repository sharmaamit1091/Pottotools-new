import React from 'react';
import { ToolDefinition, getToolBySlug } from '../../config/toolsRegistry';
import { preloadTool } from '../../services/utils/toolPreloader';
import {
  Mail,
  Maximize2,
  ScanText,
  Combine,
  FileEdit,
  Images,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  EyeOff,
} from 'lucide-react';

interface CommonTasksSectionProps {
  onSelectTool: (tool: ToolDefinition) => void;
}

interface CommonTaskItem {
  id: string;
  toolSlug: string;
  icon: React.FC<{ className?: string }>;
  tagline: string;
  title: string;
  description: string;
  accentBg: string;
  iconBg: string;
  textColor: string;
  badge: string;
}

const COMMON_TASKS: CommonTaskItem[] = [
  {
    id: 'redact-id-info',
    toolSlug: 'pdf-id-redactor',
    icon: EyeOff,
    tagline: 'Unique Offline Privacy',
    title: 'Hide Aadhaar, Bank Account or Salary info before sharing',
    description: 'Permanently blackout or blur sensitive numbers on PDFs & ID scans with zero cloud uploads.',
    accentBg: 'hover:border-emerald-300 dark:hover:border-emerald-700 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 dark:from-slate-900 dark:to-emerald-950/20',
    iconBg: 'bg-emerald-600 text-white',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    badge: '100% Offline Redactor',
  },
  {
    id: 'email-attachment',
    toolSlug: 'compress-pdf',
    icon: Mail,
    tagline: 'Email & Portal Ceilings',
    title: 'Shrink a heavy PDF to fit email attachment limits',
    description: 'Compress any PDF down to target 100KB, 200KB or 500KB with zero text fuzziness.',
    accentBg: 'hover:border-rose-300 dark:hover:border-rose-700 bg-gradient-to-br from-rose-50/50 via-white to-orange-50/30 dark:from-slate-900 dark:to-rose-950/20',
    iconBg: 'bg-rose-500 text-white',
    textColor: 'text-rose-600 dark:text-rose-400',
    badge: '100KB / 200KB Presets',
  },
  {
    id: 'resize-photo',
    toolSlug: 'custom-photo-studio',
    icon: Maximize2,
    tagline: 'Precision Photo Resizing',
    title: 'Resize images to exact pixels, cm, mm, or inches',
    description: 'Crisp multi-step resampling with custom DPI settings, aspect ratio lock, and live preview.',
    accentBg: 'hover:border-emerald-300 dark:hover:border-emerald-700 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:to-emerald-950/20',
    iconBg: 'bg-emerald-500 text-white',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'Custom DPI & Units',
  },
  {
    id: 'edit-contract',
    toolSlug: 'pdf-to-word',
    icon: FileEdit,
    tagline: 'Document Editing',
    title: 'Convert a locked PDF into an editable Word document',
    description: 'Extract paragraph flow and layout directly into standard Microsoft Word (.docx) format.',
    accentBg: 'hover:border-blue-300 dark:hover:border-blue-700 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:to-blue-950/20',
    iconBg: 'bg-blue-600 text-white',
    textColor: 'text-blue-600 dark:text-blue-400',
    badge: 'Editable DOCX',
  },
  {
    id: 'scanned-doc',
    toolSlug: 'ocr-tool',
    icon: ScanText,
    tagline: 'In-Browser OCR',
    title: 'Extract copyable text from photos or scanned paper',
    description: 'Read English and Hindi text from scans using optical character recognition right on your device.',
    accentBg: 'hover:border-teal-300 dark:hover:border-teal-700 bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/30 dark:from-slate-900 dark:to-teal-950/20',
    iconBg: 'bg-teal-500 text-white',
    textColor: 'text-teal-600 dark:text-teal-400',
    badge: 'English + Hindi',
  },
  {
    id: 'combine-receipts',
    toolSlug: 'merge-pdf',
    icon: Combine,
    tagline: 'File Organization',
    title: 'Combine invoices, bills, or certificates into one PDF',
    description: 'Drag, reorder, and stitch multiple documents into a single professional PDF portfolio.',
    accentBg: 'hover:border-purple-300 dark:hover:border-purple-700 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 dark:from-slate-900 dark:to-purple-950/20',
    iconBg: 'bg-purple-600 text-white',
    textColor: 'text-purple-600 dark:text-purple-400',
    badge: 'Custom Page Order',
  },
  {
    id: 'photos-to-pdf',
    toolSlug: 'image-to-pdf',
    icon: Images,
    tagline: 'Photo Submission',
    title: 'Turn camera snapshots into a neat multi-page PDF',
    description: 'Package phone photos or image scans into a single standardized document in seconds.',
    accentBg: 'hover:border-cyan-300 dark:hover:border-cyan-700 bg-gradient-to-br from-cyan-50/50 via-white to-sky-50/30 dark:from-slate-900 dark:to-cyan-950/20',
    iconBg: 'bg-cyan-600 text-white',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    badge: 'JPG, PNG, WebP',
  },
];

export const CommonTasksSection: React.FC<CommonTasksSectionProps> = ({ onSelectTool }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-900/40 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Problem-Solver Workflows</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            What do you want to accomplish today?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Pick your goal below and PottoTools will load the right tool configured with optimal presets.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Client-side execution · Zero data upload</span>
        </div>
      </div>

      {/* 6-Card Interactive Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {COMMON_TASKS.map((task) => {
          const tool = getToolBySlug(task.toolSlug);
          if (!tool) return null;
          const IconComp = task.icon;

          return (
            <a
              key={task.id}
              href={`/${tool.slug}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onSelectTool(tool);
                }
              }}
              onMouseEnter={() => preloadTool(task.toolSlug)}
              onFocus={() => preloadTool(task.toolSlug)}
              className={`p-6 border border-slate-200/80 dark:border-slate-800 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between group shadow-2xs no-underline ${task.accentBg}`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-2xl ${task.iconBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    {task.badge}
                  </span>
                </div>

                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${task.textColor}`}>
                    {task.tagline}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">
                  {tool.title}
                </span>
                <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Start now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};
