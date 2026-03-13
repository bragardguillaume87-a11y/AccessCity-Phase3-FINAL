import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { BehaviorGraph, BehaviorNode, BehaviorEdge } from '@/types/behavior';

/**
 * Behaviors Store
 *
 * Stores one BehaviorGraph per map (keyed by mapId).
 * Graphs are built with @xyflow/react in the BehaviorGraph module.
 *
 * No temporal middleware here — behavior graphs are saved explicitly
 * (not undone incrementally), keeping the store simple.
 */

// ============================================================================
// TYPES
// ============================================================================

interface BehaviorsState {
  // State: one graph per map
  behaviorGraphsByMap: Record<string, BehaviorGraph>;

  // Queries
  getGraphForMap: (mapId: string) => BehaviorGraph;

  // Actions: nodes
  addBehaviorNode: (mapId: string, node: BehaviorNode) => void;
  updateBehaviorNode: (mapId: string, nodeId: string, patch: Partial<BehaviorNode>) => void;
  deleteBehaviorNode: (mapId: string, nodeId: string) => void;

  // Actions: edges
  addBehaviorEdge: (mapId: string, edge: BehaviorEdge) => void;
  deleteBehaviorEdge: (mapId: string, edgeId: string) => void;

  // Actions: bulk
  setGraphForMap: (mapId: string, graph: BehaviorGraph) => void;
  deleteGraphForMap: (mapId: string) => void;

  // Import
  importBehaviorGraphsByMap: (data: Record<string, BehaviorGraph>) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const EMPTY_GRAPH: BehaviorGraph = { mapId: '', nodes: [], edges: [] };

function ensureGraph(state: BehaviorsState, mapId: string): BehaviorGraph {
  return state.behaviorGraphsByMap[mapId] ?? { ...EMPTY_GRAPH, mapId };
}

// ============================================================================
// STORE
// ============================================================================

export const useBehaviorsStore = create<BehaviorsState>()(
  devtools(
    persist(
      (set, get) => ({
        behaviorGraphsByMap: {},

        getGraphForMap: (mapId) => get().behaviorGraphsByMap[mapId] ?? { ...EMPTY_GRAPH, mapId },

        addBehaviorNode: (mapId, node) => {
          set((state) => {
            const graph = ensureGraph(state, mapId);
            return {
              behaviorGraphsByMap: {
                ...state.behaviorGraphsByMap,
                [mapId]: { ...graph, nodes: [...graph.nodes, node] },
              },
            };
          }, false, 'behaviors/addBehaviorNode');
        },

        updateBehaviorNode: (mapId, nodeId, patch) => {
          set((state) => {
            const graph = ensureGraph(state, mapId);
            return {
              behaviorGraphsByMap: {
                ...state.behaviorGraphsByMap,
                [mapId]: {
                  ...graph,
                  nodes: graph.nodes.map(n => n.id === nodeId ? { ...n, ...patch } : n),
                },
              },
            };
          }, false, 'behaviors/updateBehaviorNode');
        },

        deleteBehaviorNode: (mapId, nodeId) => {
          set((state) => {
            const graph = ensureGraph(state, mapId);
            return {
              behaviorGraphsByMap: {
                ...state.behaviorGraphsByMap,
                [mapId]: {
                  ...graph,
                  nodes: graph.nodes.filter(n => n.id !== nodeId),
                  edges: graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
                },
              },
            };
          }, false, 'behaviors/deleteBehaviorNode');
        },

        addBehaviorEdge: (mapId, edge) => {
          set((state) => {
            const graph = ensureGraph(state, mapId);
            return {
              behaviorGraphsByMap: {
                ...state.behaviorGraphsByMap,
                [mapId]: { ...graph, edges: [...graph.edges, edge] },
              },
            };
          }, false, 'behaviors/addBehaviorEdge');
        },

        deleteBehaviorEdge: (mapId, edgeId) => {
          set((state) => {
            const graph = ensureGraph(state, mapId);
            return {
              behaviorGraphsByMap: {
                ...state.behaviorGraphsByMap,
                [mapId]: {
                  ...graph,
                  edges: graph.edges.filter(e => e.id !== edgeId),
                },
              },
            };
          }, false, 'behaviors/deleteBehaviorEdge');
        },

        setGraphForMap: (mapId, graph) => {
          set((state) => ({
            behaviorGraphsByMap: { ...state.behaviorGraphsByMap, [mapId]: graph },
          }), false, 'behaviors/setGraphForMap');
        },

        deleteGraphForMap: (mapId) => {
          set((state) => {
            const { [mapId]: _deleted, ...rest } = state.behaviorGraphsByMap;
            return { behaviorGraphsByMap: rest };
          }, false, 'behaviors/deleteGraphForMap');
        },

        importBehaviorGraphsByMap: (data) => {
          set(() => ({ behaviorGraphsByMap: data }), false, 'behaviors/importBehaviorGraphsByMap');
        },
      }),
      {
        name: 'accesscity-behaviors',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ behaviorGraphsByMap: state.behaviorGraphsByMap }),
      }
    ),
    { name: 'BehaviorsStore' }
  )
);
