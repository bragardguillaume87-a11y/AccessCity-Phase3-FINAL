/**
 * PlayerApp — Application standalone du player AccessCity.
 *
 * Lit window.__GAME_DATA__ (injecté lors de l'export ZIP),
 * convertit les données en props et monte le PreviewPlayer.
 *
 * Ce composant n'utilise PAS les stores Zustand de l'éditeur.
 * Toutes les données proviennent de l'export JSON.
 */

import type { ExportData } from '@/utils/exportProject';
import { buildInitialVariables } from '@/utils/exportProject';
import PreviewPlayer from '@/components/panels/PreviewPlayer';

declare global {
  interface Window {
    __GAME_DATA__: ExportData;
  }
}

export function PlayerApp() {
  const data = window.__GAME_DATA__;

  if (!data) {
    return (
      <div style={{ padding: '2rem', color: 'white', background: '#0a0a14', height: '100vh' }}>
        <h1>Erreur : données de jeu manquantes</h1>
        <p>Le fichier index.html doit être accompagné de window.__GAME_DATA__.</p>
      </div>
    );
  }

  const initialVariables = buildInitialVariables(data.settings.variables ?? {});

  return (
    <PreviewPlayer
      standaloneScenes={data.scenes}
      standaloneCharacters={data.characters}
      standaloneInitialVariables={initialVariables}
      initialSceneId={data.scenes[0]?.id ?? null}
      onClose={() => {
        // En mode standalone, "Fermer" recharge simplement la page
        window.location.reload();
      }}
    />
  );
}
