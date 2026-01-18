/**
 * Store Selectors
 *
 * Re-exports all memoized selectors for easy imports.
 *
 * @example
 * ```typescript
 * import { useSceneById, useCharacterById } from '@/stores/selectors';
 * ```
 */

// Scene selectors
export {
  useSceneById,
  useScenes,
  useScenesCount,
  useSceneIds,
  useDialoguesBySceneId,
  useDialogueByIndex,
  useDialoguesCount,
  useSceneCharacters,
  useSceneCharacterById,
  useSceneActions,
  useDialogueActions,
  useSceneCharacterActions,
} from './sceneSelectors';

// Character selectors
export {
  useCharacterById,
  useCharacters,
  useCharactersCount,
  useCharacterIds,
  useCharacterNamesMap,
  useSpeakableCharacters,
  useCharacterMoods,
  useCharacterSprites,
  useCharacterActions,
  getCharacterById,
} from './characterSelectors';
