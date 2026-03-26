import { defineConfig } from '@playwright/test';

// Force le port dev server pour l'audit (Windows-compatible)
process.env.E2E_BASE_URL = 'http://localhost:5173';

/**
 * Config Playwright pour l'audit visuel UX.
 *
 * Démarre le dev server Vite sur 5173 automatiquement.
 * Screenshots sauvegardés dans test-artifacts/ux-audit/.
 *
 * Lancement : npm run audit:ux
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: ['**/ux-audit.spec.ts'],
  reporter: [['list']],
  retries: 0,
  use: {
    headless: false,
    viewport: { width: 1440, height: 900 },
    baseURL: 'http://localhost:5173',
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },
  webServer: {
    command: 'npx vite --config vite.config.js --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
