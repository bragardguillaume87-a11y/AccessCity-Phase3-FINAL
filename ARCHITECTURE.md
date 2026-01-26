# Architecture Modulaire - AccessCity Editor

**Date:** 2026-01-25
**Statut:** ✅ **Architecture Clean & Professionnelle**

---

## 🏗️ Principes Architecturaux

Cette application suit les principes **SOLID** et **Clean Architecture** pour maximiser:
- **Maintenabilité**: Code facile à modifier
- **Testabilité**: Logique isolée et testable
- **Scalabilité**: Architecture qui peut grandir
- **Modularité**: Composants indépendants et réutilisables

---

## 📐 Structure en Couches (Layered Architecture)

```
┌─────────────────────────────────────────┐
│   PRESENTATION LAYER (Components)      │
│   - EditorShell.tsx                    │
│   - Renders JSX only                   │
│   - Delegates to Business Logic        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│   BUSINESS LOGIC LAYER (Hooks)         │
│   - useEditorLogic.ts                  │
│   - Handles all editor logic           │
│   - Coordinates between layers         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│   FACADE LAYER (Simplified API)        │
│   - EditorFacade.ts                    │
│   - Unified interface to subsystems    │
│   - Hides complexity                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│   DATA LAYER (Stores & State)          │
│   - SelectionStore (Zustand)           │
│   - ScenesStore (Zustand)              │
│   - CharactersStore (Zustand)          │
│   - UIStore (Zustand)                  │
└─────────────────────────────────────────┘
```

---

## 📁 Structure des Fichiers

### Components (Presentation Layer)
```
src/components/
  ├── EditorShell.tsx           # Main editor container (PRESENTATION ONLY)
  ├── panels/
  │   ├── LeftPanel.tsx         # Explorer/Scenes tree
  │   ├── MainCanvas.tsx        # Visual scene editor
  │   └── PropertiesPanel.tsx   # Properties inspector
  └── modals/
      ├── CharactersModal.tsx
      └── AssetsLibraryModal.tsx
```

**Responsabilité:** Affichage uniquement (JSX). Aucune logique métier.

### Hooks (Business Logic Layer)
```
src/hooks/
  ├── useEditorLogic.ts         # 🆕 Main business logic hook
  ├── useSelection.ts           # Selection state wrapper
  ├── useUndoRedo.ts            # Undo/Redo functionality
  └── useValidation.ts          # Validation logic
```

**Responsabilité:** Toute la logique métier. Coordination entre couches.

### Facades (Facade Layer)
```
src/facades/
  ├── EditorFacade.ts           # Unified API for editor operations
  └── index.ts
```

**Responsabilité:** API simplifiée pour opérations complexes multi-stores.

### Stores (Data Layer)
```
src/stores/
  ├── selectionStore.ts         # Selection state (Zustand)
  ├── scenesStore.ts            # Scenes data (Zustand)
  ├── charactersStore.ts        # Characters data (Zustand)
  └── uiStore.ts                # UI state (Zustand)
```

**Responsabilité:** État global de l'application.

### Factories (Creation Layer)
```
src/factories/
  ├── DialogueFactory.ts        # Dialogue creation
  ├── SceneFactory.ts           # Scene creation
  └── index.ts
```

**Responsabilité:** Création d'objets avec valeurs par défaut cohérentes.

### Builders (Construction Layer)
```
src/builders/
  ├── SceneBuilder.ts           # Fluent API for scene construction
  └── index.ts
```

**Responsabilité:** Construction complexe d'objets étape par étape.

---

## 🔄 Flux de Données (Data Flow)

### Exemple: User clicks on scene in Explorer

```
1. USER ACTION
   ↓
   User clicks scene in LeftPanel
   ↓
2. PRESENTATION LAYER (EditorShell.tsx)
   ↓
   onSceneSelect={editorLogic.handleSceneSelect}
   ↓
3. BUSINESS LOGIC LAYER (useEditorLogic.ts)
   ↓
   handleSceneSelect(sceneId) {
     setSelectedSceneForEdit(sceneId)  // Update UI state
     editor.selectScene(sceneId)        // Delegate to Facade
   }
   ↓
4. FACADE LAYER (EditorFacade.ts)
   ↓
   selectScene(sceneId) {
     selection.selectScene(sceneId)     // Delegate to Store
   }
   ↓
5. DATA LAYER (SelectionStore.ts)
   ↓
   selectScene(sceneId) {
     set({ selectedElement: { type: 'scene', id } })
   }
   ↓
6. RE-RENDER
   ↓
   Components re-render with new selection
```

**Avantages:**
- ✅ Séparation claire des responsabilités
- ✅ Facile à tester chaque couche
- ✅ Facile à tracer le flux
- ✅ Aucun couplage fort

---

## 🎯 Design Patterns Utilisés

### 1. **Facade Pattern** (EditorFacade)
**Problème:** Complexité de multiples stores (scenes, characters, selection)
**Solution:** API unifiée qui masque la complexité

```typescript
// Au lieu de:
scenesStore.addScene();
scenesStore.updateScene(id, { title });
selection.selectScene(id);

// On utilise:
editor.createScene('Title');
editor.selectScene(id);
```

### 2. **Factory Pattern** (DialogueFactory, SceneFactory)
**Problème:** Création d'objets complexes avec valeurs par défaut
**Solution:** Méthodes statiques de création cohérente

```typescript
// Au lieu de:
const dialogue = { id: generateId(), speaker: 'X', text: 'Y', choices: [] };

// On utilise:
const dialogue = DialogueFactory.createText('Speaker', 'Text');
```

### 3. **Builder Pattern** (SceneBuilder)
**Problème:** Construction complexe d'objets étape par étape
**Solution:** API fluide chainable

```typescript
const scene = new SceneBuilder('Title')
  .withBackground('/bg.jpg')
  .addCharacter(charId, position, size, 'happy')
  .addDialogue('Speaker', 'Text')
  .build();
```

### 4. **State Management** (Zustand Stores)
**Problème:** État global partagé entre composants
**Solution:** Stores Zustand avec middlewares (devtools, immer)

### 5. **Custom Hooks Pattern** (useEditorLogic)
**Problème:** Logique métier mélangée avec présentation
**Solution:** Extraction de la logique dans des hooks réutilisables

---

## ✅ Bonnes Pratiques Appliquées

### 1. Single Responsibility Principle (SRP)
- ✅ EditorShell = Présentation uniquement
- ✅ useEditorLogic = Logique métier uniquement
- ✅ EditorFacade = Coordination uniquement
- ✅ Stores = État uniquement

### 2. Dependency Inversion Principle (DIP)
- ✅ EditorShell dépend de useEditorLogic (abstraction)
- ✅ useEditorLogic dépend de EditorFacade (abstraction)
- ✅ Pas de dépendance directe sur des implémentations concrètes

### 3. Open/Closed Principle (OCP)
- ✅ Extensible: On peut ajouter de nouvelles opérations sans modifier EditorShell
- ✅ Fermé: EditorShell n'a pas besoin d'être modifié

### 4. Interface Segregation Principle (ISP)
- ✅ EditorFacade expose seulement les méthodes nécessaires
- ✅ useEditorLogic expose seulement les handlers nécessaires

### 5. Don't Repeat Yourself (DRY)
- ✅ Logique centralisée (pas de duplication)
- ✅ Factories pour création cohérente

---

## 🧪 Testabilité

### Tests de Logique Métier (useEditorLogic)
```typescript
describe('useEditorLogic', () => {
  it('should select scene on handleSceneSelect', () => {
    const { result } = renderHook(() => useEditorLogic(config));

    act(() => {
      result.current.handleSceneSelect('scene-1');
    });

    expect(mockSetSelectedSceneForEdit).toHaveBeenCalledWith('scene-1');
    expect(mockEditor.selectScene).toHaveBeenCalledWith('scene-1');
  });
});
```

### Tests de Facade (EditorFacade)
```typescript
describe('EditorFacade', () => {
  it('should create scene with auto-dialogue selection', () => {
    const { result } = renderHook(() => useEditorFacade());

    act(() => {
      result.current.selectSceneWithAutoDialogue('scene-1');
    });

    // Verify dialogue was auto-selected
  });
});
```

---

## 📊 Métriques de Qualité

### Couplage (Coupling)
- **Avant refactoring:** EditorShell couplé à 4 stores + logique métier
- **Après refactoring:** EditorShell couplé seulement à useEditorLogic ✅

### Cohésion (Cohesion)
- **Avant:** EditorShell = 400+ lignes (présentation + logique)
- **Après:** EditorShell = ~250 lignes (présentation pure) ✅
- **useEditorLogic:** ~150 lignes (logique pure) ✅

### Complexité Cyclomatique
- **Avant:** EditorShell complexité ~15
- **Après:** EditorShell complexité ~5 ✅

---

## 🚀 Avantages de cette Architecture

### Pour les Développeurs
1. **Facile à comprendre**: Chaque fichier a une responsabilité claire
2. **Facile à modifier**: Changements isolés dans une couche
3. **Facile à tester**: Logique isolée et mockable
4. **Facile à débugger**: Flux de données clair

### Pour le Projet
1. **Scalable**: Peut grandir sans devenir ingérable
2. **Maintenable**: Modifications sans effets de bord
3. **Réutilisable**: Hooks et facades réutilisables
4. **Professionnel**: Suit les standards de l'industrie

---

## 📝 Guide d'Utilisation

### Ajouter une Nouvelle Fonctionnalité

**1. Ajouter la logique dans EditorFacade (si multi-stores)**
```typescript
// src/facades/EditorFacade.ts
const newOperation = useCallback(() => {
  // Coordonne plusieurs stores
  scenesStore.doSomething();
  selectionStore.doSomethingElse();
}, [scenesStore, selectionStore]);
```

**2. Ajouter le handler dans useEditorLogic**
```typescript
// src/hooks/useEditorLogic.ts
const handleNewAction = useCallback(() => {
  logger.debug('[useEditorLogic] New action');
  editor.newOperation();
}, [editor]);

return {
  // ...
  handleNewAction,
};
```

**3. Utiliser dans EditorShell**
```typescript
// src/components/EditorShell.tsx
<NewComponent onAction={editorLogic.handleNewAction} />
```

---

## 🎓 Références

- **Clean Architecture**: Robert C. Martin (Uncle Bob)
- **SOLID Principles**: Robert C. Martin
- **Gang of Four Design Patterns**: Erich Gamma et al.
- **React Hooks Pattern**: React Documentation

---

**Architecture mise à jour:** 2026-01-25
**Implémentation:** Complète et fonctionnelle ✅
