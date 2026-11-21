import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { ProgressBar } from '../common/ProgressBar';
import { AdPlaceholder } from '../common/AdPlaceholder';
import {
  convertSingleImage,
  convertImagesToPdf,
  ConvertedImageResult,
} from '../../services/image/imageConverterService';
import { renderPdfPagesToImages } from '../../services/pdf/pdfjsService';
import { triggerDownload, formatBytes, createZip } from '../../services/utils/downloadUtils';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Archive,
  ArrowRight,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { WorkflowStepsIndicator } from '../common/WorkflowStepsIndicator';
import { RecommendedNextTools } from './RecommendedNextTools';
import { triggerToast } from '../common/Toast';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';

interface ImageConverterToolProps {
  tool: ToolDefinition;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

export const ImageConverterTool: React.FC<ImageConverterToolProps> = ({ tool, onSelectNextTool }) => {
  const isImageToPdf = tool.id === 'image-to-pdf';
  const isPdfToImages = tool.id === 'pdf-to-images';

  const [files, setFiles] = useState<File[]>([]);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (!staged) return;

    const isPdf = staged.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf');
    const isImg = staged.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(staged.name);

    if (isPdfToImages && isPdf) {
      clearStagedFileForTool();
      setFiles([staged]);
    } else if (!isPdfToImages && isImg) {
      clearStagedFileForTool();
      setFiles([staged]);
    }
  }, [tool.id]);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp'>('image/png');
  const [quality, setQuality] = useState<number>(0.9);
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [backgroundColor, setBgColor] = useState<string>('#FFFFFF');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [convertedImages, setConvertedImages] = useState<ConvertedImageResult[]>([]);
  const [pdfResultBlob, setPdfResultBlob] = useState<{ blob: Blob; filename: string } | null>(null);

  const isConvertingPngToJpg = files.some((f) => f.type.includes('png') || f.name.toLowerCase().endsWith('.png')) && outputFormat === 'image/jpeg';

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(15);
    setErrorMsg(null);
    setConvertedImages([]);
    setPdfResultBlob(null);

    try {
      if (isImageToPdf) {
        setStatusText('Composing image pages into PDF document...');
        setProgress(40);
        const pdfBlob = await convertImagesToPdf(files, { pageSize: 'a4' });
        setProgress(100);
        setPdfResultBlob({ blob: pdfBlob, filename: 'pottotools-images.pdf' });
      } else if (isPdfToImages) {
        setStatusText('Rendering PDF pages to canvas...');
        setProgress(30);
        const buffer = await files[0].arrayBuffer();
        const pages = await renderPdfPagesToImages(
          buffer,
          outputFormat === 'image/png' ? 'image/png' : 'image/jpeg',
          1.5,
          quality
        );
        setProgress(90);

        const results: ConvertedImageResult[] = pages.map((p) => {
          const ext = outputFormat === 'image/png' ? '.png' : '.jpg';
          return {
            blob: p.blob,
            dataUrl: p.dataUrl,
            width: p.width,
            height: p.height,
            originalSize: files[0].size,
            newSize: p.blob.size,
            filename: `page-${p.pageNum}${ext}`,
          };
        });

        setProgress(100);
        setConvertedImages(results);
      } else {
        // Universal image cross converter
        const results: ConvertedImageResult[] = [];
        const w = customWidth ? parseInt(customWidth, 10) : undefined;
        const h = customHeight ? parseInt(customHeight, 10) : undefined;

        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          setStatusText(`Converting image ${i + 1} of ${files.length}: ${f.name}...`);
          setProgress(Math.round(20 + ((i + 1) / files.length) * 75));

          const res = await convertSingleImage(f, {
            format: outputFormat,
            quality,
            width: w,
            height: h,
            maintainAspect,
            backgroundColor,
          });
          results.push(res);
        }

        setProgress(100);
        setConvertedImages(results);
        triggerToast('success', `Successfully processed ${results.length} ${results.length === 1 ? 'image' : 'images'}!`, 'Conversion Complete');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during image conversion.');
      triggerToast('error', err.message || 'Image processing failed.', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (convertedImages.length === 0) return;
    setStatusText('Packaging files into ZIP...');
    const zipFiles = convertedImages.map((img) => ({
      name: img.filename,
      data: img.blob,
    }));
    const zipBlob = await createZip(zipFiles);
    triggerDownload(zipBlob, 'converted-images.zip');
    triggerToast('success', 'ZIP archive is downloading now.', 'Download Started');
  };

  const handleReset = () => {
    setFiles([]);
    setConvertedImages([]);
    setPdfResultBlob(null);
    setProgress(0);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {tool.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {tool.fullDesc}
        </p>
      </div>

      {/* 4-Step Process Bar */}
      <WorkflowStepsIndicator
        currentStep={convertedImages.length > 0 || pdfResultBlob ? 'result' : isProcessing ? 'process' : files.length > 0 ? 'settings' : 'upload'}
        hasSettings={!isImageToPdf}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {convertedImages.length === 0 && !pdfResultBlob ? (
          <>
            <FileUploadZone
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              multiple={!isPdfToImages}
              files={files}
              onFilesSelected={setFiles}
              onRemoveFile={(idx) => {
                const newFiles = [...files];
                newFiles.splice(idx, 1);
                setFiles(newFiles);
              }}
              disabled={isProcessing}
            />

            {files.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Format selection */}
                {!isImageToPdf && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Target Output Format
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'image/png', label: 'PNG (Lossless & Alpha)' },
                        { key: 'image/jpeg', label: 'JPG / JPEG (Compact)' },
                        { key: 'image/webp', label: 'WEBP (Modern Web)' },
                        { key: 'image/bmp', label: 'BMP (Bitmap)' },
                      ].map((fmt) => (
                        <button
                          key={fmt.key}
                          type="button"
                          onClick={() => setOutputFormat(fmt.key as any)}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                            outputFormat === fmt.key
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transparency Warning when converting PNG to JPG */}
                {isConvertingPngToJpg && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Transparency Notice</div>
                      <div>
                        JPEG format does not support transparency. Any transparent background in your PNG will be filled with the background color chosen below:
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setBgColor('#FFFFFF')}
                          className={`px-2.5 py-1 rounded border text-[11px] font-medium ${
                            backgroundColor === '#FFFFFF' ? 'bg-white border-amber-500 font-bold' : 'border-amber-200'
                          }`}
                        >
                          Fill with White (Default)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBgColor('#000000')}
                          className={`px-2.5 py-1 rounded border text-[11px] font-medium ${
                            backgroundColor === '#000000' ? 'bg-black text-white border-amber-500 font-bold' : 'border-amber-200'
                          }`}
                        >
                          Fill with Black
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quality & Dimension Controls */}
                {!isImageToPdf && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    {/* Quality slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                        <span>Image Quality</span>
                        <span className="font-mono">{Math.round(quality * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Smallest File Size</span>
                        <span>Highest Quality</span>
                      </div>
                    </div>

                    {/* Width / Height overrides */}
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        Resize Dimensions (Optional)
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Width (px)"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          placeholder="Height (px)"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={maintainAspect}
                          onChange={(e) => setMaintainAspect(e.target.checked)}
                        />
                        <span>Maintain aspect ratio</span>
                      </label>
                    </div>
                  </div>
                )}

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
                      <span>Processing Images...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isImageToPdf
                          ? `Convert ${files.length} Images to PDF`
                          : isPdfToImages
                          ? 'Extract PDF Pages as Images'
                          : `Convert ${files.length} ${files.length === 1 ? 'Image' : 'Images'}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Converted Results View */
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Image Processing Complete!
              </h2>
              <p className="text-xs text-slate-500">
                Generated {convertedImages.length > 0 ? `${convertedImages.length} images` : 'PDF document'} locally.
              </p>
            </div>

            {/* Single PDF output from images */}
            {pdfResultBlob && (
              <div className="text-center py-4 space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl inline-block max-w-sm text-sm">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {pdfResultBlob.filename}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Consolidated PDF · {formatBytes(pdfResultBlob.blob.size)}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => triggerDownload(pdfResultBlob.blob, pdfResultBlob.filename)}
                    className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Combined PDF</span>
                  </button>
                </div>
              </div>
            )}

            {/* Converted Images Grid */}
            {convertedImages.length > 0 && (
              <div className="space-y-4">
                {convertedImages.length > 1 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleDownloadAllZip}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Download All in ZIP Archive</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {convertedImages.map((img, i) => (
                    <div
                      key={i}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
                    >
                      <div className="h-36 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-1">
                        <img
                          src={img.dataUrl}
                          alt={img.filename}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {img.filename}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                          <span>{img.width} × {img.height} px</span>
                          <span>{formatBytes(img.newSize)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerDownload(img.blob, img.filename)}
                        className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-xs inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Convert More Images</span>
              </button>
            </div>

            {/* Recommended Next Tool Section */}
            {onSelectNextTool && (
              <RecommendedNextTools
                currentToolId={tool.id}
                onSelectTool={onSelectNextTool}
              />
            )}
          </div>
        )}
      </div>

      <AdPlaceholder format="tool-bottom" />

      {/* Instructions & FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Supported Formats & Guidelines
          </h2>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Cross-convert between JPG, PNG, WEBP, and BMP with pixel precision. All calculations run on your computer's canvas acceleration engine.
            </p>
            <p>
              When converting transparent PNGs to JPG, our engine automatically fills the transparent alpha channel with your chosen background color.
            </p>
          </div>
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
