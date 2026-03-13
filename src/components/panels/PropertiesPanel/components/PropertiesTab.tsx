import * as React from 'react';
import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Dialogue, Scene, Character, ModalType, DialogueAudio } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { VoicePresetPicker, VoicePresetBadge } from '@/components/dialogue-editor/DialogueComposer/components/VoicePresetPicker';
import { VOICE_PROFILES, playVoicePreview } from '@/utils/voiceProfiles';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import { MoodCard } from '@/components/ui/MoodCard';
import { Volume2, X, User, MessageSquare } from 'lucide-react';
import { AUDIO_DEFAULTS } from '@/config/constants';
import type { useTranslation } from '@/i18n';
import { SectionCard, SectionHeader } from './FormSectionHelpers';

interface PropertiesTabProps {
  dialogue: Dialogue;
  scene: Scene;
  characters: Character[];
  dialogueIndex: number;
  isKid: boolean;
  t: ReturnType<typeof useTranslation>['t'];
  onUpdate: (updates: Partial<Dialogue>) => void;
  onOpenModal?: (modalType: ModalType, config?: { category?: string; targetSceneId?: string }) => void;
}

export function PropertiesTab({ dialogue, scene, characters, dialogueIndex, isKid, t, onUpdate, onOpenModal }: PropertiesTabProps) {
  const [sfxOpen,         setSfxOpen]         = useState(!!dialogue.sfx?.url);
  const [moodsOpen,       setMoodsOpen]       = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">

      {/* ── Texte — kid mode only (en Pro : onglet Texte) ── */}
      {isKid && (
        <SectionCard>
          <SectionHeader
            icon={<MessageSquare className="h-3.5 w-3.5" />}
            label="Ce qu'il dit :"
            colorClass="text-violet-400"
          />
          <div className="px-3 py-2.5">
            <textarea
              value={dialogue.text || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ text: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              placeholder="Saisir le texte du dialogue…"
            />
          </div>
        </SectionCard>
      )}

      {/* ── Personnage ── */}
      <SectionCard>
        <SectionHeader
          icon={<User className="h-3.5 w-3.5" />}
          label={isKid ? 'Qui parle ?' : t('dialogueEditor.speaker')}
          colorClass="text-blue-400"
        />
        <div className="px-3 py-2.5">
          <select
            id="dialogue-speaker"
            value={dialogue.speaker || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate({ speaker: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">--</option>
            {characters.map(char => (
              <option key={char.id} value={char.id}>{char.name}</option>
            ))}
          </select>
        </div>
      </SectionCard>

      {/* ── Effet sonore (accordéon) — Pro only ── */}
      {!isKid && (
        <SectionCard>
          <SectionHeader
            icon={<Volume2 className="h-3.5 w-3.5" />}
            label={t('dialogueEditor.sfxLabel')}
            colorClass="text-amber-400"
            badge={dialogue.voicePreset ? '🎙️' : dialogue.sfx?.url ? '1 son' : undefined}
            isCollapsible
            isOpen={sfxOpen}
            onToggle={() => setSfxOpen(v => !v)}
          />
          <InlineAccordion isOpen={sfxOpen}>
            <div className="px-3 py-3 space-y-3">

              {/* Voix procédurale */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Voix du personnage
                  </span>
                  <div className="flex items-center gap-1.5">
                    {dialogue.voicePreset && <VoicePresetBadge presetId={dialogue.voicePreset} />}
                    <button
                      ref={voiceBtnRef}
                      type="button"
                      onClick={() => setVoicePickerOpen(v => !v)}
                      title={dialogue.voicePreset ? 'Changer la voix' : 'Ajouter une voix'}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24,
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${dialogue.voicePreset ? 'rgba(139,92,246,0.5)' : 'var(--color-border-base)'}`,
                        background: dialogue.voicePreset ? 'rgba(139,92,246,0.12)' : 'transparent',
                        color: dialogue.voicePreset ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <Volume2 size={11} />
                    </button>
                  </div>
                </div>
                {/* Chips rapides — profils principaux */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {VOICE_PROFILES.filter(p => p.category !== 'animal').slice(0, 6).map(profile => {
                    const isActive = dialogue.voicePreset === profile.id;
                    return (
                      <motion.button
                        key={profile.id}
                        type="button"
                        onClick={() => onUpdate({ voicePreset: isActive ? undefined : profile.id })}
                        onMouseEnter={() => playVoicePreview(profile.id)}
                        whileHover={{ y: -1, scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        aria-pressed={isActive}
                        title={profile.label}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          padding: '3px 7px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                          background: isActive ? 'rgba(139,92,246,0.18)' : 'var(--color-bg-base)',
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          fontSize: '10px', fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        <span>{profile.emoji}</span>
                        <span>{profile.label}</span>
                      </motion.button>
                    );
                  })}
                  <motion.button
                    type="button"
                    onClick={() => setVoicePickerOpen(v => !v)}
                    whileHover={{ y: -1 }}
                    title="Voir toutes les voix"
                    style={{
                      padding: '3px 7px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--color-border-base)',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      fontSize: '10px', cursor: 'pointer',
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
                      onChange={(presetId) => onUpdate({ voicePreset: presetId })}
                      onClose={() => setVoicePickerOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* SFX fichier custom */}
              {dialogue.sfx?.url ? (
                <>
                  <div className="flex items-center gap-2 p-2 bg-background/60 rounded-lg border border-border/40">
                    <div className="w-7 h-7 rounded bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <p className="text-xs font-medium text-foreground truncate flex-1">
                      {dialogue.sfx.url.split('/').pop()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => onUpdate({ sfx: undefined })}
                      aria-label={t('common.delete')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('dialogueEditor.sfxVolume')}</span>
                      <span className="text-xs font-semibold text-amber-400">
                        {Math.round((dialogue.sfx.volume || AUDIO_DEFAULTS.SFX_VOLUME) * 100)} %
                      </span>
                    </div>
                    <Slider
                      value={[(dialogue.sfx.volume || AUDIO_DEFAULTS.SFX_VOLUME) * 100]}
                      onValueChange={([v]) => onUpdate({
                        sfx: { ...dialogue.sfx, volume: v / 100 } as DialogueAudio
                      })}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => onOpenModal?.('assets', { category: 'sfx' })}
                  >
                    {t('dialogueEditor.sfxChange')}
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => onOpenModal?.('assets', { category: 'sfx' })}
                  className="w-full h-10 rounded-lg border border-dashed border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/5 flex items-center justify-center gap-2 text-muted-foreground hover:text-amber-400 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Ajouter un son custom</span>
                </button>
              )}
            </div>
          </InlineAccordion>
        </SectionCard>
      )}

      {/* ── Humeurs (accordéon) — Pro only ── */}
      {!isKid && scene.characters && scene.characters.length > 0 && (
        <SectionCard>
          <SectionHeader
            emoji="😊"
            label={t('dialogueEditor.moodsLabel')}
            colorClass="text-emerald-400"
            badge={String(scene.characters.length)}
            isCollapsible
            isOpen={moodsOpen}
            onToggle={() => setMoodsOpen(v => !v)}
          />
          <InlineAccordion isOpen={moodsOpen}>
            <div className="px-3 py-3 space-y-3">
              {scene.characters.map(sceneChar => {
                const character = characters.find(c => c.id === sceneChar.characterId);
                if (!character) return null;
                const overrideMood = dialogue.characterMoods?.[sceneChar.id] ?? '';
                const availableMoods: string[] = character.moods?.length ? character.moods : ['neutral'];
                const setMood = (val: string) => {
                  const next = { ...(dialogue.characterMoods || {}) };
                  if (val) { next[sceneChar.id] = val; } else { delete next[sceneChar.id]; }
                  onUpdate({ characterMoods: Object.keys(next).length > 0 ? next : undefined });
                };
                return (
                  <div key={sceneChar.id}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                      {character.name}
                    </span>
                    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 3, scrollbarWidth: 'none' }}>
                      <motion.button
                        type="button"
                        onClick={() => setMood('')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.93 }}
                        aria-pressed={!overrideMood}
                        style={{
                          flexShrink: 0, padding: '3px 8px', borderRadius: 6,
                          border: `2px solid ${!overrideMood ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                          background: !overrideMood ? 'rgba(139,92,246,0.15)' : 'transparent',
                          color: !overrideMood ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          fontSize: '9.5px', fontWeight: 700, cursor: 'pointer',
                          boxShadow: !overrideMood ? '0 3px 10px rgba(139,92,246,0.3)' : 'none',
                        }}
                      >
                        ✦ Défaut
                      </motion.button>
                      {availableMoods.map((mood, idx) => (
                        <MoodCard
                          key={mood}
                          mood={mood}
                          emoji={getMoodEmoji(mood)}
                          label={getMoodLabel(mood)}
                          sprite={character.sprites?.[mood]}
                          isActive={overrideMood === mood}
                          onClick={() => setMood(overrideMood === mood ? '' : mood)}
                          size={40}
                          entryDelay={idx * 0.04}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </InlineAccordion>
        </SectionCard>
      )}

      {/* Info — badges compacts */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          {t('dialogueEditor.infoLabel')}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Index</span>
          <span className="font-bold text-foreground bg-muted/50 rounded px-2 py-0.5 min-w-[1.5rem] text-center">
            {dialogueIndex}
          </span>
          <span>{t('dialogueEditor.choicesTab')}</span>
          <span className="font-bold text-foreground bg-muted/50 rounded px-2 py-0.5 min-w-[1.5rem] text-center">
            {dialogue.choices?.length || 0}
          </span>
        </div>
      </div>

    </div>
  );
}
