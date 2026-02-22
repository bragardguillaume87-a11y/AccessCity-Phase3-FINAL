import { useCallback, useMemo, useState, startTransition, useRef, useEffect } from 'react';
import { TIMING } from '@/config/timing';
import { STAT_BOUNDS, DICE } from '@/config/gameConstants';
import type { Scene, Dialogue, DialogueChoice, GameStats, DiceCheckBranch, Condition } from '@/types';

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
  isAtLastDialogue: boolean;
  goToScene: (sceneId: string, dialogueId?: string | null) => void;
  goToNextDialogue: () => void;
  chooseOption: (choice: DialogueChoice) => Promise<void>;
  jumpToHistoryIndex: (index: number) => void;
  setReadingSpeed: (speed: number) => void;
  setIsPaused: (paused: boolean) => void;
}

const DEFAULT_STATS: GameStats = {};

/**
 * Evaluate dialogue conditions against current stats.
 * Returns true if all conditions pass (or if no conditions).
 */
function evaluateConditions(conditions: Condition[] | undefined, stats: GameStats): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every(cond => {
    const value = stats[cond.variable] ?? 0;
    switch (cond.operator) {
      case '>=': return value >= cond.value;
      case '<=': return value <= cond.value;
      case '>':  return value > cond.value;
      case '<':  return value < cond.value;
      case '==': return value === cond.value;
      case '!=': return value !== cond.value;
      default:   return true;
    }
  });
}

/**
 * Clamp a stat value between 0 and 100.
 */
function clampStat(value: number): number {
  return Math.max(STAT_BOUNDS.MIN, Math.min(STAT_BOUNDS.MAX, value));
}

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

  // ── Unmount guard (Bug 3 : chooseOption async sans garde) ──────────────────
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const currentScene = useMemo(
    () => scenes.find((s) => s.id === currentSceneId) || null,
    [scenes, currentSceneId]
  );

  const currentDialogue = useMemo(() => {
    if (!currentScene?.dialogues?.length) return null;
    const dialogues = currentScene.dialogues;

    // Find target dialogue (by ID or first)
    const target = currentDialogueId
      ? dialogues.find((d) => d.id === currentDialogueId)
      : dialogues[0];

    // If target passes conditions, use it
    if (target && evaluateConditions(target.conditions, stats)) return target;

    // Otherwise find the next valid dialogue after target
    const targetIndex = target ? dialogues.indexOf(target) : 0;
    for (let i = targetIndex + 1; i < dialogues.length; i++) {
      if (evaluateConditions(dialogues[i].conditions, stats)) return dialogues[i];
    }

    // Fallback: return target even if conditions fail (to avoid blank screen)
    return target || dialogues[0];
  }, [currentScene, currentDialogueId, stats]);

  const goToScene = useCallback((sceneId: string, dialogueId: string | null = null) => {
    setCurrentSceneId(sceneId);
    setCurrentDialogueId(dialogueId);
  }, []);

  /**
   * Compute new stats after applying effects synchronously (for dice checks & history).
   * Returns the delta object for React state update.
   */
  const computeEffectsDelta = useCallback((effects: DialogueChoice['effects'], currentStats: GameStats): GameStats => {
    const delta: GameStats = {};
    if (!effects || !Array.isArray(effects)) return delta;
    effects.forEach(effect => {
      const current = currentStats[effect.variable] ?? 0;
      if (effect.operation === 'set') {
        delta[effect.variable] = effect.value - current;
      } else if (effect.operation === 'multiply') {
        delta[effect.variable] = Math.round(current * effect.value) - current;
      } else {
        delta[effect.variable] = effect.value;
      }
    });
    return delta;
  }, []);

  const applyStatsDelta = useCallback((delta: GameStats = {}) => {
    startTransition(() => {
      setStats((prev) => {
        const updated = { ...prev };
        Object.keys(delta).forEach((key) => {
          updated[key] = clampStat((prev[key] ?? 0) + (delta[key] ?? 0));
        });
        return updated;
      });
    });
  }, []);

  const addToHistory = useCallback(({ sceneId, dialogueId, choiceId, snapshot }: {
    sceneId: string;
    dialogueId: string | null;
    choiceId: string | null;
    snapshot: GameStats;
  }) => {
    startTransition(() => {
      setHistory((prev) => [...prev, {
        sceneId,
        dialogueId,
        choiceId,
        statsSnapshot: snapshot,
        timestamp: Date.now()
      }]);
    });
  }, []);

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

  /**
   * Find the next dialogue that passes conditions, starting from startIndex.
   * Optionally skip isResponse dialogues (for convergence navigation).
   */
  const findNextValidDialogue = useCallback((
    dialogues: Dialogue[],
    startIndex: number,
    skipResponses: boolean = false,
  ): Dialogue | null => {
    for (let i = startIndex; i < dialogues.length; i++) {
      const d = dialogues[i];
      if (skipResponses && d.isResponse) continue;
      if (evaluateConditions(d.conditions, stats)) return d;
    }
    return null;
  }, [stats]);

  const goToNextDialogue = useCallback(() => {
    if (!currentScene?.dialogues || !currentDialogue) return;

    // If this dialogue is a response (isResponse: true), skip to the next non-response dialogue (convergence point)
    if (currentDialogue.isResponse) {
      const currentIndex = currentScene.dialogues.findIndex((d) => d.id === currentDialogue.id);
      const next = findNextValidDialogue(currentScene.dialogues, currentIndex + 1, true);
      if (next) setCurrentDialogueId(next.id);
      return;
    }

    // Explicit convergence: dialogue has a nextDialogueId (e.g. manual linking)
    if (currentDialogue.nextDialogueId) {
      const target = currentScene.dialogues.find((d) => d.id === currentDialogue.nextDialogueId);
      if (target && evaluateConditions(target.conditions, stats)) {
        setCurrentDialogueId(target.id);
        return;
      }
    }

    // Default: advance linearly, skipping dialogues that fail conditions
    const currentIndex = currentScene.dialogues.findIndex((d) => d.id === currentDialogue.id);
    if (currentIndex === -1 || currentIndex === currentScene.dialogues.length - 1) return;
    const next = findNextValidDialogue(currentScene.dialogues, currentIndex + 1);
    if (next) setCurrentDialogueId(next.id);
  }, [currentScene, currentDialogue, stats, findNextValidDialogue]);

  /**
   * True when the player is at the last playable dialogue of the scene
   * (no next dialogue, no choices, no explicit nextDialogueId).
   * Bug 1 fix : permet d'afficher "Fin" au lieu de laisser "Suivant" en no-op.
   */
  const isAtLastDialogue = useMemo(() => {
    if (!currentScene?.dialogues || !currentDialogue) return false;
    if (currentDialogue.choices.length > 0) return false;
    if (currentDialogue.nextDialogueId) return false;
    if (currentDialogue.isResponse) return false;
    const idx = currentScene.dialogues.findIndex(d => d.id === currentDialogue.id);
    if (idx === -1) return false;
    // Vérifier qu'aucun dialogue valide suivant n'existe
    for (let i = idx + 1; i < currentScene.dialogues.length; i++) {
      const d = currentScene.dialogues[i];
      if (!d.isResponse && evaluateConditions(d.conditions, stats)) return false;
    }
    return true;
  }, [currentScene, currentDialogue, stats]);

  const chooseOption = useCallback(async (choice: DialogueChoice): Promise<void> => {
    if (!currentScene || !currentDialogue || !choice) return;

    // 1. Compute effects synchronously BEFORE anything else
    //    This ensures dice checks and history use correct stats.
    const delta = computeEffectsDelta(choice.effects, stats);
    const newStats: GameStats = { ...stats };
    Object.keys(delta).forEach(key => {
      newStats[key] = clampStat((stats[key] ?? 0) + (delta[key] ?? 0));
    });

    // 2. Save history with stats AFTER effects applied
    addToHistory({
      sceneId: currentScene.id,
      dialogueId: currentDialogue.id,
      choiceId: choice.id,
      snapshot: newStats,
    });

    // 3. Apply effects to React state
    if (Object.keys(delta).length > 0) {
      applyStatsDelta(delta);
    }

    // 4. Dice check uses newStats (not stale closure stats)
    let branch: DiceCheckBranch | null = null;
    if (choice.diceCheck) {
      // Resolve dice check with the freshly computed stats
      setDiceState({ rolling: true, lastRoll: null, lastResult: null });
      await new Promise((r) => setTimeout(r, TIMING.DICE_ROLL_DURATION));
      // Bug 3 fix : guard unmount — ne pas setState sur un composant démonté
      if (!isMountedRef.current) return;
      const roll = Math.floor(Math.random() * DICE.D20_MAX) + 1;
      const statValue = newStats[choice.diceCheck.stat] ?? 0;
      const totalRoll = roll + statValue;
      const success = totalRoll >= choice.diceCheck.difficulty;
      const result = success ? 'success' : 'failure';
      setDiceState({ rolling: false, lastRoll: totalRoll, lastResult: result });
      branch = choice.diceCheck[result] || null;
    }

    // 5. Navigate
    const target = branch || choice;
    if (target.nextSceneId) {
      goToScene(target.nextSceneId, target.nextDialogueId || null);
    } else if (target.nextDialogueId) {
      setCurrentDialogueId(target.nextDialogueId);
    } else {
      goToNextDialogue();
    }
  }, [currentScene, currentDialogue, stats, addToHistory, applyStatsDelta, computeEffectsDelta, goToNextDialogue, goToScene]);

  return {
    currentScene,
    currentDialogue,
    stats,
    history,
    isPaused,
    readingSpeed,
    diceState,
    isAtLastDialogue,
    goToScene,
    goToNextDialogue,
    chooseOption,
    jumpToHistoryIndex,
    setReadingSpeed,
    setIsPaused
  };
}
