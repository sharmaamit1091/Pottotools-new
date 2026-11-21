import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  csvToXlsx,
  xlsxToCsv,
  parseSpreadsheet,
  excelToPdf,
  pdfToExcel,
  ParsedSpreadsheet,
} from '../../services/office/spreadsheetService';
import { triggerDownload } from '../../services/utils/downloadUtils';
import { trackToolCompleted } from '../../services/analytics/ga4Tracker';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  Table,
  ArrowRight,
  Sheet,
} from 'lucide-react';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface SpreadsheetToolProps {
  tool: ToolDefinition;
}

export const SpreadsheetTool: React.FC<SpreadsheetToolProps> = ({ tool }) => {
  const isCsvToXlsx = tool.id === 'csv-to-xlsx';
  const isXlsxToCsv = tool.id === 'xlsx-to-csv';
  const isExcelToPdf = tool.id === 'excel-to-pdf';
  const isPdfToExcel = tool.id === 'pdf-to-excel';
  const isViewer = tool.id === 'sheet-viewer';

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [outputBlob, setOutputBlob] = useState<{ blob: Blob; filename: string } | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSpreadsheet | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const handleFilesSelected = async (selected: File[]) => {
    setFiles(selected);
    setErrorMsg(null);
    setOutputBlob(null);
    setParsedData(null);

    if (isViewer && selected.length > 0) {
      try {
        setIsProcessing(true);
        setStatusText('Parsing spreadsheet rows...');
        const parsed = await parseSpreadsheet(selected[0]);
        setParsedData(parsed);
        if (parsed.sheetNames.length > 0) {
          setActiveSheet(parsed.sheetNames[0]);
        }
        trackToolCompleted('sheet-table', parsed.sheetNames.length, tool.id);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse spreadsheet table.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (!staged) return;

    const ext = '.' + staged.name.split('.').pop()?.toLowerCase();
    const isAccepted = tool.acceptedFormats.some(
      (f) => f.toLowerCase() === ext || staged.type.toLowerCase().includes(f.replace('.', '').toLowerCase())
    );

    if (isAccepted) {
      clearStagedFileForTool();
      handleFilesSelected([staged]);
    }
  }, [tool.id]);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(20);
    setErrorMsg(null);
    setOutputBlob(null);

    try {
      if (isCsvToXlsx) {
        setStatusText('Reading CSV and creating Excel workbook...');
        setProgress(50);
        const text = await files[0].text();
        const blob = csvToXlsx(text);
        setProgress(100);
        const base = files[0].name.replace(/\.csv$/i, '');
        setOutputBlob({ blob, filename: `${base}.xlsx` });
      } else if (isXlsxToCsv) {
        setStatusText('Extracting active sheet into comma-separated text...');
        setProgress(50);
        const { csv } = await xlsxToCsv(files[0]);
        setProgress(100);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const base = files[0].name.replace(/\.[^/.]+$/, '');
        setOutputBlob({ blob, filename: `${base}.csv` });
      } else if (isExcelToPdf) {
        setStatusText('Rendering spreadsheet sheets into styled PDF tables...');
        setProgress(50);
        const { blob } = await excelToPdf(files[0]);
        setProgress(100);
        const base = files[0].name.replace(/\.[^/.]+$/, '');
        setOutputBlob({ blob, filename: `${base}.pdf` });
      } else if (isPdfToExcel) {
        setStatusText('Extracting tabular rows from PDF into Excel...');
        setProgress(50);
        const buffer = await files[0].arrayBuffer();
        const blob = await pdfToExcel(buffer);
        setProgress(100);
        const base = files[0].name.replace(/\.pdf$/i, '');
        setOutputBlob({ blob, filename: `${base}.xlsx` });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during spreadsheet conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    triggerDownload(outputBlob.blob, outputBlob.filename);
  };

  const handleExportJson = () => {
    if (!parsedData || !activeSheet) return;
    const rows = parsedData.sheetsData[activeSheet] || [];
    const jsonStr = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, `${activeSheet || 'sheet'}.json`);
  };

  const handleReset = () => {
    setFiles([]);
    setOutputBlob(null);
    setParsedData(null);
    setProgress(0);
    setErrorMsg(null);
  };

  // Filter rows for viewer
  const activeRows = parsedData && activeSheet ? parsedData.sheetsData[activeSheet] || [] : [];
  const filteredRows = searchFilter.trim()
    ? activeRows.filter((row) =>
        row.some((cell) => String(cell || '').toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : activeRows;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {tool.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {tool.fullDesc}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {!outputBlob && !parsedData ? (
          <>
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={false}
              files={files}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={() => setFiles([])}
              disabled={isProcessing}
            />

            {files.length > 0 && !isViewer && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {isProcessing && (
                  <ProgressBar progress={progress} statusText={statusText} />
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Spreadsheet...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isCsvToXlsx
                          ? 'Convert CSV to Excel (.xlsx)'
                          : isXlsxToCsv
                          ? 'Convert Excel to CSV'
                          : isExcelToPdf
                          ? 'Convert Excel to PDF'
                          : isPdfToExcel
                          ? 'Convert PDF to Excel (.xlsx)'
                          : 'Convert Spreadsheet'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : parsedData ? (
          /* Spreadsheet Viewer View */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sheet className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {files[0]?.name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({filteredRows.length} rows)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search in table..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  Export JSON
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Sheets tabs */}
            {parsedData.sheetNames.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {parsedData.sheetNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setActiveSheet(name)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      activeSheet === name
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* Data Grid */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto max-h-[460px]">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <tbody>
                  {filteredRows.slice(0, 100).map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx === 0
                          ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white sticky top-0'
                          : 'border-t border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="p-2 text-slate-400 bg-slate-50 dark:bg-slate-900/60 text-[10px] w-10 text-center select-none border-r border-slate-200 dark:border-slate-800">
                        {rIdx + 1}
                      </td>
                      {row.map((cell: any, cIdx: number) => (
                        <td
                          key={cIdx}
                          className="p-2 border-r border-slate-100 dark:border-slate-800/60 truncate max-w-xs text-slate-700 dark:text-slate-300"
                        >
                          {String(cell !== undefined && cell !== null ? cell : '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRows.length > 100 && (
              <div className="text-[11px] text-slate-400 text-center">
                Displaying first 100 rows of {filteredRows.length} total rows.
              </div>
            )}
          </div>
        ) : (
          /* Conversion Result View */
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Spreadsheet Converted!
              </h2>
              <p className="text-xs text-slate-500">
                Generated {outputBlob?.filename || 'spreadsheet'} using standard SheetJS engine.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download {outputBlob?.filename || 'file'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Convert Another File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AdPlaceholder format="tool-bottom" />

      {/* Instructions & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Spreadsheet Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {tool.instructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ol>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 text-xs">
            {tool.faqs.map((faq, i) => (
              <div key={i}>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {faq.question}
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
