import type { Bone } from '@/types/bone';
import type { FabrikJoint } from '@/utils/fabrik';

// ── Emoji par type d'os ───────────────────────────────────────────────────────

/**
 * Retourne un emoji représentatif pour un os, détecté depuis son nom.
 * Miyamoto §1.2 : symboles universels > labels texte.
 */
export function getBoneEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/torse|corps|thorax|buste/.test(n)) return '🫁';
  if (/cou/.test(n)) return '🔗';
  if (/tête|head/.test(n)) return '🪖';
  if (/av[.\s]*bras|avant.bras|forearm|pince|griffe/.test(n)) return '🤚';
  if (/épaule|shoulder/.test(n)) return '💪';
  if (/bras|arm/.test(n)) return '💪';
  if (/cuisse|thigh/.test(n)) return '🦵';
  if (/jambe|leg|pied|foot/.test(n)) return '👟';
  if (/patte|paw/.test(n)) return '🐾';
  return '🦴';
}

// ── computeRigBounds ─────────────────────────────────────────────────────────

export interface RigBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Centre X du bounding box = (minX + maxX) / 2 */
  centerX: number;
  /** Centre Y du bounding box = (minY + maxY) / 2 */
  centerY: number;
}

/**
 * Calcule le bounding box world-space de l'ensemble des os d'un rig,
 * avec une origine de rig à (0,0).
 *
 * Reproduit la hiérarchie FK des <Group> Konva sans Konva :
 *   worldPos(bone) = worldPos(parent) + rotate(localX, localY, cumRot_parent)
 *   tip(bone)      = pivot + (bone.length, 0) rotaté par cumRot(bone)
 *
 * Usage : centrer le rig dans le canvas de preview —
 *   offsetX = canvasW / 2 - bounds.centerX
 *   offsetY = canvasH / 2 - bounds.centerY
 */
export function computeRigBounds(bones: Bone[]): RigBounds {
  const EMPTY: RigBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 };
  if (bones.length === 0) return EMPTY;

  const boneById = new Map(bones.map((b) => [b.id, b]));
  // Cache pivot world pour éviter O(n²) sur des rigs profonds
  const pivotCache = new Map<string, { x: number; y: number }>();

  function cumRot(bone: Bone): number {
    let r = bone.rotation * (Math.PI / 180);
    let b: Bone | undefined = bone.parentId ? boneById.get(bone.parentId) : undefined;
    while (b) {
      r += b.rotation * (Math.PI / 180);
      b = b.parentId ? boneById.get(b.parentId) : undefined;
    }
    return r;
  }

  function worldPivot(bone: Bone): { x: number; y: number } {
    const cached = pivotCache.get(bone.id);
    if (cached) return cached;

    let result: { x: number; y: number };
    if (!bone.parentId) {
      result = { x: bone.localX, y: bone.localY };
    } else {
      const parent = boneById.get(bone.parentId);
      if (!parent) {
        result = { x: bone.localX, y: bone.localY };
      } else {
        const parentPos = worldPivot(parent);
        const parentRot = cumRot(parent);
        const cos = Math.cos(parentRot);
        const sin = Math.sin(parentRot);
        // Guard données corrompues (konva-patterns §2)
        if (!isFinite(bone.localX) || !isFinite(bone.localY)) {
          result = parentPos;
        } else {
          // Le pivot enfant est au TIP du parent (x = parent.length dans l'espace local)
          // + offset supplémentaire localX/localY (BoneGroup §189).
          // Avant : on oubliait parent.length → enfants collés au pivot parent (bounds faux).
          const offsetX = parent.length + bone.localX;
          const offsetY = bone.localY;
          result = {
            x: parentPos.x + offsetX * cos - offsetY * sin,
            y: parentPos.y + offsetX * sin + offsetY * cos,
          };
        }
      }
    }
    pivotCache.set(bone.id, result);
    return result;
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const bone of bones) {
    const pivot = worldPivot(bone);
    const rot = cumRot(bone);
    const tip = {
      x: pivot.x + bone.length * Math.cos(rot),
      y: pivot.y + bone.length * Math.sin(rot),
    };
    minX = Math.min(minX, pivot.x, tip.x);
    minY = Math.min(minY, pivot.y, tip.y);
    maxX = Math.max(maxX, pivot.x, tip.x);
    maxY = Math.max(maxY, pivot.y, tip.y);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return { minX, minY, maxX, maxY, centerX, centerY };
}

/**
 * Détecte l'os symétrique d'un os donné par convention de nommage.
 *
 * Conventions supportées (tous les templates AccessCity) :
 *   " G" / " D"       → "Épaule G" ↔ "Épaule D", "Av. bras G" ↔ "Av. bras D"
 *   "_g" / "_d"       → "bras_g" ↔ "bras_d"
 *   "gauche" / "droit"→ "bras gauche" ↔ "bras droit"
 *   "left"  / "right" → "arm left" ↔ "arm right"
 *
 * Retourne null si aucun os symétrique n'est trouvé dans allBones.
 */
export function findMirrorBone(boneName: string, allBones: Bone[]): Bone | null {
  // Paires [pattern de détection, remplacement]
  // Ordre : du plus spécifique au plus général (évite les faux positifs)
  const PAIRS: Array<[RegExp, string]> = [
    [/ G$/, ' D'],
    [/ D$/, ' G'],
    [/_g$/i, '_d'],
    [/_d$/i, '_g'],
    [/\bgauche\b/i, 'droit'],
    [/\bdroit\b/i, 'gauche'],
    [/\bleft\b/i, 'right'],
    [/\bright\b/i, 'left'],
  ];

  for (const [pattern, replacement] of PAIRS) {
    if (pattern.test(boneName)) {
      const mirrorName = boneName.replace(pattern, replacement);
      const found = allBones.find((b) => b.name.toLowerCase() === mirrorName.toLowerCase());
      // Guard : ne pas retourner le bone source lui-même (si replacement = boneName)
      if (found && found.name !== boneName) return found;
    }
  }
  return null;
}

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

/**
 * Construit le chemin de bones de rootBoneId jusqu'à endBoneId
 * en remontant la hiérarchie parentId.
 * Retourne null si endBoneId n'est pas un descendant de rootBoneId.
 */
export function getBoneChain(rootBoneId: string, endBoneId: string, bones: Bone[]): Bone[] | null {
  // Remonter de endBoneId vers rootBoneId
  const path: Bone[] = [];
  let current: Bone | undefined = bones.find((b) => b.id === endBoneId);
  while (current) {
    path.unshift(current);
    if (current.id === rootBoneId) return path;
    if (!current.parentId) return null; // rootBoneId pas dans la hiérarchie
    current = bones.find((b) => b.id === current!.parentId);
  }
  return null;
}

/**
 * Calcule les positions monde de chaque pivot + tip du dernier os,
 * dans le même espace que le rig Group Konva.
 *
 * Algorithme FK pur — reproduit la hiérarchie Group Konva :
 *   worldPos(bone) = worldPos(parent) + rotate(bone.localX, bone.localY, cumRot_parent)
 *   worldRot(bone) = worldRot(parent) + bone.rotation
 *
 * @returns joints array : [pivot_0, pivot_1, ..., pivot_n-1, tip_n-1]
 *          lengths array: distance entre chaque paire consécutive
 */
export function computeChainWorldState(
  chain: Bone[],
  bones: Bone[],
  rigOriginX: number,
  rigOriginY: number
): { joints: FabrikJoint[]; lengths: number[] } {
  const boneById = new Map(bones.map((b) => [b.id, b]));

  /** Rotation cumulée (radians) d'un os, en partant de la racine */
  function cumRot(bone: Bone): number {
    let r = bone.rotation * (Math.PI / 180);
    let b: Bone | undefined = bone.parentId ? boneById.get(bone.parentId) : undefined;
    while (b) {
      r += b.rotation * (Math.PI / 180);
      b = b.parentId ? boneById.get(b.parentId) : undefined;
    }
    return r;
  }

  /** Position monde du pivot d'un os */
  function worldPivot(bone: Bone): FabrikJoint {
    if (!bone.parentId) {
      return { x: rigOriginX + bone.localX, y: rigOriginY + bone.localY };
    }
    const parent = boneById.get(bone.parentId);
    if (!parent) return { x: rigOriginX + bone.localX, y: rigOriginY + bone.localY };

    const parentPos = worldPivot(parent);
    const parentRot = cumRot(parent); // rotation cumulée du parent
    const cos = Math.cos(parentRot);
    const sin = Math.sin(parentRot);
    // Guard: données corrompues (NaN/Infinity) → retourner le pivot parent sans propager
    if (!isFinite(bone.localX) || !isFinite(bone.localY)) return parentPos;
    return {
      x: parentPos.x + bone.localX * cos - bone.localY * sin,
      y: parentPos.y + bone.localX * sin + bone.localY * cos,
    };
  }

  const joints: FabrikJoint[] = [];
  for (const bone of chain) {
    joints.push(worldPivot(bone));
  }

  // Tip du dernier os — à (bone.length, 0) dans son espace local
  const lastBone = chain[chain.length - 1];
  const lastRot = cumRot(lastBone);
  const lastPivot = joints[joints.length - 1];
  joints.push({
    x: lastPivot.x + lastBone.length * Math.cos(lastRot),
    y: lastPivot.y + lastBone.length * Math.sin(lastRot),
  });

  const lengths: number[] = [];
  for (let i = 0; i < joints.length - 1; i++) {
    const dx = joints[i + 1].x - joints[i].x;
    const dy = joints[i + 1].y - joints[i].y;
    lengths.push(Math.sqrt(dx * dx + dy * dy) || 1);
  }

  return { joints, lengths };
}

/**
 * Applique les positions FABRIK au rig en ne modifiant que la rotation de chaque os.
 * La longueur (localX/localY) ne change pas — seule la direction du bone change.
 *
 * @param fabrikJoints  Résultat de solveFabrik (n+1 éléments)
 * @param chain         Bones de la chaîne (n éléments)
 * @returns Map boneId → nouvelle rotation en degrés
 */
export function fabrikToRotations(fabrikJoints: FabrikJoint[], chain: Bone[]): Map<string, number> {
  const result = new Map<string, number>();

  // parentCumRot accumule les rotations déjà mises à jour (traitement root → end)
  let parentCumRot = 0;
  for (let i = 0; i < chain.length; i++) {
    const bone = chain[i];
    // angle monde du segment de ce joint vers le suivant
    const dx = fabrikJoints[i + 1].x - fabrikJoints[i].x;
    const dy = fabrikJoints[i + 1].y - fabrikJoints[i].y;
    // Guard: joints coincidents (FABRIK dégénéré, cible hors portée) → conserver rotation
    if (dx === 0 && dy === 0) continue;
    const angleWorld = Math.atan2(dy, dx) * (180 / Math.PI);

    // Si c'est le root bone, son parent n'a pas de rotation propre (rig origin fixe)
    let parentRot = 0;
    if (i === 0) {
      // Pour le root bone, le "parent cumulative" vient des parents hors de la chaîne
      // On ne peut pas recalculer ici sans l'arbre complet.
      // Cas simplifié : pour root, parentRot = 0.
      parentRot = 0;
    } else {
      parentRot = parentCumRot;
    }

    const newRotation = angleWorld - parentRot;
    result.set(bone.id, newRotation);
    parentCumRot += newRotation;
  }

  return result;
}

/**
 * Calcule la profondeur d'un os dans la hiérarchie (root = 0).
 * Utilisé pour l'indentation de la liste des os dans BoneEditorRightPanel.
 */
export function getBoneDepth(bone: Bone, allBones: Bone[]): number {
  let depth = 0;
  let current = bone;
  while (current.parentId) {
    const parent = allBones.find((b) => b.id === current.parentId);
    if (!parent) break;
    depth++;
    current = parent;
  }
  return depth;
}

/**
 * Trie les os par profondeur croissante puis par ordre d'apparition dans le tableau d'origine.
 * Garantit que les parents sont toujours affichés avant leurs enfants.
 */
export function sortBonesByHierarchy(bones: Bone[]): Bone[] {
  return [...bones].sort((a, b) => {
    const da = getBoneDepth(a, bones);
    const db = getBoneDepth(b, bones);
    if (da !== db) return da - db;
    return bones.indexOf(a) - bones.indexOf(b);
  });
}
