# Plan de nettoyage - AccessCity Architecture

**Date**: 6 decembre 2025  
**Probleme identifie**: Melange entre versions legacy (HTML vanilla), React embarque et Vite moderne

---

## Diagnostic de l'architecture actuelle

### Fichiers HTML (4 versions !)

| Fichier | Taille | Usage | Status |
|---------|--------|-------|--------|
| `index.html` | 676 B | **Vite demo simple** (App.jsx compteur) | Active sur npm run dev |
| `index-react.html` | **96 KB** | **Editeur complet** (6 etapes) | Ancien editeur React embarque |
| `index-legacy.html` | 568 B | Ancienne version vanilla JS | Legacy |
| `index-vite.html` | 671 B | Demo Vite alternative | Test |

### Dossiers core/ui/src

| Dossier | Contenu | Architecture |
|---------|---------|-------------|
| `/core/` | DialogueEngine.js, StageDirector.js (legacy) | Vanilla JS |
| `/ui/` | StageDirector.js, DialogueEngine.js | Vanilla JS (doublon) |
| `/src/` | App.jsx, components/, modules/ | **Vite + React moderne** |

**PROBLEME** : Duplication du code entre `/core`, `/ui` et `/src/core`

---

## Objectif du nettoyage

### Phase 1 : Sauvegarder l'editeur complet

1. Le commit `1fc17cb` contient ton editeur React complet
2. Les fichiers correctifs sont sur `Access-City-5.5a` (StageDirector, soundFeedback, PlayMode)
3. **But** : Fusionner les deux sans perdre l'editeur

### Phase 2 : Architecture cible

```
AccessCity-Phase3-FINAL/
├── src/                        # Architecture Vite moderne
│   ├── core/                   # Moteur de jeu (unifie)
│   │   ├── StageDirector.js   # Version corrigee
│   │   └── DialogueEngine.js
│   ├── utils/                  # Utilitaires
│   │   └── soundFeedback.js   # Systeme son avec mute
│   ├── components/             # Composants React
│   │   ├── PlayMode.jsx       # Mode joueur avec bouton Mute
│   │   └── ...
│   ├── modules/                # Modules editeur
│   │   ├── ScenesModule.jsx
│   │   ├── DialoguesModule.jsx
│   │   └── ...
│   └── App.jsx                 # Point d'entree
├── index.html                  # UNIQUE point d'entree Vite
├── legacy/                     # Archive (optionnel)
│   ├── index-legacy.html
│   └── ...
└── docs/
```

**Supprime** :
- `/core/` (remplace par `/src/core/`)
- `/ui/` (remplace par `/src/`)
- `index-react.html` (integre dans Vite)
- `index-vite.html` (fusionne avec index.html)
- `index-legacy.html` (archive)

---

## Procedure pour GitHub Copilot

### Etape 1 : Creer branche de travail depuis detached HEAD

**Contexte** : Tu es actuellement sur le commit `1fc17cb` (detached HEAD) qui contient l'editeur complet.

```bash
# Creer une branche depuis le commit actuel
git switch -c editeur-propre-avec-corrections

# Verifier
git branch
# Tu devrais voir : * editeur-propre-avec-corrections
```

### Etape 2 : Recuperer les corrections depuis GitHub

```bash
# Recuperer StageDirector corrige
git checkout Access-City-5.5a -- src/core/StageDirector.js

# Recuperer soundFeedback
git checkout Access-City-5.5a -- src/utils/soundFeedback.js

# Recuperer documentation
git checkout Access-City-5.5a -- docs/SCENE_EDITOR_FIXES.md
git checkout Access-City-5.5a -- docs/BUGFIXES_SUMMARY.md
git checkout Access-City-5.5a -- docs/CLEANUP_PLAN.md

# Sauvegarder ancien PlayMode si existe
if (Test-Path src/components/PlayMode.jsx) {
    Copy-Item src/components/PlayMode.jsx src/components/PlayMode.BACKUP.jsx
}

# Recuperer nouveau PlayMode avec bouton Mute
git checkout Access-City-5.5a -- src/components/PlayMode.jsx
```

### Etape 3 : Nettoyer l'architecture

```bash
# Supprimer doublons legacy
Remove-Item -Recurse -Force core/
Remove-Item -Recurse -Force ui/

# Archiver fichiers HTML obsoletes
New-Item -ItemType Directory -Force -Path legacy/
Move-Item index-legacy.html legacy/
Move-Item index-react.html legacy/
Move-Item index-vite.html legacy/
Move-Item test-direct.html legacy/

# Garder seulement index.html pour Vite
```

### Etape 4 : Verifier index.html pointe vers App.jsx

Ouvrir `index.html` et verifier qu'il contient :

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AccessCity - Editeur de scenarios</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Etape 5 : Verifier App.jsx contient l'editeur

Ouvrir `src/App.jsx` et verifier qu'il contient :
- Les 6 etapes (Contexte, Personnages, Scenes, Dialogues, Previsualisation, Export)
- Import de tous les modules
- Gestion d'etat avec useState/useContext

**Si App.jsx est simple (compteur)** → Recuperer depuis ton commit :

```bash
git show 1fc17cb:src/App.jsx > src/App.jsx
```

### Etape 6 : Commit et test

```bash
# Ajouter tous les changements
git add .

# Commit avec message clair
git commit -m "Nettoyage architecture: fusion editeur complet + corrections bugs

- Suppression doublons /core/ et /ui/
- Archive fichiers HTML legacy
- Integration StageDirector.js corrige
- Integration soundFeedback.js avec mute
- Integration PlayMode.jsx avec bouton Mute
- Documentation ajoutee
- Architecture Vite unifiee"

# Tester
npm run dev
```

### Etape 7 : Verifier le resultat

Ouvrir http://localhost:5173

**Tu devrais voir** :
- Editeur complet avec 6 etapes
- Interface propre (pas de compteur)
- Console avec logs `[StageDirector]`
- Bouton Mute fonctionnel en mode joueur

---

## Prompt pour GitHub Copilot Chat

### Option 1 : Prompt complet pour @workspace

```
@workspace Je veux nettoyer l'architecture de mon projet AccessCity et fusionner mon editeur complet avec des corrections de bugs.

CONTEXTE :
- Je suis sur le commit 1fc17cb (detached HEAD) avec mon editeur complet
- La branche Access-City-5.5a contient des corrections (StageDirector, soundFeedback, PlayMode)
- Le projet a 4 fichiers HTML differents qui creent la confusion
- Il y a des doublons entre /core/, /ui/ et /src/core/

OBJECTIF :
Creer une branche propre "editeur-propre-avec-corrections" qui :
1. Garde mon editeur complet (6 etapes)
2. Integre les corrections depuis Access-City-5.5a
3. Supprime les fichiers legacy
4. Unifie l'architecture sur Vite + React

ACTIONS A EXECUTER (dans l'ordre) :

1. Creer branche depuis commit actuel :
   git switch -c editeur-propre-avec-corrections

2. Recuperer fichiers corriges :
   git checkout Access-City-5.5a -- src/core/StageDirector.js
   git checkout Access-City-5.5a -- src/utils/soundFeedback.js
   git checkout Access-City-5.5a -- docs/SCENE_EDITOR_FIXES.md
   git checkout Access-City-5.5a -- docs/BUGFIXES_SUMMARY.md
   git checkout Access-City-5.5a -- docs/CLEANUP_PLAN.md
   
3. Sauvegarder ancien PlayMode si existe, puis recuperer nouveau :
   Test-Path src/components/PlayMode.jsx && Copy-Item src/components/PlayMode.jsx src/components/PlayMode.BACKUP.jsx
   git checkout Access-City-5.5a -- src/components/PlayMode.jsx

4. Supprimer doublons :
   Remove-Item -Recurse -Force core/
   Remove-Item -Recurse -Force ui/

5. Archiver fichiers HTML obsoletes :
   New-Item -ItemType Directory -Force -Path legacy/
   Move-Item index-legacy.html, index-react.html, index-vite.html, test-direct.html legacy/

6. Verifier que src/App.jsx contient l'editeur complet (pas juste un compteur)
   Si App.jsx est simple, recuperer depuis 1fc17cb :
   git show 1fc17cb:src/App.jsx > src/App.jsx

7. Commit :
   git add .
   git commit -m "Nettoyage architecture: fusion editeur + corrections"

8. Me confirmer que c'est fait et lancer npm run dev pour tester

Utilise les commandes PowerShell appropriees. Confirme chaque etape.
```

### Option 2 : Prompt pour @terminal (plus direct)

```
@terminal Execute ces commandes dans l'ordre pour nettoyer l'architecture :

1. git switch -c editeur-propre-avec-corrections
2. git checkout Access-City-5.5a -- src/core/StageDirector.js src/utils/soundFeedback.js docs/SCENE_EDITOR_FIXES.md docs/BUGFIXES_SUMMARY.md docs/CLEANUP_PLAN.md
3. if (Test-Path src/components/PlayMode.jsx) { Copy-Item src/components/PlayMode.jsx src/components/PlayMode.BACKUP.jsx }
4. git checkout Access-City-5.5a -- src/components/PlayMode.jsx
5. Remove-Item -Recurse -Force core/, ui/
6. New-Item -ItemType Directory -Force -Path legacy/
7. Move-Item index-legacy.html, index-react.html, index-vite.html, test-direct.html legacy/
8. git add .
9. git commit -m "Nettoyage architecture: fusion editeur complet + corrections bugs"
10. npm run dev

Confirme quand termine.
```

---
## Verification post-nettoyage

### Checklist

- [ ] Branche `editeur-propre-avec-corrections` creee
- [ ] Fichiers corriges integres (StageDirector, soundFeedback, PlayMode)
- [ ] Dossiers `/core/` et `/ui/` supprimes
- [ ] Fichiers HTML legacy archives dans `/legacy/`
- [ ] Un seul `index.html` pointe vers Vite
- [ ] `src/App.jsx` contient l'editeur complet
- [ ] `npm run dev` lance l'editeur (pas le compteur)
- [ ] Console affiche logs `[StageDirector]`
- [ ] Bouton Mute present en mode joueur

### Tests fonctionnels

1. **Editeur s'affiche** : http://localhost:5173 montre les 6 etapes
2. **Creer scene** : Ajouter une scene fonctionne
3. **Creer dialogue** : Ajouter un dialogue fonctionne
4. **Mode joueur** : Cliquer "Jouer" lance la scene (pas "Fin du jeu")
5. **Bouton Mute** : Icone son presente, clic coupe/reactive
6. **Console logs** : F12 montre `[StageDirector]` et `[Sound]`

---

## En cas de probleme

### Probleme : App.jsx est toujours le compteur simple

**Solution** : Recuperer ton ancien App.jsx :

```bash
git show 1fc17cb:src/App.jsx > src/App.jsx
git add src/App.jsx
git commit --amend --no-edit
```

### Probleme : Erreurs de compilation Vite

**Solution** : Reinstaller dependances :

```bash
Remove-Item -Recurse -Force node_modules/
Remove-Item package-lock.json
npm install
npm run dev
```

### Probleme : Fichiers manquants apres suppression /core/ et /ui/

**Solution** : Verifier que tout est dans `/src/` :

```bash
Get-ChildItem -Recurse src/core/
Get-ChildItem -Recurse src/utils/
Get-ChildItem -Recurse src/components/
```

Si des fichiers manquent, recuperer depuis ton commit :

```bash
git show 1fc17cb:src/path/to/file.js > src/path/to/file.js
```

### Probleme : Toujours en detached HEAD

**Solution** : Verifier la branche :

```bash
git branch
# Si pas d'etoile devant editeur-propre-avec-corrections :
git switch editeur-propre-avec-corrections
```

---

## Prochaines etapes (apres nettoyage)

1. **Push sur GitHub** :
   ```bash
   git push origin editeur-propre-avec-corrections
   ```

2. **Creer Pull Request** :
   - Depuis `editeur-propre-avec-corrections` vers `Access-City-5.5a`
   - Titre : "Nettoyage architecture + integration corrections bugs"

3. **Implementer fonctions manquantes** :
   - Ouvrir `docs/SCENE_EDITOR_FIXES.md`
   - Ajouter bouton "Supprimer scene"
   - Ajouter bouton "Creer scene vierge"

4. **Tests complets** :
   - Creer un scenario de A a Z
   - Tester tous les dialogues
   - Exporter et verifier le JSON

---

**Bonne chance ! Si tu bloques, refere-toi a ce document.**