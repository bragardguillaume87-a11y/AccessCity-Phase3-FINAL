/**
 * Duplication utilities - Duplicate scenes, dialogues, characters
 * Auto-rename with "(copie)" suffix
 * Uses structuredClone for deep copy and generateId for secure IDs
 * ASCII only - No fragments
 */

import type { Scene, Dialogue, Character } from '@/types';
import { generateId } from '@/utils/generateId';

/**
 * Generate a unique copy name
 * @param originalName - Original name
 * @param existingNames - List of existing names to avoid conflicts
 * @returns Unique copy name
 */
function generateCopyName(originalName: string, existingNames: string[]): string {
  let copyName = `${originalName} (copie)`;
  let counter = 2;

  while (existingNames.includes(copyName)) {
    copyName = `${originalName} (copie ${counter})`;
    counter++;
  }

  return copyName;
}

/**
 * Duplicate a scene with all its dialogues
 * @param scene - Scene to duplicate
 * @param existingSceneIds - List of existing scene IDs
 * @param existingSceneTitles - List of existing scene titles
 * @returns Duplicated scene
 */
export function duplicateScene(
  scene: Scene,
  _existingSceneIds: string[],
  existingSceneTitles: string[]
): Scene {
  const newSceneId = generateId('scene');
  const newTitle = generateCopyName(scene.title || 'Scene sans titre', existingSceneTitles);

  const cloned = structuredClone(scene);

  return {
    ...cloned,
    id: newSceneId,
    title: newTitle,
    dialogues: (cloned.dialogues || []).map((dialogue) => ({
      ...dialogue,
      id: generateId('dialogue'),
      choices: (dialogue.choices || []).map((choice) => {
        const clean = { ...choice };
        delete clean.diceCheck;
        return clean;
      }),
    })),
  };
}

/**
 * Duplicate a dialogue with all its choices
 * @param dialogue - Dialogue to duplicate
 * @returns Duplicated dialogue
 */
export function duplicateDialogue(dialogue: Dialogue): Dialogue {
  const cloned = structuredClone(dialogue);

  return {
    ...cloned,
    id: generateId('dialogue'),
    text: cloned.text || 'Dialogue duplique',
    choices: (cloned.choices || []).map((choice) => {
      const clean = { ...choice };
      delete clean.diceCheck;
      return clean;
    }),
  };
}

/**
 * Duplicate a character with all sprites
 * @param character - Character to duplicate
 * @param existingCharacterIds - List of existing character IDs
 * @param existingCharacterNames - List of existing character names
 * @returns Duplicated character
 */
export function duplicateCharacter(
  character: Character,
  _existingCharacterIds: string[],
  existingCharacterNames: string[]
): Character {
  const newCharacterId = generateId('char');
  const newName = generateCopyName(character.name || 'Personnage sans nom', existingCharacterNames);

  const cloned = structuredClone(character);

  return {
    ...cloned,
    id: newCharacterId,
    name: newName,
  };
}
