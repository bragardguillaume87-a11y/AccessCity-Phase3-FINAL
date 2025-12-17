# Setup Vite — Guide de démarrage rapide

> **Statut** : ✅ À jour pour le Scenario Editor MVP  
> **Dernière mise à jour** : Décembre 2025

## 🎯 Objectif

Tester le workflow Vite avec Hot Module Replacement (HMR) en parallèle de l'app originale `index-react.html`.

---

## 🚀 Démarrage

### Lancer le serveur dev Vite

```powershell
npm run dev:vite
```

**Résultat** : Navigateur s'ouvre automatiquement sur `http://localhost:5173`

### Tester le HMR (changements instantanés)

1. **Ouvre** : `src/App.jsx` dans ton éditeur
2. **Modifie** ligne 13 (titre) :
   ```jsx
   <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
     AccessCity - Mon Premier Test Vite 🎉
   </h1>
   ```
3. **Sauvegarde** (Ctrl+S)
4. **Observe** : Le navigateur met à jour le titre INSTANTANÉMENT sans recharger la page
5. **Vérifie** : Le compteur (si tu as cliqué dessus) garde sa valeur

### Test avancé : préservation d'état

1. **Clique** le bouton "Compteur" plusieurs fois (ex: 5 clics → compteur = 5)
2. **Modifie** `src/App.jsx` : change la couleur du bouton :
   ```jsx
   className="bg-green-600 hover:bg-green-700 text-white..."
   ```
3. **Sauvegarde**
4. **Magie** : Le bouton devient vert, mais le compteur reste à 5 (état préservé !)

---

## 📁 Structure créée

```
src/
  ├── main.jsx       ← Point d'entrée (import React, monte App)
  ├── App.jsx        ← Composant racine (démo compteur + HMR)
  └── index.css      ← Styles globaux (Poppins font)

index-vite.html      ← Template HTML minimal Vite
vite.config.js       ← Configuration Vite (port 5173, React plugin)
```

---

## 🔧 Commandes disponibles

| Commande | Usage |
|----------|-------|
| `npm run dev:vite` | Serveur dev avec HMR (port 5173) |
| `npm run build:vite` | Build production → `dist/` |
| `npm run preview:vite` | Tester build prod localement |
| `npm run dev` | *Ancien* serveur Python (port 8000, `index-react.html`) |

---

## 🔄 Workflow développement

### Avant (Python server)

```
1. Modifie index-react.html
2. Ctrl+S (sauvegarde)
3. Alt+Tab (retour navigateur)
4. F5 (recharge complète)
5. Re-navigation vers zone modifiée
→ Total : ~15 secondes par changement
```

### Maintenant (Vite HMR)

```
1. Modifie src/App.jsx
2. Ctrl+S (sauvegarde)
3. Changement visible instantanément (split-screen éditeur/navigateur)
→ Total : ~0.5 seconde, état préservé
```

---

## ⚖️ Cohabitation avec version originale

### Version originale (`index-react.html`)
- **URL** : `http://localhost:8000/index-react.html` (serveur Python)
- **Commande** : `npm run dev`
- **État** : INCHANGÉE, reste fonctionnelle
- **Usage** : Production, tests E2E actuels

### Version Vite (`index-vite.html`)
- **URL** : `http://localhost:5173` (serveur Vite)
- **Commande** : `npm run dev:vite`
- **État** : Démo minimale (compteur + HMR)
- **Usage** : Développement, prévisualisation rapide

**Les deux versions coexistent sans conflit.**

---

## 🧪 Prochaines étapes (optionnelles)

### Phase 2 : Migration composants AccessCity

### Intégration moteur réel (DialogueEngine)

1. ✅ Hook `useDialogueEngine` ajouté (`src/hooks/useDialogueEngine.js`)
2. ✅ `App.jsx` utilise maintenant une scène initiale `initialScene` passée au moteur
3. ✅ Variables narratives gérées par `VariableManager` (Physique, Mentale, Alerte)
4. ✅ HUD React dédié (`src/components/VariablesHUD.jsx`)
5. ✅ Reset moteur sans reload via `reset()` (restaure variables + relance scène)
6. 🧪 Tester effets: choisir "Boost Mentale" ou "Fatigue Physique" et observer HUD instantané
7. 🔍 EventLog (`src/components/EventLogPanel.jsx`) pour tracer `dialogue_show`, `choices_show`, `scene_end`, `variable_changed`
8. 🔄 Pour modifier la scène: édite `initialScene` dans `App.jsx` (dialogues / choices / effets)

**Avantage** : Environnement interactif complet: édition, exécution, observation événements et état sans cycle de rechargement.

### Phase 3 : Instrumentation couverture

1. **Installer** : `npm install --save-dev vite-plugin-istanbul`
2. **Activer** dans `vite.config.js` (mode conditionnel `COVERAGE=1`)
3. **Build** version instrumentée : `npm run build:cov`
4. **Tester** E2E sur cette version
5. **Vérifier** `coverage/browser/*.json` remplis avec vraies données

---

## 🐛 Troubleshooting

### Port 5173 déjà utilisé ?

**Modifier** `vite.config.js` :
```javascript
server: {
  port: 5174, // ou autre port libre
}
```

### HMR ne fonctionne pas ?

1. **Vérifier** console navigateur (F12) : erreurs ?
2. **Relancer** serveur : `Ctrl+C` puis `npm run dev:vite`
3. **Vider cache** : `Ctrl+Shift+R` (hard refresh)

### Import erreurs ?

**Vérifier** chemins relatifs :
- ✅ `import App from './App.jsx'` (`.jsx` explicite)
- ❌ `import App from './App'` (peut fonctionner mais moins clair)

---

## 📊 Comparatif performance

| Métrique | Python server | Vite dev |
|----------|---------------|----------|
| **Démarrage serveur** | 1-2s | 1.5s |
| **Premier chargement** | 2-3s | 1.8s |
| **Refresh après modif** | 2s (F5 complet) | **0.3s (HMR)** |
| **Préservation état** | ❌ Non | ✅ Oui |
| **Erreurs syntaxe** | Runtime (navigateur) | Build time (terminal + overlay) |

---

## 💡 Conseils utilisation

### Pour prévisualisation scénarios

1. **Lance** `npm run dev:vite`
2. **Ouvre** `src/App.jsx` en split-screen avec navigateur
3. **Modifie** dialogues/choix directement dans composant
4. **Observe** rendu instantané
5. **Itère** rapidement jusqu'à résultat satisfaisant

### Pour tests E2E

**Garder** serveur Python + `index-react.html` pour l'instant.
Migration tests E2E vers Vite = Phase 3 (après stabilisation composants).

---

## 🔗 Ressources

- [Vite Guide officiel](https://vitejs.dev/guide/)
- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [Migration roadmap complète](./docs/COVERAGE_ROADMAP.md)

---

**Auteur** : Setup initial 28 novembre 2025  
**Statut** : ✅ Fonctionnel, prêt pour tests
