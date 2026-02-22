import { useState, useCallback } from 'react';
import type { Scene, Character, SceneCharacter, ModalType, SelectedElementType } from '@/types';
import { logger } from '@/utils/logger';
import { useDialoguesStore } from '@/stores/dialoguesStore';

export interface CharacterContextMenuData {
  x: number;
  y: number;
  sceneChar: SceneCharacter;
  character: Character;
}

export interface ContextMenuActions {
  updateSceneCharacter: (sceneId: string, sceneCharId: string, updates: Partial<SceneCharacter>) => void;
  removeCharacterFromScene: (sceneId: string, sceneCharId: string) => void;
}

export interface UseContextMenuProps {
  selectedScene: Scene | undefined;
  /** Currently selected element — used to route mood changes to dialogue or scene level */
  selectedElement?: SelectedElementType;
  characters: Character[];
  sceneCharacters: SceneCharacter[];
  actions: ContextMenuActions;
  onOpenModal?: (modal: ModalType | string, context?: unknown) => void;
}

export interface UseContextMenuReturn {
  contextMenuData: CharacterContextMenuData | null;
  handleCharacterRightClick: (e: React.MouseEvent, sceneChar: SceneCharacter) => void;
  closeContextMenu: () => void;
  handleEdit: (characterId: string) => void;
  handleChangeMood: (sceneCharId: string, mood: string) => void;
  handleChangeAnimation: (sceneCharId: string, animation: string) => void;
  handleChangeLayer: (sceneCharId: string, zIndex: number) => void;
  handleFlipHorizontal: (sceneCharId: string) => void;
  handleRemove: (sceneCharId: string) => void;
}

/**
 * useContextMenu - Right-click context menu for character interactions on canvas.
 * All handlers take explicit IDs to avoid stale closures.
 *
 * Mood routing:
 * - When a dialogue is selected → mood change is stored in dialogue.characterMoods (per-dialogue)
 * - Otherwise → mood change updates sceneCharacter.mood (scene-level permanent)
 */
export function useContextMenu({
  selectedScene,
  selectedElement,
  characters,
  sceneCharacters,
  actions,
  onOpenModal
}: UseContextMenuProps): UseContextMenuReturn {
  const [contextMenuData, setContextMenuData] = useState<CharacterContextMenuData | null>(null);

  const handleCharacterRightClick = useCallback((e: React.MouseEvent, sceneChar: SceneCharacter) => {
    e.preventDefault();
    e.stopPropagation();

    const character = characters.find(c => c.id === sceneChar.characterId);
    if (!character) return;

    // Position menu to the right of the sprite (or left if sprite is in right half of viewport)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuMaxWidth = 380;
    const isOnRightHalf = rect.left + rect.width / 2 > window.innerWidth / 2;
    const x = isOnRightHalf ? Math.max(8, rect.left - menuMaxWidth - 8) : rect.right + 8;
    const y = Math.min(rect.top, window.innerHeight - 400);

    setContextMenuData({ x, y, sceneChar, character });
  }, [characters]);

  const closeContextMenu = useCallback(() => {
    setContextMenuData(null);
  }, []);

  const handleEdit = useCallback((characterId: string) => {
    if (!onOpenModal) {
      logger.error('[useContextMenu] onOpenModal not defined — MainCanvas must receive it from EditorShell');
      return;
    }
    logger.debug('[useContextMenu] Opening character editor for:', characterId);
    onOpenModal('characters', { characterId });
  }, [onOpenModal]);

  const handleChangeMood = useCallback((sceneCharId: string, mood: string) => {
    if (!selectedScene) return;

    // If a dialogue is currently selected → store mood override in dialogue.characterMoods
    if (selectedElement?.type === 'dialogue' && selectedElement.sceneId === selectedScene.id) {
      const { updateDialogue, dialoguesByScene } = useDialoguesStore.getState();
      const dialogues = dialoguesByScene[selectedScene.id] || [];
      const dialogue = dialogues[selectedElement.index];
      if (dialogue) {
        const newMoods = { ...(dialogue.characterMoods || {}), [sceneCharId]: mood };
        updateDialogue(selectedScene.id, selectedElement.index, { characterMoods: newMoods });
        logger.debug(`[useContextMenu] Mood "${mood}" set for dialogue #${selectedElement.index}, char ${sceneCharId}`);
        return;
      }
    }

    // Default: update scene-level mood
    actions.updateSceneCharacter(selectedScene.id, sceneCharId, { mood });
  }, [selectedScene, selectedElement, actions]);

  const handleChangeAnimation = useCallback((sceneCharId: string, animation: string) => {
    if (selectedScene) {
      actions.updateSceneCharacter(selectedScene.id, sceneCharId, { entranceAnimation: animation });
    }
  }, [selectedScene, actions]);

  const handleChangeLayer = useCallback((sceneCharId: string, zIndex: number) => {
    if (selectedScene) {
      actions.updateSceneCharacter(selectedScene.id, sceneCharId, { zIndex });
    }
  }, [selectedScene, actions]);

  /** Flip uses sceneCharacters prop instead of store.getState() for declarative pattern */
  const handleFlipHorizontal = useCallback((sceneCharId: string) => {
    if (selectedScene) {
      const sceneChar = sceneCharacters.find(c => c.id === sceneCharId);
      if (sceneChar) {
        actions.updateSceneCharacter(selectedScene.id, sceneCharId, { flipped: !sceneChar.flipped });
      }
    }
  }, [selectedScene, sceneCharacters, actions]);

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
