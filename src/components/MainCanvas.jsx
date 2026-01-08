import React from 'react';
import { useScenesStore, useUIStore } from '../stores/index.ts';
import ScenesList from './ScenesList';
import VisualSceneEditor from './VisualSceneEditor';
import PropertiesPanel from './PropertiesPanel';
import SkipToContent from './SkipToContent';

/**
 * MainCanvas - Conteneur principal 3 colonnes pour l'éditeur de scénarios
 * 
 * Architecture:
 * ┌────────────────────┬──────────────────────┬──────────────────────┐
 * │                    │                      │                      │
 * │  ScenesList        │ VisualSceneEditor    │ PropertiesPanel      │
 * │  (Gauche)          │ (Centre)             │ (Droite)             │
 * │  - CRUD scènes     │ - Aperçu visuel      │ - Propriétés          │
 * │  - Navigation      │ - Canvas D&D         │ - Bibliothèque        │
 * │                    │                      │ - Styles              │
 * └────────────────────┴──────────────────────┴──────────────────────┘
 * 
 * Phase 1: Structure stable, accessibilité, navigation clavier ✓
 * Phase 2: Édition complète - EN COURS
 * Phase 3: Drag & drop, zoom, amélioration UX
 */
export default function MainCanvas() {
  // Zustand stores (granular selectors)
  const scenes = useScenesStore(state => state.scenes);
  const updateScene = useScenesStore(state => state.updateScene);
  const selectedSceneId = useUIStore(state => state.selectedSceneId);
  const setSelectedSceneId = useUIStore(state => state.setSelectedSceneId);
  
  // Gestion de la sélection d'élément dans le canvas (personnage, décor, etc.)
  const [selectedElement, setSelectedElement] = React.useState(null);

  // Trouver la scène actuellement sélectionnée
  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  // Handler pour la sélection de scène
  const handleSceneSelect = (sceneId) => {
    setSelectedSceneId(sceneId);
    setSelectedElement(null); // Réinitialiser la sélection d'élément
  };

  // Handler pour la mise à jour de scène (utilisé par PropertiesPanel)
  const handleUpdateScene = (patch) => {
    if (!selectedSceneId) return;
    updateScene(selectedSceneId, patch);
  };

  return (
    <>
      {/* Skip to Content link (a11y) */}
      <SkipToContent target="mainCanvasContent" />

      {/* Conteneur principal 3 colonnes */}
      <div 
        className="flex h-screen w-screen bg-slate-900 overflow-hidden"
        role="main"
        aria-label="Éditeur de scénarios AccessCity - 3 colonnes"
      >
        {/* COLONNE GAUCHE - Liste des scènes */}
        <aside 
          className="flex-shrink-0 w-64 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden"
          role="region"
          aria-label="Colonne gauche - Liste des scènes"
          aria-describedby="scenesListHelp"
        >
          <ScenesList
            scenes={scenes}
            selectedSceneId={selectedSceneId}
            onSelectScene={handleSceneSelect}
          />
          <div id="scenesListHelp" className="sr-only">
            Liste des scènes avec support de sélection clavier.
          </div>
        </aside>

        {/* COLONNE CENTRALE - Canvas d'édition visuelle */}
        <main 
          id="mainCanvasContent"
          className="flex-1 flex flex-col bg-slate-900 overflow-hidden"
          role="region"
          aria-label="Colonne centrale - Éditeur visuel de scène"
          aria-describedby="canvasHelp"
        >
          {/* TODO Phase 3: Header avec titre de la scène et contrôles de zoom/vue */}
          <div className="flex-1 overflow-hidden">
            <VisualSceneEditor
              currentScene={selectedScene}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
            />
          </div>
          <div id="canvasHelp" className="sr-only">
            Zone d'édition visuelle de la scène sélectionnée. Utilisez Tab pour naviguer.
          </div>
        </main>

        {/* COLONNE DROITE - Panneau de propriétés et utilitaires */}
        <aside 
          className="flex-shrink-0 w-80 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden"
          role="region"
          aria-label="Colonne droite - Propriétés et utilitaires"
          aria-describedby="propertiesPanelHelp"
        >
          <PropertiesPanel
            scene={selectedScene}
            selectedElement={selectedElement}
            onUpdateScene={handleUpdateScene}
          />
          <div id="propertiesPanelHelp" className="sr-only">
            Panneau de propriétés pour la scène ou l'objet sélectionné.
          </div>
        </aside>
      </div>
    </>
  );
}