// src/components/ExportPanel.jsx
import React from 'react';
import { useApp } from '../AppContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportPanel() {
  const { scenes, characters, context } = useApp();
  const { showToast } = useToast();

  function handleExport(type, data, filename) {
    try {
      downloadJson(filename, data);
      showToast(`Fichier ${filename} exporte avec succes`, 'success');
    } catch (error) {
      showToast(`Echec de l export de ${filename}`, 'error');
      console.error('Export error:', error);
    }
  }

  function exportCore() {
    const core = {
      title: context.title || '',
      location: context.location || '',
      tone: context.tone || '',
      description: context.description || ''
    };
    handleExport('core', core, 'core_system.json');
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Export</h2>
      <p className="text-sm text-slate-600">Exportez vos donnees en fichiers JSON.</p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport('scenes', scenes, 'scenes.json')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          aria-label="Exporter les scenes"
        >
          scenes.json
        </button>
        <button
          onClick={() => handleExport('characters', characters, 'characters.json')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          aria-label="Exporter les personnages"
        >
          characters.json
        </button>
        <button
          onClick={exportCore}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          aria-label="Exporter le contexte"
        >
          core_system.json
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Les fichiers sont generes a partir de l etat courant du contexte.
      </p>
    </div>
  );
}
