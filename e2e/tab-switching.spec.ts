import { test, expect } from '@playwright/test';
import './coverage-hook';
import type { Page } from '@playwright/test';

/**
 * Tests E2E pour le changement d'onglets Scenes/Dialogues
 *
 * Bug corrige: Quand on clique sur "Scenes", le panneau "Ajouter element"
 * (UnifiedPanel) ne s'affichait pas car l'auto-select ecrasait la selection.
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
    await createInput.fill('Test Tab Switching E2E');
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

test.describe('Tab Switching - Changement d\'onglets Scenes/Dialogues', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Clic sur onglet Scenes affiche UnifiedPanel (Ajouter element)', async ({ page }) => {
    // Arrange: S'assurer qu'on est sur l'onglet Dialogues d'abord
    const dialoguesTab = page.getByRole('tab', { name: /Dialogues/i });
    await dialoguesTab.click();
    await page.waitForTimeout(500);

    // Act: Cliquer sur l'onglet Scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    // Assert: Le panneau de droite doit afficher les options d'ajout d'elements
    // Chercher des indicateurs du UnifiedPanel (boutons d'ajout)
    const addCharacterBtn = page.getByRole('button', { name: /Ajouter.*personnage|Add.*character/i });
    const addElementSection = page.getByText(/Ajouter.*élément|Add.*element/i);

    // Au moins un des indicateurs doit etre visible
    const hasUnifiedPanel = await addCharacterBtn.isVisible().catch(() => false) ||
                            await addElementSection.isVisible().catch(() => false);

    expect(hasUnifiedPanel).toBe(true);
  });

  test('Clic sur onglet Dialogues apres Scenes garde le bon contexte', async ({ page }) => {
    // Arrange: Aller sur Scenes d'abord
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    // Selectionner une scene
    const firstScene = page.locator('.scene-card, [class*="scene"]').first();
    await firstScene.click();
    await page.waitForTimeout(300);

    // Act: Cliquer sur l'onglet Dialogues
    const dialoguesTab = page.getByRole('tab', { name: /Dialogues/i });
    await dialoguesTab.click();
    await page.waitForTimeout(500);

    // Assert: Un dialogue doit etre auto-selectionne (ou liste visible)
    const dialogueList = page.locator('[class*="dialogue"], .dialogue-item');
    const hasDialogues = await dialogueList.first().isVisible().catch(() => false);

    // Soit des dialogues sont visibles, soit le panneau de proprietes dialogue
    expect(hasDialogues || await page.getByText(/Dialogue|Texte/i).isVisible()).toBe(true);
  });

  test('Aller-retour Scenes -> Dialogues -> Scenes conserve UnifiedPanel', async ({ page }) => {
    // Arrange: Commencer sur Scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(500);

    // Verifier UnifiedPanel visible
    const addElementSection1 = page.getByText(/Ajouter.*élément|Add.*element/i);
    const initialVisible = await addElementSection1.isVisible().catch(() => false);

    // Act: Aller sur Dialogues puis revenir sur Scenes
    const dialoguesTab = page.getByRole('tab', { name: /Dialogues/i });
    await dialoguesTab.click();
    await page.waitForTimeout(500);

    await scenesTab.click();
    await page.waitForTimeout(500);

    // Assert: UnifiedPanel doit toujours etre visible
    const addCharacterBtn = page.getByRole('button', { name: /Ajouter.*personnage|Add.*character/i });
    const addElementSection2 = page.getByText(/Ajouter.*élément|Add.*element/i);

    const finalVisible = await addCharacterBtn.isVisible().catch(() => false) ||
                         await addElementSection2.isVisible().catch(() => false);

    expect(finalVisible).toBe(true);
  });

  test('L\'onglet actif est visuellement distinct', async ({ page }) => {
    // Act: Cliquer sur Scenes
    const scenesTab = page.getByRole('tab', { name: /Scènes/i });
    await scenesTab.click();
    await page.waitForTimeout(300);

    // Assert: L'onglet Scenes doit avoir l'attribut data-state="active"
    await expect(scenesTab).toHaveAttribute('data-state', 'active');

    // Act: Cliquer sur Dialogues
    const dialoguesTab = page.getByRole('tab', { name: /Dialogues/i });
    await dialoguesTab.click();
    await page.waitForTimeout(300);

    // Assert: L'onglet Dialogues doit avoir l'attribut data-state="active"
    await expect(dialoguesTab).toHaveAttribute('data-state', 'active');
    await expect(scenesTab).not.toHaveAttribute('data-state', 'active');
  });
});
