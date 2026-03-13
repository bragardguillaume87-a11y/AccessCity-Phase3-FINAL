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

import { useRef, useEffect, useState, useCallback, useLayoutEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useMapsStore, useTemporalMapsStore } from '@/stores/mapsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { MAP_ZOOM } from '@/config/mapEditorConfig';
import { useAssets } from '@/hooks/useAssets';
import { useMapEditor } from './hooks/useMapEditor';
import { useTileset } from './hooks/useTileset';
import MapCanvas from './MapCanvas';
import MapSidebar from './MapSidebar';
import LayerPanel from './LayerPanel';
import TilePalette from './TilePalette';
import SpritesPanel from './SpritesPanel';
import EntityPropertyPanel from './EntityPropertyPanel';
import TriggerZonePanel from './TriggerZonePanel';
import SoundPalette from './SoundPalette';
import type { MapData } from '@/types/map';
import type { EntityBehavior } from '@/types/sprite';

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
  _ac_entities: [],
};

// ── Responsive palette configuration ─────────────────────────────────────────
// Breakpoints : 720p (≥1280), 1080p (≥1920), 1440p (≥2560)
// Valeurs cibles : palette ≈ 22-25% de la largeur d'écran
// Min +50% max par rapport aux limites initiales (200/420)

function getPaletteConfig(screenWidth: number) {
  if (screenWidth >= 2560) return { min: 280, max: 800, default: 520 };  // 1440p
  if (screenWidth >= 1920) return { min: 240, max: 630, default: 420 };  // 1080p
  if (screenWidth >= 1280) return { min: 200, max: 480, default: 320 };  // 720p
  return                          { min: 180, max: 380, default: 260 };  // < 720p
}

const PALETTE_STORAGE_KEY  = 'ac_palette_width';
const SIDEBAR_STORAGE_KEY  = 'ac_sidebar_width';
const SIDEBAR_MIN          = 150;
const SIDEBAR_MAX          = 320;
const SIDEBAR_DEFAULT      = 200;

export default function TopdownEditor() {
  const editor = useMapEditor();

  // ── Undo/Redo (B1/B2) — temporal store zundo ─────────────────────────────
  const { undo, redo, pastStates, futureStates } = useTemporalMapsStore(s => s);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // ── Right panel tab (Tuiles | Sprites | Triggers) ────────────────────────
  const [rightTab, setRightTab] = useState<'tiles' | 'sprites' | 'triggers' | 'sounds'>('tiles');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // ── Badge de rechargement sur les onglets ─────────────────────────────────
  // Quand un upload se termine, l'onglet inactif montre un point pulsant
  const [assetsReloading, setAssetsReloading] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      setAssetsReloading(true);
      timer = setTimeout(() => setAssetsReloading(false), 3000);
    };
    window.addEventListener('asset-manifest-updated', handler);
    return () => {
      window.removeEventListener('asset-manifest-updated', handler);
      clearTimeout(timer);
    };
  }, []);

  // ── Entity placement state ─────────────────────────────────────────────────
  const [placingEntity, setPlacingEntity] = useState<{
    spriteUrl: string;
    behavior: EntityBehavior;
    displayName?: string;
  } | null>(null);

  // ── Entity selection state ────────────────────────────────────────────────
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const addEntity          = useMapsStore(s => s.addEntity);
  const removeEntity       = useMapsStore(s => s.removeEntity);
  const updateMapMetadata  = useMapsStore(s => s.updateMapMetadata);
  const resizeMap          = useMapsStore(s => s.resizeMap);

  // Player spawn position — read from current map metadata
  const mapMetadata = useMapsStore(s =>
    editor.selectedMapId ? s.maps.find(m => m.id === editor.selectedMapId) : undefined
  );
  const playerStartCx = mapMetadata?.playerStartCx ?? 2;
  const playerStartCy = mapMetadata?.playerStartCy ?? 2;

  // ── Resize map via canvas handles ─────────────────────────────────────────
  const handleResizeMap = useCallback((newW: number, newH: number) => {
    if (!editor.selectedMapId || !mapMetadata) return;
    resizeMap(editor.selectedMapId, mapMetadata.name, newW, newH, mapMetadata.tileSize);
  }, [editor.selectedMapId, mapMetadata, resizeMap]);

  // ── Move spawn via canvas clic (triggered in status bar toggle) ───────────
  const [isMovingSpawn, setIsMovingSpawn] = useState(false);

  // Current map data from store
  const mapData = useMapsStore(s =>
    editor.selectedMapId ? (s.mapDataById[editor.selectedMapId] ?? EMPTY_MAP_DATA) : EMPTY_MAP_DATA
  );

  // ── Export carte courante en JSON ─────────────────────────────────────────
  const handleExportMap = useCallback(() => {
    if (!editor.selectedMapId || !mapMetadata) return;
    const exportData = {
      _accesscity_map_version: '1.0',
      exportedAt: new Date().toISOString(),
      metadata: mapMetadata,
      data: mapData,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mapMetadata.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ac-map.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Carte exportée !', { description: mapMetadata.name });
  }, [editor.selectedMapId, mapMetadata, mapData]);

  // Preload tile images
  const { assets } = useAssets();
  // useMemo : stable reference → useTileset effect ne tourne que si les assets changent vraiment
  const imageAssets = useMemo(
    () => assets.filter(a =>
      a.category !== 'audio' &&
      (a.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.path))
    ),
    [assets]
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
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        // Ne pas écraser avec des dimensions nulles (flex CSS non propagé)
        if (w > 0 && h > 0) setContainerSize({ width: w, height: h });
      }
    });
    observer.observe(container);
    const w = Math.floor(container.clientWidth);
    const h = Math.floor(container.clientHeight);
    if (w > 0 && h > 0) setContainerSize({ width: w, height: h });
    return () => observer.disconnect();
  }, []);

  // ── Resizable palette ─────────────────────────────────────────────────────
  const [paletteWidth, setPaletteWidth] = useState(() => {
    const cfg = getPaletteConfig(window.innerWidth);
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return isNaN(parsed) ? cfg.default : Math.min(cfg.max, Math.max(cfg.min, parsed));
  });

  useEffect(() => {
    localStorage.setItem(PALETTE_STORAGE_KEY, String(paletteWidth));
  }, [paletteWidth]);

  const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const cfg = getPaletteConfig(window.innerWidth);
    const startX = e.clientX;
    const startWidth = paletteWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setPaletteWidth(Math.min(cfg.max, Math.max(cfg.min, startWidth - delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [paletteWidth]);

  // ── Resizable left sidebar ─────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return isNaN(parsed) ? SIDEBAR_DEFAULT : Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parsed));
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  const handleSidebarResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  // ── Auto-fit map in view on selection ─────────────────────────────────────
  // Fires once per selectedMapId. If containerSize not measured yet (< 100px),
  // waits for next containerSize update.
  const autoFittedMapRef = useRef<string | null>(null);

  const fitMapInView = useCallback(() => {
    const { width: cw, height: ch } = containerSize;
    const mapW = mapData.pxWid;
    const mapH = mapData.pxHei;
    if (mapW > 0 && mapH > 0 && cw > 0 && ch > 0) {
      const fitZoom = Math.min(
        MAP_ZOOM.MAX,
        Math.max(MAP_ZOOM.MIN, Math.min(cw / mapW, ch / mapH) * 0.9)
      );
      editor.setZoom(fitZoom);
      editor.setStagePos({
        x: (cw - mapW * fitZoom) / 2,
        y: (ch - mapH * fitZoom) / 2,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSize, mapData.pxWid, mapData.pxHei]);

  // Reset auto-fit tracking when map changes so next containerSize triggers fit
  useLayoutEffect(() => {
    if (editor.selectedMapId !== autoFittedMapRef.current) {
      autoFittedMapRef.current = null;
    }
  }, [editor.selectedMapId]);

  useEffect(() => {
    if (!editor.selectedMapId) return;
    if (autoFittedMapRef.current === editor.selectedMapId) return;
    if (containerSize.width < 100 || containerSize.height < 100) return;
    autoFittedMapRef.current = editor.selectedMapId;
    fitMapInView();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.selectedMapId, containerSize.width, containerSize.height]);

  // ── Eyedropper pick — résolution tile → asset ─────────────────────────────
  const handleEyedropperPick = useCallback((cx: number, cy: number) => {
    const tilesLayer = mapData.layerInstances.find(l => l.__type === 'tiles');
    const tileInst = tilesLayer?.gridTiles.find(t => t.cx === cx && t.cy === cy);
    if (!tileInst) return;
    const asset = assets.find(a => (a.url ?? a.path) === tileInst.src || a.path === tileInst.src);
    if (!asset) return;
    editor.setSelectedTile({
      asset,
      tileX: tileInst.tileX ?? 0,
      tileY: tileInst.tileY ?? 0,
      tileW: tileInst.tileW ?? 0,
      tileH: tileInst.tileH ?? 0,
    });
    // Revenir à l'outil peinture après un pick (sauf si outil pipette actif explicitement)
    if (editor.activeTool !== 'eyedropper') {
      // Alt+clic contextuel — ne pas changer l'outil
    } else {
      editor.setActiveTool('paint');
    }
  }, [mapData, assets, editor]);

  // ── Cancel entity placement / deselect / cancel spawn move on Escape ────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isMovingSpawn) { setIsMovingSpawn(false); return; }
      if (placingEntity) { setPlacingEntity(null); return; }
      if (selectedEntityId) { setSelectedEntityId(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMovingSpawn, placingEntity, selectedEntityId]);

  // ── Keyboard shortcuts (B/E/F/I/G/D/X/Y/T + Ctrl+Z/Y + Suppr + Home + Shift+G + Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si focus dans un input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // ── Undo/Redo (B1) ─────────────────────────────────────────────────────
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return; }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); return; }

      // ── Suppr = supprimer entité survolée, sinon effacer tuile (C1) ─────────
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.hoveredCell) {
        const { cx, cy } = editor.hoveredCell;
        const entityAtCell = mapData._ac_entities.find(ent => ent.cx === cx && ent.cy === cy);
        if (entityAtCell && editor.selectedMapId) {
          removeEntity(editor.selectedMapId, entityAtCell.id);
        } else {
          editor.eraseCell(cx, cy);
        }
        return;
      }

      // ── Home / 0 = reset zoom 100% (C2) ───────────────────────────────────
      if (e.key === 'Home' || e.key === '0') {
        editor.setZoom(1);
        editor.setStagePos({ x: 0, y: 0 });
        return;
      }

      // ── Shift+G = fit map in view (C3) ────────────────────────────────────
      if ((e.key === 'G' || e.key === 'g') && e.shiftKey) {
        fitMapInView();
        return;
      }

      if (e.key === 'b' || e.key === 'B') editor.setActiveTool('paint');
      else if (e.key === 'e' || e.key === 'E') editor.setActiveTool('erase');
      else if (e.key === 'f' || e.key === 'F') editor.setActiveTool('fill');
      else if (e.key === 'i' || e.key === 'I') editor.setActiveTool('eyedropper');
      else if (e.key === 'g' || e.key === 'G') editor.toggleGrid();
      else if (e.key === 'd' || e.key === 'D') editor.toggleDimInactive();
      else if (e.key === 'x' || e.key === 'X') editor.toggleFlipX();
      else if (e.key === 'y' || e.key === 'Y') editor.toggleFlipY();
      else if (e.key === 't' || e.key === 'T') editor.toggleStackMode();
      else if (e.key.startsWith('Arrow')) {
        // Arrow keys — navigate selected tile in palette (1 cell at a time)
        const tile = editor.selectedTile;
        if (!tile || tile.tileW === 0) return;
        const url = tile.asset.url ?? tile.asset.path;
        const { tilesetConfigs } = useSettingsStore.getState();
        const config = tilesetConfigs[url] ?? tilesetConfigs[tile.asset.path];
        if (!config) return;
        const img = imageCache.get(url);
        if (!img) return;
        const stepX = config.tileW + config.spacing;
        const stepY = config.tileH + config.spacing;
        const cols = Math.max(1, Math.floor((img.naturalWidth - config.margin * 2 + config.spacing) / stepX));
        const rows = Math.max(1, Math.floor((img.naturalHeight - config.margin * 2 + config.spacing) / stepY));
        let col = Math.round((tile.tileX - config.margin) / stepX);
        let row = Math.round((tile.tileY - config.margin) / stepY);
        if (e.key === 'ArrowRight') col = Math.min(cols - 1, col + 1);
        else if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        else if (e.key === 'ArrowDown') row = Math.min(rows - 1, row + 1);
        else if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        e.preventDefault();
        editor.setSelectedTile({
          ...tile,
          tileX: config.margin + col * stepX,
          tileY: config.margin + row * stepY,
          regionCols: 1,
          regionRows: 1,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, imageCache, undo, redo, mapData, removeEntity, fitMapInView]);

  // When tile layer is not active, no tile selected
  const effectiveTile = editor.activeLayer === 'tiles' ? editor.selectedTile : null;

  return (
    <div
      className="flex-1 flex overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
      aria-label="Éditeur de carte topdown"
    >
      {/* ── Left sidebar ── */}
      <aside
        className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{ width: sidebarWidth, background: 'var(--color-bg-surface)', position: 'relative', borderRight: '1px solid var(--color-border-base)' }}
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
            layerVisibility={editor.layerVisibility}
            layerOpacity={editor.layerOpacity}
            flipX={editor.flipX}
            flipY={editor.flipY}
            stackMode={editor.stackMode}
            onLayerChange={(layer) => {
              editor.setActiveLayer(layer);
              // Auto-switch palette tab on layer change
              if (layer === 'triggers') setRightTab('triggers');
              else if (rightTab === 'triggers') setRightTab('tiles');
            }}
            onToolChange={editor.setActiveTool}
            onToggleLayerVisibility={editor.toggleLayerVisibility}
            onSetLayerOpacity={editor.setLayerOpacity}
            onToggleFlipX={editor.toggleFlipX}
            onToggleFlipY={editor.toggleFlipY}
            onToggleStackMode={editor.toggleStackMode}
          />
        </div>

        {/* Sidebar resize handle (right edge) */}
        <div
          onMouseDown={handleSidebarResizerMouseDown}
          style={{
            position: 'absolute', top: 0, right: 0, width: 4, bottom: 0,
            cursor: 'col-resize',
            background: 'var(--color-border-base)',
            transition: 'background 0.15s',
            zIndex: 10,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(139,92,246,0.6)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-border-base)'; }}
          title="Redimensionner la sidebar"
        />
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
          {/* Undo / Redo (B2) */}
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            style={{
              padding: '1px 5px', fontSize: 12, borderRadius: 3, cursor: canUndo ? 'pointer' : 'not-allowed',
              border: '1px solid var(--color-border-base)',
              background: 'transparent',
              color: canUndo ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
              opacity: canUndo ? 1 : 0.35,
            }}
          >↩</button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            title="Rétablir (Ctrl+Y)"
            style={{
              padding: '1px 5px', fontSize: 12, borderRadius: 3, cursor: canRedo ? 'pointer' : 'not-allowed',
              border: '1px solid var(--color-border-base)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              opacity: canRedo ? 1 : 0.35,
            }}
          >↪</button>

          <span>Zoom : {Math.round(editor.zoom * 100)}%</span>
          {editor.hoveredCell && (
            <span>Cellule : {editor.hoveredCell.cx}, {editor.hoveredCell.cy}</span>
          )}

          {/* Indicateur de mode (D2) */}
          {editor.activeTool === 'erase' && (
            <span style={{ color: 'rgba(255,90,90,0.8)' }}>🧹 Clic droit aussi</span>
          )}

          {/* Spawn move button */}
          {editor.selectedMapId && (
            <button
              onClick={() => setIsMovingSpawn(v => !v)}
              title={isMovingSpawn ? 'Cliquez sur la carte pour placer le spawn (Échap pour annuler)' : 'Déplacer la position de départ du joueur'}
              style={{
                padding: '1px 6px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                border: '1px solid',
                borderColor: isMovingSpawn ? 'rgba(0,220,120,0.8)' : 'var(--color-border-base)',
                background: isMovingSpawn ? 'rgba(0,220,120,0.18)' : 'transparent',
                color: isMovingSpawn ? 'rgba(0,220,120,1)' : 'var(--color-text-muted)',
                animation: isMovingSpawn ? 'pulse-dot 1s ease-in-out infinite' : 'none',
              }}
            >
              ▶ spawn
            </button>
          )}

          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Fit in view (Shift+G) */}
            <button
              onClick={fitMapInView}
              title="Centrer la carte dans la vue (Shift+G)"
              style={{
                padding: '1px 6px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: 'transparent', color: 'var(--color-text-muted)',
              }}
            >
              ⊞ centrer
            </button>
            {/* Grid toggle (G) */}
            <button
              onClick={editor.toggleGrid}
              title={`${editor.showGrid ? 'Masquer' : 'Afficher'} la grille (G)`}
              style={{
                padding: '1px 6px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: editor.showGrid ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: editor.showGrid ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              # grille
            </button>
            {/* Dim toggle (D) */}
            <button
              onClick={editor.toggleDimInactive}
              title={`${editor.dimInactiveLayers ? 'Désactiver' : 'Activer'} le dim des couches inactives (D)`}
              style={{
                padding: '1px 6px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: editor.dimInactiveLayers ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: editor.dimInactiveLayers ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              ◑ dim
            </button>
            {/* Export carte */}
            {editor.selectedMapId && (
              <button
                onClick={handleExportMap}
                title="Exporter la carte en JSON (.ac-map.json)"
                style={{
                  padding: '1px 6px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                }}
              >
                ↓ export
              </button>
            )}
          </span>
          {editor.selectedMapId && (
            <span>
              {mapData.pxWid / mapData.__gridSize} × {mapData.pxHei / mapData.__gridSize} tuiles
            </span>
          )}
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
            // Spawn move mode takes priority
            if (isMovingSpawn && editor.selectedMapId) {
              updateMapMetadata(editor.selectedMapId, { playerStartCx: cx, playerStartCy: cy });
              setIsMovingSpawn(false);
              return;
            }
            // Entity placement mode
            if (placingEntity && editor.selectedMapId) {
              addEntity(editor.selectedMapId, {
                id: `entity-${Date.now()}`,
                spriteAssetUrl: placingEntity.spriteUrl,
                cx, cy,
                facing: 'down',
                behavior: placingEntity.behavior,
                displayName: placingEntity.displayName,
              });
              setPlacingEntity(null);
              return;
            }
            if (editor.activeLayer === 'tiles' && !effectiveTile) return;
            editor.paintCell(cx, cy);
          }}
          layerVisibility={editor.layerVisibility}
          layerOpacity={editor.layerOpacity}
          showGrid={editor.showGrid}
          dimInactiveLayers={editor.dimInactiveLayers}
          onCellErase={editor.eraseCell}
          onCellFill={(cx, cy) => {
            if (editor.activeLayer === 'tiles' && !effectiveTile) return;
            editor.fillCell(cx, cy);
          }}
          onEyedropperPick={handleEyedropperPick}
          playerStartCx={playerStartCx}
          playerStartCy={playerStartCy}
          entities={mapData._ac_entities}
          selectedEntityId={selectedEntityId}
          onEntityClick={setSelectedEntityId}
          onEntityDelete={editor.selectedMapId
            ? (entityId) => {
                removeEntity(editor.selectedMapId!, entityId);
                if (selectedEntityId === entityId) setSelectedEntityId(null);
              }
            : undefined
          }
          onResizeMap={editor.selectedMapId ? handleResizeMap : undefined}
        />
        {/* ── Entity property panel ── */}
        {selectedEntityId && editor.selectedMapId && (() => {
          const entity = mapData._ac_entities.find(e => e.id === selectedEntityId);
          if (!entity) return null;
          return (
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <EntityPropertyPanel
                mapId={editor.selectedMapId}
                entity={entity}
                onClose={() => setSelectedEntityId(null)}
              />
            </div>
          );
        })()}
      </div>

      {/* ── Resizer ── */}
      <div
        onMouseDown={handleResizerMouseDown}
        style={{
          width: 4,
          flexShrink: 0,
          cursor: 'col-resize',
          background: 'var(--color-border-base)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(139,92,246,0.6)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-border-base)'; }}
        title="Redimensionner la palette"
      />

      {/* ── Right palette ── */}
      <aside
        className="flex-shrink-0 border-l border-border overflow-hidden flex flex-col"
        style={{ width: paletteWidth, background: 'var(--color-bg-surface)' }}
        aria-label="Palette de tuiles et sprites"
      >
        {/* Tab bar */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--color-border-base)',
          background: 'rgba(0,0,0,0.2)', flexShrink: 0,
        }}>
          {([
            { id: 'tiles',    label: '🗺 Tuiles' },
            { id: 'sprites',  label: '🧑 Sprites' },
            { id: 'triggers', label: '🚪 Triggers' },
            { id: 'sounds',   label: '🔊 Sons' },
          ] as const).map(tab => {
            const isActive = rightTab === tab.id;
            const showBadge = assetsReloading && !isActive;
            return (
              <button
                key={tab.id}
                onClick={() => { setRightTab(tab.id); setAssetsReloading(false); }}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 12, fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer', border: 'none', position: 'relative',
                  background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  transition: 'all 0.1s',
                }}
              >
                {tab.label}
                {showBadge && (
                  <span style={{
                    position: 'absolute', top: 4, right: '18%',
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--color-primary)',
                    boxShadow: '0 0 6px rgba(139,92,246,0.8)',
                    animation: 'pulse-dot 1s ease-in-out infinite',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {rightTab === 'tiles' ? (
            <TilePalette
              activeLayer={editor.activeLayer}
              selectedTile={editor.selectedTile}
              onSelectTile={editor.setSelectedTile}
              mapGridSize={mapData.__gridSize}
            />
          ) : rightTab === 'sprites' ? (
            <SpritesPanel
              mapId={editor.selectedMapId}
              isPlacingEntity={placingEntity !== null}
              onStartPlacing={(spriteUrl, behavior, displayName) =>
                setPlacingEntity({ spriteUrl, behavior, displayName })
              }
              onCancelPlacing={() => setPlacingEntity(null)}
            />
          ) : rightTab === 'sounds' ? (
            <SoundPalette />
          ) : (
            editor.selectedMapId ? (
              <TriggerZonePanel
                mapId={editor.selectedMapId}
                tileSize={mapData.__gridSize}
                selectedZoneId={selectedZoneId}
                onSelectZone={setSelectedZoneId}
              />
            ) : (
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: 16 }}>
                Sélectionnez une carte d'abord.
              </p>
            )
          )}
        </div>
      </aside>
    </div>
  );
}
