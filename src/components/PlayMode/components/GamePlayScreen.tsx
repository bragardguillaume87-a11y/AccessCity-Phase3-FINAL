import React from 'react';
import type { Dialogue, DialogueChoice, Character, GameStats } from '@/types';
import { IconByName } from '@/components/IconByName';
import { Heart, Zap, Shield, Volume2, VolumeX } from 'lucide-react';

/**
 * Props for GamePlayScreen component
 */
export interface GamePlayScreenProps {
  /** Current dialogue */
  currentDialogue: Dialogue | null;
  /** Current character (speaker) */
  character: Character | undefined;
  /** Game statistics (Empathie, Autonomie, Confiance) */
  variables: GameStats;
  /** Whether sound is muted */
  isMuted: boolean;
  /** Callback when choice is selected */
  onChoice: (choice: DialogueChoice) => void;
  /** Callback to toggle mute */
  onMuteToggle: () => void;
  /** Callback to exit game */
  onExit: () => void;
}

/**
 * GamePlayScreen - Main gameplay interface
 *
 * Features:
 * - Fixed header with stats (Empathie, Autonomie, Confiance) and controls (Quit, Mute)
 * - Character display with sprite and info
 * - Dialogue text display
 * - Interactive choice buttons
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <GamePlayScreen
 *   currentDialogue={currentDialogue}
 *   character={character}
 *   variables={variables}
 *   isMuted={isMuted}
 *   onChoice={handleChoice}
 *   onMuteToggle={handleMuteToggle}
 *   onExit={onExit}
 * />
 * ```
 */
export function GamePlayScreen({
  currentDialogue,
  character,
  variables,
  isMuted,
  onChoice,
  onMuteToggle,
  onExit
}: GamePlayScreenProps): React.JSX.Element {
  return (
    <div className="w-full h-full bg-gradient-to-br from-background to-card flex flex-col">
      {/* Header avec variables - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-fixed-v2 bg-background/90 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="px-4 py-2 bg-card hover:bg-muted text-foreground rounded-lg transition-colors flex items-center gap-2"
            >
              <IconByName name="x" className="w-4 h-4" />
              Quitter
            </button>

            {/* Bouton Mute */}
            <button
              onClick={onMuteToggle}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-card hover:bg-muted text-foreground'
              }`}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-5 h-5" />
                  <span className="text-sm font-medium">Muet</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Son</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-foreground font-medium">Empathie:</span>
              <span className="text-white font-bold">{variables.Empathie}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span className="text-foreground font-medium">Autonomie:</span>
              <span className="text-white font-bold">{variables.Autonomie}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-foreground font-medium">Confiance:</span>
              <span className="text-white font-bold">{variables.Confiance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de jeu */}
      <div className="flex-1 flex items-center justify-center p-8 pt-20 overflow-auto">
        <div className="max-w-4xl w-full">
          {/* Carte de dialogue */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 border border-border shadow-2xl">
            {/* Personnage */}
            {character && (
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="text-5xl">{character.sprites?.neutral || '👤'}</div>
                <div>
                  <h3 className="text-xl font-bold text-white">{character.name}</h3>
                  <p className="text-muted-foreground text-sm">{character.description}</p>
                </div>
              </div>
            )}

            {/* Texte du dialogue */}
            <div className="mb-8">
              <p className="text-foreground text-lg leading-relaxed">
                {currentDialogue?.text || 'Aucun dialogue disponible'}
              </p>
            </div>

            {/* Choix */}
            {currentDialogue?.choices && currentDialogue.choices.length > 0 && (
              <div className="space-y-3">
                {currentDialogue.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => onChoice(choice)}
                    className="w-full text-left p-4 bg-muted/50 hover:bg-purple-600/30 border-2 border-border hover:border-purple-500 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600 group-hover:bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-foreground group-hover:text-white transition-colors">
                        {choice.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
