import { useCallback } from 'react';
import type { Connection } from '@xyflow/react';
import { useUIStore } from '@/stores';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import { useIsCosmosTheme } from '@/hooks/useGraphTheme';
import type { ComplexityLevel } from '@/components/dialogue-editor/DialogueWizard/hooks/useDialogueWizardState';
import { CHOICE_HANDLE_PREFIX, safeExtractDialogueIndex } from '@/config/handleConfig';
import { logger } from '@/utils/logger';

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
  const deleteDialogue = useDialoguesStore((state) => state.deleteDialogue);
  const duplicateDialogue = useDialoguesStore((state) => state.duplicateDialogue);
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);
  const setWizardOpen = useUIStore((state) => state.setDialogueWizardOpen);
  const setEditDialogueIndex = useUIStore((state) => state.setDialogueWizardEditIndex);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const setDialogueWizardInitialComplexity = useUIStore((state) => state.setDialogueWizardInitialComplexity);

  // PHASE 4: Cosmos theme effects
  const isCosmosTheme = useIsCosmosTheme();
  const { celebrateNodeCreation, flashOnDelete, sparkleOnConnection } = useCosmosEffects();

  /**
   * 1. Double-clic sur node → Ouvre DialogueWizard en mode édition
   */
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const index = safeExtractDialogueIndex(nodeId);
      if (index < 0) return;
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
      const index = safeExtractDialogueIndex(nodeId);
      if (index < 0) return;
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
      const index = safeExtractDialogueIndex(nodeId);
      if (index < 0) return;
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
   * PHASE 2.3: Direct 1:1 mapping avec 4 niveaux de complexité
   */
  const handleCreateDialogue = useCallback(
    (paletteComplexity: 'linear' | 'binary' | 'magic-dice' | 'expert') => {
      // Mapping palette → wizard complexity (PHASE 2.3: Now 1:1 mapping)
      const complexityMap: Record<string, ComplexityLevel> = {
        'linear': 'linear',      // Simples → Linear (pas de choix)
        'binary': 'binary',      // À choisir → Binary (2 choix)
        'magic-dice': 'dice',    // Dés Magiques → Dice (1-2 tests)
        'expert': 'expert'       // Expert → Expert (2-4 choix + effets)
      };

      const wizardComplexity = complexityMap[paletteComplexity];

      // Définir la complexité initiale dans le store
      setDialogueWizardInitialComplexity(wizardComplexity);

      // Ouvrir le wizard en mode création
      setSelectedSceneForEdit(sceneId);
      setWizardOpen(true);
    },
    [sceneId, setWizardOpen, setSelectedSceneForEdit, setDialogueWizardInitialComplexity]
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
      const sourceIndex = safeExtractDialogueIndex(source);
      if (sourceIndex < 0) return;

      // Extraire l'index du choix depuis le handle ID (format: "choice-0", "choice-1")
      const rawChoiceIndex = sourceHandle.replace(CHOICE_HANDLE_PREFIX, '');
      const choiceIndex = rawChoiceIndex ? parseInt(rawChoiceIndex, 10) : 0;

      // Récupérer le dialogue source depuis dialoguesStore (not scenesStore — see CLAUDE.md §6.6)
      const dialogues = useDialoguesStore.getState().getDialoguesByScene(sceneId);
      const dialogue = dialogues[sourceIndex];

      if (!dialogue || !dialogue.choices || !dialogue.choices[choiceIndex]) {
        logger.warn('[useDialogueGraphActions] Invalid dialogue or choice index', {
          sourceIndex,
          choiceIndex,
          dialogue,
        });
        return;
      }

      // Extract target dialogue index from node ID and get actual dialogue ID
      const targetIndex = safeExtractDialogueIndex(target);
      if (targetIndex < 0) return;
      const targetDialogue = dialogues[targetIndex];

      if (!targetDialogue) {
        logger.warn('[useDialogueGraphActions] Invalid target dialogue', { target, targetIndex });
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
   * 6. Reconnecter un dialogue direct (drag handle standard → target)
   * Met à jour dialogue.nextDialogueId pour créer une connexion explicite
   */
  const handleReconnectDialogue = useCallback(
    (params: Connection) => {
      const { source, target } = params;
      if (!source || !target || source === target) return;

      const sourceIndex = safeExtractDialogueIndex(source);
      const targetIndex = safeExtractDialogueIndex(target);
      if (sourceIndex < 0 || targetIndex < 0) return;

      const dialogues = useDialoguesStore.getState().getDialoguesByScene(sceneId);
      const targetDialogue = dialogues[targetIndex];
      if (!targetDialogue) return;

      updateDialogue(sceneId, sourceIndex, { nextDialogueId: targetDialogue.id });
    },
    [sceneId, updateDialogue]
  );

  /**
   * 7. Effet sparkle lors d'une connexion (PHASE 4 - Cosmos)
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
    handleReconnectDialogue,
    handleConnectionEffect,
    // Export for external use
    isCosmosTheme,
    celebrateNodeCreation: isCosmosTheme ? celebrateNodeCreation : undefined,
  };
}
