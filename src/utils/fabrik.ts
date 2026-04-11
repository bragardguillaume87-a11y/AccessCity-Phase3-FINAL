/**
 * FABRIK — Forward And Backward Reaching Inverse Kinematics
 * Algorithme itératif zéro-dépendance. Compatible avec le rig FK cut-out
 * du DistributionModule (os hiérarchiques en Konva).
 *
 * Référence : Andreas Aristidou, Joan Lasenby (2011), "FABRIK: A fast, iterative solver
 * for the Inverse Kinematics problem."
 */

export interface FabrikJoint {
  x: number;
  y: number;
}

/**
 * Résout la chaîne IK par l'algorithme FABRIK.
 *
 * @param joints   Positions monde de chaque joint (joints[0] = base fixe, joints[n-1] = end effector)
 * @param lengths  Longueurs des segments — lengths[i] = dist(joints[i], joints[i+1])
 * @param targetX  Position cible X de l'end effector
 * @param targetY  Position cible Y de l'end effector
 * @param maxIterations  Nombre max d'itérations (défaut : 10)
 * @param tolerance  Seuil de convergence en pixels (défaut : 0.5)
 * @returns  Copie des joints avec les positions mises à jour
 */
export function solveFabrik(
  joints: FabrikJoint[],
  lengths: number[],
  targetX: number,
  targetY: number,
  maxIterations = 10,
  tolerance = 0.5
): FabrikJoint[] {
  if (joints.length < 2) return joints.map((j) => ({ ...j }));

  const n = joints.length;
  const result: FabrikJoint[] = joints.map((j) => ({ ...j }));
  const base: FabrikJoint = { ...result[0] }; // base fixe

  // Longueur totale de la chaîne
  const totalLen = lengths.reduce((s, l) => s + l, 0);

  // Distance base → cible
  const dx0 = targetX - base.x;
  const dy0 = targetY - base.y;
  const distToTarget = Math.sqrt(dx0 * dx0 + dy0 * dy0);

  if (distToTarget > totalLen) {
    // Cible hors de portée — aligner la chaîne vers la cible
    const invDist = 1 / distToTarget;
    const dirX = dx0 * invDist;
    const dirY = dy0 * invDist;
    let cumLen = 0;
    for (let i = 1; i < n; i++) {
      cumLen += lengths[i - 1];
      result[i] = { x: base.x + dirX * cumLen, y: base.y + dirY * cumLen };
    }
    return result;
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    // ── Passe forward : end effector → base ──
    result[n - 1] = { x: targetX, y: targetY };
    for (let i = n - 2; i >= 0; i--) {
      const rx = result[i].x - result[i + 1].x;
      const ry = result[i].y - result[i + 1].y;
      const d = Math.sqrt(rx * rx + ry * ry) || 1;
      const ratio = lengths[i] / d;
      result[i] = {
        x: result[i + 1].x + rx * ratio,
        y: result[i + 1].y + ry * ratio,
      };
    }

    // ── Passe backward : base → end effector ──
    result[0] = { ...base };
    for (let i = 0; i < n - 1; i++) {
      const rx = result[i + 1].x - result[i].x;
      const ry = result[i + 1].y - result[i].y;
      const d = Math.sqrt(rx * rx + ry * ry) || 1;
      const ratio = lengths[i] / d;
      result[i + 1] = {
        x: result[i].x + rx * ratio,
        y: result[i].y + ry * ratio,
      };
    }

    // ── Test convergence ──
    const ex = result[n - 1].x - targetX;
    const ey = result[n - 1].y - targetY;
    if (Math.sqrt(ex * ex + ey * ey) < tolerance) break;
  }

  return result;
}
