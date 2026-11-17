import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

/**
 * Convert CSV string or file into Microsoft Excel .xlsx Blob
 */
export function csvToXlsx(csvString: string): Blob {
  const workbook = XLSX.read(csvString, { type: 'string' });
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Convert XLSX spreadsheet to CSV
 */
export async function xlsxToCsv(
  file: File,
  sheetIndex = 0
): Promise<{ csv: string; sheetNames: string[]; activeSheetName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('No sheets found in this Excel workbook.');
  }

  const targetSheetName = sheetNames[sheetIndex] || sheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  return {
    csv,
    sheetNames,
    activeSheetName: targetSheetName,
  };
}

export interface ParsedSpreadsheet {
  sheetNames: string[];
  sheetsData: Record<string, any[][]>;
  totalRows: number;
}

/**
 * Parse an Excel or CSV file into a 2D matrix for browser table viewing
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
  let workbook: XLSX.WorkBook;

  if (isCsv) {
    const text = await file.text();
    workbook = XLSX.read(text, { type: 'string' });
  } else {
    const arrayBuffer = await file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  }

  const sheetNames = workbook.SheetNames;
  const sheetsData: Record<string, any[][]> = {};
  let totalRows = 0;

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    sheetsData[name] = jsonRows;
    totalRows += jsonRows.length;
  }

  return {
    sheetNames,
    sheetsData,
    totalRows,
  };
}

/**
 * Convert Excel (.xlsx, .xls) or CSV spreadsheet into a formatted PDF document
 */
export async function excelToPdf(file: File): Promise<{ blob: Blob; pageCount: number; rowCount: number }> {
  const parsed = await parseSpreadsheet(file);
  const activeSheetName = parsed.sheetNames[0] || 'Sheet1';
  const rows = parsed.sheetsData[activeSheetName] || [];

  if (rows.length === 0) {
    throw new Error('This spreadsheet appears to be empty.');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;
  const colCount = Math.min(Math.max(...rows.slice(0, 10).map((r) => r.length)), 10);
  const colWidth = (pageWidth - margin * 2) / Math.max(colCount, 1);

  // Document Title Header
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`${file.name.replace(/\.[^.]+$/, '')} (${activeSheetName})`, margin, 15);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Exported with PottoTools · ${rows.length} rows`, pageWidth - margin, 15, { align: 'right' });

  // Draw header accent line
  doc.setFillColor(2, 132, 199);
  doc.rect(margin, 18, pageWidth - margin * 2, 1, 'F');

  let y = 25;
  const rowHeight = 7;
  let pageCount = 1;

  for (let r = 0; r < rows.length; r++) {
    // Page overflow check
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage('a4', 'landscape');
      pageCount++;
      y = margin + 5;
    }

    const row = rows[r];
    const isHeader = r === 0;

    // Row background shading
    if (isHeader) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, y - 4, pageWidth - margin * 2, rowHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42); // slate-900 font-bold
    } else {
      if (r % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin, y - 4, pageWidth - margin * 2, rowHeight, 'F');
      }
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // slate-700
    }

    for (let c = 0; c < colCount; c++) {
      const cellVal = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '';
      const cellX = margin + c * colWidth;
      const truncated = cellVal.length > 25 ? cellVal.substring(0, 22) + '…' : cellVal;
      doc.text(truncated, cellX + 1.5, y);
    }

    y += rowHeight;
  }

  const pdfArray = doc.output('arraybuffer');
  return {
    blob: new Blob([pdfArray], { type: 'application/pdf' }),
    pageCount,
    rowCount: rows.length,
  };
}

/**
 * Extract tabular rows from PDF and create an Excel (.xlsx) file
 */
export async function pdfToExcel(pdfBuffer: ArrayBuffer, fileName = 'converted_table'): Promise<Blob> {
  const { extractTextFromPdf } = await import('../pdf/pdfjsService');
  const extraction = await extractTextFromPdf(pdfBuffer);
  const rawText = extraction.text;

  if (!rawText.trim()) {
    throw new Error('No readable text found in this PDF to convert into a spreadsheet.');
  }

  // Parse lines into rows by splitting on tabs, multiple spaces, or commas
  const lines = rawText.split('\n');
  const tableData: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--- Page')) continue;

    // Detect delimiter: tab, comma, or 2+ spaces
    let cells: string[];
    if (trimmed.includes('\t')) {
      cells = trimmed.split('\t').map((c) => c.trim());
    } else if (trimmed.includes(',') && trimmed.split(',').length >= 3) {
      cells = trimmed.split(',').map((c) => c.trim());
    } else {
      cells = trimmed.split(/\s{2,}/).map((c) => c.trim());
    }

    if (cells.length > 0) {
      tableData.push(cells);
    }
  }

  if (tableData.length === 0) {
    throw new Error('Unable to extract tabular columns from this PDF.');
  }

  const worksheet = XLSX.utils.aoa_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

