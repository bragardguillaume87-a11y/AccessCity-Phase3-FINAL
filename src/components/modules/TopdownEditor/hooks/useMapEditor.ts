/**
 * useMapEditor — État local de l'éditeur de carte topdown
 *
 * Gère : tuile sélectionnée, couche active, outil actif, zoom/pan.
 * Les mutations de données passent par mapsStore (via getState() dans les handlers).
 *
 * @module components/modules/TopdownEditor/hooks/useMapEditor
 */

import { useState, useCallback } from 'react';
import { useMapsStore } from '@/stores/mapsStore';
import type { LayerType, TileInstance, MapData } from '@/types/map';
import type { Asset } from '@/types/assets';

// ============================================================================
// TYPES
// ============================================================================

export type EditorTool = 'paint' | 'erase';

export interface MapEditorState {
  selectedMapId: string | null;
  activeTool: EditorTool;
  activeLayer: LayerType;
  selectedTileAsset: Asset | null;
  zoom: number;
  stagePos: { x: number; y: number };
  hoveredCell: { cx: number; cy: number } | null;
  isPainting: boolean;
}

export interface MapEditorActions {
  selectMap: (mapId: string) => void;
  setActiveTool: (tool: EditorTool) => void;
  setActiveLayer: (layer: LayerType) => void;
  setSelectedTileAsset: (asset: Asset | null) => void;
  setZoom: (zoom: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setHoveredCell: (cell: { cx: number; cy: number } | null) => void;
  setIsPainting: (painting: boolean) => void;
  paintCell: (cx: number, cy: number) => void;
  eraseCell: (cx: number, cy: number) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMapEditor(): MapEditorState & MapEditorActions {
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>('paint');
  const [activeLayer, setActiveLayer] = useState<LayerType>('tiles');
  const [selectedTileAsset, setSelectedTileAsset] = useState<Asset | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ cx: number; cy: number } | null>(null);
  const [isPainting, setIsPainting] = useState(false);

  const selectMap = useCallback((mapId: string) => {
    setSelectedMapId(mapId);
    setStagePos({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  /**
   * Paint a cell on the active layer.
   * Called from canvas mouse handlers — uses getState() (correct: called in handler, not render).
   */
  const paintCell = useCallback((cx: number, cy: number) => {
    if (!selectedMapId) return;
    const store = useMapsStore.getState();
    const mapData = store.getMapData(selectedMapId);
    if (!mapData) return;

    const newData: MapData = structuredClone(mapData);

    if (activeLayer === 'tiles') {
      if (!selectedTileAsset) return;
      const layer = newData.layerInstances.find(l => l.__type === 'tiles');
      if (!layer) return;
      // Remove existing tile at this cell, then add new one
      layer.gridTiles = layer.gridTiles.filter(t => !(t.cx === cx && t.cy === cy));
      const tile: TileInstance = { cx, cy, src: selectedTileAsset.url ?? selectedTileAsset.path, f: 0 };
      layer.gridTiles.push(tile);

    } else if (activeLayer === 'collision') {
      const layer = newData.layerInstances.find(l => l.__type === 'collision');
      if (!layer) return;
      if (!layer.intGrid) layer.intGrid = [];
      // Encode cell as a unique index: cy * width + cx
      const idx = cy * layer.__cWid + cx;
      if (!layer.intGrid.includes(idx)) {
        layer.intGrid.push(idx);
      }
    }
    // 'triggers' layer handled separately via zone tool (Sprint 4)

    store.updateMapData(selectedMapId, newData);
  }, [selectedMapId, activeLayer, selectedTileAsset]);

  /**
   * Erase a cell on the active layer.
   */
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

  return {
    selectedMapId,
    activeTool,
    activeLayer,
    selectedTileAsset,
    zoom,
    stagePos,
    hoveredCell,
    isPainting,
    selectMap,
    setActiveTool,
    setActiveLayer,
    setSelectedTileAsset,
    setZoom,
    setStagePos,
    setHoveredCell,
    setIsPainting,
    paintCell,
    eraseCell,
  };
}
