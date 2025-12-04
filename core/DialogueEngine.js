// core/DialogueEngine.js
import { evaluateConditions } from './conditionEvaluator.js';

export class DialogueEngine {
    /**
     * @param {import('./variableManager.js').VariableManager} variableManager 
     * @param {import('./eventBus.js').EventBus} eventBus 
     */
    constructor(variableManager, eventBus) {
        this.variableManager = variableManager;
        this.eventBus = eventBus;
        
        this.currentScene = null;
        this.currentIndex = -1;
        this.isWaitingForChoice = false;
        this.isSceneEnded = false;
        
        // Safety: max iterations to prevent infinite loops
        this.MAX_SKIP_ITERATIONS = 1000;
    }

    /**
     * Lance une scene
     * @param {Object} scene - L'objet scene complet
     */
    startScene(scene) {
        if (!scene || !scene.dialogues || scene.dialogues.length === 0) {
            console.warn('[DialogueEngine] Invalid scene or empty dialogues');
            return;
        }

        console.log(`[DialogueEngine] Starting scene: ${scene.title || 'Untitled'}`);
        this.currentScene = scene;
        this.currentIndex = -1;
        this.isWaitingForChoice = false;
        this.isSceneEnded = false;

        this.eventBus.emit('engine:scene_start', scene);
        this.next();
    }

    applyEffects(effects) {
        if (!effects || effects.length === 0) return;

        effects.forEach(effect => {
            try {
                switch (effect.operation) {
                    case 'set':
                        this.variableManager.set(effect.variable, effect.value);
                        console.log(`[DialogueEngine] Effect 'set': ${effect.variable} = ${effect.value}`);
                        break;
                    
                    case 'add':
                        const current = this.variableManager.get(effect.variable) || 0;
                        const newValue = current + effect.value;
                        this.variableManager.set(effect.variable, newValue);
                        console.log(`[DialogueEngine] Effect 'add': ${effect.variable} ${current} + ${effect.value} = ${newValue}`);
                        break;
                    
                    case 'random':
                        const min = effect.min !== undefined ? effect.min : 0;
                        const max = effect.max !== undefined ? effect.max : 100;
                        const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
                        this.variableManager.set(effect.variable, randomValue);
                        console.log(`[DialogueEngine] Effect 'random': ${effect.variable} = ${randomValue} (min:${min}, max:${max})`);
                        break;
                    
                    default:
                        console.warn(`[DialogueEngine] Unknown effect operation: ${effect.operation}`);
                }
            } catch (error) {
                console.error(`[DialogueEngine] Error applying effect on ${effect.variable}:`, error);
            }
        });
    }

    /**
     * Passe au dialogue suivant
     */
    next() {
        if (this.isWaitingForChoice) {
            console.warn('[DialogueEngine] Waiting for choice, cannot advance.');
            return;
        }

        let skipCount = 0;

        while (true) {
            this.currentIndex++;

            // Safety check: prevent infinite loops
            if (skipCount >= this.MAX_SKIP_ITERATIONS) {
                console.error(`[DialogueEngine] Max skip iterations (${this.MAX_SKIP_ITERATIONS}) reached. Breaking loop to prevent freeze.`);
                this.endScene();
                return;
            }

            if (!this.currentScene || this.currentIndex >= this.currentScene.dialogues.length) {
                this.endScene();
                return;
            }

            const dialogue = this.currentScene.dialogues[this.currentIndex];

            if (dialogue.conditions && !evaluateConditions(dialogue.conditions, this.variableManager)) {
                console.log(`[DialogueEngine] Skipping dialogue ${this.currentIndex} (conditions not met)`);
                skipCount++;
                continue;
            }

            this.eventBus.emit('engine:dialogue_show', dialogue);

            if (dialogue.choices && dialogue.choices.length > 0) {
                const availableChoices = dialogue.choices.filter(choice => {
                    if (!choice.conditions) return true;
                    return evaluateConditions(choice.conditions, this.variableManager);
                });

                if (availableChoices.length > 0) {
                    this.isWaitingForChoice = true;
                    this.eventBus.emit('engine:choices_show', availableChoices);
                } else {
                    console.warn('[DialogueEngine] All choices filtered out by conditions.');
                }
            }

            return;
        }
    }

    /**
     * Selectionne un choix
     * @param {Object} choice - L'objet choix lui-meme (plus sur)
     */
    selectChoice(choice) {
        if (!this.isWaitingForChoice) {
            console.warn('[DialogueEngine] selectChoice called but not waiting for choice');
            return;
        }

        if (!choice) {
            console.error('[DialogueEngine] selectChoice called with null/undefined choice');
            return;
        }

        console.log(`[DialogueEngine] Choice selected: "${choice.text}"`);

        // Appliquer les effets
        if (choice.effects) {
            this.applyEffects(choice.effects);
        }

        this.isWaitingForChoice = false;

        // Redirection vers une autre scene ?
        if (choice.targetScene) {
            this.eventBus.emit('engine:scene_change_request', choice.targetScene);
        } else {
            this.next();
        }
    }

    endScene() {
        console.log('[DialogueEngine] Scene ended');
        this.isSceneEnded = true;
        this.currentScene = null;
        this.eventBus.emit('engine:scene_end');
    }
}
