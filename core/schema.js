// core/schema.js
// Module de validation centralise pour tous les modeles
// Version 3.1 - Phase 3 (PATCH SECURITE S3.1)
// ASCII strict : ' et " uniquement

  import { MAX_LENGTHS, VALID_EXPRESSIONS } from './constants.js';

  /**
 * SCHEMAS - Definitions de validation par type de modele
 * Chaque schema contient les regles de validation (types, longueurs, valeurs)
 */
  const SCHEMAS = {
  scene: {
    id: { type: 'string', required: true, minLength: 1 },
    name: { type: 'string', required: true, minLength: 1 },
    dialogues: { type: 'array', required: false },
    createdAt: { type: 'string', required: false }
  },
  
  dialogue: {
    id: { type: 'string', required: true, minLength: 1 },
    characterId: { type: 'string', required: true, minLength: 1 },
    content: { 
      type: 'string', 
      required: true, 
      maxLength: MAX_LENGTHS.DIALOGUE_CONTENT 
    },
    expression: { 
      type: 'string', 
      required: false, 
      enum: VALID_EXPRESSIONS 
    },
    choices: { type: 'array', required: false, maxLength: 4 },
    nextDialogueId: { type: 'string', required: false },
    isStartingPoint: { type: 'boolean', required: false },
    tags: { type: 'array', required: false },
    createdAt: { type: 'string', required: false }
  },
  
  choice: {
    id: { type: 'string', required: true, minLength: 1 },
    text: { 
      type: 'string', 
      required: true, 
      minLength: 1, 
      maxLength: MAX_LENGTHS.CHOICE_TEXT 
    },
    nextDialogueId: { type: 'string', required: true, minLength: 1 },
    variableImpact: { type: 'object', required: false },
    conditionId: { type: 'string', required: false },
    createdAt: { type: 'string', required: false }
  },
  
  condition: {
    id: { type: 'string', required: true, minLength: 1 },
    variable: { type: 'string', required: true, minLength: 1 },
    operator: { type: 'string', required: true, enum: ['==', '!=', '<', '>', '<=', '>='] },
    value: { type: 'number', required: true },
    createdAt: { type: 'string', required: false }
  },
  
  character: {
    id: { type: 'string', required: true, minLength: 1 },
    name: { 
      type: 'string', 
      required: true, 
      minLength: 1, 
      maxLength: MAX_LENGTHS.CHARACTER_NAME 
    },
    age: { type: 'number', required: true, min: 0, max: 150 },
    handicap: { type: 'string', required: false },
    bio: { 
      type: 'string', 
      required: false, 
      maxLength: MAX_LENGTHS.CHARACTER_BIO 
    },
    createdAt: { type: 'string', required: false }
  }
  };

  /**
 * Valide un champ selon sa definition
 * @param {string} fieldName - Nom du champ
 * @param {*} value - Valeur a valider
 * @param {Object} fieldSchema - Definition schema du champ
 * @returns {Array<string>} Liste erreurs (vide si valide)
 */
  function validateField(fieldName, value, fieldSchema) {
  const errors = [];
  
  // Champ requis
  if (fieldSchema.required && (value === undefined || value === null)) {
    errors.push(`${fieldName} est requis`);
    return errors;
  }
  
  // Si non requis et absent, OK
  if (value === undefined || value === null) {
    return errors;
  }
  
  // Type
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (actualType !== fieldSchema.type) {
    errors.push(`${fieldName} doit etre de type ${fieldSchema.type}, recu ${actualType}`);
    return errors;
  }
  
  // String validations
  if (fieldSchema.type === 'string') {
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
      errors.push(`${fieldName} doit contenir au moins ${fieldSchema.minLength} caractere(s)`);
    }
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push(`${fieldName} ne peut pas depasser ${fieldSchema.maxLength} caracteres`);
    }
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push(`${fieldName} doit etre parmi: ${fieldSchema.enum.join(', ')}`);
    }
  }
  
  // Number validations
  if (fieldSchema.type === 'number') {
    if (!Number.isFinite(value)) {
      errors.push(`${fieldName} doit etre un nombre fini`);
    }
    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
      errors.push(`${fieldName} doit etre >= ${fieldSchema.min}`);
    }
    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
      errors.push(`${fieldName} doit etre <= ${fieldSchema.max}`);
    }
  }
  
  // Array validations
  if (fieldSchema.type === 'array') {
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push(`${fieldName} ne peut pas contenir plus de ${fieldSchema.maxLength} elements`);
    }
  }
  
  return errors;
  }

  /**
 * Valide un objet Scene
 * @param {Object} data - Donnees scene
 * @returns {Array<string>} Liste erreurs
 */
  function validateScene(data) {
  const errors = [];
  const schema = SCHEMAS.scene;
  
  if (!data || typeof data !== 'object') {
    return ['Scene doit etre un objet'];
  }
  
  // Valider chaque champ
  Object.keys(schema).forEach(field => {
    const fieldErrors = validateField(field, data[field], schema[field]);
    errors.push(...fieldErrors);
  });
  
  return errors;
  }

  /**
 * Valide un objet Dialogue
 * @param {Object} data - Donnees dialogue
 * @returns {Array<string>} Liste erreurs
 */
  function validateDialogue(data) {
  const errors = [];
  const schema = SCHEMAS.dialogue;
  
  if (!data || typeof data !== 'object') {
    return ['Dialogue doit etre un objet'];
  }
  
  Object.keys(schema).forEach(field => {
    const fieldErrors = validateField(field, data[field], schema[field]);
    errors.push(...fieldErrors);
  });
  
  return errors;
  }

  /**
 * Valide un objet Choice
 * PATCH SECURITE S3.1: Protection pollution prototype dans variableImpact
 * @param {Object} data - Donnees choix
 * @returns {Array<string>} Liste erreurs
 */
  function validateChoice(data) {
  const errors = [];
  const schema = SCHEMAS.choice;
  
  if (!data || typeof data !== 'object') {
    return ['Choice doit etre un objet'];
  }
  
  Object.keys(schema).forEach(field => {
    const fieldErrors = validateField(field, data[field], schema[field]);
    errors.push(...fieldErrors);
  });
  
  // PATCH SECURITE S3.1: Validation renforcee variableImpact
  if (data.variableImpact && typeof data.variableImpact === 'object') {
    // Blacklist cles dangereuses (protection pollution prototype)
    const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];
    
    Object.entries(data.variableImpact).forEach(([varName, delta]) => {
      if (typeof varName !== 'string' || varName.trim() === '') {
        errors.push('variableImpact: nom variable invalide');
      }
      
      // SECURITE: Bloquer cles reservation systeme
      if (FORBIDDEN_KEYS.includes(varName)) {
        errors.push(`variableImpact: nom variable interdit (${varName})`);
      }
      
      if (!Number.isFinite(delta)) {
        errors.push(`variableImpact.${varName}: delta doit etre un nombre fini`);
      }
    });
  }
  
  return errors;
  }

  /**
 * Valide un objet Condition
 * @param {Object} data - Donnees condition
 * @returns {Array<string>} Liste erreurs
 */
  function validateCondition(data) {
  const errors = [];
  const schema = SCHEMAS.condition;
  
  if (!data || typeof data !== 'object') {
    return ['Condition doit etre un objet'];
  }
  
  Object.keys(schema).forEach(field => {
    const fieldErrors = validateField(field, data[field], schema[field]);
    errors.push(...fieldErrors);
  });
  
  return errors;
  }

  /**
 * Valide un objet Character
 * @param {Object} data - Donnees personnage
 * @returns {Array<string>} Liste erreurs
 */
  function validateCharacter(data) {
  const errors = [];
  const schema = SCHEMAS.character;
  
  if (!data || typeof data !== 'object') {
    return ['Character doit etre un objet'];
  }
  
  Object.keys(schema).forEach(field => {
    const fieldErrors = validateField(field, data[field], schema[field]);
    errors.push(...fieldErrors);
  });
  
  return errors;
  }

  /**
 * Fonction principale de validation
 * @param {string} type - Type modele ('scene'|'dialogue'|'choice'|'condition'|'character')
 * @param {Object} data - Donnees a valider
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
  function validate(type, data) {
  const validTypes = ['scene', 'dialogue', 'choice', 'condition', 'character'];
  
  if (!validTypes.includes(type)) {
    return {
      valid: false,
      errors: [`Type invalide: ${type}. Types supportes: ${validTypes.join(', ')}`]
    };
  }
  
  let errors = [];
  
  switch (type) {
    case 'scene':
      errors = validateScene(data);
      break;
    case 'dialogue':
      errors = validateDialogue(data);
      break;
    case 'choice':
      errors = validateChoice(data);
      break;
    case 'condition':
      errors = validateCondition(data);
      break;
    case 'character':
      errors = validateCharacter(data);
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
  }

// Exports
  export {
  validate,
  validateScene,
  validateDialogue,
  validateChoice,
  validateCondition,
  validateCharacter,
  SCHEMAS
  };

  export default validate;
