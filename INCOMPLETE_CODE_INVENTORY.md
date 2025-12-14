# 🚧 Inventory - Code Incomplet & TODOs

**Objectif** : Répertorier tout code en cours / incomplet pour que Perplexity comprenne le contexte.

---

## 📍 Fichiers avec code INCOMPLET (intentionnel)

### 1. **src/components/PlayMode.jsx**
**État** : Skeleton UI - À NE PAS améliorer seul

```jsx
// Ligne ~50-80
export default function PlayMode() {
  // ✋ STRUCTURE EXISTE SEULEMENT
  // - HUD variables (affichage)
  // - Dialogue rendering (affichage)
  // - Choix buttons (basique)
  
  // ❌ MANQUE : Résolution logique
  // - Lancer dés et traiter résultat
  // - Appliquer delta variables
  // - Branching vers scène suivante
  // - Gestion inventory
  // - Sauvegarde checkpoints
  
  // 🔗 DÉPEND : RulesEngine (phase 6.0)
  // NE PAS CODER AVANT
}
```

**À faire** : Phase 6.0 après specs RulesEngine

---

### 2. **src/components/ProblemsPanel.jsx**
**État** : Validation basique - Ignore des cas

```jsx
// Ligne ~100-150
function validateScene(scene) {
  const errors = [];
  
  // ✅ FAIT
  if (!scene.title) errors.push('Titre manquant');
  if (!scene.backgroundUrl) errors.push('Fond manquant');
  if (!scene.dialogues?.length) errors.push('Aucun dialogue');
  
  // ❌ MANQUE : Validations avancées
  // - Choix orphelins (nextScene invalide)?
  // - Characters référencés existent?
  // - Variables narratives en scope?
  // - Cycles/boucles infinies?
  // - Assets manquants?
  
  return errors;
}
```

**À faire** : Quand specs validation complètes

---

### 3. **src/core/conditionEvaluator.js**
**État** : Opérateurs basiques seulement

```javascript
// Ligne ~30-60
export function evaluateCondition(condition, variables) {
  // ✅ FAIT
  if (op === '>') return value > threshold;
  if (op === '<') return value < threshold;
  if (op === '==') return value == threshold;
  
  // ❌ MANQUE : Opérateurs avancés
  if (op === 'in_range') return value >= min && value <= max;
  if (op === 'contains') return array.includes(item);
  if (op === 'AND') return expr1 && expr2;
  if (op === 'OR') return expr1 || expr2;
  if (op === 'NOT') return !expr;
  
  // ❌ MANQUE : Opérateurs spécialisés
  if (op === 'has_badge') return inventory.badges.includes(badge);
  if (op === 'quest_done') return quests[id].status === 'done';
}
```

**À faire** : Quand spécifications logique narratives finalisées

---

### 4. **src/components/DevToolsPanel.jsx**
**État** : Affiche variables, mais pas debugging complet

```jsx
// Ligne ~1-50
export default function DevToolsPanel() {
  // ✅ FAIT
  return (
    <div>
      <h3>Variables temps réel</h3>
      {variables.map(v => <div>{v.name}: {v.value}</div>)}
    </div>
  );
  
  // ❌ MANQUE : Debugging avancé
  // - Trace des événements (EventBus)
  // - Modifier variables live
  // - Replayer actions
  // - Profiler performance
  // - Breakpoints sur conditions
  
  // 🔗 DÉPEND : EventBus v2 (priorities, tracing)
}
```

**À faire** : Phase 6.0 après EventBus v2

---

### 5. **src/components/OutcomeModal.jsx**
**État** : Deprecated - À ne PAS utiliser

```jsx
// ⚠️ ANCIEN CODE - NE PAS MODIFIER
// Cet ancien composant a été partiellement fusionné dans:
// - DialoguesPanel.jsx (outcomes success/failure)
// - PlayMode.jsx (future phase 6.0)

// IGNORER ce fichier
```

**À faire** : Supprimer après validation que dialogues OK

---

### 6. **src/AppContext.jsx**
**État** : Fonctionne, mais améliorations possibles

```javascript
// Ligne ~200-250
export function AppProvider({ children }) {
  // ✅ FAIT
  const [scenarios, setScenarios] = useState([]);
  const addScene = (title) => { /* ... */ };
  const updateScene = (id, updates) => { /* ... */ };
  
  // ⚠️ SEMI-FAIT : LocalStorage
  useEffect(() => {
    // Charge localStorage au démarrage
    const stored = localStorage.getItem('scenarios');
    // ❌ MANQUE : 
    // - Vérification corruption données?
    // - Backup avant overwrite?
    // - Gestion quota (max 5MB)?
    // - Récupération après crash?
  }, []);
  
  // ❌ MANQUE : Undo/Redo
  // - History stack
  // - Ctrl+Z / Ctrl+Y support
  // - Grouper les actions (ex: 3 edits = 1 undo)
  
  // ❌ MANQUE : Validation avant save
  // - Vérifier schemas.json
  // - Rejeter données invalides
  // - Notifications utilisateur
  
  return <AppContext.Provider value={...}>{children}</AppContext.Provider>;
}
```

**À améliorer** : Phase 5.6 (après DialoguesPanel finalisé)

---

### 7. **src/components/TemplateSelector.jsx**
**État** : Basique - À améliorer

```jsx
// Ligne ~100-150
function applyTemplate(template) {
  // ✅ FAIT
  if (template.structure?.dialogues) {
    template.structure.dialogues.forEach(d => addDialogue(...));
  }
  
  // ❌ MANQUE :
  // - Confirmation avant overwrite?
  // - Preview du template avant apply?
  // - Customization dialogues (remplace [...])?
  // - Undo si aplications fails?
  
  // ⚠️ À tester :
  // - Focus management après modal close
  // - ARIA live regions pour feedback
  // - Scroll position après apply
}
```

**À améliorer** : Basé sur feedback utilisateur

---

### 8. **src/components/DialoguesPanel.jsx**
**État** : RÉCENT (nov 2025) - Stable mais peut s'optimiser

```jsx
// Ligne ~200-250 (Choix rendering)
{selectedDialogue.choices.map((choice, choiceIdx) => (
  <div key={choiceIdx} className="...">
    {/* ✅ FAIT */}
    {/* ❌ MANQUE :
      - Drag-drop reorder des choix (comme ScenesPanel)?
      - Duplicate choice button?
      - Move up/down buttons?
      
      - Virtualisation si 100+ choix?
      - Focus ring visible sur keyboard nav?
      - ARIA labels pour boutons actions?
    */}
  </div>
))}

// Performance:
// ⚠️ À profiler :
// - Rerender coûteux si 50+ dialogues?
// - State lifting dans list parent?
// - useMemo pour scene.dialogues?
```

**À améliorer** : Si feedback enfants le demande

---

## 🔍 TODOs commentés dans le code

### Greppable TODOs
```bash
grep -r "TODO:" src/       # Cherche tous les TODOs
grep -r "FIXME:" src/      # Cherche tous les FIXMEs
grep -r "HACK:" src/       # Cherche tous les HACKs
grep -r "XXX:" src/        # Cherche tous les XXXs
```

**Exemple** :
```javascript
// src/core/eventBus.js
// TODO: Ajouter priorités d'événements (phase 6.0)
// TODO: Implémenter debounce pour événements fréquents
// FIXME: Vérifier memory leak sur unsubscribe
```

---

## 📊 Matrice : Complet vs Incomplet

| Fichier | Status | À faire | Dépend de | Phase |
|---------|--------|---------|-----------|-------|
| DialoguesPanel.jsx | ✅ 95% | Optimisations | - | 5.5 |
| ScenesPanel.jsx | ✅ 100% | - | - | 5.5 |
| ConfirmModal.jsx | ✅ 100% | Animations | - | 5.5 |
| AppContext.jsx | ⚠️ 70% | Undo/redo, validation | - | 5.6 |
| ProblemsPanel.jsx | ⚠️ 60% | Validation avancée | schemas.json | 6.0 |
| PlayMode.jsx | ❌ 20% | Logique jeu complète | RulesEngine | 6.0 |
| ConditionEvaluator.js | ⚠️ 40% | Opérateurs avancés | - | 6.0 |
| DevToolsPanel.jsx | ⚠️ 50% | Debugging complet | EventBus v2 | 6.0 |
| OutcomeModal.jsx | 🗑️ Legacy | À supprimer | - | - |

---

## 🎯 Pour Perplexity : Questions à poser

### "Est-ce bug ou feature?"

**Si tu vois code incomplet** :

```
Q: Cette fonction n'a pas les cas [X, Y, Z] - c'est volontaire?
R: Voir PERPLEXITY_CONTEXT.md → "Features intentionnellement incomplètes"

Q: PlayMode.jsx a des TODOs partout - je dois les implémenter?
R: NON - attend RulesEngine phase 6.0. Ne pas toucher.

Q: AppContext n'a pas Undo/Redo - c'est à ajouter?
R: Oui, mais phase 5.6 (après DialoguesPanel finalisé). À inclure dans analyse.

Q: OutcomeModal.jsx ne sert à rien?
R: Legacy. À supprimer après validation que dialogues OK.
```

---

## ✅ Code production-ready

### Ces fichiers sont STABLE - analyser pour améliorations (pas de bugs)

- `src/components/DialoguesPanel.jsx` ✅
- `src/components/ScenesPanel.jsx` ✅
- `src/components/CharactersPanel.jsx` ✅
- `src/components/ConfirmModal.jsx` ✅
- `src/components/StudioShell.jsx` ✅
- `src/AppContext.jsx` ⚠️ (améliorations possibles)
- `src/utils/duplication.js` ✅
- `src/core/sanitizer.js` ✅
- `src/core/schema.js` ✅

---

## ⚠️ Code à nettoyer

```
À faire après phase 5.5 :

□ Supprimer OutcomeModal.jsx
□ Nettoyer legacy/ folder
□ Supprimer docs/legacy/*.md
□ Consolider ConditionEvaluator (après RulesEngine)
□ Deprecate ancien EventBus (si v2 créé)
□ Archiver ancien PlayMode (avant RulesEngine)
```

---

**Doc version** : 1.0 (2025-12-13)  
**Mise à jour suivante** : Phase 6.0 (RulesEngine)
