/**
 * main-player.tsx — Entry point du player standalone.
 *
 * Ce fichier est le bootstrap minimal pour le mode player.
 * Il n'inclut PAS l'éditeur, les stores Zustand, ni les modales.
 * Les données de jeu sont lues depuis window.__GAME_DATA__ (injecté par l'export).
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerApp } from './PlayerApp';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <PlayerApp />
    </StrictMode>
  );
}
