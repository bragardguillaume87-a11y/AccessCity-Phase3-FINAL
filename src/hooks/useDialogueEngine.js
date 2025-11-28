import { useEffect, useRef, useState, useCallback } from 'react';
import { EventBus } from '../../core/eventBus.js';
import { VariableManager } from '../../core/variableManager.js';
import { DialogueEngine } from '../../core/DialogueEngine.js';

// Hook React qui instancie le moteur de dialogue et expose état courant.
// Ce hook est conçu pour HMR: l'instance est conservée via useRef.

export function useDialogueEngine(initialScene) {
  const eventBusRef = useRef(null);
  const varManagerRef = useRef(null);
  const engineRef = useRef(null);

  const [dialogue, setDialogue] = useState({ speaker: '', text: '' });
  const [choices, setChoices] = useState([]);
  const [sceneEnded, setSceneEnded] = useState(false);
  const [variablesSnapshot, setVariablesSnapshot] = useState({});

  // Initialisation unique
  if (!eventBusRef.current) {
    eventBusRef.current = new EventBus();
    varManagerRef.current = new VariableManager(eventBusRef.current);
    // Définir quelques variables démo
    varManagerRef.current.define('Physique', 'number', 80, 0, 100);
    varManagerRef.current.define('Mentale', 'number', 90, 0, 100);
    varManagerRef.current.define('Alerte', 'boolean', false);
    engineRef.current = new DialogueEngine(varManagerRef.current, eventBusRef.current);
  }

  // Handlers events moteur
  useEffect(() => {
    const bus = eventBusRef.current;
    if (!bus) return;

    const onDialogue = (data) => {
      setDialogue({ speaker: data.speaker, text: data.text });
      setChoices([]);
    };
    const onChoices = (chs) => setChoices(chs);
    const onSceneEnd = () => {
      setSceneEnded(true);
    };
    const onVarChanged = () => {
      const defs = varManagerRef.current.getAll();
      const snap = Object.fromEntries(Object.entries(defs).map(([k, v]) => [k, v.value]));
      setVariablesSnapshot(snap);
    };

    bus.on('engine:dialogue_show', onDialogue);
    bus.on('engine:choices_show', onChoices);
    bus.on('engine:scene_end', onSceneEnd);
    bus.on('variable:changed', onVarChanged);

    // Snapshot initial
    onVarChanged();

    return () => {
      // Pas de off implémenté dans DialogueEngine events custom ici pour simplifier
    };
  }, []);

  // Lancer scène initiale
  useEffect(() => {
    if (initialScene && engineRef.current && !sceneEnded && dialogue.text === '') {
      engineRef.current.startScene(initialScene);
    }
  }, [initialScene, sceneEnded, dialogue.text]);

  const next = useCallback(() => {
    engineRef.current?.next();
  }, []);

  const selectChoice = useCallback((choice) => {
    engineRef.current?.selectChoice(choice);
  }, []);

  const reset = useCallback(() => {
    if (!engineRef.current) return;
    setSceneEnded(false);
    setChoices([]);
    setDialogue({ speaker: '', text: '' });
    // Reset variables to defaults
    const defs = varManagerRef.current.getDefinitions?.() || {};
    Object.keys(defs).forEach(name => varManagerRef.current.set(name, defs[name].defaultValue));
    engineRef.current.startScene(initialScene);
  }, [initialScene]);

  return {
    dialogue,
    choices,
    variables: variablesSnapshot,
    sceneEnded,
    next,
    selectChoice,
    reset,
    eventBus: eventBusRef.current,
  };
}
