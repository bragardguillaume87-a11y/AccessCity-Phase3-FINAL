import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Group, Line, Circle, Rect, Text, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Bone, BoneFrameState, SpritePart, BoneTool } from '@/types/bone';
import { getBoneChildren } from '../utils/boneUtils';

/** Taille minimale d'un sprite redimensionné en pixels */
const MIN_SPRITE_SIZE = 8;

interface BoneGroupProps {
  bone: Bone;
  allBones: Bone[];
  allParts: SpritePart[];
  imageCache: Map<string, HTMLImageElement>;
  activeTool: BoneTool;
  selectedBoneId: string | null;
  /** Rotation override depuis une pose — undefined = utiliser bone.rotation */
  rotationOverride?: number;
  overridesMap?: Record<string, BoneFrameState>;
  onSelectBone: (boneId: string) => void;
  onRotateBone: (boneId: string, angleDeg: number) => void;
  /** Rotation monde accumulée depuis la racine — pour contre-rotation du label (toujours horizontal) */
  parentWorldRotation?: number;
  /** Zoom courant du Stage — pour maintenir les handles à taille constante à l'écran */
  zoom?: number;
  /** Callback appelé quand l'utilisateur redimensionne le sprite via les poignées */
  onResizePart?: (partId: string, patch: { width?: number; height?: number }) => void;
  /** Callback pour piloter le curseur CSS du wrapper depuis les poignées */
  onCursorChange?: (cursor: string | null) => void;
  /** Callback appelé quand l'utilisateur déplace le sprite par drag sur le canvas */
  onMovePart?: (partId: string, patch: { offsetX: number; offsetY: number }) => void;
}

/**
 * Poignées de redimensionnement du sprite de l'os sélectionné.
 * Placées dans l'espace LOCAL de l'os → e.target.x()/y() = coords os-local directement.
 * 3 cercles : droit (largeur), bas (hauteur), coin bas-droit (les deux).
 *
 * L'état previewW/H est géré par le parent (BoneGroupInner) pour que le KonvaImage
 * se redimensionne aussi en temps réel — même source de vérité (konva-patterns §5).
 */
function SpriteResizeHandles({
  part,
  zoom,
  previewW,
  previewH,
  onPreviewChange,
  onResizePart,
  onCursorChange,
}: {
  part: SpritePart;
  zoom: number;
  previewW: number | null;
  previewH: number | null;
  onPreviewChange: (w: number | null, h: number | null) => void;
  onResizePart?: (partId: string, patch: { width?: number; height?: number }) => void;
  onCursorChange?: (cursor: string | null) => void;
}) {
  const bboxW = previewW ?? part.width;
  const bboxH = previewH ?? part.height;

  const r = 7 / zoom;
  const sw = 1.5 / zoom;
  const rx = part.offsetX + bboxW; // bord droit (live)
  const by = part.offsetY + bboxH; // bord bas (live)
  const cy = part.offsetY + bboxH / 2; // centre vertical (live)
  const cx = part.offsetX + bboxW / 2; // centre horizontal (live)

  return (
    <>
      {/* Bounding box en pointillés — dimensions live depuis preview */}
      <Rect
        x={part.offsetX}
        y={part.offsetY}
        width={bboxW}
        height={bboxH}
        fill="transparent"
        stroke="rgba(196,181,253,0.45)"
        strokeWidth={1 / zoom}
        dash={[4 / zoom, 3 / zoom]}
        listening={false}
      />

      {/* Handle droit — redimensionne la largeur */}
      <Circle
        x={rx}
        y={cy}
        radius={r}
        fill="white"
        stroke="rgba(139,92,246,0.9)"
        strokeWidth={sw}
        draggable
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onMouseEnter={() => onCursorChange?.('ew-resize')}
        onMouseLeave={() => onCursorChange?.(null)}
        onDragMove={(e) => {
          e.cancelBubble = true;
          onPreviewChange(
            Math.max(MIN_SPRITE_SIZE, Math.round(e.target.x() - part.offsetX)),
            previewH
          );
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          const newW = Math.max(MIN_SPRITE_SIZE, Math.round(e.target.x() - part.offsetX));
          onResizePart?.(part.id, { width: newW });
          onPreviewChange(null, null);
          e.target.x(part.offsetX + newW);
          e.target.y(part.offsetY + bboxH / 2);
          onCursorChange?.(null);
        }}
      />

      {/* Handle bas — redimensionne la hauteur */}
      <Circle
        x={cx}
        y={by}
        radius={r}
        fill="white"
        stroke="rgba(139,92,246,0.9)"
        strokeWidth={sw}
        draggable
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onMouseEnter={() => onCursorChange?.('ns-resize')}
        onMouseLeave={() => onCursorChange?.(null)}
        onDragMove={(e) => {
          e.cancelBubble = true;
          onPreviewChange(
            previewW,
            Math.max(MIN_SPRITE_SIZE, Math.round(e.target.y() - part.offsetY))
          );
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          const newH = Math.max(MIN_SPRITE_SIZE, Math.round(e.target.y() - part.offsetY));
          onResizePart?.(part.id, { height: newH });
          onPreviewChange(null, null);
          e.target.x(part.offsetX + bboxW / 2);
          e.target.y(part.offsetY + newH);
          onCursorChange?.(null);
        }}
      />

      {/* Handle coin bas-droit — redimensionne les deux (légèrement plus grand, §MapCanvas SE) */}
      <Circle
        x={rx}
        y={by}
        radius={r * 1.3}
        fill="white"
        stroke="rgba(139,92,246,0.9)"
        strokeWidth={sw}
        shadowColor="rgba(139,92,246,0.4)"
        shadowBlur={6 / zoom}
        draggable
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onMouseEnter={() => onCursorChange?.('nwse-resize')}
        onMouseLeave={() => onCursorChange?.(null)}
        onDragMove={(e) => {
          e.cancelBubble = true;
          onPreviewChange(
            Math.max(MIN_SPRITE_SIZE, Math.round(e.target.x() - part.offsetX)),
            Math.max(MIN_SPRITE_SIZE, Math.round(e.target.y() - part.offsetY))
          );
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          const newW = Math.max(MIN_SPRITE_SIZE, Math.round(e.target.x() - part.offsetX));
          const newH = Math.max(MIN_SPRITE_SIZE, Math.round(e.target.y() - part.offsetY));
          onResizePart?.(part.id, { width: newW, height: newH });
          onPreviewChange(null, null);
          e.target.x(part.offsetX + newW);
          e.target.y(part.offsetY + newH);
          onCursorChange?.(null);
        }}
      />
    </>
  );
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
  parentWorldRotation = 0,
  zoom = 1,
  onResizePart,
  onCursorChange,
  onMovePart,
}: BoneGroupProps) => {
  const isSelected = bone.id === selectedBoneId;
  const rotation = rotationOverride ?? bone.rotation;
  // Rotation monde = somme de toutes les rotations parentes + rotation locale
  // Contre-rotation appliquée au <Text> pour qu'il reste toujours horizontal (lisible)
  const worldRotation = parentWorldRotation + rotation;
  // useMemo : allBones/allParts stables depuis le store → ref stable entre frames d'animation
  const children = useMemo(() => getBoneChildren(allBones, bone.id), [allBones, bone.id]);
  // Filtre + tri fusionnés en une seule passe memoïsée (évite le double .sort() au render)
  const sortedParts = useMemo(
    () => allParts.filter((p) => p.boneId === bone.id).sort((a, b) => a.zOrder - b.zOrder),
    [allParts, bone.id]
  );
  // Premier sprite (zOrder le plus bas) — cible des poignées de redimensionnement
  const firstPart = sortedParts[0] ?? null;

  // Capsule cartoon — largeur proportionnelle à la longueur de l'os (Will Wright §4.1)
  const capsuleH = Math.max(10, Math.min(24, bone.length * 0.35));

  // Feedback survol — highlight léger quand la souris passe sur l'os (Norman §9.1 affordance)
  const [isHovered, setIsHovered] = useState(false);

  // Preview dimensions live partagées avec SpriteResizeHandles → KonvaImage se redimensionne aussi
  const [previewW, setPreviewW] = useState<number | null>(null);
  const [previewH, setPreviewH] = useState<number | null>(null);
  const handlePreviewChange = useCallback((w: number | null, h: number | null) => {
    setPreviewW(w);
    setPreviewH(h);
  }, []);

  // Fix #4 : pivot abs pos capturé à dragStart pour éviter drift si dragBoundFunc
  // réinitialise la position à chaque frame (konva-patterns §5 étendu).
  const pivotAbsRef = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // La Line est à (0,0) local dans le Group → son abs pos = pivot abs pos du bone
    pivotAbsRef.current = { ...e.target.getAbsolutePosition() };
  }, []);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // Manipulation directe : toujours actif sauf en mode IK (géré par les diamants overlay)
      if (activeTool === 'ik') return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      // Utiliser la pos capturée (même système de coords que getPointerPosition — §2)
      const pivot = pivotAbsRef.current ?? e.target.getAbsolutePosition();
      const angleWorld = Math.atan2(pointer.y - pivot.y, pointer.x - pivot.x) * (180 / Math.PI);
      // Konva accumule les rotations des Groups imbriqués → bone.rotation est LOCAL.
      // Soustraire la rotation cumulée du parent pour convertir world → local.
      const angleLocal = angleWorld - parentWorldRotation;
      onRotateBone(bone.id, angleLocal);
    },
    [activeTool, bone.id, onRotateBone, parentWorldRotation]
  );

  // dragBoundFunc : lock la Line sur la position pivot — pas de déplacement visuel (§5)
  const handleDragBound = useCallback(() => {
    return pivotAbsRef.current ?? { x: 0, y: 0 };
  }, []);

  return (
    <Group x={bone.localX} y={bone.localY} rotation={rotation}>
      {/* Parts de cet os — triées par zOrder (sortedParts memoïsé) */}
      {sortedParts.map((part) => {
        // Sprite variant par pose — override si une variante est définie pour cet os dans la pose active
        const overrideUrl = overridesMap?.[bone.id]?.spriteUrl;
        const img = imageCache.get(overrideUrl ?? part.assetUrl);
        if (!img) return null;
        const isFirstPart = part.id === firstPart?.id;
        // Le sprite de base (firstPart) est draggable en mode Sélect pour repositionnement
        const isDraggable = isSelected && activeTool === 'select' && isFirstPart;
        // Dimensions live : preview pendant le drag des poignées, sinon valeurs store
        const renderW = isSelected && isFirstPart && previewW !== null ? previewW : part.width;
        const renderH = isSelected && isFirstPart && previewH !== null ? previewH : part.height;
        return (
          <KonvaImage
            key={part.id}
            // Flip en place : décaler x d'une largeur, puis scaleX=-1 dessine vers la gauche
            // → l'image occupe [offsetX, offsetX+renderW] dans les deux cas (konva-patterns §17)
            x={part.flipX ? part.offsetX + renderW : part.offsetX}
            y={part.offsetY}
            width={renderW}
            height={renderH}
            scaleX={part.flipX ? -1 : 1}
            opacity={part.opacity ?? 1}
            rotation={part.spriteRotation ?? 0}
            image={img}
            imageSmoothingEnabled={false}
            listening={isDraggable}
            draggable={isDraggable}
            onMouseDown={
              isDraggable
                ? (e) => {
                    e.cancelBubble = true;
                  }
                : undefined
            }
            onMouseEnter={isDraggable ? () => onCursorChange?.('grab') : undefined}
            onMouseLeave={isDraggable ? () => onCursorChange?.(null) : undefined}
            onDragStart={
              isDraggable
                ? (e) => {
                    e.cancelBubble = true;
                    onCursorChange?.('grabbing');
                  }
                : undefined
            }
            onDragEnd={
              isDraggable
                ? (e) => {
                    e.cancelBubble = true;
                    // e.target.x()/y() = coords locales dans le Group de l'os (konva-patterns §2)
                    const newOffsetX = part.flipX
                      ? Math.round(e.target.x() - renderW)
                      : Math.round(e.target.x());
                    const newOffsetY = Math.round(e.target.y());
                    onMovePart?.(part.id, { offsetX: newOffsetX, offsetY: newOffsetY });
                    onCursorChange?.('grab');
                  }
                : undefined
            }
          />
        );
      })}

      {/* Capsule cartoon — visible quand aucune SpritePart n'est assignée.
          Donne une silhouette lisible sans image (Will Wright §4.1). */}
      {sortedParts.length === 0 && (
        <Rect
          x={0}
          y={-capsuleH / 2}
          width={bone.length}
          height={capsuleH}
          cornerRadius={capsuleH / 2}
          fill={bone.color}
          opacity={0.28}
          listening={false}
        />
      )}

      {/* Label nom de l'os — toujours horizontal (contre-rotation = -worldRotation) */}
      <Text
        x={bone.length * 0.15}
        y={-capsuleH / 2 - 11}
        text={bone.name}
        fontSize={9}
        fill={bone.color}
        opacity={isSelected ? 1 : 0.7}
        listening={false}
        rotation={-worldRotation}
      />

      {/* Stick visuel de l'os */}
      <Line
        points={[0, 0, bone.length, 0]}
        stroke={isSelected ? '#c4b5fd' : bone.color}
        strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 2}
        hitStrokeWidth={12}
        onClick={() => {
          onSelectBone(bone.id);
        }}
        draggable={activeTool !== 'ik'}
        dragBoundFunc={handleDragBound}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onMouseEnter={() => {
          setIsHovered(true);
          onCursorChange?.('pointer');
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onCursorChange?.(null);
        }}
      />

      {/* Pivot (origine de l'os) — id identifiable par BoneCanvasView OverlayLayer (Fix #1) */}
      <Circle
        id={`bone-pivot-${bone.id}`}
        radius={isHovered && !isSelected ? 7 : 6}
        fill={isSelected ? '#c4b5fd' : bone.color}
        onClick={() => {
          onSelectBone(bone.id);
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          onCursorChange?.('pointer');
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onCursorChange?.(null);
        }}
      />

      {/* Tip (extrémité de l'os) */}
      <Circle x={bone.length} radius={3} fill={bone.color} listening={false} />

      {/* Poignées de redimensionnement — outil sélect + sprite assigné (MapCanvas pattern) */}
      {isSelected && activeTool === 'select' && firstPart && (
        <SpriteResizeHandles
          part={firstPart}
          zoom={zoom}
          previewW={previewW}
          previewH={previewH}
          onPreviewChange={handlePreviewChange}
          onResizePart={onResizePart}
          onCursorChange={onCursorChange}
        />
      )}

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
            parentWorldRotation={worldRotation}
            zoom={zoom}
            onResizePart={onResizePart}
            onCursorChange={onCursorChange}
            onMovePart={onMovePart}
          />
        ))}
      </Group>
    </Group>
  );
};

export const BoneGroup = React.memo(BoneGroupInner);
