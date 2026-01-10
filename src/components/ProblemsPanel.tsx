import { useState, useMemo, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { useValidation } from '../hooks/useValidation';
import { useScenesStore, useCharactersStore } from '../stores/index';
import type { Scene, Character } from '@/types';

/**
 * Problem severity type
 */
type ProblemSeverity = 'error' | 'warning';

/**
 * Problem type
 */
type ProblemType = 'scene' | 'dialogue' | 'choice' | 'character' | 'variable';

/**
 * Problem details
 */
interface Problem {
  id: string;
  severity: ProblemSeverity;
  message: string;
  location: string;
  type: ProblemType;
  sceneId?: string;
  dialogueIdx?: number;
  choiceIdx?: number;
  charId?: string;
  varName?: string;
  field: string;
}

/**
 * Navigation target for problems
 */
interface NavigationTarget {
  sceneId?: string;
  dialogueIdx?: number;
  charId?: string;
}

/**
 * Filter type for problems
 */
type FilterType = 'all' | 'errors' | 'warnings';

/**
 * ProblemsPanel component props
 */
export interface ProblemsPanelProps {
  /** Callback for navigating to problem location */
  onNavigateTo?: (target: string, data: NavigationTarget) => void;
}

/**
 * Validation error from useValidation hook
 */
interface ValidationError {
  field: string;
  message: string;
  severity: ProblemSeverity;
}

/**
 * Problems Panel - Inspiré de VS Code Issue Browser
 * Liste centralisée de toutes les erreurs/warnings avec navigation rapide
 *
 * PERFORMANCE: Uses Map selectors for O(1) lookups instead of array.find()
 */
export default function ProblemsPanel({ onNavigateTo }: ProblemsPanelProps): React.JSX.Element {
  const validation = useValidation();

  // OPTIMIZATION: Use Map selectors for O(1) lookups (instead of array.find)
  const sceneMap = useScenesStore(
    useCallback((state) => new Map<string, Scene>(state.scenes.map(s => [s.id, s])), [])
  );

  const characterMap = useCharactersStore(
    useCallback((state) => new Map<string, Character>(state.characters.map(c => [c.id, c])), [])
  );

  const [filter, setFilter] = useState<FilterType>('all');

  // OPTIMIZATION: Memoize problem aggregation (only recomputes when validation changes)
  const allProblems = useMemo(() => {
    const problems: Problem[] = [];

    // Erreurs de scènes - O(1) lookup with Map
    Object.entries(validation.errors.scenes).forEach(([sceneId, errors]) => {
      const scene = sceneMap.get(sceneId);
      (errors as ValidationError[]).forEach(error => {
        problems.push({
          id: `scene-${sceneId}-${error.field}`,
          severity: error.severity,
          message: error.message,
          location: `Scene: ${scene?.title || sceneId}`,
          type: 'scene',
          sceneId,
          field: error.field
        });
      });
    });

    // Dialogue errors - O(1) lookup with Map
    Object.entries(validation.errors.dialogues).forEach(([key, errors]) => {
      const [sceneId, dialogueIdx] = key.split('-');
      const scene = sceneMap.get(sceneId);
      (errors as ValidationError[]).forEach(error => {
        problems.push({
          id: `dialogue-${key}-${error.field}`,
          severity: error.severity,
          message: error.message,
          location: `Scene: ${scene?.title || sceneId} > Dialogue #${parseInt(dialogueIdx) + 1}`,
          type: 'dialogue',
          sceneId,
          dialogueIdx: parseInt(dialogueIdx),
          field: error.field
        });
      });
    });

    // Choice errors - O(1) lookup with Map
    Object.entries(validation.errors.choices).forEach(([key, errors]) => {
      const [sceneId, dialogueIdx, choiceIdx] = key.split('-');
      const scene = sceneMap.get(sceneId);
      (errors as ValidationError[]).forEach(error => {
        problems.push({
          id: `choice-${key}-${error.field}`,
          severity: error.severity,
          message: error.message,
          location: `Scene: ${scene?.title || sceneId} > Dialogue #${parseInt(dialogueIdx) + 1} > Choix #${parseInt(choiceIdx) + 1}`,
          type: 'choice',
          sceneId,
          dialogueIdx: parseInt(dialogueIdx),
          choiceIdx: parseInt(choiceIdx),
          field: error.field
        });
      });
    });

    // Character errors - O(1) lookup with Map
    Object.entries(validation.errors.characters).forEach(([charId, errors]) => {
      const character = characterMap.get(charId);
      (errors as ValidationError[]).forEach(error => {
        problems.push({
          id: `char-${charId}-${error.field}`,
          severity: error.severity,
          message: error.message,
          location: `Personnage: ${character?.name || charId}`,
          type: 'character',
          charId,
          field: error.field
        });
      });
    });

    // Variable errors
    Object.entries(validation.errors.variables).forEach(([varName, errors]) => {
      (errors as ValidationError[]).forEach(error => {
        problems.push({
          id: `var-${varName}-${error.field}`,
          severity: error.severity,
          message: error.message,
          location: `Variable: ${varName}`,
          type: 'variable',
          varName,
          field: error.field
        });
      });
    });

    return problems;
  }, [validation, sceneMap, characterMap]);

  // Filtrer selon le filtre actif
  const filteredProblems = allProblems.filter(p => {
    if (filter === 'errors') return p.severity === 'error';
    if (filter === 'warnings') return p.severity === 'warning';
    return true;
  });

  // Trier : erreurs d'abord, puis warnings
  filteredProblems.sort((a, b) => {
    if (a.severity === 'error' && b.severity !== 'error') return -1;
    if (a.severity !== 'error' && b.severity === 'error') return 1;
    return 0;
  });

  const handleProblemClick = (problem: Problem): void => {
    if (onNavigateTo) {
      if (problem.type === 'scene') {
        onNavigateTo('scenes', { sceneId: problem.sceneId });
      } else if (problem.type === 'dialogue' || problem.type === 'choice') {
        onNavigateTo('dialogues', { sceneId: problem.sceneId, dialogueIdx: problem.dialogueIdx });
      } else if (problem.type === 'character') {
        onNavigateTo('characters', { charId: problem.charId });
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Problems
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
              {validation.totalErrors} error{validation.totalErrors > 1 ? 's' : ''}
            </span>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-semibold">
              {validation.totalWarnings} warning{validation.totalWarnings > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({allProblems.length})
          </button>
          <button
            onClick={() => setFilter('errors')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'errors'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Errors ({validation.totalErrors})
          </button>
          <button
            onClick={() => setFilter('warnings')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'warnings'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Warnings ({validation.totalWarnings})
          </button>
        </div>
      </div>

      {/* Liste des problèmes */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredProblems.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-semibold text-green-700">Aucun problème détecté !</p>
            <p className="text-sm text-slate-600 mt-1">Votre scénario est valide</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredProblems.map((problem) => (
              <button
                key={problem.id}
                onClick={() => handleProblemClick(problem)}
                className="w-full p-3 hover:bg-slate-50 transition-colors text-left flex items-start gap-3 group"
              >
                {/* Icône de sévérité */}
                <div className="mt-0.5">
                  {problem.severity === 'error' ? (
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Détails du problème */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    problem.severity === 'error' ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    {problem.message}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-mono truncate">
                    {problem.location}
                  </p>
                </div>

                {/* Icône de navigation */}
                <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
