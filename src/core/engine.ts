/**
 * Core Game Engine - Dialogue playback and event management
 *
 * Provides event bus, variable management, condition evaluation, and dialogue flow control.
 * ASCII only - No fragments
 */

import type {
  Scene,
  Dialogue,
  DialogueChoice,
  GameStats,
  Condition,
  ConditionOperator,
  EventBusEvents,
  EventCallback,
  CreateEngineParams,
  GameEngine
} from '@/types';

// ============================================================================
// EVENT BUS
// ============================================================================

/**
 * Type-safe event bus for game engine communication
 *
 * Provides pub/sub messaging between game components with full type safety.
 * Events are strongly typed through the EventBusEvents interface.
 *
 * @example
 * ```typescript
 * const bus = new EventBus();
 * bus.on('dialogue:show', (data) => {
 *   console.log(data.speaker, data.text); // Fully typed
 * });
 * bus.emit('dialogue:show', {
 *   speaker: 'narrator',
 *   text: 'Hello',
 *   choices: []
 * });
 * ```
 */
export class EventBus {
  private events: Map<keyof EventBusEvents, Set<EventCallback<any>>>;

  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   *
   * @param event - Event name (typed from EventBusEvents)
   * @param callback - Handler function with typed payload
   *
   * @example
   * ```typescript
   * bus.on('variables:updated', (stats) => {
   *   console.log('Physique:', stats.Physique);
   * });
   * ```
   */
  on<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from an event
   *
   * @param event - Event name
   * @param callback - Handler function to remove (must be same reference)
   *
   * @example
   * ```typescript
   * const handler = (data) => console.log(data);
   * bus.on('dialogue:show', handler);
   * bus.off('dialogue:show', handler); // Unsubscribe
   * ```
   */
  off<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event with typed payload
   *
   * @param event - Event name
   * @param data - Event payload (type-checked against EventBusEvents)
   *
   * @example
   * ```typescript
   * bus.emit('scene:complete', { sceneId: 'scene-123' });
   * ```
   */
  emit<K extends keyof EventBusEvents>(event: K, data: EventBusEvents[K]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

// ============================================================================
// VARIABLE MANAGER
// ============================================================================

/**
 * Manages game variables with bounded values
 *
 * Handles player statistics and flags with automatic clamping to valid ranges (0-100).
 * Provides safe defaults for undefined variables.
 *
 * @example
 * ```typescript
 * const vm = new VariableManager({ Physique: 50, Mentale: 50 });
 * vm.modify('Physique', 10); // Clamped to 0-100
 * console.log(vm.get('Physique')); // 60
 * ```
 */
export class VariableManager {
  private variables: GameStats;

  /**
   * Initialize variable manager
   *
   * @param initial - Initial variable values (default: { Physique: 100, Mentale: 100 })
   *
   * @example
   * ```typescript
   * const vm = new VariableManager({ Physique: 75, Mentale: 50 });
   * ```
   */
  constructor(initial?: GameStats) {
    this.variables = {
      Physique: 100,
      Mentale: 100,
      ...(initial || {})
    };
  }

  /**
   * Get variable value
   *
   * @param name - Variable name
   * @returns Variable value (0 if undefined)
   *
   * @example
   * ```typescript
   * const physique = vm.get('Physique'); // 100
   * const unknown = vm.get('Unknown'); // 0 (safe default)
   * ```
   */
  get(name: string): number {
    return this.variables[name] !== undefined ? this.variables[name] : 0;
  }

  /**
   * Set variable value
   *
   * @param name - Variable name
   * @param value - New value (no clamping applied)
   *
   * @example
   * ```typescript
   * vm.set('Physique', 75);
   * ```
   */
  set(name: string, value: number): void {
    this.variables[name] = value;
  }

  /**
   * Modify variable with delta, clamped to 0-100 range
   *
   * @param name - Variable name
   * @param delta - Change amount (positive or negative)
   *
   * @example
   * ```typescript
   * vm.modify('Physique', -10); // Decrease by 10, clamped to 0
   * vm.modify('Mentale', 200); // Increase, clamped to 100
   * ```
   */
  modify(name: string, delta: number): void {
    const current = this.get(name);
    const next = Math.max(0, Math.min(100, current + delta));
    this.set(name, next);
  }

  /**
   * Get all variables as immutable copy
   *
   * @returns Shallow copy of all variables
   *
   * @example
   * ```typescript
   * const stats = vm.getAll(); // { Physique: 100, Mentale: 100 }
   * ```
   */
  getAll(): GameStats {
    return { ...this.variables };
  }
}

// ============================================================================
// CONDITION EVALUATOR
// ============================================================================

/**
 * Evaluates conditions for dialogue branching
 *
 * Checks game variable conditions to determine if dialogue should be shown.
 * Supports all comparison operators (>=, <=, >, <, ==, !=).
 * Empty conditions array always evaluates to true (unconditional).
 *
 * @example
 * ```typescript
 * const evaluator = new ConditionEvaluator(variableManager);
 * const canShow = evaluator.evaluate([
 *   { variable: 'Physique', operator: '>=', value: 50 }
 * ]);
 * ```
 */
export class ConditionEvaluator {
  private vm: VariableManager;

  /**
   * Initialize condition evaluator
   *
   * @param variableManager - Variable manager instance
   */
  constructor(variableManager: VariableManager) {
    this.vm = variableManager;
  }

  /**
   * Evaluate all conditions (AND logic)
   *
   * @param conditions - Array of conditions to check (empty = always true)
   * @returns True if all conditions pass
   *
   * @example
   * ```typescript
   * // Multiple conditions (AND logic)
   * evaluator.evaluate([
   *   { variable: 'Physique', operator: '>=', value: 50 },
   *   { variable: 'Mentale', operator: '>', value: 30 }
   * ]);
   *
   * // Empty conditions (always true)
   * evaluator.evaluate([]); // true
   * evaluator.evaluate(undefined); // true
   * ```
   */
  evaluate(conditions?: Condition[]): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    return conditions.every(cond => {
      const value = this.vm.get(cond.variable);

      switch (cond.operator) {
        case '>=':
          return value >= cond.value;
        case '<=':
          return value <= cond.value;
        case '>':
          return value > cond.value;
        case '<':
          return value < cond.value;
        case '==':
          return value === cond.value; // Strict equality for type safety
        case '!=':
          return value !== cond.value; // Strict equality for type safety
        default: {
          // Type guard: exhaustive check for ConditionOperator
          const _exhaustive: never = cond.operator;
          return false;
        }
      }
    });
  }
}

// ============================================================================
// DIALOGUE ENGINE
// ============================================================================

/**
 * Main dialogue engine for scene playback
 *
 * Manages dialogue progression, condition evaluation, and event emission.
 * Automatically skips dialogues that fail condition checks.
 * Emits events for UI updates (dialogue:show, scene:complete, variables:updated).
 *
 * @example
 * ```typescript
 * const engine = new DialogueEngine(eventBus, variableManager);
 * engine.loadScene(scene);
 * // Listen to events...
 * engine.handleChoice(choice);
 * engine.next();
 * ```
 */
export class DialogueEngine {
  private eventBus: EventBus;
  private vm: VariableManager;
  private cond: ConditionEvaluator;
  private currentScene: Scene | null;
  private idx: number;
  private isSceneEnded: boolean;

  /**
   * Initialize dialogue engine
   *
   * @param eventBus - Event bus instance for emitting gameplay events
   * @param variableManager - Variable manager instance for state tracking
   */
  constructor(eventBus: EventBus, variableManager: VariableManager) {
    this.eventBus = eventBus;
    this.vm = variableManager;
    this.cond = new ConditionEvaluator(variableManager);
    this.currentScene = null;
    this.idx = 0;
    this.isSceneEnded = false;
  }

  /**
   * Load and start a scene
   *
   * @param scene - Scene to load (null to clear current scene)
   *
   * @example
   * ```typescript
   * engine.loadScene(scene);
   * // First dialogue automatically shown via 'dialogue:show' event
   * ```
   */
  loadScene(scene: Scene | null): void {
    this.currentScene = scene || null;
    this.idx = 0;
    this.isSceneEnded = false;
    this.showCurrentDialogue();
  }

  /**
   * Show current dialogue or emit scene complete
   *
   * Automatically skips dialogues that fail condition checks.
   * Emits 'dialogue:show' for valid dialogues or 'scene:complete' when done.
   *
   * @private
   */
  private showCurrentDialogue(): void {
    if (!this.currentScene) return;

    const dialogues = Array.isArray(this.currentScene.dialogues)
      ? this.currentScene.dialogues
      : [];

    // Find next visible dialogue (passes conditions)
    while (this.idx < dialogues.length) {
      const dialogue = dialogues[this.idx];

      // TODO: Add 'conditions?: Condition[]' to Dialogue interface in Phase G
      // Currently casting to access optional conditions field
      const conditions = (dialogue as any).conditions as Condition[] | undefined;

      if (this.cond.evaluate(conditions)) {
        this.eventBus.emit('dialogue:show', {
          speaker: dialogue.speaker,
          text: dialogue.text,
          choices: dialogue.choices || []
        });
        return;
      }

      this.idx++;
    }

    // No more dialogues
    this.isSceneEnded = true;
    this.eventBus.emit('scene:complete', { sceneId: this.currentScene.id });
  }

  /**
   * Handle player choice and apply effects
   *
   * Processes choice effects (add/set operations), updates variables,
   * emits delta events for UI feedback, then advances to next dialogue.
   *
   * @param choice - Selected dialogue choice
   *
   * @example
   * ```typescript
   * engine.handleChoice({
   *   id: 'choice-1',
   *   text: 'Train harder',
   *   effects: [
   *     { variable: 'Physique', operation: 'add', value: 10 }
   *   ]
   * });
   * // Emits 'variables:delta' and 'variables:updated' events
   * ```
   */
  handleChoice(choice: DialogueChoice): void {
    if (!choice || !Array.isArray(choice.effects)) {
      this.next();
      return;
    }

    const deltas: Array<{ variable: string; delta: number }> = [];

    choice.effects.forEach(effect => {
      const before = this.vm.get(effect.variable);

      if (effect.operation === 'set') {
        this.vm.set(effect.variable, effect.value);
        deltas.push({
          variable: effect.variable,
          delta: effect.value - before
        });
      } else if (effect.operation === 'add') {
        this.vm.modify(effect.variable, effect.value);
        deltas.push({
          variable: effect.variable,
          delta: effect.value
        });
      }
    });

    this.eventBus.emit('variables:delta', deltas);
    this.eventBus.emit('variables:updated', this.vm.getAll());

    this.next();
  }

  /**
   * Advance to next dialogue
   *
   * Increments dialogue index and shows next dialogue (or completes scene).
   *
   * @example
   * ```typescript
   * engine.next(); // Show next dialogue
   * ```
   */
  next(): void {
    this.idx++;
    this.showCurrentDialogue();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a complete game engine instance
 *
 * Factory function that initializes all engine components (event bus,
 * variable manager, dialogue engine) with shared state.
 *
 * @param params - Engine configuration (optional)
 * @returns Complete engine instance
 *
 * @example
 * ```typescript
 * // Default initialization
 * const engine = createEngine();
 *
 * // Custom initial variables
 * const engine = createEngine({
 *   initialVars: { Physique: 50, Mentale: 75 }
 * });
 *
 * // Subscribe to events
 * engine.eventBus.on('dialogue:show', handleDialogue);
 *
 * // Load scene
 * engine.dialogueEngine.loadScene(scene);
 * ```
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
