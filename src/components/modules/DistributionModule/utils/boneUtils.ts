import type { Bone } from '@/types/bone';

/**
 * Retourne les os enfants directs d'un os parent.
 * FK entièrement gérée par les <Group> imbriqués Konva — pas de calcul position monde ici.
 */
export function getBoneChildren(bones: Bone[], parentId: string): Bone[] {
  return bones.filter((b) => b.parentId === parentId);
}

/** Retourne les os racines (parentId === null). */
export function getRootBones(bones: Bone[]): Bone[] {
  return bones.filter((b) => b.parentId === null);
}
