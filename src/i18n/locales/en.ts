/**
 * English Translations
 */

import type { Translations } from '../types';

export const en: Translations = {
  gameStats: {
    physique: 'Physical',
    mentale: 'Mental',
  },

  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },

  editor: {
    scenes: 'Scenes',
    dialogues: 'Dialogues',
    characters: 'Characters',
    assets: 'Assets',
    preview: 'Preview',
    settings: 'Settings',
    noScene: 'No scene selected',
    noDialogue: 'No dialogue',
    addScene: 'Add scene',
    addDialogue: 'Add dialogue',
    addCharacter: 'Add character',
  },

  dialogueEditor: {
    title: 'Dialogue Properties',
    propertiesTab: 'Properties',
    choicesTab: 'Choices',
    speaker: 'Speaker',
    text: 'Text',
    duplicate: 'Duplicate',
    sfxLabel: 'Sound Effect',
    sfxVolume: 'Volume',
    sfxChange: 'Change effect',
    sfxAdd: 'Add a sound effect',
    moodsLabel: 'Moods for this dialogue',
    moodDefault: '(scene default)',
    infoLabel: 'Info',
    noChoices: 'No choices for this dialogue',
    noChoicesHint: '"+ Add choice" creates a branch',
    addChoice: 'Add choice',
    editWithAssistant: 'Edit with Assistant',
  },

  graph: {
    startBadge: 'START',
    endBadge: 'END',
    startAriaLabel: 'Start of dialogue',
    endAriaLabel: 'End of dialogue',
    rowLabel: 'Row',
    nextBelow: 'Continues below',
    flowContinues: 'Next',
    convergenceLabel: '↩ joins',
    choiceAriaLabel: 'Choice: ',
    emptyDialogue: '(Empty dialogue)',
    sceneJumpLabel: 'Jump to scene',
  },
};
