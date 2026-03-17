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
 *   11 — canvas sprite lighting (tint ambiant ou rim light sur les personnages)
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
import { EFFECT_AMBIENT_COLORS, EFFECT_SPRITE_TINT, EFFECT_RIM_COLOR } from '@/config/sceneEffects';

interface SceneEffectCanvasProps {
  effect?: SceneEffectConfig;
  /** Optionnel : forcer des dimensions fixes (sinon remplit le parent via inset:0) */
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  /**
   * Bounding boxes des sprites personnages en pixels canvas.
   * Mis à jour par ref à chaque frame — zéro restart du renderer.
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
  const spriteLightCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<EffectRenderer | null>(null);
  const spriteLightRafRef = useRef<number | null>(null);
  // Ref mutable lue à chaque frame par le renderer de pluie et le sprite lighting
  const hitboxesRef = useRef<CharacterHitbox[]>([]);

  // Sync la prop → ref à chaque render (pas de useEffect nécessaire)
  hitboxesRef.current = characterHitboxes ?? [];

  const effectType = effect?.type ?? 'none';
  const spriteLight = effect && effect.type !== 'none' ? (effect.spriteLight ?? 'off') : 'off';
  const ambientColor = EFFECT_AMBIENT_COLORS[effectType];
  const showSpriteLight = spriteLight !== 'off' && (characterHitboxes?.length ?? 0) > 0;

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

  // ── Sprite lighting canvas loop ───────────────────────────────────────────
  useEffect(() => {
    const canvas = spriteLightCanvasRef.current;
    if (!canvas || !showSpriteLight || effectType === 'none') {
      if (spriteLightRafRef.current) {
        cancelAnimationFrame(spriteLightRafRef.current);
        spriteLightRafRef.current = null;
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tint = EFFECT_SPRITE_TINT[effectType];
    const rimColor = EFFECT_RIM_COLOR[effectType];
    let running = true;

    function drawSpriteLighting() {
      if (!running) return;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const hitboxes = hitboxesRef.current;
      if (hitboxes.length > 0) {
        for (const hb of hitboxes) {
          // ── Ambient tint (style SNES Square Soft color math) ───────────
          if ((spriteLight === 'tint' || spriteLight === 'both') && tint) {
            ctx!.fillStyle = `rgba(${tint.r},${tint.g},${tint.b},${tint.a})`;
            ctx!.fillRect(hb.x, hb.y, hb.w, hb.h);
          }

          // ── Rim light (shadowBlur glow autour du sprite) ───────────────
          if ((spriteLight === 'rimlight' || spriteLight === 'both') && rimColor) {
            ctx!.save();
            ctx!.shadowColor = rimColor;
            ctx!.shadowBlur = 20;
            ctx!.strokeStyle = rimColor;
            ctx!.lineWidth = 1.5;
            // Rect invisible, seule l'ombre est visible → halo doux
            ctx!.globalAlpha = 0.65;
            ctx!.strokeRect(hb.x + 1, hb.y + 1, hb.w - 2, hb.h - 2);
            ctx!.restore();
          }
        }
      }

      spriteLightRafRef.current = requestAnimationFrame(drawSpriteLighting);
    }

    drawSpriteLighting();

    return () => {
      running = false;
      if (spriteLightRafRef.current) {
        cancelAnimationFrame(spriteLightRafRef.current);
        spriteLightRafRef.current = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [effectType, spriteLight, showSpriteLight]);

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
        const sc = spriteLightCanvasRef.current;
        if (sc && (sc.width !== nw || sc.height !== nh)) {
          sc.width = nw;
          sc.height = nh;
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

      {/* Canvas sprite lighting (tint ambiant ou rim light) */}
      {showSpriteLight && (
        <canvas
          ref={spriteLightCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: width ?? '100%',
            height: height ?? '100%',
            pointerEvents: 'none',
            zIndex: 11,
            mixBlendMode:
              spriteLight === 'rimlight' || spriteLight === 'both' ? 'screen' : 'normal',
          }}
        />
      )}
    </>
  );
}
