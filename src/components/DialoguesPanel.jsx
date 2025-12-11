import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import ConfirmModal from './ConfirmModal.jsx';


export default function DialoguesPanel() {
  const {
    scenes,
    selectedSceneForEdit,
    addDialogue,
    updateDialogue,
    deleteDialogue
  } = useApp();


  const scene = useMemo(
    () => scenes.find(s => s.id === selectedSceneForEdit) || null,
    [scenes, selectedSceneForEdit]
  );


  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(null);
  const [confirmType, setConfirmType] = useState('dialogue');
  const [pendingChoiceIndex, setPendingChoiceIndex] = useState(null);


  if (!scene) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Dialogues</h3>
        <div className="border-2 border-slate-200 rounded-lg p-6 text-center text-slate-500">
          <p className="mb-2">Aucune scene selectionnee</p>
          <p className="text-sm">Selectionnez une scene a gauche pour gerer ses dialogues.</p>
        </div>
      </div>
    );
  }


  function onAdd() {
    addDialogue(scene.id, {
      speaker: 'narrator',
      text: 'Nouveau dialogue',
      choices: []
    });
  }


  function askDelete(idx) {
    setPendingIndex(idx);
    setPendingChoiceIndex(null);
    setConfirmType('dialogue');
    setConfirmOpen(true);
  }


  function askDeleteChoice(dialogueIdx, choiceIdx) {
    setPendingIndex(dialogueIdx);
    setPendingChoiceIndex(choiceIdx);
    setConfirmType('choice');
    setConfirmOpen(true);
  }


  function handleConfirmDelete() {
    if (confirmType === 'dialogue' && pendingIndex != null) {
      deleteDialogue(scene.id, pendingIndex);
    } else if (confirmType === 'choice' && pendingIndex != null && pendingChoiceIndex != null) {
      const dialogue = scene.dialogues[pendingIndex];
      const newChoices = dialogue.choices.filter((_, i) => i !== pendingChoiceIndex);
      updateDialogue(scene.id, pendingIndex, { choices: newChoices });
    }
    setPendingIndex(null);
    setPendingChoiceIndex(null);
    setConfirmOpen(false);
  }


  function handleCancelDelete() {
    setPendingIndex(null);
    setPendingChoiceIndex(null);
    setConfirmOpen(false);
  }


  function addChoice(dialogueIdx) {
    const dialogue = scene.dialogues[dialogueIdx];
    const newChoices = [...(dialogue.choices || []), {
      text: 'Nouveau choix',
      nextScene: '',
      diceRoll: {
        enabled: false,
        difficulty: 12,
        successOutcome: {
          message: 'Reussite !',
          moral: 5,
          illustration: ''
        },
        failureOutcome: {
          message: 'Echec...',
          moral: -3,
          illustration: ''
        }
      }
    }];
    updateDialogue(scene.id, dialogueIdx, { choices: newChoices });
  }


  function updateChoice(dialogueIdx, choiceIdx, field, value) {
    const dialogue = scene.dialogues[dialogueIdx];
    const newChoices = [...dialogue.choices];
    newChoices[choiceIdx] = { ...newChoices[choiceIdx], [field]: value };
    updateDialogue(scene.id, dialogueIdx, { choices: newChoices });
  }


  function updateDiceRoll(dialogueIdx, choiceIdx, field, value) {
    const dialogue = scene.dialogues[dialogueIdx];
    const newChoices = [...dialogue.choices];
    const choice = newChoices[choiceIdx];
    
    if (!choice.diceRoll) {
      choice.diceRoll = {
        enabled: false,
        difficulty: 12,
        successOutcome: { message: '', moral: 0, illustration: '' },
        failureOutcome: { message: '', moral: 0, illustration: '' }
      };
    }
    
    choice.diceRoll = { ...choice.diceRoll, [field]: value };
    updateDialogue(scene.id, dialogueIdx, { choices: newChoices });
  }


  function updateOutcome(dialogueIdx, choiceIdx, outcomeType, field, value) {
    const dialogue = scene.dialogues[dialogueIdx];
    const newChoices = [...dialogue.choices];
    const choice = newChoices[choiceIdx];
    
    if (!choice.diceRoll) {
      choice.diceRoll = {
        enabled: false,
        difficulty: 12,
        successOutcome: { message: '', moral: 0, illustration: '' },
        failureOutcome: { message: '', moral: 0, illustration: '' }
      };
    }
    
    choice.diceRoll[outcomeType] = {
      ...choice.diceRoll[outcomeType],
      [field]: value
    };
    
    updateDialogue(scene.id, dialogueIdx, { choices: newChoices });
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Dialogues</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          aria-label="Ajouter un nouveau dialogue"
        >
          + Ajouter
        </button>
      </div>


      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {(scene.dialogues || []).map((d, idx) => (
          <div key={idx} className="border-2 border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all">
            <div className="space-y-3">
              {/* Speaker */}
              <div>
                <label htmlFor={`speaker-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Locuteur
                </label>
                <input
                  id={`speaker-${idx}`}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm transition-all"
                  value={d.speaker || ''}
                  onChange={(e) => updateDialogue(scene.id, idx, { speaker: e.target.value })}
                  aria-label={`Locuteur du dialogue ${idx + 1}`}
                  placeholder="Ex: narrator, player, conseiller"
                />
              </div>


              {/* Text */}
              <div>
                <label htmlFor={`text-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Texte
                </label>
                <textarea
                  id={`text-${idx}`}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all"
                  rows={3}
                  value={d.text || ''}
                  onChange={(e) => updateDialogue(scene.id, idx, { text: e.target.value })}
                  aria-label={`Texte du dialogue ${idx + 1}`}
                  placeholder="Entrez le texte du dialogue ici..."
                />
              </div>


              {/* Choices */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Choix (branches)
                  </label>
                  <button
                    onClick={() => addChoice(idx)}
                    className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                    aria-label={`Ajouter un choix au dialogue ${idx + 1}`}
                  >
                    + Choix
                  </button>
                </div>


                {(d.choices || []).length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">
                    Aucun choix. Cliquez "+ Choix" pour ajouter une branche.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {d.choices.map((choice, choiceIdx) => (
                      <div key={choiceIdx} className="border-2 border-slate-300 rounded-lg p-3 bg-slate-50">
                        <div className="space-y-3">
                          {/* Texte du choix */}
                          <div>
                            <label htmlFor={`choice-text-${idx}-${choiceIdx}`} className="block text-xs font-semibold text-slate-600 mb-1">
                              Texte du choix
                            </label>
                            <input
                              id={`choice-text-${idx}-${choiceIdx}`}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                              value={choice.text || ''}
                              onChange={(e) => updateChoice(idx, choiceIdx, 'text', e.target.value)}
                              placeholder="Ex: Accepter la mission"
                            />
                          </div>


                          {/* Scene suivante */}
                          <div>
                            <label htmlFor={`choice-next-${idx}-${choiceIdx}`} className="block text-xs font-semibold text-slate-600 mb-1">
                              Scene suivante (ID)
                            </label>
                            <input
                              id={`choice-next-${idx}-${choiceIdx}`}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                              value={choice.nextScene || ''}
                              onChange={(e) => updateChoice(idx, choiceIdx, 'nextScene', e.target.value)}
                              placeholder="Ex: scene-2 (optionnel si lancer de de actif)"
                            />
                          </div>


                          {/* Toggle Lancer de dé */}
                          <div className="border-t border-slate-300 pt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={choice.diceRoll?.enabled || false}
                                onChange={(e) => updateDiceRoll(idx, choiceIdx, 'enabled', e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-2 focus:ring-purple-500"
                              />
                              <span className="text-xs font-semibold text-purple-700">
                                🎲 Activer le lancer de de
                              </span>
                            </label>
                          </div>


                          {/* Configuration du dé */}
                          {choice.diceRoll?.enabled && (
                            <div className="border border-purple-300 rounded-lg p-3 bg-purple-50 space-y-3">
                              {/* Difficulté */}
                              <div>
                                <label htmlFor={`dice-difficulty-${idx}-${choiceIdx}`} className="block text-xs font-semibold text-purple-700 mb-1">
                                  Difficulte (seuil de reussite)
                                </label>
                                <input
                                  id={`dice-difficulty-${idx}-${choiceIdx}`}
                                  type="number"
                                  min="1"
                                  max="20"
                                  className="w-full px-2 py-1.5 border border-purple-300 rounded text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none"
                                  value={choice.diceRoll?.difficulty || 12}
                                  onChange={(e) => updateDiceRoll(idx, choiceIdx, 'difficulty', parseInt(e.target.value) || 12)}
                                  placeholder="12"
                                />
                                <p className="text-xs text-purple-600 mt-1">Le joueur doit obtenir ce score ou plus au de (1-20)</p>
                              </div>


                              {/* Success Outcome */}
                              <div className="border border-green-300 rounded-lg p-2 bg-green-50">
                                <h4 className="text-xs font-bold text-green-700 mb-2">✅ En cas de reussite</h4>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-green-600 mb-1">Message</label>
                                    <input
                                      className="w-full px-2 py-1 border border-green-300 rounded text-xs focus:border-green-500 outline-none"
                                      value={choice.diceRoll?.successOutcome?.message || ''}
                                      onChange={(e) => updateOutcome(idx, choiceIdx, 'successOutcome', 'message', e.target.value)}
                                      placeholder="Ex: Place trouvee !"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-green-600 mb-1">Impact moral</label>
                                    <input
                                      type="number"
                                      className="w-full px-2 py-1 border border-green-300 rounded text-xs focus:border-green-500 outline-none"
                                      value={choice.diceRoll?.successOutcome?.moral || 0}
                                      onChange={(e) => updateOutcome(idx, choiceIdx, 'successOutcome', 'moral', parseInt(e.target.value) || 0)}
                                      placeholder="5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-green-600 mb-1">Illustration (nom fichier)</label>
                                    <input
                                      className="w-full px-2 py-1 border border-green-300 rounded text-xs focus:border-green-500 outline-none"
                                      value={choice.diceRoll?.successOutcome?.illustration || ''}
                                      onChange={(e) => updateOutcome(idx, choiceIdx, 'successOutcome', 'illustration', e.target.value)}
                                      placeholder="parking-success.png"
                                    />
                                  </div>
                                </div>
                              </div>


                              {/* Failure Outcome */}
                              <div className="border border-red-300 rounded-lg p-2 bg-red-50">
                                <h4 className="text-xs font-bold text-red-700 mb-2">❌ En cas d'echec</h4>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-red-600 mb-1">Message</label>
                                    <input
                                      className="w-full px-2 py-1 border border-red-300 rounded text-xs focus:border-red-500 outline-none"
                                      value={choice.diceRoll?.failureOutcome?.message || ''}
                                      onChange={(e) => updateOutcome(idx, choiceIdx, 'failureOutcome', 'message', e.target.value)}
                                      placeholder="Ex: Aucune place..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-red-600 mb-1">Impact moral</label>
                                    <input
                                      type="number"
                                      className="w-full px-2 py-1 border border-red-300 rounded text-xs focus:border-red-500 outline-none"
                                      value={choice.diceRoll?.failureOutcome?.moral || 0}
                                      onChange={(e) => updateOutcome(idx, choiceIdx, 'failureOutcome', 'moral', parseInt(e.target.value) || 0)}
                                      placeholder="-3"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-red-600 mb-1">Illustration (nom fichier)</label>
                                    <input
                                      className="w-full px-2 py-1 border border-red-300 rounded text-xs focus:border-red-500 outline-none"
                                      value={choice.diceRoll?.failureOutcome?.illustration || ''}
                                      onChange={(e) => updateOutcome(idx, choiceIdx, 'failureOutcome', 'illustration', e.target.value)}
                                      placeholder="parking-fail.png"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}


                          {/* Bouton Supprimer */}
                          <div className="flex justify-end pt-2 border-t border-slate-300">
                            <button
                              onClick={() => askDeleteChoice(idx, choiceIdx)}
                              className="px-3 py-1 rounded text-xs bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
                              aria-label={`Supprimer le choix ${choiceIdx + 1}`}
                            >
                              Supprimer ce choix
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* Actions */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  onClick={() => askDelete(idx)}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors font-medium"
                  aria-label={`Supprimer le dialogue ${idx + 1}`}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}


        {(scene.dialogues || []).length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm text-slate-600 font-medium mb-1">Aucun dialogue</p>
            <p className="text-xs text-slate-500">Cliquez sur "+ Ajouter" pour creer votre premier dialogue</p>
          </div>
        )}
      </div>


      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={confirmType === 'dialogue' ? 'Supprimer le dialogue' : 'Supprimer le choix'}
        message={confirmType === 'dialogue' ? 'Etes-vous sur de vouloir supprimer ce dialogue ?' : 'Etes-vous sur de vouloir supprimer ce choix ?'}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
      />
    </div>
  );
}
