# Graph Component Architecture

> **Composants de graphe de dialogues utilisant @xyflow/react**

---

## Vue d'ensemble

Ce module contient tous les composants liés à la visualisation interactive du graphe de dialogues, propulsé par **@xyflow/react** (React Flow v12+).

### Composants principaux

```
features/
├── DialogueGraph.tsx           # Component principal React Flow
├── CosmosBackground.tsx        # Fond animé pour thème Cosmos
├── CosmosEdgeGradients.tsx     # Gradients SVG pour edges custom
├── CosmosChoiceEdge.tsx        # Edge custom pour choix (thème Cosmos)
├── CosmosConvergenceEdge.tsx   # Edge custom pour convergence
├── CosmosEffects.tsx           # Effets visuels Cosmos (particules, etc.)
├── FlowDirectionIndicator.tsx  # Indicateur direction du flow (TB/LR)
├── SerpentineBadge.tsx         # Badge serpentine routing
└── graph-nodes/
    ├── index.ts                # Export nodeTypes registry
    ├── BaseNode.tsx            # Node de base avec handles management
    ├── ChoiceNode.tsx          # Node pour choix (simple/complex/dice)
    ├── TerminalNode.tsx        # Node terminal (fin de branche)
    └── NodeDecorations.tsx     # Décorations (badges, icons, etc.)
```

---

## Data Flow

```
┌─────────────────┐
│  Zustand Store  │  scenesStore → dialogues, scènes
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ useDialogueGraph│  Hook bridge : transforme store data → graph format
└────────┬────────┘
         │
         ↓ { nodes: GraphNode[], edges: Edge[] }
┌─────────────────┐
│ DialogueGraph   │  React Flow component
│ (ReactFlow)     │  Gère rendering + interactions
└─────────────────┘
```

### Flux de données détaillé

1. **Store → Hook** : `useDialogueGraph(dialogues, sceneId, validation, layout, theme)`
   - Prend les dialogues du store
   - Applique layout Dagre (positions hiérarchiques)
   - Applique Serpentine routing (évite overlaps)
   - Retourne `{ nodes, edges }` prêts pour React Flow

2. **Hook → Component** : `DialogueGraph` utilise `useLocalGraphState`
   - Synchronise local state (positions modifiables) avec Dagre
   - Gère drag-and-drop de nodes
   - Recalcule edges serpentine après drag

3. **User Interactions → Store** :
   - Click node → `onSelectDialogue(sceneId, index)` → store selection
   - Double-click → `onOpenModal('dialogue-editor')` → ouvre wizard
   - Connect nodes → `actions.handleReconnectChoice(connection)` → met à jour store
   - Delete node → `actions.handleDeleteNode(nodeId)` → supprime du store

---

## Graph Updates — Règles Critiques

### ✅ Immutabilité Stricte

React Flow détecte les changements par **référence**, pas par deep equality.

```typescript
// ❌ MAUVAIS : Mutation directe (PAS de re-render!)
nodes[0].position = { x: 100, y: 200 };
setNodes(nodes);

// ✅ BON : Nouvelle référence immutable
setNodes((nds) => nds.map(n =>
  n.id === nodeId ? { ...n, position: { x: 100, y: 200 } } : n
));
```

### ✅ setNodes / setEdges uniquement

```typescript
// ❌ MAUVAIS : Modification directe du tableau
const nodeToUpdate = nodes.find(n => n.id === nodeId);
nodeToUpdate.data.text = 'New text';  // ❌ Mutation!

// ✅ BON : Via setter immutable
setNodes((nds) => nds.map(n =>
  n.id === nodeId
    ? { ...n, data: { ...n.data, text: 'New text' } }
    : n
));
```

---

## Layout Algorithms

### 1. Dagre Layout (Initial)

Le layout **Dagre** calcule les positions hiérarchiques initiales des nodes.

**Fichier** : `src/hooks/useNodeLayout.ts`

**Configuration** :
```typescript
// src/config/layoutConfig.ts
export const DAGRE_CONFIG = {
  rankdir: 'TB',     // Direction: Top-Bottom ou Left-Right
  ranksep: 100,      // Espacement vertical entre rangs
  nodesep: 80,       // Espacement horizontal entre nodes
  marginx: 20,
  marginy: 20,
};
```

**Quand il s'exécute** :
- Au chargement initial du graphe
- Quand le nombre de dialogues change
- Quand la direction de layout change (TB ↔ LR)

### 2. Serpentine Routing (Post-Dagre)

Le **Serpentine routing** optimise les edges pour éviter les overlaps quand la distance verticale entre nodes est grande.

**Fichier** : `src/hooks/graph-utils/serpentineRouting.ts`

**Principe** :
- Si distance Y entre source et target > `SERPENTINE_Y_THRESHOLD` (150px)
- Alors utiliser handles **Left/Right** au lieu de Top/Bottom
- Cela fait "serpenter" l'edge au lieu de passer en ligne droite

**Quand il s'exécute** :
- Après layout Dagre initial
- Après drag-and-drop d'un node (si `serpentineEnabled === true`)

**Exemple** :
```
Avant Serpentine:          Après Serpentine:
Node A                     Node A
  |                          |
  | (distance Y > 150)       └─→ (handle right)
  |                              ↓
  ↓                          ┌───┘ (serpentine)
Node B                       Node B
```

---

## Custom Nodes

### BaseNode

**Fichier** : `graph-nodes/BaseNode.tsx`

Composant de base pour tous les nodes custom. Gère :
- Handles source/target
- Couleurs par thème
- État sélection
- Validation errors/warnings
- Accessibility (ARIA labels)

**Props** :
```typescript
interface BaseNodeProps {
  id: string;
  data: {
    index: number;
    text: string;
    speaker?: string;
    // ...
  };
  selected?: boolean;
  theme: GraphTheme;
}
```

### ChoiceNode

**Fichier** : `graph-nodes/ChoiceNode.tsx`

Node pour dialogues avec choix multiples.

**Handles** :
- 1 handle **target** (entrée)
- N handles **source** (sorties, une par choix)

**Dynamisme** :
```typescript
// Handles positionnés proportionnellement
choices.map((choice, index) => (
  <Handle
    key={index}
    type="source"
    id={`choice-${index}`}
    position={Position.Right}
    style={{ top: `${(index + 1) * (100 / (choices.length + 1))}%` }}
  />
))
```

### TerminalNode

**Fichier** : `graph-nodes/TerminalNode.tsx`

Node de fin de branche (sink).

**Caractéristiques** :
- 1 handle **target** uniquement (pas de source)
- Couleur distincte (souvent rouge/orange)
- Non-connectable en sortie

---

## Custom Edges

### Edge Registry

**Fichier** : `src/config/edgeRegistry.ts`

Registry centralisé qui mappe thèmes → edge components.

```typescript
const EDGE_REGISTRY: Record<string, EdgeTypes> = {
  cosmos: {
    cosmosChoice: CosmosChoiceEdge,
    cosmosConvergence: CosmosConvergenceEdge,
  },
  default: {
    // Edges par défaut
  },
};

export function getEdgeTypes(themeId: string): EdgeTypes {
  return EDGE_REGISTRY[themeId] || EDGE_REGISTRY.default;
}
```

**Usage** :
```typescript
const edgeTypes = useMemo(() => getEdgeTypes(theme.id), [theme.id]);
<ReactFlow edgeTypes={edgeTypes} />
```

### CosmosChoiceEdge

**Fichier** : `CosmosChoiceEdge.tsx`

Edge custom avec gradient SVG pour les connexions de choix.

**Style** :
- Gradient `url(#cosmos-choice-gradient)` (violet → cyan)
- SmoothStep path type
- Animated si `data.animated === true`

### CosmosConvergenceEdge

**Fichier** : `CosmosConvergenceEdge.tsx`

Edge custom pour les convergences (plusieurs choix → même dialogue).

**Style** :
- Gradient `url(#cosmos-convergence-gradient)` (bleu → turquoise)
- Dashed si convergence multiple

---

## Thème Cosmos

Le **thème Cosmos** est un thème visuel custom avec fond animé, gradients, et effets particules.

### CosmosBackground

**Fichier** : `CosmosBackground.tsx`

Fond animé avec stars et particules.

**Lazy-loaded** :
```typescript
const CosmosBackground = lazy(() => import('./CosmosBackground'));

{theme.id === 'cosmos' && (
  <Suspense fallback={null}>
    <CosmosBackground />
  </Suspense>
)}
```

### CosmosEdgeGradients

**Fichier** : `CosmosEdgeGradients.tsx`

Gradients SVG centralisés pour edges.

**Data-driven** :
```typescript
const EDGE_GRADIENTS = Object.values(COSMOS_COLORS.gradients);

<svg aria-hidden="true">
  <defs>
    {EDGE_GRADIENTS.map((gradient) => (
      <linearGradient key={gradient.id} id={gradient.id}>
        {gradient.stops.map((stop) => (
          <stop offset={stop.offset} stopColor={stop.color} />
        ))}
      </linearGradient>
    ))}
  </defs>
</svg>
```

**Gradients disponibles** :
- `cosmos-linear-gradient` : Gris → cyan
- `cosmos-choice-gradient` : Violet → cyan
- `cosmos-convergence-gradient` : Bleu → turquoise
- `cosmos-scene-jump-gradient` : Orange → rouge

---

## Performance Considerations

### 1. Memoization des Nodes

```typescript
// ✅ BON : memo() sur custom nodes
export const DialogueNode = memo(function DialogueNode({ id, data }: NodeProps) {
  // ...
});
```

**Pourquoi** : Évite re-render quand edges changent mais data node inchangée.

### 2. Stable References

```typescript
// ✅ BON : nodeTypes stable (module-level)
export const nodeTypes = {
  dialogueNode: DialogueNode,
  choiceNode: ChoiceNode,
  terminalNode: TerminalNode,
} as const;

// ✅ BON : edgeTypes memoized
const edgeTypes = useMemo(() => getEdgeTypes(theme.id), [theme.id]);
```

### 3. defaultEdgeOptions Memoized

```typescript
const defaultEdgeOptions = useMemo(
  () => ({ type: 'step', animated: false }),
  []
);
```

### 4. Lazy-loading Background

```typescript
// ✅ BON : Cosmos background lazy-loaded
const CosmosBackground = lazy(() => import('./CosmosBackground'));
```

**Impact** : Réduit main bundle de ~15KB gzipped.

---

## Accessibilité

### ARIA Labels

```typescript
<ReactFlow
  aria-label="Graphe de dialogues interactif"
  aria-describedby="graph-instructions"
>
  <div id="graph-instructions" className="sr-only">
    Utilisez les flèches pour naviguer entre les dialogues.
  </div>
</ReactFlow>
```

### Keyboard Navigation

**Implémenté dans** : `DialogueGraph.tsx` → `handleKeyDown()`

**Shortcuts** :
- `↑↓` : Navigation entre nodes
- `Enter` : Éditer node sélectionné
- `Escape` : Désélectionner
- `Delete` : Supprimer node (edit mode)
- `Ctrl+D` : Dupliquer node (edit mode)

### Focus Management

```typescript
<div className="dialogue-graph-container" tabIndex={-1} onKeyDown={handleKeyDown}>
  <ReactFlow />
</div>
```

---

## Debugging

### React Flow DevTools

Enable dans `vite.config.ts` :
```typescript
define: {
  'process.env.REACT_FLOW_DEBUG': JSON.stringify(true),
}
```

### Logs Utiles

```typescript
// Voir nodes/edges après layout
console.log('Dagre nodes:', nodes.map(n => ({ id: n.id, pos: n.position })));

// Voir edges serpentine
console.log('Serpentine edges:', edges.map(e => ({
  id: e.id,
  sourceHandle: e.sourceHandle,
  targetHandle: e.targetHandle,
})));
```

---

## Liens Utiles

- **@xyflow/react docs** : https://reactflow.dev/
- **Dagre layout** : https://github.com/dagrejs/dagre
- **Cosmos theme constants** : `@/config/cosmosConstants.ts`
- **Edge registry** : `@/config/edgeRegistry.ts`
- **Handle config** : `@/config/handleConfig.ts`

---

**Dernière mise à jour** : 2026-02-14
