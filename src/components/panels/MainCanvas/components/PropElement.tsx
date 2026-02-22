
import { Rnd } from 'react-rnd';
import { percentToPixels, pixelsToPercent, RESIZING_CONFIG } from '@/utils/canvasPositioning';
import { Z_INDEX } from '@/utils/zIndexLayers';
import { CANVAS_CONFIG, ELEMENT_SIZES, REFERENCE_CANVAS_WIDTH } from '@/config/canvas';
import type { Position, Size } from '@/types';

// Extended Prop interface for emoji props used in MainCanvas
export interface CanvasProp {
  id: string;
  emoji: string;
  position?: Position;
  size?: Size;
}

export interface PropElementProps {
  prop: CanvasProp;
  canvasDimensions: Size;
  gridEnabled: boolean;
  onUpdateProp: (id: string, updates: Partial<CanvasProp>) => void;
  onRemoveProp: (id: string) => void;
}

/**
 * PropElement - Draggable/resizable emoji prop on canvas
 *
 * Sizes are stored as "reference pixels" (at REFERENCE_CANVAS_WIDTH).
 * A canvasScaleFactor is applied at render time so props scale proportionally
 * with the canvas, matching the background's responsive behaviour.
 */
export function PropElement({ prop, canvasDimensions, gridEnabled, onUpdateProp, onRemoveProp }: PropElementProps) {
  const position = prop.position || { x: 50, y: 50 };

  // Stored size is in reference-canvas pixels (at REFERENCE_CANVAS_WIDTH).
  // Scale to actual canvas dimensions so the prop follows the background.
  const storedSize = prop.size || { width: ELEMENT_SIZES.PROP.width, height: ELEMENT_SIZES.PROP.height };
  const canvasScaleFactor = canvasDimensions.width > 0
    ? canvasDimensions.width / REFERENCE_CANVAS_WIDTH
    : 1;
  const displayWidth  = storedSize.width  * canvasScaleFactor;
  const displayHeight = storedSize.height * canvasScaleFactor;

  // Convert percentage position to pixels (accounting for center transform)
  const pixelX = percentToPixels(position.x, canvasDimensions.width) - (displayWidth / 2);
  const pixelY = percentToPixels(position.y, canvasDimensions.height) - (displayHeight / 2);

  // Grid settings - snap to grid when grid is enabled
  const gridSize = CANVAS_CONFIG.GRID_SIZE;
  const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

  return (
    <Rnd
      key={prop.id}
      size={{ width: displayWidth, height: displayHeight }}
      position={{ x: pixelX, y: pixelY }}
      onDragStop={(_e, d) => {
        // Convert pixel position back to percentage (accounting for center transform)
        const centerX = d.x + (displayWidth / 2);
        const centerY = d.y + (displayHeight / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdateProp(prop.id, {
          position: { x: newPercentX, y: newPercentY }
        });
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        const newDisplayWidth  = parseInt(ref.style.width);
        const newDisplayHeight = parseInt(ref.style.height);

        // Divide by canvasScaleFactor to store canvas-independent reference pixels
        const newStoredWidth  = newDisplayWidth  / canvasScaleFactor;
        const newStoredHeight = newDisplayHeight / canvasScaleFactor;

        // Convert pixel position back to percentage
        const centerX = position.x + (newDisplayWidth / 2);
        const centerY = position.y + (newDisplayHeight / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdateProp(prop.id, {
          position: { x: newPercentX, y: newPercentY },
          size: { width: newStoredWidth, height: newStoredHeight }
        });
      }}
      dragGrid={dragGrid as [number, number]}
      resizeGrid={dragGrid as [number, number]}
      lockAspectRatio={true}
      style={{ zIndex: Z_INDEX.CANVAS_PROPS }}
      className="group"
      enableResizing={RESIZING_CONFIG}
    >
      <div className="w-full h-full cursor-move relative">
        {/* Emoji Prop */}
        <div className="w-full h-full flex items-center justify-center text-[4rem] group-hover:scale-105 transition-transform select-none">
          {prop.emoji}
        </div>

        {/* Delete button (on hover) */}
        <button
          onClick={() => {
            const confirmed = window.confirm('Remove this prop from the scene?');
            if (confirmed) {
              onRemoveProp(prop.id);
            }
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold shadow-lg"
          aria-label="Remove prop"
          title="Remove prop"
        >
          ×
        </button>
      </div>
    </Rnd>
  );
}
