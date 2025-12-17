# Guide de démarrage - AccessCity Studio

> **Niveau** : 2 (Guide pratique)  
> **Statut** : ✅ À jour  
> **Dernière mise à jour** : 17 décembre 2024  

## 1. Prérequis

- Node.js 18+ installé
- npm ou pnpm
- Git installé et configuré
- Navigateur moderne (Chrome, Firefox, Edge)
- Éditeur recommandé : VS Code (+ extensions React/ESLint)

## 2. Récupérer le projet

git clone https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL.git
cd AccessCity-Phase3-FINAL
git checkout mvp-properties

## 3. Installer les dépendances

npm install

ou
pnpm install

## 4. Lancer le serveur de développement

npm run dev

- Par défaut, l’application est disponible sur : `http://localhost:5173`
- Si le port est déjà utilisé, Vite propose un autre port dans le terminal.

## 5. Structure de base du projet

- `src/` : Code source React
- `src/components/` : Composants UI (dont `StudioShell.jsx`)
- `src/hooks/` : Hooks personnalisés
- `src/context/` ou `AppContext.jsx` : Gestion d’état global
- `docs/` : Documentation (START_HERE, guides, références)
- `docs/reference/` : Références techniques
- `docs/legacy/` : Ancienne documentation archivée

Pour une vue d’ensemble, commencer par :  
👉 `[START_HERE.md](../START_HERE.md)`

## 6. Commandes utiles

Lancer les tests unitaires
npm test

Vérifier le linting
npm run lint

Build de production
npm run build

## 7. Où continuer après ce guide ?

- Comprendre l’architecture : `[ARCHITECTURE_DECISION.md](ARCHITECTURE_DECISION.md)`
- Contribuer au code : `[CONTRIBUTING.md](../CONTRIBUTING.md)`
- Voir le plan de refactoring : `[REFACTORING_PLAN.md](REFACTORING_PLAN.md)`
