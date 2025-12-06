// src/components/ImportPanel.jsx
import React, { useState } from 'react';
import { useApp } from '../AppContext.jsx';

export default function ImportPanel() {
  const { setContextField } = useApp();
  const [status, setStatus] = useState('');

  function onFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const txt = String(reader.result || '');
        const json = JSON.parse(txt);
        if (json && typeof json === 'object') {
          if ('title' in json) setContextField('title', json.title || '');
          if ('location' in json) setContextField('location', json.location || '');
          if ('tone' in json) setContextField('tone', json.tone || '');
          if ('description' in json) setContextField('description', json.description || '');
          setStatus('Import core_system.json reussi.');
        } else {
          setStatus('Fichier JSON invalide.');
        }
      } catch (err) {
        setStatus('Erreur de parsing JSON.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-primary">Import</h3>
      <input type="file" accept="application/json" onChange={onFileChange} />
      {status && <p className="text-xs text-gray-600">{status}</p>}
    </div>
  );
}
