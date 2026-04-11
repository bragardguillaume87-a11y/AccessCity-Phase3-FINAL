/**
 * Constantes de validation des dialogues et des choix
 *
 * Source canonique pour les seuils de validation des composants
 * DialogueComposer, DialogueComposerV2, ComplexChoiceBuilder, DiceChoiceBuilder.
 */

/** Nombre minimum de caractères pour le texte d'un dialogue */
export const DIALOGUE_MIN_TEXT_LENGTH = 10;

/** Nombre maximum de caractères pour le texte d'un dialogue (source unique) */
export const DIALOGUE_MAX_TEXT_LENGTH = 500;

/** Nombre minimum de caractères pour le texte d'un choix */
export const CHOICE_MIN_TEXT_LENGTH = 5;

/** Nombre minimum de choix dans un dialogue à embranchements */
export const CHOICE_MIN_COUNT = 2;

/** Nombre maximum de choix dans un dialogue à embranchements */
export const CHOICE_MAX_COUNT = 4;
