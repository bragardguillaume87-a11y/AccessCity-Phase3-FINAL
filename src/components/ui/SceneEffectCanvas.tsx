/**
 * SceneEffectCanvas — Overlay canvas partagé pour les effets atmosphériques
 *
 * Rendu Canvas 2D (pluie, bruine, neige, god rays, bloom) ou
 * WebGL2 (brouillard) selon l'effet. Positionné en `position: absolute`
 * sur le conteneur parent (qui doit être `position: relative`).
 *
 * Usage :
 *   <div style={{ position: 'relative' }}>
 *     <img ... />  // fond de scène
 *     <SceneEffectCanvas effect={scene.sceneEffect} />
 *   </div>
 *
 * @module components/ui/SceneEffectCanvas
 */

import { useEffect, useRef, useCallback } from 'react';
import type { SceneEffectConfig, CharacterHitbox } from '@/types/sceneEffect';
export type { CharacterHitbox };
import {
  startRainEffect,
  startDrizzleEffect,
  startSnowEffect,
} from '@/utils/sceneEffects/rainEffect';
import { startFogEffect } from '@/utils/sceneEffects/fogEffect';
import { startGodRaysEffect } from '@/utils/sceneEffects/godraysEffect';
import { startBloomEffect } from '@/utils/sceneEffects/bloomEffect';

interface SceneEffectCanvasProps {
  effect?: SceneEffectConfig;
  /** Optionnel : forcer des dimensions fixes (sinon remplit le parent via inset:0) */
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  /**
   * Bounding boxes des sprites personnages en pixels canvas.
   * Mis à jour par ref à chaque frame — zéro restart du renderer.
   * Utilisé par la pluie pour les collisions goutte → sprite.
   */
  characterHitboxes?: CharacterHitbox[];
}

// ── Renderer interface (commun à tous les effets) ─────────────────────────────

interface EffectRenderer {
  stop: () => void;
  resize: (w: number, h: number) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SceneEffectCanvas({
  effect,
  width,
  height,
  style,
  characterHitboxes,
}: SceneEffectCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<EffectRenderer | null>(null);
  // Ref mutable lue à chaque frame par le renderer de pluie — pas de restart
  const hitboxesRef = useRef<CharacterHitbox[]>([]);

  // Sync la prop → ref à chaque render (pas de useEffect nécessaire)
  hitboxesRef.current = characterHitboxes ?? [];

  // ── Lance / recharge le renderer quand l'effet change ────────────────────
  const startRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !effect || effect.type === 'none') return;

    const parent = canvas.parentElement;
    const w = width ?? parent?.clientWidth ?? 400;
    const h = height ?? parent?.clientHeight ?? 300;
    canvas.width = w;
    canvas.height = h;

    let renderer: EffectRenderer | null = null;

    switch (effect.type) {
      case 'rain':
        renderer = startRainEffect(canvas, effect, hitboxesRef);
        break;
      case 'drizzle':
        renderer = startDrizzleEffect(canvas, effect);
        break;
      case 'snow':
        renderer = startSnowEffect(canvas, effect);
        break;
      case 'fog':
        renderer = startFogEffect(canvas, effect);
        break;
      case 'godrays':
        renderer = startGodRaysEffect(canvas, effect);
        break;
      case 'bloom':
        renderer = startBloomEffect(canvas, effect);
        break;
      default:
        break;
    }

    rendererRef.current = renderer;
  }, [effect, width, height]);

  // ── Démarrage / arrêt ────────────────────────────────────────────────────
  useEffect(() => {
    rendererRef.current?.stop();
    rendererRef.current = null;

    if (!effect || effect.type === 'none') return;

    startRenderer();

    return () => {
      rendererRef.current?.stop();
      rendererRef.current = null;
    };
  }, [effect, startRenderer]);

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (canvas && (canvas.width !== nw || canvas.height !== nh)) {
          canvas.width = nw;
          canvas.height = nh;
          rendererRef.current?.resize(nw, nh);
        }
      }
    });

    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  if (!effect || effect.type === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: width ?? '100%',
        height: height ?? '100%',
        pointerEvents: 'none',
        zIndex: 10,
        ...style,
      }}
    />
  );
}
