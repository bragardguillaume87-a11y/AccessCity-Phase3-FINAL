# 🎮 Gaming UI/UX Guidelines - AccessCity Studio

> **Guide de référence pour créer des interfaces gaming engageantes**
> Inspiré par Unity Editor, Roblox Studio, GDevelop (2025)
> Audience : 10-16 ans | Thème : Accessibilité & Éducation

---

## 📋 Table des matières

1. [Principes de Design Gaming](#principes-de-design-gaming)
2. [Palette de Couleurs](#palette-de-couleurs)
3. [Animations & Feedback](#animations--feedback)
4. [Cas d'Usage : AssetsLibraryModal Upload](#cas-dusage--assetslibrarymodal-upload)
5. [Checklist de Gamification](#checklist-de-gamification)
6. [Composants Réutilisables](#composants-réutilisables)
7. [Patterns de Code](#patterns-de-code)

---

## 🎯 Principes de Design Gaming

### 1. **Feedback Immédiat & Célébrations**
- Chaque action utilisateur doit avoir un feedback visuel/sonore
- Les **premières réussites** déclenchent des célébrations (confetti, animations)
- Progression visible en temps réel (barres, pourcentages)

### 2. **Empty States Engageants**
- Jamais d'écran vide sans appel à l'action
- Emoji/illustrations animées pour personnaliser
- 2-3 CTAs clairs avec hiérarchie visuelle
- Messages positifs et encourageants

### 3. **Hover States & Micro-interactions**
- `scale-105` ou `scale-110` au hover
- `translateY(-2px)` pour effet "lift"
- Transitions à `200-300ms cubic-bezier(0.4, 0, 0.2, 1)`
- Shadows multicouches pour profondeur

### 4. **Accessibilité WCAG 2.2**
- Focus rings visibles : `ring-4` minimum (3:1 contrast ratio)
- Labels aria sur tous les boutons
- Navigation clavier complète
- Support reduced-motion

---

## 🎨 Palette de Couleurs

### Couleurs Primaires (Brand)
```css
--purple-500: #a855f7   /* Actions principales, gradients */
--cyan-500: #06b6d4     /* Accents, highlights */
--pink-500: #ec4899     /* Confetti, accents secondaires */
```

### Couleurs Fonctionnelles
```css
--amber-500: #f59e0b    /* Favoris, étoiles */
--green-500: #10b981    /* Succès, validation */
--red-500: #ef4444      /* Erreurs, suppressions */
--slate-700: #334155    /* Backgrounds cards */
--slate-400: #94a3b8    /* Texte secondaire */
```

### Gradients Gaming
```css
/* Primary gradient (boutons, headers) */
background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);

/* Accent gradient (hover states) */
background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);

/* Progress bars */
background: linear-gradient(90deg, #a855f7 0%, #06b6d4 100%);
```

---

## ✨ Animations & Feedback

### Animations Définies dans `src/index.css`

#### 1. **Bounce Slow** (Empty States)
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

#### 2. **Magnetic Lift** (Cards hover)
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

#### 3. **Shimmer** (Loading states)
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

#### 4. **Shake Error** (Validation)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
.shake-error {
  animation: shake 400ms ease-in-out;
}
```
**Usage** : Champs invalides

---

## 📦 Cas d'Usage : AssetsLibraryModal Upload

### Objectif
Créer une expérience d'upload engageante avec feedback visuel, célébrations et design gaming.

### Processus Étape par Étape

#### **PHASE 1 : Installation des dépendances**

```bash
npm install sonner canvas-confetti
```

- **sonner** : Toast notifications modernes (gaming-friendly)
- **canvas-confetti** : Animations confetti pour célébrations

#### **PHASE 2 : Création du hook `useAssetUpload`**

📁 `src/components/modals/AssetsLibraryModal/hooks/useAssetUpload.js`

**Fonctionnalités** :
- Progress tracking (0-100%)
- FormData upload avec `fetch`
- Toast notifications avec actions (Annuler)
- Confetti au premier upload OU si 5+ fichiers
- LocalStorage pour tracker première upload

**Code clé** :
```javascript
export function useAssetUpload({ category, onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = useCallback(async (files) => {
    // FormData + progress simulation
    const formData = new FormData();
    formData.append('category', category);
    files.forEach(file => formData.append('files', file));

    // Fetch vers Express server
    const response = await fetch('http://localhost:3001/api/assets/upload', {
      method: 'POST',
      body: formData,
    });

    // Toast avec undo
    toast.success(`${uploaded.length} fichier(s) uploadé(s) !`, {
      action: { label: 'Annuler', onClick: () => {...} }
    });

    // Confetti si première fois
    if (isFirstUpload || uploaded.length >= 5) {
      confetti({ particleCount: 100, colors: ['#a855f7', '#06b6d4'] });
    }
  }, [category]);

  return { uploadFiles, isUploading, progress };
}
```

#### **PHASE 3 : Création du composant `UploadZone`**

📁 `src/components/modals/AssetsLibraryModal/components/UploadZone.jsx`

**Modes** :
- **Compact** : Petit bouton pour mode sélection
- **Full** : Grande drop zone avec drag & drop

**Fonctionnalités** :
- Drag & drop avec animations
- Validation type de fichier (images uniquement)
- État `isDragActive` avec scale-110 rotate-6
- Progress bar avec gradient
- Gaming aesthetics (purple/cyan)

**Code clé** :
```jsx
export function UploadZone({ category, compact = false }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { uploadFiles, isUploading, progress } = useAssetUpload({ category });

  if (compact) {
    return (
      <Button variant="gaming-accent" size="sm">
        <Upload className="h-3 w-3" /> Upload
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl",
        "hover:border-purple-500 hover:bg-purple-500/5",
        isDragActive && "border-cyan-400 bg-cyan-400/10 scale-[1.02]"
      )}
      onDrop={handleDrop}
    >
      {/* Icon avec animation */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
        {isDragActive ? <Sparkles className="animate-pulse" /> : <ImageIcon />}
      </div>

      {/* Progress bar */}
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

#### **PHASE 4 : Création du composant `EmptyAssetState`**

📁 `src/components/modals/AssetsLibraryModal/components/EmptyAssetState.jsx`

**Fonctionnalités** :
- Config par catégorie (emoji, titre, description)
- 3 CTAs : Upload, Charger exemples, En savoir plus
- Emoji animé avec `animate-bounce-slow`
- Hints en bas (formats, taille max)

**Code clé** :
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
      {/* Emoji animé */}
      <div className="text-8xl mb-6 animate-bounce-slow">
        {config.emoji}
      </div>

      {/* CTAs */}
      <Button variant="gaming-primary" onClick={onUploadClick}>
        <Upload className="h-5 w-5" /> Uploader mes fichiers
      </Button>
      <Button variant="gaming-accent">
        <Sparkles className="h-5 w-5" /> Charger des exemples
      </Button>
    </div>
  );
}
```

#### **PHASE 5 : Hook `useFavorites`**

📁 `src/components/modals/AssetsLibraryModal/hooks/useFavorites.js`

**Fonctionnalités** :
- LocalStorage persistence
- `toggleFavorite(assetUrl)`
- `isFavorite(assetUrl)`

**Code clé** :
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

#### **PHASE 6 : Intégration dans `AssetsLibraryModal.jsx`**

**Modifications** :
1. Import des nouveaux composants
2. Ajout du hook `useFavorites`
3. UploadZone toujours visible (compact en mode sélection)
4. EmptyAssetState quand 0 assets
5. Bouton étoile sur chaque thumbnail
6. Filtre "Favoris" dans les smart filters

**Code clé** :
```jsx
// Imports
import { UploadZone } from './AssetsLibraryModal/components/UploadZone.jsx';
import { EmptyAssetState } from './AssetsLibraryModal/components/EmptyAssetState.jsx';
import { useFavorites } from './AssetsLibraryModal/hooks/useFavorites.js';

// Hook
const { favorites, toggleFavorite, isFavorite } = useFavorites();

// Upload zone (toujours visible)
{isSelectionMode ? (
  <UploadZone category={activeCategory} compact={true} />
) : (
  <UploadZone category={activeCategory} compact={false} />
)}

// Empty state
{filteredAssets.length === 0 && (
  <EmptyAssetState category={activeCategory} onUploadClick={...} />
)}

// Bouton favoris sur thumbnail
<button onClick={() => toggleFavorite(asset.path)}>
  <Star className={isFavorite(asset.path) ? 'fill-current' : ''} />
</button>

// Filtre favoris
<Button variant={activeCategory === 'favorites' ? 'default' : 'outline'}>
  <Star /> Favoris <Badge>{favorites.length}</Badge>
</Button>
```

#### **PHASE 7 : Configuration serveur Express**

📁 `server/index.js`

**Modifications** :
```javascript
// Changer de upload.single à upload.array
app.post('/api/assets/upload', upload.array('files', 20), async (req, res) => {
  const uploadedFiles = req.files.map(file => ({
    filename: file.filename,
    path: `/assets/${category}/${file.filename}`,
  }));

  res.json({
    success: true,
    files: uploadedFiles,
    count: uploadedFiles.length,
  });
});
```

#### **PHASE 8 : Configuration Toaster dans `App.jsx`**

```jsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={5000}
        theme="dark"
      />
      {/* App content */}
    </>
  );
}
```

---

## ✅ Checklist de Gamification (Nouveaux Composants)

### 🎨 Design Visuel
- [ ] **Palette gaming** : Utiliser purple-500, cyan-500, pink-500
- [ ] **Gradients** : Au moins 1 gradient sur bouton principal
- [ ] **Shadows multicouches** : `shadow-depth-md` ou équivalent
- [ ] **Border radius** : `rounded-xl` minimum pour cards

### ✨ Animations & Interactions
- [ ] **Hover state** : Scale-105 + translateY(-2px) + shadow
- [ ] **Active state** : Scale-95 pour feedback tactile
- [ ] **Transitions** : 200-300ms cubic-bezier
- [ ] **Empty state** : Emoji/illustration animée (bounce, pulse)

### 🔊 Feedback Utilisateur
- [ ] **Toast notifications** : Sonner pour succès/erreurs
- [ ] **Progress tracking** : Barre ou spinner pour actions > 500ms
- [ ] **Célébrations** : Confetti pour milestones (première réussite, bulk actions)
- [ ] **Undo capability** : Bouton "Annuler" dans toasts (5s window)

### ♿ Accessibilité
- [ ] **Focus rings** : `ring-4` avec contraste 3:1
- [ ] **Aria labels** : Sur tous les boutons d'icônes
- [ ] **Keyboard navigation** : Tab, Enter, Escape
- [ ] **Reduced motion** : Support via prefers-reduced-motion

### 📦 Architecture Code
- [ ] **Hooks customs** : Extraire logique réutilisable
- [ ] **Props drilling** : Éviter en faveur de hooks/context
- [ ] **TypeScript props** (si applicable) : PropTypes clairs
- [ ] **Memoization** : useMemo/useCallback pour listes

---

## 🧩 Composants Réutilisables

### Créés pour AssetsLibraryModal

| Composant | Fichier | Usage |
|-----------|---------|-------|
| **UploadZone** | `components/UploadZone.jsx` | Zone d'upload avec drag & drop, compact ou full |
| **EmptyAssetState** | `components/EmptyAssetState.jsx` | États vides engageants avec emoji animé |
| **useAssetUpload** | `hooks/useAssetUpload.js` | Upload avec progress, toasts, confetti |
| **useFavorites** | `hooks/useFavorites.js` | Gestion favoris avec localStorage |

### À Créer (Futures Phases)

| Composant | Usage |
|-----------|-------|
| **BulkActionsBar** | Barre sticky pour actions groupées (sélection multiple) |
| **OnboardingTour** | Tour guidé avec react-joyride |
| **ProgressCard** | Card avec barre de progression et stats |
| **AchievementBadge** | Badge de réussite avec animation pop-in |

---

## 💻 Patterns de Code

### 1. **Hook Custom avec Progress**

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

### 2. **Composant Empty State**

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

### 3. **Button Gaming avec Variantes**

```jsx
// Dans components/ui/button.jsx
const buttonVariants = {
  'gaming-primary': 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all',
  'gaming-accent': 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all',
};
```

### 4. **Confetti Celebration**

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

---

## 📚 Références

### Design Inspirations
- **Unity Editor** : Content Browser, Inspector panels
- **Roblox Studio** : Asset Library, Properties
- **GDevelop** : Object editor, Events system
- **Figma** : Layers panel, Components library

### Librairies Utilisées
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- [canvas-confetti](https://www.kirilv.com/canvas-confetti/) - Confetti animations
- [Lucide React](https://lucide.dev/) - Icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

### Articles & Resources
- [Material Design Motion](https://m3.material.io/styles/motion)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Gaming UI Best Practices](https://www.gamedeveloper.com/design/ui-design-best-practices)

---

## 🚀 Prochaines Étapes (Roadmap)

### Phase 3 : WCAG 2.2 Compliance
- [ ] Upgrade focus rings à `ring-4`
- [ ] Navigation clavier complète (flèches, Ctrl+F)
- [ ] Tests avec lecteur d'écran (NVDA)

### Phase 4 : Bulk Actions
- [ ] Composant `BulkActionsBar`
- [ ] Sélection multiple avec Shift+Click
- [ ] Undo toast pour suppressions groupées

### Phase 5 : Onboarding
- [ ] Installation `react-joyride`
- [ ] Composant `OnboardingTour`
- [ ] 5 étapes : Upload → Search → Filters → Favorites → Bulk

---

## 📝 Notes pour Futures IA

### Structure Projet
```
src/
  components/
    modals/
      AssetsLibraryModal/
        components/        # Composants UI spécifiques
          UploadZone.jsx
          EmptyAssetState.jsx
        hooks/             # Logique réutilisable
          useAssetUpload.js
          useFavorites.js
        AssetsLibraryModal.jsx
  index.css              # Animations globales
```

### Commandes Importantes
```bash
# Lancer les 2 serveurs (Vite + Express)
npm run dev

# Serveur frontend seul
npm run dev:vite

# Serveur upload seul
npm run dev:server

# Générer manifest assets
node tools/generate-assets-manifest.js
```

### Points d'Attention
1. **Toujours lancer les 2 serveurs** (Vite 5173 + Express 3001)
2. **FormData avec 'files'** (pluriel) pour upload multiple
3. **LocalStorage** pour persistence (favoris, première upload)
4. **Toaster provider** doit être dans App.jsx
5. **Animations dans index.css** pour réutilisation globale

---

**Dernière mise à jour** : 2025-12-28
**Version** : 6.0 (AssetsLibraryModal Redesign - Phase 2 Complete)
**Auteur** : Claude Sonnet 4.5 🤖✨
