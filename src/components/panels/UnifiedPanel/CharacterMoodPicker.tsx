import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import { useCharactersStore } from '@/stores';
import { useUIStore } from '@/stores';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useSceneCharacters } from '@/stores/selectors';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { isDialogueSelection } from '@/stores/selectionStore.types';
import { convertFileSrcIfNeeded } from '@/utils/tauri';
import { getMoodLabel, getMoodEmoji } from '@/hooks/useMoodPresets';

export interface CharacterMoodPickerProps {
  onDragStart?: (characterId: string, mood: string) => void;
}

/**
 * CharacterMoodPicker — Bibliothèque + humeurs.
 *
 * Section 1 — BIBLIOTHÈQUE : tous les personnages du projet en grille 2 col
 *   draggable vers le canvas pour les ajouter à la scène.
 *
 * Section 2 — SUR SCÈNE : accordéon humeurs (visible seulement si des
 *   personnages sont déjà présents sur la scène courante).
 */
export function CharacterMoodPicker({ onDragStart }: CharacterMoodPickerProps) {
  const characters = useCharactersStore((state) => state.characters);
  const selectedSceneId = useUIStore((s) => s.selectedSceneForEdit);
  const sceneCharacters = useSceneCharacters(selectedSceneId);
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

  // Set pour lookup O(1) + tableau ordonné pour l'accordéon
  const sceneCharIdSet = new Set(sceneCharacters.map((sc) => sc.characterId));
  const sceneChars = [...sceneCharIdSet]
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as typeof characters;

  const [openId, setOpenId] = useState<string | null>(null);
  const [moodSectionOpen, setMoodSectionOpen] = useState(true);

  const toggleOpen = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

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

  // Pas de scène sélectionnée
  if (!selectedSceneId) {
    return (
      <section className="sp-sec">
        <p className="text-xs text-[var(--color-text-muted)] text-center py-4">
          Sélectionne une scène pour voir ses personnages.
        </p>
      </section>
    );
  }

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — BIBLIOTHÈQUE (tous les personnages, draggables)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="sp-sec" aria-label="Bibliothèque de personnages">
        {/* En-tête */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <h3
            className="sp-lbl"
            style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            BIBLIOTHÈQUE
            {characters.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-bg-base)',
                  borderRadius: 99,
                  padding: '1px 6px',
                  lineHeight: '16px',
                }}
              >
                {characters.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => useUIStore.getState().setActiveModal('characters')}
            aria-label="Créer un personnage"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--color-primary)',
              background: 'rgba(139,92,246,0.12)',
              border: '1.5px solid rgba(139,92,246,0.35)',
              borderRadius: 7,
              padding: '4px 9px',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            <Plus size={10} aria-hidden="true" />
            Nouveau
          </button>
        </div>

        {characters.length === 0 ? (
          /* Empty state — aucun personnage créé */
          <div style={{ textAlign: 'center', padding: '28px 8px' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 8 }}>👤</div>
            <p
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              Aucun personnage créé.
              <br />
              Crée ton premier héros !
            </p>
            <button
              onClick={() => useUIStore.getState().setActiveModal('characters')}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'white',
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: 9,
                padding: '8px 18px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(139,92,246,0.5)',
              }}
            >
              + Créer un personnage
            </button>
          </div>
        ) : (
          /* Grille 2 colonnes — cartes style Pokémon */
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}
            role="list"
            aria-label="Personnages disponibles"
          >
            {characters.map((character, idx) => {
              const isOnScene = sceneCharIdSet.has(character.id);
              const firstMood = character.moods?.[0] || 'neutral';
              const sprite = character.sprites?.[firstMood];
              const moodCount = character.moods?.length ?? 0;

              return (
                /* motion.div = animations uniquement (pas de drag framer-motion).
                   Le div interne gère le HTML5 DnD natif — évite le conflit de types
                   entre onDragStart framer-motion (PointerEvent) et React.DragEvent. */
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 16, rotateZ: -1.5 }}
                  animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 340,
                    damping: 24,
                    delay: idx * 0.045,
                  }}
                  whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.12 } }}
                  whileTap={{ scale: 0.92, y: 0 }}
                  style={{ aspectRatio: '3 / 4' }}
                >
                  <div
                    role="listitem"
                    draggable
                    onDragStart={(e) => handleDragStart(e, character.id, firstMood)}
                    aria-label={`Glisser ${character.name} vers la scène`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                    }}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: 13,
                      overflow: 'hidden',
                      border: `2px solid ${isOnScene ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                      boxShadow: isOnScene
                        ? '0 6px 22px rgba(139,92,246,0.45), 0 0 0 1px rgba(139,92,246,0.2)'
                        : '0 4px 14px rgba(0,0,0,0.4)',
                      cursor: 'grab',
                      background: 'var(--color-bg-elevated)',
                      userSelect: 'none',
                    }}
                  >
                    {/* Sprite pleine carte */}
                    {sprite ? (
                      <img
                        src={convertFileSrcIfNeeded(sprite)}
                        alt={character.name}
                        draggable="false"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2.6rem',
                          background: isOnScene
                            ? 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                        }}
                      >
                        👤
                      </div>
                    )}

                    {/* Badge violet "✓" — déjà sur scène (haut-gauche) */}
                    {isOnScene && (
                      <span
                        aria-label="Déjà présent sur la scène"
                        style={{
                          position: 'absolute',
                          top: 5,
                          left: 5,
                          fontSize: 9,
                          lineHeight: 1,
                          fontWeight: 800,
                          background: 'var(--color-primary)',
                          color: 'white',
                          borderRadius: 99,
                          padding: '2px 6px',
                          boxShadow: '0 2px 8px rgba(139,92,246,0.65)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        ✓ scène
                      </span>
                    )}

                    {/* Badge mood count (haut-droit) */}
                    {moodCount > 0 && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          fontSize: 9,
                          lineHeight: 1,
                          fontWeight: 700,
                          background: 'rgba(0,0,0,0.6)',
                          color: 'rgba(255,255,255,0.9)',
                          borderRadius: 99,
                          padding: '2px 5px',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {moodCount} {getMoodEmoji(firstMood)}
                      </span>
                    )}

                    {/* Overlay gradient bas — nom + hint drag */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '22px 6px 7px',
                        background: isOnScene
                          ? 'linear-gradient(to top, rgba(55,10,180,0.93) 0%, rgba(88,28,235,0.65) 55%, transparent 100%)'
                          : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)',
                        textAlign: 'center',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: 'white',
                          lineHeight: 1.2,
                          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                          letterSpacing: '0.03em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {character.name}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 8,
                          color: 'rgba(255,255,255,0.55)',
                          marginTop: 2,
                          letterSpacing: '0.04em',
                        }}
                      >
                        ↕ glisser
                      </span>
                    </div>
                  </div>
                  {/* /drag div */}
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — SUR SCÈNE (accordéon humeurs — visible si chars présents)
      ══════════════════════════════════════════════════════════════════ */}
      {sceneChars.length > 0 && (
        <section
          className="sp-sec"
          aria-label="Humeurs des personnages sur la scène"
          style={{ borderTop: '1px solid var(--color-border-base)', paddingTop: 10 }}
        >
          {/* Header collapsible */}
          <button
            onClick={() => setMoodSectionOpen((p) => !p)}
            aria-expanded={moodSectionOpen}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginBottom: moodSectionOpen ? 8 : 0,
              padding: 0,
            }}
            className="sp-lbl"
          >
            <span>
              SUR SCÈNE
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-bg-base)',
                  borderRadius: 99,
                  padding: '1px 6px',
                }}
              >
                {sceneChars.length}
              </span>
            </span>
            <motion.span
              animate={{ rotate: moodSectionOpen ? 90 : 0 }}
              transition={{ duration: 0.16 }}
              style={{ display: 'flex' }}
            >
              <ChevronRight size={12} aria-hidden="true" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {moodSectionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {sceneChars.map((character) => {
                  const moods =
                    character.moods && character.moods.length > 0 ? character.moods : ['neutral'];
                  const activeMood = getActiveMood(character.id);
                  const isOpen = openId === character.id;
                  const activeSprite = character.sprites?.[activeMood];

                  return (
                    <div key={character.id}>
                      {/* Ligne perso */}
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
                        {/* Avatar circulaire */}
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

                        {/* Nom + humeur active */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                            {character.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {getMoodEmoji(activeMood)} {getMoodLabel(activeMood)}
                          </p>
                        </div>

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
                                      initial={{ opacity: 0, y: 12, rotateZ: -2 }}
                                      animate={{ opacity: 1, y: isActive ? -5 : 0, rotateZ: 0 }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 380,
                                        damping: 22,
                                        delay: idx * 0.05,
                                      }}
                                      whileHover={{
                                        y: isActive ? -7 : -5,
                                        transition: { duration: 0.12 },
                                      }}
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
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}

export default CharacterMoodPicker;
