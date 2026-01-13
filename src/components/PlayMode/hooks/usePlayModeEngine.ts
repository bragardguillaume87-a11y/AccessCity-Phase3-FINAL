import { useState, useEffect, useCallback } from 'react';
import type { Scene, Dialogue, DialogueChoice, GameStats } from '@/types';
import { logger } from '@/utils/logger';
// @ts-expect-error - StageDirector.simple.js is a JS file without types
import StageDirector from '@/core/StageDirector.simple';
// @ts-expect-error - simpleSound.js is a JS file without types
import { playSound, toggleMute as toggleSoundMute, isSoundMuted } from '@/utils/simpleSound';
import { TIMING } from '@/config/timing';

/**
 * Props for usePlayModeEngine hook
 */
export interface UsePlayModeEngineProps {
  scenes: Scene[];
  selectedSceneIndex: number;
  onExit: () => void;
}

/**
 * Return type for usePlayModeEngine hook
 */
export interface UsePlayModeEngineReturn {
  // State
  director: typeof StageDirector | null;
  currentScene: Scene | null;
  currentDialogue: Dialogue | null;
  isEnded: boolean;
  variables: GameStats;
  showConfetti: boolean;
  isLoading: boolean;
  isMuted: boolean;

  // Handlers
  handleChoice: (choice: DialogueChoice) => void;
  handleMuteToggle: () => void;
}

/**
 * usePlayModeEngine - Manage game engine logic and state
 *
 * This hook centralizes all game engine logic:
 * - StageDirector initialization and management
 * - Game state tracking (variables, current scene/dialogue)
 * - Choice handling with effects and sound
 * - Game end detection with confetti
 * - Sound mute/unmute
 *
 * @param props - Configuration
 * @returns Game state and handlers
 *
 * @example
 * ```tsx
 * const engine = usePlayModeEngine({
 *   scenes,
 *   selectedSceneIndex: 0,
 *   onExit
 * });
 *
 * if (engine.isLoading) return <GameLoadingScreen />;
 * if (engine.isEnded) return <GameEndScreen {...engine} />;
 * return <GamePlayScreen {...engine} />;
 * ```
 */
export function usePlayModeEngine({
  scenes,
  selectedSceneIndex,
  onExit
}: UsePlayModeEngineProps): UsePlayModeEngineReturn {
  const [director, setDirector] = useState<typeof StageDirector | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [variables, setVariables] = useState<GameStats>({
    Empathie: 50,
    Autonomie: 50,
    Confiance: 50
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(isSoundMuted());

  /**
   * Update current game state from director
   */
  const updateState = useCallback(() => {
    if (!director) return;

    const scene = director.getCurrentScene();
    const dialogue = director.getCurrentDialogue();

    setCurrentScene(scene);
    setCurrentDialogue(dialogue);
    setVariables({ ...director.gameState });
    setIsEnded(director.isGameOver());
  }, [director]);

  /**
   * Initialize StageDirector and game state
   */
  useEffect(() => {
    if (scenes.length === 0) return;

    // Extract all dialogues from all scenes
    const allDialogues = scenes.flatMap(scene => scene.dialogues || []);

    // Check if there are dialogues
    if (allDialogues.length === 0) {
      logger.warn('[usePlayModeEngine] No dialogues in scenario');
      alert("Ce scenario n'a pas de dialogues. Ajoutez-en dans l'editeur avant de jouer !");
      setIsLoading(false);
      setTimeout(onExit, 100);
      return;
    }

    // Initialize game state and director
    const gameState: GameStats = { Empathie: 50, Autonomie: 50, Confiance: 50 };
    const newDirector = new StageDirector(scenes, allDialogues, gameState, selectedSceneIndex);
    setDirector(newDirector);

    // Initialize current state immediately
    const scene = newDirector.getCurrentScene();
    const dialogue = newDirector.getCurrentDialogue();

    // Check if dialogue exists
    if (!dialogue) {
      logger.warn('[usePlayModeEngine] No dialogue for this scene');
      alert("Cette scene n'a pas de dialogues. Ajoutez-en dans l'editeur avant de jouer !");
      setIsLoading(false);
      setTimeout(onExit, 100);
      return;
    }

    setCurrentScene(scene);
    setCurrentDialogue(dialogue);
    setVariables({ ...newDirector.gameState });
    setIsEnded(newDirector.isGameOver());
    setIsLoading(false);

    // Play scene change sound
    playSound('/sounds/scene-change.mp3', 0.3);
  }, [scenes, selectedSceneIndex, onExit]);

  /**
   * Handle dialogue choice selection
   *
   * Flow:
   * 1. Play choice sound
   * 2. Apply choice via director
   * 3. Play stat change sounds based on effects
   * 4. Check if game ended
   * 5. Play victory/game-over sound + confetti if ended
   * 6. Update state
   */
  const handleChoice = useCallback(
    (choice: DialogueChoice) => {
      if (!director) return;

      // Play choice sound
      playSound('/sounds/choice.mp3', 0.5);
      director.makeChoice(choice);

      // Play effect sounds
      if (choice.effects) {
        choice.effects.forEach(effect => {
          if (effect.value > 0) playSound('/sounds/stat-up.mp3', 0.4);
          if (effect.value < 0) playSound('/sounds/stat-down.mp3', 0.4);
        });
      }

      // Check if game ended
      const ended = director.isGameOver();
      if (ended) {
        const avgScore =
          (director.gameState.Empathie +
            director.gameState.Autonomie +
            director.gameState.Confiance) /
          3;

        if (avgScore >= 60) {
          playSound('/sounds/victory.mp3', 0.6);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), TIMING.CONFETTI_DURATION);
        } else {
          playSound('/sounds/game-over.mp3', 0.5);
        }
      } else {
        playSound('/sounds/scene-change.mp3', 0.3);
      }

      updateState();
    },
    [director, updateState]
  );

  /**
   * Toggle sound mute/unmute
   */
  const handleMuteToggle = useCallback(() => {
    const newMuted = toggleSoundMute();
    setIsMuted(newMuted);
  }, []);

  return {
    // State
    director,
    currentScene,
    currentDialogue,
    isEnded,
    variables,
    showConfetti,
    isLoading,
    isMuted,

    // Handlers
    handleChoice,
    handleMuteToggle
  };
}
