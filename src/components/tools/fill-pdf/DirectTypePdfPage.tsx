import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Eraser, GripVertical, Minus, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  DetectedFormSlot,
  DetectedInteractiveField,
  PageMetaInfo,
  PdfTextSpanBox,
  TextFormElement,
  WhiteoutPatch,
} from '../../../types/fillPdfForm';
import { renderFormPdfPageToCanvas } from '../../../services/pdf/fillPdfFormService';
import {
  AnalyzedPageLayout,
  analyzePageFormLayout,
  sampleBackgroundColorOnCanvas,
} from '../../../services/pdf/smartFormLayoutDetector';

export const INK_COLORS = [
  { hex: '#111827', label: 'Black' },
  { hex: '#1d4ed8', label: 'Blue' },
  { hex: '#0f2557', label: 'Navy' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#15803d', label: 'Green' },
] as const;

export interface SelectedPdfRegion {
  pageNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  matchedSpanIds: string[];
  selectedText: string;
}

interface DirectTypePdfPageProps {
  pdfJsDoc: any;
  pageMeta: PageMetaInfo;
  totalPages: number;
  zoom: number;
  layout?: AnalyzedPageLayout;
  textEntries: TextFormElement[];
  whiteoutPatches: WhiteoutPatch[];
  interactiveFields: DetectedInteractiveField[];
  interactiveValues: Record<string, string | boolean>;
  activeEntryId: string | null;
  activeSelection: SelectedPdfRegion | null;
  registerTextareaRef: (id: string, node: HTMLTextAreaElement | null) => void;
  registerInteractiveRef: (id: string, node: HTMLElement | null) => void;
  registerPageRef: (pageNum: number, node: HTMLDivElement | null) => void;
  onPageLayoutAnalyzed: (pageNum: number, layout: AnalyzedPageLayout) => void;
  onClickBlankPage: (pageNum: number, normX: number, normY: number) => void;
  onClickSlot: (slot: DetectedFormSlot) => void;
  onSelectPdfRegion: (region: SelectedPdfRegion | null) => void;
  onEraseSelectedRegion: (
    region: SelectedPdfRegion,
    fillColor: string,
    replacementInitialText?: string
  ) => void;
  onFocusEntry: (id: string) => void;
  onBlurEntry: (id: string) => void;
  onChangeEntryText: (
    id: string,
    text: string,
    measuredWidthNorm: number,
    measuredHeightNorm: number
  ) => void;
  onUpdateEntryStyle: (
    id: string,
    patch: Partial<Pick<TextFormElement, 'fontSize' | 'color'>>
  ) => void;
  onMoveEntry: (id: string, normX: number, normY: number, isStart?: boolean) => void;
  onDeleteEntry: (id: string) => void;
  onNavigateField: (currentTargetId: string, direction: 1 | -1) => void;
  onNavigateTableDown: (entry: TextFormElement) => void;
  onInteractiveFieldChange: (
    fieldName: string,
    value: string | boolean,
    recordUndo?: boolean
  ) => void;
}

const FONT_STACK = "Helvetica, Arial, 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif";

/**
 * Deterministic visual font-size auto-fit matching exportFilledPdf's bounded-box logic
 * so long values in table cells or tight inline fields wrap cleanly and never overflow neighbors.
 */
function computeFittedFontSizePt(
  text: string,
  baseFontSize: number,
  boxWidthPt: number,
  boxHeightPt: number,
  isTableCell: boolean
): number {
  if (!text || text.length <= 2) return baseFontSize;
  const availW = Math.max(10, boxWidthPt - 4);
  const availH = Math.max(8, boxHeightPt - 2);
  let fs = baseFontSize;

  const countWrappedLines = (sizePt: number): number => {
    const charsPerLine = Math.max(1, Math.floor(availW / (sizePt * 0.54)));
    let totalLines = 0;
    const paragraphs = text.split(/\r?\n/);
    for (const para of paragraphs) {
      if (!para) {
        totalLines += 1;
        continue;
      }
      const words = para.split(/\s+/);
      let lineLen = 0;
      let linesInPara = 1;
      for (const word of words) {
        if (word.length > charsPerLine) {
          if (lineLen > 0) {
            linesInPara += 1;
            lineLen = 0;
          }
          const extra = Math.ceil(word.length / charsPerLine);
          linesInPara += Math.max(0, extra - 1);
          lineLen = word.length % charsPerLine || charsPerLine;
        } else if (lineLen === 0) {
          lineLen = word.length;
        } else if (lineLen + 1 + word.length <= charsPerLine) {
          lineLen += 1 + word.length;
        } else {
          linesInPara += 1;
          lineLen = word.length;
        }
      }
      totalLines += linesInPara;
    }
    return totalLines;
  };

  if (isTableCell) {
    while (fs > 6.5) {
      const lines = countWrappedLines(fs);
      if (lines * (fs * 1.24) <= availH) break;
      fs = Number((fs - 0.5).toFixed(1));
    }
    return Math.max(6.5, fs);
  }

  // Inline bounded slot (e.g. Years / Months / Days / Date / Month / Year):
  // shrink gently so single-line entries stay on their line without overflowing into sibling labels
  while (fs > 7) {
    const lines = countWrappedLines(fs);
    if (lines <= 1 || lines * (fs * 1.24) <= availH * 1.15) break;
    fs = Number((fs - 0.5).toFixed(1));
  }
  return Math.max(7, fs);
}

/**
 * Given a double-clicked or long-pressed printed span, expand horizontally across adjacent
 * non-label words on the same line (stopping at wide gaps or label colons) so placeholder
 * phrases like "Write your name here." select as one clean unit.
 */
function expandContiguousPhrase(
  anchor: PdfTextSpanBox,
  allSpans: PdfTextSpanBox[]
): PdfTextSpanBox[] {
  const sameLine = allSpans
    .filter(
      (s) =>
        Math.abs((s.y + s.height / 2) - (anchor.y + anchor.height / 2)) <=
        Math.max(anchor.height * 0.75, 0.011)
    )
    .sort((a, b) => a.x - b.x);

  const idx = sameLine.findIndex((s) => s.id === anchor.id);
  if (idx === -1) return [anchor];

  const maxWordGap = Math.max(0.018, anchor.height * 1.25);
  let start = idx;
  let end = idx;

  // Expand left while words are close together and previous word is not a label ending with ":"
  while (start > 0) {
    const prev = sameLine[start - 1];
    const curr = sameLine[start];
    const gap = curr.x - (prev.x + prev.width);
    if (gap > maxWordGap || /:$/.test(prev.text.trim())) break;
    start -= 1;
  }

  // Expand right while words are close together and current word is not a label ending with ":"
  while (end < sameLine.length - 1) {
    const curr = sameLine[end];
    const next = sameLine[end + 1];
    const gap = next.x - (curr.x + curr.width);
    if (gap > maxWordGap || /:$/.test(curr.text.trim())) break;
    end += 1;
  }

  return sameLine.slice(start, end + 1);
}

/**
 * Build a clean erase rectangle from selected digital text spans (tightly hugging the ink
 * and slightly inset at the bottom so underlines/table borders beneath remain intact).
 */
function buildSelectionFromSpans(
  pageNum: number,
  spans: PdfTextSpanBox[]
): SelectedPdfRegion {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of spans) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.width);
    maxY = Math.max(maxY, s.y + s.height);
  }

  const padX = 0.002;
  const padTop = 0.001;
  // Slightly trim bottom so horizontal underlines right underneath text are preserved
  const trimBottom = Math.min(0.0025, (maxY - minY) * 0.1);

  const x = Math.max(0.002, minX - padX);
  const y = Math.max(0.002, minY - padTop);
  const width = Math.min(1 - x - 0.002, Math.max(0.01, maxX - minX + padX * 2));
  const height = Math.min(1 - y - 0.002, Math.max(0.01, maxY - minY + padTop - trimBottom));

  const sortedText = [...spans]
    .sort((a, b) => (Math.abs(a.y - b.y) > 0.01 ? a.y - b.y : a.x - b.x))
    .map((s) => s.text)
    .join(' ');

  return {
    pageNum,
    x,
    y,
    width,
    height,
    matchedSpanIds: spans.map((s) => s.id),
    selectedText: sortedText,
  };
}

export const DirectTypePdfPage: React.FC<DirectTypePdfPageProps> = ({
  pdfJsDoc,
  pageMeta,
  totalPages,
  zoom,
  layout,
  textEntries,
  whiteoutPatches,
  interactiveFields,
  interactiveValues,
  activeEntryId,
  activeSelection,
  registerTextareaRef,
  registerInteractiveRef,
  registerPageRef,
  onPageLayoutAnalyzed,
  onClickBlankPage,
  onClickSlot,
  onSelectPdfRegion,
  onEraseSelectedRegion,
  onFocusEntry,
  onBlurEntry,
  onChangeEntryText,
  onUpdateEntryStyle,
  onMoveEntry,
  onDeleteEntry,
  onNavigateField,
  onNavigateTableDown,
  onInteractiveFieldChange,
}) => {
  const { pageNum, baseWidth, baseHeight } = pageMeta;
  const cssWidth = Math.max(140, Math.round(baseWidth * zoom));
  const cssHeight = Math.max(140, Math.round(baseHeight * zoom));

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const analyzedDocRef = useRef<any>(null);

  const [isVisible, setIsVisible] = useState<boolean>(pageNum <= 2);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  // Live drag-selection marquee state (normalized 0..1 coordinates)
  const [dragMarquee, setDragMarquee] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const selectDragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startNormX: number;
    startNormY: number;
    stageLeft: number;
    stageTop: number;
    stageW: number;
    stageH: number;
    isDragging: boolean;
  } | null>(null);

  // Guard so finishing a drag-selection or long-press does NOT also trigger click-to-type
  const suppressNextClickRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Drag state for gentle repositioning of an active typed text entry via its grip handle
  const entryDragRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    stageW: number;
    stageH: number;
    moved: boolean;
  } | null>(null);

  // Track which interactive field has already recorded an undo snapshot during current focus
  const interactiveFocusCapturedRef = useRef<Set<string>>(new Set());

  // Lazy visibility observer so multi-page PDFs stay fast and responsive
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisible(true);
        }
      },
      { rootMargin: '700px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Render crisp high-DPI PDF page onto canvas whenever visible or zoom changes
  useEffect(() => {
    if (!isVisible || !pdfJsDoc || !canvasRef.current) return;
    let cancelled = false;

    const render = async () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      try {
        await renderFormPdfPageToCanvas(
          pdfJsDoc,
          pageNum,
          canvas,
          zoom * dpr,
          0,
          (task) => {
            renderTaskRef.current = task;
          }
        );
        if (cancelled) return;
        setIsRendered(true);

        // Run smart layout detection (tables + inline blanks + text spans) once per loaded document page
        if (analyzedDocRef.current !== pdfJsDoc) {
          analyzedDocRef.current = pdfJsDoc;
          try {
            const analyzed = await analyzePageFormLayout(
              pdfJsDoc,
              pageNum,
              pageMeta,
              canvas,
              interactiveFields
            );
            if (!cancelled) {
              onPageLayoutAnalyzed(pageNum, analyzed);
            }
          } catch {
            // Non-fatal: direct click-to-type always works as fallback
          }
        }
      } catch (err: any) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [isVisible, pdfJsDoc, pageNum, zoom, pageMeta, interactiveFields, onPageLayoutAnalyzed]);

  // Clear long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Fast lookup of slots that already have a typed entry
  const occupiedSlotIds = useMemo(() => {
    const set = new Set<string>();
    for (const e of textEntries) {
      if (e.slotId) set.add(e.slotId);
    }
    return set;
  }, [textEntries]);

  // Helper to sample matching paper background color from the rendered PDF canvas
  const sampleFillColor = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) =>
      sampleBackgroundColorOnCanvas(canvasRef.current, rect),
    []
  );

  // Measure fluid textarea bounds (bounded boxes keep their exact detected slot width)
  const syncTextareaSize = useCallback(
    (textarea: HTMLTextAreaElement, entry: TextFormElement, nextText: string) => {
      if (entry.boundedBox) {
        if (entry.tableId) {
          // Table cells lock strictly inside their grid borders
          onChangeEntryText(entry.id, nextText, entry.width, entry.height);
          return;
        }
        // Inline blank slots keep their horizontal boundary so they NEVER overlap sibling labels/fields
        const minLineHeightPx = Math.ceil(entry.fontSize * 1.24 * zoom + 4 * zoom);
        const measuredH = Math.max(minLineHeightPx, textarea.scrollHeight);
        const normH = Math.max(
          entry.height,
          Math.min(1 - entry.y - 0.004, measuredH / Math.max(1, cssHeight))
        );
        onChangeEntryText(entry.id, nextText, entry.width, normH);
        return;
      }

      const container = textarea.parentElement;
      const availableWidthPx = Math.max(48, (1 - entry.x - 0.005) * cssWidth);
      const measuredW = Math.min(
        availableWidthPx,
        Math.max(container?.offsetWidth || textarea.offsetWidth, 24)
      );
      const minLineHeightPx = Math.ceil(entry.fontSize * 1.28 * zoom + 4 * zoom);
      const measuredH = Math.max(
        minLineHeightPx,
        container?.offsetHeight || textarea.scrollHeight
      );
      const normW = Math.min(1 - entry.x - 0.004, Math.max(0.05, measuredW / Math.max(1, cssWidth)));
      const normH = Math.min(1 - entry.y - 0.004, Math.max(0.02, measuredH / Math.max(1, cssHeight)));

      onChangeEntryText(entry.id, nextText, normW, normH);
    },
    [cssWidth, cssHeight, zoom, onChangeEntryText]
  );

  // Compute intersecting digital text spans inside a normalized drag marquee
  const findSpansInRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }): PdfTextSpanBox[] => {
      if (!layout || layout.textSpans.length === 0) return [];
      const rx1 = rect.x;
      const ry1 = rect.y;
      const rx2 = rect.x + rect.width;
      const ry2 = rect.y + rect.height;

      return layout.textSpans.filter((sp) => {
        const sx1 = sp.x;
        const sy1 = sp.y;
        const sx2 = sp.x + sp.width;
        const sy2 = sp.y + sp.height;
        const interX = Math.max(0, Math.min(rx2, sx2) - Math.max(rx1, sx1));
        const interY = Math.max(0, Math.min(ry2, sy2) - Math.max(ry1, sy1));
        // Span intersects meaningfully if at least 25% of its height and 15% of its width overlap
        return interX >= sp.width * 0.15 && interY >= sp.height * 0.25;
      });
    },
    [layout]
  );

  // Desktop mouse/pen drag-to-select existing PDF text or scanned regions, plus mobile long-press selection
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-form-entry="true"]') ||
      target.closest('[data-acro-field="true"]') ||
      target.closest('[data-selection-bar="true"]')
    ) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // On touch devices, preserve smooth native scrolling; use gentle long-press to select printed text to erase
    if (e.pointerType === 'touch') {
      touchStartRef.current = { x: e.clientX, y: e.clientY };
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = null;
        if (!layout) return;
        const hitSpan = layout.textSpans.find(
          (sp) =>
            normX >= sp.x - 0.008 &&
            normX <= sp.x + sp.width + 0.008 &&
            normY >= sp.y - 0.008 &&
            normY <= sp.y + sp.height + 0.008
        );
        if (hitSpan) {
          const phrase = expandContiguousPhrase(hitSpan, layout.textSpans);
          suppressNextClickRef.current = true;
          onSelectPdfRegion(buildSelectionFromSpans(pageNum, phrase));
        } else {
          // Scanned PDF fallback on long-press: select a clean local line-sized region at finger
          suppressNextClickRef.current = true;
          const rw = 0.22;
          const rh = Math.max(0.022, 18 / Math.max(1, baseHeight));
          const rx = Math.max(0.004, Math.min(1 - rw - 0.004, normX - rw * 0.25));
          const ry = Math.max(0.004, Math.min(1 - rh - 0.004, normY - rh * 0.5));
          onSelectPdfRegion({
            pageNum,
            x: rx,
            y: ry,
            width: rw,
            height: rh,
            matchedSpanIds: [],
            selectedText: '',
          });
        }
      }, 380);
      return;
    }

    // Only left-click drag starts text selection on desktop mouse/pen
    if (e.button !== 0) return;

    selectDragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startNormX: normX,
      startNormY: normY,
      stageLeft: rect.left,
      stageTop: rect.top,
      stageW: rect.width,
      stageH: rect.height,
      isDragging: false,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Cancel touch long-press if user starts scrolling
    if (e.pointerType === 'touch' && touchStartRef.current && longPressTimerRef.current !== null) {
      if (Math.hypot(e.clientX - touchStartRef.current.x, e.clientY - touchStartRef.current.y) > 8) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }

    const sess = selectDragRef.current;
    if (!sess || sess.pointerId !== e.pointerId) return;

    const travel = Math.hypot(e.clientX - sess.startClientX, e.clientY - sess.startClientY);
    if (!sess.isDragging) {
      if (travel < 7) return;
      sess.isDragging = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      // Clear any previous selection while dragging a fresh one
      onSelectPdfRegion(null);
    }

    const currNormX = Math.max(0, Math.min(1, (e.clientX - sess.stageLeft) / sess.stageW));
    const currNormY = Math.max(0, Math.min(1, (e.clientY - sess.stageTop) / sess.stageH));
    const x = Math.min(sess.startNormX, currNormX);
    const y = Math.min(sess.startNormY, currNormY);
    const width = Math.abs(currNormX - sess.startNormX);
    const height = Math.abs(currNormY - sess.startNormY);

    setDragMarquee({ x, y, width, height });
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;

    const sess = selectDragRef.current;
    if (!sess || sess.pointerId !== e.pointerId) return;
    selectDragRef.current = null;

    if (!sess.isDragging) {
      return;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Prevent the trailing click event from placing a new cursor right after finishing a drag selection
    suppressNextClickRef.current = true;
    window.setTimeout(() => {
      suppressNextClickRef.current = false;
    }, 60);

    const currNormX = Math.max(0, Math.min(1, (e.clientX - sess.stageLeft) / sess.stageW));
    const currNormY = Math.max(0, Math.min(1, (e.clientY - sess.stageTop) / sess.stageH));
    const rawRect = {
      x: Math.min(sess.startNormX, currNormX),
      y: Math.min(sess.startNormY, currNormY),
      width: Math.abs(currNormX - sess.startNormX),
      height: Math.abs(currNormY - sess.startNormY),
    };

    setDragMarquee(null);

    if (rawRect.width < 0.008 && rawRect.height < 0.008) {
      return;
    }

    // Snap tightly to digital text spans if any intersect the drag box (protects borders/lines!)
    const matchedSpans = findSpansInRect(rawRect);
    if (matchedSpans.length > 0) {
      onSelectPdfRegion(buildSelectionFromSpans(pageNum, matchedSpans));
    } else {
      // Scanned or image-only PDF: select the exact dragged rectangle
      const minH = Math.max(rawRect.height, 12 / Math.max(1, baseHeight));
      const minW = Math.max(rawRect.width, 16 / Math.max(1, baseWidth));
      onSelectPdfRegion({
        pageNum,
        x: Math.max(0.002, rawRect.x),
        y: Math.max(0.002, rawRect.y),
        width: Math.min(1 - rawRect.x - 0.002, minW),
        height: Math.min(1 - rawRect.y - 0.002, minH),
        matchedSpanIds: [],
        selectedText: '',
      });
    }
  };

  // Double-click any preprinted digital text phrase (e.g. "Write your name here.") to select it cleanly
  const handleStageDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-form-entry="true"]') ||
      target.closest('[data-acro-field="true"]') ||
      target.closest('[data-selection-bar="true"]')
    ) {
      return;
    }
    if (!layout || layout.textSpans.length === 0) return;

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const normY = (e.clientY - rect.top) / Math.max(1, rect.height);

    const hitSpan = layout.textSpans.find(
      (sp) =>
        normX >= sp.x - 0.005 &&
        normX <= sp.x + sp.width + 0.005 &&
        normY >= sp.y - 0.005 &&
        normY <= sp.y + sp.height + 0.005
    );
    if (!hitSpan) return;

    const phrase = expandContiguousPhrase(hitSpan, layout.textSpans);
    onSelectPdfRegion(buildSelectionFromSpans(pageNum, phrase));
  };

  // Direct click/tap anywhere on the PDF page immediately places a blinking cursor
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    const target = e.target as HTMLElement;
    if (
      target.closest('[data-form-entry="true"]') ||
      target.closest('[data-acro-field="true"]') ||
      target.closest('[data-selection-bar="true"]')
    ) {
      return;
    }

    // If a preprinted text selection is currently active, clicking elsewhere dismisses it cleanly first
    if (activeSelection) {
      onSelectPdfRegion(null);
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const normX = Math.max(0.004, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0.004, Math.min(0.97, (e.clientY - rect.top) / rect.height));
    onClickBlankPage(pageNum, normX, normY);
  };

  // Drag-to-nudge handler on the subtle grip handle of an active text entry
  const handleGripPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    entry: TextFormElement
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    entryDragRef.current = {
      id: entry.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: entry.x,
      origY: entry.y,
      stageW: rect.width,
      stageH: rect.height,
      moved: false,
    };
  };

  const handleGripPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const sess = entryDragRef.current;
    if (!sess) return;
    e.stopPropagation();
    const dxPx = e.clientX - sess.startClientX;
    const dyPx = e.clientY - sess.startClientY;
    if (!sess.moved && Math.hypot(dxPx, dyPx) < 2) return;

    const isFirstMove = !sess.moved;
    sess.moved = true;

    const nx = Math.max(0.004, Math.min(0.95, sess.origX + dxPx / Math.max(1, sess.stageW)));
    const ny = Math.max(0.004, Math.min(0.97, sess.origY + dyPx / Math.max(1, sess.stageH)));
    onMoveEntry(sess.id, nx, ny, isFirstMove);
  };

  const handleGripPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!entryDragRef.current) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    entryDragRef.current = null;
  };

  // Keyboard listener for active selection on this page (Backspace/Delete -> erase, printable key -> replace!)
  const pageSelection =
    activeSelection && activeSelection.pageNum === pageNum ? activeSelection : null;

  useEffect(() => {
    if (!pageSelection) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (inEditable) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onSelectPdfRegion(null);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const fill = sampleFillColor(pageSelection);
        onEraseSelectedRegion(pageSelection, fill);
        return;
      }

      // Direct replacement: typing a normal character while existing text is selected erases it & starts typing immediately!
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        e.preventDefault();
        const fill = sampleFillColor(pageSelection);
        onEraseSelectedRegion(pageSelection, fill, e.key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pageSelection, sampleFillColor, onEraseSelectedRegion, onSelectPdfRegion]);

  // Live preview of highlighted digital spans during drag
  const liveMarqueeSpans = useMemo(() => {
    if (!dragMarquee) return [];
    return findSpansInRect(dragMarquee);
  }, [dragMarquee, findSpansInRect]);

  const selectedSpanSet = useMemo(() => {
    if (!pageSelection) return null;
    return new Set(pageSelection.matchedSpanIds);
  }, [pageSelection]);

  return (
    <div
      ref={(node) => {
        wrapperRef.current = node;
        registerPageRef(pageNum, node);
      }}
      data-page-num={pageNum}
      className="flex flex-col items-center gap-2"
    >
      {/* Clean Page Paper Surface */}
      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        onDoubleClick={handleStageDoubleClick}
        onClick={handleStageClick}
        style={{ width: `${cssWidth}px`, height: `${cssHeight}px` }}
        className="relative bg-white shadow-[0_8px_28px_-12px_rgba(37,37,54,0.22)] ring-1 ring-[#DCD9EC] dark:ring-[#2E3454] select-none cursor-text"
      >
        {/* Layer 0: Rendered PDF Page Canvas */}
        <canvas
          ref={canvasRef}
          style={{ width: `${cssWidth}px`, height: `${cssHeight}px` }}
          className="block pointer-events-none"
        />

        {!isRendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-white text-xs text-[#777789]">
            Loading page {pageNum}…
          </div>
        )}

        {/* Layer 0.5: Background-Matched Whiteout Patches (drawn cleanly underneath typed replacement text) */}
        {whiteoutPatches.map((patch) => (
          <div
            key={patch.id}
            style={{
              left: `${patch.x * 100}%`,
              top: `${patch.y * 100}%`,
              width: `${patch.width * 100}%`,
              height: `${patch.height * 100}%`,
              backgroundColor: patch.fillColor || '#ffffff',
            }}
            className="absolute z-[5] pointer-events-none"
          />
        ))}

        {/* Layer 0.75: Whisper-Quiet Hover Targets for Detected Table Cells & Inline Blanks */}
        {layout &&
          layout.slots.map((slot) => {
            if (occupiedSlotIds.has(slot.id)) return null;
            return (
              <div
                key={slot.id}
                onClick={(e) => {
                  if (suppressNextClickRef.current) return;
                  if (activeSelection) {
                    e.stopPropagation();
                    onSelectPdfRegion(null);
                    return;
                  }
                  e.stopPropagation();
                  onClickSlot(slot);
                }}
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  width: `${slot.width * 100}%`,
                  height: `${slot.height * 100}%`,
                }}
                title={slot.label ? `Fill ${slot.label}` : undefined}
                className="absolute z-[8] rounded-[2px] cursor-text transition-colors hover:bg-[#5B50E6]/[0.06] hover:ring-1 hover:ring-[#5B50E6]/25"
              />
            );
          })}

        {/* Layer 1: Native Interactive AcroForm Fields */}
        {interactiveFields.map((field) => {
          const val = interactiveValues[field.fieldName] ?? field.initialValue;
          const fieldFontPx = Math.max(9, Math.min(16, Math.round(field.height * cssHeight * 0.62)));

          const handleAcroKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              onNavigateField(field.id, e.shiftKey ? -1 : 1);
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
              e.stopPropagation();
            } else if (e.key === 'Escape') {
              (e.currentTarget as HTMLElement).blur();
            }
          };

          return (
            <div
              key={field.id}
              data-acro-field="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                left: `${field.x * 100}%`,
                top: `${field.y * 100}%`,
                width: `${field.width * 100}%`,
                height: `${field.height * 100}%`,
              }}
              className="absolute z-10"
            >
              {field.type === 'text' && field.multiline ? (
                <textarea
                  ref={(node) => registerInteractiveRef(field.id, node)}
                  value={String(val ?? '')}
                  disabled={field.readOnly}
                  aria-label={field.fieldName}
                  onFocus={() => interactiveFocusCapturedRef.current.delete(field.fieldName)}
                  onKeyDown={handleAcroKeyDown}
                  onChange={(e) => {
                    const shouldRecord = !interactiveFocusCapturedRef.current.has(field.fieldName);
                    if (shouldRecord) interactiveFocusCapturedRef.current.add(field.fieldName);
                    onInteractiveFieldChange(field.fieldName, e.target.value, shouldRecord);
                  }}
                  style={{
                    fontSize: `${Math.max(10, Math.round(12 * zoom))}px`,
                    lineHeight: 1.25,
                    fontFamily: FONT_STACK,
                  }}
                  className="w-full h-full px-1 py-0.5 bg-sky-500/[0.06] hover:bg-sky-500/[0.12] focus:bg-white/90 text-[#111827] border border-transparent hover:border-sky-400/50 focus:border-[#5B50E6] focus:outline-none resize-none rounded-[2px] transition-colors"
                />
              ) : field.type === 'text' ? (
                <input
                  ref={(node) => registerInteractiveRef(field.id, node)}
                  type="text"
                  value={String(val ?? '')}
                  disabled={field.readOnly}
                  aria-label={field.fieldName}
                  onFocus={() => interactiveFocusCapturedRef.current.delete(field.fieldName)}
                  onKeyDown={handleAcroKeyDown}
                  onChange={(e) => {
                    const shouldRecord = !interactiveFocusCapturedRef.current.has(field.fieldName);
                    if (shouldRecord) interactiveFocusCapturedRef.current.add(field.fieldName);
                    onInteractiveFieldChange(field.fieldName, e.target.value, shouldRecord);
                  }}
                  style={{
                    fontSize: `${fieldFontPx}px`,
                    fontFamily: FONT_STACK,
                  }}
                  className="w-full h-full px-1 bg-sky-500/[0.06] hover:bg-sky-500/[0.12] focus:bg-white/90 text-[#111827] border border-transparent hover:border-sky-400/50 focus:border-[#5B50E6] focus:outline-none rounded-[2px] transition-colors"
                />
              ) : field.type === 'checkbox' ? (
                <label className="w-full h-full flex items-center justify-center cursor-pointer bg-sky-500/[0.06] hover:bg-sky-500/[0.14] rounded-[2px]">
                  <input
                    ref={(node) => registerInteractiveRef(field.id, node)}
                    type="checkbox"
                    checked={Boolean(val)}
                    disabled={field.readOnly}
                    aria-label={field.fieldName}
                    onKeyDown={handleAcroKeyDown}
                    onChange={(e) =>
                      onInteractiveFieldChange(field.fieldName, e.target.checked, true)
                    }
                    className="w-[75%] h-[75%] accent-[#5B50E6] cursor-pointer"
                  />
                </label>
              ) : field.type === 'radio' ? (
                <label className="w-full h-full flex items-center justify-center cursor-pointer bg-sky-500/[0.06] hover:bg-sky-500/[0.14] rounded-full">
                  <input
                    ref={(node) => registerInteractiveRef(field.id, node)}
                    type="radio"
                    name={`acro-radio-${field.fieldName}`}
                    checked={String(val) === String(field.exportValue || '')}
                    disabled={field.readOnly}
                    aria-label={field.fieldName}
                    onKeyDown={handleAcroKeyDown}
                    onChange={() =>
                      onInteractiveFieldChange(field.fieldName, field.exportValue || 'Yes', true)
                    }
                    className="w-[75%] h-[75%] accent-[#5B50E6] cursor-pointer"
                  />
                </label>
              ) : field.type === 'dropdown' ? (
                <select
                  ref={(node) => registerInteractiveRef(field.id, node)}
                  value={String(val ?? '')}
                  disabled={field.readOnly}
                  aria-label={field.fieldName}
                  onKeyDown={handleAcroKeyDown}
                  onChange={(e) => onInteractiveFieldChange(field.fieldName, e.target.value, true)}
                  style={{
                    fontSize: `${fieldFontPx}px`,
                    fontFamily: FONT_STACK,
                  }}
                  className="w-full h-full px-1 bg-sky-500/[0.08] hover:bg-sky-500/[0.14] focus:bg-white text-[#111827] border border-transparent hover:border-sky-400/50 focus:border-[#5B50E6] focus:outline-none rounded-[2px] cursor-pointer"
                >
                  <option value="">Select…</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          );
        })}

        {/* Layer 1.5: Live Drag Selection Highlight & Active Preprinted Text Selection */}
        {dragMarquee && (
          <>
            <div
              style={{
                left: `${dragMarquee.x * 100}%`,
                top: `${dragMarquee.y * 100}%`,
                width: `${dragMarquee.width * 100}%`,
                height: `${dragMarquee.height * 100}%`,
              }}
              className="absolute z-[15] bg-sky-500/15 border border-sky-500/60 pointer-events-none rounded-[2px]"
            />
            {liveMarqueeSpans.map((sp) => (
              <div
                key={sp.id}
                style={{
                  left: `${sp.x * 100}%`,
                  top: `${sp.y * 100}%`,
                  width: `${sp.width * 100}%`,
                  height: `${sp.height * 100}%`,
                }}
                className="absolute z-[16] bg-sky-400/35 pointer-events-none rounded-[1px]"
              />
            ))}
          </>
        )}

        {pageSelection && (
          <>
            {/* Highlight selected digital words or scanned region */}
            {layout && selectedSpanSet && selectedSpanSet.size > 0 ? (
              layout.textSpans
                .filter((sp) => selectedSpanSet.has(sp.id))
                .map((sp) => (
                  <div
                    key={sp.id}
                    style={{
                      left: `${sp.x * 100}%`,
                      top: `${sp.y * 100}%`,
                      width: `${sp.width * 100}%`,
                      height: `${sp.height * 100}%`,
                    }}
                    className="absolute z-[16] bg-sky-500/30 ring-1 ring-sky-500/40 pointer-events-none rounded-[1px]"
                  />
                ))
            ) : (
              <div
                style={{
                  left: `${pageSelection.x * 100}%`,
                  top: `${pageSelection.y * 100}%`,
                  width: `${pageSelection.width * 100}%`,
                  height: `${pageSelection.height * 100}%`,
                }}
                className="absolute z-[16] bg-sky-500/20 border border-dashed border-sky-600/75 pointer-events-none rounded-[2px]"
              />
            )}

            {/* Minimal Contextual Erase / Replace Action Bar above selected preprinted text */}
            <div
              data-selection-bar="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: `${Math.min(72, Math.max(1, pageSelection.x * 100))}%`,
                top:
                  pageSelection.y < 0.08
                    ? `${(pageSelection.y + pageSelection.height) * 100}%`
                    : `${pageSelection.y * 100}%`,
              }}
              className={`absolute z-40 ${
                pageSelection.y < 0.08 ? 'mt-1.5' : '-translate-y-full -mt-1.5'
              } flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white dark:bg-[#181B2E] border border-[#DDD9EE] dark:border-[#2E3454] shadow-[0_10px_24px_-8px_rgba(37,37,54,0.3)] whitespace-nowrap`}
            >
              <button
                type="button"
                title="Erase selected text (Backspace / Delete)"
                onClick={() => {
                  const fill = sampleFillColor(pageSelection);
                  onEraseSelectedRegion(pageSelection, fill);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Eraser className="w-3 h-3" />
                <span>Erase</span>
              </button>

              <span className="w-px h-3.5 bg-[#E8E6F2] dark:bg-[#2A2F4A]" aria-hidden="true" />

              <button
                type="button"
                title="Erase and type replacement text here"
                onClick={() => {
                  const fill = sampleFillColor(pageSelection);
                  onEraseSelectedRegion(pageSelection, fill, '');
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#5B50E6] dark:text-[#A99EFF] hover:bg-[#F5F4FA] dark:hover:bg-[#232842] transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                title="Cancel selection"
                aria-label="Cancel selection"
                onClick={() => onSelectPdfRegion(null)}
                className="w-5 h-5 rounded-md flex items-center justify-center text-[#777789] hover:text-[#252536] dark:hover:text-white hover:bg-[#F5F4FA] dark:hover:bg-[#232842] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {/* Layer 2: Direct Click-to-Type Transparent Text Entries (bounded cells, inline blanks, and free clicks) */}
        {textEntries.map((entry) => {
          const isActive = activeEntryId === entry.id;
          const isTableCell = Boolean(entry.tableId);
          const isBounded = Boolean(entry.boundedBox);

          const boxWPoints = entry.width * baseWidth;
          const boxHPoints = entry.height * baseHeight;
          const effectiveFontPt = isBounded
            ? computeFittedFontSizePt(
                entry.text,
                entry.fontSize,
                boxWPoints,
                boxHPoints,
                isTableCell
              )
            : entry.fontSize;

          const fontPx = effectiveFontPt * zoom;
          const padPx = (isTableCell ? 1.5 : 2) * zoom;
          const maxAvailPx = isBounded
            ? Math.max(20, Math.round(entry.width * cssWidth))
            : Math.max(60, (1 - entry.x - 0.005) * cssWidth);
          const placeToolbarBelow = entry.y < 0.09;
          const alignToolbarRight = entry.x > 0.62;

          const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Escape') {
              e.currentTarget.blur();
              return;
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              onNavigateField(entry.slotId || entry.id, e.shiftKey ? -1 : 1);
              return;
            }
            if (e.key === 'Enter' && !e.shiftKey && isTableCell) {
              e.preventDefault();
              onNavigateTableDown(entry);
              return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
              // Keep Ctrl+A strictly scoped to this field
              e.stopPropagation();
            }
          };

          return (
            <div
              key={entry.id}
              data-form-entry="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                left: `${entry.x * 100}%`,
                top: `${entry.y * 100}%`,
                ...(isBounded
                  ? {
                      width: `${entry.width * 100}%`,
                      ...(isTableCell
                        ? { height: `${entry.height * 100}%` }
                        : { minHeight: `${entry.height * 100}%` }),
                    }
                  : { maxWidth: `${maxAvailPx}px` }),
              }}
              className={`absolute ${isActive ? 'z-30' : 'z-20'}`}
            >
              {/* Contextual Mini Format Toolbar — appears ONLY when this text entry is active */}
              {isActive && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute ${
                    placeToolbarBelow ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                  } ${
                    alignToolbarRight ? 'right-0' : 'left-0'
                  } flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white dark:bg-[#181B2E] border border-[#DDD9EE] dark:border-[#2E3454] shadow-[0_10px_24px_-8px_rgba(37,37,54,0.28)] whitespace-nowrap z-40`}
                >
                  {/* Subtle drag handle to nudge position */}
                  <button
                    type="button"
                    title="Drag to move"
                    aria-label="Drag to reposition text"
                    onPointerDown={(e) => handleGripPointerDown(e, entry)}
                    onPointerMove={handleGripPointerMove}
                    onPointerUp={handleGripPointerUp}
                    onPointerCancel={handleGripPointerUp}
                    className="p-1 rounded-lg text-[#777789] hover:text-[#252536] dark:hover:text-[#F2F4FC] hover:bg-[#F5F4FA] dark:hover:bg-[#232842] cursor-grab active:cursor-grabbing touch-none"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-px h-4 bg-[#E8E6F2] dark:bg-[#2A2F4A]" aria-hidden="true" />

                  {/* Font size controls */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title="Decrease font size"
                      aria-label="Decrease font size"
                      onClick={() =>
                        onUpdateEntryStyle(entry.id, {
                          fontSize: Math.max(8, entry.fontSize - 1),
                        })
                      }
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[#252536] dark:text-[#E2E6F7] hover:bg-[#F5F4FA] dark:hover:bg-[#232842] transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] font-mono font-semibold tabular-nums text-[#252536] dark:text-[#F2F4FC] w-7 text-center select-none">
                      {entry.fontSize}
                    </span>
                    <button
                      type="button"
                      title="Increase font size"
                      aria-label="Increase font size"
                      onClick={() =>
                        onUpdateEntryStyle(entry.id, {
                          fontSize: Math.min(36, entry.fontSize + 1),
                        })
                      }
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[#252536] dark:text-[#E2E6F7] hover:bg-[#F5F4FA] dark:hover:bg-[#232842] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-px h-4 bg-[#E8E6F2] dark:bg-[#2A2F4A]" aria-hidden="true" />

                  {/* Pen ink color swatches */}
                  <div className="flex items-center gap-1" role="group" aria-label="Text color">
                    {INK_COLORS.map((swatch) => {
                      const selected = entry.color.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          title={swatch.label}
                          aria-label={`Set color to ${swatch.label}`}
                          onClick={() => onUpdateEntryStyle(entry.id, { color: swatch.hex })}
                          style={{ backgroundColor: swatch.hex }}
                          className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                            selected
                              ? 'ring-2 ring-offset-1 ring-[#5B50E6] dark:ring-offset-[#181B2E] scale-110'
                              : 'hover:scale-110 opacity-85 hover:opacity-100'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <span className="w-px h-4 bg-[#E8E6F2] dark:bg-[#2A2F4A]" aria-hidden="true" />

                  {/* Delete this text entry */}
                  <button
                    type="button"
                    title="Delete text"
                    aria-label="Delete text"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[#777789] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Bounded Table Cell / Tight Inline Slot Input vs. Fluid Freehand Input */}
              {isBounded ? (
                <textarea
                  ref={(node) => registerTextareaRef(entry.id, node)}
                  rows={1}
                  value={entry.text}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Typed PDF form field"
                  onFocus={() => onFocusEntry(entry.id)}
                  onBlur={() => onBlurEntry(entry.id)}
                  onChange={(e) => syncTextareaSize(e.currentTarget, entry, e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  style={{
                    fontSize: `${fontPx}px`,
                    lineHeight: isTableCell ? 1.2 : 1.24,
                    color: entry.color,
                    fontFamily: FONT_STACK,
                    padding: `${padPx}px`,
                    caretColor: entry.color,
                  }}
                  className={`block w-full h-full overflow-hidden resize-none bg-transparent border-0 outline-none select-text rounded-[2px] break-words transition-shadow ${
                    isActive
                      ? 'ring-1 ring-[#5B50E6]/60 bg-white/45'
                      : 'hover:ring-1 hover:ring-dashed hover:ring-[#5B50E6]/40 cursor-text'
                  }`}
                />
              ) : (
                <div className="inline-grid align-top" style={{ maxWidth: `${maxAvailPx}px` }}>
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: `${fontPx}px`,
                      lineHeight: 1.28,
                      fontFamily: FONT_STACK,
                      padding: `${padPx}px`,
                      minWidth: `${Math.max(20, Math.round(16 * zoom))}px`,
                      maxWidth: `${maxAvailPx}px`,
                    }}
                    className="col-start-1 row-start-1 invisible whitespace-pre-wrap break-words pointer-events-none select-none"
                  >
                    {(entry.text || ' ') + (entry.text.endsWith('\n') ? ' ' : '')}
                  </span>

                  <textarea
                    ref={(node) => registerTextareaRef(entry.id, node)}
                    rows={1}
                    value={entry.text}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Typed PDF text"
                    onFocus={() => onFocusEntry(entry.id)}
                    onBlur={() => onBlurEntry(entry.id)}
                    onChange={(e) => syncTextareaSize(e.currentTarget, entry, e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    style={{
                      fontSize: `${fontPx}px`,
                      lineHeight: 1.28,
                      color: entry.color,
                      fontFamily: FONT_STACK,
                      padding: `${padPx}px`,
                      caretColor: entry.color,
                    }}
                    className={`col-start-1 row-start-1 w-full h-full overflow-hidden resize-none bg-transparent border-0 outline-none select-text rounded-[2px] transition-shadow ${
                      isActive
                        ? 'ring-1 ring-[#5B50E6]/50 bg-white/35'
                        : 'hover:ring-1 hover:ring-dashed hover:ring-[#5B50E6]/40 cursor-text'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiet page label for multi-page documents */}
      {totalPages > 1 && (
        <span className="text-[11px] font-medium tabular-nums text-[#777789] dark:text-[#A0A5C0]">
          Page {pageNum} of {totalPages}
        </span>
      )}
    </div>
  );
};
