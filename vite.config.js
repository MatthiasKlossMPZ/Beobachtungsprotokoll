import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Beobachtungsprotokoll/',

  plugins: [
    preact(),
    VitePWA({
  registerType: 'autoUpdate',
  manifestFilename: 'manifest.json',
  injectRegister: 'script-defer',

  manifest: {
    name: "Beobachtungsprotokoll",
    short_name: "Beobachtungsprotokoll",
    description: "Digitales Beobachtungs- und Vorfallprotokoll für Schulen",
    start_url: "/Beobachtungsprotokoll/",
    scope: "/Beobachtungsprotokoll/",
    display: "minimal-ui",
    display_override: ["window-controls-overlay", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    theme_color: "#1e40af",
    background_color: "#f8fafc",
    lang: "de",
    icons: [
      { src: "/Beobachtungsprotokoll/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/Beobachtungsprotokoll/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/Beobachtungsprotokoll/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  },

  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    navigateFallback: '/Beobachtungsprotokoll/index.html',
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
  },

  devOptions: { enabled: true }
})

  ],

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          jspdf: ['jspdf'],
          vendor: ['preact', 'preact-router', 'preact/hooks'],
          // Chart.js wird hier automatisch als separater Chunk behandelt
        }
      }
    }
  }
});