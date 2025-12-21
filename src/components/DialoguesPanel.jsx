import React, { useMemo, useState } from 'react';
import { useScenesStore, useCharactersStore, useUIStore } from '../stores/index.js';
import { useValidation } from '../hooks/useValidation.js';
import ConfirmModal from './ConfirmModal.jsx';
import TemplateSelector from './TemplateSelector.jsx';
import { duplicateDialogue } from '../utils/duplication.js';
import { normalizeTemplate } from '../utils/templateNormalizer.js';

export default function DialoguesPanel() {
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);
  const addDialogue = useScenesStore(state => state.addDialogue);
  const addDialogues = useScenesStore(state => state.addDialogues);
  const updateDialogue = useScenesStore(state => state.updateDialogue);
  const deleteDialogue = useScenesStore(state => state.deleteDialogue);

  const validation = useValidation();


  const scene = useMemo(
    () => scenes.find(s => s.id === selectedSceneForEdit) || null,
    [scenes, selectedSceneForEdit]
  );


  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(null);
  const [confirmType, setConfirmType] = useState('dialogue');
  const [pendingChoiceIndex, setPendingChoiceIndex] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editingDialogueIdx, setEditingDialogueIdx] = useState(null);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  function showNotification(message, type = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }


  if (!scene) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <p className="text-sm">← Selectionnez une scene</p>
      </div>
    );
  }


  function onAdd() {
    addDialogue(scene.id, {
      speaker: 'narrator',
      text: 'Nouveau dialogue',
      choices: []
    });
    showNotification('Dialogue ajoute avec succes', 'success');
  }

  function handleDuplicateDialogue(dialogueIdx) {
    const dialogueToDuplicate = scene.dialogues[dialogueIdx];
    if (!dialogueToDuplicate) return;

    const duplicatedDialogue = duplicateDialogue(dialogueToDuplicate);
    addDialogue(scene.id, duplicatedDialogue);
    showNotification('Dialogue duplique avec succes', 'success');
  }

  function handleSelectTemplate(template) {
    if (!template.structure?.dialogues) return;
    
    // Normaliser le template (diceCheck -> diceRoll)
    const normalizedTemplate = normalizeTemplate(template);
    
    // Generer IDs uniques pour chaque dialogue
    const dialoguesWithIds = normalizedTemplate.structure.dialogues.map(d => ({
      ...d,
      id: `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    // Ajouter tous les dialogues en une seule operation (batch)
    addDialogues(scene.id, dialoguesWithIds);
    showNotification(`Template "${template.name}" applique (${dialoguesWithIds.length} dialogues)`, 'success');
    setTemplateSelectorOpen(false);
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
      setEditingDialogueIdx(null);
      showNotification('Dialogue supprime', 'success');
    } else if (confirmType === 'choice' && pendingIndex != null && pendingChoiceIndex != null) {
      const dialogue = scene.dialogues[pendingIndex];
      const newChoices = dialogue.choices.filter((_, i) => i !== pendingChoiceIndex);
      updateDialogue(scene.id, pendingIndex, { choices: newChoices });
      showNotification('Choix supprime', 'success');
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
    showNotification('Choix ajoute avec succes', 'success');
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

  const selectedDialogue = editingDialogueIdx !== null ? scene.dialogues[editingDialogueIdx] : null;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* COLONNE GAUCHE : Scènes + Dialogues */}
      <div className="space-y-4">
        {/* Scènes */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Scènes</h3>
        {scenes.map((s, index) => (
          <div
            key={s.id}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selectedSceneForEdit === s.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white hover:bg-slate-50 border-2 border-slate-200'
            }`}
            onClick={() => setSelectedSceneForEdit(s.id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">#{index + 1} {s.title}</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                selectedSceneForEdit === s.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {(s.dialogues || []).length}
              </span>
            </div>
          </div>
        ))}
        </div>

        {/* Dialogues */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Dialogues</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTemplateSelectorOpen(true)}
              className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
              title="Utiliser un template"
            >
              📦 Template
            </button>
            <button
              onClick={onAdd}
              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
              aria-label="Ajouter un nouveau dialogue"
            >
              + Ajouter
            </button>
          </div>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {(scene.dialogues || []).map((d, idx) => {
          const dialogueKey = `${scene.id}-${idx}`;
          const dialogueErrors = validation.errors.dialogues[dialogueKey];
          const hasErrors = dialogueErrors && dialogueErrors.some(e => e.severity === 'error');

          return (
          <div
            key={idx}
            onClick={() => setEditingDialogueIdx(idx)}
            className={`magnetic-lift shadow-depth-sm p-4 rounded-lg transition-all cursor-pointer ${
              editingDialogueIdx === idx
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white hover:bg-slate-50 border-2 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold mb-1 ${editingDialogueIdx === idx ? 'opacity-70 text-white' : 'text-slate-500'}`}>
                  #{idx + 1}
                </p>
                <p className={`text-sm truncate font-medium ${editingDialogueIdx === idx ? 'text-white' : 'text-slate-900'}`}>
                  {d.speaker}: {d.text.substring(0, 30)}...
                </p>
                <p className={`text-xs mt-1 ${editingDialogueIdx === idx ? 'text-white/70' : 'text-slate-500'}`}>
                  {(d.choices || []).length} choix
                </p>
              </div>
              {/* Badge d'erreur */}
              {dialogueErrors && (
                <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                  editingDialogueIdx === idx
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-700'
                }`} title={dialogueErrors.map(e => e.message).join(', ')}>
                  {hasErrors ? '🔴' : '⚠️'}
                </span>
              )}
            </div>
          </div>
          );
        })}


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
        </div>
      </div>

      {/* COLONNE DROITE : Édition du dialogue */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {selectedDialogue ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Dialogue #{editingDialogueIdx + 1}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDuplicateDialogue(editingDialogueIdx)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm flex items-center gap-2"
                  title="Dupliquer ce dialogue"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Dupliquer
                </button>
                <button
                  onClick={() => setTemplateSelectorOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all text-sm flex items-center gap-2"
                  title="Appliquer un template de dialogue"
                >
                  📦 Template
                </button>
                <button
                  onClick={() => askDelete(editingDialogueIdx)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>

            {/* Speaker */}
            <div>
              <label htmlFor={`speaker-${editingDialogueIdx}`} className="block text-sm font-semibold text-slate-700 mb-2">
                Locuteur
              </label>
              <input
                id={`speaker-${editingDialogueIdx}`}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm transition-all"
                value={selectedDialogue.speaker || ''}
                onChange={(e) => updateDialogue(scene.id, editingDialogueIdx, { speaker: e.target.value })}
                aria-label={`Locuteur du dialogue ${editingDialogueIdx + 1}`}
                placeholder="Ex: narrator, player, conseiller"
              />
            </div>

            {/* Speaker Mood */}
            <div>
              <label htmlFor={`mood-${editingDialogueIdx}`} className="block text-sm font-semibold text-slate-700 mb-2">
                🎭 Humeur du personnage
              </label>
              <select
                id={`mood-${editingDialogueIdx}`}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm transition-all"
                value={selectedDialogue.speakerMood || 'neutral'}
                onChange={(e) => {
                  updateDialogue(scene.id, editingDialogueIdx, {
                    ...selectedDialogue,
                    speakerMood: e.target.value
                  });
                }}
                aria-label={`Humeur du locuteur pour le dialogue ${editingDialogueIdx + 1}`}
              >
                {(() => {
                  const character = characters.find(c => c.id === selectedDialogue.speaker);
                  if (!character || !character.moods || character.moods.length === 0) {
                    return <option value="neutral">😐 Neutre (défaut)</option>;
                  }

                  return character.moods.map(mood => {
                    const icon = character.moodIcons?.[mood] || '😐';
                    const label = character.moodLabels?.[mood] || mood;
                    return (
                      <option key={mood} value={mood}>
                        {icon} {label}
                      </option>
                    );
                  });
                })()}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Le sprite correspondant s'affichera dans la preview
              </p>
            </div>

            {/* Text */}
            <div>
              <label htmlFor={`text-${editingDialogueIdx}`} className="block text-sm font-semibold text-slate-700 mb-2">
                Texte
              </label>
              <textarea
                id={`text-${editingDialogueIdx}`}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all"
                rows={4}
                value={selectedDialogue.text || ''}
                onChange={(e) => updateDialogue(scene.id, editingDialogueIdx, { text: e.target.value })}
                aria-label={`Texte du dialogue ${editingDialogueIdx + 1}`}
                placeholder="Entrez le texte du dialogue ici..."
              />
            </div>

            {/* Choices */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Choix (branches)
                </label>
                <button
                  onClick={() => addChoice(editingDialogueIdx)}
                  className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                  aria-label={`Ajouter un choix au dialogue ${editingDialogueIdx + 1}`}
                >
                  + Choix
                </button>
              </div>

              {(selectedDialogue.choices || []).length === 0 ? (
                <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">
                  Aucun choix. Cliquez "+ Choix" pour ajouter une branche.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {selectedDialogue.choices.map((choice, choiceIdx) => (
                    <div key={choiceIdx} className="border-2 border-slate-300 rounded-lg p-4 bg-slate-50">
                      <div className="space-y-3">
                        {/* Texte du choix */}
                        <div>
                          <label htmlFor={`choice-text-${editingDialogueIdx}-${choiceIdx}`} className="block text-xs font-semibold text-slate-600 mb-1">
                            Texte du choix
                          </label>
                          <input
                            id={`choice-text-${editingDialogueIdx}-${choiceIdx}`}
                            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                            value={choice.text || ''}
                            onChange={(e) => updateChoice(editingDialogueIdx, choiceIdx, 'text', e.target.value)}
                            placeholder="Ex: Accepter la mission"
                          />
                        </div>

                        {/* Scene suivante */}
                        <div>
                          <label htmlFor={`choice-next-${editingDialogueIdx}-${choiceIdx}`} className="block text-xs font-semibold text-slate-600 mb-1">
                            Scene suivante (ID)
                          </label>
                          <input
                            id={`choice-next-${editingDialogueIdx}-${choiceIdx}`}
                            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                            value={choice.nextScene || ''}
                            onChange={(e) => updateChoice(editingDialogueIdx, choiceIdx, 'nextScene', e.target.value)}
                            placeholder="Ex: scene-2 (optionnel si lancer de de actif)"
                          />
                        </div>

                        {/* Toggle Lancer de dé */}
                        <div className="border-t border-slate-300 pt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={choice.diceRoll?.enabled || false}
                              onChange={(e) => updateDiceRoll(editingDialogueIdx, choiceIdx, 'enabled', e.target.checked)}
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
                              <label htmlFor={`dice-difficulty-${editingDialogueIdx}-${choiceIdx}`} className="block text-xs font-semibold text-purple-700 mb-1">
                                Difficulte (seuil de reussite)
                              </label>
                              <input
                                id={`dice-difficulty-${editingDialogueIdx}-${choiceIdx}`}
                                type="number"
                                min="1"
                                max="20"
                                className="w-full px-3 py-2 border border-purple-300 rounded text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none"
                                value={choice.diceRoll?.difficulty || 12}
                                onChange={(e) => updateDiceRoll(editingDialogueIdx, choiceIdx, 'difficulty', parseInt(e.target.value) || 12)}
                                placeholder="12"
                              />
                              <p className="text-xs text-purple-600 mt-1">Le joueur doit obtenir ce score ou plus au de (1-20)</p>
                            </div>

                            {/* Success Outcome */}
                            <div className="border border-green-300 rounded-lg p-3 bg-green-50">
                              <h4 className="text-xs font-bold text-green-700 mb-2">✅ En cas de reussite</h4>
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-green-600 mb-1">Message</label>
                                  <input
                                    className="w-full px-2 py-1.5 border border-green-300 rounded text-sm focus:border-green-500 outline-none"
                                    value={choice.diceRoll?.successOutcome?.message || ''}
                                    onChange={(e) => updateOutcome(editingDialogueIdx, choiceIdx, 'successOutcome', 'message', e.target.value)}
                                    placeholder="Ex: Place trouvee !"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-green-600 mb-1">Impact moral</label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1.5 border border-green-300 rounded text-sm focus:border-green-500 outline-none"
                                    value={choice.diceRoll?.successOutcome?.moral || 0}
                                    onChange={(e) => updateOutcome(editingDialogueIdx, choiceIdx, 'successOutcome', 'moral', parseInt(e.target.value) || 0)}
                                    placeholder="5"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-green-600 mb-1">Illustration (nom fichier)</label>
                                  <input
                                    className="w-full px-2 py-1.5 border border-green-300 rounded text-sm focus:border-green-500 outline-none"
                                    value={choice.diceRoll?.successOutcome?.illustration || ''}
                                    onChange={(e) => updateOutcome(editingDialogueIdx, choiceIdx, 'successOutcome', 'illustration', e.target.value)}
                                    placeholder="parking-success.png"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Failure Outcome */}
                            <div className="border border-red-300 rounded-lg p-3 bg-red-50">
                              <h4 className="text-xs font-bold text-red-700 mb-2">❌ En cas d'echec</h4>
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-red-600 mb-1">Message</label>
                                  <input
                                    className="w-full px-2 py-1.5 border border-red-300 rounded text-sm focus:border-red-500 outline-none"
                                    value={choice.diceRoll?.failureOutcome?.message || ''}
                                    onChange={(e) => updateOutcome(editingDialogueIdx, choiceIdx, 'failureOutcome', 'message', e.target.value)}
                                    placeholder="Ex: Aucune place..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-red-600 mb-1">Impact moral</label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1.5 border border-red-300 rounded text-sm focus:border-red-500 outline-none"
                                    value={choice.diceRoll?.failureOutcome?.moral || 0}
                                    onChange={(e) => updateOutcome(editingDialogueIdx, choiceIdx, 'failureOutcome', 'moral', parseInt(e.target.value) || 0)}
                                    placeholder="-3"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-red-600 mb-1">Illustration (nom fichier)</label>
                                  <input
                                    className="w-full px-2 py-1.5 border border-red-300 rounded text-sm focus:border-red-500 outline-none"
                                    value={choice.diceRoll?.failureOutcome?.illustration || ''}
                                    onChange={(e) => updateOutcome(editingDialogueIdx, choiceIdx, 'failureOutcome', 'illustration', e.target.value)}
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
                            onClick={() => askDeleteChoice(editingDialogueIdx, choiceIdx)}
                            className="px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
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

            {/* Bouton Valider */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setNotification({ type: 'success', message: 'Modifications enregistrées !' });
                  setTimeout(() => setNotification(null), 2000);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                ✓ Valider
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p className="text-sm">← Selectionnez un dialogue pour l'editer</p>
          </div>
        )}
      </div>

      {/* Modal confirmations */}
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

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg animate-fadeIn z-50 ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <p className="font-semibold">{notification.message}</p>
        </div>
      )}
    </div>
  );
}
