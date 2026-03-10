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

import { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { MapData, LayerType, EntityInstance } from '@/types/map';
import type { TileImageCache } from './hooks/useTileset';
import type { EditorTool, LayerVisibility, LayerOpacity } from './hooks/useMapEditor';
import { MAP_ZOOM, MAP_LAYER_COLORS, MAP_CANVAS_COLORS, MAP_DIM_FACTOR } from '@/config/mapEditorConfig';

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
  layerVisibility: LayerVisibility;
  layerOpacity: LayerOpacity;
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
  /** Entités placées sur la carte (rendu dans l'éditeur) */
  entities?: EntityInstance[];
  /** Appelé quand l'utilisateur supprime une entité (clic droit ou Suppr) */
  onEntityDelete?: (entityId: string) => void;
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

/** Calcule l'opacité effective d'une couche selon visibilité, opacité base et dim */
function effectiveOpacity(
  layer: LayerType,
  activeLayer: LayerType,
  visibility: LayerVisibility,
  opacity: LayerOpacity,
  dim: boolean
): number {
  if (!visibility[layer]) return 0;
  const base = opacity[layer];
  if (dim && layer !== activeLayer) return base * MAP_DIM_FACTOR;
  return base;
}

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
  layerVisibility,
  layerOpacity,
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
  onEntityDelete,
}: MapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const isMouseDown = useRef(false);

  // ── QoL navigation state ──────────────────────────────────────────────────
  // isRightErasing : clic droit maintenu → efface en continu (LDtk style)
  // isSpacePanning : espace tenu → pan quel que soit l'outil actif
  // isMiddlePanning : clic milieu → pan (Photoshop/Blender style)
  const [isRightErasing, setIsRightErasing] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const middlePanStart = useRef<{ pointerX: number; pointerY: number; stageX: number; stageY: number } | null>(null);

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

  const tilesLayer = mapData.layerInstances.find(l => l.__type === 'tiles');
  const collisionLayer = mapData.layerInstances.find(l => l.__type === 'collision');

  // Decode collision intGrid → array of {cx, cy}
  const collisionCells = (collisionLayer?.intGrid ?? []).map(idx => ({
    cx: idx % (collisionLayer?.__cWid ?? gridW),
    cy: Math.floor(idx / (collisionLayer?.__cWid ?? gridW)),
  }));

  // Dialogue trigger zones
  const triggerZones = mapData._ac_dialogue_triggers;
  const exitZones = mapData._ac_scene_exits;

  // Effective opacities
  const tilesOpacity    = effectiveOpacity('tiles',     activeLayer, layerVisibility, layerOpacity, dimInactiveLayers);
  const collisionOp     = effectiveOpacity('collision', activeLayer, layerVisibility, layerOpacity, dimInactiveLayers);
  const triggersOp      = effectiveOpacity('triggers',  activeLayer, layerVisibility, layerOpacity, dimInactiveLayers);

  // ── Event handlers ────────────────────────────────────────────────────────

  const getGridCell = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return screenToGrid(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX(), tileSize);
  }, [tileSize]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
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

    // Clic gauche maintenu — paint/erase continu (fill uniquement au clic)
    if (isMouseDown.current && activeTool === 'paint') {
      onCellPaint(cell.cx, cell.cy);
    } else if (isMouseDown.current && activeTool === 'erase') {
      onCellErase(cell.cx, cell.cy);
    }
  }, [isMiddlePanning, isRightErasing, getGridCell, mapData, onCellHover, onCellPaint, onCellErase, onStagePosChange, activeTool]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // ── Clic milieu (A3) — démarrer pan ────────────────────────────────────
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      middlePanStart.current = { pointerX: pos.x, pointerY: pos.y, stageX: stage.x(), stageY: stage.y() };
      setIsMiddlePanning(true);
      return;
    }

    // ── Clic droit (A1) — supprimer entité si présente, sinon effacer tuile ─
    if (e.evt.button === 2) {
      const cell = getGridCell(e);
      if (cell && isInBounds(cell.cx, cell.cy, mapData)) {
        const entityAtCell = entities?.find(ent => ent.cx === cell.cx && ent.cy === cell.cy);
        if (entityAtCell && onEntityDelete) {
          onEntityDelete(entityAtCell.id);
          return;
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

    if (activeTool === 'paint') onCellPaint(cell.cx, cell.cy);
    else if (activeTool === 'erase') onCellErase(cell.cx, cell.cy);
    else if (activeTool === 'fill') { isMouseDown.current = false; onCellFill(cell.cx, cell.cy); }
    else if (activeTool === 'eyedropper' && onEyedropperPick) onEyedropperPick(cell.cx, cell.cy);
  }, [getGridCell, mapData, activeTool, onCellPaint, onCellErase, onCellFill, onEyedropperPick, entities, onEntityDelete]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) { setIsMiddlePanning(false); middlePanStart.current = null; return; }
    if (e.evt.button === 2) { setIsRightErasing(false); return; }
    isMouseDown.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isMouseDown.current = false;
    setIsRightErasing(false);
    setIsMiddlePanning(false);
    middlePanStart.current = null;
    onCellHover(null);
  }, [onCellHover]);

  // Zoom to pointer (best practice from Konva docs)
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(MAP_ZOOM.MAX, Math.max(MAP_ZOOM.MIN, oldScale * (direction > 0 ? MAP_ZOOM.FACTOR : 1 / MAP_ZOOM.FACTOR)));

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
  }, [onZoomChange, onStagePosChange]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    onStagePosChange({ x: e.target.x(), y: e.target.y() });
  }, [onStagePosChange]);

  // ── Grid lines ────────────────────────────────────────────────────────────

  const gridLines: React.ReactElement[] = [];
  if (showGrid) {
    for (let col = 0; col <= gridW; col++) {
      gridLines.push(
        <Line
          key={`v${col}`}
          points={[col * tileSize, 0, col * tileSize, gridH * tileSize]}
          stroke={MAP_CANVAS_COLORS.GRID_LINE}
          strokeWidth={1 / zoom}
          listening={false}
        />
      );
    }
    for (let row = 0; row <= gridH; row++) {
      gridLines.push(
        <Line
          key={`h${row}`}
          points={[0, row * tileSize, gridW * tileSize, row * tileSize]}
          stroke={MAP_CANVAS_COLORS.GRID_LINE}
          strokeWidth={1 / zoom}
          listening={false}
        />
      );
    }
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!tileSize || !gridW || !gridH) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
        <p className="text-sm">Sélectionnez ou créez une carte dans le panneau gauche</p>
      </div>
    );
  }

  // ── Cursor (D1) ───────────────────────────────────────────────────────────
  // Priorités : pan (espace/milieu) > erase > outils normaux

  const isErasing = activeTool === 'erase' || isRightErasing;
  const isPanning  = isSpacePanning || isMiddlePanning;

  const cursor = isPanning   ? (isMiddlePanning || isMouseDown.current ? 'grabbing' : 'grab')
               : isErasing   ? 'crosshair'
               : activeTool === 'eyedropper'  ? 'cell'
               : activeTool === 'fill'        ? 'copy'
               : 'default';

  // ── Stage ─────────────────────────────────────────────────────────────────
  // draggable : activé si Space (A2), sinon selon l'outil actif (paint/erase/... bloquent le drag)
  const isDraggable = isSpacePanning || (
    activeTool !== 'paint' && activeTool !== 'erase' && activeTool !== 'eyedropper' && activeTool !== 'fill'
  );

  return (
    // Wrapper pour l'outline rouge en mode effacer (D1)
    <div style={{
      width: containerWidth,
      height: containerHeight,
      outline: isErasing ? '2px solid rgba(255,60,60,0.45)' : 'none',
      outlineOffset: '-2px',
    }}>
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
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
      {/* ── Map background ── */}
      <Layer listening={false}>
        <Rect x={0} y={0} width={gridW * tileSize} height={gridH * tileSize} fill={MAP_CANVAS_COLORS.MAP_BACKGROUND} />
      </Layer>

      {/* ── Décor layer (tiles images) ── */}
      <Layer listening={false} opacity={tilesOpacity} visible={layerVisibility.tiles}>
        {(tilesLayer?.gridTiles ?? []).map((tile, idx) => {
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
              crop={tile.tileW ? { x: tile.tileX ?? 0, y: tile.tileY ?? 0, width: tile.tileW, height: tile.tileH ?? tile.tileW } : undefined}
              listening={false}
            />
          );
        })}
      </Layer>

      {/* ── Collision layer (red squares) ── */}
      <Layer listening={false} opacity={collisionOp} visible={layerVisibility.collision}>
        {collisionCells.map(({ cx, cy }) => (
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

      {/* ── Trigger zones (dialogue + exits) ── */}
      <Layer listening={false} opacity={triggersOp} visible={layerVisibility.triggers}>
        {triggerZones.map(zone => (
          <Rect
            key={`trigger-${zone.id}`}
            x={zone.zone.x} y={zone.zone.y}
            width={zone.zone.width} height={zone.zone.height}
            fill={MAP_LAYER_COLORS.triggers.fill}
            stroke={MAP_LAYER_COLORS.triggers.stroke}
            strokeWidth={1}
            listening={false}
          />
        ))}
        {triggerZones.map(zone => (
          <Text
            key={`trigger-label-${zone.id}`}
            x={zone.zone.x + 2} y={zone.zone.y + 2}
            text={zone.label}
            fontSize={8}
            fill="white"
            listening={false}
          />
        ))}
        {exitZones.map(zone => (
          <Rect
            key={`exit-${zone.id}`}
            x={zone.zone.x} y={zone.zone.y}
            width={zone.zone.width} height={zone.zone.height}
            fill={MAP_CANVAS_COLORS.EXIT_FILL}
            stroke={MAP_CANVAS_COLORS.EXIT_STROKE}
            strokeWidth={1}
            listening={false}
          />
        ))}
      </Layer>

      {/* ── Entity markers (NPC, patrouilles, dialogues) ── */}
      {entities && entities.length > 0 && (
        <Layer listening={false}>
          {entities.map(entity => {
            const x = entity.cx * tileSize;
            const y = entity.cy * tileSize;
            const pad = Math.max(2, tileSize * 0.08);
            // Couleur selon comportement
            const fill = entity.behavior === 'dialogue' ? 'rgba(60,220,100,0.35)'
                       : entity.behavior === 'patrol'   ? 'rgba(255,200,50,0.35)'
                       :                                  'rgba(100,149,237,0.35)';
            const stroke = entity.behavior === 'dialogue' ? 'rgba(60,220,100,0.9)'
                         : entity.behavior === 'patrol'   ? 'rgba(255,200,50,0.9)'
                         :                                  'rgba(100,149,237,0.9)';
            const label = entity.behavior === 'dialogue' ? 'D'
                        : entity.behavior === 'patrol'   ? 'P'
                        : 'S';
            return [
              <Rect
                key={`entity-bg-${entity.id}`}
                x={x + pad}
                y={y + pad}
                width={tileSize - pad * 2}
                height={tileSize - pad * 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5 / zoom}
                cornerRadius={3}
                listening={false}
              />,
              <Text
                key={`entity-lbl-${entity.id}`}
                x={x}
                y={y + tileSize * 0.25}
                width={tileSize}
                text={label}
                fontSize={Math.max(8, tileSize * 0.45)}
                fontStyle="bold"
                fill={stroke}
                align="center"
                listening={false}
              />,
            ];
          })}
        </Layer>
      )}

      {/* ── Grid overlay ── */}
      {showGrid && (
        <Layer listening={false}>
          {gridLines}
        </Layer>
      )}

      {/* ── Hover preview ── */}
      {hoveredCell && isInBounds(hoveredCell.cx, hoveredCell.cy, mapData) && (
        <Layer listening={false}>
          <Rect
            x={hoveredCell.cx * tileSize}
            y={hoveredCell.cy * tileSize}
            width={tileSize}
            height={tileSize}
            fill={
              isErasing                ? MAP_CANVAS_COLORS.HOVER_ERASE_FILL
              : activeTool === 'fill'  ? MAP_CANVAS_COLORS.HOVER_FILL_FILL
              : MAP_CANVAS_COLORS.HOVER_DEFAULT_FILL
            }
            stroke={
              isErasing                ? MAP_CANVAS_COLORS.HOVER_ERASE_STROKE
              : activeTool === 'fill'  ? MAP_CANVAS_COLORS.HOVER_FILL_STROKE
              : MAP_CANVAS_COLORS.HOVER_DEFAULT_STROKE
            }
            strokeWidth={1.5 / zoom}
            listening={false}
          />
        </Layer>
      )}
    </Stage>
    </div>
  );
}
