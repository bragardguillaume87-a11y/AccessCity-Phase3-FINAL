import { useScenesStore, useCharactersStore } from '../stores/index';
import type { Character } from '@/types';

// Hook
import { usePlayModeEngine } from './PlayMode/hooks/usePlayModeEngine';

// Components
import { GameLoadingScreen } from './PlayMode/components/GameLoadingScreen';
import { GameEndScreen } from './PlayMode/components/GameEndScreen';
import { GamePlayScreen } from './PlayMode/components/GamePlayScreen';

/**
 * Props for PlayMode component
 */
interface PlayModeProps {
  /** Callback to exit play mode */
  onExit: () => void;
  /** Initial scene index to start from (default: 0) */
  selectedSceneIndex?: number;
}

/**
 * PlayMode - Main game mode component
 *
 * Orchestrates the game flow using:
 * - usePlayModeEngine hook for game logic
 * - GameLoadingScreen for initialization
 * - GameEndScreen for game completion
 * - GamePlayScreen for active gameplay
 *
 * Refactored to use custom hook and sub-components for better maintainability.
 */
export default function PlayMode({
  onExit,
  selectedSceneIndex = 0
}: PlayModeProps): React.JSX.Element {
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);

  // Game engine hook (manages StageDirector, state, sounds, etc.)
  const engine = usePlayModeEngine({
    scenes,
    selectedSceneIndex,
    onExit
  });

  // Loading state
  if (engine.isLoading) {
    return <GameLoadingScreen />;
  }

  // Game ended state
  if (engine.isEnded) {
    return (
      <GameEndScreen
        variables={engine.variables}
        showConfetti={engine.showConfetti}
        onExit={onExit}
      />
    );
  }

  // Active gameplay state
  // Find character by speaker ID
  const character: Character | undefined = engine.currentDialogue?.speaker
    ? characters.find(c => c.id === engine.currentDialogue?.speaker)
    : undefined;

  return (
    <GamePlayScreen
      currentDialogue={engine.currentDialogue}
      character={character}
      variables={engine.variables}
      isMuted={engine.isMuted}
      onChoice={engine.handleChoice}
      onMuteToggle={engine.handleMuteToggle}
      onExit={onExit}
    />
  );
}
