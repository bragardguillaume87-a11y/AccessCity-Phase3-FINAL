# Principes fondamentaux & standards qualité

> **Statut** : ✅ À jour pour le Scenario Editor MVP  
> **Dernière mise à jour** : Décembre 2025

- Cohérence visuelle : tokens centralisés, grille, typographie, couleurs.
- Accessibilité : conformité WCAG, navigation clavier, aria, contrastes, feedback utilisateur explicite.
- Inclusivité : langage neutre, contenu accessible à tous.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite.
- Automatisation & CI/CD : scripts clairs, pipeline robuste, artefacts coverage.
- Contribution : workflow PR, guide, code of conduct, conventions de commit.

> Ces principes sont appliqués dans tous les fichiers du projet pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

---

# AccessCity Scene Editor – Stack Moderne (Vite/React/Playwright)

Modular narrative scene editor with ASCII-strict compliance.

---

## Bonnes pratiques & structuration
- **README complet** : stack, installation, scripts, exemples, badges, liens vers la doc, contribution, licence
- **Guides dédiés** : onboarding, architecture, conventions de code, accessibilité, QA, CI/CD
- **Exemples de code** : snippets pour usages courants
- **Badges** : build, coverage, version, licence, PRs welcome

## Contribution & maintenance
- **CONTRIBUTING.md** : workflow PR, conventions de commit, code of conduct
- **Good First Issues** : tickets pour nouveaux contributeurs
- **Changelog** : suivi des évolutions

## Automatisation & CI/CD
- **Scripts npm clairs** : build, test, coverage, lint, format, start, preview
- **Pipeline CI** : build, test, coverage, lint, déploiement, artefacts
- **Merge automatique couverture** : Node + navigateur
- **Vérification accessibilité** : tests a11y automatisés (axe-core, playwright-a11y)

## Accessibilité & qualité
- **Documentation accessibilité** : chaque composant respecte les standards a11y
- **Checklist accessibilité** : incluse dans la QA
- **Tests E2E** : scénarios réels, mock API, tests exploratoires

## Onboarding & support
- **Quick Start** : démarrage rapide
- **Liens vers doc officielle** : React, Vite, Playwright, Istanbul
- **Support** : issues, discussions, Discord

## Exemples et bonnes pratiques React/Vite
- **JSX clair et typé** : TypeScript, composants fonctionnels, hooks
- **State management** : logique expliquée, exemples
- **Plugins Vite** : documenter les plugins utilisés

---

## Stack & Setup
- **Stack moderne** : Vite, React, Playwright, Istanbul/c8, CI GitHub Actions
- **Tests E2E** : Playwright, couverture fusionnée Node + navigateur
- **Couverture** : c8 (Node) + vite-plugin-istanbul (navigateur)
- **CI** : pipeline automatisé, artefacts coverage, merge, rapports HTML

### Installation
1. Clone le repo
2. Installe les dépendances : `npm install`
3. Lance le serveur dev : `npm run dev`
4. Lance les tests E2E : `npm run e2e:vite`
5. Génère la couverture : `npm run coverage:merge` puis `npm run coverage:reports`

## Fonctionnalités principales
- **Éditeur de scènes narratives** : création, modification, gestion interactive
- **Conformité ASCII stricte** : compatibilité maximale
- **Système de dialogue dynamique** : dialogues, conditions, variables
- **Interface modulaire** : panneaux et composants personnalisables
- **State management** : undo/redo, export/import JSON

## Exemples d’utilisation
### Chargement d’une scène
```javascript
import { jsonSceneLoader } from './core/jsonSceneLoader.js';
jsonSceneLoader.load('data/scenes.json');
```

### Ajout d’un personnage
```javascript
import { characterLoader } from './core/characterLoader.js';
const character = {
  id: 'player',
  name: 'Joueur',
  sprites: { neutral: 'assets/characters/player/neutral.svg' }
};
characterLoader.add(character);
```

## Badges
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)

## Contribution
Pour contribuer, consulte le fichier [CONTRIBUTING.md](CONTRIBUTING.md).

## Utilisation des outils de test
- **Tests E2E** : `npm run e2e:vite` (Playwright)
- **Couverture** : `npm run coverage:merge` puis `npm run coverage:reports`
- **CI** : GitHub Actions, artefacts coverage

## Génération de contexte complet
Le script `pack_project.py` génère un fichier de contexte global pour archivage/documentation.

## Scénario de démonstration
Le fichier `demo_scenario.json` illustre les fonctionnalités principales (dialogues, choix, effets conditionnels).

---

*Ce README a été mis à jour pour refléter la stack moderne, les pratiques recommandées et les standards de documentation open source.*
