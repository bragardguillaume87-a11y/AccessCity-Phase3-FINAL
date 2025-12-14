/**
 * Duplication utilities - Duplicate scenes, dialogues, characters
 * Auto-rename with "(copie)" suffix
 * Uses structuredClone for deep copy and crypto.randomUUID for secure IDs
 * ASCII only - No fragments
 */

/**
 * Generate a unique copy name
 * @param {string} originalName - Original name
 * @param {string[]} existingNames - List of existing names to avoid conflicts
 * @returns {string} - Unique copy name
 */
function generateCopyName(originalName, existingNames) {
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
 * @param {string} prefix - ID prefix
 * @returns {string} - Unique ID
 */
function generateUniqueId(prefix = 'item') {
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
 * @param {Object} scene - Scene to duplicate
 * @param {string[]} existingSceneIds - List of existing scene IDs
 * @param {string[]} existingSceneTitles - List of existing scene titles
 * @returns {Object} - Duplicated scene
 */
export function duplicateScene(scene, existingSceneIds, existingSceneTitles) {
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
        delete clean.diceCheck;
        return clean;
      })
    }))
  };
}

/**
 * Duplicate a dialogue with all its choices
 * @param {Object} dialogue - Dialogue to duplicate
 * @returns {Object} - Duplicated dialogue
 */
export function duplicateDialogue(dialogue) {
  const cloned = structuredClone(dialogue);
  
  return {
    ...cloned,
    id: generateUniqueId('dialogue'),
    text: cloned.text || 'Dialogue duplique',
    choices: (cloned.choices || []).map(choice => {
      const clean = { ...choice };
      delete clean.diceCheck;
      return clean;
    })
  };
}

/**
 * Duplicate a choice
 * @param {Object} choice - Choice to duplicate
 * @returns {Object} - Duplicated choice
 */
export function duplicateChoice(choice) {
  const cloned = structuredClone(choice);
  delete cloned.diceCheck;
  return cloned;
}

/**
 * Duplicate a character with all sprites
 * @param {Object} character - Character to duplicate
 * @param {string[]} existingCharacterIds - List of existing character IDs
 * @param {string[]} existingCharacterNames - List of existing character names
 * @returns {Object} - Duplicated character
 */
export function duplicateCharacter(character, existingCharacterIds, existingCharacterNames) {
  const newCharacterId = generateUniqueId('char');
  const newName = generateCopyName(character.name || 'Personnage sans nom', existingCharacterNames);

  const cloned = structuredClone(character);

  return {
    ...cloned,
    id: newCharacterId,
    name: newName
  };
}