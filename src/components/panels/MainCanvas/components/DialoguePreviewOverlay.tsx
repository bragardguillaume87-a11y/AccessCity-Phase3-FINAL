import { useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useDialogueBoxConfig } from '@/hooks/useDialogueBoxConfig';
import { useSpeakerLayout } from '@/hooks/useSpeakerLayout';
import { Z_INDEX } from '@/utils/zIndexLayers';
import { DialogueBox } from '@/components/ui/DialogueBox';
import { useCharactersStore } from '@/stores';
import { useUIStore } from '@/stores/uiStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { REFERENCE_CANVAS_WIDTH } from '@/config/canvas';
import type { Dialogue } from '@/types';

export interface DialoguePreviewOverlayProps {
  dialogue: Dialogue | null;
  dialogueIndex: number;
  totalDialogues: number;
  speakerName: string;
  currentDialogueText: string;
  onNavigate: (direction: 'prev' | 'next') => void;
  /** When true, advance automatically after typewriter completes */
  isAutoPlaying?: boolean;
  /** Called when auto-play reaches the end or a choice */
  onAutoPlayComplete?: () => void;
  /**
   * Largeur actuelle du canvas en pixels.
   * Utilisée pour calculer le scaleFactor de la typographie.
   * Défaut : REFERENCE_CANVAS_WIDTH (960px → scaleFactor = 1).
   */
  canvasWidth?: number;
}

/**
 * DialoguePreviewOverlay — Preview de dialogue inline dans l'éditeur.
 *
 * Utilise le composant partagé <DialogueBox> pour le rendu visuel,
 * identique au PreviewPlayer. Les boutons prev/next sont passés via
 * le slot `navigationSlot` de la DialogueBox.
 */
export function DialoguePreviewOverlay({
  dialogue,
  dialogueIndex,
  totalDialogues,
  speakerName,
  currentDialogueText,
  onNavigate,
  isAutoPlaying = false,
  onAutoPlayComplete,
  canvasWidth,
}: DialoguePreviewOverlayProps) {
  // Facteur d'échelle : typographie proportionnelle au canvas de l'éditeur
  const scaleFactor = (canvasWidth && canvasWidth > 0)
    ? canvasWidth / REFERENCE_CANVAS_WIDTH
    : 1;
  // ── Store reads ──────────────────────────────────────────────────────────────
  const characterLibrary = useCharactersStore(s => s.characters);
  const sceneId = useUIStore(s => s.selectedSceneForEdit);
  const getCharactersForScene = useSceneElementsStore(s => s.getCharactersForScene);

  const sceneCharacters = useMemo(
    () => (sceneId ? getCharactersForScene(sceneId) : []),
    [sceneId, getCharactersForScene],
  );

  // ── Config (hook partagé avec PreviewPlayer) ──────────────────────────────
  const dialogueBoxConfig = useDialogueBoxConfig(dialogue?.boxStyle);

  // ── Speaker layout (hook partagé avec PreviewPlayer) ─────────────────────
  const { speakerDisplayName, speakerIsOnRight, speakerPortraitUrl, speakerColor } = useSpeakerLayout({
    speakerNameOrId: speakerName,
    sceneCharacters,
    characterLibrary,
    config: dialogueBoxConfig,
  });

  // ── Typewriter ────────────────────────────────────────────────────────────────
  const { displayText, isComplete, skip } = useTypewriter(currentDialogueText, {
    speed: dialogueBoxConfig.typewriterSpeed,
    cursor: true,
    contextAware: true,
  });

  // ── Auto-advance pendant la lecture ────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoPlaying || !isComplete) return;

    // S'arrête aux choix (l'utilisateur doit choisir la branche)
    if (dialogue?.choices && dialogue.choices.length > 0) {
      onAutoPlayComplete?.();
      return;
    }

    // S'arrête au dernier dialogue
    if (dialogueIndex >= totalDialogues - 1) {
      onAutoPlayComplete?.();
      return;
    }

    const timer = setTimeout(() => onNavigate('next'), 1200);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, isComplete, dialogue, dialogueIndex, totalDialogues, onNavigate, onAutoPlayComplete]);

  if (!dialogue) return null;

  const hasChoices = !!(dialogue.choices && dialogue.choices.length > 0);

  // ── Navigation slot (éditeur uniquement) ────────────────────────────────────
  const navigationSlot = (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
        disabled={dialogueIndex === 0}
        className="h-5 w-5 p-0 disabled:opacity-30 text-white/60 hover:text-white hover:bg-white/10"
        aria-label="Dialogue précédent"
      >
        <ChevronLeft className="w-3 h-3" aria-hidden="true" />
      </Button>
      <span className="text-[9px] text-white/40 font-mono px-0.5">
        {dialogueIndex + 1}/{totalDialogues}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
        disabled={dialogueIndex >= totalDialogues - 1}
        className="h-5 w-5 p-0 disabled:opacity-30 text-white/60 hover:text-white hover:bg-white/10"
        aria-label="Dialogue suivant"
      >
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
      </Button>
    </div>
  );

  const position = dialogueBoxConfig.position;

  return (
    <div
      className={`absolute pointer-events-none ${
        position === 'top'    ? 'top-0 left-0 right-0' :
        position === 'center' ? 'inset-0 flex items-center' :
        'bottom-0 left-0 right-0'
      }`}
      style={{ zIndex: Z_INDEX.CANVAS_DIALOGUE_OVERLAY }}
    >
      {/* Gradient adaptatif — masque le décor selon la position */}
      {position !== 'center' && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            ...(position === 'top'
              ? { top: 0, height: '50%', background: 'linear-gradient(to bottom, rgba(3,7,18,0.80) 0%, rgba(3,7,18,0.35) 50%, transparent 100%)' }
              : { bottom: 0, height: '55%', background: 'linear-gradient(to top, rgba(3,7,18,0.80) 0%, rgba(3,7,18,0.35) 50%, transparent 100%)' }
            ),
          }}
          aria-hidden="true"
        />
      )}

      {/* Boîte de dialogue partagée — 76% de la largeur du canvas (identique à PreviewPlayer) */}
      <div className={`relative px-4 max-w-[76%] mx-auto w-full pointer-events-auto ${
        position === 'top' ? 'pt-3' : position === 'center' ? 'py-2' : 'pb-3'
      }`}>
        <DialogueBox
          speaker={speakerDisplayName || undefined}
          displayText={displayText}
          choices={hasChoices ? dialogue.choices : undefined}
          isTypewriterDone={isComplete}
          hasChoices={hasChoices}
          config={dialogueBoxConfig}
          scaleFactor={scaleFactor}
          speakerPortraitUrl={speakerPortraitUrl}
          speakerIsOnRight={speakerIsOnRight}
          speakerColor={speakerColor}
          onAdvance={skip}
          navigationSlot={navigationSlot}
        />
      </div>
    </div>
  );
}
