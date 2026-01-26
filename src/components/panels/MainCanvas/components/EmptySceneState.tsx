import React from 'react';

/**
 * EmptySceneState - Displayed when no scene is selected
 */
export function EmptySceneState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-muted-foreground max-w-md">
        <svg className="w-20 h-20 mx-auto mb-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <h2 className="text-xl font-semibold text-muted-foreground mb-2">Aucune scène sélectionnée</h2>
        <p className="text-sm text-muted-foreground">
          Sélectionnez une scène dans l'Explorateur pour commencer
        </p>
      </div>
    </div>
  );
}
