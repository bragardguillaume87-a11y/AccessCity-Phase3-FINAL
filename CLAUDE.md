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

> Règles non-déductibles depuis le code — causes des bugs silencieux les plus fréquents sur ce projet.

### Store Split — utiliser les selectors complets

`scenesStore.scenes[n].dialogues` est **toujours `[]`** (architecture Phase 3). Utiliser exclusivement :

```typescript
// UNE scène complète avec dialogues réels (composants éditeur)
import { useSceneWithElements } from '@/stores/selectors';
const scene = useSceneWithElements(sceneId);

// TOUTES les scènes complètes (PreviewPlayer, useValidation)
import { useAllScenesWithElements } from '@/stores/selectors';
const scenes = useAllScenesWithElements(); // ⚠️ Coûteux : abonne aux 3 stores
```

### getState() — dans les handlers uniquement

Appeler `getState()` exclusivement à l'intérieur des handlers et callbacks :

```typescript
const handleDuplicate = useCallback(() => {
  const chars = useSceneElementsStore.getState().getCharactersForScene(id);
}, [id]);
```

### EMPTY_* — constantes module-level pour les fallbacks

Déclarer les fallbacks comme constantes module-level et utiliser `??` :

```typescript
const EMPTY_SCENES: SceneMetadata[] = [];        // module-level, référence stable
const scenes = state?.scenes ?? EMPTY_SCENES;    // ?? pas ||
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

### Déclencheur — "utilise le protocole claude"

Quand l'utilisateur dit **"protocole claude"** ou **"utilise le protocole claude"**, effectuer dans cet ordre **avant toute autre action** :

- Lire `memory/hallucination_patterns.md` — pièges connus sur ce projet
- Lire `memory/validated_patterns.md` — patterns confirmés corrects
- Lire le fichier `.claude/rules/` correspondant à la tâche :

| Si la tâche touche… | → Lire |
| --- | --- |
| MapCanvas, Konva, éditeur 2D | `konva-patterns.md` |
| Assets, upload, chemins fichiers | `tauri-patterns.md` |
| UI, composants, animations, feedback | `nintendo-ux.md` |
| Nouvelle feature, dépendances | `dependencies.md` |
| Stores, selectors, React hooks | `store-patterns.md` |
| Graphe @xyflow, layout Dagre | `graph-patterns.md` |
| Couleurs, typo, espacements | `ui-tokens.md` |

- Puis enchaîner les étapes du protocole ci-dessous (WebSearch → Audit → Contre-vérification → Plan)

### 0. Spec mini-format (avant toute nouvelle feature)

Écrire 3 lignes avant de commencer — réduit les hallucinations et aligne le travail sur le "pourquoi" :

```text
Objectif    : [une phrase — ce que ça fait]
Critères    : [2-3 vérifiables — comment savoir que c'est réussi]
Non-objectif: [ce que ça NE fait PAS — évite le scope creep]
```

> Exemple : "Objectif : Permettre la sélection de couleur dans la textbox. Critères : popover s'ouvre/ferme, couleur appliquée au texte sélectionné, accessible clavier. Non-objectif : pas de palette custom par projet."

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
4. **Plan d'action** : lister les modifications confirmées avant de commencer, au format `fichier → zone → changement → raison`. Exemple : `DialogueBox.tsx → wrapper div → touchAction:none → support tablette (konva-patterns §8)`

### Git — branche dédiée par chantier

Toujours travailler sur une branche dédiée. C'est la mesure de sécurité la plus importante avec Claude Code — permet d'annuler un chantier entier sans perte.

```bash
git checkout -b feat/nom-du-chantier   # avant de commencer
git checkout -b fix/nom-du-bug         # pour un correctif
```

### Agents disponibles (sous-tâches parallèles)

| Agent | Quand l'utiliser |
| --- | --- |
| `Explore` | Exploration codebase, recherche de patterns, questions sur l'architecture |
| `Plan` | Concevoir un plan d'implémentation avant de coder |
| `general-purpose` | Recherches web, tâches multi-étapes complexes |

> ⚠️ Les agents ont ~50-75% de faux positifs sur le pattern-matching — **toujours contre-vérifier par grep** avant de corriger.

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

`store-patterns.md` | `react-patterns.md` | `graph-patterns.md` | `tauri-patterns.md` | `ai-adaptation.md` | `nintendo-ux.md` | `ui-tokens.md` | `dependencies.md` | `konva-patterns.md`

⚠️ Lire `tauri-patterns.md` avant tout audit Tauri (asset.url vs asset.path).
⚠️ Lire `nintendo-ux.md` avant tout travail UI/UX — **boussole rapide en début de fichier** pour trouver le bon conseiller sans lire tout le fichier.
⚠️ Lire `ui-tokens.md` pour les couleurs, typo, espacements, z-index du projet (résumé de `src/styles/tokens.css`).
⚠️ Lire `dependencies.md` avant toute nouvelle feature (checklist anti-hardcoding + libs disponibles).
⚠️ Lire `konva-patterns.md` avant tout travail sur MapCanvas ou react-konva (dragend bubbling, coordonnées, Transformer).

## 8. Mémoire persistante → `memory/`

Consultée en début de session via le déclencheur §6. Fichiers clés :

- `hallucination_patterns.md` — ⚠️ anti-patterns connus sur CE projet (stores, Tauri, Konva, z-index, build)
- `validated_patterns.md` — ✅ patterns confirmés corrects — ne pas remettre en question sans grep
- `feedback_*.md` — préférences et corrections de l'utilisateur

### Quand mettre à jour ces fichiers

| Événement | Action |
| --- | --- |
| Nouvelle erreur découverte (bug causé par un mauvais pattern) | Ajouter dans `hallucination_patterns.md` |
| Pattern confirmé correct après grep + build réussi | Ajouter dans `validated_patterns.md` |
| L'utilisateur corrige une approche ("non, fais plutôt…") | Créer ou mettre à jour un `feedback_*.md` |
| Un pattern existant est devenu obsolète (refacto, migration) | Supprimer ou barrer l'entrée concernée |

## 9. Hooks Claude Code → `.claude/settings.json`

Des hooks shell s'exécutent automatiquement sur certains événements (post-Edit, post-Stop, etc.).
Le projet utilise `tools/ux-audit-hook.cjs`. Ne pas dupliquer la logique des hooks dans le code.

---

## ⚠️ RAPPEL CRITIQUE — Duplication intentionnelle

> Les 2 invariants les plus fréquemment violés, répétés ici pour renforcer la compliance en fin de session.
> Technique : primacy/recency bias — source : HackerNews + dev.to community research, 2026.

- **Store Split** : utiliser `useSceneWithElements(id)` — `scenesStore.scenes[n].dialogues` est **toujours `[]`**
- **getState()** : appeler uniquement dans les handlers/callbacks, jamais pendant le render

---

**Dernière mise à jour** : 2026-03-22 par Claude Sonnet 4.6
