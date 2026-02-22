
import { Rnd } from 'react-rnd';
import { percentToPixels, pixelsToPercent, RESIZING_CONFIG } from '@/utils/canvasPositioning';
import { Z_INDEX } from '@/utils/zIndexLayers';
import { CANVAS_CONFIG, ELEMENT_SIZES, ELEMENT_DEFAULTS, REFERENCE_CANVAS_WIDTH } from '@/config/canvas';
import type { Position, Size } from '@/types';

// Extended TextBox interface for canvas text boxes
export interface CanvasTextBox {
  id: string;
  text: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  position?: Position;
  size?: Size;
}

export interface TextBoxElementProps {
  textBox: CanvasTextBox;
  canvasDimensions: Size;
  gridEnabled: boolean;
  onUpdateTextBox: (id: string, updates: Partial<CanvasTextBox>) => void;
  onRemoveTextBox: (id: string) => void;
}

/**
 * TextBoxElement - Draggable/resizable text box with editable content
 *
 * Sizes and fontSize are stored as "reference pixels" (at REFERENCE_CANVAS_WIDTH).
 * A canvasScaleFactor is applied at render time so the box and its text scale
 * proportionally with the canvas, matching the background's responsive behaviour.
 */
export function TextBoxElement({ textBox, canvasDimensions, gridEnabled, onUpdateTextBox, onRemoveTextBox }: TextBoxElementProps) {
  const position = textBox.position || { x: 50, y: 50 };

  // Stored size is in reference-canvas pixels (at REFERENCE_CANVAS_WIDTH).
  // Scale to actual canvas dimensions so the textbox follows the background.
  const storedSize = textBox.size || { width: ELEMENT_SIZES.TEXTBOX.width, height: ELEMENT_SIZES.TEXTBOX.height };
  const canvasScaleFactor = canvasDimensions.width > 0
    ? canvasDimensions.width / REFERENCE_CANVAS_WIDTH
    : 1;
  const displayWidth  = storedSize.width  * canvasScaleFactor;
  const displayHeight = storedSize.height * canvasScaleFactor;

  // Font size also stored in reference pixels — scale to canvas
  const displayFontSize = (textBox.fontSize || ELEMENT_DEFAULTS.FONT_SIZE) * canvasScaleFactor;

  // Convert percentage position to pixels (accounting for center transform)
  const pixelX = percentToPixels(position.x, canvasDimensions.width) - (displayWidth / 2);
  const pixelY = percentToPixels(position.y, canvasDimensions.height) - (displayHeight / 2);

  // Grid settings - snap to grid when grid is enabled
  const gridSize = CANVAS_CONFIG.GRID_SIZE;
  const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

  return (
    <Rnd
      key={textBox.id}
      size={{ width: displayWidth, height: displayHeight }}
      position={{ x: pixelX, y: pixelY }}
      onDragStop={(_e, d) => {
        // Convert pixel position back to percentage (accounting for center transform)
        const centerX = d.x + (displayWidth / 2);
        const centerY = d.y + (displayHeight / 2);
        const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
        const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

        onUpdateTextBox(textBox.id, {
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

        onUpdateTextBox(textBox.id, {
          position: { x: newPercentX, y: newPercentY },
          size: { width: newStoredWidth, height: newStoredHeight }
        });
      }}
      dragGrid={dragGrid as [number, number]}
      resizeGrid={dragGrid as [number, number]}
      style={{ zIndex: Z_INDEX.CANVAS_TEXTBOXES }}
      className="group"
      enableResizing={RESIZING_CONFIG}
    >
      <div className="w-full h-full cursor-move relative bg-white/90 backdrop-blur-sm border-2 border-border rounded-lg p-3 shadow-lg hover:border-blue-500 transition-all">
        {/* ContentEditable Text */}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const newText = e.currentTarget.textContent || '';
            if (newText !== textBox.text) {
              onUpdateTextBox(textBox.id, { text: newText });
            }
          }}
          className="w-full h-full outline-none overflow-auto"
          style={{
            fontSize: `${displayFontSize}px`,
            fontWeight: textBox.fontWeight || 'normal',
            color: textBox.color || '#1e293b',
            textAlign: (textBox.textAlign || 'left') as 'left' | 'center' | 'right' | 'justify'
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
