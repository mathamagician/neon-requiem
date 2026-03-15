/**
 * spriteRenderer.ts — Upgraded pixel art sprite renderer
 *
 * Uses HTML5 Canvas 2D to draw detailed character and enemy sprites,
 * then registers them as Phaser textures via scene.textures.addCanvas().
 * Replaces the old pixel-array approach in spriteData.ts.
 */

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function noise(x: number, y: number, s: number = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

function hexToRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function blendColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + amt, g + amt, b + amt);
}

function fillEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
        ctx.fillRect(cx + x, cy + y, 1, 1);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Character drawing functions
// ---------------------------------------------------------------------------

function drawVanguard(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  // -- HELMET --
  const hDark = '#1a2850', hMid = '#2a4080', hLight = '#3a5aaa', hBright = '#5080cc', hShine = '#80aaee';
  fillRect(ctx, x + 10, y + 0, 12, 2, hDark);
  fillRect(ctx, x + 8, y + 2, 16, 2, hMid);
  fillRect(ctx, x + 7, y + 4, 18, 3, hLight);
  fillRect(ctx, x + 8, y + 5, 16, 2, hBright);
  fillRect(ctx, x + 8, y + 7, 16, 4, '#001828');
  fillRect(ctx, x + 9, y + 8, 14, 2, '#00ccff');
  fillRect(ctx, x + 10, y + 8, 6, 1, '#66eeff');
  fillRect(ctx, x + 18, y + 8, 4, 1, '#44ddff');
  px(ctx, x + 9, y + 8, '#00eeff');
  px(ctx, x + 22, y + 8, '#00eeff');
  fillRect(ctx, x + 8, y + 11, 16, 2, hMid);
  fillRect(ctx, x + 9, y + 13, 14, 1, hDark);
  fillRect(ctx, x + 11, y + 14, 10, 1, '#bbb8b0');
  fillRect(ctx, x + 14, y + 0, 4, 1, '#00aaff');
  fillRect(ctx, x + 15, y + 1, 2, 1, '#44ccff');
  // -- SHOULDER ARMOR --
  fillRect(ctx, x + 4, y + 15, 7, 5, hMid);
  fillRect(ctx, x + 5, y + 16, 5, 3, hLight);
  fillRect(ctx, x + 5, y + 16, 3, 1, hShine);
  fillRect(ctx, x + 21, y + 15, 7, 5, hMid);
  fillRect(ctx, x + 22, y + 16, 5, 3, hLight);
  fillRect(ctx, x + 24, y + 16, 3, 1, hShine);
  px(ctx, x + 6, y + 18, '#00ccff');
  px(ctx, x + 7, y + 19, '#00ccff');
  px(ctx, x + 24, y + 18, '#00ccff');
  px(ctx, x + 23, y + 19, '#00ccff');
  // -- CHEST ARMOR --
  fillRect(ctx, x + 10, y + 15, 12, 10, '#1e3060');
  fillRect(ctx, x + 11, y + 16, 10, 8, '#2a4580');
  fillRect(ctx, x + 12, y + 17, 8, 6, '#3558a0');
  fillRect(ctx, x + 12, y + 17, 4, 2, '#4070bb');
  fillRect(ctx, x + 14, y + 18, 4, 1, '#00ddff');
  fillRect(ctx, x + 15, y + 19, 2, 3, '#00bbdd');
  px(ctx, x + 14, y + 20, '#00ddff');
  px(ctx, x + 17, y + 20, '#00ddff');
  px(ctx, x + 15, y + 22, '#00aacc');
  // -- ARMS --
  fillRect(ctx, x + 5, y + 20, 5, 8, '#2a4580');
  fillRect(ctx, x + 6, y + 21, 3, 6, '#3558a0');
  fillRect(ctx, x + 6, y + 28, 4, 3, hMid);
  fillRect(ctx, x + 6, y + 28, 2, 1, hShine);
  fillRect(ctx, x + 22, y + 20, 5, 8, '#2a4580');
  fillRect(ctx, x + 23, y + 21, 3, 6, '#3558a0');
  fillRect(ctx, x + 22, y + 28, 4, 3, hMid);
  fillRect(ctx, x + 24, y + 28, 2, 1, hShine);
  // -- BELT --
  fillRect(ctx, x + 10, y + 25, 12, 2, '#443300');
  fillRect(ctx, x + 10, y + 25, 12, 1, '#664400');
  fillRect(ctx, x + 14, y + 25, 4, 2, '#ffd700');
  fillRect(ctx, x + 15, y + 25, 2, 1, '#ffe866');
  // -- LEGS --
  fillRect(ctx, x + 10, y + 27, 5, 9, '#1a2850');
  fillRect(ctx, x + 11, y + 28, 3, 7, '#223868');
  fillRect(ctx, x + 11, y + 29, 2, 1, '#2a4580');
  fillRect(ctx, x + 17, y + 27, 5, 9, '#1a2850');
  fillRect(ctx, x + 18, y + 28, 3, 7, '#223868');
  fillRect(ctx, x + 19, y + 29, 2, 1, '#2a4580');
  fillRect(ctx, x + 10, y + 31, 5, 2, hMid);
  fillRect(ctx, x + 17, y + 31, 5, 2, hMid);
  // -- BOOTS --
  fillRect(ctx, x + 9, y + 36, 6, 3, '#1a2040');
  fillRect(ctx, x + 10, y + 36, 4, 2, '#223060');
  fillRect(ctx, x + 9, y + 38, 7, 2, '#151830');
  fillRect(ctx, x + 17, y + 36, 6, 3, '#1a2040');
  fillRect(ctx, x + 18, y + 36, 4, 2, '#223060');
  fillRect(ctx, x + 16, y + 38, 7, 2, '#151830');
  // -- PLASMA BLADE --
  fillRect(ctx, x + 27, y + 22, 2, 5, '#555566');
  fillRect(ctx, x + 26, y + 23, 4, 1, '#777788');
  fillRect(ctx, x + 26, y + 26, 4, 1, '#777788');
  fillRect(ctx, x + 25, y + 21, 6, 2, '#666688');
  fillRect(ctx, x + 26, y + 21, 4, 1, '#8888aa');
  for (let i = 0; i < 18; i++) {
    const t = i / 18;
    const w = Math.max(1, Math.round(3 - t * 2));
    const c = blendColor('#ffffff', '#0066cc', t * 0.6);
    fillRect(ctx, x + 27 - Math.floor(w / 2), y + 3 + i, w, 1, c);
  }
  for (let i = 0; i < 16; i++) {
    const t = i / 16;
    px(ctx, x + 25, y + 4 + i, blendColor('#00ccff', '#002244', t));
    px(ctx, x + 30, y + 4 + i, blendColor('#00ccff', '#002244', t));
  }
  px(ctx, x + 28, y + 2, '#ffffff');
  px(ctx, x + 27, y + 3, '#ccddff');
  px(ctx, x + 28, y + 3, '#eef4ff');
}

function drawGunner(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  const hDark = '#5a2010', hMid = '#8a3820', hLight = '#bb5535', hBright = '#dd7755', hShine = '#eea080';
  fillRect(ctx, x + 10, y + 0, 12, 2, hDark);
  fillRect(ctx, x + 8, y + 2, 16, 3, hMid);
  fillRect(ctx, x + 7, y + 5, 18, 2, hLight);
  fillRect(ctx, x + 9, y + 3, 6, 1, hShine);
  fillRect(ctx, x + 7, y + 7, 18, 3, '#0a2a1a');
  fillRect(ctx, x + 8, y + 7, 16, 2, '#00aa66');
  fillRect(ctx, x + 9, y + 7, 5, 1, '#44ffaa');
  fillRect(ctx, x + 17, y + 7, 5, 1, '#33dd99');
  px(ctx, x + 22, y + 8, '#ff4444');
  px(ctx, x + 23, y + 7, '#ff2222');
  fillRect(ctx, x + 8, y + 10, 16, 2, hMid);
  fillRect(ctx, x + 10, y + 12, 12, 1, hDark);
  fillRect(ctx, x + 12, y + 13, 8, 1, '#bbb0a0');
  // TORSO
  fillRect(ctx, x + 9, y + 14, 14, 11, '#3a2015');
  fillRect(ctx, x + 10, y + 15, 12, 9, '#4a3025');
  fillRect(ctx, x + 11, y + 16, 10, 7, '#5a4035');
  fillRect(ctx, x + 11, y + 18, 4, 3, '#3a2818');
  fillRect(ctx, x + 12, y + 19, 2, 1, '#554030');
  fillRect(ctx, x + 17, y + 18, 4, 3, '#3a2818');
  fillRect(ctx, x + 18, y + 19, 2, 1, '#554030');
  px(ctx, x + 15, y + 16, '#00ff88');
  px(ctx, x + 16, y + 16, '#00cc66');
  // ARMS
  fillRect(ctx, x + 5, y + 15, 4, 9, '#4a3025');
  fillRect(ctx, x + 6, y + 16, 2, 7, '#5a4035');
  fillRect(ctx, x + 23, y + 15, 4, 9, '#4a3025');
  fillRect(ctx, x + 24, y + 16, 2, 7, '#5a4035');
  // ARM CANNON
  fillRect(ctx, x + 26, y + 18, 8, 7, '#555566');
  fillRect(ctx, x + 27, y + 19, 6, 5, '#666688');
  fillRect(ctx, x + 28, y + 20, 4, 3, '#7777aa');
  fillRect(ctx, x + 34, y + 19, 3, 5, '#777799');
  fillRect(ctx, x + 34, y + 20, 3, 3, '#8888bb');
  fillRect(ctx, x + 37, y + 20, 2, 3, '#00ffaa');
  fillRect(ctx, x + 37, y + 21, 1, 1, '#ffffff');
  px(ctx, x + 27, y + 19, '#444455');
  px(ctx, x + 27, y + 23, '#444455');
  fillRect(ctx, x + 29, y + 21, 2, 1, '#00ffaa');
  // BELT
  fillRect(ctx, x + 9, y + 25, 14, 2, '#336655');
  fillRect(ctx, x + 14, y + 25, 4, 2, '#44aa88');
  fillRect(ctx, x + 15, y + 25, 2, 1, '#66ccaa');
  // LEGS
  fillRect(ctx, x + 10, y + 27, 5, 9, '#3a2015');
  fillRect(ctx, x + 11, y + 28, 3, 7, '#4a3025');
  fillRect(ctx, x + 17, y + 27, 5, 9, '#3a2015');
  fillRect(ctx, x + 18, y + 28, 3, 7, '#4a3025');
  fillRect(ctx, x + 10, y + 31, 5, 2, '#555566');
  fillRect(ctx, x + 17, y + 31, 5, 2, '#555566');
  // BOOTS
  fillRect(ctx, x + 9, y + 36, 6, 2, '#2a2018');
  fillRect(ctx, x + 9, y + 38, 7, 2, '#221a10');
  fillRect(ctx, x + 17, y + 36, 6, 2, '#2a2018');
  fillRect(ctx, x + 16, y + 38, 7, 2, '#221a10');
}

function drawWraith(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  const cDark = '#1a0830', cMid = '#2a1050', cLight = '#3a1870', cBright = '#5030a0', cShine = '#7050cc';
  fillRect(ctx, x + 10, y + 0, 12, 1, cDark);
  fillRect(ctx, x + 8, y + 1, 16, 2, cMid);
  fillRect(ctx, x + 6, y + 3, 20, 3, cLight);
  fillRect(ctx, x + 7, y + 4, 6, 1, cShine);
  fillRect(ctx, x + 5, y + 6, 22, 2, cBright);
  fillRect(ctx, x + 8, y + 6, 16, 3, '#0a0018');
  px(ctx, x + 11, y + 7, '#ff44ff'); px(ctx, x + 12, y + 7, '#dd22dd');
  px(ctx, x + 19, y + 7, '#dd22dd'); px(ctx, x + 20, y + 7, '#ff44ff');
  px(ctx, x + 11, y + 8, '#cc00cc'); px(ctx, x + 20, y + 8, '#cc00cc');
  fillRect(ctx, x + 9, y + 9, 14, 2, '#1a0828');
  fillRect(ctx, x + 10, y + 11, 12, 1, '#2a1040');
  fillRect(ctx, x + 12, y + 12, 8, 1, '#888088');
  // CLOAK
  fillRect(ctx, x + 3, y + 13, 26, 3, cMid);
  fillRect(ctx, x + 4, y + 14, 24, 2, cLight);
  fillRect(ctx, x + 5, y + 15, 4, 1, cShine);
  fillRect(ctx, x + 5, y + 16, 22, 8, cMid);
  fillRect(ctx, x + 6, y + 17, 20, 6, cLight);
  fillRect(ctx, x + 7, y + 18, 18, 4, cBright);
  // Tattered edges
  for (let i = 0; i < 10; i++) {
    const tx = x + 5 + i * 2.2;
    const tlen = 2 + (noise(i, 0, 100) * 4) | 0;
    fillRect(ctx, tx, y + 24, 2, tlen, cMid);
    if (noise(i, 1, 100) > 0.5) fillRect(ctx, tx, y + 24 + tlen, 1, 2, cDark);
  }
  for (let i = 0; i < 5; i++) fillRect(ctx, x + 8 + i * 4, y + 19, 1, 4, cDark);
  fillRect(ctx, x + 9, y + 12, 14, 2, '#3a1555');
  fillRect(ctx, x + 10, y + 12, 5, 1, '#5030a0');
  // ARMS
  fillRect(ctx, x + 3, y + 16, 3, 10, '#2a1050');
  fillRect(ctx, x + 4, y + 17, 2, 8, '#3a1870');
  px(ctx, x + 3, y + 18, '#4a2880'); px(ctx, x + 3, y + 21, '#4a2880'); px(ctx, x + 4, y + 20, '#4a2880');
  fillRect(ctx, x + 26, y + 16, 3, 10, '#2a1050');
  fillRect(ctx, x + 26, y + 17, 2, 8, '#3a1870');
  px(ctx, x + 27, y + 18, '#4a2880'); px(ctx, x + 27, y + 21, '#4a2880');
  // DAGGERS
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const c = blendColor('#ffffff', '#8844cc', t * 0.8);
    px(ctx, x + 1 - Math.floor(i * 0.3), y + 15 + i, c);
    if (i < 8) px(ctx, x + 2 - Math.floor(i * 0.3), y + 15 + i, shade(c, -30));
  }
  fillRect(ctx, x + 2, y + 26, 2, 3, '#555566');
  px(ctx, x + 2, y + 26, '#888899');
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const c = blendColor('#ffffff', '#8844cc', t * 0.8);
    px(ctx, x + 29 + Math.floor(i * 0.3), y + 15 + i, c);
    if (i < 8) px(ctx, x + 30 + Math.floor(i * 0.3), y + 15 + i, shade(c, -30));
  }
  fillRect(ctx, x + 28, y + 26, 2, 3, '#555566');
  // LEGS
  fillRect(ctx, x + 11, y + 28, 4, 8, '#1a0830');
  fillRect(ctx, x + 12, y + 29, 2, 6, '#2a1050');
  fillRect(ctx, x + 17, y + 28, 4, 8, '#1a0830');
  fillRect(ctx, x + 18, y + 29, 2, 6, '#2a1050');
  // BOOTS
  fillRect(ctx, x + 10, y + 36, 5, 2, '#110420');
  fillRect(ctx, x + 10, y + 38, 6, 2, '#0a0218');
  fillRect(ctx, x + 17, y + 36, 5, 2, '#110420');
  fillRect(ctx, x + 16, y + 38, 6, 2, '#0a0218');
}

// ---------------------------------------------------------------------------
// Enemy drawing functions
// ---------------------------------------------------------------------------

function drawWorkerBot(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  fillRect(ctx, x + 6, y + 1, 8, 2, '#555566');
  fillRect(ctx, x + 4, y + 3, 12, 3, '#666677');
  fillRect(ctx, x + 3, y + 6, 14, 6, '#777788');
  fillRect(ctx, x + 4, y + 7, 12, 4, '#888899');
  fillRect(ctx, x + 5, y + 4, 10, 3, '#222233');
  fillRect(ctx, x + 6, y + 5, 3, 1, '#ff3300');
  fillRect(ctx, x + 11, y + 5, 3, 1, '#ff3300');
  px(ctx, x + 7, y + 5, '#ff6644');
  px(ctx, x + 12, y + 5, '#ff6644');
  fillRect(ctx, x + 7, y + 8, 6, 1, '#666677');
  px(ctx, x + 9, y + 9, '#00ccff');
  fillRect(ctx, x + 1, y + 6, 3, 5, '#555566');
  fillRect(ctx, x + 0, y + 10, 3, 2, '#666677');
  fillRect(ctx, x + 16, y + 6, 3, 5, '#555566');
  fillRect(ctx, x + 17, y + 10, 3, 2, '#666677');
  fillRect(ctx, x + 5, y + 12, 3, 4, '#444455');
  fillRect(ctx, x + 12, y + 12, 3, 4, '#444455');
  fillRect(ctx, x + 4, y + 15, 4, 2, '#555566');
  fillRect(ctx, x + 12, y + 15, 4, 2, '#555566');
}

function drawSlagGolem(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  fillRect(ctx, x + 5, y + 0, 10, 3, '#774400');
  fillRect(ctx, x + 3, y + 3, 14, 5, '#885500');
  fillRect(ctx, x + 2, y + 8, 16, 6, '#996600');
  fillRect(ctx, x + 4, y + 14, 12, 4, '#774400');
  fillRect(ctx, x + 5, y + 5, 2, 6, '#ff6600');
  fillRect(ctx, x + 8, y + 3, 1, 8, '#ff8800');
  fillRect(ctx, x + 12, y + 6, 2, 5, '#ff6600');
  px(ctx, x + 6, y + 10, '#ffaa00');
  px(ctx, x + 13, y + 8, '#ffaa00');
  fillRect(ctx, x + 5, y + 3, 3, 2, '#ffcc00');
  fillRect(ctx, x + 12, y + 3, 3, 2, '#ffcc00');
  px(ctx, x + 6, y + 3, '#ffffff');
  px(ctx, x + 13, y + 3, '#ffffff');
  fillRect(ctx, x + 0, y + 5, 3, 8, '#885500');
  fillRect(ctx, x + 17, y + 5, 3, 8, '#885500');
  fillRect(ctx, x + 0, y + 9, 2, 1, '#ff6600');
  fillRect(ctx, x + 18, y + 9, 2, 1, '#ff6600');
  fillRect(ctx, x + 5, y + 17, 4, 3, '#663300');
  fillRect(ctx, x + 11, y + 17, 4, 3, '#663300');
}

function drawSkeleton(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  fillRect(ctx, x + 6, y + 0, 8, 2, '#ddccbb');
  fillRect(ctx, x + 5, y + 2, 10, 4, '#ccbbaa');
  fillRect(ctx, x + 6, y + 3, 8, 2, '#ddccbb');
  fillRect(ctx, x + 6, y + 3, 3, 2, '#111111');
  fillRect(ctx, x + 11, y + 3, 3, 2, '#111111');
  px(ctx, x + 7, y + 3, '#4466ff');
  px(ctx, x + 12, y + 3, '#4466ff');
  fillRect(ctx, x + 7, y + 6, 6, 1, '#bbaa99');
  fillRect(ctx, x + 8, y + 7, 4, 1, '#aa9988');
  px(ctx, x + 8, y + 6, '#ddccbb'); px(ctx, x + 10, y + 6, '#ddccbb'); px(ctx, x + 12, y + 6, '#ddccbb');
  fillRect(ctx, x + 7, y + 8, 6, 1, '#ccbbaa');
  fillRect(ctx, x + 6, y + 9, 2, 4, '#bbaa99');
  fillRect(ctx, x + 12, y + 9, 2, 4, '#bbaa99');
  fillRect(ctx, x + 8, y + 10, 4, 1, '#bbaa99');
  fillRect(ctx, x + 7, y + 12, 6, 1, '#ccbbaa');
  fillRect(ctx, x + 9, y + 9, 2, 5, '#aa9988');
  fillRect(ctx, x + 3, y + 9, 3, 1, '#bbaa99');
  fillRect(ctx, x + 2, y + 10, 2, 5, '#aa9988');
  fillRect(ctx, x + 14, y + 9, 3, 1, '#bbaa99');
  fillRect(ctx, x + 16, y + 10, 2, 5, '#aa9988');
  fillRect(ctx, x + 7, y + 14, 6, 2, '#bbaa99');
  fillRect(ctx, x + 7, y + 16, 2, 5, '#aa9988');
  fillRect(ctx, x + 11, y + 16, 2, 5, '#aa9988');
  fillRect(ctx, x + 6, y + 20, 3, 2, '#aa9988');
  fillRect(ctx, x + 11, y + 20, 3, 2, '#aa9988');
  fillRect(ctx, x + 1, y + 5, 1, 10, '#aaaacc');
  fillRect(ctx, x + 1, y + 4, 1, 2, '#ccccee');
  px(ctx, x + 1, y + 3, '#ffffff');
  fillRect(ctx, x + 0, y + 14, 3, 1, '#666677');
}

function drawGhost(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  fillRect(ctx, x + 6, y + 0, 8, 3, '#5588ee');
  fillRect(ctx, x + 4, y + 3, 12, 4, '#4477dd');
  fillRect(ctx, x + 3, y + 7, 14, 5, '#3366cc');
  fillRect(ctx, x + 5, y + 5, 10, 3, '#6699ee');
  fillRect(ctx, x + 6, y + 4, 4, 2, '#88bbff');
  px(ctx, x + 7, y + 3, '#aaddff');
  fillRect(ctx, x + 5, y + 5, 3, 3, '#ffffff');
  fillRect(ctx, x + 12, y + 5, 3, 3, '#ffffff');
  fillRect(ctx, x + 6, y + 6, 2, 2, '#000033');
  fillRect(ctx, x + 12, y + 6, 2, 2, '#000033');
  fillEllipse(ctx, x + 9, y + 9, 2, 1, '#1a2266');
  fillRect(ctx, x + 4, y + 12, 3, 3, '#3366cc');
  fillRect(ctx, x + 8, y + 13, 4, 2, '#2255bb');
  fillRect(ctx, x + 13, y + 12, 3, 3, '#3366cc');
  fillRect(ctx, x + 5, y + 14, 2, 2, '#2255bb');
  fillRect(ctx, x + 13, y + 14, 2, 2, '#2255bb');
  px(ctx, x + 6, y + 16, '#1144aa');
  px(ctx, x + 10, y + 15, '#1144aa');
  px(ctx, x + 14, y + 16, '#1144aa');
}

function drawBoneArcher(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  fillRect(ctx, x + 7, y + 0, 6, 2, '#ccbbaa');
  fillRect(ctx, x + 6, y + 2, 8, 3, '#bbaa99');
  fillRect(ctx, x + 7, y + 3, 2, 2, '#111111');
  fillRect(ctx, x + 11, y + 3, 2, 2, '#111111');
  px(ctx, x + 7, y + 3, '#ff4444'); px(ctx, x + 11, y + 3, '#ff4444');
  fillRect(ctx, x + 8, y + 5, 4, 1, '#bbaa99');
  fillRect(ctx, x + 8, y + 6, 4, 2, '#aa9988');
  fillRect(ctx, x + 7, y + 8, 6, 1, '#bbaa99');
  fillRect(ctx, x + 8, y + 9, 4, 4, '#aa9988');
  fillRect(ctx, x + 8, y + 13, 2, 5, '#998877');
  fillRect(ctx, x + 11, y + 13, 2, 5, '#998877');
  fillRect(ctx, x + 7, y + 17, 3, 2, '#998877');
  fillRect(ctx, x + 11, y + 17, 3, 2, '#998877');
  for (let i = 0; i < 14; i++) {
    const bx = x + 2 + Math.sin((i / 14) * Math.PI) * 3;
    px(ctx, bx | 0, y + 2 + i, '#886644');
  }
  for (let i = 0; i < 14; i++) px(ctx, x + 4, y + 2 + i, '#aaaaaa');
  fillRect(ctx, x + 4, y + 8, 10, 1, '#886644');
  px(ctx, x + 14, y + 7, '#aabbcc'); px(ctx, x + 14, y + 8, '#aabbcc'); px(ctx, x + 14, y + 9, '#aabbcc');
  px(ctx, x + 15, y + 8, '#ccddee');
}

function drawPlantCreature(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const x = ox, y = oy;
  fillRect(ctx, x + 5, y + 0, 3, 3, '#338844');
  fillRect(ctx, x + 12, y + 0, 3, 3, '#338844');
  fillRect(ctx, x + 4, y + 2, 5, 2, '#44aa55');
  fillRect(ctx, x + 11, y + 2, 5, 2, '#44aa55');
  fillRect(ctx, x + 5, y + 4, 10, 5, '#226633');
  fillRect(ctx, x + 6, y + 5, 8, 3, '#338844');
  fillRect(ctx, x + 6, y + 5, 3, 2, '#ffff00');
  fillRect(ctx, x + 11, y + 5, 3, 2, '#ffff00');
  px(ctx, x + 7, y + 5, '#ff4400'); px(ctx, x + 12, y + 5, '#ff4400');
  fillRect(ctx, x + 8, y + 8, 4, 1, '#114422');
  px(ctx, x + 8, y + 8, '#88ff00'); px(ctx, x + 11, y + 8, '#88ff00');
  fillRect(ctx, x + 4, y + 9, 12, 5, '#1a4422');
  fillRect(ctx, x + 5, y + 10, 10, 3, '#226633');
  px(ctx, x + 3, y + 10, '#88ff00'); px(ctx, x + 16, y + 11, '#88ff00');
  px(ctx, x + 3, y + 12, '#88ff00'); px(ctx, x + 16, y + 9, '#88ff00');
  fillRect(ctx, x + 5, y + 14, 3, 4, '#1a4422');
  fillRect(ctx, x + 12, y + 14, 3, 4, '#1a4422');
  fillRect(ctx, x + 4, y + 17, 4, 2, '#114422');
  fillRect(ctx, x + 12, y + 17, 4, 2, '#114422');
  px(ctx, x + 9, y + 9, '#88ff00');
  px(ctx, x + 10, y + 10, '#66cc00');
}

// ---------------------------------------------------------------------------
// Canvas creation helper
// ---------------------------------------------------------------------------

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  // Disable image smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

// ---------------------------------------------------------------------------
// Main export — generates all upgraded sprites and registers as Phaser textures
// ---------------------------------------------------------------------------

export function generateUpgradedSprites(scene: Phaser.Scene): void {
  // --- Player characters ---

  // Vanguard: 32x42, draw offset (0, 1)
  {
    const [canvas, ctx] = createCanvas(32, 42);
    drawVanguard(ctx, 0, 1);
    scene.textures.addCanvas('player', canvas);
  }

  // Gunner: 40x42, draw offset (0, 1)
  {
    const [canvas, ctx] = createCanvas(40, 42);
    drawGunner(ctx, 0, 1);
    scene.textures.addCanvas('player-gunner', canvas);
  }

  // Wraith: 36x42, draw offset (4, 1) — left padding for daggers/particles
  {
    const [canvas, ctx] = createCanvas(36, 42);
    drawWraith(ctx, 4, 1);
    scene.textures.addCanvas('player-wraith', canvas);
  }

  // --- Enemies ---

  // Worker Bot (grunt): 20x18
  {
    const [canvas, ctx] = createCanvas(20, 18);
    drawWorkerBot(ctx, 0, 0);
    scene.textures.addCanvas('enemy-grunt', canvas);
  }

  // Slag Golem (ranged): 20x22
  {
    const [canvas, ctx] = createCanvas(20, 22);
    drawSlagGolem(ctx, 0, 0);
    scene.textures.addCanvas('enemy-ranged', canvas);
  }

  // Plant Creature (flyer): 20x22
  {
    const [canvas, ctx] = createCanvas(20, 22);
    drawPlantCreature(ctx, 0, 0);
    scene.textures.addCanvas('enemy-flyer', canvas);
  }

  // Skeleton: 20x22
  {
    const [canvas, ctx] = createCanvas(20, 22);
    drawSkeleton(ctx, 0, 0);
    scene.textures.addCanvas('enemy-skeleton', canvas);
  }

  // Ghost: 20x18
  {
    const [canvas, ctx] = createCanvas(20, 18);
    drawGhost(ctx, 0, 0);
    scene.textures.addCanvas('enemy-ghost', canvas);
  }

  // Bone Archer: 20x22
  {
    const [canvas, ctx] = createCanvas(20, 22);
    drawBoneArcher(ctx, 0, 0);
    scene.textures.addCanvas('enemy-bone-archer', canvas);
  }
}
