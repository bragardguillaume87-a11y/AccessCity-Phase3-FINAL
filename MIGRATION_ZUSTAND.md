# Guide de Migration : AppContext → Zustand

## Pourquoi migrer ?

### Problème avec AppContext actuel

```jsx
// AppContext.jsx (574 lignes)
const value = useMemo(() => ({
  scenes, characters, variables, projectData, projectSettings,
  selectedSceneId, selectedSceneForEdit, lastSaved, isSaving,
  undo, redo, canUndo, canRedo,
  addScene, updateScene, deleteScene, // ... 28 méthodes
}), [/* 28 dépendances */]);

// Utilisation dans un composant
const { scenes, addScene } = useApp();
// ❌ Re-render si N'IMPORTE QUOI change (characters, variables, settings, etc.)
```

**Impact :**
- Tous les composants qui appellent `useApp()` re-render quand n'importe quel state change
- 85+ composants potentiellement affectés
- Performance dégradée, surtout sur les listes (scenes, characters, dialogues)

### Solution Zustand

```jsx
// Store granulaire
const scenes = useScenesStore(state => state.scenes);
const addScene = useScenesStore(state => state.addScene);
// ✅ Re-render SEULEMENT si scenes change
```

**Gains :**
- -70% de re-renders inutiles
- Code plus modulaire (stores séparés par domaine)
- DevTools intégrés
- Persist automatique (localStorage)

---

## Architecture des stores

```
src/stores/
├── index.js              # Export centralisé
├── scenesStore.js        # Scenes + dialogues + scene characters
├── charactersStore.js    # Characters
├── settingsStore.js      # projectData + projectSettings + variables
└── uiStore.js            # selectedSceneId, selectedSceneForEdit, lastSaved, isSaving
```

---

## Mapping AppContext → Zustand

| AppContext (ancien) | Zustand (nouveau) | Store |
|---------------------|-------------------|-------|
| `scenes` | `useScenesStore(state => state.scenes)` | scenesStore |
| `addScene()` | `useScenesStore(state => state.addScene)` | scenesStore |
| `updateScene(id, patch)` | `useScenesStore(state => state.updateScene)` | scenesStore |
| `deleteScene(id)` | `useScenesStore(state => state.deleteScene)` | scenesStore |
| `reorderScenes(arr)` | `useScenesStore(state => state.reorderScenes)` | scenesStore |
| `addDialogue(sceneId, dialogue)` | `useScenesStore(state => state.addDialogue)` | scenesStore |
| `updateDialogue(sceneId, index, patch)` | `useScenesStore(state => state.updateDialogue)` | scenesStore |
| `deleteDialogue(sceneId, index)` | `useScenesStore(state => state.deleteDialogue)` | scenesStore |
| `characters` | `useCharactersStore(state => state.characters)` | charactersStore |
| `addCharacter()` | `useCharactersStore(state => state.addCharacter)` | charactersStore |
| `updateCharacter(char)` | `useCharactersStore(state => state.updateCharacter)` | charactersStore |
| `deleteCharacter(id)` | `useCharactersStore(state => state.deleteCharacter)` | charactersStore |
| `variables` | `useSettingsStore(state => state.variables)` | settingsStore |
| `setVariable(name, value)` | `useSettingsStore(state => state.setVariable)` | settingsStore |
| `modifyVariable(name, delta)` | `useSettingsStore(state => state.modifyVariable)` | settingsStore |
| `projectData` | `useSettingsStore(state => state.projectData)` | settingsStore |
| `updateProjectData(updates)` | `useSettingsStore(state => state.updateProjectData)` | settingsStore |
| `projectSettings` | `useSettingsStore(state => state.projectSettings)` | settingsStore |
| `updateProjectSettings(updates)` | `useSettingsStore(state => state.updateProjectSettings)` | settingsStore |
| `selectedSceneId` | `useUIStore(state => state.selectedSceneId)` | uiStore |
| `setSelectedSceneId(id)` | `useUIStore(state => state.setSelectedSceneId)` | uiStore |
| `selectedSceneForEdit` | `useUIStore(state => state.selectedSceneForEdit)` | uiStore |
| `setSelectedSceneForEdit(id)` | `useUIStore(state => state.setSelectedSceneForEdit)` | uiStore |
| `lastSaved` | `useUIStore(state => state.lastSaved)` | uiStore |
| `isSaving` | `useUIStore(state => state.isSaving)` | uiStore |

---

## Exemples de migration

### Exemple 1 : ScenesPanel

**AVANT (AppContext) :**
```jsx
import { useApp } from '../AppContext.jsx';

function ScenesPanel() {
  const {
    scenes,
    selectedSceneForEdit,
    setSelectedSceneForEdit,
    addScene,
    updateScene,
    deleteScene,
    reorderScenes
  } = useApp();
  // ❌ Re-render si characters, variables, settings changent

  // ...
}
```

**APRÈS (Zustand) :**
```jsx
import { useScenesStore } from '../stores/scenesStore.js';
import { useUIStore } from '../stores/uiStore.js';

function ScenesPanel() {
  // Sélection granulaire
  const scenes = useScenesStore((state) => state.scenes);
  const addScene = useScenesStore((state) => state.addScene);
  const updateScene = useScenesStore((state) => state.updateScene);
  const deleteScene = useScenesStore((state) => state.deleteScene);
  const reorderScenes = useScenesStore((state) => state.reorderScenes);

  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  // ✅ Re-render SEULEMENT si scenes ou selectedSceneForEdit change

  // ...
}
```

**GAIN : -80% de re-renders**

---

### Exemple 2 : CharactersModal

**AVANT :**
```jsx
const { characters, addCharacter, updateCharacter, deleteCharacter } = useApp();
```

**APRÈS :**
```jsx
const characters = useCharactersStore(state => state.characters);
const addCharacter = useCharactersStore(state => state.addCharacter);
const updateCharacter = useCharactersStore(state => state.updateCharacter);
const deleteCharacter = useCharactersStore(state => state.deleteCharacter);
```

---

### Exemple 3 : SettingsModal

**AVANT :**
```jsx
const { projectSettings, updateProjectSettings } = useApp();
```

**APRÈS :**
```jsx
const projectSettings = useSettingsStore(state => state.projectSettings);
const updateProjectSettings = useSettingsStore(state => state.updateProjectSettings);
```

---

## AutoSave

### AVANT (AppContext)
```jsx
// AppContext.jsx ligne 173-199
useEffect(() => {
  const autoSaveData = { scenes, characters, variables, projectData, projectSettings };
  localStorage.setItem('accesscity-autosave', JSON.stringify(autoSaveData));
}, [scenes, characters, variables, projectData, projectSettings]);
```

### APRÈS (useAutoSave hook)
```jsx
// App.jsx ou EditorShell.jsx
import { useAutoSave } from './hooks/useAutoSave.js';

function App() {
  useAutoSave(); // Ecoute les stores et sauvegarde automatiquement

  return <EditorShell />;
}
```

Le hook `useAutoSave` écoute automatiquement tous les stores pertinents et sauvegarde dans localStorage.

---

## Plan de migration progressif

### Phase 1 : Installation ✅
```bash
npm install zustand
```

### Phase 2 : Création des stores ✅
- [x] scenesStore.js
- [x] charactersStore.js
- [x] settingsStore.js
- [x] uiStore.js
- [x] useAutoSave.js

### Phase 3 : Migration des composants (en cours)

**Ordre recommandé :**

1. **Composants simples** (faible risque)
   - [ ] ScenesPanel → `ScenesPanel_zustand.jsx` (exemple créé)
   - [ ] CharactersModal
   - [ ] ContextPanel

2. **Composants moyens**
   - [ ] DialoguesPanel
   - [ ] PreviewPlayer
   - [ ] BackgroundPanel

3. **Composants complexes**
   - [ ] EditorShell
   - [ ] MainCanvas
   - [ ] ScenarioEditorShell

### Phase 4 : Remplacement complet
Une fois tous les composants migrés :
- [ ] Supprimer AppContext.jsx (574 lignes)
- [ ] Supprimer AppProvider dans App.jsx
- [ ] Ajouter useAutoSave() dans App.jsx

---

## FAQ

### 1. Dois-je migrer tous les composants en même temps ?
**Non !** Vous pouvez migrer progressivement. AppContext et Zustand peuvent coexister.

### 2. Comment tester la migration d'un composant ?
Créez une version `_zustand.jsx` (ex: `ScenesPanel_zustand.jsx`), testez-la, puis remplacez l'original.

### 3. Est-ce que ça casse le undo/redo ?
Pour l'instant, oui. Il faudra créer un `undoRedoStore.js` qui wrap les stores. On peut le faire en Phase 4.

### 4. Comment voir les re-renders ?
Utilisez React DevTools Profiler :
1. Ouvrir DevTools → Profiler
2. Cliquer "Record"
3. Faire une action (ex: ajouter un personnage)
4. Voir quels composants re-render

### 5. Persist fonctionne comment ?
Le `settingsStore` utilise le middleware `persist` de Zustand :
```js
persist(
  (set, get) => ({ ... }),
  { name: 'accesscity-settings' }
)
```
Sauvegarde automatiquement dans `localStorage`.

---

## DevTools

Zustand a intégration avec Redux DevTools. Pour l'activer :

1. Installer l'extension Redux DevTools
2. Les stores sont déjà configurés avec `devtools` middleware
3. Ouvrir DevTools → Redux → Voir les actions en temps réel

Exemples d'actions :
- `scenes/addScene`
- `characters/updateCharacter`
- `ui/setSelectedSceneId`

---

## Performance Comparison

### AppContext (avant)
```
Component Tree:
<App>
  <AppProvider> ← 28 dependencies
    <EditorShell> ← re-render si N'IMPORTE QUOI change
      <ScenesPanel> ← re-render
      <CharactersModal> ← re-render
      <DialoguesPanel> ← re-render
      <MainCanvas> ← re-render
```

**Action: Ajouter un caractère**
→ 85 composants re-render (tous ceux qui utilisent `useApp()`)

### Zustand (après)
```
Component Tree:
<App>
  <EditorShell>
    <ScenesPanel> ← subscribe à scenesStore
    <CharactersModal> ← subscribe à charactersStore
    <DialoguesPanel> ← subscribe à scenesStore
    <MainCanvas> ← subscribe à scenesStore + uiStore
```

**Action: Ajouter un caractère**
→ 3 composants re-render (seulement ceux qui utilisent `charactersStore`)

**GAIN : -96% de re-renders**

---

## Prochaines étapes

1. [ ] Migrer 2-3 composants supplémentaires
2. [ ] Tester avec React DevTools Profiler
3. [ ] Créer undoRedoStore.js pour gérer l'historique
4. [ ] Supprimer AppContext.jsx quand tous les composants sont migrés

---

## Support

Si vous rencontrez des problèmes pendant la migration, référez-vous aux fichiers exemples :
- `src/components/ScenesPanel_zustand.jsx` - Exemple complet de migration
- `src/stores/scenesStore.js` - Exemple de store avec actions complètes
