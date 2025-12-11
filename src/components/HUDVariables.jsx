// src/components/HUDVariables.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function HUDVariables({ variables }) {
  const [shown, setShown] = useState(true);
  const liveRef = useRef(null);
  const prevRef = useRef(variables);

  // Annonce accessible des changements non critiques (aria-live polite).
  useEffect(() => {
    const prev = prevRef.current || {};
    const diffs = [];
    Object.keys(variables || {}).forEach((k) => {
      const before = typeof prev[k] === 'number' ? prev[k] : undefined;
      const after = typeof variables[k] === 'number' ? variables[k] : undefined;
      if (before !== undefined && after !== undefined && before !== after) {
        const sign = after > before ? '+' : '';
        diffs.push(`${k} ${sign}${after - before}`);
      }
    });
    if (diffs.length && liveRef.current) {
      liveRef.current.textContent = `Mise a jour: ${diffs.join(', ')}`;
      // Efface le texte apres un court delai pour eviter la pollution.
      window.setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = '';
      }, 1500);
    }
    prevRef.current = variables;
  }, [variables]);

  const entries = useMemo(() => Object.entries(variables || {}), [variables]);

  return (
    <div>
      {/* Region live pour annonces non critiques */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div className="mb-2 bg-white rounded-lg shadow p-2 inline-flex items-center gap-2">
        <label className="text-xs text-gray-700">Afficher le HUD</label>
        <input
          type="checkbox"
          checked={shown}
          onChange={(e) => setShown(e.target.checked)}
          aria-label="Afficher le HUD des variables"
        />
      </div>
      {shown && (
        <div className="bg-white rounded-lg shadow-lg p-3 w-64">
          <h3 className="font-bold text-sm mb-3 text-primary flex items-center gap-2">
            <span>Etat du joueur</span>
          </h3>
          <div className="space-y-3">
            {entries.map(([key, value]) => {
              const icon = key === 'Physique' ? '💪' : key === 'Mentale' ? '🧠' : '📊';
              const color =
                value > 66 ? 'from-green-500 to-green-600' :
                value > 33 ? 'from-yellow-500 to-yellow-600' :
                'from-red-500 to-red-600';
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{key}</span>
                      <span className="text-xs font-bold text-gray-900">{value}/100</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500 shadow-sm`}
                        style={{ width: `${value}%` }}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={value}
                        aria-label={key}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
