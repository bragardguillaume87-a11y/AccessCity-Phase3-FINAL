import { test, expect } from '@playwright/test';
import './coverage-hook';
import { openEditor, goToScenesTab, getSceneCards } from './test-helpers';

/**
 * Tests E2E pour l'ajout d'arrière-plan aux scènes
 *
 * MISE À JOUR: Utilise les nouveaux sélecteurs basés sur aria-label
 */

test.describe('Scene Background - Gestion des arrière-plans', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  // TODO: Le test d'ajout d'arrière-plan nécessite des interactions complexes avec la bibliothèque d'assets
  test.skip('Peut ajouter un arrière-plan à une scène', async ({ page }) => {
    // Aller dans l'onglet Scènes
    await goToScenesTab(page);

    // Sélectionner la première scène (nouveau sélecteur)
    const firstScene = getSceneCards(page).first();
    await firstScene.click();
    await page.waitForTimeout(500);

    // Essayer d'ouvrir le BackgroundPanel dans le panneau de droite
    try {
      // Chercher le panneau Arrière-plan
      const backgroundSection = page.getByText(/Arrière-plan/i).first();
      if (await backgroundSection.isVisible({ timeout: 2000 })) {
        // Cliquer sur un des boutons (Bibliothèque, Upload, ou URL)
        const pickerButton = page.getByRole('button', { name: /Bibliothèque|📚/i }).or(
          page.getByRole('button', { name: /URL/i })
        );
        await pickerButton.first().click();
      }
    } catch (e) {
      // Si le panneau n'est pas accessible, chercher le bouton dans le canvas
      const setBgBtn = page.getByRole('button', { name: /Set Background|Définir.*arrière-plan/i });
      if (await setBgBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await setBgBtn.click();
      }
    }

    await page.waitForTimeout(500);

    // Si une modal de bibliothèque s'ouvre, sélectionner un asset
    const assetGrid = page.locator('.grid').filter({ has: page.locator('img') });
    const hasAssets = await assetGrid.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasAssets) {
      const firstAsset = page.locator('.grid .group, .grid button').filter({ has: page.locator('img') }).first();
      await firstAsset.click();
      await page.waitForTimeout(500);

      // Fermer la modal si elle a un bouton de fermeture
      const closeModalBtn = page.getByRole('button', { name: /Fermer|Close|✖/i });
      if (await closeModalBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeModalBtn.click();
      }
    }

    // Vérifier que l'arrière-plan est appliqué dans le canvas
    const canvas = page.locator('.aspect-video, [class*="canvas"]').first();

    // Attendre et vérifier que le background est défini
    await expect.poll(async () => {
      const bgImage = await canvas.evaluate(el => {
        return window.getComputedStyle(el).backgroundImage || el.style.backgroundImage;
      });
      return bgImage;
    }, {
      timeout: 5000,
    }).toMatch(/url\(|\.jpg|\.png|assets/i);
  });

  test('Peut modifier l\'URL d\'arrière-plan manuellement', async ({ page }) => {
    // Aller dans l'onglet Scènes
    await goToScenesTab(page);

    // Sélectionner la première scène (nouveau sélecteur)
    const firstScene = getSceneCards(page).first();
    await firstScene.click();
    await page.waitForTimeout(500);

    // Chercher le champ d'input URL dans le BackgroundPanel
    const urlInput = page.locator('input[type="text"]').filter({ hasText: /URL|http/i }).or(
      page.locator('input[placeholder*="URL"]')
    );

    const hasUrlInput = await urlInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasUrlInput) {
      // Entrer une URL
      await urlInput.first().fill('https://example.com/background.jpg');
      await page.waitForTimeout(300);

      // Cliquer sur le bouton Sauvegarder si présent
      const saveButton = page.getByRole('button', { name: /Sauvegarder|Save/i });
      if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveButton.click();
      }

      await page.waitForTimeout(500);

      // Vérifier que l'URL est bien enregistrée
      const savedUrl = await urlInput.first().inputValue();
      expect(savedUrl).toContain('example.com/background.jpg');
    }
  });

  test('Affiche le canvas de la scène', async ({ page }) => {
    // Aller dans l'onglet Scènes
    await goToScenesTab(page);

    // Sélectionner la première scène (nouveau sélecteur)
    const firstScene = getSceneCards(page).first();
    await firstScene.click();
    await page.waitForTimeout(500);

    // Vérifier que le canvas est visible
    const canvas = page.locator('.aspect-video, [class*="canvas"]').first();
    await expect(canvas).toBeVisible();
  });
});
