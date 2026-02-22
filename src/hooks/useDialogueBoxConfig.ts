import { useMemo } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { DIALOGUE_BOX_DEFAULTS } from '@/components/ui/DialogueBox';
import type { DialogueBoxStyle } from '@/types/scenes';

/**
 * useDialogueBoxConfig — Source unique de vérité pour la config de la boîte de dialogue.
 *
 * Merge : DIALOGUE_BOX_DEFAULTS → paramètres projet → override par dialogue.
 *
 * Utilisé par PreviewPlayer ET DialoguePreviewOverlay pour garantir
 * un rendu strictement identique dans les deux contextes.
 *
 * @param boxStyleOverride  - override optionnel au niveau d'un dialogue (dialogue.boxStyle)
 */
export function useDialogueBoxConfig(
  boxStyleOverride?: DialogueBoxStyle | null,
): Required<DialogueBoxStyle> {
  const dialogueBoxDefaults = useSettingsStore(s => s.projectSettings.game.dialogueBoxDefaults);

  return useMemo((): Required<DialogueBoxStyle> => ({
    ...DIALOGUE_BOX_DEFAULTS,
    ...dialogueBoxDefaults,
    ...boxStyleOverride,
  }), [dialogueBoxDefaults, boxStyleOverride]);
}
