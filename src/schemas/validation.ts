/**
 * Zod Validation Schemas
 *
 * Provides runtime validation for critical data types to prevent bugs
 * caused by invalid data (empty strings, missing required fields, etc.)
 *
 * Benefits:
 * - Catches invalid data at creation time (not at runtime crash)
 * - Clear error messages for users and developers
 * - Type safety with automatic TypeScript inference
 * - Easy to test and maintain
 *
 * @module schemas/validation
 */

import { z } from 'zod';

// ============================================================================
// PRIMITIVE VALIDATIONS
// ============================================================================

/**
 * Non-empty string validation
 * Used for required text fields
 */
export const NonEmptyString = z.string().min(1, 'Ce champ ne peut pas être vide');

/**
 * Optional string validation
 * Used for optional text fields
 */
export const OptionalString = z.string().optional();

/**
 * URL validation
 * Used for asset URLs, backgrounds, etc.
 */
export const UrlString = z.string().min(1, 'URL requise');

/**
 * ID validation
 * UUIDs or nanoid format
 */
export const IdString = z.string().min(1, 'ID requis');

// ============================================================================
// POSITION & SIZE
// ============================================================================

/**
 * Position schema (x, y coordinates)
 */
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/**
 * Size schema (width, height)
 */
export const SizeSchema = z.object({
  width: z.number().min(0, 'Width must be positive'),
  height: z.number().min(0, 'Height must be positive'),
});

// ============================================================================
// GAME MECHANICS
// ============================================================================

/**
 * Game stats schema
 */
export const GameStatsSchema = z.record(z.string(), z.number());

/**
 * Effect schema
 */
export const EffectSchema = z.object({
  variable: NonEmptyString,
  value: z.number(),
  operation: z.enum(['add', 'set', 'multiply']),
});

/**
 * Dice check branch schema
 */
export const DiceCheckBranchSchema = z.object({
  nextSceneId: OptionalString,
  nextDialogueId: OptionalString,
});

/**
 * Dice check schema
 */
export const DiceCheckSchema = z.object({
  stat: NonEmptyString,
  difficulty: z.number().min(0).max(100),
  success: DiceCheckBranchSchema.optional(),
  failure: DiceCheckBranchSchema.optional(),
});

// ============================================================================
// AUDIO
// ============================================================================

/**
 * Scene audio schema
 */
export const SceneAudioSchema = z.object({
  url: UrlString,
  volume: z.number().min(0).max(1).optional().default(0.5),
  loop: z.boolean().optional().default(true),
  continueToNextScene: z.boolean().optional().default(false),
});

/**
 * Dialogue audio (SFX) schema
 */
export const DialogueAudioSchema = z.object({
  url: UrlString,
  volume: z.number().min(0).max(1).optional().default(0.7),
});

// ============================================================================
// DIALOGUE CHOICE
// ============================================================================

/**
 * Dialogue choice schema
 *
 * Validation rules:
 * - text: Required, non-empty
 * - effects: Array (can be empty)
 * - nextSceneId, nextDialogueId: Optional
 * - diceCheck: Optional
 */
export const DialogueChoiceSchema = z.object({
  id: IdString,
  text: NonEmptyString.min(1, 'Le texte du choix ne peut pas être vide'),
  effects: z.array(EffectSchema).default([]),
  nextSceneId: OptionalString,
  nextDialogueId: OptionalString,
  statsDelta: GameStatsSchema.optional(),
  diceCheck: DiceCheckSchema.optional(),
});

/**
 * Input for creating a dialogue choice
 * ID is generated automatically
 */
export const DialogueChoiceInputSchema = DialogueChoiceSchema.omit({ id: true });

// ============================================================================
// DIALOGUE
// ============================================================================

/**
 * Dialogue schema
 *
 * Validation rules:
 * - speaker: Required, non-empty (1-100 chars)
 * - text: Required, non-empty (1-5000 chars max)
 * - choices: Array (can be empty)
 * - sfx: Optional sound effect
 */
export const DialogueSchema = z.object({
  id: IdString,
  speaker: NonEmptyString.min(1, 'Le nom du speaker ne peut pas être vide').max(
    100,
    'Le nom du speaker est trop long (max 100 caractères)'
  ),
  text: NonEmptyString.min(1, 'Le texte du dialogue ne peut pas être vide').max(
    5000,
    'Le texte du dialogue est trop long (max 5000 caractères)'
  ),
  choices: z.array(DialogueChoiceSchema).default([]),
  sfx: DialogueAudioSchema.optional(),
});

/**
 * Input for creating a dialogue
 * ID is generated automatically
 */
export const DialogueInputSchema = DialogueSchema.omit({ id: true });

// ============================================================================
// SCENE CHARACTER
// ============================================================================

/**
 * Scene character schema
 */
export const SceneCharacterSchema = z.object({
  id: IdString,
  characterId: IdString,
  mood: NonEmptyString,
  position: PositionSchema,
  size: SizeSchema,
  scale: z.number().min(0.1).max(5).optional().default(1),
  zIndex: z.number().optional(),
  entranceAnimation: z.string().default('none'),
  exitAnimation: z.string().default('none'),
});

// ============================================================================
// PROPS & TEXT BOXES
// ============================================================================

/**
 * Prop schema
 */
export const PropSchema = z.object({
  id: IdString,
  assetUrl: UrlString,
  position: PositionSchema,
  size: SizeSchema,
  rotation: z.number().optional().default(0),
});

/**
 * Text box schema
 */
export const TextBoxSchema = z.object({
  id: IdString,
  content: NonEmptyString,
  position: PositionSchema,
  size: SizeSchema,
  style: z.any().optional(), // React.CSSProperties - hard to validate
});

// ============================================================================
// SCENE
// ============================================================================

/**
 * Scene schema
 *
 * Validation rules:
 * - title: Required, non-empty (1-100 chars)
 * - description: Optional (max 500 chars)
 * - backgroundUrl: Required, non-empty
 * - dialogues: Array (can be empty)
 * - characters: Array (can be empty)
 */
export const SceneSchema = z.object({
  id: IdString,
  title: NonEmptyString.min(1, 'Le titre de la scène ne peut pas être vide').max(
    100,
    'Le titre de la scène est trop long (max 100 caractères)'
  ),
  description: z
    .string()
    .max(500, 'La description est trop longue (max 500 caractères)')
    .default(''),
  backgroundUrl: UrlString,
  dialogues: z.array(DialogueSchema).default([]),
  characters: z.array(SceneCharacterSchema).default([]),
  textBoxes: z.array(TextBoxSchema).optional().default([]),
  props: z.array(PropSchema).optional().default([]),
  audio: SceneAudioSchema.optional(),
});

/**
 * Input for creating a scene
 * ID is generated automatically
 */
export const SceneInputSchema = SceneSchema.omit({ id: true });

// ============================================================================
// CHARACTER
// ============================================================================

/**
 * Character schema
 *
 * Validation rules:
 * - name: Required, non-empty (1-100 chars)
 * - description: Optional (max 500 chars)
 * - sprites: Record of mood -> URL (must have at least one)
 * - moods: Array of mood names (must have at least one)
 */
export const CharacterSchema = z.object({
  id: IdString,
  name: NonEmptyString.min(1, 'Le nom du personnage ne peut pas être vide').max(
    100,
    'Le nom du personnage est trop long (max 100 caractères)'
  ),
  description: z
    .string()
    .max(500, 'La description est trop longue (max 500 caractères)')
    .default(''),
  sprites: z.record(z.string(), UrlString).refine((sprites) => Object.keys(sprites).length > 0, {
    message: 'Le personnage doit avoir au moins un sprite',
  }),
  moods: z.array(NonEmptyString).min(1, 'Le personnage doit avoir au moins une humeur (mood)'),
});

/**
 * Input for creating a character
 * ID is generated automatically
 */
export const CharacterInputSchema = CharacterSchema.omit({ id: true });

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and parse data with a schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and parsed data
 * @throws ZodError if validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const validScene = validate(SceneInputSchema, {
 *     title: 'My Scene',
 *     description: 'A test scene',
 *     backgroundUrl: '/bg.jpg',
 *     dialogues: [],
 *     characters: [],
 *   });
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Validation failed:', error.errors);
 *   }
 * }
 * ```
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate data, returning null on error
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or null if validation fails
 *
 * @example
 * ```typescript
 * const validScene = safeParse(SceneInputSchema, userData);
 * if (!validScene) {
 *   showError('Invalid scene data');
 *   return;
 * }
 * ```
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Extract user-friendly error messages from Zod validation errors
 *
 * @param error - ZodError instance
 * @returns Array of error messages
 *
 * @example
 * ```typescript
 * try {
 *   validate(SceneSchema, invalidData);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     const messages = getErrorMessages(error);
 *     // ['Le titre de la scène ne peut pas être vide', 'URL requise']
 *   }
 * }
 * ```
 */
export function getErrorMessages(error: z.ZodError): string[] {
  return error.issues.map((err) => err.message);
}
