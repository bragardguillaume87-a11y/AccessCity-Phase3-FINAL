import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useCharactersStore } from '@/stores';
import { useUIStore } from '@/stores';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { convertFileSrcIfNeeded } from '@/utils/tauri';
import type { SceneCharacter } from '@/types';

// ⚠️ Module-level constant — évite || [] inline dans le sélecteur Zustand.
const EMPTY_SCENE_CHARACTERS: SceneCharacter[] = [];

export interface CharacterMoodPickerProps {
  onDragStart?: (characterId: string, mood: string) => void;
}

/**
 * CharacterMoodPicker — Liste accordéon des personnages SUR SCÈNE.
 *
 * - Affiche uniquement les personnages présents dans la scène courante.
 * - Clic sur une ligne → expand inline → grille de moods.
 * - Clic sur un mood → met à jour toutes les instances du perso dans la scène.
 */
export function CharacterMoodPicker({ onDragStart }: CharacterMoodPickerProps) {
  const characters    = useCharactersStore(state => state.characters);
  const selectedSceneId = useUIStore(s => s.selectedSceneForEdit);
  const sceneCharacters = useSceneElementsStore(s =>
    selectedSceneId
      ? (s.elementsByScene[selectedSceneId]?.characters || EMPTY_SCENE_CHARACTERS)
      : EMPTY_SCENE_CHARACTERS
  );
  const updateSceneCharacter = useSceneElementsStore(s => s.updateSceneCharacter);

  // IDs uniques des personnages sur la scène (1 perso peut être placé plusieurs fois)
  const sceneCharacterIds = [...new Set(sceneCharacters.map(sc => sc.characterId))];
  const sceneChars = sceneCharacterIds
    .map(id => characters.find(c => c.id === id))
    .filter(Boolean) as typeof characters;

  // Accordion : quel perso est ouvert
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleOpen = useCallback((id: string) => {
    setOpenId(prev => prev === id ? null : id);
  }, []);

  // Mood actif pour un perso (1ère instance sur la scène)
  const getActiveMood = useCallback((characterId: string): string => {
    return sceneCharacters.find(sc => sc.characterId === characterId)?.mood ?? 'neutral';
  }, [sceneCharacters]);

  const handleMoodClick = useCallback((characterId: string, mood: string) => {
    if (!selectedSceneId) return;
    sceneCharacters
      .filter(sc => sc.characterId === characterId)
      .forEach(sc => updateSceneCharacter(selectedSceneId, sc.id, { mood }));
  }, [selectedSceneId, sceneCharacters, updateSceneCharacter]);

  const handleDragStart = useCallback((
    e: React.DragEvent<HTMLDivElement>,
    characterId: string,
    mood: string,
  ) => {
    const dragData = { type: 'character', characterId, mood };
    e.dataTransfer.setData('text/x-drag-type', 'character');
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(characterId, mood);
  }, [onDragStart]);

  // État vide
  if (!selectedSceneId) {
    return (
      <section className="sp-sec">
        <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
          Sélectionne une scène pour voir ses personnages.
        </p>
      </section>
    );
  }

  if (sceneChars.length === 0) {
    return (
      <section className="sp-sec">
        <h3 className="sp-lbl">SUR SCÈNE</h3>
        <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
          Aucun personnage sur cette scène.<br />
          Fais glisser un personnage depuis la bibliothèque.
        </p>
      </section>
    );
  }

  return (
    <section className="sp-sec" aria-label="Personnages sur la scène">
      <h3 className="sp-lbl">SUR SCÈNE</h3>

      {sceneChars.map(character => {
        const moods = character.moods && character.moods.length > 0
          ? character.moods
          : ['neutral'];
        const activeMood = getActiveMood(character.id);
        const isOpen = openId === character.id;
        const activeSprite = character.sprites?.[activeMood];

        return (
          <div key={character.id}>
            {/* Ligne perso — sp-perso-row */}
            <div
              className="sp-perso-row"
              onClick={() => toggleOpen(character.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, character.id, activeMood)}
              role="button"
              aria-expanded={isOpen}
              aria-controls={`mood-grid-${character.id}`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleOpen(character.id); }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[var(--color-bg-base)] border border-[var(--color-border-base)] flex items-center justify-center">
                {activeSprite ? (
                  <img
                    src={convertFileSrcIfNeeded(activeSprite)}
                    alt={character.name}
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                ) : (
                  <span className="text-xl" aria-hidden="true">👤</span>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                  {character.name}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {moods.length} mood{moods.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Chevron */}
              <ChevronRight
                className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)] transition-transform"
                style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                aria-hidden="true"
              />
            </div>

            {/* Grille moods — expand inline */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`mood-grid-${character.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-2 pb-3 pt-1 border-b border-[var(--color-border-base)]">
                    <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                      Humeur
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {moods.map(mood => {
                        const sprite = character.sprites?.[mood];
                        const isActive = activeMood === mood;
                        return (
                          <button
                            key={mood}
                            onClick={(e) => { e.stopPropagation(); handleMoodClick(character.id, mood); }}
                            className={[
                              'flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all text-center',
                              isActive
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                : 'border-[var(--color-border-base)] bg-[var(--color-bg-base)] hover:border-[var(--color-primary)]/50',
                            ].join(' ')}
                            aria-pressed={isActive}
                            aria-label={`${character.name} — ${mood}`}
                          >
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-[var(--color-border-base)] bg-[var(--color-bg-hover)] flex items-center justify-center">
                              {sprite ? (
                                <img
                                  src={convertFileSrcIfNeeded(sprite)}
                                  alt={`${character.name} ${mood}`}
                                  className="w-full h-full object-cover"
                                  draggable="false"
                                />
                              ) : (
                                <span className="text-lg" aria-hidden="true">👤</span>
                              )}
                            </div>
                            <span className={[
                              'text-[10px] font-medium truncate w-full',
                              isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
                            ].join(' ')}>
                              {mood}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </section>
  );
}

export default CharacterMoodPicker;
