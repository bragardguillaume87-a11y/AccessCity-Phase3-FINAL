# 🎯 START HERE - AccessCity Studio

> **Point d'entrée unique pour toute personne (IA ou développeur·euse) démarrant sur ce projet**

## 🚀 Démarrage rapide (3 étapes)

Cette section vous guide pour lancer le projet en moins de 5 minutes.

1. **Installation** : Exécutez `npm install && npm run dev` dans votre terminal → [Guide détaillé d'installation et de configuration](guides/GETTING_STARTED.md)
2. **Architecture actuelle** : L'interface utilise des onglets (composant StudioShell.jsx) et est en transition vers une interface à 3 volets
3. **Branche active** : `mvp-properties` (développement de l'éditeur de scénarios en version minimale viable)

## 🎯 État du projet (Décembre 2024)

### ✅ Fonctionnalités opérationnelles

Les éléments suivants sont complets et testés :

- 40+ composants React modulaires, réutilisables et testés unitairement
- Système de contexte global (AppContext) pour partager l'état entre composants
- Panneaux fonctionnels : Context (contexte narratif), Characters (personnages), Scenes (scènes), Dialogues, Export (exportation de données)
- Sauvegarde automatique dans le stockage local du navigateur (localStorage)
- Validation en temps réel avec affichage des problèmes (ProblemsPanel)
- Raccourcis clavier complets pour navigation et édition rapides

### ⚠️ Points d'attention identifiés

Ces éléments nécessitent une décision ou une action de votre part :

1. **Ambiguïté d'interface** : Deux paradigmes d'interface utilisateur coexistent (onglets + 3 volets incomplet)
2. **Gestion d'état fragmentée** : Combinaison d'AppContext central et 40+ hooks useState locaux
3. **Composants volumineux** : Le composant StudioShell.jsx dépasse 300 lignes et nécessite une découpe
4. **Code intentionnellement incomplet** : Certaines parties sont volontairement en attente → [Consulter l'inventaire du code incomplet](reference/architecture/INCOMPLETE_CODE_INVENTORY.md)

## 🎯 Mission actuelle : Refactoring de l'architecture

### Objectif

Transformer l'interface actuelle en une interface à 3 volets, inspirée de l'éditeur GDevelop, pour améliorer l'expérience utilisateur.

### Structure des 3 volets

- 🗂️ **Panneau gauche** : Explorateur de ressources (Scenes, Dialogues, Characters)
- 🎨 **Panneau central** : MainCanvas (Zone d'édition visuelle principale)
- ⚙️ **Panneau droit** : PropertiesPanel (Propriétés de l'élément sélectionné)

### Décision requise

[Lire le document de décision architecturale](guides/ARCHITECTURE_DECISION.md) pour comprendre les options disponibles et prendre une décision éclairée.

## 📚 Navigation par besoin

### Guides pour différents objectifs

Sélectionnez le lien correspondant à votre besoin :

- **Comprendre l'architecture du projet** : [Document de décision architecturale](guides/ARCHITECTURE_DECISION.md)
- **Contribuer au code source** : [Guide de contribution](guides/CONTRIBUTION_GUIDE.md)
- **Consulter le plan de refactoring** : [Plan de refactoring détaillé](guides/REFACTORING_PLAN.md)
- **Collaborer avec une IA** : [Guide de collaboration IA](guides/AI_COLLABORATION.md)
- **Explorer les détails d'un composant** : [Documentation technique des composants](reference/architecture/)
- **Respecter les standards d'accessibilité** : [Standards d'accessibilité du projet](reference/standards/ACCESSIBILITY_STANDARDS.md)
- **🔄 Reprendre une session IA précédente** : [Continuation Context](CONTINUATION_CONTEXT.md) ⭐ NOUVEAU
- **🎮 Créer des interfaces gaming engageantes** : [Gaming UI/UX Guidelines](GAMING_UI_GUIDELINES.md) ⭐ NOUVEAU

## 🚨 Règles critiques avant toute modification

Respectez impérativement ces règles pour maintenir la cohérence du projet.

### 1. Consulter la documentation en niveaux

La documentation est organisée en 3 niveaux de détail :

- **Niveau 1** (START_HERE.md) → Vue d'ensemble et orientation générale
- **Niveau 2** (guides/) → Contexte décisionnel et guides pratiques
- **Niveau 3** (reference/) → Détails techniques et spécifications complètes

### 2. Comprendre le code incomplet

Le code incomplet n'est pas un bug : certaines parties sont volontairement laissées en attente pour des raisons documentées. 

[Consulter l'inventaire du code incomplet](reference/architecture/INCOMPLETE_CODE_INVENTORY.md)

### 3. Créer des commits atomiques

Chaque commit doit avoir une seule responsabilité clairement identifiée :

- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `refactor` : Refactoring de code existant sans changement de comportement
- `docs` : Modification de documentation uniquement

### 4. Priorité à l'accessibilité

Tous les composants créés ou modifiés doivent respecter les standards WCAG 2.1 niveau AA.

[Consulter les standards d'accessibilité](reference/standards/ACCESSIBILITY_STANDARDS.md)

## 🔗 Ressources essentielles

### Liens du projet

- **Dépôt GitHub** : [AccessCity-Phase3-FINAL sur GitHub](https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL)
- **Branche de développement** : `mvp-properties` (branche active pour le développement de l'éditeur de scénarios)
- **Stack technique** : React 18, Vite (bundler rapide), TailwindCSS (framework CSS utilitaire)
- **Journal des modifications** : [CHANGELOG.md](CHANGELOG.md)

## 💬 Questions fréquentes

### Pourquoi le code semble-t-il incomplet ?

C'est un choix intentionnel de conception. Certaines parties du code sont volontairement laissées en attente ou partiellement implémentées pour des raisons documentées (test de structure, évolution future, décision en attente).

[Consulter l'inventaire détaillé du code incomplet](reference/architecture/INCOMPLETE_CODE_INVENTORY.md)

### Quelle architecture choisir : onglets ou 3 volets ?

Les deux approches ont des avantages et inconvénients. Une décision éclairée nécessite de comprendre le contexte technique et les besoins utilisateurs.

[Lire le document de décision architecturale](guides/ARCHITECTURE_DECISION.md) pour faire un choix éclairé.

### Comment tester mes modifications ?

1. Lancez le serveur de développement : `npm run dev`
2. Testez manuellement vos modifications dans le navigateur
3. Exécutez les tests automatisés : `npm test`
4. Consultez les critères de validation : [Pipeline QA](reference/infrastructure/PIPELINE_QA.md)

---

📌 **Dernière mise à jour** : 17 décembre 2024  
📧 **Contact** : Guillaume Bragard (APF France Handicap Limousin)  
♿ **Accessibilité** : Ce document respecte les standards WCAG 2.1 niveau AA
