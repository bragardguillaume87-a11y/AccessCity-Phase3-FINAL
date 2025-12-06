export const sampleScenes = {
  scenes: [{id: 'intro', title: 'Introduction', description: 'Welcome to AccessCity', dialogues: [{speaker: 'Guide', text: 'Welcome to the city!'}]}]
};

export const sampleUiLayout = {
  version: '2.0.0',
  defaultLayout: 'standard',
  layouts: {
    standard: {
      description: 'Fallback layout used when ui_layout.json is missing',
      panels: [
        {id: 'scene-list', visible: true, position: 'left', width: 240},
        {id: 'inspector', visible: true, position: 'center', flex: 1},
        {id: 'devtools', visible: false, position: 'right', width: 320},
        {id: 'dialogues', visible: false, position: 'bottom', height: 220}
      ]
    }
  }
};

export const sampleCharacters = {
  version: '1.0.0',
  characters: [
    {
      id: 'player',
      name: 'Player',
      description: 'Main character used for onboarding',
      sprites: {
        neutral: 'assets/characters/player/neutral.png'
      },
      moods: ['neutral', 'happy', 'concerned']
    },
    {
      id: 'counsellor',
      name: 'Counsellor',
      description: 'Municipal counsellor focused on accessibility',
      sprites: {
        neutral: 'assets/characters/counsellor/neutral.png'
      },
      moods: ['neutral', 'professional']
    },
    {
      id: 'narrator',
      name: 'Narrator',
      description: 'Voice that guides the player through the scenario',
      sprites: {},
      moods: ['neutral']
    }
  ]
};