import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000/index-react.html?e2e=1';

/**
 * Test e2e: Parcours Chapitres → Scène → Variables/Badges
 * 
 * Objectif: Vérifier que l'utilisateur peut naviguer dans les chapitres,
 * lancer une scène, interagir avec les choix, et voir les badges de variables mis à jour.
 * 
 * Critères d'acceptation:
 * - Navigation accessible vers l'onglet "📋 Chapitres"
 * - Bouton de lancement (▶) visible et cliquable
 * - HUD et objectif affichés en mode joueur
 * - Badges delta visibles après un choix avec impact sur variables
 * - Dialogue accessible avec aria-label appropriés
 */

async function step(page: any, msg: string) {
  await page.evaluate((m: string) => (window as any).__E2E_STEP__?.(m), msg);
}

test.describe('Parcours Chapitres → Scène → Variables', () => {
  test('Navigation chapitres, lancement scène, badges delta visibles', async ({ page }) => {
    await page.goto(BASE_URL);

    // Étape 1: Fermer l'onboarding si présent
    await step(page, 'Fermer onboarding');
    const closeOnboarding = page.getByRole('button', { name: /terminer|fermer|commencer/i });
    if (await closeOnboarding.isVisible().catch(() => false)) {
      await closeOnboarding.click();
    }

    // Étape 2: Naviguer vers l'onglet "Chapitres" ou "Scènes"
    await step(page, 'Ouvrir onglet Chapitres/Scènes');
      const scenesTab = page.getByRole('button', { name: /chapitres|scènes|📋/i });
      await expect(scenesTab).toBeVisible({ timeout: 10000 });
      // Attendre la disparition de l'overlay qui bloque le clic (timeout augmenté)
      await page.waitForSelector('#e2e-overlay', { state: 'detached', timeout: 15000 }).catch(() => {});
      await page.waitForSelector('.fixed.inset-0', { state: 'detached', timeout: 15000 }).catch(() => {});
      await scenesTab.click();

    // Étape 3: Lancer la première scène via le bouton ▶
    await step(page, 'Lancer première scène (▶)');
    const launchBtn = page.getByRole('button', { name: /▶|lancer|jouer/i }).first();
    await expect(launchBtn).toBeVisible({ timeout: 10000 });
    await launchBtn.click();

    // Étape 4: Fermer la coach bubble si présente
    await step(page, 'Fermer coach bubble si présent');
    const coachOk = page.getByRole('button', { name: /compris|ok|d'accord/i });
    if (await coachOk.isVisible().catch(() => false)) {
      await coachOk.click();
    }

    // Étape 5: Vérifier que le HUD est visible (objectif, variables)
    await step(page, 'Vérifier HUD visible');
    const hudObjective = page.locator('text=/🎯\\s*Objectif/i');
    await expect(hudObjective).toBeVisible({ timeout: 7000 });

    // Étape 6: Avancer avec "Suivant" jusqu'aux choix ou fin
    await step(page, "Avancer avec Suivant jusqu'aux choix");
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByRole('button', { name: /suivant/i });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000); // Laisser l'UI se mettre à jour (plus long)
      }
      
      // Vérifier si des choix sont apparus
      const choicesGroup = page.getByRole('group', { name: /choix/i });
      if (await choicesGroup.isVisible().catch(() => false)) {
        await step(page, 'Choix détectés');
        break;
      }
    }

    // Étape 7: Cliquer sur un choix si disponible
    const choicesGroup = page.getByRole('group', { name: /choix/i });
    if (await choicesGroup.isVisible().catch(() => false)) {
      await step(page, 'Cliquer premier choix');
      const firstChoice = choicesGroup.getByRole('button').first();
      await expect(firstChoice).toBeVisible();
      await firstChoice.click();

      // Étape 8: Vérifier badges delta (si un choix a modifié une variable)
      await step(page, 'Vérifier badges delta');
      // Les badges delta ont la classe .delta-badge
      const deltaBadge = page.locator('.delta-badge').first();
      // On attend que le badge apparaisse (peut prendre un instant)
      await expect(deltaBadge).toBeVisible({ timeout: 7000 });
      
      // Vérifier que le texte du badge n'est pas vide
      const badgeText = await deltaBadge.textContent();
      expect(badgeText?.trim()).not.toBe('');
    } else {
      await step(page, 'Aucun choix détecté, scénario sans embranchement');
    }

    // Étape 9: Vérifier que le dialogue reste accessible
    await step(page, 'Vérifier dialogue accessible');
    const dialogueBox = page.locator('.dialogue-box');
    await expect(dialogueBox).toBeVisible({ timeout: 7000 });
    const dialogueText = await dialogueBox.textContent();
    expect(dialogueText?.trim()).not.toBe('');

    await step(page, 'Test terminé ✅');
  });

  test('Accessibilité HUD: labels et rôles', async ({ page }) => {
    await page.goto(BASE_URL);

    await step(page, 'Fermer onboarding');
    const closeOnboarding = page.getByRole('button', { name: /terminer|fermer|commencer/i });
    if (await closeOnboarding.isVisible().catch(() => false)) {
      await closeOnboarding.click();
    }

    await step(page, 'Naviguer vers Chapitres');
      // Attendre la disparition de l'overlay qui bloque le clic
      await page.waitForSelector('#e2e-overlay', { state: 'detached', timeout: 15000 }).catch(() => {});
      await page.waitForSelector('.fixed.inset-0', { state: 'detached', timeout: 15000 }).catch(() => {});
      await page.getByRole('button', { name: /chapitres|scènes|📋/i }).click();

    await step(page, 'Lancer scène');
    await expect(page.getByRole('button', { name: /▶|lancer|jouer/i }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /▶|lancer|jouer/i }).first().click();

    // Fermer coach
    const coachOk = page.getByRole('button', { name: /compris|ok|d'accord/i });
    if (await coachOk.isVisible().catch(() => false)) {
      await coachOk.click();
    }

    // Vérifier que le HUD a des éléments accessibles
    await step(page, 'Vérifier objectif accessible');
    const objective = page.locator('text=/🎯\\s*Objectif/i');
    await expect(objective).toBeVisible({ timeout: 7000 });

    // Vérifier les boutons de contrôle (Suivant, choix) ont des labels
    await step(page, 'Avancer et vérifier labels choix');
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.getByRole('button', { name: /suivant/i });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const choicesGroup = page.getByRole('group', { name: /choix/i });
    if (await choicesGroup.isVisible().catch(() => false)) {
      const choice = choicesGroup.getByRole('button').first();
      const ariaLabel = await choice.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy(); // Doit avoir un aria-label
      await step(page, `aria-label détecté: ${ariaLabel}`);
    }

    await step(page, 'Accessibilité HUD validée ✅');
  });
});
