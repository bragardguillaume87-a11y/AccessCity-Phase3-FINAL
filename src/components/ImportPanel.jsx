// src/components/ImportPanel.jsx
import React from 'react';
import { useApp } from '../AppContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function ImportPanel() {
  const { setContextField } = useApp();
  const { showToast } = useToast();

  function onFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const txt = String(reader.result || '');
        const json = JSON.parse(txt);
        
        if (json && typeof json === 'object') {
          let imported = false;
          
          if ('title' in json) {
            setContextField('title', json.title || '');
            imported = true;
          }
          if ('location' in json) {
            setContextField('location', json.location || '');
            imported = true;
          }
          if ('tone' in json) {
            setContextField('tone', json.tone || '');
            imported = true;
          }
          if ('description' in json) {
            setContextField('description', json.description || '');
            imported = true;
          }
          
          if (imported) {
            showToast(`Configuration importee avec succes depuis ${file.name}`, 'success');
          } else {
            showToast('Aucune donnee reconnue dans le fichier', 'warning');
          }
        } else {
          showToast('Fichier JSON invalide', 'error');
        }
      } catch (err) {
        showToast('Erreur de lecture du fichier JSON', 'error');
        console.error('Import error:', err);
      }
    };
    
    reader.onerror = () => {
      showToast('Impossible de lire le fichier', 'error');
    };
    
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Import</h2>
      <p className="text-sm text-slate-600">Importez un fichier core_system.json.</p>
      
      <div>
        <label 
          htmlFor="import-file"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Choisir un fichier JSON
        </label>
        <input 
          id="import-file"
          type="file" 
          accept="application/json,.json"
          onChange={onFileChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
          aria-describedby="import-help"
        />
        <p id="import-help" className="text-xs text-slate-500 mt-2">
          Selectionnez un fichier JSON contenant la configuration du contexte.
        </p>
      </div>
    </div>
  );
}
