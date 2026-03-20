/**
 * MapCanvas — react-konva Stage avec 3 couches (décor, collision, triggers)
 *
 * Architecture retenue (Konva best practice 2024) :
 * - 300 tuiles (20×15) → <Image>/<Rect> individuels avec listening={false}
 * - Images préchargées via useTileset (Map<url, HTMLImageElement>)
 * - Zoom via onWheel (zoom-to-pointer), pan via draggable Stage
 * - Coordonnées grille : Math.floor((screenPos - stagePos) / scale / tileSize)
 *
 * @module components/modules/TopdownEditor/MapCanvas
 */

import { useRef, useCallback, useState, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Line,
  Text,
  Circle,
  Group,
  Transformer,
} from 'react-konva';
import Konva from 'konva';
import type {
  MapData,
  LayerType,
  EntityInstance,
  ObjectInstance,
  ObjectDefinition,
} from '@/types/map';
import type { SceneEffectConfig } from '@/types/sceneEffect';
import type { SpriteSheetConfig } from '@/types/sprite';
import type { TileImageCache } from './hooks/useTileset';
import type { EditorTool } from './hooks/useMapEditor';
import type { SelectedTile } from '@/types/tileset';
import SceneEffectCanvas from '@/components/ui/SceneEffectCanvas';
import {
  MAP_ZOOM,
  MAP_LAYER_COLORS,
  MAP_CANVAS_COLORS,
  MAP_DIM_FACTOR,
} from '@/config/mapEditorConfig';

// ============================================================================
// PROPS
// ============================================================================

interface MapCanvasProps {
  mapData: MapData;
  activeLayer: LayerType;
  activeTool: EditorTool;
  imageCache: TileImageCache;
  zoom: number;
  stagePos: { x: number; y: number };
  hoveredCell: { cx: number; cy: number } | null;
  containerWidth: number;
  containerHeight: number;
  showGrid: boolean;
  dimInactiveLayers: boolean;
  onZoomChange: (zoom: number) => void;
  onStagePosChange: (pos: { x: number; y: number }) => void;
  onCellHover: (cell: { cx: number; cy: number } | null) => void;
  onCellPaint: (cx: number, cy: number) => void;
  onCellErase: (cx: number, cy: number) => void;
  onCellFill: (cx: number, cy: number) => void;
  /** Appelé quand l'outil pipette ou Alt+clic détecte une tuile à (cx, cy) */
  onEyedropperPick?: (cx: number, cy: number) => void;
  /** Entités placées sur la carte (rendu dans l'éditeur) — @deprecated utiliser objects */
  entities?: EntityInstance[];
  /**
   * Objets Phase 4 — instances avec leur définition résolue (composants).
   * Priorité sur entities si présent.
   */
  objects?: Array<{ instance: ObjectInstance; definition: ObjectDefinition }>;
  /** Entité actuellement sélectionnée (affiche un contour violet) */
  selectedEntityId?: string | null;
  /** Appelé quand l'utilisateur clique sur une entité */
  onEntityClick?: (entityId: string) => void;
  /** Appelé quand l'utilisateur fait un clic droit sur une entité (coordonnées écran) */
  onEntityContextMenu?: (entityId: string, screenX: number, screenY: number) => void;
  /** Appelé quand l'utilisateur supprime une entité (clic droit ou Suppr) */
  onEntityDelete?: (entityId: string) => void;
  /** Appelé quand l'utilisateur déplace une entité par drag (coordonnées tuile) */
  onEntityMove?: (entityId: string, cx: number, cy: number) => void;
  /** Appelé quand l'utilisateur déplace une zone trigger par drag (pixels monde) */
  onZoneMove?: (kind: 'dialogue' | 'exit' | 'audio', zoneId: string, x: number, y: number) => void;
  /** ID de la zone sélectionnée (affiche un contour de sélection violet) */
  selectedZoneId?: string | null;
  /** Appelé quand l'utilisateur clique sur une zone */
  onZoneClick?: (kind: 'dialogue' | 'exit' | 'audio', zoneId: string) => void;
  /**
   * Appelé quand l'utilisateur dessine une nouvelle zone par cliquer-glisser sur le canvas
   * (uniquement quand activeLayer === 'triggers').
   * Coordonnées en tuiles.
   */
  onZoneDraw?: (xTile: number, yTile: number, wTile: number, hTile: number) => void;
  /** Appelé quand l'utilisateur redimensionne une zone via la poignée SE (pixels monde) */
  onZoneResize?: (
    kind: 'dialogue' | 'exit' | 'audio',
    zoneId: string,
    newWidth: number,
    newHeight: number
  ) => void;
  /** Position de départ du joueur (tuiles). Absent → (2, 2) implicite. */
  playerStartCx?: number;
  playerStartCy?: number;
  /** Appelé quand l'utilisateur redimensionne la carte via les poignées */
  onResizeMap?: (newWidthTiles: number, newHeightTiles: number) => void;
  /** Index de la couche tuile active (dans le tableau filtré tiles uniquement) */
  activeTileLayerIndex?: number;
  /** Appelé quand l'utilisateur déplace une tuile vers un autre calque via le menu clic droit */
  onTileMoveToLayer?: (cx: number, cy: number, fromLayerIdx: number, toLayerIdx: number) => void;
  /** Appelé quand l'utilisateur efface une tuile depuis un calque spécifique (menu clic droit) */
  onCellEraseFromLayer?: (cx: number, cy: number, layerIdx: number) => void;
  /** Effet atmosphérique de la carte — overlay canvas au-dessus du Stage. */
  sceneEffect?: SceneEffectConfig;
  /** Affiche les sprites animés des entités (walk_down) à la place des marqueurs couleur */
  showSpriteVisuals?: boolean;
  /** Map URL → SpriteSheetConfig pour le rendu des sprites sur le canvas */
  spriteConfigs?: Record<string, SpriteSheetConfig>;
  /** Tuile sélectionnée — pour l'aperçu pinceau multi-tuiles sur hover */
  selectedTile?: SelectedTile | null;
  /**
   * Quand non-null, affiche un contour pointillé violet sur le canvas indiquant
   * la zone en cours d'édition dans TriggerZonePanel (coordonnées en tuiles).
   */
  editingZoneRect?: { xTile: number; yTile: number; wTile: number; hTile: number } | null;
  /** Rect de sélection multi-tuiles (outil sélection) en coordonnées tuile */
  selectionRect?: { cx: number; cy: number; cw: number; ch: number } | null;
  /** Appelé quand la sélection est finalisée ou effacée */
  onSelectionChange?: (rect: { cx: number; cy: number; cw: number; ch: number } | null) => void;
  /** Appelé quand les tuiles sélectionnées sont déplacées (cut-paste) */
  onSelectionMove?: (
    fromRect: { cx: number; cy: number; cw: number; ch: number },
    toCx: number,
    toCy: number
  ) => void;
  /**
   * Appelé quand l'utilisateur glisse-dépose un objet depuis ObjectsPanel sur le canvas.
   * @param definitionId — ID de la définition d'objet droppée
   * @param cx — colonne tuile de destination
   * @param cy — ligne tuile de destination
   */
  onObjectDrop?: (definitionId: string, cx: number, cy: number) => void;
  /**
   * Appelé quand l'utilisateur redimensionne ou fait pivoter un objet via les poignées GDevelop.
   * scaleX, scaleY en fraction de tileSize. rotation en degrés (0–360).
   */
  onObjectTransform?: (objectId: string, scaleX: number, scaleY: number, rotation: number) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function screenToGrid(
  screenX: number,
  screenY: number,
  stageX: number,
  stageY: number,
  scale: number,
  tileSize: number
): { cx: number; cy: number } {
  const worldX = (screenX - stageX) / scale;
  const worldY = (screenY - stageY) / scale;
  return {
    cx: Math.floor(worldX / tileSize),
    cy: Math.floor(worldY / tileSize),
  };
}

function isInBounds(cx: number, cy: number, data: MapData): boolean {
  const w = data.__gridSize > 0 ? Math.floor(data.pxWid / data.__gridSize) : 0;
  const h = data.__gridSize > 0 ? Math.floor(data.pxHei / data.__gridSize) : 0;
  return cx >= 0 && cy >= 0 && cx < w && cy < h;
}

// ── Speech bubble helpers ──────────────────────────────────────────────────

// Badge emoji — fond BLANC avec bordure colorée par type (pas de vert dominant)
// Les badges sont rendus dans une couche séparée à opacité 1 (non affectée par MAP_DIM_FACTOR)
const ZONE_CONFIG = {
  dialogue: {
    coverFill: 'rgba(255,255,255,0.06)',
    coverStroke: 'rgba(255,255,255,0.45)',
    badgeStroke: '#22c55e', // bordure verte — identifiant type
    shadowColor: 'rgba(0,0,0,0.50)',
    emoji: '💬',
  },
  exit: {
    coverFill: 'rgba(251,191,36,0.07)',
    coverStroke: 'rgba(251,191,36,0.55)',
    badgeStroke: '#f59e0b',
    shadowColor: 'rgba(0,0,0,0.50)',
    emoji: '🚪',
  },
  audio: {
    coverFill: 'rgba(167,139,250,0.07)',
    coverStroke: 'rgba(167,139,250,0.55)',
    badgeStroke: '#a78bfa',
    shadowColor: 'rgba(0,0,0,0.50)',
    emoji: '🔊',
  },
} as const;

// ============================================================================
// STABLE EMPTY REFERENCES (évite de briser React.memo avec des [] inline)
// ============================================================================

const EMPTY_GRID_TILES: MapData['layerInstances'][number]['gridTiles'] = [];

// ============================================================================
// MEMOIZED SUB-LAYERS (évite N×100 diffs/frame sur hoveredCell — konva-patterns §9)
// ============================================================================

/** Couche décor tuiles — ne re-rend que si les données de tuiles changent. */
const TilesLayerMemo = memo(function TilesLayer({
  tiles,
  imageCache,
  tileSize,
  opacity,
  visible,
}: {
  tiles: MapData['layerInstances'][number]['gridTiles'];
  imageCache: TileImageCache;
  tileSize: number;
  opacity: number;
  visible: boolean;
}) {
  return (
    <Layer listening={false} opacity={opacity} visible={visible}>
      {tiles.map((tile, idx) => {
        const img = imageCache.get(tile.src);
        if (!img) return null;
        const flipH = (tile.f & 1) !== 0;
        const flipV = (tile.f & 2) !== 0;
        return (
          <KonvaImage
            key={`tile-${idx}`}
            x={tile.cx * tileSize + (flipH ? tileSize : 0)}
            y={tile.cy * tileSize + (flipV ? tileSize : 0)}
            scaleX={flipH ? -1 : 1}
            scaleY={flipV ? -1 : 1}
            width={tileSize}
            height={tileSize}
            image={img}
            crop={
              tile.tileW
                ? {
                    x: tile.tileX ?? 0,
                    y: tile.tileY ?? 0,
                    width: tile.tileW,
                    height: tile.tileH ?? tile.tileW,
                  }
                : undefined
            }
            listening={false}
          />
        );
      })}
    </Layer>
  );
});

/** Couche collision — ne re-rend que si les cellules de collision changent. */
const CollisionLayerMemo = memo(function CollisionLayer({
  cells,
  tileSize,
  opacity,
  visible,
}: {
  cells: { cx: number; cy: number }[];
  tileSize: number;
  opacity: number;
  visible: boolean;
}) {
  return (
    <Layer listening={false} opacity={opacity} visible={visible}>
      {cells.map(({ cx, cy }) => (
        <Rect
          key={`col-${cx}-${cy}`}
          x={cx * tileSize}
          y={cy * tileSize}
          width={tileSize}
          height={tileSize}
          fill={MAP_LAYER_COLORS.collision.fill}
          listening={false}
        />
      ))}
    </Layer>
  );
});

// ============================================================================
// COMPONENT
// ============================================================================

export default function MapCanvas({
  mapData,
  activeLayer,
  activeTool,
  imageCache,
  zoom,
  stagePos,
  hoveredCell,
  containerWidth,
  containerHeight,
  showGrid,
  dimInactiveLayers,
  onZoomChange,
  onStagePosChange,
  onCellHover,
  onCellPaint,
  onCellErase,
  onCellFill,
  onEyedropperPick,
  entities,
  objects,
  selectedEntityId,
  onEntityClick,
  onEntityContextMenu,
  onEntityDelete,
  onEntityMove,
  onZoneMove,
  selectedZoneId,
  onZoneClick,
  onZoneDraw,
  onZoneResize,
  playerStartCx = 2,
  playerStartCy = 2,
  onResizeMap,
  activeTileLayerIndex = 0,
  onTileMoveToLayer,
  onCellEraseFromLayer,
  sceneEffect,
  showSpriteVisuals = false,
  spriteConfigs,
  selectedTile,
  editingZoneRect,
  selectionRect,
  onSelectionChange,
  onSelectionMove,
  onObjectDrop,
  onObjectTransform,
}: MapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const isMouseDown = useRef(false);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // ── GDevelop-style transform handles (Phase 4 objects) ────────────────────
  const transformerRef = useRef<Konva.Transformer>(null);
  // Map instance.id → KonvaImage node — pour attacher le Transformer
  const objNodeRefs = useRef<Map<string, Konva.Image>>(new Map());

  // ── QoL navigation state ──────────────────────────────────────────────────
  // isRightErasing : clic droit maintenu → efface en continu (LDtk style)
  // isSpacePanning : espace tenu → pan quel que soit l'outil actif
  // isMiddlePanning : clic milieu → pan (Photoshop/Blender style)
  const [isRightErasing, setIsRightErasing] = useState(false);

  // ── Resize handles state ───────────────────────────────────────────────────
  // resizeDrag : preview ghost rect pendant le drag d'une poignée
  // resizeCursor : override curseur quand on survole une poignée
  const [resizeDrag, setResizeDrag] = useState<{
    previewW: number; // world pixels
    previewH: number; // world pixels
  } | null>(null);
  const [resizeCursor, setResizeCursor] = useState<string | null>(null);
  const [entityCursor, setEntityCursor] = useState<'grab' | 'grabbing' | null>(null);

  // ── Sprite animation tick (~8fps) — incrémenté quand showSpriteVisuals actif ─
  const [entityAnimTick, setEntityAnimTick] = useState(0);
  useEffect(() => {
    if (!showSpriteVisuals) return;
    const id = setInterval(() => setEntityAnimTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, [showSpriteVisuals]);
  // ── Selection tool state ────────────────────────────────────────────────────
  // selDrawing — rectangle de sélection en cours de dessin (coords tuile)
  const [selDrawing, setSelDrawing] = useState<{
    startCx: number;
    startCy: number;
    curCx: number;
    curCy: number;
  } | null>(null);
  // selMoveDrag — déplacement d'une sélection finalisée (delta en tuiles)
  const [selMoveDrag, setSelMoveDrag] = useState<{
    startCx: number; // cellule mousedown
    startCy: number;
    curCx: number; // cellule courante
    curCy: number;
  } | null>(null);

  // drawingZone — rectangle en cours de dessin par drag (world pixels)
  const [drawingZone, setDrawingZone] = useState<{
    sx: number;
    sy: number;
    ex: number;
    ey: number;
  } | null>(null);
  // resizePreview — aperçu dimensions pendant drag poignée SE (world pixels)
  const [resizePreview, setResizePreview] = useState<{
    zoneId: string;
    w: number;
    h: number;
  } | null>(null);
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const middlePanStart = useRef<{
    pointerX: number;
    pointerY: number;
    stageX: number;
    stageY: number;
  } | null>(null);
  const zoneLayerRef = useRef<Konva.Layer>(null);

  // ── Tile context menu (right-click → move to layer) ──────────────────────
  const [tileContextMenu, setTileContextMenu] = useState<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    fromLayerIdx: number;
  } | null>(null);
  useEffect(() => {
    if (!tileContextMenu) return;
    const close = () => setTileContextMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [tileContextMenu]);

  // ── Synchronise le Transformer Konva avec l'objet sélectionné ───────────────
  // Garde konva-patterns §12 : vérifier getStage() avant d'attacher (StrictMode).
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (!tr.getStage()) return; // garde StrictMode — node fantôme du 1er montage
    const node = selectedEntityId ? objNodeRefs.current.get(selectedEntityId) : undefined;
    if (node && onObjectTransform) {
      tr.nodes([node]);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedEntityId, onObjectTransform]);

  // NOTE: stage.destroy() is intentionally NOT called here.
  // react-konva 19 handles Stage cleanup automatically on unmount.
  // Explicit destroy() + React 19 Strict Mode = Stage destroyed on fake-unmount
  // before the remount, leaving the canvas permanently blank in development.
  // konva-patterns §7 applies only to Konva used outside of react-konva.

  // Track Space key (keydown/keyup) pour le pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault(); // bloquer le scroll navigateur
        setIsSpacePanning(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePanning(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const tileSize = mapData.__gridSize;
  const gridW = tileSize > 0 ? Math.floor(mapData.pxWid / tileSize) : 0;
  const gridH = tileSize > 0 ? Math.floor(mapData.pxHei / tileSize) : 0;

  // ── Layers data ──────────────────────────────────────────────────────────

  const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
  const collisionLayer = mapData.layerInstances.find((l) => l.__type === 'collision');
  const triggersLayer = mapData.layerInstances.find((l) => l.__type === 'triggers');

  // ── Pulse animation des badges zone (Konva.Animation = 0 re-render React) ──
  useEffect(() => {
    const layer = zoneLayerRef.current;
    if (!layer || !(triggersLayer?._ac_visible ?? true)) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const s = 1 + Math.sin(frame.time / 700) * 0.07;
      layer.find('.zone-badge').forEach((node) => {
        node.scaleX(s);
        node.scaleY(s);
      });
    }, layer);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [triggersLayer?._ac_visible]);

  // Decode collision intGrid → array de {cx, cy}
  // useMemo : stabilise la référence → CollisionLayerMemo skip le re-render sur hoveredCell
  const collisionCells = useMemo(
    () =>
      (collisionLayer?.intGrid ?? []).map((idx) => ({
        cx: idx % (collisionLayer?.__cWid ?? gridW),
        cy: Math.floor(idx / (collisionLayer?.__cWid ?? gridW)),
      })),
    [collisionLayer?.intGrid, collisionLayer?.__cWid, gridW]
  );

  // Dialogue trigger zones
  const triggerZones = mapData._ac_dialogue_triggers;
  const exitZones = mapData._ac_scene_exits;
  const audioZones = mapData._ac_audio_zones ?? [];

  // Effective opacities — lues depuis les champs _ac_* de chaque LayerInstance
  const collisionBase = collisionLayer?._ac_opacity ?? 1.0;
  const collisionOp =
    dimInactiveLayers && activeLayer !== 'collision'
      ? collisionBase * MAP_DIM_FACTOR
      : collisionBase;
  const triggersBase = triggersLayer?._ac_opacity ?? 1.0;
  const triggersOp =
    dimInactiveLayers && activeLayer !== 'triggers' ? triggersBase * MAP_DIM_FACTOR : triggersBase;

  // ── Event handlers ────────────────────────────────────────────────────────

  const getGridCell = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return null;
      const pos = stage.getPointerPosition();
      if (!pos) return null;
      return screenToGrid(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX(), tileSize);
    },
    [tileSize]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // ── Clic milieu pan (A3) ────────────────────────────────────────────────
      if (isMiddlePanning && middlePanStart.current) {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        const { pointerX, pointerY, stageX, stageY } = middlePanStart.current;
        onStagePosChange({
          x: stageX + (pos.x - pointerX),
          y: stageY + (pos.y - pointerY),
        });
        return;
      }

      const cell = getGridCell(e);
      if (!cell || !isInBounds(cell.cx, cell.cy, mapData)) {
        onCellHover(null);
        return;
      }
      onCellHover(cell);

      // Clic droit maintenu = effacer en continu (A1)
      if (isRightErasing) {
        onCellErase(cell.cx, cell.cy);
        return;
      }

      // Dessin de zone en cours — mettre à jour le coin opposé (snappé à la grille)
      if (drawingZone && isMouseDown.current) {
        const ts = mapData.__gridSize;
        setDrawingZone((prev) =>
          prev
            ? {
                ...prev,
                ex: (cell.cx + 1) * ts,
                ey: (cell.cy + 1) * ts,
              }
            : null
        );
        return;
      }

      // Outil sélection — mettre à jour le drawing ou le move drag
      if (isMouseDown.current && activeTool === 'selection') {
        if (selDrawing) {
          setSelDrawing((prev) => (prev ? { ...prev, curCx: cell.cx, curCy: cell.cy } : null));
        } else if (selMoveDrag) {
          setSelMoveDrag((prev) => (prev ? { ...prev, curCx: cell.cx, curCy: cell.cy } : null));
        }
        return;
      }

      // Clic gauche maintenu — paint/erase continu (fill uniquement au clic)
      if (isMouseDown.current && activeTool === 'paint') {
        onCellPaint(cell.cx, cell.cy);
      } else if (isMouseDown.current && activeTool === 'erase') {
        onCellErase(cell.cx, cell.cy);
      }
    },
    [
      isMiddlePanning,
      isRightErasing,
      drawingZone,
      selDrawing,
      selMoveDrag,
      getGridCell,
      mapData,
      onCellHover,
      onCellPaint,
      onCellErase,
      onStagePosChange,
      activeTool,
    ]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // ── Clic milieu (A3) — démarrer pan ────────────────────────────────────
      if (e.evt.button === 1) {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        middlePanStart.current = {
          pointerX: pos.x,
          pointerY: pos.y,
          stageX: stage.x(),
          stageY: stage.y(),
        };
        setIsMiddlePanning(true);
        return;
      }

      // ── Clic droit (A1) — entité > menu calque > effacer tuile ─────────────
      if (e.evt.button === 2) {
        const cell = getGridCell(e);
        if (cell && isInBounds(cell.cx, cell.cy, mapData)) {
          // Priority 1: delete entity
          const entityAtCell = entities?.find((ent) => ent.cx === cell.cx && ent.cy === cell.cy);
          if (entityAtCell && onEntityDelete) {
            onEntityDelete(entityAtCell.id);
            return;
          }
          // Priority 2: context menu (tiles layer, tile exists in any layer at cell)
          if (activeLayer === 'tiles') {
            const tLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
            // Check active layer first, then fall back to any other layer
            let fromLayerIdx = -1;
            if (
              tLayers[activeTileLayerIndex]?.gridTiles.some(
                (t) => t.cx === cell.cx && t.cy === cell.cy
              )
            ) {
              fromLayerIdx = activeTileLayerIndex;
            } else {
              for (let i = 0; i < tLayers.length; i++) {
                if (
                  i !== activeTileLayerIndex &&
                  tLayers[i].gridTiles.some((t) => t.cx === cell.cx && t.cy === cell.cy)
                ) {
                  fromLayerIdx = i;
                  break;
                }
              }
            }
            if (fromLayerIdx >= 0) {
              setTileContextMenu({
                x: e.evt.clientX,
                y: e.evt.clientY,
                cx: cell.cx,
                cy: cell.cy,
                fromLayerIdx,
              });
              return; // show menu instead of erasing
            }
          }
        }
        setIsRightErasing(true);
        if (cell && isInBounds(cell.cx, cell.cy, mapData)) onCellErase(cell.cx, cell.cy);
        return;
      }

      // ── Clic gauche — outils normaux ───────────────────────────────────────
      if (e.evt.button !== 0) return;
      isMouseDown.current = true;
      const cell = getGridCell(e);
      if (!cell || !isInBounds(cell.cx, cell.cy, mapData)) return;

      // Alt+clic = pipette contextuelle (LDtk style) — quel que soit l'outil actif
      if (e.evt.altKey && onEyedropperPick) {
        e.evt.preventDefault();
        onEyedropperPick(cell.cx, cell.cy);
        return;
      }

      // Couche triggers + outil paint = démarrer le dessin d'une zone par drag
      if (activeLayer === 'triggers' && activeTool === 'paint') {
        const ts = mapData.__gridSize;
        const wx = cell.cx * ts;
        const wy = cell.cy * ts;
        setDrawingZone({ sx: wx, sy: wy, ex: wx + ts, ey: wy + ts });
        return;
      }

      // Outil sélection
      if (activeTool === 'selection') {
        const inside =
          selectionRect &&
          cell.cx >= selectionRect.cx &&
          cell.cx < selectionRect.cx + selectionRect.cw &&
          cell.cy >= selectionRect.cy &&
          cell.cy < selectionRect.cy + selectionRect.ch;

        if (inside && selectionRect) {
          // Démarrer un déplacement de la sélection existante
          setSelMoveDrag({ startCx: cell.cx, startCy: cell.cy, curCx: cell.cx, curCy: cell.cy });
        } else {
          // Démarrer un nouveau dessin de sélection (efface l'ancienne)
          onSelectionChange?.(null);
          setSelDrawing({ startCx: cell.cx, startCy: cell.cy, curCx: cell.cx, curCy: cell.cy });
        }
        return;
      }

      if (activeTool === 'paint') onCellPaint(cell.cx, cell.cy);
      else if (activeTool === 'erase') onCellErase(cell.cx, cell.cy);
      else if (activeTool === 'fill') {
        isMouseDown.current = false;
        onCellFill(cell.cx, cell.cy);
      } else if (activeTool === 'eyedropper' && onEyedropperPick)
        onEyedropperPick(cell.cx, cell.cy);
    },
    [
      getGridCell,
      mapData,
      activeTool,
      activeLayer,
      activeTileLayerIndex,
      onCellPaint,
      onCellErase,
      onCellFill,
      onEyedropperPick,
      entities,
      onEntityDelete,
      selectionRect,
      onSelectionChange,
    ]
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        setIsMiddlePanning(false);
        middlePanStart.current = null;
        return;
      }
      if (e.evt.button === 2) {
        setIsRightErasing(false);
        return;
      }
      isMouseDown.current = false;

      // Finaliser le dessin de zone
      if (drawingZone && onZoneDraw) {
        const ts = mapData.__gridSize;
        if (ts > 0) {
          const minX = Math.min(drawingZone.sx, drawingZone.ex);
          const minY = Math.min(drawingZone.sy, drawingZone.ey);
          const maxX = Math.max(drawingZone.sx, drawingZone.ex);
          const maxY = Math.max(drawingZone.sy, drawingZone.ey);
          const xTile = Math.round(minX / ts);
          const yTile = Math.round(minY / ts);
          const wTile = Math.max(1, Math.round((maxX - minX) / ts));
          const hTile = Math.max(1, Math.round((maxY - minY) / ts));
          onZoneDraw(xTile, yTile, wTile, hTile);
        }
        setDrawingZone(null);
      }

      // Finaliser la sélection — dessin
      if (selDrawing) {
        const cx = Math.min(selDrawing.startCx, selDrawing.curCx);
        const cy = Math.min(selDrawing.startCy, selDrawing.curCy);
        const cw = Math.abs(selDrawing.curCx - selDrawing.startCx) + 1;
        const ch = Math.abs(selDrawing.curCy - selDrawing.startCy) + 1;
        onSelectionChange?.({ cx, cy, cw, ch });
        setSelDrawing(null);
        return;
      }

      // Finaliser le déplacement de la sélection
      if (selMoveDrag && selectionRect && onSelectionMove) {
        const dx = selMoveDrag.curCx - selMoveDrag.startCx;
        const dy = selMoveDrag.curCy - selMoveDrag.startCy;
        if (dx !== 0 || dy !== 0) {
          onSelectionMove(selectionRect, selectionRect.cx + dx, selectionRect.cy + dy);
        }
        setSelMoveDrag(null);
        return;
      }
      setSelMoveDrag(null);
    },
    [
      drawingZone,
      mapData,
      onZoneDraw,
      selDrawing,
      selMoveDrag,
      selectionRect,
      onSelectionChange,
      onSelectionMove,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    isMouseDown.current = false;
    setIsRightErasing(false);
    setIsMiddlePanning(false);
    middlePanStart.current = null;
    setSelDrawing(null);
    setSelMoveDrag(null);
    onCellHover(null);
  }, [onCellHover]);

  // Zoom to pointer (best practice from Konva docs)
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = Math.min(
        MAP_ZOOM.MAX,
        Math.max(MAP_ZOOM.MIN, oldScale * (direction > 0 ? MAP_ZOOM.FACTOR : 1 / MAP_ZOOM.FACTOR))
      );

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      onZoomChange(newScale);
      onStagePosChange(newPos);
    },
    [onZoomChange, onStagePosChange]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // Ignorer les dragend des enfants (cercles resize, entités) — seul le Stage lui-même compte
      if (e.target !== stageRef.current) return;
      onStagePosChange({ x: e.target.x(), y: e.target.y() });
    },
    [onStagePosChange]
  );

  // ── Grid lines ────────────────────────────────────────────────────────────
  // useMemo : évite de reconstruire N+M Line elements à chaque hoveredCell change
  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    const lines: React.ReactElement[] = [];
    // Label interval: every 5 tiles (or every tile if tileSize >= 64)
    const labelStep = tileSize >= 64 ? 1 : 5;
    const labelFontSize = Math.max(7, Math.min(10, 9 / zoom));
    for (let col = 0; col <= gridW; col++) {
      lines.push(
        <Line
          key={`v${col}`}
          points={[col * tileSize, 0, col * tileSize, gridH * tileSize]}
          stroke={MAP_CANVAS_COLORS.GRID_LINE}
          strokeWidth={1 / zoom}
          listening={false}
        />
      );
      // Pixel label on X axis (top) — every labelStep cols, skip col 0
      if (col > 0 && col % labelStep === 0) {
        lines.push(
          <Text
            key={`lx${col}`}
            x={col * tileSize + 2 / zoom}
            y={2 / zoom}
            text={`${col * tileSize}`}
            fontSize={labelFontSize / zoom}
            fill="rgba(255,255,255,0.28)"
            listening={false}
          />
        );
      }
    }
    for (let row = 0; row <= gridH; row++) {
      lines.push(
        <Line
          key={`h${row}`}
          points={[0, row * tileSize, gridW * tileSize, row * tileSize]}
          stroke={MAP_CANVAS_COLORS.GRID_LINE}
          strokeWidth={1 / zoom}
          listening={false}
        />
      );
      // Pixel label on Y axis (left) — every labelStep rows, skip row 0
      if (row > 0 && row % labelStep === 0) {
        lines.push(
          <Text
            key={`ly${row}`}
            x={2 / zoom}
            y={row * tileSize + 2 / zoom}
            text={`${row * tileSize}`}
            fontSize={labelFontSize / zoom}
            fill="rgba(255,255,255,0.28)"
            listening={false}
          />
        );
      }
    }
    return lines;
  }, [showGrid, gridW, gridH, tileSize, zoom]);

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!tileSize || !gridW || !gridH) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <p className="text-sm">Sélectionnez ou créez une carte dans le panneau gauche</p>
      </div>
    );
  }

  // ── Cursor (D1) ───────────────────────────────────────────────────────────
  // Priorités : resize handle > pan (espace/milieu) > outil sélection > autres outils

  const isErasing = activeTool === 'erase' || isRightErasing;
  const isPanning = isSpacePanning || isMiddlePanning;

  const insideSelection =
    selectionRect &&
    hoveredCell &&
    hoveredCell.cx >= selectionRect.cx &&
    hoveredCell.cx < selectionRect.cx + selectionRect.cw &&
    hoveredCell.cy >= selectionRect.cy &&
    hoveredCell.cy < selectionRect.cy + selectionRect.ch;

  const cursor =
    resizeCursor ??
    entityCursor ??
    (isPanning
      ? isMiddlePanning || isMouseDown.current
        ? 'grabbing'
        : 'grab'
      : isErasing
        ? 'crosshair'
        : activeTool === 'eyedropper'
          ? 'cell'
          : activeTool === 'fill'
            ? 'copy'
            : activeTool === 'selection'
              ? selMoveDrag
                ? 'grabbing'
                : insideSelection
                  ? 'move'
                  : 'crosshair'
              : activeTool === 'paint'
                ? 'crosshair'
                : 'default');

  // Zones interactives dès que la couche Triggers est visible (pas besoin de la sélectionner)
  const zonesInteractive = triggersLayer?._ac_visible ?? true;

  // ── Stage ─────────────────────────────────────────────────────────────────
  // draggable : désactivé si survol poignée resize, si drag entité en cours, sinon selon outil actif
  const isDraggable =
    !resizeCursor &&
    entityCursor !== 'grabbing' &&
    (isSpacePanning ||
      (activeTool !== 'paint' &&
        activeTool !== 'erase' &&
        activeTool !== 'eyedropper' &&
        activeTool !== 'fill' &&
        activeTool !== 'selection'));

  // ── Resize handles helpers ────────────────────────────────────────────────
  const mapPixelW = gridW * tileSize;
  const mapPixelH = gridH * tileSize;

  // ── Drag-and-drop depuis ObjectsPanel ─────────────────────────────────────

  const handleObjectDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('ac-object-def-id')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOverCanvas) setIsDragOverCanvas(true);
  };

  const handleObjectDragLeave = () => {
    setIsDragOverCanvas(false);
  };

  const handleObjectDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOverCanvas(false);
    const defId = e.dataTransfer.getData('ac-object-def-id');
    if (!defId || !onObjectDrop || !stageRef.current) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const stage = stageRef.current;
    const worldX = (localX - stage.x()) / stage.scaleX();
    const worldY = (localY - stage.y()) / stage.scaleY();
    const cx = Math.floor(worldX / tileSize);
    const cy = Math.floor(worldY / tileSize);
    const gridW = mapData.pxWid / tileSize;
    const gridH = mapData.pxHei / tileSize;
    if (cx >= 0 && cy >= 0 && cx < gridW && cy < gridH) {
      onObjectDrop(defId, cx, cy);
    }
  };

  return (
    // Wrapper — outline rouge en mode effacer (D1), touchAction pour tablette (konva-patterns §8)
    <div
      onDragOver={handleObjectDragOver}
      onDragLeave={handleObjectDragLeave}
      onDrop={handleObjectDrop}
      style={{
        position: 'relative',
        width: containerWidth,
        height: containerHeight,
        outline: isDragOverCanvas
          ? '2px solid rgba(139,92,246,0.7)'
          : isErasing
            ? '2px solid rgba(255,60,60,0.45)'
            : 'none',
        outlineOffset: '-2px',
        touchAction: 'none',
      }}
    >
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        imageSmoothingEnabled={false}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={isDraggable}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDragEnd={handleDragEnd}
        onContextMenu={(e) => e.evt.preventDefault()}
        style={{ cursor }}
      >
        {/* ── Map background + border ── */}
        <Layer listening={false}>
          {/* Shadow (offset rect derrière la map) */}
          <Rect
            x={4}
            y={6}
            width={gridW * tileSize}
            height={gridH * tileSize}
            fill="rgba(0,0,0,0.35)"
            shadowBlur={0}
          />
          {/* Map fill */}
          <Rect
            x={0}
            y={0}
            width={gridW * tileSize}
            height={gridH * tileSize}
            fill={MAP_CANVAS_COLORS.MAP_BACKGROUND}
          />
          {/* Map border */}
          <Rect
            x={0}
            y={0}
            width={gridW * tileSize}
            height={gridH * tileSize}
            fill="transparent"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
            listening={false}
          />
        </Layer>

        {/* ── Tile layers — une TilesLayerMemo par couche (Sol, Objets, …) ── */}
        {tileLayers.map((tLayer, idx) => {
          const base = tLayer._ac_opacity ?? 1.0;
          const isActiveTile = activeLayer === 'tiles' && idx === activeTileLayerIndex;
          const tileOp = dimInactiveLayers && !isActiveTile ? base * MAP_DIM_FACTOR : base;
          return (
            <TilesLayerMemo
              key={`tiles-layer-${idx}`}
              tiles={tLayer.gridTiles ?? EMPTY_GRID_TILES}
              imageCache={imageCache}
              tileSize={tileSize}
              opacity={tileOp}
              visible={tLayer._ac_visible ?? true}
            />
          );
        })}

        {/* ── Collision layer — memoïsée (konva-patterns §9) ── */}
        <CollisionLayerMemo
          cells={collisionCells}
          tileSize={tileSize}
          opacity={collisionOp}
          visible={collisionLayer?._ac_visible ?? true}
        />

        {/* ── Trigger zones — couche A : coverage + drag (dimmable) ── */}
        <Layer
          listening={zonesInteractive}
          opacity={triggersOp}
          visible={triggersLayer?._ac_visible ?? true}
        >
          {[
            ...triggerZones.map((z) => ({ kind: 'dialogue' as const, zone: z })),
            ...exitZones.map((z) => ({ kind: 'exit' as const, zone: z })),
            ...audioZones.map((z) => ({ kind: 'audio' as const, zone: z })),
          ].map(({ kind, zone }) => {
            const cfg = ZONE_CONFIG[kind];
            const zw = zone.zone.width;
            const zh = zone.zone.height;
            return (
              <Group
                key={`zone-${kind}-${zone.id}`}
                x={zone.zone.x}
                y={zone.zone.y}
                draggable={zonesInteractive}
                dragBoundFunc={(pos) => {
                  const stage = stageRef.current;
                  if (!stage) return pos;
                  const sc = stage.scaleX(),
                    sx = stage.x(),
                    sy = stage.y();
                  const wx = (pos.x - sx) / sc,
                    wy = (pos.y - sy) / sc;
                  const nx = Math.max(
                    0,
                    Math.min(gridW * tileSize - zw, Math.round(wx / tileSize) * tileSize)
                  );
                  const ny = Math.max(
                    0,
                    Math.min(gridH * tileSize - zh, Math.round(wy / tileSize) * tileSize)
                  );
                  return { x: nx * sc + sx, y: ny * sc + sy };
                }}
                onMouseDown={(e) => {
                  if (zonesInteractive) e.cancelBubble = true;
                }}
                onClick={(e) => {
                  if (!zonesInteractive) return;
                  e.cancelBubble = true;
                  onZoneClick?.(kind, zone.id);
                }}
                onMouseEnter={() => {
                  if (zonesInteractive) setEntityCursor('grab');
                }}
                onMouseLeave={() =>
                  setEntityCursor((prev) => (prev === 'grabbing' ? 'grabbing' : null))
                }
                onDragStart={() => setEntityCursor('grabbing')}
                onDragEnd={(e) => {
                  setEntityCursor(null);
                  onZoneMove?.(
                    kind,
                    zone.id,
                    Math.round(e.target.x() / tileSize) * tileSize,
                    Math.round(e.target.y() / tileSize) * tileSize
                  );
                }}
              >
                <Rect
                  x={0}
                  y={0}
                  width={zw}
                  height={zh}
                  fill={cfg.coverFill}
                  stroke={cfg.coverStroke}
                  strokeWidth={1.5 / zoom}
                  dash={[5 / zoom, 3 / zoom]}
                  cornerRadius={4}
                />
                {/* Contour de sélection — visible uniquement si cette zone est sélectionnée */}
                {selectedZoneId === zone.id && (
                  <Rect
                    x={-2 / zoom}
                    y={-2 / zoom}
                    width={zw + 4 / zoom}
                    height={zh + 4 / zoom}
                    fill="transparent"
                    stroke="rgba(139,92,246,0.9)"
                    strokeWidth={2.5 / zoom}
                    cornerRadius={5}
                    listening={false}
                    dash={undefined}
                    shadowColor="rgba(139,92,246,0.5)"
                    shadowBlur={8 / zoom}
                  />
                )}
              </Group>
            );
          })}
        </Layer>

        {/* ── Trigger zones — couche B : badges emoji (opacité 1, jamais dimmés) ── */}
        {/* Séparé de la couche A pour que MAP_DIM_FACTOR n'affecte pas les badges */}
        <Layer ref={zoneLayerRef} listening={false} visible={triggersLayer?._ac_visible ?? true}>
          {[
            ...triggerZones.map((z) => ({ kind: 'dialogue' as const, zone: z })),
            ...exitZones.map((z) => ({ kind: 'exit' as const, zone: z })),
            ...audioZones.map((z) => ({ kind: 'audio' as const, zone: z })),
          ].map(({ kind, zone }) => {
            const cfg = ZONE_CONFIG[kind];
            const zw = zone.zone.width;
            const zh = zone.zone.height;
            const SIZE = Math.max(tileSize * 0.9, Math.min(Math.min(zw, zh) * 0.6, tileSize * 2.0));
            const bx = zone.zone.x + zw / 2; // world x du centre de zone
            const by = zone.zone.y + zh / 2; // world y du centre de zone
            const label = (zone as { label?: string }).label ?? '';
            return (
              <Group
                key={`badge-${kind}-${zone.id}`}
                name="zone-badge"
                x={bx}
                y={by}
                offsetX={SIZE / 2}
                offsetY={SIZE / 2}
                listening={false}
              >
                {/* Fond blanc opaque + bordure colorée par type */}
                <Rect
                  x={0}
                  y={0}
                  width={SIZE}
                  height={SIZE}
                  fill="rgba(255,255,255,0.96)"
                  stroke={cfg.badgeStroke}
                  strokeWidth={SIZE * 0.07}
                  cornerRadius={SIZE * 0.24}
                  shadowColor={cfg.shadowColor}
                  shadowBlur={SIZE * 0.4}
                  shadowOffsetY={SIZE * 0.1}
                  listening={false}
                />
                {/* Emoji */}
                <Text
                  x={0}
                  y={SIZE * 0.06}
                  width={SIZE}
                  text={cfg.emoji}
                  fontSize={SIZE * 0.62}
                  align="center"
                  listening={false}
                />
                {/* Label sous le badge (dialogue only) */}
                {label ? (
                  <Text
                    x={-SIZE * 0.1}
                    y={SIZE + 4}
                    width={SIZE * 1.2}
                    text={label.length > 14 ? label.slice(0, 13) + '…' : label}
                    fontSize={Math.max(8, tileSize * 0.22)}
                    fill="rgba(255,255,255,0.97)"
                    stroke="rgba(0,0,0,0.75)"
                    strokeWidth={2.5}
                    fillAfterStrokeEnabled
                    align="center"
                    listening={false}
                  />
                ) : null}
              </Group>
            );
          })}
        </Layer>

        {/* ── Entity markers + spawn marker (couche fusionnée — konva-patterns §9)
           Spawn est toujours présent → la Layer existe même sans NPC.
           Entity Rects ont onClick ; spawn et labels ont listening=false. ── */}
        <Layer>
          {/* Player spawn marker (▶ vert) */}
          {(() => {
            const x = playerStartCx * tileSize;
            const y = playerStartCy * tileSize;
            const pad = Math.max(2, tileSize * 0.1);
            return [
              <Rect
                key="spawn-bg"
                x={x + pad}
                y={y + pad}
                width={tileSize - pad * 2}
                height={tileSize - pad * 2}
                fill="rgba(0,220,120,0.18)"
                stroke="rgba(0,220,120,0.9)"
                strokeWidth={2 / zoom}
                cornerRadius={4}
                dash={[3 / zoom, 2 / zoom]}
                listening={false}
              />,
              <Text
                key="spawn-label"
                x={x}
                y={y + tileSize * 0.22}
                width={tileSize}
                text="▶"
                fontSize={Math.max(7, tileSize * 0.38)}
                fill="rgba(0,220,120,1)"
                align="center"
                listening={false}
              />,
            ];
          })()}
          {/* NPC / entity markers */}
          {(entities ?? []).map((entity) => {
            const x = entity.cx * tileSize;
            const y = entity.cy * tileSize;
            const pad = Math.max(2, tileSize * 0.08);
            const isSelected = entity.id === selectedEntityId;
            const stroke =
              entity.behavior === 'dialogue'
                ? 'rgba(60,220,100,0.9)'
                : entity.behavior === 'patrol'
                  ? 'rgba(255,200,50,0.9)'
                  : 'rgba(100,149,237,0.9)';
            const label =
              entity.behavior === 'dialogue' ? 'D' : entity.behavior === 'patrol' ? 'P' : '·';

            // ── Sprite live rendering ──────────────────────────────────────
            const spritePath = entity.spriteAssetUrl;
            const cfg = spritePath && spriteConfigs ? spriteConfigs[spritePath] : undefined;
            const spriteImg = spritePath ? imageCache.get(spritePath) : undefined;
            const useSpriteRender = showSpriteVisuals && !!cfg && !!spriteImg;

            if (useSpriteRender && cfg && spriteImg) {
              // Compute current frame for walk_down (or idle_down fallback)
              const anim = cfg.animations['walk_down'] ?? cfg.animations['idle_down'];
              const frames = anim?.frames ?? [];
              const frameIdx = frames.length > 0 ? frames[entityAnimTick % frames.length] : 0;
              const col = frameIdx % Math.max(1, cfg.cols);
              const row = Math.floor(frameIdx / Math.max(1, cfg.cols));
              return [
                // Sprite image
                <KonvaImage
                  key={`entity-sprite-${entity.id}`}
                  image={spriteImg}
                  x={x}
                  y={y}
                  width={tileSize}
                  height={tileSize}
                  crop={{
                    x: col * cfg.frameW,
                    y: row * cfg.frameH,
                    width: cfg.frameW,
                    height: cfg.frameH,
                  }}
                  imageSmoothingEnabled={false}
                  draggable={!!onEntityMove}
                  dragBoundFunc={(pos) => {
                    const stage = stageRef.current;
                    if (!stage) return pos;
                    const sc = stage.scaleX(),
                      sx = stage.x(),
                      sy = stage.y();
                    const newCx = Math.max(
                      0,
                      Math.min(gridW - 1, Math.round((pos.x - sx) / sc / tileSize))
                    );
                    const newCy = Math.max(
                      0,
                      Math.min(gridH - 1, Math.round((pos.y - sy) / sc / tileSize))
                    );
                    return { x: newCx * tileSize * sc + sx, y: newCy * tileSize * sc + sy };
                  }}
                  onDragStart={() => {
                    onEntityClick?.(entity.id);
                    setEntityCursor('grabbing');
                  }}
                  onDragEnd={(e) => {
                    setEntityCursor(null);
                    const newCx = Math.max(
                      0,
                      Math.min(gridW - 1, Math.round(e.target.x() / tileSize))
                    );
                    const newCy = Math.max(
                      0,
                      Math.min(gridH - 1, Math.round(e.target.y() / tileSize))
                    );
                    onEntityMove?.(entity.id, newCx, newCy);
                  }}
                  onMouseEnter={() => {
                    if (onEntityMove) setEntityCursor('grab');
                  }}
                  onMouseLeave={() =>
                    setEntityCursor((prev) => (prev === 'grabbing' ? 'grabbing' : null))
                  }
                  onClick={() => onEntityClick?.(entity.id)}
                  onTap={() => onEntityClick?.(entity.id)}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    const pos = stageRef.current?.getPointerPosition();
                    if (pos) {
                      const rect = (e.evt.target as HTMLCanvasElement).getBoundingClientRect?.();
                      onEntityContextMenu?.(
                        entity.id,
                        rect ? rect.left + pos.x : e.evt.clientX,
                        rect ? rect.top + pos.y : e.evt.clientY
                      );
                    }
                  }}
                />,
                // Selection border overlay
                isSelected && (
                  <Rect
                    key={`entity-sel-${entity.id}`}
                    x={x + 1}
                    y={y + 1}
                    width={tileSize - 2}
                    height={tileSize - 2}
                    fill="transparent"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5 / zoom}
                    cornerRadius={2}
                    listening={false}
                  />
                ),
                // Behavior badge (small corner indicator)
                <Text
                  key={`entity-badge-${entity.id}`}
                  x={x + tileSize * 0.6}
                  y={y + tileSize * 0.65}
                  width={tileSize * 0.4}
                  text={label}
                  fontSize={Math.max(6, tileSize * 0.28)}
                  fontStyle="bold"
                  fill="rgba(255,255,255,0.9)"
                  align="center"
                  listening={false}
                />,
              ].filter(Boolean);
            }

            // ── Fallback: colored rect + letter badge ──────────────────────
            const fill =
              entity.behavior === 'dialogue'
                ? 'rgba(60,220,100,0.35)'
                : entity.behavior === 'patrol'
                  ? 'rgba(255,200,50,0.35)'
                  : 'rgba(100,149,237,0.35)';
            return [
              <Rect
                key={`entity-bg-${entity.id}`}
                x={x + pad}
                y={y + pad}
                width={tileSize - pad * 2}
                height={tileSize - pad * 2}
                fill={fill}
                stroke={isSelected ? 'var(--color-primary)' : stroke}
                strokeWidth={isSelected ? 2.5 / zoom : 1.5 / zoom}
                cornerRadius={3}
                draggable={!!onEntityMove}
                dragBoundFunc={(pos) => {
                  const stage = stageRef.current;
                  if (!stage) return pos;
                  const sc = stage.scaleX(),
                    sx = stage.x(),
                    sy = stage.y();
                  const newCx = Math.max(
                    0,
                    Math.min(gridW - 1, Math.round(((pos.x - sx) / sc - pad) / tileSize))
                  );
                  const newCy = Math.max(
                    0,
                    Math.min(gridH - 1, Math.round(((pos.y - sy) / sc - pad) / tileSize))
                  );
                  return {
                    x: (newCx * tileSize + pad) * sc + sx,
                    y: (newCy * tileSize + pad) * sc + sy,
                  };
                }}
                onDragStart={() => {
                  onEntityClick?.(entity.id);
                  setEntityCursor('grabbing');
                }}
                onDragEnd={(e) => {
                  setEntityCursor(null);
                  const newCx = Math.max(
                    0,
                    Math.min(gridW - 1, Math.round((e.target.x() - pad) / tileSize))
                  );
                  const newCy = Math.max(
                    0,
                    Math.min(gridH - 1, Math.round((e.target.y() - pad) / tileSize))
                  );
                  onEntityMove?.(entity.id, newCx, newCy);
                }}
                onMouseEnter={() => {
                  if (onEntityMove) setEntityCursor('grab');
                }}
                onMouseLeave={() =>
                  setEntityCursor((prev) => (prev === 'grabbing' ? 'grabbing' : null))
                }
                onClick={() => onEntityClick?.(entity.id)}
                onTap={() => onEntityClick?.(entity.id)}
                onContextMenu={(e) => {
                  e.evt.preventDefault();
                  const pos = stageRef.current?.getPointerPosition();
                  if (pos) {
                    const rect = (e.evt.target as HTMLCanvasElement).getBoundingClientRect?.();
                    onEntityContextMenu?.(
                      entity.id,
                      rect ? rect.left + pos.x : e.evt.clientX,
                      rect ? rect.top + pos.y : e.evt.clientY
                    );
                  }
                }}
              />,
              <Text
                key={`entity-lbl-${entity.id}`}
                x={x}
                y={y + tileSize * 0.25}
                width={tileSize}
                text={label}
                fontSize={Math.max(8, tileSize * 0.45)}
                fontStyle="bold"
                fill={isSelected ? 'var(--color-primary)' : stroke}
                align="center"
                listening={false}
              />,
            ];
          })}

          {/* ── Object markers (Phase 4 — ObjectInstance + ObjectDefinition) ── */}
          {(objects ?? []).map(({ instance, definition }) => {
            const x = instance.cx * tileSize;
            const y = instance.cy * tileSize;
            const pad = Math.max(2, tileSize * 0.08);
            const isSelected = instance.id === selectedEntityId;

            const hasDialogue = definition.components.some((c) => c.type === 'dialogue');
            const hasPatrol = definition.components.some((c) => c.type === 'patrol');
            const hasWind = definition.components.some((c) => c.type === 'wind');
            const stroke = hasDialogue
              ? 'rgba(60,220,100,0.9)'
              : hasPatrol
                ? 'rgba(255,200,50,0.9)'
                : hasWind
                  ? 'rgba(100,220,255,0.9)'
                  : 'rgba(100,149,237,0.9)';
            const label = hasDialogue ? 'D' : hasPatrol ? 'P' : hasWind ? '💨' : '·';

            // Résoudre le composant sprite
            const spriteComp = definition.components.find(
              (
                c
              ): c is
                | { type: 'animatedSprite'; spriteAssetUrl: string; spriteSheetConfigUrl: string }
                | {
                    type: 'sprite';
                    spriteAssetUrl: string;
                    srcX: number;
                    srcY: number;
                    srcW: number;
                    srcH: number;
                  } => c.type === 'animatedSprite' || c.type === 'sprite'
            );
            const spritePath = spriteComp?.spriteAssetUrl ?? '';
            const cfg = spritePath && spriteConfigs ? spriteConfigs[spritePath] : undefined;
            const spriteImg = spritePath ? imageCache.get(spritePath) : undefined;
            const useSprite = showSpriteVisuals && !!cfg && !!spriteImg;

            if (useSprite && cfg && spriteImg) {
              const anim = cfg.animations['walk_down'] ?? cfg.animations['idle_down'];
              const frames = anim?.frames ?? [];
              const frameIdx = frames.length > 0 ? frames[entityAnimTick % frames.length] : 0;
              const col = frameIdx % Math.max(1, cfg.cols);
              const row = Math.floor(frameIdx / Math.max(1, cfg.cols));
              const objScaleX = instance.overrides?.scaleX ?? instance.overrides?.scale ?? 1;
              const objScaleY = instance.overrides?.scaleY ?? instance.overrides?.scale ?? 1;
              const objRotation = instance.overrides?.rotation ?? 0;
              const objW = tileSize * objScaleX;
              const objH = tileSize * objScaleY;
              // Point d'origine (ancre) — style GDevelop. Absent → rétrocompat centre (0.5, 0.5).
              // anchorOff = offset du CENTRE du node par rapport au coin supérieur-gauche de la cellule.
              // Formule : anchorX = originX*(ts - objW) + objW/2  (place l'ancre sur la cellule)
              const originXPct = cfg.originXPct ?? 0.5;
              const originYPct = cfg.originYPct ?? 0.5;
              const anchorOffX = originXPct * (tileSize - objW) + objW / 2;
              const anchorOffY = originYPct * (tileSize - objH) + objH / 2;
              const cx0 = x + anchorOffX;
              const cy0 = y + anchorOffY;
              return [
                <KonvaImage
                  key={`obj-sprite-${instance.id}`}
                  ref={(node) => {
                    if (node) objNodeRefs.current.set(instance.id, node as Konva.Image);
                    else objNodeRefs.current.delete(instance.id);
                  }}
                  image={spriteImg}
                  // Origine au centre : permet rotation + scale autour du milieu (GDevelop)
                  x={cx0}
                  y={cy0}
                  offsetX={objW / 2}
                  offsetY={objH / 2}
                  width={objW}
                  height={objH}
                  rotation={objRotation}
                  crop={{
                    x: col * cfg.frameW,
                    y: row * cfg.frameH,
                    width: cfg.frameW,
                    height: cfg.frameH,
                  }}
                  imageSmoothingEnabled={false}
                  draggable={!!onEntityMove}
                  dragBoundFunc={(pos) => {
                    // pos = position écran du CENTRE du node (offsetX/Y au centre, konva-patterns §2)
                    // On snap sur la grille selon le point d'ancre (anchorOff = offset cellule→centre node)
                    const stage = stageRef.current;
                    if (!stage) return pos;
                    const sc = stage.scaleX(),
                      sx = stage.x(),
                      sy = stage.y();
                    const worldCx = (pos.x - sx) / sc;
                    const worldCy = (pos.y - sy) / sc;
                    const newCx = Math.max(
                      0,
                      Math.min(gridW - 1, Math.round((worldCx - anchorOffX) / tileSize))
                    );
                    const newCy = Math.max(
                      0,
                      Math.min(gridH - 1, Math.round((worldCy - anchorOffY) / tileSize))
                    );
                    return {
                      x: (newCx * tileSize + anchorOffX) * sc + sx,
                      y: (newCy * tileSize + anchorOffY) * sc + sy,
                    };
                  }}
                  onDragStart={() => {
                    onEntityClick?.(instance.id);
                    setEntityCursor('grabbing');
                  }}
                  onDragEnd={(e) => {
                    setEntityCursor(null);
                    // node.x/y() = centre du node en world coords (offsetX/Y au centre)
                    // On retrouve la cellule en soustrayant l'offset d'ancre
                    const newCx = Math.max(
                      0,
                      Math.min(gridW - 1, Math.round((e.target.x() - anchorOffX) / tileSize))
                    );
                    const newCy = Math.max(
                      0,
                      Math.min(gridH - 1, Math.round((e.target.y() - anchorOffY) / tileSize))
                    );
                    onEntityMove?.(instance.id, newCx, newCy);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target as Konva.Image;
                    // Calcul de la nouvelle taille effective (Transformer applique scaleX/Y sur le node)
                    const newW = node.width() * node.scaleX();
                    const newH = node.height() * node.scaleY();
                    const newScaleX = Math.max(0.1, Math.round((newW / tileSize) * 100) / 100);
                    const newScaleY = Math.max(0.1, Math.round((newH / tileSize) * 100) / 100);
                    const newRotation = Math.round(node.rotation() * 10) / 10;
                    // Réinitialiser le scale du node (konva-patterns §3)
                    node.scaleX(1);
                    node.scaleY(1);
                    // Recaler le centre via l'ancre (anchorOff recalculé avec les nouvelles dimensions)
                    const newObjW = tileSize * newScaleX;
                    const newObjH = tileSize * newScaleY;
                    const newAnchorOffX = originXPct * (tileSize - newObjW) + newObjW / 2;
                    const newAnchorOffY = originYPct * (tileSize - newObjH) + newObjH / 2;
                    node.x(instance.cx * tileSize + newAnchorOffX);
                    node.y(instance.cy * tileSize + newAnchorOffY);
                    node.offsetX(newObjW / 2);
                    node.offsetY(newObjH / 2);
                    onObjectTransform?.(instance.id, newScaleX, newScaleY, newRotation);
                  }}
                  onMouseEnter={() => {
                    if (onEntityMove) setEntityCursor('grab');
                  }}
                  onMouseLeave={() =>
                    setEntityCursor((prev) => (prev === 'grabbing' ? 'grabbing' : null))
                  }
                  onClick={() => onEntityClick?.(instance.id)}
                  onTap={() => onEntityClick?.(instance.id)}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    const pos = stageRef.current?.getPointerPosition();
                    if (pos) {
                      const rect = (e.evt.target as HTMLCanvasElement).getBoundingClientRect?.();
                      onEntityContextMenu?.(
                        instance.id,
                        rect ? rect.left + pos.x : e.evt.clientX,
                        rect ? rect.top + pos.y : e.evt.clientY
                      );
                    }
                  }}
                />,
                // Anneau de sélection — affiché uniquement si le Transformer n'est pas actif
                isSelected && !onObjectTransform && (
                  <Rect
                    key={`obj-sel-${instance.id}`}
                    x={x + 1}
                    y={y + 1}
                    width={tileSize - 2}
                    height={tileSize - 2}
                    fill="transparent"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5 / zoom}
                    cornerRadius={2}
                    listening={false}
                  />
                ),
              ].filter(Boolean);
            }

            // Fallback : carré coloré
            const fill = hasDialogue
              ? 'rgba(60,220,100,0.35)'
              : hasPatrol
                ? 'rgba(255,200,50,0.35)'
                : 'rgba(100,149,237,0.35)';
            return [
              <Rect
                key={`obj-bg-${instance.id}`}
                x={x + pad}
                y={y + pad}
                width={tileSize - pad * 2}
                height={tileSize - pad * 2}
                fill={fill}
                stroke={isSelected ? 'var(--color-primary)' : stroke}
                strokeWidth={isSelected ? 2.5 / zoom : 1.5 / zoom}
                cornerRadius={3}
                draggable={!!onEntityMove}
                dragBoundFunc={(pos) => {
                  const stage = stageRef.current;
                  if (!stage) return pos;
                  const sc = stage.scaleX(),
                    sx = stage.x(),
                    sy = stage.y();
                  const newCx = Math.max(
                    0,
                    Math.min(gridW - 1, Math.round(((pos.x - sx) / sc - pad) / tileSize))
                  );
                  const newCy = Math.max(
                    0,
                    Math.min(gridH - 1, Math.round(((pos.y - sy) / sc - pad) / tileSize))
                  );
                  return {
                    x: (newCx * tileSize + pad) * sc + sx,
                    y: (newCy * tileSize + pad) * sc + sy,
                  };
                }}
                onDragStart={() => {
                  onEntityClick?.(instance.id);
                  setEntityCursor('grabbing');
                }}
                onDragEnd={(e) => {
                  setEntityCursor(null);
                  const newCx = Math.max(
                    0,
                    Math.min(gridW - 1, Math.round((e.target.x() - pad) / tileSize))
                  );
                  const newCy = Math.max(
                    0,
                    Math.min(gridH - 1, Math.round((e.target.y() - pad) / tileSize))
                  );
                  onEntityMove?.(instance.id, newCx, newCy);
                }}
                onMouseEnter={() => {
                  if (onEntityMove) setEntityCursor('grab');
                }}
                onMouseLeave={() =>
                  setEntityCursor((prev) => (prev === 'grabbing' ? 'grabbing' : null))
                }
                onClick={() => onEntityClick?.(instance.id)}
                onTap={() => onEntityClick?.(instance.id)}
                onContextMenu={(e) => {
                  e.evt.preventDefault();
                  const pos = stageRef.current?.getPointerPosition();
                  if (pos) {
                    const rect = (e.evt.target as HTMLCanvasElement).getBoundingClientRect?.();
                    onEntityContextMenu?.(
                      instance.id,
                      rect ? rect.left + pos.x : e.evt.clientX,
                      rect ? rect.top + pos.y : e.evt.clientY
                    );
                  }
                }}
              />,
              <Text
                key={`obj-lbl-${instance.id}`}
                x={x}
                y={y + tileSize * 0.25}
                width={tileSize}
                text={label}
                fontSize={Math.max(8, tileSize * 0.45)}
                fontStyle="bold"
                fill={isSelected ? 'var(--color-primary)' : stroke}
                align="center"
                listening={false}
              />,
              <Text
                key={`obj-name-${instance.id}`}
                x={x}
                y={y + tileSize * 0.72}
                width={tileSize}
                text={definition.displayName.slice(0, 8)}
                fontSize={Math.max(5, tileSize * 0.16)}
                fill="rgba(255,255,255,0.55)"
                align="center"
                listening={false}
              />,
            ];
          })}

          {/* ── Transformer GDevelop-style (8 poignées + rotation) ── */}
          {onObjectTransform && (
            <Transformer
              ref={transformerRef}
              keepRatio={false}
              rotateEnabled={true}
              rotateAnchorOffset={20}
              borderStroke="rgba(139,92,246,0.85)"
              borderStrokeWidth={1.5 / zoom}
              borderDash={[]}
              anchorFill="white"
              anchorStroke="rgba(139,92,246,0.9)"
              anchorStrokeWidth={1.5}
              anchorSize={8}
              anchorCornerRadius={1}
              anchorStyleFunc={(anchor) => {
                // Poignée rotation → cercle (GDevelop style)
                if (anchor.hasName('rotater')) {
                  anchor.cornerRadius(6);
                  anchor.fill('rgba(139,92,246,0.9)');
                  anchor.stroke('white');
                }
              }}
              enabledAnchors={[
                'top-left',
                'top-center',
                'top-right',
                'middle-left',
                'middle-right',
                'bottom-left',
                'bottom-center',
                'bottom-right',
              ]}
            />
          )}
        </Layer>

        {/* ── Grid overlay + hover preview (couche fusionnée — konva-patterns §9)
           Les deux sont listening=false et n'ont pas besoin d'un canvas séparé. ── */}
        {(showGrid || (hoveredCell && isInBounds(hoveredCell.cx, hoveredCell.cy, mapData))) && (
          <Layer listening={false}>
            {showGrid && gridLines}
            {hoveredCell &&
              isInBounds(hoveredCell.cx, hoveredCell.cy, mapData) &&
              (() => {
                // Pinceau multi-tuiles : étendre le rect hover à toute la région sélectionnée
                const brushCols = activeTool === 'paint' ? (selectedTile?.regionCols ?? 1) : 1;
                const brushRows = activeTool === 'paint' ? (selectedTile?.regionRows ?? 1) : 1;
                const isMultiBrush = brushCols > 1 || brushRows > 1;

                const fillColor = isErasing
                  ? MAP_CANVAS_COLORS.HOVER_ERASE_FILL
                  : activeTool === 'fill'
                    ? MAP_CANVAS_COLORS.HOVER_FILL_FILL
                    : activeTool === 'selection'
                      ? MAP_CANVAS_COLORS.HOVER_SELECTION_FILL
                      : isMultiBrush
                        ? MAP_CANVAS_COLORS.HOVER_BRUSH_FILL
                        : MAP_CANVAS_COLORS.HOVER_DEFAULT_FILL;

                const strokeColor = isErasing
                  ? MAP_CANVAS_COLORS.HOVER_ERASE_STROKE
                  : activeTool === 'fill'
                    ? MAP_CANVAS_COLORS.HOVER_FILL_STROKE
                    : activeTool === 'selection'
                      ? MAP_CANVAS_COLORS.HOVER_SELECTION_STROKE
                      : isMultiBrush
                        ? MAP_CANVAS_COLORS.HOVER_BRUSH_STROKE
                        : MAP_CANVAS_COLORS.HOVER_DEFAULT_STROKE;

                return (
                  <Rect
                    x={hoveredCell.cx * tileSize}
                    y={hoveredCell.cy * tileSize}
                    width={tileSize * brushCols}
                    height={tileSize * brushRows}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isMultiBrush ? 2 / zoom : 1.5 / zoom}
                    listening={false}
                  />
                );
              })()}
          </Layer>
        )}

        {/* ── Poignée SE resize — zone sélectionnée ── */}
        {selectedZoneId &&
          zonesInteractive &&
          (() => {
            const allZones = [
              ...triggerZones.map((z) => ({ kind: 'dialogue' as const, zone: z })),
              ...exitZones.map((z) => ({ kind: 'exit' as const, zone: z })),
              ...audioZones.map((z) => ({ kind: 'audio' as const, zone: z })),
            ];
            const entry = allZones.find(({ zone }) => zone.id === selectedZoneId);
            if (!entry) return null;
            const { kind, zone } = entry;
            const zw = resizePreview?.zoneId === zone.id ? resizePreview.w : zone.zone.width;
            const zh = resizePreview?.zoneId === zone.id ? resizePreview.h : zone.zone.height;
            const hx = zone.zone.x + zone.zone.width; // handle position = coin SE original
            const hy = zone.zone.y + zone.zone.height;
            const R = Math.max(5, tileSize * 0.22) / zoom;
            return (
              <Layer>
                {/* Ghost preview rect pendant le resize */}
                {resizePreview?.zoneId === zone.id && (
                  <Rect
                    x={zone.zone.x}
                    y={zone.zone.y}
                    width={zw}
                    height={zh}
                    fill="transparent"
                    stroke="rgba(139,92,246,0.6)"
                    strokeWidth={1.5 / zoom}
                    dash={[4 / zoom, 2 / zoom]}
                    cornerRadius={4}
                    listening={false}
                  />
                )}
                {/* Cercle poignée SE */}
                <Circle
                  x={hx}
                  y={hy}
                  radius={R}
                  fill="white"
                  stroke="rgba(139,92,246,0.9)"
                  strokeWidth={2 / zoom}
                  shadowColor="rgba(139,92,246,0.4)"
                  shadowBlur={6 / zoom}
                  draggable
                  dragBoundFunc={(pos) => {
                    const stage = stageRef.current;
                    if (!stage) return pos;
                    const sc = stage.scaleX(),
                      sx = stage.x(),
                      sy = stage.y();
                    const wx = (pos.x - sx) / sc;
                    const wy = (pos.y - sy) / sc;
                    const minX = zone.zone.x + tileSize;
                    const minY = zone.zone.y + tileSize;
                    const maxX = gridW * tileSize;
                    const maxY = gridH * tileSize;
                    const nx = Math.max(minX, Math.min(maxX, Math.round(wx / tileSize) * tileSize));
                    const ny = Math.max(minY, Math.min(maxY, Math.round(wy / tileSize) * tileSize));
                    return { x: nx * sc + sx, y: ny * sc + sy };
                  }}
                  onMouseEnter={() => setEntityCursor('grab')}
                  onMouseLeave={() => setEntityCursor(null)}
                  onDragStart={() => setEntityCursor('grabbing')}
                  onDragMove={(e) => {
                    const nx = Math.round(e.target.x() / tileSize) * tileSize;
                    const ny = Math.round(e.target.y() / tileSize) * tileSize;
                    const newW = Math.max(tileSize, nx - zone.zone.x);
                    const newH = Math.max(tileSize, ny - zone.zone.y);
                    setResizePreview({ zoneId: zone.id, w: newW, h: newH });
                  }}
                  onDragEnd={(e) => {
                    setEntityCursor(null);
                    const nx = Math.round(e.target.x() / tileSize) * tileSize;
                    const ny = Math.round(e.target.y() / tileSize) * tileSize;
                    const newW = Math.max(tileSize, nx - zone.zone.x);
                    const newH = Math.max(tileSize, ny - zone.zone.y);
                    onZoneResize?.(kind, zone.id, newW, newH);
                    setResizePreview(null);
                    // Repositionner le handle sur sa pos finale (konva-patterns §3)
                    e.target.x(zone.zone.x + newW);
                    e.target.y(zone.zone.y + newH);
                  }}
                />
              </Layer>
            );
          })()}

        {/* ── Ghost zone dessinée par drag (cliquer-glisser couche triggers) ── */}
        {drawingZone && (
          <Layer listening={false}>
            {(() => {
              const x = Math.min(drawingZone.sx, drawingZone.ex);
              const y = Math.min(drawingZone.sy, drawingZone.ey);
              const w = Math.abs(drawingZone.ex - drawingZone.sx);
              const h = Math.abs(drawingZone.ey - drawingZone.sy);
              const wT = Math.max(1, Math.round(w / tileSize));
              const hT = Math.max(1, Math.round(h / tileSize));
              return (
                <>
                  <Rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="rgba(139,92,246,0.15)"
                    stroke="rgba(139,92,246,0.85)"
                    strokeWidth={2 / zoom}
                    dash={[5 / zoom, 3 / zoom]}
                    cornerRadius={4}
                    listening={false}
                  />
                  <Text
                    x={x}
                    y={y + h / 2 - 7 / zoom}
                    width={w}
                    text={`${wT} × ${hT}`}
                    fontSize={11 / zoom}
                    fontStyle="bold"
                    fill="rgba(255,255,255,0.95)"
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth={2 / zoom}
                    fillAfterStrokeEnabled
                    align="center"
                    listening={false}
                  />
                </>
              );
            })()}
          </Layer>
        )}

        {/* ── Outil sélection multi-tuiles ── */}
        {activeTool === 'selection' && (selDrawing || selectionRect) && (
          <Layer listening={false}>
            {/* Rect en cours de dessin */}
            {selDrawing &&
              (() => {
                const cx = Math.min(selDrawing.startCx, selDrawing.curCx);
                const cy = Math.min(selDrawing.startCy, selDrawing.curCy);
                const cw = Math.abs(selDrawing.curCx - selDrawing.startCx) + 1;
                const ch = Math.abs(selDrawing.curCy - selDrawing.startCy) + 1;
                return (
                  <Rect
                    x={cx * tileSize}
                    y={cy * tileSize}
                    width={cw * tileSize}
                    height={ch * tileSize}
                    fill="rgba(99,179,237,0.1)"
                    stroke="rgba(99,179,237,0.9)"
                    strokeWidth={2 / zoom}
                    dash={[5 / zoom, 3 / zoom]}
                    cornerRadius={2}
                    listening={false}
                  />
                );
              })()}
            {/* Sélection finalisée (avec ghost de déplacement si en cours) */}
            {selectionRect &&
              (() => {
                const moveDx = selMoveDrag ? selMoveDrag.curCx - selMoveDrag.startCx : 0;
                const moveDy = selMoveDrag ? selMoveDrag.curCy - selMoveDrag.startCy : 0;
                const ghostCx = selectionRect.cx + moveDx;
                const ghostCy = selectionRect.cy + moveDy;
                return (
                  <>
                    {/* Source (toujours visible pour référence) */}
                    <Rect
                      x={selectionRect.cx * tileSize}
                      y={selectionRect.cy * tileSize}
                      width={selectionRect.cw * tileSize}
                      height={selectionRect.ch * tileSize}
                      fill={selMoveDrag ? 'rgba(99,179,237,0.05)' : 'rgba(99,179,237,0.12)'}
                      stroke="rgba(99,179,237,0.8)"
                      strokeWidth={2 / zoom}
                      dash={[5 / zoom, 3 / zoom]}
                      cornerRadius={2}
                      listening={false}
                    />
                    {/* Ghost destination pendant le déplacement */}
                    {selMoveDrag && (moveDx !== 0 || moveDy !== 0) && (
                      <Rect
                        x={ghostCx * tileSize}
                        y={ghostCy * tileSize}
                        width={selectionRect.cw * tileSize}
                        height={selectionRect.ch * tileSize}
                        fill="rgba(99,179,237,0.22)"
                        stroke="rgba(99,179,237,1)"
                        strokeWidth={2 / zoom}
                        dash={[5 / zoom, 3 / zoom]}
                        cornerRadius={2}
                        listening={false}
                      />
                    )}
                  </>
                );
              })()}
          </Layer>
        )}

        {/* ── Contour zone en cours d'édition dans TriggerZonePanel ── */}
        {editingZoneRect && (
          <Layer listening={false}>
            {(() => {
              const x = editingZoneRect.xTile * tileSize;
              const y = editingZoneRect.yTile * tileSize;
              const w = editingZoneRect.wTile * tileSize;
              const h = editingZoneRect.hTile * tileSize;
              return (
                <>
                  <Rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="rgba(139,92,246,0.12)"
                    stroke="rgba(139,92,246,0.9)"
                    strokeWidth={2 / zoom}
                    dash={[5 / zoom, 3 / zoom]}
                    cornerRadius={4}
                    listening={false}
                  />
                  <Text
                    x={x}
                    y={y + h / 2 - 7 / zoom}
                    width={w}
                    text={`${editingZoneRect.wTile} × ${editingZoneRect.hTile}`}
                    fontSize={11 / zoom}
                    fontStyle="bold"
                    fill="rgba(255,255,255,0.95)"
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth={2 / zoom}
                    fillAfterStrokeEnabled
                    align="center"
                    listening={false}
                  />
                </>
              );
            })()}
          </Layer>
        )}

        {/* ── Resize handles (LDtk-style white circles) ── */}
        {onResizeMap && (
          <Layer>
            {/* Ghost outline + dimension label pendant le drag */}
            {resizeDrag && (
              <>
                <Rect
                  x={0}
                  y={0}
                  width={resizeDrag.previewW}
                  height={resizeDrag.previewH}
                  fill="transparent"
                  stroke="var(--color-primary-55)"
                  strokeWidth={2 / zoom}
                  dash={[6 / zoom, 3 / zoom]}
                  listening={false}
                />
                <Text
                  x={resizeDrag.previewW / 2}
                  y={resizeDrag.previewH / 2 - 8 / zoom}
                  text={`${Math.round(resizeDrag.previewW / tileSize)} × ${Math.round(resizeDrag.previewH / tileSize)}`}
                  fontSize={12 / zoom}
                  fontStyle="bold"
                  fill="rgba(255,255,255,0.95)"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={3 / zoom}
                  fillAfterStrokeEnabled
                  align="center"
                  offsetX={30 / zoom}
                  listening={false}
                />
              </>
            )}

            {/* E handle — bord droit, centre vertical */}
            <Circle
              x={mapPixelW}
              y={mapPixelH / 2}
              radius={7 / zoom}
              fill="white"
              stroke="rgba(60,60,80,0.6)"
              strokeWidth={1.5 / zoom}
              draggable
              onMouseDown={(e) => {
                e.cancelBubble = true;
              }}
              onMouseEnter={() => setResizeCursor('ew-resize')}
              onMouseLeave={() => {
                if (!resizeDrag) setResizeCursor(null);
              }}
              dragBoundFunc={(pos) => {
                const stage = stageRef.current;
                if (!stage) return pos;
                const sx = stage.x(),
                  sc = stage.scaleX();
                const wx = (pos.x - sx) / sc;
                const snapped = Math.max(tileSize, Math.round(wx / tileSize) * tileSize);
                return { x: snapped * sc + sx, y: (mapPixelH / 2) * sc + stage.y() };
              }}
              onDragMove={(e) => {
                setResizeCursor('ew-resize');
                setResizeDrag({ previewW: e.target.x(), previewH: mapPixelH });
              }}
              onDragEnd={(e) => {
                const newWTiles = Math.max(1, Math.round(e.target.x() / tileSize));
                setResizeDrag(null);
                setResizeCursor(null);
                onResizeMap(newWTiles, gridH);
              }}
            />

            {/* S handle — bord bas, centre horizontal */}
            <Circle
              x={mapPixelW / 2}
              y={mapPixelH}
              radius={7 / zoom}
              fill="white"
              stroke="rgba(60,60,80,0.6)"
              strokeWidth={1.5 / zoom}
              draggable
              onMouseDown={(e) => {
                e.cancelBubble = true;
              }}
              onMouseEnter={() => setResizeCursor('ns-resize')}
              onMouseLeave={() => {
                if (!resizeDrag) setResizeCursor(null);
              }}
              dragBoundFunc={(pos) => {
                const stage = stageRef.current;
                if (!stage) return pos;
                const sy = stage.y(),
                  sc = stage.scaleX();
                const wy = (pos.y - sy) / sc;
                const snapped = Math.max(tileSize, Math.round(wy / tileSize) * tileSize);
                return { x: (mapPixelW / 2) * sc + stage.x(), y: snapped * sc + sy };
              }}
              onDragMove={(e) => {
                setResizeCursor('ns-resize');
                setResizeDrag({ previewW: mapPixelW, previewH: e.target.y() });
              }}
              onDragEnd={(e) => {
                const newHTiles = Math.max(1, Math.round(e.target.y() / tileSize));
                setResizeDrag(null);
                setResizeCursor(null);
                onResizeMap(gridW, newHTiles);
              }}
            />

            {/* SE handle — coin bas-droit (plus grand, pivot principal) */}
            <Circle
              x={mapPixelW}
              y={mapPixelH}
              radius={9 / zoom}
              fill="white"
              stroke="rgba(60,60,80,0.6)"
              strokeWidth={1.5 / zoom}
              draggable
              onMouseDown={(e) => {
                e.cancelBubble = true;
              }}
              onMouseEnter={() => setResizeCursor('nwse-resize')}
              onMouseLeave={() => {
                if (!resizeDrag) setResizeCursor(null);
              }}
              dragBoundFunc={(pos) => {
                const stage = stageRef.current;
                if (!stage) return pos;
                const sx = stage.x(),
                  sy = stage.y(),
                  sc = stage.scaleX();
                const wx = (pos.x - sx) / sc;
                const wy = (pos.y - sy) / sc;
                const snX = Math.max(tileSize, Math.round(wx / tileSize) * tileSize);
                const snY = Math.max(tileSize, Math.round(wy / tileSize) * tileSize);
                return { x: snX * sc + sx, y: snY * sc + sy };
              }}
              onDragMove={(e) => {
                setResizeCursor('nwse-resize');
                setResizeDrag({ previewW: e.target.x(), previewH: e.target.y() });
              }}
              onDragEnd={(e) => {
                const newWTiles = Math.max(1, Math.round(e.target.x() / tileSize));
                const newHTiles = Math.max(1, Math.round(e.target.y() / tileSize));
                setResizeDrag(null);
                setResizeCursor(null);
                onResizeMap(newWTiles, newHTiles);
              }}
            />
          </Layer>
        )}
      </Stage>

      {/* ── Atmospheric effect overlay (above Konva canvas, pointer-events none) ── */}
      {sceneEffect && <SceneEffectCanvas effect={sceneEffect} />}

      {/* ── HUD coordonnées (bottom-left, pointer-events none) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          display: 'flex',
          gap: 6,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {hoveredCell && (
          <span
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 10,
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {hoveredCell.cx}, {hoveredCell.cy}
          </span>
        )}
        {activeTool === 'selection' && selectionRect && (
          <span
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              color: 'rgba(99,179,237,0.9)',
              fontSize: 10,
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid rgba(99,179,237,0.2)',
            }}
          >
            ▣ {selectionRect.cw}×{selectionRect.ch}
          </span>
        )}
        <span
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 10,
            fontFamily: 'monospace',
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        {(() => {
          if (activeLayer === 'collision')
            return (
              <span
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(4px)',
                  color: 'rgba(255,100,100,0.85)',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(255,100,100,0.15)',
                }}
              >
                Collision
              </span>
            );
          if (activeLayer === 'triggers')
            return (
              <span
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(4px)',
                  color: 'rgba(139,92,246,0.9)',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              >
                Triggers
              </span>
            );
          const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
          const layerName = tileLayers[activeTileLayerIndex]?.__identifier ?? 'Tuiles';
          return (
            <span
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                color: 'rgba(99,179,237,0.85)',
                fontSize: 10,
                fontFamily: 'monospace',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid rgba(99,179,237,0.15)',
              }}
            >
              {layerName}
            </span>
          );
        })()}
        {(() => {
          const TOOL_LABEL: Record<string, string> = {
            paint: 'B',
            erase: 'E',
            fill: 'F',
            eyedropper: 'I',
            selection: 'S',
          };
          const label = TOOL_LABEL[activeTool];
          if (!label) return null;
          const isErase = activeTool === 'erase';
          const isSel = activeTool === 'selection';
          return (
            <span
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                color: isErase
                  ? 'rgba(255,100,100,0.85)'
                  : isSel
                    ? 'rgba(99,179,237,0.85)'
                    : 'rgba(255,255,255,0.4)',
                fontSize: 10,
                fontFamily: 'monospace',
                padding: '2px 6px',
                borderRadius: 4,
                border: `1px solid ${isErase ? 'rgba(255,100,100,0.15)' : isSel ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {label}
            </span>
          );
        })()}
      </div>

      {/* ── Tile context menu (right-click → move to layer) ── */}
      {tileContextMenu &&
        createPortal(
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: tileContextMenu.y,
              left: tileContextMenu.x,
              zIndex: 9999,
              background: 'var(--color-bg-overlay, #1e1e2e)',
              border: '1px solid var(--color-border-base, rgba(255,255,255,0.12))',
              borderRadius: 8,
              boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
              minWidth: 190,
              padding: '4px 0',
              userSelect: 'none',
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                padding: '6px 12px 4px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Déplacer vers…
            </div>
            {mapData.layerInstances
              .filter((l) => l.__type === 'tiles')
              .map((layer, idx) => {
                if (idx === tileContextMenu.fromLayerIdx) return null;
                return (
                  <button
                    key={idx}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      onTileMoveToLayer?.(
                        tileContextMenu.cx,
                        tileContextMenu.cy,
                        tileContextMenu.fromLayerIdx,
                        idx
                      );
                      setTileContextMenu(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '6px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--color-text-primary)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 11, opacity: 0.5, minWidth: 58 }}>
                      Calque {idx + 1}
                    </span>
                    <span style={{ fontWeight: 600 }}>{layer.__identifier}</span>
                  </button>
                );
              })}
            <div
              style={{
                height: 1,
                background: 'var(--color-border-base, rgba(255,255,255,0.08))',
                margin: '4px 0',
              }}
            />
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                if (onCellEraseFromLayer) {
                  onCellEraseFromLayer(
                    tileContextMenu.cx,
                    tileContextMenu.cy,
                    tileContextMenu.fromLayerIdx
                  );
                } else {
                  onCellErase(tileContextMenu.cx, tileContextMenu.cy);
                }
                setTileContextMenu(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--color-text-danger, #f87171)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 14 }}>🗑</span>
              <span>Effacer</span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
