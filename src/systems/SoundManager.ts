/**
 * SoundManager — procedural audio using ZzFX.
 * No audio files needed. Each sound is defined as a parameter array
 * that ZzFX synthesizes at runtime (<1KB total).
 *
 * Design sounds at https://killedbyapixel.github.io/ZzFX/
 */
import { zzfx } from 'zzfx';

// Master volume (0-1)
let masterVolume = 0.3;

/** Set master volume (0-1) */
export function setSoundVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
}

export function getSoundVolume(): number {
  return masterVolume;
}

// -- Sound definitions (ZzFX parameter arrays) --
// Format: [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
//          slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation,
//          bitCrush, delay, sustainVolume, decay, tremolo]

const SOUNDS = {
  // Player actions
  jump:        [,,237,.02,.03,.13,1,1.93,7.4,,,,,.1,,,,.7,.04],
  doubleJump:  [,,391,.01,.02,.11,1,2.2,14,,,,,.1,,,,.6,.03],
  land:        [,,70,.01,.01,.05,4,,,,,,,,,,,.3],
  dash:        [,,150,.02,.02,.08,3,2.5,-8,,,,,3,,,,.5],
  wallJump:    [,,300,.02,.03,.12,1,1.5,10,,,,,.2,,,,.6,.04],

  // Combat
  swordHit:    [,,200,.01,.01,.08,2,2.5,,,400,.03,,,,,,.7],
  swordSwing:  [,,90,.01,.01,.05,4,0,,,,,,,,,,.4],
  spearThrust: [,,120,.01,.02,.06,4,1.5,2,,,,,,,,,,.5],
  shieldPunch: [,,80,.02,.04,.12,4,0.5,,,-20,.03,,,,,,0.6],
  gunShot:     [,,500,.01,.01,.06,3,1.5,-1,,,,,.5,,,,.5],
  chargedShot: [,,300,.03,.06,.15,3,2.5,1,,-50,.05,,1.5,,,,.7],
  enemyHit:    [,,300,.01,.01,.05,4,2,,,-50,.03,,,,,,.5],
  enemyDeath:  [,,120,.05,.15,.3,4,1.5,-1,,,-0.02,,,,,,,.1],
  backstab:    [,,250,.01,.02,.1,2,3,,,600,.04,,,,,,.8],
  critHit:     [,,400,.01,.02,.1,2,2.5,,,500,.04,,,,,,0.8],

  // Boss
  bossRoar:    [,,80,.1,.3,.5,4,1.5,-1,,,,,.3,,,,,.1],
  bossHit:     [,,200,.02,.03,.1,4,2,,,-30,.04,,,,,,.6],
  bossDeath:   [,,60,.1,.5,.8,4,1,-2,,,-0.01,,,,,,,.2],

  // Player damage
  playerHurt:  [,,300,.01,.03,.08,4,3,,,,-0.02,,,,,,.6],
  playerDeath: [,,200,.05,.2,.5,4,1.5,-2,,,-.01,,,,,,.3,.2],
  shieldBlock: [,,400,.01,.02,.08,2,0,,,200,.04,,,,,,.6],

  // Items & UI
  pickup:      [,,800,.02,.05,.1,1,2,,8,400,.06,,,,,,.6],
  goldPickup:  [,,1200,.01,.02,.06,1,2,,4,600,.04,,,,,,.4],
  levelUp:     [,,500,.03,.15,.3,1,2,,,,,.1,,,,,.7,,],
  menuSelect:  [,,700,.01,.01,.03,1,2,,,,,,,,,,,.3],
  menuConfirm: [,,500,.02,.04,.1,1,1.5,,4,200,.05,,,,,,.5],
  savePoint:   [,,600,.03,.1,.2,1,2,,3,300,.06,,,,,,.5],
  shopBuy:     [,,900,.02,.06,.12,1,2,,5,500,.05,,,,,,.6],
  powerAbsorb: [,,200,.05,.2,.4,1,2,,2,-100,.08,,,,,,.7,,],

  // Environmental
  zoneTransit: [,,300,.05,.15,.3,1,1.5,,,-100,.06,,,,,,.5,,],
} as const;

type SoundName = keyof typeof SOUNDS;

/** Play a named sound effect */
export function playSound(name: SoundName) {
  if (masterVolume <= 0) return;
  try {
    const params = [...SOUNDS[name]] as number[];
    // Scale volume (first param) by master volume
    params[0] = (params[0] || 1) * masterVolume;
    zzfx(...params);
  } catch {
    // Web Audio may not be initialized until first user interaction — silently ignore
  }
}
