// src/components/PlayerPreview.jsx
// ASCII only
import React, { useEffect, useRef, useState } from 'react';
import { createEngine } from '../core/engine.js';
import HUDVariables from './HUDVariables.jsx';

export default function PlayerPreview({ scene, onExit }) {
  const [current, setCurrent] = useState(null);
  const [vars, setVars] = useState({ Physique: 100, Mentale: 100 });
  const [ended, setEnded] = useState(false);

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

    eventBus.on('dialogue:show', onShow);
    eventBus.on('variables:updated', onVars);
    eventBus.on('scene:complete', onEnd);

    dialogueEngine.loadScene(scene);

    return () => {
      eventBus.off('dialogue:show', onShow);
      eventBus.off('variables:updated', onVars);
      eventBus.off('scene:complete', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  function handleChoice(choice) {
    if (!engineRef.current) return;
    engineRef.current.de.handleChoice(choice);
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
    <div className="relative bg-white rounded-xl shadow-md p-4">
      <button
        onClick={onExit}
        className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        aria-label="Quitter"
      >
        Quitter
      </button>

      {/* HUD variables accesible */}
      <HUDVariables variables={vars} />

      {/* Stage */}
      <div className="relative w-full bg-black rounded-xl overflow-hidden mt-14" style={{ minHeight: '480px' }}>
        {/* Background */}
        {scene && scene.backgroundUrl ? (
          <img src={scene.backgroundUrl} alt="Decor" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900" />
        )}

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
