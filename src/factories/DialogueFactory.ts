/**
 * Dialogue Factory - Factory Method Pattern
 *
 * Centralizes dialogue creation logic with consistent defaults.
 * Ensures all dialogues are created with proper structure and validation.
 *
 * Benefits:
 * - Consistent object creation across the application
 * - Single source of truth for default values
 * - Easy to modify creation logic globally
 * - Supports different creation strategies (text, choices, audio)
 *
 * @module factories/DialogueFactory
 * @example
 * ```typescript
 * // Create a simple dialogue
 * const dialogue = DialogueFactory.createText('Character1', 'Hello world!');
 *
 * // Create a dialogue with choices
 * const choiceDialogue = DialogueFactory.createWithChoices(
 *   'Character1',
 *   'What do you want to do?',
 *   [
 *     { text: 'Option A', nextDialogue: 1 },
 *     { text: 'Option B', nextDialogue: 2 }
 *   ]
 * );
 * ```
 */

import type { Dialogue, DialogueChoice, DialogueAudio } from '@/types';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { logger } from '@/utils/logger';
import { DialogueSchema, validate } from '@/schemas/validation';
import { z } from 'zod';

/**
 * Options for creating a dialogue
 */
export interface CreateDialogueOptions {
  /** Dialogue speaker/character name */
  speaker: string;
  /** Dialogue text content */
  text: string;
  /** Optional choices for branching */
  choices?: DialogueChoice[];
  /** Optional sound effect to play when dialogue appears */
  sfx?: DialogueAudio;
  /** Optional custom ID (auto-generated if not provided) */
  id?: string;
}

/**
 * Dialogue Factory
 *
 * Factory for creating Dialogue objects with consistent defaults.
 * Implements the Factory Method pattern from Gang of Four.
 */
export class DialogueFactory {
  /**
   * Generate a unique dialogue ID
   * Uses timestamp + random component for uniqueness
   *
   * @returns Unique dialogue ID
   */
  private static generateId(): string {
    return `dialogue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a dialogue with full options
   * Most flexible creation method
   *
   * @param options - Dialogue creation options
   * @returns New Dialogue object
   * @throws ZodError if validation fails (invalid speaker or text)
   */
  static create(options: CreateDialogueOptions): Dialogue {
    const {
      speaker,
      text,
      choices = [],
      sfx,
      id = this.generateId(),
    } = options;

    // Validate with Zod schema
    // This will throw a ZodError if validation fails (empty speaker/text, etc.)
    const validatedDialogue = validate(DialogueSchema, {
      id,
      speaker: speaker.trim(),
      text: text.trim(),
      choices,
      ...(sfx && { sfx }),
    });

    logger.debug(`[DialogueFactory] Created dialogue: ${id} (speaker: ${speaker})`);

    return validatedDialogue;
  }

  /**
   * Create a simple text dialogue
   * Most common use case - speaker + text only
   *
   * @param speaker - Character name
   * @param text - Dialogue text
   * @returns New Dialogue object
   */
  static createText(
    speaker: string,
    text: string
  ): Dialogue {
    return this.create({
      speaker,
      text,
    });
  }

  /**
   * Create a dialogue with choices (branching)
   * Used for player decision points
   *
   * @param speaker - Character name
   * @param text - Question/prompt text
   * @param choices - Array of choice options
   * @returns New Dialogue object
   */
  static createWithChoices(
    speaker: string,
    text: string,
    choices: DialogueChoice[]
  ): Dialogue {
    if (!choices || choices.length === 0) {
      logger.warn('[DialogueFactory] Creating choice dialogue with no choices');
    }

    return this.create({
      speaker,
      text,
      choices,
    });
  }

  /**
   * Create a dialogue with sound effect
   * Used for ambient sounds during dialogue
   *
   * @param speaker - Character name
   * @param text - Dialogue text
   * @param sfxUrl - Sound effect URL
   * @param volume - Optional volume (0-1, defaults to 0.7)
   * @returns New Dialogue object
   */
  static createWithSoundEffect(
    speaker: string,
    text: string,
    sfxUrl: string,
    volume: number = AUDIO_DEFAULTS.SFX_VOLUME
  ): Dialogue {
    if (!sfxUrl || sfxUrl.trim() === '') {
      logger.warn('[DialogueFactory] Creating dialogue with empty sfxUrl');
    }

    return this.create({
      speaker,
      text,
      sfx: { url: sfxUrl, volume },
    });
  }

  /**
   * Clone an existing dialogue with modifications
   * Useful for duplicating dialogues with slight changes
   *
   * @param source - Source dialogue to clone
   * @param overrides - Properties to override
   * @returns New Dialogue object (cloned with overrides)
   */
  static clone(
    source: Dialogue,
    overrides: Partial<CreateDialogueOptions> = {}
  ): Dialogue {
    return this.create({
      speaker: source.speaker,
      text: source.text,
      choices: source.choices ? [...source.choices] : [],
      sfx: source.sfx,
      // Generate new ID by default (can be overridden)
      id: this.generateId(),
      // Apply overrides
      ...overrides,
    });
  }

  /**
   * Create a placeholder/empty dialogue
   * Used for initialization or temporary states.
   *
   * ⚠️ Bypasses Zod validation intentionally — text is empty (draft state).
   *    Call DialogueFactory.validate() before persisting.
   *
   * @param speaker - Optional speaker name (defaults to 'Narrator')
   * @returns New empty Dialogue object (not validated)
   */
  static createEmpty(speaker: string = 'Narrator'): Dialogue {
    return {
      id: this.generateId(),
      speaker,
      text: '',
      choices: [],
    };
  }

  /**
   * Validate a dialogue object using Zod schema
   * Checks for common issues and inconsistencies
   *
   * @param dialogue - Dialogue to validate
   * @returns True if valid, false otherwise
   */
  static validate(dialogue: Dialogue): boolean {
    try {
      DialogueSchema.parse(dialogue);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`[DialogueFactory] Invalid dialogue ${dialogue.id}:`, error.issues);
      }
      return false;
    }
  }
}
