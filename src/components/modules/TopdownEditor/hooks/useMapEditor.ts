/**
 * useMapEditor — État local de l'éditeur de carte topdown
 *
 * Gère : tuile sélectionnée, couche active, outil actif, zoom/pan,
 *        grille, dim des couches inactives.
 * Les mutations de données passent par mapsStore (via getState() dans les handlers).
 * La visibilité/opacité/lock des couches sont stockées DANS LayerInstance (_ac_*).
 *
 * @module components/modules/TopdownEditor/hooks/useMapEditor
 */

import { useState, useCallback, useEffect } from 'react';
import { useMapsStore } from '@/stores/mapsStore';
import type { LayerType, TileInstance, MapData } from '@/types/map';
import type { SelectedTile } from '@/types/tileset';

// ============================================================================
// TYPES
// ============================================================================

export type EditorTool = 'paint' | 'erase' | 'eyedropper' | 'fill' | 'selection';

/** Clipboard tuiles en mémoire session (partagé entre cartes) */
let TILE_CLIPBOARD: {
  tiles: Array<{ dcx: number; dcy: number; tile: TileInstance }>;
  cw: number;
  ch: number;
} | null = null;

export interface MapEditorState {
  selectedMapId: string | null;
  activeTool: EditorTool;
  activeLayer: LayerType;
  /** Index dans les couches de type 'tiles' uniquement (0 = première couche tuile) */
  activeTileLayerIndex: number;
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
  showGrid: boolean;
  dimInactiveLayers: boolean;
  showSpriteVisuals: boolean;
}

export interface MapEditorActions {
  selectMap: (mapId: string) => void;
  setActiveTool: (tool: EditorTool) => void;
  setActiveLayer: (layer: LayerType) => void;
  setActiveTileLayerIndex: (index: number) => void;
  setSelectedTile: (tile: SelectedTile | null) => void;
  setZoom: (zoom: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setHoveredCell: (cell: { cx: number; cy: number } | null) => void;
  setIsPainting: (painting: boolean) => void;
  paintCell: (cx: number, cy: number) => void;
  eraseCell: (cx: number, cy: number) => void;
  fillCell: (cx: number, cy: number) => void;
  toggleGrid: () => void;
  toggleDimInactive: () => void;
  toggleFlipX: () => void;
  toggleFlipY: () => void;
  toggleStackMode: () => void;
  toggleSpriteVisuals: () => void;
  /** Copie les tuiles de la sélection dans le presse-papier session */
  copySelection: (rect: { cx: number; cy: number; cw: number; ch: number }) => void;
  /** Colle les tuiles du presse-papier à (toCx, toCy), retourne le rect collé ou null */
  pasteSelection: (
    toCx: number,
    toCy: number
  ) => { cx: number; cy: number; cw: number; ch: number } | null;
  /** Efface les tuiles dans la zone sélectionnée (couche active uniquement) */
  eraseSelection: (rect: { cx: number; cy: number; cw: number; ch: number }) => void;
  /** Déplace les tuiles de fromRect vers toCx/toCy (couper-coller, couche active uniquement) */
  moveSelection: (
    fromRect: { cx: number; cy: number; cw: number; ch: number },
    toCx: number,
    toCy: number
  ) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LAST_MAP_KEY = 'ac_last_map_id';

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
    return maps.some((m) => m.id === stored) ? stored : (maps[maps.length - 1]?.id ?? null);
  });
  const [activeTool, setActiveTool] = useState<EditorTool>('paint');
  const [activeLayer, setActiveLayer] = useState<LayerType>('tiles');
  const [activeTileLayerIndex, setActiveTileLayerIndex] = useState<number>(() => {
    // Restore the last active layer for this map, keyed by selectedMapId
    const maps = useMapsStore.getState().maps;
    const storedId = localStorage.getItem('ac_selected_map');
    const mapId = maps.some((m) => m.id === storedId)
      ? storedId
      : (maps[maps.length - 1]?.id ?? null);
    if (!mapId) return 0;
    const stored = localStorage.getItem(`ac_active_layer_${mapId}`);
    const parsed = stored ? parseInt(stored, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
  const [selectedTile, setSelectedTile] = useState<SelectedTile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ cx: number; cy: number } | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [stackMode, setStackMode] = useState(false);

  // ── Render options ─────────────────────────────────────────────────────────
  const [showGrid, setShowGrid] = useState(true);
  const [dimInactiveLayers, setDimInactiveLayers] = useState(true);
  const [showSpriteVisuals, setShowSpriteVisuals] = useState(true);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const selectMap = useCallback((mapId: string) => {
    setSelectedMapId(mapId);
    localStorage.setItem(LAST_MAP_KEY, mapId);
    setStagePos({ x: 0, y: 0 });
    setZoom(1);
    // Restore activeTileLayerIndex for this map (clamped to actual layer count)
    const mapData = useMapsStore.getState().mapDataById[mapId];
    const tileLayerCount = mapData
      ? mapData.layerInstances.filter((l) => l.__type === 'tiles').length
      : 1;
    const stored = localStorage.getItem(`ac_active_layer_${mapId}`);
    const parsed = stored ? parseInt(stored, 10) : 0;
    const raw = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setActiveTileLayerIndex(Math.min(raw, Math.max(0, tileLayerCount - 1)));
  }, []);

  // Persist active layer index per map so it survives page reloads
  useEffect(() => {
    if (selectedMapId !== null) {
      localStorage.setItem(`ac_active_layer_${selectedMapId}`, String(activeTileLayerIndex));
    }
  }, [activeTileLayerIndex, selectedMapId]);

  // ── Render toggles ─────────────────────────────────────────────────────────
  const toggleGrid = useCallback(() => setShowGrid((v) => !v), []);
  const toggleDimInactive = useCallback(() => setDimInactiveLayers((v) => !v), []);
  const toggleSpriteVisuals = useCallback(() => setShowSpriteVisuals((v) => !v), []);
  const toggleFlipX = useCallback(() => setFlipX((v) => !v), []);
  const toggleFlipY = useCallback(() => setFlipY((v) => !v), []);
  const toggleStackMode = useCallback(() => setStackMode((v) => !v), []);

  // ── Paint ──────────────────────────────────────────────────────────────────

  /**
   * Paint a cell (or a multi-tile region) on the active layer.
   * Called from canvas mouse handlers — uses getState() (correct: called in handler, not render).
   *
   * Si selectedTile.regionCols > 1 ou regionRows > 1, peint un motif complet
   * à partir de la cellule (cx, cy) vers le bas-droite.
   */
  const paintCell = useCallback(
    (cx: number, cy: number) => {
      if (!selectedMapId) return;
      const store = useMapsStore.getState();
      const mapData = store.getMapData(selectedMapId);
      if (!mapData) return;

      const newData: MapData = structuredClone(mapData);

      if (activeLayer === 'tiles') {
        if (!selectedTile) return;
        const tileLayers = newData.layerInstances.filter((l) => l.__type === 'tiles');
        const layer = tileLayers[activeTileLayerIndex] ?? tileLayers[0];
        if (!layer) return;
        // Guard: layer locked → skip
        if (layer._ac_locked) return;

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
              layer.gridTiles = layer.gridTiles.filter(
                (t) => !(t.cx === targetCx && t.cy === targetCy)
              );
            }

            const tile: TileInstance = {
              cx: targetCx,
              cy: targetCy,
              src: selectedTile.asset.url ?? selectedTile.asset.path,
              ...(selectedTile.tileW > 0
                ? {
                    tileX: selectedTile.tileX + dc * stepX,
                    tileY: selectedTile.tileY + dr * stepY,
                    tileW: selectedTile.tileW,
                    tileH: selectedTile.tileH,
                  }
                : {}),
              f: tileF,
            };
            layer.gridTiles.push(tile);
          }
        }
      } else if (activeLayer === 'collision') {
        const layer = newData.layerInstances.find((l) => l.__type === 'collision');
        if (!layer) return;
        if (layer._ac_locked) return;
        if (!layer.intGrid) layer.intGrid = [];
        const idx = cy * layer.__cWid + cx;
        if (!layer.intGrid.includes(idx)) {
          layer.intGrid.push(idx);
        }
      }

      store.updateMapData(selectedMapId, newData);
    },
    [selectedMapId, activeLayer, activeTileLayerIndex, selectedTile, flipX, flipY, stackMode]
  );

  // ── Erase ──────────────────────────────────────────────────────────────────

  const eraseCell = useCallback(
    (cx: number, cy: number) => {
      if (!selectedMapId) return;
      const store = useMapsStore.getState();
      const mapData = store.getMapData(selectedMapId);
      if (!mapData) return;

      const newData: MapData = structuredClone(mapData);

      if (activeLayer === 'tiles') {
        const tileLayers = newData.layerInstances.filter((l) => l.__type === 'tiles');
        const layer = tileLayers[activeTileLayerIndex] ?? tileLayers[0];
        if (!layer) return;
        if (layer._ac_locked) return;
        layer.gridTiles = layer.gridTiles.filter((t) => !(t.cx === cx && t.cy === cy));
      } else if (activeLayer === 'collision') {
        const layer = newData.layerInstances.find((l) => l.__type === 'collision');
        if (!layer || !layer.intGrid) return;
        if (layer._ac_locked) return;
        const idx = cy * layer.__cWid + cx;
        layer.intGrid = layer.intGrid.filter((i) => i !== idx);
      }

      store.updateMapData(selectedMapId, newData);
    },
    [selectedMapId, activeLayer, activeTileLayerIndex]
  );

  // ── Fill (BFS flood fill) ──────────────────────────────────────────────────

  /**
   * Flood-fill à partir de la cellule (cx, cy).
   * - Couche tiles : remplit toutes les cellules adjacentes ayant la même source (ou vides).
   * - Couche collision : remplit/efface un bloc de cellules connexes de même état.
   */
  const fillCell = useCallback(
    (cx: number, cy: number) => {
      if (!selectedMapId) return;
      const store = useMapsStore.getState();
      const mapData = store.getMapData(selectedMapId);
      if (!mapData) return;

      const newData: MapData = structuredClone(mapData);
      const gridW = Math.floor(newData.pxWid / newData.__gridSize);
      const gridH = Math.floor(newData.pxHei / newData.__gridSize);

      if (activeLayer === 'tiles') {
        if (!selectedTile) return;
        const tileLayers = newData.layerInstances.filter((l) => l.__type === 'tiles');
        const layer = tileLayers[activeTileLayerIndex] ?? tileLayers[0];
        if (!layer) return;
        if (layer._ac_locked) return;

        // Lookup Map O(1) par cellule — évite O(N²) fill sur map dense (konva-patterns audit)
        const tileMap = new Map(layer.gridTiles.map((t) => [`${t.cx},${t.cy}`, t]));

        // Tile à la cellule de départ (peut être null = cellule vide)
        const startTile = tileMap.get(`${cx},${cy}`) ?? null;
        const targetSrc = startTile?.src ?? null;

        // Si on essaie de peindre la même tuile, ne rien faire
        const newSrc = selectedTile.asset.url ?? selectedTile.asset.path;
        if (
          targetSrc === newSrc &&
          (selectedTile.tileW === 0 ||
            (startTile?.tileX === selectedTile.tileX && startTile?.tileY === selectedTile.tileY))
        )
          return;

        const cells = bfsFill(cx, cy, gridW, gridH, (fcx, fcy) => {
          const t = tileMap.get(`${fcx},${fcy}`);
          return (t?.src ?? null) === targetSrc;
        });

        const fillSet = new Set(cells.map((c) => `${c.cx},${c.cy}`));
        layer.gridTiles = layer.gridTiles.filter((t) => !fillSet.has(`${t.cx},${t.cy}`));

        for (const cell of cells) {
          layer.gridTiles.push({
            cx: cell.cx,
            cy: cell.cy,
            src: newSrc,
            ...(selectedTile.tileW > 0
              ? {
                  tileX: selectedTile.tileX,
                  tileY: selectedTile.tileY,
                  tileW: selectedTile.tileW,
                  tileH: selectedTile.tileH,
                }
              : {}),
            f: 0,
          });
        }
      } else if (activeLayer === 'collision') {
        const layer = newData.layerInstances.find((l) => l.__type === 'collision');
        if (!layer) return;
        if (layer._ac_locked) return;
        if (!layer.intGrid) layer.intGrid = [];

        const collisionSet = new Set(layer.intGrid);
        const cw = layer.__cWid;
        const ch = layer.__cHei;
        const startSolid = collisionSet.has(cy * cw + cx);

        const cells = bfsFill(
          cx,
          cy,
          cw,
          ch,
          (fcx, fcy) => collisionSet.has(fcy * cw + fcx) === startSolid
        );

        if (startSolid) {
          // Erase all
          const removeSet = new Set(cells.map((c) => c.cy * cw + c.cx));
          layer.intGrid = layer.intGrid.filter((i) => !removeSet.has(i));
        } else {
          // Add all
          for (const cell of cells) {
            const idx = cell.cy * cw + cell.cx;
            if (!layer.intGrid.includes(idx)) layer.intGrid.push(idx);
          }
        }
      }

      store.updateMapData(selectedMapId, newData);
    },
    [selectedMapId, activeLayer, activeTileLayerIndex, selectedTile]
  );

  // ── Selection actions ──────────────────────────────────────────────────────

  const copySelection = useCallback(
    (rect: { cx: number; cy: number; cw: number; ch: number }) => {
      if (!selectedMapId || activeLayer !== 'tiles') return;
      const mapData = useMapsStore.getState().getMapData(selectedMapId);
      if (!mapData) return;
      const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
      const layer = tileLayers[activeTileLayerIndex] ?? tileLayers[0];
      if (!layer) return;
      const tiles = layer.gridTiles
        .filter(
          (t) =>
            t.cx >= rect.cx &&
            t.cx < rect.cx + rect.cw &&
            t.cy >= rect.cy &&
            t.cy < rect.cy + rect.ch
        )
        .map((t) => ({ dcx: t.cx - rect.cx, dcy: t.cy - rect.cy, tile: { ...t } }));
      TILE_CLIPBOARD = { tiles, cw: rect.cw, ch: rect.ch };
    },
    [selectedMapId, activeLayer, activeTileLayerIndex]
  );

  const pasteSelection = useCallback(
    (toCx: number, toCy: number): { cx: number; cy: number; cw: number; ch: number } | null => {
      if (!selectedMapId || activeLayer !== 'tiles' || !TILE_CLIPBOARD) return null;
      const store = useMapsStore.getState();
      const mapData = store.getMapData(selectedMapId);
      if (!mapData) return null;
      const newData: MapData = structuredClone(mapData);
      const tileLayers = newData.layerInstances.filter((l) => l.__type === 'tiles');
      const layer = tileLayers[activeTileLayerIndex] ?? tileLayers[0];
      if (!layer || layer._ac_locked) return null;

      const { tiles, cw, ch } = TILE_CLIPBOARD;
      // Remove tiles at destination that will be overwritten
      const destKeys = new Set(tiles.map(({ dcx, dcy }) => `${toCx + dcx},${toCy + dcy}`));
      layer.gridTiles = layer.gridTiles.filter((t) => !destKeys.has(`${t.cx},${t.cy}`));
      // Paint clipboard tiles
      for (const { dcx, dcy, tile } of tiles) {
        layer.gridTiles.push({ ...tile, cx: toCx + dcx, cy: toCy + dcy });
      }
      store.updateMapData(selectedMapId, newData);
      return { cx: toCx, cy: toCy, cw, ch };
    },
    [selectedMapId, activeLayer, activeTileLayerIndex]
  );

  const eraseSelection = useCallback(
    (rect: { cx: number; cy: number; cw: number; ch: number }) => {
      if (!selectedMapId || activeLayer !== 'tiles') return;
      const store = useMapsStore.getState();
      const mapData = store.getMapData(selectedMapId);
      if (!mapData) return;
      const newData: MapData = structuredClone(mapData);
      const tileLayers = newData.layerInstances.filter((l) => l.__type === 'tiles');
      const layer = tileLayers[activeTileLayerIndex] ?? tileLayers[0];
      if (!layer || layer._ac_locked) return;
      layer.gridTiles = layer.gridTiles.filter(
        (t) =>
          t.cx < rect.cx || t.cx >= rect.cx + rect.cw || t.cy < rect.cy || t.cy >= rect.cy + rect.ch
      );
      store.updateMapData(selectedMapId, newData);
    },
    [selectedMapId, activeLayer, activeTileLayerIndex]
  );

  const moveSelection = useCallback(
    (fromRect: { cx: number; cy: number; cw: number; ch: number }, toCx: number, toCy: number) => {
      if (!selectedMapId || activeLayer !== 'tiles') return;
      const store = useMapsStore.getState();
      const mapData = store.getMapData(selectedMapId);
      if (!mapData) return;
      const newData: MapData = structuredClone(mapData);
      const tileLayers = newData.layerInstances.filter((l) => l.__type === 'tiles');
      const layer = tileLayers[activeTileLayerIndex] ?? tileLayers[0];
      if (!layer || layer._ac_locked) return;

      const dx = toCx - fromRect.cx;
      const dy = toCy - fromRect.cy;

      // Extract tiles inside selection
      const selected = layer.gridTiles.filter(
        (t) =>
          t.cx >= fromRect.cx &&
          t.cx < fromRect.cx + fromRect.cw &&
          t.cy >= fromRect.cy &&
          t.cy < fromRect.cy + fromRect.ch
      );

      // Remove source tiles
      layer.gridTiles = layer.gridTiles.filter(
        (t) =>
          t.cx < fromRect.cx ||
          t.cx >= fromRect.cx + fromRect.cw ||
          t.cy < fromRect.cy ||
          t.cy >= fromRect.cy + fromRect.ch
      );

      // Remove any tiles at destination that would be overwritten
      const destKeys = new Set(selected.map((t) => `${t.cx + dx},${t.cy + dy}`));
      layer.gridTiles = layer.gridTiles.filter((t) => !destKeys.has(`${t.cx},${t.cy}`));

      // Paint at destination
      for (const t of selected) {
        layer.gridTiles.push({ ...t, cx: t.cx + dx, cy: t.cy + dy });
      }

      store.updateMapData(selectedMapId, newData);
    },
    [selectedMapId, activeLayer, activeTileLayerIndex]
  );

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    selectedMapId,
    activeTool,
    activeLayer,
    activeTileLayerIndex,
    selectedTile,
    zoom,
    stagePos,
    hoveredCell,
    isPainting,
    flipX,
    flipY,
    stackMode,
    showGrid,
    dimInactiveLayers,
    showSpriteVisuals,
    selectMap,
    setActiveTool,
    setActiveLayer,
    setActiveTileLayerIndex,
    setSelectedTile,
    setZoom,
    setStagePos,
    setHoveredCell,
    setIsPainting,
    paintCell,
    eraseCell,
    fillCell,
    toggleGrid,
    toggleDimInactive,
    toggleFlipX,
    toggleFlipY,
    toggleStackMode,
    toggleSpriteVisuals,
    copySelection,
    pasteSelection,
    eraseSelection,
    moveSelection,
  };
}
