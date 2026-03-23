/**
 * BgRemovalDialog — Dialog de suppression de fond d'image
 *
 * Phase 1 — Suppression initiale :
 *   - Mode IA (ISNet fp16 ONNX WebGPU, ~80 MB, 2-5 sec)
 *   - Mode Baguette magique (chroma-key flood-fill, instantané, clic + tolérance)
 *
 * Phase 2 — Corrections par pinceau (style Word "Mark areas to keep/remove") :
 *   - Pinceau Vert "Conserver" : restaure les zones incorrectement effacées
 *   - Pinceau Rouge "Effacer"  : efface les zones incorrectement conservées
 *   - Ctrl+Z (20 niveaux), slider taille, clic droit = outil inverse
 *
 * @module components/ui/BgRemovalDialog
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Cpu, Loader2, RotateCcw, Check, ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  removeBackgroundAI,
  removeBackgroundChromaKey,
  blobToDataURL,
  imageUrlToBlob,
  type AiProgressCallback,
} from '@/utils/backgroundRemoval';
import { BrushMaskCanvas } from '@/components/ui/BrushMaskCanvas';
import type { BrushMaskCanvasHandle } from '@/components/ui/BrushMaskCanvas';

// ── Types ──────────────────────────────────────────────────────────────────

type Mode = 'ai' | 'chroma' | 'manual';

export interface BgRemovalDialogProps {
  /** URL de l'image à traiter */
  imageUrl: string;
  /** Nom de fichier original (affiché dans le titre) */
  imageName: string;
  /** Callback quand l'utilisateur confirme — reçoit le Blob PNG résultant */
  onSave: (blob: Blob) => void;
  /** Callback de fermeture */
  onClose: () => void;
}

// ── Damier CSS pour la transparence ───────────────────────────────────────

const CHECKERBOARD = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23555'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23555'/%3E%3Crect x='8' width='8' height='8' fill='%23333'/%3E%3Crect y='8' width='8' height='8' fill='%23333'/%3E%3C/svg%3E")`;

// ── Composant ──────────────────────────────────────────────────────────────

export function BgRemovalDialog({ imageUrl, imageName, onSave, onClose }: BgRemovalDialogProps) {
  // ── State phase 1 ──────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('ai');
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(30);
  // Progression du téléchargement du modèle IA (null = pas en cours)
  const [aiProgress, setAiProgress] = useState<{ stage: string; pct: number } | null>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);

  // ── State phase 2 ──────────────────────────────────────────────────────
  const brushRef = useRef<BrushMaskCanvasHandle>(null);
  const [saving, setSaving] = useState(false);
  // Phase 2 uniquement si l'utilisateur clique "Corrections…" explicitement
  const [correctionPhase, setCorrectionPhase] = useState(false);

  const isCorrection = correctionPhase && resultBlob !== null && !processing;

  // ── Handlers phase 1 ───────────────────────────────────────────────────

  const resetToPhase1 = useCallback(() => {
    setResultBlob(null);
    setResultDataUrl(null);
    setError(null);
    setCorrectionPhase(false);
  }, []);

  const handleRunAI = useCallback(async () => {
    setProcessing(true);
    setError(null);
    setResultBlob(null);
    setResultDataUrl(null);
    setAiProgress(null);

    const onProgress: AiProgressCallback = (stage, current, total) => {
      const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
      const label = stage.startsWith('fetch:') ? stage.replace('fetch:', '') : stage;
      setAiProgress({ stage: label, pct });
    };

    try {
      const blob = await removeBackgroundAI(imageUrl, onProgress);
      const dataUrl = await blobToDataURL(blob);
      setResultBlob(blob);
      setResultDataUrl(dataUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      // Erreur réseau → message actionnable avec fallback suggéré
      const isNetworkError =
        msg.toLowerCase().includes('fetch') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('metadata not found');
      setError(
        isNetworkError
          ? 'Téléchargement du modèle impossible (~80 MB via CDN). Vérifiez votre connexion internet, ou utilisez la Baguette Magique ✨ qui fonctionne hors-ligne.'
          : msg
      );
    } finally {
      setProcessing(false);
      setAiProgress(null);
    }
  }, [imageUrl]);

  const handleChromaClick = useCallback(
    async (e: React.MouseEvent<HTMLImageElement>) => {
      if (mode !== 'chroma' || processing) return;
      const img = previewImgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();

      // Letterbox correction : objectFit:contain sur <img> → même décalage que sur canvas.
      // getBoundingClientRect() retourne la boîte CSS entière, pas la zone image.
      const naturalAspect = img.naturalWidth / img.naturalHeight;
      const displayAspect = rect.width / rect.height;
      let imageW: number, imageH: number, imageLeft: number, imageTop: number;
      if (naturalAspect > displayAspect) {
        imageW = rect.width;
        imageH = rect.width / naturalAspect;
        imageLeft = 0;
        imageTop = (rect.height - imageH) / 2;
      } else {
        imageH = rect.height;
        imageW = rect.height * naturalAspect;
        imageLeft = (rect.width - imageW) / 2;
        imageTop = 0;
      }

      const clickX = e.clientX - rect.left - imageLeft;
      const clickY = e.clientY - rect.top - imageTop;
      // Ignorer les clics dans les bandes letterbox
      if (clickX < 0 || clickX > imageW || clickY < 0 || clickY > imageH) return;

      setProcessing(true);
      setError(null);
      try {
        const blob = await removeBackgroundChromaKey(
          imageUrl,
          clickX,
          clickY,
          imageW,
          imageH,
          tolerance
        );
        const dataUrl = await blobToDataURL(blob);
        setResultBlob(blob);
        setResultDataUrl(dataUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setProcessing(false);
      }
    },
    [mode, imageUrl, tolerance, processing]
  );

  // Changer de mode : reset systématique + chargement immédiat en mode manuel
  useEffect(() => {
    setResultBlob(null);
    setResultDataUrl(null);
    setError(null);
    setCorrectionPhase(false);
    setAiProgress(null);

    if (mode !== 'manual') return;

    // Mode manuel : charger l'original comme point de départ de Phase 2
    let cancelled = false;
    setProcessing(true);

    (async () => {
      try {
        const blob = await imageUrlToBlob(imageUrl);
        if (cancelled) return;
        const dataUrl = await blobToDataURL(blob);
        if (cancelled) return;
        setResultBlob(blob);
        setResultDataUrl(dataUrl);
        setCorrectionPhase(true);
      } catch {
        if (!cancelled) setError("Impossible de charger l'image originale");
      } finally {
        if (!cancelled) setProcessing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, imageUrl]);

  // ── Handler phase 2 : Enregistrer ─────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!brushRef.current) return;
    setSaving(true);
    try {
      const correctedBlob = await brushRef.current.getCorrectedBlob();
      onSave(correctedBlob);
      onClose();
    } catch (err) {
      console.error('[BgRemovalDialog] save error:', err);
    } finally {
      setSaving(false);
    }
  }, [onSave, onClose]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1400,
          }}
        />

        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // ✅ height fixe — évite "shrinks to content" anti-pattern
            width: 'min(94vw, 900px)',
            height: 'min(90vh, 720px)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 16,
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            zIndex: 1401,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 18px',
              borderBottom: '1px solid var(--color-border-base)',
              flexShrink: 0,
            }}
          >
            <Wand2 size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
              Supprimer le fond
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {imageName}
            </span>

            {/* Phase badge */}
            <AnimatePresence mode="wait">
              {isCorrection ? (
                <motion.span
                  key="phase2"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    background: 'rgba(16,185,129,0.15)',
                    color: '#10b981',
                    borderRadius: 20,
                    border: '1px solid rgba(16,185,129,0.3)',
                  }}
                >
                  <Pencil size={10} />
                  Corrections
                </motion.span>
              ) : (
                <motion.span
                  key="phase1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    background: 'rgba(139,92,246,0.12)',
                    color: 'var(--color-primary)',
                    borderRadius: 20,
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  Suppression initiale
                </motion.span>
              )}
            </AnimatePresence>

            {/* Mode toggle — masqué en phase 2 */}
            {!isCorrection && (
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: 4,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: 3,
                }}
              >
                {(
                  [
                    { id: 'ai' as Mode, label: 'IA', icon: <Cpu size={12} /> },
                    { id: 'chroma' as Mode, label: 'Baguette ✨', icon: <Wand2 size={12} /> },
                    { id: 'manual' as Mode, label: 'Manuel ✏️', icon: <Pencil size={12} /> },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: mode === m.id ? 'var(--color-primary)' : 'transparent',
                      color: mode === m.id ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>
            )}
            {isCorrection && <div style={{ marginLeft: 'auto' }} />}

            <Dialog.Close asChild>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 4,
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </Dialog.Close>
          </div>

          {/* ── Body ─────────────────────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <AnimatePresence mode="wait">
              {/* ─── PHASE 2 : BrushMaskCanvas ─────────────────────────── */}
              {isCorrection && resultBlob ? (
                <motion.div
                  key="phase2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                  <BrushMaskCanvas ref={brushRef} originalUrl={imageUrl} resultBlob={resultBlob} />
                </motion.div>
              ) : (
                /* ─── PHASE 1 : Suppression initiale ──────────────────── */
                <motion.div
                  key="phase1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    overflow: 'auto',
                  }}
                >
                  {/* Mode info */}
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(139,92,246,0.08)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      flexShrink: 0,
                    }}
                  >
                    {mode === 'ai' ? (
                      <>
                        <strong style={{ color: 'var(--color-text-secondary)' }}>Mode IA</strong> —
                        Utilise ISNet (ONNX + WebGPU). Idéal pour fonds complexes, photos,
                        illustrations. Le modèle (~80 MB) est téléchargé une seule fois et mis en
                        cache.
                      </>
                    ) : mode === 'chroma' ? (
                      <>
                        <strong style={{ color: 'var(--color-text-secondary)' }}>
                          Baguette magique
                        </strong>{' '}
                        — Cliquez sur la couleur du fond dans l'aperçu gauche pour l'effacer. Réglez
                        la tolérance si des pixels restent ou sont éliminés par erreur.
                        <strong style={{ color: 'var(--color-text-secondary)' }}>
                          {' '}
                          Après ça, vous pourrez corriger au pinceau.
                        </strong>
                      </>
                    ) : null}
                  </div>

                  {/* Tolérance (chroma) */}
                  {mode === 'chroma' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span
                        style={{ fontSize: 12, color: 'var(--color-text-muted)', minWidth: 88 }}
                      >
                        Tolérance : {tolerance}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={tolerance}
                        onChange={(e) => {
                          setTolerance(Number(e.target.value));
                          resetToPhase1();
                        }}
                        style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                      />
                      <span
                        style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 46 }}
                      >
                        {tolerance < 20 ? 'Précis' : tolerance > 60 ? 'Large' : 'Normal'}
                      </span>
                    </div>
                  )}

                  {/* Before / After */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    {/* Original */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}
                      >
                        Original
                        {mode === 'chroma' && !processing && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontWeight: 400,
                              color: 'var(--color-primary)',
                            }}
                          >
                            ← cliquez sur le fond
                          </span>
                        )}
                      </p>
                      <div
                        style={{
                          flex: 1,
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: `2px solid ${mode === 'chroma' ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                          background: '#1a1a2e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: mode === 'chroma' && !processing ? 'crosshair' : 'default',
                          position: 'relative',
                        }}
                      >
                        <img
                          ref={previewImgRef}
                          src={imageUrl}
                          alt="Original"
                          onClick={handleChromaClick}
                          draggable={false}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            userSelect: 'none',
                          }}
                        />
                        {mode === 'chroma' && !processing && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(139,92,246,0.05)',
                              pointerEvents: 'none',
                            }}
                          >
                            <Wand2 size={32} style={{ color: 'rgba(139,92,246,0.2)' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Résultat */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}
                      >
                        Résultat
                        {resultDataUrl && (
                          <span style={{ marginLeft: 6, fontWeight: 400, color: '#10b981' }}>
                            → cliquez "Corrections" pour affiner
                          </span>
                        )}
                      </p>
                      <div
                        style={{
                          flex: 1,
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: `2px solid ${resultDataUrl ? 'var(--color-success)' : 'var(--color-border-base)'}`,
                          backgroundImage: CHECKERBOARD,
                          backgroundSize: '16px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {processing ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 10,
                                color: 'var(--color-text-muted)',
                                width: '80%',
                              }}
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              >
                                <Loader2
                                  size={28}
                                  style={{ color: 'var(--color-primary)', display: 'block' }}
                                />
                              </motion.div>
                              <span style={{ fontSize: 12 }}>
                                {mode === 'ai' ? 'Traitement IA en cours…' : 'Analyse du fond…'}
                              </span>
                              {/* Barre de progression téléchargement modèle */}
                              {mode === 'ai' && aiProgress && (
                                <div
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontSize: 10,
                                      color: 'var(--color-text-muted)',
                                    }}
                                  >
                                    <span>{aiProgress.stage}</span>
                                    <span>{aiProgress.pct}%</span>
                                  </div>
                                  <div
                                    style={{
                                      height: 4,
                                      borderRadius: 2,
                                      background: 'rgba(139,92,246,0.2)',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <motion.div
                                      animate={{ width: `${aiProgress.pct}%` }}
                                      transition={{ ease: 'linear', duration: 0.3 }}
                                      style={{
                                        height: '100%',
                                        background: 'var(--color-primary)',
                                        borderRadius: 2,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {mode === 'ai' && !aiProgress && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--color-text-muted)',
                                    textAlign: 'center',
                                    maxWidth: 130,
                                  }}
                                >
                                  1ère utilisation : téléchargement du modèle (~80 MB)
                                </span>
                              )}
                            </motion.div>
                          ) : resultDataUrl ? (
                            <motion.img
                              key="result"
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              src={resultDataUrl}
                              alt="Résultat"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: 'block',
                              }}
                            />
                          ) : error ? (
                            <motion.div
                              key="error"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{
                                padding: 16,
                                textAlign: 'center',
                                fontSize: 12,
                                color: 'var(--color-danger)',
                              }}
                            >
                              ⚠️ {error}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                                color: 'var(--color-text-muted)',
                                fontSize: 12,
                                textAlign: 'center',
                                padding: 16,
                              }}
                            >
                              {mode === 'ai' ? (
                                <>
                                  <Cpu size={24} style={{ opacity: 0.4 }} />
                                  <span>Cliquez "Lancer l'IA" pour traiter</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 size={24} style={{ opacity: 0.4 }} />
                                  <span>Cliquez sur la couleur du fond à gauche</span>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderTop: '1px solid var(--color-border-base)',
              flexShrink: 0,
            }}
          >
            {/* Phase 2 : bouton "Recommencer" / "Changer de mode" */}
            {isCorrection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={mode === 'manual' ? () => setMode('ai') : resetToPhase1}
                style={{ marginRight: 'auto' }}
              >
                <ArrowLeft size={13} style={{ marginRight: 4 }} />
                {mode === 'manual' ? 'Changer de mode' : 'Recommencer'}
              </Button>
            )}

            {/* Phase 1 : bouton lancer IA */}
            {!isCorrection && mode === 'ai' && !processing && (
              <Button
                variant="default"
                size="sm"
                onClick={handleRunAI}
                style={{ marginRight: 'auto' }}
              >
                <Cpu size={13} style={{ marginRight: 4 }} />
                Lancer l'IA
              </Button>
            )}

            {/* Phase 1 : réinitialiser si résultat en erreur */}
            {!isCorrection && error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToPhase1}
                style={{ marginRight: 'auto' }}
              >
                <RotateCcw size={13} style={{ marginRight: 4 }} />
                Réinitialiser
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={onClose}>
              Annuler
            </Button>

            {/* Phase 1 → passer en corrections (actif dès qu'un résultat est dispo) */}
            {!isCorrection && resultDataUrl && !processing && (
              <Button
                size="sm"
                onClick={() => setCorrectionPhase(true)}
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                <Pencil size={13} style={{ marginRight: 4 }} />
                Corrections ✏️
              </Button>
            )}

            {/* Phase 2 : enregistrer avec corrections */}
            {isCorrection && (
              <Button
                size="sm"
                disabled={saving}
                onClick={handleSave}
                style={{ background: 'var(--color-success)', color: '#fff' }}
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Loader2 size={13} style={{ display: 'block', marginRight: 4 }} />
                  </motion.div>
                ) : (
                  <Check size={13} style={{ marginRight: 4 }} />
                )}
                Enregistrer
              </Button>
            )}

            {/* Phase 1 : enregistrer sans corrections (si résultat disponible) */}
            {!isCorrection && resultDataUrl && !processing && (
              <Button
                size="sm"
                onClick={async () => {
                  if (resultBlob) {
                    onSave(resultBlob);
                    onClose();
                  }
                }}
                variant="ghost"
                style={{ border: '1px solid var(--color-border-base)' }}
              >
                <Check size={13} style={{ marginRight: 4 }} />
                Enregistrer sans retouche
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
