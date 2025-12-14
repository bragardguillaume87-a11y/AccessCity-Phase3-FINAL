# 📋 Prompt pour Perplexity Pro - Analyse DialoguesPanel

Copie-colle ce prompt dans Perplexity Pro et adapte les questions selon tes besoins.

---

## 🎯 Prompt complet (c/c Perplexity)

```
Analyse l'application AccessCity Scenario Editor MVP pour proposer des améliorations.

CONTEXTE APPLICATIF
===================
- Stack: React 18 + Vite + Tailwind CSS
- Cible: Enfants 10+ ans en situation de handicap (trackball, eViacam, clavier)
- Branche: scenario-editor-MVP
- Version: 5.5 (phase finale, avant RulesEngine phase 6.0)
- Architecture: Data-driven (UI pilotée par JSON)

DOCUMENTATION OBLIGATOIRE À LIRE
=================================
Avant d'analyser, consulte ces fichiers (ils répondent à 90% des questions):

1. PERPLEXITY_CONTEXT.md
   - Features intentionnellement incomplètes (PlayMode, ProblemsPanel, etc.)
   - Code à ignorer (legacy/, OutcomeModal)
   - Conventions de code strictes (ASCII, imports .js/.jsx, ARIA)
   - Zones critiques à analyser

2. INCOMPLETE_CODE_INVENTORY.md
   - List détaillée du code en cours (intentionnel vs bugs)
   - Matrice complet/incomplet par fichier
   - TODOs greppables dans le code

3. docs/CODING_RULES.md
   - Standards strictes (pas de fragments, validation, tests)
   - Conventions nommage et structure

4. docs/ACCESSIBILITY.md
   - Specs WCAG AA minimum
   - Navigation clavier (Tab, Shift+Tab, Escape)
   - ARIA labels obligatoires partout
   - Contraste texte

5. docs/PROJECT_MEMORY_SEED.md
   - Vision stratégique 5.5+
   - Modules critiques (EventBus, VariableManager, ConditionEvaluator)

ZONE À ANALYSER : DialoguesPanel
==================================

Fichiers impliqués:
- src/components/DialoguesPanel.jsx (RECENT - nov 2025)
- src/data/scenarioTemplates.js (données templates)
- src/utils/duplication.js (copie dialogues)
- src/AppContext.jsx (state management)
- src/components/TemplateSelector.jsx (modal templates)
- src/components/ConfirmModal.jsx (modal confirmations)

QUESTIONS PRIORITAIRES (Ordre d'importance)
=============================================

🔴 ACCESSIBILITÉ (PRIORITÉ #1 - Critère de réussite)
------------------------------------------------------
Q1: Focus management complet?
    - Focus trap dans TemplateSelector modal?
    - Focus revient au bonbon après close modal?
    - Focus visible sur keyboard nav (visible outline)?
    - Tested avec trackball + clavier?

Q2: ARIA complète?
    - Tous les boutons ont aria-label?
    - Dialogues/modals ont aria-modal="true"?
    - Live regions pour notifications toast?
    - ARIA landmarks (main, nav, region)?

Q3: Navigation clavier fonctionnelle?
    - Tab / Shift+Tab: navigue tous les éléments?
    - Enter: active boutons?
    - Escape: ferme modals?
    - Raccourcis clavier (Ctrl+D dupliquer)?

Q4: Contraste WCAG AA?
    - Texte sur fond: ratio 4.5:1 (normal) ou 3:1 (large)?
    - Focus ring visible (2px minimum)?
    - Hover states visibles?

🟡 PERFORMANCE (PRIORITÉ #2)
------------------------------
Q5: Virtualisation liste?
    - Que se passe si 100+ dialogues?
    - Coût rerender liste complète?
    - Suggestion: React-window ou windowing?

Q6: Rerender efficients?
    - AppContext changes causent rerender global?
    - useMemo() utilisé pour scene.dialogues?
    - useCallback() pour handlers fréquents?
    - Profiler avec React DevTools?

Q7: Gestion mémoire?
    - Memory leaks sur TemplateSelector (event listeners)?
    - Cleanup on unmount?

🟢 ARCHITECTURE (PRIORITÉ #3)
------------------------------
Q8: Validation des données?
    - Vérifier choix orphelins (nextScene invalide)?
    - Characters référencés existent?
    - Détection cycles/boucles infinies?

Q9: State management?
    - Undo/Redo pour dialogues (Ctrl+Z)?
    - Grouper actions (3 edits = 1 undo)?
    - LocalStorage recovery after crash?

Q10: Patterns manquants?
     - Drag-drop reorder choix (comme ScenesPanel)?
     - Duplicate choice button?
     - Move up/down choices?

🔵 UX ENFANTS 10+ ans (PRIORITÉ #4)
-------------------------------------
Q11: Langage adapté?
     - Textes sont simples et clairs?
     - Pas de jargon technique?
     - Émojis utiles ou distrayants?

Q12: Feedback visuel?
     - Animations (fadeIn ok)?
     - Toast notifications claires?
     - États hover/active visibles?
     - Loading states?

Q13: Erreurs utilisateur?
     - Messages d'erreur constructifs?
     - Suggestions de correction?
     - Pas de crashes silencieux?

DÉTAILS POUR CHAQUE COMPOSANT
==============================

DialoguesPanel.jsx
------------------
Analyse:
- Architecture: Colonnes (liste gauche + édition droite)
- Imports: React, useState, useMemo, useApp, ConfirmModal, TemplateSelector
- State: editingDialogueIdx, templateSelectorOpen, notification, confirmOpen
- Functions: onAdd(), handleDuplicateDialogue(), handleSelectTemplate()

Questions:
□ Focus trap si 50+ dialogues?
□ Hotkey Ctrl+D fonctionne?
□ Notification toast disparaît après 3s?
□ Keyboard nav sur boutons actions?

scenarioTemplates.js
--------------------
Analyse:
- Contient 5+ templates (simple-choice, skill-check, npc-conversation, etc.)
- Structure: { id, name, description, icon, category, structure }

Questions:
□ Preview template avant apply?
□ Undo si apply échoue?
□ Personnalisation texte (remplace [...])?

TemplateSelector.jsx
--------------------
Analyse:
- Modal avec liste templates par catégorie

Questions:
□ Focus trap dans modal?
□ Escape key ferme?
□ ARIA modal complet?
□ Scroll position après close?

AppContext.jsx
--------------
Analyse:
- State global: scenarios, characters, scenes, selectedSceneForEdit
- CRUD: addScene, updateScene, deleteScene
- LocalStorage sync

Questions:
□ Validation avant save?
□ Corruption protection localStorage?
□ Quota max (5MB)?
□ Undo/Redo implémenté?
□ Race condition import/export?

RÉSULTAT ATTENDU
=================

Présente tes findings en format:

## 🟢 Points forts
- Point 1 (avec fichier + ligne)
- Point 2

## 🔴 Problèmes trouvés
- Problème 1: [Sévérité] Description
  - Fichier: src/...
  - Ligne: XX-YY
  - Impact: ...
  - Fix proposée: ...

- Problème 2: ...

## 🟡 À améliorer (Nice-to-have)
- Amélioration 1: Raison + implémentation
- Amélioration 2: ...

## ✅ Recommendations
1. ...
2. ...

CONTEXTES EXCLUS
=================

❌ NE PAS ANALYSER (code incomplet intentionnel):
- PlayMode.jsx (attend RulesEngine phase 6.0)
- ProblemsPanel.jsx (validation avancée phase 6.0)
- ConditionEvaluator.js (opérateurs phase 6.0)
- DevToolsPanel.jsx (debugging phase 6.0)
- OutcomeModal.jsx (legacy deprecated)

Si tu trouves du code ambigu dans ces fichiers → ignore-les
et focus sur DialoguesPanel + AppContext seulement.

RESSOURCES
==========

Repository: https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL
Branch: scenario-editor-MVP
Fichiers clés:
- src/components/DialoguesPanel.jsx
- src/AppContext.jsx
- src/components/TemplateSelector.jsx
- src/data/scenarioTemplates.js
- docs/ACCESSIBILITY.md
- PERPLEXITY_CONTEXT.md
- INCOMPLETE_CODE_INVENTORY.md

GO! 🚀
```

---

## 🎯 Variantes du prompt (selon tes besoins)

### **Variante 1 : ACCESSIBILITÉ uniquement**

```
Analyse DialoguesPanel (React) pour l'accessibilité WCAG AA.

Focus:
- Navigation clavier: Tab, Shift+Tab, Escape, Enter complètes?
- ARIA labels: Tous les boutons, inputs, modals?
- Focus management: Trap dans modals? Restore after close?
- Contraste: Texte sur fond >= 4.5:1?
- Trackball-friendly: Pas de hover-only actions?

Fichiers à analyser:
- src/components/DialoguesPanel.jsx
- src/components/TemplateSelector.jsx
- src/components/ConfirmModal.jsx
- docs/ACCESSIBILITY.md

Expected output: Liste bugs a11y avec fixes prioritaires
```

### **Variante 2 : PERFORMANCE uniquement**

```
Profiler DialoguesPanel pour identifier goulots performance.

Focus:
- Virtualisation si 100+ dialogues?
- Rerender coûteux sur AppContext changes?
- Memory leaks (event listeners)?
- LocalStorage perf (JSON.parse abuse)?
- Bundle size (lazy load helpful)?

Fichiers à analyser:
- src/components/DialoguesPanel.jsx
- src/AppContext.jsx
- package.json (dépendances)

Expected output: Flamegraph + recommendations
```

### **Variante 3 : BUGS & REGRESSIONS**

```
Cherche bugs potentiels dans DialoguesPanel.

Focus sur:
- Crash on delete si référence existe ailleurs?
- LocalStorage corruption?
- Race conditions import/export?
- Memory leaks?
- État corrompu après erreur réseau?

Test scenarios:
1. 50+ dialogues → pagination?
2. Delete dialogue utilisé → orphelins?
3. Duplicate + modify + undo → rollback correct?
4. Modal interrupt (Escape mid-edit) → state ok?
5. Reload page avec localStorage → data preserved?

Expected output: Bug list avec reproduction steps
```

### **Variante 4 : AMÉLIORATIONS UX ENFANTS**

```
Optimise UX pour enfants 10+ ans (accessibilité primaire).

Focus sur:
- Langage adapté (pas jargon)?
- Feedback visuel clair (animations ok)?
- Erreurs constructives (fixes proposées)?
- Pas d'actions irréversibles (confirmation ok)?
- Mobile-friendly? Trackball-friendly?
- Tailles boutons >= 44x44px?
- Spacing cohérent?

Files:
- src/components/DialoguesPanel.jsx
- src/data/textSnippets.js (textes)
- tailwind.config.js (spacing)

Expected output: UX improvements prioritized by child testing
```

---

## 📝 Checklist avant de lancer Perplexity

```
□ As-tu lu PERPLEXITY_CONTEXT.md? (sinon Perplexity va se perdre)
□ As-tu lu INCOMPLETE_CODE_INVENTORY.md? (pour ignorer les bons codes en cours)
□ Choisis variante du prompt (accessibilité, perf, bugs, etc.)
□ Copie-colle le prompt complet
□ Spécifie le repo GitHub (si Perplexity peut y accéder)
□ Ajoute tes questions prioritaires
□ Attends résultats
□ Si Perplexity trouve ambigu → renvoie vers PERPLEXITY_CONTEXT.md
```

---

## 🔗 Liens directs

**Ouvre ces liens dans Perplexity pour qu'il les lise** :

1. https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL/blob/scenario-editor-MVP/PERPLEXITY_CONTEXT.md
2. https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL/blob/scenario-editor-MVP/INCOMPLETE_CODE_INVENTORY.md
3. https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL/tree/scenario-editor-MVP/src/components
4. https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL/blob/scenario-editor-MVP/docs/ACCESSIBILITY.md

---

**Créé** : 2025-12-13  
**Pour** : Perplexity Pro analysis  
**Version** : 1.0
