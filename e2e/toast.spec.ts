import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000/index-react.html?e2e=1';

test('Toast aria-live visible au-dessus', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Ouverture de l\'application'));
  await expect(page.getByRole('heading', { name: /AccessCity/ }).first()).toBeVisible();
  // Fermer la modale d'onboarding si visible
  const startModal = page.locator('[role="dialog"]');
  if (await startModal.isVisible()) {
    const closeBtn = page.getByRole('button', { name: /Passer|Commencer/ });
    await closeBtn.click();
    await expect(startModal).toBeHidden();
  }
  // Déclencher un toast: tenter d'avancer sans renseigner le titre (Contexte)
  const nextBtn = page.getByRole('button', { name: /Suivant/ });
  await nextBtn.click();
  const toast = page.locator('[role="status"]:not(#e2e-overlay)');
  await expect(toast).toBeVisible();
});
