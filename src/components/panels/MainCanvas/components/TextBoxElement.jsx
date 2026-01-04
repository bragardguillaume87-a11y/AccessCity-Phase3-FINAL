import PropTypes from 'prop-types';
import { Rnd } from 'react-rnd';
import { percentToPixels, pixelsToPercent, RESIZING_CONFIG } from '@/utils/canvasPositioning';
import { Z_INDEX } from '@/utils/zIndexLayers.js';

/**
 * TextBoxElement - Draggable/resizable text box with editable content
 */
export function TextBoxElement({ textBox, canvasDimensions, gridEnabled, onUpdateTextBox, onRemoveTextBox }) {
  const position = textBox.position || { x: 50, y: 50 };
  const size = textBox.size || { width: 300, height: 100 };

  // Convert percentage position to pixels (accounting for center transform)
  const pixelX = percentToPixels(position.x, canvasDimensions.width) - (size.width / 2);
  const pixelY = percentToPixels(position.y, canvasDimensions.height) - (size.height / 2);

  // Grid settings - snap to grid when grid is enabled
  const gridSize = 24;
  const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

  return (
    <Rnd
      key={textBox.id}
      size={{ width: size.width, height: size.height }}
      position={{ x: pixelX, y: pixelY }}
      onDragStop={(e, d) => {
        // Convert pixel position back to percentage (accounting for center transform)
        const centerX = d.x + (size.width / 2);
        const centerY = d.y + (size.height / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdateTextBox(textBox.id, {
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

        onUpdateTextBox(textBox.id, {
          position: { x: newPercentX, y: newPercentY },
          size: { width: newWidth, height: newHeight }
        });
      }}
      dragGrid={dragGrid}
      resizeGrid={dragGrid}
      style={{ zIndex: Z_INDEX.CANVAS_TEXTBOXES }}
      className="group"
      enableResizing={RESIZING_CONFIG}
    >
      <div className="w-full h-full cursor-move relative bg-white/90 backdrop-blur-sm border-2 border-slate-400 rounded-lg p-3 shadow-lg hover:border-blue-500 transition-all">
        {/* ContentEditable Text */}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const newText = e.currentTarget.textContent;
            if (newText !== textBox.text) {
              onUpdateTextBox(textBox.id, { text: newText });
            }
          }}
          className="w-full h-full outline-none overflow-auto"
          style={{
            fontSize: `${textBox.fontSize || 16}px`,
            fontWeight: textBox.fontWeight || 'normal',
            color: textBox.color || '#1e293b',
            textAlign: textBox.textAlign || 'left'
          }}
        >
          {textBox.text}
        </div>

        {/* Delete button (on hover) */}
        <button
          onClick={() => {
            const confirmed = window.confirm('Remove this text box from the scene?');
            if (confirmed) {
              onRemoveTextBox(textBox.id);
            }
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold shadow-lg"
          aria-label="Remove text box"
          title="Remove text box"
        >
          ×
        </button>
      </div>
    </Rnd>
  );
}

TextBoxElement.propTypes = {
  textBox: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    fontSize: PropTypes.number,
    fontWeight: PropTypes.string,
    color: PropTypes.string,
    textAlign: PropTypes.string,
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
  onUpdateTextBox: PropTypes.func.isRequired,
  onRemoveTextBox: PropTypes.func.isRequired
};
