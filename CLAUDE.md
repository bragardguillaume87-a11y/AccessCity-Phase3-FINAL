# AccessCity Visual Novel Editor — Guide pour IA

> **Version**: Phase 3 FINAL | **Stack**: React 19, TypeScript, Zustand 5, Vite 7, @xyflow/react

---

## 1. Contexte du Projet

**AccessCity** est un éditeur visuel de visual novel avec :

- **Éditeur de scènes** : Canvas drag-and-drop (personnages, props, textboxes)
- **Éditeur de dialogues** : Wizard multi-étapes (choix simples, conditions/effets, jet de dés, mini-jeux FALC/QTE/Braille) + DialogueComposerV2
- **Graphe de dialogues** : Visualisation @xyflow/react (thème Cosmos custom, layout Dagre + Serpentine)
- **Système de personnages** : Moods multiples, animations DragonBones-style, éditeur osseux (marionette), stats RPG
- **Éditeur 2D** : TopdownEditor (react-konva), GamePreview (Excalibur.js), BehaviorGraph (IA NPC)
- **Preview & Export** : Lecture en temps réel, export JSON

**Choix techniques** : Zustand (undo/redo temporal middleware + localStorage), TypeScript `strict: false` + `noUnusedLocals/noUnusedParameters`, Vite 7 (code splitting manuel).

---

## 2. Organisation du Code

```text
src/
├── components/          # UI React
│   ├── features/        # Graphe de dialogues (DialogueGraph, nodes custom)
│   ├── modals/          # Modales (CharactersModal, SettingsModal, etc.)
│   ├── panels/          # Panneaux (MainCanvas, ScenesBrowser, UnifiedPanel)
│   ├── modules/         # Sous-applications lourdes (lazy-loaded)
│   │   ├── TopdownEditor/   # Éditeur 2D react-konva
│   │   ├── GamePreview/     # Moteur Excalibur.js
│   │   ├── BehaviorGraph/   # IA NPC no-code
│   │   └── DistributionModule/
│   ├── dialogue-editor/ # Wizards création dialogues (DialogueWizard, DialogueComposerV2)
│   ├── character-editor/# Wizards création personnages
│   └── ui/              # Composants réutilisables (shadcn/ui base)
├── stores/              # Zustand stores + selectors
│   ├── scenesStore.ts       # ⚠️ Métadonnées UNIQUEMENT (dialogues VIDES)
│   ├── dialoguesStore.ts    # Dialogues par scène
│   ├── sceneElementsStore.ts# Characters, textBoxes, props par scène
│   ├── selectionStore.ts    # Sélection globale
│   ├── charactersStore.ts   # Personnages + moods
│   ├── settingsStore.ts     # Paramètres projet + variables de jeu (fixes)
│   ├── uiStore.ts           # État UI (modales, panels, graph config)
│   └── selectors/           # ← TOUJOURS utiliser ces exports memoized
├── hooks/               # Custom React hooks
├── core/                # Business logic (zéro dépendance React)
│   ├── DialogueEngine.ts    # Moteur dialogues (class DialogueEngine — loadScene/handleChoice)
│   ├── engine.ts            # Moteur Excalibur.js (GameScene)
│   ├── ConditionEvaluator.ts
│   ├── VariableManager.ts
│   ├── EventBus.ts
│   └── dialogueIntegrity.ts
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
npm run test:unit          # Vitest (cible >80% coverage core/ + stores/ — actuel ~12%)
npm run build:vite         # Build prod (chunk principal <700KB brut / <200KB gzip)

# Avant chaque commit
npm run typecheck && npm run lint && npm run test:unit
```

---

## 5. Tâches Courantes

### Ajouter un type de dialogue

1. Ajouter l'interface dans `types/index.ts`
2. Créer un builder dans `dialogue-editor/DialogueWizard/components/` (ex: `MonTypeChoiceBuilder/`) sur le modèle de `ComplexChoiceBuilder/`, `DiceChoiceBuilder/`, `MinigameChoiceBuilder/`
3. Ajouter un custom node dans `features/graph-nodes/` + l'enregistrer dans `index.ts`
4. Ajouter la logique dans `core/DialogueEngine.ts → handleChoice()`

### Modifier le layout du graphe

- `hooks/useNodeLayout.ts` : positions Dagre
- `hooks/graph-utils/applySerpentineLayout.ts` : Serpentine routing
- `config/layoutConfig.ts` : paramètres Dagre (`rankSep`, `nodeSep`)

### Modifier une variable de jeu

Les variables sont **fixes** (physique, social, intellect, chance, joie, energie, confiance) — on ne peut pas en créer de nouvelles. Pour modifier une valeur : `useSettingsStore(s => s.modifyVariable)(name, delta)`.

### Ajouter un mood à un personnage

Via CharactersModal → Éditer personnage → Moods, ou via `useCharactersStore(s => s.updateCharacter)`.

---

## 6. Protocole Code

### Triage — évaluer avant d'agir

**Classifier la tâche en 3 secondes avant toute action.** Le niveau détermine le protocole à appliquer.

| Niveau | Signaux | Protocole |
| --- | --- | --- |
| **T1 — Surface** | Style, label, couleur, padding · 1 fichier · 0 store · 0 type partagé | Lire → Edit → tsc |
| **T2 — Standard** | Nouveau composant · modification store · wiring multi-fichiers · feature isolée | Spec + Grep audit + Plan + tsc |
| **T3 — Architectural** | Suppression · cross-store · nouveau type partagé · bug multi-stores · "protocole claude" | Protocole complet ci-dessous |

> **Règle de promotion automatique** : douter du niveau → monter d'un cran. Le coût d'un T2 inutile est faible ; le coût d'un T3 traité en T1 peut être un bug silencieux.
>
> **Escalade du raisonnement** (Anthropic, mappé directement dans le système) : `think` → T2 standard · `think hard` → T3 complexe · `ultrathink` → T3 avec bug critique ou architecture ambiguë. Préfixer la tâche avec le mot-clé approprié pour allouer plus de budget de réflexion.

---

### T3 — Déclencheur complet

Quand T3 est détecté **ou** que l'utilisateur dit **"protocole claude"**, effectuer dans cet ordre **avant toute autre action** :

1. Lire `memory/hallucination_patterns.md` → noter l'invariant le plus critique en 1 ligne avant de continuer.
2. Lire `memory/validated_patterns.md` → idem.
3. Lire le fichier `.claude/rules/` correspondant au domaine touché (table ci-dessous).
4. **Déclaration d'intention** : énoncer les 3 invariants critiques applicables à CE chantier avant de coder.
5. Enchaîner : WebSearch → Audit → Contre-vérification → Plan.

| Si la tâche touche… | → Lire |
| --- | --- |
| MapCanvas, Konva, éditeur 2D | `konva-patterns.md` |
| Assets, upload, chemins fichiers | `tauri-patterns.md` |
| UI, composants, animations, feedback | `nintendo-ux.md` |
| Nouvelle feature, dépendances | `dependencies.md` |
| Stores, selectors, React hooks | `store-patterns.md` |
| Graphe @xyflow, layout Dagre | `graph-patterns.md` |
| Couleurs, typo, espacements | `ui-tokens.md` |

---

### §0. Spec mini-format (T2 et T3 uniquement)

```text
Objectif    : [une phrase — ce que ça fait]
Critères    : [2-3 vérifiables — comment savoir que c'est réussi]
Non-objectif: [ce que ça NE fait PAS — évite le scope creep]
```

T3 complexe : structurer en XML — Claude parse les balises structurellement (mieux que markdown pour isoler les sections) :

```xml
<spec>
  <objectif>...</objectif>
  <criteres>...</criteres>
  <hors-scope>...</hors-scope>
</spec>
```

---

### Avant chaque chantier (T2/T3)

1. **WebSearch** : vérifier best practices actuelles. Obligatoire en T3, conditionnel en T2 si bibliothèque externe concernée.

   > **Règle anti-hardcoding** : détecter si une lib open source résout déjà le problème. Ne jamais créer de lookup tables hardcodées quand une lib maintenue existe.
   > ⚠️ Lire `.claude/rules/dependencies.md` pour la checklist complète.

2. **Audit ciblé** : Grep + Read sur les fichiers concernés.
   - **Hypothèse nulle avant grep** : formuler le résultat attendu avant de lancer. *"Je m'attends à 1 résultat dans MinigameFormPanel. Si j'en trouve plus, stop et analyse."* — combat le biais de confirmation.

3. **Contre-vérification** (T3) : les agents ont ~50-75% faux positifs — toujours vérifier par grep avant de corriger.

4. **Plan d'action** : `fichier → zone → changement → raison` avant de coder. Ex : `DialogueBox.tsx → wrapper div → touchAction:none → support tablette (konva-patterns §8)`

---

### Git — branche dédiée par chantier

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

> ⚠️ ~50-75% faux positifs sur pattern-matching — **toujours contre-vérifier par grep**.

---

### Pendant les modifications

1. **Cohérence** : suivre les patterns en place (imports, nommage, structure)
2. **Vérification incrémentale** : prédire le résultat (`"je m'attends à 0 erreur"`) puis `npx tsc --noEmit`. Si la réalité diverge : comprendre pourquoi avant de corriger.
3. **Seuil 90%** : si la localisation exacte d'un fichier ou d'un bug n'atteint pas 90% de certitude → `AskUserQuestion` avant d'agir. Jamais "essayer pour voir".
4. **Pas d'over-engineering** : résoudre le problème, rien de plus.

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

### Saturation du contexte — seuils de vigilance

Recherche Chroma 2025 : chaque modèle frontier testé dégrade à mesure que le contexte grandit.

| Seuil estimé | Symptôme | Action |
| --- | --- | --- |
| ~70% | Précision en baisse, oublis d'invariants | Éviter les lectures non essentielles |
| ~85% | Hallucinations probables | Résumer les acquis, envisager une nouvelle session |
| ~90%+ | Réponses erratiques | Stopper. Générer un fichier de continuation (voir `ai-adaptation.md §6`) |

Signal visible : liste de fichiers lus longue, pertes répétées d'invariants déjà établis en début de session.

### Qualité maximale (T3 renforcé)

Quand l'utilisateur demande "qualité maximale" :

- Préfixer avec `ultrathink`
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

## Rappel de fin de session — duplication intentionnelle

> Les 2 invariants les plus fréquemment violés, répétés ici pour le biais de récence.
> Source : primacy/recency bias research, 2026.

- Store Split : utiliser `useSceneWithElements(id)` — `scenesStore.scenes[n].dialogues` est toujours `[]`
- getState() : appeler uniquement dans les handlers/callbacks, jamais pendant le render

---

**Dernière mise à jour** : 2026-03-31 par Claude Sonnet 4.6
