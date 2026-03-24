---
name: project-dev-dashboard
description: Dev Dashboard livré (2026-03-24) — kanban roadmap + feature flags + stats, branche feat/dev-dashboard-feature-flags
type: project
---

# Dev Dashboard + Feature Flags — état livré 2026-03-24

## Fonctionnalités

**Modal pleine largeur** accessible via bouton "Dev" dans TopBar (visible uniquement `import.meta.env.DEV`) et raccourci `Ctrl+Shift+D`.

3 vues :
- **Roadmap** : kanban 4 colonnes (✅ Livré / 🚧 En cours / 💡 Backlog / ⚠️ Problèmes), filtre par catégorie, ajout/suppression/notes de features
- **Feature Flags** : toggles live par catégorie, persistés localStorage, indicateur vert/gris
- **Stats** : progression globale (%), compteurs par statut + catégorie (barres), résumé flags

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/config/roadmapData.ts` | Types + données initiales (17 features, 5 flags) |
| `src/stores/featureFlagsStore.ts` | Zustand persist — clé `accesscity-dev-dashboard` |
| `src/hooks/useFeatureFlag.ts` | `useFeatureFlag('key')` → boolean |
| `src/components/modals/DevDashboardModal/` | 6 fichiers : index + RoadmapView + FeatureFlagsView + StatsView + KanbanColumn + FeatureCard |

## Branche

`feat/dev-dashboard-feature-flags` — commit `5ecec6c`

**Why:** Guillaume a besoin de suivre l'état du développement d'AccessCity Studio lui-même et de pouvoir activer/désactiver des features sans redémarrer.

**How to apply:** Pour brancher un flag sur un composant existant, ajouter `const isEnabled = useFeatureFlag('flagKey')` et conditionner le rendu. Les flags sont déjà définis dans `featureFlagsStore` ; ajouter les guards dans les composants progressivement.

## Features pré-remplies dans le dashboard

**Livré (7) :** filtres CRT, suppression de fond, narrateur Octopath, brush preview, refacto panneau Dialogue, renommage Style, TextSection 8→6

**En cours (2) :** style-panel-ergonomie, dev-dashboard lui-même

**Backlog (8) :** live preview keystroke (P0), undo/redo visible (P0), saved-state indicator (P1), HSL avatar (P1), alerte 80 mots (P1), jump-to-node (P2), pre-filter render (P2), effect-row compression (P2)
