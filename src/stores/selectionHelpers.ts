/**
 * Selection Store Helpers
 *
 * Pure utility functions for selection comparison.
 *
 * @module stores/selectionHelpers
 */

import type {
  SelectedElement,
  NoSelection,
} from './selectionStore.types';

/** Check if two selections are the same (used for subscription equality) */
export function isSameSelection(
  a: SelectedElement | undefined,
  b: SelectedElement | undefined
): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;

  if (a.type === null || b.type === null) return a.type === b.type;
  if (a.type !== b.type) return false;

  const aTyped = a as Exclude<SelectedElement, NoSelection | null>;
  const bTyped = b as Exclude<SelectedElement, NoSelection | null>;

  switch (aTyped.type) {
    case 'scene':
      return bTyped.type === 'scene' && aTyped.id === bTyped.id;
    case 'dialogue':
      return bTyped.type === 'dialogue' && aTyped.sceneId === bTyped.sceneId && aTyped.index === bTyped.index;
    case 'character':
      return bTyped.type === 'character' && aTyped.id === bTyped.id;
    case 'sceneCharacter':
      return bTyped.type === 'sceneCharacter' && aTyped.sceneId === bTyped.sceneId && aTyped.sceneCharacterId === bTyped.sceneCharacterId;
    default:
      return false;
  }
}
