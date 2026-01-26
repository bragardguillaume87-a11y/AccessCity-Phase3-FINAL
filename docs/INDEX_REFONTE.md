# Index Documentation - Refonte AccessCity Studio

**Mise à jour**: 3 janvier 2026
**Type**: Guide de navigation documentation

---

## Démarrage Rapide (Choisissez votre profil)

### Je suis Product Owner / Manager

**Vous voulez** : Comprendre la décision stratégique et valider la roadmap

**Lisez dans l'ordre** :
1. **DECISION_REFONTE_TL_DR.md** (1 minute) - Résumé exécutif
2. **COMPARATIF_PLANS_VISUEL.md** (5 minutes) - Tableaux de décision
3. **RECOMMANDATION_STRATEGIQUE_REFONTE.md** (20 minutes) - Analyse complète

**Temps total** : 30 minutes

---

### Je suis Tech Lead / Architecte

**Vous voulez** : Évaluer la faisabilité technique et préparer l'implémentation

**Lisez dans l'ordre** :
1. **RECOMMANDATION_STRATEGIQUE_REFONTE.md** (20 minutes) - Analyse détaillée
2. **COMPARATIF_PLANS_VISUEL.md** (5 minutes) - Matrice de risques
3. **DASHBOARD_EXECUTION_REFONTE.md** (15 minutes) - Planning sprints
4. **CONTINUATION_CONTEXT.md** (10 minutes) - État actuel du code

**Temps total** : 50 minutes

---

### Je suis Développeur Frontend

**Vous voulez** : Savoir quoi coder et comment

**Lisez dans l'ordre** :
1. **DECISION_REFONTE_TL_DR.md** (1 minute) - Vue d'ensemble
2. **DASHBOARD_EXECUTION_REFONTE.md** Sprint actuel (10 minutes) - Tâches détaillées
3. **DIALOGUE_REFONTE_PLAN.md** (15 minutes) - Specs techniques Plan A
4. **CONTINUATION_CONTEXT.md** Section Gaming UI (10 minutes) - Guidelines design

**Temps total** : 40 minutes

**Commencer par** : Sprint 1 Tâche 1.1 (Phase 3 : Move timeline playhead)

---

### Je suis UX/UI Designer

**Vous voulez** : Valider les choix UX et préparer les wireframes

**Lisez dans l'ordre** :
1. **COMPARATIF_PLANS_VISUEL.md** (5 minutes) - Gaming UX scores
2. **CONTINUATION_CONTEXT.md** Section Gaming UI Guidelines (15 minutes)
3. **DIALOGUE_REFONTE_PLAN.md** (15 minutes) - Wireframes dialogues
4. **DASHBOARD_EXECUTION_REFONTE.md** (10 minutes) - Définition of Done UX

**Temps total** : 45 minutes

---

### Je suis Accessibility Lead

**Vous voulez** : Assurer conformité WCAG 2.2 AA

**Lisez dans l'ordre** :
1. **RECOMMANDATION_STRATEGIQUE_REFONTE.md** Section WCAG (10 minutes)
2. **DASHBOARD_EXECUTION_REFONTE.md** Sprint 5 (10 minutes) - Tâches ARIA
3. **ARCHIVED_NOEL_INSTRUCTIONS.md** Tâche 6 (10 minutes) - Structure ARIA
4. **COMPARATIF_PLANS_VISUEL.md** Section Accessibilité (5 minutes)

**Temps total** : 35 minutes

---

### Je suis QA / Testeur

**Vous voulez** : Comprendre les critères de succès et tests à faire

**Lisez dans l'ordre** :
1. **DASHBOARD_EXECUTION_REFONTE.md** Définition of Done (15 minutes)
2. **COMPARATIF_PLANS_VISUEL.md** Section KPIs (5 minutes)
3. **DIALOGUE_REFONTE_PLAN.md** Contraintes techniques (5 minutes)

**Temps total** : 25 minutes

---

## Catalogue Complet des Documents

### Documents de Décision (À lire EN PREMIER)

| Document | Pages | Temps Lecture | Public Cible | Priorité |
|----------|-------|---------------|--------------|----------|
| **DECISION_REFONTE_TL_DR.md** | 2 | 1 min | Tous | 🔴 CRITIQUE |
| **COMPARATIF_PLANS_VISUEL.md** | 10 | 5 min | PO, Tech Lead, UX | 🔴 CRITIQUE |
| **RECOMMANDATION_STRATEGIQUE_REFONTE.md** | 25 | 20 min | PO, Tech Lead, Archi | 🔴 CRITIQUE |

### Documents d'Exécution (À lire pour IMPLÉMENTER)

| Document | Pages | Temps Lecture | Public Cible | Priorité |
|----------|-------|---------------|--------------|----------|
| **DASHBOARD_EXECUTION_REFONTE.md** | 20 | 15 min | Tous (équipe dev) | 🟡 IMPORTANT |
| **DIALOGUE_REFONTE_PLAN.md** | 8 | 15 min | Dev Frontend, UX | 🟡 IMPORTANT |
| **ARCHIVED_NOEL_INSTRUCTIONS.md** | 30 | 30 min | Tech Lead, Dev | 🟢 RÉFÉRENCE |

### Documents de Contexte (À lire pour COMPRENDRE)

| Document | Pages | Temps Lecture | Public Cible | Priorité |
|----------|-------|---------------|--------------|----------|
| **CONTINUATION_CONTEXT.md** | 15 | 10 min | Dev Frontend, UX | 🟡 IMPORTANT |
| **START_HERE.md** | 10 | 10 min | Nouveaux arrivants | 🟢 RÉFÉRENCE |

---

## Arborescence Documentation

```
docs/
├── INDEX_REFONTE.md (ce fichier)        ← Vous êtes ici
│
├── 📋 DÉCISION (Lisez EN PREMIER)
│   ├── DECISION_REFONTE_TL_DR.md         ← Résumé 1 minute ⭐
│   ├── COMPARATIF_PLANS_VISUEL.md        ← Tableaux comparatifs
│   └── RECOMMANDATION_STRATEGIQUE_REFONTE.md ← Analyse complète
│
├── 🚀 EXÉCUTION (Lisez pour CODER)
│   ├── DASHBOARD_EXECUTION_REFONTE.md    ← Planning sprints
│   ├── DIALOGUE_REFONTE_PLAN.md          ← Specs Plan A
│   └── ARCHIVED_NOEL_INSTRUCTIONS.md     ← Specs Plan B
│
├── 📚 CONTEXTE (Lisez pour COMPRENDRE)
│   ├── CONTINUATION_CONTEXT.md           ← État actuel + Gaming UI
│   └── START_HERE.md                     ← Vue d'ensemble projet
│
└── 📦 ARCHIVES (Référence historique)
    ├── GAMING_UI_GUIDELINES.md (archivé, voir CONTINUATION_CONTEXT)
    ├── PHASE2_PANELS_MIGRATION.md
    └── MIGRATION_SESSION_SUMMARY.md
```

---

## Résumé de la Décision (Rappel)

```
╔═══════════════════════════════════════════════════════════════╗
║  DÉCISION : PLAN HYBRIDE (Complete Plan A + Cherry-Pick B)  ║
╠═══════════════════════════════════════════════════════════════╣
║  Effort:    30-41h (moyenne 35.5h)                          ║
║  Durée:     4-6 semaines                                    ║
║  ROI:       50.4% (meilleur des 3 scénarios)                ║
║  Risque:    FAIBLE (3/10)                                   ║
║  Score:     9.05/10 (vs 7.85 Plan A, 5.35 Plan B)           ║
╠═══════════════════════════════════════════════════════════════╣
║  Bénéfices:                                                 ║
║  ✅ Gaming UX 10/10                                         ║
║  ✅ WCAG 2.2 AA 100%                                        ║
║  ✅ Vue Graph DialogueFlow (ReactFlow)                      ║
║  ✅ Shortcuts clavier productivité                          ║
║  ✅ 99% code existant réutilisé                             ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Roadmap Visuelle (Rappel)

```
Sprint 1 (Sem 1-2)  → Fondations      (Phase 3+6)          → 5-7h
Sprint 2 (Sem 3)    → Gaming UX       (Phase 7+T5)         → 5-6h
Sprint 3 (Sem 4)    → Graph           (Plan B T3) 🎯       → 6-8h
Sprint 4 (Sem 5)    → Productivité    (Plan B T4+T7) 🎯    → 4-6h
Sprint 5 (Sem 6)    → WCAG + Phase 8  (Plan B T6+Phase 8)  → 7-10h
Sprint 6 (Sem 7)    → Polish          (Phase 5, cleanup)   → 3-4h

TOTAL : 30-41h sur 4-6 semaines
```

---

## FAQ Documentation

### Q1 : Par où commencer si je rejoins le projet aujourd'hui ?

**Réponse** : Lisez dans cet ordre exact :
1. **DECISION_REFONTE_TL_DR.md** (1 min) - Vue d'ensemble
2. **CONTINUATION_CONTEXT.md** Section "État Actuel" (5 min) - Code existant
3. **DASHBOARD_EXECUTION_REFONTE.md** Sprint actuel (10 min) - Prochaines tâches

**Temps total** : 15 minutes pour être opérationnel

---

### Q2 : Comment savoir si une feature vient de Plan A ou Plan B ?

**Réponse** : Consultez **COMPARATIF_PLANS_VISUEL.md** Section "Fonctionnalités Livrées"

Tableau récapitulatif :
```
Plan A uniquement:
- Hook useTypewriter
- Système onglets Scènes/Dialogues
- Toggle panneau droit
- Mode Simple/Avancé

Plan B uniquement:
- Vue Graph Dialogue (ReactFlow)
- Shortcuts clavier complets
- Structure ARIA complète

Commun aux 2:
- Design tokens
- Undo/Redo toolbar
- Animations gaming
```

---

### Q3 : Quelle est la différence entre Plan A, Plan B, Plan Hybride ?

**Réponse rapide** :

| Plan | Focus | Effort | Recommandation |
|------|-------|--------|----------------|
| **Plan A** | Ergonomie dialogues gaming | 19-25h | ⚠️ Incomplet (pas de graph, pas WCAG 2.2) |
| **Plan B** | Refonte UI/UX globale | 40-55h | ❌ Trop risqué (refonte 4 zones) |
| **Plan Hybride** | Meilleur des 2 | 30-41h | ✅ **RECOMMANDÉ** (ROI optimal) |

**Réponse détaillée** : Lisez **COMPARATIF_PLANS_VISUEL.md** Section "Vue d'Ensemble"

---

### Q4 : Comment suivre l'avancement du projet ?

**Réponse** : 2 options :

**Option 1 - Suivi Hebdomadaire** :
- Consultez **DASHBOARD_EXECUTION_REFONTE.md** Section "Changelog"
- Mis à jour chaque vendredi fin de sprint

**Option 2 - Suivi en Temps Réel** :
- Vérifiez les commits Git (branche `feature/refonte-hybride`)
- Labels GitHub/GitLab : `sprint-1`, `sprint-2`, etc.

---

### Q5 : Où trouver les wireframes et maquettes ?

**Réponse** :

| Type | Document | Section |
|------|----------|---------|
| **Wireframes Plan A** | DIALOGUE_REFONTE_PLAN.md | Toutes les phases |
| **Wireframes Plan B** | ARCHIVED_NOEL_INSTRUCTIONS.md | Tâche 2 (Architecture) |
| **Wireframes Graph** | DASHBOARD_EXECUTION_REFONTE.md | Sprint 3 |
| **Gaming UI exemples** | CONTINUATION_CONTEXT.md | Section 5 (Patterns) |

---

### Q6 : Comment contribuer un nouveau composant gaming ?

**Réponse** : Suivez la **Gaming UI Checklist** (CONTINUATION_CONTEXT.md Section 4)

**Processus en 4 étapes** :
1. Lire Gaming UI Guidelines (CONTINUATION_CONTEXT.md Section 2-3)
2. Copier checklist section 4 (Design, Animations, Feedback, A11y)
3. Implémenter composant avec tous critères ✅
4. Tests : axe-core (WCAG) + validation visuelle

**Exemple référence** : `src/components/modals/AssetsLibraryModal` (gaming UI gold standard)

---

### Q7 : Quels sont les risques identifiés et comment les mitiger ?

**Réponse** : Consultez **DASHBOARD_EXECUTION_REFONTE.md** Section "Gestion Risques"

**Top 3 risques** :
1. **Bug régression EditorShell** (P: Faible, I: Élevé)
   - Mitigation : Tests E2E avant merge, feature flag
2. **ReactFlow perf > 100 nodes** (P: Moyen, I: Élevé)
   - Mitigation : Lazy load, virtualisation
3. **Dérive scope features extra** (P: Élevé, I: Moyen)
   - Mitigation : Lock scope par sprint, roadmap visible

---

### Q8 : Où trouver le code source des specs ?

**Réponse** :

| Spec | Fichier Code | Statut |
|------|--------------|--------|
| **useTypewriter hook** | `src/hooks/useTypewriter.js` | ✅ Implémenté |
| **LeftPanel (Tabs)** | `src/components/panels/LeftPanel.jsx` | ✅ Implémenté |
| **Design Tokens** | `src/styles/tokens.css` | ✅ Implémenté |
| **EditorShell 3-panel** | `src/components/EditorShell.jsx` | ✅ Implémenté |
| **AssetsLibraryModal gaming** | `src/components/modals/AssetsLibraryModal/` | ✅ Implémenté |
| **DialogueGraph (ReactFlow)** | - | ⚪ À créer Sprint 3 |
| **ShortcutsHelpPanel** | - | ⚪ À créer Sprint 4 |
| **Badge component** | - | ⚪ À créer Sprint 4 |

---

## Checklist Validation Décision

Avant de démarrer Sprint 1, assurez-vous que :

### Étape 1 : Compréhension
- [ ] J'ai lu **DECISION_REFONTE_TL_DR.md** (1 min)
- [ ] J'ai compris pourquoi Plan Hybride > Plan A/B
- [ ] Je connais les 6 sprints de la roadmap

### Étape 2 : Validation Équipe
- [ ] Product Owner a validé scope + roadmap
- [ ] Tech Lead a validé faisabilité technique
- [ ] UX Lead a validé gaming aesthetic + WCAG
- [ ] Équipe dev a estimé effort (35.5h acceptable)

### Étape 3 : Setup Technique
- [ ] Branche `feature/refonte-hybride` créée
- [ ] Dépendances vérifiées (toutes installées ✅)
- [ ] Environnement dev fonctionnel (`npm run dev`)

### Étape 4 : Communication
- [ ] Stakeholders informés (PO, client, management)
- [ ] Planning sprints communiqué (calendrier 6 semaines)
- [ ] Jalons critiques identifiés (MVP Semaine 2, WCAG Semaine 6)

---

## Contacts & Support

| Besoin | Contact | Document de Référence |
|--------|---------|----------------------|
| **Clarification décision** | Product Owner | RECOMMANDATION_STRATEGIQUE_REFONTE.md |
| **Question technique** | Tech Lead | DASHBOARD_EXECUTION_REFONTE.md |
| **Gaming UI guidelines** | UX Lead | CONTINUATION_CONTEXT.md |
| **WCAG compliance** | Accessibility Lead | DASHBOARD Sprint 5 |
| **Planning sprints** | Scrum Master | DASHBOARD_EXECUTION_REFONTE.md |

---

## Mises à Jour Documentation

**Fréquence** : Fin de chaque sprint (vendredi)

**Responsable** : Tech Lead ou Scrum Master

**Fichiers à mettre à jour** :
1. **DASHBOARD_EXECUTION_REFONTE.md** :
   - Section "Changelog" (activités sprint)
   - Statut tâches (⚪ → 🟡 → ✅)
   - Métriques KPIs

2. **DECISION_REFONTE_TL_DR.md** :
   - Progression globale (%) si jalons atteints

3. **CONTINUATION_CONTEXT.md** :
   - Nouveaux composants créés
   - Patterns réutilisables ajoutés

---

## Versions Documentation

| Version | Date | Changements Majeurs |
|---------|------|---------------------|
| **1.0** | 3 janvier 2026 | Création initiale (analyse + recommandation) |
| 1.1 | Fin Sprint 1 | Mise à jour DASHBOARD (changelog Sprint 1) |
| 1.2 | Fin Sprint 3 | Ajout DialogueGraph.jsx documentation |
| 2.0 | Fin Sprint 6 | Version finale Production Ready |

**Version actuelle** : 1.0 (Phase Planning)

---

## Commandes Rapides (Copier-Coller)

```bash
# Démarrer le projet
npm run dev

# Lire la décision (1 minute)
cat docs/DECISION_REFONTE_TL_DR.md

# Voir l'état actuel du code
cat docs/CONTINUATION_CONTEXT.md

# Consulter le sprint en cours
cat docs/DASHBOARD_EXECUTION_REFONTE.md | grep "Sprint 1"

# Créer branche feature
git checkout -b feature/refonte-hybride

# Lancer tests
npm run test:unit

# Vérifier WCAG
npm run lint
```

---

**Dernière mise à jour** : 3 janvier 2026
**Prochaine révision** : Fin Sprint 1 (semaine du 13 janvier 2026)
**Maintenu par** : Tech Lead / Architecture Review Board
