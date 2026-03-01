/**
 * UI Sound Engine — Synthèse procédurale Web Audio API
 *
 * Zéro fichier audio requis. Tous les sons sont générés en JavaScript.
 * Paramètres calibrés sur le design sonore d'Ace Attorney / Danganronpa.
 *
 * Architecture : AudioContext singleton + GainNode master
 *
 * Sons disponibles :
 *   tick()              — frappe typewriter (time-gated, pitch jitter, silence sur ponctuation)
 *   advance()           — clic "dialogue suivant" (sweep montant)
 *   skipTypewriter()    — clic pendant l'animation (triple tick + zap)
 *   typewriterComplete()— texte terminé, sans choix (ping C5 très doux)
 *   choiceAppear()      — apparition des choix (whoosh bandpass)
 *   choiceSelect()      — sélection d'un choix (double ton C5+G5)
 *   sceneTransition()   — changement de scène (swoosh grave)
 *   gameStart()         — démarrage du jeu (arpège C5-E5-G5)
 *   initialize()        — à appeler après le premier geste utilisateur
 *   setVolume(v)        — volume global 0–1
 *   setMuted(m)         — sync avec le bouton mute du player
 */

// ── AudioContext singleton + Master Gain ─────────────────────────────────────

let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;
let _volume = 0.3;
let _muted = false;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

function getMaster(): GainNode {
  const ctx = getCtx();
  if (!_master) {
    _master = ctx.createGain();
    _master.gain.value = _muted ? 0 : _volume;
    _master.connect(ctx.destination);
  }
  return _master;
}

/** Guard : évite de scheduler des nodes quand l'AudioContext n'est pas encore running.
 *  Sans ce guard, les ticks accumulés pendant la suspension joueraient en rafale
 *  au premier clic utilisateur. */
function isRunning(): boolean {
  return _ctx !== null && _ctx.state === 'running';
}

// ── Helpers internes ──────────────────────────────────────────────────────────

/** Oscillateur court avec enveloppe percussive ADSR. */
function oscBurst(
  freq: number,
  type: OscillatorType,
  attackGain: number,
  decayMs: number,
  freqEndRatio = 1.0,
): void {
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const decay = decayMs / 1000;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEndRatio !== 1.0) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * freqEndRatio), t + decay);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(attackGain, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + decay + 0.01);
}

/** Bruit blanc filtré — bande passante ou passe-haut. */
function noiseBurst(
  durationMs: number,
  gainPeak: number,
  hipass = 500,
  bandpass?: { freq: number; Q: number; freqEnd?: number },
): void {
  const ctx = getCtx();
  const master = getMaster();
  const dur = durationMs / 1000;
  const t = ctx.currentTime;

  const size = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const flt = ctx.createBiquadFilter();
  if (bandpass) {
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(bandpass.freq, t);
    if (bandpass.freqEnd) {
      flt.frequency.exponentialRampToValueAtTime(bandpass.freqEnd, t + dur);
    }
    flt.Q.value = bandpass.Q;
  } else {
    flt.type = 'highpass';
    flt.frequency.value = hipass;
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainPeak, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(flt);
  flt.connect(gain);
  gain.connect(master);
  src.start(t);
  src.stop(t + dur + 0.01);
}

// ── Style & cadence typewriter ────────────────────────────────────────────────

/** Styles de frappe typewriter disponibles. */
export const TICK_STYLES = ['mecanique', 'vintage', 'gaming', '8bit', 'doux'] as const;
export type TickStyle = typeof TICK_STYLES[number];

let _tickStyle: TickStyle = 'mecanique';
/** Intervalle min entre deux ticks en ms. Modifiable via setTickInterval(). */
let _tickInterval = 65;

// ── État typewriter ───────────────────────────────────────────────────────────

let _lastTickMs = 0;

/**
 * Caractères silencieux.
 * Règle Ace Attorney : silencieux sur espaces et ponctuation de pause.
 * Le joueur perçoit ces silences comme une respiration naturelle du texte.
 */
const SILENT_CHARS = new Set([' ', '\t', '\n', '.', ',', '!', '?', ';', ':', '—', '–', '-', '…', '"', '"', "'", '(', ')']);

// ── Implémentations par style ─────────────────────────────────────────────────

/**
 * Mécanique — Triangle 950 Hz, pitch jitter ±8%, noise layer, stereo pan.
 * Feel machine à écrire électrique (Ace Attorney / Danganronpa).
 */
function tickMecanique(): void {
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  const freq = 950 * (1 + (Math.random() - 0.5) * 0.16);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.048);

  const gainVal = 0.32 * (0.85 + Math.random() * 0.30);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.058);

  const panner = ctx.createStereoPanner();
  panner.pan.value = (Math.random() - 0.5) * 0.35;

  osc.connect(panner);
  panner.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.065);

  noiseBurst(35, 0.09, 700);
}

/**
 * Vintage — Sawtooth grave 280 Hz, decay 90 ms, noise dense.
 * Feel Underwood 1950, lourd et métallique.
 */
function tickVintage(): void {
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  const freq = 280 * (1 + (Math.random() - 0.5) * 0.06);
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.080);

  const gainVal = 0.28 * (0.90 + Math.random() * 0.20);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.090);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.095);

  // Plaque métallique lourde — bruit grave dense
  noiseBurst(55, 0.16, 250);
}

/**
 * Gaming — Sine pur 1350 Hz, decay 22 ms.
 * Feel Cherry MX Blue, clic précis et satisfaisant.
 */
function tickGaming(): void {
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  const freq = 1350 * (1 + (Math.random() - 0.5) * 0.06);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.28, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.026);

  // Clic sec haute fréquence — simule le mécanisme de frappe
  noiseBurst(18, 0.14, 2000);
}

/** Notes utilisées en chiptune (pentatonique A — cohérence RPG). */
const CHIPTUNE_FREQS = [220, 277, 330, 440, 494] as const; // A3 C#4 E4 A4 B4

/**
 * 8-bit — Square wave, palette de notes pentatonique, enveloppe carrée.
 * Feel RPG Maker / Dragon Quest / NES.
 */
function tick8bit(): void {
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  const freq = CHIPTUNE_FREQS[Math.floor(Math.random() * CHIPTUNE_FREQS.length)];
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);

  const gain = ctx.createGain();
  // Enveloppe carrée chiptune (porte ouverte → fermée immédiatement)
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.setValueAtTime(0.18, t + 0.026);
  gain.gain.linearRampToValueAtTime(0.0001, t + 0.036);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.040);
}

/**
 * Doux — Sine 520 Hz très doux, gain 0.10, sans bruit.
 * Feel Animal Crossing / Stardew Valley / cozy games.
 */
function tickDoux(): void {
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(470, t + 0.060);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.10, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.070);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.075);
}

// ── Sons publics ──────────────────────────────────────────────────────────────

/**
 * Frappe typewriter.
 *
 * Dispatche vers l'implémentation du style actif (_tickStyle).
 * Respecte l'intervalle minimum configurable (_tickInterval).
 * Silencieux sur ponctuation et espaces (Ace Attorney rule).
 */
function tick(char: string): void {
  if (_muted || !isRunning()) return;
  if (SILENT_CHARS.has(char)) return;

  const now = performance.now();
  if (now - _lastTickMs < _tickInterval) return;
  _lastTickMs = now;

  switch (_tickStyle) {
    case 'vintage': tickVintage();   break;
    case 'gaming':  tickGaming();    break;
    case '8bit':    tick8bit();      break;
    case 'doux':    tickDoux();      break;
    default:        tickMecanique(); break;
  }
}

/**
 * Clic "dialogue suivant".
 * Sweep sawtooth montant 400→900 Hz — action décisive, tonalité positive.
 */
function advance(): void {
  if (_muted) return;
  oscBurst(400, 'sawtooth', 0.32, 110, 2.25);
}

/**
 * Clic pendant l'animation typewriter (skip).
 *
 * ⭐ Son auquel on ne pense pas : distinction skip vs avance.
 * Triple tick accéléré + zap descendant → ressenti "fast-forward".
 * Le joueur comprend immédiatement qu'il a sauté l'animation, pas avancé.
 */
function skipTypewriter(): void {
  if (_muted) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  // Triple tick en rafale (simulation d'accélération)
  [0, 0.022, 0.044].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 850 + i * 150; // montée de pitch
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t + offset);
    g.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.025);
    osc.connect(g);
    g.connect(master);
    osc.start(t + offset);
    osc.stop(t + offset + 0.030);
  });

  // Zap descendant final — signal "terminé"
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1400, t + 0.058);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.130);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, t + 0.058);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.130);
  osc.connect(g);
  g.connect(master);
  osc.start(t + 0.058);
  osc.stop(t + 0.135);
}

/**
 * Typewriter terminé (texte complet, sans choix).
 *
 * ⭐ Son auquel on ne pense pas : signal "tu peux cliquer".
 * Très doux ping C5 (523 Hz) — le joueur ne le remarque pas consciemment
 * mais ressent la "permission" de passer au dialogue suivant.
 * Volume délibérément bas (0.10) pour rester subliminal.
 */
function typewriterComplete(): void {
  if (_muted) return;
  oscBurst(523.3, 'sine', 0.10, 120);
}

/**
 * Apparition des choix.
 * Whoosh bandpass 280→2800 Hz sur 160 ms — attire l'attention sans agresser.
 */
function choiceAppear(): void {
  if (_muted) return;
  noiseBurst(160, 0.20, 200, { freq: 280, Q: 1.8, freqEnd: 2800 });
}

/**
 * Sélection d'un choix.
 * Double ton C5 (523 Hz) + G5 (784 Hz) — quinte juste, accord de confirmation.
 */
function choiceSelect(): void {
  if (_muted) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  ([523.3, 783.9] as const).forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.20, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.120);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.125);
  });
}

/**
 * Transition de scène.
 *
 * ⭐ Son auquel on ne pense pas : repère spatial/temporel.
 * Swoosh grave (noise passe-bas) — signal sous-conscient de changement d'espace.
 * Longue durée (550 ms) pour accompagner le fondu du fond.
 */
function sceneTransition(): void {
  if (_muted) return;
  const ctx = getCtx();
  const master = getMaster();
  const dur = 0.55;
  const t = ctx.currentTime;

  const size = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(120, t);
  flt.frequency.exponentialRampToValueAtTime(900, t + dur * 0.45);
  flt.frequency.exponentialRampToValueAtTime(80, t + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.28, t + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(flt);
  flt.connect(gain);
  gain.connect(master);
  src.start(t);
  src.stop(t + dur + 0.01);
}

/**
 * Démarrage du jeu (mount du PreviewPlayer).
 *
 * ⭐ Son auquel on ne pense pas : signal d'ouverture.
 * Arpège C5-E5-G5 (523→659→784 Hz) — accord majeur, signal positif universel.
 * Utilisé par Ace Attorney à chaque ouverture de scène.
 * Notes espacées de 55 ms (tempo naturel, pas mécanique).
 */
function gameStart(): void {
  if (_muted) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  // C5 → E5 → G5 (tierce majeure + quinte)
  ([523.3, 659.3, 783.9] as const).forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const noteT = t + i * 0.055;
    gain.gain.setValueAtTime(0.0001, noteT);
    gain.gain.linearRampToValueAtTime(0.18, noteT + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteT + 0.190);
    osc.connect(gain);
    gain.connect(master);
    osc.start(noteT);
    osc.stop(noteT + 0.200);
  });
}

// ── Sons de dé ───────────────────────────────────────────────────────────────

/**
 * Roulement de dé — rattle bruité sur 1.5s.
 * Bandpass sweep 300 → 4000 Hz simulant un dé qui roule sur une table.
 * Deux couches : grave (impact table) + aigu (friction plastique).
 */
function diceRollStart(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const dur = 1.5;

  // Couche grave — impacts répétés (bruit basse fréquence décroissant)
  const size = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // Bruit enveloppé : pics périodiques simulant les rebonds
  for (let i = 0; i < size; i++) {
    const t2 = i / ctx.sampleRate;
    // Fréquence de rebond accélère (3→12 Hz sur 1.5s) puis ralentit
    const rebondFreq = t2 < 0.8 ? 3 + t2 * 10 : 12 - (t2 - 0.8) * 8;
    const envelope = 0.5 + 0.5 * Math.cos(2 * Math.PI * rebondFreq * t2);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const fltLow = ctx.createBiquadFilter();
  fltLow.type = 'bandpass';
  fltLow.frequency.setValueAtTime(300, t);
  fltLow.frequency.exponentialRampToValueAtTime(1200, t + dur * 0.6);
  fltLow.frequency.exponentialRampToValueAtTime(300, t + dur);
  fltLow.Q.value = 0.9;
  const gainLow = ctx.createGain();
  gainLow.gain.setValueAtTime(0.32, t);
  gainLow.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fltLow);
  fltLow.connect(gainLow);
  gainLow.connect(master);
  src.start(t);
  src.stop(t + dur + 0.01);

  // Couche aiguë — friction plastique (highpass 2000 Hz, plus courte)
  noiseBurst(900, 0.14, 2000);
}

/**
 * Impact au sol — thud grave + crack percussif.
 * Sawtooth 55 Hz (résonnance grave) + noise haute fréquence court (impact sec).
 */
function diceImpact(): void {
  if (_muted || !isRunning()) return;
  // Thud grave (table)
  oscBurst(55, 'sawtooth', 0.55, 280, 0.3);
  // Sous-basse
  oscBurst(38, 'sine', 0.40, 200, 0.2);
  // Crack sec
  noiseBurst(70, 0.38, 1800);
}

/**
 * Victoire — arpège C5→E5→G5→C6.
 * Accord majeur parfait (523→659→784→1047 Hz) — tonalité de triomphe.
 * Notes séparées de 80 ms pour un effet "fanfare" sans être agressif.
 */
function diceSuccess(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const notes = [523.3, 659.3, 784.0, 1046.5] as const;
  notes.forEach((freq, i) => {
    const noteT = t + i * 0.08;
    const osc = ctx.createOscillator();
    osc.type = i < 2 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, noteT);
    gain.gain.linearRampToValueAtTime(0.28, noteT + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteT + 0.22);
    osc.connect(gain);
    gain.connect(master);
    osc.start(noteT);
    osc.stop(noteT + 0.23);
  });
  // Shimmer final
  setTimeout(() => { if (isRunning()) noiseBurst(120, 0.10, 4000); }, 350);
}

/**
 * Échec — descente C5→A4→F4 (tonalité mineure descendante).
 * Sine avec vibrato léger pour un caractère mélancolique sans être brutal.
 */
function diceFailure(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const notes = [523.3, 440.0, 349.2] as const;
  notes.forEach((freq, i) => {
    const noteT = t + i * 0.11;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteT);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.96, noteT + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, noteT);
    gain.gain.linearRampToValueAtTime(0.22, noteT + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteT + 0.22);
    osc.connect(gain);
    gain.connect(master);
    osc.start(noteT);
    osc.stop(noteT + 0.23);
  });
  // Grondement final (doom)
  oscBurst(80, 'sawtooth', 0.12, 350, 0.5);
}

// ── Contrôle volume / mute ────────────────────────────────────────────────────

/**
 * Initialise l'AudioContext après un geste utilisateur.
 * Doit être appelé dans initializeAudio() du PreviewPlayer.
 */
function initialize(): void {
  getCtx(); // crée et tente de reprendre le contexte
}

/** Volume global 0–1. */
function setVolume(volume: number): void {
  _volume = Math.max(0, Math.min(1, volume));
  if (_master && !_muted) {
    _master.gain.setTargetAtTime(_volume, getCtx().currentTime, 0.05);
  }
}

/** Synchronise le mute avec le bouton Son ON/OFF du PreviewPlayer. */
function setMuted(muted: boolean): void {
  _muted = muted;
  if (_master) {
    const ctx = getCtx();
    _master.gain.setTargetAtTime(muted ? 0 : _volume, ctx.currentTime, 0.05);
  }
}

/** Style de frappe typewriter. Effet immédiat sur le prochain tick. */
function setTickStyle(style: TickStyle): void {
  _tickStyle = style;
}

/** Intervalle minimum entre deux ticks en ms (35–130). Effet immédiat. */
function setTickInterval(ms: number): void {
  _tickInterval = Math.max(35, Math.min(130, ms));
}

// ── Export ────────────────────────────────────────────────────────────────────

export const uiSounds = {
  tick,
  advance,
  skipTypewriter,
  typewriterComplete,
  choiceAppear,
  choiceSelect,
  sceneTransition,
  gameStart,
  diceRollStart,
  diceImpact,
  diceSuccess,
  diceFailure,
  initialize,
  setVolume,
  setMuted,
  setTickStyle,
  setTickInterval,
} as const;
