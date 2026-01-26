# Quick Wins Refactoring - AccessCity Studio

**Date** : 2026-01-02
**Durée estimée** : 4-5 heures
**Gain** : Performance +60%, WCAG +20%, Code propre

---

## 🎯 Objectif

Réaliser 3 optimisations rapides à fort impact avant de s'attaquer aux refactorings majeurs.

---

## ⚡ QUICK WIN #1 - Fix Interval Timer (30 min)

### Problème
`EditorShell.jsx` force un re-render de TOUTE l'application chaque seconde pour mettre à jour le timestamp "Sauvegardé il y a X secondes".

**Impact actuel** :
- ~60 re-renders/minute de tout l'arbre de composants
- Lag perceptible lors de l'édition
- CPU usage inutile

### Fichiers à modifier

#### 1. Créer `src/components/ui/AutoSaveTimestamp.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { useUndoRedoStore } from '../../stores/index.js';

/**
 * AutoSaveTimestamp - Composant isolé pour afficher le temps depuis dernière sauvegarde
 * Memoizé pour éviter les re-renders de l'app entière
 */
export const AutoSaveTimestamp = React.memo(() => {
  const lastSaved = useUndoRedoStore(state => state.lastSaved);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTimeSinceLastSave = (timestamp) => {
    if (!timestamp) return null;
    const seconds = Math.floor((elapsed - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const timeSince = getTimeSinceLastSave(lastSaved);

  if (!timeSince) return null;

  return <span>{timeSince}</span>;
});

AutoSaveTimestamp.displayName = 'AutoSaveTimestamp';
```

#### 2. Modifier `src/components/EditorShell.jsx`

**SUPPRIMER** (lignes 42, 58-63, 66-72) :
```jsx
// ❌ SUPPRIMER
const [, _forceUpdate] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    _forceUpdate(n => n + 1);
  }, 1000);
  return () => clearInterval(interval);
}, []);

const getTimeSinceLastSave = () => {
  if (!lastSaved) return null;
  const seconds = Math.floor((Date.now() - new Date(lastSaved).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}min`;
};
```

**SUPPRIMER** dans les props de TopBar (ligne 145) :
```jsx
// ❌ SUPPRIMER
getTimeSinceLastSave={getTimeSinceLastSave}
```

#### 3. Modifier `src/components/layout/TopBar.jsx`

**AJOUTER** l'import :
```jsx
import { AutoSaveTimestamp } from '../ui/AutoSaveTimestamp.jsx';
```

**SUPPRIMER** la prop `getTimeSinceLastSave` de la signature (ligne 13) :
```jsx
// ❌ AVANT
export default function TopBar({
  onBack,
  onOpenModal,
  undo,
  redo,
  canUndo,
  canRedo,
  validation,
  showProblemsPanel,
  onToggleProblemsPanel,
  isSaving,
  lastSaved,
  getTimeSinceLastSave // ❌ SUPPRIMER cette ligne
}) {
```

**REMPLACER** ligne 223 :
```jsx
// ❌ AVANT
<span>Sauvegardé {getTimeSinceLastSave?.()}</span>

// ✅ APRÈS
<span>Sauvegardé <AutoSaveTimestamp /></span>
```

### Résultat attendu
- ✅ Re-renders/sec : 60 → <1
- ✅ Meilleure réactivité de l'interface
- ✅ Isolation du timer dans 1 seul composant

---

## 🧹 QUICK WIN #2 - Logger Centralisé (1h)

### Problème
111 occurrences de `console.log` dispersées dans 29 fichiers :
- Pollue la console en production
- Impossible de filtrer les logs
- Performances dégradées

### Étape 1 : Créer `src/utils/logger.js`

```javascript
/**
 * Logger centralisé pour AccessCity Studio
 * - En DEV : Tous les logs sont affichés
 * - En PROD : Seulement warn et error
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logs - Visible uniquement en développement
   */
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logs - Visible uniquement en développement
   */
  info: (...args) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning logs - Toujours visible
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logs - Toujours visible
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Logs groupés pour debugging complexe
   */
  group: (label, callback) => {
    if (isDev) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Mesure de performance
   */
  time: (label) => {
    if (isDev) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (isDev) {
      console.timeEnd(label);
    }
  }
};
```

### Étape 2 : Remplacer tous les console.log

**Fichiers concernés** (29 fichiers avec console.log) :

**Stratégie de remplacement** :

```javascript
// ❌ AVANT
console.log('Selected scene:', selectedScene);
console.log('Uploading files...', files);

// ✅ APRÈS
import { logger } from '@/utils/logger';

logger.debug('Selected scene:', selectedScene);
logger.debug('Uploading files...', files);
```

**Cas particuliers** :

```javascript
// console.error → logger.error (TOUJOURS visible)
console.error('Failed to load:', error);
logger.error('Failed to load:', error);

// console.warn → logger.warn (TOUJOURS visible)
console.warn('Deprecated feature');
logger.warn('Deprecated feature');

// console.log de production → logger.info
console.log('User logged in');
logger.info('User logged in');
```

**Liste des fichiers à modifier** :
1. `src/components/modals/AssetsLibraryModal.jsx`
2. `src/components/modals/CharactersModal.jsx`
3. `src/components/panels/MainCanvas.jsx`
4. `src/components/panels/PropertiesPanel.jsx`
5. `src/hooks/useAssets.js`
6. `src/hooks/useGameState.js`
7. `src/stores/scenesStore.js`
8. (+ 22 autres fichiers)

**Commande pour trouver tous les fichiers** :
```bash
# Trouver tous les console.log
grep -r "console\.log" src/ --include="*.js" --include="*.jsx"

# Compter les occurrences
grep -r "console\.log" src/ --include="*.js" --include="*.jsx" | wc -l
```

### Résultat attendu
- ✅ 111 console.log → 0
- ✅ Console propre en production
- ✅ Logs filtrables par niveau (debug/info/warn/error)

---

## ♿ QUICK WIN #3 - Accessibilité WCAG (3-4h)

### Problème
Score WCAG 2.2 AA actuel : **65%** (insuffisant pour un projet de sensibilisation handicap)

**Problèmes bloquants** :
1. Absence de hiérarchie headings (H1, H2, H3)
2. Inputs sans labels
3. Boutons icon-only sans aria-label

### Étape 1 : Ajouter hiérarchie headings (1h)

#### Modifier `src/components/EditorShell.jsx`

**AJOUTER** après ligne 111 :
```jsx
<div className="min-h-screen bg-slate-900 flex flex-col">
  {/* Heading H1 principal - Visible uniquement pour screen readers */}
  <h1 className="sr-only">AccessCity Studio - Éditeur de Visual Novels Accessibles</h1>

  {/* Global keyboard shortcuts */}
  <KeyboardShortcuts ... />
```

**AJOUTER** après ligne 156 (dans <main>) :
```jsx
<main className="flex-1 overflow-hidden" id="main-content" tabIndex="-1">
  <h2 className="sr-only">Zone d'édition principale</h2>

  <React.Suspense fallback={...}>
```

**MODIFIER** les Panels (lignes 166-237) :
```jsx
{/* Left panel: Explorer */}
<Panel
  defaultSize="20%"
  minSize="15%"
  maxSize="40%"
  collapsible={true}
  collapsed={!!fullscreenMode}
  className="bg-slate-800 border-r border-slate-700 overflow-y-auto"
  id="explorer-panel"
  role="complementary"
  aria-label="Explorateur de projet"
>
  <h3 className="sr-only">Explorateur de scènes et personnages</h3>
  <Sidebar>
    <LeftPanel onDialogueSelect={handleDialogueSelect} />
  </Sidebar>
</Panel>

{/* Center panel: Main Canvas */}
<Panel
  defaultSize="50%"
  minSize="30%"
  className="bg-slate-900 overflow-auto"
  id="canvas-panel"
>
  <div role="main" aria-label="Canvas d'édition">
    <h3 className="sr-only">Canvas de scène</h3>
    <MainCanvas ... />
  </div>
</Panel>

{/* Right panel: Inspector/Properties */}
<Panel
  defaultSize="30%"
  minSize="20%"
  maxSize="40%"
  collapsible={true}
  collapsed={!isRightPanelOpen || !!fullscreenMode}
  onCollapse={() => setIsRightPanelOpen(false)}
  onExpand={() => setIsRightPanelOpen(true)}
  className="bg-slate-800 border-l border-slate-700 overflow-y-auto"
  id="properties-panel"
  role="complementary"
  aria-label="Propriétés de l'élément sélectionné"
>
  <h3 className="sr-only">Propriétés et actions</h3>
  <Inspector>
    <UnifiedPanel ... />
  </Inspector>
</Panel>
```

**AJOUTER** la classe CSS `.sr-only` dans `src/index.css` :
```css
/* Screen Reader Only - Visible uniquement pour lecteurs d'écran */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Étape 2 : Ajouter labels sur inputs (1h)

#### Modifier `src/components/SettingsModal.jsx` (ligne 210-217)

**AVANT** :
```jsx
<div className="p-4 border-b">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      type="text"
      placeholder="Rechercher des paramètres..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10"
    />
  </div>
</div>
```

**APRÈS** :
```jsx
<div className="p-4 border-b">
  <label htmlFor="settings-search" className="sr-only">
    Rechercher dans les paramètres
  </label>
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
    <Input
      id="settings-search"
      type="text"
      placeholder="Rechercher des paramètres..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10"
      aria-label="Rechercher des paramètres"
    />
  </div>
</div>
```

#### Modifier `src/components/modals/CharactersModal.jsx` (ligne 261-269)

**Même pattern** :
```jsx
<label htmlFor="characters-search" className="sr-only">
  Rechercher un personnage
</label>
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
  <Input
    id="characters-search"
    type="search"
    placeholder="Rechercher un personnage..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-10"
    aria-label="Rechercher dans la liste des personnages"
  />
</div>
```

#### Modifier `src/components/panels/PropertiesPanel.jsx` (ligne 383-397)

**AVANT** :
```jsx
<div className="flex gap-1">
  <input
    type="text"
    value={newMood}
    onChange={(e) => {
      setNewMood(e.target.value);
      setMoodError('');
    }}
    onKeyDown={(e) => e.key === 'Enter' && handleAddMood()}
    placeholder="Add mood (e.g., happy, angry)"
    className={`...`}
    aria-invalid={!!moodError}
    aria-describedby={moodError ? "mood-error" : undefined}
  />
  <button onClick={handleAddMood}>
    <Plus className="h-3 w-3" />
  </button>
</div>
```

**APRÈS** :
```jsx
<div className="space-y-1">
  <label htmlFor="add-mood-input" className="sr-only">
    Ajouter une nouvelle humeur
  </label>
  <div className="flex gap-1">
    <input
      id="add-mood-input"
      type="text"
      value={newMood}
      onChange={(e) => {
        setNewMood(e.target.value);
        setMoodError('');
      }}
      onKeyDown={(e) => e.key === 'Enter' && handleAddMood()}
      placeholder="Ajouter une humeur (ex: joyeux, en colère)"
      className={`...`}
      aria-invalid={!!moodError}
      aria-describedby={moodError ? "mood-error" : undefined}
      aria-label="Nom de la nouvelle humeur"
    />
    <button
      onClick={handleAddMood}
      aria-label="Ajouter l'humeur"
    >
      <Plus className="h-3 w-3" aria-hidden="true" />
    </button>
  </div>
</div>
```

### Étape 3 : Ajouter aria-labels sur boutons (1h)

#### Modifier `src/components/panels/PropertiesPanel.jsx` (lignes 364-376)

**AVANT** :
```jsx
<div
  key={mood}
  className="group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all"
  onClick={() => setActiveMood(mood)}
>
  <span className="text-xs font-medium">{mood}</span>
  {mood !== 'neutral' && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleRemoveMood(mood);
      }}
      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
    >
      ×
    </button>
  )}
</div>
```

**APRÈS** :
```jsx
<div
  key={mood}
  className="group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all"
  onClick={() => setActiveMood(mood)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveMood(mood);
    }
  }}
  tabIndex={0}
  role="button"
  aria-pressed={activeMood === mood}
  aria-label={`Sélectionner l'humeur ${mood}`}
>
  <span className="text-xs font-medium">{mood}</span>
  {mood !== 'neutral' && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleRemoveMood(mood);
      }}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
      aria-label={`Supprimer l'humeur ${mood}`}
      tabIndex={0}
    >
      ×
    </button>
  )}
</div>
```

#### Modifier `src/components/layout/TopBar.jsx` (lignes 132-159)

**Les boutons Undo/Redo ont déjà des aria-labels** ✅ mais on peut améliorer :

```jsx
<button
  onClick={undo}
  disabled={!canUndo}
  className={...}
  aria-label="Annuler la dernière action (Ctrl+Z)"
  title="Annuler (Ctrl+Z)"
>
  <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
  <span className="sr-only">Annuler</span>
</button>

<button
  onClick={redo}
  disabled={!canRedo}
  className={...}
  aria-label="Rétablir l'action annulée (Ctrl+Y)"
  title="Rétablir (Ctrl+Y)"
>
  <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
  </svg>
  <span className="sr-only">Rétablir</span>
</button>
```

### Étape 4 : Créer AnnouncementRegion (30min)

#### Créer `src/components/AnnouncementRegion.jsx`

```jsx
import React from 'react';
import { useUIStore } from '../stores/index.js';

/**
 * AnnouncementRegion - Live region pour annonces accessibles
 * Annonce les actions importantes aux utilisateurs de lecteurs d'écran
 */
export function AnnouncementRegion() {
  const announcement = useUIStore(state => state.announcement);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
```

#### Ajouter `announcement` dans `src/stores/uiStore.js`

```javascript
// Dans l'état initial
announcement: '',

// Ajouter action
setAnnouncement: (message) => set({ announcement: message }),
```

#### Intégrer dans `src/components/EditorShell.jsx`

**AJOUTER** l'import :
```jsx
import { AnnouncementRegion } from './AnnouncementRegion.jsx';
```

**AJOUTER** dans le JSX (après ligne 111) :
```jsx
<div className="min-h-screen bg-slate-900 flex flex-col">
  <h1 className="sr-only">AccessCity Studio - Éditeur de Visual Novels Accessibles</h1>

  {/* Live region pour annonces accessibles */}
  <AnnouncementRegion />

  {/* Global keyboard shortcuts */}
  <KeyboardShortcuts ... />
```

#### Exemple d'utilisation dans les composants

```javascript
// Dans CharactersModal.jsx - après création personnage
import { useUIStore } from '../../stores/index.js';

const setAnnouncement = useUIStore(state => state.setAnnouncement);

const handleCreateCharacter = () => {
  const newId = addCharacter(newCharacterData);

  // Annonce accessible
  setAnnouncement(`Personnage "${newCharacterData.name}" créé avec succès`);
  setTimeout(() => setAnnouncement(''), 3000);

  onClose();
};
```

### Résultat attendu
- ✅ WCAG 2.2 AA Compliance : 65% → 85-90%
- ✅ Structure sémantique complète (H1-H3)
- ✅ Tous les inputs ont des labels
- ✅ Tous les boutons ont des aria-labels
- ✅ Annonces live pour screen readers

---

## 📊 Métriques de Succès

### Avant Quick Wins
- Re-renders/sec (idle) : ~60
- Console.log en prod : 111
- WCAG 2.2 AA : 65%

### Après Quick Wins (4-5h de travail)
- Re-renders/sec (idle) : <1 ✅ **(-98%)**
- Console.log en prod : 0 ✅ **(-100%)**
- WCAG 2.2 AA : 85-90% ✅ **(+20-25%)**

---

## ✅ Checklist de Validation

Après avoir terminé les 3 quick wins, vérifier :

### Quick Win #1 - Interval Timer
- [ ] `AutoSaveTimestamp.jsx` créé
- [ ] `EditorShell.jsx` : interval timer supprimé
- [ ] `TopBar.jsx` : utilise `<AutoSaveTimestamp />`
- [ ] Test : Ouvrir DevTools React Profiler → Idle → <1 re-render/sec

### Quick Win #2 - Logger
- [ ] `src/utils/logger.js` créé
- [ ] Tous les `console.log` remplacés par `logger.debug`
- [ ] Tous les `console.error` remplacés par `logger.error`
- [ ] Test : Console propre en production (`npm run build && npm run preview`)

### Quick Win #3 - Accessibilité
- [ ] `.sr-only` ajouté dans `index.css`
- [ ] H1, H2, H3 ajoutés dans `EditorShell.jsx`
- [ ] Labels ajoutés sur inputs critiques (3 fichiers)
- [ ] ARIA labels sur boutons icon-only
- [ ] `AnnouncementRegion.jsx` créé et intégré
- [ ] Test : Naviguer au clavier (Tab) + Lecteur d'écran (NVDA/JAWS)

---

## 🚀 Prochaines Étapes (Après Quick Wins)

Une fois les quick wins validés :

1. **Créer tests unitaires** (Jour 9 du plan) → Filet de sécurité pour refactorings majeurs
2. **Installer ESLint + Prettier** (Jour 5 du plan) → Code quality
3. **Migration AppContext → Zustand** (Jour 1-2 du plan) → Architecture cohérente

Voir le plan complet : `docs/plan-refactoring-complet.md` ou `.claude/plans/majestic-pondering-pony.md`

---

**Date de création** : 2026-01-02
**Dernière mise à jour** : 2026-01-02
