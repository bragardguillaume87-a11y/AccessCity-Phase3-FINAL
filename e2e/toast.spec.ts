import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000/index-react.html';

test('Toast aria-live visible au-dessus', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('text=AccessCity')).toBeVisible();
  // Déclencher une action qui montre un toast: ajouter une scène
  const addSceneBtn = page.locator('button:has-text("+ Ajouter une scène")');
  if (await addSceneBtn.isVisible()) {
    await addSceneBtn.click();
  }
  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible();
});
