import { useState, useCallback, useMemo } from 'react';
import { Plus, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCharactersStore } from '@/stores';
import { DEFAULTS } from '@/config/constants';
import type { DialogueChoice, Scene } from '@/types';
import type { ComplexityLevel } from '@/types';
import type { ResponseData } from '../../DialogueWizard/hooks/useDialogueForm';
import { BinaryChoiceField } from './BinaryChoiceField';
import { DiceChoiceCard } from '../../DialogueWizard/components/DiceChoiceBuilder/DiceChoiceCard';
import { ComplexChoiceCard } from '../../DialogueWizard/components/ComplexChoiceBuilder/ComplexChoiceCard';


// ── Props ─────────────────────────────────────────────────────────────────────
interface ComposerFormPanelProps {
  speaker: string;
  text: string;
  complexityLevel: ComplexityLevel | null;
  choices: DialogueChoice[];
  responses: ResponseData[];
  scenes: Scene[];
  currentSceneId: string;
  onSpeakerChange: (speaker: string) => void;
  onTextChange: (text: string) => void;
  onUpdateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  onUpdateResponse: (index: number, updates: Partial<ResponseData>) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
}

/**
 * ComposerFormPanel — Left pane of DialogueComposer.
 *
 * Speaker + text always shown.
 * Choices section appears for non-linear types.
 * Tab strip (Unity Inspector style) prevents scrolling:
 *   binary  → [👍 A] [👎 B]
 *   dice    → [🎲 Test 1] [🎲 Test 2] [+]
 *   expert  → [Choix 1] [Choix 2] … [+]
 */
export function ComposerFormPanel({
  speaker,
  text,
  complexityLevel,
  choices,
  responses,
  scenes,
  currentSceneId,
  onSpeakerChange,
  onTextChange,
  onUpdateChoice,
  onUpdateResponse,
  onAddChoice,
  onRemoveChoice,
}: ComposerFormPanelProps) {
  const characters = useCharactersStore(state => state.characters);
  const [activeTab, setActiveTab] = useState(0);

  const currentScene = useMemo(() => scenes.find(s => s.id === currentSceneId), [scenes, currentSceneId]);
  const textLen      = text.trim().length;
  const safeTab      = Math.min(activeTab, Math.max(choices.length - 1, 0));

  const handleAddChoice = useCallback(() => {
    onAddChoice();
    setActiveTab(choices.length); // jump to new tab
  }, [onAddChoice, choices.length]);

  const handleRemoveChoice = useCallback((idx: number) => {
    onRemoveChoice(idx);
    setActiveTab(prev => Math.max(0, prev >= idx ? prev - 1 : prev));
  }, [onRemoveChoice]);

  // Per-choice validity (used for tab dot indicator)
  const isChoiceValid = useCallback((i: number): boolean => {
    const c = choices[i];
    if (!c) return false;
    const hasText = c.text?.trim().length >= 5;
    if (complexityLevel === 'dice') {
      return hasText && !!(c.diceCheck?.stat) && (c.diceCheck?.difficulty ?? 0) >= 1;
    }
    return hasText;
  }, [choices, complexityLevel]);

  // Tab labels — expert shows dynamic text preview (updates as user types)
  const tabLabels = useMemo(() => choices.map((c, i) => {
    if (complexityLevel === 'binary') return i === 0 ? '👍 A' : '👎 B';
    if (complexityLevel === 'dice')   return choices.length === 1 ? '🎲 Dé' : `🎲 Dé ${String.fromCharCode(65 + i)}`;
    // Expert: show first 10 chars of choice text, else "Choix N"
    const preview = c.text?.trim();
    if (preview && preview.length > 0) {
      return preview.length > 10 ? `${preview.substring(0, 10)}…` : preview;
    }
    return `⚡ Choix ${String.fromCharCode(65 + i)}`;
  }), [choices, complexityLevel]);

  const canAddChoice =
    (complexityLevel === 'dice'   && choices.length < 2) ||
    (complexityLevel === 'expert' && choices.length < 4);

  return (
    <div className="space-y-6">

      {/* ── Speaker ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" aria-hidden="true" /> Qui parle ?
        </Label>
        <Select
          value={speaker || DEFAULTS.DIALOGUE_SPEAKER}
          onValueChange={onSpeakerChange}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Choisir un personnage…" />
          </SelectTrigger>
          <SelectContent>
            {characters.map((char) => (
              <SelectItem key={char.id} value={char.id} className="text-sm py-2">
                <div className="flex items-center gap-2">
                  {char.sprites?.neutral
                    ? <img src={char.sprites.neutral} alt={char.name} className="w-5 h-5 rounded object-contain bg-muted flex-shrink-0" />
                    : <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0"><span className="text-[10px]">👤</span></div>
                  }
                  <span className="font-medium truncate">{char.name}</span>
                </div>
              </SelectItem>
            ))}
            {characters.length === 0 && (
              <div className="px-4 py-4 text-center text-muted-foreground text-xs">
                Aucun personnage disponible
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* ── Dialogue text ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" /> Que dit-il ?
        </Label>
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Écris le dialogue ici…"
            className={cn(
              'min-h-[130px] text-sm resize-none focus:ring-2 focus:ring-primary/20 pr-16',
              textLen > 0 && textLen < 10 && 'border-yellow-500/50',
              textLen >= 10 && 'border-green-500/50 focus:border-green-500',
            )}
            maxLength={550}
          />
          <div className={cn(
            'absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-medium',
            'bg-background/90 backdrop-blur-sm border',
            textLen < 10 ? 'text-yellow-500' : textLen > 450 ? 'text-orange-500' : 'text-green-500',
          )}>
            {textLen}/500
          </div>
        </div>
      </div>

      {/* ── Choices section ──────────────────────────────────────────────── */}
      {complexityLevel && complexityLevel !== 'linear' && choices.length > 0 && (
        <div className="space-y-3">
          <div className="h-px bg-border" />

          {/* Tab strip */}
          <div className="flex items-center gap-1 flex-wrap">
            {tabLabels.map((label, i) => {
              const valid   = isChoiceValid(i);
              const active  = safeTab === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                    'transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    'max-w-[120px] truncate',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  title={label}
                >
                  {/* Validity dot */}
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors',
                    valid
                      ? active ? 'bg-green-300' : 'bg-green-500'
                      : active ? 'bg-white/40'  : 'bg-muted-foreground/30',
                  )} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
            {canAddChoice && (
              <button
                type="button"
                onClick={handleAddChoice}
                title="Ajouter un choix"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Active tab content — AnimatePresence for smooth swap */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={safeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {/* ── Binary ── */}
              {complexityLevel === 'binary' && choices[safeTab] && (
                <BinaryChoiceField
                  choiceIndex={safeTab as 0 | 1}
                  choice={choices[safeTab]}
                  response={responses[safeTab]}
                  defaultSpeaker={speaker}
                  scenes={scenes}
                  currentScene={currentScene}
                  currentSceneId={currentSceneId}
                  onUpdateChoice={(updates) => onUpdateChoice(safeTab, updates)}
                  onUpdateResponse={(updates) => onUpdateResponse(safeTab, updates)}
                />
              )}

              {/* ── Dice ── */}
              {complexityLevel === 'dice' && choices[safeTab] && (
                <DiceChoiceCard
                  choice={choices[safeTab]}
                  title={choices.length === 1 ? 'Dé' : `Dé ${String.fromCharCode(65 + safeTab)}`}
                  onUpdate={(updates) => onUpdateChoice(safeTab, updates)}
                  onRemove={() => handleRemoveChoice(safeTab)}
                  canRemove={choices.length > 1}
                  currentSceneId={currentSceneId}
                />
              )}

              {/* ── Expert ── */}
              {complexityLevel === 'expert' && choices[safeTab] && (
                <ComplexChoiceCard
                  choice={choices[safeTab]}
                  index={safeTab}
                  title={`Choix ${String.fromCharCode(65 + safeTab)}`}
                  onUpdate={(updates) => onUpdateChoice(safeTab, updates)}
                  onRemove={() => handleRemoveChoice(safeTab)}
                  canRemove={choices.length > 2}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default ComposerFormPanel;
