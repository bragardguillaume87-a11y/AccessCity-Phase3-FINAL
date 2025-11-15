// core/constants.js
// Constantes globales projet AccessCity Scene Editor
// Version Phase 3
// ASCII strict : ' et " uniquement

  /**
 * Longueurs maximales pour validation
 */
  export const MAX_LENGTHS = {
  DIALOGUE_CONTENT: 500,
  CHOICE_TEXT: 200,
  CHARACTER_NAME: 100,
  CHARACTER_BIO: 1000
  };

  /**
 * Expressions faciales valides
 */
  export const VALID_EXPRESSIONS = [
  'default',
  'happy',
  'sad',
  'angry',
  'surprised',
  'neutral'
  ];

  /**
 * Configuration EventBus
 */
  export const EVENT_BUS_CONFIG = {
  MAX_LISTENERS_PER_EVENT: 100
  };
