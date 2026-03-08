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

import { useRef, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { MapData, LayerType } from '@/types/map';
import type { TileImageCache } from './hooks/useTileset';
import type { EditorTool } from './hooks/useMapEditor';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_FACTOR = 1.1;

const LAYER_COLORS: Record<LayerType, string> = {
  tiles: 'transparent',
  collision: 'rgba(255, 60, 60, 0.55)',
  triggers: 'rgba(60, 220, 100, 0.45)',
};

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
  onZoomChange: (zoom: number) => void;
  onStagePosChange: (pos: { x: number; y: number }) => void;
  onCellHover: (cell: { cx: number; cy: number } | null) => void;
  onCellPaint: (cx: number, cy: number) => void;
  onCellErase: (cx: number, cy: number) => void;
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
  onZoomChange,
  onStagePosChange,
  onCellHover,
  onCellPaint,
  onCellErase,
}: MapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const isMouseDown = useRef(false);

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

  // ── Event handlers ────────────────────────────────────────────────────────

  const getGridCell = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return screenToGrid(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX(), tileSize);
  }, [tileSize]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const cell = getGridCell(e);
    if (!cell || !isInBounds(cell.cx, cell.cy, mapData)) {
      onCellHover(null);
      return;
    }
    onCellHover(cell);

    // Paint while dragging (held mouse)
    if (isMouseDown.current && activeTool === 'paint') {
      onCellPaint(cell.cx, cell.cy);
    } else if (isMouseDown.current && activeTool === 'erase') {
      onCellErase(cell.cx, cell.cy);
    }
  }, [getGridCell, mapData, onCellHover, onCellPaint, onCellErase, activeTool]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle left-click on the stage background (not on child shapes during pan)
    if (e.evt.button !== 0) return;
    isMouseDown.current = true;
    const cell = getGridCell(e);
    if (!cell || !isInBounds(cell.cx, cell.cy, mapData)) return;
    if (activeTool === 'paint') onCellPaint(cell.cx, cell.cy);
    else if (activeTool === 'erase') onCellErase(cell.cx, cell.cy);
  }, [getGridCell, mapData, activeTool, onCellPaint, onCellErase]);

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isMouseDown.current = false;
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
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldScale * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)));

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
  for (let col = 0; col <= gridW; col++) {
    gridLines.push(
      <Line
        key={`v${col}`}
        points={[col * tileSize, 0, col * tileSize, gridH * tileSize]}
        stroke="rgba(255,255,255,0.1)"
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
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1 / zoom}
        listening={false}
      />
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!tileSize || !gridW || !gridH) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
        <p className="text-sm">Sélectionnez ou créez une carte dans le panneau gauche</p>
      </div>
    );
  }

  // ── Stage ─────────────────────────────────────────────────────────────────

  return (
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={zoom}
      scaleY={zoom}
      draggable={activeTool !== 'paint' && activeTool !== 'erase'}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDragEnd={handleDragEnd}
      style={{ cursor: activeTool === 'erase' ? 'crosshair' : 'default' }}
    >
      {/* ── Map background ── */}
      <Layer listening={false}>
        <Rect
          x={0}
          y={0}
          width={gridW * tileSize}
          height={gridH * tileSize}
          fill="#1a1a2e"
        />
      </Layer>

      {/* ── Décor layer (tiles images) ── */}
      <Layer listening={false}>
        {(tilesLayer?.gridTiles ?? []).map(tile => {
          const img = imageCache.get(tile.src);
          if (!img) return null;
          return (
            <KonvaImage
              key={`tile-${tile.cx}-${tile.cy}`}
              x={tile.cx * tileSize}
              y={tile.cy * tileSize}
              width={tileSize}
              height={tileSize}
              image={img}
              listening={false}
            />
          );
        })}
      </Layer>

      {/* ── Collision layer (red squares) ── */}
      <Layer listening={false} opacity={activeLayer === 'collision' ? 0.8 : 0.4}>
        {collisionCells.map(({ cx, cy }) => (
          <Rect
            key={`col-${cx}-${cy}`}
            x={cx * tileSize}
            y={cy * tileSize}
            width={tileSize}
            height={tileSize}
            fill={LAYER_COLORS.collision}
            listening={false}
          />
        ))}
      </Layer>

      {/* ── Trigger zones (dialogue) ── */}
      <Layer listening={false} opacity={activeLayer === 'triggers' ? 0.9 : 0.5}>
        {triggerZones.map(zone => (
          <Rect
            key={`trigger-${zone.id}`}
            x={zone.zone.x}
            y={zone.zone.y}
            width={zone.zone.width}
            height={zone.zone.height}
            fill={LAYER_COLORS.triggers}
            stroke="rgba(60,220,100,0.8)"
            strokeWidth={1}
            listening={false}
          />
        ))}
        {triggerZones.map(zone => (
          <Text
            key={`trigger-label-${zone.id}`}
            x={zone.zone.x + 2}
            y={zone.zone.y + 2}
            text={zone.label}
            fontSize={8}
            fill="white"
            listening={false}
          />
        ))}
        {exitZones.map(zone => (
          <Rect
            key={`exit-${zone.id}`}
            x={zone.zone.x}
            y={zone.zone.y}
            width={zone.zone.width}
            height={zone.zone.height}
            fill="rgba(100,160,255,0.4)"
            stroke="rgba(100,160,255,0.8)"
            strokeWidth={1}
            listening={false}
          />
        ))}
      </Layer>

      {/* ── Grid overlay ── */}
      <Layer listening={false}>
        {gridLines}
      </Layer>

      {/* ── Hover preview ── */}
      {hoveredCell && isInBounds(hoveredCell.cx, hoveredCell.cy, mapData) && (
        <Layer listening={false}>
          <Rect
            x={hoveredCell.cx * tileSize}
            y={hoveredCell.cy * tileSize}
            width={tileSize}
            height={tileSize}
            fill={activeTool === 'erase' ? 'rgba(255,60,60,0.35)' : 'rgba(255,255,255,0.2)'}
            stroke={activeTool === 'erase' ? 'rgba(255,60,60,0.8)' : 'rgba(255,255,255,0.6)'}
            strokeWidth={1.5 / zoom}
            listening={false}
          />
        </Layer>
      )}
    </Stage>
  );
}
