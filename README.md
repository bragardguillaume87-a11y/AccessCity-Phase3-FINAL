# AccessCity 5.0
Narrative scene editor for non-coders. Data-driven architecture.

## Quick Start
1. Open `index.html` in a browser
2. Edit scenes via UI or modify `data/scenes.json`
3. Export/Import projects with toolbar buttons

## Documentation
- `docs/PROJECT_MEMORY_SEED.md` - Vision & rules
- `docs/AccessCity_Agentic_Workflow.md` - Development workflow
- `docs/CHANGELOG.md` - Version history
- `docs/SUMMARY_AUTOMATION.md` - Conversation summary generator
- `docs/COVERAGE_ROADMAP.md` - Plan couverture de code complète (Node + navigateur)
- `docs/VITE_SETUP.md` - Guide setup Vite avec HMR (workflow dev moderne)

## Testing
```bash
npm test
```

## Scripts

- `npm run dev` : serveur statique (Python http.server) sur port 8000.
- `npm run dev:vite` : serveur Vite avec HMR sur port 5173 (workflow moderne).
- `npm test` : tests d'intégration Node.
- `npm run e2e` : suite Playwright (E2E).
- `npm run e2e:install` : installation navigateurs Playwright.
- `npm run coverage` : couverture Node (texte + lcov).
- `npm run coverage:html` : rapport HTML couverture Node.
- `npm run coverage:merge` : fusion couverture Node + navigateur vers `coverage/merged`.
- `npm run coverage:reports` : génère `coverage/merged/lcov.info` et `coverage/merged/html/`.
- `npm run build:vite` : build production Vite → `dist/`.
- `npm run preview:vite` : prévisualiser build Vite localement.
- `npm run build:vite:coverage` : build Vite instrumenté (`VITE_COVERAGE=true`).
- `npm run e2e:vite` : build instrumenté + tests E2E Playwright contre preview Vite.

### Workflow couverture unifiée
```pwsh
# 1) Couverture Node
npm run coverage

# 2) Couverture navigateur (build instrumenté + E2E)
$env:VITE_COVERAGE='true'; npm run e2e:vite

# 3) Merge Node + navigateur
npm run coverage:merge

# 4) Rapports lcov + HTML
npm run coverage:reports
```