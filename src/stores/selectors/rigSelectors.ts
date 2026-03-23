/**
 * Rig Selectors — module Distribution.
 * Modèle : characterSelectors.ts
 */

import { useRigStore } from '../rigStore';
import type { CharacterRig } from '../../types/bone';

// Référence stable pour le cas "aucun rig" (pattern EMPTY_* / Acton §15.4)
const EMPTY_RIG = undefined;

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Récupère le rig associé à un personnage (undefined si aucun rig).
 *
 * @example
 * const rig = useRigForCharacter(char.id);
 */
export function useRigForCharacter(characterId: string | undefined): CharacterRig | undefined {
  return useRigStore((s) =>
    characterId ? s.rigs.find((r) => r.characterId === characterId) : EMPTY_RIG
  );
}

/**
 * Récupère tous les rigs.
 */
export function useRigs(): CharacterRig[] {
  return useRigStore((s) => s.rigs);
}
