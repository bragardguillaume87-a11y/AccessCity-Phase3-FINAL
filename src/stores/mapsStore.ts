import { create, useStore } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { TemporalState } from 'zundo';
import type { MapMetadata, MapData, DialogueTrigger, SceneExit, AudioZone } from '@/types/map';
import type {
  EntityInstance,
  ObjectInstance,
  ObjectDefinition,
  ObjectComponent,
  AnimatedSpriteComponent,
  SpriteComponent,
  ColliderComponent,
  DialogueComponent,
  PatrolComponent,
} from '@/types/sprite';

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

function createEmptyMapData(
  id: string,
  name: string,
  widthTiles: number,
  heightTiles: number,
  tileSize: number
): MapData {
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
        __identifier: 'Sol',
        __type: 'tiles',
        __gridSize: tileSize,
        __cWid: widthTiles,
        __cHei: heightTiles,
        gridTiles: [],
        _ac_colorIndex: 0,
      },
      {
        __identifier: 'Objets',
        __type: 'tiles',
        __gridSize: tileSize,
        __cWid: widthTiles,
        __cHei: heightTiles,
        gridTiles: [],
        _ac_colorIndex: 1,
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
    _ac_audio_zones: [],
    _ac_entities: [],
    _ac_objects: [],
  };
}

// ============================================================================
// TYPES
// ============================================================================

interface MapsState {
  // State
  maps: MapMetadata[];
  mapDataById: Record<string, MapData>;
  /** Blueprints d'objets partagés entre toutes les cartes du projet */
  objectDefinitions: ObjectDefinition[];

  // Queries
  getMapById: (mapId: string) => MapMetadata | undefined;
  getMapData: (mapId: string) => MapData | undefined;

  // Actions: CRUD
  addMap: (name?: string, widthTiles?: number, heightTiles?: number, tileSize?: number) => string;
  updateMapMetadata: (mapId: string, patch: Partial<MapMetadata>) => void;
  updateMapData: (mapId: string, data: MapData) => void;
  deleteMap: (mapId: string) => void;

  // Resize / rename
  resizeMap: (
    mapId: string,
    name: string,
    widthTiles: number,
    heightTiles: number,
    tileSize: number
  ) => void;

  // Entities (legacy — @deprecated, conservé pour migration)
  addEntity: (mapId: string, entity: EntityInstance) => void;
  updateEntity: (mapId: string, entityId: string, patch: Partial<EntityInstance>) => void;
  removeEntity: (mapId: string, entityId: string) => void;

  // ObjectDefinition CRUD (Phase 4)
  addObjectDefinition: (def: Omit<ObjectDefinition, 'id'>) => string;
  updateObjectDefinition: (defId: string, patch: Partial<Omit<ObjectDefinition, 'id'>>) => void;
  removeObjectDefinition: (defId: string) => void;

  // ObjectInstance CRUD per-map (Phase 4)
  addObjectInstance: (mapId: string, instance: ObjectInstance) => void;
  updateObjectInstance: (mapId: string, instanceId: string, patch: Partial<ObjectInstance>) => void;
  removeObjectInstance: (mapId: string, instanceId: string) => void;

  /** Migration automatique des EntityInstance legacy → ObjectInstance + ObjectDefinition */
  migrateEntitiesToObjects: () => void;

  // Dialogue triggers
  addDialogueTrigger: (mapId: string, trigger: DialogueTrigger) => void;
  updateDialogueTrigger: (
    mapId: string,
    triggerId: string,
    patch: Partial<DialogueTrigger>
  ) => void;
  removeDialogueTrigger: (mapId: string, triggerId: string) => void;

  // Scene exits
  addSceneExit: (mapId: string, exit: SceneExit) => void;
  updateSceneExit: (mapId: string, exitId: string, patch: Partial<SceneExit>) => void;
  removeSceneExit: (mapId: string, exitId: string) => void;

  // Audio zones
  addAudioZone: (mapId: string, zone: AudioZone) => void;
  updateAudioZone: (mapId: string, zoneId: string, patch: Partial<AudioZone>) => void;
  removeAudioZone: (mapId: string, zoneId: string) => void;

  // Tile layers (dynamic)
  addTileLayer: (mapId: string, name: string) => void;
  removeTileLayer: (mapId: string, identifier: string) => void;
  renameTileLayer: (mapId: string, identifier: string, newName: string) => void;
  reorderTileLayer: (mapId: string, fromIndex: number, toIndex: number) => void;
  updateLayerProps: (
    mapId: string,
    identifier: string,
    patch: { _ac_visible?: boolean; _ac_opacity?: number; _ac_locked?: boolean }
  ) => void;
  /** Moves all tiles at the given cells from one tile layer to another. */
  moveTilesToLayer: (
    mapId: string,
    cells: Array<{ cx: number; cy: number }>,
    fromLayerIdx: number,
    toLayerIdx: number
  ) => void;
  /** Removes a single tile from a specific tile layer by index. */
  eraseTileFromLayer: (mapId: string, cx: number, cy: number, layerIdx: number) => void;

  // Import
  importMaps: (
    maps: MapMetadata[],
    mapDataById: Record<string, MapData>,
    objectDefinitions?: ObjectDefinition[]
  ) => void;
}

// ============================================================================
// HELPERS — migration EntityInstance → ObjectInstance
// ============================================================================

/**
 * Construit la liste de composants d'un ObjectDefinition à partir d'une EntityInstance legacy.
 * Règle : behavior 'static' → AnimatedSprite + Collider
 *         behavior 'patrol' → AnimatedSprite + Patrol + Collider
 *         behavior 'dialogue' → AnimatedSprite + Dialogue + Collider
 */
function buildComponentsFromEntity(entity: EntityInstance): ObjectComponent[] {
  const components: ObjectComponent[] = [];

  // Composant visuel — AnimatedSprite si spriteAssetUrl présent
  if (entity.spriteAssetUrl) {
    const anim: AnimatedSpriteComponent = {
      type: 'animatedSprite',
      spriteAssetUrl: entity.spriteAssetUrl,
      spriteSheetConfigUrl: entity.spriteAssetUrl,
    };
    components.push(anim);
  } else {
    // Sprite vide (carré de fallback) — sera remplacé par l'utilisateur
    const sprite: SpriteComponent = {
      type: 'sprite',
      spriteAssetUrl: '',
      srcX: 0,
      srcY: 0,
      srcW: 32,
      srcH: 32,
    };
    components.push(sprite);
  }

  // Composant comportement
  if (entity.behavior === 'patrol' && entity.patrolTargetCx !== undefined) {
    const patrol: PatrolComponent = {
      type: 'patrol',
      targetCx: entity.patrolTargetCx ?? 0,
      targetCy: entity.patrolTargetCy ?? 0,
      speed: 60,
      loop: true,
    };
    components.push(patrol);
  } else if (entity.behavior === 'dialogue' && (entity.dialogueSceneId || entity.dialogueText)) {
    const dialogue: DialogueComponent = {
      type: 'dialogue',
      sceneId: entity.dialogueSceneId ?? '',
      text: entity.dialogueText,
    };
    components.push(dialogue);
  }

  // Collider par défaut (box)
  const collider: ColliderComponent = {
    type: 'collider',
    shape: 'box',
    offsetX: 0,
    offsetY: 0,
    w: 28,
    h: 28,
    radius: 14,
  };
  components.push(collider);

  return components;
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
          objectDefinitions: [],

          getMapById: (mapId) => get().maps.find((m) => m.id === mapId),
          getMapData: (mapId) => get().mapDataById[mapId],

          addMap: (name = 'Nouvelle carte', widthTiles = 20, heightTiles = 15, tileSize = 32) => {
            const id = `map-${Date.now()}`;
            const now = new Date().toISOString();
            const metadata: MapMetadata = {
              id,
              name,
              widthTiles,
              heightTiles,
              tileSize,
              createdAt: now,
              updatedAt: now,
            };
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
                maps: state.maps.map((m) =>
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
                maps: state.maps.map((m) =>
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
                  maps: state.maps.filter((m) => m.id !== mapId),
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

            const newLayers = existingData.layerInstances.map((layer) => {
              // Trim tiles outside new bounds
              const gridTiles = layer.gridTiles.filter(
                (t) => t.cx < widthTiles && t.cy < heightTiles
              );
              // Recompute collision intGrid — convert old (cx,cy) to new flat indices
              let intGrid = layer.intGrid;
              if (layer.__type === 'collision' && layer.intGrid) {
                const oldCWid = layer.__cWid;
                intGrid = layer.intGrid
                  .map((idx) => ({ cx: idx % oldCWid, cy: Math.floor(idx / oldCWid) }))
                  .filter((c) => c.cx < widthTiles && c.cy < heightTiles)
                  .map((c) => c.cy * widthTiles + c.cx);
              }
              return {
                ...layer,
                __gridSize: tileSize,
                __cWid: widthTiles,
                __cHei: heightTiles,
                gridTiles,
                intGrid,
              };
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
              (state) => ({
                maps: state.maps.map((m) =>
                  m.id === mapId
                    ? { ...m, name, widthTiles, heightTiles, tileSize, updatedAt: now }
                    : m
                ),
                mapDataById: { ...state.mapDataById, [mapId]: newData },
              }),
              false,
              'maps/resizeMap'
            );
          },

          addEntity: (mapId, entity) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: { ...data, _ac_entities: [...(data._ac_entities ?? []), entity] },
                  },
                };
              },
              false,
              'maps/addEntity'
            );
          },

          updateEntity: (mapId, entityId, patch) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_entities: (data._ac_entities ?? []).map((e) =>
                        e.id === entityId ? { ...e, ...patch } : e
                      ),
                    },
                  },
                };
              },
              false,
              'maps/updateEntity'
            );
          },

          removeEntity: (mapId, entityId) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_entities: (data._ac_entities ?? []).filter((e) => e.id !== entityId),
                    },
                  },
                };
              },
              false,
              'maps/removeEntity'
            );
          },

          // ── ObjectDefinition CRUD ────────────────────────────────────────────

          addObjectDefinition: (def) => {
            const id = `objdef-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const newDef: ObjectDefinition = { ...def, id };
            set(
              (state) => ({ objectDefinitions: [...state.objectDefinitions, newDef] }),
              false,
              'maps/addObjectDefinition'
            );
            return id;
          },

          updateObjectDefinition: (defId, patch) => {
            set(
              (state) => ({
                objectDefinitions: state.objectDefinitions.map((d) =>
                  d.id === defId ? { ...d, ...patch } : d
                ),
              }),
              false,
              'maps/updateObjectDefinition'
            );
          },

          removeObjectDefinition: (defId) => {
            set(
              (state) => {
                // Supprimer aussi toutes les instances qui référencent cette définition
                const newMapDataById: Record<string, MapData> = {};
                for (const [mapId, data] of Object.entries(state.mapDataById)) {
                  newMapDataById[mapId] = {
                    ...data,
                    _ac_objects: data._ac_objects.filter((i) => i.definitionId !== defId),
                  };
                }
                return {
                  objectDefinitions: state.objectDefinitions.filter((d) => d.id !== defId),
                  mapDataById: newMapDataById,
                };
              },
              false,
              'maps/removeObjectDefinition'
            );
          },

          // ── ObjectInstance CRUD (par carte) ──────────────────────────────────

          addObjectInstance: (mapId, instance) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: { ...data, _ac_objects: [...data._ac_objects, instance] },
                  },
                };
              },
              false,
              'maps/addObjectInstance'
            );
          },

          updateObjectInstance: (mapId, instanceId, patch) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_objects: data._ac_objects.map((i) =>
                        i.id === instanceId ? { ...i, ...patch } : i
                      ),
                    },
                  },
                };
              },
              false,
              'maps/updateObjectInstance'
            );
          },

          removeObjectInstance: (mapId, instanceId) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_objects: data._ac_objects.filter((i) => i.id !== instanceId),
                    },
                  },
                };
              },
              false,
              'maps/removeObjectInstance'
            );
          },

          // ── Migration EntityInstance → ObjectInstance ────────────────────────

          migrateEntitiesToObjects: () => {
            const state = get();
            const newDefs: ObjectDefinition[] = [...state.objectDefinitions];
            // Lookup: clé = "spriteAssetUrl::behavior" → defId
            const defKeyToId = new Map<string, string>();
            for (const def of newDefs) {
              const spriteComp = def.components.find(
                (c): c is AnimatedSpriteComponent | SpriteComponent =>
                  c.type === 'animatedSprite' || c.type === 'sprite'
              );
              const url = spriteComp
                ? 'spriteSheetConfigUrl' in spriteComp
                  ? spriteComp.spriteSheetConfigUrl
                  : spriteComp.spriteAssetUrl
                : '';
              defKeyToId.set(url, def.id);
            }

            const newMapDataById: Record<string, MapData> = {};
            let didMigrate = false;

            for (const [mapId, mapData] of Object.entries(state.mapDataById)) {
              const entities = mapData._ac_entities ?? [];
              // Ne migrer que si _ac_entities non vide et _ac_objects vide
              if (entities.length === 0 || mapData._ac_objects.length > 0) {
                newMapDataById[mapId] = mapData;
                continue;
              }

              didMigrate = true;
              const instances: ObjectInstance[] = [];

              for (const entity of entities) {
                const key = entity.spriteAssetUrl;
                let defId = defKeyToId.get(key);

                if (!defId) {
                  const components = buildComponentsFromEntity(entity);
                  const defName =
                    entity.displayName ??
                    (entity.spriteAssetUrl
                      ? (entity.spriteAssetUrl
                          .split('/')
                          .pop()
                          ?.replace(/\.[^.]+$/, '') ?? 'Objet')
                      : 'Objet sans sprite');

                  const newDef: ObjectDefinition = {
                    id: `objdef-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    displayName: defName,
                    components,
                    category:
                      entity.behavior === 'static'
                        ? 'npc'
                        : entity.behavior === 'patrol'
                          ? 'npc'
                          : 'npc',
                    thumbnailUrl: entity.spriteAssetUrl || undefined,
                  };
                  newDefs.push(newDef);
                  defKeyToId.set(key, newDef.id);
                  defId = newDef.id;
                }

                const instance: ObjectInstance = {
                  id: entity.id,
                  definitionId: defId,
                  cx: entity.cx,
                  cy: entity.cy,
                  facing: entity.facing,
                  overrides: entity.dialogueText
                    ? { dialogueText: entity.dialogueText }
                    : undefined,
                };
                instances.push(instance);
              }

              newMapDataById[mapId] = {
                ...mapData,
                _ac_objects: instances,
                // _ac_entities conservé en read-only pour rollback d'urgence
              };
            }

            if (!didMigrate) return;
            set(
              () => ({ objectDefinitions: newDefs, mapDataById: newMapDataById }),
              false,
              'maps/migrateEntitiesToObjects'
            );
          },

          addDialogueTrigger: (mapId, trigger) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_dialogue_triggers: [...data._ac_dialogue_triggers, trigger],
                    },
                  },
                };
              },
              false,
              'maps/addDialogueTrigger'
            );
          },

          updateDialogueTrigger: (mapId, triggerId, patch) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_dialogue_triggers: data._ac_dialogue_triggers.map((t) =>
                        t.id === triggerId ? { ...t, ...patch } : t
                      ),
                    },
                  },
                };
              },
              false,
              'maps/updateDialogueTrigger'
            );
          },

          removeDialogueTrigger: (mapId, triggerId) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_dialogue_triggers: data._ac_dialogue_triggers.filter(
                        (t) => t.id !== triggerId
                      ),
                    },
                  },
                };
              },
              false,
              'maps/removeDialogueTrigger'
            );
          },

          addSceneExit: (mapId, exit) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_scene_exits: [...data._ac_scene_exits, exit],
                    },
                  },
                };
              },
              false,
              'maps/addSceneExit'
            );
          },

          updateSceneExit: (mapId, exitId, patch) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_scene_exits: data._ac_scene_exits.map((e) =>
                        e.id === exitId ? { ...e, ...patch } : e
                      ),
                    },
                  },
                };
              },
              false,
              'maps/updateSceneExit'
            );
          },

          removeSceneExit: (mapId, exitId) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_scene_exits: data._ac_scene_exits.filter((e) => e.id !== exitId),
                    },
                  },
                };
              },
              false,
              'maps/removeSceneExit'
            );
          },

          addAudioZone: (mapId, zone) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_audio_zones: [...(data._ac_audio_zones ?? []), zone],
                    },
                  },
                };
              },
              false,
              'maps/addAudioZone'
            );
          },

          updateAudioZone: (mapId, zoneId, patch) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_audio_zones: (data._ac_audio_zones ?? []).map((z) =>
                        z.id === zoneId ? { ...z, ...patch } : z
                      ),
                    },
                  },
                };
              },
              false,
              'maps/updateAudioZone'
            );
          },

          removeAudioZone: (mapId, zoneId) => {
            set(
              (state) => {
                const data = state.mapDataById[mapId];
                if (!data) return state;
                return {
                  mapDataById: {
                    ...state.mapDataById,
                    [mapId]: {
                      ...data,
                      _ac_audio_zones: (data._ac_audio_zones ?? []).filter((z) => z.id !== zoneId),
                    },
                  },
                };
              },
              false,
              'maps/removeAudioZone'
            );
          },

          addTileLayer: (mapId, name) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            // Insert before the first non-tiles layer so tile layers stay grouped at the top
            const insertIdx = data.layerInstances.findIndex((l) => l.__type !== 'tiles');
            const pos = insertIdx >= 0 ? insertIdx : data.layerInstances.length;
            const tileLayers = data.layerInstances.filter((l) => l.__type === 'tiles');
            const newLayer = {
              __identifier: name,
              __type: 'tiles' as const,
              __gridSize: data.__gridSize,
              __cWid: Math.floor(data.pxWid / data.__gridSize),
              __cHei: Math.floor(data.pxHei / data.__gridSize),
              gridTiles: [],
              _ac_colorIndex: tileLayers.length, // auto-assign next color index
            };
            const layerInstances = [
              ...data.layerInstances.slice(0, pos),
              newLayer,
              ...data.layerInstances.slice(pos),
            ];
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: { ...data, layerInstances } },
              }),
              false,
              'maps/addTileLayer'
            );
          },

          removeTileLayer: (mapId, identifier) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            // Never remove if it's the last tile layer
            const tileLayers = data.layerInstances.filter((l) => l.__type === 'tiles');
            if (tileLayers.length <= 1) return;
            const layerInstances = data.layerInstances.filter(
              (l) => !(l.__type === 'tiles' && l.__identifier === identifier)
            );
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: { ...data, layerInstances } },
              }),
              false,
              'maps/removeTileLayer'
            );
          },

          renameTileLayer: (mapId, identifier, newName) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            const layerInstances = data.layerInstances.map((l) =>
              l.__type === 'tiles' && l.__identifier === identifier
                ? { ...l, __identifier: newName }
                : l
            );
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: { ...data, layerInstances } },
              }),
              false,
              'maps/renameTileLayer'
            );
          },

          reorderTileLayer: (mapId, fromIndex, toIndex) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            const tileLayers = data.layerInstances.filter((l) => l.__type === 'tiles');
            const otherLayers = data.layerInstances.filter((l) => l.__type !== 'tiles');
            if (fromIndex < 0 || fromIndex >= tileLayers.length) return;
            if (toIndex < 0 || toIndex >= tileLayers.length) return;
            const reordered = [...tileLayers];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);
            // Tile layers stay at top, system layers at bottom (same as before)
            const layerInstances = [...reordered, ...otherLayers];
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: { ...data, layerInstances } },
              }),
              false,
              'maps/reorderTileLayer'
            );
          },

          moveTilesToLayer: (mapId, cells, fromLayerIdx, toLayerIdx) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            const tileLayers = data.layerInstances.filter((l) => l.__type === 'tiles');
            if (fromLayerIdx === toLayerIdx) return;
            if (fromLayerIdx < 0 || fromLayerIdx >= tileLayers.length) return;
            if (toLayerIdx < 0 || toLayerIdx >= tileLayers.length) return;
            const fromLayer = tileLayers[fromLayerIdx];
            const toLayer = tileLayers[toLayerIdx];
            const cellSet = new Set(cells.map((c) => `${c.cx},${c.cy}`));
            const tilesToMove = fromLayer.gridTiles.filter((t) => cellSet.has(`${t.cx},${t.cy}`));
            const layerInstances = data.layerInstances.map((l) => {
              if (l === fromLayer)
                return {
                  ...l,
                  gridTiles: l.gridTiles.filter((t) => !cellSet.has(`${t.cx},${t.cy}`)),
                };
              if (l === toLayer)
                return {
                  ...l,
                  gridTiles: [
                    ...l.gridTiles.filter((t) => !cellSet.has(`${t.cx},${t.cy}`)),
                    ...tilesToMove,
                  ],
                };
              return l;
            });
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: { ...data, layerInstances } },
              }),
              false,
              'maps/moveTilesToLayer'
            );
          },

          eraseTileFromLayer: (mapId, cx, cy, layerIdx) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            const tileLayers = data.layerInstances.filter((l) => l.__type === 'tiles');
            const targetLayer = tileLayers[layerIdx];
            if (!targetLayer) return;
            const layerInstances = data.layerInstances.map((l) =>
              l === targetLayer
                ? { ...l, gridTiles: l.gridTiles.filter((t) => !(t.cx === cx && t.cy === cy)) }
                : l
            );
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: { ...data, layerInstances } },
              }),
              false,
              'maps/eraseTileFromLayer'
            );
          },

          updateLayerProps: (mapId, identifier, patch) => {
            const data = get().mapDataById[mapId];
            if (!data) return;
            const layerInstances = data.layerInstances.map((l) =>
              l.__identifier === identifier ? { ...l, ...patch } : l
            );
            set(
              (state) => ({
                mapDataById: { ...state.mapDataById, [mapId]: { ...data, layerInstances } },
              }),
              false,
              'maps/updateLayerProps'
            );
          },

          importMaps: (maps, mapDataById, objectDefinitions = []) => {
            set(() => ({ maps, mapDataById, objectDefinitions }), false, 'maps/importMaps');
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
          objectDefinitions: state.objectDefinitions,
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
export const useTemporalMapsStore = <T>(selector: (state: TemporalState<MapsState>) => T): T =>
  useStore(useMapsStore.temporal, selector);
