import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import path from 'node:path';
import manifest from './manifest.config';

// https://crxjs.dev/vite-plugin
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '..', 'shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
    // Allow importing the sibling `shared/` package during dev.
    fs: { allow: ['..'] },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      // The offscreen document is created at runtime via chrome.offscreen, so it
      // is not referenced by the manifest. List it explicitly so Vite builds it.
      input: {
        offscreen: path.resolve(__dirname, 'src/offscreen/offscreen.html'),
      },
    },
  },
});
