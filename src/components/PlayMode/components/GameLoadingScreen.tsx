import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * GameLoadingScreen - Loading screen for game initialization
 *
 * Displays a centered spinner with loading message while
 * the game engine initializes.
 *
 * @example
 * ```tsx
 * if (isLoading) return <GameLoadingScreen />;
 * ```
 */
export function GameLoadingScreen(): React.JSX.Element {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
        <p className="text-slate-400">Chargement de la scene...</p>
      </div>
    </div>
  );
}
