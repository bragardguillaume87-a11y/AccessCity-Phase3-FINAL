# Copilot Instructions - AccessCity Scenario Editor MVP

## CONTEXTE PROJET

**Client**: APF France Handicap  
**Version**: 5.5+ (scenario-editor-MVP)  
**Stack**: React + Vite + Tailwind CSS  
**Public**: Personnes en situation de handicap (trackball, eViacam, clavier)

## WORKFLOW OBLIGATOIRE

### Etape 1 - Architecte
1. Consulter `docs/PROJECT_MEMORY_SEED.md`
2. Verifier checklist Phase 5.5
3. Verifier coherence architecture data-driven

### Etape 2 - Developpeur
1. Modifier `data/schemas.json` si nouvelle structure
2. Modifier `data/ui_layout.json` si nouveau panel
3. Coder dans core/ ou ui/ selon besoin
4. Creer tests unitaires dans test/

### Etape 3 - Validation
1. `npm test` doit passer 100%
2. Verifier ASCII-only (automatique dans tests)
3. Tester accessibilite clavier

## REGLES ABSOLUES

### Code
- JAMAIS de fragments `// ... existing code ...`
- TOUJOURS fichiers complets et fonctionnels
- JAMAIS d'optimisations non demandees
- Separation stricte core/ ui/ data/ test/ docs/

### Accessibilite (PRIORITE #1)
- Navigation clavier complete (Tab, Shift+Tab, Echap)
- Trackball/eViacam compatible
- Lecteur ecran (ARIA labels obligatoires)
- Contraste WCAG AA minimum
- Focus visible (outline 2px)

### Architecture Data-Driven
- UI pilotee par `ui_layout.json`
- Scenes dans `scenes.json`
- Personnages dans `characters.json`
- Validation via `schemas.json`
- Variables narratives via `VariableManager`

## MODULES CRITIQUES PHASE 5.5

### Core
- EventBus - Communication inter-composants
- VariableManager - Variables narratives (Empathie, Autonomie, Confiance)
- ConditionEvaluator - Evaluation conditions branching
- CharacterLoader - Chargement characters.json
- Schema - Validation JSON recursive
- Sanitizer - ASCII strict uniquement

### UI
- SceneList - Liste scenes avec selection
- InspectorPanel - Editeur CRUD scenes/dialogues
- DevToolsPanel - Variables temps reel
- CharacterEditor - Edition personnages + sprites
- ScenarioEditorShell - Page d'accueil + gestion histoires
- StudioShell - Editeur scenes/dialogues

### Data Files
- `data/scenes.json` - Scenes narratives
- `data/characters.json` - Personnages (player, counsellor, narrator)
- `data/schemas.json` - Schemas validation
- `data/ui_layout.json` - 5 layouts UI

## PRIORITES ACTUELLES

### UX Enfants 10 ans
1. Onboarding interactif (popup bienvenue, tooltips)
2. Langage adapte ("Editeur" → "Creer mon histoire")
3. Feedback visuel (animations, sons encourageants)
4. Mode Decouverte vs Creation
5. Gamification (badges, progression visible)

### Tests
- Tests unitaires dans test/ (1 fichier par module)
- Tests E2E avec Playwright
- Couverture code >80%

## COMMANDES

npm run dev          # Serveur Vite (localhost:5173)
npm test             # Tests unitaires + E2E
npm run build        # Build production

## DOCUMENTATION DE REFERENCE

Toujours consulter:
- `docs/PROJECT_MEMORY_SEED.md` - Vision strategique v5.5+
- `docs/CODING_RULES.md` - Regles strictes
- `docs/SCENARIO_EDITOR_DESIGN.md` - Design editeur
- `docs/ACCESSIBILITY.md` - Specs accessibilite
- `docs/KEYBOARD_SHORTCUTS.md` - Raccourcis clavier
- `docs/ROADMAP.md` - Phases futures

## STRUCTURE PROJET (scenario-editor-MVP)

AccessCity-Phase3-FINAL/
├── src/
│   ├── core/              # EventBus, schema, variableManager, sanitizer
│   ├── components/        # Composants React (panels, inspectors, ScenarioEditorShell)
│   ├── modules/           # Modules specifiques
│   ├── contexts/          # Context React (AppProvider, ToastProvider)
│   ├── utils/             # Utilitaires
│   ├── App.jsx            # Point entree (rend ScenarioEditorShell)
│   └── main.jsx           # Bootstrap
├── data/
│   ├── scenes.json        # Scenes narratives
│   ├── characters.json    # Personnages
│   ├── schemas.json       # Validation
│   └── ui_layout.json     # Layout panels
├── docs/                  # Documentation technique
│   ├── PROJECT_MEMORY_SEED.md
│   ├── CODING_RULES.md
│   ├── SCENARIO_EDITOR_DESIGN.md
│   ├── ACCESSIBILITY.md
│   └── ...
├── test/                  # Tests unitaires E2E
├── tools/                 # Scripts build
└── index.html             # Point entree Vite

## SCENARIO EDITOR MVP

### Page d'accueil (ScenarioEditorShell)
- Affiche "Espace local" (un seul pour MVP)
- Liste histoires stockees dans localStorage (max 5 gratuit)
- Creation/selection/suppression histoire
- Quand histoire ouverte → affiche StudioShell avec bandeau en haut

### Editeur (StudioShell)
- 2 onglets : Scenes | Dialogues
- Gauche : liste scenes
- Centre : scene active (decor + personnages)
- Droite : panneau edition (texte, proprietes)
- Preview mode plein ecran

### Modules/ecrans cibles

1. Accueil - Choix espace (MVP : un seul local), liste creation histoires (max 5)
2. Contexte - Titre histoire, description, objectif pedagogique
3. Personnages - Nom, role, avatar, position defaut
4. Lieux/Scenes - Liste lieux, scene active, panneau edition
5. Histoires/Dialogues - Timeline etapes, dialogues, choix, effets energie
6. Essayer le jeu - Preview modale, jauges compactes
7. Partager/Exporter - Export JSON clair, explications langage simple

## ERREURS A EVITER

- Documentation trop lourde → Hallucinations IA
- Tests non executables → Tests stricts uniquement
- Code fragments → Fichiers complets obligatoires
- Optimisations sauvages → Implementer ce qui est demande
- Accent dans le code → ASCII strict uniquement
- Jargon technique interface → Langage simple enfants

## PROMPTS COPILOT CHAT RECOMMANDES

### Nouvelle fonctionnalite
@workspace Je veux [fonctionnalite] pour AccessCity scenario-editor-MVP.
Consulte PROJECT_MEMORY_SEED.md pour l'architecture data-driven.
Verifie schemas.json et ui_layout.json.
Code complet uniquement (pas de fragments).
Priorite accessibilite clavier + ARIA labels.

### Corriger un bug
@workspace Bug dans [composant] branch scenario-editor-MVP.
Analyse selon architecture v5.5 (core/ui separation).
Solution complete avec tests unitaires.
Respecte CODING_RULES.md.

### Ameliorer accessibilite
@workspace Ameliore accessibilite [composant] selon specs ACCESSIBILITY.md.
Navigation clavier complete, ARIA labels, contraste WCAG AA.
Code complet, pas de fragments.

---

**RAPPEL**: Accessibilite d'abord, modularite stricte, code complet uniquement.
