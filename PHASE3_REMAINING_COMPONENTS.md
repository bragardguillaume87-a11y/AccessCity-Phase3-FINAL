# Phase 3: Composants Restants - Analyse

**Date**: 21 Décembre 2025
**Objectif**: Identifier et migrer les composants restants utilisant AppContext

---

## 📊 Composants Identifiés (22 fichiers)

### ✅ Déjà Migrés / Exclus (3)

| Fichier | Status | Raison |
|---------|--------|---------|
| `src/App.jsx` | ✅ Exclu | Provider AppContext (normal) |
| `src/components/panels/MainCanvas.jsx` | ✅ Migré | Déjà sur Zustand (Phase 1) |
| `src/components/EditorShell.jsx` | ⚠️ Partiel | Migré sauf undo/redo (Phase 4) |

**Note EditorShell**: Utilise encore `const { undo, redo, canUndo, canRedo } = useApp()` - Nécessite création undoRedoStore.js

---

## ❌ Fichiers Obsolètes (6 + duplicatas)

### Fichiers avec imports cassés

Ces fichiers importent depuis `"../contexts/AppContext"` qui n'existe pas et ne sont **PAS utilisés** dans l'app:

| Fichier | Import Cassé | Utilisé ? |
|---------|--------------|-----------|
| `src/components/LibraryContent.jsx` | ❌ `../contexts/AppContext` | Non |
| `src/components/StylesContent.jsx` | ❌ `../contexts/AppContext` | Non |
| `src/components/PropertiesContent.jsx` | ❌ `../contexts/AppContext` | Non |
| `src/components/utilities/LibraryContent.jsx` | ❌ `../contexts/AppContext` | Non |
| `src/components/utilities/StylesContent.jsx` | ❌ `../contexts/AppContext` | Non |

### Fichiers de test/brouillon

| Fichier | Raison |
|---------|--------|
| `src/components/ScenesPanel_zustand.jsx` | Brouillon de migration (obsolète) |

**Recommandation**: ⚠️ Supprimer ces 6 fichiers pour nettoyer le codebase

---

## 🔴 À Migrer - Priorité HAUTE (2 fichiers)

### Composants Simples (Read-only ou 1 méthode)

| # | Fichier | Utilisation useApp() | Complexité |
|---|---------|---------------------|------------|
| 1 | `src/components/PlayerPreview.jsx` | `{ characters }` | SIMPLE (read-only) |
| 2 | `src/components/ScenesList.jsx` | `{ addScene }` | SIMPLE (1 méthode) |

**Estimation migration**: 10 minutes total

---

## 🟡 À Migrer - Priorité MOYENNE (7 fichiers)

| # | Fichier | Description | Complexité Estimée |
|---|---------|-------------|-------------------|
| 3 | `src/components/PlayMode.jsx` | Player mode complet | MOYENNE |
| 4 | `src/components/ExportPanel.jsx` | Export JSON | MOYENNE |
| 5 | `src/components/ImportPanel.jsx` | Import JSON | MOYENNE |
| 6 | `src/components/CommandPalette.jsx` | Commande rapide (Ctrl+K) | MOYENNE |
| 7 | `src/components/KeyboardShortcuts.jsx` | Raccourcis clavier | SIMPLE |
| 8 | `src/components/AssetsLibraryPanel.jsx` | Bibliothèque assets | MOYENNE |
| 9 | `src/components/StudioShell.jsx` | Shell studio | COMPLEXE |

---

## 🟢 À Migrer - Priorité BASSE (4 fichiers)

| # | Fichier | Description | Note |
|---|---------|-------------|------|
| 10 | `src/components/panels/ExportPanel.jsx` | Duplicate ? | Vérifier vs ExportPanel.jsx |
| 11 | `src/hooks/useValidation.js` | Hook validation | Déjà autonome ? |
| 12 | `src/components/hooks/useCharacters.js` | Hook personnages | Déjà autonome ? |
| 13 | `src/components/tabs/characters/hooks/useCharacters.js` | Duplicate ? | Vérifier vs hooks/useCharacters.js |

**Note**: Les hooks peuvent déjà être autonomes (accès direct aux stores) - À vérifier

---

## 📝 Plan de Migration Phase 3

### Phase 3A: Analyse Complète ✅ (ce document)
- [x] Identifier tous les fichiers
- [x] Catégoriser (migrés/obsolètes/à migrer)
- [x] Prioriser par complexité

### Phase 3B: Migration Simple (2 fichiers)
1. **PlayerPreview.jsx**
   ```javascript
   // AVANT
   const { characters } = useApp();

   // APRÈS
   import { useCharactersStore } from '../stores/index.js';
   const characters = useCharactersStore(state => state.characters);
   ```

2. **ScenesList.jsx**
   ```javascript
   // AVANT
   const { addScene } = useApp();

   // APRÈS
   import { useScenesStore } from '../stores/index.js';
   const addScene = useScenesStore(state => state.addScene);
   ```

### Phase 3C: Migration Moyenne (7 fichiers)
- CommandPalette.jsx
- KeyboardShortcuts.jsx
- PlayMode.jsx
- ExportPanel.jsx
- ImportPanel.jsx
- AssetsLibraryPanel.jsx
- StudioShell.jsx

### Phase 3D: Nettoyage (6 fichiers obsolètes)
- Supprimer LibraryContent.jsx
- Supprimer StylesContent.jsx
- Supprimer PropertiesContent.jsx
- Supprimer utilities/LibraryContent.jsx
- Supprimer utilities/StylesContent.jsx
- Supprimer ScenesPanel_zustand.jsx

### Phase 3E: Tests Finaux
- Vérifier aucune régression
- Tester composants migrés
- Documenter changements

---

## 🎯 Stratégie Recommandée

### Option 1: Migration Complète (13 fichiers)
**Avantages**:
- Élimination totale de AppContext
- Architecture 100% Zustand
- Performance maximale

**Inconvénients**:
- Temps requis: ~2-3h
- Risque de régression

**Recommandation**: ✅ **Option recommandée** si l'objectif est une migration complète

### Option 2: Migration Priorité Haute Uniquement (2 fichiers)
**Avantages**:
- Rapide (10 minutes)
- Risque minimal
- Composants fréquemment utilisés

**Inconvénients**:
- AppContext reste en place
- Migration incomplète

**Recommandation**: ⚠️ Seulement si contrainte de temps forte

---

## 📊 Statistiques

| Catégorie | Nombre | % |
|-----------|--------|---|
| Déjà migrés/exclus | 3 | 14% |
| Obsolètes à supprimer | 6 | 27% |
| À migrer (Haute) | 2 | 9% |
| À migrer (Moyenne) | 7 | 32% |
| À migrer (Basse) | 4 | 18% |
| **TOTAL** | **22** | **100%** |

**Effort de migration restant**:
- Priorité Haute: ~10 min (2 fichiers)
- Priorité Moyenne: ~2h (7 fichiers)
- Priorité Basse: ~30 min (4 fichiers)
- **Total**: ~2h40

---

## ⚠️ Points d'Attention

### 1. EditorShell - Undo/Redo
```javascript
// src/components/EditorShell.jsx
const { undo, redo, canUndo, canRedo } = useApp(); // ⚠️ Encore AppContext
```

**Solution**: Créer `src/stores/undoRedoStore.js` avec middleware Zustand

### 2. Hooks useValidation et useCharacters

Ces hooks peuvent déjà être autonomes (accès direct aux stores). À vérifier avant migration.

### 3. Duplicatas Potentiels

- `ExportPanel.jsx` vs `panels/ExportPanel.jsx`
- `hooks/useCharacters.js` vs `tabs/characters/hooks/useCharacters.js`

**Action**: Vérifier si duplicatas ou fichiers différents

---

## 🚀 Prochaines Actions

1. ✅ Créer ce document d'analyse
2. ⏳ Migrer PlayerPreview.jsx et ScenesList.jsx (Priorité Haute)
3. ⏳ Décider: Migration Complète ou Partielle ?
4. ⏳ Exécuter Phase 3B/3C selon décision
5. ⏳ Nettoyer fichiers obsolètes (Phase 3D)
6. ⏳ Documenter dans MIGRATION_SESSION_SUMMARY.md

---

**Document créé automatiquement par Claude Code** 🤖
