import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Yeni SW anında devreye girsin — eski cache'i temizle
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Navigasyon fallback — HashRouter ile uyumlu
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Cache boyutu sınırı: 5MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // countapi.xyz — network-first
            urlPattern: /^https:\/\/api\.countapi\.xyz\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 10 } },
          },
        ],
      },
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'FlowState',
        short_name: 'FlowState',
        description: 'Günlük mantık bulmaca oyunu — Tile\'ları döndür, akışları yönlendir!',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0a0e1a',
        theme_color: '#22d3ee',
        orientation: 'any',
        lang: 'tr',
        categories: ['games', 'puzzle'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  base: './',
  resolve: {
    alias: {
      // FSD yapısı için @ alias
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor chunk'ları — bundle boyutu optimizasyonu
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
    target: 'es2020',
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    open: true,
  },
});
