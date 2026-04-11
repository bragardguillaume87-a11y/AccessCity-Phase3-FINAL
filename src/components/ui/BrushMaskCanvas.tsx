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
import { Undo2, RotateCcw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createEmptyMasks,
  cloneMasks,
  paintStroke,
  applyMasks,
  renderMaskOverlay,
  smartRefineFromSeeds,
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
    const previewCanvasRef = useRef<HTMLCanvasElement>(null); // aperçu temps réel sans overlay
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
    const [isRefining, setIsRefining] = useState(false);
    // Cercle curseur : position + rayon en coordonnées d'affichage (px CSS)
    const [cursor, setCursor] = useState<{ x: number; y: number; r: number } | null>(null);
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
        for (const canvasRef of [resultCanvasRef, overlayCanvasRef, previewCanvasRef]) {
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
      const preview = previewCanvasRef.current;
      const orig = originalDataRef.current;
      const result = resultDataRef.current;
      const masks = masksRef.current;
      if (!canvas || !orig || !result || !masks) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      const corrected = applyMasks(result, orig, masks);
      ctx.putImageData(corrected, 0, 0);

      // Mettre à jour l'aperçu temps réel (sans overlay)
      if (preview) {
        const pCtx = preview.getContext('2d');
        if (pCtx) {
          pCtx.imageSmoothingEnabled = false;
          pCtx.clearRect(0, 0, preview.width, preview.height);
          pCtx.putImageData(corrected, 0, 0);
        }
      }
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
    // IMPORTANT : objectFit:contain sur un canvas crée des bandes letterbox.
    // getBoundingClientRect() retourne le conteneur entier, pas la zone image.
    // Il faut calculer les offsets (imageLeft/imageTop) avant de mapper les coords.

    const toImageCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      const naturalAspect = canvas.width / canvas.height; // ratio de l'image réelle
      const displayAspect = rect.width / rect.height; // ratio du conteneur CSS

      let imageW: number, imageH: number, imageLeft: number, imageTop: number;

      if (naturalAspect > displayAspect) {
        // Image + large que haute → barres en haut et en bas (letterbox vertical)
        imageW = rect.width;
        imageH = rect.width / naturalAspect;
        imageLeft = 0;
        imageTop = (rect.height - imageH) / 2;
      } else {
        // Image + haute que large → barres à gauche et à droite (pillarbox)
        imageH = rect.height;
        imageW = rect.height * naturalAspect;
        imageLeft = (rect.width - imageW) / 2;
        imageTop = 0;
      }

      return {
        x: Math.max(
          0,
          Math.min(canvas.width - 1, (e.clientX - rect.left - imageLeft) * (canvas.width / imageW))
        ),
        y: Math.max(
          0,
          Math.min(canvas.height - 1, (e.clientY - rect.top - imageTop) * (canvas.height / imageH))
        ),
      };
    }, []);

    // ── Curseur visuel : calcule position + rayon en px display ─────────
    // Utilise le même calcul letterbox que toImageCoords, mais dans le sens inverse.

    const updateCursor = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas || naturalSizeRef.current.w === 0) return;
      const rect = canvas.getBoundingClientRect();
      const nw = naturalSizeRef.current.w;
      const nh = naturalSizeRef.current.h;
      const naturalAspect = nw / nh;
      const displayAspect = rect.width / rect.height;
      const imageW = naturalAspect > displayAspect ? rect.width : rect.height * naturalAspect;
      // Scale image→display (px display par px image)
      const scale = imageW / nw;
      setCursor({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: brushSizeRef.current * scale,
      });
    }, []);

    // ── Pointer handlers ──────────────────────────────────────────────────

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
        updateCursor(e);

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
      [toImageCoords, scheduleRepaint, updateCursor]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        updateCursor(e);
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
      [toImageCoords, scheduleRepaint, updateCursor]
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

    // ── Affinement intelligent ────────────────────────────────────────────

    const handleSmartRefine = useCallback(() => {
      const masks = masksRef.current;
      const origData = originalDataRef.current;
      if (!masks || !origData || isRefining) return;

      // Sauvegarder un snapshot annulable
      const snapshot = cloneMasks(masks);
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), snapshot];
      setCanUndo(true);
      setIsRefining(true);

      // Lancer dans une micro-tâche pour laisser React mettre à jour l'UI d'abord
      requestAnimationFrame(() => {
        smartRefineFromSeeds(masks, origData);
        setIsRefining(false);
        scheduleRepaint();
      });
    }, [isRefining, scheduleRepaint]);

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

          {/* Affiner + Undo + Reset */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              disabled={!canUndo || isRefining}
              onClick={handleSmartRefine}
              title="Propager les zones peintes à toute l'image selon les couleurs (style GrabCut)"
              style={{
                height: 28,
                padding: '0 10px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 7,
                cursor: canUndo && !isRefining ? 'pointer' : 'default',
                border: '2px solid rgba(139,92,246,0.5)',
                background: canUndo && !isRefining ? 'rgba(139,92,246,0.18)' : 'transparent',
                color:
                  canUndo && !isRefining ? 'var(--color-primary)' : 'var(--color-text-disabled)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s',
              }}
            >
              <Wand2 size={12} />
              {isRefining ? 'Analyse…' : '✨ Affiner'}
            </motion.button>
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
          <span style={{ opacity: 0.6 }}>
            Clic droit = outil inverse · Ctrl+Z = annuler · ✨ Affiner = propager par couleur
          </span>
        </div>

        {/* ── Canvas zone — layout 2 colonnes ── */}
        <div style={{ flex: 1, display: 'flex', gap: 8, minHeight: 0 }}>
          {/* ── Colonne gauche : zone de pinceau ── */}
          <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                paddingLeft: 2,
              }}
            >
              ✏️ Zone de retouche
            </div>
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
                cursor: isReady ? 'none' : 'wait',
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
                  cursor: isReady ? 'none' : 'wait',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerEnter={updateCursor}
                onPointerLeave={() => setCursor(null)}
                onContextMenu={handleContextMenu}
              />

              {/* Cercle curseur pinceau */}
              {isReady && cursor && (
                <div
                  style={{
                    position: 'absolute',
                    left: cursor.x - cursor.r,
                    top: cursor.y - cursor.r,
                    width: cursor.r * 2,
                    height: cursor.r * 2,
                    borderRadius: '50%',
                    border: `2px solid ${brushMode === 'keep' ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)'}`,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}

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

              {/* Badge mode actif */}
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
                    background:
                      brushMode === 'keep' ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)',
                    color: '#fff',
                    pointerEvents: 'none',
                  }}
                >
                  {brushMode === 'keep' ? '✓ Conserver' : '✕ Effacer'}
                </div>
              )}
            </div>
          </div>

          {/* ── Colonne droite : aperçu résultat temps réel ── */}
          <div
            style={{
              flex: '0 0 calc(45% - 8px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                paddingLeft: 2,
              }}
            >
              👁️ Aperçu résultat
            </div>
            <div
              style={{
                flex: 1,
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                backgroundImage: CHECKERBOARD,
                backgroundSize: '16px 16px',
                border: '2px solid var(--color-border-base)',
              }}
            >
              {/* Canvas aperçu — copie exacte du résultat sans overlay */}
              <canvas
                ref={previewCanvasRef}
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

              {/* Placeholder tant que non prêt */}
              {!isReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: 12,
                  }}
                >
                  Chargement…
                </div>
              )}

              {/* Badge "Aperçu en direct" */}
              {isReady && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    padding: '2px 7px',
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    background: 'rgba(0,0,0,0.6)',
                    color: 'rgba(255,255,255,0.7)',
                    pointerEvents: 'none',
                  }}
                >
                  ⚡ En direct
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
