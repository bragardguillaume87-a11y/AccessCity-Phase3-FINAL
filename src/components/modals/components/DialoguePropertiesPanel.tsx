import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, PlusCircle, ArrowRightCircle, Flag, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import { useIsCosmosTheme } from '@/hooks/useGraphTheme';
import { useSceneDialogues } from '@/stores/selectors';
import { useCharacterAvatar } from '../../../components/features/graph-nodes/useCharacterAvatar';

export interface DialoguePropertiesPanelProps {
  sceneId: string;
  dialogueIndex: number;
  onClose: () => void;
  /** Ce nœud est le dernier de l'histoire (supprime l'avertissement «sans destination») */
  isLastNode?: boolean;
  /** Ouvre le wizard en mode création (Nouveau dialogue) */
  onAddDialogue?: () => void;
  /** Ouvre le wizard en mode édition pour configurer le saut de scène */
  onOpenWizard?: () => void;
  /** Marque ce dialogue comme conclusion intentionnelle */
  onConcludeStory?: () => void;
  /** Position persistante (px depuis top-left de la viewport) */
  initialPosition?: { x: number; y: number };
  /** Callback quand la position change */
  onPositionChange?: (pos: { x: number; y: number } | undefined) => void;
}

/** Position CSS par défaut (top-right du canvas) */
const DEFAULT_POSITION = { x: -1, y: -1 };

/**
 * DialoguePropertiesPanel — Carte flottante d'édition rapide dans l'éditeur nodal.
 *
 * - Header gradient bleu→violet, draggable
 * - Fond glassmorphism (backdrop-blur + semi-transparent)
 * - Bouton ↺ dans le header pour réinitialiser la position (visible si déplacé)
 * - Avatar du personnage (humeur du dialogue)
 * - Didascalies masquées par défaut
 * - stopPropagation sur onPointerDown → évite la déselection du nœud dans ReactFlow
 */
export function DialoguePropertiesPanel({
  sceneId,
  dialogueIndex,
  onClose,
  isLastNode,
  onAddDialogue,
  onOpenWizard,
  onConcludeStory,
  initialPosition,
  onPositionChange,
}: DialoguePropertiesPanelProps) {
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);
  const characters    = useCharactersStore((state) => state.characters);
  const { celebrateNodeCreation } = useCosmosEffects();
  const isCosmosTheme = useIsCosmosTheme();

  const dialogues = useSceneDialogues(sceneId);
  const dialogue  = dialogues[dialogueIndex];

  const [formData, setFormData] = useState({
    speaker:         dialogue?.speaker         || 'Narrator',
    text:            dialogue?.text            || '',
    stageDirections: dialogue?.stageDirections || '',
  });

  const [showStageDirections, setShowStageDirections] = useState(
    !!(dialogue?.stageDirections)
  );

  // Position du panneau (fixed viewport coords). DEFAULT_POSITION.x < 0 = position CSS par défaut
  const [position, setPosition] = useState(initialPosition ?? DEFAULT_POSITION);
  const isDragging  = useRef(false);
  const dragOffset  = useRef({ x: 0, y: 0 });
  const panelRef    = useRef<HTMLDivElement>(null);

  const hasMoved = position.x >= 0;

  // Avatar via hook optimisé (souscrit uniquement à l'URL, pas au tableau entier)
  const avatarUrl = useCharacterAvatar(formData.speaker, dialogue?.speakerMood || 'neutral');

  const speakerCharacter = characters.find((c) => c.id === formData.speaker);
  const speakerName      = speakerCharacter?.name;

  useEffect(() => {
    if (dialogue) {
      setFormData({
        speaker:         dialogue.speaker,
        text:            dialogue.text,
        stageDirections: dialogue.stageDirections || '',
      });
      if (dialogue.stageDirections) setShowStageDirections(true);
    }
  }, [dialogue, dialogueIndex, sceneId]);

  const hasChanges = !!(
    dialogue &&
    (formData.speaker         !== dialogue.speaker ||
     formData.text            !== dialogue.text    ||
     formData.stageDirections !== (dialogue.stageDirections || ''))
  );

  const handleSave = useCallback(() => {
    if (!hasChanges || !dialogue) return;
    updateDialogue(sceneId, dialogueIndex, {
      speaker:         formData.speaker,
      text:            formData.text,
      stageDirections: formData.stageDirections || undefined,
    });
    if (isCosmosTheme) celebrateNodeCreation();
    onClose();
  }, [hasChanges, dialogue, updateDialogue, sceneId, dialogueIndex, formData, isCosmosTheme, celebrateNodeCreation, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape')         { e.preventDefault(); onClose();    }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleSave, onClose]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDragging.current = true;

    const onMouseMove = (me: MouseEvent) => {
      if (!isDragging.current) return;
      const newPos = {
        x: me.clientX - dragOffset.current.x,
        y: me.clientY - dragOffset.current.y,
      };
      setPosition(newPos);
      onPositionChange?.(newPos);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onPositionChange]);

  const handleResetPosition = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition(DEFAULT_POSITION);
    onPositionChange?.(undefined);
  }, [onPositionChange]);

  // ── Positionning ─────────────────────────────────────────────────────────
  // Quand déplacé → fixed viewport. Sinon → absolute dans le canvas (top-right).
  const positionStyle: React.CSSProperties = hasMoved
    ? { position: 'fixed', left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : {};

  if (!dialogue) return null;

  const speakerDisplayLabel =
    formData.speaker === 'Narrator' ? '📖 Narrateur'
    : formData.speaker === 'player' ? '🎮 Joueur'
    : `👤 ${speakerName || formData.speaker}`;

  return (
    <div
      ref={panelRef}
      className="absolute top-16 right-4 z-20 w-80 rounded-xl overflow-hidden select-none"
      style={{
        ...positionStyle,
        // Glassmorphism body
        background: 'rgba(13, 18, 32, 0.92)',
        backdropFilter: 'blur(14px) saturate(160%)',
        WebkitBackdropFilter: 'blur(14px) saturate(160%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.7), 0 24px 64px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      role="dialog"
      aria-label="Propriétés du dialogue"
      // ✅ stopPropagation : évite que ReactFlow détecte un "pane click" et déselectionne le nœud
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Header gradient (draggable) ──────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
          boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.2)',
        }}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white drop-shadow-sm">
            Dialogue #{dialogueIndex + 1}
          </span>
          {dialogue.isResponse && (
            <span className="text-[10px] text-blue-200/80">— réponse</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Bouton reset — visible uniquement si déplacé */}
          {hasMoved && (
            <button
              onClick={handleResetPosition}
              onMouseDown={(e) => e.stopPropagation()}
              title="Remettre à la position d'origine"
              aria-label="Réinitialiser la position"
              className="text-white/70 hover:text-white transition-colors p-0.5 rounded"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            title="Fermer (Échap)"
            aria-label="Fermer"
            className="text-white/70 hover:text-white transition-colors p-0.5 rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Hero : avatar + nom du personnage ──────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-3 pt-3 pb-2.5"
        style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.12)' }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={speakerName || formData.speaker}
            className="w-12 h-12 rounded-lg object-cover object-top shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
          >
            {formData.speaker === 'Narrator' ? '📖' : formData.speaker === 'player' ? '🎮' : '👤'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/90 truncate">{speakerDisplayLabel}</p>
          {dialogue.speakerMood && (
            <p
              className="text-[10px] capitalize mt-0.5"
              style={{ color: 'rgba(139, 92, 246, 0.8)' }}
            >
              {dialogue.speakerMood}
            </p>
          )}
        </div>
      </div>

      {/* ── Section terminale ──────────────────────────────────────────────── */}
      {isLastNode && (
        <div
          className="mx-3 mt-2.5 rounded-lg p-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {dialogue.isConclusion ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <Flag size={12} />
              <span>Histoire conclue</span>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-amber-400/90 font-medium mb-2">
                Dernier nœud — que souhaitez-vous faire ?
              </p>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={onAddDialogue}
                  className="flex items-center gap-2 text-[11px] text-left text-white/70 hover:text-white transition-colors px-2 py-1.5 rounded hover:bg-white/5"
                >
                  <PlusCircle size={12} className="shrink-0 text-blue-400" />
                  Nouveau dialogue
                </button>
                <button
                  onClick={onOpenWizard}
                  className="flex items-center gap-2 text-[11px] text-left text-white/70 hover:text-white transition-colors px-2 py-1.5 rounded hover:bg-white/5"
                >
                  <ArrowRightCircle size={12} className="shrink-0 text-violet-400" />
                  Connecter à la scène suivante
                </button>
                <button
                  onClick={onConcludeStory}
                  className="flex items-center gap-2 text-[11px] text-left text-white/70 hover:text-emerald-400 transition-colors px-2 py-1.5 rounded hover:bg-white/5"
                >
                  <Flag size={12} className="shrink-0 text-emerald-400" />
                  Conclure l'histoire
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Corps du formulaire ─────────────────────────────────────────────── */}
      <div className="p-3 space-y-3">
        {/* Speaker */}
        <div className="space-y-1.5">
          <Label
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Personnage
          </Label>
          <Select
            value={formData.speaker}
            onValueChange={(v) => setFormData({ ...formData, speaker: v })}
          >
            <SelectTrigger className="h-7 text-xs border-white/10 bg-white/5 text-white/80">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Narrator" className="text-xs">📖 Narrateur</SelectItem>
              <SelectItem value="player"   className="text-xs">🎮 Joueur</SelectItem>
              {characters.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">👤 {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Texte du dialogue */}
        <div className="space-y-1.5">
          <Label
            className="text-[10px] font-semibold tracking-widest uppercase flex justify-between"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <span>Texte du dialogue</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>{formData.text.length}</span>
          </Label>
          <Textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            placeholder="Entrez le texte du dialogue…"
            className="min-h-[88px] text-xs resize-none border-white/10 bg-white/5 text-white/85 placeholder:text-white/25"
            rows={4}
          />
        </div>

        {/* Didascalies (toggle) */}
        <div>
          <button
            onClick={() => setShowStageDirections((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {showStageDirections ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            <span>Didascalies</span>
            {formData.stageDirections && (
              <span
                className="w-1.5 h-1.5 rounded-full ml-0.5"
                style={{ background: '#7c3aed', opacity: 0.8 }}
              />
            )}
          </button>
          {showStageDirections && (
            <Textarea
              value={formData.stageDirections}
              onChange={(e) => setFormData({ ...formData, stageDirections: e.target.value })}
              placeholder="Actions, émotions, contexte…"
              className="mt-1.5 min-h-[48px] text-xs resize-none border-white/10 bg-white/5 text-white/80 placeholder:text-white/25"
              rows={2}
            />
          )}
        </div>

        {/* Choix (lecture seule) */}
        {dialogue.choices && dialogue.choices.length > 0 && (
          <div className="space-y-1.5">
            <Label
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Choix ({dialogue.choices.length})
            </Label>
            <ul className="space-y-0.5">
              {dialogue.choices.map((c, i) => (
                <li
                  key={c.id}
                  className="text-[11px] text-white/50 px-2 py-1 rounded truncate"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {i + 1}. {c.text || '—'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div
        className="px-3 py-2.5 flex justify-end gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-white/50 hover:text-white/80 hover:bg-white/5"
          onClick={onClose}
        >
          Annuler
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          style={{
            background: hasChanges ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : undefined,
            opacity: hasChanges ? 1 : 0.4,
          }}
          onClick={handleSave}
          disabled={!hasChanges}
          title="Ctrl+S"
        >
          <Save className="w-3 h-3 mr-1" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
