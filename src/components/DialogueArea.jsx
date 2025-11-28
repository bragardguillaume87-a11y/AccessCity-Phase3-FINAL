import React from 'react';

// DialogueArea React version (démonstration). Reprend style et logique basique.
export default function DialogueArea({ speaker, text, choices, onSelect }) {
  return (
    <div className="dialogue-area w-full max-w-3xl mx-auto mt-6">
      <div className="rounded-xl border border-blue-700/40 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl backdrop-blur">
        <div className="speaker font-semibold text-blue-400 mb-3 text-lg" aria-label="Interlocuteur">
          {speaker || '???'}
        </div>
        <div className="text text-slate-200 leading-relaxed mb-5" aria-live="polite">
          {text || '...'}
        </div>
        {choices && choices.length > 0 && (
          <div className="choices flex flex-col gap-3" role="group" aria-label="Choix de dialogue">
            {choices.map((c, idx) => (
              <button
                key={idx}
                className="choice-btn bg-slate-700 hover:bg-blue-600 border border-slate-600 hover:border-blue-500 text-slate-100 text-left px-4 py-3 rounded-lg transition transform hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onSelect?.(c)}
              >
                {c.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
