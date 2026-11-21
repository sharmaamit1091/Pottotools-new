import React, { useState, useRef, useEffect } from 'react';
import { X, PenTool, Type as TypeIcon, Upload, Trash2, Check, Sparkles } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: {
    dataUrl: string;
    width: number;
    height: number;
    name: string;
    saveToLibrary: boolean;
  }) => void;
}

const INK_COLORS = [
  { label: 'Navy Ink', hex: '#0f2557' },
  { label: 'Black Ink', hex: '#0f172a' },
  { label: 'Royal Blue', hex: '#1d4ed8' },
];

const TYPED_SIGNATURE_STYLES = [
  { id: 'cursive-1', label: 'Classic Script', font: "italic 46px 'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive" },
  { id: 'cursive-2', label: 'Formal Serif', font: "italic 38px Georgia, 'Times New Roman', serif" },
  { id: 'cursive-3', label: 'Modern Clean', font: "600 italic 34px 'Plus Jakarta Sans', system-ui, sans-serif" },
];

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [inkColor, setInkColor] = useState('#0f2557');
  const [strokeWidth, setStrokeWidth] = useState(2.8);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [typedStyleIdx, setTypedStyleIdx] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [removeWhiteBg, setRemoveWhiteBg] = useState(true);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
  }, [isOpen]);

  const clearDrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawing(false);
  };

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getPointerPos(e);
    lastPtRef.current = pt;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = inkColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, strokeWidth * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    setHasDrawing(true);
    setError(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current || !lastPtRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const pt = getPointerPos(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = strokeWidth * 1.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPtRef.current = pt;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPtRef.current = null;
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select a PNG or JPG signature image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedUrl(String(reader.result || ''));
      setError(null);
    };
    reader.readAsDataURL(f);
  };

  const trimTransparentCanvas = (
    srcCanvas: HTMLCanvasElement
  ): { dataUrl: string; width: number; height: number } => {
    const ctx = srcCanvas.getContext('2d');
    if (!ctx) return { dataUrl: srcCanvas.toDataURL('image/png'), width: srcCanvas.width, height: srcCanvas.height };
    const { width, height } = srcCanvas;
    const imgData = ctx.getImageData(0, 0, width, height).data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = imgData[(y * width + x) * 4 + 3];
        if (alpha > 12) {
          found = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      return { dataUrl: srcCanvas.toDataURL('image/png'), width, height };
    }

    const pad = 12;
    const rx = Math.max(0, minX - pad);
    const ry = Math.max(0, minY - pad);
    const rw = Math.min(width - rx, maxX - minX + pad * 2);
    const rh = Math.min(height - ry, maxY - minY + pad * 2);

    const out = document.createElement('canvas');
    out.width = Math.max(16, rw);
    out.height = Math.max(16, rh);
    const outCtx = out.getContext('2d');
    outCtx?.drawImage(srcCanvas, rx, ry, rw, rh, 0, 0, rw, rh);
    const url = out.toDataURL('image/png');
    out.width = 1;
    out.height = 1;
    return { dataUrl: url, width: rw, height: rh };
  };

  const handleConfirm = async () => {
    setError(null);
    if (tab === 'draw') {
      if (!hasDrawing || !canvasRef.current) {
        setError('Please draw your signature on the pad first.');
        return;
      }
      const trimmed = trimTransparentCanvas(canvasRef.current);
      onConfirm({
        ...trimmed,
        name: 'Drawn Signature',
        saveToLibrary,
      });
      clearDrawCanvas();
      onClose();
      return;
    }

    if (tab === 'type') {
      const clean = typedText.trim();
      if (!clean) {
        setError('Please type your name to create a signature.');
        return;
      }
      const style = TYPED_SIGNATURE_STYLES[typedStyleIdx] || TYPED_SIGNATURE_STYLES[0];
      const c = document.createElement('canvas');
      c.width = 720;
      c.height = 200;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.font = style.font;
      ctx.fillStyle = inkColor;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(clean, c.width / 2, c.height / 2);

      const trimmed = trimTransparentCanvas(c);
      c.width = 1;
      c.height = 1;
      onConfirm({
        ...trimmed,
        name: `Signature (${clean.slice(0, 16)})`,
        saveToLibrary,
      });
      onClose();
      return;
    }

    if (tab === 'upload') {
      if (!uploadedUrl) {
        setError('Please upload a signature image first.');
        return;
      }
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error('Could not read uploaded signature image.'));
          i.src = uploadedUrl;
        });

        const c = document.createElement('canvas');
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        c.width = Math.max(16, Math.round(img.naturalWidth * scale));
        c.height = Math.max(16, Math.round(img.naturalHeight * scale));
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, c.width, c.height);

        if (removeWhiteBg) {
          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (lum > 218) {
              d[i + 3] = 0;
            } else if (lum > 185) {
              d[i + 3] = Math.round(((218 - lum) / 33) * d[i + 3]);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const trimmed = trimTransparentCanvas(c);
        c.width = 1;
        c.height = 1;
        onConfirm({
          ...trimmed,
          name: 'Uploaded Signature',
          saveToLibrary,
        });
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Could not process signature image.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add Digital Signature"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
              Add Digital Signature
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close signature dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {[
              { id: 'draw' as const, label: 'Draw', icon: PenTool },
              { id: 'type' as const, label: 'Type', icon: TypeIcon },
              { id: 'upload' as const, label: 'Upload', icon: Upload },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {(tab === 'draw' || tab === 'type') && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Ink:
                </span>
                {INK_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setInkColor(c.hex)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                      inkColor === c.hex
                        ? 'scale-110 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              {tab === 'draw' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Tip:
                  </span>
                  <input
                    type="range"
                    min={1.5}
                    max={5}
                    step={0.5}
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-20 accent-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={clearDrawCanvas}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'draw' && (
            <div className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={640}
                height={220}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-44 touch-none cursor-crosshair block"
              />
              {!hasDrawing && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                  Draw your signature here using mouse, trackpad, or finger
                </div>
              )}
            </div>
          )}

          {tab === 'type' && (
            <div className="space-y-3">
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type your full name (e.g. Amit Sharma)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="grid grid-cols-3 gap-2">
                {TYPED_SIGNATURE_STYLES.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTypedStyleIdx(idx)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer bg-white ${
                      typedStyleIdx === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div
                      className="text-lg truncate"
                      style={{
                        color: inkColor,
                        fontStyle: 'italic',
                        fontFamily:
                          idx === 0
                            ? "'Brush Script MT', 'Segoe Script', cursive"
                            : idx === 1
                            ? "Georgia, 'Times New Roman', serif"
                            : "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                    >
                      {typedText.trim() || 'Your Name'}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-1">{st.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/50 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Choose PNG or JPG Signature Image
                </span>
                <span className="text-[11px] text-slate-500">
                  Works best with dark ink on white paper or transparent PNG
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleUploadFile}
                  className="hidden"
                />
              </label>

              {uploadedUrl && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white flex flex-col items-center gap-2">
                  <img
                    src={uploadedUrl}
                    alt="Uploaded signature preview"
                    className="max-h-24 object-contain"
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={removeWhiteBg}
                      onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Make white paper background transparent</span>
                  </label>
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Save to Reusable Assets Library for this editing session</span>
          </label>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
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
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insert Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
