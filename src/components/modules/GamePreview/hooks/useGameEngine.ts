/**
 * useGameEngine — Gestion du cycle de vie du moteur Excalibur
 *
 * Pré-charge toutes les images nécessaires (tuiles décor + sprite joueur)
 * via ex.Loader avant de démarrer le moteur. Passe l'imageCache à TopdownScene.
 *
 * Dépendance sur `selectedMapId` seulement (pas sur mapData) pour éviter
 * de redémarrer le moteur à chaque peinture de tuile dans l'éditeur.
 *
 * @module components/modules/GamePreview/hooks/useGameEngine
 */

import { useEffect, useRef } from 'react';
import * as ex from 'excalibur';
import { useMapsStore } from '@/stores/mapsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TopdownScene } from '../GameScene';
import { DialogueBridge, type TransitionType } from '../DialogueBridge';

interface UseGameEngineOptions {
  containerId: string;
  selectedMapId: string | null;
  onDialogueTrigger: (sceneId: string, transitionType: TransitionType) => void;
  onMapExit: (targetMapId: string, targetPos: { x: number; y: number }) => void;
  /** Spawn position when entering this map (grid pixels). Defaults to (tileSize*2, tileSize*2). */
  initialPlayerPos?: { x: number; y: number };
  onShowInteractPrompt?: () => void;
  onHideInteractPrompt?: () => void;
  onShowSignPopup?: (text: string) => void;
  onHideSignPopup?: () => void;
}

export function useGameEngine({
  containerId,
  selectedMapId,
  onDialogueTrigger,
  onMapExit,
  initialPlayerPos,
  onShowInteractPrompt,
  onHideInteractPrompt,
  onShowSignPopup,
  onHideSignPopup,
}: UseGameEngineOptions) {
  const engineRef = useRef<ex.Engine | null>(null);
  const bridgeRef = useRef<DialogueBridge | null>(null);

  useEffect(() => {
    if (!selectedMapId) return;

    const storeState = useMapsStore.getState();
    const mapData = storeState.mapDataById[selectedMapId];
    if (!mapData) return;

    const mapMetadata = storeState.getMapById(selectedMapId);
    const playerSpritePath = mapMetadata?.playerSpritePath;
    // Config sprite (avec flipX) — lu depuis settingsStore (getState() correct dans un handler)
    const spriteConfigs = useSettingsStore.getState().spriteSheetConfigs;
    const playerSpriteConfig = playerSpritePath ? spriteConfigs[playerSpritePath] : undefined;

    // Player spawn position — from mapMetadata if defined, else use initialPlayerPos prop (map exit),
    // else fallback to tileSize * 2 (handled in TopdownScene constructor)
    const tileSize = mapData.__gridSize || 32;
    const resolvedSpawn =
      initialPlayerPos ??
      (mapMetadata?.playerStartCx !== undefined && mapMetadata?.playerStartCy !== undefined
        ? { x: mapMetadata.playerStartCx * tileSize, y: mapMetadata.playerStartCy * tileSize }
        : undefined);

    // ── Preview display settings ────────────────────────────────────────────
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 4.0;

    const previewDisplayMode = mapMetadata?.previewDisplayMode ?? 'auto';
    const previewAntialiasing = mapMetadata?.previewAntialiasing ?? false;
    const previewFpsCap = mapMetadata?.previewFpsCap ?? 60;
    // Sprite-level collider takes priority over map-level override
    const playerCollider = playerSpriteConfig?.playerCollider ?? mapMetadata?.playerCollider;

    const container = document.getElementById(containerId);
    if (!container) return;

    // ── Engine resolution = container réel pour éviter les bandes noires ────
    // FitContainer maintient le ratio 16:9 interne → si le container n'est pas
    // exactement 16:9 (barre de contrôle en haut), des bandes noires apparaissent
    // sur les côtés. Solution : utiliser les dimensions réelles du container comme
    // résolution interne → FitContainer 1:1 → aucun letterbox/pillarbox.
    const containerRect = container.getBoundingClientRect();
    const ENGINE_W = containerRect.width > 0 ? Math.floor(containerRect.width) : 1280;
    const ENGINE_H = containerRect.height > 0 ? Math.floor(containerRect.height) : 720;

    // Auto-zoom: scale camera so the viewport covers the map → no void outside edges
    const resolvedZoom: number =
      previewDisplayMode === 'auto'
        ? Math.min(
            ZOOM_MAX,
            Math.max(ZOOM_MIN, Math.max(ENGINE_W / mapData.pxWid, ENGINE_H / mapData.pxHei))
          )
        : Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, mapMetadata?.previewZoom ?? 1.5));

    // ── Collect all image URLs to preload ──────────────────────────────────
    const uniqueUrls = new Set<string>();

    // Tile images from décor layer
    for (const layer of mapData.layerInstances) {
      for (const tile of layer.gridTiles ?? []) {
        if (tile.src) uniqueUrls.add(tile.src);
      }
    }

    // Player sprite
    if (playerSpritePath) uniqueUrls.add(playerSpritePath);

    // Entity sprites (legacy)
    for (const entity of mapData._ac_entities ?? []) {
      if (entity.spriteAssetUrl) uniqueUrls.add(entity.spriteAssetUrl);
    }

    // Object sprites (Phase 4)
    const objectDefinitions = storeState.objectDefinitions ?? [];
    for (const instance of mapData._ac_objects ?? []) {
      const def = objectDefinitions.find((d) => d.id === instance.definitionId);
      if (!def) continue;
      for (const comp of def.components) {
        if (comp.type === 'animatedSprite' || comp.type === 'sprite') {
          uniqueUrls.add(comp.spriteAssetUrl);
        }
      }
    }

    // Create ImageSource map (url → source)
    const imageCache = new Map<string, ex.ImageSource>();
    for (const url of uniqueUrls) {
      imageCache.set(url, new ex.ImageSource(url));
    }

    // ── Engine setup ───────────────────────────────────────────────────────
    // La résolution moteur = dimensions réelles du container → FitContainer 1:1
    // → aucun letterbox/pillarbox, canvas remplit exactement le container.
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.imageRendering = 'pixelated'; // pixel-art net sans antialiasing CSS
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    // Résolution interne 16:9 — FitContainer scale cette résolution pour remplir
    // le container tout en maintenant le ratio. Sans width/height explicite,
    // Excalibur utilise le canvas natif (300×150) et ne remplit pas l'espace.
    const engine = new ex.Engine({
      canvasElement: canvas,
      width: ENGINE_W,
      height: ENGINE_H,
      displayMode: ex.DisplayMode.FitContainer,
      suppressPlayButton: true,
      suppressConsoleBootMessage: true,
      backgroundColor: ex.Color.fromHex('#0d0d1a'),
      antialiasing: previewAntialiasing,
      pixelArt: !previewAntialiasing,
      maxFps: previewFpsCap,
    });

    engineRef.current = engine;

    // Mutable ref so onStopMapBgm can be captured before scene is instantiated
    let sceneInstance: TopdownScene | null = null;

    const bridge = new DialogueBridge({
      engine,
      onTriggerDialogue: onDialogueTrigger,
      onTriggerMapExit: onMapExit,
      onStopMapBgm: () => sceneInstance?.stopBgm(),
      onResumeBgm: () => sceneInstance?.resumeBgm(),
      onShowInteractPrompt,
      onHideInteractPrompt,
      onShowSignPopup,
      onHideSignPopup,
    });
    bridgeRef.current = bridge;

    const bgmBrickId = mapMetadata?.bgmBrickId;
    const bgmAudioUrl = mapMetadata?.bgmAudioUrl;
    const tilesetConfigs = useSettingsStore.getState().tilesetConfigs;
    const sceneEffect = mapMetadata?.sceneEffect;
    const scene = new TopdownScene(
      mapData,
      bridge,
      playerSpritePath,
      imageCache,
      playerSpriteConfig,
      spriteConfigs,
      resolvedSpawn,
      bgmBrickId,
      bgmAudioUrl,
      tilesetConfigs,
      sceneEffect,
      resolvedZoom,
      playerCollider,
      objectDefinitions
    );
    sceneInstance = scene;
    engine.addScene('topdown', scene);
    const sceneRef = scene; // pour le cleanup

    // Start with loader if there are images, else start directly
    const resources = [...imageCache.values()];
    const startPromise =
      resources.length > 0 ? engine.start(new ex.Loader(resources)) : engine.start();

    // Guard contre la race condition StrictMode : le cleanup peut s'exécuter
    // avant que startPromise.then() ait eu le temps de lancer goToScene.
    // Sans ce flag, onInitialize() → startBgm() s'exécuterait APRÈS le cleanup,
    // créant un HTMLAudioElement orphelin sans possibilité de l'arrêter.
    let cancelled = false;
    startPromise.then(() => {
      if (cancelled) return;
      engine.goToScene('topdown');
    });

    return () => {
      cancelled = true;
      // engine.stop() ne déclenche pas onDeactivate — arrêter la BGM explicitement
      sceneRef.stopBgm();
      engine.stop();
      engineRef.current = null;
      bridgeRef.current = null;
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, selectedMapId]);

  return { engineRef, bridgeRef };
}
