import React from 'react';
import { Rnd } from 'react-rnd';
import { motion } from 'framer-motion';
import { percentToPixels, pixelsToPercent, RESIZING_CONFIG } from '@/utils/canvasPositioning';
import { Z_INDEX } from '@/utils/zIndexLayers';
import { CHARACTER_ANIMATION_VARIANTS } from '@/constants/animations';
import type { SceneCharacter, Character, Size } from '@/types';

// Extended SceneCharacter with optional zIndex for runtime
interface SceneCharacterWithZIndex extends SceneCharacter {
  zIndex?: number;
}

export interface CharacterSpriteProps {
  sceneChar: SceneCharacterWithZIndex;
  character: Character;
  canvasDimensions: Size;
  gridEnabled: boolean;
  selectedCharacterId?: string;
  onCharacterClick: (sceneChar: SceneCharacterWithZIndex) => void;
  onContextMenu: (e: React.MouseEvent, sceneChar: SceneCharacterWithZIndex) => void;
  onUpdatePosition: (id: string, updates: Partial<SceneCharacterWithZIndex>) => void;
}

/**
 * CharacterSprite - Draggable/resizable character sprite on canvas
 * Memoized to prevent re-renders when other characters on the scene change.
 */
export const CharacterSprite = React.memo(function CharacterSprite({
  sceneChar,
  character,
  canvasDimensions,
  gridEnabled,
  selectedCharacterId,
  onCharacterClick,
  onContextMenu,
  onUpdatePosition
}: CharacterSpriteProps) {
  const sprite = character.sprites?.[sceneChar.mood || 'neutral'];
  const position = sceneChar.position || { x: 50, y: 50 };
  const scale = sceneChar.scale || 1.0;
  const zIndex = Math.max(Z_INDEX.CANVAS_CHARACTER_MIN, Math.min(Z_INDEX.CANVAS_CHARACTER_MAX, sceneChar.zIndex || 1));

  // Default character size
  const baseWidth = 128;
  const baseHeight = 128;
  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  // Convert percentage position to pixels (accounting for center transform)
  const pixelX = percentToPixels(position.x, canvasDimensions.width) - (scaledWidth / 2);
  const pixelY = percentToPixels(position.y, canvasDimensions.height) - (scaledHeight / 2);

  // Grid settings - snap to grid when grid is enabled
  const gridSize = 24; // Match grid pattern size
  const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

  // Get animation variant
  const entranceAnimation = sceneChar.entranceAnimation || 'none';
  const animationVariant = CHARACTER_ANIMATION_VARIANTS[entranceAnimation] || CHARACTER_ANIMATION_VARIANTS.none;

  return (
    <Rnd
      key={sceneChar.id}
      size={{ width: scaledWidth, height: scaledHeight }}
      position={{ x: pixelX, y: pixelY }}
      onDragStop={(e, d) => {
        // Convert pixel position back to percentage (accounting for center transform)
        const centerX = d.x + (scaledWidth / 2);
        const centerY = d.y + (scaledHeight / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdatePosition(sceneChar.id, {
          position: { x: newPercentX, y: newPercentY }
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        // Calculate new scale based on new width
        const newWidth = parseInt(ref.style.width);
        const newScale = newWidth / baseWidth;

        // Convert pixel position back to percentage
        const centerX = position.x + (newWidth / 2);
        const centerY = position.y + (parseInt(ref.style.height) / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdatePosition(sceneChar.id, {
          position: { x: newPercentX, y: newPercentY },
          scale: newScale
        });
      }}
      dragGrid={dragGrid as [number, number]}
      resizeGrid={dragGrid as [number, number]}
      lockAspectRatio={true}
      style={{ zIndex }}
      className="group"
      enableResizing={RESIZING_CONFIG}
    >
      <motion.div
        className="w-full h-full cursor-move"
        onClick={() => onCharacterClick(sceneChar)}
        onContextMenu={(e) => onContextMenu(e, sceneChar)}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={animationVariant}
      >
        {/* Character Sprite */}
        {sprite ? (
          <img
            src={sprite}
            alt={character.name}
            className="w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform pointer-events-none"
            draggable="false"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const nextSibling = target.nextSibling as HTMLElement;
              if (nextSibling) {
                nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
            <span className="text-2xl">👤</span>
          </div>
        )}

        {/* Fallback for broken images */}
        <div className="hidden w-full h-full bg-slate-700 rounded-full items-center justify-center border-2 border-slate-600">
          <span className="text-2xl">👤</span>
        </div>

        {/* Character Label (on hover) */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {character.name}
        </div>

        {/* Selection indicator */}
        {selectedCharacterId === sceneChar.id && (
          <div className="absolute inset-0 -m-2 border-4 border-blue-500 rounded-lg animate-pulse pointer-events-none" />
        )}
      </motion.div>
    </Rnd>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if relevant props changed
  return (
    prevProps.sceneChar.id === nextProps.sceneChar.id &&
    prevProps.sceneChar.mood === nextProps.sceneChar.mood &&
    prevProps.sceneChar.position?.x === nextProps.sceneChar.position?.x &&
    prevProps.sceneChar.position?.y === nextProps.sceneChar.position?.y &&
    prevProps.sceneChar.scale === nextProps.sceneChar.scale &&
    prevProps.sceneChar.entranceAnimation === nextProps.sceneChar.entranceAnimation &&
    prevProps.character.id === nextProps.character.id &&
    prevProps.character.sprites === nextProps.character.sprites &&
    prevProps.canvasDimensions.width === nextProps.canvasDimensions.width &&
    prevProps.canvasDimensions.height === nextProps.canvasDimensions.height &&
    prevProps.gridEnabled === nextProps.gridEnabled &&
    prevProps.selectedCharacterId === nextProps.selectedCharacterId
  );
});
