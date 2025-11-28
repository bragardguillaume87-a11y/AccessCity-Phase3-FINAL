# Feuille de route : Couverture de code complète

## État actuel

### ✅ Couverture Node (tests d'intégration)
- **Outil** : `c8` (basé sur V8 native coverage)
- **Commandes** :
  - `npm run coverage` : rapport texte + lcov
  - `npm run coverage:html` : rapport HTML
- **Fichiers couverts** : modules `core/`, `test/`
- **Taux actuel** : ~85% lignes, ~72% branches

### ✅ Infrastructure de fusion
- **Script** : `tools/merge_coverage.cjs`
- **Librairies** : `istanbul-lib-coverage`, `istanbul-lib-report`, `istanbul-reports`
- **Commande** : `npm run coverage:merge`
- **Sortie** : `coverage/merged/` (lcov.info + HTML + JSON)
- **CI** : workflow GitHub Actions exécute merge après E2E et upload artefacts

### ✅ Hook navigateur Playwright
- **Fichier** : `e2e/coverage-hook.ts`
- **Mécanisme** : `test.afterEach` récupère `window.__coverage__` et écrit JSON dans `coverage/browser/`
- **État** : Prêt à collecter dès que code front instrumenté

### ⚠️ Placeholder instrumentation navigateur
- **Fichier** : `index-react.html` (paramètre `?covPlaceholder=1`)
- **Objet** : Crée `window.__coverage__` factice pour valider chaîne collecte
- **Limitation** : Aucune vraie couverture, structure minimale uniquement
- **Usage** : Démonstration et tests de la mécanique fusion

---

## Prochaines étapes : Instrumentation réelle

### 1️⃣ Choix du bundler

**Besoin** : Build pipeline pour instrumenter code front (actuellement React/Babel via CDN)

| Bundler  | Avantages | Inconvénients | Recommandation |
|----------|-----------|---------------|----------------|
| **Vite** | ⚡ Démarrage ultra rapide<br>🔌 Plugins simples (vite-plugin-istanbul)<br>📦 HMR natif<br>🎯 Excellent support React + TypeScript | Jeune écosystème (mais mature) | ⭐ **Recommandé** |
| **Webpack** | 🏆 Écosystème le plus mature<br>🔧 Contrôle total config<br>📚 Documentation extensive | 🐢 Démarrage lent<br>📝 Config verbeuse<br>🧩 Complexité élevée | Overkill pour ce projet |
| **esbuild** | 🚀 Build ultra rapide<br>📦 Simple, léger | 🔌 Moins de plugins<br>⚠️ Instrumentation manuelle nécessaire | Non prioritaire |

**Décision recommandée** : Vite

**Raisons** :
- Compatibilité native Tailwind via PostCSS
- Plugin instrumentation clé en main : `vite-plugin-istanbul`
- Migration progressive possible (garder `index-react.html` en parallèle)
- Maintenance future simplifiée

---

### 2️⃣ Migration vers Vite

#### Phase A : Installation
```bash
npm install --save-dev vite @vitejs/plugin-react vite-plugin-istanbul
```

#### Phase B : Configuration `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  plugins: [
    react(),
    process.env.COVERAGE === '1' && istanbul({
      include: 'core/**/*.js',
      exclude: ['node_modules', 'test', 'e2e'],
      requireEnv: false,
    })
  ].filter(Boolean),
  server: {
    port: 8000,
  },
});
```

#### Phase C : Réorganisation fichiers
```
src/
  ├── main.jsx          // Point d'entrée (import React via npm)
  ├── index.html        // Template HTML simplifié
  └── core/             // Modules métier (inchangés)
```

#### Phase D : Scripts package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:cov": "COVERAGE=1 vite build",
    "preview": "vite preview"
  }
}
```

---

### 3️⃣ Activation couverture navigateur

#### Modification Playwright config
```typescript
// playwright.config.ts
webServer: {
  command: process.env.COVERAGE ? 'npm run build:cov && npm run preview' : 'npm run dev',
  port: 8000,
  reuseExistingServer: !process.env.CI,
}
```

#### Workflow CI mis à jour
```yaml
- name: Build instrumented version (for E2E coverage)
  run: npm run build:cov

- name: Run E2E tests (Playwright)
  env:
    COVERAGE: 1
  run: npm run e2e -- --reporter=list
```

---

### 4️⃣ Validation du pipeline complet

**Étapes de test** :
1. `npm run build:cov` → Vérifie `dist/` contient code instrumenté
2. Ouvrir DevTools navigateur → Console doit montrer `window.__coverage__` après interaction
3. `npm run e2e` → Vérifie `coverage/browser/*.json` créés
4. `npm run coverage:merge` → Vérifie `coverage/merged/` contient données Node + navigateur
5. Inspecter `coverage/merged/index.html` → Taux global cohérent

**Indicateurs de succès** :
- ✅ Fichiers `core/*.js` apparaissent avec couverture navigateur
- ✅ Taux global augmente vs Node seul
- ✅ Branches non testées identifiées visuellement (HTML report)

---

## Checklist d'implémentation

- [ ] Installer Vite + plugins (`@vitejs/plugin-react`, `vite-plugin-istanbul`)
- [ ] Créer `vite.config.js` avec condition `process.env.COVERAGE`
- [ ] Migrer React de CDN vers npm (`react`, `react-dom`)
- [ ] Créer `src/main.jsx` point d'entrée
- [ ] Adapter `index.html` pour Vite (supprimer CDN, ajouter `<script type="module" src="/src/main.jsx">`)
- [ ] Tester `npm run dev` (mode développement sans instrumentation)
- [ ] Tester `npm run build:cov` (vérifier `__coverage__` présent dans bundle)
- [ ] Modifier `playwright.config.ts` pour servir version build en mode coverage
- [ ] Mettre à jour CI workflow pour build instrumenté avant E2E
- [ ] Exécuter pipeline complet et vérifier artefact `coverage-merged`
- [ ] Documenter commandes dans `README.md`
- [ ] Supprimer `?covPlaceholder=1` de `index-react.html` (obsolète)

---

## Références techniques

### Istanbul + Babel
- [babel-plugin-istanbul](https://github.com/istanbuljs/babel-plugin-istanbul) - Plugin Babel (alternative à Vite plugin)
- [Istanbul CLI](https://istanbul.js.org/) - Documentation officielle

### Vite
- [vite-plugin-istanbul](https://github.com/ifaxity/vite-plugin-istanbul) - Plugin instrumenteur
- [Vite Guide](https://vitejs.dev/guide/) - Documentation officielle

### Playwright
- [Code Coverage](https://playwright.dev/docs/api/class-coverage) - API native Playwright (Chromium uniquement, moins flexible)

---

## Notes de migration

### Risques identifiés
- **Breaking change** : Passage CDN → npm nécessite `package.json` étendu (React, ReactDOM)
- **Compatibilité** : Tailwind CDN → PostCSS (nécessite config `tailwind.config.js` + `postcss.config.js`)
- **Backward compatibility** : Garder `index-react.html` original en parallèle pendant transition

### Stratégie de déploiement
1. **Phase 1** : Vite en parallèle (nouveau point d'entrée `index-vite.html`)
2. **Phase 2** : Migration progressive tests E2E vers version Vite
3. **Phase 3** : Validation complète → Remplacement `index-react.html`
4. **Phase 4** : Nettoyage (suppression anciennes références CDN)

### Maintenance future
- **CI** : Surveiller taille artefacts (bundle instrumenté + non instrumenté)
- **Performance** : Désactiver instrumentation en prod (variable d'environnement)
- **Évolution** : Migrer vers TypeScript natif (Vite supporte `.tsx` nativement)

---

## Questions fréquentes

**Q : Pourquoi ne pas utiliser l'API Coverage native de Playwright ?**  
R : Limitée à Chromium, format propriétaire, moins flexible pour fusion multi-sources.

**Q : Peut-on instrumenter sans bundler ?**  
R : Techniquement oui (Babel CLI + scripts manuels), mais complexité maintenance élevée.

**Q : Impact performance du code instrumenté ?**  
R : ~10-20% ralentissement runtime, taille bundle +30-50%. **Ne jamais déployer en production.**

**Q : Alternative à Istanbul ?**  
R : Aucune aussi mature pour JS/TS. C8 parfait pour Node, Istanbul reste référence navigateur.

---

## Auteur & Historique
- **Créé** : 28 novembre 2025
- **Contexte** : Post-implémentation infrastructure fusion (c8 + Istanbul)
- **Objectif** : Documenter chemin vers couverture complète multi-sources
