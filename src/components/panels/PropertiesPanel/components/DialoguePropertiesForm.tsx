import * as React from 'react';
import { useState } from 'react';
import type { Dialogue, Scene, SceneMetadata, Character, ModalType, DialogueAudio } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator';
import { ChoiceEditor } from './ChoiceEditor';
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

/** Accordéon CSS pur — grid-template-rows 0fr↔1fr, zéro JS pour l'animation */
function Collapsible({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

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
  const [sfxOpen,       setSfxOpen]       = useState(!!dialogue.sfx?.url);
  const [moodsOpen,     setMoodsOpen]     = useState(false);
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
                badge={dialogue.sfx?.url ? '1 son' : undefined}
                isCollapsible
                isOpen={sfxOpen}
                onToggle={() => setSfxOpen(v => !v)}
              />
              <Collapsible isOpen={sfxOpen}>
                <div className="px-3 py-3 space-y-3">
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
                      className="w-full h-14 rounded-lg border-2 border-dashed border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="text-xs font-medium">{t('dialogueEditor.sfxAdd')}</span>
                    </button>
                  )}
                </div>
              </Collapsible>
            </SectionCard>
          )}

          {/* ── Humeurs (accordéon) ── Pro mode only */}
          {!isKid && scene.characters && scene.characters.length > 0 && (
            <SectionCard>
              <SectionHeader
                emoji="😊"
                label={t('dialogueEditor.moodsLabel')}
                colorClass="text-emerald-400"
                badge={`${scene.characters.length} perso.`}
                isCollapsible
                isOpen={moodsOpen}
                onToggle={() => setMoodsOpen(v => !v)}
              />
              <Collapsible isOpen={moodsOpen}>
                <div className="px-3 py-2.5 space-y-2">
                  {scene.characters.map(sceneChar => {
                    const character = characters.find(c => c.id === sceneChar.characterId);
                    if (!character) return null;
                    const overrideMood = dialogue.characterMoods?.[sceneChar.id] ?? '';
                    const availableMoods: string[] = character.moods || ['neutral'];
                    return (
                      <div key={sceneChar.id} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground flex-1 truncate">{character.name}</span>
                        <select
                          value={overrideMood}
                          onChange={e => {
                            const val = e.target.value;
                            const next = { ...(dialogue.characterMoods || {}) };
                            if (val) { next[sceneChar.id] = val; } else { delete next[sceneChar.id]; }
                            handleUpdate({ characterMoods: Object.keys(next).length > 0 ? next : undefined });
                          }}
                          className="w-28 px-2 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          aria-label={`Humeur de ${character.name}`}
                        >
                          <option value="">{t('dialogueEditor.moodDefault')}</option>
                          {availableMoods.map(mood => (
                            <option key={mood} value={mood}>{mood}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </Collapsible>
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
            <Collapsible isOpen={apparenceOpen}>
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
            </Collapsible>
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
            <Collapsible isOpen={aperçuOpen}>
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
            </Collapsible>
          </SectionCard>

        </div>
      )}

      {/* Choices tab — Pro mode only */}
      {!isKid && activeTab === 'choices' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
