import React from 'react';
import { Button } from '@/components/ui/button';

export interface QuickActionsBarProps {
  sceneId: string;
  onAddDialogue: () => void;
  onSetBackground: () => void;
}

/**
 * QuickActionsBar - Bottom action bar with scene ID and quick actions
 */
export function QuickActionsBar({ sceneId, onAddDialogue, onSetBackground }: QuickActionsBarProps) {
  return (
    <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Scene ID: <span className="text-slate-400 font-mono">{sceneId}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="gaming-success"
            size="sm"
            onClick={onAddDialogue}
            aria-label="Ajouter un dialogue à la scène"
          >
            + Ajouter dialogue
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onSetBackground}
            aria-label="Définir l'arrière-plan de la scène"
          >
            Choisir décor
          </Button>
        </div>
      </div>
    </div>
  );
}
