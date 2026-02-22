import { useMemo } from 'react';
import { hashStringToColor } from '@/components/ui/DialogueBox';
import type { Character, SceneCharacter } from '@/types';
import type { DialogueBoxStyle } from '@/types/scenes';

interface UseSpeakerLayoutParams {
  /** Valeur brute de dialogue.speaker — peut être un ID ("counsellor") ou un nom affiché. */
  speakerNameOrId: string | undefined;
  sceneCharacters: SceneCharacter[];
  characterLibrary: Character[];
  config: Required<DialogueBoxStyle>;
  /**
   * Overrides d'humeur dynamiques — clé = sceneCharacterId, valeur = moodId.
   * Uniquement utilisé dans PreviewPlayer (effets `characterMoods` des dialogues).
   */
  moodOverrides?: Record<string, string>;
}

interface SpeakerLayout {
  /** Nom du personnage résolu depuis la bibliothèque (fallback = valeur brute). */
  speakerDisplayName: string;
  /** Vrai si le speaker est positionné sur la moitié droite du canvas (x ≥ 50 %). */
  speakerIsOnRight: boolean;
  /** URL du sprite actif du speaker (null si pas de correspondance ou showPortrait=false). */
  speakerPortraitUrl: string | null;
  /** Couleur HSL stable dérivée du nom du speaker. */
  speakerColor: string;
}

/**
 * Résout le SceneCharacter correspondant à un speaker de dialogue.
 *
 * Stratégie de matching (ordre de priorité) :
 *   1. ID exact — `sc.characterId === speakerNameOrId` (le plus fiable, c'est le stockage réel)
 *   2. Nom exact (case-insensitive) — rétrocompatibilité si des dialogues stockent le nom
 *   3. Préfixe bidirectionnel (≥ 3 chars) — "Conseiller" ↔ "Conseiller Municipal"
 */
function resolveSceneChar(
  speakerNameOrId: string,
  sceneCharacters: SceneCharacter[],
  characterLibrary: Character[],
): SceneCharacter | null {
  const lower = speakerNameOrId.toLowerCase().trim();
  if (!lower) return null;

  return sceneCharacters.find(sc => {
    // 1. ID exact (le dialogue.speaker stocke l'ID du personnage)
    if (sc.characterId === speakerNameOrId) return true;

    const char = characterLibrary.find(c => c.id === sc.characterId);
    const charNameLower = char?.name?.toLowerCase().trim() ?? '';
    if (!charNameLower) return false;

    // 2. Nom exact (case-insensitive)
    if (charNameLower === lower) return true;

    // 3. Préfixe bidirectionnel (≥ 3 chars pour limiter les faux positifs)
    const minLen = Math.min(charNameLower.length, lower.length);
    if (minLen >= 3) {
      return charNameLower.startsWith(lower) || lower.startsWith(charNameLower);
    }
    return false;
  }) ?? null;
}

/**
 * useSpeakerLayout — Calcule le nom affiché, le côté, le portrait et la couleur du speaker.
 *
 * Source unique de vérité partagée entre PreviewPlayer et DialoguePreviewOverlay.
 * Toute correction ici s'applique aux deux contextes simultanément.
 *
 * ⚠️ dialogue.speaker contient l'ID du personnage (ex: "counsellor"), pas le nom.
 *    Ce hook résout l'ID → nom (ex: "Maire") avant de le retourner.
 */
export function useSpeakerLayout({
  speakerNameOrId,
  sceneCharacters,
  characterLibrary,
  config,
  moodOverrides = {},
}: UseSpeakerLayoutParams): SpeakerLayout {
  const speakerSceneChar = useMemo(
    () => speakerNameOrId
      ? resolveSceneChar(speakerNameOrId, sceneCharacters, characterLibrary)
      : null,
    [speakerNameOrId, sceneCharacters, characterLibrary],
  );

  /** Nom affiché : résolu depuis la bibliothèque, ou fallback sur la valeur brute. */
  const speakerDisplayName = useMemo(() => {
    if (!speakerNameOrId) return '';
    if (!speakerSceneChar) {
      // Dernier recours : chercher par ID direct dans la bibliothèque (hors scène)
      const char = characterLibrary.find(c => c.id === speakerNameOrId);
      return char?.name ?? speakerNameOrId;
    }
    const char = characterLibrary.find(c => c.id === speakerSceneChar.characterId);
    return char?.name ?? speakerNameOrId;
  }, [speakerNameOrId, speakerSceneChar, characterLibrary]);

  const speakerIsOnRight = useMemo(
    () => config.speakerAlign === 'left'
      ? false
      : (speakerSceneChar?.position.x ?? 0) >= 50,
    [speakerSceneChar, config.speakerAlign],
  );

  const speakerPortraitUrl = useMemo(() => {
    if (!config.showPortrait) return null;

    if (speakerSceneChar) {
      // Cas principal : speaker placé sur la scène → utilise son mood courant
      const char = characterLibrary.find(c => c.id === speakerSceneChar.characterId);
      if (!char?.sprites) return null;
      const mood = moodOverrides[speakerSceneChar.id] ?? speakerSceneChar.mood ?? 'neutral';
      return char.sprites[mood]
        ?? char.sprites['neutral']
        ?? Object.values(char.sprites)[0]
        ?? null;
    }

    // Fallback : speaker dans la bibliothèque mais non placé sur le canvas
    // (ex. protagoniste narrateur, PNJ hors-scène)
    if (speakerNameOrId) {
      const char = characterLibrary.find(c => c.id === speakerNameOrId);
      if (!char?.sprites) return null;
      return char.sprites['neutral']
        ?? Object.values(char.sprites)[0]
        ?? null;
    }

    return null;
  }, [speakerSceneChar, speakerNameOrId, characterLibrary, config.showPortrait, moodOverrides]);

  const speakerColor = useMemo(
    () => speakerDisplayName ? hashStringToColor(speakerDisplayName) : '#22d3ee',
    [speakerDisplayName],
  );

  return { speakerDisplayName, speakerIsOnRight, speakerPortraitUrl, speakerColor };
}
