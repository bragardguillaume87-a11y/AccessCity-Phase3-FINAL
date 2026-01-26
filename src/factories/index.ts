/**
 * Factories Module - Factory Method Pattern
 *
 * Central export point for all factory classes.
 * Implements the Factory Method pattern from Gang of Four.
 *
 * @module factories
 */

export { DialogueFactory } from './DialogueFactory';
export type { CreateDialogueOptions } from './DialogueFactory';

export { SceneFactory } from './SceneFactory';
export type { CreateSceneOptions } from './SceneFactory';
