/**
 * Braille patterns — 26 lettres, disposition 2×3 (6 points : 1-3 colonne gauche, 4-6 colonne droite)
 * Format : [p1, p2, p3, p4, p5, p6] — true = point actif
 *
 * Source : table Braille Grade 1 (standard internationnal ISO 17049)
 */
export const BRAILLE_PATTERNS: Record<
  string,
  [boolean, boolean, boolean, boolean, boolean, boolean]
> = {
  A: [true, false, false, false, false, false],
  B: [true, true, false, false, false, false],
  C: [true, false, false, true, false, false],
  D: [true, false, false, true, true, false],
  E: [true, false, false, false, true, false],
  F: [true, true, false, true, false, false],
  G: [true, true, false, true, true, false],
  H: [true, true, false, false, true, false],
  I: [false, true, false, true, false, false],
  J: [false, true, false, true, true, false],
  K: [true, false, true, false, false, false],
  L: [true, true, true, false, false, false],
  M: [true, false, true, true, false, false],
  N: [true, false, true, true, true, false],
  O: [true, false, true, false, true, false],
  P: [true, true, true, true, false, false],
  Q: [true, true, true, true, true, false],
  R: [true, true, true, false, true, false],
  S: [false, true, true, true, false, false],
  T: [false, true, true, true, true, false],
  U: [true, false, true, false, false, true],
  V: [true, true, true, false, false, true],
  W: [false, true, false, true, true, true],
  X: [true, false, true, true, false, true],
  Y: [true, false, true, true, true, true],
  Z: [true, false, true, false, true, true],
};

/** Letters available for the minigame (same 26 letters) */
export const BRAILLE_LETTERS = Object.keys(BRAILLE_PATTERNS) as (keyof typeof BRAILLE_PATTERNS)[];
