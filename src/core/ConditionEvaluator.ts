/**
 * Evaluates conditions for dialogue branching
 *
 * Supports all comparison operators (>=, <=, >, <, ==, !=).
 * Empty conditions array always evaluates to true.
 */

import type { Condition } from '@/types';
import { VariableManager } from './VariableManager';

export class ConditionEvaluator {
  private vm: VariableManager;

  constructor(variableManager: VariableManager) {
    this.vm = variableManager;
  }

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
          return value === cond.value;
        case '!=':
          return value !== cond.value;
        default: {
          const exhaustive: never = cond.operator;
          throw new Error(`Unexpected operator: ${exhaustive}`);
        }
      }
    });
  }
}
