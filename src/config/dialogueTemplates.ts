/**
 * Situation Templates for Dialogue Wizard
 *
 * Type definitions for pre-filled dialogue situations.
 */

import type { ComplexityLevel } from '@/types';
import type { Effect } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateChoice {
  text: string;
  effects: Effect[];
  diceCheck?: { stat: string; difficulty: number };
}

export interface SituationTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  complexity: ComplexityLevel;
  prefill: {
    speaker?: string;
    text?: string;
    choices?: TemplateChoice[];
  };
}
