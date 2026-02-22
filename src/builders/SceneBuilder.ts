/**
 * Scene Builder - Builder Pattern
 *
 * Provides a fluent API for constructing complex Scene objects step-by-step.
 * Implements the Builder pattern from Gang of Four.
 *
 * Benefits:
 * - Fluent, chainable API for scene construction
 * - Step-by-step scene building with validation
 * - Separation of construction from representation
 * - Easy to read and maintain complex scene creation
 *
 * @module builders/SceneBuilder
 * @example
 * ```typescript
 * const scene = new SceneBuilder('Living Room', 'A cozy living room')
 *   .withBackground('/assets/backgrounds/living-room.jpg')
 *   .withMusic('/assets/music/calm.mp3')
 *   .addCharacter('char-1', { x: 100, y: 200 }, { width: 150, height: 300 }, 'happy')
 *   .addDialogue('Character1', 'Hello there!')
 *   .addDialogue('Character1', 'How are you?')
 *   .build();
 * ```
 */

import type {
  Scene,
  SceneCharacter,
  Prop,
  TextBox,
  Position,
  Size,
  SceneAudio,
  DialogueChoice,
} from '@/types';
import { SceneFactory } from '@/factories/SceneFactory';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { logger } from '@/utils/logger';

/**
 * Scene Builder
 *
 * Fluent builder for constructing Scene objects.
 * Provides chainable methods for adding elements to a scene.
 */
export class SceneBuilder {
  private scene: Scene;

  /**
   * Create a new SceneBuilder
   *
   * @param title - Scene title
   * @param description - Scene description (optional, defaults to empty string)
   * @param id - Optional scene ID (auto-generated if not provided)
   */
  constructor(title: string, description: string = '', id?: string) {
    this.scene = SceneFactory.create({
      title,
      description,
      backgroundUrl: '',
      id,
    });

    logger.debug(`[SceneBuilder] Started building scene: ${this.scene.id}`);
  }

  /**
   * Set the background image
   *
   * @param backgroundUrl - URL to background image
   * @returns this (for chaining)
   */
  withBackground(backgroundUrl: string): this {
    this.scene.backgroundUrl = backgroundUrl;
    return this;
  }

  /**
   * Set the background music
   *
   * @param audioUrl - URL to background music file
   * @param options - Optional audio configuration (volume, loop, continueToNextScene)
   * @returns this (for chaining)
   */
  withMusic(audioUrl: string, options?: Partial<Omit<SceneAudio, 'url'>>): this {
    this.scene.audio = {
      url: audioUrl,
      volume: options?.volume ?? AUDIO_DEFAULTS.MUSIC_VOLUME,
      loop: options?.loop ?? true,
      continueToNextScene: options?.continueToNextScene ?? false,
    };
    return this;
  }

  /**
   * Add a character to the scene
   *
   * @param characterId - Character ID from characters store
   * @param position - Position on canvas
   * @param size - Size of character sprite
   * @param mood - Character mood/expression (defaults to 'neutral')
   * @param options - Optional character options (scale, zIndex, animations)
   * @returns this (for chaining)
   */
  addCharacter(
    characterId: string,
    position: Position,
    size: Size,
    mood: string = 'neutral',
    options?: {
      scale?: number;
      zIndex?: number;
      entranceAnimation?: string;
      exitAnimation?: string;
    }
  ): this {
    const sceneCharacter: SceneCharacter = {
      id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      characterId,
      position,
      size,
      mood,
      scale: options?.scale ?? 1,
      zIndex: options?.zIndex ?? 1,
      entranceAnimation: options?.entranceAnimation ?? 'fadeIn',
      exitAnimation: options?.exitAnimation ?? 'fadeOut',
    };

    this.scene.characters.push(sceneCharacter);

    logger.debug(
      `[SceneBuilder] Added character ${characterId} to scene ${this.scene.id} at (${position.x}, ${position.y})`
    );

    return this;
  }

  /**
   * Add a dialogue to the scene
   * Uses DialogueFactory internally
   *
   * @param speaker - Character name
   * @param text - Dialogue text
   * @param sfxUrl - Optional sound effect URL
   * @returns this (for chaining)
   */
  addDialogue(speaker: string, text: string, sfxUrl?: string): this {
    const dialogue = DialogueFactory.create({
      speaker,
      text,
      ...(sfxUrl && { sfx: { url: sfxUrl, volume: AUDIO_DEFAULTS.SFX_VOLUME } }),
    });

    this.scene.dialogues.push(dialogue);

    logger.debug(`[SceneBuilder] Added dialogue to scene ${this.scene.id}: "${text}"`);

    return this;
  }

  /**
   * Add a dialogue with choices
   *
   * @param speaker - Character name
   * @param text - Dialogue text
   * @param choices - Array of choice options
   * @returns this (for chaining)
   */
  addDialogueWithChoices(
    speaker: string,
    text: string,
    choices: DialogueChoice[]
  ): this {
    const dialogue = DialogueFactory.createWithChoices(speaker, text, choices);

    this.scene.dialogues.push(dialogue);

    logger.debug(
      `[SceneBuilder] Added dialogue with ${choices.length} choices to scene ${this.scene.id}`
    );

    return this;
  }

  /**
   * Add a prop to the scene
   *
   * @param assetUrl - URL to prop asset
   * @param position - Position on canvas
   * @param size - Size of prop
   * @param rotation - Optional rotation in degrees (defaults to 0)
   * @returns this (for chaining)
   */
  addProp(
    assetUrl: string,
    position: Position,
    size: Size,
    rotation: number = 0
  ): this {
    const prop: Prop = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      assetUrl,
      position,
      size,
      rotation,
    };

    // Initialize props array if it doesn't exist
    if (!this.scene.props) {
      this.scene.props = [];
    }

    this.scene.props.push(prop);

    logger.debug(`[SceneBuilder] Added prop to scene ${this.scene.id}`);

    return this;
  }

  /**
   * Add a text box to the scene
   *
   * @param content - Text content
   * @param position - Position on canvas
   * @param size - Size of text box
   * @param style - Optional style object
   * @returns this (for chaining)
   */
  addTextBox(
    content: string,
    position: Position,
    size: Size,
    style?: React.CSSProperties
  ): this {
    const textBox: TextBox = {
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content,
      position,
      size,
      style: style || {},
    };

    // Initialize textBoxes array if it doesn't exist
    if (!this.scene.textBoxes) {
      this.scene.textBoxes = [];
    }

    this.scene.textBoxes.push(textBox);

    logger.debug(`[SceneBuilder] Added text box to scene ${this.scene.id}`);

    return this;
  }

  /**
   * Set the scene title
   *
   * @param title - New scene title
   * @returns this (for chaining)
   */
  withTitle(title: string): this {
    this.scene.title = title;
    return this;
  }

  /**
   * Set the scene description
   *
   * @param description - New scene description
   * @returns this (for chaining)
   */
  withDescription(description: string): this {
    this.scene.description = description;
    return this;
  }

  /**
   * Reset builder to start fresh
   * Useful for reusing the same builder instance
   *
   * @param title - New scene title
   * @param description - New scene description (optional)
   * @param id - Optional new scene ID
   * @returns this (for chaining)
   */
  reset(title: string, description: string = '', id?: string): this {
    this.scene = SceneFactory.create({
      title,
      description,
      backgroundUrl: '',
      id,
    });

    logger.debug(`[SceneBuilder] Reset builder with new scene: ${this.scene.id}`);

    return this;
  }

  /**
   * Build and return the final Scene object
   * Validates the scene before returning
   *
   * @param validate - Whether to validate scene (defaults to true)
   * @returns Completed Scene object
   * @throws Error if validation fails
   */
  build(validate: boolean = true): Scene {
    if (validate) {
      const isValid = SceneFactory.validate(this.scene);
      if (!isValid) {
        const error = `[SceneBuilder] Failed to build scene ${this.scene.id}: validation failed`;
        logger.error(error);
        throw new Error(error);
      }
    }

    logger.info(
      `[SceneBuilder] Built scene ${this.scene.id}: ${this.scene.dialogues.length} dialogues, ${this.scene.characters.length} characters`
    );

    // Return a deep copy to prevent external mutation
    return {
      ...this.scene,
      dialogues: [...this.scene.dialogues],
      characters: [...this.scene.characters],
      props: this.scene.props ? [...this.scene.props] : undefined,
      textBoxes: this.scene.textBoxes ? [...this.scene.textBoxes] : undefined,
      audio: this.scene.audio ? { ...this.scene.audio } : undefined,
    };
  }

  /**
   * Get current scene state (preview)
   * Returns a copy without finalizing the build
   *
   * @returns Current Scene state
   */
  preview(): Scene {
    return {
      ...this.scene,
      dialogues: [...this.scene.dialogues],
      characters: [...this.scene.characters],
      props: this.scene.props ? [...this.scene.props] : undefined,
      textBoxes: this.scene.textBoxes ? [...this.scene.textBoxes] : undefined,
      audio: this.scene.audio ? { ...this.scene.audio } : undefined,
    };
  }

  /**
   * Get scene statistics
   *
   * @returns Scene statistics
   */
  getStats(): {
    characterCount: number;
    dialogueCount: number;
    propCount: number;
    textBoxCount: number;
  } {
    return {
      characterCount: this.scene.characters.length,
      dialogueCount: this.scene.dialogues.length,
      propCount: this.scene.props?.length || 0,
      textBoxCount: this.scene.textBoxes?.length || 0,
    };
  }
}

/**
 * Helper function to create a SceneBuilder
 * Provides a cleaner API: scene('name', 'desc') instead of new SceneBuilder('name', 'desc')
 *
 * @param title - Scene title
 * @param description - Scene description (optional)
 * @param id - Optional scene ID
 * @returns New SceneBuilder instance
 */
export function createSceneBuilder(title: string, description?: string, id?: string): SceneBuilder {
  return new SceneBuilder(title, description, id);
}
