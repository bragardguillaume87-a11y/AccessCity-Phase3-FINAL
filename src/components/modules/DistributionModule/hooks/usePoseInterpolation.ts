import { useMemo } from 'react';
import type { BonePose, BonePoseState } from '@/types/bone';

/**
 * Interpole entre deux poses (lerp simple sur les rotations).
 * Retourne un Record<boneId, BonePoseState> interpolé à t ∈ [0,1].
 */
export function interpolatePoses(
  poseA: BonePose,
  poseB: BonePose,
  t: number
): Record<string, BonePoseState> {
  const result: Record<string, BonePoseState> = {};
  const allBoneIds = new Set([...Object.keys(poseA.boneStates), ...Object.keys(poseB.boneStates)]);

  for (const boneId of allBoneIds) {
    const rotA = poseA.boneStates[boneId]?.rotation ?? 0;
    const rotB = poseB.boneStates[boneId]?.rotation ?? 0;
    result[boneId] = { rotation: rotA + (rotB - rotA) * t };
  }

  return result;
}

/**
 * Hook — retourne les boneStates interpolés pour une frame donnée dans un clip.
 *
 * @param poses   - Toutes les poses du rig
 * @param poseIds - Séquence ordonnée du clip
 * @param frame   - Frame courante (0-based)
 * @param fps     - FPS du clip
 */
export function usePoseInterpolation(
  poses: BonePose[],
  poseIds: string[],
  frame: number,
  fps: number
): Record<string, BonePoseState> {
  return useMemo(() => {
    if (poseIds.length === 0) return {};

    const framesPerPose = Math.max(1, Math.round(fps));
    const poseIndex = Math.floor(frame / framesPerPose) % poseIds.length;
    const nextPoseIndex = (poseIndex + 1) % poseIds.length;
    const t = (frame % framesPerPose) / framesPerPose;

    const poseA = poses.find((p) => p.id === poseIds[poseIndex]);
    const poseB = poses.find((p) => p.id === poseIds[nextPoseIndex]);

    if (!poseA) return {};
    if (!poseB || poseA.id === poseB.id) return { ...poseA.boneStates };

    return interpolatePoses(poseA, poseB, t);
  }, [poses, poseIds, frame, fps]);
}
