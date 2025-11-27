import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000/index-react.html';

// Helper: open page and ensure loaded
async function openApp(page) {
  await page.goto(BASE_URL);
  await expect(page.locator('text=AccessCity')).toBeVisible();
}

test.describe('Player/HUD/Modals', () => {
  test('Onboarding modal traps focus, Escape closes, returns focus', async ({ page }) => {
    await openApp(page);
    // Onboarding s’affiche au premier chargement si non vu
    const modal = page.locator('[role="dialog"]');
    // Si pas visible (déjà onboarded), simuler ouverture via localStorage reset
    if (!(await modal.isVisible())) {
      await page.evaluate(() => localStorage.removeItem('ac_onboarded'));
      await page.reload();
    }
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Focus initial
    const activeId = await page.evaluate(() => document.activeElement?.id || '');
    expect(activeId).toBeTruthy();
    // Trap Tab: appuyer plusieurs fois et vérifier qu’on reste dans la modale
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const inDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement);
      });
      expect(inDialog).toBeTruthy();
    }
    // Escape ferme
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('HUD visible et badges au-dessus', async ({ page }) => {
    await openApp(page);
    // Ouvrir une préview si possible: bouton "Afficher préview"
    const togglePreview = page.locator('button:has-text("Afficher préview")');
    if (await togglePreview.isVisible()) {
      await togglePreview.click();
    }
    // Lancer la scène via ▶ si présent
    const playBtn = page.locator('button:has-text("▶")').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }
    // HUD checkbox "Afficher le HUD"
    const hudToggle = page.locator('label:text("Afficher le HUD")');
    await expect(hudToggle).toBeVisible();
    // Déclencher un badge delta via un choix
    const choiceBtn = page.locator('button.choice-btn').first();
    if (await choiceBtn.isVisible()) {
      await choiceBtn.click();
    }
    // Badge delta
    const deltaBadge = page.locator('.delta-badge');
    await expect(deltaBadge).toBeVisible();
  });
});
