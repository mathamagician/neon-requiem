/**
 * FXManager — Phaser post-processing FX for the neon aesthetic.
 *
 * Uses Phaser 3.60+ built-in FX pipeline:
 * - Bloom on main camera (subtle neon glow on bright elements)
 * - Vignette during boss fights and low HP
 *
 * NOTE: preFX/postFX require WebGL renderer. If running in Canvas mode,
 * effects silently degrade (no crash).
 */
import Phaser from 'phaser';

let bloomFX: any = null;
let vignetteFX: any = null;
let vignetteTarget = 0; // 0 = off, 0.3-0.6 = active
let vignetteActive = false;

/** Initialise camera-level FX. Call once in GameScene.create(). */
export function initCameraFX(camera: Phaser.Cameras.Scene2D.Camera) {
  // Guard: postFX only available in WebGL
  if (!camera.postFX) return;

  // Subtle bloom — makes bright neon colors glow
  bloomFX = camera.postFX.addBloom(0xffffff, 0.8, 0.8, 1.2, 1.5);

  // Vignette — starts invisible, fades in during boss fights / low HP
  vignetteFX = camera.postFX.addVignette(0.5, 0.5, 0.0);
}

/** Update FX each frame (call from GameScene.update). */
export function updateFX(
  delta: number,
  bossActive: boolean,
  hpRatio: number,
) {
  // Determine target vignette strength
  let target = 0;
  if (bossActive) target = 0.3;
  if (hpRatio < 0.25) target = Math.max(target, 0.5);
  else if (hpRatio < 0.5) target = Math.max(target, 0.2);
  vignetteTarget = target;

  // Smoothly lerp vignette
  if (vignetteFX) {
    const current = vignetteFX.radius ?? 0;
    const speed = 0.003 * delta; // ~0.18/s at 60fps
    const next = current + (vignetteTarget - current) * Math.min(speed, 1);
    vignetteFX.radius = next;
  }
}

/** Flash bloom intensity briefly (e.g. on big hit). */
export function flashBloom(scene: Phaser.Scene, intensity = 2.5, duration = 150) {
  if (!bloomFX) return;
  const original = bloomFX.strength;
  bloomFX.strength = intensity;
  scene.time.delayedCall(duration, () => {
    bloomFX.strength = original;
  });
}

/** Clean up FX references (call on scene shutdown). */
export function destroyFX() {
  bloomFX = null;
  vignetteFX = null;
  vignetteTarget = 0;
  vignetteActive = false;
}
