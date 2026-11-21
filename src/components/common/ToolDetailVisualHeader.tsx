import React from 'react';
import { ToolDefinition } from '../../config/toolsRegistry';
import { getToolVisualSpec } from '../../config/toolVisualMetadata';
import { UploadCloud, SlidersHorizontal, Download, ShieldCheck, CloudOff, Cpu, Lock } from 'lucide-react';
import { OfflineStatusBadge } from './OfflineStatusBadge';

interface ToolDetailVisualHeaderProps {
  tool: ToolDefinition;
}

export const ToolDetailVisualHeader: React.FC<ToolDetailVisualHeaderProps> = ({ tool }) => {
  const spec = getToolVisualSpec(tool.id, tool.title);
  const VisualComponent = spec.visual;

  return (
    <div className="w-full rounded-3xl bg-white dark:bg-[#181B2E] border border-[#E8E6F2] dark:border-[#2A2F4A] p-4 sm:p-6 mb-6 shadow-[0_6px_24px_-12px_rgba(37,37,54,0.08)]">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Before -> Action -> After Visual & Tool Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Visual Illustration Canvas */}
          <div className="tool-visual-stage w-full sm:w-56 h-20 rounded-2xl bg-[#F5F3FF] dark:bg-[#1E2238] border border-[#E2DCFB] dark:border-[#32385C] p-2 flex items-center justify-center shrink-0 overflow-hidden">
            <VisualComponent />
          </div>

          {/* Quick Explanation */}
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#E9E4FF] text-[#4C3C9E] dark:bg-[#2B244E] dark:text-[#D5CCFF]">
                {spec.actionLabel}
              </span>
              <span className="text-[#D4D2E3] dark:text-[#3E4468] text-xs" aria-hidden="true">·</span>
              <OfflineStatusBadge toolTitle={tool.title} align="left" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC] leading-tight">
              {tool.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#777789] dark:text-[#A0A5C0] max-w-xl mt-1 leading-relaxed">
              {tool.fullDesc || spec.shortExplanation || tool.shortDesc}
            </p>
          </div>
        </div>

        {/* Right: Simple Three-Step Visual Workflow (Sky, Lavender, Mint pastels) */}
        <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F1EFF8] dark:border-[#242942] shrink-0">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-[#DDEEFF] dark:bg-[#1B314E] border border-[#B2D7FB] dark:border-[#325785] flex items-center justify-center text-[#1A528C] dark:text-[#B9DCFF]">
              <UploadCloud className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#252536] dark:text-[#E2E5F6] mt-1">1. Choose</span>
            <span className="text-[9px] text-[#777789] hidden sm:inline">Your file</span>
          </div>

          <div className="text-[#C8C6DA] dark:text-[#454B70] text-xs font-bold pb-2">→</div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-[#E9E4FF] dark:bg-[#2B244E] border border-[#CFC5FA] dark:border-[#4D4287] flex items-center justify-center text-[#4C3C9E] dark:text-[#D5CCFF]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#252536] dark:text-[#E2E5F6] mt-1">2. Adjust</span>
            <span className="text-[9px] text-[#777789] hidden sm:inline">Options</span>
          </div>

          <div className="text-[#C8C6DA] dark:text-[#454B70] text-xs font-bold pb-2">→</div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-[#DDF5E9] dark:bg-[#17362A] border border-[#AEE3C8] dark:border-[#2A634C] flex items-center justify-center text-[#156340] dark:text-[#B4EED1]">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#252536] dark:text-[#E2E5F6] mt-1">3. Download</span>
            <span className="text-[9px] text-[#777789] hidden sm:inline">Your file</span>
          </div>
        </div>
      </div>

      {/* Privacy Commitment Row */}
      <div className="mt-4 pt-3.5 border-t border-[#F1EFF8] dark:border-[#242942]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#252536] dark:text-[#F2F4FC]">
            <ShieldCheck className="w-4 h-4 text-[#196B47] dark:text-emerald-400" />
            <span>Your Privacy Is Safe</span>
            <span className="text-[11px] font-normal text-[#777789] dark:text-[#A0A5C0] hidden md:inline">
              – Your files never leave your phone or computer
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#196B47] dark:text-emerald-300 bg-[#DDF5E9] dark:bg-[#17362A] px-2.5 py-0.5 rounded-lg border border-[#BCEBD4] dark:border-[#2A634C] self-start sm:self-auto">
            100% Private on Your Device
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAFAFC] dark:bg-[#141727] border border-[#ECEAF5] dark:border-[#252A44]">
            <div className="w-7 h-7 rounded-lg bg-[#DDF5E9] dark:bg-[#17362A] text-[#156340] dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
              <CloudOff className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase text-[#252536] dark:text-[#F2F4FC]">No File Uploads</div>
              <div className="text-[11px] text-[#777789] dark:text-[#A0A5C0] leading-tight mt-0.5">
                Your files are never sent to any online server.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAFAFC] dark:bg-[#141727] border border-[#ECEAF5] dark:border-[#252A44]">
            <div className="w-7 h-7 rounded-lg bg-[#DDEEFF] dark:bg-[#1B314E] text-[#1A528C] dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase text-[#252536] dark:text-[#F2F4FC]">Fast &amp; Direct</div>
              <div className="text-[11px] text-[#777789] dark:text-[#A0A5C0] leading-tight mt-0.5">
                Everything runs smoothly right inside your browser.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAFAFC] dark:bg-[#141727] border border-[#ECEAF5] dark:border-[#252A44]">
            <div className="w-7 h-7 rounded-lg bg-[#E9E4FF] dark:bg-[#2B244E] text-[#4C3C9E] dark:text-[#D5CCFF] flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase text-[#252536] dark:text-[#F2F4FC]">Complete Privacy</div>
              <div className="text-[11px] text-[#777789] dark:text-[#A0A5C0] leading-tight mt-0.5">
                Nothing is saved, tracked, or shared with anyone.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
