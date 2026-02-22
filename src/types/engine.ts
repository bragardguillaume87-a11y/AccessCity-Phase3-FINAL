import type { GameStats } from './game';
import type { DialogueChoice, Scene } from './scenes';

export interface EventBusEvents {
  'dialogue:show': {
    speaker: string;
    text: string;
    choices: DialogueChoice[];
  };
  'scene:complete': {
    sceneId: string;
  };
  'variables:updated': GameStats;
  'variables:delta': Array<{
    variable: string;
    delta: number;
  }>;
}

export type EventCallback<T = unknown> = (data: T) => void;

export interface CreateEngineParams {
  initialVars?: GameStats;
}

export interface GameEngine {
  eventBus: EventBus;
  variableManager: VariableManager;
  dialogueEngine: DialogueEngine;
}

export interface EventBus {
  on<K extends keyof EventBusEvents>(event: K, callback: EventCallback<EventBusEvents[K]>): void;
  off<K extends keyof EventBusEvents>(event: K, callback: EventCallback<EventBusEvents[K]>): void;
  emit<K extends keyof EventBusEvents>(event: K, data: EventBusEvents[K]): void;
}

export interface VariableManager {
  get(name: string): number;
  set(name: string, value: number): void;
  modify(name: string, delta: number): void;
  getAll(): GameStats;
}

export interface ConditionEvaluator {
  evaluate(conditions?: import('./game').Condition[]): boolean;
}

export interface DialogueEngine {
  loadScene(scene: Scene | null): void;
  handleChoice(choice: DialogueChoice): void;
  next(): void;
}
