/**
 * ConditionEvaluator Tests
 *
 * Couvre :
 *   - Conditions vides / undefined → true
 *   - Tous les opérateurs : >=, <=, >, <, ==, !=
 *   - ALL conditions (logique AND implicite)
 *   - Variable inconnue (vaut 0 par convention)
 *   - Opérateur invalide → throw
 */

import { describe, it, expect } from 'vitest';
import { ConditionEvaluator } from '../ConditionEvaluator';
import { VariableManager } from '../VariableManager';
import { GAME_STATS } from '@/i18n';
import type { Condition } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEval(vars: Record<string, number> = {}) {
  const vm = new VariableManager(vars);
  return new ConditionEvaluator(vm);
}

function cond(variable: string, operator: Condition['operator'], value: number): Condition {
  return { variable, operator, value };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ConditionEvaluator', () => {
  // ── Conditions vides ──────────────────────────────────────────────────────

  describe('evaluate() — conditions absentes', () => {
    it('retourne true si conditions est undefined', () => {
      expect(makeEval().evaluate(undefined)).toBe(true);
    });

    it('retourne true si conditions est un tableau vide', () => {
      expect(makeEval().evaluate([])).toBe(true);
    });
  });

  // ── Opérateur >= ──────────────────────────────────────────────────────────

  describe('opérateur >=', () => {
    it('true quand valeur > seuil', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 80 });
      expect(ev.evaluate([cond(GAME_STATS.PHYSIQUE, '>=', 50)])).toBe(true);
    });

    it('true quand valeur == seuil (égalité incluse)', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 50 });
      expect(ev.evaluate([cond(GAME_STATS.PHYSIQUE, '>=', 50)])).toBe(true);
    });

    it('false quand valeur < seuil', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 30 });
      expect(ev.evaluate([cond(GAME_STATS.PHYSIQUE, '>=', 50)])).toBe(false);
    });
  });

  // ── Opérateur <= ──────────────────────────────────────────────────────────

  describe('opérateur <=', () => {
    it('true quand valeur < seuil', () => {
      const ev = makeEval({ [GAME_STATS.MENTALE]: 20 });
      expect(ev.evaluate([cond(GAME_STATS.MENTALE, '<=', 50)])).toBe(true);
    });

    it('true quand valeur == seuil (égalité incluse)', () => {
      const ev = makeEval({ [GAME_STATS.MENTALE]: 50 });
      expect(ev.evaluate([cond(GAME_STATS.MENTALE, '<=', 50)])).toBe(true);
    });

    it('false quand valeur > seuil', () => {
      const ev = makeEval({ [GAME_STATS.MENTALE]: 80 });
      expect(ev.evaluate([cond(GAME_STATS.MENTALE, '<=', 50)])).toBe(false);
    });
  });

  // ── Opérateur > ───────────────────────────────────────────────────────────

  describe('opérateur >', () => {
    it('true quand valeur > seuil (strict)', () => {
      const ev = makeEval({ courage: 51 });
      expect(ev.evaluate([cond('courage', '>', 50)])).toBe(true);
    });

    it('false quand valeur == seuil (strict — égalité exclue)', () => {
      const ev = makeEval({ courage: 50 });
      expect(ev.evaluate([cond('courage', '>', 50)])).toBe(false);
    });

    it('false quand valeur < seuil', () => {
      const ev = makeEval({ courage: 49 });
      expect(ev.evaluate([cond('courage', '>', 50)])).toBe(false);
    });
  });

  // ── Opérateur < ───────────────────────────────────────────────────────────

  describe('opérateur <', () => {
    it('true quand valeur < seuil (strict)', () => {
      const ev = makeEval({ karma: 10 });
      expect(ev.evaluate([cond('karma', '<', 50)])).toBe(true);
    });

    it('false quand valeur == seuil (strict — égalité exclue)', () => {
      const ev = makeEval({ karma: 50 });
      expect(ev.evaluate([cond('karma', '<', 50)])).toBe(false);
    });

    it('false quand valeur > seuil', () => {
      const ev = makeEval({ karma: 51 });
      expect(ev.evaluate([cond('karma', '<', 50)])).toBe(false);
    });
  });

  // ── Opérateur == ──────────────────────────────────────────────────────────

  describe('opérateur ==', () => {
    it('true quand valeur == seuil', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 42 });
      expect(ev.evaluate([cond(GAME_STATS.PHYSIQUE, '==', 42)])).toBe(true);
    });

    it('false quand valeur != seuil', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 41 });
      expect(ev.evaluate([cond(GAME_STATS.PHYSIQUE, '==', 42)])).toBe(false);
    });
  });

  // ── Opérateur != ──────────────────────────────────────────────────────────

  describe('opérateur !=', () => {
    it('true quand valeur != seuil', () => {
      const ev = makeEval({ [GAME_STATS.MENTALE]: 30 });
      expect(ev.evaluate([cond(GAME_STATS.MENTALE, '!=', 50)])).toBe(true);
    });

    it('false quand valeur == seuil', () => {
      const ev = makeEval({ [GAME_STATS.MENTALE]: 50 });
      expect(ev.evaluate([cond(GAME_STATS.MENTALE, '!=', 50)])).toBe(false);
    });
  });

  // ── Logique AND (tableau de conditions) ───────────────────────────────────

  describe('ALL conditions (AND implicite)', () => {
    it('true si toutes les conditions sont vraies', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 80, [GAME_STATS.MENTALE]: 60 });
      expect(
        ev.evaluate([cond(GAME_STATS.PHYSIQUE, '>=', 50), cond(GAME_STATS.MENTALE, '>=', 50)])
      ).toBe(true);
    });

    it('false si au moins une condition est fausse', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 80, [GAME_STATS.MENTALE]: 20 });
      expect(
        ev.evaluate([cond(GAME_STATS.PHYSIQUE, '>=', 50), cond(GAME_STATS.MENTALE, '>=', 50)])
      ).toBe(false);
    });

    it('court-circuite dès la première condition fausse', () => {
      const ev = makeEval({ [GAME_STATS.PHYSIQUE]: 10 });
      // La deuxième condition porte sur une variable inconnue (vaut 0)
      expect(
        ev.evaluate([
          cond(GAME_STATS.PHYSIQUE, '>=', 50), // false → court-circuit
          cond('inconnue', '>=', 0), // true mais jamais évaluée
        ])
      ).toBe(false);
    });
  });

  // ── Variable inconnue ─────────────────────────────────────────────────────

  describe('variable inconnue', () => {
    it('vaut 0 par convention', () => {
      const ev = makeEval();
      expect(ev.evaluate([cond('inconnue', '==', 0)])).toBe(true);
    });

    it('fail correctement quand 0 ne satisfait pas la condition', () => {
      const ev = makeEval();
      expect(ev.evaluate([cond('inconnue', '>=', 1)])).toBe(false);
    });
  });

  // ── Opérateur invalide ────────────────────────────────────────────────────

  describe('opérateur invalide', () => {
    it('lève une erreur pour un opérateur non géré', () => {
      const ev = makeEval({ x: 10 });
      const badCond = { variable: 'x', operator: '???' as Condition['operator'], value: 5 };
      expect(() => ev.evaluate([badCond])).toThrow(/Unexpected operator/);
    });
  });
});
