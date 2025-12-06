# Dossier Legacy - Code Archive

**Date archivage** : 6 decembre 2025  
**Raison** : Migration vers architecture React/Vite moderne

---

## Qu'est-ce que ce dossier ?

Ce dossier contient l'**ancien code** d'AccessCity (versions 1.0 a 4.x) base sur :
- JavaScript vanilla (pas de framework)
- Architecture modulaire custom
- HTML statique avec scripts

**Ce code n'est plus utilise** dans l'application actuelle.

---

## Contenu archive

### `/legacy/core/` - Ancien moteur de jeu

**Fichiers principaux** :
- `main.js` - Point d'entree
- `eventBus.js` - Systeme d'evenements
- `schema.js` - Validation schemas
- `sanitizer.js` - Nettoyage donnees
- `jsonSceneLoader.js` - Chargement scenes JSON
- `StageDirector.js` - Ancien moteur (bugs dialogues)

**Remplacement moderne** : `src/core/StageDirector.simple.js`

### `/legacy/ui/` - Ancienne interface

**Fichiers principaux** :
- `DevToolsPanel.js` - Panneau debug
- `SceneList.js` - Liste scenes (vanilla)
- `DialogueList.js` - Liste dialogues (vanilla)
- `InspectorPanel.js` - Inspecteur proprietes

**Remplacement moderne** : `src/modules/ScenesModule.jsx`, `src/modules/DialoguesModule.jsx`

### `/legacy/data/` - Donnees exemples

**Fichiers principaux** :
- `scenes.json` - Scenes exemple
- `core_system.json` - Config systeme
- `schemas.json` - Schemas validation
- `ui_layout.json` - Layout UI

**Remplacement moderne** : Donnees gerees dans contextes React (`src/AppContext.jsx`)

### `/legacy/test/` - Anciens tests

**Fichiers principaux** :
- `core.eventBus.test.js`
- `core.schema.test.js`
- `core.sanitizer.test.js`
- `ascii-check.js`

**Remplacement moderne** : Tests Playwright dans `/e2e/` + tests unitaires a venir dans `src/__tests__/`

### HTML obsoletes

- `index-legacy.html` - Version vanilla JS
- `index-react.html` - Version React embarquee (96 KB !)
- `index-vite.html` - Demo Vite test
- `test-direct.html` - Test direct moteur

**Remplacement moderne** : `index.html` unique pointant vers Vite

---

## Pourquoi archiver ?

### Problemes ancienne architecture

1. **Doublons** : Code duplique entre `/core/`, `/ui/` et `/src/core/`
2. **Maintenance difficile** : Pas de framework, logique eparpillee
3. **Bugs persistants** :
   - Dialogues non connectes aux scenes
   - "Fin du jeu" immediate en mode joueur
   - Erreur `playClose is not defined`
4. **Tests limites** : Tests unitaires JS vanilla peu maintenables
5. **Performance** : Pas d'optimisations modernes (HMR, tree-shaking, etc.)

### Avantages nouvelle architecture

1. **React 19** : Composants reutilisables, hooks modernes
2. **Vite 7** : Build ultra-rapide, HMR instantane
3. **Structure claire** : `src/` = code actif, `legacy/` = archive
4. **Tests E2E** : Playwright sur navigateurs reels
5. **Maintenance facilitee** : Standards React 2025

---

## Ou trouver le code moderne ?

| Ancien fichier | Nouveau fichier | Notes |
|----------------|-----------------|-------|
| `/core/StageDirector.js` | `src/core/StageDirector.simple.js` | Bugs corriges |
| `/core/eventBus.js` | Context API React | `src/AppContext.jsx` |
| `/ui/SceneList.js` | `src/modules/ScenesModule.jsx` | Composant React |
| `/ui/DialogueList.js` | `src/modules/DialoguesModule.jsx` | Composant React |
| `/data/scenes.json` | State React | Gere via useState/Context |
| `/test/*.test.js` | `/e2e/*.spec.ts` | Tests Playwright |

---

## Peut-on supprimer ce dossier ?

**Non recommande** pour l'instant. Raisons :

1. **Reference** : Utile pour comprendre logique metier historique
2. **Tests** : Schemas de validation peuvent servir de reference
3. **Documentation** : Certains fichiers contiennent des commentaires utiles
4. **Securite** : Garder trace de l'evolution du projet

**Apres validation complete** (tests E2E 100%, doc migree), ce dossier pourra etre supprime.

---

## Historique migration

### Phase 1 (nov 2025) - Setup Vite
- Creation `src/` avec structure React
- Configuration Vite + HMR
- Migration premiers composants

### Phase 2 (dec 2025) - Correction bugs
- Creation `StageDirector.simple.js` (dialogues corriges)
- Creation `simpleSound.js` (systeme son unifie)
- Modification `PlayMode.jsx` (utilise nouveaux fichiers)

### Phase 3 (dec 2025) - Nettoyage
- Archivage `/core/`, `/ui/`, `/data/`, `/test/`
- Suppression HTML obsoletes
- Documentation architecture moderne

---

## Questions ?

Voir documentation principale : [`../README.md`](../README.md)

Ou documentation technique : [`../docs/CLEANUP_AUTOMATION_PLAN.md`](../docs/CLEANUP_AUTOMATION_PLAN.md)
