
import PreviewPlayer from '../panels/PreviewPlayer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Props for PreviewModal component
 */
export interface PreviewModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Initial scene ID to load in preview (optional) */
  initialSceneId?: string;
}

/**
 * PreviewModal - Wrapper for PreviewPlayer in modal mode
 *
 * Displays the game preview in a fullscreen modal overlay
 * using shadcn/ui Dialog for better accessibility and consistency.
 *
 * @example
 * ```tsx
 * <PreviewModal
 *   isOpen={showPreview}
 *   onClose={() => setShowPreview(false)}
 *   initialSceneId="scene-123"
 * />
 * ```
 */
export default function PreviewModal({ isOpen, onClose, initialSceneId }: PreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 dark bg-background border-border overflow-hidden"
        onEscapeKeyDown={onClose}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Aperçu du projet</DialogTitle>
        </DialogHeader>

        {/*
          absolute inset-0 : contourne le layout `grid` de DialogContent (shadcn default).
          Sans ça, h-full sur l'enfant = hauteur du contenu (auto), pas 95vh.
          Positionné relativement au DialogContent (position: fixed → crée un contexte).
        */}
        <div className="absolute inset-0">
          <PreviewPlayer
            initialSceneId={initialSceneId}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
