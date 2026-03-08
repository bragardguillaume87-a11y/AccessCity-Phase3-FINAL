/**
 * voiceProfiles — Profils vocaux procéduraux pour les dialogues.
 *
 * Synthèse Web Audio uniquement (zéro fichier audio requis).
 * Chaque profil produit un "blip" caractéristique du type de voix.
 *
 * Usage :
 * ```typescript
 * import { VOICE_PROFILES, playVoicePreview, getVoiceProfile } from '@/utils/voiceProfiles';
 * playVoicePreview('homme-joyeux'); // joue un blip de prévisualisation
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceProfile {
  /** Identifiant technique (stocké dans Dialogue.voicePreset) */
  id: string;
  /** Libellé affiché (FR) */
  label: string;
  /** Emoji représentatif */
  emoji: string;
  /** Catégorie pour regroupement dans le picker */
  category: 'humain' | 'animal' | 'special';
  /** Paramètres Web Audio pour le blip de typewriter */
  blip: {
    pitch: number;
    waveform: OscillatorType;
    duration: number;
    volume: number;
    pitchVariance: number;
  };
}

// ============================================================================
// PROFILS VOCAUX
// ============================================================================

export const VOICE_PROFILES: readonly VoiceProfile[] = [
  // ── HUMAIN — Homme ────────────────────────────────────────────────────────
  {
    id: 'homme-neutre',
    label: 'Homme',
    emoji: '🎙️',
    category: 'humain',
    blip: { pitch: 160, waveform: 'sawtooth', duration: 0.055, volume: 0.22, pitchVariance: 15 },
  },
  {
    id: 'homme-joyeux',
    label: 'Homme joyeux',
    emoji: '😄',
    category: 'humain',
    // Ton plus haut, plus court, plus vif
    blip: { pitch: 200, waveform: 'sine',     duration: 0.040, volume: 0.26, pitchVariance: 30 },
  },
  {
    id: 'homme-colere',
    label: 'Homme en colère',
    emoji: '😠',
    category: 'humain',
    // Ton bas, rugueux, forte variance
    blip: { pitch: 130, waveform: 'sawtooth', duration: 0.065, volume: 0.30, pitchVariance: 45 },
  },

  // ── HUMAIN — Femme ────────────────────────────────────────────────────────
  {
    id: 'femme-neutre',
    label: 'Femme',
    emoji: '🎤',
    category: 'humain',
    blip: { pitch: 260, waveform: 'sine',     duration: 0.045, volume: 0.25, pitchVariance: 25 },
  },
  {
    id: 'femme-joyeuse',
    label: 'Femme joyeuse',
    emoji: '😊',
    category: 'humain',
    blip: { pitch: 320, waveform: 'sine',     duration: 0.038, volume: 0.28, pitchVariance: 40 },
  },
  {
    id: 'femme-triste',
    label: 'Femme triste',
    emoji: '😢',
    category: 'humain',
    // Ton plus bas, lent, doux
    blip: { pitch: 210, waveform: 'triangle', duration: 0.070, volume: 0.18, pitchVariance: 10 },
  },

  // ── HUMAIN — Enfant ───────────────────────────────────────────────────────
  {
    id: 'enfant',
    label: 'Enfant',
    emoji: '👦',
    category: 'humain',
    // Très haut, court, grande variance
    blip: { pitch: 520, waveform: 'sine',     duration: 0.032, volume: 0.28, pitchVariance: 60 },
  },
  {
    id: 'enfant-excite',
    label: 'Enfant excité',
    emoji: '🤩',
    category: 'humain',
    blip: { pitch: 600, waveform: 'sine',     duration: 0.028, volume: 0.32, pitchVariance: 80 },
  },

  // ── HUMAIN — Vieux ────────────────────────────────────────────────────────
  {
    id: 'vieux',
    label: 'Ancien',
    emoji: '🧓',
    category: 'humain',
    // Bas, lent, ondulé
    blip: { pitch: 140, waveform: 'triangle', duration: 0.080, volume: 0.18, pitchVariance: 22 },
  },

  // ── SPÉCIAL ───────────────────────────────────────────────────────────────
  {
    id: 'narrateur',
    label: 'Narrateur',
    emoji: '📖',
    category: 'special',
    // Neutre, doux, précis
    blip: { pitch: 340, waveform: 'sine',     duration: 0.040, volume: 0.15, pitchVariance: 10 },
  },
  {
    id: 'robot',
    label: 'Robot',
    emoji: '🤖',
    category: 'special',
    // Carré, aucune variance
    blip: { pitch: 220, waveform: 'square',   duration: 0.040, volume: 0.20, pitchVariance: 3  },
  },

  // ── ANIMAL ────────────────────────────────────────────────────────────────
  {
    id: 'chien',
    label: 'Chien',
    emoji: '🐕',
    category: 'animal',
    // Court, tonique, forte variance
    blip: { pitch: 350, waveform: 'sawtooth', duration: 0.075, volume: 0.30, pitchVariance: 70 },
  },
  {
    id: 'chat',
    label: 'Chat',
    emoji: '🐱',
    category: 'animal',
    // Sinusoïde douce, très variable
    blip: { pitch: 500, waveform: 'triangle', duration: 0.060, volume: 0.22, pitchVariance: 90 },
  },
] as const;

// ============================================================================
// UTILS
// ============================================================================

/** Retourne le profil vocal par ID, ou undefined. */
export function getVoiceProfile(id: string): VoiceProfile | undefined {
  return VOICE_PROFILES.find(p => p.id === id);
}

/** Retourne l'emoji du profil, fallback '🔊'. */
export function getVoiceEmoji(id: string): string {
  return getVoiceProfile(id)?.emoji ?? '🔊';
}

/** Retourne le label du profil, fallback ID capitalisé. */
export function getVoiceLabel(id: string): string {
  const p = getVoiceProfile(id);
  if (p) return p.label;
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Joue un court blip de prévisualisation pour un profil vocal.
 * Utilise Web Audio API directement (sans dépendance à AudioManager).
 * Safe à appeler dans un gestionnaire d'événement (click, hover).
 */
export function playVoicePreview(profileId: string): void {
  const profile = getVoiceProfile(profileId);
  if (!profile) return;

  try {
    const ctx = new AudioContext();
    const { pitch, waveform, duration, volume, pitchVariance } = profile.blip;

    // Joue 2 blips rapides (simuler une syllabe)
    const playBlip = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const variance = (Math.random() - 0.5) * 2 * pitchVariance;
      osc.frequency.value = pitch + variance;
      osc.type = waveform;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.2);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playBlip(now);
    playBlip(now + duration * 1.3);

    // Ferme le contexte après lecture
    setTimeout(() => ctx.close(), (duration * 2 + 0.2) * 1000);
  } catch {
    // Silently fail if AudioContext unavailable
  }
}
