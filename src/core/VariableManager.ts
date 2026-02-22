/**
 * Manages game variables with bounded values (0-100)
 */

import type { GameStats } from '@/types';
import { GAME_STATS } from '@/i18n';
import { STAT_BOUNDS } from '@/config/gameConstants';

export class VariableManager {
  private variables: GameStats;

  constructor(initial?: GameStats) {
    this.variables = {
      [GAME_STATS.PHYSIQUE]: STAT_BOUNDS.MAX,
      [GAME_STATS.MENTALE]: STAT_BOUNDS.MAX,
      ...(initial || {})
    };
  }

  get(name: string): number {
    return this.variables[name] !== undefined ? this.variables[name] : 0;
  }

  set(name: string, value: number): void {
    this.variables[name] = value;
  }

  modify(name: string, delta: number): void {
    const current = this.get(name);
    const next = Math.max(STAT_BOUNDS.MIN, Math.min(STAT_BOUNDS.MAX, current + delta));
    this.set(name, next);
  }

  getAll(): GameStats {
    return { ...this.variables };
  }
}
