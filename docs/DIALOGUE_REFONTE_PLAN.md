# Plan d'Implémentation: Refonte Ergonomie Dialogues avec Esthétique Gaming

## Vue d'ensemble

Refonte complète de l'ergonomie des dialogues dans AccessCity avec une esthétique gaming moderne inspirée de Powtoon. L'objectif est de créer une interface intuitive, cinématique et accessible (WCAG 2.2 AA) pour la création et le test de dialogues interactifs.

## Objectifs principaux

1. **Animation typewriter** pour les dialogues (effet machine à écrire)
2. **Système d'onglets Scènes/Dialogues** dans le panneau gauche (toggle)
3. **Synchronisation clic dialogue** → 3 actions combinées (preview + playhead + scroll)
4. **Épuration de la boîte de dialogue** (réduction 50% de la taille)
5. **Panneau droit masquable** avec bouton toggle arrow
6. **Modes plein écran** (Graph, Canvas, Preview) pour testing
7. **Renommage français** "Add Objects" → "Ajouter éléments"
8. **Mode Simple/Avancé** pour le panneau droit + outils de positionnement rapide

## Architecture technique

- **React 19.2.0** + **Zustand 5.0.9** (state management)
- **Framer Motion 12.23.26** (animations gaming)
- **Radix-UI Tabs** (système d'onglets accessible)
- **react-resizable-panels** (panneaux collapsibles)
- **@dnd-kit** (drag-and-drop pour réorganisation)
- **Design tokens CSS** (--shadow-game-glow, --color-primary, etc.)

## Fichiers critiques

### À modifier
- [src/components/panels/MainCanvas.jsx](../src/components/panels/MainCanvas.jsx) (1110 lignes)
- [src/components/EditorShell.jsx](../src/components/EditorShell.jsx) (267 lignes)
- [src/components/panels/UnifiedPanel.jsx](../src/components/panels/UnifiedPanel.jsx) (397 lignes)
- [src/stores/scenesStore.js](../src/stores/scenesStore.js)

### À créer
- [src/hooks/useTypewriter.js](../src/hooks/useTypewriter.js)
- [src/components/panels/LeftPanel.jsx](../src/components/panels/LeftPanel.jsx)
- [src/components/panels/DialoguesPanel.jsx](../src/components/panels/DialoguesPanel.jsx)
- [src/components/panels/DialoguesPanel/DialogueCard.jsx](../src/components/panels/DialoguesPanel/DialogueCard.jsx)
- [src/components/panels/UnifiedPanel/CharacterPositioningTools.jsx](../src/components/panels/UnifiedPanel/CharacterPositioningTools.jsx)

## Phases d'implémentation

### Phase 1: Hook useTypewriter + Épuration preview
- Créer hook d'animation typewriter (40ms/char, skip sur click/space)
- Réduire taille dialogue box de 50% (max-w-4xl → max-w-2xl)
- Intégrer curseur clignotant

### Phase 2: Système d'onglets Scènes/Dialogues
- Créer LeftPanel.jsx avec Radix-UI Tabs
- Créer DialoguesPanel.jsx avec drag-and-drop
- Créer DialogueCard.jsx (pattern ScenesSidebar)

### Phase 3: Synchronisation clic dialogue
- Action 1: Show preview + typewriter
- Action 2: Move timeline playhead
- Action 3: Scroll to dialogue in editor

### Phase 4: Toggle panneau droit
- Bouton arrow floating sur bord droit canvas
- react-resizable-panels collapsible
- Animation slide 300ms

### Phase 5: Renommage français
- "Add Objects" → "Ajouter éléments"
- Mise à jour aria-labels

### Phase 6: Modes plein écran
- 3 boutons contextuels (Graph, Canvas, Preview)
- Overlays fixed inset-0 z-50
- Escape key pour fermer

### Phase 7: Animations gaming
- AnimatePresence pour dialogue preview
- Glows sur hover (--shadow-game-glow)
- Pulse animation dialogue actif

### Phase 8: Mode Simple/Avancé + Outils positionnement
- Toggle Simple/Avancé dans UnifiedPanel header
- Simple: 4 sections (Backgrounds, Text, Characters, Objets)
- Avancé: 8 sections + CharacterPositioningTools
- Positionnement rapide: gauche/centre/droite
- Taille rapide: petit/moyen/grand

## Contraintes techniques

- **TimelinePlayhead**: RESTE sous canvas (user-validated)
- **State management**: LOCAL state pour UI, Zustand pour données
- **Animations**: Framer Motion uniquement (cohérence)
- **Timing**: 300ms toggles, 200ms hover, 40ms/char typewriter
- **Accessibilité**: WCAG 2.2 AA (contraste, clavier, ARIA)
- **Design tokens**: Toujours utiliser CSS variables

## Estimation

**Total**: 19-25.5 heures (8 phases)

## Livrables

- 5 fichiers créés
- 4 fichiers modifiés
- 11 fonctionnalités gaming implémentées
- Tests WCAG 2.2 AA validés
