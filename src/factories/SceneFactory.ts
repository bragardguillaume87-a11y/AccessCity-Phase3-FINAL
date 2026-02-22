/**
 * Scene Factory - Factory Method Pattern
 *
 * Centralizes scene creation logic with consistent defaults.
 * Ensures all scenes are created with proper structure and validation.
 *
 * Benefits:
 * - Consistent scene creation across the application
 * - Validation and sanity checks
 * - Default values management
 * - Easy to extend with new scene types
 *
 * @module factories/SceneFactory
 * @example
 * ```typescript
 * // Create an empty scene
 * const scene = SceneFactory.createEmpty('Living Room');
 *
 * // Create a scene with background
 * const scene = SceneFactory.createWithBackground(
 *   'Kitchen',
 *   'Kitchen scene description',
 *   '/assets/backgrounds/kitchen.jpg'
 * );
 *
 * // Clone an existing scene
 * const clone = SceneFactory.clone(existingScene, { title: 'Kitchen Copy' });
 * ```
 */

import type { Scene, SceneCharacter, Dialogue, Prop, TextBox, SceneAudio } from '@/types';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { logger } from '@/utils/logger';
import { SceneSchema, validate } from '@/schemas/validation';
import { z } from 'zod';

/**
 * Options for creating a scene
 */
export interface CreateSceneOptions {
  /** Scene title */
  title: string;
  /** Scene description */
  description: string;
  /** Background image URL */
  backgroundUrl: string;
  /** Background music configuration */
  audio?: SceneAudio;
  /** Optional scene characters */
  characters?: SceneCharacter[];
  /** Optional dialogues */
  dialogues?: Dialogue[];
  /** Optional props */
  props?: Prop[];
  /** Optional text boxes */
  textBoxes?: TextBox[];
  /** Optional custom ID (auto-generated if not provided) */
  id?: string;
}

/**
 * Scene Factory
 *
 * Factory for creating Scene objects with consistent defaults.
 * Implements the Factory Method pattern from Gang of Four.
 */
export class SceneFactory {
  /**
   * Generate a unique scene ID
   * Uses timestamp + random component for uniqueness
   *
   * @returns Unique scene ID
   */
  private static generateId(): string {
    return `scene-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a scene with full options
   * Most flexible creation method
   *
   * @param options - Scene creation options
   * @returns New Scene object
   * @throws ZodError if validation fails (invalid title, backgroundUrl, etc.)
   */
  static create(options: CreateSceneOptions): Scene {
    const {
      title,
      description,
      backgroundUrl,
      audio,
      characters = [],
      dialogues = [],
      props = [],
      textBoxes = [],
      id = this.generateId(),
    } = options;

    // Validate with Zod schema
    // This will throw a ZodError if validation fails (empty title, invalid URL, etc.)
    const validatedScene = validate(SceneSchema, {
      id,
      title: title.trim(),
      description: description.trim(),
      backgroundUrl: backgroundUrl.trim(),
      dialogues,
      characters,
      ...(textBoxes && textBoxes.length > 0 && { textBoxes }),
      ...(props && props.length > 0 && { props }),
      ...(audio && { audio }),
    });

    logger.debug(`[SceneFactory] Created scene: ${id} (title: ${title})`);

    return validatedScene;
  }

  /**
   * Create an empty scene
   * Most common use case - just title and description
   *
   * @param title - Scene title
   * @param description - Scene description (defaults to empty string)
   * @returns New empty Scene object
   */
  static createEmpty(title: string, description: string = ''): Scene {
    return this.create({
      title,
      description,
      backgroundUrl: '',
      characters: [],
      dialogues: [],
    });
  }

  /**
   * Create a scene with background image
   * Common use case for visual novel scenes
   *
   * @param title - Scene title
   * @param description - Scene description
   * @param backgroundUrl - URL to background image
   * @returns New Scene object
   */
  static createWithBackground(title: string, description: string, backgroundUrl: string): Scene {
    if (!backgroundUrl || backgroundUrl.trim() === '') {
      logger.warn('[SceneFactory] Creating scene with empty backgroundUrl');
    }

    return this.create({
      title,
      description,
      backgroundUrl,
    });
  }

  /**
   * Create a scene with background and music
   * Enhanced scene with audio
   *
   * @param title - Scene title
   * @param description - Scene description
   * @param backgroundUrl - URL to background image
   * @param audioUrl - URL to background music
   * @param audioOptions - Optional audio configuration (volume, loop, etc.)
   * @returns New Scene object
   */
  static createWithBackgroundAndMusic(
    title: string,
    description: string,
    backgroundUrl: string,
    audioUrl: string,
    audioOptions?: Partial<SceneAudio>
  ): Scene {
    return this.create({
      title,
      description,
      backgroundUrl,
      audio: {
        url: audioUrl,
        volume: audioOptions?.volume ?? AUDIO_DEFAULTS.MUSIC_VOLUME,
        loop: audioOptions?.loop ?? true,
        continueToNextScene: audioOptions?.continueToNextScene ?? false,
      },
    });
  }

  /**
   * Clone an existing scene with modifications
   * Useful for duplicating scenes with slight changes
   * Creates deep copies of arrays to avoid mutation
   *
   * @param source - Source scene to clone
   * @param overrides - Properties to override
   * @returns New Scene object (cloned with overrides)
   */
  static clone(source: Scene, overrides: Partial<CreateSceneOptions> = {}): Scene {
    return this.create({
      title: source.title,
      description: source.description,
      backgroundUrl: source.backgroundUrl,
      audio: source.audio ? { ...source.audio } : undefined,
      // Deep copy arrays
      characters: source.characters ? [...source.characters] : [],
      dialogues: source.dialogues ? [...source.dialogues] : [],
      props: source.props ? [...source.props] : [],
      textBoxes: source.textBoxes ? [...source.textBoxes] : [],
      // Generate new ID by default (can be overridden)
      id: this.generateId(),
      // Apply overrides
      ...overrides,
    });
  }

  /**
   * Create a template scene
   * Pre-configured scene for quick start
   *
   * @param title - Scene title
   * @param description - Scene description
   * @returns New template Scene object
   */
  static createTemplate(title: string, description: string = 'Template scene'): Scene {
    return this.create({
      title,
      description,
      backgroundUrl: '',
      characters: [],
      dialogues: [],
      props: [],
      textBoxes: [],
    });
  }

  /**
   * Validate a scene object using Zod schema
   * Checks for common issues and inconsistencies
   *
   * @param scene - Scene to validate
   * @returns True if valid, false otherwise
   */
  static validate(scene: Scene): boolean {
    try {
      SceneSchema.parse(scene);

      // Additional validation: Check dialogue references
      if (scene.dialogues.length > 0) {
        for (let i = 0; i < scene.dialogues.length; i++) {
          const dialogue = scene.dialogues[i];

          // Check if choices have valid nextDialogueId
          if (dialogue.choices && dialogue.choices.length > 0) {
            for (const choice of dialogue.choices) {
              if (choice.nextDialogueId) {
                const targetExists = scene.dialogues.some((d) => d.id === choice.nextDialogueId);
                if (!targetExists) {
                  logger.warn(
                    `[SceneFactory] Scene ${scene.id}: dialogue ${i} has choice with invalid nextDialogueId (${choice.nextDialogueId})`
                  );
                }
              }
            }
          }
        }
      }

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`[SceneFactory] Invalid scene ${scene.id}:`, error.issues);
      }
      return false;
    }
  }

  /**
   * Get scene statistics
   * Useful for debugging and analytics
   *
   * @param scene - Scene to analyze
   * @returns Statistics object
   */
  static getStats(scene: Scene): {
    characterCount: number;
    dialogueCount: number;
    propCount: number;
    textBoxCount: number;
    hasBackground: boolean;
    hasMusic: boolean;
  } {
    return {
      characterCount: scene.characters?.length || 0,
      dialogueCount: scene.dialogues?.length || 0,
      propCount: scene.props?.length || 0,
      textBoxCount: scene.textBoxes?.length || 0,
      hasBackground: !!scene.backgroundUrl,
      hasMusic: !!scene.audio,
    };
  }
}
