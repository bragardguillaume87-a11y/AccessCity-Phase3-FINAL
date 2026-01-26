# Décision Refonte AccessCity - TL;DR (1 minute de lecture)

**Date**: 3 janvier 2026
**Statut**: RECOMMANDATION APPROUVÉE (en attente validation équipe)

---

## Décision Finale : PLAN HYBRIDE

```
┌─────────────────────────────────────────────────────────────┐
│ ADOPTER : Plan A (Dialogues Gaming) + Cherry-Pick Plan B   │
│                                                             │
│ ✅ Compléter Plan A (5 phases restantes)                   │
│ ✅ Ajouter Plan B Tâches 3, 4, 5, 6, 7                     │
│ ❌ IGNORER Plan B Tâches 1, 2, 8 (déjà fait ou inutile)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Pourquoi ?

| Critère | Justification |
|---------|---------------|
| **ROI** | 60% code réutilisé, 35.5h effort (vs 50h Plan B seul) |
| **Risque** | FAIBLE - Évolution incrémentale, pas de refonte totale |
| **Progrès** | 30% déjà fait (Plan A Phases 1-2-4 ✅) |
| **Délai** | 4-6 semaines (vs 8-10 semaines Plan B intégral) |
| **UX** | Gaming UI déjà validé (AssetsLibraryModal) |

---

## Ce qu'on Garde de Plan A

✅ **Phase 1** : Hook useTypewriter (COMPLÉTÉ)
✅ **Phase 2** : Système onglets Scènes/Dialogues (COMPLÉTÉ)
⚪ **Phase 3** : Synchronisation clic dialogue (À FAIRE - Sprint 1)
✅ **Phase 4** : Toggle panneau droit (COMPLÉTÉ)
⚪ **Phase 5** : Renommage français (OPTIONNEL - Sprint 6)
⚪ **Phase 6** : Modes plein écran (À FAIRE - Sprint 1)
⚪ **Phase 7** : Animations gaming (À FAIRE - Sprint 2)
⚪ **Phase 8** : Mode Simple/Avancé (À FAIRE - Sprint 5)

---

## Ce qu'on Prend de Plan B

✅ **Tâche 1** : Design Tokens (SKIP - déjà fait)
❌ **Tâche 2** : Architecture 4 zones (SKIP - 3 zones OK)
⚪ **Tâche 3** : Vue Graph Dialogue (À FAIRE - Sprint 3) 🎯
⚪ **Tâche 4** : Shortcuts clavier (À FAIRE - Sprint 4) 🎯
⚪ **Tâche 5** : Affordances boutons (À FAIRE - Sprint 2)
⚪ **Tâche 6** : Structure ARIA (À FAIRE - Sprint 5) 🎯
⚪ **Tâche 7** : Badges narratifs (À FAIRE - Sprint 4)
✅ **Tâche 8** : Undo/Redo toolbar (SKIP - déjà dans TopBar)

🎯 = HAUTE VALEUR

---

## Ce qu'on IGNORE de Plan B

### Tâche 2 : Architecture 4 zones (8-12h économisées)

**Pourquoi ?**
- ❌ Conflit avec 3-panel actuel (EditorShell stable)
- ❌ Refonte majeure = risque élevé
- ❌ Bénéfice marginal (4 zones vs 3 zones)

**Alternative** : Garder TopBar + 3 colonnes (LeftPanel, MainCanvas, UnifiedPanel)

---

## Roadmap Simplifiée

```
Sprint 1 (Sem 1-2)  → Fondations      (Phase 3+6)          → 5-7h
Sprint 2 (Sem 3)    → Gaming UX       (Phase 7+T5)         → 5-6h
Sprint 3 (Sem 4)    → Graph           (Plan B T3) 🎯       → 6-8h
Sprint 4 (Sem 5)    → Productivité    (Plan B T4+T7) 🎯    → 4-6h
Sprint 5 (Sem 6)    → WCAG + Phase 8  (Plan B T6+Phase 8)  → 7-10h
Sprint 6 (Sem 7)    → Polish          (Phase 5, cleanup)   → 3-4h

TOTAL : 30-41h (moyenne 35.5h) sur 4-6 semaines
```

---

## Jalons Critiques

| Jalon | Date | Livrables |
|-------|------|-----------|
| **MVP Dialogues** | Semaine 2 | Sync 3 actions + fullscreen |
| **Graph Navigation** | Semaine 4 | Toggle Visual/Graph |
| **Productivité** | Semaine 5 | Shortcuts + badges |
| **WCAG 2.2 AA** | Semaine 6 | Audit accessibilité validé |
| **Production Ready** | Semaine 7 | Cleanup + i18n |

---

## Quick Wins (Top 3)

1. **Shortcuts clavier** (Sprint 4) - 2-3h, impact ÉLEVÉ
2. **Modes fullscreen** (Sprint 1) - 2-3h, impact MOYEN
3. **Badges narratifs** (Sprint 4) - 2-3h, impact MOYEN

---

## Prochaines Actions (Sprint 1)

```bash
# 1. Créer branche feature
git checkout -b feature/refonte-hybride

# 2. Implémenter Phase 3 (sync clic dialogue)
- Action 2: Move timeline playhead      → 1-1.5h
- Action 3: Scroll to dialogue editor   → 1-1.5h

# 3. Implémenter Phase 6 (fullscreen)
- Overlays fixed inset-0 z-50           → 1h
- Escape key handler global             → 0.5h

# 4. Tests UX workflow dialogues         → 1h

# TOTAL : 5-7h
```

---

## Documents de Référence

| Document | Quand l'utiliser |
|----------|------------------|
| **DECISION_REFONTE_TL_DR.md** (ce fichier) | Vue rapide 1 minute |
| **RECOMMANDATION_STRATEGIQUE_REFONTE.md** | Analyse complète, comparaison détaillée |
| **DASHBOARD_EXECUTION_REFONTE.md** | Suivi sprint par sprint, KPIs |
| **DIALOGUE_REFONTE_PLAN.md** | Détails techniques Plan A |
| **ARCHIVED_NOEL_INSTRUCTIONS.md** | Détails techniques Plan B |
| **CONTINUATION_CONTEXT.md** | Gaming UI guidelines, état actuel |

---

## Résumé en 1 Phrase

**"On complète Plan A (dialogues gaming) en 5 sprints, et on ajoute les 5 meilleures idées de Plan B (graph, shortcuts, ARIA, badges, affordances) pour un total de 35.5h sur 4-6 semaines."**

---

**Validation** : En attente approval équipe (Product Owner, Tech Lead, UX Lead)

**Contact** : Voir DASHBOARD_EXECUTION_REFONTE.md section "Contacts et Rôles"
