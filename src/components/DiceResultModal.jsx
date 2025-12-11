import React from 'react';

/**
 * DiceResultModal - Affiche le resultat du lancer de de
 * @param {boolean} isOpen - Modal visible ou non
 * @param {number} roll - Resultat du de (1-20)
 * @param {number} difficulty - Seuil de difficulte
 * @param {boolean} success - Reussite ou echec
 * @param {function} onClose - Callback fermeture
 */
export default function DiceResultModal({ isOpen, roll, difficulty, success, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dice-result-title"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji de */}
        <div className="text-center mb-6">
          <div className="text-8xl mb-4" role="img" aria-label="De">
            🎲
          </div>
          <h2 id="dice-result-title" className="text-3xl font-bold text-gray-800">
            Lancer de de
          </h2>
        </div>

        {/* Resultat */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-purple-600 mb-2">
            {roll}
          </div>
          <div className="text-gray-600">
            Difficulte : {difficulty}
          </div>
        </div>

        {/* Badge succes/echec */}
        <div className="text-center mb-6">
          {success ? (
            <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full font-bold text-xl">
              ✓ Reussite !
            </div>
          ) : (
            <div className="inline-block bg-red-100 text-red-800 px-6 py-3 rounded-full font-bold text-xl">
              ✗ Echec
            </div>
          )}
        </div>

        {/* Bouton fermeture */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Continuer"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
