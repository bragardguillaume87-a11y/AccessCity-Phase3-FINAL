/**
 * VariableManager Tests
 *
 * Couvre :
 *   - Initialisation (valeurs par défaut, valeurs personnalisées)
 *   - get() — variable connue, inconnue
 *   - set() — valeur libre (sans clamping)
 *   - modify() — delta positif, négatif, clamping MIN/MAX
 *   - getAll() — snapshot immutable
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VariableManager } from '../VariableManager';
import { GAME_STATS } from '@/i18n';
import { STAT_BOUNDS } from '@/config/gameConstants';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeVM(initial?: Record<string, number>) {
  return new VariableManager(initial);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VariableManager', () => {
  // ── Initialisation ────────────────────────────────────────────────────────

  describe('constructor()', () => {
    it('initialise physique et mentale à MAX par défaut', () => {
      const vm = makeVM();
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(STAT_BOUNDS.MAX);
      expect(vm.get(GAME_STATS.MENTALE)).toBe(STAT_BOUNDS.MAX);
    });

    it('écrase les valeurs par défaut avec les valeurs initiales fournies', () => {
      const vm = makeVM({ [GAME_STATS.PHYSIQUE]: 42, [GAME_STATS.MENTALE]: 10 });
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(42);
      expect(vm.get(GAME_STATS.MENTALE)).toBe(10);
    });

    it('accepte des variables personnalisées en plus des stats de base', () => {
      const vm = makeVM({ courage: 50 });
      expect(vm.get('courage')).toBe(50);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(STAT_BOUNDS.MAX);
    });

    it('accepte undefined (aucune valeur initiale)', () => {
      expect(() => new VariableManager(undefined)).not.toThrow();
    });
  });

  // ── get() ─────────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('retourne la valeur de la variable connue', () => {
      const vm = makeVM({ score: 75 });
      expect(vm.get('score')).toBe(75);
    });

    it('retourne 0 pour une variable inconnue', () => {
      const vm = makeVM();
      expect(vm.get('inexistante')).toBe(0);
    });

    it('retourne 0 pour une chaîne vide', () => {
      const vm = makeVM();
      expect(vm.get('')).toBe(0);
    });
  });

  // ── set() ─────────────────────────────────────────────────────────────────

  describe('set()', () => {
    it('définit une nouvelle variable', () => {
      const vm = makeVM();
      vm.set('karma', 30);
      expect(vm.get('karma')).toBe(30);
    });

    it('écrase une variable existante', () => {
      const vm = makeVM({ [GAME_STATS.PHYSIQUE]: 80 });
      vm.set(GAME_STATS.PHYSIQUE, 55);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(55);
    });

    it('accepte 0 comme valeur valide', () => {
      const vm = makeVM();
      vm.set(GAME_STATS.MENTALE, 0);
      expect(vm.get(GAME_STATS.MENTALE)).toBe(0);
    });
  });

  // ── modify() ──────────────────────────────────────────────────────────────

  describe('modify()', () => {
    let vm: VariableManager;
    beforeEach(() => {
      vm = makeVM({ [GAME_STATS.PHYSIQUE]: 50 });
    });

    it('ajoute un delta positif', () => {
      vm.modify(GAME_STATS.PHYSIQUE, 10);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(60);
    });

    it('ajoute un delta négatif', () => {
      vm.modify(GAME_STATS.PHYSIQUE, -20);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(30);
    });

    it('clamp à MAX si dépassement par le haut', () => {
      vm.modify(GAME_STATS.PHYSIQUE, 9999);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(STAT_BOUNDS.MAX);
    });

    it('clamp à MIN si dépassement par le bas', () => {
      vm.modify(GAME_STATS.PHYSIQUE, -9999);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(STAT_BOUNDS.MIN);
    });

    it('ne dépasse pas exactement MAX (100 + 0 = 100)', () => {
      vm.set(GAME_STATS.PHYSIQUE, STAT_BOUNDS.MAX);
      vm.modify(GAME_STATS.PHYSIQUE, 0);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(STAT_BOUNDS.MAX);
    });

    it('ne descend pas en dessous de MIN (0 - 1 = 0)', () => {
      vm.set(GAME_STATS.PHYSIQUE, STAT_BOUNDS.MIN);
      vm.modify(GAME_STATS.PHYSIQUE, -1);
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(STAT_BOUNDS.MIN);
    });

    it('crée la variable si inconnue et applique le delta depuis 0', () => {
      vm.modify('nouvelle', 25);
      expect(vm.get('nouvelle')).toBe(25);
    });
  });

  // ── getAll() ──────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('retourne un objet avec toutes les variables', () => {
      const vm = makeVM({ [GAME_STATS.PHYSIQUE]: 70, [GAME_STATS.MENTALE]: 40 });
      const all = vm.getAll();
      expect(all[GAME_STATS.PHYSIQUE]).toBe(70);
      expect(all[GAME_STATS.MENTALE]).toBe(40);
    });

    it('retourne un snapshot — muter le résultat ne modifie pas le store', () => {
      const vm = makeVM({ [GAME_STATS.PHYSIQUE]: 50 });
      const snapshot = vm.getAll();
      snapshot[GAME_STATS.PHYSIQUE] = 999;
      expect(vm.get(GAME_STATS.PHYSIQUE)).toBe(50);
    });
  });
});
