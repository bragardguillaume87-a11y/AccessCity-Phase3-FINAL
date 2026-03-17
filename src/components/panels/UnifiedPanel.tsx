import { useCallback } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Image,
  Type,
  Users,
  Package,
  Volume2,
  LayoutTemplate,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '@/stores';
import { useIsKidMode } from '@/hooks/useIsKidMode';
import type { SectionId } from '@/types';

/**
 * UnifiedPanel — Barre d'icônes fixe (style Powtoon).
 *
 * Architecture 4-panneaux :
 *   Panel gauche   (Explorer/LeftPanel)
 *   Panel canvas   (MainCanvas)
 *   Panel contenu  (SectionContentPanel — géré par uiStore)
 *   Panel icônes   (UnifiedPanel — ce composant, toujours 64px)
 *
 * activeSection est lu depuis uiStore directement — plus de prop drilling.
 * Chaque bouton a un Radix Tooltip (side="left") pour l'accessibilité.
 */

type SectionEntry = { id: SectionId; icon: React.FC<{ size?: number }>; label: string } | null;

const SECTIONS: SectionEntry[] = [
  { id: 'backgrounds', icon: Image, label: 'Fond' },
  { id: 'audio', icon: Volume2, label: 'Audio' },
  { id: 'characters', icon: Users, label: 'Persos' },
  { id: 'objects', icon: Package, label: 'Objets' },
  null, // séparateur
  { id: 'dialogue', icon: MessageSquare, label: 'Dialogue' },
  { id: 'text', icon: Type, label: 'Texte' },
  { id: 'effects', icon: Sparkles, label: 'Effets' },
];

export interface UnifiedPanelProps {
  /** Reset all panel widths to default proportions (imperative — leftPanelRef) */
  onResetLayout?: () => void;
}

export default function UnifiedPanel({ onResetLayout }: UnifiedPanelProps) {
  const activeSection = useUIStore((s) => s.activeSection);
  const isKid = useIsKidMode();

  // En mode kid, masquer uniquement les effets d'animation (trop complexes pour élèves).
  // Audio reste visible — les élèves ont besoin d'ajouter de la musique à leurs scènes.
  const sections = isKid
    ? SECTIONS.filter((entry) => entry === null || entry.id !== 'effects')
    : SECTIONS;

  const handleIconClick = useCallback((id: SectionId) => {
    const { activeSection: current, setActiveSection } = useUIStore.getState();
    setActiveSection(current === id ? null : id);
  }, []);

  return (
    <Tooltip.Provider delayDuration={400}>
      <div
        className="h-full w-full flex flex-col items-center bg-[var(--color-bg-elevated)]"
        role="toolbar"
        aria-label="Outils d'édition de scène"
      >
        {/* En-tête identité */}
        <div className="flex-shrink-0 w-full flex items-center justify-center h-9 border-b border-[var(--color-border-base)]">
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-text-primary)',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 3,
                height: 10,
                borderRadius: 2,
                background: 'var(--color-primary)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Outils
          </span>
        </div>

        {/* Boutons icônes — classes toolbar-btn de studio.css + Radix Tooltip */}
        <div className="flex-1 flex flex-col items-center py-2 w-full">
          {sections.map((entry, i) => {
            // Séparateur
            if (entry === null) {
              return <div key={`sep-${i}`} className="toolbar-sep" aria-hidden="true" />;
            }

            const { id, icon: Icon, label } = entry;
            const isActive = activeSection === id;

            return (
              <Tooltip.Root key={id}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => handleIconClick(id)}
                    className={`toolbar-btn${isActive ? ' active' : ''}`}
                    aria-pressed={isActive}
                    aria-label={label}
                  >
                    <Icon size={22} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="left" className="toolbar-tooltip" sideOffset={8}>
                    {label}
                    <Tooltip.Arrow className="toolbar-tooltip-arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>

        {/* Séparateur + Reset layout */}
        {onResetLayout && (
          <>
            <div className="toolbar-sep" aria-hidden="true" />
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={onResetLayout}
                  className="toolbar-btn toolbar-reset"
                  aria-label="Réinitialiser les proportions des panneaux"
                >
                  <LayoutTemplate size={18} aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="left" className="toolbar-tooltip" sideOffset={8}>
                  Réinitialiser la disposition
                  <Tooltip.Arrow className="toolbar-tooltip-arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <div style={{ height: 8 }} />
          </>
        )}
      </div>
    </Tooltip.Provider>
  );
}
