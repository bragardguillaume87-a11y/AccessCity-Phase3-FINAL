/**
 * SpriteImportDialog — Configuration d'un spritesheet de personnage/monstre
 *
 * UX v3 — Nintendo UX, maximum screen space.
 *
 * Fonctionnalités :
 * - Zoom/pan spritesheet via react-zoom-pan-pinch (panning désactivé en mode sélection)
 * - Clic sur numéro de rangée → assigne toute la rangée à la direction active
 * - Drag frame-level contraint à la rangée courante
 * - Mini-canvas animée par direction (aperçu live dans la liste)
 * - Détection miroir : propose flipX pour la direction horizontale opposée
 * - Barre de progression globale (toutes animations, tous groupes)
 * - Célébration quand un groupe est entièrement configuré
 * - Modes lecture : avant / ping-pong + pause/play
 * - Raccourcis clavier : Tab (direction suivante), 1-4 (onglets), Espace (pause)
 * - Auto-détection rangées : propose l'assignation automatique si N rangées = N directions
 *
 * Dépendances open source :
 * - react-zoom-pan-pinch : zoom/pan CSS transform (déjà dans package.json)
 * - Excalibur.js flipHorizontal : appliqué dans GameScene via AnimationRange.flipX
 *
 * @module components/modules/TopdownEditor/SpriteImportDialog
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { Grid3X3, Zap, X, Play, Pause, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import {
  SPRITE_CATEGORIES,
  SPRITE_ANIM_GROUPS,
  LPC_PRESET,
} from '@/types/sprite';
import type { SpriteSheetConfig, SpriteAnimationTag, AnimationRange, SpriteAnimGroupId } from '@/types/sprite';
import {
  SPRITE_DIR_COLORS,
  SPRITE_PREVIEW_CANVAS_SIZE,
  SPRITE_MINI_CANVAS_SIZE,
} from '@/config/mapEditorConfig';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SpriteImportDialogProps {
  isOpen: boolean;
  imageSrc: string;
  imagePath: string;
  imageName?: string;
  initialConfig?: SpriteSheetConfig;
  onConfirm: (imagePath: string, config: SpriteSheetConfig) => void;
  onCancel: () => void;
}

type AnimState = Partial<Record<SpriteAnimationTag, AnimationRange>>;

interface MirrorProposal {
  source: SpriteAnimationTag;
  target: SpriteAnimationTag;
  sourceRange: AnimationRange;
}

// ── Constants (source unique : mapEditorConfig) ────────────────────────────

const DIR_COLORS = SPRITE_DIR_COLORS;

/** Total d'animations possibles sur tous les groupes — dérivé de SPRITE_ANIM_GROUPS */
const TOTAL_POSSIBLE_ANIMS = SPRITE_ANIM_GROUPS.reduce((acc, g) => acc + g.tags.length, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRange(start: number, end: number): string {
  const count = end - start + 1;
  return `fr ${start}–${end} (${count} fr)`;
}

/**
 * Dérive la direction miroir (horizontale) depuis le nom du tag.
 * Basé sur la convention de nommage : _left ↔ _right (pas de hardcode de table).
 */
function getMirrorTag(tag: SpriteAnimationTag): SpriteAnimationTag | null {
  if (tag.endsWith('_left'))  return tag.replace(/_left$/, '_right') as SpriteAnimationTag;
  if (tag.endsWith('_right')) return tag.replace(/_right$/, '_left') as SpriteAnimationTag;
  return null;
}

/** Trouve le label de direction pour un tag donné, depuis SPRITE_ANIM_GROUPS */
function getDirLabel(tag: SpriteAnimationTag): string {
  for (const g of SPRITE_ANIM_GROUPS) {
    const idx = g.tags.indexOf(tag);
    if (idx >= 0) return g.dirs[idx];
  }
  return tag;
}

/** Dessine un frame (avec flipX optionnel) sur un canvas 2D */
function drawFrameOnCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  frameIdx: number,
  cols: number,
  frameW: number,
  frameH: number,
  flipX = false,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const col = frameIdx % Math.max(1, cols);
  const row = Math.floor(frameIdx / Math.max(1, cols));
  if (flipX) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, canvas.width, canvas.height);
  }
}

// ── ZoomControls — doit être enfant de TransformWrapper pour useControls ─────

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
      <button onClick={() => zoomOut(0.5)} style={zoomBtnStyle} title="Zoom arrière (−)">
        <ZoomOut size={12} />
      </button>
      <button onClick={() => resetTransform()} style={{ ...zoomBtnStyle, padding: '3px 7px', fontSize: 10 }} title="Réinitialiser le zoom">
        ×1
      </button>
      <button onClick={() => zoomIn(0.5)} style={zoomBtnStyle} title="Zoom avant (+)">
        <ZoomIn size={12} />
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpriteImportDialog({
  isOpen,
  imageSrc,
  imagePath,
  imageName,
  initialConfig,
  onConfirm,
  onCancel,
}: SpriteImportDialogProps) {

  // ── Config state ───────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(initialConfig?.displayName ?? imageName ?? '');
  const [category,    setCategory]    = useState<string>(initialConfig?.category ?? 'hero');
  const [frameW,      setFrameW]      = useState(initialConfig?.frameW ?? 64);
  const [frameH,      setFrameH]      = useState(initialConfig?.frameH ?? 64);
  const [cols,        setCols]        = useState(initialConfig?.cols ?? 1);
  const [rows,        setRows]        = useState(initialConfig?.rows ?? 1);
  const [animations,  setAnimations]  = useState<AnimState>(initialConfig?.animations ?? {});
  const [activeTab,   setActiveTab]   = useState<SpriteAnimGroupId>('walk');

  // ── UX state ───────────────────────────────────────────────────────────────
  const [imgSize,        setImgSize]        = useState<{ w: number; h: number } | null>(null);
  const [activeTag,      setActiveTag]      = useState<SpriteAnimationTag | null>(null);
  const [showLpcCard,    setShowLpcCard]    = useState(false);
  const [hoveredFrame,   setHoveredFrame]   = useState<number | null>(null);
  const [hoveredRow,     setHoveredRow]     = useState<number | null>(null);
  const [mirrorProposal, setMirrorProposal] = useState<MirrorProposal | null>(null);
  const [justCompleted,  setJustCompleted]  = useState<SpriteAnimGroupId | null>(null);

  // ── Preview state ──────────────────────────────────────────────────────────
  const [isPlaying,  setIsPlaying]  = useState(true);
  const [loopMode,   setLoopMode]   = useState<'forward' | 'pingpong'>('forward');

  // ── Drag state ─────────────────────────────────────────────────────────────
  const [dragStart,  setDragStart]  = useState<number | null>(null);
  const [dragEnd,    setDragEnd]    = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragRowRef    = useRef<number | null>(null);

  // ── Stable refs for global handlers ───────────────────────────────────────
  const latestRef = useRef({ dragStart, dragEnd, activeTag, cols });
  latestRef.current = { dragStart, dragEnd, activeTag, cols };

  const latestAnimsRef = useRef(animations);
  latestAnimsRef.current = animations;

  // ── Animation refs ─────────────────────────────────────────────────────────
  const animCanvasRef  = useRef<HTMLCanvasElement>(null);
  const loadedImgRef   = useRef<HTMLImageElement | null>(null);
  const animFrameRef   = useRef(0);

  // Mini-canvas refs — une par tag de l'onglet actif
  const miniCanvasRefs = useRef<Partial<Record<SpriteAnimationTag, HTMLCanvasElement | null>>>({});

  // Celebration completion tracking
  const prevCompletedRef = useRef<Partial<Record<SpriteAnimGroupId, number>>>({});

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(initialConfig?.displayName ?? imageName ?? '');
    setCategory(initialConfig?.category ?? 'hero');
    setFrameW(initialConfig?.frameW ?? 64);
    setFrameH(initialConfig?.frameH ?? 64);
    setCols(initialConfig?.cols ?? 1);
    setRows(initialConfig?.rows ?? 1);
    setAnimations(initialConfig?.animations ?? {});
    setActiveTab('walk');
    setActiveTag(null);
    setHoveredFrame(null);
    setHoveredRow(null);
    setDragStart(null);
    setDragEnd(null);
    setMirrorProposal(null);
    setJustCompleted(null);
    setIsPlaying(true);
    setLoopMode('forward');
    setShowLpcCard(!initialConfig);
    setImgSize(null);
    loadedImgRef.current = null;
    isDraggingRef.current = false;
    dragRowRef.current = null;
    prevCompletedRef.current = {};
  }, [isOpen, imagePath]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Preload image ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.onload = () => {
      loadedImgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // ── Auto-detect cols/rows ──────────────────────────────────────────────────
  useEffect(() => {
    if (!imgSize) return;
    const autoCols = Math.max(1, Math.floor(imgSize.w / Math.max(1, frameW)));
    const autoRows = Math.max(1, Math.floor(imgSize.h / Math.max(1, frameH)));
    setCols(autoCols);
    setRows(autoRows);
  }, [frameW, frameH, imgSize]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const activeGroup = SPRITE_ANIM_GROUPS.find(g => g.id === activeTab)!;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Tab → direction suivante non configurée
      if (e.key === 'Tab') {
        e.preventDefault();
        const unconfigured = activeGroup.tags.filter(t => !latestAnimsRef.current[t]);
        const next = unconfigured.find(t => t !== latestRef.current.activeTag) ?? unconfigured[0] ?? null;
        setActiveTag(next);
      }
      // Espace → pause/play
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      // 1-4 → onglets
      if (e.key === '1') setActiveTab('walk');
      if (e.key === '2') setActiveTab('idle');
      if (e.key === '3') setActiveTab('run');
      if (e.key === '4') setActiveTab('attack');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, activeGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Célébration quand un groupe est complet ────────────────────────────────
  useEffect(() => {
    const count = activeGroup.tags.filter(t => animations[t]).length;
    const prev  = prevCompletedRef.current[activeTab] ?? 0;
    if (count === activeGroup.tags.length && count > 0 && prev < count) {
      setJustCompleted(activeTab);
      const tid = setTimeout(() => setJustCompleted(null), 2500);
      prevCompletedRef.current = { ...prevCompletedRef.current, [activeTab]: count };
      return () => clearTimeout(tid);
    }
    prevCompletedRef.current = { ...prevCompletedRef.current, [activeTab]: count };
  }, [animations, activeGroup, activeTab]);

  // ── Main preview canvas — draw ─────────────────────────────────────────────
  const previewTag  = (activeTag && animations[activeTag]) ? activeTag
    : activeGroup.tags.find(t => animations[t]) ?? null;
  const previewAnim = previewTag ? animations[previewTag] : null;

  const drawMainCanvas = useCallback(() => {
    const canvas = animCanvasRef.current;
    const img    = loadedImgRef.current;
    if (!canvas || !img || !frameW || !frameH || !cols) return;
    drawFrameOnCanvas(canvas, img, animFrameRef.current, cols, frameW, frameH, previewAnim?.flipX);
  }, [frameW, frameH, cols, previewAnim?.flipX]);

  // Main animation loop
  useEffect(() => {
    if (!previewAnim) return;
    const start = previewAnim.startFrame;
    const count = Math.max(1, previewAnim.endFrame - start + 1);
    const fps   = Math.max(1, previewAnim.fps ?? 10);
    let tick = 0;
    animFrameRef.current = start;
    drawMainCanvas();
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (loopMode === 'pingpong') {
        const half   = count - 1;
        const period = Math.max(1, half * 2);
        const pos    = tick % period;
        animFrameRef.current = start + (pos < count ? pos : period - pos);
      } else {
        animFrameRef.current = start + (tick % count);
      }
      tick++;
      drawMainCanvas();
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [previewAnim, drawMainCanvas, isPlaying, loopMode]);

  useEffect(() => { drawMainCanvas(); }, [drawMainCanvas]);

  // ── Mini-canvas animation loops (une par direction dans l'onglet actif) ───
  useEffect(() => {
    if (!loadedImgRef.current || !imgSize) return;
    const img = loadedImgRef.current;
    const intervals: ReturnType<typeof setInterval>[] = [];

    for (const tag of activeGroup.tags) {
      const anim   = animations[tag];
      const canvas = miniCanvasRefs.current[tag];
      if (!anim || !canvas) continue;

      const { startFrame, endFrame, fps, flipX } = anim;
      const frameCount = Math.max(1, endFrame - startFrame + 1);
      let tick = 0;

      const draw = () => {
        drawFrameOnCanvas(canvas, img, startFrame + (tick % frameCount), cols, frameW, frameH, flipX);
      };

      draw();
      const id = setInterval(() => { tick++; draw(); }, 1000 / Math.max(1, fps));
      intervals.push(id);
    }

    return () => intervals.forEach(clearInterval);
  }, [animations, activeGroup, cols, frameW, frameH, imgSize]);

  // ── Drag / assign range ────────────────────────────────────────────────────
  const assignRange = useCallback((start: number, end: number, tagOverride?: SpriteAnimationTag) => {
    const lo  = Math.min(start, end);
    const hi  = Math.max(start, end);
    const tag = tagOverride ?? latestRef.current.activeTag;
    if (!tag) return;

    setAnimations(prev => {
      const fps     = prev[tag]?.fps ?? 10;
      const updated = { ...prev, [tag]: { startFrame: lo, endFrame: hi, fps } };

      // Proposition miroir — dérivée du nom du tag, pas d'un hardcode
      const mirrorTag = getMirrorTag(tag);
      if (mirrorTag && !updated[mirrorTag]) {
        setMirrorProposal({ source: tag, target: mirrorTag, sourceRange: { startFrame: lo, endFrame: hi, fps } });
      }

      // Auto-avance vers la prochaine direction non configurée
      const next = activeGroup.tags.find(t => t !== tag && !updated[t]);
      setActiveTag(next ?? null);

      return updated;
    });
  }, [activeGroup.tags]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global mouseup — commit drag même si relâché hors du spritesheet
  useEffect(() => {
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const { dragStart: ds, dragEnd: de, activeTag: at } = latestRef.current;
      if (ds !== null && at !== null) assignRange(ds, de ?? ds, at);
      setDragStart(null);
      setDragEnd(null);
      dragRowRef.current = null;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [assignRange]);

  // ── Frame mouse handlers ───────────────────────────────────────────────────
  const handleFrameMouseDown = useCallback((frameIdx: number, e: React.MouseEvent) => {
    if (e.button !== 0 || !activeTag) return;
    e.preventDefault();
    const row = Math.floor(frameIdx / Math.max(1, cols));
    isDraggingRef.current = true;
    dragRowRef.current    = row;
    setDragStart(frameIdx);
    setDragEnd(frameIdx);
  }, [activeTag, cols]);

  const handleFrameMouseEnter = useCallback((frameIdx: number) => {
    setHoveredFrame(frameIdx);
    if (!isDraggingRef.current || dragRowRef.current === null) return;
    const frameRow = Math.floor(frameIdx / Math.max(1, cols));
    const col      = frameIdx % Math.max(1, cols);
    // Contraint à la rangée de départ
    const constrained = frameRow !== dragRowRef.current
      ? dragRowRef.current * cols + col
      : frameIdx;
    setDragEnd(constrained);
  }, [cols]);

  const handleFrameMouseUp = useCallback((frameIdx: number) => {
    if (!isDraggingRef.current || !activeTag || dragStart === null) return;
    isDraggingRef.current = false;
    const col         = frameIdx % Math.max(1, cols);
    const constrained = dragRowRef.current !== null && Math.floor(frameIdx / cols) !== dragRowRef.current
      ? dragRowRef.current * cols + col
      : frameIdx;
    assignRange(dragStart, constrained, activeTag);
    setDragStart(null);
    setDragEnd(null);
    dragRowRef.current = null;
  }, [activeTag, dragStart, cols, assignRange]);

  // ── Row click-to-assign ────────────────────────────────────────────────────
  const handleRowClick = useCallback((rowIdx: number) => {
    if (!activeTag) return;
    const rowStart = rowIdx * cols;
    const rowEnd   = rowIdx * cols + cols - 1;
    assignRange(rowStart, rowEnd, activeTag);
  }, [activeTag, cols, assignRange]);

  // ── Auto-détection rangées ─────────────────────────────────────────────────
  const canAutoDetect = rows === activeGroup.tags.length && rows > 1;
  const handleAutoDetect = useCallback(() => {
    const newAnims: AnimState = { ...animations };
    activeGroup.tags.forEach((tag, i) => {
      const rowStart = i * cols;
      const rowEnd   = (i + 1) * cols - 1;
      newAnims[tag]  = { startFrame: rowStart, endFrame: rowEnd, fps: animations[tag]?.fps ?? 10 };
    });
    setAnimations(newAnims);
    setActiveTag(null);
  }, [activeGroup.tags, cols, animations]);

  // ── Frame classification ───────────────────────────────────────────────────
  const getFrameAssignment = useCallback((frameIdx: number) => {
    for (let i = 0; i < activeGroup.tags.length; i++) {
      const tag  = activeGroup.tags[i];
      const anim = animations[tag];
      if (!anim) continue;
      if (frameIdx >= anim.startFrame && frameIdx <= anim.endFrame) {
        return { tag, dirIdx: i, color: DIR_COLORS[i % DIR_COLORS.length] };
      }
    }
    return null;
  }, [activeGroup.tags, animations]);

  const isInDragRange = (frameIdx: number): boolean => {
    if (dragStart === null || dragEnd === null) return false;
    const lo = Math.min(dragStart, dragEnd);
    const hi = Math.max(dragStart, dragEnd);
    return frameIdx >= lo && frameIdx <= hi;
  };

  const activeTagDirIdx = activeTag ? activeGroup.tags.indexOf(activeTag) : -1;
  const activeTagColor  = activeTagDirIdx >= 0 ? DIR_COLORS[activeTagDirIdx % DIR_COLORS.length] : DIR_COLORS[0];

  // ── Mirror apply ───────────────────────────────────────────────────────────
  const applyMirror = useCallback(() => {
    if (!mirrorProposal) return;
    setAnimations(prev => ({
      ...prev,
      [mirrorProposal.target]: { ...mirrorProposal.sourceRange, flipX: true },
    }));
    setMirrorProposal(null);
  }, [mirrorProposal]);

  // ── LPC preset ────────────────────────────────────────────────────────────
  const applyLpcPreset = () => {
    setFrameW(LPC_PRESET.frameW);
    setFrameH(LPC_PRESET.frameH);
    setAnimations(LPC_PRESET.animations as AnimState);
    setActiveTab('walk');
    setActiveTag(null);
    setShowLpcCard(false);
    setMirrorProposal(null);
  };

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    onConfirm(imagePath, {
      frameW:      Math.max(1, frameW),
      frameH:      Math.max(1, frameH),
      cols,
      rows,
      category,
      displayName: displayName.trim() || undefined,
      animations,
    });
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const configuredCount  = Object.keys(animations).length;
  const totalFrames      = cols * rows;
  const globalProgress   = TOTAL_POSSIBLE_ANIMS > 0 ? configuredCount / TOTAL_POSSIBLE_ANIMS : 0;

  const canvasSize = frameW && frameH
    ? (frameW >= frameH
        ? { w: SPRITE_PREVIEW_CANVAS_SIZE, h: Math.round(SPRITE_PREVIEW_CANVAS_SIZE * frameH / frameW) }
        : { w: Math.round(SPRITE_PREVIEW_CANVAS_SIZE * frameW / frameH), h: SPRITE_PREVIEW_CANVAS_SIZE })
    : { w: SPRITE_PREVIEW_CANVAS_SIZE, h: SPRITE_PREVIEW_CANVAS_SIZE };

  const instructionText = activeTag
    ? `🖱 Glissez sur les frames → ${getDirLabel(activeTag)} · ou cliquez le n° de rangée`
    : rows === 1 && cols > 1
      ? '← Cliquez une direction, puis glissez sur les frames'
      : canAutoDetect
        ? '✨ Cliquez "Détecter" ou sélectionnez une direction'
        : '← Cliquez une direction, puis glissez sur les frames';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        }} />

        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            width: 'min(1360px, 97vw)',
            height: '95vh',
            background: 'var(--color-surface-elevated, #1e1e2e)',
            border: '1px solid var(--color-border-base, rgba(255,255,255,0.12))',
            borderRadius: 14,
            boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onPointerDownOutside={onCancel}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{
            flexShrink: 0,
            padding: '12px 18px 10px',
            borderBottom: '1px solid var(--color-border-base)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {/* Row 1 : titre + infos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Grid3X3 size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <Dialog.Title style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-base)', flex: 1 }}>
                Configurer le sprite
              </Dialog.Title>
              {imageName && (
                <Dialog.Description style={{ margin: 0, fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {imageName}
                </Dialog.Description>
              )}
              {imgSize && (
                <span style={badgeStyle}>{imgSize.w}×{imgSize.h}px</span>
              )}
            </div>

            {/* Row 2 : nom + catégories */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={imageName ?? 'Nom du personnage'}
                style={{ ...textInputStyle, flex: 1, minWidth: 160 }}
              />
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {SPRITE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 9px', borderRadius: 7, cursor: 'pointer',
                    border: category === cat.id ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border-base)',
                    background: category === cat.id ? 'rgba(139,92,246,0.18)' : 'transparent',
                    color: category === cat.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontSize: 12, fontWeight: category === cat.id ? 700 : 400,
                  }}>
                    <span style={{ fontSize: 13 }}>{cat.emoji}</span>{cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3 : barre de progression globale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1, height: 4, borderRadius: 4,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${globalProgress * 100}%`,
                  borderRadius: 4,
                  background: globalProgress === 1
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, var(--color-primary), #a78bfa)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0, minWidth: 56, textAlign: 'right' }}>
                {configuredCount}/{TOTAL_POSSIBLE_ANIMS} anim.
              </span>
            </div>
          </div>

          {/* ── LPC Card ───────────────────────────────────────────────── */}
          {showLpcCard && (
            <div style={{
              flexShrink: 0, margin: '0 18px', marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
              background: 'rgba(139,92,246,0.1)',
              border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: 10,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--color-text-base)' }}>
                  Format LPC détecté ?
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  64×64 px · 4 rangées (↓←→↑) · 9 frames — standard pixel art open source.
                </p>
              </div>
              <button onClick={applyLpcPreset} style={{
                padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: 'none', background: 'var(--color-primary)', color: '#fff', flexShrink: 0,
              }}>
                ✓ Appliquer LPC
              </button>
              <button onClick={() => setShowLpcCard(false)} style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: 'transparent', color: 'var(--color-text-muted)', flexShrink: 0,
              }}>
                Manuel
              </button>
            </div>
          )}

          {/* ── Main area ──────────────────────────────────────────────── */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

            {/* ── LEFT : tabs + spritesheet ──────────────────────────── */}
            <div style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column', gap: 0,
              overflow: 'hidden',
              padding: '10px 0 10px 18px',
            }}>

              {/* Animation tabs */}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginBottom: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                {SPRITE_ANIM_GROUPS.map(g => {
                  const groupConfigured = g.tags.filter(t => animations[t]).length;
                  const isComplete      = groupConfigured === g.tags.length && groupConfigured > 0;
                  const isJustDone      = justCompleted === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => { setActiveTab(g.id); setActiveTag(null); setMirrorProposal(null); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, position: 'relative',
                        padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                        border: activeTab === g.id
                          ? `1.5px solid ${isComplete ? '#22c55e' : 'var(--color-primary)'}`
                          : '1px solid var(--color-border-base)',
                        background: isJustDone
                          ? 'rgba(34,197,94,0.2)'
                          : activeTab === g.id
                            ? isComplete ? 'rgba(34,197,94,0.12)' : 'rgba(139,92,246,0.18)'
                            : 'transparent',
                        color: activeTab === g.id
                          ? isComplete ? '#22c55e' : 'var(--color-primary)'
                          : 'var(--color-text-muted)',
                        fontSize: 12, fontWeight: activeTab === g.id ? 700 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{isComplete ? '✅' : g.emoji}</span>
                      {g.label}
                      <span style={{
                        fontSize: 10,
                        color: isComplete ? '#22c55e' : 'var(--color-primary)',
                        background: isComplete ? 'rgba(34,197,94,0.15)' : 'rgba(139,92,246,0.15)',
                        padding: '1px 5px', borderRadius: 3,
                      }}>
                        {groupConfigured}/{g.tags.length}
                      </span>
                      {/* Dot pour les groupes configurés mais pas actifs */}
                      {groupConfigured > 0 && activeTab !== g.id && (
                        <span style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 7, height: 7, borderRadius: '50%',
                          background: isComplete ? '#22c55e' : 'var(--color-primary)',
                        }} />
                      )}
                    </button>
                  );
                })}

                {/* Séparateur */}
                <div style={{ flex: 1 }} />

                {/* Auto-detect */}
                {canAutoDetect && (
                  <button onClick={handleAutoDetect} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    border: '1px solid rgba(255,200,50,0.5)',
                    background: 'rgba(255,200,50,0.1)', color: '#ffc832',
                  }}>
                    ✨ Détecter les rangées
                  </button>
                )}

                {/* Raccourcis hint */}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', flexShrink: 0, marginRight: 8 }}>
                  Tab · 1-4 · Espace
                </span>
              </div>

              {/* Instruction bar */}
              <div style={{
                flexShrink: 0, marginBottom: 6,
                padding: '5px 11px', borderRadius: 6,
                background: activeTag ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${activeTag ? 'rgba(139,92,246,0.35)' : 'var(--color-border-base)'}`,
                fontSize: 11,
                color: activeTag ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: activeTag ? 700 : 400,
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{instructionText}</span>
              </div>

              {/* Spritesheet avec zoom/pan */}
              <div style={{
                flex: 1, minHeight: 0,
                border: '1px solid var(--color-border-base)',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.5)',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {imgSize && frameW > 0 && frameH > 0 ? (
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={10}
                    panning={{ disabled: activeTag !== null, velocityDisabled: true }}
                    wheel={{ step: 0.3 }}
                  >
                    {/* Zoom controls — doit être enfant de TransformWrapper */}
                    <div style={{
                      position: 'absolute', top: 6, right: 6, zIndex: 20,
                      display: 'flex', gap: 3, alignItems: 'center',
                    }}>
                      <ZoomControls />
                    </div>

                    <TransformComponent
                      wrapperStyle={{ width: '100%', height: '100%', cursor: activeTag ? 'crosshair' : 'grab' }}
                      contentStyle={{ width: '100%' }}
                    >
                      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>

                        {/* Row labels cliquables */}
                        {Array.from({ length: rows }).map((_, rowIdx) => {
                          const isHovered    = hoveredRow === rowIdx;
                          const canClick     = !!activeTag;
                          return (
                            <div
                              key={`lbl-${rowIdx}`}
                              onClick={() => handleRowClick(rowIdx)}
                              onMouseEnter={() => setHoveredRow(rowIdx)}
                              onMouseLeave={() => setHoveredRow(null)}
                              style={{
                                position: 'absolute',
                                left: 2,
                                top: `${(rowIdx / rows) * 100}%`,
                                height: `${(1 / rows) * 100}%`,
                                display: 'flex', alignItems: 'center',
                                zIndex: 15,
                                cursor: canClick ? 'pointer' : 'default',
                                userSelect: 'none',
                              }}
                            >
                              <span style={{
                                fontSize: 9, fontWeight: 700,
                                color: isHovered && canClick
                                  ? activeTagColor.text
                                  : 'rgba(255,255,255,0.35)',
                                background: isHovered && canClick
                                  ? activeTagColor.fill
                                  : 'rgba(0,0,0,0.45)',
                                border: isHovered && canClick
                                  ? `1px solid ${activeTagColor.stroke}`
                                  : '1px solid transparent',
                                padding: '1px 5px', borderRadius: 3,
                                transition: 'all 0.1s',
                              }}>
                                {rowIdx}
                              </span>
                            </div>
                          );
                        })}

                        {/* Spritesheet */}
                        <img
                          src={imageSrc}
                          alt="spritesheet"
                          style={{
                            display: 'block', width: '100%',
                            imageRendering: 'pixelated',
                            userSelect: 'none',
                          }}
                          draggable={false}
                        />

                        {/* Frame cells (positionnement % — scalent avec l'image) */}
                        {Array.from({ length: rows * cols }).map((_, frameIdx) => {
                          const colIdx    = frameIdx % cols;
                          const rowIdx    = Math.floor(frameIdx / cols);
                          const assigned  = getFrameAssignment(frameIdx);
                          const inDrag    = isInDragRange(frameIdx);
                          const isHovered = hoveredFrame === frameIdx && !isDraggingRef.current;

                          const bg = inDrag
                            ? activeTagColor.fill
                            : assigned
                              ? assigned.color.fill
                              : (isHovered && activeTag) ? 'rgba(255,255,255,0.12)' : 'transparent';

                          const border = inDrag
                            ? `1px solid ${activeTagColor.stroke}`
                            : assigned
                              ? `0.5px solid ${assigned.color.stroke}`
                              : `0.5px solid rgba(255,255,255,0.06)`;

                          return (
                            <div
                              key={frameIdx}
                              style={{
                                position: 'absolute',
                                left:   `${(colIdx / cols) * 100}%`,
                                top:    `${(rowIdx / rows) * 100}%`,
                                width:  `${(1 / cols) * 100}%`,
                                height: `${(1 / rows) * 100}%`,
                                boxSizing: 'border-box',
                                background: bg, border,
                                cursor: activeTag ? 'crosshair' : 'default',
                                transition: 'background 0.04s',
                              }}
                              onMouseDown={e  => handleFrameMouseDown(frameIdx, e)}
                              onMouseEnter={() => handleFrameMouseEnter(frameIdx)}
                              onMouseLeave={() => setHoveredFrame(null)}
                              onMouseUp={() => handleFrameMouseUp(frameIdx)}
                            />
                          );
                        })}

                        {/* Badges de direction (label au début de chaque range) */}
                        {activeGroup.tags.map((tag, dirIdx) => {
                          const anim = animations[tag];
                          if (!anim) return null;
                          const startCol = anim.startFrame % cols;
                          const startRow = Math.floor(anim.startFrame / cols);
                          const color    = DIR_COLORS[dirIdx % DIR_COLORS.length];
                          return (
                            <div
                              key={`badge-${tag}`}
                              style={{
                                position: 'absolute',
                                left:   `${(startCol / cols) * 100}%`,
                                top:    `${(startRow / rows) * 100}%`,
                                height: `${(1 / rows) * 100}%`,
                                display: 'flex', alignItems: 'center',
                                paddingLeft: 20, // espace après le label de rangée
                                pointerEvents: 'none', zIndex: 5,
                              }}
                            >
                              <span style={{
                                fontSize: 9, fontWeight: 700, color: color.text,
                                background: 'rgba(0,0,0,0.75)',
                                padding: '1px 4px', borderRadius: 3, whiteSpace: 'nowrap',
                              }}>
                                {activeGroup.dirs[dirIdx]}
                                {anim.flipX ? ' 🪞' : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </TransformComponent>
                  </TransformWrapper>
                ) : (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
                    Chargement…
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT : config + directions + preview ──────────────── */}
            <div style={{
              width: 296, flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '10px 18px',
              borderLeft: '1px solid var(--color-border-base)',
              overflowY: 'auto',
            }}>

              {/* Grille de découpe */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <p style={sectionLabel}>Grille de découpe</p>
                  <button onClick={applyLpcPreset} style={lpcBtnSmall}>
                    <Zap size={9} /> LPC
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <label style={labelRow}>
                    <span style={labelText}>Largeur</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <input type="number" value={frameW} min={1} max={512}
                        onChange={e => setFrameW(Math.max(1, parseInt(e.target.value) || 1))}
                        style={numInput} />
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>px</span>
                    </div>
                  </label>
                  <label style={labelRow}>
                    <span style={labelText}>Hauteur</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <input type="number" value={frameH} min={1} max={512}
                        onChange={e => setFrameH(Math.max(1, parseInt(e.target.value) || 1))}
                        style={numInput} />
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>px</span>
                    </div>
                  </label>
                </div>
                {imgSize && (
                  <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-primary)', fontWeight: 700 }}>
                    → {cols} col × {rows} rg = {totalFrames} frames
                  </p>
                )}
              </div>

              {/* Directions — avec mini-canvas */}
              <div>
                <p style={sectionLabel}>Directions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {activeGroup.tags.map((tag, i) => {
                    const anim     = animations[tag];
                    const isActive = activeTag === tag;
                    const color    = DIR_COLORS[i % DIR_COLORS.length];

                    return (
                      <button
                        key={tag}
                        onClick={() => { setActiveTag(isActive ? null : tag); setMirrorProposal(null); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '7px 9px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          border: isActive
                            ? `2px solid ${color.stroke}`
                            : anim
                              ? `1.5px solid ${color.stroke}55`
                              : '1px solid var(--color-border-base)',
                          background: isActive
                            ? color.fill
                            : anim
                              ? color.fill.replace('0.28', '0.08')
                              : 'transparent',
                          boxShadow: isActive ? `0 0 0 3px ${color.fill}` : 'none',
                          transition: 'all 0.1s',
                          width: '100%', position: 'relative',
                        }}
                      >
                        {/* Mini-canvas animée */}
                        <div style={{
                          width: SPRITE_MINI_CANVAS_SIZE, height: SPRITE_MINI_CANVAS_SIZE,
                          flexShrink: 0, borderRadius: 4, overflow: 'hidden',
                          background: 'rgba(0,0,0,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: anim ? `1px solid ${color.stroke}44` : '1px solid rgba(255,255,255,0.06)',
                        }}>
                          {anim ? (
                            <canvas
                              ref={el => { miniCanvasRefs.current[tag] = el; }}
                              width={SPRITE_MINI_CANVAS_SIZE}
                              height={SPRITE_MINI_CANVAS_SIZE}
                              style={{ display: 'block', imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <span style={{ fontSize: 14, opacity: 0.3 }}>?</span>
                          )}
                        </div>

                        {/* Dot statut */}
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: anim ? color.stroke : 'rgba(255,255,255,0.15)',
                          boxShadow: anim ? `0 0 6px ${color.stroke}` : 'none',
                        }} />

                        {/* Label direction */}
                        <span style={{
                          flex: 1, fontSize: 12,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? color.text : 'var(--color-text-base)',
                        }}>
                          {activeGroup.dirs[i]}
                          {anim?.flipX && (
                            <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>🪞</span>
                          )}
                        </span>

                        {/* Plage de frames */}
                        <span style={{ fontSize: 9, color: anim ? color.text : 'var(--color-text-muted)', flexShrink: 0 }}>
                          {anim ? fmtRange(anim.startFrame, anim.endFrame) : '—'}
                        </span>

                        {/* Bouton effacer */}
                        {anim && (
                          <span
                            role="button"
                            title="Effacer"
                            onClick={e => {
                              e.stopPropagation();
                              setAnimations(prev => {
                                const next = { ...prev };
                                delete next[tag];
                                return next;
                              });
                              setMirrorProposal(null);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 16, height: 16, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.12)',
                              cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            <X size={9} style={{ color: 'rgba(255,255,255,0.65)' }} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proposition miroir */}
              {mirrorProposal && (
                <div style={{
                  padding: '9px 12px', borderRadius: 9,
                  background: 'rgba(167,139,250,0.1)',
                  border: '1.5px solid rgba(167,139,250,0.4)',
                  display: 'flex', flexDirection: 'column', gap: 7,
                }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text-base)' }}>
                    🪞 Miroir détecté
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    {getDirLabel(mirrorProposal.target)} peut être déduit par retournement horizontal de {getDirLabel(mirrorProposal.source)}.
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={applyMirror} style={{
                      flex: 1, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', border: 'none',
                      background: 'var(--color-primary)', color: '#fff',
                    }}>
                      ✓ Appliquer
                    </button>
                    <button onClick={() => setMirrorProposal(null)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      border: '1px solid var(--color-border-base)',
                      background: 'transparent', color: 'var(--color-text-muted)',
                    }}>
                      Ignorer
                    </button>
                  </div>
                </div>
              )}

              {/* FPS slider */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <p style={{ ...sectionLabel, marginBottom: 0, flex: 1 }}>Vitesse d'animation</p>
                  {activeTag && animations[activeTag] && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {animations[activeTag]!.fps} fps
                    </span>
                  )}
                </div>
                {activeTag ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>1</span>
                    <input
                      type="range" min={1} max={60}
                      value={animations[activeTag]?.fps ?? 10}
                      onChange={e => {
                        const fps = parseInt(e.target.value);
                        setAnimations(prev => ({
                          ...prev,
                          [activeTag]: {
                            startFrame: prev[activeTag]?.startFrame ?? 0,
                            endFrame:   prev[activeTag]?.endFrame   ?? 0,
                            fps,
                          },
                        }));
                      }}
                      style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>60</span>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Sélectionnez une direction.
                  </p>
                )}
              </div>

              {/* Preview */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <p style={{ ...sectionLabel, marginBottom: 0 }}>Aperçu en temps réel</p>
                  {previewAnim && (
                    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                      {/* Pause/Play */}
                      <button
                        onClick={() => setIsPlaying(p => !p)}
                        style={{ ...previewCtrlBtn, color: 'var(--color-primary)' }}
                        title={isPlaying ? 'Pause' : 'Lecture'}
                      >
                        {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                      </button>
                      {/* Ping-pong toggle */}
                      <button
                        onClick={() => setLoopMode(m => m === 'forward' ? 'pingpong' : 'forward')}
                        style={{
                          ...previewCtrlBtn,
                          color: loopMode === 'pingpong' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          background: loopMode === 'pingpong' ? 'rgba(139,92,246,0.15)' : 'transparent',
                        }}
                        title="Ping-pong"
                      >
                        <RotateCcw size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {previewAnim ? (
                  <div style={{
                    background: 'rgba(0,0,0,0.45)',
                    border: '1px solid var(--color-border-base)',
                    borderRadius: 10, padding: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                    {/* Damier + canvas */}
                    <div style={{
                      backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%)',
                      backgroundSize: '10px 10px',
                      borderRadius: 6, overflow: 'hidden', display: 'inline-block',
                    }}>
                      <canvas
                        ref={animCanvasRef}
                        width={canvasSize.w}
                        height={canvasSize.h}
                        style={{ display: 'block', imageRendering: 'pixelated' }}
                      />
                    </div>
                    {previewTag && (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {getDirLabel(previewTag)}
                          {animations[previewTag]?.flipX && ' 🪞'}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>
                          {previewAnim.endFrame - previewAnim.startFrame + 1} fr @ {previewAnim.fps} fps
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          {loopMode === 'pingpong' ? '↔ ping-pong' : '→ boucle'}
                          {!isPlaying && ' · ⏸ pause'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    flex: 1, minHeight: 80,
                    border: '1px dashed rgba(139,92,246,0.22)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                      Assignez une direction<br/>pour voir l'aperçu
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px',
            borderTop: '1px solid var(--color-border-base)',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {configuredCount > 0
                ? `${configuredCount} animation${configuredCount > 1 ? 's' : ''} configurée${configuredCount > 1 ? 's' : ''}`
                : 'Aucune animation configurée'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Dialog.Close asChild>
                <button style={cancelBtn}>Annuler</button>
              </Dialog.Close>
              <button onClick={handleConfirm} style={confirmBtn}>
                Confirmer — {cols}×{rows} = {totalFrames} frames
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  margin: 0, fontSize: 10, fontWeight: 700,
  color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
};
const textInputStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 5, boxSizing: 'border-box',
  border: '1px solid var(--color-border-base)',
  background: 'rgba(0,0,0,0.3)', color: 'var(--color-text-base)', fontSize: 13, outline: 'none',
};
const numInput: React.CSSProperties = {
  width: 58, padding: '5px 6px', borderRadius: 4, textAlign: 'center',
  border: '1px solid var(--color-border-base)',
  background: 'rgba(0,0,0,0.3)', color: 'var(--color-text-base)', fontSize: 12, outline: 'none',
};
const labelRow:  React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const labelText: React.CSSProperties = {
  fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};
const lpcBtnSmall: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 5, cursor: 'pointer',
  border: '1px solid rgba(139,92,246,0.5)', background: 'rgba(139,92,246,0.12)',
  color: 'var(--color-primary)', fontSize: 10, fontWeight: 600,
};
const badgeStyle: React.CSSProperties = {
  fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0,
  background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 4,
};
const cancelBtn: React.CSSProperties = {
  padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  border: '1px solid var(--color-border-base)',
  background: 'transparent', color: 'var(--color-text-muted)',
};
const confirmBtn: React.CSSProperties = {
  padding: '7px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  border: 'none', background: 'var(--color-primary)', color: '#fff',
};
const zoomBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 5, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)',
};
const previewCtrlBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 5, cursor: 'pointer',
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
};
