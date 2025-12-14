import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook pour gerer l'historique Undo/Redo avec Ctrl+Z et Ctrl+Y
 * @param {*} initialState - Etat initial
 * @param {number} maxHistory - Nombre maximum d'etats dans l'historique (default: 50)
 */
export function useUndoRedo(initialState, maxHistory = 50) {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Etat actuel
  const currentState = history[currentIndex];

  // Ajouter un nouvel etat a l'historique
  const pushState = useCallback((newState) => {
    // Ne pas ajouter si c'est une action undo/redo
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setHistory((prev) => {
      // Supprimer tous les etats apres l'index actuel
      const newHistory = prev.slice(0, currentIndex + 1);
      // Ajouter le nouvel etat
      newHistory.push(newState);
      // Limiter la taille de l'historique
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });

    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= maxHistory ? maxHistory - 1 : newIndex;
    });
  }, [currentIndex, maxHistory]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoAction.current = true;
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, history.length]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z (ou Cmd+Z sur Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y ou Ctrl+Shift+Z (ou Cmd+Y / Cmd+Shift+Z sur Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: currentState,
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex
  };
}
