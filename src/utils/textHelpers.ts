/**
 * textHelpers.ts — Shared text utilities for the graph editor
 *
 * Eliminates duplicated truncation, validation status, and type guard patterns
 * across BaseNode, ChoiceNode, TerminalNode, buildGraphEdges, and layout utils.
 */

import type { ValidationProblem } from '@/types';
import { TRUNCATION } from '@/config/cosmosConstants';

// ============================================================================
// TEXT TRUNCATION
// ============================================================================

/**
 * Truncate text with ellipsis. Returns fallback if text is empty/undefined.
 *
 * Previously duplicated as:
 * - `text.length > 80 ? text.substring(0, 80) + '...' : text` (BaseNode)
 * - `choice.text?.substring(0, 12)` (ChoiceNode)
 * - `choiceText.substring(0, 30) + '...'` (TerminalNode)
 * - `choice.text.substring(0, 20) + '...'` (buildGraphEdges)
 */
export function truncate(text: string | undefined | null, max: number, fallback = ''): string {
  if (!text) return fallback;
  return text.length > max ? text.substring(0, max) + '...' : text;
}

/** Preconfigured truncators for common use cases */
export const truncateNodeText = (text: string | undefined) =>
  truncate(text, TRUNCATION.nodeText, '(Empty dialogue)');

export const truncateStageDirections = (text: string | undefined) =>
  truncate(text, TRUNCATION.stageDirections);

export const truncateChoicePreview = (text: string | undefined, fallback: string) =>
  truncate(text, TRUNCATION.choicePreview, fallback);

export const truncateEdgeLabel = (text: string | undefined, fallback: string) =>
  truncate(text, TRUNCATION.edgeLabel, fallback);

export const truncateTerminalChoice = (text: string | undefined) =>
  truncate(text, TRUNCATION.terminalChoice);

// ============================================================================
// VALIDATION STATUS
// ============================================================================

/**
 * Extract error/warning status from a list of ValidationProblems.
 *
 * Previously duplicated as:
 * - `issues.some(i => i.type === 'error')` / `issues.some(i => i.type === 'warning')` (BaseNode, ChoiceNode)
 */
export function getIssueStatus(issues: ValidationProblem[]): { hasErrors: boolean; hasWarnings: boolean } {
  let hasErrors = false;
  let hasWarnings = false;
  for (const issue of issues) {
    if (issue.type === 'error') hasErrors = true;
    else if (issue.type === 'warning') hasWarnings = true;
    if (hasErrors && hasWarnings) break;
  }
  return { hasErrors, hasWarnings };
}

// ============================================================================
// NODE TYPE GUARDS
// ============================================================================

/**
 * Type guards for filtering nodes by type.
 *
 * Previously duplicated as:
 * - `n.type !== 'terminalNode'` in applySerpentineLayout, useSerpentineSync (4+ places)
 */
export const isTerminalNode = (n: { type?: string }): boolean => n.type === 'terminalNode';
export const isDialogueNode = (n: { type?: string }): boolean => n.type === 'dialogueNode';
export const isChoiceNode = (n: { type?: string }): boolean => n.type === 'choiceNode';
export const isRowSeparatorNode = (n: { type?: string }): boolean => n.type === 'rowSeparatorNode';
