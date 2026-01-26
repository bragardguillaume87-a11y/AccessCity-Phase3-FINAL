# PROJECT MEMORY SEED (AccessCity Phase 5.5+)

> **Statut** : ✅ À jour pour le Scenario Editor MVP  
> **Dernière mise à jour** : Décembre 2025

## CONTEXTE STRATEGIQUE

### Vision Projet
- **Client** : APF France Handicap
- **Produit** : Éditeur de scénarios interactifs + moteur de jeu accessible
- **Public** : Personnes en situation de handicap (trackball, eViacam, navigation clavier)
- **Finalité** : Outil storytelling accessible + export enrichi

### Philosophie Technique (2025)
- **Accessibilité d'abord** : Chaque fonctionnalité doit être utilisable au clavier, trackball, lecteur d’écran.
- **Modularité stricte** : Séparation claire des modules (core, services, ui, models, tests, docs).
- **Stack moderne** : Utilisation de React, Vite, TypeScript pour la rapidité, la maintenabilité et l’accessibilité.
- **Dépendances maîtrisées** : Utilisation de librairies modernes (React, Playwright, Istanbul, etc.) pour la qualité et la robustesse.
- **Clarté et documentation** : Code et docs à jour, lisibles et accessibles à tous les contributeurs.

### Architecture "Data-Driven"
- UI pilotée par `ui_layout.json`
- Scènes et dialogues dans `scenes.json`
- Personnages dans `characters.json`
- Schémas de validation dans `schemas.json`
- Variables narratives gérées par `VariableManager`

---

## RÈGLES ACTUELLES

### 1. Accessibilité et modularité
- Priorité à l’accessibilité et à la séparation des responsabilités dans le code.

### 2. Structure des fichiers
```
AccessCity-Phase3-FINAL/
├── core/          # Modules fondamentaux (eventBus, schema, variableManager)
├── ui/            # Composants React (panels, inspectors, éditeurs)
├── data/          # Données JSON (scènes, personnages, layouts)
├── docs/          # Documentation projet
├── test/          # Tests unitaires et E2E
├── tools/         # Scripts de build, couverture, rapports
├── data/          # Fichiers JSON (scenes, characters, schemas)
├── test/          # Tests unitaires (1 fichier/module)
├── docs/          # Documentation technique
└── index.html     # Point entree application
```

### 3. Code Complet Uniquement
**JAMAIS** : Fragments type `// ... existing code ...`  
**TOUJOURS** : Fichiers entiers fonctionnels

### 4. Validation Systematique
- Toutes entrees utilisateur → `sanitizer.js`
- Tous JSON charges → `schema.js`
- Retours explicites : `{ valid: boolean, errors: string[] }`

### 5. Pas d'Optimisations Non Demandees
**INTERDIT** : Refactorer code fonctionnel sans demande  
**AUTORISE** : Implementer exactement ce qui est requis

---

## ARCHITECTURE v5.0 (ACTUELLE)

### Modules Core Implementes
| Module | Fichier | Role | Statut |
|--------|---------|------|--------|
| Constants | `core/constants.js` | VERSION centralisee (5.0.0) | ✅ |
| EventBus | `core/eventBus.js` | Pub/sub inter-composants | ✅ |
| Sanitizer | `core/sanitizer.js` | Validation ASCII + nettoyage | ✅ |
| Schema | `core/schema.js` | Validation JSON recursive | ✅ |
| StateJournal | `core/stateJournal.js` | Undo/redo (50 entrees) | ✅ |
| SceneLoader | `core/jsonSceneLoader.js` | Chargement scenes.json | ✅ |
| LayoutLoader | `core/uiLayoutLoader.js` | Chargement ui_layout.json | ✅ |
| UIManager | `core/uiManager.js` | Gestion dynamique panels | ✅ |

### Fonctionnalites v5.0
- ✅ Chargement JSON avec validation schema
- ✅ Fallback automatique vers sampleData
- ✅ CRUD complet scenes et dialogues
- ✅ Export/Import JSON projet complet
- ✅ Undo/Redo avec StateJournal
- ✅ UI Layout configurable (1 layout actuel)
- ✅ Tests automatises (6/6 passing)

### Points Faibles v5.0
- ❌ Pas de variables narratives (Empathie, Autonomie, Confiance)
- ❌ Pas de gestion personnages
- ❌ Pas de conditions evaluees pour branching
- ❌ DevToolsPanel cache (pas active)
- ❌ 1 seul layout UI (4 prevus)

---

## PHASE 5.5 (EN COURS) - FONDATIONS NARRATIVES

### Objectif
Transformer editeur texte structure → moteur narratif interactif

### Modules Critiques a Creer

#### 1. VariableManager (P0)
**Fichier** : `core/variableManager.js`  
**Role** : Gestion variables narratives typees avec ranges  
**Variables** : Empathie (0-100), Autonomie (0-100), Confiance (0-100), flags booleens  
**Methodes** : define, get, set (avec clamp), increment, reset, getAll, export/importJSON

#### 2. ConditionEvaluator (P0)
**Fichier** : `core/conditionEvaluator.js`  
**Role** : Evaluer conditions pour branching dialogues  
**Operateurs** : `>`, `>=`, `==`, `<`, `<=`, `!=`  
**Methodes** : evaluateCondition, evaluateConditions (AND logic)

#### 3. CharacterLoader (P0)
**Fichier** : `core/characterLoader.js`  
**Role** : Charger et valider characters.json  
**Methodes** : loadCharactersFromJson, getCharacter, getAllCharacters

### Data Files a Creer

#### 1. characters.json
**Structure** : { version, characters: [{ id, name, description, sprites, moods }] }  
**Personnages** : player, counsellor, narrator (minimum)  
**Schema** : Ajouter Character dans `data/schemas.json`

#### 2. ui_layout.json - Enrichissement
**Ajouter** : 4 layouts (standard, focus, accessibility, devtools)  
**Actuel** : 1 seul layout defini

### UI Updates

#### InspectorPanel.js
- Dropdown selection `characterId` depuis characters.json
- Autocomplete personnages
- Preview sprite (placeholder texte si absent)

#### DevToolsPanel.js
- Activer panel (actuellement cache)
- Afficher variables narratives temps reel
- Bouton reset variables
- Affichage dialogue JSON (deja prevu)

### Tests a Creer
- `test/core.variableManager.test.js`
- `test/core.conditionEvaluator.test.js`
- `test/core.characterLoader.test.js`

### Criteres Validation Phase 5.5
- ✅ Variables narratives (Empathie, Autonomie, Confiance) fonctionnelles
- ✅ Personnages definis avec sprites et moods
- ✅ Conditions evaluees pour filtrer choices
- ✅ DevToolsPanel affiche variables temps reel
- ✅ InspectorPanel dropdown personnages fonctionnel
- ✅ 4 layouts UI disponibles et fonctionnels
- ✅ Tous tests passent (`npm test`)

---

## PHASES FUTURES

### Phase 6.0 (Moteur Runtime) - Q1 2026
**Modules** : DialogueEngine, TimelineService, NodePreview  
**Objectif** : Execution autonome scenarios narratifs

### Phase 6.5 (Assets & Audio) - Q2 2026
**Modules** : AssetLoader, AudioService, SpriteManager  
**Objectif** : Integration multimedia complete

### Phase 7.0 (Export GDevelop) - Q3 2026
**Modules** : GDevelopExporter, EventMapper  
**Objectif** : Export enrichi vers GDevelop

**Voir** : `docs/ROADMAP.md` pour details complets

---

## HISTORIQUE & LECONS

### Erreurs Passees
- Documentation trop lourde (140ko+) → Hallucinations IA
- Tests verbeux non executables → Convertis en tests stricts
- Versions hardcodees multiples → Centralisees dans constants.js
- Code fragments partiels → Regie "fichiers complets uniquement"

### Corrections Appliquees
- Documentation <10k tokens par fichier
- Tests unitaires executables (`npm test`)
- VERSION centralisee (5.0.0 dans `core/constants.js`)
- Interdiction fragments code (toujours fichiers entiers)
- Schemas validation enrichis (arrays, nested objects)

### Workflow Multi-IA
- **ChatGPT** : Architecture generale, structuration
- **Claude Sonnet 4.5** : Raisonnement structurel, validation
- **Perplexity Pro** : Cross-checking, references
- **Kimi K2** : Analyse profonde, signaux faibles (futur)
- **Gemini Pro 3** : Logique quantitative, benchmarks (futur)

---

## DOCUMENTATION COMPLETE

### Pour IA Agents
📄 **`docs/AI_CONTEXT.md`** - Vision complete, architecture, modules, exemples  
📄 **`docs/CODING_RULES.md`** - Regles developpement strictes  
📄 **`docs/ROADMAP.md`** - Phases detaillees 5.5 → 7.0

### Technique
📄 **`docs/CHANGELOG.md`** - Historique versions  
📄 **`docs/VERIFICATION_REPORT.md`** - Validation Phase 3→5  
📄 **`docs/FUTURE_FEATURES.md`** - Modules en attente (applyPatch, collaboration)  
📄 **`docs/Phase4-Blueprint.md`** - Specifications Phase 4 (guidance)

---

## COMMANDES UTILES

```bash
# Lancer tous les tests
npm test

# Creer archive projet
npm run pack

# Ouvrir index.html
start index.html  # Windows
open index.html   # macOS
```

---

## RESSOURCES

**Repository** : AccessCity-Phase3-FINAL (branche Access-City-4.5)  
**Client** : APF France Handicap  
**Version Actuelle** : 5.0.0 → 5.5.0 (en cours)  
**Documentation IA** : `docs/AI_CONTEXT.md`  
**Regles Code** : `docs/CODING_RULES.md`  
**Roadmap** : `docs/ROADMAP.md`

---

**FIN PROJECT MEMORY SEED**  
**Version** : 2.0.0  
**Date** : 23 novembre 2025  
**Prochaine MAJ** : Apres completion Phase 5.5