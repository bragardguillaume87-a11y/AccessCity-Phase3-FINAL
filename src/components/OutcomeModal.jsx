import React from 'react';

/**
 * OutcomeModal - Affiche l'issue d'un choix avec de (message + illustration + effet moral)
 * @param {boolean} isOpen - Modal visible ou non
 * @param {string} message - Message descriptif de l'issue
 * @param {string} illustration - URL image optionnelle
 * @param {object} moral - {variable: 'Empathie', delta: +10}
 * @param {function} onClose - Callback fermeture
 */
export default function OutcomeModal({ isOpen, message, illustration, moral, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-title"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titre */}
        <h2 id="outcome-title" className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Resultat
        </h2>

        {/* Illustration optionnelle */}
        {illustration && (
          <div className="mb-6 text-center">
            <img 
              src={illustration} 
              alt="Illustration de l'issue" 
              className="max-w-full h-auto rounded-lg shadow-md mx-auto max-h-64 object-contain"
            />
          </div>
        )}

        {/* Message */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-lg text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Effet moral */}
        {moral && moral.variable && moral.delta !== 0 && (
          <div className="mb-6 text-center">
            <div className={`inline-block px-6 py-3 rounded-lg font-medium ${
              moral.delta > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {moral.variable} : {moral.delta > 0 ? '+' : ''}{moral.delta}
            </div>
          </div>
        )}

        {/* Bouton fermeture */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Continuer"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
