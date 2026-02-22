import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BackgroundsSection } from './BackgroundsSection';
import { TextSection } from './TextSection';
import CharacterMoodPicker from './CharacterMoodPicker';
import { ObjectsSection } from './ObjectsSection';
import { AudioSection } from './AudioSection';
import { DialogueBoxSection } from './DialogueBoxSection';
import { useUIStore } from '@/stores';
import type { SectionId } from '@/types';
import { SECTION_LABELS } from '@/types';

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
  const activeSection = useUIStore(s => s.activeSection);
  const setActiveSection = useUIStore(s => s.setActiveSection);

  const activeLabel = activeSection ? SECTION_LABELS[activeSection as SectionId] : '';

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
          className="h-full flex flex-col bg-[var(--color-bg-elevated)] border-l-4 border-l-[var(--color-primary)]"
          role="region"
          aria-label={`Section ${activeLabel}`}
        >
          {/* En-tête avec titre + bouton fermeture */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-base)] bg-[var(--color-bg-base)]">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              {activeLabel}
            </span>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label={`Fermer le panneau ${activeLabel}`}
              title="Fermer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

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
            {activeSection === 'audio' && (
              <AudioSection onOpenModal={handleOpenModal} />
            )}
            {activeSection === 'dialogue' && <DialogueBoxSection />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
