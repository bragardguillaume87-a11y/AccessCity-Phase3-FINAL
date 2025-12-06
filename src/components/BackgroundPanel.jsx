import React from 'react';
import { useApp } from '../AppContext.jsx';

export default function BackgroundPanel() {
  const { scenes, selectedSceneForEdit, updateScene } = useApp();

  const scene = scenes.find((s) => s.id === selectedSceneForEdit);

  if (!scene) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        Selectionne une scene pour configurer son decor.
      </div>
    );
  }

  function setBackground(url) {
    updateScene(scene.id, { backgroundUrl: url });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-primary">Decor / Lieu</h3>

      <div className="border-2 border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-semibold mb-2">URL du decor (image)</label>
        <input
          type="text"
          className="w-full px-3 py-2 border-2 border-gray-200 rounded focus:border-primary outline-none"
          placeholder="assets/backgrounds/city.jpg ou URL"
          value={scene.backgroundUrl || ''}
          onChange={(e) => setBackground(e.target.value)}
          aria-label="URL du decor"
        />
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">Apercu du decor</p>
        {scene.backgroundUrl ? (
          <img
            src={scene.backgroundUrl}
            alt="Decor"
            className="w-full max-h-64 object-cover rounded"
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
            Aucune image
          </div>
        )}
      </div>
    </div>
  );
}
