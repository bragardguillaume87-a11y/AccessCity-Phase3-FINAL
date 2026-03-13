import { create, useStore } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { TemporalState } from 'zundo';
import type { MapMetadata, MapData } from '@/types/map';
import type { EntityInstance } from '@/types/sprite';

/**
 * Maps Store
 *
 * Manages topdown map metadata and tile data.
 * Pattern: temporal + persist + devtools (same as scenesStore).
 *
 * State split:
 * - maps[]         → metadata index (id, name, size, thumbnail)
 * - mapDataById{}  → full tilemap data (LDtk-compatible JSON)
 */

// ============================================================================
// HELPERS
// ============================================================================

function createEmptyMapData(id: string, name: string, widthTiles: number, heightTiles: number, tileSize: number): MapData {
  return {
    identifier: name,
    uid: id,
    worldX: 0,
    worldY: 0,
    pxWid: widthTiles * tileSize,
    pxHei: heightTiles * tileSize,
    __gridSize: tileSize,
    layerInstances: [
      {
        __identifier: 'Décor',
        __type: 'tiles',
        __gridSize: tileSize,
        __cWid: widthTiles,
        __cHei: heightTiles,
        gridTiles: [],
      },
      {
        __identifier: 'Collision',
        __type: 'collision',
        __gridSize: tileSize,
        __cWid: widthTiles,
        __cHei: heightTiles,
        gridTiles: [],
        intGrid: [],
      },
      {
        __identifier: 'Triggers',
        __type: 'triggers',
        __gridSize: tileSize,
        __cWid: widthTiles,
        __cHei: heightTiles,
        gridTiles: [],
      },
    ],
    _ac_dialogue_triggers: [],
    _ac_scene_exits: [],
    _ac_entities: [],
  };
}

// ============================================================================
// TYPES
// ============================================================================

interface MapsState {
  // State
  maps: MapMetadata[];
  mapDataById: Record<string, MapData>;

  // Queries
  getMapById: (mapId: string) => MapMetadata | undefined;
  getMapData: (mapId: string) => MapData | undefined;

  // Actions: CRUD
  addMap: (name?: string, widthTiles?: number, heightTiles?: number, tileSize?: number) => string;
  updateMapMetadata: (mapId: string, patch: Partial<MapMetadata>) => void;
  updateMapData: (mapId: string, data: MapData) => void;
  deleteMap: (mapId: string) => void;

  // Resize / rename
  resizeMap: (mapId: string, name: string, widthTiles: number, heightTiles: number, tileSize: number) => void;

  // Entities
  addEntity: (mapId: string, entity: EntityInstance) => void;
  updateEntity: (mapId: string, entityId: string, patch: Partial<EntityInstance>) => void;
  removeEntity: (mapId: string, entityId: string) => void;

  // Import
  importMaps: (maps: MapMetadata[], mapDataById: Record<string, MapData>) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useMapsStore = create<MapsState>()(
  devtools(
    persist(
      temporal(
        (set, get) => ({
          maps: [],
          mapDataById: {},

          getMapById: (mapId) => get().maps.find(m => m.id === mapId),
          getMapData: (mapId) => get().mapDataById[mapId],

          addMap: (name = 'Nouvelle carte', widthTiles = 20, heightTiles = 15, tileSize = 32) => {
            const id = `map-${Date.now()}`;
            const now = new Date().toISOString();
            const metadata: MapMetadata = { id, name, widthTiles, heightTiles, tileSize, createdAt: now, updatedAt: now };
            const data = createEmptyMapData(id, name, widthTiles, heightTiles, tileSize);
            set(
              (state) => ({
                maps: [...state.maps, metadata],
                mapDataById: { ...state.mapDataById, [id]: data },
              }),
              false,
              'maps/addMap'
            );
            return id;
          },

          updateMapMetadata: (mapId, patch) => {
            set(
              (state) => ({
                maps: state.maps.map(m =>
                  m.id === mapId ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m
                ),
              }),
              false,
              'maps/updateMapMetadata'
            );
          },

          updateMapData: (mapId, data) => {
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: data },
                maps: state.maps.map(m =>
                  m.id === mapId ? { ...m, updatedAt: new Date().toISOString() } : m
                ),
              }),
              false,
              'maps/updateMapData'
            );
          },

          deleteMap: (mapId) => {
            set(
              (state) => {
                const { [mapId]: _deleted, ...rest } = state.mapDataById;
                return {
                  maps: state.maps.filter(m => m.id !== mapId),
                  mapDataById: rest,
                };
              },
              false,
              'maps/deleteMap'
            );
          },

          resizeMap: (mapId, name, widthTiles, heightTiles, tileSize) => {
            const existingData = get().mapDataById[mapId];
            if (!existingData) return;

            const newLayers = existingData.layerInstances.map(layer => {
              // Trim tiles outside new bounds
              const gridTiles = layer.gridTiles.filter(
                t => t.cx < widthTiles && t.cy < heightTiles
              );
              // Recompute collision intGrid — convert old (cx,cy) to new flat indices
              let intGrid = layer.intGrid;
              if (layer.__type === 'collision' && layer.intGrid) {
                const oldCWid = layer.__cWid;
                intGrid = layer.intGrid
                  .map(idx => ({ cx: idx % oldCWid, cy: Math.floor(idx / oldCWid) }))
                  .filter(c => c.cx < widthTiles && c.cy < heightTiles)
                  .map(c => c.cy * widthTiles + c.cx);
              }
              return { ...layer, __gridSize: tileSize, __cWid: widthTiles, __cHei: heightTiles, gridTiles, intGrid };
            });

            const newData: MapData = {
              ...existingData,
              identifier: name,
              pxWid: widthTiles * tileSize,
              pxHei: heightTiles * tileSize,
              __gridSize: tileSize,
              layerInstances: newLayers,
            };
            const now = new Date().toISOString();
            set(
              state => ({
                maps: state.maps.map(m =>
                  m.id === mapId ? { ...m, name, widthTiles, heightTiles, tileSize, updatedAt: now } : m
                ),
                mapDataById: { ...state.mapDataById, [mapId]: newData },
              }),
              false,
              'maps/resizeMap'
            );
          },

          addEntity: (mapId, entity) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            set(
              state => ({
                mapDataById: {
                  ...state.mapDataById,
                  [mapId]: {
                    ...data,
                    _ac_entities: [...(data._ac_entities ?? []), entity],
                  },
                },
              }),
              false,
              'maps/addEntity'
            );
          },

          updateEntity: (mapId, entityId, patch) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            set(
              state => ({
                mapDataById: {
                  ...state.mapDataById,
                  [mapId]: {
                    ...data,
                    _ac_entities: (data._ac_entities ?? []).map(e =>
                      e.id === entityId ? { ...e, ...patch } : e
                    ),
                  },
                },
              }),
              false,
              'maps/updateEntity'
            );
          },

          removeEntity: (mapId, entityId) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            set(
              state => ({
                mapDataById: {
                  ...state.mapDataById,
                  [mapId]: {
                    ...data,
                    _ac_entities: (data._ac_entities ?? []).filter(e => e.id !== entityId),
                  },
                },
              }),
              false,
              'maps/removeEntity'
            );
          },

          importMaps: (maps, mapDataById) => {
            set(() => ({ maps, mapDataById }), false, 'maps/importMaps');
          },
        }),
        { limit: 30 }
      ),
      {
        name: 'accesscity-maps',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          maps: state.maps,
          mapDataById: state.mapDataById,
        }),
      }
    ),
    { name: 'MapsStore' }
  )
);

/**
 * Hook React pour accéder à l'état temporel (undo/redo) du store.
 * Utilise le pattern officiel zundo : useStore(store.temporal, selector).
 *
 * @example
 * const { undo, redo, pastStates, futureStates } = useTemporalMapsStore(s => s);
 */
export const useTemporalMapsStore = <T,>(
  selector: (state: TemporalState<MapsState>) => T
): T => useStore(useMapsStore.temporal, selector);
