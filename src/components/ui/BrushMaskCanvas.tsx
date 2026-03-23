/**
 * BrushMaskCanvas — Éditeur de correction par pinceau (style Word "Mark areas to keep/remove")
 *
 * Deux canvas stackés :
 * 1. Canvas résultat : affiche la composition actuelle (résultat + masques appliqués)
 * 2. Canvas overlay  : reçoit les événements pointer, affiche les zones peintes (vert/rouge)
 *
 * Contrôles :
 * - Bouton "Conserver" (vert)  + clic droit = outil inverse
 * - Bouton "Effacer" (rouge)
 * - Slider taille de pinceau
 * - Ctrl+Z : annuler (20 niveaux d'historique)
 * - Bouton réinitialiser les corrections
 *
 * Accès impératif via ref :
 *   const ref = useRef<BrushMaskCanvasHandle>(null);
 *   await ref.current.getCorrectedBlob(); // → Blob PNG
 *
 * @module components/ui/BrushMaskCanvas
 */

import { forwardRef, useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { Undo2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createEmptyMasks,
  cloneMasks,
  paintStroke,
  applyMasks,
  renderMaskOverlay,
  type BrushMode,
  type BrushMasks,
} from '@/utils/brushMask';

// ── Types publics ──────────────────────────────────────────────────────────

export interface BrushMaskCanvasProps {
  /** URL ou dataURL de l'image originale (référence) */
  originalUrl: string;
  /** Blob du résultat initial (AI ou chroma-key) */
  resultBlob: Blob;
}

export interface BrushMaskCanvasHandle {
  /** Retourne le Blob PNG avec les corrections appliquées */
  getCorrectedBlob: () => Promise<Blob>;
}

// ── Constantes ─────────────────────────────────────────────────────────────

const MAX_HISTORY = 20;
const CHECKERBOARD = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23555'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23555'/%3E%3Crect x='8' width='8' height='8' fill='%23333'/%3E%3Crect y='8' width='8' height='8' fill='%23333'/%3E%3C/svg%3E")`;

// ── Utilitaires canvas ─────────────────────────────────────────────────────

function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger : ${src}`));
    img.src = src;
  });
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return loadImageFromUrl(url).finally(() => URL.revokeObjectURL(url));
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Conversion Blob échouée'))),
      'image/png'
    );
  });
}

// ── Composant ──────────────────────────────────────────────────────────────

export const BrushMaskCanvas = forwardRef<BrushMaskCanvasHandle, BrushMaskCanvasProps>(
  function BrushMaskCanvas({ originalUrl, resultBlob }, ref) {
    // Canvas refs
    const resultCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ImageData stockées en mémoire (lues une seule fois à l'init)
    const originalDataRef = useRef<ImageData | null>(null);
    const resultDataRef = useRef<ImageData | null>(null);
    const naturalSizeRef = useRef({ w: 0, h: 0 });

    // State UI
    const [brushMode, setBrushMode] = useState<BrushMode>('keep');
    const [brushSize, setBrushSize] = useState(20); // en pixels image naturels
    const [canUndo, setCanUndo] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const isReadyRef = useRef(false); // accès stable dans l'imperative handle

    // Masques courants (ref pour accès stable dans les handlers pointer)
    const masksRef = useRef<BrushMasks | null>(null);
    const historyRef = useRef<BrushMasks[]>([]);
    const brushModeRef = useRef<BrushMode>('keep');
    const brushSizeRef = useRef(20);

    // Synchroniser les refs avec les states (évite stale closures dans handlers)
    useEffect(() => {
      brushModeRef.current = brushMode;
    }, [brushMode]);
    useEffect(() => {
      brushSizeRef.current = brushSize;
    }, [brushSize]);

    // Suivi du dernier point pour strokeLerp
    const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
    const rafRef = useRef<number>(0);
    const pendingRepaint = useRef(false);

    // ── Init : charger les deux images, créer les canvas ─────────────────

    useEffect(() => {
      let cancelled = false;
      isReadyRef.current = false;
      setIsReady(false);

      async function init() {
        const [imgOrig, imgResult] = await Promise.all([
          loadImageFromUrl(originalUrl),
          loadImageFromBlob(resultBlob),
        ]);
        if (cancelled) return;

        const w = imgOrig.naturalWidth;
        const h = imgOrig.naturalHeight;
        naturalSizeRef.current = { w, h };

        // Lire les ImageData une seule fois
        const offOrig = document.createElement('canvas');
        offOrig.width = w;
        offOrig.height = h;
        const ctxOrig = offOrig.getContext('2d')!;
        ctxOrig.drawImage(imgOrig, 0, 0);
        originalDataRef.current = ctxOrig.getImageData(0, 0, w, h);

        const offResult = document.createElement('canvas');
        offResult.width = w;
        offResult.height = h;
        const ctxResult = offResult.getContext('2d')!;
        ctxResult.drawImage(imgResult, 0, 0);
        resultDataRef.current = ctxResult.getImageData(0, 0, w, h);

        // Configurer les canvas affichés
        for (const canvasRef of [resultCanvasRef, overlayCanvasRef]) {
          const c = canvasRef.current;
          if (!c) continue;
          c.width = w;
          c.height = h;
          c.style.width = '100%';
          c.style.height = '100%';
          c.style.imageRendering = 'pixelated';
        }

        // Masques vides
        masksRef.current = createEmptyMasks(w, h);
        historyRef.current = [];

        // Affichage initial (résultat sans correction)
        repaintResult();
        isReadyRef.current = true;
        setIsReady(true);
      }

      init().catch(console.error);
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [originalUrl, resultBlob]);

    // ── Repaint du canvas résultat ────────────────────────────────────────

    const repaintResult = useCallback(() => {
      const canvas = resultCanvasRef.current;
      const orig = originalDataRef.current;
      const result = resultDataRef.current;
      const masks = masksRef.current;
      if (!canvas || !orig || !result || !masks) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;

      const corrected = applyMasks(result, orig, masks);
      ctx.putImageData(corrected, 0, 0);
    }, []);

    const repaintOverlay = useCallback(() => {
      const canvas = overlayCanvasRef.current;
      const masks = masksRef.current;
      if (!canvas || !masks) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderMaskOverlay(ctx, masks);
    }, []);

    const scheduleRepaint = useCallback(() => {
      if (pendingRepaint.current) return;
      pendingRepaint.current = true;
      rafRef.current = requestAnimationFrame(() => {
        pendingRepaint.current = false;
        repaintResult();
        repaintOverlay();
      });
    }, [repaintResult, repaintOverlay]);

    // ── Pointer → coordonnées image ───────────────────────────────────────

    const toImageCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }, []);

    // ── Pointer handlers ──────────────────────────────────────────────────

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);

        // Clic droit = outil inverse
        const mode: BrushMode =
          e.button === 2
            ? brushModeRef.current === 'keep'
              ? 'remove'
              : 'keep'
            : brushModeRef.current;

        if (!masksRef.current) return;

        // Sauvegarder un snapshot pour l'historique d'annulation
        const snapshot = cloneMasks(masksRef.current);
        historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), snapshot];
        setCanUndo(true);

        const pos = toImageCoords(e);
        lastPointerRef.current = pos;

        // Premier point
        paintStroke(masksRef.current, pos, pos, brushSizeRef.current, mode, 1);
        scheduleRepaint();
      },
      [toImageCoords, scheduleRepaint]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if ((e.buttons & 1) === 0 && (e.buttons & 2) === 0) return; // pas de bouton enfoncé

        const mode: BrushMode =
          e.buttons & 2
            ? brushModeRef.current === 'keep'
              ? 'remove'
              : 'keep'
            : brushModeRef.current;

        if (!masksRef.current) return;

        const pos = toImageCoords(e);
        const last = lastPointerRef.current ?? pos;
        lastPointerRef.current = pos;

        paintStroke(masksRef.current, last, pos, brushSizeRef.current, mode, 12);
        scheduleRepaint();
      },
      [toImageCoords, scheduleRepaint]
    );

    const handlePointerUp = useCallback(() => {
      lastPointerRef.current = null;
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault(); // bloquer le menu contextuel navigateur
    }, []);

    // ── Undo ──────────────────────────────────────────────────────────────

    const handleUndo = useCallback(() => {
      const hist = historyRef.current;
      if (hist.length === 0) return;
      masksRef.current = hist[hist.length - 1];
      historyRef.current = hist.slice(0, -1);
      setCanUndo(hist.length > 1);
      scheduleRepaint();
    }, [scheduleRepaint]);

    // Ctrl+Z keyboard
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          handleUndo();
        }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }, [handleUndo]);

    // ── Réinitialiser ─────────────────────────────────────────────────────

    const handleReset = useCallback(() => {
      if (!masksRef.current) return;
      const { width, height } = masksRef.current;
      masksRef.current = createEmptyMasks(width, height);
      historyRef.current = [];
      setCanUndo(false);
      scheduleRepaint();
    }, [scheduleRepaint]);

    // ── Imperative handle ─────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      getCorrectedBlob: () => {
        if (!isReadyRef.current) return Promise.reject(new Error('Canvas non prêt'));
        const canvas = resultCanvasRef.current;
        if (!canvas) return Promise.reject(new Error('Canvas non initialisé'));
        return canvasToBlob(canvas);
      },
    }));

    // ── Cleanup ───────────────────────────────────────────────────────────

    useEffect(() => {
      return () => {
        cancelAnimationFrame(rafRef.current);
      };
    }, []);

    // ── Cursor CSS selon le mode ──────────────────────────────────────────
    const cursorStyle = brushMode === 'keep' ? 'crosshair' : 'cell';

    // ── Render ────────────────────────────────────────────────────────────

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        {/* ── Toolbar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            border: '1px solid var(--color-border-base)',
          }}
        >
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                {
                  mode: 'keep' as BrushMode,
                  label: 'Conserver',
                  color: '#10b981',
                  bg: 'rgba(16,185,129,0.18)',
                },
                {
                  mode: 'remove' as BrushMode,
                  label: 'Effacer',
                  color: '#ef4444',
                  bg: 'rgba(239,68,68,0.18)',
                },
              ] as const
            ).map(({ mode, label, color, bg }) => (
              <motion.button
                key={mode}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setBrushMode(mode)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: `2px solid ${brushMode === mode ? color : 'transparent'}`,
                  background: brushMode === mode ? bg : 'transparent',
                  color: brushMode === mode ? color : 'var(--color-text-muted)',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
                {label}
              </motion.button>
            ))}
          </div>

          {/* Brush size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 140 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              Pinceau {brushSize}px
            </span>
            <input
              type="range"
              min={4}
              max={80}
              step={2}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: brushMode === 'keep' ? '#10b981' : '#ef4444' }}
            />
          </div>

          {/* Undo + Reset */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            <Button
              size="sm"
              variant="ghost"
              disabled={!canUndo}
              onClick={handleUndo}
              title="Annuler (Ctrl+Z)"
              style={{ height: 28, padding: '0 8px', fontSize: 11 }}
            >
              <Undo2 size={13} style={{ marginRight: 4 }} />
              Annuler
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              title="Réinitialiser toutes les corrections"
              style={{ height: 28, padding: '0 8px', fontSize: 11 }}
            >
              <RotateCcw size={12} style={{ marginRight: 4 }} />
              Reset
            </Button>
          </div>
        </div>

        {/* ── Légende ── */}
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            padding: '0 4px',
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>●</span> Vert : zone à conserver
            (clic gauche en mode "Conserver")
          </span>
          <span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>●</span> Rouge : zone à effacer
            (clic gauche en mode "Effacer")
          </span>
          <span style={{ opacity: 0.6 }}>Clic droit = outil inverse · Ctrl+Z = annuler</span>
        </div>

        {/* ── Canvas zone ── */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            backgroundImage: CHECKERBOARD,
            backgroundSize: '16px 16px',
            border: '2px solid var(--color-border-base)',
            // Curseur personnalisé selon le mode
            cursor: isReady ? cursorStyle : 'wait',
          }}
        >
          {/* Canvas 1 : résultat composité */}
          <canvas
            ref={resultCanvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
          />

          {/* Canvas 2 : overlay pinceau — intercepte les événements pointer */}
          <canvas
            ref={overlayCanvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              opacity: 0.85,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onContextMenu={handleContextMenu}
          />

          {/* Indicateur de chargement */}
          {!isReady && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
                color: 'var(--color-text-muted)',
                fontSize: 13,
              }}
            >
              Chargement…
            </div>
          )}

          {/* Indicateur visuel du mode en overlay discret */}
          {isReady && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: brushMode === 'keep' ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)',
                color: '#fff',
                pointerEvents: 'none',
              }}
            >
              {brushMode === 'keep' ? '✓ Conserver' : '✕ Effacer'}
            </div>
          )}
        </div>
      </div>
    );
  }
);
