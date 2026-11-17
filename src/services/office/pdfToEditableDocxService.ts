import * as pdfjsLib from 'pdfjs-dist';
import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  PageOrientation,
  Packer,
  ShadingType,
} from 'docx';
import { createWorker } from 'tesseract.js';

// Ensure PDF.js worker loads locally for 100% offline compatibility
if (typeof window !== 'undefined') {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

export interface PdfToDocxOptions {
  preserveImages?: boolean;
  enableOcr?: boolean;
  ocrLanguage?: 'eng' | 'hin';
  layoutMode?: 'auto' | 'menu-pricing' | 'flow';
  accentColor?: string;
  onProgress?: (progress: number, statusText: string) => void;
}

export interface PdfToDocxResult {
  blob: Blob;
  pageCount: number;
  textBlockCount: number;
  imageCount: number;
  tableCount: number;
  ocrPagesCount: number;
  summaryText: string;
}

interface TextItemInfo {
  str: string;
  top: number;
  left: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
}

interface ImageItemInfo {
  top: number;
  left: number;
  width: number;
  height: number;
  data: Uint8Array;
}

interface LineCluster {
  top: number;
  items: TextItemInfo[];
  fullText: string;
  isHeading: boolean;
  isPriceLine: boolean;
  leftText: string;
  rightPrice: string;
}

// Currency symbols and price patterns
const PRICE_REGEX = /(?:[\$€£₹¥Rs\.]\s*\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s*[\$€£₹¥]|\b\d{1,4}[.,]\d{2}\b)/i;

/**
 * Main Conversion Function: PDF to Editable Word (.docx)
 * Preserves Layout, Headings, Food Photos/Images, Multi-Column Alignments, Menus, Prices & OCR Fallback
 */
export async function convertPdfToEditableDocx(
  pdfBuffer: ArrayBuffer,
  options: PdfToDocxOptions = {}
): Promise<PdfToDocxResult> {
  const {
    preserveImages = true,
    enableOcr = true,
    ocrLanguage = 'eng',
    onProgress,
  } = options;

  const updateProgress = (pct: number, msg: string) => {
    if (onProgress) onProgress(pct, msg);
  };

  updateProgress(5, 'Loading PDF document and reading stream structure...');

  const loadingTask = (pdfjsLib as any).getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  let totalTextBlocks = 0;
  let totalImages = 0;
  let totalTables = 0;
  let totalOcrPages = 0;
  let accumulatedSummary = '';

  const docSections: any[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const pagePctStart = 10 + Math.round(((pageNum - 1) / numPages) * 75);
    const pagePctEnd = 10 + Math.round((pageNum / numPages) * 75);

    updateProgress(pagePctStart, `Analyzing Page ${pageNum} of ${numPages} layout & elements...`);

    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const ptWidth = viewport.width;
    const ptHeight = viewport.height;

    // Dimensions in twips (1 pt = 20 twips)
    const twipWidth = Math.round(ptWidth * 20);
    const twipHeight = Math.round(ptHeight * 20);
    const isLandscape = twipWidth > twipHeight;

    // Render page canvas to support image extraction and OCR
    const scale = 1.5;
    const renderViewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(renderViewport.width);
    canvas.height = Math.round(renderViewport.height);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    }

    // Detect background color tone
    const bgColor = detectPageBackground(ctx, canvas.width, canvas.height);
    const isDarkBackground = isColorDark(bgColor);

    // Extract text items
    const textContent = await page.getTextContent({ normalizeWhitespace: true });
    let textItems: TextItemInfo[] = [];

    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const scaleX = transform[0];
      const scaleY = transform[3];
      const tx = transform[4];
      const ty = transform[5];

      const fontSize = Math.max(9, Math.round(Math.abs(scaleY) || item.height || 11));
      const left = tx;
      const top = ptHeight - ty - fontSize;
      const width = item.width || (item.str.length * fontSize * 0.55);
      const height = item.height || fontSize;
      const fontName = item.fontName || '';
      const fnLower = fontName.toLowerCase();

      const isBold =
        fnLower.includes('bold') ||
        fnLower.includes('black') ||
        fnLower.includes('heavy') ||
        fnLower.includes('bld') ||
        fontSize >= 16;
      const isItalic = fnLower.includes('italic') || fnLower.includes('oblique');

      textItems.push({
        str: item.str,
        top,
        left,
        width,
        height,
        fontSize,
        fontName,
        isBold,
        isItalic,
      });
    }

    // OCR Fallback if page is scanned (less than 15 digital characters)
    const totalChars = textItems.reduce((acc, t) => acc + t.str.trim().length, 0);
    if (totalChars < 15 && enableOcr && ctx) {
      updateProgress(
        Math.min(95, pagePctStart + 5),
        `Page ${pageNum} is a scanned photo. Running high-precision OCR...`
      );
      totalOcrPages++;
      const ocrItems = await performOcrOnCanvas(canvas, ocrLanguage, (ocrPct) => {
        const subPct = pagePctStart + Math.round((ocrPct / 100) * (pagePctEnd - pagePctStart));
        updateProgress(subPct, `Running OCR on page ${pageNum} (${ocrPct}%)...`);
      });
      if (ocrItems.length > 0) {
        textItems = ocrItems.map((oi) => ({
          ...oi,
          top: oi.top / scale,
          left: oi.left / scale,
          width: oi.width / scale,
          height: oi.height / scale,
          fontSize: Math.max(10, Math.round((oi.height / scale) * 0.85)),
        }));
      }
    }

    totalTextBlocks += textItems.length;

    // Extract Images (photos, logos, food illustrations)
    const extractedImages: ImageItemInfo[] = [];
    if (preserveImages && ctx) {
      updateProgress(
        Math.min(95, pagePctStart + 8),
        `Extracting and embedding photos & logos on page ${pageNum}...`
      );
      try {
        const pageImages = await extractImagesFromPage(page, ptWidth, ptHeight, canvas, scale);
        extractedImages.push(...pageImages);
        totalImages += pageImages.length;
      } catch (imgErr) {
        console.warn('Image extraction notice for page', pageNum, imgErr);
      }
    }

    // Layout Analysis & Line Clustering
    const lines = clusterTextIntoLines(textItems, ptWidth);

    // Build Word elements (Headings, Menu/Price Tables, Paragraphs, Images)
    const sectionChildren: any[] = [];

    // Header image if any image is at the very top (e.g. logo or banner)
    const topImages = extractedImages.filter((img) => img.top < ptHeight * 0.25);
    const bodyImages = extractedImages.filter((img) => img.top >= ptHeight * 0.25);

    for (const img of topImages) {
      sectionChildren.push(createWordImageParagraph(img, ptWidth));
    }

    // Process lines and detect Menu/Price pairs, Tables, and Headings
    let lineIdx = 0;
    while (lineIdx < lines.length) {
      const line = lines[lineIdx];

      // Check if any body image sits immediately around this vertical position
      const nearbyImages = bodyImages.filter(
        (img) => Math.abs(img.top - line.top) < 30 && !sectionChildren.some((c: any) => c.__imgId === img)
      );
      for (const ni of nearbyImages) {
        sectionChildren.push(createWordImageParagraph(ni, ptWidth));
      }

      if (line.isHeading) {
        // Section Heading
        sectionChildren.push(
          new Paragraph({
            heading: line.items[0]?.fontSize > 18 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: line.items.map(
              (it) =>
                new TextRun({
                  text: it.str + ' ',
                  bold: true,
                  size: Math.min(36, Math.max(24, Math.round(it.fontSize * 2))),
                  color: isDarkBackground ? 'E2E8F0' : '1E3A8A', // Rich Navy or Light Slate
                  font: 'Arial',
                })
            ),
          })
        );
        accumulatedSummary += `\n[Heading] ${line.fullText}\n`;
        lineIdx++;
        continue;
      }

      // Check for consecutive Menu / Price rows or Key-Value patterns
      if (line.isPriceLine) {
        const tableRows: TableRow[] = [];
        let priceGroupIdx = lineIdx;

        while (priceGroupIdx < lines.length && (lines[priceGroupIdx].isPriceLine || isDescriptionLine(lines[priceGroupIdx], lines[priceGroupIdx - 1]))) {
          const curLine = lines[priceGroupIdx];

          if (curLine.isPriceLine) {
            // Check if next line is a description (e.g. food ingredients, subtitle)
            let descLine: LineCluster | null = null;
            if (
              priceGroupIdx + 1 < lines.length &&
              !lines[priceGroupIdx + 1].isPriceLine &&
              !lines[priceGroupIdx + 1].isHeading &&
              lines[priceGroupIdx + 1].items[0]?.fontSize <= (curLine.items[0]?.fontSize || 12)
            ) {
              descLine = lines[priceGroupIdx + 1];
              priceGroupIdx++; // consume description
            }

            const itemRuns: TextRun[] = [
              new TextRun({
                text: curLine.leftText,
                bold: true,
                size: Math.round((curLine.items[0]?.fontSize || 11) * 2),
                color: isDarkBackground ? 'F1F5F9' : '0F172A',
                font: 'Arial',
              }),
            ];

            if (descLine) {
              itemRuns.push(
                new TextRun({
                  text: '\n' + descLine.fullText,
                  italics: true,
                  size: Math.round(Math.max(9, (descLine.items[0]?.fontSize || 10)) * 1.8),
                  color: isDarkBackground ? '94A3B8' : '64748B',
                  font: 'Arial',
                })
              );
            }

            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: itemRuns, spacing: { before: 60, after: 60 } })],
                    borders: getNoBorders(),
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 60, after: 60 },
                        children: [
                          new TextRun({
                            text: curLine.rightPrice,
                            bold: true,
                            size: Math.round((curLine.items[0]?.fontSize || 11) * 2),
                            color: isDarkBackground ? 'FBBF24' : '047857', // Warm Amber or Emerald Green
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                    borders: getNoBorders(),
                  }),
                ],
              })
            );
          }

          priceGroupIdx++;
        }

        if (tableRows.length > 0) {
          totalTables++;
          sectionChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: getNoBorders(),
            })
          );
          // Add subtle spacer paragraph
          sectionChildren.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        }

        lineIdx = priceGroupIdx;
        continue;
      }

      // Standard Formatted Paragraph
      const pRuns: TextRun[] = line.items.map(
        (it) =>
          new TextRun({
            text: it.str + ' ',
            bold: it.isBold,
            italics: it.isItalic,
            size: Math.round(it.fontSize * 2),
            color: isDarkBackground ? 'F1F5F9' : '1F2937',
            font: 'Arial',
          })
      );

      sectionChildren.push(
        new Paragraph({
          children: pRuns,
          spacing: { before: 40, after: 40 },
        })
      );

      accumulatedSummary += line.fullText + ' ';
      lineIdx++;
    }

    // Any remaining body images
    for (const remImg of bodyImages) {
      if (!sectionChildren.some((c: any) => c.__imgId === remImg)) {
        sectionChildren.push(createWordImageParagraph(remImg, ptWidth));
      }
    }

    // Section Setup with accurate Page Size and Orientation
    docSections.push({
      properties: {
        page: {
          size: {
            width: twipWidth,
            height: twipHeight,
            orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
          margin: {
            top: 720, // 0.5 inch (720 twips) clean margin
            bottom: 720,
            left: 720,
            right: 720,
          },
        },
      },
      children: sectionChildren.length > 0 ? sectionChildren : [new Paragraph({ children: [new TextRun('')] })],
    });
  }

  updateProgress(90, 'Packaging genuine Microsoft Word OpenXML (.docx) file...');

  const docxDoc = new Document({
    sections: docSections,
  });

  const blob = await Packer.toBlob(docxDoc);

  updateProgress(100, 'Conversion complete! Ready for download.');

  return {
    blob,
    pageCount: numPages,
    textBlockCount: totalTextBlocks,
    imageCount: totalImages,
    tableCount: totalTables,
    ocrPagesCount: totalOcrPages,
    summaryText: accumulatedSummary.trim().slice(0, 800),
  };
}

/**
 * Cluster text items into visual lines and identify menu items, prices, and headings
 */
function clusterTextIntoLines(items: TextItemInfo[], pageWidth: number): LineCluster[] {
  if (items.length === 0) return [];

  // Sort primarily by top coordinate
  const sorted = [...items].sort((a, b) => a.top - b.top || a.left - b.left);
  const lines: LineCluster[] = [];

  let currentLineItems: TextItemInfo[] = [];
  let currentTop = sorted[0].top;

  for (const item of sorted) {
    if (Math.abs(item.top - currentTop) <= 5) {
      currentLineItems.push(item);
    } else {
      if (currentLineItems.length > 0) {
        lines.push(buildLineCluster(currentLineItems, pageWidth));
      }
      currentLineItems = [item];
      currentTop = item.top;
    }
  }

  if (currentLineItems.length > 0) {
    lines.push(buildLineCluster(currentLineItems, pageWidth));
  }

  return lines;
}

function buildLineCluster(items: TextItemInfo[], pageWidth: number): LineCluster {
  // Sort items on the line from left to right
  items.sort((a, b) => a.left - b.left);

  const fullText = items.map((i) => i.str).join(' ').trim();
  const top = items[0].top;
  const avgFontSize = items.reduce((acc, i) => acc + i.fontSize, 0) / items.length;

  // Detect heading (large text, or short uppercase text)
  const isHeading =
    avgFontSize >= 15 ||
    (avgFontSize >= 13 && fullText.length < 50 && (fullText === fullText.toUpperCase() || fullText.endsWith(':')));

  // Detect price and menu item layout
  let isPriceLine = false;
  let leftText = fullText;
  let rightPrice = '';

  if (items.length >= 2 && !isHeading) {
    const lastItem = items[items.length - 1];
    const firstItems = items.slice(0, items.length - 1);
    const lastStr = lastItem.str.trim();

    // Check if the rightmost item is a price or numeric value
    if (PRICE_REGEX.test(lastStr) && (lastItem.left > pageWidth * 0.5 || lastItem.left - firstItems[firstItems.length - 1].left > 60)) {
      isPriceLine = true;
      rightPrice = lastStr;
      leftText = firstItems.map((i) => i.str).join(' ').trim();
    }
  } else if (items.length === 1 && !isHeading) {
    // Single item that contains both item name and trailing price
    const match = fullText.match(/(.*?)([\$€£₹¥Rs\.]\s*\d+(?:[.,]\d{1,2})?|\b\d{1,4}[.,]\d{2}\b)\s*$/);
    if (match && match[1].trim() && match[2].trim()) {
      isPriceLine = true;
      leftText = match[1].trim();
      rightPrice = match[2].trim();
    }
  }

  return {
    top,
    items,
    fullText,
    isHeading,
    isPriceLine,
    leftText,
    rightPrice,
  };
}

function isDescriptionLine(line: LineCluster, prevLine?: LineCluster): boolean {
  if (!prevLine || !prevLine.isPriceLine) return false;
  return !line.isPriceLine && !line.isHeading && line.fullText.length > 5;
}

/**
 * Extract images (photos, logos) from the PDF page
 */
async function extractImagesFromPage(
  page: any,
  ptWidth: number,
  ptHeight: number,
  renderedCanvas: HTMLCanvasElement,
  scale: number
): Promise<ImageItemInfo[]> {
  const images: ImageItemInfo[] = [];

  try {
    const ops = await page.getOperatorList();
    const fnArray = ops.fnArray;
    const argsArray = ops.argsArray;

    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack: number[][] = [];

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i];

      if (fn === (pdfjsLib as any).OPS.save) {
        transformStack.push([...currentTransform]);
      } else if (fn === (pdfjsLib as any).OPS.restore) {
        if (transformStack.length > 0) {
          currentTransform = transformStack.pop()!;
        }
      } else if (fn === (pdfjsLib as any).OPS.transform) {
        currentTransform = multiplyMatrices(currentTransform, args);
      } else if (
        fn === (pdfjsLib as any).OPS.paintImageXObject ||
        fn === (pdfjsLib as any).OPS.paintInlineImageXObject
      ) {
        // Image bounding box from transform matrix
        const imgScaleX = Math.hypot(currentTransform[0], currentTransform[1]);
        const imgScaleY = Math.hypot(currentTransform[2], currentTransform[3]);
        const imgTx = currentTransform[4];
        const imgTy = currentTransform[5];

        const width = Math.max(20, Math.round(imgScaleX));
        const height = Math.max(20, Math.round(imgScaleY));
        const left = Math.max(0, Math.round(imgTx));
        const top = Math.max(0, Math.round(ptHeight - imgTy - height));

        // Skip tiny 1px spacer artifacts
        if (width < 25 || height < 25) continue;

        // Clip pristine image from rendered canvas
        const cropX = Math.min(renderedCanvas.width - 1, Math.max(0, Math.round(left * scale)));
        const cropY = Math.min(renderedCanvas.height - 1, Math.max(0, Math.round(top * scale)));
        const cropW = Math.min(renderedCanvas.width - cropX, Math.round(width * scale));
        const cropH = Math.min(renderedCanvas.height - cropY, Math.round(height * scale));

        if (cropW > 10 && cropH > 10) {
          const offscreen = document.createElement('canvas');
          offscreen.width = cropW;
          offscreen.height = cropH;
          const offCtx = offscreen.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(renderedCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            const blob = await new Promise<Blob | null>((res) => offscreen.toBlob(res, 'image/png'));
            if (blob) {
              const arrayBuf = await blob.arrayBuffer();
              images.push({
                top,
                left,
                width,
                height,
                data: new Uint8Array(arrayBuf),
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Operator list image parsing error:', err);
  }

  return images;
}

/**
 * Multiply 2D affine transformation matrices [a, b, c, d, e, f]
 */
function multiplyMatrices(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/**
 * Create a centered Image Paragraph in Word docx
 */
function createWordImageParagraph(img: ImageItemInfo, pageWidth: number): any {
  // Clamp width to max printable area (e.g. 500pt)
  const maxPt = Math.min(500, pageWidth - 100);
  let renderW = img.width;
  let renderH = img.height;

  if (renderW > maxPt) {
    const ratio = maxPt / renderW;
    renderW = maxPt;
    renderH = Math.round(renderH * ratio);
  }

  const p = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [
      new ImageRun({
        data: img.data,
        transformation: {
          width: renderW,
          height: renderH,
        },
        type: 'png',
      }),
    ],
  });

  (p as any).__imgId = img;
  return p;
}

/**
 * Borderless table configuration
 */
function getNoBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
}

/**
 * Sample background color from rendered canvas corners
 */
function detectPageBackground(ctx: CanvasRenderingContext2D | null, w: number, h: number): [number, number, number] {
  if (!ctx || w < 10 || h < 10) return [255, 255, 255];
  try {
    const corners = [
      ctx.getImageData(5, 5, 1, 1).data,
      ctx.getImageData(w - 6, 5, 1, 1).data,
      ctx.getImageData(5, h - 6, 1, 1).data,
      ctx.getImageData(w - 6, h - 6, 1, 1).data,
    ];
    let r = 0, g = 0, b = 0;
    for (const c of corners) {
      r += c[0];
      g += c[1];
      b += c[2];
    }
    return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)];
  } catch {
    return [255, 255, 255];
  }
}

function isColorDark(rgb: [number, number, number]): boolean {
  const [r, g, b] = rgb;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 140;
}

/**
 * High-precision in-browser OCR using Tesseract worker
 */
async function performOcrOnCanvas(
  canvas: HTMLCanvasElement,
  language: 'eng' | 'hin',
  onProgress?: (pct: number) => void
): Promise<TextItemInfo[]> {
  try {
    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.progress !== undefined && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const res = await worker.recognize(canvas);
    await worker.terminate();

    const items: TextItemInfo[] = [];
    const lines = (res.data as any).lines || [];

    for (const l of lines) {
      if (!l.text || !l.text.trim()) continue;
      const bbox = l.bbox || { x0: 0, y0: 0, x1: 100, y1: 20 };
      const width = bbox.x1 - bbox.x0;
      const height = bbox.y1 - bbox.y0;

      items.push({
        str: l.text.trim(),
        top: bbox.y0,
        left: bbox.x0,
        width,
        height,
        fontSize: Math.max(10, Math.round(height * 0.85)),
        fontName: 'Arial',
        isBold: height >= 20,
        isItalic: false,
      });
    }

    return items;
  } catch (err) {
    console.error('Tesseract canvas OCR error:', err);
    return [];
  }
}
