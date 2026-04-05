import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  Stage,
  Layer,
  Line,
  Group,
  Circle,
  RegularPolygon,
  Image as KonvaImage,
} from 'react-konva';
import type Konva from 'konva';
import { useRigStore } from '@/stores/rigStore';
import type { BoneTool, CharacterRig } from '@/types/bone';
import { BONE_DEFAULT_COLORS, DEFAULT_BONE_LENGTH } from '@/types/bone';
import {
  getRootBones,
  getBoneChain,
  computeChainWorldState,
  fabrikToRotations,
} from '../utils/boneUtils';
import { solveFabrik } from '@/utils/fabrik';
import { useBoneImageCache } from '../hooks/useBoneImageCache';
import { BoneGroup } from './BoneGroup';
import { AvatarPicker } from '@/components/tabs/characters/components/AvatarPicker';

// Fallbacks stables (konva-patterns §16, Acton §15.4)
const EMPTY_BONES: CharacterRig['bones'] = [];
const EMPTY_PARTS: CharacterRig['parts'] = [];
const EMPTY_IK_CHAINS: CharacterRig['ikChains'] = [];

// Grille de fond
const GRID_COLOR = 'rgba(255,255,255,0.04)';
const GRID_SIZE = 40;

// Bouton zoom toolbar
const ZOOM_BTN: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  padding: '2px 5px',
  borderRadius: 5,
  lineHeight: 1,
};

interface BoneCanvasViewProps {
  characterId: string;
  activeTool: BoneTool;
  selectedBoneId: string | null;
  zoom: number;
  stagePos: { x: number; y: number };
  onSelectBone: (boneId: string | null) => void;
  onZoomChange: (zoom: number) => void;
  onStagePosChange: (pos: { x: number; y: number }) => void;
  /** URL du sprite du personnage à superposer derrière le squelette (mode Réf.) */
  referenceImageUrl?: string;
  /** Afficher le sprite de référence semi-transparent */
  showRefImage?: boolean;
  /** Échelle de l'image de référence (0.3 → 1.5, défaut 0.6) */
  refScale?: number;
  /** Opacité de l'image de référence (0.1 → 0.8, défaut 0.45) */
  refOpacity?: number;
  /** Overrides de rotation boneId→{rotation} à appliquer aux os (preview de pose au survol) */
  overridesMap?: Record<string, { rotation: number }>;
  /** Nom du personnage actif — affiché dans le nameplate en-tête (UX-6) */
  characterName?: string;
  /** Avatar URL du personnage actif — affiché dans le nameplate en-tête (UX-6) */
  characterAvatarUrl?: string;
}

/**
 * BoneCanvasView — Stage Konva 3 layers pour l'éditeur osseux FK + IK.
 *
 * Layer 1 : fond + grille (listening=false)
 * Layer 2 : RigLayer — <BoneGroup> récursif
 * Layer 3 : OverlayLayer — anneau sélection + diamants IK
 *
 * Checklist konva-patterns :
 * §1  dragend guard : if (e.target !== stageRef.current) return
 * §7  PAS de destroy() dans cleanup
 * §8  touchAction: 'none' sur wrapper div
 * §12 guard getStage() avant getAbsolutePosition()
 * §16 EMPTY_* module-level
 * §17 pas de prop style sur nœuds Konva
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
  referenceImageUrl,
  showRefImage = false,
  refScale = 0.6,
  refOpacity = 0.45,
  overridesMap,
  characterName,
  characterAvatarUrl,
}: BoneCanvasViewProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Store data ─────────────────────────────────────────────────────────────
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const bones = rig?.bones ?? EMPTY_BONES;
  const parts = rig?.parts ?? EMPTY_PARTS;
  const ikChains = rig?.ikChains ?? EMPTY_IK_CHAINS;

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

  // ── Sprite de référence (konva-patterns §15 : cancelled flag) ────────────
  const [refImgElement, setRefImgElement] = useState<HTMLImageElement | null>(null);
  // Position locale de l'image de référence (draggable, non persistée)
  const [refImgOffset, setRefImgOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!referenceImageUrl || !showRefImage) {
      setRefImgElement(null);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setRefImgElement(img);
    };
    img.src = referenceImageUrl;
    return () => {
      cancelled = true;
    };
  }, [referenceImageUrl, showRefImage]);

  // ── Auto-centrage au premier rendu (stagePos initial = {0,0}) ───────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const originX = rig?.originX ?? 300;
    const originY = rig?.originY ?? 100;
    onStagePosChange({
      x: width / 2 - originX,
      y: height / 2 - originY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionnel : centrage unique au montage

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

  // ── IK — positions monde des end effectors ────────────────────────────────
  const ikEndEffectors = useMemo(() => {
    if (!rig || activeTool !== 'ik') return [];
    const result: { chainId: string; x: number; y: number }[] = [];
    for (const chain of ikChains) {
      const boneChain = getBoneChain(chain.rootBoneId, chain.endBoneId, bones);
      if (!boneChain) continue;
      const { joints } = computeChainWorldState(boneChain, bones, rig.originX, rig.originY);
      // joints[last] = tip du dernier os = end effector
      const tip = joints[joints.length - 1];
      result.push({ chainId: chain.id, x: tip.x, y: tip.y });
    }
    return result;
  }, [rig, bones, ikChains, activeTool]);

  // ── IK drag handler ───────────────────────────────────────────────────────
  const handleIkDragMove = useCallback(
    (chainId: string, worldX: number, worldY: number) => {
      if (!rig) return;
      const chain = ikChains.find((c) => c.id === chainId);
      if (!chain) return;
      const boneChain = getBoneChain(chain.rootBoneId, chain.endBoneId, bones);
      if (!boneChain) return;

      const { joints, lengths } = computeChainWorldState(
        boneChain,
        bones,
        rig.originX,
        rig.originY
      );
      const solved = solveFabrik(joints, lengths, worldX, worldY);
      const rotMap = fabrikToRotations(solved, boneChain);

      const state = useRigStore.getState();
      rotMap.forEach((rotation, boneId) => {
        state.updateBone(rig.id, boneId, { rotation });
      });
    },
    [rig, bones, ikChains]
  );

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

  // ── Curseur poignées resize ────────────────────────────────────────────────
  const [resizeCursor, setResizeCursor] = useState<string | null>(null);

  // ── Guard konva §4 : désactiver Stage drag quand RefImage est hovered ────
  const [refImageHovered, setRefImageHovered] = useState(false);

  /** Mise à jour de la taille d'un SpritePart via les poignées canvas (getState() dans handler) */
  const handleResizePart = useCallback(
    (partId: string, patch: { width?: number; height?: number }) => {
      const r = useRigStore.getState().rigs.find((r) => r.characterId === characterId);
      if (!r) return;
      useRigStore.getState().updatePart(r.id, partId, patch);
    },
    [characterId]
  );

  /** Mise à jour de la position d'un SpritePart via drag direct sur le canvas */
  const handleMovePart = useCallback(
    (partId: string, patch: { offsetX: number; offsetY: number }) => {
      const r = useRigStore.getState().rigs.find((r) => r.characterId === characterId);
      if (!r) return;
      useRigStore.getState().updatePart(r.id, partId, patch);
    },
    [characterId]
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

  // ── Curseur selon outil — resizeCursor prioritaire (§17 — CSS sur wrapper) ─
  const cursorStyle =
    resizeCursor ??
    (activeTool === 'rotate'
      ? 'crosshair'
      : activeTool === 'add-bone'
        ? 'cell'
        : activeTool === 'add-part'
          ? 'copy'
          : activeTool === 'ik'
            ? 'grab'
            : 'default');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Nameplate en-tête — identité du personnage en cours d'édition (UX-6 Norman §9.4) */}
      {characterName && (
        <div
          style={{
            height: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 10px',
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border-base)',
            flexShrink: 0,
          }}
        >
          {characterAvatarUrl && (
            <img
              src={characterAvatarUrl}
              alt={characterName}
              style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: '50%' }}
            />
          )}
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            ✏️ Édition :{' '}
            <strong style={{ color: 'var(--color-text-secondary)' }}>{characterName}</strong>
          </span>
        </div>
      )}

      {/* §8 touchAction: 'none' sur le wrapper div */}
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
          draggable={activeTool === 'select' && !refImageHovered}
          onDragEnd={handleStageDragEnd}
          onWheel={handleWheel}
          onClick={handleStageClick}
        >
          {/* Layer 1 : fond + grille + sprite de référence */}
          <Layer listening={showRefImage && !!refImgElement}>
            {gridKonvaLines}
            {showRefImage && refImgElement && (
              <RefImage
                image={refImgElement}
                originX={rig?.originX ?? 300}
                originY={rig?.originY ?? 280}
                offset={refImgOffset}
                onOffsetChange={setRefImgOffset}
                scale={refScale}
                opacity={refOpacity}
                onMouseEnter={() => setRefImageHovered(true)}
                onMouseLeave={() => setRefImageHovered(false)}
              />
            )}
          </Layer>

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
                  overridesMap={overridesMap}
                  rotationOverride={overridesMap?.[bone.id]?.rotation}
                  onSelectBone={onSelectBone}
                  onRotateBone={handleRotateBone}
                  zoom={zoom}
                  onResizePart={handleResizePart}
                  onMovePart={handleMovePart}
                  onCursorChange={setResizeCursor}
                />
              ))}
            </Group>
          </Layer>

          {/* Layer 3 : overlay sélection + end effectors IK */}
          <Layer listening={activeTool === 'ik'}>
            {/* Anneau de sélection */}
            {overlayPos && activeTool !== 'ik' && (
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

            {/* Diamants IK — end effectors draggables */}
            {activeTool === 'ik' &&
              ikEndEffectors.map(({ chainId, x, y }) => (
                <IkHandle
                  key={`ik-${chainId}`}
                  x={x}
                  y={y}
                  chainId={chainId}
                  zoom={zoom}
                  onDragMove={handleIkDragMove}
                />
              ))}
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
              {/* Import depuis l'ordinateur — Bug 3 */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  marginBottom: 8,
                  borderRadius: 6,
                  border: '1px dashed var(--color-border-hover)',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
                }}
              >
                📂 Depuis l'ordinateur
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // FileReader → Data URL (base64) persistable dans localStorage.
                    // URL.createObjectURL() produit des blob: URLs éphémères (session uniquement)
                    // → l'image disparaît après un refresh (tauri-patterns §1).
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (dataUrl) handleAddPart(dataUrl);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <AvatarPicker mood="default" onSelect={(_mood, url) => handleAddPart(url)} />
            </div>
          </div>
        )}

        {/* Toolbar zoom — overlay bas-droit (Nijman §8.1 : feedback < 100ms) */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(17,19,24,0.88)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 8,
            padding: '3px 5px',
          }}
        >
          <button
            type="button"
            title="Recentrer la vue"
            onClick={() => {
              onZoomChange(1);
              onStagePosChange({
                x: canvasSize.w / 2 - (rig?.originX ?? 300),
                y: canvasSize.h / 2 - (rig?.originY ?? 100),
              });
            }}
            style={ZOOM_BTN}
          >
            ⊡
          </button>
          <button
            type="button"
            title="Dézoom"
            onClick={() => onZoomChange(Math.max(0.1, zoom * 0.85))}
            style={ZOOM_BTN}
          >
            −
          </button>
          <button
            type="button"
            title="Reset 100%"
            onClick={() => {
              onZoomChange(1);
              onStagePosChange({
                x: canvasSize.w / 2 - (rig?.originX ?? 300),
                y: canvasSize.h / 2 - (rig?.originY ?? 100),
              });
            }}
            style={{ ...ZOOM_BTN, minWidth: 38, fontVariantNumeric: 'tabular-nums' }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            title="Zoom"
            onClick={() => onZoomChange(Math.min(8, zoom * 1.18))}
            style={ZOOM_BTN}
          >
            +
          </button>
        </div>

        {/* Message vide */}
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
      {/* end canvas wrapper */}
    </div>
  );
}

// ── RefImage — sprite de référence draggable (Spine/DragonBones style) ──────

interface RefImageProps {
  image: HTMLImageElement;
  originX: number;
  originY: number;
  offset: { x: number; y: number };
  onOffsetChange: (offset: { x: number; y: number }) => void;
  scale: number;
  opacity: number;
  /** konva §4 — guard Stage drag quand RefImage hovered */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * KonvaImage draggable pour le sprite de référence.
 * Centré horizontalement sur l'origine du rig, pieds alignés sur le pivot.
 * Le drag accumule l'offset dans le state parent (konva-patterns §5).
 */
function RefImage({
  image,
  originX,
  originY,
  offset,
  onOffsetChange,
  scale,
  opacity,
  onMouseEnter,
  onMouseLeave,
}: RefImageProps) {
  const w = image.width * scale;
  const h = image.height * scale;
  const baseX = originX - w / 2;
  const baseY = originY - h;

  return (
    <KonvaImage
      image={image}
      x={baseX + offset.x}
      y={baseY + offset.y}
      width={w}
      height={h}
      opacity={opacity}
      draggable
      imageSmoothingEnabled={false}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragEnd={(e) => {
        onOffsetChange({
          x: e.target.x() - baseX,
          y: e.target.y() - baseY,
        });
      }}
    />
  );
}

// ── IkHandle — diamant IK draggable ─────────────────────────────────────────

interface IkHandleProps {
  x: number;
  y: number;
  chainId: string;
  zoom: number;
  onDragMove: (chainId: string, worldX: number, worldY: number) => void;
}

/**
 * Diamant IK draggable.
 * Placé directement dans un Layer → x/y = coordonnées monde (§2 konva-patterns).
 * e.target.x()/y() retourne déjà les coords monde après drag — pas de conversion.
 */
function IkHandle({ x, y, chainId, zoom, onDragMove }: IkHandleProps) {
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // e.target.x()/y() = position monde (Layer hérite du Stage transform)
      onDragMove(chainId, e.target.x(), e.target.y());
    },
    [chainId, onDragMove]
  );

  return (
    <RegularPolygon
      x={x}
      y={y}
      sides={4}
      radius={10 / zoom}
      fill="rgba(251,191,36,0.9)"
      stroke="#fbbf24"
      strokeWidth={1.5 / zoom}
      rotation={45}
      draggable
      onDragMove={handleDragMove}
    />
  );
}
