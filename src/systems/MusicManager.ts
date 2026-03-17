/**
 * MusicManager — procedural ambient music using Web Audio API.
 * No audio files needed. Creates zone-specific ambient drones, a combat
 * rhythmic layer, and an intensified boss layer using OscillatorNode + GainNode.
 *
 * Zone tones:
 *   hub        — warm C major pad (safe, inviting)
 *   foundry    — C minor low oscillators (industrial, tense)
 *   cryptvault — diminished chord with slow LFO (dark, eerie)
 *   garden     — sus4 chord with gentle pulsing (organic, unsettling)
 *   citadel    — perfect 5ths square wave (cold, digital)
 *   *_boss     — parent zone tone but more intense
 *
 * Layers:
 *   ambient  — always-on zone drone (2-3 oscillators)
 *   combat   — rhythmic pulse added when enemies are near
 *   boss     — replaces ambient with intensified version when boss triggers
 *
 * Kept lightweight: max 3-4 oscillators active at once per layer.
 * Cross-fades between states over ~1s.
 */

// ---------------------------------------------------------------------------
// Audio context & master gain
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicVolume = 0.06;

function ensureCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = musicVolume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Note helpers
// ---------------------------------------------------------------------------

/** Convert MIDI note number to frequency */
function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// MIDI note names for readability
const C3 = 48, Eb3 = 51, E3 = 52, F3 = 53, G3 = 55, Ab3 = 56, B3 = 59;
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67;
const C5 = 72;

// ---------------------------------------------------------------------------
// Zone definitions
// ---------------------------------------------------------------------------

interface ZoneTone {
  /** Chord frequencies for ambient pad (2-3 voices) */
  chord: number[];
  /** Oscillator type for pad voices */
  type: OscillatorType;
  /** Optional LFO rate in Hz (0 = none) */
  lfoRate: number;
  /** LFO depth (gain modulation amount, 0-1) */
  lfoDepth: number;
  /** Detune in cents for chorus effect */
  detune: number;
  /** Base volume per voice (before master gain) */
  voiceVol: number;
  /** Arpeggio notes (cycled), null = no arpeggio */
  arpNotes: number[] | null;
  /** Arpeggio speed in ms */
  arpSpeed: number;
}

const ZONE_TONES: Record<string, ZoneTone> = {
  hub: {
    // C major — warm, safe, pad-like
    chord: [mtof(C3), mtof(E3), mtof(G3)],
    type: 'sine',
    lfoRate: 0,
    lfoDepth: 0,
    detune: 6,
    voiceVol: 0.1,
    arpNotes: [mtof(E4), mtof(G4), mtof(C5), mtof(G4)],
    arpSpeed: 1800,
  },
  foundry: {
    // C minor — industrial, tense, low oscillators
    chord: [mtof(C3), mtof(Eb3), mtof(G3)],
    type: 'sawtooth',
    lfoRate: 0.3,
    lfoDepth: 0.15,
    detune: 10,
    voiceVol: 0.07,
    arpNotes: null,
    arpSpeed: 0,
  },
  cryptvault: {
    // Diminished chord — dark, eerie, slow LFO
    chord: [mtof(B3), mtof(D4), mtof(F4), mtof(Ab3)],
    type: 'sine',
    lfoRate: 0.15,
    lfoDepth: 0.3,
    detune: 12,
    voiceVol: 0.08,
    arpNotes: [mtof(F4), mtof(D4), mtof(Ab3 + 12), mtof(B3 + 12)],
    arpSpeed: 2800,
  },
  garden: {
    // Csus4 — organic, unsettling, gentle pulsing
    chord: [mtof(C3), mtof(F3), mtof(G3)],
    type: 'triangle',
    lfoRate: 0.5,
    lfoDepth: 0.2,
    detune: 7,
    voiceVol: 0.09,
    arpNotes: [mtof(G4), mtof(F4), mtof(C4), mtof(F4)],
    arpSpeed: 2400,
  },
  citadel: {
    // Perfect 5ths — cold, digital, square wave
    chord: [mtof(C3), mtof(G3), mtof(D4)],
    type: 'square',
    lfoRate: 0,
    lfoDepth: 0,
    detune: 4,
    voiceVol: 0.04, // square is harsh, keep it low
    arpNotes: [mtof(G4), mtof(D4), mtof(C5), mtof(G4)],
    arpSpeed: 1600,
  },
  voidnexus: {
    // Tritone drone — dissonant, ominous, pulsing void
    chord: [mtof(C3), mtof(F3 + 1), mtof(B3)], // C + F# + B = tritone tension
    type: 'sawtooth',
    lfoRate: 0.25,
    lfoDepth: 0.35,
    detune: 15,
    voiceVol: 0.06,
    arpNotes: [mtof(B3 + 12), mtof(F4 + 1), mtof(C5), mtof(F4 + 1)],
    arpSpeed: 2000,
  },
};

function getZoneTone(zoneId: string): ZoneTone | null {
  // Boss zones use parent zone tone
  const base = zoneId.replace(/_boss$/, '');
  return ZONE_TONES[base] ?? null;
}

// ---------------------------------------------------------------------------
// Voice management — lightweight wrapper for osc + gain pairs
// ---------------------------------------------------------------------------

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
}

/** All active nodes for cleanup */
let ambientVoices: Voice[] = [];
let combatVoices: Voice[] = [];
let bossVoices: Voice[] = [];
let lfoNode: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;
let arpeggioTimer: ReturnType<typeof setInterval> | null = null;

function createVoice(
  freq: number,
  type: OscillatorType,
  vol: number,
  detuneCents: number,
  dest: AudioNode,
): Voice {
  const ac = ctx!;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detuneCents;
  gain.gain.value = 0; // start silent, fade in
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  // Fade in
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + 1.5);
  return { osc, gain };
}

function fadeOutVoices(voices: Voice[], duration = 1.5): void {
  if (!ctx || voices.length === 0) return;
  const now = ctx.currentTime;
  const toStop = [...voices];
  for (const v of toStop) {
    try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueAtTime(v.gain.gain.value, now);
      v.gain.gain.linearRampToValueAtTime(0, now + duration);
    } catch { /* ignore */ }
  }
  setTimeout(() => {
    for (const v of toStop) {
      try { v.osc.stop(); } catch { /* ignore */ }
      try { v.osc.disconnect(); } catch { /* ignore */ }
      try { v.gain.disconnect(); } catch { /* ignore */ }
    }
  }, (duration + 0.2) * 1000);
}

function stopVoicesImmediate(voices: Voice[]): void {
  for (const v of voices) {
    try { v.osc.stop(); } catch { /* ignore */ }
    try { v.osc.disconnect(); } catch { /* ignore */ }
    try { v.gain.disconnect(); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// State tracking
// ---------------------------------------------------------------------------

let currentZone: string | null = null;
let combatActive = false;
let bossActive = false;
let isPlaying = false;

// Layer-specific gain buses (so we can fade layers independently)
let ambientBus: GainNode | null = null;
let combatBus: GainNode | null = null;
let bossBus: GainNode | null = null;

function createBuses(): void {
  if (!ctx || !masterGain) return;
  if (!ambientBus) {
    ambientBus = ctx.createGain();
    ambientBus.gain.value = 1;
    ambientBus.connect(masterGain);
  }
  if (!combatBus) {
    combatBus = ctx.createGain();
    combatBus.gain.value = 0;
    combatBus.connect(masterGain);
  }
  if (!bossBus) {
    bossBus = ctx.createGain();
    bossBus.gain.value = 0;
    bossBus.connect(masterGain);
  }
}

// ---------------------------------------------------------------------------
// Ambient layer
// ---------------------------------------------------------------------------

function startAmbientLayer(tone: ZoneTone): void {
  if (!ctx || !ambientBus) return;

  // Pad voices (2-3 notes, main + chorus detuned copy = max 4 oscillators)
  // Limit to 3 chord tones max to stay lightweight
  const chordNotes = tone.chord.slice(0, 3);
  for (const freq of chordNotes) {
    // Main voice
    ambientVoices.push(createVoice(freq, tone.type, tone.voiceVol, 0, ambientBus));
    // Chorus voice (slightly detuned for warmth)
    ambientVoices.push(
      createVoice(freq, tone.type, tone.voiceVol * 0.4, tone.detune, ambientBus),
    );
  }

  // LFO modulation on ambient bus (if configured)
  if (tone.lfoRate > 0 && tone.lfoDepth > 0) {
    lfoNode = ctx.createOscillator();
    lfoGain = ctx.createGain();
    lfoNode.type = 'sine';
    lfoNode.frequency.value = tone.lfoRate;
    lfoGain.gain.value = tone.lfoDepth;
    lfoNode.connect(lfoGain);
    // Modulate the ambient bus gain
    lfoGain.connect(ambientBus.gain);
    lfoNode.start();
  }

  // Arpeggio (if configured)
  if (tone.arpNotes && tone.arpSpeed > 0) {
    let idx = 0;
    arpeggioTimer = setInterval(() => {
      if (!isPlaying || !ctx || !ambientBus || bossActive) return;
      const notes = tone.arpNotes!;
      const freq = notes[idx % notes.length];
      // Single short sine note
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 4;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ambientBus!);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + 1.4);
      osc.start(now);
      osc.stop(now + 1.6);
      idx++;
    }, tone.arpSpeed);
  }
}

function stopAmbientLayer(fade: boolean): void {
  if (arpeggioTimer !== null) {
    clearInterval(arpeggioTimer);
    arpeggioTimer = null;
  }
  if (lfoNode) {
    try { lfoNode.stop(); } catch { /* ignore */ }
    try { lfoNode.disconnect(); } catch { /* ignore */ }
    lfoNode = null;
  }
  if (lfoGain) {
    try { lfoGain.disconnect(); } catch { /* ignore */ }
    lfoGain = null;
  }
  if (fade) {
    fadeOutVoices(ambientVoices, 1.5);
  } else {
    stopVoicesImmediate(ambientVoices);
  }
  ambientVoices = [];
}

// ---------------------------------------------------------------------------
// Combat layer — rhythmic pulse that fades in when enemies are near
// ---------------------------------------------------------------------------

let combatPulseTimer: ReturnType<typeof setInterval> | null = null;

function startCombatLayer(tone: ZoneTone): void {
  if (!ctx || !combatBus) return;

  // Low sub-bass pulse
  const bassFreq = tone.chord[0]; // root note
  combatVoices.push(
    createVoice(bassFreq * 0.5, 'sine', 0.12, 0, combatBus),
  );

  // Rhythmic kick pulse (quarter notes at ~100 BPM = 600ms)
  combatPulseTimer = setInterval(() => {
    if (!isPlaying || !ctx || !combatBus || !combatActive) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = bassFreq * 0.25; // Very low sub
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(combatBus!);
    const now = ctx.currentTime;
    // Sharp attack, fast decay — percussive feel
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    // Pitch drop for kick drum feel
    osc.frequency.setValueAtTime(bassFreq * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(bassFreq * 0.15, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.35);
  }, 600);
}

function stopCombatLayer(fade: boolean): void {
  if (combatPulseTimer !== null) {
    clearInterval(combatPulseTimer);
    combatPulseTimer = null;
  }
  if (fade) {
    fadeOutVoices(combatVoices, 1.0);
  } else {
    stopVoicesImmediate(combatVoices);
  }
  combatVoices = [];
}

// ---------------------------------------------------------------------------
// Boss layer — replaces ambient with an intensified version
// ---------------------------------------------------------------------------

let bossPulseTimer: ReturnType<typeof setInterval> | null = null;

function startBossLayer(tone: ZoneTone): void {
  if (!ctx || !bossBus) return;

  // Intensified pad — lower, louder, more dissonant
  const root = tone.chord[0];
  // Distorted root drone
  bossVoices.push(createVoice(root * 0.5, 'sawtooth', 0.08, 0, bossBus));
  // Tritone tension (root + 6 semitones = tritone)
  bossVoices.push(createVoice(root * Math.pow(2, 6 / 12), 'sawtooth', 0.05, 8, bossBus));
  // High dissonant shimmer
  bossVoices.push(createVoice(root * 2 * Math.pow(2, 1 / 12), 'square', 0.02, -5, bossBus));

  // Fast rhythmic pulse (~140 BPM = ~430ms)
  bossPulseTimer = setInterval(() => {
    if (!isPlaying || !ctx || !bossBus || !bossActive) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = root * 0.25;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(bossBus!);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.frequency.setValueAtTime(root * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(root * 0.12, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.25);
  }, 430);
}

function stopBossLayer(fade: boolean): void {
  if (bossPulseTimer !== null) {
    clearInterval(bossPulseTimer);
    bossPulseTimer = null;
  }
  if (fade) {
    fadeOutVoices(bossVoices, 1.0);
  } else {
    stopVoicesImmediate(bossVoices);
  }
  bossVoices = [];
}

// ---------------------------------------------------------------------------
// Cross-fade helpers for layer buses
// ---------------------------------------------------------------------------

function fadeBus(bus: GainNode | null, target: number, duration = 1.0): void {
  if (!bus || !ctx) return;
  const now = ctx.currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(bus.gain.value, now);
  bus.gain.linearRampToValueAtTime(target, now + duration);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Start ambient music for the given zone. Handles boss zone suffixes. */
export function startZoneMusic(zoneId: string): void {
  if (zoneId === currentZone && isPlaying) return;

  const tone = getZoneTone(zoneId);
  if (!tone) return;

  // Stop everything first
  stopMusic();

  ensureCtx();
  createBuses();
  currentZone = zoneId;
  isPlaying = true;
  combatActive = false;
  bossActive = false;

  // Start ambient layer
  startAmbientLayer(tone);
  fadeBus(ambientBus, 1, 0.1);

  // Pre-create combat + boss layers (silent until activated)
  startCombatLayer(tone);
  startBossLayer(tone);
  fadeBus(combatBus, 0, 0.1);
  fadeBus(bossBus, 0, 0.1);

  // If this is a boss zone, auto-activate boss intensity
  if (zoneId.endsWith('_boss')) {
    setBossActive(true);
  }
}

/** Stop all music. Pass fade=true for a smooth fade-out. */
export function stopMusic(fade = false): void {
  if (fade) { fadeOutMusic(); return; }
  isPlaying = false;
  combatActive = false;
  bossActive = false;

  stopAmbientLayer(false);
  stopCombatLayer(false);
  stopBossLayer(false);

  currentZone = null;
}

/** Fade-stop variant for zone transitions. */
export function fadeOutMusic(): void {
  if (!isPlaying) return;
  isPlaying = false;
  combatActive = false;
  bossActive = false;

  stopAmbientLayer(true);
  stopCombatLayer(true);
  stopBossLayer(true);

  currentZone = null;
}

/** Activate/deactivate the combat rhythmic layer. */
export function setCombatActive(active: boolean): void {
  if (active === combatActive) return;
  combatActive = active;
  if (!isPlaying) return;

  if (active && !bossActive) {
    fadeBus(combatBus, 1, 0.8);
  } else {
    fadeBus(combatBus, 0, 1.2);
  }
}

/** Activate/deactivate the boss intensity layer. Replaces ambient when active. */
export function setBossActive(active: boolean): void {
  if (active === bossActive) return;
  bossActive = active;
  if (!isPlaying) return;

  if (active) {
    // Cross-fade: dim ambient, kill combat, bring in boss
    fadeBus(ambientBus, 0.2, 1.0);
    fadeBus(combatBus, 0, 0.5);
    fadeBus(bossBus, 1, 1.0);
  } else {
    // Restore ambient, remove boss
    fadeBus(bossBus, 0, 1.5);
    fadeBus(ambientBus, 1, 1.5);
  }
}

/** Set music master volume (0-1). */
export function setMusicVolume(v: number): void {
  musicVolume = Math.max(0, Math.min(1, v));
  if (masterGain) {
    masterGain.gain.value = musicVolume;
  }
}

/** Get current music volume (0-1). */
export function getMusicVolume(): number {
  return musicVolume;
}

// Legacy aliases for backward compatibility with existing imports
export { startZoneMusic as startMusic };
