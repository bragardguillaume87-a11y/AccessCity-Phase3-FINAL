import { useState } from 'react';
import { useApp } from '../AppContext.jsx';
import PlayerPreview from './PlayerPreview.jsx';
import PreviewPlayer from './panels/PreviewPlayer.jsx';

export default function PreviewPanel({ onPrev, onNext }) {
  const { scenes, selectedSceneForEdit } = useApp();
  const [showPreview, setShowPreview] = useState(false);
  const [previewSceneId, setPreviewSceneId] = useState(null);
  const [useNewPlayer, setUseNewPlayer] = useState(false);

  const previewScene = scenes.find(s => s.id === previewSceneId);

  function handlePreviewScene(sceneId, newPlayer = false) {
    setPreviewSceneId(sceneId);
    setUseNewPlayer(newPlayer);
    setShowPreview(true);
  }

  if (showPreview && previewScene) {
    if (useNewPlayer) {
      return (
        <div className="animate-fadeIn h-screen">
          <PreviewPlayer initialSceneId={previewSceneId} onClose={() => setShowPreview(false)} />
        </div>
      );
    }
    return (
      <div className="animate-fadeIn">
        <PlayerPreview scene={previewScene} onExit={() => setShowPreview(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          ▶️ Etape 6 : Preview
        </h2>
        <p className="text-slate-600">
          Testez vos scenes en mode joueur
        </p>
      </div>

      {scenes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-slate-600 font-medium mb-2">Aucune scene disponible</p>
          <p className="text-sm text-slate-500">
            Creez des scenes dans l'onglet "Scenes" pour les previsualiser ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Deux modes de preview disponibles</p>
                <p className="mb-2">Testez vos scenes avec le lecteur de votre choix :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Mode Avance</strong> : Lecteur complet avec sprites animes, des, effets visuels</li>
                  <li><strong>Mode Simple</strong> : Lecteur leger avec navigation rapide et statistiques</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Liste des scènes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenes.map((scene, index) => {
              const hasDialogues = (scene.dialogues || []).length > 0;
              const hasBackground = scene.backgroundUrl;

              return (
                <div
                  key={scene.id}
                  className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden hover:shadow-xl transition-all group"
                >
                  {/* Preview image */}
                  {hasBackground ? (
                    <div className="h-40 overflow-hidden bg-slate-100">
                      <img
                        src={scene.backgroundUrl}
                        alt={scene.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 items-center justify-center">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-slate-500">#{index + 1}</span>
                      <h3 className="font-bold text-slate-900 flex-1">{scene.title}</h3>
                    </div>

                    {scene.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{scene.description}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      <span className="flex items-center gap-1 text-slate-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11z"/>
                          <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                        {(scene.dialogues || []).length} dialogue{(scene.dialogues || []).length !== 1 ? 's' : ''}
                      </span>
                      {hasBackground && (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                            <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.505.505 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z"/>
                          </svg>
                          Decor
                        </span>
                      )}
                    </div>

                    {/* Boutons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handlePreviewScene(scene.id, false)}
                        disabled={!hasDialogues}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        {hasDialogues ? '▶️ Mode Avance' : 'Aucun dialogue'}
                      </button>
                      <button
                        onClick={() => handlePreviewScene(scene.id, true)}
                        disabled={!hasDialogues}
                        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
                      >
                        {hasDialogues ? '🎮 Mode Simple' : 'Aucun dialogue'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onPrev && (
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-all"
          >
            ← Precedent
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all ml-auto"
          >
            Suivant : Export →
          </button>
        )}
      </div>
    </div>
  );
}
