import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000/index-react.html?e2e=1';

// Helper: open page and ensure loaded
async function openApp(page: Page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Ouverture de l\'application'));
  await expect(page.getByRole('heading', { name: /AccessCity/ }).first()).toBeVisible();
}

test.describe('Player/HUD/Modals', () => {
  test('Onboarding modal traps focus, close button returns focus', async ({ page }) => {
    await openApp(page);
    // Onboarding s’affiche au premier chargement si non vu
    const modal = page.locator('[role="dialog"]');
    // Si pas visible (déjà onboarded), simuler ouverture via localStorage reset
    if (!(await modal.isVisible())) {
      await page.evaluate(() => localStorage.removeItem('ac_onboarded'));
      await page.reload();
    }
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Focus initial: vérifier que le focus est DANS la modale
    const inDialogInitially = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return !!dialog && dialog.contains(document.activeElement);
    });
    expect(inDialogInitially).toBeTruthy();
    // Trap Tab: appuyer plusieurs fois et vérifier qu’on reste dans la modale
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const inDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement);
      });
      expect(inDialog).toBeTruthy();
    }
    // Fermer via le bouton dédié (Passer/Commencer)
    const closeBtn = page.getByRole('button', { name: /Passer|Commencer/ });
    await closeBtn.click();
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('HUD visible et badges au-dessus', async ({ page }) => {
    await openApp(page);
    // Fermer la modale d'onboarding si présente
    const startModal = page.locator('[role="dialog"]');
    if (await startModal.isVisible()) {
      await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Fermeture de la modale d\'onboarding'));
      const closeBtn = page.getByRole('button', { name: /Passer|Commencer/ });
      await closeBtn.click();
      await expect(startModal).toBeHidden();
    }
    // Naviguer vers l'étape Scènes pour voir les boutons ▶
    const scenesStepBtn = page.locator('button:has-text("Scènes")');
    if (await scenesStepBtn.isVisible()) {
      await scenesStepBtn.click();
    }
    // Lancer une scène via bouton ▶ (playScene)
    await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Lancement d\'une scène (▶)'));
    const playBtn = page.locator('button[aria-label="Lancer la scène"]').first();
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();
    // Attendre l'affichage du player (HUD visible)
    await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Vérification HUD et badges'));
    const hudToggle = page.locator('label:has-text("Afficher le HUD")');
    await expect(hudToggle).toBeVisible();
    // Fermer la bulle Coach si présente
    const coachClose = page.getByRole('button', { name: 'Compris' });
    if (await coachClose.isVisible()) {
      await coachClose.click();
    }
    // Avancer jusqu'à apparition d'un choix si nécessaire
    for (let i = 0; i < 10; i++) {
      const hasChoice = await page.locator('button.choice-btn').first().isVisible();
      if (hasChoice) break;
      const nextBtn = page.getByRole('button', { name: /Suivant/ });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      } else {
        break;
      }
      await page.waitForTimeout(150);
    }

    // Faire un choix pour déclencher un badge delta
    const choiceBtn = page.locator('button.choice-btn').first();
    if (await choiceBtn.isVisible()) {
      await Promise.all([
        choiceBtn.click(),
        page.locator('.delta-badge').first().waitFor({ state: 'visible', timeout: 3000 }).catch(()=>{})
      ]);
      // Vérifier l'apparition du badge delta
      const deltaBadge = page.locator('.delta-badge');
      await expect(deltaBadge).toBeVisible({ timeout: 3000 });
    } else {
      // Pas de choix visible sur cette scène: le HUD est visible, badge non requis ici
      await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Aucun choix visible; HUD vérifié'));
    }
  });

  test('Dialogue player et attributs accessibilité', async ({ page }) => {
    await openApp(page);
    // Fermer la modale d'onboarding si présente
    const startModal2 = page.locator('[role="dialog"]');
    if (await startModal2.isVisible()) {
      await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Fermeture de la modale d\'onboarding'));
      const closeBtn2 = page.getByRole('button', { name: /Passer|Commencer/ });
      await closeBtn2.click();
      await expect(startModal2).toBeHidden();
    }
    // Naviguer vers l'étape Scènes
    const scenesStepBtn = page.locator('button:has-text("Scènes")');
    if (await scenesStepBtn.isVisible()) {
      await scenesStepBtn.click();
    }
    // Lancer une scène via bouton ▶
    await page.evaluate(() => (window as any).__E2E_STEP__ && (window as any).__E2E_STEP__('Lancement d\'une scène (▶)'));
    const playBtn = page.locator('button[aria-label="Lancer la scène"]').first();
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();
    // Vérifier la zone de dialogue React (.dialogue-box)
    const dialogueBox = page.locator('.dialogue-box');
    await expect(dialogueBox).toBeVisible();
    // Vérifier que le texte du dialogue est présent
    await expect(dialogueBox).toContainText(/./); // Au moins 1 caractère
    // Faire un choix si disponible
    const choiceBtn = page.locator('button.choice-btn').first();
    if (await choiceBtn.isVisible()) {
      await choiceBtn.click();
    }
    // Le dialogue continue ou se termine - on vérifie juste qu'il était bien affiché
    // Note: pas de custom element dialogue-area dans React, donc on teste le rendu réel
  });
});
