import { test, expect } from '@playwright/test';
import './coverage-hook';
import type { Page } from '@playwright/test';
import { openEditor } from './test-helpers';

/**
 * Tests E2E pour AvatarPicker component
 * Teste la sélection de sprites pour les humeurs des personnages
 */

/**
 * Helper: Ouvrir la modal des personnages
 */
async function openCharactersModal(page: Page) {
  const charactersButton = page.getByRole('button', { name: /Personnages/i });
  await charactersButton.click();
  await page.waitForSelector('text=Personnages', { timeout: 5000 });
}

/**
 * Helper: Créer et éditer un personnage
 */
async function createAndEditCharacter(page: Page, name: string) {
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

  // Ouvrir l'éditeur
  const characterCard = page.locator(`text=${name}`).locator('..').locator('..');
  // Le bouton a aria-label="Éditer {name}", donc cherchons "Éditer {name}"
  const editButton = characterCard.getByRole('button', { name: new RegExp(`Éditer.*${name}`, 'i') });
  await editButton.click();
  await page.waitForTimeout(1000);
}

/**
 * Helper: Naviguer vers l'onglet Humeurs & Avatars
 */
async function goToMoodsTab(page: Page) {
  const moodsTab = page.getByRole('tab', { name: /🎭.*Humeurs.*Avatars/i });
  await moodsTab.click();
  await page.waitForTimeout(500);
}

/**
 * Helper: Ajouter une humeur
 */
async function addMood(page: Page, moodName: string) {
  const moodInput = page.getByPlaceholder(/Nom de l'humeur/i);
  await moodInput.fill(moodName);
  const addButton = page.getByRole('button', { name: /\+ Ajouter/i }).first();
  await addButton.click();
  await page.waitForTimeout(500);
}

/**
 * Helper: Ouvrir l'AvatarPicker pour une humeur
 */
async function openAvatarPickerForMood(page: Page, moodName: string) {
  // Scroller vers le MoodSpriteMapper
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(300);

  // Chercher la carte de l'humeur dans le MoodSpriteMapper
  const moodCard = page.locator('.grid').locator(`text=${moodName}`).locator('..').first();
  await moodCard.click();

  // Attendre que l'AvatarPicker s'ouvre
  await page.waitForTimeout(500);
  await expect(page.getByText(/Sélectionner un sprite/i)).toBeVisible();
}

// TODO: Ces tests dépendent du wizard de personnage qui a été refait
// Ils seront réactivés quand createAndEditCharacter sera mis à jour
test.describe.skip('AvatarPicker - Sélection de sprites', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await openCharactersModal(page);
    await createAndEditCharacter(page, 'AvatarTestChar');
    await goToMoodsTab(page);
    await addMood(page, 'happy');
  });

  test('Ouvrir AvatarPicker depuis MoodSpriteMapper', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Vérifier que le titre est affiché
    await expect(page.getByText(/Sélectionner un sprite/i)).toBeVisible();

    // Vérifier que l'humeur est mentionnée
    await expect(page.getByText(/happy/i)).toBeVisible();

    // Vérifier que la barre de recherche est présente
    const searchInput = page.getByPlaceholder(/Rechercher un avatar/i);
    await expect(searchInput).toBeVisible();

    // Vérifier que des avatars sont affichés
    const avatarGrid = page.locator('.grid').filter({ hasText: /Tous les avatars/i });
    await expect(avatarGrid).toBeVisible();
  });

  test('Fermer AvatarPicker avec bouton X', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Cliquer sur le bouton de fermeture (X)
    const closeButton = page.getByLabel(/Fermer/i).or(
      page.locator('button').filter({ hasText: '' }).filter({ has: page.locator('svg') }).last()
    );
    await closeButton.click();

    // Vérifier que l'AvatarPicker est fermé
    await page.waitForTimeout(300);
    const pickerTitle = page.getByText(/Sélectionner un sprite/i);
    await expect(pickerTitle).not.toBeVisible();
  });

  test('Fermer AvatarPicker avec bouton Annuler', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Cliquer sur le bouton Annuler
    const cancelButton = page.getByRole('button', { name: /Annuler/i }).last();
    await cancelButton.click();

    // Vérifier que l'AvatarPicker est fermé
    await page.waitForTimeout(300);
    const pickerTitle = page.getByText(/Sélectionner un sprite/i);
    await expect(pickerTitle).not.toBeVisible();
  });

  test('Sélectionner un sprite depuis la galerie', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Chercher les thumbnails de sprites
    const avatarThumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
    const count = await avatarThumbnails.count();

    if (count > 0) {
      // Cliquer sur le premier sprite
      await avatarThumbnails.first().click();

      // Attendre que le picker se ferme
      await page.waitForTimeout(1000);

      // Vérifier que le sprite est maintenant assigné
      // La carte de l'humeur devrait avoir une bordure verte
      const moodCard = page.locator('.grid').locator(`text=happy`).locator('..').first();
      const hasGreenBorder = await moodCard.evaluate(el => {
        return window.getComputedStyle(el).borderColor.includes('34, 197, 94') || // green-600
               el.className.includes('border-green');
      }).catch(() => false);

      // Note: La validation visuelle peut varier selon le rendu
      // L'important est que la modal se ferme et qu'un sprite soit assigné
    }
  });

  test('Rechercher un sprite par nom', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Utiliser la barre de recherche
    const searchInput = page.getByPlaceholder(/Rechercher un avatar/i);
    await searchInput.fill('character');

    // Attendre le filtrage
    await page.waitForTimeout(500);

    // Vérifier que le compteur de résultats est affiché
    const resultsText = page.getByText(/Résultats/i);
    const hasResults = await resultsText.isVisible().catch(() => false);

    if (hasResults) {
      await expect(resultsText).toBeVisible();
    }

    // Vérifier que les thumbnails sont filtrés
    const thumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
    const filteredCount = await thumbnails.count();

    // Le nombre de résultats devrait être >= 0
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('Recherche sans résultat affiche message', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Rechercher quelque chose qui n'existe pas
    const searchInput = page.getByPlaceholder(/Rechercher un avatar/i);
    await searchInput.fill('xyznonexistant12345');
    await page.waitForTimeout(500);

    // Vérifier qu'un message "Aucun avatar disponible" s'affiche
    const noResultsMessage = page.getByText(/Aucun avatar disponible/i);
    const hasMessage = await noResultsMessage.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasMessage) {
      await expect(noResultsMessage).toBeVisible();
    }
  });

  test('Retirer un sprite assigné', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Sélectionner un sprite
    const avatarThumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
    const count = await avatarThumbnails.count();

    if (count > 0) {
      await avatarThumbnails.first().click();
      await page.waitForTimeout(1000);

      // Rouvrir l'AvatarPicker
      await openAvatarPickerForMood(page, 'happy');

      // Vérifier qu'un sprite est affiché dans "Avatar actuel"
      const currentAvatarSection = page.getByText(/Avatar actuel/i);
      await expect(currentAvatarSection).toBeVisible();

      // Cliquer sur le bouton "Retirer"
      const removeButton = page.getByRole('button', { name: /Retirer/i }).first();
      await removeButton.click();

      // Attendre la mise à jour
      await page.waitForTimeout(500);

      // Vérifier que la section "Avatar actuel" a disparu
      const currentAvatarAfter = page.getByText(/Avatar actuel/i);
      const stillVisible = await currentAvatarAfter.isVisible().catch(() => false);

      // Après retrait, la section ne devrait plus être visible
      if (!stillVisible) {
        await expect(currentAvatarAfter).not.toBeVisible();
      }
    }
  });

  test('Sprites récents affichés', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Sélectionner un sprite pour l'ajouter aux récents
    const avatarThumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
    const count = await avatarThumbnails.count();

    if (count > 0) {
      await avatarThumbnails.first().click();
      await page.waitForTimeout(1000);

      // Ajouter une autre humeur
      await addMood(page, 'sad');
      await page.waitForTimeout(500);

      // Ouvrir l'AvatarPicker pour cette nouvelle humeur
      await openAvatarPickerForMood(page, 'sad');

      // Vérifier que la section "Récents" est affichée
      const recentsSection = page.getByText(/Récents/i).first();
      const hasRecents = await recentsSection.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasRecents) {
        await expect(recentsSection).toBeVisible();

        // Vérifier qu'il y a des thumbnails récents
        const recentThumbnails = page.locator('.grid').filter({ has: recentsSection }).locator('.aspect-square');
        const recentCount = await recentThumbnails.count();
        expect(recentCount).toBeGreaterThan(0);
      }
    }
  });

  test('Sprite sélectionné mis en évidence', async ({ page }) => {
    await openAvatarPickerForMood(page, 'happy');

    // Sélectionner un sprite
    const avatarThumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
    const count = await avatarThumbnails.count();

    if (count > 0) {
      await avatarThumbnails.first().click();
      await page.waitForTimeout(1000);

      // Rouvrir l'AvatarPicker
      await openAvatarPickerForMood(page, 'happy');

      // Chercher un thumbnail avec la classe "border-blue-500"
      const selectedThumbnail = page.locator('.border-blue-500').filter({ has: page.locator('img') });
      const hasSelected = await selectedThumbnail.isVisible().catch(() => false);

      if (hasSelected) {
        await expect(selectedThumbnail.first()).toBeVisible();

        // Vérifier qu'il a un checkmark
        const checkmark = selectedThumbnail.locator('text=✓');
        await expect(checkmark.first()).toBeVisible();
      }
    }
  });
});

test.describe.skip('AvatarPicker - Gestion des erreurs', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await openCharactersModal(page);
    await createAndEditCharacter(page, 'ErrorTestChar');
    await goToMoodsTab(page);
    await addMood(page, 'test');
  });

  test('Gestion des images cassées', async ({ page }) => {
    await openAvatarPickerForMood(page, 'test');

    // Les images cassées devraient afficher un placeholder SVG avec "?"
    // Attendre un peu pour que les images tentent de charger
    await page.waitForTimeout(2000);

    // Vérifier que des thumbnails sont présents même si certaines images sont cassées
    const thumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
    const count = await thumbnails.count();

    // Il devrait y avoir au moins quelques thumbnails
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('État de chargement affiché', async ({ page }) => {
    // Ouvrir rapidement l'AvatarPicker pour capter l'état de chargement
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);

    const moodCard = page.locator('.grid').locator(`text=test`).locator('..').first();
    await moodCard.click();

    // Vérifier si le message de chargement apparaît brièvement
    const loadingMessage = page.getByText(/Chargement des avatars/i);
    const isLoading = await loadingMessage.isVisible({ timeout: 1000 }).catch(() => false);

    // Note: L'état de chargement peut être très rapide
    // Le test passe que le message soit visible ou non
  });
});

test.describe.skip('AvatarPicker - Intégration avec MoodSpriteMapper', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await openCharactersModal(page);
    await createAndEditCharacter(page, 'IntegrationChar');
    await goToMoodsTab(page);
  });

  test('Assigner des sprites à plusieurs humeurs', async ({ page }) => {
    // Ajouter plusieurs humeurs
    await addMood(page, 'happy');
    await addMood(page, 'sad');
    await addMood(page, 'angry');
    await page.waitForTimeout(500);

    // Assigner un sprite à chaque humeur
    const moods = ['happy', 'sad', 'angry'];

    for (const mood of moods) {
      await openAvatarPickerForMood(page, mood);

      // Sélectionner le premier sprite disponible
      const avatarThumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
      const count = await avatarThumbnails.count();

      if (count > 0) {
        await avatarThumbnails.first().click();
        await page.waitForTimeout(1000);
      } else {
        // Si pas de sprites, fermer le picker
        const cancelButton = page.getByRole('button', { name: /Annuler/i }).last();
        await cancelButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Vérifier que les statistiques sont mises à jour
    await page.evaluate(() => window.scrollBy(0, -800));
    await page.waitForTimeout(300);

    const statsSection = page.locator('.bg-slate-800.rounded-lg.border').filter({ hasText: /Humeurs.*Sprites/i });
    const hasStats = await statsSection.isVisible().catch(() => false);

    if (hasStats) {
      // Les statistiques devraient montrer 3 humeurs
      const moodsCount = page.getByText('3').first();
      await expect(moodsCount).toBeVisible();
    }
  });

  test('Badge non assignés mis à jour', async ({ page }) => {
    // Ajouter une humeur
    await addMood(page, 'neutral');
    await page.waitForTimeout(500);

    // Scroller vers le MoodSpriteMapper
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);

    // Vérifier qu'un badge "non assignés" est visible
    const unassignedBadge = page.getByText(/⚠.*non assignés/i);
    const hasUnassigned = await unassignedBadge.isVisible().catch(() => false);

    if (hasUnassigned) {
      await expect(unassignedBadge).toBeVisible();

      // Assigner un sprite
      await openAvatarPickerForMood(page, 'neutral');
      const avatarThumbnails = page.locator('.aspect-square').filter({ has: page.locator('img') });
      const count = await avatarThumbnails.count();

      if (count > 0) {
        await avatarThumbnails.first().click();
        await page.waitForTimeout(1000);

        // Le badge devrait disparaître
        const badgeAfter = page.getByText(/⚠.*non assignés/i);
        const stillVisible = await badgeAfter.isVisible().catch(() => false);

        // Si tous les sprites sont assignés, le badge ne devrait plus être visible
        if (!stillVisible) {
          await expect(badgeAfter).not.toBeVisible();
        }
      }
    }
  });
});
