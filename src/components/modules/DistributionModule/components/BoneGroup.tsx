import React, { useRef, useCallback } from 'react';
import { Group, Line, Circle, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Bone, SpritePart, BoneTool } from '@/types/bone';
import { getBoneChildren } from '../utils/boneUtils';

// Fallbacks stables — évite les [] inline dans les props (konva-patterns §16)
const EMPTY_PARTS: SpritePart[] = [];
const EMPTY_CHILDREN: Bone[] = [];

interface BoneGroupProps {
  bone: Bone;
  allBones: Bone[];
  allParts: SpritePart[];
  imageCache: Map<string, HTMLImageElement>;
  activeTool: BoneTool;
  selectedBoneId: string | null;
  /** Rotation override depuis une pose — undefined = utiliser bone.rotation */
  rotationOverride?: number;
  overridesMap?: Record<string, { rotation: number }>;
  onSelectBone: (boneId: string) => void;
  onRotateBone: (boneId: string, angleDeg: number) => void;
}

/**
 * BoneGroup — <Group> Konva récursif (FK automatique via imbrication).
 *
 * Architecture FK : chaque os = un Group positionné à (bone.localX, bone.localY) avec
 * rotation locale. Les enfants sont positionnés au tip de l'os (x=bone.length, y=0).
 * node.getAbsoluteTransform() donne la position monde gratuitement (konva-patterns §12).
 *
 * Fix #1 : id="bone-pivot-{id}" sur le pivot Circle pour l'overlay BoneCanvasView.
 * Fix #4 : pivotAbsRef capturé à onDragStart → atan2 correct + dragBoundFunc bloque visuellement.
 *
 * Checklist konva-patterns respectée :
 * §5  dragBoundFunc retourne la position pivot locked — pas de déplacement visuel
 * §6  listening={false} sur KonvaImage parts
 * §10 imageSmoothingEnabled={false} sur KonvaImage
 * §16 EMPTY_* constantes module-level
 * §17 pas de prop style sur nœuds Konva
 */
const BoneGroupInner = ({
  bone,
  allBones,
  allParts,
  imageCache,
  activeTool,
  selectedBoneId,
  rotationOverride,
  overridesMap,
  onSelectBone,
  onRotateBone,
}: BoneGroupProps) => {
  const isSelected = bone.id === selectedBoneId;
  const rotation = rotationOverride ?? bone.rotation;
  const children = getBoneChildren(allBones, bone.id) ?? EMPTY_CHILDREN;
  const parts = allParts.filter((p) => p.boneId === bone.id) ?? EMPTY_PARTS;

  // Fix #4 : pivot abs pos capturé à dragStart pour éviter drift si dragBoundFunc
  // réinitialise la position à chaque frame (konva-patterns §5 étendu).
  const pivotAbsRef = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // La Line est à (0,0) local dans le Group → son abs pos = pivot abs pos du bone
    pivotAbsRef.current = { ...e.target.getAbsolutePosition() };
  }, []);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (activeTool !== 'rotate') return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      // Utiliser la pos capturée (même système de coords que getPointerPosition — §2)
      const pivot = pivotAbsRef.current ?? e.target.getAbsolutePosition();
      const angle = Math.atan2(pointer.y - pivot.y, pointer.x - pivot.x) * (180 / Math.PI);
      onRotateBone(bone.id, angle);
    },
    [activeTool, bone.id, onRotateBone]
  );

  // dragBoundFunc : lock la Line sur la position pivot — pas de déplacement visuel (§5)
  const handleDragBound = useCallback(() => {
    return pivotAbsRef.current ?? { x: 0, y: 0 };
  }, []);

  return (
    <Group x={bone.localX} y={bone.localY} rotation={rotation}>
      {/* Parts de cet os — triées par zOrder, rendues derrière le stick */}
      {parts
        .slice()
        .sort((a, b) => a.zOrder - b.zOrder)
        .map((part) => {
          const img = imageCache.get(part.assetUrl);
          if (!img) return null;
          return (
            <KonvaImage
              key={part.id}
              x={part.offsetX}
              y={part.offsetY}
              width={part.width}
              height={part.height}
              image={img}
              imageSmoothingEnabled={false}
              listening={false}
            />
          );
        })}

      {/* Stick visuel de l'os */}
      <Line
        points={[0, 0, bone.length, 0]}
        stroke={isSelected ? '#c4b5fd' : bone.color}
        strokeWidth={isSelected ? 3 : 2}
        hitStrokeWidth={12}
        onClick={() => onSelectBone(bone.id)}
        draggable={activeTool === 'rotate'}
        dragBoundFunc={handleDragBound}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
      />

      {/* Pivot (origine de l'os) — id identifiable par BoneCanvasView OverlayLayer (Fix #1) */}
      <Circle
        id={`bone-pivot-${bone.id}`}
        radius={6}
        fill={isSelected ? '#c4b5fd' : bone.color}
        onClick={() => onSelectBone(bone.id)}
      />

      {/* Tip (extrémité de l'os) */}
      <Circle x={bone.length} radius={3} fill={bone.color} listening={false} />

      {/* Enfants — positionnés au tip (x=bone.length dans le Group local) */}
      <Group x={bone.length}>
        {children.map((child) => (
          <BoneGroup
            key={child.id}
            bone={child}
            allBones={allBones}
            allParts={allParts}
            imageCache={imageCache}
            activeTool={activeTool}
            selectedBoneId={selectedBoneId}
            rotationOverride={overridesMap?.[child.id]?.rotation}
            overridesMap={overridesMap}
            onSelectBone={onSelectBone}
            onRotateBone={onRotateBone}
          />
        ))}
      </Group>
    </Group>
  );
};

export const BoneGroup = React.memo(BoneGroupInner);
