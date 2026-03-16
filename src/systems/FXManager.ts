/**
 * FXManager — Phaser post-processing FX for the neon aesthetic.
 *
 * Uses Phaser 3.60+ built-in FX pipeline:
 * - Bloom on main camera (subtle neon glow on bright elements)
 * - Vignette during boss fights and low HP
 * - Red tint blink when very near death
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

// Red blink state
let redOverlay: Phaser.GameObjects.Graphics | null = null;
let redBlinkTimer = 0;

/** Initialise camera-level FX. Call once in GameScene.create(). */
export function initCameraFX(camera: Phaser.Cameras.Scene2D.Camera, scene: Phaser.Scene) {
  // Guard: postFX only available in WebGL
  if (!camera.postFX) return;

  // Subtle bloom — makes bright neon colors glow
  bloomFX = camera.postFX.addBloom(0xffffff, 0.8, 0.8, 1.0, 1.2);

  // Vignette — starts fully clear (radius=1), fades in during boss fights / low HP
  vignetteFX = camera.postFX.addVignette(0.5, 0.5, 1.0);

  // Red overlay for near-death blink (screen-space, follows camera)
  redOverlay = scene.add.graphics();
  redOverlay.setDepth(999);
  redOverlay.setScrollFactor(0);
  redOverlay.setAlpha(0);
}

/** Update FX each frame (call from GameScene.update). */
export function updateFX(
  delta: number,
  bossActive: boolean,
  hpRatio: number,
) {
  // Vignette: toned down — starts later, less intense
  let targetStrength = 0;
  if (bossActive) targetStrength = 0.2;         // was 0.3
  if (hpRatio < 0.15) targetStrength = Math.max(targetStrength, 0.35);  // was 0.5 at <0.25
  else if (hpRatio < 0.35) targetStrength = Math.max(targetStrength, 0.15); // was 0.2 at <0.5

  // Smoothly lerp strength
  const speed = 0.003 * delta; // ~0.18/s at 60fps
  vignetteStrength += (targetStrength - vignetteStrength) * Math.min(speed, 1);

  // Convert strength to Phaser radius: radius = 1 - strength
  if (vignetteFX) {
    vignetteFX.radius = 1.0 - vignetteStrength;
  }

  // Red blink when very near death (< 15% HP)
  if (redOverlay) {
    if (hpRatio < 0.15 && hpRatio > 0) {
      redBlinkTimer += delta;
      // Slow pulse: ~1.5s cycle, subtle red tint
      const pulse = Math.sin(redBlinkTimer * 0.004) * 0.5 + 0.5; // 0→1
      const alpha = pulse * 0.08; // Very subtle — max 8% opacity
      redOverlay.clear();
      redOverlay.fillStyle(0xff0000, 1);
      redOverlay.fillRect(0, 0, 640, 360);
      redOverlay.setAlpha(alpha);
    } else {
      redBlinkTimer = 0;
      redOverlay.setAlpha(0);
    }
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
  if (redOverlay) { redOverlay.destroy(); redOverlay = null; }
  redBlinkTimer = 0;
}
