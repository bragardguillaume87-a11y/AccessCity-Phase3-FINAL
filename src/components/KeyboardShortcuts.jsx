import { useEffect } from 'react';
import { useScenesStore, useCharactersStore } from '../stores/index.js';

/**
 * Composant pour gérer les raccourcis clavier globaux
 * Inspiré de VS Code, Inky, et autres éditeurs modernes
 */
export default function KeyboardShortcuts({ onOpenCommandPalette, onOpenModal, activeTab, setActiveTab }) {
  const addScene = useScenesStore(state => state.addScene);
  const addCharacter = useCharactersStore(state => state.addCharacter);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ignorer si dans un input/textarea (sauf pour certains raccourcis)
      const isInInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

      // Command Palette : Ctrl+Shift+P (universel)
      if (modifier && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (onOpenCommandPalette) onOpenCommandPalette();
        return;
      }

      // Quick Open : Ctrl+P (universel)
      if (modifier && !e.shiftKey && e.key === 'p') {
        e.preventDefault();
        if (onOpenCommandPalette) onOpenCommandPalette('quick-open');
        return;
      }

      // Si dans un input, autoriser seulement certains raccourcis
      if (isInInput) {
        // Ctrl+Z et Ctrl+Y sont déjà gérés par useUndoRedo
        // On laisse passer Ctrl+S pour sauvegarder
        if (modifier && e.key === 's') {
          e.preventDefault();
          // Auto-save est déjà actif
          return;
        }
        return; // Bloquer les autres raccourcis dans les inputs
      }

      // Navigation entre tabs : Ctrl+1-7
      if (modifier && !e.shiftKey && ['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['context', 'characters', 'assets', 'scenes', 'dialogues', 'preview', 'export'];
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex]);
        }
        return;
      }

      // Nouvelle scène : Ctrl+N
      if (modifier && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        addScene();
        setActiveTab('scenes'); // Aller automatiquement à l'onglet scenes
        return;
      }

      // Nouveau personnage : Ctrl+Shift+N
      if (modifier && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        addCharacter();
        setActiveTab('characters'); // Aller automatiquement à l'onglet characters
        return;
      }

      // Export : Ctrl+E
      if (modifier && e.key === 'e') {
        e.preventDefault();
        setActiveTab('export');
        return;
      }

      // Preview : Ctrl+Shift+V
      if (modifier && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        setActiveTab('preview');
        return;
      }

      // Help : F1 ou Ctrl+?
      if (e.key === 'F1' || (modifier && e.key === '?')) {
        e.preventDefault();
        if (onOpenCommandPalette) onOpenCommandPalette('help');
        return;
      }

      // EditorShell modals (only if onOpenModal is provided)
      if (onOpenModal) {
        // Settings Modal : Ctrl+,
        if (modifier && !e.shiftKey && e.key === ',') {
          e.preventDefault();
          onOpenModal('project');
          return;
        }

        // Characters Modal : Ctrl+Shift+C
        if (modifier && e.shiftKey && e.key === 'C') {
          e.preventDefault();
          onOpenModal('characters');
          return;
        }

        // Assets Modal : Ctrl+Shift+A
        if (modifier && e.shiftKey && e.key === 'A') {
          e.preventDefault();
          onOpenModal('assets');
          return;
        }

        // Preview Modal : Ctrl+Shift+P (different from Command Palette Ctrl+Shift+P)
        // Using Ctrl+R for Preview (R for Run/Review)
        if (modifier && !e.shiftKey && e.key === 'r') {
          e.preventDefault();
          onOpenModal('preview');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addScene, addCharacter, onOpenCommandPalette, onOpenModal, activeTab, setActiveTab]);

  return null; // Composant invisible
}

/**
 * Liste des raccourcis disponibles (pour affichage dans l'aide)
 */
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', '1-7'], description: 'Aller à l\'onglet 1-7', mac: ['⌘', '1-7'] },
      { keys: ['Ctrl', 'P'], description: 'Quick Open (scènes)', mac: ['⌘', 'P'] },
      { keys: ['Ctrl', 'Shift', 'P'], description: 'Command Palette', mac: ['⌘', '⇧', 'P'] },
    ]
  },
  {
    category: 'Édition',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Annuler', mac: ['⌘', 'Z'] },
      { keys: ['Ctrl', 'Y'], description: 'Refaire', mac: ['⌘', 'Y'] },
      { keys: ['Ctrl', 'N'], description: 'Nouvelle scène', mac: ['⌘', 'N'] },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'Nouveau personnage', mac: ['⌘', '⇧', 'N'] },
      { keys: ['Ctrl', 'S'], description: 'Sauvegarder (auto)', mac: ['⌘', 'S'] },
    ]
  },
  {
    category: 'Vue',
    shortcuts: [
      { keys: ['Ctrl', ','], description: 'Ouvrir Settings', mac: ['⌘', ','] },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Ouvrir Preview', mac: ['⌘', '⇧', 'V'] },
      { keys: ['Ctrl', 'E'], description: 'Ouvrir Export', mac: ['⌘', 'E'] },
    ]
  },
  {
    category: 'Manipulation de personnages',
    shortcuts: [
      { keys: ['Delete'], description: 'Supprimer personnage sélectionné', mac: ['Delete'] },
      { keys: ['↑', '↓', '←', '→'], description: 'Déplacer personnage (0.5%)', mac: ['↑', '↓', '←', '→'] },
      { keys: ['Shift', '+', '↑', '↓', '←', '→'], description: 'Déplacer personnage (1%)', mac: ['⇧', '+', '↑', '↓', '←', '→'] },
    ]
  },
  {
    category: 'Aide',
    shortcuts: [
      { keys: ['F1'], description: 'Afficher l\'aide', mac: ['F1'] },
      { keys: ['Ctrl', '?'], description: 'Raccourcis clavier', mac: ['⌘', '?'] },
    ]
  }
];
