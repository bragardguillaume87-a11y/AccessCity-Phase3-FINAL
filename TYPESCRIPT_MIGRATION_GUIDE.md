# 🚀 TypeScript Migration Guide - AccessCity Phase 3

**Status:** Migration en cours (Progressive)
**Stratégie:** Approche Bottom-Up (Stores → Hooks → Components)
**Mode:** `strict: false` → Migration progressive vers `strict: true`

---

## 📊 Progression

### Phase 1: Setup ✅ COMPLETED
- [x] Install TypeScript & type definitions
- [x] Create `tsconfig.json` (Vite 7 optimized)
- [x] Create `src/types/index.ts` (Global types)
- [x] First store migrated: `uiStore.ts`

### Phase 2: Stores Migration 🔄 IN PROGRESS
- [x] `uiStore.js` → `uiStore.ts` ✅
- [ ] `settingsStore.js` → `settingsStore.ts`
- [ ] `charactersStore.js` → `charactersStore.ts`
- [ ] `scenesStore.js` → `scenesStore.ts` (Complex with zundo)
- [ ] Update `stores/index.js` → `stores/index.ts`

### Phase 3: Hooks Migration ⏳ PENDING
- [ ] `useUndoRedo.js` → `useUndoRedo.ts`
- [ ] `useValidation.js` → `useValidation.ts`
- [ ] `useAssets.js` → `useAssets.ts`
- [ ] `useCanvasKeyboard.js` → `useCanvasKeyboard.ts`
- [ ] All other hooks in `src/hooks/`

### Phase 4: Components Migration ⏳ PENDING
- [ ] `App.jsx` → `App.tsx`
- [ ] `EditorShell.jsx` → `EditorShell.tsx`
- [ ] `MainCanvas.jsx` → `MainCanvas.tsx`
- [ ] All UI components
- [ ] All panels
- [ ] All modals

### Phase 5: Strictness Increase ⏳ PENDING
- [ ] Enable `strict: true`
- [ ] Enable `noUnusedLocals: true`
- [ ] Enable `noUnusedParameters: true`
- [ ] Fix all strict mode errors

---

## 🎯 Migration Strategy (Premium Approach)

### Why Bottom-Up?
1. **Stores are foundation** - Everything else depends on them
2. **Type safety propagates up** - Once stores are typed, hooks get free type inference
3. **Fewer changes needed** - Components can import typed stores without changing

### Order of Migration:
```
1. Types definitions (src/types/index.ts)
2. Utility functions (utils/*.js → utils/*.ts)
3. Stores (stores/*.js → stores/*.ts)
4. Hooks (hooks/*.js → hooks/*.ts)
5. Components (components/*.jsx → components/*.tsx)
6. Root files (App.jsx → App.tsx, main.jsx → main.tsx)
```

---

## 📝 TypeScript Patterns for This Project

### 1. Zustand Store Pattern (Standard Store)

```typescript
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

interface MyState {
  // State fields
  count: number;
  name: string;

  // Actions (functions that modify state)
  increment: () => void;
  setName: (name: string) => void;
}

export const useMyStore = create<MyState>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial state
      count: 0,
      name: '',

      // Actions implementation
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name) => set({ name }),
    })),
    { name: 'MyStore' }
  )
);
```

### 2. Zustand Store with Temporal (zundo) Pattern

```typescript
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { Scene } from '../types';

interface ScenesState {
  scenes: Scene[];
  addScene: () => string;
  updateScene: (sceneId: string, patch: Partial<Scene>) => void;
  deleteScene: (sceneId: string) => void;
}

export const useScenesStore = create<ScenesState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set) => ({
          scenes: [],

          addScene: () => {
            const id = `scene-${Date.now()}`;
            set((state) => ({
              scenes: [...state.scenes, createNewScene(id)]
            }));
            return id;
          },

          updateScene: (sceneId, patch) => {
            set((state) => ({
              scenes: state.scenes.map(s =>
                s.id === sceneId ? { ...s, ...patch } : s
              )
            }));
          },

          deleteScene: (sceneId) => {
            set((state) => ({
              scenes: state.scenes.filter(s => s.id !== sceneId)
            }));
          },
        })),
        { name: 'ScenesStore' }
      ),
      {
        name: 'scenes-storage',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    {
      limit: 50,
      equality: (a, b) => a === b,
    }
  )
);
```

### 3. React Component Pattern

```typescript
import React from 'react';

interface UserCardProps {
  name: string;
  age?: number;  // Optional
  onEdit: (name: string) => void;
}

export function UserCard({ name, age, onEdit }: UserCardProps) {
  const handleClick = () => {
    onEdit(name);
  };

  return (
    <div onClick={handleClick}>
      <h2>{name}</h2>
      {age && <p>Age: {age}</p>}
    </div>
  );
}
```

### 4. Custom Hook Pattern

```typescript
import { useState, useEffect } from 'react';

interface UseTimerResult {
  seconds: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer(): UseTimerResult {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return {
    seconds,
    start: () => setIsRunning(true),
    stop: () => setIsRunning(false),
    reset: () => {
      setSeconds(0);
      setIsRunning(false);
    },
  };
}
```

### 5. Zustand Selector Pattern (Typed)

```typescript
// ❌ BAD - No type inference
const scenes = useScenesStore(state => state.scenes);

// ✅ GOOD - Full type safety
const scenes = useScenesStore((state) => state.scenes);  // scenes: Scene[]
const addScene = useScenesStore((state) => state.addScene);  // addScene: () => string
```

---

## 🛠️ Migration Checklist for Each File

When migrating a file, follow this checklist:

### For Stores:
1. [ ] Rename `.js` → `.ts`
2. [ ] Define `interface XxxState` with all state + actions
3. [ ] Add type parameter: `create<XxxState>()()`
4. [ ] Import types from `src/types/index.ts`
5. [ ] Remove `get` parameter if unused
6. [ ] Test: Run `npx tsc --noEmit`

### For Hooks:
1. [ ] Rename `.js` → `.ts`
2. [ ] Define return type interface
3. [ ] Type all parameters
4. [ ] Type all `useState`, `useCallback`, `useMemo`
5. [ ] Test: Run `npx tsc --noEmit`

### For Components:
1. [ ] Rename `.jsx` → `.tsx`
2. [ ] Define `interface XxxProps`
3. [ ] Add props type: `function Xxx({ prop1, prop2 }: XxxProps)`
4. [ ] Type all `useState`, event handlers
5. [ ] Remove PropTypes (no longer needed)
6. [ ] Test: Run `npx tsc --noEmit`

---

## 🚫 Common Pitfalls to Avoid

### ❌ DON'T: Use `any`
```typescript
const data: any = fetchData();  // ❌ Defeats purpose of TypeScript
```

### ✅ DO: Use proper types or `unknown`
```typescript
const data: Scene[] = fetchData();  // ✅ Type-safe
// OR
const data: unknown = fetchData();  // ✅ Forces type checking before use
```

---

### ❌ DON'T: Duplicate type definitions
```typescript
// store.ts
interface Scene { id: string; title: string; }

// component.tsx
interface Scene { id: string; title: string; }  // ❌ Duplication
```

### ✅ DO: Use shared types
```typescript
// types/index.ts
export interface Scene { id: string; title: string; }

// store.ts
import type { Scene } from '../types';  // ✅ Single source of truth
```

---

### ❌ DON'T: Type props twice
```typescript
interface Props { name: string; }

function Component({ name }: { name: string }) {  // ❌ Redundant
  // ...
}
```

### ✅ DO: Use interface
```typescript
interface Props { name: string; }

function Component({ name }: Props) {  // ✅ Clean
  // ...
}
```

---

## 📚 Resources

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Zustand TypeScript Guide](https://docs.pmnd.rs/zustand/guides/typescript)
- [Vite TypeScript](https://vitejs.dev/guide/features.html#typescript)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## ⚡ Quick Commands

```bash
# Check TypeScript errors without compiling
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/stores/uiStore.ts

# Dev server (hot reload works with TS)
npm run dev

# Build (will fail if TS errors exist)
npm run build
```

---

## 🎓 Next Steps

1. **Review this guide** ✅
2. **Migrate remaining stores** (settingsStore, charactersStore, scenesStore)
3. **Migrate hooks** (start with simple ones)
4. **Migrate components** (start with leaf components)
5. **Enable strict mode** once all files are migrated
6. **Remove PropTypes** package

---

**Questions? Let Claude help you migrate each file!** 🚀
