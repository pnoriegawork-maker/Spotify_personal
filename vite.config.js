import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true
  }
});
