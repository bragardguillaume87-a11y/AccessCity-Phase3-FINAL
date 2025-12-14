/**
 * Template Normalizer - Convert diceCheck to diceRoll format
 * Ensures compatibility between old templates and current editor
 * Handles nextScene preservation and stat mapping
 * ASCII only - No fragments
 */

/**
 * Normalize a choice from diceCheck format to diceRoll format
 * Preserves nextScene from outcomes if present
 * @param {Object} choice - Choice object (may have diceCheck or diceRoll)
 * @returns {Object} - Choice with diceRoll format only
 */
export function normalizeChoiceDiceFormat(choice) {
  // Si deja en diceRoll, ne rien faire
  if (choice.diceRoll && !choice.diceCheck) {
    return choice;
  }

  // Si diceCheck existe, convertir vers diceRoll
  if (choice.diceCheck) {
    const dc = choice.diceCheck;
    
    // Extraire le moral depuis variableChanges
    const successMoral = dc.onSuccess?.variableChanges?.Mentale || 
                         dc.onSuccess?.variableChanges?.Physique || 
                         0;
    
    const failureMoral = dc.onFailure?.variableChanges?.Mentale || 
                         dc.onFailure?.variableChanges?.Physique || 
                         0;
    
    const normalized = {
      ...choice,
      diceRoll: {
        enabled: dc.enabled !== undefined ? dc.enabled : true,
        difficulty: dc.difficulty || 12,
        successOutcome: {
          message: dc.onSuccess?.narratorText || '',
          moral: successMoral,
          illustration: dc.onSuccess?.illustration || ''
        },
        failureOutcome: {
          message: dc.onFailure?.narratorText || '',
          moral: failureMoral,
          illustration: dc.onFailure?.illustration || ''
        }
      }
    };
    delete normalized.diceCheck;
    return normalized;
  }

  // Si ni diceRoll ni diceCheck, retourner tel quel
  return choice;
}

/**
 * Normalize all choices in a dialogue
 * @param {Object} dialogue - Dialogue object
 * @returns {Object} - Dialogue with normalized choices
 */
export function normalizeDialogue(dialogue) {
  if (!dialogue.choices || dialogue.choices.length === 0) {
    return dialogue;
  }

  return {
    ...dialogue,
    choices: dialogue.choices.map(normalizeChoiceDiceFormat)
  };
}

/**
 * Normalize all dialogues in a template structure
 * @param {Object} template - Template object from scenarioTemplates.js
 * @returns {Object} - Template with normalized dialogues
 */
export function normalizeTemplate(template) {
  if (!template.structure || !template.structure.dialogues) {
    return template;
  }

  return {
    ...template,
    structure: {
      ...template.structure,
      dialogues: template.structure.dialogues.map(normalizeDialogue)
    }
  };
}
