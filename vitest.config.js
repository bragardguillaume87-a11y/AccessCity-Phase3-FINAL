import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      // Seuils sur les zones critiques (core/ + stores/) — CLAUDE.md §4
      thresholds: {
        'src/core/**': {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
        // Stores racine uniquement (hors selectors/ qui sont des hooks React testables
        // seulement avec renderHook — seuil séparé plus bas)
        'src/stores/*.ts': {
          statements: 70,
          branches: 50,
          functions: 70,
          lines: 70,
        },
        // Selectors : hooks React — non testables en unit sans renderHook
        'src/stores/selectors/**': {
          statements: 3,
          branches: 0,
          functions: 0,
          lines: 3,
        },
      },
    },
  },
});
