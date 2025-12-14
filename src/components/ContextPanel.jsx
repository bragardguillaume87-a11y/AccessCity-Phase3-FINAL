import React from 'react';
import { useApp } from '../AppContext.jsx';

export default function ContextPanel({ onNext }) {
  const { context, setContextField } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          📝 Etape 1 : Contexte
        </h2>
        <p className="text-slate-600">
          Definissez le cadre general de votre scenario
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        {/* Titre */}
        <div>
          <label htmlFor="context-title" className="block text-sm font-semibold text-slate-700 mb-2">
            Titre du scenario *
          </label>
          <input
            id="context-title"
            type="text"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            placeholder="Ex: Aventure a la mairie"
            value={context?.title || ''}
            onChange={(e) => setContextField('title', e.target.value)}
          />
        </div>

        {/* Lieu principal */}
        <div>
          <label htmlFor="context-location" className="block text-sm font-semibold text-slate-700 mb-2">
            Lieu principal *
          </label>
          <input
            id="context-location"
            type="text"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            placeholder="Ex: Mairie, Centre-ville"
            value={context?.location || ''}
            onChange={(e) => setContextField('location', e.target.value)}
          />
        </div>

        {/* Ton */}
        <div>
          <label htmlFor="context-tone" className="block text-sm font-semibold text-slate-700 mb-2">
            Ton du scenario
          </label>
          <select
            id="context-tone"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white transition-all"
            value={context?.tone || 'realiste'}
            onChange={(e) => setContextField('tone', e.target.value)}
          >
            <option value="realiste">Realiste</option>
            <option value="educatif">Educatif</option>
            <option value="dramatique">Dramatique</option>
            <option value="humoristique">Humoristique</option>
          </select>
        </div>

        {/* Objectif pédagogique */}
        <div>
          <label htmlFor="context-objective" className="block text-sm font-semibold text-slate-700 mb-2">
            Objectif pedagogique (optionnel)
          </label>
          <select
            id="context-objective"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white transition-all"
            value={context?.objective || ''}
            onChange={(e) => setContextField('objective', e.target.value)}
          >
            <option value="">Aucun objectif specifique</option>
            <option value="accessibility">Sensibiliser a une situation de handicap</option>
            <option value="inclusion">Promouvoir l'inclusion</option>
            <option value="empathy">Developper l'empathie</option>
            <option value="awareness">Sensibiliser aux enjeux urbains</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="context-description" className="block text-sm font-semibold text-slate-700 mb-2">
            Description du scenario
          </label>
          <textarea
            id="context-description"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all"
            rows={5}
            placeholder="Decrivez brievement votre scenario, l'objectif, le public cible..."
            value={context?.description || ''}
            onChange={(e) => setContextField('description', e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">
            Cette description vous aidera a garder une vision claire du projet
          </p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Conseil</p>
              <p>Ces informations de contexte vous aideront a maintenir une coherence tout au long de la creation de votre scenario.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton suivant */}
      {onNext && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Suivant : Personnages →
          </button>
        </div>
      )}
    </div>
  );
}
