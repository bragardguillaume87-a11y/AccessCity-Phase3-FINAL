// src/components/PlayerPreview.tsx
// ASCII only
import React, { useEffect, useRef, useState } from 'react';
import { createEngine } from '../core/engine';
import type { Scene, DialogueChoice, GameStats, GameEngine } from '@/types/index';
import { useCharactersStore } from '../stores/index.ts';
import HUDVariables from './HUDVariables.jsx';
import DeltaBadges from './DeltaBadges.jsx';
import DiceResultModal from './DiceResultModal.jsx';
import OutcomeModal from './OutcomeModal.jsx';

/**
 * Current dialogue state for display
 */
interface CurrentDialogue {
  speaker: string;
  speakerMood?: string;
  text: string;
  choices: DialogueChoice[];
}

/**
 * Delta badge item for animated stats changes
 */
interface DeltaBadge {
  id: string;
  variable: string;
  delta: number;
}

/**
 * Dice roll result with outcome
 */
interface DiceRollResult {
  roll: number;
  difficulty: number;
  success: boolean;
}

/**
 * Outcome data after dice roll or choice
 */
interface OutcomeData {
  message: string;
  illustration: string;
  moral: { variable: string; delta: number } | null;
}

/**
 * Props for PlayerPreview component
 */
interface PlayerPreviewProps {
  /** Scene to preview */
  scene: Scene;
  /** Callback to exit preview mode */
  onExit: () => void;
}

export default function PlayerPreview({ scene, onExit }: PlayerPreviewProps): React.JSX.Element {
  const characters = useCharactersStore(state => state.characters);
  const [current, setCurrent] = useState<CurrentDialogue | null>(null);
  const [vars, setVars] = useState<GameStats>({ Physique: 100, Mentale: 100 });
  const [ended, setEnded] = useState(false);
  const [deltas, setDeltas] = useState<DeltaBadge[]>([]);

  // Etats pour les modales de des
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [diceResult, setDiceResult] = useState<DiceRollResult>({ roll: 0, difficulty: 0, success: false });
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [currentOutcome, setCurrentOutcome] = useState<OutcomeData>({ message: '', illustration: '', moral: null });

  const engineRef = useRef<GameEngine | null>(null);
  const busRef = useRef<GameEngine['eventBus'] | null>(null);

  useEffect(() => {
    const { eventBus, variableManager, dialogueEngine } = createEngine(vars);
    engineRef.current = { eventBus, variableManager, dialogueEngine };
    busRef.current = eventBus;

    function onShow(d: CurrentDialogue): void {
      setCurrent(d);
    }

    function onVars(v: GameStats): void {
      setVars(v);
    }

    function onEnd(): void {
      setEnded(true);
      setCurrent({ speaker: 'narrator', text: 'Scene terminee.', choices: [] });
    }

    function onDelta(list: Array<{ variable: string; delta: number }>): void {
      if (!Array.isArray(list)) return;
      list.forEach(({ variable, delta }) => {
        const id = `${Date.now()}-${Math.random()}`;
        setDeltas(prev => [...prev, { id, variable, delta }]);
        setTimeout(() => {
          setDeltas(prev => prev.filter(x => x.id !== id));
        }, 1500);
      });
    }

    eventBus.on('dialogue:show', onShow);
    eventBus.on('variables:updated', onVars);
    eventBus.on('scene:complete', onEnd);
    eventBus.on('variables:delta', onDelta);

    dialogueEngine.loadScene(scene);

    return () => {
      eventBus.off('dialogue:show', onShow);
      eventBus.off('variables:updated', onVars);
      eventBus.off('scene:complete', onEnd);
      eventBus.off('variables:delta', onDelta);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  function handleChoice(choice: DialogueChoice): void {
    if (!engineRef.current) return;

    // Si le choix a un lancer de de active
    if (choice.diceCheck && choice.diceCheck.stat) {
      const roll = rollDice();
      const difficulty = choice.diceCheck.difficulty || 12;
      const success = roll >= difficulty;

      // Afficher le resultat du de
      setDiceResult({ roll, difficulty, success });
      setDiceModalOpen(true);

      // Preparer l'issue correspondante
      const outcome = success ? choice.diceCheck.success : choice.diceCheck.failure;

      // Attendre 1.5s puis afficher l'issue
      setTimeout(() => {
        setDiceModalOpen(false);
        showOutcomeMessage(outcome, choice.nextSceneId);
      }, 1500);
    } else {
      // Choix classique sans de
      engineRef.current.dialogueEngine.handleChoice(choice);
    }
  }

  function rollDice(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  function showOutcomeMessage(
    outcome: { nextSceneId?: string; nextDialogueId?: string } | undefined,
    nextScene: string | undefined
  ): void {
    if (!outcome) return;

    // Type assertion for outcome with message/illustration (legacy format support)
    const outcomeWithMessage = outcome as unknown as {
      message?: string;
      illustration?: string;
      moral?: { variable: string; delta: number };
    };

    setCurrentOutcome({
      message: outcomeWithMessage.message || '',
      illustration: outcomeWithMessage.illustration || '',
      moral: outcomeWithMessage.moral || null
    });
    setOutcomeModalOpen(true);

    // Appliquer l'effet moral si present
    if (outcomeWithMessage.moral && outcomeWithMessage.moral.variable && outcomeWithMessage.moral.delta) {
      engineRef.current?.variableManager.modify(
        outcomeWithMessage.moral.variable,
        outcomeWithMessage.moral.delta
      );
    }

    // Attendre 2s puis naviguer vers la scene suivante
    setTimeout(() => {
      setOutcomeModalOpen(false);
      if (nextScene) {
        // Charger la scene suivante
        const sceneData: Scene = {
          id: nextScene,
          title: '',
          description: '',
          backgroundUrl: '',
          dialogues: [],
          characters: []
        };
        engineRef.current?.dialogueEngine.loadScene(sceneData);
      }
    }, 2000);
  }

  function handleNext(): void {
    if (!engineRef.current) return;
    engineRef.current.dialogueEngine.next();
  }

  function nameOf(id: string): string {
    if (id === 'narrator') return 'Narrateur';
    return id || '';
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Modales de des */}
      <DiceResultModal
        isOpen={diceModalOpen}
        roll={diceResult.roll}
        difficulty={diceResult.difficulty}
        success={diceResult.success}
        onClose={() => setDiceModalOpen(false)}
      />
      <OutcomeModal
        isOpen={outcomeModalOpen}
        message={currentOutcome.message}
        illustration={currentOutcome.illustration}
        moral={currentOutcome.moral}
        onClose={() => setOutcomeModalOpen(false)}
      />

      {/* Bouton Quitter */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
        aria-label="Quitter la preview et retourner a l editeur"
      >
        Quitter
      </button>

      {/* HUD variables positionne en absolu */}
      <div className="absolute top-4 left-4 z-40">
        <HUDVariables variables={vars} />
      </div>
      <DeltaBadges deltas={deltas} />

      {/* Stage - plein ecran */}
      <div className="relative flex-1 bg-black overflow-hidden w-full">
        {/* Background */}
        {scene && scene.backgroundUrl ? (
          <img src={scene.backgroundUrl} alt="Decor" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900" />
        )}

        {/* Character Sprite */}
        {current && current.speaker && current.speaker !== 'narrator' && (() => {
          const character = characters.find(c => c.id === current.speaker);
          if (!character || !character.sprites) return null;

          const speakerMood = current.speakerMood || 'neutral';
          const spriteUrl = character.sprites[speakerMood] || character.sprites['neutral'] || character.sprites[Object.keys(character.sprites)[0]];

          if (!spriteUrl) return null;

          return (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10 animate-previewSwap">
              <img
                key={speakerMood}
                src={spriteUrl}
                alt={`${character.name} - ${speakerMood}`}
                className="max-w-sm max-h-96 object-contain drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))'
                }}
              />
            </div>
          );
        })()}

        {/* Dialogue Box */}
        <div className="absolute inset-x-0 bottom-4 px-4">
          {current && (
            <div className="mx-auto max-w-2xl bg-[rgba(37,37,38,0.95)] text-gray-100 border-2 border-primary rounded-lg p-4 shadow-xl">
              {!ended && (
                <>
                  <div className="mb-2 font-semibold text-primary-hover">{nameOf(current.speaker)}</div>
                  <p className="mb-4">{current.text}</p>
                  {current.choices && current.choices.length > 0 ? (
                    <div className="space-y-2" role="group" aria-label="Choix disponibles">
                      {current.choices.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleChoice(c)}
                          className="w-full text-left px-3 py-2 rounded border border-gray-600 hover:border-primary"
                          aria-label={`Choix ${i + 1}`}
                        >
                          → {c.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={handleNext}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded"
                        aria-label="Suivant"
                      >
                        Suivant →
                      </button>
                    </div>
                  )}
                </>
              )}
              {ended && <p role="status" aria-live="polite">{current.text}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
