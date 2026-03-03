import { useCallback } from 'react';
import { Image, Type, Users, Package, Volume2, LayoutTemplate, MessageSquare, Sparkles } from 'lucide-react';
import { useUIStore } from '@/stores';
import { useIsKidMode } from '@/hooks/useIsKidMode';
import type { SectionId } from '@/types';

/**
 * UnifiedPanel — Barre d'icônes fixe 64px (style Powtoon).
 *
 * Architecture 4-panneaux :
 *   Panel gauche   (Explorer/LeftPanel)
 *   Panel canvas   (MainCanvas)
 *   Panel contenu  (SectionContentPanel — géré par uiStore)
 *   Panel icônes   (UnifiedPanel — ce composant, toujours 64px)
 *
 * activeSection est lu depuis uiStore directement — plus de prop drilling.
 */

const SECTIONS = [
  { id: 'backgrounds' as SectionId, icon: Image,         label: 'Fond'     },
  { id: 'audio'       as SectionId, icon: Volume2,       label: 'Audio'    },
  { id: 'characters'  as SectionId, icon: Users,         label: 'Persos'   },
  { id: 'objects'     as SectionId, icon: Package,       label: 'Objets'   },
  { id: 'dialogue'    as SectionId, icon: MessageSquare, label: 'Dialogue' },
  { id: 'text'        as SectionId, icon: Type,          label: 'Texte'    },
  { id: 'effects'     as SectionId, icon: Sparkles,      label: 'Effets'   },
];

export interface UnifiedPanelProps {
  /** Reset all panel widths to default proportions (imperative — leftPanelRef) */
  onResetLayout?: () => void;
}

export default function UnifiedPanel({ onResetLayout }: UnifiedPanelProps) {
  const activeSection = useUIStore(s => s.activeSection);
  const isKid = useIsKidMode();

  // En mode kid, masquer uniquement les effets d'animation (trop complexes pour élèves).
  // Audio reste visible — les élèves ont besoin d'ajouter de la musique à leurs scènes.
  const sections = isKid
    ? SECTIONS.filter(s => s.id !== 'effects')
    : SECTIONS;

  const handleIconClick = useCallback((id: SectionId) => {
    const { activeSection: current, setActiveSection } = useUIStore.getState();
    setActiveSection(current === id ? null : id);
  }, []);

  return (
    <div
      className="h-full w-full flex flex-col items-center bg-[var(--color-bg-elevated)]"
      role="toolbar"
      aria-label="Outils d'édition de scène"
    >
      {/* En-tête identité */}
      <div className="flex-shrink-0 w-full flex items-center justify-center h-9 border-b border-[var(--color-border-base)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] select-none">
          Outils
        </span>
      </div>

      {/* Boutons icônes — classes toolbar-btn de studio.css */}
      <div className="flex-1 flex flex-col items-center py-2 w-full">
        {sections.map(({ id, icon: Icon, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleIconClick(id)}
              className={`toolbar-btn${isActive ? ' active' : ''}`}
              aria-pressed={isActive}
              aria-label={label}
              title={label}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Séparateur + Reset layout */}
      {onResetLayout && (
        <>
          <div className="toolbar-sep" aria-hidden="true" />
          <button
            onClick={onResetLayout}
            className="toolbar-btn toolbar-reset"
            title="Réinitialiser les proportions des panneaux"
            aria-label="Réinitialiser les proportions des panneaux"
          >
            <LayoutTemplate size={18} aria-hidden="true" />
            <span>Reset</span>
          </button>
          <div style={{ height: 8 }} />
        </>
      )}
    </div>
  );
}
