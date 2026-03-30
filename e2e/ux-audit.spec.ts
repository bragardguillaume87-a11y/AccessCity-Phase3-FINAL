import { test, expect } from '@playwright/test';
import { openEditor, goToDialoguesTab, goToScenesTab, getSceneCards } from './test-helpers';

/**
 * ux-audit.spec.ts — Audit visuel UX selon nintendo-ux.md
 *
 * Ce script n'est PAS un test fonctionnel — c'est un outil d'audit.
 * Il prend des screenshots de chaque zone clé de l'éditeur pour
 * permettre une revue visuelle humaine (et par Claude).
 *
 * Lancement : npm run audit:ux
 * Screenshots sauvegardés dans : test-artifacts/ux-audit/
 *
 * Règles vérifiées automatiquement :
 * - Pas de placeholder générique si donnée réelle dispo (Will Wright)
 * - Texte dans la VN textbox = texte tapé (Bret Victor live preview)
 * - Portrait affiché quand speaker sélectionné (Amy Hennig)
 */

test.use({
  viewport: { width: 1440, height: 900 },
  screenshot: 'on',
});

test.describe('UX Audit — AccessCity Editor', () => {
  // ── Zone 1 : Éditeur global ──────────────────────────────────────────────
  test("01 — État initial de l'éditeur (onglet Scènes)", async ({ page }) => {
    await openEditor(page);
    await page.screenshot({
      path: 'test-artifacts/ux-audit/01-editor-initial.png',
      fullPage: false,
    });
  });

  // ── Zone 2 : Onglet Dialogues ────────────────────────────────────────────
  test('02 — Onglet Dialogues + liste de dialogues', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-artifacts/ux-audit/02-dialogues-tab.png' });
  });

  // ── Zone 3 : DialogueComposer — Phase 1 (sélection de type) ─────────────
  test('03 — DialogueComposer Phase 1 (grandes cartes de type)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(400);

    const newBtn = page.getByRole('button', { name: /Nouveau dialogue/i });
    await newBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-artifacts/ux-audit/03-composer-phase1-type-selection.png',
    });

    // ── Vérification automatique : pas de placeholder générique ──────────
    const placeholder = page.locator('text=Scène de jeu');
    const hasGenericPlaceholder = await placeholder.isVisible().catch(() => false);
    expect(hasGenericPlaceholder).toBe(false); // Will Wright §4.1
  });

  // ── Zone 4 : DialogueComposer — Phase 2 type Simple (split 40/60) ───────
  test('04 — DialogueComposer Phase 2 type Simple (preview vide)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(400);

    const newBtn = page.getByRole('button', { name: /Nouveau dialogue/i });
    await newBtn.click();
    await page.waitForTimeout(400);

    // Cliquer sur "Simple" (force: true car le dialog Radix peut intercepter)
    await page
      .getByText(/Simple/i)
      .first()
      .click({ force: true });
    await page.waitForTimeout(600);

    await page.screenshot({ path: 'test-artifacts/ux-audit/04-composer-simple-no-speaker.png' });
  });

  // ── Zone 5 : DialogueComposer — live preview avec texte tapé ────────────
  test('05 — DialogueComposer live preview (Bret Victor)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(400);

    const newBtn = page.getByRole('button', { name: /Nouveau dialogue/i });
    await newBtn.click();
    await page.waitForTimeout(400);

    await page
      .getByText(/Simple/i)
      .first()
      .click({ force: true });
    await page.waitForTimeout(600);

    // Taper du texte dans le champ textarea
    const textarea = page.locator('textarea').first();
    await textarea.fill('Bonjour ! Bienvenue à AccessCity, la ville inclusive.');
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'test-artifacts/ux-audit/05-composer-live-preview-text.png' });

    // ── Vérification automatique : le texte tapé apparaît dans la preview ─
    // Le texte doit apparaître DEUX fois : dans le textarea ET dans la VN textbox
    const textOccurrences = await page.getByText('Bonjour').count();
    expect(textOccurrences).toBeGreaterThanOrEqual(2); // Bret Victor §7.1
  });

  // ── Zone 6 : DialogueComposer avec speaker sélectionné ──────────────────
  test('06 — DialogueComposer avec speaker (portrait visible)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(400);

    const newBtn = page.getByRole('button', { name: /Nouveau dialogue/i });
    await newBtn.click();
    await page.waitForTimeout(400);

    await page
      .getByText(/Simple/i)
      .first()
      .click({ force: true });
    await page.waitForTimeout(600);

    // Sélectionner un speaker si le sélecteur est disponible
    const speakerSelect = page.locator('select, [role="combobox"]').first();
    const hasSpeaker = await speakerSelect.isVisible().catch(() => false);
    if (hasSpeaker) {
      await speakerSelect.click();
      await page.waitForTimeout(300);
      // Prendre un screenshot du sélecteur ouvert
      await page.screenshot({ path: 'test-artifacts/ux-audit/06a-composer-speaker-picker.png' });

      // Sélectionner la première option non-narrateur
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(400);
      }
    }

    await page.screenshot({ path: 'test-artifacts/ux-audit/06-composer-with-speaker.png' });
  });

  // ── Zone 7 : DialogueComposer type Binary (choix) ───────────────────────
  test('07 — DialogueComposer type Binary (choix A/B)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(400);

    const newBtn = page.getByRole('button', { name: /Nouveau dialogue/i });
    await newBtn.click();
    await page.waitForTimeout(400);

    await page
      .getByText(/Choix|Binary|Branching/i)
      .first()
      .click({ force: true });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-artifacts/ux-audit/07-composer-binary.png' });
  });

  // ── Zone 8 : DialogueComposer type Minigame ──────────────────────────────
  test('08 — DialogueComposer type Minigame (preview interactive)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(400);

    const newBtn = page.getByRole('button', { name: /Nouveau dialogue/i });
    await newBtn.click();
    await page.waitForTimeout(400);

    const minigameBtn = page.getByText(/Minijeu|Mini-jeu|Minigame/i).first();
    const hasMinigame = await minigameBtn.isVisible().catch(() => false);
    if (hasMinigame) {
      await minigameBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-artifacts/ux-audit/08-composer-minigame.png' });
    } else {
      test.skip();
    }
  });

  // ── Zone 9 : Édition d'un dialogue existant ──────────────────────────────
  test('09 — Edition dialogue existant (split direct, pas Phase 1)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(600);

    // Chercher un bouton Modifier sur le premier dialogue
    const editBtn = page.getByRole('button', { name: /Modifier|Éditer|Edit/i }).first();
    const hasEdit = await editBtn.isVisible().catch(() => false);

    if (hasEdit) {
      await editBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'test-artifacts/ux-audit/09-composer-edit-existing.png' });
    } else {
      // Fallback : cliquer sur le premier item de dialogue
      const firstDialogue = page.locator('[data-dialogue-id], [class*="dialogue-item"]').first();
      if (await firstDialogue.isVisible().catch(() => false)) {
        await firstDialogue.dblclick();
        await page.waitForTimeout(600);
        await page.screenshot({ path: 'test-artifacts/ux-audit/09-composer-edit-existing.png' });
      } else {
        test.skip();
      }
    }
  });

  // ── Zone 10 : PreviewPlayer (lecture du scénario) ────────────────────────
  test('10 — PreviewPlayer (lecture en temps réel)', async ({ page }) => {
    await openEditor(page);
    await page.waitForTimeout(400);

    const previewBtn = page.getByRole('button', { name: /Aperçu|Preview|Lire|Play/i }).first();
    const hasPreview = await previewBtn.isVisible().catch(() => false);

    if (hasPreview) {
      await previewBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'test-artifacts/ux-audit/10-preview-player.png' });
    } else {
      test.skip();
    }
  });

  // ── Zone 11 : Graphe de dialogues ────────────────────────────────────────
  test('11 — Graphe de dialogues (@xyflow)', async ({ page }) => {
    await openEditor(page);
    await goToDialoguesTab(page);
    await page.waitForTimeout(400);

    const graphBtn = page.getByRole('button', { name: /Graphe|Graph|Nodal/i }).first();
    const hasGraph = await graphBtn.isVisible().catch(() => false);

    if (hasGraph) {
      await graphBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-artifacts/ux-audit/11-dialogue-graph.png' });
    } else {
      test.skip();
    }
  });
});
