# Branche Access-City-CLEAN

**Branche propre et fonctionnelle** creee automatiquement le 6 decembre 2025.

---

## Objectif

Cette branche contient :
- Architecture Vite moderne unifiee
- Corrections des bugs critiques (dialogues, scene, mute)
- Code simplifie sans dependances complexes
- **Compatible avec ton editeur existant**

---

## Fichiers crees/corriges

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `src/core/StageDirector.simple.js` | Moteur de jeu corrige (dialogues par scene.id) |
| `src/utils/simpleSound.js` | Systeme son simple avec mute global |
| `BRANCH_CLEAN_README.md` | Ce fichier |

### Corrections principales

1. **Bug dialogues non connectes** :
   - `StageDirector` filtre maintenant par `scene.id` au lieu d'index
   - Fonction `getDialoguesForScene(sceneId)` ajoutee

2. **Bug 'Fin du jeu' immediate** :
   - Support `initialSceneIndex` dans le constructeur
   - Verification dialogues avant de demarrer
   - Logs de debug pour tracer les problemes

3. **Systeme son simplifie** :
   - Une seule fonction `playSound(path, volume)`
   - Mute global avec `toggleMute()`
   - Gestion erreurs automatique
   - Sans dependances externes

---

## Installation locale

### Etape 1 : Pull la branche

```powershell
# Sauvegarder ton travail actuel (optionnel)
git stash

# Passer sur la nouvelle branche
git checkout Access-City-CLEAN

# Mettre a jour
git pull origin Access-City-CLEAN
```

### Etape 2 : Installer dependances

```powershell
npm install
```

### Etape 3 : Lancer l'application

```powershell
npm run dev
```

### Etape 4 : Ouvrir dans le navigateur

```
http://localhost:5173
```

**Forcer le rechargement du cache** : Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)

---

## Utilisation dans ton code

### Utiliser StageDirector.simple.js

Dans ton composant `PlayMode.jsx` ou equivalent :

```javascript
import StageDirector from '../core/StageDirector.simple.js';

// Creer une instance
const director = new StageDirector(
  scenes,           // Tes scenes
  dialogues,        // Tes dialogues
  {                 // Etat initial
    physique: 100,
    mentale: 100
  },
  selectedSceneIndex // Index de la scene selectionnee (FIX !)
);

// Obtenir dialogue actuel
const currentDialogue = director.getCurrentDialogue();

// Faire un choix
director.makeChoice(choice);

// Verifier fin du jeu
if (director.isGameOver()) {
  console.log('Fin du jeu !');
}
```

### Utiliser simpleSound.js

Dans n'importe quel composant :

```javascript
import { playSound, toggleMute, isSoundMuted } from '../utils/simpleSound.js';

// Jouer un son
playSound('/sounds/click.mp3', 0.5); // volume 0-1

// Toggle mute
const nowMuted = toggleMute();

// Verifier etat mute
if (isSoundMuted()) {
  console.log('Son coupe');
}
```

### Exemple bouton Mute simple

```jsx
import { toggleMute, isSoundMuted } from '../utils/simpleSound.js';

function MuteButton() {
  const [muted, setMuted] = useState(isSoundMuted());
  
  const handleToggle = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
  };
  
  return (
    <button onClick={handleToggle}>
      {muted ? '🔇 Muet' : '🔊 Son'}
    </button>
  );
}
```

---

## Verification

### Tests a effectuer

- [ ] L'application se lance sans erreur
- [ ] L'editeur affiche les 6 etapes
- [ ] Creer une scene fonctionne
- [ ] Creer un dialogue fonctionne
- [ ] Mode joueur lance la scene selectionnee
- [ ] Les dialogues s'affichent (pas "Fin du jeu")
- [ ] Console affiche `[StageDirector]` et `[Sound]`
- [ ] Pas d'erreur `playClose is not defined`

### Console logs attendus

```
[StageDirector] Initialisation: scene 0/3
[StageDirector] Scene "scene_1": 5 dialogues trouves
[StageDirector] Dialogue actuel: Vous arrivez devant l'imposant...
[Sound] Joue: /sounds/dialogue.mp3
```

---

## Architecture

### Structure des dossiers

```
src/
├── core/
│   ├── StageDirector.simple.js    ← NOUVEAU (corrige)
│   └── DialogueEngine.js          ← Existant
├── utils/
│   └── simpleSound.js             ← NOUVEAU (simple)
├── components/
│   ├── PlayMode.jsx               ← A adapter
│   └── ...
├── modules/
│   ├── ScenesModule.jsx
│   ├── DialoguesModule.jsx
│   └── ...
└── App.jsx                        ← Point d'entree
```

### Fichiers a supprimer (optionnel)

Apres avoir verifie que tout fonctionne :

```powershell
# Supprimer anciens fichiers
Remove-Item -Recurse -Force core/      # Doublon legacy
Remove-Item -Recurse -Force ui/        # Doublon legacy
Remove-Item index-legacy.html          # HTML obsolete
Remove-Item index-react.html           # HTML obsolete
Remove-Item index-vite.html            # HTML obsolete
```

---

## Prochaines etapes

### 1. Adapter PlayMode.jsx

Remplacer l'ancien StageDirector par le nouveau :

```javascript
// AVANT
import StageDirector from '../core/StageDirector.js';

// APRES
import StageDirector from '../core/StageDirector.simple.js';
```

Ajouter `selectedSceneIndex` au constructeur :

```javascript
// AVANT
const director = new StageDirector(scenes, dialogues, gameState);

// APRES
const director = new StageDirector(scenes, dialogues, gameState, selectedSceneIndex);
```

### 2. Ajouter bouton Mute

Dans le header de `PlayMode.jsx` :

```jsx
import { toggleMute, isSoundMuted } from '../utils/simpleSound.js';

const [muted, setMuted] = useState(isSoundMuted());

const handleMuteToggle = () => {
  const newMuted = toggleMute();
  setMuted(newMuted);
};

// Dans le JSX
<button onClick={handleMuteToggle}>
  {muted ? '🔇' : '🔊'}
</button>
```

### 3. Tester completement

Creer un scenario de A a Z :
1. Contexte
2. Personnages
3. Scenes (avec ID uniques)
4. Dialogues (avec sceneId correspondants)
5. Jouer

### 4. Implementer fonctions manquantes

Consulter `docs/SCENE_EDITOR_FIXES.md` pour :
- Bouton "Supprimer scene"
- Bouton "Creer scene vierge"

---

## Support

### En cas de probleme

1. **Erreur import** : Verifier les chemins d'import
2. **Dialogues ne s'affichent pas** : Verifier que `dialogue.sceneId === scene.id`
3. **Son ne fonctionne pas** : Verifier que les fichiers MP3 existent dans `public/sounds/`
4. **Cache navigateur** : Ctrl+Shift+R pour forcer le rechargement

### Logs utiles

Ouvrir la console (F12) et chercher :
- `[StageDirector]` : Moteur de jeu
- `[Sound]` : Systeme son
- Erreurs en rouge

---

## Changelog

### 2025-12-06 - Creation branche

- Creation branche `Access-City-CLEAN`
- Ajout `StageDirector.simple.js` (dialogues corriges)
- Ajout `simpleSound.js` (systeme son simple)
- Documentation complete

---

**Bon developpement !** 🚀
