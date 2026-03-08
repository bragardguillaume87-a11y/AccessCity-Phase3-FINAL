import * as React from 'react';
import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Dialogue, Scene, SceneMetadata, Character, ModalType, DialogueAudio } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator';
import { ChoiceEditor } from './ChoiceEditor';
import { VoicePresetPicker, VoicePresetBadge } from '@/components/dialogue-editor/DialogueComposer/components/VoicePresetPicker';
import { VOICE_PROFILES, playVoicePreview } from '@/utils/voiceProfiles';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import { MoodCard } from '@/components/ui/MoodCard';
import { Copy, Plus, Volume2, X, Sparkles, User, MessageSquare, ChevronDown, SlidersHorizontal, GitBranch, Type, Eye, Palette } from 'lucide-react';
import { useUIStore } from '@/stores';
import { useIsKidMode } from '@/hooks/useIsKidMode';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { useTranslation } from '@/i18n';

export interface DialoguePropertiesFormProps {
  dialogue: Dialogue;
  dialogueIndex: number;
  scene: Scene;
  characters: Character[];
  scenes: SceneMetadata[];  // Metadata uniquement (title/id pour navigation)
  onUpdate: (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>) => void;
  onDuplicate: () => void;
  onOpenModal?: (modalType: ModalType, config?: { category?: string; targetSceneId?: string }) => void;
  lastSaved?: number;
  isSaving?: boolean;
}

type TabType = 'properties' | 'text' | 'choices';

// ── Helpers visuels locaux (pattern Audio panel) ──────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 overflow-hidden bg-background/30">
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  icon?: React.ReactNode;
  emoji?: string;
  label: string;
  /** Couleur Tailwind appliquée à l'icône et au label (ex: "text-blue-400") */
  colorClass?: string;
  /** Active le comportement accordéon */
  isCollapsible?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  /** Badge optionnel affiché à droite (ex: "1 piste") */
  badge?: string;
}

function SectionHeader({
  icon, emoji, label,
  colorClass = 'text-muted-foreground',
  isCollapsible = false, isOpen = true, onToggle, badge,
}: SectionHeaderProps) {
  const inner = (
    <div className="px-3 py-2.5 bg-background/60 border-b border-border/50 flex items-center gap-2">
      {emoji && <span className="text-sm leading-none">{emoji}</span>}
      {icon && <span className={colorClass}>{icon}</span>}
      <span className={`text-xs font-semibold uppercase tracking-wider flex-1 ${colorClass}`}>
        {label}
      </span>
      {badge && <span className="text-xs text-muted-foreground">{badge}</span>}
      {isCollapsible && (
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      )}
    </div>
  );
  if (isCollapsible) {
    return <button type="button" onClick={onToggle} className="w-full text-left">{inner}</button>;
  }
  return inner;
}

// InlineAccordion et MoodCard importés depuis ui/ — pas de redéfinition locale.

/**
 * DialoguePropertiesForm - Edit dialogue properties
 *
 * Displays and allows editing of:
 * - Speaker selection
 * - Dialogue text
 * - Choices (with add/delete)
 * - Character moods per dialogue
 * - Sound effect (SFX)
 */
export function DialoguePropertiesForm({
  dialogue,
  dialogueIndex,
  scene,
  characters,
  scenes,
  onUpdate,
  onDuplicate,
  onOpenModal,
  lastSaved,
  isSaving,
}: DialoguePropertiesFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  // Accordéons Propriétés
  const [sfxOpen,          setSfxOpen]          = useState(!!dialogue.sfx?.url);
  const [moodsOpen,        setMoodsOpen]        = useState(false);
  const [voicePickerOpen,  setVoicePickerOpen]  = useState(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);
  // Accordéons Texte
  const [apparenceOpen, setApparenceOpen] = useState(false);
  const [aperçuOpen,    setAperçuOpen]    = useState(false);

  // Helper — mise à jour partielle de boxStyle
  const handleUpdateBoxStyle = (patch: Partial<NonNullable<typeof dialogue.boxStyle>>) => {
    handleUpdate({ boxStyle: { ...dialogue.boxStyle, ...patch } });
  };
  const boxStyle = dialogue.boxStyle ?? {};
  const setWizardOpen = useUIStore(state => state.setDialogueWizardOpen);
  const setEditDialogueIndex = useUIStore(state => state.setDialogueWizardEditIndex);
  const { t } = useTranslation();
  const isKid = useIsKidMode();

  const handleUpdate = (updates: Partial<Dialogue>) => {
    onUpdate(scene.id, dialogueIndex, updates);
  };

  const handleAddChoice = () => {
    const newChoice = {
      id: `choice-${Date.now()}`,
      text: 'New choice',
      nextSceneId: '',
      effects: []
    };
    const updatedChoices = [...(dialogue.choices || []), newChoice];
    handleUpdate({ choices: updatedChoices });
  };

  const handleUpdateChoice = (choiceIndex: number, updatedChoice: Dialogue['choices'][number]) => {
    const updatedChoices = [...(dialogue.choices || [])];
    updatedChoices[choiceIndex] = updatedChoice;
    handleUpdate({ choices: updatedChoices });
  };

  const handleDeleteChoice = (choiceIndex: number) => {
    const updatedChoices = dialogue.choices.filter((_, i) => i !== choiceIndex);
    handleUpdate({ choices: updatedChoices });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header with duplicate button — Dupliquer masqué en mode kid */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">{t('dialogueEditor.title')}</h3>
        {!isKid && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            title={t('dialogueEditor.duplicate')}
          >
            <Copy className="h-3 w-3" />
            {t('dialogueEditor.duplicate')}
          </Button>
        )}
      </div>

      {/* Tabs — Pro mode only */}
      {!isKid && (
        <div className="flex-shrink-0 border-b border-border bg-transparent p-1 grid grid-cols-3 gap-1">
          <button
            role="tab"
            aria-selected={activeTab === 'properties'}
            onClick={() => setActiveTab('properties')}
            className={`rounded-lg h-11 flex flex-col items-center justify-center gap-1 px-1 transition-all duration-200 ${
              activeTab === 'properties'
                ? 'bg-[var(--color-primary)] text-white shadow-none'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs leading-none font-semibold">{t('dialogueEditor.propertiesTab')}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'text'}
            onClick={() => setActiveTab('text')}
            className={`rounded-lg h-11 flex flex-col items-center justify-center gap-1 px-1 transition-all duration-200 ${
              activeTab === 'text'
                ? 'bg-[var(--color-primary)] text-white shadow-none'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Type className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs leading-none font-semibold">Texte</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'choices'}
            onClick={() => setActiveTab('choices')}
            className={`rounded-lg h-11 flex flex-col items-center justify-center gap-1 px-1 transition-all duration-200 ${
              activeTab === 'choices'
                ? 'bg-[var(--color-primary)] text-white shadow-none'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <GitBranch className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs leading-none font-semibold">
              {t('dialogueEditor.choicesTab')} ({dialogue.choices?.length || 0})
            </span>
          </button>
        </div>
      )}

      {/* ── Properties tab ─────────────────────────────────────────────────── */}
      {(isKid || activeTab === 'properties') && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* ── Texte — visible uniquement en mode kid (en Pro, c'est dans l'onglet Texte) ── */}
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate({ text: e.target.value })}
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdate({ speaker: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">--</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
            </div>
          </SectionCard>

          {/* ── Effet sonore (accordéon) ── Pro mode only */}
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

                  {/* ── Voix procédurale ── */}
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
                            onClick={() => handleUpdate({ voicePreset: isActive ? undefined : profile.id })}
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
                          onChange={(presetId) => handleUpdate({ voicePreset: presetId })}
                          onClose={() => setVoicePickerOpen(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── SFX fichier custom ── */}
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
                          onClick={() => handleUpdate({ sfx: undefined })}
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
                          onValueChange={([v]) => handleUpdate({
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

          {/* ── Humeurs (accordéon) ── Pro mode only */}
          {/* Nintendo principle: "universal symbols" — emoji chips vs raw text dropdown */}
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
                      handleUpdate({ characterMoods: Object.keys(next).length > 0 ? next : undefined });
                    };
                    return (
                      <div key={sceneChar.id}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                          {character.name}
                        </span>
                        {/* Cartes humeur — Nintendo style, scroll horizontal */}
                        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 3, scrollbarWidth: 'none' }}>
                          {/* Chip "Défaut" */}
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
                          {/* Cartes par humeur */}
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
      )}

      {/* ── Text tab ───────────────────────────────────────────────────────── */}
      {!isKid && activeTab === 'text' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* Textarea principale */}
          <SectionCard>
            <SectionHeader
              icon={<MessageSquare className="h-3.5 w-3.5" />}
              label={t('dialogueEditor.text')}
              colorClass="text-violet-400"
            />
            <div className="px-3 py-2.5">
              <textarea
                value={dialogue.text || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate({ text: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder={t('dialogueEditor.text')}
              />
            </div>
          </SectionCard>

          {/* Apparence — accordéon fermé par défaut */}
          <SectionCard>
            <SectionHeader
              icon={<Palette className="h-3.5 w-3.5" />}
              label="Apparence"
              colorClass="text-fuchsia-400"
              isCollapsible
              isOpen={apparenceOpen}
              onToggle={() => setApparenceOpen(v => !v)}
            />
            <InlineAccordion isOpen={apparenceOpen}>
              <div className="px-3 py-3 space-y-4">

                {/* Taille du texte */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Taille du texte</span>
                    <span className="text-xs font-semibold text-fuchsia-400">{boxStyle.fontSize ?? 15} px</span>
                  </div>
                  <Slider
                    value={[boxStyle.fontSize ?? 15]}
                    onValueChange={([v]) => handleUpdateBoxStyle({ fontSize: v })}
                    min={10} max={24} step={1}
                    className="w-full"
                  />
                </div>

                {/* Vitesse de frappe */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Vitesse de frappe</span>
                    <span className="text-xs font-semibold text-fuchsia-400">
                      {(boxStyle.typewriterSpeed ?? 40) <= 20 ? 'Rapide' : (boxStyle.typewriterSpeed ?? 40) <= 55 ? 'Normal' : 'Lent'}
                    </span>
                  </div>
                  <Slider
                    value={[boxStyle.typewriterSpeed ?? 40]}
                    onValueChange={([v]) => handleUpdateBoxStyle({ typewriterSpeed: v })}
                    min={10} max={100} step={5}
                    className="w-full"
                  />
                </div>

                {/* Position */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Position</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['top', 'center', 'bottom'] as const).map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleUpdateBoxStyle({ position: pos })}
                        className={`py-1.5 rounded text-xs font-medium transition-colors ${
                          (boxStyle.position ?? 'bottom') === pos
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {pos === 'top' ? 'Haut' : pos === 'center' ? 'Centre' : 'Bas'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacité du fond */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opacité du fond</span>
                    <span className="text-xs font-semibold text-fuchsia-400">
                      {Math.round((boxStyle.boxOpacity ?? 0.75) * 100)} %
                    </span>
                  </div>
                  <Slider
                    value={[(boxStyle.boxOpacity ?? 0.75) * 100]}
                    onValueChange={([v]) => handleUpdateBoxStyle({ boxOpacity: v / 100 })}
                    min={0} max={100} step={5}
                    className="w-full"
                  />
                </div>

                {/* Bordure */}
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Bordure</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['none', 'subtle', 'prominent'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleUpdateBoxStyle({ borderStyle: s })}
                        className={`py-1.5 rounded text-xs font-medium transition-colors ${
                          (boxStyle.borderStyle ?? 'subtle') === s
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {s === 'none' ? 'Aucune' : s === 'subtle' ? 'Subtile' : 'Forte'}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </InlineAccordion>
          </SectionCard>

          {/* Aperçu — accordéon fermé par défaut */}
          <SectionCard>
            <SectionHeader
              icon={<Eye className="h-3.5 w-3.5" />}
              label="Aperçu"
              colorClass="text-sky-400"
              isCollapsible
              isOpen={aperçuOpen}
              onToggle={() => setAperçuOpen(v => !v)}
            />
            <InlineAccordion isOpen={aperçuOpen}>
              <div className="px-3 py-3 space-y-2">
                {/* Simulation boîte de dialogue */}
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: `rgba(0,0,0,${boxStyle.boxOpacity ?? 0.75})`,
                    border: (boxStyle.borderStyle ?? 'subtle') === 'none'
                      ? '1px solid transparent'
                      : (boxStyle.borderStyle ?? 'subtle') === 'prominent'
                        ? '2px solid var(--color-primary)'
                        : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-primary)' }}>
                    {characters.find(c => c.id === dialogue.speaker)?.name || '—'}
                  </p>
                  <p style={{
                    fontSize: `${boxStyle.fontSize ?? 15}px`,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1.55,
                  }}>
                    {dialogue.text || '(aucun texte)'}
                  </p>
                </div>
                {/* Indicateur position */}
                <div className="flex justify-center">
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                    {(boxStyle.position ?? 'bottom') === 'top' ? '▲ Haut' : (boxStyle.position ?? 'bottom') === 'center' ? '● Centre' : '▼ Bas'}
                  </span>
                </div>
              </div>
            </InlineAccordion>
          </SectionCard>

        </div>
      )}

      {/* Choices tab — Pro mode only */}
      {!isKid && activeTab === 'choices' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Edit with assistant */}
          <Button
            variant="gaming-primary"
            size="default"
            onClick={() => {
              setEditDialogueIndex(dialogueIndex);
              setWizardOpen(true);
            }}
            className="w-full"
          >
            <Sparkles className="h-4 w-4" />
            {t('dialogueEditor.editWithAssistant')}
          </Button>

          {/* Add Choice button */}
          <Button
            variant="gaming-success"
            size="default"
            onClick={handleAddChoice}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            {t('dialogueEditor.addChoice')}
          </Button>

          {dialogue.choices && dialogue.choices.length > 0 ? (
            dialogue.choices.map((choice, choiceIdx) => (
              <ChoiceEditor
                key={choiceIdx}
                choice={choice}
                choiceIndex={choiceIdx}
                onUpdate={handleUpdateChoice}
                onDelete={handleDeleteChoice}
                scenes={scenes}
                currentSceneId={scene.id}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">{t('dialogueEditor.noChoices')}</p>
              <p className="text-xs mt-1">{t('dialogueEditor.noChoicesHint')}</p>
            </div>
          )}
        </div>
      )}

      {/* Auto-save indicator */}
      <div className="flex-shrink-0 border-t border-border p-3">
        <AutoSaveIndicator lastSaved={lastSaved ? new Date(lastSaved) : null} isSaving={isSaving} />
      </div>
    </div>
  );
}
