# Guide de Migration TailwindCSS v3 → v4

## Status Actuel
- **Version actuelle** : 3.4.19
- **Version cible** : 4.x
- **Risque** : MOYEN (breaking changes)
- **Effort estimé** : 2-3 jours

---

## Avantages de la v4

1. **Build 10x plus rapide** - Nouveau moteur Oxide
2. **Configuration CSS-first** - Plus besoin de `tailwind.config.js`
3. **Syntaxe simplifiée** - Moins de configuration
4. **Meilleure DX** - Autocomplete amélioré

---

## Breaking Changes Majeurs

### 1. Configuration CSS au lieu de JS

**Avant (v3)** - `tailwind.config.js` :
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
};
```

**Après (v4)** - Dans le CSS :
```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
}
```

### 2. Changements de Classes

| v3 | v4 |
|----|-----|
| `bg-opacity-50` | `bg-black/50` |
| `text-opacity-75` | `text-white/75` |
| `ring-opacity-50` | `ring-blue-500/50` |

### 3. Navigateurs Supportés

**v4 ne supporte PAS** :
- Internet Explorer
- Anciens navigateurs sans support CSS natif

---

## Étapes de Migration

### Étape 1 : Exécuter l'outil de migration

```bash
npx @tailwindcss/upgrade@next
```

Cet outil va :
- Convertir `tailwind.config.js` → CSS `@theme`
- Mettre à jour les classes dépréciées
- Identifier les incompatibilités

### Étape 2 : Mettre à jour les imports CSS

**Avant** :
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Après** :
```css
@import "tailwindcss";
```

### Étape 3 : Migrer les plugins

Vérifier la compatibilité de :
- `tailwindcss-animate` (utilisé dans le projet)
- Plugins Radix UI

### Étape 4 : Tester l'application

1. Vérifier toutes les pages visuellement
2. Tester les animations
3. Vérifier le responsive design
4. Tester le dark mode

---

## Fichiers à Modifier

1. `tailwind.config.js` → Supprimer ou convertir
2. `src/index.css` → Mettre à jour les imports
3. `postcss.config.js` → Peut nécessiter des ajustements
4. Composants avec classes `*-opacity-*`

---

## Recommandation

**Attendre la stabilisation de la v4** avant de migrer en production.

La v4 est récente et certains plugins/outils ne sont pas encore compatibles.

Planifier la migration pour une période avec peu de développement actif.

---

## Ressources

- [TailwindCSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [What's New in Tailwind v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Migration Tool](https://github.com/tailwindlabs/tailwindcss/tree/next/packages/upgrade)
