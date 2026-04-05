/**
 * generateIdleClip — Génère automatiquement un clip "idle breathing" pour un rig.
 *
 * Algorithme :
 * 1. Cherche une pose "Repos" existante dans le rig (par nom).
 * 2. Si absente, utilise les rotations par défaut du template REPOS.
 * 3. Crée 3 variantes (neutre, inspire, expire) avec offsets paramétriques sur Corps/Tête/Épaules.
 * 4. Retourne un clip en boucle (1 cycle ≈ 3 s à 24 fps).
 *
 * Pattern : pure function — pas d'accès store.
 * Le caller (rigStore.generateAndAddIdleClip) assigne les IDs et persiste.
 */

import type { BonePose, AnimationClip, CharacterRig } from '../types/bone';
import { DEFAULT_ANIMATION_FPS } from '../types/bone';

// ── Offsets de respiration appliqués par rapport à la pose de base ──────────

/** Os et delta rotation (degrés) au moment de l'inspiration. */
const INHALE_OFFSETS: Record<string, number> = {
  Corps: -2, // tronc légèrement penché en arrière
  Torse: -2,
  Cou: 1.5, // cou légèrement avancé
  Tête: 1.5,
  'Épaule G': -1.5, // épaules très légèrement relevées
  'Épaule D': 1.5,
  'Bras G': -1,
  'Bras D': 1,
};

/** Expire = inverse de l'inspire, légèrement atténué. */
function exhaleOffsets(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(INHALE_OFFSETS).map(([bone, delta]) => [bone, -delta * 0.6])
  );
}

// ── Rotations par défaut (template REPOS) ────────────────────────────────────
// Utilisées si le rig n'a pas de pose "Repos".

const REPOS_DEFAULTS: Record<string, number> = {
  Corps: -90,
  Torse: -90,
  Cou: 0,
  Tête: 5,
  'Épaule G': -70,
  'Bras G': -70,
  'Patte G': -70,
  'Av. bras G': 15,
  'Pince G': 0,
  'Épaule D': 70,
  'Bras D': 70,
  'Patte D': 70,
  'Av. bras D': -15,
  'Pince D': 0,
  'Cuisse G': 90,
  'Cuisse D': 90,
  'Jambe G': 0,
  'Jambe D': 0,
  'Pied G': 0,
  'Pied D': 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Applique des offsets de rotation à un dict boneStates existant. */
function applyOffsets(
  base: Record<string, { rotation: number }>,
  offsets: Record<string, number>
): Record<string, { rotation: number }> {
  const result: Record<string, { rotation: number }> = {};
  for (const [boneId, state] of Object.entries(base)) {
    result[boneId] = { rotation: state.rotation + (offsets[boneId] ?? 0) };
  }
  return result;
}

/** Résolution nom → boneId depuis le rig. */
function buildBoneNameToId(rig: CharacterRig): Record<string, string> {
  const map: Record<string, string> = {};
  for (const bone of rig.bones) {
    map[bone.name] = bone.id;
  }
  return map;
}

// ── Export principal ──────────────────────────────────────────────────────────

export interface GeneratedIdleClip {
  /** Poses à ajouter au rig (sans id — le store les assigne). */
  poses: Omit<BonePose, 'id'>[];
  /** Clip à ajouter au rig (sans id — le store l'assigne). */
  clip: Omit<AnimationClip, 'id'>;
}

/**
 * Génère un clip idle "respiration" à partir d'un rig existant.
 *
 * @param rig - Rig source (bones nécessaires pour résoudre les noms).
 * @param breathDurationSecs - Durée totale d'un cycle (défaut : 3 s).
 * @returns null si le rig n'a aucun os (impossible de créer les poses).
 */
export function generateIdleClip(
  rig: CharacterRig,
  breathDurationSecs = 3.0
): GeneratedIdleClip | null {
  if (rig.bones.length === 0) return null;

  const nameToId = buildBoneNameToId(rig);

  // 1. Trouver une pose "Repos" dans le rig ou construire depuis les defaults
  const reposPose = rig.poses.find(
    (p) => p.name.toLowerCase().includes('repos') || p.name.toLowerCase().includes('idle')
  );

  let baseStates: Record<string, { rotation: number }>;

  if (reposPose) {
    baseStates = { ...reposPose.boneStates };
  } else {
    // Construire à partir du template REPOS, résolu vers les IDs du rig
    baseStates = {};
    for (const [boneName, rotation] of Object.entries(REPOS_DEFAULTS)) {
      const boneId = nameToId[boneName];
      if (boneId) {
        baseStates[boneId] = { rotation };
      }
    }
    // Ajouter les os non couverts par le template avec rotation 0
    for (const bone of rig.bones) {
      if (!baseStates[bone.id]) {
        baseStates[bone.id] = { rotation: bone.rotation ?? 0 };
      }
    }
  }

  // 2. Remplacer les clés nom→id dans les offsets (inhale/exhale utilisent les noms)
  function resolveOffsets(namedOffsets: Record<string, number>): Record<string, number> {
    const resolved: Record<string, number> = {};
    for (const [name, delta] of Object.entries(namedOffsets)) {
      const id = nameToId[name];
      if (id) resolved[id] = delta;
    }
    return resolved;
  }

  const inhaleResolved = resolveOffsets(INHALE_OFFSETS);
  const exhaleResolved = resolveOffsets(exhaleOffsets());

  // 3. Créer les 3 poses (sans id)
  const poseNeutral: Omit<BonePose, 'id'> = {
    name: 'Idle — Neutre',
    boneStates: { ...baseStates },
  };

  const poseInhale: Omit<BonePose, 'id'> = {
    name: 'Idle — Inspire',
    boneStates: applyOffsets(baseStates, inhaleResolved),
  };

  const poseExhale: Omit<BonePose, 'id'> = {
    name: 'Idle — Expire',
    boneStates: applyOffsets(baseStates, exhaleResolved),
  };

  // 4. Créer le clip (les poseIds seront injectés par le store après addPose)
  // Le store devra construire les keyframes après avoir ajouté les poses.
  // On retourne des poseIds comme sentinelles vides — le store les remplace.
  const halfDuration = breathDurationSecs / 2;

  const clip: Omit<AnimationClip, 'id'> = {
    name: 'Idle Breathing',
    fps: DEFAULT_ANIMATION_FPS,
    loop: true,
    poseIds: [], // rempli par le store après addPose
    keyframes: [
      // Sentinelles remplacées par le store (poseId: '__neutral__' etc.)
      { poseId: '__idle_neutral__', duration: 0.4, easing: 'ease-in-out' },
      { poseId: '__idle_inhale__', duration: halfDuration, easing: 'ease-in-out' },
      { poseId: '__idle_exhale__', duration: halfDuration, easing: 'ease-in-out' },
      { poseId: '__idle_neutral__', duration: 0.4, easing: 'ease-in-out' },
    ],
  };

  return { poses: [poseNeutral, poseInhale, poseExhale], clip };
}
