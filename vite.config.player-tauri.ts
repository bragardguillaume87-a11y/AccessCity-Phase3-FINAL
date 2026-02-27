/**
 * vite.config.player-tauri.ts — Build configuration pour le player Tauri (exe Windows).
 *
 * Produit dist-player-tauri/ (consommé par Tauri CLI lors du tauri build).
 *
 * Différences vs vite.config.player.ts :
 *  - Mode SPA (pas lib mode) — Tauri embeds index.html + assets dans l'exe
 *  - @tauri-apps/api INCLUS (pas externalisé) — requis pour invoke() + convertFileSrc()
 *  - Entry: src/main-player-tauri.tsx (charge data via invoke, réécriture URLs)
 *
 * Usage :
 *   npm run build:player-tauri-frontend  ← étape 1 de build:player-exe
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-player-tauri',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: './src/player-tauri.html',
      external: [],
      output: {
        // Pas d'inlineDynamicImports : Tauri peut gérer des chunks multiples
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 5000,
  },
});
