import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// After each test, attempt to pull browser coverage (window.__coverage__) if instrumentation is present.
// Currently index-react.html is not instrumented; this will be a no-op until instrumentation added.
// Files are written to coverage/browser/<sanitized-test-title>.json

test.afterEach(async ({ page }, testInfo) => {
  try {
    const coverage = await page.evaluate(() => (window as any).__coverage__);
    if (!coverage) return; // No instrumentation yet
    const dir = path.resolve(process.cwd(), 'coverage', 'browser');
    await fs.promises.mkdir(dir, { recursive: true });
    const fileSafe = testInfo.title.replace(/[^a-z0-9-_]/gi, '_').slice(0, 80);
    const target = path.join(dir, `coverage-${fileSafe}.json`);
    await fs.promises.writeFile(target, JSON.stringify(coverage));
  } catch (err) {
    // Silent failure: we don't block tests on coverage collection.
  }
});
