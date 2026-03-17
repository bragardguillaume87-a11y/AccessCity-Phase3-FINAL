import { GitBranch, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DialogueChoice } from '@/types';
import type { ComplexityLevel } from '@/types';

// ── Speaker color hash — same algorithm as DialogueCard ──────────────────────
const SPEAKER_PALETTE = [
  'bg-blue-500',    'bg-emerald-500', 'bg-purple-500', 'bg-rose-500',
  'bg-amber-500',   'bg-cyan-500',    'bg-indigo-500', 'bg-pink-500',
  'bg-orange-500',
] as const;

function getSpeakerColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return SPEAKER_PALETTE[Math.abs(hash) % SPEAKER_PALETTE.length];
}

// ── Type badge map ────────────────────────────────────────────────────────────
const TYPE_BADGES: Record<ComplexityLevel, { emoji: string; label: string }> = {
  linear: { emoji: '📖', label: 'Simple' },
  binary: { emoji: '🔀', label: 'À choisir' },
  dice:   { emoji: '🎲', label: 'Dés' },
  expert: { emoji: '⚡', label: 'Expert' },
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface ComposerPreviewPanelProps {
  /** Resolved character name (not ID) */
  speakerName: string;
  text: string;
  choices: DialogueChoice[];
  complexityLevel: ComplexityLevel | null;
  isSaved?: boolean;
}

/**
 * ComposerPreviewPanel — Live VN textbox preview.
 *
 * Updates in real-time as the user types in the left pane.
 * Replaces StepReview — always visible on the right side of the Composer.
 */
export function ComposerPreviewPanel({
  speakerName,
  text,
  choices,
  complexityLevel,
  isSaved = false,
}: ComposerPreviewPanelProps) {
  const speakerColor = getSpeakerColor(speakerName);
  const badge        = complexityLevel ? TYPE_BADGES[complexityLevel] : null;
  const hasChoices   = choices.length > 0 && complexityLevel !== 'linear';

  return (
    <div className="flex flex-col gap-3">

      {/* Header row */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Aperçu en direct
        </span>
        {badge && (
          <span className="text-xs text-muted-foreground font-medium">
            {badge.emoji} {badge.label}
          </span>
        )}
      </div>

      {/* VN Textbox */}
      <div
        className={cn(
          'rounded-xl border overflow-hidden flex-shrink-0',
          'bg-gradient-to-b from-slate-800/90 to-slate-900/95',
          'border-slate-700 shadow-xl transition-all duration-300',
          isSaved && 'ring-2 ring-green-500/60',
        )}
      >
        {/* Speaker bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/50">
          <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', speakerColor)} />
          <span className="text-sm font-bold text-white truncate flex-1">
            {speakerName}
          </span>
          <div className="text-slate-400 flex-shrink-0">
            {complexityLevel === 'linear'
              ? <MessageSquare className="w-3 h-3" aria-hidden="true" />
              : <GitBranch      className="w-3 h-3" aria-hidden="true" />
            }
          </div>
        </div>

        {/* Dialogue text */}
        <div className="px-4 py-4 min-h-[80px]">
          {text ? (
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</p>
          ) : (
            <p className="text-sm text-slate-500 italic">Le dialogue apparaîtra ici…</p>
          )}
        </div>

        {/* Scroll indicator (linear only) */}
        {!hasChoices && (
          <div className="flex justify-end px-4 pb-3">
            <span className="text-slate-500 text-xs" aria-hidden="true">▼</span>
          </div>
        )}
      </div>

      {/* Choice buttons (binary / expert / dice) */}
      {hasChoices && (
        <div className="space-y-1.5 flex-shrink-0">
          {choices.map((choice, index) => (
            <div
              key={choice.id}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg border text-left text-sm',
                'bg-slate-800/60 border-slate-600 text-slate-300 transition-opacity',
                !choice.text?.trim() && 'opacity-40',
              )}
            >
              <span>{choice.text?.trim() || `Choix ${index + 1}…`}</span>
              {choice.diceCheck && (
                <span className="ml-2 text-xs text-purple-400">
                  🎲 {choice.diceCheck.stat} ≥{choice.diceCheck.difficulty}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save confirmation */}
      {isSaved && (
        <div className="flex items-center justify-center gap-2 py-2 text-green-500 font-semibold text-sm flex-shrink-0">
          ✓ Dialogue sauvegardé !
        </div>
      )}
    </div>
  );
}

export default ComposerPreviewPanel;
