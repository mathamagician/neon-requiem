/**
 * MusicManager — procedural ambient music using Web Audio API.
 * No audio files needed. Creates gentle, calming ambient pads with
 * a slow arpeggio pattern using soft sine waves and musical intervals.
 *
 * Each zone has a unique key/mood:
 *   hub        — warm major key, safe feeling
 *   foundry    — minor key, slightly tense but still ambient
 *   cryptvault — dark minor, mysterious atmosphere
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentZone: string | null = null;
let musicVolume = 0.06; // Very quiet — background ambience, not foreground
let isPlaying = false;

// Cleanup tracking
let activeOscillators: OscillatorNode[] = [];
let arpeggioInterval: ReturnType<typeof setInterval> | null = null;
let padGains: GainNode[] = [];

// Musical note frequencies (Hz)
const NOTE = {
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Gb3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Gb4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

interface ZoneMusic {
  padNotes: number[];       // sustained pad chord (sine waves)
  arpNotes: number[];       // arpeggio melody notes (cycled)
  arpSpeed: number;         // ms between arp notes
  arpAttack: number;        // seconds for each arp note fade-in
  arpRelease: number;       // seconds for each arp note fade-out
  padDetune: number;        // cents of chorus detune for warmth
}

const ZONE_MUSIC: Record<string, ZoneMusic> = {
  hub: {
    // C major 7 — warm, inviting, safe
    padNotes: [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.B3],
    arpNotes: [NOTE.E4, NOTE.G4, NOTE.C5, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.G4, NOTE.C4],
    arpSpeed: 1800,
    arpAttack: 0.3,
    arpRelease: 1.4,
    padDetune: 6,
  },
  foundry: {
    // A minor 7 — moody but not harsh
    padNotes: [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4],
    arpNotes: [NOTE.C5, NOTE.E4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.D4, NOTE.E4],
    arpSpeed: 2200,
    arpAttack: 0.4,
    arpRelease: 1.6,
    padDetune: 8,
  },
  cryptvault: {
    // Eb minor — dark, mysterious, ethereal
    padNotes: [NOTE.Eb3, NOTE.Gb3, NOTE.Bb3, NOTE.Eb4],
    arpNotes: [NOTE.Bb4, NOTE.Ab4, NOTE.Eb4, NOTE.Gb4, NOTE.Ab4, NOTE.Eb4, NOTE.Bb3, NOTE.Eb4],
    arpSpeed: 2800,
    arpAttack: 0.5,
    arpRelease: 2.0,
    padDetune: 10,
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

/** Create a soft sine pad voice with optional chorus detune */
function createPadVoice(ctx: AudioContext, freq: number, detune: number, vol: number): { osc: OscillatorNode; gain: GainNode } {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.detune.value = detune;

  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(masterGain!);

  osc.start();

  // Gentle fade in
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);

  return { osc, gain };
}

/** Play a single arpeggio note with attack/release envelope */
function playArpNote(ctx: AudioContext, freq: number, attack: number, release: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;
  // Very slight detune for shimmer
  osc.detune.value = (Math.random() - 0.5) * 4;

  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(masterGain!);

  const now = ctx.currentTime;
  const peakVol = 0.12; // Arp notes slightly louder than pad for melody

  // Envelope: fade in → hold briefly → fade out
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakVol, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + attack + release);

  osc.start(now);
  osc.stop(now + attack + release + 0.1);
}

/** Start ambient music for the given zone. */
export function startMusic(zone: string): void {
  if (zone === currentZone && isPlaying) return;

  const config = ZONE_MUSIC[zone];
  if (!config) return;

  // Stop any existing music
  stopMusic(true);

  const ctx = ensureContext();
  currentZone = zone;
  isPlaying = true;

  // === Pad layer: sustained sine chord with chorus ===
  const padVol = 0.08; // Very soft per-voice
  for (const freq of config.padNotes) {
    // Main voice
    const v1 = createPadVoice(ctx, freq, 0, padVol);
    activeOscillators.push(v1.osc);
    padGains.push(v1.gain);

    // Chorus voice (slightly detuned for warmth)
    const v2 = createPadVoice(ctx, freq, config.padDetune, padVol * 0.5);
    activeOscillators.push(v2.osc);
    padGains.push(v2.gain);

    // Counter-detuned chorus voice
    const v3 = createPadVoice(ctx, freq, -config.padDetune, padVol * 0.5);
    activeOscillators.push(v3.osc);
    padGains.push(v3.gain);
  }

  // === Arpeggio layer: gentle cycling melody ===
  let arpIndex = 0;
  arpeggioInterval = setInterval(() => {
    if (!isPlaying || !audioCtx) return;
    const note = config.arpNotes[arpIndex % config.arpNotes.length];
    playArpNote(audioCtx, note, config.arpAttack, config.arpRelease);
    arpIndex++;
  }, config.arpSpeed);
}

/** Stop all music. If fade=true, fades out over 2s; otherwise stops immediately. */
export function stopMusic(fade = false): void {
  // Stop arpeggio
  if (arpeggioInterval !== null) {
    clearInterval(arpeggioInterval);
    arpeggioInterval = null;
  }

  const oscs = [...activeOscillators];
  const gains = [...padGains];
  activeOscillators = [];
  padGains = [];
  isPlaying = false;
  currentZone = null;

  if (oscs.length === 0) return;

  if (fade && audioCtx) {
    const now = audioCtx.currentTime;
    for (const g of gains) {
      try { g.gain.linearRampToValueAtTime(0, now + 2); } catch { /* ignore */ }
    }
    setTimeout(() => {
      for (const o of oscs) {
        try { o.stop(); } catch { /* ignore */ }
      }
    }, 2500);
  } else {
    for (const o of oscs) {
      try { o.stop(); } catch { /* ignore */ }
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
