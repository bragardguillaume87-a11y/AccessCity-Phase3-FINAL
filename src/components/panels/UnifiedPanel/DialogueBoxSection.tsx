import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, User, MessageSquare, GitBranch, Volume2, X, Plus } from 'lucide-react';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useScenesStore } from '@/stores/scenesStore';
import { useSceneWithElements } from '@/stores/selectors';
import { isDialogueSelection } from '@/stores/selectionStore.types';
import { ChoiceEditor } from '../PropertiesPanel/components/ChoiceEditor';
import {
  VoicePresetPicker,
  VoicePresetBadge,
} from '@/components/dialogue-editor/DialogueComposer/components/VoicePresetPicker';
import { VOICE_PROFILES, playVoicePreview } from '@/utils/voiceProfiles';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import { MoodCard } from '@/components/ui/MoodCard';
import type { Dialogue } from '@/types';

// ============================================================================
// DIALOGUE COURANT — propriétés du dialogue sélectionné
// ============================================================================

/**
 * DialogueEditorInner — lit le dialogue sélectionné depuis les stores et permet son édition.
 * Monté uniquement quand un dialogue est actif (via DialogueCurrentSection).
 */
function DialogueEditorInner({ sceneId, index }: { sceneId: string; index: number }) {
  const updateDialogue = useDialoguesStore((s) => s.updateDialogue);
  const dialogue = useDialoguesStore((s) => s.getDialoguesByScene(sceneId)[index]);
  const characters = useCharactersStore((s) => s.characters);
  const scenes = useScenesStore((s) => s.scenes);
  const scene = useSceneWithElements(sceneId);

  const [choicesOpen, setChoicesOpen] = useState(false);
  const [sfxOpen, setSfxOpen] = useState(false);
  const [moodsOpen, setMoodsOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);

  if (!dialogue) return null;

  const handleUpdate = (updates: Partial<Dialogue>) => {
    updateDialogue(sceneId, index, updates);
  };

  const choiceCount = dialogue.choices?.length ?? 0;
  const sceneChars = scene?.characters ?? [];

  return (
    <>
      {/* Personnage */}
      <div className="mb-3">
        <div className="sp-row mb-1">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-blue-400" aria-hidden="true" />
            Personnage
          </span>
        </div>
        <select
          value={dialogue.speaker || ''}
          onChange={(e) => handleUpdate({ speaker: e.target.value })}
          className="w-full px-2.5 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        >
          <option value="">— Aucun —</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Texte */}
      <div className="mb-3">
        <div className="sp-row mb-1">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-violet-400" aria-hidden="true" />
            Texte
          </span>
        </div>
        <textarea
          value={dialogue.text || ''}
          onChange={(e) => handleUpdate({ text: e.target.value })}
          rows={4}
          className="w-full px-2.5 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
          placeholder="Saisir le texte du dialogue…"
        />
      </div>

      {/* Choix */}
      <div className="mb-1 rounded-lg border border-[var(--color-border-base)] overflow-hidden">
        <button
          type="button"
          onClick={() => setChoicesOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <GitBranch className="w-3 h-3 text-purple-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex-1">
            Choix {choiceCount > 0 ? `(${choiceCount})` : ''}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${choicesOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <InlineAccordion isOpen={choicesOpen}>
          <div className="px-3 pb-3 pt-1 space-y-2">
            <button
              type="button"
              onClick={() =>
                handleUpdate({
                  choices: [
                    ...(dialogue.choices || []),
                    {
                      id: `choice-${Date.now()}`,
                      text: 'Nouveau choix',
                      nextSceneId: '',
                      effects: [],
                    },
                  ],
                })
              }
              className="w-full flex items-center justify-center gap-1 py-1.5 rounded border border-dashed border-[var(--color-border-base)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Ajouter un choix
            </button>
            {choiceCount > 0 &&
              dialogue.choices.map((choice, ci) => (
                <ChoiceEditor
                  key={ci}
                  choice={choice}
                  choiceIndex={ci}
                  onUpdate={(idx, updated) => {
                    const next = [...dialogue.choices];
                    next[idx] = updated;
                    handleUpdate({ choices: next });
                  }}
                  onDelete={(idx) =>
                    handleUpdate({ choices: dialogue.choices.filter((_, i) => i !== idx) })
                  }
                  scenes={scenes}
                  currentSceneId={sceneId}
                />
              ))}
          </div>
        </InlineAccordion>
      </div>

      {/* SFX + Voix procédurale */}
      <div className="mb-1 rounded-lg border border-[var(--color-border-base)] overflow-hidden">
        <button
          type="button"
          onClick={() => setSfxOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Volume2 className="w-3 h-3 text-amber-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex-1">
            Effet sonore {dialogue.voicePreset ? '· 🎙️' : dialogue.sfx?.url ? '· 1 son' : ''}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${sfxOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <InlineAccordion isOpen={sfxOpen}>
          <div className="px-3 pb-3 pt-2 space-y-3">
            {/* Voix procédurale */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Voix du personnage
                </span>
                <div className="flex items-center gap-1">
                  {dialogue.voicePreset && <VoicePresetBadge presetId={dialogue.voicePreset} />}
                  <button
                    ref={voiceBtnRef}
                    type="button"
                    onClick={() => setVoicePickerOpen((v) => !v)}
                    title={dialogue.voicePreset ? 'Changer la voix' : 'Toutes les voix'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${dialogue.voicePreset ? 'var(--color-primary-glow)' : 'var(--color-border-base)'}`,
                      background: dialogue.voicePreset
                        ? 'var(--color-primary-subtle)'
                        : 'transparent',
                      color: dialogue.voicePreset
                        ? 'var(--color-primary)'
                        : 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <Volume2 size={10} />
                  </button>
                </div>
              </div>
              {/* Chips rapides */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {VOICE_PROFILES.filter((p) => p.category !== 'animal')
                  .slice(0, 6)
                  .map((profile) => {
                    const isActive = dialogue.voicePreset === profile.id;
                    return (
                      <motion.button
                        key={profile.id}
                        type="button"
                        onClick={() =>
                          handleUpdate({ voicePreset: isActive ? undefined : profile.id })
                        }
                        onMouseEnter={() => playVoicePreview(profile.id)}
                        whileHover={{ y: -1, scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        aria-pressed={isActive}
                        title={profile.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                          background: isActive
                            ? 'var(--color-primary-muted)'
                            : 'var(--color-bg-base)',
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          fontSize: '10px',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>{profile.emoji}</span>
                        <span>{profile.label}</span>
                      </motion.button>
                    );
                  })}
                <motion.button
                  type="button"
                  onClick={() => setVoicePickerOpen((v) => !v)}
                  whileHover={{ y: -1 }}
                  title="Voir toutes les voix"
                  style={{
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--color-border-base)',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  +
                </motion.button>
              </div>
              <AnimatePresence>
                {voicePickerOpen && (
                  <VoicePresetPicker
                    anchorRef={voiceBtnRef}
                    value={dialogue.voicePreset}
                    onChange={(presetId) => handleUpdate({ voicePreset: presetId })}
                    onClose={() => setVoicePickerOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* SFX fichier custom */}
            {dialogue.sfx?.url && (
              <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-base)] rounded-lg border border-[var(--color-border-base)]">
                <Volume2 className="h-3 w-3 text-amber-400 flex-shrink-0" />
                <span className="text-xs text-[var(--color-text-primary)] truncate flex-1">
                  {dialogue.sfx.url.split('/').pop()}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdate({ sfx: undefined })}
                  className="h-5 w-5 flex items-center justify-center text-red-400 hover:text-red-300 rounded"
                  aria-label="Supprimer le son"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </InlineAccordion>
      </div>

      {/* Humeurs — cartes Nintendo style */}
      {sceneChars.length > 0 && (
        <div className="mb-1 rounded-lg border border-[var(--color-border-base)] overflow-hidden">
          <button
            type="button"
            onClick={() => setMoodsOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <span className="text-xs" aria-hidden="true">
              😊
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex-1">
              Humeurs ({sceneChars.length})
            </span>
            <ChevronDown
              className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${moodsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <InlineAccordion isOpen={moodsOpen}>
            <div className="px-3 pb-3 pt-2 space-y-3">
              {sceneChars.map((sc) => {
                const char = characters.find((c) => c.id === sc.characterId);
                if (!char) return null;
                const activeMood = dialogue.characterMoods?.[sc.id] ?? '';
                const moods = char.moods?.length ? char.moods : ['neutral'];
                const setMood = (val: string) => {
                  const next = { ...(dialogue.characterMoods || {}) };
                  if (val) {
                    next[sc.id] = val;
                  } else {
                    delete next[sc.id];
                  }
                  handleUpdate({ characterMoods: Object.keys(next).length > 0 ? next : undefined });
                };
                return (
                  <div key={sc.id}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'block',
                        marginBottom: 5,
                      }}
                    >
                      {char.name}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        overflowX: 'auto',
                        paddingBottom: 2,
                        scrollbarWidth: 'none',
                      }}
                    >
                      {/* Chip Défaut */}
                      <motion.button
                        type="button"
                        onClick={() => setMood('')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.93 }}
                        aria-pressed={!activeMood}
                        style={{
                          flexShrink: 0,
                          padding: '3px 7px',
                          borderRadius: 6,
                          border: `2px solid ${!activeMood ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                          background: !activeMood ? 'var(--color-primary-15)' : 'transparent',
                          color: !activeMood ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          fontSize: '9px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: !activeMood ? '0 3px 10px var(--color-primary-30)' : 'none',
                        }}
                      >
                        ✦ Défaut
                      </motion.button>
                      {/* Cartes humeur */}
                      {moods.map((mood, idx) => (
                        <MoodCard
                          key={mood}
                          mood={mood}
                          emoji={getMoodEmoji(mood)}
                          label={getMoodLabel(mood)}
                          sprite={char.sprites?.[mood]}
                          isActive={activeMood === mood}
                          onClick={() => setMood(activeMood === mood ? '' : mood)}
                          size={38}
                          entryDelay={idx * 0.04}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </InlineAccordion>
        </div>
      )}
    </>
  );
}

/**
 * DialogueCurrentSection — wrapper conditionnel.
 * Monte DialogueEditorInner uniquement quand un dialogue est actif dans selectionStore.
 */
function DialogueCurrentSection() {
  const selectedElement = useSelectionStore((s) => s.selectedElement);

  if (!isDialogueSelection(selectedElement)) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <MessageSquare
          className="w-8 h-8 text-[var(--color-text-secondary)] mb-3"
          aria-hidden="true"
        />
        <p className="text-xs text-[var(--color-text-secondary)]">
          Sélectionne un dialogue dans la liste pour éditer ses propriétés
        </p>
      </div>
    );
  }

  const { sceneId, index } = selectedElement;

  return (
    <section className="sp-sec" aria-label="Dialogue sélectionné">
      <h3 className="sp-lbl">DIALOGUE {String(index + 1).padStart(2, '00')}</h3>
      <DialogueEditorInner sceneId={sceneId} index={index} />
    </section>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * DialogueBoxSection — Panneau d'édition du dialogue sélectionné.
 *
 * Affiche les propriétés du dialogue actif : Personnage, Texte, Choix, SFX, Humeurs.
 * Les paramètres globaux (Aperçu, Texte, Apparence, Portrait) sont dans TextSection.
 */
export function DialogueBoxSection() {
  return (
    <div>
      <DialogueCurrentSection />
    </div>
  );
}
