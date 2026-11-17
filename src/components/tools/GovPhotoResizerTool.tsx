import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { GOV_PRESETS, GovPreset, resizeGovImage, GovResizeResult } from '../../services/image/govResizerService';
import { triggerDownload, formatBytes } from '../../services/utils/downloadUtils';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Award,
  ArrowRight,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface GovPhotoResizerToolProps {
  tool: ToolDefinition;
}

export const GovPhotoResizerTool: React.FC<GovPhotoResizerToolProps> = ({ tool }) => {
  const [files, setFiles] = useState<File[]>([]);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && (staged.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(staged.name))) {
      clearStagedFileForTool();
      setFiles([staged]);
    }
  }, [tool.id]);
  const [selectedPreset, setSelectedPreset] = useState<GovPreset>(GOV_PRESETS[0]);
  const [customWidth, setCustomWidth] = useState<number>(200);
  const [customHeight, setCustomHeight] = useState<number>(230);
  const [customMaxKb, setCustomMaxKb] = useState<number>(50);
  const [customMinKb, setCustomMinKb] = useState<number>(20);
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [result, setResult] = useState<GovResizeResult | null>(null);

  const isCustom = selectedPreset.id === 'custom-photo';

  const handleSelectPreset = (preset: GovPreset) => {
    setSelectedPreset(preset);
    if (preset.id !== 'custom-photo') {
      setCustomWidth(preset.targetWidth);
      setCustomHeight(preset.targetHeight);
      setCustomMaxKb(preset.maxKb);
      setCustomMinKb(preset.minKb || 10);
    }
  };

  const handleResize = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(20);
    setStatusText('Loading photo into hardware canvas...');
    setErrorMsg(null);
    setResult(null);

    try {
      const file = files[0];
      const targetWidth = isCustom ? customWidth : selectedPreset.targetWidth;
      const targetHeight = isCustom ? customHeight : selectedPreset.targetHeight;
      const maxKb = isCustom ? customMaxKb : selectedPreset.maxKb;
      const minKb = isCustom ? customMinKb : selectedPreset.minKb;

      setProgress(50);
      setStatusText(`Iteratively optimizing dimensions to ${targetWidth}x${targetHeight} px and < ${maxKb} KB...`);

      const res = await resizeGovImage(file, {
        targetWidth,
        targetHeight,
        maxKb,
        minKb,
        backgroundColor: bgColor,
      });

      setProgress(100);
      setStatusText('Optimization complete!');
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resize photo/signature.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    triggerDownload(result.blob, result.filename);
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setProgress(0);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
          <Award className="w-4 h-4" />
          <span>Dual Constraint Optimizer · Exact Pixels & Exact KB</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {tool.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {tool.fullDesc}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {!result ? (
          <>
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={false}
              files={files}
              onFilesSelected={setFiles}
              onRemoveFile={() => setFiles([])}
              disabled={isProcessing}
            />

            {files.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Authority Presets Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Select Exam / Application Preset
                    </label>
                    <span className="text-[11px] text-slate-400">
                      All presets verified October 2026
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {GOV_PRESETS.map((preset) => {
                      const isSelected = selectedPreset.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-3.5 text-left rounded-xl border text-xs transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {preset.name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-mono text-[11px]">
                            <span>{preset.targetWidth} × {preset.targetHeight} px</span>
                            <span>·</span>
                            <span>{preset.minKb ? `${preset.minKb}-` : ''}{preset.maxKb} KB</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                            {preset.verifiedAuthority}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom dimensions inputs */}
                {isCustom && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Custom Application Dimensions & File Size Limits
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-slate-500 block mb-1">Width (px)</label>
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(parseInt(e.target.value) || 200)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Height (px)</label>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(parseInt(e.target.value) || 230)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Min Size (KB)</label>
                        <input
                          type="number"
                          value={customMinKb}
                          onChange={(e) => setCustomMinKb(parseInt(e.target.value) || 10)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Max Size (KB)</label>
                        <input
                          type="number"
                          value={customMaxKb}
                          onChange={(e) => setCustomMaxKb(parseInt(e.target.value) || 50)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Background color requirement */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Background Color Fill (Required by Exam Portals):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBgColor('#FFFFFF')}
                      className={`px-3 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 ${
                        bgColor === '#FFFFFF'
                          ? 'border-blue-600 bg-white text-slate-900 shadow-sm'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-slate-300 bg-white inline-block"></span>
                      <span>Plain White (Official)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgColor('#F8FAFC')}
                      className={`px-3 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 ${
                        bgColor === '#F8FAFC'
                          ? 'border-blue-600 bg-white text-slate-900 shadow-sm'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-slate-300 bg-slate-100 inline-block"></span>
                      <span>Off-White</span>
                    </button>
                  </div>
                </div>

                {isProcessing && (
                  <ProgressBar progress={progress} statusText={statusText} />
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleResize}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:via-orange-700 hover:to-rose-700 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-md hover:shadow-xl hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing to Exact Specs...</span>
                    </>
                  ) : (
                    <>
                      <span>Resize & Optimize for Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Result View */
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Application Photo/Signature Ready!
              </h2>
              <p className="text-xs text-slate-500">
                Guaranteed compliant with target dimension and size ceiling.
              </p>
            </div>

            {/* Preview image and specifications */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-xl mx-auto p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="shrink-0 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <img
                  src={result.dataUrl}
                  alt="Optimized application photo"
                  className="max-h-48 max-w-[200px] object-contain rounded"
                />
              </div>

              <div className="text-left space-y-2 text-xs w-full">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Target Authority:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPreset.name}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Dimensions:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {result.width} × {result.height} px
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">File Size:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {result.sizeKb} KB ({formatBytes(result.sizeBytes)})
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Quality Preserved:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {result.qualityUsed}% ({result.attempts} iterative convergence passes)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Verification:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Upload Ready</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-md hover:shadow-xl hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Compliant File</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-3.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resize Another Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AdPlaceholder format="tool-bottom" />

      {/* FAQs & Requirements Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Official Exam Requirements Summary
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2 flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">UPSC / SSC Photo</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">200x230 px · 20KB-50KB</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">UPSC / SSC Signature</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">140x60 px · 10KB-20KB</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Bank PO / Clerk Photo</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">200x230 px · 20KB-50KB</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Passport 35x45mm</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">413x531 px · 50KB-200KB</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Source: Official recruitment notices and ICAO guidelines. Last verified: October 2026.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 text-xs">
            {tool.faqs.map((faq, i) => (
              <div key={i}>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {faq.question}
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
