/// <reference lib="es2022" />

interface SWManifestEntry {
  url: string;
  revision?: string | null;
}

interface SWExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface SWFetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface SWMessageEvent extends SWExtendableEvent {
  data: { type?: string; urls?: string[] } | null;
}

interface SWGlobalScope {
  __WB_MANIFEST: Array<string | SWManifestEntry>;
  location: Location;
  clients: {
    claim(): Promise<void>;
  };
  skipWaiting(): Promise<void>;
  addEventListener(type: 'install', listener: (event: SWExtendableEvent) => void): void;
  addEventListener(type: 'activate', listener: (event: SWExtendableEvent) => void): void;
  addEventListener(type: 'fetch', listener: (event: SWFetchEvent) => void): void;
  addEventListener(type: 'message', listener: (event: SWMessageEvent) => void): void;
}

declare const self: SWGlobalScope;

const PRECACHE_NAME = 'pottotools-precache-v6';
const RUNTIME_CACHE = 'pottotools-runtime-v6';
const CDN_CACHE = 'pottotools-cdn-v6';
const ACTIVE_CACHES = new Set([PRECACHE_NAME, RUNTIME_CACHE, CDN_CACHE]);

const APP_SHELL_URL = '/index.html';

const NAVIGATION_DENYLIST = [
  /^\/ads\.txt$/i,
  /^\/robots\.txt$/i,
  /^\/sitemap\.xml$/i,
  /^\/sitemap\.xsl$/i,
  /^\/llms.*\.txt$/i,
  /^\/\.well-known\//i,
];

const BYPASS_SW_SCRIPTS = [
  /^\/sw\.js$/i,
  /^\/dev-sw\.js$/i,
  /^\/registerSW\.js$/i,
  /^\/workbox-.*\.js$/i,
];

const EXTERNAL_AD_ANALYTICS_HOSTS = [
  'pagead2.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'adservice.google.com',
  'www.googletagservices.com',
  'tpc.googlesyndication.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'ep1.adtrafficquality.google',
  'ep2.adtrafficquality.google',
  'bauval.org',
  'effectivegatecpm.com',
  'highperformanceformat.com',
  'topcreativeformat.com',
  'profitablecpmrate.com',
  'adsterra.com',
  'formsubmit.co',
];

const CACHEABLE_CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'tessdata.projectnaptha.com',
];

const DEV_CRITICAL_URLS = [
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-icon-192-v3.png',
  '/pwa-icon-512-v3.png',
  '/pwa-icon-maskable-512-v3.png',
  '/apple-touch-icon-v3.png',
  '/favicon-v3.ico',
  '/logo.png',
  '/pdf.worker.min.mjs',
  '/assets/aistudio/potoo_mascot_transparent.png',
  '/assets/aistudio/potoo_mascot_perfect.png',
];

function isViteDevPath(pathname: string): boolean {
  return (
    pathname.startsWith('/@') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/node_modules/') ||
    pathname.includes('.hot-update.')
  );
}

function normalizePath(rawUrl: string): string {
  const withoutLeading = rawUrl.replace(/^\/+/, '');
  return `/${withoutLeading}`;
}

function toSafeResponse(response: Response): Response {
  // Chrome & Safari reject SW responses for navigation if response.redirected is true
  if (!response.redirected) {
    return response;
  }
  const headers = new Headers(response.headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function cacheUrlsInBatches(
  cache: Cache,
  urls: string[],
  batchSize = 6
): Promise<void> {
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (url) => {
        try {
          const isImmutableAsset = url.startsWith('/assets/') && !url.startsWith('/assets/aistudio/');
          if (isImmutableAsset) {
            const existing = await cache.match(url, { ignoreSearch: false });
            if (existing) return;
          }
          const res = await fetch(new Request(url, { cache: 'reload' }));
          if (res && res.ok) {
            await cache.put(url, toSafeResponse(res));
          }
        } catch {
          // Individual optional asset failures must never abort SW install
        }
      })
    );
  }
}

// InjectManifest placeholder replaced by vite-plugin-pwa during production build (must appear once)
const rawManifest = self.__WB_MANIFEST;
const injectedManifest = Array.isArray(rawManifest) ? rawManifest : [];

function buildNormalizedManifest(): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const entry of injectedManifest) {
    const rawUrl = typeof entry === 'string' ? entry : entry?.url;
    if (!rawUrl) continue;
    const normalized = normalizePath(rawUrl);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      urls.push(normalized);
    }
  }

  return urls;
}

self.addEventListener('install', (event) => {
  void self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_NAME);
      const manifestUrls = buildNormalizedManifest();

      // Always fetch & store the fresh SPA shell at '/index.html', falling back to '/' if needed
      let shellCached = false;
      try {
        const shellRes = await fetch(new Request(APP_SHELL_URL, { cache: 'reload' }));
        if (shellRes && shellRes.ok) {
          await cache.put(APP_SHELL_URL, toSafeResponse(shellRes));
          shellCached = true;
        }
      } catch {
        // Ignore and try root '/'
      }

      if (!shellCached) {
        try {
          const rootRes = await fetch(new Request('/', { cache: 'reload' }));
          if (rootRes && rootRes.ok) {
            await cache.put(APP_SHELL_URL, toSafeResponse(rootRes));
          }
        } catch {
          // Keep any previously cached shell
        }
      }

      if (manifestUrls.length > 0) {
        // Production build: prioritize critical shell/JS/CSS before tool chunks
        const critical: string[] = [];
        const secondary: string[] = [];

        for (const u of manifestUrls) {
          if (u === APP_SHELL_URL) continue;
          if (
            u === '/manifest.webmanifest' ||
            u.startsWith('/pwa-') ||
            u.startsWith('/assets/index-') ||
            u.startsWith('/assets/vendor-react-') ||
            u.startsWith('/assets/vendor-icons-') ||
            u.startsWith('/assets/rolldown-runtime-')
          ) {
            critical.push(u);
          } else {
            secondary.push(u);
          }
        }

        await cacheUrlsInBatches(cache, critical, 6);
        await cacheUrlsInBatches(cache, secondary, 6);
      } else {
        // Dev/Preview mode: warm-cache critical Vite entry files & icons
        await cacheUrlsInBatches(cache, DEV_CRITICAL_URLS, 4);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !ACTIVE_CACHES.has(name))
          .map((name) => caches.delete(name))
      );

      // Prune stale precached entries if we have a production manifest
      const manifestUrls = buildNormalizedManifest();
      if (manifestUrls.length > 0) {
        const expected = new Set([APP_SHELL_URL, ...manifestUrls]);
        const precache = await caches.open(PRECACHE_NAME);
        const requests = await precache.keys();
        await Promise.all(
          requests
            .filter((req) => !expected.has(new URL(req.url).pathname))
            .map((req) => precache.delete(req))
        );
      }

      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  const payload = event.data;
  if (!payload || payload.type !== 'CACHE_URLS' || !Array.isArray(payload.urls)) {
    return;
  }

  const rawUrls = payload.urls;
  event.waitUntil(
    (async () => {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      const precache = await caches.open(PRECACHE_NAME);

      const candidates = rawUrls.filter((rawUrl) => {
        if (typeof rawUrl !== 'string') return false;
        try {
          const parsed = new URL(rawUrl, self.location.origin);
          if (parsed.origin !== self.location.origin) return false;
          if (isViteDevPath(parsed.pathname)) return false;
          if (BYPASS_SW_SCRIPTS.some((re) => re.test(parsed.pathname))) return false;
          return true;
        } catch {
          return false;
        }
      });

      for (let i = 0; i < candidates.length; i += 6) {
        const batch = candidates.slice(i, i + 6);
        await Promise.allSettled(
          batch.map(async (urlStr) => {
            const parsed = new URL(urlStr, self.location.origin);
            const inPrecache = await precache.match(parsed.pathname);
            if (inPrecache) return;
            const inRuntime = await runtimeCache.match(urlStr);
            if (inRuntime) return;
            const res = await fetch(urlStr, { credentials: 'same-origin' });
            if (res && res.ok) {
              await runtimeCache.put(urlStr, toSafeResponse(res));
            }
          })
        );
      }
    })()
  );
});

async function matchAppShell(): Promise<Response | undefined> {
  const precache = await caches.open(PRECACHE_NAME);
  const direct =
    (await precache.match(APP_SHELL_URL, { ignoreSearch: true })) ||
    (await precache.match('/', { ignoreSearch: true })) ||
    (await caches.match(APP_SHELL_URL, { ignoreSearch: true })) ||
    (await caches.match('/', { ignoreSearch: true }));

  return direct ? toSafeResponse(direct) : undefined;
}

async function handleNavigationRequest(request: Request): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const networkResponse = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (networkResponse && networkResponse.ok) {
      const url = new URL(request.url);
      // Keep '/index.html' cache fresh whenever visiting root or /index.html online
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const precache = await caches.open(PRECACHE_NAME);
        await precache.put(APP_SHELL_URL, toSafeResponse(networkResponse.clone()));
      }
      return networkResponse;
    }

    const cachedShell = await matchAppShell();
    return cachedShell || networkResponse;
  } catch {
    const cachedShell = await matchAppShell();
    if (cachedShell) {
      return cachedShell;
    }
    return new Response(
      '<!doctype html><html><head><meta charset="utf-8"><title>PottoTools Offline</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;text-align:center;"><h1>PottoTools is Offline</h1><p>Please open PottoTools once while connected to sync offline tools.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function handleCacheFirst(request: Request, cacheName: string): Promise<Response> {
  const precache = await caches.open(PRECACHE_NAME);
  const precached = await precache.match(request);
  if (precached) return precached;

  const targetCache = await caches.open(cacheName);
  const cached = await targetCache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
      await targetCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const fallback =
      (await precache.match(request, { ignoreSearch: true })) ||
      (await targetCache.match(request, { ignoreSearch: true })) ||
      (await caches.match(request, { ignoreSearch: true }));
    if (fallback) return fallback;
    return Response.error();
  }
}

async function handleNetworkFirstRuntime(request: Request): Promise<Response> {
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const precache = await caches.open(PRECACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      await runtimeCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached =
      (await runtimeCache.match(request)) ||
      (await precache.match(request)) ||
      (await runtimeCache.match(request, { ignoreSearch: true })) ||
      (await precache.match(request, { ignoreSearch: true }));
    if (cached) return cached;
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never intercept AdSense, analytics, or contact form endpoints
  if (EXTERNAL_AD_ANALYTICS_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return;
  }

  // Handle offline-helpful external CDNs (Google Fonts & Tesseract OCR WASM/traineddata)
  if (url.origin !== self.location.origin) {
    if (CACHEABLE_CDN_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      event.respondWith(handleCacheFirst(request, CDN_CACHE));
    }
    return;
  }

  // Never intercept Vite dev modules/deps, SW scripts themselves, or SEO crawler endpoints
  if (
    isViteDevPath(url.pathname) ||
    BYPASS_SW_SCRIPTS.some((re) => re.test(url.pathname)) ||
    NAVIGATION_DENYLIST.some((re) => re.test(url.pathname))
  ) {
    return;
  }

  // All same-origin navigations (/, /pdf-tools, /compress-pdf, /directory, etc.)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Production immutable hashed assets & precached icons/worker -> Cache-First
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/pdf.worker.min.mjs' ||
    url.pathname.startsWith('/pwa-') ||
    url.pathname.startsWith('/apple-touch-icon') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/logo.webp'
  ) {
    event.respondWith(handleCacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Dev server Vite modules (/src/*, /@vite/*, /@react-refresh, /node_modules/*) & manifest -> Network-First with cache fallback
  event.respondWith(handleNetworkFirstRuntime(request));
});
