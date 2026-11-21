import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerWebMcpTools } from './services/ai/webMcpService';
import { registerSW } from 'virtual:pwa-register';

// Register in-browser WebMCP tools for AI assistants on page load
registerWebMcpTools();

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker via vite-plugin-pwa so all tools & assets work 100% offline
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const syncLoadedResourcesWithSW = () => {
    try {
      if (!navigator.onLine) return;
      const controller = navigator.serviceWorker.controller;
      if (!controller) return;

      const urls = new Set<string>([
        '/index.html',
        '/manifest.webmanifest',
        '/pwa-icon-192-v3.png',
        '/pwa-icon-512-v3.png',
        '/pwa-icon-maskable-512-v3.png',
        '/apple-touch-icon-v3.png',
        '/favicon-v3.ico',
        '/logo.webp',
      ]);
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      for (const entry of entries) {
        try {
          const parsed = new URL(entry.name, window.location.origin);
          if (parsed.origin === window.location.origin) {
            const p = parsed.pathname;
            if (
              p.startsWith('/@') ||
              p.startsWith('/src/') ||
              p.startsWith('/node_modules/') ||
              p.includes('.hot-update.')
            ) {
              continue;
            }
            urls.add(parsed.href);
          }
        } catch {
          // Ignore malformed resource URLs
        }
      }

      controller.postMessage({
        type: 'CACHE_URLS',
        urls: Array.from(urls),
      });
    } catch {
      // Ignore sync errors
    }
  };

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Warm-cache resources already loaded during initial bootstrap
        navigator.serviceWorker.ready.then(() => {
          setTimeout(syncLoadedResourcesWithSW, 500);
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setTimeout(syncLoadedResourcesWithSW, 300);
        });

        // Check for SW updates periodically when online
        setInterval(() => {
          if (navigator.onLine) {
            registration.update().catch(() => {});
          }
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.info('[PottoTools PWA] Service worker registration deferred:', error);
    },
  });
}
