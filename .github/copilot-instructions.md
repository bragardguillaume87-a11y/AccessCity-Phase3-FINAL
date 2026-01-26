# Copilot Instructions - AccessCity Scene Editor

## CONTEXTE PROJET

**Client**: APF France Handicap  
**Version**: 6.0 (mvp-properties branch)  
**Stack**: React 19 + Vite 7 + Tailwind CSS  
**Public**: Personnes en situation de handicap (trackball, eViacam, clavier)

## WORKFLOW OBLIGATOIRE

### Etape 1 - Architecte
1. Consulter `docs/START_HERE.md` pour vue d'ensemble
2. Lire `docs/guides/ARCHITECTURE_DECISION.md` pour décisions architecturales
3. Vérifier cohérence avec interface à 3 volets (panneaux gauche/central/droit)

### Etape 2 - Developpeur
1. Utiliser AppContext pour état global partagé
2. Créer composants modulaires réutilisables dans `src/components/`
3. Respecter séparation core/ (logique) et components/ (UI)
4. Ajouter tests unitaires pour nouveaux composants

### Etape 3 - Validation
1. `npm test` doit passer
2. Vérifier accessibilité WCAG AA (ARIA, navigation clavier)
3. Tester sauvegarde localStorage et validation temps réel

## REGLES ABSOLUES

### Code
- JAMAIS de fragments `// ... existing code ...` - fichiers complets uniquement
- Composants modulaires < 300 lignes (découper si nécessaire)
- État partagé via AppContext, éviter 40+ useState locaux
- ASCII strict uniquement (pas d'accents)

### Accessibilité (PRIORITE #1)
- Navigation clavier complète (Tab, Shift+Tab, Échap)
- Trackball/eViacam compatible
- Lecteur écran (ARIA labels obligatoires)
- Contraste WCAG AA minimum
- Focus visible (outline 2px)

### Architecture
- Interface à 3 volets : Explorateur (gauche) | MainCanvas (centre) | PropertiesPanel (droite)
- AppContext central pour état partagé
- Panneaux fonctionnels : Context, Characters, Scenes, Dialogues, Export
- Sauvegarde automatique localStorage
- Validation temps réel avec ProblemsPanel

## MODULES CRITIQUES

### Core (src/core/)
- StageDirector - Moteur de jeu et lecture scénarios
- DialogueEngine - Gestion dialogues et choix
- VariableManager - Variables narratives (Empathie, Autonomie, Confiance)
- SoundManager - Système audio avec bouton Mute

### Components (src/components/)
- StudioShell - Interface principale avec onglets/3 volets
- PlayMode - Mode joueur avec animations/confettis
- AssetPicker - Gestion assets (bibliothèque/upload/URL)
- ProblemsPanel - Validation et erreurs temps réel
- ToastProvider - Notifications utilisateur

### Contextes (src/contexts/)
- AppContext - État global partagé
- ToastProvider - Gestion toasts

### Data (data/)
- scenes.json - Scènes narratives
- characters.json - Personnages avec avatars
- schemas.json - Validation JSON

## PRIORITES ACTUELLES

### Refactoring Architecture
1. Migration vers interface 3 volets (inspirée GDevelop)
2. Réduction composants volumineux (>300 lignes)
3. Consolidation état (AppContext vs hooks locaux)
4. Résolution code incomplet (voir INCOMPLETE_CODE_INVENTORY.md)

### Accessibilité et UX
1. Standards WCAG 2.1 AA complets
2. Raccourcis clavier pour édition rapide
3. Feedback visuel et sonore adapté

### Tests et Qualité
- Tests unitaires pour composants
- Tests E2E Playwright
- Couverture code >80%
- Validation accessibilité automatisée

## COMMANDES

npm run dev          # Serveur Vite + backend assets (localhost:5173)
npm run build        # Build production
npm run preview      # Preview build local
npm test             # Tests unitaires
npm run e2e          # Tests E2E Playwright
npm run coverage     # Couverture tests

## GESTION ASSETS

- Backend Express (port 3001) pour upload images
- Manifeste JSON auto-généré (`public/assets-manifest.json`)
- Catégories : backgrounds, characters, illustrations
- AssetPicker : Bibliothèque | Upload | URL externe

## DOCUMENTATION DE REFERENCE

Toujours consulter:
- `docs/START_HERE.md` - Point d'entrée et vue d'ensemble
- `docs/guides/ARCHITECTURE_DECISION.md` - Décisions architecturales
- `docs/reference/standards/ACCESSIBILITY_STANDARDS.md` - Specs accessibilité
- `docs/reference/features/KEYBOARD_SHORTCUTS.md` - Raccourcis clavier
- `docs/ROADMAP.md` - Phases futures

## STRUCTURE PROJET

AccessCity-Phase3-FINAL/
├── src/
│   ├── core/              # Logique métier (StageDirector, DialogueEngine)
│   ├── components/        # Composants React modulaires
│   ├── contexts/          # Contextes React (AppContext)
│   ├── utils/             # Utilitaires
│   ├── App.jsx            # Point d'entrée
│   └── main.jsx           # Bootstrap
├── data/                  # Données JSON (scenes, characters, schemas)
├── docs/                  # Documentation technique
├── e2e/                   # Tests E2E Playwright
├── test/                  # Tests unitaires
├── server/                # Backend assets (Express)
├── public/                # Assets statiques
└── tools/                 # Scripts build/outils

## SCENARIO EDITOR MVP

### Interface Actuelle
- Onglets : Context | Characters | Scenes | Dialogues | Export
- Transition vers 3 volets : Explorateur | MainCanvas | Properties

### Fonctionnalités
1. Context - Titre, description, objectif pédagogique
2. Characters - Gestion personnages avec avatars
3. Scenes - Création scènes avec décors
4. Dialogues - Dialogues avec choix et effets variables
5. Export - Export JSON et partage

### Mode Joueur
- Lecture scénarios interactive
- Variables dynamiques (barres de progression)
- Animations et effets sonores
- Écran fin avec statistiques

## ERREURS A EVITER

- Code incomplet non documenté → Consulter INCOMPLETE_CODE_INVENTORY.md
- Composants monolithiques → Découper en modules <300 lignes
- État fragmenté → Utiliser AppContext pour partage global
- Accessibilité négligée → Tests WCAG AA obligatoires
- Documentation obsolète → START_HERE.md comme référence

## PROMPTS COPILOT RECOMMANDES

### Nouvelle fonctionnalité
@workspace Implémenter [fonctionnalité] pour AccessCity.
Consulter docs/START_HERE.md et ARCHITECTURE_DECISION.md.
Utiliser AppContext pour état partagé.
Code complet, tests unitaires, accessibilité WCAG AA.

### Refactoring composant
@workspace Refactorer [composant] selon architecture 3 volets.
Découper si >300 lignes, consolider état.
Maintenir compatibilité et tests existants.

### Correction accessibilité
@workspace Améliorer accessibilité [composant] selon ACCESSIBILITY_STANDARDS.md.
Navigation clavier, ARIA labels, contraste WCAG AA.
Tests automatisés inclus.

---

**RAPPEL**: Accessibilité d'abord, architecture 3 volets, code modulaire et testé.
