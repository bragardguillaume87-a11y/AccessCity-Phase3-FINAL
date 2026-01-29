import { useState, useCallback } from 'react';
import type { Scene, Character, SceneCharacter, ModalType } from '@/types';

/**
 * Context menu data for the new kid-friendly CharacterContextMenu
 */
export interface CharacterContextMenuData {
  x: number;
  y: number;
  sceneChar: SceneCharacter;
  character: Character;
}

/**
 * Store actions for context menu operations
 */
export interface ContextMenuActions {
  updateSceneCharacter: (sceneId: string, sceneCharId: string, updates: Partial<SceneCharacter>) => void;
  removeCharacterFromScene: (sceneId: string, sceneCharId: string) => void;
}

/**
 * Props for useContextMenu hook
 */
export interface UseContextMenuProps {
  selectedScene: Scene | undefined;
  characters: Character[];
  actions: ContextMenuActions;
  onOpenModal?: (modal: ModalType | string, context?: unknown) => void;
}

/**
 * Return type for useContextMenu hook
 */
export interface UseContextMenuReturn {
  contextMenuData: CharacterContextMenuData | null;
  handleCharacterRightClick: (e: React.MouseEvent, sceneChar: SceneCharacter) => void;
  closeContextMenu: () => void;
  // Action handlers for CharacterContextMenu (take explicit IDs to avoid stale closures)
  handleEdit: (characterId: string) => void;
  handleChangeMood: (sceneCharId: string, mood: string) => void;
  handleChangeAnimation: (sceneCharId: string, animation: string) => void;
  handleChangeLayer: (sceneCharId: string, zIndex: number) => void;
  handleFlipHorizontal: (sceneCharId: string) => void;
  handleRemove: (sceneCharId: string) => void;
}

/**
 * useContextMenu - Manage context menu for character interactions
 *
 * This hook handles the right-click context menu for characters on the canvas.
 * Works with the new kid-friendly CharacterContextMenu component.
 *
 * Features:
 * - Edit character properties
 * - Change mood (visual picker)
 * - Change entrance animation (visual picker)
 * - Change Z-index/layer (visual picker)
 * - Remove from scene (with confirmation)
 *
 * @param props - Configuration and action callbacks
 * @returns Context menu state and handlers
 */
export function useContextMenu({
  selectedScene,
  characters,
  actions,
  onOpenModal
}: UseContextMenuProps): UseContextMenuReturn {
  const [contextMenuData, setContextMenuData] = useState<CharacterContextMenuData | null>(null);

  /**
   * Handle right-click on character - Show context menu
   */
  const handleCharacterRightClick = useCallback((e: React.MouseEvent, sceneChar: SceneCharacter) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event from bubbling to parent elements

    const character = characters.find(c => c.id === sceneChar.characterId);
    if (!character) return;

    setContextMenuData({
      x: e.clientX,
      y: e.clientY,
      sceneChar,
      character
    });
  }, [characters]);

  /**
   * Close context menu
   */
  const closeContextMenu = useCallback(() => {
    setContextMenuData(null);
  }, []);

  /**
   * Open character editor (takes explicit characterId to avoid stale closures)
   */
  const handleEdit = useCallback((characterId: string) => {
    if (!onOpenModal) {
      console.error('[useContextMenu] handleEdit: onOpenModal callback is not defined!');
      console.error('[useContextMenu] Make sure MainCanvas receives onOpenModal prop from EditorShell');
      return;
    }
    console.log('[useContextMenu] Opening character editor for:', characterId);
    onOpenModal('characters', { characterId });
  }, [onOpenModal]);

  /**
   * Change character mood in scene
   */
  const handleChangeMood = useCallback((sceneCharId: string, mood: string) => {
    if (selectedScene) {
      actions.updateSceneCharacter(selectedScene.id, sceneCharId, { mood });
    }
  }, [selectedScene, actions]);

  /**
   * Change character entrance animation
   */
  const handleChangeAnimation = useCallback((sceneCharId: string, animation: string) => {
    if (selectedScene) {
      actions.updateSceneCharacter(selectedScene.id, sceneCharId, { entranceAnimation: animation });
    }
  }, [selectedScene, actions]);

  /**
   * Change character layer/z-index
   */
  const handleChangeLayer = useCallback((sceneCharId: string, zIndex: number) => {
    if (selectedScene) {
      actions.updateSceneCharacter(selectedScene.id, sceneCharId, { zIndex });
    }
  }, [selectedScene, actions]);

  /**
   * Flip character horizontally (mirror left-right)
   */
  const handleFlipHorizontal = useCallback((sceneCharId: string) => {
    if (selectedScene) {
      const sceneChar = selectedScene.characters.find(c => c.id === sceneCharId);
      if (sceneChar) {
        actions.updateSceneCharacter(selectedScene.id, sceneCharId, { flipped: !sceneChar.flipped });
      }
    }
  }, [selectedScene, actions]);

  /**
   * Remove character from scene
   */
  const handleRemove = useCallback((sceneCharId: string) => {
    if (selectedScene) {
      actions.removeCharacterFromScene(selectedScene.id, sceneCharId);
    }
  }, [selectedScene, actions]);

  return {
    contextMenuData,
    handleCharacterRightClick,
    closeContextMenu,
    handleEdit,
    handleChangeMood,
    handleChangeAnimation,
    handleChangeLayer,
    handleFlipHorizontal,
    handleRemove
  };
}
