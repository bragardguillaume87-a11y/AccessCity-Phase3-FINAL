import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AvatarPicker } from '../tabs/characters/components/AvatarPicker.jsx';

/**
 * MoodSpriteMapper - Visual grid showing mood-to-sprite assignments
 * Allows clicking on moods to assign/change sprites
 */
export default function MoodSpriteMapper({ moods, sprites, onUpdateSprite, warnings }) {
  const [selectedMood, setSelectedMood] = useState(null);

  const handleSpriteSelect = (mood, spritePath) => {
    onUpdateSprite(mood, spritePath);
    setSelectedMood(null);
  };

  if (moods.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl">
        <div className="text-6xl mb-4">🎨</div>
        <p className="text-slate-400 font-medium mb-2">Aucune humeur à configurer</p>
        <p className="text-sm text-slate-500">Ajoutez des humeurs dans la section ci-dessus pour pouvoir leur assigner des sprites</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-300">Sprites par humeur</h4>
        {warnings && warnings.sprites && (
          <span className="text-xs px-2 py-1 bg-amber-900/30 border border-amber-700 text-amber-300 rounded">
            ⚠ {moods.length - Object.values(sprites || {}).filter(s => s).length} non assignés
          </span>
        )}
      </div>

      {/* Warning message */}
      {warnings && warnings.sprites && (
        <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700 rounded-lg">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-200">
            {warnings.sprites[0]}
          </div>
        </div>
      )}

      {/* Grid of mood cards */}
      <div className="grid grid-cols-3 gap-3">
        {moods.map((mood) => {
          const hasSprite = sprites && sprites[mood];

          return (
            <div
              key={mood}
              className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                hasSprite
                  ? 'border-2 border-green-600 hover:border-green-500'
                  : 'border-2 border-dashed border-slate-600 hover:border-blue-500'
              }`}
              onClick={() => setSelectedMood(mood)}
            >
              {/* Card content */}
              <div className="aspect-square bg-slate-900 flex items-center justify-center relative">
                {hasSprite ? (
                  <>
                    {/* Sprite preview */}
                    <img
                      src={sprites[mood]}
                      alt={mood}
                      className="w-full h-full object-contain p-2"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-sm font-semibold">Changer sprite</div>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded">
                      ✓
                    </div>
                  </>
                ) : (
                  <>
                    {/* Placeholder */}
                    <div className="text-center p-4">
                      <svg className="w-12 h-12 mx-auto mb-2 text-slate-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-slate-500 group-hover:text-blue-400 transition-colors">Assigner sprite</span>
                    </div>
                  </>
                )}
              </div>

              {/* Mood label */}
              <div className={`px-2 py-1.5 text-center text-sm font-semibold ${
                hasSprite
                  ? 'bg-green-900/50 text-green-300'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {mood}
              </div>
            </div>
          );
        })}
      </div>

      {/* Avatar Picker Modal */}
      {selectedMood && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-white">Sélectionner un sprite</h3>
                <p className="text-sm text-slate-400">Pour l'humeur: <span className="text-purple-400 font-semibold">{selectedMood}</span></p>
              </div>
              <button
                onClick={() => setSelectedMood(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AvatarPicker
                currentSprites={sprites || {}}
                onSelect={(mood, path) => handleSpriteSelect(mood, path)}
                mood={selectedMood}
                labels={{}}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Cliquez sur un avatar pour l'assigner à cette humeur
              </span>
              <button
                onClick={() => setSelectedMood(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

MoodSpriteMapper.propTypes = {
  moods: PropTypes.arrayOf(PropTypes.string).isRequired,
  sprites: PropTypes.object,
  onUpdateSprite: PropTypes.func.isRequired,
  warnings: PropTypes.object
};
