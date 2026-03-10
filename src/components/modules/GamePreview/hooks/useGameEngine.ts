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
import { DialogueBridge } from '../DialogueBridge';

interface UseGameEngineOptions {
  containerId: string;
  selectedMapId: string | null;
  onDialogueTrigger: (sceneId: string) => void;
  onMapExit: (targetMapId: string) => void;
}

export function useGameEngine({
  containerId,
  selectedMapId,
  onDialogueTrigger,
  onMapExit,
}: UseGameEngineOptions) {
  const engineRef = useRef<ex.Engine | null>(null);

  useEffect(() => {
    if (!selectedMapId) return;

    const storeState  = useMapsStore.getState();
    const mapData     = storeState.mapDataById[selectedMapId];
    if (!mapData) return;

    const mapMetadata      = storeState.getMapById(selectedMapId);
    const playerSpritePath = mapMetadata?.playerSpritePath;
    // Config sprite (avec flipX) — lu depuis settingsStore (getState() correct dans un handler)
    const spriteConfigs    = useSettingsStore.getState().spriteSheetConfigs;
    const playerSpriteConfig = playerSpritePath ? spriteConfigs[playerSpritePath] : undefined;

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
    const canvas = document.createElement('canvas');
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.imageRendering = 'pixelated'; // prevent browser-level smoothing when CSS-scaling the canvas
    container.appendChild(canvas);

    const engine = new ex.Engine({
      canvasElement: canvas,
      displayMode: ex.DisplayMode.FitContainer,
      suppressPlayButton: true,
      suppressConsoleBootMessage: true,
      backgroundColor: ex.Color.fromHex('#0d0d1a'),
      antialiasing: false,
      pixelArt: true,
    });

    engineRef.current = engine;

    const bridge = new DialogueBridge({
      engine,
      onTriggerDialogue: onDialogueTrigger,
      onTriggerMapExit: onMapExit,
    });

    const scene = new TopdownScene(mapData, bridge, playerSpritePath, imageCache, playerSpriteConfig, spriteConfigs);
    engine.addScene('topdown', scene);

    // Start with loader if there are images, else start directly
    const resources = [...imageCache.values()];
    const startPromise = resources.length > 0
      ? engine.start(new ex.Loader(resources))
      : engine.start();

    startPromise.then(() => engine.goToScene('topdown'));

    return () => {
      engine.stop();
      engineRef.current = null;
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, selectedMapId]);

  return engineRef;
}
