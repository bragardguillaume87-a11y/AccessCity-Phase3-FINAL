import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DiceCheckBranch } from '@/types';
import { useDialoguesStore } from '@/stores/dialoguesStore';

interface OutcomeEditorProps {
  type: 'success' | 'failure';
  branch: DiceCheckBranch;
  onChange: (branch: DiceCheckBranch) => void;
  /** ID de la scène courante — pour afficher les dialogues disponibles. */
  currentSceneId: string;
}

/**
 * OutcomeEditor — Sélection du dialogue cible après succès ou échec du dé.
 *
 * Utilise un Select (dialogues réels de la scène) plutôt qu'une Textarea libre,
 * pour éviter que l'utilisateur entre du texte narratif ("bravo !") à la place
 * d'un vrai ID de dialogue — ce qui causait des rejeux inattendus dans le preview.
 */
export function OutcomeEditor({ type, branch, onChange, currentSceneId }: OutcomeEditorProps) {
  const isSuccess = type === 'success';

  const config = isSuccess
    ? {
        emoji: '✅',
        label: 'En cas de succès',
        border: 'border-green-500/30',
        bg: 'bg-green-500/5',
      }
    : {
        emoji: '❌',
        label: 'En cas d\'échec',
        border: 'border-red-500/30',
        bg: 'bg-red-500/5',
      };

  const dialogues = useDialoguesStore(s => s.getDialoguesByScene(currentSceneId));

  const getDialoguePreview = useCallback((text: string, idx: number) => {
    if (!text?.trim()) return `Dialogue ${idx + 1} (vide)`;
    return text.length > 50 ? `${text.substring(0, 50)}…` : text;
  }, []);

  // Radix UI interdit value="" dans SelectItem (réservé pour vider la sélection programmatiquement).
  // On utilise un sentinel non-ambigu que l'on convertit en undefined à la sortie.
  const SENTINEL_AUTO = '__auto__';

  return (
    <div className={cn('rounded-xl p-3 border-2 space-y-2', config.border, config.bg)}>
      <Label className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-lg">{config.emoji}</span>
        {config.label}
      </Label>
      <Select
        value={branch.nextDialogueId || SENTINEL_AUTO}
        onValueChange={(value) =>
          onChange({ ...branch, nextDialogueId: value === SENTINEL_AUTO ? undefined : value })
        }
      >
        <SelectTrigger className="h-9 text-sm bg-background/60">
          <SelectValue placeholder="— Avancer automatiquement —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SENTINEL_AUTO}>— Avancer automatiquement —</SelectItem>
          {dialogues.map((d, idx) => (
            <SelectItem key={d.id} value={d.id}>
              💬 {getDialoguePreview(d.text, idx)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Optionnel — laissez vide pour avancer au dialogue suivant.
      </p>
    </div>
  );
}

export default OutcomeEditor;
