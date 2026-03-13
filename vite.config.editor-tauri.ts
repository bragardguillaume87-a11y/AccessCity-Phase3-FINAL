/**
 * vite.config.editor-tauri.ts — Build configuration pour l'éditeur Tauri (exe Windows).
 *
 * Produit dist-editor-tauri/ (consommé par Tauri CLI lors du build avec tauri.conf.editor.json).
 *
 * Différences vs vite.config.js :
 *  - outDir : dist-editor-tauri/
 *  - base : './' pour les chemins relatifs dans l'exe
 *  - VITE_TAURI_EDITOR=true → les hooks détectent le contexte Tauri et utilisent invoke()
 *  - @tauri-apps/api INCLUS (pas externalisé) — requis pour invoke() + convertFileSrc()
 *  - server.port : 5173 (même port que dev:vite pour beforeDevCommand)
 *
 * Usage :
 *   npm run build:editor-tauri-frontend  ← étape 1 de build:editor-exe
 *   npm run build:editor-exe             ← build complet frontend + Rust + installeur NSIS
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  define: {
    // Indicateur détecté par useAssets.ts / upload hooks pour basculer vers invoke()
    'import.meta.env.VITE_TAURI_EDITOR': JSON.stringify('true'),
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },

  build: {
    outDir: 'dist-editor-tauri',
    emptyOutDir: true,
    // Chemins relatifs : obligatoire quand Tauri charge index.html depuis son bundle
    base: './',
    sourcemap: false,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      input: { main: './index.html' },
      external: [],
      output: {
        // Même découpage que le build web pour le cache
        manualChunks: {
          'vendor-react':  ['react', 'react-dom'],
          'vendor-state':  ['zustand', 'zundo', 'immer'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-scroll-area',
          ],
          'vendor-flow':   ['@xyflow/react', 'dagre'],
          'vendor-motion': ['framer-motion'],
          'vendor-forms':  ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-dnd':    ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-misc':   ['canvas-confetti', 'react-resizable-panels'],
          'vendor-three':  ['three', '@react-three/fiber', '@react-three/drei'],
          // @tauri-apps/api : groupé dans un chunk dédié (uniquement dans ce build)
          'vendor-tauri':  ['@tauri-apps/api'],
        },
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
