// core/StageDirector.ts
// Moteur de jeu pour AccessCity Studio (React)

import { logger } from '../utils/logger';
import type { Scene, Dialogue, Character, DialogueChoice } from '@/types';

/**
 * Game variables tracking player progress
 */
export interface GameVariables {
  Empathie: number;
  Autonomie: number;
  Confiance: number;
}

/**
 * Ending message structure
 */
export interface EndingMessage {
  title: string;
  message: string;
  grade: string;
}

/**
 * StageDirector class - Game engine for AccessCity Studio
 * Manages game flow, dialogue progression, and player variables
 */
export default class StageDirector {
  private scenes: Scene[];
  private characters: Character[];

  private currentSceneIndex: number;
  private currentDialogueIndex: number;
  private gameEnded: boolean;
  private variables: GameVariables;

  constructor(
    scenes: Scene[],
    dialogues: Dialogue[], // Kept for backward compatibility but not used
    characters: Character[],
    initialSceneIndex: number = 0
  ) {
    this.scenes = scenes || [];
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

  /**
   * Initialize or reset game state
   */
  private initialize(): void {
    // S'assurer que l'index de scène est valide
    if (this.currentSceneIndex < 0 || this.currentSceneIndex >= this.scenes.length) {
      logger.warn(`[StageDirector] Scene index ${this.currentSceneIndex} invalide, reset à 0`);
      this.currentSceneIndex = 0;
    }

    this.currentDialogueIndex = 0;
    this.gameEnded = false;

    logger.debug(`[StageDirector] Initialisation: scène ${this.currentSceneIndex}/${this.scenes.length}`);
  }

  /**
   * Get the current scene
   * @returns Current scene or null if invalid index
   */
  getCurrentScene(): Scene | null {
    if (this.currentSceneIndex >= 0 && this.currentSceneIndex < this.scenes.length) {
      const scene = this.scenes[this.currentSceneIndex];
      logger.debug(`[StageDirector] getCurrentScene(): scène ${scene?.id || 'undefined'}`);
      return scene;
    }
    logger.warn(`[StageDirector] getCurrentScene(): index ${this.currentSceneIndex} hors limites`);
    return null;
  }

  /**
   * Get the current dialogue in the current scene
   * @returns Current dialogue or null
   */
  getCurrentDialogue(): Dialogue | null {
    const currentScene = this.getCurrentScene();
    if (!currentScene) {
      logger.warn('[StageDirector] getCurrentDialogue(): aucune scène actuelle');
      return null;
    }

    const dialoguesInScene = currentScene.dialogues || [];

    logger.debug(`[StageDirector] Scène "${currentScene.id}": ${dialoguesInScene.length} dialogues trouvés`);

    if (this.currentDialogueIndex >= 0 && this.currentDialogueIndex < dialoguesInScene.length) {
      const dialogue = dialoguesInScene[this.currentDialogueIndex];
      logger.debug(`[StageDirector] Dialogue ${this.currentDialogueIndex}: "${dialogue.text?.substring(0, 50)}..."`);
      return dialogue;
    }

    logger.debug(`[StageDirector] Aucun dialogue à l'index ${this.currentDialogueIndex}`);
    return null;
  }

  /**
   * Process a player choice
   * @param choice - The dialogue choice selected by the player
   * @returns Effects applied or null
   */
  makeChoice(choice: DialogueChoice): Record<string, unknown> | null {
    logger.debug('[StageDirector] Choice made:', choice);

    // Appliquer les effets sur les variables
    if (choice.effects) {
      choice.effects.forEach(effect => {
        const key = effect.variable as keyof GameVariables;
        if (key in this.variables) {
          this.variables[key] = Math.max(0, Math.min(100, this.variables[key] + effect.value));
          logger.debug(`[StageDirector] Variable ${key}: ${this.variables[key]}`);
        }
      });
    }

    // Gérer le risque (lancer de dé) via diceCheck
    if (choice.diceCheck) {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      const threshold = choice.diceCheck.difficulty || 4;

      logger.debug(`[StageDirector] Dice roll: ${diceRoll}, threshold: ${threshold}`);

      if (diceRoll < threshold) {
        // Échec : pénalité sur les variables
        (Object.keys(this.variables) as Array<keyof GameVariables>).forEach(key => {
          this.variables[key] = Math.max(0, this.variables[key] - 5);
        });
        logger.debug('[StageDirector] Risk failed! Variables reduced.');
      } else {
        logger.debug('[StageDirector] Risk succeeded!');
      }
    }

    // Déterminer la prochaine destination (priorité: nextDialogueId > nextSceneId > auto)
    if (choice.nextDialogueId) {
      // Priorité 1: Sauter à un dialogue spécifique dans la scène courante
      const currentScene = this.getCurrentScene();
      if (currentScene) {
        const dialoguesInScene = currentScene.dialogues || [];
        const targetIndex = dialoguesInScene.findIndex(d => d.id === choice.nextDialogueId);

        if (targetIndex !== -1) {
          this.currentDialogueIndex = targetIndex;
          logger.debug(`[StageDirector] Jumping to dialogue ${choice.nextDialogueId} at index ${targetIndex}`);
        } else {
          logger.warn(`[StageDirector] Dialogue ${choice.nextDialogueId} not found in current scene, advancing to next`);
          if (!this.nextDialogue()) {
            this.gameEnded = true;
          }
        }
      }
    } else if (choice.nextSceneId !== null && choice.nextSceneId !== undefined) {
      // Priorité 2: Changer de scène
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
      // Priorité 3: Avancer au dialogue suivant (comportement par défaut)
      if (!this.nextDialogue()) {
        this.gameEnded = true;
        logger.debug('[StageDirector] Game ended.');
      }
    }

    return choice.effects ? choice.effects.reduce((acc, eff) => ({...acc, [eff.variable]: eff.value}), {}) : null;
  }

  /**
   * Check if the game has ended
   * @returns True if game is over
   */
  isGameEnded(): boolean {
    if (this.gameEnded) return true;

    const currentScene = this.getCurrentScene();
    if (!currentScene) return true;

    const dialoguesInScene = currentScene.dialogues || [];

    // Si aucun dialogue dans la scène actuelle, le jeu est terminé
    if (dialoguesInScene.length === 0) {
      logger.warn(`[StageDirector] Aucun dialogue pour la scène ${currentScene.id}, jeu terminé`);
      return true;
    }

    return false;
  }

  /**
   * Get current game variables (immutable copy)
   * @returns Copy of game variables
   */
  getVariables(): GameVariables {
    return { ...this.variables };
  }

  /**
   * Reset game to initial state
   */
  resetGame(): void {
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

  /**
   * Advance to next dialogue in current scene
   * @returns True if advanced, false if no more dialogues
   */
  nextDialogue(): boolean {
    const currentScene = this.getCurrentScene();
    if (!currentScene) return false;

    const dialoguesInScene = currentScene.dialogues || [];

    if (this.currentDialogueIndex < dialoguesInScene.length - 1) {
      this.currentDialogueIndex++;
      logger.debug(`[StageDirector] Avancé au dialogue ${this.currentDialogueIndex}`);
      return true;
    }

    logger.debug('[StageDirector] Aucun dialogue suivant');
    return false; // Pas de dialogue suivant
  }

  /**
   * Get all dialogues for a specific scene
   * @param sceneId - Scene ID
   * @returns Array of dialogues
   */
  getDialoguesForScene(sceneId: string): Dialogue[] {
    const scene = this.scenes.find(s => s.id === sceneId);
    return scene?.dialogues || [];
  }

  /**
   * Get character by ID
   * @param characterId - Character ID
   * @returns Character or null
   */
  getCharacterById(characterId: string): Character | null {
    return this.characters.find(c => c.id === characterId) || null;
  }

  /**
   * Calculate final score (average of all variables)
   * @returns Final score (0-100)
   */
  getFinalScore(): number {
    const avg = (this.variables.Empathie + this.variables.Autonomie + this.variables.Confiance) / 3;
    return Math.round(avg);
  }

  /**
   * Get ending message based on final score
   * @returns Ending message with title, message and grade
   */
  getEndingMessage(): EndingMessage {
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
