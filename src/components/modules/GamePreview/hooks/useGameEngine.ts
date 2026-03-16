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

    const container = document.getElementById(containerId);
    if (!container) return;

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

    // Entity sprites
    for (const entity of mapData._ac_entities ?? []) {
      if (entity.spriteAssetUrl) uniqueUrls.add(entity.spriteAssetUrl);
    }

    // Create ImageSource map (url → source)
    const imageCache = new Map<string, ex.ImageSource>();
    for (const url of uniqueUrls) {
      imageCache.set(url, new ex.ImageSource(url));
    }

    // ── Engine setup ───────────────────────────────────────────────────────
    // Centre le canvas Excalibur dans le container.
    // FitContainer maintient le ratio mais colle le canvas en haut-gauche par défaut.
    // On passe le container en flexbox centré pour compenser le letterbox/pillarbox.
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.imageRendering = 'pixelated'; // prevent browser-level smoothing when CSS-scaling the canvas
    container.appendChild(canvas);

    // Résolution interne 16:9 — FitContainer scale cette résolution pour remplir
    // le container tout en maintenant le ratio. Sans width/height explicite,
    // Excalibur utilise le canvas natif (300×150) et ne remplit pas l'espace.
    const engine = new ex.Engine({
      canvasElement: canvas,
      width: 1280,
      height: 720,
      displayMode: ex.DisplayMode.FitContainer,
      suppressPlayButton: true,
      suppressConsoleBootMessage: true,
      backgroundColor: ex.Color.fromHex('#0d0d1a'),
      antialiasing: false,
      pixelArt: true,
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
    const scene = new TopdownScene(
      mapData,
      bridge,
      playerSpritePath,
      imageCache,
      playerSpriteConfig,
      spriteConfigs,
      resolvedSpawn,
      bgmBrickId,
      bgmAudioUrl
    );
    sceneInstance = scene;
    engine.addScene('topdown', scene);
    const sceneRef = scene; // pour le cleanup

    // Start with loader if there are images, else start directly
    const resources = [...imageCache.values()];
    const startPromise =
      resources.length > 0 ? engine.start(new ex.Loader(resources)) : engine.start();

    startPromise.then(() => engine.goToScene('topdown'));

    return () => {
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
