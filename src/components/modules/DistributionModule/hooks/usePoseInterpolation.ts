import { useMemo } from 'react';
import type { BonePose, BonePoseState, KeyframeEntry } from '@/types/bone';
import { applyEasing } from '@/utils/animationEasing';

/**
 * Interpolation angulaire chemin-court — évite le problème de wrap-around ±180°.
 * Exemple : 170° → -170° prend le chemin court (20°) et non le long (340°).
 */
function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 180) % 360) - 180;
  return a + diff * t;
}

/**
 * Interpole entre deux poses (lerp angulaire chemin-court avec easing).
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
    result[boneId] = { rotation: lerpAngle(rotA, rotB, t) };
  }

  return result;
}

/**
 * Hook — retourne les boneStates interpolés pour une frame donnée dans un clip.
 *
 * Chaque KeyframeEntry a sa propre durée (en secondes) et courbe d'easing.
 * L'algorithme calcule la position cumulée pour trouver le keyframe actif,
 * puis applique l'easing configuré sur le paramètre d'interpolation t.
 *
 * @param poses     - Toutes les poses du rig
 * @param keyframes - Séquence ordonnée avec durée + easing par keyframe
 * @param frame     - Frame courante (0-based, incrémentée à fps/s)
 * @param fps       - FPS du clip (utilisé pour convertir durées secondes → frames)
 */
export function usePoseInterpolation(
  poses: BonePose[],
  keyframes: KeyframeEntry[],
  frame: number,
  fps: number
): Record<string, BonePoseState> {
  return useMemo(() => {
    if (keyframes.length === 0) return {};

    // Durée de chaque keyframe en frames
    const kfFrames = keyframes.map((kf) => Math.max(1, Math.round(kf.duration * fps)));
    const totalFrames = kfFrames.reduce((sum, f) => sum + f, 0);
    if (totalFrames === 0) return {};

    // Position dans le clip (avec wrapping pour loop)
    const frameInClip = frame % totalFrames;

    // Trouver le keyframe actif par accumulation
    let cumulative = 0;
    let kfIndex = 0;
    for (let i = 0; i < kfFrames.length; i++) {
      if (cumulative + kfFrames[i] > frameInClip) {
        kfIndex = i;
        break;
      }
      cumulative += kfFrames[i];
    }

    const kf = keyframes[kfIndex];
    const nextKfIndex = (kfIndex + 1) % keyframes.length;

    // t normalisé [0,1] dans ce keyframe
    const t_raw = (frameInClip - cumulative) / kfFrames[kfIndex];
    // Appliquer la courbe d'easing configurée
    const t = applyEasing(Math.max(0, Math.min(1, t_raw)), kf.easing, kf.bezierPoints);

    const poseA = poses.find((p) => p.id === kf.poseId);
    const poseB = poses.find((p) => p.id === keyframes[nextKfIndex].poseId);

    if (!poseA) return {};
    if (!poseB || poseA.id === poseB.id) return { ...poseA.boneStates };

    return interpolatePoses(poseA, poseB, t);
  }, [poses, keyframes, frame, fps]);
}
