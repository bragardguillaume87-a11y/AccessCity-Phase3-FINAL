import { useMemo } from 'react';
import type { RoadmapItem, FeatureStatus } from '@/config/roadmapData';
import { FeatureCard } from './FeatureCard';

const COLUMN_CONFIG: Record<
  FeatureStatus,
  { emoji: string; label: string; color: string; bg: string }
> = {
  done: {
    emoji: '✅',
    label: 'Livré',
    color: 'var(--color-success)',
    bg: 'rgba(16,185,129,0.06)',
  },
  'in-progress': {
    emoji: '🚧',
    label: 'En cours',
    color: 'var(--color-warning)',
    bg: 'rgba(245,158,11,0.06)',
  },
  backlog: {
    emoji: '💡',
    label: 'Backlog',
    color: 'var(--color-accent)',
    bg: 'rgba(100,149,237,0.06)',
  },
  broken: {
    emoji: '⚠️',
    label: 'Problèmes',
    color: 'var(--color-danger)',
    bg: 'rgba(239,68,68,0.06)',
  },
};

interface KanbanColumnProps {
  status: FeatureStatus;
  items: RoadmapItem[];
  onEditNotes?: (id: string) => void;
}

export function KanbanColumn({ status, items, onEditNotes }: KanbanColumnProps) {
  const cfg = COLUMN_CONFIG[status];

  // Pré-calculer le count une fois (Carmack §12.2 — pas de .filter() dans le render)
  const count = useMemo(() => items.length, [items]);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: cfg.bg,
        border: `1px solid ${cfg.color}22`,
        borderRadius: 'var(--radius-lg)',
        padding: 12,
      }}
    >
      {/* Header colonne */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingBottom: 8,
          borderBottom: `1px solid ${cfg.color}33`,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: cfg.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {cfg.label}
        </span>
        {/* Badge count */}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 600,
            color: cfg.color,
            background: `${cfg.color}22`,
            padding: '1px 7px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {count === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              padding: '24px 8px',
              opacity: 0.6,
            }}
          >
            Aucune feature
          </p>
        ) : (
          items.map((item) => <FeatureCard key={item.id} item={item} onEditNotes={onEditNotes} />)
        )}
      </div>
    </div>
  );
}
