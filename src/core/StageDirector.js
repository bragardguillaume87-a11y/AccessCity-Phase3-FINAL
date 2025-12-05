// core/StageDirector.js
// Moteur de jeu pour AccessCity Studio (React)


export default class StageDirector {
  constructor(scenes, dialogues, characters, initialSceneIndex = 0) {
    this.scenes = scenes || [];
    this.dialogues = dialogues || [];
    this.characters = characters || [];
    
    // État du jeu
    this.currentSceneIndex = initialSceneIndex; // ✅ Support scène initiale
    this.currentDialogueIndex = 0;
    this.gameEnded = false;
    
    // Variables du jeu
    this.variables = {
      Empathie: 50,
      Autonomie: 50,
      Confiance: 50
    };
    
    // Initialisation
    this.initialize();
  }


  initialize() {
    // S'assurer que l'index de scène est valide
    if (this.currentSceneIndex < 0 || this.currentSceneIndex >= this.scenes.length) {
      console.warn(`[StageDirector] Scene index ${this.currentSceneIndex} invalide, reset à 0`);
      this.currentSceneIndex = 0;
    }
    
    this.currentDialogueIndex = 0;
    this.gameEnded = false;
    
    console.log(`[StageDirector] Initialisation: scène ${this.currentSceneIndex}/${this.scenes.length}`);
  }


  getCurrentScene() {
    if (this.currentSceneIndex >= 0 && this.currentSceneIndex < this.scenes.length) {
      const scene = this.scenes[this.currentSceneIndex];
      console.log(`[StageDirector] getCurrentScene(): scène ${scene?.id || 'undefined'}`);
      return scene;
    }
    console.warn(`[StageDirector] getCurrentScene(): index ${this.currentSceneIndex} hors limites`);
    return null;
  }


  getCurrentDialogue() {
    const currentScene = this.getCurrentScene();
    if (!currentScene) {
      console.warn('[StageDirector] getCurrentDialogue(): aucune scène actuelle');
      return null;
    }
    
    // ✅ FIX: Filtrer par scene.id au lieu de l'index
    const dialoguesInScene = this.dialogues.filter(
      d => d.sceneId === currentScene.id
    );
    
    console.log(`[StageDirector] Scène "${currentScene.id}": ${dialoguesInScene.length} dialogues trouvés`);
    
    if (this.currentDialogueIndex >= 0 && this.currentDialogueIndex < dialoguesInScene.length) {
      const dialogue = dialoguesInScene[this.currentDialogueIndex];
      console.log(`[StageDirector] Dialogue ${this.currentDialogueIndex}: "${dialogue.text?.substring(0, 50)}..."`);
      return dialogue;
    }
    
    console.log(`[StageDirector] Aucun dialogue à l'index ${this.currentDialogueIndex}`);
    return null;
  }


  makeChoice(choice) {
    console.log('[StageDirector] Choice made:', choice);
    
    // Appliquer les effets sur les variables
    if (choice.effects) {
      Object.entries(choice.effects).forEach(([key, value]) => {
        if (this.variables.hasOwnProperty(key)) {
          this.variables[key] = Math.max(0, Math.min(100, this.variables[key] + value));
          console.log(`[StageDirector] Variable ${key}: ${this.variables[key]}`);
        }
      });
    }


    // Gérer le risque (lancer de dé)
    if (choice.riskLevel && choice.riskLevel > 0) {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      const threshold = 7 - choice.riskLevel; // riskLevel 1 = seuil 6, riskLevel 2 = seuil 5, etc.
      
      console.log(`[StageDirector] Dice roll: ${diceRoll}, threshold: ${threshold}`);
      
      if (diceRoll < threshold) {
        // Échec : pénalité sur les variables
        Object.keys(this.variables).forEach(key => {
          this.variables[key] = Math.max(0, this.variables[key] - 5);
        });
        console.log('[StageDirector] Risk failed! Variables reduced.');
      } else {
        console.log('[StageDirector] Risk succeeded!');
      }
    }


    // Déterminer la prochaine scène
    if (choice.nextSceneId !== null && choice.nextSceneId !== undefined) {
      // ✅ FIX: Chercher l'index de la scène par son ID
      const nextSceneIndex = this.scenes.findIndex(s => s.id === choice.nextSceneId);
      
      if (nextSceneIndex !== -1) {
        this.currentSceneIndex = nextSceneIndex;
        this.currentDialogueIndex = 0;
        console.log(`[StageDirector] Moving to scene ${choice.nextSceneId} (index ${nextSceneIndex})`);
      } else {
        console.warn(`[StageDirector] Scene ${choice.nextSceneId} introuvable, fin du jeu`);
        this.gameEnded = true;
      }
    } else {
      // Pas de scène suivante: avancer au dialogue suivant ou terminer
      if (!this.nextDialogue()) {
        // Fin du jeu
        this.gameEnded = true;
        console.log('[StageDirector] Game ended.');
      }
    }


    return choice.effects || null;
  }


  isGameEnded() {
    // ✅ FIX: Vérifier aussi s'il reste des dialogues
    if (this.gameEnded) return true;
    
    const currentScene = this.getCurrentScene();
    if (!currentScene) return true;
    
    const dialoguesInScene = this.dialogues.filter(d => d.sceneId === currentScene.id);
    
    // Si aucun dialogue dans la scène actuelle, le jeu est terminé
    if (dialoguesInScene.length === 0) {
      console.warn(`[StageDirector] Aucun dialogue pour la scène ${currentScene.id}, jeu terminé`);
      return true;
    }
    
    return false;
  }


  getVariables() {
    return { ...this.variables };
  }


  resetGame() {
    this.currentSceneIndex = 0;
    this.currentDialogueIndex = 0;
    this.gameEnded = false;
    this.variables = {
      Empathie: 50,
      Autonomie: 50,
      Confiance: 50
    };
    console.log('[StageDirector] Game reset');
  }


  // Méthode pour avancer au dialogue suivant (si multiple dialogues par scène)
  nextDialogue() {
    const currentScene = this.getCurrentScene();
    if (!currentScene) return false;
    
    const dialoguesInScene = this.dialogues.filter(
      d => d.sceneId === currentScene.id
    );
    
    if (this.currentDialogueIndex < dialoguesInScene.length - 1) {
      this.currentDialogueIndex++;
      console.log(`[StageDirector] Avancé au dialogue ${this.currentDialogueIndex}`);
      return true;
    }
    
    console.log('[StageDirector] Aucun dialogue suivant');
    return false; // Pas de dialogue suivant
  }


  // Méthode pour obtenir tous les dialogues d'une scène
  getDialoguesForScene(sceneId) {
    return this.dialogues.filter(d => d.sceneId === sceneId);
  }


  // Méthode pour obtenir un personnage par ID
  getCharacterById(characterId) {
    if (characterId >= 0 && characterId < this.characters.length) {
      return this.characters[characterId];
    }
    return null;
  }


  // Méthode pour calculer le score final
  getFinalScore() {
    const avg = (this.variables.Empathie + this.variables.Autonomie + this.variables.Confiance) / 3;
    return Math.round(avg);
  }


  // Méthode pour obtenir un message de fin basé sur le score
  getEndingMessage() {
    const score = this.getFinalScore();
    
    if (score >= 80) {
      return {
        title: "Parcours exceptionnel !",
        message: "Vous avez démontré une maîtrise exemplaire de toutes les compétences.",
        grade: "A+"
      };
    } else if (score >= 60) {
      return {
        title: "Bon parcours !",
        message: "Vous avez bien géré la plupart des situations.",
        grade: "B"
      };
    } else if (score >= 40) {
      return {
        title: "Parcours moyen",
        message: "Vous avez encore des compétences à développer.",
        grade: "C"
      };
    } else {
      return {
        title: "Parcours difficile",
        message: "Il faudra revoir certaines approches.",
        grade: "D"
      };
    }
  }
}