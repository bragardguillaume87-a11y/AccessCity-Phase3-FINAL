import { useCallback, useMemo, useState } from 'react';

const DEFAULT_STATS = {};

export function useGameState({ scenes, initialSceneId, initialStats = DEFAULT_STATS }) {
  const [currentSceneId, setCurrentSceneId] = useState(initialSceneId);
  const [currentDialogueId, setCurrentDialogueId] = useState(null);
  const [stats, setStats] = useState(initialStats);
  const [history, setHistory] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(1);
  const [diceState, setDiceState] = useState({ rolling: false, lastRoll: null, lastResult: null });

  const currentScene = useMemo(() => scenes.find((s) => s.id === currentSceneId) || null, [scenes, currentSceneId]);

  const currentDialogue = useMemo(() => {
    if (!currentScene?.dialogues?.length) return null;
    if (!currentDialogueId) return currentScene.dialogues[0];
    return currentScene.dialogues.find((d) => d.id === currentDialogueId) || currentScene.dialogues[0];
  }, [currentScene, currentDialogueId]);

  const goToScene = useCallback((sceneId, dialogueId = null) => {
    setCurrentSceneId(sceneId);
    setCurrentDialogueId(dialogueId);
  }, []);

  const applyStatsDelta = useCallback((delta = {}) => {
    setStats((prev) => {
      const updated = { ...prev };
      Object.keys(delta).forEach((key) => {
        updated[key] = (prev[key] ?? 0) + (delta[key] ?? 0);
      });
      return updated;
    });
  }, []);

  const addToHistory = useCallback(({ sceneId, dialogueId, choiceId }) => {
    setHistory((prev) => [...prev, { sceneId, dialogueId, choiceId, statsSnapshot: stats, timestamp: Date.now() }]);
  }, [stats]);

  const jumpToHistoryIndex = useCallback((index) => {
    const item = history[index];
    if (!item) return;
    setCurrentSceneId(item.sceneId);
    setCurrentDialogueId(item.dialogueId);
    setStats(item.statsSnapshot);
    setHistory(history.slice(0, index + 1));
    setDiceState({ rolling: false, lastRoll: null, lastResult: null });
  }, [history]);

  const goToNextDialogue = useCallback(() => {
    if (!currentScene?.dialogues) return;
    const currentIndex = currentScene.dialogues.findIndex((d) => d.id === currentDialogue?.id);
    if (currentIndex === -1 || currentIndex === currentScene.dialogues.length - 1) return;
    setCurrentDialogueId(currentScene.dialogues[currentIndex + 1].id);
  }, [currentScene, currentDialogue]);

  const resolveDiceCheck = useCallback(async (diceCheck) => {
    if (!diceCheck) return null;
    setDiceState({ rolling: true, lastRoll: null, lastResult: null });
    await new Promise((r) => setTimeout(r, 700));
    const roll = Math.floor(Math.random() * 20) + 1;
    const statValue = stats[diceCheck.stat] ?? 0;
    const success = (roll + statValue) >= diceCheck.difficulty;
    setDiceState({ rolling: false, lastRoll: roll + statValue, lastResult: success ? 'success' : 'failure' });
    return success ? 'success' : 'failure';
  }, [stats]);

  const chooseOption = useCallback(async (choice) => {
    if (!currentScene || !currentDialogue || !choice) return;
    addToHistory({ sceneId: currentScene.id, dialogueId: currentDialogue.id, choiceId: choice.id });

    // Apply effects from choice (new format: effects array)
    if (choice.effects && Array.isArray(choice.effects)) {
      const delta = {};
      choice.effects.forEach(effect => {
        if (effect.operation === 'set') {
          delta[effect.variable] = effect.value - (stats[effect.variable] ?? 0);
        } else if (effect.operation === 'add') {
          delta[effect.variable] = effect.value;
        }
      });
      applyStatsDelta(delta);
    }

    // Legacy support: statsDelta object
    if (choice.statsDelta) applyStatsDelta(choice.statsDelta);

    let branch = null;
    if (choice.diceCheck) {
      const result = await resolveDiceCheck(choice.diceCheck);
      branch = choice.diceCheck[result];
    }
    const target = branch || choice;

    if (target.nextSceneId) goToScene(target.nextSceneId, target.nextDialogueId);
    else if (target.nextDialogueId) setCurrentDialogueId(target.nextDialogueId);
    else goToNextDialogue();
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
