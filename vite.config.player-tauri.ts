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
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      // Tauri attend index.html à la racine de frontendDist.
      // Vite sort le HTML à dist-player-tauri/src/player-tauri.html
      // (miroir du chemin source). Ce plugin le copie à dist-player-tauri/index.html.
      name: 'tauri-index-html',
      closeBundle() {
        const src  = path.resolve(__dirname, 'dist-player-tauri/src/player-tauri.html');
        const dest = path.resolve(__dirname, 'dist-player-tauri/index.html');
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      },
    },
  ],
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
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 5000,
  },
});
