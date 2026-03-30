/**
 * useGameState Tests
 *
 * Couvre le moteur de jeu complet :
 * - Navigation linéaire (goToNextDialogue)
 * - Navigation par lien explicite (nextDialogueId)
 * - Changement de scène (goToScene)
 * - Choix simples + effets sur stats
 * - Jet de dés + confirmDiceNavigation (incluant le fix "" → undefined)
 * - Conditions (dialogue skipping)
 * - isAtLastDialogue
 * - Historique + time-travel
 *
 * Note: useGameState est pur React (pas de Zustand) → aucun mock nécessaire.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../useGameState';
import type { Scene, Dialogue, DialogueChoice } from '@/types';

// ============================================================================
// FACTORIES
// ============================================================================

const makeDialogue = (overrides: Partial<Dialogue> = {}): Dialogue => ({
  id: 'd1',
  speaker: 'narrator',
  text: 'Texte de test',
  choices: [],
  ...overrides,
});

const makeScene = (overrides: Partial<Scene> = {}): Scene => ({
  id: 'scene1',
  title: 'Scène test',
  description: '',
  backgroundUrl: '',
  dialogues: [makeDialogue()],
  characters: [],
  ...overrides,
});

const makeChoice = (overrides: Partial<DialogueChoice> = {}): DialogueChoice => ({
  id: 'c1',
  text: 'Un choix',
  effects: [],
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe('useGameState', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Initialisation
  // --------------------------------------------------------------------------
  describe('initialisation', () => {
    it('démarre au premier dialogue de la scène initiale', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', text: 'Premier' }),
          makeDialogue({ id: 'd2', text: 'Deuxième' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      expect(result.current.currentDialogue?.id).toBe('d1');
    });

    it('démarre au dialogue spécifié par initialDialogueId', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1' }),
          makeDialogue({ id: 'd2' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialDialogueId: 'd2' })
      );
      expect(result.current.currentDialogue?.id).toBe('d2');
    });

    it('retourne null pour un initialDialogueId inconnu', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ id: 'd1' })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialDialogueId: 'inexistant' })
      );
      expect(result.current.currentDialogue).toBeNull();
    });

    it('applique les initialStats', () => {
      const scene = makeScene();
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialStats: { physique: 75 } })
      );
      expect(result.current.stats.physique).toBe(75);
    });

    it('démarre avec diceState vide', () => {
      const { result } = renderHook(() =>
        useGameState({ scenes: [makeScene()], initialSceneId: 'scene1' })
      );
      expect(result.current.diceState.lastRoll).toBeNull();
      expect(result.current.diceState.lastResult).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // goToNextDialogue
  // --------------------------------------------------------------------------
  describe('goToNextDialogue()', () => {
    it('avance au dialogue suivant', () => {
      const scene = makeScene({
        dialogues: [makeDialogue({ id: 'd1' }), makeDialogue({ id: 'd2' })],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => { result.current.goToNextDialogue(); });
      expect(result.current.currentDialogue?.id).toBe('d2');
    });

    it('ne plante pas au dernier dialogue (no-op)', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ id: 'd1' })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => { result.current.goToNextDialogue(); });
      expect(result.current.currentDialogue?.id).toBe('d1');
    });

    it('suit le nextDialogueId explicite (lien non-linéaire)', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', nextDialogueId: 'd3' }),
          makeDialogue({ id: 'd2' }),
          makeDialogue({ id: 'd3' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => { result.current.goToNextDialogue(); });
      expect(result.current.currentDialogue?.id).toBe('d3');
    });

    it('saute les réponses (isResponse) pour trouver le point de convergence', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd-resp-a', isResponse: true }),
          makeDialogue({ id: 'd-resp-b', isResponse: true }),
          makeDialogue({ id: 'd-convergence' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialDialogueId: 'd-resp-a' })
      );
      act(() => { result.current.goToNextDialogue(); });
      expect(result.current.currentDialogue?.id).toBe('d-convergence');
    });

    it('saute les dialogues dont les conditions ne sont pas remplies', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1' }),
          makeDialogue({
            id: 'd2',
            conditions: [{ variable: 'physique', operator: '>=', value: 50 }],
          }),
          makeDialogue({ id: 'd3' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialStats: { physique: 10 } })
      );
      act(() => { result.current.goToNextDialogue(); });
      // d2 ignoré (physique 10 < 50), avance à d3
      expect(result.current.currentDialogue?.id).toBe('d3');
    });
  });

  // --------------------------------------------------------------------------
  // isAtLastDialogue
  // --------------------------------------------------------------------------
  describe('isAtLastDialogue', () => {
    it('est true quand on est sur le seul dialogue sans choix', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ id: 'd1' })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      expect(result.current.isAtLastDialogue).toBe(true);
    });

    it('est false quand le dialogue a des choix', () => {
      const scene = makeScene({
        dialogues: [makeDialogue({ id: 'd1', choices: [makeChoice()] })],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      expect(result.current.isAtLastDialogue).toBe(false);
    });

    it('est false quand le dialogue a un nextDialogueId', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', nextDialogueId: 'd2' }),
          makeDialogue({ id: 'd2' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      expect(result.current.isAtLastDialogue).toBe(false);
    });

    it('est false quand ce n\'est pas le dernier dans le tableau', () => {
      const scene = makeScene({
        dialogues: [makeDialogue({ id: 'd1' }), makeDialogue({ id: 'd2' })],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      expect(result.current.isAtLastDialogue).toBe(false);
    });

    it('est false pour un dialogue isResponse', () => {
      const scene = makeScene({
        dialogues: [makeDialogue({ id: 'd1', isResponse: true })],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      expect(result.current.isAtLastDialogue).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // goToScene
  // --------------------------------------------------------------------------
  describe('goToScene()', () => {
    it('change de scène et démarre au premier dialogue', () => {
      const scene1 = makeScene({ id: 'scene1' });
      const scene2 = makeScene({
        id: 'scene2',
        dialogues: [makeDialogue({ id: 'd-s2' })],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene1, scene2], initialSceneId: 'scene1' })
      );
      act(() => { result.current.goToScene('scene2'); });
      expect(result.current.currentScene?.id).toBe('scene2');
      expect(result.current.currentDialogue?.id).toBe('d-s2');
    });

    it('démarre au dialogue spécifié dans la scène cible', () => {
      const scene1 = makeScene({ id: 'scene1' });
      const scene2 = makeScene({
        id: 'scene2',
        dialogues: [makeDialogue({ id: 'da' }), makeDialogue({ id: 'db' })],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene1, scene2], initialSceneId: 'scene1' })
      );
      act(() => { result.current.goToScene('scene2', 'db'); });
      expect(result.current.currentDialogue?.id).toBe('db');
    });
  });

  // --------------------------------------------------------------------------
  // chooseOption — choix simple (sans dé)
  // --------------------------------------------------------------------------
  describe('chooseOption() — choix simple', () => {
    it('navigue vers nextDialogueId', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', choices: [makeChoice({ nextDialogueId: 'd3' })] }),
          makeDialogue({ id: 'd2' }),
          makeDialogue({ id: 'd3' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => { result.current.chooseOption(makeChoice({ nextDialogueId: 'd3' })); });
      expect(result.current.currentDialogue?.id).toBe('d3');
    });

    it('change de scène via nextSceneId', () => {
      const scene1 = makeScene({ id: 'scene1', dialogues: [makeDialogue({ id: 'd1', choices: [makeChoice()] })] });
      const scene2 = makeScene({ id: 'scene2', dialogues: [makeDialogue({ id: 'd-s2' })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene1, scene2], initialSceneId: 'scene1' })
      );
      act(() => { result.current.chooseOption(makeChoice({ nextSceneId: 'scene2' })); });
      expect(result.current.currentScene?.id).toBe('scene2');
    });

    it('appelle goToNextDialogue quand aucune cible de navigation', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', choices: [makeChoice()] }),
          makeDialogue({ id: 'd2' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => { result.current.chooseOption(makeChoice()); });
      expect(result.current.currentDialogue?.id).toBe('d2');
    });

    it('applique les effets add sur les stats', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ id: 'd1', choices: [makeChoice()] })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialStats: { physique: 50 } })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          effects: [{ variable: 'physique', value: 10, operation: 'add' }],
        }));
      });
      expect(result.current.stats.physique).toBe(60);
    });

    it('applique les effets set sur les stats', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ id: 'd1', choices: [makeChoice()] })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialStats: { physique: 30 } })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          effects: [{ variable: 'physique', value: 80, operation: 'set' }],
        }));
      });
      expect(result.current.stats.physique).toBe(80);
    });

    it('plafonne les stats à 100', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ choices: [makeChoice()] })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialStats: { physique: 95 } })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          effects: [{ variable: 'physique', value: 20, operation: 'add' }],
        }));
      });
      expect(result.current.stats.physique).toBe(100);
    });

    it('plancher les stats à 0', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ choices: [makeChoice()] })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialStats: { physique: 5 } })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          effects: [{ variable: 'physique', value: -20, operation: 'add' }],
        }));
      });
      expect(result.current.stats.physique).toBe(0);
    });

    it('ajoute une entrée dans l\'historique', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ choices: [makeChoice({ id: 'c-test' })] })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => { result.current.chooseOption(makeChoice({ id: 'c-test' })); });
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].choiceId).toBe('c-test');
    });
  });

  // --------------------------------------------------------------------------
  // chooseOption — jet de dés + confirmDiceNavigation
  // --------------------------------------------------------------------------
  describe('chooseOption() — jet de dés + confirmDiceNavigation()', () => {
    it('ouvre l\'overlay dé (diceState non null) sans naviguer immédiatement', () => {
      const scene = makeScene({
        dialogues: [makeDialogue({ id: 'd1', choices: [makeChoice({
          diceCheck: { stat: 'physique', difficulty: 10 },
        })] })],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          diceCheck: { stat: 'physique', difficulty: 10 },
        }));
      });
      expect(result.current.diceState.lastRoll).not.toBeNull();
      expect(result.current.diceState.lastResult).toMatch(/^(success|failure)$/);
      // Navigation différée — toujours sur d1
      expect(result.current.currentDialogue?.id).toBe('d1');
    });

    it('navigue vers le dialogue succès après confirmDiceNavigation', () => {
      // Force succès : roll = floor(0.95 * 20) + 1 = 20, difficulty = 10
      vi.spyOn(Math, 'random').mockReturnValue(0.95);
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', choices: [makeChoice({
            diceCheck: {
              stat: 'physique',
              difficulty: 10,
              success: { nextDialogueId: 'd-succes' },
              failure: { nextDialogueId: 'd-echec' },
            },
          })] }),
          makeDialogue({ id: 'd-succes' }),
          makeDialogue({ id: 'd-echec' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          diceCheck: {
            stat: 'physique',
            difficulty: 10,
            success: { nextDialogueId: 'd-succes' },
            failure: { nextDialogueId: 'd-echec' },
          },
        }));
      });
      act(() => { result.current.confirmDiceNavigation(); });
      expect(result.current.currentDialogue?.id).toBe('d-succes');
      expect(result.current.diceState.lastRoll).toBeNull(); // overlay fermé
    });

    it('navigue vers le dialogue échec après confirmDiceNavigation', () => {
      // Force échec : roll = floor(0 * 20) + 1 = 1, difficulty = 10
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', choices: [makeChoice({
            diceCheck: {
              stat: 'physique',
              difficulty: 10,
              success: { nextDialogueId: 'd-succes' },
              failure: { nextDialogueId: 'd-echec' },
            },
          })] }),
          makeDialogue({ id: 'd-succes' }),
          makeDialogue({ id: 'd-echec' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          diceCheck: {
            stat: 'physique',
            difficulty: 10,
            success: { nextDialogueId: 'd-succes' },
            failure: { nextDialogueId: 'd-echec' },
          },
        }));
      });
      act(() => { result.current.confirmDiceNavigation(); });
      expect(result.current.currentDialogue?.id).toBe('d-echec');
    });

    it('appelle goToNextDialogue quand les branches n\'ont pas de nextDialogueId (undefined)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.95); // succès
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', choices: [makeChoice({
            diceCheck: { stat: 'physique', difficulty: 10, success: {}, failure: {} },
          })] }),
          makeDialogue({ id: 'd2' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          diceCheck: { stat: 'physique', difficulty: 10, success: {}, failure: {} },
        }));
      });
      act(() => { result.current.confirmDiceNavigation(); });
      expect(result.current.currentDialogue?.id).toBe('d2');
    });

    it('normalise nextDialogueId vide ("") en undefined — pas de blocage joueur', () => {
      // Régression : "" est falsy → confirmDiceNavigation sautait la navigation → joueur bloqué
      vi.spyOn(Math, 'random').mockReturnValue(0.95); // succès
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', choices: [makeChoice({
            diceCheck: {
              stat: 'physique',
              difficulty: 10,
              success: { nextDialogueId: '' },   // chaîne vide = bug corrigé
              failure: { nextDialogueId: '' },
            },
          })] }),
          makeDialogue({ id: 'd2' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          diceCheck: {
            stat: 'physique',
            difficulty: 10,
            success: { nextDialogueId: '' },
            failure: { nextDialogueId: '' },
          },
        }));
      });
      act(() => { result.current.confirmDiceNavigation(); });
      // Doit avancer (goToNextDialogue) et non rester bloqué sur d1
      expect(result.current.currentDialogue?.id).toBe('d2');
    });

    it('ne plante pas si confirmDiceNavigation appelé sans dé en attente', () => {
      const scene = makeScene({ dialogues: [makeDialogue({ id: 'd1' })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1' })
      );
      expect(() => {
        act(() => { result.current.confirmDiceNavigation(); });
      }).not.toThrow();
      expect(result.current.currentDialogue?.id).toBe('d1');
    });

    it('change de scène via nextSceneId après succès dé', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.95); // succès
      const scene1 = makeScene({
        id: 'scene1',
        dialogues: [makeDialogue({ id: 'd1', choices: [makeChoice({
          diceCheck: {
            stat: 'physique',
            difficulty: 10,
            success: { nextSceneId: 'scene2' },
            failure: {},
          },
        })] })],
      });
      const scene2 = makeScene({ id: 'scene2', dialogues: [makeDialogue({ id: 'd-s2' })] });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene1, scene2], initialSceneId: 'scene1' })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          diceCheck: { stat: 'physique', difficulty: 10, success: { nextSceneId: 'scene2' }, failure: {} },
        }));
      });
      act(() => { result.current.confirmDiceNavigation(); });
      expect(result.current.currentScene?.id).toBe('scene2');
    });
  });

  // --------------------------------------------------------------------------
  // Conditions (evaluateConditions — testées via currentDialogue)
  // --------------------------------------------------------------------------
  describe('conditions sur les dialogues', () => {
    it.each([
      ['>=', 50, 50, 'd-conditionnel'],
      ['>=', 49, 50, 'd-default'],
      ['<=', 30, 30, 'd-conditionnel'],
      ['<=', 31, 30, 'd-default'],
      ['>', 51, 50, 'd-conditionnel'],
      ['>', 50, 50, 'd-default'],
      ['<', 49, 50, 'd-conditionnel'],
      ['<', 50, 50, 'd-default'],
      ['==', 42, 42, 'd-conditionnel'],
      ['==', 41, 42, 'd-default'],
      ['!=', 41, 42, 'd-conditionnel'],
      ['!=', 42, 42, 'd-default'],
    ] as const)(
      'opérateur %s : stat=%i vs seuil=%i → attend %s',
      (operator, stat, threshold, expectedId) => {
        const scene = makeScene({
          dialogues: [
            makeDialogue({
              id: 'd-conditionnel',
              conditions: [{ variable: 'physique', operator, value: threshold }],
            }),
            makeDialogue({ id: 'd-default' }),
          ],
        });
        const { result } = renderHook(() =>
          useGameState({
            scenes: [scene],
            initialSceneId: 'scene1',
            initialStats: { physique: stat },
          })
        );
        expect(result.current.currentDialogue?.id).toBe(expectedId);
      }
    );
  });

  // --------------------------------------------------------------------------
  // jumpToHistoryIndex
  // --------------------------------------------------------------------------
  describe('jumpToHistoryIndex()', () => {
    it('restaure la position et les stats au moment du choix', () => {
      const scene = makeScene({
        dialogues: [
          makeDialogue({ id: 'd1', choices: [makeChoice({
            id: 'c1',
            nextDialogueId: 'd2',
            effects: [{ variable: 'physique', value: 10, operation: 'add' }],
          })] }),
          makeDialogue({ id: 'd2' }),
        ],
      });
      const { result } = renderHook(() =>
        useGameState({ scenes: [scene], initialSceneId: 'scene1', initialStats: { physique: 50 } })
      );
      act(() => {
        result.current.chooseOption(makeChoice({
          id: 'c1',
          nextDialogueId: 'd2',
          effects: [{ variable: 'physique', value: 10, operation: 'add' }],
        }));
      });
      expect(result.current.currentDialogue?.id).toBe('d2');

      act(() => { result.current.jumpToHistoryIndex(0); });
      expect(result.current.currentDialogue?.id).toBe('d1');
      // Snapshot au moment du choix = stats après effet = 60
      expect(result.current.stats.physique).toBe(60);
    });

    it('ne plante pas sur un index invalide', () => {
      const { result } = renderHook(() =>
        useGameState({ scenes: [makeScene()], initialSceneId: 'scene1' })
      );
      expect(() => {
        act(() => { result.current.jumpToHistoryIndex(99); });
      }).not.toThrow();
    });
  });
});
