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
import { useUIStore } from '@/stores/uiStore';
import { toast } from 'sonner';
import { useMapsStore, useTemporalMapsStore } from '@/stores/mapsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { MAP_ZOOM } from '@/config/mapEditorConfig';
import { useAssets } from '@/hooks/useAssets';
import { useMapEditor } from './hooks/useMapEditor';
import { generateId } from '@/utils/generateId';
import { useTileset } from './hooks/useTileset';
import { useTopdownEditorResize } from './hooks/useTopdownEditorResize';
import { useTopdownEditorKeyboard } from './hooks/useTopdownEditorKeyboard';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import MapCanvas from './MapCanvas';
import ObjectsPanel from './ObjectsPanel';
import MapTabsBar from './MapTabsBar';
import EntityContextMenu from './EntityContextMenu';
import ObjectDefinitionDialog from './ObjectDefinitionDialog';
import TilePalette from './TilePalette';
import EntityPropertyPanel from './EntityPropertyPanel';
import TriggerZonePanel from './TriggerZonePanel';
import SoundPalette from './SoundPalette';
import LayersPanelSection from './LayersPanelSection';
import MapSettingsDialog from './MapSettingsDialog';
import {
  Undo2,
  Redo2,
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  RectangleHorizontal,
  FlipHorizontal2,
  FlipVertical2,
  Layers,
  MapPin,
  Maximize2,
  Grid3x3,
  Focus,
  Download,
  ChevronDown,
  Ghost,
  Check,
  Settings,
} from 'lucide-react';
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
  _ac_objects: [],
};

// (Responsive palette config + sidebar constants → useTopdownEditorResize.ts)

export default function TopdownEditor() {
  const editor = useMapEditor();
  const spriteConfigs = useSettingsStore((s) => s.spriteSheetConfigs);

  // ── Undo/Redo (B1/B2) — temporal store zundo ─────────────────────────────
  const { undo: undoRaw, redo: redoRaw, pastStates, futureStates } = useTemporalMapsStore((s) => s);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    undoRaw();
    toast('Annulé', { duration: 900, icon: '↩' });
  }, [undoRaw, canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    redoRaw();
    toast('Rétabli', { duration: 900, icon: '↪' });
  }, [redoRaw, canRedo]);

  // ── Right panel tab (Tuiles | Persos | Zones | Sons) ────────────────────
  const [rightTab, setRightTab] = useState<'tiles' | 'triggers' | 'sounds'>('tiles');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [pendingZoneRect, setPendingZoneRect] = useState<{
    xTile: number;
    yTile: number;
    wTile: number;
    hTile: number;
  } | null>(null);
  const [pendingAudioBrickId, setPendingAudioBrickId] = useState<string | null>(null);
  const [editingZoneRect, setEditingZoneRect] = useState<{
    xTile: number;
    yTile: number;
    wTile: number;
    hTile: number;
  } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    cx: number;
    cy: number;
    cw: number;
    ch: number;
  } | null>(null);

  // Effacer la sélection quand on change d'outil (sauf si on revient à 'selection')
  useEffect(() => {
    if (editor.activeTool !== 'selection') setSelectionRect(null);
  }, [editor.activeTool]);

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

  // ── Object placement state (Phase 4 — ObjectInstance) ─────────────────────
  /** ID de la définition en cours de placement (null = mode normal) */
  const [placingObjectDefId, setPlacingObjectDefId] = useState<string | null>(null);

  // ── Entity selection state ────────────────────────────────────────────────
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [entityContextMenu, setEntityContextMenu] = useState<{
    entityId: string;
    x: number;
    y: number;
  } | null>(null);
  /** ObjectDefinitionDialog ouvert depuis le context menu d'un ObjectInstance */
  const [objDefDialogFromCtx, setObjDefDialogFromCtx] = useState<string | null>(null);

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
  const addObjectInstance = useMapsStore((s) => s.addObjectInstance);
  const migrateEntitiesToObjects = useMapsStore((s) => s.migrateEntitiesToObjects);
  const updateDialogueTrigger = useMapsStore((s) => s.updateDialogueTrigger);
  const updateSceneExit = useMapsStore((s) => s.updateSceneExit);
  const updateAudioZone = useMapsStore((s) => s.updateAudioZone);
  const removeDialogueTrigger = useMapsStore((s) => s.removeDialogueTrigger);
  const removeSceneExit = useMapsStore((s) => s.removeSceneExit);
  const removeAudioZone = useMapsStore((s) => s.removeAudioZone);
  const updateMapMetadata = useMapsStore((s) => s.updateMapMetadata);
  const resizeMap = useMapsStore((s) => s.resizeMap);
  const maps = useMapsStore((s) => s.maps);
  const addMap = useMapsStore((s) => s.addMap);
  const deleteMap = useMapsStore((s) => s.deleteMap);

  // ── Migration auto EntityInstance → ObjectInstance (Phase 4) ───────────────
  useEffect(() => {
    const state = useMapsStore.getState();
    const needsMigration = Object.values(state.mapDataById).some(
      (d) => (d._ac_entities?.length ?? 0) > 0 && (d._ac_objects?.length ?? 0) === 0
    );
    if (needsMigration) migrateEntitiesToObjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once at editor mount

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

  // ── Entity / Object drag-to-move ───────────────────────────────────────────
  // (mapData disponible plus bas — resolvedObjects aussi)
  const handleEntityMove = useCallback(
    (entityId: string, cx: number, cy: number) => {
      if (!editor.selectedMapId) return;
      // Phase 4 : si l'ID correspond à un ObjectInstance, utiliser updateObjectInstance
      const currentMapData = useMapsStore.getState().mapDataById[editor.selectedMapId];
      const isObject = (currentMapData?._ac_objects ?? []).some((o) => o.id === entityId);
      if (isObject) {
        useMapsStore.getState().updateObjectInstance(editor.selectedMapId, entityId, { cx, cy });
        // Sync Hero spawn ↔ position : si l'objet déplacé est le Héros, mettre à jour playerStart
        const inst = currentMapData?._ac_objects?.find((o) => o.id === entityId);
        const def = useMapsStore
          .getState()
          .objectDefinitions.find((d) => d.id === inst?.definitionId);
        if (def?.category === 'hero') {
          useMapsStore
            .getState()
            .updateMapMetadata(editor.selectedMapId, { playerStartCx: cx, playerStartCy: cy });
        }
      } else {
        updateEntity(editor.selectedMapId, entityId, { cx, cy });
      }
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

  // ── Toolbar dropdown states ─────────────────────────────────────────────
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);

  // Current map data from store
  const mapData = useMapsStore((s) =>
    editor.selectedMapId ? (s.mapDataById[editor.selectedMapId] ?? EMPTY_MAP_DATA) : EMPTY_MAP_DATA
  );

  // ── Resolved objects (Phase 4) pour MapCanvas ─────────────────────────────
  const objectDefinitions = useMapsStore((s) => s.objectDefinitions);
  const resolvedObjects = useMemo(() => {
    const instances = mapData._ac_objects ?? [];
    if (instances.length === 0) return undefined;
    const result = instances
      .map((inst) => {
        const definition = objectDefinitions.find((d) => d.id === inst.definitionId);
        return definition ? { instance: inst, definition } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return result.length > 0 ? result : undefined;
  }, [mapData._ac_objects, objectDefinitions]);

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

  // ── Selection move callback ────────────────────────────────────────────────
  const handleSelectionMove = useCallback(
    (fromRect: { cx: number; cy: number; cw: number; ch: number }, toCx: number, toCy: number) => {
      editor.moveSelection(fromRect, toCx, toCy);
      setSelectionRect({ cx: toCx, cy: toCy, cw: fromRect.cw, ch: fromRect.ch });
    },
    [editor]
  );

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
      if (placingObjectDefId) {
        setPlacingObjectDefId(null);
        return;
      }
      if (selectedEntityId) {
        setSelectedEntityId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMovingSpawn, placingObjectDefId, selectedEntityId]);

  // ── Keyboard shortcuts (logique → useTopdownEditorKeyboard) ─────────────
  useTopdownEditorKeyboard({
    editor,
    imageCache,
    undo,
    redo,
    mapData,
    removeEntity,
    fitMapInView,
    selectionRect,
    onClearSelection: () => setSelectionRect(null),
    onSelectionChange: setSelectionRect,
  });

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

  // ── Entity sélectionnée — inspector panneau droit (GDevelop pattern) ─────
  const selectedEntity = selectedEntityId
    ? (mapData._ac_entities.find((e) => e.id === selectedEntityId) ?? null)
    : null;

  // ── Object instance sélectionnée (Phase 4) ────────────────────────────────
  const selectedObjectInstance =
    selectedEntityId && !selectedEntity
      ? (mapData._ac_objects?.find((o) => o.id === selectedEntityId) ?? null)
      : null;

  return (
    <div
      className="flex-1 flex overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
      aria-label="Éditeur de carte topdown"
    >
      {/* ── Left sidebar — Palette tuiles (ou Propriétés si entité sélectionnée) ── */}
      <aside
        className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{
          width: sidebarWidth,
          background: 'var(--color-bg-surface)',
          position: 'relative',
          borderRight: '1px solid var(--color-border-base)',
        }}
        aria-label="Palette de tuiles et sprites"
      >
        {/* Tab bar — palette gauche (toujours visible, même si entité sélectionnée) */}
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
              { id: 'triggers', label: 'Zones', emoji: '🚪', color: '#4ade80' },
              { id: 'sounds', label: 'Sons', emoji: '🔊', color: '#fb923c' },
            ] as const
          ).map((tab) => {
            const isActive = rightTab === tab.id;
            const showBadge = assetsReloading && !isActive;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setRightTab(tab.id);
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
              onEditingZoneChange={setEditingZoneRect}
            />
          ) : (
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: 16 }}>
              Sélectionnez une carte d'abord.
            </p>
          )}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <MapTabsBar
          maps={maps}
          selectedMapId={editor.selectedMapId}
          onSelectMap={editor.selectMap}
          onAddMap={() => {
            const newId = addMap();
            editor.selectMap(newId);
          }}
          onRenameMap={(mapId, newName) => updateMapMetadata(mapId, { name: newName })}
          onDeleteMap={(mapId) => {
            deleteMap(mapId);
            if (editor.selectedMapId === mapId) {
              const remaining = maps.filter((m) => m.id !== mapId);
              if (remaining.length > 0) editor.selectMap(remaining[0].id);
              else editor.selectMap('');
            }
          }}
          onOpenSettings={(mapId) => {
            editor.selectMap(mapId);
            setMapSettingsOpen(true);
          }}
          onPreview={() => useUIStore.getState().setActiveModule('preview')}
        />
        <div
          ref={canvasContainerRef}
          className="flex-1 overflow-hidden relative"
          style={{ background: '#0a0a14' }}
          aria-label="Canvas de la carte"
        >
          {/* ── Toolbar — icônes compactes style GDevelop ── */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center gap-1 px-2"
            style={{
              height: 36,
              background: 'rgba(10,11,18,0.92)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Undo / Redo */}
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              title="Annuler (Ctrl+Z)"
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                border: '1px solid transparent',
                background: 'transparent',
                color: 'rgba(255,255,255,0.55)',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                opacity: canUndo ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (canUndo) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              title="Rétablir (Ctrl+Y)"
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                border: '1px solid transparent',
                background: 'transparent',
                color: 'rgba(255,255,255,0.55)',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                opacity: canRedo ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (canRedo) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Redo2 size={13} />
            </button>

            {/* Separator */}
            <span
              style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}
            />

            {/* Drawing tools */}
            {[
              { id: 'selection' as const, Icon: RectangleHorizontal, title: 'Sélection (S)' },
              { id: 'paint' as const, Icon: Pencil, title: 'Peindre (B)' },
              { id: 'erase' as const, Icon: Eraser, title: 'Effacer (E)' },
              { id: 'fill' as const, Icon: PaintBucket, title: 'Remplir (F)' },
              { id: 'eyedropper' as const, Icon: Pipette, title: 'Pipette (I)' },
            ].map(({ id, Icon, title }) => {
              const isActive = editor.activeTool === id;
              return (
                <button
                  key={id}
                  onClick={() => editor.setActiveTool(id)}
                  title={title}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(139,92,246,0.6)' : 'transparent',
                    background: isActive ? 'rgba(139,92,246,0.18)' : 'transparent',
                    color: isActive ? '#8b5cf6' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon size={13} />
                </button>
              );
            })}

            {/* Separator */}
            <span
              style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}
            />

            {/* Modifiers */}
            {[
              {
                active: editor.flipX,
                onToggle: editor.toggleFlipX,
                Icon: FlipHorizontal2,
                title: 'Miroir X',
              },
              {
                active: editor.flipY,
                onToggle: editor.toggleFlipY,
                Icon: FlipVertical2,
                title: 'Miroir Y',
              },
              {
                active: editor.stackMode,
                onToggle: editor.toggleStackMode,
                Icon: Layers,
                title: 'Empiler (T)',
              },
            ].map(({ active, onToggle, Icon, title }) => (
              <button
                key={title}
                onClick={onToggle}
                title={title}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: active ? 'rgba(139,92,246,0.6)' : 'transparent',
                  background: active ? 'rgba(139,92,246,0.18)' : 'transparent',
                  color: active ? '#8b5cf6' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={13} />
              </button>
            ))}

            {/* Separator */}
            <span
              style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}
            />

            {/* Spawn move */}
            {editor.selectedMapId && (
              <button
                onClick={() => setIsMovingSpawn((v) => !v)}
                title={
                  isMovingSpawn ? 'Annuler (Échap)' : 'Déplacer la position de départ du joueur'
                }
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: isMovingSpawn ? 'rgba(0,220,120,0.8)' : 'transparent',
                  background: isMovingSpawn ? 'rgba(0,220,120,0.18)' : 'transparent',
                  color: isMovingSpawn ? 'rgba(0,220,120,1)' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isMovingSpawn ? 'pulse-dot 1s ease-in-out infinite' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isMovingSpawn) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isMovingSpawn)
                    e.currentTarget.style.background = isMovingSpawn
                      ? 'rgba(0,220,120,0.18)'
                      : 'transparent';
                }}
              >
                <MapPin size={13} />
              </button>
            )}

            {/* Zoom dropdown */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setZoomMenuOpen((v) => !v);
                  setGridMenuOpen(false);
                }}
                title="Niveau de zoom"
                style={{
                  height: 26,
                  padding: '0 7px',
                  borderRadius: 5,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = zoomMenuOpen
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(255,255,255,0.04)';
                }}
              >
                {Math.round(editor.zoom * 100)}%
                <ChevronDown size={9} />
              </button>
              {zoomMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                    onClick={() => setZoomMenuOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 4,
                      width: 120,
                      zIndex: 51,
                      padding: 4,
                      background: 'var(--color-bg-elevated, #1e1e35)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    }}
                  >
                    {([50, 75, 100, 125, 150, 200] as const).map((pct) => {
                      const isCurrent = Math.round(editor.zoom * 100) === pct;
                      return (
                        <button
                          key={pct}
                          onClick={() => {
                            editor.setZoom(pct / 100);
                            setZoomMenuOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: 5,
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 12,
                            background: 'transparent',
                            color: isCurrent ? '#8b5cf6' : 'rgba(255,255,255,0.8)',
                            fontWeight: isCurrent ? 700 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Check
                            size={9}
                            style={{ opacity: isCurrent ? 1 : 0, color: '#8b5cf6', flexShrink: 0 }}
                          />
                          {pct}%
                        </button>
                      );
                    })}
                    <div
                      style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }}
                    />
                    <button
                      onClick={() => {
                        fitMapInView();
                        setZoomMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        borderRadius: 5,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 12,
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.8)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Ajuster à la vue
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Cell coords + layer indicators + mode indicators */}
            {editor.hoveredCell && (
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.3)',
                  flexShrink: 0,
                  minWidth: 52,
                }}
              >
                {editor.hoveredCell.cx},{editor.hoveredCell.cy}
              </span>
            )}
            {layersAtHoveredCell.map((l) => (
              <span
                key={l.idx}
                style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 3,
                  flexShrink: 0,
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
            {editor.activeTool === 'erase' && (
              <span style={{ fontSize: 10, color: 'rgba(255,90,90,0.75)', flexShrink: 0 }}>
                Clic droit aussi
              </span>
            )}
            {isMovingSpawn && (
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(0,220,120,0.9)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Clic sur la carte — Échap pour annuler
              </span>
            )}

            {/* Spacer */}
            <span style={{ flex: 1 }} />

            {/* Map size info */}
            {editor.selectedMapId && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>
                {mapData.pxWid / mapData.__gridSize}×{mapData.pxHei / mapData.__gridSize}
              </span>
            )}

            {/* Separator */}
            <span
              style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}
            />

            {/* Fit in view */}
            <button
              onClick={fitMapInView}
              title="Ajuster à la vue (Shift+G)"
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                border: '1px solid transparent',
                background: 'transparent',
                color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Maximize2 size={13} />
            </button>

            {/* Grid dropdown */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setGridMenuOpen((v) => !v);
                  setZoomMenuOpen(false);
                }}
                title="Options de la grille"
                style={{
                  width: 34,
                  height: 26,
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor:
                    editor.showGrid || gridMenuOpen ? 'rgba(139,92,246,0.6)' : 'transparent',
                  background:
                    editor.showGrid || gridMenuOpen ? 'rgba(139,92,246,0.18)' : 'transparent',
                  color: editor.showGrid || gridMenuOpen ? '#8b5cf6' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
                onMouseEnter={(e) => {
                  if (!editor.showGrid && !gridMenuOpen)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!editor.showGrid && !gridMenuOpen)
                    e.currentTarget.style.background = 'transparent';
                }}
              >
                <Grid3x3 size={11} />
                <ChevronDown size={8} />
              </button>
              {gridMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                    onClick={() => setGridMenuOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      width: 220,
                      zIndex: 51,
                      padding: 4,
                      background: 'var(--color-bg-elevated, #1e1e35)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    }}
                  >
                    <button
                      onClick={() => {
                        editor.toggleGrid();
                        setGridMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 5,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 12,
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Check
                        size={10}
                        style={{
                          opacity: editor.showGrid ? 1 : 0,
                          color: '#8b5cf6',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1 }}>Afficher la grille</span>
                      <span style={{ fontSize: 10, opacity: 0.4 }}>G</span>
                    </button>
                    <button
                      onClick={() => {
                        editor.toggleDimInactive();
                        setGridMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 5,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 12,
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Focus
                        size={10}
                        style={{
                          opacity: editor.dimInactiveLayers ? 1 : 0,
                          color: '#8b5cf6',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1 }}>Isoler la couche active</span>
                      <span style={{ fontSize: 10, opacity: 0.4 }}>D</span>
                    </button>
                    <div
                      style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }}
                    />
                    <button
                      onClick={() => {
                        if (mapMetadata) setMapSettingsOpen(true);
                        setGridMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 5,
                        border: 'none',
                        cursor: mapMetadata ? 'pointer' : 'not-allowed',
                        textAlign: 'left',
                        fontSize: 12,
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: mapMetadata ? 1 : 0.4,
                      }}
                      onMouseEnter={(e) => {
                        if (mapMetadata)
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Settings size={10} style={{ flexShrink: 0 }} />
                      <span>Configurer la carte</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sprite visuals toggle */}
            <button
              onClick={editor.toggleSpriteVisuals}
              title={`${editor.showSpriteVisuals ? 'Masquer' : 'Afficher'} les sprites des entités`}
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                border: '1px solid',
                borderColor: editor.showSpriteVisuals ? 'rgba(139,92,246,0.6)' : 'transparent',
                background: editor.showSpriteVisuals ? 'rgba(139,92,246,0.18)' : 'transparent',
                color: editor.showSpriteVisuals ? '#8b5cf6' : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (!editor.showSpriteVisuals)
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (!editor.showSpriteVisuals) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Ghost size={13} />
            </button>

            {/* Export */}
            {editor.selectedMapId && (
              <button
                onClick={handleExportMap}
                title="Exporter la carte en JSON (.ac-map.json)"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  border: '1px solid transparent',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Download size={13} />
              </button>
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
              <div
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
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
                  Sélectionne une carte dans la barre en haut
                  <br />
                  ou crée-en une nouvelle avec{' '}
                  <strong style={{ color: 'var(--color-primary)' }}>+</strong>
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
                // Sync Hero spawn ↔ position : déplacer aussi l'instance Hero si elle existe
                const spawnMapData = useMapsStore.getState().mapDataById[editor.selectedMapId];
                const heroInst = spawnMapData?._ac_objects?.find((o) => {
                  const def = useMapsStore
                    .getState()
                    .objectDefinitions.find((d) => d.id === o.definitionId);
                  return def?.category === 'hero';
                });
                if (heroInst) {
                  useMapsStore
                    .getState()
                    .updateObjectInstance(editor.selectedMapId, heroInst.id, { cx, cy });
                }
                setIsMovingSpawn(false);
                return;
              }
              // Object placement mode (Phase 4)
              if (placingObjectDefId && editor.selectedMapId) {
                addObjectInstance(editor.selectedMapId, {
                  id: generateId('obj'),
                  definitionId: placingObjectDefId,
                  cx,
                  cy,
                  facing: 'down',
                });
                setPlacingObjectDefId(null);
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
            entities={resolvedObjects ? undefined : mapData._ac_entities}
            objects={resolvedObjects}
            selectedEntityId={selectedEntityId}
            onEntityClick={setSelectedEntityId}
            onEntityContextMenu={(entityId, x, y) => {
              setSelectedEntityId(entityId);
              setEntityContextMenu({ entityId, x, y });
            }}
            onEntityDelete={
              editor.selectedMapId
                ? (entityId) => {
                    const isObject = (mapData._ac_objects ?? []).some((o) => o.id === entityId);
                    if (isObject) {
                      useMapsStore.getState().removeObjectInstance(editor.selectedMapId!, entityId);
                    } else {
                      removeEntity(editor.selectedMapId!, entityId);
                    }
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
            sceneEffect={mapMetadata?.sceneEffect}
            showSpriteVisuals={editor.showSpriteVisuals}
            spriteConfigs={spriteConfigs}
            selectedTile={editor.selectedTile}
            editingZoneRect={editingZoneRect}
            selectionRect={selectionRect}
            onSelectionChange={setSelectionRect}
            onSelectionMove={handleSelectionMove}
            onObjectDrop={(defId, cx, cy) => {
              if (!editor.selectedMapId) return;
              // Auto-scale : si le sprite a des frames non-carrées, initialiser scaleX/scaleY
              // pour que l'objet s'affiche à ses proportions naturelles sans être tassé dans 1 tuile.
              const def = objectDefinitions.find((d) => d.id === defId);
              const spriteComp = def?.components.find(
                (c) => c.type === 'animatedSprite' || c.type === 'sprite'
              );
              const spriteAssetUrl =
                spriteComp?.type === 'animatedSprite' || spriteComp?.type === 'sprite'
                  ? (spriteComp as { spriteAssetUrl: string }).spriteAssetUrl
                  : undefined;
              const ts = mapData.__gridSize || 32;
              let initialOverrides: { scaleX?: number; scaleY?: number } | undefined;
              if (spriteAssetUrl) {
                const cfg = useSettingsStore.getState().spriteSheetConfigs[spriteAssetUrl];
                if (cfg && (cfg.frameW !== ts || cfg.frameH !== ts)) {
                  initialOverrides = {
                    scaleX: Math.round((cfg.frameW / ts) * 100) / 100,
                    scaleY: Math.round((cfg.frameH / ts) * 100) / 100,
                  };
                }
              }
              addObjectInstance(editor.selectedMapId, {
                id: generateId('obj'),
                definitionId: defId,
                cx,
                cy,
                facing: 'down',
                ...(initialOverrides ? { overrides: initialOverrides } : {}),
              });
            }}
            onObjectTransform={(objectId, scaleX, scaleY, rotation) => {
              if (!editor.selectedMapId) return;
              const inst = useMapsStore
                .getState()
                .mapDataById[editor.selectedMapId]?._ac_objects?.find((o) => o.id === objectId);
              if (!inst) return;
              useMapsStore.getState().updateObjectInstance(editor.selectedMapId, objectId, {
                overrides: { ...inst.overrides, scaleX, scaleY, rotation },
              });
            }}
          />
        </div>

        {/* ── MapSettingsDialog — ouvert via toolbar (grille > Configurer) ── */}
        {mapSettingsOpen && mapMetadata && (
          <MapSettingsDialog map={mapMetadata} onClose={() => setMapSettingsOpen(false)} />
        )}

        {/* ── Entity context menu (portal) ── */}
        {entityContextMenu &&
          editor.selectedMapId &&
          (() => {
            // Chercher d'abord dans les ObjectInstances (nouveau système)
            const objInstance = mapData._ac_objects?.find(
              (o) => o.id === entityContextMenu.entityId
            );
            const objDefinition = objInstance
              ? objectDefinitions.find((d) => d.id === objInstance.definitionId)
              : undefined;

            // Fallback sur les EntityInstances legacy
            const entity = objInstance
              ? null
              : mapData._ac_entities.find((e) => e.id === entityContextMenu.entityId);

            // Si ni l'un ni l'autre → ne rien afficher
            if (!objInstance && !entity) return null;

            // Adapter les props pour EntityContextMenu (fonctionne dans les deux cas)
            const spriteUrl = objDefinition
              ? ((
                  objDefinition.components.find(
                    (c) => c.type === 'animatedSprite' || c.type === 'sprite'
                  ) as { spriteAssetUrl?: string } | undefined
                )?.spriteAssetUrl ?? '')
              : entity!.spriteAssetUrl;
            const cfg = spriteConfigs[spriteUrl];
            const instanceCount = objInstance
              ? (mapData._ac_objects?.filter((o) => o.definitionId === objInstance.definitionId)
                  .length ?? 1)
              : mapData._ac_entities.filter((e) => e.spriteAssetUrl === entity!.spriteAssetUrl)
                  .length;

            // Construire une EntityInstance synthétique pour ObjectInstances
            const syntheticEntity = objInstance
              ? {
                  id: objInstance.id,
                  spriteAssetUrl: spriteUrl,
                  cx: objInstance.cx,
                  cy: objInstance.cy,
                  facing: objInstance.facing,
                  behavior: 'static' as const,
                  displayName: objDefinition?.displayName,
                }
              : entity!;

            return (
              <EntityContextMenu
                x={entityContextMenu.x}
                y={entityContextMenu.y}
                entity={syntheticEntity}
                spriteConfig={cfg}
                isPlayerSprite={mapMetadata?.playerSpritePath === spriteUrl}
                instanceCount={instanceCount}
                definitionId={objInstance?.definitionId}
                onClose={() => setEntityContextMenu(null)}
                onDelete={() => {
                  if (objInstance) {
                    useMapsStore
                      .getState()
                      .removeObjectInstance(editor.selectedMapId!, objInstance.id);
                  } else {
                    removeEntity(editor.selectedMapId!, entity!.id);
                    if (selectedEntityId === entity!.id) setSelectedEntityId(null);
                  }
                }}
                onDuplicate={() => {
                  if (objInstance) {
                    useMapsStore.getState().addObjectInstance(editor.selectedMapId!, {
                      ...objInstance,
                      id: `obj-${Date.now()}`,
                      cx: objInstance.cx + 1,
                    });
                  } else {
                    addEntity(editor.selectedMapId!, {
                      id: `entity-${Date.now()}`,
                      spriteAssetUrl: entity!.spriteAssetUrl,
                      cx: entity!.cx + 1,
                      cy: entity!.cy,
                      facing: entity!.facing,
                      behavior: entity!.behavior,
                      displayName: entity!.displayName,
                    });
                  }
                }}
                onSetAsPlayer={() => {
                  updateMapMetadata(editor.selectedMapId!, { playerSpritePath: spriteUrl });
                }}
                onConfigureSprite={() => {
                  setEntityContextMenu(null);
                }}
                onEditDefinition={
                  objInstance?.definitionId
                    ? () => {
                        setEntityContextMenu(null);
                        setObjDefDialogFromCtx(objInstance.definitionId);
                      }
                    : undefined
                }
              />
            );
          })()}

        {/* ObjectDefinitionDialog ouvert depuis le context menu */}
        <ObjectDefinitionDialog
          definitionId={objDefDialogFromCtx}
          onClose={() => setObjDefDialogFromCtx(null)}
          onOpenSpriteImport={() => setObjDefDialogFromCtx(null)}
        />
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
        title="Redimensionner le panneau droit"
      />

      {/* ── Right panel — Objets de scène + Calques (style GDevelop) ── */}
      <aside
        className="flex-shrink-0 border-l border-border overflow-hidden flex flex-col"
        style={{ width: paletteWidth, background: 'var(--color-bg-surface)' }}
        aria-label="Objets de scène et calques"
      >
        {/* PanelGroup vertical — Objets (+ Inspector) / Calques (react-resizable-panels) */}
        <PanelGroup orientation="vertical" style={{ height: '100%' }}>
          {/* Panel 1 — Objets de scène + Inspector entité inline */}
          <Panel
            defaultSize={65}
            minSize={25}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <ObjectsPanel
              mapId={editor.selectedMapId}
              isPlacingObject={placingObjectDefId !== null}
              placingObjectDefId={placingObjectDefId}
              onStartPlacing={(defId) => setPlacingObjectDefId(defId)}
              onCancelPlacing={() => setPlacingObjectDefId(null)}
            />
            {/* Entity inspector — visible quand entité sélectionnée, GDevelop pattern */}
            {selectedEntity && editor.selectedMapId && (
              <div
                style={{
                  borderTop: '2px solid var(--color-primary-40, rgba(139,92,246,0.4))',
                  flexShrink: 0,
                  overflowY: 'auto',
                  maxHeight: 260,
                }}
              >
                <EntityPropertyPanel
                  mapId={editor.selectedMapId}
                  entity={selectedEntity}
                  onClose={() => setSelectedEntityId(null)}
                />
              </div>
            )}
            {/* Object instance inspector — scaleX/scaleY (Phase 4) */}
            {selectedObjectInstance &&
              editor.selectedMapId &&
              (() => {
                const inst = selectedObjectInstance;
                const mapId = editor.selectedMapId!;
                const sx = inst.overrides?.scaleX ?? inst.overrides?.scale ?? 1;
                const sy = inst.overrides?.scaleY ?? inst.overrides?.scale ?? 1;
                const def = objectDefinitions.find((d) => d.id === inst.definitionId);
                return (
                  <div
                    style={{
                      borderTop: '2px solid var(--color-primary-40, rgba(139,92,246,0.4))',
                      flexShrink: 0,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--color-text-base)',
                          flex: 1,
                        }}
                      >
                        ↔ Taille — {def?.displayName ?? 'Objet'}
                      </span>
                      <button
                        onClick={() => setSelectedEntityId(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-text-muted)',
                          padding: 2,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    {(['x', 'y'] as const).map((axis) => {
                      const val = axis === 'x' ? sx : sy;
                      const key = axis === 'x' ? 'scaleX' : ('scaleY' as const);
                      return (
                        <label
                          key={axis}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                              Échelle {axis.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--color-primary)',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                              }}
                            >
                              {val.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.1}
                            max={4}
                            step={0.05}
                            value={val}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              useMapsStore.getState().updateObjectInstance(mapId, inst.id, {
                                overrides: { ...inst.overrides, [key]: v },
                              });
                            }}
                            style={{
                              width: '100%',
                              accentColor: 'var(--color-primary)',
                              cursor: 'pointer',
                            }}
                          />
                        </label>
                      );
                    })}
                    <button
                      onClick={() =>
                        useMapsStore.getState().updateObjectInstance(mapId, inst.id, {
                          overrides: { ...inst.overrides, scaleX: 1, scaleY: 1 },
                        })
                      }
                      style={{
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 5,
                        border: '1px solid var(--color-border-base)',
                        background: 'transparent',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                );
              })()}
          </Panel>

          {/* Drag handle — barre de redimensionnement Objects / Layers */}
          <PanelResizeHandle
            style={{
              height: 5,
              background: 'var(--color-border-base)',
              cursor: 'row-resize',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 32,
                height: 2,
                borderRadius: 1,
                background: 'rgba(255,255,255,0.2)',
                pointerEvents: 'none',
              }}
            />
          </PanelResizeHandle>

          {/* Panel 2 — Calques */}
          <Panel defaultSize={35} minSize={15} style={{ overflow: 'hidden' }}>
            <LayersPanelSection
              allLayers={mapData.layerInstances}
              activeLayer={editor.activeLayer}
              activeTileLayerIndex={editor.activeTileLayerIndex}
              onTileLayerSelect={(idx) => {
                editor.setActiveTileLayerIndex(idx);
                editor.setActiveLayer('tiles');
              }}
              onLayerChange={(layer) => {
                editor.setActiveLayer(layer);
                if (layer === 'triggers') setRightTab('triggers');
                else if (rightTab === 'triggers') setRightTab('tiles');
              }}
              onUpdateLayerProps={(identifier, patch) => {
                if (editor.selectedMapId) updateLayerProps(editor.selectedMapId, identifier, patch);
              }}
              onReorderTileLayer={(from, to) => {
                if (!editor.selectedMapId) return;
                reorderTileLayer(editor.selectedMapId, from, to);
                const cur = editor.activeTileLayerIndex;
                if (from === cur) editor.setActiveTileLayerIndex(to);
                else if (from < cur && to >= cur) editor.setActiveTileLayerIndex(cur - 1);
                else if (from > cur && to <= cur) editor.setActiveTileLayerIndex(cur + 1);
              }}
              onAddTileLayer={(name) => {
                if (editor.selectedMapId) addTileLayer(editor.selectedMapId, name);
              }}
              onRenameTileLayer={(identifier, newName) => {
                if (editor.selectedMapId)
                  renameTileLayer(editor.selectedMapId, identifier, newName);
              }}
              onDeleteTileLayer={(idx) => {
                if (!editor.selectedMapId) return;
                const tileLayers = mapData.layerInstances.filter((l) => l.__type === 'tiles');
                const layer = tileLayers[idx];
                if (!layer) return;
                removeTileLayer(editor.selectedMapId, layer.__identifier);
                const cur = editor.activeTileLayerIndex;
                if (idx <= cur && cur > 0) editor.setActiveTileLayerIndex(cur - 1);
              }}
            />
          </Panel>
        </PanelGroup>
      </aside>
    </div>
  );
}
