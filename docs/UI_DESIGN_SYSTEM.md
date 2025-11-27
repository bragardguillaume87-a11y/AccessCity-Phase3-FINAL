# Design System AccessCity 5.0

## Vue d'ensemble

Ce document décrit les jetons de design (tokens), composants et patterns utilisés dans l'interface vanilla d'AccessCity. L'objectif est de maintenir une cohérence visuelle et d'accélérer le développement futur.

---

## 🎨 Palette de couleurs

### Fonds
- `--color-bg-primary`: #1e1e1e (fond principal)
- `--color-bg-secondary`: #252526 (panneaux)
- `--color-bg-tertiary`: #1a1a1a (DevTools)
- `--color-bg-elevated`: #333 (éléments surélevés, navigation)

### Surfaces & Bordures
- `--color-surface`: #2d2d30 (items, cartes)
- `--color-border`: #3e3e42 (séparateurs légers)
- `--color-border-strong`: #555 (bordures visibles)

### Texte
- `--color-text-primary`: #e0e0e0 (texte principal)
- `--color-text-secondary`: #cccccc (titres, labels)
- `--color-text-muted`: #aaa (texte désactivé)

### Accents & États
- `--color-accent`: #0e639c (bleu principal)
- `--color-accent-hover`: #1177bb
- `--color-accent-active`: #094771
- `--color-danger`: #dc3545 (erreurs, suppression)
- `--color-success`: #4CAF50
- `--color-warning`: #ff9800

---

## 📏 Espacements

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 12px
--space-lg: 16px
--space-xl: 24px
```

**Usage** : marges internes (padding), marges externes (margin), gaps dans les grilles/flex.

---

## 🔲 Rayons (border-radius)

```css
--radius-sm: 4px   /* boutons, inputs */
--radius-md: 6px   /* cartes, modales */
--radius-lg: 8px   /* containers larges */
```

---

## 🌑 Ombres

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.3)    /* survol léger */
--shadow-md: 0 4px 12px rgba(0,0,0,0.4)   /* boutons, cartes */
--shadow-lg: 0 8px 24px rgba(0,0,0,0.5)   /* modales, overlays */
```

---

## ⏱ Transitions

```css
--transition-fast: 150ms ease   /* micro-interactions */
--transition-base: 250ms ease   /* animations standard */
```

---

## 🧩 Composants réutilisables

### `.panel`
Conteneur de base pour les sections (SceneList, Inspector, DevTools).

**Propriétés** :
- `background: var(--color-bg-secondary)`
- `padding: var(--space-md)`
- `overflow-y: auto`

### `.scene-item`, `.dialogue-item`
Items cliquables dans les listes.

**États** :
- Hover : `background: var(--color-bg-elevated)`, léger décalage
- Active : `background: var(--color-accent)`
- Focus : `outline: 2px solid var(--color-accent)`

### `button`
Boutons d'action standardisés.

**Variantes possibles** (à implémenter au besoin) :
- `.btn-primary` (accent)
- `.btn-danger` (suppression)
- `.btn-secondary` (neutre)

---

## 📐 Grille principale

L'interface utilise **CSS Grid** pour le layout principal :

```css
#app {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1px;
}
```

- Colonne 1 : `#scene-list` (largeur fixe/auto)
- Colonne 2 : `#inspector` (flex: 1)
- Colonne 3 : `#devtools` (largeur fixe/auto)

---

## ♿ Accessibilité

- **Focus visible** : tous les éléments interactifs ont un `outline` de 2px avec `--color-accent`.
- **Contraste** : respecte WCAG AA (minimum 4.5:1 pour texte normal).
- **Clavier** : navigation via Tab/Shift+Tab, Échap pour quitter le mode lecture.

---

## 🔧 Maintenance

Pour modifier la palette ou les espacements :
1. Éditer les variables CSS dans `:root` (`index.html`, section `<style>`).
2. Appliquer automatiquement partout grâce aux `var(--token-name)`.
3. Tester visuellement avec les différents presets de disposition (standard, accessibility, devtools, etc.).

---

## 📦 Extension future

Si migration vers React/Vue/autre framework :
- Extraire les tokens dans un fichier `tokens.css` séparé.
- Créer des composants réutilisables (`Button.jsx`, `Panel.jsx`, etc.) appliquant ces tokens.
- Conserver la même palette pour cohérence visuelle.

---

## 🧱 Calques (z-index)

Pour éviter les conflits d’empilement et garantir la lisibilité des éléments flottants, nous utilisons des classes sémantiques `.layer-*` au lieu de valeurs `z-*` éparses.

### Règles
- Ne pas assigner `position: relative` dans `.layer-*` (les composants gèrent leur positionnement).
- Éviter de mixer `.layer-*` avec des classes Tailwind `z-*`.
- Attention aux nouveaux stacking contexts (ex: `transform`, `filter`, `opacity < 1`) sur des conteneurs parents.

### Classes utilitaires
```css
.layer-10 { z-index: 10; }
.layer-20 { z-index: 20; }
.layer-30 { z-index: 30; }
.layer-40 { z-index: 40; }
.layer-50 { z-index: 50; }
```

### Carte des calques (recommandation)
- Contenu de base (décor, texte non flottant) : défaut (sans classe)
- Personnages / portraits : `layer-10`
- Boîte de dialogue : `layer-20`
- HUD (état du joueur) : `layer-40`
- Badges delta variables : `layer-50`
- Overlays / modales / toasts : `layer-50`

### Exemples d’application
- PlayerMode: bouton Quitter (`layer-50`), HUD (`layer-40`), badges delta (`layer-50`)
- Modales (Onboarding, CharacterEditor): conteneur fixe en `layer-50`, focus initial, `aria-modal` et verrouillage scroll
- StageDirector: bouton quitter en `layer-50` (remplacer `z-index` inline)

Ces conventions améliorent la robustesse visuelle et simplifient la maintenance.
