/**
 * AudioManager - Singleton for managing audio playback
 *
 * Uses a hybrid approach:
 * - HTML5 Audio + Web Audio API for BGM (streaming support)
 * - Web Audio API AudioBuffer for SFX (precise timing)
 *
 * Features:
 * - Fade in/out transitions for BGM
 * - Volume control per category
 * - SFX preloading and caching
 * - Crossfade support for scene transitions
 */

import type { SceneAudio, DialogueAudio, AmbientAudio } from '@/types';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { logger } from './logger';

// ============================================================================
// PROCEDURAL AUDIO — Types & Presets
// ============================================================================

/**
 * Options for a synthesized text blip.
 * Each property is optional — defaults give a neutral "narrator" voice.
 */
export interface BlipOptions {
  /** Base pitch in Hz (default: 440) */
  pitch?: number;
  /** Oscillator waveform (default: 'sine') */
  waveform?: OscillatorType;
  /** Blip duration in seconds (default: 0.04) */
  duration?: number;
  /** Volume 0-1 (default: 0.3) */
  volume?: number;
  /** Random pitch variance ±Hz for a natural feel (default: 30) */
  pitchVariance?: number;
}

/** Sound identifiers for common UI events */
export type UISound =
  | 'click'      // Short percussive tap
  | 'confirm'    // Ascending two-tone (C5 → E5)
  | 'cancel'     // Descending two-tone (C5 → G4)
  | 'success'    // Major arpeggio (C5-E5-G5-C6)
  | 'error'      // Low square-wave buzz
  | 'hover'      // Barely audible high blip
  | 'diceRoll';  // Rolling blips + landing thud

/**
 * Built-in voice presets for character text blips.
 *
 * Usage:
 * ```typescript
 * audioManager.playBlip(VOICE_PRESETS.child);
 * audioManager.playBlip(VOICE_PRESETS[character.voicePreset ?? 'narrator']);
 * ```
 */
export const VOICE_PRESETS: Record<string, Required<BlipOptions>> = {
  /** High, bright — young character */
  child:    { pitch: 660, waveform: 'sine',     duration: 0.035, volume: 0.25, pitchVariance: 40 },
  /** Mid-range, warm — adult character */
  adult:    { pitch: 380, waveform: 'sine',     duration: 0.050, volume: 0.25, pitchVariance: 20 },
  /** Low, slow — elderly character */
  elder:    { pitch: 270, waveform: 'triangle', duration: 0.065, volume: 0.20, pitchVariance: 15 },
  /** Electronic buzz — robot / machine */
  robot:    { pitch: 220, waveform: 'square',   duration: 0.040, volume: 0.20, pitchVariance:  5 },
  /** Neutral, subtle — narrator / system */
  narrator: { pitch: 400, waveform: 'sine',     duration: 0.040, volume: 0.15, pitchVariance: 10 },
};

export type VoicePresetKey = keyof typeof VOICE_PRESETS;

// Default configuration
const DEFAULT_CONFIG = {
  masterVolume: 1,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  voiceVolume: 0.8,
  muted: false,
  fadeInDuration: 1, // seconds
  fadeOutDuration: 0.5, // seconds
};

type AudioConfig = typeof DEFAULT_CONFIG;

class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // BGM state
  private currentBgm: HTMLAudioElement | null = null;
  private bgmSourceNode: MediaElementAudioSourceNode | null = null;
  private currentBgmUrl: string | null = null;

  // Ambient state (max 2 independent slots)
  private ambientPlayers: [HTMLAudioElement | null, HTMLAudioElement | null] = [null, null];
  private ambientGains:   [GainNode | null, GainNode | null]                  = [null, null];
  private ambientSources: [MediaElementAudioSourceNode | null, MediaElementAudioSourceNode | null] = [null, null];
  private ambientUrls:    [string | null, string | null]                      = [null, null];

  // SFX buffer cache
  private sfxBuffers: Map<string, AudioBuffer> = new Map();

  // Configuration
  private config: AudioConfig = { ...DEFAULT_CONFIG };

  // Initialization state
  private initialized = false;

  // Blip throttle — avoids audio saturation when text renders fast
  private lastBlipTime = 0;
  private static readonly MIN_BLIP_INTERVAL = 0.05; // 50 ms

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize AudioContext (must be called from user gesture)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new AudioContext();

      // Handle autoplay policy
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create gain node hierarchy
      this.masterGain = this.audioContext.createGain();
      this.bgmGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);

      // Ambient gains — 2 independent slots routing through masterGain
      this.ambientGains = [
        this.audioContext.createGain(),
        this.audioContext.createGain(),
      ];
      this.ambientGains[0].connect(this.masterGain);
      this.ambientGains[1].connect(this.masterGain);
      this.ambientGains[0].gain.value = AUDIO_DEFAULTS.AMBIENT_VOLUME;
      this.ambientGains[1].gain.value = AUDIO_DEFAULTS.AMBIENT_VOLUME;

      this.masterGain.connect(this.audioContext.destination);

      this.applyVolumes();
      this.initialized = true;

      logger.debug('[AudioManager] Initialized successfully');
    } catch (error) {
      logger.error('[AudioManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Apply current volume settings to gain nodes
   */
  private applyVolumes(): void {
    if (!this.masterGain || !this.bgmGain || !this.sfxGain) return;

    const effectiveMaster = this.config.muted ? 0 : this.config.masterVolume;
    this.masterGain.gain.value = effectiveMaster;
    this.bgmGain.gain.value = this.config.bgmVolume;
    this.sfxGain.gain.value = this.config.sfxVolume;
  }

  // ═══════════════════════════════════════════════════════════════
  // BGM METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Play background music with fade-in
   */
  async playBGM(config: SceneAudio): Promise<void> {
    if (!this.initialized || !this.audioContext || !this.bgmGain) {
      logger.warn('[AudioManager] Not initialized. Call initialize() first.');
      return;
    }

    const { url, volume = AUDIO_DEFAULTS.MUSIC_VOLUME, loop = true } = config;

    // If same URL is already playing, just update settings
    if (this.currentBgmUrl === url && this.currentBgm) {
      this.currentBgm.loop = loop;
      this.config.bgmVolume = volume;
      this.applyVolumes();
      return;
    }

    // Stop current BGM with fade out
    if (this.currentBgm) {
      await this.stopBGM(this.config.fadeOutDuration * 1000);
    }

    // Create new audio element
    this.currentBgm = new Audio(url);
    this.currentBgm.loop = loop;
    this.currentBgm.crossOrigin = 'anonymous';
    this.currentBgmUrl = url;

    // Connect to Web Audio API for gain control
    this.bgmSourceNode = this.audioContext.createMediaElementSource(this.currentBgm);
    this.bgmSourceNode.connect(this.bgmGain);

    // Update volume config
    this.config.bgmVolume = volume;

    // Fade in
    const currentTime = this.audioContext.currentTime;
    this.bgmGain.gain.setValueAtTime(0, currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(
      volume,
      currentTime + this.config.fadeInDuration
    );

    try {
      await this.currentBgm.play();
      logger.debug('[AudioManager] BGM started:', url);
    } catch (error) {
      logger.warn('[AudioManager] BGM playback failed:', error);
    }
  }

  /**
   * Stop background music with fade-out
   */
  async stopBGM(fadeOutMs: number = DEFAULT_CONFIG.fadeOutDuration * 1000): Promise<void> {
    if (!this.currentBgm || !this.bgmGain || !this.audioContext) return;

    const fadeOutSec = fadeOutMs / 1000;
    const currentTime = this.audioContext.currentTime;

    // Fade out
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, currentTime);
    this.bgmGain.gain.exponentialRampToValueAtTime(0.001, currentTime + fadeOutSec);

    // Wait for fade, then stop
    await new Promise((resolve) => setTimeout(resolve, fadeOutMs));

    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.currentTime = 0;
    }

    this.bgmSourceNode?.disconnect();
    this.currentBgm = null;
    this.bgmSourceNode = null;
    this.currentBgmUrl = null;

    // Reset gain for next track
    this.bgmGain.gain.setValueAtTime(this.config.bgmVolume, this.audioContext.currentTime);

    logger.debug('[AudioManager] BGM stopped');
  }

  /**
   * Pause current BGM without stopping
   */
  pauseBGM(): void {
    if (this.currentBgm && !this.currentBgm.paused) {
      this.currentBgm.pause();
      logger.debug('[AudioManager] BGM paused');
    }
  }

  /**
   * Resume paused BGM
   */
  resumeBGM(): void {
    if (this.currentBgm && this.currentBgm.paused) {
      this.currentBgm.play().catch((e) => logger.error('[AudioManager] Resume failed:', e));
      logger.debug('[AudioManager] BGM resumed');
    }
  }

  /**
   * Get current BGM URL
   */
  getCurrentBGMUrl(): string | null {
    return this.currentBgmUrl;
  }

  /**
   * Check if BGM is currently playing
   */
  isBGMPlaying(): boolean {
    return this.currentBgm !== null && !this.currentBgm.paused;
  }

  // ═══════════════════════════════════════════════════════════════
  // SFX METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Preload a sound effect into buffer cache
   */
  async preloadSFX(url: string): Promise<void> {
    if (this.sfxBuffers.has(url)) return;
    if (!this.audioContext) {
      logger.warn('[AudioManager] Not initialized');
      return;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sfxBuffers.set(url, audioBuffer);
      logger.debug('[AudioManager] SFX preloaded:', url);
    } catch (error) {
      logger.error('[AudioManager] Failed to preload SFX:', url, error);
    }
  }

  /**
   * Preload multiple sound effects
   */
  async preloadSFXBatch(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.preloadSFX(url)));
  }

  /**
   * Play a sound effect
   */
  playSFX(config: DialogueAudio): void {
    if (!this.audioContext || !this.sfxGain) {
      logger.warn('[AudioManager] Not initialized');
      return;
    }

    const { url, volume = AUDIO_DEFAULTS.SFX_VOLUME } = config;
    const buffer = this.sfxBuffers.get(url);

    if (!buffer) {
      logger.warn('[AudioManager] SFX not preloaded, loading now:', url);
      // Fallback: preload and play
      this.preloadSFX(url).then(() => this.playSFX(config));
      return;
    }

    // Create new source node (one-shot)
    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = buffer;

    // Individual volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    sourceNode.connect(gainNode);
    gainNode.connect(this.sfxGain);

    sourceNode.start(0);

    // Auto-cleanup
    sourceNode.onended = () => {
      sourceNode.disconnect();
      gainNode.disconnect();
    };

    logger.debug('[AudioManager] SFX played:', url);
  }

  // ═══════════════════════════════════════════════════════════════
  // AMBIENT METHODS (max 2 independent slots)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Play an ambient environmental track on a specific slot (0 or 1).
   * If the same URL is already playing on that slot, only updates volume.
   * Applies a short fade-in (0.3s) to avoid hard starts.
   */
  async playAmbient(config: AmbientAudio, slot: 0 | 1 = 0): Promise<void> {
    if (!this.initialized || !this.audioContext) {
      logger.warn('[AudioManager] Not initialized. Call initialize() first.');
      return;
    }

    const gain = this.ambientGains[slot];
    if (!gain) return;

    const { url, volume = AUDIO_DEFAULTS.AMBIENT_VOLUME, loop = true } = config;

    // If same URL already playing → update volume only
    if (this.ambientUrls[slot] === url && this.ambientPlayers[slot]) {
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
      return;
    }

    // Stop current track on this slot
    this.stopAmbient(slot);

    const player = new Audio(url);
    player.loop = loop;
    player.crossOrigin = 'anonymous';

    const source = this.audioContext.createMediaElementSource(player);
    source.connect(gain);

    // Fade-in 0.3s
    const t = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.3);

    this.ambientPlayers[slot] = player;
    this.ambientSources[slot] = source;
    this.ambientUrls[slot]    = url;

    try {
      await player.play();
      logger.debug(`[AudioManager] Ambient slot ${slot} started:`, url);
    } catch (error) {
      logger.warn(`[AudioManager] Ambient slot ${slot} failed:`, error);
    }
  }

  /**
   * Stop ambient track(s).
   * @param slot - If specified, stops only that slot. If undefined, stops both.
   */
  stopAmbient(slot?: 0 | 1): void {
    const slots: (0 | 1)[] = slot !== undefined ? [slot] : [0, 1];

    for (const s of slots) {
      if (this.ambientPlayers[s]) {
        this.ambientPlayers[s]!.pause();
        this.ambientPlayers[s]!.currentTime = 0;
      }
      this.ambientSources[s]?.disconnect();
      this.ambientPlayers[s] = null;
      this.ambientSources[s] = null;
      this.ambientUrls[s]    = null;
      logger.debug(`[AudioManager] Ambient slot ${s} stopped`);
    }
  }

  /** Stop all ambient tracks (both slots). Alias for stopAmbient() with no args. */
  stopAllAmbient(): void {
    this.stopAmbient();
  }

  // ═══════════════════════════════════════════════════════════════
  // VOLUME & MUTE CONTROLS
  // ═══════════════════════════════════════════════════════════════

  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
  }

  getMasterVolume(): number {
    return this.config.masterVolume;
  }

  setBGMVolume(volume: number): void {
    this.config.bgmVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
  }

  getBGMVolume(): number {
    return this.config.bgmVolume;
  }

  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
  }

  getSFXVolume(): number {
    return this.config.sfxVolume;
  }

  setMuted(muted: boolean): void {
    this.config.muted = muted;
    this.applyVolumes();
  }

  isMuted(): boolean {
    return this.config.muted;
  }

  toggleMute(): boolean {
    this.config.muted = !this.config.muted;
    this.applyVolumes();
    return this.config.muted;
  }

  // ═══════════════════════════════════════════════════════════════
  // PROCEDURAL AUDIO — Text blips & UI sounds
  // ═══════════════════════════════════════════════════════════════

  /**
   * Play a synthesized text blip (no file needed).
   *
   * Designed to be called on every character (or word) displayed during
   * dialogue. Built-in throttle (50 ms) prevents audio saturation.
   *
   * @param options - Voice profile, or one of the VOICE_PRESETS
   *
   * @example
   * // Per-character blip using a preset
   * audioManager.playBlip(VOICE_PRESETS.child);
   *
   * // Custom pitch
   * audioManager.playBlip({ pitch: 550, waveform: 'triangle' });
   */
  playBlip(options: BlipOptions = {}): void {
    if (!this.initialized || !this.audioContext || !this.sfxGain) return;
    if (this.config.muted) return;

    const now = this.audioContext.currentTime;
    if (now - this.lastBlipTime < AudioManager.MIN_BLIP_INTERVAL) return;
    this.lastBlipTime = now;

    const pitch = (options.pitch ?? 440)
      + (Math.random() * 2 - 1) * (options.pitchVariance ?? 30);
    const dur = options.duration ?? 0.04;
    const vol = options.volume ?? 0.3;

    this._playTone(pitch, options.waveform ?? 'sine', dur, vol, now);
  }

  /**
   * Play a synthesized UI sound effect.
   * All sounds are generated entirely in code — no audio files required.
   *
   * @example
   * audioManager.playUISound('success');
   * audioManager.playUISound('diceRoll');
   */
  playUISound(type: UISound): void {
    if (!this.initialized || !this.audioContext || !this.sfxGain) return;
    if (this.config.muted) return;

    const t = this.audioContext.currentTime;

    switch (type) {
      case 'click': {
        // Short percussive thud — quick frequency drop
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.018);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
        osc.start(t);
        osc.stop(t + 0.018);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        break;
      }

      case 'confirm':
        // Ascending two-tone : C5 (523 Hz) → E5 (659 Hz)
        this._playTone(523, 'sine', 0.08, 0.22, t);
        this._playTone(659, 'sine', 0.08, 0.22, t + 0.09);
        break;

      case 'cancel':
        // Descending two-tone : C5 (523 Hz) → G4 (392 Hz)
        this._playTone(523, 'sine', 0.08, 0.22, t);
        this._playTone(392, 'sine', 0.08, 0.22, t + 0.09);
        break;

      case 'success':
        // Ascending major arpeggio : C5-E5-G5-C6
        [523, 659, 784, 1047].forEach((freq, i) => {
          this._playTone(freq, 'sine', 0.09, 0.28, t + i * 0.085);
        });
        break;

      case 'error': {
        // Low descending square buzz
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.25);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        break;
      }

      case 'hover':
        // Very subtle high blip — barely noticeable
        this._playTone(800, 'sine', 0.015, 0.08, t);
        break;

      case 'diceRoll': {
        // 10 rapid random blips (rolling) then a low landing thud
        for (let i = 0; i < 10; i++) {
          const freq = 200 + Math.random() * 400;
          this._playTone(freq, 'square', 0.03, 0.1, t + i * 0.04);
        }
        // Landing thud
        this._playTone(120, 'sine', 0.18, 0.35, t + 0.43);
        break;
      }

      default:
        logger.warn('[AudioManager] Unknown UI sound:', type);
    }
  }

  /**
   * Internal helper — plays a single synthesized tone.
   * Connects directly to sfxGain and self-cleans on end.
   */
  private _playTone(
    freq: number,
    type: OscillatorType,
    dur: number,
    vol: number,
    startTime: number,
  ): void {
    if (!this.audioContext || !this.sfxGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.start(startTime);
    osc.stop(startTime + dur);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════

  /**
   * Unload a specific SFX from cache
   */
  unloadSFX(url: string): void {
    this.sfxBuffers.delete(url);
  }

  /**
   * Clear all SFX from cache
   */
  clearSFXCache(): void {
    this.sfxBuffers.clear();
  }

  /**
   * Destroy the audio manager (cleanup)
   */
  async destroy(): Promise<void> {
    await this.stopBGM(0);
    this.stopAllAmbient();
    this.clearSFXCache();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.initialized = false;
    AudioManager.instance = null;

    logger.debug('[AudioManager] Destroyed');
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// Export type for external use
export type { AudioManager };
