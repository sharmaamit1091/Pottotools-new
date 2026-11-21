import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { ToolDefinition } from '../../config/toolsRegistry';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { RecommendedNextTools } from './RecommendedNextTools';
import { triggerDownload, formatBytes } from '../../services/utils/downloadUtils';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';
import {
  EyeOff,
  Undo2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  ShieldCheck,
  WifiOff,
  ScanSearch,
  Square,
  Eraser,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  Lock,
} from 'lucide-react';

// Ensure local worker path for 100% offline compatibility
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch {
    // Worker already set
  }
}

export type RedactionMode = 'blackout' | 'whiteout' | 'blur';

export interface RedactionBox {
  id: string;
  page: number; // 1-indexed
  x: number; // normalized [0..1]
  y: number; // normalized [0..1]
  w: number; // normalized [0..1]
  h: number; // normalized [0..1]
  mode: RedactionMode;
  label?: string;
}

interface PdfRedactorToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

const SENSITIVE_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: 'Aadhaar / VID', regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}(?:[\s-]?\d{4})?\b/ },
  { label: 'PAN Card', regex: /\b[A-Z]{5}\d{4}[A-Z]\b/i },
  { label: 'IFSC Code', regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/i },
  { label: 'Bank Account', regex: /\b\d{9,18}\b/ },
  { label: 'Salary / Amount', regex: /(?:₹|Rs\.?|INR|\$)\s?[\d,]+(?:\.\d{1,2})?/i },
  { label: 'Phone', regex: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/ },
];

export const PdfRedactorTool: React.FC<PdfRedactorToolProps> = ({ tool, onSelectNextTool }) => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'pdf' | 'image' | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeMode, setActiveMode] = useState<RedactionMode>('blackout');

  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [draftBox, setDraftBox] = useState<Omit<RedactionBox, 'id' | 'page'> | null>(null);

  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [isScanningText, setIsScanningText] = useState<boolean>(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [outputResult, setOutputResult] = useState<{
    blob: Blob;
    filename: string;
    redactedCount: number;
    mimeType: string;
  } | null>(null);

  // Underlying media refs
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const imageElemRef = useRef<HTMLImageElement | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  // Display canvas & pointer tracking
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cleanPageImageRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const cleanupMedia = useCallback(() => {
    if (pdfDocRef.current) {
      try {
        const doc = pdfDocRef.current as pdfjsLib.PDFDocumentProxy & { destroy?: () => Promise<void> };
        doc.destroy?.();
      } catch {
        // Ignore cleanup errors
      }
      pdfDocRef.current = null;
    }
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    imageElemRef.current = null;
    cleanPageImageRef.current = null;
  }, []);

  useEffect(() => {
    return () => cleanupMedia();
  }, [cleanupMedia]);

  // Apply pixelated/mosaic blur directly onto target canvas region
  const applyPixelBlur = (
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ) => {
    const safeX = Math.max(0, Math.floor(rx));
    const safeY = Math.max(0, Math.floor(ry));
    const safeW = Math.max(4, Math.min(ctx.canvas.width - safeX, Math.ceil(rw)));
    const safeH = Math.max(4, Math.min(ctx.canvas.height - safeY, Math.ceil(rh)));
    if (safeW <= 0 || safeH <= 0) return;

    const blockSize = Math.max(8, Math.round(Math.min(safeW, safeH) / 4));
    const tinyW = Math.max(2, Math.floor(safeW / blockSize));
    const tinyH = Math.max(2, Math.floor(safeH / blockSize));

    const offscreen = document.createElement('canvas');
    offscreen.width = tinyW;
    offscreen.height = tinyH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.imageSmoothingEnabled = true;
    offCtx.drawImage(ctx.canvas, safeX, safeY, safeW, safeH, 0, 0, tinyW, tinyH);

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0, tinyW, tinyH, safeX, safeY, safeW, safeH);
    ctx.imageSmoothingEnabled = prevSmoothing;
  };

  // Burn a list of boxes onto any destination 2D canvas
  const drawRedactionsOnCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      pageBoxes: RedactionBox[],
      highlightSelectedId?: string | null
    ) => {
      const W = ctx.canvas.width;
      const H = ctx.canvas.height;

      for (const box of pageBoxes) {
        const px = box.x * W;
        const py = box.y * H;
        const pw = box.w * W;
        const ph = box.h * H;

        if (box.mode === 'blackout') {
          ctx.fillStyle = '#09090b';
          ctx.fillRect(px, py, pw, ph);
        } else if (box.mode === 'whiteout') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, pw, ph);
        } else if (box.mode === 'blur') {
          applyPixelBlur(ctx, px, py, pw, ph);
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, pw, ph);
        }

        if (highlightSelectedId && box.id === highlightSelectedId) {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
          ctx.restore();
        }
      }
    },
    []
  );

  // Redraw preview canvas from clean rendered cache + active boxes + draft
  const paintOverlayPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const clean = cleanPageImageRef.current;
    if (!canvas || !clean) return;

    if (canvas.width !== clean.width || canvas.height !== clean.height) {
      canvas.width = clean.width;
      canvas.height = clean.height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(clean, 0, 0);

    const pageBoxes = boxes.filter((b) => b.page === currentPage);
    drawRedactionsOnCanvas(ctx, pageBoxes, selectedBoxId);

    if (draftBox && draftBox.w > 0.002 && draftBox.h > 0.002) {
      const px = draftBox.x * canvas.width;
      const py = draftBox.y * canvas.height;
      const pw = draftBox.w * canvas.width;
      const ph = draftBox.h * canvas.height;

      ctx.save();
      ctx.fillStyle =
        draftBox.mode === 'whiteout'
          ? 'rgba(255, 255, 255, 0.78)'
          : draftBox.mode === 'blur'
          ? 'rgba(15, 23, 42, 0.38)'
          : 'rgba(9, 9, 11, 0.72)';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.restore();
    }
  }, [boxes, currentPage, selectedBoxId, draftBox, drawRedactionsOnCanvas]);

  useEffect(() => {
    paintOverlayPreview();
  }, [paintOverlayPreview]);

  // Render active PDF page or Image into clean offscreen cache then paint
  const renderPageToPreview = useCallback(
    async (pageNum: number) => {
      setIsLoadingDoc(true);
      setErrorMsg(null);
      try {
        const cleanCanvas = document.createElement('canvas');
        const ctx = cleanCanvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable.');

        if (sourceType === 'pdf' && pdfDocRef.current) {
          const page = await pdfDocRef.current.getPage(pageNum);
          const baseVp = page.getViewport({ scale: 1 });
          const targetWidth = 1120;
          const scale = Math.min(2.2, Math.max(1.25, targetWidth / Math.max(1, baseVp.width)));
          const viewport = page.getViewport({ scale });

          cleanCanvas.width = Math.round(viewport.width);
          cleanCanvas.height = Math.round(viewport.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);

          // @ts-expect-error pdfjs typing compatibility
          await page.render({ canvasContext: ctx, viewport }).promise;
        } else if (sourceType === 'image' && imageElemRef.current) {
          const img = imageElemRef.current;
          cleanCanvas.width = img.naturalWidth || img.width || 1000;
          cleanCanvas.height = img.naturalHeight || img.height || 700;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);
          ctx.drawImage(img, 0, 0, cleanCanvas.width, cleanCanvas.height);
        }

        cleanPageImageRef.current = cleanCanvas;
        paintOverlayPreview();
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Could not render this document page cleanly.'
        );
      } finally {
        setIsLoadingDoc(false);
      }
    },
    [sourceType, paintOverlayPreview]
  );

  useEffect(() => {
    if (sourceFile && sourceType) {
      renderPageToPreview(currentPage);
    }
  }, [sourceFile, sourceType, currentPage, renderPageToPreview]);

  const loadFile = useCallback(
    async (file: File) => {
      cleanupMedia();
      setErrorMsg(null);
      setScanNotice(null);
      setOutputResult(null);
      setBoxes([]);
      setSelectedBoxId(null);
      setCurrentPage(1);

      const lower = file.name.toLowerCase();
      const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf');
      const isImage =
        file.type.startsWith('image/') ||
        /\.(jpg|jpeg|png|webp|bmp)$/i.test(lower);

      if (!isPdf && !isImage) {
        setErrorMsg('Please upload a PDF document or an image ID scan (JPG, PNG, WebP).');
        return;
      }

      setIsLoadingDoc(true);
      try {
        if (isPdf) {
          const buffer = await file.arrayBuffer();
          const task = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
          const doc = await task.promise;
          pdfDocRef.current = doc;
          setTotalPages(doc.numPages);
          setSourceFile(file);
          setSourceType('pdf');
        } else {
          const url = URL.createObjectURL(file);
          imageUrlRef.current = url;
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error('Failed to load image file.'));
            el.src = url;
          });
          imageElemRef.current = img;
          setTotalPages(1);
          setSourceFile(file);
          setSourceType('image');
        }
      } catch (err) {
        cleanupMedia();
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Could not open this file. Make sure it is not password-locked or corrupted.'
        );
        setIsLoadingDoc(false);
      }
    },
    [cleanupMedia]
  );

  // Auto-consume staged file dropped on homepage Magic Tool Box
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged) {
      clearStagedFileForTool();
      loadFile(staged);
    }
  }, [loadFile]);

  // Generate an offline fictional demo salary slip + ID card PNG for instant zero-risk testing
  const handleLoadSampleDemo = async () => {
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 1000;
    demoCanvas.height = 660;
    const ctx = demoCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 660);

    // Header band
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('SAMPLE PAY SLIP & KYC VERIFICATION (DEMO ONLY)', 42, 55);

    // Watermark diagonal
    ctx.save();
    ctx.translate(500, 360);
    ctx.rotate(-0.22);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAMPLE DEMO DOC', 0, 0);
    ctx.restore();

    // Document card rows
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 120, 916, 480);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Employee Name:', 75, 175);
    ctx.fillText('Aadhaar / ID Number:', 75, 245);
    ctx.fillText('Bank Account No.:', 75, 315);
    ctx.fillText('IFSC Branch Code:', 75, 385);
    ctx.fillText('Net Monthly Salary:', 75, 455);
    ctx.fillText('PAN Tax Number:', 75, 525);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('AARAV SHARMA (SAMPLE)', 360, 175);
    ctx.fillStyle = '#dc2626';
    ctx.fillText('9999 8888 7777', 360, 245);
    ctx.fillText('0048102000091827', 360, 315);
    ctx.fillText('DEMO0001234', 360, 385);
    ctx.fillText('₹ 84,500.00 / Month', 360, 455);
    ctx.fillText('ABCDE1234F', 360, 525);

    ctx.fillStyle = '#64748b';
    ctx.font = '15px sans-serif';
    ctx.fillText('Tip: Drag rectangles over the red numbers or switch mask styles (Blackout / Whiteout / Blur).', 75, 575);

    const blob = await new Promise<Blob | null>((res) =>
      demoCanvas.toBlob(res, 'image/png')
    );
    if (blob) {
      const sampleFile = new File([blob], 'sample-salary-aadhaar-demo.png', {
        type: 'image/png',
      });
      await loadFile(sampleFile);
    }
  };

  // Pointer coordinates normalized [0..1]
  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(1, rect.height)));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isLoadingDoc) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getNormalizedPoint(e);

    // Check if user clicked inside an existing box on current page (top-most first)
    const pageBoxes = boxes.filter((b) => b.page === currentPage);
    for (let i = pageBoxes.length - 1; i >= 0; i--) {
      const b = pageBoxes[i];
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) {
        setSelectedBoxId(b.id);
        dragStartRef.current = null;
        return;
      }
    }

    setSelectedBoxId(null);
    dragStartRef.current = pt;
    setDraftBox({ x: pt.x, y: pt.y, w: 0, h: 0, mode: activeMode });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStartRef.current) return;
    const pt = getNormalizedPoint(e);
    const start = dragStartRef.current;
    setDraftBox({
      x: Math.min(start.x, pt.x),
      y: Math.min(start.y, pt.y),
      w: Math.abs(pt.x - start.x),
      h: Math.abs(pt.y - start.y),
      mode: activeMode,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!dragStartRef.current || !draftBox) {
      dragStartRef.current = null;
      setDraftBox(null);
      return;
    }
    dragStartRef.current = null;

    if (draftBox.w > 0.008 && draftBox.h > 0.008) {
      const newBox: RedactionBox = {
        id: `box_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        page: currentPage,
        ...draftBox,
      };
      setBoxes((prev) => [...prev, newBox]);
      setSelectedBoxId(newBox.id);
    }
    setDraftBox(null);
  };

  // Keyboard delete shortcut for selected box
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBoxId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setBoxes((prev) => prev.filter((b) => b.id !== selectedBoxId));
        setSelectedBoxId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBoxId]);

  const handleUndo = () => {
    setBoxes((prev) => {
      const idx = [...prev].reverse().findIndex((b) => b.page === currentPage);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const next = [...prev];
      const removed = next.splice(realIdx, 1)[0];
      if (removed && removed.id === selectedBoxId) {
        setSelectedBoxId(null);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedBoxId) return;
    setBoxes((prev) => prev.filter((b) => b.id !== selectedBoxId));
    setSelectedBoxId(null);
  };

  const handleClearPage = () => {
    setBoxes((prev) => prev.filter((b) => b.page !== currentPage));
    setSelectedBoxId(null);
  };

  // Client-side Smart Scan on active PDF page (detects Aadhaar / PAN / Bank / Salary patterns locally)
  const handleAutoDetectPage = async () => {
    if (sourceType !== 'pdf' || !pdfDocRef.current) {
      setScanNotice('Auto-Detect scans selectable text PDFs. For image scans, simply drag boxes over sensitive details.');
      return;
    }

    setIsScanningText(true);
    setScanNotice(null);
    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();

      if (!textContent.items || textContent.items.length === 0) {
        setScanNotice('This page is a scanned image without embedded text. Drag boxes directly over sensitive info.');
        return;
      }

      const detected: RedactionBox[] = [];
      for (const item of textContent.items as Array<{
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
      }>) {
        const text = (item.str || '').trim();
        if (!text || !item.transform) continue;

        const match = SENSITIVE_PATTERNS.find((p) => p.regex.test(text));
        if (!match) continue;

        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontHeight = Math.max(10, Math.hypot(tx[2], tx[3]) || item.height || 12);
        const itemWidth = Math.max(24, (item.width || text.length * 6) * (viewport.scale || 1));

        const padX = 4;
        const padY = 3;
        const left = Math.max(0, (tx[4] - padX) / viewport.width);
        const top = Math.max(0, (tx[5] - fontHeight - padY) / viewport.height);
        const normW = Math.min(1 - left, (itemWidth + padX * 2) / viewport.width);
        const normH = Math.min(1 - top, (fontHeight + padY * 2) / viewport.height);

        detected.push({
          id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          page: currentPage,
          x: left,
          y: top,
          w: Math.max(0.02, normW),
          h: Math.max(0.015, normH),
          mode: activeMode,
          label: match.label,
        });
      }

      if (detected.length === 0) {
        setScanNotice(
          'No standalone Aadhaar, PAN, IFSC, or account strings matched on this page (they may be image scans or split across spans). Drag boxes manually to mask.'
        );
      } else {
        setBoxes((prev) => [...prev, ...detected]);
        setScanNotice(
          `Found and masked ${detected.length} sensitive item(s) on Page ${currentPage}. Review the boxes before exporting.`
        );
      }
    } catch {
      setScanNotice('Could not scan embedded text on this page. Drag boxes manually over info to hide.');
    } finally {
      setIsScanningText(false);
    }
  };

  // Burn permanent redactions across ALL pages / full-res image and export flattened output
  const handleApplyPermanentRedaction = async () => {
    if (!sourceFile || !sourceType) return;
    if (boxes.length === 0) {
      setErrorMsg('Please draw at least one redaction box over the info you want to hide first.');
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setStatusText('Burning permanent redactions locally in browser...');
    setErrorMsg(null);

    try {
      const baseName = sourceFile.name.replace(/\.[^.]+$/, '');

      if (sourceType === 'image' && imageElemRef.current) {
        const img = imageElemRef.current;
        const outCanvas = document.createElement('canvas');
        outCanvas.width = img.naturalWidth || img.width;
        outCanvas.height = img.naturalHeight || img.height;
        const ctx = outCanvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context error.');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
        ctx.drawImage(img, 0, 0, outCanvas.width, outCanvas.height);

        setProgress(50);
        const pageBoxes = boxes.filter((b) => b.page === 1);
        drawRedactionsOnCanvas(ctx, pageBoxes);

        setStatusText('Stripping EXIF metadata & flattening image...');
        setProgress(85);

        const isJpg = /\.(jpg|jpeg)$/i.test(sourceFile.name);
        const mime = isJpg ? 'image/jpeg' : 'image/png';
        const ext = isJpg ? 'jpg' : 'png';

        const blob = await new Promise<Blob>((resolve, reject) => {
          outCanvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Failed to encode flattened image.'))),
            mime,
            0.94
          );
        });

        setProgress(100);
        setOutputResult({
          blob,
          filename: `${baseName}-redacted.${ext}`,
          redactedCount: pageBoxes.length,
          mimeType: mime,
        });
      } else if (sourceType === 'pdf' && pdfDocRef.current) {
        const doc = pdfDocRef.current;
        const outPdf = await PDFDocument.create();
        outPdf.setTitle('');
        outPdf.setAuthor('');
        outPdf.setSubject('');
        outPdf.setCreator('PottoTools Offline Redactor');
        outPdf.setProducer('PottoTools Offline Redactor');

        for (let i = 1; i <= doc.numPages; i++) {
          setStatusText(`Flattening & destroying hidden text on page ${i} of ${doc.numPages}...`);
          const page = await doc.getPage(i);
          const origVp = page.getViewport({ scale: 1 });
          const renderScale = 2.0;
          const vp = page.getViewport({ scale: renderScale });

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = Math.round(vp.width);
          pageCanvas.height = Math.round(vp.height);
          const ctx = pageCanvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context error.');

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

          // @ts-expect-error pdfjs typing compatibility
          await page.render({ canvasContext: ctx, viewport: vp }).promise;

          const pageBoxes = boxes.filter((b) => b.page === i);
          if (pageBoxes.length > 0) {
            drawRedactionsOnCanvas(ctx, pageBoxes);
          }

          const jpgBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
            pageCanvas.toBlob(
              (b) => {
                if (!b) reject(new Error(`Failed to flatten page ${i}`));
                else b.arrayBuffer().then(resolve).catch(reject);
              },
              'image/jpeg',
              0.93
            );
          });

          const embeddedImg = await outPdf.embedJpg(jpgBytes);
          const pdfPage = outPdf.addPage([origVp.width, origVp.height]);
          pdfPage.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: origVp.width,
            height: origVp.height,
          });

          setProgress(10 + Math.round((i / doc.numPages) * 82));
        }

        setStatusText('Assembling clean redacted PDF...');
        const pdfBytes = await outPdf.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        setProgress(100);
        setOutputResult({
          blob,
          filename: `${baseName}-redacted.pdf`,
          redactedCount: boxes.length,
          mimeType: 'application/pdf',
        });
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to apply permanent redaction.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCurrentPagePng = async () => {
    const clean = cleanPageImageRef.current;
    if (!clean || !sourceFile) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = clean.width;
    exportCanvas.height = clean.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(clean, 0, 0);
    const pageBoxes = boxes.filter((b) => b.page === currentPage);
    drawRedactionsOnCanvas(ctx, pageBoxes);

    const blob = await new Promise<Blob | null>((res) =>
      exportCanvas.toBlob(res, 'image/png')
    );
    if (blob) {
      const baseName = sourceFile.name.replace(/\.[^.]+$/, '');
      triggerDownload(blob, `${baseName}-page-${currentPage}-redacted.png`);
    }
  };

  const handleReset = () => {
    cleanupMedia();
    setSourceFile(null);
    setSourceType(null);
    setBoxes([]);
    setSelectedBoxId(null);
    setOutputResult(null);
    setScanNotice(null);
    setErrorMsg(null);
    setCurrentPage(1);
    setTotalPages(1);
  };

  const currentPageBoxes = boxes.filter((b) => b.page === currentPage);

  return (
    <div className="space-y-8">
      {/* Main Interactive Redactor Surface */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Top Guarantee Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>100% Offline Engine</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>0 KB Uploaded · Permanent Pixel Flatten</span>
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Supports PDF, JPG, PNG &amp; WebP
          </span>
        </div>

        {!sourceFile ? (
          /* Upload + Sample Demo View */
          <div className="space-y-5">
            <FileUploadZone
              acceptedFormats={['.pdf', 'application/pdf', '.jpg', '.jpeg', '.png', '.webp', 'image/*']}
              maxFileSizeMB={100}
              multiple={false}
              files={[]}
              onFilesSelected={(selected) => {
                if (selected[0]) loadFile(selected[0]);
              }}
              onRemoveFile={() => {}}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="text-left space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Want to test before uploading your real ID or bank PDF?</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Load a generated sample salary &amp; Aadhaar slip locally to test Blackout, Whiteout, and Pixel Blur.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleDemo}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Try Sample ID / Salary Slip</span>
              </button>
            </div>
          </div>
        ) : outputResult ? (
          /* Permanent Redaction Completed View */
          <div className="py-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Permanent Redaction Applied!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Masked <strong>{outputResult.redactedCount} sensitive region(s)</strong> and permanently flattened hidden text &amp; metadata on your device. Underlying numbers cannot be copied, selected, or uncovered.
              </p>
            </div>

            <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="truncate font-semibold text-slate-800 dark:text-slate-200 pr-2">
                {outputResult.filename}
              </span>
              <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-bold">
                {formatBytes(outputResult.blob.size)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => triggerDownload(outputResult.blob, outputResult.filename)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Clean {sourceType === 'pdf' ? 'PDF' : 'Image'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputResult(null)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <EyeOff className="w-4 h-4" />
                <span>Adjust Masks</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>New File</span>
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Canvas Editor Workspace */
          <div className="space-y-4">
            {/* File bar + Replace button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {sourceFile.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatBytes(sourceFile.size)} · {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} · {boxes.length} Mask{boxes.length === 1 ? '' : 's'} Placed
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Change File</span>
              </button>
            </div>

            {/* Editing Toolbar: Mask Style + Edit Actions + Auto Scan */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              {/* Mask Style Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                  Style:
                </span>
                {(
                  [
                    { id: 'blackout', label: 'Blackout', swatch: 'bg-zinc-950 border-zinc-700' },
                    { id: 'whiteout', label: 'Whiteout', swatch: 'bg-white border-slate-300' },
                    { id: 'blur', label: 'Pixel Blur', swatch: 'bg-gradient-to-br from-slate-400 to-slate-600 border-slate-500' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMode(m.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      activeMode === m.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-xs border ${m.swatch}`} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Box Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                {sourceType === 'pdf' && (
                  <button
                    type="button"
                    onClick={handleAutoDetectPage}
                    disabled={isScanningText || isLoadingDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
                    title="Auto-detect Aadhaar, PAN, IFSC, Phone & Salary figures in text PDFs"
                  >
                    <ScanSearch className="w-3.5 h-3.5" />
                    <span>{isScanningText ? 'Scanning...' : 'Auto-Mask IDs'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={currentPageBoxes.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>

                {selectedBoxId && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Box</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearPage}
                  disabled={currentPageBoxes.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear Page</span>
                </button>
              </div>
            </div>

            {/* Instruction & Scan Feedback */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Click and drag anywhere on the document below to draw a permanent mask over Aadhaar, Bank, PAN, or Salary details. Tap any existing box to select &amp; delete it.
                </span>
              </span>
              {currentPageBoxes.length > 0 && (
                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  {currentPageBoxes.length} box{currentPageBoxes.length === 1 ? '' : 'es'} on page {currentPage}
                </span>
              )}
            </div>

            {scanNotice && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 text-xs text-blue-900 dark:text-blue-200">
                {scanNotice}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Page Navigation (when multi-page PDF) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBoxId(null);
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={currentPage <= 1 || isLoadingDoc}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBoxId(null);
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={currentPage >= totalPages || isLoadingDoc}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Interactive Canvas Stage */}
            <div className="relative rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[300px]">
              {isLoadingDoc && (
                <div className="absolute inset-0 z-10 bg-white/75 dark:bg-slate-950/75 flex items-center justify-center rounded-2xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-md">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering page locally...</span>
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="max-w-full h-auto rounded-lg shadow-md border border-slate-300/70 dark:border-slate-700 cursor-crosshair touch-none select-none bg-white"
                style={{ maxHeight: '72vh', width: 'auto' }}
              />
            </div>

            {isProcessing && <ProgressBar progress={progress} statusText={statusText} />}

            {/* Final Export Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleApplyPermanentRedaction}
                disabled={isProcessing || boxes.length === 0}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <EyeOff className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Applying Permanent Redaction...'
                    : `Apply Permanent Redaction (${boxes.length} Box${boxes.length === 1 ? '' : 'es'})`}
                </span>
              </button>

              {sourceType === 'pdf' && (
                <button
                  type="button"
                  onClick={handleDownloadCurrentPagePng}
                  disabled={isProcessing || isLoadingDoc}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Save This Page as PNG</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Suggestions */}
      {outputResult && onSelectNextTool && (
        <RecommendedNextTools currentToolId="pdf-id-redactor" onSelectTool={onSelectNextTool} />
      )}

      <AdPlaceholder format="tool-bottom" />
    </div>
  );
};
