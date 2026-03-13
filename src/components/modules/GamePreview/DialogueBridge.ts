/**
 * DialogueBridge — Pont entre le moteur Excalibur et le VN editor AccessCity
 *
 * Quand un trigger de dialogue est déclenché dans le jeu :
 * 1. Le moteur Excalibur est mis en pause
 * 2. La scène VN est ouverte dans PreviewModal (depuis uiStore)
 * 3. Quand le dialogue se termine, le moteur reprend
 *
 * Sprint 3 : implémentation du pont (pause/resume). L'ouverture du dialogue
 * est un placeholder — Sprint 4 (BehaviorGraph) connectera les triggers.
 *
 * @module components/modules/GamePreview/DialogueBridge
 */

import * as ex from 'excalibur';

// ============================================================================
// TYPES
// ============================================================================

export interface DialogueBridgeOptions {
  engine: ex.Engine;
  onTriggerDialogue: (sceneId: string) => void;
  onTriggerMapExit: (targetMapId: string) => void;
}

// ============================================================================
// BRIDGE CLASS (non-React, used by GameScene.ts)
// ============================================================================

export class DialogueBridge {
  private engine: ex.Engine;
  private onTriggerDialogue: (sceneId: string) => void;
  private onTriggerMapExit: (targetMapId: string) => void;
  private isDialogueOpen = false;

  constructor(options: DialogueBridgeOptions) {
    this.engine = options.engine;
    this.onTriggerDialogue = options.onTriggerDialogue;
    this.onTriggerMapExit = options.onTriggerMapExit;
  }

  /**
   * Called by GameScene when the player enters a dialogue trigger zone.
   * Pauses the engine and opens the VN dialogue via uiStore.
   */
  triggerDialogue(sceneId: string): void {
    if (this.isDialogueOpen) return; // Prevent double-trigger
    this.isDialogueOpen = true;
    this.engine.stop();
    this.onTriggerDialogue(sceneId);
  }

  /**
   * Called when the VN dialogue is closed (from React side).
   * Resumes the engine.
   */
  resumeAfterDialogue(): void {
    this.isDialogueOpen = false;
    this.engine.start();
  }

  /**
   * Called when the player exits to another map.
   */
  triggerMapExit(targetMapId: string): void {
    this.onTriggerMapExit(targetMapId);
  }
}
