# DialoguesPanel - Comparaison visuelle AVANT / APRÈS

## Vue d'ensemble

```
AVANT                                          APRÈS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐       ┌─────────────────────────────────────┐
│  💬 Etape 5 : Dialogues             │       │  💬 Etape 5 : Dialogues             │
│  Ecrivez les interactions...        │       │  Ecrivez les interactions...        │
└─────────────────────────────────────┘       └─────────────────────────────────────┘

┌──────────┬──────────────────────────┐       ┌──────────┬──────────────────────────┐
│ Scènes   │ Dialogues : Scene 1      │       │╔════════╗│ 💬 Dialogues : Scene 1   │
├──────────┤                          │       │║ SCÈNES ║│                          │
│ ▢ #1 ... │ 📦 Template  [+] Ajouter │       │╚════════╝│ 📦 Template  [+] Ajouter │
│ ▢ #2 ... │                          │       ├──────────┤                          │
│ ▢ #3 ... │ ┌─────────────────────┐  │       │█ #1 ... █│ ┌─────────────────────┐  │
│          │ │ ① Dialogue 1        │  │       │▢ #2 ...  │ │ ① Dialogue 1        │  │
│          │ │ Speaker: Narrateur  │  │       │▢ #3 ...  │ │ Speaker: Narrateur  │  │
│          │ │ Text: ...           │  │       │          │ │ Text: ...           │  │
│          │ │ [Dupliquer][Suppr.] │  │       │          │ │ [Dupliquer][Suppr.] │  │
│          │ └─────────────────────┘  │       │          │ └─────────────────────┘  │
└──────────┴──────────────────────────┘       └──────────┴──────────────────────────┘

Problèmes :                                    Améliorations :
• Sidebar plate, manque de profondeur          • Header séparé avec fond distinct
• Sélection peu visible (bg-accent/10)         • Sélection forte (bg-accent + blanc)
• Badge peu contrasté                          • Badge dynamique selon l'état
• Pas d'icône dans le header                   • Icône MessageSquare dans header
```

---

## 1. Sidebar des scènes

### AVANT
```
┌─────────────────────┐
│ Scènes              │  ← Titre simple, pas de séparation
├─────────────────────┤
│                     │
│ 💬 #1 Scene 1  [3]  │  ← bg-accent/10 (très pâle)
│                     │     Badge bg-panel-bg-alt (peu visible)
│ 💬 #2 Scene 2  [1]  │  ← hover:bg-panel-bg-alt
│                     │
│ 💬 #3 Scene 3  [0]  │
│                     │
└─────────────────────┘

Problèmes :
• Pas de séparation visuelle entre header et liste
• Sélection trop pâle (bg-accent/10 ≈ #3b82f61a)
• Badge monotone, même couleur partout
• Icône toujours grise (pas de feedback visuel)
```

### APRÈS
```
┌─────────────────────┐
│╔═══════════════════╗│
│║ SCÈNES            ║│  ← Header avec fond bg-panel-bg-alt
│╚═══════════════════╝│     Border-bottom séparateur
├─────────────────────┤
│                     │
│ █ #1 Scene 1   ⓷  │  ← bg-accent SOLIDE + texte blanc
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓      │     Badge bg-white/20 (visible sur fond bleu)
│                     │     Icône blanche
│ ░ #2 Scene 2   ①  │  ← hover:bg-panel-bg-alt + icône grise
│                     │     Badge bg-accent/10 text-accent
│ ░ #3 Scene 3   ⓪  │
│                     │
└─────────────────────┘

Améliorations :
✓ Header séparé avec fond et border
✓ Sélection forte (100% opacity, blanc sur bleu)
✓ Badge adaptatif (blanc sur sélection, accent sinon)
✓ Icône contextuelle (blanche si sélectionné)
✓ Shadow-app pour profondeur
```

---

## 2. Bouton Template

### AVANT
```
┌─────────────────────────────┐
│ [📦 Template] [+ Ajouter]   │
└─────────────────────────────┘
     ↑                 ↑
     │                 │
bg-purple-600    bg-success
emoji 📦         icône Plus

Problèmes :
• Emoji au lieu d'icône Lucide
• bg-purple-600 ne correspond pas à la palette
• Pas de bordure, juste un fond coloré
```

### APRÈS
```
┌──────────────────────────────┐
│ [📦 Template] [+ Ajouter]    │
└──────────────────────────────┘
     ↑                 ↑
     │                 │
SECONDAIRE        PRIMAIRE

[📦 Template]  →  [⎕ Template]
bg-purple-600     bg-panel-bg-alt
text-white        border border-border
                  text-txt-primary
                  Icône <Layers>

[+ Ajouter]       [+ Ajouter]
bg-success        bg-success (inchangé)
Icône Plus        Icône Plus (inchangé)

Améliorations :
✓ Icône Layers au lieu d'emoji
✓ Style secondaire (neutre, pas violet)
✓ Bordure pour le contraste
✓ Cohérence avec la palette custom
```

---

## 3. Card de dialogue

### AVANT
```
┌─────────────────────────────────┐
│ ① ← Badge 32x32px               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ LOCUTEUR                    │ │
│ │ [Narrateur ▼]               │ │
│ │                             │ │
│ │ TEXTE                       │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ ...                     │ │ │
│ │ └─────────────────────────┘ │ │
│ │                             │ │
│ │ [Dupliquer] [Supprimer]     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
     ↑                    ↑
border-2            bg-white
border-slate-200    padding inline

Problèmes :
• Double bordure (CSS + inline)
• Labels simples (text-xs font-semibold)
• Espacement serré (space-y-3)
• Badge trop grand (32x32)
```

### APRÈS
```
┌─────────────────────────────────┐
│ ⓵ ← Badge 28x28px + border     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ LOCUTEUR                    │ │  ← UPPERCASE TRACKING-WIDE
│ │ [Narrateur ▼]               │ │     text-txt-secondary
│ │                             │ │
│ │ TEXTE                       │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ ...                     │ │ │
│ │ └─────────────────────────┘ │ │
│ │                             │ │
│ │ [Dupliquer] [Supprimer]     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
     ↑                    ↑
border-left 4px      bg-panel-bg
(dans CSS)           padding dans CSS

Améliorations :
✓ Bordure simplifiée (uniquement border-left)
✓ Labels uppercase pour hiérarchie visuelle
✓ Espacement augmenté (space-y-4)
✓ Badge plus discret (28x28 + bordure blanche)
✓ Padding géré par CSS (DRY)
```

---

## 4. Card de choix

### AVANT
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Texte du choix                  │ │
│ │ [Accepter la mission]           │ │
│ │                                 │ │
│ │ Scène suivante                  │ │
│ │ [Scene 2 ▼]                     │ │
│ │                                 │ │
│ │ [Dupliquer] [Supprimer]         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
        ↑
border-l-purple-500 3px
bg transparent
Pas d'icônes

Problèmes :
• Pas d'icônes pour différencier les champs
• Border-left 3px (incohérent avec dialogue 4px)
• Pas de hover state
• Labels simples (text-xs font-semibold)
```

### APRÈS
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ ▶ Texte du choix                │ │  ← Icône ChevronRight
│ │ [Accepter la mission]           │ │
│ │                                 │ │
│ │ → Scène suivante                │ │  ← Icône ArrowRight
│ │ [Scene 2 ▼]                     │ │
│ │                                 │ │
│ │ [Dupliquer] [Supprimer]         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
        ↑
border-l-purple-500 4px
gradient background
Hover: background + shadow

Améliorations :
✓ Icônes dans les labels (ChevronRight, ArrowRight)
✓ Border-left 4px (cohérent avec dialogues)
✓ Gradient de fond léger
✓ Hover state (background change)
✓ Labels font-bold avec icônes
✓ Padding géré par CSS
```

---

## 5. Toggle de lancer de dé

### AVANT
```
┌─────────────────────────────────┐
│ ☐ 🎲 Activer le lancer de dé    │
└─────────────────────────────────┘
    ↑   ↑
Checkbox simple
text-purple-700

Problèmes :
• Pas de background (invisible)
• Emoji au lieu d'icône
• Pas de feedback visuel (état actif/inactif)
• Pas de hover state
```

### APRÈS
```
┌─────────────────────────────────────┐
│ ☑ 🎲 Activer le lancer de dé  ACTIF │  ← État actif
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────────┘
    ↑   ↑                          ↑
Checkbox  Icône Dice6 (accent)  Badge
bg-panel-bg-alt
border border-border
hover:border-accent/40

┌─────────────────────────────────────┐
│ ☐ 🎲 Activer le lancer de dé        │  ← État inactif
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────┘
    ↑   ↑
Checkbox  Icône Dice6 (tertiary)
text-txt-secondary

Améliorations :
✓ Background + border pour visibilité
✓ Icône Lucide React au lieu d'emoji
✓ Icône change de couleur selon l'état
✓ Badge "ACTIF" quand activé
✓ Hover state (bordure s'illumine)
✓ Padding p-3 pour espace respirable
```

---

## 6. Grille des outcomes de dés

### AVANT
```
┌────────────┬────────────┬────────────┐
│ 🎲 Diffic. │ ✅ Réussite│ ❌ Échec   │
│            │            │            │
│ Seuil: [12]│ Msg: [...]│ Msg: [...]│
│ Dé 1-20    │ Moral: [5]│ Moral: [-3]│
│            │ Illust: .. │ Illust: .. │
└────────────┴────────────┴────────────┘
     ↑             ↑             ↑
bg-purple-50  bg-green-50  bg-red-50
Emojis         Emojis       Emojis

Problèmes :
• Emojis au lieu d'icônes dans les headers
• Couleur difficulté purple au lieu d'accent
• Inputs petits (text-xs, px-2 py-1)
```

### APRÈS
```
┌────────────┬────────────┬────────────┐
│ 🎲 Diffic. │ ✓ Réussite │ × Échec    │
│            │            │            │
│ Seuil: [12]│ Msg: [...]│ Msg: [...]│
│ (1-20)     │ Moral: [5]│ Moral: [-3]│
│            │ Illust: .. │ Illust: .. │
└────────────┴────────────┴────────────┘
     ↑             ↑             ↑
bg-accent/5   bg-green-50  bg-red-50
Icône Dice6   CheckCircle2 XCircle

Headers :
🎲 Difficulté  →  [🎲] Difficulté
                  <Dice6> + text-accent

✅ Réussite    →  [✓] Réussite
                  <CheckCircle2> + text-green-700

❌ Échec       →  [×] Échec
                  <XCircle> + text-red-700

Inputs :
text-xs px-2  →  text-sm px-3 py-2
border-xxx    →  border-border + focus:border-xxx

Améliorations :
✓ Icônes Lucide dans les headers
✓ Difficulté utilise la couleur accent
✓ Inputs plus grands et cohérents
✓ Focus states avec ring
✓ Labels font-semibold (au lieu de font-medium)
```

---

## 7. Boutons d'action

### AVANT - Hiérarchie incohérente
```
HEADER
[📦 Template]      [+ Ajouter dialogue]
bg-purple-600      bg-success
emoji              icône

DIALOGUE
[Dupliquer]        [Supprimer]
bg-purple-600      bg-error
icône              icône

CHOIX
[Dupliquer]        [Supprimer]
bg-purple-600      bg-error
text-xs            text-xs
w-3 h-3            w-3 h-3

Problèmes :
• purple-600 ne fait pas partie de la palette
• Incohérence emoji vs icônes
• Pas de style "secondaire" défini
```

### APRÈS - Hiérarchie claire
```
HEADER
[⎕ Template]       [+ Ajouter dialogue]
SECONDAIRE         PRIMAIRE
bg-panel-bg-alt    bg-success
border             --
text-txt-primary   text-white

DIALOGUE
[⎕ Dupliquer]      [× Supprimer]
SECONDAIRE         DANGER
bg-panel-bg-alt    bg-error
border             --
text-txt-primary   text-white
text-sm, w-4 h-4   text-sm, w-4 h-4

CHOIX
[⎕ Dupliquer]      [× Supprimer]
SECONDAIRE         DANGER
bg-panel-bg-alt    bg-error
border             --
text-txt-primary   text-white
text-xs, w-3.5     text-xs, w-3.5

Hiérarchie :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMAIRE (action positive)
bg-success, text-white, shadow-app

SECONDAIRE (action neutre)
bg-panel-bg-alt, border, text-txt-primary, shadow-app

DANGER (action destructive)
bg-error, text-white, shadow-app

Améliorations :
✓ Palette cohérente (fini purple-600)
✓ Toutes les icônes Lucide React
✓ Hiérarchie visuelle claire
✓ Tailles proportionnelles au contexte
✓ Shadow-app sur tous les boutons
```

---

## 8. États vides

### AVANT
```
┌─────────────────────────────────┐
│                                 │
│         ╭─────────╮             │
│         │ SVG icon│             │
│         ╰─────────╯             │
│                                 │
│      Aucun dialogue             │
│   Cliquez sur "+ Ajouter"       │
│                                 │
└─────────────────────────────────┘
border-slate-300
bg-slate-50
SVG inline

Problèmes :
• SVG inline (pas réutilisable)
• Couleurs Slate (pas la palette)
• Icône sans personnalité
```

### APRÈS
```
┌─────────────────────────────────┐
│                                 │
│         ┌─────────┐             │
│         │ 💬      │             │  ← MessageSquare w-16 h-16
│         │         │             │     text-txt-tertiary
│         └─────────┘             │     strokeWidth={1.5}
│                                 │
│      Aucun dialogue             │  ← text-txt-primary font-semibold
│   Cliquez sur "+ Ajouter..."   │  ← text-txt-secondary
│                                 │
└─────────────────────────────────┘
border-border (dashed)
bg-panel-bg-alt

SÉLECTION VIDE
┌─────────────────────────────────┐
│                                 │
│         ┌─────────┐             │
│         │ 💬      │             │  ← MessageSquare w-20 h-20
│         │         │             │     Plus grand pour visibilité
│         └─────────┘             │
│                                 │
│  Sélectionnez une scène pour    │
│      éditer ses dialogues       │
│                                 │
└─────────────────────────────────┘

Améliorations :
✓ Icône Lucide (réutilisable)
✓ Palette cohérente (txt-tertiary, panel-bg-alt)
✓ Bordure dashed pour état vide
✓ Icône plus grande pour "no selection"
✓ Message plus explicite
```

---

## Résumé visuel - Amélioration globale

### Profondeur visuelle

```
AVANT (plat)                     APRÈS (profondeur)
────────────────────────────────────────────────────
□ Sidebar sans ombre             █ Sidebar + shadow-app + overflow-hidden
□ Cards sans transitions         █ Cards hover:translateY(-2px)
□ Boutons plats                  █ Boutons + shadow-app
□ Pas de séparation header       █ Header avec border-bottom
```

### Cohérence des couleurs

```
AVANT                            APRÈS
────────────────────────────────────────────────────
purple-600 (hors palette)        ✗ Supprimé
slate-xxx (système)              → txt-xxx (palette)
blue-500 (système)               → accent (palette)
bg-white partout                 → bg-panel-bg (palette)
```

### Hiérarchie visuelle

```
AVANT                            APRÈS
────────────────────────────────────────────────────
Labels uniformes                 ↑ UPPERCASE TRACKING-WIDE
Icônes monotones                 ↑ Icônes contextuelles + couleurs
Boutons mélangés                 ↑ Primaire / Secondaire / Danger
Espacement serré                 ↑ Espacement généreux (4, 3.5, 3)
```

### Feedback utilisateur

```
AVANT                            APRÈS
────────────────────────────────────────────────────
Sélection pâle                   → Sélection forte (blanc sur bleu)
Badge statique                   → Badge dynamique (change avec état)
Toggle simple                    → Toggle enrichi + badge "ACTIF"
Pas d'icônes contextuelles       → Icônes dans labels (→, ▶, 🎲)
Hover inconsistant               → Hover uniforme (bg + shadow)
```

---

## Conclusion

L'interface est passée d'un design "site web" à un design **"application native professionnelle"** grâce à :

1. **Profondeur visuelle** : shadows, borders, transitions
2. **Palette cohérente** : fini les purple-600, slate-xxx
3. **Hiérarchie claire** : primaire/secondaire/danger
4. **Feedback riche** : icônes contextuelles, badges dynamiques
5. **Espacement généreux** : respiration visuelle
6. **Icônes Lucide** : pas d'emojis dans le code

Le résultat est digne de **GDevelop, VS Code ou Figma**.
