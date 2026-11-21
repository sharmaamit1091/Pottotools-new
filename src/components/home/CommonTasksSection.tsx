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
    tagline: 'Private & Safe',
    title: 'Hide Aadhaar, Bank Account or Salary Info',
    description: 'Blackout or blur private numbers on PDFs and ID photos right on your device.',
    accentBg: 'hover:border-[#93D9B6] dark:hover:border-[#3E7661]',
    iconBg: 'bg-[#DDF5E9] text-[#156340] dark:bg-[#17362A] dark:text-[#B4EED1] border border-[#BCEBD4] dark:border-[#2A634C]',
    textColor: 'text-[#156340] dark:text-[#9BE6C2]',
    badge: '100% Offline',
  },
  {
    id: 'email-attachment',
    toolSlug: 'compress-pdf',
    icon: Mail,
    tagline: 'Smaller File Size',
    title: 'Shrink a Large PDF for Email or Forms',
    description: 'Reduce any PDF size to 100KB, 200KB, or 500KB while keeping text clear to read.',
    accentBg: 'hover:border-[#EAB89B] dark:hover:border-[#7B5244]',
    iconBg: 'bg-[#FFE9DA] text-[#8E3914] dark:bg-[#3B261E] dark:text-[#FFD2B5] border border-[#F5BEA0] dark:border-[#6A4132]',
    textColor: 'text-[#9A4319] dark:text-[#FFD2B5]',
    badge: '100KB / 200KB',
  },
  {
    id: 'resize-photo',
    toolSlug: 'custom-photo-studio',
    icon: Maximize2,
    tagline: 'Easy Photo Resizing',
    title: 'Resize Photos in Pixels, cm, mm, or Inches',
    description: 'Change photo size, crop, adjust brightness, or reduce KB size with live preview.',
    accentBg: 'hover:border-[#B9ACFA] dark:hover:border-[#5D509C]',
    iconBg: 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF] border border-[#CFC5FA] dark:border-[#4D4287]',
    textColor: 'text-[#4B3A9D] dark:text-[#C5BAFF]',
    badge: 'Exact Size',
  },
  {
    id: 'edit-contract',
    toolSlug: 'pdf-to-word',
    icon: FileEdit,
    tagline: 'Edit Your PDF',
    title: 'Turn a PDF into an Editable Word File',
    description: 'Convert PDF pages into a Microsoft Word (.docx) file so you can edit text easily.',
    accentBg: 'hover:border-[#9EC9F7] dark:hover:border-[#45689E]',
    iconBg: 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border border-[#B2D7FB] dark:border-[#325785]',
    textColor: 'text-[#1A528C] dark:text-[#A5D1FF]',
    badge: 'Editable Word',
  },
  {
    id: 'scanned-doc',
    toolSlug: 'ocr-tool',
    icon: ScanText,
    tagline: 'Photo to Text',
    title: 'Copy Text from Photos or Scanned Papers',
    description: 'Read English and Hindi text from photos and scanned PDFs in seconds.',
    accentBg: 'hover:border-[#E8CB7B] dark:hover:border-[#73623B]',
    iconBg: 'bg-[#FFF2C9] text-[#7E520A] dark:bg-[#3A2E14] dark:text-[#FFE49B] border border-[#F1D583] dark:border-[#6E5623]',
    textColor: 'text-[#8A5E10] dark:text-[#FFE49B]',
    badge: 'English + Hindi',
  },
  {
    id: 'combine-receipts',
    toolSlug: 'merge-pdf',
    icon: Combine,
    tagline: 'Join Files Together',
    title: 'Combine Bills or Certificates into One PDF',
    description: 'Join multiple PDF files together in the exact order you want.',
    accentBg: 'hover:border-[#B9ACFA] dark:hover:border-[#5D509C]',
    iconBg: 'bg-[#E9E4FF] text-[#4B3A9D] dark:bg-[#2B244E] dark:text-[#D5CCFF] border border-[#CFC5FA] dark:border-[#4D4287]',
    textColor: 'text-[#4B3A9D] dark:text-[#C5BAFF]',
    badge: 'Easy Reorder',
  },
  {
    id: 'photos-to-pdf',
    toolSlug: 'image-to-pdf',
    icon: Images,
    tagline: 'Photos to PDF',
    title: 'Turn Phone Photos into One Clean PDF',
    description: 'Combine JPG or PNG photos into a single neat PDF ready to share or upload.',
    accentBg: 'hover:border-[#9EC9F7] dark:hover:border-[#45689E]',
    iconBg: 'bg-[#DDEEFF] text-[#1A528C] dark:bg-[#1B314E] dark:text-[#B9DCFF] border border-[#B2D7FB] dark:border-[#325785]',
    textColor: 'text-[#1A528C] dark:text-[#A5D1FF]',
    badge: 'JPG, PNG, WebP',
  },
];

export const CommonTasksSection: React.FC<CommonTasksSectionProps> = ({ onSelectTool }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4B3A9D] dark:text-[#D5CCFF] bg-[#E9E4FF] dark:bg-[#2B244E] px-3 py-1 rounded-xl border border-[#CFC5FA] dark:border-[#4D4287] mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Shortcuts</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
            What Do You Want To Do Today?
          </h2>
          <p className="text-sm text-[#777789] dark:text-[#A0A5C0] mt-1 max-w-xl">
            Pick a common task below to open the right tool right away.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#55556B] dark:text-[#A8ADC7]">
          <ShieldCheck className="w-4 h-4 text-[#1E8E5E] dark:text-emerald-400" />
          <span>100% Private · Files stay on your device</span>
        </div>
      </div>

      {/* Interactive Task Grid */}
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
              className={`pt-card-hover p-6 bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-3xl cursor-pointer flex flex-col justify-between group no-underline ${task.accentBg}`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-2xl ${task.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-[#777789] dark:text-[#A0A5C0] bg-[#FAFAFC] dark:bg-[#141727] px-2.5 py-1 rounded-lg border border-[#ECEAF5] dark:border-[#252A44]">
                    {task.badge}
                  </span>
                </div>

                <div>
                  <div className={`text-[11px] font-extrabold uppercase tracking-wider ${task.textColor}`}>
                    {task.tagline}
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC] mt-1 group-hover:text-[#5B50E6] dark:group-hover:text-[#A49CFF] transition-colors leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs text-[#777789] dark:text-[#A0A5C0] mt-1.5 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F1EFF8] dark:border-[#242942] flex items-center justify-between text-xs font-bold">
                <span className="uppercase text-[#777789] dark:text-[#8E93B2]">
                  {tool.title}
                </span>
                <span className="text-[#5B50E6] dark:text-[#A49CFF] group-hover:translate-x-1 transition-transform flex items-center gap-1">
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
