/**
 * Utilities for exporting scenarios in various formats
 */

/**
 * Validates the scenario structure
 * @param {Object} data - The scenario data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateScenario(data) {
  const errors = [];

  if (!data) {
    errors.push('No data provided');
    return { valid: false, errors };
  }

  if (!data.scenes || !Array.isArray(data.scenes)) {
    errors.push('Missing or invalid scenes array');
  } else if (data.scenes.length === 0) {
    errors.push('No scenes defined');
  }

  if (!data.characters || !Array.isArray(data.characters)) {
    errors.push('Missing or invalid characters array');
  }

  // Validate scenes structure
  data.scenes?.forEach((scene, index) => {
    if (!scene.id) errors.push(`Scene ${index} missing id`);
    if (!scene.title) errors.push(`Scene ${index} missing title`);
    if (!scene.dialogues || !Array.isArray(scene.dialogues)) {
      errors.push(`Scene ${index} missing dialogues array`);
    }
  });

  // Validate characters
  data.characters?.forEach((char, index) => {
    if (!char.id) errors.push(`Character ${index} missing id`);
    if (!char.name) errors.push(`Character ${index} missing name`);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Exports scenario to JSON format
 * @param {Object} data - The scenario data
 * @returns {string} - JSON string
 */
export function exportToJSON(data) {
  const validation = validateScenario(data);
  if (!validation.valid) {
    throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Downloads a file to the user's computer
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} mimeType - MIME type of the file
 */
function downloadFile(content, filename, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports scenario to standalone HTML file
 * @param {Object} data - The scenario data
 * @returns {string} - HTML string
 */
export function exportToHTMLStandalone(data) {
  const validation = validateScenario(data);
  if (!validation.valid) {
    throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
  }

  const scenarioJSON = JSON.stringify(data, null, 2);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.context?.title || 'AccessCity Scenario'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 800px;
      width: 100%;
      padding: 40px;
    }
    h1 { color: #333; margin-bottom: 10px; font-size: 2rem; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .scene-title { color: #667eea; font-size: 1.5rem; margin-bottom: 20px; }
    .dialogue { background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .speaker { color: #667eea; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; font-size: 0.9rem; }
    .text { line-height: 1.6; color: #333; margin-bottom: 15px; }
    .choices { display: flex; flex-direction: column; gap: 10px; }
    .choice {
      background: #667eea;
      color: white;
      padding: 15px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .choice:hover { background: #5568d3; transform: translateY(-2px); }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat {
      background: #f7fafc;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-label { color: #666; font-size: 0.9rem; margin-bottom: 5px; }
    .stat-value { color: #667eea; font-size: 1.5rem; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="title">${data.context?.title || 'AccessCity'}</h1>
    <p class="subtitle" id="subtitle">${data.context?.description || ''}</p>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Physique</div>
        <div class="stat-value" id="stat-physique">0</div>
      </div>
      <div class="stat">
        <div class="stat-label">Mentale</div>
        <div class="stat-value" id="stat-mentale">0</div>
      </div>
      <div class="stat">
        <div class="stat-label">Sociale</div>
        <div class="stat-value" id="stat-sociale">0</div>
      </div>
    </div>

    <div id="game-content"></div>
  </div>

  <script>
    const scenario = ${scenarioJSON};

    let currentSceneId = scenario.scenes[0]?.id;
    let currentDialogueIndex = 0;
    let stats = { physique: 0, mentale: 0, sociale: 0 };

    function updateStats() {
      document.getElementById('stat-physique').textContent = stats.physique;
      document.getElementById('stat-mentale').textContent = stats.mentale;
      document.getElementById('stat-sociale').textContent = stats.sociale;
    }

    function renderScene() {
      const scene = scenario.scenes.find(s => s.id === currentSceneId);
      if (!scene) {
        document.getElementById('game-content').innerHTML = '<p>Fin du scénario</p>';
        return;
      }

      const dialogue = scene.dialogues[currentDialogueIndex];
      if (!dialogue) {
        document.getElementById('game-content').innerHTML = '<p>Scène terminée</p>';
        return;
      }

      let html = '<div class="dialogue">';
      html += \`<h2 class="scene-title">\${scene.title}</h2>\`;

      if (dialogue.speaker) {
        const speaker = scenario.characters.find(c => c.id === dialogue.speaker);
        html += \`<div class="speaker">\${speaker?.name || dialogue.speaker}</div>\`;
      }

      html += \`<div class="text">\${dialogue.text || ''}</div>\`;

      if (dialogue.choices && dialogue.choices.length > 0) {
        html += '<div class="choices">';
        dialogue.choices.forEach((choice, index) => {
          html += \`<button class="choice" onclick="handleChoice(\${index})">\${choice.label}</button>\`;
        });
        html += '</div>';
      } else {
        html += '<button class="choice" onclick="nextDialogue()">Continuer</button>';
      }

      html += '</div>';
      document.getElementById('game-content').innerHTML = html;
    }

    function handleChoice(index) {
      const scene = scenario.scenes.find(s => s.id === currentSceneId);
      const dialogue = scene.dialogues[currentDialogueIndex];
      const choice = dialogue.choices[index];

      if (choice.statsDelta) {
        stats.physique += choice.statsDelta.physique || 0;
        stats.mentale += choice.statsDelta.mentale || 0;
        stats.sociale += choice.statsDelta.sociale || 0;
        updateStats();
      }

      if (choice.nextSceneId) {
        currentSceneId = choice.nextSceneId;
        currentDialogueIndex = 0;
      } else if (choice.nextDialogueId) {
        const nextIndex = scene.dialogues.findIndex(d => d.id === choice.nextDialogueId);
        currentDialogueIndex = nextIndex >= 0 ? nextIndex : currentDialogueIndex + 1;
      } else {
        currentDialogueIndex++;
      }

      renderScene();
    }

    function nextDialogue() {
      currentDialogueIndex++;
      renderScene();
    }

    // Initialize
    updateStats();
    renderScene();
  </script>
</body>
</html>`;
}

/**
 * Exports scenario to Phaser game engine format
 * @param {Object} data - The scenario data
 * @returns {string} - JavaScript code for Phaser
 */
export function exportToPhaser(data) {
  const validation = validateScenario(data);
  if (!validation.valid) {
    throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
  }

  const scenarioJSON = JSON.stringify(data, null, 2);

  return `// AccessCity Scenario for Phaser 3
// Generated on ${new Date().toISOString()}

const scenario = ${scenarioJSON};

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.currentSceneId = null;
    this.currentDialogueIndex = 0;
    this.stats = { physique: 0, mentale: 0, sociale: 0 };
  }

  preload() {
    // Load character sprites
    scenario.characters.forEach(char => {
      if (char.sprites) {
        Object.entries(char.sprites).forEach(([mood, url]) => {
          if (url) {
            this.load.image(\`\${char.id}_\${mood}\`, url);
          }
        });
      }
    });

    // Load background images if any
    scenario.scenes.forEach(scene => {
      if (scene.background) {
        this.load.image(\`bg_\${scene.id}\`, scene.background);
      }
    });
  }

  create() {
    this.currentSceneId = scenario.scenes[0]?.id;
    this.renderScene();
  }

  renderScene() {
    this.children.removeAll();

    const scene = scenario.scenes.find(s => s.id === this.currentSceneId);
    if (!scene) {
      this.add.text(400, 300, 'Fin du scénario', {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5);
      return;
    }

    // Background
    if (scene.background) {
      this.add.image(400, 300, \`bg_\${scene.id}\`);
    } else {
      this.cameras.main.setBackgroundColor('#2c3e50');
    }

    // Title
    this.add.text(400, 50, scene.title, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Dialogue
    const dialogue = scene.dialogues[this.currentDialogueIndex];
    if (!dialogue) return;

    if (dialogue.speaker) {
      const speaker = scenario.characters.find(c => c.id === dialogue.speaker);
      this.add.text(100, 150, speaker?.name || dialogue.speaker, {
        fontSize: '20px',
        color: '#3498db'
      });
    }

    this.add.text(400, 250, dialogue.text || '', {
      fontSize: '18px',
      color: '#ffffff',
      wordWrap: { width: 600 }
    }).setOrigin(0.5);

    // Choices
    if (dialogue.choices && dialogue.choices.length > 0) {
      dialogue.choices.forEach((choice, index) => {
        const button = this.add.text(400, 400 + (index * 60), choice.label, {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#3498db',
          padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        button.on('pointerdown', () => this.handleChoice(choice));
        button.on('pointerover', () => button.setStyle({ backgroundColor: '#2980b9' }));
        button.on('pointerout', () => button.setStyle({ backgroundColor: '#3498db' }));
      });
    }

    // Stats display
    this.add.text(50, 550, \`Physique: \${this.stats.physique}\`, { fontSize: '14px', color: '#ffffff' });
    this.add.text(250, 550, \`Mentale: \${this.stats.mentale}\`, { fontSize: '14px', color: '#ffffff' });
    this.add.text(450, 550, \`Sociale: \${this.stats.sociale}\`, { fontSize: '14px', color: '#ffffff' });
  }

  handleChoice(choice) {
    if (choice.statsDelta) {
      this.stats.physique += choice.statsDelta.physique || 0;
      this.stats.mentale += choice.statsDelta.mentale || 0;
      this.stats.sociale += choice.statsDelta.sociale || 0;
    }

    if (choice.nextSceneId) {
      this.currentSceneId = choice.nextSceneId;
      this.currentDialogueIndex = 0;
    } else {
      this.currentDialogueIndex++;
    }

    this.renderScene();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: GameScene,
  backgroundColor: '#2c3e50'
};

const game = new Phaser.Game(config);
`;
}

/**
 * Helper to trigger download of exported content
 */
export function downloadExport(data, format = 'json') {
  let content, filename, mimeType;

  switch (format) {
    case 'json':
      content = exportToJSON(data);
      filename = `${data.context?.title || 'scenario'}.json`;
      mimeType = 'application/json';
      break;

    case 'html':
      content = exportToHTMLStandalone(data);
      filename = `${data.context?.title || 'scenario'}.html`;
      mimeType = 'text/html';
      break;

    case 'phaser':
      content = exportToPhaser(data);
      filename = `${data.context?.title || 'scenario'}_phaser.js`;
      mimeType = 'text/javascript';
      break;

    default:
      throw new Error(`Unknown export format: ${format}`);
  }

  downloadFile(content, filename, mimeType);
}
