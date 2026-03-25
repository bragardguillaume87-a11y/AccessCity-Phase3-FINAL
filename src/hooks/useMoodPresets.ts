/**
 * useMoodPresets - Hook fournissant les presets d'humeur pour les personnages
 *
 * Retourne une liste de templates d'humeur utilisables dans tout l'éditeur.
 * Chaque preset contient : ID (clé technique), label (FR), emoji et description (FR).
 *
 * @returns {ReadonlyArray<MoodPreset>} Tableau de configurations de presets
 *
 * @example
 * ```typescript
 * const presets = useMoodPresets();
 * console.log(presets[0]); // { id: 'neutral', label: 'Neutre', emoji: '😐', ... }
 * ```
 */

import type { MoodPreset } from '@/types';

// Mood presets constant (used by both hook and utility functions)
const MOOD_PRESETS: readonly MoodPreset[] = [
  // ── Preset de base ─────────────────────────────────────────────────────────
  { id: 'neutral', label: 'Neutre', emoji: '😐', description: 'Expression calme, par défaut' },
  { id: 'default', label: 'Par défaut', emoji: '😐', description: 'Mood par défaut du personnage' },
  { id: 'happy', label: 'Joyeux', emoji: '😊', description: 'Humeur positive et joyeuse' },
  { id: 'sad', label: 'Triste', emoji: '😢', description: 'Expression abattue, mélancolique' },
  { id: 'angry', label: 'En colère', emoji: '😠', description: 'Humeur frustrée, irritée' },
  { id: 'surprised', label: 'Surpris', emoji: '😲', description: 'Expression choquée, étonnée' },
  { id: 'confused', label: 'Confus', emoji: '😕', description: 'Humeur perplexe, incertaine' },
  { id: 'scared', label: 'Effrayé', emoji: '😨', description: 'Expression apeurée, craintive' },
  {
    id: 'excited',
    label: 'Enthousiaste',
    emoji: '🤩',
    description: "Humeur dynamique, pleine d'énergie",
  },
  {
    id: 'professional',
    label: 'Professionnel',
    emoji: '👔',
    description: 'Attitude formelle et sérieuse',
  },
  {
    id: 'helpful',
    label: 'Serviable',
    emoji: '🤝',
    description: 'Attitude amicale et coopérative',
  },
  { id: 'tired', label: 'Fatigué', emoji: '😴', description: 'Expression épuisée, lasse' },
  {
    id: 'thoughtful',
    label: 'Pensif',
    emoji: '🤔',
    description: 'Humeur contemplative, réfléchie',
  },
  // ── Moods étendus ──────────────────────────────────────────────────────────
  { id: 'amused', label: 'Amusé', emoji: '😄', description: 'Amusement, légèreté' },
  { id: 'concerned', label: 'Préoccupé', emoji: '😟', description: 'Inquiet, soucieux' },
  { id: 'ironic', label: 'Ironique', emoji: '😏', description: 'Ton sarcastique ou moqueur' },
  { id: 'nervous', label: 'Nerveux', emoji: '😰', description: 'Anxieux, tendu' },
  { id: 'proud', label: 'Fier', emoji: '😤', description: 'Confiant, satisfait de soi' },
  { id: 'embarrassed', label: 'Gêné', emoji: '😳', description: "Mal à l'aise, honteux" },
  { id: 'disgusted', label: 'Dégoûté', emoji: '🤢', description: 'Répulsion, aversion' },
  { id: 'flirty', label: 'Flirteur', emoji: '😘', description: 'Charmeur, enjoleur' },
  { id: 'determined', label: 'Déterminé', emoji: '😤', description: 'Résolu, volontaire' },
  { id: 'mysterious', label: 'Mystérieux', emoji: '🤫', description: 'Énigmatique, secret' },
  {
    id: 'melancholic',
    label: 'Mélancolique',
    emoji: '😔',
    description: 'Nostalgie, tristesse douce',
  },
  { id: 'playful', label: 'Espiègle', emoji: '😜', description: 'Joueur, taquin' },
  { id: 'serious', label: 'Sérieux', emoji: '😶', description: 'Grave, sans humour' },
  { id: 'hopeful', label: "Plein d'espoir", emoji: '🥺', description: 'Optimiste, rêveur' },
  { id: 'grateful', label: 'Reconnaissant', emoji: '🙏', description: 'Gratitude, sincère' },
] as const;

export function useMoodPresets(): readonly MoodPreset[] {
  return MOOD_PRESETS;
}

/**
 * Retourne un preset par son ID.
 * Retourne undefined si l'ID est inconnu.
 *
 * @param {string} id - Identifiant technique du preset (ex: 'happy')
 * @returns {MoodPreset | undefined} Le preset correspondant, ou undefined
 *
 * @example
 * ```typescript
 * const happy = getMoodPreset('happy');
 * console.log(happy?.label); // 'Joyeux'
 * console.log(happy?.emoji); // '😊'
 * ```
 */
function getMoodPreset(id: string): MoodPreset | undefined {
  return MOOD_PRESETS.find((preset) => preset.id === id);
}

/**
 * Retourne le label traduit pour un mood ID.
 * Si l'ID ne correspond à aucun preset, retourne l'ID lui-même (capitalisé).
 *
 * @param {string} id - Identifiant du mood
 * @returns {string} Label en français (ex: "Joyeux") ou l'ID en fallback
 */
export function getMoodLabel(id: string): string {
  const preset = getMoodPreset(id);
  if (preset) return preset.label;
  // Fallback : capitalise l'ID pour les humeurs custom non-preset
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Retourne l'emoji pour un mood ID.
 * Fallback : '💭' pour les humeurs custom.
 *
 * @param {string} id - Identifiant du mood
 * @returns {string} Emoji (ex: '😊') ou '💭' en fallback
 */
export function getMoodEmoji(id: string): string {
  return getMoodPreset(id)?.emoji ?? '💭';
}
