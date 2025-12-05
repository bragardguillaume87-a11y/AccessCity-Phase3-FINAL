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
    // ✅ Plugin pour rediriger / vers /index-react.html (l'éditeur AccessCity)
    {
      name: 'redirect-to-editor',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Rediriger la racine vers l'éditeur AccessCity
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/index-react.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    open: true, // Ouvre automatiquement le navigateur
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Configuration multi-pages pour le build
    rollupOptions: {
      input: {
        main: './index-react.html', // Éditeur AccessCity (par défaut)
        demo: './index.html',        // Démo Vite simple
      },
    },
  },
});