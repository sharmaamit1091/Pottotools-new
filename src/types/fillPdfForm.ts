/**
 * Type definitions for the FILL PDF FORM editor, interactive AcroForm fields,
 * reusable session assets, auto-detection suggestions, and saved project files.
 */

export type FormElementType =
  | 'text'
  | 'date'
  | 'image'
  | 'signature'
  | 'mark'
  | 'shape';

export type FormFontFamily = 'helvetica' | 'times' | 'courier' | 'devanagari';
export type FormTextAlign = 'left' | 'center' | 'right';
export type FormMarkKind = 'check' | 'cross' | 'checkbox-empty' | 'checkbox-checked' | 'dot';
export type FormShapeKind = 'line-h' | 'line-v' | 'rect' | 'circle';
export type PageRotationDeg = 0 | 90 | 180 | 270;

export interface BaseFormElement {
  id: string;
  type: FormElementType;
  /** 1-based page number */
  pageNum: number;
  /** Normalized 0..1 coordinates relative to the currently displayed (rotated) page viewport, top-left origin */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotation in degrees clockwise */
  rotation: number;
  opacity: number;
}

export interface TextFormElement extends BaseFormElement {
  type: 'text' | 'date';
  text: string;
  fontFamily: FormFontFamily;
  /** Font size in PDF points */
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: FormTextAlign;
  backgroundColor?: string;
  /** Optional ID of a detected inline slot or table cell this entry occupies */
  slotId?: string;
  /** When true, text wraps and auto-fits strictly inside [width, height] without overflowing neighbors */
  boundedBox?: boolean;
  /** Optional table coordinates for Tab / Enter spreadsheet-like navigation */
  tableId?: string;
  tableRow?: number;
  tableCol?: number;
}

export interface DetectedFormSlot {
  id: string;
  pageNum: number;
  kind: 'table-cell' | 'inline-blank';
  /** Normalized 0..1 box relative to displayed page viewport */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional label hint inferred from nearby text (e.g. "Date", "Years", "Board/University") */
  label?: string;
  /** Suggested default font size in PDF points fitted to the slot height */
  suggestedFontSize?: number;
  /** Table coordinates when kind === 'table-cell' */
  tableId?: string;
  row?: number;
  col?: number;
}

export interface PdfTextSpanBox {
  id: string;
  pageNum: number;
  text: string;
  /** Normalized 0..1 bounding box relative to displayed page viewport */
  x: number;
  y: number;
  width: number;
  height: number;
  fontSizePt: number;
}

export interface WhiteoutPatch {
  id: string;
  pageNum: number;
  /** Normalized 0..1 rectangle relative to displayed page viewport */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Sampled matching paper background hex color (e.g. #ffffff) */
  fillColor: string;
  /** Optional removed original text for accessibility / debugging */
  removedText?: string;
}

export interface ImageFormElement extends BaseFormElement {
  type: 'image' | 'signature';
  /** Data URL (PNG/JPEG) baked with any user crop */
  dataUrl: string;
  /** Original uncropped data URL for re-cropping */
  originalDataUrl?: string;
  /** Optional source asset ID from ReusableMediaAsset library (deleting this element never deletes the library asset) */
  sourceAssetId?: string;
  aspectRatio: number;
  lockAspectRatio: boolean;
}

export interface MarkFormElement extends BaseFormElement {
  type: 'mark';
  markKind: FormMarkKind;
  color: string;
  strokeWidth: number;
}

export interface ShapeFormElement extends BaseFormElement {
  type: 'shape';
  shapeKind: FormShapeKind;
  strokeColor: string;
  fillColor: string; // 'transparent' or hex
  strokeWidth: number;
}

export type FormElement =
  | TextFormElement
  | ImageFormElement
  | MarkFormElement
  | ShapeFormElement;

export interface ReusableMediaAsset {
  id: string;
  kind: 'photo' | 'signature';
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface ReusableTextSnippet {
  id: string;
  label: string;
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: FormFontFamily;
}

export type InteractiveFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown';

export interface DetectedInteractiveField {
  /** Unique widget ID (fieldName + widgetIndex) */
  id: string;
  /** AcroForm field name in pdf-lib */
  fieldName: string;
  type: InteractiveFieldType;
  pageNum: number;
  /** Normalized 0..1 box relative to UNROTATED page viewport (scale 1, native PDF rotation applied) */
  x: number;
  y: number;
  width: number;
  height: number;
  /** For radio buttons, the export value this specific widget represents */
  exportValue?: string;
  /** Dropdown options if type === 'dropdown' */
  options?: string[];
  multiline?: boolean;
  readOnly?: boolean;
  initialValue: string | boolean;
}

export type SuggestedFieldCategory =
  | 'name'
  | 'address'
  | 'date'
  | 'mobile'
  | 'email'
  | 'photo'
  | 'signature'
  | 'checkbox'
  | 'text';

export interface SuggestedFieldArea {
  id: string;
  pageNum: number;
  label: string;
  category: SuggestedFieldCategory;
  /** Normalized 0..1 box in currently displayed page coordinates */
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: 'high' | 'medium';
  source: 'text-layout' | 'ocr';
}

export interface PageMetaInfo {
  pageNum: number;
  /** Original visual dimensions in PDF points (after native PDF /Rotate) */
  baseWidth: number;
  baseHeight: number;
  /** Native /Rotate angle from source PDF */
  nativeRotation: PageRotationDeg;
}

export interface FillPdfEditorSnapshot {
  elements: FormElement[];
  interactiveValues: Record<string, string | boolean>;
  pageRotations: Record<number, PageRotationDeg>;
}

export interface SavedFillPdfProjectMetadata {
  version: 1;
  savedAt: string;
  originalFileName: string;
  activePage: number;
  elements: FormElement[];
  interactiveValues: Record<string, string | boolean>;
  pageRotations: Record<number, PageRotationDeg>;
  mediaAssets: ReusableMediaAsset[];
  textSnippets: ReusableTextSnippet[];
}

export type ActiveEditorTool =
  | 'select'
  | 'text'
  | 'date'
  | 'check'
  | 'cross'
  | 'checkbox-empty'
  | 'checkbox-checked'
  | 'line-h'
  | 'line-v'
  | 'rect'
  | 'circle';
