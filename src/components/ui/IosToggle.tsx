/**
 * IosToggle — Bouton bascule style iOS (switch ON/OFF).
 *
 * Utilisé dans EffectsSection, BackgroundsSection, AudioSection.
 */

interface IosToggleProps {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}

export function IosToggle({ enabled, onToggle, label }: IosToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={[
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
        enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-hover)]',
      ].join(' ')}
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? 'Désactiver' : 'Activer'} ${label}`}
    >
      <span
        className={[
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-4' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  );
}
