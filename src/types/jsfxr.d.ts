/**
 * Type declarations for jsfxr v1.4.x
 * https://github.com/grumdrig/jsfxr
 *
 * Generates 8-bit procedural SFX (jump, coin, explosion…) via Web Audio API.
 * Zero audio files required.
 */
declare module 'jsfxr' {
  /** Raw synthesis parameters. Most values are 0.0–1.0 unless noted. */
  class Params {
    /** Waveform: 0=SQUARE, 1=SAWTOOTH, 2=SINE, 3=NOISE */
    wave_type: 0 | 1 | 2 | 3;
    /** Base pitch (0.1 = très grave, 0.9 = très aigu) */
    p_base_freq: number;
    p_freq_limit: number;
    /** Glissement de pitch. Positif = monte, négatif = descend */
    p_freq_ramp: number;
    p_freq_dramp: number;
    p_vib_strength: number;
    p_vib_speed: number;
    p_env_attack: number;
    p_env_sustain: number;
    p_env_punch: number;
    /** Durée du son (plus la valeur est haute, plus le son est long) */
    p_env_decay: number;
    p_arp_mod: number;
    p_arp_speed: number;
    p_duty: number;
    p_duty_ramp: number;
    p_repeat_speed: number;
    p_pha_offset: number;
    p_pha_ramp: number;
    p_lpf_freq: number;
    p_lpf_ramp: number;
    p_lpf_resonance: number;
    p_hpf_freq: number;
    p_hpf_ramp: number;
    /** Volume principal */
    sound_vol: number;
    sample_rate: number;
    sample_size: number;

    // ── Preset generators (remplissent les paramètres avec un preset) ─────────
    pickupCoin(): void;
    laserShoot(): void;
    explosion(): void;
    powerUp(): void;
    hitHurt(): void;
    jump(): void;
    blipSelect(): void;
    random(): void;
    mutate(): void;
  }

  interface SfxrAPI {
    /** Joue un son à partir de paramètres Params ou d'un objet JSON */
    play(sound: unknown): HTMLAudioElement;
    /** Retourne un HTMLAudioElement (appeler .play() manuellement) */
    toAudio(sound: unknown): HTMLAudioElement;
    /** Retourne un AudioBufferSourceNode (à connecter à un AudioContext existant) */
    toWebAudio(sound: unknown, ctx?: AudioContext): AudioBufferSourceNode;
    /** Génère un son à partir du nom d'un algorithme, retourne un objet Params */
    generate(
      algorithm:
        | 'pickupCoin'
        | 'laserShoot'
        | 'explosion'
        | 'powerUp'
        | 'hitHurt'
        | 'jump'
        | 'blipSelect'
        | 'synth'
        | 'tone'
        | 'click'
        | 'random',
      options?: Record<string, number>
    ): Params;
    toWave(sound: unknown): { dataURI: string };
  }

  export const sfxr: SfxrAPI;
  export const waveforms: {
    readonly SQUARE: 0;
    readonly SAWTOOTH: 1;
    readonly SINE: 2;
    readonly NOISE: 3;
  };

  const jsfxr: { sfxr: SfxrAPI; Params: typeof Params; waveforms: typeof waveforms };
  export default jsfxr;
}
