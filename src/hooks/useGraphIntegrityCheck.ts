import { useMemo } from 'react';
import type { Dialogue } from '@/types';
import { checkDialogueIntegrity } from '@/core/dialogueIntegrity';

export type { IntegrityIssue } from '@/core/dialogueIntegrity';

/**
 * useGraphIntegrityCheck — Thin React wrapper around checkDialogueIntegrity.
 *
 * Memoizes results on dialogues reference change.
 * Pure logic lives in @/core/dialogueIntegrity (testable without React).
 */
export function useGraphIntegrityCheck(dialogues: Dialogue[]): import('@/core/dialogueIntegrity').IntegrityIssue[] {
  return useMemo(() => checkDialogueIntegrity(dialogues), [dialogues]);
}
