# Dashboard d'Exécution - Refonte AccessCity Studio

**Document de suivi opérationnel**
**Dernière mise à jour**: 3 janvier 2026
**Type**: Tableau de bord vivant (à mettre à jour chaque sprint)

---

## Vue d'Ensemble Projet

### Métriques Globales

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROGRESSION GLOBALE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Plan A (DIALOGUE_REFONTE_PLAN):   [███████░░░░░░░] 37.5% ✅   │
│  Plan B (ARCHIVED_NOEL_INSTRUCTIONS): [█░░░░░░░░░░░] 12.5% ✅   │
│  Plan Hybride Recommandé:          [░░░░░░░░░░░░░░] 0% 🚀      │
│                                                                  │
│  Effort Total Estimé:    30-41h (moyenne 35.5h)                 │
│  Effort Déjà Investi:    ~15h (Plan A Phases 1-2-4)             │
│  Effort Restant:         30-41h                                 │
│                                                                  │
│  Durée Calendaire:       4-6 semaines                           │
│  Date Démarrage Prévue:  Semaine du 6 janvier 2026              │
│  Date Livraison Cible:   Mi-février 2026                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Statut Actuel du Code

| Composant | État | Couverture Tests | WCAG 2.2 | Gaming UI | Commentaires |
|-----------|------|------------------|----------|-----------|--------------|
| **EditorShell** | ✅ Stable | Manuelle | 🟡 Partiel | 🟢 Oui | 3-panel layout fonctionnel |
| **LeftPanel** | ✅ Stable | Manuelle | 🟢 Oui | 🟢 Oui | Tabs Scènes/Dialogues OK |
| **MainCanvas** | 🟡 En cours | Manuelle | 🟡 Partiel | 🟡 Partiel | Fullscreen à compléter |
| **UnifiedPanel** | 🟡 En cours | Manuelle | 🟡 Partiel | 🟡 Partiel | Mode Simple/Avancé manquant |
| **DialoguesPanel** | ✅ Stable | Manuelle | 🟢 Oui | 🟢 Oui | Drag & drop fonctionnel |
| **useTypewriter** | ✅ Stable | ✅ Unitaires | 🟢 Oui | 🟢 Oui | Prefers-reduced-motion OK |
| **AssetsLibraryModal** | ✅ Stable | Manuelle | 🟢 Oui | 🟢 Oui | Gaming UX référence |

**Légende** : ✅ Complété | 🟡 Partiel/En cours | ⚪ À faire | ❌ Bloqué

---

## Roadmap Visuelle (Gantt Simplifié)

```
Semaine →   1      2      3      4      5      6      7
            │      │      │      │      │      │      │
Sprint 1    ████  │      │      │      │      │      │  Fondations (Phase 3+6)
Sprint 2    │      ████  │      │      │      │      │  Gaming UX (Phase 7+T5)
Sprint 3    │      │      ████  │      │      │      │  Graph (Plan B T3)
Sprint 4    │      │      │      ████  │      │      │  Productivité (T4+T7)
Sprint 5    │      │      │      │      ████████     │  WCAG + Phase 8
Sprint 6    │      │      │      │      │      │  ████  Polish (optionnel)
            │      │      │      │      │      │      │
Jalons:     │MVP   │      │Graph │Prod  │WCAG  │      │Release
```

**Jalons critiques** :
- 🎯 **MVP Dialogues** (Semaine 2) : Sync 3 actions + fullscreen
- 🎯 **Graph Navigation** (Semaine 4) : Toggle Visual/Graph
- 🎯 **Productivité** (Semaine 5) : Shortcuts + badges
- 🎯 **WCAG 2.2 AA** (Semaine 6) : Audit accessibilité validé
- 🎯 **Production Ready** (Semaine 7) : Cleanup + i18n

---

## Sprints Détaillés

### Sprint 1 - FONDATIONS (Semaine 1-2)

**Objectif** : Finaliser synchronisation dialogues + modes plein écran

#### Tâches

| # | Tâche | Priorité | Effort | Assigné | Statut | Commentaires |
|---|-------|----------|--------|---------|--------|--------------|
| 1.1 | Phase 3: Move timeline playhead | 🔴 CRITIQUE | 1-1.5h | - | ⚪ À faire | Sync avec clic dialogue |
| 1.2 | Phase 3: Scroll to dialogue editor | 🔴 CRITIQUE | 1-1.5h | - | ⚪ À faire | useRef + scrollIntoView |
| 1.3 | Phase 6: Overlays fullscreen | 🟡 MOYEN | 1h | - | ⚪ À faire | Fixed inset-0 z-50 |
| 1.4 | Phase 6: Escape key handler | 🟡 MOYEN | 0.5h | - | ⚪ À faire | useEffect + addEventListener |
| 1.5 | Tests UX workflow dialogues | 🟢 FAIBLE | 1h | - | ⚪ À faire | Validation E2E manuelle |

**Total Effort** : 5-7h

#### Définition of Done

- [ ] Clic dialogue déclenche 3 actions (preview ✅ + playhead ⚪ + scroll ⚪)
- [ ] Modes fullscreen Graph/Canvas/Preview accessibles (boutons ✅, overlays ⚪)
- [ ] Escape key ferme overlay fullscreen
- [ ] Tests manuels : workflow création dialogue → preview → sync OK
- [ ] Pas de régression EditorShell (tests smoke)

#### Risques Identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Timeline playhead API complexe | MOYEN | Analyser code existant TimelinePlayhead.jsx |
| Scroll to dialogue : multiple refs | FAIBLE | useRef array + scrollIntoView({ behavior: 'smooth', block: 'center' }) |

---

### Sprint 2 - GAMING UX (Semaine 3)

**Objectif** : Enrichir aesthetic gaming sur dialogues + affordances boutons

#### Tâches

| # | Tâche | Priorité | Effort | Assigné | Statut | Commentaires |
|---|-------|----------|--------|---------|--------|--------------|
| 2.1 | Phase 7: AnimatePresence dialogue preview | 🟡 MOYEN | 1.5h | - | ⚪ À faire | framer-motion exit animations |
| 2.2 | Phase 7: Glows hover dialogue cards | 🟡 MOYEN | 1h | - | ⚪ À faire | CSS --shadow-game-glow |
| 2.3 | Phase 7: Pulse animation dialogue actif | 🟡 MOYEN | 0.5h | - | ⚪ À faire | @keyframes pulse-glow |
| 2.4 | Plan B T5: DangerButton component | 🟡 MOYEN | 1h | - | ⚪ À faire | radix-ui alert-dialog |
| 2.5 | Plan B T5: Hover states renforcés | 🟡 MOYEN | 0.5h | - | ⚪ À faire | translateY(-2px) + shadow-lg |
| 2.6 | Tests gaming aesthetic cohérence | 🟢 FAIBLE | 0.5h | - | ⚪ À faire | Validation visuelle |

**Total Effort** : 5-6h

#### Définition of Done

- [ ] Dialogue preview avec animations entrée/sortie (fade + scale)
- [ ] Dialogue cards avec glow hover (purple/cyan)
- [ ] Dialogue actif avec pulse animation (visual feedback)
- [ ] Boutons dangereux (Delete Scene, etc.) avec modal confirmation
- [ ] Hover states cohérents sur tous les boutons (lift + shadow)
- [ ] Gaming aesthetic conforme checklist (CONTINUATION_CONTEXT.md section 4)

#### Références

- Gaming UI Guidelines : `docs/CONTINUATION_CONTEXT.md` section 2-3
- Design tokens : `src/styles/tokens.css`
- Référence implementation : `src/components/modals/AssetsLibraryModal`

---

### Sprint 3 - GRAPH NAVIGATION (Semaine 4)

**Objectif** : Vue graph interactive pour dialogues (Plan B Tâche 3)

#### Tâches

| # | Tâche | Priorité | Effort | Assigné | Statut | Commentaires |
|---|-------|----------|--------|---------|--------|--------------|
| 3.1 | Créer DialogueGraph.jsx (ReactFlow) | 🔴 HAUTE | 3h | - | ⚪ À faire | @xyflow/react + dagre layout |
| 3.2 | Custom nodes: DialogueNode | 🔴 HAUTE | 1h | - | ⚪ À faire | Card speaker + text preview |
| 3.3 | Custom nodes: ChoiceNode | 🔴 HAUTE | 1h | - | ⚪ À faire | Card avec liste choices |
| 3.4 | Edges auto-generation | 🟡 MOYEN | 1h | - | ⚪ À faire | nextDialogueId + choices.nextDialogueId |
| 3.5 | MiniMap + Controls + Background | 🟢 FAIBLE | 0.5h | - | ⚪ À faire | ReactFlow components |
| 3.6 | Intégration MainCanvas toggle View | 🟡 MOYEN | 1h | - | ⚪ À faire | useState viewMode + tabs |
| 3.7 | Tests navigation graph | 🟢 FAIBLE | 0.5h | - | ⚪ À faire | Click node → select dialogue |

**Total Effort** : 6-8h

#### Définition of Done

- [ ] Toggle View: Visual | Graph dans MainCanvas header
- [ ] Graph affiche tous dialogues scène active (nodes + edges)
- [ ] Click node dialogue → sélectionne dialogue (sync Phase 3)
- [ ] MiniMap navigation rapide (petits projets < 20 dialogues)
- [ ] Auto-layout dagre (top-to-bottom, hierarchical)
- [ ] Responsive : zoom/pan ReactFlow fonctionnel
- [ ] Style gaming cohérent (purple nodes, cyan edges)

#### Dépendances

- ✅ @xyflow/react déjà installé (12.10.0)
- ✅ dagre déjà installé (0.8.5)
- ⚠️ Performance : lazy load graph si > 100 nodes (edge case)

#### Wireframe Graph

```
┌──────────────────────────────────────────────┐
│ MainCanvas Header                            │
│ [👁️ Visual | 🕸️ Graph]  [🔍 Zoom] [⚙️ Layout]│
├──────────────────────────────────────────────┤
│                                              │
│   ┌─────────────────┐                       │
│   │ 1. narrator     │                       │
│   │ Vous arrivez... │                       │
│   └────────┬─────────┘                      │
│            │                                 │
│            ▼                                 │
│   ┌─────────────────┐                       │
│   │ 2. counsellor   │                       │
│   │ Bonjour ! ...   │                       │
│   └────────┬─────────┘                      │
│            │                                 │
│            ▼                                 │
│   ┌─────────────────┐                       │
│   │ 3. player CHOIX │                       │
│   │ • Bonjour       ├─────┐                 │
│   │ • Pas le temps  ├───┐ │                 │
│   └─────────────────┘   │ │                 │
│                         │ │                 │
│   [MiniMap]             ▼ ▼                 │
│   ┌─────┐          ┌────────┐               │
│   │  •  │          │ 4. ... │               │
│   │ • • │          └────────┘               │
│   └─────┘                                    │
└──────────────────────────────────────────────┘
```

---

### Sprint 4 - PRODUCTIVITÉ (Semaine 5)

**Objectif** : Shortcuts clavier + badges narratifs (Plan B T4+T7)

#### Tâches

| # | Tâche | Priorité | Effort | Assigné | Statut | Commentaires |
|---|-------|----------|--------|---------|--------|--------------|
| 4.1 | Compléter useKeyboardShortcuts.js | 🔴 HAUTE | 1h | - | ⚪ À faire | Ajouter N, Space, Delete |
| 4.2 | ShortcutsHelpPanel component | 🔴 HAUTE | 1.5h | - | ⚪ À faire | Ctrl+? ou Cmd+? |
| 4.3 | Tests conflits input/textarea | 🟡 MOYEN | 0.5h | - | ⚪ À faire | isEditable check |
| 4.4 | Badge.jsx component | 🟡 MOYEN | 1h | - | ⚪ À faire | Variants: choix, fin, boucle |
| 4.5 | Badges sur DialogueCard | 🟡 MOYEN | 1h | - | ⚪ À faire | Intégration DialoguesPanel |
| 4.6 | Badges sur Graph nodes | 🟡 MOYEN | 1h | - | ⚪ À faire | Intégration DialogueGraph |
| 4.7 | Documentation shortcuts README | 🟢 FAIBLE | 0.5h | - | ⚪ À faire | Tableau Markdown |

**Total Effort** : 4-6h

#### Définition of Done - Shortcuts

- [ ] Ctrl+S : Save (toast confirmation)
- [ ] Ctrl+Z : Undo (si canUndo)
- [ ] Ctrl+Y : Redo (si canRedo)
- [ ] Delete : Delete selected (dialogue, scene, character)
- [ ] Space : Preview current scene (modal)
- [ ] N : New dialogue (si scène sélectionnée)
- [ ] Ctrl+? : Help panel shortcuts
- [ ] Escape : Close modals/overlays
- [ ] Tests : shortcuts désactivés dans input/textarea

#### Définition of Done - Badges

- [ ] Badge component avec variants (choix, fin, boucle, branche)
- [ ] DialogueCard affiche badge si:
  - `choices && choices.length > 0` → Badge "CHOIX"
  - `!nextDialogueId && !choices` → Badge "FIN"
  - Détection boucle → Badge "BOUCLE" (optionnel)
- [ ] Graph nodes affichent badge (coin supérieur droit)
- [ ] Couleurs gaming (purple=choix, cyan=branche, red=fin)
- [ ] Accessible (aria-label sur badges)

#### Wireframe ShortcutsHelpPanel

```
┌────────────────────────────────────────────┐
│ Raccourcis Clavier             [× Fermer]  │
├────────────────────────────────────────────┤
│                                            │
│ NAVIGATION                                 │
│  Ctrl/Cmd + K    Commande palette          │
│  Ctrl/Cmd + ?    Aide raccourcis           │
│  Escape          Fermer modals             │
│                                            │
│ ÉDITION                                    │
│  Ctrl/Cmd + S    Sauvegarder               │
│  Ctrl/Cmd + Z    Annuler                   │
│  Ctrl/Cmd + Y    Refaire                   │
│  Delete          Supprimer sélection       │
│                                            │
│ ACTIONS RAPIDES                            │
│  N               Nouveau dialogue          │
│  Space           Prévisualiser scène       │
│  Ctrl/Cmd + P    Prévisualiser projet      │
│                                            │
└────────────────────────────────────────────┘
```

---

### Sprint 5 - ACCESSIBILITÉ (Semaine 6)

**Objectif** : WCAG 2.2 AA compliance + Mode Simple/Avancé (Plan B T6 + Phase 8)

#### Tâches

| # | Tâche | Priorité | Effort | Assigné | Statut | Commentaires |
|---|-------|----------|--------|---------|--------|--------------|
| 5.1 | Audit hiérarchie headings H1-H6 | 🔴 CRITIQUE | 1h | - | ⚪ À faire | Outil axe-core DevTools |
| 5.2 | Correction headings incorrects | 🔴 CRITIQUE | 1h | - | ⚪ À faire | Respect ordre H1→H2→H3 |
| 5.3 | Skip links navigation | 🟡 MOYEN | 0.5h | - | ⚪ À faire | "Aller au contenu principal" |
| 5.4 | Live regions toasts/announcements | 🟡 MOYEN | 0.5h | - | ⚪ À faire | role="status" aria-live |
| 5.5 | Tests lecteur écran (NVDA/JAWS) | 🔴 CRITIQUE | 1h | - | ⚪ À faire | Validation screen reader |
| 5.6 | Phase 8: Toggle Simple/Avancé header | 🟡 MOYEN | 1h | - | ⚪ À faire | useState mode + localStorage |
| 5.7 | Phase 8: Sections conditionnelles | 🟡 MOYEN | 2h | - | ⚪ À faire | Simple: 4 sections, Avancé: 8 |
| 5.8 | Phase 8: Intégration CharacterPositioning | 🟡 MOYEN | 1.5h | - | ⚪ À faire | Mode Avancé uniquement |
| 5.9 | Documentation WCAG README | 🟢 FAIBLE | 0.5h | - | ⚪ À faire | Checklist compliance |

**Total Effort** : 7-10h

#### Définition of Done - WCAG 2.2 AA

- [ ] Audit axe-core DevTools : 0 erreurs critiques
- [ ] Hiérarchie headings correcte (H1 unique, H2→H3→H4 logique)
- [ ] Skip link visible au focus (Aller au contenu principal)
- [ ] Live regions pour status changes (save, errors)
- [ ] Contraste couleurs ≥ 4.5:1 (texte normal), ≥ 3:1 (large/UI)
- [ ] Focus rings visibles (ring-4, contraste ≥ 3:1)
- [ ] Navigation clavier complète (Tab, Enter, Escape, Arrow keys)
- [ ] Tests lecteur écran NVDA : navigation logique, labels explicites

#### Définition of Done - Mode Simple/Avancé

- [ ] Toggle Simple/Avancé dans UnifiedPanel header
- [ ] Mode Simple (débutants) :
  - 4 sections : Backgrounds, Text, Characters, Objects
  - Contrôles basiques uniquement (upload, text input, simple select)
- [ ] Mode Avancé (power users) :
  - 8 sections : Simple + Effects, Timing, CharacterPositioning, Advanced
  - CharacterPositioningTools visible (gauche/centre/droite, taille)
- [ ] Préférence mode sauvegardée (localStorage)
- [ ] Tooltip "Besoin de plus de contrôles ? Activez le mode Avancé"

#### Checklist WCAG 2.2 AA

```
┌─────────────────────────────────────────────────────┐
│ WCAG 2.2 AA COMPLIANCE CHECKLIST                   │
├─────────────────────────────────────────────────────┤
│ PERCEIVABLE                                         │
│  [✅] Contraste texte ≥ 4.5:1 (normal)              │
│  [✅] Contraste texte ≥ 3:1 (large ≥18px)           │
│  [✅] Contraste UI components ≥ 3:1                 │
│  [⚪] Images alt text (decorative: alt="")          │
│  [✅] Vidéos/audios sous-titres (N/A pour projet)   │
│                                                     │
│ OPERABLE                                            │
│  [🟡] Navigation clavier complète (Sprint 4-5)      │
│  [✅] Focus visible ring-4 ≥ 3:1 contrast           │
│  [⚪] Skip links "Aller au contenu principal"       │
│  [✅] Pas de piège clavier (modals Escape OK)       │
│  [✅] Timeouts désactivables (autosave 5min OK)     │
│  [✅] Animation prefers-reduced-motion (useTypewriter)│
│                                                     │
│ UNDERSTANDABLE                                      │
│  [⚪] Hiérarchie headings H1-H6 correcte            │
│  [🟡] Labels formulaires explicites (partiel)       │
│  [✅] Messages erreur clairs (validation hooks)     │
│  [✅] Navigation cohérente (3-panel stable)         │
│                                                     │
│ ROBUST                                              │
│  [✅] HTML5 sémantique (header, nav, main, aside)   │
│  [🟡] ARIA landmarks (partiel - manque regions)     │
│  [🟡] ARIA roles corrects (partiel - audit requis)  │
│  [✅] Compatibilité lecteurs écran (tests Sprint 5) │
└─────────────────────────────────────────────────────┘

Légende: ✅ Complété | 🟡 En cours | ⚪ À faire
```

---

### Sprint 6 - POLISH (Optionnel - Semaine 7)

**Objectif** : Renommage français + Cleanup dette technique (Plan A Phase 5)

#### Tâches

| # | Tâche | Priorité | Effort | Assigné | Statut | Commentaires |
|---|-------|----------|--------|---------|--------|--------------|
| 6.1 | Renommage "Add Objects" → "Ajouter éléments" | 🟢 FAIBLE | 0.5h | - | ⚪ À faire | Search & replace |
| 6.2 | Aria-labels en français | 🟢 FAIBLE | 0.5h | - | ⚪ À faire | Cohérence i18n |
| 6.3 | Supprimer StudioShell legacy code | 🟡 MOYEN | 1h | - | ⚪ À faire | Cleanup dette technique |
| 6.4 | Documentation README updates | 🟡 MOYEN | 1h | - | ⚪ À faire | Nouveaux composants |
| 6.5 | Tests E2E workflow complet | 🟡 MOYEN | 1h | - | ⚪ À faire | Playwright (optionnel) |

**Total Effort** : 3-4h

#### Définition of Done

- [ ] Interface française cohérente (tous boutons/labels traduits)
- [ ] Code legacy supprimé (StudioShell.jsx, anciens panels)
- [ ] README à jour avec nouveaux composants (DialogueGraph, Badge, etc.)
- [ ] Tests E2E basiques (optionnel si temps disponible)
- [ ] Git cleanup (squash commits WIP si nécessaire)

---

## Indicateurs de Succès (KPIs)

### Métriques Techniques

| Métrique | Cible | Actuel | Sprint 6 Objectif | Mesure |
|----------|-------|--------|-------------------|--------|
| **WCAG 2.2 AA errors** | 0 | ~15 | 0 | axe-core DevTools |
| **Focus ring contrast** | ≥ 3:1 | 4.2:1 ✅ | 4.2:1 | APCA calculator |
| **Text contrast** | ≥ 4.5:1 | 7:1 ✅ | 7:1 | WebAIM checker |
| **Gaming UI components** | 100% | 40% | 100% | Checklist section 4 |
| **Code coverage** | ≥ 60% | ~30% | ≥ 40% | Vitest (optionnel) |
| **Bundle size** | < 500KB | ~420KB | < 500KB | vite build --report |

### Métriques UX

| Métrique | Cible | Mesure | Sprint |
|----------|-------|--------|--------|
| **Temps création dialogue** | < 30s | Chronométrage manuel | 2 |
| **Taux erreur workflow** | < 5% | Tests utilisateur (5 users) | 5 |
| **Satisfaction gaming UX** | ≥ 8/10 | Survey SUS (System Usability Scale) | 6 |
| **Navigation shortcuts usage** | ≥ 40% | Analytics (localStorage tracking) | 6 |

---

## Gestion Risques et Mitigation

### Matrice Risques (Probabilité × Impact)

```
Impact
  ÉLEVÉ │   4     │   2     │   1     │
        ├─────────┼─────────┼─────────┤
  MOYEN │   7     │   3,5   │         │
        ├─────────┼─────────┼─────────┤
  FAIBLE│   8     │   6     │         │
        └─────────┴─────────┴─────────┘
           FAIBLE   MOYEN   ÉLEVÉ
                 Probabilité
```

### Risques Détaillés

| # | Risque | P | I | Score | Mitigation | Responsable |
|---|--------|---|---|-------|------------|-------------|
| **1** | **Bug régression** EditorShell | F | E | 🔴 8 | Tests E2E avant merge, feature flag | Tech Lead |
| **2** | **ReactFlow perf** (> 100 nodes) | M | E | 🟡 10 | Lazy load, virtualisation, tests perf | Dev Frontend |
| **3** | **Conflits merge** branche main | M | M | 🟡 6 | Rebase quotidien, petits commits | Team |
| **4** | **WCAG audit** échoue | F | E | 🟡 8 | Tests continus axe-core, buffer 2h | Accessibility Lead |
| **5** | **Dérive scope** features extra | E | M | 🟡 10 | Lock scope par sprint, roadmap visible | Product Owner |
| **6** | **Timeline playhead** API complexe | M | F | 🟢 3 | Analyser code existant, pair programming | Dev Frontend |
| **7** | **Shortcuts conflits** apps existantes | M | F | 🟢 3 | Tests multi-OS, documentation shortcuts | QA |
| **8** | **Dette technique** accumulation | F | F | 🟢 2 | Cleanup Sprint 6, code reviews | Team |

**Légende** : P=Probabilité, I=Impact, F=Faible, M=Moyen, E=Élevé

---

## Changelog (À mettre à jour chaque sprint)

### Sprint 0 - Planification (Semaine 0)

**Date** : 3 janvier 2026

**Activités** :
- ✅ Analyse comparative Plan A vs Plan B
- ✅ Création roadmap hybride
- ✅ Rédaction RECOMMANDATION_STRATEGIQUE_REFONTE.md
- ✅ Rédaction DASHBOARD_EXECUTION_REFONTE.md
- ⚪ Validation stakeholders (à venir)

**Décisions** :
- Adopter Plan Hybride "Complete Plan A + Cherry-Pick Plan B"
- Prioriser WCAG 2.2 AA (Sprint 5)
- Ajouter Vue Graph DialogueFlow (Sprint 3)
- Reporter renommage français à Sprint 6 (optionnel)

**Risques identifiés** :
- Aucun bloquant (dépendances installées, architecture stable)

---

### Sprint 1 - FONDATIONS (À venir)

**Date démarrage prévue** : 6 janvier 2026

**Objectifs** :
- [ ] Implémenter Phase 3 : Synchronisation clic dialogue (3 actions)
- [ ] Implémenter Phase 6 : Modes plein écran (overlays + Escape)
- [ ] Tests UX workflow dialogues complet

**Bloqueurs actuels** : Aucun

---

## Contacts et Rôles

| Rôle | Nom | Responsabilités | Contact |
|------|-----|-----------------|---------|
| **Product Owner** | À définir | Priorisation sprints, validation scope | - |
| **Tech Lead** | À définir | Architecture, code reviews, merge PR | - |
| **Dev Frontend** | À définir | Implémentation composants React | - |
| **Accessibility Lead** | À définir | Audit WCAG 2.2, tests screen reader | - |
| **QA** | À définir | Tests manuels, validation UX | - |
| **UX Designer** | À définir | Gaming aesthetic, wireframes, validation visuelle | - |

---

## Annexes

### A. Commandes Utiles

```bash
# Démarrer serveurs dev
npm run dev                  # Vite (5173) + Express (3001)

# Lancer tests
npm run test:unit            # Vitest
npm run test:unit:watch      # Vitest watch mode
npm test                     # Playwright E2E

# Linting
npm run lint                 # ESLint check
npm run lint:fix             # ESLint auto-fix
npm run format:fix           # Prettier auto-format

# Build
npm run build:vite           # Production build
npm run preview:vite         # Preview build (port 8000)

# Analyse bundle
npm run build:vite -- --mode analyze  # Bundle size report
```

### B. Checklist Gaming UI (Rappel)

À appliquer sur **chaque nouveau composant** (référence: CONTINUATION_CONTEXT.md section 4) :

**Design Visuel**
- [ ] Palette gaming : purple-500, cyan-500, pink-500
- [ ] Gradients : Au moins 1 gradient sur bouton principal
- [ ] Shadows multicouches : shadow-depth-md
- [ ] Border radius : rounded-xl minimum

**Animations & Interactions**
- [ ] Hover state : scale-105 + translateY(-2px) + shadow
- [ ] Active state : scale-95
- [ ] Transitions : 200-300ms cubic-bezier
- [ ] Empty state : Emoji/illustration animée (bounce, pulse)

**Feedback Utilisateur**
- [ ] Toast notifications : Sonner pour succès/erreurs
- [ ] Progress tracking : Barre ou spinner si > 500ms
- [ ] Célébrations : Confetti pour milestones
- [ ] Undo capability : Bouton "Annuler" dans toasts (5s)

**Accessibilité**
- [ ] Focus rings : ring-4 avec contraste 3:1
- [ ] Aria labels : Sur tous boutons d'icônes
- [ ] Keyboard navigation : Tab, Enter, Escape
- [ ] Reduced motion : Support prefers-reduced-motion

### C. Resources Externes

**Documentation React/Vite**
- [React 19 Docs](https://react.dev/)
- [Vite 7 Guide](https://vite.dev/guide/)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)

**Librairies UI**
- [Radix-UI](https://www.radix-ui.com/) - Composants accessibles
- [ReactFlow](https://reactflow.dev/learn) - Dialogue graph
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications

**Accessibilité**
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/) - Audit automatique
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org/) - Tests gratuit

**Outils Développement**
- [React DevTools](https://react-devtools-tutorial.vercel.app/)
- [Vite Plugin Inspect](https://github.com/antfu/vite-plugin-inspect) - Bundle analysis

---

**Fin du Dashboard**

**Prochaine mise à jour** : Fin Sprint 1 (semaine du 13 janvier 2026)
