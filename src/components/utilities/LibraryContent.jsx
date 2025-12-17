import React from 'react';
import { useApp } from '../../AppContext.jsx';

/**
 * LibraryContent - Bibliothèque des assets (personnages, décors)
 * Drag & drop vers le canvas
 */
export default function LibraryContent() {
  const { characters, scenes, selectedSceneId } = useApp();

  const handleDragStart = (e, type, data) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ type, data }));
  };

  // Récupérer les décors uniques des scènes
  const backgrounds = scenes
    .filter(s => s.backgroundUrl)
    .map(s => ({
      id: s.id,
      url: s.backgroundUrl,
      name: s.title
    }));

  return (
    <div className="space-y-6">
      {/* Section Personnages */}
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <span>👥</span>
          <span>Personnages</span>
          <span className="text-xs text-slate-400">({characters.length})</span>
        </h3>
        {characters.length === 0 ? (
          <div className="text-sm text-slate-400 bg-slate-900 p-4 rounded-lg border border-slate-700">
            Aucun personnage. Créez-en dans l'onglet "2. Personnages".
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {characters.map(char => (
              <div
                key={char.id}
                draggable
                onDragStart={(e) => handleDragStart(e, 'character', char)}
                className="bg-slate-700 p-3 rounded-lg cursor-move hover:bg-slate-600 transition-all hover:scale-105 border border-slate-600 hover:border-blue-500"
                title={`Glisser "${char.name}" sur le canvas`}
              >
                {/* Avatar */}
                <div className="text-3xl mb-2 text-center">
                  {char.sprites?.neutral ? (
                    <img 
                      src={char.sprites.neutral} 
                      alt={char.name}
                      className="w-12 h-12 mx-auto object-contain"
                    />
                  ) : (
                    '🧑'
                  )}
                </div>
                {/* Nom */}
                <div className="text-sm font-medium text-center truncate">
                  {char.name}
                </div>
                {/* Humeurs disponibles */}
                {char.moods && char.moods.length > 0 && (
                  <div className="text-xs text-slate-400 text-center mt-1">
                    {char.moods.length} mood{char.moods.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Section Décors */}
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <span>🏞️</span>
          <span>Décors</span>
          <span className="text-xs text-slate-400">({backgrounds.length})</span>
        </h3>
        {backgrounds.length === 0 ? (
          <div className="text-sm text-slate-400 bg-slate-900 p-4 rounded-lg border border-slate-700">
            Aucun décor disponible. Ajoutez une image de fond aux scènes.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {backgrounds.map(bg => (
              <div
                key={bg.id}
                draggable
                onDragStart={(e) => handleDragStart(e, 'background', bg)}
                className="bg-slate-700 p-3 rounded-lg cursor-move hover:bg-slate-600 transition-all border border-slate-600 hover:border-blue-500"
                title={`Glisser "${bg.name}" sur le canvas`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-slate-900 rounded flex items-center justify-center text-2xl">
                    {bg.url ? (
                      <img 
                        src={bg.url} 
                        alt={bg.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      '🖼️'
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{bg.name}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {bg.url || 'Pas d\'URL'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Instructions drag & drop */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700 rounded-lg text-xs text-blue-200">
        <div className="font-semibold mb-1">💡 Astuce</div>
        <div>Glissez-déposez les éléments sur le canvas central pour les positionner dans la scène.</div>
      </div>
    </div>
  );
}
