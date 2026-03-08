/**
 * useGameEngine — Gestion du cycle de vie du moteur Excalibur
 *
 * Crée et démarre un Engine Excalibur dans un useEffect.
 * Le moteur est lié à une <div> container (pas directement au canvas React).
 * Cleanup : engine.stop() sur démontage.
 *
 * Dépendance sur `selectedMapId` seulement (pas sur mapData) pour éviter
 * de redémarrer le moteur à chaque peinture de tuile dans l'éditeur.
 *
 * @module components/modules/GamePreview/hooks/useGameEngine
 */

import { useEffect, useRef } from 'react';
import * as ex from 'excalibur';
import { useMapsStore } from '@/stores/mapsStore';
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

    // Read snapshot of mapData at preview launch (not reactive — correct for a game)
    const mapData = useMapsStore.getState().mapDataById[selectedMapId];
    if (!mapData) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Create canvas element and append to container
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const engine = new ex.Engine({
      canvasElement: canvas,
      displayMode: ex.DisplayMode.FitContainer,
      suppressPlayButton: true,
      suppressConsoleBootMessage: true,
      backgroundColor: ex.Color.fromHex('#0d0d1a'),
      antialiasing: false,         // Pixel-art style
      pixelArt: true,
    });

    engineRef.current = engine;

    const bridge = new DialogueBridge({
      engine,
      onTriggerDialogue: onDialogueTrigger,
      onTriggerMapExit: onMapExit,
    });

    const scene = new TopdownScene(mapData, bridge);
    engine.addScene('topdown', scene);

    engine.start().then(() => {
      engine.goToScene('topdown');
    });

    return () => {
      engine.stop();
      engineRef.current = null;
      // Remove the canvas we created
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, selectedMapId]);

  return engineRef;
}
