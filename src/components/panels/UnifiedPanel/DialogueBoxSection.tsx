import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { hashStringToColor } from '@/components/ui/DialogueBox';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  User,
  MessageSquare,
  GitBranch,
  Volume2,
  X,
  Plus,
  Scissors,
} from 'lucide-react';
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

// ── Mini DialogueBox VN — aperçu fidèle d'une partie du texte coupé ────────

function MiniVNCard({
  number,
  label,
  color,
  speakerName,
  speakerColor,
  text,
}: {
  number: 1 | 2;
  label: string;
  color: string;
  speakerName: string;
  speakerColor: string;
  text: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <span
          style={{
            background: color,
            color: '#000',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
      </div>
      {/* Fond sombre style VN — Bret Victor : montrer la chose réelle */}
      <div
        style={{
          background: 'rgba(3,7,18,0.90)',
          borderRadius: 10,
          border: `1px solid ${color}33`,
          padding: '10px 14px',
          boxShadow: `0 0 0 1px ${color}18`,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: speakerColor,
            margin: '0 0 5px',
            letterSpacing: 0.4,
          }}
        >
          {speakerName}
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-primary)',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

// ── Modal de confirmation du découpage ───────────────────────────────────────

function SplitConfirmModal({
  text1,
  text2,
  speakerName,
  speakerColor,
  dialogueIndex,
  onConfirm,
  onCancel,
}: {
  text1: string;
  text2: string;
  speakerName: string;
  speakerColor: string;
  dialogueIndex: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const n1 = String(dialogueIndex + 1).padStart(2, '0');
  const n2 = String(dialogueIndex + 2).padStart(2, '0');
  // constraintsRef sur le backdrop → drag limité à l'écran entier
  const constraintsRef = useRef<HTMLDivElement>(null);
  // Empêche le clic backdrop de fermer la modale après un drag
  const isDragging = useRef(false);

  return createPortal(
    <motion.div
      ref={constraintsRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 8,
        // Pas de pointer-events sur le backdrop quand on drag
      }}
      onClick={() => {
        if (!isDragging.current) onCancel();
      }}
    >
      <motion.div
        // ── Drag libre dans les limites du backdrop ──
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDragging.current = false;
          }, 0);
        }}
        // ── Entrée depuis la droite ──
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        style={{
          background: 'var(--color-bg-elevated)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          width: 400,
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          // cursor géré par zone (header = grab, body/footer = default)
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header — zone de drag (cursor: grab) ── */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {/* Ciseaux violet animés — snip snip idle */}
          <motion.div
            animate={{ rotate: [-18, 18, -12, 12, 0] }}
            transition={{
              duration: 0.7,
              delay: 0.4,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 3.5,
            }}
            style={{ flexShrink: 0, display: 'flex', pointerEvents: 'none' }}
          >
            <Scissors size={14} style={{ color: 'var(--color-primary)' }} />
          </motion.div>

          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              flex: 1,
              pointerEvents: 'none',
            }}
          >
            Découpage de dialogue
          </span>

          {/* Transformation colorée D-N1 → D-N1 + D-N2 */}
          <span
            style={{
              fontSize: 10,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: 'rgba(238,240,248,0.55)' }}>D-{n1}</span>
            <span style={{ color: 'rgba(238,240,248,0.22)' }}>→</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>D-{n1}</span>
            <span style={{ color: 'rgba(238,240,248,0.22)' }}>+</span>
            <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>D-{n2}</span>
          </span>

          {/* ── Bouton fermer — dynamique et visible ── */}
          <motion.button
            type="button"
            // Stopper pointerDown pour ne pas déclencher le drag depuis le bouton
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            whileHover={{
              scale: 1.12,
              backgroundColor: 'rgba(239,68,68,0.22)',
              borderColor: 'rgba(239,68,68,0.55)',
              color: '#fca5a5',
            }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(238,240,248,0.6)',
            }}
          >
            <X size={14} />
          </motion.button>
        </div>

        {/* ── Corps — draggable aussi, cursor default sur le texte ── */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            cursor: 'default',
          }}
        >
          <MiniVNCard
            number={1}
            label={`Dialogue ${n1} — conservé`}
            color="#22d3ee"
            speakerName={speakerName}
            speakerColor={speakerColor}
            text={text1}
          />

          {/* ── Séparateur animé : ciseaux ping-pong sur ligne pointillée ── */}
          <div style={{ position: 'relative', height: 20 }}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                borderTop: '1.5px dashed rgba(255,255,255,0.09)',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <motion.div
              style={{
                position: 'absolute',
                top: '50%',
                marginTop: -6,
                left: 0,
                pointerEvents: 'none',
              }}
              animate={{ left: ['3%', '88%', '3%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
            >
              <motion.div
                animate={{ scaleX: [1, 1, -1, -1, 1] }}
                transition={{
                  duration: 2.8,
                  ease: 'linear',
                  repeat: Infinity,
                  times: [0, 0.47, 0.5, 0.97, 1],
                }}
              >
                <Scissors size={12} style={{ color: 'rgba(139,92,246,0.65)', display: 'block' }} />
              </motion.div>
            </motion.div>
          </div>

          <MiniVNCard
            number={2}
            label={`Dialogue ${n2} — inséré après`}
            color="#fbbf24"
            speakerName={speakerName}
            speakerColor={speakerColor}
            text={text2}
          />
        </div>

        {/* ── Footer : boutons — onPointerDown stoppé pour éviter drag accidentel ── */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            padding: '12px 20px 18px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: 10,
            cursor: 'default',
          }}
        >
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(34,211,238,0.22)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              border: '1.5px solid var(--accent-cyan)',
              background: 'rgba(34,211,238,0.14)',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
            }}
          >
            ✓ Confirmer le découpage
          </motion.button>
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'rgba(238,240,248,0.55)',
              cursor: 'pointer',
            }}
          >
            ✗ Annuler
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

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
  const [sfxOpen, setSfxOpen] = useState(false);
  const [moodsOpen, setMoodsOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  // Split preview — null = mode édition normal, non-null = mode confirmation
  const [splitPreview, setSplitPreview] = useState<{ text1: string; text2: string } | null>(null);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);

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

      {/* Humeurs — cartes Nintendo style (remontées ici : proximité sémantique avec Personnage) */}
      {sceneChars.length > 0 && (
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
            onClick={() => setMoodsOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <span
              aria-hidden="true"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'rgba(16,185,129,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              😊
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
                          padding: '5px 10px',
                          borderRadius: 8,
                          border: `2px solid ${!activeMood ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                          background: !activeMood ? 'var(--color-primary-15)' : 'transparent',
                          color: !activeMood ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: !activeMood ? '0 3px 10px var(--color-primary-30)' : 'none',
                          alignSelf: 'center',
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
                          size={60}
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
          onClick={() => setSfxOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'rgba(245,158,11,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Volume2 className="w-3 h-3 text-amber-400" aria-hidden="true" />
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
