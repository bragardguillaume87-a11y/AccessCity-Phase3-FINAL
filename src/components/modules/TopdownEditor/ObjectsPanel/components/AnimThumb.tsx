import { useRef, useEffect } from 'react';
import { drawSpriteFrameCover, getIdleFramePos } from '@/utils/spriteCanvas';
import type { SpriteSheetConfig } from '@/types/sprite';

interface AnimThumbProps {
  url: string;
  config: SpriteSheetConfig;
  size?: number;
  animate?: boolean;
}

export function AnimThumb({ url, config, size = 40, animate = false }: AnimThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      if (!animate) {
        const { col, row } = getIdleFramePos(config);
        drawSpriteFrameCover(canvas, img, col, row, config);
        return;
      }
      const walkAnim = config.animations.walk_down ?? config.animations.idle_down;
      const frames = walkAnim?.frames ?? [0];
      const fps = walkAnim?.fps ?? 8;
      const interval = 1000 / fps;
      let last = 0;
      const tick = (ts: number) => {
        if (cancelled) return;
        if (ts - last > interval) {
          last = ts;
          frameRef.current = (frameRef.current + 1) % frames.length;
          const fi = frames[frameRef.current];
          const col = fi % Math.max(1, config.cols);
          const row = Math.floor(fi / Math.max(1, config.cols));
          drawSpriteFrameCover(canvas, img, col, row, config);
        }
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    };
    img.src = url;
    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [url, config, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        flexShrink: 0,
        borderRadius: 4,
        background: 'rgba(0,0,0,0.35)',
      }}
    />
  );
}
