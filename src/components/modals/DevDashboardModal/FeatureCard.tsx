import { useState, useCallback } from 'react';
import { MoreHorizontal, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import type { RoadmapItem, FeatureStatus } from '@/config/roadmapData';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';

const STATUS_CONFIG: Record<FeatureStatus, { emoji: string; label: string; color: string }> = {
  done: { emoji: '✅', label: 'Livré', color: 'var(--color-success)' },
  'in-progress': { emoji: '🚧', label: 'En cours', color: 'var(--color-warning)' },
  backlog: { emoji: '💡', label: 'Backlog', color: 'var(--color-accent)' },
  broken: { emoji: '⚠️', label: 'Problème', color: 'var(--color-danger)' },
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: 'var(--color-danger)',
  P1: 'var(--color-warning)',
  P2: 'var(--color-accent)',
  P3: 'var(--color-text-muted)',
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

interface FeatureCardProps {
  item: RoadmapItem;
  onEditNotes?: (id: string) => void;
}

export function FeatureCard({ item, onEditNotes }: FeatureCardProps) {
  const updateItemStatus = useFeatureFlagsStore((s) => s.updateItemStatus);
  const removeItem = useFeatureFlagsStore((s) => s.removeItem);
  const flags = useFeatureFlagsStore((s) => s.flags);
  const toggleFlag = useFeatureFlagsStore((s) => s.toggleFlag);

  const [menuOpen, setMenuOpen] = useState(false);

  const flag = item.flagKey ? flags[item.flagKey] : null;

  const handleStatusChange = useCallback(
    (status: FeatureStatus) => {
      updateItemStatus(item.id, status);
      setMenuOpen(false);
    },
    [item.id, updateItemStatus]
  );

  const handleToggleFlag = useCallback(() => {
    if (item.flagKey) toggleFlag(item.flagKey);
  }, [item.flagKey, toggleFlag]);

  const handleRemove = useCallback(() => {
    removeItem(item.id);
  }, [item.id, removeItem]);

  const handleEditNotes = useCallback(() => {
    onEditNotes?.(item.id);
    setMenuOpen(false);
  }, [item.id, onEditNotes]);

  return (
    <div
      style={{
        background: 'var(--color-bg-hover)',
        border: '1px solid var(--color-border-base)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
      }}
    >
      {/* Header : titre + menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
          }}
        >
          {item.title}
        </span>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '2px 4px',
                borderRadius: 4,
                flexShrink: 0,
              }}
              title="Options"
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ minWidth: 160 }}>
            <DropdownMenuItem disabled style={{ fontSize: 11, opacity: 0.6, cursor: 'default' }}>
              Changer le statut
            </DropdownMenuItem>
            {(
              Object.entries(STATUS_CONFIG) as [
                FeatureStatus,
                (typeof STATUS_CONFIG)[FeatureStatus],
              ][]
            ).map(([status, cfg]) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                style={{ fontSize: 13 }}
              >
                {cfg.emoji} {cfg.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEditNotes} style={{ fontSize: 13 }}>
              ✏️ Modifier les notes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRemove}
              style={{ fontSize: 13, color: 'var(--color-danger)' }}
            >
              🗑️ Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {item.description && (
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
          {item.description}
        </p>
      )}

      {/* Notes */}
      {item.notes && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 4,
            padding: '4px 6px',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          📝 {item.notes}
        </p>
      )}

      {/* Footer : badges + flag toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Catégorie */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 'var(--radius-full)',
            background: `${CATEGORY_COLOR[item.category]}22`,
            color: CATEGORY_COLOR[item.category],
            border: `1px solid ${CATEGORY_COLOR[item.category]}44`,
          }}
        >
          {item.category}
        </span>

        {/* Priorité */}
        {item.priority && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: PRIORITY_COLOR[item.priority],
              opacity: 0.85,
            }}
          >
            {item.priority}
          </span>
        )}

        {/* Since */}
        {item.since && (
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            {item.since}
          </span>
        )}
      </div>

      {/* Feature flag toggle */}
      {flag && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 6,
            borderTop: '1px solid var(--color-border-base)',
            marginTop: 2,
          }}
        >
          <Flag size={11} color="var(--color-primary)" />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flex: 1 }}>
            {flag.label}
          </span>
          <Switch
            checked={flag.enabled}
            onCheckedChange={handleToggleFlag}
            aria-label={`Activer/désactiver ${flag.label}`}
          />
        </div>
      )}
    </div>
  );
}
