// core/StageDirector.js
// Moteur de jeu pour AccessCity Studio (React)

import { logger } from '../utils/logger';

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
      logger.warn(`[StageDirector] Scene index ${this.currentSceneIndex} invalide, reset à 0`);
      this.currentSceneIndex = 0;
    }

    this.currentDialogueIndex = 0;
    this.gameEnded = false;

    logger.debug(`[StageDirector] Initialisation: scène ${this.currentSceneIndex}/${this.scenes.length}`);
  }


  getCurrentScene() {
    if (this.currentSceneIndex >= 0 && this.currentSceneIndex < this.scenes.length) {
      const scene = this.scenes[this.currentSceneIndex];
      logger.debug(`[StageDirector] getCurrentScene(): scène ${scene?.id || 'undefined'}`);
      return scene;
    }
    logger.warn(`[StageDirector] getCurrentScene(): index ${this.currentSceneIndex} hors limites`);
    return null;
  }


  getCurrentDialogue() {
    const currentScene = this.getCurrentScene();
    if (!currentScene) {
      logger.warn('[StageDirector] getCurrentDialogue(): aucune scène actuelle');
      return null;
    }

    // ✅ FIX: Filtrer par scene.id au lieu de l'index
    const dialoguesInScene = this.dialogues.filter(
      d => d.sceneId === currentScene.id
    );

    logger.debug(`[StageDirector] Scène "${currentScene.id}": ${dialoguesInScene.length} dialogues trouvés`);

    if (this.currentDialogueIndex >= 0 && this.currentDialogueIndex < dialoguesInScene.length) {
      const dialogue = dialoguesInScene[this.currentDialogueIndex];
      logger.debug(`[StageDirector] Dialogue ${this.currentDialogueIndex}: "${dialogue.text?.substring(0, 50)}..."`);
      return dialogue;
    }

    logger.debug(`[StageDirector] Aucun dialogue à l'index ${this.currentDialogueIndex}`);
    return null;
  }


  makeChoice(choice) {
    logger.debug('[StageDirector] Choice made:', choice);

    // Appliquer les effets sur les variables
    if (choice.effects) {
      Object.entries(choice.effects).forEach(([key, value]) => {
        if (this.variables.hasOwnProperty(key)) {
          this.variables[key] = Math.max(0, Math.min(100, this.variables[key] + value));
          logger.debug(`[StageDirector] Variable ${key}: ${this.variables[key]}`);
        }
      });
    }


    // Gérer le risque (lancer de dé)
    if (choice.riskLevel && choice.riskLevel > 0) {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      const threshold = 7 - choice.riskLevel; // riskLevel 1 = seuil 6, riskLevel 2 = seuil 5, etc.

      logger.debug(`[StageDirector] Dice roll: ${diceRoll}, threshold: ${threshold}`);

      if (diceRoll < threshold) {
        // Échec : pénalité sur les variables
        Object.keys(this.variables).forEach(key => {
          this.variables[key] = Math.max(0, this.variables[key] - 5);
        });
        logger.debug('[StageDirector] Risk failed! Variables reduced.');
      } else {
        logger.debug('[StageDirector] Risk succeeded!');
      }
    }


    // Déterminer la prochaine scène
    if (choice.nextSceneId !== null && choice.nextSceneId !== undefined) {
      // ✅ FIX: Chercher l'index de la scène par son ID
      const nextSceneIndex = this.scenes.findIndex(s => s.id === choice.nextSceneId);

      if (nextSceneIndex !== -1) {
        this.currentSceneIndex = nextSceneIndex;
        this.currentDialogueIndex = 0;
        logger.debug(`[StageDirector] Moving to scene ${choice.nextSceneId} (index ${nextSceneIndex})`);
      } else {
        logger.warn(`[StageDirector] Scene ${choice.nextSceneId} introuvable, fin du jeu`);
        this.gameEnded = true;
      }
    } else {
      // Pas de scène suivante: avancer au dialogue suivant ou terminer
      if (!this.nextDialogue()) {
        // Fin du jeu
        this.gameEnded = true;
        logger.debug('[StageDirector] Game ended.');
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
      logger.warn(`[StageDirector] Aucun dialogue pour la scène ${currentScene.id}, jeu terminé`);
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
    logger.debug('[StageDirector] Game reset');
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
      logger.debug(`[StageDirector] Avancé au dialogue ${this.currentDialogueIndex}`);
      return true;
    }

    logger.debug('[StageDirector] Aucun dialogue suivant');
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