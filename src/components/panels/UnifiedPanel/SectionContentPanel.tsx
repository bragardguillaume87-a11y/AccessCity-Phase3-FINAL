import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Image, Volume2, Users, Package, MessageSquare, Type, Sparkles } from 'lucide-react';
import { BackgroundsSection } from './BackgroundsSection';
import { TextSection } from './TextSection';
import CharacterMoodPicker from './CharacterMoodPicker';
import { ObjectsSection } from './ObjectsSection';
import { AudioSection } from './AudioSection';
import { DialogueBoxSection } from './DialogueBoxSection';
import { EffectsSection } from './EffectsSection';
import { useUIStore } from '@/stores';
import type { SectionId } from '@/types';
import { SECTION_LABELS } from '@/types';

const SECTION_ICONS: Record<
  SectionId,
  React.FC<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>
> = {
  backgrounds: Image,
  audio: Volume2,
  characters: Users,
  objects: Package,
  dialogue: MessageSquare,
  text: Type,
  effects: Sparkles,
};

// Re-exports for backward compatibility
export type { SectionId } from '@/types';
export { SECTION_LABELS } from '@/types';

/**
 * SectionContentPanel — Panneau de contenu pour les sections de l'UnifiedPanel.
 *
 * Contient le contenu (fonds, texte, personnages, objets, audio) précédemment
 * rendu via createPortal dans UnifiedPanel. Désormais placé comme vrai Panel
 * dans le layout EditorShell (4 panneaux : gauche | canvas | contenu | icones).
 *
 * Lit `activeSection` directement depuis uiStore — aucune prop nécessaire.
 */
export function SectionContentPanel() {
  const activeSection = useUIStore((s) => s.activeSection);
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  const activeLabel = activeSection ? SECTION_LABELS[activeSection as SectionId] : '';
  const SectionIcon = activeSection ? SECTION_ICONS[activeSection as SectionId] : null;

  const handleClose = useCallback(() => {
    setActiveSection(null);
  }, [setActiveSection]);

  const handleOpenModal = useCallback((modal: string, context: unknown = {}) => {
    const store = useUIStore.getState();
    store.setActiveModal(modal);
    store.setModalContext(context as Parameters<typeof store.setModalContext>[0]);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {activeSection && (
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.15 }}
          className="h-full flex flex-col bg-[var(--color-bg-elevated)]"
          role="region"
          aria-label={`Section ${activeLabel}`}
        >
          {/* En-tête — classes studio.css : gradient, icône badge, titre Syne */}
          <div className="panel-header">
            <div className="panel-header-left">
              {SectionIcon && (
                <div className="panel-header-icon">
                  <SectionIcon size={14} aria-hidden="true" />
                </div>
              )}
              <span className="panel-header-title">{activeLabel}</span>
            </div>
            <button
              className="panel-close"
              onClick={handleClose}
              aria-label={`Fermer le panneau ${activeLabel}`}
              title="Fermer"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Sous-titre : portée globale du panneau Style */}
          {activeSection === 'text' && (
            <div
              style={{
                padding: '4px 12px 5px',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-border-base)',
                letterSpacing: '0.02em',
              }}
            >
              Tous les dialogues du projet
            </div>
          )}

          {/* Zone de contenu défilable */}
          <div className="flex-1 overflow-y-auto">
            {activeSection === 'backgrounds' && (
              <BackgroundsSection onOpenModal={handleOpenModal} />
            )}
            {activeSection === 'text' && <TextSection />}
            {activeSection === 'characters' && (
              <div className="p-2">
                <CharacterMoodPicker />
              </div>
            )}
            {activeSection === 'objects' && <ObjectsSection />}
            {activeSection === 'audio' && <AudioSection onOpenModal={handleOpenModal} />}
            {activeSection === 'dialogue' && <DialogueBoxSection />}
            {activeSection === 'effects' && <EffectsSection />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
