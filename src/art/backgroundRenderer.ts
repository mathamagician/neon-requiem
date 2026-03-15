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

/** Interpolate between two hex colors */
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.floor(ar + (br - ar) * t);
  const g = Math.floor(ag + (bg - ag) * t);
  const bl = Math.floor(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Draw a vertical gradient on a Graphics using horizontal strips */
function fillGradient(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, topColor: number, bottomColor: number) {
  const stripH = 4;
  for (let row = 0; row < h; row += stripH) {
    const t = row / h;
    g.fillStyle(lerpColor(topColor, bottomColor, t), 1);
    g.fillRect(x, y + row, w, Math.min(stripH, h - row));
  }
}

/**
 * Generate a background layer: draw on Graphics → generateTexture → Image.
 * This is the same proven pattern BootScene uses and works reliably in WebGL.
 */
function createBgLayer(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  scrollFactor: number,
  depth: number,
  drawFn: (g: Phaser.GameObjects.Graphics) => void,
): Phaser.GameObjects.Image {
  const g = scene.add.graphics();
  drawFn(g);
  g.generateTexture(key, w, h);
  g.destroy();

  const img = scene.add.image(0, 0, key);
  img.setOrigin(0, 0);
  img.setScrollFactor(scrollFactor);
  img.setDepth(depth);
  return img;
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
  createBgLayer(scene, 'bg-foundry-1', ww, wh, 0.1, -100, (g) => {
    // Dark gradient sky
    fillGradient(g, 0, 0, ww, wh, 0x1a0e20, 0x3a1a22);

    // Factory silhouettes
    const factoryCount = Math.floor(ww / 120);
    for (let i = 0; i < factoryCount; i++) {
      const fx = noiseRange(i, 10, i * 120, i * 120 + 80);
      const fh = noiseRange(i, 20, 60, 140);
      const fw = noiseRange(i, 30, 40, 80);

      g.fillStyle(0x2a1828, 1);
      g.fillRect(fx, wh - fh, fw, fh);

      // Smokestack
      const stackW = 6 + Math.floor(noise(i, 0, 40) * 6);
      const stackH = noiseRange(i, 50, 30, 70);
      const stackX = fx + fw * 0.3 + noise(i, 0, 55) * fw * 0.4;
      g.fillRect(stackX, wh - fh - stackH, stackW, stackH);

      // Neon windows
      const winCount = Math.floor(noise(i, 0, 60) * 5) + 2;
      for (let w = 0; w < winCount; w++) {
        const wx = fx + 4 + noise(w, i, 70) * (fw - 10);
        const wy = wh - fh + 8 + noise(w, i, 80) * (fh - 20);
        const winColor = noise(w, i, 90) > 0.5 ? 0xff4400 : 0x00ccff;
        g.fillStyle(winColor, 0.35);
        g.fillRect(wx, wy, 3, 3);
      }
    }
  });

  // --- Layer 2: mid-ground structures with pipes ---
  createBgLayer(scene, 'bg-foundry-2', ww, wh, 0.3, -90, (g) => {
    const structCount = Math.floor(ww / 80);
    for (let i = 0; i < structCount; i++) {
      const sx = noiseRange(i, 110, i * 80, i * 80 + 50);
      const sh = noiseRange(i, 120, 40, 90);
      const sw = noiseRange(i, 130, 25, 55);
      g.fillStyle(0x3a2a1a, 1);
      g.fillRect(sx, wh - sh, sw, sh);
    }

    // Horizontal pipes
    const pipeCount = 4 + Math.floor(noise(0, 0, 140) * 4);
    for (let i = 0; i < pipeCount; i++) {
      const py = wh * 0.25 + noiseRange(i, 150, 0, wh * 0.5);
      const pStartX = noiseRange(i, 160, 0, ww * 0.3);
      const pLen = noiseRange(i, 170, ww * 0.15, ww * 0.5);
      g.fillStyle(0x5a5a6a, 1);
      g.fillRect(pStartX, py, pLen, 3);
      for (let j = 0; j < pLen; j += 30) {
        g.fillStyle(0x6a6a7a, 0.7);
        g.fillRect(pStartX + j, py - 1, 4, 5);
      }
    }
  });

  // --- Layer 3: lava river, neon glow, embers ---
  createBgLayer(scene, 'bg-foundry-3', ww, wh, 0.5, -80, (g) => {
    // Lava river at the bottom
    const lavaTop = wh - 28;
    const lavaH = 28;
    for (let row = 0; row < lavaH; row += 2) {
      const t = row / lavaH;
      const r = 0xff;
      const gr = Math.floor(0x22 + (0xcc - 0x22) * t);
      const b = Math.floor(0x00 + (0x44 - 0x00) * t);
      const color = (r << 16) | (gr << 8) | b;
      g.fillStyle(color, 0.8 + t * 0.2);
      g.fillRect(0, lavaTop + row, ww, 2);
    }

    // Neon light sources
    const neonCount = Math.floor(ww / 160) + 3;
    for (let i = 0; i < neonCount; i++) {
      const nx = noiseRange(i, 200, 20, ww - 20);
      const ny = noiseRange(i, 210, wh * 0.3, wh * 0.7);
      const neonColor = noise(i, 0, 220) > 0.5 ? 0x00ccff : 0xff4400;

      // Glow halo
      g.fillStyle(neonColor, 0.15);
      g.fillCircle(nx, ny, 18);
      g.fillStyle(neonColor, 0.3);
      g.fillCircle(nx, ny, 8);
      // Bright center
      g.fillStyle(neonColor, 0.7);
      g.fillRect(nx - 1, ny - 1, 3, 3);
    }

    // Floating embers
    const emberCount = Math.floor(ww / 40);
    for (let i = 0; i < emberCount; i++) {
      const ex = noiseRange(i, 230, 0, ww);
      const ey = noiseRange(i, 240, wh * 0.4, wh - 30);
      const emberColor = noise(i, 0, 250) > 0.5 ? 0xff6600 : 0xffaa00;
      g.fillStyle(emberColor, 0.6 + noise(i, 0, 260) * 0.3);
      g.fillRect(ex, ey, 2, 2);
    }
  });
}

// ---------------------------------------------------------------------------
// CRYPTVAULT — Gothic, spectral, underground
// ---------------------------------------------------------------------------

function renderCryptvault(scene: Phaser.Scene, ww: number, wh: number): void {
  // --- Layer 1: deep gradient + gothic arches ---
  createBgLayer(scene, 'bg-crypt-1', ww, wh, 0.1, -100, (g) => {
    fillGradient(g, 0, 0, ww, wh, 0x0c0c24, 0x1a1a38);

    // Gothic arches
    const archCount = Math.floor(ww / 140) + 2;
    for (let i = 0; i < archCount; i++) {
      const ax = noiseRange(i, 300, i * 140, i * 140 + 100);
      const pillarH = noiseRange(i, 310, wh * 0.5, wh * 0.85);
      const pillarW = 8;
      const archSpan = noiseRange(i, 320, 30, 60);

      g.fillStyle(0x2a2a44, 1);
      g.fillRect(ax, wh - pillarH, pillarW, pillarH);
      g.fillRect(ax + archSpan, wh - pillarH, pillarW, pillarH);

      const archTop = wh - pillarH;
      const archMidX = ax + pillarW / 2 + archSpan / 2;
      for (let step = 0; step < 8; step++) {
        const t = step / 8;
        const halfW = (archSpan / 2 + pillarW / 2) * (1 - t * t);
        g.fillRect(archMidX - halfW, archTop - step * 3, halfW * 2, 3);
      }
    }
  });

  // --- Layer 2: coffin shelves + chains ---
  createBgLayer(scene, 'bg-crypt-2', ww, wh, 0.3, -90, (g) => {
    const shelfCount = Math.floor(ww / 100) + 2;
    for (let i = 0; i < shelfCount; i++) {
      const sx = noiseRange(i, 330, i * 100 - 10, i * 100 + 60);
      const sy = noiseRange(i, 340, wh * 0.35, wh * 0.65);
      const shelfW = noiseRange(i, 350, 50, 90);

      g.fillStyle(0x33335a, 1);
      g.fillRect(sx, sy, shelfW, 4);

      const coffinCount = Math.floor(noise(i, 0, 360) * 3) + 1;
      for (let c = 0; c < coffinCount; c++) {
        const cx = sx + 6 + c * (shelfW / coffinCount);
        g.fillStyle(0xaaa088, 0.7);
        g.fillRect(cx, sy - 8, 12, 7);
        g.fillStyle(0x88876a, 0.5);
        g.fillRect(cx + 1, sy - 7, 10, 1);
      }
    }

    // Hanging chains
    const chainCount = Math.floor(ww / 60);
    for (let i = 0; i < chainCount; i++) {
      const cx = noiseRange(i, 370, 10, ww - 10);
      const chainLen = noiseRange(i, 380, 40, wh * 0.5);
      const segments = Math.floor(chainLen / 6);
      for (let s = 0; s < segments; s++) {
        g.fillStyle(s % 2 === 0 ? 0x3a3a4a : 0x4a4a5a, 0.8);
        g.fillRect(cx, s * 6, 2, 5);
      }
    }
  });

  // --- Layer 3: spectral beams, particles, skulls ---
  createBgLayer(scene, 'bg-crypt-3', ww, wh, 0.5, -80, (g) => {
    // Spectral light beams
    const beamCount = Math.floor(ww / 250) + 2;
    for (let i = 0; i < beamCount; i++) {
      const bx = noiseRange(i, 390, 50, ww - 50);
      const topW = noiseRange(i, 400, 4, 10);
      const bottomW = noiseRange(i, 410, 30, 60);
      const beamH = noiseRange(i, 420, wh * 0.4, wh * 0.8);

      g.fillStyle(0x4488ee, 0.18);
      const steps = Math.floor(beamH / 4);
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const halfW = (topW + (bottomW - topW) * t) / 2;
        const drift = noise(i, s, 430) * 4 - 2;
        g.fillRect(bx - halfW + drift, s * 4, halfW * 2, 4);
      }
    }

    // Spectral particles
    const particleCount = Math.floor(ww / 30);
    for (let i = 0; i < particleCount; i++) {
      const px = noiseRange(i, 440, 0, ww);
      const py = noiseRange(i, 450, 10, wh - 20);
      g.fillStyle(0x66aaff, 0.35 + noise(i, 0, 460) * 0.35);
      g.fillRect(px, py, noise(i, 0, 465) > 0.7 ? 3 : 2, noise(i, 0, 465) > 0.7 ? 3 : 2);
    }

    // Skulls along floor
    const skullCount = Math.floor(ww / 80);
    const floorY = wh - 20;
    for (let i = 0; i < skullCount; i++) {
      const sx = noiseRange(i, 470, 10, ww - 10);
      g.fillStyle(0xccbb99, 0.7);
      g.fillRect(sx, floorY, 5, 4);
      g.fillStyle(0x1a1a2e, 0.9);
      g.fillRect(sx + 1, floorY + 1, 1, 1);
      g.fillRect(sx + 3, floorY + 1, 1, 1);
      g.fillStyle(0xbbaa88, 0.6);
      g.fillRect(sx + 1, floorY + 4, 3, 1);
    }
  });
}

// ---------------------------------------------------------------------------
// HUB (The Threshold) — Safe, twilight, urban
// ---------------------------------------------------------------------------

function renderHub(scene: Phaser.Scene, ww: number, wh: number): void {
  // --- Layer 1: twilight gradient + stars + glitched moon ---
  createBgLayer(scene, 'bg-hub-1', ww, wh, 0.1, -100, (g) => {
    fillGradient(g, 0, 0, ww, wh, 0x1a1430, 0x3a2248);

    // Stars
    const starCount = 40 + Math.floor(noise(0, 0, 500) * 20);
    for (let i = 0; i < starCount; i++) {
      const sx = noiseRange(i, 510, 0, ww);
      const sy = noiseRange(i, 520, 0, wh * 0.6);
      const starColor = noise(i, 0, 530) > 0.6 ? 0xffffff : 0xaaaacc;
      g.fillStyle(starColor, 0.5 + noise(i, 0, 540) * 0.5);
      g.fillRect(sx, sy, 1, 1);
      if (noise(i, 0, 545) > 0.8) g.fillRect(sx + 1, sy, 1, 1);
    }

    // Half-glitched moon
    const moonX = ww * 0.7;
    const moonY = wh * 0.2;
    const moonR = 16;
    for (let dy = -moonR; dy <= moonR; dy++) {
      const halfW = Math.floor(Math.sqrt(moonR * moonR - dy * dy));
      for (let dx = -halfW; dx <= halfW; dx++) {
        if (dx > 0) {
          if (noise(dx, dy, 550) > 0.35) {
            g.fillStyle(noise(dx, dy, 555) > 0.5 ? 0xccccdd : 0x888899,
              0.3 + noise(dx, dy, 558) * 0.5);
            g.fillRect(moonX + dx, moonY + dy, 1, 1);
          }
        } else {
          g.fillStyle(0xccccdd, 0.85);
          g.fillRect(moonX + dx, moonY + dy, 1, 1);
        }
      }
    }
  });

  // --- Layer 2: buildings with lit windows + neon signs ---
  createBgLayer(scene, 'bg-hub-2', ww, wh, 0.3, -90, (g) => {
    const buildingCount = Math.floor(ww / 50) + 3;
    for (let i = 0; i < buildingCount; i++) {
      const bx = noiseRange(i, 560, i * 45 - 10, i * 45 + 30);
      const bh = noiseRange(i, 570, 40, wh * 0.6);
      const bw = noiseRange(i, 580, 20, 45);

      const shade = Math.floor(0x2a + noise(i, 0, 585) * (0x5a - 0x2a));
      const buildColor = (shade << 16) | (Math.floor(shade * 0.75) << 8) | Math.floor(shade * 0.75);
      g.fillStyle(buildColor, 1);
      g.fillRect(bx, wh - bh, bw, bh);

      const winRows = Math.floor(bh / 12);
      const winCols = Math.floor(bw / 10);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if (noise(r, c + i * 100, 590) > 0.5) {
            g.fillStyle(noise(r, c, 595) > 0.5 ? 0xffaa44 : 0xffcc66, 0.55);
            g.fillRect(bx + 3 + c * 10, wh - bh + 5 + r * 12, 5, 4);
          }
        }
      }

      if (noise(i, 0, 600) > 0.65) {
        const signColors = [0x00ccff, 0xff00aa, 0xffdd00];
        const signColor = signColors[Math.floor(noise(i, 0, 610) * signColors.length)];
        const signW = noiseRange(i, 620, 8, 16);
        const signY = wh - bh + noiseRange(i, 630, 5, bh * 0.4);
        g.fillStyle(signColor, 0.8);
        g.fillRect(bx + 2, signY, signW, 4);
        g.fillStyle(signColor, 0.2);
        g.fillRect(bx - 2, signY - 4, signW + 8, 12);
      }
    }
  });

  // --- Layer 3: street level — puddles, lanterns ---
  createBgLayer(scene, 'bg-hub-3', ww, wh, 0.5, -80, (g) => {
    const puddleCount = Math.floor(ww / 60) + 2;
    for (let i = 0; i < puddleCount; i++) {
      const px = noiseRange(i, 640, 10, ww - 10);
      const pw = noiseRange(i, 650, 12, 30);
      const puddleY = wh - 14 + noise(i, 0, 655) * 6;

      const refColors = [0x00ccff, 0xff00aa, 0xffdd00, 0xffaa44];
      const refColor = refColors[Math.floor(noise(i, 0, 660) * refColors.length)];

      g.fillStyle(0x111122, 0.5);
      g.fillRect(px, puddleY, pw, 3);
      g.fillStyle(refColor, 0.15);
      g.fillRect(px + 2, puddleY, pw - 4, 2);
      g.fillStyle(0xffffff, 0.1);
      g.fillRect(px + Math.floor(pw * 0.3), puddleY, 3, 1);
    }

    const lanternCount = Math.floor(ww / 100) + 1;
    for (let i = 0; i < lanternCount; i++) {
      const lx = noiseRange(i, 670, 20 + i * 90, 60 + i * 90);
      const postH = noiseRange(i, 680, 30, 50);
      const postY = wh - 18;

      g.fillStyle(0x3a3a3a, 0.8);
      g.fillRect(lx, postY - postH, 2, postH);
      g.fillStyle(0x4a4a3a, 0.9);
      g.fillRect(lx - 2, postY - postH - 4, 6, 5);

      // Warm glow
      g.fillStyle(0xffaa44, 0.06);
      g.fillCircle(lx + 1, postY - postH - 2, 24);
      g.fillStyle(0xffaa44, 0.15);
      g.fillCircle(lx + 1, postY - postH - 2, 10);
      g.fillStyle(0xffcc66, 0.7);
      g.fillRect(lx - 1, postY - postH - 3, 4, 3);
    }
  });
}
