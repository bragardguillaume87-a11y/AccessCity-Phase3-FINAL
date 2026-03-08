import { useState, useCallback, useEffect } from 'react';
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
 * Pattern : état local pour les interactions fluides → save au store sur chaque changement.
 *
 * ⚠️ Ne pas appeler useBehaviorsStore.getState() pendant le render — handler uniquement.
 */
export function useBehaviorGraphState(mapId: string | null) {
  const graph = useBehaviorsStore(s => mapId ? s.getGraphForMap(mapId) : null);
  const setGraphForMap = useBehaviorsStore(s => s.setGraphForMap);

  // Local ReactFlow state — source de vérité pour l'affichage
  // Double cast via unknown : BehaviorNode et Node partagent la forme mais leurs types data divergent
  const [nodes, setNodes] = useState<Node[]>(() => (graph?.nodes as unknown as Node[]) ?? []);
  const [edges, setEdges] = useState<Edge[]>(() => (graph?.edges as unknown as Edge[]) ?? []);

  // Sync store → local quand mapId change
  useEffect(() => {
    if (!mapId) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const g = useBehaviorsStore.getState().getGraphForMap(mapId);
    setNodes((g.nodes as unknown as Node[]) ?? []);
    setEdges((g.edges as unknown as Edge[]) ?? []);
  }, [mapId]);

  // Save locale → store
  const persistToStore = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
    if (!mapId) return;
    setGraphForMap(mapId, {
      mapId,
      nodes: updatedNodes as unknown as never,
      edges: updatedEdges as unknown as never,
    });
  }, [mapId, setGraphForMap]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(ns => {
      const updated = applyNodeChanges(changes, ns);
      // Persist position + deletion changes
      const hasPositionOrDelete = changes.some(c => c.type === 'position' || c.type === 'remove');
      if (hasPositionOrDelete) {
        setEdges(es => {
          persistToStore(updated, es);
          return es;
        });
      }
      return updated;
    });
  }, [persistToStore]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(es => {
      const updated = applyEdgeChanges(changes, es);
      setNodes(ns => {
        persistToStore(ns, updated);
        return ns;
      });
      return updated;
    });
  }, [persistToStore]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(es => {
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
      const updated = addEdge(newEdge, es);
      setNodes(ns => {
        persistToStore(ns, updated);
        return ns;
      });
      return updated;
    });
  }, [persistToStore]);

  /** Ajoute un node au centre visible du canvas */
  const addNode = useCallback((type: BehaviorNodeType, position = { x: 200, y: 200 }) => {
    if (!mapId) return;

    const id = `${type}-${Date.now()}`;
    const data = getDefaultData(type);

    const newNode: Node = { id, type, position, data: data as never };

    setNodes(ns => {
      const updated = [...ns, newNode];
      setEdges(es => {
        persistToStore(updated, es);
        return es;
      });
      return updated;
    });
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
