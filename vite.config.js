import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true, // Force l'activation de Fast Refresh pour HMR
    }),
    // Instrumentation Istanbul - TEMPORAIREMENT DÉSACTIVÉE pour debug HMR
    // istanbul({
    //   include: ['src/**/*.{js,jsx}', 'core/**/*.js', 'ui/**/*.js'],
    //   exclude: ['node_modules', 'test', 'e2e', 'tools'],
    //   extension: ['.js', '.jsx'],
    //   requireEnv: false,
    //   forceBuildInstrument: process.env.VITE_COVERAGE === 'true',
    // }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react-resizable-panels'],
  },
  server: {
    port: 5173,
    open: true, // Ouvre automatiquement le navigateur
    // Configuration HMR explicite (critique pour Windows + React 19)
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    // File watching avec polling (CRITIQUE pour Windows)
    watch: {
      usePolling: true, // Force le polling des fichiers sur Windows
      interval: 100, // Vérifie les changements toutes les 100ms
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Configuration multi-pages pour le build
    rollupOptions: {
      input: {
        main: './index.html', // Point d'entree principal
      },
    },
  },
});