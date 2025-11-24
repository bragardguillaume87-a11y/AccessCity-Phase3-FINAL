# AccessCity - Regles de Developpement Strictes

**Version**: 1.0.0  
**Date**: 23 novembre 2025  
**Obligatoire pour**: Tous developpeurs et IA agents

---

## REGLES ABSOLUES

### 1. ENCODAGE ASCII STRICT

**REGLE**: Utilise UNIQUEMENT des caracteres ASCII codes 32-126.

#### Caracteres AUTORISES
```
Espace : (32)
Ponctuation : ! " # $ % & ' ( ) * + , - . /
Chiffres : 0-9
Symboles : : ; < = > ? @
Majuscules : A-Z
Symboles : [ \ ] ^ _ `
Minuscules : a-z
Symboles : { | } ~
```

#### Caracteres INTERDITS
```
Accents : é è ê à ù ç (codes > 127)
Guillemets courbes : " " ' ' (codes > 127)
Apostrophes courbes : ' (code > 127)
Tout caractere non-ASCII
```

#### Exemples

✅ **BON**
```javascript
const scene = {
  id: 'scene-001',
  title: 'Rencontre au parc',
  content: "Bonjour, comment ca va ?"
};
```

❌ **MAUVAIS**
```javascript
const scène = {              // ✗ 'è' interdit
  id: "scene-001",           // ✗ "" courbes interdits
  title: "Rencontre au parc",
  content: "Bonjour, comment ça va ?" // ✗ 'ç' interdit
};
```

#### Validation
```bash
npm test  # Inclut ascii-check.js
```

---

### 2. STRUCTURE FICHIERS OBLIGATOIRE

**REGLE**: Respecte STRICTEMENT l'arborescence suivante.

```
AccessCity-Phase3-FINAL/
├── core/          # Modules fondamentaux UNIQUEMENT
├── services/      # Logique metier UNIQUEMENT
├── ui/            # Composants interface UNIQUEMENT
├── models/        # Classes metier UNIQUEMENT
├── data/          # Fichiers JSON UNIQUEMENT
├── test/          # Tests unitaires UNIQUEMENT
├── docs/          # Documentation UNIQUEMENT
├── index.html     # Point d'entree HTML
└── package.json   # Configuration npm
```

#### Regles Placement
- **core/**: EventBus, Sanitizer, Schema, VariableManager, Loaders
- **services/**: DialogueEngine, TimelineService, AssetLoader, AudioService
- **ui/**: SceneList, InspectorPanel, DevToolsPanel, UI components
- **models/**: Scene, Dialogue, Character, Choice (classes metier)
- **data/**: scenes.json, characters.json, schemas.json, ui_layout.json
- **test/**: Un fichier test par module (core.nomModule.test.js)
- **docs/**: Documentation technique, roadmap, changelog

❌ **INTERDIT**
- Melanger code et documentation dans meme dossier
- Mettre logique metier dans core/
- Mettre UI dans services/
- Creer dossiers non prevus sans validation

---

### 3. CODE COMPLET UNIQUEMENT

**REGLE**: JAMAIS de fragments de code, TOUJOURS fichiers entiers.

✅ **BON** - Fichier complet
```javascript
// core/variableManager.js
// Gestion variables narratives typees

export class VariableManager {
  constructor() {
    this.variables = new Map();
  }

  define(name, type, defaultValue, min = null, max = null) {
    // Implementation complete
  }

  get(name) {
    // Implementation complete
  }

  // ... toutes les autres methodes
}
```

❌ **MAUVAIS** - Fragments
```javascript
// core/variableManager.js

export class VariableManager {
  constructor() {
    this.variables = new Map();
  }

  // ... existing code ...  ✗ INTERDIT
  
  get(name) {
    // Implementation
  }
}
```

**Consequence**: Un fichier incomplet = code non fonctionnel = regression.

---

### 4. IMPORTS ES6 STRICTS

**REGLE**: Utilise imports ES6 avec extensions .js obligatoires.

✅ **BON**
```javascript
import { EventBus } from './eventBus.js';           // Extension .js
import { sanitize } from '../core/sanitizer.js';    // Chemin relatif
import { Scene } from '../models/Scene.js';         // PascalCase classes
```

❌ **MAUVAIS**
```javascript
import { EventBus } from './eventBus';              // ✗ Pas d'extension
import sanitize from '../core/sanitizer.js';        // ✗ Default import non standard
const EventBus = require('./eventBus.js');          // ✗ CommonJS interdit
```

#### Exports Standards
```javascript
// Export nomme (prefere)
export function validate(data) { }
export class VariableManager { }

// Export default (classes principales uniquement)
export default class Scene { }
```

---

### 5. GESTION ERREURS OBLIGATOIRE

**REGLE**: Tous les try/catch doivent avoir des messages explicites.

✅ **BON**
```javascript
export async function loadScenes(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' loading scenes.json');
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    console.error('[SceneLoader] Error loading scenes:', error.message);
    return { success: false, error: error.message };
  }
}
```

❌ **MAUVAIS**
```javascript
export async function loadScenes(url) {
  try {
    const data = await fetch(url).then(r => r.json());  // ✗ Pas de verif HTTP
    return data;  // ✗ Pas de structure retour
  } catch (e) {
    console.log(e);  // ✗ Message vague
  }
}
```

#### Structure Retour Standard
```javascript
// Succes
return { success: true, data: result };

// Erreur
return { success: false, error: 'Message explicite' };
```

---

### 6. VALIDATION SYSTEMATIQUE

**REGLE**: Toutes les entrees utilisateur et donnees externes doivent etre validees.

#### Validation Entrees Utilisateur
```javascript
import { sanitize } from '../core/sanitizer.js';

function handleUserInput(input) {
  const cleaned = sanitize(input);  // Nettoyage ASCII
  
  if (!cleaned || cleaned.length === 0) {
    return { valid: false, error: 'Input vide' };
  }
  
  if (cleaned.length > 1000) {
    return { valid: false, error: 'Input trop long (max 1000)' };
  }
  
  return { valid: true, value: cleaned };
}
```

#### Validation JSON
```javascript
import { validateSchema } from '../core/schema.js';

function loadSceneData(json) {
  const validation = validateSchema('Scene', json);
  
  if (!validation.valid) {
    console.error('Scene validation failed:', validation.errors);
    return null;
  }
  
  return json;
}
```

---

### 7. NOMMAGE CONVENTIONS

**REGLE**: Respect strict des conventions JavaScript.

#### Variables et Fonctions
```javascript
// camelCase
const sceneManager = new SceneManager();
function loadSceneData() { }
let currentDialogue = null;
```

#### Classes
```javascript
// PascalCase
class VariableManager { }
class DialogueEngine { }
class Scene { }
```

#### Constantes
```javascript
// UPPER_SNAKE_CASE
const MAX_DIALOGUES = 1000;
const DEFAULT_LAYOUT = 'standard';
const VERSION = '5.0.0';
```

#### Fichiers
```javascript
// camelCase pour modules
variableManager.js
conditionEvaluator.js

// PascalCase pour classes
Scene.js
Character.js

// kebab-case pour data
scenes.json
ui-layout.json
```

---

### 8. COMMENTAIRES ET DOCUMENTATION

**REGLE**: Commente les fonctions complexes, documente les modules.

✅ **BON**
```javascript
/**
 * Evalue une condition de dialogue
 * @param {Object} condition - {variable, operator, value}
 * @param {VariableManager} vm - Gestionnaire variables
 * @returns {boolean} - True si condition respectee
 */
export function evaluateCondition(condition, vm) {
  const currentValue = vm.get(condition.variable);
  
  // Compare selon operateur
  switch (condition.operator) {
    case '>': return currentValue > parseFloat(condition.value);
    case '>=': return currentValue >= parseFloat(condition.value);
    case '==': return currentValue == condition.value;
    case '<': return currentValue < parseFloat(condition.value);
    case '<=': return currentValue <= parseFloat(condition.value);
    case '!=': return currentValue != condition.value;
    default: return false;
  }
}
```

❌ **MAUVAIS**
```javascript
// Fonction qui fait un truc
function eval(c, v) {  // ✗ Noms vagues
  const cv = v.get(c.variable);
  switch (c.operator) {  // ✗ Pas de commentaire sur logique
    // ...
  }
}
```

---

### 9. TESTS UNITAIRES OBLIGATOIRES

**REGLE**: Chaque module core/ et services/ doit avoir un fichier test.

#### Structure Test
```javascript
// test/core.variableManager.test.js
import { VariableManager } from '../core/variableManager.js';

console.log('Testing VariableManager...');

// Test 1: Fonctionnalite de base
const vm = new VariableManager();
vm.define('Empathie', 'number', 50, 0, 100);

if (vm.get('Empathie') !== 50) {
  throw new Error('Test 1 failed: Expected Empathie = 50');
}
console.log('✓ Test 1: Define and get variable');

// Test 2: Edge case
vm.set('Empathie', 150);
if (vm.get('Empathie') !== 100) {
  throw new Error('Test 2 failed: Expected clamped value 100');
}
console.log('✓ Test 2: Clamp to max');

// ... autres tests

console.log('All VariableManager tests passed!');
```

#### Execution Tests
```bash
npm test  # Lance tous les tests
```

---

### 10. PAS D'OPTIMISATIONS NON DEMANDEES

**REGLE**: Ne modifie QUE ce qui est explicitement requis.

❌ **INTERDIT**
- Refactoriser du code qui fonctionne
- "Ameliorer" l'architecture sans demande
- Ajouter des fonctionnalites "utiles"
- Changer les patterns existants

✅ **AUTORISE**
- Implementer exactement ce qui est demande
- Corriger bugs identifies
- Ajouter features specifiees

---

## WORKFLOW STANDARD

### Creer Nouveau Module Core

1. **Creer fichier** `core/nomModule.js`
2. **Structure minimale**:
   ```javascript
   // core/nomModule.js
   // Description du module
   
   export class NomModule {
     constructor() {
       // Initialisation
     }
   }
   ```
3. **Ajouter test** `test/core.nomModule.test.js`
4. **Importer si necessaire** dans `core/main.js`
5. **Valider ASCII**: `npm test`

### Modifier Fichier Existant

1. **Lire fichier complet** pour comprendre contexte
2. **Identifier dependances** (imports/exports)
3. **Modifier code requis** uniquement
4. **Renvoyer fichier COMPLET**
5. **Tester**: `npm test`

### Ajouter Donnees JSON

1. **Definir schema** dans `data/schemas.json`
2. **Creer fichier** `data/nomFichier.json`
3. **Creer loader** `core/nomFichierLoader.js`
4. **Ajouter validation** avec `schema.js`
5. **Tester chargement**

---

## CHECKLIST PRE-COMMIT

Avant chaque commit, verifier:

- [ ] Code 100% ASCII (pas d'accents, guillemets droits)
- [ ] Fichiers dans bons dossiers (core/, services/, ui/, etc.)
- [ ] Imports ES6 avec extensions .js
- [ ] Try/catch avec messages explicites
- [ ] Validation entrees utilisateur et JSON
- [ ] Nommage conventions respectees (camelCase, PascalCase)
- [ ] Commentaires sur logique complexe
- [ ] Tests unitaires passent (`npm test`)
- [ ] Fichiers complets (pas de fragments)
- [ ] Pas de refactor non demande

---

## QUESTIONS INTERDITES

Ne JAMAIS demander:

- "Veux-tu que j'optimise ce code ?"
- "Dois-je refactoriser ?"
- "Puis-je ajouter des fonctionnalites ?"
- "Veux-tu que j'ameliore l'architecture ?"

➡️ **Execute la demande exacte, rien de plus.**

---

## EXEMPLES COMPLETS

### Module Core Conforme

```javascript
// core/conditionEvaluator.js
// Evaluation conditions pour branching dialogues

/**
 * Evalue une seule condition
 * @param {Object} condition - {variable, operator, value}
 * @param {VariableManager} variableManager - Gestionnaire variables
 * @returns {boolean} - True si condition respectee
 */
export function evaluateCondition(condition, variableManager) {
  if (!condition || !condition.variable || !condition.operator) {
    console.warn('[ConditionEvaluator] Invalid condition:', condition);
    return false;
  }

  const currentValue = variableManager.get(condition.variable);
  
  if (currentValue === undefined) {
    console.warn('[ConditionEvaluator] Variable not found:', condition.variable);
    return false;
  }

  const compareValue = condition.value;

  switch (condition.operator) {
    case '>':
      return currentValue > parseFloat(compareValue);
    case '>=':
      return currentValue >= parseFloat(compareValue);
    case '==':
      return currentValue == compareValue;
    case '<':
      return currentValue < parseFloat(compareValue);
    case '<=':
      return currentValue <= parseFloat(compareValue);
    case '!=':
      return currentValue != compareValue;
    default:
      console.warn('[ConditionEvaluator] Unknown operator:', condition.operator);
      return false;
  }
}

/**
 * Evalue plusieurs conditions (AND logic)
 * @param {Array} conditions - Array de {variable, operator, value}
 * @param {VariableManager} variableManager - Gestionnaire variables
 * @returns {boolean} - True si toutes conditions respectees
 */
export function evaluateConditions(conditions, variableManager) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return true; // Pas de conditions = toujours vrai
  }

  return conditions.every(condition => {
    return evaluateCondition(condition, variableManager);
  });
}
```

### Test Conforme

```javascript
// test/core.conditionEvaluator.test.js
import { evaluateCondition, evaluateConditions } from '../core/conditionEvaluator.js';
import { VariableManager } from '../core/variableManager.js';

console.log('Testing ConditionEvaluator...');

// Setup
const vm = new VariableManager();
vm.define('Empathie', 'number', 50, 0, 100);
vm.define('visited_mairie', 'boolean', false);

// Test 1: Operateur >
const cond1 = { variable: 'Empathie', operator: '>', value: '40' };
if (!evaluateCondition(cond1, vm)) {
  throw new Error('Test 1 failed: 50 > 40 should be true');
}
console.log('✓ Test 1: Operator > works');

// Test 2: Operateur ==
vm.set('Empathie', 75);
const cond2 = { variable: 'Empathie', operator: '==', value: '75' };
if (!evaluateCondition(cond2, vm)) {
  throw new Error('Test 2 failed: 75 == 75 should be true');
}
console.log('✓ Test 2: Operator == works');

// Test 3: Multiple conditions (AND)
const conds = [
  { variable: 'Empathie', operator: '>=', value: '50' },
  { variable: 'visited_mairie', operator: '==', value: 'false' }
];
if (!evaluateConditions(conds, vm)) {
  throw new Error('Test 3 failed: Both conditions should be true');
}
console.log('✓ Test 3: Multiple conditions (AND) works');

// Test 4: Variable inexistante
const cond4 = { variable: 'NonExistant', operator: '>', value: '10' };
if (evaluateCondition(cond4, vm)) {
  throw new Error('Test 4 failed: Should return false for unknown variable');
}
console.log('✓ Test 4: Unknown variable returns false');

console.log('All ConditionEvaluator tests passed!');
```

---

**FIN DES REGLES**  
**Version**: 1.0.0  
**Date**: 23 novembre 2025  
**Mise a jour**: Jamais sans validation projet
