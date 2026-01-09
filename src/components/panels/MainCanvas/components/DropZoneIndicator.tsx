import React from 'react';

export interface DropZoneIndicatorProps {
  isDragOver: boolean;
}

/**
 * DropZoneIndicator - Visual feedback when dragging over canvas
 */
export function DropZoneIndicator({ isDragOver }: DropZoneIndicatorProps) {
  if (!isDragOver) return null;

  return (
    <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center">
      <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl font-medium">
        Déposez le personnage ici
      </div>
    </div>
  );
}
