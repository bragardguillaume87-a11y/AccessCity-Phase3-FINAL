import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Stage, Layer, Line, Group, Circle } from 'react-konva';
import type Konva from 'konva';
import { useRigStore } from '@/stores/rigStore';
import type { BoneTool, CharacterRig } from '@/types/bone';
import { BONE_DEFAULT_COLORS, DEFAULT_BONE_LENGTH } from '@/types/bone';
import { getRootBones } from '../utils/boneUtils';
import { useBoneImageCache } from '../hooks/useBoneImageCache';
import { BoneGroup } from './BoneGroup';
import { AvatarPicker } from '@/components/tabs/characters/components/AvatarPicker';

// Fallbacks stables (konva-patterns §16, Acton §15.4)
const EMPTY_BONES: CharacterRig['bones'] = [];
const EMPTY_PARTS: CharacterRig['parts'] = [];

// Grille de fond
const GRID_COLOR = 'rgba(255,255,255,0.04)';
const GRID_SIZE = 40;

interface BoneCanvasViewProps {
  characterId: string;
  activeTool: BoneTool;
  selectedBoneId: string | null;
  zoom: number;
  stagePos: { x: number; y: number };
  onSelectBone: (boneId: string | null) => void;
  onZoomChange: (zoom: number) => void;
  onStagePosChange: (pos: { x: number; y: number }) => void;
}

/**
 * BoneCanvasView — Stage Konva 3 layers pour l'éditeur osseux FK.
 *
 * Layer 1 : fond + grille (listening=false)
 * Layer 2 : RigLayer — <BoneGroup> récursif
 * Layer 3 : OverlayLayer — anneau de sélection (position absolue via getAbsolutePosition)
 *
 * Checklist konva-patterns :
 * §1  dragend guard : if (e.target !== stageRef.current) return
 * §7  PAS de destroy() dans cleanup
 * §8  touchAction: 'none' sur wrapper div
 * §12 guard getStage() avant getAbsolutePosition() dans OverlayLayer
 * §16 EMPTY_* module-level
 * §17 pas de prop style sur nœuds Konva (cursor géré sur wrapper div)
 * §20 3 layers ≤ 7
 */
export function BoneCanvasView({
  characterId,
  activeTool,
  selectedBoneId,
  zoom,
  stagePos,
  onSelectBone,
  onZoomChange,
  onStagePosChange,
}: BoneCanvasViewProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Store data ─────────────────────────────────────────────────────────────
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const bones = rig?.bones ?? EMPTY_BONES;
  const parts = rig?.parts ?? EMPTY_PARTS;

  // ── Image cache (konva-patterns §15) ──────────────────────────────────────
  const imageCache = useBoneImageCache(parts);

  // ── Root bones (points d'entrée récursion) ────────────────────────────────
  const rootBones = useMemo(() => getRootBones(bones), [bones]);

  // ── Canvas dimensions (ResizeObserver) ────────────────────────────────────
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 400 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Grille de fond (Konva Lines, listening=false) ─────────────────────────
  const gridKonvaLines = useMemo(() => {
    const items: React.ReactNode[] = [];
    const cols = Math.ceil(canvasSize.w / GRID_SIZE) + 2;
    const rows = Math.ceil(canvasSize.h / GRID_SIZE) + 2;
    for (let i = 0; i <= cols; i++) {
      items.push(
        <Line
          key={`gv${i}`}
          points={[i * GRID_SIZE, 0, i * GRID_SIZE, canvasSize.h]}
          stroke={GRID_COLOR}
          strokeWidth={1}
          listening={false}
        />
      );
    }
    for (let j = 0; j <= rows; j++) {
      items.push(
        <Line
          key={`gh${j}`}
          points={[0, j * GRID_SIZE, canvasSize.w, j * GRID_SIZE]}
          stroke={GRID_COLOR}
          strokeWidth={1}
          listening={false}
        />
      );
    }
    return items;
  }, [canvasSize]);

  // ── Position absolue du joint sélectionné pour l'overlay ─────────────────
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!selectedBoneId) {
      setOverlayPos(null);
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    // §12 guard : findOne + getStage() avant getAbsolutePosition()
    const node = stage.findOne(`#bone-pivot-${selectedBoneId}`);
    if (!node || !node.getStage()) {
      setOverlayPos(null);
      return;
    }
    setOverlayPos(node.getAbsolutePosition());
  }, [selectedBoneId, bones, zoom, stagePos]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Pan — guard §1 */
  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target !== stageRef.current) return;
      onStagePosChange({ x: e.target.x(), y: e.target.y() });
    },
    [onStagePosChange]
  );

  /** Zoom molette */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const scaleBy = 1.08;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = Math.min(
        Math.max(e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.1),
        8
      );
      onZoomChange(newScale);
      onStagePosChange({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [onZoomChange, onStagePosChange]
  );

  // ── Add-part picker (Fix #3) ──────────────────────────────────────────────
  const [showPartPicker, setShowPartPicker] = useState(false);

  const handleAddPart = useCallback(
    (assetUrl: string) => {
      if (!assetUrl || !selectedBoneId) return;
      const state = useRigStore.getState();
      const r = state.rigs.find((rig) => rig.characterId === characterId);
      if (!r) return;
      const zOrder = r.parts.filter((p) => p.boneId === selectedBoneId).length;
      state.addPart(r.id, {
        boneId: selectedBoneId,
        assetUrl,
        offsetX: 0,
        offsetY: 0,
        width: 64,
        height: 88,
        zOrder,
      });
      setShowPartPicker(false);
    },
    [characterId, selectedBoneId]
  );

  /** Clic sur fond vide */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== stageRef.current) return;

      if (activeTool === 'add-bone') {
        const stage = stageRef.current;
        if (!stage) return;
        // getState() dans un handler — pattern correct (CLAUDE.md §3)
        const state = useRigStore.getState();
        let rigId = state.rigs.find((r) => r.characterId === characterId)?.id;
        if (!rigId) rigId = state.addRig(characterId);

        const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
        const worldX = (pointer.x - stage.x()) / stage.scaleX();
        const worldY = (pointer.y - stage.y()) / stage.scaleY();

        const boneCount =
          useRigStore.getState().rigs.find((r) => r.id === rigId)?.bones.length ?? 0;
        const color = BONE_DEFAULT_COLORS[boneCount % BONE_DEFAULT_COLORS.length];

        useRigStore.getState().addBone(rigId, {
          name: `Os ${boneCount + 1}`,
          parentId: selectedBoneId,
          localX: worldX,
          localY: worldY,
          length: DEFAULT_BONE_LENGTH,
          rotation: 0,
          color,
        });
        return;
      }

      if (activeTool === 'add-part') {
        if (selectedBoneId) {
          setShowPartPicker(true);
        }
        return;
      }

      onSelectBone(null);
    },
    [activeTool, characterId, selectedBoneId, onSelectBone]
  );

  /** Rotation FK */
  const handleRotateBone = useCallback(
    (boneId: string, angleDeg: number) => {
      const r = useRigStore.getState().rigs.find((r) => r.characterId === characterId);
      if (!r) return;
      useRigStore.getState().updateBone(r.id, boneId, { rotation: angleDeg });
    },
    [characterId]
  );

  // ── Curseur selon outil (§17 — CSS sur wrapper, pas prop style Konva) ─────
  const cursorStyle =
    activeTool === 'rotate'
      ? 'crosshair'
      : activeTool === 'add-bone'
        ? 'cell'
        : activeTool === 'add-part'
          ? 'copy'
          : 'default';

  return (
    // §8 touchAction: 'none' sur le wrapper div
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        cursor: cursorStyle,
        touchAction: 'none',
        position: 'relative',
      }}
    >
      <Stage
        ref={stageRef}
        width={canvasSize.w}
        height={canvasSize.h}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={activeTool === 'select'}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        {/* Layer 1 : fond + grille (listening=false) */}
        <Layer listening={false}>{gridKonvaLines}</Layer>

        {/* Layer 2 : rig (FK via Groups imbriqués) */}
        <Layer>
          <Group x={rig?.originX ?? 300} y={rig?.originY ?? 100}>
            {rootBones.map((bone) => (
              <BoneGroup
                key={bone.id}
                bone={bone}
                allBones={bones}
                allParts={parts}
                imageCache={imageCache}
                activeTool={activeTool}
                selectedBoneId={selectedBoneId}
                onSelectBone={onSelectBone}
                onRotateBone={handleRotateBone}
              />
            ))}
          </Group>
          {/* Pivots désormais identifiés dans BoneGroup (Fix #1) — pas de circles orphelins ici */}
        </Layer>

        {/* Layer 3 : overlay sélection (déclaratif, listening=false) */}
        <Layer listening={false}>
          {overlayPos && (
            <Circle
              x={overlayPos.x}
              y={overlayPos.y}
              radius={14}
              stroke="#c4b5fd"
              strokeWidth={2}
              fill="rgba(196,181,253,0.12)"
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Overlay sélecteur de sprite — outil add-part (Fix #3) */}
      {showPartPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPartPicker(false);
          }}
        >
          <div
            style={{
              background: 'var(--color-bg-elevated)',
              borderRadius: 10,
              padding: 16,
              width: 320,
              maxHeight: 480,
              overflowY: 'auto',
              border: '1px solid var(--color-border-base)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                🖼 Sprite pour l'os sélectionné
              </p>
              <button
                type="button"
                onClick={() => setShowPartPicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--color-text-muted)',
                }}
              >
                ✕
              </button>
            </div>
            <AvatarPicker mood="default" onSelect={(_mood, url) => handleAddPart(url)} />
          </div>
        </div>
      )}

      {/* Message vide — positionné en CSS sur le wrapper */}
      {bones.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🦴</p>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Aucun os</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>
              Sélectionne <strong>+ Os</strong> et clique sur le canvas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
