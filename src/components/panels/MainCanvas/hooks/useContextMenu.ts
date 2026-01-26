import { useState } from 'react';
import type { Scene, Character, SceneCharacter, ModalType } from '@/types';

/**
 * Context menu item definition
 */
export interface ContextMenuItem {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}

/**
 * Context menu data (position + items)
 */
export interface ContextMenuData {
  x: number;
  y: number;
  items: ContextMenuItem[];
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
  contextMenuData: ContextMenuData | null;
  handleCharacterRightClick: (e: React.MouseEvent, sceneChar: SceneCharacter) => void;
  closeContextMenu: () => void;
}

/**
 * useContextMenu - Manage context menu for character interactions
 *
 * This hook handles the right-click context menu for characters on the canvas,
 * providing options to:
 * - Edit character properties
 * - Change mood
 * - Change entrance animation
 * - Change Z-index (layer order)
 * - Remove from scene
 *
 * @param props - Configuration and action callbacks
 * @returns Context menu state and handlers
 *
 * @example
 * ```tsx
 * const { contextMenuData, handleCharacterRightClick, closeContextMenu } = useContextMenu({
 *   selectedScene,
 *   characters,
 *   actions: { updateSceneCharacter, removeCharacterFromScene },
 *   onOpenModal
 * });
 * ```
 */
export function useContextMenu({
  selectedScene,
  characters,
  actions,
  onOpenModal
}: UseContextMenuProps): UseContextMenuReturn {
  const [contextMenuData, setContextMenuData] = useState<ContextMenuData | null>(null);

  /**
   * Handle right-click on character - Build and display context menu
   */
  const handleCharacterRightClick = (e: React.MouseEvent, sceneChar: SceneCharacter) => {
    e.preventDefault();

    const character = characters.find(c => c.id === sceneChar.characterId);
    const characterName = character?.name || 'Character';

    setContextMenuData({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: `Edit ${characterName}`,
          icon: '✏️',
          onClick: () => {
            if (onOpenModal) {
              onOpenModal('characters', { characterId: sceneChar.characterId });
            }
          }
        },
        {
          label: 'Change Mood',
          icon: '😊',
          onClick: () => {
            const currentMood = sceneChar.mood || 'neutral';
            const newMood = prompt(`Enter mood for ${characterName}:`, currentMood);
            if (newMood && newMood !== currentMood && selectedScene) {
              actions.updateSceneCharacter(selectedScene.id, sceneChar.id, { mood: newMood });
            }
          }
        },
        {
          label: 'Change Entrance Animation',
          icon: '✨',
          onClick: () => {
            const animations = ['none', 'fadeIn', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown', 'pop', 'bounce'];
            const current = sceneChar.entranceAnimation || 'none';
            const message = `Select entrance animation for ${characterName}:\n\nAvailable animations:\n${animations.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nCurrent: ${current}`;
            const choice = prompt(message, current);

            if (choice && animations.includes(choice.toLowerCase()) && selectedScene) {
              actions.updateSceneCharacter(selectedScene.id, sceneChar.id, {
                entranceAnimation: choice.toLowerCase()
              });
              alert(`Entrance animation set to: ${choice}\n\nReload the scene to see the animation.`);
            }
          }
        },
        {
          label: 'Change Z-Index',
          icon: '🎯',
          onClick: () => {
            const currentZIndex = sceneChar.zIndex || 1;
            const newZIndex = prompt(`Enter Z-Index (layer order) for ${characterName}:`, String(currentZIndex));
            if (newZIndex !== null && selectedScene) {
              const parsedZIndex = parseInt(newZIndex);
              if (!isNaN(parsedZIndex)) {
                actions.updateSceneCharacter(selectedScene.id, sceneChar.id, { zIndex: parsedZIndex });
              }
            }
          }
        },
        {
          label: 'Remove from Scene',
          icon: '🗑️',
          onClick: () => {
            const confirmed = window.confirm(`Remove ${characterName} from this scene?`);
            if (confirmed && selectedScene) {
              actions.removeCharacterFromScene(selectedScene.id, sceneChar.id);
            }
          },
          danger: true
        }
      ]
    });
  };

  /**
   * Close context menu
   */
  const closeContextMenu = () => {
    setContextMenuData(null);
  };

  return {
    contextMenuData,
    handleCharacterRightClick,
    closeContextMenu,
  };
}
