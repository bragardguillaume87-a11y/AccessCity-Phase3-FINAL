/**
 * useMapEditor — État local de l'éditeur de carte topdown
 *
 * Gère : tuile sélectionnée, couche active, outil actif, zoom/pan,
 *        visibilité/opacité des couches, grille, dim des couches inactives.
 * Les mutations de données passent par mapsStore (via getState() dans les handlers).
 *
 * @module components/modules/TopdownEditor/hooks/useMapEditor
 */

import { useState, useCallback } from 'react';
import { useMapsStore } from '@/stores/mapsStore';
import type { LayerType, TileInstance, MapData } from '@/types/map';
import type { SelectedTile } from '@/types/tileset';

// ============================================================================
// TYPES
// ============================================================================

export type EditorTool = 'paint' | 'erase' | 'eyedropper' | 'fill';

export interface LayerVisibility   extends Record<LayerType, boolean> {}
export interface LayerOpacity      extends Record<LayerType, number>  {}

export interface MapEditorState {
  selectedMapId: string | null;
  activeTool: EditorTool;
  activeLayer: LayerType;
  selectedTile: SelectedTile | null;
  zoom: number;
  stagePos: { x: number; y: number };
  hoveredCell: { cx: number; cy: number } | null;
  isPainting: boolean;
  // Brush modifiers
  flipX: boolean;
  flipY: boolean;
  stackMode: boolean;
  // Render options
  layerVisibility: LayerVisibility;
  layerOpacity: LayerOpacity;
  showGrid: boolean;
  dimInactiveLayers: boolean;
}

export interface MapEditorActions {
  selectMap: (mapId: string) => void;
  setActiveTool: (tool: EditorTool) => void;
  setActiveLayer: (layer: LayerType) => void;
  setSelectedTile: (tile: SelectedTile | null) => void;
  setZoom: (zoom: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setHoveredCell: (cell: { cx: number; cy: number } | null) => void;
  setIsPainting: (painting: boolean) => void;
  paintCell: (cx: number, cy: number) => void;
  eraseCell: (cx: number, cy: number) => void;
  fillCell: (cx: number, cy: number) => void;
  toggleLayerVisibility: (layer: LayerType) => void;
  setLayerOpacity: (layer: LayerType, opacity: number) => void;
  toggleGrid: () => void;
  toggleDimInactive: () => void;
  toggleFlipX: () => void;
  toggleFlipY: () => void;
  toggleStackMode: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LAST_MAP_KEY = 'ac_last_map_id';

const DEFAULT_VISIBILITY: LayerVisibility = { tiles: true, collision: true, triggers: true };
const DEFAULT_OPACITY: LayerOpacity       = { tiles: 1.0, collision: 0.7, triggers: 0.7 };

// ============================================================================
// HELPERS
// ============================================================================

/** BFS flood-fill sur la grille — retourne les cellules (cx, cy) à remplir */
function bfsFill(
  startCx: number,
  startCy: number,
  gridW: number,
  gridH: number,
  matchFn: (cx: number, cy: number) => boolean
): Array<{ cx: number; cy: number }> {
  const visited = new Set<number>();
  const queue: Array<{ cx: number; cy: number }> = [{ cx: startCx, cy: startCy }];
  const result: Array<{ cx: number; cy: number }> = [];

  while (queue.length > 0) {
    const cell = queue.shift()!;
    if (cell.cx < 0 || cell.cy < 0 || cell.cx >= gridW || cell.cy >= gridH) continue;
    const key = cell.cy * gridW + cell.cx;
    if (visited.has(key)) continue;
    visited.add(key);
    if (!matchFn(cell.cx, cell.cy)) continue;
    result.push(cell);
    queue.push({ cx: cell.cx - 1, cy: cell.cy });
    queue.push({ cx: cell.cx + 1, cy: cell.cy });
    queue.push({ cx: cell.cx, cy: cell.cy - 1 });
    queue.push({ cx: cell.cx, cy: cell.cy + 1 });
  }
  return result;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMapEditor(): MapEditorState & MapEditorActions {
  // Restore the last opened map — verify it still exists in the store
  const [selectedMapId, setSelectedMapId] = useState<string | null>(() => {
    const stored = localStorage.getItem(LAST_MAP_KEY);
    if (!stored) return null;
    const maps = useMapsStore.getState().maps;
    return maps.some(m => m.id === stored) ? stored : (maps[maps.length - 1]?.id ?? null);
  });
  const [activeTool, setActiveTool] = useState<EditorTool>('paint');
  const [activeLayer, setActiveLayer] = useState<LayerType>('tiles');
  const [selectedTile, setSelectedTile] = useState<SelectedTile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ cx: number; cy: number } | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [stackMode, setStackMode] = useState(false);

  // ── Render options ─────────────────────────────────────────────────────────
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_VISIBILITY);
  const [layerOpacity, setLayerOpacityState] = useState<LayerOpacity>(DEFAULT_OPACITY);
  const [showGrid, setShowGrid] = useState(true);
  const [dimInactiveLayers, setDimInactiveLayers] = useState(true);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const selectMap = useCallback((mapId: string) => {
    setSelectedMapId(mapId);
    localStorage.setItem(LAST_MAP_KEY, mapId);
    setStagePos({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // ── Render toggles ─────────────────────────────────────────────────────────
  const toggleLayerVisibility = useCallback((layer: LayerType) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const setLayerOpacity = useCallback((layer: LayerType, opacity: number) => {
    setLayerOpacityState(prev => ({ ...prev, [layer]: opacity }));
  }, []);

  const toggleGrid = useCallback(() => setShowGrid(v => !v), []);
  const toggleDimInactive = useCallback(() => setDimInactiveLayers(v => !v), []);
  const toggleFlipX = useCallback(() => setFlipX(v => !v), []);
  const toggleFlipY = useCallback(() => setFlipY(v => !v), []);
  const toggleStackMode = useCallback(() => setStackMode(v => !v), []);;

  // ── Paint ──────────────────────────────────────────────────────────────────

  /**
   * Paint a cell (or a multi-tile region) on the active layer.
   * Called from canvas mouse handlers — uses getState() (correct: called in handler, not render).
   *
   * Si selectedTile.regionCols > 1 ou regionRows > 1, peint un motif complet
   * à partir de la cellule (cx, cy) vers le bas-droite.
   */
  const paintCell = useCallback((cx: number, cy: number) => {
    if (!selectedMapId) return;
    const store = useMapsStore.getState();
    const mapData = store.getMapData(selectedMapId);
    if (!mapData) return;

    const newData: MapData = structuredClone(mapData);

    if (activeLayer === 'tiles') {
      if (!selectedTile) return;
      const layer = newData.layerInstances.find(l => l.__type === 'tiles');
      if (!layer) return;

      const rCols = selectedTile.regionCols ?? 1;
      const rRows = selectedTile.regionRows ?? 1;
      const stepX = selectedTile.tileStepX ?? selectedTile.tileW;
      const stepY = selectedTile.tileStepY ?? selectedTile.tileH;

      const tileF: 0 | 1 | 2 | 3 = ((flipX ? 1 : 0) | (flipY ? 2 : 0)) as 0 | 1 | 2 | 3;

      for (let dr = 0; dr < rRows; dr++) {
        for (let dc = 0; dc < rCols; dc++) {
          const targetCx = cx + dc;
          const targetCy = cy + dr;
          // Stack mode: keep existing tiles, just add on top
          if (!stackMode) {
            layer.gridTiles = layer.gridTiles.filter(t => !(t.cx === targetCx && t.cy === targetCy));
          }

          const tile: TileInstance = {
            cx: targetCx,
            cy: targetCy,
            src: selectedTile.asset.url ?? selectedTile.asset.path,
            ...(selectedTile.tileW > 0 ? {
              tileX: selectedTile.tileX + dc * stepX,
              tileY: selectedTile.tileY + dr * stepY,
              tileW: selectedTile.tileW,
              tileH: selectedTile.tileH,
            } : {}),
            f: tileF,
          };
          layer.gridTiles.push(tile);
        }
      }

    } else if (activeLayer === 'collision') {
      const layer = newData.layerInstances.find(l => l.__type === 'collision');
      if (!layer) return;
      if (!layer.intGrid) layer.intGrid = [];
      const idx = cy * layer.__cWid + cx;
      if (!layer.intGrid.includes(idx)) {
        layer.intGrid.push(idx);
      }
    }

    store.updateMapData(selectedMapId, newData);
  }, [selectedMapId, activeLayer, selectedTile, flipX, flipY, stackMode]);

  // ── Erase ──────────────────────────────────────────────────────────────────

  const eraseCell = useCallback((cx: number, cy: number) => {
    if (!selectedMapId) return;
    const store = useMapsStore.getState();
    const mapData = store.getMapData(selectedMapId);
    if (!mapData) return;

    const newData: MapData = structuredClone(mapData);

    if (activeLayer === 'tiles') {
      const layer = newData.layerInstances.find(l => l.__type === 'tiles');
      if (!layer) return;
      layer.gridTiles = layer.gridTiles.filter(t => !(t.cx === cx && t.cy === cy));

    } else if (activeLayer === 'collision') {
      const layer = newData.layerInstances.find(l => l.__type === 'collision');
      if (!layer || !layer.intGrid) return;
      const idx = cy * layer.__cWid + cx;
      layer.intGrid = layer.intGrid.filter(i => i !== idx);
    }

    store.updateMapData(selectedMapId, newData);
  }, [selectedMapId, activeLayer]);

  // ── Fill (BFS flood fill) ──────────────────────────────────────────────────

  /**
   * Flood-fill à partir de la cellule (cx, cy).
   * - Couche tiles : remplit toutes les cellules adjacentes ayant la même source (ou vides).
   * - Couche collision : remplit/efface un bloc de cellules connexes de même état.
   */
  const fillCell = useCallback((cx: number, cy: number) => {
    if (!selectedMapId) return;
    const store = useMapsStore.getState();
    const mapData = store.getMapData(selectedMapId);
    if (!mapData) return;

    const newData: MapData = structuredClone(mapData);
    const gridW = Math.floor(newData.pxWid / newData.__gridSize);
    const gridH = Math.floor(newData.pxHei / newData.__gridSize);

    if (activeLayer === 'tiles') {
      if (!selectedTile) return;
      const layer = newData.layerInstances.find(l => l.__type === 'tiles');
      if (!layer) return;

      // Tile à la cellule de départ (peut être null = cellule vide)
      const startTile = layer.gridTiles.find(t => t.cx === cx && t.cy === cy);
      const targetSrc = startTile?.src ?? null;

      // Si on essaie de peindre la même tuile, ne rien faire
      const newSrc = selectedTile.asset.url ?? selectedTile.asset.path;
      if (targetSrc === newSrc && (selectedTile.tileW === 0 || (startTile?.tileX === selectedTile.tileX && startTile?.tileY === selectedTile.tileY))) return;

      const cells = bfsFill(cx, cy, gridW, gridH, (fcx, fcy) => {
        const t = layer.gridTiles.find(ti => ti.cx === fcx && ti.cy === fcy);
        return (t?.src ?? null) === targetSrc;
      });

      const fillSet = new Set(cells.map(c => `${c.cx},${c.cy}`));
      layer.gridTiles = layer.gridTiles.filter(t => !fillSet.has(`${t.cx},${t.cy}`));

      for (const cell of cells) {
        layer.gridTiles.push({
          cx: cell.cx,
          cy: cell.cy,
          src: newSrc,
          ...(selectedTile.tileW > 0 ? {
            tileX: selectedTile.tileX,
            tileY: selectedTile.tileY,
            tileW: selectedTile.tileW,
            tileH: selectedTile.tileH,
          } : {}),
          f: 0,
        });
      }

    } else if (activeLayer === 'collision') {
      const layer = newData.layerInstances.find(l => l.__type === 'collision');
      if (!layer) return;
      if (!layer.intGrid) layer.intGrid = [];

      const collisionSet = new Set(layer.intGrid);
      const cw = layer.__cWid;
      const ch = layer.__cHei;
      const startSolid = collisionSet.has(cy * cw + cx);

      const cells = bfsFill(cx, cy, cw, ch, (fcx, fcy) =>
        collisionSet.has(fcy * cw + fcx) === startSolid
      );

      if (startSolid) {
        // Erase all
        const removeSet = new Set(cells.map(c => c.cy * cw + c.cx));
        layer.intGrid = layer.intGrid.filter(i => !removeSet.has(i));
      } else {
        // Add all
        for (const cell of cells) {
          const idx = cell.cy * cw + cell.cx;
          if (!layer.intGrid.includes(idx)) layer.intGrid.push(idx);
        }
      }
    }

    store.updateMapData(selectedMapId, newData);
  }, [selectedMapId, activeLayer, selectedTile]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    selectedMapId,
    activeTool,
    activeLayer,
    selectedTile,
    zoom,
    stagePos,
    hoveredCell,
    isPainting,
    flipX,
    flipY,
    stackMode,
    layerVisibility,
    layerOpacity,
    showGrid,
    dimInactiveLayers,
    selectMap,
    setActiveTool,
    setActiveLayer,
    setSelectedTile,
    setZoom,
    setStagePos,
    setHoveredCell,
    setIsPainting,
    paintCell,
    eraseCell,
    fillCell,
    toggleLayerVisibility,
    setLayerOpacity,
    toggleGrid,
    toggleDimInactive,
    toggleFlipX,
    toggleFlipY,
    toggleStackMode,
  };
}
