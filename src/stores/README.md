# Stores Architecture

> Zustand-based state management for AccessCity Visual Novel Editor.

## Overview

```
src/stores/
├── index.ts              # Centralized exports
├── scenesStore.ts        # Scenes, dialogues, scene characters
├── charactersStore.ts    # Character definitions
├── uiStore.ts            # UI state (selections, saving)
├── settingsStore.ts      # User preferences
└── selectors/            # Memoized selectors
    ├── index.ts
    ├── sceneSelectors.ts
    └── characterSelectors.ts
```

## Store Responsibilities

| Store | Data | Persistence | Undo/Redo |
|-------|------|-------------|-----------|
| `useScenesStore` | Scenes, dialogues, scene characters, props, textboxes | localStorage | Yes (Zundo) |
| `useCharactersStore` | Character definitions, sprites, moods | localStorage | Yes (Zundo) |
| `useUIStore` | Selected scene, saving state, announcements | No | No |
| `useSettingsStore` | User preferences, theme | localStorage | No |

## Usage Patterns

### Basic Usage

```typescript
// Direct store access (simple cases)
import { useScenesStore, useCharactersStore } from '@/stores';

function MyComponent() {
  const scenes = useScenesStore(state => state.scenes);
  const addScene = useScenesStore(state => state.addScene);
}
```

### Optimized Usage (Recommended)

```typescript
// Use memoized selectors for better performance
import { useSceneById, useCharacterById, useSceneActions } from '@/stores';

function SceneEditor({ sceneId }: { sceneId: string }) {
  // Only re-renders when this specific scene changes
  const scene = useSceneById(sceneId);

  // Stable action references
  const { updateScene, deleteScene } = useSceneActions();
}
```

### Available Selectors

#### Scene Selectors

| Selector | Returns | Use Case |
|----------|---------|----------|
| `useSceneById(id)` | `Scene \| undefined` | Single scene by ID |
| `useScenes()` | `Scene[]` | All scenes |
| `useScenesCount()` | `number` | Scene count (no content changes) |
| `useSceneIds()` | `string[]` | Scene IDs only (for lists) |
| `useDialoguesBySceneId(id)` | `Dialogue[]` | Dialogues for a scene |
| `useDialogueByIndex(id, idx)` | `Dialogue \| undefined` | Single dialogue |
| `useSceneCharacters(id)` | `SceneCharacter[]` | Characters in scene |
| `useSceneActions()` | Actions object | Scene CRUD actions |
| `useDialogueActions()` | Actions object | Dialogue CRUD actions |

#### Character Selectors

| Selector | Returns | Use Case |
|----------|---------|----------|
| `useCharacterById(id)` | `Character \| undefined` | Single character by ID |
| `useCharacters()` | `Character[]` | All characters |
| `useCharactersCount()` | `number` | Character count |
| `useCharacterNamesMap()` | `Record<string, string>` | ID to name lookup |
| `useSpeakableCharacters()` | `Character[]` | Characters with sprites |
| `useCharacterMoods(id)` | `string[]` | Moods for a character |
| `useCharacterActions()` | Actions object | Character CRUD actions |

## Architecture Decisions

### 1. Separate Stores by Domain

Each store handles one domain (scenes, characters, UI). This:
- Prevents unnecessary re-renders across domains
- Makes undo/redo granular per domain
- Simplifies testing

### 2. Memoized Selectors

Instead of inline selectors:
```typescript
// ❌ Creates new function on every render
const scene = useScenesStore(state => state.scenes.find(s => s.id === id));
```

Use memoized selectors:
```typescript
// ✅ Stable selector reference
const scene = useSceneById(id);
```

### 3. Centralized Auto-Save

All stores use the same auto-save pattern via `setupAutoSave()`:

```typescript
// In each store
setupAutoSave(useMyStore, (state) => state.data, 'storeName');
```

This:
- Eliminates code duplication
- Provides consistent 1s debounce
- Handles HMR cleanup automatically

### 4. Undo/Redo with Zundo

Scenes and Characters stores use Zundo temporal middleware:
- 50 history states limit
- Only tracks data (not actions)
- Reference equality for performance

Access via store's temporal methods:
```typescript
const { undo, redo, pastStates, futureStates } = useScenesStore.temporal.getState();
```

## Adding a New Store

1. Create `src/stores/newStore.ts`:
```typescript
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { setupAutoSave } from '../utils/storeSubscribers';

interface NewState {
  data: SomeType[];
  addItem: () => void;
}

export const useNewStore = create<NewState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set) => ({
          data: [],
          addItem: () => set(state => ({
            data: [...state.data, newItem]
          }), false, 'new/addItem'),
        })),
        { name: 'NewStore' }
      ),
      { name: 'new-storage' }
    ),
    { limit: 50 }
  )
);

// Auto-save
setupAutoSave(useNewStore, (state) => state.data, 'new');
```

2. Export from `src/stores/index.ts`
3. Create selectors in `src/stores/selectors/`

## Performance Guidelines

1. **Prefer selectors over inline functions**
   - Use `useSceneById(id)` not `useStore(s => s.scenes.find(...))`

2. **Subscribe to minimal state**
   - `useScenesCount()` doesn't re-render on content changes
   - `useSceneIds()` doesn't re-render on scene updates

3. **Batch updates**
   - Use `batchUpdateScenes()` for multiple scene changes
   - Use `batchUpdateDialogues()` for multiple dialogue changes

4. **Actions are stable**
   - Actions like `addScene` have stable references
   - No need to memoize them in useCallback

## Testing

Stores can be tested with Zustand's testing utilities:

```typescript
import { useScenesStore } from '@/stores';

beforeEach(() => {
  useScenesStore.setState({ scenes: [] });
});

test('adds scene', () => {
  const { addScene } = useScenesStore.getState();
  const id = addScene();
  expect(useScenesStore.getState().scenes).toHaveLength(1);
});
```
