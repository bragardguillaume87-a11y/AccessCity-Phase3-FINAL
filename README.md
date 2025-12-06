# AccessCity Scene Editor 5.0

**Editeur de scenarios interactifs accessibles** - Architecture React 19 + Vite 7

---

## 🎯 Qu'est-ce qu'AccessCity ?

AccessCity est un editeur visuel pour creer des scenarios pedagogiques interactifs :
- **6 etapes** : Contexte, Personnages, Scenes, Dialogues, Previsualisation, Export
- **Mode Joueur** : Tester scenarios avec variables (Empathie, Autonomie, Confiance)
- **Export JSON** : Sauvegarder et partager vos scenarios
- **Accessibilite** : Concu pour personnes en situation de handicap

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Lancer l'editeur

```bash
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

### 3. Premier scenario

1. **Contexte** : Definir titre et description
2. **Personnages** : Ajouter 1-3 personnages avec avatars
3. **Scenes** : Creer 2-3 scenes (ex: Arrivee, Defi, Resolution)
4. **Dialogues** : Ajouter dialogues avec choix multiples
5. **Jouer** : Tester votre scenario
6. **Exporter** : Sauvegarder en JSON

---

## 📚 Architecture

### Structure moderne (Vite + React)

```
AccessCity-Phase3-FINAL/
├── src/                        # Application React (ACTIF)
│   ├── core/                   # Moteur de jeu
│   │   ├── StageDirector.simple.js
│   │   └── DialogueEngine.js
│   ├── components/             # Composants UI
│   │   ├── PlayMode.jsx
│   │   ├── ConfirmModal.jsx
│   │   └── ...
│   ├── modules/                # Modules editeur
│   │   ├── ScenesModule.jsx
│   │   ├── DialoguesModule.jsx
│   │   └── ...
│   ├── utils/                  # Utilitaires
│   │   └── simpleSound.js
│   ├── App.jsx                 # Point d'entree
│   └── main.jsx
├── legacy/                     # Code archive (non utilise)
│   ├── core/                   # Ancien moteur JS vanilla
│   ├── ui/                     # Ancienne UI vanilla
│   └── README.md               # Explications archivage
├── docs/                       # Documentation
├── e2e/                        # Tests Playwright
├── index.html                  # Point d'entree Vite
├── package.json
└── vite.config.js
```

### Technologies

- **React** 19.2.0
- **Vite** 7.2.4
- **Playwright** 1.45.0 (tests E2E)
- **Tailwind CSS** (styling)
- **Lucide React** (icones)

---

## 🧪 Features

### Editeur

- ✅ Creation scenes avec descriptions
- ✅ Gestion personnages (nom, role, avatar)
- ✅ Dialogues avec choix multiples
- ✅ Effets sur variables (Empathie +10, etc.)
- ✅ Suppression scenes/dialogues avec confirmation
- ✅ Toast notifications pour feedback
- ✅ Export/Import JSON

### Mode Joueur

- ✅ Lecture scenarios
- ✅ Variables dynamiques (Empathie, Autonomie, Confiance)
- ✅ Systeme de son avec bouton Mute
- ✅ Ecran de fin avec statistiques
- ✅ Animations et confettis

### Accessibilite

- ✅ Navigation clavier
- ✅ Attributs ARIA
- ✅ Contrastes suffisants
- 🟡 Tests screen readers (en cours)

---

## 🧪 Scripts

### Developpement

```bash
# Lancer serveur dev (HMR)
npm run dev

# Build production
npm run build:vite

# Preview build
npm run preview:vite
```

### Tests

```bash
# Tests E2E Playwright
npm run e2e:vite

# Installer navigateurs Playwright
npm run e2e:install

# Tests unitaires (a venir)
npm test
```

### Couverture

```bash
# Couverture Node
npm run coverage

# Couverture HTML
npm run coverage:html

# Merge Node + navigateur
npm run coverage:merge

# Rapports complets
npm run coverage:reports
```

### Workflow couverture complete

```bash
# 1) Couverture Node
npm run coverage

# 2) Couverture navigateur (build instrumente + E2E)
$env:VITE_COVERAGE='true'; npm run e2e:vite

# 3) Merge
npm run coverage:merge

# 4) Rapports lcov + HTML
npm run coverage:reports
```

---

## 📚 Documentation

### Guides utilisateur

- [`docs/BRANCH_CLEAN_README.md`](docs/BRANCH_CLEAN_README.md) - Guide branche Access-City-CLEAN
- [`docs/CLEANUP_AUTOMATION_PLAN.md`](docs/CLEANUP_AUTOMATION_PLAN.md) - Plan nettoyage et roadmap

### Documentation technique

- [`docs/PROJECT_MEMORY_SEED.md`](docs/PROJECT_MEMORY_SEED.md) - Vision et regles projet
- [`docs/AccessCity_Agentic_Workflow.md`](docs/AccessCity_Agentic_Workflow.md) - Workflow developpement
- [`docs/VITE_SETUP.md`](docs/VITE_SETUP.md) - Setup Vite avec HMR
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) - Historique versions

### Rapports

- [`docs/COVERAGE_ROADMAP.md`](docs/COVERAGE_ROADMAP.md) - Roadmap couverture tests
- [`docs/VERIFICATION_REPORT.md`](docs/VERIFICATION_REPORT.md) - Rapport verification

---

## 🔧 Troubleshooting

### Probleme : Erreur `playClose is not defined`

**Solution** : Tu es sur une ancienne version. Passe sur `Access-City-CLEAN` :

```bash
git checkout Access-City-CLEAN
git pull origin Access-City-CLEAN
npm install
npm run dev
```

### Probleme : Interface ne se met pas a jour

**Solution** : Vider le cache navigateur :
- **Windows/Linux** : `Ctrl + Shift + R`
- **Mac** : `Cmd + Shift + R`

### Probleme : Mode joueur affiche "Fin du jeu" immediatement

**Solution** : Verifier que tes dialogues ont bien un `sceneId` correspondant a une scene existante.

### Probleme : Sons ne marchent pas

**Solution** : 
1. Verifier que les fichiers MP3 existent dans `public/sounds/`
2. Cliquer sur le bouton Mute (peut etre active par defaut)
3. Verifier console navigateur (F12) pour erreurs

---

## 🛣️ Roadmap

### Version 5.1 (en cours)

- [x] Nettoyage architecture
- [x] Bouton suppression scenes/dialogues
- [x] Modal confirmation
- [x] Toast notifications
- [ ] Tests E2E complets

### Version 5.2 (a venir)

- [ ] Duplication scenes/dialogues
- [ ] Recherche/filtres
- [ ] Sauvegarde localStorage
- [ ] Undo/Redo

### Version 6.0 (futur)

- [ ] Migration TypeScript
- [ ] Drag & drop scenes
- [ ] Mode collaboratif
- [ ] Templates de scenarios

---

## 👥 Contribution

Voir [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)

---

## 📝 Licence

MIT - Voir fichier `LICENSE`

---

**Developpe avec ❤️ pour l'accessibilite**
