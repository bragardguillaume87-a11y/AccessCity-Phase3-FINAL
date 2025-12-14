import React from 'react';
import { useApp } from '../AppContext';
import ScenesList from './ScenesList';
import VisualSceneEditor from './VisualSceneEditor';
import UtilitiesPanel from './UtilitiesPanel';

export default function MainCanvas() {
  const { scenes } = useApp();
  const [selectedSceneId, setSelectedSceneId] = React.useState(null);

  React.useEffect(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Colonne Gauche - Liste des Scènes */}
      <ScenesList
        scenes={scenes}
        selectedSceneId={selectedSceneId}
        onSelectScene={setSelectedSceneId}
      />

      {/* Colonne Centrale - Éditeur Visuel */}
      <VisualSceneEditor
        currentScene={selectedScene}
      />

      {/* Colonne Droite - Utilitaires */}
      <UtilitiesPanel
        onSave={() => {
          // TODO: brancher ici ta vraie fonction de sauvegarde (ex: saveProject())
          console.log('Save from UtilitiesPanel');
        }}
      />
    </div>
  );
}
