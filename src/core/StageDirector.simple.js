/**
 * StageDirector - Moteur de jeu simplifie pour AccessCity
 * Version compatible avec editeur existant
 * 
 * CORRECTIONS :
 * - Bug dialogues non connectes : Filtre par scene.id au lieu d'index
 * - Bug 'Fin du jeu' immediate : Verification dialogues + scene initiale
 * - Logs de debug pour tracer les problemes
 */

class StageDirector {
  /**
   * @param {Array} scenes - Liste des scenes du scenario
   * @param {Array} dialogues - Liste des dialogues du scenario
   * @param {Object} gameState - Etat initial du jeu (variables)
   * @param {number} initialSceneIndex - Index de la scene de depart (defaut: 0)
   */
  constructor(scenes = [], dialogues = [], gameState = {}, initialSceneIndex = 0) {
    this.scenes = scenes;
    this.dialogues = dialogues;
    this.gameState = gameState || {
      physique: 100,
      mentale: 100
    };
    
    // FIX: Utiliser l'index de scene fourni
    this.currentSceneIndex = initialSceneIndex;
    this.currentDialogueIndex = 0;
    this.history = [];
    
    console.log(`[StageDirector] Initialisation: scene ${initialSceneIndex}/${scenes.length}`);
    
    // Verification scenes
    if (!scenes || scenes.length === 0) {
      console.error('[StageDirector] ERREUR: Aucune scene fournie !');
      return;
    }
    
    // Verification dialogues pour la scene initiale
    const initialScene = scenes[initialSceneIndex];
    if (!initialScene) {
      console.error(`[StageDirector] ERREUR: Scene ${initialSceneIndex} introuvable !`);
      return;
    }
    
    const sceneDialogues = this.getDialoguesForScene(initialScene.id);
    console.log(`[StageDirector] Scene "${initialScene.id}": ${sceneDialogues.length} dialogues trouves`);
    
    if (sceneDialogues.length === 0) {
      console.warn(`[StageDirector] ATTENTION: Scene "${initialScene.id}" n'a aucun dialogue !`);
    }
  }
  
  /**
   * FIX PRINCIPAL : Recuperer les dialogues par scene.id (pas par index)
   * @param {string} sceneId - ID de la scene
   * @returns {Array} - Dialogues de cette scene
   */
  getDialoguesForScene(sceneId) {
    if (!sceneId) {
      console.error('[StageDirector] getDialoguesForScene: sceneId manquant !');
      return [];
    }
    
    const dialogues = this.dialogues.filter(d => d.sceneId === sceneId);
    console.log(`[StageDirector] Scene "${sceneId}": ${dialogues.length} dialogues`);
    return dialogues;
  }
  
  /**
   * Obtenir le dialogue actuel
   * @returns {Object|null}
   */
  getCurrentDialogue() {
    const currentScene = this.scenes[this.currentSceneIndex];
    if (!currentScene) {
      console.error(`[StageDirector] Scene ${this.currentSceneIndex} introuvable`);
      return null;
    }
    
    // FIX: Filtrer par scene.id
    const sceneDialogues = this.getDialoguesForScene(currentScene.id);
    
    if (sceneDialogues.length === 0) {
      console.warn(`[StageDirector] Scene "${currentScene.id}" sans dialogues`);
      return null;
    }
    
    const dialogue = sceneDialogues[this.currentDialogueIndex];
    
    if (!dialogue) {
      console.log(`[StageDirector] Fin des dialogues de la scene "${currentScene.id}"`);
      return null;
    }
    
    console.log(`[StageDirector] Dialogue actuel: ${dialogue.text?.substring(0, 50)}...`);
    return dialogue;
  }
  
  /**
   * Faire un choix
   * @param {Object} choice - Choix selectionne
   */
  makeChoice(choice) {
    if (!choice) {
      console.error('[StageDirector] makeChoice: choix manquant');
      return;
    }
    
    console.log(`[StageDirector] Choix: ${choice.text}`);
    
    // Sauvegarder dans l'historique
    this.history.push({
      dialogue: this.getCurrentDialogue(),
      choice: choice,
      timestamp: Date.now()
    });
    
    // Appliquer effets sur variables
    if (choice.effects) {
      this.applyEffects(choice.effects);
    }
    
    // Gerer navigation
    if (choice.nextSceneId) {
      this.goToScene(choice.nextSceneId);
    } else if (choice.nextDialogueId) {
      this.goToDialogue(choice.nextDialogueId);
    } else {
      // Par defaut: dialogue suivant
      this.currentDialogueIndex++;
    }
  }
  
  /**
   * Aller a une scene specifique
   * @param {string} sceneId - ID de la scene
   */
  goToScene(sceneId) {
    console.log(`[StageDirector] Navigation vers scene "${sceneId}"`);
    
    // FIX: Chercher scene par ID
    const sceneIndex = this.scenes.findIndex(s => s.id === sceneId);
    
    if (sceneIndex === -1) {
      console.error(`[StageDirector] Scene "${sceneId}" introuvable !`);
      return;
    }
    
    this.currentSceneIndex = sceneIndex;
    this.currentDialogueIndex = 0;
    
    console.log(`[StageDirector] Scene changee: index ${sceneIndex}`);
  }
  
  /**
   * Aller a un dialogue specifique
   * @param {string} dialogueId - ID du dialogue
   */
  goToDialogue(dialogueId) {
    const currentScene = this.scenes[this.currentSceneIndex];
    const sceneDialogues = this.getDialoguesForScene(currentScene.id);
    
    const dialogueIndex = sceneDialogues.findIndex(d => d.id === dialogueId);
    
    if (dialogueIndex === -1) {
      console.error(`[StageDirector] Dialogue "${dialogueId}" introuvable !`);
      return;
    }
    
    this.currentDialogueIndex = dialogueIndex;
    console.log(`[StageDirector] Dialogue change: index ${dialogueIndex}`);
  }
  
  /**
   * Appliquer effets des choix
   * @param {Object} effects - Effets a appliquer
   */
  applyEffects(effects) {
    if (!effects) return;
    
    Object.keys(effects).forEach(key => {
      const value = effects[key];
      const oldValue = this.gameState[key] || 0;
      
      this.gameState[key] = Math.max(0, Math.min(100, oldValue + value));
      
      console.log(`[StageDirector] ${key}: ${oldValue} -> ${this.gameState[key]} (${value > 0 ? '+' : ''}${value})`);
    });
  }
  
  /**
   * Obtenir la scene actuelle
   * @returns {Object|null}
   */
  getCurrentScene() {
    return this.scenes[this.currentSceneIndex] || null;
  }
  
  /**
   * Verifier si le jeu est termine
   * @returns {boolean}
   */
  isGameOver() {
    // Verifier si plus de scenes
    if (this.currentSceneIndex >= this.scenes.length) {
      console.log('[StageDirector] Fin du jeu: plus de scenes');
      return true;
    }
    
    // Verifier si plus de dialogues dans la scene actuelle
    const currentScene = this.getCurrentScene();
    if (!currentScene) {
      console.log('[StageDirector] Fin du jeu: scene invalide');
      return true;
    }
    
    const sceneDialogues = this.getDialoguesForScene(currentScene.id);
    if (this.currentDialogueIndex >= sceneDialogues.length) {
      console.log('[StageDirector] Fin du jeu: plus de dialogues');
      return true;
    }
    
    // Verifier Game Over (variables a 0)
    if (this.gameState.physique <= 0 || this.gameState.mentale <= 0) {
      console.log('[StageDirector] Game Over: variable a 0');
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtenir l'etat du jeu
   * @returns {Object}
   */
  getGameState() {
    return {
      ...this.gameState,
      currentScene: this.getCurrentScene(),
      currentDialogue: this.getCurrentDialogue(),
      isGameOver: this.isGameOver(),
      history: this.history
    };
  }
}

export default StageDirector;
