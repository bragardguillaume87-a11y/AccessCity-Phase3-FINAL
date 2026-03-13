import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sword, Brain, Crown } from 'lucide-react';

export interface CharacterStatsSectionProps {
  isProtagonist: boolean;
  initialStats: { physique?: number; mentale?: number };
  onToggleProtagonist: (value: boolean) => void;
  onUpdateStat: (stat: 'physique' | 'mentale', value: number) => void;
}

/**
 * CharacterStatsSection — Toggle protagoniste + sliders physique/mentale.
 *
 * Affiché dans l'éditeur expert. Les stats initiales sont utilisées par le
 * PreviewPlayer comme point de départ du jeu quand ce personnage est protagoniste.
 */
export default function CharacterStatsSection({
  isProtagonist,
  initialStats,
  onToggleProtagonist,
  onUpdateStat,
}: CharacterStatsSectionProps) {
  const physique = initialStats.physique ?? 100;
  const mentale  = initialStats.mentale  ?? 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-amber-400" />
        <h3 className="text-lg font-semibold">Stats de jeu</h3>
      </div>

      {/* Protagoniste toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-600/40 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <Crown className="h-4 w-4 text-amber-400" />
          <div>
            <p className="text-sm font-medium">Protagoniste</p>
            <p className="text-xs text-muted-foreground">
              Les stats ci-dessous s'appliquent au joueur en preview
            </p>
          </div>
        </div>
        <Switch
          checked={isProtagonist}
          onCheckedChange={onToggleProtagonist}
          aria-label="Protagoniste"
        />
      </div>

      {/* Stats sliders — visibles même si non protagoniste pour préparer */}
      <div className="space-y-4">
        {/* Physique */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sword className="h-4 w-4 text-rose-400" />
              Physique
            </Label>
            <span className={`text-sm font-bold tabular-nums ${
              physique >= 70 ? 'text-green-400'
              : physique >= 40 ? 'text-amber-400'
              : 'text-red-400'
            }`}>
              {physique}
            </span>
          </div>
          <Slider
            value={[physique]}
            onValueChange={([v]) => onUpdateStat('physique', v)}
            min={0}
            max={100}
            step={5}
            className="cursor-pointer"
            aria-label="Physique initial"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0 — épuisé</span>
            <span>100 — au sommet</span>
          </div>
        </div>

        {/* Mentale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Brain className="h-4 w-4 text-violet-400" />
              Mentale
            </Label>
            <span className={`text-sm font-bold tabular-nums ${
              mentale >= 70 ? 'text-green-400'
              : mentale >= 40 ? 'text-amber-400'
              : 'text-red-400'
            }`}>
              {mentale}
            </span>
          </div>
          <Slider
            value={[mentale]}
            onValueChange={([v]) => onUpdateStat('mentale', v)}
            min={0}
            max={100}
            step={5}
            className="cursor-pointer"
            aria-label="Mentale initial"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0 — effondré</span>
            <span>100 — équilibré</span>
          </div>
        </div>
      </div>

      {!isProtagonist && (
        <p className="text-xs text-muted-foreground italic border border-dashed border-slate-600/40 rounded-lg p-2 text-center">
          Activez "Protagoniste" pour que ces stats s'appliquent en preview
        </p>
      )}
    </div>
  );
}
