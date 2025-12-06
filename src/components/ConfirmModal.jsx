import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Modal de confirmation reutilisable
 * @param {boolean} isOpen - Afficher ou masquer la modal
 * @param {function} onConfirm - Callback lors du clic sur Confirmer
 * @param {function} onCancel - Callback lors du clic sur Annuler
 * @param {string} title - Titre de la modal
 * @param {string} message - Message de la modal
 * @param {string} confirmText - Texte du bouton confirmer (defaut: "Confirmer")
 * @param {string} cancelText - Texte du bouton annuler (defaut: "Annuler")
 * @param {string} confirmColor - Couleur du bouton confirmer (defaut: "red")
 */
export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmColor = 'red'
}) {
  // Bloquer scroll du body quand modal ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fermer au clic Echap
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-slate-800 p-6 rounded-xl max-w-md w-full shadow-2xl border border-slate-700 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 ${
              confirmColor === 'red'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
