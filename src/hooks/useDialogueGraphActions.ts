import { useCallback } from 'react';
import type { Connection } from '@xyflow/react';
import { useScenesStore, useUIStore } from '@/stores';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import { useIsCosmosTheme } from '@/hooks/useGraphTheme';

/**
 * useDialogueGraphActions - Hook centralisant les actions d'édition du graphe de dialogues
 *
 * PHASE 2 - Approche Hybride:
 * - Double-clic node → DialogueWizard (édition guidée)
 * - Clic node → Sélection
 * - Palette boutons → Création via wizard
 * - Drag handles → Reconnexion de choix
 * - Toolbar → Delete, Duplicate, Auto-layout
 */
export function useDialogueGraphActions(sceneId: string) {
  // Zustand stores
  const deleteDialogue = useScenesStore((state) => state.deleteDialogue);
  const duplicateDialogue = useScenesStore((state) => state.duplicateDialogue);
  const updateDialogue = useScenesStore((state) => state.updateDialogue);
  const setWizardOpen = useUIStore((state) => state.setDialogueWizardOpen);
  const setEditDialogueIndex = useUIStore((state) => state.setDialogueWizardEditIndex);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);

  // PHASE 4: Cosmos theme effects
  const isCosmosTheme = useIsCosmosTheme();
  const { celebrateNodeCreation, flashOnDelete, sparkleOnConnection } = useCosmosEffects();

  /**
   * 1. Double-clic sur node → Ouvre DialogueWizard en mode édition
   */
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const index = extractDialogueIndexFromNodeId(nodeId);
      setSelectedSceneForEdit(sceneId);
      setEditDialogueIndex(index);
      setWizardOpen(true);
    },
    [sceneId, setEditDialogueIndex, setWizardOpen, setSelectedSceneForEdit]
  );

  /**
   * 2. Supprimer node sélectionné
   */
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const index = extractDialogueIndexFromNodeId(nodeId);
      deleteDialogue(sceneId, index);
      // PHASE 4: Cosmos flash effect on delete
      if (isCosmosTheme) {
        flashOnDelete();
      }
    },
    [sceneId, deleteDialogue, isCosmosTheme, flashOnDelete]
  );

  /**
   * 3. Dupliquer node sélectionné
   */
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const index = extractDialogueIndexFromNodeId(nodeId);
      duplicateDialogue(sceneId, index);
      // PHASE 4: Cosmos confetti effect on duplicate (node creation)
      if (isCosmosTheme) {
        celebrateNodeCreation();
      }
    },
    [sceneId, duplicateDialogue, isCosmosTheme, celebrateNodeCreation]
  );

  /**
   * 4. Créer nouveau dialogue via palette → Ouvre wizard en mode création
   */
  const handleCreateDialogue = useCallback(
    (complexity: 'simple' | 'choice' | 'magic-dice' | 'expert') => {
      setSelectedSceneForEdit(sceneId);
      // Ouvre wizard en mode création (editDialogueIndex reste undefined)
      // Le wizard détectera automatiquement le mode création
      setWizardOpen(true);
      // TODO PHASE 2.1: Ajouter state pour pré-sélectionner la complexité dans le wizard
      // Pour l'instant, l'utilisateur choisira la complexité dans le wizard
    },
    [sceneId, setWizardOpen, setSelectedSceneForEdit]
  );

  /**
   * 5. Reconnecter choix (drag handle source → target)
   * Permet de reconnecter un choix existant vers un autre dialogue
   */
  const handleReconnectChoice = useCallback(
    (params: Connection) => {
      const { source, sourceHandle, target } = params;

      if (!source || !sourceHandle || !target) return;

      // Extraire l'index du dialogue source
      const sourceIndex = extractDialogueIndexFromNodeId(source);

      // Extraire l'index du choix depuis le handle ID (format: "choice-0", "choice-1")
      const choiceIndex = parseInt(sourceHandle.split('-')[1] || '0', 10);

      // Récupérer le dialogue source depuis le store
      const scene = useScenesStore.getState().scenes.find((s) => s.id === sceneId);
      const dialogue = scene?.dialogues[sourceIndex];

      if (!dialogue || !dialogue.choices || !dialogue.choices[choiceIndex]) {
        console.warn('[useDialogueGraphActions] Invalid dialogue or choice index', {
          sourceIndex,
          choiceIndex,
          dialogue,
        });
        return;
      }

      // Extract target dialogue index from node ID and get actual dialogue ID
      const targetIndex = extractDialogueIndexFromNodeId(target);
      const targetDialogue = scene?.dialogues[targetIndex];

      if (!targetDialogue) {
        console.warn('[useDialogueGraphActions] Invalid target dialogue', { target, targetIndex });
        return;
      }

      // Mettre à jour le nextDialogueId du choix avec l'ID réel du dialogue (pas le node ID)
      const updatedChoices = dialogue.choices.map((choice, i) =>
        i === choiceIndex ? { ...choice, nextDialogueId: targetDialogue.id } : choice
      );

      updateDialogue(sceneId, sourceIndex, {
        choices: updatedChoices,
      });
    },
    [sceneId, updateDialogue]
  );

  /**
   * 6. Effet sparkle lors d'une connexion (PHASE 4 - Cosmos)
   */
  const handleConnectionEffect = useCallback(
    (x: number, y: number) => {
      if (isCosmosTheme) {
        sparkleOnConnection(x, y);
      }
    },
    [isCosmosTheme, sparkleOnConnection]
  );

  return {
    handleNodeDoubleClick,
    handleDeleteNode,
    handleDuplicateNode,
    handleCreateDialogue,
    handleReconnectChoice,
    handleConnectionEffect,
    // Export for external use
    isCosmosTheme,
    celebrateNodeCreation: isCosmosTheme ? celebrateNodeCreation : undefined,
  };
}

/**
 * Helper: Extrait l'index du dialogue depuis le nodeId
 * Format attendu: "sceneId-dialogueIndex" ou "dialogue-index"
 */
function extractDialogueIndexFromNodeId(nodeId: string): number {
  const parts = nodeId.split('-');
  // Prend le dernier segment qui doit être l'index
  const indexStr = parts[parts.length - 1];
  const index = parseInt(indexStr, 10);

  if (isNaN(index)) {
    console.warn('[useDialogueGraphActions] Invalid nodeId format:', nodeId);
    return 0;
  }

  return index;
}
