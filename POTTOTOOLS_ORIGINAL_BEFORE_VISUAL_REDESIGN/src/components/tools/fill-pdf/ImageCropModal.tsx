import React, { useState, useRef } from 'react';
import { X, Crop, RotateCw, RotateCcw, Check } from 'lucide-react';
import { cropAndRotateImageDataUrl } from '../../../services/pdf/fillPdfFormService';

interface ImageCropModalProps {
  isOpen: boolean;
  sourceDataUrl: string;
  onClose: () => void;
  onApply: (result: { dataUrl: string; width: number; height: number }) => void;
}

const ASPECT_PRESETS: Array<{ label: string; ratio: number | null }> = [
  { label: 'Free', ratio: null },
  { label: 'Passport (3.5×4.5)', ratio: 3.5 / 4.5 },
  { label: 'Square (1:1)', ratio: 1 },
  { label: 'Photo (4:3)', ratio: 4 / 3 },
];

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  sourceDataUrl,
  onClose,
  onApply,
}) => {
  const [crop, setCrop] = useState({ x: 0.08, y: 0.08, width: 0.84, height: 0.84 });
  const [rotateDeg, setRotateDeg] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgNaturalRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });
  const dragStateRef = useRef<{
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; width: number; height: number };
  } | null>(null);

  if (!isOpen || !sourceDataUrl) return null;

  const applyPreset = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (!ratio) return;
    const nat = imgNaturalRef.current;
    const imgAspect = nat.w / Math.max(1, nat.h);
    // Target visual ratio = (crop.width * nat.w) / (crop.height * nat.h) => crop.width / crop.height = ratio / imgAspect
    const normRatio = ratio / imgAspect;
    let w = 0.8;
    let h = w / normRatio;
    if (h > 0.85) {
      h = 0.85;
      w = h * normRatio;
    }
    w = Math.min(0.95, Math.max(0.15, w));
    h = Math.min(0.95, Math.max(0.15, h));
    setCrop({
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      width: w,
      height: h,
    });
  };

  const startDrag = (
    e: React.PointerEvent,
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;

    const rect = stage.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / Math.max(1, rect.width);
    const dy = (e.clientY - drag.startY) / Math.max(1, rect.height);
    const s = drag.startCrop;
    const minSize = 0.12;

    if (drag.mode === 'move') {
      const nx = Math.max(0, Math.min(1 - s.width, s.x + dx));
      const ny = Math.max(0, Math.min(1 - s.height, s.y + dy));
      setCrop({ ...s, x: nx, y: ny });
      return;
    }

    let x = s.x;
    let y = s.y;
    let w = s.width;
    let h = s.height;

    if (drag.mode === 'se') {
      w = Math.max(minSize, Math.min(1 - s.x, s.width + dx));
      h = Math.max(minSize, Math.min(1 - s.y, s.height + dy));
    } else if (drag.mode === 'sw') {
      const newX = Math.max(0, Math.min(s.x + s.width - minSize, s.x + dx));
      w = s.x + s.width - newX;
      x = newX;
      h = Math.max(minSize, Math.min(1 - s.y, s.height + dy));
    } else if (drag.mode === 'ne') {
      w = Math.max(minSize, Math.min(1 - s.x, s.width + dx));
      const newY = Math.max(0, Math.min(s.y + s.height - minSize, s.y + dy));
      h = s.y + s.height - newY;
      y = newY;
    } else if (drag.mode === 'nw') {
      const newX = Math.max(0, Math.min(s.x + s.width - minSize, s.x + dx));
      const newY = Math.max(0, Math.min(s.y + s.height - minSize, s.y + dy));
      w = s.x + s.width - newX;
      h = s.y + s.height - newY;
      x = newX;
      y = newY;
    }

    if (aspectRatio) {
      const imgAspect = imgNaturalRef.current.w / Math.max(1, imgNaturalRef.current.h);
      const normRatio = aspectRatio / imgAspect;
      h = Math.min(1 - y, Math.max(minSize, w / normRatio));
      w = Math.min(1 - x, h * normRatio);
    }

    setCrop({ x, y, width: w, height: h });
  };

  const endDrag = () => {
    dragStateRef.current = null;
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const result = await cropAndRotateImageDataUrl(sourceDataUrl, crop, rotateDeg);
      onApply(result);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop and Rotate Image"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
              Crop &amp; Rotate Photo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {ASPECT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.ratio)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    aspectRatio === p.ratio
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRotateDeg((d) => (d + 270) % 360)}
                title="Rotate 90° Anticlockwise"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotateDeg((d) => (d + 90) % 360)}
                title="Rotate 90° Clockwise"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-500 tabular-nums w-9 text-right">
                {rotateDeg}°
              </span>
            </div>
          </div>

          {/* Crop Stage */}
          <div
            className="flex items-center justify-center bg-slate-950 rounded-xl p-4 select-none overflow-hidden"
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
          >
            <div ref={stageRef} className="relative inline-block max-h-[340px]">
              <img
                src={sourceDataUrl}
                alt="Crop source"
                onLoad={(e) => {
                  const im = e.currentTarget;
                  imgNaturalRef.current = { w: im.naturalWidth || 1, h: im.naturalHeight || 1 };
                }}
                draggable={false}
                className="max-h-[320px] max-w-full block pointer-events-none"
                style={{ transform: `rotate(${rotateDeg}deg)` }}
              />
              {/* Interactive Crop Box */}
              <div
                onPointerDown={(e) => startDrag(e, 'move')}
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
                }}
                className="absolute border-2 border-indigo-400 cursor-move touch-none"
              >
                {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                  <div
                    key={corner}
                    onPointerDown={(e) => startDrag(e, corner)}
                    className={`absolute w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs ${
                      corner === 'nw'
                        ? '-top-2 -left-2 cursor-nwse-resize'
                        : corner === 'ne'
                        ? '-top-2 -right-2 cursor-nesw-resize'
                        : corner === 'sw'
                        ? '-bottom-2 -left-2 cursor-nesw-resize'
                        : '-bottom-2 -right-2 cursor-nwse-resize'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isApplying}
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isApplying ? 'Applying...' : 'Apply Crop'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
