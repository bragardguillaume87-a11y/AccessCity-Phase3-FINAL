# 🏛️ Guide des deux applications AccessCity

## 🎯 Votre projet contient DEUX applications distinctes

Le projet AccessCity a **deux points d'entrée HTML** :

| Fichier | Application | Utilisation |
|---------|-------------|-------------|
| `index-react.html` | **Éditeur AccessCity** 🎮 | Application principale avec éditeur de scènes, dialogues, personnages |
| `index.html` | **Démo Vite** 🧪 | Démo technique du moteur DialogueEngine (pour tests) |

---

## 🚀 Comment accéder à chaque application ?

### **Application 1 : Éditeur AccessCity (PRINCIPAL)**

**C'est l'application avec les corrections de bugs !**

#### **Accès après la configuration Vite (automatique)**

```bash
npm run dev
```

**Ouvre automatiquement** : `http://localhost:5173/` (redirige vers `index-react.html`)

#### **Accès direct (si nécessaire)**

Dans le navigateur : `http://localhost:5173/index-react.html`

#### **Fonctionnalités** :
- 🎭 Éditeur de scènes
- 💬 Éditeur de dialogues
- 👥 Gestion des personnages
- ▶️ Mode joueur avec les corrections :
  - ✅ Dialogues connectés aux scènes
  - ✅ Sélection de scène fonctionnelle
  - ✅ Bouton Mute opérationnel

---

### **Application 2 : Démo Vite (TECHNIQUE)**

**Pour les développeurs/tests uniquement**

#### **Accès**

Dans le navigateur : `http://localhost:5173/demo` (ou `http://localhost:5173/index.html`)

#### **Fonctionnalités** :
- 🧪 Démo du moteur `DialogueEngine`
- 🔧 Tests du Hot Module Replacement (HMR)
- 📊 Visualisation des variables
- 📤 Event Log Panel

---

## ⚙️ Configuration Vite

Le fichier `vite.config.js` a été configuré pour :

### **1. Redirection automatique vers l'éditeur**

```javascript
// Middleware de redirection
{
  name: 'redirect-to-editor',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/' || req.url === '/index.html') {
        req.url = '/index-react.html';
      }
      next();
    });
  },
}
```

### **2. Build multi-pages**

```javascript
build: {
  rollupOptions: {
    input: {
      main: './index-react.html', // Éditeur (défaut)
      demo: './index.html',        // Démo
    },
  },
}
```

---

## 🐞 Corrections de bugs appliquées

Les corrections suivantes sont **uniquement dans l'éditeur AccessCity** (`index-react.html`) :

### **✅ Bug 1 : Dialogues connectés aux scènes**
- Fichier : `src/core/StageDirector.js`
- Fix : `getCurrentDialogue()` filtre par `scene.id`

### **✅ Bug 2 : Sélection de scène**
- Fichier : `src/core/StageDirector.js`, `src/components/PlayMode.jsx`
- Fix : Support de `initialSceneIndex`

### **✅ Bug 3 : Bouton Mute**
- Fichiers : `src/utils/soundFeedback.js`, `src/components/PlayMode.jsx`
- Fix : Système global `setGlobalMute()`

### **📝 Bugs 4 & 5 : Supprimer/Créer scène**
- Documentation : `docs/SCENE_EDITOR_FIXES.md`
- À implémenter dans l'éditeur

---

## 🔍 Comment vérifier que tu es sur la bonne application ?

### **🟢 Tu es sur l'éditeur AccessCity si :**

1. **URL** : `http://localhost:5173/` ou `http://localhost:5173/index-react.html`
2. **Interface** : Tu vois :
   - Un panneau latéral avec "Scènes", "Dialogues", "Personnages"
   - Des onglets d'édition
   - Un bouton "▶️ Jouer"
3. **Console** (F12) : Tu vois des logs comme :
   ```
   [StageDirector] Initialisation: scène 0/X
   [Sound] Playing: ...
   ```

### **🔴 Tu es sur la démo Vite si :**

1. **URL** : `http://localhost:5173/demo` ou `http://localhost:5173/index.html`
2. **Interface** : Tu vois :
   - "AccessCity - Vite Demo"
   - "HMR actif ! Modifie ce texte..."
   - "Prochaines étapes"
   - Un bouton "Compteur: 0"
3. **Console** (F12) : Tu vois :
   ```
   [DialogueEngine] Starting scene: Demo moteur DialogueEngine
   ```

---

## 🛠️ Dépannage

### **Problème : Je vois toujours la démo au lieu de l'éditeur**

**Solution 1 : Pull la configuration Vite mise à jour**

```bash
git pull origin Access-City-5.5a
```

**Solution 2 : Redémarrer le serveur**

```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

**Solution 3 : Accéder manuellement**

Dans le navigateur : `http://localhost:5173/index-react.html`

### **Problème : Je ne vois pas les corrections de bugs**

**Vérifie que tu es bien sur `index-react.html`**, pas sur `index.html` (la démo).

Regarde l'URL dans le navigateur :
- ✅ **Bon** : `http://localhost:5173/` ou `http://localhost:5173/index-react.html`
- ❌ **Mauvais** : `http://localhost:5173/demo` ou `http://localhost:5173/index.html`

### **Problème : Le serveur ne redémarre pas**

```bash
# Tuer tous les processus Node
taskkill /F /IM node.exe

# Relancer
npm run dev
```

---

## 📚 Documentation complète

- **Résumé des corrections** : `docs/BUGFIXES_SUMMARY.md`
- **Guide supprimer/créer scène** : `docs/SCENE_EDITOR_FIXES.md`
- **Code source** :
  - Éditeur : `index-react.html` + `src/accesscity-studio-v3.tsx`
  - Démo : `index.html` + `src/App.jsx`

---

## 🎯 Récapitulatif rapide

```bash
# Pour travailler sur l'éditeur AccessCity (RECOMMANDÉ)
npm run dev
# Ouvre automatiquement http://localhost:5173/

# Pour accéder à la démo technique (OPTIONNEL)
# Naviguer vers http://localhost:5173/demo
```

**Par défaut, tu travailles maintenant sur l'éditeur AccessCity avec toutes les corrections ! 🎉**

---

**Date de création** : 5 décembre 2025  
**Version** : 1.0  
**Statut** : ✅ Configuration active