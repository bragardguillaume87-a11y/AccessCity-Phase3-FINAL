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
import { MAP_ZOOM } from '@/config/mapEditorConfig';
import { useAssets } from '@/hooks/useAssets';
import { useMapEditor } from './hooks/useMapEditor';
import { useTileset } from './hooks/useTileset';
import { useTopdownEditorResize } from './hooks/useTopdownEditorResize';
import { useTopdownEditorKeyboard } from './hooks/useTopdownEditorKeyboard';
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
    { __identifier: 'Sol', __type: 'tiles', __gridSize: 32, __cWid: 20, __cHei: 15, gridTiles: [] },
    {
      __identifier: 'Objets',
      __type: 'tiles',
      __gridSize: 32,
      __cWid: 20,
      __cHei: 15,
      gridTiles: [],
    },
    {
      __identifier: 'Collision',
      __type: 'collision',
      __gridSize: 32,
      __cWid: 20,
      __cHei: 15,
      gridTiles: [],
      intGrid: [],
    },
    {
      __identifier: 'Triggers',
      __type: 'triggers',
      __gridSize: 32,
      __cWid: 20,
      __cHei: 15,
      gridTiles: [],
    },
  ],
  _ac_dialogue_triggers: [],
  _ac_scene_exits: [],
  _ac_audio_zones: [],
  _ac_entities: [],
};

// (Responsive palette config + sidebar constants → useTopdownEditorResize.ts)

export default function TopdownEditor() {
  const editor = useMapEditor();

  // ── Undo/Redo (B1/B2) — temporal store zundo ─────────────────────────────
  const { undo, redo, pastStates, futureStates } = useTemporalMapsStore((s) => s);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // ── Right panel tab (Tuiles | Persos | Zones | Sons) ────────────────────
  const [rightTab, setRightTab] = useState<'tiles' | 'sprites' | 'triggers' | 'sounds'>('tiles');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [pendingZoneRect, setPendingZoneRect] = useState<{
    xTile: number;
    yTile: number;
    wTile: number;
    hTile: number;
  } | null>(null);
  const [pendingAudioBrickId, setPendingAudioBrickId] = useState<string | null>(null);

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

  const eraseTileFromLayer = useMapsStore((s) => s.eraseTileFromLayer);
  const addTileLayer = useMapsStore((s) => s.addTileLayer);
  const removeTileLayer = useMapsStore((s) => s.removeTileLayer);
  const renameTileLayer = useMapsStore((s) => s.renameTileLayer);
  const reorderTileLayer = useMapsStore((s) => s.reorderTileLayer);
  const updateLayerProps = useMapsStore((s) => s.updateLayerProps);
  const moveTilesToLayer = useMapsStore((s) => s.moveTilesToLayer);
  const addEntity = useMapsStore((s) => s.addEntity);
  const removeEntity = useMapsStore((s) => s.removeEntity);
  const updateEntity = useMapsStore((s) => s.updateEntity);
  const updateDialogueTrigger = useMapsStore((s) => s.updateDialogueTrigger);
  const updateSceneExit = useMapsStore((s) => s.updateSceneExit);
  const updateAudioZone = useMapsStore((s) => s.updateAudioZone);
  const removeDialogueTrigger = useMapsStore((s) => s.removeDialogueTrigger);
  const removeSceneExit = useMapsStore((s) => s.removeSceneExit);
  const removeAudioZone = useMapsStore((s) => s.removeAudioZone);
  const updateMapMetadata = useMapsStore((s) => s.updateMapMetadata);
  const resizeMap = useMapsStore((s) => s.resizeMap);

  // Player spawn position — read from current map metadata
  const mapMetadata = useMapsStore((s) =>
    editor.selectedMapId ? s.maps.find((m) => m.id === editor.selectedMapId) : undefined
  );
  const playerStartCx = mapMetadata?.playerStartCx ?? 2;
  const playerStartCy = mapMetadata?.playerStartCy ?? 2;

  // ── Resize map via canvas handles ─────────────────────────────────────────
  const handleResizeMap = useCallback(
    (newW: number, newH: number) => {
      if (!editor.selectedMapId || !mapMetadata) return;
      resizeMap(editor.selectedMapId, mapMetadata.name, newW, newH, mapMetadata.tileSize);
    },
    [editor.selectedMapId, mapMetadata, resizeMap]
  );

  // ── Entity drag-to-move ────────────────────────────────────────────────────
  const handleEntityMove = useCallback(
    (entityId: string, cx: number, cy: number) => {
      if (!editor.selectedMapId) return;
      updateEntity(editor.selectedMapId, entityId, { cx, cy });
    },
    [editor.selectedMapId, updateEntity]
  );

  // ── Zone drag-to-move ──────────────────────────────────────────────────────
  const handleZoneMove = useCallback(
    (kind: 'dialogue' | 'exit' | 'audio', zoneId: string, x: number, y: number) => {
      if (!editor.selectedMapId) return;
      // Lire mapData depuis getState() dans le handler (pattern correct — hors render)
      const data = useMapsStore.getState().mapDataById[editor.selectedMapId];
      if (!data) return;
      if (kind === 'dialogue') {
        const zone = data._ac_dialogue_triggers.find((t) => t.id === zoneId);
        if (zone)
          updateDialogueTrigger(editor.selectedMapId, zoneId, { zone: { ...zone.zone, x, y } });
      } else if (kind === 'exit') {
        const zone = data._ac_scene_exits.find((e) => e.id === zoneId);
        if (zone) updateSceneExit(editor.selectedMapId, zoneId, { zone: { ...zone.zone, x, y } });
      } else {
        const zone = (data._ac_audio_zones ?? []).find((a) => a.id === zoneId);
        if (zone) updateAudioZone(editor.selectedMapId, zoneId, { zone: { ...zone.zone, x, y } });
      }
    },
    [editor.selectedMapId, updateDialogueTrigger, updateSceneExit, updateAudioZone]
  );

  // ── Zone click → sélection ────────────────────────────────────────────────
  const handleZoneClick = useCallback((_kind: 'dialogue' | 'exit' | 'audio', zoneId: string) => {
    setSelectedZoneId((prev) => (prev === zoneId ? null : zoneId));
    setRightTab('triggers');
  }, []);

  // ── Zone draw par drag → pré-remplir le formulaire ────────────────────────
  const handleZoneDraw = useCallback(
    (xTile: number, yTile: number, wTile: number, hTile: number) => {
      setPendingZoneRect({ xTile, yTile, wTile, hTile });
      setRightTab('triggers');
    },
    []
  );

  // ── Zone resize via poignée SE ─────────────────────────────────────────────
  const handleZoneResize = useCallback(
    (kind: 'dialogue' | 'exit' | 'audio', zoneId: string, newWidth: number, newHeight: number) => {
      if (!editor.selectedMapId) return;
      const data = useMapsStore.getState().mapDataById[editor.selectedMapId];
      if (!data) return;
      if (kind === 'dialogue') {
        const zone = data._ac_dialogue_triggers.find((t) => t.id === zoneId);
        if (zone)
          updateDialogueTrigger(editor.selectedMapId, zoneId, {
            zone: { ...zone.zone, width: newWidth, height: newHeight },
          });
      } else if (kind === 'exit') {
        const zone = data._ac_scene_exits.find((e) => e.id === zoneId);
        if (zone)
          updateSceneExit(editor.selectedMapId, zoneId, {
            zone: { ...zone.zone, width: newWidth, height: newHeight },
          });
      } else {
        const zone = (data._ac_audio_zones ?? []).find((a) => a.id === zoneId);
        if (zone)
          updateAudioZone(editor.selectedMapId, zoneId, {
            zone: { ...zone.zone, width: newWidth, height: newHeight },
          });
      }
    },
    [editor.selectedMapId, updateDialogueTrigger, updateSceneExit, updateAudioZone]
  );

  // ── Delete key → supprimer la zone sélectionnée ────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      // Ignorer si le focus est dans un input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!selectedZoneId || !editor.selectedMapId) return;
      const data = useMapsStore.getState().mapDataById[editor.selectedMapId];
      if (!data) return;
      if (data._ac_dialogue_triggers.some((t) => t.id === selectedZoneId)) {
        removeDialogueTrigger(editor.selectedMapId, selectedZoneId);
      } else if (data._ac_scene_exits.some((t) => t.id === selectedZoneId)) {
        removeSceneExit(editor.selectedMapId, selectedZoneId);
      } else if ((data._ac_audio_zones ?? []).some((t) => t.id === selectedZoneId)) {
        removeAudioZone(editor.selectedMapId, selectedZoneId);
      }
      setSelectedZoneId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    selectedZoneId,
    editor.selectedMapId,
    removeDialogueTrigger,
    removeSceneExit,
    removeAudioZone,
  ]);

  // ── Move spawn via canvas clic (triggered in status bar toggle) ───────────
  const [isMovingSpawn, setIsMovingSpawn] = useState(false);

  // Current map data from store
  const mapData = useMapsStore((s) =>
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
    const url = URL.createObjectURL(blob);
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
    () =>
      assets.filter(
        (a) =>
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
    const observer = new ResizeObserver((entries) => {
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

  // ── Resizable palette + sidebar (logique → useTopdownEditorResize) ────────
  const { paletteWidth, sidebarWidth, handleResizerMouseDown, handleSidebarResizerMouseDown } =
    useTopdownEditorResize();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitMapInView et editor.* sont des refs/actions Zustand stables, non nécessaires en deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitMapInView est une fonction locale stable via useCallback, non nécessaire en deps
  }, [editor.selectedMapId, containerSize.width, containerSize.height]);

  // ── Eyedropper pick — résolution tile → asset ─────────────────────────────
  const handleEyedropperPick = useCallback(
    (cx: number, cy: number) => {
      const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
      const activeTileLayer = tileLayers[editor.activeTileLayerIndex] ?? tileLayers[0];
      const tileInst = activeTileLayer?.gridTiles.find((t) => t.cx === cx && t.cy === cy);
      if (!tileInst) return;
      const asset = assets.find(
        (a) => (a.url ?? a.path) === tileInst.src || a.path === tileInst.src
      );
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
    },
    [mapData, assets, editor]
  );

  // ── Cancel entity placement / deselect / cancel spawn move on Escape ────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isMovingSpawn) {
        setIsMovingSpawn(false);
        return;
      }
      if (placingEntity) {
        setPlacingEntity(null);
        return;
      }
      if (selectedEntityId) {
        setSelectedEntityId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMovingSpawn, placingEntity, selectedEntityId]);

  // ── Keyboard shortcuts (logique → useTopdownEditorKeyboard) ─────────────
  useTopdownEditorKeyboard({ editor, imageCache, undo, redo, mapData, removeEntity, fitMapInView });

  // When tile layer is not active, no tile selected
  const effectiveTile = editor.activeLayer === 'tiles' ? editor.selectedTile : null;

  // Layers that contain a tile at the currently hovered cell — used for the layer indicator HUD
  const layersAtHoveredCell = useMemo(() => {
    if (!editor.hoveredCell || editor.activeLayer !== 'tiles') return [];
    const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
    return tileLayers
      .map((layer, idx) => ({
        name: layer.__identifier,
        idx,
        hasTile: layer.gridTiles.some(
          (t) => t.cx === editor.hoveredCell!.cx && t.cy === editor.hoveredCell!.cy
        ),
      }))
      .filter((l) => l.hasTile);
  }, [editor.hoveredCell, editor.activeLayer, mapData.layerInstances]);

  return (
    <div
      className="flex-1 flex overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
      aria-label="Éditeur de carte topdown"
    >
      {/* ── Left sidebar ── */}
      <aside
        className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{
          width: sidebarWidth,
          background: 'var(--color-bg-surface)',
          position: 'relative',
          borderRight: '1px solid var(--color-border-base)',
        }}
        aria-label="Cartes et couches"
      >
        {/* Map list (top, flex-1) */}
        <div className="flex-1 overflow-hidden border-b border-border">
          <MapSidebar selectedMapId={editor.selectedMapId} onSelectMap={editor.selectMap} />
        </div>

        {/* Layer panel (bottom, fixed height) */}
        <div className="flex-shrink-0" style={{ minHeight: 180 }}>
          <div className="px-3 py-2 border-b border-border">
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 3,
                  height: 10,
                  borderRadius: 2,
                  background: 'var(--color-accent)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              Couches & Outils
            </p>
          </div>
          <LayerPanel
            allLayers={mapData.layerInstances}
            activeLayer={editor.activeLayer}
            activeTileLayerIndex={editor.activeTileLayerIndex}
            activeTool={editor.activeTool}
            flipX={editor.flipX}
            flipY={editor.flipY}
            stackMode={editor.stackMode}
            onTileLayerSelect={(idx) => {
              editor.setActiveTileLayerIndex(idx);
              editor.setActiveLayer('tiles');
            }}
            onLayerChange={(layer) => {
              editor.setActiveLayer(layer);
              // Auto-switch palette tab on layer change
              if (layer === 'triggers') setRightTab('triggers');
              else if (rightTab === 'triggers') setRightTab('tiles');
            }}
            onToolChange={editor.setActiveTool}
            onUpdateLayerProps={(identifier, patch) => {
              if (editor.selectedMapId) updateLayerProps(editor.selectedMapId, identifier, patch);
            }}
            onReorderTileLayer={(from, to) => {
              if (!editor.selectedMapId) return;
              reorderTileLayer(editor.selectedMapId, from, to);
              // Follow the moved layer — keep the active highlight on the same layer
              const cur = editor.activeTileLayerIndex;
              if (from === cur) {
                editor.setActiveTileLayerIndex(to);
              } else if (from < cur && to >= cur) {
                editor.setActiveTileLayerIndex(cur - 1);
              } else if (from > cur && to <= cur) {
                editor.setActiveTileLayerIndex(cur + 1);
              }
            }}
            onToggleFlipX={editor.toggleFlipX}
            onToggleFlipY={editor.toggleFlipY}
            onToggleStackMode={editor.toggleStackMode}
            onAddTileLayer={(name) => {
              if (editor.selectedMapId) addTileLayer(editor.selectedMapId, name);
            }}
            onRemoveTileLayer={(identifier) => {
              if (!editor.selectedMapId) return;
              const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
              const removedIdx = tileLayers.findIndex((l) => l.__identifier === identifier);
              removeTileLayer(editor.selectedMapId, identifier);
              // Adjust activeTileLayerIndex so it never goes out-of-bounds after deletion
              const newCount = tileLayers.length - 1;
              const cur = editor.activeTileLayerIndex;
              if (removedIdx !== -1) {
                if (cur >= newCount) {
                  editor.setActiveTileLayerIndex(Math.max(0, newCount - 1));
                } else if (removedIdx < cur) {
                  editor.setActiveTileLayerIndex(cur - 1);
                }
              }
            }}
            onRenameTileLayer={(identifier, newName) => {
              if (editor.selectedMapId) renameTileLayer(editor.selectedMapId, identifier, newName);
            }}
          />
        </div>

        {/* Sidebar resize handle (right edge) */}
        <div
          onMouseDown={handleSidebarResizerMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 4,
            bottom: 0,
            cursor: 'col-resize',
            background: 'var(--color-border-base)',
            transition: 'background 0.15s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--color-primary-60)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--color-border-base)';
          }}
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
          className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 text-xs"
          style={{
            background: 'rgba(10,11,18,0.88)',
            color: 'var(--color-text-secondary)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Undo / Redo (B2) */}
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            className="transition-all hover:-translate-y-0.5 active:scale-90"
            style={{
              padding: '3px 8px',
              fontSize: 12,
              borderRadius: 4,
              cursor: canUndo ? 'pointer' : 'not-allowed',
              border: '1px solid var(--color-border-base)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              opacity: canUndo ? 1 : 0.3,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            ↩ <span>Annuler</span>
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            title="Rétablir (Ctrl+Y)"
            className="transition-all hover:-translate-y-0.5 active:scale-90"
            style={{
              padding: '3px 8px',
              fontSize: 12,
              borderRadius: 4,
              cursor: canRedo ? 'pointer' : 'not-allowed',
              border: '1px solid var(--color-border-base)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              opacity: canRedo ? 1 : 0.3,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            ↪ <span>Rétablir</span>
          </button>

          <span>🔍 {Math.round(editor.zoom * 100)}%</span>
          {editor.hoveredCell && (
            <span>
              col {editor.hoveredCell.cx}, rang {editor.hoveredCell.cy}
            </span>
          )}
          {/* Layer indicator — shows which layers have a tile at the hovered cell */}
          {layersAtHoveredCell.map((l) => (
            <span
              key={l.idx}
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 3,
                background:
                  l.idx === editor.activeTileLayerIndex
                    ? 'var(--color-primary)'
                    : 'rgba(255,255,255,0.10)',
                color:
                  l.idx === editor.activeTileLayerIndex ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: l.idx === editor.activeTileLayerIndex ? 700 : 400,
                border:
                  l.idx === editor.activeTileLayerIndex
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.12)',
              }}
              title={
                l.idx === editor.activeTileLayerIndex
                  ? `Couche active — l'effaceur agira ici`
                  : `Tuile sur "${l.name}" — non active`
              }
            >
              {l.idx === editor.activeTileLayerIndex ? '✏' : '•'} {l.name}
            </span>
          ))}

          {/* Indicateur de mode (D2) */}
          {editor.activeTool === 'erase' && (
            <span style={{ color: 'rgba(255,90,90,0.8)' }}>🧹 Clic droit aussi</span>
          )}
          {isMovingSpawn && (
            <span style={{ color: 'rgba(0,220,120,0.9)', fontWeight: 600 }}>
              ▶ Clic sur la carte pour placer le départ — Échap pour annuler
            </span>
          )}

          {/* Spawn move button */}
          {editor.selectedMapId && (
            <button
              onClick={() => setIsMovingSpawn((v) => !v)}
              title={
                isMovingSpawn
                  ? 'Cliquez sur la carte pour placer le départ (Échap pour annuler)'
                  : 'Déplacer la position de départ du joueur'
              }
              className="transition-all hover:-translate-y-0.5"
              style={{
                padding: '3px 8px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isMovingSpawn ? 'rgba(0,220,120,0.8)' : 'var(--color-border-base)',
                background: isMovingSpawn ? 'rgba(0,220,120,0.18)' : 'transparent',
                color: isMovingSpawn ? 'rgba(0,220,120,1)' : 'var(--color-text-secondary)',
                animation: isMovingSpawn ? 'pulse-dot 1s ease-in-out infinite' : 'none',
              }}
            >
              ▶ Départ
            </button>
          )}

          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Fit in view (Shift+G) */}
            <button
              onClick={fitMapInView}
              title="Centrer la carte dans la vue (Shift+G)"
              className="transition-all hover:-translate-y-0.5"
              style={{
                padding: '3px 8px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
              }}
            >
              ⊞ Centrer
            </button>
            {/* Grid toggle (G) */}
            <button
              onClick={editor.toggleGrid}
              title={`${editor.showGrid ? 'Masquer' : 'Afficher'} la grille (G)`}
              className="transition-all hover:-translate-y-0.5"
              style={{
                padding: '3px 8px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: editor.showGrid ? 'var(--color-primary-20)' : 'transparent',
                color: editor.showGrid ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              ⊞ Grille
            </button>
            {/* Dim toggle (D) */}
            <button
              onClick={editor.toggleDimInactive}
              title={`${editor.dimInactiveLayers ? 'Désactiver' : 'Activer'} l'isolation de la couche active (D)`}
              className="transition-all hover:-translate-y-0.5"
              style={{
                padding: '3px 8px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: editor.dimInactiveLayers ? 'var(--color-primary-20)' : 'transparent',
                color: editor.dimInactiveLayers
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
              }}
            >
              ◑ Isoler
            </button>
            {/* Export carte */}
            {editor.selectedMapId && (
              <button
                onClick={handleExportMap}
                title="Exporter la carte en JSON (.ac-map.json)"
                className="transition-all hover:-translate-y-0.5"
                style={{
                  padding: '3px 8px',
                  fontSize: 12,
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                }}
              >
                ↓ Exporter
              </button>
            )}
          </span>
          {editor.selectedMapId && (
            <span>
              {mapData.pxWid / mapData.__gridSize} × {mapData.pxHei / mapData.__gridSize} tuiles
            </span>
          )}
        </div>

        {/* ── Empty state — aucune carte sélectionnée ── */}
        {!editor.selectedMapId && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              zIndex: 5,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse at center, var(--color-primary-06) 0%, transparent 70%)',
            }}
          >
            <span
              style={{
                fontSize: 64,
                lineHeight: 1,
                filter: 'drop-shadow(0 0 20px var(--color-primary-40))',
              }}
            >
              🗺️
            </span>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                }}
              >
                Choisis une carte
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                Sélectionne une carte dans le panneau gauche
                <br />
                ou crée-en une nouvelle avec{' '}
                <strong style={{ color: 'var(--color-primary)' }}>+ Créer une carte</strong>
              </p>
            </div>
          </div>
        )}

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
                cx,
                cy,
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
          onEntityDelete={
            editor.selectedMapId
              ? (entityId) => {
                  removeEntity(editor.selectedMapId!, entityId);
                  if (selectedEntityId === entityId) setSelectedEntityId(null);
                }
              : undefined
          }
          onEntityMove={editor.selectedMapId ? handleEntityMove : undefined}
          onZoneMove={editor.selectedMapId ? handleZoneMove : undefined}
          selectedZoneId={selectedZoneId}
          onZoneClick={handleZoneClick}
          onZoneDraw={editor.selectedMapId ? handleZoneDraw : undefined}
          onZoneResize={editor.selectedMapId ? handleZoneResize : undefined}
          onResizeMap={editor.selectedMapId ? handleResizeMap : undefined}
          activeTileLayerIndex={editor.activeTileLayerIndex}
          onTileMoveToLayer={
            editor.selectedMapId
              ? (cx, cy, fromIdx, toIdx) => {
                  moveTilesToLayer(editor.selectedMapId!, [{ cx, cy }], fromIdx, toIdx);
                }
              : undefined
          }
          onCellEraseFromLayer={
            editor.selectedMapId
              ? (cx, cy, layerIdx) => {
                  eraseTileFromLayer(editor.selectedMapId!, cx, cy, layerIdx);
                }
              : undefined
          }
        />
        {/* ── Entity property panel ── */}
        {selectedEntityId &&
          editor.selectedMapId &&
          (() => {
            const entity = mapData._ac_entities.find((e) => e.id === selectedEntityId);
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
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'var(--color-primary-60)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'var(--color-border-base)';
        }}
        title="Redimensionner la palette"
      />

      {/* ── Right palette ── */}
      <aside
        className="flex-shrink-0 border-l border-border overflow-hidden flex flex-col"
        style={{ width: paletteWidth, background: 'var(--color-bg-surface)' }}
        aria-label="Palette de tuiles et sprites"
      >
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border-base)',
            background: 'rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        >
          {(
            [
              { id: 'tiles', label: 'Tuiles', emoji: '🗺️', color: '#60a5fa' },
              { id: 'sprites', label: 'Persos', emoji: '🧑', color: '#f472b6' },
              { id: 'triggers', label: 'Zones', emoji: '🚪', color: '#4ade80' },
              { id: 'sounds', label: 'Sons', emoji: '🔊', color: '#fb923c' },
            ] as const
          ).map((tab) => {
            const isActive = rightTab === (tab.id as string);
            const showBadge = assetsReloading && !isActive;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setRightTab(tab.id as typeof rightTab);
                  setAssetsReloading(false);
                }}
                className="transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '7px 2px',
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  position: 'relative',
                  background: isActive ? `${tab.color}18` : 'transparent',
                  color: isActive ? tab.color : 'var(--color-text-secondary)',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.emoji}</span>
                <span>{tab.label}</span>
                {showBadge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: '18%',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      boxShadow: '0 0 6px var(--color-primary-80)',
                      animation: 'pulse-dot 1s ease-in-out infinite',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel content */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
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
            <SoundPalette
              selectedMapId={editor.selectedMapId}
              onSwitchToTriggers={(brickId) => {
                if (brickId) setPendingAudioBrickId(brickId);
                setRightTab('triggers');
              }}
            />
          ) : editor.selectedMapId ? (
            <TriggerZonePanel
              mapId={editor.selectedMapId}
              tileSize={mapData.__gridSize}
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
              pendingZoneRect={pendingZoneRect}
              onPendingZoneConsumed={() => setPendingZoneRect(null)}
              pendingAudioBrickId={pendingAudioBrickId}
              onPendingAudioBrickConsumed={() => setPendingAudioBrickId(null)}
            />
          ) : (
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: 16 }}>
              Sélectionnez une carte d'abord.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
