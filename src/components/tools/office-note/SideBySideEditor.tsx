import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Search,
  Replace,
  Copy,
  Check,
  RefreshCw,
  RotateCcw,
  Eraser,
  AlignLeft,
  Sparkles,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  List,
  X,
  Files,
} from 'lucide-react';
import { DigitizerPageItem, HtrLineResult } from '../../../services/htr/types';

interface SideBySideEditorProps {
  page: DigitizerPageItem;
  pageIndex: number;
  totalPages: number;
  originalPreviewUrl: string | null;
  enhancedPreviewUrl: string | null;
  isRenderingPreview: boolean;
  highlightedLineId: string | null;
  onHighlightLine: (id: string | null) => void;
  onChangeEditedText: (pageId: string, nextText: string) => void;
  onRerunPage: (pageId: string) => void;
  onRerunSingleLine: (page: DigitizerPageItem, line: HtrLineResult, targetScript: 'hin' | 'eng') => void;
  onCopyPageText: (page: DigitizerPageItem) => void;
  onCopyAllPagesText: () => void;
  onNavigatePage: (direction: 'prev' | 'next') => void;
  isRecognizing: boolean;
  rerunningLineId: string | null;
  copiedPageId: string | null;
  copiedAll: boolean;
  canRerun: boolean;
}

interface TextHistoryStack {
  past: string[];
  future: string[];
}

const MAX_HISTORY_ENTRIES = 60;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Joins single hard line breaks within paragraphs while keeping blank-line paragraph breaks,
 * bullet/numbered items, and Hindi/English subject header lines intact.
 */
function formatParagraphLines(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  const blocks = normalized.split(/\n{2,}/);
  const formattedBlocks = blocks.map((block) => {
    const rawLines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (rawLines.length <= 1) return rawLines[0] || '';

    let merged = rawLines[0];
    for (let i = 1; i < rawLines.length; i++) {
      const prev = rawLines[i - 1];
      const curr = rawLines[i];
      const isHeadingOrList =
        /^(\d+[.)]|[a-zA-Z][.)]|[-•*]|विषय|प्रसंग|दिनांक|क्र\.|क्रमांक|Sub|Subject|Ref|Date|File\s*No)/i.test(
          curr
        ) || /[:：]$/.test(prev);
      if (isHeadingOrList) {
        merged += '\n' + curr;
      } else {
        merged += ' ' + curr;
      }
    }
    return merged;
  });
  return formattedBlocks.join('\n\n');
}

/**
 * Cleans stray whitespace and punctuation spacing for Hindi (Devanagari purna viram) & English notes.
 */
function cleanNoteSpacing(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\s+([,.;:!?।॥])/g, '$1')
        .replace(/([।॥])([^\s\n”"'’)])/g, '$1 $2')
        .trim()
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const SideBySideEditor: React.FC<SideBySideEditorProps> = ({
  page,
  pageIndex,
  totalPages,
  originalPreviewUrl,
  enhancedPreviewUrl,
  isRenderingPreview,
  highlightedLineId,
  onHighlightLine,
  onChangeEditedText,
  onRerunPage,
  onRerunSingleLine,
  onCopyPageText,
  onCopyAllPagesText,
  onNavigatePage,
  isRecognizing,
  rerunningLineId,
  copiedPageId,
  copiedAll,
  canRerun,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const historyMapRef = useRef<Map<string, TextHistoryStack>>(new Map());
  const typingTimerRef = useRef<number | null>(null);
  const lastCommittedRef = useRef<Map<string, string>>(new Map());

  // Force re-render when undo/redo stack changes
  const [, setHistoryTick] = useState(0);

  // Viewer controls
  const [viewerFitMode, setViewerFitMode] = useState<'fit-width' | 'fit-page' | 'custom'>('fit-width');
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [imageSourceMode, setImageSourceMode] = useState<'enhanced' | 'original'>(
    page.useEnhancedForRecognition ? 'enhanced' : 'original'
  );
  const [showLineBoxes, setShowLineBoxes] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Mobile responsive tab state (< lg)
  const [mobileTab, setMobileTab] = useState<'text' | 'scan' | 'lines'>('text');
  // Desktop collapsible line inspector inside right pane
  const [showLineList, setShowLineList] = useState<boolean>(true);

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);

  // Sync imageSourceMode default when switching pages
  useEffect(() => {
    setImageSourceMode(page.useEnhancedForRecognition ? 'enhanced' : 'original');
  }, [page.id, page.useEnhancedForRecognition]);

  // Initialize last committed snapshot per page
  useEffect(() => {
    if (!lastCommittedRef.current.has(page.id)) {
      lastCommittedRef.current.set(page.id, page.editedText);
    }
  }, [page.id, page.editedText]);

  // Escape exits fullscreen cleanly
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const getStack = useCallback((pageId: string): TextHistoryStack => {
    let stack = historyMapRef.current.get(pageId);
    if (!stack) {
      stack = { past: [], future: [] };
      historyMapRef.current.set(pageId, stack);
    }
    return stack;
  }, []);

  const pushImmediateEdit = useCallback(
    (nextText: string) => {
      if (nextText === page.editedText) return;
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      const stack = getStack(page.id);
      stack.past.push(page.editedText);
      if (stack.past.length > MAX_HISTORY_ENTRIES) stack.past.shift();
      stack.future = [];
      lastCommittedRef.current.set(page.id, nextText);
      setHistoryTick((t) => t + 1);
      onChangeEditedText(page.id, nextText);
    },
    [getStack, onChangeEditedText, page.editedText, page.id]
  );

  const handleTextareaChange = (nextText: string) => {
    const pageId = page.id;
    const baseline = lastCommittedRef.current.get(pageId) ?? page.editedText;
    onChangeEditedText(pageId, nextText);

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      if (baseline !== nextText) {
        const stack = getStack(pageId);
        if (stack.past[stack.past.length - 1] !== baseline) {
          stack.past.push(baseline);
          if (stack.past.length > MAX_HISTORY_ENTRIES) stack.past.shift();
        }
        stack.future = [];
        lastCommittedRef.current.set(pageId, nextText);
        setHistoryTick((t) => t + 1);
      }
      typingTimerRef.current = null;
    }, 450);
  };

  const handleUndo = useCallback(() => {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    const stack = getStack(page.id);
    if (stack.past.length === 0) return;
    const previous = stack.past.pop()!;
    stack.future.push(page.editedText);
    lastCommittedRef.current.set(page.id, previous);
    setHistoryTick((t) => t + 1);
    onChangeEditedText(page.id, previous);
  }, [getStack, onChangeEditedText, page.editedText, page.id]);

  const handleRedo = useCallback(() => {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    const stack = getStack(page.id);
    if (stack.future.length === 0) return;
    const next = stack.future.pop()!;
    stack.past.push(page.editedText);
    lastCommittedRef.current.set(page.id, next);
    setHistoryTick((t) => t + 1);
    onChangeEditedText(page.id, next);
  }, [getStack, onChangeEditedText, page.editedText, page.id]);

  const activeStack = getStack(page.id);
  const canUndo = activeStack.past.length > 0;
  const canRedo = activeStack.future.length > 0;

  // Live Find & Replace match count
  const findMatchCount = useMemo(() => {
    if (!findQuery) return 0;
    try {
      const flags = matchCase ? 'g' : 'gi';
      const re = new RegExp(escapeRegex(findQuery), flags);
      const matches = page.editedText.match(re);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [findQuery, matchCase, page.editedText]);

  const handleReplaceNext = () => {
    if (!findQuery || findMatchCount === 0) return;
    const flags = matchCase ? '' : 'i';
    const re = new RegExp(escapeRegex(findQuery), flags);
    const nextText = page.editedText.replace(re, replaceQuery);
    pushImmediateEdit(nextText);
  };

  const handleReplaceAll = () => {
    if (!findQuery || findMatchCount === 0) return;
    const flags = matchCase ? 'g' : 'gi';
    const re = new RegExp(escapeRegex(findQuery), flags);
    const nextText = page.editedText.replace(re, replaceQuery);
    pushImmediateEdit(nextText);
  };

  // Focus & select matching line inside textarea when clicking a line box on the scan or line list
  const jumpToLineInEditor = (line: HtrLineResult) => {
    onHighlightLine(line.id);
    const needle = line.text.trim();
    if (!needle) return;
    setMobileTab('text');
    window.setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const idx = page.editedText.indexOf(needle);
      if (idx !== -1) {
        ta.focus();
        ta.setSelectionRange(idx, idx + needle.length);
      }
    }, 20);
  };

  // Text metrics (Unicode-safe for Hindi Devanagari + English)
  const textStats = useMemo(() => {
    const trimmed = page.editedText.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const lines = trimmed ? trimmed.split(/\n/).length : 0;
    const chars = page.editedText.length;
    return { words, lines, chars };
  }, [page.editedText]);

  const activeImageUrl =
    imageSourceMode === 'enhanced'
      ? enhancedPreviewUrl || originalPreviewUrl || page.thumbnailUrl
      : originalPreviewUrl || enhancedPreviewUrl || page.thumbnailUrl;

  const displayLines = page.recognizedLines.length > 0 ? page.recognizedLines : [];
  const overlayBoxes =
    page.recognizedLines.length > 0 ? page.recognizedLines : page.detectedLines;

  const handleZoomStep = (delta: number) => {
    setViewerFitMode('custom');
    setZoomPercent((prev) => Math.max(50, Math.min(250, prev + delta)));
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F4F3F9] dark:bg-[#0D101D] p-3 sm:p-5 flex flex-col overflow-hidden'
          : 'rounded-3xl bg-white dark:bg-[#171A2B] border border-[#E6E4F0] dark:border-[#282D47] overflow-hidden shadow-xs'
      }
    >
      <div
        className={
          isFullscreen
            ? 'flex-1 min-h-0 flex flex-col rounded-2xl bg-white dark:bg-[#171A2B] border border-[#E6E4F0] dark:border-[#282D47] overflow-hidden shadow-xl'
            : 'flex flex-col'
        }
      >
        {/* TOP WORKSPACE HEADER */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#ECEAF4] dark:border-[#242840] bg-[#FAFAFC] dark:bg-[#131625] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#252536] dark:text-[#F2F4FC]">
                  Side-by-Side Document Editor
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-[#ECEAF8] dark:bg-[#242146] text-[#43348F] dark:text-[#CFC6FF] text-[11px] font-mono font-bold">
                  Page {page.pageNumber} / {totalPages}
                </span>
              </div>
              <p className="text-[11px] text-[#777789] dark:text-[#9CA2BE] font-mono truncate mt-0.5">
                {page.sourceFileName}
                {page.recognizedLines.length > 0 ? ` · ${page.recognizedLines.length} lines` : ''}
              </p>
            </div>
          </div>

          {/* Page Navigation + Global Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            {totalPages > 1 && (
              <div className="inline-flex items-center rounded-xl border border-[#E0DDF0] dark:border-[#2E3454] bg-white dark:bg-[#191D32] overflow-hidden mr-1">
                <button
                  type="button"
                  disabled={pageIndex <= 0}
                  onClick={() => onNavigatePage('prev')}
                  title="Previous page"
                  className="p-1.5 text-[#252536] dark:text-[#F2F4FC] hover:bg-[#F3F1FB] dark:hover:bg-[#252A47] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-[11px] font-mono font-bold text-[#646478] dark:text-[#A5AAC4]">
                  {pageIndex + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={pageIndex >= totalPages - 1}
                  onClick={() => onNavigatePage('next')}
                  title="Next page"
                  className="p-1.5 text-[#252536] dark:text-[#F2F4FC] hover:bg-[#F3F1FB] dark:hover:bg-[#252A47] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isRecognizing || !canRerun}
              onClick={() => onRerunPage(page.id)}
              title={
                canRerun
                  ? 'Re-read this page'
                  : 'Re-upload source file to re-read this restored draft'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer disabled:opacity-45"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Re-run Page</span>
            </button>

            <button
              type="button"
              onClick={() => onCopyPageText(page)}
              disabled={!page.editedText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#252536] hover:bg-[#5B50E6] dark:bg-[#F2F4FC] dark:text-[#171A2B] text-white transition-colors cursor-pointer disabled:opacity-45"
            >
              {copiedPageId === page.id ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Page</span>
                </>
              )}
            </button>

            {totalPages > 1 && (
              <button
                type="button"
                onClick={onCopyAllPagesText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied All</span>
                  </>
                ) : (
                  <>
                    <Files className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Copy All ({totalPages})</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Open Fullscreen Side-by-Side Workspace'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE VIEW TABS (< lg) */}
        <div className="lg:hidden px-4 py-2 border-b border-[#ECEAF4] dark:border-[#242840] bg-[#F7F6FC] dark:bg-[#111424]">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EAE8F5] dark:bg-[#1B1F34]">
            {(
              [
                { id: 'scan', label: 'Scan Image', icon: ImageIcon },
                { id: 'text', label: 'Editable Text', icon: FileText },
                { id: 'lines', label: `Lines (${displayLines.length})`, icon: List },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMobileTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    mobileTab === tab.id
                      ? 'bg-white dark:bg-[#262B47] text-[#43348F] dark:text-[#CFC6FF] shadow-2xs'
                      : 'text-[#646478] dark:text-[#9CA2BE]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SPLIT-SCREEN MAIN BODY */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#ECEAF4] dark:divide-[#242840] ${
            isFullscreen ? 'flex-1 min-h-0' : 'min-h-[560px]'
          }`}
        >
          {/* LEFT PANE: SCANNED DOCUMENT VIEWER */}
          <div
            className={`lg:col-span-6 flex flex-col bg-[#F6F5FB] dark:bg-[#101321] ${
              mobileTab === 'scan' ? 'flex' : 'hidden lg:flex'
            } ${isFullscreen ? 'min-h-0' : 'max-h-[700px]'}`}
          >
            {/* Viewer Control Bar */}
            <div className="px-3.5 py-2.5 border-b border-[#E6E4F0] dark:border-[#242840] bg-white/80 dark:bg-[#151828] flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleZoomStep(-20)}
                  title="Zoom out"
                  className="p-1.5 rounded-lg border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[11px] font-mono font-bold text-[#646478] dark:text-[#A5AAC4] min-w-[44px] text-center">
                  {viewerFitMode === 'custom' ? `${zoomPercent}%` : viewerFitMode === 'fit-width' ? 'Width' : 'Page'}
                </span>
                <button
                  type="button"
                  onClick={() => handleZoomStep(20)}
                  title="Zoom in"
                  className="p-1.5 rounded-lg border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewerFitMode('fit-width');
                    setZoomPercent(100);
                  }}
                  className={`ml-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    viewerFitMode === 'fit-width'
                      ? 'bg-[#E9E4FF] dark:bg-[#27224B] text-[#43348F] dark:text-[#CFC6FF]'
                      : 'text-[#646478] dark:text-[#9CA2BE] hover:bg-[#ECEAF4] dark:hover:bg-[#21253B]'
                  }`}
                >
                  Fit Width
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewerFitMode('fit-page');
                    setZoomPercent(100);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    viewerFitMode === 'fit-page'
                      ? 'bg-[#E9E4FF] dark:bg-[#27224B] text-[#43348F] dark:text-[#CFC6FF]'
                      : 'text-[#646478] dark:text-[#9CA2BE] hover:bg-[#ECEAF4] dark:hover:bg-[#21253B]'
                  }`}
                >
                  Fit Page
                </button>
              </div>

              <div className="inline-flex items-center gap-1.5">
                {originalPreviewUrl && enhancedPreviewUrl && (
                  <div className="inline-flex p-0.5 rounded-lg bg-[#ECEAF4] dark:bg-[#22263C] text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('original')}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        imageSourceMode === 'original'
                          ? 'bg-white dark:bg-[#171A2B] text-[#252536] dark:text-[#F2F4FC] shadow-2xs'
                          : 'text-[#646478] dark:text-[#9CA2BE]'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('enhanced')}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        imageSourceMode === 'enhanced'
                          ? 'bg-white dark:bg-[#171A2B] text-[#252536] dark:text-[#F2F4FC] shadow-2xs'
                          : 'text-[#646478] dark:text-[#9CA2BE]'
                      }`}
                    >
                      Enhanced
                    </button>
                  </div>
                )}

                {overlayBoxes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowLineBoxes((v) => !v)}
                    title="Toggle detected line highlight boxes"
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                      showLineBoxes
                        ? 'border-[#5B50E6]/40 bg-[#F2EFFF] dark:bg-[#241F46] text-[#43348F] dark:text-[#CFC6FF]'
                        : 'border-[#E0DDF0] dark:border-[#2E3454] text-[#646478] dark:text-[#9CA2BE]'
                    }`}
                  >
                    {showLineBoxes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>Lines</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Zoomable Document Stage */}
            <div className="flex-1 min-h-[380px] overflow-auto p-4 flex items-start justify-center">
              {isRenderingPreview && !activeImageUrl ? (
                <div className="my-auto text-xs text-[#777789] dark:text-[#9CA2BE]">
                  Loading page preview...
                </div>
              ) : activeImageUrl ? (
                <div
                  className={`relative inline-block shadow-md rounded-lg overflow-hidden bg-white border border-black/10 ${
                    viewerFitMode === 'fit-width' ? 'w-full' : ''
                  }`}
                  style={
                    viewerFitMode === 'custom'
                      ? { width: `${zoomPercent}%`, minWidth: '240px' }
                      : viewerFitMode === 'fit-page'
                        ? { maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '580px' }
                        : undefined
                  }
                >
                  <img
                    src={activeImageUrl}
                    alt={`Scanned Page ${page.pageNumber}`}
                    className={
                      viewerFitMode === 'fit-page'
                        ? 'block w-auto max-w-full object-contain mx-auto'
                        : 'block w-full h-auto'
                    }
                    style={
                      viewerFitMode === 'fit-page'
                        ? { maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '580px' }
                        : undefined
                    }
                  />
                  {showLineBoxes && overlayBoxes.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {overlayBoxes.map((box) => {
                        const isActive = highlightedLineId === box.id;
                        const recognizedMatch = displayLines.find((l) => l.id === box.id);
                        return (
                          <div
                            key={box.id}
                            onMouseEnter={() => onHighlightLine(box.id)}
                            onMouseLeave={() => onHighlightLine(null)}
                            onClick={() => recognizedMatch && jumpToLineInEditor(recognizedMatch)}
                            style={{
                              left: `${box.normalizedBox.x0 * 100}%`,
                              top: `${box.normalizedBox.y0 * 100}%`,
                              width: `${(box.normalizedBox.x1 - box.normalizedBox.x0) * 100}%`,
                              height: `${(box.normalizedBox.y1 - box.normalizedBox.y0) * 100}%`,
                            }}
                            className={`absolute border transition-colors pointer-events-auto cursor-pointer rounded-[2px] ${
                              isActive
                                ? 'border-[#5B50E6] bg-[#5B50E6]/24 ring-1 ring-[#5B50E6]'
                                : 'border-emerald-500/60 bg-emerald-400/8 hover:bg-[#5B50E6]/18 hover:border-[#5B50E6]'
                            }`}
                            title={
                              recognizedMatch?.text
                                ? `Line ${box.lineIndex + 1}: ${recognizedMatch.text}`
                                : `Line ${box.lineIndex + 1}`
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="my-auto text-xs text-[#777789] dark:text-[#9CA2BE]">
                  Preview unavailable for this page.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: RICH EDITABLE DOCUMENT WORKSPACE */}
          <div
            className={`lg:col-span-6 flex flex-col bg-white dark:bg-[#171A2B] ${
              mobileTab === 'text' || mobileTab === 'lines' ? 'flex' : 'hidden lg:flex'
            } ${isFullscreen ? 'min-h-0' : 'max-h-[700px]'}`}
          >
            {/* Editor Formatting & History Toolbar */}
            <div className="px-3.5 py-2.5 border-b border-[#E6E4F0] dark:border-[#242840] bg-[#FAFAFC] dark:bg-[#151828] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded-lg border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] cursor-pointer disabled:opacity-35"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  title="Redo (Ctrl+Y)"
                  className="p-1.5 rounded-lg border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] cursor-pointer disabled:opacity-35"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>

                <span className="mx-1 h-4 w-px bg-[#DFDCEB] dark:bg-[#2B3150]" aria-hidden="true" />

                <button
                  type="button"
                  onClick={() => setShowFindReplace((v) => !v)}
                  title="Find and Replace"
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    showFindReplace
                      ? 'border-[#5B50E6] bg-[#F2EFFF] dark:bg-[#241F46] text-[#43348F] dark:text-[#CFC6FF]'
                      : 'border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find</span>
                </button>

                <button
                  type="button"
                  disabled={!page.editedText.trim()}
                  onClick={() => pushImmediateEdit(formatParagraphLines(page.editedText))}
                  title="Merge wrapped lines into clean paragraphs while keeping headings & blank-line breaks"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Paragraphs</span>
                </button>

                <button
                  type="button"
                  disabled={!page.editedText.trim()}
                  onClick={() => pushImmediateEdit(cleanNoteSpacing(page.editedText))}
                  title="Clean stray spaces and Hindi/English punctuation spacing"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#E0DDF0] dark:border-[#2E3454] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clean Spaces</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {page.recognizedText && page.editedText !== page.recognizedText && (
                  <button
                    type="button"
                    onClick={() => pushImmediateEdit(page.recognizedText)}
                    title="Restore original extracted text"
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#5B50E6] dark:text-[#A9A2FF] hover:bg-[#F2EFFF] dark:hover:bg-[#241F46] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!page.editedText}
                  onClick={() => pushImmediateEdit('')}
                  title="Clear current page text (can be undone)"
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#B91C1C] dark:text-rose-300 hover:bg-[#FFF1EE] dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-35"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Collapsible Find & Replace Bar */}
            {showFindReplace && (
              <div className="px-3.5 py-2.5 border-b border-[#E6E4F0] dark:border-[#242840] bg-[#F7F6FC] dark:bg-[#131729] space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={findQuery}
                    onChange={(e) => setFindQuery(e.target.value)}
                    placeholder="Find word (Hindi or English)..."
                    className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-[#111423] border border-[#DFDCEB] dark:border-[#2B3150] text-[#252536] dark:text-[#F2F4FC] focus:outline-none focus:border-[#5B50E6]"
                  />
                  <input
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    placeholder="Replace with..."
                    className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-[#111423] border border-[#DFDCEB] dark:border-[#2B3150] text-[#252536] dark:text-[#F2F4FC] focus:outline-none focus:border-[#5B50E6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFindReplace(false)}
                    title="Close Find & Replace"
                    className="p-1 text-[#777789] hover:text-[#252536] dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-[#646478] dark:text-[#A5AAC4] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={matchCase}
                        onChange={(e) => setMatchCase(e.target.checked)}
                        className="rounded accent-[#5B50E6]"
                      />
                      <span>Match case</span>
                    </label>
                    <span className="font-mono text-[#5B50E6] dark:text-[#A9A2FF]">
                      {findQuery ? `${findMatchCount} match${findMatchCount === 1 ? '' : 'es'}` : 'Type to search'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={findMatchCount === 0}
                      onClick={handleReplaceNext}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-white dark:bg-[#1E2238] border border-[#DFDCEB] dark:border-[#2F3556] text-[#252536] dark:text-[#F2F4FC] hover:border-[#5B50E6] cursor-pointer disabled:opacity-40"
                    >
                      <Replace className="w-3 h-3" />
                      <span>Replace Next</span>
                    </button>
                    <button
                      type="button"
                      disabled={findMatchCount === 0}
                      onClick={handleReplaceAll}
                      className="px-2.5 py-1 rounded-lg font-bold bg-[#5B50E6] hover:bg-[#4A3FD4] text-white cursor-pointer disabled:opacity-40"
                    >
                      Replace All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Editable Textarea (Hidden on mobile when 'lines' tab is active) */}
            <div
              className={`flex-1 min-h-[220px] flex flex-col p-3.5 sm:p-4 ${
                mobileTab === 'lines' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <textarea
                ref={textareaRef}
                value={page.editedText}
                onChange={(e) => handleTextareaChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                    if (canUndo) {
                      e.preventDefault();
                      handleUndo();
                    }
                  } else if (
                    ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
                    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
                  ) {
                    if (canRedo) {
                      e.preventDefault();
                      handleRedo();
                    }
                  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                    e.preventDefault();
                    setShowFindReplace(true);
                  }
                }}
                placeholder="Click 'Start Recognition' above to convert this page to text, or type and edit your Hindi & English note directly here..."
                className="flex-1 w-full min-h-[220px] rounded-2xl p-4 bg-[#FAFAFC] dark:bg-[#111423] border border-[#E2DFEF] dark:border-[#2A304D] text-[15px] leading-7 text-[#252536] dark:text-[#F2F4FC] focus:outline-none focus:border-[#5B50E6] resize-none"
                style={{ fontFamily: "'Noto Sans Devanagari', 'Inter', system-ui, sans-serif" }}
              />
            </div>

            {/* Synchronized Line-by-Line Inspection Drawer */}
            <div
              className={`border-t border-[#ECEAF4] dark:border-[#242840] bg-[#FAFAFC] dark:bg-[#131625] ${
                mobileTab === 'lines' ? 'flex-1 flex flex-col min-h-[300px]' : ''
              }`}
            >
              <div className="px-4 py-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowLineList((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#252536] dark:text-[#F2F4FC] cursor-pointer"
                >
                  <List className="w-3.5 h-3.5 text-[#5B50E6] dark:text-[#9D95FF]" />
                  <span>Line-by-Line Inspection ({displayLines.length})</span>
                </button>
                <span className="text-[10px] font-mono text-[#777789] dark:text-[#9CA2BE]">
                  Click line to jump · HI/EN to re-run
                </span>
              </div>

              {(showLineList || mobileTab === 'lines') && (
                <div
                  className={`${
                    mobileTab === 'lines' ? 'flex-1' : 'max-h-[180px]'
                  } overflow-y-auto border-t border-[#ECEAF4] dark:border-[#242840] divide-y divide-[#F1EFF8] dark:divide-[#232740] bg-white dark:bg-[#111423]`}
                >
                  {displayLines.length === 0 ? (
                    <div className="p-3.5 text-xs text-[#777789] dark:text-[#9CA2BE]">
                      No converted lines yet on Page {page.pageNumber}. Click Start Recognition to view and edit lines side-by-side.
                    </div>
                  ) : (
                    displayLines.map((line) => {
                      const scriptBadge =
                        line.script === 'hin'
                          ? { text: 'HI', cls: 'bg-[#FFF3E0] text-[#9A3412] dark:bg-[#3A2414] dark:text-[#FDBA74]' }
                          : line.script === 'mixed'
                            ? { text: 'HI+EN', cls: 'bg-[#E9E4FF] text-[#43348F] dark:bg-[#27224B] dark:text-[#CFC6FF]' }
                            : { text: 'EN', cls: 'bg-[#E8F4FF] text-[#1A528C] dark:bg-[#162942] dark:text-[#93C5FD]' };
                      const isBusyLine = rerunningLineId === line.id;

                      return (
                        <div
                          key={line.id}
                          onMouseEnter={() => onHighlightLine(line.id)}
                          onMouseLeave={() => onHighlightLine(null)}
                          onClick={() => jumpToLineInEditor(line)}
                          className={`px-3.5 py-2 text-xs flex items-start gap-2 transition-colors cursor-pointer ${
                            highlightedLineId === line.id
                              ? 'bg-[#EAE6FF] dark:bg-[#27224B]'
                              : 'hover:bg-[#F7F6FC] dark:hover:bg-[#191D32]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <span className="font-mono text-[10px] text-[#777789] dark:text-[#9CA2BE]">
                              L{line.lineIndex + 1}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${scriptBadge.cls}`}>
                              {scriptBadge.text}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[#252536] dark:text-[#F2F4FC] leading-6 break-words"
                              style={{ fontFamily: "'Noto Sans Devanagari', 'Inter', system-ui, sans-serif" }}
                            >
                              {isBusyLine ? (
                                <em className="text-[#5B50E6] dark:text-[#A9A2FF]">Updating line...</em>
                              ) : line.text ? (
                                line.text
                              ) : (
                                <em className="text-[#8E8EA4]">(empty line)</em>
                              )}
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0 pt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="Re-read this line in Hindi"
                              disabled={isRecognizing || Boolean(rerunningLineId) || !canRerun}
                              onClick={() => onRerunSingleLine(page, line, 'hin')}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border border-[#E0DDF0] dark:border-[#2E3454] text-[#646478] dark:text-[#A5AAC4] hover:border-[#5B50E6] hover:text-[#5B50E6] dark:hover:text-[#CFC6FF] transition-colors cursor-pointer disabled:opacity-40"
                            >
                              HI
                            </button>
                            <button
                              type="button"
                              title="Re-read this line in English"
                              disabled={isRecognizing || Boolean(rerunningLineId) || !canRerun}
                              onClick={() => onRerunSingleLine(page, line, 'eng')}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border border-[#E0DDF0] dark:border-[#2E3454] text-[#646478] dark:text-[#A5AAC4] hover:border-[#5B50E6] hover:text-[#5B50E6] dark:hover:text-[#CFC6FF] transition-colors cursor-pointer disabled:opacity-40"
                            >
                              EN
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Editor Stats Footer */}
            <div className="px-4 py-2 border-t border-[#ECEAF4] dark:border-[#242840] bg-[#FAFAFC] dark:bg-[#131625] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#777789] dark:text-[#9CA2BE]">
              <span>
                {textStats.words} words · {textStats.lines} lines · {textStats.chars} chars
              </span>
              <span>Hindi & English ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
