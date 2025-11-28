# Mini-template Prompt E2E (Playwright)

Objectif: fournir un prompt court et actionnable pour créer/stabiliser des tests e2e Playwright sur une app web.

## À renseigner
- Contexte: app, techno UI, particularités (onboarding, coach, focus trap)
- URL cible: serveur local + chemin exact (ex: `index-react.html?e2e=1`)
- Parcours critiques: étapes fonctionnelles à valider (onboarding, toast, HUD, choix, fin de scène)
- Accessibilité: rôles/aria attendus, focus attendu
- Sélecteurs: stratégie (role/aria/ids stables) et anti-patterns à éviter
- Stabilité: retries, timeouts, attentes explicites, fermeture bulles/coachs
- Observabilité: overlay e2e, logs de pas, trace/screenshot/vidéo
- CI: comment lancer en pipeline, artefacts à uploader en cas d’échec

## Prompt (copier-coller et compléter)
Vous êtes un assistant QA qui écrit des tests Playwright stables et accessibles.

Contexte:
- Application: <Nom app> (UI: <React/Vue/vanilla>), serveur local `http://localhost:8000`.
- Page cible: `<index-react.html?e2e=1>` (éviter `index.html` si non interactif).
- Particularités: <onboarding à fermer>, <coach bubble>, <focus trap>.

Objectifs (acceptance):
- Onboarding: pouvoir fermer proprement et vérifier le focus.
- Toast: aria-live visible via `[role="status"]` (exclure overlay de test si présent).
- HUD: visible; navigation « Scènes » → lancer ▶; badges delta visibles après un choix.
- Dialogue: `.dialogue-box` visible, texte non vide; groupe de choix avec rôles/labels accessibles.
- Fin de scène: attribut `data-scene-ended="true"` et focus ramené sur un élément stable (ex: `#exit-player-btn`).

Contraintes et sélecteurs:
- Privilégier `[role]`, `aria-label`, ids stables; éviter sélecteurs CSS fragiles.
- Fermer la « coach bubble » si elle masque des interactions (bouton « Compris »).
- Avancer avec « Suivant » jusqu’aux choix; fallback si pas de choix.

Stabilité/Diagnostics:
- Configurer `retries=2`, `trace: on-first-retry`, `screenshot: only-on-failure`, `video: retain-on-failure`.
- Ajouter overlay e2e (`window.__E2E_STEP__(msg)`) pour afficher les étapes en surimpression.

Livrables:
- Fichier(s) `e2e/*.spec.ts` avec sélecteurs accessibles et attentes robustes.
- Mise à jour `playwright.config.ts` si nécessaire.
- CI: job GitHub Actions qui exécute `npm test` puis `npm run e2e`, upload artefacts en cas d’échec.

Merci de produire:
1) Les tests Playwright complets et stables
2) Les ajustements minimes dans la page (si besoin) pour a11y/overlay e2e
3) Les instructions de lancement local et CI

## Squelette de test minimal
```ts
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8000/index-react.html?e2e=1';

async function step(page, msg: string) {
  await page.evaluate(m => (window as any).__E2E_STEP__?.(m), msg);
}

test.describe('Parcours critique', () => {
  test('Onboarding → HUD → Choix → Dialogue', async ({ page }) => {
    await page.goto(BASE);

    await step(page, 'Fermer onboarding');
    const close = page.getByRole('button', { name: /terminer|fermer|commencer/i });
    if (await close.isVisible()) await close.click();

    await step(page, 'Ouvrir Scènes et lancer ▶');
    await page.getByRole('button', { name: /scènes/i }).click();
    await page.getByRole('button', { name: /▶|lancer|jouer/i }).first().click();

    await step(page, 'Fermer coach si présent');
    const coachOk = page.getByRole('button', { name: /compris|ok|d'accord/i });
    if (await coachOk.isVisible()) await coachOk.click();

    await step(page, 'Avancer jusqu’aux choix');
    for (let i = 0; i < 4; i++) {
      const next = page.getByRole('button', { name: /suivant/i });
      if (await next.isVisible()) await next.click();
      if (await page.getByRole('group', { name: /choix/i }).isVisible().catch(() => false)) break;
    }

    const choices = page.getByRole('group', { name: /choix/i });
    if (await choices.isVisible().catch(() => false)) {
      await step(page, 'Cliquer un choix');
      await choices.getByRole('button').first().click();
    }

    await step(page, 'Vérifier dialogue lisible');
    await expect(page.locator('.dialogue-box')).toBeVisible();
    await expect(page.locator('.dialogue-box')).not.toHaveText(/^\s*$/);
  });
});
```

## Conseils rapides
- Éviter `.nth(n)` sans raison; préférer `getByRole`/`getByLabel`.
- Toujours documenter les étapes via `__E2E_STEP__` pour déboguer visuellement.
- Prévoir un fallback quand l’UI peut ou non proposer des choix.
