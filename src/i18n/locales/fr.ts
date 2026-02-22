/**
 * French Translations (Default)
 */

import type { Translations } from '../types';

export const fr: Translations = {
  gameStats: {
    physique: 'Physique',
    mentale: 'Mentale',
  },

  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    add: 'Ajouter',
    edit: 'Modifier',
    close: 'Fermer',
    confirm: 'Confirmer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succes',
  },

  editor: {
    scenes: 'Scenes',
    dialogues: 'Dialogues',
    characters: 'Personnages',
    assets: 'Assets',
    preview: 'Apercu',
    settings: 'Parametres',
    noScene: 'Aucune scene selectionnee',
    noDialogue: 'Aucun dialogue',
    addScene: 'Ajouter une scene',
    addDialogue: 'Ajouter un dialogue',
    addCharacter: 'Ajouter un personnage',
  },

  dialogueEditor: {
    title: 'Propriétés du dialogue',
    propertiesTab: 'Propriétés',
    choicesTab: 'Choix',
    speaker: 'Personnage',
    text: 'Texte',
    duplicate: 'Dupliquer',
    sfxLabel: 'Effet sonore',
    sfxVolume: 'Volume',
    sfxChange: "Changer l'effet",
    sfxAdd: 'Ajouter un effet sonore',
    moodsLabel: 'Humeurs pour ce dialogue',
    moodDefault: '(défaut de scène)',
    infoLabel: 'Infos',
    noChoices: 'Aucun choix pour ce dialogue',
    noChoicesHint: '« + Ajouter un choix » crée un embranchement',
    addChoice: 'Ajouter un choix',
    editWithAssistant: "Modifier avec l'Assistant",
  },

  graph: {
    startBadge: 'START',
    endBadge: 'FIN',
    startAriaLabel: 'Début du dialogue',
    endAriaLabel: 'Fin du dialogue',
    rowLabel: 'Rangée',
    nextBelow: 'La suite est en dessous',
    flowContinues: 'Suite',
    convergenceLabel: '↩ rejoint',
    choiceAriaLabel: 'Choix : ',
    emptyDialogue: '(Dialogue vide)',
    sceneJumpLabel: 'Saut vers scene',
  },
};
