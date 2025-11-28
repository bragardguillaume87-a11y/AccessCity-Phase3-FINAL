# Tests E2E (Playwright) — AccessCity

Ce dossier contient des tests Playwright end-to-end pour valider les parcours critiques et l'accessibilité de l'application AccessCity.

## Tests disponibles

### ✅ Stables (6 tests)
- **player.spec.ts** (4 tests)
  - Onboarding modal: focus trap et fermeture
  - Toast aria-live: visibilité et détection
  - HUD et badges: navigation, lancement scène, badges delta après choix
  - Dialogue: accessibilité et attributs aria

- **inventory.spec.ts** (2 tests)
  - Navigation chapitres → lancement scène → badges delta visibles
  - Accessibilité HUD: labels et rôles

### ⏸️ En attente (1 test skipped)
- **scene-end.spec.ts**
  - Focus sur bouton sortie après fin de scène
  - Nécessite un scénario avec fin explicite (`data-scene-ended=true`)
  - Actuellement skip car le scénario demo se termine automatiquement

## Installation

```pwsh
npm install
npm run e2e:install
```

## Lancement

```pwsh
# Tous les tests
npm run e2e

# Tests spécifiques
npx playwright test player.spec.ts
npx playwright test --grep "HUD"

# Mode debug (UI)
npx playwright test --ui

# Mode headed (voir le navigateur)
npx playwright test --headed
```

## Configuration

- **URL cible**: `http://localhost:8000/index-react.html?e2e=1`
- **Mode e2e**: Le paramètre `?e2e=1` active l'overlay de debug et les helpers `__E2E_STEP__`
- **Serveur**: Playwright lance automatiquement un serveur Python sur le port 8000
- **Retries**: 2 tentatives automatiques en cas d'échec
- **Diagnostics**: Traces activées on-first-retry, screenshots et vidéos on-failure

## Ajouter un nouveau test

1. **Consultez le template**: `docs/E2E_PROMPT_TEMPLATE.md`
2. **Créez un fichier**: `e2e/mon-test.spec.ts`
3. **Utilisez les patterns du template**:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   const BASE_URL = 'http://localhost:8000/index-react.html?e2e=1';
   
   async function step(page: any, msg: string) {
     await page.evaluate((m: string) => (window as any).__E2E_STEP__?.(m), msg);
   }
   
   test.describe('Mon parcours', () => {
     test('Description du test', async ({ page }) => {
       await page.goto(BASE_URL);
       await step(page, 'Étape 1');
       // ... sélecteurs accessibles avec getByRole, aria-label, etc.
     });
   });
   ```

4. **Privilégiez**:
   - `getByRole('button', { name: /pattern/i })` plutôt que sélecteurs CSS
   - `aria-label`, `role`, ids stables
   - Fallbacks et `.catch(() => false)` pour éléments optionnels
   - Messages `step()` pour traçabilité visuelle

5. **Lancez**: `npm run e2e`

## Bonnes pratiques

- **Sélecteurs accessibles**: `role`, `aria-label`, `aria-describedby`
- **Attentes explicites**: `expect(...).toBeVisible({ timeout: 5000 })`
- **Robustesse**: vérifiez les éléments optionnels avant clic
- **Observabilité**: utilisez `step()` pour documenter chaque étape
- **Fermeture coach**: fermez la coach bubble si elle masque des interactions
- **Avancement progressif**: boucle "Suivant" jusqu'aux choix, avec fallback

## Artefacts en cas d'échec

- **Traces**: `test-results/**/trace.zip` — ouvrir avec `npx playwright show-trace <file>`
- **Screenshots**: `test-results/**/*.png`
- **Vidéos**: `test-results/**/*.webm`

## CI/CD

Le workflow `.github/workflows/ci.yml` exécute automatiquement les tests e2e sur push/PR.
Les artefacts sont uploadés en cas d'échec pour diagnostic.

---

**Ressources**:
- Template prompt: `docs/E2E_PROMPT_TEMPLATE.md`
- Config Playwright: `playwright.config.ts`
- Documentation officielle: https://playwright.dev
