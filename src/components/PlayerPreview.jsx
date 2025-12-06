// src/components/PlayerPreview.jsx
// ASCII only
import React, { useEffect, useRef, useState } from 'react';
import { createEngine } from '../core/engine.js';

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

      <div className="mb-3 text-sm text-gray-600">
        Physique: {vars.Physique} / 100, Mentale: {vars.Mentale} / 100
      </div>

      {scene && scene.backgroundUrl ? (
        <img src={scene.backgroundUrl} alt="Decor" className="w-full max-h-64 object-cover rounded mb-3" />
      ) : (
        <div className="w-full h-32 bg-gray-100 rounded mb-3" />
      )}

      {current && (
        <div className="border-2 border-gray-200 rounded p-3">
          {!ended && (
            <>
              <div className="font-semibold mb-2">{nameOf(current.speaker)}</div>
              <p className="mb-3">{current.text}</p>
              {current.choices && current.choices.length > 0 ? (
                <div className="space-y-2">
                  {current.choices.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handleChoice(c)}
                      className="w-full text-left px-3 py-2 rounded border hover:border-primary"
                    >
                      {c.text}
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
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
          {ended && <p role="status" aria-live="polite">{current.text}</p>}
        </div>
      )}
    </div>
  );
}
