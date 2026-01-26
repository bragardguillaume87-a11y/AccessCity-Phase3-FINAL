# Plan de Refactoring - Système de Sélection

**Date**: 2026-01-25
**Objectif**: Résoudre les problèmes structurels du système de sélection (scene/dialogue/character) et améliorer la maintenabilité

---

## 1. PROBLÈMES IDENTIFIÉS

### 1.1 Problème Principal: useEffect en Cascade
**Localisation**: `EditorShell.tsx:88-110`

**Symptôme**: Le useEffect d'auto-sélection écrase la sélection manuelle de scène, forçant l'affichage de "Dialogue Properties" au lieu d'"Add Element".

**Cause racine**:
- Le useEffect lit `selectedElement` sans l'avoir dans ses dépendances (violation des règles React)
- Manquait un guard pour `selectedElement.type === 'scene'`
- Architecture basée sur des useEffect multiples qui se déclenchent en cascade

**Fix appliqué** (temporaire):
```typescript
// Ajout du guard manquant
if (selectedElement?.type === 'scene') {
  logger.debug('[EditorShell] Skipping auto-select - scene type selected (UnifiedPanel mode)');
  return;
}

// Ajout de selectedElement aux dépendances
}, [scenes, selectedSceneForEdit, selectedElement]);
```

**Limitation du fix**: C'est un patch qui corrige le symptôme mais pas le problème architectural sous-jacent.

---

### 1.2 Problèmes Structurels Détectés

#### A. Duplication de logique d'auto-sélection
**Impact**: Conflit entre EditorShell et MainCanvas

- **EditorShell.tsx:88-110**: Auto-sélectionne le premier dialogue
- **MainCanvas.tsx:112-145**: Également auto-sélectionne le premier dialogue

**Conséquence**: Deux sources de vérité pour la même logique → risque de désynchronisation

#### B. Dépendances useEffect incomplètes
**Localisation**: Multiples composants

**Pattern détecté**:
```typescript
useEffect(() => {
  // Lit selectedElement
  if (selectedElement?.type === 'dialogue') { ... }
}, [scenes, selectedSceneForEdit]); // ❌ selectedElement manquant
```

**Risque**: Stale closure - l'effet lit une valeur périmée de selectedElement

#### C. État distribué sans source unique de vérité
**Impact**: Difficile de savoir qui contrôle quoi

- `selectedSceneForEdit` dans UIStore (Zustand)
- `selectedElement` dans EditorShell (useState local)
- Logique de sélection éparpillée entre EditorShell, MainCanvas, LeftPanel

#### D. Props drilling excessif
**Localisation**: EditorShell → MainCanvas → Composants enfants

**Callbacks passés sur 3+ niveaux**:
- `onSelectDialogue`
- `onOpenModal`
- `handleAddCharacterConfirm`

**Conséquence**: Difficile à maintenir, risque de bugs lors de refactoring

---

## 2. ARCHITECTURE ACTUELLE (État des lieux)

### 2.1 Flux de Sélection

```
User Click Scene
    ↓
LeftPanel.onSceneClick
    ↓
EditorShell.handleSceneSelect
    ↓
setSelectedSceneForEdit(sceneId)  [Zustand]
setSelectedElement({ type: 'scene', id })  [Local State]
    ↓
useEffect [scenes, selectedSceneForEdit, selectedElement] se déclenche
    ↓
Guards vérifient:
  - Scene a des dialogues? → OUI
  - selectedElement.type === 'scene'? → OUI (GUARD AJOUTÉ) → RETURN
  - [ANCIEN BUG] Pas de guard → setSelectedElement({ type: 'dialogue' })
    ↓
PropertiesPanel lit selectedElement
    ↓
Si type === 'scene' → UnifiedPanel ("Add Element")
Si type === 'dialogue' → DialoguePropertiesForm
```

### 2.2 Points de Friction

1. **Batching React**: `setSelectedSceneForEdit` + `setSelectedElement` batchés → useEffect voit état intermédiaire
2. **Double auto-sélection**: EditorShell ET MainCanvas ont leur logique
3. **Pas de machine à états**: Logique éparpillée dans des conditions if/else

---

## 3. RECOMMANDATIONS

### 3.1 Court Terme (Quick Wins - 1-2h)

#### A. ✅ FAIT: Corriger le guard dans EditorShell
**Status**: Appliqué
**Impact**: Résout le bug immédiat

#### B. Nettoyer les dépendances useEffect
**Localisation**: `MainCanvas.tsx:112-145`

**Action**: Vérifier que toutes les dépendances sont correctes
```typescript
useEffect(() => {
  // ...
}, [
  selectedScene?.id,
  selectedScene?.dialogues?.length,
  selectedElement?.type,  // ← Vérifier si présent
  selectedElementSceneId,
  onSelectDialogue
]);
```

#### C. Ajouter des logs de debug
**Objectif**: Tracer le flux de sélection pour diagnostiquer futurs bugs

```typescript
logger.debug('[Component] Selection changed', {
  type: selectedElement?.type,
  sceneId: selectedElement?.sceneId,
  source: 'handleSceneSelect'
});
```

---

### 3.2 Moyen Terme (Refactoring Partiel - 1-2 jours)

#### A. Centraliser la logique de sélection dans un hook
**Nouveau fichier**: `src/hooks/useSelection.ts`

**API proposée**:
```typescript
const {
  selectedElement,
  selectScene,
  selectDialogue,
  selectCharacter,
  clearSelection
} = useSelection();
```

**Avantages**:
- Single source of truth
- Logique testable isolément
- Pas de props drilling
- Facile à debugger

#### B. Éliminer la duplication d'auto-sélection
**Action**: Choisir UN endroit pour l'auto-sélection

**Option 1** (Recommandée): Hook centralisé
```typescript
// Dans useSelection.ts
useEffect(() => {
  if (autoSelectEnabled && selectedScene?.dialogues?.length && !selectedElement) {
    selectDialogue(selectedScene.id, 0);
  }
}, [selectedScene, selectedElement]);
```

**Option 2**: Garder dans EditorShell (actuel), supprimer de MainCanvas

#### C. Utiliser un State Machine (XState ou Zustand FSM)
**Objectif**: Rendre les transitions d'état explicites et prévisibles

**États possibles**:
- `NO_SELECTION`
- `SCENE_SELECTED`
- `DIALOGUE_SELECTED`
- `CHARACTER_SELECTED`

**Transitions**:
- `SELECT_SCENE` → `SCENE_SELECTED`
- `SELECT_DIALOGUE` → `DIALOGUE_SELECTED`
- `AUTO_SELECT` → `DIALOGUE_SELECTED` (avec guards)

**Avantages**:
- Impossible d'avoir un état invalide
- Transitions explicites et documentées
- Facile à visualiser et debugger
- Guards intégrés dans la machine

---

### 3.3 Long Terme (Refactoring Complet - 1 semaine)

#### A. Migrer vers Zustand pour TOUTE la sélection
**Objectif**: Éliminer le useState local dans EditorShell

**Actions**:
1. Ajouter `selectedElement` dans UIStore (Zustand)
2. Créer des actions `selectScene`, `selectDialogue`, etc.
3. Retirer le useState local
4. Utiliser les selectors Zustand dans tous les composants

**Bénéfices**:
- Pas de props drilling
- State persiste entre remounts
- DevTools Zustand pour debug
- Performance (selectors mémorisés)

#### B. Implémenter le Pattern Command pour Undo/Redo de sélection
**Objectif**: Permettre Ctrl+Z pour revenir à la sélection précédente

**Structure**:
```typescript
interface SelectionCommand {
  execute(): void;
  undo(): void;
}

class SelectSceneCommand implements SelectionCommand {
  constructor(private sceneId: string) {}
  execute() { /* ... */ }
  undo() { /* ... */ }
}
```

#### C. Créer un composant SelectionProvider (Context)
**Alternative à Zustand** si on veut garder la logique locale

```typescript
<SelectionProvider>
  <EditorShell />
</SelectionProvider>
```

**API**:
```typescript
const { selectedElement, selectScene, ... } = useSelectionContext();
```

---

## 4. PLAN D'ACTION RECOMMANDÉ

### Phase 1: Stabilisation (URGENT - Aujourd'hui)
- ✅ **FAIT**: Corriger le guard dans EditorShell
- ⏳ Tester que la sélection de scène fonctionne maintenant
- ⏳ Vérifier tous les cas d'usage (scène → dialogue → scène)

### Phase 2: Nettoyage (Cette semaine)
- [ ] Ajouter logs de debug dans tous les handlers de sélection
- [ ] Nettoyer les dépendances useEffect
- [ ] Documenter le flux de sélection actuel (diagramme)

### Phase 3: Refactoring (Semaine prochaine)
- [ ] Créer le hook `useSelection` centralisé
- [ ] Migrer EditorShell pour utiliser le hook
- [ ] Éliminer la duplication d'auto-sélection
- [ ] Tests unitaires pour le hook

### Phase 4: Architecture (Dans 2 semaines)
- [ ] Évaluer XState vs Zustand FSM
- [ ] Prototyper la state machine
- [ ] Migrer progressivement vers la nouvelle architecture
- [ ] Mettre à jour la documentation

---

## 5. RISQUES ET MITIGATIONS

### 5.1 Risques du Fix Actuel
**Risque**: Le guard `selectedElement?.type === 'scene'` pourrait bloquer certains flows légitimes

**Mitigation**:
- Tester tous les chemins de navigation
- Ajouter des tests E2E pour la sélection
- Logs de debug pour tracer le comportement

### 5.2 Risques du Refactoring
**Risque**: Casser des flows existants en refactorant

**Mitigation**:
- Refactoring incrémental (par étapes)
- Tests de régression avant chaque phase
- Feature flags pour rollback rapide

---

## 6. MÉTRIQUES DE SUCCÈS

### Critères de validation:
- ✅ Sélection de scène affiche "Add Element" (pas "Dialogue Properties")
- ✅ Navigation scène → dialogue → scène fonctionne sans bug
- ✅ Auto-sélection du premier dialogue fonctionne quand approprié
- ✅ Pas de boucles infinies de re-renders
- ✅ Logs clairs pour tracer le flux de sélection

### Améliorations qualité visées:
- Réduire le nombre de useEffect de 5+ à 1-2
- Éliminer 100% du props drilling pour la sélection
- Couverture tests unitaires > 80% pour la logique de sélection
- Documentation complète du flux de sélection

---

## 7. ANNEXE: CODE LEGACY DÉTECTÉ

### A. Commentaires suspects
```typescript
// EditorShell.tsx:165
// Clear to null - auto-select in MainCanvas will pick up first dialogue
setSelectedElement(null); // ← Compter sur un side-effect ailleurs = fragile
```

### B. Guards incomplets
```typescript
// MainCanvas.tsx:120
if (selectedElement?.type === 'scene') {
  logger.debug('[MainCanvas] Skipping auto-select...');
  return; // ← Ce guard existe déjà! Pourquoi le bug?
}
```
**Explication**: Ce guard est dans MainCanvas mais le bug était dans EditorShell → Duplication de logique!

### C. useState vs Zustand inconsistant
- `selectedSceneForEdit` → Zustand ✅
- `selectedElement` → useState local ❌
- **Pourquoi?** Pas de raison claire, crée de la confusion

---

## 8. RESSOURCES POUR REFACTORING

### Documentation recommandée:
- [React useEffect Rules](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- [XState - State Machines](https://stately.ai/docs/xstate)
- [Zustand FSM Middleware](https://github.com/pmndrs/zustand#middleware)
- [Command Pattern](https://refactoring.guru/design-patterns/command)

### Exemples de projets similaires:
- **GDevelop** (éditeur de jeux): Architecture basée sur Redux + Command pattern
- **Excalidraw** (éditeur de diagrammes): Zustand + Actions centralisées
- **VS Code** (éditeur de code): State machine pour la sélection

---

## CONCLUSION

**État actuel**: Fix appliqué, bug immédiat résolu ✅
**Prochaine étape recommandée**: Phase 2 (Nettoyage) avant de commencer Phase 3
**Priorité**: MOYENNE (le fix actuel est stable mais architecture fragile)

**Décision à prendre**:
1. On continue avec des patchs ponctuels? → Risque de dette technique croissante
2. On investit 1-2 jours dans le refactoring? → Architecture plus solide à long terme

**Recommandation**: Option 2 - Le refactoring est justifié vu la fréquence des bugs dans cette zone.
