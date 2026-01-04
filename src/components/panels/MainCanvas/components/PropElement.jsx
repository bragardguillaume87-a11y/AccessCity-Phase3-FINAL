import PropTypes from 'prop-types';
import { Rnd } from 'react-rnd';
import { percentToPixels, pixelsToPercent, RESIZING_CONFIG } from '@/utils/canvasPositioning';
import { Z_INDEX } from '@/utils/zIndexLayers.js';

/**
 * PropElement - Draggable/resizable emoji prop on canvas
 */
export function PropElement({ prop, canvasDimensions, gridEnabled, onUpdateProp, onRemoveProp }) {
  const position = prop.position || { x: 50, y: 50 };
  const size = prop.size || { width: 80, height: 80 };

  // Convert percentage position to pixels (accounting for center transform)
  const pixelX = percentToPixels(position.x, canvasDimensions.width) - (size.width / 2);
  const pixelY = percentToPixels(position.y, canvasDimensions.height) - (size.height / 2);

  // Grid settings - snap to grid when grid is enabled
  const gridSize = 24;
  const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

  return (
    <Rnd
      key={prop.id}
      size={{ width: size.width, height: size.height }}
      position={{ x: pixelX, y: pixelY }}
      onDragStop={(e, d) => {
        // Convert pixel position back to percentage (accounting for center transform)
        const centerX = d.x + (size.width / 2);
        const centerY = d.y + (size.height / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdateProp(prop.id, {
          position: { x: newPercentX, y: newPercentY }
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newWidth = parseInt(ref.style.width);
        const newHeight = parseInt(ref.style.height);

        // Convert pixel position back to percentage
        const centerX = position.x + (newWidth / 2);
        const centerY = position.y + (newHeight / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdateProp(prop.id, {
          position: { x: newPercentX, y: newPercentY },
          size: { width: newWidth, height: newHeight }
        });
      }}
      dragGrid={dragGrid}
      resizeGrid={dragGrid}
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

PropElement.propTypes = {
  prop: PropTypes.shape({
    id: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
    size: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number
    })
  }).isRequired,
  canvasDimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  }).isRequired,
  gridEnabled: PropTypes.bool.isRequired,
  onUpdateProp: PropTypes.func.isRequired,
  onRemoveProp: PropTypes.func.isRequired
};
