import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: ['**/*.spec.ts'],
  reporter: [['list']],
  retries: 2,
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  webServer: {
    command: 'python -m http.server 8000',
    port: 8000,
    reuseExistingServer: true,
    timeout: 120000
  }
});
