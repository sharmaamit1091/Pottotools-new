import * as pdfjsLib from 'pdfjs-dist';
import {
  DetectedDotLeader,
  DetectedFormSlot,
  DetectedInteractiveField,
  PageMetaInfo,
  PdfTextSpanBox,
  WhiteoutPatch,
} from '../../types/fillPdfForm';

export interface AnalyzedPageLayout {
  pageNum: number;
  textSpans: PdfTextSpanBox[];
  slots: DetectedFormSlot[];
  dotLeaders: DetectedDotLeader[];
  isLikelyScanned: boolean;
}

interface RawBlankRun {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSizePt: number;
  placeholderKind: 'dots' | 'underline';
  dotCoverRect?: { x: number; y: number; width: number; height: number };
  source: 'text-layer' | 'canvas';
}

interface LineSegment {
  coord: number; // y for horizontal, x for vertical (in canvas px)
  start: number; // x0 for horizontal, y0 for vertical
  end: number;   // x1 for horizontal, y1 for vertical
}

const BLANK_CHARS_REGEX = /^[\s_.\-–—…•·‧∙]+$/;
const PURE_DOT_CHARS_REGEX = /^[\s.…•·‧∙]+$/;
const SINGLE_DOT_ITEM_REGEX = /^[.…•·‧∙]{1,2}$/;
// Matches dense dots ("...."), spaced dots (". . . ."), ellipses ("……"), middle dots ("····"), underlines ("___"), dashes ("----")
const INLINE_BLANK_RUN_REGEX = /(_{3,}|(?:\.[ \t]*){3,}\.?|…{2,}|(?:[·•‧∙][ \t]*){3,}|-{4,})/g;

/**
 * Estimate proportional visual character weight so splitting mixed PDF text runs
 * like "Name of Child ..................................." locates the EXACT pixel
 * boundary between proportional letters and narrow dots without ever clipping the label.
 */
function estimateCharWeight(ch: string): number {
  if (ch === '.' || ch === ',' || ch === ':' || ch === ';' || ch === '\'' || ch === ' ' || ch === '\t' || ch === '·' || ch === '‧' || ch === '∙') {
    return 0.28;
  }
  if (ch === 'i' || ch === 'l' || ch === 'I' || ch === '!' || ch === '|') return 0.28;
  if (ch === 'f' || ch === 'j' || ch === 'r' || ch === 't' || ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '-') return 0.36;
  if (ch === '…' || ch === '_' || ch === '–' || ch === '—' || ch === '•') return 0.56;
  if (ch === 'M' || ch === 'W') return 0.86;
  if (ch === 'm' || ch === 'w') return 0.8;
  if (ch >= 'A' && ch <= 'Z') return 0.68;
  return 0.54;
}

function computeProportionalRange(
  fullStr: string,
  startIdx: number,
  length: number
): { fracStart: number; fracLen: number } {
  let totalW = 0;
  let beforeW = 0;
  let rangeW = 0;
  const endIdx = startIdx + length;
  for (let i = 0; i < fullStr.length; i++) {
    const w = estimateCharWeight(fullStr[i]);
    if (i < startIdx) beforeW += w;
    else if (i < endIdx) rangeW += w;
    totalW += w;
  }
  if (totalW <= 0) return { fracStart: 0, fracLen: 1 };
  return {
    fracStart: beforeW / totalW,
    fracLen: rangeW / totalW,
  };
}

/**
 * Sample the dominant light paper background color just around a normalized rect on a rendered PDF canvas.
 * Avoids dark strokes/text pixels so whiteout blends naturally with cream/off-white/white forms.
 */
export function sampleBackgroundColorOnCanvas(
  canvas: HTMLCanvasElement | null,
  normRect: { x: number; y: number; width: number; height: number }
): string {
  if (!canvas || canvas.width < 10 || canvas.height < 10) return '#ffffff';
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#ffffff';

  const cw = canvas.width;
  const ch = canvas.height;
  const rx = Math.max(0, Math.min(cw - 1, Math.floor(normRect.x * cw)));
  const ry = Math.max(0, Math.min(ch - 1, Math.floor(normRect.y * ch)));
  const rw = Math.max(2, Math.min(cw - rx, Math.ceil(normRect.width * cw)));
  const rh = Math.max(2, Math.min(ch - ry, Math.ceil(normRect.height * ch)));

  // Expand slightly around the perimeter to sample clean paper pixels
  const pad = 3;
  const sx = Math.max(0, rx - pad);
  const sy = Math.max(0, ry - pad);
  const sw = Math.min(cw - sx, rw + pad * 2);
  const sh = Math.min(ch - sy, rh + pad * 2);

  try {
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    const brightSamples: Array<[number, number, number]> = [];

    // Sample perimeter & sparse interior pixels
    for (let py = 0; py < sh; py += Math.max(1, Math.floor(sh / 8))) {
      for (let px = 0; px < sw; px += Math.max(1, Math.floor(sw / 12))) {
        const idx = (py * sw + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        // Ignore dark ink/border pixels — keep paper background tones
        if (lum >= 195) {
          brightSamples.push([r, g, b]);
        }
      }
    }

    if (brightSamples.length === 0) return '#ffffff';

    // Pick median-bright paper pixel (75th percentile luminance) to resist anti-aliased edge gray
    brightSamples.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    const pick = brightSamples[Math.min(brightSamples.length - 1, Math.floor(brightSamples.length * 0.75))];
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(pick[0])}${toHex(pick[1])}${toHex(pick[2])}`;
  } catch {
    return '#ffffff';
  }
}

/**
 * Extract digital PDF text runs (split into clean word/label spans and embedded underline/dot-leader runs)
 * using exact PDF.js viewport coordinates and proportional glyph-width splitting.
 */
async function extractPageTextSpans(
  pdfJsDoc: any,
  pageNum: number
): Promise<{
  wordSpans: PdfTextSpanBox[];
  inlineBlankRuns: RawBlankRun[];
}> {
  const page = await pdfJsDoc.getPage(pageNum);
  const nativeRot = (((page.rotate || 0) % 360) + 360) % 360;
  const viewport = page.getViewport({ scale: 1.0, rotation: nativeRot });
  const vpW = Math.max(1, viewport.width);
  const vpH = Math.max(1, viewport.height);

  const wordSpans: PdfTextSpanBox[] = [];
  const inlineBlankRuns: RawBlankRun[] = [];
  const standaloneDots: Array<{
    x: number;
    y: number;
    baselineY: number;
    width: number;
    height: number;
    fontSizePt: number;
    text: string;
  }> = [];

  try {
    const tc = await page.getTextContent();
    const rawItems = (tc.items || []) as any[];
    let spanCounter = 0;

    for (const item of rawItems) {
      const rawStr = String(item?.str || '');
      if (!rawStr || !rawStr.trim()) continue;

      const tx = (pdfjsLib as any).Util.transform(viewport.transform, item.transform);
      const fontH = Math.max(6.5, Math.hypot(tx[2], tx[3]) || Math.abs(item.height) || 11);
      const itemW = Math.max(2, Math.abs(item.width) || rawStr.length * fontH * 0.48);
      const itemX = tx[4];
      const baselineY = tx[5];
      // PDF text origin is baseline; lift by ~86% of font height to visual top
      const itemY = baselineY - fontH * 0.86;
      const trimmedWhole = rawStr.trim();

      // 0. Collect standalone single/double dot items so PDFs that emit "." one glyph at a time merge cleanly!
      if (SINGLE_DOT_ITEM_REGEX.test(trimmedWhole)) {
        const bx = Math.max(0.002, Math.min(0.992, itemX / vpW));
        const by = Math.max(0.002, Math.min(0.992, itemY / vpH));
        const bw = Math.max(0.002, Math.min(1 - bx - 0.002, itemW / vpW));
        const bh = Math.max(0.011, Math.min(0.08, (fontH * 1.18) / vpH));
        standaloneDots.push({
          x: bx,
          y: by,
          baselineY: baselineY / vpH,
          width: bw,
          height: bh,
          fontSizePt: fontH,
          text: trimmedWhole,
        });
        continue;
      }

      // 1. If the entire item is purely underlines / dots (e.g. "........", ". . . . .", "________")
      if (BLANK_CHARS_REGEX.test(rawStr) && trimmedWhole.length >= 3) {
        const isDots = PURE_DOT_CHARS_REGEX.test(rawStr);
        const bx = Math.max(0.004, Math.min(0.98, itemX / vpW));
        const by = Math.max(0.004, Math.min(0.98, itemY / vpH));
        const bw = Math.max(0.02, Math.min(1 - bx - 0.004, itemW / vpW));
        const bh = Math.max(0.016, Math.min(0.08, (fontH * 1.28) / vpH));

        // Tight vertical ink band hugging the dots around the baseline so labels/borders above & below stay intact
        const dotTop = Math.max(0.002, (baselineY - fontH * 0.52) / vpH);
        const dotBot = Math.min(0.996, (baselineY + fontH * 0.26) / vpH);
        const dotCoverRect = isDots
          ? {
              x: Math.max(0.002, bx - 0.0015),
              y: dotTop,
              width: Math.min(1 - bx - 0.002, bw + 0.003),
              height: Math.max(0.009, dotBot - dotTop),
            }
          : undefined;

        inlineBlankRuns.push({
          x: bx,
          y: by,
          width: bw,
          height: bh,
          fontSizePt: fontH,
          placeholderKind: isDots ? 'dots' : 'underline',
          dotCoverRect,
          source: 'text-layer',
        });
        continue;
      }

      // 2. Split mixed strings like "Name of Child ..........................." or
      //    "Age: ______ in Years ______ in Months ______ in Days ______"
      const parts: Array<{ str: string; startIdx: number; isBlank: boolean }> = [];
      let lastIdx = 0;
      INLINE_BLANK_RUN_REGEX.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = INLINE_BLANK_RUN_REGEX.exec(rawStr)) !== null) {
        let matchStart = match.index;
        let matchedStr = match[0];

        // Preserve abbreviation periods attached to words (e.g. "Registration No. . . . .")
        // so "No." stays intact and only the trailing placeholder dots are covered!
        if (
          matchStart > 0 &&
          /[A-Za-z0-9]/.test(rawStr[matchStart - 1]) &&
          /^\.[ \t]+/.test(matchedStr)
        ) {
          const skipMatch = matchedStr.match(/^\.[ \t]+/);
          if (skipMatch) {
            matchStart += skipMatch[0].length;
            matchedStr = matchedStr.slice(skipMatch[0].length);
          }
        }

        // Guard against matching a normal 2-dot abbreviation; require >= 3 non-space blank chars
        const nonSpaceCount = matchedStr.replace(/\s+/g, '').length;
        if (nonSpaceCount < 3) continue;
        if (matchStart > lastIdx) {
          parts.push({ str: rawStr.slice(lastIdx, matchStart), startIdx: lastIdx, isBlank: false });
        }
        parts.push({ str: matchedStr, startIdx: matchStart, isBlank: true });
        lastIdx = matchStart + matchedStr.length;
      }
      if (lastIdx < rawStr.length) {
        parts.push({ str: rawStr.slice(lastIdx), startIdx: lastIdx, isBlank: false });
      }

      for (const part of parts) {
        const trimmed = part.str.trim();
        if (!trimmed) continue;

        const leadSpaces = part.str.length - part.str.trimStart().length;
        const charStart = part.startIdx + leadSpaces;
        const { fracStart, fracLen } = computeProportionalRange(rawStr, charStart, trimmed.length);

        const px = itemX + itemW * fracStart;
        const pw = Math.max(3, itemW * fracLen);

        const nx = Math.max(0.002, Math.min(0.992, px / vpW));
        const ny = Math.max(0.002, Math.min(0.992, itemY / vpH));
        const nw = Math.max(0.006, Math.min(1 - nx - 0.002, pw / vpW));
        const nh = Math.max(0.011, Math.min(0.09, (fontH * 1.18) / vpH));

        if (part.isBlank) {
          const isDots = PURE_DOT_CHARS_REGEX.test(trimmed);
          const dotTop = Math.max(0.002, (baselineY - fontH * 0.52) / vpH);
          const dotBot = Math.min(0.996, (baselineY + fontH * 0.26) / vpH);
          const dotCoverRect = isDots
            ? {
                x: Math.max(0.002, nx - 0.001),
                y: dotTop,
                width: Math.min(1 - nx - 0.002, nw + 0.0025),
                height: Math.max(0.009, dotBot - dotTop),
              }
            : undefined;

          inlineBlankRuns.push({
            x: nx,
            y: Math.max(0.004, ny - (fontH * 0.1) / vpH),
            width: nw,
            height: Math.max(0.016, (fontH * 1.32) / vpH),
            fontSizePt: fontH,
            placeholderKind: isDots ? 'dots' : 'underline',
            dotCoverRect,
            source: 'text-layer',
          });
        } else {
          // Further split multi-word runs on spaces so users can select individual words cleanly!
          const subTokens = part.str.match(/\S+/g);
          if (subTokens && subTokens.length > 1) {
            let searchFrom = 0;
            for (const tok of subTokens) {
              const idxInPart = part.str.indexOf(tok, searchFrom);
              searchFrom = idxInPart + tok.length;
              const { fracStart: tokStart, fracLen: tokFracW } = computeProportionalRange(
                rawStr,
                part.startIdx + idxInPart,
                tok.length
              );
              const tnx = Math.max(0.002, Math.min(0.992, (itemX + itemW * tokStart) / vpW));
              const tnw = Math.max(0.005, Math.min(1 - tnx - 0.002, (itemW * tokFracW) / vpW));
              spanCounter += 1;
              wordSpans.push({
                id: `span_p${pageNum}_${spanCounter}`,
                pageNum,
                text: tok,
                x: tnx,
                y: ny,
                width: tnw,
                height: nh,
                fontSizePt: fontH,
              });
            }
          } else {
            spanCounter += 1;
            wordSpans.push({
              id: `span_p${pageNum}_${spanCounter}`,
              pageNum,
              text: trimmed,
              x: nx,
              y: ny,
              width: nw,
              height: nh,
              fontSizePt: fontH,
            });
          }
        }
      }
    }

    // 3. Merge clusters of consecutive standalone "." text items on the same baseline into dot leaders!
    if (standaloneDots.length > 0) {
      standaloneDots.sort((a, b) =>
        Math.abs(a.baselineY - b.baselineY) > 0.008 ? a.baselineY - b.baselineY : a.x - b.x
      );

      const clusters: Array<typeof standaloneDots> = [];
      for (const dot of standaloneDots) {
        const lastCluster = clusters[clusters.length - 1];
        const prev = lastCluster?.[lastCluster.length - 1];
        const maxGapNorm = Math.max(0.02, (dot.fontSizePt * 1.8) / vpW);
        if (
          prev &&
          Math.abs(prev.baselineY - dot.baselineY) <= Math.max(0.008, (dot.fontSizePt * 0.45) / vpH) &&
          dot.x - (prev.x + prev.width) <= maxGapNorm &&
          dot.x >= prev.x - 0.004
        ) {
          lastCluster.push(dot);
        } else {
          clusters.push([dot]);
        }
      }

      for (const cl of clusters) {
        const totalChars = cl.reduce((acc, d) => acc + d.text.length, 0);
        const minX = cl[0].x;
        const maxX = Math.max(...cl.map((d) => d.x + d.width));
        const avgFont = cl.reduce((acc, d) => acc + d.fontSizePt, 0) / cl.length;
        const avgBaseY = cl.reduce((acc, d) => acc + d.baselineY, 0) / cl.length;
        const spanW = maxX - minX;

        if (totalChars >= 3 && spanW >= 0.02) {
          const textTop = Math.max(0.004, avgBaseY - (avgFont * 0.92) / vpH);
          const textH = Math.max(0.016, (avgFont * 1.32) / vpH);
          const dotTop = Math.max(0.002, avgBaseY - (avgFont * 0.52) / vpH);
          const dotBot = Math.min(0.996, avgBaseY + (avgFont * 0.26) / vpH);

          inlineBlankRuns.push({
            x: minX,
            y: textTop,
            width: Math.min(1 - minX - 0.004, spanW),
            height: textH,
            fontSizePt: avgFont,
            placeholderKind: 'dots',
            dotCoverRect: {
              x: Math.max(0.002, minX - 0.0015),
              y: dotTop,
              width: Math.min(1 - minX - 0.002, spanW + 0.003),
              height: Math.max(0.009, dotBot - dotTop),
            },
            source: 'text-layer',
          });
        } else {
          // Keep isolated periods as normal word spans
          for (const d of cl) {
            spanCounter += 1;
            wordSpans.push({
              id: `span_p${pageNum}_${spanCounter}`,
              pageNum,
              text: d.text,
              x: d.x,
              y: d.y,
              width: d.width,
              height: d.height,
              fontSizePt: d.fontSizePt,
            });
          }
        }
      }
    }
  } catch {
    // Scanned or image-only PDF with no text stream
  }

  return { wordSpans, inlineBlankRuns };
}

/**
 * Scan a rendered page canvas (downsampled for speed) to detect:
 * 1) Ruled table grids (intersecting horizontal & vertical lines -> individual table cells)
 * 2) Standalone horizontal underline segments
 * 3) Vector-drawn or scanned dotted placeholder lines (".............", ". . . . . .")
 *    distinguished from printed text by checking clean light paper air above & below the dot band!
 */
function detectCanvasLinesAndTables(
  canvas: HTMLCanvasElement,
  pageNum: number,
  pageMeta: PageMetaInfo,
  textSpans: PdfTextSpanBox[]
): {
  tableCells: DetectedFormSlot[];
  underlineBlanks: RawBlankRun[];
  canvasDotBlanks: RawBlankRun[];
} {
  const tableCells: DetectedFormSlot[] = [];
  const underlineBlanks: RawBlankRun[] = [];
  const canvasDotBlanks: RawBlankRun[] = [];

  if (!canvas || canvas.width < 60 || canvas.height < 60) {
    return { tableCells, underlineBlanks, canvasDotBlanks };
  }

  // Downsample to ~760px wide for ultra-fast (<15ms) crisp line analysis
  const targetW = Math.min(760, canvas.width);
  const scale = targetW / canvas.width;
  const w = Math.max(60, Math.round(canvas.width * scale));
  const h = Math.max(60, Math.round(canvas.height * scale));

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { tableCells, underlineBlanks, canvasDotBlanks };

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(canvas, 0, 0, w, h);

  let imgData: Uint8ClampedArray;
  try {
    imgData = ctx.getImageData(0, 0, w, h).data;
  } catch {
    work.width = 1;
    work.height = 1;
    return { tableCells, underlineBlanks, canvasDotBlanks };
  }

  // Build binary dark-pixel mask (1 = dark line/stroke pixel)
  const dark = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < imgData.length; i += 4, p++) {
    const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    if (lum < 175) dark[p] = 1;
  }

  // 1. Detect horizontal continuous line segments (allowing tiny 2px anti-aliasing/dot gaps)
  const rawHoriz: LineSegment[] = [];
  const minHorizLen = Math.max(18, Math.round(w * 0.032));
  for (let y = 2; y < h - 2; y++) {
    let x = 0;
    while (x < w) {
      if (!dark[y * w + x]) {
        x++;
        continue;
      }
      const start = x;
      let gap = 0;
      let lastDark = x;
      while (x < w) {
        // Check a 3px vertical band to handle slightly skewed scans
        const isDark =
          dark[y * w + x] ||
          (y > 0 && dark[(y - 1) * w + x]) ||
          (y + 1 < h && dark[(y + 1) * w + x]);
        if (isDark) {
          lastDark = x;
          gap = 0;
        } else {
          gap++;
          if (gap > 3) break;
        }
        x++;
      }
      const segLen = lastDark - start + 1;
      if (segLen >= minHorizLen) {
        // Reject thick solid black banner fills (check pixels 4px above and below)
        let thickCount = 0;
        const sampleStep = Math.max(1, Math.floor(segLen / 12));
        let samples = 0;
        for (let sx = start; sx <= lastDark; sx += sampleStep) {
          samples++;
          const aboveDark = y >= 4 && dark[(y - 4) * w + sx];
          const belowDark = y + 4 < h && dark[(y + 4) * w + sx];
          if (aboveDark && belowDark) thickCount++;
        }
        if (thickCount < samples * 0.65) {
          rawHoriz.push({ coord: y, start, end: lastDark });
        }
      }
    }
  }

  // Merge adjacent scanlines belonging to the same horizontal rule
  const mergedHoriz: LineSegment[] = [];
  for (const seg of rawHoriz) {
    const match = mergedHoriz.find(
      (m) =>
        Math.abs(m.coord - seg.coord) <= 3 &&
        seg.start <= m.end + 6 &&
        seg.end >= m.start - 6
    );
    if (match) {
      match.start = Math.min(match.start, seg.start);
      match.end = Math.max(match.end, seg.end);
      match.coord = Math.round((match.coord + seg.coord) / 2);
    } else {
      mergedHoriz.push({ ...seg });
    }
  }

  // 2. Detect vertical continuous line segments (for table columns)
  const rawVert: LineSegment[] = [];
  const minVertLen = Math.max(16, Math.round(h * 0.025));
  for (let x = 2; x < w - 2; x++) {
    let y = 0;
    while (y < h) {
      if (!dark[y * w + x]) {
        y++;
        continue;
      }
      const start = y;
      let gap = 0;
      let lastDark = y;
      while (y < h) {
        const isDark =
          dark[y * w + x] ||
          (x > 0 && dark[y * w + (x - 1)]) ||
          (x + 1 < w && dark[y * w + (x + 1)]);
        if (isDark) {
          lastDark = y;
          gap = 0;
        } else {
          gap++;
          if (gap > 3) break;
        }
        y++;
      }
      const segLen = lastDark - start + 1;
      if (segLen >= minVertLen) {
        let thickCount = 0;
        const sampleStep = Math.max(1, Math.floor(segLen / 12));
        let samples = 0;
        for (let sy = start; sy <= lastDark; sy += sampleStep) {
          samples++;
          const leftDark = x >= 4 && dark[sy * w + (x - 4)];
          const rightDark = x + 4 < w && dark[sy * w + (x + 4)];
          if (leftDark && rightDark) thickCount++;
        }
        if (thickCount < samples * 0.65) {
          rawVert.push({ coord: x, start, end: lastDark });
        }
      }
    }
  }

  const mergedVert: LineSegment[] = [];
  for (const seg of rawVert) {
    const match = mergedVert.find(
      (m) =>
        Math.abs(m.coord - seg.coord) <= 3 &&
        seg.start <= m.end + 6 &&
        seg.end >= m.start - 6
    );
    if (match) {
      match.start = Math.min(match.start, seg.start);
      match.end = Math.max(match.end, seg.end);
      match.coord = Math.round((match.coord + seg.coord) / 2);
    } else {
      mergedVert.push({ ...seg });
    }
  }

  // 3. Cluster intersecting horizontal + vertical lines into distinct tables
  const tol = 6;
  const hUsedInTable = new Set<number>();

  // Group horizontal lines that intersect with at least 2 vertical lines
  const gridHorizIndices: number[] = [];
  mergedHoriz.forEach((hSeg, hi) => {
    if (hSeg.end - hSeg.start < w * 0.18) return;
    let vCross = 0;
    for (const vSeg of mergedVert) {
      if (
        vSeg.coord >= hSeg.start - tol &&
        vSeg.coord <= hSeg.end + tol &&
        hSeg.coord >= vSeg.start - tol &&
        hSeg.coord <= vSeg.end + tol
      ) {
        vCross++;
      }
    }
    if (vCross >= 2) {
      gridHorizIndices.push(hi);
    }
  });

  // Partition grid horizontal lines into connected table components (sharing vertical dividers)
  const visitedH = new Set<number>();
  let tableCounter = 0;

  for (const startHi of gridHorizIndices) {
    if (visitedH.has(startHi)) continue;
    const compH: number[] = [];
    const compV = new Set<number>();
    const queue = [startHi];
    visitedH.add(startHi);

    while (queue.length > 0) {
      const hi = queue.shift()!;
      compH.push(hi);
      const hSeg = mergedHoriz[hi];

      mergedVert.forEach((vSeg, vi) => {
        if (
          vSeg.coord >= hSeg.start - tol &&
          vSeg.coord <= hSeg.end + tol &&
          hSeg.coord >= vSeg.start - tol &&
          hSeg.coord <= vSeg.end + tol
        ) {
          if (!compV.has(vi)) {
            compV.add(vi);
            // Pull in all horizontal lines intersecting this vertical line
            for (const otherHi of gridHorizIndices) {
              if (visitedH.has(otherHi)) continue;
              const oH = mergedHoriz[otherHi];
              if (
                vSeg.coord >= oH.start - tol &&
                vSeg.coord <= oH.end + tol &&
                oH.coord >= vSeg.start - tol &&
                oH.coord <= vSeg.end + tol
              ) {
                visitedH.add(otherHi);
                queue.push(otherHi);
              }
            }
          }
        }
      });
    }

    if (compH.length < 2 || compV.size < 2) continue;

    // Collect deduplicated sorted Y rows and X columns for this table
    const rowYs = Array.from(
      new Set(compH.map((idx) => mergedHoriz[idx].coord))
    ).sort((a, b) => a - b);

    const dedupYs: number[] = [];
    for (const ry of rowYs) {
      if (dedupYs.length === 0 || ry - dedupYs[dedupYs.length - 1] > 8) {
        dedupYs.push(ry);
      }
    }

    const colXs = Array.from(compV)
      .map((vi) => mergedVert[vi].coord)
      .sort((a, b) => a - b);
    const dedupXs: number[] = [];
    for (const cx of colXs) {
      if (dedupXs.length === 0 || cx - dedupXs[dedupXs.length - 1] > 10) {
        dedupXs.push(cx);
      }
    }

    if (dedupYs.length < 2 || dedupXs.length < 2) continue;

    // Mark horizontal lines used by this table so they aren't double-counted as standalone underlines
    compH.forEach((idx) => hUsedInTable.add(idx));

    tableCounter += 1;
    const tableId = `tbl_p${pageNum}_${tableCounter}`;

    for (let r = 0; r < dedupYs.length - 1; r++) {
      const y0 = dedupYs[r];
      const y1 = dedupYs[r + 1];
      const cellH = y1 - y0;
      if (cellH < 10 || cellH > h * 0.28) continue;

      for (let c = 0; c < dedupXs.length - 1; c++) {
        const x0 = dedupXs[c];
        const x1 = dedupXs[c + 1];
        const cellW = x1 - x0;
        if (cellW < 14) continue;

        // Verify cell actually has border presence (at least top or bottom horizontal line spans this column)
        const hasTop = compH.some(
          (hi) =>
            Math.abs(mergedHoriz[hi].coord - y0) <= 5 &&
            mergedHoriz[hi].start <= x0 + tol &&
            mergedHoriz[hi].end >= x1 - tol
        );
        const hasBottom = compH.some(
          (hi) =>
            Math.abs(mergedHoriz[hi].coord - y1) <= 5 &&
            mergedHoriz[hi].start <= x0 + tol &&
            mergedHoriz[hi].end >= x1 - tol
        );
        if (!hasTop && !hasBottom) continue;

        // Slight inward inset so typing never covers table grid borders
        const insetX = Math.min(3, cellW * 0.08);
        const insetY = Math.min(2, cellH * 0.08);

        const nx = (x0 + insetX) / w;
        const ny = (y0 + insetY) / h;
        const nw = Math.max(0.015, (cellW - insetX * 2) / w);
        const nh = Math.max(0.012, (cellH - insetY * 2) / h);

        // Skip cells that are completely filled with preprinted header/row-label text (e.g. "Examination", "Matric")
        // so clicking/selecting those preprinted headers selects the text instead of treating headers as empty inputs!
        const spansInside = textSpans.filter((sp) => {
          const cx = sp.x + sp.width / 2;
          const cy = sp.y + sp.height / 2;
          return cx >= nx - 0.003 && cx <= nx + nw + 0.003 && cy >= ny - 0.003 && cy <= ny + nh + 0.003;
        });

        // Also check dark ink pixel density inside the cell interior (for scanned PDFs with printed headers!)
        let interiorDark = 0;
        let interiorTotal = 0;
        const ix0 = Math.min(w - 1, Math.round(x0 + Math.max(4, cellW * 0.14)));
        const ix1 = Math.max(ix0 + 1, Math.round(x1 - Math.max(4, cellW * 0.14)));
        const iy0 = Math.min(h - 1, Math.round(y0 + Math.max(3, cellH * 0.18)));
        const iy1 = Math.max(iy0 + 1, Math.round(y1 - Math.max(3, cellH * 0.18)));
        for (let py = iy0; py < iy1; py += 2) {
          for (let px = ix0; px < ix1; px += 2) {
            interiorTotal++;
            if (dark[py * w + px]) interiorDark++;
          }
        }
        const inkRatio = interiorTotal > 0 ? interiorDark / interiorTotal : 0;

        // If it's the top header row and contains text/ink, don't auto-register as a fillable input slot
        // (user can still click/select header text or click anywhere if needed)
        const isPrintedHeaderOrLabel =
          (r === 0 && (spansInside.length > 0 || inkRatio > 0.045)) ||
          (c === 0 && spansInside.length > 0 && spansInside.reduce((acc, s) => acc + s.width, 0) > nw * 0.32);

        if (isPrintedHeaderOrLabel) continue;

        const cellHeightPt = nh * pageMeta.baseHeight;
        const suggestedFontSize = Math.max(8, Math.min(12, Math.floor(cellHeightPt * 0.56)));

        tableCells.push({
          id: `${tableId}_r${r}_c${c}`,
          pageNum,
          kind: 'table-cell',
          x: nx,
          y: ny,
          width: nw,
          height: nh,
          suggestedFontSize,
          tableId,
          row: r,
          col: c,
        });
      }
    }
  }

  // 4. Standalone horizontal underlines (not part of a full table grid) -> inline blank slots!
  mergedHoriz.forEach((hSeg, hi) => {
    if (hUsedInTable.has(hi)) return;
    const segW = hSeg.end - hSeg.start;
    if (segW < Math.max(16, w * 0.025) || segW > w * 0.88) return;

    const lineYNorm = hSeg.coord / h;
    const xNorm = hSeg.start / w;
    const wNorm = segW / w;

    // Skip page header/footer divider rules (very close to top/bottom margins)
    if (lineYNorm < 0.04 || lineYNorm > 0.97) return;

    // Estimate text height sitting just above this underline (default ~16 PDF points)
    const defaultHNorm = Math.max(0.018, 17 / Math.max(1, pageMeta.baseHeight));
    const slotTop = Math.max(0.004, lineYNorm - defaultHNorm);

    // Check if there is already dense printed text sitting directly ON TOP of this underline (i.e. underlined heading)
    const textAbove = textSpans.filter((sp) => {
      const spMidX = sp.x + sp.width / 2;
      const spBottom = sp.y + sp.height;
      return (
        spMidX >= xNorm &&
        spMidX <= xNorm + wNorm &&
        spBottom >= slotTop &&
        sp.y <= lineYNorm + 0.004
      );
    });
    const coveredWidth = textAbove.reduce((acc, s) => acc + s.width, 0);
    if (coveredWidth > wNorm * 0.45) return; // That's an underlined title, not a blank fill line

    underlineBlanks.push({
      x: xNorm,
      y: slotTop,
      width: wNorm,
      height: defaultHNorm,
      fontSizePt: 12,
      placeholderKind: 'underline',
      source: 'canvas',
    });
  });

  // 5. Detect vector-drawn or scanned dotted placeholder lines ("...........", ". . . . . .")
  //    A dotted leader has repeated tiny isolated dark dots (1..6px wide) along a thin horizontal band
  //    with clean blank paper air directly above (y-8..y-4) and below (y+4..y+6) — separating it cleanly
  //    from printed words (whose letter bodies fill y-8..y-4) and from solid table borders!
  interface RawDotBand {
    minY: number;
    maxY: number;
    startX: number;
    endX: number;
    dotCount: number;
  }

  const rawDotBands: RawDotBand[] = [];
  for (let y = 10; y < h - 8; y++) {
    let x = 3;
    while (x < w - 3) {
      // Check if column x has dark ink in [y-1..y+1] AND clean paper air above & below
      const hasDotInk =
        dark[y * w + x] === 1 ||
        dark[(y - 1) * w + x] === 1 ||
        dark[(y + 1) * w + x] === 1;
      if (!hasDotInk) {
        x++;
        continue;
      }

      const aboveBlocked =
        dark[(y - 5) * w + x] === 1 ||
        dark[(y - 6) * w + x] === 1 ||
        dark[(y - 7) * w + x] === 1;
      const belowBlocked = dark[(y + 5) * w + x] === 1 || dark[(y + 6) * w + x] === 1;
      if (aboveBlocked || belowBlocked) {
        x++;
        continue;
      }

      // Measure this single dot width
      const chainStart = x;
      let dotCount = 0;
      let chainEnd = x;

      while (x < w - 3) {
        // Measure one dark speck
        const dotStart = x;
        let dotAirBad = false;
        while (x < w - 3) {
          const ink =
            dark[y * w + x] === 1 ||
            dark[(y - 1) * w + x] === 1 ||
            dark[(y + 1) * w + x] === 1;
          if (!ink) break;
          if (
            dark[(y - 5) * w + x] === 1 ||
            dark[(y - 6) * w + x] === 1 ||
            dark[(y - 7) * w + x] === 1 ||
            dark[(y + 5) * w + x] === 1 ||
            dark[(y + 6) * w + x] === 1
          ) {
            dotAirBad = true;
            break;
          }
          x++;
        }
        const dotW = x - dotStart;
        if (dotAirBad || dotW <= 0 || dotW > 7) {
          // Either hit tall text/border or a solid continuous line (>7px) — end this dot chain!
          break;
        }
        dotCount += 1;
        chainEnd = x - 1;

        // Measure white gap to next dot (1..14px)
        const gapStart = x;
        while (x < w - 3 && x - gapStart <= 14) {
          const ink =
            dark[y * w + x] === 1 ||
            dark[(y - 1) * w + x] === 1 ||
            dark[(y + 1) * w + x] === 1;
          if (ink) break;
          x++;
        }
        const gapW = x - gapStart;
        if (gapW === 0 || gapW > 14) break;
      }

      const spanW = chainEnd - chainStart + 1;
      if (dotCount >= 5 && spanW >= Math.max(20, Math.round(w * 0.03))) {
        // Verify overall clear-air band above (y-8..y-4) across the full chain has < 8% dark pixels
        let airDark = 0;
        let airTotal = 0;
        for (let sx = chainStart; sx <= chainEnd; sx += 2) {
          for (let sy = y - 8; sy <= y - 4; sy++) {
            airTotal++;
            if (dark[sy * w + sx]) airDark++;
          }
        }
        if (airTotal > 0 && airDark / airTotal < 0.08) {
          // Verify it's not a continuous horizontal table line already detected
          const overlapsTableLine = mergedHoriz.some(
            (mh, hi) =>
              hUsedInTable.has(hi) &&
              Math.abs(mh.coord - y) <= 4 &&
              mh.start <= chainEnd &&
              mh.end >= chainStart
          );
          if (!overlapsTableLine) {
            rawDotBands.push({
              minY: Math.max(1, y - 1),
              maxY: Math.min(h - 2, y + 1),
              startX: chainStart,
              endX: chainEnd,
              dotCount,
            });
          }
        }
      }

      if (x <= chainStart) x = chainStart + 1;
    }
  }

  // Merge vertically adjacent scanlines belonging to the same dotted placeholder
  const mergedDotBands: RawDotBand[] = [];
  for (const band of rawDotBands) {
    const existing = mergedDotBands.find(
      (m) =>
        band.minY <= m.maxY + 3 &&
        band.maxY >= m.minY - 3 &&
        band.startX <= m.endX + 8 &&
        band.endX >= m.startX - 8
    );
    if (existing) {
      existing.minY = Math.min(existing.minY, band.minY);
      existing.maxY = Math.max(existing.maxY, band.maxY);
      existing.startX = Math.min(existing.startX, band.startX);
      existing.endX = Math.max(existing.endX, band.endX);
      existing.dotCount = Math.max(existing.dotCount, band.dotCount);
    } else {
      mergedDotBands.push({ ...band });
    }
  }

  for (const db of mergedDotBands) {
    const lineYNorm = db.maxY / h;
    if (lineYNorm < 0.03 || lineYNorm > 0.98) continue;

    // Expand tightly by ~2px to cleanly cover anti-aliased gray edges of the dots, while checking no tall ink sits at edges
    const coverX0 = Math.max(1, db.startX - 2);
    const coverX1 = Math.min(w - 2, db.endX + 2);
    const coverY0 = Math.max(1, db.minY - 2);
    const coverY1 = Math.min(h - 2, db.maxY + 2);

    const xNorm = coverX0 / w;
    const wNorm = Math.max(0.02, (coverX1 - coverX0 + 1) / w);
    const coverYNorm = coverY0 / h;
    const coverHNorm = Math.max(0.008, (coverY1 - coverY0 + 1) / h);

    const defaultHNorm = Math.max(0.018, 17 / Math.max(1, pageMeta.baseHeight));
    const slotTop = Math.max(0.004, lineYNorm - defaultHNorm * 0.85);

    canvasDotBlanks.push({
      x: xNorm,
      y: slotTop,
      width: wNorm,
      height: defaultHNorm,
      fontSizePt: 12,
      placeholderKind: 'dots',
      dotCoverRect: {
        x: xNorm,
        y: coverYNorm,
        width: wNorm,
        height: coverHNorm,
      },
      source: 'canvas',
    });
  }

  work.width = 1;
  work.height = 1;
  return { tableCells, underlineBlanks, canvasDotBlanks };
}

/**
 * Trim a dot-cover rectangle strictly away from any adjacent digital printed wordSpans on the same line
 * so labels like "Name of Child", "Date of Birth", "Father's Name" are NEVER touched or clipped!
 */
function trimDotCoverAgainstWordSpans(
  rect: { x: number; y: number; width: number; height: number },
  wordSpans: PdfTextSpanBox[]
): { x: number; y: number; width: number; height: number } | null {
  let x0 = rect.x;
  let x1 = rect.x + rect.width;
  const midY = rect.y + rect.height / 2;

  for (const sp of wordSpans) {
    const sameLine = midY >= sp.y - 0.004 && midY <= sp.y + sp.height + 0.006;
    if (!sameLine) continue;
    const spX0 = sp.x;
    const spX1 = sp.x + sp.width;
    // Skip spans completely outside horizontally
    if (spX1 <= x0 || spX0 >= x1) continue;

    // If wordSpan sits on the left edge, push x0 strictly past the wordSpan
    if (spX0 <= x0 + 0.012 && spX1 < x1 - 0.015) {
      x0 = Math.max(x0, spX1 + 0.002);
    } else if (spX0 > x0 + 0.015 && spX1 >= x1 - 0.012) {
      // WordSpan sits on the right edge -> stop strictly before it
      x1 = Math.min(x1, spX0 - 0.002);
    }
  }

  if (x1 - x0 < 0.015) return null;
  return {
    x: x0,
    y: rect.y,
    width: x1 - x0,
    height: rect.height,
  };
}

/**
 * Detect multiple independent inline blank slots AND clean dot-leader metadata on each line:
 * - Preserves independent small sibling fields on the same line
 *   ("Age: ___ in Years ___ in Months ___ in Days ___", "Date: ___ Month: ___ Year: ___")
 * - Keeps single-field lines ("Name of Child ........", "Father's Address: ........")
 *   flexible (`hasRightSibling: false`) so typing expands horizontally across the page!
 */
function buildInlineBlankSlotsAndDotLeaders(
  pageNum: number,
  pageMeta: PageMetaInfo,
  textSpans: PdfTextSpanBox[],
  rawBlanks: RawBlankRun[],
  tableCells: DetectedFormSlot[],
  interactiveFields: DetectedInteractiveField[]
): {
  inlineSlots: DetectedFormSlot[];
  dotLeaders: DetectedDotLeader[];
} {
  const candidates: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    suggestedFontSize: number;
    placeholderKind: 'dots' | 'underline' | 'gap';
    dotCoverRect?: { x: number; y: number; width: number; height: number };
    hasRightSibling: boolean;
    source: 'text-layer' | 'canvas';
  }> = [];

  const dotLeaders: DetectedDotLeader[] = [];

  const overlapsExisting = (
    box: { x: number; y: number; width: number; height: number },
    list: Array<{ x: number; y: number; width: number; height: number }>
  ) => {
    const bx1 = box.x;
    const by1 = box.y;
    const bx2 = box.x + box.width;
    const by2 = box.y + box.height;
    return list.some((o) => {
      const ix = Math.max(0, Math.min(bx2, o.x + o.width) - Math.max(bx1, o.x));
      const iy = Math.max(0, Math.min(by2, o.y + o.height) - Math.max(by1, o.y));
      if (ix <= 0 || iy <= 0) return false;
      const minW = Math.min(box.width, o.width);
      const minH = Math.min(box.height, o.height);
      return ix >= minW * 0.25 && iy >= minH * 0.35;
    });
  };

  const occupiedRegions = [
    ...tableCells,
    ...interactiveFields.filter((f) => f.pageNum === pageNum),
  ];

  // Helper: check if another printed wordSpan sits to the right on the same visual line
  const hasLabelToRight = (boxX: number, boxW: number, boxY: number, boxH: number): boolean => {
    const rightEdge = boxX + boxW;
    return textSpans.some((sp) => {
      const sameLine = sp.y < boxY + boxH * 0.9 && sp.y + sp.height > boxY + boxH * 0.1;
      return sameLine && sp.x >= rightEdge - 0.01 && sp.x <= 0.95;
    });
  };

  // Prioritize text-layer dot leaders first, then canvas dot leaders, then underlines
  const prioritizedBlanks = [...rawBlanks].sort((a, b) => {
    const score = (r: RawBlankRun) =>
      r.placeholderKind === 'dots' ? (r.source === 'text-layer' ? 0 : 1) : 2;
    return score(a) - score(b);
  });

  // 1. Add all explicit dot-leader & underline blank fields (splitting cleanly around any printed labels)
  for (const rb of prioritizedBlanks) {
    if (rb.width < 0.02) continue;

    const lineSpans = textSpans
      .filter(
        (sp) =>
          Math.abs(sp.y + sp.height / 2 - (rb.y + rb.height / 2)) < Math.max(rb.height * 0.9, 0.016) &&
          sp.x + sp.width > rb.x + 0.004 &&
          sp.x < rb.x + rb.width - 0.004
      )
      .sort((a, b) => a.x - b.x);

    const subRanges: Array<{ x: number; w: number }> = [];
    let cursorX = rb.x;
    for (const sp of lineSpans) {
      if (sp.x - cursorX >= 0.02) {
        subRanges.push({ x: cursorX, w: sp.x - cursorX - 0.003 });
      }
      cursorX = Math.max(cursorX, sp.x + sp.width + 0.003);
    }
    if (rb.x + rb.width - cursorX >= 0.02) {
      subRanges.push({ x: cursorX, w: rb.x + rb.width - cursorX });
    }

    for (const sr of subRanges) {
      let refinedCover: { x: number; y: number; width: number; height: number } | undefined;
      if (rb.placeholderKind === 'dots') {
        const rawCover = rb.dotCoverRect
          ? {
              x: Math.max(rb.dotCoverRect.x, sr.x - 0.0015),
              y: rb.dotCoverRect.y,
              width: Math.min(rb.dotCoverRect.x + rb.dotCoverRect.width, sr.x + sr.w + 0.002) -
                Math.max(rb.dotCoverRect.x, sr.x - 0.0015),
              height: rb.dotCoverRect.height,
            }
          : {
              x: sr.x,
              y: rb.y + rb.height * 0.48,
              width: sr.w,
              height: Math.max(0.009, rb.height * 0.52),
            };
        const trimmed = trimDotCoverAgainstWordSpans(rawCover, textSpans);
        if (trimmed) refinedCover = trimmed;
      }

      const boxX = refinedCover ? refinedCover.x : Math.max(0.004, sr.x);
      const boxW = refinedCover ? refinedCover.width : Math.min(1 - sr.x - 0.004, sr.w);
      const box = {
        x: boxX,
        y: Math.max(0.004, rb.y),
        width: Math.max(0.02, Math.min(1 - boxX - 0.004, boxW)),
        height: Math.max(0.018, rb.height),
        suggestedFontSize: Math.max(10, Math.min(13, Math.round(rb.fontSizePt))),
        placeholderKind: rb.placeholderKind,
        dotCoverRect: refinedCover,
        hasRightSibling: hasLabelToRight(boxX, boxW, rb.y, rb.height),
        source: rb.source,
      };

      // Always record unique dot leaders even if a slot overlaps an AcroForm/table region,
      // unless another dot leader already covers the exact same band
      if (refinedCover && !overlapsExisting(refinedCover, dotLeaders)) {
        dotLeaders.push({
          id: `dot_p${pageNum}_${dotLeaders.length + 1}`,
          pageNum,
          x: refinedCover.x,
          y: refinedCover.y,
          width: refinedCover.width,
          height: refinedCover.height,
          textY: box.y,
          textHeight: box.height,
          fontSizePt: box.suggestedFontSize,
          source: rb.source,
        });
      }

      if (!overlapsExisting(box, occupiedRegions) && !overlapsExisting(box, candidates)) {
        candidates.push(box);
      }
    }
  }

  // 2. Analyze text lines for colon-separated / multi-field prompts even without underlines!
  //    Examples: "Date:   Month:   Year:  " or "Age:   in Years   in Months   in Days  "
  const sortedSpans = [...textSpans].sort((a, b) =>
    Math.abs(a.y - b.y) > 0.012 ? a.y - b.y : a.x - b.x
  );
  const rows: PdfTextSpanBox[][] = [];
  for (const sp of sortedSpans) {
    const lastRow = rows[rows.length - 1];
    if (lastRow && Math.abs(lastRow[0].y - sp.y) <= Math.max(0.011, sp.height * 0.7)) {
      lastRow.push(sp);
    } else {
      rows.push([sp]);
    }
  }

  const FIELD_PROMPT_KEYWORD =
    /(:|date|month|year|years|months|days|age|sex|gender|name|address|phone|mobile|email|pin|dob|roll|no\.?|marks|board|father|mother)$/i;

  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 0; i < row.length; i++) {
      const cur = row[i];
      const next = row[i + 1];
      const curRight = cur.x + cur.width;
      const gapRight = next ? next.x - curRight : 0.96 - curRight;

      const hasExplicitSlotAfter = candidates.some(
        (c) =>
          Math.abs(c.y + c.height / 2 - (cur.y + cur.height / 2)) <= Math.max(cur.height, 0.016) &&
          c.x >= curRight - 0.012 &&
          c.x <= (next ? next.x : curRight + 0.14)
      );
      if (hasExplicitSlotAfter) continue;

      const isPrompt = FIELD_PROMPT_KEYWORD.test(cur.text.trim());
      const nextIsUnit = next && /^(years?|months?|days?|in)$/i.test(next.text.trim());

      if ((isPrompt || nextIsUnit) && gapRight >= 0.042) {
        const slotX = curRight + 0.006;
        // If there is NO sibling label to the right, give full comfortable width up to page right margin!
        const maxSlotW = next ? gapRight - 0.01 : Math.min(0.65, gapRight - 0.01);
        if (maxSlotW < 0.025) continue;

        const slotH = Math.max(0.019, (cur.fontSizePt * 1.32) / Math.max(1, pageMeta.baseHeight));
        const box = {
          x: slotX,
          y: Math.max(0.004, cur.y - 0.002),
          width: maxSlotW,
          height: slotH,
          label: cur.text.replace(/[:._-]+$/, '').trim(),
          suggestedFontSize: Math.max(10, Math.min(13, Math.round(cur.fontSizePt))),
          placeholderKind: 'gap' as const,
          hasRightSibling: Boolean(next),
          source: 'text-layer' as const,
        };
        if (!overlapsExisting(box, occupiedRegions) && !overlapsExisting(box, candidates)) {
          candidates.push(box);
        }
      }
    }
  }

  const inlineSlots: DetectedFormSlot[] = candidates.map((c, idx) => ({
    id: `slot_p${pageNum}_${idx + 1}`,
    pageNum,
    kind: 'inline-blank',
    x: c.x,
    y: c.y,
    width: c.width,
    height: c.height,
    label: c.label,
    suggestedFontSize: c.suggestedFontSize,
    placeholderKind: c.placeholderKind,
    dotCoverRect: c.dotCoverRect,
    hasRightSibling: c.hasRightSibling,
  }));

  return { inlineSlots, dotLeaders };
}

/**
 * Full fast page layout analysis (combines PDF.js text geometry + rendered canvas line/table/dot-leader geometry).
 * Runs locally in ~15–35ms per page with zero external dependencies.
 */
export async function analyzePageFormLayout(
  pdfJsDoc: any,
  pageNum: number,
  pageMeta: PageMetaInfo,
  renderedCanvas: HTMLCanvasElement,
  interactiveFields: DetectedInteractiveField[]
): Promise<AnalyzedPageLayout> {
  const { wordSpans, inlineBlankRuns } = await extractPageTextSpans(pdfJsDoc, pageNum);
  const { tableCells, underlineBlanks, canvasDotBlanks } = detectCanvasLinesAndTables(
    renderedCanvas,
    pageNum,
    pageMeta,
    wordSpans
  );

  const { inlineSlots, dotLeaders } = buildInlineBlankSlotsAndDotLeaders(
    pageNum,
    pageMeta,
    wordSpans,
    [...inlineBlankRuns, ...canvasDotBlanks, ...underlineBlanks],
    tableCells,
    interactiveFields
  );

  const allSlots = [...tableCells, ...inlineSlots].sort((a, b) => {
    if (a.tableId && b.tableId && a.tableId === b.tableId) {
      if ((a.row ?? 0) !== (b.row ?? 0)) return (a.row ?? 0) - (b.row ?? 0);
      return (a.col ?? 0) - (b.col ?? 0);
    }
    if (Math.abs(a.y - b.y) > 0.014) return a.y - b.y;
    return a.x - b.x;
  });

  return {
    pageNum,
    textSpans: wordSpans,
    slots: allSlots,
    dotLeaders,
    isLikelyScanned: wordSpans.length < 4,
  };
}

/**
 * Compute exact background-matched dot cover patches for a text entry based on:
 * - Any dot leader it sits directly on top of (full field dot run from dot start to dot end,
 *   clipped past any existing entry to the left on the same line!)
 * - Any additional dot leaders on subsequent lines when typing multiline text (e.g. Address across 2–3 dotted lines!)
 * Never touches printed labels or unrelated dots elsewhere on the page.
 */
export function computeDotCoversForEntry(
  entryRect: { pageNum: number; x: number; y: number; width: number; height: number },
  layout: AnalyzedPageLayout | undefined,
  fillColor: string,
  primaryDotLeader?: DetectedDotLeader,
  otherEntriesOnPage: Array<{ id?: string; x: number; y: number; width: number; height: number }> = []
): WhiteoutPatch[] {
  const leaders: DetectedDotLeader[] = [];
  const seenIds = new Set<string>();

  if (primaryDotLeader) {
    leaders.push(primaryDotLeader);
    seenIds.add(primaryDotLeader.id);
  }

  if (layout && layout.dotLeaders.length > 0) {
    const ex0 = entryRect.x;
    const ex1 = entryRect.x + entryRect.width;
    const ey0 = entryRect.y;
    const ey1 = entryRect.y + entryRect.height;

    for (const dl of layout.dotLeaders) {
      if (seenIds.has(dl.id)) continue;
      const dlMidY = dl.y + dl.height / 2;
      const verticalOverlap = dlMidY >= ey0 - 0.004 && dlMidY <= ey1 + 0.008;
      if (!verticalOverlap) continue;

      const horizOverlap = dl.x < ex1 + 0.004 && dl.x + dl.width > ex0 - 0.006;
      if (!horizOverlap) continue;

      leaders.push(dl);
      seenIds.add(dl.id);
    }
  }

  if (leaders.length === 0) return [];

  const patches: WhiteoutPatch[] = [];
  for (const dl of leaders) {
    let coverX0 = dl.x;
    const coverX1 = dl.x + dl.width;

    // If this is a secondary line below line 1, clip to start no further left than the text box itself
    // (unless the entire line is a continuation blank with no label to its left!)
    const isPrimary = primaryDotLeader && dl.id === primaryDotLeader.id;
    if (!isPrimary) {
      // Check if there is a printed label immediately to the left of this dot leader on this line
      const hasLeftLabel = layout?.textSpans.some((sp) => {
        const sameLine = Math.abs(sp.y + sp.height / 2 - (dl.y + dl.height / 2)) <= 0.014;
        return sameLine && sp.x + sp.width <= dl.x + 0.015;
      });
      if (hasLeftLabel) {
        coverX0 = Math.max(dl.x, entryRect.x - 0.002);
      }
    }

    // Never overwrite another existing typed entry sitting to the left on the same dotted line
    for (const other of otherEntriesOnPage) {
      const sameLine =
        other.y < dl.y + dl.height + 0.006 && other.y + other.height > dl.y - 0.01;
      if (sameLine && other.x + other.width <= entryRect.x + 0.004) {
        coverX0 = Math.max(coverX0, other.x + other.width + 0.002);
      }
    }

    if (coverX1 - coverX0 < 0.01) continue;

    patches.push({
      id: `dc_${dl.id}`,
      pageNum: entryRect.pageNum,
      x: coverX0,
      y: dl.y,
      width: coverX1 - coverX0,
      height: dl.height,
      fillColor: fillColor || '#ffffff',
      removedText: 'dot-leader',
    });
  }

  return patches;
}

/**
 * Find the specific dot leader under or immediately below a click point (normX, normY).
 */
export function findDotLeaderAtPoint(
  normX: number,
  normY: number,
  layout: AnalyzedPageLayout | undefined
): DetectedDotLeader | undefined {
  if (!layout || layout.dotLeaders.length === 0) return undefined;
  return layout.dotLeaders.find(
    (dl) =>
      normX >= dl.x - 0.012 &&
      normX <= dl.x + dl.width + 0.012 &&
      normY >= dl.textY - 0.006 &&
      normY <= dl.y + dl.height + 0.01
  );
}

/**
 * Given a raw click at normalized (normX, normY) on a page, determine exact placement:
 * 1) Table cell -> snaps cleanly inside cell borders (`boundedBox: true`).
 * 2) Tight multi-field inline slot (with right sibling label like "in Years", "Month:") ->
 *    snaps cleanly into that slot (`boundedBox: true`, `maxAutoWidth: slot.width`).
 * 3) Single-field dotted line / open blank -> flexible auto-expanding box (`boundedBox: false`)
 *    that preserves exact click location (or neat start alignment when clicking near start of dots)
 *    and automatically links its detected dot leader!
 * 4) Freehand click anywhere else -> cursor at exact (normX, normY), expands horizontally across
 *    available page space (stopping before a tight same-line sibling label if one exists).
 */
export function resolveSmartClickPlacement(
  normX: number,
  normY: number,
  pageMeta: PageMetaInfo,
  layout: AnalyzedPageLayout | undefined,
  defaultFontSize: number,
  existingEntriesOnPage: Array<{ x: number; y: number; width: number; height: number }>
): {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  slot?: DetectedFormSlot;
  dotLeader?: DetectedDotLeader;
  boundedBox: boolean;
  maxAutoWidth: number;
} {
  const lineHeightPt = defaultFontSize * 1.28;
  const padPt = 2;
  const defaultLineHNorm = Math.max(0.022, (lineHeightPt + padPt * 2) / Math.max(1, pageMeta.baseHeight));

  if (layout) {
    // 1. Exact hit inside a detected table cell (strict grid geometry)
    const hitCell = layout.slots.find(
      (s) =>
        s.kind === 'table-cell' &&
        normX >= s.x - 0.002 &&
        normX <= s.x + s.width + 0.002 &&
        normY >= s.y - 0.002 &&
        normY <= s.y + s.height + 0.002
    );
    if (hitCell) {
      return {
        x: hitCell.x,
        y: hitCell.y,
        width: hitCell.width,
        height: hitCell.height,
        fontSize: Math.min(defaultFontSize, hitCell.suggestedFontSize || 11),
        slot: hitCell,
        boundedBox: true,
        maxAutoWidth: hitCell.width,
      };
    }

    // 2. Check if click landed on or right above a detected dotted placeholder line
    const hitDotLeader = findDotLeaderAtPoint(normX, normY, layout);
    const hitBlank = layout.slots.find(
      (s) =>
        s.kind === 'inline-blank' &&
        normX >= s.x - 0.008 &&
        normX <= s.x + s.width + 0.008 &&
        normY >= s.y - 0.008 &&
        normY <= s.y + s.height + 0.01
    );

    if (hitBlank) {
      const matchedDot =
        hitDotLeader ||
        (hitBlank.placeholderKind === 'dots' && hitBlank.dotCoverRect
          ? layout.dotLeaders.find(
              (dl) =>
                Math.abs(dl.x - hitBlank.dotCoverRect!.x) < 0.015 &&
                Math.abs(dl.y - hitBlank.dotCoverRect!.y) < 0.015
            )
          : undefined);

      // Compute available right space on this line
      let rightLimit = 0.985;
      if (hitBlank.hasRightSibling) {
        rightLimit = Math.min(0.985, hitBlank.x + hitBlank.width);
      } else {
        for (const sp of layout.textSpans) {
          const sameLine =
            sp.y < hitBlank.y + hitBlank.height * 0.85 &&
            sp.y + sp.height > hitBlank.y + hitBlank.height * 0.15;
          if (sameLine && sp.x > hitBlank.x + 0.01 && sp.x - 0.005 < rightLimit) {
            rightLimit = sp.x - 0.005;
          }
        }
      }

      // Snap cleanly to start of blank when clicking near its left start (or inside a tight sibling blank),
      // otherwise respect exact clicked X on wide lines!
      const clickedNearStart = normX <= hitBlank.x + 0.045 || Boolean(hitBlank.hasRightSibling);
      const placedX = clickedNearStart
        ? hitBlank.x
        : Math.max(hitBlank.x, Math.min(rightLimit - 0.04, normX));
      const maxAutoWidth = Math.max(0.045, rightLimit - placedX);
      const initialW = hitBlank.hasRightSibling
        ? hitBlank.width
        : Math.min(maxAutoWidth, Math.max(0.14, hitBlank.x + hitBlank.width - placedX));

      return {
        x: placedX,
        y: hitBlank.y,
        width: initialW,
        height: Math.max(hitBlank.height, defaultLineHNorm),
        fontSize: Math.min(defaultFontSize, hitBlank.suggestedFontSize || defaultFontSize),
        slot: hitBlank,
        dotLeader: matchedDot,
        boundedBox: Boolean(hitBlank.hasRightSibling),
        maxAutoWidth,
      };
    }

    // 3. Direct click on a detected dot leader that wasn't registered as an inline slot
    if (hitDotLeader) {
      let rightLimit = 0.985;
      for (const sp of layout.textSpans) {
        const sameLine =
          sp.y < hitDotLeader.textY + hitDotLeader.textHeight * 0.85 &&
          sp.y + sp.height > hitDotLeader.textY + hitDotLeader.textHeight * 0.15;
        if (sameLine && sp.x > hitDotLeader.x + 0.01 && sp.x - 0.005 < rightLimit) {
          rightLimit = sp.x - 0.005;
        }
      }
      const clickedNearStart = normX <= hitDotLeader.x + 0.045;
      const placedX = clickedNearStart
        ? hitDotLeader.x
        : Math.max(hitDotLeader.x, Math.min(rightLimit - 0.04, normX));
      const maxAutoWidth = Math.max(0.05, rightLimit - placedX);
      const hasTightRight = rightLimit < 0.95;

      return {
        x: placedX,
        y: hitDotLeader.textY,
        width: Math.min(maxAutoWidth, Math.max(0.14, hitDotLeader.x + hitDotLeader.width - placedX)),
        height: Math.max(hitDotLeader.textHeight, defaultLineHNorm),
        fontSize: Math.min(defaultFontSize, hitDotLeader.fontSizePt || defaultFontSize),
        dotLeader: hitDotLeader,
        boundedBox: hasTightRight,
        maxAutoWidth,
      };
    }
  }

  // 4. Freehand click anywhere else on the page: cursor appears at the EXACT clicked location!
  const padXNorm = padPt / Math.max(1, pageMeta.baseWidth);
  const x = Math.max(0.004, Math.min(0.94, normX - padXNorm));
  const y = Math.max(0.004, Math.min(0.97 - defaultLineHNorm, normY - defaultLineHNorm * 0.52));

  let rightBarrier = 0.988;

  if (layout) {
    // Stop auto-expand before the next printed text span on the same visual line
    for (const sp of layout.textSpans) {
      const sameLine =
        sp.y < y + defaultLineHNorm * 0.85 && sp.y + sp.height > y + defaultLineHNorm * 0.15;
      if (sameLine && sp.x > normX + 0.008 && sp.x - 0.005 < rightBarrier) {
        rightBarrier = sp.x - 0.005;
      }
    }
    // Also stop before any table cell boundary to the right on the same line
    for (const sl of layout.slots) {
      if (sl.kind !== 'table-cell') continue;
      const sameLine =
        sl.y < y + defaultLineHNorm * 0.85 && sl.y + sl.height > y + defaultLineHNorm * 0.15;
      if (sameLine && sl.x > normX + 0.008 && sl.x - 0.004 < rightBarrier) {
        rightBarrier = sl.x - 0.004;
      }
    }
  }

  // Also stop before another already-typed entry on the same line
  for (const ex of existingEntriesOnPage) {
    const sameLine =
      ex.y < y + defaultLineHNorm * 0.85 && ex.y + ex.height > y + defaultLineHNorm * 0.15;
    if (sameLine && ex.x > normX + 0.008 && ex.x - 0.005 < rightBarrier) {
      rightBarrier = ex.x - 0.005;
    }
  }

  const maxAutoWidth = Math.max(0.045, rightBarrier - x);
  const hasTightBarrier = rightBarrier < 0.95;

  return {
    x,
    y,
    width: hasTightBarrier ? maxAutoWidth : Math.min(maxAutoWidth, 0.22),
    height: defaultLineHNorm,
    fontSize: defaultFontSize,
    boundedBox: hasTightBarrier,
    maxAutoWidth,
  };
}
