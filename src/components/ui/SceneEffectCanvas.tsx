/**
 * SceneEffectCanvas — Overlay canvas partagé pour les effets atmosphériques
 *
 * Rendu Canvas 2D (pluie, bruine, neige, god rays, bloom) ou
 * WebGL2 (brouillard) selon l'effet. Positionné en `position: absolute`
 * sur le conteneur parent (qui doit être `position: relative`).
 *
 * Couches rendues (z-index croissant) :
 *   9  — div ambient color overlay (mix-blend-mode: color, style Square Soft)
 *   10 — canvas effet atmosphérique (pluie, fog, godrays…)
 *   11 — div sprite tint (mix-blend-mode: soft-light, style Octopath Traveler)
 *   12 — div rim light (mix-blend-mode: screen, gradient directionnel haut-droit)
 *
 * Le sprite lighting est un grade de couleur pleine scène (pas par sprite) :
 * les sprites pixel-art héritent du blend naturellement, comme dans Octopath Traveler.
 *
 * Usage :
 *   <div style={{ position: 'relative' }}>
 *     <img ... />  // fond de scène
 *     <SceneEffectCanvas effect={scene.sceneEffect} characterHitboxes={hitboxes} />
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
import { EFFECT_AMBIENT_COLORS, EFFECT_RIM_COLOR } from '@/config/sceneEffects';

interface SceneEffectCanvasProps {
  effect?: SceneEffectConfig;
  /** Optionnel : forcer des dimensions fixes (sinon remplit le parent via inset:0) */
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  /**
   * Bounding boxes des sprites personnages en pixels canvas.
   * Utilisé par le renderer de pluie pour les collisions goutte→sprite.
   * Le sprite lighting est désormais pleine scène (pas par hitbox).
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
  // Ref mutable lue à chaque frame par le renderer de pluie (collisions)
  const hitboxesRef = useRef<CharacterHitbox[]>([]);

  // Sync la prop → ref à chaque render (pas de useEffect nécessaire)
  hitboxesRef.current = characterHitboxes ?? [];

  const effectType = effect?.type ?? 'none';
  const spriteLight = effect && effect.type !== 'none' ? (effect.spriteLight ?? 'off') : 'off';
  const ambientColor = EFFECT_AMBIENT_COLORS[effectType];
  const rimColor = EFFECT_RIM_COLOR[effectType];

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

  // ── Démarrage / arrêt renderer principal ─────────────────────────────────
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
    <>
      {/* Overlay couleur ambiante (style Square Soft SNES color math) */}
      {ambientColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: ambientColor,
            mixBlendMode: 'color',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        />
      )}

      {/* Canvas effet atmosphérique principal */}
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

      {/*
       * Sprite tint — pleine scène, style Octopath Traveler.
       * mix-blend-mode: soft-light = la couleur atmosphérique teinte naturellement
       * tous les sprites pixel-art sans dessiner de rectangles.
       */}
      {(spriteLight === 'tint' || spriteLight === 'both') && rimColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: rimColor.replace(/[\d.]+\)$/, '0.22)'),
            mixBlendMode: 'soft-light',
            pointerEvents: 'none',
            zIndex: 11,
          }}
        />
      )}

      {/*
       * Rim light — gradient directionnel depuis haut-droit (source lumineuse).
       * mix-blend-mode: screen = lumière additive sur les bords des sprites,
       * sans masque rectangulaire visible.
       */}
      {(spriteLight === 'rimlight' || spriteLight === 'both') && rimColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 72% 16%, ${rimColor.replace(/[\d.]+\)$/, '0.50)')} 0%, ${rimColor.replace(/[\d.]+\)$/, '0.18)')} 35%, transparent 65%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        />
      )}
    </>
  );
}
