import React, { useEffect, useRef, useState, useContext } from 'react';
import { AppContext } from '../../AppContext';
import { useGameState } from '../../hooks/useGameState';

export default function PreviewPlayer({ initialSceneId, onClose }) {
  const { scenes } = useContext(AppContext);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const liveRegionRef = useRef(null);

  const { currentScene, currentDialogue, stats, history, isPaused, chooseOption, goToScene, setIsPaused } = useGameState({
    scenes,
    initialSceneId: initialSceneId || (scenes && scenes[0]?.id),
  });

  // Annonce accessibilité
  useEffect(() => {
    if (currentDialogue && liveRegionRef.current) {
      liveRegionRef.current.textContent = currentDialogue.text || '';
    }
  }, [currentDialogue]);

  if (!currentScene) {
    return (
      <div className="p-10 text-center text-white">
        Aucune scène jouable.{' '}
        <button onClick={onClose} className="underline">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'bg-slate-900 text-white'}`}>
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" />

      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="font-bold">Preview: {currentScene.title}</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="px-3 py-1 bg-slate-700 rounded text-sm">
            {isFullscreen ? 'Quitter Plein écran' : 'Plein écran'}
          </button>
          <button onClick={onClose} className="px-3 py-1 bg-red-600 rounded text-sm">
            Fermer
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Scène & Dialogue */}
        <section className="col-span-8 bg-slate-800 rounded-lg p-6 flex flex-col justify-between">
          <div className="text-lg leading-relaxed mb-6">
            {currentDialogue?.speaker && (
              <div className="text-cyan-400 text-sm font-bold uppercase mb-2">{currentDialogue.speaker}</div>
            )}
            {currentDialogue?.text || '...'}
          </div>

          <div className="space-y-2">
            {currentDialogue?.choices?.map((choice) => (
              <button
                key={choice.id}
                onClick={() => chooseOption(choice)}
                className="w-full text-left p-3 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 transition-colors"
              >
                {choice.label}
              </button>
            ))}
            {(!currentDialogue?.choices || currentDialogue.choices.length === 0) && (
              <div className="text-slate-400 italic text-sm">Fin du dialogue ou navigation automatique...</div>
            )}
          </div>
        </section>

        {/* Sidebar Stats */}
        <aside className="col-span-4 space-y-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="font-bold text-slate-400 mb-2 uppercase text-xs">Statistiques</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                Physique: <span className="font-mono text-cyan-300">{stats.physique}</span>
              </div>
              <div>
                Mentale: <span className="font-mono text-purple-300">{stats.mentale}</span>
              </div>
              <div>
                Sociale: <span className="font-mono text-yellow-300">{stats.sociale}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg flex-1 overflow-y-auto max-h-60">
            <h3 className="font-bold text-slate-400 mb-2 uppercase text-xs">Historique</h3>
            <ol className="text-xs space-y-1 text-slate-300">
              {history.map((h, i) => (
                <li key={i}>
                  {i + 1}. Choix {h.choiceId}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
