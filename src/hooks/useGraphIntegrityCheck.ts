import { useMemo } from 'react';
import type { Dialogue } from '@/types';

export interface IntegrityIssue {
  id: string;
  dialogueIndex: number;
  choiceIndex?: number;
  type: 'empty_text' | 'missing_choice_link' | 'empty_choice_text';
  /** Human-readable label for the node (e.g. "7", "7A", "7B") */
  nodeLabel: string;
  message: string;
}

/**
 * useGraphIntegrityCheck — Scan dialogues for incomplete or empty elements.
 *
 * Checks:
 * 1. Dialogues with empty text
 * 2. Choice options without a destination (nextDialogueId)
 * 3. Choice options with empty text
 *
 * Returns a stable array of issues (memoized on dialogues reference).
 */
export function useGraphIntegrityCheck(dialogues: Dialogue[]): IntegrityIssue[] {
  return useMemo(() => {
    if (!dialogues || dialogues.length === 0) return [];

    // Pre-compute display labels (mirrors logic in useDialogueGraph)
    // Also handles dice check responses (not marked isResponse but referenced by diceCheck.success/failure)
    const diceResponseIds = new Set<string>();
    dialogues.forEach(d => {
      d.choices?.forEach(choice => {
        if (choice.diceCheck) {
          if (choice.diceCheck.success?.nextDialogueId) diceResponseIds.add(choice.diceCheck.success.nextDialogueId);
          if (choice.diceCheck.failure?.nextDialogueId) diceResponseIds.add(choice.diceCheck.failure.nextDialogueId);
        }
      });
    });

    const nodeLabels = new Map<number, string>();
    let lastChoiceDisplayIndex = -1;
    let letterCode = 65; // 'A'

    dialogues.forEach((d, i) => {
      const hasChoices = !!(d.choices && d.choices.length > 0);
      const isResponseNode = d.isResponse || diceResponseIds.has(d.id);
      if (hasChoices) {
        lastChoiceDisplayIndex = i;
        letterCode = 65;
        nodeLabels.set(i, `${i + 1}`);
      } else if (isResponseNode && lastChoiceDisplayIndex >= 0) {
        nodeLabels.set(i, `${lastChoiceDisplayIndex + 1}${String.fromCharCode(letterCode)}`);
        letterCode++;
      } else {
        lastChoiceDisplayIndex = -1;
        nodeLabels.set(i, `${i + 1}`);
      }
    });

    const issues: IntegrityIssue[] = [];

    dialogues.forEach((dialogue, index) => {
      const nodeLabel = nodeLabels.get(index) ?? `${index + 1}`;

      // 1. Empty dialogue text
      if (!dialogue.text?.trim()) {
        issues.push({
          id: `empty-text-${index}`,
          dialogueIndex: index,
          type: 'empty_text',
          nodeLabel,
          message: `Noeud ${nodeLabel} — texte vide`,
        });
      }

      // 2 & 3. Choice-specific checks
      // Skip "missing destination" checks for intentional terminal nodes:
      // — dialogue.isConclusion: explicitly marked as conclusion by the user
      // — last dialogue in array: implicitly the end of the story
      const isTerminalNode = dialogue.isConclusion || index === dialogues.length - 1;

      if (dialogue.choices && dialogue.choices.length > 0) {
        dialogue.choices.forEach((choice, ci) => {
          const choiceLabel = choice.text?.trim()
            ? `"${choice.text.slice(0, 25)}${choice.text.length > 25 ? '…' : ''}"`
            : `Choix ${ci + 1}`;

          // A choice has a valid destination if it links to another dialogue,
          // jumps to a scene, or has a diceCheck with outcomes.
          const hasDestination =
            !!choice.nextDialogueId ||
            !!choice.nextSceneId ||
            !!choice.diceCheck;

          if (!hasDestination && !isTerminalNode) {
            issues.push({
              id: `missing-link-${index}-${ci}`,
              dialogueIndex: index,
              choiceIndex: ci,
              type: 'missing_choice_link',
              nodeLabel,
              message: `Noeud ${nodeLabel} — ${choiceLabel} sans destination`,
            });
          }

          if (!choice.text?.trim()) {
            issues.push({
              id: `empty-choice-${index}-${ci}`,
              dialogueIndex: index,
              choiceIndex: ci,
              type: 'empty_choice_text',
              nodeLabel,
              message: `Noeud ${nodeLabel} — Choix ${ci + 1} sans texte`,
            });
          }
        });
      }
    });

    return issues;
  }, [dialogues]);
}
