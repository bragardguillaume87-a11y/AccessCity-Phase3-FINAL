# Tests E2E (Playwright) — Squelette

Ce dossier contient des specs Playwright prêtes à l’emploi pour valider:
- Modales (focus initial, Échap, trap de focus)
- HUD/Bages (ordre des calques)
- Toasts (`aria-live`, visibilité)

Installation (optionnelle, à lancer quand vous êtes prêt):

```pwsh
npm i -D @playwright/test
npx playwright install
```

Lancement:

```pwsh
npx playwright test
```

Configuration par défaut: Playwright utilise un serveur interne. Si vous voulez cibler votre serveur local:
- Modifiez l’URL dans les specs (`BASE_URL`) vers `http://localhost:8000/index-react.html`.

Note: ces specs sont minimales et supposent la présence des éléments dans `index-react.html`.
