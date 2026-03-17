# AccessCity Visual Novel Editor — Guide pour IA

> **Version**: Phase 3 FINAL | **Stack**: React 19, TypeScript, Zustand 5, Vite 7, @xyflow/react

---

## 1. Contexte du Projet

**AccessCity** est un éditeur visuel de visual novel avec :

- **Éditeur de scènes** : Canvas drag-and-drop (personnages, props, textboxes)
- **Éditeur de dialogues** : Wizard multi-étapes (choix simples, conditions/effets, jet de dés)
- **Graphe de dialogues** : Visualisation @xyflow/react (thème Cosmos custom, layout Dagre + Serpentine)
- **Système de personnages** : Moods multiples, animations, stats RPG
- **Preview & Export** : Lecture en temps réel, export JSON

**Choix techniques** : Zustand (undo/redo temporal middleware + localStorage), TypeScript `strict: false` + `noUnusedLocals/noUnusedParameters`, Vite 7 (code splitting manuel).

---

## 2. Organisation du Code

```text
src/
├── components/          # UI React
│   ├── features/        # Graphe de dialogues (DialogueGraph, nodes custom)
│   ├── modals/          # Modales (CharactersModal, SettingsModal, etc.)
│   ├── panels/          # Panneaux (MainCanvas, ScenesSidebar, UnifiedPanel)
│   ├── dialogue-editor/ # Wizards création dialogues
│   ├── character-editor/# Wizards création personnages
│   └── ui/              # Composants réutilisables (shadcn/ui base)
├── stores/              # Zustand stores + selectors
│   ├── scenesStore.ts       # ⚠️ Métadonnées UNIQUEMENT (dialogues VIDES)
│   ├── dialoguesStore.ts    # Dialogues par scène
│   ├── sceneElementsStore.ts# Characters, textBoxes, props par scène
│   ├── selectionStore.ts    # Sélection globale
│   ├── settingsStore.ts     # Paramètres projet + variables
│   ├── uiStore.ts           # État UI (modales, panels, graph config)
│   └── selectors/           # ← TOUJOURS utiliser ces exports memoized
├── hooks/               # Custom React hooks
├── core/                # Business logic (zéro dépendance React)
│   ├── engine.ts            # Moteur de jeu (conditions, effets, choix)
│   └── StageDirector.ts     # Orchestration scènes/dialogues
├── facades/             # EditorFacade (API aggregée, retours sync)
├── config/              # Couleurs, layout graph, handles, edgeRegistry
├── types/               # Types TypeScript centralisés
├── utils/               # Utilitaires purs (pas de hooks React)
└── i18n/                # Internationalisation (fr/en)
```

**Règles de dépendance** :

- `core/` → ZÉRO dépendance React/Zustand
- `stores/` → Ne dépendent jamais de `components/`
- `components/` → Utilisent `stores/` via selectors uniquement
- `hooks/` → Pont entre `stores/` et `components/`

---

## 3. Invariants Critiques

> Ces pièges causent des bugs silencieux difficiles à détecter. Toujours vérifier.

### Store Split — sélecteur selon le contexte

`scenesStore.scenes` retourne des scènes avec `dialogues = []` **toujours vide** (architecture Phase 3).

```typescript
// ❌ MAUVAIS : dialogues vides
const scene = useScenesStore(s => s.scenes.find(sc => sc.id === id));

// ✅ UNE scène complète (composants éditeur)
import { useSceneWithElements } from '@/stores/selectors';
const scene = useSceneWithElements(sceneId);

// ✅ TOUTES les scènes (PreviewPlayer, useValidation)
import { useAllScenesWithElements } from '@/stores/selectors';
const scenes = useAllScenesWithElements(); // ⚠️ Coûteux : abonne aux 3 stores
```

### getState() — render vs handlers

```typescript
// ❌ MAUVAIS : getState() pendant le render → données stale
const chars = useSceneElementsStore.getState().getCharactersForScene(id);

// ✅ BON : getState() dans un handler/callback uniquement
const handleDuplicate = useCallback(() => {
  const chars = useSceneElementsStore.getState().getCharactersForScene(id);
}, [id]);
```

### Pattern EMPTY_* — références stables

```typescript
// ❌ MAUVAIS : || [] inline → nouvelle référence → boucle infinie React 18/19
const scenes = state?.scenes || [];

// ✅ BON : constante module-level
const EMPTY_SCENES: SceneMetadata[] = [];
const scenes = state?.scenes ?? EMPTY_SCENES;
```

---

## 4. Vérification & Tests

```bash
npm run typecheck          # TypeScript (0 erreurs requis)
npm run lint:fix           # ESLint
npm run test:unit          # Vitest (>80% coverage core/ + stores/)
npm run build              # Build prod (<600KB main chunk)

# Avant chaque commit
npm run typecheck && npm run lint && npm run test:unit
```

---

## 5. Tâches Courantes

### Ajouter un type de dialogue

1. Ajouter l'interface dans `types/index.ts`
2. Mettre à jour le wizard dans `dialogue-editor/DialogueWizard/StepComplexity.tsx`
3. Ajouter un custom node dans `features/graph-nodes/` + l'enregistrer dans `index.ts`
4. Ajouter la logique dans `core/engine.ts → processDialogue()`

### Modifier le layout du graphe

- `hooks/useNodeLayout.ts` : positions Dagre
- `hooks/graph-utils/applySerpentineLayout.ts` : Serpentine routing
- `config/layoutConfig.ts` : paramètres Dagre (`rankSep`, `nodeSep`)

### Ajouter une variable de jeu

Via SettingsModal → Variables → "Ajouter variable", ou programmatiquement via `useSettingsStore(s => s.addVariable)`.

### Ajouter un mood à un personnage

Via CharactersModal → Éditer personnage → Moods, ou via `useCharactersStore(s => s.updateCharacter)`.

---

## 6. Protocole Code

### Avant chaque chantier

1. **WebSearch** : vérifier best practices actuelles. **Obligatoire.**

   > **Règle anti-hardcoding** : La raison principale du WebSearch est de détecter si une bibliothèque open source ou un preset standard résout déjà le problème avant d'implémenter. Ne jamais créer de tables de données codées en dur (lookup tables, listes de valeurs, configurations statiques) quand une lib maintenue existe.
   >
   > Exemples appliqués dans ce projet :
   > - Animations sprite → `SpriteSheetConfig` configurable (pas de frames hardcodées)
   > - Layout graphe → Dagre (lib) + `config/layoutConfig.ts` (pas de positions fixes)
   > - Audio procédural → Web Audio API natif (pas de fichiers WAV bundlés)
   > - Moteur de jeu → Excalibur.js (pas de renderer WebGL maison)
   >
   > ⚠️ Lire `.claude/rules/dependencies.md` pour la checklist complète et les anti-patterns.

2. **Audit ciblé** : Grep + Read sur les fichiers concernés
3. **Contre-vérification** : les agents sous-tâches ont ~50-75% faux positifs sur pattern-matching — toujours vérifier par grep avant de corriger
4. **Plan d'action** : lister les modifications confirmées avant de commencer

### Pendant les modifications

1. **Cohérence** : suivre les patterns en place (imports, nommage, structure)
2. **Vérification incrémentale** : `npx tsc --noEmit` après chaque lot
3. **Pas d'over-engineering** : résoudre le problème, rien de plus

### Après les modifications

1. TypeScript : 0 erreurs
2. Build : succès
3. Résumé non-technique : expliquer ce qui a changé simplement

### Audit — vérification avant correction

```bash
grep -r "pattern_suspect" src/ --include="*.tsx" --include="*.ts"
# 0 résultats → donnée reçue par props (tracer la chaîne)
# N résultats → confirmer le contexte (render ? handler ? prop ?)
```

### Qualité maximale (protocole renforcé)

Quand l'utilisateur demande "qualité maximale" ou "protocole code" :

- WebSearch approfondie (3+ requêtes)
- Audit exhaustif + contre-vérification systématique
- Tests de non-régression supplémentaires

---

## 7. Règles détaillées → `.claude/rules/`

`store-patterns.md` | `react-patterns.md` | `graph-patterns.md` | `tauri-patterns.md` | `ai-adaptation.md` | `nintendo-ux.md` | `dependencies.md` | `konva-patterns.md`

⚠️ Lire `tauri-patterns.md` avant tout audit Tauri (asset.url vs asset.path).
⚠️ Lire `nintendo-ux.md` avant tout travail UI/UX (composants, animations, feedback).
⚠️ Lire `dependencies.md` avant toute nouvelle feature (checklist anti-hardcoding + libs disponibles).
⚠️ Lire `konva-patterns.md` avant tout travail sur MapCanvas ou react-konva (dragend bubbling, coordonnées, Transformer).

---

**Dernière mise à jour** : 2026-03-08 par Claude Sonnet 4.6
