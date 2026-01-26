/**
 * Système de gestion des z-index pour les modales et overlays
 *
 * Ce fichier centralise tous les z-index pour éviter les conflits
 * entre les différentes couches de l'interface (modales, dialogs, toasts, etc.)
 *
 * IMPORTANT : Toujours utiliser ces constantes au lieu de valeurs hardcodées
 */

import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

interface ZIndexLayers {
  readonly CANVAS_GRID: number;
  readonly CANVAS_BACKGROUND: number;
  readonly CANVAS_CHARACTER_MIN: number;
  readonly CANVAS_CHARACTER_MAX: number;
  readonly CANVAS_PROPS: number;
  readonly CANVAS_TEXTBOXES: number;
  readonly CANVAS_DIALOGUE_OVERLAY: number;
  readonly CANVAS_FLOATING_BUTTONS: number;
  readonly DIALOG_BASE: number;
  readonly DIALOG_NESTED: number;
  readonly ALERT_DIALOG: number;
  readonly ONBOARDING: number;
  readonly TOAST: number;
}

export type ZIndexLayerKey = keyof ZIndexLayers;

// ============================================================================
// CONSTANTS
// ============================================================================

export const Z_INDEX: ZIndexLayers = {
  // Canvas layers - Scene editor (MainCanvas)
  CANVAS_GRID: 0,
  CANVAS_BACKGROUND: 0,
  CANVAS_CHARACTER_MIN: 1,
  CANVAS_CHARACTER_MAX: 10,
  CANVAS_PROPS: 15,           // Props (emoji objects) - between characters and dialogue overlay
  CANVAS_TEXTBOXES: 18,       // Text boxes - above props, below dialogue overlay
  CANVAS_DIALOGUE_OVERLAY: 20,
  CANVAS_FLOATING_BUTTONS: 30,

  // Base layer - Dialog shadcn/ui standard
  DIALOG_BASE: 50,

  // Nested dialogs - Dialog imbriqué (ex: CharacterEditorModal dans CharactersModal)
  DIALOG_NESTED: 60,

  // Alert dialogs - Confirmations critiques (ex: ConfirmModal)
  ALERT_DIALOG: 70,

  // Onboarding - Plus prioritaire que tout (sauf toasts)
  ONBOARDING: 80,

  // Toasts - Notifications temporaires au-dessus de tout
  TOAST: 90,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Utilitaire pour obtenir le z-index sous forme de className Tailwind
 *
 * @param layer - Nom de la couche
 * @returns Classe Tailwind (ex: "z-[50]")
 *
 * @example
 * <div className={getZIndexClass('DIALOG_BASE')} />
 * // Résultat: <div className="z-[50]" />
 */
export function getZIndexClass(layer: ZIndexLayerKey): string {
  const zIndex = Z_INDEX[layer];
  if (zIndex === undefined) {
    logger.warn(`⚠️ zIndexLayers: Layer "${layer}" n'existe pas. Utilisation de DIALOG_BASE par défaut.`);
    return `z-[${Z_INDEX.DIALOG_BASE}]`;
  }
  return `z-[${zIndex}]`;
}

/**
 * Utilitaire pour obtenir le z-index sous forme de valeur numérique
 *
 * @param layer - Nom de la couche
 * @returns Valeur numérique du z-index
 *
 * @example
 * <div style={{ zIndex: getZIndexValue('DIALOG_BASE') }} />
 * // Résultat: <div style={{ zIndex: 50 }} />
 */
export function getZIndexValue(layer: ZIndexLayerKey): number {
  const zIndex = Z_INDEX[layer];
  if (zIndex === undefined) {
    logger.warn(`⚠️ zIndexLayers: Layer "${layer}" n'existe pas. Utilisation de DIALOG_BASE par défaut.`);
    return Z_INDEX.DIALOG_BASE;
  }
  return zIndex;
}

/**
 * Documentation des usages
 *
 * CANVAS_GRID (0):
 * - Grid overlay sur le canvas de scène
 * - Background pattern
 *
 * CANVAS_BACKGROUND (0):
 * - Image de fond de la scène
 * - Placeholder "No background set"
 *
 * CANVAS_CHARACTER_MIN/MAX (1-10):
 * - Sprites de personnages sur le canvas
 * - Z-index contrôlé par l'utilisateur (foreground/background layering)
 * - Min: arrière-plan, Max: premier plan
 *
 * CANVAS_DIALOGUE_OVERLAY (20):
 * - Dialogue preview overlay au bas du canvas
 * - Toujours au-dessus des personnages pour éviter occlusion
 *
 * CANVAS_FLOATING_BUTTONS (30):
 * - Boutons flottants (Add Character, etc.)
 * - Au-dessus de tout dans le canvas
 *
 * DIALOG_BASE (50):
 * - Dialog shadcn/ui standard
 * - CharactersModal, AssetsLibraryModal, SettingsModal, etc.
 * - BaseModal (deprecated)
 *
 * DIALOG_NESTED (60):
 * - Dialog imbriqué dans un autre Dialog
 * - CharacterEditorModal (ouvert depuis CharactersModal)
 * - Sprite picker popover dans CharacterEditorModal
 *
 * ALERT_DIALOG (70):
 * - AlertDialog shadcn/ui pour confirmations
 * - ConfirmModal (après migration)
 * - Dialogs critiques nécessitant l'attention immédiate
 *
 * ONBOARDING (80):
 * - OnboardingModal (guide utilisateur)
 * - Tutoriels interactifs
 * - Doit être au-dessus de tout sauf toasts
 *
 * TOAST (90):
 * - Notifications temporaires (Sonner)
 * - Messages de succès/erreur
 * - Toujours au-dessus de tout
 */
