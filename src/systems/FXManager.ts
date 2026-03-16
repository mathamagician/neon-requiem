/**
 * FXManager — Phaser post-processing FX for the neon aesthetic.
 *
 * Uses Phaser 3.60+ built-in FX pipeline:
 * - Bloom on main camera (subtle neon glow on bright elements)
 * - Vignette during boss fights and low HP
 *
 * NOTE: preFX/postFX require WebGL renderer. If running in Canvas mode,
 * effects silently degrade (no crash).
 *
 * Phaser vignette radius: 1.0 = fully clear (no vignette), 0.0 = full black.
 * We store a "strength" (0 = off, higher = darker) and convert to radius.
 */
import Phaser from 'phaser';

let bloomFX: any = null;
let vignetteFX: any = null;
let vignetteStrength = 0; // 0 = off, 0.3-0.6 = visible darkening

/** Initialise camera-level FX. Call once in GameScene.create(). */
export function initCameraFX(camera: Phaser.Cameras.Scene2D.Camera) {
  // Guard: postFX only available in WebGL
  if (!camera.postFX) return;

  // Subtle bloom — makes bright neon colors glow
  bloomFX = camera.postFX.addBloom(0xffffff, 0.8, 0.8, 1.0, 1.2);

  // Vignette — starts fully clear (radius=1), fades in during boss fights / low HP
  vignetteFX = camera.postFX.addVignette(0.5, 0.5, 1.0);
}

/** Update FX each frame (call from GameScene.update). */
export function updateFX(
  delta: number,
  bossActive: boolean,
  hpRatio: number,
) {
  // Determine target vignette strength (0 = off, higher = darker edges)
  let targetStrength = 0;
  if (bossActive) targetStrength = 0.3;
  if (hpRatio < 0.25) targetStrength = Math.max(targetStrength, 0.5);
  else if (hpRatio < 0.5) targetStrength = Math.max(targetStrength, 0.2);

  // Smoothly lerp strength
  const speed = 0.003 * delta; // ~0.18/s at 60fps
  vignetteStrength += (targetStrength - vignetteStrength) * Math.min(speed, 1);

  // Convert strength to Phaser radius: radius = 1 - strength
  // strength 0 → radius 1.0 (clear), strength 0.5 → radius 0.5 (dark edges)
  if (vignetteFX) {
    vignetteFX.radius = 1.0 - vignetteStrength;
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
  vignetteStrength = 0;
}
