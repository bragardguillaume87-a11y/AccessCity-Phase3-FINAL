export class InspectorPanel {
  constructor(container, eventBus, charactersData = null, scenesData = null) {
    this.container = container;
    this.eventBus = eventBus;
    this.charactersData = charactersData;
    this.scenesData = scenesData;
    this.currentScene = null;

    if (this.eventBus) {
      this.eventBus.on('scene:select', (scene) => this.editScene(scene));
      this.eventBus.on('scene:create', () => {
        console.log('InspectorPanel received scene:create event');
        try {
          this.createScene();
          console.log('createScene() executed successfully');
        } catch (err) {
          console.error('ERROR in createScene():', err);
        }
      });
    }
  }

  updateScenesData(scenesData) {
      this.scenesData = scenesData;
  }

  update(data) {
    this.container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  createScene() {
    console.log('createScene() is running...');
    const newScene = {
      id: 's' + Date.now(),
      title: '',
      description: '',
      dialogues: []
    };
    this.editScene(newScene, true);
  }

  editScene(scene, isNew = false) {
    this.currentScene = scene;
    
    this.container.innerHTML = `
      <h3>${isNew ? 'Nouvelle Scène' : 'Modifier la Scène'}</h3>
      <div style="margin-bottom: 10px;">
        <label style="display:block; color:#aaa; font-size:0.9em;">Identifiant unique (ex: scene_parc_01)</label>
        <input type="text" id="scene-id" value="${scene.id}" ${isNew ? '' : 'readonly'} style="width:100%; padding:5px;">
      </div>
      <div style="margin-bottom: 10px;">
        <label style="display:block; color:#aaa; font-size:0.9em;">Titre de la scène</label>
        <input type="text" id="scene-title" value="${scene.title || ''}" style="width:100%; padding:5px;">
      </div>
      <div style="margin-bottom: 10px;">
        <label style="display:block; color:#aaa; font-size:0.9em;">Résumé / Notes</label>
        <textarea id="scene-description" rows="3" style="width:100%; padding:5px;">${scene.description || ''}</textarea>
      </div>
      
      <h4 style="border-bottom:1px solid #444; padding-bottom:5px; margin-top:20px;">Déroulement de la scène</h4>
      <div id="dialogues-list">
        ${(scene.dialogues || []).map((d, idx) => this.renderDialogueItem(d, idx)).join('')}
      </div>
      
      <button id="add-dialogue-btn" style="width:100%; padding:8px; margin-top:10px; background:#444;">+ Ajouter une ligne de dialogue</button>
      
      <hr style="border-color:#444; margin:20px 0;">
      
      <!-- Liste des variables suggérées pour l'autocomplétion -->
      <datalist id="variables-list">
        <option value="Moral">
        <option value="Physique">
        <option value="Confiance">
        <option value="Empathie">
        <option value="Autonomie">
      </datalist>

      <div style="display:flex; gap:10px;">
        <button id="save-scene-btn" style="flex:1; padding:10px; background:#007acc;">💾 Sauvegarder</button>
        ${!isNew ? `
            <button id="play-scene-btn" style="flex:1; padding:10px; background-color: #4CAF50; color: white;">▶ Tester la scène</button>
            <button id="delete-scene-btn" style="padding:10px; background-color: #f44336; color: white;">🗑️</button>
        ` : ''}
      </div>
    `;

    this.attachEventListeners(isNew);
  }

  renderDialogueItem(d, idx) {
      const moodOptions = ['neutral', 'happy', 'sad', 'thoughtful', 'angry', 'surprised'].map(m => {
          // Traduction simple des humeurs pour l'affichage
          const labels = {
              'neutral': 'Neutre',
              'happy': 'Joyeux / Souriant',
              'sad': 'Triste',
              'thoughtful': 'Pensif',
              'angry': 'En colère',
              'surprised': 'Surpris'
          };
          return `<option value="${m}" ${d.mood === m ? 'selected' : ''}>${labels[m] || m}</option>`;
      }).join('');

      // Generate Scene Options for Choices
      let sceneOptions = '<option value="">(Fin de la scène)</option>';
      if (this.scenesData && this.scenesData.scenes) {
          sceneOptions += this.scenesData.scenes.map(s => 
              `<option value="${s.id}">${s.title || s.id}</option>`
          ).join('');
      }

      return `
          <div class="dialogue-item" style="border:1px solid #444; padding:10px; margin:10px 0; background:#252526; border-radius:4px;">
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <div style="flex:1;">
                    <label style="font-size:11px; color:#aaa; display:block;">Qui parle ?</label>
                    ${this.renderSpeakerInput(d.speaker, idx)}
                </div>
                <div style="width:140px;">
                    <label style="font-size:11px; color:#aaa; display:block;">Émotion</label>
                    <select data-idx="${idx}" data-field="mood" style="width:100%; padding:4px;">
                        <option value="">(Par défaut)</option>
                        ${moodOptions}
                    </select>
                </div>
            </div>
            
            <div style="margin-bottom:10px;">
                <label style="font-size:11px; color:#aaa; display:block;">Image de fond (Optionnel)</label>
                <input type="text" data-idx="${idx}" data-field="background" value="${d.background || ''}" placeholder="Laissez vide pour garder le fond précédent" style="width:100%; padding:4px; background:#1e1e1e; border:1px solid #333; color:#ddd;">
            </div>

            <div style="margin-bottom:10px;">
                <label style="font-size:11px; color:#aaa; display:block;">Dialogue</label>
                <textarea placeholder="Ce que dit le personnage..." rows="3" data-idx="${idx}" data-field="text" style="width:100%; padding:8px; background:#1e1e1e; border:1px solid #333; color:#fff;">${d.text || ''}</textarea>
            </div>
            
            <!-- Choices Section -->
            <div style="margin-top:10px; padding:10px; background:#333; border-radius:4px;">
                <label style="font-size:12px; font-weight:bold; color:#ddd;">Choix offerts au joueur (${(d.choices || []).length})</label>
                <div id="choices-list-${idx}">
                    ${(d.choices || []).map((c, cIdx) => `
                        <div style="margin-top:8px; padding:8px; background:#2a2a2a; border:1px solid #444; border-radius:4px;">
                            <div style="display:flex; gap:5px; margin-bottom:5px;">
                                <input type="text" value="${c.text}" placeholder="Texte du bouton (ex: Ouvrir la porte)" class="choice-text" data-d-idx="${idx}" data-c-idx="${cIdx}" style="flex:1; padding:4px;">
                                
                                <!-- Target Scene Dropdown -->
                                <select class="choice-target" data-d-idx="${idx}" data-c-idx="${cIdx}" style="width:180px; padding:4px;">
                                    <option value="">(Fin de la scène)</option>
                                    ${this.scenesData && this.scenesData.scenes ? this.scenesData.scenes.map(s => 
                                        `<option value="${s.id}" ${c.targetScene === s.id ? 'selected' : ''}>Aller à : ${s.title || s.id}</option>`
                                    ).join('') : `<option value="${c.targetScene}">${c.targetScene}</option>`}
                                </select>

                                <button class="delete-choice-btn" data-d-idx="${idx}" data-c-idx="${cIdx}" style="background:#a33; color:white; border:none; width:24px;">x</button>
                            </div>
                        <!-- Human Readable Effect Editor -->
                        <div style="font-size:11px; margin-left:10px; margin-top:4px; padding:4px; background:#222; border-radius:4px; display:flex; align-items:center; gap:5px;">
                            <span style="color:#aaa; width:60px;">Conséquence:</span>
                            <select class="choice-eff-op" data-d-idx="${idx}" data-c-idx="${cIdx}" style="width:80px;">
                                <option value="add" ${c.effects?.[0]?.operation === 'add' ? 'selected' : ''}>Ajouter</option>
                                <option value="set" ${c.effects?.[0]?.operation === 'set' ? 'selected' : ''}>Définir à</option>
                                <option value="random" ${c.effects?.[0]?.operation === 'random' ? 'selected' : ''}>Aléatoire</option>
                            </select>
                            <input type="number" placeholder="0" value="${c.effects?.[0]?.value ?? ''}" class="choice-eff-val" data-d-idx="${idx}" data-c-idx="${cIdx}" style="width:50px;">
                            <span>à</span>
                            <input type="text" list="variables-list" placeholder="Statistique (ex: Moral)" value="${c.effects?.[0]?.variable || ''}" class="choice-eff-var" data-d-idx="${idx}" data-c-idx="${cIdx}" style="width:100px;">
                        </div>

                        <!-- Human Readable Condition Editor -->
                        <div style="font-size:11px; margin-left:10px; margin-top:2px; padding:4px; background:#222; border-radius:4px; display:flex; align-items:center; gap:5px;">
                            <span style="color:#aaa; width:60px;">Condition:</span>
                            <span>Si</span>
                            <input type="text" list="variables-list" placeholder="Statistique" value="${c.conditions?.[0]?.variable || ''}" class="choice-cond-var" data-d-idx="${idx}" data-c-idx="${cIdx}" style="width:100px;">
                            <select class="choice-cond-op" data-d-idx="${idx}" data-c-idx="${cIdx}" style="width:110px;">
                                <option value=">" ${c.conditions?.[0]?.operator === '>' ? 'selected' : ''}>est supérieur à</option>
                                <option value="<" ${c.conditions?.[0]?.operator === '<' ? 'selected' : ''}>est inférieur à</option>
                                <option value="==" ${c.conditions?.[0]?.operator === '==' ? 'selected' : ''}>est égal à</option>
                                <option value=">=" ${c.conditions?.[0]?.operator === '>=' ? 'selected' : ''}>est sup. ou égal</option>
                                <option value="<=" ${c.conditions?.[0]?.operator === '<=' ? 'selected' : ''}>est inf. ou égal</option>
                                <option value="!=" ${c.conditions?.[0]?.operator === '!=' ? 'selected' : ''}>est différent de</option>
                            </select>
                            <input type="number" placeholder="0" value="${c.conditions?.[0]?.value ?? ''}" class="choice-cond-val" data-d-idx="${idx}" data-c-idx="${cIdx}" style="width:50px;">
                        </div>
                    `).join('')}
                </div>
                <button class="add-choice-btn" data-idx="${idx}" style="font-size:11px; margin-top:5px; padding:4px 8px; background:#444; border:none; color:white;">+ Ajouter un choix</button>
            </div>

            <div style="text-align:right; margin-top:5px;">
                <button class="delete-dialogue-btn" data-idx="${idx}" style="background:#a33; color:white; border:none; padding:5px 10px;">Supprimer ce dialogue</button>
            </div>
          </div>
      `;
  }


  renderSpeakerInput(currentSpeaker, idx) {
    if (!this.charactersData || !this.charactersData.characters) {
      return `<input type="text" placeholder="Nom du personnage" value="${currentSpeaker}" data-idx="${idx}" data-field="speaker">`;
    }

    const options = this.charactersData.characters.map(char => 
      `<option value="${char.id}" ${char.id === currentSpeaker ? 'selected' : ''}>${char.name}</option>`
    ).join('');

    // Add option for custom speaker if not in list
    const isCustom = currentSpeaker && !this.charactersData.characters.find(c => c.id === currentSpeaker);
    if (isCustom) {
        return `
            <select data-idx="${idx}" data-field="speaker" style="width:100%; padding:4px;">
                <option value="">-- Choisir un personnage --</option>
                ${options}
                <option value="${currentSpeaker}" selected>${currentSpeaker} (Inconnu)</option>
            </select>
        `;
    }

    return `
      <select data-idx="${idx}" data-field="speaker" style="width:100%; padding:4px;">
        <option value="">-- Choisir un personnage --</option>
        ${options}
      </select>
    `;
  }

  attachEventListeners(isNew) {
    const saveBtn = this.container.querySelector('#save-scene-btn');
    const deleteBtn = this.container.querySelector('#delete-scene-btn');
    const playBtn = this.container.querySelector('#play-scene-btn');
    const addDialogueBtn = this.container.querySelector('#add-dialogue-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const updatedScene = this.collectSceneData();
        this.eventBus.emit(isNew ? 'scene:add' : 'scene:update', updatedScene);
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        // On récupère les données actuelles du formulaire pour jouer la version "live"
        const sceneToPlay = this.collectSceneData();
        this.eventBus.emit('director:play_scene', sceneToPlay);
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete scene "${this.currentScene.title}"?`)) {
          this.eventBus.emit('scene:delete', this.currentScene.id);
        }
      });
    }

    if (addDialogueBtn) {
      addDialogueBtn.addEventListener('click', () => {
        const currentData = this.collectSceneData();
        currentData.dialogues.push({ speaker: 'player', text: '', mood: 'neutral' });
        this.editScene(currentData, isNew);
      });
    }

    // Event delegation for dynamic elements inside dialogues
    const dialoguesList = this.container.querySelector('#dialogues-list');
    if (dialoguesList) {
        dialoguesList.addEventListener('click', (e) => {
            const target = e.target;
            
            // Delete Dialogue
            if (target.classList.contains('delete-dialogue-btn')) {
                const idx = parseInt(target.getAttribute('data-idx'));
                const currentData = this.collectSceneData();
                currentData.dialogues.splice(idx, 1);
                this.editScene(currentData, isNew);
            }
            
            // Add Choice
            if (target.classList.contains('add-choice-btn')) {
                const idx = parseInt(target.getAttribute('data-idx'));
                const currentData = this.collectSceneData();
                if (!currentData.dialogues[idx].choices) currentData.dialogues[idx].choices = [];
                currentData.dialogues[idx].choices.push({ text: 'Next', targetScene: '' });
                this.editScene(currentData, isNew);
            }

            // Delete Choice
            if (target.classList.contains('delete-choice-btn')) {
                const dIdx = parseInt(target.getAttribute('data-d-idx'));
                const cIdx = parseInt(target.getAttribute('data-c-idx'));
                const currentData = this.collectSceneData();
                if (currentData.dialogues[dIdx].choices) {
                    currentData.dialogues[dIdx].choices.splice(cIdx, 1);
                    this.editScene(currentData, isNew);
                }
            }
        });
    }
  }

  collectSceneData() {
    const idInput = this.container.querySelector('#scene-id');
    const titleInput = this.container.querySelector('#scene-title');
    const descInput = this.container.querySelector('#scene-description');

    const id = idInput ? idInput.value : this.currentScene.id;
    const title = titleInput ? titleInput.value : '';
    const description = descInput ? descInput.value : '';

    const dialogues = [];
    const dialogueItems = this.container.querySelectorAll('.dialogue-item');
    
    dialogueItems.forEach((item, idx) => {
        const speakerInput = item.querySelector(`[data-field="speaker"]`);
        const moodInput = item.querySelector(`[data-field="mood"]`);
        const bgInput = item.querySelector(`[data-field="background"]`);
        const textInput = item.querySelector(`[data-field="text"]`);

        const speaker = speakerInput ? speakerInput.value : '';
        const mood = moodInput ? moodInput.value : 'neutral';
        const background = bgInput ? bgInput.value : '';
        const text = textInput ? textInput.value : '';
        
        const choices = [];
        const choiceTexts = item.querySelectorAll('.choice-text');
        const choiceTargets = item.querySelectorAll('.choice-target');
        const choiceEffVars = item.querySelectorAll('.choice-eff-var');
        const choiceEffOps = item.querySelectorAll('.choice-eff-op');
        const choiceEffVals = item.querySelectorAll('.choice-eff-val');
        
        const choiceCondVars = item.querySelectorAll('.choice-cond-var');
        const choiceCondOps = item.querySelectorAll('.choice-cond-op');
        const choiceCondVals = item.querySelectorAll('.choice-cond-val');

        choiceTexts.forEach((ct, cIdx) => {
            const choice = {
                text: ct.value,
                targetScene: choiceTargets[cIdx].value
            };
            
            const effVar = choiceEffVars[cIdx] ? choiceEffVars[cIdx].value : '';
            if (effVar) {
                choice.effects = [{
                    variable: effVar,
                    operation: choiceEffOps[cIdx].value,
                    value: choiceEffVals[cIdx].value
                }];
            }

            const condVar = choiceCondVars[cIdx] ? choiceCondVars[cIdx].value : '';
            if (condVar) {
                choice.conditions = [{
                    variable: condVar,
                    operator: choiceCondOps[cIdx].value,
                    value: choiceCondVals[cIdx].value
                }];
            }
            
            choices.push(choice);
        });

        dialogues.push({
            speaker,
            mood,
            background,
            text,
            choices
        });
    });

    return { id, title, description, dialogues };
  }
}
