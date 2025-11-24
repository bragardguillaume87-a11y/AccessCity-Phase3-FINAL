# AccessCity - AI Context Documentation

**Version**: 5.0.0 → 5.5.0 (en cours)  
**Date**: 23 novembre 2025  
**Pour**: GitHub Copilot, Claude Sonnet 4.5, IA agents

---

## VISION STRATEGIQUE

### Objectif Metier
- **Client**: APF France Handicap
- **Produit**: Editeur de scenes narratives interactives + moteur de jeu accessible
- **Public cible**: Personnes en situation de handicap (trackball, eViacam, navigation clavier)
- **Cas d'usage**: Ateliers inclusion, formation, communication, storytelling accessible
- **Export final**: GDevelop (moteur de jeu 2D) avec variables narratives enrichies

### Philosophie Technique
- **Accessibilite d'abord**: Chaque feature doit etre utilisable au clavier, trackball, lecteur d'ecran
- **Modularite stricte**: Separation claire core/services/ui/models/tests/docs
- **Zero dependance externe**: JavaScript vanilla ES6+, pas de framework
- **ASCII-only**: Code 100% ASCII (32-126) pour diff/patch/validation facile
- **Code complet uniquement**: Jamais de fragments, toujours fichiers entiers fonctionnels

---

## ARCHITECTURE ACTUELLE (v5.0)

### Structure Dossiers
```
AccessCity-Phase3-FINAL/
├── core/               # Modules fondamentaux (eventBus, sanitizer, schema)
│   ├── constants.js        ✅ VERSION centralisee
│   ├── eventBus.js         ✅ Pub/sub pattern
│   ├── sanitizer.js        ✅ Validation ASCII + sanitization
│   ├── schema.js           ✅ Validation JSON recursive (arrays, nested objects)
│   ├── stateJournal.js     ✅ Undo/redo avec historique 50 entrees
│   ├── jsonSceneLoader.js  ✅ Chargement scenes.json avec fallback
│   └── uiLayoutLoader.js   ✅ Chargement ui_layout.json
├── data/               # Donnees JSON
│   ├── scenes.json         ✅ Scenes narratives (id, name, dialogues)
│   ├── schemas.json        ✅ Schemas validation (Scene, Dialogue, Choice, Condition)
│   ├── ui_layout.json      ✅ Configuration panels (1 layout actuel, 4 prevus)
│   ├── core_system.json    ✅ Metadonnees projet pour agents IA
│   └── state.journal.json  ✅ Historique modifications (vide initialement)
├── ui/                 # Composants interface
│   ├── SceneList.js        ✅ Liste scenes avec selection
│   ├── DialogueList.js     ✅ Liste dialogues (cache actuellement)
│   ├── InspectorPanel.js   ✅ Editeur CRUD scenes + dialogues
│   └── DevToolsPanel.js    ✅ Panel debug (cache, a activer)
├── test/               # Tests unitaires
│   ├── ascii-check.js               ✅ Validation ASCII strict
│   ├── core.eventBus.test.js        ✅ Tests pub/sub
│   ├── core.sanitizer.test.js       ✅ Tests sanitization
│   ├── core.schema.test.js          ✅ Tests validation
│   └── test-integration-v5.js       ✅ Tests integration (6/6 pass)
├── docs/               # Documentation
│   ├── README.md                    ✅ Introduction projet
│   ├── CHANGELOG.md                 ✅ Historique versions
│   ├── PROJECT_MEMORY_SEED.md       ✅ Contexte developpement
│   ├── FUTURE_FEATURES.md           ✅ Modules en attente (applyPatch, collaboration)
│   ├── Phase4-Blueprint.md          ✅ Specifications Phase 4 (guidance)
│   └── VERIFICATION_REPORT.md       ✅ Rapport validation Phase 3→5
├── index.html          ✅ Point d'entree application
└── package.json        ✅ Scripts npm (test, pack)
```

### Modules Core Implementes
| Module | Fichier | Role | Statut |
|--------|---------|------|--------|
| Constants | `core/constants.js` | VERSION centralisee (5.0.0) | ✅ Operationnel |
| EventBus | `core/eventBus.js` | Pub/sub inter-composants | ✅ Operationnel |
| Sanitizer | `core/sanitizer.js` | Validation ASCII + nettoyage | ✅ Operationnel |
| Schema | `core/schema.js` | Validation JSON recursive | ✅ Operationnel |
| StateJournal | `core/stateJournal.js` | Undo/redo (50 entrees) | ✅ Operationnel |
| SceneLoader | `core/jsonSceneLoader.js` | Chargement scenes.json | ✅ Operationnel |
| LayoutLoader | `core/uiLayoutLoader.js` | Chargement ui_layout.json | ✅ Operationnel |
| UIManager | `core/uiManager.js` | Gestion dynamique panels | ✅ Operationnel |
| Main | `core/main.js` | Orchestration application | ✅ Operationnel |

### Fonctionnalites v5.0
- ✅ Chargement JSON avec validation schema
- ✅ Fallback automatique vers sampleData si JSON absent
- ✅ CRUD complet scenes et dialogues (create, read, update, delete)
- ✅ Export/Import JSON projet complet
- ✅ Undo/Redo avec StateJournal
- ✅ UI Layout configurable (1 layout actuel)
- ✅ Tests automatises (6/6 passing)

---

## MODULES MANQUANTS CRITIQUES (Phase 5.5)

### 1. VariableManager (P0 - CRITIQUE)
**Fichier**: `core/variableManager.js`  
**Role**: Gestion variables narratives typees avec ranges

**Variables AccessCity attendues**:
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

**Impact**: Sans ce module, impossible de gerer l'etat narratif du joueur.

---

### 2. Characters Management (P0 - CRITIQUE)
**Fichier data**: `data/characters.json`  
**Fichier loader**: `core/characterLoader.js`  
**Fichier schema**: Enrichir `data/schemas.json`

**Structure attendue** (`data/characters.json`):
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
      "description": "Conseiller en accessibilite",
      "sprites": {
        "neutral": "assets/counsellor_neutral.png"
      },
      "moods": ["neutral", "professional", "helpful"]
    },
    {
      "id": "narrator",
      "name": "Narrateur",
      "description": "Voix narrative",
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
    }
  }
}
```

**Impact**: Sans ce module, `characterId` dans dialogues reste une string vide de sens.

---

### 3. Condition Evaluator (P0 - CRITIQUE)
**Fichier**: `core/conditionEvaluator.js`  
**Role**: Evaluer conditions pour branching dialogues

**Structure conditions** (deja dans schemas.json):
```json
{
  "variable": "Empathie",
  "operator": ">=",
  "value": "50"
}
```

**Operateurs supportes**: `>`, `>=`, `==`, `<`, `<=`, `!=`

**Fonctions essentielles**:
```javascript
evaluateCondition(condition, variableManager)   // 1 condition -> boolean
evaluateConditions(conditions, variableManager) // AND logic -> boolean
```

**Logique**:
- Recupere valeur variable via `variableManager.get(variable)`
- Compare avec operateur
- Retourne `true` ou `false`
- Supporte comparaisons numeriques et strings

**Impact**: Sans ce module, impossible de filtrer choices selon etat narratif.

---

## REGLES DE DEVELOPPEMENT STRICTES

### 1. Encodage ASCII Obligatoire
```javascript
// ✅ BON - ASCII strict
const dialogue = {
  id: 'dlg1',
  content: 'Bonjour, comment ca va ?' // Pas d'accent dans strings
};

// ❌ MAUVAIS - Caracteres interdits
const dialogue = {
  id: 'dlg1',
  content: 'Bonjour, comment ça va ?' // ç interdit (code 231)
};
```

**Caracteres autorises**: Codes ASCII 32-126 uniquement  
**Test validation**: `npm test` inclut `ascii-check.js`

### 2. Structure Fichiers
- **Imports ES6**: `import { EventBus } from './eventBus.js';`
- **Exports nommes**: `export function validate() {}`
- **Pas de default export** sauf classes principales
- **Extensions .js obligatoires** dans imports

### 3. Gestion Erreurs
```javascript
// ✅ BON - Try/catch avec messages explicites
try {
  const data = JSON.parse(jsonString);
  return { success: true, data };
} catch (error) {
  console.error('[ModuleName] Parse error:', error.message);
  return { success: false, error: error.message };
}
```

### 4. Validation Systematique
- **Toutes entrees utilisateur** → `sanitizer.js`
- **Tous JSON charges** → `schema.js`
- **Retours explicites**: `{ valid: boolean, errors: string[] }`

### 5. Code Complet Uniquement
- **JAMAIS de fragments** type `// ... existing code ...`
- **TOUJOURS fichier entier** fonctionnel et testable
- **Pas de refactor non demande**: modifie uniquement ce qui est requis

---

## WORKFLOW DEVELOPPEMENT

### Ajouter un Nouveau Module Core
1. **Creer fichier** dans `core/nomModule.js`
2. **Respecter structure**:
   ```javascript
   // core/nomModule.js
   // Description du module
   
   export class NomModule {
     constructor() {
       // Initialisation
     }
     
     methode1() {
       // Implementation
     }
   }
   ```
3. **Ajouter tests** dans `test/core.nomModule.test.js`
4. **Importer dans main.js** si necessaire
5. **Documenter** dans `docs/` si module complexe
6. **Valider ASCII**: `npm test`

### Modifier Fichier Existant
1. **Lire fichier complet** pour comprendre contexte
2. **Identifier imports/exports** dependants
3. **Modifier uniquement code requis**
4. **Tester mentalement** compatibilite avec reste du systeme
5. **Renvoyer fichier COMPLET** modifie
6. **Valider ASCII**: `npm test`

### Ajouter Donnees JSON
1. **Definir schema** dans `data/schemas.json`
2. **Creer fichier data** dans `data/nomFichier.json`
3. **Creer loader** dans `core/nomFichierLoader.js`
4. **Ajouter validation** avec `schema.js`
5. **Prevoir fallback** si fichier absent
6. **Tester chargement** avec JSON valide/invalide

---

## ROADMAP PHASES

### Phase 5.0 ✅ TERMINE
- JSON loading avec validation
- CRUD scenes et dialogues
- Export/Import JSON
- State journal undo/redo
- UI layout configurable (1 layout)
- Tests integration (6/6 passing)

### Phase 5.5 🔄 EN COURS (Fondations Narratives)
**Objectif**: Transformer editeur texte → moteur narratif interactif

**Modules a creer** (P0 - CRITIQUE):
- [ ] `core/variableManager.js` - Variables narratives typees
- [ ] `core/conditionEvaluator.js` - Evaluation conditions branching
- [ ] `core/characterLoader.js` - Chargement characters.json
- [ ] `data/characters.json` - Base personnages AccessCity
- [ ] Enrichir `data/schemas.json` - Schema Character
- [ ] Enrichir `data/ui_layout.json` - 4 layouts (standard, focus, accessibility, devtools)

**UI a enrichir**:
- [ ] `ui/InspectorPanel.js` - Dropdown personnages + preview sprites
- [ ] `ui/DevToolsPanel.js` - Activer + affichage variables narratives

**Tests a creer**:
- [ ] `test/core.variableManager.test.js`
- [ ] `test/core.conditionEvaluator.test.js`
- [ ] `test/core.characterLoader.test.js`

**Criteres validation Phase 5.5**:
- ✅ Variables narratives (Empathie, Autonomie, Confiance) fonctionnelles
- ✅ Personnages definis avec sprites et moods
- ✅ Conditions evaluees pour filtrer choices
- ✅ DevToolsPanel affiche variables en temps reel
- ✅ InspectorPanel permet selection personnage par dropdown
- ✅ 4 layouts UI disponibles et fonctionnels
- ✅ Tous tests passent (npm test)

### Phase 6.0 ⏸️ FUTUR (Moteur Runtime)
**Objectif**: Execution autonome scenarios narratifs

**Modules prevus**:
- `services/dialogueEngine.js` - Moteur execution dialogues
- `services/timelineService.js` - Visualisation flow narratif
- Mode test autonome (playthrough sans UI)
- Preview sprites dans editeur

### Phase 6.5 ⏸️ FUTUR (Assets & Audio)
**Objectif**: Integration multimedia

**Modules prevus**:
- `services/assetLoader.js` - Preload images/sprites
- `services/audioService.js` - Crossfade audio
- Pipeline sprites Evermore+ v2 (pixel art SNES-like)
- Palette 64 couleurs + 12 tons secondaires

### Phase 7.0 ⏸️ FUTUR (Export GDevelop)
**Objectif**: Export enrichi vers GDevelop

**Modules prevus**:
- Export JSON GDevelop avec variables narratives
- Mapping events GDevelop
- Validation compatibilite GDevelop

---

## GRAPHISME (Evermore+ v2)

### Style Visuel
- **Reference**: Secret of Evermore (SNES), Chrono Trigger
- **Resolution**: 1920x1080 (composition), pixel-scale x2
- **Palette**: 64 couleurs principales + 12 tons secondaires lumiere
- **Technique**: Pixel art SNES-like, clarte maximale
- **Sprites**: Personnages style RPG, poses multiples (moods)

### Assets Attendus
```
assets/
├── characters/
│   ├── player_neutral.png
│   ├── player_happy.png
│   ├── player_sad.png
│   ├── counsellor_neutral.png
│   └── narrator_icon.png
├── backgrounds/
│   ├── mairie_exterior.png
│   └── office_interior.png
└── ui/
    └── panel_backgrounds.png
```

**Note actuelle**: Pas de sprites disponibles → utiliser placeholders texte

---

## EXEMPLES CONFORMES

### Bon Module Core
```javascript
// core/variableManager.js
// Gestion des variables narratives typees avec ranges

export class VariableManager {
  constructor() {
    this.variables = new Map();
  }

  define(name, type, defaultValue, min = null, max = null) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Variable name must be non-empty string');
    }
    
    const allowedTypes = ['number', 'boolean', 'string'];
    if (!allowedTypes.includes(type)) {
      throw new Error('Type must be number, boolean or string');
    }

    this.variables.set(name, {
      type,
      value: defaultValue,
      defaultValue,
      min,
      max
    });
  }

  get(name) {
    const variable = this.variables.get(name);
    return variable ? variable.value : undefined;
  }

  set(name, value) {
    const variable = this.variables.get(name);
    if (!variable) {
      throw new Error('Variable ' + name + ' not defined');
    }

    let finalValue = value;

    // Clamp si min/max definis
    if (variable.type === 'number') {
      if (variable.min !== null && finalValue < variable.min) {
        finalValue = variable.min;
      }
      if (variable.max !== null && finalValue > variable.max) {
        finalValue = variable.max;
      }
    }

    variable.value = finalValue;
  }

  increment(name, delta) {
    const current = this.get(name);
    if (typeof current !== 'number') {
      throw new Error('Cannot increment non-number variable');
    }
    this.set(name, current + delta);
  }

  reset(name) {
    const variable = this.variables.get(name);
    if (variable) {
      variable.value = variable.defaultValue;
    }
  }

  getAll() {
    const result = {};
    this.variables.forEach((variable, name) => {
      result[name] = variable.value;
    });
    return result;
  }

  exportToJSON() {
    const data = {};
    this.variables.forEach((variable, name) => {
      data[name] = {
        type: variable.type,
        value: variable.value,
        defaultValue: variable.defaultValue,
        min: variable.min,
        max: variable.max
      };
    });
    return JSON.stringify(data, null, 2);
  }

  importFromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    this.variables.clear();
    
    Object.keys(data).forEach(name => {
      const variable = data[name];
      this.define(
        name,
        variable.type,
        variable.defaultValue,
        variable.min,
        variable.max
      );
      this.variables.get(name).value = variable.value;
    });
  }
}
```

### Bon Test Unitaire
```javascript
// test/core.variableManager.test.js
import { VariableManager } from '../core/variableManager.js';

console.log('Testing VariableManager...');

// Test 1: Define and get variable
const vm = new VariableManager();
vm.define('Empathie', 'number', 50, 0, 100);
const empathie = vm.get('Empathie');
if (empathie !== 50) {
  throw new Error('Expected Empathie = 50, got ' + empathie);
}
console.log('✓ Define and get variable works');

// Test 2: Set with clamp
vm.set('Empathie', 150); // Should clamp to 100
const clamped = vm.get('Empathie');
if (clamped !== 100) {
  throw new Error('Expected clamped value 100, got ' + clamped);
}
console.log('✓ Clamp to max works');

// Test 3: Increment
vm.set('Empathie', 50);
vm.increment('Empathie', 10);
const incremented = vm.get('Empathie');
if (incremented !== 60) {
  throw new Error('Expected 60, got ' + incremented);
}
console.log('✓ Increment works');

// Test 4: Reset
vm.reset('Empathie');
const reset = vm.get('Empathie');
if (reset !== 50) {
  throw new Error('Expected reset to 50, got ' + reset);
}
console.log('✓ Reset works');

// Test 5: Export/Import JSON
vm.define('visited_mairie', 'boolean', false);
const exported = vm.exportToJSON();
const vm2 = new VariableManager();
vm2.importFromJSON(exported);
const imported = vm2.get('Empathie');
if (imported !== 50) {
  throw new Error('Expected imported Empathie = 50, got ' + imported);
}
console.log('✓ Export/Import JSON works');

console.log('All VariableManager tests passed!');
```

---

## QUESTIONS FREQUENTES IA

### Q: Puis-je utiliser des accents dans le code ?
**R**: NON. ASCII strict uniquement (codes 32-126). Les accents sont autorises dans les commentaires et strings de donnees JSON, mais JAMAIS dans les identificateurs (variables, fonctions, cles objets).

### Q: Puis-je refactorer du code existant pour l'optimiser ?
**R**: NON, sauf demande explicite. Ne modifie que ce qui est requis pour la tache demandee.

### Q: Dois-je renvoyer des fragments de code ou fichiers complets ?
**R**: TOUJOURS fichiers complets. Jamais de `// ... existing code ...` ou fragments partiels.

### Q: Comment gerer les fichiers manquants (ex: characters.json) ?
**R**: Creer le fichier avec structure conforme aux schemas, prevoir loader avec fallback, documenter dans schemas.json.

### Q: Quelle est la difference entre core/ et services/ ?
**R**: 
- `core/`: Modules fondamentaux reutilisables (EventBus, Schema, VariableManager)
- `services/`: Logique metier specifique (DialogueEngine, TimelineService)

### Q: Comment tester un nouveau module ?
**R**: Creer `test/core.nomModule.test.js` ou `test/services.nomService.test.js`, importer module, tester toutes methodes publiques, verifier edge cases, executer avec `npm test`.

---

## COMMANDES UTILES

```bash
# Lancer tous les tests
npm test

# Creer archive projet (exclut node_modules, .git)
npm run pack

# Ouvrir index.html dans navigateur
# (Pas de serveur requis, fichiers locaux)
start index.html  # Windows
open index.html   # macOS
```

---

## CONTACTS & RESSOURCES

**Client**: APF France Handicap  
**Developpement**: Multi-agent (ChatGPT, Claude Sonnet 4.5, Perplexity Pro)  
**Repository**: `AccessCity-Phase3-FINAL` (branche `Access-City-4.5`)  
**Documentation principale**: `docs/PROJECT_MEMORY_SEED.md`  
**Changelog**: `docs/CHANGELOG.md`  
**Roadmap detaillee**: `docs/Phase4-Blueprint.md` (guidance Phase 4)

---

**FIN DU CONTEXTE IA**  
**Derniere mise a jour**: 23 novembre 2025  
**Version documentation**: 1.0.0
