/**
 * useAnimationPreview — Gestion de la boucle d'animation du SpriteImportDialog
 *
 * Responsabilités :
 * - State : isPlaying, loopMode
 * - Ref   : animFrameRef (frame courante)
 * - Effect : boucle setInterval principale (preview canvas)
 * - Effect : boucles setInterval mini-canvas (une par direction active)
 *
 * Le composant garde `drawMainCanvas` (qui mélange dessin sprite + collision overlay)
 * et le passe en paramètre pour que le hook pilote l'avance des frames.
 */

import { useState, useEffect } from 'react';
import { drawSpriteFrame } from '@/utils/spriteCanvas';
import type { AnimationRange, SpriteAnimationTag } from '@/types/sprite';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnimGroup {
  tags: SpriteAnimationTag[];
}

type AnimState = Partial<Record<SpriteAnimationTag, AnimationRange>>;

interface UseAnimationPreviewParams {
  previewAnim: AnimationRange | null;
  drawMainCanvas: () => void;
  loadedImgRef: React.RefObject<HTMLImageElement | null>;
  /** animFrameRef owned by parent — hook mutates .current to advance frames */
  animFrameRef: React.MutableRefObject<number>;
  imgSize: { w: number; h: number } | null;
  activeGroup: AnimGroup;
  animations: AnimState;
  cols: number;
  frameW: number;
  frameH: number;
  miniCanvasRefs: React.MutableRefObject<
    Partial<Record<SpriteAnimationTag, HTMLCanvasElement | null>>
  >;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnimationPreview({
  previewAnim,
  drawMainCanvas,
  loadedImgRef,
  animFrameRef,
  imgSize,
  activeGroup,
  animations,
  cols,
  frameW,
  frameH,
  miniCanvasRefs,
}: UseAnimationPreviewParams) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [loopMode, setLoopMode] = useState<'forward' | 'pingpong'>('forward');

  // ── Main preview animation loop ────────────────────────────────────────────
  useEffect(() => {
    if (!previewAnim) return;
    const frames = previewAnim.frames ?? [];
    const count = Math.max(1, frames.length);
    const fps = Math.max(1, previewAnim.fps ?? 10);
    let tick = 0;
    animFrameRef.current = frames[0] ?? 0;
    drawMainCanvas();
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (loopMode === 'pingpong') {
        const half = count - 1;
        const period = Math.max(1, half * 2);
        const pos = tick % period;
        animFrameRef.current = frames[pos < count ? pos : period - pos] ?? frames[0] ?? 0;
      } else {
        animFrameRef.current = frames[tick % count] ?? frames[0] ?? 0;
      }
      tick++;
      drawMainCanvas();
    }, 1000 / fps);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewAnim, drawMainCanvas, isPlaying, loopMode]); // animFrameRef est un ref stable

  // Redraw quand drawMainCanvas change (ex: playerCollider modifié)
  useEffect(() => {
    drawMainCanvas();
  }, [drawMainCanvas]);

  // ── Mini-canvas loops (une par direction de l'onglet actif) ────────────────
  useEffect(() => {
    if (!loadedImgRef.current || !imgSize) return;
    const img = loadedImgRef.current;
    const intervals: ReturnType<typeof setInterval>[] = [];

    for (const tag of activeGroup.tags) {
      const anim = animations[tag];
      const canvas = miniCanvasRefs.current[tag];
      if (!anim || !canvas) continue;

      const { frames, fps, flipX } = anim;
      if (!frames?.length) continue;
      const frameCount = Math.max(1, frames.length);
      let tick = 0;

      const draw = () => {
        drawSpriteFrame(
          canvas,
          img,
          frames[tick % frameCount] ?? frames[0] ?? 0,
          cols,
          frameW,
          frameH,
          flipX
        );
      };

      draw();
      const id = setInterval(
        () => {
          tick++;
          draw();
        },
        1000 / Math.max(1, fps)
      );
      intervals.push(id);
    }

    return () => intervals.forEach(clearInterval);
  }, [animations, activeGroup, cols, frameW, frameH, imgSize, loadedImgRef, miniCanvasRefs]);

  return { isPlaying, setIsPlaying, loopMode, setLoopMode };
}
