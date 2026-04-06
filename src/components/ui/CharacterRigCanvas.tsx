/**
 * CharacterRigCanvas — Rendu FK read-only d'un personnage animé.
 *
 * Composant display-only : pas d'outils d'édition, pas de sélection.
 * Utilise useCharacterAnimationPlayer (RAF) + BoneGroup (Konva) pour le rendu.
 *
 * Usage dans PreviewPlayer : remplace AnimatedCharacterSprite quand un rig FK est disponible.
 */

import { useMemo } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { useRigStore } from '@/stores/rigStore';
import { useCharacterAnimationPlayer } from '@/hooks/useCharacterAnimationPlayer';
import { useBoneImageCache } from '../modules/DistributionModule/hooks/useBoneImageCache';
import { getRootBones, computeRigBounds } from '../modules/DistributionModule/utils/boneUtils';
import { BoneGroup } from '../modules/DistributionModule/components/BoneGroup';
import type { Bone, SpritePart, BonePose } from '@/types/bone';

// ── Fallbacks stables (Acton §15.4) ─────────────────────────────────────────
const EMPTY_BONES: Bone[] = [];
const EMPTY_PARTS: SpritePart[] = [];
const EMPTY_POSES: BonePose[] = [];

// NOOP stables — BoneGroup read-only, pas d'édition (référence stable → mémo non brisé)
const NOOP_SELECT = () => {};
const NOOP_ROTATE = () => {};

export interface CharacterRigCanvasProps {
  /** ID du personnage — lien vers CharacterRig.characterId. null = rien rendu. */
  characterId: string | null;
  /** Clip à jouer. null = aucune animation (frame 0 implicite). */
  clipId: string | null;
  /** Active la lecture RAF. false = pose figée sur la frame courante. */
  isPlaying: boolean;
  width: number;
  height: number;
  /** Multiplicateur de vitesse (0.5 | 1 | 2). Défaut : 1. */
  speed?: number;
  /**
   * Position X de l'origine du rig dans le canvas.
   * Si absent, utilise rig.originX (position de l'éditeur osseux).
   */
  originX?: number;
  /**
   * Position Y de l'origine du rig dans le canvas.
   * Si absent, utilise rig.originY (position de l'éditeur osseux).
   */
  originY?: number;
}

export function CharacterRigCanvas({
  characterId,
  clipId,
  isPlaying,
  width,
  height,
  speed = 1,
  originX,
  originY,
}: CharacterRigCanvasProps) {
  // ── Données rig ─────────────────────────────────────────────────────────────
  const rig = useRigStore((s) =>
    characterId ? s.rigs.find((r) => r.characterId === characterId) : undefined
  );

  const bones = rig?.bones ?? EMPTY_BONES;
  const parts = rig?.parts ?? EMPTY_PARTS;
  const poses = rig?.poses ?? EMPTY_POSES;

  const imageCache = useBoneImageCache(parts, poses);
  const rootBones = useMemo(() => getRootBones(bones), [bones]);

  // ── Playback FK ──────────────────────────────────────────────────────────────
  const { overridesMap } = useCharacterAnimationPlayer(characterId, clipId, isPlaying, speed);

  // ── Centrage automatique (plan P0c) ─────────────────────────────────────────
  // Si originX/Y explicites (PreviewPlayer sait où placer) → les utiliser tels quels.
  // Sinon → centrer le rig dans le canvas via bounding box FK.
  const { rigX, rigY } = useMemo(() => {
    if (originX !== undefined && originY !== undefined) {
      return { rigX: originX, rigY: originY };
    }
    if (!rig || bones.length === 0) return { rigX: width / 2, rigY: height / 2 };
    const bounds = computeRigBounds(bones);
    return {
      rigX: width / 2 - bounds.centerX,
      rigY: height / 2 - bounds.centerY,
    };
  }, [bones, width, height, originX, originY, rig]);

  if (!rig) return null;

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <Stage width={width} height={height}>
      {/* listening={false} : rendu display-only, aucun événement requis (konva-patterns §6) */}
      <Layer listening={false}>
        <Group x={rigX} y={rigY}>
          {rootBones.map((bone) => (
            <BoneGroup
              key={bone.id}
              bone={bone}
              allBones={bones}
              allParts={parts}
              imageCache={imageCache}
              activeTool="select"
              selectedBoneId={null}
              rotationOverride={overridesMap[bone.id]?.rotation}
              overridesMap={overridesMap}
              onSelectBone={NOOP_SELECT}
              onRotateBone={NOOP_ROTATE}
              zoom={1}
            />
          ))}
        </Group>
      </Layer>
    </Stage>
  );
}
