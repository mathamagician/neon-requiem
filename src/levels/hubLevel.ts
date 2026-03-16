/**
 * The Threshold — hub town.
 * A neon-lit sanctuary carved into ancient circuitry.
 * Safe zone with save crystal, shop NPC, and exits to zones.
 * Tile indices: 0=air, 1=solid, 2=platform, 3=accent wall
 */

const W = 40;
const H = 18;

export function createHubLevel(): number[][] {
  const level: number[][] = [];
  for (let y = 0; y < H; y++) {
    level[y] = new Array(W).fill(0);
  }

  // Ground floor (bottom 2 rows)
  for (let x = 0; x < W; x++) {
    level[H - 1][x] = 1;
    level[H - 2][x] = 1;
  }

  // Boundary walls (full height)
  for (let y = 0; y < H - 2; y++) {
    level[y][0] = 3;
    level[y][W - 1] = 3;
  }

  // Ceiling
  for (let x = 0; x < W; x++) {
    level[0][x] = 1;
  }

  // === Left wing — Cryptvault exit area ===
  // Stepped platform approach to left exit
  for (let x = 2; x < 5; x++) level[H - 4][x] = 2;   // low step
  for (let x = 5; x < 8; x++) level[H - 5][x] = 2;   // mid step
  // Neon archway framing the left exit
  for (let y = 2; y < H - 5; y++) level[y][1] = 3;
  level[2][2] = 3;
  level[2][3] = 3;

  // === Right wing — Foundry exit area ===
  // Stepped platform approach to right exit
  for (let x = 35; x < 38; x++) level[H - 4][x] = 2;  // low step
  for (let x = 32; x < 35; x++) level[H - 5][x] = 2;  // mid step
  // Neon archway framing the right exit
  for (let y = 2; y < H - 5; y++) level[y][W - 2] = 3;
  level[2][W - 3] = 3;
  level[2][W - 4] = 3;

  // === Central plaza — shop area (ground level) ===
  // Raised shop platform (solid) — shopkeeper stands here
  for (let x = 17; x < 23; x++) {
    level[H - 3][x] = 1;
  }
  // Accent trim on shop platform edges
  level[H - 4][17] = 3;
  level[H - 4][22] = 3;

  // === Upper walkway — spans the center for vertical exploration ===
  for (let x = 10; x < 30; x++) {
    level[H - 7][x] = 2;
  }
  // Access platforms to reach upper walkway
  for (let x = 7; x < 10; x++) level[H - 5][x] = 2;   // left ladder
  for (let x = 30; x < 33; x++) level[H - 5][x] = 2;  // right ladder

  // === Decorative pillars flanking the plaza ===
  const pillarPositions = [9, 12, 27, 30];
  for (const px of pillarPositions) {
    level[H - 3][px] = 3;
    level[H - 4][px] = 3;
    level[H - 5][px] = 3;
  }

  // === Upper alcove — hidden nook above the shop ===
  // Small platform accessible from the upper walkway
  for (let x = 18; x < 22; x++) {
    level[H - 10][x] = 2;
  }
  // Accent frame around the alcove
  level[H - 10][17] = 3;
  level[H - 10][22] = 3;
  level[H - 11][17] = 3;
  level[H - 11][22] = 3;

  // === Ceiling detail — vaulted arch effect ===
  // Indented ceiling gives a cathedral feel
  level[1][10] = 1;
  level[1][11] = 1;
  level[1][28] = 1;
  level[1][29] = 1;

  return level;
}
