/**
 * useCollisionEditor — Logique interactive de l'éditeur de collider
 *
 * Gère l'état, les handlers souris et le dessin des colliders box/polygon
 * dans SpriteImportDialog (mode 'object').
 *
 * Responsabilités :
 * - State : collSelPtIdx, collDragPtIdx, mainCollDrag, mainCollHover
 * - Refs  : collPolyCanvasRef, collBoxCanvasRef
 * - Handlers canvas principal : mouseDown/Move/Up/Leave
 * - Handlers canvas polygon   : polyDown/Move/Up
 * - Effects : redraw box canvas + redraw polygon canvas
 * - Retourne drawCollisionOverlay(ctx, cw, ch) pour le canvas d'animation
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PlayerColliderConfig } from '@/types/sprite';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MainCollHandle = 'move' | 'tl' | 'tr' | 'bl' | 'br' | `poly-${number}`;

interface UseCollisionEditorParams {
  playerCollider: PlayerColliderConfig;
  setPlayerCollider: React.Dispatch<React.SetStateAction<PlayerColliderConfig>>;
  animCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isObjectMode: boolean;
  canvasSize: { w: number; h: number };
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const COLL_CS = 140; // canvas size (px)
const COLL_CC = 70; // canvas center
const COLL_SC = 48; // px per normalised unit

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCollisionEditor({
  playerCollider,
  setPlayerCollider,
  animCanvasRef,
  isObjectMode,
  canvasSize,
}: UseCollisionEditorParams) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [collSelPtIdx, setCollSelPtIdx] = useState<number | null>(null);
  const [collDragPtIdx, setCollDragPtIdx] = useState<number | null>(null);
  const [mainCollDrag, setMainCollDrag] = useState<{
    handle: MainCollHandle;
    startMx: number;
    startMy: number;
    startCollider: PlayerColliderConfig;
  } | null>(null);
  const [mainCollHover, setMainCollHover] = useState<MainCollHandle | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const collPolyCanvasRef = useRef<HTMLCanvasElement>(null);
  const collBoxCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Normalised ↔ canvas coordinate conversion ─────────────────────────────
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

  // ── Hit-test helpers ───────────────────────────────────────────────────────
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

  // ── Geometry helpers ───────────────────────────────────────────────────────
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

  // ── Main canvas handlers ───────────────────────────────────────────────────
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

  // ── Polygon canvas handlers ────────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerCollider, collCanvasToNorm, collHitTest] // setPlayerCollider est un setter stable
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collDragPtIdx, playerCollider.mode, collCanvasToNorm] // setPlayerCollider est un setter stable
  );

  const handleCollPolyUp = useCallback(() => setCollDragPtIdx(null), []);

  // ── Draw effects ───────────────────────────────────────────────────────────

  // Box preview canvas
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

  // Polygon canvas
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

  // ── Collision overlay for main preview canvas ──────────────────────────────
  const drawCollisionOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
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
        // Corner handles
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
        // Vertex handles
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
    },
    [playerCollider]
  );

  return {
    // State
    collSelPtIdx,
    setCollSelPtIdx,
    mainCollHover,
    // Refs
    collPolyCanvasRef,
    collBoxCanvasRef,
    // Handlers — main canvas
    handleMainCanvasMouseDown,
    handleMainCanvasMouseMove,
    handleMainCanvasMouseUp,
    handleMainCanvasMouseLeave,
    // Handlers — polygon canvas
    handleCollPolyDown,
    handleCollPolyMove,
    handleCollPolyUp,
    // Overlay draw
    drawCollisionOverlay,
    // Geometry helpers (needed by parent for "delete point", "convex hull" etc.)
    collGrahamScan,
    collIsConvex,
  };
}
