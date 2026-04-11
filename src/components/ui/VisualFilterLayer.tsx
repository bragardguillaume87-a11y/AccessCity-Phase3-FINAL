/**
 * VisualFilterLayer — Enveloppe les composants de prévisualisation avec les filtres visuels
 *
 * Architecture overlay :
 * - scanlines  → div CSS repeating-linear-gradient
 * - vignette   → div CSS radial-gradient
 * - filmGrain  → canvas (blend-mode: screen)
 * - crt        → div overlay avec box-shadow + filter CSS + flicker
 * - dither     → canvas (blend-mode: multiply pour les palettes)
 *
 * Consomme `settingsStore.projectSettings.visualFilter`.
 * Tous les overlays sont pointer-events:none — n'interfèrent pas avec les interactions.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { startFilmGrain } from '@/utils/visualFilters/filmGrainRenderer';
import { startCRT } from '@/utils/visualFilters/crtRenderer';
import { startDither } from '@/utils/visualFilters/ditherRenderer';
import type { FilmGrainHandle } from '@/utils/visualFilters/filmGrainRenderer';
import type { CRTHandle } from '@/utils/visualFilters/crtRenderer';
import type { DitherHandle } from '@/utils/visualFilters/ditherRenderer';

interface VisualFilterLayerProps {
  children: ReactNode;
  /** Classe CSS additionnelle sur le wrapper */
  className?: string;
  style?: React.CSSProperties;
}

export function VisualFilterLayer({ children, className, style }: VisualFilterLayerProps) {
  const visualFilter = useSettingsStore((s) => s.projectSettings.visualFilter);

  const containerRef = useRef<HTMLDivElement>(null);
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);
  const ditherCanvasRef = useRef<HTMLCanvasElement>(null);
  const crtOverlayRef = useRef<HTMLDivElement>(null);

  const grainHandleRef = useRef<FilmGrainHandle | null>(null);
  const crtHandleRef = useRef<CRTHandle | null>(null);
  const ditherHandleRef = useRef<DitherHandle | null>(null);

  // ── Resize observer ────────────────────────────────────────────────────────
  const syncSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { offsetWidth: w, offsetHeight: h } = container;

    if (grainCanvasRef.current) {
      grainCanvasRef.current.width = w;
      grainCanvasRef.current.height = h;
      grainHandleRef.current?.resize(w, h);
    }
    if (ditherCanvasRef.current) {
      ditherHandleRef.current?.resize(w, h);
    }
    crtHandleRef.current?.resize(w, h);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [syncSize]);

  // ── Film grain ──────────────────────────────────────────────────────────────
  useEffect(() => {
    grainHandleRef.current?.stop();
    grainHandleRef.current = null;

    const canvas = grainCanvasRef.current;
    if (!canvas) return;
    if (!visualFilter?.enabled || !visualFilter.filmGrain.enabled) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const container = containerRef.current;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    grainHandleRef.current = startFilmGrain(canvas, visualFilter.filmGrain.params);

    return () => {
      grainHandleRef.current?.stop();
      grainHandleRef.current = null;
    };
  }, [visualFilter?.enabled, visualFilter?.filmGrain.enabled, visualFilter?.filmGrain.params]);

  // ── CRT ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    crtHandleRef.current?.stop();
    crtHandleRef.current = null;

    const div = crtOverlayRef.current;
    if (!div) return;
    if (!visualFilter?.enabled || !visualFilter.crt.enabled) return;

    crtHandleRef.current = startCRT(div, visualFilter.crt.params);

    return () => {
      crtHandleRef.current?.stop();
      crtHandleRef.current = null;
    };
  }, [visualFilter?.enabled, visualFilter?.crt.enabled, visualFilter?.crt.params]);

  // ── Dither ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    ditherHandleRef.current?.stop();
    ditherHandleRef.current = null;

    const canvas = ditherCanvasRef.current;
    if (!canvas) return;
    if (!visualFilter?.enabled || !visualFilter.dither.enabled) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const container = containerRef.current;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    ditherHandleRef.current = startDither(canvas, visualFilter.dither.params);

    return () => {
      ditherHandleRef.current?.stop();
      ditherHandleRef.current = null;
    };
  }, [visualFilter?.enabled, visualFilter?.dither.enabled, visualFilter?.dither.params]);

  // ── CSS helpers ─────────────────────────────────────────────────────────────
  const isOn = visualFilter?.enabled;

  const scanlinesStyle: React.CSSProperties =
    isOn && visualFilter.scanlines.enabled
      ? {
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent ${visualFilter.scanlines.params.spacing - visualFilter.scanlines.params.thickness}px,
            rgba(0,0,0,${visualFilter.scanlines.params.opacity}) ${visualFilter.scanlines.params.spacing - visualFilter.scanlines.params.thickness}px,
            rgba(0,0,0,${visualFilter.scanlines.params.opacity}) ${visualFilter.scanlines.params.spacing}px
          )`,
        }
      : { display: 'none' };

  const vignetteStyle: React.CSSProperties =
    isOn && visualFilter.vignette.enabled
      ? {
          background: `radial-gradient(
            ellipse at center,
            transparent ${Math.round(visualFilter.vignette.params.softness * 100)}%,
            ${visualFilter.vignette.params.color} 100%
          )`,
          opacity: visualFilter.vignette.params.intensity,
        }
      : { display: 'none' };

  const OVERLAY: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 10,
  };

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', ...style }}>
      {children}

      {/* Scanlines — CSS repeating-gradient */}
      <div style={{ ...OVERLAY, ...scanlinesStyle }} aria-hidden="true" />

      {/* Vignette — CSS radial-gradient */}
      <div style={{ ...OVERLAY, ...vignetteStyle }} aria-hidden="true" />

      {/* Film grain — Canvas 2D, blend-mode screen */}
      <canvas
        ref={grainCanvasRef}
        style={{
          ...OVERLAY,
          mixBlendMode: 'screen',
          display: isOn && visualFilter?.filmGrain.enabled ? 'block' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Dither — Canvas 2D, blend-mode multiply */}
      <canvas
        ref={ditherCanvasRef}
        style={{
          ...OVERLAY,
          mixBlendMode: 'multiply',
          display: isOn && visualFilter?.dither.enabled ? 'block' : 'none',
        }}
        aria-hidden="true"
      />

      {/* CRT overlay — div CSS (box-shadow + filter + flicker) */}
      <div
        ref={crtOverlayRef}
        style={{
          ...OVERLAY,
          display: isOn && visualFilter?.crt.enabled ? 'block' : 'none',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
