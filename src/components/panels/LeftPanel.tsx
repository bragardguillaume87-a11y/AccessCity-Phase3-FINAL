import React, { Suspense } from 'react';
import { Film } from 'lucide-react';
import { motion } from 'framer-motion';
import DialoguesPanel from './DialoguesPanel';
import { LeftPanelJumpBar } from './LeftPanelJumpBar';
import { useUIStore } from '../../stores/index';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneWithElements } from '@/stores/selectors';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DialogueComposerV2 as DialogueComposer } from '../dialogue-editor/DialogueComposerV2';
import { useIsCosmosTheme } from '@/hooks/useGraphTheme';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import type { Dialogue } from '@/types';
import { isCinematicScene } from '@/types';

// PHASE 4 (Option 4): Lazy load DialogueGraphModal for bundle optimization
// This modal contains ReactFlow, Dagre, and theme system (~300KB)
const DialogueGraphModal = React.lazy(() =>
  import('../modals/DialogueGraphModal').then((module) => ({ default: module.DialogueGraphModal }))
);

/**
 * LeftPanel - Système d'onglets Scènes/Dialogues (PHASE 2)
 * Remplace ScenesSidebar dans EditorShell
 *
 * Features:
 * - Toggle entre vue Scènes et vue Dialogues
 * - Radix-UI Tabs pour accessibilité WCAG 2.2 AA
 * - Gaming aesthetic avec border-bottom indicator
 * - Keyboard navigation (Arrow Left/Right, Home/End)
 */
export interface LeftPanelProps {
  activeTab: 'scenes' | 'dialogues';
  onTabChange: (tab: 'scenes' | 'dialogues') => void;
  onDialogueSelect?: (sceneId: string, index: number, metadata?: unknown) => void;
  onSceneSelect?: (sceneId: string) => void;
}

export default function LeftPanel({ onDialogueSelect, onSceneSelect }: LeftPanelProps) {
  // Zustand stores
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setScenesBrowserOpen = useUIStore((state) => state.setScenesBrowserOpen);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const selectedScene = useSceneWithElements(selectedSceneForEdit);
  const isCinematicSelected = isCinematicScene(selectedScene);
  const addDialogue = useDialoguesStore((state) => state.addDialogue);
  const addDialogues = useDialoguesStore((state) => state.addDialogues);
  const insertDialoguesAfter = useDialoguesStore((state) => state.insertDialoguesAfter);
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);

  // DialogueWizard state from UIStore (no more prop-drilling)
  const wizardOpen = useUIStore((state) => state.dialogueWizardOpen);
  const setWizardOpen = useUIStore((state) => state.setDialogueWizardOpen);
  const editDialogueIndex = useUIStore((state) => state.dialogueWizardEditIndex);
  const setEditDialogueIndex = useUIStore((state) => state.setDialogueWizardEditIndex);

  // DialogueGraph modal
  const setGraphModalOpen = useUIStore((state) => state.setDialogueGraphModalOpen);
  const setGraphSelectedScene = useUIStore((state) => state.setDialogueGraphSelectedScene);

  // PHASE 4: Cosmos theme effects for node creation celebration
  const isCosmosTheme = useIsCosmosTheme();
  const { celebrateNodeCreation } = useCosmosEffects();

  const handleWizardSave = (dialogues: Dialogue[]) => {
    // Guard: cinematic scenes do not store dialogues in dialoguesStore
    if (!selectedScene || dialogues.length === 0 || isCinematicSelected) return;

    if (editDialogueIndex !== undefined) {
      // Edit mode: update the main dialogue
      updateDialogue(selectedScene.id, editDialogueIndex, dialogues[0]);

      // If there are response dialogues, insert them after the main dialogue
      if (dialogues.length > 1) {
        const responseDialogues = dialogues.slice(1); // Get responses (dialogues[1], dialogues[2], ...)
        insertDialoguesAfter(selectedScene.id, editDialogueIndex, responseDialogues);
      }
    } else {
      // Create mode: determine convergence point for response dialogues
      // If response dialogues exist and we're appending at the end,
      // there's no convergence point yet (scene ends after responses).
      // Convergence will auto-resolve when more dialogues are added.
      if (dialogues.length === 1) {
        addDialogue(selectedScene.id, dialogues[0]);
      } else {
        addDialogues(selectedScene.id, dialogues);
      }

      // PHASE 4: Cosmos celebration effect for new dialogue creation
      if (isCosmosTheme) {
        celebrateNodeCreation();
      }
    }

    setWizardOpen(false);
    setEditDialogueIndex(undefined);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
        {/* ── Compact scene header — replaces "Scènes" tab ──
            Shows the active scene thumbnail + title + clapperboard button → ScenesBrowser.
            ⚠️ min-h-0 obligatoire sur le wrapper flex pour que DialoguesPanel scroll correctement. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderBottom: '1px solid var(--color-border-base)',
            flexShrink: 0,
          }}
        >
          {/* Scene thumbnail 16:9 — données réelles depuis le store (Will Wright §4.1) */}
          <div
            style={{
              width: 44,
              height: 28,
              borderRadius: 4,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {selectedScene?.backgroundUrl ? (
              <img
                src={selectedScene.backgroundUrl}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                }}
              />
            )}
          </div>

          {/* Clapperboard button → open ScenesBrowser (Norman §9.1 — affordance visible) */}
          <motion.button
            onClick={() => setScenesBrowserOpen(true)}
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              flexShrink: 0,
              background: 'rgba(139,92,246,0.12)',
              border: '1.5px solid rgba(139,92,246,0.3)',
              color: 'var(--color-primary)',
              cursor: 'pointer',
            }}
            title="Toutes les scènes — Storyboard"
            aria-label="Ouvrir le navigateur de scènes"
          >
            <Film size={13} />
          </motion.button>
        </div>

        {/* ── Dialogues panel (always visible) ──
            ⚠️ flex-1 min-h-0 : DialoguesPanel gère son propre scroll interne. */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isCinematicSelected ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
              <Film className="w-8 h-8 text-violet-400 opacity-40" aria-hidden="true" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Scène cinématique
              </p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Les dialogues ne sont pas disponibles pour ce type de scène. Utilisez l&apos;Éditeur
                Cinématique pour créer des événements.
              </p>
            </div>
          ) : (
            <DialoguesPanel onDialogueSelect={onDialogueSelect} />
          )}
        </div>

        {/* HUD Compact — nav scènes/dialogues + info row */}
        <LeftPanelJumpBar
          activeTab="dialogues"
          onSceneSelect={onSceneSelect || setSelectedSceneForEdit}
          onDialogueSelect={onDialogueSelect}
        />
      </div>

      {/* DialogueWizard Modal - Outside Tabs to survive unmounts */}
      <Dialog
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) setEditDialogueIndex(undefined);
        }}
      >
        <DialogContent
          className="max-w-[90vw] p-0 gap-0 max-h-[90vh] [&>button.absolute]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {editDialogueIndex !== undefined
                ? "Modifier un dialogue avec l'assistant"
                : 'Créer un nouveau dialogue'}
            </DialogTitle>
          </DialogHeader>
          {selectedScene ? (
            <DialogueComposer
              sceneId={selectedScene.id}
              dialogueIndex={editDialogueIndex}
              dialogue={
                editDialogueIndex !== undefined
                  ? selectedScene.dialogues[editDialogueIndex]
                  : undefined
              }
              onSave={handleWizardSave}
              onClose={() => setWizardOpen(false)}
              onOpenGraph={() => {
                setWizardOpen(false);
                setGraphSelectedScene(selectedScene.id);
                setGraphModalOpen(true);
              }}
            />
          ) : (
            <div className="p-8 text-center">Aucune scène sélectionnée</div>
          )}
        </DialogContent>
      </Dialog>

      {/* DialogueGraph Modal - Full-screen node editor (lazy loaded) */}
      <Suspense fallback={null}>
        <DialogueGraphModal />
      </Suspense>
    </>
  );
}
