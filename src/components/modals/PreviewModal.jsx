import React from 'react';
import PropTypes from 'prop-types';
import PreviewPlayer from '../panels/PreviewPlayer.jsx';
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
 * PreviewModal - Wrapper for PreviewPlayer in modal mode
 * Displays the game preview in a fullscreen modal overlay
 * Now using shadcn/ui Dialog for better accessibility and consistency
 */
export default function PreviewModal({ isOpen, onClose, initialSceneId }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 dark bg-slate-900 border-slate-700"
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
              className="absolute top-4 right-4 z-10 bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-slate-700"
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

PreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialSceneId: PropTypes.string
};
