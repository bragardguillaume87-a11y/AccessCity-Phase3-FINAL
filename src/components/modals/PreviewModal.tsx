import React from 'react';
import PreviewPlayer from '../panels/PreviewPlayer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
        className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 dark bg-background border-border"
        onEscapeKeyDown={onClose}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Aperçu du projet</DialogTitle>
        </DialogHeader>

        <div className="relative h-full w-full flex items-center justify-center">
          <PreviewPlayer
            initialSceneId={initialSceneId}
            onClose={onClose}
          />

          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/80 hover:bg-card text-foreground border border-border"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
