# Guide d'Utilisation des Composants UI

Ce guide explique comment utiliser les nouveaux composants UI réutilisables créés pour AccessCity.

---

## 🎨 CollapsibleSection

Composant d'accordéon pour organiser les propriétés et formulaires.

### Import
```jsx
import { CollapsibleSection, CollapsibleGroup, FormField } from './components/ui/CollapsibleSection.jsx';
```

### Usage Basique
```jsx
<CollapsibleSection title="Basic Information" defaultOpen={true}>
  <input type="text" placeholder="Name" />
  <textarea placeholder="Description" />
</CollapsibleSection>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Titre de la section |
| `children` | ReactNode | required | Contenu de la section |
| `defaultOpen` | boolean | false | État initial (ouvert/fermé) |
| `icon` | ReactNode | - | Icône optionnelle dans le header |
| `preview` | string | - | Texte de preview quand collapsed |
| `className` | string | - | Classes CSS custom |
| `headerClassName` | string | - | Classes CSS pour le header |
| `contentClassName` | string | - | Classes CSS pour le contenu |
| `onToggle` | function | - | Callback quand l'état change |

### Exemple Complet
```jsx
<CollapsibleSection
  title="Character Sprites"
  icon="🎨"
  preview={`${Object.keys(sprites).length} moods`}
  defaultOpen={false}
  onToggle={(isOpen) => console.log('Section', isOpen ? 'opened' : 'closed')}
>
  <div className="grid grid-cols-2 gap-4">
    {moods.map(mood => (
      <div key={mood}>
        <label>{mood}</label>
        <AvatarPicker mood={mood} />
      </div>
    ))}
  </div>
</CollapsibleSection>
```

### CollapsibleGroup

Wrapper pour grouper plusieurs sections avec bouton "Expand All".

```jsx
<CollapsibleGroup showExpandAll={true}>
  <CollapsibleSection title="Section 1">...</CollapsibleSection>
  <CollapsibleSection title="Section 2">...</CollapsibleSection>
  <CollapsibleSection title="Section 3">...</CollapsibleSection>
</CollapsibleGroup>
```

### FormField

Composant helper pour champs de formulaire avec label, erreur, et description.

```jsx
<FormField
  label="Character Name"
  htmlFor="char-name"
  error={nameError}
  description="Enter a unique name for this character"
  required
>
  <input
    id="char-name"
    type="text"
    value={name}
    onChange={e => setName(e.target.value)}
  />
</FormField>
```

**Props** :
- `label` : Label du champ
- `htmlFor` : ID de l'input associé
- `error` : Message d'erreur (affiche ⚠️ icon)
- `description` : Texte d'aide
- `required` : Affiche astérisque rouge
- `children` : Input/Select/Textarea

---

## 💾 AutoSaveIndicator

Indicateur visuel de l'état de sauvegarde automatique.

### Import
```jsx
import { AutoSaveIndicator, SaveStatusBadge } from './components/ui/AutoSaveIndicator.jsx';
```

### Usage avec Zustand
```jsx
function PropertiesPanel() {
  const lastSaved = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  return (
    <div>
      {/* Content */}

      {/* Auto-save indicator en bas */}
      <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
    </div>
  );
}
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lastSaved` | Date \| null | null | Timestamp de la dernière sauvegarde |
| `isSaving` | boolean | false | Indique si sauvegarde en cours |
| `error` | string \| null | null | Message d'erreur si échec |
| `onRetry` | function | - | Callback pour bouton Retry |
| `className` | string | - | Classes CSS custom |

### États Automatiques

#### 1. idle (No changes)
```
⚪ No changes
```

#### 2. saving (En cours)
```
💾 Saving... (avec animation pulse)
```

#### 3. saved (Sauvegardé)
```
✓ Saved 3s ago
✓ Saved 1min ago
✓ Saved 2h ago
```

#### 4. error (Échec)
```
⚠️ Save failed [Retry]
```

### SaveStatusBadge

Version compacte pour toolbars/headers.

```jsx
<SaveStatusBadge lastSaved={lastSaved} isSaving={isSaving} />
```

Affiche :
- `Saving` (avec dot animé) si isSaving
- `✓ Saved` si lastSaved existe
- Rien si aucun des deux

---

## 🎮 Button

Composant bouton avec variants et tailles (créé session précédente).

### Import
```jsx
import { Button, PrimaryButton, SecondaryButton, SuccessButton, DangerButton, GhostButton } from './components/ui/Button.jsx';
```

### Usage
```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Save Changes
</Button>

// Ou shortcuts
<PrimaryButton onClick={handleSave}>Save</PrimaryButton>
<DangerButton onClick={handleDelete}>Delete</DangerButton>
<GhostButton onClick={handleCancel}>Cancel</GhostButton>
```

### Variants
- `primary` : Bleu (actions principales)
- `secondary` : Gris foncé
- `success` : Vert (Save, Create)
- `danger` : Rouge (Delete)
- `ghost` : Transparent (Cancel, Close)
- `outline` : Bordure seulement

### Sizes
- `sm` : Petit
- `md` : Moyen (default)
- `lg` : Large

### Props Spéciales
```jsx
<Button
  icon="✨"
  iconPosition="left"
  fullWidth
  disabled={!isValid}
  disabledReason="Please fill all required fields"
>
  Create Character
</Button>
```

**disabledReason** : Affiche un tooltip au hover quand disabled.

---

## 🎴 CharacterCard

Carte de personnage style Nintendo (créé session précédente).

### Import
```jsx
import { CharacterCard, CharacterGrid, EmptyCharacterState } from './components/ui/CharacterCard.jsx';
```

### Usage
```jsx
<CharacterCard
  character={character}
  selected={selectedId === character.id}
  onSelect={() => setSelectedId(character.id)}
  onEdit={() => openEditor(character)}
  onDelete={() => deleteCharacter(character.id)}
  onDrag={handleDrag}
/>
```

### Props
| Prop | Type | Description |
|------|------|-------------|
| `character` | object | Objet personnage `{ id, name, moods, sprites, currentMood }` |
| `selected` | boolean | État sélectionné |
| `onSelect` | function | Callback au clic |
| `onEdit` | function | Callback bouton Edit (✏️) |
| `onDelete` | function | Callback bouton Delete (🗑️) |
| `onDrag` | function | Callback drag & drop |
| `showQuickActions` | boolean | Affiche boutons Edit/Delete au hover |

### CharacterGrid

```jsx
<CharacterGrid cols={4}>
  {characters.map(char => (
    <CharacterCard key={char.id} character={char} />
  ))}
</CharacterGrid>
```

### EmptyCharacterState

```jsx
<EmptyCharacterState onCreateNew={() => openCreateModal()} />
```

---

## 🛠️ Utility : cn()

Fonction pour merger classes Tailwind intelligemment.

### Import
```jsx
import { cn } from './utils/cn.js';
```

### Usage
```jsx
// Conditionnal classes
<div className={cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
)} />

// Merge props className
<button className={cn(
  'px-4 py-2 rounded',
  className // prop from parent
)} />

// Override Tailwind conflicts
cn('px-4', 'px-2') // → 'px-2' (dernier gagne)
cn('text-red-500', 'text-blue-500') // → 'text-blue-500'
```

**Avantage** : twMerge résout les conflits Tailwind automatiquement.

---

## 📋 Patterns d'Utilisation

### Pattern 1 : Properties Panel avec Sections

```jsx
function MyPropertiesPanel({ selectedItem }) {
  const updateItem = useMyStore(state => state.updateItem);
  const lastSaved = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4">
        <h3>Item Properties</h3>
      </div>

      {/* Content avec sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <CollapsibleSection title="Basic Info" defaultOpen={true}>
          <FormField label="Name" required>
            <input value={selectedItem.name} onChange={...} />
          </FormField>
          <FormField label="Description">
            <textarea value={selectedItem.description} onChange={...} />
          </FormField>
        </CollapsibleSection>

        <CollapsibleSection title="Advanced Settings">
          {/* ... */}
        </CollapsibleSection>

        <CollapsibleSection title="Statistics">
          {/* ... */}
        </CollapsibleSection>
      </div>

      {/* Auto-save indicator */}
      <div className="flex-shrink-0 border-t p-3">
        <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
      </div>
    </div>
  );
}
```

### Pattern 2 : Validation Temps Réel

```jsx
function MyForm() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Validation temps réel
    if (!newValue.trim()) {
      setError('Field cannot be empty');
    } else if (newValue.length > 50) {
      setError('Maximum 50 characters');
    } else {
      setError(''); // Clear error
    }
  };

  return (
    <FormField label="Name" error={error} required>
      <input
        value={value}
        onChange={handleChange}
        className={cn(
          'px-3 py-2 border rounded',
          error ? 'border-red-500' : 'border-slate-700'
        )}
        aria-invalid={!!error}
      />
    </FormField>
  );
}
```

### Pattern 3 : Modal avec AutoSave

```jsx
function MyModal({ isOpen, onClose }) {
  const lastSaved = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit">
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6">
          {/* Content */}
        </div>

        {/* Footer avec auto-save */}
        <div className="border-t p-4 flex justify-between items-center">
          <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
          <div className="flex gap-2">
            <GhostButton onClick={onClose}>Close</GhostButton>
            <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
```

---

## 🎯 Best Practices

### 1. Toujours utiliser FormField pour les inputs
❌ **Éviter** :
```jsx
<div>
  <label>Name</label>
  <input ... />
  {error && <span>{error}</span>}
</div>
```

✅ **Préférer** :
```jsx
<FormField label="Name" error={error}>
  <input ... />
</FormField>
```

### 2. Ajouter AutoSaveIndicator aux panels d'édition
❌ **Éviter** : Pas de feedback de sauvegarde

✅ **Préférer** :
```jsx
<div className="flex-shrink-0 border-t p-3">
  <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
</div>
```

### 3. Grouper les propriétés avec CollapsibleSection
❌ **Éviter** : Tout afficher d'un coup (scroll infini)

✅ **Préférer** :
```jsx
<CollapsibleSection title="Essential" defaultOpen={true}>
  {/* Props essentielles */}
</CollapsibleSection>
<CollapsibleSection title="Advanced">
  {/* Props avancées */}
</CollapsibleSection>
```

### 4. Utiliser cn() pour classes conditionnelles
❌ **Éviter** :
```jsx
className={`base ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
```

✅ **Préférer** :
```jsx
className={cn('base', isActive && 'active', isDisabled && 'disabled')}
```

---

## 🔍 Exemples Réels dans la Codebase

### PropertiesPanel
Voir `src/components/panels/PropertiesPanel.jsx` lignes 238-426 pour exemple complet avec :
- CollapsibleSection (futur)
- FormField
- AutoSaveIndicator
- Validation temps réel

### CharactersModal
Voir `src/components/modals/CharactersModal.jsx` pour utilisation de CharacterCard

### Button Variants
Voir `src/components/ui/Button.jsx` pour tous les variants disponibles

---

**Généré automatiquement par Claude Code** 🤖
