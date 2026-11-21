/**
 * WebMCP (Web Model Context Protocol) In-Browser Agent Integration
 * Conforms to the W3C / WebMCP specification allowing in-browser LLM agents
 * to discover and execute client-side tools directly via navigator.modelContext.
 */

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: WebMcpTool) => void;
      unregisterTool?: (toolName: string) => void;
    };
  }
  interface Window {
    modelContext?: {
      registerTool: (tool: WebMcpTool) => void;
      unregisterTool?: (toolName: string) => void;
    };
  }
}

export function registerWebMcpTools(): void {
  if (typeof window === 'undefined') return;

  const mcpProvider =
    window.navigator?.modelContext ||
    window.modelContext ||
    (window as any).__webmcp__;

  const tools: WebMcpTool[] = [
    {
      name: 'compress_pdf',
      description: 'Compress and optimize PDF file sizes down to target limits (100KB, 200KB, 500KB) with 100% client-side privacy.',
      inputSchema: {
        type: 'object',
        properties: {
          targetKB: { type: 'number', description: 'Target maximum file size in KB (e.g. 100, 200, 500)' },
          action: { type: 'string', enum: ['open', 'info'], description: 'Desired action' },
        },
      },
      execute: async (params) => {
        if (params.action === 'open' || !params.action) {
          window.location.href = '/compress-pdf';
        }
        return {
          success: true,
          tool: 'compress-pdf',
          url: 'https://pottotools.in/compress-pdf',
          message: 'Compress PDF tool ready. Processing is 100% in-browser WebAssembly.',
        };
      },
    },
    {
      name: 'merge_pdf',
      description: 'Combine multiple PDF documents into a single organized file in custom order.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['open', 'info'] },
        },
      },
      execute: async () => {
        window.location.href = '/merge-pdf';
        return {
          success: true,
          tool: 'merge-pdf',
          url: 'https://pottotools.in/merge-pdf',
        };
      },
    },
    {
      name: 'split_pdf',
      description: 'Split large PDF documents into separate files by page ranges or individual pages.',
      inputSchema: {
        type: 'object',
        properties: {
          pageRange: { type: 'string', description: "Custom page range e.g. '1-3', '5'" },
        },
      },
      execute: async () => {
        window.location.href = '/split-pdf';
        return {
          success: true,
          tool: 'split-pdf',
          url: 'https://pottotools.in/split-pdf',
        };
      },
    },
    {
      name: 'pdf_to_word',
      description: 'Convert PDF files into editable Microsoft Word (.docx) documents with layout preserved.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['open', 'info'] },
        },
      },
      execute: async () => {
        window.location.href = '/pdf-to-word';
        return {
          success: true,
          tool: 'pdf-to-word',
          url: 'https://pottotools.in/pdf-to-word',
        };
      },
    },
    {
      name: 'custom_photo_studio',
      description: 'Resize, crop, adjust, compress to exact KB, and convert image formats (JPG, PNG, WebP) in a single studio workspace.',
      inputSchema: {
        type: 'object',
        properties: {
          targetKB: { type: 'number', description: 'Target file size in KB' },
          format: { type: 'string', enum: ['jpg', 'png', 'webp'] },
        },
      },
      execute: async () => {
        window.location.href = '/custom-photo-studio';
        return {
          success: true,
          tool: 'custom-photo-studio',
          url: 'https://pottotools.in/custom-photo-studio',
        };
      },
    },
    {
      name: 'ocr_scanner',
      description: 'Extract editable text from scanned PDFs and photos using in-browser OCR (English & Hindi).',
      inputSchema: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['eng', 'hin'] },
        },
      },
      execute: async () => {
        window.location.href = '/ocr-tool';
        return {
          success: true,
          tool: 'ocr-tool',
          url: 'https://pottotools.in/ocr-tool',
        };
      },
    },
  ];

  if (mcpProvider && typeof mcpProvider.registerTool === 'function') {
    try {
      tools.forEach((tool) => {
        mcpProvider.registerTool(tool);
      });
      console.info('[WebMCP] Registered 6 browser tools with navigator.modelContext');
    } catch (err) {
      console.warn('[WebMCP] Registration failed:', err);
    }
  } else {
    // Expose polyfill / global registry for in-browser AI assistants
    (window as any).__webmcp_tools__ = tools;
  }
}
