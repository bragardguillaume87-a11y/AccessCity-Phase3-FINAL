import React, { useState } from 'react';
import { User, MessageSquare, Volume2, X, ChevronDown, GitBranch, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useScenesStore } from '@/stores/scenesStore';
import { useSceneWithElements } from '@/stores/selectors';
import { ChoiceEditor } from '../PropertiesPanel/components/ChoiceEditor';
import type { Dialogue } from '@/types';

interface DialogueInlineEditorProps {
  dialogueIndex: number;
  sceneId: string;
}

// ── Accordéon CSS pur — grid-template-rows 0fr ↔ 1fr ──────────────────────────
function Accordion({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function AccordionHeader({
  label, icon, colorClass = 'text-[var(--color-text-muted)]', badge, isOpen, onToggle,
}: {
  label: string;
  icon?: React.ReactNode;
  colorClass?: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors border-b border-[var(--color-border-base)]"
    >
      {icon && <span className={colorClass}>{icon}</span>}
      <span className={`text-[11px] font-semibold uppercase tracking-wider flex-1 ${colorClass}`}>
        {label}
      </span>
      {badge && (
        <span className="text-[10px] text-[var(--color-text-muted)] mr-1">{badge}</span>
      )}
      <ChevronDown
        className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

/**
 * DialogueInlineEditor — propriétés d'un dialogue dans le panel gauche.
 *
 * Affiche (quand un dialogue est sélectionné) :
 *   - Personnage (speaker select)
 *   - Texte (textarea, toujours visible)
 *   - Choix (accordéon fermé par défaut)
 *   - Effet sonore (accordéon fermé par défaut)
 *   - Humeurs (accordéon fermé par défaut, si la scène a des personnages)
 */
export function DialogueInlineEditor({ dialogueIndex, sceneId }: DialogueInlineEditorProps) {
  const updateDialogue = useDialoguesStore(s => s.updateDialogue);
  const dialogue       = useDialoguesStore(s => s.getDialoguesByScene(sceneId)[dialogueIndex]);
  const characters     = useCharactersStore(s => s.characters);
  const scenes         = useScenesStore(s => s.scenes);
  const scene          = useSceneWithElements(sceneId);

  const [choicesOpen, setChoicesOpen] = useState(false);
  const [sfxOpen,     setSfxOpen]     = useState(false);
  const [moodsOpen,   setMoodsOpen]   = useState(false);

  if (!dialogue) return null;

  const handleUpdate = (updates: Partial<Dialogue>) => {
    updateDialogue(sceneId, dialogueIndex, updates);
  };

  const choiceCount = dialogue.choices?.length ?? 0;
  const hasSfx      = !!dialogue.sfx?.url;
  const sceneChars  = scene?.characters ?? [];

  return (
    <div className="flex flex-col border-t-2 border-[var(--color-primary)]/40 bg-[var(--color-bg-elevated)]">

      {/* Titre */}
      <div className="flex-shrink-0 px-3 py-2 bg-[var(--color-bg-active)] border-b border-[var(--color-border-base)]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
          Dialogue {String(dialogueIndex + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Personnage ── */}
        <div className="px-3 py-2.5 border-b border-[var(--color-border-base)]">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
            <User className="w-3 h-3 text-blue-400" />
            Personnage
          </label>
          <select
            value={dialogue.speaker || ''}
            onChange={e => handleUpdate({ speaker: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">— Aucun personnage —</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ── Texte ── */}
        <div className="px-3 py-2.5 border-b border-[var(--color-border-base)]">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
            <MessageSquare className="w-3 h-3 text-violet-400" />
            Texte
          </label>
          <textarea
            value={dialogue.text || ''}
            onChange={e => handleUpdate({ text: e.target.value })}
            rows={4}
            className="w-full px-2.5 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            placeholder="Saisir le texte du dialogue…"
          />
        </div>

        {/* ── Choix (accordéon) ── */}
        <div>
          <AccordionHeader
            label={`Choix ${choiceCount > 0 ? `(${choiceCount})` : ''}`}
            icon={<GitBranch className="w-3 h-3" />}
            colorClass="text-purple-400"
            isOpen={choicesOpen}
            onToggle={() => setChoicesOpen(v => !v)}
          />
          <Accordion isOpen={choicesOpen}>
            <div className="px-3 py-2.5 space-y-2 border-b border-[var(--color-border-base)]">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => handleUpdate({
                  choices: [
                    ...(dialogue.choices || []),
                    { id: `choice-${Date.now()}`, text: 'Nouveau choix', nextSceneId: '', effects: [] }
                  ]
                })}
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter un choix
              </Button>
              {choiceCount > 0 && dialogue.choices.map((choice, ci) => (
                <ChoiceEditor
                  key={ci}
                  choice={choice}
                  choiceIndex={ci}
                  onUpdate={(idx, updated) => {
                    const next = [...dialogue.choices];
                    next[idx] = updated;
                    handleUpdate({ choices: next });
                  }}
                  onDelete={(idx) => handleUpdate({
                    choices: dialogue.choices.filter((_, i) => i !== idx)
                  })}
                  scenes={scenes}
                  currentSceneId={sceneId}
                />
              ))}
              {choiceCount === 0 && (
                <p className="text-[11px] text-[var(--color-text-muted)] text-center py-1">
                  Aucun choix — dialogue simple
                </p>
              )}
            </div>
          </Accordion>
        </div>

        {/* ── Effet sonore (accordéon) ── */}
        <div>
          <AccordionHeader
            label="Effet sonore"
            icon={<Volume2 className="w-3 h-3" />}
            colorClass="text-amber-400"
            badge={hasSfx ? '1 son' : undefined}
            isOpen={sfxOpen}
            onToggle={() => setSfxOpen(v => !v)}
          />
          <Accordion isOpen={sfxOpen}>
            <div className="px-3 py-2.5 border-b border-[var(--color-border-base)]">
              {hasSfx ? (
                <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-base)] rounded-lg border border-[var(--color-border-base)]">
                  <Volume2 className="h-3 w-3 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-[var(--color-text-primary)] truncate flex-1">
                    {dialogue.sfx!.url.split('/').pop()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleUpdate({ sfx: undefined })}
                    aria-label="Supprimer le son"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--color-text-muted)] text-center py-1">
                  Aucun effet sonore
                </p>
              )}
            </div>
          </Accordion>
        </div>

        {/* ── Humeurs (accordéon, uniquement si la scène a des personnages) ── */}
        {sceneChars.length > 0 && (
          <div>
            <AccordionHeader
              label={`Humeurs (${sceneChars.length})`}
              badge="😊"
              colorClass="text-emerald-400"
              isOpen={moodsOpen}
              onToggle={() => setMoodsOpen(v => !v)}
            />
            <Accordion isOpen={moodsOpen}>
              <div className="px-3 py-2.5 space-y-2 border-b border-[var(--color-border-base)]">
                {sceneChars.map(sc => {
                  const char = characters.find(c => c.id === sc.characterId);
                  if (!char) return null;
                  const mood = dialogue.characterMoods?.[sc.id] ?? '';
                  return (
                    <div key={sc.id} className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-primary)] flex-1 truncate">
                        {char.name}
                      </span>
                      <select
                        value={mood}
                        onChange={e => {
                          const val = e.target.value;
                          const next = { ...(dialogue.characterMoods || {}) };
                          if (val) { next[sc.id] = val; } else { delete next[sc.id]; }
                          handleUpdate({
                            characterMoods: Object.keys(next).length > 0 ? next : undefined
                          });
                        }}
                        className="w-28 px-2 py-1 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded text-xs text-[var(--color-text-primary)]"
                        aria-label={`Humeur de ${char.name}`}
                      >
                        <option value="">Défaut</option>
                        {(char.moods || ['neutral']).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </Accordion>
          </div>
        )}

      </div>
    </div>
  );
}

export default DialogueInlineEditor;
