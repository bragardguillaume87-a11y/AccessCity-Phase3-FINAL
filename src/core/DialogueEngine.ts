/**
 * Main dialogue engine for scene playback
 *
 * Manages dialogue progression, condition evaluation, and event emission.
 * Automatically skips dialogues that fail condition checks.
 */

import type { Scene, DialogueChoice } from '@/types';
import { EventBus } from './EventBus';
import { VariableManager } from './VariableManager';
import { ConditionEvaluator } from './ConditionEvaluator';

export class DialogueEngine {
  private eventBus: EventBus;
  private vm: VariableManager;
  private cond: ConditionEvaluator;
  private currentScene: Scene | null;
  private idx: number;

  constructor(eventBus: EventBus, variableManager: VariableManager) {
    this.eventBus = eventBus;
    this.vm = variableManager;
    this.cond = new ConditionEvaluator(variableManager);
    this.currentScene = null;
    this.idx = 0;
  }

  loadScene(scene: Scene | null): void {
    this.currentScene = scene || null;
    this.idx = 0;
    this.showCurrentDialogue();
  }

  private showCurrentDialogue(): void {
    if (!this.currentScene) return;

    const dialogues = Array.isArray(this.currentScene.dialogues)
      ? this.currentScene.dialogues
      : [];

    while (this.idx < dialogues.length) {
      const dialogue = dialogues[this.idx];
      const conditions = dialogue.conditions;

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

    this.eventBus.emit('scene:complete', { sceneId: this.currentScene.id });
  }

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
      } else if (effect.operation === 'multiply') {
        const newValue = Math.round(before * effect.value);
        this.vm.set(effect.variable, newValue);
        deltas.push({
          variable: effect.variable,
          delta: newValue - before
        });
      } else {
        // Default: 'add'
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

  next(): void {
    this.idx++;
    this.showCurrentDialogue();
  }
}
