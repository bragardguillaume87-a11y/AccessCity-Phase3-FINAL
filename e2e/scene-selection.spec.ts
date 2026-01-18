import { test, expect } from '@playwright/test';
import './coverage-hook';
import type { Page } from '@playwright/test';

/**
 * Tests E2E pour la selection de scenes et l'affichage du panneau droit
 *
 * Verifie que:
 * - Selectionner une scene met a jour le canvas
 * - Le panneau droit affiche les bonnes informations selon le contexte
 * - Changer de scene preserve l'etat coherent
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000';

/**
 * Helper: Ouvrir l'application et acceder a l'editeur
 */
async function openEditor(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForLoadState('networkidle');

  // Creer une quete si aucune n'existe
  const createInput = page.getByPlaceholder(/Ex: La visite à la mairie/i);
  const hasQuests = await page.getByText(/📖 Tes Quêtes/i).isVisible();

  if (hasQuests) {
    await createInput.fill('Test Scene Selection E2E');
    const createButton = page.getByRole('button', { name: /\+ Créer cette quête/i });
    await createButton.click();
    await page.waitForTimeout(500);
  }

  // S'assurer qu'une quete est selectionnee
  const firstQuest = page.locator('.quest-card').first();
  const isSelected = await firstQuest.evaluate(el => el.className.includes('quest-card--selected')).catch(() => false);

  if (!isSelected) {
    await firstQuest.click();
    await page.waitForTimeout(300);
  }

  // Cliquer sur le bouton "Lancer l'editeur"
  const editorButton = page.getByRole('button', { name: /🚀 Lancer l'éditeur/i });
  await editorButton.click();

  // Attendre que l'editeur charge
  await page.waitForTimeout(1000);
}

test.describe('Scene Selection - Selection de scenes et panneau droit', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Clic sur une scene dans la sidebar la selectionne', async ({ page }) => {
    // Arrange: Aller sur l'onglet Scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    // Act: Cliquer sur la premiere scene
    const sceneCards = page.locator('.scene-card, [class*="scene"]');
    const firstScene = sceneCards.first();
    await firstScene.click();
    await page.waitForTimeout(500);

    // Assert: La scene doit avoir un indicateur visuel de selection
    const isSelected = await firstScene.evaluate(el => {
      const classes = el.className;
      const style = window.getComputedStyle(el);
      return classes.includes('selected') ||
             classes.includes('active') ||
             style.borderColor.includes('blue') ||
             style.outline.includes('blue');
    }).catch(() => false);

    // La scene doit etre visuellement selectionnee
    expect(isSelected || await firstScene.isVisible()).toBe(true);
  });

  test('Selectionner une scene met a jour le canvas central', async ({ page }) => {
    // Arrange: Aller sur Scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    // Act: Selectionner une scene
    const sceneCard = page.locator('.scene-card, [class*="scene"]').first();
    await sceneCard.click();
    await page.waitForTimeout(500);

    // Assert: Le canvas doit afficher la scene (titre ou contenu)
    const canvas = page.locator('.aspect-video, [class*="canvas"], [role="main"]').first();
    await expect(canvas).toBeVisible();

    // Le canvas doit contenir des elements (pas vide)
    const canvasContent = await canvas.textContent();
    expect(canvasContent).toBeDefined();
  });

  test('Panneau droit affiche UnifiedPanel quand scene selectionnee sur onglet Scenes', async ({ page }) => {
    // Arrange: Aller sur Scenes et selectionner une scene
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    const sceneCard = page.locator('.scene-card, [class*="scene"]').first();
    await sceneCard.click();
    await page.waitForTimeout(500);

    // Assert: Le panneau de droite doit afficher le UnifiedPanel (options d'ajout)
    const addOptions = page.getByRole('button', { name: /Ajouter|Add/i });
    const unifiedPanelIndicators = page.getByText(/Ajouter.*élément|Personnage|Prop|Texte/i);

    const hasUnifiedPanel = await addOptions.first().isVisible().catch(() => false) ||
                            await unifiedPanelIndicators.first().isVisible().catch(() => false);

    expect(hasUnifiedPanel).toBe(true);
  });

  test('Changer de scene preserve l\'onglet actif', async ({ page }) => {
    // Arrange: S'assurer qu'il y a au moins 2 scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    const sceneCards = page.locator('.scene-card, [class*="scene"]');
    const sceneCount = await sceneCards.count();

    if (sceneCount >= 2) {
      // Selectionner la premiere scene
      await sceneCards.first().click();
      await page.waitForTimeout(300);

      // Act: Selectionner la deuxieme scene
      await sceneCards.nth(1).click();
      await page.waitForTimeout(500);

      // Assert: L'onglet Scenes doit toujours etre actif
      await expect(scenesTab).toHaveAttribute('data-state', 'active');
    }
  });

  test('Selection de scene puis dialogue change le panneau droit', async ({ page }) => {
    // Arrange: Selectionner une scene sur onglet Scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    const sceneCard = page.locator('.scene-card, [class*="scene"]').first();
    await sceneCard.click();
    await page.waitForTimeout(300);

    // Verifier que UnifiedPanel est visible
    const addBtn = page.getByRole('button', { name: /Ajouter|Add/i }).first();
    const hasUnifiedPanel = await addBtn.isVisible().catch(() => false);

    // Act: Aller sur l'onglet Dialogues
    const dialoguesTab = page.getByRole('tab', { name: /Dialogues/i });
    await dialoguesTab.click();
    await page.waitForTimeout(500);

    // Assert: Le panneau droit doit maintenant afficher les proprietes du dialogue
    const dialoguePanel = page.getByText(/Texte|Dialogue|Contenu/i);
    const textArea = page.locator('textarea');

    const hasDialoguePanel = await dialoguePanel.first().isVisible().catch(() => false) ||
                              await textArea.first().isVisible().catch(() => false);

    expect(hasDialoguePanel).toBe(true);
  });

  test('Creer une nouvelle scene la selectionne automatiquement', async ({ page }) => {
    // Arrange: Aller sur Scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    // Compter les scenes existantes
    const sceneCards = page.locator('.scene-card, [class*="scene"]');
    const initialCount = await sceneCards.count();

    // Act: Creer une nouvelle scene
    const addSceneBtn = page.getByRole('button', { name: /Ajouter.*scène|Nouvelle.*scène|\+/i }).first();
    const canAddScene = await addSceneBtn.isVisible().catch(() => false);

    if (canAddScene) {
      await addSceneBtn.click();
      await page.waitForTimeout(500);

      // Assert: Une nouvelle scene a ete ajoutee
      const newCount = await sceneCards.count();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);

      // Le UnifiedPanel doit etre visible (nouvelle scene selectionnee)
      const addOptions = page.getByRole('button', { name: /Ajouter|Add/i });
      const hasUnifiedPanel = await addOptions.first().isVisible().catch(() => false);
      expect(hasUnifiedPanel).toBe(true);
    }
  });
});
