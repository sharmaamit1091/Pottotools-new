import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

export interface PptxConversionResult {
  blob: Blob;
  slideCount: number;
  title: string;
}

/**
 * Convert PowerPoint (.pptx) presentation to high-quality PDF slides
 * Runs 100% client-side in the browser using JSZip and jsPDF.
 */
export async function pptxToPdf(file: File): Promise<PptxConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find all slide files: ppt/slides/slide*.xml
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(name)
  );

  if (slideFiles.length === 0) {
    throw new Error(
      'No presentation slides found in this PowerPoint file. Please ensure it is a valid .pptx file.'
    );
  }

  // Sort slides numerically: slide1, slide2, slide10, etc.
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0], 10);
    const numB = parseInt(b.match(/\d+/)![0], 10);
    return numA - numB;
  });

  // Create landscape PDF (A4 297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const parser = new DOMParser();
  let firstSlideTitle = file.name.replace(/\.pptx?$/i, '');

  for (let i = 0; i < slideFiles.length; i++) {
    if (i > 0) {
      doc.addPage('a4', 'landscape');
    }

    const xmlContent = await zip.files[slideFiles[i]].async('text');
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    // Extract text elements: <a:t>
    const textNodes = xmlDoc.getElementsByTagNameNS('*', 't');
    const texts: string[] = [];
    for (let j = 0; j < textNodes.length; j++) {
      const val = textNodes[j].textContent?.trim();
      if (val) texts.push(val);
    }

    // Slide background fill
    doc.setFillColor(250, 250, 252);
    doc.rect(0, 0, 297, 210, 'F');

    // Slide accent bar (PottoTools brand blue #0284c7)
    doc.setFillColor(2, 132, 199);
    doc.rect(16, 14, 265, 3.5, 'F');

    // Slide footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `PottoTools Presentation Export · Slide ${i + 1} of ${slideFiles.length}`,
      16,
      200
    );

    if (texts.length > 0) {
      // First non-empty text element is the slide title
      const title = texts[0];
      if (i === 0 && title.length < 100) firstSlideTitle = title;

      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      const titleLines = doc.splitTextToSize(title, 260);
      doc.text(titleLines, 20, 28);

      let y = 34 + titleLines.length * 8;

      // Render remaining bullet points
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85); // slate-700

      for (let k = 1; k < texts.length; k++) {
        const item = texts[k];
        if (y > 185) break; // stay within printable boundary
        const bulletText = `•  ${item}`;
        const lines = doc.splitTextToSize(bulletText, 255);
        doc.text(lines, 20, y);
        y += lines.length * 7.5 + 3.5;
      }
    } else {
      doc.setFontSize(16);
      doc.setTextColor(148, 163, 184);
      doc.text(`[Slide ${i + 1}]`, 148, 105, { align: 'center' });
    }
  }

  const pdfArray = doc.output('arraybuffer');
  return {
    blob: new Blob([pdfArray], { type: 'application/pdf' }),
    slideCount: slideFiles.length,
    title: firstSlideTitle,
  };
}

/**
 * Extract all raw slide text notes from PowerPoint presentation (.pptx)
 */
export async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(name)
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0], 10);
    const numB = parseInt(b.match(/\d+/)![0], 10);
    return numA - numB;
  });

  const parser = new DOMParser();
  const slideTexts: string[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async('text');
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
    const textNodes = xmlDoc.getElementsByTagNameNS('*', 't');
    const texts: string[] = [];
    for (let j = 0; j < textNodes.length; j++) {
      const val = textNodes[j].textContent?.trim();
      if (val) texts.push(val);
    }
    slideTexts.push(`--- Slide ${i + 1} ---\n${texts.join('\n')}`);
  }

  return slideTexts.join('\n\n');
}
