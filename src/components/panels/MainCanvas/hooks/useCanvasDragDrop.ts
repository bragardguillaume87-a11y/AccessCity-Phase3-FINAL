import { useState } from 'react';
import { logger } from '@/utils/logger';
import { TIMING } from '@/config/timing';
import type { Scene, Position, TextBox, Prop } from '@/types';

/**
 * Store actions interface for canvas drag & drop
 */
export interface CanvasDragDropActions {
  setSceneBackground: (sceneId: string, backgroundUrl: string) => void;
  addCharacterToScene: (
    sceneId: string,
    characterId: string,
    mood: string,
    position: Position,
    entranceAnimation: string
  ) => void;
  addTextBoxToScene: (sceneId: string, textBox: TextBox) => void;
  addPropToScene: (sceneId: string, prop: Prop) => void;
  setShowAddCharacterModal?: (show: boolean) => void;
}

/**
 * Props for useCanvasDragDrop hook
 */
export interface UseCanvasDragDropProps {
  selectedScene: Scene | undefined;
  canvasNode: HTMLDivElement | null;
  actions: CanvasDragDropActions;
}

/**
 * Return type for useCanvasDragDrop hook
 */
export interface UseCanvasDragDropReturn {
  isDragOver: boolean;
  dropFeedback: string | null;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

/**
 * useCanvasDragDrop - Manage drag & drop interactions for the canvas
 *
 * This hook handles all drag & drop logic for the MainCanvas, including:
 * - Visual feedback during drag operations
 * - Parsing drop data (background, character, textbox, prop)
 * - Calculating drop positions relative to canvas
 * - Invoking appropriate store actions
 *
 * Supported drop types:
 * - background: Set scene background image
 * - character: Add character to scene at drop position
 * - textbox: Create text box at drop position
 * - prop: Create prop (emoji) at drop position
 *
 * @param props - Configuration and action callbacks
 * @returns Drag state and event handlers
 *
 * @example
 * ```tsx
 * const dragDrop = useCanvasDragDrop({
 *   selectedScene,
 *   canvasNode,
 *   actions: {
 *     setSceneBackground,
 *     addCharacterToScene,
 *     addTextBoxToScene,
 *     addPropToScene
 *   }
 * });
 * ```
 */
export function useCanvasDragDrop({
  selectedScene,
  canvasNode,
  actions
}: UseCanvasDragDropProps): UseCanvasDragDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);

  /**
   * Handle drag over - Enable drop and show visual feedback
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  /**
   * Handle drag leave - Remove visual feedback when leaving canvas
   */
  const handleDragLeave = (e: React.DragEvent) => {
    if (!canvasNode?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  /**
   * Handle drop - Parse data and execute appropriate action
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (!selectedScene || !canvasNode) return;

      // Calculate drop position relative to canvas (in percentage)
      const rect = canvasNode.getBoundingClientRect();

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const position: Position = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      };

      // Handle different drop types
      switch (data.type) {
        case 'background':
          actions.setSceneBackground(selectedScene.id, data.backgroundUrl);
          setDropFeedback('background');
          setTimeout(() => setDropFeedback(null), TIMING.LOADING_MIN_DISPLAY);
          break;

        case 'character':
          actions.addCharacterToScene(
            selectedScene.id,
            data.characterId,
            data.mood,
            position,
            'none'
          );
          actions.setShowAddCharacterModal?.(false);
          break;

        case 'textbox': {
          const textBox: TextBox = {
            id: `textbox-${Date.now()}`,
            content: data.defaultText || 'Double-click to edit',
            position,
            size: { width: 300, height: 100 },
            style: {
              fontSize: data.fontSize || 16,
              fontWeight: data.fontWeight || 'normal'
            }
          };
          actions.addTextBoxToScene(selectedScene.id, textBox);
          break;
        }

        case 'prop': {
          const prop: Prop = {
            id: `prop-${Date.now()}`,
            assetUrl: data.emoji,
            position,
            size: { width: 80, height: 80 }
          };
          actions.addPropToScene(selectedScene.id, prop);
          break;
        }

        default:
          logger.warn('Unknown drag type:', data.type);
      }
    } catch (error) {
      logger.error('Failed to parse drop data:', error);
    }
  };

  return {
    isDragOver,
    dropFeedback,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
