// src/components/PlayerPreview.jsx
// ASCII only
import React, { useEffect, useRef, useState } from 'react';
import { createEngine } from '../core/engine.js';
import { useApp } from '../AppContext.jsx';
import HUDVariables from './HUDVariables.jsx';
import DeltaBadges from './DeltaBadges.jsx';
import DiceResultModal from './DiceResultModal.jsx';
import OutcomeModal from './OutcomeModal.jsx';

export default function PlayerPreview({ scene, onExit }) {
  const { characters } = useApp();
  const [current, setCurrent] = useState(null);
  const [vars, setVars] = useState({ Physique: 100, Mentale: 100 });
  const [ended, setEnded] = useState(false);
  const [deltas, setDeltas] = useState([]);

  // Etats pour les modales de des
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [diceResult, setDiceResult] = useState({ roll: 0, difficulty: 0, success: false });
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [currentOutcome, setCurrentOutcome] = useState({ message: '', illustration: '', moral: null });

  const engineRef = useRef(null);
  const busRef = useRef(null);

  useEffect(() => {
    const { eventBus, variableManager, dialogueEngine } = createEngine(vars);
    engineRef.current = { vm: variableManager, de: dialogueEngine };
    busRef.current = eventBus;

    function onShow(d) { setCurrent(d); }
    function onVars(v) { setVars(v); }
    function onEnd() {
      setEnded(true);
      setCurrent({ speaker: 'narrator', text: 'Scene terminee.', choices: [] });
    }
    function onDelta(list) {
      if (!Array.isArray(list)) return;
      list.forEach(({ variable, delta }) => {
        const id = `${Date.now()}-${Math.random()}`;
        setDeltas(prev => [...prev, { id, variable, delta }]);
        setTimeout(() => {
          setDeltas(prev => prev.filter(x => x.id !== id));
        }, 1500);
      });
    }

    eventBus.on('dialogue:show', onShow);
    eventBus.on('variables:updated', onVars);
    eventBus.on('scene:complete', onEnd);
    eventBus.on('variables:delta', onDelta);

    dialogueEngine.loadScene(scene);

    return () => {
      eventBus.off('dialogue:show', onShow);
      eventBus.off('variables:updated', onVars);
      eventBus.off('scene:complete', onEnd);
      eventBus.off('variables:delta', onDelta);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  function handleChoice(choice) {
    if (!engineRef.current) return;

    // Si le choix a un lancer de de active
    if (choice.diceRoll && choice.diceRoll.enabled) {
      const roll = rollDice();
      const difficulty = choice.diceRoll.difficulty || 12;
      const success = roll >= difficulty;

      // Afficher le resultat du de
      setDiceResult({ roll, difficulty, success });
      setDiceModalOpen(true);

      // Preparer l'issue correspondante
      const outcome = success ? choice.diceRoll.successOutcome : choice.diceRoll.failureOutcome;
      
      // Attendre 1.5s puis afficher l'issue
      setTimeout(() => {
        setDiceModalOpen(false);
        showOutcomeMessage(outcome, choice.nextScene);
      }, 1500);
    } else {
      // Choix classique sans de
      engineRef.current.de.handleChoice(choice);
    }
  }

  function rollDice() {
    return Math.floor(Math.random() * 20) + 1;
  }

  function showOutcomeMessage(outcome, nextScene) {
    if (!outcome) return;

    setCurrentOutcome({
      message: outcome.message || '',
      illustration: outcome.illustration || '',
      moral: outcome.moral || null
    });
    setOutcomeModalOpen(true);

    // Appliquer l'effet moral si present
    if (outcome.moral && outcome.moral.variable && outcome.moral.delta) {
      engineRef.current.vm.update(outcome.moral.variable, outcome.moral.delta);
    }

    // Attendre 2s puis naviguer vers la scene suivante
    setTimeout(() => {
      setOutcomeModalOpen(false);
      if (nextScene) {
        // Charger la scene suivante
        const sceneData = { id: nextScene, backgroundUrl: '', dialogues: [] };
        engineRef.current.de.loadScene(sceneData);
      }
    }, 2000);
  }

  function handleNext() {
    if (!engineRef.current) return;
    engineRef.current.de.next();
  }

  function nameOf(id) {
    if (id === 'narrator') return 'Narrateur';
    return id || '';
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Modales de des */}
      <DiceResultModal
        isOpen={diceModalOpen}
        roll={diceResult.roll}
        difficulty={diceResult.difficulty}
        success={diceResult.success}
        onClose={() => setDiceModalOpen(false)}
      />
      <OutcomeModal
        isOpen={outcomeModalOpen}
        message={currentOutcome.message}
        illustration={currentOutcome.illustration}
        moral={currentOutcome.moral}
        onClose={() => setOutcomeModalOpen(false)}
      />

      {/* Bouton Quitter */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
        aria-label="Quitter la preview et retourner a l editeur"
      >
        Quitter
      </button>

      {/* HUD variables positionne en absolu */}
      <div className="absolute top-4 left-4 z-40">
        <HUDVariables variables={vars} />
      </div>
      <DeltaBadges deltas={deltas} />

      {/* Stage - plein ecran */}
      <div className="relative flex-1 bg-black overflow-hidden w-full">
        {/* Background */}
        {scene && scene.backgroundUrl ? (
          <img src={scene.backgroundUrl} alt="Decor" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900" />
        )}

        {/* Character Sprite */}
        {current && current.speaker && current.speaker !== 'narrator' && (() => {
          const character = characters.find(c => c.id === current.speaker);
          if (!character || !character.sprites) return null;

          const speakerMood = current.speakerMood || character.defaultMood || 'neutral';
          const spriteUrl = character.sprites[speakerMood] || character.sprites['neutral'] || character.sprites[Object.keys(character.sprites)[0]];

          if (!spriteUrl) return null;

          return (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10 animate-previewSwap">
              <img
                key={speakerMood}
                src={spriteUrl}
                alt={`${character.name} - ${speakerMood}`}
                className="max-w-sm max-h-96 object-contain drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))'
                }}
              />
            </div>
          );
        })()}

        {/* Dialogue Box */}
        <div className="absolute inset-x-0 bottom-4 px-4">
          {current && (
            <div className="mx-auto max-w-2xl bg-[rgba(37,37,38,0.95)] text-gray-100 border-2 border-primary rounded-lg p-4 shadow-xl">
              {!ended && (
                <>
                  <div className="mb-2 font-semibold text-primary-hover">{nameOf(current.speaker)}</div>
                  <p className="mb-4">{current.text}</p>
                  {current.choices && current.choices.length > 0 ? (
                    <div className="space-y-2" role="group" aria-label="Choix disponibles">
                      {current.choices.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleChoice(c)}
                          className="w-full text-left px-3 py-2 rounded border border-gray-600 hover:border-primary"
                          aria-label={`Choix ${i + 1}`}
                        >
                          → {c.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={handleNext}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded"
                        aria-label="Suivant"
                      >
                        Suivant →
                      </button>
                    </div>
                  )}
                </>
              )}
              {ended && <p role="status" aria-live="polite">{current.text}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
