import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Instrumentation Istanbul activée en mode test/coverage via variable d'environnement
    istanbul({
      include: ['src/**/*.{js,jsx}', 'core/**/*.js', 'ui/**/*.js'],
      exclude: ['node_modules', 'test', 'e2e', 'tools'],
      extension: ['.js', '.jsx'],
      requireEnv: false, // Active l'instrumentation même sans VITE_COVERAGE
      forceBuildInstrument: process.env.VITE_COVERAGE === 'true', // Force pour build de production
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
