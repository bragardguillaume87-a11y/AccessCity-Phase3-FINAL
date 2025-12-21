import React from 'react';
import PropTypes from 'prop-types';
import PreviewPlayer from '../panels/PreviewPlayer.jsx';

/**
 * PreviewModal - Wrapper for PreviewPlayer in modal mode
 * Displays the game preview in a fullscreen modal overlay
 */
export default function PreviewModal({ isOpen, onClose, initialSceneId }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm"
      onClick={(e) => {
        // Close modal if clicking on backdrop (not on content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="w-full h-full max-w-7xl bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
          <PreviewPlayer
            initialSceneId={initialSceneId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

PreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialSceneId: PropTypes.string
};
