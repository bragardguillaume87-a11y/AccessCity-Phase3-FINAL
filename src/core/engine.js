// src/core/engine.js
// ASCII only
export class EventBus {
  constructor() { this.events = {}; }
  on(event, cb) { if (!this.events[event]) this.events[event] = []; this.events[event].push(cb); }
  off(event, cb) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(x => x !== cb);
  }
  emit(event, data) { if (this.events[event]) this.events[event].forEach(cb => cb(data)); }
}

export class VariableManager {
  constructor(initial) {
    this.variables = { Physique: 100, Mentale: 100, ...(initial || {}) };
  }
  get(name) { return this.variables[name] !== undefined ? this.variables[name] : 0; }
  set(name, value) { this.variables[name] = value; }
  modify(name, delta) {
    const cur = this.get(name);
    const next = Math.max(0, Math.min(100, cur + delta));
    this.set(name, next);
  }
  getAll() { return { ...this.variables }; }
}

export class ConditionEvaluator {
  constructor(variableManager) { this.vm = variableManager; }
  evaluate(conditions) {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(cond => {
      const v = this.vm.get(cond.variable);
      switch (cond.operator) {
        case ">=": return v >= cond.value;
        case "<=": return v <= cond.value;
        case ">": return v > cond.value;
        case "<": return v < cond.value;
        case "==": return v == cond.value;
        case "!=": return v != cond.value;
        default: return false;
      }
    });
  }
}

export class DialogueEngine {
  constructor(eventBus, variableManager) {
    this.eventBus = eventBus;
    this.vm = variableManager;
    this.cond = new ConditionEvaluator(variableManager);
    this.currentScene = null;
    this.idx = 0;
    this.isSceneEnded = false;
  }

  loadScene(scene) {
    this.currentScene = scene || null;
    this.idx = 0;
    this.isSceneEnded = false;
    this.showCurrentDialogue();
  }

  showCurrentDialogue() {
    if (!this.currentScene) return;
    const list = Array.isArray(this.currentScene.dialogues) ? this.currentScene.dialogues : [];
    while (this.idx < list.length) {
      const d = list[this.idx];
      if (this.cond.evaluate(d.conditions)) {
        this.eventBus.emit("dialogue:show", {
          speaker: d.speaker,
          text: d.text,
          choices: d.choices || []
        });
        return;
      }
      this.idx++;
    }
    this.isSceneEnded = true;
    this.eventBus.emit("scene:complete", { sceneId: this.currentScene.id });
  }

  handleChoice(choice) {
    if (choice && Array.isArray(choice.effects)) {
      const deltas = [];
      choice.effects.forEach(effect => {
        const before = this.vm.get(effect.variable);
        if (effect.operation === "set") {
          this.vm.set(effect.variable, effect.value);
          deltas.push({ variable: effect.variable, delta: effect.value - before });
        } else if (effect.operation === "add") {
          this.vm.modify(effect.variable, effect.value);
          deltas.push({ variable: effect.variable, delta: effect.value });
        }
      });
      this.eventBus.emit("variables:delta", deltas);
      this.eventBus.emit("variables:updated", this.vm.getAll());
    }
    this.next();
  }

  next() {
    this.idx++;
    this.showCurrentDialogue();
  }
}

export function createEngine(initialVars) {
  const bus = new EventBus();
  const vm = new VariableManager(initialVars);
  const engine = new DialogueEngine(bus, vm);
  return { eventBus: bus, variableManager: vm, dialogueEngine: engine };
}
