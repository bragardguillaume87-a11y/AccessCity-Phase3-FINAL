import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import { useCharactersStore } from '@/stores';
import { useUIStore } from '@/stores';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { isDialogueSelection } from '@/stores/selectionStore.types';
import { convertFileSrcIfNeeded } from '@/utils/tauri';
import { getMoodLabel, getMoodEmoji } from '@/hooks/useMoodPresets';
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
  const characters = useCharactersStore((state) => state.characters);
  const selectedSceneId = useUIStore((s) => s.selectedSceneForEdit);
  const sceneCharacters = useSceneElementsStore((s) =>
    selectedSceneId
      ? s.elementsByScene[selectedSceneId]?.characters || EMPTY_SCENE_CHARACTERS
      : EMPTY_SCENE_CHARACTERS
  );
  const updateSceneCharacter = useSceneElementsStore((s) => s.updateSceneCharacter);

  // Dialogue sélectionné (mode Dialogues)
  const selectedElement = useSelectionStore((s) => s.selectedElement);
  const updateDialogue = useDialoguesStore((s) => s.updateDialogue);
  const dialoguesByScene = useDialoguesStore((s) => s.dialoguesByScene);

  const dialogueSelection = isDialogueSelection(selectedElement) ? selectedElement : null;

  const isDialogueMode =
    dialogueSelection !== null && dialogueSelection.sceneId === selectedSceneId;

  const selectedDialogue =
    isDialogueMode && dialogueSelection
      ? dialoguesByScene[dialogueSelection.sceneId]?.[dialogueSelection.index]
      : null;

  // IDs uniques des personnages sur la scène
  const sceneCharacterIds = [...new Set(sceneCharacters.map((sc) => sc.characterId))];
  const sceneChars = sceneCharacterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as typeof characters;

  const [openId, setOpenId] = useState<string | null>(null);

  const toggleOpen = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  /**
   * Mood actif :
   * - mode dialogue → characterMoods du dialogue sélectionné (fallback : sceneChar.mood)
   * - mode scène    → sceneChar.mood
   */
  const getActiveMood = useCallback(
    (characterId: string): string => {
      const sc = sceneCharacters.find((s) => s.characterId === characterId);
      if (!sc) return 'neutral';
      if (isDialogueMode && selectedDialogue) {
        return selectedDialogue.characterMoods?.[sc.id] ?? sc.mood ?? 'neutral';
      }
      return sc.mood ?? 'neutral';
    },
    [sceneCharacters, isDialogueMode, selectedDialogue]
  );

  /**
   * Clic sur une carte :
   * - mode dialogue → met à jour characterMoods du dialogue sélectionné
   * - mode scène    → met à jour sceneChar.mood (reflété immédiatement sur le canvas)
   */
  const handleMoodClick = useCallback(
    (characterId: string, mood: string) => {
      if (!selectedSceneId) return;
      const targets = sceneCharacters.filter((sc) => sc.characterId === characterId);
      if (isDialogueMode && dialogueSelection) {
        const prev = selectedDialogue?.characterMoods || {};
        const next = { ...prev };
        targets.forEach((sc) => {
          next[sc.id] = mood;
        });
        updateDialogue(dialogueSelection.sceneId, dialogueSelection.index, {
          characterMoods: next,
        });
      } else {
        targets.forEach((sc) => updateSceneCharacter(selectedSceneId, sc.id, { mood }));
      }
    },
    [
      selectedSceneId,
      sceneCharacters,
      isDialogueMode,
      dialogueSelection,
      selectedDialogue,
      updateDialogue,
      updateSceneCharacter,
    ]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, characterId: string, mood: string) => {
      const dragData = { type: 'character', characterId, mood };
      e.dataTransfer.setData('text/x-drag-type', 'character');
      e.dataTransfer.setData('text/x-drag-type-character', '');
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'copy';
      onDragStart?.(characterId, mood);
    },
    [onDragStart]
  );

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
        <p className="text-xs text-[var(--color-text-muted)] text-center py-3">
          Aucun personnage sur cette scène.
        </p>
        <button
          onClick={() => useUIStore.getState().setActiveModal('characters')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-[var(--color-border-base)] text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Users size={13} aria-hidden="true" />
          Parcourir les personnages
        </button>
      </section>
    );
  }

  return (
    <section className="sp-sec" aria-label="Personnages sur la scène">
      <h3 className="sp-lbl">SUR SCÈNE</h3>

      {sceneChars.map((character) => {
        const moods = character.moods && character.moods.length > 0 ? character.moods : ['neutral'];
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleOpen(character.id);
              }}
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
                  <span className="text-xl" aria-hidden="true">
                    👤
                  </span>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                  {character.name}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {moods.length} humeur{moods.length !== 1 ? 's' : ''}
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
                    {/* Deck de cartes — style Pokémon/Hearthstone */}
                    <div className="grid grid-cols-3 gap-2">
                      {moods.map((mood, idx) => {
                        const sprite = character.sprites?.[mood];
                        const isActive = activeMood === mood;
                        const moodEmoji = getMoodEmoji(mood);
                        const moodLabel = getMoodLabel(mood);
                        return (
                          <motion.button
                            key={mood}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoodClick(character.id, mood);
                            }}
                            /* Entrée : les cartes sont distribuées une par une */
                            initial={{ opacity: 0, y: 12, rotateZ: -2 }}
                            animate={{ opacity: 1, y: isActive ? -5 : 0, rotateZ: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 22,
                              delay: idx * 0.05,
                            }}
                            whileHover={{ y: isActive ? -7 : -5, transition: { duration: 0.12 } }}
                            whileTap={{ scale: 0.93, y: 0 }}
                            aria-pressed={isActive}
                            aria-label={`${character.name} — ${moodLabel}`}
                            style={{
                              position: 'relative',
                              aspectRatio: '3 / 4',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                              boxShadow: isActive
                                ? '0 6px 20px var(--color-primary-45), 0 0 0 1px var(--color-primary-25)'
                                : '0 3px 10px rgba(0,0,0,0.35)',
                              cursor: 'pointer',
                              background: 'var(--color-bg-elevated)',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            {/* Image pleine carte — pas de crop circulaire */}
                            {sprite ? (
                              <img
                                src={convertFileSrcIfNeeded(sprite)}
                                alt={`${character.name} ${moodLabel}`}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                                draggable="false"
                              />
                            ) : (
                              /* Pas de sprite : grand emoji centré sur fond dégradé */
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.75rem',
                                  background: isActive
                                    ? 'linear-gradient(135deg, var(--color-primary-20) 0%, var(--color-primary-05) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
                                }}
                              >
                                {moodEmoji}
                              </div>
                            )}

                            {/* Badge emoji — coin haut-droit */}
                            <span
                              aria-hidden="true"
                              style={{
                                position: 'absolute',
                                top: 3,
                                right: 4,
                                fontSize: '11px',
                                lineHeight: 1,
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                              }}
                            >
                              {moodEmoji}
                            </span>

                            {/* Label — overlay gradient au bas, style carte */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '14px 5px 5px',
                                background: isActive
                                  ? 'linear-gradient(to top, rgba(88,28,235,0.92) 0%, var(--color-primary-glow) 55%, transparent 100%)'
                                  : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
                                textAlign: 'center',
                              }}
                            >
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  color: 'white',
                                  lineHeight: 1.2,
                                  textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {moodLabel}
                              </span>
                            </div>
                          </motion.button>
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
