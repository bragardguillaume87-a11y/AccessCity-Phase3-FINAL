import { useState, useRef, useEffect } from 'react';
import { hashStringToColor } from '@/components/ui/DialogueBox';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, User, MessageSquare, GitBranch, Plus, Scissors } from 'lucide-react';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useScenesStore } from '@/stores/scenesStore';
import { useSceneWithElements } from '@/stores/selectors';
import { isDialogueSelection } from '@/stores/selectionStore.types';
import { ChoiceEditor } from '../PropertiesPanel/components/ChoiceEditor';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import type { Dialogue } from '@/types';
import { SplitConfirmModal } from './DialogueBoxSection/components/SplitConfirmModal';
import { MoodsSection } from './DialogueBoxSection/components/MoodsSection';
import { SfxPanel } from './DialogueBoxSection/components/SfxPanel';

// ── Palette 8 couleurs (surligneur) ──────────────────────────────────────────
const RICH_COLORS = [
  { label: 'Blanc', hex: '#ffffff' },
  { label: 'Jaune', hex: '#fbbf24' },
  { label: 'Rouge', hex: '#f87171' },
  { label: 'Vert', hex: '#4ade80' },
  { label: 'Bleu', hex: '#60a5fa' },
  { label: 'Orange', hex: '#fb923c' },
  { label: 'Violet', hex: '#c084fc' },
  { label: 'Rose', hex: '#f472b6' },
] as const;

// ============================================================================
// DIALOGUE COURANT — propriétés du dialogue sélectionné
// ============================================================================

/**
 * DialogueEditorInner — lit le dialogue sélectionné depuis les stores et permet son édition.
 * Monté uniquement quand un dialogue est actif (via DialogueCurrentSection).
 */
function DialogueEditorInner({ sceneId, index }: { sceneId: string; index: number }) {
  const updateDialogue = useDialoguesStore((s) => s.updateDialogue);
  const insertDialoguesAfter = useDialoguesStore((s) => s.insertDialoguesAfter);
  const dialogue = useDialoguesStore((s) => s.getDialoguesByScene(sceneId)[index]);
  const characters = useCharactersStore((s) => s.characters);
  const scenes = useScenesStore((s) => s.scenes);
  const scene = useSceneWithElements(sceneId);

  const [choicesOpen, setChoicesOpen] = useState(false);
  // Split preview — null = mode édition normal, non-null = mode confirmation
  const [splitPreview, setSplitPreview] = useState<{ text1: string; text2: string } | null>(null);

  // Couleur de texte — style Word : popover grille
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [lastUsedColor, setLastUsedColor] = useState('#ffffff');
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // ── Rich text editor ──────────────────────────────────────────────────────
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  // Init contenteditable depuis richText ou text au montage / changement de dialogue
  useEffect(() => {
    const el = editorRef.current;
    if (!el || !dialogue) return;
    const target = dialogue.richText || dialogue.text || '';
    if (el.innerHTML !== target) el.innerHTML = target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue?.id]);

  // Fermer le color picker sur clic extérieur
  useEffect(() => {
    if (!colorPickerOpen) return;
    const close = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [colorPickerOpen]);

  if (!dialogue) return null;

  const speaker = characters.find((c) => c.id === dialogue.speaker);
  const speakerName = speaker?.name || '—';
  const speakerColor = hashStringToColor(dialogue.speaker || speakerName);

  const handleUpdate = (updates: Partial<Dialogue>) => {
    updateDialogue(sceneId, index, updates);
  };

  // Sync contenteditable → store (text plain + richText HTML)
  const syncContent = () => {
    const el = editorRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    const plain = el.innerText;
    handleUpdate({
      text: plain,
      richText:
        raw === plain
          ? undefined
          : raw
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/on\w+="[^"]*"/gi, '')
              .replace(/javascript:/gi, ''),
    });
  };

  const applyBold = () => {
    editorRef.current?.focus();
    document.execCommand('bold');
    syncContent();
  };
  const applyColor = (hex: string) => {
    editorRef.current?.focus();
    document.execCommand('foreColor', false, hex);
    syncContent();
  };
  const removeFormat = () => {
    editorRef.current?.focus();
    document.execCommand('removeFormat');
    syncContent();
  };

  // ── Split au curseur ✂️ ───────────────────────────────────────────────────
  // Étape 1 : calcule les deux parties et passe en mode prévisualisation
  const handleSplitClick = () => {
    const el = editorRef.current;
    if (!el || !dialogue) return;
    const sel = window.getSelection();
    let splitPos: number;
    if (!sel || sel.rangeCount === 0) {
      splitPos = Math.floor(el.innerText.length / 2);
    } else {
      const range = sel.getRangeAt(0);
      const preRange = document.createRange();
      preRange.selectNodeContents(el);
      preRange.setEnd(range.startContainer, range.startOffset);
      splitPos = preRange.toString().length;
    }
    const plain = el.innerText;
    const text1 = plain.slice(0, splitPos).trim();
    const text2 = plain.slice(splitPos).trim();
    if (!text1 || !text2) return;
    setSplitPreview({ text1, text2 });
  };

  // Étape 2a : confirmer — exécute le split dans les stores
  const confirmSplit = () => {
    if (!splitPreview || !dialogue) return;
    const { text1, text2 } = splitPreview;
    handleUpdate({ text: text1, richText: undefined, choices: [] });
    // Fix : sync manuel du contenteditable (useEffect ne se déclenche que sur dialogue.id change)
    if (editorRef.current) editorRef.current.innerHTML = text1;
    const newDialogue: Dialogue = {
      ...dialogue,
      id: `dialogue-${Date.now()}`,
      text: text2,
      richText: undefined,
    };
    insertDialoguesAfter(sceneId, index, [newDialogue]);
    setSplitPreview(null);
  };

  // Étape 2b : annuler — retour au mode édition normal
  const cancelSplit = () => setSplitPreview(null);

  const choiceCount = dialogue.choices?.length ?? 0;
  const sceneChars = scene?.characters ?? [];

  return (
    <>
      {/* Personnage */}
      <div
        style={{
          marginBottom: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '10px 12px',
        }}
      >
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

      {/* Humeurs */}
      <MoodsSection
        dialogue={dialogue}
        handleUpdate={handleUpdate}
        characters={characters}
        sceneChars={sceneChars}
      />

      {/* Texte */}
      <div
        style={{
          marginBottom: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '10px 12px',
        }}
      >
        <div className="sp-row mb-1">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-violet-400" aria-hidden="true" />
            Texte
          </span>
          {/* ✂️ Split */}
          <button
            type="button"
            onClick={handleSplitClick}
            title="Couper ce dialogue en deux au curseur"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              border: '1px solid var(--color-border-hover)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <Scissors size={10} /> Couper
          </button>
        </div>

        {/* Barre de formatage — style Word */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}>
          {/* Gras */}
          <button
            type="button"
            title="Gras"
            onClick={applyBold}
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              border: '1px solid var(--color-border-hover)',
              background: 'var(--color-bg-hover)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-active)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)';
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                fontFamily: 'Georgia, serif',
                color: 'var(--color-text-primary)',
                lineHeight: 1,
              }}
            >
              B
            </span>
          </button>

          {/* Italique */}
          <button
            type="button"
            title="Italique"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand('italic');
              syncContent();
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              border: '1px solid var(--color-border-hover)',
              background: 'var(--color-bg-hover)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-active)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)';
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontStyle: 'italic',
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                color: 'var(--color-text-primary)',
                lineHeight: 1,
              }}
            >
              I
            </span>
          </button>

          {/* Séparateur */}
          <div
            style={{
              width: 1,
              height: 16,
              background: 'var(--color-border-base)',
              margin: '0 2px',
              flexShrink: 0,
            }}
          />

          {/* Couleur — style Word : bouton A + barre colorée + popover grille */}
          <div ref={colorPickerRef} style={{ position: 'relative' }}>
            <button
              type="button"
              title="Couleur du texte"
              onClick={() => setColorPickerOpen((o) => !o)}
              style={{
                width: 36,
                height: 26,
                borderRadius: 5,
                padding: '3px 4px',
                border: `1px solid ${colorPickerOpen ? 'var(--color-border-focus)' : 'var(--color-border-hover)'}`,
                background: colorPickerOpen ? 'var(--color-bg-active)' : 'var(--color-bg-hover)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                transition: 'background 0.1s, border-color 0.1s',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'Georgia, serif',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                }}
              >
                A
              </span>
              <span
                style={{
                  width: 16,
                  height: 3,
                  borderRadius: 1.5,
                  background: lastUsedColor,
                  flexShrink: 0,
                }}
              />
            </button>
            {colorPickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  zIndex: 200,
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-hover)',
                  borderRadius: 8,
                  padding: 8,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 18px)',
                  gap: 4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
                }}
              >
                {RICH_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      applyColor(c.hex);
                      setLastUsedColor(c.hex);
                      setColorPickerOpen(false);
                    }}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: c.hex,
                      cursor: 'pointer',
                      border:
                        c.hex === '#ffffff'
                          ? '1.5px solid rgba(255,255,255,0.25)'
                          : '1.5px solid transparent',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px ${c.hex}88`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div
            style={{
              width: 1,
              height: 16,
              background: 'var(--color-border-base)',
              margin: '0 2px',
              flexShrink: 0,
            }}
          />

          {/* Effacer formatage */}
          <button
            type="button"
            title="Effacer le formatage"
            onClick={removeFormat}
            style={{
              height: 26,
              padding: '0 8px',
              borderRadius: 5,
              border: '1px solid var(--color-border-hover)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.02em',
              transition: 'color 0.1s, background 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
              (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            Effacer
          </button>
        </div>

        {/* Zone d'édition contenteditable */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={() => {
            isComposing.current = false;
            syncContent();
          }}
          onInput={() => {
            if (!isComposing.current) syncContent();
          }}
          onBlur={syncContent}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-base)';
          }}
          style={{
            minHeight: 72,
            padding: '6px 10px',
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--color-text-primary)',
            lineHeight: 1.55,
            outline: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            cursor: 'text',
          }}
        />
        <p style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Sélectionner du texte → B ou couleur · ✂️ Couper = diviser au curseur
        </p>
      </div>

      {/* Choix */}
      <div
        style={{
          marginBottom: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => setChoicesOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'rgba(139,92,246,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GitBranch className="w-3 h-3 text-purple-400" aria-hidden="true" />
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--color-text-primary)',
              flex: 1,
            }}
          >
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
      <SfxPanel dialogue={dialogue} handleUpdate={handleUpdate} />

      {/* ── Modale de confirmation du découpage ── */}
      <AnimatePresence>
        {splitPreview && (
          <SplitConfirmModal
            text1={splitPreview.text1}
            text2={splitPreview.text2}
            speakerName={speakerName}
            speakerColor={speakerColor}
            dialogueIndex={index}
            onConfirm={confirmSplit}
            onCancel={cancelSplit}
          />
        )}
      </AnimatePresence>
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
 * Affiche les propriétés du dialogue actif : Personnage, Humeurs, Texte, Choix, SFX.
 * Les paramètres globaux (Aperçu, Style, Apparence, Portrait) sont dans TextSection (icône "Style").
 */
export function DialogueBoxSection() {
  return (
    <div>
      <DialogueCurrentSection />
    </div>
  );
}
