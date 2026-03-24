import { useMemo, useCallback } from 'react';
import { Flag, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';
import type { FeatureCategory, FeatureFlag } from '@/config/roadmapData';

const CATEGORY_ORDER: FeatureCategory[] = [
  'Visuel',
  'Audio',
  'UX',
  'Narratif',
  'Moteur',
  'Export',
  'Infrastructure',
];

const CATEGORY_COLOR: Record<FeatureCategory, string> = {
  Visuel: '#a78bfa',
  Audio: '#34d399',
  UX: '#60a5fa',
  Narratif: '#f472b6',
  Moteur: '#fb923c',
  Export: '#facc15',
  Infrastructure: '#94a3b8',
};

export function FeatureFlagsView() {
  const flags = useFeatureFlagsStore((s) => s.flags);
  const toggleFlag = useFeatureFlagsStore((s) => s.toggleFlag);

  // Regrouper les flags par catégorie — calculé une fois (Carmack §12.2)
  const flagsByCategory = useMemo(() => {
    const map: Partial<Record<FeatureCategory, FeatureFlag[]>> = {};
    for (const flag of Object.values(flags)) {
      if (!map[flag.category]) map[flag.category] = [];
      map[flag.category]!.push(flag);
    }
    return map;
  }, [flags]);

  const activeCount = useMemo(() => Object.values(flags).filter((f) => f.enabled).length, [flags]);
  const totalCount = Object.values(flags).length;

  const handleToggle = useCallback((key: string) => () => toggleFlag(key), [toggleFlag]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Résumé */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--color-bg-hover)',
          border: '1px solid var(--color-border-base)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
        }}
      >
        <Flag size={15} color="var(--color-primary)" />
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-primary)' }}>{activeCount}</strong> / {totalCount}{' '}
          flags actifs
        </span>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Info size={11} />
          Persisté dans localStorage
        </div>
      </div>

      {/* Note d'usage */}
      <div
        style={{
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}
      >
        🔧 <strong style={{ color: 'var(--color-text-secondary)' }}>Feature flags :</strong> les
        toggles permettent d'activer/désactiver des fonctionnalités sans redémarrer. Utiliser{' '}
        <code
          style={{
            fontSize: 11,
            background: 'rgba(0,0,0,0.3)',
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          useFeatureFlag('key')
        </code>{' '}
        dans les composants pour lire l'état.
      </div>

      {/* Groupes par catégorie */}
      {CATEGORY_ORDER.filter((cat) => flagsByCategory[cat]?.length).map((category) => {
        const categoryFlags = flagsByCategory[category]!;
        const color = CATEGORY_COLOR[category];

        return (
          <section key={category}>
            {/* Header catégorie */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color,
                  background: `${color}22`,
                  border: `1px solid ${color}44`,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {category}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border-base)' }} />
            </div>

            {/* Liste des flags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {categoryFlags.map((flag) => (
                <FlagRow key={flag.key} flag={flag} onToggle={handleToggle(flag.key)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Sous-composant ligne de flag ──────────────────────────────────────────────

interface FlagRowProps {
  flag: FeatureFlag;
  onToggle: () => void;
}

function FlagRow({ flag, onToggle }: FlagRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        transition: 'var(--transition-fast)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {/* Indicateur enabled */}
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: flag.enabled ? 'var(--color-success)' : 'var(--color-text-muted)',
          flexShrink: 0,
          transition: 'var(--transition-fast)',
        }}
      />

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {flag.label}
        </p>
        {flag.description && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
            {flag.description}
          </p>
        )}
        <code style={{ fontSize: 10, color: 'var(--color-text-muted)', opacity: 0.7 }}>
          {flag.key}
        </code>
      </div>

      {/* Toggle */}
      <Switch
        checked={flag.enabled}
        onCheckedChange={onToggle}
        aria-label={`${flag.enabled ? 'Désactiver' : 'Activer'} ${flag.label}`}
      />
    </div>
  );
}
