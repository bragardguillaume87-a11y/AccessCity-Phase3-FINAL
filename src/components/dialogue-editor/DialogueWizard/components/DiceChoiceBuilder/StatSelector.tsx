import { cn } from '@/lib/utils';
import { GAME_STATS } from '@/i18n';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const STATS = [
  {
    value: GAME_STATS.PHYSIQUE,
    label: 'Physique',
    emoji: '💪',
    tooltip: 'Le personnage agit physiquement : courir, grimper, résister...',
  },
  {
    value: GAME_STATS.MENTALE,
    label: 'Mentale',
    emoji: '🧠',
    tooltip: 'Le personnage réfléchit ou convainc : argumenter, observer, se souvenir...',
  },
];

export function StatSelector({ value, onChange }: StatSelectorProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-2">
        {STATS.map((stat) => {
          const isSelected = value === stat.value;
          return (
            <Tooltip key={stat.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChange(stat.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border text-sm font-medium transition-all',
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                      : 'border-border bg-background/40 text-muted-foreground hover:border-purple-500/50 hover:bg-purple-500/10'
                  )}
                >
                  <span>{stat.emoji}</span>
                  <span>{stat.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[180px] text-center">
                {stat.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default StatSelector;
