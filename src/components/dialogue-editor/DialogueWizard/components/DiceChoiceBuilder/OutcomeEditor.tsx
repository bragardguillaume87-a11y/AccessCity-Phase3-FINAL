import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DiceCheckBranch } from '@/types';
import { GAME_STATS } from '@/i18n';
// useSceneDialogues utilise EMPTY_DIALOGUES (référence stable) — évite boucle infinie
// ⚠️ NE PAS utiliser useDialoguesStore(s => s.getDialoguesByScene(...)) ici :
//    getDialoguesByScene retourne || [] inline → nouvelle référence → re-render infini
import { useSceneDialogues } from '@/stores/selectors';

interface OutcomeEditorProps {
  type: 'success' | 'failure';
  branch: DiceCheckBranch;
  onChange: (branch: DiceCheckBranch) => void;
  currentSceneId: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Presets récompense / pénalité
// ────────────────────────────────────────────────────────────────────────────

const SENTINEL_NONE = '__none__';
const SENTINEL_AUTO = '__auto__';

interface StatPreset {
  key: string;
  label: string;
  stat: string;
  amount: number;
}

const SUCCESS_PRESETS: StatPreset[] = [
  {
    key: `${GAME_STATS.PHYSIQUE}_5`,
    label: '+5 Physique 💪',
    stat: GAME_STATS.PHYSIQUE,
    amount: 5,
  },
  {
    key: `${GAME_STATS.PHYSIQUE}_10`,
    label: '+10 Physique 💪',
    stat: GAME_STATS.PHYSIQUE,
    amount: 10,
  },
  { key: `${GAME_STATS.MENTALE}_5`, label: '+5 Mentale 🧠', stat: GAME_STATS.MENTALE, amount: 5 },
  {
    key: `${GAME_STATS.MENTALE}_10`,
    label: '+10 Mentale 🧠',
    stat: GAME_STATS.MENTALE,
    amount: 10,
  },
];

const FAILURE_PRESETS: StatPreset[] = [
  {
    key: `${GAME_STATS.PHYSIQUE}_-5`,
    label: '-5 Physique 💪',
    stat: GAME_STATS.PHYSIQUE,
    amount: -5,
  },
  {
    key: `${GAME_STATS.PHYSIQUE}_-10`,
    label: '-10 Physique 💪',
    stat: GAME_STATS.PHYSIQUE,
    amount: -10,
  },
  { key: `${GAME_STATS.MENTALE}_-5`, label: '-5 Mentale 🧠', stat: GAME_STATS.MENTALE, amount: -5 },
  {
    key: `${GAME_STATS.MENTALE}_-10`,
    label: '-10 Mentale 🧠',
    stat: GAME_STATS.MENTALE,
    amount: -10,
  },
];

function effectToKey(statEffect: DiceCheckBranch['statEffect']): string {
  if (!statEffect) return SENTINEL_NONE;
  return `${statEffect.stat}_${statEffect.amount}`;
}

function keyToEffect(key: string, presets: StatPreset[]): DiceCheckBranch['statEffect'] {
  if (key === SENTINEL_NONE) return undefined;
  const preset = presets.find((p) => p.key === key);
  return preset ? { stat: preset.stat, amount: preset.amount } : undefined;
}

export function OutcomeEditor({ type, branch, onChange, currentSceneId }: OutcomeEditorProps) {
  const isSuccess = type === 'success';

  const config = isSuccess
    ? { emoji: '✅', label: 'Si ça réussit', border: 'border-green-500/30', bg: 'bg-green-500/5' }
    : { emoji: '❌', label: 'Si ça rate', border: 'border-red-500/30', bg: 'bg-red-500/5' };

  const presets = isSuccess ? SUCCESS_PRESETS : FAILURE_PRESETS;
  const effectPlaceholder = isSuccess ? '— Rien de spécial —' : '— Aucune conséquence —';

  const dialogues = useSceneDialogues(currentSceneId);

  const getDialoguePreview = useCallback((text: string, idx: number) => {
    if (!text?.trim()) return `Dialogue ${idx + 1} (vide)`;
    return text.length > 50 ? `${text.substring(0, 50)}…` : text;
  }, []);

  return (
    <div className={cn('rounded-xl p-3 border-2 space-y-3', config.border, config.bg)}>
      <Label className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-lg">{config.emoji}</span>
        {config.label}
      </Label>

      {/* Sélecteur de dialogue suivant */}
      <Select
        value={branch.nextDialogueId || SENTINEL_AUTO}
        onValueChange={(value) =>
          onChange({ ...branch, nextDialogueId: value === SENTINEL_AUTO ? undefined : value })
        }
      >
        <SelectTrigger className="h-9 text-sm bg-background/60">
          <SelectValue placeholder="— Suite automatique —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SENTINEL_AUTO}>— Suite automatique —</SelectItem>
          {dialogues.map((d, idx) => (
            <SelectItem key={d.id} value={d.id}>
              💬 {getDialoguePreview(d.text, idx)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Presets récompense / pénalité */}
      <Select
        value={effectToKey(branch.statEffect)}
        onValueChange={(value) => onChange({ ...branch, statEffect: keyToEffect(value, presets) })}
      >
        <SelectTrigger className="h-9 text-sm bg-background/60">
          <SelectValue placeholder={effectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SENTINEL_NONE}>{effectPlaceholder}</SelectItem>
          {presets.map((p) => (
            <SelectItem key={p.key} value={p.key}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default OutcomeEditor;
