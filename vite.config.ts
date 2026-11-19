import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'assets/aistudio/potoo_mascot_transparent.webp',
          'assets/aistudio/potoo_mascot_transparent.png',
          'assets/aistudio/potoo_mascot_perfect.png',
        ],
        manifest: {
          id: '/',
          name: 'PottoTools – Free Offline PDF & Image Tools',
          short_name: 'PottoTools',
          description:
            'Every PDF, Document & Image tool you need. 100% private in-browser WebAssembly processing. Works completely offline without internet.',
          theme_color: '#0284c7',
          background_color: '#0F1B31',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['productivity', 'utilities'],
          icons: [
            {
              src: '/pwa-icon-192-v3.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-icon-512-v3.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-icon-maskable-512-v3.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        injectManifest: {
          rollupFormat: 'iife',
          globPatterns: ['index.html', '404.html', 'assets/**/*.{js,css}', '*.{ico,png,svg,webp,mjs}'],
          globIgnores: [
            '**/potto-logo.png',
            '**/icon-192.png',
            '**/icon-512.png',
            '**/pwa-192x192.png',
            '**/pwa-512x512.png',
            '**/pwa-maskable-512x512.png',
            '**/apple-touch-icon.png',
            '**/favicon.ico',
            '**/Screenshot_*',
            '**/1793*',
            '**/file_*',
            '**/potoo_mascot_clean*',
            '**/potoo_mascot_crop*',
          ],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lucide-react',
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1200,
      modulePreload: {
        resolveDependencies(filename, deps) {
          // Never preload heavy background document engines on the initial page load
          return deps.filter(
            (dep) =>
              !dep.includes('vendor-jspdf') &&
              !dep.includes('vendor-office') &&
              !dep.includes('vendor-pdf') &&
              !dep.includes('vendor-ocr') &&
              !dep.includes('html2canvas') &&
              !dep.includes('purify') &&
              !dep.includes('index.es')
          );
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pdf-lib') || id.includes('pdfjs-dist')) {
                return 'vendor-pdf';
              }
              if (id.includes('xlsx') || id.includes('docx') || id.includes('mammoth') || id.includes('jszip')) {
                return 'vendor-office';
              }
              if (id.includes('tesseract.js')) {
                return 'vendor-ocr';
              }
              if (
                id.includes('jspdf') ||
                id.includes('html2canvas') ||
                id.includes('canvg') ||
                id.includes('dompurify')
              ) {
                return 'vendor-jspdf';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
  };
});
