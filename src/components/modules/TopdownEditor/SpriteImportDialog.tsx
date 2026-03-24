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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import {
  Grid3X3,
  Zap,
  X,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from 'lucide-react';
import { SPRITE_CATEGORIES, SPRITE_ANIM_GROUPS, LPC_PRESET, expandRange } from '@/types/sprite';
import type {
  SpriteSheetConfig,
  SpriteAnimationTag,
  AnimationRange,
  SpriteAnimGroupId,
  PlayerColliderConfig,
} from '@/types/sprite';
import {
  SPRITE_DIR_COLORS,
  SPRITE_PREVIEW_CANVAS_SIZE,
  SPRITE_MINI_CANVAS_SIZE,
} from '@/config/mapEditorConfig';
import { Z_INDEX } from '@/utils/zIndexLayers';
import {
  sectionLabel,
  textInputStyle,
  numInput,
  labelRow,
  labelText,
  lpcBtnSmall,
  badgeStyle,
  cancelBtn,
  confirmBtn,
  zoomBtnStyle,
  previewCtrlBtn,
  rightPanelTab,
  rightPanelTabActive,
} from './SpriteImportDialog.styles';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SpriteImportDialogProps {
  isOpen: boolean;
  imageSrc: string;
  imagePath: string;
  imageName?: string;
  initialConfig?: SpriteSheetConfig;
  onConfirm: (imagePath: string, config: SpriteSheetConfig) => void;
  onCancel: () => void;
  /** 'hero' (défaut) = dialog complet · 'object' = dialog simplifié (1 animation idle_down) */
  mode?: 'hero' | 'object';
}

type AnimState = Partial<Record<SpriteAnimationTag, AnimationRange>>;

// ── Constants (source unique : mapEditorConfig) ────────────────────────────

const DIR_COLORS = SPRITE_DIR_COLORS;

/** Total d'animations possibles sur tous les groupes — dérivé de SPRITE_ANIM_GROUPS */
const TOTAL_POSSIBLE_ANIMS = SPRITE_ANIM_GROUPS.reduce((acc, g) => acc + g.tags.length, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFrames(frames: number[]): string {
  if (!frames?.length) return '0 fr';
  const lo = Math.min(...frames);
  const hi = Math.max(...frames);
  const count = frames.length;
  return lo === hi - count + 1 ? `fr ${lo}–${hi} (${count} fr)` : `${count} fr (sél. libre)`;
}

/**
 * Dérive la direction miroir (horizontale) depuis le nom du tag.
 * Basé sur la convention de nommage : _left ↔ _right (pas de hardcode de table).
 */
function getMirrorTag(tag: SpriteAnimationTag): SpriteAnimationTag | null {
  if (tag.endsWith('_left')) return tag.replace(/_left$/, '_right') as SpriteAnimationTag;
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
  flipX = false
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
    ctx.drawImage(
      img,
      col * frameW,
      row * frameH,
      frameW,
      frameH,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();
  } else {
    ctx.drawImage(
      img,
      col * frameW,
      row * frameH,
      frameW,
      frameH,
      0,
      0,
      canvas.width,
      canvas.height
    );
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
      <button
        onClick={() => resetTransform()}
        style={{ ...zoomBtnStyle, padding: '3px 7px', fontSize: 10 }}
        title="Réinitialiser le zoom"
      >
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
  mode = 'hero',
}: SpriteImportDialogProps) {
  const isObjectMode = mode === 'object';
  // ── Config state ───────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(initialConfig?.displayName ?? imageName ?? '');
  const [category, setCategory] = useState<string>(initialConfig?.category ?? 'hero');
  const [frameW, setFrameW] = useState(initialConfig?.frameW ?? 64);
  const [frameH, setFrameH] = useState(initialConfig?.frameH ?? 64);
  const [cols, setCols] = useState(initialConfig?.cols ?? 1);
  const [rows, setRows] = useState(initialConfig?.rows ?? 1);
  const [animations, setAnimations] = useState<AnimState>(initialConfig?.animations ?? {});
  const [activeTab, setActiveTab] = useState<SpriteAnimGroupId>('walk');

  // ── Origin / anchor state ──────────────────────────────────────────────────
  // Défaut : bas-centre (0.5, 1.0) pour les nouveaux sprites. Chargé depuis initialConfig pour les existants.
  const [originXPct, setOriginXPct] = useState<number>(initialConfig?.originXPct ?? 0.5);
  const [originYPct, setOriginYPct] = useState<number>(initialConfig?.originYPct ?? 1.0);

  // ── Collision state ─────────────────────────────────────────────────────────
  const COLL_DEFAULT_BOX: PlayerColliderConfig = {
    mode: 'box',
    widthPct: 0.875,
    heightPct: 0.875,
    offsetXPct: 0,
    offsetYPct: 0,
  };
  const COLL_DEFAULT_POLY: { x: number; y: number }[] = [
    { x: 0, y: -0.75 },
    { x: 0.6, y: 0 },
    { x: 0, y: 0.75 },
    { x: -0.6, y: 0 },
  ];
  const [playerCollider, setPlayerCollider] = useState<PlayerColliderConfig>(
    initialConfig?.playerCollider ?? COLL_DEFAULT_BOX
  );
  const [collSelPtIdx, setCollSelPtIdx] = useState<number | null>(null);
  const [collDragPtIdx, setCollDragPtIdx] = useState<number | null>(null);
  const collPolyCanvasRef = useRef<HTMLCanvasElement>(null);
  const collBoxCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Main canvas collider drag state ────────────────────────────────────────
  type MainCollHandle = 'move' | 'tl' | 'tr' | 'bl' | 'br' | `poly-${number}`;
  const [mainCollDrag, setMainCollDrag] = useState<{
    handle: MainCollHandle;
    startMx: number;
    startMy: number;
    startCollider: PlayerColliderConfig;
  } | null>(null);
  const [mainCollHover, setMainCollHover] = useState<MainCollHandle | null>(null);

  // ── Onglet panneau droit ────────────────────────────────────────────────────
  // Défaut : 'grid' pour un nouveau sprite, 'anims' si config existante
  const [rightTab, setRightTab] = useState<'grid' | 'collision' | 'anims'>(
    initialConfig ? 'anims' : 'grid'
  );

  // ── UX state ───────────────────────────────────────────────────────────────
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [activeTag, setActiveTag] = useState<SpriteAnimationTag | null>(null);
  const [showLpcCard, setShowLpcCard] = useState(false);
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [justCompleted, setJustCompleted] = useState<SpriteAnimGroupId | null>(null);

  // ── Preview state ──────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(true);
  const [loopMode, setLoopMode] = useState<'forward' | 'pingpong'>('forward');

  // ── Stable ref for keyboard handler ───────────────────────────────────────
  const latestRef = useRef({ activeTag, cols });
  latestRef.current = { activeTag, cols };

  const latestAnimsRef = useRef(animations);
  latestAnimsRef.current = animations;

  // ── Animation refs ─────────────────────────────────────────────────────────
  const animCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef(0);

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
    setOriginXPct(initialConfig?.originXPct ?? 0.5);
    setOriginYPct(initialConfig?.originYPct ?? 1.0);
    setRightTab(initialConfig ? 'anims' : 'grid');
    if (isObjectMode) {
      setActiveTab('idle');
      setActiveTag('idle_down' as SpriteAnimationTag);
    } else {
      setActiveTab('walk');
      setActiveTag(null);
    }
    setHoveredFrame(null);
    setHoveredRow(null);
    setJustCompleted(null);
    setIsPlaying(true);
    setLoopMode('forward');
    setShowLpcCard(!initialConfig);
    setImgSize(null);
    loadedImgRef.current = null;
    prevCompletedRef.current = {};
  }, [isOpen, imagePath]); // eslint-disable-line react-hooks/exhaustive-deps -- reset intentionnel à l'ouverture/changement d'image ; setters React et refs sont stables

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
  const activeGroup = SPRITE_ANIM_GROUPS.find((g) => g.id === activeTab)!;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Tab → direction suivante non configurée
      if (e.key === 'Tab') {
        e.preventDefault();
        const unconfigured = activeGroup.tags.filter((t) => !latestAnimsRef.current[t]);
        const next =
          unconfigured.find((t) => t !== latestRef.current.activeTag) ?? unconfigured[0] ?? null;
        setActiveTag(next);
      }
      // Espace → pause/play
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      // 1-4 → onglets
      if (e.key === '1') setActiveTab('walk');
      if (e.key === '2') setActiveTab('idle');
      if (e.key === '3') setActiveTab('run');
      if (e.key === '4') setActiveTab('attack');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, activeGroup]);

  // ── Célébration quand un groupe est complet ────────────────────────────────
  useEffect(() => {
    const count = activeGroup.tags.filter((t) => animations[t]).length;
    const prev = prevCompletedRef.current[activeTab] ?? 0;
    if (count === activeGroup.tags.length && count > 0 && prev < count) {
      setJustCompleted(activeTab);
      const tid = setTimeout(() => setJustCompleted(null), 2500);
      prevCompletedRef.current = { ...prevCompletedRef.current, [activeTab]: count };
      return () => clearTimeout(tid);
    }
    prevCompletedRef.current = { ...prevCompletedRef.current, [activeTab]: count };
  }, [animations, activeGroup, activeTab]);

  // ── Main preview canvas — draw ─────────────────────────────────────────────
  const OBJECT_ANIM_TAG = 'idle_down' as SpriteAnimationTag;
  const previewTag = isObjectMode
    ? animations[OBJECT_ANIM_TAG]
      ? OBJECT_ANIM_TAG
      : null
    : activeTag && animations[activeTag]
      ? activeTag
      : // Fallback 1 : une autre direction du même tab
        (activeGroup.tags.find((t) => animations[t]) ??
        // Fallback 2 : n'importe quelle animation configurée (si l'onglet actif est vide)
        (Object.keys(animations) as SpriteAnimationTag[]).find((t) => animations[t]) ??
        null);
  const previewAnim = previewTag ? animations[previewTag] : null;

  const drawMainCanvas = useCallback(() => {
    const canvas = animCanvasRef.current;
    const img = loadedImgRef.current;
    if (!canvas || !img || !frameW || !frameH || !cols) return;
    drawFrameOnCanvas(canvas, img, animFrameRef.current, cols, frameW, frameH, previewAnim?.flipX);
    // Object mode: draw collision overlay on main preview canvas
    if (isObjectMode) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const cw = canvas.width;
        const ch = canvas.height;
        if (playerCollider.mode === 'box') {
          const bw = playerCollider.widthPct * cw;
          const bh = playerCollider.heightPct * ch;
          const bx = cw / 2 - bw / 2 + (playerCollider.offsetXPct * cw) / 2;
          const by = ch / 2 - bh / 2 + (playerCollider.offsetYPct * ch) / 2;
          ctx.fillStyle = 'rgba(80,220,100,0.15)';
          ctx.strokeStyle = 'rgba(80,220,100,0.85)';
          ctx.lineWidth = 1.5;
          ctx.fillRect(bx, by, bw, bh);
          ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
          // Draw corner handles for interactive dragging
          if (isObjectMode) {
            const hSize = Math.max(4, cw * 0.05);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.strokeStyle = 'rgba(80,220,100,0.9)';
            ctx.lineWidth = 1;
            const corners = [
              { x: bx, y: by },
              { x: bx + bw, y: by },
              { x: bx, y: by + bh },
              { x: bx + bw, y: by + bh },
            ];
            for (const c of corners) {
              ctx.fillRect(c.x - hSize / 2, c.y - hSize / 2, hSize, hSize);
              ctx.strokeRect(c.x - hSize / 2, c.y - hSize / 2, hSize, hSize);
            }
            // Center drag handle
            ctx.beginPath();
            ctx.arc(bx + bw / 2, by + bh / 2, hSize * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(80,220,100,0.5)';
            ctx.fill();
          }
        } else if (playerCollider.mode === 'polygon' && playerCollider.points.length >= 3) {
          const pts = playerCollider.points.map((p) => ({
            x: (p.x + 1) * 0.5 * cw,
            y: (p.y + 1) * 0.5 * ch,
          }));
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(80,220,100,0.15)';
          ctx.strokeStyle = 'rgba(80,220,100,0.85)';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();
          // Draw vertex handles
          if (isObjectMode) {
            for (let i = 0; i < pts.length; i++) {
              const hSize = Math.max(4, cw * 0.05);
              ctx.beginPath();
              ctx.arc(pts[i].x, pts[i].y, hSize * 0.7, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255,255,255,0.9)';
              ctx.strokeStyle = 'rgba(80,220,100,0.9)';
              ctx.lineWidth = 1;
              ctx.fill();
              ctx.stroke();
            }
          }
        }
      }
    }
  }, [frameW, frameH, cols, previewAnim?.flipX, isObjectMode, playerCollider]);

  // Main animation loop
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
  }, [previewAnim, drawMainCanvas, isPlaying, loopMode]);

  useEffect(() => {
    drawMainCanvas();
  }, [drawMainCanvas]);

  // Object mode: redraw main canvas when collision changes
  useEffect(() => {
    if (!isObjectMode) return;
    if (!loadedImgRef.current) return;
    animFrameRef.current = animations[OBJECT_ANIM_TAG]?.frames?.[0] ?? 0;
    drawMainCanvas();
  }, [isObjectMode, playerCollider, drawMainCanvas]); // eslint-disable-line react-hooks/exhaustive-deps -- animations[OBJECT_ANIM_TAG] lu via ref stable

  // ── Mini-canvas animation loops (une par direction dans l'onglet actif) ───
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
        drawFrameOnCanvas(
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
  }, [animations, activeGroup, cols, frameW, frameH, imgSize]);

  // ── Frame click — sélection checkbox (toggle individuel) ──────────────────
  const toggleFrame = useCallback((frameIdx: number, tag: SpriteAnimationTag) => {
    setAnimations((prev) => {
      const existing = prev[tag];
      const fps = existing?.fps ?? 10;
      const prevFrames = existing?.frames ?? [];
      const isSelected = prevFrames.includes(frameIdx);
      const newFrames = isSelected
        ? prevFrames.filter((f) => f !== frameIdx)
        : [...prevFrames, frameIdx].sort((a, b) => a - b);

      // Effacer l'entrée si plus aucun frame
      if (newFrames.length === 0) {
        const next = { ...prev };
        delete next[tag];
        return next;
      }

      const updated = { ...prev, [tag]: { frames: newFrames, fps } };

      return updated;
    });
  }, []);

  const handleFrameClick = useCallback(
    (frameIdx: number) => {
      if (!activeTag) return;
      toggleFrame(frameIdx, activeTag);
    },
    [activeTag, toggleFrame]
  );

  // ── Row click-to-assign ────────────────────────────────────────────────────
  const handleRowClick = useCallback(
    (rowIdx: number) => {
      if (!activeTag) return;
      const rowFrames = Array.from({ length: cols }, (_, i) => rowIdx * cols + i);
      const existing = animations[activeTag]?.frames ?? [];
      const allPresent = rowFrames.every((f) => existing.includes(f));
      // Toute la rangée déjà sélectionnée → désélectionner, sinon → tout ajouter
      const newFrames = allPresent
        ? existing.filter((f) => !rowFrames.includes(f))
        : [...new Set([...existing, ...rowFrames])].sort((a, b) => a - b);

      setAnimations((prev) => {
        if (newFrames.length === 0) {
          const next = { ...prev };
          delete next[activeTag];
          return next;
        }
        const fps = prev[activeTag]?.fps ?? 10;
        return { ...prev, [activeTag]: { frames: newFrames, fps } };
      });
    },
    [activeTag, cols, animations]
  );

  // ── Smart grid presets ────────────────────────────────────────────────────
  const smartGridPresets = useMemo(() => {
    if (!imgSize) return [];
    const candidates = [16, 24, 32, 48, 64, 96, 128];
    const results: Array<{ w: number; h: number; cols: number; rows: number; frames: number }> = [];
    const seen = new Set<string>();
    for (const w of candidates) {
      for (const h of candidates) {
        if (imgSize.w % w !== 0 || imgSize.h % h !== 0) continue;
        const c = imgSize.w / w;
        const r = imgSize.h / h;
        const f = c * r;
        if (f < 1 || f > 200) continue;
        const key = `${w}x${h}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ w, h, cols: c, rows: r, frames: f });
      }
    }
    return results
      .sort((a, b) => {
        const preferred = [32, 48, 64];
        const aP = preferred.includes(a.w) && preferred.includes(a.h) ? 0 : 1;
        const bP = preferred.includes(b.w) && preferred.includes(b.h) ? 0 : 1;
        return aP - bP || a.w - b.w;
      })
      .slice(0, 5);
  }, [imgSize]);

  // ── Auto-détection rangées ─────────────────────────────────────────────────
  const canAutoDetect = rows === activeGroup.tags.length && rows > 1;
  const handleAutoDetect = useCallback(() => {
    const newAnims: AnimState = { ...animations };
    activeGroup.tags.forEach((tag, i) => {
      const rowStart = i * cols;
      const rowEnd = (i + 1) * cols - 1;
      newAnims[tag] = { frames: expandRange(rowStart, rowEnd), fps: animations[tag]?.fps ?? 10 };
    });
    setAnimations(newAnims);
    setActiveTag(null);
  }, [activeGroup.tags, cols, animations]);

  // ── Frame classification ───────────────────────────────────────────────────
  const getFrameAssignment = useCallback(
    (frameIdx: number) => {
      for (let i = 0; i < activeGroup.tags.length; i++) {
        const tag = activeGroup.tags[i];
        const anim = animations[tag];
        if (!anim) continue;
        if (anim?.frames?.includes(frameIdx)) {
          return { tag, dirIdx: i, color: DIR_COLORS[i % DIR_COLORS.length] };
        }
      }
      return null;
    },
    [activeGroup.tags, animations]
  );

  const activeTagDirIdx = activeTag ? activeGroup.tags.indexOf(activeTag) : -1;
  const activeTagColor =
    activeTagDirIdx >= 0 ? DIR_COLORS[activeTagDirIdx % DIR_COLORS.length] : DIR_COLORS[0];

  // ── LPC preset ────────────────────────────────────────────────────────────
  const applyLpcPreset = () => {
    setFrameW(LPC_PRESET.frameW);
    setFrameH(LPC_PRESET.frameH);
    setAnimations(LPC_PRESET.animations as AnimState);
    setActiveTab('walk');
    setActiveTag(null);
    setShowLpcCard(false);
  };

  // ── Main canvas collision hit-test ─────────────────────────────────────────
  function hitTestMainCollider(mx: number, my: number): MainCollHandle | null {
    const cw = canvasSize.w;
    const ch = canvasSize.h;
    const HS = Math.max(8, cw * 0.06);
    if (playerCollider.mode === 'box') {
      const bw = playerCollider.widthPct * cw;
      const bh = playerCollider.heightPct * ch;
      const bx = cw / 2 - bw / 2 + (playerCollider.offsetXPct * cw) / 2;
      const by = ch / 2 - bh / 2 + (playerCollider.offsetYPct * ch) / 2;
      if (Math.abs(mx - bx) < HS && Math.abs(my - by) < HS) return 'tl';
      if (Math.abs(mx - (bx + bw)) < HS && Math.abs(my - by) < HS) return 'tr';
      if (Math.abs(mx - bx) < HS && Math.abs(my - (by + bh)) < HS) return 'bl';
      if (Math.abs(mx - (bx + bw)) < HS && Math.abs(my - (by + bh)) < HS) return 'br';
      if (
        mx >= bx - HS * 0.5 &&
        mx <= bx + bw + HS * 0.5 &&
        my >= by - HS * 0.5 &&
        my <= by + bh + HS * 0.5
      )
        return 'move';
    } else if (playerCollider.mode === 'polygon') {
      const HS2 = HS * 1.2;
      for (let i = 0; i < playerCollider.points.length; i++) {
        const px = (playerCollider.points[i].x + 1) * 0.5 * cw;
        const py = (playerCollider.points[i].y + 1) * 0.5 * ch;
        if (Math.abs(mx - px) < HS2 && Math.abs(my - py) < HS2)
          return `poly-${i}` as MainCollHandle;
      }
    }
    return null;
  }

  function getMainCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = animCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  const handleMainCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isObjectMode) return;
    const { x: mx, y: my } = getMainCanvasCoords(e);
    const handle = hitTestMainCollider(mx, my);
    if (!handle) return;
    e.preventDefault();
    setMainCollDrag({ handle, startMx: mx, startMy: my, startCollider: playerCollider });
  };

  const handleMainCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isObjectMode) return;
    const { x: mx, y: my } = getMainCanvasCoords(e);
    if (!mainCollDrag) {
      setMainCollHover(hitTestMainCollider(mx, my));
      return;
    }
    const cw = canvasSize.w;
    const ch = canvasSize.h;
    const dx = mx - mainCollDrag.startMx;
    const dy = my - mainCollDrag.startMy;
    const s = mainCollDrag.startCollider;
    const { handle } = mainCollDrag;
    if (s.mode === 'box') {
      if (handle === 'move') {
        setPlayerCollider({
          ...s,
          offsetXPct: Math.max(-1, Math.min(1, s.offsetXPct + (2 * dx) / cw)),
          offsetYPct: Math.max(-1, Math.min(1, s.offsetYPct + (2 * dy) / ch)),
        });
      } else {
        const isLeftEdge = handle === 'tl' || handle === 'bl';
        const isTopEdge = handle === 'tl' || handle === 'tr';
        setPlayerCollider({
          ...s,
          widthPct: Math.max(0.05, s.widthPct + ((isLeftEdge ? -1 : 1) * dx) / cw),
          heightPct: Math.max(0.05, s.heightPct + ((isTopEdge ? -1 : 1) * dy) / ch),
          offsetXPct: Math.max(-1, Math.min(1, s.offsetXPct + dx / cw)),
          offsetYPct: Math.max(-1, Math.min(1, s.offsetYPct + dy / ch)),
        });
      }
    } else if (s.mode === 'polygon' && handle.startsWith('poly-')) {
      const ptIdx = parseInt(handle.slice(5));
      const newPts = [...s.points];
      newPts[ptIdx] = {
        x: Math.max(-1, Math.min(1, (mx / cw) * 2 - 1)),
        y: Math.max(-1, Math.min(1, (my / ch) * 2 - 1)),
      };
      setPlayerCollider({ ...s, points: newPts });
    }
  };

  const handleMainCanvasMouseUp = () => setMainCollDrag(null);
  const handleMainCanvasMouseLeave = () => {
    setMainCollDrag(null);
    setMainCollHover(null);
  };

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    onConfirm(imagePath, {
      frameW: Math.max(1, frameW),
      frameH: Math.max(1, frameH),
      cols,
      rows,
      category,
      displayName: displayName.trim() || undefined,
      animations,
      playerCollider,
      originXPct,
      originYPct,
    });
  };

  // ── Collision editor helpers ───────────────────────────────────────────────
  const COLL_CS = 140; // canvas size
  const COLL_CC = 70; // canvas center
  const COLL_SC = 48; // px per normalised unit

  const collNormToCanvas = useCallback(
    (nx: number, ny: number) => ({
      x: COLL_CC + nx * COLL_SC,
      y: COLL_CC + ny * COLL_SC,
    }),
    []
  );
  const collCanvasToNorm = useCallback(
    (cx: number, cy: number) => ({
      x: Math.max(-1.4, Math.min(1.4, (cx - COLL_CC) / COLL_SC)),
      y: Math.max(-1.4, Math.min(1.4, (cy - COLL_CC) / COLL_SC)),
    }),
    []
  );

  const collHitTest = useCallback(
    (pts: { x: number; y: number }[], cx: number, cy: number, r = 9) => {
      for (let i = pts.length - 1; i >= 0; i--) {
        const c = collNormToCanvas(pts[i].x, pts[i].y);
        if ((c.x - cx) ** 2 + (c.y - cy) ** 2 <= r * r) return i;
      }
      return -1;
    },
    [collNormToCanvas]
  );
  function collGetPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function collGrahamScan(pts: { x: number; y: number }[]) {
    if (pts.length < 3) return pts;
    let piv = pts[0];
    for (const p of pts) if (p.y < piv.y || (p.y === piv.y && p.x < piv.x)) piv = p;
    const cross = (o: typeof piv, a: typeof piv, b: typeof piv) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const sorted = pts
      .filter((p) => p !== piv)
      .sort((a, b) => {
        const c = cross(piv, a, b);
        if (c !== 0) return -c;
        return (a.x - piv.x) ** 2 + (a.y - piv.y) ** 2 - ((b.x - piv.x) ** 2 + (b.y - piv.y) ** 2);
      });
    const hull: { x: number; y: number }[] = [piv];
    for (const p of sorted) {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0)
        hull.pop();
      hull.push(p);
    }
    return hull;
  }

  function collIsConvex(pts: { x: number; y: number }[]) {
    if (pts.length < 3) return true;
    let sign = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i],
        b = pts[(i + 1) % pts.length],
        c = pts[(i + 2) % pts.length];
      const cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (cr !== 0) {
        const s = cr > 0 ? 1 : -1;
        if (sign === 0) sign = s;
        else if (sign !== s) return false;
      }
    }
    return true;
  }

  const handleCollPolyDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (playerCollider.mode !== 'polygon') return;
      const pos = collGetPos(e);
      const hit = collHitTest(playerCollider.points, pos.x, pos.y);
      if (hit >= 0) {
        setCollSelPtIdx(hit);
        setCollDragPtIdx(hit);
      } else {
        const norm = collCanvasToNorm(pos.x, pos.y);
        setPlayerCollider((prev) =>
          prev.mode !== 'polygon' ? prev : { ...prev, points: [...prev.points, norm] }
        );
        setCollSelPtIdx(playerCollider.points.length);
      }
    },
    [playerCollider, collCanvasToNorm, collHitTest]
  );

  const handleCollPolyMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (collDragPtIdx === null || playerCollider.mode !== 'polygon') return;
      const norm = collCanvasToNorm(collGetPos(e).x, collGetPos(e).y);
      setPlayerCollider((prev) => {
        if (prev.mode !== 'polygon') return prev;
        const pts = [...prev.points];
        pts[collDragPtIdx] = norm;
        return { ...prev, points: pts };
      });
    },
    [collDragPtIdx, playerCollider.mode, collCanvasToNorm]
  );

  const handleCollPolyUp = useCallback(() => setCollDragPtIdx(null), []);

  // Box preview draw
  useEffect(() => {
    if (playerCollider.mode !== 'box') return;
    const canvas = collBoxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const S = 80;
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(80,80,120,0.2)';
    ctx.strokeStyle = 'rgba(130,130,180,0.5)';
    ctx.lineWidth = 1;
    ctx.fillRect(0, 0, S, S);
    ctx.strokeRect(0.5, 0.5, S - 1, S - 1);
    ctx.strokeStyle = 'rgba(200,200,200,0.25)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(S / 2, 0);
    ctx.lineTo(S / 2, S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, S / 2);
    ctx.lineTo(S, S / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const bW = playerCollider.widthPct * S,
      bH = playerCollider.heightPct * S;
    const ox = playerCollider.offsetXPct * S,
      oy = playerCollider.offsetYPct * S;
    ctx.fillStyle = 'rgba(80,220,100,0.28)';
    ctx.strokeStyle = 'rgba(80,220,100,0.85)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(S / 2 - bW / 2 + ox, S / 2 - bH / 2 + oy, bW, bH);
    ctx.strokeRect(S / 2 - bW / 2 + ox, S / 2 - bH / 2 + oy, bW, bH);
  }, [playerCollider]);

  // Polygon canvas draw
  useEffect(() => {
    if (playerCollider.mode !== 'polygon') return;
    const canvas = collPolyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, COLL_CS, COLL_CS);
    ctx.fillStyle = 'rgba(80,80,120,0.2)';
    ctx.strokeStyle = 'rgba(130,130,180,0.45)';
    ctx.lineWidth = 1;
    ctx.fillRect(COLL_CC - COLL_SC, COLL_CC - COLL_SC, COLL_SC * 2, COLL_SC * 2);
    ctx.strokeRect(COLL_CC - COLL_SC, COLL_CC - COLL_SC, COLL_SC * 2, COLL_SC * 2);
    ctx.strokeStyle = 'rgba(200,200,200,0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(COLL_CC, 0);
    ctx.lineTo(COLL_CC, COLL_CS);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, COLL_CC);
    ctx.lineTo(COLL_CS, COLL_CC);
    ctx.stroke();
    ctx.setLineDash([]);
    const points = playerCollider.points;
    if (points.length >= 3) {
      const first = collNormToCanvas(points[0].x, points[0].y);
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < points.length; i++) {
        const p = collNormToCanvas(points[i].x, points[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(80,220,100,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,220,100,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    points.forEach((pt, i) => {
      const c = collNormToCanvas(pt.x, pt.y);
      const sel = i === collSelPtIdx;
      ctx.beginPath();
      ctx.arc(c.x, c.y, sel ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = sel ? 'rgba(139,92,246,1)' : 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.strokeStyle = sel ? 'rgba(139,92,246,0.6)' : 'rgba(60,60,60,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [playerCollider, collSelPtIdx, collNormToCanvas]);

  // ── Computed values ────────────────────────────────────────────────────────
  const configuredCount = Object.keys(animations).length;
  const totalFrames = cols * rows;
  const globalProgress = TOTAL_POSSIBLE_ANIMS > 0 ? configuredCount / TOTAL_POSSIBLE_ANIMS : 0;

  const canvasSize =
    frameW && frameH
      ? frameW >= frameH
        ? {
            w: SPRITE_PREVIEW_CANVAS_SIZE,
            h: Math.round((SPRITE_PREVIEW_CANVAS_SIZE * frameH) / frameW),
          }
        : {
            w: Math.round((SPRITE_PREVIEW_CANVAS_SIZE * frameW) / frameH),
            h: SPRITE_PREVIEW_CANVAS_SIZE,
          }
      : { w: SPRITE_PREVIEW_CANVAS_SIZE, h: SPRITE_PREVIEW_CANVAS_SIZE };

  const instructionText = isObjectMode
    ? activeTag
      ? `☑ Cliquez les frames à inclure dans l'animation · n° rangée = sélection rapide`
      : '▶ Cliquez sur le sprite pour sélectionner les frames'
    : activeTag
      ? `☑ Cliquez les frames → ${getDirLabel(activeTag)} · n° rangée = sélection rapide`
      : rows === 1 && cols > 1
        ? '← Cliquez une direction, puis cochez les frames'
        : canAutoDetect
          ? '✨ Cliquez "Détecter" ou sélectionnez une direction'
          : '← Cliquez une direction, puis cochez les frames';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: Z_INDEX.TOPDOWN_BACKDROP,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
          }}
        />

        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: Z_INDEX.TOPDOWN_DIALOG,
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
          <div
            style={{
              flexShrink: 0,
              padding: '12px 18px 10px',
              borderBottom: '1px solid var(--color-border-base)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Row 1 : titre + infos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Grid3X3 size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <Dialog.Title
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--color-text-base)',
                  flex: 1,
                }}
              >
                Configurer le sprite
              </Dialog.Title>
              {imageName && (
                <Dialog.Description
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: 'var(--color-text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  {imageName}
                </Dialog.Description>
              )}
              {imgSize && (
                <span style={badgeStyle}>
                  {imgSize.w}×{imgSize.h}px
                </span>
              )}
            </div>

            {/* Row 2 : nom + catégories */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={imageName ?? 'Nom du personnage'}
                style={{ ...textInputStyle, flex: 1, minWidth: 160 }}
              />
              {!isObjectMode && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {SPRITE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 9px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        border:
                          category === cat.id
                            ? '1.5px solid var(--color-primary)'
                            : '1px solid var(--color-border-base)',
                        background:
                          category === cat.id ? 'var(--color-primary-muted)' : 'transparent',
                        color:
                          category === cat.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontSize: 12,
                        fontWeight: category === cat.id ? 700 : 400,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3 : barre de progression globale (héros uniquement) */}
            {!isObjectMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${globalProgress * 100}%`,
                      borderRadius: 4,
                      background:
                        globalProgress === 1
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : 'linear-gradient(90deg, var(--color-primary), #a78bfa)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-secondary)',
                    flexShrink: 0,
                    minWidth: 56,
                    textAlign: 'right',
                  }}
                >
                  {configuredCount}/{TOTAL_POSSIBLE_ANIMS} anim.
                </span>
              </div>
            )}
          </div>

          {/* ── LPC Card ───────────────────────────────────────────────── */}
          {!isObjectMode && showLpcCard && (
            <div
              style={{
                flexShrink: 0,
                margin: '0 18px',
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 14px',
                background: 'var(--color-primary-10)',
                border: '1.5px solid var(--color-primary-40)',
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: '0 0 2px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-base)',
                  }}
                >
                  Format LPC détecté ?
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.4,
                  }}
                >
                  64×64 px · 4 rangées (↓←→↑) · 9 frames — standard pixel art open source.
                </p>
              </div>
              <button
                onClick={applyLpcPreset}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                ✓ Appliquer LPC
              </button>
              <button
                onClick={() => setShowLpcCard(false)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 7,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  flexShrink: 0,
                }}
              >
                Manuel
              </button>
            </div>
          )}

          {/* ── Main area ──────────────────────────────────────────────── */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
            {/* ── LEFT : tabs + spritesheet ──────────────────────────── */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                overflow: 'hidden',
                padding: '10px 0 10px 18px',
              }}
            >
              {/* Animation tabs (héros uniquement) */}
              {!isObjectMode && (
                <div
                  style={{
                    display: 'flex',
                    gap: 5,
                    flexShrink: 0,
                    marginBottom: 7,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {SPRITE_ANIM_GROUPS.map((g) => {
                    const groupConfigured = g.tags.filter((t) => animations[t]).length;
                    const isComplete = groupConfigured === g.tags.length && groupConfigured > 0;
                    const isJustDone = justCompleted === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          setActiveTab(g.id);
                          setActiveTag(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          position: 'relative',
                          padding: '5px 11px',
                          borderRadius: 7,
                          cursor: 'pointer',
                          border:
                            activeTab === g.id
                              ? `1.5px solid ${isComplete ? '#22c55e' : 'var(--color-primary)'}`
                              : '1px solid var(--color-border-base)',
                          background: isJustDone
                            ? 'rgba(34,197,94,0.2)'
                            : activeTab === g.id
                              ? isComplete
                                ? 'rgba(34,197,94,0.12)'
                                : 'var(--color-primary-muted)'
                              : 'transparent',
                          color:
                            activeTab === g.id
                              ? isComplete
                                ? '#22c55e'
                                : 'var(--color-primary)'
                              : 'var(--color-text-muted)',
                          fontSize: 12,
                          fontWeight: activeTab === g.id ? 700 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{isComplete ? '✅' : g.emoji}</span>
                        {g.label}
                        <span
                          style={{
                            fontSize: 10,
                            color: isComplete ? '#22c55e' : 'var(--color-primary)',
                            background: isComplete
                              ? 'rgba(34,197,94,0.15)'
                              : 'var(--color-primary-15)',
                            padding: '1px 5px',
                            borderRadius: 3,
                          }}
                        >
                          {groupConfigured}/{g.tags.length}
                        </span>
                        {/* Dot pour les groupes configurés mais pas actifs */}
                        {groupConfigured > 0 && activeTab !== g.id && (
                          <span
                            style={{
                              position: 'absolute',
                              top: -3,
                              right: -3,
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: isComplete ? '#22c55e' : 'var(--color-primary)',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}

                  {/* Séparateur */}
                  <div style={{ flex: 1 }} />

                  {/* Auto-detect */}
                  {canAutoDetect && (
                    <button
                      onClick={handleAutoDetect}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 10px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        border: '1px solid rgba(255,200,50,0.5)',
                        background: 'rgba(255,200,50,0.1)',
                        color: '#ffc832',
                      }}
                    >
                      ✨ Détecter les rangées
                    </button>
                  )}

                  {/* Raccourcis hint */}
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.18)',
                      flexShrink: 0,
                      marginRight: 8,
                    }}
                  >
                    Tab · 1-4 · Espace
                  </span>
                </div>
              )}
              {isObjectMode && (
                <div style={{ flexShrink: 0, marginBottom: 7 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}
                  >
                    🎞 Animation (optionnel)
                  </span>
                </div>
              )}

              {/* Instruction bar */}
              <div
                style={{
                  flexShrink: 0,
                  marginBottom: 6,
                  padding: '5px 11px',
                  borderRadius: 6,
                  background: activeTag ? 'var(--color-primary-10)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${activeTag ? 'var(--color-primary-35)' : 'var(--color-border-base)'}`,
                  fontSize: 11,
                  color: activeTag ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: activeTag ? 700 : 400,
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{instructionText}</span>
              </div>

              {/* Spritesheet avec zoom/pan */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  border: '1px solid var(--color-border-base)',
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {imgSize && frameW > 0 && frameH > 0 ? (
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={10}
                    panning={{ disabled: activeTag !== null, velocityDisabled: true }}
                    wheel={{ step: 0.3 }}
                  >
                    {/* Zoom controls — doit être enfant de TransformWrapper */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        zIndex: 20,
                        display: 'flex',
                        gap: 3,
                        alignItems: 'center',
                      }}
                    >
                      <ZoomControls />
                    </div>

                    <TransformComponent
                      wrapperStyle={{
                        width: '100%',
                        height: '100%',
                        cursor: activeTag ? 'crosshair' : 'grab',
                      }}
                      contentStyle={{ width: '100%' }}
                    >
                      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                        {/* Row labels cliquables */}
                        {Array.from({ length: rows }).map((_, rowIdx) => {
                          const isHovered = hoveredRow === rowIdx;
                          const canClick = !!activeTag;
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
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 15,
                                cursor: canClick ? 'pointer' : 'default',
                                userSelect: 'none',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color:
                                    isHovered && canClick
                                      ? activeTagColor.text
                                      : 'rgba(255,255,255,0.35)',
                                  background:
                                    isHovered && canClick
                                      ? activeTagColor.fill
                                      : 'rgba(0,0,0,0.45)',
                                  border:
                                    isHovered && canClick
                                      ? `1px solid ${activeTagColor.stroke}`
                                      : '1px solid transparent',
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  transition: 'all 0.1s',
                                }}
                              >
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
                            display: 'block',
                            width: '100%',
                            imageRendering: 'pixelated',
                            userSelect: 'none',
                          }}
                          draggable={false}
                        />

                        {/* Frame cells (positionnement % — scalent avec l'image) */}
                        {Array.from({ length: rows * cols }).map((_, frameIdx) => {
                          const colIdx = frameIdx % cols;
                          const rowIdx = Math.floor(frameIdx / cols);
                          const assigned = getFrameAssignment(frameIdx);
                          const isCurrentTag =
                            !!activeTag && (animations[activeTag]?.frames ?? []).includes(frameIdx);
                          const isHovered = hoveredFrame === frameIdx;

                          const bg = isCurrentTag
                            ? activeTagColor.fill
                            : assigned
                              ? assigned.color.fill
                              : isHovered && activeTag
                                ? 'rgba(255,255,255,0.12)'
                                : 'transparent';

                          const border = isCurrentTag
                            ? `1px solid ${activeTagColor.stroke}`
                            : assigned
                              ? `0.5px solid ${assigned.color.stroke}`
                              : `0.5px solid rgba(255,255,255,0.06)`;

                          return (
                            <div
                              key={frameIdx}
                              style={{
                                position: 'absolute',
                                left: `${(colIdx / cols) * 100}%`,
                                top: `${(rowIdx / rows) * 100}%`,
                                width: `${(1 / cols) * 100}%`,
                                height: `${(1 / rows) * 100}%`,
                                boxSizing: 'border-box',
                                background: bg,
                                border,
                                cursor: activeTag ? 'pointer' : 'default',
                                transition: 'background 0.04s',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'flex-end',
                              }}
                              onClick={() => handleFrameClick(frameIdx)}
                              onMouseEnter={() => setHoveredFrame(frameIdx)}
                              onMouseLeave={() => setHoveredFrame(null)}
                            >
                              {isHovered && (
                                <span
                                  style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    color: 'rgba(255,255,255,0.9)',
                                    background: 'rgba(0,0,0,0.72)',
                                    padding: '1px 3px',
                                    borderRadius: '3px 0 0 0',
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                  }}
                                >
                                  {frameIdx}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Badges de direction (label au début de chaque range) */}
                        {activeGroup.tags.map((tag, dirIdx) => {
                          const anim = animations[tag];
                          if (!anim) return null;
                          const firstFrame = anim.frames?.length ? Math.min(...anim.frames) : 0;
                          const startCol = firstFrame % cols;
                          const startRow = Math.floor(firstFrame / cols);
                          const color = DIR_COLORS[dirIdx % DIR_COLORS.length];
                          return (
                            <div
                              key={`badge-${tag}`}
                              style={{
                                position: 'absolute',
                                left: `${(startCol / cols) * 100}%`,
                                top: `${(startRow / rows) * 100}%`,
                                height: `${(1 / rows) * 100}%`,
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: 20, // espace après le label de rangée
                                pointerEvents: 'none',
                                zIndex: 5,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: color.text,
                                  background: 'rgba(0,0,0,0.75)',
                                  padding: '1px 4px',
                                  borderRadius: 3,
                                  whiteSpace: 'nowrap',
                                }}
                              >
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
                  <div
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)',
                      fontSize: 12,
                    }}
                  >
                    Chargement…
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT : onglets Grille / Collision / Animations ────── */}
            <div
              style={{
                width: 380,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid var(--color-border-base)',
                overflow: 'hidden',
              }}
            >
              {/* Barre d'onglets */}
              <div
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  borderBottom: '1px solid var(--color-border-base)',
                  background: 'rgba(0,0,0,0.15)',
                }}
              >
                {(
                  [
                    { id: 'grid', label: '📐 Grille' },
                    { id: 'collision', label: '🧱 Collision' },
                    { id: 'anims', label: isObjectMode ? '🎬 Animation' : '🎬 Animations' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id)}
                    style={rightTab === tab.id ? rightPanelTabActive : rightPanelTab}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenu de l'onglet actif */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {/* ── TAB GRILLE ──────────────────────────────────────── */}
                {rightTab === 'grid' && (
                  <>
                    {/* Grille de découpe */}
                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}
                      >
                        <p style={sectionLabel}>Grille de découpe</p>
                        <button onClick={applyLpcPreset} style={lpcBtnSmall}>
                          <Zap size={9} /> LPC
                        </button>
                      </div>
                      <div
                        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
                      >
                        <label style={labelRow}>
                          <span style={labelText}>Largeur</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <input
                              type="number"
                              value={frameW}
                              min={1}
                              max={512}
                              onChange={(e) =>
                                setFrameW(Math.max(1, parseInt(e.target.value) || 1))
                              }
                              style={numInput}
                            />
                            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                              px
                            </span>
                          </div>
                        </label>
                        <label style={labelRow}>
                          <span style={labelText}>Hauteur</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <input
                              type="number"
                              value={frameH}
                              min={1}
                              max={512}
                              onChange={(e) =>
                                setFrameH(Math.max(1, parseInt(e.target.value) || 1))
                              }
                              style={numInput}
                            />
                            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                              px
                            </span>
                          </div>
                        </label>
                      </div>
                      {imgSize && (
                        <p
                          style={{
                            margin: '5px 0 0',
                            fontSize: 11,
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                          }}
                        >
                          → {cols} col × {rows} rg = {totalFrames} frames
                        </p>
                      )}
                      {/* Smart detect chips */}
                      {smartGridPresets.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                          {smartGridPresets.map((p) => {
                            const isActive = frameW === p.w && frameH === p.h;
                            return (
                              <button
                                key={`${p.w}x${p.h}`}
                                onClick={() => {
                                  setFrameW(p.w);
                                  setFrameH(p.h);
                                }}
                                title={`${p.cols} col × ${p.rows} rg = ${p.frames} frames`}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: isActive ? 700 : 500,
                                  cursor: 'pointer',
                                  border: isActive
                                    ? '1.5px solid var(--color-primary)'
                                    : '1px solid var(--color-border-base)',
                                  background: isActive
                                    ? 'var(--color-primary-muted)'
                                    : 'rgba(255,255,255,0.04)',
                                  color: isActive
                                    ? 'var(--color-primary)'
                                    : 'var(--color-text-secondary)',
                                  transition: 'all 0.1s',
                                }}
                              >
                                {p.w}×{p.h}px · {p.frames}fr
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 📍 Point d'origine (ancre de placement) */}
                    <div style={{ marginBottom: 4 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}
                      >
                        <p style={sectionLabel}>Point d'origine</p>
                        <span
                          title="Quel point du sprite s'aligne sur la cellule de la grille. Bas-centre = personnages/arbres. Centre = petits objets."
                          style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            cursor: 'help',
                            lineHeight: 1,
                          }}
                        >
                          ℹ
                        </span>
                      </div>
                      {/* Grille 3×3 — sélecteur d'ancre style GDevelop */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 28px)',
                          gap: 3,
                          width: 'fit-content',
                        }}
                      >
                        {([0, 0.5, 1] as const).map((oy) =>
                          ([0, 0.5, 1] as const).map((ox) => {
                            const isActive = originXPct === ox && originYPct === oy;
                            const labels: Record<string, string> = {
                              '0,0': '↖',
                              '0.5,0': '↑',
                              '1,0': '↗',
                              '0,0.5': '←',
                              '0.5,0.5': '●',
                              '1,0.5': '→',
                              '0,1': '↙',
                              '0.5,1': '↓',
                              '1,1': '↘',
                            };
                            const label = labels[`${ox},${oy}`] ?? '●';
                            const titles: Record<string, string> = {
                              '0.5,1': 'Bas-centre (défaut : personnages, arbres)',
                              '0.5,0.5': 'Centre (objets petits)',
                              '0,0': 'Haut-gauche (GDevelop style)',
                            };
                            return (
                              <button
                                key={`${ox}-${oy}`}
                                title={titles[`${ox},${oy}`] ?? `Origin (${ox}, ${oy})`}
                                onClick={() => {
                                  setOriginXPct(ox);
                                  setOriginYPct(oy);
                                }}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 5,
                                  fontSize: 14,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  border: isActive
                                    ? '2px solid var(--color-primary)'
                                    : '1px solid var(--color-border-base)',
                                  background: isActive
                                    ? 'rgba(139,92,246,0.22)'
                                    : 'rgba(255,255,255,0.04)',
                                  color: isActive
                                    ? 'var(--color-primary)'
                                    : 'var(--color-text-secondary)',
                                  transition: 'all 0.1s',
                                }}
                              >
                                {label}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 5 }}>
                        Actuel : ({originXPct === 0 ? '0' : originXPct === 1 ? '1' : '½'},{' '}
                        {originYPct === 0 ? '0' : originYPct === 1 ? '1' : '½'})
                        {originXPct === 0.5 && originYPct === 1.0 ? ' — bas-centre ↓' : ''}
                        {originXPct === 0.5 && originYPct === 0.5 ? ' — centre ●' : ''}
                      </p>
                    </div>
                  </>
                )}

                {/* ── TAB COLLISION ─────────────────────────────────────── */}
                {rightTab === 'collision' && (
                  <>
                    {/* 🔲 Collision */}
                    <div>
                      <p style={sectionLabel}>{isObjectMode ? 'Collision' : 'Collision joueur'}</p>
                      {/* Mode toggle */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8, marginTop: 6 }}>
                        {(['box', 'polygon'] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() =>
                              setPlayerCollider(
                                m === 'box'
                                  ? COLL_DEFAULT_BOX
                                  : { mode: 'polygon', points: COLL_DEFAULT_POLY }
                              )
                            }
                            style={{
                              flex: 1,
                              padding: '5px 0',
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              border:
                                playerCollider.mode === m
                                  ? '1.5px solid var(--color-primary)'
                                  : '1px solid var(--color-border-base)',
                              background:
                                playerCollider.mode === m
                                  ? 'rgba(139,92,246,0.18)'
                                  : 'rgba(255,255,255,0.04)',
                              color:
                                playerCollider.mode === m
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text-secondary)',
                              transition: 'all 0.1s',
                            }}
                          >
                            {m === 'box' ? '◻ Box' : '⬡ Polygone'}
                          </button>
                        ))}
                      </div>

                      {playerCollider.mode === 'box' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          {/* Sliders */}
                          <div
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}
                          >
                            {(
                              [
                                { key: 'widthPct', label: 'Largeur', min: 0.1, max: 2 },
                                { key: 'heightPct', label: 'Hauteur', min: 0.1, max: 2 },
                                { key: 'offsetXPct', label: 'Décal. X', min: -1, max: 1 },
                                { key: 'offsetYPct', label: 'Décal. Y', min: -1, max: 1 },
                              ] as {
                                key: keyof typeof playerCollider &
                                  ('widthPct' | 'heightPct' | 'offsetXPct' | 'offsetYPct');
                                label: string;
                                min: number;
                                max: number;
                              }[]
                            ).map(({ key, label, min, max }) => (
                              <label
                                key={key}
                                style={{ ...labelRow, flexDirection: 'column', gap: 2 }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                  }}
                                >
                                  <span style={{ ...labelText, fontSize: 10 }}>{label}</span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: 'var(--color-primary)',
                                      fontWeight: 700,
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {(playerCollider as unknown as Record<string, number>)[
                                      key
                                    ].toFixed(2)}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={min}
                                  max={max}
                                  step={0.025}
                                  value={(playerCollider as unknown as Record<string, number>)[key]}
                                  onChange={(e) =>
                                    setPlayerCollider((prev) =>
                                      prev.mode !== 'box'
                                        ? prev
                                        : { ...prev, [key]: parseFloat(e.target.value) }
                                    )
                                  }
                                  style={{
                                    width: '100%',
                                    accentColor: 'var(--color-primary)',
                                    cursor: 'pointer',
                                  }}
                                />
                              </label>
                            ))}
                          </div>
                          {/* Box preview canvas — masqué en mode objet (overlay sur canvas principal) */}
                          {!isObjectMode && (
                            <canvas
                              ref={collBoxCanvasRef}
                              width={80}
                              height={80}
                              style={{
                                flexShrink: 0,
                                borderRadius: 6,
                                border: '1px solid var(--color-border-base)',
                                imageRendering: 'pixelated',
                              }}
                            />
                          )}
                        </div>
                      )}

                      {playerCollider.mode === 'polygon' &&
                        (() => {
                          const isConvex = collIsConvex(playerCollider.points);
                          return (
                            <div>
                              {/* Canvas */}
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 8,
                                  alignItems: 'flex-start',
                                  marginBottom: 6,
                                }}
                              >
                                <canvas
                                  ref={collPolyCanvasRef}
                                  width={COLL_CS}
                                  height={COLL_CS}
                                  style={{
                                    flexShrink: 0,
                                    borderRadius: 6,
                                    border: `1.5px solid ${isConvex ? 'rgba(80,220,100,0.5)' : 'rgba(255,120,60,0.6)'}`,
                                    cursor: 'crosshair',
                                    imageRendering: 'pixelated',
                                  }}
                                  onMouseDown={handleCollPolyDown}
                                  onMouseMove={handleCollPolyMove}
                                  onMouseUp={handleCollPolyUp}
                                  onMouseLeave={handleCollPolyUp}
                                />
                                <div
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 5,
                                  }}
                                >
                                  {/* Convexity badge */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '3px 7px',
                                      borderRadius: 5,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      background: isConvex
                                        ? 'rgba(80,220,100,0.14)'
                                        : 'rgba(255,120,60,0.14)',
                                      border: `1px solid ${isConvex ? 'rgba(80,220,100,0.4)' : 'rgba(255,120,60,0.4)'}`,
                                      color: isConvex ? 'rgb(80,220,100)' : 'rgb(255,120,60)',
                                    }}
                                  >
                                    {isConvex ? (
                                      '✓ Convexe'
                                    ) : (
                                      <>
                                        <AlertTriangle size={10} /> Concave
                                      </>
                                    )}
                                  </div>
                                  {/* Point count */}
                                  <span
                                    style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
                                  >
                                    {playerCollider.points.length} point
                                    {playerCollider.points.length !== 1 ? 's' : ''}
                                  </span>
                                  {/* Hull button */}
                                  <button
                                    onClick={() =>
                                      setPlayerCollider((prev) =>
                                        prev.mode !== 'polygon'
                                          ? prev
                                          : { ...prev, points: collGrahamScan(prev.points) }
                                      )
                                    }
                                    style={{
                                      padding: '4px 0',
                                      borderRadius: 5,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      border: '1px solid var(--color-border-base)',
                                      background: 'rgba(255,255,255,0.05)',
                                      color: 'var(--color-text-secondary)',
                                    }}
                                  >
                                    Enveloppe convexe
                                  </button>
                                  {/* Delete selected */}
                                  {collSelPtIdx !== null && (
                                    <button
                                      onClick={() => {
                                        setPlayerCollider((prev) => {
                                          if (prev.mode !== 'polygon') return prev;
                                          const pts = prev.points.filter(
                                            (_, i) => i !== collSelPtIdx
                                          );
                                          return { ...prev, points: pts };
                                        });
                                        setCollSelPtIdx(null);
                                      }}
                                      style={{
                                        padding: '4px 0',
                                        borderRadius: 5,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,80,80,0.4)',
                                        background: 'rgba(255,80,80,0.1)',
                                        color: 'rgba(255,100,100,1)',
                                      }}
                                    >
                                      Supprimer pt {collSelPtIdx}
                                    </button>
                                  )}
                                  {/* Reset */}
                                  <button
                                    onClick={() =>
                                      setPlayerCollider({
                                        mode: 'polygon',
                                        points: COLL_DEFAULT_POLY,
                                      })
                                    }
                                    style={{
                                      padding: '4px 0',
                                      borderRadius: 5,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      border: '1px solid var(--color-border-base)',
                                      background: 'rgba(255,255,255,0.04)',
                                      color: 'var(--color-text-secondary)',
                                    }}
                                  >
                                    Réinitialiser
                                  </button>
                                </div>
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 9.5,
                                  color: 'var(--color-text-secondary)',
                                  lineHeight: 1.5,
                                }}
                              >
                                Clic = ajouter · Glisser = déplacer · Zone = tileSize. Excalibur
                                exige un polygone convexe.
                              </p>
                            </div>
                          );
                        })()}
                    </div>
                  </>
                )}

                {/* ── TAB ANIMATIONS ──────────────────────────────────── */}
                {rightTab === 'anims' && (
                  <>
                    {/* Aperçu en temps réel — en haut */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}
                      >
                        <p style={{ ...sectionLabel, marginBottom: 0 }}>Aperçu en temps réel</p>
                        {previewAnim && (
                          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                            <button
                              onClick={() => setIsPlaying((p) => !p)}
                              style={{ ...previewCtrlBtn, color: 'var(--color-primary)' }}
                              title={isPlaying ? 'Pause' : 'Lecture'}
                            >
                              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                            </button>
                            <button
                              onClick={() =>
                                setLoopMode((m) => (m === 'forward' ? 'pingpong' : 'forward'))
                              }
                              style={{
                                ...previewCtrlBtn,
                                color:
                                  loopMode === 'pingpong'
                                    ? 'var(--color-primary)'
                                    : 'var(--color-text-muted)',
                                background:
                                  loopMode === 'pingpong'
                                    ? 'var(--color-primary-15)'
                                    : 'transparent',
                              }}
                              title="Ping-pong"
                            >
                              <RotateCcw size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                      {previewAnim || isObjectMode ? (
                        <div
                          style={{
                            background: 'rgba(0,0,0,0.45)',
                            border: '1px solid var(--color-border-base)',
                            borderRadius: 10,
                            padding: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              backgroundImage:
                                'repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%)',
                              backgroundSize: '10px 10px',
                              borderRadius: 6,
                              overflow: 'hidden',
                              display: 'inline-block',
                              cursor: isObjectMode
                                ? mainCollHover === 'move'
                                  ? 'grab'
                                  : mainCollHover?.startsWith('poly-') ||
                                      mainCollHover === 'tl' ||
                                      mainCollHover === 'br'
                                    ? 'nwse-resize'
                                    : mainCollHover === 'tr' || mainCollHover === 'bl'
                                      ? 'nesw-resize'
                                      : mainCollHover
                                        ? 'pointer'
                                        : 'default'
                                : undefined,
                            }}
                          >
                            <canvas
                              ref={animCanvasRef}
                              width={canvasSize.w}
                              height={canvasSize.h}
                              style={{ display: 'block', imageRendering: 'pixelated' }}
                              onMouseDown={handleMainCanvasMouseDown}
                              onMouseMove={handleMainCanvasMouseMove}
                              onMouseUp={handleMainCanvasMouseUp}
                              onMouseLeave={handleMainCanvasMouseLeave}
                            />
                          </div>
                          {isObjectMode && (
                            <p
                              title="Glisser la hitbox · Coins = redimensionner"
                              style={{
                                margin: '4px 0 0',
                                fontSize: 10,
                                color: 'var(--color-text-secondary)',
                                textAlign: 'center',
                              }}
                            >
                              Hitbox interactive
                            </p>
                          )}
                          {previewTag && (
                            <div style={{ textAlign: 'center' }}>
                              <p
                                style={{
                                  margin: '0 0 2px',
                                  fontSize: 11,
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {getDirLabel(previewTag)}
                                {animations[previewTag]?.flipX && ' 🪞'}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  color: 'var(--color-primary)',
                                  fontWeight: 700,
                                }}
                              >
                                {previewAnim.frames?.length ?? 0} fr @ {previewAnim.fps} fps
                              </p>
                              <p
                                style={{
                                  margin: '2px 0 0',
                                  fontSize: 10,
                                  color: 'rgba(255,255,255,0.3)',
                                }}
                              >
                                {loopMode === 'pingpong' ? '↔ ping-pong' : '→ boucle'}
                                {!isPlaying && ' · ⏸ pause'}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            minHeight: 80,
                            border: '1px dashed var(--color-primary-22)',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: 'var(--color-text-secondary)',
                              textAlign: 'center',
                              lineHeight: 1.6,
                            }}
                          >
                            Assignez une direction
                            <br />
                            pour voir l'aperçu
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Directions (héros) / Animation unique (objet) */}
                    {!isObjectMode ? (
                      <div>
                        <p style={sectionLabel}>Directions</p>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}
                        >
                          {activeGroup.tags.map((tag, i) => {
                            const anim = animations[tag];
                            const isActive = activeTag === tag;
                            const color = DIR_COLORS[i % DIR_COLORS.length];

                            return (
                              <div
                                key={tag}
                                style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                              >
                                <button
                                  onClick={() => {
                                    setActiveTag(isActive ? null : tag);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '7px 9px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    textAlign: 'left',
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
                                    width: '100%',
                                    position: 'relative',
                                  }}
                                >
                                  {/* Mini-canvas animée */}
                                  <div
                                    style={{
                                      width: SPRITE_MINI_CANVAS_SIZE,
                                      height: SPRITE_MINI_CANVAS_SIZE,
                                      flexShrink: 0,
                                      borderRadius: 4,
                                      overflow: 'hidden',
                                      background: 'rgba(0,0,0,0.4)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: anim
                                        ? `1px solid ${color.stroke}44`
                                        : '1px solid rgba(255,255,255,0.06)',
                                    }}
                                  >
                                    {anim ? (
                                      <canvas
                                        ref={(el) => {
                                          miniCanvasRefs.current[tag] = el;
                                        }}
                                        width={SPRITE_MINI_CANVAS_SIZE}
                                        height={SPRITE_MINI_CANVAS_SIZE}
                                        style={{ display: 'block', imageRendering: 'pixelated' }}
                                      />
                                    ) : (
                                      <span style={{ fontSize: 14, opacity: 0.3 }}>?</span>
                                    )}
                                  </div>

                                  {/* Dot statut */}
                                  <span
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      background: anim ? color.stroke : 'rgba(255,255,255,0.15)',
                                      boxShadow: anim ? `0 0 7px ${color.stroke}` : 'none',
                                    }}
                                  />

                                  {/* Label + badge fps */}
                                  <span
                                    style={{
                                      flex: 1,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 13,
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? color.text : 'var(--color-text-base)',
                                      }}
                                    >
                                      {activeGroup.dirs[i]}
                                      {anim?.flipX && (
                                        <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>
                                          🪞
                                        </span>
                                      )}
                                    </span>
                                    {anim && (
                                      <span
                                        style={{
                                          fontSize: 10,
                                          color: anim ? color.text : 'var(--color-text-muted)',
                                          opacity: 0.85,
                                        }}
                                      >
                                        {fmtFrames(anim.frames)} · {anim.fps} fps
                                      </span>
                                    )}
                                  </span>

                                  {/* Bouton miroir (gauche ↔ droite) — toujours visible si anim configurée */}
                                  {anim && getMirrorTag(tag) && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      title={`Créer ${getDirLabel(getMirrorTag(tag)!)} par miroir`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const mirror = getMirrorTag(tag)!;
                                        setAnimations((prev) => ({
                                          ...prev,
                                          [mirror]: {
                                            frames: anim.frames,
                                            fps: anim.fps,
                                            flipX: true,
                                          },
                                        }));
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 22,
                                        height: 22,
                                        borderRadius: 5,
                                        flexShrink: 0,
                                        background: animations[getMirrorTag(tag)!]
                                          ? 'rgba(139,92,246,0.25)'
                                          : 'rgba(255,255,255,0.08)',
                                        border: animations[getMirrorTag(tag)!]
                                          ? '1px solid rgba(139,92,246,0.5)'
                                          : '1px solid rgba(255,255,255,0.12)',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                      }}
                                    >
                                      🪞
                                    </span>
                                  )}

                                  {/* Bouton effacer */}
                                  {anim && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      title="Effacer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAnimations((prev) => {
                                          const next = { ...prev };
                                          delete next[tag];
                                          return next;
                                        });
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.10)',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                      }}
                                    >
                                      <X size={10} style={{ color: 'rgba(255,255,255,0.65)' }} />
                                    </span>
                                  )}
                                </button>
                                {/* FPS inline — visible quand card active et configurée */}
                                {isActive && anim && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '2px 4px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: 'var(--color-text-secondary)',
                                        flexShrink: 0,
                                      }}
                                    >
                                      1
                                    </span>
                                    <input
                                      type="range"
                                      min={1}
                                      max={60}
                                      value={anim.fps}
                                      onChange={(e) =>
                                        setAnimations((prev) => ({
                                          ...prev,
                                          [tag]: { ...prev[tag]!, fps: parseInt(e.target.value) },
                                        }))
                                      }
                                      style={{
                                        flex: 1,
                                        accentColor: 'var(--color-primary)',
                                        cursor: 'pointer',
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: 'var(--color-primary)',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {anim.fps} fps
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Object mode — animation unique idle_down */
                      <div>
                        <p style={sectionLabel}>Animation</p>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}
                        >
                          {(() => {
                            const tag = OBJECT_ANIM_TAG;
                            const anim = animations[tag];
                            const isActive = activeTag === tag;
                            const color = DIR_COLORS[0];
                            return (
                              <>
                                <button
                                  onClick={() => setActiveTag(isActive ? null : tag)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '7px 9px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    textAlign: 'left',
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
                                    width: '100%',
                                    position: 'relative',
                                  }}
                                >
                                  {/* Mini-canvas */}
                                  <div
                                    style={{
                                      width: SPRITE_MINI_CANVAS_SIZE,
                                      height: SPRITE_MINI_CANVAS_SIZE,
                                      flexShrink: 0,
                                      borderRadius: 4,
                                      overflow: 'hidden',
                                      background: 'rgba(0,0,0,0.4)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: anim
                                        ? `1px solid ${color.stroke}44`
                                        : '1px solid rgba(255,255,255,0.06)',
                                    }}
                                  >
                                    {anim ? (
                                      <canvas
                                        ref={(el) => {
                                          miniCanvasRefs.current[tag] = el;
                                        }}
                                        width={SPRITE_MINI_CANVAS_SIZE}
                                        height={SPRITE_MINI_CANVAS_SIZE}
                                        style={{ display: 'block', imageRendering: 'pixelated' }}
                                      />
                                    ) : (
                                      <span style={{ fontSize: 14, opacity: 0.3 }}>?</span>
                                    )}
                                  </div>
                                  {/* Dot statut */}
                                  <span
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      background: anim ? color.stroke : 'rgba(255,255,255,0.15)',
                                      boxShadow: anim ? `0 0 7px ${color.stroke}` : 'none',
                                    }}
                                  />
                                  {/* Label */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: isActive ? color.stroke : 'var(--color-text-base)',
                                      }}
                                    >
                                      Animation
                                    </p>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: 10,
                                        color: 'var(--color-text-secondary)',
                                      }}
                                    >
                                      {anim
                                        ? `${anim.frames.length} frames · ${anim.fps} fps`
                                        : 'Non configurée'}
                                    </p>
                                  </div>
                                  {/* Clear button */}
                                  {anim && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      title="Effacer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAnimations((prev) => {
                                          const next = { ...prev };
                                          delete next[tag];
                                          return next;
                                        });
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.10)',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                      }}
                                    >
                                      <X size={10} style={{ color: 'rgba(255,255,255,0.65)' }} />
                                    </span>
                                  )}
                                </button>
                                {/* FPS inline — visible quand card active et configurée */}
                                {isActive && anim && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '2px 4px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: 'var(--color-text-secondary)',
                                        flexShrink: 0,
                                      }}
                                    >
                                      1
                                    </span>
                                    <input
                                      type="range"
                                      min={1}
                                      max={60}
                                      value={anim.fps}
                                      onChange={(e) =>
                                        setAnimations((prev) => ({
                                          ...prev,
                                          [tag]: { ...prev[tag]!, fps: parseInt(e.target.value) },
                                        }))
                                      }
                                      style={{
                                        flex: 1,
                                        accentColor: 'var(--color-primary)',
                                        cursor: 'pointer',
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: 'var(--color-primary)',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {anim.fps} fps
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderTop: '1px solid var(--color-border-base)',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {configuredCount > 0
                ? `${configuredCount} animation${configuredCount > 1 ? 's' : ''} configurée${configuredCount > 1 ? 's' : ''}`
                : 'Aucune animation configurée'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Dialog.Close asChild>
                <button style={cancelBtn}>Annuler</button>
              </Dialog.Close>
              <button onClick={handleConfirm} style={confirmBtn}>
                {isObjectMode
                  ? `Confirmer — ${totalFrames} frames`
                  : `Confirmer — ${cols}×${rows} = ${totalFrames} frames`}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// (Style constants → SpriteImportDialog.styles.ts)
