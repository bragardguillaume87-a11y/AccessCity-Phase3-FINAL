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

## Testing
```bash
npm test
```

## Scripts

- `npm run dev` : serveur statique (Python http.server) sur port 8000.
- `npm test` : tests d'intégration Node.
- `npm run e2e` : suite Playwright (E2E).
- `npm run e2e:install` : installation navigateurs Playwright.
- `npm run coverage` : couverture Node (texte + lcov).
- `npm run coverage:html` : rapport HTML couverture Node.
- `npm run coverage:merge` : fusion couverture Node + navigateur vers `coverage/merged`.