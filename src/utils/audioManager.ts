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

import type { SceneAudio, DialogueAudio } from '@/types';

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

  // SFX buffer cache
  private sfxBuffers: Map<string, AudioBuffer> = new Map();

  // Configuration
  private config: AudioConfig = { ...DEFAULT_CONFIG };

  // Initialization state
  private initialized = false;

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
      this.masterGain.connect(this.audioContext.destination);

      this.applyVolumes();
      this.initialized = true;

      console.log('[AudioManager] Initialized successfully');
    } catch (error) {
      console.error('[AudioManager] Initialization failed:', error);
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
      console.warn('[AudioManager] Not initialized. Call initialize() first.');
      return;
    }

    const { url, volume = 0.5, loop = true } = config;

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
      console.log('[AudioManager] BGM started:', url);
    } catch (error) {
      console.warn('[AudioManager] BGM playback failed:', error);
    }
  }

  /**
   * Stop background music with fade-out
   */
  async stopBGM(fadeOutMs: number = 500): Promise<void> {
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

    console.log('[AudioManager] BGM stopped');
  }

  /**
   * Pause current BGM without stopping
   */
  pauseBGM(): void {
    if (this.currentBgm && !this.currentBgm.paused) {
      this.currentBgm.pause();
      console.log('[AudioManager] BGM paused');
    }
  }

  /**
   * Resume paused BGM
   */
  resumeBGM(): void {
    if (this.currentBgm && this.currentBgm.paused) {
      this.currentBgm.play().catch(console.error);
      console.log('[AudioManager] BGM resumed');
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
      console.warn('[AudioManager] Not initialized');
      return;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sfxBuffers.set(url, audioBuffer);
      console.log('[AudioManager] SFX preloaded:', url);
    } catch (error) {
      console.error('[AudioManager] Failed to preload SFX:', url, error);
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
      console.warn('[AudioManager] Not initialized');
      return;
    }

    const { url, volume = 0.7 } = config;
    const buffer = this.sfxBuffers.get(url);

    if (!buffer) {
      console.warn('[AudioManager] SFX not preloaded, loading now:', url);
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

    console.log('[AudioManager] SFX played:', url);
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
    this.clearSFXCache();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.initialized = false;
    AudioManager.instance = null;

    console.log('[AudioManager] Destroyed');
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// Export type for external use
export type { AudioManager };
