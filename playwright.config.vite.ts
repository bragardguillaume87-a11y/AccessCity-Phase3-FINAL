import { defineConfig } from '@playwright/test';

/**
 * Configuration Playwright pour tests E2E sur build Vite instrumenté.
 * Usage: npm run e2e:vite
 * 
 * Différences avec playwright.config.ts:
 * - baseURL pointe vers preview Vite (dist/)
 * - Serveur: vite preview au lieu de http.server
 * - Tests récupèrent window.__coverage__ du build instrumenté
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: ['**/*.spec.ts'],
  reporter: [['list']],
  retries: 2,
  use: {
    baseURL: 'http://localhost:8000', // Port vite preview
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  webServer: {
    command: 'npx vite preview --port 8000',
    port: 8000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
