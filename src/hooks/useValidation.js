import { useMemo } from 'react';
import { useScenesStore, useCharactersStore, useSettingsStore } from '../stores/index.js';

/**
 * Hook de validation en temps reel pour l'editeur
 * Retourne des erreurs organisees par type et par ID
 */
export function useValidation() {
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);
  const variables = useSettingsStore(state => state.variables);

  const validation = useMemo(() => {
    const errors = {
      scenes: {},      // { sceneId: [{ field, message, severity }] }
      dialogues: {},   // { `${sceneId}-${dialogueIdx}`: [errors] }
      choices: {},     // { `${sceneId}-${dialogueIdx}-${choiceIdx}`: [errors] }
      characters: {},  // { characterId: [errors] }
      variables: {},   // { variableName: [errors] }
      global: []       // Erreurs globales
    };

    let totalErrors = 0;
    let totalWarnings = 0;

    // Validation des scenes
    const sceneIds = new Set();
    scenes.forEach((scene) => {
      const sceneErrors = [];

      // ID vide
      if (!scene.id || scene.id.trim() === '') {
        sceneErrors.push({ field: 'id', message: 'ID manquant', severity: 'error' });
        totalErrors++;
      } else {
        // ID duplique
        if (sceneIds.has(scene.id)) {
          sceneErrors.push({ field: 'id', message: 'ID duplique', severity: 'error' });
          totalErrors++;
        }
        sceneIds.add(scene.id);
      }

      // Titre vide
      if (!scene.title || scene.title.trim() === '') {
        sceneErrors.push({ field: 'title', message: 'Titre manquant', severity: 'warning' });
        totalWarnings++;
      }

      // Aucun dialogue
      if (!scene.dialogues || scene.dialogues.length === 0) {
        sceneErrors.push({ field: 'dialogues', message: 'Aucun dialogue', severity: 'warning' });
        totalWarnings++;
      }

      if (sceneErrors.length > 0) {
        errors.scenes[scene.id] = sceneErrors;
      }

      // Validation des dialogues
      (scene.dialogues || []).forEach((dialogue, dIdx) => {
        const dialogueErrors = [];
        const dialogueKey = `${scene.id}-${dIdx}`;

        // Speaker vide
        if (!dialogue.speaker || dialogue.speaker.trim() === '') {
          dialogueErrors.push({ field: 'speaker', message: 'Locuteur manquant', severity: 'error' });
          totalErrors++;
        } else {
          // Speaker n'existe pas dans characters
          const speakerExists = characters.some(c => c.id === dialogue.speaker);
          if (!speakerExists) {
            dialogueErrors.push({ field: 'speaker', message: 'Personnage inexistant', severity: 'warning' });
            totalWarnings++;
          }
        }

        // Texte vide
        if (!dialogue.text || dialogue.text.trim() === '') {
          dialogueErrors.push({ field: 'text', message: 'Texte manquant', severity: 'error' });
          totalErrors++;
        }

        if (dialogueErrors.length > 0) {
          errors.dialogues[dialogueKey] = dialogueErrors;
        }

        // Validation des choix
        (dialogue.choices || []).forEach((choice, cIdx) => {
          const choiceErrors = [];
          const choiceKey = `${scene.id}-${dIdx}-${cIdx}`;

          // Texte du choix vide
          if (!choice.text || choice.text.trim() === '') {
            choiceErrors.push({ field: 'text', message: 'Texte du choix manquant', severity: 'error' });
            totalErrors++;
          }

          // Si lancer de de desactive, nextScene doit etre defini
          if (!choice.diceRoll?.enabled) {
            if (!choice.nextScene || choice.nextScene.trim() === '') {
              choiceErrors.push({ field: 'nextScene', message: 'Scene suivante manquante', severity: 'warning' });
              totalWarnings++;
            } else {
              // Verifier que la scene existe
              const sceneExists = scenes.some(s => s.id === choice.nextScene);
              if (!sceneExists) {
                choiceErrors.push({ field: 'nextScene', message: 'Scene inexistante', severity: 'error' });
                totalErrors++;
              }
            }
          }

          // Validation du lancer de de
          if (choice.diceRoll?.enabled) {
            const difficulty = choice.diceRoll.difficulty;
            if (difficulty < 1 || difficulty > 20) {
              choiceErrors.push({ field: 'difficulty', message: 'Difficulte invalide (1-20)', severity: 'error' });
              totalErrors++;
            }

            // Success outcome
            if (!choice.diceRoll.successOutcome?.message?.trim()) {
              choiceErrors.push({ field: 'successMessage', message: 'Message de reussite manquant', severity: 'warning' });
              totalWarnings++;
            }

            // Failure outcome
            if (!choice.diceRoll.failureOutcome?.message?.trim()) {
              choiceErrors.push({ field: 'failureMessage', message: 'Message d\'echec manquant', severity: 'warning' });
              totalWarnings++;
            }
          }

          if (choiceErrors.length > 0) {
            errors.choices[choiceKey] = choiceErrors;
          }
        });
      });
    });

    // Validation des personnages
    characters.forEach((character) => {
      const charErrors = [];

      // Nom vide
      if (!character.name || character.name.trim() === '') {
        charErrors.push({ field: 'name', message: 'Nom manquant', severity: 'error' });
        totalErrors++;
      }

      // Aucun sprite
      if (!character.sprites || Object.keys(character.sprites).length === 0) {
        charErrors.push({ field: 'sprites', message: 'Aucun sprite defini', severity: 'warning' });
        totalWarnings++;
      }

      if (charErrors.length > 0) {
        errors.characters[character.id] = charErrors;
      }
    });

    // Validation des variables
    Object.entries(variables).forEach(([name, value]) => {
      const varErrors = [];

      // Valeur hors limites
      if (typeof value === 'number' && (value < 0 || value > 100)) {
        varErrors.push({ field: 'value', message: 'Valeur hors limites (0-100)', severity: 'warning' });
        totalWarnings++;
      }

      if (varErrors.length > 0) {
        errors.variables[name] = varErrors;
      }
    });

    return {
      errors,
      totalErrors,
      totalWarnings,
      isValid: totalErrors === 0,
      hasIssues: totalErrors > 0 || totalWarnings > 0
    };
  }, [scenes, characters, variables]);

  return validation;
}
