/**
 * TopdownEditor — Shell principal de l'éditeur de carte topdown 2D
 *
 * Layout 3 colonnes :
 *   [Sidebar gauche 200px]  |  [Canvas flex-1]  |  [Palette droite 180px]
 *
 * La sidebar gauche contient :
 *   - MapSidebar (liste des cartes)
 *   - LayerPanel (couche active + outil)
 *
 * Le canvas centre : react-konva Stage (zoom + pan + paint)
 * La palette droite : TilePalette (assets images / symboles selon couche)
 *
 * @module components/modules/TopdownEditor/TopdownEditor
 */

import { useRef, useEffect, useState } from 'react';
import { useMapsStore } from '@/stores/mapsStore';
import { useAssets } from '@/hooks/useAssets';
import { useMapEditor } from './hooks/useMapEditor';
import { useTileset } from './hooks/useTileset';
import MapCanvas from './MapCanvas';
import MapSidebar from './MapSidebar';
import LayerPanel from './LayerPanel';
import TilePalette from './TilePalette';
import type { MapData } from '@/types/map';

// Empty MapData for when no map is selected
const EMPTY_MAP_DATA: MapData = {
  identifier: '',
  uid: '',
  worldX: 0,
  worldY: 0,
  pxWid: 640,
  pxHei: 480,
  __gridSize: 32,
  layerInstances: [
    { __identifier: 'Décor', __type: 'tiles', __gridSize: 32, __cWid: 20, __cHei: 15, gridTiles: [] },
    { __identifier: 'Collision', __type: 'collision', __gridSize: 32, __cWid: 20, __cHei: 15, gridTiles: [], intGrid: [] },
    { __identifier: 'Triggers', __type: 'triggers', __gridSize: 32, __cWid: 20, __cHei: 15, gridTiles: [] },
  ],
  _ac_dialogue_triggers: [],
  _ac_scene_exits: [],
};

export default function TopdownEditor() {
  const editor = useMapEditor();

  // Current map data from store
  const mapData = useMapsStore(s =>
    editor.selectedMapId ? (s.mapDataById[editor.selectedMapId] ?? EMPTY_MAP_DATA) : EMPTY_MAP_DATA
  );

  // Preload tile images
  const { assets } = useAssets();
  const imageAssets = assets.filter(a =>
    a.category !== 'audio' &&
    (a.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.path))
  );
  const imageCache = useTileset(imageAssets);

  // Container size for the canvas
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(container);
    // Initial size
    setContainerSize({
      width: Math.floor(container.clientWidth),
      height: Math.floor(container.clientHeight),
    });
    return () => observer.disconnect();
  }, []);

  // When tile layer is not active, no tile asset needed
  const effectiveTileAsset = editor.activeLayer === 'tiles' ? editor.selectedTileAsset : null;

  return (
    <div
      className="flex-1 flex overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
      aria-label="Éditeur de carte topdown"
    >
      {/* ── Left sidebar ── */}
      <aside
        className="flex-shrink-0 flex flex-col border-r border-border overflow-hidden"
        style={{ width: 200, background: 'var(--color-bg-surface)' }}
        aria-label="Cartes et couches"
      >
        {/* Map list (top, flex-1) */}
        <div className="flex-1 overflow-hidden border-b border-border">
          <MapSidebar
            selectedMapId={editor.selectedMapId}
            onSelectMap={editor.selectMap}
          />
        </div>

        {/* Layer panel (bottom, fixed height) */}
        <div className="flex-shrink-0" style={{ minHeight: 180 }}>
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Couches & Outils
            </p>
          </div>
          <LayerPanel
            activeLayer={editor.activeLayer}
            activeTool={editor.activeTool}
            onLayerChange={editor.setActiveLayer}
            onToolChange={editor.setActiveTool}
          />
        </div>
      </aside>

      {/* ── Canvas center ── */}
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-hidden relative"
        style={{ background: '#0d0d1a' }}
        aria-label="Canvas de la carte"
      >
        {/* Status bar */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-3 py-1 text-xs"
          style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--color-text-muted)' }}
        >
          <span>Zoom : {Math.round(editor.zoom * 100)}%</span>
          {editor.hoveredCell && (
            <span>Cellule : {editor.hoveredCell.cx}, {editor.hoveredCell.cy}</span>
          )}
          {editor.selectedMapId && (
            <span style={{ marginLeft: 'auto' }}>
              {mapData.pxWid / mapData.__gridSize} × {mapData.pxHei / mapData.__gridSize} tuiles
            </span>
          )}
          <span style={{ marginLeft: editor.selectedMapId ? 0 : 'auto' }}>
            Molette = zoom • Espace+drag = déplacer
          </span>
        </div>

        <MapCanvas
          mapData={mapData}
          activeLayer={editor.activeLayer}
          activeTool={editor.activeTool}
          imageCache={imageCache}
          zoom={editor.zoom}
          stagePos={editor.stagePos}
          hoveredCell={editor.hoveredCell}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          onZoomChange={editor.setZoom}
          onStagePosChange={editor.setStagePos}
          onCellHover={editor.setHoveredCell}
          onCellPaint={(cx, cy) => {
            if (editor.activeLayer === 'tiles' && !effectiveTileAsset) return;
            editor.paintCell(cx, cy);
          }}
          onCellErase={editor.eraseCell}
        />
      </div>

      {/* ── Right palette ── */}
      <aside
        className="flex-shrink-0 border-l border-border overflow-hidden flex flex-col"
        style={{ width: 180, background: 'var(--color-bg-surface)' }}
        aria-label="Palette de tuiles"
      >
        <TilePalette
          activeLayer={editor.activeLayer}
          selectedTileAsset={editor.selectedTileAsset}
          onSelectTile={editor.setSelectedTileAsset}
        />
      </aside>
    </div>
  );
}
