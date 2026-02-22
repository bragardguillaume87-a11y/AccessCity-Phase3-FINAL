# AccessCity Visual Novel Editor — Guide pour IA

> **Version**: Phase 3 FINAL
> **Dernière mise à jour**: 2026-02-18
> **Stack**: React 18, TypeScript, Zustand, Vite 7, @xyflow/react

---

## 1. Contexte du Projet

**AccessCity** est un éditeur visuel de visual novel permettant de créer des scènes interactives avec dialogues, choix narratifs, personnages animés et système de variables. L'éditeur propose :

- **Éditeur de scènes** : Canvas drag-and-drop pour positionner personnages, props, textboxes
- **Éditeur de dialogues** : Wizard multi-étapes avec choix simples, complexes (conditions/effets), et jet de dés
- **Graphe de dialogues** : Visualisation interactive avec @xyflow/react (thème Cosmos custom)
- **Système de personnages** : Moods multiples, animations, stats RPG
- **Preview & Export** : Lecture en temps réel, export JSON

**Choix techniques** :

- **Zustand** : State management avec undo/redo (temporal middleware) et persistence localStorage
- **@xyflow/react** : Graphe de dialogues avec layout Dagre + routage Serpentine custom
- **Vite 7** : Build rapide avec code splitting manuel (chunks vendor-react, vendor-flow, etc.)
- **TypeScript** : Mode `strict: false` avec flags granulaires activés (noUnusedLocals, noUnusedParameters)

---

## 2. Organisation du Code

```text
src/
├── components/          # Composants UI React
│   ├── features/        # Graphe de dialogues (DialogueGraph, nodes custom)
│   ├── modals/          # Modales (CharactersModal, SettingsModal, etc.)
│   ├── panels/          # Panneaux (MainCanvas, ScenesSidebar, UnifiedPanel)
│   ├── dialogue-editor/ # Wizards de création de dialogues
│   ├── character-editor/# Wizards de création de personnages
│   └── ui/             # Composants UI réutilisables (shadcn/ui base)
├── stores/             # Zustand stores + selectors
│   ├── scenesStore.ts      # Scènes métadonnées uniquement (⚠️ dialogues VIDES)
│   ├── dialoguesStore.ts   # Dialogues par scène
│   ├── sceneElementsStore.ts # Characters, textBoxes, props par scène
│   ├── selectionStore.ts   # Sélection globale (scène/dialogue/personnage)
│   ├── settingsStore.ts    # Paramètres projet + variables
│   ├── uiStore.ts          # État UI (modales, panels, graph config)
│   └── selectors/          # Selectors memoized (TOUJOURS utiliser ces exports)
├── hooks/              # Custom React hooks
│   ├── useDialogueGraph.ts # Transform store data → graph format
│   ├── useValidation.ts    # Validation multi-domaine
│   ├── useSelection.ts     # Selection logic
│   └── graph-utils/        # Helpers pour layout Dagre + Serpentine
├── core/               # Business logic (zéro dépendance React)
│   ├── engine.ts           # Moteur de jeu (conditions, effets, choix)
│   └── StageDirector.ts    # Orchestration scènes/dialogues
├── facades/            # EditorFacade (100+ méthodes aggregées)
├── config/             # Configuration et constantes
│   ├── colors.ts           # Palette de couleurs centralisée
│   ├── cosmosConstants.ts  # Thème Cosmos (graph custom)
│   ├── handleConfig.ts     # Configuration handles @xyflow
│   ├── edgeRegistry.ts     # Registry edges par thème
│   └── layoutConfig.ts     # Config layout graph (Dagre params)
├── types/              # Types TypeScript centralisés
├── utils/              # Utilitaires purs (pas de hooks React)
└── i18n/               # Internationalisation (fr/en)
```

**Règle de dépendance** :

- `core/` → ZÉRO dépendance React/Zustand
- `stores/` → Ne dépendent jamais de `components/`
- `components/` → Utilisent `stores/` via selectors uniquement
- `hooks/` → Pont entre `stores/` et `components/`

---

## 3. Patterns Essentiels

### 3.1 Stores Zustand — RÈGLES CRITIQUES

**✅ TOUJOURS utiliser les selectors memoized** :

```typescript
// ❌ MAUVAIS : Inline selector (re-render à chaque mutation du store)
const scenes = useScenesStore(state => state.scenes);

// ✅ BON : Selector memoized (re-render uniquement si scenes change)
import { useScenes } from '@/stores/selectors/sceneSelectors';
const scenes = useScenes();
```

**✅ Mutations via `set()` uniquement** :

```typescript
// ❌ MAUVAIS : Mutation directe
store.getState().addScene('New');

// ✅ BON : Via selector d'action
const { addScene } = useScenesStore(state => ({
  addScene: state.addScene,
}));
addScene('New');
```

**✅ Middleware stack order** (important pour undo/redo) :

```typescript
// Order: temporal → persist → devtools → subscribeWithSelector → create()
export const useScenesStore = create<ScenesState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set) => ({ /* ... */ })),
        { name: 'ScenesStore' }
      ),
      { name: 'scenes-storage' }
    ),
    { limit: 50 }  // 50-state undo history
  )
);
```

### 3.2 Graphe de Dialogues — @xyflow/react

**✅ Immutabilité stricte** :

```typescript
// ❌ MAUVAIS : Mutation directe d'un node
nodes[0].position = { x: 100, y: 200 };

// ✅ BON : Setters immutables
setNodes((nds) => nds.map(n =>
  n.id === nodeId ? { ...n, position: newPos } : n
));
```

**✅ Custom nodes : memo + forwardRef** :

```typescript
import { memo, forwardRef } from 'react';
import type { NodeProps } from '@xyflow/react';

const DialogueNode = memo(forwardRef<HTMLDivElement, NodeProps>(
  function DialogueNode({ id, data }, ref) {
    return <div ref={ref}>{data.text}</div>;
  }
));
```

**✅ Layout : Dagre + Serpentine custom** :

- **Dagre** : Layout hiérarchique initial (TB ou LR)
- **Serpentine** : Re-routage des edges pour éviter overlaps quand Y-distance > seuil
- Voir `hooks/graph-utils/applySerpentineLayout.ts`

### 3.3 Composants React

**✅ Taille max : 300 lignes** (split si dépassement)

**✅ Props typées, jamais `any`** :

```typescript
// ❌ MAUVAIS
interface Props { data: any; }

// ✅ BON
interface Props {
  data: Dialogue;
  onUpdate: (id: string, updates: Partial<Dialogue>) => void;
}
```

**✅ Pas d'inline handlers** :

```typescript
// ❌ MAUVAIS : Re-créé à chaque render
<button onClick={() => handleClick(id)} />

// ✅ BON : Stable avec useCallback
const onClick = useCallback(() => handleClick(id), [id]);
<button onClick={onClick} />
```

### 3.4 TypeScript

**Flags actuels** :

```json
{
  "strict": false,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitAny": false,
  "strictNullChecks": false
}
```

**Règles** :

- ✅ Toujours typer les retours de fonctions publiques
- ✅ Interfaces pour props React, types pour data pure
- ❌ Jamais `as any` (utiliser type guards ou génériques)
- ✅ Companion files `.types.ts` pour types volumineux

---

## 4. Vérification & Tests

### Commandes essentielles

```bash
# TypeScript check (rapide)
npm run typecheck

# Lint + Fix
npm run lint:fix

# Tests unitaires (Vitest)
npm run test:unit

# Build production
npm run build
# ✅ Doit réussir avec 0 erreurs TS
```

### Avant chaque commit

```bash
npm run typecheck && npm run lint && npm run test:unit
```

**Seuils de qualité** :

- TypeScript : 0 erreurs (strict)
- ESLint : 0 warnings
- Tests unitaires : >80% coverage sur `core/` et `stores/`
- Build : <600KB main chunk (actuel: 595KB)

---

## 5. Tâches Courantes

### Ajouter un nouveau type de dialogue

1. **Ajouter le type dans `types/index.ts`** :

   ```typescript
   export interface TimedDialogue extends Dialogue {
     type: 'timed';
     duration: number;
   }
   ```

2. **Mettre à jour le wizard** dans `dialogue-editor/DialogueWizard/` :
   - Ajouter une étape dans `StepComplexity.tsx`
   - Créer un builder dans `components/` si besoin

3. **Mettre à jour le graphe** :
   - Ajouter un custom node dans `features/graph-nodes/`
   - Enregistrer dans `features/graph-nodes/index.ts`

4. **Mettre à jour le moteur** dans `core/engine.ts` :
   - Ajouter la logique d'exécution dans `processDialogue()`

### Ajouter un nouveau mood à un personnage

1. **Via CharactersModal** : Éditer personnage → Moods → "Ajouter un mood"

2. **Programmatiquement** :

   ```typescript
   const { updateCharacter } = useCharactersStore(s => ({
     updateCharacter: s.updateCharacter
   }));

   updateCharacter(characterId, {
     moods: [...character.moods, {
       name: 'Excité',
       avatar: '/path/to/avatar.png',
       expression: 'excited'
     }]
   });
   ```

### Modifier le layout du graphe

**Fichiers concernés** :

- `hooks/useNodeLayout.ts` : Calcul positions Dagre
- `hooks/graph-utils/applySerpentineLayout.ts` : Serpentine routing
- `config/layoutConfig.ts` : Paramètres Dagre (rankSep, nodeSep, etc.)

**Exemple : Augmenter l'espacement vertical** :

```typescript
// Dans layoutConfig.ts
export const DAGRE_CONFIG = {
  rankSep: 150,  // 100 → 150 (espacement entre rangs)
  nodeSep: 80,   // Espacement horizontal
};
```

### Ajouter une nouvelle variable de jeu

1. **Via SettingsModal** : Settings → Variables → "Ajouter variable"

2. **Programmatiquement** :

   ```typescript
   const { addVariable } = useSettingsStore(s => ({
     addVariable: s.addVariable
   }));

   addVariable({
     name: 'reputation',
     type: 'number',
     initialValue: 50,
     min: 0,
     max: 100
   });
   ```

---

## 6. Pièges & Gotchas

### 6.1 Store Selection — Éviter les re-renders

**❌ Problème** : Component re-render sur TOUTE mutation du store

```typescript
// ❌ MAUVAIS : Re-render quand N'IMPORTE QUOI change dans scenesStore
function MyComponent() {
  const store = useScenesStore();  // Sélection du store entier
  return <div>{store.scenes.length}</div>;
}
```

**✅ Solution** : Sélection granulaire avec `useShallow`

```typescript
import { useShallow } from 'zustand/react/shallow';

function MyComponent() {
  const scenesCount = useScenesStore(
    useShallow(state => state.scenes.length)
  );
  return <div>{scenesCount}</div>;
}
```

### 6.2 Graph Updates — Mutation détectée comme "pas de changement"

**❌ Problème** : React Flow ne détecte pas le changement

```typescript
// ❌ MAUVAIS : Même référence tableau, React Flow ignore
nodes[0].position = { x: 100, y: 200 };
setNodes(nodes);  // Pas de re-render!
```

**✅ Solution** : Nouvelle référence immutable

```typescript
setNodes(nds => nds.map(n =>
  n.id === nodeId ? { ...n, position: { x: 100, y: 200 } } : n
));
```

### 6.3 localStorage Hydration — Timing race condition

**❌ Problème** : Component mount avant hydration du store

**✅ Solution** : Attendre `hasHydrated` flag

```typescript
import { useScenesStore } from '@/stores';

function MyComponent() {
  const hasHydrated = useScenesStore(s => s._hasHydrated);
  const scenes = useScenes();

  if (!hasHydrated) return <LoadingSpinner />;
  return <ScenesList scenes={scenes} />;
}
```

### 6.4 Undo/Redo — Ne fonctionne pas après persist

**Cause** : Temporal middleware doit wrapper persist, pas l'inverse

```typescript
// ❌ MAUVAIS ordre
persist(temporal(create(...)))  // Undo/redo cassé

// ✅ BON ordre
temporal(persist(create(...)))  // Undo/redo fonctionne
```

### 6.5 EditorFacade — Méthodes sync vs async

Les méthodes de `EditorFacade` retournent des valeurs sync (IDs), pas de Promises

```typescript
// ❌ MAUVAIS
const id = await facade.addScene('New');

// ✅ BON
const id = facade.addScene('New');  // string ID immédiat
```

### 6.6 Store Split — selectors corrects selon le contexte

**Contexte** : Les données sont réparties dans 3 stores :

- `scenesStore` : métadonnées (id, title, backgroundUrl) — **tableaux vides intentionnels**
- `dialoguesStore` : dialogues par scène
- `sceneElementsStore` : characters, textBoxes, props

**❌ Problème** : `useScenesStore(state.scenes)` retourne des scènes avec `dialogues = []` toujours vide

```typescript
// ❌ MAUVAIS : pour 1 scène
const selectedScene = useScenesStore(s => s.scenes.find(sc => sc.id === sceneId));
// ❌ MAUVAIS : pour toutes les scènes (Preview, Validation)
const scenes = useScenesStore(state => state.scenes);
```

**✅ Solution selon le contexte** :

```typescript
// ✅ UNE scène complète (composants éditeur)
import { useSceneWithElements } from '@/stores/selectors';
const selectedScene = useSceneWithElements(sceneId);

// ✅ TOUTES les scènes complètes (PreviewPlayer, useValidation)
import { useAllScenesWithElements } from '@/stores/selectors';
const scenes = useAllScenesWithElements();
// ⚠️ Coûteux : abonne aux 3 stores → réserver aux composants qui en ont besoin
```

### 6.7 getState() — render vs handlers

```typescript
// ❌ MAUVAIS : getState() pendant le render → données stale, pas réactif
if (selectedElement.type === 'sceneCharacter') {
  const chars = useSceneElementsStore.getState().getCharactersForScene(id);
}

// ✅ BON : getState() dans un handler/callback → lecture ponctuelle correcte
const handleDuplicate = useCallback(() => {
  const chars = useSceneElementsStore.getState().getCharactersForScene(id);
}, [id]);
```

### 6.8 Custom Graph Edges — Type registry

```typescript
// ❌ MAUVAIS : Edge type hardcodé
<ReactFlow edgeTypes={{ customEdge: MyEdge }} />

// ✅ BON : Via registry centralisé
import { getEdgeTypes } from '@/config/edgeRegistry';
const edgeTypes = useMemo(() => getEdgeTypes(theme.id), [theme.id]);
<ReactFlow edgeTypes={edgeTypes} />
```

---

## 7. Liens & Références

### Documentation interne

- **Architecture stores** : [`src/stores/README.md`](src/stores/README.md)
- **Architecture graph** : [`src/components/features/README.md`](src/components/features/README.md)
- **Hooks custom** : [`src/hooks/README.md`](src/hooks/README.md)
- **React patterns** : [`.claude/rules/react-patterns.md`](.claude/rules/react-patterns.md)
- **Store patterns** : [`.claude/rules/store-patterns.md`](.claude/rules/store-patterns.md)
- **Graph patterns** : [`.claude/rules/graph-patterns.md`](.claude/rules/graph-patterns.md)
- **Adaptation IA** : [`.claude/rules/ai-adaptation.md`](.claude/rules/ai-adaptation.md)

### Documentation externe

- **@xyflow/react** : [reactflow.dev/learn](https://reactflow.dev/learn)
- **Zustand** : [zustand.docs.pmnd.rs](https://zustand.docs.pmnd.rs/)
- **Vite 7** : [vitejs.dev](https://vitejs.dev/)
- **TypeScript config** : [typescriptlang.org/tsconfig](https://www.typescriptlang.org/tsconfig)

### Configuration

- **Commands** : [`package.json`](package.json) (scripts section)
- **TypeScript config** : [`tsconfig.json`](tsconfig.json)
- **Vite config** : [`vite.config.ts`](vite.config.ts)
- **ESLint** : [`.eslintrc.cjs`](.eslintrc.cjs)

---

## 8. Protocole Code

### Processus systématique pour toute modification de code

**Avant chaque chantier** :

1. **Recherche internet** : Vérifier les best practices actuelles via WebSearch. **Obligatoire.**
2. **Audit ciblé** : Scanner les fichiers concernés (Grep + Read), comprendre le contexte
3. **Contre-vérification** : Croiser les findings avec le code réel avant d'accepter un rapport — les agents de sous-tâches ont un taux de faux positifs de ~50-75% sur les pattern-matching architecturaux
4. **Plan d'action** : Lister les modifications confirmées avant de commencer

**Pendant les modifications** :

1. **Cohérence** : Suivre les patterns déjà en place (imports, nommage, structure)
2. **Vérification incrémentale** : `npx tsc --noEmit` après chaque lot de changements
3. **Pas d'over-engineering** : Résoudre le problème, rien de plus

**Après les modifications** :

1. **TypeScript** : 0 erreurs (`npx tsc --noEmit`)
2. **Build** : Succès (`npx vite build`)
3. **Résumé non-technique** : Expliquer ce qui a changé en termes simples

### Vérification d'audit (étape critique)

Quand un agent/audit annonce N violations :

```bash
# Vérifier par grep avant de corriger
grep -r "pattern_suspect" src/ --include="*.tsx" --include="*.ts"
# Si 0 résultats → les composants reçoivent la donnée par props (tracer la chaîne)
# Si N résultats → confirmer le contexte (render ? handler ? prop ?)
```

### Qualité maximale (protocole renforcé)

Quand l'utilisateur demande "qualité maximale" ou "protocole code" :

- Recherche internet **approfondie** (3+ requêtes sur les patterns concernés)
- Audit **exhaustif** + contre-vérification systématique des findings
- Tests de non-régression supplémentaires si disponibles

---

## Notes de Version

**Vague 8 (complétée 2026-02-14)** :

- ✅ Centralisation couleurs (COSMOS_COLORS, GRAPH_COLORS, NODE_COLORS)
- ✅ Cleanup console.log → logger.debug
- ✅ Extraction DialogueGraph (useLocalGraphState hook, -126 lignes)
- ✅ Performance ReactFlow (edgeTypes/defaultEdgeOptions memoized)
- ✅ TypeScript noUnusedLocals/noUnusedParameters activés (138 erreurs corrigées)

**Vague 9 (complétée 2026-02-18)** :

- ✅ Phase 1 : Documentation AI-ready (CLAUDE.md, .claude/rules/, READMEs)
- ✅ Phase 2 : Consolidation CharactersModal (V1+V2 → V2 unique)
- ✅ Phase 3 : Refactor scenesStore (758L → 250L + dialoguesStore + sceneElementsStore)
- ✅ Pro mode graphe (3 phases : Dagre TB/LR, clusters repliables, pagination)
- ✅ Bug hunt global : useGameState stale closures, cascade delete sync, EditorFacade, sceneSelectors dead code

**Vague 10 (complétée 2026-02-18)** :

- ✅ Fix critique : PreviewPlayer → `useAllScenesWithElements()` (jeu preview fonctionnel)
- ✅ Fix critique : useValidation → `useAllScenesWithElements()` (validation réelle des dialogues)
- ✅ Fix HUDVariables icônes → `GAME_STATS` constants
- ✅ Simplification selectionStore (579L → 249L sur 3 fichiers : store + types + helpers)
- ✅ Migration local state → uiStore (EditorShell : 7 useState supprimés, -80 KB bundle)
- ✅ Magic numbers → `AUDIO_DEFAULTS` (0.5/0.7, 12 fichiers) + `LAYER_Z_INDEX` local
- ✅ Type safety : 3 `any` → 0 (tests mocks + Zod schema)

**Vague 11 (complétée 2026-02-20)** :

- ✅ Tests unitaires : 64/64 passent (0 échec)
  - `scenesStore.test.js` : mis à jour pour architecture Phase 3 (métadonnées seules)
  - `dialoguesStore.test.js` : nouveau (10 tests, dialogue CRUD)
  - `AutoSaveTimestamp.test.jsx` : mis à jour pour `AutoSaveIndicator` (API props)
  - `DialogueFactory.createEmpty` : corrigé (bypass validation Zod intentionnel)
  - `useEditorLogic.test.ts` : corrigé (auto-sélection useEffect au mount)
  - `vitest.config.js` : `e2e/` exclu du runner Vitest (Playwright uniquement)
- ✅ Type split `SceneMetadata` vs `Scene` (10 fichiers)
  - `types/scenes.ts` : `SceneMetadata` déplacé hors de scenesStore → exporté depuis types
  - `scenesStore.ts` : `state.scenes: SceneMetadata[]` (sans arrays dialogues/characters)
  - `sceneSelectors.ts` : `useSceneById` / `useScenes` retournent `SceneMetadata`
  - `facades/EditorFacade.ts` : API typée `SceneMetadata`, `SceneFactory.clone()` supprimé
  - `CommandPalette.tsx` : bug count dialogues = 0 fixé → `useAllScenesWithElements()`
  - `LeftPanel.tsx` : `DialogueWizard` reçoit `Scene[]` réels (ChoiceCard liait vers []  vide)
  - `ScenesSidebar.tsx` : `handleDuplicateScene` réécrit (copie vers dialoguesStore + sceneElementsStore)
  - `CharactersModal/useCharacterUsage.ts` : lit `sceneElementsStore` directement (plus `scene.characters`)
  - `ProblemsPanel.tsx`, `ChoiceEditor.tsx`, `DialoguePropertiesForm.tsx` : types alignés

**Vague 12 (complétée 2026-02-20)** :

- ✅ Refonte panel dialogue gauche (`DialogueCard`)
  - Speaker : couleur dynamique par personnage (hash stable), truncate 1 ligne
  - Texte : `line-clamp-2` (remplace `substring(0,50)`)
  - Badge type toujours visible : Simple / N choix / 🎲 Dé
  - Actions toujours visibles (supprime `opacity-0 group-hover:opacity-100`)
  - Response index : `useMemo` (corrige O(N²) non-memoized)
- ✅ Timeline fonctionnelle (`TimelinePlayhead` + `useDialogueSync` + `MainCanvas`)
  - `utils/dialogueDuration.ts` (nouveau) : estimation durée par longueur texte
  - Marqueurs positionnés par durée cumulée réelle (plus uniformément espacés)
  - Clic marqueur → seek + sélection dialogue dans l'éditeur
  - Double-clic marqueur → seek + Play
  - `handleSeek` câblé : time → `getDialogueIndexAtTime` → `onSelectDialogue`
  - `duration` : `getSceneDuration` (remplace `dialoguesCount * 5`)
- ✅ Lecture preview intégrée (`DialoguePreviewOverlay`)
  - Props `isAutoPlaying` + `onAutoPlayComplete`
  - Auto-advance : typewriter complète → 1.2s → dialogue suivant
  - S'arrête aux choix (user doit décider la branche) et au dernier dialogue
  - Play → auto-sélection premier dialogue si aucun sélectionné

---

**Dernière mise à jour** : 2026-02-20 par Claude Sonnet 4.6
**Longueur** : ~455 lignes
