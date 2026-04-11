import { useState, useCallback } from 'react';
import { LayoutDashboard, Map, Flag, BarChart2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';
import { RoadmapView } from './RoadmapView';
import { FeatureFlagsView } from './FeatureFlagsView';
import { StatsView } from './StatsView';

// ============================================================
// DEV DASHBOARD MODAL
// Visible uniquement en dev (import.meta.env.DEV).
// Pattern identique à SettingsModal : sidebar + contenu.
// ============================================================

type DashboardSection = 'roadmap' | 'flags' | 'stats';

const SECTIONS: { id: DashboardSection; label: string; emoji: string; Icon: typeof Map }[] = [
  { id: 'roadmap', label: 'Roadmap', emoji: '🗺️', Icon: Map },
  { id: 'flags', label: 'Feature Flags', emoji: '🚩', Icon: Flag },
  { id: 'stats', label: 'Stats', emoji: '📊', Icon: BarChart2 },
];

interface DevDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevDashboardModal({ isOpen, onClose }: DevDashboardModalProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('roadmap');

  const roadmapItems = useFeatureFlagsStore((s) => s.roadmapItems);
  const lastUpdated = useFeatureFlagsStore((s) => s.lastUpdated);

  const handleSectionChange = useCallback((section: DashboardSection) => {
    setActiveSection(section);
  }, []);

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[92vw] h-[90vh] p-0 gap-0">
        <DialogTitle className="sr-only">Dev Dashboard — AccessCity Studio</DialogTitle>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border-base)',
            flexShrink: 0,
          }}
        >
          <LayoutDashboard size={18} color="var(--color-primary)" />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                lineHeight: 1.2,
              }}
            >
              🛠️ Dev Dashboard
            </h2>
            {lastUpdatedLabel && (
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
                Dernière modif : {lastUpdatedLabel}
              </p>
            )}
          </div>

          {/* Badges résumé rapide */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <QuickBadge
              count={roadmapItems.filter((i) => i.status === 'done').length}
              color="var(--color-success)"
              emoji="✅"
            />
            <QuickBadge
              count={roadmapItems.filter((i) => i.status === 'in-progress').length}
              color="var(--color-warning)"
              emoji="🚧"
            />
            <QuickBadge
              count={roadmapItems.filter((i) => i.status === 'backlog').length}
              color="var(--color-accent)"
              emoji="💡"
            />
            <QuickBadge
              count={roadmapItems.filter((i) => i.status === 'broken').length}
              color="var(--color-danger)"
              emoji="⚠️"
            />

            {/* Bouton fermer */}
            <button
              onClick={onClose}
              aria-label="Fermer le Dev Dashboard"
              style={{
                marginLeft: 8,
                background: 'transparent',
                border: '1px solid var(--color-border-base)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--color-border-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--color-border-base)';
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body : sidebar + contenu */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav
            style={{
              width: 180,
              flexShrink: 0,
              borderRight: '1px solid var(--color-border-base)',
              background: 'var(--color-bg-base)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 8px',
              gap: 2,
            }}
          >
            {SECTIONS.map(({ id, label, emoji, Icon }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => handleSectionChange(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'left',
                    width: '100%',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'var(--color-bg-hover)';
                      (e.currentTarget as HTMLButtonElement).style.color =
                        'var(--color-text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color =
                        'var(--color-text-muted)';
                    }
                  }}
                >
                  <span style={{ fontSize: 15 }}>{emoji}</span>
                  <Icon size={13} aria-hidden="true" />
                  {label}
                </button>
              );
            })}

            {/* Séparateur + info build */}
            <div style={{ marginTop: 'auto', paddingTop: 12 }}>
              <div
                style={{
                  height: 1,
                  background: 'var(--color-border-base)',
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  padding: '6px 12px',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  opacity: 0.7,
                }}
              >
                <p style={{ margin: 0 }}>🔧 Dev mode</p>
                <p style={{ margin: 0 }}>Ctrl+Shift+D</p>
                <p style={{ margin: 0, marginTop: 4 }}>{roadmapItems.length} features</p>
              </div>
            </div>
          </nav>

          {/* Zone de contenu */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-6">
              {activeSection === 'roadmap' && <RoadmapView />}
              {activeSection === 'flags' && <FeatureFlagsView />}
              {activeSection === 'stats' && <StatsView />}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sous-composant badge rapide header ────────────────────────────────────────

function QuickBadge({ count, color, emoji }: { count: number; color: string; emoji: string }) {
  if (count === 0) return null;
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
      }}
    >
      {emoji} {count}
    </span>
  );
}
