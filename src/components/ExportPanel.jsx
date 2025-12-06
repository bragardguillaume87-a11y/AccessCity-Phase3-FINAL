import React from 'react';
import { useApp } from '../AppContext.jsx';

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
  const { scenes, characters } = useApp();

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-primary">Export</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadJson('scenes.json', scenes)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          scenes.json
        </button>
        <button
          onClick={() => downloadJson('characters.json', characters)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          characters.json
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Les fichiers sont generes a partir de l etat courant du contexte.
      </p>
    </div>
  );
}
