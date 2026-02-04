import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/**
 * Helpers partagés pour les tests E2E
 *
 * Ces fonctions sont utilisées par tous les fichiers de test pour:
 * - Ouvrir l'application et accéder à l'éditeur
 * - Naviguer dans l'interface
 * - Effectuer des actions communes
 *
 * MISE À JOUR: Nouveaux sélecteurs pour les scènes (ScenesSidebar.tsx)
 * Les scènes utilisent désormais role="button" avec aria-label structuré
 */

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000';

/**
 * Helper: Ouvrir l'application et accéder à l'éditeur
 * Gère automatiquement la création de quête si nécessaire
 */
export async function openEditor(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForLoadState('networkidle');

  // Vérifier s'il y a des quêtes existantes
  const questCards = page.locator('.quest-card');
  const questCount = await questCards.count();

  // Créer une quête si aucune n'existe
  if (questCount === 0) {
    const createInput = page.getByPlaceholder(/Ex: La visite à la mairie/i);
    await createInput.fill('Test E2E Quest');

    // Le bouton s'appelle simplement "Créer"
    const createButton = page.getByRole('button', { name: /Créer/i }).first();
    await createButton.click();
    await page.waitForTimeout(500);
  }

  // S'assurer qu'une quête est sélectionnée
  const firstQuest = page.locator('.quest-card').first();
  const isSelected = await firstQuest
    .evaluate((el) => el.className.includes('quest-card--selected'))
    .catch(() => false);

  if (!isSelected) {
    await firstQuest.click();
    await page.waitForTimeout(300);
  }

  // Cliquer sur le bouton "Lancer"
  const editorButton = page.getByRole('button', { name: /Lancer/i });
  await editorButton.click();

  // Attendre que l'éditeur charge
  await page.waitForTimeout(1000);
}

/**
 * Helper: Ouvrir la modal des personnages
 */
export async function openCharactersModal(page: Page) {
  // Le bouton Personnages est dans la toolbar
  const charactersButton = page.getByRole('button', { name: /Personnages/i });
  await charactersButton.click();

  // Attendre que la modal s'ouvre
  await page.waitForSelector('text=Personnages', { timeout: 5000 });
}

/**
 * Helper: Créer un nouveau personnage via le wizard multi-étapes
 *
 * Flow actuel (CharacterWizard):
 * 1. Cliquer "+ Nouveau personnage" -> ouvre CharacterEditorModal
 * 2. Le modal ouvre en mode wizard (step 1: Identity)
 * 3. Remplir le nom et passer au step suivant
 * 4. Continuer jusqu'au step 4 (Review) et sauvegarder
 *
 * @param page - Page Playwright
 * @param name - Nom du personnage à créer
 * @param skipToEnd - Si true, saute directement à l'étape finale
 */
export async function createCharacter(page: Page, name: string, skipToEnd: boolean = true) {
  // Étape 1: Cliquer sur "+ Nouveau personnage"
  const newCharButton = page.getByRole('button', { name: /Nouveau personnage/i });
  await newCharButton.click();

  // Attendre que le wizard s'ouvre (CharacterEditorModal)
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await page.waitForTimeout(500);

  // Le wizard ouvre à l'étape Identity
  const dialog = page.locator('[role="dialog"]');

  // Remplir le nom du personnage
  const nameInput = dialog.locator('input').first();
  await nameInput.fill(name);
  await page.waitForTimeout(300);

  if (skipToEnd) {
    // Cliquer rapidement sur chaque étape pour aller jusqu'à Review
    // Les étapes sont dans une WizardProgressBar avec des boutons cliquables

    // Chercher et cliquer sur l'étape "Terminé" ou "Review" si disponible
    const reviewStep = dialog.getByText(/Terminé|Review|Récap/i);
    const hasReviewStep = await reviewStep.isVisible().catch(() => false);

    if (hasReviewStep) {
      await reviewStep.click({ force: true });
      await page.waitForTimeout(500);
    } else {
      // Sinon, cliquer sur "Continuer" plusieurs fois
      for (let i = 0; i < 3; i++) {
        const continueBtn = dialog.getByRole('button', { name: /Continuer|Suivant|Next/i });
        const hasContinue = await continueBtn.isVisible().catch(() => false);
        if (hasContinue) {
          await continueBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  }

  // Cliquer sur le bouton de création/sauvegarde final
  const saveButton = dialog.getByRole('button', { name: /Créer|Sauvegarder|Terminer|Enregistrer/i });
  const hasSaveButton = await saveButton.isVisible().catch(() => false);

  if (hasSaveButton) {
    await saveButton.click();
    // Attendre la fermeture du modal et l'animation de célébration
    await page.waitForTimeout(2500);
  }

  // Vérifier que le personnage apparaît dans la liste
  await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: Naviguer vers l'onglet Scènes
 */
export async function goToScenesTab(page: Page) {
  const scenesTab = page.getByRole('tab', { name: /Scènes/i });
  await scenesTab.click();
  await page.waitForTimeout(300);
}

/**
 * Helper: Naviguer vers l'onglet Dialogues
 */
export async function goToDialoguesTab(page: Page) {
  const dialoguesTab = page.getByRole('tab', { name: /Dialogues/i });
  await dialoguesTab.click();
  await page.waitForTimeout(300);
}

/**
 * Helper: Obtenir les cartes de scènes (nouveau sélecteur basé sur aria-label)
 * Les scènes ont: role="button" aria-label="Scene: {title}, {n} dialogues, {n} characters"
 */
export function getSceneCards(page: Page): Locator {
  return page.getByRole('button', { name: /Scene:.*dialogues/i });
}

/**
 * Helper: Vérifier si une scène est sélectionnée (bordure cyan)
 * Une scène sélectionnée a les classes: border-t-cyan-500, bg-cyan-500/30
 */
export async function isSceneSelected(sceneLocator: Locator): Promise<boolean> {
  return sceneLocator.evaluate(el => {
    const classes = el.className;
    return classes.includes('cyan-500') || classes.includes('bg-cyan');
  }).catch(() => false);
}

/**
 * Helper: Sélectionner une scène par son titre (pattern)
 */
export async function selectSceneByTitle(page: Page, titlePattern: string | RegExp) {
  await goToScenesTab(page);
  const pattern = typeof titlePattern === 'string'
    ? new RegExp(`Scene:.*${titlePattern}`, 'i')
    : new RegExp(`Scene:.*${titlePattern.source}`, 'i');
  const scene = page.getByRole('button', { name: pattern });
  await scene.click();
  await page.waitForTimeout(300);
}

/**
 * Helper: Sélectionner la première scène
 */
export async function selectFirstScene(page: Page) {
  await goToScenesTab(page);

  // Nouveau sélecteur: role="button" avec aria-label "Scene:..."
  const sceneCards = getSceneCards(page);
  const firstScene = sceneCards.first();

  if (await firstScene.isVisible().catch(() => false)) {
    await firstScene.click();
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

/**
 * Helper: Sélectionner le premier dialogue
 */
export async function selectFirstDialogue(page: Page) {
  await goToDialoguesTab(page);

  const dialogueItems = page.locator('[class*="dialogue"], .dialogue-item, [data-dialogue-id]');
  const firstDialogue = dialogueItems.first();

  if (await firstDialogue.isVisible().catch(() => false)) {
    await firstDialogue.click();
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

/**
 * Helper: Ouvrir le DialogueGraphModal (éditeur nodal)
 */
export async function openGraphModal(page: Page) {
  const graphButtonSelectors = [
    page.getByRole('button', { name: /Vue Graphe/i }),
    page.locator('button').filter({ hasText: /Graphe/i }),
    page.locator('button').filter({ hasText: /graphe/i }),
  ];

  for (const button of graphButtonSelectors) {
    const isVisible = await button.first().isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await button.first().click();
      await page.waitForSelector('text=Éditeur Nodal', { timeout: 5000 });
      return;
    }
  }

  throw new Error('Bouton "Vue Graphe" non trouvé');
}

/**
 * Helper: Cliquer sur un noeud de dialogue dans le graphe ReactFlow
 */
export async function clickDialogueNode(page: Page, nodeIndex: number = 0) {
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();

  if (nodeCount > nodeIndex) {
    await nodes.nth(nodeIndex).click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Helper: Ouvrir l'aperçu/prévisualisation
 */
export async function openPreview(page: Page) {
  const previewButton = page.getByRole('button', { name: /Aperçu|Preview/i });
  const hasPreview = await previewButton.isVisible().catch(() => false);

  if (hasPreview) {
    await previewButton.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

/**
 * Helper: Fermer une modal ouverte
 */
export async function closeModal(page: Page) {
  // Essayer plusieurs méthodes pour fermer
  const closeSelectors = [
    page.getByRole('button', { name: /Fermer|Close|×/i }),
    page.locator('button[aria-label*="close" i]'),
    page.locator('button[aria-label*="fermer" i]'),
    page.locator('[class*="close"]').first(),
  ];

  for (const closeButton of closeSelectors) {
    const isVisible = await closeButton.isVisible().catch(() => false);
    if (isVisible) {
      await closeButton.click();
      await page.waitForTimeout(300);
      return true;
    }
  }

  // Essayer Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  return true;
}
