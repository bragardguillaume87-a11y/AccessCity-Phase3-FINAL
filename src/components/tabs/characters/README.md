# Characters Tab - Architecture refactorisée

## 📁 Structure des fichiers

```
src/components/tabs/characters/
├── CharactersTab.jsx           # Composant principal (layout 3 panneaux)
├── CharactersTab.module.css    # Styles CSS modules
├── index.js                    # Point d'entrée (exports)
│
├── panels/                     # Les 3 panneaux principaux
│   ├── CharactersExplorer.jsx  # Panneau gauche (liste)
│   ├── CharacterEditor.jsx     # Modal d'édition
│   └── CharacterProperties.jsx # Panneau droit (propriétés)
│
├── components/                 # Composants réutilisables
│   ├── CharacterCard.jsx       # Carte de personnage
│   └── AvatarPicker.jsx        # Sélecteur d'avatar
│
└── hooks/                      # Logique métier
    ├── useCharacters.js        # CRUD des personnages
    └── useCharacterValidation.js # Validation des données
```

## 🎯 Architecture 3 panneaux

### 1. **Panneau Gauche** - CharactersExplorer
- Liste tous les personnages triés alphabétiquement
- Bouton "Nouveau" en haut
- Chaque personnage affiche:
  - Nom
  - Badge "SYSTÈME" pour les personnages protégés
  - Aperçu des avatars (3 premiers)
  - Actions: Dupliquer, Supprimer
- Sélection d'un personnage pour voir les détails

### 2. **Panneau Central** - Prévisualisation
- Affiche les détails du personnage sélectionné:
  - Nom en grand titre
  - Bouton "Éditer"
  - Grille de tous les avatars par humeur
  - Description complète
- Placeholder si aucun personnage sélectionné

### 3. **Panneau Droit** - CharacterProperties
- Propriétés techniques:
  - ID (monospace)
  - Nom
  - Description
  - Humeurs disponibles
  - Nombre d'avatars
- Statistiques d'utilisation:
  - Nombre de scènes où le personnage apparaît
  - Nombre total de répliques
- Badge d'avertissement pour les personnages système

### 4. **Modal** - CharacterEditor
- S'ouvre pour créer/éditer un personnage
- Formulaire complet:
  - Nom (requis, avec validation)
  - Description (optionnel, max 500 caractères)
  - Sélecteur d'humeurs (onglets)
  - AvatarPicker pour chaque humeur
- Validation en temps réel
- Boutons: Annuler / Enregistrer

## 🔧 Hooks personnalisés

### `useCharacters()`
Encapsule toute la logique CRUD des personnages.

**Retourne:**
```javascript
{
  characters,           // Liste des personnages
  createCharacter,      // () => string (ID du nouveau personnage)
  duplicateCharacter,   // (id) => string | null
  removeCharacter,      // (id) => { success, error? }
  updateCharacter       // (character) => void
}
```

**Fonctionnalités:**
- ✅ Crée un personnage avec valeurs par défaut
- ✅ Duplique un personnage existant
- ✅ Supprime avec validation (protège les personnages système)
- ✅ Met à jour un personnage

### `useCharacterValidation(allCharacters, currentCharacter)`
Fournit des fonctions de validation réutilisables.

**Retourne:**
```javascript
{
  validateName,         // (name) => string[] (erreurs)
  validateDescription,  // (desc) => string[]
  validateAll          // (character) => { isValid, errors }
}
```

**Règles de validation:**
- Nom: obligatoire, 2-50 caractères, unique
- Description: max 500 caractères

## 🎨 Composants réutilisables

### `CharacterCard`
Carte affichée dans la liste (panneau gauche).

**Props:**
```javascript
{
  character,      // Objet personnage
  isSelected,     // Boolean
  onSelect,       // () => void
  onDuplicate,    // () => void
  onDelete,       // () => void
  labels          // Traductions
}
```

### `AvatarPicker`
Sélecteur d'avatar avec grille d'assets.

**Props:**
```javascript
{
  currentSprites, // { [mood]: url }
  onSelect,       // (mood, url) => void
  mood,           // Humeur active
  labels          // Traductions
}
```

**Fonctionnalités:**
- ✅ Affiche l'avatar actuel avec bouton "Retirer"
- ✅ Barre de recherche
- ✅ Section "Récents" (6 derniers utilisés)
- ✅ Grille de tous les avatars disponibles
- ✅ Gestion du cache localStorage

## 📝 CSS Modules

Le fichier `CharactersTab.module.css` utilise des CSS Modules pour éviter les conflits de noms.

**Classes principales:**
- `.container` - Layout flex 3 panneaux
- `.main` - Panneau central
- `.details` - Conteneur des détails
- `.detailsHeader` - En-tête avec bouton éditer
- `.avatarPreview` - Grille d'avatars
- `.avatarItem` - Carte d'avatar
- `.description` - Bloc de description
- `.placeholder` - État vide

**Responsive:**
- Tablette (< 1024px): Layout vertical
- Mobile (< 768px): Optimisations d'espacement

## 🔗 Intégration

### Import depuis d'autres composants

```javascript
// Méthode 1: Import direct
import { CharactersTab } from './tabs/characters/CharactersTab.jsx';

// Méthode 2: Via l'index
import { CharactersTab } from './tabs/characters';
```

### Utilisation

```javascript
<CharactersTab scenes={scenes} />
```

**Props:**
- `scenes` (array, optionnel): Liste des scènes pour les statistiques

## 🌍 Internationalisation

Le composant utilise `react-i18next` pour les traductions.

**Namespace:** `'characters'`

**Clés utilisées:**
- `characters` - "Personnages"
- `new` - "Nouveau"
- `noCharacters` - "Aucun personnage"
- `editCharacter` - "Éditer le personnage"
- `save` - "Enregistrer"
- `cancel` - "Annuler"
- `name` - "Nom"
- `description` - "Description"
- `properties` - "Propriétés"
- `selectCharacter` - "Sélectionnez un personnage"
- `edit` - "Éditer"

## ✅ Tests

Pour tester l'architecture:

```bash
npm run build:vite  # Vérifie les erreurs de build
npm run dev         # Lance le serveur de développement
```

## 🔄 Migration depuis l'ancienne architecture

**Fichiers concernés:**
- ❌ `src/components/CharactersTab.jsx` (ancien, backup créé)
- ❌ `src/components/CharactersPanel.jsx` (ancien, à supprimer après migration)
- ❌ `src/components/CharacterEditor.jsx` (ancien, à supprimer après migration)

**Fichiers remplacés:**
- ✅ `src/components/tabs/characters/` (nouvelle architecture)

## 📚 Dépendances

**Hooks externes:**
- `useApp()` - AppContext (CRUD des personnages)
- `useTranslation()` - react-i18next (i18n)
- `useAssets()` - hooks/useAssets.js (assets)

**Utilitaires:**
- `getRecentAssets()` - Récupère les assets récents
- `addToRecentAssets()` - Ajoute un asset aux récents

## 🐛 Débogage

**Points de vigilance:**
1. Les personnages système (`player`, `narrator`) sont protégés
2. La validation empêche les doublons de noms
3. Les assets récents sont stockés dans `localStorage`
4. Le CSS Module nécessite l'import du fichier `.module.css`

**Problèmes courants:**
- **Avatar ne s'affiche pas:** Vérifier le chemin dans `assets-manifest.json`
- **Erreur de validation:** Vérifier la logique dans `useCharacterValidation`
- **Import manquant:** Vérifier que tous les fichiers existent dans `tabs/characters/`

## 🎯 Prochaines étapes

- [ ] Supprimer les anciens fichiers après confirmation
- [ ] Ajouter des tests unitaires pour les hooks
- [ ] Améliorer l'accessibilité (ARIA labels)
- [ ] Ajouter le support du drag & drop pour réorganiser
- [ ] Implémenter l'édition inline du nom
