import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharactersStore } from '@/stores';

/**
 * CharacterMoodPicker - Gallery avatars with mood preview
 * Style Powtoon - Hover sur personnage affiche bulles humeur
 *
 * Features:
 * - Character gallery (all available characters)
 * - Hover → show mood bubbles (sourire, triste, neutre, etc.)
 * - Drag to canvas → addCharacterToScene(sceneId, characterId, mood, position)
 * - Framer Motion animations (scale-110, rotate-3)
 */

export interface CharacterMoodPickerProps {
  onDragStart?: (characterId: string, mood: string) => void;
}

export function CharacterMoodPicker({ onDragStart }: CharacterMoodPickerProps) {
  const characters = useCharactersStore(state => state.characters);
  const [hoveredCharacterId, setHoveredCharacterId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement | HTMLButtonElement>, characterId: string, mood: string) => {
    // Set drag data for MainCanvas drop handler
    const dragData = {
      type: 'character',
      characterId,
      mood
    };
    e.dataTransfer.setData('text/x-drag-type', 'character');
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    if (onDragStart) {
      onDragStart(characterId, mood);
    }
  };

  return (
    <div className="space-y-3">
      {characters.map((character) => {
        const moods = character.moods || ['neutral'];
        const defaultMood = moods[0] || 'neutral';
        const isHovered = hoveredCharacterId === character.id;

        return (
          <div
            key={character.id}
            className="relative"
            onMouseEnter={() => setHoveredCharacterId(character.id)}
            onMouseLeave={() => setHoveredCharacterId(null)}
          >
            {/* Character Card */}
            <motion.div
              className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border-base)] rounded-lg cursor-grab active:cursor-grabbing hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-game-glow)] transition-all"
              draggable
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, character.id, defaultMood)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar Preview */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-bg-base)] border-2 border-[var(--color-border-base)] overflow-hidden flex items-center justify-center">
                {character.sprites?.[defaultMood] ? (
                  <img
                    src={character.sprites[defaultMood]}
                    alt={character.name}
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                ) : (
                  <span className="text-2xl" aria-hidden="true">👤</span>
                )}
              </div>

              {/* Character Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {character.name}
                </h4>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {moods.length} mood{moods.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Drag Icon */}
              <div className="flex-shrink-0 text-[var(--color-text-muted)]" aria-hidden="true">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
            </motion.div>

            {/* Mood Bubbles (hover reveal) */}
            <AnimatePresence>
              {isHovered && moods.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 right-0 -top-2 z-20 flex flex-wrap gap-2 justify-center p-2 bg-[var(--color-bg-overlay)] backdrop-blur-sm border-2 border-[var(--color-primary)] rounded-lg shadow-[var(--shadow-game-glow-lg)]"
                >
                  <div className="text-xs font-semibold text-[var(--color-text-primary)] w-full text-center mb-1">
                    Choose mood:
                  </div>
                  {moods.map((mood) => (
                    <motion.button
                      key={mood}
                      draggable
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLButtonElement>, character.id, mood)}
                      className="flex flex-col items-center gap-1 px-2 py-1.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-primary)] border border-[var(--color-border-base)] hover:border-[var(--color-primary)] rounded-md transition-colors cursor-grab active:cursor-grabbing group"
                      whileHover={{ scale: 1.1, rotate: 3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${character.name} - ${mood}`}
                    >
                      {/* Mood Avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--color-border-base)] bg-[var(--color-bg-base)]">
                        {character.sprites?.[mood] ? (
                          <img
                            src={character.sprites[mood]}
                            alt={`${character.name} ${mood}`}
                            className="w-full h-full object-cover"
                            draggable="false"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">
                            👤
                          </div>
                        )}
                      </div>
                      {/* Mood Label */}
                      <span className="text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-white truncate max-w-[60px]">
                        {mood}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Empty State */}
      {characters.length === 0 && (
        <div className="text-center py-8 text-[var(--color-text-muted)]">
          <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-border-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-sm font-medium">No characters yet</p>
          <p className="text-xs mt-1">Create characters to add them to scenes</p>
        </div>
      )}
    </div>
  );
}

export default CharacterMoodPicker;
