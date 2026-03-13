/**
 * Tests unitaires — core/
 *
 * Classes couvertes :
 *   - VariableManager    (gestion variables RPG avec bornes 0-100)
 *   - ConditionEvaluator (évaluation conditions de branchement)
 *   - EventBus           (pub/sub typé pour le moteur)
 *   - DialogueEngine     (moteur principal de lecture de scène)
 *   - createEngine()     (factory du moteur complet)
 *
 * Ces classes sont du TypeScript pur — aucune dépendance React/Zustand.
 * Pas de renderHook, pas d'act() nécessaire.
 */

// IMPORTANT : @/i18n/index.ts importe useSettingsStore (@/stores),
// qui importe settingsStore utilisant GAME_STATS encore non-initialisé → circulaire.
// Le mock casse cette chaîne sans impacter les modules testés.
vi.mock('@/i18n', () => ({
  GAME_STATS: { PHYSIQUE: 'physique', MENTALE: 'mentale' },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VariableManager } from '@/core/VariableManager';
import { ConditionEvaluator } from '@/core/ConditionEvaluator';
import { EventBus } from '@/core/EventBus';
import { DialogueEngine } from '@/core/DialogueEngine';
import { createEngine } from '@/core/engine';
import type { Scene, Dialogue, DialogueChoice, Condition } from '@/types';
import { STAT_BOUNDS } from '@/config/gameConstants';

// Littéraux pour éviter l'import @/i18n dans les assertions
const PHYSIQUE = 'physique';
const MENTALE = 'mentale';

// ---------------------------------------------------------------------------
// Factories — objets minimaux valides pour le moteur (pas besoin de Zod ici)
// ---------------------------------------------------------------------------

function makeDialogue(overrides: Partial<Dialogue> = {}): Dialogue {
  return {
    id: `d-${Math.random().toString(36).slice(2)}`,
    speaker: 'Alice',
    text: 'Texte de test',
    choices: [],
    isResponse: false,
    ...overrides,
  } as Dialogue;
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene1',
    title: 'Scène de test',
    description: '',
    backgroundUrl: '',
    dialogues: [],
    characters: [],
    ...overrides,
  } as Scene;
}

// ---------------------------------------------------------------------------
// VariableManager
// ---------------------------------------------------------------------------

describe('VariableManager', () => {
  it('initialise physique et mentale à MAX=100 par défaut', () => {
    const vm = new VariableManager();
    expect(vm.get(PHYSIQUE)).toBe(STAT_BOUNDS.MAX);
    expect(vm.get(MENTALE)).toBe(STAT_BOUNDS.MAX);
  });

  it('accepte des valeurs initiales qui écrasent les défauts', () => {
    const vm = new VariableManager({ physique: 30, mentale: 70 });
    expect(vm.get('physique')).toBe(30);
    expect(vm.get('mentale')).toBe(70);
  });

  it('get() retourne 0 pour une variable inconnue', () => {
    const vm = new VariableManager();
    expect(vm.get('variable_inconnue')).toBe(0);
  });

  it('set() stocke la valeur sans clampement (peut dépasser 0-100)', () => {
    // Comportement documenté : set() bypasse les bornes — seul modify() clampé.
    const vm = new VariableManager({ physique: 50 });
    vm.set('physique', 150);
    expect(vm.get('physique')).toBe(150);
    vm.set('physique', -10);
    expect(vm.get('physique')).toBe(-10);
  });

  it('modify() plafonne à MAX=100', () => {
    const vm = new VariableManager({ physique: 95 });
    vm.modify('physique', 10); // 95 + 10 = 105 → clampé à 100
    expect(vm.get('physique')).toBe(STAT_BOUNDS.MAX);
  });

  it('modify() plancher à MIN=0', () => {
    const vm = new VariableManager({ physique: 5 });
    vm.modify('physique', -20); // 5 - 20 = -15 → clampé à 0
    expect(vm.get('physique')).toBe(STAT_BOUNDS.MIN);
  });

  it('modify() accepte les valeurs dans la plage sans les modifier', () => {
    const vm = new VariableManager({ physique: 50 });
    vm.modify('physique', 10);
    expect(vm.get('physique')).toBe(60);
    vm.modify('physique', -20);
    expect(vm.get('physique')).toBe(40);
  });

  it('getAll() retourne une copie (la mutation du résultat ne change pas l\'état interne)', () => {
    const vm = new VariableManager({ physique: 50 });
    const all = vm.getAll();
    all['physique'] = 999; // muter la copie
    expect(vm.get('physique')).toBe(50); // l'original est inchangé
  });

  it('getAll() contient toutes les variables définies', () => {
    const vm = new VariableManager({ physique: 40 });
    vm.set('custom', 77);
    const all = vm.getAll();
    expect(all).toMatchObject({ physique: 40, custom: 77 });
  });
});

// ---------------------------------------------------------------------------
// ConditionEvaluator
// ---------------------------------------------------------------------------

describe('ConditionEvaluator', () => {
  let vm: VariableManager;
  let ce: ConditionEvaluator;

  beforeEach(() => {
    vm = new VariableManager({ physique: 50 });
    ce = new ConditionEvaluator(vm);
  });

  it('retourne true quand conditions est undefined', () => {
    expect(ce.evaluate(undefined)).toBe(true);
  });

  it('retourne true quand conditions est un tableau vide', () => {
    expect(ce.evaluate([])).toBe(true);
  });

  it.each([
    ['>=', 50, 50, true],
    ['>=', 49, 50, false],
    ['<=', 50, 50, true],
    ['<=', 51, 50, false],
    ['>', 51, 50, true],
    ['>', 50, 50, false],
    ['<', 49, 50, true],
    ['<', 50, 50, false],
    ['==', 50, 50, true],
    ['==', 49, 50, false],
    ['!=', 49, 50, true],
    ['!=', 50, 50, false],
  ] as const)(
    'opérateur %s : physique=%i vs seuil=%i → %s',
    (operator, stat, threshold, expected) => {
      vm.set('physique', stat);
      const cond: Condition = { variable: 'physique', operator, value: threshold };
      expect(ce.evaluate([cond])).toBe(expected);
    }
  );

  it('évalue plusieurs conditions en AND — une seule qui échoue suffit', () => {
    vm.set('physique', 50);
    vm.set('mentale', 30);
    const conditions: Condition[] = [
      { variable: 'physique', operator: '>=', value: 40 }, // passe (50 >= 40)
      { variable: 'mentale', operator: '>=', value: 40 },  // échoue (30 < 40)
    ];
    expect(ce.evaluate(conditions)).toBe(false);
  });

  it('évalue plusieurs conditions en AND — toutes passent → true', () => {
    vm.set('physique', 60);
    vm.set('mentale', 80);
    const conditions: Condition[] = [
      { variable: 'physique', operator: '>=', value: 50 },
      { variable: 'mentale', operator: '>=', value: 50 },
    ];
    expect(ce.evaluate(conditions)).toBe(true);
  });

  it('lève une erreur pour un opérateur inconnu', () => {
    const cond = { variable: 'physique', operator: 'INCONNU' as never, value: 50 };
    expect(() => ce.evaluate([cond])).toThrow('Unexpected operator');
  });
});

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('appelle le listener avec les données exactes émises', () => {
    const fn = vi.fn();
    bus.on('scene:complete', fn);
    bus.emit('scene:complete', { sceneId: 'scene-abc' });
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith({ sceneId: 'scene-abc' });
  });

  it('appelle tous les listeners enregistrés pour le même événement', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('scene:complete', fn1);
    bus.on('scene:complete', fn2);
    bus.emit('scene:complete', { sceneId: 's' });
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it('off() retire uniquement le listener ciblé, les autres restent actifs', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('scene:complete', fn1);
    bus.on('scene:complete', fn2);
    bus.off('scene:complete', fn1);
    bus.emit('scene:complete', { sceneId: 's' });
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it('emit() sans listener enregistré ne plante pas', () => {
    expect(() => bus.emit('scene:complete', { sceneId: 's' })).not.toThrow();
  });

  it('les listeners d\'un événement ne sont pas déclenchés par un autre', () => {
    const completeFn = vi.fn();
    bus.on('scene:complete', completeFn);
    // Émet un événement différent
    bus.emit('dialogue:show', { speaker: 'Alice', text: 'Bonjour', choices: [] });
    expect(completeFn).not.toHaveBeenCalled();
  });

  it('on() peut enregistrer plusieurs fois la même fonction (idempotence Set)', () => {
    const fn = vi.fn();
    bus.on('scene:complete', fn);
    bus.on('scene:complete', fn); // doublé — Set doit dédupliquer
    bus.emit('scene:complete', { sceneId: 's' });
    // Set déduplique → appelé 1 seule fois
    expect(fn).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// DialogueEngine
// ---------------------------------------------------------------------------

describe('DialogueEngine', () => {
  let vm: VariableManager;
  let bus: EventBus;
  let engine: DialogueEngine;
  let showFn: ReturnType<typeof vi.fn>;
  let completeFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vm = new VariableManager({ physique: 50 });
    bus = new EventBus();
    engine = new DialogueEngine(bus, vm);
    showFn = vi.fn();
    completeFn = vi.fn();
    bus.on('dialogue:show', showFn);
    bus.on('scene:complete', completeFn);
  });

  // — loadScene() —

  it('loadScene() émet dialogue:show pour le premier dialogue valide', () => {
    const d = makeDialogue({ speaker: 'Alice', text: 'Bonjour' });
    engine.loadScene(makeScene({ dialogues: [d] }));
    expect(showFn).toHaveBeenCalledOnce();
    expect(showFn).toHaveBeenCalledWith(
      expect.objectContaining({ speaker: 'Alice', text: 'Bonjour' })
    );
  });

  it('loadScene(null) ne plante pas et n\'émet rien', () => {
    expect(() => engine.loadScene(null)).not.toThrow();
    expect(showFn).not.toHaveBeenCalled();
    expect(completeFn).not.toHaveBeenCalled();
  });

  it('loadScene() remet l\'index à 0 (rechargement de scène)', () => {
    const d1 = makeDialogue({ speaker: 'Alice' });
    const d2 = makeDialogue({ speaker: 'Bob' });
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));
    engine.next(); // avance vers Bob
    showFn.mockClear();

    // Recharger la même scène doit reprendre à Alice
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));
    expect(showFn).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Alice' }));
  });

  it('loadScene() saute les dialogues dont la condition échoue', () => {
    // d1 requiert physique >= 80, vm.physique = 50 → échoue
    const d1 = makeDialogue({
      speaker: 'Skip',
      conditions: [{ variable: 'physique', operator: '>=', value: 80 }],
    });
    const d2 = makeDialogue({ speaker: 'Bob', text: 'Je passe' });
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));
    expect(showFn).toHaveBeenCalledOnce();
    expect(showFn).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Bob' }));
  });

  it('loadScene() émet scene:complete quand tous les dialogues ont une condition qui échoue', () => {
    const d1 = makeDialogue({
      conditions: [{ variable: 'physique', operator: '>=', value: 100 }], // 50 < 100
    });
    engine.loadScene(makeScene({ id: 'scene-xyz', dialogues: [d1] }));
    expect(showFn).not.toHaveBeenCalled();
    expect(completeFn).toHaveBeenCalledWith({ sceneId: 'scene-xyz' });
  });

  it('loadScene() passe les choices au payload de dialogue:show', () => {
    const choice = { id: 'c1', text: 'Option A', effects: [] } as unknown as DialogueChoice;
    const d = makeDialogue({ choices: [choice] });
    engine.loadScene(makeScene({ dialogues: [d] }));
    expect(showFn).toHaveBeenCalledWith(
      expect.objectContaining({ choices: [choice] })
    );
  });

  // — next() —

  it('next() avance au dialogue suivant valide', () => {
    const d1 = makeDialogue({ speaker: 'Alice' });
    const d2 = makeDialogue({ speaker: 'Bob' });
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));
    showFn.mockClear();

    engine.next();
    expect(showFn).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Bob' }));
  });

  it('next() saute les dialogues dont la condition échoue', () => {
    const d1 = makeDialogue({ speaker: 'Alice' });
    // d2 requiert physique >= 80 → échoue
    const d2 = makeDialogue({
      speaker: 'Skip',
      conditions: [{ variable: 'physique', operator: '>=', value: 80 }],
    });
    const d3 = makeDialogue({ speaker: 'Charlie' });
    engine.loadScene(makeScene({ dialogues: [d1, d2, d3] }));
    showFn.mockClear();

    engine.next(); // devrait sauter d2 et atterrir sur d3
    expect(showFn).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Charlie' }));
  });

  it('next() émet scene:complete après le dernier dialogue', () => {
    const d1 = makeDialogue();
    engine.loadScene(makeScene({ id: 'scene-fin', dialogues: [d1] }));
    engine.next(); // dépasse d1
    expect(completeFn).toHaveBeenCalledWith({ sceneId: 'scene-fin' });
  });

  // — handleChoice() —

  it('handleChoice() avec effects:[] émet variables:delta (vide) et avance', () => {
    const deltaFn = vi.fn();
    bus.on('variables:delta', deltaFn);

    const d1 = makeDialogue({ speaker: 'Alice' });
    const d2 = makeDialogue({ speaker: 'Bob' });
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));
    showFn.mockClear();

    const choice = { id: 'c1', text: 'ok', effects: [] } as unknown as DialogueChoice;
    engine.handleChoice(choice);

    expect(deltaFn).toHaveBeenCalledWith([]); // delta vide mais toujours émis
    expect(showFn).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Bob' }));
  });

  it('handleChoice() sans tableau effects appelle juste next() (pas d\'émission variables)', () => {
    const deltaFn = vi.fn();
    bus.on('variables:delta', deltaFn);

    const d1 = makeDialogue({ speaker: 'Alice' });
    const d2 = makeDialogue({ speaker: 'Bob' });
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));
    showFn.mockClear();

    // choice sans propriété effects → early return vers next()
    engine.handleChoice({ id: 'c1', text: 'ok' } as unknown as DialogueChoice);

    expect(deltaFn).not.toHaveBeenCalled(); // pas d'émission
    expect(showFn).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Bob' }));
  });

  it('handleChoice() effect "add" applique le delta, émet variables:delta et variables:updated', () => {
    const deltaFn = vi.fn();
    const updatedFn = vi.fn();
    bus.on('variables:delta', deltaFn);
    bus.on('variables:updated', updatedFn);

    const d1 = makeDialogue({ speaker: 'Alice' });
    const d2 = makeDialogue({ speaker: 'Bob' });
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));
    showFn.mockClear();

    const choice = {
      id: 'c1',
      text: 'boost physique',
      effects: [{ variable: 'physique', operation: 'add', value: 10 }],
    } as unknown as DialogueChoice;
    engine.handleChoice(choice);

    expect(vm.get('physique')).toBe(60); // 50 + 10
    expect(deltaFn).toHaveBeenCalledWith([{ variable: 'physique', delta: 10 }]);
    expect(updatedFn).toHaveBeenCalledWith(expect.objectContaining({ physique: 60 }));
    expect(showFn).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Bob' }));
  });

  it('handleChoice() effect "add" clampé à MIN=0 par modify()', () => {
    const d1 = makeDialogue();
    const d2 = makeDialogue();
    engine.loadScene(makeScene({ dialogues: [d1, d2] }));

    const choice = {
      id: 'c1',
      text: 'perte massive',
      effects: [{ variable: 'physique', operation: 'add', value: -100 }], // 50 - 100 → 0
    } as unknown as DialogueChoice;
    engine.handleChoice(choice);

    expect(vm.get('physique')).toBe(STAT_BOUNDS.MIN); // clampé à 0
  });

  it('handleChoice() effect "set" fixe la valeur et rapporte le bon delta', () => {
    const deltaFn = vi.fn();
    bus.on('variables:delta', deltaFn);

    engine.loadScene(makeScene({ dialogues: [makeDialogue(), makeDialogue()] }));

    const choice = {
      id: 'c1',
      text: 'set physique à 80',
      effects: [{ variable: 'physique', operation: 'set', value: 80 }],
    } as unknown as DialogueChoice;
    engine.handleChoice(choice);

    expect(vm.get('physique')).toBe(80);
    // delta = valeur finale - valeur avant = 80 - 50 = 30
    expect(deltaFn).toHaveBeenCalledWith([{ variable: 'physique', delta: 30 }]);
  });

  it('handleChoice() effect "multiply" multiplie et rapporte le bon delta', () => {
    const deltaFn = vi.fn();
    bus.on('variables:delta', deltaFn);

    engine.loadScene(makeScene({ dialogues: [makeDialogue(), makeDialogue()] }));

    const choice = {
      id: 'c1',
      text: 'x2 physique',
      effects: [{ variable: 'physique', operation: 'multiply', value: 2 }],
    } as unknown as DialogueChoice;
    engine.handleChoice(choice);

    expect(vm.get('physique')).toBe(100); // 50 * 2 = 100
    // delta = 100 - 50 = 50
    expect(deltaFn).toHaveBeenCalledWith([{ variable: 'physique', delta: 50 }]);
  });

  it('handleChoice() avec plusieurs effets les applique tous', () => {
    vm.set('mentale', 60);
    engine.loadScene(makeScene({ dialogues: [makeDialogue(), makeDialogue()] }));

    const choice = {
      id: 'c1',
      text: 'double effet',
      effects: [
        { variable: 'physique', operation: 'add', value: 10 },
        { variable: 'mentale', operation: 'add', value: -20 },
      ],
    } as unknown as DialogueChoice;
    engine.handleChoice(choice);

    expect(vm.get('physique')).toBe(60); // 50 + 10
    expect(vm.get('mentale')).toBe(40);  // 60 - 20
  });
});

// ---------------------------------------------------------------------------
// createEngine — factory
// ---------------------------------------------------------------------------

describe('createEngine()', () => {
  it('retourne { eventBus, variableManager, dialogueEngine }', () => {
    const game = createEngine();
    expect(game.eventBus).toBeDefined();
    expect(game.variableManager).toBeDefined();
    expect(game.dialogueEngine).toBeDefined();
  });

  it('initialise physique et mentale à MAX=100 par défaut', () => {
    const game = createEngine();
    expect(game.variableManager.get(PHYSIQUE)).toBe(STAT_BOUNDS.MAX);
    expect(game.variableManager.get(MENTALE)).toBe(STAT_BOUNDS.MAX);
  });

  it('initialVars écrase les valeurs par défaut', () => {
    const game = createEngine({ initialVars: { physique: 42, mentale: 13 } });
    expect(game.variableManager.get('physique')).toBe(42);
    expect(game.variableManager.get('mentale')).toBe(13);
  });

  it('le moteur créé est fonctionnel (loadScene + event)', () => {
    const game = createEngine();
    const showFn = vi.fn();
    game.eventBus.on('dialogue:show', showFn);

    const d = makeDialogue({ speaker: 'Test', text: 'Intégration' });
    game.dialogueEngine.loadScene(makeScene({ dialogues: [d] }));

    expect(showFn).toHaveBeenCalledWith(
      expect.objectContaining({ speaker: 'Test', text: 'Intégration' })
    );
  });
});
