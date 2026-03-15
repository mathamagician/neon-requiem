import Phaser from 'phaser';

/**
 * Deterministic pseudo-random noise function.
 * Returns a value in [0, 1) that is stable for any given (x, y, seed).
 */
function noise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

/** Deterministic random in [min, max) */
function noiseRange(i: number, seed: number, min: number, max: number): number {
  return min + noise(i, seed, seed + 7) * (max - min);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function renderZoneBackground(
  scene: Phaser.Scene,
  zoneId: string,
  worldWidth: number,
  worldHeight: number,
): void {
  switch (zoneId) {
    case 'foundry':
      renderFoundry(scene, worldWidth, worldHeight);
      break;
    case 'cryptvault':
      renderCryptvault(scene, worldWidth, worldHeight);
      break;
    case 'hub':
      renderHub(scene, worldWidth, worldHeight);
      break;
    default:
      renderFoundry(scene, worldWidth, worldHeight);
      break;
  }
}

// ---------------------------------------------------------------------------
// FOUNDRY — Industrial, lava, neon lights
// ---------------------------------------------------------------------------

function renderFoundry(scene: Phaser.Scene, ww: number, wh: number): void {
  // --- Layer 1: sky gradient + distant factory silhouettes ---
  const bg1 = scene.add.graphics();

  // Dark gradient sky — distinct from game background
  bg1.fillGradientStyle(0x1a0e20, 0x1a0e20, 0x3a1a22, 0x3a1a22, 1);
  bg1.fillRect(0, 0, ww, wh);

  // Factory silhouettes
  const factoryCount = Math.floor(ww / 120);
  for (let i = 0; i < factoryCount; i++) {
    const fx = noiseRange(i, 10, i * 120, i * 120 + 80);
    const fh = noiseRange(i, 20, 60, 140);
    const fw = noiseRange(i, 30, 40, 80);

    // Main building shape
    bg1.fillStyle(0x2a1828, 1);
    bg1.fillRect(fx, wh - fh, fw, fh);

    // Smokestack
    const stackW = 6 + Math.floor(noise(i, 0, 40) * 6);
    const stackH = noiseRange(i, 50, 30, 70);
    const stackX = fx + fw * 0.3 + noise(i, 0, 55) * fw * 0.4;
    bg1.fillRect(stackX, wh - fh - stackH, stackW, stackH);

    // Tiny neon windows
    const winCount = Math.floor(noise(i, 0, 60) * 5) + 2;
    for (let w = 0; w < winCount; w++) {
      const wx = fx + 4 + noise(w, i, 70) * (fw - 10);
      const wy = wh - fh + 8 + noise(w, i, 80) * (fh - 20);
      const winColor = noise(w, i, 90) > 0.5 ? 0xff4400 : 0x00ccff;
      const winAlpha = 0.25 + noise(w, i, 91) * 0.2;
      bg1.fillStyle(winColor, winAlpha);
      bg1.fillRect(wx, wy, 3, 3);
    }
  }

  bg1.setScrollFactor(0.1).setDepth(-100);

  // --- Layer 2: mid-ground structures with pipes ---
  const bg2 = scene.add.graphics();

  // Structures
  const structCount = Math.floor(ww / 80);
  for (let i = 0; i < structCount; i++) {
    const sx = noiseRange(i, 110, i * 80, i * 80 + 50);
    const sh = noiseRange(i, 120, 40, 90);
    const sw = noiseRange(i, 130, 25, 55);
    bg2.fillStyle(0x3a2a1a, 1);
    bg2.fillRect(sx, wh - sh, sw, sh);
  }

  // Horizontal pipes
  const pipeCount = 4 + Math.floor(noise(0, 0, 140) * 4);
  for (let i = 0; i < pipeCount; i++) {
    const py = wh * 0.25 + noiseRange(i, 150, 0, wh * 0.5);
    const pStartX = noiseRange(i, 160, 0, ww * 0.3);
    const pLen = noiseRange(i, 170, ww * 0.15, ww * 0.5);
    bg2.fillStyle(0x4a4a5a, 1);
    bg2.fillRect(pStartX, py, pLen, 3);
    // Pipe joint highlights
    for (let j = 0; j < pLen; j += 30) {
      bg2.fillStyle(0x5a5a6a, 0.6);
      bg2.fillRect(pStartX + j, py - 1, 4, 5);
    }
  }

  bg2.setScrollFactor(0.3).setDepth(-90);

  // --- Layer 3: lava river, neon glow, embers ---
  const bg3 = scene.add.graphics();

  // Lava river at the bottom
  const lavaTop = wh - 28;
  const lavaH = 28;
  // Draw lava as horizontal strips with varying warm colors
  for (let row = 0; row < lavaH; row += 2) {
    const t = row / lavaH;
    // Interpolate from #ff2200 (top) to #ffcc44 (bottom)
    const r = 0xff;
    const g = Math.floor(0x22 + (0xcc - 0x22) * t);
    const b = Math.floor(0x00 + (0x44 - 0x00) * t);
    const color = (r << 16) | (g << 8) | b;
    bg3.fillStyle(color, 0.7 + t * 0.25);
    bg3.fillRect(0, lavaTop + row, ww, 2);
  }

  // Neon light sources
  const neonCount = Math.floor(ww / 160) + 3;
  for (let i = 0; i < neonCount; i++) {
    const nx = noiseRange(i, 200, 20, ww - 20);
    const ny = noiseRange(i, 210, wh * 0.3, wh * 0.7);
    const neonColor = noise(i, 0, 220) > 0.5 ? 0x00ccff : 0xff4400;

    // Glow halo (large semi-transparent)
    bg3.fillStyle(neonColor, 0.12);
    bg3.fillCircle(nx, ny, 18);
    bg3.fillStyle(neonColor, 0.25);
    bg3.fillCircle(nx, ny, 8);
    // Bright center
    bg3.fillStyle(neonColor, 0.6);
    bg3.fillRect(nx - 1, ny - 1, 3, 3);
  }

  // Floating ember / spark particles
  const emberCount = Math.floor(ww / 40);
  for (let i = 0; i < emberCount; i++) {
    const ex = noiseRange(i, 230, 0, ww);
    const ey = noiseRange(i, 240, wh * 0.4, wh - 30);
    const emberColor = noise(i, 0, 250) > 0.5 ? 0xff6600 : 0xffaa00;
    const alpha = 0.5 + noise(i, 0, 260) * 0.4;
    bg3.fillStyle(emberColor, alpha);
    bg3.fillRect(ex, ey, 2, 2);
  }

  bg3.setScrollFactor(0.5).setDepth(-80);
}

// ---------------------------------------------------------------------------
// CRYPTVAULT — Gothic, spectral, underground
// ---------------------------------------------------------------------------

function renderCryptvault(scene: Phaser.Scene, ww: number, wh: number): void {
  // --- Layer 1: deep gradient + distant gothic arches ---
  const bg1 = scene.add.graphics();

  // Deep blue-purple gradient — visible against game bg
  bg1.fillGradientStyle(0x0c0c24, 0x0c0c24, 0x1a1a38, 0x1a1a38, 1);
  bg1.fillRect(0, 0, ww, wh);

  // Gothic arches
  const archCount = Math.floor(ww / 140) + 2;
  for (let i = 0; i < archCount; i++) {
    const ax = noiseRange(i, 300, i * 140, i * 140 + 100);
    const pillarH = noiseRange(i, 310, wh * 0.5, wh * 0.85);
    const pillarW = 8;
    const archSpan = noiseRange(i, 320, 30, 60);

    bg1.fillStyle(0x2a2a44, 1);

    // Left pillar
    bg1.fillRect(ax, wh - pillarH, pillarW, pillarH);
    // Right pillar
    bg1.fillRect(ax + archSpan, wh - pillarH, pillarW, pillarH);

    // Arch top — approximate with stacked rects narrowing upward
    const archTop = wh - pillarH;
    const archMidX = ax + pillarW / 2 + archSpan / 2;
    for (let step = 0; step < 8; step++) {
      const t = step / 8;
      const halfW = (archSpan / 2 + pillarW / 2) * (1 - t * t);
      const ry = archTop - step * 3;
      bg1.fillRect(archMidX - halfW, ry, halfW * 2, 3);
    }
  }

  bg1.setScrollFactor(0.1).setDepth(-100);

  // --- Layer 2: coffin shelves + hanging chains ---
  const bg2 = scene.add.graphics();

  // Stone shelves with coffins
  const shelfCount = Math.floor(ww / 100) + 2;
  for (let i = 0; i < shelfCount; i++) {
    const sx = noiseRange(i, 330, i * 100 - 10, i * 100 + 60);
    const sy = noiseRange(i, 340, wh * 0.35, wh * 0.65);
    const shelfW = noiseRange(i, 350, 50, 90);

    // Stone shelf
    bg2.fillStyle(0x33335a, 1);
    bg2.fillRect(sx, sy, shelfW, 4);

    // Coffin shapes on shelf
    const coffinCount = Math.floor(noise(i, 0, 360) * 3) + 1;
    for (let c = 0; c < coffinCount; c++) {
      const cx = sx + 6 + c * (shelfW / coffinCount);
      bg2.fillStyle(0xaaa088, 0.7);
      bg2.fillRect(cx, sy - 8, 12, 7);
      // Coffin lid detail
      bg2.fillStyle(0x88876a, 0.5);
      bg2.fillRect(cx + 1, sy - 7, 10, 1);
    }
  }

  // Hanging chains from ceiling
  const chainCount = Math.floor(ww / 60);
  for (let i = 0; i < chainCount; i++) {
    const cx = noiseRange(i, 370, 10, ww - 10);
    const chainLen = noiseRange(i, 380, 40, wh * 0.5);
    const segments = Math.floor(chainLen / 6);

    for (let s = 0; s < segments; s++) {
      const color = s % 2 === 0 ? 0x3a3a4a : 0x4a4a5a;
      bg2.fillStyle(color, 0.8);
      bg2.fillRect(cx, s * 6, 2, 5);
    }
  }

  bg2.setScrollFactor(0.3).setDepth(-90);

  // --- Layer 3: spectral light beams, particles, skulls ---
  const bg3 = scene.add.graphics();

  // Spectral light beams — thin diagonal semi-transparent triangles
  const beamCount = Math.floor(ww / 250) + 2;
  for (let i = 0; i < beamCount; i++) {
    const bx = noiseRange(i, 390, 50, ww - 50);
    const topW = noiseRange(i, 400, 4, 10);
    const bottomW = noiseRange(i, 410, 30, 60);
    const beamH = noiseRange(i, 420, wh * 0.4, wh * 0.8);

    // Draw beam as stacked horizontal lines getting wider
    bg3.fillStyle(0x4488ee, 0.15);
    const steps = Math.floor(beamH / 4);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const halfW = (topW + (bottomW - topW) * t) / 2;
      const drift = noise(i, s, 430) * 4 - 2; // slight wobble
      bg3.fillRect(bx - halfW + drift, s * 4, halfW * 2, 4);
    }
  }

  // Floating spectral particles
  const particleCount = Math.floor(ww / 30);
  for (let i = 0; i < particleCount; i++) {
    const px = noiseRange(i, 440, 0, ww);
    const py = noiseRange(i, 450, 10, wh - 20);
    const alpha = 0.3 + noise(i, 0, 460) * 0.35;
    bg3.fillStyle(0x66aaff, alpha);
    const size = noise(i, 0, 465) > 0.7 ? 3 : 2;
    bg3.fillRect(px, py, size, size);
  }

  // Small skull decorations along the floor line
  const skullCount = Math.floor(ww / 80);
  const floorY = wh - 20;
  for (let i = 0; i < skullCount; i++) {
    const sx = noiseRange(i, 470, 10, ww - 10);
    // Skull: small 5x5 pixel art
    bg3.fillStyle(0xccbb99, 0.7);
    // Cranium
    bg3.fillRect(sx, floorY, 5, 4);
    // Eyes (dark holes)
    bg3.fillStyle(0x1a1a2e, 0.9);
    bg3.fillRect(sx + 1, floorY + 1, 1, 1);
    bg3.fillRect(sx + 3, floorY + 1, 1, 1);
    // Jaw
    bg3.fillStyle(0xbbaa88, 0.6);
    bg3.fillRect(sx + 1, floorY + 4, 3, 1);
  }

  bg3.setScrollFactor(0.5).setDepth(-80);
}

// ---------------------------------------------------------------------------
// HUB (The Threshold) — Safe, twilight, urban
// ---------------------------------------------------------------------------

function renderHub(scene: Phaser.Scene, ww: number, wh: number): void {
  // --- Layer 1: twilight gradient + stars + glitched moon ---
  const bg1 = scene.add.graphics();

  // Twilight gradient — visible against game bg
  bg1.fillGradientStyle(0x1a1430, 0x1a1430, 0x3a2248, 0x3a2248, 1);
  bg1.fillRect(0, 0, ww, wh);

  // Stars
  const starCount = 40 + Math.floor(noise(0, 0, 500) * 20);
  for (let i = 0; i < starCount; i++) {
    const sx = noiseRange(i, 510, 0, ww);
    const sy = noiseRange(i, 520, 0, wh * 0.6);
    const starColor = noise(i, 0, 530) > 0.6 ? 0xffffff : 0xaaaacc;
    const alpha = 0.5 + noise(i, 0, 540) * 0.5;
    bg1.fillStyle(starColor, alpha);
    bg1.fillRect(sx, sy, 1, 1);
    // Some stars are 2px for a twinkle effect
    if (noise(i, 0, 545) > 0.8) {
      bg1.fillRect(sx + 1, sy, 1, 1);
    }
  }

  // Half-glitched moon
  const moonX = ww * 0.7;
  const moonY = wh * 0.2;
  const moonR = 16;

  // Draw moon as filled circle (using small rects for pixel look)
  for (let dy = -moonR; dy <= moonR; dy++) {
    const halfW = Math.floor(Math.sqrt(moonR * moonR - dy * dy));
    for (let dx = -halfW; dx <= halfW; dx++) {
      const px = moonX + dx;
      const py = moonY + dy;

      if (dx > 0) {
        // Right half: glitched — static pixels
        if (noise(dx, dy, 550) > 0.35) {
          const glitchColor = noise(dx, dy, 555) > 0.5 ? 0xccccdd : 0x888899;
          const glitchAlpha = 0.3 + noise(dx, dy, 558) * 0.5;
          bg1.fillStyle(glitchColor, glitchAlpha);
          bg1.fillRect(px, py, 1, 1);
        }
      } else {
        // Left half: solid moon
        bg1.fillStyle(0xccccdd, 0.85);
        bg1.fillRect(px, py, 1, 1);
      }
    }
  }

  bg1.setScrollFactor(0.1).setDepth(-100);

  // --- Layer 2: building silhouettes with lit windows + neon signs ---
  const bg2 = scene.add.graphics();

  const buildingCount = Math.floor(ww / 50) + 3;
  for (let i = 0; i < buildingCount; i++) {
    const bx = noiseRange(i, 560, i * 45 - 10, i * 45 + 30);
    const bh = noiseRange(i, 570, 40, wh * 0.6);
    const bw = noiseRange(i, 580, 20, 45);

    // Building base color varies slightly
    const shade = Math.floor(0x2a + noise(i, 0, 585) * (0x5a - 0x2a));
    const buildColor = (shade << 16) | (Math.floor(shade * 0.75) << 8) | Math.floor(shade * 0.75);
    bg2.fillStyle(buildColor, 1);
    bg2.fillRect(bx, wh - bh, bw, bh);

    // Lit windows
    const winRows = Math.floor(bh / 12);
    const winCols = Math.floor(bw / 10);
    for (let r = 0; r < winRows; r++) {
      for (let c = 0; c < winCols; c++) {
        if (noise(r, c + i * 100, 590) > 0.5) {
          const winColor = noise(r, c, 595) > 0.5 ? 0xffaa44 : 0xffcc66;
          bg2.fillStyle(winColor, 0.5);
          bg2.fillRect(bx + 3 + c * 10, wh - bh + 5 + r * 12, 5, 4);
        }
      }
    }

    // Some buildings get neon signs
    if (noise(i, 0, 600) > 0.65) {
      const signColors = [0x00ccff, 0xff00aa, 0xffdd00];
      const signColor = signColors[Math.floor(noise(i, 0, 610) * signColors.length)];
      const signW = noiseRange(i, 620, 8, 16);
      const signY = wh - bh + noiseRange(i, 630, 5, bh * 0.4);
      bg2.fillStyle(signColor, 0.7);
      bg2.fillRect(bx + 2, signY, signW, 4);
      // Glow around sign
      bg2.fillStyle(signColor, 0.15);
      bg2.fillRect(bx - 2, signY - 4, signW + 8, 12);
    }
  }

  bg2.setScrollFactor(0.3).setDepth(-90);

  // --- Layer 3: street level — puddles, lanterns ---
  const bg3 = scene.add.graphics();

  // Puddles reflecting neon colors
  const puddleCount = Math.floor(ww / 60) + 2;
  for (let i = 0; i < puddleCount; i++) {
    const px = noiseRange(i, 640, 10, ww - 10);
    const pw = noiseRange(i, 650, 12, 30);
    const puddleY = wh - 14 + noise(i, 0, 655) * 6;

    // Reflection colors
    const refColors = [0x00ccff, 0xff00aa, 0xffdd00, 0xffaa44];
    const refColor = refColors[Math.floor(noise(i, 0, 660) * refColors.length)];

    // Dark puddle base
    bg3.fillStyle(0x111122, 0.5);
    bg3.fillRect(px, puddleY, pw, 3);
    // Reflected color
    bg3.fillStyle(refColor, 0.1);
    bg3.fillRect(px + 2, puddleY, pw - 4, 2);
    // Specular highlight
    bg3.fillStyle(0xffffff, 0.08);
    bg3.fillRect(px + Math.floor(pw * 0.3), puddleY, 3, 1);
  }

  // Lantern posts with warm glow
  const lanternCount = Math.floor(ww / 100) + 1;
  for (let i = 0; i < lanternCount; i++) {
    const lx = noiseRange(i, 670, 20 + i * 90, 60 + i * 90);
    const postH = noiseRange(i, 680, 30, 50);
    const postY = wh - 18;

    // Post
    bg3.fillStyle(0x3a3a3a, 0.8);
    bg3.fillRect(lx, postY - postH, 2, postH);

    // Lantern head
    bg3.fillStyle(0x4a4a3a, 0.9);
    bg3.fillRect(lx - 2, postY - postH - 4, 6, 5);

    // Warm light glow
    bg3.fillStyle(0xffaa44, 0.04);
    bg3.fillCircle(lx + 1, postY - postH - 2, 24);
    bg3.fillStyle(0xffaa44, 0.1);
    bg3.fillCircle(lx + 1, postY - postH - 2, 10);
    // Bright center
    bg3.fillStyle(0xffcc66, 0.6);
    bg3.fillRect(lx - 1, postY - postH - 3, 4, 3);
  }

  bg3.setScrollFactor(0.5).setDepth(-80);
}
