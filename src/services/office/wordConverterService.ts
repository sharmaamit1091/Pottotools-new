import * as mammoth from 'mammoth';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { jsPDF } from 'jspdf';
import { extractTextFromPdf } from '../pdf/pdfjsService';

/**
 * Convert DOCX file to semantic HTML and plain text using mammoth
 */
export async function docxToHtml(file: File): Promise<{ html: string; text: string; messages: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  return {
    html: htmlResult.value,
    text: textResult.value,
    messages: htmlResult.messages.map((m) => m.message),
  };
}

/**
 * Convert DOCX file to plain text
 */
export async function docxToTxt(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Convert text-based PDF to genuine editable Microsoft Word (.docx)
 */
export async function pdfToDocx(pdfBuffer: ArrayBuffer): Promise<{ blob: Blob; text: string; wordCount: number }> {
  const extraction = await extractTextFromPdf(pdfBuffer);
  const rawText = extraction.text;

  if (!rawText.trim()) {
    throw new Error('This PDF appears to be a scanned image without selectable text. Please use our OCR PDF tool to extract text.');
  }

  // Parse lines and identify headings vs paragraphs
  const rawLines = rawText.split('\n');
  const docParagraphs: Paragraph[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      docParagraphs.push(new Paragraph({ children: [] })); // blank line
      continue;
    }

    if (trimmed.startsWith('--- Page')) {
      // Page marker
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[${trimmed.replace(/---/g, '').trim()}]`,
              italics: true,
              color: '888888',
              size: 20,
            }),
          ],
        })
      );
      continue;
    }

    // Detect if line looks like a title or heading (short, all caps or capital letter start, no trailing period)
    const isHeading = trimmed.length < 60 && !trimmed.endsWith('.') && (trimmed === trimmed.toUpperCase() || /^[A-Z0-9\s]{4,}$/.test(trimmed));

    if (isHeading) {
      docParagraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 26,
            }),
          ],
        })
      );
    } else {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 22, // 11pt
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return {
    blob,
    text: rawText,
    wordCount: extraction.wordCount,
  };
}

/**
 * Convert plain text or markdown to PDF using jsPDF
 */
export async function textToPdf(
  text: string,
  options: {
    title?: string;
    fontSize?: number;
    lineHeight?: number;
  } = {}
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontSize = options.fontSize || 11;
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - margin * 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);

  let cursorY = margin + 20;

  if (options.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(options.title, margin, cursorY);
    cursorY += 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
  }

  const lines = text.split('\n');

  for (const rawLine of lines) {
    const wrappedSubLines = doc.splitTextToSize(rawLine || ' ', maxLineWidth);

    for (const subLine of wrappedSubLines) {
      if (cursorY + fontSize > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 20;
      }
      doc.text(subLine, margin, cursorY);
      cursorY += fontSize * 1.4;
    }
  }

  return doc.output('blob');
}

/**
 * Convert Markdown to HTML
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headings
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold my-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Blockquote
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-slate-300 pl-4 py-1 italic my-2">$1</blockquote>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    // Line breaks
    .replace(/\n$/gim, '<br />');

  return html;
}
