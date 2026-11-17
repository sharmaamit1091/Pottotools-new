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
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Before -> Action -> After Visual & Tool Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Visual Illustration Canvas */}
          <div className="w-full sm:w-56 h-18 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            <VisualComponent />
          </div>

          {/* Quick Explanation */}
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {spec.actionLabel}
              </span>
              <span className="text-slate-300 dark:text-slate-600 text-xs" aria-hidden="true">·</span>
              <OfflineStatusBadge toolTitle={tool.title} align="left" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {tool.title} – Free Online Tool
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mt-1 leading-relaxed">
              {tool.fullDesc || spec.shortExplanation || tool.shortDesc}
            </p>
          </div>
        </div>

        {/* Right: Simple Three-Step Visual Workflow */}
        <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80 shrink-0">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <UploadCloud className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">1. Upload</span>
            <span className="text-[9px] text-slate-400 hidden sm:inline">Your file</span>
          </div>

          {/* Connector Arrow */}
          <div className="text-slate-300 dark:text-slate-600 text-xs font-bold pb-2">→</div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">2. Select</span>
            <span className="text-[9px] text-slate-400 hidden sm:inline">Operation</span>
          </div>

          {/* Connector Arrow */}
          <div className="text-slate-300 dark:text-slate-600 text-xs font-bold pb-2">→</div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">3. Download</span>
            <span className="text-[9px] text-slate-400 hidden sm:inline">Your result</span>
          </div>
        </div>
      </div>

      {/* Privacy Commitment Row */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Privacy Commitment</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 hidden md:inline">
              – Your sensitive files never leave your device
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 self-start sm:self-auto">
            100% Client-Side Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. No Uploads */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CloudOff className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">No Uploads</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                0 KB sent online. Files remain on your local disk.
              </div>
            </div>
          </div>

          {/* 2. In-Browser Processing */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">In-Browser Processing</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Powered by WebAssembly inside your browser RAM.
              </div>
            </div>
          </div>

          {/* 3. Client-Side Security */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Client-Side Security</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Air-gapped privacy with zero data logging or retention.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
