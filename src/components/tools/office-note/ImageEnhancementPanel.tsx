import React, { useState } from 'react';
import {
  RotateCw,
  Wand2,
  RotateCcw,
  SlidersHorizontal,
  Columns2,
  Eye,
  EyeOff,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_ENHANCEMENT_SETTINGS,
  DetectedTextLine,
  ENHANCEMENT_PRESETS,
  EnhancementPresetId,
  ImageEnhancementSettings,
} from '../../../services/htr/types';

interface ImageEnhancementPanelProps {
  pageNumber: number;
  sourceFileName: string;
  originalPreviewUrl: string | null;
  enhancedPreviewUrl: string | null;
  isRenderingPreview: boolean;
  isAutoDeskewing: boolean;
  settings: ImageEnhancementSettings;
  useEnhancedForRecognition: boolean;
  detectedLines: DetectedTextLine[];
  highlightedLineId: string | null;
  onHighlightLine: (id: string | null) => void;
  onChangeSettings: (next: ImageEnhancementSettings) => void;
  onToggleUseEnhanced: (useEnhanced: boolean) => void;
  onAutoDeskew: () => void;
  onDetectLinesPreview: () => void;
  disabled?: boolean;
}

export const ImageEnhancementPanel: React.FC<ImageEnhancementPanelProps> = ({
  pageNumber,
  sourceFileName,
  originalPreviewUrl,
  enhancedPreviewUrl,
  isRenderingPreview,
  isAutoDeskewing,
  settings,
  useEnhancedForRecognition,
  detectedLines,
  highlightedLineId,
  onHighlightLine,
  onChangeSettings,
  onToggleUseEnhanced,
  onAutoDeskew,
  onDetectLinesPreview,
  disabled = false,
}) => {
  const [compareMode, setCompareMode] = useState<'split' | 'side-by-side' | 'enhanced'>('split');
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [showLineOverlay, setShowLineOverlay] = useState<boolean>(true);
  const [showManualSliders, setShowManualSliders] = useState<boolean>(false);

  const applyPreset = (presetId: EnhancementPresetId) => {
    const preset = ENHANCEMENT_PRESETS[presetId];
    onChangeSettings({
      ...preset.settings,
      rotation: settings.rotation,
      deskewDeg: settings.deskewDeg,
    });
    onToggleUseEnhanced(presetId !== 'original');
  };

  const handleRotateLeft90 = () => {
    const nextRot = ((settings.rotation + 270) % 360) as 0 | 90 | 180 | 270;
    onChangeSettings({ ...settings, rotation: nextRot });
  };

  const handleRotateRight90 = () => {
    const nextRot = ((settings.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onChangeSettings({ ...settings, rotation: nextRot });
  };

  const handleResetAll = () => {
    onChangeSettings({ ...DEFAULT_ENHANCEMENT_SETTINGS });
    onToggleUseEnhanced(false);
  };

  const updateField = <K extends keyof ImageEnhancementSettings>(
    key: K,
    value: ImageEnhancementSettings[K]
  ) => {
    const next: ImageEnhancementSettings = {
      ...settings,
      [key]: value,
      enabled: true,
    };
    onChangeSettings(next);
    onToggleUseEnhanced(true);
  };

  const activePreviewUrl = enhancedPreviewUrl || originalPreviewUrl;

  const renderLineBoxesOverlay = () => {
    if (!showLineOverlay || detectedLines.length === 0) return null;
    return (
      <div className="absolute inset-0 pointer-events-none">
        {detectedLines.map((line) => {
          const isActive = highlightedLineId === line.id;
          return (
            <div
              key={line.id}
              onMouseEnter={() => onHighlightLine(line.id)}
              onMouseLeave={() => onHighlightLine(null)}
              style={{
                left: `${line.normalizedBox.x0 * 100}%`,
                top: `${line.normalizedBox.y0 * 100}%`,
                width: `${(line.normalizedBox.x1 - line.normalizedBox.x0) * 100}%`,
                height: `${(line.normalizedBox.y1 - line.normalizedBox.y0) * 100}%`,
              }}
              className={`absolute border transition-colors pointer-events-auto rounded-[2px] ${
                isActive
                  ? 'border-[#5B50E6] bg-[#5B50E6]/22 ring-1 ring-[#5B50E6]'
                  : 'border-emerald-500/75 bg-emerald-400/10 hover:bg-[#5B50E6]/18 hover:border-[#5B50E6]'
              }`}
              title={`Detected Line ${line.lineIndex + 1}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#171A2B] border border-[#E6E4F0] dark:border-[#282D47] overflow-hidden shadow-xs">
      {/* Studio Top Bar */}
      <div className="px-5 py-4 border-b border-[#ECEAF4] dark:border-[#242840] flex flex-wrap items-center justify-between gap-3 bg-[#FAFAFC] dark:bg-[#131625]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-[#252536] dark:text-[#F2F4FC]">
              Image Enhancement Studio
            </h3>
            <span className="text-xs text-[#777789] dark:text-[#9CA2BE]">
              · Page {pageNumber} · {sourceFileName}
            </span>
          </div>
          <p className="text-xs text-[#777789] dark:text-[#9CA2BE] mt-0.5">
            Optional non-destructive cleanup for faded, shadowed, or tilted scans. Your original scan is never overwritten.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Compare View Toggle */}
          <div
            role="group"
            aria-label="Preview comparison mode"
            className="inline-flex items-center p-0.5 rounded-xl bg-[#ECEAF4] dark:bg-[#22263C] text-xs font-semibold"
          >
            {(
              [
                { id: 'split', label: 'Split Compare' },
                { id: 'side-by-side', label: 'Side by Side' },
                { id: 'enhanced', label: 'Result Only' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setCompareMode(m.id)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  compareMode === m.id
                    ? 'bg-white dark:bg-[#141726] text-[#252536] dark:text-[#F2F4FC] shadow-2xs'
                    : 'text-[#646478] dark:text-[#9FA5C1] hover:text-[#252536] dark:hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={disabled || isRenderingPreview}
            onClick={onDetectLinesPreview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#D9D5EC] dark:border-[#323859] bg-white dark:bg-[#1B1F35] text-[#43348F] dark:text-[#CFC6FF] hover:bg-[#F3F0FF] dark:hover:bg-[#242048] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Preview Lines ({detectedLines.length})</span>
          </button>

          {detectedLines.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLineOverlay((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E4E1F0] dark:border-[#2E3454] text-[#5C5C72] dark:text-[#A5AAC4] hover:text-[#252536] dark:hover:text-white cursor-pointer"
              title={showLineOverlay ? 'Hide line overlays' : 'Show line overlays'}
            >
              {showLineOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showLineOverlay ? 'Lines On' : 'Lines Off'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Preview Canvas + Enhancement Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Visual Preview Stage */}
        <div className="lg:col-span-7 p-4 sm:p-5 bg-[#F4F3F9] dark:bg-[#101321] border-b lg:border-b-0 lg:border-r border-[#ECEAF4] dark:border-[#242840] flex flex-col gap-3">
          {compareMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#646478] dark:text-[#9FA5C1] flex items-center justify-between">
                  <span>Original Scan</span>
                  <span className="font-mono">Unmodified</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#191D30] border border-[#E2DFEF] dark:border-[#2A304D] min-h-[240px] flex items-center justify-center">
                  {originalPreviewUrl ? (
                    <img
                      src={originalPreviewUrl}
                      alt={`Original scanned page ${pageNumber}`}
                      className="w-full h-auto max-h-[460px] object-contain"
                    />
                  ) : (
                    <span className="text-xs text-[#777789]">Rendering page preview...</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#43348F] dark:text-[#CFC6FF] flex items-center justify-between">
                  <span>Enhanced Preview</span>
                  <span className="font-mono">
                    {useEnhancedForRecognition ? 'Active' : 'Original used'}
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#191D30] border border-[#D4CEF4] dark:border-[#393368] min-h-[240px] flex items-center justify-center">
                  {activePreviewUrl ? (
                    <div className="relative inline-block w-full">
                      <img
                        src={activePreviewUrl}
                        alt={`Enhanced scanned page ${pageNumber}`}
                        className="w-full h-auto max-h-[460px] object-contain block"
                      />
                      {renderLineBoxesOverlay()}
                    </div>
                  ) : (
                    <span className="text-xs text-[#777789]">Rendering enhanced preview...</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#646478] dark:text-[#9FA5C1]">
                <span>
                  {compareMode === 'split'
                    ? 'Left: Original Scan · Right: Enhanced Preview'
                    : 'Enhanced Recognition Input Preview'}
                </span>
                <span className="font-mono tabular-nums">
                  {isRenderingPreview
                    ? 'Updating...'
                    : settings.rotation !== 0 || settings.deskewDeg !== 0
                    ? `Rot ${settings.rotation}° · Tilt ${settings.deskewDeg.toFixed(1)}°`
                    : ENHANCEMENT_PRESETS[settings.preset].label}
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#191D30] border border-[#E2DFEF] dark:border-[#2A304D] min-h-[280px] flex items-center justify-center select-none">
                {originalPreviewUrl && activePreviewUrl ? (
                  <div className="relative inline-block max-w-full">
                    {/* Base Enhanced Image */}
                    <img
                      src={activePreviewUrl}
                      alt={`Enhanced scan page ${pageNumber}`}
                      className="block max-h-[500px] w-auto max-w-full object-contain"
                    />

                    {/* Split Original Overlay (clipped to left portion) */}
                    {compareMode === 'split' && (
                      <>
                        <img
                          src={originalPreviewUrl}
                          alt={`Original scan page ${pageNumber}`}
                          style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        />
                        <div
                          style={{ left: `${splitPercent}%` }}
                          className="absolute top-0 bottom-0 w-0.5 bg-[#5B50E6] shadow-[0_0_0_1px_rgba(255,255,255,0.6)] pointer-events-none"
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#5B50E6] text-white flex items-center justify-center shadow-md">
                            <Columns2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Optional Detected Handwritten Line Boxes */}
                    {renderLineBoxesOverlay()}
                  </div>
                ) : (
                  <span className="text-xs text-[#777789] dark:text-[#9CA2BE]">
                    Rendering high-resolution page preview locally...
                  </span>
                )}
              </div>

              {compareMode === 'split' && (
                <div className="flex items-center gap-3 px-1">
                  <span className="text-[11px] font-medium text-[#777789] dark:text-[#9CA2BE] whitespace-nowrap">
                    Original
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={splitPercent}
                    onChange={(e) => setSplitPercent(Number(e.target.value))}
                    aria-label="Before and after comparison split slider"
                    className="w-full accent-[#5B50E6] cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-[#43348F] dark:text-[#CFC6FF] whitespace-nowrap">
                    Enhanced
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Enhancement Controls */}
        <div className="lg:col-span-5 p-4 sm:p-5 space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#252536] dark:text-[#F2F4FC]">
                Cleanup Presets
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#777789] hover:text-[#252536] dark:hover:text-white cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ENHANCEMENT_PRESETS) as EnhancementPresetId[]).map((pid) => {
                const preset = ENHANCEMENT_PRESETS[pid];
                const active = settings.preset === pid && (pid !== 'original' ? settings.enabled : !settings.enabled);
                return (
                  <button
                    key={pid}
                    type="button"
                    disabled={disabled}
                    onClick={() => applyPreset(pid)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                      active
                        ? 'bg-[#F3F0FF] dark:bg-[#241F46] border-[#5B50E6] dark:border-[#8D85FF]'
                        : 'bg-[#FAFAFC] dark:bg-[#121524] border-[#E6E4F0] dark:border-[#262B45] hover:border-[#BDB6E8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#252536] dark:text-[#F2F4FC]">
                        {preset.label}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-[#5B50E6] dark:text-[#A9A2FF] shrink-0" />}
                    </div>
                    <p className="text-[11px] text-[#777789] dark:text-[#9CA2BE] mt-0.5 line-clamp-2 leading-snug">
                      {preset.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orientation & Deskew Quick Bar */}
          <div className="space-y-2 pt-3 border-t border-[#ECEAF4] dark:border-[#242840]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#252536] dark:text-[#F2F4FC]">
                Orientation &amp; Deskew
              </span>
              {settings.rotation !== 0 && (
                <span className="text-[11px] font-mono text-[#5B50E6] dark:text-[#B9B0FF]">
                  Rotated {settings.rotation}°
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={handleRotateLeft90}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#FAFAFC] dark:bg-[#121524] border border-[#E2DFEF] dark:border-[#2A304D] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer disabled:opacity-50"
                title="Rotate 90° counter-clockwise"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Rotate Left</span>
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={handleRotateRight90}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#FAFAFC] dark:bg-[#121524] border border-[#E2DFEF] dark:border-[#2A304D] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer disabled:opacity-50"
                title="Rotate 90° clockwise"
              >
                <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Rotate Right</span>
              </button>

              <button
                type="button"
                disabled={disabled || isAutoDeskewing}
                onClick={onAutoDeskew}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#E9E4FF] dark:bg-[#27224B] border border-[#CFC5FA] dark:border-[#423A78] text-[#43348F] dark:text-[#D5CEFF] hover:brightness-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAutoDeskewing ? 'Measuring tilt...' : 'Auto-Deskew'}</span>
              </button>
            </div>
          </div>

          {/* Recognition Source Toggle */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFAFC] dark:bg-[#121524] border border-[#E6E4F0] dark:border-[#262B45] cursor-pointer">
            <input
              type="checkbox"
              checked={useEnhancedForRecognition}
              disabled={disabled}
              onChange={(e) => onToggleUseEnhanced(e.target.checked)}
              className="mt-0.5 rounded accent-[#5B50E6] cursor-pointer"
            />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-[#252536] dark:text-[#F2F4FC] block">
                Use cleanup filters for recognition
              </span>
              <span className="text-[#777789] dark:text-[#9CA2BE]">
                Enable for faded or shadowed notes. Rotation and tilt adjustments are always applied automatically.
              </span>
            </div>
          </label>

          {/* Expandable Manual Fine-Tuning Sliders */}
          <div className="pt-2 border-t border-[#ECEAF4] dark:border-[#242840]">
            <button
              type="button"
              onClick={() => setShowManualSliders((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-[#43348F] dark:text-[#CFC6FF] py-1 cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Manual Adjustments (Shadow, Faint Ink, Contrast, B&amp;W)</span>
              </span>
              <span>{showManualSliders ? 'Hide' : 'Show'}</span>
            </button>

            {showManualSliders && (
              <div className="mt-3 space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-[#5C5C72] dark:text-[#A5AAC4]">Fine Deskew Tilt</span>
                    <span className="font-mono tabular-nums text-[#252536] dark:text-[#F2F4FC]">
                      {settings.deskewDeg.toFixed(1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.5}
                    disabled={disabled}
                    value={settings.deskewDeg}
                    onChange={(e) => updateField('deskewDeg', Number(e.target.value))}
                    className="w-full accent-[#5B50E6] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-[#5C5C72] dark:text-[#A5AAC4]">Shadow &amp; Background Cleanup</span>
                    <span className="font-mono tabular-nums text-[#252536] dark:text-[#F2F4FC]">
                      {settings.shadowRemoval}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    disabled={disabled}
                    value={settings.shadowRemoval}
                    onChange={(e) => updateField('shadowRemoval', Number(e.target.value))}
                    className="w-full accent-[#5B50E6] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-[#5C5C72] dark:text-[#A5AAC4]">Faint Ink Boost</span>
                    <span className="font-mono tabular-nums text-[#252536] dark:text-[#F2F4FC]">
                      {settings.faintInkBoost}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    disabled={disabled}
                    value={settings.faintInkBoost}
                    onChange={(e) => updateField('faintInkBoost', Number(e.target.value))}
                    className="w-full accent-[#5B50E6] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-[#5C5C72] dark:text-[#A5AAC4]">Contrast</span>
                      <span className="font-mono tabular-nums">{settings.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={100}
                      disabled={disabled}
                      value={settings.contrast}
                      onChange={(e) => updateField('contrast', Number(e.target.value))}
                      className="w-full accent-[#5B50E6] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-[#5C5C72] dark:text-[#A5AAC4]">Brightness</span>
                      <span className="font-mono tabular-nums">{settings.brightness}</span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      disabled={disabled}
                      value={settings.brightness}
                      onChange={(e) => updateField('brightness', Number(e.target.value))}
                      className="w-full accent-[#5B50E6] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={settings.noiseReduction}
                      onChange={(e) => updateField('noiseReduction', e.target.checked)}
                      className="accent-[#5B50E6]"
                    />
                    <span>Despeckle noise</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={settings.grayscale}
                      onChange={(e) => updateField('grayscale', e.target.checked)}
                      className="accent-[#5B50E6]"
                    />
                    <span>Grayscale</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={settings.binarize}
                      onChange={(e) => updateField('binarize', e.target.checked)}
                      className="accent-[#5B50E6]"
                    />
                    <span>B&amp;W Threshold</span>
                  </label>
                </div>

                {settings.binarize && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-[#5C5C72] dark:text-[#A5AAC4]">B&amp;W Threshold</span>
                      <span className="font-mono tabular-nums">{settings.threshold}</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={230}
                      disabled={disabled}
                      value={settings.threshold}
                      onChange={(e) => updateField('threshold', Number(e.target.value))}
                      className="w-full accent-[#5B50E6] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
