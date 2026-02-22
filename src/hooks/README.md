# Custom Hooks Documentation

> **Hooks React personnalisés pour AccessCity**

---

## Vue d'ensemble

Ce module contient tous les custom hooks utilisés dans l'application. Les hooks sont organisés par catégorie fonctionnelle.

### Organisation

```
hooks/
├── useAssets.ts                 # Gestion assets (images, audio, etc.)
├── useCharacterForm.ts          # Form state pour éditeur personnages
├── useCharacterValidation.ts    # Validation personnages
├── useDialogueGraph.ts          # Transform dialogues → graph format
├── useEditorFacade.ts           # Wrapper EditorFacade avec selectors
├── useEditorLogic.ts            # Logique métier éditeur
├── useGameState.ts              # État du jeu (play mode)
├── useGraphTheme.ts             # Thème du graphe (Cosmos, etc.)
├── useLocalGraphState.ts        # État local graph React Flow
├── useNodeLayout.ts             # Layout Dagre pour nodes
├── useSelection.ts              # Selection logic (scène/dialogue/char)
├── useSerpentineSync.ts         # Sync serpentine routing
├── useValidation.ts             # Validation multi-domaine
└── graph-utils/                 # Utilitaires graph (non-hooks)
    ├── applySerpentineLayout.ts
    ├── buildGraphEdges.ts
    ├── edgeFactory.ts
    └── types.ts
```

---

## Règles Générales

### 1. Hooks vs Utilities

```typescript
// ✅ Hook : Utilise useState, useEffect, useCallback, stores Zustand
// Fichier : hooks/useMyHook.ts
export function useMyHook() {
  const [state, setState] = useState();
  const storeData = useStore();
  // ...
}

// ✅ Utility : Fonction pure, pas de React/Zustand
// Fichier : utils/myUtil.ts
export function myUtil(input: Data): Output {
  // Calcul pur
  return output;
}

// ❌ MAUVAIS : Hook dans utils/ ou utility dans hooks/
```

### 2. Naming Convention

```typescript
// ✅ BON : Hooks commencent par "use"
useDialogueGraph()
useValidation()
useSelection()

// ❌ MAUVAIS : Hooks sans "use"
dialogueGraph()   // Confus : hook ou utility?
getValidation()   // Semble être une fonction pure
```

### 3. Dependencies Arrays

```typescript
// ✅ BON : Toutes les deps listées
useEffect(() => {
  doSomething(value, otherValue);
}, [value, otherValue]);

// ❌ MAUVAIS : Deps manquantes
useEffect(() => {
  doSomething(value);  // value utilisé mais pas dans deps!
}, []);
```

### 4. Pas de Side Effects Cachés

```typescript
// ❌ MAUVAIS : Hook qui fait des mutations store silencieuses
function useMyHook() {
  useEffect(() => {
    useScenesStore.getState().addScene('Auto');  // ❌ Side effect caché!
  }, []);
}

// ✅ BON : Mutations explicites via actions retournées
function useSceneActions() {
  return useScenesStore(s => ({
    addScene: s.addScene,
    deleteScene: s.deleteScene,
  }));
}
```

---

## Catégories de Hooks

## 📦 Store Integration

Hooks qui wrappent les stores Zustand avec selectors memoized.

### useSelection

**Fichier** : `useSelection.ts`

**Description** : Gère la sélection globale (scène, dialogue, personnage).

**Retour** :
```typescript
interface SelectionHook {
  selectedElement: SelectedElement | null;
  selectScene: (sceneId: string) => void;
  selectDialogue: (sceneId: string, index: number) => void;
  selectCharacter: (sceneId: string, charId: string) => void;
  clearSelection: () => void;
}
```

**Usage** :
```typescript
const { selectedElement, selectDialogue } = useSelection();

// Sélectionner un dialogue
selectDialogue('scene-abc', 2);

// Vérifier type de sélection
if (selectedElement?.type === 'dialogue') {
  console.log('Dialogue sélectionné:', selectedElement.index);
}
```

### useEditorFacade

**Fichier** : `useEditorFacade.ts`

**Description** : Wrapper autour de `EditorFacade` avec selectors Zustand.

**Retour** : Instance `EditorFacade` avec 100+ méthodes

**Usage** :
```typescript
const facade = useEditorFacade();

// Utiliser facade
const sceneId = facade.addScene('Nouvelle Scène');
facade.addDialogueToScene(sceneId, {
  text: 'Bonjour!',
  speaker: 'Narrator',
});
```

**Note** : Préférer les selectors directs quand possible, EditorFacade est pour logique complexe.

---

## 🎨 Graph Management

Hooks pour la gestion du graphe de dialogues.

### useDialogueGraph

**Fichier** : `useDialogueGraph.ts`

**Description** : Transforme dialogues du store → format graph React Flow.

**Signature** :
```typescript
function useDialogueGraph(
  dialogues: Dialogue[],
  sceneId: string,
  validation: AdaptedValidation | null,
  layoutDirection: 'TB' | 'LR',
  theme: GraphTheme
): {
  nodes: GraphNode[];
  edges: Edge[];
}
```

**Process** :
1. Transforme dialogues → nodes (DialogueNode, ChoiceNode, TerminalNode)
2. Calcule edges selon choix/nextDialogue
3. Applique layout Dagre (positions)
4. Applique Serpentine routing (optimise edges)
5. Ajoute validation errors/warnings

**Usage** :
```typescript
const { nodes, edges } = useDialogueGraph(
  dialogues,
  sceneId,
  validation,
  'TB',  // Top-Bottom layout
  theme
);

<ReactFlow nodes={nodes} edges={edges} />
```

### useLocalGraphState

**Fichier** : `useLocalGraphState.ts`

**Description** : Gère l'état local du graphe React Flow (positions draggables).

**Signature** :
```typescript
function useLocalGraphState(
  dagreNodes: GraphNode[],
  edges: Edge[],
  dialoguesLength: number,
  serpentineEnabled: boolean,
  editMode: boolean,
  recalculateEdges: (nodes: Node[], edges: Edge[]) => Edge[]
): {
  localNodes: GraphNode[];
  localEdges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onNodeDragStop: (event, node, nodes) => void;
  reconnectLocalEdge: (oldEdge, newConnection) => void;
}
```

**Encapsule** :
- State local pour positions nodes (permet drag-and-drop)
- Sync avec Dagre sur changement de dialogues
- Recalcul serpentine après drag

**Usage** :
```typescript
const { localNodes, localEdges, onNodesChange, onNodeDragStop } =
  useLocalGraphState(dagreNodes, edges, dialogues.length, true, editMode, recalculateEdges);

<ReactFlow
  nodes={localNodes}
  edges={localEdges}
  onNodesChange={onNodesChange}
  onNodeDragStop={onNodeDragStop}
/>
```

### useNodeLayout

**Fichier** : `useNodeLayout.ts`

**Description** : Calcule layout Dagre pour nodes.

**Signature** :
```typescript
function useNodeLayout(
  dialogues: Dialogue[],
  sceneId: string,
  layoutDirection: 'TB' | 'LR'
): GraphNode[]
```

**Process** :
1. Transforme dialogues → nodes
2. Crée graph Dagre
3. Calcule positions
4. Retourne nodes avec positions

### useSerpentineSync

**Fichier** : `useSerpentineSync.ts`

**Description** : Sync serpentine routing avec UI store.

**Retour** :
```typescript
interface SerpentineSync {
  serpentineEnabled: boolean;
  recalculateEdges: (nodes: Node[], edges: Edge[]) => Edge[];
}
```

---

## 📝 Form Management

Hooks pour gestion de formulaires.

### useCharacterForm

**Fichier** : `useCharacterForm.ts` (292 lignes)

**Description** : Gère le form state pour CharacterEditorModal.

**Retour** :
```typescript
interface CharacterFormHook {
  formData: CharacterFormData;
  updateField: (field: keyof CharacterFormData, value: any) => void;
  addMood: () => void;
  updateMood: (index: number, updates: Partial<Mood>) => void;
  deleteMood: (index: number) => void;
  validate: () => boolean;
  reset: () => void;
}
```

**Usage** :
```typescript
const form = useCharacterForm(initialCharacter);

<input
  value={form.formData.name}
  onChange={(e) => form.updateField('name', e.target.value)}
/>

<button onClick={form.addMood}>Ajouter un mood</button>
```

**Note** : Hook volumineux (292 lignes) → considérer split futur.

---

## ✅ Validation

Hooks pour validation multi-domaine.

### useValidation

**Fichier** : `useValidation.ts` (290 lignes)

**Description** : Valide scenes, dialogues, choices, characters, variables.

**Retour** :
```typescript
interface ValidationResult {
  errors: {
    scenes: Record<string, ValidationProblem[]>;
    dialogues: Record<string, ValidationProblem[]>;
    characters: Record<string, ValidationProblem[]>;
    variables: Record<string, ValidationProblem[]>;
  };
  hasErrors: boolean;
  errorCount: number;
}
```

**Process** :
1. Lit 3 stores (scenes, characters, settings)
2. Valide chaque domaine dans `useMemo` séparés
3. Combine résultats

**Usage** :
```typescript
const validation = useValidation();

if (validation.hasErrors) {
  console.log(`${validation.errorCount} erreurs trouvées`);
}

// Erreurs pour un dialogue spécifique
const dialogueErrors = validation.errors.dialogues['dialogue-abc'];
```

**Note** : Hook dense (290 lignes) → À refactorer en hooks domaine-spécifiques (voir Vague 9 Phase future).

### useCharacterValidation

**Fichier** : `useCharacterValidation.ts` (263 lignes)

**Description** : Validation spécifique personnages.

**Retour** :
```typescript
interface CharacterValidationHook {
  validateCharacter: (character: Character) => ValidationError[];
  validateField: (field: string, value: any) => string[];
}
```

---

## 🎮 Game State

Hooks pour play mode.

### useGameState

**Fichier** : `useGameState.ts` (247 lignes)

**Description** : Gère l'état du jeu en play mode.

**Retour** :
```typescript
interface GameStateHook {
  currentScene: Scene | null;
  currentDialogue: Dialogue | null;
  variables: Record<string, any>;
  makeChoice: (choiceIndex: number) => void;
  nextDialogue: () => void;
  // ...
}
```

---

## 🎨 Assets Management

Hooks pour gestion assets.

### useAssets

**Fichier** : `useAssets.ts` (336 lignes)

**Description** : Gère chargement/filtrage/recherche assets (images, audio).

**Retour** :
```typescript
interface AssetsHook {
  assets: Asset[];
  filteredAssets: Asset[];
  loading: boolean;
  search: string;
  setSearch: (query: string) => void;
  filterByType: (type: AssetType) => void;
  // ...
}
```

**Features** :
- Debounced search (300ms)
- Filtrage par type/catégorie
- Pagination
- Lazy-loading images

---

## 🎹 Keyboard & Shortcuts

Hooks pour gestion clavier.

### useKeyboardShortcuts

**Fichier** : `useKeyboardShortcuts.ts`

**Description** : Gère les raccourcis clavier globaux.

**Usage** :
```typescript
useKeyboardShortcuts({
  'Ctrl+S': handleSave,
  'Ctrl+Z': handleUndo,
  'Ctrl+Y': handleRedo,
  'Escape': handleEscape,
});
```

---

## 🔍 Hooks Composition

### Pattern: Hooks qui appellent d'autres hooks

```typescript
// ✅ BON : Composition claire
function useDialogueEditor(sceneId: string) {
  // Hook 1 : Validation
  const validation = useValidation();

  // Hook 2 : Selection
  const { selectDialogue } = useSelection();

  // Hook 3 : Store actions
  const { addDialogue, updateDialogue } = useScenesStore(s => ({
    addDialogue: s.addDialogue,
    updateDialogue: s.updateDialogue,
  }));

  // Retourne API composée
  return {
    validation,
    selectDialogue,
    addDialogue,
    updateDialogue,
  };
}
```

**Limite** : Éviter chaînes >5 hooks (MainCanvas en a 8 → à refactorer).

---

## 🧪 Testing Hooks

### Approche recommandée

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

test('useMyHook increments counter', () => {
  const { result } = renderHook(() => useMyHook());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

---

## 📊 Performance Tips

### 1. Memoization

```typescript
// ✅ BON : useMemo pour calculs coûteux
const sortedScenes = useMemo(() => {
  return scenes.sort((a, b) => a.order - b.order);
}, [scenes]);

// ❌ MAUVAIS : useMemo sur calcul trivial
const count = useMemo(() => items.length, [items]);
```

### 2. useCallback pour Handlers

```typescript
// ✅ BON : useCallback pour fonctions passées en props
const handleClick = useCallback((id: string) => {
  doSomething(id);
}, []);

<ChildComponent onClick={handleClick} />
```

### 3. Selectors Granulaires

```typescript
// ❌ MAUVAIS : Sélection de tout le store
const store = useScenesStore();

// ✅ BON : Sélection granulaire
const scenesCount = useScenesStore(s => s.scenes.length);
```

---

## 🚨 Anti-Patterns

### ❌ Hooks Conditionnels

```typescript
// ❌ MAUVAIS : Hook appelé conditionnellement
if (condition) {
  useMyHook();  // ❌ Viole Rules of Hooks!
}

// ✅ BON : Hook toujours appelé, condition à l'intérieur
function useMyHook(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      // Logic
    }
  }, [enabled]);
}
```

### ❌ Mutations de Store dans Hooks

```typescript
// ❌ MAUVAIS : Mutation directe dans hook
function useAutoSave() {
  useEffect(() => {
    useScenesStore.getState().save();  // ❌ Side effect caché!
  }, []);
}

// ✅ BON : Retourner action explicite
function useAutoSave() {
  const save = useScenesStore(s => s.save);
  return { save };  // Composant décide quand appeler
}
```

---

## 📚 Liens Utiles

- **React Hooks docs** : https://react.dev/reference/react
- **Zustand hooks** : https://zustand.docs.pmnd.rs/
- **@xyflow/react hooks** : https://reactflow.dev/api-reference/hooks
- **Testing Library hooks** : https://testing-library.com/docs/react-testing-library/api#renderhook

---

**Dernière mise à jour** : 2026-02-14
