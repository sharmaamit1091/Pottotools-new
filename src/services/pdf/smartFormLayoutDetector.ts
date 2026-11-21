import * as pdfjsLib from 'pdfjs-dist';
import {
  DetectedFormSlot,
  DetectedInteractiveField,
  PageMetaInfo,
  PdfTextSpanBox,
} from '../../types/fillPdfForm';

export interface AnalyzedPageLayout {
  pageNum: number;
  textSpans: PdfTextSpanBox[];
  slots: DetectedFormSlot[];
  isLikelyScanned: boolean;
}

interface RawSpan {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSizePt: number;
}

interface LineSegment {
  coord: number; // y for horizontal, x for vertical (in canvas px)
  start: number; // x0 for horizontal, y0 for vertical
  end: number;   // x1 for horizontal, y1 for vertical
}

const BLANK_CHARS_REGEX = /^[\s_.\-–—…•·]+$/;
const INLINE_BLANK_RUN_REGEX = /(_{3,}|\.{4,}|-{4,}|…{2,})/g;

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
 * Extract digital PDF text runs (split into clean word/label spans and embedded underline blank runs)
 * using exact PDF.js viewport coordinates.
 */
async function extractPageTextSpans(
  pdfJsDoc: any,
  pageNum: number
): Promise<{
  wordSpans: PdfTextSpanBox[];
  inlineBlankRuns: Array<{ x: number; y: number; width: number; height: number; fontSizePt: number }>;
}> {
  const page = await pdfJsDoc.getPage(pageNum);
  const nativeRot = (((page.rotate || 0) % 360) + 360) % 360;
  const viewport = page.getViewport({ scale: 1.0, rotation: nativeRot });
  const vpW = Math.max(1, viewport.width);
  const vpH = Math.max(1, viewport.height);

  const wordSpans: PdfTextSpanBox[] = [];
  const inlineBlankRuns: Array<{ x: number; y: number; width: number; height: number; fontSizePt: number }> = [];

  try {
    const tc = await page.getTextContent();
    const rawItems = (tc.items || []) as any[];
    let spanCounter = 0;

    for (const item of rawItems) {
      const rawStr = String(item?.str || '');
      if (!rawStr || !rawStr.trim()) continue;

      const tx = (pdfjsLib as any).Util.transform(viewport.transform, item.transform);
      const fontH = Math.max(6.5, Math.hypot(tx[2], tx[3]) || Math.abs(item.height) || 11);
      const itemW = Math.max(4, Math.abs(item.width) || rawStr.length * fontH * 0.48);
      const itemX = tx[4];
      // PDF text origin is baseline; lift by ~84% of font height to visual top
      const itemY = tx[5] - fontH * 0.86;
      const totalChars = Math.max(1, rawStr.length);

      // 1. If the entire item is purely underlines / dots (e.g. "________"), register as an inline blank slot!
      if (BLANK_CHARS_REGEX.test(rawStr) && rawStr.trim().length >= 3) {
        const bx = Math.max(0.004, Math.min(0.98, itemX / vpW));
        const by = Math.max(0.004, Math.min(0.98, itemY / vpH));
        const bw = Math.max(0.02, Math.min(1 - bx - 0.004, itemW / vpW));
        const bh = Math.max(0.015, Math.min(0.08, (fontH * 1.28) / vpH));
        inlineBlankRuns.push({ x: bx, y: by, width: bw, height: bh, fontSizePt: fontH });
        continue;
      }

      // 2. Split mixed strings like "Age: ______ in Years ______ in Months ______ in Days ______"
      //    into separate text label spans AND separate inline blank runs!
      const parts: Array<{ str: string; startIdx: number; isBlank: boolean }> = [];
      let lastIdx = 0;
      INLINE_BLANK_RUN_REGEX.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = INLINE_BLANK_RUN_REGEX.exec(rawStr)) !== null) {
        if (match.index > lastIdx) {
          parts.push({ str: rawStr.slice(lastIdx, match.index), startIdx: lastIdx, isBlank: false });
        }
        parts.push({ str: match[0], startIdx: match.index, isBlank: true });
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < rawStr.length) {
        parts.push({ str: rawStr.slice(lastIdx), startIdx: lastIdx, isBlank: false });
      }

      for (const part of parts) {
        const trimmed = part.str.trim();
        if (!trimmed) continue;

        const leadSpaces = part.str.length - part.str.trimStart().length;
        const charStart = part.startIdx + leadSpaces;
        const fracStart = charStart / totalChars;
        const fracLen = trimmed.length / totalChars;

        const px = itemX + itemW * fracStart;
        const pw = Math.max(3, itemW * fracLen);

        const nx = Math.max(0.002, Math.min(0.992, px / vpW));
        const ny = Math.max(0.002, Math.min(0.992, itemY / vpH));
        const nw = Math.max(0.006, Math.min(1 - nx - 0.002, pw / vpW));
        const nh = Math.max(0.011, Math.min(0.09, (fontH * 1.18) / vpH));

        if (part.isBlank) {
          inlineBlankRuns.push({
            x: nx,
            y: Math.max(0.004, ny - (fontH * 0.14) / vpH),
            width: nw,
            height: Math.max(0.015, (fontH * 1.32) / vpH),
            fontSizePt: fontH,
          });
        } else {
          // Further split multi-word runs on spaces so users can select individual words cleanly!
          const subTokens = part.str.match(/\S+/g);
          if (subTokens && subTokens.length > 1) {
            let searchFrom = 0;
            for (const tok of subTokens) {
              const idxInPart = part.str.indexOf(tok, searchFrom);
              searchFrom = idxInPart + tok.length;
              const tokStart = (part.startIdx + idxInPart) / totalChars;
              const tokFracW = tok.length / totalChars;
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
  } catch {
    // Scanned or image-only PDF with no text stream
  }

  return { wordSpans, inlineBlankRuns };
}

/**
 * Scan a rendered page canvas (downsampled for speed) to detect:
 * 1) Ruled table grids (intersecting horizontal & vertical lines -> individual table cells)
 * 2) Standalone horizontal underline segments (for blank fields like Name: ______, Age: ___ Years ___ Months ___)
 */
function detectCanvasLinesAndTables(
  canvas: HTMLCanvasElement,
  pageNum: number,
  pageMeta: PageMetaInfo,
  textSpans: PdfTextSpanBox[]
): {
  tableCells: DetectedFormSlot[];
  underlineBlanks: Array<{ x: number; y: number; width: number; height: number; fontSizePt: number }>;
} {
  const tableCells: DetectedFormSlot[] = [];
  const underlineBlanks: Array<{ x: number; y: number; width: number; height: number; fontSizePt: number }> = [];

  if (!canvas || canvas.width < 60 || canvas.height < 60) {
    return { tableCells, underlineBlanks };
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
  if (!ctx) return { tableCells, underlineBlanks };

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(canvas, 0, 0, w, h);

  let imgData: Uint8ClampedArray;
  try {
    imgData = ctx.getImageData(0, 0, w, h).data;
  } catch {
    work.width = 1;
    work.height = 1;
    return { tableCells, underlineBlanks };
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
    });
  });

  work.width = 1;
  work.height = 1;
  return { tableCells, underlineBlanks };
}

/**
 * Detect multiple independent inline blank slots on the same line by analyzing:
 * - Explicit underline/dot runs (from text layer + canvas lines)
 * - Gaps between short form field labels on the same baseline:
 *   e.g. "Age: ___ in Years ___ in Months ___ in Days ___"
 *   e.g. "Date: ___ Month: ___ Year: ___"
 */
function buildInlineBlankSlots(
  pageNum: number,
  pageMeta: PageMetaInfo,
  textSpans: PdfTextSpanBox[],
  rawBlanks: Array<{ x: number; y: number; width: number; height: number; fontSizePt: number }>,
  tableCells: DetectedFormSlot[],
  interactiveFields: DetectedInteractiveField[]
): DetectedFormSlot[] {
  const candidates: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    suggestedFontSize: number;
  }> = [];

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

  // 1. Add all explicit underline / dot-run blank fields (clipping strictly before any text label to the right)
  for (const rb of rawBlanks) {
    if (rb.width < 0.02) continue;
    // Check if any printed text span sits inside this underline range — if so, split around it!
    const lineSpans = textSpans
      .filter(
        (sp) =>
          Math.abs((sp.y + sp.height / 2) - (rb.y + rb.height / 2)) < Math.max(rb.height * 0.9, 0.016) &&
          sp.x + sp.width > rb.x + 0.004 &&
          sp.x < rb.x + rb.width - 0.004
      )
      .sort((a, b) => a.x - b.x);

    const subRanges: Array<{ x: number; w: number }> = [];
    let cursorX = rb.x;
    for (const sp of lineSpans) {
      if (sp.x - cursorX >= 0.022) {
        subRanges.push({ x: cursorX, w: sp.x - cursorX - 0.004 });
      }
      cursorX = Math.max(cursorX, sp.x + sp.width + 0.004);
    }
    if (rb.x + rb.width - cursorX >= 0.022) {
      subRanges.push({ x: cursorX, w: rb.x + rb.width - cursorX });
    }

    for (const sr of subRanges) {
      const box = {
        x: Math.max(0.004, sr.x),
        y: Math.max(0.004, rb.y),
        width: Math.min(1 - sr.x - 0.004, sr.w),
        height: Math.max(0.016, rb.height),
        suggestedFontSize: Math.max(9, Math.min(13, Math.round(rb.fontSizePt))),
      };
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
      const gapRight = next ? next.x - curRight : 0.94 - curRight;

      // Skip if an explicit underline/blank slot already exists immediately after this prompt on the same line
      const hasExplicitSlotAfter = candidates.some(
        (c) =>
          Math.abs((c.y + c.height / 2) - (cur.y + cur.height / 2)) <= Math.max(cur.height, 0.016) &&
          c.x >= curRight - 0.012 &&
          c.x <= (next ? next.x : curRight + 0.14)
      );
      if (hasExplicitSlotAfter) continue;

      // Detect clear horizontal blank gap after a prompt word (or before "in Years/Months/Days")
      const isPrompt = FIELD_PROMPT_KEYWORD.test(cur.text.trim());
      const nextIsUnit = next && /^(years?|months?|days?|in)$/i.test(next.text.trim());

      if ((isPrompt || nextIsUnit) && gapRight >= 0.042) {
        const slotX = curRight + 0.006;
        const maxSlotW = next ? gapRight - 0.01 : Math.min(0.32, gapRight - 0.01);
        if (maxSlotW < 0.025) continue;

        const slotH = Math.max(0.018, (cur.fontSizePt * 1.32) / Math.max(1, pageMeta.baseHeight));
        const box = {
          x: slotX,
          y: Math.max(0.004, cur.y - 0.002),
          width: maxSlotW,
          height: slotH,
          label: cur.text.replace(/[:._-]+$/, '').trim(),
          suggestedFontSize: Math.max(9, Math.min(13, Math.round(cur.fontSizePt))),
        };
        if (!overlapsExisting(box, occupiedRegions) && !overlapsExisting(box, candidates)) {
          candidates.push(box);
        }
      }
    }
  }

  return candidates.map((c, idx) => ({
    id: `slot_p${pageNum}_${idx + 1}`,
    pageNum,
    kind: 'inline-blank' as const,
    x: c.x,
    y: c.y,
    width: c.width,
    height: c.height,
    label: c.label,
    suggestedFontSize: c.suggestedFontSize,
  }));
}

/**
 * Full fast page layout analysis (combines PDF.js text geometry + rendered canvas line/table geometry).
 * Runs locally in ~15–30ms per page with zero external dependencies and no mandatory OCR.
 */
export async function analyzePageFormLayout(
  pdfJsDoc: any,
  pageNum: number,
  pageMeta: PageMetaInfo,
  renderedCanvas: HTMLCanvasElement,
  interactiveFields: DetectedInteractiveField[]
): Promise<AnalyzedPageLayout> {
  const { wordSpans, inlineBlankRuns } = await extractPageTextSpans(pdfJsDoc, pageNum);
  const { tableCells, underlineBlanks } = detectCanvasLinesAndTables(
    renderedCanvas,
    pageNum,
    pageMeta,
    wordSpans
  );

  const inlineSlots = buildInlineBlankSlots(
    pageNum,
    pageMeta,
    wordSpans,
    [...inlineBlankRuns, ...underlineBlanks],
    tableCells,
    interactiveFields
  );

  const allSlots = [...tableCells, ...inlineSlots].sort((a, b) => {
    // Keep same-table cells strictly in row-by-row, left-to-right order
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
    isLikelyScanned: wordSpans.length < 4,
  };
}

/**
 * Given a raw click at normalized (normX, normY) on a page, determine the exact bounded placement:
 * 1) If the click lands inside a detected table cell or inline blank slot -> snap strictly to that slot!
 * 2) Otherwise -> place cursor at exact (normX, normY) and cap its width before the nearest printed text
 *    label or table cell on the same line so short inline fields NEVER collide or overlap!
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
  boundedBox: boolean;
} {
  // 1. Check exact hit inside a detected table cell first (most strict geometry)
  if (layout) {
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
      };
    }

    // 2. Check exact hit inside a detected inline blank slot (e.g., Years, Months, Days, Date, Month, Year)
    const hitBlank = layout.slots.find(
      (s) =>
        s.kind === 'inline-blank' &&
        normX >= s.x - 0.006 &&
        normX <= s.x + s.width + 0.006 &&
        normY >= s.y - 0.006 &&
        normY <= s.y + s.height + 0.008
    );
    if (hitBlank) {
      return {
        x: hitBlank.x,
        y: hitBlank.y,
        width: hitBlank.width,
        height: hitBlank.height,
        fontSize: Math.min(defaultFontSize, hitBlank.suggestedFontSize || 12),
        slot: hitBlank,
        boundedBox: true,
      };
    }
  }

  // 3. Freehand click anywhere else: calculate exact horizontal barrier (next printed label or entry on the same line!)
  const lineHeightPt = defaultFontSize * 1.28;
  const padPt = 2;
  const lineHeightNorm = (lineHeightPt + padPt * 2) / Math.max(1, pageMeta.baseHeight);
  const padXNorm = padPt / Math.max(1, pageMeta.baseWidth);

  const x = Math.max(0.004, Math.min(0.94, normX - padXNorm));
  const y = Math.max(0.004, Math.min(0.97 - lineHeightNorm, normY - lineHeightNorm * 0.52));

  let rightBarrier = 0.992;

  if (layout) {
    // Stop before the next printed text span on the same visual line
    for (const sp of layout.textSpans) {
      const sameLine = sp.y < y + lineHeightNorm * 0.85 && sp.y + sp.height > y + lineHeightNorm * 0.15;
      if (sameLine && sp.x > normX + 0.008 && sp.x - 0.005 < rightBarrier) {
        rightBarrier = sp.x - 0.005;
      }
    }
    // Also stop before any table cell boundary to the right on the same line
    for (const sl of layout.slots) {
      const sameLine = sl.y < y + lineHeightNorm * 0.85 && sl.y + sl.height > y + lineHeightNorm * 0.15;
      if (sameLine && sl.x > normX + 0.008 && sl.x - 0.004 < rightBarrier) {
        rightBarrier = sl.x - 0.004;
      }
    }
  }

  // Also stop before another already-typed entry on the same line
  for (const ex of existingEntriesOnPage) {
    const sameLine = ex.y < y + lineHeightNorm * 0.85 && ex.y + ex.height > y + lineHeightNorm * 0.15;
    if (sameLine && ex.x > normX + 0.008 && ex.x - 0.005 < rightBarrier) {
      rightBarrier = ex.x - 0.005;
    }
  }

  const maxW = Math.max(0.045, rightBarrier - x);
  const hasTightBarrier = rightBarrier < 0.96;

  return {
    x,
    y,
    width: Math.min(maxW, hasTightBarrier ? maxW : 0.36),
    height: Math.max(0.022, lineHeightNorm),
    fontSize: defaultFontSize,
    boundedBox: hasTightBarrier,
  };
}
