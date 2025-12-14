import React from 'react';
import { useApp } from '../AppContext';
import ScenesList from './ScenesList';
import VisualSceneEditor from './VisualSceneEditor';
import UtilitiesPanel from './UtilitiesPanel';

/**
 * MainCanvas - Vue principale de l'éditeur GDevelop-like
 * Architecture 3 colonnes : Scènes | Éditeur Visuel | Utilitaires
 */
export default function MainCanvas() {
  const { scenes } = useApp();
  const [selectedSceneId, setSelectedSceneId] = React.useState(null);

  // Sélectionner la première scène par défaut
  React.useEffect(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Colonne Gauche - Liste des Scènes (250px fixe) */}
      <ScenesList
        scenes={scenes}
        selectedSceneId={selectedSceneId}
        onSelectScene={setSelectedSceneId}
      />

      {/* Colonne Centrale - Éditeur Visuel (flex-1) */}
      <VisualSceneEditor
        scene={selectedScene}
      />

      {/* Colonne Droite - Utilitaires (280px fixe) */}
      <UtilitiesPanel
        scene={selectedScene}
      />
    </div>
  );
}