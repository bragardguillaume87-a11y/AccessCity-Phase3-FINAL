import { useMemo } from 'react';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';
import type { FeatureStatus } from '@/config/roadmapData';

const STATUS_CONFIG: Record<FeatureStatus, { emoji: string; label: string; color: string }> = {
  done: { emoji: '✅', label: 'Livré', color: 'var(--color-success)' },
  'in-progress': { emoji: '🚧', label: 'En cours', color: 'var(--color-warning)' },
  backlog: { emoji: '💡', label: 'Backlog', color: 'var(--color-accent)' },
  broken: { emoji: '⚠️', label: 'Problèmes', color: 'var(--color-danger)' },
};

const CATEGORY_COLOR: Record<string, string> = {
  Visuel: '#a78bfa',
  Audio: '#34d399',
  UX: '#60a5fa',
  Narratif: '#f472b6',
  Moteur: '#fb923c',
  Export: '#facc15',
  Infrastructure: '#94a3b8',
};

const STATUS_ORDER: FeatureStatus[] = ['done', 'in-progress', 'backlog', 'broken'];

export function StatsView() {
  const roadmapItems = useFeatureFlagsStore((s) => s.roadmapItems);
  const flags = useFeatureFlagsStore((s) => s.flags);
  const lastUpdated = useFeatureFlagsStore((s) => s.lastUpdated);

  const total = roadmapItems.length;

  // Compteurs par statut — calculés une fois (Carmack §12.2)
  const countByStatus = useMemo<Record<FeatureStatus, number>>(() => {
    const acc: Record<FeatureStatus, number> = {
      done: 0,
      'in-progress': 0,
      backlog: 0,
      broken: 0,
    };
    for (const item of roadmapItems) acc[item.status]++;
    return acc;
  }, [roadmapItems]);

  // Compteurs par catégorie
  const countByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const item of roadmapItems) {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [roadmapItems]);

  const completionRate = total > 0 ? Math.round((countByStatus.done / total) * 100) : 0;

  const activeFlags = useMemo(() => Object.values(flags).filter((f) => f.enabled).length, [flags]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return 'Jamais modifié';
    const d = new Date(lastUpdated);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [lastUpdated]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barre de progression globale */}
      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Progression globale
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>
            {completionRate}%
          </span>
        </div>
        <div
          style={{
            height: 10,
            background: 'var(--color-bg-hover)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--color-border-base)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${completionRate}%`,
              background: 'var(--color-success)',
              borderRadius: 'var(--radius-full)',
              transition: 'width var(--transition-slow)',
            }}
          />
        </div>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginTop: 6,
            margin: '6px 0 0',
          }}
        >
          {countByStatus.done} / {total} features livrées · {countByStatus['in-progress']} en cours
        </p>
      </section>

      {/* Cards de statut */}
      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            margin: '0 0 10px',
          }}
        >
          Par statut
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {STATUS_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const count = countByStatus[status];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={status}
                style={{
                  background: 'var(--color-bg-hover)',
                  border: `1px solid ${cfg.color}33`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: cfg.color, lineHeight: 1.1 }}>
                  {count}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {pct}% du total
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Répartition par catégorie */}
      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            margin: '0 0 10px',
          }}
        >
          Par catégorie
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {countByCategory.map(([cat, count]) => {
            const color = CATEGORY_COLOR[cat] ?? 'var(--color-text-muted)';
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color,
                    minWidth: 90,
                  }}
                >
                  {cat}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'var(--color-bg-hover)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width var(--transition-slow)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    minWidth: 28,
                    textAlign: 'right',
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature flags summary */}
      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            margin: '0 0 10px',
          }}
        >
          Feature flags
        </p>
        <div
          style={{
            background: 'var(--color-bg-hover)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            display: 'flex',
            gap: 24,
          }}
        >
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>
              {activeFlags}
            </span>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>actifs</p>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {Object.values(flags).length - activeFlags}
            </span>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>désactivés</p>
          </div>
        </div>
      </section>

      {/* Métadonnées */}
      <section style={{ paddingTop: 8, borderTop: '1px solid var(--color-border-base)' }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          🕐 Dernière modification :{' '}
          <strong style={{ color: 'var(--color-text-secondary)' }}>{lastUpdatedLabel}</strong>
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
          💾 Stocké dans localStorage · clé{' '}
          <code
            style={{
              fontSize: 10,
              background: 'rgba(0,0,0,0.3)',
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            accesscity-dev-dashboard
          </code>
        </p>
      </section>
    </div>
  );
}
