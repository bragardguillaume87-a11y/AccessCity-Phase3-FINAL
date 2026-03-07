import React, { useState } from 'react';
import { ChevronDown, User, MessageSquare, GitBranch, Volume2, X, Plus } from 'lucide-react';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useScenesStore } from '@/stores/scenesStore';
import { useSceneWithElements } from '@/stores/selectors';
import { isDialogueSelection } from '@/stores/selectionStore.types';
import { ChoiceEditor } from '../PropertiesPanel/components/ChoiceEditor';
import type { Dialogue } from '@/types';

// ============================================================================
// DIALOGUE COURANT — propriétés du dialogue sélectionné
// ============================================================================

/** Accordéon CSS pur (grid-template-rows 0fr ↔ 1fr) */
function InlineAccordion({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
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
 * DialogueEditorInner — lit le dialogue sélectionné depuis les stores et permet son édition.
 * Monté uniquement quand un dialogue est actif (via DialogueCurrentSection).
 */
function DialogueEditorInner({ sceneId, index }: { sceneId: string; index: number }) {
  const updateDialogue = useDialoguesStore(s => s.updateDialogue);
  const dialogue       = useDialoguesStore(s => s.getDialoguesByScene(sceneId)[index]);
  const characters     = useCharactersStore(s => s.characters);
  const scenes         = useScenesStore(s => s.scenes);
  const scene          = useSceneWithElements(sceneId);

  const [choicesOpen, setChoicesOpen] = useState(false);
  const [sfxOpen,     setSfxOpen]     = useState(false);
  const [moodsOpen,   setMoodsOpen]   = useState(false);

  if (!dialogue) return null;

  const handleUpdate = (updates: Partial<Dialogue>) => {
    updateDialogue(sceneId, index, updates);
  };

  const choiceCount = dialogue.choices?.length ?? 0;
  const sceneChars  = scene?.characters ?? [];

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
          onChange={e => handleUpdate({ speaker: e.target.value })}
          className="w-full px-2.5 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        >
          <option value="">— Aucun —</option>
          {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
          onChange={e => handleUpdate({ text: e.target.value })}
          rows={4}
          className="w-full px-2.5 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
          placeholder="Saisir le texte du dialogue…"
        />
      </div>

      {/* Choix */}
      <div className="mb-1 rounded-lg border border-[var(--color-border-base)] overflow-hidden">
        <button
          type="button"
          onClick={() => setChoicesOpen(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <GitBranch className="w-3 h-3 text-purple-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex-1">
            Choix {choiceCount > 0 ? `(${choiceCount})` : ''}
          </span>
          <ChevronDown className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${choicesOpen ? 'rotate-180' : ''}`} />
        </button>
        <InlineAccordion isOpen={choicesOpen}>
          <div className="px-3 pb-3 pt-1 space-y-2">
            <button
              type="button"
              onClick={() => handleUpdate({
                choices: [...(dialogue.choices || []), { id: `choice-${Date.now()}`, text: 'Nouveau choix', nextSceneId: '', effects: [] }]
              })}
              className="w-full flex items-center justify-center gap-1 py-1.5 rounded border border-dashed border-[var(--color-border-base)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Ajouter un choix
            </button>
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
                onDelete={(idx) => handleUpdate({ choices: dialogue.choices.filter((_, i) => i !== idx) })}
                scenes={scenes}
                currentSceneId={sceneId}
              />
            ))}
          </div>
        </InlineAccordion>
      </div>

      {/* SFX */}
      <div className="mb-1 rounded-lg border border-[var(--color-border-base)] overflow-hidden">
        <button
          type="button"
          onClick={() => setSfxOpen(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Volume2 className="w-3 h-3 text-amber-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex-1">
            Effet sonore {dialogue.sfx?.url ? '· 1 son' : ''}
          </span>
          <ChevronDown className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${sfxOpen ? 'rotate-180' : ''}`} />
        </button>
        <InlineAccordion isOpen={sfxOpen}>
          <div className="px-3 pb-3 pt-1">
            {dialogue.sfx?.url ? (
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
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-1">Aucun effet sonore</p>
            )}
          </div>
        </InlineAccordion>
      </div>

      {/* Humeurs */}
      {sceneChars.length > 0 && (
        <div className="mb-1 rounded-lg border border-[var(--color-border-base)] overflow-hidden">
          <button
            type="button"
            onClick={() => setMoodsOpen(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <span className="text-xs" aria-hidden="true">😊</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex-1">
              Humeurs ({sceneChars.length})
            </span>
            <ChevronDown className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${moodsOpen ? 'rotate-180' : ''}`} />
          </button>
          <InlineAccordion isOpen={moodsOpen}>
            <div className="px-3 pb-3 pt-1 space-y-2">
              {sceneChars.map(sc => {
                const char = characters.find(c => c.id === sc.characterId);
                if (!char) return null;
                const mood = dialogue.characterMoods?.[sc.id] ?? '';
                return (
                  <div key={sc.id} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-primary)] flex-1 truncate">{char.name}</span>
                    <select
                      value={mood}
                      onChange={e => {
                        const val = e.target.value;
                        const next = { ...(dialogue.characterMoods || {}) };
                        if (val) { next[sc.id] = val; } else { delete next[sc.id]; }
                        handleUpdate({ characterMoods: Object.keys(next).length > 0 ? next : undefined });
                      }}
                      className="w-28 px-2 py-1 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded text-xs text-[var(--color-text-primary)]"
                      aria-label={`Humeur de ${char.name}`}
                    >
                      <option value="">Défaut</option>
                      {(char.moods || ['neutral']).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
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
  const selectedElement = useSelectionStore(s => s.selectedElement);

  if (!isDialogueSelection(selectedElement)) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <MessageSquare className="w-8 h-8 text-[var(--color-text-muted)] mb-3 opacity-40" aria-hidden="true" />
        <p className="text-xs text-[var(--color-text-muted)]">
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
