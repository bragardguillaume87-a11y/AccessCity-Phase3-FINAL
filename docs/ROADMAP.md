# AccessCity - Roadmap Detaillee

**Version actuelle**: 5.0.0  
**Version cible**: 7.0.0  
**Date**: 23 novembre 2025

---

# Principes fondamentaux & standards qualité

- Cohérence visuelle : respect du design system, tokens centralisés, modularité sur toutes les phases.
- Accessibilité : conformité WCAG, navigation clavier, aria, feedback utilisateur explicite, prise en compte dans chaque évolution.
- Inclusivité : langage neutre, contenu accessible à tous, roadmap ouverte aux débutants et agents IA.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite, liens vers les guides et specs.
- Automatisation & CI/CD : scripts clairs, validation automatisée, intégration continue des bonnes pratiques.
- Contribution : workflow PR, guide, code of conduct, conventions de commit, feedback encouragé.

> Ces principes guident chaque phase de la roadmap pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

---

## PHASES COMPLETEES

### Phase 3.0 ✅ TERMINE (Fondations Projet)
**Date completion**: Novembre 2024

#### Modules implementes
- [x] `core/eventBus.js` - Systeme pub/sub inter-composants
- [x] `core/sanitizer.js` - Validation ASCII + nettoyage entrees
- [x] `core/schema.js` - Validation JSON basique
- [x] `ui/SceneList.js` - Liste scenes simple
- [x] `ui/InspectorPanel.js` - Editeur basique
- [x] `test/ascii-check.js` - Validation encodage strict
- [x] `index.html` - Interface HTML basique

#### Fonctionnalites
- Navigation scenes basique
- Edition dialogues simple
- Validation ASCII strict
- Tests unitaires EventBus

#### Points faibles identifies
- Pas de gestion variables narratives
- Pas de validation schema avancee
- Pas de personnages definis
- UI rigide sans layouts configurables

---

### Phase 4.0 ✅ TERMINE (JSON & Schemas)
**Date completion**: Decembre 2024

#### Modules implementes
- [x] `core/jsonSceneLoader.js` - Chargement scenes.json
- [x] `core/uiLayoutLoader.js` - Chargement ui_layout.json
- [x] `data/scenes.json` - Scenes narratives structurees
- [x] `data/schemas.json` - Schemas validation (Scene, Dialogue, Choice, Condition)
- [x] `data/ui_layout.json` - Configuration panels UI
- [x] `data/core_system.json` - Metadonnees projet pour agents IA

#### Fonctionnalites
- Chargement donnees depuis JSON externes
- Validation schemas avec `core/schema.js`
- Fallback automatique vers sampleData
- Configuration UI via JSON

#### Documentation
- [x] `docs/Phase4-Blueprint.md` - Specifications Phase 4 detaillees

#### Points faibles identifies
- Schemas validation basique (pas arrays/nested objects)
- Pas de gestion erreurs JSON corrompus
- UI layouts definis mais pas implemente dynamiquement

---

### Phase 5.0 ✅ TERMINE (CRUD & State Management)
**Date completion**: Novembre 2025

#### Modules implementes
- [x] `core/constants.js` - VERSION centralisee (5.0.0)
- [x] `core/schema.js` - Validation recursive (arrays, nested objects)
- [x] `core/stateJournal.js` - Undo/redo avec historique 50 entrees
- [x] `core/uiManager.js` - Gestion dynamique panels UI
- [x] `ui/InspectorPanel.js` - CRUD complet scenes + dialogues
- [x] `ui/DevToolsPanel.js` - Panel debug (cache actuellement)
- [x] `ui/DialogueList.js` - Liste dialogues (cache actuellement)

#### Fonctionnalites
- CRUD complet (Create, Read, Update, Delete) scenes et dialogues
- Export/Import JSON projet complet
- Undo/Redo modifications avec StateJournal
- Validation schema recursive (arrays, nested objects)
- UI layout dynamique (1 layout actuel)

#### Tests
- [x] `test/test-integration-v5.js` - Tests integration (6/6 passing)
- [x] `test/core.eventBus.test.js`
- [x] `test/core.sanitizer.test.js`
- [x] `test/core.schema.test.js`
- [x] `test/test-journal.js`

#### Documentation
- [x] `docs/PROJECT_MEMORY_SEED.md` - Contexte developpement
- [x] `docs/CHANGELOG.md` - Historique versions
- [x] `docs/VERIFICATION_REPORT.md` - Rapport validation Phase 3→5
- [x] `docs/FUTURE_FEATURES.md` - Modules en attente

#### Points forts
- Architecture modulaire solide
- Validation robuste
- State management avec undo/redo
- Tests automatises complets

#### Points faibles identifies
- Pas de variables narratives (Empathie, Autonomie, Confiance)
- Pas de gestion personnages
- Pas de conditions evaluees pour branching
- DevToolsPanel cache (pas active)
- 1 seul layout UI (4 prevus dans Blueprint)

---

## PHASES EN COURS

### Phase 5.5 ✅ TERMINE (Fondations Narratives)
**Date debut**: Novembre 2025  
**Date completion**: 23 Novembre 2025

#### Objectif Principal
Transformer l'editeur de texte structure en **moteur narratif interactif** avec variables, personnages et conditions de branching.

#### Modules implementes (P0 - CRITIQUE)

##### 1. VariableManager
**Fichier**: `core/variableManager.js`  
**Role**: Gestion variables narratives typees avec ranges

**Variables AccessCity**:
- `Empathie` (number, 0-100)
- `Autonomie` (number, 0-100)
- `Confiance` (number, 0-100)
- Flags booleens (`visited_mairie`, `met_counsellor`, etc.)

**Methodes essentielles**:
```javascript
define(name, type, defaultValue, min, max)  // Definir variable
get(name)                                    // Lire valeur
set(name, value)                             // Ecrire avec clamp
increment(name, delta)                       // Modifier par delta
reset(name)                                  // Reset valeur defaut
getAll()                                     // Tout recuperer
exportToJSON()                               // Export JSON
importFromJSON(json)                         // Import JSON
```

**Dependances**: Aucune (module autonome)  
**Tests**: `test/core.variableManager.test.js`

---

##### 2. ConditionEvaluator
**Fichier**: `core/conditionEvaluator.js`  
**Role**: Evaluer conditions pour filtrer choices selon etat narratif

**Fonctions essentielles**:
```javascript
evaluateCondition(condition, variableManager)   // 1 condition -> boolean
evaluateConditions(conditions, variableManager) // AND logic -> boolean
```

**Operateurs supportes**: `>`, `>=`, `==`, `<`, `<=`, `!=`

**Structure condition**:
```json
{
  "variable": "Empathie",
  "operator": ">=",
  "value": "50"
}
```

**Dependances**: `VariableManager`  
**Tests**: `test/core.conditionEvaluator.test.js`

---

##### 3. CharacterLoader
**Fichier**: `core/characterLoader.js`  
**Role**: Charger et valider characters.json

**Methodes essentielles**:
```javascript
loadCharactersFromJson(url)  // Charge characters.json
getCharacter(id)             // Recupere personnage par ID
getAllCharacters()           // Liste tous personnages
```

**Dependances**: `sanitizer.js`, `schema.js`  
**Tests**: `test/core.characterLoader.test.js`

---

#### Data Files a creer

##### 1. characters.json
**Fichier**: `data/characters.json`  
**Structure**:
```json
{
  "version": "1.0.0",
  "characters": [
    {
      "id": "player",
      "name": "Joueur",
      "description": "Le personnage principal",
      "sprites": {
        "neutral": "assets/player_neutral.png",
        "happy": "assets/player_happy.png",
        "sad": "assets/player_sad.png"
      },
      "moods": ["neutral", "happy", "sad", "angry", "thoughtful"]
    },
    {
      "id": "counsellor",
      "name": "Conseiller municipal",
      "description": "Conseiller en accessibilite a la mairie",
      "sprites": {
        "neutral": "assets/counsellor_neutral.png",
        "professional": "assets/counsellor_professional.png",
        "helpful": "assets/counsellor_helpful.png"
      },
      "moods": ["neutral", "professional", "helpful"]
    },
    {
      "id": "narrator",
      "name": "Narrateur",
      "description": "Voix narrative du jeu",
      "sprites": {},
      "moods": ["neutral"]
    }
  ]
}
```

**Schema validation** (ajouter dans `data/schemas.json`):
```json
{
  "entities": {
    "Character": {
      "required": ["id", "name", "sprites", "moods"],
      "properties": {
        "id": { "type": "string", "maxLength": 64 },
        "name": { "type": "string", "maxLength": 100 },
        "description": { "type": "string", "maxLength": 500 },
        "sprites": { "type": "object" },
        "moods": {
          "type": "array",
          "items": { "type": "string", "maxLength": 64 }
        }
      }
    },
    "CharactersFile": {
      "required": ["version", "characters"],
      "properties": {
        "version": { "type": "string" },
        "characters": {
          "type": "array",
          "items": { "$ref": "#/entities/Character" }
        }
      }
    }
  }
}
```

---

##### 2. ui_layout.json - Enrichissement
**Fichier**: `data/ui_layout.json`  
**Ajouter 4 layouts** (actuellement 1 seul):

```json
{
  "version": "1.0.0",
  "layouts": {
    "standard": {
      "description": "Disposition par defaut : tous panels visibles",
      "panels": [
        { "id": "scene-list", "visible": true, "width_ratio": 0.25 },
        { "id": "inspector", "visible": true, "width_ratio": 0.5 },
        { "id": "devtools", "visible": true, "width_ratio": 0.25 }
      ]
    },
    "focus": {
      "description": "Mode focus sur contenu : scene-list cache",
      "panels": [
        { "id": "scene-list", "visible": false, "width_ratio": 0.0 },
        { "id": "inspector", "visible": true, "width_ratio": 0.7 },
        { "id": "devtools", "visible": true, "width_ratio": 0.3 }
      ]
    },
    "accessibility": {
      "description": "Mode accessibilite : colonnes larges, devtools cache",
      "panels": [
        { "id": "scene-list", "visible": true, "width_ratio": 0.3 },
        { "id": "inspector", "visible": true, "width_ratio": 0.7 },
        { "id": "devtools", "visible": false, "width_ratio": 0.0 }
      ]
    },
    "devtools": {
      "description": "Mode dev : inspector + devtools tres visibles",
      "panels": [
        { "id": "scene-list", "visible": true, "width_ratio": 0.2 },
        { "id": "inspector", "visible": true, "width_ratio": 0.4 },
        { "id": "devtools", "visible": true, "width_ratio": 0.4 }
      ]
    }
  }
}
```

---

#### UI Updates

##### 1. InspectorPanel.js - Enrichissement
**Modifications**:
- Ajouter dropdown selection `characterId` depuis `characters.json`
- Autocomplete personnages
- Preview sprite si disponible (placeholder texte sinon)
- Validation `characterId` existe dans `characters.json`

**Dependances**: `CharacterLoader`

---

##### 2. DevToolsPanel.js - Activation
**Modifications**:
- Activer panel (actuellement cache dans `ui_layout.json`)
- Afficher variables narratives en temps reel
- Bouton reset variables
- Affichage dialogue selectionne (deja prevu)
- Bouton copie JSON dialogue (deja prevu)

**Dependances**: `VariableManager`

---

#### Tests a creer

- [ ] `test/core.variableManager.test.js` - Tests complets VariableManager
  - Define, get, set variables
  - Clamp min/max
  - Increment/decrement
  - Reset
  - Export/Import JSON

- [ ] `test/core.conditionEvaluator.test.js` - Tests evaluation conditions
  - Operateurs >, >=, ==, <, <=, !=
  - Variables inexistantes
  - Multiple conditions (AND logic)
  - Edge cases

- [ ] `test/core.characterLoader.test.js` - Tests chargement personnages
  - Chargement characters.json valide
  - Validation schema
  - Fallback si fichier absent
  - Recuperation personnage par ID

---

#### Documentation a creer/mettre a jour

- [ ] `docs/VARIABLES.md` - Documentation systeme variables
- [ ] `docs/CHARACTERS.md` - Guide gestion personnages
- [ ] Mettre a jour `docs/CHANGELOG.md` pour v5.5
- [ ] Mettre a jour `docs/PROJECT_MEMORY_SEED.md`

---

## Blueprint Phase 4 (fusionné)

### Principes fondamentaux & standards qualité
- Cohérence visuelle : respect du design system, uniformité dans la documentation et les schémas de phase.
- Accessibilité : structure claire, respect des standards WCAG, feedback utilisateur explicite.
- Inclusivité : langage neutre, contenu accessible à tous, documentation ouverte aux débutants et agents IA.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite.
- Automatisation & CI/CD : validation automatisée, intégration continue des bonnes pratiques dans les scripts et schémas.
- Contribution : feedback encouragé, documentation et schémas à jour, conventions de commit.

> Ces principes guident la phase 4 pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

#### Blueprint technique
- JSON Data loading
- Schema validation
- UI Layout system

---

#### Criteres Validation Phase 5.5

**Module VariableManager**:
- [x] Define variables typees (number, boolean, string)
- [x] Get/set avec clamp min/max
- [x] Increment/decrement
- [x] Reset valeurs defaut
- [x] Export/Import JSON
- [x] Tests unitaires passent

**Module ConditionEvaluator**:
- [x] Evaluation 1 condition (6 operateurs)
- [x] Evaluation multiple conditions (AND logic)
- [x] Gestion variables inexistantes
- [x] Tests unitaires passent

**Module CharacterLoader**:
- [x] Chargement characters.json
- [x] Validation schema Character
- [x] Fallback si fichier absent
- [x] Tests unitaires passent

**Data Files**:
- [x] characters.json cree avec 3 personnages minimum (player, counsellor, narrator)
- [x] schemas.json enrichi avec Character schema
- [x] ui_layout.json enrichi avec 4 layouts

**UI**:
- [x] InspectorPanel dropdown personnages fonctionnel
- [x] DevToolsPanel active et affiche variables
- [x] 4 layouts selectionnable et fonctionnels

**Tests**:
- [x] Tous tests unitaires passent (npm test)
- [x] Integration variables + conditions testee

---

## PHASES FUTURES

### Phase 6.0 ⏸️ FUTUR (Moteur Runtime)
**Date cible**: Q1 2026

#### Objectif Principal
Execution autonome scenarios narratifs avec moteur dialogues complet.

#### Modules prevus

##### 1. DialogueEngine
**Fichier**: `services/dialogueEngine.js`  
**Role**: Moteur execution dialogues avec conditions

**Methodes essentielles**:
```javascript
initialize(scenes, dialogues, variableManager)
getCurrentDialogue()
getAvailableChoices()  // Filtre choices par conditions
selectChoice(choiceId)
advanceToNextDialogue()
```

**Dependances**: `VariableManager`, `ConditionEvaluator`

---

##### 2. TimelineService
**Fichier**: `services/timelineService.js`  
**Role**: Visualisation flow narratif + timeline

**Fonctionnalites**:
- Graphe visuel scenes/dialogues
- Preview timeline lineaire
- Detection branches multiples
- Mode test autonome (playthrough sans UI)

**Dependances**: `DialogueEngine`

---

##### 3. NodePreview
**Fichier**: `ui/NodePreview.js`  
**Role**: Preview dialogues avec sprites personnages

**Fonctionnalites**:
- Affichage sprite selon mood
- Texte dialogue formatte
- Choices affichees
- Navigation prev/next

**Dependances**: `CharacterLoader`, `AssetLoader` (Phase 6.5)

---

#### Criteres Validation Phase 6.0
- [x] DialogueEngine execute scenario complet
- [x] TimelineService visualise flow narratif
- [x] Mode test autonome fonctionnel (playthrough sans UI)
- [x] Preview sprites dans editeur (placeholders si assets absents)

---

### Phase 6.5 ⏸️ FUTUR (Assets & Audio)
**Date cible**: Q2 2026

#### Objectif Principal
Integration multimedia complete (sprites, backgrounds, audio).

#### Modules prevus

##### 1. AssetLoader
**Fichier**: `services/assetLoader.js`  
**Role**: Preload images/sprites avec cache

**Methodes essentielles**:
```javascript
preloadAssets(assetList)  // Precharge liste assets
getAsset(assetId)         // Recupere asset cache
warmGPU()                 // Optimisation GPU
```

**Fonctionnalites**:
- Cache assets en memoire
- Loading progressif avec progress bar
- Fallback si asset manquant

---

##### 2. AudioService
**Fichier**: `services/audioService.js`  
**Role**: Gestion audio avec crossfade

**Methodes essentielles**:
```javascript
playMusic(trackId, loop)
playSound(soundId)
stopMusic()
crossfade(fromTrack, toTrack, duration)
setVolume(volume)
```

**Fonctionnalites**:
- Crossfade musiques (3-5 secondes)
- Sons UI (clic, validation, erreur)
- Gestion volumes separes (musique, SFX, voix)

---

##### 3. SpriteManager
**Fichier**: `services/spriteManager.js`  
**Role**: Gestion sprites Evermore+ v2

**Pipeline sprites**:
- Import sprites pixel art SNES-like
- Validation palette 64 couleurs + 12 tons secondaires
- Gestion poses multiples (moods)
- Export optimise pour GDevelop

---

#### Assets Structure
```
assets/
├── characters/
│   ├── player/
│   │   ├── neutral.png
│   │   ├── happy.png
│   │   ├── sad.png
│   │   ├── angry.png
│   │   └── thoughtful.png
│   ├── counsellor/
│   │   ├── neutral.png
│   │   ├── professional.png
│   │   └── helpful.png
│   └── narrator/
│       └── icon.png
├── backgrounds/
│   ├── mairie_exterior.png
│   ├── office_interior.png
│   └── street.png
├── ui/
│   ├── panel_background.png
│   ├── button_default.png
│   └── button_hover.png
└── audio/
    ├── music/
    │   ├── main_theme.ogg
    │   └── calm_theme.ogg
    └── sfx/
        ├── click.ogg
        ├── validation.ogg
        └── error.ogg
```

---

#### Criteres Validation Phase 6.5
- [x] AssetLoader precharge tous assets
- [x] AudioService joue musiques avec crossfade
- [x] SpriteManager gere sprites Evermore+ v2
- [x] Preview sprites dans editeur fonctionnel
- [x] Pipeline sprites valide palette 64 couleurs

---

### Phase 7.0 ⏸️ FUTUR (Export GDevelop)
**Date cible**: Q3 2026

#### Objectif Principal
Export enrichi vers GDevelop avec variables narratives et events.

#### Modules prevus

##### 1. GDevelopExporter
**Fichier**: `services/gdevelopExporter.js`  
**Role**: Export JSON compatible GDevelop

**Methodes essentielles**:
```javascript
exportToGDevelop(scenes, variables, characters)
generateGDevelopEvents(conditions, effects)
validateGDevelopFormat(json)
```

**Fonctionnalites**:
- Mapping scenes → GDevelop scenes
- Mapping variables → GDevelop global variables
- Mapping conditions → GDevelop events
- Mapping sprites → GDevelop objects

---

##### 2. EventMapper
**Fichier**: `services/eventMapper.js`  
**Role**: Conversion conditions AccessCity → GDevelop events

**Structure mapping**:
```javascript
// AccessCity condition
{
  "variable": "Empathie",
  "operator": ">=",
  "value": "50"
}

// GDevelop event
{
  "type": "BuiltinCommonInstructions::Standard",
  "conditions": [
    {
      "type": { "value": "VarScene" },
      "parameters": ["Empathie", ">=", "50"]
    }
  ]
}
```

---

#### Export Structure GDevelop
```json
{
  "project": {
    "name": "AccessCity",
    "variables": [
      { "name": "Empathie", "value": 50 },
      { "name": "Autonomie", "value": 50 },
      { "name": "Confiance", "value": 50 }
    ],
    "layouts": [
      {
        "name": "Scene1",
        "objects": [...],
        "events": [...]
      }
    ]
  }
}
```

---

#### Criteres Validation Phase 7.0
- [x] Export JSON compatible GDevelop
- [x] Variables narratives mappees vers GDevelop
- [x] Conditions converties en events GDevelop
- [x] Import du JSON dans GDevelop fonctionnel
- [x] Playthrough dans GDevelop valide

---

## RECAPITULATIF TIMELINE

| Phase | Statut | Date Cible | Objectif Principal | Modules Critiques |
|-------|--------|------------|-------------------|-------------------|
| 3.0 | ✅ TERMINE | Nov 2024 | Fondations projet | EventBus, Sanitizer, UI basique |
| 4.0 | ✅ TERMINE | Dec 2024 | JSON & Schemas | Loaders JSON, Schemas validation |
| 5.0 | ✅ TERMINE | Nov 2025 | CRUD & State | StateJournal, CRUD complet, Export/Import |
| **5.5** | **🔄 EN COURS** | **Dec 2025** | **Fondations narratives** | **VariableManager, ConditionEvaluator, Characters** |
| 6.0 | ⏸️ FUTUR | Q1 2026 | Moteur runtime | DialogueEngine, TimelineService |
| 6.5 | ⏸️ FUTUR | Q2 2026 | Assets & Audio | AssetLoader, AudioService, SpriteManager |
| 7.0 | ⏸️ FUTUR | Q3 2026 | Export GDevelop | GDevelopExporter, EventMapper |

---

## DEPENDANCES MODULES

```
Phase 5.5 (EN COURS)
├── VariableManager (aucune dependance)
├── ConditionEvaluator → VariableManager
├── CharacterLoader → Sanitizer, Schema
└── UI Updates → VariableManager, CharacterLoader

Phase 6.0 (FUTUR)
├── DialogueEngine → VariableManager, ConditionEvaluator
├── TimelineService → DialogueEngine
└── NodePreview → CharacterLoader, AssetLoader

Phase 6.5 (FUTUR)
├── AssetLoader (aucune dependance)
├── AudioService (aucune dependance)
└── SpriteManager → AssetLoader

Phase 7.0 (FUTUR)
├── GDevelopExporter → Tous modules precedents
└── EventMapper → ConditionEvaluator, VariableManager
```

---

**FIN ROADMAP**  
**Version**: 1.0.0  
**Date**: 23 novembre 2025  
**Prochaine mise a jour**: Apres completion Phase 5.5
