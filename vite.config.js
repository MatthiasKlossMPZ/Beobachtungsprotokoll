import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.json',
      injectRegister: 'script-defer',
      manifest: {
        name: 'Beobachtungsprotokoll',
        short_name: 'Beobachtung',
        description: 'Digitales Beobachtungsprotokoll',
        start_url: '/Beobachtungsprotokoll/',
        scope: '/Beobachtungsprotokoll/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#1e40af',
        icons: [
          { src: '/Beobachtungsprotokoll/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/Beobachtungsprotokoll/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/Beobachtungsprotokoll/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallback: '/Beobachtungsprotokoll/index.html',
        navigateFallbackDenylist: [/^\/_/, /^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/matthiasklossmpz\.github\.io\/Beobachtungsprotokoll/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-cache',
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
      devOptions: { enabled: true }
    })
  ],

  base: '/Beobachtungsprotokoll/',

  build: {
    chunkSizeWarningLimit: 1000,           // Noch höher gesetzt
    rollupOptions: {
      output: {
        manualChunks: {
          jspdf: ['jspdf'],
          vendor: ['preact', 'preact-router', 'preact/hooks'],
          // Falls du noch mehr große Bibliotheken hast:
          // charts: ['chart.js', 'react-chartjs-2']  // falls du Charts nutzt
        }
      }
    }
  }
});