# Décision d'architecture : Interface 3 volets vs Onglets

> **Niveau** : 2 (Guide de décision)  
> **Statut** : ⚠️ En cours de mise en œuvre  
> **Dernière mise à jour** : 17 décembre 2024  

## 1. Contexte

AccessCity Studio utilise actuellement un composant principal `StudioShell.jsx` qui gère une interface à onglets pour piloter l’éditeur de scénarios [web:1].  
Ce composant concentre la navigation (Context, Characters, Scenes, Dialogues, Preview, Export) et plusieurs outils (ProblemsPanel, CommandPalette, KeyboardShortcuts), avec des optimisations comme le lazy loading des panels [web:1].  

L’analyse qualité a mis en évidence :
- des violations majeures des standards (ASCII only, i18n manquant, imports désordonnés) [web:1]  
- une gestion d’état peu optimale (re-render global chaque seconde pour le timer) [web:1]  
- un besoin de refactor lourd pour aligner le code sur les nouvelles règles de `CONTRIBUTING.md`.  

Dans ce contexte, deux options sont envisagées pour l’interface principale :

- **Option A** : Migration vers une interface 3 volets type GDevelop  
- **Option B** : Finalisation et durcissement de l’interface à onglets existante  

---

## 2. Options analysées

### 2.1 Option A : Interface 3 volets (recommandée)

Schéma cible inspiré des éditeurs comme GDevelop, Unity ou Figma [web:32][web:24] :

┌────────────────────────────────────────────────────────────┐
│ AppHeader │
├───────────────┬─────────────────────────────┬──────────────┤
│ │ │ │
│ ExplorerPanel │ MainCanvas │ Properties │
│ (Scenes, │ (édition visuelle / flow │ Panel │
│ Dialogues, │ narratif / aperçu scène) │ (propriétés │
│ Characters…) │ │ sélection) │
│ │ │ │
└───────────────┴─────────────────────────────┴──────────────┘

text

**Avantages :**
- Vision simultanée de la structure (gauche), du contenu (centre) et des propriétés (droite), comme dans les éditeurs de scènes GDevelop [web:26][web:23].  
- Meilleure séparation des responsabilités : chaque panneau peut devenir un composant indépendant, limitant les re-renders et simplifiant le state management [web:28].  
- Expérience cohérente avec les outils de création modernes (moins d’aller-retours entre onglets).  

**Inconvénients :**
- Refactoring structurel important de `StudioShell.jsx` (découpage en plusieurs composants + nouveau layout global) [web:1].  
- Gestion de l’accessibilité plus complexe (landmarks ARIA multiples, focus management entre panneaux).  

---

### 2.2 Option B : Finaliser l’interface à onglets

L’interface actuelle repose sur un `tablist` avec des panneaux affichés/masqués, un pattern classique mais qui nécessite une implémentation a11y rigoureuse [web:27][web:33].  

**Avantages :**
- Refactor limité : nettoyage du code existant, correction des violations (ASCII, i18n, imports) [web:1].  
- Navigation séquentielle simple, adaptée à des workflows linéaires (Context → Characters → Scenes → Dialogues → Preview → Export) [web:1].  
- Meilleure adaptation aux petits écrans (les tabbed interfaces gèrent bien les layouts compacts) [web:30].  

**Inconvénients :**
- Perte de contexte : impossible de voir en même temps la structure complète et les propriétés détaillées (contrairement aux interfaces multi-panneaux) [web:32].  
- Risque de complexité croissante si on commence à empiler des sous-onglets et des overlays (tabs dans tabs) [web:36].  
- Ne résout pas, à lui seul, les problèmes actuels de taille du composant et de fragmentation de l’état.  

---

## 3. Recommandation

L’analyse combinée du code actuel de `StudioShell.jsx` et des besoins UX d’un éditeur de scénarios visuels penche clairement en faveur de **l’Option A : interface 3 volets** [web:1][web:26].  

Motifs principaux :
- Alignement avec les pratiques des éditeurs de scènes (GDevelop, moteurs de jeu, éditeurs de niveau) [web:26][web:32].  
- Meilleure scalabilité pour de futures fonctionnalités (timeline, variables globales, journal d’accessibilité, etc.).  
- Opportunité de repartir sur une base saine côté architecture (découpage des composants, state management, i18n) plutôt que d’empiler des correctifs sur un composant déjà surchargé [web:28][web:40].  

---

## 4. Critères de décision

| Critère                         | Option A : 3 volets | Option B : Onglets |
|---------------------------------|---------------------|--------------------|
| Expérience utilisateur avancée | ⭐⭐⭐⭐⭐              | ⭐⭐⭐                |
| Contexte visible en continu    | ⭐⭐⭐⭐⭐              | ⭐⭐                 |
| Alignement outils pro          | ⭐⭐⭐⭐⭐              | ⭐⭐                 |
| Effort de développement        | ⭐⭐                 | ⭐⭐⭐⭐               |
| Refactor architecture          | ⭐⭐                 | ⭐⭐⭐                |
| Accessibilité potentielle      | ⭐⭐⭐⭐⭐              | ⭐⭐⭐⭐               |
| Scalabilité (nouvelles features)| ⭐⭐⭐⭐⭐             | ⭐⭐⭐                |
| Compatibilité mobile           | ⭐⭐⭐                | ⭐⭐⭐⭐               |

---

## 5. Estimation de l’effort

Pour l’Option A (mise en place interface 3 volets) :

- **Phase 1 – Design & découpage** (0,5–1 jour)  
  - Définir l’API des nouveaux composants : `ExplorerPanel`, `MainCanvas`, `PropertiesPanel`  
  - Identifier les props et context nécessaires [web:34][web:31].  

- **Phase 2 – Implémentation du layout** (1–1,5 jours)  
  - Créer le nouveau layout avec gestion des panneaux (taille, responsive).  
  - Intégrer le routage interne (sélection scène/dialogue/personnage).  

- **Phase 3 – Migration de la logique** (1–2 jours)  
  - Extraire la logique métier de `StudioShell.jsx` vers des hooks dédiés.  
  - Redistribuer l’état entre les panneaux (context global vs local).  

- **Phase 4 – Accessibilité & tests** (1–1,5 jours)  
  - Vérifier le focus management, les rôles ARIA, la navigation clavier [web:27].  
  - Mettre à jour les tests et le pipeline qualité (`PIPELINE_QA.md`).  

Total estimé : **3,5 à 6 jours** selon le niveau de couverture de tests et le nombre d’itérations de design [web:28][web:40].  

---

## 6. Validation requise

Avant de lancer le refactoring majeur :

- [ ] Valider officiellement l’option **A (interface 3 volets)** comme cible principale.  
- [ ] Geler les évolutions fonctionnelles majeures sur `StudioShell.jsx` le temps du refactor.  
- [ ] Valider le **plan de refactoring détaillé** décrit dans `REFACTORING_PLAN.md`.  
- [ ] S’assurer que les exigences d’accessibilité (WCAG 2.1 AA) restent prioritaires pendant la migration.  

Une fois ces points validés, le travail peut démarrer en suivant le plan de refactor dédié.