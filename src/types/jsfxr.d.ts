/** Type declarations for jsfxr — 8-bit sound effects generator. */
declare module 'jsfxr' {
  interface SfxrAPI {
    /** Generates a sound object from a named preset. */
    generate: (preset: 'pickupCoin' | 'laserShoot' | 'explosion' | 'powerUp' | 'hitHurt' | 'jump' | 'blipSelect' | 'synth' | 'tone' | 'click' | 'random') => object;
    /** Plays a generated sound via Web Audio API. */
    play: (sound: object) => void;
    /** Converts a sound to a WAV data URI. */
    toWave: (sound: object) => { dataURI: string };
    /** Returns a HTMLAudioElement for the sound. */
    toAudio: (sound: object) => HTMLAudioElement;
  }

  export const sfxr: SfxrAPI;
  const jsfxr: { sfxr: SfxrAPI };
  export default jsfxr;
}
