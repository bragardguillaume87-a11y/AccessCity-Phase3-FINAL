import type { Character } from '@/types/characters';

/**
 * Résout l'URL du sprite actif d'un personnage selon son mood.
 *
 * Ordre de priorité :
 *  1. `sprites[mood]`    — mood demandé
 *  2. `sprites['neutral']` — mood de secours universel
 *  3. premier sprite disponible (Object.values)
 *  4. null
 *
 * Source canonique partagée entre tous les consumers d'affichage de personnage.
 * Ne pas dupliquer cette logique — toute modification s'applique partout.
 *
 * @consumers useSpeakerLayout · useCharacterAvatar · PreviewPlayer ·
 *            CinematicPlayer · DialogueComposerV2 · DialogueComposer ·
 *            DistributionModule · CharacterRoster
 */
export function resolveCharacterSprite(
  character: Character | null | undefined,
  mood?: string | null
): string | null {
  const sprites = character?.sprites;
  if (!sprites) return null;
  if (mood && sprites[mood]) return sprites[mood];
  return sprites['neutral'] ?? Object.values(sprites)[0] ?? null;
}

/**
 * Détermine si un speaker est le narrateur.
 *
 * Règles (par ordre de priorité) :
 *  1. Pas de speaker assigné → narrateur par convention VN (style Octopath Traveler)
 *  2. ID/nom === 'narrator' → narrateur explicite
 *  3. `char.role === 'narrator'` → rôle défini dans la bibliothèque
 *
 * Source canonique partagée avec useSpeakerLayout.
 * Passer `char` déjà résolu (ne fait pas de lookup dans la bibliothèque).
 */
export function isNarratorSpeaker(
  speakerIdOrName: string | null | undefined,
  char?: Pick<Character, 'role'> | null
): boolean {
  if (!speakerIdOrName) return true;
  if (speakerIdOrName === 'narrator') return true;
  return char?.role === 'narrator';
}
