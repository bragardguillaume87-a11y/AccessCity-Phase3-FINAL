import { EventBus } from './eventBus.js';
import { SceneList } from '../ui/SceneList.js';
import { InspectorPanel } from '../ui/InspectorPanel.js';
import { DevToolsPanel } from '../ui/DevToolsPanel.js';
import { DialogueList } from '../ui/DialogueList.js';
import { loadScenesFromJson } from './jsonSceneLoader.js';
import { loadUiLayoutFromJson } from './uiLayoutLoader.js';
import { UIManager } from './uiManager.js';
import { StateJournal } from './stateJournal.js';
import { VariableManager } from './variableManager.js';
import { loadCharactersFromJson } from './characterLoader.js';
import { DialogueEngine } from './DialogueEngine.js';
import { StageDirector } from '../ui/StageDirector.js';
import { CharacterEditor } from '../ui/CharacterEditor.js';
import { VERSION } from './constants.js';
import { getLayoutProfile } from './layoutProfiles.js';

class AccessCityApp {
    constructor() {
        this.eventBus = new EventBus();
        this.components = {};
        this.scenesData = null;
        this.uiLayoutData = null;
        this.charactersData = null;
        this.uiManager = new UIManager(document.getElementById('app'));
        this.activeLayoutName = null;
        this.layoutSelectorElement = null;
        this.layoutSelectorInitialized = false;
        this.layoutBeforePlay = null;
        this.journal = new StateJournal();
        this.variableManager = new VariableManager(this.eventBus);
        this.dialogueEngine = new DialogueEngine(this.variableManager, this.eventBus);
        this.stageDirector = new StageDirector(this.eventBus);
    }

    saveToLocalStorage() {
        if (this.uiLayoutData && this.activeLayoutName) {
            this.uiLayoutData.activeLayout = this.activeLayoutName;
        }

        const data = {
            scenes: this.scenesData,
            characters: this.charactersData,
            uiLayout: this.uiLayoutData,
            timestamp: Date.now()
        };
        localStorage.setItem('accessCityData', JSON.stringify(data));
        console.log('💾 Data saved to localStorage');
    }

    loadFromLocalStorage() {
        const raw = localStorage.getItem('accessCityData');
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            console.log('📂 Loaded data from localStorage (Timestamp:', new Date(data.timestamp).toLocaleString(), ')');
            return data;
        } catch (e) {
            console.error('Failed to parse localStorage data', e);
            return null;
        }
    }

    async loadData() {
        console.log('📂 Loading data files...');
        
        try {
            const schemasResponse = await fetch('data/schemas.json');
            const schemas = await schemasResponse.json();
            
            // Try loading from LocalStorage first
            const localData = this.loadFromLocalStorage();

            if (localData) {
                this.scenesData = localData.scenes;
                this.uiLayoutData = this.normalizeUiLayoutData(localData.uiLayout);
                this.charactersData = localData.characters;
                console.log('✅ Data restored from LocalStorage');
            } else {
                // Fallback to JSON files
                this.scenesData = await loadScenesFromJson('data/scenes.json', schemas.scenes);
                const rawLayout = await loadUiLayoutFromJson('data/ui_layout.json', schemas.uiLayout);
                this.uiLayoutData = this.normalizeUiLayoutData(rawLayout);
                this.charactersData = await loadCharactersFromJson('data/characters.json', schemas.characters);
                console.log('✅ Data loaded from JSON files');
            }

            this.syncActiveLayout();
            
            return true;
        } catch (err) {
            console.error('❌ Critical error loading data:', err);
            return false;
        }
    }

    async init() {
        console.log(`🚀 AccessCity ${VERSION} is starting...`);

        // Initialize core variables
        this.variableManager.define('Empathie', 'number', 50, 0, 100);
        this.variableManager.define('Autonomie', 'number', 50, 0, 100);
        this.variableManager.define('Confiance', 'number', 50, 0, 100);
        this.variableManager.define('Moral', 'number', 50, 0, 100);
        this.variableManager.define('Physique', 'number', 50, 0, 100);
        this.variableManager.define('parking_luck', 'number', 0, 0, 100);

        const dataLoaded = await this.loadData();
        if (!dataLoaded) {
            console.error('❌ Failed to initialize app');
            return;
        }

        // Pass loaded data to StageDirector
        this.stageDirector.setCharactersData(this.charactersData);

        const sceneListContainer = document.getElementById('scene-list');
        const inspectorContainer = document.getElementById('inspector');
        const devToolsContainer = document.getElementById('devtools');
        const dialogueContainer = document.getElementById('dialogues');

        if (!sceneListContainer || !inspectorContainer) {
            console.error('❌ HTML containers not found!');
            return;
        }

        this.components.sceneList = new SceneList(sceneListContainer, this.eventBus);
        this.components.inspector = new InspectorPanel(inspectorContainer, this.eventBus, this.charactersData, this.scenesData);
        
        if (devToolsContainer) {
            this.components.devtools = new DevToolsPanel(devToolsContainer, this.eventBus, this.variableManager);
        }
        
        if (dialogueContainer) {
            this.components.dialogues = new DialogueList(dialogueContainer, this.eventBus);
        }

        // Initialize Character Editor
        const charEditorContainer = document.getElementById('view-characters');
        if (charEditorContainer) {
            this.components.characterEditor = new CharacterEditor(charEditorContainer, this.eventBus, this.charactersData);
        }

        this.setupNavigation();
        this.setupEventHandlers();
        this.setupExportImport();
        this.setupPlayMode(); // New
        this.initializeLayoutSystem();

        if (this.scenesData && this.scenesData.scenes) {
            this.components.sceneList.render(this.scenesData.scenes);
        }

        console.log('✅ Interface activated!');
    }

    setupNavigation() {
        const navScenes = document.getElementById('nav-scenes');
        const navChars = document.getElementById('nav-characters');
        const viewScenes = document.getElementById('view-scenes');
        const viewChars = document.getElementById('view-characters');

        if (navScenes && navChars && viewScenes && viewChars) {
            navScenes.onclick = () => {
                navScenes.classList.add('active');
                navChars.classList.remove('active');
                viewScenes.classList.add('active');
                viewChars.classList.remove('active');
            };

            navChars.onclick = () => {
                navChars.classList.add('active');
                navScenes.classList.remove('active');
                viewChars.classList.add('active');
                viewScenes.classList.remove('active');
            };
        }
    }

    setupExportImport() {
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const importFile = document.getElementById('import-file');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportProject());
        }

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.importProject(file);
            });
        }
    }

    setupPlayMode() {
        // Écouter les choix du joueur et les transmettre au moteur
        this.eventBus.on('player:choice_selected', (choice) => {
            this.dialogueEngine.selectChoice(choice);
        });

        // Gestion de la touche Échap (déjà gérée par StageDirector, mais on garde pour cohérence)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.stageDirector.isPlaying) {
                this.eventBus.emit('director:stop');
                this.dialogueEngine.endScene();
            }
        });

        // Gérer les changements de scène demandés par le moteur
        this.eventBus.on('engine:scene_change_request', (targetSceneId) => {
            const targetScene = this.scenesData.scenes.find(s => s.id === targetSceneId);
            if (targetScene) {
                console.log(`🔄 Changement de scène vers: ${targetSceneId}`);
                this.dialogueEngine.startScene(targetScene);
            } else {
                console.warn(`⚠️ Scène cible introuvable: ${targetSceneId}`);
                this.eventBus.emit('director:stop');
            }
        });
    }

    exportProject() {
        const exportData = {
            version: VERSION,
            exportDate: new Date().toISOString(),
            scenes: this.scenesData,
            characters: this.charactersData, // Export characters too
            uiLayout: this.uiLayoutData,
            journal: this.journal.exportToJson()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accesscity-project-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('Project exported successfully');
    }

    async importProject(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (importData.scenes) {
                this.scenesData = importData.scenes;
                this.components.sceneList.render(this.scenesData.scenes);
            }

            if (importData.characters) {
                this.charactersData = importData.characters;
                // Update components that use characters data
                this.stageDirector.setCharactersData(this.charactersData);
                this.components.inspector.charactersData = this.charactersData;
                if (this.components.characterEditor) {
                    this.components.characterEditor.charactersData = this.charactersData;
                    this.components.characterEditor.render();
                }
            }

            if (importData.uiLayout) {
                this.uiLayoutData = this.normalizeUiLayoutData(importData.uiLayout);
                this.syncActiveLayout();
                this.setupLayoutControls();
                this.applyLayoutPreset(this.activeLayoutName, { persist: false });
            }

            if (importData.journal) {
                this.journal.importFromJson(importData.journal);
            }

            console.log('Project imported successfully from version', importData.version);
            alert('Project imported successfully!');
        } catch (err) {
            console.error('Import failed:', err);
            alert('Failed to import project: ' + err.message);
        }
    }

    setupEventHandlers() {
        this.eventBus.on('scene:add', (scene) => {
            if (!this.scenesData.scenes) this.scenesData.scenes = [];
            this.scenesData.scenes.push(scene);
            this.journal.record('scene:add', scene);
            this.components.sceneList.render(this.scenesData.scenes);
            this.components.inspector.updateScenesData(this.scenesData);
            this.saveToLocalStorage();
            console.log('Scene added:', scene.id);
        });

        this.eventBus.on('scene:update', (updatedScene) => {
            const idx = this.scenesData.scenes.findIndex(s => s.id === updatedScene.id);
            if (idx !== -1) {
                const oldScene = this.scenesData.scenes[idx];
                this.scenesData.scenes[idx] = updatedScene;
                this.journal.record('scene:update', { old: oldScene, new: updatedScene });
                this.components.sceneList.render(this.scenesData.scenes);
                this.components.inspector.updateScenesData(this.scenesData);
                this.saveToLocalStorage();
                console.log('Scene updated:', updatedScene.id);
            }
        });

        this.eventBus.on('scene:delete', (sceneId) => {
            const deletedScene = this.scenesData.scenes.find(s => s.id === sceneId);
            this.scenesData.scenes = this.scenesData.scenes.filter(s => s.id !== sceneId);
            this.journal.record('scene:delete', deletedScene);
            this.components.sceneList.render(this.scenesData.scenes);
            this.components.inspector.update({ message: 'Scene deleted' });
            this.components.inspector.updateScenesData(this.scenesData);
            this.saveToLocalStorage();
            console.log('Scene deleted:', sceneId);
        });

        this.eventBus.on('character:update', (updatedCharactersData) => {
            this.charactersData = updatedCharactersData;
            // Update components that depend on characters
            this.stageDirector.setCharactersData(this.charactersData);
            this.components.inspector.charactersData = this.charactersData;
            this.saveToLocalStorage();
            console.log('Characters updated and saved.');
        });

        this.eventBus.on('director:play_scene', (scene) => {
            console.log('🎬 Demande de lecture de la scène:', scene.id);
            this.layoutBeforePlay = this.activeLayoutName;
            this.eventBus.emit('director:play');
            this.dialogueEngine.startScene(scene);
        });

        this.eventBus.on('director:stop', () => {
            console.log('⏹ Arrêt du mode lecture');
            if (this.layoutBeforePlay) {
                this.applyLayoutPreset(this.layoutBeforePlay);
                this.layoutBeforePlay = null;
            }
        });
    }

    initializeLayoutSystem() {
        this.setupLayoutControls();
        this.applyLayoutPreset(this.activeLayoutName, { persist: false });

        this.eventBus.on('ui:layout:apply', (layoutName) => {
            this.applyLayoutPreset(layoutName);
        });
    }

    setupLayoutControls() {
        const selector = document.getElementById('layout-selector');
        if (!selector || !this.uiLayoutData || !this.uiLayoutData.layouts) {
            return;
        }

        this.layoutSelectorElement = selector;
        selector.innerHTML = '';

        Object.entries(this.uiLayoutData.layouts).forEach(([layoutId, layoutDefinition]) => {
            const option = document.createElement('option');
            option.value = layoutId;
            const label = layoutDefinition.description
                ? `${layoutDefinition.description}`
                : `Layout ${layoutId}`;
            option.textContent = label;
            selector.appendChild(option);
        });

        const initialValue = this.activeLayoutName || this.uiLayoutData.defaultLayout;
        if (initialValue && this.uiLayoutData.layouts[initialValue]) {
            selector.value = initialValue;
        }

        if (!this.layoutSelectorInitialized) {
            selector.addEventListener('change', (event) => {
                const selectedLayout = event.target.value;
                this.applyLayoutPreset(selectedLayout);
            });
            this.layoutSelectorInitialized = true;
        }
    }

    applyLayoutPreset(layoutName, options = {}) {
        if (!this.uiLayoutData) {
            return;
        }

        const preferredLayout = layoutName || this.activeLayoutName || this.uiLayoutData.defaultLayout;
        const appliedName = this.uiManager.applyLayout(this.uiLayoutData, preferredLayout);

        if (!appliedName) {
            return;
        }

        this.activeLayoutName = appliedName;
        this.uiLayoutData.activeLayout = appliedName;

        const layoutDefinition = this.uiLayoutData.layouts[appliedName];
        const profile = getLayoutProfile(appliedName);

        if (this.layoutSelectorElement && this.layoutSelectorElement.value !== appliedName) {
            this.layoutSelectorElement.value = appliedName;
        }

        if (options.persist !== false) {
            this.saveToLocalStorage();
        }

        this.eventBus.emit('ui:layout:applied', {
            name: appliedName,
            profile,
            definition: layoutDefinition
        });
    }

    normalizeUiLayoutData(rawLayout) {
        if (!rawLayout) {
            return rawLayout;
        }

        if (rawLayout.layouts) {
            return rawLayout;
        }

        if (Array.isArray(rawLayout.panels)) {
            const legacyName = rawLayout.defaultLayout || 'legacy';
            return {
                version: rawLayout.version || 'legacy',
                defaultLayout: legacyName,
                activeLayout: rawLayout.activeLayout || legacyName,
                layouts: {
                    [legacyName]: {
                        description: rawLayout.description || 'Disposition importée (legacy)',
                        panels: rawLayout.panels
                    }
                }
            };
        }

        return rawLayout;
    }

    syncActiveLayout() {
        if (!this.uiLayoutData || !this.uiLayoutData.layouts) {
            this.activeLayoutName = null;
            return;
        }

        const availableLayouts = this.uiLayoutData.layouts;
        const fallback = this.uiLayoutData.defaultLayout || Object.keys(availableLayouts)[0] || null;
        const requestedName = this.uiLayoutData.activeLayout || this.activeLayoutName || fallback;

        this.activeLayoutName = availableLayouts[requestedName] ? requestedName : fallback;

        if (this.activeLayoutName) {
            this.uiLayoutData.activeLayout = this.activeLayoutName;
        }
    }
}

new AccessCityApp().init();
