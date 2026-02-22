/**
 * Core Game Engine — Factory and barrel exports
 */

import type { CreateEngineParams, GameEngine } from '@/types';
import { EventBus } from './EventBus';
import { VariableManager } from './VariableManager';
import { DialogueEngine } from './DialogueEngine';

// Re-export all engine modules
export { EventBus } from './EventBus';
export { VariableManager } from './VariableManager';
export { ConditionEvaluator } from './ConditionEvaluator';
export { DialogueEngine } from './DialogueEngine';

/**
 * Create a complete game engine instance
 */
export function createEngine(params?: CreateEngineParams): GameEngine {
  const initialVars = params?.initialVars;
  const bus = new EventBus();
  const vm = new VariableManager(initialVars);
  const engine = new DialogueEngine(bus, vm);

  return {
    eventBus: bus,
    variableManager: vm,
    dialogueEngine: engine
  };
}
