import express, { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getToolBySlug } from './src/config/toolsRegistry.js';
import { getBlogPostBySlug } from './src/config/blogPosts.js';
import { getHindiPageBySlug } from './src/config/hindiPages.js';
import {
  buildToolPageHtml,
  buildCategoryPageHtml,
  buildInformationalPageHtml,
  buildBlogIndexHtml,
  buildBlogPostHtml,
  buildHindiPageHtml,
  CATEGORY_PAGES_DATA,
  INFORMATIONAL_PAGES_DATA,
} from './src/services/seo/htmlGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

function resolveServerPort(): number {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port' && argv[i + 1]) {
      const parsed = parseInt(argv[i + 1], 10);
      if (!Number.isNaN(parsed)) return parsed;
    } else if (argv[i].startsWith('--port=')) {
      const parsed = parseInt(argv[i].slice('--port='.length), 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  if (!isProduction && process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT) {
    return parseInt(process.env.DEFAULT_APP_PORT || '3000', 10);
  }
  return parseInt(process.env.PORT || '3000', 10);
}

const PORT = resolveServerPort();

const VALID_TOOL_SLUGS = new Set([
  'searchable-pdf-text-finder',
  'office-note-digitizer',
  'pdf-page-organizer',
  'merge-pdf',
  'split-pdf',
  'delete-pdf-pages',
  'watermark-pdf',
  'page-numbers-pdf',
  'compress-pdf',
  'pdf-to-editable-word',
  'pdf-to-word',
  'word-to-pdf',
  'docx-to-txt',
  'docx-to-html',
  'txt-to-pdf',
  'markdown-to-pdf',
  'image-converter',
  'image-to-pdf',
  'pdf-to-images',
  'ocr-tool',
  'protect-pdf',
  'unlock-pdf',
  'pdf-id-redactor',
  'remove-scan-watermark',
  'fill-pdf-form',
  'sign-pdf',
  'pdf-metadata',
  'custom-photo-studio',
  'custom-photo-resizer',
  'photo-size-compressor',
  'photo-signature-resizer',
  'photo-editor',
  'hd-image-enhancer',
  'image-format-converter',
  'photo-background-changer',
  'passport-photo-cropper',
  'combine-app-documents',
  'pdf-text-extractor',
  'text-diff-comparator',
  'text-cleaner',
  'csv-to-xlsx',
  'xlsx-to-csv',
  'sheet-viewer',
  'powerpoint-to-pdf',
  'excel-to-pdf',
  'pdf-to-excel',
  'jpg-to-png',
  'png-to-jpg',
  'crop-rotate-straighten',
]);

const VALID_CATEGORIES = new Set([
  'pdf-tools',
  'word-tools',
  'excel-tools',
  'powerpoint-tools',
  'image-tools',
  'other-document-tools',
  'organize-pdf',
  'convert-docs',
  'convert-documents',
  'convert-images',
  'ocr-scanned',
  'pdf-security',
  'smart-utilities',
  'spreadsheets',
  'gov-tools',
  'category-compress-pdf',
]);

const VALID_PAGES = new Set([
  '',
  'about',
  'about-us',
  'contact',
  'contact-us',
  'privacy',
  'terms',
  'disclaimer',
  'directory',
  'all-tools',
  'cookie-policy',
  'cookies',
]);

function isValidRoute(rawPath: string): boolean {
  const clean = rawPath.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (VALID_PAGES.has(clean)) return true;
  if (VALID_CATEGORIES.has(clean)) return true;
  if (clean.startsWith('category-')) return true;
  if (VALID_TOOL_SLUGS.has(clean)) return true;
  if (clean === 'blog') return true;
  if (clean.startsWith('blog/') && Boolean(getBlogPostBySlug(clean.slice('blog/'.length)))) return true;
  if (Boolean(getHindiPageBySlug(clean))) return true;
  return false;
}

async function createServer() {
  const app = express();

  // Trust reverse proxies (Cloud Run, Firebase Hosting, Nginx, LiteSpeed, etc.)
  app.enable('trust proxy');

  // Enforce HTTPS redirection and HSTS for all external requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Always set HTTP Strict Transport Security (HSTS) header
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    const host = req.get('host') || '';
    const isLocalhost =
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.startsWith('0.0.0.0') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.');

    // Check forwarded protocol from reverse proxies/load balancers
    const proto = (req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http')).toLowerCase();

    if (isProduction && !isLocalhost && !host.endsWith('.run.app')) {
      const normalizedHost = host.replace(/^www\./i, '');
      if (host.toLowerCase().startsWith('www.') || proto === 'http') {
        return res.redirect(301, `https://${normalizedHost}${req.originalUrl}`);
      }
    }

    next();
  });

  // Canonical 301 redirects for duplicate/alias routes so Google never sees duplicate pages or chains
  const CANONICAL_ALIAS_REDIRECTS: Record<string, string> = {
    '/about-us': '/about',
    '/contact-us': '/contact',
    '/all-tools': '/',
    '/directory': '/',
    '/cookies': '/cookie-policy',
    '/pdf-to-word': '/pdf-to-editable-word',
    '/custom-photo-resizer': '/custom-photo-studio',
    '/photo-editor': '/custom-photo-studio',
    '/hd-image-enhancer': '/custom-photo-studio',
    '/crop-rotate-straighten': '/custom-photo-studio',
    '/passport-photo-cropper': '/photo-signature-resizer',
    '/photo-background-changer': '/photo-signature-resizer',
    '/image-format-converter': '/image-converter',
    '/jpg-to-png': '/image-converter',
    '/png-to-jpg': '/image-converter',
    '/combine-app-documents': '/merge-pdf',
    '/office-note-organizer': '/office-note-digitizer',
    '/organize-pdf': '/pdf-tools',
    '/ocr-scanned': '/pdf-tools',
    '/pdf-security': '/pdf-tools',
    '/category-compress-pdf': '/pdf-tools',
    '/top-pdf-tools': '/pdf-tools',
    '/convert-docs': '/word-tools',
    '/convert-documents': '/word-tools',
    '/spreadsheets': '/excel-tools',
    '/convert-images': '/image-tools',
    '/gov-tools': '/image-tools',
    '/category-gov-tools': '/image-tools',
    '/image-tools-presets': '/image-tools',
    '/smart-utilities': '/other-document-tools',
  };

  app.use((req: Request, res: Response, next: NextFunction) => {
    const cleanPath = req.path.replace(/\/+$/, '').toLowerCase() || '/';
    const redirectTarget = CANONICAL_ALIAS_REDIRECTS[cleanPath];
    if (redirectTarget) {
      return res.redirect(301, redirectTarget);
    }
    // Strip trailing slashes on non-root paths
    if (req.path.length > 1 && req.path.endsWith('/')) {
      const target = req.path.replace(/\/+$/, '') + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
      return res.redirect(301, target);
    }
    // Prevent search query parameter URLs (?q=...) from competing for indexation in GSC
    if (req.query.q !== undefined) {
      res.setHeader('X-Robots-Tag', 'noindex, follow');
    }
    next();
  });

  // Content Security Policy (CSP) & Security Headers configured for Google AdSense, Analytics & Adsterra
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self' https: data: blob:",
        "script-src 'self' blob: 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://tpc.googlesyndication.com https://www.googletagmanager.com https://*.google.com https://*.gstatic.com https://bauval.org https://*.bauval.org https://*.effectivegatecpm.com https://*.highperformanceformat.com https://*.topcreativeformat.com https://*.profitablecpmrate.com https://*.adsterra.com https:",
        "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://www.google.com https://*.google.com https:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' blob: https:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:",
        "font-src 'self' data: https://fonts.gstatic.com https:",
        "worker-src 'self' blob:",
        "frame-ancestors 'self' https://adsense.google.com https://*.google.com https://*.googleusercontent.com https://*.run.app",
      ].join('; ')
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // RFC 8288 Link header and Content-Signal middleware for AI agents and resource advertisement
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Link',
      '</llms.txt>; rel="describedby", </llms-full.txt>; rel="alternate"; type="text/markdown", </.well-known/mcp/server-card.json>; rel="service-desc"'
    );
    res.setHeader('Content-Signal', 'search=yes, ai-train=no');
    next();
  });

  // Explicit ads.txt route handler for Google AdSense crawler
  app.get('/ads.txt', (_req: Request, res: Response) => {
    const adsTxtPath = path.resolve(__dirname, 'public/ads.txt');
    const content = fs.existsSync(adsTxtPath)
      ? fs.readFileSync(adsTxtPath, 'utf-8')
      : 'google.com, pub-9169378293935942, DIRECT, f08c47fec0942fa0\n';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    return res.status(200).send(content);
  });

  // Explicit robots.txt route handler
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const robotsPath = path.resolve(__dirname, 'public/robots.txt');
    const content = fs.existsSync(robotsPath)
      ? fs.readFileSync(robotsPath, 'utf-8')
      : 'User-agent: *\nAllow: /\n';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    return res.status(200).send(content);
  });

  // Explicit llms.txt route handler serving Markdown according to llmstxt.org spec
  app.get(['/llms.txt', '/.well-known/llms.txt'], (_req: Request, res: Response) => {
    const llmsPath = path.resolve(__dirname, 'public/llms.txt');
    if (fs.existsSync(llmsPath)) {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      return res.status(200).sendFile(llmsPath);
    }
    return res.status(404).send('Not Found');
  });

  // Explicit llms-full.txt route handler serving Markdown
  app.get(['/llms-full.txt', '/.well-known/llms-full.txt'], (_req: Request, res: Response) => {
    const llmsFullPath = path.resolve(__dirname, 'public/llms-full.txt');
    if (fs.existsSync(llmsFullPath)) {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      return res.status(200).sendFile(llmsFullPath);
    }
    return res.status(404).send('Not Found');
  });

  // Serve static assets from public/ directory explicitly
  app.use(express.static(path.resolve(__dirname, 'public'), { index: false }));

  // Content negotiation: Serve Markdown when requested (Issue 9)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const accept = req.headers.accept || '';
    const wantsMarkdown =
      accept.includes('text/markdown') ||
      accept.includes('text/x-markdown') ||
      req.query.format === 'markdown' ||
      req.query.markdown === 'true';

    if (wantsMarkdown && (req.path === '/' || !path.extname(req.path))) {
      const llmsFullPath = path.resolve(__dirname, 'public/llms-full.txt');
      const llmsPath = path.resolve(__dirname, 'public/llms.txt');
      const targetFile = fs.existsSync(llmsFullPath) ? llmsFullPath : llmsPath;

      if (fs.existsSync(targetFile)) {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Vary', 'Accept');
        return res.status(200).sendFile(targetFile);
      }
    }
    next();
  });

  const httpServer = http.createServer(app);
  let vite: any;
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist'), { index: false }));
  }

  // SPA Route handler with real HTTP 404 for missing pages (Issue 3)
  app.use(async (req: Request, res: Response) => {
    const rawPath = req.path;

    // In development mode, fallback transform only for non-asset /src/ or /@ requests
    if (!isProduction && (rawPath.startsWith('/src/') || rawPath.startsWith('/@'))) {
      try {
        const result = await vite.transformRequest(req.originalUrl || rawPath);
        if (result) {
          return res.status(200).set({ 'Content-Type': 'text/javascript; charset=utf-8' }).end(result.code);
        }
      } catch (err: any) {
        console.error('[Vite transform fallback error]:', err);
      }
    }

    // Static asset requests with an extension that reached here do not exist -> Real 404 (except /index.html)
    if (rawPath !== '/index.html' && path.extname(rawPath)) {
      const notFoundPath = path.resolve(__dirname, 'public/404.html');
      if (fs.existsSync(notFoundPath)) {
        return res.status(404).sendFile(notFoundPath);
      }
      return res.status(404).send('Not Found');
    }

    const effectivePath = rawPath === '/index.html' ? '/' : rawPath;

    // Verify whether the URL path is a valid tool, category, or legal page
    if (!isValidRoute(effectivePath)) {
      const notFoundPath = path.resolve(__dirname, 'public/404.html');
      if (fs.existsSync(notFoundPath)) {
        return res.status(404).sendFile(notFoundPath);
      }
      return res.status(404).send('404 Page Not Found');
    }

    // Valid route -> Serve SPA entry point with HTTP 200 OK
    const cleanSlug = effectivePath.replace(/^\/+|\/+$/g, '').toLowerCase();
    const tool = getToolBySlug(cleanSlug);

    try {
      const matchedCat = CATEGORY_PAGES_DATA.find((c) => c.slug === cleanSlug);
      const matchedInfo = INFORMATIONAL_PAGES_DATA.find(
        (i) =>
          i.slug === cleanSlug ||
          (i.slug === 'about' && cleanSlug === 'about-us') ||
          (i.slug === 'contact' && cleanSlug === 'contact-us') ||
          (i.slug === 'directory' && cleanSlug === 'all-tools')
      );
      const matchedPost = cleanSlug.startsWith('blog/')
        ? getBlogPostBySlug(cleanSlug.slice('blog/'.length))
        : undefined;
      const matchedHindi = getHindiPageBySlug(cleanSlug);

      const applyRouteTemplate = (tpl: string) => {
        if (tool) return buildToolPageHtml(tpl, tool);
        if (matchedCat) return buildCategoryPageHtml(tpl, matchedCat);
        if (matchedInfo) return buildInformationalPageHtml(tpl, matchedInfo);
        if (cleanSlug === 'blog') return buildBlogIndexHtml(tpl);
        if (matchedPost) return buildBlogPostHtml(tpl, matchedPost);
        if (matchedHindi) return buildHindiPageHtml(tpl, matchedHindi);
        return tpl;
      };

      if (!isProduction) {
        const templatePath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        template = applyRouteTemplate(template);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
      } else {
        const preRenderedPath = path.resolve(__dirname, `dist/${cleanSlug}/index.html`);
        if (cleanSlug && fs.existsSync(preRenderedPath)) {
          return res.status(200).sendFile(preRenderedPath);
        }
        const distIndexPath = path.resolve(__dirname, 'dist/index.html');
        if (fs.existsSync(distIndexPath)) {
          let template = fs.readFileSync(distIndexPath, 'utf-8');
          template = applyRouteTemplate(template);
          return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(template);
        }
        res.status(200).sendFile(distIndexPath);
      }
    } catch (e: any) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e);
      }
      res.status(500).end(e.stack || e.message);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[PottoTools] Server running at http://localhost:${PORT} (Production: ${isProduction})`);
  });
}

createServer().catch((err) => {
  console.error('[PottoTools] Server bootstrap error:', err);
  process.exit(1);
});
