import type { ValidationProblem } from '@/types';

/**
 * Shape returned by useValidation() — we only declare what the adapter needs.
 */
interface ValidationResult {
  errors: {
    dialogues: Record<string, Array<{ field: string; message: string; severity: 'error' | 'warning' }>>;
  };
}

/**
 * Shape consumed by useDialogueGraph() for per-node issue overlays.
 */
interface AdaptedValidation {
  errors: {
    dialogues: Record<string, ValidationProblem[]>;
  };
}

/**
 * adaptValidation — Adapter pattern (ValidationError → ValidationProblem)
 *
 * Replaces the `as unknown as …` bridge in DialogueGraph.tsx
 * with a type-safe, explicit field mapping.
 */
export function adaptValidation(raw: ValidationResult | null): AdaptedValidation | null {
  if (!raw) return null;

  const adapted: Record<string, ValidationProblem[]> = {};

  for (const [key, errors] of Object.entries(raw.errors.dialogues)) {
    adapted[key] = errors.map((err) => ({
      id: err.field,
      type: err.severity,
      message: err.message,
    }));
  }

  return { errors: { dialogues: adapted } };
}
