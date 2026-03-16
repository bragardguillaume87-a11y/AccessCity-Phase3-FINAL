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

export type TransitionType = 'fade-black' | 'fade-white' | 'iris' | 'none';

export interface DialogueBridgeOptions {
  engine: ex.Engine;
  onTriggerDialogue: (sceneId: string, transitionType: TransitionType) => void;
  onTriggerMapExit: (targetMapId: string, targetPos: { x: number; y: number }) => void;
  /** Called when the dialogue trigger requests the map BGM to stop (replace / silence). */
  onStopMapBgm?: () => void;
  /** Called when the player enters an interact-mode zone — show the "↵ Entrée" tooltip. */
  onShowInteractPrompt?: () => void;
  /** Called when the player leaves all interact-mode zones — hide the tooltip. */
  onHideInteractPrompt?: () => void;
  /** Called when the player activates a sign zone — show the text popup. */
  onShowSignPopup?: (text: string) => void;
  /** Called when the sign popup is dismissed — resume the engine. */
  onHideSignPopup?: () => void;
  /** Called after dialogue/sign resume — restarts map BGM if it was stopped. */
  onResumeBgm?: () => void;
}

// ============================================================================
// BRIDGE CLASS (non-React, used by GameScene.ts)
// ============================================================================

export class DialogueBridge {
  private engine: ex.Engine;
  private onTriggerDialogue: (sceneId: string, transitionType: TransitionType) => void;
  private onTriggerMapExit: (targetMapId: string, targetPos: { x: number; y: number }) => void;
  private onStopMapBgm?: () => void;
  private onResumeBgm?: () => void;
  private onShowInteractPromptCb?: () => void;
  private onHideInteractPromptCb?: () => void;
  private onShowSignPopupCb?: (text: string) => void;
  private onHideSignPopupCb?: () => void;
  private isDialogueOpen = false;
  private isSignOpen = false;

  constructor(options: DialogueBridgeOptions) {
    this.engine = options.engine;
    this.onTriggerDialogue = options.onTriggerDialogue;
    this.onTriggerMapExit = options.onTriggerMapExit;
    this.onStopMapBgm = options.onStopMapBgm;
    this.onResumeBgm = options.onResumeBgm;
    this.onShowInteractPromptCb = options.onShowInteractPrompt;
    this.onHideInteractPromptCb = options.onHideInteractPrompt;
    this.onShowSignPopupCb = options.onShowSignPopup;
    this.onHideSignPopupCb = options.onHideSignPopup;
  }

  /**
   * Called by GameScene when the player enters a dialogue trigger zone.
   * Pauses the engine and opens the VN dialogue via uiStore.
   *
   * @param sceneId - VN scene to open
   * @param bgmBehavior - 'replace' or 'silence' → stop map BGM before opening
   * @param transitionType - visual transition to play before the dialogue appears
   */
  triggerDialogue(
    sceneId: string,
    bgmBehavior?: 'keep' | 'replace' | 'silence',
    transitionType?: TransitionType
  ): void {
    if (this.isDialogueOpen) return; // Prevent double-trigger
    if (!this.engine.isRunning()) return; // Guard: engine must be running to pause (isRunning is a METHOD in ex v0.32)
    this.isDialogueOpen = true;
    if (bgmBehavior === 'replace' || bgmBehavior === 'silence') {
      this.onStopMapBgm?.();
    }
    this.engine.stop();
    this.onTriggerDialogue(sceneId, transitionType ?? 'fade-black');
  }

  /**
   * Called when the VN dialogue is closed (from React side).
   * Resumes the engine.
   */
  resumeAfterDialogue(): void {
    this.isDialogueOpen = false;
    if (this.engine.isRunning()) return; // Guard: don't start if already running (isRunning is a METHOD in ex v0.32)
    this.engine.start();
    this.onResumeBgm?.();
  }

  /**
   * Called when the player exits to another map.
   * @param targetMapId - ID of the destination map
   * @param targetPos - Spawn position in the target map (grid pixels)
   */
  triggerMapExit(targetMapId: string, targetPos: { x: number; y: number }): void {
    this.onTriggerMapExit(targetMapId, targetPos);
  }

  /** Called by GameScene when the player enters an interact-mode zone. */
  showInteractPrompt(): void {
    this.onShowInteractPromptCb?.();
  }

  /** Called by GameScene when the player leaves all interact-mode zones. */
  hideInteractPrompt(): void {
    this.onHideInteractPromptCb?.();
  }

  /**
   * Called by GameScene when the player activates a sign zone.
   * Pauses the engine and shows the text popup via React.
   */
  showSignPopup(text: string): void {
    if (this.isSignOpen || this.isDialogueOpen) return;
    if (!this.engine.isRunning()) return; // isRunning is a METHOD in ex v0.32
    this.isSignOpen = true;
    this.engine.stop();
    this.onShowSignPopupCb?.(text);
  }

  /**
   * Called from React when the sign popup is closed.
   * Resumes the engine.
   */
  hideSignPopup(): void {
    this.isSignOpen = false;
    if (!this.engine.isRunning()) {
      // isRunning is a METHOD in ex v0.32
      this.engine.start();
      this.onResumeBgm?.();
    }
    this.onHideSignPopupCb?.();
  }
}
