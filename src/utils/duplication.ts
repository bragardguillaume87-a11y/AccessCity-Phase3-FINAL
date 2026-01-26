/**
 * Duplication utilities - Duplicate scenes, dialogues, characters
 * Auto-rename with "(copie)" suffix
 * Uses structuredClone for deep copy and crypto.randomUUID for secure IDs
 * ASCII only - No fragments
 */

import type { Scene, Dialogue, Character, DialogueChoice } from '@/types';

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
 * Generate a unique ID using crypto.randomUUID (modern browsers)
 * Falls back to timestamp + performance.now + random for older environments
 * @param prefix - ID prefix
 * @returns Unique ID
 */
function generateUniqueId(prefix = 'item'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  const timestamp = Date.now();
  const perfNow = typeof performance !== 'undefined' ? performance.now() : 0;
  const random = Math.random().toString(36).substr(2, 12);

  return `${prefix}-${timestamp}-${perfNow.toFixed(0)}-${random}`;
}

/**
 * Duplicate a scene with all its dialogues
 * @param scene - Scene to duplicate
 * @param existingSceneIds - List of existing scene IDs
 * @param existingSceneTitles - List of existing scene titles
 * @returns Duplicated scene
 */
export function duplicateScene(scene: Scene, existingSceneIds: string[], existingSceneTitles: string[]): Scene {
  const newSceneId = generateUniqueId('scene');
  const newTitle = generateCopyName(scene.title || 'Scene sans titre', existingSceneTitles);

  const cloned = structuredClone(scene);

  return {
    ...cloned,
    id: newSceneId,
    title: newTitle,
    dialogues: (cloned.dialogues || []).map(dialogue => ({
      ...dialogue,
      id: generateUniqueId('dialogue'),
      choices: (dialogue.choices || []).map(choice => {
        const clean = { ...choice };
        delete (clean as any).diceCheck;
        return clean;
      })
    }))
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
    id: generateUniqueId('dialogue'),
    text: cloned.text || 'Dialogue duplique',
    choices: (cloned.choices || []).map(choice => {
      const clean = { ...choice };
      delete (clean as any).diceCheck;
      return clean;
    })
  };
}

/**
 * Duplicate a choice
 * @param choice - Choice to duplicate
 * @returns Duplicated choice without diceCheck
 */
export function duplicateChoice(choice: DialogueChoice): Omit<DialogueChoice, 'diceCheck'> {
  const cloned = structuredClone(choice);
  delete cloned.diceCheck;
  return cloned;
}

/**
 * Duplicate a character with all sprites
 * @param character - Character to duplicate
 * @param existingCharacterIds - List of existing character IDs
 * @param existingCharacterNames - List of existing character names
 * @returns Duplicated character
 */
export function duplicateCharacter(character: Character, existingCharacterIds: string[], existingCharacterNames: string[]): Character {
  const newCharacterId = generateUniqueId('char');
  const newName = generateCopyName(character.name || 'Personnage sans nom', existingCharacterNames);

  const cloned = structuredClone(character);

  return {
    ...cloned,
    id: newCharacterId,
    name: newName
  };
}
