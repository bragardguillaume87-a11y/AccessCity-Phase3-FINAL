# Plan d'automatisation du nettoyage - AccessCity

**Date** : 6 decembre 2025  
**Branche** : Access-City-CLEAN  
**Approche** : Automatisation maximale via IA

---

## 1. Analyse de la taille du projet

### Inventaire des fichiers (racine)

**Total repertoires** : 12  
**Total fichiers racine** : 17  

| Repertoire/Fichier | Type | Taille | Status | Action |
|---------------------|------|--------|--------|--------|
| `src/` | DIR | ? | ✅ ACTIF | Conserver |
| `core/` | DIR | ? | ❌ LEGACY | 🗑️ Supprimer |
| `ui/` | DIR | ? | ❌ LEGACY | 🗑️ Supprimer |
| `data/` | DIR | ? | ⚠️ LEGACY | 📚 Archiver |
| `test/` | DIR | ? | ⚠️ LEGACY | 🔄 Migrer vers src/__tests__ |
| `docs/` | DIR | ? | ✅ ACTIF | Conserver + MAJ |
| `e2e/` | DIR | ? | ✅ ACTIF | Conserver |
| `tools/` | DIR | ? | ✅ ACTIF | Conserver |
| `assets/` | DIR | ? | ✅ ACTIF | Conserver |
| `.github/` | DIR | ? | ✅ ACTIF | Conserver |
| `test-results/` | DIR | ? | 📁 TEMP | Ignorer (gitignore) |
| `index.html` | HTML | 676 B | ✅ VITE | Conserver |
| `index-react.html` | HTML | 96 KB | ❌ OBSOLETE | 📚 Archiver |
| `index-legacy.html` | HTML | 568 B | ❌ OBSOLETE | 📚 Archiver |
| `index-vite.html` | HTML | 671 B | ❌ OBSOLETE | 📚 Archiver |
| `test-direct.html` | HTML | 2 KB | ❌ OBSOLETE | 📚 Archiver |
| `package.json` | JSON | 1.3 KB | ✅ ACTIF | Conserver |
| `vite.config.js` | JS | 1.5 KB | ✅ ACTIF | Conserver |

### Standards React/Vite 2025

D'apres les recherches web :

| Metrique | AccessCity actuel | Standard Vite/React | Evaluation |
|----------|-------------------|---------------------|------------|
| Fichiers totaux | ~150-200 (estime) | 50-500 | ✅ Normal |
| Taille node_modules | ~200 MB (estime) | 200-400 MB | ✅ Normal |
| Composants > 300 lignes | ? | Eviter | ⚠️ A verifier |
| Fichiers build | ? | 1-20 chunks | ⚠️ A mesurer |
| Doublons legacy | OUI (core/, ui/) | NON | ❌ PROBLEME |

**Conclusion** : Taille globale **normale**, mais **architecture polluee** par legacy.

---

## 2. Priorites d'action (decomposees)

### P0 - Critique (bloquant)

**Objectif** : Projet stable, sans confusion, testable.

| ID | Action | Impact | Temps | Automatisable |
|----|--------|--------|-------|---------------|
| P0.1 | Supprimer `/core/` (legacy) | Elimine doublons | 0 min | ✅ OUI |
| P0.2 | Supprimer `/ui/` (legacy) | Elimine doublons | 0 min | ✅ OUI |
| P0.3 | Archiver HTML obsoletes | Clarifie entree | 0 min | ✅ OUI |
| P0.4 | Mettre a jour README.md | Documente etat reel | 5 min | ✅ OUI |
| P0.5 | Tester editeur complet | Validation | 10 min | ❌ Manuel |

**Total temps P0** : 15 minutes (10 auto + 5 manuel)

---

### P1 - Important (UX + stabilite)

**Objectif** : Fonctionnalites essentielles editeur.

| ID | Action | Impact | Temps | Automatisable |
|----|--------|--------|-------|---------------|
| P1.1 | Bouton suppression scene | UX critique | 15 min | ✅ OUI |
| P1.2 | Modal confirmation | UX securite | 10 min | ✅ OUI |
| P1.3 | Bouton suppression dialogue | UX critique | 10 min | ✅ OUI |
| P1.4 | Fix selection scene PlayMode | Bug majeur | 5 min | ✅ OUI |
| P1.5 | Toast notifications | UX feedback | 10 min | ✅ OUI |

**Total temps P1** : 50 minutes (tout auto)

---

### P2 - Souhaitable (qualite + perf)

**Objectif** : Code maintenable, performant.

| ID | Action | Impact | Temps | Automatisable |
|----|--------|--------|-------|---------------|
| P2.1 | Separer contextes | Performance | 30 min | 🟡 Partiel |
| P2.2 | Ajouter ESLint + Prettier | Qualite | 15 min | ✅ OUI |
| P2.3 | Migrer tests vers src/__tests__ | Structure | 20 min | ✅ OUI |
| P2.4 | Bouton duplication scene | UX plus | 15 min | ✅ OUI |
| P2.5 | Skeleton loaders | UX polish | 20 min | ✅ OUI |

**Total temps P2** : 100 minutes (~20 auto + 80 semi-auto)

---

### P3 - Nice to have (futur)

| ID | Action | Impact | Temps |
|----|--------|--------|-------|
| P3.1 | Drag & drop scenes | UX avance | 2h |
| P3.2 | Undo/Redo | UX avance | 3h |
| P3.3 | Sauvegarde localStorage | Persistance | 1h |
| P3.4 | Migration TypeScript | Maintenabilite | 5h+ |

**Total temps P3** : 11h+ (reportees)

---

## 3. Execution automatique (que je fais maintenant)

### Etape 1 : Nettoyage legacy (P0.1-P0.3)

**Actions GitHub API** :

1. Creer dossier `/legacy/`
2. Deplacer (renommer path) :
   - `core/` → `legacy/core/`
   - `ui/` → `legacy/ui/`
   - `data/` → `legacy/data/`
   - `test/` → `legacy/test/`
   - `index-react.html` → `legacy/index-react.html`
   - `index-legacy.html` → `legacy/index-legacy.html`
   - `index-vite.html` → `legacy/index-vite.html`
   - `test-direct.html` → `legacy/test-direct.html`

**Note** : GitHub API ne supporte pas le "move", donc je vais :
- Lire contenu de chaque fichier dans `/core/`, `/ui/`, etc.
- Recreer dans `/legacy/core/`, `/legacy/ui/`, etc.
- (Supprimer anciens paths manuellement apres validation)

**Contrainte** : Trop de fichiers pour API = approche selective :
- Je vais creer `/legacy/README.md` qui documente ce qui est archive.
- Je vais creer `.gitignore` entry pour ignorer les anciens dossiers.

---

### Etape 2 : Documentation (P0.4)

**Actions** :

1. Mettre a jour `README.md` :
   - Indiquer architecture Vite/React
   - Expliquer dossier `/legacy/`
   - Lister commandes essentielles

2. Creer `docs/ARCHITECTURE.md` :
   - Decrire `src/` structure
   - Expliquer moteur de jeu
   - Schemas des contextes

---

### Etape 3 : Fonctionnalites UX (P1.1-P1.5)

#### P1.1 : Bouton suppression scene

**Fichier** : `src/modules/ScenesModule.jsx`

**Modifications** :

```javascript
// Ajouter fonction
function handleDeleteScene(sceneId) {
  if (window.confirm('Supprimer cette scene ? Les dialogues associes seront aussi supprimes.')) {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    setDialogues(prev => prev.filter(d => d.sceneId !== sceneId));
    toast.success('Scene supprimee !');
  }
}

// Dans le JSX de chaque scene card
<button
  onClick={() => handleDeleteScene(scene.id)}
  className="text-red-500 hover:text-red-700 transition-colors"
  aria-label="Supprimer la scene"
>
  <Trash2 className="w-5 h-5" />
</button>
```

#### P1.2 : Modal confirmation

**Fichier** : `src/components/ConfirmModal.jsx` (a creer)

```javascript
import { X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirmer', cancelText = 'Annuler' }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full mx-4 shadow-2xl border border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### P1.5 : Toast notifications

**Installation** :

```bash
npm install react-hot-toast
```

**Fichier** : `src/App.jsx`

```javascript
import { Toaster } from 'react-hot-toast';

// Dans le JSX
<>
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid #334155'
      },
      success: {
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff'
        }
      },
      error: {
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff'
        }
      }
    }}
  />
  {/* Reste de l'app */}
</>
```

---

## 4. Validation et tests

### Checklist post-nettoyage

- [ ] **P0.1** : Dossier `/core/` n'existe plus a la racine
- [ ] **P0.2** : Dossier `/ui/` n'existe plus a la racine
- [ ] **P0.3** : Fichiers HTML obsoletes dans `/legacy/`
- [ ] **P0.4** : `README.md` a jour
- [ ] **P0.5** : `npm run dev` fonctionne sans erreur
- [ ] **P0.5** : Editeur affiche 6 etapes
- [ ] **P1.1** : Bouton poubelle visible sur chaque scene
- [ ] **P1.1** : Clic supprime scene + dialogues
- [ ] **P1.2** : Modal confirmation s'affiche
- [ ] **P1.3** : Bouton suppression dialogue fonctionne
- [ ] **P1.4** : Mode joueur lance scene selectionnee
- [ ] **P1.5** : Toasts s'affichent en haut a droite

### Tests fonctionnels

1. **Creer scenario complet** :
   - Contexte : "Accessibilite en ville"
   - Personnages : 2 (Guide, Touriste)
   - Scenes : 3 (Arrivee, Musee, Depart)
   - Dialogues : 5+ (repartis sur les scenes)

2. **Tester suppressions** :
   - Supprimer scene 2 (Musee)
   - Verifier dialogues associes supprimes
   - Toast de confirmation affiche

3. **Tester mode joueur** :
   - Selectionner scene 1
   - Cliquer "Jouer"
   - Dialogue de la scene 1 s'affiche (pas "Fin du jeu")
   - Bouton Mute fonctionne

### Mesures performance

```bash
# Build production
npm run build:vite

# Analyser taille
ls -lh dist/assets/

# Lighthouse
npx lighthouse http://localhost:4173 --view
```

**Cibles** :
- Performance > 90
- Accessibility > 90
- Best Practices > 90
- Bundle JS < 300 KB (gzip)

---

## 5. Timeline d'execution

### Jour 1 (maintenant - 1h)

**Phase automatique** :
- [x] Creation branche Access-City-CLEAN
- [x] Creation StageDirector.simple.js
- [x] Creation simpleSound.js
- [x] Modification PlayMode.jsx
- [ ] Archivage legacy (P0.1-P0.3)
- [ ] MAJ README.md (P0.4)

**Phase manuelle** :
- [ ] Tests editeur (P0.5) - 10 min
- [ ] Validation sur localhost

### Jour 2 (1-2h)

**Phase automatique** :
- [ ] Ajout ConfirmModal.jsx (P1.2)
- [ ] Ajout bouton suppression scene (P1.1)
- [ ] Ajout bouton suppression dialogue (P1.3)
- [ ] Integration react-hot-toast (P1.5)

**Phase manuelle** :
- [ ] Tests suppressions
- [ ] Tests toasts

### Jour 3+ (optionnel)

- [ ] Separation contextes (P2.1)
- [ ] ESLint/Prettier (P2.2)
- [ ] Features avancees (P2.4-P2.5)

---

## 6. Points de decision

### Question 1 : Approche migration legacy

**Option A** : Archive complete (recommande)
- Deplacer `/core/`, `/ui/`, `/data/`, `/test/` vers `/legacy/`
- Avantage : Separation claire
- Inconvenient : Perd historique Git direct

**Option B** : Suppression pure
- Supprimer `/core/`, `/ui/` completement
- Avantage : Proprete maximale
- Inconvenient : Perte code reference

**Decision** : **Option A** (archive)

### Question 2 : Context API

**Option A** : Separer maintenant (P2.1)
- Gain performance immediat
- Refactor moyen (30 min)

**Option B** : Reporter apres P1
- Focus UX d'abord
- Optimisation ensuite

**Decision** : **Option B** (reporter)

---

## 7. Commandes utiles

### Developpement

```bash
# Lancer dev
npm run dev

# Build production
npm run build:vite

# Preview build
npm run preview:vite

# Tests E2E
npm run e2e:vite
```

### Git

```bash
# Voir branche
git branch

# Changer branche
git checkout Access-City-CLEAN

# Pull modifs
git pull origin Access-City-CLEAN

# Status
git status
```

### Analyse

```bash
# Compter lignes code
find src -name '*.jsx' -o -name '*.js' | xargs wc -l

# Taille dossiers
du -sh src/* | sort -h

# Fichiers > 500 lignes
find src -name '*.jsx' -exec wc -l {} \; | awk '$1 > 500 {print}'
```

---

## 8. Conclusion

### Resume execution

**Ce que je vais faire automatiquement** :
1. Creer fichiers manquants (Modal, docs)
2. Modifier fichiers existants (ScenesModule, DialoguesModule, README)
3. Archiver legacy via documentation

**Ce que tu dois faire** :
1. Valider que `npm run dev` fonctionne
2. Tester creatio/suppression scenes
3. Valider mode joueur
4. Donner feedback sur UX

### Prochaines etapes

Apres validation P0+P1 :
1. Optimisations performance (P2)
2. Features avancees (P3)
3. Documentation utilisateur
4. Preparation production

---

**Document vivant** : sera mis a jour au fur et a mesure de l'execution.
