/**
 * SliderRow — Label + curseur sp-slider + valeur affichée.
 *
 * Utilisé dans EffectsSection (disabled) et TextSection (className="mb-3", ariaLabel explicite).
 *
 * Props optionnelles :
 *   - disabled   : grise et désactive le curseur (EffectsSection)
 *   - ariaLabel  : texte ARIA explicite (TextSection) — sinon auto-généré depuis label+value+unit
 *   - className  : classe CSS sur le wrapper div (ex: "mb-3" dans TextSection)
 */

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled,
  ariaLabel,
  className,
}: SliderRowProps) {
  const wrapperClass =
    [disabled ? 'opacity-40 pointer-events-none' : '', className ?? ''].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={wrapperClass}>
      <div className="sp-row">
        <span>{label}</span>
        <span>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sp-slider"
        aria-label={ariaLabel ?? `${label} : ${value}${unit}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}
