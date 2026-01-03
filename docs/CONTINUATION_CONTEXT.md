# 🔄 Point de Reprise - AccessCity Studio

> **Document de contexte pour reprendre rapidement une session de développement**
> Dernière mise à jour : 28 décembre 2025 | Version 6.0

---

## 📋 Table des Matières

1. [🚀 Démarrage Rapide (30s)](#-démarrage-rapide-30s)
2. [✅ État Actuel & Travaux Complétés](#-état-actuel--travaux-complétés)
3. [🎮 Gaming UI Guidelines](#-gaming-ui-guidelines)
4. [🔧 Procédures Techniques](#-procédures-techniques)
5. [🎯 Prochaines Étapes](#-prochaines-étapes)
6. [📚 Références](#-références)

---

## 🚀 Démarrage Rapide (30s)

### État Actuel
**Phase complétée** : AssetsLibraryModal Redesign - Phase 2 (Gaming UI/UX)
**Branche Git** : `v6.0-restore-full-project-v2`
**Date** : Décembre 2025

### Lancer le Projet

```bash
# Lancer TOUS les serveurs (Vite frontend + Express backend)
npm run dev

# Accéder à l'app
http://localhost:5173
```

**Serveurs** :
- **Frontend** : Vite dev server sur port 5173
- **Backend** : Express upload server sur port 3001

### Commande Rapide

```bash
# Si serveurs pas lancés
npm run dev

# Si besoin de relancer manuellement
npm run dev:vite    # Frontend seul (port 5173)
npm run dev:server  # Upload server seul (port 3001)
```

---

## ✅ État Actuel & Travaux Complétés

### Phase 1-2 : AssetsLibraryModal Redesign (Complétée)

#### Problème Résolu
**Avant** : Upload UI caché quand `isSelectionMode === true`
**Après** : Upload toujours visible avec design gaming engageant

#### Composants Créés

📁 **Structure** :
```
src/components/modals/AssetsLibraryModal/
├── components/
│   ├── UploadZone.jsx          # Zone upload drag & drop (compact/full)
│   └── EmptyAssetState.jsx     # États vides avec emoji animé
├── hooks/
│   ├── useAssetUpload.js       # Upload avec progress + confetti
│   └── useFavorites.js         # Favoris avec localStorage
└── README.md                   # Documentation technique
```

#### Serveur Backend

📁 `server/index.js` **modifié** :
- Upload multi-fichiers : `upload.array('files', 20)`
- Endpoint : `POST /api/assets/upload`
- Auto-génération manifest après upload

#### Dépendances Installées

```bash
npm install sonner canvas-confetti
```

- **sonner** : Toast notifications gaming-friendly
- **canvas-confetti** : Célébrations avec confetti

#### App.jsx Configuration

```jsx
import { Toaster } from 'sonner';

<Toaster
  position="top-right"
  richColors
  closeButton
  duration={5000}
  theme="dark"
/>
```

### Fonctionnalités Implémentées

✅ **Upload toujours visible** (compact en mode sélection, full en bibliothèque)
✅ **Drag & drop** avec animations scale-110 rotate-6
✅ **Progress tracking** avec barre gradient purple→cyan
✅ **Toast notifications** avec bouton "Annuler" (5s)
✅ **Confetti celebrations** (premier upload OU 5+ fichiers)
✅ **Système de favoris** avec étoile dorée animée
✅ **Empty states engageants** avec emoji bounce-slow
✅ **Filtre "Favoris"** dans smart filters

---

## 🎮 Gaming UI Guidelines

> **Principes pour créer des interfaces gaming engageantes**
> Inspiré par Unity Editor, Roblox Studio, GDevelop (2025)

### 1. Principes de Design

#### **Feedback Immédiat & Célébrations**
- Chaque action utilisateur doit avoir un feedback visuel/sonore
- Les **premières réussites** déclenchent des célébrations (confetti, animations)
- Progression visible en temps réel (barres, pourcentages)

#### **Empty States Engageants**
- Jamais d'écran vide sans appel à l'action
- Emoji/illustrations animées pour personnaliser
- 2-3 CTAs clairs avec hiérarchie visuelle
- Messages positifs et encourageants

#### **Hover States & Micro-interactions**
- `scale-105` ou `scale-110` au hover
- `translateY(-2px)` pour effet "lift"
- Transitions à `200-300ms cubic-bezier(0.4, 0, 0.2, 1)`
- Shadows multicouches pour profondeur

#### **Accessibilité WCAG 2.2**
- Focus rings visibles : `ring-4` minimum (3:1 contrast ratio)
- Labels aria sur tous les boutons
- Navigation clavier complète
- Support reduced-motion

### 2. Palette de Couleurs Gaming

```css
/* Couleurs Primaires (Brand) */
--purple-500: #a855f7   /* Actions principales, gradients */
--cyan-500: #06b6d4     /* Accents, highlights */
--pink-500: #ec4899     /* Confetti, accents secondaires */

/* Couleurs Fonctionnelles */
--amber-500: #f59e0b    /* Favoris, étoiles */
--green-500: #10b981    /* Succès, validation */
--red-500: #ef4444      /* Erreurs, suppressions */
--slate-700: #334155    /* Backgrounds cards */
--slate-400: #94a3b8    /* Texte secondaire */

/* Gradients Gaming */
/* Primary gradient (boutons, headers) */
background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);

/* Accent gradient (hover states) */
background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);

/* Progress bars */
background: linear-gradient(90deg, #a855f7 0%, #06b6d4 100%);
```

### 3. Animations Clés

Toutes définies dans `src/index.css` :

#### **Bounce Slow** (Empty States)
```css
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}
```
**Usage** : Emoji dans EmptyAssetState

#### **Magnetic Lift** (Cards hover)
```css
.magnetic-lift:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 8px 24px rgba(139, 92, 246, 0.2),
    0 4px 12px rgba(139, 92, 246, 0.15),
    0 0 40px rgba(139, 92, 246, 0.15);
}
```
**Usage** : Asset cards, modals

#### **Shimmer** (Loading states)
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer-bg {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
```
**Usage** : Progress bars, skeletons

### 4. Checklist de Gamification

Utilise cette checklist pour **tout nouveau composant** :

#### 🎨 Design Visuel
- [ ] **Palette gaming** : Utiliser purple-500, cyan-500, pink-500
- [ ] **Gradients** : Au moins 1 gradient sur bouton principal
- [ ] **Shadows multicouches** : `shadow-depth-md` ou équivalent
- [ ] **Border radius** : `rounded-xl` minimum pour cards

#### ✨ Animations & Interactions
- [ ] **Hover state** : Scale-105 + translateY(-2px) + shadow
- [ ] **Active state** : Scale-95 pour feedback tactile
- [ ] **Transitions** : 200-300ms cubic-bezier
- [ ] **Empty state** : Emoji/illustration animée (bounce, pulse)

#### 🔊 Feedback Utilisateur
- [ ] **Toast notifications** : Sonner pour succès/erreurs
- [ ] **Progress tracking** : Barre ou spinner pour actions > 500ms
- [ ] **Célébrations** : Confetti pour milestones
- [ ] **Undo capability** : Bouton "Annuler" dans toasts (5s window)

#### ♿ Accessibilité
- [ ] **Focus rings** : `ring-4` avec contraste 3:1
- [ ] **Aria labels** : Sur tous les boutons d'icônes
- [ ] **Keyboard navigation** : Tab, Enter, Escape
- [ ] **Reduced motion** : Support via prefers-reduced-motion

### 5. Patterns de Code Réutilisables

#### **Pattern 1 : Hook Custom avec Progress**

```javascript
export function useCustomAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const performAction = useCallback(async (data) => {
    setIsLoading(true);
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await apiCall(data);

      clearInterval(interval);
      setProgress(100);

      // Toast success
      toast.success('Action réussie !', {
        description: result.message,
      });

      return result;
    } catch (error) {
      toast.error('Erreur', { description: error.message });
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  return { performAction, isLoading, progress };
}
```

#### **Pattern 2 : Composant Empty State**

```jsx
export function EmptyState({
  emoji,
  title,
  description,
  primaryAction,
  secondaryAction
}) {
  return (
    <div className="text-center py-16">
      <div className="text-8xl mb-6 animate-bounce-slow">{emoji}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mx-auto mb-8">{description}</p>

      <div className="flex gap-3 justify-center">
        <Button variant="gaming-primary" onClick={primaryAction.onClick}>
          <primaryAction.icon className="h-5 w-5" />
          {primaryAction.label}
        </Button>

        {secondaryAction && (
          <Button variant="gaming-accent" onClick={secondaryAction.onClick}>
            <secondaryAction.icon className="h-5 w-5" />
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### **Pattern 3 : Confetti Celebration**

```javascript
import confetti from 'canvas-confetti';

// Simple burst
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#a855f7', '#06b6d4', '#ec4899'],
});

// Continuous celebration (5 secondes)
const end = Date.now() + 5000;
const interval = setInterval(() => {
  if (Date.now() > end) return clearInterval(interval);

  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
  });
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
  });
}, 200);
```

### 6. Processus Étape par Étape (Exemple : AssetsLibraryModal)

#### **Phase 1 : Dépendances**
```bash
npm install sonner canvas-confetti
```

#### **Phase 2 : Hook `useAssetUpload`**
📁 `src/components/modals/AssetsLibraryModal/hooks/useAssetUpload.js`

```javascript
export function useAssetUpload({ category, onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = useCallback(async (files) => {
    const formData = new FormData();
    formData.append('category', category);
    files.forEach(file => formData.append('files', file));

    const response = await fetch('http://localhost:3001/api/assets/upload', {
      method: 'POST',
      body: formData,
    });

    toast.success(`${uploaded.length} fichier(s) uploadé(s) !`, {
      action: { label: 'Annuler', onClick: () => {...} }
    });

    if (isFirstUpload || uploaded.length >= 5) {
      confetti({ particleCount: 100, colors: ['#a855f7', '#06b6d4'] });
    }
  }, [category]);

  return { uploadFiles, isUploading, progress };
}
```

#### **Phase 3 : Composant `UploadZone`**
📁 `src/components/modals/AssetsLibraryModal/components/UploadZone.jsx`

```jsx
export function UploadZone({ category, compact = false }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { uploadFiles, isUploading, progress } = useAssetUpload({ category });

  if (compact) {
    return <Button variant="gaming-accent" size="sm">
      <Upload className="h-3 w-3" /> Upload
    </Button>;
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl hover:border-purple-500",
        isDragActive && "border-cyan-400 bg-cyan-400/10 scale-[1.02]"
      )}
      onDrop={handleDrop}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
        {isDragActive ? <Sparkles /> : <ImageIcon />}
      </div>

      {isUploading && (
        <div className="h-2 bg-slate-700 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

#### **Phase 4 : Composant `EmptyAssetState`**
📁 `src/components/modals/AssetsLibraryModal/components/EmptyAssetState.jsx`

```jsx
const CATEGORY_ILLUSTRATIONS = {
  background: {
    emoji: '🏞️',
    title: 'Aucun arrière-plan pour le moment',
    description: 'Les arrière-plans donnent vie à vos scènes...',
  },
  // ...
};

export function EmptyAssetState({ category, onUploadClick }) {
  const config = CATEGORY_ILLUSTRATIONS[category];

  return (
    <div className="text-center">
      <div className="text-8xl mb-6 animate-bounce-slow">
        {config.emoji}
      </div>
      <Button variant="gaming-primary" onClick={onUploadClick}>
        <Upload className="h-5 w-5" /> Uploader mes fichiers
      </Button>
    </div>
  );
}
```

#### **Phase 5 : Hook `useFavorites`**
📁 `src/components/modals/AssetsLibraryModal/hooks/useFavorites.js`

```javascript
export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem('accesscity-favorite-assets');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('accesscity-favorite-assets', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((assetUrl) => {
    setFavorites(prev =>
      prev.includes(assetUrl)
        ? prev.filter(url => url !== assetUrl)
        : [...prev, assetUrl]
    );
  }, []);

  return { favorites, toggleFavorite, isFavorite };
}
```

### 7. Composants Réutilisables Créés

| Composant | Fichier | Usage |
|-----------|---------|-------|
| **UploadZone** | `components/UploadZone.jsx` | Zone d'upload drag & drop (compact/full) |
| **EmptyAssetState** | `components/EmptyAssetState.jsx` | États vides avec emoji animé |
| **useAssetUpload** | `hooks/useAssetUpload.js` | Upload avec progress, toasts, confetti |
| **useFavorites** | `hooks/useFavorites.js` | Favoris avec localStorage |

---

## 🔧 Procédures Techniques

### Structure Projet

```
AccessCity-Phase3-FINAL/
├── src/
│   ├── components/
│   │   ├── modals/
│   │   │   └── AssetsLibraryModal/
│   │   │       ├── components/
│   │   │       │   ├── UploadZone.jsx
│   │   │       │   └── EmptyAssetState.jsx
│   │   │       ├── hooks/
│   │   │       │   ├── useAssetUpload.js
│   │   │       │   └── useFavorites.js
│   │   │       ├── AssetsLibraryModal.jsx
│   │   │       └── README.md
│   │   └── ui/
│   │       └── button.jsx
│   ├── index.css          # Animations globales
│   └── App.jsx            # Toaster provider
├── server/
│   └── index.js           # Express upload server
├── docs/
│   ├── CONTINUATION_CONTEXT.md (ce fichier)
│   ├── START_HERE.md
│   ├── GAMING_UI_GUIDELINES.md (archivé)
│   └── ARCHIVED_NOEL_INSTRUCTIONS.md
└── package.json
```

### Commandes Importantes

```bash
# Lancer les 2 serveurs (Vite + Express)
npm run dev

# Serveur frontend seul
npm run dev:vite    # Port 5173

# Serveur upload seul
npm run dev:server  # Port 3001

# Générer manifest assets
node tools/generate-assets-manifest.js

# Installer dépendances gaming
npm install sonner canvas-confetti
```

### Stack Technique

- **Frontend** : React 18 + Vite 7.2.4
- **Backend** : Express + Multer (upload multi-fichiers)
- **Styling** : Tailwind CSS + CSS Modules
- **UI Gaming** : sonner (toasts) + canvas-confetti
- **Icons** : Lucide React

### Git Branches

- **Branche actuelle** : `v6.0-restore-full-project-v2`
- **Main branch** : `main`

### Points d'Attention

1. **Toujours lancer les 2 serveurs** (Vite 5173 + Express 3001)
2. **FormData avec 'files'** (pluriel) pour upload multiple
3. **LocalStorage** pour persistence (favoris, première upload)
4. **Toaster provider** doit être dans App.jsx
5. **Animations dans index.css** pour réutilisation globale

---

## 🎯 Prochaines Étapes

### Option A : Continuer AssetsLibraryModal (Phases 3-5)

#### **Phase 3 : WCAG 2.2 Compliance**
- [ ] Upgrade focus rings à `ring-4` (3:1 contrast ratio)
- [ ] Navigation clavier complète (flèches, Ctrl+F)
- [ ] Tests avec lecteur d'écran (NVDA/JAWS)

#### **Phase 4 : Bulk Actions**
- [ ] Composant `BulkActionsBar` sticky
- [ ] Sélection multiple avec Shift+Click
- [ ] Undo toast pour suppressions groupées

#### **Phase 5 : Onboarding Tour (Optionnel)**
- [ ] Installation `react-joyride`
- [ ] Composant `OnboardingTour`
- [ ] Tour en 5 étapes : Upload → Search → Filters → Favorites → Bulk

### Option B : Appliquer Gaming UI à D'Autres Composants

**Composants candidats** :
- CharacterEditorModal
- ScenePropertiesPanel
- DialogueEditor
- ExportPanel

**Processus** :
1. Lire la checklist de gamification (section 4)
2. Appliquer palette couleurs + animations
3. Ajouter empty states + feedbacks
4. Tester accessibilité

### Option C : Refonte UI/UX Complète

Consulter `ARCHIVED_NOEL_INSTRUCTIONS.md` pour les specs complètes :
- Design tokens
- Architecture 4 zones
- Dialogue graph (ReactFlow)
- Shortcuts clavier

---

## 📚 Références

### Documentation Interne

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| [START_HERE.md](START_HERE.md) | Point d'entrée général du projet | Première session, vue d'ensemble |
| [CONTINUATION_CONTEXT.md](CONTINUATION_CONTEXT.md) | Ce fichier - Reprise de session | Reprendre le travail gaming UI |
| [ARCHIVED_NOEL_INSTRUCTIONS.md](ARCHIVED_NOEL_INSTRUCTIONS.md) | Specs refonte UI/UX complète (8 tâches) | Refonte architecture globale |
| [AssetsLibraryModal/README.md](../src/components/modals/AssetsLibraryModal/README.md) | Doc technique AssetsLibraryModal | Détails techniques upload |

### Librairies Externes

- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- [canvas-confetti](https://www.kirilv.com/canvas-confetti/) - Confetti animations
- [Lucide React](https://lucide.dev/) - Icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

### Design Inspirations

- **Unity Editor** : Content Browser, Inspector panels
- **Roblox Studio** : Asset Library, Properties
- **GDevelop** : Object editor, Events system
- **Figma** : Layers panel, Components library

### Articles & Standards

- [Material Design Motion](https://m3.material.io/styles/motion)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Gaming UI Best Practices](https://www.gamedeveloper.com/design/ui-design-best-practices)

---

## 💬 Instructions pour l'IA Suivante

### Message de Reprise

> "Lis **CONTINUATION_CONTEXT.md** pour comprendre l'état actuel du projet AccessCity Studio.
>
> **Contexte rapide** :
> - Phase 2 AssetsLibraryModal complétée (gaming UI/UX)
> - Serveurs : `npm run dev` (Vite 5173 + Express 3001)
> - Gaming UI : checklist section 4, patterns section 5
>
> **Pour gamifier un nouveau composant** : Suis la checklist (section 4) et patterns (section 5).
>
> **Pour refonte UI/UX** : Consulte ARCHIVED_NOEL_INSTRUCTIONS.md"

### Raccourcis Utiles

```bash
# Tout lancer d'un coup
npm run dev

# Accéder à l'app
http://localhost:5173

# Voir les composants gaming créés
ls src/components/modals/AssetsLibraryModal/
```

---

**📅 Dernière mise à jour** : 28 décembre 2025
**✍️ Auteur** : Claude Sonnet 4.5
**📌 Version** : 6.0 - AssetsLibraryModal Redesign Phase 2 Complete
**🎮 Status** : Gaming UI opérationnel, prêt pour expansion
