/**
 * vite.config.player.ts — Build configuration pour le player standalone.
 *
 * Produit :
 *   public/player.js   — bundle JS complet (React + PreviewPlayer + hooks)
 *   public/player.css  — styles CSS extraits
 *
 * Ces fichiers sont commités dans git car ils sont des artefacts stables.
 * L'ExportModal les fetchera au moment de générer le ZIP.
 *
 * Usage :
 *   npm run build:player
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
    // Sortie dans public/ pour être servi par Vite dev et inclus dans l'export
    outDir: 'public',
    emptyOutDir: false,  // Ne pas effacer les autres assets dans public/
    target: 'esnext',
    minify: 'esbuild',
    // Lib mode : entry TS unique → bundle single-file
    lib: {
      entry: path.resolve(__dirname, 'src/main-player.tsx'),
      formats: ['es'],
      fileName: () => 'player.js',
    },
    rollupOptions: {
      // Tout bundler — aucune dépendance externe
      external: [],
      output: {
        // Un seul fichier JS (pas de chunks dynamiques)
        inlineDynamicImports: true,
        assetFileNames: 'player.css',
      },
    },
    // Pas de sourcemaps dans le player (taille + confidentialité)
    sourcemap: false,
    // Avertissement de taille désactivé (bundle intentionnellement volumineux)
    chunkSizeWarningLimit: 5000,
  },
});
