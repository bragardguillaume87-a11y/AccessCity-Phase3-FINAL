# Analyse TypeScript Strict Mode

## Résumé

| Métrique | Valeur |
|----------|--------|
| **Erreurs totales** | 43 |
| **Fichiers affectés** | ~10 |
| **Effort estimé** | 1-2 jours |
| **Risque** | FAIBLE |

---

## Types d'Erreurs

### 1. `TS7006` - Parameter implicitly has 'any' type (15 erreurs)

**Exemple** :
```typescript
// Avant
const handleClick = (item) => { ... }

// Après
const handleClick = (item: ItemType) => { ... }
```

**Fichiers concernés** :
- `EditorShell.tsx`
- `AvatarPicker.tsx`

---

### 2. `TS2322` - Type 'X' is not assignable to type 'Y' (10 erreurs)

**Exemple** :
```typescript
// Avant (null vs undefined)
const value: string | undefined = null;

// Après
const value: string | null = null;
```

**Fichiers concernés** :
- `MainCanvas.tsx`
- `UnifiedPanel.tsx`

---

### 3. `TS7016` - Could not find declaration file (2 erreurs)

**Packages sans types** :
- `canvas-confetti`
- `dagre`

**Solution** :
```bash
npm install -D @types/canvas-confetti @types/dagre
```

---

### 4. `TS2353` - Object literal may only specify known properties (5 erreurs)

**Cause** : setState avec un objet qui a des propriétés inattendues.

**Fichiers concernés** :
- `EditorShell.tsx`

---

### 5. `TS2345` - Argument of type 'X' is not assignable (8 erreurs)

**Cause** : Incompatibilité de types dans les arguments de fonction.

**Fichiers concernés** :
- `EditorShell.tsx`
- `AvatarPicker.tsx`

---

## Fichiers Prioritaires

1. **EditorShell.tsx** - 15 erreurs (le plus critique)
2. **AvatarPicker.tsx** - 10 erreurs
3. **MainCanvas.tsx** - 5 erreurs
4. **UnifiedPanel.tsx** - 2 erreurs
5. **useDialogueGraph.ts** - 1 erreur (types manquants)

---

## Plan de Correction

### Phase 1 : Installer les types manquants
```bash
npm install -D @types/canvas-confetti @types/dagre
```

### Phase 2 : Corriger EditorShell.tsx
- Ajouter les types aux paramètres de callback
- Typer correctement les états avec useState

### Phase 3 : Corriger AvatarPicker.tsx
- Ajouter une interface Props
- Typer les paramètres des fonctions

### Phase 4 : Corriger les autres fichiers
- Uniformiser null/undefined
- Ajouter les types manquants

### Phase 5 : Activer strict mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## Commande de Test

```bash
# Tester sans modifier tsconfig.json
npx tsc --noEmit --strict

# Après correction, activer dans tsconfig.json
```

---

## Recommandation

Le nombre d'erreurs (43) est gérable en 1-2 jours de travail.

**Prioriser** :
1. D'abord installer `@types/canvas-confetti` et `@types/dagre`
2. Puis corriger `EditorShell.tsx` (15 erreurs)
3. Ensuite `AvatarPicker.tsx` (10 erreurs)
4. Enfin activer le mode strict
