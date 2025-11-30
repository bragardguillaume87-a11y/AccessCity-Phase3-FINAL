# AccessCity 5.0
Narrative scene editor for non-coders. Data-driven architecture.

## Quick Start
1. Installe les dépendances :
   ```pwsh
   npm install
   ```
2. Lance le serveur Vite :
   ```pwsh
   npm run dev
   ```
3. Accède à l’éditeur sur [http://localhost:5173](http://localhost:5173)
4. Modifie les scènes via l’UI ou le fichier `data/scenes.json`
5. Utilise les boutons d’export/import pour gérer tes projets

## Documentation
- `docs/PROJECT_MEMORY_SEED.md` - Vision & rules
- `docs/AccessCity_Agentic_Workflow.md` - Development workflow
- `docs/CHANGELOG.md` - Version history
- `docs/SUMMARY_AUTOMATION.md` - Conversation summary generator
- `docs/COVERAGE_ROADMAP.md` - Plan couverture de code complète (Node + navigateur)
- `docs/VITE_SETUP.md` - Guide setup Vite avec HMR (workflow dev moderne)

## Testing
```pwsh
npm test
```

## E2E Vite (React)
Pour exécuter les tests E2E sur l'app React/Vite :

1. Construisez le projet Vite instrumenté :
   ```pwsh
   npm run build:vite:coverage
   ```
2. Lancez le serveur Vite en mode preview :
   ```pwsh
   npm run preview:vite
   ```
3. Exécutez les tests Playwright :
   ```pwsh
   npm run e2e:vite
   ```

> Astuce : Le workflow Playwright (`playwright.config.vite.ts`) lance automatiquement le serveur Vite en mode preview avant les tests grâce à la section `webServer`. Vous pouvez donc simplement utiliser `npm run e2e:vite` pour tout automatiser.

## Scripts
- `npm run dev` : serveur Vite avec HMR sur port 5173 (workflow moderne)
- `npm test` : tests E2E Playwright
- `npm run e2e:vite` : build instrumenté + tests E2E Playwright contre preview Vite
- `npm run e2e:install` : installation navigateurs Playwright
- `npm run coverage` : couverture Node (texte + lcov)
- `npm run coverage:html` : rapport HTML couverture Node
- `npm run coverage:merge` : fusion couverture Node + navigateur vers `coverage/merged`
- `npm run coverage:reports` : génère `coverage/merged/lcov.info` et `coverage/merged/html/`
- `npm run build:vite` : build production Vite → `dist/`
- `npm run preview:vite` : prévisualiser build Vite localement
- `npm run build:vite:coverage` : build Vite instrumenté (`VITE_COVERAGE=true`)
- `npm run summary` : outil de génération de résumé de conversation

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