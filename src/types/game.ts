/** Game statistics as key-value pairs */
export interface GameStats {
  [key: string]: number;
}

export interface DiceCheckBranch {
  nextSceneId?: string;
  nextDialogueId?: string;
  /** Effet simple sur une stat : positif = récompense, négatif = pénalité */
  statEffect?: {
    stat: string;
    amount: number;
  };
}

export interface DiceCheck {
  stat: string;
  difficulty: number;
  success?: DiceCheckBranch;
  failure?: DiceCheckBranch;
}

type ConditionOperator = '>=' | '<=' | '>' | '<' | '==' | '!=';

export interface Condition {
  variable: string;
  operator: ConditionOperator;
  value: number;
}

// ── Effects — union discriminée ────────────────────────────────────────────────

/** Modification de variable numérique (comportement existant). */
export interface StatEffect {
  variable: string;
  value: number;
  operation: 'add' | 'set' | 'multiply';
}

/** Tremblement d'écran déclenché en milieu de dialogue. */
export interface ScreenShakeEffect {
  operation: 'screenShake';
  /** Intensité 1-10 */
  intensity: number;
  /** Durée en ms (200-2000) */
  duration: number;
}

/** Filtre de simulation de daltonisme appliqué au canvas PreviewPlayer. */
export interface ColorFilterEffect {
  operation: 'colorFilter';
  filterType: 'deuteranopia' | 'protanopia' | 'tritanopia' | 'none';
}

/**
 * Effet déclenché par un choix de dialogue.
 * - StatEffect : modification de variable numérique
 * - ScreenShakeEffect : tremblement d'écran
 * - ColorFilterEffect : filtre de daltonisme
 *
 * Guard : `'variable' in effect` → StatEffect
 *         `effect.operation === 'screenShake'` → ScreenShakeEffect
 *         `effect.operation === 'colorFilter'` → ColorFilterEffect
 */
export type Effect = StatEffect | ScreenShakeEffect | ColorFilterEffect;

// ── Mini-jeux ────────────────────────────────────────────────────────────────

export type MinigameType = 'falc' | 'qte' | 'braille';

export interface MinigameConfig {
  type: MinigameType;
  /** Difficulté 1-5 (contrôle le timeout et la complexité) */
  difficulty: number;
  /** Durée limite totale en ms. undefined ou 0 = sans limite. */
  timeout?: number;
  /** FALC : séquence ordonnée attendue (les items seront mélangés à l'affichage) */
  items?: string[];
  /** QTE : touches à appuyer dans l'ordre */
  keySequence?: string[];

  // ── Braille word mode ────────────────────────────────────────────────────────
  /** 'letter' (défaut) : deviner une seule lettre. 'word' : mode pendu, mot complet. */
  brailleMode?: 'letter' | 'word';
  /** Mots définis par l'auteur (mode mot). Sélection aléatoire ou selon diceResult. */
  brailleWords?: string[];
  /** Lettres ciblées par l'auteur (mode lettre). Pool de sélection aléatoire. Vide = toutes les lettres. */
  brailleLetters?: string[];
  /** Nombre de vies en mode pendu (défaut 6). */
  brailleLives?: number;
  /** Utiliser le résultat du dernier jet de dés pour choisir la difficulté du mot. */
  brailleUseDice?: boolean;
  /** Résultat du dé injecté à l'exécution (1-20). Non stocké dans le scénario. */
  brailleDiceResult?: number;

  // ── Effets sur les stats ─────────────────────────────────────────────────────
  /** Pénalité appliquée sur une stat en cas d'échec. */
  failurePenalty?: { variable: string; amount: number };

  /** Branche sur succès */
  onSuccess?: { nextDialogueId?: string };
  /** Branche sur échec */
  onFailure?: { nextDialogueId?: string };
}
