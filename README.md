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
npm run install:server  # Install backend dependencies
```

### 2. Lancer l'editeur

**IMPORTANT** : Toujours utiliser `npm run dev` (pas `npm run dev:vite`)

```bash
npm run dev  # Lance Vite (port 5173) + Serveur upload (port 3001)
```

Ouvrir [http://localhost:5173](http://localhost:5173)

**Commandes disponibles** :

- `npm run dev` - **Recommandé** : Lance Vite + serveur backend (upload)
- `npm run dev:vite` - Lance SEULEMENT Vite (upload ne fonctionnera pas)
- `npm run dev:server` - Lance SEULEMENT serveur backend (port 3001)

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

### Systeme de Gestion des Assets

L'application utilise un systeme en 3 composants pour gerer les images (backgrounds, personnages, illustrations) :

1. **Serveur Backend** (Express, port 3001)
   - API `/api/assets/upload` - Upload d'images
   - API `/api/health` - Health check du serveur
   - Stockage dans `/public/assets/[category]/`

2. **Manifeste JSON** (`/public/assets-manifest.json`)
   - Index genere automatiquement de tous les assets disponibles
   - Genere par `node tools/generate-assets-manifest.js`
   - Mis a jour automatiquement apres chaque upload

3. **AssetPicker** (Composant React)
   - Interface utilisateur avec 3 onglets : Bibliotheque, Upload, URL
   - Health check automatique du serveur backend
   - Gestion gracieuse des erreurs (manifeste manquant, serveur offline)

**Workflow normal** :

1. Utilisateur lance `npm run dev` (Vite + Serveur)
2. AssetPicker verifie que le serveur est en ligne
3. Utilisateur peut uploader des images via drag & drop
4. Serveur sauvegarde l'image et regenere le manifeste
5. Bibliotheque se met a jour automatiquement

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

### ❌ Upload d'images ne fonctionne pas

**Symptomes** :

- Banner orange "Upload server not available" dans l'onglet Upload
- Message "ERR_CONNECTION_REFUSED" dans la console
- Bouton "Choisir un fichier" desactive

**Causes** :

- Vous avez lance `npm run dev:vite` au lieu de `npm run dev`
- Le serveur backend n'est pas demarre

**Solution** :

1. Arreter le processus actuel (`Ctrl + C`)
2. Lancer la commande correcte :

```bash
npm run dev  # Lance Vite (5173) + Serveur upload (3001)
```

3. Verifier que le banner devient vert "Upload server is online"
4. Si le probleme persiste, cliquer sur "Retry connection"

### 📚 Bibliotheque d'assets vide

**Symptomes** :

- L'onglet Bibliotheque affiche "Aucun asset disponible"
- Message d'erreur dans la console `[useAssets] Manifest not found`

**Causes** :

- Manifeste JSON manquant ou vide
- Aucune image dans `/public/assets/`

**Solution** :

1. Ajouter des images dans les dossiers appropries :

```text
/public/assets/
├── backgrounds/     # Images de fond
├── characters/      # Avatars personnages
└── illustrations/   # Images decoratives
```

2. Regenerer le manifeste :

```bash
node tools/generate-assets-manifest.js
```

3. Recharger l'application (`F5`)

**Note** : Si le manifeste est manquant, l'application utilise automatiquement un manifeste vide pour eviter les crashs. La bibliotheque sera simplement vide jusqu'a ce que vous ajoutiez des assets.

### 🔐 Modales ne se ferment pas correctement

**Symptomes** :

- Appuyer sur `Escape` ferme toutes les modales simultanement
- Modales imbriquees (ex: CharactersModal → CharacterEditorModal) se comportent mal

**Causes** :

- Ancien bug resolu dans la version actuelle

**Solution** :

1. Verifier que vous etes sur la derniere version :

```bash
git pull origin v6.0-restore-full-project
npm install
```

2. Comportement attendu :
   - `Escape` ferme SEULEMENT la modale la plus recente (en haut de la pile)
   - Les modales en arriere-plan restent ouvertes
   - Vous devez appuyer sur `Escape` plusieurs fois pour fermer toutes les modales

3. Verifier dans la console les logs `[ModalStack] Pushed/Popped` pour debugger

### ⚠️ Erreur `playClose is not defined`

**Solution** : Tu es sur une ancienne version. Passe sur `Access-City-CLEAN` :

```bash
git checkout Access-City-CLEAN
git pull origin Access-City-CLEAN
npm install
npm run dev
```

### 🔄 Interface ne se met pas a jour

**Solution** : Vider le cache navigateur :

- **Windows/Linux** : `Ctrl + Shift + R`
- **Mac** : `Cmd + Shift + R`

### 🎮 Mode joueur affiche "Fin du jeu" immediatement

**Solution** : Verifier que tes dialogues ont bien un `sceneId` correspondant a une scene existante.

### 🔊 Sons ne marchent pas

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
