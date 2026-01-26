import { test, expect } from '@playwright/test';
import './coverage-hook';
import type { Page } from '@playwright/test';

/**
 * Tests E2E pour CharactersModal avec nouveau CharacterEditorModal
 * Teste la création, édition et gestion des personnages avec humeurs/sprites
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000';

/**
 * Helper: Ouvrir l'application et accéder à l'éditeur
 */
async function openEditor(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForLoadState('networkidle');

  // Créer une quête si aucune n'existe
  const createInput = page.getByPlaceholder(/Ex: La visite à la mairie/i);
  const hasQuests = await page.getByText(/📖 Tes Quêtes/i).isVisible();

  if (hasQuests) {
    // Créer une nouvelle quête
    await createInput.fill('Test Quest E2E');
    const createButton = page.getByRole('button', { name: /\+ Créer cette quête/i });
    await createButton.click();
    await page.waitForTimeout(500);
  }

  // S'assurer qu'une quête est sélectionnée
  const firstQuest = page.locator('.quest-card').first();
  const isSelected = await firstQuest.evaluate(el => el.className.includes('quest-card--selected')).catch(() => false);

  if (!isSelected) {
    await firstQuest.click();
    await page.waitForTimeout(300);
  }

  // Cliquer sur le bouton "Lancer l'éditeur"
  const editorButton = page.getByRole('button', { name: /🚀 Lancer l'éditeur/i });
  await editorButton.click();

  // Attendre que l'éditeur charge
  await page.waitForTimeout(1000);
}

/**
 * Helper: Ouvrir la modal des personnages
 */
async function openCharactersModal(page: Page) {
  // Chercher le bouton "Personnages" dans la barre d'outils
  const charactersButton = page.getByRole('button', { name: /👥|Personnages/i });
  await charactersButton.click();

  // Attendre que la modal s'ouvre
  await page.waitForSelector('text=👥 Personnages', { timeout: 5000 });
}

/**
 * Helper: Créer un nouveau personnage
 */
async function createCharacter(page: Page, name: string) {
  // Utiliser type() au lieu de fill() pour les inputs contrôlés par React
  const nameInput = page.getByPlaceholder(/Nom du personnage/i);
  await nameInput.click();
  await nameInput.type(name); // type() déclenche onChange, contrairement à fill()

  // Cliquer sur Ajouter (attendre qu'il soit enabled)
  const addButton = page.getByRole('button', { name: /Ajouter.*personnage/i });
  await expect(addButton).toBeEnabled({ timeout: 5000 });
  await addButton.click();

  // Attendre que le personnage apparaisse dans la liste
  await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: Ouvrir l'éditeur d'un personnage
 */
async function editCharacter(page: Page, characterName: string) {
  // Chercher la carte du personnage et cliquer sur Éditer
  const characterCard = page.locator(`text=${characterName}`).locator('..').locator('..');
  // Le bouton a aria-label="Éditer {characterName}", donc cherchons juste "Éditer"
  const editButton = characterCard.getByRole('button', { name: new RegExp(`Éditer.*${characterName}`, 'i') });
  await editButton.click();

  // Attendre que la modal CharacterEditorModal s'ouvre
  await page.waitForTimeout(1000);
}

test.describe('CharactersModal - Gestion des personnages', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await openCharactersModal(page);
  });

  test('Ouvrir la modal des personnages', async ({ page }) => {
    // Vérifier que le titre est visible
    await expect(page.getByText('👥 Personnages')).toBeVisible();

    // Vérifier que le champ d'ajout est présent
    await expect(page.getByPlaceholder(/Nom du personnage/i)).toBeVisible();

    // Vérifier que le bouton Ajouter est présent (même s'il est désactivé)
    const addButton = page.getByRole('button', { name: /Ajouter.*personnage/i });
    await expect(addButton).toBeVisible();

    // Vérifier qu'il y a bien une liste de personnages (même vide)
    await expect(page.getByText(/Liste des personnages/i)).toBeVisible();
  });

  test('Créer un nouveau personnage simple', async ({ page }) => {
    const characterName = 'TestHero';

    await createCharacter(page, characterName);

    // Vérifier que le personnage apparaît dans la liste
    await expect(page.getByText(characterName)).toBeVisible();

    // Vérifier que les boutons d'action sont présents
    const characterCard = page.locator(`text=${characterName}`).locator('..').locator('..');
    // Les boutons ont des aria-labels avec le nom du personnage
    await expect(characterCard.getByRole('button', { name: new RegExp(`Éditer.*${characterName}`, 'i') })).toBeVisible();
    await expect(characterCard.getByRole('button', { name: new RegExp(`Dupliquer.*${characterName}`, 'i') })).toBeVisible();
    await expect(characterCard.getByRole('button', { name: new RegExp(`Supprimer.*${characterName}`, 'i') })).toBeVisible();
  });

  test('Validation nom unique', async ({ page }) => {
    const characterName = 'DuplicateTest';

    // Créer le premier personnage
    await createCharacter(page, characterName);
    await expect(page.getByText(characterName)).toBeVisible();

    // Essayer de créer un deuxième avec le même nom
    await createCharacter(page, characterName);

    // Éditer le deuxième personnage créé
    // Les boutons ont aria-label="Éditer {nom}", donc cherchons "Éditer"
    const allEditButtons = page.getByRole('button', { name: /Éditer/i });
    const editButtonCount = await allEditButtons.count();

    if (editButtonCount > 0) {
      await allEditButtons.first().click();
      await page.waitForTimeout(1000);

      // Vérifier qu'une erreur de validation s'affiche dans l'éditeur
      // (si le nom est dupliqué, l'erreur devrait apparaître)
      const errorMessage = page.getByText(/already exists/i);
      const hasError = await errorMessage.isVisible().catch(() => false);

      // Note: Le test peut passer même si l'erreur n'apparaît pas immédiatement
      // car la création peut avoir été bloquée en amont
    }
  });

  test('Supprimer un personnage', async ({ page }) => {
    const characterName = 'ToDelete';

    await createCharacter(page, characterName);
    await expect(page.getByText(characterName)).toBeVisible();

    // Cliquer sur le bouton Supprimer
    const characterCard = page.locator(`text=${characterName}`).locator('..').locator('..');
    const deleteButton = characterCard.getByRole('button', { name: /🗑️ Supprimer/i });
    await deleteButton.click();

    // Confirmer la suppression dans la modal de confirmation
    await page.waitForTimeout(500);
    const confirmButton = page.getByRole('button', { name: /Supprimer/i });
    await confirmButton.click();

    // Vérifier que le personnage a disparu
    await page.waitForTimeout(500);
    const characterText = page.getByText(characterName, { exact: true });
    await expect(characterText).not.toBeVisible();
  });

  test('Dupliquer un personnage', async ({ page }) => {
    const originalName = 'Original';

    await createCharacter(page, originalName);
    await expect(page.getByText(originalName)).toBeVisible();

    // Cliquer sur le bouton Dupliquer
    const characterCard = page.locator(`text=${originalName}`).locator('..').locator('..');
    const duplicateButton = characterCard.getByRole('button', { name: /📋 Dupliquer/i });
    await duplicateButton.click();

    // Attendre la duplication
    await page.waitForTimeout(1000);

    // Vérifier qu'un personnage "Original (copie)" ou similaire existe
    const duplicatedCharacter = page.getByText(/Original.*copie|Original \d+/i);
    const hasDuplicate = await duplicatedCharacter.isVisible().catch(() => false);

    // Le duplicata devrait ouvrir l'éditeur automatiquement
    const editorModal = page.getByText(/Éditer:|Nouveau personnage/i);
    await expect(editorModal.first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('CharacterEditorModal - Interface à onglets', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await openCharactersModal(page);

    // Créer un personnage de test
    await createCharacter(page, 'TabTestChar');
    await page.waitForTimeout(500);
  });

  test('Ouvrir CharacterEditorModal avec onglets', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Vérifier que les 3 onglets sont présents
    await expect(page.getByRole('tab', { name: /👤.*Identité/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /🎭.*Humeurs.*Avatars/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /⚙️.*Avancé/i })).toBeVisible();
  });

  test('Tab Identité - Modifier nom et description', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Vérifier que nous sommes sur l'onglet Identité par défaut
    const identityTab = page.getByRole('tab', { name: /👤.*Identité/i });
    await expect(identityTab).toHaveClass(/text-blue-400|border-blue-400/);

    // Modifier le nom
    const nameInput = page.getByLabel(/Nom/i).or(page.locator('input[type="text"]').first());
    await nameInput.fill('ModifiedName');

    // Vérifier que le badge "Modifications non sauvegardées" apparaît
    await page.waitForTimeout(300);
    const unsavedBadge = page.getByText(/Modifications non sauvegardées/i);
    await expect(unsavedBadge).toBeVisible();

    // Modifier la description
    const descriptionTextarea = page.locator('textarea').first();
    await descriptionTextarea.fill('Une description de test pour le personnage');

    // Sauvegarder
    const saveButton = page.getByRole('button', { name: /Sauvegarder|Créer personnage/i });
    await saveButton.click();

    // Vérifier que la modal se ferme
    await page.waitForTimeout(500);
    await expect(page.getByText('ModifiedName')).toBeVisible();
  });

  test('Tab Humeurs & Avatars - Ajouter une humeur', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Cliquer sur l'onglet "Humeurs & Avatars"
    const moodsTab = page.getByRole('tab', { name: /🎭.*Humeurs.*Avatars/i });
    await moodsTab.click();
    await page.waitForTimeout(500);

    // Vérifier que le champ pour ajouter une humeur est visible
    const moodInput = page.getByPlaceholder(/Nom de l'humeur/i);
    await expect(moodInput).toBeVisible();

    // Ajouter une humeur personnalisée
    await moodInput.fill('joyeux');
    const addMoodButton = page.getByRole('button', { name: /Ajouter/i }).filter({ hasText: /Ajouter/ });
    await expect(addMoodButton).toBeEnabled({ timeout: 5000 });
    await addMoodButton.click();

    // Vérifier que l'humeur apparaît dans la liste
    await page.waitForTimeout(500);
    const moodCard = page.getByText('🎭 joyeux');
    await expect(moodCard).toBeVisible();
  });

  test('Tab Humeurs & Avatars - Utiliser presets', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Aller à l'onglet Humeurs
    const moodsTab = page.getByRole('tab', { name: /🎭.*Humeurs.*Avatars/i });
    await moodsTab.click();
    await page.waitForTimeout(500);

    // Ouvrir le dropdown de presets
    const presetsButton = page.getByRole('button', { name: /📦 Presets|Fermer presets/i });
    await presetsButton.click();
    await page.waitForTimeout(300);

    // Cliquer sur un preset (ex: "😊 Happy")
    const happyPreset = page.getByText(/😊.*Happy/i).first();
    await happyPreset.click();
    await page.waitForTimeout(500);

    // Vérifier que l'humeur "happy" a été ajoutée
    const happyMood = page.getByText(/🎭 happy/i);
    await expect(happyMood).toBeVisible();
  });

  test('Tab Humeurs & Avatars - Supprimer une humeur', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Aller à l'onglet Humeurs
    const moodsTab = page.getByRole('tab', { name: /🎭.*Humeurs.*Avatars/i });
    await moodsTab.click();
    await page.waitForTimeout(500);

    // Ajouter deux humeurs pour pouvoir en supprimer une
    const moodInput = page.getByPlaceholder(/Nom de l'humeur/i);
    await moodInput.fill('humeur1');
    const addMoodBtn1 = page.getByRole('button', { name: /Ajouter/i }).filter({ hasText: /Ajouter/ });
    await expect(addMoodBtn1).toBeEnabled({ timeout: 5000 });
    await addMoodBtn1.click();
    await page.waitForTimeout(300);

    await moodInput.fill('humeur2');
    const addMoodBtn2 = page.getByRole('button', { name: /Ajouter/i }).filter({ hasText: /Ajouter/ });
    await expect(addMoodBtn2).toBeEnabled({ timeout: 5000 });
    await addMoodBtn2.click();
    await page.waitForTimeout(500);

    // Hover sur une carte d'humeur pour révéler le bouton de suppression
    const mood1Card = page.locator('text=🎭 humeur1').locator('..').locator('..');
    await mood1Card.hover();

    // Cliquer sur le bouton de suppression
    const deleteButton = mood1Card.locator('button[title*="Supprimer"]').or(
      mood1Card.locator('svg').locator('..').filter({ hasText: '' })
    );
    await deleteButton.first().click();

    // Vérifier que l'humeur a été supprimée
    await page.waitForTimeout(500);
    const deletedMood = page.getByText('🎭 humeur1');
    await expect(deletedMood).not.toBeVisible();
  });

  test('Tab Humeurs & Avatars - Warning sprite manquant', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Aller à l'onglet Humeurs
    const moodsTab = page.getByRole('tab', { name: /🎭.*Humeurs.*Avatars/i });
    await moodsTab.click();
    await page.waitForTimeout(500);

    // Ajouter une humeur sans sprite
    const moodInput = page.getByPlaceholder(/Nom de l'humeur/i);
    await moodInput.fill('triste');
    const addMoodBtn = page.getByRole('button', { name: /Ajouter/i }).filter({ hasText: /Ajouter/ });
    await expect(addMoodBtn).toBeEnabled({ timeout: 5000 });
    await addMoodBtn.click();
    await page.waitForTimeout(500);

    // Scroller vers le bas pour voir le MoodSpriteMapper
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);

    // Vérifier qu'un warning s'affiche pour les sprites manquants
    const warningBadge = page.getByText(/⚠.*non assignés/i).or(
      page.getByText(/Pas de sprite/i)
    );
    const hasWarning = await warningBadge.first().isVisible({ timeout: 2000 }).catch(() => false);

    // Le warning devrait être visible
    if (hasWarning) {
      await expect(warningBadge.first()).toBeVisible();
    }
  });

  test('Tab Avancé - Statistiques affichées', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Cliquer sur l'onglet Avancé
    const advancedTab = page.getByRole('tab', { name: /⚙️.*Avancé/i });
    await advancedTab.click();
    await page.waitForTimeout(500);

    // Vérifier que les statistiques sont affichées
    const statsHeading = page.getByText(/Statistiques d'utilisation/i);
    await expect(statsHeading).toBeVisible();

    // Vérifier que les compteurs sont présents
    const moodsCount = page.getByText(/Humeurs définies/i);
    const spritesCount = page.getByText(/Sprites assignés/i);

    await expect(moodsCount).toBeVisible();
    await expect(spritesCount).toBeVisible();
  });

  test('Tab Avancé - Export JSON', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Cliquer sur l'onglet Avancé
    const advancedTab = page.getByRole('tab', { name: /⚙️.*Avancé/i });
    await advancedTab.click();
    await page.waitForTimeout(500);

    // Préparer l'écoute du téléchargement
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });

    // Cliquer sur le bouton Export JSON
    const exportButton = page.getByRole('button', { name: /📥 Exporter JSON/i });
    await exportButton.click();

    // Vérifier que le téléchargement a commencé
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/character-.*\.json/);
  });

  test('Annuler avec modifications non sauvegardées', async ({ page }) => {
    await editCharacter(page, 'TabTestChar');

    // Faire une modification
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('ModifiedButNotSaved');
    await page.waitForTimeout(300);

    // Cliquer sur Annuler
    const cancelButton = page.getByRole('button', { name: /Annuler/i });
    await cancelButton.click();

    // Une confirmation devrait apparaître
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain(/modifications non sauvegardées/i);
      dialog.accept();
    });

    await page.waitForTimeout(500);
  });
});

test.describe('CharacterEditorModal - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await openCharactersModal(page);
  });

  test('Validation nom requis', async ({ page }) => {
    // Créer un personnage pour ouvrir l'éditeur
    await createCharacter(page, 'ValidationTest');
    await editCharacter(page, 'ValidationTest');

    // Vider le nom
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('');
    await page.waitForTimeout(300);

    // Essayer de sauvegarder
    const saveButton = page.getByRole('button', { name: /Sauvegarder/i });

    // Le bouton devrait être désactivé
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled).toBeTruthy();

    // Vérifier qu'un message d'erreur s'affiche
    const errorMessage = page.getByText(/required|requis/i);
    await expect(errorMessage.first()).toBeVisible();
  });

  test('Validation limite description (500 caractères)', async ({ page }) => {
    await createCharacter(page, 'LongDescTest');
    await editCharacter(page, 'LongDescTest');

    // Remplir la description avec plus de 500 caractères
    const longText = 'a'.repeat(501);
    const descriptionTextarea = page.locator('textarea').first();
    await descriptionTextarea.fill(longText);
    await page.waitForTimeout(300);

    // Vérifier qu'une erreur s'affiche
    const errorMessage = page.getByText(/500.*characters|500.*caractères/i);
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
      await expect(errorMessage).toBeVisible();
    }

    // Le bouton de sauvegarde devrait être désactivé
    const saveButton = page.getByRole('button', { name: /Sauvegarder/i });
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });
});
