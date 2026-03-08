import { useState, useCallback, useEffect, useRef } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import { useBehaviorsStore } from '@/stores/behaviorsStore';
import type { BehaviorNodeType } from '@/types/behavior';

/**
 * useBehaviorGraphState
 *
 * Synchronise l'état local ReactFlow avec le behaviorsStore.
 *
 * ⚠️ INVARIANT : Ne jamais appeler setNodes() DANS setEdges() ou vice-versa.
 *    Utiliser des useRef pour accéder aux valeurs courantes dans les callbacks.
 *    Les setState imbriqués dans des updater-functions déclenchent une boucle infinie
 *    avec @xyflow/react (Maximum update depth exceeded).
 */
export function useBehaviorGraphState(mapId: string | null) {
  const setGraphForMap = useBehaviorsStore(s => s.setGraphForMap);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Refs pour accéder aux valeurs courantes sans setState imbriqués
  const nodesRef = useRef<Node[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);

  // Maintenir les refs synchronisées avec l'état
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Sync store → local quand mapId change
  useEffect(() => {
    if (!mapId) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const g = useBehaviorsStore.getState().getGraphForMap(mapId);
    const loadedNodes = (g.nodes as unknown as Node[]) ?? [];
    const loadedEdges = (g.edges as unknown as Edge[]) ?? [];
    setNodes(loadedNodes);
    setEdges(loadedEdges);
  }, [mapId]);

  // Save locale → store (appelé directement dans les handlers, jamais dans les updaters)
  const persistToStore = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
    if (!mapId) return;
    setGraphForMap(mapId, {
      mapId,
      nodes: updatedNodes as unknown as never,
      edges: updatedEdges as unknown as never,
    });
  }, [mapId, setGraphForMap]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const updated = applyNodeChanges(changes, nodesRef.current);
    setNodes(updated);
    const hasPositionOrDelete = changes.some(c => c.type === 'position' || c.type === 'remove');
    if (hasPositionOrDelete) {
      persistToStore(updated, edgesRef.current);
    }
  }, [persistToStore]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const updated = applyEdgeChanges(changes, edgesRef.current);
    setEdges(updated);
    persistToStore(nodesRef.current, updated);
  }, [persistToStore]);

  const onConnect = useCallback((connection: Connection) => {
    const edgeLabel = connection.sourceHandle === 'yes' ? 'Oui'
      : connection.sourceHandle === 'no' ? 'Non'
      : undefined;
    const newEdge: Edge = {
      ...connection,
      id: `e-${connection.source}-${connection.sourceHandle ?? ''}-${connection.target}-${Date.now()}`,
      source: connection.source ?? '',
      target: connection.target ?? '',
      ...(edgeLabel ? { label: edgeLabel } : {}),
    };
    const updated = addEdge(newEdge, edgesRef.current);
    setEdges(updated);
    persistToStore(nodesRef.current, updated);
  }, [persistToStore]);

  /** Ajoute un node au centre visible du canvas */
  const addNode = useCallback((type: BehaviorNodeType, position = { x: 200, y: 200 }) => {
    if (!mapId) return;
    const id = `${type}-${Date.now()}`;
    const newNode: Node = { id, type, position, data: getDefaultData(type) as never };
    const updated = [...nodesRef.current, newNode];
    setNodes(updated);
    persistToStore(updated, edgesRef.current);
  }, [mapId, persistToStore]);

  return { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode };
}

// ── Données par défaut selon le type de node ────────────────────────────────

function getDefaultData(type: BehaviorNodeType) {
  switch (type) {
    case 'trigger-zone':
      return { zoneId: '', label: 'Nouvelle zone' };
    case 'condition':
      return { variable: 'score', operator: '>=', value: 1 };
    case 'action':
      return { type: 'set-variable', variable: 'score', value: 0 };
    case 'dialogue-trigger':
      return { sceneId: '', sceneTitle: 'Choisir une scène…' };
    case 'map-exit':
      return { targetMapId: '', targetMapName: 'Choisir une carte…' };
  }
}
