import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { MapMetadata, MapData } from '@/types/map';

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
