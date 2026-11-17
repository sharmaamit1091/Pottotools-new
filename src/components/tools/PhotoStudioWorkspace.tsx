import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ToolDefinition } from '../../types/tools';
import { FileUploadZone } from '../common/FileUploadZone';
import { AdSlot } from '../common/AdSlot';
import { formatBytes, triggerDownload } from '../../services/utils/downloadUtils';
import { trackToolFileSelected } from '../../services/analytics/ga4Tracker';
import { getStagedFileForTool, clearStagedFileForTool } from '../../services/utils/stagedFileService';
import {
  resizeImage,
  compressImageToTargetKb,
  processEditorPipeline,
  loadImageFromFile,
  convertPhysicalToPixels,
  convertPixelsToPhysical,
  LengthUnit,
  ProcessedImageResult,
  EditorAdjustments,
  CropArea,
} from '../../services/image/photoStudioService';
import {
  Maximize2,
  Sliders,
  Crop,
  RefreshCw,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  Redo2,
  Eye,
  Info,
  Lock,
  Unlock,
  Check,
  ArrowLeftRight,
  Sun,
  Contrast,
  Image as ImageIcon,
  Zap,
  Thermometer,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  Trash2,
  Camera,
  Compass,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

export type StudioToolMode =
  | 'upload'
  | 'resize'
  | 'adjust'
  | 'crop'
  | 'compress'
  | 'convert'
  | 'rotate'
  | 'straighten';

interface PhotoStudioWorkspaceProps {
  tool: ToolDefinition;
  initialTab?: string;
  onSelectNextTool?: (tool: ToolDefinition) => void;
}

// Visual Presets
interface PresetConfig {
  id: string;
  name: string;
  desc: string;
  adjustments: Partial<EditorAdjustments>;
}

const VISUAL_PRESETS: PresetConfig[] = [
  {
    id: 'natural',
    name: 'Natural',
    desc: 'Original untouched color',
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      warmth: 0,
      sharpness: 0,
      grayscale: false,
      filter: 'none',
    },
  },
  {
    id: 'bright',
    name: 'Bright',
    desc: 'Luminous facial clarity',
    adjustments: {
      brightness: 18,
      contrast: 8,
      saturation: 6,
      exposure: 10,
      warmth: 4,
      sharpness: 15,
      grayscale: false,
      filter: 'none',
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    desc: 'Golden temperature tones',
    adjustments: {
      brightness: 8,
      contrast: 6,
      saturation: 10,
      exposure: 4,
      warmth: 35,
      sharpness: 10,
      grayscale: false,
      filter: 'warm',
    },
  },
  {
    id: 'cool',
    name: 'Cool',
    desc: 'Crisp modern cyan undertones',
    adjustments: {
      brightness: 6,
      contrast: 8,
      saturation: -4,
      exposure: 2,
      warmth: -35,
      sharpness: 15,
      grayscale: false,
      filter: 'cool',
    },
  },
  {
    id: 'bw',
    name: 'Black & White',
    desc: 'Archival monochrome contrast',
    adjustments: {
      brightness: 0,
      contrast: 24,
      saturation: -100,
      exposure: 0,
      warmth: 0,
      sharpness: 25,
      grayscale: true,
      filter: 'none',
    },
  },
  {
    id: 'soft',
    name: 'Soft',
    desc: 'Gentle diffusion & portrait tones',
    adjustments: {
      brightness: 12,
      contrast: -12,
      saturation: -8,
      exposure: 6,
      warmth: 10,
      sharpness: 0,
      grayscale: false,
      filter: 'none',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    desc: 'Deep blacks and punchy colors',
    adjustments: {
      brightness: 0,
      contrast: 36,
      saturation: 16,
      exposure: 8,
      warmth: 0,
      sharpness: 28,
      grayscale: false,
      filter: 'vivid',
    },
  },
];

// Snapshot item for multi-step history and thumbnails
interface HistorySnapshot {
  id: string;
  label: string;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  format: string;
  timestamp: number;
  adjustments: EditorAdjustments;
}

export const PhotoStudioWorkspace: React.FC<PhotoStudioWorkspaceProps> = ({
  tool,
  initialTab,
}) => {
  // Map initial tab if provided
  const resolveInitialToolMode = (): StudioToolMode => {
    if (initialTab) {
      if (initialTab === 'resizer' || initialTab === 'resize') return 'resize';
      if (initialTab === 'editor' || initialTab === 'adjust' || initialTab === 'quick-edit') return 'adjust';
      if (initialTab === 'crop-rotate' || initialTab === 'crop') return 'crop';
      if (initialTab === 'compressor' || initialTab === 'compress') return 'compress';
      if (initialTab === 'converter' || initialTab === 'convert' || initialTab === 'convert-enhance') return 'convert';
      if (initialTab === 'straighten') return 'straighten';
    }
    if (tool.id === 'photo-size-compressor') return 'compress';
    if (tool.id === 'photo-editor') return 'adjust';
    if (tool.id === 'crop-rotate-straighten') return 'crop';
    if (tool.id === 'image-format-converter') return 'convert';
    return 'resize';
  };

  const [activeToolMode, setActiveToolMode] = useState<StudioToolMode>(resolveInitialToolMode);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);

  // Active processed state
  const [activeResult, setActiveResult] = useState<ProcessedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History Snapshots ("Upload Once — Do Everything")
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
  const [activeSnapshotIndex, setActiveSnapshotIndex] = useState<number>(-1);

  // Center Canvas View Controls
  const [comparisonMode, setComparisonMode] = useState<'split' | 'single'>('split');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const comparisonContainerRef = useRef<HTMLDivElement>(null);
  const workspaceCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // Tool 1: Resize Parameters
  // -------------------------------------------------------------
  const [resizeWidth, setResizeWidth] = useState<number>(1280);
  const [resizeHeight, setResizeHeight] = useState<number>(853);
  const [resizeUnit, setResizeUnit] = useState<LengthUnit>('px');
  const [unitWidth, setUnitWidth] = useState<number>(1280);
  const [unitHeight, setUnitHeight] = useState<number>(853);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [resizeDpi, setResizeDpi] = useState<number>(300);
  const [presetSelection, setPresetSelection] = useState<string>('custom');

  // -------------------------------------------------------------
  // Tool 2: Adjust Parameters
  // -------------------------------------------------------------
  const defaultAdjustments: EditorAdjustments = useMemo(
    () => ({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      warmth: 0,
      sharpness: 0,
      grayscale: false,
      filter: 'none',
      rotation: 0,
      straightenAngle: 0,
      flipH: false,
      flipV: false,
    }),
    []
  );

  const [adjustments, setAdjustments] = useState<EditorAdjustments>(defaultAdjustments);
  const [activePreset, setActivePreset] = useState<string>('natural');

  // -------------------------------------------------------------
  // Tool 3: Crop Parameters
  // -------------------------------------------------------------
  const [cropRatio, setCropRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:2' | 'custom'>('free');
  const [cropArea, setCropArea] = useState<CropArea | null>(null);

  // -------------------------------------------------------------
  // Tool 4: Compress Parameters
  // -------------------------------------------------------------
  const [compressTargetValue, setCompressTargetValue] = useState<number>(100);
  const [compressUnit, setCompressUnit] = useState<'KB' | 'MB'>('KB');
  const [compressQuality, setCompressQuality] = useState<number>(85);
  const [compressFormat, setCompressFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [autoDownscale, setAutoDownscale] = useState<boolean>(true);

  // -------------------------------------------------------------
  // Tool 5: Convert Parameters
  // -------------------------------------------------------------
  const [convertFormat, setConvertFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/png');
  const [convertQuality, setConvertQuality] = useState<number>(92);
  const [convertBgColor, setConvertBgColor] = useState<string>('#FFFFFF');

  // -------------------------------------------------------------
  // Tool 6: Rotate & Flip
  // -------------------------------------------------------------
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [flipVertical, setFlipVertical] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Tool 7: Straighten Parameters
  // -------------------------------------------------------------
  const [straightenAngle, setStraightenAngle] = useState<number>(0);

  // Auto-consume staged file from Potto Magic Desk if present
  useEffect(() => {
    const staged = getStagedFileForTool();
    if (staged && (staged.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(staged.name))) {
      clearStagedFileForTool();
      handleFileSelected(staged);
    }
  }, []);

  // Handle uploaded file
  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setStatusMessage('Reading image details...');

    try {
      const img = await loadImageFromFile(file);
      const dataUrl = URL.createObjectURL(file);

      setSourceFile(file);
      setOriginalImage(img);
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setOriginalDataUrl(dataUrl);

      // Default resize dimensions
      setResizeWidth(img.naturalWidth);
      setResizeHeight(img.naturalHeight);
      setUnitWidth(img.naturalWidth);
      setUnitHeight(img.naturalHeight);
      setResizeUnit('px');
      setCropArea({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });

      // Initial active result is the untouched original
      const initialResult: ProcessedImageResult = {
        blob: file,
        dataUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeBytes: file.size,
        sizeKb: parseFloat((file.size / 1024).toFixed(1)),
        format: file.type || 'image/jpeg',
        filename: file.name,
      };

      setActiveResult(initialResult);

      // Initial snapshot for history stack
      const initialSnapshot: HistorySnapshot = {
        id: 'initial',
        label: 'Original',
        dataUrl,
        blob: file,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeBytes: file.size,
        format: file.type || 'image/jpeg',
        timestamp: Date.now(),
        adjustments: defaultAdjustments,
      };

      setSnapshots([initialSnapshot]);
      setActiveSnapshotIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Push new snapshot to the history stack ("Upload Once — Do Everything")
  const commitSnapshot = (result: ProcessedImageResult, actionLabel: string) => {
    setActiveResult(result);

    const newSnapshot: HistorySnapshot = {
      id: `${actionLabel.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      label: actionLabel,
      dataUrl: result.dataUrl,
      blob: result.blob,
      width: result.width,
      height: result.height,
      sizeBytes: result.sizeBytes,
      format: result.format,
      timestamp: Date.now(),
      adjustments: { ...adjustments },
    };

    // Trim redo path and append
    const updated = snapshots.slice(0, activeSnapshotIndex + 1);
    updated.push(newSnapshot);
    setSnapshots(updated);
    setActiveSnapshotIndex(updated.length - 1);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (activeSnapshotIndex > 0) {
      const targetIndex = activeSnapshotIndex - 1;
      const snap = snapshots[targetIndex];
      setActiveSnapshotIndex(targetIndex);
      setActiveResult({
        blob: snap.blob,
        dataUrl: snap.dataUrl,
        width: snap.width,
        height: snap.height,
        sizeBytes: snap.sizeBytes,
        sizeKb: parseFloat((snap.sizeBytes / 1024).toFixed(1)),
        format: snap.format,
        filename: sourceFile?.name || 'edited-image.jpg',
      });
      setAdjustments(snap.adjustments);
      setResizeWidth(snap.width);
      setResizeHeight(snap.height);
    }
  };

  const handleRedo = () => {
    if (activeSnapshotIndex < snapshots.length - 1) {
      const targetIndex = activeSnapshotIndex + 1;
      const snap = snapshots[targetIndex];
      setActiveSnapshotIndex(targetIndex);
      setActiveResult({
        blob: snap.blob,
        dataUrl: snap.dataUrl,
        width: snap.width,
        height: snap.height,
        sizeBytes: snap.sizeBytes,
        sizeKb: parseFloat((snap.sizeBytes / 1024).toFixed(1)),
        format: snap.format,
        filename: sourceFile?.name || 'edited-image.jpg',
      });
      setAdjustments(snap.adjustments);
      setResizeWidth(snap.width);
      setResizeHeight(snap.height);
    }
  };

  const handleReset = () => {
    if (!snapshots.length) return;
    const initialSnap = snapshots[0];
    setActiveSnapshotIndex(0);
    setActiveResult({
      blob: initialSnap.blob,
      dataUrl: initialSnap.dataUrl,
      width: initialSnap.width,
      height: initialSnap.height,
      sizeBytes: initialSnap.sizeBytes,
      sizeKb: parseFloat((initialSnap.sizeBytes / 1024).toFixed(1)),
      format: initialSnap.format,
      filename: sourceFile?.name || 'image.jpg',
    });
    setAdjustments(defaultAdjustments);
    setActivePreset('natural');
    setResizeWidth(initialSnap.width);
    setResizeHeight(initialSnap.height);
    setRotationAngle(0);
    setStraightenAngle(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setCropArea({ x: 0, y: 0, width: initialSnap.width, height: initialSnap.height });
  };

  // Get current active base image element for cumulative processing
  const getCurrentWorkingImage = async (): Promise<HTMLImageElement> => {
    if (activeResult) {
      return await loadImageFromFile(new File([activeResult.blob], 'active.jpg', { type: activeResult.format }));
    }
    if (originalImage) return originalImage;
    throw new Error('No active image available');
  };

  // -------------------------------------------------------------
  // Tool Actions
  // -------------------------------------------------------------

  // 1. Apply Resize
  const handleApplyResize = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    setStatusMessage(`Resizing to ${resizeWidth} × ${resizeHeight} px...`);
    try {
      const img = await getCurrentWorkingImage();
      const res = await resizeImage(
        img,
        {
          targetWidth: resizeWidth,
          targetHeight: resizeHeight,
          maintainAspectRatio: maintainAspect,
          format: activeResult?.format as any || 'image/jpeg',
          dpi: resizeDpi,
        },
        sourceFile.name
      );
      commitSnapshot(res, `Resize (${resizeWidth}×${resizeHeight})`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Resize failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Apply Adjustments
  const handleApplyAdjust = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    setStatusMessage('Applying color, brightness & tone adjustments...');
    try {
      const img = await getCurrentWorkingImage();
      const res = await processEditorPipeline(
        img,
        adjustments,
        null,
        activeResult?.format as any || 'image/jpeg',
        0.92,
        sourceFile.name
      );
      commitSnapshot(res, 'Adjust Tone');
    } catch (err: any) {
      setErrorMessage(err.message || 'Adjustment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Apply Crop
  const handleApplyCrop = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    setStatusMessage('Cropping to selected bounds...');
    try {
      const img = await getCurrentWorkingImage();
      const res = await processEditorPipeline(
        img,
        { ...defaultAdjustments, rotation: 0, straightenAngle: 0 },
        cropArea,
        activeResult?.format as any || 'image/jpeg',
        0.92,
        sourceFile.name
      );
      setResizeWidth(res.width);
      setResizeHeight(res.height);
      setUnitWidth(resizeUnit === 'px' ? res.width : convertPixelsToPhysical(res.width, resizeUnit, resizeDpi));
      setUnitHeight(resizeUnit === 'px' ? res.height : convertPixelsToPhysical(res.height, resizeUnit, resizeDpi));
      setCropArea({ x: 0, y: 0, width: res.width, height: res.height });
      commitSnapshot(res, `Crop (${res.width}×${res.height})`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Crop failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Apply Compress
  const handleApplyCompress = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    const targetInKb = compressUnit === 'MB' ? compressTargetValue * 1024 : compressTargetValue;
    setStatusMessage(`Compressing towards ${compressTargetValue} ${compressUnit}...`);
    try {
      const img = await getCurrentWorkingImage();
      const res = await compressImageToTargetKb(
        img,
        {
          targetKb: targetInKb,
          minKb: Math.max(5, Math.round(targetInKb * 0.4)),
          format: compressFormat,
          autoDownscaleIfNecessary: autoDownscale,
          initialQuality: compressQuality / 100,
        },
        sourceFile.name
      );
      commitSnapshot(res, `Compress (${res.sizeKb} KB)`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Compression failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Apply Convert
  const handleApplyConvert = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    setStatusMessage(`Converting format to ${convertFormat.replace('image/', '').toUpperCase()}...`);
    try {
      const img = await getCurrentWorkingImage();
      const res = await resizeImage(
        img,
        {
          targetWidth: img.naturalWidth,
          targetHeight: img.naturalHeight,
          maintainAspectRatio: true,
          format: convertFormat,
          quality: convertQuality / 100,
          backgroundColor: convertBgColor,
        },
        sourceFile.name
      );
      commitSnapshot(res, `Convert to ${convertFormat.replace('image/', '').toUpperCase()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Format conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Apply Rotate & Flip
  const handleApplyRotate = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    setStatusMessage('Rotating and flipping image...');
    try {
      const img = await getCurrentWorkingImage();
      const res = await processEditorPipeline(
        img,
        {
          ...defaultAdjustments,
          rotation: rotationAngle,
          flipH: flipHorizontal,
          flipV: flipVertical,
        },
        null,
        activeResult?.format as any || 'image/jpeg',
        0.92,
        sourceFile.name
      );
      setResizeWidth(res.width);
      setResizeHeight(res.height);
      commitSnapshot(res, `Rotate ${rotationAngle}°`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Rotation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Apply Straighten
  const handleApplyStraighten = async () => {
    if (!sourceFile) return;
    setIsProcessing(true);
    setStatusMessage(`Correcting alignment to ${straightenAngle}°...`);
    try {
      const img = await getCurrentWorkingImage();
      const res = await processEditorPipeline(
        img,
        {
          ...defaultAdjustments,
          straightenAngle,
        },
        null,
        activeResult?.format as any || 'image/jpeg',
        0.92,
        sourceFile.name
      );
      setResizeWidth(res.width);
      setResizeHeight(res.height);
      commitSnapshot(res, `Straighten ${straightenAngle}°`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Straighten failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Unit and Aspect Ratio handler for Resize
  const handleUnitChange = (newUnit: LengthUnit) => {
    setResizeUnit(newUnit);
    if (newUnit === 'px') {
      setUnitWidth(resizeWidth);
      setUnitHeight(resizeHeight);
    } else {
      setUnitWidth(convertPixelsToPhysical(resizeWidth, newUnit, resizeDpi));
      setUnitHeight(convertPixelsToPhysical(resizeHeight, newUnit, resizeDpi));
    }
  };

  const handleWidthChange = (val: number) => {
    setUnitWidth(val);
    if (isNaN(val) || val <= 0) return;
    const pxW = resizeUnit === 'px' ? Math.round(val) : convertPhysicalToPixels(val, resizeUnit, resizeDpi);
    setResizeWidth(pxW);

    if (maintainAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const pxH = Math.max(1, Math.round(pxW / ratio));
      setResizeHeight(pxH);
      if (resizeUnit === 'px') {
        setUnitHeight(pxH);
      } else {
        setUnitHeight(convertPixelsToPhysical(pxH, resizeUnit, resizeDpi));
      }
    }
  };

  const handleHeightChange = (val: number) => {
    setUnitHeight(val);
    if (isNaN(val) || val <= 0) return;
    const pxH = resizeUnit === 'px' ? Math.round(val) : convertPhysicalToPixels(val, resizeUnit, resizeDpi);
    setResizeHeight(pxH);

    if (maintainAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const pxW = Math.max(1, Math.round(pxH * ratio));
      setResizeWidth(pxW);
      if (resizeUnit === 'px') {
        setUnitWidth(pxW);
      } else {
        setUnitWidth(convertPixelsToPhysical(pxW, resizeUnit, resizeDpi));
      }
    }
  };

  const handleApplyPresetDimensions = (presetKey: string) => {
    setPresetSelection(presetKey);
    let targetW = originalDimensions.width;
    let targetH = originalDimensions.height;

    if (presetKey === '500') {
      targetW = 500;
      targetH = 500;
    } else if (presetKey === '800') {
      targetW = 800;
      targetH = 800;
    } else if (presetKey === '1024') {
      targetW = 1024;
      targetH = 1024;
    } else if (presetKey === '1280x720') {
      targetW = 1280;
      targetH = 720;
    } else if (presetKey === '1920x1080') {
      targetW = 1920;
      targetH = 1080;
    }

    setResizeWidth(targetW);
    setResizeHeight(targetH);
    if (resizeUnit === 'px') {
      setUnitWidth(targetW);
      setUnitHeight(targetH);
    } else {
      setUnitWidth(convertPixelsToPhysical(targetW, resizeUnit, resizeDpi));
      setUnitHeight(convertPixelsToPhysical(targetH, resizeUnit, resizeDpi));
    }
  };

  // Crop Aspect Ratios
  const handleSelectCropRatio = (ratioKey: 'free' | '1:1' | '4:3' | '16:9' | '3:2' | 'custom') => {
    setCropRatio(ratioKey);
    const curW = activeResult?.width || originalDimensions.width;
    const curH = activeResult?.height || originalDimensions.height;

    if (ratioKey === 'free') {
      setCropArea({ x: 0, y: 0, width: curW, height: curH });
      return;
    }

    let targetRatio = 1;
    if (ratioKey === '1:1') targetRatio = 1;
    else if (ratioKey === '4:3') targetRatio = 4 / 3;
    else if (ratioKey === '16:9') targetRatio = 16 / 9;
    else if (ratioKey === '3:2') targetRatio = 3 / 2;

    let cW = curW;
    let cH = Math.round(cW / targetRatio);

    if (cH > curH) {
      cH = curH;
      cW = Math.round(cH * targetRatio);
    }

    const cX = Math.round((curW - cW) / 2);
    const cY = Math.round((curH - cH) / 2);

    setCropArea({ x: cX, y: cY, width: cW, height: cH });
  };

  // Trigger Final Download
  const handleDownload = () => {
    if (!activeResult) return;
    triggerDownload(activeResult.blob, activeResult.filename);
  };

  // Estimated Size
  const estimatedSizeMb = useMemo(() => {
    if (!activeResult) return '1.2 MB';
    return (activeResult.sizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
  }, [activeResult]);

  // Sidebar Tool Items Configuration (Matching reference screenshot)
  const SIDEBAR_TOOLS: { id: StudioToolMode; label: string; icon: any }[] = [
    { id: 'upload', label: 'Upload Image', icon: UploadCloud },
    { id: 'resize', label: 'Resize', icon: Maximize2 },
    { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
    { id: 'crop', label: 'Crop', icon: Crop },
    { id: 'compress', label: 'Compress', icon: Download },
    { id: 'convert', label: 'Convert', icon: RefreshCw },
    { id: 'rotate', label: 'Rotate & Flip', icon: RotateCw },
    { id: 'straighten', label: 'Straighten', icon: Compass },
  ];

  return (
    <div className="space-y-8 select-none" ref={workspaceCardRef}>
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO BANNER (Matches Reference Image) */}
      {/* ------------------------------------------------------------- */}
      <div className="text-center space-y-3 relative py-4">
        {/* Subtle decorative "All in one place" curved badge on top right */}
        <div className="hidden lg:flex items-center gap-2 absolute top-0 right-12 text-slate-700 dark:text-slate-300 font-handwriting text-sm font-semibold pointer-events-none">
          <span className="italic font-bold">All in one place</span>
          <svg className="w-12 h-10 text-indigo-500" viewBox="0 0 50 40" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M40 5 C30 25, 20 28, 5 32" strokeLinecap="round" />
            <path d="M12 25 L5 32 L15 36" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Camera Squircle Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
          <Camera className="w-8 h-8" />
        </div>

        {/* Main Heading */}
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Custom <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Photo Studio</span>
        </h2>

        {/* Tagline */}
        <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200">
          Upload Once — Do Everything
        </p>

        {/* Bullet List */}
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
          Resize • Crop • Edit • Rotate • Straighten • Compress • Convert
        </p>

        {/* Sparkle Pill */}
        <div className="pt-1">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/40 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>One image. Endless possibilities.</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. THREE-PANEL EDITOR WORKSPACE CARD (Matches Reference Image) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* Editor Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900">
          {/* Left: Brand Mark */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
              Potto<span className="text-blue-600">Tools</span>
            </span>
          </div>

          {/* Center: History & Reset Tools */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={activeSnapshotIndex <= 0}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
              title="Undo last action"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={activeSnapshotIndex >= snapshots.length - 1}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
              title="Redo action"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!sourceFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition-all ml-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Right: Preview & Download Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setComparisonMode(comparisonMode === 'split' ? 'single' : 'split')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!activeResult}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 disabled:opacity-40 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Main 3-Panel Grid Body */}
        {/* ----------------------------------------------------------- */}
        <div className="flex flex-col lg:flex-row min-h-[580px]">
          {/* --------------------------------------------------------- */}
          {/* PANEL 1: Left Sidebar (Desktop) */}
          {/* --------------------------------------------------------- */}
          <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-4 space-y-4 bg-white dark:bg-slate-900 shrink-0 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                  Custom Photo Studio
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                  ✨ All-in-One Editor
                </span>
              </div>

              {/* Vertical Nav List on Desktop / Horizontal on Mobile */}
              <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-1">
                {SIDEBAR_TOOLS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeToolMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'upload') {
                          fileInputRef.current?.click();
                        } else {
                          setActiveToolMode(item.id);
                        }
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-extrabold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Card in Sidebar (Matching Reference Image) */}
            <div className="hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-tight font-medium">
                Edit your image with all the tools in one place.
              </p>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* PANEL 2: Center Image Workspace */}
          {/* --------------------------------------------------------- */}
          <div className="flex-1 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between space-y-4 min-w-0">
            {!sourceFile ? (
              <div className="my-auto py-12">
                <FileUploadZone
                  acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
                  maxFileSizeMB={50}
                  multiple={false}
                  files={[]}
                  onFilesSelected={(files) => {
                    if (files.length) handleFileSelected(files[0]);
                  }}
                  onRemoveFile={() => {}}
                />
              </div>
            ) : (
              <>
                {/* Large Central Image Preview with Split Comparison Slider */}
                <div
                  ref={comparisonContainerRef}
                  className="relative w-full h-[380px] sm:h-[460px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none flex items-center justify-center shadow-inner"
                  onMouseDown={(e) => {
                    if (comparisonMode !== 'split') return;
                    setIsDraggingSlider(true);
                    if (comparisonContainerRef.current) {
                      const r = comparisonContainerRef.current.getBoundingClientRect();
                      setSliderPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
                    }
                  }}
                  onMouseMove={(e) => {
                    if (!isDraggingSlider || comparisonMode !== 'split') return;
                    if (comparisonContainerRef.current) {
                      const r = comparisonContainerRef.current.getBoundingClientRect();
                      setSliderPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
                    }
                  }}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onMouseLeave={() => setIsDraggingSlider(false)}
                  onTouchMove={(e) => {
                    if (comparisonMode !== 'split' || !e.touches.length) return;
                    if (comparisonContainerRef.current) {
                      const r = comparisonContainerRef.current.getBoundingClientRect();
                      setSliderPos(Math.max(0, Math.min(100, ((e.touches[0].clientX - r.left) / r.width) * 100)));
                    }
                  }}
                >
                  {/* Layer 1: Original Image */}
                  <div
                    className="absolute inset-0 flex items-center justify-center p-2 transition-transform duration-100"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    <img
                      src={originalDataUrl || ''}
                      alt="Original"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>

                  {/* Layer 2: Edited Result with Clip Path Curtain (Split mode) */}
                  {activeResult && comparisonMode === 'split' && (
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none transition-transform duration-100 flex items-center justify-center p-2"
                      style={{
                        clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                        transform: `scale(${zoomLevel / 100})`,
                      }}
                    >
                      <img
                        src={activeResult.dataUrl}
                        alt="Edited"
                        className="max-h-full max-w-full object-contain pointer-events-none select-none"
                      />
                    </div>
                  )}

                  {/* Layer 3: Output Only (Single mode) */}
                  {activeResult && comparisonMode === 'single' && (
                    <div
                      className="absolute inset-0 flex items-center justify-center p-2 transition-transform duration-100"
                      style={{ transform: `scale(${zoomLevel / 100})` }}
                    >
                      <img
                        src={activeResult.dataUrl}
                        alt="Edited"
                        className="max-h-full max-w-full object-contain pointer-events-none select-none"
                      />
                    </div>
                  )}

                  {/* Split Curtain Handle */}
                  {comparisonMode === 'split' && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none z-10"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-xl flex items-center justify-center pointer-events-auto cursor-ew-resize">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  )}

                  {/* Leveling grid overlay during Straighten */}
                  {activeToolMode === 'straighten' && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-4 border border-blue-400/40 opacity-70 z-10">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="border border-blue-400/20" />
                      ))}
                    </div>
                  )}

                  {/* Badges: Original & Edited */}
                  <span className="absolute top-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold rounded-lg z-20 pointer-events-none shadow-sm">
                    Original
                  </span>
                  <span className="absolute top-3 right-3 px-3 py-1 bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-lg z-20 pointer-events-none shadow-sm">
                    Edited
                  </span>
                </div>

                {/* Floating Bottom Toolbar (Zoom, Fit, Fullscreen) */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                      className="p-1 hover:text-blue-600 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-slate-700 dark:text-slate-300 min-w-[45px] text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(Math.min(300, zoomLevel + 25))}
                      className="p-1 hover:text-blue-600 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                    <button
                      type="button"
                      onClick={() => setZoomLevel(100)}
                      className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                    >
                      <Maximize className="w-3 h-3" />
                      <span>Fit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!document.fullscreenElement) {
                          workspaceCardRef.current?.requestFullscreen();
                          setIsFullscreen(true);
                        } else {
                          document.exitFullscreen();
                          setIsFullscreen(false);
                        }
                      }}
                      className="p-1 hover:text-blue-600 cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnails & Add New Image Strip (Matching Reference Image) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
                  {snapshots.map((snap, idx) => (
                    <button
                      key={snap.id}
                      type="button"
                      onClick={() => {
                        setActiveSnapshotIndex(idx);
                        setActiveResult({
                          blob: snap.blob,
                          dataUrl: snap.dataUrl,
                          width: snap.width,
                          height: snap.height,
                          sizeBytes: snap.sizeBytes,
                          sizeKb: parseFloat((snap.sizeBytes / 1024).toFixed(1)),
                          format: snap.format,
                          filename: sourceFile?.name || 'image.jpg',
                        });
                      }}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-slate-900 ${
                        activeSnapshotIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-500/50 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 opacity-80'
                      }`}
                    >
                      <img src={snap.dataUrl} alt={snap.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold py-0.5 truncate px-1 text-center">
                        {snap.label}
                      </span>
                    </button>
                  ))}

                  {/* Add New Image Dotted Box */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all shrink-0 flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Add new image</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length) {
                        const f = e.target.files[0];
                        const ext = f.name.split('.').pop()?.toLowerCase() || 'image';
                        trackToolFileSelected(1, f.size, [ext], tool.id);
                        handleFileSelected(f);
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* --------------------------------------------------------- */}
          {/* PANEL 3: Right Dynamic Tool Settings Panel */}
          {/* --------------------------------------------------------- */}
          <div className="w-full lg:w-88 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 p-5 space-y-5 bg-white dark:bg-slate-900 shrink-0">
            {/* Top Horizontal Tool Switcher Tabs */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'resize' as const, label: 'Resize', icon: Maximize2 },
                { id: 'adjust' as const, label: 'Adjust', icon: SlidersHorizontal },
                { id: 'crop' as const, label: 'Crop', icon: Crop },
                { id: 'compress' as const, label: 'Compress', icon: Download },
                { id: 'convert' as const, label: 'Convert', icon: RefreshCw },
                { id: 'rotate' as const, label: 'Rotate & Flip', icon: RotateCw },
                { id: 'straighten' as const, label: 'Straighten', icon: Compass },
              ].map((tab) => {
                const Icon = tab.icon;
                const isTabActive = activeToolMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveToolMode(tab.id)}
                    className={`flex flex-col items-center gap-1 pb-1.5 px-2 font-bold text-xs shrink-0 cursor-pointer border-b-2 transition-all ${
                      isTabActive
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* DYNAMIC TOOL CONTROLS */}

            {/* ----------------- 1. RESIZE IMAGE ----------------- */}
            {activeToolMode === 'resize' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Resize Image
                  </h3>
                  <p className="text-xs text-slate-500">Keep your image&apos;s perfect dimensions.</p>
                </div>

                {/* Width & Height Fields with Lock & Unit Dropdown */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Width
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <input
                        type="number"
                        min="1"
                        value={unitWidth || ''}
                        onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                        className="w-full pl-3 pr-1 py-2 text-sm font-bold font-mono bg-transparent outline-none"
                      />
                      <select
                        value={resizeUnit}
                        onChange={(e) => handleUnitChange(e.target.value as LengthUnit)}
                        className="px-2 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                      >
                        <option value="px">px</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="in">in</option>
                        <option value="m">m</option>
                      </select>
                    </div>
                  </div>

                  {/* Lock Aspect Ratio Icon */}
                  <button
                    type="button"
                    onClick={() => setMaintainAspect(!maintainAspect)}
                    className={`mt-5 p-2 rounded-xl border transition-colors cursor-pointer ${
                      maintainAspect
                        ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40'
                        : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:bg-slate-50'
                    }`}
                    title={maintainAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                  >
                    {maintainAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>

                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Height
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <input
                        type="number"
                        min="1"
                        value={unitHeight || ''}
                        onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                        className="w-full pl-3 pr-1 py-2 text-sm font-bold font-mono bg-transparent outline-none"
                      />
                      <select
                        value={resizeUnit}
                        onChange={(e) => handleUnitChange(e.target.value as LengthUnit)}
                        className="px-2 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                      >
                        <option value="px">px</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="in">in</option>
                        <option value="m">m</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Presets Dropdown */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Presets
                  </label>
                  <select
                    value={presetSelection}
                    onChange={(e) => handleApplyPresetDimensions(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer outline-none"
                  >
                    <option value="custom">Original Size</option>
                    <option value="500">500 × 500 px (Square)</option>
                    <option value="800">800 × 800 px (Product)</option>
                    <option value="1024">1024 × 1024 px (HD Square)</option>
                    <option value="1280x720">1280 × 720 px (HD 16:9)</option>
                    <option value="1920x1080">1920 × 1080 px (FHD 16:9)</option>
                  </select>
                </div>

                {/* Maintain Aspect Ratio Toggle Switch */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Maintain Aspect Ratio
                  </span>
                  <button
                    type="button"
                    onClick={() => setMaintainAspect(!maintainAspect)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      maintainAspect ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        maintainAspect ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Dimension Comparison Info Pill */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Original: {originalDimensions.width} × {originalDimensions.height} px ({sourceFile ? formatBytes(sourceFile.size) : '0 KB'})</span>
                  </div>
                  <div className="pl-5 text-slate-600 dark:text-slate-400 text-[11px]">
                    New: {resizeWidth} × {resizeHeight} px (≈ {estimatedSizeMb})
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyResize}
                  disabled={isProcessing || !sourceFile}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Resizing...' : 'Apply Resize'}
                </button>
              </div>
            )}

            {/* ----------------- 2. ADJUST IMAGE ----------------- */}
            {activeToolMode === 'adjust' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Adjust Tone & Color
                  </h3>
                  <p className="text-xs text-slate-500">Fine-tune lighting, warmth and sharpness.</p>
                </div>

                {/* Visual Presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {VISUAL_PRESETS.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActivePreset(p.id);
                        setAdjustments({ ...adjustments, ...p.adjustments });
                      }}
                      className={`p-1.5 rounded-lg border text-center text-[10px] font-bold transition-all cursor-pointer ${
                        activePreset === p.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Sliders */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Brightness</span>
                      <span className="font-mono text-blue-600">{100 + adjustments.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.brightness}
                      onChange={(e) => setAdjustments({ ...adjustments, brightness: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Contrast</span>
                      <span className="font-mono text-blue-600">{adjustments.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.contrast}
                      onChange={(e) => setAdjustments({ ...adjustments, contrast: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Saturation</span>
                      <span className="font-mono text-blue-600">{adjustments.saturation}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.saturation}
                      onChange={(e) => setAdjustments({ ...adjustments, saturation: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Warmth</span>
                      <span className="font-mono text-blue-600">{adjustments.warmth || 0}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.warmth || 0}
                      onChange={(e) => setAdjustments({ ...adjustments, warmth: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Sharpness</span>
                      <span className="font-mono text-blue-600">{adjustments.sharpness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={adjustments.sharpness}
                      onChange={(e) => setAdjustments({ ...adjustments, sharpness: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyAdjust}
                  disabled={isProcessing || !sourceFile}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Applying...' : 'Apply Adjustments'}
                </button>
              </div>
            )}

            {/* ----------------- 3. CROP IMAGE ----------------- */}
            {activeToolMode === 'crop' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Crop Image
                  </h3>
                  <p className="text-xs text-slate-500">Framing and preset aspect ratios.</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'free' as const, label: 'Free Crop' },
                    { id: '1:1' as const, label: '1:1 Square' },
                    { id: '4:3' as const, label: '4:3 Standard' },
                    { id: '16:9' as const, label: '16:9 Wide' },
                    { id: '3:2' as const, label: '3:2 Classic' },
                    { id: 'custom' as const, label: 'Custom' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectCropRatio(r.id)}
                      className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        cropRatio === r.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isProcessing || !sourceFile}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Cropping...' : 'Apply Crop'}
                </button>
              </div>
            )}

            {/* ----------------- 4. COMPRESS IMAGE ----------------- */}
            {activeToolMode === 'compress' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Compress Image
                  </h3>
                  <p className="text-xs text-slate-500">Reduce file size without quality loss.</p>
                </div>

                {/* Target Size Input */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Target File Size
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={compressTargetValue}
                      onChange={(e) => setCompressTargetValue(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Unit
                    </label>
                    <select
                      value={compressUnit}
                      onChange={(e) => setCompressUnit(e.target.value as any)}
                      className="w-full px-2 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[20, 50, 100, 200].map((kb) => (
                    <button
                      key={kb}
                      type="button"
                      onClick={() => {
                        setCompressTargetValue(kb);
                        setCompressUnit('KB');
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 text-center"
                    >
                      {kb} KB
                    </button>
                  ))}
                </div>

                {/* Quality Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Quality</span>
                    <span className="font-mono text-blue-600">{compressQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={compressQuality}
                    onChange={(e) => setCompressQuality(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyCompress}
                  disabled={isProcessing || !sourceFile}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Compressing...' : 'Apply Compress'}
                </button>
              </div>
            )}

            {/* ----------------- 5. CONVERT FORMAT ----------------- */}
            {activeToolMode === 'convert' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Convert Format
                  </h3>
                  <p className="text-xs text-slate-500">Cross-convert between JPG, PNG, and WebP.</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'image/jpeg' as const, label: 'JPG' },
                    { id: 'image/png' as const, label: 'PNG' },
                    { id: 'image/webp' as const, label: 'WebP' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setConvertFormat(fmt.id)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        convertFormat === fmt.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleApplyConvert}
                  disabled={isProcessing || !sourceFile}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Converting...' : 'Apply Convert'}
                </button>
              </div>
            )}

            {/* ----------------- 6. ROTATE & FLIP ----------------- */}
            {activeToolMode === 'rotate' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Rotate & Flip
                  </h3>
                  <p className="text-xs text-slate-500">Orient your photo in any direction.</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotationAngle((rotationAngle + 270) % 360)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                    title="Rotate 90° CCW"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotationAngle((rotationAngle + 90) % 360)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                    title="Rotate 90° CW"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipHorizontal(!flipHorizontal)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                      flipHorizontal ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipVertical(!flipVertical)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                      flipVertical ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleApplyRotate}
                  disabled={isProcessing || !sourceFile}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Rotating...' : 'Apply Rotation'}
                </button>
              </div>
            )}

            {/* ----------------- 7. STRAIGHTEN ----------------- */}
            {activeToolMode === 'straighten' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Fine Straighten
                  </h3>
                  <p className="text-xs text-slate-500">Correct horizon alignment with grid guides.</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Angle</span>
                    <span className="font-mono text-blue-600">{straightenAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    value={straightenAngle}
                    onChange={(e) => setStraightenAngle(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyStraighten}
                  disabled={isProcessing || !sourceFile}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Straightening...' : 'Apply Straighten'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SIX BOTTOM FEATURE CARDS (Matches Reference Image Exactly) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-4">
        {/* Card 1: Resize */}
        <div
          onClick={() => setActiveToolMode('resize')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Maximize2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">Resize</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Set custom dimensions in <span className="font-bold">px, cm, mm, in, m.</span>
          </p>
        </div>

        {/* Card 2: Adjust */}
        <div
          onClick={() => setActiveToolMode('adjust')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">Adjust</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Control brightness, contrast, saturation &amp; more.
          </p>
        </div>

        {/* Card 3: Crop */}
        <div
          onClick={() => setActiveToolMode('crop')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center mx-auto shadow-sm">
            <Crop className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">Crop</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Crop freely or use preset ratios.
          </p>
        </div>

        {/* Card 4: Compress */}
        <div
          onClick={() => setActiveToolMode('compress')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-sm">
            <Download className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">Compress</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Reduce file size without losing quality.
          </p>
        </div>

        {/* Card 5: Convert */}
        <div
          onClick={() => setActiveToolMode('convert')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">Convert</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Change format (JPG, PNG, WEBP).
          </p>
        </div>

        {/* Card 6: Rotate & Flip */}
        <div
          onClick={() => setActiveToolMode('rotate')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <RotateCw className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">Rotate &amp; Flip</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Rotate, flip or straighten your image.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="text-center pt-2 pb-4">
        <span className="text-xs font-semibold text-slate-400 tracking-wider">
          — Your Complete Image Editing Workspace —
        </span>
      </div>

      {/* Google AdSense Ad Slot */}
      <AdSlot placement="tool-mid-banner" format="responsive" minHeight={90} />

      {/* Structured Instructions & FAQs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            How to Use Custom Photo Studio
          </h2>
          <ol className="mt-3 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
            <li>Upload your photo once using the Upload button or drag-and-drop.</li>
            <li>Select any tool from the left sidebar or top tabs: Resize, Adjust, Crop, Compress, Convert, Rotate &amp; Flip, or Straighten.</li>
            <li>Configure your parameters and click Apply. Changes are saved as a new snapshot in your thumbnail strip.</li>
            <li>Inspect your results in real time using the interactive Before/After split curtain slider.</li>
            <li>Apply additional operations in any order, and click Download when satisfied.</li>
          </ol>
        </div>

        {tool.faqs && tool.faqs.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {tool.faqs.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {faq.question}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
