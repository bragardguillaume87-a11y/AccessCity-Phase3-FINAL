import React from 'react';

/**
 * Supported drag types for visual feedback
 */
export type DragType = 'background' | 'character' | 'textbox' | 'prop' | 'emoji';

export interface DropZoneIndicatorProps {
  isDragOver: boolean;
  dragType?: DragType | null;
}

/**
 * Messages displayed for each drag type
 */
const DRAG_MESSAGES: Record<DragType, string> = {
  background: "Déposez l'arrière-plan ici",
  character: "Déposez le personnage ici",
  textbox: "Déposez la zone de texte ici",
  prop: "Déposez l'accessoire ici",
  emoji: "Déposez l'emoji ici"
};

/**
 * DropZoneIndicator - Visual feedback when dragging over canvas
 *
 * Displays a contextual message based on the type of item being dragged.
 * Falls back to a generic message if type is unknown.
 *
 * @param isDragOver - Whether an item is currently being dragged over the zone
 * @param dragType - Type of item being dragged (background, character, textbox, etc.)
 */
export function DropZoneIndicator({ isDragOver, dragType }: DropZoneIndicatorProps) {
  if (!isDragOver) return null;

  const message = dragType ? DRAG_MESSAGES[dragType] : "Déposez l'élément ici";

  return (
    <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center">
      <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl font-medium">
        {message}
      </div>
    </div>
  );
}
