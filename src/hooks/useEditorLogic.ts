/**
 * useEditorLogic - Business Logic Hook for Editor
 *
 * Extracts all business logic from EditorShell following Clean Architecture principles.
 * Handles:
 * - Scene/Dialogue/Character navigation
 * - Auto-selection logic
 * - Event handlers
 * - State coordination
 *
 * Benefits:
 * - Single Responsibility: Business logic separated from presentation
 * - Testable: Can be tested independently
 * - Reusable: Can be used in different components
 * - Maintainable: Logic centralized in one place
 *
 * @module hooks/useEditorLogic
 */

import { useCallback, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { useEditorFacade } from '@/facades';
import { logger } from '@/utils/logger';
import type { Scene } from '@/types';

/**
 * Editor Logic Configuration
 */
interface UseEditorLogicConfig {
  /**
   * Current scenes array
   */
  scenes: Scene[];

  /**
   * Currently selected scene ID for editing
   */
  selectedSceneForEdit: string | null;

  /**
   * Function to set the selected scene for editing
   */
  setSelectedSceneForEdit: (sceneId: string) => void;
}

/**
 * Editor Logic Return Type
 */
interface UseEditorLogicReturn {
  /**
   * Handler for scene selection from Explorer
   * Shows scene properties and UnifiedPanel
   */
  handleSceneSelect: (sceneId: string) => void;

  /**
   * Handler for dialogue selection from Explorer
   */
  handleDialogueSelect: (
    sceneId: string,
    dialogueIndex: number,
    metadata?: { type: string; sceneCharacterId?: string }
  ) => void;

  /**
   * Handler for character selection from Explorer
   */
  handleCharacterSelect: (characterId: string) => void;

  /**
   * Handler for tab change in LeftPanel
   */
  handleTabChange: (tab: 'scenes' | 'dialogues') => void;

  /**
   * Handler for navigation to scene from ProblemsPanel
   */
  handleNavigateTo: (tab: string, params?: { sceneId?: string }) => void;
}

/**
 * useEditorLogic Hook
 *
 * Centralizes all editor business logic.
 * EditorShell should only handle presentation (JSX rendering).
 *
 * @param config - Configuration with scenes, selection state, and setters
 * @returns Editor logic handlers
 */
export function useEditorLogic(config: UseEditorLogicConfig): UseEditorLogicReturn {
  const { scenes, selectedSceneForEdit, setSelectedSceneForEdit } = config;

  // Access EditorFacade for high-level operations
  const editor = useEditorFacade();

  // === AUTO-SELECTION LOGIC ===

  /**
   * Auto-select first scene on initial load
   * Uses EditorFacade for intelligent scene selection
   */
  useEffect(() => {
    // Only run on initial load: if no scene is selected but scenes exist
    if (!selectedSceneForEdit && scenes.length > 0) {
      const firstScene = scenes[0];
      logger.info(`[useEditorLogic] Auto-selecting first scene on load: ${firstScene.id}`);

      setSelectedSceneForEdit(firstScene.id);

      // Use EditorFacade's intelligent scene selection
      // Automatically handles dialogue auto-selection or scene selection
      editor.selectSceneWithAutoDialogue(firstScene.id);
    }
  }, [selectedSceneForEdit, scenes, setSelectedSceneForEdit, editor]);

  // === EVENT HANDLERS ===

  /**
   * Handle scene selection from Explorer
   * Shows scene properties and "Add Element" panel (UnifiedPanel)
   */
  const handleSceneSelect = useCallback(
    (sceneId: string) => {
      logger.debug(`[useEditorLogic] Scene selected: ${sceneId}`);
      setSelectedSceneForEdit(sceneId);

      // Select scene type to show UnifiedPanel ("Add Element")
      // Does NOT auto-select dialogue
      editor.selectScene(sceneId);
    },
    [setSelectedSceneForEdit, editor]
  );

  /**
   * Handle dialogue selection from Explorer or MainCanvas
   */
  const handleDialogueSelect = useCallback(
    (sceneId: string, dialogueIndex: number, metadata?: { type: string; sceneCharacterId?: string }) => {
      logger.debug(`[useEditorLogic] Dialogue selected: scene=${sceneId}, index=${dialogueIndex}`);
      setSelectedSceneForEdit(sceneId);

      // If metadata is provided (e.g., for scene character selection), use it
      if (metadata && metadata.type === 'sceneCharacter' && metadata.sceneCharacterId) {
        editor.selectCharacter(metadata.sceneCharacterId);
      } else {
        editor.selectDialogue(sceneId, dialogueIndex);
      }
    },
    [setSelectedSceneForEdit, editor]
  );

  /**
   * Handle character selection from Explorer
   */
  const handleCharacterSelect = useCallback(
    (characterId: string) => {
      logger.debug(`[useEditorLogic] Character selected: ${characterId}`);
      editor.selectCharacter(characterId);
    },
    [editor]
  );

  /**
   * Handle tab change in LeftPanel
   * - 'scenes' tab: show UnifiedPanel (Add Elements)
   * - 'dialogues' tab: auto-select first dialogue if available
   */
  const handleTabChange = useCallback(
    (tab: 'scenes' | 'dialogues') => {
      logger.debug(`[useEditorLogic] Tab changed to: ${tab}`);

      if (tab === 'scenes') {
        // Select scene to show UnifiedPanel
        const sceneId = selectedSceneForEdit || scenes[0]?.id;
        if (sceneId) {
          setSelectedSceneForEdit(sceneId);
          editor.selectScene(sceneId);
        }
      } else if (tab === 'dialogues') {
        // Clear selection to trigger dialogue auto-select
        editor.clearSelection();
      }
    },
    [selectedSceneForEdit, scenes, setSelectedSceneForEdit, editor]
  );

  /**
   * Handle navigation from ProblemsPanel
   */
  const handleNavigateTo = useCallback(
    (_tab: string, params?: { sceneId?: string }) => {
      if (params?.sceneId) {
        logger.debug(`[useEditorLogic] Navigating to scene: ${params.sceneId}`);
        setSelectedSceneForEdit(params.sceneId);
      }
    },
    [setSelectedSceneForEdit]
  );

  // === RETURN API ===

  return {
    handleSceneSelect,
    handleDialogueSelect,
    handleCharacterSelect,
    handleTabChange,
    handleNavigateTo,
  };
}
