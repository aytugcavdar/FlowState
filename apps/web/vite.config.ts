import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/FlowState/',
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
