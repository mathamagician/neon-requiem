/**
 * MusicManager — procedural ambient music using Web Audio API.
 * No audio files needed. Uses oscillators and gain envelopes to create
 * atmospheric ambient loops that match each zone's mood.
 *
 * Zones:
 *   hub       — warm, safe pads
 *   foundry   — industrial, tense drone
 *   cryptvault — eerie, dark ambience
 *   boss      — intense combat layer (layered on top of zone music)
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentZone: string | null = null;
let activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let musicVolume = 0.15;
let isPlaying = false;

// Bass note frequencies for each zone (root + 5th + octave creates a chord)
const ZONE_CONFIGS: Record<string, {
  notes: number[];    // Hz frequencies for oscillator chord
  types: OscillatorType[];
  volumes: number[];  // relative volume per voice
  lfoRate: number;    // tremolo speed (Hz)
  lfoDepth: number;   // tremolo depth (0-1)
}> = {
  hub: {
    notes: [110, 165, 220, 330],
    types: ['sine', 'sine', 'sine', 'triangle'],
    volumes: [0.4, 0.2, 0.15, 0.08],
    lfoRate: 0.15,
    lfoDepth: 0.3,
  },
  foundry: {
    notes: [55, 82.5, 110, 73.4],
    types: ['sawtooth', 'sine', 'triangle', 'square'],
    volumes: [0.12, 0.3, 0.15, 0.04],
    lfoRate: 0.08,
    lfoDepth: 0.4,
  },
  cryptvault: {
    notes: [65.4, 98, 130.8, 87.3],
    types: ['sine', 'sine', 'triangle', 'sine'],
    volumes: [0.35, 0.2, 0.1, 0.15],
    lfoRate: 0.05,
    lfoDepth: 0.5,
  },
};

function ensureContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = musicVolume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Start ambient music for the given zone. Crossfades if already playing. */
export function startMusic(zone: string): void {
  if (zone === currentZone && isPlaying) return;

  const config = ZONE_CONFIGS[zone];
  if (!config) return;

  // Fade out current music
  stopMusic(true);

  const ctx = ensureContext();
  currentZone = zone;
  isPlaying = true;

  // LFO for gentle tremolo
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = config.lfoRate;
  lfoGain.gain.value = config.lfoDepth * 0.15; // fixed modulation depth (masterGain handles volume)
  lfo.connect(lfoGain);

  // Create voices
  for (let i = 0; i < config.notes.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = config.types[i];
    osc.frequency.value = config.notes[i];

    // Slight detune for warmth
    osc.detune.value = (Math.random() - 0.5) * 10;

    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(masterGain!);

    // Connect LFO to modulate gain
    lfoGain.connect(gain.gain);

    osc.start();

    // Fade in over 2 seconds
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      config.volumes[i], // masterGain handles overall volume
      ctx.currentTime + 2
    );

    activeNodes.push({ osc, gain });
  }

  lfo.start();
  // Store LFO for cleanup (reuse the array with a dummy gain ref)
  activeNodes.push({ osc: lfo, gain: lfoGain });
}

/** Stop all music. If fade=true, fades out over 1.5s; otherwise stops immediately. */
export function stopMusic(fade = false): void {
  if (activeNodes.length === 0) return;

  const ctx = audioCtx;
  const nodesToStop = [...activeNodes];
  activeNodes = [];
  isPlaying = false;
  currentZone = null;

  if (fade && ctx) {
    for (const node of nodesToStop) {
      try {
        node.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      } catch { /* ignore */ }
    }
    setTimeout(() => {
      for (const node of nodesToStop) {
        try { node.osc.stop(); } catch { /* ignore */ }
      }
    }, 2000);
  } else {
    for (const node of nodesToStop) {
      try { node.osc.stop(); } catch { /* ignore */ }
    }
  }
}

/** Set music volume (0-1) */
export function setMusicVolume(v: number): void {
  musicVolume = Math.max(0, Math.min(1, v));
  if (masterGain) {
    masterGain.gain.value = musicVolume;
  }
}

export function getMusicVolume(): number {
  return musicVolume;
}
