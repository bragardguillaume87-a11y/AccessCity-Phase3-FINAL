import { useUIStore } from '@/stores';

/**
 * Renvoie true si l'éditeur est en mode Élève (kid).
 *
 * Utilisé dans 5+ composants pour adapter l'interface :
 * DialogueCard, DialoguesPanel, DialoguePropertiesForm,
 * TimelinePlayhead, UnifiedPanel.
 */
export function useIsKidMode(): boolean {
  return useUIStore(s => s.editorMode) === 'kid';
}
