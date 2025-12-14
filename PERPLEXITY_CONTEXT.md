# 🎯 Context pour Perplexity Pro - AccessCity Scenario Editor MVP

**Branche** : `scenario-editor-MVP`  
**Version** : 5.5 (phase finale)  
**Date** : Décembre 2025  
**Stack** : React 18 + Vite + Tailwind CSS

---

## 📋 Table des matières
1. [Documentation de référence](#documentation-de-référence)
2. [Features intentionnellement incomplètes](#features-intentionnellement-incomplètes)
3. [Code à ignorer (legacy)](#code-à-ignorer-legacy)
4. [Architecture data-driven](#architecture-data-driven)
5. [Conventions de code](#conventions-de-code)
6. [Zones critiques à analyser](#zones-critiques-à-analyser)

---

## 📚 Documentation de référence

**Lis ces fichiers EN PRIORITE avant toute analyse** :

| Fichier | Purpose | Lecture essentielle |
|---------|---------|-------------------|
| [docs/PROJECT_MEMORY_SEED.md](docs/PROJECT_MEMORY_SEED.md) | Vision stratégique v5.5+ | ⭐⭐⭐ MUST READ |
| [docs/CODING_RULES.md](docs/CODING_RULES.md) | Standards code (ASCII strict, pas de fragments) | ⭐⭐⭐ MUST READ |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) | Specs accessibilité clavier + ARIA | ⭐⭐⭐ CRITÈRE #1 |
| [docs/SCENARIO_EDITOR_DESIGN.md](docs/SCENARIO_EDITOR_DESIGN.md) | Architecture UI/UX | ⭐⭐ Important |
| [docs/KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md) | Raccourcis clavier (Ctrl+D, Ctrl+Z, etc.) | ⭐⭐ Important |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases futures (6.0, 7.0) | ⭐ Context |
| [src/data/schemas.json](src/data/schemas.json) | Structure données typées | ⭐ Reference |
| [DIALOGUE_PANEL_IMPROVEMENTS.md](DIALOGUE_PANEL_IMPROVEMENTS.md) | Design decisions DialoguesPanel | ⭐ Context |

---

## ❌ Features intentionnellement incomplètes

### ✋ NE PAS CODER (En attente de spécifications)

#### 1. **PlayMode (src/components/PlayMode.jsx)**
- **État** : Skeleton UI seulement
- **Raison** : Logique jeu dépend de `RulesEngine` (phase 6.0)
- **À faire** : 
  - Gestion turn-based + Initiative
  - Résolution des choix/dés via RulesEngine
  - Gestion inventory + badges dynamiques
- **Ignorer** : Les TODO comments dans PlayMode.jsx

#### 2. **DevToolsPanel (src/components/DevToolsPanel.jsx)**
- **État** : Variables en temps réel (OK), mais pas de debugging full
- **Raison** : Attend intégration EventBus v2
- **À faire** : Tracer events, modifier variables live
- **Ignorer** : Features non implémentées listées dans le fichier

#### 3. **EventBus (src/core/eventBus.js)**
- **État** : Basique (publish/subscribe)
- **Raison** : Attend refactorisation pour patterns complexes
- **À faire** : Priorités d'événements, debounce, retry logic
- **Ignorer** : Les commentaires "TODO: améliorer avec..."

#### 4. **ConditionEvaluator (src/core/conditionEvaluator.js)**
- **État** : Opérateurs basiques (+, -, >, <, ==)
- **Raison** : Attend spécifications logique narratives (phase 6.0)
- **À faire** : Variables composées, conditions imbriquées, comparaisons complexes
- **Ignorer** : Code pour opérateurs avancés

#### 5. **ProblemsPanel (src/components/ProblemsPanel.jsx)**
- **État** : Affiche erreurs de validation basiques
- **Raison** : Attend intégration complète des règles de validation
- **À faire** : Suggestions de correction, auto-fix simple
- **Ignorer** : Boutons "Fix" non implémentés

---

## 🗑️ Code à ignorer (legacy)

### Fichiers deprecated (à ne PAS modifier)

```
legacy/                          # Ancien code (ne pas utiliser)
├── html/                        # Version HTML statique v1.0
└── ...

docs/legacy/                     # Documentation obsolète
├── E2E_PROMPT_TEMPLATE.md
└── ...

src/components/PlayerPreview.jsx # Non utilisé dans MVP
src/components/OutcomeModal.jsx  # Deprecated (intégré à PlayMode)
```

### Pattern obsolètes à éviter

```javascript
❌ ANCIEN - Ne PAS utiliser
// Fichiers partagés avec state manqué
const [state] = useState();
const updateState = () => {}; // Jamais appelé

// Imports CommonJS (vieux)
const React = require('react');

// Strings sans accentuation
// ✗ "Parametres" au lieu de "Paramètres"

❌ LEGACY - Éviter
import Component from './Component';  // Sans .jsx
import './styles.css';               // Eviter CSS séparé (Tailwind only)
```

---

## 🏗️ Architecture data-driven

**Concept clé** : UI pilotée par JSON, pas hardcodé.

### Fichiers de données critiques

```
src/data/
├── scenes.json              ← Scènes narratives (structure : REQUIRED)
├── characters.json          ← Personnages (structure : REQUIRED)
├── schemas.json             ← Schémas de validation (structure : REQUIRED)
├── ui_layout.json           ← Configuration panels (structure : REQUIRED)
├── scenarioTemplates.js     ← Templates dialogues (données)
└── textSnippets.js          ← Auto-complétion (données)
```

### Principes

1. **Toute donnée dynamique** → JSON ou Contexte React
2. **Pas de hardcoding** de listes/menus
3. **Validation par schema** (avant save)
4. **ASCII strict** uniquement dans le code (Unicode OK dans JSON)

---

## 📝 Conventions de code

### Imports obligatoires

```javascript
✅ BON
import React from 'react';                      // React 18
import { useState, useMemo } from 'react';      // Hooks
import { useApp } from '../AppContext.jsx';     // Context (extension .jsx)
import { duplicateScene } from '../utils/duplication.js';  // Extension .js

❌ MAUVAIS
import React = require('react');                // CommonJS (interdit)
import Component from './Component';            // Pas d'extension
const { useState } = require('react');          // require (interdit)
```

### Composants React

```javascript
✅ BON - Composant avec context et hooks
export default function DialoguesPanel() {
  const { scenes, addDialogue } = useApp();
  const [editingIdx, setEditingIdx] = useState(null);
  
  return (
    <div className="...">
      {/* Code complet, pas de fragments */}
    </div>
  );
}

❌ MAUVAIS
export default function DialoguesPanel() {
  // ... existing code ...  ← INTERDIT
  const [editingIdx, setEditingIdx] = useState(null);
  return ...;  ← Fragment incomplet
}
```

### Accessibilité obligatoire

```javascript
✅ BON
<button
  onClick={handleDelete}
  aria-label="Supprimer ce dialogue"  ← Obligatoire
  className="..." 
>
  Supprimer
</button>

<input
  id="speaker-1"
  aria-label="Locuteur du dialogue 1"
  className="..."
/>

❌ MAUVAIS - Pas d'aria-label
<button onClick={handleDelete} className="...">🗑️</button>
```

### Tests unitaires obligatoires

```javascript
✅ BON - Test dans test/dialogues.test.js
import { duplicateDialogue } from '../src/utils/duplication.js';

describe('duplicateDialogue', () => {
  test('crée une copie avec ID unique', () => {
    const original = { id: 'dial-1', text: 'Hello' };
    const copy = duplicateDialogue(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.text).toBe('Hello');
  });
});

❌ MAUVAIS - Pas de tests
// Code sans couverture de tests
```

---

## 🔴 Zones critiques à analyser

### 1. **DialoguesPanel.jsx** (RÉCENT - mai 2025)
- ✅ Structure 2 colonnes (OK)
- ✅ Templates intégrés (OK)
- ⚠️ **À améliorer** :
  - Virtualisation liste (si 100+ dialogues)
  - Focus management lors de suppression
  - Undo/redo pour dialogues?
  - Validation choix orphelins (nextScene invalide)?

### 2. **ScenesPanel.jsx** (STABLE)
- ✅ Drag-drop reorder (OK)
- ✅ Duplication (OK)
- ⚠️ **À améliorer** :
  - Performance avec 50+ scènes
  - Visualisation graphe scènes (advanced)

### 3. **AppContext.jsx** (CRITÈRE)
- ⚠️ **À analyser** :
  - LocalStorage sync (loss sur crash?)
  - Validation avant save
  - Undo/redo state management
  - Hooks personnalisés (useUndo, useValidation)

### 4. **ConfirmModal.jsx** (STABLE)
- ✅ Focus trap (OK)
- ✅ Escape key (OK)
- ⚠️ **À améliorer** :
  - Animation Enter (fadeIn?)
  - WCAG AA contrast check

### 5. **PlayMode.jsx** (À ÉVITER)
- ❌ Incomplet
- ❌ Dépend RulesEngine (phase 6.0)
- ⚠️ **NE PAS CODER** sans spécifications

---

## 🎯 Questions recommandées pour Perplexity

### Performance
```
Q1: Vérifier virtualisation dialogues si 100+
Q2: Profiler rerender sur AppContext.js changes
Q3: Optimiser searchSnippets() avec debounce
```

### Accessibilité (PRIORITAIRE)
```
Q1: Focus trap dans TemplateSelector modal?
Q2: ARIA live regions pour notifications?
Q3: Contraste texte sur states (selected vs normal)?
Q4: Keyboard navigation complète (Tab, Shift+Tab, Enter, Escape)?
```

### Architecture
```
Q1: Validation choix orphelins (nextScene invalide)?
Q2: Undo/redo pour dialogues (comme Ctrl+Z)?
Q3: Drag-drop reorder choix (comme ScenesPanel)?
Q4: Intégration EventBus pour validation?
```

### Bugs potentiels
```
Q1: Crash si character.id invalide?
Q2: LocalStorage overflow si 10+ scenarios?
Q3: Memory leak sur lazy loading?
Q4: Race condition lors import/export?
```

---

## 📦 Packages clés

```json
{
  "react": "^18.2.0",
  "vite": "^4.4.9",
  "tailwindcss": "^3.3.3",
  "lucide-react": "^0.263.1",  // Icons uniquement
  "playwright": "^1.40.0"       // Tests E2E
}
```

**Pas d'autres libraries UI** → Tailwind only.

---

## ✅ Checklist avant modification

```
□ Lis docs/PROJECT_MEMORY_SEED.md
□ Lis docs/CODING_RULES.md
□ Lis docs/ACCESSIBILITY.md
□ Vérifier si feature est dans "incomplète intentionnellement"
□ Code complet (pas de fragments)
□ Extension .jsx et .js obligatoires
□ ARIA labels partout
□ Tests unitaires (>80% couverture)
□ npm run build (sans erreurs)
□ npm test (tous les tests passent)
□ ASCII strict dans le code
□ Pas d'optimisations non demandées
```

---

## 🚀 Pour soumettre un PR à partir de l'analyse Perplexity

1. **Titre PR** : `[Perplexity-Analysis] Feature / Bug: Description courte`
2. **Description** : 
   - Problème identifié
   - Fichiers affectés
   - Solution proposée
   - Checklist validation
3. **Commits** : Un commit par feature/fix
4. **Tests** : 100% couverture pour novo code

---

## 📞 Contact / Questions

Si Perplexity trouve du code ambigu :
- Cherche dans [DIALOGUE_PANEL_IMPROVEMENTS.md](DIALOGUE_PANEL_IMPROVEMENTS.md)
- Cherche dans [docs/SCENARIO_EDITOR_DESIGN.md](docs/SCENARIO_EDITOR_DESIGN.md)
- Si toujours ambigu → Laisse en TODO comment, ne pas modifier

**Golden rule** : En cas de doute, **ne pas modifier**.

---

**Version doc** : 1.0 (2025-12-13)  
**Prochaine révision** : Après phase 6.0 (RulesEngine)
