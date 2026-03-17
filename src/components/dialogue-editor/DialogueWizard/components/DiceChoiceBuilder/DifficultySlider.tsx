import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DifficultySliderProps {
  value: number;
  onChange: (value: number) => void;
}

function getDifficultyConfig(value: number) {
  if (value <= 4)  return { label: 'Facile',    color: 'text-green-400',   bg: 'bg-green-500' };
  if (value <= 8)  return { label: 'Possible',  color: 'text-emerald-400', bg: 'bg-emerald-500' };
  if (value <= 12) return { label: 'Risqué',    color: 'text-amber-400',   bg: 'bg-amber-500' };
  if (value <= 16) return { label: 'Difficile', color: 'text-orange-400',  bg: 'bg-orange-500' };
  return                  { label: 'Extrême',   color: 'text-red-400',     bg: 'bg-red-500' };
}

export function DifficultySlider({ value, onChange }: DifficultySliderProps) {
  const config = getDifficultyConfig(value);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-2">
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('text-xl font-bold tabular-nums cursor-help', config.color)}>
                {value}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              1 = réussit toujours · 20 = presque impossible
            </TooltipContent>
          </Tooltip>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full text-white', config.bg)}>
            {config.label}
          </span>
        </div>
        <Slider
          value={[value]}
          onValueChange={([val]) => onChange(val)}
          min={1}
          max={20}
          step={1}
          className="w-full"
        />
      </div>
    </TooltipProvider>
  );
}

export default DifficultySlider;
