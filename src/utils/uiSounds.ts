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
  freqEndRatio = 1.0
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
  bandpass?: { freq: number; Q: number; freqEnd?: number }
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
export type TickStyle = (typeof TICK_STYLES)[number];

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
const SILENT_CHARS = new Set([
  ' ',
  '\t',
  '\n',
  '.',
  ',',
  '!',
  '?',
  ';',
  ':',
  '—',
  '–',
  '-',
  '…',
  '"',
  '"',
  "'",
  '(',
  ')',
]);

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

  const gainVal = 0.32 * (0.85 + Math.random() * 0.3);
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
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.08);

  const gainVal = 0.28 * (0.9 + Math.random() * 0.2);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

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
  osc.stop(t + 0.04);
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
  osc.frequency.exponentialRampToValueAtTime(470, t + 0.06);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

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
    case 'vintage':
      tickVintage();
      break;
    case 'gaming':
      tickGaming();
      break;
    case '8bit':
      tick8bit();
      break;
    case 'doux':
      tickDoux();
      break;
    default:
      tickMecanique();
      break;
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
    osc.stop(t + offset + 0.03);
  });

  // Zap descendant final — signal "terminé"
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1400, t + 0.058);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.13);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, t + 0.058);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
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
  oscBurst(523.3, 'sine', 0.1, 120);
}

/**
 * Apparition des choix.
 * Whoosh bandpass 280→2800 Hz sur 160 ms — attire l'attention sans agresser.
 */
function choiceAppear(): void {
  if (_muted) return;
  noiseBurst(160, 0.2, 200, { freq: 280, Q: 1.8, freqEnd: 2800 });
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
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
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
    gain.gain.exponentialRampToValueAtTime(0.0001, noteT + 0.19);
    osc.connect(gain);
    gain.connect(master);
    osc.start(noteT);
    osc.stop(noteT + 0.2);
  });
}

// ── Sons de dé ───────────────────────────────────────────────────────────────

/**
 * Roulement de dé — rattle bruité sur 1.5s + cliquetis de facettes.
 * Trois couches :
 *   1. Grave  — bruit enveloppé avec pics de rebond (bandpass sweep)
 *   2. Aiguë  — friction surface (highpass 2000 Hz)
 *   3. Clicks — 12 impacts nets (facettes) qui accélèrent puis ralentissent
 */
function diceRollStart(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const dur = 1.5;

  // Couche grave — bruit enveloppé avec pics de rebond
  const size = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) {
    const t2 = i / ctx.sampleRate;
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

  // Couche aiguë — friction surface
  noiseBurst(900, 0.14, 2000);

  // Cliquetis de facettes — 12 impacts nets (accélération → décélération)
  // Simule chaque arête du dé qui touche la surface pendant le roulement
  const clickTimes = [0.05, 0.13, 0.2, 0.28, 0.35, 0.43, 0.52, 0.64, 0.79, 1.01, 1.26, 1.44];
  for (const ct of clickTimes) {
    const st = t + ct;
    const clickSize = Math.ceil(ctx.sampleRate * 0.022);
    const clickBuf = ctx.createBuffer(1, clickSize, ctx.sampleRate);
    const cData = clickBuf.getChannelData(0);
    for (let i = 0; i < clickSize; i++) {
      cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickSize * 0.12));
    }
    const cSrc = ctx.createBufferSource();
    cSrc.buffer = clickBuf;
    const cFlt = ctx.createBiquadFilter();
    cFlt.type = 'highpass';
    cFlt.frequency.value = 2800;
    const cGain = ctx.createGain();
    cGain.gain.value = 0.28 * (1 - (ct / dur) * 0.45);
    cSrc.connect(cFlt);
    cFlt.connect(cGain);
    cGain.connect(master);
    cSrc.start(st);
    cSrc.stop(st + 0.025);
  }
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
  oscBurst(38, 'sine', 0.4, 200, 0.2);
  // Crack sec
  noiseBurst(70, 0.38, 1800);
}

/**
 * Victoire — arpège C5→E5→G5→C6 + note tenue finale.
 * Accord majeur parfait (523→659→784→1047 Hz) — tonalité de triomphe.
 * Notes séparées de 80ms + sustain C6 résonant + shimmer étendu.
 */
function diceSuccess(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const notes = [523.3, 659.3, 784.0, 1046.5] as const;

  // Arpège ascendant
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

  // Note tenue C6 — sustain résonant après l'arpège
  const susT = t + notes.length * 0.08 + 0.06;
  const susOsc = ctx.createOscillator();
  susOsc.type = 'sine';
  susOsc.frequency.value = 1046.5;
  const susGain = ctx.createGain();
  susGain.gain.setValueAtTime(0.0001, susT);
  susGain.gain.linearRampToValueAtTime(0.18, susT + 0.06);
  susGain.gain.exponentialRampToValueAtTime(0.0001, susT + 0.9);
  susOsc.connect(susGain);
  susGain.connect(master);
  susOsc.start(susT);
  susOsc.stop(susT + 0.95);

  // Shimmer étendu — deux vagues successives (scintillement)
  setTimeout(() => {
    if (isRunning()) noiseBurst(180, 0.11, 4200);
  }, 360);
  setTimeout(() => {
    if (isRunning()) noiseBurst(120, 0.07, 5800);
  }, 600);
}

/**
 * Échec — descente C5→A4→F4 (tonalité mineure) + écho + grondement sourd.
 * Triangle avec vibrato léger + écho désaccordé pour un sentiment de fatalité.
 */
function diceFailure(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const notes = [523.3, 440.0, 349.2] as const;

  // Descente mineure
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

  // Écho légèrement désaccordé — sentiment de "destin scellé"
  const echoT = t + notes.length * 0.11 + 0.06;
  const echoOsc = ctx.createOscillator();
  echoOsc.type = 'triangle';
  echoOsc.frequency.setValueAtTime(349.2 * 0.93, echoT);
  echoOsc.frequency.exponentialRampToValueAtTime(349.2 * 0.86, echoT + 0.45);
  const echoGain = ctx.createGain();
  echoGain.gain.setValueAtTime(0.11, echoT);
  echoGain.gain.exponentialRampToValueAtTime(0.0001, echoT + 0.5);
  echoOsc.connect(echoGain);
  echoGain.connect(master);
  echoOsc.start(echoT);
  echoOsc.stop(echoT + 0.55);

  // Grondement sourd étendu — basse continue (doom)
  oscBurst(42, 'sawtooth', 0.16, 650, 0.45);
  oscBurst(80, 'sawtooth', 0.1, 350, 0.5);
}

// ── Sons mini-jeux ───────────────────────────────────────────────────────────

/** QTE — touche correcte enfoncée (claquement sec 880→440Hz, square, 50ms). */
function minigameTick(): void {
  if (_muted || !isRunning()) return;
  oscBurst(880, 'square', 0.18, 50, 0.5);
  oscBurst(1320, 'sine', 0.06, 30, 0.8);
}

/** Mini-jeu — échec (buzz grave descendant 160→60Hz, sawtooth, 220ms). */
function minigameFail(): void {
  if (_muted || !isRunning()) return;
  oscBurst(160, 'sawtooth', 0.28, 220, 0.375);
  oscBurst(80, 'sawtooth', 0.14, 280, 0.75);
}

/**
 * Mini-jeu — succès complet (arpège ascendant C4→E4→G4→C5→E5, 5 notes, 70ms apart).
 * Shimmer final identique à diceSuccess mais plus court.
 */
function minigameSuccess(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;
  const notes = [261.6, 329.6, 392.0, 523.3, 659.3] as const;

  notes.forEach((freq, i) => {
    const noteT = t + i * 0.07;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteT);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, noteT);
    gain.gain.linearRampToValueAtTime(0.22, noteT + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteT + 0.18);
    osc.connect(gain);
    gain.connect(master);
    osc.start(noteT);
    osc.stop(noteT + 0.2);
  });

  // Note tenue finale C5
  const holdT = t + notes.length * 0.07 + 0.04;
  const holdOsc = ctx.createOscillator();
  holdOsc.type = 'sine';
  holdOsc.frequency.value = 523.3;
  const holdGain = ctx.createGain();
  holdGain.gain.setValueAtTime(0.0001, holdT);
  holdGain.gain.linearRampToValueAtTime(0.16, holdT + 0.04);
  holdGain.gain.exponentialRampToValueAtTime(0.0001, holdT + 0.55);
  holdOsc.connect(holdGain);
  holdGain.connect(master);
  holdOsc.start(holdT);
  holdOsc.stop(holdT + 0.6);
}

/** FALC — carte placée à la bonne position (ding D5 sine, 120ms). */
function minigameDing(): void {
  if (_muted || !isRunning()) return;
  oscBurst(587.3, 'sine', 0.2, 120, 0.85);
  oscBurst(880, 'sine', 0.07, 80, 0.9);
}

/** Braille — point cliqué/togglé (tap 800→400Hz sine, 40ms, très sec). */
function minigameDot(): void {
  if (_muted || !isRunning()) return;
  oscBurst(800, 'sine', 0.14, 40, 0.5);
}

/**
 * Fanfare héroïque de victoire — overlay mini-jeu succès.
 *
 * Inspiration : fanfare de stade / Ace Attorney "Objection!" final.
 * Structure : appel G4 → montée C5→E5→G5 → finale C6 tenue + accord majeur.
 * Timbre : sawtooth + sine = cuivre (trompette low-fi).
 * Durée totale : ~1 400 ms — synchronisé avec l'animation Balatro reveal (1 600 ms).
 */
function overlayVictoryFanfare(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  // ── Arpège héroïque ascendant (5 notes, cuivre) ──────────────────────────
  const fanfare: Array<{ freq: number; start: number; dur: number; vol: number }> = [
    { freq: 392.0, start: 0.0, dur: 0.17, vol: 0.28 }, // G4 — appel
    { freq: 523.25, start: 0.15, dur: 0.17, vol: 0.3 }, // C5 — montée
    { freq: 659.25, start: 0.29, dur: 0.17, vol: 0.32 }, // E5 — tierce
    { freq: 783.99, start: 0.42, dur: 0.21, vol: 0.34 }, // G5 — quinte
    { freq: 1046.5, start: 0.58, dur: 0.82, vol: 0.36 }, // C6 — finale tenue
  ];

  fanfare.forEach(({ freq, start, dur, vol }) => {
    const nT = t + start;
    // Couche sawtooth (harmoniques riches = cuivre)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = freq;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, nT);
    g1.gain.linearRampToValueAtTime(vol * 0.6, nT + 0.025);
    g1.gain.setValueAtTime(vol * 0.5, nT + dur - 0.05);
    g1.gain.exponentialRampToValueAtTime(0.0001, nT + dur);
    osc1.connect(g1);
    g1.connect(master);
    osc1.start(nT);
    osc1.stop(nT + dur + 0.01);

    // Couche sine (fondamentale douce + brillance)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, nT);
    g2.gain.linearRampToValueAtTime(vol * 0.42, nT + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, nT + dur + 0.05);
    osc2.connect(g2);
    g2.connect(master);
    osc2.start(nT);
    osc2.stop(nT + dur + 0.06);
  });

  // ── Accord majeur tenu C5+E5+G5 (dès la finale) ──────────────────────────
  const chordT = t + 0.64;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const cT = chordT + i * 0.025;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, cT);
    g.gain.linearRampToValueAtTime(0.13, cT + 0.045);
    g.gain.exponentialRampToValueAtTime(0.0001, cT + 0.75);
    osc.connect(g);
    g.connect(master);
    osc.start(cT);
    osc.stop(cT + 0.8);
  });

  // ── Shimmer — deux vagues (brillance finale) ──────────────────────────────
  setTimeout(() => {
    if (isRunning()) noiseBurst(180, 0.1, 5500);
  }, 680);
  setTimeout(() => {
    if (isRunning()) noiseBurst(120, 0.06, 7000);
  }, 950);
}

/**
 * Thème mélancolique d'échec — overlay mini-jeu raté.
 *
 * Inspiration : "Game Over" Ace Attorney / Phoenix Wright triste.
 * Structure : descente C5→Bb4→Ab4→G4 (mineur naturel) + grondement final.
 * Timbre : sine pur (hautbois triste) + légère déclinaison de pitch.
 * Durée totale : ~850 ms — synchronisé avec la fermeture rapide (900 ms).
 */
function overlayDefeatTheme(): void {
  if (_muted || !isRunning()) return;
  const ctx = getCtx();
  const master = getMaster();
  const t = ctx.currentTime;

  // ── Descente mélancolique (mineur naturel C) ──────────────────────────────
  const melody: Array<{ freq: number; start: number; dur: number }> = [
    { freq: 523.25, start: 0.0, dur: 0.26 }, // C5
    { freq: 466.16, start: 0.22, dur: 0.24 }, // Bb4 (7e mineure)
    { freq: 415.3, start: 0.42, dur: 0.24 }, // Ab4 (6e mineure)
    { freq: 392.0, start: 0.62, dur: 0.5 }, // G5 — résolution longue
  ];

  melody.forEach(({ freq, start, dur }) => {
    const nT = t + start;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, nT);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.965, nT + dur); // glissando triste
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, nT);
    g.gain.linearRampToValueAtTime(0.22, nT + 0.038);
    g.gain.exponentialRampToValueAtTime(0.0001, nT + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(nT);
    osc.stop(nT + dur + 0.01);

    // Octave basse doublée (triangle, -12 demi-tons) — corps mélancolique
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq / 2, nT);
    osc2.frequency.exponentialRampToValueAtTime((freq / 2) * 0.96, nT + dur);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, nT);
    g2.gain.linearRampToValueAtTime(0.1, nT + 0.04);
    g2.gain.exponentialRampToValueAtTime(0.0001, nT + dur);
    osc2.connect(g2);
    g2.connect(master);
    osc2.start(nT);
    osc2.stop(nT + dur + 0.01);
  });

  // ── Grondement sourd final (fatalité) ─────────────────────────────────────
  setTimeout(() => {
    if (!isRunning()) return;
    oscBurst(60, 'sawtooth', 0.16, 480, 0.45);
    oscBurst(90, 'sawtooth', 0.09, 320, 0.5);
  }, 560);
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
  minigameTick,
  minigameFail,
  minigameSuccess,
  minigameDing,
  minigameDot,
  overlayVictoryFanfare,
  overlayDefeatTheme,
  initialize,
  setVolume,
  setMuted,
  setTickStyle,
  setTickInterval,
} as const;
