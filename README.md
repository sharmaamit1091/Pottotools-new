# PottoTools – All-in-One PDF, Image & Office Tools

> **Tagline:** Every Document Tool You Need. Free, Fast and Secure.  
> **Architecture:** 100% Client-Side In-Browser Processing (Zero Document Uploads)

PottoTools is a production-grade, responsive web application offering free online document, PDF, OCR, image, and office utilities without requiring users to install software, create accounts, or enter payment details.

---

## 🚀 Key Features & Tool Categories

### 1. Organize PDF
- **Merge PDF:** Combine multiple PDF documents into a single consolidated file in any order.
- **Split & Extract PDF Pages:** Extract custom page ranges (`1-3, 5, 8-10`) into a single PDF or individual files in a ZIP archive.
- **Rotate PDF:** Rotate all or designated pages by 90°, 180°, or 270°.
- **Delete Pages:** Remove unnecessary or blank pages from documents.
- **Watermark PDF:** Add custom vector stamps ("CONFIDENTIAL", copyright) with opacity and angle controls.
- **Page Numbers:** Insert clean numbering (`Page X of Y` or `1, 2, 3`) with custom position coordinates.

### 2. Compress & Optimize PDF
- **Target Size Presets:** 100 KB, 200 KB, 500 KB, 1 MB, 2 MB, or custom target in KB/MB.
- **Smart Hardware Optimization:** Combines stream re-encoding and canvas page rasterization for scanned/image-heavy documents.
- **Real Metrics:** Displays original size, new size, and reduction percentage. Never claims a target was met unless validated by the actual output size.

### 3. Government & Job Exam Application Tools
- **Photo & Signature Resizer:** Dual constraint convergence ensuring both exact pixel dimensions (e.g. `200x230 px` or `140x60 px`) and strict file size bounds (e.g. `20 KB – 50 KB`).
- **Verified Authority Presets:** UPSC, SSC, IBPS Bank PO/Clerk, Standard 35x45mm Passport, US 2x2 inch Visa (verified October 2026).
- **White Background Enforcement:** Automatically fills transparent or alpha regions with official compliant backgrounds.

### 4. Convert Documents
- **PDF to Word (.docx):** Extracts paragraphs, headings, and text blocks into genuine Microsoft Word OpenXML (`.docx`) files compatible with Word, LibreOffice, and Google Docs.
- **Word (.docx) to PDF:** Compiles clean vector PDFs from Word documents.
- **DOCX to TXT / HTML:** Extracts clean plain text or semantic HTML markup.
- **Text & Markdown to PDF:** Formats raw prose or GitHub Markdown into clean, paginated PDF documents.

### 5. Convert Images
- **Cross-Format Conversion:** Convert between JPG, PNG, WEBP, and BMP.
- **Photos to PDF:** Merge multiple scans or photos into a unified multi-page PDF document.
- **PDF to Images:** Export all pages of a PDF as individual JPG or PNG images or download all in a ZIP archive.
- **Batch Processing & Quality Sliders:** Quality control (1%–100%) and transparency warnings.

### 6. OCR & Scanned Documents
- **Optical Character Recognition:** Powered by Tesseract.js running locally in browser Web Workers.
- **Multilingual Support:** English (Latin) and Hindi (Devanagari) models.
- **Real-Time Progress & Word Export:** Displays downloading/recognition progress, provides an editable preview, and exports directly to `.docx` or `.txt`.

### 7. PDF Security & Signing
- **Sign PDF:** Draw signature on touch/mouse canvas or upload image signature and embed onto any document page.
- **Password Protection:** Encrypt PDF documents with user passwords.
- **Metadata Sanitizer:** Inspect and purge hidden author, producer, and timestamp tracking tags.

### 8. Office Spreadsheets
- **CSV to Excel (.xlsx):** Generates native Microsoft Excel workbooks from CSV data.
- **Excel to CSV:** Extracts worksheet data into clean CSV.
- **Spreadsheet Viewer:** Inspects XLSX/CSV rows with search filtering, sheet tabs, and JSON export.

### 9. Smart Document Utilities
- **PDF Text Extractor & Word Counter:** Word counts, character counts, reading time, and full text copy.
- **Text Cleaner:** Strips redundant spaces, removes empty blank lines, and converts case.
- **Side-by-Side Diff Comparator:** Line-by-line visual difference highlighting between two document revisions.

---

## 🔒 Zero-Knowledge Privacy Architecture

1. **Local-First Execution:** All document manipulation runs inside the user's web browser using WebAssembly and HTML5 Canvas.
2. **Zero File Uploads:** Files are read directly into memory buffers; no documents are transmitted across the internet.
3. **Automatic Memory Cleanup:** Buffer allocations and Blob Object URLs are revoked immediately after completion to keep browser memory lean.

---

## 💰 Monetag Advertising & Verification
PottoTools is configured for Monetag monetization:
1. **Verification Tag:** The Monetag verification meta tag is placed in `<head>` of `index.html`.
2. **Configuration File:** Ad placements are organized in `src/config/monetization.ts`.
3. **Placements:** Reusable ad containers collapse cleanly until official Monetag ad code/zones are supplied.
---

## 🛠️ Development & Production Build

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```
Accessible at `http://localhost:3000`.

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory.

---

## 🌐 Free Hosting Deployment

PottoTools runs as a static Single Page Application (SPA), allowing free deployment on modern static hosting platforms:

- **Cloudflare Pages / Vercel / Netlify:**
  - Build command: `npm run build`
  - Output directory: `dist`
  - SPA fallback: Route all paths to `index.html`.
- **Firebase Hosting:**
  - Run `firebase init hosting`, select `dist` as public directory, and configure as single-page app (`rewrites: [{ source: "**", destination: "/index.html" }]`).
- **GitHub Pages:**
  - Build and deploy the `dist/` directory using GitHub Actions.
