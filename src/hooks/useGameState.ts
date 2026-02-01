import { useCallback, useMemo, useState, startTransition } from 'react';
import { TIMING } from '@/config/timing';
import type { Scene, Dialogue, DialogueChoice, GameStats, DiceCheck, DiceCheckBranch } from '@/types';

/**
 * History entry for game state tracking
 */
interface HistoryEntry {
  sceneId: string;
  dialogueId: string | null;
  choiceId: string | null;
  statsSnapshot: GameStats;
  timestamp: number;
}


/**
 * Current state of dice rolling
 */
interface DiceState {
  rolling: boolean;
  lastRoll: number | null;
  lastResult: 'success' | 'failure' | null;
}

/**
 * Options for initializing useGameState
 */
interface UseGameStateOptions {
  scenes: Scene[];
  initialSceneId: string;
  initialStats?: GameStats;
}

/**
 * Return type for useGameState hook
 */
interface UseGameStateReturn {
  currentScene: Scene | null;
  currentDialogue: Dialogue | null;
  stats: GameStats;
  history: HistoryEntry[];
  isPaused: boolean;
  readingSpeed: number;
  diceState: DiceState;
  goToScene: (sceneId: string, dialogueId?: string | null) => void;
  goToNextDialogue: () => void;
  chooseOption: (choice: DialogueChoice) => Promise<void>;
  jumpToHistoryIndex: (index: number) => void;
  setReadingSpeed: (speed: number) => void;
  setIsPaused: (paused: boolean) => void;
}

const DEFAULT_STATS: GameStats = {};

/**
 * Game State Management Hook
 *
 * Manages the complete game state including:
 * - Current scene and dialogue
 * - Player statistics
 * - History and time travel
 * - Dice rolling mechanics
 *
 * @param options - Configuration options
 * @returns Game state and control functions
 */
export function useGameState({
  scenes,
  initialSceneId,
  initialStats = DEFAULT_STATS
}: UseGameStateOptions): UseGameStateReturn {
  const [currentSceneId, setCurrentSceneId] = useState<string>(initialSceneId);
  const [currentDialogueId, setCurrentDialogueId] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>(initialStats);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [readingSpeed, setReadingSpeed] = useState<number>(1);
  const [diceState, setDiceState] = useState<DiceState>({
    rolling: false,
    lastRoll: null,
    lastResult: null
  });

  const currentScene = useMemo(
    () => scenes.find((s) => s.id === currentSceneId) || null,
    [scenes, currentSceneId]
  );

  const currentDialogue = useMemo(() => {
    if (!currentScene?.dialogues?.length) return null;
    if (!currentDialogueId) return currentScene.dialogues[0];
    return currentScene.dialogues.find((d) => d.id === currentDialogueId) || currentScene.dialogues[0];
  }, [currentScene, currentDialogueId]);

  const goToScene = useCallback((sceneId: string, dialogueId: string | null = null) => {
    setCurrentSceneId(sceneId);
    setCurrentDialogueId(dialogueId);
  }, []);

  const applyStatsDelta = useCallback((delta: GameStats = {}) => {
    // REACT 19: Mark stats update as non-urgent (can be interrupted)
    startTransition(() => {
      setStats((prev) => {
        const updated = { ...prev };
        Object.keys(delta).forEach((key) => {
          updated[key] = (prev[key] ?? 0) + (delta[key] ?? 0);
        });
        return updated;
      });
    });
  }, []);

  const addToHistory = useCallback(({ sceneId, dialogueId, choiceId }: {
    sceneId: string;
    dialogueId: string | null;
    choiceId: string | null;
  }) => {
    // REACT 19: History updates are non-urgent (can be deferred)
    startTransition(() => {
      setHistory((prev) => [...prev, {
        sceneId,
        dialogueId,
        choiceId,
        statsSnapshot: stats,
        timestamp: Date.now()
      }]);
    });
  }, [stats]);

  const jumpToHistoryIndex = useCallback((index: number) => {
    const item = history[index];
    if (!item) return;
    // REACT 19: Time-travel updates are non-urgent (can be deferred)
    startTransition(() => {
      setCurrentSceneId(item.sceneId);
      setCurrentDialogueId(item.dialogueId);
      setStats(item.statsSnapshot);
      setHistory(history.slice(0, index + 1));
      setDiceState({ rolling: false, lastRoll: null, lastResult: null });
    });
  }, [history]);

  const goToNextDialogue = useCallback(() => {
    if (!currentScene?.dialogues || !currentDialogue) return;

    // If this dialogue is a response (isResponse: true), skip to the next non-response dialogue (convergence point)
    if (currentDialogue.isResponse) {
      const currentIndex = currentScene.dialogues.findIndex((d) => d.id === currentDialogue.id);
      // Find the next dialogue that is NOT a response
      for (let i = currentIndex + 1; i < currentScene.dialogues.length; i++) {
        if (!currentScene.dialogues[i].isResponse) {
          setCurrentDialogueId(currentScene.dialogues[i].id);
          return;
        }
      }
      // No convergence point found - end of scene
      return;
    }

    // Explicit convergence: dialogue has a nextDialogueId (e.g. manual linking)
    if (currentDialogue.nextDialogueId) {
      const target = currentScene.dialogues.find((d) => d.id === currentDialogue.nextDialogueId);
      if (target) {
        setCurrentDialogueId(target.id);
        return;
      }
    }

    // Default: advance linearly
    const currentIndex = currentScene.dialogues.findIndex((d) => d.id === currentDialogue.id);
    if (currentIndex === -1 || currentIndex === currentScene.dialogues.length - 1) return;
    setCurrentDialogueId(currentScene.dialogues[currentIndex + 1].id);
  }, [currentScene, currentDialogue]);

  const resolveDiceCheck = useCallback(async (diceCheck: DiceCheck): Promise<'success' | 'failure'> => {
    setDiceState({ rolling: true, lastRoll: null, lastResult: null });
    await new Promise((r) => setTimeout(r, TIMING.DICE_ROLL_DURATION));

    const roll = Math.floor(Math.random() * 20) + 1;
    const statValue = stats[diceCheck.stat] ?? 0;
    const totalRoll = roll + statValue;
    const success = totalRoll >= diceCheck.difficulty;
    const result = success ? 'success' : 'failure';

    setDiceState({ rolling: false, lastRoll: totalRoll, lastResult: result });
    return result;
  }, [stats]);

  const chooseOption = useCallback(async (choice: DialogueChoice): Promise<void> => {
    if (!currentScene || !currentDialogue || !choice) return;

    addToHistory({
      sceneId: currentScene.id,
      dialogueId: currentDialogue.id,
      choiceId: choice.id
    });

    // Apply effects from choice (new format: effects array)
    if (choice.effects && Array.isArray(choice.effects)) {
      const delta: GameStats = {};
      choice.effects.forEach(effect => {
        if (effect.operation === 'set') {
          delta[effect.variable] = effect.value - (stats[effect.variable] ?? 0);
        } else if (effect.operation === 'add') {
          delta[effect.variable] = effect.value;
        }
      });
      applyStatsDelta(delta);
    }

    // Handle dice check (now properly typed in DialogueChoice)
    let branch: DiceCheckBranch | null = null;
    if (choice.diceCheck) {
      const result = await resolveDiceCheck(choice.diceCheck);
      branch = choice.diceCheck[result] || null;
    }

    // Determine navigation target
    const target = branch || choice;

    // Navigate based on target (all properties now properly typed)
    if (target.nextSceneId) {
      goToScene(target.nextSceneId, target.nextDialogueId || null);
    } else if (target.nextDialogueId) {
      setCurrentDialogueId(target.nextDialogueId);
    } else {
      goToNextDialogue();
    }
  }, [currentScene, currentDialogue, stats, addToHistory, applyStatsDelta, resolveDiceCheck, goToNextDialogue, goToScene]);

  return {
    currentScene,
    currentDialogue,
    stats,
    history,
    isPaused,
    readingSpeed,
    diceState,
    goToScene,
    goToNextDialogue,
    chooseOption,
    jumpToHistoryIndex,
    setReadingSpeed,
    setIsPaused
  };
}
